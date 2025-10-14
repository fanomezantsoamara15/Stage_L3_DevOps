from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os

app = Flask(__name__)

# Configuration CORS
CORS(app, origins=["http://localhost:8080", "http://127.0.0.1:8080"])

# Configuration simple avec SQLite
app.config['SECRET_KEY'] = 'test-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Fonctions utilitaires
def generate_token(user_id):
    return jwt.encode(
        {'user_id': user_id, 'exp': datetime.utcnow() + timedelta(days=1)},
        app.config['SECRET_KEY'],
        algorithm='HS256'
    )

def token_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = token.split()[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Modèles
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    date_inscription = db.Column(db.DateTime, default=datetime.utcnow)
    telephone = db.Column(db.String(20))
    actif = db.Column(db.Boolean, default=True)

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    total_points = db.Column(db.Integer, default=0)
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=False)
    duree = db.Column(db.Integer, nullable=False)
    statut = db.Column(db.String(20), default='brouillon')
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    chemin = db.Column(db.String(255), nullable=False)
    telechargeable = db.Column(db.Boolean, default=True)
    date_upload = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    mode_paiement = db.Column(db.String(20), nullable=False)
    code_ref_mvola = db.Column(db.String(50))
    montant = db.Column(db.Float, nullable=False)
    statut = db.Column(db.String(20), nullable=False)
    tranche_restante = db.Column(db.Float, default=0)
    date_paiement = db.Column(db.DateTime, default=datetime.utcnow)

# Routes d'authentification
@app.route('/api/auth/login/student', methods=['POST'])
def login_student():
    data = request.json
    print(f"=== Connexion étudiant: {data.get('email')} ===")
    
    user = User.query.filter_by(email=data['email'], role='student').first()
    
    if not user:
        return jsonify({'success': False, 'message': 'Email ou code incorrect'}), 401
    
    code_auth = data.get('code_auth') or data.get('password')
    if not check_password_hash(user.password, code_auth):
        return jsonify({'success': False, 'message': 'Email ou code incorrect'}), 401
        
    if not user.actif:
        return jsonify({'success': False, 'message': 'Compte désactivé'}), 403
        
    token = generate_token(user.id)
    
    # Adapter la structure pour le frontend
    username_parts = user.username.split('.')
    nom = username_parts[-1].capitalize() if len(username_parts) > 1 else user.username
    prenom = username_parts[0].capitalize() if len(username_parts) > 1 else ''
    
    return jsonify({
        'success': True,
        'data': {
            'user': {
                'id_etudiant': user.id,
                'id': user.id,
                'nom': nom,
                'prenom': prenom,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'actif': user.actif,
                'telephone': user.telephone,
                'date_inscription': user.date_inscription.isoformat() if user.date_inscription else None
            },
            'isAdmin': False,
            'token': token
        }
    })

@app.route('/api/auth/login/admin', methods=['POST'])
def login_admin():
    data = request.json
    print(f"=== Connexion admin: {data.get('email')} ===")
    
    user = User.query.filter_by(email=data['email'], role='admin').first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'success': False, 'message': 'Identifiants invalides'}), 401
        
    if not user.actif:
        return jsonify({'success': False, 'message': 'Compte désactivé'}), 403
        
    token = generate_token(user.id)
    
    return jsonify({
        'success': True,
        'data': {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            },
            'isAdmin': True,
            'token': token
        }
    })

# Routes pour les étudiants
@app.route('/api/admin/students', methods=['GET'])
@token_required
def get_students(current_user):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403

    students = User.query.filter_by(role='student').all()
    
    students_data = []
    for student in students:
        username_parts = student.username.split('.')
        nom = username_parts[-1].capitalize() if len(username_parts) > 1 else student.username
        prenom = username_parts[0].capitalize() if len(username_parts) > 1 else ''
        
        students_data.append({
            'id_etudiant': student.id,
            'id': student.id,
            'nom': nom,
            'prenom': prenom,
            'username': student.username,
            'email': student.email,
            'actif': student.actif,
            'telephone': student.telephone,
            'date_inscription': student.date_inscription.isoformat() if student.date_inscription else None
        })
    
    return jsonify({
        'success': True,
        'data': students_data
    })

