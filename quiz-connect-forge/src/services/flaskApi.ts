/**
 * Service API organisé pour l'intégration avec un backend Python Flask
 * Structure complète avec toutes les endpoints nécessaires
 */

// Configuration de l'API
const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-flask-api.herokuapp.com/api'
    : 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Types pour TypeScript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Student {
  id_etudiant: number;
  nom: string;
  prenom: string;
  email: string;
  code_auth: string;
  actif: boolean;
  date_inscription: string;
  telephone?: string;
}

export interface Payment {
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
  duree: number;
  statut: 'brouillon' | 'planifie' | 'actif' | 'clos';
  modifiable: boolean;
}

export interface Question {
  id_question: number;
  id_quiz: number;
  question: string;
  type_question: 'choix_multiple' | 'vrai_faux' | 'reponse_courte';
  reponse_correcte: string;
  options?: string[];
}

export interface Result {
  id_resultat: number;
  id_etudiant: number;
  id_quiz: number;
  score: number;
  date_passage: string;
  temps_utilise: number;
  statut: 'soumis' | 'non_soumis' | 'en_cours';
}

export interface Notification {
  id_notification: number;
  titre: string;
  message: string;
  type_cible: 'tous' | 'individuel';
  id_etudiant?: number;
  date_envoi: string;
}

// Utilitaire pour les requêtes HTTP
class ApiClient {
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_CONFIG.baseUrl}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          ...API_CONFIG.headers,
          ...options.headers,
        },
      };

      // Ajouter le token d'authentification si disponible
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur réseau',
      };
    }
  }

  static get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  static upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Laisse le navigateur définir Content-Type pour FormData
    });
  }
}

// ============= SERVICES D'AUTHENTIFICATION =============
export const authApi = {
  // Connexion étudiant
  async loginStudent(email: string, codeAuth: string): Promise<ApiResponse<{ user: Student; token: string }>> {
    return ApiClient.post('/auth/login/student', { email, code_auth: codeAuth });
  },

  // Connexion admin
  async loginAdmin(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    return ApiClient.post('/auth/login/admin', { email, password });
  },

  // Inscription étudiant
  async registerStudent(studentData: any, paymentData: any): Promise<ApiResponse<{ student: Student; code_auth: string }>> {
    return ApiClient.post('/auth/register', { student: studentData, payment: paymentData });
  },

  // Déconnexion
  async logout(): Promise<ApiResponse> {
    return ApiClient.post('/auth/logout');
  },

  // Vérifier le token
  async verifyToken(): Promise<ApiResponse<{ user: Student | any }>> {
    return ApiClient.get('/auth/verify');
  },
};

// ============= SERVICES ÉTUDIANTS =============
export const studentsApi = {
  // Récupérer tous les étudiants (admin)
  async getAll(): Promise<ApiResponse<Student[]>> {
    return ApiClient.get('/admin/students');
  },

  // Récupérer un étudiant par ID
  async getById(id: number): Promise<ApiResponse<Student>> {
    return ApiClient.get(`/students/${id}`);
  },

  // Ajouter un étudiant (admin)
  async create(studentData: Partial<Student>): Promise<ApiResponse<Student>> {
    return ApiClient.post('/admin/students', studentData);
  },

  // Mettre à jour un étudiant
  async update(id: number, studentData: Partial<Student>): Promise<ApiResponse<Student>> {
    return ApiClient.put(`/admin/students/${id}`, studentData);
  },

  // Suspendre/Activer un étudiant
  async toggleStatus(id: number, actif: boolean): Promise<ApiResponse> {
    return ApiClient.post(`/admin/students/${id}/toggle`, { actif });
  },

  // Supprimer un étudiant
  async delete(id: number): Promise<ApiResponse> {
    return ApiClient.delete(`/admin/students/${id}`);
  },

  // Suppression en masse
  async bulkDelete(): Promise<ApiResponse> {
    return ApiClient.delete('/admin/students/bulk');
  },

  // Renvoyer le code d'authentification
  async resendAuthCode(id: number): Promise<ApiResponse> {
    return ApiClient.post(`/admin/students/${id}/resend-code`);
  },

  // Exporter les données étudiants
  async export(): Promise<ApiResponse<Blob>> {
    return ApiClient.get('/admin/students/export');
  },
};

