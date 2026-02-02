// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { StepIndicator } from '@/components/ui/step-indicator';
// import { Loader2, GraduationCap, CreditCard, Banknote, ArrowLeft, CheckCircle, User, Receipt } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';
// import { useAuth } from '@/context/AuthContext';

// interface RegistrationFormProps {
//   onSuccess: () => void;
//   onBackToLogin: () => void;
// }

// interface StudentData {
//   nom: string;
//   prenom: string;
//   email: string;
//   numero: string; // Numéro de téléphone pour envoi d'argent
// }

// interface PaymentData {
//   mode_paiement: 'mvola' | 'espece';
//   montant: number;
//   code_ref_mvola?: string;
//   statut: 'complet' | 'par_tranche';
//   tranche_restante: number;
// }

// export function RegistrationForm({ onSuccess, onBackToLogin }: RegistrationFormProps) {
//   const { toast } = useToast();
//   const { register } = useAuth();
//   const [currentStep, setCurrentStep] = useState<'info' | 'payment' | 'confirmation'>('info');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   // Données étudiant
//   const [studentData, setStudentData] = useState<StudentData>({
//     nom: '',
//     prenom: '',
//     email: '',
//     numero: ''
//   });

//   // Données paiement
//   const [paymentData, setPaymentData] = useState<PaymentData>({
//     mode_paiement: 'mvola',
//     montant: 50000, // Montant par défaut de la formation
//     statut: 'complet',
//     tranche_restante: 0
//   });

//   const [mvolaRef, setMvolaRef] = useState('');
//   const [generatedCode, setGeneratedCode] = useState('');

//   // Configuration des étapes
//   const steps = [
//     { id: 'info', title: 'Informations', icon: User },
//     { id: 'payment', title: 'Paiement', icon: CreditCard },
//     { id: 'confirmation', title: 'Confirmation', icon: CheckCircle }
//   ];

//   const getCompletedSteps = () => {
//     const completed = [];
//     if (currentStep !== 'info') completed.push('info');
//     if (currentStep === 'confirmation') completed.push('payment');
//     return completed;
//   };

//   // Étape 1: Informations personnelles
//   const handleStudentInfoSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
    
//     if (!studentData.nom || !studentData.prenom || !studentData.email || !studentData.numero) {
//       setError('Veuillez remplir tous les champs obligatoires');
//       return;
//     }

