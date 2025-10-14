#!/usr/bin/env python3
"""
Script de test simple pour créer des données de base
"""

import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta

# Configuration simple
app = Flask(__name__)
app.config['SECRET_KEY'] = 'test-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Modèles simplifiés
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    date_inscription = db.Column(db.DateTime, default=datetime.utcnow)
    telephone = db.Column(db.String(20))
    actif = db.Column(db.Boolean, default=True)

def create_simple_data():
    """Crée des données de test simples"""
    
    with app.app_context():
        print("🗑️  Création de la base de données...")
        
        # Créer les tables
        db.create_all()
        
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
        students = [
            ('jean.dupont', 'jean.dupont@test.com', 'TEST2024001'),
            ('marie.martin', 'marie.martin@test.com', 'TEST2024002'),
            ('pierre.durand', 'pierre.durand@test.com', 'TEST2024003')
        ]
        
        for username, email, code in students:
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
        
        print("\n✅ Données de test créées avec succès !")
        print("\n" + "="*50)
        print("📋 COMPTES DE TEST")
        print("="*50)
        print("👨‍💼 ADMIN: admin@test.com / admin123")
        print("👨‍🎓 ÉTUDIANTS:")
        for username, email, code in students:
            print(f"   {email} / {code}")
        print("="*50)

if __name__ == '__main__':
    create_simple_data()
