import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, 
  Download, 
  Search, 
  Calendar,
  CheckCircle,
  FileText,
  Loader2,
  ExternalLink,
  Share2,
  Copy,
  Eye,
  XCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Sertifikaat {
  id: string;
  gebruiker_id: string;
  kursus_id: string;
  sertifikaat_nommer: string;
  gebruiker_naam: string;
  kursus_titel: string;
  voltooiing_datum: string;
  pdf_url?: string;
  is_geldig: boolean;
  created_at: string;
}

interface MySertifikateProps {
  onViewCourse?: (kursusId: string) => void;
}

const MySertifikate: React.FC<MySertifikateProps> = ({ onViewCourse }) => {
  const { currentUser } = useNHKA();
  const { toast } = useToast();
  const [sertifikate, setSertifikate] = useState<Sertifikaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSertifikaat, setSelectedSertifikaat] = useState<Sertifikaat | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [verifyNumber, setVerifyNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; certificate?: any } | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchSertifikate();
    }
  }, [currentUser]);

  const fetchSertifikate = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lms_sertifikate')
        .select('*')
        .eq('gebruiker_id', currentUser.id)
        .order('voltooiing_datum', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          setSertifikate([]);
          return;
        }
        throw error;
      }

      setSertifikate(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie sertifikate laai nie.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const months = [
      'Januarie', 'Februarie', 'Maart', 'April', 'Mei', 'Junie',
      'Julie', 'Augustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleDownload = (sertifikaat: Sertifikaat) => {
    if (!sertifikaat.pdf_url) {
      toast({
        title: 'Fout',
        description: 'Sertifikaat lêer nie beskikbaar nie.',
        variant: 'destructive'
      });
      return;
    }

    // For SVG data URL, convert to downloadable format
    if (sertifikaat.pdf_url.startsWith('data:image/svg+xml')) {
      // Extract base64 content
      const base64Content = sertifikaat.pdf_url.split(',')[1];
      const svgContent = decodeURIComponent(escape(atob(base64Content)));
      
      // Create blob and download
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sertifikaat_${sertifikaat.sertifikaat_nommer}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Aflaai begin',
        description: 'Jou sertifikaat word afgelaai.',
      });
    } else {
      // Direct URL download
      window.open(sertifikaat.pdf_url, '_blank');
    }
  };

  const handlePreview = (sertifikaat: Sertifikaat) => {
    setSelectedSertifikaat(sertifikaat);
    setShowPreview(true);
  };

  const handleCopyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    toast({
      title: 'Gekopieer',
      description: 'Sertifikaat nommer gekopieer na knipbord.',
    });
  };

  const handleShare = async (sertifikaat: Sertifikaat) => {
    const shareText = `Ek het die kursus "${sertifikaat.kursus_titel}" voltooi by die NHKA Geloofsgroei Akademie! Sertifikaat Nr: ${sertifikaat.sertifikaat_nommer}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My NHKA Sertifikaat',
          text: shareText,
        });
      } catch (error) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Gekopieer',
        description: 'Deel teks gekopieer na knipbord.',
      });
    }
  };

  const handleVerify = async () => {
    if (!verifyNumber.trim()) {
      toast({
        title: 'Voer nommer in',
        description: 'Voer asseblief \'n sertifikaat nommer in om te verifieer.',
        variant: 'destructive'
      });
      return;
    }

    setVerifying(true);
    setVerifyResult(null);

    try {
      const { data, error } = await supabase
        .from('lms_sertifikate')
        .select('*')
        .eq('sertifikaat_nommer', verifyNumber.trim().toUpperCase())
        .single();

      if (error || !data) {
        setVerifyResult({ valid: false });
      } else {
        setVerifyResult({
          valid: data.is_geldig,
          certificate: data
        });
      }
    } catch (error) {
      setVerifyResult({ valid: false });
    } finally {
      setVerifying(false);
    }
  };

  const filteredSertifikate = sertifikate.filter(s =>
    s.kursus_titel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sertifikaat_nommer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#002855]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#002855] flex items-center gap-2">
            <Award className="w-7 h-7 text-[#D4A84B]" />
            My Sertifikate
          </h2>
          <p className="text-gray-600 mt-1">
            Bekyk en laai jou verdiende sertifikate af
          </p>
        </div>
        <Badge className="bg-[#D4A84B] text-[#002855] self-start sm:self-auto">
          {sertifikate.length} Sertifikate
        </Badge>
      </div>

      {/* Search and Verify */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-[#002855]/10">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Soek sertifikate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#D4A84B]/30">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Verifieer sertifikaat nommer..."
                value={verifyNumber}
                onChange={(e) => setVerifyNumber(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <Button 
                onClick={handleVerify} 
                disabled={verifying}
                className="bg-[#D4A84B] hover:bg-[#C49A3B] text-white"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verifieer'}
              </Button>
            </div>
            
            {verifyResult && (
              <div className={`mt-3 p-3 rounded-lg ${verifyResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {verifyResult.valid ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700">Geldige Sertifikaat</p>
                      <p className="text-sm text-green-600">
                        {verifyResult.certificate?.gebruiker_naam} - {verifyResult.certificate?.kursus_titel}
                      </p>
                      <p className="text-xs text-green-500 mt-1">
                        Voltooi: {formatDate(verifyResult.certificate?.voltooiing_datum)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700">Sertifikaat nie gevind of ongeldig</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Certificates Grid */}
      {filteredSertifikate.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery ? 'Geen sertifikate gevind' : 'Nog geen sertifikate nie'}
            </h3>
            <p className="text-gray-500">
              {searchQuery 
                ? 'Probeer ander soekterme.' 
                : 'Voltooi kursusse om sertifikate te verdien.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSertifikate.map((sertifikaat) => (
            <Card 
              key={sertifikaat.id} 
              className="overflow-hidden hover:shadow-lg transition-all border-[#002855]/10"
            >
              {/* Certificate Preview Header */}
              <div className="h-32 bg-gradient-to-br from-[#002855] to-[#004895] relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Award className="w-12 h-12 text-[#D4A84B] mx-auto mb-2" />
                    <span className="text-white/80 text-xs font-medium">SERTIFIKAAT</span>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-[#D4A84B]/50" />
                <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-[#D4A84B]/50" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-[#D4A84B]/50" />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-[#D4A84B]/50" />
                
                {sertifikaat.is_geldig && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500 text-white text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Geldig
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-[#002855] line-clamp-2 mb-2">
                  {sertifikaat.kursus_titel}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4" />
                  {formatDate(sertifikaat.voltooiing_datum)}
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-4">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-xs text-gray-600 flex-1 truncate">
                    {sertifikaat.sertifikaat_nommer}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopyNumber(sertifikaat.sertifikaat_nommer)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(sertifikaat)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Bekyk
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-[#002855]"
                    onClick={() => handleDownload(sertifikaat)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Aflaai
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(sertifikaat)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D4A84B]" />
              Sertifikaat Voorskou
            </DialogTitle>
            <DialogDescription>
              {selectedSertifikaat?.kursus_titel}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSertifikaat?.pdf_url && (
            <div className="mt-4">
              {selectedSertifikaat.pdf_url.startsWith('data:image/svg+xml') ? (
                <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
                  <img 
                    src={selectedSertifikaat.pdf_url} 
                    alt="Sertifikaat" 
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Klik om sertifikaat te bekyk</p>
                  <Button
                    className="mt-4"
                    onClick={() => window.open(selectedSertifikaat.pdf_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Maak Oop
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              <span className="font-mono">{selectedSertifikaat?.sertifikaat_nommer}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => selectedSertifikaat && handleShare(selectedSertifikaat)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Deel
              </Button>
              <Button
                className="bg-[#002855]"
                onClick={() => selectedSertifikaat && handleDownload(selectedSertifikaat)}
              >
                <Download className="w-4 h-4 mr-2" />
                Aflaai
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MySertifikate;