//     // Validation email
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(studentData.email)) {
//       setError('Veuillez saisir un email valide');
//       return;
//     }

//     // Validation numéro (8 à 12 chiffres)
//     const phoneRegex = /^\d{8,12}$/;
//     if (!phoneRegex.test(studentData.numero.replace(/\D/g, ''))) {
//       setError('Veuillez saisir un numéro de téléphone valide');
//       return;
//     }

//     setCurrentStep('payment');
//   };

//   // Étape 2: Traitement du paiement
//   const handleSubmit = async () => {
//     setIsLoading(true);
//     setError('');
    
//     try {
//       // Préparer les données pour l'inscription
//       const studentRegistrationData = {
//         nom: studentData.nom,
//         prenom: studentData.prenom,
//         email: studentData.email,
//         telephone: studentData.numero,
//         // Les champs suivants seront utilisés par le backend
//         mode_paiement: paymentData.mode_paiement,
//         montant: paymentData.montant,
//         code_ref_mvola: paymentData.mode_paiement === 'mvola' ? mvolaRef : '',
//         statut: paymentData.statut,
//         tranche_restante: paymentData.tranche_restante
//       };

//       // Appel à la fonction register du contexte d'authentification
//       const result = await register(studentRegistrationData, paymentData);
      
//       if (result) {
//         // L'inscription a réussi, afficher le code d'authentification
//         setGeneratedCode(result);
//         setCurrentStep('confirmation');
        
//         toast({
//           title: "Inscription réussie !",
//           description: `Votre code d'authentification vous a été envoyé par email.`
//         });
//       } else {
//         throw new Error('Échec de l\'inscription');
//       }
//     } catch (err) {
//       console.error('Erreur lors de l\'inscription:', err);
//       setError('Erreur lors de l\'inscription. Veuillez réessayer ou contacter le support.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePaymentModeChange = (mode: 'mvola' | 'espece') => {
//     setPaymentData({
//       ...paymentData,
//       mode_paiement: mode
//     });
//   };

//   const handlePaymentOptionChange = (option: string) => {
//     if (option === 'complet') {
//       setPaymentData({
//         ...paymentData,
//         statut: 'complet',
//         tranche_restante: 0,
//         montant: 50000
//       });
//     } else {
//       setPaymentData({
//         ...paymentData,
//         statut: 'par_tranche',
//         tranche_restante: 25000,
//         montant: 25000
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
//       <Card className="w-full max-w-2xl shadow-hover">
//         <CardHeader className="text-center">
//           <div className="flex justify-center mb-2">
//             <GraduationCap className="h-12 w-12 text-primary" />
//           </div>
//           <CardTitle className="text-2xl font-bold">Inscription à la Formation</CardTitle>
//           <CardDescription>
//             {currentStep === 'info' && 'Complétez vos informations personnelles'}
//             {currentStep === 'payment' && 'Choisissez votre mode de paiement'}
//             {currentStep === 'confirmation' && 'Inscription terminée avec succès'}
//           </CardDescription>
//         </CardHeader>

//         <CardContent>
//           {/* Indicateur d'étapes */}
//           <StepIndicator 
//             steps={steps}
//             currentStep={currentStep}
//             completedSteps={getCompletedSteps()}
//             className="mb-6"
//           />

//           {/* Étape 1: Informations personnelles */}
//           {currentStep === 'info' && (
//             <form onSubmit={handleStudentInfoSubmit} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="nom">Nom *</Label>
//                   <Input
//                     id="nom"
//                     type="text"
//                     placeholder="Votre nom de famille"
//                     value={studentData.nom}
//                     onChange={(e) => setStudentData({...studentData, nom: e.target.value})}
//                     disabled={isLoading}
//                   />
//                 </div>
                
//                 <div className="space-y-2">
//                   <Label htmlFor="prenom">Prénom *</Label>
//                   <Input
//                     id="prenom"
//                     type="text"
//                     placeholder="Votre prénom"
//                     value={studentData.prenom}
//                     onChange={(e) => setStudentData({...studentData, prenom: e.target.value})}
//                     disabled={isLoading}
//                   />
//                 </div>
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="email">Adresse Email *</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="votre.email@example.com"
//                   value={studentData.email}
//                   onChange={(e) => setStudentData({...studentData, email: e.target.value})}
//                   disabled={isLoading}
//                 />
//                 <p className="text-sm text-muted-foreground">
//                   Votre code d'authentification sera envoyé à cette adresse
//                 </p>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="numero">Numéro de téléphone (MVola) *</Label>
//                 <Input
//                   id="numero"
//                   type="tel"
//                   placeholder="Ex: 0341234567"
//                   value={studentData.numero}
//                   onChange={(e) => setStudentData({...studentData, numero: e.target.value})}
//                   disabled={isLoading}
//                 />
//                 <p className="text-sm text-muted-foreground">
//                   Ce numéro sera utilisé pour le paiement MVola
//                 </p>
//               </div>

//               {error && (
//                 <Alert variant="destructive">
//                   <AlertDescription>{error}</AlertDescription>
//                 </Alert>
//               )}

//               <div className="flex space-x-4">
//                 <Button 
//                   type="button" 
//                   variant="outline" 
//                   onClick={onBackToLogin}
//                   className="flex-1"
//                 >
//                   <ArrowLeft className="h-4 w-4 mr-2" />
//                   Retour à la connexion
//                 </Button>
//                 <Button 
//                   type="submit" 
//                   className="flex-1 bg-gradient-primary"
//                   disabled={isLoading}
//                 >
//                   Continuer
//                 </Button>
//               </div>
//             </form>
//           )}

//           {/* Étape 2: Paiement */}
//           {currentStep === 'payment' && (
//             <div className="space-y-6">
//               {/* Récapitulatif étudiant */}
//               <div className="p-4 bg-muted/50 rounded-lg">
//                 <h3 className="font-semibold mb-2">Récapitulatif</h3>
//                 <p>{studentData.prenom} {studentData.nom}</p>
//                 <p className="text-sm text-muted-foreground">{studentData.email}</p>
//                 <p className="text-sm text-muted-foreground">📱 {studentData.numero}</p>
//               </div>

//               <div className="space-y-4">
//                 {/* Choix du mode de paiement */}
//                 <div className="space-y-3">
//                   <Label>Mode de paiement *</Label>
//                   <Tabs value={paymentData.mode_paiement} onValueChange={(value: string) => handlePaymentModeChange(value as 'mvola' | 'espece')}>
//                     <TabsList className="grid w-full grid-cols-2">
//                       <TabsTrigger value="mvola" className="flex items-center gap-2">
//                         <CreditCard className="h-4 w-4" />
//                         MVola
//                       </TabsTrigger>
//                       <TabsTrigger value="espece" className="flex items-center gap-2">
//                         <Banknote className="h-4 w-4" />
//                         Espèces
//                       </TabsTrigger>
//                     </TabsList>

//                     <TabsContent value="mvola" className="space-y-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="mvola-option">Option de paiement</Label>
//                         <Select onValueChange={handlePaymentOptionChange} defaultValue="complet">
//                           <SelectTrigger>
//                             <SelectValue placeholder="Choisir une option" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="complet">Paiement complet - 50 000 Ar</SelectItem>
//                             <SelectItem value="tranche">1ère tranche - 25 000 Ar</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
                      
//                       <div className="space-y-2">
//                         <Label htmlFor="mvola-ref">Code de référence MVola *</Label>
//                         <Input
//                           id="mvola-ref"
//                           type="text"
//                           placeholder="Ex: MV123456789"
//                           value={mvolaRef}
//                           onChange={(e) => setMvolaRef(e.target.value)}
//                           disabled={isLoading}
//                         />
//                         <p className="text-sm text-muted-foreground">
//                           Saisissez le code de référence reçu après votre transaction MVola
//                         </p>
//                       </div>
//                     </TabsContent>

//                     <TabsContent value="espece" className="space-y-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="cash-option">Option de paiement</Label>
//                         <Select onValueChange={handlePaymentOptionChange} defaultValue="complet">
//                           <SelectTrigger>
//                             <SelectValue placeholder="Choisir une option" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="complet">Paiement complet - 50 000 Ar</SelectItem>
//                             <SelectItem value="tranche">1ère tranche - 25 000 Ar</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
                      
//                       <Alert>
//                         <AlertDescription>
//                           Pour le paiement en espèces, votre inscription sera en attente de validation. 
//                           Présentez-vous au centre de formation avec le montant exact. 
//                           Votre code d'authentification sera envoyé après validation par l'administrateur.
//                         </AlertDescription>
//                       </Alert>
//                     </TabsContent>
//                   </Tabs>
//                 </div>

//                 {/* Montant à payer */}
//                 <div className="p-4 border rounded-lg">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">Montant à payer:</span>
//                     <span className="text-lg font-bold text-primary">
//                       {paymentData.montant.toLocaleString()} Ar
//                     </span>
//                   </div>
//                   {paymentData.tranche_restante > 0 && (
//                     <p className="text-sm text-muted-foreground mt-1">
//                       Montant restant: {paymentData.tranche_restante.toLocaleString()} Ar
//                     </p>
//                   )}
//                 </div>

//                 {error && (
//                   <Alert variant="destructive">
//                     <AlertDescription>{error}</AlertDescription>
//                   </Alert>
//                 )}

//                 <div className="flex space-x-4">
//                   <Button 
//                     type="button" 
//                     variant="outline" 
//                     onClick={() => setCurrentStep('info')}
//                     className="flex-1"
//                     disabled={isLoading}
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Retour
//                   </Button>
//                   <Button 
//                     type="button" 
//                     onClick={handleSubmit}
//                     className="flex-1 bg-gradient-primary"
//                     disabled={isLoading || (paymentData.mode_paiement === 'mvola' && !mvolaRef)}
//                   >
//                     {isLoading ? (
//                       <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         Traitement...
//                       </>
//                     ) : (
//                       'Finaliser l\'inscription'
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Étape 3: Confirmation */}
//           {currentStep === 'confirmation' && (
//             <div className="text-center space-y-6">
//               <div className="flex justify-center">
//                 <CheckCircle className="h-16 w-16 text-success" />
//               </div>
              
