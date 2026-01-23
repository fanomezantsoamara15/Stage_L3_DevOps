from flask import Flask, request, jsonify, current_app, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_mail import Message
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
import jwt
import os
import random
import smtplib
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Charger les variables d'environnement
load_dotenv('config.env')

app = Flask(__name__)
# Configuration kubernetes health check
@app.route("/health")
def health():
    return "ok", 200
# Configuration CORS
app.config.update(
    CORS_SUPPORTS_CREDENTIALS=True,
    CORS_ORIGINS=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        # Ajouts pour quiz.local
        "http://quiz.local",
        "https://quiz.local",
        "http://quiz.local:30080",
        "https://quiz.local:30080"
    ],
    CORS_HEADERS=['Content-Type', 'Authorization'],
    CORS_METHODS=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    CORS_EXPOSE_HEADERS=['Content-Type', 'Authorization', 'X-Total-Count']
)

# Initialisation CORS avec configuration simplifiée
cors = CORS(
    app,
    resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": app.config['CORS_METHODS'],
            "allow_headers": app.config['CORS_HEADERS'],
            "supports_credentials": True,
            "expose_headers": app.config['CORS_EXPOSE_HEADERS'],
            "vary_header": True
        }
    }
)

# Désactiver la gestion automatique des OPTIONS par Flask-CORS
app.config['CORS_AUTOMATIC_OPTIONS'] = False

# Gestion des requêtes OPTIONS (pré-vol CORS)
@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin'))
        response.headers.add('Access-Control-Allow-Headers', ', '.join(app.config['CORS_HEADERS']))
        response.headers.add('Access-Control-Allow-Methods', ', '.join(app.config['CORS_METHODS']))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '86400')
        response.headers.add('Vary', 'Origin')
        return response, 200

# Nettoyage des en-têtes CORS en double
@app.after_request
def after_request(response):
    # Supprimer les en-têtes CORS en double
    response.headers.pop('Access-Control-Allow-Origin', None)
    response.headers.pop('Access-Control-Allow-Headers', None)
    response.headers.pop('Access-Control-Allow-Methods', None)
    response.headers.pop('Access-Control-Allow-Credentials', None)
    response.headers.pop('Access-Control-Expose-Headers', None)
    response.headers.pop('Vary', None)
    
    # Si c'est une requête CORS, ajouter les en-têtes nécessaires
    origin = request.headers.get('Origin')
    if origin in app.config['CORS_ORIGINS']:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', ', '.join(app.config['CORS_HEADERS']))
        response.headers.add('Access-Control-Allow-Methods', ', '.join(app.config['CORS_METHODS']))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Expose-Headers', ', '.join(app.config['CORS_EXPOSE_HEADERS']))
        response.headers.add('Vary', 'Origin')
    
    return response

# Middleware pour logger les requêtes entrantes
@app.before_request
def log_request_info():
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Body: %s', request.get_data())

# Configuration de l'application
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Configuration Flask-Mail
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

# Initialisation de Flask-Mail
from flask_mail import Mail
mail = Mail(app)

# Utiliser SQLite par défaut pour les tests si MySQL n'est pas disponible
try:
    mysql_uri = f"mysql+pymysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@{os.getenv('MYSQL_HOST')}/{os.getenv('MYSQL_DATABASE')}"
    app.config['SQLALCHEMY_DATABASE_URI'] = mysql_uri
except:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quiz_connect.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = { 'pdf', 'mp4', 'avi', 'mov', 'wmv', 'jpg', 'jpeg', 'png', 'gif' }

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# Assouplir CORS et autoriser l'intégration en iframe (dev)
@app.after_request
def add_security_headers(response):
    # CORS basique pour dev
    response.headers.setdefault('Access-Control-Allow-Origin', '*')
    response.headers.setdefault('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.setdefault('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS')
    # Autoriser l'affichage dans des iframes (pour l'overlay front)
    response.headers['X-Frame-Options'] = 'ALLOWALL'  # non standard mais compris par certains navigateurs
    response.headers['Content-Security-Policy'] = "frame-ancestors *"
    return response

# Fonctions utilitaires
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def send_auth_email(recipient_email, student_name, auth_code):
    try:
        msg = Message(
            "Votre code d'authentification Quiz Connect",
            recipients=[recipient_email]
        )
        
        msg.html = f"""
        <html>
            <body>
                <h2>Bienvenue sur Quiz Connect, {student_name} !</h2>
                <p>Votre code d'authentification est :</p>
                <div style="font-size: 24px; font-weight: bold; margin: 20px 0; padding: 10px; 
                            background-color: #f5f5f5; border-radius: 5px; display: inline-block;">
                    {auth_code}
                </div>
                <p>Utilisez ce code pour vous connecter à votre espace étudiant.</p>
                <p><strong>Ne partagez jamais ce code avec qui que ce soit.</strong></p>
                <p>Cordialement,<br>L'équipe Quiz Connect</p>
            </body>
        </html>
        """
        
        mail.send(msg)
        app.logger.info(f"Email d'authentification envoyé à {recipient_email}")
        return True
    except Exception as e:
        app.logger.error(f"Erreur lors de l'envoi de l'email à {recipient_email}: {str(e)}")
        return False

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
            current_user = db.session.get(User, data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def block_advanced_downloaders():
    """Détection avancée des téléchargeurs automatiques avec logging détaillé"""
    ua = request.headers.get('User-Agent', '').lower()
    client_ip = request.remote_addr

    app.logger.info(f"🔍 ANALYSE UA: IP={client_ip}, UA='{ua[:100]}'")

    # Liste étendue de téléchargeurs et bots malveillants
    blocked_agents = [
        # Gestionnaires de téléchargement populaires
        'idm', 'internet download manager', 'idm/', 'idman',
        'jdownloader', 'jdownloader2', 'jdownloader/',
        'eagleget', 'eagleget/',
        'flashget', 'flashget/',
        'orbit downloader', 'orbit/',
        'free download manager', 'fdm/',
        'wget', 'wget/',
        'curl', 'curl/',
        'aria2', 'aria2/',
        'axel', 'axel/',
        'httrack', 'httrack/',
        'teleport', 'teleport/',
        'webcopier', 'webcopier/',
        'offline explorer', 'offline/',
        'mass downloader', 'mass/',
        'download accelerator', 'dap/',
        'getright', 'getright/',
        'goclone', 'goclone/',

        # Bots et scrapers malveillants
        'sqlmap', 'sqlmap/',
        'nikto', 'nikto/',
        'nessus', 'nessus/',
        'openvas', 'openvas/',
        'nmap', 'nmap/',
        'masscan', 'masscan/',
        'zgrab', 'zgrab/',
        'gobuster', 'gobuster/',
        'dirbuster', 'dirbuster/',
        'dirb', 'dirb/',
        'owasp', 'owasp/',

        # User-Agents suspects
        'python-requests', 'requests/',
        'scrapy', 'scrapy/',
        'beautifulsoup', 'beautifulsoup/',
        'selenium', 'selenium/',
        'phantomjs', 'phantomjs/',
        'headless', 'headlesschrome', 'headlessfirefox',
        'bot', 'spider', 'crawler', 'scraper',
        'harvest', 'harvest/',
        'collect', 'collect/',
        'archive', 'archive/',
        'backup', 'backup/',
    ]

    # Détection par patterns
    for agent in blocked_agents:
        if agent in ua:
            app.logger.warning(f"🚫 TÉLÉCHARGEUR BLOQUÉ: IP={client_ip}, UA='{ua[:100]}', AGENT='{agent}'")
            return True

    # Détection de patterns suspects
    suspicious_patterns = [
        r'download.*manager',
        r'wget\/\d+\.\d+',
        r'curl\/\d+\.\d+',
        r'python.*requests',
        r'java\/\d+\.\d+',
        r'go-http-client',
        r'okhttp\/\d+\.\d+',
        r'libcurl\/\d+\.\d+',
    ]

    import re
    for pattern in suspicious_patterns:
        if re.search(pattern, ua):
            app.logger.warning(f"🚫 PATTERN SUSPECT BLOQUÉ: IP={client_ip}, UA='{ua[:100]}', PATTERN='{pattern}'")
            return True

    app.logger.info(f"✅ UA AUTORISÉ: IP={client_ip}, UA='{ua[:100]}'")
    return False

# Modèles
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    date_inscription = db.Column(db.DateTime, default=datetime.utcnow)
    telephone = db.Column(db.String(20))
    code_auth = db.Column(db.String(20), unique=True, nullable=True)  # Stockage du code d'authentification en clair
    actif = db.Column(db.Boolean, default=False)

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    total_points = db.Column(db.Integer, default=0)
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=False)
    duree = db.Column(db.Integer, nullable=False)  # en minutes
    statut = db.Column(db.String(20), default='inactif')
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    questions = db.relationship('Question', backref='quiz', lazy=True)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    question = db.Column(db.Text, nullable=False)
    type_question = db.Column(db.String(20), nullable=False)
    reponse_correcte = db.Column(db.String(255), nullable=False)
    options = db.Column(db.JSON)
    points = db.Column(db.Integer, default=1)

class Result(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)
    date_passage = db.Column(db.DateTime, default=datetime.utcnow)
    temps_utilise = db.Column(db.Integer)  # en secondes
    statut = db.Column(db.String(20), default='en_cours')

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    mode_paiement = db.Column(db.String(20), nullable=False)
    code_ref_mvola = db.Column(db.String(50))
    montant = db.Column(db.Float, nullable=False)
    statut = db.Column(db.String(20), nullable=False)
    tranche_restante = db.Column(db.Float, default=0)
    date_paiement = db.Column(db.DateTime, default=datetime.utcnow)

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    chemin = db.Column(db.String(255), nullable=False)
    telechargeable = db.Column(db.Boolean, default=True)
    date_upload = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# Notifications
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type_cible = db.Column(db.String(20), default='tous')  # 'tous' | 'individuel'
    id_etudiant = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    date_envoi = db.Column(db.DateTime, default=datetime.utcnow)

# Routes d'authentification
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
        
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already taken'}), 400
        
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password,
        role=data.get('role', 'student'),
        telephone=data.get('telephone')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'Successfully registered',
        'user': {
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email,
            'role': new_user.role
        }
    }), 201

