#!/usr/bin/env python3
"""
Test rapide de sécurité - À exécuter dans le navigateur
Usage: python browser_security_test.py
"""

import webbrowser
import time
import sys
import os

def create_test_html():
    """Crée un fichier HTML de test pour le navigateur"""

    html_content = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test de Sécurité PDF</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #f5f5f5;
        }

        .container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .test-section {
            margin: 2rem 0;
            padding: 1rem;
            border-left: 4px solid #3498db;
            background: #f8f9fa;
            border-radius: 6px;
        }

        .test-button {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            margin: 0.5rem;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }

        .test-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
        }

        .test-button.blocked {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
        }

        .test-button.legitimate {
            background: linear-gradient(135deg, #2ecc71, #27ae60);
        }

        .result {
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 6px;
            font-family: monospace;
        }

        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }

        .warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .status-protected {
            background: #e74c3c;
            animation: pulse 2s infinite;
        }

        .status-allowed {
            background: #2ecc71;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .ua-display {
            background: #f8f9fa;
            padding: 0.5rem;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.8rem;
            margin: 0.5rem 0;
            border-left: 3px solid #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Testeur de Sécurité PDF</h1>
        <p>Testez la protection contre les téléchargeurs automatiques directement dans votre navigateur.</p>

        <div class="test-section">
            <h3>📊 État de la Sécurité</h3>
            <p>
                <span class="status-indicator status-protected"></span>
                <strong>Protection activée</strong> - Les téléchargeurs automatiques devraient être bloqués
            </p>
            <div class="ua-display">
                Votre User-Agent actuel: <span id="currentUA"></span>
            </div>
        </div>

        <div class="test-section">
            <h3>🚫 Tests - Téléchargeurs à Bloquer</h3>
            <p>Ces téléchargeurs devraient être <strong>bloqués</strong> (HTTP 403).</p>

            <button class="test-button blocked" onclick="testUserAgent('IDM/6.41 Build 2', true)">
                🛑 Test Internet Download Manager (IDM)
            </button>

            <button class="test-button blocked" onclick="testUserAgent('Wget/1.21.3 (linux-gnu)', true)">
                🛑 Test wget
            </button>

            <button class="test-button blocked" onclick="testUserAgent('curl/7.68.0', true)">
                🛑 Test cURL
            </button>

            <button class="test-button blocked" onclick="testUserAgent('JDownloader/2.0', true)">
                🛑 Test JDownloader
            </button>

            <button class="test-button blocked" onclick="testUserAgent('python-requests/2.25.1', true)">
                🛑 Test Python Requests
            </button>
        </div>

        <div class="test-section">
            <h3>✅ Tests - Navigateurs Légitimes</h3>
            <p>Ces navigateurs devraient être <strong>autorisés</strong> (HTTP 200).</p>

            <button class="test-button legitimate" onclick="testUserAgent(navigator.userAgent, false)">
                🌐 Test votre navigateur actuel
            </button>

            <button class="test-button legitimate" onclick="testUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', false)">
                🌐 Test Google Chrome
            </button>

            <button class="test-button legitimate" onclick="testUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0', false)">
                🌐 Test Mozilla Firefox
            </button>
        </div>

        <div class="test-section">
            <h3>🔧 Test Personnalisé</h3>
            <input type="text" id="customUA" placeholder="Entrez un User-Agent personnalisé" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0; border: 1px solid #ddd; border-radius: 4px;">
            <button class="test-button" onclick="testCustomUserAgent()">
                🧪 Tester cet User-Agent
            </button>
        </div>

        <div class="test-section">
            <h3>📋 Résultats des Tests</h3>
            <div id="results"></div>
        </div>

        <div class="test-section" style="text-align: center; margin-top: 2rem;">
            <h3>🔍 Comment voir les logs ?</h3>
            <p>Pour diagnostiquer les problèmes, consultez les logs du serveur :</p>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                <code>docker-compose logs backend</code>
            </div>
            <p>Les logs détaillés vous montreront :</p>
            <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                <li>🔍 Analyse de chaque User-Agent</li>
                <li>🚫 Téléchargeurs détectés et bloqués</li>
                <li>✅ User-Agents autorisés</li>
                <li>❌ Erreurs et problèmes</li>
            </ul>
        </div>
    </div>

    <script>
        // Configuration
        const BASE_URL = window.location.origin;

        // Afficher l'User-Agent actuel
        document.getElementById('currentUA').textContent = navigator.userAgent;

        async function testUserAgent(userAgent, shouldBeBlocked) {
            const filename = 'test.pdf';
            const url = `${BASE_URL}/api/documents/${filename}/view`;

            const resultDiv = document.createElement('div');
            resultDiv.className = 'result';

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': userAgent
                    }
                });

                const status = response.status;
                const isBlocked = status === 403;
                const isAllowed = status === 200;

                if (shouldBeBlocked && isBlocked) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = `
                        <strong>✅ BLOQUÉ correctement</strong><br>
                        User-Agent: ${userAgent.substring(0, 50)}...<br>
                        Status: HTTP ${status}
                    `;
                } else if (!shouldBeBlocked && isAllowed) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = `
                        <strong>✅ AUTORISÉ correctement</strong><br>
                        User-Agent: ${userAgent.substring(0, 50)}...<br>
                        Status: HTTP ${status}
                    `;
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = `
                        <strong>❌ Résultat inattendu</strong><br>
                        User-Agent: ${userAgent.substring(0, 50)}...<br>
                        Status: HTTP ${status}<br>
                        Attendu: ${shouldBeBlocked ? 'BLOQUÉ (403)' : 'AUTORISÉ (200)'}
                    `;
                }

            } catch (error) {
                resultDiv.className = 'result warning';
                resultDiv.innerHTML = `
                    <strong>⚠️ Erreur de connexion</strong><br>
                    User-Agent: ${userAgent.substring(0, 50)}...<br>
                    Erreur: ${error.message}
                `;
            }

            document.getElementById('results').prepend(resultDiv);
        }

        async function testCustomUserAgent() {
            const customUAInput = document.getElementById('customUA');
            const userAgent = customUAInput.value.trim();

            if (!userAgent) {
                alert('Veuillez entrer un User-Agent à tester.');
                return;
            }

            // Demander si cet UA devrait être bloqué
            const shouldBeBlocked = confirm(`Cet User-Agent devrait-il être bloqué?\n\n${userAgent}\n\nCliquez sur OK pour "OUI, bloquer" ou Annuler pour "NON, autoriser"`);

            await testUserAgent(userAgent, shouldBeBlocked);
            customUAInput.value = ''; // Vider le champ après le test
        }

        // Test automatique au chargement de la page
        window.addEventListener('load', async function() {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result info';
            resultDiv.innerHTML = `
                <strong>ℹ️ Page chargée</strong><br>
                Test automatique de votre navigateur en cours...
            `;
            document.getElementById('results').prepend(resultDiv);

            // Petit délai pour laisser la page se charger
            setTimeout(async () => {
                await testUserAgent(navigator.userAgent, false);
            }, 1000);
        });

        console.log('🔒 Testeur de sécurité PDF chargé');
        console.log('📊 User-Agent actuel:', navigator.userAgent);
    </script>
