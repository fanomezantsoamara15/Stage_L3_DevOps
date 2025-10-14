import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Upload, 
  FileText, 
  Video, 
  Image,
  Download,
  Trash2,
  Search,
  Plus,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { documentService } from '@/services/apiService';

export function DocumentManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'video' | 'image'>('all');
  
  // État pour l'ajout de document
  const [newDocument, setNewDocument] = useState({
    titre: '',
    type: 'pdf' as 'pdf' | 'video' | 'image',
    telechargeable: true,
    file: null as File | null
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAllDocuments();
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les documents.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.titre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Actions admin
  const handleAddDocument = async () => {
    if (!newDocument.titre || !newDocument.file) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs et sélectionner un fichier",
        variant: "destructive"
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', newDocument.file);
      formData.append('titre', newDocument.titre);
      formData.append('type', newDocument.type);
      formData.append('telechargeable', newDocument.telechargeable.toString());

      const response = await documentService.addDocument(formData);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de l\'ajout du document');
      }

      toast({
        title: "Document ajouté",
        description: `${newDocument.titre} a été ajouté avec succès`
      });

      setNewDocument({ titre: '', type: 'pdf', telechargeable: true, file: null });
      loadDocuments(); // Recharger la liste
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'ajout du document",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async (documentId: number) => {
    try {
      const response = await documentService.downloadDocument(documentId);

      if (response.success && response.data) {
        // Créer un lien de téléchargement
        const blob = await response.data.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `document_${documentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Téléchargement réussi",
          description: "Le document a été téléchargé"
        });
      } else {
        throw new Error(response.error || 'Erreur lors du téléchargement');
      }
    } catch (error: any) {
      toast({
        title: "Erreur de téléchargement",
        description: error.message || "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      const response = await documentService.deleteDocument(documentId);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression');
      }

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès"
      });

      loadDocuments(); // Recharger la liste
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression du document",
        variant: "destructive"
      });
    }
  };

  const handleToggleDownloadable = async (documentId: number, downloadable: boolean) => {
    try {
      const response = await documentService.updateDocument(documentId, { telechargeable: downloadable });
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour');
      }
      
      toast({
        title: "Paramètres mis à jour",
        description: `Le document est maintenant ${downloadable ? 'téléchargeable' : 'non téléchargeable'}`
      });
      
      loadDocuments(); // Recharger la liste
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du document",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-500';
      case 'video': return 'bg-blue-500';
      case 'image': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement des documents...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ajouter un document */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un Document
          </CardTitle>
          <CardDescription>
            Uploadez des supports de cours pour vos étudiants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titre">Titre du document *</Label>
              <Input
                id="titre"
                value={newDocument.titre}
                onChange={(e) => setNewDocument({...newDocument, titre: e.target.value})}
                placeholder="Ex: Cours 1 - Introduction"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Type de document *</Label>
              <Select 
                value={newDocument.type} 
                onValueChange={(value: 'pdf' | 'video' | 'image') => setNewDocument({...newDocument, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Vidéo</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="file">Fichier *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setNewDocument({...newDocument, file: e.target.files?.[0] || null})}
                accept={
                  newDocument.type === 'pdf' ? '.pdf' :
                  newDocument.type === 'video' ? '.mp4,.avi,.mov,.wmv' :
                  '.jpg,.jpeg,.png,.gif'
                }
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="telechargeable"
                checked={newDocument.telechargeable}
                onCheckedChange={(checked) => setNewDocument({...newDocument, telechargeable: checked})}
              />
              <Label htmlFor="telechargeable">Téléchargeable par les étudiants</Label>
            </div>
          </div>
          
          <div className="mt-4">
            <Button onClick={handleAddDocument} className="bg-gradient-primary">
              <Upload className="h-4 w-4 mr-2" />
              Uploader le Document
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recherche et filtres */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="pdf">PDF uniquement</SelectItem>
                  <SelectItem value="video">Vidéos uniquement</SelectItem>
                  <SelectItem value="image">Images uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bibliothèque de Documents
            <Badge variant="secondary" className="ml-2">
              {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription>
            Gérez vos supports de cours et leurs permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <Alert>
              <AlertDescription>
                Aucun document ne correspond aux critères de recherche.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Téléchargeable</TableHead>
                    <TableHead>Date Upload</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id_document}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(document.type)}
                          <span>{document.titre}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`${getTypeBadgeColor(document.type)} text-white border-0`}
                        >
                          {document.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={document.telechargeable}
                            onCheckedChange={(checked) => handleToggleDownloadable(document.id_document, checked)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {document.telechargeable ? 'Oui' : 'Non'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(document.date_upload).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(document.chemin, '_blank')}
                            title="Prévisualiser"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {document.telechargeable && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadDocument(document.id_document)}
                              title="Télécharger"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDocument(document.id_document)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}