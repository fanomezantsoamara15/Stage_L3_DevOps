#!/usr/bin/env python3
"""
Version optimisée du backend Flask pour de meilleures performances
"""

import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import pymysql

# Charger la configuration
load_dotenv('config.env')

app = Flask(__name__)

# Configuration optimisée
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-123')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'connect_args': {'connect_timeout': 10}
}

# Configuration MySQL optimisée
mysql_config = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', ''),
    'database': os.getenv('MYSQL_DATABASE', 'quiz_connect'),
    'charset': 'utf8mb4'
}

try:
    # Test de connexion MySQL
    conn = pymysql.connect(**mysql_config, connect_timeout=5)
    conn.close()
    
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"mysql+pymysql://{mysql_config['user']}:{mysql_config['password']}"
        f"@{mysql_config['host']}/{mysql_config['database']}?charset=utf8mb4"
    )
    print("✅ Configuration MySQL active")
    
except Exception as e:
    print(f"⚠️  MySQL indisponible, utilisation SQLite: {e}")
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quiz_connect_fast.db'

# Initialisation
db = SQLAlchemy(app)
CORS(app, origins=["http://localhost:8080", "http://127.0.0.1:8080"])

# Modèles simplifiés pour de meilleures performances
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student', index=True)
    telephone = db.Column(db.String(20))
    actif = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Routes optimisées
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/auth/login/student', methods=['POST'])
def login_student():
    try:
        data = request.get_json()
        if not data or not data.get('email') or not data.get('codeAuth'):
            return jsonify({'success': False, 'message': 'Email et code requis'}), 400
        
        # Recherche optimisée avec index
        user = User.query.filter_by(
            email=data['email'], 
            role='student', 
            actif=True
        ).first()
        
        if not user or not check_password_hash(user.password, data['codeAuth']):
            return jsonify({'success': False, 'message': 'Identifiants invalides'}), 401
        
        # Token JWT léger
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'success': True,
            'data': {
                'user': {
                    'id_etudiant': user.id,
                    'nom': user.username.split('.')[1] if '.' in user.username else user.username,
                    'prenom': user.username.split('.')[0] if '.' in user.username else user.username,
                    'email': user.email,
                    'actif': user.actif
                },
                'token': token
            }
        })
        
    except Exception as e:
        print(f"Erreur login: {e}")
        return jsonify({'success': False, 'message': 'Erreur serveur'}), 500

@app.route('/api/auth/login/admin', methods=['POST'])
def login_admin():
    try:
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'success': False, 'message': 'Email et mot de passe requis'}), 400
        
        user = User.query.filter_by(
            email=data['email'], 
            role='admin', 
            actif=True
        ).first()
        
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({'success': False, 'message': 'Identifiants invalides'}), 401
        
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'success': True,
            'data': {
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                },
                'token': token
            }
        })
        
    except Exception as e:
        print(f"Erreur login admin: {e}")
        return jsonify({'success': False, 'message': 'Erreur serveur'}), 500

# Routes rapides pour les données
@app.route('/api/admin/students', methods=['GET'])
def get_students():
    try:
        students = User.query.filter_by(role='student').all()
        return jsonify({
            'success': True,
            'data': [{
                'id_etudiant': s.id,
                'nom': s.username.split('.')[1] if '.' in s.username else s.username,
                'prenom': s.username.split('.')[0] if '.' in s.username else s.username,
                'email': s.email,
                'actif': s.actif
            } for s in students]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/documents', methods=['GET'])
def get_documents():
    return jsonify({
        'success': True,
        'data': [
            {'id': 1, 'titre': 'Cours Python', 'type': 'pdf', 'taille': '2.5 MB'},
            {'id': 2, 'titre': 'TP Flask', 'type': 'pdf', 'taille': '1.8 MB'}
        ]
    })

@app.route('/api/quizzes', methods=['GET'])
def get_quizzes():
    return jsonify({
        'success': True,
        'data': [
            {
                'id_quiz': 1,
                'titre': 'Quiz Python Basics',
                'type': 'quiz',
                'statut': 'actif',
                'date_debut': '2024-01-01',
                'date_fin': '2024-12-31'
            }
        ]
    })

@app.route('/api/student/<int:student_id>/payments', methods=['GET'])
def get_student_payments(student_id):
    return jsonify({
        'success': True,
        'data': [
            {
                'id': 1,
                'montant': 500.0,
                'tranche_restante': 0.0,
                'date_paiement': '2024-01-15',
                'statut': 'paye'
            }
        ]
    })

@app.route('/api/student/<int:student_id>/notifications', methods=['GET'])
def get_student_notifications(student_id):
    return jsonify({
        'success': True,
        'data': [
            {
                'id': 1,
                'titre': 'Bienvenue',
                'message': 'Bienvenue dans votre espace étudiant',
                'lu': False,
                'date_creation': '2024-01-01'
            }
        ]
    })

@app.route('/api/admin/payments', methods=['GET'])
def get_all_payments():
    return jsonify({
        'success': True,
        'data': [
            {
                'id': 1,
                'id_etudiant': 1,
                'montant': 500.0,
                'date_paiement': '2024-01-15',
                'statut': 'paye'
            }
        ]
    })

if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()
            print("✅ Base de données initialisée")
        except Exception as e:
            print(f"❌ Erreur DB: {e}")
    
    print("🚀 Serveur optimisé démarré sur http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
