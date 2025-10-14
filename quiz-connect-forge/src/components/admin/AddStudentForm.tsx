import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StepIndicator } from '@/components/ui/step-indicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Loader2,
  Copy,
  UserPlus,
  ClipboardCheck,
  AlertCircle,
  Check,
  CreditCard,
  Banknote
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { studentService, paymentService } from '@/services/apiService';

interface AddStudentFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function AddStudentForm({ onCancel, onSuccess }: AddStudentFormProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'info' | 'payment' | 'confirmation'>('info');
  const [isLoading, setIsLoading] = useState(false);
  
  interface StudentFormData {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    notes: string;
  }

  const [studentData, setStudentData] = useState<StudentFormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    mode_paiement: 'mvola' as 'mvola' | 'espece',
    montant: 50000,
    statut: 'complet' as 'complet' | 'par_tranche',
    tranche_restante: 0,
    code_ref_mvola: ''
  });

  const [generatedCode, setGeneratedCode] = useState('');

  // Configuration des étapes
  const steps = [
    { id: 'info', title: 'Informations', icon: User },
    { id: 'payment', title: 'Paiement', icon: CreditCard },
    { id: 'confirmation', title: 'Confirmation', icon: CheckCircle }
  ];

  const getCompletedSteps = () => {
    const completed = [];
    if (currentStep !== 'info') completed.push('info');
    if (currentStep === 'confirmation') completed.push('payment');
    return completed;
  };

  const handleNext = () => {
    if (currentStep === 'info') {
      if (!studentData.nom || !studentData.prenom || !studentData.email) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      if (paymentData.mode_paiement === 'mvola' && !paymentData.code_ref_mvola) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir le code de référence MVola",
          variant: "destructive"
        });
        return;
      }
      handleSubmit();
    }
  };

  const handlePaymentModeChange = (mode: 'mvola' | 'espece') => {
    setPaymentData({
      ...paymentData,
      mode_paiement: mode,
      code_ref_mvola: mode === 'espece' ? '' : paymentData.code_ref_mvola
    });
  };

  const handlePaymentOptionChange = (option: string) => {
    if (option === 'complet') {
      setPaymentData({
        ...paymentData,
        statut: 'complet',
        tranche_restante: 0,
        montant: 50000
      });
    } else {
      setPaymentData({
        ...paymentData,
        statut: 'par_tranche',
        tranche_restante: 25000,
        montant: 25000
      });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Vérifier que les données de l'étudiant sont valides
      if (!studentData.prenom || !studentData.nom) {
        throw new Error('Le prénom et le nom de l\'étudiant sont requis');
      }
      
      // Génération du code d'authentification
      const year = new Date().getFullYear();
      const initials = (studentData.prenom.charAt(0) + studentData.nom.charAt(0)).toUpperCase();
      const random = Math.floor(Math.random() * 999) + 1;
      const authCode = `${initials}${year}${random.toString().padStart(3, '0')}`;
      
      // Préparer les données de l'étudiant pour l'API
      const studentPayload = {
        nom: studentData.nom,
        prenom: studentData.prenom,
        email: studentData.email,
        telephone: studentData.telephone,
        notes: studentData.notes,
        code_auth: authCode,
        actif: false // Par défaut, un nouvel étudiant est inactif
      };
      
      console.log('Envoi des données de l\'étudiant:', studentPayload);
      
      // Ajout de l'étudiant via API
      console.log('Envoi de la requête d\'ajout d\'étudiant:', studentPayload);
      const studentResponse = await studentService.addStudent(studentPayload);
      
      if (!studentResponse.success) {
        const errorMessage = studentResponse.error || 'Erreur lors de l\'ajout de l\'étudiant';
        console.error('Erreur lors de l\'ajout de l\'étudiant:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Afficher la réponse complète du serveur pour le débogage
      console.log('Réponse complète de l\'API d\'ajout d\'étudiant:', studentResponse);
      
      // Vérifier que nous avons bien les données de l'étudiant
      const createdStudent = studentResponse.data?.student;
      if (!createdStudent || !createdStudent.id) {
        console.error('Données étudiant manquantes dans la réponse:', studentResponse);
        throw new Error('Données étudiant manquantes dans la réponse du serveur');
      }
      
      console.log('Étudiant créé avec succès. ID:', createdStudent.id);
      
      try {
        // Préparer les données du paiement
        const paymentPayload = {
          ...paymentData,
          id_etudiant: createdStudent.id, // Utiliser l'ID de l'étudiant créé
          date_paiement: new Date().toISOString().split('T')[0],
          statut: 'en_attente' // S'assurer que le statut est défini
        };
        
        console.log('Envoi des données de paiement:', paymentPayload);
        
        // Ajout du paiement via API
        const paymentResponse = await paymentService.addPayment(paymentPayload);
        
        console.log('Réponse de l\'API d\'ajout de paiement:', paymentResponse);
        
        if (!paymentResponse.success) {
          console.warn('Avertissement: Le paiement n\'a pas pu être enregistré:', paymentResponse.error);
          // Ne pas bloquer le flux pour cette erreur, mais informer l'utilisateur
          alert(`L'étudiant a été créé mais une erreur est survenue lors de l'enregistrement du paiement: ${paymentResponse.error}`);
        } else {
          console.log('Paiement enregistré avec succès. ID:', paymentResponse.data?.payment_id);
        }
      } catch (paymentError) {
        console.error('Erreur lors de l\'ajout du paiement:', paymentError);
        // Ne pas bloquer le flux pour cette erreur, mais informer l'utilisateur
        alert(`L'étudiant a été créé mais une erreur est survenue lors de l'enregistrement du paiement. Veuillez ajouter le paiement manuellement.`);
      }
      
      // Afficher le code d'authentification et passer à l'étape de confirmation
      setGeneratedCode(authCode);
      setCurrentStep('confirmation');
      
      toast({
        title: "Étudiant ajouté",
        description: `Étudiant inscrit avec paiement ${paymentData.statut}. Code: ${authCode}`
      });
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajout de l'étudiant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    setStudentData({ nom: '', prenom: '', email: '', telephone: '', notes: '' });
    setPaymentData({ mode_paiement: 'mvola', montant: 50000, statut: 'complet', tranche_restante: 0, code_ref_mvola: '' });
    setCurrentStep('info');
    setGeneratedCode('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Ajouter un Étudiant</CardTitle>
              <CardDescription>
                Inscription manuelle d'un nouvel étudiant
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Indicateur d'étapes */}
          <StepIndicator 
            steps={steps}
            currentStep={currentStep}
            completedSteps={getCompletedSteps()}
            className="mb-8"
          />

          {/* Step Content */}
          {currentStep === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={studentData.prenom}
                    onChange={(e) => setStudentData({...studentData, prenom: e.target.value})}
                    placeholder="Prénom de l'étudiant"
                  />
                </div>
                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={studentData.nom}
                    onChange={(e) => setStudentData({...studentData, nom: e.target.value})}
                    placeholder="Nom de famille"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={studentData.email}
                    onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={studentData.telephone}
                    onChange={(e) => setStudentData({...studentData, telephone: e.target.value})}
                    placeholder="+261 XX XX XXX XX"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes internes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={studentData.notes}
                  onChange={(e) => setStudentData({...studentData, notes: e.target.value})}
                  placeholder="Informations complémentaires..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {currentStep === 'payment' && (
            <div className="space-y-6">
              {/* Récapitulatif étudiant */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Récapitulatif</h3>
                <p>{studentData.prenom} {studentData.nom}</p>
                <p className="text-sm text-muted-foreground">{studentData.email}</p>
              </div>

              {/* Choix du mode de paiement */}
              <div className="space-y-4">
                <Label>Mode de paiement *</Label>
                <Tabs value={paymentData.mode_paiement} onValueChange={(value: string) => handlePaymentModeChange(value as 'mvola' | 'espece')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="mvola" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      MVola
                    </TabsTrigger>
                    <TabsTrigger value="espece" className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Espèces
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="mvola" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mvola-option">Option de paiement</Label>
                      <Select onValueChange={handlePaymentOptionChange} defaultValue="complet">
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complet">Paiement complet - 50 000 Ar</SelectItem>
                          <SelectItem value="tranche">1ère tranche - 25 000 Ar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="mvola-ref">Code de référence MVola *</Label>
                      <Input
                        id="mvola-ref"
                        type="text"
                        placeholder="Ex: MV123456789"
                        value={paymentData.code_ref_mvola}
                        onChange={(e) => setPaymentData({...paymentData, code_ref_mvola: e.target.value})}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="espece" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cash-option">Option de paiement</Label>
                      <Select onValueChange={handlePaymentOptionChange} defaultValue="complet">
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complet">Paiement complet - 50 000 Ar</SelectItem>
                          <SelectItem value="tranche">1ère tranche - 25 000 Ar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Alert>
                      <AlertDescription>
                        Le paiement en espèces sera marqué comme reçu. L'étudiant recevra son code d'authentification immédiatement.
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Montant à payer */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between">
                  <span className="font-semibold">Montant:</span>
                  <span className="text-lg font-bold text-primary">
                    {paymentData.montant.toLocaleString()} Ar
                  </span>
                </div>
                {paymentData.tranche_restante > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Montant restant: {paymentData.tranche_restante.toLocaleString()} Ar
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 'confirmation' && (
            <div className="space-y-6 text-center">
              <div className="p-6 bg-success/10 rounded-lg">
                <Check className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-success">Étudiant ajouté avec succès!</h3>
                <div className="p-4 bg-background rounded border-2 border-dashed border-primary">
                  <p className="text-sm text-muted-foreground mb-1">Code d'authentification généré:</p>
                  <p className="text-2xl font-mono font-bold text-primary">{generatedCode}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Le code d'authentification a été envoyé par email à <strong>{studentData.email}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            {currentStep !== 'info' && currentStep !== 'confirmation' && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep === 'payment' ? 'info' : 'info')}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            )}
            
            {currentStep === 'info' && (
              <Button onClick={handleNext} className="ml-auto bg-gradient-primary">
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 'payment' && (
              <Button 
                onClick={handleNext} 
                disabled={isLoading}
                className="ml-auto bg-gradient-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    Finaliser l'inscription
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
            
            {currentStep === 'confirmation' && (
              <Button onClick={handleFinish} className="ml-auto bg-gradient-primary">
                Terminer
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}