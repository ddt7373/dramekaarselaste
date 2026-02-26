import React, { useState, useMemo, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { Church, ChevronRight, Plus, Search, Users, MapPin, Star, Shield, Loader2, UserCog, X, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { sortGemeentesWithUserFirst, getLastSelectedGemeente, saveLastSelectedGemeente } from '@/constants/gemeentes';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/693a23272f683bba6f73274f_1766339692475_f44b3809.png';

const GemeenteSelect: React.FC = () => {
  const {
    gemeentes,
    selectGemeente,
    setCurrentView,
    loading,
    loginAsHoofAdmin,
    loginAsModerator
  } = useNHKA();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGemeente, setSelectedGemeente] = useState<string>('');
  const [lastGemeenteNaam, setLastGemeenteNaam] = useState<string | null>(null);
  const [showGemeentePopup, setShowGemeentePopup] = useState(false);

  // Special login state
  const [loginMode, setLoginMode] = useState<'gemeente' | 'hoof_admin' | 'moderator'>('gemeente');
  const [specialLoginLoading, setSpecialLoginLoading] = useState(false);
  const [specialLoginCredentials, setSpecialLoginCredentials] = useState({
    epos: '',
    wagwoord: ''
  });

  // Load last selected gemeente from localStorage on mount
  useEffect(() => {
    const lastGemeente = getLastSelectedGemeente();
    if (lastGemeente) {
      setLastGemeenteNaam(lastGemeente);
    }
  }, []);

  // Sort gemeentes with user's last gemeente first, then filter by search
  const sortedAndFilteredGemeentes = useMemo(() => {
    // First sort with user's gemeente first
    const sorted = sortGemeentesWithUserFirst(gemeentes, lastGemeenteNaam);

    // Then filter by search term
    if (!searchTerm) return sorted;
    return sorted.filter(g => g.naam.toLowerCase().includes(searchTerm.toLowerCase()) || g.adres?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [gemeentes, lastGemeenteNaam, searchTerm]);

  // Get selected gemeente object
  const selectedGemeenteObj = useMemo(() => {
    return gemeentes.find(g => g.id === selectedGemeente);
  }, [gemeentes, selectedGemeente]);

  const handleGemeenteClick = (gemeenteId: string) => {
    setSelectedGemeente(gemeenteId);
    setShowGemeentePopup(true);
  };

  const handleSelect = () => {
    if (selectedGemeente) {
      const gemeente = gemeentes.find(g => g.id === selectedGemeente);
      if (gemeente) {
        // Save to localStorage for next time
        saveLastSelectedGemeente(gemeente.naam);
      }
      selectGemeente(selectedGemeente);
    }
  };

  const handleClosePopup = () => {
    setShowGemeentePopup(false);
  };

  const handleChooseAnother = () => {
    setShowGemeentePopup(false);
    setSelectedGemeente('');
  };

  const handleRegisterGemeente = () => {
    setCurrentView('gemeente-register');
  };

  const handleSpecialLogin = async () => {
    if (!specialLoginCredentials.epos || !specialLoginCredentials.wagwoord) {
      toast.error('Vul asb e-pos en wagwoord in');
      return;
    }
    setSpecialLoginLoading(true);
    let result;
    if (loginMode === 'hoof_admin') {
      result = await loginAsHoofAdmin(specialLoginCredentials.epos, specialLoginCredentials.wagwoord);
    } else if (loginMode === 'moderator') {
      result = await loginAsModerator(specialLoginCredentials.epos, specialLoginCredentials.wagwoord);
    }
    setSpecialLoginLoading(false);
    if (result && !result.success) {
      toast.error(result.error || 'Kon nie aanmeld nie');
    }
  };

  const resetLoginMode = () => {
    setLoginMode('gemeente');
    setSpecialLoginCredentials({
      epos: '',
      wagwoord: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002855] via-[#003366] to-[#001a3d] flex flex-col">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Popup Modal for Selected Gemeente */}
      {showGemeentePopup && selectedGemeenteObj && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClosePopup}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            {/* Gemeente Info */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-[#D4A84B]">
                {selectedGemeenteObj.logo_url ? (
                  <img
                    src={selectedGemeenteObj.logo_url}
                    alt={selectedGemeenteObj.naam}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Church className="w-10 h-10 text-[#002855]" />
                )}
              </div>
              <h3 className="text-xl font-bold text-[#002855] mb-1">
                {selectedGemeenteObj.naam}
              </h3>
              {selectedGemeenteObj.is_demo && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#D4A84B]/20 text-[#D4A84B] text-sm font-medium rounded-full mb-2">
                  <Star className="w-3 h-3" />
                  Demo Gemeente
                </span>
              )}
              {selectedGemeenteObj.adres && (
                <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedGemeenteObj.adres}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSelect}
                className="w-full py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Gaan Voort
              </button>

              <button
                onClick={handleChooseAnother}
                className="w-full py-3 rounded-xl font-medium text-gray-600 hover:text-[#002855] hover:bg-gray-100 transition-all"
              >
                Kies 'n ander gemeente
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-white p-2 shadow-2xl">
            <img src={LOGO_URL} alt="Dra Mekaar se Laste Logo" className="w-full h-full rounded-full object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Dra mekaar se laste</h1>
          <p className="text-[#D4A84B] text-lg md:text-xl font-medium">
            NHKA Pastorale Sorg Platform
          </p>
          <p className="text-white/60 mt-2 max-w-md mx-auto">
            {loginMode === 'gemeente' ? 'Kies jou gemeente om voort te gaan' : loginMode === 'hoof_admin' ? 'Hoof Administrateur Aanmelding' : 'VBO Moderator Aanmelding'}
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-lg">
          {loginMode === 'gemeente' ? (
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                  <Church className="w-5 h-5 text-[#D4A84B]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#002855]">Kies Gemeente</h2>
                  <p className="text-gray-500 text-sm">Soek en kies jou gemeente</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Soek gemeente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none transition-colors"
                />
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-[#D4A84B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-500">Laai gemeentes...</p>
                </div>
              ) : (
                <>
                  {/* Info about user's gemeente */}
                  {lastGemeenteNaam && !searchTerm && (
                    <div className="mb-4 px-3 py-2 bg-[#D4A84B]/10 rounded-lg border border-[#D4A84B]/30">
                      <p className="text-sm text-[#002855] leading-relaxed">
                        <Star className="w-4 h-4 inline-block mr-1 text-[#D4A84B] flex-shrink-0" />
                        <span>Jou vorige gemeente </span>
                        <strong className="break-words">{lastGemeenteNaam}</strong>
                        <span> word eerste gewys</span>
                      </p>
                    </div>
                  )}

                  {/* Register Button - Prominent at the top */}
                  <button
                    onClick={handleRegisterGemeente}
                    className="w-full mb-4 py-3 rounded-xl font-medium text-[#002855] border-2 border-[#002855] hover:bg-[#002855] hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Registreer Nuwe Gemeente
                  </button>

                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                    <div className="h-px flex-1 bg-gray-200"></div>
                    <span>of kies bestaande gemeente</span>
                    <div className="h-px flex-1 bg-gray-200"></div>
                  </div>

                  {/* Gemeente List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                    {sortedAndFilteredGemeentes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Church className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Geen gemeentes gevind nie</p>
                        <p className="text-xs mt-1">Klik op "Registreer Nuwe Gemeente" hierbo</p>
                      </div>
                    ) : (
                      sortedAndFilteredGemeentes.map((gemeente, index) => {
                        const isUserGemeente = gemeente.naam === lastGemeenteNaam;
                        const isSelected = selectedGemeente === gemeente.id;
                        return (
                          <button
                            key={gemeente.id}
                            onClick={() => handleGemeenteClick(gemeente.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isSelected
                              ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                              : isUserGemeente
                                ? 'border-[#D4A84B]/50 bg-[#D4A84B]/5 hover:border-[#D4A84B]'
                                : 'border-gray-200 hover:border-[#D4A84B]/50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                                {gemeente.logo_url ? (
                                  <img src={gemeente.logo_url} alt={gemeente.naam} className="w-full h-full object-cover" />
                                ) : (
                                  <Church className="w-6 h-6 text-[#002855]" />
                                )}
                                {isUserGemeente && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4A84B] rounded-full flex items-center justify-center">
                                    <Star className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="text-left min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900 truncate">{gemeente.naam}</p>
                                  {gemeente.is_demo && (
                                    <span className="px-2 py-0.5 bg-[#D4A84B]/20 text-[#D4A84B] text-xs font-medium rounded-full flex items-center gap-1 flex-shrink-0">
                                      <Star className="w-3 h-3" />
                                      Demo
                                    </span>
                                  )}
                                  {isUserGemeente && !searchTerm && index === 0 && (
                                    <span className="px-2 py-0.5 bg-[#002855]/10 text-[#002855] text-xs font-medium rounded-full flex-shrink-0">
                                      Jou Gemeente
                                    </span>
                                  )}
                                </div>
                                {gemeente.adres && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{gemeente.adres}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#D4A84B]/20 flex items-center justify-center flex-shrink-0 ml-2">
                              <ChevronRight className="w-4 h-4 text-[#D4A84B]" />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Special Login Card (Hoof Admin or Moderator) */
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${loginMode === 'hoof_admin' ? 'bg-[#D4A84B]' : 'bg-[#8B7CB3]'}`}>
                  {loginMode === 'hoof_admin' ? <Shield className="w-5 h-5 text-[#002855]" /> : <UserCog className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#002855]">
                    {loginMode === 'hoof_admin' ? 'Hoof / Sub-Admin' : 'VBO Moderator'}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {loginMode === 'hoof_admin' ? 'Meld aan as hoof- of sub-administrateur' : 'Meld aan met jou moderator besonderhede'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-pos</label>
                  <input
                    type="email"
                    value={specialLoginCredentials.epos}
                    onChange={e => setSpecialLoginCredentials({
                      ...specialLoginCredentials,
                      epos: e.target.value
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none transition-colors"
                    placeholder={loginMode === 'hoof_admin' ? 'admin@nhka.co.za' : 'moderator@nhka.co.za'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wagwoord</label>
                  <input
                    type="password"
                    value={specialLoginCredentials.wagwoord}
                    onChange={e => setSpecialLoginCredentials({
                      ...specialLoginCredentials,
                      wagwoord: e.target.value
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none transition-colors"
                    placeholder="••••••••"
                    onKeyDown={e => e.key === 'Enter' && handleSpecialLogin()}
                  />
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <button
                  onClick={handleSpecialLogin}
                  disabled={specialLoginLoading}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${loginMode === 'hoof_admin' ? 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d]' : 'bg-[#8B7CB3] text-white hover:bg-[#7a6ba3]'}`}
                >
                  {specialLoginLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Besig...
                    </>
                  ) : 'Meld Aan'}
                </button>

                <button
                  onClick={resetLoginMode}
                  className="w-full py-3 rounded-xl font-medium text-gray-600 hover:text-[#002855] transition-colors"
                >
                  Terug na Gemeente Keuse
                </button>
              </div>
            </div>
          )}

          {/* Special Login Toggles */}
          {loginMode === 'gemeente' && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={() => setLoginMode('hoof_admin')}
                className="text-white/60 hover:text-[#D4A84B] text-sm transition-colors flex items-center gap-2 mt-4"
              >
                <Shield className="w-4 h-4" />
                Hoof / Sub-Administrateur Aanmelding
              </button>
              <button
                onClick={() => setLoginMode('moderator')}
                className="text-white/60 hover:text-[#8B7CB3] text-sm transition-colors flex items-center gap-2"
              >
                <UserCog className="w-4 h-4" />
                VBO Moderator Aanmelding
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-white/40 text-sm mt-8 text-center">Ontwerp deur Deon du Toit: deon7373@gmail.com</p>
      </div>
    </div>
  );
};

export default GemeenteSelect;
