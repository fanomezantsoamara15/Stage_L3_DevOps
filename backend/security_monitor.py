#!/usr/bin/env python3
"""
Script de monitoring de sécurité pour détecter les téléchargeurs automatiques
Usage: python security_monitor.py [options]
"""

import json
import sys
import time
import logging
from collections import defaultdict, deque
from datetime import datetime, timedelta

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('security_monitor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

class SecurityMonitor:
    def __init__(self):
        self.alerts = deque(maxlen=1000)  # Dernières 1000 alertes
        self.ip_tracking = defaultdict(list)  # Suivi par IP
        self.ua_tracking = defaultdict(list)  # Suivi par User-Agent
        self.violation_counts = defaultdict(int)  # Compteur de violations

        # Seuils d'alerte
        self.THRESHOLDS = {
            'max_requests_per_minute': 10,
            'max_violations_per_hour': 5,
            'suspicious_patterns': 3
        }

    def log_access_attempt(self, log_entry):
        """Analyse une tentative d'accès"""
        ip = log_entry.get('ip', 'unknown')
        user_agent = log_entry.get('user_agent', '')
        filename = log_entry.get('filename', 'unknown')
        violations = log_entry.get('violations', 0)

        # Tracker l'IP
        self.ip_tracking[ip].append(datetime.utcnow())

        # Tracker l'User-Agent
        ua_key = self._normalize_user_agent(user_agent)
        if ua_key:
            self.ua_tracking[ua_key].append(datetime.utcnow())

        # Compter les violations
        if violations > 0:
            self.violation_counts[ip] += violations

        # Nettoyer les anciennes entrées (plus vieilles que 1 heure)
        self._cleanup_old_entries()

        # Analyser et générer des alertes
        self._analyze_and_alert(log_entry)

    def _normalize_user_agent(self, ua):
        """Normalise l'User-Agent pour le tracking"""
        ua_lower = ua.lower()
        if any(blocked in ua_lower for blocked in [
            'bot', 'spider', 'crawler', 'scraper',
            'wget', 'curl', 'aria2', 'axel'
        ]):
            return ua_lower[:50]  # Tronquer pour éviter les très longs UA
        return None

    def _cleanup_old_entries(self):
        """Nettoie les entrées plus vieilles que 1 heure"""
        cutoff_time = datetime.utcnow() - timedelta(hours=1)

        for ip in list(self.ip_tracking.keys()):
            self.ip_tracking[ip] = [
                timestamp for timestamp in self.ip_tracking[ip]
                if timestamp > cutoff_time
            ]
            if not self.ip_tracking[ip]:
                del self.ip_tracking[ip]

        for ua in list(self.ua_tracking.keys()):
            self.ua_tracking[ua] = [
                timestamp for timestamp in self.ua_tracking[ua]
                if timestamp > cutoff_time
            ]
            if not self.ua_tracking[ua]:
                del self.ua_tracking[ua]

    def _analyze_and_alert(self, log_entry):
        """Analyse les patterns suspects et génère des alertes"""
        ip = log_entry.get('ip', 'unknown')
        user_agent = log_entry.get('user_agent', '')
        violations = log_entry.get('violations', 0)

        alerts = []

        # 1. Vérifier les violations de sécurité
        if violations > 0:
            alert = {
                'type': 'SECURITY_VIOLATION',
                'severity': 'HIGH' if violations >= 3 else 'MEDIUM',
                'message': f'Violations de sécurité détectées: {violations}',
                'ip': ip,
                'user_agent': user_agent[:100],
                'timestamp': datetime.utcnow().isoformat()
            }
            alerts.append(alert)

        # 2. Vérifier les téléchargeurs automatiques
        if self._is_download_manager(user_agent):
            alert = {
                'type': 'DOWNLOAD_MANAGER_DETECTED',
                'severity': 'HIGH',
                'message': 'Téléchargeur automatique détecté',
                'ip': ip,
                'user_agent': user_agent[:100],
                'timestamp': datetime.utcnow().isoformat()
            }
            alerts.append(alert)

        # 3. Vérifier les pics de trafic suspects
        recent_requests = len([t for t in self.ip_tracking[ip] if t > datetime.utcnow() - timedelta(minutes=1)])
        if recent_requests > self.THRESHOLDS['max_requests_per_minute']:
            alert = {
                'type': 'TRAFFIC_SPIKE',
                'severity': 'MEDIUM',
                'message': f'Pic de trafic détecté: {recent_requests} req/min',
                'ip': ip,
                'requests_per_minute': recent_requests,
                'timestamp': datetime.utcnow().isoformat()
            }
            alerts.append(alert)

        # 4. Vérifier les violations répétées
        if self.violation_counts[ip] > self.THRESHOLDS['max_violations_per_hour']:
            alert = {
                'type': 'REPEATED_VIOLATIONS',
                'severity': 'CRITICAL',
                'message': f'Violations répétées: {self.violation_counts[ip]}',
                'ip': ip,
                'total_violations': self.violation_counts[ip],
                'timestamp': datetime.utcnow().isoformat()
            }
            alerts.append(alert)

        # Ajouter les alertes à la file d'attente
        for alert in alerts:
            self.alerts.append(alert)
            logging.warning(f"ALERTE SÉCURITÉ: {alert}")

    def _is_download_manager(self, user_agent):
        """Détecte si l'User-Agent correspond à un téléchargeur automatique"""
        dm_patterns = [
            'internet download manager', 'idm', 'jdownloader',
            'wget', 'curl', 'aria2', 'axel', 'flashget',
            'eagleget', 'orbit downloader', 'free download manager'
        ]

        ua_lower = user_agent.lower()
        return any(pattern in ua_lower for pattern in dm_patterns)

    def generate_report(self):
        """Génère un rapport de sécurité"""
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'total_alerts': len(self.alerts),
            'unique_ips': len(self.ip_tracking),
            'unique_downloaders': len(self.ua_tracking),
            'top_violators': dict(list(self.violation_counts.most_common(10))),
            'recent_alerts': list(self.alerts)[-10:],  # Dernières 10 alertes
            'recommendations': self._generate_recommendations()
        }

        return report

    def _generate_recommendations(self):
        """Génère des recommandations de sécurité"""
        recommendations = []

        if len(self.ua_tracking) > 5:
            recommendations.append({
                'priority': 'HIGH',
                'message': f'{len(self.ua_tracking)} téléchargeurs détectés - envisager un blocage IP',
                'action': 'BLOCK_SUSPICIOUS_UA'
            })

        if any(count > 10 for count in self.violation_counts.values()):
            recommendations.append({
                'priority': 'CRITICAL',
                'message': 'Violations répétées détectées - renforcer la protection',
                'action': 'STRENGTHEN_SECURITY'
            })

        if len(self.alerts) > 50:
            recommendations.append({
                'priority': 'MEDIUM',
                'message': 'Activité suspecte élevée - surveiller de près',
                'action': 'INCREASE_MONITORING'
            })

        return recommendations

    def save_report(self, filename='security_report.json'):
        """Sauvegarde le rapport dans un fichier"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.generate_report(), f, indent=2, ensure_ascii=False)
            logging.info(f"Rapport de sécurité sauvegardé dans {filename}")
        except Exception as e:
            logging.error(f"Erreur lors de la sauvegarde du rapport: {e}")

# Exemple d'utilisation
if __name__ == "__main__":
    monitor = SecurityMonitor()

    # Exemple de données de test
    test_logs = [
        {
            'ip': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'filename': 'document.pdf',
            'violations': 0
        },
        {
            'ip': '192.168.1.101',
            'user_agent': 'IDM/6.41 Build 2',
            'filename': 'document.pdf',
            'violations': 3
        },
        {
            'ip': '192.168.1.100',
            'user_agent': 'wget/1.21.3',
            'filename': 'document.pdf',
            'violations': 1
        }
    ]

    # Analyser les logs de test
    for log_entry in test_logs:
        monitor.log_access_attempt(log_entry)

    # Générer et afficher le rapport
    report = monitor.generate_report()
    print("\n" + "="*50)
    print("RAPPORT DE SÉCURITÉ")
    print("="*50)
    print(json.dumps(report, indent=2, ensure_ascii=False))

    # Sauvegarder le rapport
    monitor.save_report()
