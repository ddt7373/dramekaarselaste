import React, { useState, useRef, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import VerhoudingsBestuur from './VerhoudingsBestuur';
import { supabase } from '@/lib/supabase';
import {
  getRolLabel,
  UserRole,
  isHoofAdmin,
  isGemeenteAdmin,
  canEditGemeenteLogo,
  canManageWyke,
  Gebruiker,
  VerhoudingTipe,
  getVerhoudingLabel,
  LidmaatOuditLog,
  OuditAksieTipe,
  getOuditAksieTipeLabel,
  GemeenteBankbesonderhede,
  getOuderdom,
  getLidmaatDisplayNaam
} from '@/types/nhka';
import {
  Users,
  MapPin,
  Plus,
  Search,
  ChevronDown,
  X,
  BarChart3,
  AlertTriangle,
  Heart,
  HelpCircle,
  Calendar,
  Church,
  Crown,
  Shield,
  Upload,
  Camera,
  Loader2,
  CheckCircle,
  CreditCard,
  UserPlus,
  Home,
  FolderTree,
  Edit2,
  Save,
  Link2,
  Trash2,
  User,
  Phone,
  Mail,
  History,
  Clock,
  ArrowRight,
  Building2,
  FileText,
  AlertCircle,
  FileDown,
  Bell
} from 'lucide-react';

import { toast } from 'sonner';
import WykeBestuur from './WykeBestuur';
import WykToewysing from './WykToewysing';
import BesoekpuntToewysing from './BesoekpuntToewysing';
import DataExport from './DataExport';
import AdminNotifications from './AdminNotifications';
import LidmateCSVImport from '@/components/members/LidmateCSVImport';
import StatisticsManagement from '@/components/admin/StatisticsManagement';
import ComplianceInventory from '@/components/admin/ComplianceInventory';
import InventoryCSVImport from '@/components/admin/InventoryCSVImport';
import HoofAdminDashboard from '@/components/admin/HoofAdminDashboard';
import GeloofsonderrigBetalingAdmin from './GeloofsonderrigBetalingAdmin';

const AdminPanel: React.FC = () => {
  // Helper function to safely format price values that may be strings from database
  const formatPrice = (value: any): string => {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };


  const {
    currentUser,
    currentGemeente,
    gemeentes,
    gebruikers,
    wyke,
    besoekpunte,
    betalings,
    aksies,
    krisisse,
    vrae,
    program,
    verhoudings,
    addGebruiker,
    updateGebruiker,
    refreshGemeentes,
    setCurrentGemeente,
    addVerhouding,
    deleteVerhouding,
    deleteUser,
    refreshData,
    searchGlobalUsers,
    processGeloofsonderrigBetaling,
    merkGeloofsonderrigBetaal
  } = useNHKA();

  const [activeTab, setActiveTab] = useState<'overview' | 'wyke' | 'wyk-toewysing' | 'gemeentes' | 'gemeente-settings' | 'betalings' | 'verhoudings' | 'members' | 'statistics' | 'inventory'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Gebruiker | null>(null);
  const [showAddVerhouding, setShowAddVerhouding] = useState(false);
  const [showLidmateCSVImport, setShowLidmateCSVImport] = useState(false);
  const [showDuplikateModal, setShowDuplikateModal] = useState(false);
  const [showInventoryImport, setShowInventoryImport] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'details' | 'verhoudings' | 'geskiedenis'>('details');
  const [ouditLogs, setOuditLogs] = useState<LidmaatOuditLog[]>([]);
  const [loadingOuditLogs, setLoadingOuditLogs] = useState(false);


  // Bulk Delete State
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Bank details state
  const [bankDetails, setBankDetails] = useState<GemeenteBankbesonderhede | null>(null);
  const [loadingBank, setLoadingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_naam: '',
    rekening_naam: '',
    rekening_nommer: '',
    takkode: '',
    rekening_tipe: 'Tjekrekening',
    verwysing_instruksies: ''
  });

  // Gemeente edit state
  const [editingGemeente, setEditingGemeente] = useState(false);
  const [savingGemeente, setSavingGemeente] = useState(false);
  const [gemeenteForm, setGemeenteForm] = useState({
    naam: '',
    adres: '',
    telefoon: '',
    epos: '',
    webwerf: '',
    beskrywing: ''
  });

  const [newUser, setNewUser] = useState({
    naam: '',
    van: '',
    selfoon: '',
    epos: '',
    rol: 'lidmaat' as UserRole,
    adres: '',
    wagwoord: ''
  });

  const [editUser, setEditUser] = useState({
    naam: '',
    van: '',
    selfoon: '',
    epos: '',
    epos_2: '',
    rol: 'lidmaat' as UserRole,
    app_roles: ['lidmaat'] as UserRole[],
    adres: '',
    geboortedatum: '',
    wyk_id: '',
    besoekpunt_id: '',
    aktief: true,
    is_oorlede: false,
    notas: '',
    geslag: '' as '' | 'man' | 'vrou' | 'ander',
    titel: '',
    nooiensvan: '',
    voornaam_1: '',
    voornaam_2: '',
    voornaam_3: '',
    noemnaam: '',
    landlyn: '',
    doop_datum: '',
    belydenis_van_geloof_datum: '',
    sterf_datum: '',
    straat_nommer: '',
    woonkompleks_naam: '',
    woonkompleks_nommer: '',
    voorstad: '',
    stad_dorp: '',
    poskode: '',
    portefeulje_1: '',
    portefeulje_2: '',
    portefeulje_3: ''
  });

  const [newVerhouding, setNewVerhouding] = useState({
    verwante_id: '',
    verhouding_tipe: 'getroud' as VerhoudingTipe,
    verhouding_beskrywing: ''
  });

  // Relationship Search State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<Gebruiker[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedVerwanteUser, setSelectedVerwanteUser] = useState<Gebruiker | null>(null);
  const [verwanteGemeenteId, setVerwanteGemeenteId] = useState('');
  const [verwanteList, setVerwanteList] = useState<Gebruiker[]>([]);
  const [loadingVerwanteList, setLoadingVerwanteList] = useState(false);

  useEffect(() => {
    if (showAddVerhouding) {
      setUserSearchQuery('');
      setUserSearchResults([]);
      setSearchingUsers(false);
      setSelectedVerwanteUser(null);
    }
  }, [showAddVerhouding]);

  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const results = await searchGlobalUsers(query);
      setUserSearchResults(results.filter(u => u.id !== selectedUser?.id));
    } catch (error) {
      console.error(error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Gemeente logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [savingUser, setSavingUser] = useState(false);

  // Fetch bank details when gemeente changes
  useEffect(() => {
    if (currentGemeente && activeTab === 'gemeente-settings') {
      fetchBankDetails();
      setGemeenteForm({
        naam: currentGemeente.naam || '',
        adres: currentGemeente.adres || '',
        telefoon: currentGemeente.telefoon || '',
        epos: currentGemeente.epos || '',
        webwerf: currentGemeente.webwerf || '',
        beskrywing: currentGemeente.beskrywing || ''
      });
    }
  }, [currentGemeente, activeTab]);

  const fetchBankDetails = async () => {
    if (!currentGemeente) return;
    setLoadingBank(true);
    try {
      const { data, error } = await supabase
        .from('gemeente_bankbesonderhede')
        .select('*')
        .eq('gemeente_id', currentGemeente.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bank details:', error);
      }

      if (data) {
        setBankDetails(data);
        setBankForm({
          bank_naam: data.bank_naam || '',
          rekening_naam: data.rekening_naam || '',
          rekening_nommer: data.rekening_nommer || '',
          takkode: data.takkode || '',
          rekening_tipe: data.rekening_tipe || 'Tjekrekening',
          verwysing_instruksies: data.verwysing_instruksies || ''
        });
      } else {
        setBankDetails(null);
        setBankForm({
          bank_naam: '',
          rekening_naam: '',
          rekening_nommer: '',
          takkode: '',
          rekening_tipe: 'Tjekrekening',
          verwysing_instruksies: ''
        });
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingBank(false);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!currentGemeente) return;
    if (!bankForm.bank_naam || !bankForm.rekening_naam || !bankForm.rekening_nommer) {
      toast.error('Bank naam, rekening naam en rekening nommer is verpligtend');
      return;
    }

    setSavingBank(true);
    try {
      if (bankDetails) {
        // Update existing
        const { error } = await supabase
          .from('gemeente_bankbesonderhede')
          .update({
            ...bankForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', bankDetails.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('gemeente_bankbesonderhede')
          .insert([{
            gemeente_id: currentGemeente.id,
            ...bankForm
          }]);

        if (error) throw error;
      }

      toast.success('Bankbesonderhede suksesvol gestoor');
      await fetchBankDetails();
    } catch (err) {
      console.error('Error saving bank details:', err);
      toast.error('Kon nie bankbesonderhede stoor nie');
    } finally {
      setSavingBank(false);
    }
  };

  const handleSaveGemeente = async () => {
    if (!currentGemeente) return;
    if (!gemeenteForm.naam) {
      toast.error('Gemeente naam is verpligtend');
      return;
    }

    setSavingGemeente(true);
    try {
      const { error } = await supabase
        .from('gemeentes')
        .update({
          naam: gemeenteForm.naam,
          adres: gemeenteForm.adres || null,
          telefoon: gemeenteForm.telefoon || null,
          epos: gemeenteForm.epos || null,
          webwerf: gemeenteForm.webwerf || null,
          beskrywing: gemeenteForm.beskrywing || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentGemeente.id);

      if (error) throw error;

      toast.success('Gemeente instellings suksesvol gestoor');
      await refreshGemeentes();
      setCurrentGemeente({ ...currentGemeente, ...gemeenteForm });
      setEditingGemeente(false);
    } catch (err) {
      console.error('Error saving gemeente:', err);
      toast.error('Kon nie gemeente instellings stoor nie');
    } finally {
      setSavingGemeente(false);
    }
  };



  // Bulk Delete Handlers
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    if (!window.confirm(`Is jy seker jy wil ${selectedUsers.length} gebruikers verwyder? Hierdie aksie kan nie ontdaan word nie.`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const id of selectedUsers) {
      const result = await deleteUser(id);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to delete user ${id}:`, result.error);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} gebruikers suksesvol verwyder`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} gebruikers kon nie verwyder word nie`);
    }

    setSelectedUsers([]);
    await refreshData();
  };

  const _handleCSVUploadRemoved = async () => {
    if (!currentGemeente) return;
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error('Kon nie lêer lees nie');

        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('Lêer is leeg of bevat g’n data nie');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const users = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        }).filter(row => row.naam && row.van);

        if (users.length === 0) throw new Error('Geen geldige gebruikers gevind om op te laai nie');

        let successCount = 0;
        for (const user of users) {
          try {
            const rol = user.rol?.toLowerCase() || 'lidmaat';
            const validRoles = ['lidmaat', 'groepleier', 'ouderling', 'diaken', 'predikant', 'subadmin'];

            const { error } = await supabase
              .from('gebruikers')
              .insert([{
                gemeente_id: currentGemeente.id,
                naam: user.naam,
                van: user.van,
                selfoon: user.selfoon || null,
                epos: user.epos || null,
                adres: user.adres || null,
                geboortedatum: user.geboortedatum || null,
                rol: validRoles.includes(rol) ? rol : 'lidmaat',
                aktief: true
              }]);

            if (!error) successCount++;
          } catch (err) {
            console.error('Error inserting user:', err);
          }
        }

        toast.success(`${successCount} van ${users.length} gebruikers suksesvol opgelaai`);
        setShowCSVModal(false);
        setCsvFile(null);
        setCsvPreview([]);
        await refreshData();
      } catch (error: any) {
        console.error('CSV Upload Error:', error);
        toast.error(error.message || 'Fout met CSV oplaai');
      } finally {
        setUploadingCSV(false);
      }
    };

    reader.onerror = () => {
      toast.error('Kon nie lêer lees nie');
      setUploadingCSV(false);
    };

    reader.readAsText(csvFile);
  };



  const isHoofAdminUser = isHoofAdmin(currentUser.rol);
  const isGemeenteAdminUser = isGemeenteAdmin(currentUser.rol);
  const canEditLogo = canEditGemeenteLogo(currentUser.rol);
  const canManageWykeUser = canManageWyke(currentUser.rol);
  const isPredikant = currentUser.rol === 'predikant';
  const canEditUsers = isHoofAdminUser || isGemeenteAdminUser || isPredikant;

  // Filter users
  const filteredUsers = gebruikers.filter(g =>
    g.naam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.van.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.epos?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get wyk name
  const getWykNaam = (wykId?: string) => {
    if (!wykId) return '-';
    const wyk = wyke.find(w => w.id === wykId);
    return wyk?.naam || '-';
  };

  // Get besoekpunt name
  const getBesoekpuntNaam = (besoekpuntId?: string) => {
    if (!besoekpuntId) return '-';
    const bp = besoekpunte.find(b => b.id === besoekpuntId);
    return bp?.naam || '-';
  };

  // Get verhoudings for a user
  const getVerhoudingsForUser = (userId: string) => {
    return verhoudings.filter(v => v.lidmaat_id === userId || v.verwante_id === userId);
  };

  // Vind duplikate binne gemeente (by naam+van of by epos)
  type DuplikateGroep = { key: string; reden: string; users: Gebruiker[] };
  const duplikateGroepe = React.useMemo((): DuplikateGroep[] => {
    if (!currentGemeente) return [];
    const gemeenteUsers = gebruikers.filter(g => g.gemeente_id === currentGemeente.id);
    const groepe: DuplikateGroep[] = [];

    // Groepeer by (naam, van) - genormaliseer
    const byNaamVan = new Map<string, Gebruiker[]>();
    for (const u of gemeenteUsers) {
      const k = `${(u.naam || '').toLowerCase().trim()}|${(u.van || '').toLowerCase().trim()}`;
      if (!byNaamVan.has(k)) byNaamVan.set(k, []);
      byNaamVan.get(k)!.push(u);
    }
    for (const [k, users] of byNaamVan) {
      if (users.length > 1) {
        groepe.push({ key: `naam-${k}`, reden: `Dieselfde naam: ${getLidmaatDisplayNaam(users[0])}`, users });
      }
    }

    // Groepeer by epos (wanneer nie leeg nie)
    const byEpos = new Map<string, Gebruiker[]>();
    for (const u of gemeenteUsers) {
      const ep = (u.epos || '').toLowerCase().trim();
      if (!ep) continue;
      if (!byEpos.has(ep)) byEpos.set(ep, []);
      byEpos.get(ep)!.push(u);
    }
    for (const [ep, users] of byEpos) {
      if (users.length > 1) {
        groepe.push({ key: `epos-${ep}`, reden: `Dieselfde e-pos: ${ep}`, users });
      }
    }
    return groepe;
  }, [gebruikers, currentGemeente]);

  const [duplikateBehouId, setDuplikateBehouId] = useState<Record<string, string>>({});
  const [verwyderDuplikateLoading, setVerwyderDuplikateLoading] = useState(false);

  const handleVerwyderDuplikate = async () => {
    let toDelete: string[] = [];
    for (const groep of duplikateGroepe) {
      const behouId = duplikateBehouId[groep.key] || groep.users[0].id;
      toDelete = toDelete.concat(groep.users.filter(u => u.id !== behouId).map(u => u.id));
    }
    if (toDelete.length === 0) {
      toast.info('Geen duplikate om te verwyder nie');
      return;
    }
    if (!window.confirm(`Is jy seker jy wil ${toDelete.length} duplikate verwyder? Hierdie aksie kan nie ontdaan word nie.`)) {
      return;
    }
    setVerwyderDuplikateLoading(true);
    let successCount = 0;
    let failCount = 0;
    for (const id of toDelete) {
      const result = await deleteUser(id);
      if (result?.success) successCount++;
      else failCount++;
    }
    setVerwyderDuplikateLoading(false);
    setShowDuplikateModal(false);
    setDuplikateBehouId({});
    if (successCount > 0) toast.success(`${successCount} duplikate verwyder`);
    if (failCount > 0) toast.error(`${failCount} kon nie verwyder word nie`);
    await refreshData();
  };

  // Get besoekpunte for selected wyk
  const getBesoekpunteForWyk = (wykId: string) => {
    return besoekpunte.filter(b => b.wyk_id === wykId);
  };

  // Fetch oudit logs for a user
  const fetchOuditLogs = async (userId: string) => {
    setLoadingOuditLogs(true);
    try {
      const { data, error } = await supabase
        .from('lidmaat_oudit_logs')
        .select('*')
        .eq('lidmaat_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching oudit logs:', error);
        // If table doesn't exist, just set empty array
        setOuditLogs([]);
      } else {
        setOuditLogs(data || []);
      }
    } catch (err) {
      console.error('Error fetching oudit logs:', err);
      setOuditLogs([]);
    } finally {
      setLoadingOuditLogs(false);
    }
  };

  // Create oudit log entry
  const createOuditLog = async (
    lidmaatId: string,
    aksieTipe: OuditAksieTipe,
    beskrywing: string,
    ouWaarde?: string,
    nuweWaarde?: string
  ) => {
    try {
      await supabase
        .from('lidmaat_oudit_logs')
        .insert([{
          lidmaat_id: lidmaatId,
          gemeente_id: currentGemeente?.id,
          aksie_tipe: aksieTipe,
          beskrywing,
          ou_waarde: ouWaarde,
          nuwe_waarde: nuweWaarde,
          gewysig_deur_id: currentUser?.id,
          gewysig_deur_naam: currentUser ? `${currentUser.naam} ${currentUser.van}` : 'Stelsel'
        }]);
    } catch (err) {
      console.error('Error creating oudit log:', err);
    }
  };

  const stats = {
    totalUsers: gebruikers.length,
    lidmate: gebruikers.filter(g => g.rol === 'lidmaat').length,
    leiers: gebruikers.filter(g => ['predikant', 'ouderling', 'diaken', 'groepleier'].includes(g.rol)).length,
    admins: gebruikers.filter(g => ['hoof_admin', 'subadmin', 'admin', 'kerkraad'].includes(g.rol)).length,
    wyke: wyke.length,
    besoekpunte: besoekpunte.length,
    aksiesThisMonth: aksies.filter(a => {
      const d = new Date(a.datum);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    openKrisisse: krisisse.filter(k => k.status !== 'opgelos').length,
    newVrae: vrae.filter(v => v.status === 'nuut').length,
    upcomingEvents: program.filter(p => new Date(p.datum) >= new Date()).length,
    totalGemeentes: gemeentes.length,
    totalBetalings: betalings.filter(b => b.status === 'voltooi').reduce((sum, b) => sum + b.bedrag, 0)
  };

  const handleAddUser = async () => {
    if (!newUser.naam || !newUser.van) {
      toast.error('Naam en van is verpligtend');
      return;
    }

    await addGebruiker({
      ...newUser,
      aktief: true
    });

    // Create oudit log for new user
    // Note: We don't have the new user's ID here, so we'll skip this for now
    // The ID would need to be returned from addGebruiker

    setNewUser({
      naam: '',
      van: '',
      selfoon: '',
      epos: '',
      rol: 'lidmaat',
      adres: '',
      wagwoord: ''
    });
    setShowAddUser(false);
    toast.success('Gebruiker suksesvol bygevoeg');
  };

  const handleEditUser = async (user: Gebruiker) => {
    setSelectedUser(user);
    const roles = user.app_roles && user.app_roles.length > 0 ? user.app_roles : [user.rol];
    setEditUser({
      naam: user.naam,
      van: user.van,
      selfoon: user.selfoon || '',
      epos: user.epos || '',
      epos_2: user.epos_2 || '',
      rol: user.rol,
      app_roles: roles,
      adres: user.adres || '',
      geboortedatum: user.geboortedatum || '',
      wyk_id: user.wyk_id || '',
      besoekpunt_id: user.besoekpunt_id || '',
      aktief: user.aktief,
      is_oorlede: user.is_oorlede || false,
      notas: user.notas || '',
      geslag: (user.geslag as '' | 'man' | 'vrou' | 'ander') || '',
      titel: user.titel || '',
      nooiensvan: user.nooiensvan || '',
      voornaam_1: user.voornaam_1 || user.naam || '',
      voornaam_2: user.voornaam_2 || '',
      voornaam_3: user.voornaam_3 || '',
      noemnaam: user.noemnaam || '',
      landlyn: user.landlyn || '',
      doop_datum: user.doop_datum || '',
      belydenis_van_geloof_datum: user.belydenis_van_geloof_datum || '',
      sterf_datum: user.sterf_datum || '',
      straat_nommer: user.straat_nommer || '',
      woonkompleks_naam: user.woonkompleks_naam || '',
      woonkompleks_nommer: user.woonkompleks_nommer || '',
      voorstad: user.voorstad || '',
      stad_dorp: user.stad_dorp || '',
      poskode: user.poskode || '',
      portefeulje_1: user.portefeulje_1 || '',
      portefeulje_2: user.portefeulje_2 || '',
      portefeulje_3: user.portefeulje_3 || ''
    });
    setEditModalTab('details');
    setShowEditUser(true);

    // Fetch oudit logs for this user
    await fetchOuditLogs(user.id);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    if (!editUser.naam || !editUser.van) {
      toast.error('Naam en van is verpligtend');
      return;
    }

    setSavingUser(true);
    try {
      // Track changes for oudit log
      const changes: { field: string; old: string; new: string }[] = [];

      if (editUser.naam !== selectedUser.naam) {
        changes.push({ field: 'Naam', old: selectedUser.naam, new: editUser.naam });
      }
      if (editUser.van !== selectedUser.van) {
        changes.push({ field: 'Van', old: selectedUser.van, new: editUser.van });
      }
      if (editUser.selfoon !== (selectedUser.selfoon || '')) {
        changes.push({ field: 'Selfoon', old: selectedUser.selfoon || '-', new: editUser.selfoon || '-' });
      }
      if (editUser.epos !== (selectedUser.epos || '')) {
        changes.push({ field: 'E-pos', old: selectedUser.epos || '-', new: editUser.epos || '-' });
      }
      if (editUser.adres !== (selectedUser.adres || '')) {
        changes.push({ field: 'Adres', old: selectedUser.adres || '-', new: editUser.adres || '-' });
      }
      if (editUser.geboortedatum !== (selectedUser.geboortedatum || '')) {
        changes.push({ field: 'Geboortedatum', old: selectedUser.geboortedatum || '-', new: editUser.geboortedatum || '-' });
      }
      if (editUser.notas !== (selectedUser.notas || '')) {
        changes.push({ field: 'Notas', old: selectedUser.notas || '-', new: editUser.notas || '-' });
      }

      // Check for role change
      if (editUser.rol !== selectedUser.rol) {
        await createOuditLog(
          selectedUser.id,
          'rol_wysig',
          `Rol verander van ${getRolLabel(selectedUser.rol)} na ${getRolLabel(editUser.rol)}`,
          getRolLabel(selectedUser.rol),
          getRolLabel(editUser.rol)
        );
      }

      // Check for status change
      if (editUser.aktief !== selectedUser.aktief) {
        await createOuditLog(
          selectedUser.id,
          'status_wysig',
          `Status verander na ${editUser.aktief ? 'Aktief' : 'Onaktief'}`,
          selectedUser.aktief ? 'Aktief' : 'Onaktief',
          editUser.aktief ? 'Aktief' : 'Onaktief'
        );
      }

      // Check for deceased status change
      if (editUser.is_oorlede && !selectedUser.is_oorlede) {
        await createOuditLog(
          selectedUser.id,
          'status_wysig',
          `Lidmaat gemerk as Oorlede`,
          'Lewend',
          'Oorlede'
        );

        // Add to stats log
        if (currentGemeente) {
          try {
            await supabase
              .from('gemeente_statistiek_logs')
              .insert({
                gemeente_id: currentGemeente.id,
                datum: new Date().toISOString(),
                tipe: 'vermindering',
                rede: 'oorlede',
                lidmaat_id: selectedUser.id,
                beskrywing: `Lidmaat ${selectedUser.naam} ${selectedUser.van} is oorlede.`
              });
          } catch (e) {
            console.error("Error logging death stat:", e);
          }
        }
      }

      // If wyk changed, update wyk_id
      let wykId = editUser.wyk_id || null;
      let besoekpuntId = editUser.besoekpunt_id || null;

      if (besoekpuntId && !wykId) {
        const bp = besoekpunte.find(b => b.id === besoekpuntId);
        if (bp) {
          wykId = bp.wyk_id || null;
        }
      }

      // Check for wyk change
      if (wykId !== (selectedUser.wyk_id || null)) {
        const ouWyk = selectedUser.wyk_id ? getWykNaam(selectedUser.wyk_id) : 'Geen';
        const nuweWyk = wykId ? getWykNaam(wykId) : 'Geen';
        await createOuditLog(
          selectedUser.id,
          'wyk_toewysing',
          `Wyk verander van ${ouWyk} na ${nuweWyk}`,
          ouWyk,
          nuweWyk
        );
      }

      // Check for besoekpunt change
      if (besoekpuntId !== (selectedUser.besoekpunt_id || null)) {
        const ouBp = selectedUser.besoekpunt_id ? getBesoekpuntNaam(selectedUser.besoekpunt_id) : 'Geen';
        const nuweBp = besoekpuntId ? getBesoekpuntNaam(besoekpuntId) : 'Geen';
        await createOuditLog(
          selectedUser.id,
          'besoekpunt_toewysing',
          `Besoekpunt verander van ${ouBp} na ${nuweBp}`,
          ouBp,
          nuweBp
        );
      }

      // Create profile change oudit log if there are changes
      if (changes.length > 0) {
        const beskrywing = changes.map(c => `${c.field}: ${c.old} → ${c.new}`).join(', ');
        await createOuditLog(
          selectedUser.id,
          'profiel_wysig',
          beskrywing,
          changes.map(c => `${c.field}: ${c.old}`).join('; '),
          changes.map(c => `${c.field}: ${c.new}`).join('; ')
        );
      }

      const appRoles = editUser.app_roles?.length ? editUser.app_roles : [editUser.rol];
      const { error } = await supabase
        .from('gebruikers')
        .update({
          naam: editUser.naam,
          van: editUser.van,
          selfoon: editUser.selfoon || null,
          epos: editUser.epos || null,
          epos_2: editUser.epos_2 || null,
          rol: editUser.rol,
          app_roles: appRoles,
          adres: editUser.adres || null,
          geboortedatum: editUser.geboortedatum || null,
          wyk_id: wykId,
          besoekpunt_id: besoekpuntId,
          aktief: editUser.aktief,
          is_oorlede: editUser.is_oorlede,
          notas: editUser.notas || null,
          geslag: editUser.geslag || null,
          titel: editUser.titel || null,
          nooiensvan: editUser.nooiensvan || null,
          voornaam_1: editUser.voornaam_1 || null,
          voornaam_2: editUser.voornaam_2 || null,
          voornaam_3: editUser.voornaam_3 || null,
          noemnaam: editUser.noemnaam || null,
          landlyn: editUser.landlyn || null,
          doop_datum: editUser.doop_datum || null,
          belydenis_van_geloof_datum: editUser.belydenis_van_geloof_datum || null,
          sterf_datum: editUser.sterf_datum || null,
          straat_nommer: editUser.straat_nommer || null,
          woonkompleks_naam: editUser.woonkompleks_naam || null,
          woonkompleks_nommer: editUser.woonkompleks_nommer || null,
          voorstad: editUser.voorstad || null,
          stad_dorp: editUser.stad_dorp || null,
          poskode: editUser.poskode || null,
          portefeulje_1: editUser.portefeulje_1 || null,
          portefeulje_2: editUser.portefeulje_2 || null,
          portefeulje_3: editUser.portefeulje_3 || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('Gebruiker suksesvol opgedateer');
      setShowEditUser(false);
      setSelectedUser(null);

      // Refresh the data
      await refreshData();
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error('Kon nie gebruiker opdateer nie');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Is jy seker jy wil hierdie gebruiker verwyder? Hierdie aksie kan nie ontdaan word nie.')) {
      return;
    }

    const result = await deleteUser(id);
    if (result.success) {
      toast.success('Gebruiker suksesvol verwyder');
    } else {
      toast.error(result.error || 'Kon nie gebruiker verwyder nie');
    }
  };

  const handleAddVerhoudingForUser = async () => {
    if (!selectedUser || !newVerhouding.verwante_id) {
      toast.error('Kies asb \'n verwante');
      return;
    }

    if (newVerhouding.verhouding_tipe === 'ander' && !newVerhouding.verhouding_beskrywing.trim()) {
      toast.error('Beskryf asb die verhouding');
      return;
    }

    const verwante = gebruikers.find(g => g.id === newVerhouding.verwante_id);
    const verwanteNaam = verwante ? `${verwante.naam} ${verwante.van}` : 'Onbekend';

    const result = await addVerhouding({
      lidmaat_id: selectedUser.id,
      verwante_id: newVerhouding.verwante_id,
      verhouding_tipe: newVerhouding.verhouding_tipe,
      verhouding_beskrywing: newVerhouding.verhouding_tipe === 'ander' ? newVerhouding.verhouding_beskrywing : undefined
    });

    if (result.success) {
      // Create oudit log for relationship
      const verhoudingLabel = newVerhouding.verhouding_tipe === 'ander'
        ? newVerhouding.verhouding_beskrywing
        : getVerhoudingLabel(newVerhouding.verhouding_tipe);

      await createOuditLog(
        selectedUser.id,
        'verhouding_bygevoeg',
        `Verhouding bygevoeg: ${verhoudingLabel} - ${verwanteNaam}`,
        undefined,
        `${verhoudingLabel}: ${verwanteNaam}`
      );

      toast.success('Verhouding suksesvol bygevoeg');
      setNewVerhouding({ verwante_id: '', verhouding_tipe: 'getroud', verhouding_beskrywing: '' });
      setShowAddVerhouding(false);

      // Refresh oudit logs
      await fetchOuditLogs(selectedUser.id);
    } else {
      toast.error(result.error || 'Kon nie verhouding byvoeg nie');
    }
  };

  const handleDeleteVerhouding = async (verhoudingId: string, verwanteNaam: string, verhoudingTipe: string) => {
    if (!selectedUser) return;

    await deleteVerhouding(verhoudingId);

    // Create oudit log for deleted relationship
    await createOuditLog(
      selectedUser.id,
      'verhouding_verwyder',
      `Verhouding verwyder: ${verhoudingTipe} - ${verwanteNaam}`,
      `${verhoudingTipe}: ${verwanteNaam}`,
      undefined
    );

    // Refresh oudit logs
    await fetchOuditLogs(selectedUser.id);

    toast.success('Verhouding verwyder');
  };

  // Global Relationship Functions
  // Global Relationship logic removed - now handled by VerhoudingsBestuur component

  const handleVerwanteGemeenteChange = async (gemeenteId: string) => {
    setVerwanteGemeenteId(gemeenteId);
    setNewVerhouding(prev => ({ ...prev, verwante_id: '' }));
    setSelectedVerwanteUser(null);
    if (!gemeenteId) {
      setVerwanteList([]);
      return;
    }

    setLoadingVerwanteList(true);
    try {
      const { data, error } = await supabase
        .from('gebruikers')
        .select(`
          *,
          gemeente:gemeentes(naam)
        `)
        .eq('gemeente_id', gemeenteId)
        .order('naam');

      if (error) throw error;
      setVerwanteList(data.filter(u => u.id !== selectedUser?.id) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVerwanteList(false);
    }
  };

  // Fetch global relationships is now handled by the standalone component
  useEffect(() => {
    // No-op
  }, [activeTab]);

  // Handle gemeente logo upload
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentGemeente) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Lêer is te groot. Maksimum grootte is 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Slegs beeldlêers word aanvaar.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentGemeente.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gemeente-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Logo upload error:', uploadError);
        toast.error('Kon nie logo oplaai nie');
        setUploadingLogo(false);
        return;
      }

      const { data } = supabase.storage
        .from('gemeente-logos')
        .getPublicUrl(fileName);

      // Update gemeente in database
      const { error: updateError } = await supabase
        .from('gemeentes')
        .update({ logo_url: data.publicUrl })
        .eq('id', currentGemeente.id);

      if (updateError) {
        console.error('Gemeente update error:', updateError);
        toast.error('Kon nie gemeente opdateer nie');
        setUploadingLogo(false);
        return;
      }

      // Refresh gemeentes and update current gemeente
      await refreshGemeentes();
      setCurrentGemeente({ ...currentGemeente, logo_url: data.publicUrl });

      toast.success('Gemeente logo suksesvol opgedateer');
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Onbekende fout tydens oplaai');
    } finally {
      setUploadingLogo(false);
      setLogoPreview('');
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (rol: UserRole) => {
    if (['hoof_admin', 'subadmin', 'admin'].includes(rol)) return 'bg-[#D4A84B]/10 text-[#D4A84B]';
    if (['kerkraad'].includes(rol)) return 'bg-[#9E2A2B]/10 text-[#9E2A2B]';
    if (['predikant', 'ouderling', 'diaken', 'groepleier'].includes(rol)) return 'bg-[#7A8450]/10 text-[#7A8450]';
    return 'bg-[#8B7CB3]/10 text-[#8B7CB3]';
  };

  // Get oudit action icon
  const getOuditIcon = (aksieTipe: OuditAksieTipe) => {
    switch (aksieTipe) {
      case 'profiel_wysig':
        return <Edit2 className="w-4 h-4" />;
      case 'wyk_toewysing':
        return <MapPin className="w-4 h-4" />;
      case 'besoekpunt_toewysing':
        return <Home className="w-4 h-4" />;
      case 'verhouding_bygevoeg':
        return <Heart className="w-4 h-4" />;
      case 'verhouding_verwyder':
        return <Trash2 className="w-4 h-4" />;
      case 'rol_wysig':
        return <Shield className="w-4 h-4" />;
      case 'status_wysig':
        return <CheckCircle className="w-4 h-4" />;
      case 'geskep':
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Get oudit action color
  const getOuditColor = (aksieTipe: OuditAksieTipe) => {
    switch (aksieTipe) {
      case 'profiel_wysig':
        return 'bg-blue-100 text-blue-600';
      case 'wyk_toewysing':
      case 'besoekpunt_toewysing':
        return 'bg-purple-100 text-purple-600';
      case 'verhouding_bygevoeg':
        return 'bg-pink-100 text-pink-600';
      case 'verhouding_verwyder':
        return 'bg-red-100 text-red-600';
      case 'rol_wysig':
        return 'bg-amber-100 text-amber-600';
      case 'status_wysig':
        return 'bg-green-100 text-green-600';
      case 'geskep':
        return 'bg-teal-100 text-teal-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Tabs configuration (Lidmate = gebruikers, een plek vir oplaai)
  const tabs = [
    { id: 'overview', label: 'Oorsig', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'members', label: 'Lidmate', icon: <Users className="w-4 h-4" /> },
    { id: 'verhoudings', label: 'Verhoudings', icon: <Heart className="w-4 h-4" /> },
    { id: 'statistics', label: 'Lidmaattellings', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'inventory', label: 'Argiewe', icon: <FileText className="w-4 h-4" /> }
  ];

  // Add wyke tab for predikant and admins
  if (canManageWykeUser) {
    tabs.push({ id: 'wyke', label: 'Wyke & Besoekpunte', icon: <MapPin className="w-4 h-4" /> });
  }

  // Add gemeente settings tab for predikant and admins
  if (canEditLogo) {
    tabs.push({ id: 'gemeente-settings', label: 'Gemeente Instellings', icon: <Church className="w-4 h-4" /> });
  }

  // Add betalings tab for admins
  if (isGemeenteAdminUser || isHoofAdminUser) {
    tabs.push({ id: 'betalings', label: 'Betalings', icon: <CreditCard className="w-4 h-4" /> });
  }

  // Add gemeentes tab for hoof_admin
  if (isHoofAdminUser) {
    tabs.push({ id: 'gemeentes', label: 'Alle Gemeentes', icon: <Crown className="w-4 h-4" /> });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#002855]">Administrasie</h1>
        <p className="text-gray-500">
          {isHoofAdminUser
            ? 'Bestuur alle gemeentes, gebruikers en stelselinstellings'
            : `Bestuur ${currentGemeente?.naam || 'gemeente'} se gebruikers en wyke`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id
              ? 'text-[#002855] border-[#D4A84B]'
              : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Hoof Admin Dashboard */}
          {isHoofAdminUser ? (
            <HoofAdminDashboard />
          ) : (
            /* Regular Admin/Gemeente Overview */
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#002855]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#002855]">{stats.totalUsers}</p>
                      <p className="text-xs text-gray-500">Totale Gebruikers</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#7A8450]/10 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-[#7A8450]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#7A8450]">{stats.aksiesThisMonth}</p>
                      <p className="text-xs text-gray-500">Aksies (Maand)</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-[#9E2A2B]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#9E2A2B]">{stats.openKrisisse}</p>
                      <p className="text-xs text-gray-500">Oop Krisisse</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#8B7CB3]/10 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-[#8B7CB3]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#8B7CB3]">{stats.newVrae}</p>
                      <p className="text-xs text-gray-500">Nuwe Vrae</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Distribution */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-[#002855] mb-4">Gebruikersverdeling</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Lidmate', count: stats.lidmate, color: 'bg-[#8B7CB3]' },
                    { label: 'Leiers', count: stats.leiers, color: 'bg-[#7A8450]' },
                    { label: 'Admin/Kerkraad', count: stats.admins, color: 'bg-[#002855]' }
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium text-gray-900">{item.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: stats.totalUsers > 0 ? `${(item.count / stats.totalUsers) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-[#D4A84B]" />
                    <h3 className="font-bold text-[#002855]">Wyke & Besoekpunte</h3>
                  </div>
                  <p className="text-3xl font-bold text-[#002855]">{stats.wyke}</p>
                  <p className="text-sm text-gray-500 mt-1">{stats.besoekpunte} besoekpunte totaal</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-[#D4A84B]" />
                    <h3 className="font-bold text-[#002855]">Komende Geleenthede</h3>
                  </div>
                  <p className="text-3xl font-bold text-[#002855]">{stats.upcomingEvents}</p>
                  <p className="text-sm text-gray-500 mt-1">Geskeduleerde byeenkomste</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-[#D4A84B]" />
                    <h3 className="font-bold text-[#002855]">Totale Bydraes</h3>
                  </div>
                  <p className="text-3xl font-bold text-[#002855]">R{stats.totalBetalings.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-1">Voltooide betalings</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lidmate Tab - gebruikers tabel, een plek vir CSV oplaai */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Soek lidmate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
              />
            </div>
            {selectedUsers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-100/50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors border border-red-200"
              >
                <Trash2 className="w-5 h-5" />
                Verwyder ({selectedUsers.length})
              </button>
            )}
            <button
              onClick={() => setShowDuplikateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 font-semibold rounded-xl hover:bg-amber-200 transition-colors border border-amber-200"
              title={duplikateGroepe.length > 0 ? `${duplikateGroepe.length} duplikate gevind` : 'Soek duplikate'}
            >
              <AlertTriangle className="w-5 h-5" />
              Verwyder Duplikate{duplikateGroepe.length > 0 ? ` (${duplikateGroepe.length})` : ''}
            </button>
            <button
              onClick={() => setShowLidmateCSVImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#002855] text-white font-semibold rounded-xl hover:bg-[#001a3d] transition-colors"
            >
              <Upload className="w-5 h-5" />
              Laai CSV Op
            </button>
            <button
              onClick={() => setShowAddUser(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nuwe Lidmaat
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="w-12 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#D4A84B] focus:ring-[#D4A84B]"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Naam</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Wyk</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Besoekpunt</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Verhoudings</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Kontak</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    {canEditUsers && (
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksies</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => {
                    const userVerhoudings = getVerhoudingsForUser(user.id);

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#D4A84B] focus:ring-[#D4A84B]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#002855] flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {user.profile_pic_url ? (
                                <img src={user.profile_pic_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white text-xs font-bold">
                                  {(user.noemnaam || user.naam || '')[0]}{(user.van || '')[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{getLidmaatDisplayNaam(user)}</p>
                              <p className="text-xs text-gray-500 md:hidden">{user.selfoon || user.epos}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.rol)}`}>
                            {getRolLabel(user.rol)}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-gray-600">{getWykNaam(user.wyk_id)}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-gray-600">{getBesoekpuntNaam(user.besoekpunt_id)}</span>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {userVerhoudings.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {userVerhoudings.slice(0, 2).map(v => {
                                const verwante = gebruikers.find(g =>
                                  g.id === (v.lidmaat_id === user.id ? v.verwante_id : v.lidmaat_id)
                                );
                                if (!verwante) return null;
                                return (
                                  <span
                                    key={v.id}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#D4A84B]/10 text-[#D4A84B] text-xs rounded-full"
                                  >
                                    <Heart className="w-2.5 h-2.5" />
                                    {verwante.naam}
                                  </span>
                                );
                              })}
                              {userVerhoudings.length > 2 && (
                                <span className="text-xs text-gray-400">+{userVerhoudings.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="text-sm">
                            {user.selfoon && <p className="text-gray-600">{user.selfoon}</p>}
                            {user.epos && <p className="text-gray-400 text-xs truncate max-w-[200px]">{user.epos}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.aktief ? 'bg-[#7A8450]/10 text-[#7A8450]' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {user.aktief ? 'Aktief' : 'Onaktief'}
                          </span>
                        </td>
                        {canEditUsers && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-gray-400 hover:text-[#D4A84B] transition-colors"
                              title="Wysig gebruiker"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              title="Verwyder gebruiker"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Wyke Tab - Now uses WykeBestuur component */}
      {activeTab === 'wyke' && canManageWykeUser && (
        <WykeBestuur />
      )}

      {/* Betalings Tab */}
      {activeTab === 'betalings' && (isGemeenteAdminUser || isHoofAdminUser) && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-[#002855]">Alle Betalings</h3>
              <p className="text-sm text-gray-500">Oorsig van alle gemeente betalings</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Datum</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lidmaat</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bedrag</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {betalings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Geen betalings gevind nie
                      </td>
                    </tr>
                  ) : (
                    betalings.map(betaling => {
                      const gebruiker = gebruikers.find(g => g.id === betaling.gebruiker_id);
                      return (
                        <tr key={betaling.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(betaling.created_at).toLocaleDateString('af-ZA')}
                          </td>
                          <td className="px-4 py-3">
                            {gebruiker ? (
                              <span className="font-medium text-gray-900">
                                {getLidmaatDisplayNaam(gebruiker)}
                              </span>
                            ) : (
                              <span className="text-gray-400">Onbekend</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${betaling.tipe === 'offergawe'
                              ? 'bg-[#D4A84B]/10 text-[#D4A84B]'
                              : 'bg-[#8B7CB3]/10 text-[#8B7CB3]'
                              }`}>
                              {betaling.tipe === 'offergawe' ? 'Offergawe' : betaling.beskrywing || 'Ander'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-[#002855]">
                            R{formatPrice(betaling.bedrag)}
                          </td>

                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${betaling.status === 'voltooi'
                              ? 'bg-green-100 text-green-700'
                              : betaling.status === 'hangende'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                              }`}>
                              {betaling.status === 'voltooi' ? 'Voltooi' :
                                betaling.status === 'hangende' ? 'Hangende' :
                                  betaling.status === 'misluk' ? 'Misluk' : 'Gekanselleer'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* KI-Kats Geloofsonderrig Betalings */}
          <GeloofsonderrigBetalingAdmin
            currentGemeente={currentGemeente}
            gebruikers={gebruikers}
            processGeloofsonderrigBetaling={processGeloofsonderrigBetaling}
            merkGeloofsonderrigBetaal={merkGeloofsonderrigBetaal}
            refreshData={refreshData}
          />
        </div>
      )}

      {/* Gemeente Settings Tab */}
      {/* Gemeente Settings Tab */}
      {activeTab === 'gemeente-settings' && canEditLogo && currentGemeente && (
        <div className="space-y-6">
          {/* Gemeente Info Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                  <Church className="w-5 h-5 text-[#D4A84B]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#002855]">Gemeente Inligting</h2>
                  <p className="text-gray-500 text-sm">Wysig die gemeente se besonderhede</p>
                </div>
              </div>
              {!editingGemeente && (
                <button
                  onClick={() => setEditingGemeente(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#D4A84B] text-[#002855] font-medium rounded-lg hover:bg-[#c49a3d] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Wysig
                </button>
              )}
            </div>

            {editingGemeente ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gemeente Naam *</label>
                    <input
                      type="text"
                      value={gemeenteForm.naam}
                      onChange={(e) => setGemeenteForm({ ...gemeenteForm, naam: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
                    <input
                      type="tel"
                      value={gemeenteForm.telefoon}
                      onChange={(e) => setGemeenteForm({ ...gemeenteForm, telefoon: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-pos</label>
                    <input
                      type="email"
                      value={gemeenteForm.epos}
                      onChange={(e) => setGemeenteForm({ ...gemeenteForm, epos: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webwerf</label>
                    <input
                      type="url"
                      value={gemeenteForm.webwerf}
                      onChange={(e) => setGemeenteForm({ ...gemeenteForm, webwerf: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <input
                      type="text"
                      value={gemeenteForm.adres}
                      onChange={(e) => setGemeenteForm({ ...gemeenteForm, adres: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing</label>
                    <textarea
                      value={gemeenteForm.beskrywing}
                      onChange={(e) => setGemeenteForm({ ...gemeenteForm, beskrywing: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingGemeente(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Kanselleer
                  </button>
                  <button
                    onClick={handleSaveGemeente}
                    disabled={savingGemeente}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-lg hover:bg-[#c49a3d] transition-colors disabled:opacity-50"
                  >
                    {savingGemeente ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Stoor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Stoor Veranderinge
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Naam</p>
                  <p className="font-medium text-gray-900">{currentGemeente.naam}</p>
                </div>
                {currentGemeente.adres && (
                  <div>
                    <p className="text-sm text-gray-500">Adres</p>
                    <p className="font-medium text-gray-900">{currentGemeente.adres}</p>
                  </div>
                )}
                {currentGemeente.telefoon && (
                  <div>
                    <p className="text-sm text-gray-500">Telefoon</p>
                    <p className="font-medium text-gray-900">{currentGemeente.telefoon}</p>
                  </div>
                )}
                {currentGemeente.epos && (
                  <div>
                    <p className="text-sm text-gray-500">E-pos</p>
                    <p className="font-medium text-gray-900">{currentGemeente.epos}</p>
                  </div>
                )}
                {currentGemeente.webwerf && (
                  <div>
                    <p className="text-sm text-gray-500">Webwerf</p>
                    <p className="font-medium text-gray-900">{currentGemeente.webwerf}</p>
                  </div>
                )}
                {currentGemeente.beskrywing && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Beskrywing</p>
                    <p className="font-medium text-gray-900">{currentGemeente.beskrywing}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logo Upload Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#D4A84B]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#002855]">Gemeente Logo</h2>
                <p className="text-gray-500 text-sm">Verander die gemeente se logo of profielfoto</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Current Logo */}
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-500 mb-2">Huidige Logo</p>
                <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                  {logoPreview || currentGemeente.logo_url ? (
                    <img
                      src={logoPreview || currentGemeente.logo_url}
                      alt={currentGemeente.naam}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Church className="w-12 h-12 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Upload Section */}
              <div className="flex-1">
                <div
                  onClick={() => !uploadingLogo && logoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploadingLogo ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-[#D4A84B]'
                    }`}
                >
                  {uploadingLogo ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-[#D4A84B] animate-spin mb-3" />
                      <p className="text-gray-600 font-medium">Laai op...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-10 h-10 text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">Klik om nuwe logo op te laai</p>
                      <p className="text-sm text-gray-400 mt-1">PNG, JPG tot 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </div>
            </div>
          </div>

          {/* Bank Details Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#D4A84B]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#002855]">Bankbesonderhede</h2>
                <p className="text-gray-500 text-sm">Hierdie besonderhede word aan lidmate gewys vir EFT betalings</p>
              </div>
            </div>

            {loadingBank ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-[#D4A84B] animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info Alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">EFT Betaling Inligting</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Hierdie bankbesonderhede sal aan alle lidmate gewys word by die Betalings bladsy met die boodskap:
                      <span className="italic"> "Maak 'n EFT betaling aan die gemeente vanaf jou eie banktoepassing."</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Naam *</label>
                    <input
                      type="text"
                      value={bankForm.bank_naam}
                      onChange={(e) => setBankForm({ ...bankForm, bank_naam: e.target.value })}
                      placeholder="bv. ABSA, FNB, Standard Bank"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rekening Naam *</label>
                    <input
                      type="text"
                      value={bankForm.rekening_naam}
                      onChange={(e) => setBankForm({ ...bankForm, rekening_naam: e.target.value })}
                      placeholder="bv. NHKA Gemeente Pretoria"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rekening Nommer *</label>
                    <input
                      type="text"
                      value={bankForm.rekening_nommer}
                      onChange={(e) => setBankForm({ ...bankForm, rekening_nommer: e.target.value })}
                      placeholder="bv. 1234567890"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Takkode</label>
                    <input
                      type="text"
                      value={bankForm.takkode}
                      onChange={(e) => setBankForm({ ...bankForm, takkode: e.target.value })}
                      placeholder="bv. 632005"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rekening Tipe</label>
                    <div className="relative">
                      <select
                        value={bankForm.rekening_tipe}
                        onChange={(e) => setBankForm({ ...bankForm, rekening_tipe: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white"
                      >
                        <option value="Tjekrekening">Tjekrekening</option>
                        <option value="Spaarrekening">Spaarrekening</option>
                        <option value="Transmissierekening">Transmissierekening</option>
                        <option value="Besigheidsrekening">Besigheidsrekening</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verwysing Instruksies</label>
                    <textarea
                      value={bankForm.verwysing_instruksies}
                      onChange={(e) => setBankForm({ ...bankForm, verwysing_instruksies: e.target.value })}
                      rows={2}
                      placeholder="bv. Gebruik jou naam en van as verwysing"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSaveBankDetails}
                    disabled={savingBank}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D4A84B] text-[#002855] font-semibold rounded-lg hover:bg-[#c49a3d] transition-colors disabled:opacity-50"
                  >
                    {savingBank ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Stoor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Stoor Bankbesonderhede
                      </>
                    )}
                  </button>
                </div>

                {/* Preview of what users will see */}
                {bankDetails && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-[#002855] mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Voorskou: Wat lidmate sal sien
                    </h3>
                    <div className="bg-gradient-to-r from-[#002855] to-[#003d7a] rounded-xl p-4 text-white">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold">EFT Betaling</h4>
                          <p className="text-white/70 text-sm">Maak 'n EFT betaling aan die gemeente vanaf jou eie banktoepassing.</p>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/60">Bank:</span>
                          <span className="font-medium">{bankDetails.bank_naam}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Rekening Naam:</span>
                          <span className="font-medium">{bankDetails.rekening_naam}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Rekening Nommer:</span>
                          <span className="font-medium font-mono">{bankDetails.rekening_nommer}</span>
                        </div>
                        {bankDetails.takkode && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Takkode:</span>
                            <span className="font-medium font-mono">{bankDetails.takkode}</span>
                          </div>
                        )}
                        {bankDetails.rekening_tipe && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Tipe:</span>
                            <span className="font-medium">{bankDetails.rekening_tipe}</span>
                          </div>
                        )}
                        {bankDetails.verwysing_instruksies && (
                          <div className="pt-2 border-t border-white/20">
                            <span className="text-white/60 text-xs">Verwysing:</span>
                            <p className="text-sm">{bankDetails.verwysing_instruksies}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CSV Upload Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                <Upload className="w-5 h-5 text-[#D4A84B]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#002855]">CSV Oplaai</h2>
                <p className="text-gray-500 text-sm">Laai gebruikers of program items op via CSV lêer</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowLidmateCSVImport(true)}
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D4A84B] hover:bg-[#D4A84B]/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-[#002855]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#002855]">Gebruikers Oplaai</p>
                  <p className="text-sm text-gray-500">Laai lidmate via CSV op</p>
                </div>
              </button>

              <button
                onClick={() => toast.info('Gemeenteprogram CSV oplaai kom binnekort')}
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D4A84B] hover:bg-[#D4A84B]/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#002855]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#002855]">Program Oplaai</p>
                  <p className="text-sm text-gray-500">Laai gemeenteprogram via CSV op</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Gemeentes Tab (Hoof Admin Only) */}
      {activeTab === 'gemeentes' && isHoofAdminUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gemeentes.map(gemeente => (
            <div key={gemeente.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {gemeente.logo_url ? (
                    <img src={gemeente.logo_url} alt={gemeente.naam} className="w-full h-full object-cover" />
                  ) : (
                    <Church className="w-6 h-6 text-[#002855]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#002855] truncate">{gemeente.naam}</h3>
                    {gemeente.is_demo && (
                      <span className="px-2 py-0.5 bg-[#D4A84B]/20 text-[#D4A84B] text-xs font-medium rounded-full">
                        Demo
                      </span>
                    )}
                  </div>
                  {gemeente.adres && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{gemeente.adres}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${gemeente.aktief ? 'bg-[#7A8450]/10 text-[#7A8450]' : 'bg-gray-100 text-gray-500'
                  }`}>
                  {gemeente.aktief ? 'Aktief' : 'Onaktief'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(gemeente.created_at).toLocaleDateString('af-ZA')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'verhoudings' && (
        <VerhoudingsBestuur />
      )}

      {/* Add User Modal */}
      {
        showAddUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#002855]">Nuwe Gebruiker</h2>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                    <input
                      type="text"
                      value={newUser.naam}
                      onChange={(e) => setNewUser({ ...newUser, naam: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Van *</label>
                    <input
                      type="text"
                      value={newUser.van}
                      onChange={(e) => setNewUser({ ...newUser, van: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <div className="relative">
                    <select
                      value={newUser.rol}
                      onChange={(e) => setNewUser({ ...newUser, rol: e.target.value as UserRole })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white"
                    >
                      <option value="lidmaat">Lidmaat</option>
                      <option value="groepleier">Groepleier</option>
                      <option value="ouderling">Ouderling</option>
                      <option value="diaken">Diaken</option>
                      <option value="predikant">Predikant</option>
                      <option value="subadmin">Gemeente Admin</option>
                      {isHoofAdminUser && <option value="moderator">VBO Moderator</option>}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selfoon</label>
                  <input
                    type="tel"
                    value={newUser.selfoon}
                    onChange={(e) => setNewUser({ ...newUser, selfoon: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-pos</label>
                  <input
                    type="email"
                    value={newUser.epos}
                    onChange={(e) => setNewUser({ ...newUser, epos: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wagwoord *</label>
                  <input
                    type="password"
                    value={newUser.wagwoord}
                    onChange={(e) => setNewUser({ ...newUser, wagwoord: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    placeholder="Kies 'n wagwoord"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Kanselleer
                </button>
                <button
                  onClick={handleAddUser}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] transition-colors"
                >
                  Voeg By
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit User Modal with Tabs */}
      {
        showEditUser && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center overflow-hidden">
                    {selectedUser.profile_pic_url ? (
                      <img src={selectedUser.profile_pic_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {(selectedUser.noemnaam || selectedUser.naam || '')[0]}{(selectedUser.van || '')[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#002855]">Wysig Gebruiker</h2>
                    <p className="text-sm text-gray-500">{getLidmaatDisplayNaam(selectedUser)}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditUser(false);
                    setSelectedUser(null);
                    setOuditLogs([]);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setEditModalTab('details')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${editModalTab === 'details'
                    ? 'text-[#002855] border-[#D4A84B]'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    Besonderhede
                  </div>
                </button>
                <button
                  onClick={() => setEditModalTab('verhoudings')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${editModalTab === 'verhoudings'
                    ? 'text-[#002855] border-[#D4A84B]'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4" />
                    Verhoudings
                  </div>
                </button>
                <button
                  onClick={() => setEditModalTab('geskiedenis')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${editModalTab === 'geskiedenis'
                    ? 'text-[#002855] border-[#D4A84B]'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <History className="w-4 h-4" />
                    Geskiedenis
                  </div>
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-6">
                {/* Details Tab */}
                {editModalTab === 'details' && (
                  <>
                    {/* Personal Info */}
                    <div>
                      <h3 className="font-semibold text-[#002855] mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Persoonlike Inligting
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Geslag</label>
                          <select value={editUser.geslag || ''} onChange={(e) => setEditUser({ ...editUser, geslag: (e.target.value || '') as '' | 'man' | 'vrou' | 'ander' })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none bg-white">
                            <option value="">Kies...</option>
                            <option value="man">Man</option>
                            <option value="vrou">Vrou</option>
                            <option value="ander">Ander</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                          <input type="text" value={editUser.titel || ''} onChange={(e) => setEditUser({ ...editUser, titel: e.target.value })} placeholder="Mnr., Mev., Dr." className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Van *</label>
                          <input type="text" value={editUser.van} onChange={(e) => setEditUser({ ...editUser, van: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nooiensvan</label>
                          <input type="text" value={editUser.nooiensvan || ''} onChange={(e) => setEditUser({ ...editUser, nooiensvan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Voornaam 1 *</label>
                          <input type="text" value={editUser.voornaam_1 || editUser.naam} onChange={(e) => setEditUser({ ...editUser, voornaam_1: e.target.value, naam: e.target.value || editUser.naam })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Voornaam 2</label>
                          <input type="text" value={editUser.voornaam_2 || ''} onChange={(e) => setEditUser({ ...editUser, voornaam_2: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Voornaam 3</label>
                          <input type="text" value={editUser.voornaam_3 || ''} onChange={(e) => setEditUser({ ...editUser, voornaam_3: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Noemnaam</label>
                          <input type="text" value={editUser.noemnaam || ''} onChange={(e) => setEditUser({ ...editUser, noemnaam: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Geboortedatum</label>
                          <div className="flex items-center gap-2">
                            <input type="date" value={editUser.geboortedatum} onChange={(e) => setEditUser({ ...editUser, geboortedatum: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                            {getOuderdom(editUser.geboortedatum || undefined, editUser.geboortedatum === selectedUser?.geboortedatum ? selectedUser?.ouderdom : undefined) != null && (
                              <span className="text-sm text-gray-500 whitespace-nowrap">
                                ({getOuderdom(editUser.geboortedatum || undefined, editUser.geboortedatum === selectedUser?.geboortedatum ? selectedUser?.ouderdom : undefined)} jaar)
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Doop datum</label>
                          <input type="date" value={editUser.doop_datum || ''} onChange={(e) => setEditUser({ ...editUser, doop_datum: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Belydenis van geloof datum</label>
                          <input type="date" value={editUser.belydenis_van_geloof_datum || ''} onChange={(e) => setEditUser({ ...editUser, belydenis_van_geloof_datum: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sterf datum</label>
                          <input type="date" value={editUser.sterf_datum || ''} onChange={(e) => setEditUser({ ...editUser, sterf_datum: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Primêre rol</label>
                          <div className="relative">
                            <select value={editUser.rol} onChange={(e) => setEditUser({ ...editUser, rol: e.target.value as UserRole, app_roles: editUser.app_roles?.length ? [...editUser.app_roles.filter(r => r !== editUser.rol), e.target.value as UserRole] : [e.target.value as UserRole] })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white">
                              <option value="lidmaat">Lidmaat</option>
                              <option value="groepleier">Groepleier</option>
                              <option value="ouderling">Ouderling</option>
                              <option value="diaken">Diaken</option>
                              <option value="predikant">Predikant</option>
                              <option value="subadmin">Gemeente Admin</option>
                              {isHoofAdminUser && <option value="moderator">VBO Moderator</option>}
                              {isHoofAdminUser && <option value="hoof_admin">Hoof Admin</option>}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Portefeulje 1, 2, 3</label>
                          <div className="grid grid-cols-3 gap-2">
                            <input type="text" value={editUser.portefeulje_1 || ''} onChange={(e) => setEditUser({ ...editUser, portefeulje_1: e.target.value })} placeholder="Portefeulje 1" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                            <input type="text" value={editUser.portefeulje_2 || ''} onChange={(e) => setEditUser({ ...editUser, portefeulje_2: e.target.value })} placeholder="Portefeulje 2" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                            <input type="text" value={editUser.portefeulje_3 || ''} onChange={(e) => setEditUser({ ...editUser, portefeulje_3: e.target.value })} placeholder="Portefeulje 3" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                      <h3 className="font-semibold text-[#002855] mb-3 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Kontak Inligting
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Selfoon (+xx formaat)</label>
                          <input type="tel" value={editUser.selfoon} onChange={(e) => setEditUser({ ...editUser, selfoon: e.target.value })} placeholder="+27..." className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Landlyn</label>
                          <input type="tel" value={editUser.landlyn || ''} onChange={(e) => setEditUser({ ...editUser, landlyn: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">E-pos 1</label>
                          <input type="email" value={editUser.epos} onChange={(e) => setEditUser({ ...editUser, epos: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">E-pos 2</label>
                          <input type="email" value={editUser.epos_2 || ''} onChange={(e) => setEditUser({ ...editUser, epos_2: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Adres (saamgevoeg)</label>
                          <input type="text" value={editUser.adres} onChange={(e) => setEditUser({ ...editUser, adres: e.target.value })} placeholder="Straat, voorstad, stad" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Straat nommer</label>
                          <input type="text" value={editUser.straat_nommer || ''} onChange={(e) => setEditUser({ ...editUser, straat_nommer: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Woonkompleks naam</label>
                          <input type="text" value={editUser.woonkompleks_naam || ''} onChange={(e) => setEditUser({ ...editUser, woonkompleks_naam: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Woonkompleks nommer</label>
                          <input type="text" value={editUser.woonkompleks_nommer || ''} onChange={(e) => setEditUser({ ...editUser, woonkompleks_nommer: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Voorstad</label>
                          <input type="text" value={editUser.voorstad || ''} onChange={(e) => setEditUser({ ...editUser, voorstad: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stad/Dorp</label>
                          <input type="text" value={editUser.stad_dorp || ''} onChange={(e) => setEditUser({ ...editUser, stad_dorp: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Poskode</label>
                          <input type="text" value={editUser.poskode || ''} onChange={(e) => setEditUser({ ...editUser, poskode: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none" />
                        </div>
                      </div>
                    </div>

                    {/* Wyk & Besoekpunt */}
                    <div>
                      <h3 className="font-semibold text-[#002855] mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Wyk & Besoekpunt Toewysing
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Wyk</label>
                          <div className="relative">
                            <select
                              value={editUser.wyk_id}
                              onChange={(e) => setEditUser({ ...editUser, wyk_id: e.target.value, besoekpunt_id: '' })}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white"
                            >
                              <option value="">Geen wyk</option>
                              {wyke.map(w => (
                                <option key={w.id} value={w.id}>{w.naam}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Besoekpunt</label>
                          <div className="relative">
                            <select
                              value={editUser.besoekpunt_id}
                              onChange={(e) => setEditUser({ ...editUser, besoekpunt_id: e.target.value })}
                              disabled={!editUser.wyk_id}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              <option value="">Geen besoekpunt</option>
                              {editUser.wyk_id && getBesoekpunteForWyk(editUser.wyk_id).map(bp => (
                                <option key={bp.id} value={bp.id}>{bp.naam}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status & Notes */}
                    <div>
                      <h3 className="font-semibold text-[#002855] mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Status & Notas
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editUser.aktief}
                              onChange={(e) => setEditUser({ ...editUser, aktief: e.target.checked })}
                              className="w-4 h-4 rounded border-gray-300 text-[#D4A84B] focus:ring-[#D4A84B]"
                            />
                            <span className="text-sm font-medium text-gray-700">Aktiewe lidmaat</span>
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editUser.is_oorlede || false}
                              onChange={(e) => {
                                const isOorlede = e.target.checked;
                                setEditUser({
                                  ...editUser,
                                  is_oorlede: isOorlede,
                                  aktief: isOorlede ? false : editUser.aktief // Auto deactivate if deceased
                                });
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Oorlede</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                          <textarea
                            value={editUser.notas}
                            onChange={(e) => setEditUser({ ...editUser, notas: e.target.value })}
                            rows={3}
                            placeholder="Enige addisionele notas oor hierdie lidmaat..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Verhoudings Tab */}
                {editModalTab === 'verhoudings' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-[#002855] flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Verhoudings
                      </h3>
                      <button
                        onClick={() => setShowAddVerhouding(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-[#D4A84B] text-[#002855] font-medium rounded-lg hover:bg-[#c49a3d] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Voeg By
                      </button>
                    </div>
                    <div className="space-y-2">
                      {getVerhoudingsForUser(selectedUser.id).length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Geen verhoudings geregistreer nie</p>
                          <p className="text-sm text-gray-400 mt-1">Klik "Voeg By" om 'n verhouding by te voeg</p>
                        </div>
                      ) : (
                        getVerhoudingsForUser(selectedUser.id).map(v => {
                          const verwante = gebruikers.find(g =>
                            g.id === (v.lidmaat_id === selectedUser.id ? v.verwante_id : v.lidmaat_id)
                          );
                          if (!verwante) return null;

                          const verhoudingLabel = v.verhouding_tipe === 'ander'
                            ? v.verhouding_beskrywing
                            : getVerhoudingLabel(v.verhouding_tipe);

                          return (
                            <div
                              key={v.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center overflow-hidden">
                                  {verwante.profile_pic_url ? (
                                    <img src={verwante.profile_pic_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-white text-xs font-bold">
                                      {verwante.naam[0]}{verwante.van[0]}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{verwante.naam} {verwante.van}</p>
                                  <p className="text-xs text-[#D4A84B]">{verhoudingLabel}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteVerhouding(v.id, `${verwante.naam} ${verwante.van}`, verhoudingLabel || '')}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Geskiedenis Tab */}
                {editModalTab === 'geskiedenis' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <History className="w-5 h-5 text-[#002855]" />
                      <h3 className="font-semibold text-[#002855]">Oudit Geskiedenis</h3>
                    </div>

                    {loadingOuditLogs ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-[#D4A84B] animate-spin" />
                      </div>
                    ) : ouditLogs.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Geen geskiedenis beskikbaar nie</p>
                        <p className="text-sm text-gray-400 mt-1">Veranderinge aan hierdie lidmaat sal hier verskyn</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {ouditLogs.map((log, index) => (
                          <div key={log.id} className="relative">
                            {/* Timeline connector */}
                            {index < ouditLogs.length - 1 && (
                              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
                            )}

                            <div className="flex gap-3">
                              {/* Icon */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getOuditColor(log.aksie_tipe)}`}>
                                {getOuditIcon(log.aksie_tipe)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">
                                      {getOuditAksieTipeLabel(log.aksie_tipe)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-0.5">{log.beskrywing}</p>
                                  </div>
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleDateString('af-ZA', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>

                                {/* Show old and new values if available */}
                                {(log.ou_waarde || log.nuwe_waarde) && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="flex items-center gap-2 text-xs">
                                      {log.ou_waarde && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                          {log.ou_waarde}
                                        </span>
                                      )}
                                      {log.ou_waarde && log.nuwe_waarde && (
                                        <ArrowRight className="w-3 h-3 text-gray-400" />
                                      )}
                                      {log.nuwe_waarde && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                          {log.nuwe_waarde}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Who made the change */}
                                {log.gewysig_deur_naam && (
                                  <p className="text-xs text-gray-400 mt-2">
                                    Gewysig deur: {log.gewysig_deur_naam}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowEditUser(false);
                    setSelectedUser(null);
                    setOuditLogs([]);
                  }}
                  className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Kanselleer
                </button>
                {editModalTab !== 'geskiedenis' && (
                  <button
                    onClick={handleSaveUser}
                    disabled={savingUser}
                    className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingUser ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Stoor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Stoor Veranderinge
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Add Verhouding Modal (for Edit User) */}
      {
        showAddVerhouding && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
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
                  <label className="block text-sm font-semibold text-gray-700">Verwante Lidmaat (Soek in alle gemeentes) *</label>
                  <p className="text-[10px] text-[#9E2A2B] font-bold mb-2">Name sal slegs wys indien hul geregistreer is as gebruikers.</p>

                  {selectedVerwanteUser ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-[#D4A84B]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#002855] flex items-center justify-center text-white text-xs">
                          {selectedVerwanteUser.naam[0]}{selectedVerwanteUser.van[0]}
                        </div>
                        <div>
                          <p className="font-medium text-[#002855]">{selectedVerwanteUser.naam} {selectedVerwanteUser.van}</p>
                          <p className="text-xs text-gray-500">{typeof (selectedVerwanteUser as any).gemeente_data?.naam === 'string' ? (selectedVerwanteUser as any).gemeente_data.naam : (typeof selectedVerwanteUser.gemeente === 'string' ? selectedVerwanteUser.gemeente : 'Onbekende Gemeente')}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedVerwanteUser(null);
                          setNewVerhouding(prev => ({ ...prev, verwante_id: '' }));
                          setUserSearchQuery('');
                          setVerwanteGemeenteId('');
                          setVerwanteList([]);
                        }}
                        className="p-1 hover:bg-gray-200 rounded-full"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Browse by Gemeente */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Blaai per Gemeente</label>
                        <select
                          value={verwanteGemeenteId}
                          onChange={(e) => handleVerwanteGemeenteChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm"
                        >
                          <option value="">Kies Gemeente...</option>
                          {gemeentes.map(g => (
                            <option key={g.id} value={g.id}>{g.naam}</option>
                          ))}
                        </select>

                        <div className="relative">
                          <select
                            value={newVerhouding.verwante_id}
                            onChange={(e) => {
                              const user = verwanteList.find(u => u.id === e.target.value);
                              setNewVerhouding(prev => ({ ...prev, verwante_id: e.target.value }));
                              if (user) setSelectedVerwanteUser(user);
                            }}
                            disabled={!verwanteGemeenteId || loadingVerwanteList}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none disabled:bg-gray-50 text-sm"
                          >
                            <option value="">{loadingVerwanteList ? 'Laai...' : 'Kies Lidmaat...'}</option>
                            {verwanteList.map(u => (
                              <option key={u.id} value={u.id}>{u.naam} {u.van}</option>
                            ))}
                          </select>
                          {loadingVerwanteList && (
                            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#D4A84B]" />
                          )}
                        </div>
                      </div>

                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-100" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                          <span className="bg-white px-2 text-gray-400 font-bold">Of soek per naam</span>
                        </div>
                      </div>

                      {/* Search by Name */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => handleUserSearch(e.target.value)}
                          placeholder="Tik naam of van..."
                          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm"
                        />
                        {searchingUsers && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#D4A84B]" />
                          </div>
                        )}

                        {/* Search Results Dropdown */}
                        {userSearchResults.length > 0 && !selectedVerwanteUser && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-48 overflow-y-auto z-50">
                            {userSearchResults.map(user => (
                              <button
                                key={user.id}
                                onClick={() => {
                                  setSelectedVerwanteUser(user);
                                  setNewVerhouding(prev => ({ ...prev, verwante_id: user.id }));
                                  setUserSearchResults([]);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                              >
                                <p className="font-medium text-[#002855]">{user.naam} {user.van}</p>
                                <p className="text-xs text-gray-500">{typeof (user as any).gemeente_data?.naam === 'string' ? (user as any).gemeente_data.naam : (typeof user.gemeente === 'string' ? user.gemeente : 'Onbekend')}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                  onClick={handleAddVerhoudingForUser}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] transition-colors"
                >
                  Voeg By
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Lidmate CSV Import - ENIGE plek vir lidmate oplaai */}
      {
        showLidmateCSVImport && currentGemeente && (
          <LidmateCSVImport
            gemeenteId={currentGemeente.id}
            onClose={() => setShowLidmateCSVImport(false)}
            onComplete={() => {
              setShowLidmateCSVImport(false);
              refreshData();
            }}
          />
        )
      }

      {/* Duplikate Verwyder Modal */}
      {showDuplikateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-[#002855] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Verwyder Duplikate
              </h3>
              <button onClick={() => { setShowDuplikateModal(false); setDuplikateBehouId({}); }} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {duplikateGroepe.length === 0 ? (
                <p className="text-gray-500 py-8 text-center">Geen duplikate gevind in hierdie gemeente.</p>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600">Kies watter rekord om te behou vir elke groep. Die ander sal verwyder word.</p>
                  {duplikateGroepe.map(groep => (
                    <div key={groep.key} className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-amber-800 mb-3">{groep.reden}</p>
                      <div className="space-y-2">
                        {groep.users.map(u => (
                          <label key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name={`duplikate-${groep.key}`}
                              checked={(duplikateBehouId[groep.key] || groep.users[0].id) === u.id}
                              onChange={() => setDuplikateBehouId(prev => ({ ...prev, [groep.key]: u.id }))}
                              className="w-4 h-4 text-[#D4A84B]"
                            />
                            <div className="flex-1">
                              <span className="font-medium">{getLidmaatDisplayNaam(u)}</span>
                              {(u.selfoon || u.epos) && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {[u.selfoon, u.epos].filter(Boolean).join(' • ')}
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {duplikateGroepe.length > 0 && (
              <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
                <button
                  onClick={() => { setShowDuplikateModal(false); setDuplikateBehouId({}); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Kanselleer
                </button>
                <button
                  onClick={handleVerwyderDuplikate}
                  disabled={verwyderDuplikateLoading}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {verwyderDuplikateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Verwyder Duplikate
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DUMMY block removed - Lidmate content is above */}
      {false && (
        <>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#D4A84B]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002855]">Laai Gebruikers Op</h2>
              <p className="text-sm text-gray-500">Laai lidmate via CSV lêer op</p>
            </div>
            <button
              onClick={() => {
                setShowCSVModal(false);
                setCsvFile(null);
                setCsvPreview([]);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* CSV Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">CSV Formaat Vereistes:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Eerste ry moet kolomhoofde bevat</li>
                <li>• Verpligte kolomme: <span className="font-mono bg-blue-100 px-1 rounded">naam</span>, <span className="font-mono bg-blue-100 px-1 rounded">van</span></li>
                <li>• Opsionele kolomme: <span className="font-mono bg-blue-100 px-1 rounded">selfoon</span>, <span className="font-mono bg-blue-100 px-1 rounded">epos</span>, <span className="font-mono bg-blue-100 px-1 rounded">adres</span>, <span className="font-mono bg-blue-100 px-1 rounded">geboortedatum</span>, <span className="font-mono bg-blue-100 px-1 rounded">rol</span></li>
              </ul>
            </div>

            {/* File Upload */}
            <div>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVFileChange}
                className="hidden"
              />
              <div
                onClick={() => csvInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#D4A84B] transition-colors"
              >
                {csvFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-[#D4A84B]" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{csvFile.name}</p>
                      <p className="text-sm text-gray-500">{(csvFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">Klik om CSV lêer te kies</p>
                    <p className="text-sm text-gray-400 mt-1">of sleep en los hier</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {csvPreview.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Voorskou (eerste 5 rye):</p>
                <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-1 px-2 font-medium text-gray-600">Naam</th>
                        <th className="text-left py-1 px-2 font-medium text-gray-600">Van</th>
                        <th className="text-left py-1 px-2 font-medium text-gray-600">Selfoon</th>
                        <th className="text-left py-1 px-2 font-medium text-gray-600">Rol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                          <td className="py-1 px-2 text-gray-900">{row.naam}</td>
                          <td className="py-1 px-2 text-gray-900">{row.van}</td>
                          <td className="py-1 px-2 text-gray-600">{row.selfoon || '-'}</td>
                          <td className="py-1 px-2 text-gray-600">{row.rol || 'lidmaat'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 p-4 border-t border-gray-100">
            <button
              onClick={() => {
                setShowCSVModal(false);
                setCsvFile(null);
                setCsvPreview([]);
              }}
              className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Kanselleer
            </button>
            <button
              onClick={handleCSVUpload}
              disabled={!csvFile || uploadingCSV}
              className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploadingCSV ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Laai op...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Laai Op
                </>
              )}
            </button>
          </div>
        </>
      )
      }

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-[#002855]">Lidmate Bestuur</h3>
              <p className="text-sm text-gray-500">Bestuur lidmate en vul ontbrekende inligting in</p>
            </div>
            <button
              onClick={() => setShowLidmateCSVImport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] rounded-lg hover:bg-[#c49a3d] transition-colors font-medium"
            >
              <Upload className="w-4 h-4" />
              Laai Lidmate CSV Op
            </button>
          </div>

        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <StatisticsManagement congregationId={currentGemeente?.id || ''} />
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowInventoryImport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] rounded-lg hover:bg-[#c49a3d] transition-colors font-medium"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          </div>

          <ComplianceInventory congregationId={currentGemeente?.id || ''} />

          {showInventoryImport && (
            <InventoryCSVImport
              onClose={() => setShowInventoryImport(false)}
              onComplete={() => {
                setShowInventoryImport(false);
                refreshData();
              }}
            />
          )}
        </div>
      )}
    </div >
  );
};

export default AdminPanel;
