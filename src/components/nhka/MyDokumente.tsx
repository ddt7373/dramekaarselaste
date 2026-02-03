import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { useOffline } from '@/contexts/OfflineContext';
import { supabase } from '@/lib/supabase';
import { Dokument, getDokumentKategorieLabel, DokumentKategorie } from '@/types/nhka';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Search, 
  File,
  FileImage,
  FileSpreadsheet,
  Globe,
  Lock,
  Loader2,
  FolderOpen,
  User,
  Building,
  WifiOff,
  CloudDownload,
  Check,
  HardDrive,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const MyDokumente: React.FC = () => {
  const { currentUser, currentGemeente } = useNHKA();
  const { isOnline, cacheDocument, removeCachedDocument, isDocumentCached, cachedDocuments } = useOffline();
  const [dokumente, setDokumente] = useState<Dokument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategorie, setFilterKategorie] = useState<DokumentKategorie | 'alle'>('alle');
  const [activeTab, setActiveTab] = useState<'my' | 'gemeente' | 'cached'>('my');
  const [cachingId, setCachingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentGemeente?.id && currentUser?.id) {
      fetchDokumente();
    }
  }, [currentGemeente?.id, currentUser?.id]);

  const fetchDokumente = async () => {
    if (!currentGemeente?.id || !currentUser?.id) return;
    
    setLoading(true);
    try {
      // Fetch documents that are either:
      // 1. Specifically for this user (lidmaat_id matches)
      // 2. Public documents for the gemeente
      const { data, error } = await supabase
        .from('dokumente')
        .select('*')
        .eq('gemeente_id', currentGemeente.id)
        .or(`lidmaat_id.eq.${currentUser.id},is_publiek.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDokumente(data || []);
    } catch (error) {
      console.error('Error fetching dokumente:', error);
      if (!isOnline) {
        toast.info('Van-lyn-af modus - wys slegs gekas dokumente');
      } else {
        toast.error('Kon nie dokumente laai nie');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (dokument: Dokument) => {
    try {
      // Check if document is cached
      if (isDocumentCached(dokument.id)) {
        // Try to get from cache first
        const cache = await caches.open('nhka-documents-v1');
        const cachedResponse = await cache.match(dokument.file_path);
        
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = dokument.file_name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Dokument afgelaai vanaf kas!');
          return;
        }
      }

      if (!isOnline) {
        toast.error('Jy is van-lyn-af en hierdie dokument is nie gekas nie');
        return;
      }

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

  const handleCacheDocument = async (dokument: Dokument) => {
    if (!isOnline) {
      toast.error('Jy moet aanlyn wees om dokumente te kas');
      return;
    }

    setCachingId(dokument.id);
    try {
      // Get the public URL for the document
      const { data } = supabase.storage
        .from('gemeente-dokumente')
        .getPublicUrl(dokument.file_path);

      await cacheDocument({
        id: dokument.id,
        name: dokument.titel,
        url: data.publicUrl,
        size: dokument.file_size
      });

      toast.success(`"${dokument.titel}" is nou beskikbaar van-lyn-af`);
    } catch (error) {
      console.error('Error caching document:', error);
      toast.error('Kon nie dokument kas nie');
    } finally {
      setCachingId(null);
    }
  };

  const handleRemoveCachedDocument = (id: string) => {
    removeCachedDocument(id);
    toast.success('Dokument verwyder uit van-lyn-af stoor');
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('image')) return <FileImage className="w-8 h-8 text-green-500" />;
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Onbekend';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Separate documents into personal and public
  const myDokumente = dokumente.filter(d => d.lidmaat_id === currentUser?.id);
  const gemeenteDokumente = dokumente.filter(d => d.is_publiek);

  // Get the active list based on tab
  const getActiveDokumente = () => {
    if (activeTab === 'cached') {
      // Return cached documents info
      return cachedDocuments.map(cd => ({
        id: cd.id,
        titel: cd.name,
        file_name: cd.name,
        file_path: cd.url,
        file_size: cd.size,
        file_type: '',
        kategorie: 'algemeen' as DokumentKategorie,
        is_publiek: false,
        gemeente_id: currentGemeente?.id || '',
        created_at: new Date(cd.cachedAt).toISOString(),
        updated_at: new Date(cd.cachedAt).toISOString(),
        cached: true
      }));
    }
    return activeTab === 'my' ? myDokumente : gemeenteDokumente;
  };

  const activeDokumente = getActiveDokumente();

  // Filter documents
  const filteredDokumente = activeDokumente.filter(dok => {
    const matchesSearch = dok.titel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dok.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategorie = filterKategorie === 'alle' || dok.kategorie === filterKategorie;
    return matchesSearch && (activeTab === 'cached' || matchesKategorie);
  });

  const kategorieOptions: DokumentKategorie[] = ['doopsertifikaat', 'lidmaatskap', 'grondwet', 'beleid', 'verslag', 'algemeen'];

  if (!currentGemeente || !currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Meld asseblief aan om jou dokumente te sien</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <WifiOff className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-800">Jy is tans van-lyn-af</p>
            <p className="text-sm text-amber-600">Slegs gekas dokumente is beskikbaar</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#002855]">My Dokumente</h1>
        <p className="text-gray-600">Bekyk en laai jou persoonlike en gemeente dokumente af</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'my' ? 'ring-2 ring-[#002855] bg-blue-50' : 'hover:shadow-md'}`}
          onClick={() => setActiveTab('my')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === 'my' ? 'bg-[#002855]' : 'bg-purple-500'}`}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">My Persoonlike</p>
                <p className="text-2xl font-bold text-gray-900">{myDokumente.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'gemeente' ? 'ring-2 ring-[#002855] bg-blue-50' : 'hover:shadow-md'}`}
          onClick={() => setActiveTab('gemeente')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === 'gemeente' ? 'bg-[#002855]' : 'bg-green-500'}`}>
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Gemeente</p>
                <p className="text-2xl font-bold text-gray-900">{gemeenteDokumente.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'cached' ? 'ring-2 ring-[#002855] bg-blue-50' : 'hover:shadow-md'}`}
          onClick={() => setActiveTab('cached')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === 'cached' ? 'bg-[#002855]' : 'bg-amber-500'}`}>
                <HardDrive className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Van-lyn-af Beskikbaar</p>
                <p className="text-2xl font-bold text-gray-900">{cachedDocuments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Indicator */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'my' 
              ? 'bg-white text-[#002855] shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          My Dokumente
        </button>
        <button
          onClick={() => setActiveTab('gemeente')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'gemeente' 
              ? 'bg-white text-[#002855] shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building className="w-4 h-4 inline mr-2" />
          Gemeente
        </button>
        <button
          onClick={() => setActiveTab('cached')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'cached' 
              ? 'bg-white text-[#002855] shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <HardDrive className="w-4 h-4 inline mr-2" />
          Van-lyn-af ({cachedDocuments.length})
        </button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Soek dokumente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeTab !== 'cached' && (
              <select
                value={filterKategorie}
                onChange={(e) => setFilterKategorie(e.target.value as DokumentKategorie | 'alle')}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="alle">Alle Kategorieë</option>
                {kategorieOptions.map(kat => (
                  <option key={kat} value={kat}>{getDokumentKategorieLabel(kat)}</option>
                ))}
              </select>
            )}
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
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'my' ? 'Geen persoonlike dokumente' : 
               activeTab === 'gemeente' ? 'Geen gemeente dokumente' :
               'Geen gekas dokumente'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'my' 
                ? 'Jou persoonlike dokumente soos doopsertifikate sal hier verskyn wanneer dit opgelaai word.'
                : activeTab === 'gemeente'
                ? 'Publieke gemeente dokumente soos die grondwet sal hier verskyn.'
                : 'Kas dokumente vir van-lyn-af toegang deur op die wolk-ikoon te klik.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDokumente.map(dokument => {
            const isCached = isDocumentCached(dokument.id);
            const isCaching = cachingId === dokument.id;
            
            return (
              <Card key={dokument.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getFileIcon(dokument.file_type || '')}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{dokument.titel}</h3>
                      <p className="text-sm text-gray-500 truncate">{dokument.file_name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {activeTab !== 'cached' && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                            {getDokumentKategorieLabel(dokument.kategorie)}
                          </span>
                        )}
                        {dokument.is_publiek ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Publiek
                          </span>
                        ) : activeTab !== 'cached' && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Persoonlik
                          </span>
                        )}
                        {isCached && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                            <HardDrive className="w-3 h-3" /> Van-lyn-af
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatFileSize(dokument.file_size)} • {new Date(dokument.created_at).toLocaleDateString('af-ZA')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    <Button
                      onClick={() => handleDownload(dokument)}
                      className="flex-1 bg-[#002855] hover:bg-[#002855]/90"
                      disabled={!isOnline && !isCached}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Laai Af
                    </Button>
                    
                    {activeTab === 'cached' ? (
                      <Button
                        variant="outline"
                        onClick={() => handleRemoveCachedDocument(dokument.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => isCached ? handleRemoveCachedDocument(dokument.id) : handleCacheDocument(dokument)}
                        disabled={isCaching || (!isOnline && !isCached)}
                        className={isCached ? 'text-green-600 border-green-200' : ''}
                        title={isCached ? 'Verwyder uit van-lyn-af stoor' : 'Stoor vir van-lyn-af gebruik'}
                      >
                        {isCaching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isCached ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <CloudDownload className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Van-lyn-af Dokumente</h3>
              <p className="text-sm text-blue-700 mt-1">
                Klik op die <CloudDownload className="w-4 h-4 inline" /> ikoon om dokumente te stoor vir van-lyn-af toegang. 
                Gekas dokumente kan afgelaai word selfs wanneer jy nie internet het nie.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                <strong>Wenk:</strong> Kas belangrike dokumente soos die gemeente grondwet en jou doopsertifikaat 
                sodat jy altyd toegang het.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyDokumente;
