# Quiz Connect Forge

Plateforme de formation complète avec système de paiement, quiz interactifs et gestion d'étudiants.

## 🚀 Fonctionnalités

- **Authentification complète** : Étudiants et administrateurs
- **Gestion des paiements** : MVola et espèces avec validation
- **Quiz interactifs** : Minuteur, types de questions variés
- **Interface responsive** : Optimisée mobile et desktop
- **Tableau de bord complet** : Métriques et suivi des performances
- **Gestion de documents** : Upload et téléchargement sécurisés
- **Système de notifications** : Communication ciblée
- **API Services** : Intégration Flask prête

## 🛠️ Technologies

- **Frontend** : React 18 + TypeScript + Tailwind CSS
- **Gestion d'état** : React Context + React Query
- **Routage** : React Router Dom
- **UI Components** : Shadcn/ui + Radix UI
- **Formulaires** : React Hook Form + Zod
- **Icons** : Lucide React
- **Charts** : Recharts

## 📱 Design Responsive

Interface entièrement responsive avec :
- Navigation adaptée mobile/desktop
- Formulaires multi-étapes optimisés
- Tableaux avec colonnes cachées sur mobile
- Cartes et métriques adaptatives

## 🏗️ Structure

```
src/
├── components/
│   ├── admin/           # Gestion administrative
│   │   ├── AdminDashboard.tsx
│   │   ├── StudentManagement.tsx
│   │   ├── AddStudentForm.tsx      # Formulaire multi-étapes
│   │   ├── PaymentManagement.tsx
│   │   ├── QuizCreator.tsx
│   │   └── DocumentManager.tsx
│   ├── student/         # Interface étudiante
│   │   ├── StudentDashboard.tsx
│   │   └── QuizTaker.tsx
│   ├── auth/            # Authentification
│   │   ├── LoginForm.tsx
│   │   └── RegistrationForm.tsx    # Formulaire multi-étapes
│   └── ui/              # Components UI réutilisables
├── services/
│   ├── apiService.ts    # Services API commentés
│   └── flaskApi.ts      # API Flask complète
├── context/
│   └── AuthContext.tsx  # Gestion authentification
└── data/
    └── mockData.ts      # Données de développement
```

## 🔧 Installation

```bash
# Cloner le projet
git clone <repository-url>
cd quiz-connect-forge

# Installer les dépendances
npm install

# Démarrer le développement
npm run dev
```

## 🌐 Intégration Backend Flask

### Configuration API
Fichier `/src/services/flaskApi.ts` - API complète organisée :

```typescript
// Configuration
const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-flask-api.herokuapp.com/api'
    : 'http://localhost:5000/api'
}

// Services disponibles
import api from '@/services/flaskApi';

// Authentification
await api.auth.loginStudent(email, code);
await api.auth.registerStudent(data, payment);

// Gestion étudiants
await api.students.getAll();
await api.students.create(studentData);

// Paiements
await api.payments.validate(paymentId);
await api.payments.verifyMvola(code);

// Quiz et plus...
```

### Endpoints Backend Requis

```
POST /api/auth/login/student
POST /api/auth/login/admin
POST /api/auth/register
GET  /api/admin/students
POST /api/admin/students
GET  /api/admin/payments
POST /api/admin/payments/:id/validate
POST /api/quiz/:id/start
POST /api/quiz/:id/submit
... (voir flaskApi.ts pour la liste complète)
```

## 📝 Historique des Commits

### Commits Majeurs pour Navigation

1. **Initial Setup** - `feat: setup initial project structure`
   - Configuration React + TypeScript + Tailwind
   - Composants UI de base (Shadcn)

2. **Authentication System** - `feat: implement auth system with multi-step forms`
   - Contexte d'authentification
   - Formulaires login/register multi-étapes
   - Gestion session et codes d'authentification

3. **Admin Dashboard** - `feat: create admin dashboard with management tools`
   - Interface administrative complète
   - Gestion étudiants, paiements, quiz
   - Métriques et statistiques

4. **Student Interface** - `feat: implement student dashboard and quiz system`
   - Tableau de bord étudiant
   - Système de quiz avec minuteur
   - Suivi des résultats et paiements

5. **Document Management** - `feat: add document upload and management`
   - Upload de fichiers
   - Gestion permissions téléchargement
   - Interface de consultation

6. **Quiz System** - `feat: complete quiz creation and taking system`
   - Créateur de quiz avancé
   - Interface de passage avec minuteur
   - Système de questions multiples

7. **Payment Integration** - `feat: implement payment validation system`
   - Validation MVola automatique
   - Gestion paiements espèces
   - Historique et suivi tranches

8. **API Services** - `feat: organize API services for Flask backend`
   - Services API structurés
   - Types TypeScript complets
   - Configuration production/développement

9. **Mobile Optimization** - `feat: implement responsive design and mobile optimization`
   - Interface responsive complète
   - Navigation mobile optimisée
   - Formulaires adaptatifs

10. **Multi-step Forms** - `feat: enhance forms with multi-step workflow`
    - Formulaires inscription/ajout étudiants
    - Navigation par étapes
    - Validation progressive

## 🎯 Utilisation

### Comptes de Test
```
Admin:
- Email: admin@test.com
- Mot de passe: admin123

Étudiant:
- Email: etudiant@test.com  
- Code: ETU2024001
```

### Flux Principaux
1. **Inscription étudiant** : Formulaire 3 étapes (Info → Paiement → Confirmation)
2. **Ajout admin** : Formulaire 3 étapes (Info → Vérification → Confirmation)
3. **Passage quiz** : Interface dédiée avec minuteur
4. **Validation paiements** : Actions admin avec génération codes

## 📦 Scripts

```bash
npm run dev          # Développement
npm run build        # Production
npm run preview      # Prévisualisation
npm run lint         # Vérification code
```

## 🤝 Contribution

Pour contribuer au projet, consultez l'historique des commits pour comprendre l'évolution et la structure du code.