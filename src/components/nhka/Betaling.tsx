import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNHKA } from '@/contexts/NHKAContext';
import {
  getBetalingTipeLabel,
  getBetalingStatusLabel,
  BetalingTipe,
  GemeenteBankbesonderhede
} from '@/types/nhka';
import {
  CreditCard,
  Heart,
  Gift,
  ChevronDown,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  History,
  ArrowRight,
  Building2,
  Copy,
  Check,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

const Betaling: React.FC = () => {
  // Helper function to safely format price values that may be strings from database
  const formatPrice = (value: any): string => {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const {
    currentUser,
    currentGemeente,
    betalings,
    processBetaling,
    processGeloofsonderrigBetaling
  } = useNHKA();

  const [bedrag, setBedrag] = useState<string>('');
  const [tipe, setTipe] = useState<BetalingTipe | 'kiog'>('offergawe');
  const [beskrywing, setBeskrywing] = useState('');
  const [kiogLeerderId, setKiogLeerderId] = useState<string>('');
  const [kiogLeerders, setKiogLeerders] = useState<{ id: string; naam: string; van: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankDetails, setBankDetails] = useState<GemeenteBankbesonderhede | null>(null);
  const [loadingBank, setLoadingBank] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch bank details
  useEffect(() => {
    if (currentGemeente) {
      fetchBankDetails();
    }
  }, [currentGemeente]);

  // Fetch KI-Kats leerders (from gemeente who are in geloofsonderrig and haven't paid)
  useEffect(() => {
    if (currentGemeente && tipe === 'kiog') {
      (async () => {
        try {
          const { data: klasLeerders } = await supabase.from('geloofsonderrig_klas_leerders').select('leerder_id');
          const allIds = [...new Set((klasLeerders || []).map(k => k.leerder_id))];
          const { data: gemeenteLeerders } = await supabase.from('gebruikers').select('id, naam, van').in('id', allIds).eq('gemeente_id', currentGemeente.id);
          const leerderIds = (gemeenteLeerders || []).map(g => g.id);
          const { data: betaalData } = await supabase.from('geloofsonderrig_betalings').select('leerder_id').in('leerder_id', leerderIds).eq('status', 'betaal');
          const betaalIds = new Set((betaalData || []).map(b => b.leerder_id));
          const nieBetaal = (gemeenteLeerders || []).filter(g => !betaalIds.has(g.id));
          setKiogLeerders(nieBetaal.map(g => ({ id: g.id, naam: g.naam || '', van: g.van || '' })));
        } catch (e) {
          setKiogLeerders([]);
        }
      })();
    }
  }, [currentGemeente, tipe]);

  const fetchBankDetails = async () => {
    if (!currentGemeente) return;
    setLoadingBank(true);
    try {
      const { data, error } = await supabase
        .from('gemeente_bankbesonderhede')
        .select('*')
        .eq('gemeente_id', currentGemeente.id)
        .eq('aktief', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bank details:', error);
      }
      setBankDetails(data || null);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingBank(false);
    }
  };

  // Check for payment result in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
      toast.success('Betaling suksesvol voltooi! Dankie vir jou bydrae.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      toast.info('Betaling gekanselleer');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'failed') {
      toast.error('Betaling het misluk. Probeer asb weer.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (!currentUser) return null;

  // Get user's payments
  const userBetalings = betalings.filter(b => b.gebruiker_id === currentUser.id);

  // Quick amount buttons
  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tipe === 'kiog') {
      if (!kiogLeerderId) {
        toast.error('Kies vir wie jy betaal');
        return;
      }
      setIsProcessing(true);
      try {
        const result = await processGeloofsonderrigBetaling?.(kiogLeerderId, { namens: true });
        if (result?.success && result?.redirectUrl) window.location.href = result.redirectUrl;
        else toast.error(result?.error || 'Kon nie betaling verwerk nie');
      } catch (err) {
        toast.error('Onbekende fout tydens betaling');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const amount = parseFloat(bedrag);
    if (isNaN(amount) || amount < 10) {
      toast.error('Minimum bedrag is R10');
      return;
    }

    if (tipe === 'ander' && !beskrywing.trim()) {
      toast.error('Beskryf asb die doel van die betaling');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await processBetaling(amount, tipe as import('@/types/nhka').BetalingTipe, beskrywing);

      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        toast.error(result.error || 'Kon nie betaling verwerk nie');
        setIsProcessing(false);
      }
    } catch (error) {
      toast.error('Onbekende fout tydens betaling');
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Gekopieer!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'voltooi':
        return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />;
      case 'misluk':
      case 'gekanselleer':
        return <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />;
      default:
        return <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'voltooi':
        return 'bg-green-100 text-green-700';
      case 'misluk':
      case 'gekanselleer':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#002855]">Betalings</h1>
        <p className="text-sm sm:text-base text-gray-500 break-words">
          Maak 'n offergawe of ander bydrae aan {currentGemeente?.naam}
        </p>
      </div>

      {/* EFT Bank Details Card */}
      <div className="bg-gradient-to-r from-[#002855] to-[#003d7a] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">EFT Bankbesonderhede</h2>
            <p className="text-white/70 text-xs sm:text-sm">Maak 'n EFT betaling aan die gemeente vanaf jou eie banktoepassing.</p>
          </div>
        </div>

        {loadingBank ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bankDetails ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Bank</p>
                <p className="font-semibold">{bankDetails.bank_naam}</p>
              </div>
              <button
                onClick={() => copyToClipboard(bankDetails.bank_naam, 'bank')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Kopieer"
              >
                {copiedField === 'bank' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Rekening Naam</p>
                <p className="font-semibold">{bankDetails.rekening_naam}</p>
              </div>
              <button
                onClick={() => copyToClipboard(bankDetails.rekening_naam, 'naam')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Kopieer"
              >
                {copiedField === 'naam' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Rekening Nommer</p>
                <p className="font-semibold font-mono tracking-wider">{bankDetails.rekening_nommer}</p>
              </div>
              <button
                onClick={() => copyToClipboard(bankDetails.rekening_nommer, 'nommer')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Kopieer"
              >
                {copiedField === 'nommer' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60" />}
              </button>
            </div>

            {bankDetails.takkode && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs">Takkode</p>
                  <p className="font-semibold font-mono">{bankDetails.takkode}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.takkode!, 'takkode')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Kopieer"
                >
                  {copiedField === 'takkode' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60" />}
                </button>
              </div>
            )}

            {bankDetails.rekening_tipe && (
              <div>
                <p className="text-white/60 text-xs">Rekening Tipe</p>
                <p className="font-semibold">{bankDetails.rekening_tipe}</p>
              </div>
            )}

            {bankDetails.verwysing_instruksies && (
              <div className="pt-3 mt-3 border-t border-white/20">
                <p className="text-white/60 text-xs mb-1">Verwysing Formaat</p>
                <p className="text-sm bg-white/10 rounded-lg px-3 py-2">{bankDetails.verwysing_instruksies}</p>
              </div>
            )}

            {/* Copy All Button */}
            <div className="pt-3 mt-3 border-t border-white/20">
              <button
                onClick={() => {
                  const allDetails = `Bank: ${bankDetails.bank_naam}\nRekening Naam: ${bankDetails.rekening_naam}\nRekening Nommer: ${bankDetails.rekening_nommer}${bankDetails.takkode ? `\nTakkode: ${bankDetails.takkode}` : ''}${bankDetails.rekening_tipe ? `\nRekening Tipe: ${bankDetails.rekening_tipe}` : ''}${bankDetails.verwysing_instruksies ? `\nVerwysing: ${bankDetails.verwysing_instruksies}` : ''}`;
                  copyToClipboard(allDetails, 'all');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
              >
                {copiedField === 'all' ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Alle besonderhede gekopieer!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Kopieer alle besonderhede</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-white/40" />
            <p className="text-white/80 text-sm mb-2">Bankbesonderhede is nog nie beskikbaar nie.</p>
            <p className="text-white/60 text-xs">
              Kontak asseblief die kerkkantoor vir EFT betalingsinligting.
            </p>
          </div>
        )}
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-[#D4A84B] to-[#c49a3d] p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate">Kaartbetaling</h2>
                  <p className="text-white/80 text-xs sm:text-sm truncate">Veilige betaling via Yoco</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">Tipe Bydrae</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setTipe('offergawe')}
                    className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all ${tipe === 'offergawe'
                        ? 'border-[#D4A84B] bg-[#D4A84B]/5'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tipe === 'offergawe' ? 'bg-[#D4A84B]' : 'bg-gray-100'
                      }`}>
                      <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${tipe === 'offergawe' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className={`font-semibold text-sm sm:text-base ${tipe === 'offergawe' ? 'text-[#002855]' : 'text-gray-700'}`}>
                        Offergawe
                      </p>
                      <p className="text-xs text-gray-500 truncate">Weeklikse/Maandelikse offer</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipe('ander')}
                    className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all ${tipe === 'ander'
                        ? 'border-[#D4A84B] bg-[#D4A84B]/5'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tipe === 'ander' ? 'bg-[#D4A84B]' : 'bg-gray-100'
                      }`}>
                      <Gift className={`w-4 h-4 sm:w-5 sm:h-5 ${tipe === 'ander' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className={`font-semibold text-sm sm:text-base ${tipe === 'ander' ? 'text-[#002855]' : 'text-gray-700'}`}>
                        Ander
                      </p>
                      <p className="text-xs text-gray-500 truncate">Spesiale bydrae</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipe('kiog')}
                    className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all ${tipe === 'kiog'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tipe === 'kiog' ? 'bg-amber-500' : 'bg-gray-100'
                      }`}>
                      <GraduationCap className={`w-4 h-4 sm:w-5 sm:h-5 ${tipe === 'kiog' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className={`font-semibold text-sm sm:text-base ${tipe === 'kiog' ? 'text-[#002855]' : 'text-gray-700'}`}>
                        KI-Kats Geloofsonderrig
                      </p>
                      <p className="text-xs text-gray-500 truncate">R100 vir leerder</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* KI-Kats Leerder Selection */}
              {tipe === 'kiog' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vir wie betaal jy? *</label>
                  <select
                    value={kiogLeerderId}
                    onChange={(e) => setKiogLeerderId(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm sm:text-base"
                  >
                    <option value="">Kies leerder...</option>
                    {kiogLeerders.map(l => (
                      <option key={l.id} value={l.id}>{l.naam} {l.van}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">R100 eenmalig vir al die lesse in die kind se graad</p>
                </div>
              )}

              {/* Description for "Ander" */}
              {tipe === 'ander' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beskrywing *
                  </label>
                  <input
                    type="text"
                    value={beskrywing}
                    onChange={(e) => setBeskrywing(e.target.value)}
                    placeholder="bv. Boufondskas, Sendingprojek, ens."
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm sm:text-base"
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">Bedrag (ZAR)</label>

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setBedrag(amount.toString())}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm transition-colors ${bedrag === amount.toString()
                          ? 'bg-[#002855] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      R{amount}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input */}
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg sm:text-xl">R</span>
                  <input
                    type="number"
                    value={bedrag}
                    onChange={(e) => setBedrag(e.target.value)}
                    placeholder="0.00"
                    min="10"
                    step="0.01"
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 sm:py-4 text-xl sm:text-2xl font-bold rounded-xl border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum bedrag: R10</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || (tipe === 'kiog' ? !kiogLeerderId : (!bedrag || parseFloat(bedrag) < 10))}
                className="w-full flex items-center justify-center gap-2 py-3 sm:py-4 px-4 sm:px-6 bg-[#D4A84B] text-[#002855] font-bold text-base sm:text-lg rounded-xl hover:bg-[#c49a3d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span className="truncate">Verwerk...</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">Gaan voort na betaling</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  </>
                )}
              </button>

              {/* Security Note */}
              <p className="text-center text-xs text-gray-500 px-2">
                Veilige betaling verwerk deur Yoco. Jou kaartbesonderhede word nooit gestoor nie.
              </p>
            </form>
          </div>
        </div>

        {/* Payment History Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <History className="w-4 h-4 sm:w-5 sm:h-5 text-[#002855] flex-shrink-0" />
                <h3 className="font-bold text-sm sm:text-base text-[#002855] truncate">Betalingsgeskiedenis</h3>
              </div>
              <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{userBetalings.length} betalings</span>
            </div>

            <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              {userBetalings.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 text-xs sm:text-sm">Geen vorige betalings nie</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {userBetalings.slice(0, 10).map(betaling => (
                    <div key={betaling.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${betaling.tipe === 'offergawe' ? 'bg-[#D4A84B]/10' : 'bg-[#8B7CB3]/10'
                            }`}>
                            {betaling.tipe === 'offergawe' ? (
                              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4A84B]" />
                            ) : (
                              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8B7CB3]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {betaling.tipe === 'offergawe' ? 'Offergawe' : betaling.beskrywing || 'Ander'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(betaling.created_at).toLocaleDateString('af-ZA', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-sm sm:text-base text-[#002855]">R{formatPrice(betaling.bedrag)}</p>

                          <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full ${getStatusColor(betaling.status)}`}>
                            {getStatusIcon(betaling.status)}
                            <span className="hidden xs:inline">{getBetalingStatusLabel(betaling.status)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            {userBetalings.length > 0 && (
              <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm text-gray-600">Totale Bydraes</span>
                  <span className="font-bold text-sm sm:text-base text-[#002855]">
                    R{userBetalings
                      .filter(b => b.status === 'voltooi')
                      .reduce((sum, b) => sum + b.bedrag, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="mt-3 sm:mt-4 bg-[#002855]/5 rounded-xl p-3 sm:p-4">
            <h4 className="font-semibold text-sm sm:text-base text-[#002855] mb-1 sm:mb-2">Oor Bydraes</h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Jou bydraes help om die gemeente se bediening te ondersteun.
              Alle betalings word veilig verwerk en 'n rekord word gehou vir jou verwysing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Betaling;
