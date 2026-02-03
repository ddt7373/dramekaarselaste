import React, { useState } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import {
  getRolLabel,
  UserRole,
  canManageWyke,
  Wyk,
  Besoekpunt,
  Gebruiker,
  getVerhoudingLabel,
  VerhoudingTipe,
  getLidmaatDisplayNaam
} from '@/types/nhka';
import {
  MapPin,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Users,
  Home,
  UserPlus,
  Trash2,
  Edit2,
  Heart,
  Link2
} from 'lucide-react';
import { toast } from 'sonner';

const WykeBestuur: React.FC = () => {
  const {
    currentUser,
    gebruikers,
    wyke,
    besoekpunte,
    verhoudings,
    addWyk,
    updateWyk,
    deleteWyk,
    addBesoekpunt,
    updateBesoekpunt,
    deleteBesoekpunt,
    assignLidmaatToBesoekpunt,
    addVerhouding,
    deleteVerhouding
  } = useNHKA();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedWyk, setExpandedWyk] = useState<string | null>(null);
  const [expandedBesoekpunt, setExpandedBesoekpunt] = useState<string | null>(null);

  // Modal states
  const [showAddWyk, setShowAddWyk] = useState(false);
  const [showAddBesoekpunt, setShowAddBesoekpunt] = useState(false);
  const [showAssignLidmaat, setShowAssignLidmaat] = useState(false);
  const [showAddVerhouding, setShowAddVerhouding] = useState(false);
  const [selectedWykId, setSelectedWykId] = useState<string>('');
  const [selectedBesoekpuntId, setSelectedBesoekpuntId] = useState<string>('');
  const [selectedLidmaatId, setSelectedLidmaatId] = useState<string>('');

  // Form states
  const [newWyk, setNewWyk] = useState({ naam: '', beskrywing: '', leier_id: '' });
  const [newBesoekpunt, setNewBesoekpunt] = useState({ naam: '', beskrywing: '', adres: '' });
  const [newVerhouding, setNewVerhouding] = useState({
    verwante_id: '',
    verhouding_tipe: 'getroud' as VerhoudingTipe,
    verhouding_beskrywing: ''
  });

  if (!currentUser || !canManageWyke(currentUser.rol)) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Jy het nie toegang tot hierdie afdeling nie</p>
      </div>
    );
  }

  // Filter wyke
  const filteredWyke = wyke.filter(w =>
    w.naam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get besoekpunte for a wyk
  const getBesoekpunteForWyk = (wykId: string) =>
    besoekpunte.filter(b => b.wyk_id === wykId);

  // Get lidmate for a besoekpunt
  const getLidmateForBesoekpunt = (besoekpuntId: string) =>
    gebruikers.filter(g => g.besoekpunt_id === besoekpuntId);

  // Get lidmate for a wyk but not assigned to any besoekpunt
  const getLidmateForWykWithoutBesoekpunt = (wykId: string) =>
    gebruikers.filter(g => g.wyk_id === wykId && !g.besoekpunt_id);

  // Get unassigned lidmate
  const getUnassignedLidmate = () =>
    gebruikers.filter(g => !g.besoekpunt_id && g.rol === 'lidmaat');

  // Get verhoudings for a lidmaat
  const getVerhoudingsForLidmaat = (lidmaatId: string) =>
    verhoudings.filter(v => v.lidmaat_id === lidmaatId || v.verwante_id === lidmaatId);

  // Get leiers for dropdown
  const leiers = gebruikers.filter(g =>
    ['predikant', 'ouderling', 'diaken', 'groepleier', 'kerkraad'].includes(g.rol)
  );

  // Handlers
  const handleAddWyk = async () => {
    if (!newWyk.naam.trim()) {
      toast.error('Wyk naam is verpligtend');
      return;
    }

    const result = await addWyk({
      naam: newWyk.naam,
      beskrywing: newWyk.beskrywing || undefined,
      leier_id: newWyk.leier_id || undefined
    });

    if (result.success) {
      toast.success('Wyk suksesvol bygevoeg');
      setNewWyk({ naam: '', beskrywing: '', leier_id: '' });
      setShowAddWyk(false);
    } else {
      toast.error(result.error || 'Kon nie wyk byvoeg nie');
    }
  };

  const handleAddBesoekpunt = async () => {
    if (!newBesoekpunt.naam.trim()) {
      toast.error('Besoekpunt naam is verpligtend');
      return;
    }

    const result = await addBesoekpunt({
      naam: newBesoekpunt.naam,
      beskrywing: newBesoekpunt.beskrywing || undefined,
      adres: newBesoekpunt.adres || undefined,
      wyk_id: selectedWykId
    });

    if (result.success) {
      toast.success('Besoekpunt suksesvol bygevoeg');
      setNewBesoekpunt({ naam: '', beskrywing: '', adres: '' });
      setShowAddBesoekpunt(false);
    } else {
      toast.error(result.error || 'Kon nie besoekpunt byvoeg nie');
    }
  };

  const handleAssignLidmaat = async (lidmaatId: string) => {
    await assignLidmaatToBesoekpunt(lidmaatId, selectedBesoekpuntId);
    toast.success('Lidmaat suksesvol toegeken');
    setShowAssignLidmaat(false);
  };

  const handleRemoveLidmaat = async (lidmaatId: string) => {
    await assignLidmaatToBesoekpunt(lidmaatId, null);
    toast.success('Lidmaat verwyder van besoekpunt');
  };

  const handleAddVerhouding = async () => {
    if (!newVerhouding.verwante_id) {
      toast.error('Kies asb \'n verwante');
      return;
    }

    if (newVerhouding.verhouding_tipe === 'ander' && !newVerhouding.verhouding_beskrywing.trim()) {
      toast.error('Beskryf asb die verhouding');
      return;
    }

    const result = await addVerhouding({
      lidmaat_id: selectedLidmaatId,
      verwante_id: newVerhouding.verwante_id,
      verhouding_tipe: newVerhouding.verhouding_tipe,
      verhouding_beskrywing: newVerhouding.verhouding_tipe === 'ander' ? newVerhouding.verhouding_beskrywing : undefined
    });

    if (result.success) {
      toast.success('Verhouding suksesvol bygevoeg');
      setNewVerhouding({ verwante_id: '', verhouding_tipe: 'getroud', verhouding_beskrywing: '' });
      setShowAddVerhouding(false);
    } else {
      toast.error(result.error || 'Kon nie verhouding byvoeg nie');
    }
  };

  const handleDeleteWyk = async (wykId: string) => {
    if (confirm('Is jy seker jy wil hierdie wyk verwyder? Alle besoekpunte sal ook verwyder word.')) {
      await deleteWyk(wykId);
      toast.success('Wyk suksesvol verwyder');
    }
  };

  const handleDeleteBesoekpunt = async (besoekpuntId: string) => {
    if (confirm('Is jy seker jy wil hierdie besoekpunt verwyder?')) {
      await deleteBesoekpunt(besoekpuntId);
      toast.success('Besoekpunt suksesvol verwyder');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-[#002855]">Wyke & Besoekpunte</h2>
          <p className="text-gray-500 text-sm">Bestuur wyke, besoekpunte en lidmate</p>
        </div>
        <button
          onClick={() => setShowAddWyk(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuwe Wyk
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Soek wyke..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
        />
      </div>

      {/* Wyke List */}
      <div className="space-y-4">
        {filteredWyke.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Geen wyke gevind nie</p>
            <button
              onClick={() => setShowAddWyk(true)}
              className="mt-4 text-[#D4A84B] font-medium hover:underline"
            >
              Skep eerste wyk
            </button>
          </div>
        ) : (
          filteredWyke.map(wyk => {
            const wykBesoekpunte = getBesoekpunteForWyk(wyk.id);
            const leier = gebruikers.find(g => g.id === wyk.leier_id);
            const isExpanded = expandedWyk === wyk.id;
            const totalLidmate = wykBesoekpunte.reduce((sum, bp) =>
              sum + getLidmateForBesoekpunt(bp.id).length, 0
            );

            return (
              <div key={wyk.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Wyk Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedWyk(isExpanded ? null : wyk.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#002855]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#002855]">{wyk.naam}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{wykBesoekpunte.length} besoekpunte</span>
                          <span>{totalLidmate} lidmate</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {leier && (
                        <span className="text-sm text-gray-500 hidden sm:block">
                          Leier: {getLidmaatDisplayNaam(leier)}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWyk(wyk.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    {/* Add Besoekpunt Button */}
                    <button
                      onClick={() => {
                        setSelectedWykId(wyk.id);
                        setShowAddBesoekpunt(true);
                      }}
                      className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[#7A8450] text-white font-medium rounded-lg hover:bg-[#6a7445] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Nuwe Besoekpunt
                    </button>

                    {/* Besoekpunte List */}
                    <div className="space-y-3">
                      {wykBesoekpunte.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4 text-center">
                          Geen besoekpunte in hierdie wyk nie
                        </p>
                      ) : (
                        wykBesoekpunte.map(bp => {
                          const bpLidmate = getLidmateForBesoekpunt(bp.id);
                          const isBpExpanded = expandedBesoekpunt === bp.id;

                          return (
                            <div key={bp.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Besoekpunt Header */}
                              <div
                                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedBesoekpunt(isBpExpanded ? null : bp.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Home className="w-5 h-5 text-[#7A8450]" />
                                    <div>
                                      <p className="font-medium text-gray-900">{bp.naam}</p>
                                      {bp.adres && (
                                        <p className="text-xs text-gray-500">{bp.adres}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">{bpLidmate.length} lidmate</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBesoekpunt(bp.id);
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    {isBpExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Besoekpunt Expanded - Lidmate */}
                              {isBpExpanded && (
                                <div className="border-t border-gray-100 p-3 bg-gray-50">
                                  {/* Add Lidmaat Button */}
                                  <button
                                    onClick={() => {
                                      setSelectedBesoekpuntId(bp.id);
                                      setShowAssignLidmaat(true);
                                    }}
                                    className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#8B7CB3] text-white font-medium rounded-lg hover:bg-[#7a6ba0] transition-colors"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    Voeg Lidmaat By
                                  </button>

                                  {/* Lidmate List */}
                                  <div className="space-y-2">
                                    {bpLidmate.length === 0 ? (
                                      <p className="text-gray-500 text-xs py-2 text-center">
                                        Geen lidmate toegeken nie
                                      </p>
                                    ) : (
                                      bpLidmate.map(lidmaat => {
                                        const lidmaatVerhoudings = getVerhoudingsForLidmaat(lidmaat.id);

                                        return (
                                          <div key={lidmaat.id} className="bg-white rounded-lg p-2.5 border border-gray-100">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-[#002855] flex items-center justify-center overflow-hidden flex-shrink-0">
                                                  {lidmaat.profile_pic_url ? (
                                                    <img src={lidmaat.profile_pic_url} alt="" className="w-full h-full object-cover" />
                                                  ) : (
                                                    <span className="text-white text-xs font-bold">
                                                      {(lidmaat.noemnaam || lidmaat.naam || '')[0]}{(lidmaat.van || '')[0]}
                                                    </span>
                                                  )}
                                                </div>
                                                <div>
                                                  <p className="text-sm font-medium text-gray-900">
                                                    {getLidmaatDisplayNaam(lidmaat)}
                                                  </p>
                                                  {lidmaat.selfoon && (
                                                    <p className="text-xs text-gray-500">{lidmaat.selfoon}</p>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => {
                                                    setSelectedLidmaatId(lidmaat.id);
                                                    setShowAddVerhouding(true);
                                                  }}
                                                  className="p-1.5 text-gray-400 hover:text-[#D4A84B] transition-colors"
                                                  title="Voeg verhouding by"
                                                >
                                                  <Link2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => handleRemoveLidmaat(lidmaat.id)}
                                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                  title="Verwyder van besoekpunt"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Verhoudings */}
                                            {lidmaatVerhoudings.length > 0 && (
                                              <div className="mt-2 pt-2 border-t border-gray-100">
                                                <div className="flex flex-wrap gap-1.5">
                                                  {lidmaatVerhoudings.map(v => {
                                                    const verwante = gebruikers.find(g =>
                                                      g.id === (v.lidmaat_id === lidmaat.id ? v.verwante_id : v.lidmaat_id)
                                                    );
                                                    if (!verwante) return null;

                                                    return (
                                                      <div
                                                        key={v.id}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D4A84B]/10 text-[#D4A84B] text-xs rounded-full"
                                                      >
                                                        <Heart className="w-3 h-3" />
                                                        <span>
                                                          {v.verhouding_tipe === 'ander'
                                                            ? v.verhouding_beskrywing
                                                            : getVerhoudingLabel(v.verhouding_tipe)
                                                          }: {verwante.naam}
                                                        </span>
                                                        <button
                                                          onClick={() => deleteVerhouding(v.id)}
                                                          className="ml-1 hover:text-red-500"
                                                        >
                                                          <X className="w-3 h-3" />
                                                        </button>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Show lidmate in this wyk that are not assigned to a besoekpunt */}
                    {getLidmateForWykWithoutBesoekpunt(wyk.id).length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-gray-400" />
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lidmate sonder besoekpunt</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {getLidmateForWykWithoutBesoekpunt(wyk.id).map(lidmaat => (
                            <div key={lidmaat.id} className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                  {lidmaat.profile_pic_url ? (
                                    <img src={lidmaat.profile_pic_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-400 text-xs font-bold">
                                      {(lidmaat.noemnaam || lidmaat.naam || '')[0]}{(lidmaat.van || '')[0]}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{getLidmaatDisplayNaam(lidmaat)}</p>
                                  {lidmaat.selfoon && <p className="text-[10px] text-gray-500">{lidmaat.selfoon}</p>}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedLidmaatId(lidmaat.id);
                                  setShowAddVerhouding(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-[#D4A84B] transition-colors"
                                title="Voeg verhouding by"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Wyk Modal */}
      {showAddWyk && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#002855]">Nuwe Wyk</h2>
              <button
                onClick={() => setShowAddWyk(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wyk Naam *</label>
                <input
                  type="text"
                  value={newWyk.naam}
                  onChange={(e) => setNewWyk({ ...newWyk, naam: e.target.value })}
                  placeholder="bv. Wyk Noord"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing</label>
                <textarea
                  value={newWyk.beskrywing}
                  onChange={(e) => setNewWyk({ ...newWyk, beskrywing: e.target.value })}
                  placeholder="Opsionele beskrywing..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wykleier</label>
                <div className="relative">
                  <select
                    value={newWyk.leier_id}
                    onChange={(e) => setNewWyk({ ...newWyk, leier_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white"
                  >
                    <option value="">Kies wykleier (opsioneel)</option>
                    {leiers.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.naam} {l.van} ({getRolLabel(l.rol)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowAddWyk(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Kanselleer
              </button>
              <button
                onClick={handleAddWyk}
                className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] transition-colors"
              >
                Skep Wyk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Besoekpunt Modal */}
      {showAddBesoekpunt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#002855]">Nuwe Besoekpunt</h2>
              <button
                onClick={() => setShowAddBesoekpunt(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Besoekpunt Naam *</label>
                <input
                  type="text"
                  value={newBesoekpunt.naam}
                  onChange={(e) => setNewBesoekpunt({ ...newBesoekpunt, naam: e.target.value })}
                  placeholder="bv. Van der Merwe Gesin"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <input
                  type="text"
                  value={newBesoekpunt.adres}
                  onChange={(e) => setNewBesoekpunt({ ...newBesoekpunt, adres: e.target.value })}
                  placeholder="bv. Kerkstraat 123, Pretoria"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing</label>
                <textarea
                  value={newBesoekpunt.beskrywing}
                  onChange={(e) => setNewBesoekpunt({ ...newBesoekpunt, beskrywing: e.target.value })}
                  placeholder="Opsionele notas..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowAddBesoekpunt(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Kanselleer
              </button>
              <button
                onClick={handleAddBesoekpunt}
                className="flex-1 py-2 px-4 rounded-xl bg-[#7A8450] text-white font-semibold hover:bg-[#6a7445] transition-colors"
              >
                Skep Besoekpunt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Lidmaat Modal */}
      {showAssignLidmaat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#002855]">Voeg Lidmaat By</h2>
              <button
                onClick={() => setShowAssignLidmaat(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {getUnassignedLidmate().length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Alle lidmate is reeds toegeken aan besoekpunte
                </p>
              ) : (
                <div className="space-y-2">
                  {getUnassignedLidmate().map(lidmaat => (
                    <button
                      key={lidmaat.id}
                      onClick={() => handleAssignLidmaat(lidmaat.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#D4A84B] hover:bg-[#D4A84B]/5 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {lidmaat.profile_pic_url ? (
                          <img src={lidmaat.profile_pic_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-sm font-bold">
                            {(lidmaat.noemnaam || lidmaat.naam || '')[0]}{(lidmaat.van || '')[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{getLidmaatDisplayNaam(lidmaat)}</p>
                        {lidmaat.selfoon && (
                          <p className="text-sm text-gray-500">{lidmaat.selfoon}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Verwante Lidmaat *</label>
                <div className="relative">
                  <select
                    value={newVerhouding.verwante_id}
                    onChange={(e) => setNewVerhouding({ ...newVerhouding, verwante_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white"
                  >
                    <option value="">Kies verwante...</option>
                    {gebruikers
                      .filter(g => g.id !== selectedLidmaatId)
                      .map(g => (
                        <option key={g.id} value={g.id}>
                          {g.naam} {g.van}
                        </option>
                      ))
                    }
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
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
    </div>
  );
};

export default WykeBestuur;
