import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Document as DocxDocument, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, AlignmentType, PageOrientation } from 'docx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  UserCheck, 
  UserX, 
  Edit, 
  Search,
  Mail,
  Download,
  Trash2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { studentService, paymentService } from '@/services/apiService';
import { AddStudentForm } from './AddStudentForm';

export function StudentManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
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
      
      const [studentsResponse, paymentsResponse] = await Promise.all([
        studentService.getAllStudents(),
        paymentService.getAllPayments()
      ]);
      
      if (studentsResponse.success && studentsResponse.data) {
        setStudents(studentsResponse.data);
      } else {
        throw new Error(studentsResponse.error || 'Erreur lors du chargement des étudiants');
      }
      
      if (paymentsResponse.success && paymentsResponse.data) {
        setPayments(paymentsResponse.data);
      } else {
        console.warn('Erreur lors du chargement des paiements:', paymentsResponse.error);
        setPayments([]);
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

  // Filtrage des étudiants
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.code_auth ? student.code_auth.toLowerCase() : '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && student.actif) ||
      (statusFilter === 'suspended' && !student.actif);
    
    return matchesSearch && matchesStatus;
  });

  // Actions admin - Fonctions conservées pour référence
  const handleAddStudent = async () => {
    // Cette fonction est maintenant remplacée par AddStudentForm
  };

  const handleToggleStudent = async (studentId: number, currentStatus: boolean) => {
    try {
      const response = await studentService.toggleStudent(studentId, !currentStatus);
      
      if (response.success) {
        // Mettre à jour localement
        setStudents(prev => prev.map(student => 
          student.id_etudiant === studentId 
            ? { ...student, actif: !currentStatus }
            : student
        ));
        
        const student = students.find(s => s.id_etudiant === studentId);
        const action = !currentStatus ? 'réactivé' : 'suspendu';
        toast({
          title: `Étudiant ${action}`,
          description: `Le compte de ${student?.prenom} ${student?.nom} a été ${action}`
        });
      } else {
        throw new Error(response.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'étudiant",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    try {
      const student = students.find(s => s.id_etudiant === studentId);
      const response = await studentService.deleteStudent(studentId);
      
      if (response.success) {
        // Supprimer localement
        setStudents(prev => prev.filter(s => s.id_etudiant !== studentId));
        
        toast({
          title: "Étudiant supprimé",
          description: `${student?.prenom} ${student?.nom} a été supprimé définitivement`
        });
      } else {
        throw new Error(response.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'étudiant",
        variant: "destructive"
      });
    }
  };

  const handleSendAuthCode = async (studentId: number) => {
    try {
      const response = await studentService.resendAuthCode(studentId);
      
      if (response.success) {
        const student = students.find(s => s.id_etudiant === studentId);
        toast({
          title: "Code renvoyé",
          description: `Code d'authentification renvoyé à ${student?.email}`
        });
      } else {
        throw new Error(response.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du code:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le code d'authentification",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const response = await studentService.bulkDeleteStudents();
      
      if (response.success) {
        const count = students.length;
        setStudents([]);
        
        toast({
          title: "Suppression en masse",
          description: `${count} étudiants ont été supprimés (fin de formation)`
        });
      } else {
        throw new Error(response.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression en masse:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les étudiants",
        variant: "destructive"
      });
    }
  };

  const handleExportDocx = async () => {
    try {
      const headerRow = new DocxTableRow({
        children: [
          'ID', 'Nom', 'Prénom', 'Email', 'Actif', 'Téléphone', 'Date inscription', 'Code Auth'
        ].map(text => new DocxTableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text, bold: true, color: 'ffffff' })] })
          ],
          shading: { fill: '1f2937' },
          width: { size: 12.5, type: WidthType.PERCENTAGE }
        }))
      });

      const dataRows = filteredStudents.map((s, idx) => new DocxTableRow({
        children: [
          String(s.id_etudiant),
          s.nom || '',
          s.prenom || '',
          s.email || '',
          s.actif ? 'Oui' : 'Non',
          s.telephone || '',
          s.date_inscription ? new Date(s.date_inscription).toLocaleDateString() : '',
          s.code_auth || ''
        ].map(text => new DocxTableCell({
          children: [new Paragraph(String(text))],
          width: { size: 12.5, type: WidthType.PERCENTAGE },
          shading: idx % 2 === 0 ? { fill: 'f8fafc' } : undefined
        }))
      }));

      const table = new DocxTable({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE }
      });

      const doc = new DocxDocument({
        creator: 'Quiz Connect Admin',
        title: 'Liste des Étudiants',
        description: 'Export des étudiants',
        sections: [
          {
            properties: {
              page: {
                margin: { top: 720, right: 720, bottom: 720, left: 720 },
                size: { orientation: PageOrientation.LANDSCAPE }
              }
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Quiz Connect', bold: true, size: 32, color: '2563eb' })
                ],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({
                children: [new TextRun({ text: 'Liste des Étudiants', bold: true, size: 28 })],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({ text: `Date: ${new Date().toLocaleString()}` }),
              new Paragraph(''),
              table
            ]
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `etudiants_${new Date().toISOString().slice(0,10)}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Export DOCX terminé', description: 'Le document Word a été téléchargé.' });
    } catch (e) {
      toast({ title: 'Erreur', description: "Échec de l'export DOCX des étudiants", variant: 'destructive' });
    }
  };

  if (showAddForm) {
    return (
      <AddStudentForm 
        onCancel={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          loadData(); // Recharger les données après ajout
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Bouton d'ajout */}
      <Card className="shadow-card">
        <CardContent className="pt-4 sm:pt-6">
          <Button onClick={() => setShowAddForm(true)} className="w-full sm:w-auto bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un Étudiant
          </Button>
        </CardContent>
      </Card>

      {/* Recherche et filtres */}
      <Card className="shadow-card">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs uniquement</SelectItem>
                  <SelectItem value="suspended">Suspendus uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleExportDocx} className="text-xs sm:text-sm">
                <Download className="h-4 w-4 mr-1 sm:mr-2" />
                Exporter DOCX
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={students.length === 0 || loading}
                    className="text-xs sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                    Supprimer tout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement tous les étudiants listés. Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>Confirmer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des étudiants */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>
            Liste des Étudiants
            <Badge variant="secondary" className="ml-2">
              {filteredStudents.length} résultat{filteredStudents.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription>
            Gérez les comptes étudiants et leurs accès
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des étudiants...</span>
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
          ) : filteredStudents.length === 0 ? (
            <Alert>
              <AlertDescription>
                Aucun étudiant ne correspond aux critères de recherche.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Nom & Prénom</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Email</TableHead>
                    <TableHead className="text-xs sm:text-sm">Code Auth</TableHead>
                    <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Paiement</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Inscription</TableHead>
                    <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((etudiant) => {
                    const studentPayments = payments.filter(p => p.id_etudiant === etudiant.id_etudiant);
                    const hasPayment = studentPayments.length > 0;
                    const paymentStatus = hasPayment ? studentPayments[0].statut : 'aucun';
                    
                    return (
                      <TableRow key={etudiant.id_etudiant}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div>
                            <div>{etudiant.prenom} {etudiant.nom}</div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              {etudiant.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{etudiant.email}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {etudiant.code_auth || ''}
                        </TableCell>
                        <TableCell>
                          <Badge variant={etudiant.actif ? "default" : "destructive"} className="text-xs">
                            {etudiant.actif ? 'Actif' : 'Suspendu'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={
                            paymentStatus === 'complet' ? 'default' :
                            paymentStatus === 'par_tranche' ? 'secondary' :
                            paymentStatus === 'en_attente' ? 'destructive' : 'outline'
                          } className="text-xs">
                            {paymentStatus === 'complet' ? 'Payé' :
                             paymentStatus === 'par_tranche' ? 'Partiel' : 
                             paymentStatus === 'en_attente' ? 'En attente' : 'Aucun'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">
                          {new Date(etudiant.date_inscription).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStudent(etudiant.id_etudiant, etudiant.actif)}
                              title={etudiant.actif ? 'Suspendre' : 'Réactiver'}
                            >
                              {etudiant.actif ? (
                                <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
                              ) : (
                                <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendAuthCode(etudiant.id_etudiant)}
                              title="Renvoyer le code"
                              className="hidden sm:flex"
                            >
                              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteStudent(etudiant.id_etudiant)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
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