//               <div className="space-y-2">
//                 <h3 className="text-xl font-semibold text-success">Inscription réussie !</h3>
//                 <p className="text-muted-foreground">
//                   Votre inscription a été traitée avec succès.
//                 </p>
//               </div>

//               <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
//                 <h4 className="font-semibold mb-2">Votre code d'authentification:</h4>
//                 <p className="text-2xl font-mono font-bold text-success">
//                   {generatedCode}
//                 </p>
//                 <p className="text-sm text-muted-foreground mt-2">
//                   Ce code a également été envoyé à votre adresse email
//                 </p>
//               </div>

//               {paymentData.mode_paiement === 'espece' && (
//                 <Alert>
//                   <AlertDescription>
//                     Votre paiement en espèces est en attente de validation. 
//                     Présentez-vous au centre avec le montant exact pour activer votre compte.
//                   </AlertDescription>
//                 </Alert>
//               )}

//               <div className="space-y-3">
//                 <h4 className="font-semibold">Prochaines étapes:</h4>
//                 <ul className="text-sm text-muted-foreground space-y-1">
//                   <li>• Conservez précieusement votre code d'authentification</li>
//                   <li>• Connectez-vous avec votre email et ce code</li>
//                   <li>• Accédez à vos cours et documents de formation</li>
//                   {paymentData.tranche_restante > 0 && (
//                     <li>• Soldez le montant restant pour accéder à tous les contenus</li>
//                   )}
//                 </ul>
//               </div>

