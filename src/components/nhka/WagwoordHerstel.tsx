import React, { useState } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, KeyRound, Phone } from 'lucide-react';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/693a23272f683bba6f73274f_1766339692475_f44b3809.png';

const WagwoordHerstel: React.FC = () => {
  const { setCurrentView, currentGemeente, gebruikers, sendSMS } = useNHKA();
  const [step, setStep] = useState<'identify' | 'verify' | 'reset' | 'complete'>('identify');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [identifier, setIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Find user by email or phone
      const user = gebruikers.find(g => 
        g.epos?.toLowerCase() === identifier.toLowerCase() || 
        g.selfoon?.replace(/\s/g, '') === identifier.replace(/\s/g, '')
      );

      if (!user) {
        setError('Geen gebruiker gevind met hierdie e-pos of selfoon nie');
        setLoading(false);
        return;
      }

      setFoundUser(user);

      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      // Send SMS if phone number exists
      if (user.selfoon) {
        const message = `Jou NHKA wagwoord herstel kode is: ${code}. Hierdie kode verval oor 10 minute.`;
        await sendSMS(user.selfoon, message, 'algemeen');
      }

      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode !== generatedCode) {
      setError('Ongeldige verifikasiekode');
      return;
    }

    setStep('reset');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Wagwoord moet ten minste 6 karakters wees');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Wagwoorde stem nie ooreen nie');
      return;
    }

    setLoading(true);

    try {
      // Update password in database
      const wagwoord_hash = btoa(newPassword);
      
      const { error: updateError } = await supabase
        .from('gebruikers')
        .update({ wagwoord_hash })
        .eq('id', foundUser.id);

      if (updateError) {
        setError('Kon nie wagwoord opdateer nie');
        setLoading(false);
        return;
      }

      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setCurrentView('login');
  };

  const handleBack = () => {
    if (step === 'verify') setStep('identify');
    else if (step === 'reset') setStep('verify');
    else setCurrentView('login');
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
              src={currentGemeente?.logo_url || LOGO_URL}
              alt="Logo" 
              className="w-full h-full rounded-full object-contain"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Wagwoord Herstel
          </h1>
          <p className="text-[#D4A84B] text-sm mt-1">
            {currentGemeente?.naam}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {['identify', 'verify', 'reset', 'complete'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s 
                  ? 'bg-[#D4A84B] text-[#002855]' 
                  : ['identify', 'verify', 'reset', 'complete'].indexOf(step) > i
                    ? 'bg-[#7A8450] text-white'
                    : 'bg-white/20 text-white/60'
              }`}>
                {i + 1}
              </div>
              {i < 3 && (
                <div className={`w-8 h-1 rounded ${
                  ['identify', 'verify', 'reset', 'complete'].indexOf(step) > i
                    ? 'bg-[#7A8450]'
                    : 'bg-white/20'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md">
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

            {/* Step: Identify */}
            {step === 'identify' && (
              <form onSubmit={handleIdentify}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-[#D4A84B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002855]">Identifiseer Jouself</h2>
                    <p className="text-gray-500 text-sm">Voer jou e-pos of selfoon in</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-pos of Selfoon
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          setError('');
                        }}
                        placeholder="johan@voorbeeld.co.za of 082 123 4567"
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none"
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      'n Verifikasiekode sal na jou selfoon gestuur word
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full mt-6 py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Soek...
                    </>
                  ) : (
                    'Stuur Verifikasiekode'
                  )}
                </button>
              </form>
            )}

            {/* Step: Verify */}
            {step === 'verify' && (
              <form onSubmit={handleVerify}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#D4A84B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002855]">Verifieer</h2>
                    <p className="text-gray-500 text-sm">Voer die kode in wat na jou gestuur is</p>
                  </div>
                </div>

                {foundUser && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Kode gestuur na: <strong>{foundUser.selfoon || foundUser.epos}</strong>
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verifikasiekode
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setError('');
                      }}
                      placeholder="123456"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none text-center text-2xl tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                {/* Demo: Show code for testing */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Demo:</strong> Jou kode is <span className="font-mono font-bold">{generatedCode}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verificationCode.length !== 6}
                  className="w-full mt-6 py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  Verifieer
                </button>
              </form>
            )}

            {/* Step: Reset */}
            {step === 'reset' && (
              <form onSubmit={handleReset}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#D4A84B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002855]">Nuwe Wagwoord</h2>
                    <p className="text-gray-500 text-sm">Kies 'n nuwe veilige wagwoord</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nuwe Wagwoord
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError('');
                        }}
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
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
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
                      Opdateer...
                    </>
                  ) : (
                    'Herstel Wagwoord'
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
                  Wagwoord Herstel!
                </h2>
                <p className="text-gray-600 mb-6">
                  Jou wagwoord is suksesvol verander. Jy kan nou met jou nuwe wagwoord inteken.
                </p>

                <button
                  onClick={handleComplete}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all"
                >
                  Gaan na Inteken
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

export default WagwoordHerstel;