# Route de connexion étudiant spécifique
@app.route('/api/auth/login/student', methods=['POST'])
def login_student():
    data = request.json
    print(f"\n=== Tentative de connexion étudiant avec l'email: {data.get('email')} ===")
    
    # Vérifier si l'utilisateur existe et est un étudiant
    user = User.query.filter_by(email=data['email'], role='student').first()
    
    if not user:
        print("❌ Aucun étudiant trouvé avec cet email")
        return jsonify({'success': False, 'message': 'Email ou code d\'authentification incorrect'}), 401
    
    print(f"✅ Étudiant trouvé: {user.username}")
    
    # Vérifier le code d'authentification
    code_auth = (data.get('code_auth') or '').strip().upper()
    is_code_correct = False
    
    # Vérifier d'abord si le code correspond au code d'authentification stocké en clair
    if user.code_auth and user.code_auth.upper() == code_auth:
        is_code_correct = True
    # Vérifier aussi le mot de passe haché pour la rétrocompatibilité
    elif check_password_hash(user.password, code_auth):
        is_code_correct = True
        # Mettre à jour le code d'authentification en clair pour les prochaines connexions
        user.code_auth = code_auth
        db.session.commit()
    
    print(f"🔍 Vérification du code: {'✅ Réussi' if is_code_correct else '❌ Échec'}")
    
    if not is_code_correct:
        print(f"❌ Échec de l'authentification: code incorrect (code fourni: {code_auth})")
        return jsonify({'success': False, 'message': 'Email ou code d\'authentification incorrect'}), 401
        
    # Vérifier si le compte est actif
    if not user.actif:
        print("❌ Compte étudiant désactivé")
        return jsonify({'success': False, 'message': 'Ce compte étudiant a été désactivé'}), 403
        
    print("✅ Authentification étudiant réussie")
    token = generate_token(user.id)
    
    # Adapter la structure pour correspondre aux attentes du frontend
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

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    print(f"\n=== Tentative de connexion avec l'email: {data['email']} ===")
    
    # Vérifier si l'utilisateur existe
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        print("❌ Aucun utilisateur trouvé avec cet email")
        return jsonify({'success': False, 'message': 'Email ou mot de passe incorrect'}), 401
    
    print(f"✅ Utilisateur trouvé: {user.username}")
    print(f"🔑 Mot de passe fourni: {data['password']}")
    print(f"🔒 Hash stocké: {user.password}")
    print(f"👤 Actif: {'Oui' if user.actif else 'Non'}")
    print(f"👑 Rôle: {user.role}")
    
    # Vérifier si le mot de passe est correct
    is_password_correct = check_password_hash(user.password, data['password'])
    print(f"🔍 Vérification du mot de passe: {'✅ Réussi' if is_password_correct else '❌ Échec'}")
    
    if not is_password_correct:
        print("❌ Échec de l'authentification: mot de passe incorrect")
        return jsonify({'success': False, 'message': 'Email ou mot de passe incorrect'}), 401
        
    # Vérifier si le compte est actif
    if not user.actif:
        print("❌ Compte désactivé")
        return jsonify({'success': False, 'message': 'Ce compte a été désactivé'}), 403
        
    print("✅ Authentification réussie")
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
            'isAdmin': user.role == 'admin',
            'token': token
        }
    })

@app.route('/api/auth/login/admin', methods=['POST'])
def login_admin():
    print("\n=== Début de la requête de connexion admin ===")
    print(f"En-têtes de la requête: {request.headers}")
    print(f"Données reçues: {request.json}")
    
    data = request.json
    if not data or 'email' not in data or 'password' not in data:
        print("❌ Données de requête invalides")
        return jsonify({'success': False, 'message': 'Email et mot de passe requis'}), 400
        
    print(f"\n=== Tentative de connexion admin avec l'email: {data['email']} ===")
    
    # Vérifier si l'utilisateur existe et est admin
    user = User.query.filter_by(email=data['email'], role='admin').first()
    print(f"Utilisateur trouvé: {user}")
    
    if not user:
        print("❌ Aucun administrateur trouvé avec cet email")
        return jsonify({'success': False, 'message': 'Identifiants invalides'}), 401
    
    print(f"✅ Administrateur trouvé: {user.username}")
    
    # Vérifier si le mot de passe est correct
    print(f"Mot de passe fourni (haché): {generate_password_hash(data['password'], method='pbkdf2:sha256')}")
    print(f"Mot de passe stocké: {user.password}")
    
    is_password_correct = check_password_hash(user.password, data['password'])
    print(f"Résultat de la vérification du mot de passe: {is_password_correct}")
    
    if not is_password_correct:
        print("❌ Échec de l'authentification: mot de passe incorrect")
        print(f"Mot de passe fourni: {data['password']}")
        print(f"Hachage du mot de passe fourni: {generate_password_hash(data['password'], method='pbkdf2:sha256')}")
        return jsonify({'success': False, 'message': 'Identifiants invalides'}), 401
        
    # Vérifier si le compte est actif
    if not user.actif:
        print("❌ Compte administrateur désactivé")
        return jsonify({'success': False, 'message': 'Ce compte administrateur a été désactivé'}), 403
        
    print("✅ Authentification administrateur réussie")
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