//               <Button 
//                 onClick={() => {
//                   onSuccess();
//                   onBackToLogin();
//                 }}
//                 className="w-full bg-gradient-primary"
//               >
//                 Se connecter maintenant
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StepIndicator } from '@/components/ui/step-indicator';
import { Loader2, GraduationCap, CreditCard, Banknote, ArrowLeft, CheckCircle, User, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface RegistrationFormProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

interface StudentData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  notes?: string;
}

interface PaymentData {
  mode_paiement: 'mvola' | 'espece';
  montant: number;
  code_ref_mvola?: string;
  statut: 'complet' | 'par_tranche';
  tranche_restante: number;
}

const API_BASE_URL = window.APP_CONFIG?.apiBaseUrl || '/api';

export function RegistrationForm({ onSuccess, onBackToLogin }: RegistrationFormProps) {
  const { toast } = useToast();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState<'info' | 'payment' | 'confirmation'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Données étudiant
  const [studentData, setStudentData] = useState<StudentData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: ''
  });

  // Données paiement
  const [paymentData, setPaymentData] = useState<PaymentData>({
    mode_paiement: 'mvola',
    montant: 50000,
    statut: 'complet',
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

  // Étape 1: Informations personnelles
  const handleStudentInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!studentData.nom || !studentData.prenom || !studentData.email || !studentData.telephone) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentData.email)) {
      setError('Veuillez saisir un email valide');
      return;
    }

    // Validation numéro (8 à 12 chiffres)
    const phoneRegex = /^\d{8,12}$/;
    const cleanPhone = studentData.telephone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setError('Veuillez saisir un numéro de téléphone valide (8-12 chiffres)');
      return;
    }

    setCurrentStep('payment');
  };

  // Étape 2: Traitement du paiement
  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Vérifier les champs obligatoires pour MVola
      if (paymentData.mode_paiement === 'mvola' && !paymentData.code_ref_mvola) {
        setError('Veuillez saisir le code de référence MVola');
        setIsLoading(false);
        return;
      }

      // Génération du code d'authentification (comme dans AddStudentForm)
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
        notes: "Inscription publique",
        code_auth: authCode,
        actif: paymentData.mode_paiement === 'mvola' // Actif immédiatement pour MVola
      };
      
      console.log('Envoi des données de l\'étudiant (public):', studentPayload);
      console.log('URL de l\'API:', `${API_BASE_URL}/students/public`);
      
      // Appel à l'API publique pour l'inscription
      const response = await fetch(`${API_BASE_URL}/students/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentPayload)
      });

      const studentResponse = await response.json();
      
      if (!response.ok) {
        const errorMessage = studentResponse.message || studentResponse.error || 'Erreur lors de l\'inscription';
        console.error('Erreur lors de l\'inscription:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('Réponse API inscription publique:', studentResponse);
      
      // Vérifier que nous avons bien les données de l'étudiant
      const createdStudent = studentResponse.data?.student || studentResponse.student;
      if (!createdStudent || !createdStudent.id) {
        console.error('Données étudiant manquantes dans la réponse:', studentResponse);
        throw new Error('Données étudiant manquantes dans la réponse du serveur');
      }
      
      console.log('Étudiant créé avec succès. ID:', createdStudent.id);
      
      // Enregistrer le paiement via API publique
      try {
        // Déterminer le statut du paiement
        let paymentStatus = 'en_attente';
        if (paymentData.mode_paiement === 'mvola') {
          paymentStatus = 'complet'; // MVola est considéré comme complet
        } else if (paymentData.statut === 'complet') {
          paymentStatus = 'en_attente'; // Espèces en attente de validation
        } else {
          paymentStatus = 'par_tranche'; // Paiement en tranches
        }
        
        // Préparer les données du paiement
        const paymentPayload = {
          mode_paiement: paymentData.mode_paiement,
          code_ref_mvola: paymentData.code_ref_mvola || '',
          montant: paymentData.montant,
          statut: paymentStatus,
          tranche_restante: paymentData.tranche_restante,
          id_etudiant: createdStudent.id,
          date_paiement: new Date().toISOString().split('T')[0]
        };
        
        console.log('Envoi des données de paiement (public):', paymentPayload);
        console.log('URL de l\'API paiement:', `${API_BASE_URL}/payments/public`);
        
        // Appeler l'API publique pour le paiement
        const paymentResponse = await fetch(`${API_BASE_URL}/payments/public`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentPayload)
        });

        const paymentResult = await paymentResponse.json();
        
        console.log('Réponse API paiement public:', paymentResult);
        
        if (!paymentResponse.ok) {
          console.warn('Avertissement: Le paiement n\'a pas pu être enregistré:', paymentResult.error);
          // Ne pas bloquer le flux pour cette erreur
        } else {
          console.log('Paiement enregistré avec succès');
        }
      } catch (paymentError) {
        console.error('Erreur lors de l\'ajout du paiement:', paymentError);
        // Ne pas bloquer le flux pour cette erreur
      }
      
      // Afficher le code d'authentification et passer à l'étape de confirmation
      setGeneratedCode(authCode);
      setCurrentStep('confirmation');
      
      toast({
        title: "Inscription réussie !",
        description: `Votre code d'authentification vous a été envoyé par email. Code: ${authCode}`
      });
      
    } catch (err: any) {
      console.error('Erreur lors de l\'inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription. Veuillez réessayer ou contacter le support.');
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-2xl shadow-hover">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Inscription à la Formation</CardTitle>
          <CardDescription>
            {currentStep === 'info' && 'Complétez vos informations personnelles'}
            {currentStep === 'payment' && 'Choisissez votre mode de paiement'}
            {currentStep === 'confirmation' && 'Inscription terminée avec succès'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Indicateur d'étapes */}
          <StepIndicator 
            steps={steps}
            currentStep={currentStep}
            completedSteps={getCompletedSteps()}
            className="mb-6"
          />

          {/* Étape 1: Informations personnelles */}
          {currentStep === 'info' && (
            <form onSubmit={handleStudentInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    type="text"
                    placeholder="Votre nom de famille"
                    value={studentData.nom}
                    onChange={(e) => setStudentData({...studentData, nom: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    type="text"
                    placeholder="Votre prénom"
                    value={studentData.prenom}
                    onChange={(e) => setStudentData({...studentData, prenom: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Adresse Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@example.com"
                  value={studentData.email}
                  onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Votre code d'authentification sera envoyé à cette adresse
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Numéro de téléphone *</Label>
                <Input
                  id="telephone"
                  type="tel"
                  placeholder="Ex: 0341234567"
                  value={studentData.telephone}
                  onChange={(e) => setStudentData({...studentData, telephone: e.target.value})}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Ce numéro sera utilisé pour les communications
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBackToLogin}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-primary"
                  disabled={isLoading}
                >
                  Continuer
                </Button>
              </div>
            </form>
          )}

          {/* Étape 2: Paiement */}
          {currentStep === 'payment' && (
            <div className="space-y-6">
              {/* Récapitulatif étudiant */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Récapitulatif</h3>
                <p>{studentData.prenom} {studentData.nom}</p>
                <p className="text-sm text-muted-foreground">{studentData.email}</p>
                <p className="text-sm text-muted-foreground">📱 {studentData.telephone}</p>
              </div>

              <div className="space-y-4">
                {/* Choix du mode de paiement */}
                <div className="space-y-3">
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
                          value={paymentData.code_ref_mvola || ''}
                          onChange={(e) => setPaymentData({
                            ...paymentData,
                            code_ref_mvola: e.target.value
                          })}
                          disabled={isLoading}
                        />
                        <p className="text-sm text-muted-foreground">
                          Saisissez le code de référence reçu après votre transaction MVola
                        </p>
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
                          Pour le paiement en espèces, votre inscription sera en attente de validation. 
                          Présentez-vous au centre de formation avec le montant exact. 
                          Votre code d'authentification sera envoyé après validation par l'administrateur.
                        </AlertDescription>
                      </Alert>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Montant à payer */}
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-semibold">Montant à payer:</span>
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

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep('info')}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-primary"
                    disabled={isLoading || (paymentData.mode_paiement === 'mvola' && !paymentData.code_ref_mvola)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      'Finaliser l\'inscription'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Confirmation */}
          {currentStep === 'confirmation' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-success" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-success">Inscription réussie !</h3>
                <p className="text-muted-foreground">
                  Votre inscription a été traitée avec succès.
                </p>
              </div>

              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <h4 className="font-semibold mb-2">Votre code d'authentification:</h4>
                <p className="text-2xl font-mono font-bold text-success">
                  {generatedCode}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ce code a également été envoyé à votre adresse email
                </p>
              </div>

              {paymentData.mode_paiement === 'espece' && (
                <Alert>
                  <AlertDescription>
                    Votre paiement en espèces est en attente de validation. 
                    Présentez-vous au centre avec le montant exact pour activer votre compte.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold">Prochaines étapes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Conservez précieusement votre code d'authentification</li>
                  <li>• Connectez-vous avec votre email et ce code</li>
                  <li>• Accédez à vos cours et documents de formation</li>
                  {paymentData.tranche_restante > 0 && (
                    <li>• Soldez le montant restant pour accéder à tous les contenus</li>
                  )}
                </ul>
              </div>

              <Button 
                onClick={() => {
                  onSuccess();
                  onBackToLogin();
                }}
                className="w-full bg-gradient-primary"
              >
                Se connecter maintenant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}