import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Users,
  TrendingUp,
  CreditCard,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Loader2,
  BarChart3,
  Activity,
  Target,
  Percent,
  DollarSign,
  AlertCircle,
  Database
} from 'lucide-react';

// Local type definitions to avoid import issues
interface LMSKursus {
  id: string;
  titel: string;
  beskrywing?: string;
  kategorie: string;
  vlak: string;
  prys: number;
  is_gratis: boolean;
  duur_minute: number;
  is_gepubliseer: boolean;
  is_aktief: boolean;
}

// Helper function
const getVlakLabel = (vlak: string): string => {
  const labels: Record<string, string> = {
    'beginner': 'Beginner',
    'intermediêr': 'Intermediêr',
    'gevorderd': 'Gevorderd'
  };
  return labels[vlak] || vlak || 'Beginner';
};

interface KursusStats {
  kursus_id: string;
  kursus_titel: string;
  kategorie: string;
  vlak: string;
  prys: number;
  is_gratis: boolean;
  totale_registrasies: number;
  aktiewe_studente: number;
  voltooide_studente: number;
  voltooiingskoers: number;
  gemiddelde_toets_telling: number;
  totale_inkomste: number;
}

interface KategorieStats {
  kategorie: string;
  registrasies: number;
  inkomste: number;
}

