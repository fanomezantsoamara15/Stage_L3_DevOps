#!/usr/bin/env python3
"""
Script pour ajouter des données de paiements de test dans MySQL
"""

import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

# Charger la configuration depuis config.env
load_dotenv('config.env')

from app import app, db, User, Payment
from werkzeug.security import generate_password_hash

def add_payments_data():
    """Ajoute des données de paiements de test dans MySQL"""
    
    with app.app_context():
        print("💰 Ajout des paiements de test...")
        
        try:
            # Récupérer les étudiants existants
            students = User.query.filter_by(role='student').all()
            
            if not students:
                print("❌ Aucun étudiant trouvé")
                return False
            
            # Créer des paiements pour chaque étudiant
            for student in students:
                # Paiement 1 - Tranche 1
                payment1 = Payment(
                    user_id=student.id,
                    mode_paiement='mvola',
                    montant=500.0,
                    date_paiement=datetime.now() - timedelta(days=30),
                    statut='paye',
                    tranche_restante=500.0
                )
                db.session.add(payment1)
                
                # Paiement 2 - Tranche 2 (pour certains étudiants)
                if random.choice([True, False]):
                    payment2 = Payment(
                        user_id=student.id,
                        mode_paiement='orange_money',
                        montant=300.0,
                        date_paiement=datetime.now() - timedelta(days=15),
                        statut='paye',
                        tranche_restante=200.0
                    )
                    db.session.add(payment2)
                
                print(f"   ✅ Paiements créés pour: {student.username}")
            
            db.session.commit()
            
            # Vérifier les paiements créés
            total_payments = Payment.query.count()
            print(f"\n✅ {total_payments} paiements créés avec succès !")
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors de la création des paiements: {e}")
            return False

if __name__ == '__main__':
    success = add_payments_data()
    if success:
        print("🎯 Données de paiements ajoutées !")
    else:
        print("❌ Échec de l'ajout des paiements")
