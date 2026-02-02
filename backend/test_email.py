import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


def send_test_email():

    api_key = os.getenv("SENDGRID_API_KEY")
    sender = os.getenv("MAIL_DEFAULT_SENDER")

    if not api_key:
        print("❌ SENDGRID_API_KEY manquant")
        return False

    if not sender:
        print("❌ MAIL_DEFAULT_SENDER manquant")
        return False

    message = Mail(
        from_email=sender,
        to_emails=sender,
        subject="Test Email Quiz Connect",
        html_content="""
        <h2>Test Email OK ✅</h2>
        <p>Envoi via SendGrid API réussi.</p>
        <p>Configuration Cloud correcte.</p>
        """
    )

    try:
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)

        print("✅ Email envoyé avec succès")
        print("Status:", response.status_code)

        return True

    except Exception as e:
        print("❌ Erreur SendGrid API:", str(e))
        return False


if __name__ == "__main__":

    print("🔍 Test SendGrid API")

    print("Sender:", os.getenv("MAIL_DEFAULT_SENDER"))

    print("⏳ Envoi en cours...")

    if send_test_email():
        print("✅ Test réussi — vérifie ta boîte mail")
    else:
        print("❌ Test échoué")
