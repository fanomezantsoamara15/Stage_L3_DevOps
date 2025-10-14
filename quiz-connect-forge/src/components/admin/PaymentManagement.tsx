import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Loader2
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Document as DocxDocument, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, AlignmentType, PageOrientation } from 'docx';
import { useToast } from '@/hooks/use-toast';
import { paymentService, studentService } from '@/services/apiService';

type PaymentStatusFilter = 'all' | 'complet' | 'par_tranche' | 'en_attente';
type PaymentModeFilter = 'all' | 'mvola' | 'espece';

export function PaymentManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all');
  const [modeFilter, setModeFilter] = useState<PaymentModeFilter>('all');
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [paymentsResponse, studentsResponse] = await Promise.all([
        paymentService.getAllPayments(),
        studentService.getAllStudents()
      ]);
      
      if (paymentsResponse.success && paymentsResponse.data) {
        setPayments(paymentsResponse.data);
      } else {
        throw new Error(paymentsResponse.error || 'Erreur lors du chargement des paiements');
      }
      
      if (studentsResponse.success && studentsResponse.data) {
        setStudents(studentsResponse.data);
      } else {
        console.warn('Erreur lors du chargement des étudiants:', studentsResponse.error);
        setStudents([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les données. Vérifiez votre connexion.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des paiements avec plus de robustesse
  const filteredPayments = payments.filter(payment => {
    if (!payment) return false;
    
    const student = students.find(s => s.id_etudiant === payment.id_etudiant);
    if (!student) {
      console.warn(`Aucun étudiant trouvé pour le paiement ID: ${payment.id_paiement}`);
      return false;
    }

    const matchesSearch = 
      student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.code_ref_mvola && payment.code_ref_mvola.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || payment.statut === statusFilter;
    const matchesMode = modeFilter === 'all' || payment.mode_paiement === modeFilter;
    
    return matchesSearch && matchesStatus && matchesMode;
  });

  // Statistiques
  const stats = {
    total: payments.reduce((sum, p) => sum + p.montant, 0),
    pending: payments.filter(p => p.statut === 'en_attente').length,
    complete: payments.filter(p => p.statut === 'complet').length,
    partial: payments.filter(p => p.statut === 'par_tranche').length
  };

  // Actions admin
  const handleValidatePayment = async (paymentId: number) => {
    try {
      const payment = payments.find(p => p.id_paiement === paymentId);
      if (!payment) {
        throw new Error('Paiement non trouvé');
      }

      const student = students.find(s => s.id_etudiant === payment.id_etudiant);
      if (!student) {
        throw new Error('Étudiant non trouvé pour ce paiement');
      }

      const response = await paymentService.validatePayment(paymentId);
      
      if (response.success) {
        // Mettre à jour le paiement comme complet
        setPayments(prev => prev.map(p => 
          p.id_paiement === paymentId 
            ? { 
                ...p, 
                statut: 'complet', 
                tranche_restante: 0,
                montant: response.data?.montant || p.montant
              }
            : p
        ));
        
        // Mettre à jour l'étudiant comme actif
        setStudents(prev => prev.map(s => 
          s.id_etudiant === student.id_etudiant
            ? { 
                ...s, 
                actif: true, 
                code_auth: response.data?.code_auth || s.code_auth 
              }
            : s
        ));
        
        toast({
          title: "Paiement validé avec succès",
          description: `Le paiement de ${student.prenom} ${student.nom} a été validé.` +
                      (response.data?.code_auth ? ` Un code d'authentification a été envoyé.` : '')
        });
        
        // Recharger les données pour s'assurer de la cohérence
        loadData();
      } else {
        throw new Error(response.error || 'Erreur lors de la validation du paiement');
      }
    } catch (error) {
      console.error('Erreur lors de la validation du paiement:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors de la validation du paiement',
        variant: "destructive"
      });
    }
  };

  const handleRejectPayment = async (paymentId: number) => {
    try {
      const payment = payments.find(p => p.id_paiement === paymentId);
      if (!payment) {
        throw new Error('Paiement non trouvé');
      }

      const student = students.find(s => s.id_etudiant === payment.id_etudiant);
      if (!student) {
        throw new Error('Étudiant non trouvé pour ce paiement');
      }
      
      const response = await paymentService.rejectPayment(paymentId);
      
      if (response.success) {
        // Supprimer le paiement rejeté
        setPayments(prev => prev.filter(p => p.id_paiement !== paymentId));
        
        // Si c'était le seul paiement de l'étudiant, le désactiver
        const hasOtherPayments = payments.some(p => 
          p.id_etudiant === student.id_etudiant && 
          p.id_paiement !== paymentId &&
          p.statut !== 'rejeté'
        );
        
        if (!hasOtherPayments) {
          setStudents(prev => prev.map(s => 
            s.id_etudiant === student.id_etudiant
              ? { ...s, actif: false }
              : s
          ));
        }
        
        toast({
          title: "Paiement rejeté",
          description: `Le paiement de ${student.prenom} ${student.nom} a été rejeté.`,
          variant: "destructive"
        });
        
        // Recharger les données pour s'assurer de la cohérence
        loadData();
      } else {
        throw new Error(response.error || 'Erreur lors du rejet du paiement');
      }
    } catch (error) {
      console.error('Erreur lors du rejet du paiement:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors du rejet du paiement',
        variant: "destructive"
      });
    }
  };

  const handleMarkPartialPayment = async (paymentId: number) => {
    try {
      const payment = payments.find(p => p.id_paiement === paymentId);
      if (!payment) {
        throw new Error('Paiement non trouvé');
      }

      const student = students.find(s => s.id_etudiant === payment.id_etudiant);
      if (!student) {
        throw new Error('Étudiant non trouvé pour ce paiement');
      }

      const response = await paymentService.markPartialPayment(paymentId);
      
      if (response.success) {
        // Mettre à jour le paiement avec le statut partiel
        setPayments(prev => prev.map(p => 
          p.id_paiement === paymentId 
            ? { 
                ...p, 
                statut: 'par_tranche', 
                tranche_restante: response.data?.tranche_restante || 25000,
                montant: response.data?.montant || p.montant
              }
            : p
        ));
        
        // Mettre à jour l'étudiant comme actif avec accès partiel
        setStudents(prev => prev.map(s => 
          s.id_etudiant === student.id_etudiant
            ? { 
                ...s, 
                actif: true, 
                code_auth: response.data?.code_auth || s.code_auth 
              }
            : s
        ));
        
        toast({
          title: "Paiement partiel validé",
          description: `L'étudiant ${student.prenom} ${student.nom} a maintenant un accès partiel.` +
                      (response.data?.code_auth ? ` Code d'authentification envoyé.` : '')
        });
        
        // Recharger les données pour s'assurer de la cohérence
        loadData();
      } else {
        throw new Error(response.error || 'Erreur lors de la validation du paiement partiel');
      }
    } catch (error) {
      console.error('Erreur lors de la validation partielle:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Une erreur inattendue est survenue',
        variant: "destructive"
      });
      toast({
        title: "Erreur",
        description: "Impossible de modifier le paiement",
        variant: "destructive"
      });
    }
  };

  const handleExportPayments = async () => {
    try {
      const headerRow = new DocxTableRow({
        children: [
          'ID Paiement', 'ID Étudiant', 'Nom', 'Prénom', 'Email', 'Mode', 'Montant', 'Statut', 'Restant', 'Référence', 'Date'
        ].map(text => new DocxTableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'ffffff' })] })],
          shading: { fill: '1f2937' },
          width: { size: 9.09, type: WidthType.PERCENTAGE }
        }))
      });

      const dataRows = filteredPayments.map((p, idx) => {
        const s = students.find(st => st.id_etudiant === p.id_etudiant);
        const values = [
          String(p.id_paiement || p.id),
          String(p.id_etudiant),
          s?.nom || '',
          s?.prenom || '',
          s?.email || '',
          p.mode_paiement || '',
          String(p.montant ?? ''),
          p.statut || '',
          String(p.tranche_restante ?? ''),
          p.code_ref_mvola || '',
          p.date_paiement ? new Date(p.date_paiement).toLocaleDateString() : ''
        ];
        return new DocxTableRow({
          children: values.map(text => new DocxTableCell({
            children: [new Paragraph(String(text))],
            width: { size: 9.09, type: WidthType.PERCENTAGE },
            shading: idx % 2 === 0 ? { fill: 'f8fafc' } : undefined
          }))
        });
      });

      const table = new DocxTable({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
      const doc = new DocxDocument({
        creator: 'Quiz Connect Admin',
        title: 'Liste des Paiements',
        description: 'Export des paiements',
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
              size: { orientation: PageOrientation.LANDSCAPE }
            }
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Quiz Connect', bold: true, size: 32, color: '2563eb' })],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({
              children: [new TextRun({ text: 'Liste des Paiements', bold: true, size: 28 })],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: `Date: ${new Date().toLocaleString()}` }),
            new Paragraph(''),
            table
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `paiements_${new Date().toISOString().slice(0,10)}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Export DOCX terminé', description: 'Le document Word des paiements a été téléchargé.' });
    } catch (e) {
      toast({ title: 'Erreur', description: "Échec de l'export DOCX des paiements", variant: 'destructive' });
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'complet':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'par_tranche':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'en_attente':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques des paiements */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-6 w-6 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Revenus Total</p>
                <p className="text-xl font-bold">{stats.total.toLocaleString()} Ar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Complets</p>
                <p className="text-xl font-bold">{stats.complete}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Partiels</p>
                <p className="text-xl font-bold">{stats.partial}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">En Attente</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={(value: PaymentStatusFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="complet">Complets</SelectItem>
                  <SelectItem value="par_tranche">Partiels</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={modeFilter} onValueChange={(value: PaymentModeFilter) => setModeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modes</SelectItem>
                  <SelectItem value="mvola">MVola</SelectItem>
                  <SelectItem value="espece">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleExportPayments}>
              <Download className="h-4 w-4 mr-2" />
              Exporter DOCX
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des paiements */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gestion des Paiements
            <Badge variant="secondary" className="ml-2">
              {filteredPayments.length} paiement{filteredPayments.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription>
            Validez les paiements MVola et espèces des étudiants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des paiements...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadData}
                  className="ml-2"
                >
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          ) : filteredPayments.length === 0 ? (
            <Alert>
              <AlertDescription>
                Aucun paiement ne correspond aux critères de recherche.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Restant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((paiement) => {
                    const etudiant = students.find(e => e.id_etudiant === paiement.id_etudiant);
                    if (!etudiant) return null;
                    
                    return (
                      <TableRow key={paiement.id_paiement}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{etudiant.prenom} {etudiant.nom}</p>
                            <p className="text-sm text-muted-foreground">{etudiant.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <CreditCard className="h-3 w-3" />
                            {paiement.mode_paiement === 'mvola' ? 'MVola' : 'Espèces'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {paiement.montant.toLocaleString()} Ar
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {paiement.code_ref_mvola || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentStatusIcon(paiement.statut)}
                            <Badge variant={
                              paiement.statut === 'complet' ? 'default' :
                              paiement.statut === 'par_tranche' ? 'secondary' : 'destructive'
                            }>
                              {paiement.statut === 'complet' ? 'Complet' :
                               paiement.statut === 'par_tranche' ? 'Partiel' : 'En attente'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {paiement.tranche_restante > 0 ? (
                            <span className="text-warning font-medium">
                              {paiement.tranche_restante.toLocaleString()} Ar
                            </span>
                          ) : (
                            <span className="text-success">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(paiement.date_paiement).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {paiement.statut === 'en_attente' && (
                              <>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" className="bg-success hover:bg-success/90 text-xs px-2">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      <span className="hidden sm:inline">Valider</span>
                                      <span className="sm:hidden">✓</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Valider le paiement ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Cette action activera le compte de l'étudiant et marquera le paiement comme complet.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleValidatePayment(paiement.id_paiement)}>Confirmer</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-xs px-2">
                                      <Clock className="h-3 w-3 mr-1" />
                                      <span className="hidden sm:inline">Partiel</span>
                                      <span className="sm:hidden">½</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Valider en tant que paiement partiel ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        L'étudiant aura un accès limité jusqu'à ce que le solde soit réglé. Un code d'authentification sera envoyé.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleMarkPartialPayment(paiement.id_paiement)}>Confirmer le paiement partiel</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive" className="text-xs px-2">
                                      <AlertCircle className="h-3 w-3" />
                                      <span className="hidden sm:inline ml-1">Annuler</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Annuler ce paiement ?</AlertDialogTitle>
                                      <AlertDialogDescription>Le paiement sera supprimé et ne sera pas pris en compte.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Retour</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleRejectPayment(paiement.id_paiement)}>Confirmer</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            {paiement.statut === 'par_tranche' && (
                              <>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" className="bg-success hover:bg-success/90 text-xs px-2">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      <span className="hidden sm:inline">Solder</span>
                                      <span className="sm:hidden">✓</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Valider le solde du paiement ?</AlertDialogTitle>
                                      <AlertDialogDescription>Cette action marquera le paiement comme entièrement soldé et activera l'accès complet de l'étudiant.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleValidatePayment(paiement.id_paiement)}>Confirmer le solde</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive" className="text-xs px-2">
                                      <AlertCircle className="h-3 w-3" />
                                      <span className="hidden sm:inline ml-1">Annuler</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Annuler ce paiement ?</AlertDialogTitle>
                                      <AlertDialogDescription>Le paiement sera supprimé et ne sera pas pris en compte.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Retour</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleRejectPayment(paiement.id_paiement)}>Confirmer</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            {paiement.statut === 'complet' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="text-xs px-2">
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="hidden sm:inline ml-1">Annuler</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Annuler ce paiement ?</AlertDialogTitle>
                                    <AlertDialogDescription>Le paiement sera supprimé et ne sera pas pris en compte.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Retour</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRejectPayment(paiement.id_paiement)}>Confirmer</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}