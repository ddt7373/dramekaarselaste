import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import {
  VBOIndiening,
  VBOIndieningStatus,
  VBOAktiwiteit,
  VBOAktiwiteitTipe,
  getVBOAktiwiteitTipeLabel,
  VBOHistoriesePunte
} from '@/types/nhka';
import { HistoricalVBOImport } from './HistoricalVBOImport';
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2,
  Search,
  Eye,
  ChevronDown,
  Users,
  Calendar,
  Sparkles,
  Plus,
  Edit2,
  Save,
  BookOpen,
  GraduationCap,
  Video,
  UserCheck,
  PenTool,
  Book,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface DBVBOIndiening {
  id: string;
  predikant_id: string;
  aktiwiteit_id: string;
  aktiwiteit_titel: string;
  aktiwiteit_tipe: string;
  krediete: number;
  status: string;
  notas?: string;
  bewys_url?: string;
  bewys_naam?: string;
  moderator_id?: string;
  moderator_notas?: string;
  goedgekeur_op?: string;
  jaar: number;
  is_outomaties: boolean;
  kursus_id?: string;
  created_at: string;
  updated_at: string;
}

interface Predikant {
  id: string;
  naam: string;
  van: string;
  rol: string;
}

const VBOBestuur: React.FC = () => {
  const { currentUser, kursusse } = useNHKA();

  const [activeTab, setActiveTab] = useState<'indienings' | 'aktiwiteite' | 'histories'>('indienings');
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [historicalPoints, setHistoricalPoints] = useState<VBOHistoriesePunte[]>([]);
  const [saving, setSaving] = useState(false);
  const [alleIndienings, setAlleIndienings] = useState<(DBVBOIndiening & { predikant?: Predikant })[]>([]);
  const [aktiwiteite, setAktiwiteite] = useState<VBOAktiwiteit[]>([]);
  const [predikante, setPredikante] = useState<Predikant[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<'alle' | VBOIndieningStatus>('hangende');
  const [searchQuery, setSearchQuery] = useState('');

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedIndiening, setSelectedIndiening] = useState<(DBVBOIndiening & { predikant?: Predikant }) | null>(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'goedgekeur' as VBOIndieningStatus,
    notas: '',
    krediete_toegeken: 0
  });

  // Aktiwiteite bestuur
  const [showAddAktiwiteit, setShowAddAktiwiteit] = useState(false);
  const [showEditAktiwiteit, setShowEditAktiwiteit] = useState(false);
  const [editingAktiwiteit, setEditingAktiwiteit] = useState<VBOAktiwiteit | null>(null);
  const [newAktiwiteit, setNewAktiwiteit] = useState({
    titel: '',
    beskrywing: '',
    tipe: 'kursus' as VBOAktiwiteitTipe,
    krediete: 1,
    kursus_id: '',
    bewyse_verplig: true
  });

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch VBO aktiwiteite
      const { data: aktData, error: aktError } = await supabase
        .from('vbo_aktiwiteite')
        .select('*')
        .order('titel', { ascending: true });

      if (!aktError && aktData?.length) {
        setAktiwiteite(aktData.map((a: any) => ({
          id: a.id,
          titel: a.titel,
          beskrywing: a.beskrywing,
          tipe: a.tipe as VBOAktiwiteitTipe,
          krediete: a.krediete ?? 0,
          kursus_id: a.kursus_id,
          bewyse_verplig: a.bewyse_verplig ?? true,
          aktief: a.aktief ?? true,
          created_at: a.created_at,
          updated_at: a.updated_at
        })));
      }

      // Fetch all submissions
      const { data: indieningsData, error: indieningsError } = await supabase
        .from('vbo_indienings')
        .select('*')
        .eq('jaar', selectedYear)
        .order('created_at', { ascending: false });

      if (indieningsError) throw indieningsError;

      // Fetch predikante info
      const predikantIds = [...new Set((indieningsData || []).map(i => i.predikant_id))];

      if (predikantIds.length > 0) {
        const { data: predikanteData } = await supabase
          .from('gebruikers')
          .select('id, naam, van, rol')
          .in('id', predikantIds);

        setPredikante(predikanteData || []);

        const predikantMap = new Map((predikanteData || []).map(p => [p.id, p]));

        const indieningsWithPredikant = (indieningsData || []).map(i => ({
          ...i,
          predikant: predikantMap.get(i.predikant_id)
        }));

        setAlleIndienings(indieningsWithPredikant);
      } else {
        setAlleIndienings(indieningsData || []);
      }
    } catch (error) {
      console.error('Error loading VBO data:', error);
      toast.error('Kon nie VBO data laai nie');
    }
    setLoading(false);
  };

  const loadHistoricalData = async () => {
    try {
      const { data, error } = await supabase
        .from('vbo_historiese_punte')
        .select('*, predikant:predikant_id(naam, van)')
        .order('jaar', { ascending: false });

      if (error) throw error;
      setHistoricalPoints(data || []);
    } catch (e) {
      console.error("Error loading historical points:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'histories') {
      loadHistoricalData();
    }
  }, [activeTab]);

  const handleReviewIndiening = async () => {
    if (!selectedIndiening || !currentUser) return;

    setSaving(true);
    try {
      const updateData: any = {
        status: reviewForm.status,
        moderator_id: currentUser.id,
        moderator_notas: reviewForm.notas,
        updated_at: new Date().toISOString()
      };

      if (reviewForm.status === 'goedgekeur') {
        updateData.goedgekeur_op = new Date().toISOString();
        updateData.krediete = reviewForm.krediete_toegeken;
      }

      const { error } = await supabase
        .from('vbo_indienings')
        .update(updateData)
        .eq('id', selectedIndiening.id);

      if (error) throw error;

      toast.success(`Indiening ${reviewForm.status === 'goedgekeur' ? 'goedgekeur' : 'afgekeur'}`);
      await loadData();
    } catch (error) {
      console.error('Error reviewing:', error);
      toast.error('Kon nie indiening opdateer nie');
    }

    setShowReviewModal(false);
    setSelectedIndiening(null);
    setReviewForm({ status: 'goedgekeur', notas: '', krediete_toegeken: 0 });
    setSaving(false);
  };

  const handleAddAktiwiteit = async () => {
    if (!newAktiwiteit.titel || !newAktiwiteit.beskrywing) {
      toast.error('Titel en beskrywing is verpligtend');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vbo_aktiwiteite')
        .insert({
          titel: newAktiwiteit.titel,
          beskrywing: newAktiwiteit.beskrywing,
          tipe: newAktiwiteit.tipe,
          krediete: newAktiwiteit.krediete,
          kursus_id: newAktiwiteit.kursus_id || null,
          bewyse_verplig: newAktiwiteit.bewyse_verplig,
          aktief: true,
          created_by: currentUser?.id,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      setShowAddAktiwiteit(false);
      setNewAktiwiteit({ titel: '', beskrywing: '', tipe: 'kursus', krediete: 1, kursus_id: '', bewyse_verplig: true });
      toast.success('Aktiwiteit suksesvol bygevoeg');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Kon nie aktiwiteit stoor nie');
    }
    setSaving(false);
  };

  const handleUpdateAktiwiteit = async () => {
    if (!editingAktiwiteit) return;
    if (!editingAktiwiteit.titel || !editingAktiwiteit.beskrywing) {
      toast.error('Titel en beskrywing is verpligtend');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vbo_aktiwiteite')
        .update({
          titel: editingAktiwiteit.titel,
          beskrywing: editingAktiwiteit.beskrywing,
          tipe: editingAktiwiteit.tipe,
          krediete: editingAktiwiteit.krediete,
          kursus_id: editingAktiwiteit.kursus_id || null,
          bewyse_verplig: editingAktiwiteit.bewyse_verplig,
          aktief: editingAktiwiteit.aktief,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAktiwiteit.id);
      if (error) throw error;
      toast.success('Aktiwiteit opgedateer');
      setShowEditAktiwiteit(false);
      setEditingAktiwiteit(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Kon nie aktiwiteit opdateer nie');
    }
    setSaving(false);
  };

  const handleToggleAktiwiteitAktief = async (aktiwiteit: VBOAktiwiteit) => {
    try {
      const { error } = await supabase
        .from('vbo_aktiwiteite')
        .update({ aktief: !aktiwiteit.aktief, updated_at: new Date().toISOString() })
        .eq('id', aktiwiteit.id);
      if (error) throw error;
      toast.success(aktiwiteit.aktief ? 'Aktiwiteit gedeaktiveer' : 'Aktiwiteit geaktiveer');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Kon nie status verander nie');
    }
  };

  const getAktiwiteitIcon = (tipe: VBOAktiwiteitTipe) => {
    switch (tipe) {
      case 'kursus': return <GraduationCap className="w-5 h-5" />;
      case 'konferensie': return <Users className="w-5 h-5" />;
      case 'werkwinkel': return <Video className="w-5 h-5" />;
      case 'mentorskap': return <UserCheck className="w-5 h-5" />;
      case 'navorsing': return <Book className="w-5 h-5" />;
      case 'publikasie': return <PenTool className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'goedgekeur':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            Goedgekeur
          </span>
        );
      case 'afgekeur':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            Afgekeur
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Hangende
          </span>
        );
    }
  };

  const getTipeBadge = (tipe: string) => {
    const colors: Record<string, string> = {
      kursus: 'bg-blue-100 text-blue-700',
      konferensie: 'bg-purple-100 text-purple-700',
      werkwinkel: 'bg-orange-100 text-orange-700',
      mentorskap: 'bg-pink-100 text-pink-700',
      navorsing: 'bg-teal-100 text-teal-700',
      publikasie: 'bg-indigo-100 text-indigo-700',
      ander: 'bg-gray-100 text-gray-700'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[tipe] || colors.ander}`}>
        {getVBOAktiwiteitTipeLabel(tipe as VBOAktiwiteitTipe)}
      </span>
    );
  };

  // Filter submissions
  const filteredIndienings = alleIndienings.filter(i => {
    const matchesStatus = statusFilter === 'alle' || i.status === statusFilter;
    const matchesSearch = searchQuery === '' ||
      `${i.predikant?.naam} ${i.predikant?.van}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.aktiwiteit_titel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const hangendeCount = alleIndienings.filter(i => i.status === 'hangende').length;
  const goedgekeurCount = alleIndienings.filter(i => i.status === 'goedgekeur').length;
  const totaleKrediete = alleIndienings
    .filter(i => i.status === 'goedgekeur')
    .reduce((sum, i) => sum + (i.krediete || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#D4A84B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Tabs: Indienings | Aktiwiteite */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('indienings')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'indienings' ? 'bg-[#002855] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Indienings
        </button>
        <button
          onClick={() => setActiveTab('aktiwiteite')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'aktiwiteite' ? 'bg-[#002855] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Aktiwiteite Bestuur
        </button>
        <button
          onClick={() => setActiveTab('histories')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'histories' ? 'bg-[#002855] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Historiese Data
        </button>
      </div>

      {activeTab === 'indienings' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-[#002855]">{hangendeCount}</p>
                  <p className="text-xs text-gray-500 truncate">Hangende</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-green-600">{goedgekeurCount}</p>
                  <p className="text-xs text-gray-500 truncate">Goedgekeur</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#D4A84B]/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-[#D4A84B]">{totaleKrediete}</p>
                  <p className="text-xs text-gray-500 truncate">Krediete</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#002855]/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-[#002855]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-[#002855]">{predikante.length}</p>
                  <p className="text-xs text-gray-500 truncate">Predikante</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Soek predikant of aktiwiteit..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <div className="relative flex-shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none bg-white text-sm"
                >
                  <option value="hangende">Hangende</option>
                  <option value="goedgekeur">Goedgekeur</option>
                  <option value="afgekeur">Afgekeur</option>
                  <option value="alle">Alle</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative flex-shrink-0">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="appearance-none pl-9 pr-8 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none bg-white text-sm"
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Submissions List */}
          {filteredIndienings.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {statusFilter === 'hangende' ? 'Geen hangende indienings' : 'Geen indienings gevind'}
              </h3>
              <p className="text-gray-500">
                {statusFilter === 'hangende'
                  ? 'Alle indienings is reeds verwerk'
                  : 'Probeer ander soek kriteria'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Predikant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aktiwiteit</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Krediete</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Datum</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredIndienings.map(indiening => (
                      <tr key={indiening.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#002855] flex items-center justify-center text-white text-xs font-bold">
                              {indiening.predikant?.naam?.[0]}{indiening.predikant?.van?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {indiening.predikant?.naam} {indiening.predikant?.van}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">{indiening.aktiwiteit_titel}</span>
                            {indiening.is_outomaties && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#D4A84B]/10 text-[#D4A84B] text-xs font-medium rounded">
                                <Sparkles className="w-3 h-3" />
                                Auto
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getTipeBadge(indiening.aktiwiteit_tipe)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-lg font-bold text-[#D4A84B]">
                            {indiening.krediete || '?'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(indiening.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(indiening.created_at).toLocaleDateString('af-ZA')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {indiening.bewys_url && (
                              <a
                                href={indiening.bewys_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#002855] transition-colors"
                                title="Bekyk Bewys"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                            {indiening.status === 'hangende' && (
                              <button
                                onClick={() => {
                                  setSelectedIndiening(indiening);
                                  setReviewForm({
                                    status: 'goedgekeur',
                                    notas: '',
                                    krediete_toegeken: indiening.krediete || 0
                                  });
                                  setShowReviewModal(true);
                                }}
                                className="px-3 py-1.5 bg-[#002855] text-white text-xs font-medium rounded-lg hover:bg-[#001d40] transition-colors"
                              >
                                Hersien
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Review Modal */}
          {showReviewModal && selectedIndiening && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-[#002855]">Hersien VBO Indiening</h2>
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedIndiening(null);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Submission Details */}
                  <div className="bg-[#002855]/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTipeBadge(selectedIndiening.aktiwiteit_tipe)}
                        {selectedIndiening.is_outomaties && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#D4A84B]/10 text-[#D4A84B] text-xs font-medium rounded-full">
                            <Sparkles className="w-3 h-3" />
                            Outomaties
                          </span>
                        )}
                      </div>
                      <span className="text-xl font-bold text-[#D4A84B]">
                        {selectedIndiening.krediete === 0 ? 'Op meriete' : `${selectedIndiening.krediete} krediete`}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#002855] mb-2">{selectedIndiening.aktiwiteit_titel}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 rounded-full bg-[#002855] flex items-center justify-center text-white text-xs font-bold">
                        {selectedIndiening.predikant?.naam?.[0]}{selectedIndiening.predikant?.van?.[0]}
                      </div>
                      <span>{selectedIndiening.predikant?.naam} {selectedIndiening.predikant?.van}</span>
                    </div>
                  </div>

                  {/* Notes from predikant */}
                  {selectedIndiening.notas && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Predikant Notas</label>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedIndiening.notas}</p>
                    </div>
                  )}

                  {/* Proof file */}
                  {selectedIndiening.bewys_naam && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bewys Lêer</label>
                      <a
                        href={selectedIndiening.bewys_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#002855] hover:text-[#D4A84B] transition-colors bg-gray-50 rounded-lg p-3"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="flex-1">{selectedIndiening.bewys_naam}</span>
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Credits assignment - verplig vir "op meriete", opsioneel vir ander (kan oorskryf) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Krediete Toe te Ken {selectedIndiening.krediete === 0 ? '(op meriete)' : '(kan oorskryf)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={reviewForm.krediete_toegeken}
                      onChange={(e) => setReviewForm({ ...reviewForm, krediete_toegeken: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedIndiening.krediete === 0 ? 'Bepaal die krediete gebaseer op die meriete van die indiening' : 'Laat leeg om oorspronklike krediete te behou'}
                    </p>
                  </div>

                  {/* Decision */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Besluit</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setReviewForm({ ...reviewForm, status: 'goedgekeur' })}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${reviewForm.status === 'goedgekeur'
                          ? 'bg-green-100 text-green-700 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                          }`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        Goedkeur
                      </button>
                      <button
                        onClick={() => setReviewForm({ ...reviewForm, status: 'afgekeur' })}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${reviewForm.status === 'afgekeur'
                          ? 'bg-red-100 text-red-700 border-2 border-red-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                          }`}
                      >
                        <XCircle className="w-5 h-5" />
                        Keur Af
                      </button>
                    </div>
                  </div>

                  {/* Moderator notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas vir Predikant</label>
                    <textarea
                      value={reviewForm.notas}
                      onChange={(e) => setReviewForm({ ...reviewForm, notas: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                      placeholder="Voeg notas by vir die predikant..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 p-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedIndiening(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Kanselleer
                  </button>
                  <button
                    onClick={handleReviewIndiening}
                    disabled={saving}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${reviewForm.status === 'goedgekeur'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verwerk...
                      </>
                    ) : reviewForm.status === 'goedgekeur' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Goedkeur
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Keur Af
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'aktiwiteite' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#002855]">VBO Aktiwiteite</h3>
            <button
              onClick={() => setShowAddAktiwiteit(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nuwe Aktiwiteit
            </button>
          </div>

          {aktiwiteite.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Geen VBO aktiwiteite nie</p>
              <button
                onClick={() => setShowAddAktiwiteit(true)}
                className="mt-3 px-4 py-2 bg-[#D4A84B] text-[#002855] font-medium rounded-lg hover:bg-[#c49a3d]"
              >
                Voeg eerste aktiwiteit by
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Titel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Krediete</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bewys</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {aktiwiteite.map(aktiwiteit => (
                    <tr key={aktiwiteit.id} className={`hover:bg-gray-50 ${!aktiwiteit.aktief ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{aktiwiteit.titel}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{aktiwiteit.beskrywing}</p>
                      </td>
                      <td className="px-4 py-3">{getTipeBadge(aktiwiteit.tipe)}</td>
                      <td className="px-4 py-3 text-lg font-bold text-[#D4A84B]">
                        {aktiwiteit.krediete === 0 ? 'Op meriete' : aktiwiteit.krediete}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {aktiwiteit.bewyse_verplig ? 'Ja' : 'Nee'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${aktiwiteit.aktief ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {aktiwiteit.aktief ? 'Aktief' : 'Onaktief'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingAktiwiteit({ ...aktiwiteit }); setShowEditAktiwiteit(true); }}
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                            title="Wysig"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAktiwiteitAktief(aktiwiteit)}
                            className={`p-1.5 rounded-lg transition-colors ${aktiwiteit.aktief ? 'hover:bg-amber-100 text-amber-600' : 'hover:bg-green-100 text-green-600'}`}
                            title={aktiwiteit.aktief ? 'Deaktiveer' : 'Aktiveer'}
                          >
                            {aktiwiteit.aktief ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Aktiwiteit Modal */}
      {showAddAktiwiteit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#002855]">Nuwe VBO Aktiwiteit</h2>
              <button onClick={() => setShowAddAktiwiteit(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={newAktiwiteit.titel}
                  onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, titel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                  placeholder="bv. Jaarlikse Sinodale Konferensie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing *</label>
                <textarea
                  value={newAktiwiteit.beskrywing}
                  onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, beskrywing: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                  placeholder="Beskryf die aktiwiteit..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    value={newAktiwiteit.tipe}
                    onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, tipe: e.target.value as VBOAktiwiteitTipe })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none bg-white"
                  >
                    <option value="kursus">LMS Kursus</option>
                    <option value="konferensie">Konferensie</option>
                    <option value="werkwinkel">Werkwinkel</option>
                    <option value="mentorskap">Mentorskap</option>
                    <option value="navorsing">Navorsing</option>
                    <option value="publikasie">Publikasie</option>
                    <option value="ander">Ander</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Krediete</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newAktiwiteit.krediete}
                    onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, krediete: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = Op meriete beoordeel</p>
                </div>
              </div>
              {newAktiwiteit.tipe === 'kursus' && kursusse.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gekoppelde LMS Kursus</label>
                  <select
                    value={newAktiwiteit.kursus_id}
                    onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, kursus_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none bg-white"
                  >
                    <option value="">Kies kursus...</option>
                    {kursusse.map(k => (
                      <option key={k.id} value={k.id}>{k.titel}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bewyse_verplig"
                  checked={newAktiwiteit.bewyse_verplig}
                  onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, bewyse_verplig: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#D4A84B] focus:ring-[#D4A84B]"
                />
                <label htmlFor="bewyse_verplig" className="text-sm text-gray-700">Bewys lêer verpligtend</label>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button onClick={() => setShowAddAktiwiteit(false)} className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                Kanselleer
              </button>
              <button onClick={handleAddAktiwiteit} disabled={saving} className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Stoor</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Aktiwiteit Modal */}
      {showEditAktiwiteit && editingAktiwiteit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#002855]">Wysig VBO Aktiwiteit</h2>
              <button onClick={() => { setShowEditAktiwiteit(false); setEditingAktiwiteit(null); }} className="p-2 rounded-lg hover:bg-gray-100">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={editingAktiwiteit.titel}
                  onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, titel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing *</label>
                <textarea
                  value={editingAktiwiteit.beskrywing}
                  onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, beskrywing: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    value={editingAktiwiteit.tipe}
                    onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, tipe: e.target.value as VBOAktiwiteitTipe })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none bg-white"
                  >
                    <option value="kursus">LMS Kursus</option>
                    <option value="konferensie">Konferensie</option>
                    <option value="werkwinkel">Werkwinkel</option>
                    <option value="mentorskap">Mentorskap</option>
                    <option value="navorsing">Navorsing</option>
                    <option value="publikasie">Publikasie</option>
                    <option value="ander">Ander</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Krediete</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editingAktiwiteit.krediete}
                    onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, krediete: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAktiwiteit.bewyse_verplig}
                    onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, bewyse_verplig: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#D4A84B]"
                  />
                  <span className="text-sm text-gray-700">Bewys verpligtend</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAktiwiteit.aktief}
                    onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, aktief: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#D4A84B]"
                  />
                  <span className="text-sm text-gray-700">Aktief</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button onClick={() => { setShowEditAktiwiteit(false); setEditingAktiwiteit(null); }} className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                Kanselleer
              </button>
              <button onClick={handleUpdateAktiwiteit} disabled={saving} className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Stoor</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'histories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#002855]">Historiese VBO Krediete</h3>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors"
            >
              <Upload className="w-5 h-5" />
              Voer Data In (CSV)
            </button>
          </div>

          {showImportModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <HistoricalVBOImport
                onClose={() => setShowImportModal(false)}
                onComplete={() => {
                  setShowImportModal(false);
                  loadHistoricalData();
                }}
              />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Predikant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Jaar</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Krediete</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Beskrywing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historicalPoints.map((point) => (
                  <tr key={point.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {(point as any).predikant ? `${(point as any).predikant?.naam} ${(point as any).predikant?.van}` : (
                        <span className="text-yellow-600 italic">{(point as any).csv_naam} {(point as any).csv_van} (Ongekoppel)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{point.jaar}</td>
                    <td className="px-4 py-3 font-bold text-[#D4A84B]">{point.punte}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{point.beskrywing || '-'}</td>
                  </tr>
                ))}
                {historicalPoints.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Geen historiese data gevind nie.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VBOBestuur;
