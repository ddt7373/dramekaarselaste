import React, { useState, useRef } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types/nhka';
import { User, ArrowLeft, Mail, Phone, MapPin, Calendar, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Crown, Shield, Church, Users, Upload, Camera, FileText, ShieldCheck, Globe } from 'lucide-react';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/693a23272f683bba6f73274f_1766339692475_f44b3809.png';

interface FormData {
  naam: string;
  van: string;
  epos: string;
  selfoon: string;
  adres: string;
  geboortedatum: string;
  rol: UserRole;
  wagwoord: string;
  bevestigWagwoord: string;
  popiaToestemming: boolean;
}

const roleOptions: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'lidmaat',
    label: 'Lidmaat / Groepslid',
    description: 'Gewone lid van die gemeente',
    icon: <User className="w-5 h-5 text-[#8B7CB3]" />
  },
  {
    value: 'groepleier',
    label: 'Groepleier',
    description: 'Lei \'n kleingroep of bediening',
    icon: <Users className="w-5 h-5 text-[#7A8450]" />
  },
  {
    value: 'kerkraad',
    label: 'Kerkraad',
    description: 'Lid van die kerkraad',
    icon: <Shield className="w-5 h-5 text-[#9E2A2B]" />
  },
  {
    value: 'predikant',
    label: 'Predikant / Gemeente Leier',
    description: 'Geestelike leier van die gemeente',
    icon: <Church className="w-5 h-5 text-[#8B7CB3]" />
  },
  {
    value: 'subadmin',
    label: 'Gemeente Administrateur',
    description: 'Bestuur die app op gemeente vlak',
    icon: <Shield className="w-5 h-5 text-[#D4A84B]" />
  },
  {
    value: 'eksterne_gebruiker',
    label: 'Eksterne Gebruiker',
    description: 'Gebruiker van buite die gemeente',
    icon: <Globe className="w-5 h-5 text-[#8B7CB3]" />
  }
];

