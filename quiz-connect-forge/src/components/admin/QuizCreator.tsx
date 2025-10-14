import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { quizService } from '@/services/apiService';
import type { Quiz, Question } from '@/types';

interface QuizCreatorProps {
  onCancel: () => void;
  onSuccess?: () => void;
  quiz?: Quiz;
  isEditing?: boolean;
}

export function QuizCreator({ onCancel, onSuccess, quiz, isEditing = false }: QuizCreatorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [quizData, setQuizData] = useState({
    titre: quiz?.titre || '',
    type: quiz?.type || 'quiz' as 'quiz' | 'examen' | 'test' | 'exercice',
    total_points: quiz?.total_points || 100,
    date_debut: quiz?.date_debut ? new Date(quiz.date_debut).toISOString().slice(0, 16) : '',
    date_fin: quiz?.date_fin ? new Date(quiz.date_fin).toISOString().slice(0, 16) : '',
    duree: quiz?.duree || 60,
    modifiable: quiz?.modifiable ?? true
  });

  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Partial<Question>[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  // Charger les questions existantes lors de la modification d'un quiz
  useEffect(() => {
    const loadQuizQuestions = async () => {
      if (!isEditing || !quiz?.id_quiz) {
        // Pour un nouveau quiz, initialiser avec une question vide
        setQuestions([createEmptyQuestion()]);
        setQuizData({
          titre: '',
          type: 'quiz',
          total_points: 100,
          date_debut: '',
          date_fin: '',
          duree: 60,
          modifiable: true
        });
        return;
      }

      console.log(`Chargement du quiz ${quiz.id_quiz}...`);
      setIsLoadingQuestions(true);

      try {
        const response = await quizService.getQuizById(quiz.id_quiz);
        console.log('Réponse de getQuizById:', response);

        if (response.success && response.data) {
          const quizDataFromServer = response.data;

          // Mettre à jour les données du quiz
          setQuizData({
            titre: quizDataFromServer.titre || '',
            type: quizDataFromServer.type || 'quiz',
            total_points: quizDataFromServer.total_points || 100,
            date_debut: quizDataFromServer.date_debut ? new Date(quizDataFromServer.date_debut).toISOString().slice(0, 16) : '',
            date_fin: quizDataFromServer.date_fin ? new Date(quizDataFromServer.date_fin).toISOString().slice(0, 16) : '',
            duree: quizDataFromServer.duree || 60,
            modifiable: quizDataFromServer.modifiable ?? true
          });

          // Traiter les questions
          if (quizDataFromServer.questions && quizDataFromServer.questions.length > 0) {
            console.log(`Questions reçues (${quizDataFromServer.questions.length}):`, quizDataFromServer.questions);
            setQuestions(quizDataFromServer.questions);
          } else {
            console.warn('Aucune question trouvée, utilisation de la question par défaut');
            setQuestions([createEmptyQuestion()]);
          }
        } else {
          console.warn('Aucune donnée de quiz trouvée');
          setQuestions([createEmptyQuestion()]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du quiz:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors du chargement';
        setLoadingError(errorMessage);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données du quiz',
          variant: 'destructive'
        });
        setQuestions([createEmptyQuestion()]);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    loadQuizQuestions();
  }, [isEditing, quiz?.id_quiz]);
  
  // Fonction utilitaire pour créer une question vide
  const createEmptyQuestion = (): Partial<Question> => {
    const emptyQuestion: Partial<Question> = {
      question: '',
      type_question: 'choix_multiple' as const, // Utilisation de 'as const' pour le type littéral
      reponse_correcte: '',
      options: ['', '', '', ''],
      points: 1
    };
    console.log('Création d\'une question vide:', emptyQuestion);
    return emptyQuestion;
  };

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options[optionIndex] = value;
    updated[questionIndex] = { ...updated[questionIndex], options };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const calculateTotalPoints = () => {
    return questions.reduce((sum, q) => sum + (q.points || 0), 0);
  };

  const handleSave = async () => {
    // Validation des données de base
    if (!quizData.titre || questions.some(q => !q.question || !q.reponse_correcte)) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Validation des dates
    if (!quizData.date_debut || !quizData.date_fin) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner les dates de début et de fin",
        variant: "destructive"
      });
      return;
    }

    // Validation que la date de fin est après la date de début
    const startDate = new Date(quizData.date_debut);
    const endDate = new Date(quizData.date_fin);

    if (startDate >= endDate) {
      toast({
        title: "Erreur de validation",
        description: "La date de fin doit être postérieure à la date de début",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Préparer les données du quiz pour l'envoi
      const quizToSave = {
        ...quizData,
        // Convertir les dates au format ISO pour l'API - format spécifique attendu par le backend
        date_debut: startDate.toISOString().replace('.000Z', '+00:00'),
        date_fin: endDate.toISOString().replace('.000Z', '+00:00'),
        // Calculer le total des points si non défini
        total_points: quizData.total_points || calculateTotalPoints(),
        // Ajouter le statut par défaut pour les nouveaux quiz
        statut: quiz?.statut || 'brouillon',
        // Préparer les questions avec les options
        questions: questions.map((q, index) => ({
          ...q,
          ordre: index + 1,
          // Gérer les options selon le type de question
          options: q.type_question === 'choix_multiple'
            ? (q.options || []).filter(opt => opt.trim() !== '')
            : [] // Pas d'options pour vrai/faux et texte_libre
        })).filter(q => q.question.trim() !== '') // Filtrer les questions vides
      };

      console.log('Données envoyées au serveur:', quizToSave);

      let response;
      if (isEditing && quiz?.id_quiz) {
        // Mise à jour d'un quiz existant
        response = await quizService.updateQuiz(quiz.id_quiz, quizToSave);
      } else {
        // Création d'un nouveau quiz
        response = await quizService.createQuiz(quizToSave);
      }

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la sauvegarde');
      }

      toast({
        title: isEditing ? "Quiz modifié" : "Quiz créé",
        description: `${quizData.titre} a été ${isEditing ? 'modifié' : 'créé'} avec succès`
      });

      // Appeler le callback de succès si fourni
      if (onSuccess) onSuccess();

      // Fermer le formulaire
      onCancel();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du quiz:', error);

      // Gestion spécifique des erreurs de format de date
      if (error.message && error.message.includes('Format de date invalide')) {
        toast({
          title: "Erreur de format de date",
          description: "Veuillez vérifier que les dates sont correctement sélectionnées",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erreur",
          description: error.message || "Une erreur est survenue lors de la sauvegarde du quiz",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un indicateur de chargement ou d'erreur pendant le chargement des questions
  if (isLoadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Chargement des données du quiz...</p>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">{loadingError}</p>
          <Button
            onClick={() => {
              setLoadingError(null);
              window.location.reload(); // Recharger la page pour réessayer
            }}
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={onCancel} variant="outline" disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h2 className="text-2xl font-bold">
          {isEditing ? 'Modifier' : 'Créer'} un Quiz
        </h2>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
          <CardDescription>
            Configuration du quiz ou examen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titre">Titre du Quiz *</Label>
              <Input
                id="titre"
                value={quizData.titre}
                onChange={(e) => setQuizData({...quizData, titre: e.target.value})}
                placeholder="Ex: Quiz HTML/CSS"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Type d'évaluation</Label>
              <Select value={quizData.type} onValueChange={(value: any) => setQuizData({...quizData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="examen">Examen</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="exercice">Exercice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date_debut">Date de début *</Label>
              <Input
                id="date_debut"
                type="datetime-local"
                value={quizData.date_debut}
                onChange={(e) => setQuizData({...quizData, date_debut: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="date_fin">Date de fin *</Label>
              <Input
                id="date_fin"
                type="datetime-local"
                value={quizData.date_fin}
                onChange={(e) => setQuizData({...quizData, date_fin: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="duree">Durée (minutes)</Label>
              <Input
                id="duree"
                type="number"
                min="1"
                value={quizData.duree}
                onChange={(e) => setQuizData({...quizData, duree: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="modifiable"
              checked={quizData.modifiable}
              onCheckedChange={(checked) => setQuizData({...quizData, modifiable: checked})}
            />
            <Label htmlFor="modifiable">Quiz modifiable après création</Label>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Points totaux calculés:</span>
              <Badge variant="outline" className="text-lg">
                {calculateTotalPoints()} points
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Questions du Quiz</CardTitle>
          <CardDescription>
            Ajoutez et gérez les questions de votre quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune question. Ajoutez votre première question ci-dessous.
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Question {qIndex + 1}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{question.points} pts</Badge>
                      {questions.length > 1 && (
                        <Button 
                          onClick={() => removeQuestion(qIndex)} 
                          size="sm" 
                          variant="outline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Texte de la question *</Label>
                    <Textarea
                      value={question.question || ''}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      placeholder="Entrez votre question ici..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type de question</Label>
                      <Select 
                        value={question.type_question} 
                        onValueChange={(value: any) => updateQuestion(qIndex, 'type_question', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="choix_multiple">Choix multiple</SelectItem>
                          <SelectItem value="vrai_faux">Vrai/Faux</SelectItem>
                          <SelectItem value="texte_libre">Réponse courte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Points</Label>
                      <Input
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {question.type_question === 'choix_multiple' && (
                    <div className="space-y-2">
                      <Label>Options (cochez la bonne réponse)</Label>
                      {question.options?.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={question.reponse_correcte === option}
                            onChange={() => updateQuestion(qIndex, 'reponse_correcte', option)}
                            className="h-4 w-4"
                          />
                          <Input
                            value={option}
                            onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type_question === 'vrai_faux' && (
                    <div className="space-y-4">
                      <Label>Réponse correcte</Label>
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`vraifaux-${qIndex}`}
                            checked={question.reponse_correcte === 'Vrai'}
                            onChange={() => updateQuestion(qIndex, 'reponse_correcte', 'Vrai')}
                            className="h-4 w-4"
                          />
                          <span>Vrai</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`vraifaux-${qIndex}`}
                            checked={question.reponse_correcte === 'Faux'}
                            onChange={() => updateQuestion(qIndex, 'reponse_correcte', 'Faux')}
                            className="h-4 w-4"
                          />
                          <span>Faux</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {question.type_question === 'texte_libre' && (
                    <div>
                      <Label>Réponse attendue</Label>
                      <Input
                        value={question.reponse_correcte || ''}
                        onChange={(e) => updateQuestion(qIndex, 'reponse_correcte', e.target.value)}
                        placeholder="Entrez la réponse attendue..."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between p-6 pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une question
            </Button>
            <div className="space-x-2">
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isLoading || questions.length === 0}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Enregistrement...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="h-4 w-4 mr-2" />
                    <span>{isEditing ? 'Mettre à jour' : 'Créer'} le quiz</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}