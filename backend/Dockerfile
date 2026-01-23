# Utiliser l'image Python officielle comme image de base
FROM python:3.11-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copier le fichier requirements.txt depuis le répertoire backend
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source de l'application depuis le répertoire backend
COPY . .

# Créer le répertoire uploads s'il n'existe pas
RUN mkdir -p uploads

# Exposer le port sur lequel l'application Flask s'exécute
EXPOSE 5000

# Définir les variables d'environnement pour la production
ENV FLASK_APP=main.py
ENV FLASK_ENV=production
ENV FLASK_DEBUG=False

# Commande pour démarrer l'application
CMD ["python", "main.py"]
