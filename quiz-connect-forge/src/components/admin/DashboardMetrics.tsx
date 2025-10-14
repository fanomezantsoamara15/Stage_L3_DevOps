import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  BookOpen, 
  Award,
  Clock,
  Target,
  Loader2
} from 'lucide-react';
import { studentService, paymentService, quizService } from '@/services/apiService';

export function DashboardMetrics() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    loadMetricsData();
  }, []);

  const loadMetricsData = async () => {
    try {
      setLoading(true);
      const [studentsResponse, paymentsResponse, quizzesResponse] = await Promise.all([
        studentService.getAllStudents(),
        paymentService.getAllPayments(),
        quizService.getAllQuiz()
      ]);

      if (studentsResponse.success && studentsResponse.data) {
        setStudents(studentsResponse.data);
      }
      if (paymentsResponse.success && paymentsResponse.data) {
        setPayments(paymentsResponse.data);
      }
      if (quizzesResponse.success && quizzesResponse.data) {
        setQuizzes(quizzesResponse.data);
      }
      // TODO: Ajouter service pour les résultats quand disponible
      setResults([]);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculs des métriques avancées
  const totalStudents = students.length;
  const activeStudents = students.filter(e => e.actif).length;
  const suspendedStudents = totalStudents - activeStudents;
  
  const totalRevenue = payments.reduce((sum, p) => sum + p.montant, 0);
  const completedPayments = payments.filter(p => p.statut === 'complet').length;
  const pendingPayments = payments.filter(p => p.statut === 'en_attente').length;
  const partialPayments = payments.filter(p => p.statut === 'par_tranche').length;
  
  const totalQuizzes = quizzes.length;
  const activeQuizzes = quizzes.filter(q => q.statut === 'actif').length;
  const completedQuizzes = quizzes.filter(q => q.statut === 'clos').length;
  
  const totalResults = results.length;
  const averageScore = totalResults > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalResults)
    : 0;
  
  const passRate = totalResults > 0
    ? Math.round((results.filter(r => {
        const quiz = quizzes.find(q => q.id_quiz === r.id_quiz);
        return quiz ? (r.score / quiz.total_points) >= 0.7 : false;
      }).length / totalResults) * 100)
    : 0;

  const studentEngagement = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;
  const paymentCompletionRate = payments.length > 0 
    ? Math.round((completedPayments / payments.length) * 100)
    : 0;

  const metrics = [
    {
      title: "Étudiants Totaux",
      value: totalStudents,
      icon: Users,
      trend: activeStudents > suspendedStudents ? "up" : "down",
      trendValue: `${activeStudents} actifs`,
      color: "text-primary"
    },
    {
      title: "Revenus Totaux",
      value: `${totalRevenue.toLocaleString()} Ar`,
      icon: CreditCard,
      trend: "up",
      trendValue: `${completedPayments}/${payments.length} complets`,
      color: "text-success"
    },
    {
      title: "Quiz Actifs",
      value: activeQuizzes,
      icon: BookOpen,
      trend: activeQuizzes > 0 ? "up" : "neutral",
      trendValue: `${totalQuizzes} total`,
      color: "text-accent"
    },
    {
      title: "Score Moyen",
      value: `${averageScore}%`,
      icon: Award,
      trend: averageScore >= 70 ? "up" : "down",
      trendValue: `${passRate}% réussite`,
      color: "text-warning"
    }
  ];

  const progressMetrics = [
    {
      title: "Engagement Étudiants",
      value: studentEngagement,
      description: `${activeStudents} étudiants actifs sur ${totalStudents}`
    },
    {
      title: "Taux de Paiement",
      value: paymentCompletionRate,
      description: `${completedPayments} paiements complets`
    },
    {
      title: "Taux de Réussite",
      value: passRate,
      description: `${results.filter(r => {
        const quiz = quizzes.find(q => q.id_quiz === r.id_quiz);
        return quiz ? (r.score / quiz.total_points) >= 0.7 : false;
      }).length} étudiants ont réussi`
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <Loader2 className="h-4 w-4 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <div className="flex items-center gap-1">
                    {metric.trend === "up" && (
                      <TrendingUp className="h-3 w-3 text-success" />
                    )}
                    {metric.trend === "down" && (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {metric.trendValue}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-muted/50 ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métriques de progression */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {progressMetrics.map((metric, index) => (
          <Card key={index} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{metric.value}%</span>
                <Badge variant={metric.value >= 70 ? "default" : "secondary"}>
                  {metric.value >= 70 ? "Bon" : "À améliorer"}
                </Badge>
              </div>
              <Progress value={metric.value} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aperçu des paiements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              État des Paiements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { status: 'complet', count: completedPayments, color: 'text-success', label: 'Complets' },
              { status: 'par_tranche', count: partialPayments, color: 'text-warning', label: 'Par tranches' },
              { status: 'en_attente', count: pendingPayments, color: 'text-destructive', label: 'En attente' }
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-current ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.count}</span>
                  <Badge variant="outline">
                    {payments.length > 0 ? Math.round((item.count / payments.length) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Quiz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { status: 'actif', count: activeQuizzes, color: 'text-success', label: 'Actifs' },
              { status: 'planifie', count: quizzes.filter(q => q.statut === 'planifie').length, color: 'text-warning', label: 'Planifiés' },
              { status: 'clos', count: completedQuizzes, color: 'text-muted-foreground', label: 'Terminés' }
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-current ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.count}</span>
                  <Badge variant="outline">
                    {totalQuizzes > 0 ? Math.round((item.count / totalQuizzes) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Résumé des résultats */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activité Récente
          </CardTitle>
          <CardDescription>
            Aperçu des dernières activités de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <p className="text-2xl font-bold">{results.length}</p>
              <p className="text-sm text-muted-foreground">Quiz passés</p>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{averageScore}%</p>
              <p className="text-sm text-muted-foreground">Score moyen</p>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold">
                {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.temps_utilise, 0) / results.length) : 0} min
              </p>
              <p className="text-sm text-muted-foreground">Temps moyen</p>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{passRate}%</p>
              <p className="text-sm text-muted-foreground">Taux de réussite</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}