const UserRegister: React.FC = () => {
  const { setCurrentView, registerUser, currentGemeente, login, setCurrentUser } = useNHKA();
  const [step, setStep] = useState<'info' | 'popia' | 'photo' | 'role' | 'password' | 'complete'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string>('');
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    naam: '',
    van: '',
    epos: '',
    selfoon: '',
    adres: '',
    geboortedatum: '',
    rol: 'lidmaat',
    wagwoord: '',
    bevestigWagwoord: '',
    popiaToestemming: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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

      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const uploadProfilePic = async (userId: string): Promise<string | null> => {
    if (!profilePicFile) return null;

    try {
      const fileExt = profilePicFile.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-profile-pics')
        .upload(fileName, profilePicFile, { upsert: true });

      if (uploadError) {
        console.error('Profile pic upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('user-profile-pics')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('Profile pic upload error:', err);
      return null;
    }
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.naam.trim() || !formData.van.trim()) {
      setError('Naam en van is verpligtend');
      return;
    }

    if (!formData.epos.trim() && !formData.selfoon.trim()) {
      setError('Vul asseblief jou e-pos of selfoon in sodat ons jou kan kontak');
      return;
    }

    setStep('popia');
  };

  const handlePopiaSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.popiaToestemming) {
      setError('Jy moet die POPIA-voorwaardes aanvaar om voort te gaan');
      return;
    }

    setStep('photo');
  };

  const handlePhotoSubmit = () => {
    setStep('role');
  };

  const handleRoleSubmit = () => {
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.wagwoord.length < 6) {
      setError('Wagwoord moet ten minste 6 karakters wees');
      return;
    }

    if (formData.wagwoord !== formData.bevestigWagwoord) {
      setError('Wagwoorde stem nie ooreen nie');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await registerUser({
        naam: formData.naam.trim(),
        van: formData.van.trim(),
        epos: formData.epos.trim() || undefined,
        selfoon: formData.selfoon.trim() || undefined,
        adres: formData.adres.trim() || undefined,
        geboortedatum: formData.geboortedatum || undefined,
        rol: formData.rol,
        wagwoord: formData.wagwoord,
        popia_toestemming: formData.popiaToestemming,
        popia_toestemming_datum: new Date().toISOString()
      });

      if (!result.success) {
        setError(result.error || 'Kon nie gebruiker registreer nie');
        setLoading(false);
        return;
      }

      if (result.user) {
        setRegisteredUserId(result.user.id);
        // Store full user object for immediate login
        setRegisteredUser(result.user);

        // Upload profile pic if provided
        if (profilePicFile) {
          const profilePicUrl = await uploadProfilePic(result.user.id);
          if (profilePicUrl) {
            await supabase
              .from('gebruikers')
              .update({ profile_pic_url: profilePicUrl })
              .eq('id', result.user.id);

            // Update local user object with profile pic
            setRegisteredUser({
              ...result.user,
              profile_pic_url: profilePicUrl
            });
          }
        }
      }
      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (registeredUser) {
      // Direct login with user object
      setCurrentUser(registeredUser);
      setCurrentView('dashboard');
    } else if (registeredUserId) {
      await login(registeredUserId);
    } else {
      setCurrentView('login');
    }
  };

  const handleBack = () => {
    if (step === 'popia') setStep('info');
    else if (step === 'photo') setStep('popia');
    else if (step === 'role') setStep('photo');
    else if (step === 'password') setStep('role');
    else setCurrentView('login');
  };

  const stepLabels = ['info', 'popia', 'photo', 'role', 'password', 'complete'];
  const currentStepIndex = stepLabels.indexOf(step);

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
              src={currentGemeente?.logo_url || LOGO_URL}
              alt="Logo"
              className="w-full h-full rounded-full object-contain"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Registreer Gebruiker
          </h1>
          <p className="text-[#D4A84B] text-sm mt-1">
            {currentGemeente?.naam}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {stepLabels.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s
                ? 'bg-[#D4A84B] text-[#002855]'
                : currentStepIndex > i
                  ? 'bg-[#7A8450] text-white'
                  : 'bg-white/20 text-white/60'
                }`}>
                {i + 1}
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`w-4 md:w-6 h-1 rounded ${currentStepIndex > i
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
                    <User className="w-5 h-5 text-[#D4A84B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002855]">Persoonlike Inligting</h2>
                    <p className="text-gray-500 text-sm">Vul net die nodigste in – die ander inligting kan later bygewerk word.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Naam *
                      </label>
                      <input
                        type="text"
                        name="naam"
                        value={formData.naam}
                        onChange={handleInputChange}
                        placeholder="Johan"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Van *
                      </label>
                      <input
                        type="text"
                        name="van"
                        value={formData.van}
                        onChange={handleInputChange}
                        placeholder="Van der Merwe"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
                        required
                      />
                    </div>
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
                      placeholder="johan@voorbeeld.co.za"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Selfoon
                    </label>
                    <input
                      type="tel"
                      name="selfoon"
                      value={formData.selfoon}
                      onChange={handleInputChange}
                      placeholder="082 123 4567"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Geboortedatum
                    </label>
                    <input
                      type="date"
                      name="geboortedatum"
                      value={formData.geboortedatum}
                      onChange={handleInputChange}
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

            {/* Step: POPIA Consent */}
            {step === 'popia' && (
              <form onSubmit={handlePopiaSubmit}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#D4A84B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002855]">POPIA Toestemming</h2>
                    <p className="text-gray-500 text-sm">Beskerming van Persoonlike Inligting</p>
                  </div>
                </div>

                {/* POPIA Information Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">Wet op Beskerming van Persoonlike Inligting (POPIA)</h3>
                      <p className="text-sm text-blue-800">
                        Ingevolge die Suid-Afrikaanse POPIA-wetgewing (Wet 4 van 2013) moet ons jou toestemming verkry voordat ons jou persoonlike inligting kan verwerk.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scrollable Terms */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 max-h-64 overflow-y-auto">
                  <h4 className="font-semibold text-gray-900 mb-3">Watter inligting word versamel?</h4>
                  <ul className="text-sm text-gray-700 space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#002855] mt-2 flex-shrink-0"></span>
                      <span><strong>Identifikasie-inligting:</strong> Naam, van, geboortedatum</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#002855] mt-2 flex-shrink-0"></span>
                      <span><strong>Kontakinligting:</strong> E-posadres, selfoonnommer, fisiese adres</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#002855] mt-2 flex-shrink-0"></span>
                      <span><strong>Profielfoto:</strong> Opsionele foto vir identifikasie</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#002855] mt-2 flex-shrink-0"></span>
                      <span><strong>Gemeentelidmaatskap:</strong> Rol, wyk, besoekpunt</span>
                    </li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-3">Hoe word jou inligting gebruik?</h4>
                  <ul className="text-sm text-gray-700 space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7A8450] mt-2 flex-shrink-0"></span>
                      <span>Om jou lidmaatskap by die gemeente te administreer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7A8450] mt-2 flex-shrink-0"></span>
                      <span>Om met jou te kommunikeer oor gemeente-aktiwiteite en -geleenthede</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7A8450] mt-2 flex-shrink-0"></span>
                      <span>Om pastorale sorg en ondersteuning te bied</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7A8450] mt-2 flex-shrink-0"></span>
                      <span>Om dokumente soos doopsertifikate en lidmaatskapbewyse te genereer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7A8450] mt-2 flex-shrink-0"></span>
                      <span>Om betalings en donasies te verwerk</span>
                    </li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-3">Jou regte onder POPIA:</h4>
                  <ul className="text-sm text-gray-700 space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A84B] mt-2 flex-shrink-0"></span>
                      <span><strong>Toegang:</strong> Jy kan versoek om jou persoonlike inligting te sien</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A84B] mt-2 flex-shrink-0"></span>
                      <span><strong>Regstelling:</strong> Jy kan versoek dat foutiewe inligting reggestel word</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A84B] mt-2 flex-shrink-0"></span>
                      <span><strong>Uitwissing:</strong> Jy kan versoek dat jou inligting verwyder word</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A84B] mt-2 flex-shrink-0"></span>
                      <span><strong>Beswaar:</strong> Jy kan beswaar maak teen die verwerking van jou inligting</span>
                    </li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-3">Databeskerming:</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Jou persoonlike inligting word veilig gestoor en slegs toeganklik vir gemagtigde gemeente-administrateurs.
                    Ons sal nooit jou inligting aan derde partye verkoop of deel sonder jou toestemming nie, behalwe waar dit
                    deur die wet vereis word.
                  </p>
                  <p className="text-sm text-gray-700">
                    Vir enige navrae oor jou persoonlike inligting, kontak asseblief die gemeente-kantoor.
                  </p>
                </div>

                {/* Consent Checkbox */}
                <div className="bg-[#002855]/5 border-2 border-[#002855]/20 rounded-xl p-4 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="popiaToestemming"
                      checked={formData.popiaToestemming}
                      onChange={handleInputChange}
                      className="w-5 h-5 mt-0.5 rounded border-2 border-[#002855] text-[#D4A84B] focus:ring-[#D4A84B] cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">
                      Ek, <strong>{formData.naam} {formData.van}</strong>, verstaan en stem in dat my persoonlike inligting
                      versamel, gestoor en verwerk sal word soos hierbo uiteengesit, in ooreenstemming met die
                      <strong> Wet op Beskerming van Persoonlike Inligting (POPIA)</strong>. Ek verstaan dat ek hierdie
                      toestemming te eniger tyd kan terugtrek deur die gemeente-kantoor te kontak.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!formData.popiaToestemming}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${formData.popiaToestemming
                    ? 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  Ek Stem In
                </button>
              </form>
            )}

            {/* Step: Photo */}
            {step === 'photo' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                    <Camera className="w-5 h-5 text-[#D4A84B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002855]">Profielfoto</h2>
                    <p className="text-gray-500 text-sm">Laai 'n foto van jouself op (opsioneel)</p>
                  </div>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#D4A84B] transition-colors"
                >
                  {profilePicPreview ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={profilePicPreview}
                        alt="Profielfoto voorskou"
                        className="w-32 h-32 object-cover rounded-full mb-4 border-4 border-[#D4A84B]"
                      />
                      <p className="text-sm text-gray-500">Klik om te verander</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">Klik om foto op te laai</p>
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

                <button
                  onClick={handlePhotoSubmit}
                  className="w-full mt-6 py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all"
                >
                  {profilePicFile ? 'Volgende' : 'Slaan Oor'}
                </button>
              </div>
            )}

            {/* Step: Role */}
            {step === 'role' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#D4A84B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002855]">Kies Jou Rol</h2>
                    <p className="text-gray-500 text-sm">Wat is jou rol in die gemeente?</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {roleOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, rol: option.value }))}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${formData.rol === option.value
                        ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                        : 'border-gray-200 hover:border-[#D4A84B]/50'
                        }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                      {formData.rol === option.value && (
                        <div className="w-6 h-6 rounded-full bg-[#D4A84B] flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRoleSubmit}
                  className="w-full mt-6 py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all"
                >
                  Volgende
                </button>
              </div>
            )}

            {/* Step: Password */}
            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#D4A84B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002855]">Skep Wagwoord</h2>
                    <p className="text-gray-500 text-sm">Kies 'n veilige wagwoord</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wagwoord
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="wagwoord"
                        value={formData.wagwoord}
                        onChange={handleInputChange}
                        placeholder="Ten minste 6 karakters"
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bevestig Wagwoord
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="bevestigWagwoord"
                      value={formData.bevestigWagwoord}
                      onChange={handleInputChange}
                      placeholder="Tik wagwoord weer in"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registreer...
                    </>
                  ) : (
                    'Voltooi Registrasie'
                  )}
                </button>
              </form>
            )}

            {/* Step: Complete */}
            {step === 'complete' && (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#7A8450]/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-[#7A8450]" />
                </div>
                <h2 className="text-2xl font-bold text-[#002855] mb-2">
                  Welkom, {formData.naam}!
                </h2>
                <p className="text-gray-600 mb-4">
                  Jou rekening is suksesvol geskep. Jy kan nou die app begin gebruik.
                </p>

                {/* POPIA Confirmation */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-left">
                  <div className="flex items-center gap-2 text-green-700">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-sm font-medium">POPIA-toestemming aangeteken</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1 ml-7">
                    Datum: {new Date().toLocaleDateString('af-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all"
                >
                  Begin Gebruik App
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

export default UserRegister;