# Routes pour les paiements
@app.route('/api/admin/payments', methods=['GET'])
@token_required
def get_payments(current_user):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    try:
        payments = db.session.query(Payment, User.username, User.email).join(User, Payment.user_id == User.id).all()
        
        result = []
        for p, username, email in payments:
            payment_data = {
                'id': p.id,
                'user_id': p.user_id,
                'etudiant': {
                    'id_etudiant': p.user_id,
                    'nom': username.split('.')[-1] if username else 'Inconnu',
                    'prenom': username.split('.')[0] if username else '',
                    'email': email or ''
                },
                'mode_paiement': p.mode_paiement,
                'code_ref_mvola': p.code_ref_mvola,
                'montant': float(p.montant) if p.montant else 0,
                'statut': p.statut,
                'tranche_restante': float(p.tranche_restante) if p.tranche_restante else 0,
                'date_paiement': p.date_paiement.isoformat() if p.date_paiement else None
            }
            result.append(payment_data)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Erreur lors de la récupération des paiements'
        }), 500

# Routes pour les documents
@app.route('/api/documents', methods=['GET'])
@token_required
def get_documents(current_user):
    documents = Document.query.all()
    return jsonify({
        'success': True,
        'data': [{
            'id_document': doc.id,
            'id': doc.id,
            'titre': doc.titre,
            'type': doc.type,
            'chemin': doc.chemin,
            'telechargeable': doc.telechargeable,
            'date_upload': doc.date_upload.isoformat()
        } for doc in documents]
    })

# Routes pour les quiz
@app.route('/api/quizzes', methods=['GET'])
@token_required
def get_quizzes(current_user):
    if current_user.role == 'admin':
        quizzes = Quiz.query.all()
    else:
        quizzes = Quiz.query.filter(
            Quiz.statut == 'actif',
            Quiz.date_debut <= datetime.utcnow(),
            Quiz.date_fin >= datetime.utcnow()
        ).all()
    
    return jsonify({
        'success': True,
        'data': [{
            'id_quiz': quiz.id,
            'id': quiz.id,
            'titre': quiz.titre,
            'type': quiz.type,
            'total_points': quiz.total_points,
            'date_debut': quiz.date_debut.isoformat(),
            'date_fin': quiz.date_fin.isoformat(),
            'duree': quiz.duree,
            'statut': quiz.statut
        } for quiz in quizzes]
    })

# Routes pour les paiements d'étudiants
@app.route('/api/student/<int:student_id>/payments', methods=['GET'])
@token_required
def get_student_payments(current_user, student_id):
    if current_user.role != 'admin' and current_user.id != student_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    payments = Payment.query.filter_by(user_id=student_id).all()
    
    payments_data = []
    for payment in payments:
        payments_data.append({
            'id_paiement': payment.id,
            'id': payment.id,
            'mode_paiement': payment.mode_paiement,
            'code_ref_mvola': payment.code_ref_mvola,
            'montant': float(payment.montant) if payment.montant else 0,
            'statut': payment.statut,
            'tranche_restante': float(payment.tranche_restante) if payment.tranche_restante else 0,
            'date_paiement': payment.date_paiement.isoformat() if payment.date_paiement else None
        })
    
    return jsonify({
        'success': True,
        'data': payments_data
    })

# Routes pour les notifications d'étudiants
@app.route('/api/student/<int:student_id>/notifications', methods=['GET'])
@token_required
def get_student_notifications(current_user, student_id):
    if current_user.role != 'admin' and current_user.id != student_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    return jsonify({
        'success': True,
        'data': []  # Pas de notifications pour l'instant
    })

# Route de debug
@app.route('/api/debug/users', methods=['GET'])
def list_users():
    try:
        users = User.query.all()
        users_list = [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'actif': user.actif
        } for user in users]
        return jsonify({
            'status': 'success',
            'count': len(users_list),
            'users': users_list
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    print("🚀 Serveur backend démarré sur http://localhost:5000")
    print("📊 API disponible sur http://localhost:5000/api")
    print("🔍 Debug users: http://localhost:5000/api/debug/users")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
