import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import KursusSpeler from './KursusSpeler';
import MySertifikate from './MySertifikate';
import {
  BookOpen,
  Search,
  Clock,
  CheckCircle,
  Play,
  Award,
  TrendingUp,
  Filter,
  GraduationCap,
  Users,
  ChevronRight,
  Loader2,
  BookMarked,
  Target,
  Sparkles,
  BarChart3,
  Trophy,
  Heart,
  Zap,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GeloofsgroeiErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Geloofsgroei Error:', error, errorInfo);
  }



  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Iets het verkeerd gegaan</h3>
              <p className="text-red-600 mb-4 text-sm">{this.state.error?.message || 'Onbekende fout'}</p>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                variant="outline"
                className="border-red-300 text-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Herlaai Bladsy
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

import { LMSKursus, LMSModule, LMSLes, LMSVordering, LMSRegistrasie } from '@/types/nhka';
import { lmsTranslations } from './LMSTranslations';

// Helper functions

// Helper functions
const formatPrys = (prys: any): string => {
  const numPrys = typeof prys === 'number' ? prys : parseFloat(String(prys || 0)) || 0;
  return numPrys.toFixed(2);
};


const getVlakLabel = (vlak: string): string => {
  const labels: Record<string, string> = {
    'beginner': 'Beginner',
    'intermediêr': 'Intermediêr',
    'gevorderd': 'Gevorderd'
  };
  return labels[vlak] || vlak || 'Beginner';
};

const getVlakKleur = (vlak: string): string => {
  const kleure: Record<string, string> = {
    'beginner': 'bg-green-100 text-green-800',
    'intermediêr': 'bg-yellow-100 text-yellow-800',
    'gevorderd': 'bg-red-100 text-red-800'
  };
  return kleure[vlak] || 'bg-gray-100 text-gray-800';
};

const formatDuur = (minute: number): string => {
  if (!minute || minute < 0) return '0 min';
  if (minute < 60) return `${minute} min`;
  const ure = Math.floor(minute / 60);
  const oorblywende = minute % 60;
  if (oorblywende === 0) return `${ure} uur`;
  return `${ure}u ${oorblywende}m`;
};


const getKategorieIkoon = (kategorie: string): React.ReactNode => {
  const ikone: Record<string, React.ReactNode> = {
    'bybelstudie': <BookOpen className="w-5 h-5" />,
    'gebed': <Zap className="w-5 h-5" />,
    'geestelike dissiplines': <Target className="w-5 h-5" />,
    'teologie': <BookMarked className="w-5 h-5" />,
    'kerkgeskiedenis': <BookMarked className="w-5 h-5" />,
    'pastorale sorg': <Heart className="w-5 h-5" />,
    'leierskap': <Users className="w-5 h-5" />,
    'sending': <Target className="w-5 h-5" />,
    'jeugbediening': <Users className="w-5 h-5" />,
    'huwelik & gesin': <Heart className="w-5 h-5" />,
    'geloofsgrondslag': <GraduationCap className="w-5 h-5" />,
    'vbo opleiding': <Award className="w-5 h-5" />,
    'ander': <BookOpen className="w-5 h-5" />,
    'algemeen': <GraduationCap className="w-5 h-5" />
  };
  return ikone[kategorie?.toLowerCase()] || <BookOpen className="w-5 h-5" />;
};

const kategorieë = [
  { value: 'alle', label: 'Alle Kategorieë' }, // Translation handled in render
  { value: 'Bybelstudie', label: 'Bybelstudie' },
  { value: 'Gebed', label: 'Gebed' },
  { value: 'Geestelike Dissiplines', label: 'Geestelike Dissiplines' },
  { value: 'Teologie', label: 'Teologie' },
  { value: 'Kerkgeskiedenis', label: 'Kerkgeskiedenis' },
  { value: 'Pastorale Sorg', label: 'Pastorale Sorg' },
  { value: 'Leierskap', label: 'Leierskap' },
  { value: 'Sending', label: 'Sending' },
  { value: 'Jeugbediening', label: 'Jeugbediening' },
  { value: 'Huwelik & Gesin', label: 'Huwelik & Gesin' },
  { value: 'Geloofsgrondslag', label: 'Geloofsgrondslag' },
  { value: 'VBO Opleiding', label: 'VBO Opleiding' },
  { value: 'Ander', label: 'Ander' }
];

