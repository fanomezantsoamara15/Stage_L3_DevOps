from flask_mail import Message
from flask import current_app, render_template
from . import mail

def send_auth_code_email(recipient_email, student_name, auth_code):
    """
    Envoie un email avec le code d'authentification à l'étudiant
    
    Args:
        recipient_email (str): Email du destinataire
        student_name (str): Nom complet de l'étudiant
        auth_code (str): Code d'authentification à envoyer
    """
    try:
        subject = "Votre code d'authentification Quiz Connect"
        
        # Création du contenu de l'email
        html = f"""
        <html>
            <body>
                <h2>Bienvenue sur Quiz Connect, {student_name} !</h2>
                <p>Votre code d'authentification est :</p>
                <div style="font-size: 24px; font-weight: bold; margin: 20px 0;">
                    {auth_code}
                </div>
                <p>Utilisez ce code pour vous connecter à votre espace étudiant.</p>
                <p>Cordialement,<br>L'équipe Quiz Connect</p>
            </body>
        </html>
        """
        
        msg = Message(
            subject=subject,
            recipients=[recipient_email],
            html=html
        )
        
        mail.send(msg)
        print(f"Email envoyé avec succès à {recipient_email}")
        return True
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email à {recipient_email}: {str(e)}")
        return False

def send_password_reset_email(recipient_email, reset_token):
    """
    Envoie un email de réinitialisation de mot de passe
    
    Args:
        recipient_email (str): Email du destinataire
        reset_token (str): Jeton de réinitialisation
    """
    try:
        reset_url = f"http://votresite.com/reset-password?token={reset_token}"
        
        msg = Message(
            subject="Réinitialisation de votre mot de passe Quiz Connect",
            recipients=[recipient_email],
            html=f"""
            <p>Pour réinitialiser votre mot de passe, cliquez sur le lien ci-dessous :</p>
            <p><a href="{reset_url}">Réinitialiser mon mot de passe</a></p>
            <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
            """
        )
        
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email de réinitialisation: {str(e)}")
        return False