// ============= SERVICES PAIEMENTS =============
export const paymentsApi = {
  // Récupérer tous les paiements
  async getAll(): Promise<ApiResponse<Payment[]>> {
    return ApiClient.get('/admin/payments');
  },

  // Récupérer les paiements d'un étudiant
  async getByStudent(studentId: number): Promise<ApiResponse<Payment[]>> {
    return ApiClient.get(`/students/${studentId}/payments`);
  },

  // Valider un paiement
  async validate(id: number): Promise<ApiResponse> {
    return ApiClient.post(`/admin/payments/${id}/validate`);
  },

  // Rejeter un paiement
  async reject(id: number): Promise<ApiResponse> {
    return ApiClient.post(`/admin/payments/${id}/reject`);
  },

  // Marquer comme paiement partiel
  async markPartial(id: number): Promise<ApiResponse> {
    return ApiClient.post(`/admin/payments/${id}/partial`);
  },

  // Vérifier un code MVola
  async verifyMvola(code: string): Promise<ApiResponse<{ valid: boolean; amount: number }>> {
    return ApiClient.post('/payments/verify-mvola', { code });
  },

  // Créer un nouveau paiement
  async create(paymentData: Partial<Payment>): Promise<ApiResponse<Payment>> {
    return ApiClient.post('/payments', paymentData);
  },
};

// ============= SERVICES DOCUMENTS =============
export const documentsApi = {
  // Récupérer tous les documents
  async getAll(): Promise<ApiResponse<Document[]>> {
    return ApiClient.get('/documents');
  },

  // Uploader un document
  async upload(file: File, titre: string, telechargeable: boolean): Promise<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('titre', titre);
    formData.append('telechargeable', telechargeable.toString());
    
    return ApiClient.upload('/admin/documents/upload', formData);
  },

  // Supprimer un document
  async delete(id: number): Promise<ApiResponse> {
    return ApiClient.delete(`/admin/documents/${id}`);
  },

  // Télécharger un document
  async download(id: number): Promise<ApiResponse<Blob>> {
    return ApiClient.get(`/documents/${id}/download`);
  },

  // Mettre à jour les métadonnées d'un document
  async update(id: number, documentData: Partial<Document>): Promise<ApiResponse<Document>> {
    return ApiClient.put(`/admin/documents/${id}`, documentData);
  },
};

// ============= SERVICES QUIZ =============
export const quizApi = {
  // Récupérer tous les quiz
  async getAll(): Promise<ApiResponse<Quiz[]>> {
    return ApiClient.get('/quiz');
  },

  // Récupérer un quiz par ID
  async getById(id: number): Promise<ApiResponse<Quiz & { questions: Question[] }>> {
    return ApiClient.get(`/quiz/${id}`);
  },

  // Créer un quiz (admin)
  async create(quizData: Partial<Quiz>): Promise<ApiResponse<Quiz>> {
    return ApiClient.post('/admin/quiz', quizData);
  },

  // Mettre à jour un quiz
  async update(id: number, quizData: Partial<Quiz>): Promise<ApiResponse<Quiz>> {
    return ApiClient.put(`/admin/quiz/${id}`, quizData);
  },

  // Supprimer un quiz
  async delete(id: number): Promise<ApiResponse> {
    return ApiClient.delete(`/admin/quiz/${id}`);
  },

  // Démarrer un quiz (étudiant)
  async start(quizId: number): Promise<ApiResponse<{ session_id: string; questions: Question[] }>> {
    return ApiClient.post(`/quiz/${quizId}/start`);
  },

  // Soumettre les réponses
  async submit(quizId: number, answers: Record<number, string>): Promise<ApiResponse<Result>> {
    return ApiClient.post(`/quiz/${quizId}/submit`, { answers });
  },

  // Récupérer les résultats d'un quiz
  async getResults(quizId: number): Promise<ApiResponse<Result[]>> {
    return ApiClient.get(`/admin/quiz/${quizId}/results`);
  },
};

// ============= SERVICES QUESTIONS =============
export const questionsApi = {
  // Ajouter une question à un quiz
  async create(quizId: number, questionData: Partial<Question>): Promise<ApiResponse<Question>> {
    return ApiClient.post(`/admin/quiz/${quizId}/questions`, questionData);
  },

  // Mettre à jour une question
  async update(id: number, questionData: Partial<Question>): Promise<ApiResponse<Question>> {
    return ApiClient.put(`/admin/questions/${id}`, questionData);
  },

  // Supprimer une question
  async delete(id: number): Promise<ApiResponse> {
    return ApiClient.delete(`/admin/questions/${id}`);
  },

  // Récupérer les questions d'un quiz
  async getByQuiz(quizId: number): Promise<ApiResponse<Question[]>> {
    return ApiClient.get(`/quiz/${quizId}/questions`);
  },
};

