import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { GaweEnTalent, Gebruiker } from '@/types/nhka';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  User,
  DollarSign,
  Heart,
  MapPin,
  AlertCircle,
  X,
  Wrench,
  Paintbrush,
  Music,
  BookOpen,
  Camera,
  Utensils,
  Car,
  Home,
  Laptop,
  Scissors
} from 'lucide-react';

interface GaweWithUser extends GaweEnTalent {
  gebruiker_naam?: string;
  gebruiker_van?: string;
  gebruiker_selfoon?: string;
  gebruiker_epos?: string;
  gemeente_naam?: string;
}

const GawesSoek: React.FC = () => {
  const { currentUser, currentGemeente, gemeentes } = useNHKA();
  const [gawes, setGawes] = useState<GaweWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'alle' | 'betaald' | 'vrywillig'>('alle');
  const [viewingGawe, setViewingGawe] = useState<GaweWithUser | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGawes();
  }, []);

  const fetchGawes = async () => {
    try {
      setLoading(true);
      
      // Fetch gawes with user info
      const { data, error } = await supabase
        .from('gawes_en_talente')
        .select(`
          *,
          gebruikers:gebruiker_id (
            naam,
            van,
            selfoon,
            epos,
            gemeente_id
          )
        `)
        .eq('aktief', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include user info
      const transformedData: GaweWithUser[] = (data || []).map((gawe: any) => ({
        ...gawe,
        gebruiker_naam: gawe.gebruikers?.naam,
        gebruiker_van: gawe.gebruikers?.van,
        gebruiker_selfoon: gawe.gebruikers?.selfoon,
        gebruiker_epos: gawe.gebruikers?.epos,
        gemeente_naam: gemeentes.find(g => g.id === gawe.gebruikers?.gemeente_id)?.naam
      }));

      setGawes(transformedData);
    } catch (err: any) {
      console.error('Error fetching gawes:', err);
      setError('Kon nie gawes laai nie');
    } finally {
      setLoading(false);
    }
  };

  // Get icon based on gawe title
  const getGaweIcon = (titel: string) => {
    const lowerTitel = titel.toLowerCase();
    if (lowerTitel.includes('sweis') || lowerTitel.includes('herstel') || lowerTitel.includes('loodgieter')) {
      return <Wrench className="w-5 h-5" />;
    }
    if (lowerTitel.includes('verf') || lowerTitel.includes('skilder') || lowerTitel.includes('kuns')) {
      return <Paintbrush className="w-5 h-5" />;
    }
    if (lowerTitel.includes('musiek') || lowerTitel.includes('sing') || lowerTitel.includes('orrel')) {
      return <Music className="w-5 h-5" />;
    }
    if (lowerTitel.includes('onderrig') || lowerTitel.includes('tutor') || lowerTitel.includes('les')) {
      return <BookOpen className="w-5 h-5" />;
    }
    if (lowerTitel.includes('foto') || lowerTitel.includes('video')) {
      return <Camera className="w-5 h-5" />;
    }
    if (lowerTitel.includes('kook') || lowerTitel.includes('bak') || lowerTitel.includes('catering')) {
      return <Utensils className="w-5 h-5" />;
    }
    if (lowerTitel.includes('motor') || lowerTitel.includes('kar') || lowerTitel.includes('vervoer')) {
      return <Car className="w-5 h-5" />;
    }
    if (lowerTitel.includes('tuin') || lowerTitel.includes('huis') || lowerTitel.includes('skoonmaak')) {
      return <Home className="w-5 h-5" />;
    }
    if (lowerTitel.includes('rekenaar') || lowerTitel.includes('it') || lowerTitel.includes('web')) {
      return <Laptop className="w-5 h-5" />;
    }
    if (lowerTitel.includes('naaldwerk') || lowerTitel.includes('klere') || lowerTitel.includes('verstel')) {
      return <Scissors className="w-5 h-5" />;
    }
    return <Sparkles className="w-5 h-5" />;
  };

  // Filter gawes
  const filteredGawes = gawes.filter(gawe => {
    const matchesSearch = 
      gawe.titel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gawe.beskrywing && gawe.beskrywing.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gawe.gebruiker_naam && gawe.gebruiker_naam.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gawe.gebruiker_van && gawe.gebruiker_van.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = 
      filterType === 'alle' ||
      (filterType === 'betaald' && gawe.is_betaald) ||
      (filterType === 'vrywillig' && gawe.is_vrywillig);
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#8B7CB3] to-[#6B5B95] rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002855]">Gawes & Talente Soek</h1>
            <p className="text-gray-500 text-sm">
              Vind lidmate met spesifieke vaardighede en talente
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-800">
            <p className="font-medium mb-1">Gemeenskap Vaardighede</p>
            <p>
              Soek hier na lidmate wat hul gawes en talente beskikbaar stel. 
              Dit kan betaalde dienste wees wat deur ander ondersteun kan word, 
              of vrywillige bydraes tot opbou van die gemeente.
            </p>
            <p className="mt-2 text-purple-600">
              <strong>Voorbeelde:</strong> "Ek kan sweis", "Ek kan skilder", "Ek kan musiek maak", "Ek kan kinders oppas"
            </p>
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
              placeholder="Soek na vaardighede of name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B7CB3]/20 focus:border-[#8B7CB3]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'alle' | 'betaald' | 'vrywillig')}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B7CB3]/20 focus:border-[#8B7CB3]"
            >
              <option value="alle">Alle Tipes</option>
              <option value="betaald">Betaalde Dienste</option>
              <option value="vrywillig">Vrywillige Bydraes</option>
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

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        {filteredGawes.length} {filteredGawes.length === 1 ? 'resultaat' : 'resultate'} gevind
      </div>

      {/* Gawes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#8B7CB3] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredGawes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Geen gawes gevind</h3>
          <p className="text-gray-400">
            {searchTerm || filterType !== 'alle' 
              ? 'Probeer ander soekterme of filters'
              : 'Daar is nog geen gawes geregistreer nie'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Lidmate kan hul gawes by hul profiel byvoeg
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGawes.map((gawe) => (
            <div
              key={gawe.id}
              onClick={() => setViewingGawe(gawe)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Icon and Type Badges */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#8B7CB3]/10 rounded-xl flex items-center justify-center text-[#8B7CB3]">
                  {getGaweIcon(gawe.titel)}
                </div>
                <div className="flex gap-1">
                  {gawe.is_betaald && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <DollarSign className="w-3 h-3" />
                      Betaald
                    </span>
                  )}
                  {gawe.is_vrywillig && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                      <Heart className="w-3 h-3" />
                      Vrywillig
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-[#002855] mb-2">
                {gawe.titel}
              </h3>

              {/* Description */}
              {gawe.beskrywing && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {gawe.beskrywing}
                </p>
              )}

              {/* User Info */}
              <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t border-gray-100">
                <User className="w-4 h-4" />
                <span>{gawe.gebruiker_naam} {gawe.gebruiker_van}</span>
              </div>

              {/* Gemeente */}
              {gawe.gemeente_naam && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{gawe.gemeente_naam}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {viewingGawe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#8B7CB3]/10 rounded-xl flex items-center justify-center text-[#8B7CB3]">
                  {getGaweIcon(viewingGawe.titel)}
                </div>
                <div className="flex gap-2">
                  {viewingGawe.is_betaald && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <DollarSign className="w-3 h-3" />
                      Betaald
                    </span>
                  )}
                  {viewingGawe.is_vrywillig && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                      <Heart className="w-3 h-3" />
                      Vrywillig
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingGawe(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#002855] mb-4">{viewingGawe.titel}</h2>
              
              {viewingGawe.beskrywing && (
                <p className="text-gray-700 whitespace-pre-wrap mb-6">{viewingGawe.beskrywing}</p>
              )}

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-[#002855] mb-3">Kontak Besonderhede</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{viewingGawe.gebruiker_naam} {viewingGawe.gebruiker_van}</span>
                  </div>
                  
                  {viewingGawe.kontak_metode && (
                    <p className="text-sm text-gray-600 bg-white p-2 rounded-lg border border-gray-200">
                      {viewingGawe.kontak_metode}
                    </p>
                  )}
                  
                  {viewingGawe.gebruiker_selfoon && (
                    <a
                      href={`tel:${viewingGawe.gebruiker_selfoon}`}
                      className="flex items-center gap-2 text-[#002855] hover:underline"
                    >
                      <Phone className="w-4 h-4" />
                      {viewingGawe.gebruiker_selfoon}
                    </a>
                  )}
                  
                  {viewingGawe.gebruiker_epos && (
                    <a
                      href={`mailto:${viewingGawe.gebruiker_epos}`}
                      className="flex items-center gap-2 text-[#002855] hover:underline"
                    >
                      <Mail className="w-4 h-4" />
                      {viewingGawe.gebruiker_epos}
                    </a>
                  )}
                </div>
              </div>

              {/* Gemeente Info */}
              {viewingGawe.gemeente_naam && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>Gemeente: {viewingGawe.gemeente_naam}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                {viewingGawe.gebruiker_selfoon && (
                  <a
                    href={`tel:${viewingGawe.gebruiker_selfoon}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#002855] text-white rounded-xl hover:bg-[#003d7a] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Skakel
                  </a>
                )}
                {viewingGawe.gebruiker_epos && (
                  <a
                    href={`mailto:${viewingGawe.gebruiker_epos}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#002855] text-[#002855] rounded-xl hover:bg-[#002855]/5 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    E-pos
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GawesSoek;
