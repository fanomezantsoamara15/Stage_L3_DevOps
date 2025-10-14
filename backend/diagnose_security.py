#!/usr/bin/env python3
"""
Script de diagnostic complet pour la sécurité PDF
Usage: python diagnose_security.py
"""

import os
import sys
import json
import time
import requests
from pathlib import Path

def log(message: str, level: str = "INFO"):
    """Logger simple"""
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def check_docker_containers():
    """Vérifie si les conteneurs Docker sont démarrés"""
    log("🐳 Vérification des conteneurs Docker...")

    try:
        result = os.popen("docker-compose ps -q").read().strip()
        containers = result.split('\n') if result else []

        if len(containers) >= 2 and all(containers):
            log(f"✅ {len(containers)} conteneurs démarrés")
            return True
        else:
            log(f"❌ Conteneurs non démarrés. Lancez: docker-compose up --build")
            return False
    except Exception as e:
        log(f"❌ Erreur vérification Docker: {e}")
        return False

def create_test_pdf():
    """Crée un fichier PDF de test"""
    log("📄 Création du fichier PDF de test...")

    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)

    test_pdf = uploads_dir / "test.pdf"

    # Créer un PDF simple avec Python (nécessite reportlab)
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter

        c = canvas.Canvas(str(test_pdf), pagesize=letter)
        c.drawString(100, 750, "Document de Test - Sécurité PDF")
        c.drawString(100, 730, "Ce fichier teste la protection contre les téléchargeurs automatiques.")
        c.drawString(100, 710, f"Créé le: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        c.drawString(100, 690, "Si vous voyez ce message, la visualisation fonctionne!")
        c.save()

        log(f"✅ PDF de test créé: {test_pdf} ({test_pdf.stat().st_size} bytes)")
        return True

    except ImportError:
        log("⚠️ ReportLab non installé, création d'un fichier texte à la place...")

        # Créer un fichier texte simple
        with open(test_pdf, 'w', encoding='utf-8') as f:
            f.write("DOCUMENT DE TEST\n")
            f.write("================\n\n")
            f.write("Ce fichier teste la protection contre les téléchargeurs automatiques.\n")
            f.write(f"Créé le: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("Si vous voyez ce message, la visualisation fonctionne!\n")

        log(f"✅ Fichier de test créé: {test_pdf}")
        return True

    except Exception as e:
        log(f"❌ Erreur création PDF de test: {e}")
        return False

def test_basic_connectivity():
    """Test la connectivité de base"""
    log("🌐 Test de connectivité de base...")

    try:
        response = requests.get("http://localhost:5000/", timeout=10)
        if response.status_code == 200:
            log(f"✅ Serveur accessible (HTTP {response.status_code})")
            return True
        else:
            log(f"❌ Serveur répond mais erreur (HTTP {response.status_code})")
            return False
    except requests.exceptions.ConnectionError:
        log("❌ Impossible de se connecter au serveur")
        log("   Lancez: docker-compose up --build")
        return False
    except Exception as e:
        log(f"❌ Erreur de connexion: {e}")
        return False

def run_security_diagnosis():
    """Diagnostic complet de sécurité"""
    log("🔍 Démarrage du diagnostic de sécurité...")

    checks = []

    # 1. Vérifier Docker
    checks.append(("Docker containers", check_docker_containers()))

    # 2. Créer PDF de test
    checks.append(("Test PDF creation", create_test_pdf()))

    # 3. Test connectivité
    checks.append(("Basic connectivity", test_basic_connectivity()))

    # 4. Vérifier les fichiers de sécurité
    security_files = [
        "static/pdf-viewer.html",
        "security_monitor.py",
        "security_config.py",
        "test_pdf_security.py"
    ]

    for file in security_files:
        exists = os.path.exists(file)
        checks.append((f"Security file: {file}", exists))
        if not exists:
            log(f"❌ Fichier manquant: {file}")

    # Résumé
    passed = sum(1 for _, result in checks if result)
    total = len(checks)

    log("=" * 60)
    log("📋 RÉSUMÉ DU DIAGNOSTIC")
    log("=" * 60)

    for check_name, result in checks:
        status = "✅ OK" if result else "❌ ÉCHEC"
        log(f"{check_name}: {status}")

    log("-" * 60)
    log(f"RÉSULTATS: {passed}/{total} vérifications réussies")

    if passed == total:
        log("🎉 Diagnostic réussi - système prêt pour les tests!")
        return True
    else:
        log("⚠️ Certains problèmes détectés - consultez les logs")
        return False

def main():
    """Fonction principale"""
    print("🛡️ DIAGNOSTIC DE SÉCURITÉ PDF")
    print("=" * 60)

    success = run_security_diagnosis()

    if success:
        print("\n🚀 PROCHAINES ÉTAPES:")
        print("1. Consultez les logs en temps réel:")
        print("   docker-compose logs backend -f")
        print("\n2. Testez manuellement dans le navigateur:")
        print("   http://localhost:5000/static/pdf-viewer.html?file=test.pdf")
        print("\n3. Lancez les tests automatisés:")
        print("   python test_pdf_security.py")
        print("\n4. Testez différents téléchargeurs:")
        print("   python manual_security_test.py")
        print("\n💡 Les logs détaillés vous montreront exactement")
        print("   pourquoi la sécurisation n'a pas marché comme attendu.")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
