import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Gebruiker,
  Wyk,
  PastoraleAksie,
  KrisisVerslag,
  Vraag,
  GemeenteProgram,
  Gemeente,
  GemeenteStats,
  AppView,
  UserRole,
  Besoekpunt,
  LidmaatVerhouding,
  Betaling,
  BetalingTipe,
  isHoofAdmin,
  LMSKursus,
  sortWykeByNommer
} from '@/types/nhka';

interface NHKAContextType {
  // Current user and gemeente
  currentUser: Gebruiker | null;
  setCurrentUser: (user: Gebruiker | null) => void;
  currentGemeente: Gemeente | null;
  setCurrentGemeente: (gemeente: Gemeente | null) => void;
  isLoggedIn: boolean;

  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // LMS full screen (Geloofsgroei kursus speler)
  lmsFullScreen: boolean;
  setLmsFullScreen: (v: boolean) => void;

  // Language
  language: 'af' | 'en';
  setLanguage: (lang: 'af' | 'en') => void;

  // Data
  gemeentes: Gemeente[];
  gemeenteStats: GemeenteStats[];
  gebruikers: Gebruiker[];
  allGebruikers: Gebruiker[]; // All users across all gemeentes (for hoof_admin)
  wyke: Wyk[];
  besoekpunte: Besoekpunt[];
  verhoudings: LidmaatVerhouding[];
  betalings: Betaling[];
  aksies: PastoraleAksie[];
  krisisse: KrisisVerslag[];
  vrae: Vraag[];
  program: GemeenteProgram[];
  kursusse: LMSKursus[];

  // Loading states
  loading: boolean;

