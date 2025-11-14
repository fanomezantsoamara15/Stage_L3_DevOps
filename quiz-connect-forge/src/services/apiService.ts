/**
 * Service API pour l'intégration avec le backend Python Flask
 * Toutes les fonctions sont commentées pour être facilement activées
 * lors de l'intégration avec le backend
 */

// Configuration de base pour l'API Flask
const API_BASE_URL = window.APP_CONFIG.apiBaseUrl || 'http://localhost:5000/api';

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: any;
  token?: string;
  isAdmin?: boolean;
}

export interface StudentResponse {
  message: string;
  auth_code: string;
  student: {
    id: number;
    username: string;
    email: string;
  };
}

// ============= AUTHENTIFICATION =============

// Fonction utilitaire pour récupérer les en-têtes d'authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Vérifier la validité du token côté serveur
async function verifyToken(): Promise<ApiResponse<AuthResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Erreur de vérification du token' };
  }
}

export const authService = {
  // Connexion étudiant
  async loginStudent(email: string, code_auth: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code_auth })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  // Connexion admin
  async loginAdmin(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erreur de connexion admin' };
    }
  },

  // Inscription étudiant
  async registerStudent(studentData: any, paymentData: any): Promise<ApiResponse<{ code_auth: string; student_id?: number }>> {
    try {
      // Fusionner les données étudiant et paiement dans un seul objet
      const registrationData = {
        ...studentData,
        mode_paiement: paymentData.mode_paiement,
        montant: paymentData.montant,
        code_ref_mvola: paymentData.code_ref_mvola,
        tranche_restante: paymentData.tranche_restante || 0
      };

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: result.message || 'Erreur lors de l\'inscription',
          data: result.data
        };
      }
      
      return { 
        success: true, 
        data: { 
          code_auth: result.data?.auth_code || '',
          student_id: result.data?.student_id
        },
        message: result.message
      };
      
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
return { 
        success: false, 
        error: error.message || 'Erreur de connexion au serveur',
        data: { code_auth: '' }
      };
    }
  },

  // Vérifier la validité du token côté serveur
  async verifyToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erreur de vérification du token' };
    }
  }
  ,
  // Récupérer les résultats d'un étudiant
  async getStudentResults(studentId: number): Promise<ApiResponse<any[]>> {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/student/${studentId}/results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }
      return data;
    } catch (error) {
      return { success: false, error: 'Erreur lors de la récupération des résultats' };
    }
  }
};

// ============= GESTION ÉTUDIANTS =============

export const studentService = {
  // Récupérer tous les étudiants
  async getAllStudents(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/students`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      return { success: false, error: 'Erreur lors de la récupération des étudiants' };
    }
  },

  // Ajouter un nouvel étudiant
  async addStudent(studentData: any): Promise<ApiResponse<StudentResponse>> {
    try {
      console.log('Envoi de la requête d\'ajout d\'étudiant:', studentData);
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(studentData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur lors de l\'ajout de l\'étudiant:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('Réponse du serveur (addStudent):', responseData);
      
      // S'assurer que la réponse a la structure attendue
      if (!responseData.student || !responseData.student.id) {
        console.error('Réponse du serveur invalide - structure manquante:', responseData);
        throw new Error('Réponse du serveur invalide - structure manquante');
      }
      
      // Retourner la réponse dans le format attendu par le frontend
      return {
        success: true,
        data: responseData,
        message: responseData.message
      };
    } catch (error) {
      return { 
        success: false, 
        error: 'Erreur lors de l\'ajout de l\'étudiant' 
      };
    }
  },

  // Récupérer un étudiant par ID
  async getStudentById(studentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: 'Erreur lors de la récupération de l\'étudiant' 
      };
    }
  },

  // Suspendre/Activer un étudiant
  async toggleStudent(studentId: number, status: boolean): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/toggle`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      return { success: false, error: 'Erreur lors de la modification du statut' };
    }
  },

  // Supprimer un étudiant
  async deleteStudent(studentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return { success: false, error: 'Erreur lors de la suppression de l\'étudiant' };
    }
  },

  // Renvoyer code d'authentification
  async resendAuthCode(studentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/resend-code`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du code:', error);
      return { success: false, error: 'Erreur lors de l\'envoi du code d\'authentification' };
    }
  },

  // Suppression en masse
  async bulkDeleteStudents(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/students/bulk-delete`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la suppression en masse:', error);
      return { success: false, error: 'Erreur lors de la suppression en masse' };
    }
  }
};

