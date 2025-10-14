from . import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')
    telephone = db.Column(db.String(20))
    notes = db.Column(db.Text)
    date_inscription = db.Column(db.DateTime, default=datetime.utcnow)
    actif = db.Column(db.Boolean, default=False)
    code_auth = db.Column(db.String(50))  # Code d'authentification
    
    # Relation avec les paiements
    payments = db.relationship('Payment', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    montant = db.Column(db.Float, nullable=False)
    mode_paiement = db.Column(db.String(50), nullable=False)
    code_ref_mvola = db.Column(db.String(100))
    statut = db.Column(db.String(20), default='en_attente')  # en_attente, valide, refuse
    date_paiement = db.Column(db.DateTime, default=datetime.utcnow)
    tranche_restante = db.Column(db.Float, default=0.0)
    
    def __repr__(self):
        return f'<Payment {self.id} - {self.montant} Ar - {self.statut}>'