  // Actions
  refreshData: () => Promise<void>;
  refreshGemeentes: () => Promise<void>;
  refreshAllGemeenteStats: () => Promise<void>;
  refreshKursusse: () => Promise<void>;
  login: (userId: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsHoofAdmin: (epos: string, wagwoord: string) => Promise<{ success: boolean; error?: string }>;
  loginAsModerator: (epos: string, wagwoord: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  selectGemeente: (gemeenteId: string) => Promise<void>;

  // CRUD operations
  addPastoraleAksie: (aksie: Partial<PastoraleAksie>) => Promise<void>;
  addKrisisVerslag: (verslag: Partial<KrisisVerslag>) => Promise<void>;
  updateKrisisStatus: (id: string, status: string) => Promise<void>;
  addVraag: (vraag: Partial<Vraag>) => Promise<void>;
  updateVraag: (id: string, updates: Partial<Vraag>) => Promise<void>;
  addGebruiker: (gebruiker: Partial<Gebruiker> & { wagwoord?: string }) => Promise<void>;
  updateGebruiker: (id: string, updates: Partial<Gebruiker>) => Promise<void>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  addProgram: (event: Partial<GemeenteProgram>) => Promise<void>;
  registerGemeente: (gemeente: Partial<Gemeente>) => Promise<{ success: boolean; gemeente?: Gemeente; error?: string }>;
  registerUser: (user: Partial<Gebruiker> & { wagwoord: string }) => Promise<{ success: boolean; user?: Gebruiker; error?: string }>;

  // Hoof Admin operations
  addHoofAdmin: (userData: Partial<Gebruiker> & { wagwoord: string }) => Promise<{ success: boolean; user?: Gebruiker; error?: string }>;
  getHoofAdmins: () => Gebruiker[];

  // Wyk operations
  addWyk: (wyk: Partial<Wyk>) => Promise<{ success: boolean; wyk?: Wyk; error?: string }>;
  updateWyk: (id: string, updates: Partial<Wyk>) => Promise<void>;
  deleteWyk: (id: string) => Promise<void>;

  // Besoekpunt operations
  addBesoekpunt: (besoekpunt: Partial<Besoekpunt>) => Promise<{ success: boolean; besoekpunt?: Besoekpunt; error?: string }>;
  updateBesoekpunt: (id: string, updates: Partial<Besoekpunt>) => Promise<void>;
  deleteBesoekpunt: (id: string) => Promise<void>;
  assignLidmaatToBesoekpunt: (lidmaatId: string, besoekpuntId: string | null) => Promise<void>;

  // Verhouding operations
  addVerhouding: (verhouding: Partial<LidmaatVerhouding>) => Promise<{ success: boolean; error?: string }>;
  deleteVerhouding: (id: string) => Promise<void>;

  // Betaling operations
  addBetaling: (betaling: Partial<Betaling>) => Promise<{ success: boolean; betaling?: Betaling; error?: string }>;
  processBetaling: (bedrag: number, tipe: BetalingTipe, beskrywing?: string) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;

  // SMS functions
  sendSMS: (to: string | string[], message: string, type: 'krisis' | 'bemoediging' | 'algemeen') => Promise<{ success: boolean; message?: string }>;
  sendKrisisAlert: (krisis: Partial<KrisisVerslag>, gebruikerNaam: string) => Promise<void>;
  sendBemoediging: (recipients: Gebruiker[], message: string) => Promise<{ success: boolean; sent: number }>;

  // Payment functions
  createYocoCheckout: (amount: number, metadata?: any) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
  processGeloofsonderrigBetaling: (leerderId: string, opts?: { namens?: boolean }) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
  merkGeloofsonderrigBetaal: (leerderIds: string[]) => Promise<{ success: boolean; error?: string }>;

  // Global User Search
  searchGlobalUsers: (query: string) => Promise<Gebruiker[]>;
}

const NHKAContext = createContext<NHKAContextType | undefined>(undefined);

export const useNHKA = () => {
  const context = useContext(NHKAContext);
  if (!context) {
    throw new Error('useNHKA must be used within NHKAProvider');
  }
  return context;
};

export const NHKAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<Gebruiker | null>(null);
  const [currentGemeente, setCurrentGemeenteState] = useState<Gemeente | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('gemeente-select');
  const [lmsFullScreen, setLmsFullScreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);

  const [gemeentes, setGemeentes] = useState<Gemeente[]>([]);
  const [gemeenteStats, setGemeenteStats] = useState<GemeenteStats[]>([]);
  const [gebruikers, setGebruikers] = useState<Gebruiker[]>([]);
  const [allGebruikers, setAllGebruikers] = useState<Gebruiker[]>([]);
  const [wyke, setWyke] = useState<Wyk[]>([]);
  const [besoekpunte, setBesoekpunte] = useState<Besoekpunt[]>([]);
  const [verhoudings, setVerhoudings] = useState<LidmaatVerhouding[]>([]);
  const [betalings, setBetalings] = useState<Betaling[]>([]);
  const [aksies, setAksies] = useState<PastoraleAksie[]>([]);
  const [krisisse, setKrisisse] = useState<KrisisVerslag[]>([]);
  //   vrae: Vraag[]; should be singular inside state declaration
  const [vrae, setVrae] = useState<Vraag[]>([]);
  const [program, setProgram] = useState<GemeenteProgram[]>([]);
  const [kursusse, setKursusse] = useState<LMSKursus[]>([]);

  const isLoggedIn = currentUser !== null;

  // Get default opening view from menu layout (first item in layout for role)
  const getDefaultViewForRole = async (role: string, gemeenteId?: string | null): Promise<AppView> => {
    let searchRole = role;
    if (['ouderling', 'diaken', 'groepleier', 'kerkraad'].includes(searchRole)) searchRole = 'groepleier';
    else if (['subadmin', 'admin'].includes(searchRole)) searchRole = 'admin';

    let layout: any[] | null = null;
    if (gemeenteId) {
      const { data } = await supabase.from('sys_menu_layouts').select('layout').eq('role', searchRole).eq('gemeente_id', gemeenteId).maybeSingle();
      layout = data?.layout;
    }
    if (!Array.isArray(layout) || layout.length === 0) {
      const { data } = await supabase.from('sys_menu_layouts').select('layout').eq('role', searchRole).is('gemeente_id', null).maybeSingle();
      layout = data?.layout;
    }
    if (!Array.isArray(layout) || layout.length === 0) {
      if (role === 'eksterne_gebruiker') return 'geloofsgroei';
      if (['admin', 'subadmin'].includes(role)) return 'redaksie-portaal';
      return 'dashboard';
    }

    const firstItem = layout.find((item: any) => item.type !== 'category');
    if (!firstItem?.id) {
      if (role === 'eksterne_gebruiker') return 'geloofsgroei';
      if (['admin', 'subadmin'].includes(role)) return 'redaksie-portaal';
      return 'dashboard';
    }

    const viewId = String(firstItem.id).replace(/-\d{10,}-[a-z0-9]+$/, '') || firstItem.id;
    return viewId as AppView;
  };

  // Session storage keys
  const SESSION_USER_KEY = 'nhka_user_id';
  const SESSION_GEMEENTE_KEY = 'nhka_gemeente_id';
  const SESSION_VIEW_KEY = 'nhka_view';
  const SESSION_LANG_KEY = 'nhka_lang';

  // Language State
  const [language, setLanguageState] = useState<'af' | 'en'>('af');

  const setLanguage = (lang: 'af' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem(SESSION_LANG_KEY, lang);
  };

  // Wrapper for setCurrentUser that also persists to localStorage
  const setCurrentUser = (user: Gebruiker | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(SESSION_USER_KEY, user.id);
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
    }
  };

  // Wrapper for setCurrentGemeente that also persists to localStorage
  const setCurrentGemeente = (gemeente: Gemeente | null) => {
    setCurrentGemeenteState(gemeente);
    if (gemeente) {
      localStorage.setItem(SESSION_GEMEENTE_KEY, gemeente.id);
    } else {
      localStorage.removeItem(SESSION_GEMEENTE_KEY);
    }
  };

  // Fetch all gemeentes
  const fetchGemeentes = async () => {
    try {
      console.log('Fetching gemeentes...');
      const { data, error } = await supabase
        .from('gemeentes')
        .select('*')
        .eq('aktief', true)
        .order('naam');

      if (error) {
        console.error('Gemeentes fetch error:', error);
      } else if (data) {
        console.log('Gemeentes loaded:', data.length);
        setGemeentes(data);
        return data; // Return the data for session restoration
      }
    } catch (error) {
      console.error('Error fetching gemeentes:', error);
    }
    return [];
  };

  const fetchKursusse = async () => {
    try {
      const { data, error } = await supabase
        .from('lms_kursusse')
        .select('*')
        .eq('is_aktief', true)
        .eq('is_gepubliseer', true)
        .order('titel');

      if (error) {
        console.error('Kursusse fetch error:', error);
      } else if (data) {
        setKursusse(data);
      }
    } catch (error) {
      console.error('Error fetching kursusse:', error);
    }
  };


