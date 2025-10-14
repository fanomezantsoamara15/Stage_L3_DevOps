import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, GraduationCap, User, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RegistrationForm } from './RegistrationForm';
import { authService } from '@/services/apiService';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, loginAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const [showRegistration, setShowRegistration] = useState(false);
  
  // État pour connexion étudiant
  const [studentForm, setStudentForm] = useState({
    email: '',
    codeAuth: ''
  });
  
  // État pour connexion admin
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!studentForm.email || !studentForm.codeAuth) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      // Utiliser le service API pour l'authentification
      const response = await authService.loginStudent(studentForm.email, studentForm.codeAuth);
      
      if (response.success) {
        // Utiliser le contexte d'auth pour mettre à jour l'état global
        const success = await login(studentForm.email, studentForm.codeAuth);
        if (success) {
          toast({
            title: "Connexion réussie",
            description: "Bienvenue dans votre espace de formation !"
          });
          onSuccess();
        } else {
          setError('Email ou code d\'authentification incorrect, ou compte suspendu');
        }
      } else {
        setError('Email ou code d\'authentification incorrect, ou compte suspendu');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!adminForm.email || !adminForm.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      // Utiliser le service API pour l'authentification admin
      const response = await authService.loginAdmin(adminForm.email, adminForm.password);
      
      if (response.success) {
        // Utiliser le contexte d'auth pour mettre à jour l'état global
        const success = await loginAdmin(adminForm.email, adminForm.password);
        if (success) {
          toast({
            title: "Connexion administrateur réussie",
            description: "Accès au panneau d'administration accordé"
          });
          onSuccess();
        } else {
          setError('Email ou mot de passe administrateur incorrect');
        }
      } else {
        setError('Email ou mot de passe administrateur incorrect');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    }
  };

  // Afficher le formulaire d'inscription si demandé
  if (showRegistration) {
    return (
      <RegistrationForm 
        onSuccess={onSuccess}
        onBackToLogin={() => setShowRegistration(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-hover">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Plateforme de Formation</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à vos cours et examens
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Étudiant
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-email">Email</Label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="votre.email@example.com"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code-auth">Code d'authentification</Label>
                  <Input
                    id="code-auth"
                    type="text"
                    placeholder="Ex: JR2024001"
                    value={studentForm.codeAuth}
                    onChange={(e) => setStudentForm({...studentForm, codeAuth: e.target.value})}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>
              
              <div className="mt-4 space-y-3">
                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowRegistration(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    S'inscrire à la formation
                  </Button>
                </div>
                
                <div className="text-sm text-center text-muted-foreground">
                  <p>Données de test:</p>
                  <p>Email: jean.rakoto@email.com</p>
                  <p>Code: JR2024001</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email administrateur</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@formation.com"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Mot de passe</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Connexion Admin'
                  )}
                </Button>
              </form>
              
              <div className="mt-4 text-sm text-center text-muted-foreground">
                <p>Données de test:</p>
                <p>Email: admin@formation.com</p>
                <p>Mot de passe: admin123</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}