</body>
</html>
"""

    try:
        with open('browser_security_test.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        print("✅ Fichier browser_security_test.html créé")
        return True
    except Exception as e:
        print(f"❌ Erreur création fichier HTML: {e}")
        return False

def main():
    """Fonction principale"""
    print("🌐 Création du testeur de sécurité pour navigateur...")

    if create_test_html():
        print("🎉 Testeur créé avec succès!")
        print("\n📋 Instructions:")
        print("1. Démarrez vos conteneurs Docker")
        print("2. Ouvrez browser_security_test.html dans votre navigateur")
        print("3. Testez différents téléchargeurs automatiques")
        print("4. Consultez les logs avec: docker-compose logs backend")
        print("\n🔍 Le fichier HTML contient:")
        print("   - Tests automatisés pour téléchargeurs connus")
        print("   - Tests pour navigateurs légitimes")
        print("   - Test personnalisé d'User-Agent")
        print("   - Affichage temps réel des résultats")
        print("\n💡 Cela vous permettra de voir exactement pourquoi")
        print("   la sécurisation n'a pas marché comme attendu.")

        # Ouvrir automatiquement le fichier si possible
        try:
            webbrowser.open('file://' + os.path.abspath('browser_security_test.html'))
            print("\n🚀 Fichier ouvert automatiquement dans le navigateur")
        except:
            print("\n📂 Ouvrez manuellement: browser_security_test.html")

    return True

if __name__ == "__main__":
    main()
