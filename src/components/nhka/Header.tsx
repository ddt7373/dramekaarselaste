import React, { useState, useEffect, useRef } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { useOffline } from '@/contexts/OfflineContext';
import { supabase } from '@/lib/supabase';
import { getRolLabel, isHoofAdmin, isAdmin, isLeier, getLidmaatDisplayNaam } from '@/types/nhka';
import {
  ArrowLeft,
  Menu,
  Bell,
  LogOut,
  User,
  Crown,
  WifiOff,
  Wifi,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Mail,
  ChevronDown,
  Settings,
  Award,
  FileText,
  BookOpenCheck,
  Info
} from 'lucide-react';

import SyncStatusIndicator from './SyncStatusIndicator';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/693a23272f683bba6f73274f_1766339692475_f44b3809.png';

interface HeaderProps {
  onMenuToggle: () => void;
  onNavigate?: (view: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, onNavigate }) => {
  const { currentUser, currentGemeente, logout, krisisse, setCurrentView, currentView, goBack } = useNHKA();
  const { isOnline, pendingCount, failedCount, conflictCount, syncStatus, syncNow } = useOffline();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('boodskap_ontvangers')
        .select('id')
        .eq('ontvanger_id', currentUser.id)
        .is('gelees_op', null)
        .is('verwyder_op', null);

      if (!error && data) {
        setUnreadMessages(data.length);
      }
    };

    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count unresolved crises
  const canSeeCrises = currentUser && (isAdmin(currentUser.rol) || isLeier(currentUser.rol) || currentUser.rol === 'predikant');
  const unresolvedCrises = canSeeCrises ? krisisse.filter(k => k.status !== 'opgelos').length : 0;

  const isHoofAdminUser = currentUser && isHoofAdmin(currentUser.rol);

  const totalPending = pendingCount + failedCount + conflictCount;

  const handleManageQueue = () => {
    if (onNavigate) {
      onNavigate('vanlyn-bestuur');
    }
  };

  const handleOpenMessages = () => {
    if (onNavigate) {
      onNavigate('boodskappe');
    }
  };

  const handleMenuItemClick = (view: string) => {
    setIsUserMenuOpen(false);
    if (view === 'logout') {
      logout();
    } else {
      setCurrentView(view as any);
    }
  };

  return (
    <header className="bg-primary text-white sticky top-0 z-50 shadow-xl border-b border-white/5 backdrop-blur-md bg-primary/95">
      <div className="px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Menu & Logo */}
          <div className="flex items-center gap-1 sm:gap-4 min-w-0 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Terug Button - net as ons nie op dashboard is nie */}
              {currentView !== 'dashboard' && currentView !== 'gemeente-select' && currentView !== 'login' && (
                <button
                  onClick={goBack}
                  className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95 flex-shrink-0 sacred-shadow shadow-sm"
                  title="Gaan Terug"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              {/* Meer Button - meer kompak */}
              <button
                onClick={onMenuToggle}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent hover:bg-accent/90 text-primary font-bold transition-all hover:scale-105 active:scale-95 lg:hidden sacred-shadow flex-shrink-0"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest hidden xs:block">Menu</span>
              </button>
            </div>

            <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />

            {/* Logo en Naam */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white p-1 shadow-lg flex-shrink-0 animate-in zoom-in duration-500">
                <img
                  src={currentGemeente?.logo_url || LOGO_URL}
                  alt="Logo"
                  className="w-full h-full rounded-full object-contain"
                />
              </div>
              <div className="hidden xs:block min-w-0">
                <h1 className="font-serif font-black text-sm sm:text-lg leading-none tracking-tight truncate uppercase">Dra Mekaar</h1>
                <p className="text-[10px] sm:text-xs text-accent font-bold leading-none truncate mt-1 opacity-80">
                  {currentGemeente?.naam || 'NHKA'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: User Info & Actions - meer kompak */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Connection Status - baie kompak */}
            <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium ${isOnline
              ? 'bg-green-500/20 text-green-300'
              : 'bg-red-500/20 text-red-300'
              }`}>
              {isOnline ? (
                <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              ) : (
                <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </div>

            {/* Sync Status - net wys as daar pending items is */}
            {totalPending > 0 && (
              <button
                onClick={handleManageQueue}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${conflictCount > 0
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : failedCount > 0
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  }`}
                title={`${pendingCount} wagend, ${failedCount} misluk, ${conflictCount} konflikte`}
              >
                {syncStatus === 'syncing' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : conflictCount > 0 ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <CloudOff className="w-3 h-3" />
                )}
                <span>{totalPending}</span>
              </button>
            )}

            {/* Quick Sync Button - kleiner */}
            {isOnline && totalPending > 0 && syncStatus !== 'syncing' && (
              <button
                onClick={() => syncNow()}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Sinkroniseer nou"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}

            {/* Messages - kleiner */}
            <button
              onClick={handleOpenMessages}
              className="relative p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Boodskappe"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#D4A84B] text-[#002855] rounded-full text-[10px] sm:text-xs flex items-center justify-center font-bold">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>

            {/* Notifications - kleiner */}
            <button
              onClick={() => canSeeCrises && onNavigate && onNavigate('krisis')}
              className={`relative p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors ${!canSeeCrises ? 'opacity-50 cursor-default' : ''}`}
              title={canSeeCrises ? 'Kennisgewings – Onopgeloste krisisse' : 'Kennisgewings'}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unresolvedCrises > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#9E2A2B] rounded-full text-[10px] sm:text-xs flex items-center justify-center font-bold">
                  {unresolvedCrises > 9 ? '9+' : unresolvedCrises}
                </span>
              )}
            </button>

            {/* User Info with Dropdown - meer kompak */}
            {currentUser && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-[#D4A84B] flex-shrink-0`}>
                    {isHoofAdminUser ? (
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-[#002855]" />
                    ) : (
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-[#002855]" />
                    )}
                  </div>
                  {/* Versteek naam op klein skerms */}
                  <div className="hidden md:block text-left min-w-0">
                    <p className="text-xs sm:text-sm font-medium leading-tight truncate max-w-[100px] lg:max-w-[150px]">
                      {currentUser.naam}
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#D4A84B] leading-tight truncate">
                      {getRolLabel(currentUser.rol)}
                    </p>
                  </div>
                  <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-white/70 transition-transform duration-200 flex-shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''
                    }`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info Header in Dropdown */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">
                        {getLidmaatDisplayNaam(currentUser)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getRolLabel(currentUser.rol)}
                      </p>
                      {currentGemeente && (
                        <p className="text-xs text-[#002855] mt-1">
                          {currentGemeente.naam}
                        </p>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => handleMenuItemClick('profiel')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        <span>My Profiel</span>
                      </button>

                      <button
                        onClick={() => handleMenuItemClick('my-sertifikate')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Award className="w-4 h-4 text-gray-500" />
                        <span>My Sertifikate</span>
                      </button>

                      <button
                        onClick={() => handleMenuItemClick('my-dokumente')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      >
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span>My Dokumente</span>
                      </button>

                      <button
                        onClick={() => handleMenuItemClick('notification-preferences')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span>Kennisgewings</span>
                      </button>


                      <button
                        onClick={() => handleMenuItemClick('hulp-tutoriale')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      >
                        <BookOpenCheck className="w-4 h-4 text-gray-500" />
                        <span>Gebruiksaanwysings</span>
                      </button>
                    </div>


                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => handleMenuItemClick('logout')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[#9E2A2B] hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Teken Uit</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
