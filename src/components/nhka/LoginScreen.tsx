import React, { useState } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { getRolLabel } from '@/types/nhka';
import { Church, User, ChevronRight, Heart, Users, Shield, ArrowLeft, UserPlus, Crown, Star, KeyRound, LogIn, X, Eye, EyeOff, AlertCircle, Loader2, Search } from 'lucide-react';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/693a23272f683bba6f73274f_1766339692475_f44b3809.png';

const LoginScreen: React.FC = () => {
  const { gebruikers, login, loading, currentGemeente, setCurrentView } = useNHKA();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedUserData = gebruikers.find(u => u.id === selectedUser);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    setError('');
    setIsLoggingIn(true);

    try {
      const result = await login(selectedUser, password);
      if (!result.success) {
        setError(result.error || 'Kon nie inteken nie');
      }
    } catch (err: any) {
      setError(err.message || 'Onbekende fout');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBack = () => {
    setCurrentView('gemeente-select');
  };

  const handleRegister = () => {
    setCurrentView('register');
  };

  const handleForgotPassword = () => {
    setCurrentView('wagwoord-herstel');
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setPassword('');
    setError('');
    // Automatically show the login popup when a user is selected
    setShowLoginPopup(true);
  };

  // Get role icon
  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case 'hoof_admin':
        return <Crown className="w-5 h-5 text-[#D4A84B]" />;
      case 'subadmin':
      case 'admin':
        return <Shield className="w-5 h-5 text-[#9E2A2B]" />;
      case 'predikant':
        return <Church className="w-5 h-5 text-[#8B7CB3]" />;
      case 'kerkraad':
        return <Star className="w-5 h-5 text-[#9E2A2B]" />;
      case 'ouderling':
      case 'diaken':
      case 'groepleier':
        return <Users className="w-5 h-5 text-[#7A8450]" />;
      default:
        return <User className="w-5 h-5 text-[#8B7CB3]" />;
    }
  };

  // Get role background color
  const getRoleBgColor = (rol: string) => {
    switch (rol) {
      case 'hoof_admin':
        return 'bg-[#D4A84B]/10';
      case 'subadmin':
      case 'admin':
      case 'kerkraad':
        return 'bg-[#9E2A2B]/10';
      case 'predikant':
        return 'bg-[#8B7CB3]/10';
      case 'ouderling':
      case 'diaken':
      case 'groepleier':
        return 'bg-[#7A8450]/10';
      default:
        return 'bg-[#8B7CB3]/10';
    }
  };

  // Get user profile pic or initials
  const getUserAvatar = (user: any) => {
    if (user.profile_pic_url) {
      return (
        <img
          src={user.profile_pic_url}
          alt={`${user.naam} ${user.van}`}
          className="w-full h-full rounded-full object-cover"
        />
      );
    }
    return getRoleIcon(user.rol);
  };

  // Group users by role for display - exclude hoof_admin as they login at a higher level
  const filteredUsers = gebruikers.filter(user =>
    `${user.naam} ${user.van}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoleGroups = {
    admin: filteredUsers.filter(g => ['subadmin', 'admin'].includes(g.rol)),
    predikant: filteredUsers.filter(g => g.rol === 'predikant'),
    kerkraad: filteredUsers.filter(g => ['ouderling', 'diaken', 'groepleier', 'kerkraad'].includes(g.rol)),
    lidmate: filteredUsers.filter(g => ['lidmaat', 'eksterne_gebruiker', 'moderator'].includes(g.rol))
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002855] via-[#003366] to-[#001a3d] flex flex-col">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Floating Login Popup - Shows when user is selected */}
      {selectedUser && showLoginPopup && selectedUserData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowLoginPopup(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Selected User Info */}
            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto rounded-full ${selectedUserData.profile_pic_url ? '' : getRoleBgColor(selectedUserData.rol)} flex items-center justify-center overflow-hidden mb-4 ring-4 ring-[#D4A84B]/20`}>
                {selectedUserData.profile_pic_url ? (
                  <img
                    src={selectedUserData.profile_pic_url}
                    alt={`${selectedUserData.naam} ${selectedUserData.van}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12">
                    {getRoleIcon(selectedUserData.rol)}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-[#002855]">
                {selectedUserData.naam} {selectedUserData.van}
              </h3>
              <p className="text-gray-500">{getRolLabel(selectedUserData.rol)}</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 ml-1">Wagwoord</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Voer jou wagwoord in"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none pr-12 transition-all"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <LogIn className="w-6 h-6" />
                )}
                Teken In
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('wagwoord-herstel')}
                className="w-full text-center text-sm font-medium text-gray-500 hover:text-[#D4A84B] transition-colors py-1"
              >
                Wagwoord vergeet?
              </button>
            </form>

            {/* Cancel / Choose Different User */}
            <button
              onClick={() => {
                setShowLoginPopup(false);
                setSelectedUser('');
              }}
              className="w-full mt-3 py-3 rounded-xl font-medium text-gray-500 hover:text-[#002855] hover:bg-gray-100 transition-all"
            >
              Kies 'n ander gebruiker
            </button>
          </div>
        </div>
      )}

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo and Title */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white p-2 shadow-2xl">
            <img
              src={currentGemeente?.logo_url || LOGO_URL}
              alt="Logo"
              className="w-full h-full rounded-full object-contain"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {currentGemeente?.naam || 'Dra Mekaar se Laste'}
          </h1>
          <p className="text-[#D4A84B] text-lg font-medium">
            NHKA Pastorale Sorg Platform
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Heart className="w-6 h-6 text-[#D4A84B] mx-auto mb-1" />
            <p className="text-white/80 text-xs">Pastorale Sorg</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Users className="w-6 h-6 text-[#D4A84B] mx-auto mb-1" />
            <p className="text-white/80 text-xs">Wykbestuur</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Shield className="w-6 h-6 text-[#D4A84B] mx-auto mb-1" />
            <p className="text-white/80 text-xs">Krisisstelsel</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-500 hover:text-[#002855] mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kies ander gemeente
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                <User className="w-5 h-5 text-[#D4A84B]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#002855]">Teken In</h2>
                <p className="text-gray-500 text-sm">Kies jou profiel om voort te gaan</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-[#D4A84B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Laai gebruikers...</p>
              </div>
            ) : gebruikers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-4">Geen gebruikers geregistreer nie</p>
                <button
                  onClick={handleRegister}
                  className="px-6 py-3 bg-[#D4A84B] text-[#002855] rounded-xl font-bold hover:bg-[#c49a3d] transition-all"
                >
                  Registreer Eerste Gebruiker
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Soek vir jou naam..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#D4A84B] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Gemeente Admin */}
                  {filteredRoleGroups.admin.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-[#002855] uppercase tracking-wider mb-2">
                        Gemeente Admin
                      </label>
                      <div className="space-y-2">
                        {filteredRoleGroups.admin.map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleUserSelect(user.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${selectedUser === user.id
                              ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                              : 'border-gray-200 hover:border-[#D4A84B]/50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full ${user.profile_pic_url ? '' : getRoleBgColor(user.rol)} flex items-center justify-center overflow-hidden`}>
                                {getUserAvatar(user)}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900">{user.naam} {user.van}</p>
                                <p className="text-xs text-gray-500">{getRolLabel(user.rol)}</p>
                              </div>
                            </div>
                            {selectedUser === user.id && (
                              <div className="w-6 h-6 rounded-full bg-[#D4A84B] flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Predikant of Gemeenteleier */}
                  {filteredRoleGroups.predikant.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-[#002855] uppercase tracking-wider mb-2 mt-4">
                        Predikant of Gemeenteleier
                      </label>

                      <div className="space-y-2">
                        {filteredRoleGroups.predikant.map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleUserSelect(user.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${selectedUser === user.id
                              ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                              : 'border-gray-200 hover:border-[#D4A84B]/50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full ${user.profile_pic_url ? '' : getRoleBgColor(user.rol)} flex items-center justify-center overflow-hidden`}>
                                {getUserAvatar(user)}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900">{user.naam} {user.van}</p>
                                <p className="text-xs text-gray-500">{getRolLabel(user.rol)}</p>
                              </div>
                            </div>
                            {selectedUser === user.id && (
                              <div className="w-6 h-6 rounded-full bg-[#D4A84B] flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kerkraad of Groepleier */}
                  {filteredRoleGroups.kerkraad.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-[#002855] uppercase tracking-wider mb-2 mt-4">
                        Kerkraad of Groepleier
                      </label>
                      <div className="space-y-2">
                        {filteredRoleGroups.kerkraad.map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleUserSelect(user.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${selectedUser === user.id
                              ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                              : 'border-gray-200 hover:border-[#D4A84B]/50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full ${user.profile_pic_url ? '' : getRoleBgColor(user.rol)} flex items-center justify-center overflow-hidden`}>
                                {getUserAvatar(user)}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900">{user.naam} {user.van}</p>
                                <p className="text-xs text-gray-500">{getRolLabel(user.rol)}</p>
                              </div>
                            </div>
                            {selectedUser === user.id && (
                              <div className="w-6 h-6 rounded-full bg-[#D4A84B] flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lidmate */}
                  {filteredRoleGroups.lidmate.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-[#002855] uppercase tracking-wider mb-2 mt-4">
                        Lidmate
                      </label>
                      <div className="space-y-2">
                        {filteredRoleGroups.lidmate.map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleUserSelect(user.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${selectedUser === user.id
                              ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                              : 'border-gray-200 hover:border-[#D4A84B]/50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full ${user.profile_pic_url ? '' : getRoleBgColor(user.rol)} flex items-center justify-center overflow-hidden`}>
                                {getUserAvatar(user)}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900">{user.naam} {user.van}</p>
                                <p className="text-xs text-gray-500">{getRolLabel(user.rol)}</p>
                              </div>
                            </div>
                            {selectedUser === user.id && (
                              <div className="w-6 h-6 rounded-full bg-[#D4A84B] flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No results message */}
                  {Object.values(filteredRoleGroups).every(group => group.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Geen gebruikers gevind nie.</p>
                    </div>
                  )}
                </div>

                {/* Sticky Footer Actions */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  {/* Show selected user and login button if selected but popup closed */}
                  {selectedUser && !showLoginPopup && selectedUserData && (
                    <button
                      onClick={() => setShowLoginPopup(true)}
                      className="w-full py-4 rounded-xl font-bold text-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                      <LogIn className="w-5 h-5" />
                      Teken In as {selectedUserData.naam}
                    </button>
                  )}

                  <button
                    onClick={handleRegister}
                    className="w-full py-3 rounded-xl font-medium text-[#002855] border-2 border-[#002855] hover:bg-[#002855] hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Registreer Nuwe Gebruiker
                  </button>

                  {/* Forgot Password Link */}
                  <button
                    onClick={handleForgotPassword}
                    className="w-full py-2 text-sm text-gray-500 hover:text-[#002855] transition-colors flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Wagwoord vergeet?
                  </button>
                </div>
              </>
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

export default LoginScreen;
