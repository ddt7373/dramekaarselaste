import React, { useState, useEffect, useRef } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import {
  Dokument,
  DokumentKategorie,
  DokumentKategorieCustom,
  getDokumentKategorieLabel,
  DEFAULT_DOKUMENT_KATEGORIEE,
  Gebruiker,
  isGemeenteAdmin
} from '@/types/nhka';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  Plus,
  X,
  File,
  FileImage,
  FileSpreadsheet,
  Users,
  Globe,
  Lock,
  Eye,
  Loader2,
  Settings,
  FolderPlus,
  Edit2,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

const DokumenteBestuur: React.FC = () => {
  const { currentUser, currentGemeente, gebruikers } = useNHKA();
  const [dokumente, setDokumente] = useState<Dokument[]>([]);
  const [customKategoriee, setCustomKategoriee] = useState<DokumentKategorieCustom[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showKategorieModal, setShowKategorieModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategorie, setFilterKategorie] = useState<DokumentKategorie | 'alle'>('alle');
  const [filterTipe, setFilterTipe] = useState<'alle' | 'publiek' | 'persoonlik'>('alle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    titel: '',
    beskrywing: '',
    kategorie: 'algemeen' as DokumentKategorie,
    is_publiek: false,
    lidmaat_id: '',
    file: null as File | null
  });

  // Kategorie form state
  const [kategorieForm, setKategorieForm] = useState({
    id: '',
    naam: '',
    beskrywing: ''
  });
  const [editingKategorie, setEditingKategorie] = useState(false);
  const [savingKategorie, setSavingKategorie] = useState(false);

  const canManageKategoriee = currentUser && isGemeenteAdmin(currentUser.rol);

  useEffect(() => {
    if (currentGemeente?.id) {
      fetchDokumente();
      fetchCustomKategoriee();
    }
  }, [currentGemeente?.id]);

  const fetchDokumente = async () => {
    if (!currentGemeente?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dokumente')
        .select('*')
        .eq('gemeente_id', currentGemeente.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDokumente(data || []);
    } catch (error) {
      console.error('Error fetching dokumente:', error);
      toast.error('Kon nie dokumente laai nie');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomKategoriee = async () => {
    if (!currentGemeente?.id) return;

    try {
      const { data, error } = await supabase
        .from('dokument_kategoriee')
        .select('*')
        .eq('gemeente_id', currentGemeente.id)
        .eq('aktief', true)
        .order('naam');

      if (error) throw error;
      setCustomKategoriee(data || []);
    } catch (error) {
      console.error('Error fetching custom kategoriee:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Lêer is te groot. Maksimum grootte is 10MB');
        return;
      }
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.titel || !currentGemeente?.id || !currentUser?.id) {
      toast.error('Vul asseblief alle verpligte velde in');
      return;
    }

    setUploading(true);
    try {
      // Generate unique file path
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${Date.now()}_${uploadForm.file.name}`;
      const filePath = `${currentGemeente.id}/${uploadForm.lidmaat_id || 'gemeente'}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('gemeente-dokumente')
        .upload(filePath, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get the lidmaat name if uploading for a specific member
      let lidmaatNaam = '';
      if (uploadForm.lidmaat_id) {
        const lidmaat = gebruikers.find(g => g.id === uploadForm.lidmaat_id);
        lidmaatNaam = lidmaat ? `${lidmaat.naam} ${lidmaat.van}` : '';
      }

      // Save document metadata
      const { error: dbError } = await supabase
        .from('dokumente')
        .insert({
          gemeente_id: currentGemeente.id,
          lidmaat_id: uploadForm.lidmaat_id || null,
          lidmaat_naam: lidmaatNaam || null,
          titel: uploadForm.titel,
          beskrywing: uploadForm.beskrywing || null,
          kategorie: uploadForm.kategorie,
          file_name: uploadForm.file.name,
          file_path: filePath,
          file_size: uploadForm.file.size,
          file_type: uploadForm.file.type,
          is_publiek: uploadForm.is_publiek,
          opgelaai_deur: currentUser.id
        });

      if (dbError) throw dbError;

      toast.success('Dokument suksesvol opgelaai!');
      setShowUploadModal(false);
      setUploadForm({
        titel: '',
        beskrywing: '',
        kategorie: 'algemeen',
        is_publiek: false,
        lidmaat_id: '',
        file: null
      });
      fetchDokumente();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Kon nie dokument oplaai nie');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (dokument: Dokument) => {
    try {
      const { data, error } = await supabase.storage
        .from('gemeente-dokumente')
        .download(dokument.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = dokument.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Dokument afgelaai!');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Kon nie dokument aflaai nie');
    }
  };

  const handleDelete = async (dokument: Dokument) => {
    if (!confirm(`Is jy seker jy wil "${dokument.titel}" uitvee?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('gemeente-dokumente')
        .remove([dokument.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('dokumente')
        .delete()
        .eq('id', dokument.id);

      if (dbError) throw dbError;

      toast.success('Dokument uitgevee!');
      fetchDokumente();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Kon nie dokument uitvee nie');
    }
  };

  // Kategorie management functions
  const handleSaveKategorie = async () => {
    if (!kategorieForm.naam.trim() || !currentGemeente?.id || !currentUser?.id) {
      toast.error('Vul asseblief die kategorie naam in');
      return;
    }

    setSavingKategorie(true);
    try {
      if (editingKategorie && kategorieForm.id) {
        // Update existing
        const { error } = await supabase
          .from('dokument_kategoriee')
          .update({
            naam: kategorieForm.naam.trim(),
            beskrywing: kategorieForm.beskrywing.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', kategorieForm.id);

        if (error) throw error;
        toast.success('Kategorie opgedateer!');
      } else {
        // Create new
        const { error } = await supabase
          .from('dokument_kategoriee')
          .insert({
            gemeente_id: currentGemeente.id,
            naam: kategorieForm.naam.trim(),
            beskrywing: kategorieForm.beskrywing.trim() || null,
            created_by: currentUser.id
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('Hierdie kategorie naam bestaan reeds');
            return;
          }
          throw error;
        }
        toast.success('Nuwe kategorie geskep!');
      }

      setKategorieForm({ id: '', naam: '', beskrywing: '' });
      setEditingKategorie(false);
      fetchCustomKategoriee();
    } catch (error) {
      console.error('Error saving kategorie:', error);
      toast.error('Kon nie kategorie stoor nie');
    } finally {
      setSavingKategorie(false);
    }
  };

  const handleEditKategorie = (kategorie: DokumentKategorieCustom) => {
    setKategorieForm({
      id: kategorie.id,
      naam: kategorie.naam,
      beskrywing: kategorie.beskrywing || ''
    });
    setEditingKategorie(true);
  };

  const handleDeleteKategorie = async (kategorie: DokumentKategorieCustom) => {
    // Check if any documents use this category
    const docsUsingCategory = dokumente.filter(d => d.kategorie === kategorie.id || d.kategorie === kategorie.naam);

    if (docsUsingCategory.length > 0) {
      toast.error(`Kan nie uitvee nie - ${docsUsingCategory.length} dokument(e) gebruik hierdie kategorie`);
      return;
    }

    if (!confirm(`Is jy seker jy wil "${kategorie.naam}" uitvee?`)) return;

    try {
      const { error } = await supabase
        .from('dokument_kategoriee')
        .delete()
        .eq('id', kategorie.id);

      if (error) throw error;
      toast.success('Kategorie uitgevee!');
      fetchCustomKategoriee();
    } catch (error) {
      console.error('Error deleting kategorie:', error);
      toast.error('Kon nie kategorie uitvee nie');
    }
  };

  const cancelEditKategorie = () => {
    setKategorieForm({ id: '', naam: '', beskrywing: '' });
    setEditingKategorie(false);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('image')) return <FileImage className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />;
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return <FileSpreadsheet className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 flex-shrink-0" />;
    if (fileType?.includes('pdf')) return <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />;
    return <File className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 flex-shrink-0" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Onbekend';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get all categories (default + custom)
  const getAllKategoriee = () => {
    const all = [...DEFAULT_DOKUMENT_KATEGORIEE];
    customKategoriee.forEach(custom => {
      all.push({ value: custom.id, label: custom.naam });
    });
    return all;
  };

  // Filter documents
  const filteredDokumente = dokumente.filter(dok => {
    const matchesSearch = dok.titel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dok.beskrywing?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dok.lidmaat_naam?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategorie = filterKategorie === 'alle' || dok.kategorie === filterKategorie;
    const matchesTipe = filterTipe === 'alle' ||
      (filterTipe === 'publiek' && dok.is_publiek) ||
      (filterTipe === 'persoonlik' && !dok.is_publiek && dok.lidmaat_id);
    return matchesSearch && matchesKategorie && matchesTipe;
  });

  if (!currentGemeente) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Kies eers 'n gemeente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#002855]">Dokumente Bestuur</h1>
          <p className="text-sm sm:text-base text-gray-600">Bestuur gemeente en lidmaat dokumente</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {canManageKategoriee && (
            <Button
              variant="outline"
              onClick={() => setShowKategorieModal(true)}
              className="text-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Bestuur </span>Kategorieë
            </Button>
          )}
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-[#002855] hover:bg-[#002855]/90 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Laai Dokument Op
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-blue-700">Totale Dokumente</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">{dokumente.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-green-700">Publieke Dokumente</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">{dokumente.filter(d => d.is_publiek).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-purple-700">Lidmaat Dokumente</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-900">{dokumente.filter(d => d.lidmaat_id).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Soek dokumente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterKategorie}
                onChange={(e) => setFilterKategorie(e.target.value as DokumentKategorie | 'alle')}
                className="flex-1 sm:flex-none px-3 py-2 border rounded-lg text-sm min-w-0"
              >
                <option value="alle">Alle Kategorieë</option>
                {getAllKategoriee().map(kat => (
                  <option key={kat.value} value={kat.value}>{kat.label}</option>
                ))}
              </select>
              <select
                value={filterTipe}
                onChange={(e) => setFilterTipe(e.target.value as 'alle' | 'publiek' | 'persoonlik')}
                className="flex-1 sm:flex-none px-3 py-2 border rounded-lg text-sm min-w-0"
              >
                <option value="alle">Alle Tipes</option>
                <option value="publiek">Publiek</option>
                <option value="persoonlik">Persoonlik</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#002855]" />
        </div>
      ) : filteredDokumente.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Geen dokumente gevind</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || filterKategorie !== 'alle' || filterTipe !== 'alle'
                ? 'Probeer jou soek of filter verander'
                : 'Begin deur dokumente op te laai'}
            </p>
            <Button onClick={() => setShowUploadModal(true)} className="bg-[#002855]">
              <Upload className="w-4 h-4 mr-2" />
              Laai Eerste Dokument Op
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredDokumente.map(dokument => (
            <Card key={dokument.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  {getFileIcon(dokument.file_type || '')}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{dokument.titel}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{dokument.file_name}</p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full truncate max-w-[100px] sm:max-w-none">
                        {getDokumentKategorieLabel(dokument.kategorie, customKategoriee)}
                      </span>
                      {dokument.is_publiek ? (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                          <Globe className="w-3 h-3" /> <span className="hidden sm:inline">Publiek</span>
                        </span>
                      ) : dokument.lidmaat_id && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" /> <span className="hidden sm:inline">Persoonlik</span>
                        </span>
                      )}
                    </div>
                    {dokument.lidmaat_naam && (
                      <p className="text-xs text-purple-600 mt-1 truncate">
                        Lidmaat: {dokument.lidmaat_naam}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatFileSize(dokument.file_size)} • {new Date(dokument.created_at).toLocaleDateString('af-ZA')}
                    </p>
                  </div>
                </div>
                {dokument.beskrywing && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">{dokument.beskrywing}</p>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(dokument)}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Aflaai
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(dokument)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Laai Dokument Op</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              {/* File Upload */}
              <div>
                <Label className="text-sm">Lêer *</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-[#002855] transition-colors"
                >
                  {uploadForm.file ? (
                    <div className="flex items-center justify-center gap-2">
                      {getFileIcon(uploadForm.file.type)}
                      <div className="text-left min-w-0">
                        <p className="font-medium text-sm truncate">{uploadForm.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(uploadForm.file.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Klik om 'n lêer te kies</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, of Beelde (Maks 10MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="titel" className="text-sm">Titel *</Label>
                <Input
                  id="titel"
                  value={uploadForm.titel}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, titel: e.target.value }))}
                  placeholder="bv. Doopsertifikaat - Jan van der Berg"
                  className="text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="beskrywing" className="text-sm">Beskrywing</Label>
                <Textarea
                  id="beskrywing"
                  value={uploadForm.beskrywing}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, beskrywing: e.target.value }))}
                  placeholder="Opsionele beskrywing van die dokument"
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="kategorie" className="text-sm">Kategorie</Label>
                <select
                  id="kategorie"
                  value={uploadForm.kategorie}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, kategorie: e.target.value as DokumentKategorie }))}
                  className="w-full px-3 py-2 border rounded-lg mt-1 text-sm"
                >
                  <optgroup label="Standaard Kategorieë">
                    {DEFAULT_DOKUMENT_KATEGORIEE.map(kat => (
                      <option key={kat.value} value={kat.value}>{kat.label}</option>
                    ))}
                  </optgroup>
                  {customKategoriee.length > 0 && (
                    <optgroup label="Gemeente Kategorieë">
                      {customKategoriee.map(kat => (
                        <option key={kat.id} value={kat.id}>{kat.naam}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Member Selection */}
              <div>
                <Label htmlFor="lidmaat" className="text-sm">Lidmaat (Opsioneel)</Label>
                <select
                  id="lidmaat"
                  value={uploadForm.lidmaat_id}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, lidmaat_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg mt-1 text-sm"
                >
                  <option value="">-- Gemeente Dokument --</option>
                  {gebruikers
                    .filter(g => g.gemeente_id === currentGemeente?.id)
                    .sort((a, b) => `${a.van} ${a.naam}`.localeCompare(`${b.van} ${b.naam}`))
                    .map(g => (
                      <option key={g.id} value={g.id}>{g.van}, {g.naam}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Kies 'n lidmaat as hierdie dokument spesifiek vir daardie persoon is
                </p>
              </div>

              {/* Public Toggle */}
              {!uploadForm.lidmaat_id && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_publiek"
                    checked={uploadForm.is_publiek}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, is_publiek: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <div>
                    <Label htmlFor="is_publiek" className="cursor-pointer text-sm">Publieke Dokument</Label>
                    <p className="text-xs text-gray-500">Alle lidmate kan hierdie dokument sien en aflaai</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 text-sm"
                >
                  Kanselleer
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !uploadForm.file || !uploadForm.titel}
                  className="flex-1 bg-[#002855] text-sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Laai op...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Laai Op
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kategorie Management Modal */}
      {showKategorieModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Bestuur Dokument Kategorieë
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowKategorieModal(false);
                cancelEditKategorie();
              }}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              {/* Add/Edit Form */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <FolderPlus className="w-4 h-4" />
                  {editingKategorie ? 'Wysig Kategorie' : 'Nuwe Kategorie'}
                </h3>
                <div>
                  <Label htmlFor="kat-naam" className="text-sm">Naam *</Label>
                  <Input
                    id="kat-naam"
                    value={kategorieForm.naam}
                    onChange={(e) => setKategorieForm(prev => ({ ...prev, naam: e.target.value }))}
                    placeholder="bv. Finansiële Verslae"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="kat-beskrywing" className="text-sm">Beskrywing (Opsioneel)</Label>
                  <Textarea
                    id="kat-beskrywing"
                    value={kategorieForm.beskrywing}
                    onChange={(e) => setKategorieForm(prev => ({ ...prev, beskrywing: e.target.value }))}
                    placeholder="Kort beskrywing van die kategorie"
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  {editingKategorie && (
                    <Button
                      variant="outline"
                      onClick={cancelEditKategorie}
                      className="flex-1 text-sm"
                    >
                      Kanselleer
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveKategorie}
                    disabled={savingKategorie || !kategorieForm.naam.trim()}
                    className="flex-1 bg-[#002855] text-sm"
                  >
                    {savingKategorie ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingKategorie ? (
                      'Dateer Op'
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Skep
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Default Categories */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-2">Standaard Kategorieë</h3>
                <div className="space-y-1">
                  {DEFAULT_DOKUMENT_KATEGORIEE.map(kat => (
                    <div key={kat.value} className="flex items-center justify-between p-2 bg-gray-100 rounded text-sm">
                      <span>{kat.label}</span>
                      <span className="text-xs text-gray-500">Standaard</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Categories */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-2">
                  Gemeente Kategorieë ({customKategoriee.length})
                </h3>
                {customKategoriee.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nog geen eie kategorieë geskep nie
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customKategoriee.map(kat => (
                      <div key={kat.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{kat.naam}</p>
                          {kat.beskrywing && (
                            <p className="text-xs text-gray-500 truncate">{kat.beskrywing}</p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditKategorie(kat)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKategorie(kat)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowKategorieModal(false);
                    cancelEditKategorie();
                  }}
                  className="w-full text-sm"
                >
                  Sluit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DokumenteBestuur;
