# main.py - Point d'entrée principal
import os
from app import app
from db import db
from startup import wait_for_mysql

if __name__ == "__main__":
    # Attendre MySQL si disponible
    wait_for_mysql()
    
    # Créer les tables si elles n'existent pas
    with app.app_context():
        db.create_all()
    
    # Démarrer Flask
    print("🚀 Démarrage de l'application Flask...")
    app.run(host="0.0.0.0", port=5000, debug=False)