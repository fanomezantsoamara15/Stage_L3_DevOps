import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  CreditCard, 
  BookOpen, 
  Bell,
  UserCheck,
  UserX,
  Plus,
  Eye,
  Edit,
  Trash2,
  Upload,
  Send,
  LogOut,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { quizService, notificationService } from '@/services/apiService';
import { StudentManagement } from './StudentManagement';
import { PaymentManagement } from './PaymentManagement';
import { QuizCreator } from './QuizCreator';
import { DashboardMetrics } from './DashboardMetrics';
import { QuizManager } from './QuizManager';
import { DocumentManager } from './DocumentManager';

export function AdminDashboard() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quiz, setQuiz] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // États pour les formulaires
  const [newNotification, setNewNotification] = useState({
    titre: '',
    message: '',
    type_cible: 'tous' as 'tous' | 'individuel',
    id_etudiant: ''
  });

  // Charger les données quiz et notifications
  useEffect(() => {
    loadQuizData();
    loadNotifications();
  }, []);

  const loadQuizData = async () => {
    try {
      const response = await quizService.getAllQuiz();
      if (response.success && response.data) {
        setQuiz(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des quiz:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationService.getAllNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  // Actions admin supprimées - maintenant gérées par les composants spécialisés

  const handleValidatePayment = async (paymentId: number) => {
    // TODO: API Flask pour valider un paiement
    // await fetch(`/api/admin/payments/${paymentId}/validate`, {
    //   method: 'POST'
    // });
    
    toast({
      title: "Paiement validé",
      description: "Le paiement a été validé et le code d'authentification envoyé"
    });
  };

  const handleSuspendStudent = async (studentId: number, suspend: boolean) => {
    // TODO: API Flask pour suspendre/activer un étudiant
    // await fetch(`/api/admin/students/${studentId}/suspend`, {
    //   method: 'POST',
    //   body: JSON.stringify({ suspend })
    // });
    
    const action = suspend ? 'suspendu' : 'réactivé';
    toast({
      title: `Étudiant ${action}`,
      description: `Le compte étudiant a été ${action} avec succès`
    });
  };

  const handleSendNotification = async () => {
    try {
      setLoading(true);
      const response = await notificationService.sendNotification(newNotification);
      
      if (response.success) {
        toast({
          title: "Notification envoyée",
          description: "La notification a été envoyée aux destinataires"
        });
        
        setNewNotification({
          titre: '',
          message: '',
          type_cible: 'tous',
          id_etudiant: ''
        });
        
        // Recharger les notifications
        loadNotifications();
      } else {
        throw new Error(response.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">

        {/* Interface d'administration */}
        <Tabs defaultValue="students" className="space-y-6 mt-8">
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b pb-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto flex-1">
                <TabsTrigger value="students" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Étudiants</span>
                  <span className="sm:hidden">👥</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Paiements</span>
                  <span className="sm:hidden">💳</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Contenus</span>
                  <span className="sm:hidden">📚</span>
                </TabsTrigger>
                <TabsTrigger value="quiz" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Quiz/Examens</span>
                  <span className="sm:hidden">📝</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Notifications</span>
                  <span className="sm:hidden">🔔</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Bouton de déconnexion */}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2 min-w-fit"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>

          {/* Gestion des étudiants */}
          <TabsContent value="students">
            <StudentManagement />
          </TabsContent>

          {/* Gestion des paiements */}
          <TabsContent value="payments">
            <PaymentManagement />
          </TabsContent>

          {/* Gestion des contenus/documents */}
          <TabsContent value="content">
            <DocumentManager />
          </TabsContent>

          {/* Gestion des quiz */}
          <TabsContent value="quiz">
            {showQuizCreator ? (
              <QuizCreator
                quiz={editingQuiz}
                isEditing={!!editingQuiz}
                onCancel={() => {
                  setShowQuizCreator(false);
                  setEditingQuiz(null);
                }}
                onSuccess={() => {
                  setShowQuizCreator(false);
                  setEditingQuiz(null);
                  loadQuizData();
                }}
              />
            ) : (
              <QuizManager
                onCreateQuiz={() => setShowQuizCreator(true)}
                onEditQuiz={(quiz) => {
                  setEditingQuiz(quiz);
                  setShowQuizCreator(true);
                }}
                onDataChange={() => loadQuizData()}
              />
            )}
          </TabsContent>

          {/* Gestion des notifications */}
          <TabsContent value="notifications">
            <div className="grid gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Envoyer une Notification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notif-title">Titre</Label>
                    <Input
                      id="notif-title"
                      value={newNotification.titre}
                      onChange={(e) => setNewNotification({...newNotification, titre: e.target.value})}
                      placeholder="Titre de la notification"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notif-message">Message</Label>
                    <textarea
                      id="notif-message"
                      className="w-full min-h-[100px] p-3 border rounded-md"
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                      placeholder="Contenu de la notification..."
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <Label>Type de destinataire:</Label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="type_cible"
                          value="tous"
                          checked={newNotification.type_cible === 'tous'}
                          onChange={(e) => setNewNotification({...newNotification, type_cible: e.target.value as 'tous'})}
                        />
                        <span>Tous les étudiants</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="type_cible"
                          value="individuel"
                          checked={newNotification.type_cible === 'individuel'}
                          onChange={(e) => setNewNotification({...newNotification, type_cible: e.target.value as 'individuel'})}
                        />
                        <span>Étudiant spécifique</span>
                      </label>
                    </div>
                  </div>

                  {newNotification.type_cible === 'individuel' && (
                    <div>
                      <Label htmlFor="student-id">ID Étudiant</Label>
                      <Input
                        id="student-id"
                        value={newNotification.id_etudiant}
                        onChange={(e) => setNewNotification({...newNotification, id_etudiant: e.target.value})}
                        placeholder="ID de l'étudiant"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleSendNotification}
                    className="bg-gradient-primary"
                    disabled={loading || !newNotification.titre || !newNotification.message}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Envoi...' : 'Envoyer la notification'}
                  </Button>
                </CardContent>
              </Card>

              {/* Historique des notifications */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Historique des Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((notif) => (
                      <div key={notif.id_notification} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{notif.titre}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notif.message}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span>{new Date(notif.date_envoi).toLocaleString()}</span>
                              <Badge variant="outline" className="text-xs">
                                {notif.type_cible === 'tous' ? 'Tous' : 'Individuel'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}