// Main Component Content
const GeloofsgroeiContent: React.FC = () => {
  const { currentUser, createYocoCheckout, currentGemeente, language, setLanguage } = useNHKA();
  const { toast } = useToast();

  const t = lmsTranslations[language as 'af' | 'en'];

  const [kursusse, setKursusse] = useState<LMSKursus[]>([]);
  const [myRegistrasies, setMyRegistrasies] = useState<LMSRegistrasie[]>([]);
  const [myVordering, setMyVordering] = useState<LMSVordering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategorie, setSelectedKategorie] = useState('alle');
  const [selectedVlak, setSelectedVlak] = useState('alle');
  const [activeTab, setActiveTab] = useState('ontdek');
  const [selectedKursus, setSelectedKursus] = useState<LMSKursus | null>(null);
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  // New states for course player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLes, setCurrentLes] = useState<LMSLes | null>(null);
  const [kursusVordering, setKursusVordering] = useState<LMSVordering[]>([]);

  // Fetch courses on mount
  useEffect(() => {
    fetchKursusse();
  }, []);

  // Fetch user data when user changes
  useEffect(() => {
    if (currentUser) {
      fetchMyRegistrasies();
      fetchMyVordering();
    }
  }, [currentUser]);

  const fetchKursusse = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('lms_kursusse')
        .select('*')
        .eq('is_gepubliseer', true)
        .eq('is_aktief', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.log('Kursusse fetch note:', fetchError.message);
        // Don't show error for missing table
        if (fetchError.code !== '42P01') {
          console.error('Fetch error:', fetchError);
        }
        setKursusse([]);
      } else {
        setKursusse(data || []);
      }
    } catch (e) {
      console.log('Kursusse fetch error:', e);
      setKursusse([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrasies = async () => {
    if (!currentUser) return;
    try {
      const { data } = await supabase
        .from('lms_registrasies')
        .select('*')
        .eq('gebruiker_id', currentUser.id);
      if (data) setMyRegistrasies(data);
    } catch (e) {
      console.log('Registrasies fetch skipped');
    }
  };

  const fetchMyVordering = async () => {
    if (!currentUser) return;
    try {
      const { data } = await supabase
        .from('lms_vordering')
        .select('*')
        .eq('gebruiker_id', currentUser.id);
      if (data) setMyVordering(data);
    } catch (e) {
      console.log('Vordering fetch skipped');
    }
  };

  const fetchKursusVordering = async (kursusId: string) => {
    if (!currentUser) return;
    try {
      const { data } = await supabase
        .from('lms_vordering')
        .select('*')
        .eq('gebruiker_id', currentUser.id)
        .eq('kursus_id', kursusId);
      if (data) setKursusVordering(data);
    } catch (e) {
      console.log('Kursus vordering fetch skipped');
    }
  };

  const fetchModules = async (kursusId: string) => {
    try {
      setDetailLoading(true);
      const { data, error } = await supabase
        .from('lms_modules')
        .select('*')
        .eq('kursus_id', kursusId)
        .eq('is_aktief', true)
        .order('volgorde');

      if (error) {
        console.log('Modules fetch note:', error.message);
        setModules([]);
        return;
      }

      if (data && data.length > 0) {
        const normalizeBylaes = (les: any) => {
          const bylaeList = Array.isArray(les?.bylaes) ? les.bylaes : (typeof les?.bylaes === 'string' ? (() => { try { const p = JSON.parse(les.bylaes); return Array.isArray(p) ? p : []; } catch { return []; } })() : []);
          return { ...les, bylaes: bylaeList };
        };
        const modulesWithLesse = await Promise.all(
          data.map(async (module) => {
            try {
              const { data: lesseData } = await supabase
                .from('lms_lesse')
                .select('*')
                .eq('module_id', module.id)
                .eq('is_aktief', true)
                .order('volgorde');
              const normalizedLesse = (lesseData || []).map(normalizeBylaes);
              return { ...module, lesse: normalizedLesse };
            } catch {
              return { ...module, lesse: [] };
            }
          })
        );
        setModules(modulesWithLesse);
        if (modulesWithLesse.length > 0) {
          setExpandedModules([modulesWithLesse[0].id]);
        }
      } else {
        setModules([]);
      }
    } catch (e) {
      console.log('Modules fetch error:', e);
      setModules([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const checkRegistration = async (kursusId: string) => {
    if (!currentUser) return;
    try {
      const { data } = await supabase
        .from('lms_registrasies')
        .select('*')
        .eq('gebruiker_id', currentUser.id)
        .eq('kursus_id', kursusId)
        .maybeSingle();
      setIsRegistered(!!data && data.betaling_status !== 'hangende');
    } catch (e) {
      console.log('Registration check skipped');
    }
  };

  const handleKursusClick = async (kursus: LMSKursus) => {
    setSelectedKursus(kursus);
    setModules([]);
    setIsRegistered(false);
    setIsPlaying(false);
    setCurrentLes(null);
    await fetchModules(kursus.id);
    if (currentUser) {
      await checkRegistration(kursus.id);
      await fetchKursusVordering(kursus.id);
    }
  };

  const handleBackToList = () => {
    setSelectedKursus(null);
    setModules([]);
    setIsPlaying(false);
    setCurrentLes(null);
    fetchMyRegistrasies();
    fetchMyVordering();
  };

  const handleBackToDetail = () => {
    setIsPlaying(false);
    setCurrentLes(null);
    // Refresh vordering when going back
    if (selectedKursus) {
      fetchKursusVordering(selectedKursus.id);
    }
    fetchMyVordering();
  };

  const handleStartKursus = () => {
    // Find the first incomplete lesson or the first lesson
    const allLesse = modules.flatMap(m => m.lesse || []);
    if (allLesse.length === 0) {
      toast({ title: 'Geen lesse', description: 'Hierdie kursus het nog geen lesse nie.', variant: 'destructive' });
      return;
    }

    // 1. Try to find the most recently accessed lesson
    if (kursusVordering.length > 0) {
      const sortedByAccess = [...kursusVordering]
        .filter(v => v.last_accessed_at)
        .sort((a, b) => new Date(b.last_accessed_at || 0).getTime() - new Date(a.last_accessed_at || 0).getTime());

      if (sortedByAccess.length > 0) {
        const lastAccessedLes = allLesse.find(l => l.id === sortedByAccess[0].les_id);
        if (lastAccessedLes) {
          setCurrentLes(lastAccessedLes);
          setIsPlaying(true);
          return;
        }
      }
    }

    // 2. If no history, find first incomplete lesson
    const completedLesIds = kursusVordering.filter(v => v.status === 'voltooi').map(v => v.les_id);
    const firstIncompleteLes = allLesse.find(les => !completedLesIds.includes(les.id));

    // 3. Fallback to first lesson
    const startLes = firstIncompleteLes || allLesse[0];

    setCurrentLes(startLes);
    setIsPlaying(true);
  };

  const handleLesClick = (les: LMSLes) => {
    if (isRegistered) {
      setCurrentLes(les);
      setIsPlaying(true);
    }
  };

  const handleLesChange = (les: LMSLes) => {
    setCurrentLes(les);
  };

  const handleVorderingUpdate = () => {
    if (selectedKursus) {
      fetchKursusVordering(selectedKursus.id);
    }
    fetchMyVordering();
  };

  const handleRegister = async () => {
    if (!currentUser || !selectedKursus) {
      toast({ title: 'Nie aangemeld', description: 'Jy moet aangemeld wees om te registreer.', variant: 'destructive' });
      return;
    }

    setRegistering(true);
    try {
      if (selectedKursus.is_gratis) {
        const { error } = await supabase
          .from('lms_registrasies')
          .upsert([{
            gebruiker_id: currentUser.id,
            kursus_id: selectedKursus.id,
            status: 'geregistreer',
            betaling_status: 'gratis',
            betaling_bedrag: 0,
            begin_datum: new Date().toISOString()
          }], { onConflict: 'kursus_id,gebruiker_id' });

        if (!error) {
          toast({ title: 'Suksesvol geregistreer!', description: 'Jy kan nou begin met die kursus.' });
          setIsRegistered(true);
          fetchMyRegistrasies();
        } else {
          if (error.code === '23505') {
            setIsRegistered(true);
            fetchMyRegistrasies();
            toast({ title: 'Reeds geregistreer', description: 'Jy is reeds vir hierdie kursus geregistreer.' });
          } else {
            toast({ title: 'Registrasie misluk', description: error.message, variant: 'destructive' });
          }
        }
      } else {
        // 1. Create or get pending registration (upsert handles duplicate)
        const { data: regData, error: regError } = await supabase
          .from('lms_registrasies')
          .upsert([{
            gebruiker_id: currentUser.id,
            kursus_id: selectedKursus.id,
            status: 'hangende',
            betaling_status: 'hangende',
            betaling_bedrag: selectedKursus.prys,
            begin_datum: new Date().toISOString()
          }], { onConflict: 'kursus_id,gebruiker_id' })
          .select()
          .single();

        if (regError) {
          throw new Error('Kon nie registrasie begin nie: ' + regError.message);
        }

        // 2. Initiate Yoco Checkout
        if (createYocoCheckout) {
          const result = await createYocoCheckout(selectedKursus.prys, {
            type: 'lms_kursus',
            kursus_id: selectedKursus.id,
            kursus_titel: selectedKursus.titel,
            gebruiker_id: currentUser.id,
            registrasie_id: regData.id
          });

          if (result.success && result.redirectUrl) {
            window.location.href = result.redirectUrl;
          } else {
            throw new Error(result.error || 'Kon nie betaling skep nie');
          }
        } else {
          throw new Error('Betaling funksie nie beskikbaar nie');
        }
      }
    } catch (e: any) {
      toast({ title: 'Registrasie misluk', description: e.message, variant: 'destructive' });
    } finally {
      setRegistering(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  // Filter courses
  const filteredKursusse = kursusse.filter(kursus => {
    const matchSearch = kursus.titel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (kursus.beskrywing || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategorie = selectedKategorie === 'alle' || kursus.kategorie === selectedKategorie;
    const matchVlak = selectedVlak === 'alle' || kursus.vlak === selectedVlak;
    return matchSearch && matchKategorie && matchVlak;
  });

  // My courses
  const myKursusse = kursusse.filter(k =>
    myRegistrasies.some(r => r.kursus_id === k.id && r.betaling_status !== 'hangende')
  );

  const getKursusProgress = (kursusId: string): number => {
    const kursusVord = myVordering.filter(v => v.kursus_id === kursusId && v.status === 'voltooi');
    // Get total lessons for this course
    const kursusModules = modules.filter(m => m.kursus_id === kursusId);
    const totalLesse = kursusModules.reduce((acc, m) => acc + (m.lesse?.length || 0), 0);
    if (totalLesse === 0) {
      return kursusVord.length > 0 ? Math.min(kursusVord.length * 10, 100) : 0;
    }
    return Math.round((kursusVord.length / totalLesse) * 100);
  };

  const getDetailKursusProgress = (): number => {
    const completedCount = kursusVordering.filter(v => v.status === 'voltooi').length;
    const totalLesse = modules.reduce((acc, m) => acc + (m.lesse?.length || 0), 0);
    if (totalLesse === 0) return 0;
    return Math.round((completedCount / totalLesse) * 100);
  };

  const checkIsRegistered = (kursusId: string): boolean => {
    return myRegistrasies.some(r => r.kursus_id === kursusId && r.betaling_status !== 'hangende');
  };

  const isLesVoltooi = (lesId: string): boolean => {
    return kursusVordering.some(v => v.les_id === lesId && v.status === 'voltooi');
  };

  const totalKursusse = myKursusse.length;
  const voltooideKursusse = myKursusse.filter(k => getKursusProgress(k.id) >= 100).length;
  const totalVordering = myVordering.filter(v => v.status === 'voltooi').length;
  const getTotaleLesse = () => modules.reduce((acc, m) => acc + (m.lesse?.length || 0), 0);

  // Normalize les.bylaes to always be an array (DB may return string/object)
  const normalizeLesBylaes = (les: LMSLes): LMSLes => {
    if (!les) return les;
    const bylaeList = Array.isArray(les.bylaes) ? les.bylaes : (typeof les.bylaes === 'string' ? (() => { try { const p = JSON.parse(les.bylaes as string); return Array.isArray(p) ? p : []; } catch { return []; } })() : []);
    return { ...les, bylaes: bylaeList };
  };

  // Course Player View
  if (isPlaying && selectedKursus && currentLes) {
    const safeLes = normalizeLesBylaes(currentLes);
    const safeModules = modules.map(m => ({
      ...m,
      lesse: (m.lesse || []).map(l => normalizeLesBylaes(l))
    }));
    return (
      <KursusSpeler
        kursus={selectedKursus}
        les={safeLes}
        modules={safeModules}
        vordering={kursusVordering}
        onBack={handleBackToDetail}
        onLesChange={handleLesChange}
        onVorderingUpdate={handleVorderingUpdate}
      />
    );
  }

  // Detail View
  if (selectedKursus) {
    const detailProgress = getDetailKursusProgress();
    const completedLesCount = kursusVordering.filter(v => v.status === 'voltooi').length;
    const totalLesCount = getTotaleLesse();

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBackToList} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToCourses}
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="h-48 bg-gradient-to-br from-[#002855] to-[#004895] relative overflow-hidden rounded-t-lg">
                {selectedKursus.foto_url ? (
                  <img src={selectedKursus.foto_url} alt={selectedKursus.titel} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-white/30" />
                  </div>
                )}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <Badge className={getVlakKleur(selectedKursus.vlak)}>{getVlakLabel(selectedKursus.vlak)}</Badge>
                  {selectedKursus.is_gratis && <Badge className="bg-green-500 text-white">{t.free}</Badge>}
                  {selectedKursus.is_vbo_geskik && (
                    <Badge className="bg-[#D4A84B] text-[#002855]">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      VBO {selectedKursus.vbo_krediete} {language === 'af' ? 'krediete' : 'credits'}
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-[#002855] mb-2">{selectedKursus.titel}</h1>
                <p className="text-gray-600 mb-4">{selectedKursus.beskrywing || 'Geen beskrywing beskikbaar nie.'}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuur(selectedKursus.duur_minute)}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {modules.length} Modules
                  </div>
                  <div className="flex items-center gap-1">
                    <BookMarked className="w-4 h-4" />
                    {totalLesCount} Lesse
                  </div>
                </div>

                {isRegistered && totalLesCount > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">{t.courseProgress}</span>
                      <span className="font-medium text-[#002855]">{completedLesCount} / {totalLesCount} {language === 'af' ? 'lesse voltooi' : 'lessons completed'}</span>
                    </div>
                    <Progress value={detailProgress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{detailProgress}% {t.completed}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#002855]" />
                  {t.courseContent}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {detailLoading ? (
                  <div className="p-6 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : modules.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Geen modules beskikbaar nie
                  </div>
                ) : (
                  <div className="divide-y">
                    {modules.map((module, idx) => (
                      <div key={module.id}>
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#002855]/10 flex items-center justify-center text-[#002855] font-semibold">
                              {idx + 1}
                            </div>
                            <div className="text-left">
                              <h4 className="font-medium text-[#002855]">{module.titel}</h4>
                              <p className="text-sm text-gray-500">{module.lesse?.length || 0} lesse</p>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedModules.includes(module.id) ? 'rotate-90' : ''}`} />
                        </button>

                        {expandedModules.includes(module.id) && module.lesse && module.lesse.length > 0 && (
                          <div className="bg-gray-50 divide-y divide-gray-100">
                            {module.lesse.map((les) => {
                              const lesVoltooi = isLesVoltooi(les.id);
                              return (
                                <button
                                  key={les.id}
                                  onClick={() => handleLesClick(les)}
                                  disabled={!isRegistered}
                                  className={`w-full p-4 pl-16 flex items-center justify-between text-left transition-colors ${isRegistered ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-not-allowed opacity-60'
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lesVoltooi
                                      ? 'bg-green-100 text-green-600'
                                      : 'bg-gray-200 text-gray-500'
                                      }`}>
                                      {lesVoltooi ? (
                                        <CheckCircle className="w-4 h-4" />
                                      ) : les.tipe === 'video' ? (
                                        <Play className="w-4 h-4" />
                                      ) : (
                                        <BookOpen className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div>
                                      <h5 className={`font-medium ${lesVoltooi ? 'text-green-700' : 'text-gray-700'}`}>
                                        {les.titel}
                                      </h5>
                                      <p className="text-xs text-gray-500">
                                        {les.tipe === 'video' ? 'Video' : les.tipe === 'toets' ? 'Toets' : 'Lees'} • {les.duur_minute} min
                                      </p>
                                    </div>
                                  </div>
                                  {isRegistered && (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                {isRegistered ? (
                  <>
                    <div className="flex items-center gap-2 text-green-600 mb-4">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{t.registered}</span>
                    </div>

                    {detailProgress >= 100 ? (
                      <div className="text-center mb-4">
                        <Trophy className="w-12 h-12 text-[#D4A84B] mx-auto mb-2" />
                        <p className="text-green-600 font-medium">{t.congratulations}</p>
                      </div>
                    ) : null}

                    <Button
                      onClick={handleStartKursus}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {detailProgress > 0 && detailProgress < 100 ? t.resumeCourse : detailProgress >= 100 ? (language === 'af' ? 'Kyk Weer' : 'Watch Again') : t.startCourse}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      {selectedKursus.is_gratis ? (
                        <div className="text-3xl font-bold text-green-600">Gratis</div>
                      ) : (
                        <div className="text-3xl font-bold text-[#002855]">R{formatPrys(selectedKursus.prys)}</div>
                      )}
                    </div>

                    <Button
                      className="w-full bg-[#D4A84B] hover:bg-[#C49A3B] text-white mb-3"
                      onClick={handleRegister}
                      disabled={registering}
                    >
                      {registering ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Besig...</>
                      ) : selectedKursus.is_gratis ? (
                        <><CheckCircle className="w-4 h-4 mr-2" />Registreer Gratis</>
                      ) : (
                        <>Koop Nou</>
                      )}
                    </Button>
                  </>
                )}

                <div className="border-t mt-6 pt-6 space-y-3">
                  <h4 className="font-medium text-gray-700">Hierdie kursus sluit in:</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#002855]" />
                      {formatDuur(selectedKursus.duur_minute)} se inhoud
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#002855]" />
                      {modules.length} modules
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-[#002855]" />
                      Video lesse met vordering stoor
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#002855]" />
                      Sertifikaat by voltooiing
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {

    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#002855] mx-auto mb-4" />
          <p className="text-gray-600">Laai kursusse...</p>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#002855] via-[#003d7a] to-[#004895]" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }} />
        </div>

        <div className="relative z-10 p-6 md:p-10 lg:p-12">
          <div className="max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <Badge className="bg-[#D4A84B] text-[#002855]">
                <GraduationCap className="w-3 h-3 mr-1" />
                {t.title}
              </Badge>
              <div className="flex bg-white/20 rounded-lg p-1 backdrop-blur-sm">
                <Button
                  size="sm"
                  onClick={() => setLanguage('af')}
                  variant={language === 'af' ? 'default' : 'ghost'}
                  className={`h-8 px-4 ${language === 'af' ? 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3f]' : 'text-white hover:text-white hover:bg-white/10'}`}
                >
                  Afrikaans
                </Button>
                <Button
                  size="sm"
                  onClick={() => setLanguage('en')}
                  variant={language === 'en' ? 'default' : 'ghost'}
                  className={`h-8 px-4 ${language === 'en' ? 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3f]' : 'text-white hover:text-white hover:bg-white/10'}`}
                >
                  English
                </Button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              {t.title}
            </h1>
            <p className="text-base md:text-lg text-white/90 mb-6 max-w-2xl">
              {t.subtitle}
            </p>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{kursusse.length}</div>
                <div className="text-xs md:text-sm text-white/70">Kursusse</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#D4A84B]">{totalKursusse}</div>
                <div className="text-xs md:text-sm text-white/70">My Kursusse</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-400">{voltooideKursusse}</div>
                <div className="text-xs md:text-sm text-white/70">Voltooi</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {currentUser && myKursusse.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[#002855]/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#002855]/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-[#002855]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#002855]">{totalKursusse}</div>
                <div className="text-sm text-gray-500">{t.registeredCourses}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#D4A84B]/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4A84B]/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-[#D4A84B]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#D4A84B]">{totalVordering}</div>
                <div className="text-sm text-gray-500">{t.lessonsCompleted}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{voltooideKursusse}</div>
                <div className="text-sm text-gray-500">{t.coursesCompleted}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{voltooideKursusse}</div>
                <div className="text-sm text-gray-500">{t.certificates}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="ontdek" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'af' ? 'Ontdek' : 'Discover'}</span>
            </TabsTrigger>
            <TabsTrigger value="my-kursusse" className="flex items-center gap-2">
              <BookMarked className="w-4 h-4" />
              <span className="hidden sm:inline">{t.myProgress}</span>
              {myKursusse.length > 0 && (
                <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">{myKursusse.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sertifikate" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'af' ? 'Sertifikate' : 'Certificates'}</span>
            </TabsTrigger>
          </TabsList>
        </div>


        <TabsContent value="ontdek" className="space-y-6">
          {/* Search */}
          <Card className="border-[#002855]/10">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={selectedKategorie} onValueChange={setSelectedKategorie}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder={t.filterCategory} />
                    </SelectTrigger>
                    <SelectContent>
                      {kategorieë.map(k => (
                        <SelectItem key={k.value} value={k.value}>
                          {k.value === 'alle' ? t.allCategories : k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedVlak} onValueChange={setSelectedVlak}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Vlak" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Vlakke</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediêr">Intermediêr</SelectItem>
                      <SelectItem value="gevorderd">Gevorderd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Grid */}
          {filteredKursusse.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchQuery || selectedKategorie !== 'alle' || selectedVlak !== 'alle'
                    ? 'Geen kursusse gevind nie'
                    : 'Geen kursusse beskikbaar nie'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery || selectedKategorie !== 'alle' || selectedVlak !== 'alle'
                    ? 'Probeer ander soekterme of filters.'
                    : 'Kursusse sal binnekort bygevoeg word.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredKursusse.map((kursus) => (
                <Card
                  key={kursus.id}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-[#002855]/10"
                  onClick={() => handleKursusClick(kursus)}
                >
                  <div className="h-40 bg-gradient-to-br from-[#002855] to-[#004895] relative overflow-hidden">
                    {kursus.foto_url ? (
                      <img
                        src={kursus.foto_url}
                        alt={kursus.titel}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white/20" />
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                      <Badge className={getVlakKleur(kursus.vlak)}>
                        {getVlakLabel(kursus.vlak)}
                      </Badge>
                      {kursus.is_gratis && (
                        <Badge className="bg-green-500 text-white">Gratis</Badge>
                      )}
                    </div>

                    {kursus.is_vbo_geskik && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-[#D4A84B] text-[#002855]">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          VBO
                        </Badge>
                      </div>
                    )}

                    {checkIsRegistered(kursus.id) && (
                      <div className="absolute bottom-3 right-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-[#002855] line-clamp-2 group-hover:text-[#D4A84B] transition-colors mb-2">
                      {kursus.titel}
                    </h3>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {kursus.kort_beskrywing || kursus.beskrywing || 'Geen beskrywing'}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatDuur(kursus.duur_minute)}
                      </span>
                      {!kursus.is_gratis && (
                        <span className="font-bold text-[#002855]">
                          R{formatPrys(kursus.prys)}
                        </span>
                      )}
                    </div>


                    {checkIsRegistered(kursus.id) && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Vordering</span>
                          <span>{getKursusProgress(kursus.id)}%</span>
                        </div>
                        <Progress value={getKursusProgress(kursus.id)} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-kursusse" className="space-y-6">
          {!currentUser ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Meld aan om jou kursusse te sien
                </h3>
                <p className="text-gray-500">
                  Jy moet aangemeld wees om jou geregistreerde kursusse te sien.
                </p>
              </CardContent>
            </Card>
          ) : myKursusse.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <BookMarked className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Geen kursusse nog nie
                </h3>
                <p className="text-gray-500 mb-4">
                  Jy het nog nie vir enige kursusse geregistreer nie.
                </p>
                <Button
                  onClick={() => setActiveTab('ontdek')}
                  className="bg-[#002855]"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Ontdek Kursusse
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myKursusse.map((kursus) => (
                <Card
                  key={kursus.id}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleKursusClick(kursus)}
                >
                  <div className="h-32 bg-gradient-to-br from-[#002855] to-[#004895] relative">
                    {kursus.foto_url ? (
                      <img src={kursus.foto_url} alt={kursus.titel} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    {getKursusProgress(kursus.id) >= 100 && (
                      <div className="absolute top-2 right-2">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-[#002855] truncate mb-1">{kursus.titel}</h4>
                    <p className="text-sm text-gray-500 mb-3">{formatDuur(kursus.duur_minute)}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={getKursusProgress(kursus.id)} className="h-2 flex-1" />
                      <span className="text-xs text-gray-500">{getKursusProgress(kursus.id)}%</span>
                    </div>
                    <Button size="sm" className="w-full mt-3 bg-[#002855]">
                      {getKursusProgress(kursus.id) > 0 ? 'Gaan Voort' : 'Begin Kursus'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sertifikate" className="space-y-6">
          <MySertifikate onViewCourse={(kursusId) => {
            const kursus = kursusse.find(k => k.id === kursusId);
            if (kursus) {
              handleKursusClick(kursus);
            }
          }} />
        </TabsContent>
      </Tabs>



      {/* Categories */}
      {activeTab === 'ontdek' && (
        <Card className="border-[#002855]/10">
          <CardHeader>
            <CardTitle className="text-[#002855] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4A84B]" />
              Kategorieë
            </CardTitle>
            <CardDescription>Blaai deur kursusse per kategorie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {kategorieë.filter(k => k.value !== 'alle').map((kategorie) => {
                const count = kursusse.filter(k => k.kategorie === kategorie.value).length;
                return (
                  <button
                    key={kategorie.value}
                    onClick={() => {
                      setSelectedKategorie(kategorie.value);
                      setActiveTab('ontdek');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${selectedKategorie === kategorie.value
                      ? 'border-[#D4A84B] bg-[#D4A84B]/5'
                      : 'border-gray-200 hover:border-[#002855]/30'
                      }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#002855]/10 flex items-center justify-center text-[#002855] mb-3">
                      {getKategorieIkoon(kategorie.value)}
                    </div>
                    <h4 className="font-medium text-[#002855] text-sm truncate">{kategorie.label}</h4>
                    <p className="text-xs text-gray-500">{count} kursusse</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card className="border-[#8B7CB3]/30 bg-gradient-to-br from-[#8B7CB3]/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#8B7CB3]/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-8 h-8 text-[#8B7CB3]" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-semibold text-[#002855] mb-1">Hulp Nodig?</h3>
              <p className="text-sm text-gray-600">
                Kontak ons as jy enige vrae het oor die kursusse of tegniese probleme ondervind.
              </p>
            </div>
            <Button variant="outline" className="border-[#8B7CB3] text-[#8B7CB3] hover:bg-[#8B7CB3]/10">
              Kontak Ondersteuning
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Wrapped component with error boundary
const Geloofsgroei: React.FC = () => {
  return (
    <GeloofsgroeiErrorBoundary>
      <GeloofsgroeiContent />
    </GeloofsgroeiErrorBoundary>
  );
};

export default Geloofsgroei;
