import React, { useState, useRef, useMemo } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Church, ArrowLeft, Upload, MapPin, Phone, Mail, Globe, CheckCircle, AlertCircle, Loader2, Search, ChevronDown, Edit3 } from 'lucide-react';
import { NHKA_GEMEENTES } from '@/constants/gemeentes';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/693a23272f683bba6f73274f_1766339692475_f44b3809.png';

interface FormData {
  naam: string;
  customNaam: string; // For when "ANDER" is selected
  beskrywing: string;
  adres: string;
  telefoon: string;
  epos: string;
  webwerf: string;
}

const GemeenteRegister: React.FC = () => {
  const { setCurrentView, registerGemeente, refreshGemeentes, gemeentes } = useNHKA();
  const [step, setStep] = useState<'info' | 'logo' | 'complete'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [registeredGemeenteId, setRegisteredGemeenteId] = useState<string>('');
  const [showGemeenteDropdown, setShowGemeenteDropdown] = useState(false);
  const [gemeenteSearch, setGemeenteSearch] = useState('');
  const [isAnderSelected, setIsAnderSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    naam: '',
    customNaam: '',
    beskrywing: '',
    adres: '',
    telefoon: '',
    epos: '',
    webwerf: ''
  });

  // Filter gemeentes that are not yet registered and match search
  const availableGemeentes = useMemo(() => {
    // Debug logging
    console.log('Total NHKA_GEMEENTES:', NHKA_GEMEENTES.length);
    console.log('Current Search:', gemeenteSearch);

    if (!NHKA_GEMEENTES || NHKA_GEMEENTES.length === 0) {
      console.error('NHKA_GEMEENTES is empty or undefined!');
      return [];
    }

    const registeredNames = gemeentes.map(g => g.naam.toLowerCase());
    const filtered = NHKA_GEMEENTES.filter(naam => {
      const isNotRegistered = !registeredNames.includes(naam.toLowerCase());
      const matchesSearch = naam.toLowerCase().includes(gemeenteSearch.toLowerCase());
      return isNotRegistered && matchesSearch;
    });

    console.log('Filtered Gemeentes count:', filtered.length);
    if (filtered.length === 0) console.log('Registered names:', registeredNames);

    return filtered;
  }, [gemeentes, gemeenteSearch]);

  // Check if "ANDER" matches search - Always show it to allow new registrations
  const showAnderOption = useMemo(() => {
    return true; // Always show ANDER option so users can select it even if they searched for something else
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleGemeenteSelect = (naam: string) => {
    if (naam === 'ANDER') {
      setIsAnderSelected(true);
      setFormData(prev => ({ ...prev, naam: 'ANDER', customNaam: '' }));
    } else {
      setIsAnderSelected(false);
      setFormData(prev => ({ ...prev, naam, customNaam: '' }));
    }
    setShowGemeenteDropdown(false);
    setGemeenteSearch('');
    setError('');
  };

  const handleCustomNaamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, customNaam: e.target.value }));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Lêer is te groot. Maksimum grootte is 5MB.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Slegs beeldlêers word aanvaar.');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const uploadLogo = async (gemeenteId: string): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${gemeenteId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gemeente-logos')
        .upload(fileName, logoFile, { upsert: true });

      if (uploadError) {
        console.error('Logo upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('gemeente-logos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('Logo upload error:', err);
      return null;
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine the final gemeente name
    const finalNaam = isAnderSelected ? formData.customNaam.trim() : formData.naam.trim();

    if (!finalNaam) {
      if (isAnderSelected) {
        setError('Voer asseblief die nuwe gemeente naam in');
      } else {
        setError('Gemeente naam is verpligtend');
      }
      return;
    }

    // If "ANDER" is selected, validate the custom name
    if (isAnderSelected) {
      // Check if the custom name already exists in the official list
      const existsInOfficialList = NHKA_GEMEENTES.some(
        g => g.toLowerCase() === finalNaam.toLowerCase()
      );

      if (existsInOfficialList) {
        setError('Hierdie gemeente bestaan reeds in die amptelike lys. Kies dit asseblief uit die lys.');
        return;
      }

      // Check if already registered
      const isAlreadyRegistered = gemeentes.some(
        g => g.naam.toLowerCase() === finalNaam.toLowerCase()
      );

      if (isAlreadyRegistered) {
        setError('Hierdie gemeente is reeds geregistreer.');
        return;
      }

      // Validate minimum length
      if (finalNaam.length < 2) {
        setError('Gemeente naam moet ten minste 2 karakters wees.');
        return;
      }
    } else {
      // Check if gemeente name is in the official list
      const isOfficialGemeente = NHKA_GEMEENTES.some(
        g => g.toLowerCase() === finalNaam.toLowerCase()
      );

      if (!isOfficialGemeente) {
        setError('Kies asseblief \'n gemeente uit die amptelike lys, of kies "ANDER" indien jou gemeente nie gelys is nie.');
        return;
      }

      // Check if gemeente is already registered
      const isAlreadyRegistered = gemeentes.some(
        g => g.naam.toLowerCase() === finalNaam.toLowerCase()
      );

      if (isAlreadyRegistered) {
        setError('Hierdie gemeente is reeds geregistreer. Kies asseblief die gemeente uit die lys.');
        return;
      }
    }

    setStep('logo');
  };

  const handleLogoSubmit = async () => {
    setLoading(true);
    setError('');

    // Determine the final gemeente name
    const finalNaam = isAnderSelected ? formData.customNaam.trim() : formData.naam.trim();

    try {
      // First register the gemeente
      const result = await registerGemeente({
        naam: finalNaam,
        beskrywing: formData.beskrywing.trim() || undefined,
        adres: formData.adres.trim() || undefined,
        telefoon: formData.telefoon.trim() || undefined,
        epos: formData.epos.trim() || undefined,
        webwerf: formData.webwerf.trim() || undefined,
        logo_url: undefined // Will update after upload
      });

      if (!result.success || !result.gemeente) {
        setError(result.error || 'Kon nie gemeente registreer nie');
        setLoading(false);
        return;
      }

      setRegisteredGemeenteId(result.gemeente.id);

      // Upload logo if provided
      if (logoFile) {
        const logoUrl = await uploadLogo(result.gemeente.id);
        if (logoUrl) {
          await supabase
            .from('gemeentes')
            .update({ logo_url: logoUrl })
            .eq('id', result.gemeente.id);
        }
      }

      await refreshGemeentes();
      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setCurrentView('gemeente-select');
  };

  const handleBack = () => {
    if (step === 'logo') setStep('info');
    else setCurrentView('gemeente-select');
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowGemeenteDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get display name for the dropdown button
  const getDisplayName = () => {
    if (isAnderSelected) {
      return formData.customNaam ? `ANDER: ${formData.customNaam}` : 'ANDER (Nuwe Gemeente)';
    }
    return formData.naam || 'Kies gemeente...';
  };

  // Get final name for display in complete step
  const getFinalNaam = () => {
    return isAnderSelected ? formData.customNaam.trim() : formData.naam.trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002855] via-[#003366] to-[#001a3d] flex flex-col">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white p-2 shadow-xl">
            <img
              src={LOGO_URL}
              alt="Logo"
              className="w-full h-full rounded-full object-contain"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Registreer Gemeente
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {['info', 'logo', 'complete'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s
                ? 'bg-[#D4A84B] text-[#002855]'
                : ['info', 'logo', 'complete'].indexOf(step) > i
                  ? 'bg-[#7A8450] text-white'
                  : 'bg-white/20 text-white/60'
                }`}>
                {i + 1}
              </div>
              {i < 2 && (
                <div className={`w-12 h-1 rounded ${['info', 'logo', 'complete'].indexOf(step) > i
                  ? 'bg-[#7A8450]'
                  : 'bg-white/20'
                  }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Card */}
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            {/* Back Button */}
            {step !== 'complete' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-500 hover:text-[#002855] mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Step: Info */}
            {step === 'info' && (
              <form onSubmit={handleInfoSubmit}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                    <Church className="w-5 h-5 text-[#D4A84B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002855]">Gemeente Inligting</h2>
                    <p className="text-gray-500 text-sm">Kies jou gemeente uit die amptelike lys</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Gemeente Name Dropdown */}
                  <div ref={dropdownRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gemeente Naam *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowGemeenteDropdown(!showGemeenteDropdown)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-[#D4A84B] focus:outline-none text-left flex items-center justify-between ${isAnderSelected ? 'border-[#D4A84B] bg-[#D4A84B]/5' : 'border-gray-200'
                        }`}
                    >
                      <span className={formData.naam ? 'text-gray-900' : 'text-gray-400'}>
                        {getDisplayName()}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showGemeenteDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showGemeenteDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-72 overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={gemeenteSearch}
                              onChange={(e) => setGemeenteSearch(e.target.value)}
                              placeholder="Soek gemeente of kies ANDER..."
                              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:border-[#D4A84B] focus:outline-none text-sm"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Gemeente List */}
                        <div className="max-h-52 overflow-y-auto">
                          {/* ANDER Option - Always at top */}
                          {showAnderOption && (
                            <button
                              type="button"
                              onClick={() => handleGemeenteSelect('ANDER')}
                              className="w-full px-4 py-3 text-left hover:bg-[#D4A84B]/10 transition-colors flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-[#002855]/5 to-transparent"
                            >
                              <div className="w-8 h-8 rounded-full bg-[#D4A84B]/20 flex items-center justify-center">
                                <Edit3 className="w-4 h-4 text-[#D4A84B]" />
                              </div>
                              <div>
                                <span className="text-[#002855] font-semibold">ANDER</span>
                                <p className="text-xs text-gray-500">Registreer 'n nuwe gemeente wat nie in die lys is nie</p>
                              </div>
                            </button>
                          )}

                          {availableGemeentes.length === 0 && !showAnderOption ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              {gemeenteSearch ? 'Geen gemeentes gevind nie' : 'Alle gemeentes is reeds geregistreer'}
                            </div>
                          ) : (
                            availableGemeentes.map((naam) => (
                              <button
                                key={naam}
                                type="button"
                                onClick={() => handleGemeenteSelect(naam)}
                                className="w-full px-4 py-2.5 text-left hover:bg-[#D4A84B]/10 transition-colors flex items-center gap-2"
                              >
                                <Church className="w-4 h-4 text-[#002855]" />
                                <span className="text-gray-900">{naam}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Gemeente Name Input - Shows when ANDER is selected */}
                  {isAnderSelected && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Edit3 className="w-4 h-4 inline mr-1" />
                        Nuwe Gemeente Naam *
                      </label>
                      <input
                        type="text"
                        name="customNaam"
                        value={formData.customNaam}
                        onChange={handleCustomNaamChange}
                        placeholder="Voer die nuwe gemeente naam in..."
                        className="w-full px-4 py-3 border-2 border-[#D4A84B] rounded-xl focus:border-[#D4A84B] focus:outline-none bg-[#D4A84B]/5"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Voer die volledige naam van die nuwe gemeente in wat jy wil registreer.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beskrywing
                    </label>
                    <textarea
                      name="beskrywing"
                      value={formData.beskrywing}
                      onChange={handleInputChange}
                      placeholder="Kort beskrywing van die gemeente..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Adres
                    </label>
                    <input
                      type="text"
                      name="adres"
                      value={formData.adres}
                      onChange={handleInputChange}
                      placeholder="Straat, Stad, Poskode"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Telefoon
                      </label>
                      <input
                        type="tel"
                        name="telefoon"
                        value={formData.telefoon}
                        onChange={handleInputChange}
                        placeholder="012 345 6789"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="w-4 h-4 inline mr-1" />
                        E-pos
                      </label>
                      <input
                        type="email"
                        name="epos"
                        value={formData.epos}
                        onChange={handleInputChange}
                        placeholder="gemeente@nhka.org"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Webwerf
                    </label>
                    <input
                      type="url"
                      name="webwerf"
                      value={formData.webwerf}
                      onChange={handleInputChange}
                      placeholder="https://www.gemeente.co.za"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all"
                >
                  Volgende
                </button>
              </form>
            )}

            {/* Step: Logo */}
            {step === 'logo' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                    <Upload className="w-5 h-5 text-[#D4A84B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002855]">Gemeente Logo</h2>
                    <p className="text-gray-500 text-sm">Laai 'n logo of profielfoto op vir <strong>{getFinalNaam()}</strong></p>
                  </div>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#D4A84B] transition-colors"
                >
                  {logoPreview ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={logoPreview}
                        alt="Logo voorskou"
                        className="w-32 h-32 object-contain rounded-lg mb-4"
                      />
                      <p className="text-sm text-gray-500">Klik om te verander</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium">Klik om logo op te laai</p>
                      <p className="text-sm text-gray-400 mt-1">PNG, JPG tot 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleLogoSubmit}
                    disabled={loading}
                    className="flex-1 py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Registreer...
                      </>
                    ) : (
                      'Registreer Gemeente'
                    )}
                  </button>
                </div>

                {!logoFile && (
                  <button
                    onClick={handleLogoSubmit}
                    disabled={loading}
                    className="w-full mt-3 py-3 text-gray-500 hover:text-[#002855] transition-colors"
                  >
                    Slaan logo oor
                  </button>
                )}
              </div>
            )}

            {/* Step: Complete */}
            {step === 'complete' && (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#7A8450]/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-[#7A8450]" />
                </div>
                <h2 className="text-2xl font-bold text-[#002855] mb-2">
                  Gemeente Geregistreer!
                </h2>
                <p className="text-gray-600 mb-6">
                  <strong>{getFinalNaam()}</strong> is suksesvol geregistreer. Jy kan nou gebruikers by die gemeente voeg.
                </p>

                {isAnderSelected && (
                  <div className="mb-6 p-3 bg-[#D4A84B]/10 border border-[#D4A84B]/30 rounded-lg">
                    <p className="text-sm text-[#002855]">
                      <Edit3 className="w-4 h-4 inline mr-1" />
                      Hierdie is 'n nuwe gemeente wat nie in die amptelike lys was nie.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleComplete}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all"
                >
                  Gaan na Gemeente Keuse
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/40 text-sm mt-8 text-center">
          Nederduitsch Hervormde Kerk van Afrika
        </p>
      </div>
    </div>
  );
};

export default GemeenteRegister;
