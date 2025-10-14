// Types pour la plateforme de formation - correspond au schéma DB MySQL

export interface Etudiant {
  id_etudiant: number;
  nom: string;
  prenom: string;
  email: string;
  code_auth: string;
  actif: boolean;
  date_inscription: string;
}

export interface Paiement {
  id_paiement: number;
  id_etudiant: number;
  mode_paiement: 'mvola' | 'espece';
  code_ref_mvola?: string;
  montant: number;
  statut: 'complet' | 'par_tranche' | 'en_attente';
  tranche_restante: number;
  date_paiement: string;
}

export interface Document {
  id_document: number;
  titre: string;
  type: 'pdf' | 'video' | 'image';
  chemin: string;
  telechargeable: boolean;
  date_upload: string;
}

export interface Quiz {
  id_quiz: number;
  titre: string;
  type: 'quiz' | 'examen' | 'test' | 'exercice';
  total_points: number;
  date_debut: string;
  date_fin: string;
  duree: number; // minutes
  statut: 'brouillon' | 'planifie' | 'actif' | 'clos';
  modifiable: boolean;
}

export interface Question {
  id_question: number;
  id_quiz: number;
  question: string;
  type_question: 'choix_multiple' | 'vrai_faux' | 'texte_libre';
  reponse_correcte: string;
  options?: string[]; // pour choix multiple
  points: number;
}

export interface Resultat {
  id_resultat: number;
  id_etudiant: number;
  id_quiz: number;
  score: number;
  date_passage: string;
  temps_utilise: number; // minutes
  statut: 'soumis' | 'non_soumis' | 'en_cours';
  reponses: { [questionId: number]: string };
}

export interface Notification {
  id_notification: number;
  titre: string;
  message: string;
  type_cible: 'tous' | 'individuel';
  id_etudiant?: number;
  date_envoi: string;
  lu?: boolean;
}

export interface UserSession {
  user: Etudiant | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
}