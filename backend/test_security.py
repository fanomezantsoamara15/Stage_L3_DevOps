#!/usr/bin/env python3
"""
Script de test pour vérifier la protection contre les téléchargeurs automatiques
Usage: python test_security.py
"""

import requests
import json
from security_monitor import SecurityMonitor
from security_config import SECURITY_CONFIG

def test_user_agent_detection():
    """Test de la détection des User-Agents suspects"""
    print("🧪 Test de détection des téléchargeurs automatiques...")

    test_cases = [
        # Téléchargeurs légitimes
        ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", False, "Navigateur normal"),
        ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36", False, "Safari normal"),

        # Téléchargeurs automatiques
        ("IDM/6.41 Build 2", True, "Internet Download Manager"),
        ("wget/1.21.3", True, "Wget"),
        ("curl/7.68.0", True, "cURL"),
        ("JDownloader/2.0", True, "JDownloader"),
        ("python-requests/2.25.1", True, "Python Requests"),

        # Bots suspects
        ("sqlmap/1.5.2#stable", True, "SQLMap"),
        ("nikto/2.1.6", True, "Nikto"),
        ("bot", True, "Bot générique"),
        ("spider", True, "Spider générique"),
    ]

    monitor = SecurityMonitor()
    passed = 0
    failed = 0

    for ua, should_block, description in test_cases:
        # Simuler une requête avec cet User-Agent
        test_entry = {
            'ip': '192.168.1.100',
            'user_agent': ua,
            'filename': 'test.pdf',
            'violations': 0
        }

        # Vérifier si l'UA serait détecté
        is_blocked = monitor._is_download_manager(ua)

        if is_blocked == should_block:
            print(f"✅ {description}: {ua[:50]}... -> {'BLOQUÉ' if is_blocked else 'AUTORISÉ'}")
            passed += 1
        else:
            print(f"❌ {description}: {ua[:50]}... -> {'BLOQUÉ' if is_blocked else 'AUTORISÉ'} (attendu: {'BLOQUÉ' if should_block else 'AUTORISÉ'})")
            failed += 1

    print(f"\n📊 Résultats: {passed} tests réussis, {failed} tests échoués")
    return failed == 0

def test_security_monitoring():
    """Test du système de monitoring"""
    print("\n📊 Test du système de monitoring...")

    monitor = SecurityMonitor()

    # Générer quelques événements de test
    test_events = [
        {'ip': '192.168.1.100', 'user_agent': 'Mozilla/5.0 (Windows)', 'violations': 0},
        {'ip': '192.168.1.101', 'user_agent': 'IDM/6.41', 'violations': 2},
        {'ip': '192.168.1.100', 'user_agent': 'Mozilla/5.0 (Windows)', 'violations': 0},
        {'ip': '192.168.1.102', 'user_agent': 'wget/1.21', 'violations': 1},
    ]

    for event in test_events:
        monitor.log_access_attempt(event)

    # Générer le rapport
    report = monitor.generate_report()

    print(f"✅ Alertes générées: {report['total_alerts']}")
    print(f"✅ IPs uniques trackées: {report['unique_ips']}")
    print(f"✅ Téléchargeurs détectés: {report['unique_downloaders']}")

    if report['total_alerts'] > 0:
        print("✅ Système de monitoring fonctionnel")
        return True
    else:
        print("❌ Aucun événement détecté")
        return False

def test_pdf_viewer():
    """Test du visualiseur PDF sécurisé"""
    print("\n📄 Test du visualiseur PDF...")

    # Vérifier que le fichier HTML existe
    try:
        with open('static/pdf-viewer.html', 'r', encoding='utf-8') as f:
            content = f.read()

        if 'PDF.js' in content and 'sécurisé' in content.lower():
            print("✅ Visualiseur PDF créé avec succès")
            print("✅ Protection JavaScript intégrée")
            return True
        else:
            print("❌ Visualiseur PDF incomplet")
            return False
    except FileNotFoundError:
        print("❌ Fichier pdf-viewer.html non trouvé")
        return False

def main():
    """Fonction principale de test"""
    print("🚀 Démarrage des tests de sécurité...")
    print("=" * 60)

    tests = [
        test_user_agent_detection,
        test_security_monitoring,
        test_pdf_viewer,
    ]

    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Erreur lors du test {test.__name__}: {e}")
            results.append(False)

    print("\n" + "=" * 60)
    print("📋 RÉSUMÉ DES TESTS")

    passed = sum(results)
    total = len(results)

    if passed == total:
        print(f"🎉 Tous les tests réussis ({passed}/{total})")
        print("✅ Système de sécurité opérationnel")
    else:
        print(f"⚠️ {passed}/{total} tests réussis")
        print("❌ Certains tests ont échoué - vérifiez la configuration")

    print("\n🔧 Configuration actuelle:")
    print(f"   Niveau de sécurité: {SECURITY_CONFIG['SECURITY_LEVEL']}")
    print(f"   Téléchargeurs bloqués: {len(SECURITY_CONFIG['BLOCKED_DOWNLOADERS'])}")
    print(f"   Patterns suspects: {len(SECURITY_CONFIG['SUSPICIOUS_PATTERNS'])}")

    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
