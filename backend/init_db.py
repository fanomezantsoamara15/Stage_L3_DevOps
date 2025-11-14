from app import app, db, User
from werkzeug.security import generate_password_hash

def init_db():
    with app.app_context():
        # Créer toutes les tables
        db.create_all()

        # Vérifier si l'admin existe déjà
        if not User.query.filter_by(username='adminresponsable').first():
            # Créer un utilisateur admin par défaut
            admin = User(
                username='adminresponsable',
                email='admin@responsable.com',
                password=generate_password_hash('admin123', method='pbkdf2:sha256'),
                role='admin',
                actif=True
            )
            # Ajouter l'admin à la base de données
            db.session.add(admin)
            db.session.commit()
            print("Utilisateur admin créé avec succès!")
        else:
            print("L'utilisateur admin existe déjà")

        print("Base de données initialisée avec succès!")

if __name__ == '__main__':
    init_db()