  // Fetch all gemeente statistics for hoof_admin
  const fetchAllGemeenteStats = async () => {
    try {
      const stats: GemeenteStats[] = [];

      for (const gemeente of gemeentes) {
        const [
          { data: gebruikersData },
          { data: wykeData },
          { data: besoekpunteData },
          { data: krisisseData },
          { data: vraeData },
          { data: betalingsData },
          { data: aksiesData }
        ] = await Promise.all([
          supabase.from('gebruikers').select('id').eq('gemeente_id', gemeente.id),
          supabase.from('wyke').select('id').eq('gemeente_id', gemeente.id),
          supabase.from('besoekpunte').select('id').eq('gemeente_id', gemeente.id),
          supabase.from('krisis_verslae').select('id, status').eq('gemeente_id', gemeente.id),
          supabase.from('vrae').select('id, status').eq('gemeente_id', gemeente.id),
          supabase.from('betalings').select('bedrag, status').eq('gemeente_id', gemeente.id),
          supabase.from('pastorale_aksies').select('id, datum').eq('gemeente_id', gemeente.id)
        ]);

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        stats.push({
          gemeente_id: gemeente.id,
          gemeente_naam: gemeente.naam,
          logo_url: gemeente.logo_url,
          totale_lidmate: gebruikersData?.length || 0,
          totale_wyke: wykeData?.length || 0,
          totale_besoekpunte: besoekpunteData?.length || 0,
          oop_krisisse: krisisseData?.filter(k => k.status !== 'opgelos').length || 0,
          nuwe_vrae: vraeData?.filter(v => v.status === 'nuut').length || 0,
          totale_betalings: betalingsData?.filter(b => b.status === 'voltooi').reduce((sum, b) => sum + b.bedrag, 0) || 0,
          aksies_maand: aksiesData?.filter(a => {
            const d = new Date(a.datum);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          }).length || 0
        });
      }

      setGemeenteStats(stats);
    } catch (error) {
      console.error('Error fetching gemeente stats:', error);
    }
  };

  // Fetch all users (for hoof_admin)
  const fetchAllGebruikers = async () => {
    try {
      const { data, error } = await supabase
        .from('gebruikers')
        .select('*')
        .order('naam');

      if (error) {
        console.error('All gebruikers fetch error:', error);
      } else if (data) {
        setAllGebruikers(data);
      }
    } catch (error) {
      console.error('Error fetching all gebruikers:', error);
    }
  };

