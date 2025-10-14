# Dockerisation du Backend Quiz Connect

Ce guide explique comment utiliser Docker pour déployer l'application Quiz Connect avec tous ses services.

## Prérequis

- Docker installé sur votre système
- Docker Compose installé sur votre système

## Structure des services

L'environnement Docker comprend trois services principaux :

1. **Backend** (Flask) - Port 5000
2. **Frontend** (React) - Port 80
3. **Base de données** (MySQL) - Port 3306

## Démarrage de l'environnement

### 1. Construire et démarrer tous les services

```bash
docker-compose up --build
```

Cette commande va :
- Construire l'image Docker du backend
- Télécharger et démarrer MySQL
- Construire et démarrer le frontend
- Créer les volumes nécessaires

### 2. Démarrer les services en arrière-plan

```bash
docker-compose up -d --build
```

### 3. Arrêter les services

```bash
docker-compose down
```

### 4. Arrêter et supprimer les volumes

```bash
docker-compose down -v
```

## Accès à l'application

- **Frontend** : http://localhost:80
- **Backend API** : http://localhost:5000
- **Base de données** : localhost:3306

## Variables d'environnement

Les variables d'environnement sont configurées dans le fichier `docker-compose.yml` :

### Backend
- `FLASK_APP=app.py`
- `FLASK_ENV=production`
- `MYSQL_HOST=db` (nom du service MySQL)
- Variables de messagerie configurées pour Gmail

### Base de données
- `MYSQL_ROOT_PASSWORD=rootpassword`
- `MYSQL_DATABASE=quiz_connect`

## Développement

### Recharger le backend après modifications

```bash
# Arrêter le backend
docker-compose stop backend

# Reconstruire l'image
docker-compose build backend

# Redémarrer
docker-compose up -d backend
```

### Logs des services

```bash
# Voir les logs de tous les services
docker-compose logs

# Voir les logs d'un service spécifique
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Suivre les logs en temps réel
docker-compose logs -f
```

## Volumes persistants

- `mysql_data` : Contient les données MySQL
- `./backend/uploads:/app/uploads` : Partage le dossier uploads du backend

## Dépannage

### Problème de connexion à la base de données

Si le backend ne peut pas se connecter à MySQL, vérifiez :

1. Que le service MySQL est démarré : `docker-compose ps`
2. Que la base de données est prête : `docker-compose logs db`
3. Les variables d'environnement MySQL dans le docker-compose.yml

### Port déjà utilisé

Si les ports 80, 5000 ou 3306 sont déjà utilisés, modifiez les mappings dans le docker-compose.yml :

```yaml
ports:
  - "8080:80"     # Frontend sur le port 8080
  - "5001:5000"   # Backend sur le port 5001
  - "3307:3306"   # MySQL sur le port 3307
```

### Réinitialiser la base de données

```bash
# Arrêter les services
docker-compose down

# Supprimer le volume MySQL
docker volume rm clone-et-backend_mysql_data

# Redémarrer
docker-compose up -d
```

## Configuration de production

Pour la production, modifiez les variables suivantes dans le docker-compose.yml :

1. Changez `FLASK_ENV=production`
2. Définissez `FLASK_DEBUG=False`
3. Utilisez des mots de passe forts
4. Configurez des variables d'environnement sécurisées
5. Envisagez d'utiliser un reverse proxy (nginx) pour le frontend
