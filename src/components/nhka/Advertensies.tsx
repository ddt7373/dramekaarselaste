import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import {
  Advertensie,
  AdvertensieKategorie,
  getAdvertensieKategorieLabel
} from '@/types/nhka';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Tag,
  X,
  Edit,
  Trash2,
  Eye,
  Building,
  Briefcase,
  Package,
  Heart,
  Users,
  DollarSign,
  AlertCircle,
  Info,
  Clock,
  CreditCard,
  Star,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const kategorieIcons: Record<AdvertensieKategorie, React.ReactNode> = {
  besigheid: <Building className="w-4 h-4" />,
  diens: <Briefcase className="w-4 h-4" />,
  produk: <Package className="w-4 h-4" />,
  fondsinsameling: <Heart className="w-4 h-4" />,
  projek: <Users className="w-4 h-4" />,
  werk: <Briefcase className="w-4 h-4" />,
  algemeen: <Tag className="w-4 h-4" />
};

const kategorieColors: Record<AdvertensieKategorie, string> = {
  besigheid: 'bg-blue-100 text-blue-700 border-blue-200',
  diens: 'bg-green-100 text-green-700 border-green-200',
  produk: 'bg-purple-100 text-purple-700 border-purple-200',
  fondsinsameling: 'bg-pink-100 text-pink-700 border-pink-200',
  projek: 'bg-orange-100 text-orange-700 border-orange-200',
  werk: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  algemeen: 'bg-gray-100 text-gray-700 border-gray-200'
};