# Routes pour la gestion des étudiants
@app.route('/api/students', methods=['POST'])
@token_required
def add_student(current_user):
    print("=== Début de la création d'un étudiant ===")
    print(f"Utilisateur actuel: {current_user.username} (role: {current_user.role})")
    
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.json
    print(f"Données reçues: {data}")
    
    # Vérification des champs obligatoires
    required_fields = ['nom', 'prenom', 'email', 'telephone']
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    
    if missing_fields:
        error_msg = f'Champs manquants: {", ".join(missing_fields)}'
        print(f"Erreur: {error_msg}")
        return jsonify({'message': error_msg}), 400
    
    # Vérification de l'email
    if not isinstance(data['email'], str) or '@' not in data['email']:
        error_msg = 'Format d\'email invalide'
        print(f"Erreur: {error_msg}")
        return jsonify({'message': error_msg}), 400
        
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        print(f"Erreur: L'email {data['email']} est déjà utilisé")
        return jsonify({'message': 'Email already exists'}), 400

    # Génération du code d'authentification
    year = datetime.utcnow().year
    initials = (data['prenom'][0] + data['nom'][0]).upper()
    random_num = ''.join([str(random.randint(0, 9)) for _ in range(3)])
    auth_code = f"{initials}{year}{random_num}"

    hashed_password = generate_password_hash(auth_code, method='sha256')
    
    new_student = User(
        username=f"{data['prenom'].lower()}.{data['nom'].lower()}",
        email=data['email'],
        password=hashed_password,
        role='student',
        telephone=data.get('telephone'),
        code_auth=auth_code,  # Stockage du code d'authentification en clair
        actif=False
    )
    
    db.session.add(new_student)
    db.session.commit()
    
    # Envoyer l'email avec le code d'authentification
    email_sent = send_auth_email(
        recipient_email=new_student.email,
        student_name=f"{data['prenom']} {data['nom']}",
        auth_code=auth_code
    )
    
    if not email_sent:
        app.logger.error(f"Échec de l'envoi de l'email à {new_student.email}")

    return jsonify({
        'message': 'Student added successfully',
        'auth_code': auth_code,  # À des fins de test, à retirer en production
        'email_sent': email_sent,
        'student': {
            'id': new_student.id,
            'username': new_student.username,
            'email': new_student.email
        }
    }), 201

@app.route('/api/students', methods=['GET'])
@app.route('/api/admin/students', methods=['GET', 'OPTIONS'])
def get_students():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    students = User.query.filter_by(role='student').all()
    
    # Adapter la structure pour correspondre aux attentes du frontend
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
            'date_inscription': student.date_inscription.isoformat() if student.date_inscription else None,
            'code_auth': student.code_auth or ''
        })
    
    return jsonify({
        'success': True,
        'data': students_data
    })

@app.route('/api/admin/students/bulk-delete', methods=['DELETE'])
@token_required
def bulk_delete_students(current_user):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    try:
        deleted = User.query.filter_by(role='student').delete()
        db.session.commit()
        return jsonify({'success': True, 'deleted': deleted})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erreur lors de la suppression en masse', 'details': str(e)}), 500

@app.route('/api/students/<int:student_id>', methods=['GET', 'OPTIONS'])
def get_student_by_id(student_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    student = User.query.filter_by(id=student_id, role='student').first()
    if not student:
        return jsonify({'success': False, 'message': 'Étudiant non trouvé'}), 404

    username_parts = student.username.split('.')
    nom = username_parts[-1].capitalize() if len(username_parts) > 1 else student.username
    prenom = username_parts[0].capitalize() if len(username_parts) > 1 else ''

    return jsonify({
        'success': True,
        'data': {
            'id_etudiant': student.id,
            'id': student.id,
            'nom': nom,
            'prenom': prenom,
            'username': student.username,
            'email': student.email,
            'actif': student.actif,
            'telephone': student.telephone,
            'date_inscription': student.date_inscription.isoformat() if student.date_inscription else None,
            'code_auth': student.code_auth or ''
        }
    })

@app.route('/api/students/<int:student_id>/toggle', methods=['POST'])
@token_required
def toggle_student(current_user, student_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    student = User.query.filter_by(id=student_id, role='student').first()
    if not student:
        return jsonify({'message': 'Student not found'}), 404

    student.actif = not student.actif
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Student {'activated' if student.actif else 'deactivated'} successfully",
        'student': {
            'id': student.id,
            'actif': student.actif
        }
    })

@app.route('/api/students/<int:student_id>/resend-code', methods=['POST'])
@token_required
def resend_auth_code(current_user, student_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    student = User.query.filter_by(id=student_id, role='student').first()
    if not student:
        return jsonify({'message': 'Student not found'}), 404

    # Générer un nouveau code d'authentification
    year = datetime.utcnow().year
    username_parts = student.username.split('.')
    initials = (username_parts[0][0] + username_parts[1][0]).upper()
    random_num = ''.join([str(random.randint(0, 9)) for _ in range(3)])
    auth_code = f"{initials}{year}{random_num}"

    # Mettre à jour le mot de passe et stocker le code en clair pour l'envoi et la connexion code
    student.password = generate_password_hash(auth_code, method='sha256')
    student.code_auth = auth_code
    db.session.commit()

    # Envoyer l'email avec le nouveau code d'authentification
    username_parts = student.username.split('.')
    first_name = username_parts[0].capitalize()
    last_name = username_parts[1].capitalize() if len(username_parts) > 1 else ''
    
    email_sent = send_auth_email(
        recipient_email=student.email,
        student_name=f"{first_name} {last_name}",
        auth_code=auth_code
    )
    
    if not email_sent:
        app.logger.error(f"Échec de l'envoi de l'email à {student.email}")
    
    return jsonify({
        'success': True,
        'message': 'Code d\'authentification régénéré et envoyé par email',
        'email_sent': email_sent,
        'auth_code': auth_code  # À des fins de test, à retirer en production
    })

@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify_token(current_user):
    # Vérifie la validité du token et renvoie des infos minimales
    return jsonify({
        'success': True,
        'data': {
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'role': current_user.role,
                'actif': current_user.actif
            },
            'isAdmin': current_user.role == 'admin'
        }
    })

