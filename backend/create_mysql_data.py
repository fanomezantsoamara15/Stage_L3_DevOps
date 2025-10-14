#!/usr/bin/env python3
"""
Script pour créer des données de test dans MySQL
"""

import os
from dotenv import load_dotenv

# Charger la configuration depuis config.env
load_dotenv('config.env')

from app import app, db, User, Quiz, Question, Result, Payment, Document
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def create_mysql_data():
    """Crée des données de test dans MySQL"""
    
    with app.app_context():
        print("🗑️  Initialisation de la base de données MySQL...")
        
        try:
            # Créer les tables
            db.create_all()
            print("✅ Tables MySQL créées")
        except Exception as e:
            print(f"❌ Erreur MySQL: {e}")
            return False
        
        print("👤 Création des utilisateurs de test...")
        
        # Créer un administrateur
        admin_password = generate_password_hash('admin123', method='pbkdf2:sha256')
        admin = User(
            username='admin',
            email='admin@test.com',
            password=admin_password,
            role='admin',
            telephone='0341234567',
            actif=True
        )
        db.session.add(admin)
        
        # Créer quelques étudiants
        students_data = [
            ('jean.dupont', 'jean.dupont@test.com', 'TEST2024001'),
            ('marie.martin', 'marie.martin@test.com', 'TEST2024002'),
            ('pierre.durand', 'pierre.durand@test.com', 'TEST2024003')
        ]
        
        for username, email, code in students_data:
            password_hash = generate_password_hash(code, method='pbkdf2:sha256')
            student = User(
                username=username,
                email=email,
                password=password_hash,
                role='student',
                telephone='0341111111',
                actif=True
            )
            db.session.add(student)
            print(f"   ✅ Étudiant: {username} - Code: {code}")
        
        db.session.commit()
        
        print("\n✅ Données MySQL créées avec succès !")
        print("\n" + "="*50)
        print("📋 COMPTES DE TEST MYSQL")
        print("="*50)
        print("👨‍💼 ADMIN: admin@test.com / admin123")
        print("👨‍🎓 ÉTUDIANTS:")
        for username, email, code in students_data:
            print(f"   {email} / {code}")
        print("="*50)
        
        return True

if __name__ == '__main__':
    success = create_mysql_data()
    if success:
        print("🎯 Prêt pour les tests avec MySQL !")
    else:
        print("❌ Échec de la création des données MySQL")
