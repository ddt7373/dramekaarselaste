import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  Play,
  FileText,
  ClipboardCheck,
  Award,
  Lock,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Loader2,
  AlertCircle
} from 'lucide-react';

import { LMSKursus, LMSModule, LMSLes, LMSRegistrasie, LMSVordering } from '@/types/nhka';

// Helper functions

// Helper functions
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
  return `${ure} uur ${oorblywende} min`;
};

const getLesTipeLabel = (tipe: string): string => {
  const labels: Record<string, string> = {
    'video': 'Video',
    'teks': 'Lees',
    'toets': 'Toets',
    'eksamen': 'Eksamen'
  };
  return labels[tipe] || tipe || 'Lees';
};

interface KursusDetailProps {
  kursus: LMSKursus;
  onBack: () => void;
  registrasie?: LMSRegistrasie;
  onStartLes?: (les: LMSLes, modules: LMSModule[], vordering: LMSVordering[]) => void;
}

const KursusDetail: React.FC<KursusDetailProps> = ({ kursus, onBack, registrasie: initialRegistrasie, onStartLes }) => {
  const { currentUser, createYocoCheckout } = useNHKA();
  const { toast } = useToast();
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [vordering, setVordering] = useState<LMSVordering[]>([]);
  const [registrasie, setRegistrasie] = useState<LMSRegistrasie | undefined>(initialRegistrasie);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  const isRegistered = registrasie && registrasie.betaling_status !== 'hangende';
  const canAccess = kursus.is_gratis || isRegistered;


  useEffect(() => {
    fetchModules();
    if (currentUser) {
      fetchVordering();
      fetchRegistrasie();
    }
  }, [kursus.id, currentUser]);

  const fetchModules = async () => {
    try {
      setDbError(null);
      const { data: modulesData, error } = await supabase
        .from('lms_modules')
        .select('*')
        .eq('kursus_id', kursus.id)
        .eq('is_aktief', true)
        .order('volgorde');

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setDbError('Die LMS modules tabel bestaan nog nie.');
          setModules([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      if (modulesData) {
        // Fetch lessons for each module
        const modulesWithLesse = await Promise.all(
          modulesData.map(async (module) => {
            try {
              const { data: lesseData, error: lesseError } = await supabase
                .from('lms_lesse')
                .select('*')
                .eq('module_id', module.id)
                .eq('is_aktief', true)
                .order('volgorde');

              if (lesseError && lesseError.code === '42P01') {
                return { ...module, lesse: [] };
              }

              return { ...module, lesse: lesseData || [] };
            } catch (e) {
              return { ...module, lesse: [] };
            }
          })
        );
        setModules(modulesWithLesse);
        // Expand first module by default
        if (modulesWithLesse.length > 0) {
          setExpandedModules([modulesWithLesse[0].id]);
        }
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      setDbError('Kon nie modules laai nie.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVordering = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('lms_vordering')
        .select('*')
        .eq('gebruiker_id', currentUser.id)
        .eq('kursus_id', kursus.id);

      if (!error && data) {
        setVordering(data);
      }
    } catch (e) {
      console.log('Could not fetch progress:', e);
    }
  };

  const fetchRegistrasie = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('lms_registrasies')
        .select('*')
        .eq('gebruiker_id', currentUser.id)
        .eq('kursus_id', kursus.id)
        .single();

      if (!error && data) {
        setRegistrasie(data);
      }
    } catch (e) {
      console.log('Could not fetch registration:', e);
    }
  };

  const handleRegister = async () => {
    if (!currentUser) {
      toast({
        title: 'Nie aangemeld',
        description: 'Jy moet aangemeld wees om te registreer.',
        variant: 'destructive'
      });
      return;
    }

    setRegistering(true);

    try {
      // 1. Check if ALREADY registered (to avoid duplicate key error)
      const { data: existingReg } = await supabase
        .from('lms_registrasies')
        .select('*')
        .eq('gebruiker_id', currentUser.id)
        .eq('kursus_id', kursus.id)
        .maybeSingle();

      if (existingReg) {
        // Already exists, just update state and notify
        setRegistrasie(existingReg);

        if (existingReg.betaling_status === 'betaal' || existingReg.betaling_status === 'gratis') {
          toast({
            title: 'Reeds geregistreer',
            description: 'Jy is reeds geregistreer vir hierdie kursus.',
          });
          return;
        }

        // If pending payment, proceed to checkout logic (if paid course)
        if (!kursus.is_gratis && existingReg.betaling_status === 'hangende') {
          // Continue to checkout logic below...
          console.log('Resuming pending registration checkout...');
        } else {
          // Should not happen for free courses if status is not gratis/betaal
          return;
        }
      }

      if (kursus.is_gratis) {
        // Free course - register directly if not exists
        if (!existingReg) {
          const { error } = await supabase
            .from('lms_registrasies')
            .insert([{
              gebruiker_id: currentUser.id,
              kursus_id: kursus.id,
              status: 'geregistreer',
              betaling_status: 'gratis',
              betaling_bedrag: 0,
              begin_datum: new Date().toISOString()
            }]);

          if (error) throw error;
        }

        toast({
          title: 'Suksesvol geregistreer!',
          description: 'Jy kan nou begin met die kursus.',
        });

        await fetchRegistrasie();
      } else {
        // Paid course - create Yoco checkout

        let regId = existingReg?.id;

        // 1. Create registration if it doesn't exist
        if (!existingReg) {
          const { data: regData, error: regError } = await supabase
            .from('lms_registrasies')
            .insert([{
              gebruiker_id: currentUser.id,
              kursus_id: kursus.id,
              status: 'hangende',
              betaling_status: 'hangende',
              betaling_bedrag: kursus.prys,
              begin_datum: new Date().toISOString()
            }])
            .select()
            .single();

          if (regError) throw new Error('Kon nie registrasie begin nie: ' + regError.message);
          regId = regData.id;
        }

        // 2. Initiate Yoco Checkout
        const result = await createYocoCheckout(kursus.prys, {
          type: 'lms_kursus',
          kursus_id: kursus.id,
          kursus_titel: kursus.titel,
          gebruiker_id: currentUser.id,
          registrasie_id: regId
        });

        if (result.success && result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          throw new Error(result.error || 'Kon nie betaling skep nie');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registrasie misluk',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRegistering(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getLesVordering = (lesId: string) => {
    return vordering.find(v => v.les_id === lesId);
  };

  const getTotaleLesse = () => {
    return modules.reduce((acc, m) => acc + (m.lesse?.length || 0), 0);
  };

  const getVoltooideeLesse = () => {
    return vordering.filter(v => v.status === 'voltooi').length;
  };

  const getVorderingPersentasie = () => {
    const totaal = getTotaleLesse();
    if (totaal === 0) return 0;
    return Math.round((getVoltooideeLesse() / totaal) * 100);
  };

  const getLesIcon = (tipe: string) => {
    switch (tipe) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'teks': return <FileText className="w-4 h-4" />;
      case 'toets': return <ClipboardCheck className="w-4 h-4" />;
      case 'eksamen': return <Award className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleStartCourse = () => {
    if (!canAccess) return;

    // Find first incomplete lesson or first lesson
    const allLesse = modules.flatMap(m => m.lesse || []);
    const incompleteLes = allLesse.find(les => {
      const lesVord = vordering.find(v => v.les_id === les.id);
      return !lesVord || lesVord.status !== 'voltooi';
    });

    const lessonToStart = incompleteLes || allLesse[0];
    if (lessonToStart && onStartLes) {
      onStartLes(lessonToStart, modules, vordering);
    }
  };

  const handleLesClick = (les: LMSLes) => {
    if (!canAccess) return;
    if (onStartLes) {
      onStartLes(les, modules, vordering);
    }
  };


  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Terug na Kursusse
      </Button>

      {/* Course Header */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Course Info Card */}
          <Card>
            <div className="h-48 bg-gradient-to-br from-[#002855] to-[#004895] relative overflow-hidden rounded-t-lg">
              {kursus.foto_url ? (
                <img src={kursus.foto_url} alt={kursus.titel} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-white/30" />
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Badge className={getVlakKleur(kursus.vlak)}>
                  {getVlakLabel(kursus.vlak)}
                </Badge>
                {kursus.is_gratis && (
                  <Badge className="bg-green-500 text-white">Gratis</Badge>
                )}
              </div>
            </div>

            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-[#002855] mb-2">{kursus.titel}</h1>
              <p className="text-gray-600 mb-4">{kursus.beskrywing}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuur(kursus.duur_minute)}
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {modules.length} Modules
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {getTotaleLesse()} Lesse
                </div>
              </div>

              {/* What you'll learn */}
              {kursus.wat_jy_sal_leer && kursus.wat_jy_sal_leer.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-[#002855] mb-3">Wat jy sal leer:</h3>
                  <div className="grid md:grid-cols-2 gap-2">
                    {kursus.wat_jy_sal_leer.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#002855]" />
                Kursus Inhoud
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </div>
              ) : dbError ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                  <p className="text-gray-500">{dbError}</p>
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
                            <p className="text-sm text-gray-500">
                              {module.lesse?.length || 0} lesse
                            </p>
                          </div>
                        </div>
                        {expandedModules.includes(module.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {expandedModules.includes(module.id) && module.lesse && (
                        <div className="bg-gray-50 divide-y divide-gray-100">
                          {module.lesse.map((les) => {
                            const lesVordering = getLesVordering(les.id);
                            const isVoltooi = lesVordering?.status === 'voltooi';
                            const isLocked = !canAccess;

                            return (
                              <button
                                key={les.id}
                                onClick={() => !isLocked && handleLesClick(les)}
                                disabled={isLocked}
                                className={`w-full p-4 pl-16 flex items-center justify-between text-left transition-colors ${isLocked
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-gray-100 cursor-pointer'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isVoltooi
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {isLocked ? (
                                      <Lock className="w-4 h-4" />
                                    ) : isVoltooi ? (
                                      <CheckCircle className="w-4 h-4" />
                                    ) : (
                                      getLesIcon(les.tipe)
                                    )}
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-700">{les.titel}</h5>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>{getLesTipeLabel(les.tipe)}</span>
                                      <span>•</span>
                                      <span>{les.duur_minute} min</span>
                                    </div>
                                  </div>
                                </div>
                                {!isLocked && (
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Card */}
          <Card className="sticky top-6">
            <CardContent className="p-6">
              {isRegistered ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Geregistreer</span>
                  </div>

                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Jou vordering</span>
                      <span className="font-medium">{getVorderingPersentasie()}%</span>
                    </div>
                    <Progress value={getVorderingPersentasie()} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {getVoltooideeLesse()} van {getTotaleLesse()} lesse voltooi
                    </p>
                  </div>

                  <Button
                    className="w-full bg-[#002855]"
                    onClick={handleStartCourse}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {getVoltooideeLesse() > 0 ? 'Gaan Voort' : 'Begin Kursus'}
                  </Button>
                </>
              ) : (

                <>
                  <div className="text-center mb-6">
                    {kursus.is_gratis ? (
                      <div className="text-3xl font-bold text-green-600">Gratis</div>
                    ) : (
                      <div className="text-3xl font-bold text-[#002855]">
                        R{(kursus.prys || 0).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-[#D4A84B] hover:bg-[#C49A3B] text-white mb-3"
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Besig...
                      </>
                    ) : kursus.is_gratis ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Registreer Gratis
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Koop Nou
                      </>
                    )}
                  </Button>

                  {!kursus.is_gratis && (
                    <p className="text-xs text-center text-gray-500">
                      Veilige betaling via Yoco
                    </p>
                  )}
                </>
              )}

              <Separator className="my-6" />

              {/* Course includes */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Hierdie kursus sluit in:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#002855]" />
                    {formatDuur(kursus.duur_minute)} se inhoud
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#002855]" />
                    {modules.length} modules
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#002855]" />
                    {getTotaleLesse()} lesse
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#002855]" />
                    Sertifikaat by voltooiing
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#002855]" />
                    Lewenslange toegang
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KursusDetail;