const Advertensies: React.FC = () => {
  const { currentUser, currentGemeente, gemeentes } = useNHKA();
  const { toast } = useToast();
  const [advertensies, setAdvertensies] = useState<Advertensie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertensie | null>(null);
  const [viewingAd, setViewingAd] = useState<Advertensie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategorie, setFilterKategorie] = useState<AdvertensieKategorie | 'alle'>('alle');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    titel: '',
    beskrywing: '',
    kategorie: 'algemeen' as AdvertensieKategorie,
    kontak_naam: '',
    kontak_selfoon: '',
    kontak_epos: '',
    prys: '',
    plek: '',
    verval_datum: '',
    duur_maande: 1 // 1 = gratis eerste maand
  });

  useEffect(() => {
    fetchAdvertensies();
  }, []);

  const fetchAdvertensies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('advertensies')
        .select('*')
        .eq('aktief', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdvertensies(data || []);
    } catch (err: any) {
      console.error('Error fetching advertensies:', err);
      setError('Kon nie advertensies laai nie');
    } finally {
      setLoading(false);
    }
  };

  const calculateAdCost = (months: number) => {
    // First month is free, each additional month is R200
    if (months <= 1) return 0;
    return (months - 1) * 200;
  };

  const handlePayForAd = async (adId: string, months: number) => {
    if (!currentUser) return;

    const cost = calculateAdCost(months);
    if (cost === 0) {
      toast({ title: 'Gratis', description: 'Eerste maand is gratis!' });
      return;
    }

    setProcessingPayment(true);
    try {
      // Create Yoco checkout
      const response = await fetch('/yoco-proxy.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: cost * 100, // Yoco expects cents
          currency: 'ZAR',
          metadata: {
            type: 'advertensie',
            advertensie_id: adId,
            maande: months,
            gebruiker_id: currentUser.id
          },
          successUrl: `${window.location.origin}/app?tab=advertensies&betaal=sukses`,
          cancelUrl: `${window.location.origin}/app?tab=advertensies&betaal=gekanselleer`,
          failureUrl: `${window.location.origin}/app?tab=advertensies&betaal=misluk`
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Kon nie betaling begin nie');

      if (data?.redirectUrl) {
        // Update ad with checkout ID
        await supabase
          .from('advertensies')
          .update({
            yoco_checkout_id: data.id,
            betaal_status: 'hangende'
          })
          .eq('id', adId);

        // Redirect to Yoco payment page
        window.location.href = data.redirectUrl;
      }
    } catch (err: any) {
      console.error('Error creating payment:', err);
      toast({
        title: 'Fout',
        description: 'Kon nie betaling begin nie. Probeer weer.',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setError('');

    try {
      const cost = calculateAdCost(formData.duur_maande);
      const vervalDatum = new Date();
      vervalDatum.setMonth(vervalDatum.getMonth() + formData.duur_maande);

      const adData = {
        titel: formData.titel,
        beskrywing: formData.beskrywing,
        kategorie: formData.kategorie,
        kontak_naam: formData.kontak_naam,
        kontak_selfoon: formData.kontak_selfoon,
        kontak_epos: formData.kontak_epos,
        prys: formData.prys || null,
        plek: formData.plek || null,
        gebruiker_id: currentUser.id,
        gemeente_id: currentGemeente?.id || null,
        aktief: true,
        verval_datum: vervalDatum.toISOString().split('T')[0],
        is_betaal: cost > 0,
        betaal_status: cost > 0 ? 'hangende' : 'gratis'
      };

      let adId: string;

      if (editingAd) {
        const { error } = await supabase
          .from('advertensies')
          .update({ ...adData, updated_at: new Date().toISOString() })
          .eq('id', editingAd.id);
        if (error) throw error;
        adId = editingAd.id;
      } else {
        const { data, error } = await supabase
          .from('advertensies')
          .insert([adData])
          .select()
          .single();
        if (error) throw error;
        adId = data.id;
      }

      // If payment required, redirect to payment
      if (cost > 0) {
        await handlePayForAd(adId, formData.duur_maande);
      } else {
        await fetchAdvertensies();
        resetForm();
        toast({ title: 'Sukses', description: 'Advertensie geplaas vir 1 maand (gratis)' });
      }
    } catch (err: any) {
      console.error('Error saving advertensie:', err);
      setError(err.message || 'Kon nie advertensie stoor nie');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Is jy seker jy wil hierdie advertensie verwyder?')) return;

    try {
      const { error } = await supabase
        .from('advertensies')
        .update({ aktief: false })
        .eq('id', id);
      if (error) throw error;
      await fetchAdvertensies();
      toast({ title: 'Sukses', description: 'Advertensie verwyder' });
    } catch (err: any) {
      console.error('Error deleting advertensie:', err);
      setError('Kon nie advertensie verwyder nie');
    }
  };

  const resetForm = () => {
    setFormData({
      titel: '',
      beskrywing: '',
      kategorie: 'algemeen',
      kontak_naam: currentUser?.naam + ' ' + currentUser?.van || '',
      kontak_selfoon: currentUser?.selfoon || '',
      kontak_epos: currentUser?.epos || '',
      prys: '',
      plek: '',
      verval_datum: '',
      duur_maande: 1
    });
    setShowForm(false);
    setEditingAd(null);
  };

  const openEditForm = (ad: Advertensie) => {
    setFormData({
      titel: ad.titel,
      beskrywing: ad.beskrywing,
      kategorie: ad.kategorie,
      kontak_naam: ad.kontak_naam || '',
      kontak_selfoon: ad.kontak_selfoon || '',
      kontak_epos: ad.kontak_epos || '',
      prys: ad.prys || '',
      plek: ad.plek || '',
      verval_datum: ad.verval_datum || '',
      duur_maande: 1
    });
    setEditingAd(ad);
    setShowForm(true);
  };

  const openNewForm = () => {
    setFormData({
      titel: '',
      beskrywing: '',
      kategorie: 'algemeen',
      kontak_naam: currentUser?.naam + ' ' + currentUser?.van || '',
      kontak_selfoon: currentUser?.selfoon || '',
      kontak_epos: currentUser?.epos || '',
      prys: '',
      plek: '',
      verval_datum: '',
      duur_maande: 1
    });
    setEditingAd(null);
    setShowForm(true);
  };

  const getGemeenteNaam = (gemeenteId?: string) => {
    if (!gemeenteId) return 'Alle Gemeentes';
    const gemeente = gemeentes.find(g => g.id === gemeenteId);
    return gemeente?.naam || 'Onbekend';
  };

  // Filter advertensies
  const filteredAdvertensies = advertensies.filter(ad => {
    const matchesSearch =
      ad.titel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.beskrywing.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ad.plek && ad.plek.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesKategorie = filterKategorie === 'alle' || ad.kategorie === filterKategorie;
    return matchesSearch && matchesKategorie;
  });

  // Sort: paid ads first, then by date
  const sortedAdvertensies = [...filteredAdvertensies].sort((a, b) => {
    // Paid ads first
    const aIsPaid = (a as any).is_betaal && (a as any).betaal_status === 'betaal';
    const bIsPaid = (b as any).is_betaal && (b as any).betaal_status === 'betaal';
    if (aIsPaid && !bIsPaid) return -1;
    if (!aIsPaid && bIsPaid) return 1;
    // Then by date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#D4A84B] to-[#B8922F] rounded-xl flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#002855]">Advertensies</h1>
              <p className="text-gray-500 text-sm">
                Besighede, dienste, projekte en fondsinsamelings
              </p>
            </div>
          </div>
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 px-4 py-2 bg-[#002855] text-white rounded-xl hover:bg-[#003d7a] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Plaas Advertensie
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Advertensies vir die Gemeenskap</p>
            <p>
              Hierdie advertensies is sigbaar vir alle lidmate in alle gemeentes.
              Plaas jou besigheid, diens, produk, fondsinsameling of gemeente projek hier
              om die breër gemeenskap te bereik.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Info Box */}
      <div className="bg-gradient-to-r from-[#D4A84B]/10 to-[#002855]/10 border border-[#D4A84B]/30 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-[#D4A84B] rounded-full flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-[#002855] mb-2">Advertensie Tariewe</p>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span><strong>Eerste maand GRATIS</strong> - Plaas jou advertensie sonder koste</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#D4A84B]" />
                <span><strong>R200 per maand</strong> daarna om jou advertensie te verleng</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#D4A84B]" />
                <span>Betaalde advertensies word <strong>bo-aan</strong> die lys vertoon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Soek advertensies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterKategorie}
              onChange={(e) => setFilterKategorie(e.target.value as AdvertensieKategorie | 'alle')}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855]"
            >
              <option value="alle">Alle Kategorieë</option>
              <option value="besigheid">Besigheid</option>
              <option value="diens">Diens</option>
              <option value="produk">Produk</option>
              <option value="fondsinsameling">Fondsinsameling</option>
              <option value="projek">Gemeente Projek</option>
              <option value="werk">Werksgeleentheid</option>
              <option value="algemeen">Algemeen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Advertensies Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#002855] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedAdvertensies.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Geen advertensies gevind</h3>
          <p className="text-gray-400">
            {searchTerm || filterKategorie !== 'alle'
              ? 'Probeer ander soekterme of filters'
              : 'Wees die eerste om \'n advertensie te plaas!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedAdvertensies.map((ad) => {
            const isPaid = (ad as any).is_betaal && (ad as any).betaal_status === 'betaal';
            return (
              <div
                key={ad.id}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${isPaid ? 'border-[#D4A84B] ring-1 ring-[#D4A84B]/20' : 'border-gray-100'
                  }`}
              >
                {isPaid && (
                  <div className="bg-gradient-to-r from-[#D4A84B] to-[#B8922F] px-4 py-1 flex items-center gap-1">
                    <Star className="w-3 h-3 text-white" />
                    <span className="text-xs font-medium text-white">Betaalde Advertensie</span>
                  </div>
                )}
                <div className="p-5">
                  {/* Kategorie Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${kategorieColors[ad.kategorie]}`}>
                      {kategorieIcons[ad.kategorie]}
                      {getAdvertensieKategorieLabel(ad.kategorie)}
                    </span>
                    {ad.prys && (
                      <span className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                        <DollarSign className="w-4 h-4" />
                        {ad.prys}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-[#002855] mb-2 line-clamp-2">
                    {ad.titel}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {ad.beskrywing}
                  </p>

                  {/* Location */}
                  {ad.plek && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{ad.plek}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Geplaas: {new Date(ad.created_at).toLocaleDateString('af-ZA')}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setViewingAd(ad)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#002855] hover:bg-[#002855]/5 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Besigtig
                    </button>
                    {currentUser?.id === ad.gebruiker_id && (
                      <>
                        <button
                          onClick={() => openEditForm(ad)}
                          className="p-2 text-gray-500 hover:text-[#002855] hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#002855]">
                {editingAd ? 'Wysig Advertensie' : 'Nuwe Advertensie'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.titel}
                  onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855]"
                  placeholder="bv. Loodgieter Dienste Beskikbaar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategorie *
                </label>
                <select
                  value={formData.kategorie}
                  onChange={(e) => setFormData({ ...formData, kategorie: e.target.value as AdvertensieKategorie })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855]"
                >
                  <option value="besigheid">Besigheid</option>
                  <option value="diens">Diens</option>
                  <option value="produk">Produk</option>
                  <option value="fondsinsameling">Fondsinsameling</option>
                  <option value="projek">Gemeente Projek</option>
                  <option value="werk">Werksgeleentheid</option>
                  <option value="algemeen">Algemeen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beskrywing *
                </label>
                <textarea
                  value={formData.beskrywing}
                  onChange={(e) => setFormData({ ...formData, beskrywing: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855]"
                  placeholder="Beskryf jou advertensie in detail..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prys (opsioneel)
                  </label>
                  <input
                    type="text"
                    value={formData.prys}
                    onChange={(e) => setFormData({ ...formData, prys: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855]"
                    placeholder="bv. R500 of Onderhandelbaar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ligging (opsioneel)
                  </label>
                  <input
                    type="text"
                    value={formData.plek}
                    onChange={(e) => setFormData({ ...formData, plek: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855]"
                    placeholder="bv. Pretoria-Oos"
                  />
                </div>
              </div>

              {/* Duration Selection */}
              <div className="border border-[#D4A84B]/30 rounded-xl p-4 bg-gradient-to-r from-[#D4A84B]/5 to-[#002855]/5">
                <label className="block text-sm font-medium text-[#002855] mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Advertensie Duur
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[1, 2, 3, 6].map((months) => {
                    const cost = calculateAdCost(months);
                    return (
                      <button
                        key={months}
                        type="button"
                        onClick={() => setFormData({ ...formData, duur_maande: months })}
                        className={`p-3 rounded-xl border-2 transition-all ${formData.duur_maande === months
                            ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="text-sm font-semibold text-[#002855]">
                          {months} {months === 1 ? 'Maand' : 'Maande'}
                        </div>
                        <div className={`text-xs mt-1 ${cost === 0 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                          {cost === 0 ? 'GRATIS' : `R${cost}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {formData.duur_maande > 1 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-[#002855]">
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Totaal: <strong>R{calculateAdCost(formData.duur_maande)}</strong>
                      (betaal via Yoco)
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Kontak Besonderhede</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Naam</label>
                    <input
                      type="text"
                      value={formData.kontak_naam}
                      onChange={(e) => setFormData({ ...formData, kontak_naam: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Selfoon</label>
                    <input
                      type="tel"
                      value={formData.kontak_selfoon}
                      onChange={(e) => setFormData({ ...formData, kontak_selfoon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">E-pos</label>
                    <input
                      type="email"
                      value={formData.kontak_epos}
                      onChange={(e) => setFormData({ ...formData, kontak_epos: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Kanselleer
                </button>
                <button
                  type="submit"
                  disabled={saving || processingPayment}
                  className="flex-1 px-4 py-2 bg-[#002855] text-white rounded-xl hover:bg-[#003d7a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving || processingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {processingPayment ? 'Betaling...' : 'Stoor...'}
                    </>
                  ) : (
                    <>
                      {calculateAdCost(formData.duur_maande) > 0 ? (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Betaal R{calculateAdCost(formData.duur_maande)}
                        </>
                      ) : (
                        editingAd ? 'Dateer Op' : 'Plaas Gratis'
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${kategorieColors[viewingAd.kategorie]}`}>
                {kategorieIcons[viewingAd.kategorie]}
                {getAdvertensieKategorieLabel(viewingAd.kategorie)}
              </span>
              <button
                onClick={() => setViewingAd(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#002855] mb-4">{viewingAd.titel}</h2>

              {viewingAd.prys && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl font-semibold mb-4">
                  <DollarSign className="w-5 h-5" />
                  {viewingAd.prys}
                </div>
              )}

              <p className="text-gray-700 whitespace-pre-wrap mb-6">{viewingAd.beskrywing}</p>

              {viewingAd.plek && (
                <div className="flex items-center gap-3 text-gray-600 mb-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{viewingAd.plek}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-gray-500 text-sm mb-6">
                <Calendar className="w-4 h-4" />
                <span>Geplaas: {new Date(viewingAd.created_at).toLocaleDateString('af-ZA')}</span>
                {viewingAd.verval_datum && (
                  <span className="text-orange-600">
                    | Verval: {new Date(viewingAd.verval_datum).toLocaleDateString('af-ZA')}
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-[#002855] mb-3">Kontak Besonderhede</h3>
                <div className="space-y-2">
                  {viewingAd.kontak_naam && (
                    <p className="text-gray-700">{viewingAd.kontak_naam}</p>
                  )}
                  {viewingAd.kontak_selfoon && (
                    <a
                      href={`tel:${viewingAd.kontak_selfoon}`}
                      className="flex items-center gap-2 text-[#002855] hover:underline"
                    >
                      <Phone className="w-4 h-4" />
                      {viewingAd.kontak_selfoon}
                    </a>
                  )}
                  {viewingAd.kontak_epos && (
                    <a
                      href={`mailto:${viewingAd.kontak_epos}`}
                      className="flex items-center gap-2 text-[#002855] hover:underline"
                    >
                      <Mail className="w-4 h-4" />
                      {viewingAd.kontak_epos}
                    </a>
                  )}
                </div>
              </div>

              {/* Gemeente Info */}
              <div className="mt-4 text-sm text-gray-500">
                Geplaas vanuit: {getGemeenteNaam(viewingAd.gemeente_id)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Advertensies;
