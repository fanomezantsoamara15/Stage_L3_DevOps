# Dockerisation du Frontend React

Ce guide explique comment utiliser Docker pour déployer le frontend React de l'application Quiz Connect.

## Structure Docker

L'image Docker du frontend utilise une approche multi-étapes :

1. **Étape de build** : Utilise Node.js 18 pour construire l'application
2. **Étape de production** : Utilise Nginx Alpine pour servir les fichiers statiques

## Configuration Nginx

Le frontend utilise Nginx avec une configuration optimisée pour les applications React :

- **SPA Routing** : Support complet pour les routes React (navigation sans rechargement)
- **Cache optimisé** : Headers de cache configurés pour les assets statiques
- **Proxy API** : Redirection automatique des appels API vers le backend
- **Sécurité** : Headers de sécurité appropriés

## Variables d'environnement

Le frontend utilise les variables d'environnement suivantes :

```bash
# Configuration du serveur de développement (vite.config.ts)
VITE_API_BASE_URL=http://localhost:5000/api
```

## Démarrage

### Avec Docker Compose (recommandé)

```bash
# Construire et démarrer le frontend
docker-compose up frontend --build

# Ou démarrer tous les services
docker-compose up --build
```

### Avec Docker uniquement

```bash
# Construire l'image
docker build -t quiz-connect-frontend ./quiz-connect-forge

# Démarrer le conteneur
docker run -p 80:80 quiz-connect-frontend
```

## Développement

### Redémarrage après modifications

```bash
# Arrêter le frontend
docker-compose stop frontend

# Reconstruire l'image
docker-compose build frontend

# Redémarrer
docker-compose up -d frontend
```

### Logs du frontend

```bash
# Voir les logs du frontend
docker-compose logs frontend

# Suivre les logs en temps réel
docker-compose logs -f frontend
```

## Configuration de production

### Variables d'environnement de build

Pour la production, définissez ces variables lors du build :

```bash
# Build optimisé pour la production
docker build --build-arg NODE_ENV=production -t quiz-connect-frontend ./quiz-connect-forge
```

### Configuration Nginx personnalisée

Si vous devez modifier la configuration Nginx :

1. Éditez le fichier `quiz-connect-forge/nginx.conf`
2. Rebuild l'image : `docker-compose build frontend`

## Dépannage

### Problème de connexion au backend

Si le frontend ne peut pas se connecter au backend :

1. Vérifiez que le service backend est démarré : `docker-compose ps`
2. Vérifiez les logs du backend : `docker-compose logs backend`
3. Vérifiez la configuration du proxy dans `nginx.conf`

### Port 80 déjà utilisé

Si le port 80 est déjà utilisé :

```yaml
# Dans docker-compose.yml
ports:
  - "8080:80"  # Frontend sur le port 8080
```

### Rebuild forcé

Pour forcer la reconstruction complète :

```bash
# Supprimer l'image existante
docker-compose down
docker rmi $(docker images -q quiz-connect-frontend)

# Rebuild
docker-compose build frontend
docker-compose up frontend
```

## Optimisations

### Build multi-étapes

Le Dockerfile utilise des étapes de build séparées pour :
- Réduire la taille de l'image finale
- Optimiser les performances
- Sécuriser l'environnement de production

### Cache des dépendances

Le `.dockerignore` exclut les fichiers inutiles pour :
- Accélérer le processus de build
- Réduire la taille du contexte de build
- Éviter les conflits de cache

## Sécurité

- **Image minimale** : Nginx Alpine pour réduire la surface d'attaque
- **Headers de sécurité** : XSS, CSRF, Content-Type protection
- **Non-root user** : Nginx s'exécute avec des privilèges limités
