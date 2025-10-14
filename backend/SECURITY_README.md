# 🔒 **Protection PDF contre les Téléchargeurs Automatiques**

## **Solution complète de cybersécurité gratuite/open-source**

Cette solution protège vos documents PDF contre les téléchargeurs automatiques (IDM, wget, curl, etc.) tout en permettant une visualisation sécurisée dans le navigateur.

---

## 🚀 **Fonctionnalités**

### ✅ **Protection Multi-Couches**
- **Détection avancée** de 30+ téléchargeurs automatiques
- **Visualiseur PDF.js sécurisé** avec protection côté client
- **Headers de sécurité renforcés**
- **Monitoring en temps réel** des tentatives d'accès
- **Logging détaillé** pour analyse de sécurité

### ✅ **Outils Gratuits/Open-Source**
- **PDF.js** - Bibliothèque JavaScript pour affichage PDF
- **Flask** - Framework web Python (gratuit)
- **Scripts personnalisés** - Détection et protection avancées

---

## 📁 **Structure du Projet**

```
backend/
├── app.py                 # Application Flask principale
├── security_monitor.py    # Script de monitoring de sécurité
├── security_config.py     # Configuration de sécurité
├── test_security.py       # Script de tests
├── static/
│   └── pdf-viewer.html    # Visualiseur PDF sécurisé
└── requirements.txt       # Dépendances Python
```

---

## 🛠️ **Installation et Configuration**

### 1. **Installation des dépendances**
```bash
pip install flask pdf.js  # PDF.js via CDN
```

### 2. **Configuration de sécurité**
Modifiez `security_config.py` selon vos besoins :

```python
SECURITY_CONFIG = {
    'SECURITY_LEVEL': 'HIGH',  # LOW, MEDIUM, HIGH, PARANOID
    'BLOCK_DOWNLOAD_MANAGERS': True,
    'LOG_SECURITY_EVENTS': True,
}
```

### 3. **Démarrage**
```bash
python app.py
# Ou avec Docker :
docker-compose up --build
```

---

## 🔐 **Routes Sécurisées**

### **Visualisation Sécurisée**
```
GET /api/documents/<filename>/view
```
- ✅ Détecte et bloque les téléchargeurs automatiques
- ✅ Retourne une page HTML avec visualiseur PDF.js
- ✅ Interface utilisateur moderne avec protection

### **Service PDF Direct**
```
GET /api/documents/<filename>/serve
```
- ✅ Sert le PDF pour l'iframe du visualiseur
- ✅ Headers optimisés pour l'affichage en ligne

### **Téléchargement Classique**
```
GET /api/documents/<filename>/download
```
- ✅ Téléchargement traditionnel en pièce jointe

---

## 🛡️ **Niveaux de Sécurité**

### **LOW** 🟢
- Blocage basique des téléchargeurs connus
- Monitoring minimal

### **MEDIUM** 🟡
- Détection avancée des patterns suspects
- Logging détaillé

### **HIGH** 🟠 (Recommandé)
- Protection complète contre téléchargeurs
- Monitoring en temps réel
- Headers de sécurité avancés

### **PARANOID** 🔴
- Blocage de tous les bots
- Protection maximale côté client
- Session très courte

---

## 📊 **Monitoring et Alertes**

### **Logs de Sécurité**
```python
# Exemple de log généré
SECURITY_LOG: 192.168.1.100 - IDM/6.41 Build 2 - {'blocked': True}
PDF_VIEWER_LOG: {'ip': '192.168.1.100', 'violations': 3, 'action': 'close_viewer'}
```

### **Rapports de Sécurité**
```bash
python security_monitor.py
# Génère security_report.json avec analyse détaillée
```

---

## 🔧 **Personnalisation**

### **Ajout de nouveaux téléchargeurs**
Modifiez `BLOCKED_DOWNLOADERS` dans `security_config.py` :

```python
'BLOCKED_DOWNLOADERS': [
    'nouveau_telechargeur',
    'autre_outil',
    # ... ajoutez vos propres patterns
]
```

### **Headers personnalisés**
```python
'SECURITY_HEADERS': {
    'X-Custom-Security': 'value',
    'X-Protection-Level': 'HIGH',
}
```

---

## 🧪 **Tests**

### **Lancer les tests**
```bash
python test_security.py
```

### **Tests couverts**
- ✅ Détection des téléchargeurs automatiques
- ✅ Système de monitoring
- ✅ Visualiseur PDF sécurisé
- ✅ Configuration de sécurité

---

## 🚨 **Dépannage**

### **Problème : Téléchargement automatique persiste**
**Solution :**
1. Vérifiez que `block_advanced_downloaders()` est appelé
2. Augmentez le niveau de sécurité à `HIGH` ou `PARANOID`
3. Vérifiez les logs pour identifier l'User-Agent

### **Problème : Visualiseur ne se charge pas**
**Solution :**
1. Vérifiez que PDF.js est accessible depuis le CDN
2. Contrôlez les CORS settings
3. Vérifiez la console du navigateur pour les erreurs

### **Problème : Performance**
**Solution :**
1. Activez le cache (`Cache-Control` headers)
2. Optimisez la taille des PDFs
3. Utilisez un CDN pour PDF.js

---

## 📚 **Références et Outils Utilisés**

### **Bibliothèques Open-Source**
- **[PDF.js](https://mozilla.github.io/pdf.js/)** - Visualiseur PDF JavaScript
- **[Flask](https://flask.palletsprojects.com/)** - Framework web Python

### **CDNs Utilisés**
- **PDF.js** : `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/`

### **Techniques de Sécurité**
- Headers HTTP sécurisés
- Détection d'User-Agent avancée
- Protection côté client avec JavaScript
- Monitoring et logging en temps réel

---

## 🎯 **Exemple d'utilisation**

### **Côté Frontend**
```javascript
// Visualisation sécurisée (bloque IDM)
window.open('/api/documents/document.pdf/view', '_blank');

// Téléchargement traditionnel
fetch('/api/documents/document.pdf/download')
    .then(response => response.blob())
    .then(blob => {
        // Créer un lien de téléchargement
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.pdf';
        a.click();
    });
```

---

## 🔐 **Bonnes Pratiques de Sécurité**

1. **Mettez à jour régulièrement** la liste des téléchargeurs bloqués
2. **Surveillez les logs** pour détecter les nouvelles menaces
3. **Testez régulièrement** votre configuration
4. **Sauvegardez vos rapports** de sécurité
5. **Formez vos utilisateurs** sur l'utilisation sécurisée

---

## 📞 **Support et Maintenance**

Cette solution est **gratuite et open-source**. Pour des besoins plus avancés :

- **Support communautaire** : GitHub Issues
- **Documentation** : Consultez les fichiers de configuration
- **Tests** : Lancez `test_security.py` régulièrement

---

**🔒 Sécurité maximale avec des outils gratuits - Protégez vos PDFs dès maintenant !**
