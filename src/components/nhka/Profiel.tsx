import React, { useState, useRef, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { getRolLabel, GaweEnTalent, VerhoudingTipe, getVerhoudingLabel, Gebruiker, getOuderdom, getLidmaatDisplayNaam } from '@/types/nhka';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  Heart,
  Camera,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Briefcase,
  HandHeart,
  Info,
  Bell,
  Settings,
  Search,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationPreferences from './NotificationPreferences';

const Profiel: React.FC = () => {

  const {
    currentUser,
    currentGemeente,
    updateGebruiker,
    aksies,
    setCurrentUser,
    verhoudings,
    gebruikers, // to find local names if needed
    addVerhouding,
    deleteVerhouding,
    searchGlobalUsers
  } = useNHKA();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState({
    naam: '',
    van: '',
    selfoon: '',
    epos: '',
    adres: ''
  });

  // Gawes en Talente state
  const [gawes, setGawes] = useState<GaweEnTalent[]>([]);
  const [loadingGawes, setLoadingGawes] = useState(false);
  const [showAddGawe, setShowAddGawe] = useState(false);
  const [savingGawe, setSavingGawe] = useState(false);
  const [newGawe, setNewGawe] = useState({
    titel: '',
    beskrywing: '',
    is_betaald: false,
    is_vrywillig: true,
    kontak_metode: ''
  });

  // Verhoudings State
  const [showAddVerhouding, setShowAddVerhouding] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<Gebruiker[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedVerwanteUser, setSelectedVerwanteUser] = useState<Gebruiker | null>(null);
  const [newVerhouding, setNewVerhouding] = useState({
    verwante_id: '',
    verhouding_tipe: 'getroud' as VerhoudingTipe,
    verhouding_beskrywing: ''
  });

  useEffect(() => {
    if (showAddVerhouding) {
      setUserSearchQuery('');
      setUserSearchResults([]);
      setSearchingUsers(false);
      setSelectedVerwanteUser(null);
      setNewVerhouding(prev => ({ ...prev, verwante_id: '', verhouding_beskrywing: '' }));
    }
  }, [showAddVerhouding]);

  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const results = await searchGlobalUsers(query);
      setUserSearchResults(results.filter(u => u.id !== currentUser?.id));
    } catch (error) {
      console.error(error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddVerhouding = async () => {
    if (!currentUser || !newVerhouding.verwante_id) {
      toast.error('Kies asb \'n verwante');
      return;
    }

    if (newVerhouding.verhouding_tipe === 'ander' && !newVerhouding.verhouding_beskrywing.trim()) {
      toast.error('Beskryf asb die verhouding');
      return;
    }

    const verwanteData = selectedVerwanteUser || gebruikers.find(g => g.id === newVerhouding.verwante_id);
    const verwanteNaam = verwanteData ? `${verwanteData.naam} ${verwanteData.van}` : 'Onbekend';

    const result = await addVerhouding({
      lidmaat_id: currentUser.id,
      verwante_id: newVerhouding.verwante_id,
      verhouding_tipe: newVerhouding.verhouding_tipe,
      verhouding_beskrywing: newVerhouding.verhouding_tipe === 'ander' ? newVerhouding.verhouding_beskrywing : undefined
    });

    if (result.success) {
      toast.success('Verhouding suksesvol bygevoeg');
      setShowAddVerhouding(false);
    } else {
      toast.error(result.error || 'Kon nie verhouding byvoeg nie');
    }
  };

  const handleDeleteVerhouding = async (verhoudingId: string) => {
    if (!window.confirm('Is jy seker jy wil hierdie verhouding verwyder?')) return;
    await deleteVerhouding(verhoudingId);
    toast.success('Verhouding verwyder');
  };

  // Get my verhoudings filtered
  const myVerhoudings = currentUser ? verhoudings.filter(v => v.lidmaat_id === currentUser.id || v.verwante_id === currentUser.id) : [];

  // Fetch gawes on mount
  useEffect(() => {
    if (currentUser) {
      fetchGawes();
    }
  }, [currentUser]);

  const fetchGawes = async () => {
    if (!currentUser) return;
    setLoadingGawes(true);
    try {
      const { data, error } = await supabase
        .from('gawes_en_talente')
        .select('*')
        .eq('gebruiker_id', currentUser.id)
        .eq('aktief', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gawes:', error);
      } else {
        setGawes(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingGawes(false);
    }
  };

  const handleAddGawe = async () => {
    if (!currentUser || !newGawe.titel.trim()) {
      toast.error('Titel is verpligtend');
      return;
    }

    setSavingGawe(true);
    try {
      const { error } = await supabase
        .from('gawes_en_talente')
        .insert([{
          gebruiker_id: currentUser.id,
          gemeente_id: currentGemeente?.id,
          titel: newGawe.titel.trim(),
          beskrywing: newGawe.beskrywing.trim() || null,
          is_betaald: newGawe.is_betaald,
          is_vrywillig: newGawe.is_vrywillig,
          kontak_metode: newGawe.kontak_metode.trim() || null,
          aktief: true
        }]);

      if (error) throw error;

      toast.success('Gawe/Talent suksesvol bygevoeg');
      setNewGawe({
        titel: '',
        beskrywing: '',
        is_betaald: false,
        is_vrywillig: true,
        kontak_metode: ''
      });
      setShowAddGawe(false);
      await fetchGawes();
    } catch (err) {
      console.error('Error adding gawe:', err);
      toast.error('Kon nie gawe byvoeg nie');
    } finally {
      setSavingGawe(false);
    }
  };

  const handleDeleteGawe = async (gaweId: string) => {
    try {
      const { error } = await supabase
        .from('gawes_en_talente')
        .update({ aktief: false })
        .eq('id', gaweId);

      if (error) throw error;

      toast.success('Gawe/Talent verwyder');
      await fetchGawes();
    } catch (err) {
      console.error('Error deleting gawe:', err);
      toast.error('Kon nie gawe verwyder nie');
    }
  };

  if (!currentUser) return null;

  const startEditing = () => {
    setEditData({
      naam: currentUser.naam,
      van: currentUser.van,
      selfoon: currentUser.selfoon || '',
      epos: currentUser.epos || '',
      adres: currentUser.adres || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData.naam || !editData.van) {
      toast.error('Naam en van is verpligtend');
      return;
    }

    await updateGebruiker(currentUser.id, editData);
    setIsEditing(false);
    toast.success('Profiel suksesvol opgedateer');
  };

  // Handle profile photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Lêer is te groot. Maksimum grootte is 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Slegs beeldlêers word aanvaar.');
      return;
    }

    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-profile-pics')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Photo upload error:', uploadError);
        toast.error('Kon nie foto oplaai nie');
        setUploadingPhoto(false);
        return;
      }

      const { data } = supabase.storage
        .from('user-profile-pics')
        .getPublicUrl(fileName);

      // Update user in database
      const { error: updateError } = await supabase
        .from('gebruikers')
        .update({ profile_pic_url: data.publicUrl })
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('User update error:', updateError);
        toast.error('Kon nie profiel opdateer nie');
        setUploadingPhoto(false);
        return;
      }

      // Update current user in context
      setCurrentUser({ ...currentUser, profile_pic_url: data.publicUrl });

      toast.success('Profielfoto suksesvol opgedateer');
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error('Onbekende fout tydens oplaai');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Get user's pastoral actions received
  const myAksies = aksies.filter(a => a.gebruiker_id === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002855]">My Profiel</h1>
          <p className="text-gray-500">Bestuur jou persoonlike inligting en instellings</p>
        </div>
      </div>

      {/* Profile Tabs */}
      <Tabs defaultValue="profiel" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="profiel" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profiel
          </TabsTrigger>
          <TabsTrigger value="verhoudings" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Verhoudings
          </TabsTrigger>
          <TabsTrigger value="kennisgewings" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Kennisgewings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiel" className="space-y-6">
          {/* Edit Button */}
          <div className="flex justify-end">
            {!isEditing && (
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors shadow-lg"
              >
                <Edit className="w-5 h-5" />
                Wysig Profiel
              </button>
            )}
          </div>



          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header Banner */}
            <div className="h-32 bg-gradient-to-r from-[#002855] to-[#003d7a] relative">
              <div className="absolute -bottom-12 left-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white overflow-hidden">
                    {currentUser.profile_pic_url ? (
                      <img
                        src={currentUser.profile_pic_url}
                        alt={getLidmaatDisplayNaam(currentUser)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-[#002855]">
                        {(currentUser.noemnaam || currentUser.naam || '')[0]}{(currentUser.van || '')[0]}
                      </span>
                    )}
                  </div>
                  {/* Photo upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#D4A84B] flex items-center justify-center shadow-lg hover:bg-[#c49a3d] transition-colors disabled:opacity-50"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 text-[#002855] animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-[#002855]" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="pt-16 pb-6 px-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                      <input
                        type="text"
                        value={editData.naam}
                        onChange={(e) => setEditData({ ...editData, naam: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Van *</label>
                      <input
                        type="text"
                        value={editData.van}
                        onChange={(e) => setEditData({ ...editData, van: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selfoon</label>
                      <input
                        type="tel"
                        value={editData.selfoon}
                        onChange={(e) => setEditData({ ...editData, selfoon: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-pos</label>
                      <input
                        type="email"
                        value={editData.epos}
                        onChange={(e) => setEditData({ ...editData, epos: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                      <input
                        type="text"
                        value={editData.adres}
                        onChange={(e) => setEditData({ ...editData, adres: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Kanselleer
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 rounded-xl bg-[#7A8450] text-white font-semibold hover:bg-[#6a7445] transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Stoor
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {getLidmaatDisplayNaam(currentUser)}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="w-4 h-4 text-[#D4A84B]" />
                        <span className="text-[#D4A84B] font-medium">{getRolLabel(currentUser.rol)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Kontak Inligting</h3>

                      {currentUser.selfoon && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-[#002855]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Selfoon</p>
                            <a href={`tel:${currentUser.selfoon}`} className="font-medium text-gray-900 hover:text-[#002855]">
                              {currentUser.selfoon}
                            </a>
                          </div>
                        </div>
                      )}

                      {currentUser.epos && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-[#002855]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">E-pos</p>
                            <a href={`mailto:${currentUser.epos}`} className="font-medium text-gray-900 hover:text-[#002855]">
                              {currentUser.epos}
                            </a>
                          </div>
                        </div>
                      )}

                      {currentUser.adres && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-[#002855]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Adres</p>
                            <p className="font-medium text-gray-900">{currentUser.adres}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Addisionele Inligting</h3>

                      {currentUser.geboortedatum && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#8B7CB3]/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-[#8B7CB3]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Geboortedatum</p>
                            <p className="font-medium text-gray-900">
                              {new Date(currentUser.geboortedatum).toLocaleDateString('af-ZA', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                              {getOuderdom(currentUser.geboortedatum, currentUser.ouderdom) != null && (
                                <span className="text-gray-500 font-normal ml-1">
                                  ({getOuderdom(currentUser.geboortedatum, currentUser.ouderdom)} jaar oud)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {currentUser.laaste_kontak && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#7A8450]/10 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-[#7A8450]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Laaste Kontak</p>
                            <p className="font-medium text-gray-900">
                              {new Date(currentUser.laaste_kontak).toLocaleDateString('af-ZA', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Gawes en Talente Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4A84B]/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#D4A84B]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#002855]">Gawes en Talente</h3>
                  <p className="text-sm text-gray-500">Deel jou vaardighede met die gemeente</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddGawe(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Voeg By
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-[#002855]/5 border border-[#002855]/10 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#002855] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[#002855] font-medium">Wat is Gawes en Talente?</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Hierdie is vaardighede wat jy het en met ander kan deel. Dit kan <strong>betaalde dienste</strong> wees
                    wat deur ander lidmate ondersteun kan word, of <strong>vrywillige bydraes</strong> tot opbou van die gemeente.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-gray-600">
                      <Briefcase className="w-3 h-3" /> Ek kan sweis
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-gray-600">
                      <HandHeart className="w-3 h-3" /> Ek kan skilder
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-gray-600">
                      <Briefcase className="w-3 h-3" /> Ek kan bak
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-gray-600">
                      <HandHeart className="w-3 h-3" /> Ek kan musiek maak
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gawes List */}
            {loadingGawes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-[#D4A84B] animate-spin" />
              </div>
            ) : gawes.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Jy het nog geen gawes of talente bygevoeg nie</p>
                <p className="text-sm text-gray-400 mt-1">Klik "Voeg By" om jou eerste gawe by te voeg</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gawes.map(gawe => (
                  <div
                    key={gawe.id}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-[#D4A84B]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${gawe.is_betaald ? 'bg-[#D4A84B]/10' : 'bg-[#7A8450]/10'
                          }`}>
                          {gawe.is_betaald ? (
                            <Briefcase className={`w-5 h-5 ${gawe.is_betaald ? 'text-[#D4A84B]' : 'text-[#7A8450]'}`} />
                          ) : (
                            <HandHeart className="w-5 h-5 text-[#7A8450]" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{gawe.titel}</h4>
                          {gawe.beskrywing && (
                            <p className="text-sm text-gray-600 mt-1">{gawe.beskrywing}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {gawe.is_betaald && (
                              <span className="px-2 py-0.5 bg-[#D4A84B]/10 text-[#D4A84B] text-xs font-medium rounded-full">
                                Betaalde Diens
                              </span>
                            )}
                            {gawe.is_vrywillig && (
                              <span className="px-2 py-0.5 bg-[#7A8450]/10 text-[#7A8450] text-xs font-medium rounded-full">
                                Vrywillig
                              </span>
                            )}
                          </div>
                          {gawe.kontak_metode && (
                            <p className="text-xs text-gray-500 mt-2">
                              Kontak: {gawe.kontak_metode}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGawe(gawe.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Verwyder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pastoral Care History */}
          {myAksies.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-[#002855] mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#7A8450]" />
                Pastorale Sorg Ontvang
              </h3>
              <div className="space-y-3">
                {myAksies.slice(0, 5).map(aksie => (
                  <div key={aksie.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-[#7A8450]/10 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-[#7A8450]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{aksie.tipe}</p>
                      {aksie.nota && (
                        <p className="text-sm text-gray-500 truncate">{aksie.nota}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(aksie.datum).toLocaleDateString('af-ZA', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spiritual Quote */}
          <div className="bg-[#8B7CB3]/10 rounded-xl p-6 border border-[#8B7CB3]/20">
            <p className="text-[#8B7CB3] italic text-lg leading-relaxed text-center">
              "Want waar twee of drie in my Naam vergader, daar is Ek in hulle midde."
            </p>
            <p className="text-[#8B7CB3]/70 text-sm mt-3 text-center font-medium">— Matteus 18:20</p>
          </div>

          {/* Add Gawe Modal */}
          {showAddGawe && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D4A84B]/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#D4A84B]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#002855]">Voeg Gawe/Talent By</h2>
                      <p className="text-sm text-gray-500">Deel jou vaardigheid met die gemeente</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddGawe(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titel / Vaardigheid *</label>
                    <input
                      type="text"
                      value={newGawe.titel}
                      onChange={(e) => setNewGawe({ ...newGawe, titel: e.target.value })}
                      placeholder="bv. Ek kan sweis, Ek kan skilder"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing</label>
                    <textarea
                      value={newGawe.beskrywing}
                      onChange={(e) => setNewGawe({ ...newGawe, beskrywing: e.target.value })}
                      rows={3}
                      placeholder="Vertel meer oor jou vaardigheid..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Diens</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={newGawe.is_vrywillig}
                          onChange={(e) => setNewGawe({ ...newGawe, is_vrywillig: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-[#7A8450] focus:ring-[#7A8450]"
                        />
                        <div className="flex items-center gap-2">
                          <HandHeart className="w-4 h-4 text-[#7A8450]" />
                          <span className="text-sm font-medium text-gray-700">Vrywillige bydrae tot opbou van die gemeente</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={newGawe.is_betaald}
                          onChange={(e) => setNewGawe({ ...newGawe, is_betaald: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-[#D4A84B] focus:ring-[#D4A84B]"
                        />
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[#D4A84B]" />
                          <span className="text-sm font-medium text-gray-700">Betaalde diens wat deur ander ondersteun kan word</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kontak Metode (opsioneel)</label>
                    <input
                      type="text"
                      value={newGawe.kontak_metode}
                      onChange={(e) => setNewGawe({ ...newGawe, kontak_metode: e.target.value })}
                      placeholder="bv. WhatsApp, E-pos, Selfoon"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 p-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowAddGawe(false)}
                    className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Kanselleer
                  </button>
                  <button
                    onClick={handleAddGawe}
                    disabled={savingGawe || !newGawe.titel.trim()}
                    className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingGawe ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Stoor...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Voeg By
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>



        {/* Verhoudings Tab */}
        <TabsContent value="verhoudings" className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#002855]">My Verhoudings</h3>
                <p className="text-sm text-gray-500">Bestuur jou familiebande en verhoudings</p>
              </div>
              <button
                onClick={() => setShowAddVerhouding(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Voeg By
              </button>
            </div>

            <div className="space-y-3">
              {myVerhoudings.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Geen verhoudings gelys nie</p>
                  <p className="text-sm text-gray-400 mt-1">Klik "Voeg By" om familie by te voeg</p>
                </div>
              ) : (
                myVerhoudings.map(v => {
                  // Find the other person
                  const otherId = v.lidmaat_id === currentUser?.id ? v.verwante_id : v.lidmaat_id;
                  // Try finding in local users, if not found, we might need to fetch or use stored name (if we had it)
                  // For now, if not in local users, we might show 'Lidmaat in ander gemeente' or just show ID if we can't resolve name quickly without a fetch. 
                  // Ideally 'verhoudings' should maybe join user data, but let's see. 
                  // Wait, 'verhoudings' usually just has IDs. AdminPanel filtered. 
                  // If we want to show names of people in OTHER municipalities, we need that data.
                  // 'verhoudings' in context fetches all verhoudings for the GEMEENTE. 
                  // If I add a relationship with someone in ANOTHER gemeente, will it show up here?
                  // The 'verhoudings' subscription in NHKAContext filters by gemeente_id? 
                  // Let's assume for now we only see relationships stored in THIS gemeente context or related to THIS user.
                  // Actually, if I add a relationship, the 'verhouding' record is created. 
                  // If I'm related to someone in another gemeente, I need to be able to see their name.
                  // The `verhoudings` state in context comes from `verhoudings` table.
                  // We might need to fetch the user details for these IDs if they are not in `gebruikers`.
                  // For this MVP, let's try to find them in `gebruikers` (local) first. 
                  // If not found, we might display "Lidmaat (Ander Gemeente)".

                  const otherUser = gebruikers.find(u => u.id === otherId);
                  // If not found locally, we might need a way to show name. 
                  // But let's proceed with local check for now, optimizing later if needed.

                  const verhoudingLabel = v.verhouding_tipe === 'ander'
                    ? v.verhouding_beskrywing
                    : getVerhoudingLabel(v.verhouding_tipe);

                  return (
                    <div key={v.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center text-white font-bold">
                          {otherUser ? `${otherUser.naam[0]}${otherUser.van[0]}` : '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#002855]">
                            {otherUser ? `${otherUser.naam} ${otherUser.van}` : 'Lidmaat (Ander Gemeente/Laai...)'}
                          </p>
                          <p className="text-sm text-[#D4A84B]">{verhoudingLabel}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteVerhouding(v.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Verwyder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        {/* Notification Preferences Tab */}
        <TabsContent value="kennisgewings">
          <NotificationPreferences />
        </TabsContent>

        {/* Add Verhouding Modal */}
        {showAddVerhouding && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#002855]">Voeg Verhouding By</h2>
                <button
                  onClick={() => setShowAddVerhouding(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verhouding Tipe *</label>
                  <div className="relative">
                    <select
                      value={newVerhouding.verhouding_tipe}
                      onChange={(e) => setNewVerhouding({ ...newVerhouding, verhouding_tipe: e.target.value as VerhoudingTipe })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white"
                    >
                      <option value="getroud">Getroud met</option>
                      <option value="kind">Kind van</option>
                      <option value="ouer">Ouer van</option>
                      <option value="ander">Ander</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {newVerhouding.verhouding_tipe === 'ander' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beskryf Verhouding *</label>
                    <input
                      type="text"
                      value={newVerhouding.verhouding_beskrywing}
                      onChange={(e) => setNewVerhouding({ ...newVerhouding, verhouding_beskrywing: e.target.value })}
                      placeholder="bv. Skoonsuster, Neef, ens."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verwante Lidmaat (Soek)</label>

                  {selectedVerwanteUser ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-[#D4A84B]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#002855] flex items-center justify-center text-white text-xs">
                          {selectedVerwanteUser.naam[0]}{selectedVerwanteUser.van[0]}
                        </div>
                        <div>
                          <p className="font-medium text-[#002855]">{selectedVerwanteUser.naam} {selectedVerwanteUser.van}</p>
                          <p className="text-xs text-gray-500">{(selectedVerwanteUser as any).gemeente?.naam || 'Onbekend'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedVerwanteUser(null);
                          setNewVerhouding(prev => ({ ...prev, verwante_id: '' }));
                          setUserSearchQuery('');
                        }}
                        className="p-1 hover:bg-gray-200 rounded-full"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        placeholder="Tik naam of van..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                      />
                      {searchingUsers && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#D4A84B]" />
                        </div>
                      )}

                      {userSearchResults.length > 0 && !selectedVerwanteUser && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-48 overflow-y-auto z-50">
                          {userSearchResults.map(user => (
                            <button
                              key={user.id}
                              onClick={() => {
                                setSelectedVerwanteUser(user);
                                setNewVerhouding(prev => ({ ...prev, verwante_id: user.id }));
                                setUserSearchResults([]);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                            >
                              <p className="font-medium text-[#002855]">{user.naam} {user.van}</p>
                              <p className="text-xs text-gray-500">{(user as any).gemeente?.naam || 'Onbekend'}</p>
                            </button>
                          ))}
                        </div>
                      )}
                      {userSearchQuery.length >= 2 && !searchingUsers && userSearchResults.length === 0 && (
                        <p className="text-xs text-red-500 mt-1 ml-1">Geen gebruikers gevind nie</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAddVerhouding(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Kanselleer
                </button>
                <button
                  onClick={handleAddVerhouding}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] transition-colors"
                >
                  Voeg By
                </button>
              </div>
            </div>
          </div>
        )}
      </Tabs>
    </div >
  );
};

export default Profiel;
