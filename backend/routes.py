from flask import Blueprint, request, jsonify
from . import db, mail
from .models import User, Payment
from .email_service import send_auth_code_email, send_password_reset_email
from functools import wraps
import jwt
import os
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

main = Blueprint('main', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
            
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
            
        try:
            data = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@main.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Vérifier si l'utilisateur existe déjà
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Email déjà utilisé'}), 400
        
    # Créer un nouvel utilisateur
    hashed_password = generate_password_hash(data['password'], method='sha256')
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password,
        role='student',
        telephone=data.get('telephone', ''),
        notes=data.get('notes', ''),
        actif=False  # Inactif par défaut jusqu'à validation du paiement
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Générer un code d'authentification
    auth_code = data.get('code_auth', '')  # À remplacer par une génération sécurisée
    
    # Envoyer l'email avec le code d'authentification
    send_auth_code_email(
        recipient_email=new_user.email,
        student_name=f"{new_user.username}",
        auth_code=auth_code
    )
    
    return jsonify({
        'success': True,
        'message': 'Utilisateur créé avec succès',
        'user_id': new_user.id
    }), 201

@main.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'success': False, 'message': 'Email ou mot de passe incorrect'}), 401
        
    if not user.actif:
        return jsonify({'success': False, 'message': 'Compte désactivé'}), 403
        
    # Créer un token JWT
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, os.getenv('SECRET_KEY'))
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'actif': user.actif
        }
    })

@main.route('/api/students/<int:student_id>/resend-code', methods=['POST'])
@token_required
def resend_auth_code(current_user, student_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
        
    student = User.query.get(student_id)
    if not student:
        return jsonify({'success': False, 'message': 'Étudiant non trouvé'}), 404
        
    # Générer un nouveau code d'authentification (à remplacer par une logique de génération sécurisée)
    auth_code = student.code_auth or 'GENERER_UN_NOUVEAU_CODE_SECURISE'
    
    # Envoyer l'email avec le nouveau code
    send_success = send_auth_code_email(
        recipient_email=student.email,
        student_name=student.username,
        auth_code=auth_code
    )
    
    if not send_success:
        return jsonify({'success': False, 'message': 'Erreur lors de l\'envoi de l\'email'}), 500
        
    return jsonify({'success': True, 'message': 'Code d\'authentification renvoyé avec succès'})

# Autres routes existantes...
