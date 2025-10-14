import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, ArrowLeft, ArrowRight, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { quizService } from '@/services/apiService';
import type { Quiz, Question } from '@/types';

interface QuizTakerProps {
  quizId: number;
  onExit: () => void;
}

export function QuizTaker({ quizId, onExit }: QuizTakerProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuizData();
  }, [quizId]);

  const loadQuizData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [quizResponse, questionsResponse] = await Promise.all([
        quizService.getQuizById(quizId),
        quizService.getQuizQuestions(quizId)
      ]);
      
      if (quizResponse.success && quizResponse.data) {
        setQuiz(quizResponse.data);
        setTimeRemaining(quizResponse.data.duree * 60);
      } else {
        throw new Error(quizResponse.error || 'Quiz non trouvé');
      }
      
      if (questionsResponse.success && questionsResponse.data) {
        setQuestions(questionsResponse.data);
      } else {
        throw new Error(questionsResponse.error || 'Questions non trouvées');
      }
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du quiz');
      toast({
        title: "Erreur",
        description: "Impossible de charger le quiz.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (quizStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            submitQuiz(true); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizStarted, timeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startQuiz = () => {
    setQuizStarted(true);
    toast({
      title: "Quiz démarré",
      description: `Vous avez ${quiz?.duree} minutes pour terminer ce quiz.`
    });
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const submitQuiz = async (autoSubmit = false) => {
    if (!session.user || !quiz) {
      console.error('Session utilisateur ou quiz non disponible');
      return;
    }
    
    // Vérifier si l'utilisateur a répondu à toutes les questions
    const unansweredQuestions = questions.filter(q => !answers.hasOwnProperty(q.id_question));
    
    if (unansweredQuestions.length > 0 && !autoSubmit) {
      const confirmSubmit = window.confirm(
        `Vous n'avez pas répondu à ${unansweredQuestions.length} question(s). Voulez-vous tout de même soumettre le quiz ?`
      );
      
      if (!confirmSubmit) {
        return; // L'utilisateur a annulé la soumission
      }
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Début de la soumission du quiz...');
      const timeSpent = quiz.duree * 60 - timeRemaining;
      console.log('Temps passé:', timeSpent, 'secondes');
      console.log('Réponses à envoyer:', answers);
      
      const response = await quizService.submitQuiz(
        quizId,
        answers,
        timeSpent
      );
      
      console.log('Réponse du serveur:', response);
      
      if (response.success) {
        const scoreText = response.data?.score !== undefined 
          ? `Votre score: ${response.data.score} / ${response.data.max_score || '?'}` 
          : 'Vos réponses ont été enregistrées avec succès.';
          
        toast({
          title: "Quiz soumis !",
          description: scoreText,
          duration: 5000,
          className: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
        });
        
        // Attendre un peu avant de quitter pour que l'utilisateur puisse voir le message
        setTimeout(() => {
          onExit();
        }, 1000);
        
      } else {
        // Si c'est une erreur de soumission précédente, on affiche un message spécifique
        if (response.error?.includes('déjà soumis')) {
          toast({
            title: "Quiz déjà soumis",
            description: response.error,
            variant: "destructive"
          });
          onExit();
        } else {
          throw new Error(response.error || 'Erreur lors de la soumission');
        }
      }
      
    } catch (error: any) {
      console.error('Erreur lors de la soumission du quiz:', error);
      
      // Si c'est une erreur de réseau, on propose de réessayer
      if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('fetch')) {
        const shouldRetry = window.confirm(
          "Erreur de connexion lors de la soumission. Voulez-vous réessayer ?"
        );
        
        if (shouldRetry) {
          await submitQuiz(autoSubmit);
          return;
        }
      }
      
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la soumission du quiz.",
        variant: "destructive",
        duration: 5000
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressPercentage = () => {
    const answeredQuestions = questions.filter(q => answers[q.id_question]).length;
    return (answeredQuestions / questions.length) * 100;
  };

  const getTimeColor = () => {
    const percentage = (timeRemaining / (quiz?.duree * 60 || 1)) * 100;
    if (percentage > 50) return 'text-success';
    if (percentage > 20) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chargement du quiz...</h2>
          <p className="text-muted-foreground">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={onExit} 
              className="w-full mt-4"
              variant="outline"
            >
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-warning" />
              <h2 className="text-xl font-semibold mb-2">Quiz non disponible</h2>
              <p className="text-muted-foreground mb-4">Ce quiz n'est pas accessible pour le moment.</p>
              <Button onClick={onExit} variant="outline">
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <Card className="shadow-card max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{quiz.titre}</CardTitle>
          <CardDescription>
            Prêt à commencer votre {quiz.type} ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold">Durée</h4>
              <p className="text-2xl font-bold text-primary">{quiz.duree} min</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold">Points Total</h4>
              <p className="text-2xl font-bold text-accent">{quiz.total_points}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold">Questions</h4>
              <p className="text-2xl font-bold text-success">{questions.length}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold">Type</h4>
              <p className="text-lg font-semibold capitalize">{quiz.type}</p>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Instructions importantes:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Le chronomètre démarrera dès que vous cliquez sur "Commencer"</li>
                  <li>Votre progression est sauvegardée automatiquement</li>
                  <li>Le quiz sera soumis automatiquement à la fin du temps imparti</li>
                  <li>Assurez-vous d'avoir une connexion internet stable</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={onExit} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={startQuiz} className="bg-gradient-primary">
              Commencer le Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header avec chrono et progression - FIXE */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm pb-4">
        <Card className="shadow-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button onClick={onExit} variant="outline" size="sm" className="text-xs">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Quitter</span>
                </Button>
                <Badge variant="outline" className="text-sm sm:text-lg px-2 py-1">
                  <span className="sm:hidden">Q{currentQuestionIndex + 1}/{questions.length}</span>
                  <span className="hidden sm:inline">Question {currentQuestionIndex + 1} / {questions.length}</span>
                </Badge>
              </div>
              
              <div className="flex items-center justify-center sm:justify-end">
                <div className={`flex items-center gap-2 ${getTimeColor()}`}>
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-lg sm:text-xl font-mono font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 sm:mt-4">
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-2">
                <span>Progression</span>
                <span>{Math.round(getProgressPercentage())}% complété</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question actuelle */}
      {currentQuestion && (
        <Card className="shadow-card">
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <CardTitle className="text-lg sm:text-xl leading-tight">
                {currentQuestion.question}
              </CardTitle>
              <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                {currentQuestion.points} points
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {currentQuestion.type_question === 'choix_multiple' && (
              <RadioGroup
                value={answers[currentQuestion.id_question] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id_question, value)}
                className="space-y-3"
              >
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type_question === 'vrai_faux' && (
              <RadioGroup
                value={answers[currentQuestion.id_question] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id_question, value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="cursor-pointer text-base font-medium">Vrai</Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="cursor-pointer text-base font-medium">Faux</Label>
                </div>
              </RadioGroup>
            )}

            {currentQuestion.type_question === 'reponse_courte' && (
              <Textarea
                value={answers[currentQuestion.id_question] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id_question, e.target.value)}
                placeholder="Tapez votre réponse ici..."
                className="min-h-[120px] sm:min-h-[100px] text-sm sm:text-base"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation - FIXE EN BAS */}
      <div className="sticky bottom-0 z-40 bg-background/95 backdrop-blur-sm pt-4">
        <Card className="shadow-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-4">
              {/* Navigation entre questions sur mobile */}
              <div className="flex justify-center">
                <div className="flex gap-1 sm:gap-2 flex-wrap justify-center max-w-full overflow-x-auto pb-2">
                  {questions.map((_, index) => (
                    <Button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      variant={index === currentQuestionIndex ? "default" : "outline"}
                      size="sm"
                      className={`min-w-[32px] h-8 sm:w-10 sm:h-10 text-xs sm:text-sm flex-shrink-0 ${
                        answers[questions[index].id_question] ? 'bg-success hover:bg-success/90 text-white border-success' : ''
                      }`}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Boutons de navigation */}
              <div className="flex justify-between items-center">
                <Button
                  onClick={() => goToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Précédent</span>
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={() => submitQuiz()}
                    disabled={isSubmitting}
                    className="bg-gradient-primary text-xs sm:text-sm px-4 sm:px-6"
                    size="sm"
                  >
                    <Send className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{isSubmitting ? 'Soumission...' : 'Soumettre'}</span>
                    <span className="sm:hidden">✓</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex === questions.length - 1}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Suivant</span>
                    <ArrowRight className="h-4 w-4 sm:ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}