@app.route('/api/admin/students/<int:student_id>', methods=['DELETE'])
@token_required
def delete_student(current_user, student_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    student = User.query.filter_by(id=student_id, role='student').first()
    if not student:
        return jsonify({'message': 'Student not found'}), 404

    db.session.delete(student)
    db.session.commit()

    return jsonify({'message': 'Student deleted successfully'})

# Routes Quiz
# Routes Quiz
@app.route('/api/quizzes', methods=['GET'])
@token_required
def get_quizzes(current_user):
    if current_user.role == 'admin':
        quizzes = Quiz.query.all()
    else:
        # Utiliser l'heure locale pour éviter les écarts de fuseau liés aux dates saisies côté frontend
        now = datetime.now()
        quizzes = Quiz.query.filter(
            Quiz.statut == 'actif',
            Quiz.date_debut <= now,
            Quiz.date_fin >= now
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

@app.route('/api/quizzes/<int:quiz_id>', methods=['GET'])
@token_required
def get_quiz_with_questions(current_user, quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    
    # Vérifier si l'étudiant a accès à ce quiz
    if current_user.role != 'admin':
        now = datetime.now()
        if (quiz.statut != 'actif' or 
            quiz.date_debut > now or 
            quiz.date_fin < now):
            return jsonify({'message': 'Quiz not available'}), 403

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    
    return jsonify({
        'quiz': {
            'id': quiz.id,
            'titre': quiz.titre,
            'type': quiz.type,
            'total_points': quiz.total_points,
            'date_debut': quiz.date_debut.isoformat(),
            'date_fin': quiz.date_fin.isoformat(),
            'duree': quiz.duree,
            'statut': quiz.statut
        },
        'questions': [{
            'id': q.id,
            'question': q.question,
            'type_question': q.type_question,
            'options': q.options,
            'points': q.points
        } for q in questions]
    })

@app.route('/api/quizzes', methods=['POST'])
@token_required
def create_quiz(current_user):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.json
    new_quiz = Quiz(
        titre=data['titre'],
        type=data['type'],
        total_points=data.get('total_points', 0),
        date_debut=datetime.fromisoformat(data['date_debut']),
        date_fin=datetime.fromisoformat(data['date_fin']),
        duree=data['duree'],
        statut=data.get('statut', 'inactif'),
        created_by=current_user.id
    )
    db.session.add(new_quiz)
    db.session.flush()  # Obtenir new_quiz.id sans commit définitif

    # Créer les questions si fournies
    questions = (data.get('questions') or [])
    for q in questions:
        # Normaliser les champs
        question_text = q.get('question')
        type_question = q.get('type_question')
        reponse_correcte = q.get('reponse_correcte')
        options = q.get('options')
        points = q.get('points', 1)
        if not question_text or not type_question or reponse_correcte is None:
            continue  # ignorer les questions incomplètes
        new_q = Question(
            quiz_id=new_quiz.id,
            question=question_text,
            type_question=type_question,
            reponse_correcte=reponse_correcte,
            options=options,
            points=points
        )
        db.session.add(new_q)

    # Recalculer total_points si non fourni: somme des points des questions
    if not data.get('total_points') and questions:
        try:
            new_quiz.total_points = sum(int(q.get('points', 1)) for q in questions)
        except Exception:
            pass

    db.session.commit()

    return jsonify({
        'message': 'Quiz created successfully',
        'quiz_id': new_quiz.id
    }), 201

@app.route('/api/quizzes/<int:quiz_id>/questions', methods=['POST'])
@token_required
def add_question(current_user, quiz_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.json
    
    new_question = Question(
        quiz_id=quiz_id,
        question=data['question'],
        type_question=data['type_question'],
        reponse_correcte=data['reponse_correcte'],
        options=data.get('options'),
        points=data.get('points', 1)
    )
    
    db.session.add(new_question)
    db.session.commit()
    
    return jsonify({
        'message': 'Question added successfully',
        'question_id': new_question.id
    }), 201

@app.route('/api/quizzes/<int:quiz_id>/submit', methods=['POST'])
@token_required
def submit_quiz(current_user, quiz_id):
    try:
        app.logger.info("=== DÉBUT SOUMISSION QUIZ ===")
        app.logger.info(f"Quiz ID: {quiz_id}, User ID: {current_user.id}")
        quiz = Quiz.query.get_or_404(quiz_id)
        data = request.json
        
        # Vérifier si l'utilisateur a déjà soumis ce quiz
        existing_result = Result.query.filter_by(
            user_id=current_user.id,
            quiz_id=quiz_id
        ).first()
        
        if existing_result:
            return jsonify({
                'success': False,
                'message': 'Vous avez déjà soumis ce quiz',
                'score': existing_result.score
            }), 400
        
        # Vérifier si le quiz est toujours disponible
        if datetime.utcnow() > quiz.date_fin:
            return jsonify({
                'success': False,
                'message': 'Le délai pour ce quiz est dépassé'
            }), 400
            
        # Calcul du score
        total_score = 0
        total_questions = len(quiz.questions)
        
        if not data.get('answers') or not isinstance(data['answers'], list):
            return jsonify({
                'success': False,
                'message': 'Format des réponses invalide'
            }), 400
            
        # Vérifier chaque réponse
        for answer in data['answers']:
            question = db.session.get(Question, answer.get('question_id'))
            if not question:
                continue
                
            if question.quiz_id != quiz_id:
                continue
                
            # Debug: Log des détails de comparaison
            app.logger.info(f"DEBUG: Question ID {question.id}")
            app.logger.info(f"DEBUG: Type de question: {question.type_question}")
            app.logger.info(f"DEBUG: Réponse correcte stockée: '{question.reponse_correcte}' (type: {type(question.reponse_correcte)})")
            app.logger.info(f"DEBUG: Réponse étudiant: '{answer.get('reponse')}' (type: {type(answer.get('reponse'))})")
            app.logger.info(f"DEBUG: Options disponibles: {question.options}")
            
            # Gestion différente selon le type de question
            if question.type_question == 'choix_multiple':
                # Pour les questions à choix multiples, la réponse correcte peut être un indice ou le texte
                app.logger.info(f"DEBUG: Traitement comme choix_multiple")
                try:
                    if question.options and isinstance(question.options, list):
                        # Si options existe et que reponse_correcte est un indice numérique
                        if str(question.reponse_correcte).isdigit():
                            correct_index = int(question.reponse_correcte)
                            if 0 <= correct_index < len(question.options):
                                # Récupérer le texte de l'option et le nettoyer
                                correct_answer = str(question.options[correct_index]).strip().lower()
                                # Nettoyer l'encodage UTF-8
                                correct_answer = correct_answer.encode('utf-8', errors='ignore').decode('utf-8')
                                app.logger.info(f"DEBUG: Réponse correcte trouvée par indice {correct_index}: '{correct_answer}'")
                            else:
                                app.logger.info(f"DEBUG: Indice {correct_index} invalide pour options de longueur {len(question.options)}")
                                correct_answer = str(question.reponse_correcte).strip().lower()
                        else:
                            # Si c'est directement le texte de l'option
                            correct_answer = str(question.reponse_correcte).strip().lower()
                            correct_answer = correct_answer.encode('utf-8', errors='ignore').decode('utf-8')
                            app.logger.info(f"DEBUG: Réponse correcte directe: '{correct_answer}'")
                    else:
                        correct_answer = str(question.reponse_correcte).strip().lower()
                        correct_answer = correct_answer.encode('utf-8', errors='ignore').decode('utf-8')
                except Exception as e:
                    app.logger.error(f"DEBUG: Erreur lors du traitement choix_multiple: {e}")
                    correct_answer = str(question.reponse_correcte).strip().lower()
            else:
                # Pour les autres types (vrai_faux, texte_libre)
                correct_answer = str(question.reponse_correcte).strip().lower()
                # Nettoyer l'encodage UTF-8
                correct_answer = correct_answer.encode('utf-8', errors='ignore').decode('utf-8')
            
            # Nettoyer la réponse de l'étudiant aussi
            student_answer_raw = str(answer.get('reponse', '')).strip().lower()
            student_answer = student_answer_raw.encode('utf-8', errors='ignore').decode('utf-8')
            
            app.logger.info(f"DEBUG: Réponse normalisée - correcte: '{correct_answer}', étudiant: '{student_answer}'")
            app.logger.info(f"DEBUG: Réponse étudiant brute: '{student_answer_raw}'")
            
            # Gestion spéciale pour les questions vrai/faux avec conversion langue
            if question.type_question == 'vrai_faux':
                # Mapping des équivalences vrai/faux dans différentes langues
                truthy_values = {
                    'vrai': ['vrai', 'true', 'yes', 'oui', '1'],
                    'faux': ['faux', 'false', 'no', 'non', '0']
                }
                
                # Déterminer si la réponse correcte attend "vrai" ou "faux"
                if correct_answer in truthy_values['vrai']:
                    expected_is_true = True
                elif correct_answer in truthy_values['faux']:
                    expected_is_true = False
                else:
                    # Fallback à la comparaison directe
                    expected_is_true = None
                
                # Vérifier si la réponse étudiant correspond
                student_is_true = None
                for true_val in truthy_values['vrai']:
                    if student_answer == true_val:
                        student_is_true = True
                        break
                for false_val in truthy_values['faux']:
                    if student_answer == false_val:
                        student_is_true = False
                        break
                
                if expected_is_true is not None and student_is_true is not None:
                    is_correct = expected_is_true == student_is_true
                    app.logger.info(f"DEBUG: Question vrai/faux - Attendu: {'vrai' if expected_is_true else 'faux'}, Reçu: {'vrai' if student_is_true else 'faux'}")
                else:
                    # Fallback à la comparaison directe si pas de correspondance trouvée
                    is_correct = correct_answer == student_answer
                    app.logger.info(f"DEBUG: Fallback comparaison directe pour vrai/faux")
            else:
                # Comparaison normale pour les autres types
                is_correct = correct_answer == student_answer
            
            # Comparaison avec gestion d'erreurs
            try:
                if is_correct:
                    app.logger.info(f"DEBUG: ✅ Réponse correcte! Ajout de {question.points} points")
                    total_score += question.points
                else:
                    app.logger.error(f"DEBUG: ❌ Réponse incorrecte - Attendu: '{correct_answer}', Reçu: '{student_answer}'")
            except Exception as e:
                app.logger.error(f"DEBUG: Erreur lors de la comparaison: {e}")
                # Fallback: essayer une comparaison plus permissive
                if correct_answer in student_answer or student_answer in correct_answer:
                    app.logger.info(f"DEBUG: ⚠️ Correspondance partielle - Ajout de {question.points} points")
                    total_score += question.points
                else:
                    app.logger.error(f"DEBUG: ❌ Aucune correspondance trouvée")
                
        # Calculer le pourcentage de réussite
        max_score = sum(q.points for q in quiz.questions)
        score_percentage = (total_score / max_score * 100) if max_score > 0 else 0
        
        # Enregistrer le résultat
        result = Result(
            user_id=current_user.id,
            quiz_id=quiz_id,
            score=total_score,
            temps_utilise=data.get('temps_utilise', 0),
            statut='soumis'
        )
        
        db.session.add(result)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Quiz soumis avec succès',
            'data': {
                'score': total_score,
                'max_score': max_score,
                'percentage': score_percentage,
                'total_questions': total_questions,
                'correct_answers': total_score,  # Si chaque question vaut 1 point
                'time_used': data.get('temps_utilise', 0)
            }
        })
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erreur lors de la soumission du quiz: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la soumission du quiz',
            'error': str(e)
        }), 500

