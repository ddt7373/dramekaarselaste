import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { useOffline } from '@/contexts/OfflineContext';
import { supabase } from '@/lib/supabase';
import { isLeier, isAdmin, getRolLabel, getKrisisStatusLabel, getProgramTipeLabel, Dagstukkie, isRestrictedLeader, getOuderdom, getLidmaatDisplayNaam } from '@/types/nhka';
import {
  Users,
  Heart,
  AlertTriangle,
  Calendar,
  HelpCircle,
  TrendingUp,
  Clock,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Cake,
  Copy,
  Check,
  WifiOff,
  CloudOff,
  RefreshCw
} from 'lucide-react';

// WhatsApp SVG Icon Component
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// Helper to get upcoming birthdays
const getUpcomingBirthdays = (members: any[], days: number = 7) => {
  const today = new Date();
  return members.filter(m => {
    if (!m.geboortedatum) return false;
    const bday = new Date(m.geboortedatum);
    const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (thisYearBday < today) {
      thisYearBday.setFullYear(today.getFullYear() + 1);
    }
    const diffDays = Math.ceil((thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= days;
  }).sort((a, b) => {
    const aDate = new Date(a.geboortedatum!);
    const bDate = new Date(b.geboortedatum!);
    const aThisYear = new Date(today.getFullYear(), aDate.getMonth(), aDate.getDate());
    const bThisYear = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
    if (aThisYear < today) aThisYear.setFullYear(today.getFullYear() + 1);
    if (bThisYear < today) bThisYear.setFullYear(today.getFullYear() + 1);
    return aThisYear.getTime() - bThisYear.getTime();
  });
};

const getDaysUntilBirthday = (geboortedatum: string): number => {
  const today = new Date();
  const bday = new Date(geboortedatum);
  const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (thisYearBday < today) {
    thisYearBday.setFullYear(today.getFullYear() + 1);
  }
  return Math.ceil((thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatPhoneForWhatsApp = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '27' + cleaned.substring(1);
  }
  return cleaned;
};

const Dashboard: React.FC = () => {
  const {
    currentUser,
    gebruikers,
    wyke,
    aksies,
    krisisse,
    vrae,
    program,
    currentGemeente,
    setCurrentView
  } = useNHKA();

  const { isOnline, pendingCount, syncNow, cacheDagstukkies } = useOffline();

  const [dagstukkies, setDagstukkies] = useState<Dagstukkie[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (currentGemeente) {
      fetchLatestDagstukkies();
    }
  }, [currentGemeente]);

  const fetchLatestDagstukkies = async () => {
    if (!currentGemeente) return;

    try {
      // Get the latest erediens
      const { data: erediens } = await supabase
        .from('erediens_info')
        .select('id')
        .eq('gemeente_id', currentGemeente.id)
        .order('sondag_datum', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (erediens) {
        const { data: dagData } = await supabase
          .from('dagstukkies')
          .select('*')
          .eq('erediens_id', erediens.id)
          .order('created_at');

        if (dagData) {
          setDagstukkies(dagData);
          // Cache dagstukkies for offline use
          cacheDagstukkies(dagData.map(d => ({
            id: d.id,
            titel: d.titel,
            inhoud: d.inhoud,
            datum: d.dag,
            skrywer: d.skrifverwysing
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching dagstukkies:', error);
    }
  };

  if (!currentUser) return null;

  const isUserLeier = isLeier(currentUser.rol);
  const isUserAdmin = isAdmin(currentUser.rol);
  const canSeeDagstukkies = ['predikant', 'admin', 'subadmin', 'hoof_admin', 'kerkraad', 'groepleier', 'ouderling', 'diaken'].includes(currentUser.rol);

  // Stats
  const restrictedLidmate = gebruikers.filter(g => {
    if (g.rol !== 'lidmaat') return false;
    if (isRestrictedLeader(currentUser.rol)) {
      return g.wyk_id === currentUser.wyk_id && currentUser.wyk_id !== undefined && currentUser.wyk_id !== null;
    }
    return true;
  });

  const totalLidmate = restrictedLidmate.length;
  const totalWyke = wyke.length;
  const monthlyAksies = aksies.filter(a => {
    const aksieDate = new Date(a.datum);
    const now = new Date();
    return aksieDate.getMonth() === now.getMonth() && aksieDate.getFullYear() === now.getFullYear();
  }).length;
  const pendingKrisisse = krisisse.filter(k => {
    if (k.status === 'opgelos') return false;
    if (isRestrictedLeader(currentUser.rol)) {
      const g = gebruikers.find(u => u.id === k.gebruiker_id);
      return g?.wyk_id === currentUser.wyk_id;
    }
    return true;
  }).length;
  const newVrae = vrae.filter(v => v.status === 'nuut').length;

  // Upcoming events
  const upcomingEvents = program
    .filter(p => new Date(p.datum) >= new Date())
    .slice(0, 5);

  // Recent crises for admin/leader
  const recentKrisisse = krisisse.filter(k => {
    if (isRestrictedLeader(currentUser.rol)) {
      const g = gebruikers.find(u => u.id === k.gebruiker_id);
      return g?.wyk_id === currentUser.wyk_id;
    }
    return true;
  }).slice(0, 3);

  // Upcoming birthdays
  const upcomingBirthdays = getUpcomingBirthdays(restrictedLidmate, 7);

  // Get today's dagstukkie
  const today = new Date();
  const dayNames = ['Sondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag', 'Saterdag'];
  const todayName = dayNames[today.getDay()];
  const todayDagstukkie = dagstukkies.find(d => d.dag === todayName);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('af-ZA', { day: 'numeric', month: 'short' });
  };

  const copyDagstukkie = (dagstukkie: Dagstukkie) => {
    const text = `*${dagstukkie.dag}: ${dagstukkie.titel}*\n\n${dagstukkie.inhoud}\n\n📖 ${dagstukkie.skrifverwysing}`;
    navigator.clipboard.writeText(text);
    setCopiedId(dagstukkie.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareDagstukkie = (dagstukkie: Dagstukkie) => {
    const text = `*${dagstukkie.dag}: ${dagstukkie.titel}*\n\n${dagstukkie.inhoud}\n\n📖 ${dagstukkie.skrifverwysing}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const sendBirthdayWish = (member: any) => {
    if (!member.selfoon) return;
    const message = `Baie geluk met jou verjaarsdag, ${getLidmaatDisplayNaam(member)}! Mag die Here jou seën op hierdie spesiale dag. Groete van jou gemeente.`;
    const url = `https://wa.me/${formatPhoneForWhatsApp(member.selfoon)}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#002855] to-[#003d7a] p-6 md:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A84B]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8B7CB3]/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <p className="text-[#D4A84B] font-medium mb-1">Welkom terug,</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {getLidmaatDisplayNaam(currentUser)}
          </h1>
          <p className="text-white/70">
            {getRolLabel(currentUser.rol)} • {new Date().toLocaleDateString('af-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Daily verse or Dagstukkie */}
        <div className="relative z-10 mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-[#D4A84B] flex-shrink-0 mt-0.5" />
            <div>
              {todayDagstukkie && canSeeDagstukkies ? (
                <>
                  <p className="text-[#D4A84B] text-sm font-medium mb-1">{todayDagstukkie.titel}</p>
                  <p className="text-white/90 text-sm line-clamp-2">{todayDagstukkie.inhoud}</p>
                  <p className="text-[#D4A84B] text-xs mt-1">— {todayDagstukkie.skrifverwysing}</p>
                </>
              ) : (
                <>
                  <p className="text-white/90 italic">
                    "Dra mekaar se laste en vervul so die wet van Christus."
                  </p>
                  <p className="text-[#D4A84B] text-sm mt-1">— Galasiërs 6:2</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Birthday Alert for Leaders */}
      {isUserLeier && upcomingBirthdays.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="w-5 h-5 text-pink-500" />
            <h3 className="font-semibold text-pink-700">Komende Verjaarsdae</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcomingBirthdays.slice(0, 5).map(member => {
              const daysUntil = getDaysUntilBirthday(member.geboortedatum!);
              return (
                <div key={member.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-pink-100">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{(member.noemnaam || member.naam || '')[0]}{(member.van || '')[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getLidmaatDisplayNaam(member)}
                      {getOuderdom(member.geboortedatum, member.ouderdom) != null && (
                        <span className="text-gray-500 font-normal ml-1">({getOuderdom(member.geboortedatum, member.ouderdom)} jaar)</span>
                      )}
                    </p>
                    <p className="text-xs text-pink-600">
                      {daysUntil === 0 ? 'Vandag!' : `Oor ${daysUntil} dae`}
                    </p>
                  </div>
                  {member.selfoon && (
                    <button
                      onClick={() => sendBirthdayWish(member)}
                      className="p-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors ml-2"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dagstukkie for Leaders */}
      {canSeeDagstukkies && todayDagstukkie && (
        <div className="bg-[#8B7CB3]/10 border border-[#8B7CB3]/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8B7CB3]" />
              <h3 className="font-semibold text-[#002855]">Dagstukkie vir Vandag</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyDagstukkie(todayDagstukkie)}
                className="p-2 rounded-lg hover:bg-white transition-colors"
                title="Kopieer"
              >
                {copiedId === todayDagstukkie.id ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-[#8B7CB3]" />
                )}
              </button>
              <button
                onClick={() => shareDagstukkie(todayDagstukkie)}
                className="p-2 rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors"
                title="Deel via WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-[#002855] mb-2">{todayDagstukkie.titel}</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{todayDagstukkie.inhoud}</p>
            <p className="text-sm text-[#8B7CB3] font-medium mt-3 flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {todayDagstukkie.skrifverwysing}
            </p>
          </div>
          <p className="text-xs text-[#8B7CB3] mt-2">Deel hierdie dagstukkie met jou wyk of groep!</p>
        </div>
      )}

      {/* Quick Stats */}
      {isUserLeier && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#002855]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#002855]">{totalLidmate}</p>
                <p className="text-xs text-gray-500">Lidmate</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7A8450]/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-[#7A8450]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#7A8450]">{monthlyAksies}</p>
                <p className="text-xs text-gray-500">Aksies (maand)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#9E2A2B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#9E2A2B]">{pendingKrisisse}</p>
                <p className="text-xs text-gray-500">Oop Krisisse</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B7CB3]/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-[#8B7CB3]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#8B7CB3]">{newVrae}</p>
                <p className="text-xs text-gray-500">Nuwe Vrae</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D4A84B]" />
              <h2 className="font-bold text-[#002855]">Komende Geleenthede</h2>
            </div>
            <button
              onClick={() => setCurrentView('program')}
              className="text-sm text-[#D4A84B] hover:underline flex items-center gap-1"
            >
              Sien Alles <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#002855] text-white flex flex-col items-center justify-center">
                      <span className="text-lg font-bold leading-none">
                        {new Date(event.datum).getDate()}
                      </span>
                      <span className="text-xs uppercase">
                        {new Date(event.datum).toLocaleDateString('af-ZA', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{event.titel}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" />
                        {event.tyd || '—'} • {event.plek || 'TBA'}
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-[#8B7CB3]/10 text-[#8B7CB3]">
                        {getProgramTipeLabel(event.tipe)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Geen komende geleenthede nie</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Crisis Overview */}
        {isUserAdmin ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#9E2A2B]" />
                <h2 className="font-bold text-[#002855]">Onlangse Krisisse</h2>
              </div>
              <button
                onClick={() => setCurrentView('krisis')}
                className="text-sm text-[#D4A84B] hover:underline flex items-center gap-1"
              >
                Sien Alles <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentKrisisse.length > 0 ? (
                recentKrisisse.map(krisis => {
                  const gebruiker = gebruikers.find(g => g.id === krisis.gebruiker_id);
                  return (
                    <div key={krisis.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {krisis.status === 'ingedien' && (
                              <AlertCircle className="w-4 h-4 text-[#9E2A2B]" />
                            )}
                            {krisis.status === 'in_proses' && (
                              <Clock className="w-4 h-4 text-[#D4A84B]" />
                            )}
                            {krisis.status === 'opgelos' && (
                              <CheckCircle className="w-4 h-4 text-[#7A8450]" />
                            )}
                            <h3 className="font-semibold text-gray-900">
                              {gebruiker ? `${gebruiker.naam} ${gebruiker.van}` : 'Onbekend'}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {krisis.beskrywing}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${krisis.prioriteit === 'hoog' || krisis.prioriteit === 'dringend'
                              ? 'bg-[#9E2A2B]/10 text-[#9E2A2B]'
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              {krisis.tipe}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${krisis.status === 'ingedien' ? 'bg-[#9E2A2B]/10 text-[#9E2A2B]' :
                              krisis.status === 'in_proses' ? 'bg-[#D4A84B]/10 text-[#D4A84B]' :
                                'bg-[#7A8450]/10 text-[#7A8450]'
                              }`}>
                              {getKrisisStatusLabel(krisis.status)}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatDate(krisis.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-[#7A8450]" />
                  <p>Geen aktiewe krisisse nie</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-[#002855]">Vinnige Aksies</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentView('vrae')}
                className="p-4 rounded-xl bg-[#8B7CB3]/10 hover:bg-[#8B7CB3]/20 transition-colors text-left"
              >
                <HelpCircle className="w-8 h-8 text-[#8B7CB3] mb-2" />
                <h3 className="font-semibold text-[#002855]">Stel 'n Vraag</h3>
                <p className="text-xs text-gray-500 mt-1">Kontak die kerkraad</p>
              </button>

              <button
                onClick={() => setCurrentView('program')}
                className="p-4 rounded-xl bg-[#D4A84B]/10 hover:bg-[#D4A84B]/20 transition-colors text-left"
              >
                <Calendar className="w-8 h-8 text-[#D4A84B] mb-2" />
                <h3 className="font-semibold text-[#002855]">Kalender</h3>
                <p className="text-xs text-gray-500 mt-1">Sien alle geleenthede</p>
              </button>

              <button
                onClick={() => setCurrentView('profiel')}
                className="p-4 rounded-xl bg-[#002855]/10 hover:bg-[#002855]/20 transition-colors text-left"
              >
                <TrendingUp className="w-8 h-8 text-[#002855] mb-2" />
                <h3 className="font-semibold text-[#002855]">My Profiel</h3>
                <p className="text-xs text-gray-500 mt-1">Wysig jou inligting</p>
              </button>

              {isUserLeier && (
                <button
                  onClick={() => setCurrentView('pastorale-aksie')}
                  className="p-4 rounded-xl bg-[#7A8450]/10 hover:bg-[#7A8450]/20 transition-colors text-left"
                >
                  <Heart className="w-8 h-8 text-[#7A8450] mb-2" />
                  <h3 className="font-semibold text-[#002855]">Nuwe Aksie</h3>
                  <p className="text-xs text-gray-500 mt-1">Registreer besoek</p>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hero Image Section */}
      <div className="relative rounded-2xl overflow-hidden h-48 md:h-64">
        <img
          src="https://d64gsuwffb70l.cloudfront.net/693a23272f683bba6f73274f_1766351833178_1cf13af0.png"
          alt="Gemeente"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#002855]/80 to-transparent flex items-center">
          <div className="p-6 md:p-8 max-w-md">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              Saam in Christus
            </h2>
            <p className="text-white/80 text-sm md:text-base">
              Die NHKA gemeentes ondersteun mekaar deur gebed, besoeke en praktiese hulp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
