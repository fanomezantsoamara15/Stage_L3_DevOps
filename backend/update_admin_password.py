from app import app, db, User
from werkzeug.security import generate_password_hash

def update_admin_password():
    with app.app_context():
        admin = User.query.filter_by(username='admin').first()
        if admin:
            admin.password = generate_password_hash('admin123', method='pbkdf2:sha256')
            db.session.commit()
            print("Mot de passe admin mis à jour avec succès!")
        else:
            print("L'utilisateur admin n'existe pas")

if __name__ == '__main__':
    update_admin_password()
