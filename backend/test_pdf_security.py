#!/usr/bin/env python3
"""
Testeur de sécurité PDF - Vérifie que la protection contre téléchargeurs fonctionne
Usage: python test_pdf_security.py [URL_BASE]
"""

import requests
import json
import sys
import time
from typing import List, Dict, Tuple

class PDFSecurityTester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url.rstrip('/')
        self.results = []

    def log(self, message: str, level: str = "INFO"):
        """Logger avec niveaux"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def test_download_manager_detection(self) -> Dict[str, any]:
        """Test la détection des téléchargeurs automatiques"""
        self.log("🧪 Test de détection des téléchargeurs automatiques...")

        # Liste des téléchargeurs à tester
        download_managers = [
            # Téléchargeurs populaires
            ("Internet Download Manager", "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322) IDM/6.41"),
            ("JDownloader", "JDownloader/2.0"),
            ("wget Linux", "Wget/1.21.3 (linux-gnu)"),
            ("wget Windows", "Wget/1.21.3 (mingw32)"),
            ("cURL", "curl/7.68.0"),
            ("Python Requests", "python-requests/2.25.1"),
            ("aria2", "aria2/1.36.0"),

            # Bots suspects
            ("SQLMap", "sqlmap/1.5.2#stable (http://sqlmap.org)"),
            ("Nikto Scanner", "Nikto/2.1.6"),
            ("Nmap NSE", "Nmap NSE 7.91"),
            ("Masscan", "masscan/1.3.2 (https://github.com/robertdavidgraham/masscan)"),
        ]

        # Navigateurs légitimes
        legitimate_browsers = [
            ("Chrome Desktop", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
            ("Firefox Desktop", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0"),
            ("Safari Desktop", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15"),
            ("Edge Desktop", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"),
        ]

        test_file = "test.pdf"
        view_url = f"{self.base_url}/api/documents/{test_file}/view"

        blocked_count = 0
        allowed_legitimate = 0

        # Test des téléchargeurs (devraient être bloqués)
        for name, user_agent in download_managers:
            try:
                headers = {'User-Agent': user_agent}
                response = requests.get(view_url, headers=headers, timeout=10)

                if response.status_code == 403:
                    self.log(f"✅ {name} BLOQUÉ correctement (HTTP {response.status_code})")
                    blocked_count += 1
                else:
                    self.log(f"❌ {name} PAS BLOQUÉ (HTTP {response.status_code}) - Attendu 403")

            except Exception as e:
                self.log(f"❌ Erreur test {name}: {e}")

        # Test des navigateurs légitimes (devraient être autorisés)
        for name, user_agent in legitimate_browsers:
            try:
                headers = {'User-Agent': user_agent}
                response = requests.get(view_url, headers=headers, timeout=10)

                if response.status_code == 200:
                    self.log(f"✅ {name} AUTORISÉ correctement (HTTP {response.status_code})")
                    allowed_legitimate += 1
                else:
                    self.log(f"❌ {name} BLOQUÉ à tort (HTTP {response.status_code}) - Attendu 200")

            except Exception as e:
                self.log(f"❌ Erreur test {name}: {e}")

        success = blocked_count == len(download_managers) and allowed_legitimate == len(legitimate_browsers)

        return {
            'test_name': 'Download Manager Detection',
            'success': success,
            'blocked_managers': blocked_count,
            'allowed_legitimate': allowed_legitimate,
            'total_tests': len(download_managers) + len(legitimate_browsers)
        }

    def test_pdf_view_interface(self) -> Dict[str, any]:
        """Test l'interface de visualisation PDF"""
        self.log("📄 Test de l'interface de visualisation PDF...")

        # Utiliser un navigateur légitime pour ce test
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

        test_file = "test.pdf"
        view_url = f"{self.base_url}/api/documents/{test_file}/view"

        try:
            response = requests.get(view_url, headers=headers, timeout=15)

            if response.status_code == 200:
                content = response.text

                # Vérifier les éléments clés de l'interface
                checks = [
                    ('PDF.js intégré', 'pdfjs' in content.lower()),
                    ('Protection JavaScript', 'contextmenu' in content and 'keydown' in content),
                    ('Interface moderne', 'visualiseur' in content.lower() or 'sécurisé' in content.lower()),
                    ('Bouton téléchargement', 'télécharger' in content.lower()),
                ]

                passed_checks = sum(1 for _, passed in checks if passed)

                if passed_checks >= 3:
                    self.log(f"✅ Interface PDF fonctionnelle ({passed_checks}/4 éléments vérifiés)")
                    return {
                        'test_name': 'PDF View Interface',
                        'success': True,
                        'checks_passed': passed_checks,
                        'total_checks': 4
                    }
                else:
                    self.log(f"❌ Interface PDF incomplète ({passed_checks}/4 éléments)")
                    return {
                        'test_name': 'PDF View Interface',
                        'success': False,
                        'checks_passed': passed_checks,
                        'total_checks': 4
                    }
            else:
                self.log(f"❌ Échec accès interface PDF (HTTP {response.status_code})")
                return {
                    'test_name': 'PDF View Interface',
                    'success': False,
                    'error': f'HTTP {response.status_code}'
                }

        except Exception as e:
            self.log(f"❌ Erreur test interface PDF: {e}")
            return {
                'test_name': 'PDF View Interface',
                'success': False,
                'error': str(e)
            }

    def test_security_logging(self) -> Dict[str, any]:
        """Test le système de logging de sécurité"""
        self.log("📊 Test du système de logging de sécurité...")

        # Test de l'endpoint de logging
        log_url = f"{self.base_url}/api/log/access"

        test_log_data = {
            'action': 'test_security_log',
            'filename': 'test.pdf',
            'user_agent': 'Test-Security-Monitor/1.0',
            'timestamp': time.time()
        }

        try:
            response = requests.post(log_url, json=test_log_data, timeout=10)

            if response.status_code == 200:
                self.log("✅ Logging de sécurité fonctionnel")
                return {
                    'test_name': 'Security Logging',
                    'success': True
                }
            else:
                self.log(f"❌ Échec logging sécurité (HTTP {response.status_code})")
                return {
                    'test_name': 'Security Logging',
                    'success': False,
                    'error': f'HTTP {response.status_code}'
                }

        except Exception as e:
            self.log(f"❌ Erreur test logging sécurité: {e}")
            return {
                'test_name': 'Security Logging',
                'success': False,
                'error': str(e)
            }

    def run_all_tests(self) -> Dict[str, any]:
        """Exécute tous les tests de sécurité"""
        self.log("🚀 Démarrage des tests de sécurité PDF...")

        tests = [
            self.test_download_manager_detection,
            self.test_pdf_view_interface,
            self.test_security_logging,
        ]

        results = []
        for test in tests:
            try:
                result = test()
                results.append(result)
            except Exception as e:
                self.log(f"❌ Erreur lors du test {test.__name__}: {e}")
                results.append({
                    'test_name': test.__name__,
                    'success': False,
                    'error': str(e)
                })

        # Calculer les statistiques
        passed = sum(1 for r in results if r.get('success', False))
        total = len(results)

        self.log("=" * 60)
        self.log("📋 RÉSUMÉ DES TESTS DE SÉCURITÉ")
        self.log("=" * 60)

        for result in results:
            status = "✅ RÉUSSI" if result.get('success') else "❌ ÉCHEC"
            self.log(f"{result['test_name']}: {status}")

            if 'error' in result:
                self.log(f"   Erreur: {result['error']}")

        self.log("-" * 60)
        self.log(f"RÉSULTATS GLOBAUX: {passed}/{total} tests réussis")

        if passed == total:
            self.log("🎉 Tous les tests de sécurité sont passés!")
        else:
            self.log("⚠️ Certains tests ont échoué - vérifiez la configuration")

        return {
            'summary': {
                'total_tests': total,
                'passed_tests': passed,
                'success_rate': passed / total if total > 0 else 0
            },
            'results': results
        }

def main():
    """Fonction principale"""
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"

    print(f"🛡️ Testeur de Sécurité PDF - URL: {base_url}")
    print("=" * 60)

    tester = PDFSecurityTester(base_url)
    results = tester.run_all_tests()

    # Sauvegarder les résultats
    try:
        with open('security_test_results.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print("💾 Résultats sauvegardés dans security_test_results.json")
    except Exception as e:
        print(f"❌ Erreur sauvegarde résultats: {e}")

    # Code de sortie
    success = results['summary']['success_rate'] == 1.0
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
