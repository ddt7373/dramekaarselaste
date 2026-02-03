import React, { useState, useEffect } from 'react';
import { NHKAProvider, useNHKA } from '@/contexts/NHKAContext';
import { OfflineProvider, useOffline } from '@/contexts/OfflineContext';
import { isHoofAdmin, isModerator } from '@/types/nhka';
import InstallPrompt from '@/components/InstallPrompt';

// Import all NHKA components
import Header from '@/components/nhka/Header';
import Sidebar from '@/components/nhka/Sidebar';
import GemeenteSelect from '@/components/nhka/GemeenteSelect';
import GemeenteRegister from '@/components/nhka/GemeenteRegister';
import UserRegister from '@/components/nhka/UserRegister';
import LoginScreen from '@/components/nhka/LoginScreen';
import WagwoordHerstel from '@/components/nhka/WagwoordHerstel';
import Dashboard from '@/components/nhka/Dashboard';
import MyWyk from '@/components/nhka/MyWyk';
import Profiel from '@/components/nhka/Profiel';
import PastoraleAksie from '@/components/nhka/PastoraleAksie';
import KrisisVerslag from '@/components/nhka/KrisisVerslag';
import GemeenteProgram from '@/components/nhka/GemeenteProgram';
import Vrae from '@/components/nhka/Vrae';
import AdminPanel from '@/components/nhka/AdminPanel';
import Betaling from '@/components/nhka/Betaling';
import HoofAdminDashboard from '@/components/nhka/HoofAdminDashboard';
import ModeratorDashboard from '@/components/nhka/ModeratorDashboard';
import EreidiensInfo from '@/components/nhka/EreidiensInfo';
import Nuusbrief from '@/components/nhka/Nuusbrief';
import DokumenteBestuur from '@/components/nhka/DokumenteBestuur';
import MyDokumente from '@/components/nhka/MyDokumente';
import Oordrag from '@/components/nhka/Oordrag';
import WykToewysing from '@/components/nhka/WykToewysing';
import BesoekpuntToewysing from '@/components/nhka/BesoekpuntToewysing';
import Advertensies from '@/components/nhka/Advertensies';
import GawesSoek from '@/components/nhka/GawesSoek';
import Geloofsgroei from '@/components/nhka/Geloofsgroei';
import Geloofsonderrig from '@/components/nhka/Geloofsonderrig';
import LMSKursusBestuur from '@/components/nhka/LMSKursusBestuur';
import VBO from '@/components/nhka/VBO';
import BedieningsBehoeftes from '@/components/nhka/BedieningsBehoeftes';
import GemeenteKaart from '@/components/nhka/GemeenteKaart';
import DenominasieKaart from '@/components/nhka/DenominasieKaart';
import OfflineQueueManager from '@/components/nhka/OfflineQueueManager';
import Sakramentsbeloftes from '@/components/nhka/Sakramentsbeloftes';
import MissionaleBediening from '@/components/nhka/MissionaleBediening';
import Boodskappe from '@/components/nhka/Boodskappe';
import MySertifikate from '@/components/nhka/MySertifikate';
import NotificationPreferences from '@/components/nhka/NotificationPreferences';
import Kuberkermis from '@/components/nhka/Kuberkermis';
import VerhoudingsBestuur from '@/components/nhka/VerhoudingsBestuur';
import OnboardingGids, { useOnboarding } from '@/components/nhka/OnboardingGids';
import HulpTutoriale from '@/components/nhka/HulpTutoriale';
import KortKragtig from '@/components/nhka/KortKragtig';
import KortKragtigAdmin from '@/components/nhka/KortKragtigAdmin';
import Konsistorieboek from '@/components/nhka/Konsistorieboek';
import Bybelkennis from '@/components/nhka/Bybelkennis';
import ArtikelPortaal from '@/components/nhka/ArtikelPortaal';
import RedaksiePortaal from '@/components/nhka/RedaksiePortaal';
import OmsendbriefKletsbot from '@/components/omsendbrief/OmsendbriefKletsbot';





