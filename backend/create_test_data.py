#!/usr/bin/env python3
"""
Script pour créer des données de test dans la base de données
Permet de tester toutes les fonctionnalités de l'application
"""

import os
from dotenv import load_dotenv

# Charger la configuration depuis config.env
load_dotenv('config.env')

from app import app, db, User, Quiz, Question, Result, Payment, Document
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def create_test_data():
    """Crée des données de test complètes"""
    
    with app.app_context():
        print("🗑️  Suppression des données existantes...")
        
        print("💡 Utilisation de la base de données configurée...")
        
        db.drop_all()
        db.create_all()
        print("✅ Base de données SQLite créée")
        
        print("👤 Création des utilisateurs de test...")
        
        # 1. Créer un administrateur
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
        
        # 2. Créer des étudiants de test
        students_data = [
            {
                'prenom': 'Jean',
                'nom': 'Dupont',
                'email': 'jean.dupont@test.com',
                'telephone': '0341111111'
            },
            {
                'prenom': 'Marie',
                'nom': 'Martin',
                'email': 'marie.martin@test.com',
                'telephone': '0341111112'
            },
            {
                'prenom': 'Pierre',
                'nom': 'Durand',
                'email': 'pierre.durand@test.com',
                'telephone': '0341111113'
            },
            {
                'prenom': 'Sophie',
                'nom': 'Bernard',
                'email': 'sophie.bernard@test.com',
                'telephone': '0341111114'
            },
            {
                'prenom': 'Lucas',
                'nom': 'Moreau',
                'email': 'lucas.moreau@test.com',
                'telephone': '0341111115'
            }
        ]
        
        students = []
        for i, student_data in enumerate(students_data):
            # Générer un code d'authentification simple pour les tests
            auth_code = f"TEST{2024}{i+1:03d}"
            password_hash = generate_password_hash(auth_code, method='pbkdf2:sha256')
            
            student = User(
                username=f"{student_data['prenom'].lower()}.{student_data['nom'].lower()}",
                email=student_data['email'],
                password=password_hash,
                role='student',
                telephone=student_data['telephone'],
                actif=False  # INACTIF par défaut - activé seulement après validation paiement
            )
            db.session.add(student)
            students.append((student, auth_code))
            print(f"   ✅ Étudiant: {student_data['prenom']} {student_data['nom']} - Code: {auth_code} (INACTIF)")
        
        db.session.commit()
        
        print("\n💰 Création des paiements de test...")
        
        # 3. Créer des paiements RÉALISTES pour les étudiants
        payment_scenarios = [
            # Scénario 1: Paiement validé (étudiant sera activé)
            {'statut': 'complet', 'montant': 50000, 'tranche_restante': 0, 'activer_etudiant': True},
            # Scénario 2: Paiement partiel validé (étudiant sera activé)
            {'statut': 'par_tranche', 'montant': 30000, 'tranche_restante': 20000, 'activer_etudiant': True},
            # Scénario 3: Paiement en attente (étudiant reste inactif)
            {'statut': 'en_attente', 'montant': 50000, 'tranche_restante': 0, 'activer_etudiant': False},
            # Scénario 4: Paiement en attente partiel (étudiant reste inactif)
            {'statut': 'en_attente', 'montant': 25000, 'tranche_restante': 25000, 'activer_etudiant': False},
            # Scénario 5: Paiement en attente (étudiant reste inactif)
            {'statut': 'en_attente', 'montant': 40000, 'tranche_restante': 10000, 'activer_etudiant': False}
        ]
        
        for i, (student, auth_code) in enumerate(students):
            scenario = payment_scenarios[i]
            
            # Tous les paiements MVola DOIVENT avoir un code de référence
            payment = Payment(
                user_id=student.id,
                mode_paiement='mvola',
                code_ref_mvola=f'MV{random.randint(100000, 999999)}{random.choice(["A", "B", "C", "D"])}',
                montant=scenario['montant'],
                statut=scenario['statut'],
                tranche_restante=scenario['tranche_restante']
            )
            
            # Activer l'étudiant seulement si le paiement est validé
            if scenario['activer_etudiant']:
                student.actif = True
                student.code_auth = auth_code  # Assigner le code d'auth seulement si activé
                print(f"   💳 {student.username}: {payment.montant:,} Ar ({payment.statut}) → ÉTUDIANT ACTIVÉ")
            else:
                student.code_auth = None  # Pas de code d'auth tant que pas validé
                print(f"   💳 {student.username}: {payment.montant:,} Ar ({payment.statut}) → EN ATTENTE VALIDATION")
            
            db.session.add(payment)
        
        print("\n📚 Création des documents de test...")
        
        # 4. Créer des documents de test
        documents_data = [
            {
                'titre': 'Cours de Mathématiques - Chapitre 1',
                'type': 'pdf',
                'chemin': '/documents/math_ch1.pdf',
                'telechargeable': True
            },
            {
                'titre': 'Exercices de Physique',
                'type': 'pdf',
                'chemin': '/documents/physique_ex.pdf',
                'telechargeable': True
            },
            {
                'titre': 'Vidéo explicative - Chimie',
                'type': 'video',
                'chemin': '/documents/chimie_video.mp4',
                'telechargeable': False
            },
            {
                'titre': 'Schémas de Biologie',
                'type': 'image',
                'chemin': '/documents/bio_schemas.png',
                'telechargeable': True
            },
            {
                'titre': 'Manuel de référence',
                'type': 'pdf',
                'chemin': '/documents/manuel_ref.pdf',
                'telechargeable': True
            }
        ]
        
        for doc_data in documents_data:
            document = Document(
                titre=doc_data['titre'],
                type=doc_data['type'],
                chemin=doc_data['chemin'],
                telechargeable=doc_data['telechargeable'],
                uploaded_by=admin.id
            )
            db.session.add(document)
            print(f"   📄 Document: {doc_data['titre']} ({doc_data['type']})")
        
        print("\n🎯 Création des quiz de test...")
        
        # 5. Créer des quiz de test
        quiz_data = [
            {
                'titre': 'Quiz de Mathématiques - Algèbre',
                'type': 'quiz',
                'duree': 30,
                'total_points': 20,
                'statut': 'actif',
                'date_debut': datetime.utcnow() - timedelta(days=1),
                'date_fin': datetime.utcnow() + timedelta(days=30)
            },
            {
                'titre': 'Examen de Physique',
                'type': 'examen',
                'duree': 120,
                'total_points': 100,
                'statut': 'actif',
                'date_debut': datetime.utcnow() - timedelta(hours=2),
                'date_fin': datetime.utcnow() + timedelta(days=7)
            },
            {
                'titre': 'Test de Chimie Organique',
                'type': 'test',
                'duree': 45,
                'total_points': 50,
                'statut': 'planifie',
                'date_debut': datetime.utcnow() + timedelta(days=3),
                'date_fin': datetime.utcnow() + timedelta(days=10)
            }
        ]
        
        quizzes = []
        for quiz_info in quiz_data:
            quiz = Quiz(
                titre=quiz_info['titre'],
                type=quiz_info['type'],
                duree=quiz_info['duree'],
                total_points=quiz_info['total_points'],
                statut=quiz_info['statut'],
                date_debut=quiz_info['date_debut'],
                date_fin=quiz_info['date_fin'],
                created_by=admin.id
            )
            db.session.add(quiz)
            quizzes.append(quiz)
            print(f"   🎯 Quiz: {quiz_info['titre']} ({quiz_info['statut']})")
        
        db.session.commit()
        
        print("\n❓ Création des questions de test...")
        
        # 6. Créer des questions pour les quiz
        questions_math = [
            {
                'question': 'Quelle est la solution de l\'équation 2x + 5 = 13 ?',
                'type_question': 'choix_multiple',
                'reponse_correcte': '4',
                'options': ['2', '3', '4', '5'],
                'points': 5
            },
            {
                'question': 'Calculez la dérivée de f(x) = x² + 3x',
                'type_question': 'choix_multiple',
                'reponse_correcte': '2x + 3',
                'options': ['2x + 3', 'x + 3', '2x', 'x² + 3'],
                'points': 5
            },
            {
                'question': 'Quelle est la valeur de π (pi) arrondie à 2 décimales ?',
                'type_question': 'texte_libre',
                'reponse_correcte': '3.14',
                'options': None,
                'points': 5
            },
            {
                'question': 'L\'équation x² - 5x + 6 = 0 a pour solutions :',
                'type_question': 'choix_multiple',
                'reponse_correcte': 'x = 2 et x = 3',
                'options': ['x = 1 et x = 6', 'x = 2 et x = 3', 'x = -2 et x = -3', 'x = 0 et x = 5'],
                'points': 5
            }
        ]
        
        for question_data in questions_math:
            question = Question(
                quiz_id=quizzes[0].id,  # Quiz de mathématiques
                question=question_data['question'],
                type_question=question_data['type_question'],
                reponse_correcte=question_data['reponse_correcte'],
                options=question_data['options'],
                points=question_data['points']
            )
            db.session.add(question)
        
        questions_physique = [
            {
                'question': 'Quelle est l\'unité de la force dans le système international ?',
                'type_question': 'choix_multiple',
                'reponse_correcte': 'Newton',
                'options': ['Joule', 'Newton', 'Watt', 'Pascal'],
                'points': 10
            },
            {
                'question': 'La vitesse de la lumière dans le vide est approximativement :',
                'type_question': 'choix_multiple',
                'reponse_correcte': '3 × 10⁸ m/s',
                'options': ['3 × 10⁶ m/s', '3 × 10⁷ m/s', '3 × 10⁸ m/s', '3 × 10⁹ m/s'],
                'points': 15
            },
            {
                'question': 'Énoncez la première loi de Newton',
                'type_question': 'texte_libre',
                'reponse_correcte': 'Un objet au repos reste au repos et un objet en mouvement reste en mouvement à vitesse constante, sauf si une force extérieure agit sur lui',
                'options': None,
                'points': 25
            }
        ]
        
        for question_data in questions_physique:
            question = Question(
                quiz_id=quizzes[1].id,  # Examen de physique
                question=question_data['question'],
                type_question=question_data['type_question'],
                reponse_correcte=question_data['reponse_correcte'],
                options=question_data['options'],
                points=question_data['points']
            )
            db.session.add(question)
        
        print("\n📊 Création des résultats de test...")
        
        # 7. Créer quelques résultats de test
        for i, (student, _) in enumerate(students[:3]):  # Seulement pour les 3 premiers étudiants
            if i < 2:  # Quiz de maths pour les 2 premiers
                score = random.randint(12, 20)  # Score entre 12 et 20
                result = Result(
                    user_id=student.id,
                    quiz_id=quizzes[0].id,
                    score=score,
                    temps_utilise=random.randint(15, 30),  # Entre 15 et 30 minutes
                    statut='soumis',
                    date_passage=datetime.utcnow() - timedelta(days=random.randint(1, 5))
                )
                db.session.add(result)
                print(f"   📈 Résultat pour {student.username}: {score}/20 au quiz de maths")
        
        db.session.commit()
        
        print("\n✅ Données de test créées avec succès !")
        print("\n" + "="*60)
        print("📋 RÉCAPITULATIF DES COMPTES DE TEST")
        print("="*60)
        print(f"👨‍💼 ADMINISTRATEUR:")
        print(f"   Email: admin@test.com")
        print(f"   Mot de passe: admin123")
        print(f"\n👨‍🎓 ÉTUDIANTS:")
        for student, auth_code in students:
            print(f"   Email: {student.email}")
            print(f"   Code d'authentification: {auth_code}")
        print("="*60)
        
        # Statistiques
        total_users = User.query.count()
        total_students = User.query.filter_by(role='student').count()
        total_payments = Payment.query.count()
        total_documents = Document.query.count()
        total_quizzes = Quiz.query.count()
        total_questions = Question.query.count()
        total_results = Result.query.count()
        
        print(f"\n📊 STATISTIQUES:")
        print(f"   Utilisateurs totaux: {total_users}")
        print(f"   Étudiants: {total_students}")
        print(f"   Paiements: {total_payments}")
        print(f"   Documents: {total_documents}")
        print(f"   Quiz: {total_quizzes}")
        print(f"   Questions: {total_questions}")
        print(f"   Résultats: {total_results}")

if __name__ == '__main__':
    create_test_data()
