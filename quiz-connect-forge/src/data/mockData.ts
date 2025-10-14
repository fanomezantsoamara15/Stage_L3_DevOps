// Données statiques simulant la base de données MySQL
import type { Etudiant, Paiement, Document, Quiz, Question, Resultat, Notification } from '../types';

export const mockEtudiants: Etudiant[] = [
  {
    id_etudiant: 1,
    nom: "Rakoto",
    prenom: "Jean",
    email: "jean.rakoto@email.com",
    code_auth: "JR2024001",
    actif: true,
    date_inscription: "2024-01-15"
  },
  {
    id_etudiant: 2,
    nom: "Rabe",
    prenom: "Marie",
    email: "marie.rabe@email.com", 
    code_auth: "MR2024002",
    actif: true,
    date_inscription: "2024-01-20"
  },
  {
    id_etudiant: 3,
    nom: "Andry",
    prenom: "Paul",
    email: "paul.andry@email.com",
    code_auth: "PA2024003", 
    actif: false,
    date_inscription: "2024-02-01"
  }
];

export const mockPaiements: Paiement[] = [
  {
    id_paiement: 1,
    id_etudiant: 1,
    mode_paiement: 'mvola',
    code_ref_mvola: 'MV123456789',
    montant: 50000,
    statut: 'complet',
    tranche_restante: 0,
    date_paiement: "2024-01-15"
  },
  {
    id_paiement: 2,
    id_etudiant: 2,
    mode_paiement: 'espece',
    montant: 30000,
    statut: 'par_tranche',
    tranche_restante: 20000,
    date_paiement: "2024-01-20"
  },
  {
    id_paiement: 3,
    id_etudiant: 3,
    mode_paiement: 'mvola',
    code_ref_mvola: 'MV987654321',
    montant: 50000,
    statut: 'en_attente',
    tranche_restante: 50000,
    date_paiement: "2024-02-01"
  }
];

export const mockDocuments: Document[] = [
  {
    id_document: 1,
    titre: "Introduction au Développement Web",
    type: 'pdf',
    chemin: "/documents/intro-dev-web.pdf",
    telechargeable: true,
    date_upload: "2024-01-10"
  },
  {
    id_document: 2,
    titre: "Cours React JS - Partie 1",
    type: 'video',
    chemin: "/videos/react-cours-1.mp4",
    telechargeable: false,
    date_upload: "2024-01-12"
  },
  {
    id_document: 3,
    titre: "Schéma Architecture Web",
    type: 'image',
    chemin: "/images/architecture-web.png",
    telechargeable: true,
    date_upload: "2024-01-15"
  },
  {
    id_document: 4,
    titre: "Guide Python Flask",
    type: 'pdf',
    chemin: "/documents/guide-flask.pdf",
    telechargeable: true,
    date_upload: "2024-01-18"
  }
];

export const mockQuiz: Quiz[] = [
  {
    id_quiz: 1,
    titre: "Quiz HTML/CSS",
    type: 'quiz',
    total_points: 100,
    date_debut: "2024-02-01T09:00:00",
    date_fin: "2024-02-01T10:00:00", 
    duree: 60,
    statut: 'clos',
    modifiable: false
  },
  {
    id_quiz: 2,
    titre: "Examen React JS",
    type: 'examen',
    total_points: 200,
    date_debut: "2024-02-10T14:00:00",
    date_fin: "2024-02-10T16:00:00",
    duree: 120,
    statut: 'actif',
    modifiable: false
  },
  {
    id_quiz: 3,
    titre: "Test Python",
    type: 'test',
    total_points: 50,
    date_debut: "2024-02-15T10:00:00",
    date_fin: "2024-02-15T11:30:00",
    duree: 90,
    statut: 'planifie',
    modifiable: true
  }
];

export const mockQuestions: Question[] = [
  {
    id_question: 1,
    id_quiz: 1,
    question: "Quelle balise HTML est utilisée pour créer un titre principal ?",
    type_question: 'choix_multiple',
    reponse_correcte: "h1",
    options: ["h1", "title", "header", "main"],
    points: 25
  },
  {
    id_question: 2,
    id_quiz: 1,
    question: "CSS signifie Cascading Style Sheets",
    type_question: 'vrai_faux',
    reponse_correcte: "true",
    points: 25
  },
  {
    id_question: 3,
    id_quiz: 2,
    question: "Qu'est-ce qu'un composant React ?",
    type_question: 'reponse_courte',
    reponse_correcte: "Une fonction ou classe qui retourne du JSX",
    points: 50
  }
];

export const mockResultats: Resultat[] = [
  {
    id_resultat: 1,
    id_etudiant: 1,
    id_quiz: 1,
    score: 75,
    date_passage: "2024-02-01T09:30:00",
    temps_utilise: 45,
    statut: 'soumis',
    reponses: { 1: "h1", 2: "true" }
  },
  {
    id_resultat: 2,
    id_etudiant: 2,
    id_quiz: 1,
    score: 100,
    date_passage: "2024-02-01T09:25:00",
    temps_utilise: 40,
    statut: 'soumis', 
    reponses: { 1: "h1", 2: "true" }
  }
];

export const mockNotifications: Notification[] = [
  {
    id_notification: 1,
    titre: "Nouveau document disponible",
    message: "Le guide Python Flask est maintenant disponible dans la section Documents.",
    type_cible: 'tous',
    date_envoi: "2024-01-18T10:00:00",
    lu: false
  },
  {
    id_notification: 2,
    titre: "Paiement validé",
    message: "Votre paiement a été validé. Bienvenue dans la formation !",
    type_cible: 'individuel',
    id_etudiant: 1,
    date_envoi: "2024-01-15T14:30:00",
    lu: true
  },
  {
    id_notification: 3,
    titre: "Examen React JS planifié",
    message: "L'examen React JS aura lieu le 10 février à 14h. Durée: 2h.",
    type_cible: 'tous',
    date_envoi: "2024-02-05T09:00:00",
    lu: false
  }
];

// Simulation des APIs Flask qui seront implémentées
export const API_ENDPOINTS = {
  // Authentification
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  VERIFY_PAYMENT: '/api/auth/verify-payment',
  
  // Étudiants
  GET_STUDENT_PROFILE: '/api/students/profile',
  UPDATE_STUDENT: '/api/students/update',
  
  // Paiements
  PROCESS_MVOLA: '/api/payments/mvola',
  VALIDATE_CASH: '/api/payments/cash/validate',
  GET_PAYMENT_STATUS: '/api/payments/status',
  
  // Documents
  GET_DOCUMENTS: '/api/documents',
  UPLOAD_DOCUMENT: '/api/documents/upload',
  DOWNLOAD_DOCUMENT: '/api/documents/download',
  
  // Quiz
  GET_QUIZ: '/api/quiz',
  CREATE_QUIZ: '/api/quiz/create',
  SUBMIT_QUIZ: '/api/quiz/submit',
  GET_RESULTS: '/api/quiz/results',
  
  // Notifications
  GET_NOTIFICATIONS: '/api/notifications',
  SEND_NOTIFICATION: '/api/notifications/send',
  MARK_READ: '/api/notifications/read',
  
  // Admin
  ADMIN_DASHBOARD: '/api/admin/dashboard',
  MANAGE_STUDENTS: '/api/admin/students',
  PAYMENT_REPORTS: '/api/admin/payments'
};