# Résultats d'un étudiant
@app.route('/api/student/<int:student_id>/results', methods=['GET'])
@token_required
def get_student_results(current_user, student_id):
    # Autoriser admin ou l'étudiant lui-même
    if current_user.role != 'admin' and current_user.id != student_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    try:
        results = Result.query.filter_by(user_id=student_id).order_by(Result.date_passage.desc()).all()

        data = [{
            'id_resultat': r.id,
            'id_quiz': r.quiz_id,
            'score': r.score,
            'temps_utilise': r.temps_utilise,
            'date_passage': r.date_passage.isoformat() if r.date_passage else None
        } for r in results]

        return jsonify({
            'success': True,
            'data': data
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Erreur lors de la récupération des résultats',
            'details': str(e)
        }), 500

# Route pour créer un nouveau paiement
@app.route('/api/payments', methods=['POST'])
@token_required
def create_payment(current_user):
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'Données manquantes'
            }), 400

        # Vérifier si l'ID de l'étudiant est fourni
        if 'id_etudiant' not in data:
            return jsonify({
                'success': False,
                'error': 'ID étudiant manquant dans les données'
            }), 400

        # Vérifier si l'étudiant existe
        student = User.query.get(data['id_etudiant'])
        if not student:
            return jsonify({
                'success': False,
                'error': f'Aucun étudiant trouvé avec l\'ID {data["id_etudiant"]}'
            }), 404

        # Vérifier les permissions - admin peut créer pour n'importe quel étudiant,
        # étudiant ne peut créer que pour lui-même
        if current_user.role != 'admin' and current_user.id != data['id_etudiant']:
            return jsonify({
                'success': False,
                'error': 'Non autorisé à créer un paiement pour cet étudiant'
            }), 403

        # Valider les données du paiement
        montant = data.get('montant', 0)
        if not isinstance(montant, (int, float)) or montant <= 0:
            return jsonify({
                'success': False,
                'error': 'Le montant doit être un nombre positif'
            }), 400

        # Préparer les données du paiement avec des valeurs par défaut
        payment_data = {
            'user_id': data['id_etudiant'],
            'mode_paiement': data.get('mode_paiement', 'espece'),
            'code_ref_mvola': data.get('code_ref_mvola', ''),
            'montant': montant,
            'statut': data.get('statut', 'en_attente'),
            'tranche_restante': data.get('tranche_restante', 0),
            'date_paiement': data.get('date_paiement') or datetime.utcnow().strftime('%Y-%m-%d')
        }

        # Créer le paiement
        new_payment = Payment(**payment_data)
        db.session.add(new_payment)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Paiement enregistré avec succès',
            'payment_id': new_payment.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Une erreur est survenue lors de la création du paiement',
            'details': str(e)
        }), 500

# Route pour récupérer les paiements (admin)
@app.route('/api/admin/payments', methods=['GET', 'OPTIONS'])
def get_payments():
    print("\n=== Début de la requête GET /api/admin/payments ===")

    if request.method == 'OPTIONS':
        print("Réponse à une requête OPTIONS (prévol CORS)")
        return jsonify({}), 200

    try:
        # Récupérer les paiements avec les informations des utilisateurs
        payments = db.session.query(
            Payment,
            User.username,
            User.email
        ).join(
            User, Payment.user_id == User.id
        ).all()

        print(f"Nombre de paiements trouvés: {len(payments)}")

        # Préparer les données de réponse avec la structure attendue par le frontend
        result = []
        for p, username, email in payments:
            payment_data = {
                'id_paiement': p.id,  # Frontend attend id_paiement
                'id_etudiant': p.user_id,  # Frontend attend id_etudiant
                'user_id': p.user_id,
                'mode_paiement': p.mode_paiement,
                'code_ref_mvola': p.code_ref_mvola,
                'montant': float(p.montant) if p.montant else 0,
                'statut': p.statut,
                'tranche_restante': float(p.tranche_restante) if p.tranche_restante else 0,
                'date_paiement': p.date_paiement.isoformat() if p.date_paiement else None,
                'reference': f"REF-{p.id}",
                'commentaire': f"Paiement {p.mode_paiement} du {p.date_paiement.strftime('%d/%m/%Y') if p.date_paiement else 'date inconnue'}"
            }
            result.append(payment_data)

        print("Données des paiements:", result)

        response = jsonify({
            'success': True,
            'data': result
        })

        print("Réponse envoyée avec succès")
        return response

    except Exception as e:
        print(f"Erreur lors de la récupération des paiements: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Une erreur est survenue lors de la récupération des paiements',
            'details': str(e)
        }), 500

# Route pour valider un paiement (admin)
@app.route('/api/admin/payments/<int:payment_id>/validate', methods=['POST', 'OPTIONS'])
def validate_payment(payment_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        # Récupérer le paiement
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({
                'success': False,
                'error': 'Paiement non trouvé'
            }), 404
        
        # Récupérer l'utilisateur associé
        user = User.query.get(payment.user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Utilisateur non trouvé'
            }), 404
        
        # Valider le paiement
        payment.statut = 'complet'
        payment.tranche_restante = 0
        
        # Activer l'utilisateur
        user.actif = True
        
        # Générer un nouveau code d'authentification
        import random
        import string
        new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        user.code_auth = new_code
        
        db.session.commit()
        
        print(f"Paiement {payment_id} validé pour l'utilisateur {user.email}")
        print(f"Nouveau code d'authentification: {new_code}")
        
        return jsonify({
            'success': True,
            'message': 'Paiement validé et utilisateur activé',
            'data': {
                'code_auth': new_code,
                'user_email': user.email
            }
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la validation du paiement: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erreur lors de la validation du paiement',
            'details': str(e)
        }), 500

# Route pour marquer un paiement comme partiel (admin)
@app.route('/api/admin/payments/<int:payment_id>/partial', methods=['POST', 'OPTIONS'])
def mark_partial_payment(payment_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        # Récupérer le paiement
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({
                'success': False,
                'error': 'Paiement non trouvé'
            }), 404
        
        # Récupérer l'utilisateur associé
        user = User.query.get(payment.user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Utilisateur non trouvé'
            }), 404
        
        # Marquer comme paiement partiel
        payment.statut = 'par_tranche'
        payment.tranche_restante = 25000  # Montant restant par défaut
        
        # Activer l'utilisateur avec accès partiel
        user.actif = True
        
        # Générer un nouveau code d'authentification
        import random
        import string
        new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        user.code_auth = new_code
        
        db.session.commit()
        
        print(f"Paiement {payment_id} marqué comme partiel pour l'utilisateur {user.email}")
        print(f"Nouveau code d'authentification: {new_code}")
        
        return jsonify({
            'success': True,
            'message': 'Paiement partiel validé et utilisateur activé',
            'data': {
                'code_auth': new_code,
                'user_email': user.email
            }
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la validation partielle: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erreur lors de la validation partielle',
            'details': str(e)
        }), 500