// ============= GESTION PAIEMENTS =============

export const paymentService = {
  // Récupérer tous les paiements
  async getAllPayments(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payments`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: 'Erreur lors de la récupération des paiements' 
      };
    }
  },

  // Récupérer les paiements d'un étudiant
  async getStudentPayments(studentId: number): Promise<ApiResponse<any[]>> {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/student/${studentId}/payments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: 'Erreur lors de la récupération des paiements de l\'étudiant' 
      };
    }
  },

  // Ajouter un nouveau paiement
  async addPayment(paymentData: any): Promise<ApiResponse<any>> {
    try {
      console.log('Envoi de la requête d\'ajout de paiement:', paymentData);
      
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(paymentData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Erreur lors de l\'ajout du paiement:', {
          status: response.status,
          statusText: response.statusText,
          response: responseData
        });
        
        return { 
          success: false, 
          error: responseData.error || `Erreur ${response.status}: ${response.statusText}`
        };
      }
      
      console.log('Réponse du serveur (addPayment):', responseData);
      
      // S'assurer que la réponse a la structure attendue
      if (!responseData.success) {
        console.error('Réponse du serveur invalide:', responseData);
        return { 
          success: false, 
          error: responseData.error || 'Réponse inattendue du serveur'
        };
      }
      
      return responseData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur lors de l\'ajout du paiement:', errorMessage);
      return { 
        success: false, 
        error: `Erreur de connexion au serveur: ${errorMessage}`
      };
    }
  },

  // Valider un paiement
  async validatePayment(paymentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}/validate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la validation du paiement:', error);
      return { success: false, error: 'Erreur lors de la validation du paiement' };
    }
  },

  // Rejeter un paiement
  async rejectPayment(paymentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors du rejet du paiement:', error);
      return { success: false, error: 'Erreur lors du rejet du paiement' };
    }
  },

  // Marquer comme paiement partiel
  async markPartialPayment(paymentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}/partial`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la modification du paiement:', error);
      return { success: false, error: 'Erreur lors de la modification du paiement' };
    }
  },

  // Vérifier code MVola
  async verifyMvolaCode(code: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/verify-mvola`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la vérification MVola:', error);
      return { success: false, error: 'Erreur lors de la vérification du code MVola' };
    }
  }
};

// ============= GESTION DOCUMENTS =============

export const documentService = {
  // Récupérer tous les documents
  async getAllDocuments(): Promise<ApiResponse<any[]>> {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/documents`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erreur lors de la récupération' };
    }
  },

  // Ajouter un document
  async addDocument(documentData: FormData): Promise<ApiResponse<any>> {
    try {
      const headers = getAuthHeaders();
      // Ne pas fixer Content-Type pour FormData, laisser le navigateur gérer
      // Retirer 'Content-Type' si présent
      // @ts-ignore
      delete headers['Content-Type'];
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers,
        body: documentData
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'upload' };
    }
  },

  // Supprimer un document
  async deleteDocument(documentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/documents/${documentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      return { success: false, error: 'Erreur lors de la suppression du document' };
    }
  },

  // Modifier un document
  async updateDocument(documentId: number, updateData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la modification du document:', error);
      return { success: false, error: 'Erreur lors de la modification du document' };
    }
  },

  // Télécharger un document de manière sécurisée
  async downloadDocument(documentId: number): Promise<ApiResponse<any>> {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Retourner la réponse brute pour permettre le téléchargement
      return { success: true, data: response };
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error);
      return { success: false, error: 'Erreur lors du téléchargement du document' };
    }
  },

  // Prévisualiser un document de manière sécurisée
  async previewDocument(documentId: number): Promise<ApiResponse<any>> {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/preview`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Retourner la réponse brute pour permettre la prévisualisation
      return { success: true, data: response };
    } catch (error) {
      console.error('Erreur lors de la prévisualisation du document:', error);
      return { success: false, error: 'Erreur lors de la prévisualisation du document' };
    }
  },
};

// ============= GESTION QUIZ =============

export const quizService = {
  // Récupérer tous les quiz
  async getAllQuiz(): Promise<ApiResponse<any[]>> {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/quizzes`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erreur lors de la récupération' };
    }
  },

  // Créer un quiz
  async createQuiz(quizData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(quizData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création du quiz:', error);
      return { success: false, error: 'Erreur lors de la création du quiz' };
    }
  },

  // Supprimer un quiz
  async deleteQuiz(quizId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/quiz/${quizId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la suppression du quiz:', error);
    }
  },

  // Mettre à jour un quiz existant
  async updateQuiz(quizId: number, quizData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/quiz/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(quizData)
      });

      const data = await response.json();
      console.log('Réponse du serveur (updateQuiz):', data);

      if (!response.ok) {
        const errorMessage = data.message || data.error || `Erreur HTTP ${response.status}`;
        console.error('Erreur lors de la mise à jour du quiz:', errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du quiz:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du quiz'
      };
    }
  },

  // Modifier le statut d'un quiz
  async updateQuizStatus(quizId: number, status: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/quiz/${quizId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ statut: status })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la modification du statut du quiz:', error);
      return { success: false, error: 'Erreur lors de la modification du statut du quiz' };
    }
  },

  // Récupérer un quiz par ID avec ses questions
  async getQuizById(quizId: number): Promise<ApiResponse<any>> {
    try {
      const token = localStorage.getItem('auth-token');
      console.log(`Récupération du quiz ${quizId} avec ses questions...`);

      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Erreur HTTP ${response.status}`;
        console.error('Erreur lors de la récupération du quiz:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Réponse du serveur (quiz avec questions):', data);

      // Vérifier la structure de la réponse
      if (!data.quiz) {
        throw new Error('Structure de réponse invalide - quiz manquant');
      }

      // Normaliser les données du quiz
      const normalizedQuiz = {
        id_quiz: data.quiz.id,
        id: data.quiz.id,
        titre: data.quiz.titre || '',
        type: data.quiz.type || 'quiz',
        total_points: data.quiz.total_points || 0,
        date_debut: data.quiz.date_debut || '',
        date_fin: data.quiz.date_fin || '',
        duree: data.quiz.duree || 60,
        statut: data.quiz.statut || 'inactif',
        modifiable: data.quiz.modifiable ?? true,
        created_by: data.quiz.created_by
      };

      // Normaliser les questions
      const questions = (data.questions || []).map((q: any, index: number) => ({
        id_question: q.id,
        id_quiz: quizId,
        question: q.question || '',
        type_question: q.type_question || 'choix_multiple',
        reponse_correcte: q.reponse_correcte || '',
        options: Array.isArray(q.options) ? q.options : [],
        points: q.points || 1,
        ordre: q.ordre || (index + 1)
      }));

      console.log(`Quiz normalisé:`, normalizedQuiz);
      console.log(`Questions normalisées (${questions.length}):`, questions);

      return {
        success: true,
        data: {
          ...normalizedQuiz,
          questions: questions
        }
      };

    } catch (error) {
      console.error('Erreur getQuizById:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération du quiz',
        data: { questions: [] }
      };
    }
  },

  
  async getQuizQuestions(quizId: number): Promise<ApiResponse<any[]>> {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }
      // Adapter la forme des questions au type front attendu (id_question)
      const normalized = (data.questions || []).map((q: any) => ({
        id_question: q.id,
        id_quiz: quizId,
        question: q.question,
        type_question: q.type_question,
        reponse_correcte: q.reponse_correcte,
        options: q.options,
        points: q.points,
      }));
      return { success: true, data: normalized };
    } catch (error) {
      return { success: false, error: 'Erreur lors de la récupération des questions' };
    }
  },

  // Démarrer un quiz
  async startQuiz(quizId: number, studentId: number): Promise<ApiResponse<any>> {
    // TODO: Activer lors de l'intégration backend
    // try {
    //   const response = await fetch(`${API_BASE_URL}/quiz/${quizId}/start`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ studentId })
    //   });
    //   return await response.json();
    // } catch (error) {
    //   return { success: false, error: 'Erreur lors du démarrage' };
    // }
    
    return { success: true, data: null };
  },

  // Soumettre les réponses
  async submitQuiz(quizId: number, answersMap: Record<number, string>, tempsUtilise: number): Promise<ApiResponse<any>> {
    try {
      const token = localStorage.getItem('auth-token');
      
      // Convertir le map en tableau conforme au backend
      const answers = Object.keys(answersMap).map((qid) => ({
        question_id: Number(qid),
        reponse: answersMap[Number(qid)]
      }));
      
      console.log('Envoi des réponses du quiz:', { quizId, answers, tempsUtilise });
      
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ 
          answers, 
          temps_utilise: tempsUtilise 
        })
      });
      
      const data = await response.json();
      console.log('Réponse du serveur (submitQuiz):', data);
      
      // Si le statut n'est pas OK, on traite l'erreur
      if (!response.ok) {
        const errorMessage = data.message || data.error || `Erreur HTTP ${response.status}`;
        console.error('Erreur lors de la soumission du quiz:', errorMessage);
        return { 
          success: false, 
          error: errorMessage,
          message: errorMessage
        };
      }
      
      // Retourner la réponse formatée
      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Quiz soumis avec succès'
      };
      
    } catch (error: any) {
      console.error('Erreur lors de la soumission du quiz:', error);
      return { 
        success: false, 
        error: error.message || 'Erreur lors de la soumission du quiz',
        message: error.message || 'Une erreur inattendue est survenue'
      };
    }
  }
};

// ============= GESTION NOTIFICATIONS =============

export const notificationService = {
  // Récupérer toutes les notifications
  async getAllNotifications(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erreur lors de la récupération' };
    }
  },

  // Récupérer les notifications d'un étudiant
  async getStudentNotifications(studentId: number): Promise<ApiResponse<any[]>> {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/student/${studentId}/notifications`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erreur lors de la récupération' };
    }
  },

  // Envoyer une notification
  async sendNotification(notificationData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(notificationData)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'envoi' };
    }
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erreur lors du marquage' };
    }
  }
};

