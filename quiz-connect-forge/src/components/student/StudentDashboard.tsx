import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  FileText, 
  Clock, 
  Award, 
  CreditCard, 
  Bell,
  Download,
  Play,
  X,
  CheckCircle,
  AlertCircle,
  LogOut,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { documentService, quizService, paymentService, notificationService, authService } from '@/services/apiService';
import { QuizTaker } from './QuizTaker';
import { PdfPreview } from '@/components/common/PdfPreview';

export function StudentDashboard() {
  const { session, logout } = useAuth();
  const { toast } = useToast();
  const [activeQuiz, setActiveQuiz] = useState<number | null>(null);
  const [takingQuiz, setTakingQuiz] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les données
  const [documents, setDocuments] = useState<any[]>([]);
  const [quiz, setQuiz] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewUseAlt, setPreviewUseAlt] = useState<boolean>(false);

  if (!session.user) return null;

  // Chargement des données
  useEffect(() => {
    loadStudentData();
  }, [session.user?.id_etudiant]);

  const loadStudentData = async () => {
    if (!session.user?.id_etudiant) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [documentsRes, quizRes, paymentsRes, notificationsRes] = await Promise.all([
        documentService.getAllDocuments(),
        quizService.getAllQuiz(),
        paymentService.getStudentPayments(session.user.id_etudiant),
        notificationService.getStudentNotifications(session.user.id_etudiant)
      ]);
      
      if (documentsRes.success && documentsRes.data) {
        // Afficher tous les documents. L'UI gère la possibilité de téléchargement vs simple visualisation.
        setDocuments(documentsRes.data);
      }
      
      if (quizRes.success && quizRes.data) {
        const now = new Date();
        const available = quizRes.data.filter((q: any) => {
          if (q.statut) return q.statut === 'actif';
          const startOk = q.date_debut ? new Date(q.date_debut) <= now : true;
          const endOk = q.date_fin ? now <= new Date(q.date_fin) : true;
          return startOk && endOk;
        });
        setQuiz(available);
      }
      
      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data);
      }
      
      if (notificationsRes.success && notificationsRes.data) {
        setNotifications(notificationsRes.data);
      }
      
      // Charger les résultats des quiz
      const resultsRes = await authService.getStudentResults(session.user.id_etudiant);
      if (resultsRes.success && resultsRes.data) {
        setResults(resultsRes.data);
      } else {
        setResults([]);
      }
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger vos données.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAltPdfUrl = (chemin: string) => {
    const fileUrl = getPreviewUrl(chemin);
    const encoded = encodeURIComponent(fileUrl);
    return `https://docs.google.com/gview?embedded=1&url=${encoded}`;
  };

  // Calcul des statistiques
  const totalPayments = payments.reduce((sum, p) => sum + p.montant, 0);
  const remainingAmount = payments.reduce((sum, p) => sum + p.tranche_restante, 0);
  const averageScore = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  const paymentStatus = remainingAmount === 0 ? 'complet' : 'partiel';
  const unreadNotifications = notifications.filter(n => !n.lu).length;

  // Démarrage d'un quiz
  const startQuiz = async (quizId: number) => {
    try {
      // TODO: Implémenter l'endpoint pour démarrer un quiz
      // const response = await quizService.startQuiz(quizId, session.user!.id_etudiant);
      // if (response.success) {
        setTakingQuiz(quizId);
      // }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de démarrer le quiz.",
        variant: "destructive"
      });
    }
  };
  
  // Télécharger un document
  const downloadDocument = async (chemin: string, filename: string) => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
      const url = `${base}${chemin}`;
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document.",
        variant: "destructive"
      });
    }
  };

  // Ouvrir/visualiser un document dans une fenêtre de prévisualisation intégrée
  const openDocument = (doc: any) => {
    try {
      setPreviewError(null);
      // Toujours commencer par le viewer natif (embed/iframe). L'alternative Google peut être bloquée.
      setPreviewUseAlt(false);
      setPreviewDoc(doc);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le document.",
        variant: "destructive"
      });
    }
  };

  const closePreview = () => setPreviewDoc(null);

  const getPreviewUrl = (chemin: string) => {
    const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    const url = `${base}${chemin}`;
    // Encoder proprement les espaces et caractères spéciaux sans casser les '/'
    return encodeURI(url);
  };

  const getDerivedDocType = (doc: any): 'pdf' | 'video' | 'image' | 'other' => {
    const declared = (doc?.type || '').toString().toLowerCase().trim();
    if (declared === 'pdf' || declared === 'video' || declared === 'image') return declared as any;
    const path: string = (doc?.chemin || '').toString().toLowerCase();
    const ext = path.split('.').pop() || '';
    const imageExt = ['png','jpg','jpeg','gif','webp','bmp','svg'];
    const videoExt = ['mp4','webm','ogg','mov','avi','mkv'];
    if (ext === 'pdf') return 'pdf';
    if (imageExt.includes(ext)) return 'image';
    if (videoExt.includes(ext)) return 'video';
    return 'other';
  };
  
  // Marquer une notification comme lue
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => n.id_notification === notificationId ? { ...n, lu: true } : n)
        );
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'video': return <Play className="h-4 w-4" />;
      case 'image': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getQuizStatusBadge = (quiz: any) => {
    switch (quiz.statut) {
      case 'actif':
        return <Badge className="bg-success">Disponible</Badge>;
      case 'planifie':
        return <Badge variant="secondary">Programmé</Badge>;
      case 'clos':
        return <Badge variant="outline">Terminé</Badge>;
      default:
        return <Badge variant="outline">{quiz.statut}</Badge>;
    }
  };

  // Si on est en train de passer un quiz
  if (takingQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
        <QuizTaker 
          quizId={takingQuiz} 
          onExit={() => setTakingQuiz(null)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 pt-20">{/* Padding top pour la barre fixe */}
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Paiement</p>
                  <p className="text-2xl font-bold">
                    {paymentStatus === 'complet' ? 'Complet' : 'Partiel'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Moyenne</p>
                  <p className="text-2xl font-bold">{averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold">{documents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Bell className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Notifications</p>
                  <p className="text-2xl font-bold">{unreadNotifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de navigation fixe en haut */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-sm sm:text-lg font-bold text-foreground">
                  {session.user.prenom} {session.user.nom}
                </h1>
                <Badge 
                  variant={session.user.actif ? "default" : "destructive"}
                  className="text-xs"
                >
                  {session.user.actif ? 'Actif' : 'Suspendu'}
                </Badge>
              </div>
              
              {/* Bouton de déconnexion */}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Espacement pour la barre fixe */}
        <div className="h-16"></div>

        {/* Contenu principal */}
        <Tabs defaultValue="documents" className="space-y-6">
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b pb-4 mb-6">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto w-full">
              <TabsTrigger value="documents" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Documents</span>
                <span className="sm:hidden">Docs</span>
              </TabsTrigger>
              <TabsTrigger value="quiz" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Quiz & Examens</span>
                <span className="sm:hidden">Quiz</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Résultats</span>
                <span className="sm:hidden">Notes</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Paiements</span>
                <span className="sm:hidden">€</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">🔔</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Onglet Documents */}
          <TabsContent value="documents">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Mes Documents
                </CardTitle>
                <CardDescription>
                  Accédez à tous vos supports de cours et ressources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id_document} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {getTypeIcon(doc.type)}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium truncate">{doc.titre}</h4>
                            <p className="text-sm text-muted-foreground">
                              {doc.type.toUpperCase()} • {new Date(doc.date_upload).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!doc.telechargeable && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">Non téléchargeable</Badge>
                          )}
                          {doc.telechargeable && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => downloadDocument(doc.chemin, doc.titre)}
                            >
                              <Download className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Télécharger</span>
                            </Button>
                          )}
                          <Button size="sm" className="text-xs" onClick={() => openDocument(doc)}>
                            <Play className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Ouvrir</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {documents.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun document disponible pour le moment
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Quiz */}
          <TabsContent value="quiz">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Quiz & Examens
                </CardTitle>
                <CardDescription>
                  Passez vos évaluations et tests de connaissances
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {quiz.map((quizItem) => (
                      <div key={quizItem.id_quiz} className="p-4 sm:p-6 border rounded-lg space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base sm:text-lg font-semibold truncate">{quizItem.titre}</h4>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1">
                              <span>{quizItem.type.charAt(0).toUpperCase() + quizItem.type.slice(1)}</span>
                              <span>•</span>
                              <span>{quizItem.total_points} pts</span>
                              <span>•</span>
                              <span>{quizItem.duree} min</span>
                            </div>
                          </div>
                          {getQuizStatusBadge(quizItem)}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <p><span className="font-medium">Début:</span> {new Date(quizItem.date_debut).toLocaleDateString()}</p>
                          <p><span className="font-medium">Fin:</span> {new Date(quizItem.date_fin).toLocaleDateString()}</p>
                        </div>
                        
                        {quizItem.statut === 'actif' && (
                          <Button 
                            onClick={() => startQuiz(quizItem.id_quiz)}
                            className="bg-gradient-primary w-full sm:w-auto"
                            size="lg"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Commencer le quiz
                          </Button>
                        )}
                      </div>
                    ))}
                    {quiz.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun quiz disponible pour le moment
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Résultats */}
          <TabsContent value="results">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Mes Résultats
                </CardTitle>
                <CardDescription>
                  Consultez vos notes et performances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result) => {
                    const quizItem = quiz.find(q => q.id_quiz === result.id_quiz);
                    const percentage = Math.round((result.score / (quizItem?.total_points || 100)) * 100);
                    
                    return (
                      <div key={result.id_resultat} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{quizItem?.titre}</h4>
                          <Badge variant={percentage >= 70 ? "default" : "destructive"}>
                            {result.score}/{quizItem?.total_points} ({percentage}%)
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          Passé le {new Date(result.date_passage).toLocaleString()} • 
                          Temps utilisé: {result.temps_utilise} min
                        </div>
                        
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                  
                  {results.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun résultat disponible pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Paiements */}
          <TabsContent value="payments">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Statut des Paiements
                </CardTitle>
                <CardDescription>
                  Suivez l'état de vos paiements et tranches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Montant Total Payé</h4>
                    <p className="text-2xl font-bold text-success">{totalPayments.toLocaleString()} Ar</p>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Montant Restant</h4>
                    <p className="text-2xl font-bold text-warning">{remainingAmount.toLocaleString()} Ar</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Historique des Paiements</h4>
                  {payments.map((payment) => (
                    <div key={payment.id_paiement} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{Number(payment.montant || 0).toLocaleString()} Ar</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.mode_paiement === 'mvola' ? 'MVola' : 'Espèces'} • 
                          {payment.date_paiement ? new Date(payment.date_paiement).toLocaleDateString() : ''}
                        </p>
                        {payment.code_ref_mvola && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {payment.code_ref_mvola}
                          </p>
                        )}
                      </div>
                      
                      <Badge variant={
                        payment.statut === 'complet' ? 'default' :
                        payment.statut === 'par_tranche' ? 'secondary' : 'destructive'
                      }>
                        {payment.statut === 'complet' ? 'Complet' :
                         payment.statut === 'par_tranche' ? 'Par tranche' : 'En attente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Notifications */}
          <TabsContent value="notifications">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Restez informé des dernières actualités de votre formation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id_notification} 
                      className={`p-4 border rounded-lg ${notification.lu ? 'opacity-75' : 'border-primary/50 bg-primary/5'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            {!notification.lu && <div className="w-2 h-2 bg-primary rounded-full" />}
                            {notification.titre}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.date_envoi).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune notification pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Overlay de prévisualisation de document */}
        {previewDoc && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6">
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-background rounded-lg shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="min-w-0 pr-2">
                  <h3 className="font-semibold truncate">{previewDoc.titre}</h3>
                  <p className="text-xs text-muted-foreground truncate">{previewDoc.type?.toUpperCase()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={closePreview} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-muted/20" onContextMenu={(e) => { if (previewDoc && previewDoc.telechargeable === false) { e.preventDefault(); } }}>
                {getDerivedDocType(previewDoc) === 'pdf' && (
                  previewDoc.telechargeable === false ? (
                    <PdfPreview url={getPreviewUrl(previewDoc.chemin)} onError={() => setPreviewError("Impossible de charger le PDF.")} disableContextMenu />
                  ) : (
                    previewUseAlt ? (
                      <iframe
                        title={previewDoc.titre}
                        src={getAltPdfUrl(previewDoc.chemin)}
                        className="w-full h-[75vh]"
                      />
                    ) : (
                      <div className="w-full h-[75vh] overflow-auto bg-black">
                        <embed
                          src={getPreviewUrl(previewDoc.chemin)}
                          type="application/pdf"
                          className="w-full h-full"
                        />
                      </div>
                    )
                  )
                )}
                {getDerivedDocType(previewDoc) === 'video' && (
                  <video
                    src={getPreviewUrl(previewDoc.chemin)}
                    className="w-full h-[75vh] bg-black"
                    controls
                    onContextMenu={(e) => { if (previewDoc && previewDoc.telechargeable === false) { e.preventDefault(); } }}
                    // controlsList est supporté par la plupart des navigateurs Chromium pour masquer "Télécharger"
                    // @ts-ignore
                    controlsList={previewDoc && previewDoc.telechargeable === false ? 'nodownload' : undefined}
                    onError={() => setPreviewError("Impossible de charger la vidéo.")}
                  />
                )}
                {getDerivedDocType(previewDoc) === 'image' && (
                  <div className="w-full h-[75vh] flex items-center justify-center bg-black overflow-auto">
                    <img src={getPreviewUrl(previewDoc.chemin)} alt={previewDoc.titre} className="max-h-full max-w-full" onError={() => setPreviewError("Impossible de charger l'image.")} />
                  </div>
                )}
                {getDerivedDocType(previewDoc) === 'other' && (
                  <div className="w-full h-[75vh] overflow-auto">
                    <iframe
                      title={previewDoc.titre}
                      src={getPreviewUrl(previewDoc.chemin)}
                      className="w-full h-full"
                    />
                  </div>
                )}
                {previewError && (
                  <div className="p-3 text-sm text-destructive">
                    {previewError} Essayez avec "Ouvrir dans un onglet" ci-dessous.
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 p-3 border-t bg-background">
                  {previewDoc.telechargeable && (
                    <div className="text-xs text-muted-foreground truncate">
                      URL: <a href={getPreviewUrl(previewDoc.chemin)} target="_blank" rel="noreferrer" className="underline">{getPreviewUrl(previewDoc.chemin)}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {getDerivedDocType(previewDoc) === 'pdf' && previewDoc.telechargeable && (
                      <Button size="sm" variant="outline" onClick={() => setPreviewUseAlt((v) => !v)}>
                        {previewUseAlt ? 'Viewer direct PDF' : 'Viewer alternatif PDF'}
                      </Button>
                    )}
                    {previewDoc.telechargeable && (
                      <Button size="sm" variant="outline" onClick={() => window.open(getPreviewUrl(previewDoc.chemin), '_blank')}>Ouvrir dans un onglet</Button>
                    )}
                    {previewDoc.telechargeable && (
                      <Button size="sm" onClick={() => downloadDocument(previewDoc.chemin, previewDoc.titre)}>Télécharger</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}