# Route pour rejeter un paiement (admin)
@app.route('/api/admin/payments/<int:payment_id>/reject', methods=['POST', 'OPTIONS'])
def reject_payment(payment_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        # Récupérer le paiement
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({
                'success': False,
                'error': 'Paiement non trouvé'
            }), 404
        
        # Supprimer le paiement
        db.session.delete(payment)
        db.session.commit()
        
        print(f"Paiement {payment_id} rejeté et supprimé")
        
        return jsonify({
            'success': True,
            'message': 'Paiement rejeté et supprimé'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors du rejet du paiement: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erreur lors du rejet du paiement',
            'details': str(e)
        }), 500

# Route pour lister les utilisateurs (à des fins de débogage uniquement)
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

# Routes pour les documents
@app.route('/api/documents', methods=['GET'])
@token_required
def get_documents(current_user):
    """Liste les documents qui existent physiquement"""
    try:
        documents = Document.query.all()

        # Filtrer pour ne garder que les documents dont les fichiers existent
        existing_documents = []
        for doc in documents:
            # Construire le chemin complet du fichier
            filepath = os.path.join(UPLOAD_FOLDER, os.path.basename(doc.chemin))
            if os.path.exists(filepath):
                existing_documents.append(doc)
            else:
                app.logger.warning(f"Document {doc.id} ({doc.titre}) référencé en base mais fichier manquant: {filepath}")

        return jsonify({
            'success': True,
            'data': [{
                'id_document': doc.id,
                'id': doc.id,
                'titre': doc.titre,
                'type': doc.type,
                'chemin': doc.chemin,
                'telechargeable': doc.telechargeable,
                'date_upload': doc.date_upload.isoformat(),
                'file_exists': True  # Tous ces documents existent physiquement
            } for doc in existing_documents]
        })
    except Exception as e:
        app.logger.error(f"Erreur lors de la récupération des documents: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erreur lors de la récupération des documents',
            'details': str(e)
        }), 500

# Route pour servir les documents de manière sécurisée (avec vérification d'authentification)
@app.route('/api/documents/<int:document_id>/download')
@token_required
def download_document_by_id(current_user, document_id):
    """Téléchargement sécurisé d'un document - nécessite une authentification valide"""
    try:
        doc = Document.query.get_or_404(document_id)

        # Vérifier si le document est téléchargeable
        if not doc.telechargeable:
            return jsonify({'success': False, 'error': 'Document non téléchargeable'}), 403

        # Vérifier que l'utilisateur a le droit d'accéder au document
        if current_user.role == 'student':
            # Les étudiants peuvent télécharger les documents marqués comme téléchargeables
            pass  # L'utilisateur est authentifié, on autorise
        elif current_user.role == 'admin':
            # Les admins peuvent tout télécharger
            pass
        else:
            return jsonify({'success': False, 'error': 'Accès non autorisé'}), 403

        # Servir le fichier de manière sécurisée
        return send_from_directory(UPLOAD_FOLDER, os.path.basename(doc.chemin), as_attachment=True)

    except Exception as e:
        app.logger.error(f"Erreur lors du téléchargement du document {document_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Erreur lors du téléchargement'}), 500

# Route pour la prévisualisation sécurisée des documents
@app.route('/api/documents/<int:document_id>/preview')
@token_required
def preview_document(current_user, document_id):
    """Prévisualisation sécurisée d'un document"""
    try:
        doc = Document.query.get_or_404(document_id)

        # Vérifier que l'utilisateur a le droit d'accéder au document
        if current_user.role not in ['admin', 'student']:
            return jsonify({'success': False, 'error': 'Accès non autorisé'}), 403

        # Servir le fichier pour prévisualisation (pas en téléchargement)
        return send_from_directory(UPLOAD_FOLDER, os.path.basename(doc.chemin))

    except Exception as e:
        app.logger.error(f"Erreur lors de la prévisualisation du document {document_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Erreur lors de la prévisualisation'}), 500
@app.route('/api/documents/<filename>/view')
def view_document(filename):
    """Route de visualisation avec logging détaillé"""
    client_ip = request.remote_addr
    user_agent = request.headers.get('User-Agent', '')

    app.logger.info(f"🔍 ACCÈS VISUALISATION: IP={client_ip}, UA='{user_agent[:100]}', FILE='{filename}'")

    # Vérifier d'abord si le fichier existe
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        app.logger.warning(f"❌ FICHIER NON TROUVÉ: IP={client_ip}, FILE='{filename}'")
        return jsonify({
            'success': False,
            'error': 'Fichier non trouvé',
            'code': 'FILE_NOT_FOUND'
        }), 404

    # BLOQUER LES TÉLÉCHARGEURS
    if block_advanced_downloaders():
        app.logger.warning(f"🚫 TÉLÉCHARGEUR BLOQUÉ: IP={client_ip}, UA='{user_agent[:100]}', FILE='{filename}'")
        return jsonify({
            'success': False,
            'error': 'Accès refusé aux téléchargeurs automatiques',
            'code': 'BLOCKED_DOWNLOADER'
        }), 403

    # Utilisateur autorisé - rediriger vers le visualiseur sécurisé
    app.logger.info(f"✅ VISUALISATION AUTORISÉE: IP={client_ip}, UA='{user_agent[:100]}', FILE='{filename}'")
    return redirect(f'/static/pdf-viewer.html?file={filename}&url=/api/documents/{filename}/serve')

@app.route('/api/documents/<filename>/serve')
def serve_document_directly(filename):
    """Sert le PDF directement pour l'iframe"""
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    # Vérifier que le fichier existe
    if not os.path.exists(filepath):
        abort(404, "Fichier non trouvé")

    response = send_file(
        filepath,
        mimetype='application/pdf',
        conditional=True
    )

    # Headers pour forcer l'affichage en ligne dans l'iframe
    response.headers['Content-Disposition'] = f'inline; filename="{filename}"'
    response.headers['Cache-Control'] = 'public, max-age=3600'
    response.headers['X-Content-Type-Options'] = 'nosniff'
# Route de logging de sécurité
@app.route('/api/log/access', methods=['POST'])
def log_security_access():
    """Log les tentatives d'accès pour monitoring de sécurité"""
    try:
        data = request.get_json() or {}
        app.logger.warning(f"SECURITY_LOG: {request.remote_addr} - {request.headers.get('User-Agent', '')[:100]} - {data}")

        return jsonify({'success': True}), 200
    except Exception as e:
        app.logger.error(f"Erreur lors du logging de sécurité: {str(e)}")
        return jsonify({'success': False}), 500

@app.route('/api/log/viewer-access', methods=['POST'])
def log_viewer_access():
    """Log spécifique pour le visualiseur PDF"""
    try:
        data = request.get_json() or {}
        log_entry = {
            'ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', '')[:200],
            'filename': data.get('filename', 'unknown'),
            'action': data.get('action', 'unknown'),
            'violations': data.get('violations', 0),
            'timestamp': datetime.utcnow().isoformat()
        }

        app.logger.info(f"PDF_VIEWER_LOG: {log_entry}")

        # Ici vous pourriez sauvegarder dans une base de données
        # ou envoyer vers un système de monitoring externe

        return jsonify({'success': True}), 200
    except Exception as e:
        app.logger.error(f"Erreur lors du logging viewer: {str(e)}")
        return jsonify({'success': False}), 500

@app.route('/api/documents/<filename>/download')
def download_document_by_filename(filename):
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    # ENVOYER EN MODE ATTACHMENT (téléchargement)
    return send_file(
        filepath,
        as_attachment=True,   # ← Téléchargement forcé
        download_name=filename
    )
@app.route('/api/student/<int:student_id>/payments', methods=['GET'])
@token_required
def get_student_payments(current_user, student_id):
    # Vérifier que l'utilisateur peut accéder à ces données
    if current_user.role != 'admin' and current_user.id != student_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    try:
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
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Erreur lors de la récupération des paiements',
            'details': str(e)
        }), 500