const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/693a23272f683bba6f73274f_1766339692475_f44b3809.png';

// Offline indicator component
const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingCount, syncNow, syncStatus } = useOffline();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 ${isOnline ? 'bg-amber-500' : 'bg-red-500'
      } text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-300'} animate-pulse`} />
        <div>
          <p className="font-medium text-sm">
            {isOnline ? 'Terug aanlyn' : 'Jy is van-lyn-af'}
          </p>
          {pendingCount > 0 && (
            <p className="text-xs opacity-90">
              {pendingCount} aksie{pendingCount > 1 ? 's' : ''} wag om te sinkroniseer
            </p>
          )}
        </div>
      </div>
      {isOnline && pendingCount > 0 && syncStatus !== 'syncing' && (
        <button
          onClick={syncNow}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          Sinkroniseer Nou
        </button>
      )}
      {syncStatus === 'syncing' && (
        <div className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium">
          Sinkroniseer...
        </div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { currentView, isLoggedIn, loading, currentGemeente, currentUser, refreshGemeentes, gemeentes, setCurrentView } = useNHKA();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Onboarding guide for first-time users
  const { showOnboarding, completeOnboarding } = useOnboarding(currentUser?.id || null);

  // Check for payment status in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const geloofsonderrigPayment = urlParams.get('geloofsonderrig_payment');
    const betalingId = urlParams.get('betaling_id');

    if (geloofsonderrigPayment && betalingId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      if (geloofsonderrigPayment === 'success') {
        import('@/lib/supabase').then(({ supabase }) => {
          supabase.from('geloofsonderrig_betalings').update({ status: 'betaal', updated_at: new Date().toISOString() }).eq('id', betalingId).then(() => refreshGemeentes());
        });
      }
    } else if (paymentStatus) {
      window.history.replaceState({}, document.title, window.location.pathname);
      if (paymentStatus === 'success') refreshGemeentes();
    }
  }, []);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentView]);

  // Handle navigation from header
  const handleHeaderNavigate = (view: string) => {
    setCurrentView(view as any);
  };

  // Handle menu toggle for onboarding
  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading state only during initial gemeentes fetch
  // Once gemeentes have been fetched (even if empty), show the gemeente select screen
  if (loading && gemeentes.length === 0 && !currentGemeente && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002855] to-[#003d7a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white p-2 shadow-2xl">
            <img
              src={LOGO_URL}
              alt="Logo"
              className="w-full h-full rounded-full object-contain"
            />
          </div>
          <div className="w-12 h-12 border-4 border-[#D4A84B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Laai...</p>
        </div>
      </div>
    );
  }

  // Show Hoof Admin Dashboard if logged in as hoof_admin without a gemeente
  if (currentView === 'hoof-admin-dashboard' || (isLoggedIn && currentUser && isHoofAdmin(currentUser.rol) && !currentGemeente)) {
    return (
      <>
        <HoofAdminDashboard />
        <OfflineIndicator />
      </>
    );
  }

  // Show Moderator Dashboard if logged in as moderator
  if (currentView === 'moderator-dashboard' || (isLoggedIn && currentUser && currentUser.rol === 'moderator' && !currentGemeente)) {
    return (
      <>
        <ModeratorDashboard />
        <OfflineIndicator />
      </>
    );
  }

  // Show gemeente registration - MUST be before gemeente selection check
  if (currentView === 'gemeente-register') {
    return <GemeenteRegister />;
  }

  // Show gemeente selection if no gemeente selected
  if (currentView === 'gemeente-select' || (!currentGemeente && !isLoggedIn)) {
    return <GemeenteSelect />;
  }

  // Show user registration
  if (currentView === 'register') {
    return <UserRegister />;
  }

  // Show password reset
  if (currentView === 'wagwoord-herstel') {
    return <WagwoordHerstel />;
  }

  // Show login screen if not logged in
  if (!isLoggedIn || currentView === 'login') {
    return <LoginScreen />;
  }

  // Render the appropriate view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'my-wyk':
        return <MyWyk />;
      case 'gemeente-kaart':
        return <GemeenteKaart />;
      case 'denominasie-kaart':
        return <DenominasieKaart />;
      case 'profiel':
        return <Profiel />;
      case 'betaling':
        return <Betaling />;
      case 'pastorale-aksie':
        return <PastoraleAksie />;
      case 'krisis':
        return <KrisisVerslag />;
      case 'program':
        return <GemeenteProgram />;
      case 'vrae':
        return <Vrae />;
      case 'admin':
        return <AdminPanel />;
      case 'hoof-admin-dashboard':
        return <HoofAdminDashboard />;
      case 'moderator-dashboard':
        return <ModeratorDashboard />;
      case 'erediens-info':
        return <EreidiensInfo />;
      case 'nuusbrief':
        return <Nuusbrief />;
      case 'dokumente':
        return <DokumenteBestuur />;
      case 'my-dokumente':
        return <MyDokumente />;
      case 'oordrag':
        return <Oordrag />;
      case 'wyk-toewysing':
        return <WykToewysing />;
      case 'besoekpunt-toewysing':
        return <BesoekpuntToewysing />;
      case 'advertensies':
        return <Advertensies />;
      case 'gawes-soek':
        return <GawesSoek />;
      case 'geloofsgroei':
        return <Geloofsgroei />;
      case 'geloofsonderrig':
        return <Geloofsonderrig />;
      case 'lms-bestuur':
        return <LMSKursusBestuur />;
      case 'vbo':
        return <VBO />;
      case 'bedieningsbehoeftes':
        return <BedieningsBehoeftes />;
      case 'vanlyn-bestuur':
        return <OfflineQueueManager />;
      case 'sakramentsbeloftes':
        return <Sakramentsbeloftes />;
      case 'missionale-bediening':
        return <MissionaleBediening />;
      case 'boodskappe':
        return <Boodskappe />;
      case 'my-sertifikate':
        return <MySertifikate />;
      case 'notification-preferences':
        return <NotificationPreferences />;
      case 'kuberkermis':
        return <Kuberkermis />;
      case 'verhoudings':
        return <VerhoudingsBestuur />;
      case 'hulp-tutoriale':
        return <HulpTutoriale />;
      case 'kort-kragtig':
        return <KortKragtig />;
      case 'kort-kragtig-admin':
        return <KortKragtigAdmin />;
      case 'konsistorieboek':
        return <Konsistorieboek />;
      case 'bybelkennis':
        return <Bybelkennis />;
      case 'artikel-portaal':
        return <ArtikelPortaal />;
      case 'redaksie-portaal':
        return <RedaksiePortaal />;
      case 'omsendbrief-kletsbot':
        return <OmsendbriefKletsbot />;
      default:
        return <Dashboard />;
    }


  };





  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header onMenuToggle={handleMenuToggle} onNavigate={handleHeaderNavigate} />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className={`flex-1 min-h-0 p-4 md:p-6 lg:p-8 w-full overflow-y-auto ${currentView === 'geloofsonderrig' ? 'geloofsonderrig-onderwerpe-scroll' : 'max-w-6xl mx-auto'}`}>
          {renderView()}
        </main>
      </div>

      {/* Offline Indicator */}
      <InstallPrompt />
      <OfflineIndicator />

      {/* Onboarding Guide for first-time users */}
      {showOnboarding && (
        <OnboardingGids
          onComplete={completeOnboarding}
          onMenuToggle={handleMenuToggle}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img
                src={LOGO_URL}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold text-[#002855]">Dra Mekaar se Laste</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Nederduitsch Hervormde Kerk van Afrika
          </p>
          <p className="text-xs text-gray-400 mt-1">
            "Dra mekaar se laste en vervul so die wet van Christus" — Galasiërs 6:2
          </p>
        </div>
      </footer>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <NHKAProvider>
      <OfflineProvider>
        <AppContent />
      </OfflineProvider>
    </NHKAProvider>
  );
};

export default AppLayout;