// ============= UTILITAIRES EMAIL =============

export const emailService = {
  // Envoyer code d'authentification par email
  async sendAuthCode(email: string, code: string): Promise<ApiResponse<any>> {
    // TODO: Activer lors de l'intégration backend
    // try {
    //   const response = await fetch(`${API_BASE_URL}/email/send-auth-code`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email, code })
    //   });
    //   return await response.json();
    // } catch (error) {
    //   return { success: false, error: 'Erreur lors de l\'envoi email' };
    // }
    
    return { success: true, data: null };
  }
};

// ============= EXPORT / IMPORT =============

export const exportService = {
  // Exporter données étudiants
  async exportStudentsData(): Promise<ApiResponse<Blob>> {
    // TODO: Activer lors de l'intégration backend
    // try {
    //   const response = await fetch(`${API_BASE_URL}/admin/export/students`);
    //   const blob = await response.blob();
    //   return { success: true, data: blob };
    // } catch (error) {
    //   return { success: false, error: 'Erreur lors de l\'export' };
    // }
    
    return { success: true, data: new Blob() };
  },

  // Exporter rapport paiements
  async exportPaymentsReport(): Promise<ApiResponse<Blob>> {
    // TODO: Activer lors de l'intégration backend
    // try {
    //   const response = await fetch(`${API_BASE_URL}/admin/export/payments`);
    //   const blob = await response.blob();
    //   return { success: true, data: blob };
    // } catch (error) {
    //   return { success: false, error: 'Erreur lors de l\'export' };
    // }
    
    return { success: true, data: new Blob() };
  }
};