# Route pour les notifications d'un étudiant spécifique
@app.route('/api/student/<int:student_id>/notifications', methods=['GET'])
@token_required
def get_student_notifications(current_user, student_id):
    # Vérifier que l'utilisateur peut accéder à ces données
    if current_user.role != 'admin' and current_user.id != student_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    try:
        # Notifications destinées à tous + notifications ciblées à l'étudiant
        notifications = Notification.query.filter(
            (Notification.type_cible == 'tous') | (Notification.id_etudiant == student_id)
        ).order_by(Notification.date_envoi.desc()).all()

        notifications_data = [{
            'id_notification': n.id,
            'titre': n.titre,
            'message': n.message,
            'type_cible': n.type_cible,
            'id_etudiant': n.id_etudiant,
            'date_envoi': n.date_envoi.isoformat(),
            # Placeholder: pas de suivi par étudiant pour "lu" côté backend pour l'instant
            'lu': False
        } for n in notifications]
        
        return jsonify({
            'success': True,
            'data': notifications_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Erreur lors de la récupération des notifications',
            'details': str(e)
        }), 500

# Routes Admin pour notifications
@app.route('/api/admin/notifications', methods=['GET'])
@token_required
def list_notifications(current_user):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    try:
        notifications = Notification.query.order_by(Notification.date_envoi.desc()).all()
        return jsonify({
            'success': True,
            'data': [{
                'id_notification': n.id,
                'titre': n.titre,
                'message': n.message,
                'type_cible': n.type_cible,
                'id_etudiant': n.id_etudiant,
                'date_envoi': n.date_envoi.isoformat()
            } for n in notifications]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Erreur lors de la récupération des notifications', 'details': str(e)}), 500

@app.route('/api/admin/notifications', methods=['POST'])
@token_required
def create_notification(current_user):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    try:
        data = request.get_json() or {}
        titre = (data.get('titre') or '').strip()
        message = (data.get('message') or '').strip()
        type_cible = (data.get('type_cible') or 'tous').strip()
        id_etudiant = data.get('id_etudiant')

        if not titre or not message:
            return jsonify({'success': False, 'error': 'Titre et message requis'}), 400
        if type_cible not in ['tous', 'individuel']:
            return jsonify({'success': False, 'error': 'type_cible invalide'}), 400
        if type_cible == 'individuel' and not id_etudiant:
            return jsonify({'success': False, 'error': 'id_etudiant requis pour type_cible=individuel'}), 400

        notif = Notification(
            titre=titre,
            message=message,
            type_cible=type_cible,
            id_etudiant=id_etudiant if type_cible == 'individuel' else None
        )
        db.session.add(notif)
        db.session.commit()

        return jsonify({'success': True, 'data': {
            'id_notification': notif.id,
            'date_envoi': notif.date_envoi.isoformat()
        }})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Erreur lors de la création', 'details': str(e)}), 500

# Placeholder: marquer une notification comme lue (pas de persistance par étudiant pour l'instant)
@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
@token_required
def mark_notification_read(current_user, notification_id):
    try:
        exists = Notification.query.get(notification_id)
        if not exists:
            return jsonify({'success': False, 'error': 'Notification non trouvée'}), 404
        # Rien à persister pour l'instant
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': 'Erreur lors du marquage', 'details': str(e)}), 500

@app.route('/api/documents', methods=['POST'])
@token_required
def add_document(current_user):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'Aucun fichier fourni'}), 400

        file = request.files['file']
        titre = request.form.get('titre', '')
        doc_type = request.form.get('type', 'pdf')
        telechargeable = request.form.get('telechargeable', 'true').lower() == 'true'

        if not file or file.filename == '' or not titre:
            return jsonify({'success': False, 'message': 'Champs requis manquants'}), 400

        if not allowed_file(file.filename):
            return jsonify({'success': False, 'message': 'Type de fichier non autorisé'}), 400

        filename = file.filename
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(save_path)

        # Enregistrer en base
        new_doc = Document(
            titre=titre,
            type=doc_type,
            chemin=f"/uploads/{filename}",
            telechargeable=telechargeable,
            uploaded_by=current_user.id
        )
        db.session.add(new_doc)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'id_document': new_doc.id,
                'titre': new_doc.titre
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erreur lors de l\'upload', 'details': str(e)}), 500

@app.route('/api/admin/documents/<int:document_id>', methods=['PATCH'])
@token_required
def update_document(current_user, document_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    try:
        doc = Document.query.get(document_id)
        if not doc:
            return jsonify({'success': False, 'message': 'Document non trouvé'}), 404

        data = request.get_json() or {}
        if 'telechargeable' in data:
            doc.telechargeable = bool(data['telechargeable'])

        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erreur lors de la mise à jour', 'details': str(e)}), 500

@app.route('/api/admin/documents/<int:document_id>', methods=['DELETE'])
@token_required
def delete_document_api(current_user, document_id):
    """Suppression complète d'un document (base + fichier physique)"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    try:
        doc = Document.query.get(document_id)
        if not doc:
            return jsonify({'success': False, 'message': 'Document non trouvé'}), 404

        # Construire le chemin complet du fichier
        filepath = os.path.join(UPLOAD_FOLDER, os.path.basename(doc.chemin))

        # Supprimer le fichier physique s'il existe
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                app.logger.info(f"Fichier supprimé physiquement: {filepath}")
            except Exception as e:
                app.logger.error(f"Erreur lors de la suppression du fichier {filepath}: {str(e)}")
                # Continuer quand même pour supprimer l'entrée en base
        else:
            app.logger.warning(f"Fichier {filepath} déjà absent du disque")

        # Supprimer l'entrée en base de données
        db.session.delete(doc)
        db.session.commit()

        app.logger.info(f"Document {document_id} ({doc.titre}) supprimé complètement")
        return jsonify({
            'success': True,
            'message': 'Document supprimé avec succès (base + fichier)'
        })

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erreur lors de la suppression du document {document_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la suppression',
            'details': str(e)
        }), 500

# Route de nettoyage pour supprimer les entrées orphelines (admin seulement)
@app.route('/api/admin/documents/cleanup', methods=['POST'])
@token_required
def cleanup_orphaned_documents(current_user):
    """Nettoie les entrées de base de données dont les fichiers n'existent plus"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    try:
        documents = Document.query.all()
        cleaned_count = 0

        for doc in documents:
            # Construire le chemin complet du fichier
            filepath = os.path.join(UPLOAD_FOLDER, os.path.basename(doc.chemin))

            # Si le fichier n'existe pas physiquement, supprimer l'entrée en base
            if not os.path.exists(filepath):
                app.logger.info(f"Suppression entrée orpheline: {doc.titre} (ID: {doc.id})")
                db.session.delete(doc)
                cleaned_count += 1

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Nettoyage terminé: {cleaned_count} entrées supprimées',
            'cleaned_count': cleaned_count
        })

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erreur lors du nettoyage: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors du nettoyage',
            'details': str(e)
        }), 500

