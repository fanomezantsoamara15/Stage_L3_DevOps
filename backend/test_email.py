import os
from dotenv import load_dotenv
from flask import Flask
from flask_mail import Mail, Message

# Charger les variables d'environnement
load_dotenv('config.env')

app = Flask(__name__)

# Configuration de Flask-Mail
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

# Initialiser Flask-Mail
mail = Mail(app)

def send_test_email():
    try:
        with app.app_context():
            msg = Message(
                "Test d'envoi d'email depuis Quiz Connect",
                recipients=[os.getenv('MAIL_DEFAULT_SENDER')],  # Envoyer à vous-même pour le test
                body="Ceci est un email de test pour vérifier la configuration SMTP.",
                html="""
                <html>
                    <body>
                        <h2>Test d'envoi d'email</h2>
                        <p>Ceci est un email de test pour vérifier la configuration SMTP de Quiz Connect.</p>
                        <p>Si vous recevez cet email, cela signifie que la configuration est correcte !</p>
                    </body>
                </html>
                """
            )
            
            mail.send(msg)
            print("✅ Email de test envoyé avec succès!")
            print(f"Destinataire: {os.getenv('MAIL_DEFAULT_SENDER')}")
            return True
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de l'email: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔍 Test de configuration SMTP...")
    print(f"Serveur: {app.config['MAIL_SERVER']}:{app.config['MAIL_PORT']}")
    print(f"Utilisateur: {app.config['MAIL_USERNAME']}")
    print("Tentative d'envoi d'un email de test...")
    
    if send_test_email():
        print("✅ Test réussi! Vérifiez votre boîte de réception (et les spams).")
    else:
        print("❌ Le test a échoué. Vérifiez les logs pour plus d'informations.")