const LMSStatistieke: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [kursusse, setKursusse] = useState<LMSKursus[]>([]);
  const [kursusStats, setKursusStats] = useState<KursusStats[]>([]);
  const [kategorieStats, setKategorieStats] = useState<KategorieStats[]>([]);
  const [activeTab, setActiveTab] = useState('oorsig');

  // Totale statistieke
  const [totaleStats, setTotaleStats] = useState({
    totaleKursusse: 0,
    totaleRegistrasies: 0,
    aktieweStudente: 0,
    voltooideStudente: 0,
    gemiddeldeVoltooiingskoers: 0,
    gemiddeldeToetsTelling: 0,
    totaleInkomste: 0,
    gratisRegistrasies: 0,
    betaaldeRegistrasies: 0
  });

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      setDbError(null);

      // Fetch all courses
      const { data: kursusseData, error: kursusseError } = await supabase
        .from('lms_kursusse')
        .select('*')
        .order('titel');

      if (kursusseError) {
        if (kursusseError.code === '42P01' || kursusseError.message?.includes('does not exist') || kursusseError.message?.includes('relation')) {
          setDbError('Die LMS databasis tabelle is nog nie opgestel nie.');
          setLoading(false);
          return;
        }
        throw kursusseError;
      }

      if (kursusseData) {
        setKursusse(kursusseData);
      }

      // Fetch all registrations
      let registrasiesData: any[] = [];
      try {
        const { data, error } = await supabase
          .from('lms_registrasies')
          .select('*');
        if (!error && data) {
          registrasiesData = data;
        }
      } catch (e) {
        console.log('Could not fetch registrations:', e);
      }
      // Fetch all progress records
      let vorderingData: any[] = [];
      try {
        const { data, error } = await supabase
          .from('lms_vordering')
          .select('*');
        if (!error && data) {
          vorderingData = data;
        }
      } catch (e) {
        console.log('Could not fetch progress:', e);
      }


      // Process stats per course
      const statsPerKursus: KursusStats[] = [];
      const kategorieMap = new Map<string, { registrasies: number; inkomste: number }>();

      let totaalRegistrasies = 0;
      let totaalAktief = 0;
      let totaalVoltooi = 0;
      let totaalInkomste = 0;
      let totaalGratis = 0;
      let totaalBetaald = 0;
      let somToetsTellings = 0;
      let aantalToetse = 0;

      if (kursusseData) {
        for (const kursus of kursusseData) {
          const kursusRegistrasies = registrasiesData.filter(
            r => r.kursus_id === kursus.id && r.betaling_status !== 'hangende'
          );

          const aktieweStudente = kursusRegistrasies.filter(r => r.status === 'in_proses').length;
          const voltooideStudente = kursusRegistrasies.filter(r => r.status === 'voltooi').length;
          const totaleReg = kursusRegistrasies.length;

          // Calculate income
          const inkomste = kursusRegistrasies
            .filter(r => r.betaling_status === 'betaal')
            .reduce((sum, r) => sum + (r.betaling_bedrag || 0), 0);

          // Calculate average test score for this course
          const kursusVordering = vorderingData.filter(
            v => v.kursus_id === kursus.id && v.toets_telling !== null
          );
          
          let gemToets = 0;
          if (kursusVordering.length > 0) {
            const totaalTelling = kursusVordering.reduce((sum, v) => {
              if (v.toets_telling !== null && v.toets_maksimum) {
                return sum + (v.toets_telling / v.toets_maksimum) * 100;
              }
              return sum;
            }, 0);
            gemToets = totaalTelling / kursusVordering.length;
            somToetsTellings += totaalTelling;
            aantalToetse += kursusVordering.length;
          }

          statsPerKursus.push({
            kursus_id: kursus.id,
            kursus_titel: kursus.titel || 'Onbekend',
            kategorie: kursus.kategorie || 'Algemeen',
            vlak: kursus.vlak || 'beginner',
            prys: kursus.prys || 0,
            is_gratis: kursus.is_gratis ?? true,
            totale_registrasies: totaleReg,
            aktiewe_studente: aktieweStudente,
            voltooide_studente: voltooideStudente,
            voltooiingskoers: totaleReg > 0 ? (voltooideStudente / totaleReg) * 100 : 0,
            gemiddelde_toets_telling: gemToets,
            totale_inkomste: inkomste
          });

          // Update totals
          totaalRegistrasies += totaleReg;
          totaalAktief += aktieweStudente;
          totaalVoltooi += voltooideStudente;
          totaalInkomste += inkomste;
          
          if (kursus.is_gratis) {
            totaalGratis += totaleReg;
          } else {
            totaalBetaald += totaleReg;
          }

          // Category stats
          const katKey = kursus.kategorie || 'Algemeen';
          const existing = kategorieMap.get(katKey);
          if (existing) {
            existing.registrasies += totaleReg;
            existing.inkomste += inkomste;
          } else {
            kategorieMap.set(katKey, {
              registrasies: totaleReg,
              inkomste: inkomste
            });
          }
        }
      }

      setKursusStats(statsPerKursus);

      // Convert category map to array
      const katStats: KategorieStats[] = [];
      kategorieMap.forEach((value, key) => {
        katStats.push({
          kategorie: key,
          registrasies: value.registrasies,
          inkomste: value.inkomste
        });
      });
      setKategorieStats(katStats);

      // Set total stats
      setTotaleStats({
        totaleKursusse: kursusseData?.length || 0,
        totaleRegistrasies: totaalRegistrasies,
        aktieweStudente: totaalAktief,
        voltooideStudente: totaalVoltooi,
        gemiddeldeVoltooiingskoers: totaalRegistrasies > 0 ? (totaalVoltooi / totaalRegistrasies) * 100 : 0,
        gemiddeldeToetsTelling: aantalToetse > 0 ? somToetsTellings / aantalToetse : 0,
        totaleInkomste: totaalInkomste,
        gratisRegistrasies: totaalGratis,
        betaaldeRegistrasies: totaalBetaald
      });

    } catch (error) {
      console.error('Error fetching LMS stats:', error);
      setDbError('Kon nie LMS statistieke laai nie. Probeer later weer.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#D4A84B] animate-spin" />
      </div>
    );
  }

  if (dbError) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-8 text-center">
          <Database className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">LMS Statistieke Nie Beskikbaar</h3>
          <p className="text-orange-700 mb-4">{dbError}</p>
          <Button onClick={fetchAllStats} className="bg-orange-500 hover:bg-orange-600">
            Probeer Weer
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for display
  const topKursusse = [...kursusStats]
    .sort((a, b) => b.totale_registrasies - a.totale_registrasies)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#D4A84B]/20 rounded-xl">
          <BarChart3 className="w-6 h-6 text-[#D4A84B]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#002855]">LMS Statistieke</h2>
          <p className="text-gray-500">Geloofsgroei Leerplatform Prestasie</p>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#002855]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#002855]/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-[#002855]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#002855]">{totaleStats.totaleKursusse}</p>
                <p className="text-xs text-gray-500">Totale Kursusse</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#7A8450]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#7A8450]/10 rounded-lg">
                <Users className="w-5 h-5 text-[#7A8450]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#7A8450]">{totaleStats.totaleRegistrasies}</p>
                <p className="text-xs text-gray-500">Totale Registrasies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#8B7CB3]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#8B7CB3]/10 rounded-lg">
                <Award className="w-5 h-5 text-[#8B7CB3]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#8B7CB3]">{totaleStats.voltooideStudente}</p>
                <p className="text-xs text-gray-500">Voltooide Kursusse</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#D4A84B]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4A84B]/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-[#D4A84B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#D4A84B]">R{totaleStats.totaleInkomste.toFixed(0)}</p>
                <p className="text-xs text-gray-500">Totale Inkomste</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#002855]" />
              <span className="text-sm text-gray-500">Voltooiingskoers</span>
            </div>
            <p className="text-xl font-bold text-[#002855]">
              {totaleStats.gemiddeldeVoltooiingskoers.toFixed(1)}%
            </p>
            <Progress 
              value={totaleStats.gemiddeldeVoltooiingskoers} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-[#7A8450]" />
              <span className="text-sm text-gray-500">Gem. Toets Telling</span>
            </div>
            <p className="text-xl font-bold text-[#7A8450]">
              {totaleStats.gemiddeldeToetsTelling.toFixed(1)}%
            </p>
            <Progress 
              value={totaleStats.gemiddeldeToetsTelling} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-[#8B7CB3]" />
              <span className="text-sm text-gray-500">Aktiewe Studente</span>
            </div>
            <p className="text-xl font-bold text-[#8B7CB3]">{totaleStats.aktieweStudente}</p>
            <p className="text-xs text-gray-400 mt-1">Tans besig met kursusse</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#D4A84B]" />
              <span className="text-sm text-gray-500">Gratis vs Betaald</span>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-green-100 text-green-700">
                {totaleStats.gratisRegistrasies} Gratis
              </Badge>
              <Badge className="bg-blue-100 text-blue-700">
                {totaleStats.betaaldeRegistrasies} Betaald
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="oorsig" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Oorsig</span>
          </TabsTrigger>
          <TabsTrigger value="kursusse" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Per Kursus</span>
          </TabsTrigger>
        </TabsList>

        {/* Oorsig Tab */}
        <TabsContent value="oorsig" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Courses by Registration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#002855] flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Kursusse per Registrasies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topKursusse.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Geen data beskikbaar nie</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topKursusse.map((kursus, idx) => (
                      <div key={kursus.kursus_id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#002855]/10 flex items-center justify-center text-[#002855] font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{kursus.kursus_titel}</p>
                          <p className="text-xs text-gray-500">{kursus.kategorie}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#002855]">{kursus.totale_registrasies}</p>
                          <p className="text-xs text-gray-500">registrasies</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#002855] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Registrasies per Kategorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kategorieStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Geen data beskikbaar nie</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kategorieStats.map((kat) => {
                      const maxReg = Math.max(...kategorieStats.map(k => k.registrasies), 1);
                      return (
                        <div key={kat.kategorie} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">{kat.kategorie}</span>
                            <span className="text-gray-500">{kat.registrasies} registrasies</span>
                          </div>
                          <Progress 
                            value={(kat.registrasies / maxReg) * 100} 
                            className="h-2" 
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Per Kursus Tab */}
        <TabsContent value="kursusse" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#002855]">Gedetailleerde Kursus Statistieke</CardTitle>
            </CardHeader>
            <CardContent>
              {kursusStats.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Geen kursusse gevind nie</p>
                  <p className="text-sm">Skep eers kursusse in die LMS Kursus Bestuur afdeling</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kursus</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kategorie</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vlak</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Registrasies</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aktief</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Voltooi</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Voltooiingskoers</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Inkomste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {kursusStats.map(stat => (
                        <tr key={stat.kursus_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[#002855]" />
                              <span className="font-medium text-gray-900 truncate max-w-[200px]">
                                {stat.kursus_titel}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {stat.kategorie}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={
                              stat.vlak === 'beginner' ? 'bg-green-100 text-green-700' :
                              stat.vlak === 'intermediêr' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {getVlakLabel(stat.vlak)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-[#002855]">
                            {stat.totale_registrasies}
                          </td>
                          <td className="px-4 py-3 text-center text-[#8B7CB3]">
                            {stat.aktiewe_studente}
                          </td>
                          <td className="px-4 py-3 text-center text-[#7A8450]">
                            {stat.voltooide_studente}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={stat.voltooiingskoers} 
                                className="h-2 flex-1" 
                              />
                              <span className="text-xs font-medium text-gray-600 w-12 text-right">
                                {stat.voltooiingskoers.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {stat.is_gratis ? (
                              <Badge className="bg-green-100 text-green-700">Gratis</Badge>
                            ) : (
                              <span className="font-bold text-[#D4A84B]">
                                R{stat.totale_inkomste.toFixed(0)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LMSStatistieke;