# Route pour modifier un quiz existant (admin seulement, remplace complètement le quiz et ses questions existantes)
@app.route('/api/admin/quiz/<int:quiz_id>', methods=['PUT'])
@token_required
def update_quiz(current_user, quiz_id):
    try:
        if current_user.role != 'admin':
            return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
            
        quiz = Quiz.query.get_or_404(quiz_id)
        data = request.get_json()

        print(f"\n{'='*50}")
        print(f"DEBUG: MISE À JOUR DU QUIZ ID {quiz_id}")
        print(f"{'='*50}")

        print(f"DEBUG: DONNÉES COMPLÈTES REÇUES:")
        print(f"DEBUG: {data}")

        if data:
            print(f"DEBUG: Champs reçus: {list(data.keys())}")
            print(f"DEBUG: Questions reçues: {len(data.get('questions', []))}")

            # Afficher chaque question en détail
            for i, q in enumerate(data.get('questions', []), 1):
                print(f"DEBUG: Question {i}:")
                print(f"  - question: {q.get('question', 'N/A')}")
                print(f"  - type_question: {q.get('type_question', 'N/A')}")
                print(f"  - reponse_correcte: {q.get('reponse_correcte', 'N/A')}")
                print(f"  - options: {q.get('options', 'N/A')}")
                print(f"  - points: {q.get('points', 'N/A')}")
        else:
            print(f"DEBUG: AUCUNE DONNÉE REÇUE!")

        print(f"{'='*50}\n")
        
        # Validation des données requises
        required_fields = ['titre', 'type', 'date_debut', 'date_fin', 'duree', 'questions']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Champ manquant: {field}'}), 400
        
        # Validation des dates
        try:
            print(f"DEBUG: Tentative de parsing des dates")
            print(f"DEBUG: date_debut reçu: '{data['date_debut']}'")
            print(f"DEBUG: date_fin reçu: '{data['date_fin']}'")

            # Essayer de parser directement avec fromisoformat
            try:
                date_debut = datetime.fromisoformat(data['date_debut'].replace('Z', '+00:00'))
                date_fin = datetime.fromisoformat(data['date_fin'].replace('Z', '+00:00'))
                print(f"DEBUG: Parsing direct réussi - debut: {date_debut}, fin: {date_fin}")
            except ValueError as e:
                print(f"DEBUG: Parsing direct échoué: {e}")
                # Essayer sans les millisecondes si présentes
                try:
                    date_debut_str = data['date_debut'].split('.')[0] + '+00:00'
                    date_fin_str = data['date_fin'].split('.')[0] + '+00:00'
                    date_debut = datetime.fromisoformat(date_debut_str)
                    date_fin = datetime.fromisoformat(date_fin_str)
                    print(f"DEBUG: Parsing sans millisecondes réussi - debut: {date_debut}, fin: {date_fin}")
                except ValueError as e2:
                    print(f"DEBUG: Parsing sans millisecondes échoué: {e2}")
                    # Essayer avec format personnalisé
                    try:
                        # Format: YYYY-MM-DDTHH:MM:SS
                        date_debut = datetime.strptime(data['date_debut'], '%Y-%m-%dT%H:%M:%S')
                        date_fin = datetime.strptime(data['date_fin'], '%Y-%m-%dT%H:%M:%S')
                        # Ajouter le timezone UTC pour éviter les problèmes de comparaison
                        date_debut = date_debut.replace(tzinfo=timezone.utc)
                        date_fin = date_fin.replace(tzinfo=timezone.utc)
                        print(f"DEBUG: Parsing personnalisé réussi - debut: {date_debut}, fin: {date_fin}")
                    except ValueError as e3:
                        print(f"DEBUG: Parsing personnalisé échoué: {e3}")
                        raise ValueError(f"Impossible de parser les dates: {e}")

            # S'assurer que les dates ont bien un timezone
            if date_debut.tzinfo is None:
                date_debut = date_debut.replace(tzinfo=timezone.utc)
            if date_fin.tzinfo is None:
                date_fin = date_fin.replace(tzinfo=timezone.utc)

            print(f"DEBUG: Dates finales avec timezone - debut: {date_debut}, fin: {date_fin}")

            if date_debut >= date_fin:
                return jsonify({'success': False, 'message': 'La date de fin doit être postérieure à la date de début'}), 400

            if date_debut < datetime.now(timezone.utc):
                return jsonify({'success': False, 'message': 'La date de début ne peut pas être dans le passé'}), 400

        except Exception as e:
            print(f"DEBUG: Erreur lors du parsing des dates: {e}")
            return jsonify({'success': False, 'message': f'Format de date invalide: {str(e)}'}), 400
        
        # Mise à jour des informations du quiz
        quiz.titre = data['titre']
        quiz.type = data['type']
        quiz.date_debut = date_debut
        quiz.date_fin = date_fin
        quiz.duree = int(data['duree'])
        quiz.statut = data.get('statut', 'brouillon')
        
        # Supprimer les questions existantes
        Question.query.filter_by(quiz_id=quiz_id).delete(synchronize_session=False)
        
        # Valider et créer les nouvelles questions
        questions = data.get('questions', [])
        total_points = 0
        
        if not isinstance(questions, list):
            return jsonify({'success': False, 'message': 'Le format des questions est invalide'}), 400
            
        for i, q in enumerate(questions, 1):
            question_text = q.get('question', '').strip()
            type_question = q.get('type_question')
            reponse_correcte = q.get('reponse_correcte')
            options = q.get('options', [])
            points = max(1, int(q.get('points', 1)))  # Au moins 1 point par question

            print(f"DEBUG: Question {i}:")
            print(f"  - question_text: '{question_text}'")
            print(f"  - type_question: {type_question}")
            print(f"  - reponse_correcte: {reponse_correcte}")
            print(f"  - options: {options}")
            print(f"  - options type: {type(options)}")
            print(f"  - options length: {len(options) if options else 0}")

            # Validation des champs obligatoires
            if not question_text:
                return jsonify({'success': False, 'message': f'La question {i} est vide'}), 400

            if not type_question or type_question not in ['choix_multiple', 'vrai_faux', 'texte_libre']:
                return jsonify({'success': False, 'message': f'Type de question invalide pour la question {i}'}), 400

            if type_question == 'choix_multiple' and not options:
                print(f"DEBUG: Options manquantes pour question {i} de type {type_question}")
                return jsonify({'success': False, 'message': f'Options manquantes pour la question {i}'}), 400

            if type_question == 'choix_multiple' and not isinstance(options, list):
                return jsonify({'success': False, 'message': f'Format des options invalide pour la question {i}'}), 400

            if type_question in ['choix_multiple', 'vrai_faux'] and reponse_correcte is None:
                return jsonify({'success': False, 'message': f'Réponse correcte manquante pour la question {i}'}), 400
            
            # Création de la question
            new_q = Question(
                quiz_id=quiz_id,
                question=question_text,
                type_question=type_question,
                reponse_correcte=str(reponse_correcte) if reponse_correcte is not None else '',
                options=options if isinstance(options, list) and type_question == 'choix_multiple' else [],
                points=points
            )
            db.session.add(new_q)
            total_points += points
        
        # Mise à jour du total des points
        quiz.total_points = total_points
        
        # Validation du nombre de questions
        if not questions:
            return jsonify({'success': False, 'message': 'Le quiz doit contenir au moins une question'}), 400
        
        # Validation du temps alloué
        if quiz.duree < 1:
            return jsonify({'success': False, 'message': 'La durée doit être d\'au moins 1 minute'}), 400
            
        # Validation du nombre maximum de questions (optionnel)
        if len(questions) > 100:  # Limite arbitraire
            return jsonify({'success': False, 'message': 'Le nombre maximum de questions est de 100'}), 400
        
        # Validation du nombre maximum de points (optionnel)
        if total_points > 1000:  # Limite arbitraire
            return jsonify({'success': False, 'message': 'Le nombre maximum de points est de 1000'}), 400
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Quiz mis à jour avec succès',
            'quiz_id': quiz.id,
            'total_questions': len(questions),
            'total_points': total_points
        })
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Erreur lors de la mise à jour du quiz {quiz_id}: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Une erreur est survenue lors de la mise à jour du quiz',
            'error': str(e)
        }), 500

# Route pour supprimer un quiz (admin seulement)
@app.route('/api/admin/quiz/<int:quiz_id>', methods=['DELETE'])
@token_required
def delete_quiz(current_user, quiz_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    quiz = Quiz.query.get_or_404(quiz_id)
    
    # Supprimer les questions liées
    Question.query.filter_by(quiz_id=quiz_id).delete()
    
    # Supprimer les résultats liés
    Result.query.filter_by(quiz_id=quiz_id).delete()
    
    # Supprimer le quiz
    db.session.delete(quiz)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Quiz supprimé avec succès'
    })

# Route pour changer le statut d'un quiz (admin seulement)
@app.route('/api/admin/quiz/<int:quiz_id>/status', methods=['PATCH'])
@token_required
def change_quiz_status(current_user, quiz_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.json
    
    new_status = data.get('statut')
    if new_status not in ['actif', 'inactif', 'planifie', 'clos']:
        return jsonify({'message': 'Statut invalide'}), 400
        
    quiz.statut = new_status
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Statut du quiz changé en {new_status}'
    })

# Point d'entrée principal pour démarrer le serveur
if __name__ == '__main__':
    with app.app_context():
        # Créer les tables si elles n'existent pas (pour le développement)
        db.create_all()

    # Démarrer le serveur Flask
    app.run(host='0.0.0.0', port=5000, debug=False)
