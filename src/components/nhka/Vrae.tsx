import React, { useState } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { getVraagKategorieLabel, getVraagStatusLabel, canAnswerVrae, VraagStatus } from '@/types/nhka';
import { 
  HelpCircle, 
  Plus, 
  MessageSquare,
  Clock,
  CheckCircle,
  ChevronDown,
  Send,
  User
} from 'lucide-react';
import { toast } from 'sonner';

const Vrae: React.FC = () => {
  const { currentUser, gebruikers, vrae, addVraag, updateVraag } = useNHKA();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedVraag, setSelectedVraag] = useState<string | null>(null);
  const [antwoord, setAntwoord] = useState('');
  
  const [newVraag, setNewVraag] = useState({
    inhoud: '',
    kategorie: 'ander' as 'leerstellig' | 'pastoraal' | 'administratief' | 'ander'
  });

  if (!currentUser) return null;

  // Use canAnswerVrae to check if user can answer questions (includes predikant, ouderling, diaken)
  const canAnswer = canAnswerVrae(currentUser.rol);

  // Filter questions based on role
  const filteredVrae = vrae.filter(vraag => {
    // Users who can answer see all questions
    if (!canAnswer && vraag.gebruiker_id !== currentUser.id) return false;
    // Apply status filter
    if (filterStatus !== 'all' && vraag.status !== filterStatus) return false;
    return true;
  });

  const handleSubmit = async () => {
    if (!newVraag.inhoud) {
      toast.error('Voer asseblief jou vraag in');
      return;
    }

    await addVraag({
      ...newVraag,
      gebruiker_id: currentUser.id,
      status: 'nuut'
    });

    setNewVraag({ inhoud: '', kategorie: 'ander' });
    setShowForm(false);
    toast.success('Vraag suksesvol ingedien');
  };

  const handleAnswer = async (vraagId: string) => {
    if (!antwoord) {
      toast.error('Voer asseblief \'n antwoord in');
      return;
    }

    await updateVraag(vraagId, {
      antwoord,
      beantwoord_deur: currentUser.id,
      status: 'beantwoord'
    });

    setAntwoord('');
    setSelectedVraag(null);
    toast.success('Antwoord gestuur');
  };

  const handleStatusUpdate = async (vraagId: string, status: VraagStatus) => {
    await updateVraag(vraagId, { status });
    toast.success('Status opgedateer');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'nuut': return <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B7CB3]" />;
      case 'in_behandeling': return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A84B]" />;
      case 'beantwoord': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7A8450]" />;
      default: return <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nuut': return 'bg-[#8B7CB3]/10 text-[#8B7CB3] border-[#8B7CB3]/20';
      case 'in_behandeling': return 'bg-[#D4A84B]/10 text-[#D4A84B] border-[#D4A84B]/20';
      case 'beantwoord': return 'bg-[#7A8450]/10 text-[#7A8450] border-[#7A8450]/20';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getKategorieColor = (kategorie: string) => {
    switch (kategorie) {
      case 'leerstellig': return 'bg-[#002855] text-white';
      case 'pastoraal': return 'bg-[#8B7CB3] text-white';
      case 'administratief': return 'bg-[#D4A84B] text-[#002855]';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#002855] truncate">Vrae & Versoeke</h1>
          <p className="text-sm sm:text-base text-gray-500 truncate">
            {canAnswer ? 'Beantwoord lidmate se vrae' : 'Stel vrae aan die kerkraad'}
          </p>
        </div>
        {!canAnswer && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#8B7CB3] text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-[#7a6ba0] transition-colors shadow-lg flex-shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>Nuwe Vraag</span>
          </button>
        )}
      </div>

      {/* New Question Form */}
      {showForm && !canAnswer && (
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-[#8B7CB3]/20 shadow-sm overflow-hidden">
          <h2 className="text-base sm:text-lg font-bold text-[#002855] mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B7CB3] flex-shrink-0" />
            <span className="truncate">Stel 'n Vraag</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <div className="grid grid-cols-2 gap-2">
                {(['leerstellig', 'pastoraal', 'administratief', 'ander'] as const).map(kat => (
                  <button
                    key={kat}
                    type="button"
                    onClick={() => setNewVraag({ ...newVraag, kategorie: kat })}
                    className={`py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all border-2 truncate ${
                      newVraag.kategorie === kat
                        ? getKategorieColor(kat) + ' border-transparent'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {getVraagKategorieLabel(kat)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jou Vraag *</label>
              <textarea
                value={newVraag.inhoud}
                onChange={(e) => setNewVraag({ ...newVraag, inhoud: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#8B7CB3] focus:ring-2 focus:ring-[#8B7CB3]/20 outline-none resize-none text-sm sm:text-base"
                rows={4}
                placeholder="Skryf jou vraag of versoek hier..."
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              Kanselleer
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 sm:px-6 py-2 rounded-xl bg-[#8B7CB3] text-white text-sm sm:text-base font-semibold hover:bg-[#7a6ba0] transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Send className="w-4 h-4 flex-shrink-0" />
              <span>Stuur</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters (for users who can answer) */}
      {canAnswer && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="relative w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto pl-9 sm:pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white text-sm"
            >
              <option value="all">Alle Statusse</option>
              <option value="nuut">Nuut</option>
              <option value="in_behandeling">In Behandeling</option>
              <option value="beantwoord">Beantwoord</option>
            </select>
            <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Stats (for users who can answer) */}
      {canAnswer && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#8B7CB3]/10 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B7CB3]" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-[#8B7CB3]">
                  {vrae.filter(v => v.status === 'nuut').length}
                </p>
                <p className="text-xs text-gray-500 truncate">Nuwe Vrae</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#D4A84B]/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A84B]" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-[#D4A84B]">
                  {vrae.filter(v => v.status === 'in_behandeling').length}
                </p>
                <p className="text-xs text-gray-500 truncate">In Behandeling</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#7A8450]/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7A8450]" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-[#7A8450]">
                  {vrae.filter(v => v.status === 'beantwoord').length}
                </p>
                <p className="text-xs text-gray-500 truncate">Beantwoord</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {filteredVrae.length > 0 ? (
          filteredVrae.map(vraag => {
            const gebruiker = gebruikers.find(g => g.id === vraag.gebruiker_id);
            const beantwoordDeur = vraag.beantwoord_deur 
              ? gebruikers.find(g => g.id === vraag.beantwoord_deur)
              : null;
            
            return (
              <div 
                key={vraag.id} 
                className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusColor(vraag.status)}`}>
                    {getStatusIcon(vraag.status)}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    {/* Header with name and badges */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                        {canAnswer && (
                          <span className="font-semibold text-sm sm:text-base text-gray-900 truncate max-w-[150px] sm:max-w-none">
                            {gebruiker ? `${gebruiker.naam} ${gebruiker.van}` : 'Onbekend'}
                          </span>
                        )}
                        <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap ${getKategorieColor(vraag.kategorie)}`}>
                          {getVraagKategorieLabel(vraag.kategorie)}
                        </span>
                      </div>
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full border whitespace-nowrap self-start ${getStatusColor(vraag.status)}`}>
                        {getVraagStatusLabel(vraag.status)}
                      </span>
                    </div>
                    
                    {/* Question content */}
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-700 break-words whitespace-pre-wrap">{vraag.inhoud}</p>
                    </div>

                    {/* Answer section */}
                    {vraag.antwoord && (
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-[#7A8450]/10 rounded-lg border border-[#7A8450]/20">
                        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-[#7A8450] flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs font-medium text-[#7A8450] truncate">
                            Antwoord van {beantwoordDeur ? `${beantwoordDeur.naam}` : 'Kerkraad'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 break-words whitespace-pre-wrap">{vraag.antwoord}</p>
                      </div>
                    )}

                    <p className="mt-2 text-[10px] sm:text-xs text-gray-400">
                      {new Date(vraag.created_at).toLocaleDateString('af-ZA', { 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>

                    {/* Actions for users who can answer */}
                    {canAnswer && vraag.status !== 'beantwoord' && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                        {selectedVraag === vraag.id ? (
                          <div className="space-y-2 sm:space-y-3">
                            <textarea
                              value={antwoord}
                              onChange={(e) => setAntwoord(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none resize-none text-xs sm:text-sm"
                              rows={3}
                              placeholder="Skryf jou antwoord hier..."
                            />
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => { setSelectedVraag(null); setAntwoord(''); }}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors w-full sm:w-auto"
                              >
                                Kanselleer
                              </button>
                              <button
                                onClick={() => handleAnswer(vraag.id)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#7A8450] text-white hover:bg-[#6a7445] transition-colors flex items-center justify-center gap-1 w-full sm:w-auto"
                              >
                                <Send className="w-3 h-3 flex-shrink-0" />
                                <span>Stuur Antwoord</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => setSelectedVraag(vraag.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#7A8450] text-white hover:bg-[#6a7445] transition-colors w-full sm:w-auto"
                            >
                              Beantwoord
                            </button>
                            {vraag.status === 'nuut' && (
                              <button
                                onClick={() => handleStatusUpdate(vraag.id, 'in_behandeling')}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] transition-colors w-full sm:w-auto whitespace-nowrap"
                              >
                                In Behandeling
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl border border-gray-100 px-4">
            <HelpCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              {canAnswer ? 'Geen vrae om te beantwoord' : 'Geen vrae ingedien'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-sm mx-auto">
              {canAnswer 
                ? 'Alle vrae is beantwoord of daar is geen nuwe vrae nie' 
                : 'Klik op "Nuwe Vraag" om \'n vraag aan die kerkraad te stel'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vrae;
