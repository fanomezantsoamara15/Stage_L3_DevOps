import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSession, Etudiant } from '../types';
import { authService, studentService, paymentService } from '../services/apiService';

interface AuthContextType {
  session: UserSession;
  login: (email: string, codeAuth: string) => Promise<boolean>;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  register: (studentData: any, paymentData: any) => Promise<string>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession>({
    user: null,
    isAdmin: false,
    isAuthenticated: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Connexion étudiant via API
  const login = async (email: string, codeAuth: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authService.loginStudent(email, codeAuth);
      
      if (response.success && response.data) {
        setSession({
          user: response.data.user,
          isAdmin: false,
          isAuthenticated: true
        });
        // Stocker le token pour les futures requêtes
        if (response.data.token) {
          localStorage.setItem('auth-token', response.data.token);
        }
        localStorage.setItem('auth-session', JSON.stringify({
          userId: response.data.user.id_etudiant,
          isAdmin: false
        }));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Erreur de connexion étudiant:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Connexion admin via API
  const loginAdmin = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authService.loginAdmin(email, password);
      
      if (response.success && response.data) {
        setSession({
          user: null,
          isAdmin: true,
          isAuthenticated: true
        });
        // Stocker le token pour les futures requêtes
        if (response.data.token) {
          localStorage.setItem('auth-token', response.data.token);
        }
        localStorage.setItem('auth-session', JSON.stringify({
          userId: 'admin',
          isAdmin: true
        }));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Erreur de connexion admin:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Inscription étudiant via API
  const register = async (studentData: any, paymentData: any): Promise<string> => {
    setIsLoading(true);
    
    try {
      // Appeler le service d'inscription qui utilise le nouvel endpoint
      const response = await authService.registerStudent(studentData, paymentData);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur lors de l\'inscription');
      }
      
      setIsLoading(false);
      return response.data.code_auth || '';
      
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    setSession({
      user: null,
      isAdmin: false,
      isAuthenticated: false
    });
    localStorage.removeItem('auth-session');
    localStorage.removeItem('auth-token');
  };

  // Restaurer la session au chargement
  useEffect(() => {
    const restoreSession = async () => {
      const savedSession = localStorage.getItem('auth-session');
      const authToken = localStorage.getItem('auth-token');
      
      if (savedSession && authToken) {
        try {
          const { userId, isAdmin } = JSON.parse(savedSession);
          
          if (isAdmin) {
            // Valider le token admin côté serveur
            try {
              const verify = await authService.verifyToken();
              if (verify.success && verify.data?.isAdmin) {
                setSession({
                  user: null,
                  isAdmin: true,
                  isAuthenticated: true
                });
              } else {
                localStorage.removeItem('auth-session');
                localStorage.removeItem('auth-token');
              }
            } catch (e) {
              localStorage.removeItem('auth-session');
              localStorage.removeItem('auth-token');
            }
          } else {
            // Validation étudiant avec vérification du token serveur
            try {
              const verify = await authService.verifyToken();
              if (verify.success && verify.data?.user?.id === userId) {
                setSession({
                  user: verify.data.user,
                  isAdmin: false,
                  isAuthenticated: true
                });
              } else {
                localStorage.removeItem('auth-session');
                localStorage.removeItem('auth-token');
              }
            } catch (error) {
              console.error('Erreur lors de la vérification du token étudiant:', error);
              localStorage.removeItem('auth-session');
              localStorage.removeItem('auth-token');
            }
          }
        } catch (error) {
          console.error('Erreur lors du parsing de la session:', error);
          localStorage.removeItem('auth-session');
          localStorage.removeItem('auth-token');
        }
      }
    };
    
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      login,
      loginAdmin,
      register,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}