// ============= SERVICES RÉSULTATS =============
export const resultsApi = {
  // Récupérer tous les résultats (admin)
  async getAll(): Promise<ApiResponse<Result[]>> {
    return ApiClient.get('/admin/results');
  },

  // Récupérer les résultats d'un étudiant
  async getByStudent(studentId: number): Promise<ApiResponse<Result[]>> {
    return ApiClient.get(`/students/${studentId}/results`);
  },

  // Récupérer les résultats d'un quiz
  async getByQuiz(quizId: number): Promise<ApiResponse<Result[]>> {
    return ApiClient.get(`/quiz/${quizId}/results`);
  },

  // Supprimer un résultat
  async delete(id: number): Promise<ApiResponse> {
    return ApiClient.delete(`/admin/results/${id}`);
  },
};

// ============= SERVICES NOTIFICATIONS =============
export const notificationsApi = {
  // Récupérer toutes les notifications
  async getAll(): Promise<ApiResponse<Notification[]>> {
    return ApiClient.get('/notifications');
  },

  // Récupérer les notifications d'un étudiant
  async getByStudent(studentId: number): Promise<ApiResponse<Notification[]>> {
    return ApiClient.get(`/students/${studentId}/notifications`);
  },

  // Envoyer une notification
  async send(notificationData: Partial<Notification>): Promise<ApiResponse<Notification>> {
    return ApiClient.post('/admin/notifications', notificationData);
  },

  // Marquer une notification comme lue
  async markAsRead(id: number): Promise<ApiResponse> {
    return ApiClient.post(`/notifications/${id}/read`);
  },

  // Supprimer une notification
  async delete(id: number): Promise<ApiResponse> {
    return ApiClient.delete(`/admin/notifications/${id}`);
  },
};

// ============= SERVICES EMAIL =============
export const emailApi = {
  // Envoyer un code d'authentification
  async sendAuthCode(email: string, code: string): Promise<ApiResponse> {
    return ApiClient.post('/email/auth-code', { email, code });
  },

  // Envoyer une notification par email
  async sendNotification(email: string, subject: string, message: string): Promise<ApiResponse> {
    return ApiClient.post('/email/notification', { email, subject, message });
  },

  // Envoyer un email de récupération de mot de passe
  async sendPasswordReset(email: string): Promise<ApiResponse> {
    return ApiClient.post('/email/password-reset', { email });
  },
};

// ============= SERVICES STATISTIQUES =============
export const statsApi = {
  // Récupérer les statistiques générales
  async getGeneral(): Promise<ApiResponse<{
    total_students: number;
    active_students: number;
    total_revenue: number;
    pending_payments: number;
    completed_quizzes: number;
    average_score: number;
  }>> {
    return ApiClient.get('/admin/stats/general');
  },

  // Récupérer les statistiques de paiement
  async getPayments(): Promise<ApiResponse<{
    by_month: Array<{ month: string; amount: number; count: number }>;
    by_method: Array<{ method: string; amount: number; count: number }>;
    by_status: Array<{ status: string; count: number }>;
  }>> {
    return ApiClient.get('/admin/stats/payments');
  },

  // Récupérer les statistiques des quiz
  async getQuizzes(): Promise<ApiResponse<{
    completion_rate: number;
    average_scores: Array<{ quiz_title: string; average: number }>;
    participation: Array<{ date: string; count: number }>;
  }>> {
    return ApiClient.get('/admin/stats/quizzes');
  },
};

// ============= SERVICES UTILITAIRES =============
export const utilsApi = {
  // Vérifier la santé de l'API
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return ApiClient.get('/health');
  },

  // Obtenir la configuration système
  async getConfig(): Promise<ApiResponse<any>> {
    return ApiClient.get('/config');
  },

  // Synchroniser les données
  async syncData(): Promise<ApiResponse> {
    return ApiClient.post('/admin/sync');
  },
};

// Export par défaut avec tous les services
export default {
  auth: authApi,
  students: studentsApi,
  payments: paymentsApi,
  documents: documentsApi,
  quiz: quizApi,
  questions: questionsApi,
  results: resultsApi,
  notifications: notificationsApi,
  email: emailApi,
  stats: statsApi,
  utils: utilsApi,
};