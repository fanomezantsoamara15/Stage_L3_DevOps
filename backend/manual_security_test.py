#!/usr/bin/env python3
"""
Testeur manuel de sécurité - Simule différents téléchargeurs pour vérifier la protection
Usage: python manual_security_test.py [URL_BASE]
"""

import requests
import json
import sys
import time
import threading
from queue import Queue

class ManualSecurityTester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url.rstrip('/')
        self.log_queue = Queue()

    def log(self, message: str, level: str = "INFO"):
        """Ajoute un message au log"""
        timestamp = time.strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {level}: {message}"
        self.log_queue.put(log_message)
        print(log_message)

    def display_logs(self):
        """Affiche les logs en temps réel"""
        while True:
            try:
                message = self.log_queue.get(timeout=1)
                print(message)
                self.log_queue.task_done()
            except:
                break

    def test_single_user_agent(self, name: str, user_agent: str, expected_blocked: bool = True) -> bool:
        """Test un seul User-Agent"""
        self.log(f"🧪 Test de {name}...")

        headers = {'User-Agent': user_agent}
        test_file = "test.pdf"
        view_url = f"{self.base_url}/api/documents/{test_file}/view"

        try:
            response = requests.get(view_url, headers=headers, timeout=10)

            if expected_blocked:
                if response.status_code == 403:
                    self.log(f"✅ {name} correctement BLOQUÉ (HTTP {response.status_code})")
                    return True
                else:
                    self.log(f"❌ {name} aurait dû être BLOQUÉ mais a reçu HTTP {response.status_code}")
                    return False
            else:
                if response.status_code == 200:
                    self.log(f"✅ {name} correctement AUTORISÉ (HTTP {response.status_code})")
                    return True
                else:
                    self.log(f"❌ {name} aurait dû être AUTORISÉ mais a reçu HTTP {response.status_code}")
                    return False

        except requests.exceptions.Timeout:
            self.log(f"⏰ Timeout pour {name} - vérifiez si le serveur répond")
            return False
        except Exception as e:
            self.log(f"❌ Erreur pour {name}: {e}")
            return False

    def run_interactive_tests(self):
        """Lance des tests interactifs"""
        self.log("🎯 Mode test interactif démarré")
        self.log("Tapez 'quit' pour arrêter")

        # Démarrer l'affichage des logs en arrière-plan
        log_thread = threading.Thread(target=self.display_logs, daemon=True)
        log_thread.start()

        while True:
            try:
                cmd = input("\n🔍 Commande (help pour aide): ").strip().lower()

                if cmd == 'quit' or cmd == 'exit':
                    break

                elif cmd == 'help':
                    print("\n📋 Commandes disponibles:")
                    print("  test-idm        - Test Internet Download Manager")
                    print("  test-wget       - Test wget")
                    print("  test-curl       - Test curl")
                    print("  test-jdown      - Test JDownloader")
                    print("  test-chrome     - Test navigateur Chrome légitime")
                    print("  test-firefox    - Test navigateur Firefox légitime")
                    print("  test-custom     - Test User-Agent personnalisé")
                    print("  logs           - Afficher les derniers logs")
                    print("  help           - Cette aide")
                    print("  quit           - Quitter")

                elif cmd == 'test-idm':
                    self.test_single_user_agent(
                        "Internet Download Manager",
                        "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322) IDM/6.41",
                        expected_blocked=True
                    )

                elif cmd == 'test-wget':
                    self.test_single_user_agent(
                        "wget Linux",
                        "Wget/1.21.3 (linux-gnu)",
                        expected_blocked=True
                    )

                elif cmd == 'test-curl':
                    self.test_single_user_agent(
                        "cURL",
                        "curl/7.68.0",
                        expected_blocked=True
                    )

                elif cmd == 'test-jdown':
                    self.test_single_user_agent(
                        "JDownloader",
                        "JDownloader/2.0",
                        expected_blocked=True
                    )

                elif cmd == 'test-chrome':
                    self.test_single_user_agent(
                        "Google Chrome",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        expected_blocked=False
                    )

                elif cmd == 'test-firefox':
                    self.test_single_user_agent(
                        "Mozilla Firefox",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
                        expected_blocked=False
                    )

                elif cmd == 'test-custom':
                    ua = input("🔢 Entrez l'User-Agent à tester: ").strip()
                    if ua:
                        name = input("📝 Nom descriptif: ").strip() or "Custom UA"
                        expected = input("🚫 Doit être bloqué? (y/n): ").strip().lower() == 'y'

                        self.test_single_user_agent(name, ua, expected)

                elif cmd == 'logs':
                    print("\n📋 Instructions pour voir les logs:")
                    print("   docker-compose logs backend")
                    print("   # ou depuis le conteneur:")
                    print("   docker exec <container_id> tail -f /app/logs/security.log")

                else:
                    print("❓ Commande inconnue. Tapez 'help' pour voir les commandes disponibles.")

            except KeyboardInterrupt:
                break
            except Exception as e:
                self.log(f"❌ Erreur: {e}")

        self.log("👋 Test interactif terminé")

def main():
    """Fonction principale"""
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"

    print("🛡️ Testeur de Sécurité PDF - Mode Manuel"    print(f"🌐 URL de base: {base_url}")
    print("=" * 60)
    print("💡 Assurez-vous que:")
    print("   1. Les conteneurs Docker sont démarrés")
    print("   2. Le serveur répond sur le port 5000")
    print("   3. Un fichier test.pdf existe dans uploads/")
    print()

    tester = ManualSecurityTester(base_url)

    try:
        tester.run_interactive_tests()
    except KeyboardInterrupt:
        print("\n👋 Au revoir!")

if __name__ == "__main__":
    main()
