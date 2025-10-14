#!/usr/bin/env python3
"""
Script pour corriger les données de test et rendre la logique réaliste
Étape 1: Modifier les données existantes dans la base
"""
import os
import sys
from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import random
import string
from decimal import Decimal

# Charger les variables d'environnement
load_dotenv('config.env')

# Configuration Flask minimale pour accéder à la DB
app = Flask(__name__)

# Configuration de la base de données
try:
    mysql_uri = f"mysql+pymysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@{os.getenv('MYSQL_HOST')}/{os.getenv('MYSQL_DATABASE')}"
    app.config['SQLALCHEMY_DATABASE_URI'] = mysql_uri
except:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quiz_connect.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key')

db = SQLAlchemy(app)

# Modèles (copie des modèles de app.py)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    date_inscription = db.Column(db.DateTime, default=datetime.utcnow)
    telephone = db.Column(db.String(20))
    actif = db.Column(db.Boolean, default=False)
    code_auth = db.Column(db.String(10))

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    mode_paiement = db.Column(db.String(20), nullable=False)
    code_ref_mvola = db.Column(db.String(50))
    montant = db.Column(db.Float, nullable=False)
    statut = db.Column(db.String(20), default='en_attente')
    tranche_restante = db.Column(db.Float, default=0)
    date_paiement = db.Column(db.DateTime, default=datetime.utcnow)

def generate_mvola_code():
    """Génère un code MVola réaliste"""
    return f"MV{random.randint(100000, 999999)}{random.choice(['A', 'B', 'C', 'D'])}"

def fix_test_data():
    """Corrige les données de test pour une logique réaliste"""
    
    with app.app_context():
        print("=== ÉTAPE 1: Correction des données de test ===")
        
        # 1. Rendre tous les étudiants inactifs par défaut
        print("\n1. Désactivation de tous les étudiants...")
        students = User.query.filter_by(role='student').all()
        for student in students:
            student.actif = False
            print(f"   - {student.username} → INACTIF")
        
        # 2. Corriger les paiements pour avoir des codes MVola obligatoires
        print("\n2. Ajout des codes MVola manquants...")
        payments = Payment.query.all()
        for payment in payments:
            if payment.mode_paiement == 'mvola' and not payment.code_ref_mvola:
                payment.code_ref_mvola = generate_mvola_code()
                print(f"   - Paiement ID {payment.id} → Code MVola: {payment.code_ref_mvola}")
        
        # 3. Créer des scénarios réalistes
        print("\n3. Création de scénarios réalistes...")
        
        # Scénario A: Étudiant avec paiement en attente
        if len(students) > 0:
            student1 = students[0]
            payment1 = Payment.query.filter_by(user_id=student1.id).first()
            if payment1:
                payment1.statut = 'en_attente'
                payment1.montant = 50000  # Montant complet
                payment1.tranche_restante = 0
                if payment1.mode_paiement == 'mvola':
                    payment1.code_ref_mvola = generate_mvola_code()
                print(f"   - {student1.username}: Paiement EN ATTENTE (50000 Ar)")
        
        # Scénario B: Étudiant avec paiement validé (actif)
        if len(students) > 1:
            student2 = students[1]
            payment2 = Payment.query.filter_by(user_id=student2.id).first()
            if payment2:
                payment2.statut = 'complet'
                payment2.montant = 50000
                payment2.tranche_restante = 0
                student2.actif = True  # Activé car paiement validé
                if payment2.mode_paiement == 'mvola':
                    payment2.code_ref_mvola = generate_mvola_code()
                print(f"   - {student2.username}: Paiement COMPLET → ÉTUDIANT ACTIF")
        
        # Scénario C: Étudiant avec paiement partiel (actif)
        if len(students) > 2:
            student3 = students[2]
            payment3 = Payment.query.filter_by(user_id=student3.id).first()
            if payment3:
                payment3.statut = 'par_tranche'
                payment3.montant = 25000  # Paiement partiel
                payment3.tranche_restante = 25000  # Reste à payer
                student3.actif = True  # Activé avec accès partiel
                if payment3.mode_paiement == 'mvola':
                    payment3.code_ref_mvola = generate_mvola_code()
                print(f"   - {student3.username}: Paiement PARTIEL → ÉTUDIANT ACTIF (reste 25000 Ar)")
        
        # 4. Générer de nouveaux codes d'authentification pour les actifs
        print("\n4. Génération des codes d'authentification...")
        active_students = User.query.filter_by(role='student', actif=True).all()
        for student in active_students:
            # Générer un nouveau code d'authentification
            initials = f"{student.username[0].upper()}{student.username.split('.')[1][0].upper()}" if '.' in student.username else student.username[:2].upper()
            year = datetime.now().year
            random_num = random.randint(100, 999)
            new_code = f"{initials}{year}{random_num}"
            student.code_auth = new_code
            print(f"   - {student.username} → Nouveau code: {new_code}")
        
        # Sauvegarder les modifications
        try:
            db.session.commit()
            print("\n✅ ÉTAPE 1 TERMINÉE: Données de test corrigées avec succès!")
            
            # Afficher un résumé
            print("\n=== RÉSUMÉ ===")
            total_students = User.query.filter_by(role='student').count()
            active_students = User.query.filter_by(role='student', actif=True).count()
            inactive_students = total_students - active_students
            
            pending_payments = Payment.query.filter_by(statut='en_attente').count()
            complete_payments = Payment.query.filter_by(statut='complet').count()
            partial_payments = Payment.query.filter_by(statut='par_tranche').count()
            
            print(f"Étudiants: {total_students} total ({active_students} actifs, {inactive_students} inactifs)")
            print(f"Paiements: {pending_payments} en attente, {complete_payments} complets, {partial_payments} partiels")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erreur lors de la sauvegarde: {e}")
            return False

if __name__ == "__main__":
    success = fix_test_data()
    if success:
        print("\n🎯 Prêt pour l'étape 2: Correction des boutons dans l'interface")
    else:
        print("\n⚠️ Échec de l'étape 1, vérifiez les erreurs ci-dessus")
        sys.exit(1)
