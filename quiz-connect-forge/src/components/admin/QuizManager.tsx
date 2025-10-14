import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  FileX,
  Calendar,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { quizService } from '@/services/apiService';

interface QuizManagerProps {
  onCreateQuiz?: () => void;
  onEditQuiz?: (quiz: any) => void;
  onDataChange?: () => void; // Callback pour recharger les données parent
}

export function QuizManager({ onCreateQuiz, onEditQuiz, onDataChange }: QuizManagerProps) {
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les quiz
  useEffect(() => {
    loadQuizData();
  }, []);

  const loadQuizData = async () => {
    try {
      setLoading(true);
      const response = await quizService.getAllQuiz();
      if (response.success && response.data) {
        setQuiz(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des quiz:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les quiz",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Modifier un quiz
  const handleEditQuiz = async (quizId: number) => {
    try {
      const quizData = await quizService.getQuizById(quizId);
      if (quizData.success && quizData.data) {
        onEditQuiz?.(quizData.data);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du quiz",
        variant: "destructive"
      });
    }
  };

  // Supprimer un quiz
  const handleDeleteQuiz = async (quizId: number, titre: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le quiz "${titre}" ?`)) {
      return;
    }

    try {
      const response = await quizService.deleteQuiz(quizId);
      if (response.success) {
        toast({
          title: "Quiz supprimé",
          description: "Le quiz a été supprimé avec succès"
        });
        loadQuizData(); // Recharger la liste
        onDataChange?.(); // Notifier le parent
      } else {
        throw new Error(response.error || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le quiz",
        variant: "destructive"
      });
    }
  };

  // Changer le statut d'un quiz
  const handleStatusChange = async (quizId: number, newStatus: string) => {
    try {
      const response = await quizService.updateQuizStatus(quizId, newStatus);
      if (response.success) {
        toast({
          title: "Statut modifié",
          description: `Le statut du quiz a été changé en ${newStatus}`
        });
        loadQuizData(); // Recharger la liste
        onDataChange?.(); // Notifier le parent
      } else {
        throw new Error(response.error || 'Erreur lors du changement de statut');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le statut",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge className="bg-success">Actif</Badge>;
      case 'inactif':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'planifie':
        return <Badge variant="outline">Planifié</Badge>;
      case 'clos':
        return <Badge variant="destructive">Clos</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const types = {
      'quiz': 'Quiz',
      'examen': 'Examen',
      'test': 'Test',
      'exercice': 'Exercice'
    };
    return <Badge variant="outline">{types[type as keyof typeof types] || type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des Quiz et Examens</CardTitle>
              <CardDescription>
                Créez, modifiez et gérez vos quiz et examens
              </CardDescription>
            </div>
            <Button onClick={onCreateQuiz} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Quiz
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : quiz.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun quiz trouvé. Créez votre premier quiz !
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quiz.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.titre}</TableCell>
                    <TableCell>{getTypeBadge(q.type)}</TableCell>
                    <TableCell>{getStatusBadge(q.statut)}</TableCell>
                    <TableCell>{q.total_points || 0}</TableCell>
                    <TableCell>
                      {q.date_debut ? new Date(q.date_debut).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {q.date_fin ? new Date(q.date_fin).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditQuiz(q.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Select
                          value={q.statut}
                          onValueChange={(value) => handleStatusChange(q.id, value)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="actif">
                              <div className="flex items-center gap-2">
                                <Play className="h-4 w-4 text-success" />
                                Actif
                              </div>
                            </SelectItem>
                            <SelectItem value="inactif">
                              <div className="flex items-center gap-2">
                                <Pause className="h-4 w-4 text-muted" />
                                Inactif
                              </div>
                            </SelectItem>
                            <SelectItem value="planifie">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-warning" />
                                Planifié
                              </div>
                            </SelectItem>
                            <SelectItem value="clos">
                              <div className="flex items-center gap-2">
                                <FileX className="h-4 w-4 text-destructive" />
                                Clos
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteQuiz(q.id, q.titre)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