  // Fetch data for selected gemeente
  const fetchData = async () => {
    if (!currentGemeente) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [
        { data: gebruikersData },
        { data: wykeData },
        { data: besoekpunteData },
        { data: verhoudingsData },
        { data: betalingsData },
        { data: aksiesData },
        { data: krisisseData },
        { data: vraeData },
        { data: programData }
      ] = await Promise.all([
        supabase.from('gebruikers').select('*').eq('gemeente_id', currentGemeente.id).order('naam'),
        supabase.from('wyke').select('*').eq('gemeente_id', currentGemeente.id).order('naam'),
        supabase.from('besoekpunte').select('*').eq('gemeente_id', currentGemeente.id).order('naam'),
        supabase.from('lidmaat_verhoudings').select('*').eq('gemeente_id', currentGemeente.id),
        supabase.from('betalings').select('*').eq('gemeente_id', currentGemeente.id).order('created_at', { ascending: false }),
        supabase.from('pastorale_aksies').select('*').eq('gemeente_id', currentGemeente.id).order('datum', { ascending: false }),
        supabase.from('krisis_verslae').select('*').eq('gemeente_id', currentGemeente.id).order('created_at', { ascending: false }),
        supabase.from('vrae').select('*').eq('gemeente_id', currentGemeente.id).order('created_at', { ascending: false }),
        supabase.from('gemeente_program').select('*').eq('gemeente_id', currentGemeente.id).order('datum')
      ]);

      if (gebruikersData) setGebruikers(gebruikersData);
      if (wykeData) setWyke(sortWykeByNommer(wykeData));
      if (besoekpunteData) setBesoekpunte(besoekpunteData);
      if (verhoudingsData) setVerhoudings(verhoudingsData);
      if (betalingsData) setBetalings(betalingsData);
      if (aksiesData) setAksies(aksiesData);
      if (krisisseData) setKrisisse(krisisseData);
      if (vraeData) setVrae(vraeData);
      if (programData) setProgram(programData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Session restoration - runs once on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedUserId = localStorage.getItem(SESSION_USER_KEY);
      const storedGemeenteId = localStorage.getItem(SESSION_GEMEENTE_KEY);

      console.log('Restoring session...', { storedUserId, storedGemeenteId });

      if (!storedUserId) {
        // No stored session, just fetch gemeentes and show selection
        const loadedGemeentes = await fetchGemeentes();
        const storedLang = localStorage.getItem(SESSION_LANG_KEY) as 'af' | 'en';
        if (storedLang) setLanguageState(storedLang);

        setLoading(false);
        setSessionRestored(true);
        return;
      }

      try {
        // Fetch the stored user from database
        const { data: userData, error: userError } = await supabase
          .from('gebruikers')
          .select('*')
          .eq('id', storedUserId)
          .single();

        if (userError || !userData) {
          console.log('Stored user not found, clearing session');
          localStorage.removeItem(SESSION_USER_KEY);
          localStorage.removeItem(SESSION_GEMEENTE_KEY);
          await fetchGemeentes();
          setLoading(false);
          setSessionRestored(true);
          return;
        }

        // Check if user is active
        if (!userData.aktief) {
          console.log('User is inactive, clearing session');
          localStorage.removeItem(SESSION_USER_KEY);
          localStorage.removeItem(SESSION_GEMEENTE_KEY);
          await fetchGemeentes();
          setLoading(false);
          setSessionRestored(true);
          return;
        }

        // Handle different user types
        if (isHoofAdmin(userData.rol)) {
          // Hoof admin doesn't need a gemeente
          console.log('Restoring hoof_admin session');
          setCurrentUserState(userData);
          setCurrentView('hoof-admin-dashboard');
          await fetchGemeentes();
          setLoading(false);
          setSessionRestored(true);
          return;
        }

        if (userData.rol === 'moderator') {
          // Moderator doesn't need a gemeente
          console.log('Restoring moderator session');
          setCurrentUserState(userData);
          setCurrentView('moderator-dashboard');
          await fetchGemeentes();
          setLoading(false);
          setSessionRestored(true);
          return;
        }

        // For regular users, we need to load their gemeente
        const gemeenteIdToLoad = userData.gemeente_id || storedGemeenteId;

        if (!gemeenteIdToLoad) {
          console.log('No gemeente ID found for user, clearing session');
          localStorage.removeItem(SESSION_USER_KEY);
          localStorage.removeItem(SESSION_GEMEENTE_KEY);
          await fetchGemeentes();
          setLoading(false);
          setSessionRestored(true);
          return;
        }

        // Fetch the gemeente
        const { data: gemeenteData, error: gemeenteError } = await supabase
          .from('gemeentes')
          .select('*')
          .eq('id', gemeenteIdToLoad)
          .eq('aktief', true)
          .single();

        if (gemeenteError || !gemeenteData) {
          console.log('Stored gemeente not found or inactive, clearing session');
          localStorage.removeItem(SESSION_USER_KEY);
          localStorage.removeItem(SESSION_GEMEENTE_KEY);
          await fetchGemeentes();
          setLoading(false);
          setSessionRestored(true);
          return;
        }

        // Successfully restored session
        console.log('Session restored successfully', { user: userData.naam, gemeente: gemeenteData.naam });
        setCurrentGemeenteState(gemeenteData);
        localStorage.setItem(SESSION_GEMEENTE_KEY, gemeenteData.id);
        setCurrentUserState(userData);

        // Opening page = first item in menu layout for this role (and gemeente)
        const defaultView = await getDefaultViewForRole(userData.rol, gemeenteData.id);
        setCurrentView(defaultView);

        // Also fetch all gemeentes for navigation
        await fetchGemeentes();

      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem(SESSION_USER_KEY);
        localStorage.removeItem(SESSION_GEMEENTE_KEY);
        await fetchGemeentes();
      }

      setLoading(false);
      setSessionRestored(true);
    };

    restoreSession();
  }, []); // Only run once on mount

  // Fetch gemeente data when currentGemeente changes (but not during session restoration)
  useEffect(() => {
    if (currentGemeente && sessionRestored) {
      fetchData();
    }
  }, [currentGemeente, sessionRestored]);

  // Fetch stats when gemeentes change and user is hoof_admin
  useEffect(() => {
    if (currentUser && isHoofAdmin(currentUser.rol) && gemeentes.length > 0) {
      fetchAllGemeenteStats();
      fetchAllGebruikers();
    }
  }, [currentUser, gemeentes]);


  const selectGemeente = async (gemeenteId: string) => {
    const gemeente = gemeentes.find(g => g.id === gemeenteId);
    if (gemeente) {
      setCurrentGemeente(gemeente);
      setCurrentView('login');
    }
  };

  const login = async (userId: string, password?: string) => {
    try {
      const user = gebruikers.find(g => g.id === userId);
      if (!user) {
        return { success: false, error: 'Gebruiker nie gevind nie' };
      }

      if (!user.aktief) {
        return { success: false, error: 'Hierdie rekening is gedeaktiveer' };
      }

      // If password is provided, verify it (unless it's a first-time login without a set password?)
      // Actually, all users should have a password now.
      if (password) {
        const passwordHash = btoa(password);
        if (user.wagwoord_hash && user.wagwoord_hash !== passwordHash) {
          return { success: false, error: 'Ongeldige wagwoord' };
        }
      } else if (user.wagwoord_hash) {
        // Password required but not provided
        return { success: false, error: 'Wagwoord word vereis' };
      }

      setCurrentUser(user);

      // Opening page = first item in menu layout for this role (and gemeente)
      const defaultView = await getDefaultViewForRole(user.rol, currentGemeente?.id);
      setCurrentView(defaultView);
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Special login for hoof_admin - they don't need to select a gemeente
  const loginAsHoofAdmin = async (epos: string, wagwoord: string) => {
    try {
      // Find hoof_admin user by email
      const { data, error } = await supabase
        .from('gebruikers')
        .select('*')
        .eq('epos', epos)
        .eq('rol', 'hoof_admin')
        .single();

      if (error || !data) {
        return { success: false, error: 'Ongeldige e-pos of wagwoord' };
      }

      // Verify password (simple hash for demo)
      const wagwoord_hash = btoa(wagwoord);
      if (data.wagwoord_hash !== wagwoord_hash) {
        return { success: false, error: 'Ongeldige e-pos of wagwoord' };
      }

      setCurrentUser(data);
      setCurrentView('hoof-admin-dashboard');
      return { success: true };
    } catch (error: any) {
      console.error('Hoof admin login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Special login for moderator - they don't need to select a gemeente
  const loginAsModerator = async (epos: string, wagwoord: string) => {
    try {
      // Find moderator user by email
      const { data, error } = await supabase
        .from('gebruikers')
        .select('*')
        .eq('epos', epos)
        .eq('rol', 'moderator')
        .single();

      if (error || !data) {
        return { success: false, error: 'Ongeldige e-pos of wagwoord' };
      }

      // Verify password (simple hash for demo)
      const wagwoord_hash = btoa(wagwoord);
      if (data.wagwoord_hash !== wagwoord_hash) {
        return { success: false, error: 'Ongeldige e-pos of wagwoord' };
      }

      if (!data.aktief) {
        return { success: false, error: 'Hierdie rekening is gedeaktiveer' };
      }

      setCurrentUser(data);
      setCurrentView('moderator-dashboard');
      return { success: true };
    } catch (error: any) {
      console.error('Moderator login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    // Clear localStorage session
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(SESSION_GEMEENTE_KEY);
    localStorage.removeItem(SESSION_VIEW_KEY);

    // Clear state
    setCurrentUserState(null);
    setCurrentGemeenteState(null);
    setCurrentView('gemeente-select');

    // Clear gemeente-specific data
    setGebruikers([]);
    setWyke([]);
    setBesoekpunte([]);
    setVerhoudings([]);
    setBetalings([]);
    setAksies([]);
    setKrisisse([]);
    setVrae([]);
    setProgram([]);
  };




  const refreshData = async () => {
    await fetchData();
  };

  const refreshGemeentes = async () => {
    await fetchGemeentes();
  };

  const refreshAllGemeenteStats = async () => {
    await fetchAllGemeenteStats();
    await fetchAllGebruikers();
    await fetchAllGebruikers();
  };

  const refreshKursusse = async () => {
    await fetchKursusse();
  };

  // Get all hoof_admins
  const getHoofAdmins = (): Gebruiker[] => {
    return allGebruikers.filter(g => g.rol === 'hoof_admin');
  };

  // Add new hoof_admin (only hoof_admin can do this)
  const addHoofAdmin = async (userData: Partial<Gebruiker> & { wagwoord: string }) => {
    try {
      const { wagwoord, ...userInfo } = userData;

      // Simple hash for demo (in production, use proper auth)
      const wagwoord_hash = btoa(wagwoord);

      const { data, error } = await supabase
        .from('gebruikers')
        .insert([{
          ...userInfo,
          wagwoord_hash,
          rol: 'hoof_admin',
          aktief: true,
          gemeente_id: null // Hoof admin is not tied to any gemeente
        }])
        .select()
        .single();

      if (error) {
        console.error('Hoof admin registration error:', error);
        return { success: false, error: error.message };
      }

      await fetchAllGebruikers();
      return { success: true, user: data };
    } catch (error: any) {
      console.error('Hoof admin registration error:', error);
      return { success: false, error: error.message };
    }
  };

  // Register new gemeente
  const registerGemeente = async (gemeente: Partial<Gemeente>) => {
    try {
      console.log('Attempting to register gemeente:', gemeente);
      const { data, error } = await supabase
        .from('gemeentes')
        .insert([{
          ...gemeente,
          aktief: true,
          is_demo: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Gemeente registration error (Supabase):', error);
        return { success: false, error: error.message || JSON.stringify(error) };
      }

      console.log('Gemeente registered successfully:', data);
      await fetchGemeentes();
      return { success: true, gemeente: data };
    } catch (error: any) {
      console.error('Gemeente registration error (Try/Catch):', error);
      return { success: false, error: error.message || 'Onbekende fout tydens registrasie' };
    }
  };

  // Register new user
  // Register new user
  const registerUser = async (userData: Partial<Gebruiker> & { wagwoord: string; popia_toestemming?: boolean; popia_toestemming_datum?: string }) => {
    try {
      const { wagwoord, popia_toestemming, popia_toestemming_datum, rol, app_roles, ...userInfo } = userData;

      // Simple hash for demo (in production, use proper auth)
      const wagwoord_hash = btoa(wagwoord);
      const roles = app_roles?.length ? app_roles : (rol ? [rol] : ['lidmaat']);

      const { data, error } = await supabase
        .from('gebruikers')
        .insert([{
          ...userInfo,
          rol: rol || 'lidmaat',
          app_roles: roles,
          wagwoord_hash,
          aktief: true,
          gemeente_id: currentGemeente?.id,
          popia_toestemming: popia_toestemming || false,
          popia_toestemming_datum: popia_toestemming_datum || null
        }])
        .select()
        .single();

      if (error) {
        console.error('User registration error:', error);
        return { success: false, error: error.message };
      }

      await refreshData();
      return { success: true, user: data };
    } catch (error: any) {
      console.error('User registration error:', error);
      return { success: false, error: error.message };
    }
  };


  // Wyk operations
  const addWyk = async (wyk: Partial<Wyk>) => {
    try {
      const { data, error } = await supabase
        .from('wyke')
        .insert([{
          ...wyk,
          gemeente_id: currentGemeente?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Wyk add error:', error);
        return { success: false, error: error.message };
      }

      await refreshData();
      return { success: true, wyk: data };
    } catch (error: any) {
      console.error('Wyk add error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateWyk = async (id: string, updates: Partial<Wyk>) => {
    const { error } = await supabase
      .from('wyke')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await refreshData();
  };

  const deleteWyk = async (id: string) => {
    const { error } = await supabase
      .from('wyke')
      .delete()
      .eq('id', id);
    if (!error) await refreshData();
  };

  // Besoekpunt operations
  const addBesoekpunt = async (besoekpunt: Partial<Besoekpunt>) => {
    try {
      const { data, error } = await supabase
        .from('besoekpunte')
        .insert([{
          ...besoekpunt,
          gemeente_id: currentGemeente?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Besoekpunt add error:', error);
        return { success: false, error: error.message };
      }

      await refreshData();
      return { success: true, besoekpunt: data };
    } catch (error: any) {
      console.error('Besoekpunt add error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateBesoekpunt = async (id: string, updates: Partial<Besoekpunt>) => {
    const { error } = await supabase
      .from('besoekpunte')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await refreshData();
  };

  const deleteBesoekpunt = async (id: string) => {
    const { error } = await supabase
      .from('besoekpunte')
      .delete()
      .eq('id', id);
    if (!error) await refreshData();
  };

  const assignLidmaatToBesoekpunt = async (lidmaatId: string, besoekpuntId: string | null) => {
    // Get the wyk_id from the besoekpunt
    let wykId: string | null = null;
    if (besoekpuntId) {
      const bp = besoekpunte.find(b => b.id === besoekpuntId);
      if (bp) {
        wykId = bp.wyk_id || null;
      }
    }

    const { error } = await supabase
      .from('gebruikers')
      .update({
        besoekpunt_id: besoekpuntId,
        wyk_id: wykId,
        updated_at: new Date().toISOString()
      })
      .eq('id', lidmaatId);
    if (!error) await refreshData();
  };


  // Verhouding operations
  const addVerhouding = async (verhouding: Partial<LidmaatVerhouding>) => {
    try {
      const { error } = await supabase
        .from('lidmaat_verhoudings')
        .insert([{
          ...verhouding,
          gemeente_id: currentGemeente?.id
        }]);

      if (error) {
        console.error('Verhouding add error:', error);
        return { success: false, error: error.message };
      }

      await refreshData();
      return { success: true };
    } catch (error: any) {
      console.error('Verhouding add error:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteVerhouding = async (id: string) => {
    const { error } = await supabase
      .from('lidmaat_verhoudings')
      .delete()
      .eq('id', id);
    if (!error) await refreshData();
  };

  // Betaling operations
  const addBetaling = async (betaling: Partial<Betaling>) => {
    try {
      const { data, error } = await supabase
        .from('betalings')
        .insert([{
          ...betaling,
          gemeente_id: currentGemeente?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Betaling add error:', error);
        return { success: false, error: error.message };
      }

      await refreshData();
      return { success: true, betaling: data };
    } catch (error: any) {
      console.error('Betaling add error:', error);
      return { success: false, error: error.message };
    }
  };

  const processBetaling = async (bedrag: number, tipe: BetalingTipe, beskrywing?: string) => {
    try {
      // First create a pending payment record
      const { data: betalingData, error: betalingError } = await supabase
        .from('betalings')
        .insert([{
          gebruiker_id: currentUser?.id,
          bedrag,
          tipe,
          beskrywing: tipe === 'ander' ? beskrywing : null,
          status: 'hangende',
          gemeente_id: currentGemeente?.id
        }])
        .select()
        .single();

      if (betalingError) {
        return { success: false, error: betalingError.message };
      }

      // Create Yoco checkout
      const baseUrl = window.location.origin;

      // Create Yoco checkout
      // baseUrl is already declared above if present, or we can just use window.location.origin directly or ensure single declaration.
      // Actually, looking at previous context, baseUrl might have been declared in the block I replaced.
      // Let's just use window.location.origin in the URL construction to be safe and remove the variable if it conflicts,
      // or just remove the second declaration if it persists.

      const response = await fetch('/yoco-proxy.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(bedrag * 100), // Convert to cents and round
          currency: 'ZAR',
          successUrl: `${baseUrl}?payment=success&betaling_id=${betalingData.id}`,
          cancelUrl: `${baseUrl}?payment=cancelled&betaling_id=${betalingData.id}`,
          failureUrl: `${baseUrl}?payment=failed&betaling_id=${betalingData.id}`,
          metadata: {
            gemeente_id: currentGemeente?.id,
            gemeente_naam: currentGemeente?.naam,
            gebruiker_id: currentUser?.id,
            betaling_id: betalingData.id,
            tipe,
            beskrywing
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Yoco checkout error:', data);

        let errorMsg = data.error || 'Kon nie betaling skep nie';
        try {
          const body = JSON.parse(data.error);
          if (body.error) errorMsg = body.error;
        } catch (e) { }

        // Update payment status to failed
        await supabase
          .from('betalings')
          .update({ status: 'misluk' })
          .eq('id', betalingData.id);
        return { success: false, error: errorMsg };
      }

      if (data?.redirectUrl) {
        // Update payment with checkout ID
        if (data.checkoutId) {
          await supabase
            .from('betalings')
            .update({ yoco_checkout_id: data.checkoutId })
            .eq('id', betalingData.id);
        }
        return { success: true, redirectUrl: data.redirectUrl };
      }

      return { success: false, error: data?.error || 'Kon nie betaling skep nie' };
    } catch (error: any) {
      console.error('Process betaling error:', error);

      let errorMsg = error.message;
      try {
        const body = JSON.parse(error.message);
        if (body.error) errorMsg = body.error;
      } catch (e) { }

      return { success: false, error: errorMsg };
    }
  };

  // SMS Functions
  const sendSMS = async (to: string | string[], message: string, type: 'krisis' | 'bemoediging' | 'algemeen') => {
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to, message, type }
      });

      if (error) {
        console.error('SMS error:', error);
        return { success: false, message: error.message };
      }

      return { success: data?.success || false, message: data?.message };
    } catch (error: any) {
      console.error('SMS error:', error);
      return { success: false, message: error.message };
    }
  };

  const sendKrisisAlert = async (krisis: Partial<KrisisVerslag>, gebruikerNaam: string) => {
    if (krisis.prioriteit !== 'hoog' && krisis.prioriteit !== 'dringend') {
      return;
    }

    const kerkraadMembers = gebruikers.filter(g =>
      ['kerkraad', 'admin', 'hoof_admin', 'subadmin', 'predikant'].includes(g.rol)
    );

    const phoneNumbers = kerkraadMembers
      .map(m => m.selfoon)
      .filter(Boolean) as string[];

    if (phoneNumbers.length === 0) {
      console.log('No kerkraad phone numbers found');
      return;
    }

    const prioriteitLabel = krisis.prioriteit === 'dringend' ? 'DRINGEND' : 'HOOG';
    const message = `[NHKA ${prioriteitLabel}] Krisisverslag: ${krisis.tipe}\nLidmaat: ${gebruikerNaam}\n${krisis.beskrywing?.substring(0, 100)}${(krisis.beskrywing?.length || 0) > 100 ? '...' : ''}\n\nMeld asb aan by die app vir meer besonderhede.`;

    await sendSMS(phoneNumbers, message, 'krisis');
  };

  const sendBemoediging = async (recipients: Gebruiker[], message: string) => {
    const phoneNumbers = recipients
      .map(r => r.selfoon)
      .filter(Boolean) as string[];

    if (phoneNumbers.length === 0) {
      return { success: false, sent: 0 };
    }

    const fullMessage = `[NHKA Bemoediging] ${message}\n\n- Jou gemeente dink aan jou.`;
    const result = await sendSMS(phoneNumbers, fullMessage, 'bemoediging');

    return { success: result.success, sent: phoneNumbers.length };
  };

  // Payment Functions
  const createYocoCheckout = async (amount: number, metadata?: any) => {
    try {
      const baseUrl = window.location.origin;

      // Use local PHP proxy instead of Supabase Edge Function to avoid deployment issues
      const response = await fetch('/yoco-proxy.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents and round
          currency: 'ZAR',
          successUrl: `${baseUrl}?payment=success`,
          cancelUrl: `${baseUrl}?payment=cancelled`,
          failureUrl: `${baseUrl}?payment=failed`,
          metadata: {
            gemeente_id: currentGemeente?.id,
            gemeente_naam: currentGemeente?.naam,
            ...metadata
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Yoco checkout error:', data);
        let errorMsg = data.error || 'Kon nie betaling skep nie';
        try {
          // Check if nested error JSON
          const body = JSON.parse(data.error);
          if (body.error) errorMsg = body.error;
        } catch (e) { }
        return { success: false, error: errorMsg };
      }

      if (data?.redirectUrl) {
        return { success: true, redirectUrl: data.redirectUrl };
      }

      return { success: false, error: data?.error || 'Kon nie betaling skep nie' };
    } catch (error: any) {
      console.error('Yoco checkout error:', error);
      let errorMsg = error.message;
      try {
        const body = JSON.parse(error.message);
        if (body.error) errorMsg = body.error;
      } catch (e) { }
      return { success: false, error: errorMsg };
    }
  };

  const processGeloofsonderrigBetaling = async (leerderId: string, opts?: { namens?: boolean }) => {
    if (!currentGemeente || !currentUser) return { success: false, error: 'Geen gemeente of gebruiker' };
    const isNamens = opts?.namens === true;
    try {
      const { data: betalingData, error: betalingError } = await supabase
        .from('geloofsonderrig_betalings')
        .insert([{
          leerder_id: leerderId,
          gemeente_id: currentGemeente.id,
          bedrag: 10000,
          status: 'hangende',
          betaal_tipe: isNamens ? 'namens' : 'self',
          betaal_deur: isNamens ? currentUser.id : null
        }])
        .select()
        .single();

      if (betalingError) {
        const msg = betalingError.message || '';
        if (msg.includes('404') || msg.includes('does not exist') || msg.includes('relation')) {
          return { success: false, error: 'Die betalingstabel bestaan nog nie. Voer asseblief die databasis migrasies uit (supabase db push).' };
        }
        return { success: false, error: betalingError.message };
      }

      const baseUrl = window.location.origin;
      const response = await fetch('/yoco-proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 10000,
          currency: 'ZAR',
          successUrl: `${baseUrl}?geloofsonderrig_payment=success&betaling_id=${betalingData.id}`,
          cancelUrl: `${baseUrl}?geloofsonderrig_payment=cancelled&betaling_id=${betalingData.id}`,
          failureUrl: `${baseUrl}?geloofsonderrig_payment=failed&betaling_id=${betalingData.id}`,
          metadata: { geloofsonderrig_betaling_id: betalingData.id }
        })
      });

      const data = await response.json();
      if (!response.ok) return { success: false, error: data?.error || 'Kon nie betaling skep nie' };
      if (data?.redirectUrl) return { success: true, redirectUrl: data.redirectUrl };
      return { success: false, error: data?.error || 'Kon nie betaling skep nie' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const merkGeloofsonderrigBetaal = async (leerderIds: string[]) => {
    if (!currentGemeente || !currentUser || leerderIds.length === 0) return { success: false, error: 'Geen gemeente, gebruiker of leerders' };
    try {
      const rows = leerderIds.map(leerder_id => ({
        leerder_id,
        gemeente_id: currentGemeente.id,
        bedrag: 10000,
        status: 'betaal',
        betaal_tipe: 'namens',
        betaal_deur: currentUser.id
      }));
      const { error } = await supabase.from('geloofsonderrig_betalings').insert(rows);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const addPastoraleAksie = async (aksie: Partial<PastoraleAksie>) => {
    const { error } = await supabase.from('pastorale_aksies').insert([{
      ...aksie,
      gemeente_id: currentGemeente?.id
    }]);

    if (!error && aksie.gebruiker_id && aksie.datum) {
      await supabase
        .from('gebruikers')
        .update({ laaste_kontak: aksie.datum })
        .eq('id', aksie.gebruiker_id);
    }

    if (!error) await refreshData();
  };

  const addKrisisVerslag = async (verslag: Partial<KrisisVerslag>) => {
    const { error } = await supabase.from('krisis_verslae').insert([{
      ...verslag,
      gemeente_id: currentGemeente?.id
    }]);
    if (!error) {
      const gebruiker = gebruikers.find(g => g.id === verslag.gebruiker_id);
      const gebruikerNaam = gebruiker ? `${gebruiker.naam} ${gebruiker.van}` : 'Onbekend';
      await sendKrisisAlert(verslag, gebruikerNaam);
      await refreshData();
    }
  };

  const updateKrisisStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('krisis_verslae')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await refreshData();
  };

  const addVraag = async (vraag: Partial<Vraag>) => {
    const { error } = await supabase.from('vrae').insert([{
      ...vraag,
      gemeente_id: currentGemeente?.id
    }]);
    if (!error) await refreshData();
  };

  const updateVraag = async (id: string, updates: Partial<Vraag>) => {
    const { error } = await supabase
      .from('vrae')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await refreshData();
  };

  const addGebruiker = async (gebruiker: Partial<Gebruiker> & { wagwoord?: string }) => {
    const { wagwoord, ...userData } = gebruiker;
    const insertData: any = {
      ...userData,
      gemeente_id: currentGemeente?.id
    };

    if (wagwoord) {
      insertData.wagwoord_hash = btoa(wagwoord);
    }

    const { error } = await supabase.from('gebruikers').insert([insertData]);
    if (!error) await refreshData();
  };

  const updateGebruiker = async (id: string, updates: Partial<Gebruiker>) => {
    const { error } = await supabase
      .from('gebruikers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      await refreshData();
      await fetchAllGebruikers();
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gebruikers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('User delete error:', error);
        return { success: false, error: error.message };
      }

      await refreshData();
      await fetchAllGebruikers();
      return { success: true };
    } catch (error: any) {
      console.error('User delete error:', error);
      return { success: false, error: error.message };
    }
  };

  const searchGlobalUsers = async (query: string): Promise<Gebruiker[]> => {
    if (!query || query.length < 2) return [];

    try {
      const { data, error } = await supabase
        .from('gebruikers')
        .select(`
          *,
          gemeente_data:gemeentes(naam)
        `)
        .or(`naam.ilike.%${query}%,van.ilike.%${query}%,epos.ilike.%${query}%`)
        .eq('aktief', true)
        .limit(20);

      if (error) {
        console.error('Global user search error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Global user search error:', error);
      return [];
    }
  };

  const addProgram = async (event: Partial<GemeenteProgram>) => {
    const { error } = await supabase.from('gemeente_program').insert([{
      ...event,
      gemeente_id: currentGemeente?.id
    }]);
    if (!error) await refreshData();
  };

  return (
    <NHKAContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentGemeente,
        setCurrentGemeente,
        isLoggedIn,
        currentView,
        setCurrentView,
        lmsFullScreen,
        setLmsFullScreen,

        // Language
        language,
        setLanguage,

        // Data
        gemeentes,
        gemeenteStats,
        gebruikers,
        allGebruikers,
        wyke,
        besoekpunte,
        verhoudings,
        betalings,
        aksies,
        krisisse,
        vrae,
        program,
        kursusse,
        loading,
        refreshData,
        refreshGemeentes,
        refreshAllGemeenteStats,
        refreshKursusse,
        login,
        loginAsHoofAdmin,
        loginAsModerator,
        logout,
        selectGemeente,
        addPastoraleAksie,

        addKrisisVerslag,
        updateKrisisStatus,
        addVraag,
        updateVraag,
        addGebruiker,
        updateGebruiker,
        deleteUser,
        addProgram,
        registerGemeente,
        registerUser,
        addHoofAdmin,
        getHoofAdmins,
        addWyk,
        updateWyk,
        deleteWyk,
        addBesoekpunt,
        updateBesoekpunt,
        deleteBesoekpunt,
        assignLidmaatToBesoekpunt,
        addVerhouding,
        deleteVerhouding,
        addBetaling,
        processBetaling,
        sendSMS,
        sendKrisisAlert,
        sendBemoediging,
        // Payment
        createYocoCheckout,
        processGeloofsonderrigBetaling,
        merkGeloofsonderrigBetaal,

        // Global Search
        searchGlobalUsers
      }}
    >
      {children}
    </NHKAContext.Provider>
  );
};
