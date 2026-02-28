import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { getRolLabel, Gebruiker, GemeenteStats, UserRole, GeloofsonderrigOnderwerp, GeloofsonderrigLes, Graad, AdminPermission, ADMIN_PERMISSION_LABELS, ALL_ADMIN_PERMISSIONS, hasAdminPermission, isSubAdmin } from '@/types/nhka';
import {
  LayoutDashboard,
  Church,
  Users,
  MapPin,
  AlertTriangle,
  HelpCircle,
  CreditCard,
  Heart,
  Crown,
  Plus,
  X,
  Eye,
  Loader2,
  Shield,
  BarChart3,
  TrendingUp,
  Building2,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Info,
  UserPlus,
  GraduationCap,
  BookOpen,
  Award,
  UserCog,
  Trash2,
  Edit,
  FileDown,
  KeyRound,
  CloudUpload,
  FileText,
  MessageCircle,
  RefreshCw,
  Music,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import LMSStatistieke from './LMSStatistieke';
import DenominationStats from './DenominationStats';
import LMSKursusBestuur from './LMSKursusBestuur';
import VBOBestuur from './VBOBestuur';
import DataExport from './DataExport';
import RolBestuur from './RolBestuur';
import MenuBuilder from './MenuBuilder';
import OmsendbriefPortaal from '@/components/omsendbrief/OmsendbriefPortaal';
import OmsendbriefAnalise from '@/components/omsendbrief/OmsendbriefAnalise';
import { sortGemeentesWithUserFirst } from '@/constants/gemeentes';
import { Textarea } from '@/components/ui/textarea';
import MusiekAdmin from '@/components/musiek/MusiekAdmin';


interface CSVLidmaat {
  naam: string;
  van: string;
  selfoon?: string;
  epos?: string;
  straat_naam?: string;
  adres?: string;
  geboortedatum?: string;
  rol?: UserRole;
}

interface CSVImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface Moderator {
  id: string;
  naam: string;
  van: string;
  epos?: string;
  selfoon?: string;
  aktief: boolean;
  created_at: string;
}

interface SubAdminRow {
  id: string;
  naam: string;
  van: string;
  epos?: string;
  selfoon?: string;
  aktief: boolean;
  admin_permissions?: AdminPermission[];
  created_at: string;
}

interface GeloofsonderrigBetalingRow {
  id: string;
  leerder_id: string;
  gemeente_id: string;
  bedrag: number;
  status: string;
  betaal_tipe: string;
  created_at: string;
  leerder_naam?: string;
  gemeente_naam?: string;
}

interface GeloofsonderrigLeaderboardRow {
  rang: number;
  leerder_id: string;
  naam: string;
  van: string;
  totaal_punte: number;
}

const GeloofsonderrigLeaderboardAdmin: React.FC = () => {
  const { currentUser } = useNHKA();
  const [rows, setRows] = useState<GeloofsonderrigLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_geloofsonderrig_leaderboard_admin', { p_admin_id: currentUser.id });
        if (error) throw error;
        setRows((data || []).map((r: any) => ({
          rang: r.rang,
          leerder_id: r.leerder_id,
          naam: r.naam || '',
          van: r.van || '',
          totaal_punte: r.totaal_punte || 0
        })));
      } catch (e) {
        console.error('Leaderboard fetch:', e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [currentUser?.id]);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : !currentUser?.id ? (
        <p className="text-gray-500 py-8 text-center">Meld aan om ranglys te sien.</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">Geen KI-Kats ranglys data nog.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Rang</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Naam</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Van</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Punte</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.leerder_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-2 font-bold text-amber-600">{r.rang}</td>
                  <td className="px-3 py-2">{r.naam}</td>
                  <td className="px-3 py-2">{r.van}</td>
                  <td className="px-3 py-2 font-semibold">{r.totaal_punte}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const GeloofsonderrigTransaksieLog: React.FC = () => {
  const [rows, setRows] = useState<GeloofsonderrigBetalingRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchLog = async () => {
      setLoading(true);
      try {
        const { data: betalings, error } = await supabase
          .from('geloofsonderrig_betalings')
          .select('id, leerder_id, gemeente_id, bedrag, status, betaal_tipe, created_at')
          .eq('status', 'betaal')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        const leerderIds = [...new Set((betalings || []).map(b => b.leerder_id))];
        const gemeenteIds = [...new Set((betalings || []).map(b => b.gemeente_id))];
        const { data: gebruikers } = await supabase.from('gebruikers').select('id, naam, van').in('id', leerderIds);
        const { data: gemeentesData } = await supabase.from('gemeentes').select('id, naam').in('id', gemeenteIds);
        const gebruikerMap = new Map((gebruikers || []).map(g => [g.id, `${g.naam || ''} ${g.van || ''}`.trim() || 'Onbekend']));
        const gemeenteMap = new Map((gemeentesData || []).map(g => [g.id, g.naam || 'Onbekend']));
        const enriched = (betalings || []).map(b => ({
          ...b,
          leerder_naam: gebruikerMap.get(b.leerder_id) || 'Onbekend',
          gemeente_naam: gemeenteMap.get(b.gemeente_id) || 'Onbekend'
        }));
        setRows(enriched);
      } catch (e) {
        console.error('Geloofsonderrig transaksielog:', e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, []);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">Geen KI-Kats betalings nog.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Datum</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Gemeente</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Leerder</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Bedrag</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Tipe</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-2 text-gray-700">{new Date(r.created_at).toLocaleDateString('af-ZA')}</td>
                  <td className="px-3 py-2 font-medium">{r.gemeente_naam}</td>
                  <td className="px-3 py-2">{r.leerder_naam}</td>
                  <td className="px-3 py-2">R{(r.bedrag / 100).toFixed(2)}</td>
                  <td className="px-3 py-2">{r.betaal_tipe === 'namens' ? 'Namens' : 'Self'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const HoofAdminDashboard: React.FC = () => {
  const {
    currentUser,
    gemeentes,
    gemeenteStats,
    getHoofAdmins,
    addHoofAdmin,
    updateGebruiker,
    deleteUser,
    setCurrentView,
    setCurrentGemeente,
    refreshAllGemeenteStats,
    loading,
    logout
  } = useNHKA();

  // Helper function to safely format price values that may be strings from database
  const formatPrice = (value: any): string => {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  // Helper to safely get numeric value
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  const [showAddHoofAdmin, setShowAddHoofAdmin] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    naam: '',
    van: '',
    epos: '',
    selfoon: '',
    wagwoord: '',
    wagwoord_bevestig: ''
  });

  // CSV Upload State
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [selectedGemeenteId, setSelectedGemeenteId] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVLidmaat[]>([]);
  const [csvPreview, setCsvPreview] = useState<CSVLidmaat[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [uploadStep, setUploadStep] = useState<'select' | 'preview' | 'result'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section visibility state
  const [showLMSStats, setShowLMSStats] = useState(false);
  const [showDenomStats, setShowDenomStats] = useState(false);
  const [showLMSKursusBestuur, setShowLMSKursusBestuur] = useState(false);
  const [showVBOBestuur, setShowVBOBestuur] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showRolBestuur, setShowRolBestuur] = useState(false);
  const [showMenuBuilder, setShowMenuBuilder] = useState(false);
  const [showOmsendbriefPortaal, setShowOmsendbriefPortaal] = useState(false);
  const [showOmsendbriefAnalise, setShowOmsendbriefAnalise] = useState(false);
  const [showMusiekAdmin, setShowMusiekAdmin] = useState(false);
  const [showGeloofsonderrigTransaksies, setShowGeloofsonderrigTransaksies] = useState(false);
  const [showGeloofsonderrigLeaderboard, setShowGeloofsonderrigLeaderboard] = useState(false);
  const [refreshTransaksieKey, setRefreshTransaksieKey] = useState(0);
  const [refreshLeaderboardKey, setRefreshLeaderboardKey] = useState(0);

  // Sub-Admin management state
  const [showAddSubAdmin, setShowAddSubAdmin] = useState(false);
  const [addingSubAdmin, setAddingSubAdmin] = useState(false);
  const [subAdmins, setSubAdmins] = useState<SubAdminRow[]>([]);
  const [loadingSubAdmins, setLoadingSubAdmins] = useState(false);
  const [newSubAdmin, setNewSubAdmin] = useState({
    naam: '',
    van: '',
    epos: '',
    selfoon: '',
    wagwoord: '',
    wagwoord_bevestig: '',
    permissions: [] as AdminPermission[]
  });
  const [editingSubAdmin, setEditingSubAdmin] = useState<SubAdminRow | null>(null);
  const [editSubAdminPermissions, setEditSubAdminPermissions] = useState<AdminPermission[]>([]);

  // Moderator management state
  const [showAddModerator, setShowAddModerator] = useState(false);
  const [addingModerator, setAddingModerator] = useState(false);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loadingModerators, setLoadingModerators] = useState(false);
  const [newModerator, setNewModerator] = useState({
    naam: '',
    van: '',
    epos: '',
    selfoon: '',
    wagwoord: '',
    wagwoord_bevestig: ''
  });

  // Edit and Visibility states
  const [editingUser, setEditingUser] = useState<Gebruiker | Moderator | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  // Geloofsonderrig States
  const [showLessonUpload, setShowLessonUpload] = useState(false);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [onderwerpe, setOnderwerpe] = useState<GeloofsonderrigOnderwerp[]>([]);
  const [grades, setGrades] = useState<any[]>([]); // Using any for simplicity in this file, or define Graad interface if mapped
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedOnderwerp, setSelectedOnderwerp] = useState<string>('');
  const [lessonUploadLoading, setLessonUploadLoading] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ titel: '', beskrywing: '', graad_id: '', kurrikulum_id: '', ikoon: 'BookOpen' });
  const lessonFileInputRef = useRef<HTMLInputElement>(null);

  // Manual Lesson Creation State
  const [showManualLessonCreate, setShowManualLessonCreate] = useState(false);
  const [manualLesson, setManualLesson] = useState({
    title: '',
    content: '',
    file: null as File | null
  });
  const [creatingManualLesson, setCreatingManualLesson] = useState(false);
  const manualLessonFileInputRef = useRef<HTMLInputElement>(null);

  // Lesson Management Section State
  const [showLesseBestuur, setShowLesseBestuur] = useState(false);
  const [alleLesse, setAlleLesse] = useState<GeloofsonderrigLes[]>([]);
  const [showEditLes, setShowEditLes] = useState(false);
  const [editingLes, setEditingLes] = useState<GeloofsonderrigLes | null>(null);
  const [lesTitel, setLesTitel] = useState('');
  const [lesInhoud, setLesInhoud] = useState('');
  const [lesSkrifverwysing, setLesSkrifverwysing] = useState('');
  const [lesOnderwerpId, setLesOnderwerpId] = useState('');
  const [lesVideoUrl, setLesVideoUrl] = useState('');

  // Topic Management State
  const [showEditTopic, setShowEditTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<GeloofsonderrigOnderwerp | null>(null);
  const [newGradeName, setNewGradeName] = useState('');
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [addingGrade, setAddingGrade] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);
  const [showCreateKurrikulum, setShowCreateKurrikulum] = useState(false);
  const [kurrikulums, setKurrikulums] = useState<any[]>([]);
  const [newKurrikulumName, setNewKurrikulumName] = useState('');
  const [newKurrikulumDesc, setNewKurrikulumDesc] = useState('');
  const [addingKurrikulum, setAddingKurrikulum] = useState(false);

  useEffect(() => {
    if (showLessonUpload || showCreateTopic || showManualLessonCreate || showLesseBestuur || showCreateKurrikulum) {
      fetchKurrikulums();
      fetchOnderwerpe();
      fetchGrades();
      if (showLesseBestuur) fetchAlleLesse();
    }
  }, [showLessonUpload, showCreateTopic, showManualLessonCreate, showLesseBestuur, showCreateKurrikulum]);


  const fetchKurrikulums = async () => {
    try {
      const { data, error } = await supabase.from('geloofsonderrig_kurrikulums').select('*').eq('aktief', true).order('volgorde');
      setKurrikulums(data || []);
    } catch (error) { console.error('Error fetching kurrikulums:', error); }
  };

  const handleCreateKurrikulum = async () => {
    if (!newKurrikulumName.trim()) return;
    setAddingKurrikulum(true);
    try {
      const { data: maxOrderData } = await supabase.from('geloofsonderrig_kurrikulums')
        .select('volgorde')
        .order('volgorde', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = (maxOrderData?.volgorde || 0) + 1;
      const { data, error } = await supabase.from('geloofsonderrig_kurrikulums').insert({
        titel: newKurrikulumName.trim(),
        beskrywing: newKurrikulumDesc.trim(),
        volgorde: nextOrder,
        aktief: true
      }).select().single();
      if (error) throw error;
      toast.success(`'${newKurrikulumName}' bygevoeg!`);
      await fetchKurrikulums();
      if (showCreateTopic) setNewTopic({ ...newTopic, kurrikulum_id: data.id });
      if (showEditTopic && editingTopic) setEditingTopic({ ...editingTopic, kurrikulum_id: data.id });
      setNewKurrikulumName('');
      setNewKurrikulumDesc('');
      setShowCreateKurrikulum(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAddingKurrikulum(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const { data, error } = await supabase.from('geloofsonderrig_grade').select('*').eq('aktief', true).order('volgorde');

      if (!data || data.length === 0) {
        // Self-heal: Seed Grades if empty
        console.log('Seeding grades...');
        const gradesToInsert = [
          { naam: 'Graad 1', volgorde: 1, aktief: true },
          { naam: 'Graad 2', volgorde: 2, aktief: true },
          { naam: 'Graad 3', volgorde: 3, aktief: true },
          { naam: 'Graad 4', volgorde: 4, aktief: true },
          { naam: 'Graad 5', volgorde: 5, aktief: true },
          { naam: 'Graad 6', volgorde: 6, aktief: true },
          { naam: 'Graad 7', volgorde: 7, aktief: true },
          { naam: 'Graad 8', volgorde: 8, aktief: true },
          { naam: 'Graad 9', volgorde: 9, aktief: true },
          { naam: 'Graad 10', volgorde: 10, aktief: true },
          { naam: 'Graad 11', volgorde: 11, aktief: true },
          { naam: 'Belydenisklas', volgorde: 12, aktief: true }
        ];

        const { error: insertError } = await supabase.from('geloofsonderrig_grade').insert(gradesToInsert);
        if (insertError) {
          console.error('Error seeding grades:', insertError);
        } else {
          // Refetch
          const { data: newData } = await supabase.from('geloofsonderrig_grade').select('*').eq('aktief', true).order('volgorde');
          setGrades(newData || []);
        }
      } else {
        setGrades(data || []);
      }
    } catch (error) { console.error('Error fetching grades:', error); }
  };

  const fetchOnderwerpe = async () => {
    try {
      const { data } = await supabase.from('geloofsonderrig_onderwerpe').select('*').eq('aktief', true).order('volgorde');
      setOnderwerpe(data || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchAlleLesse = async () => {
    try {
      const { data } = await supabase.from('geloofsonderrig_lesse').select('*').order('onderwerp_id').order('volgorde');
      setAlleLesse(data || []);
    } catch (error) { console.error('Error fetching lessons:', error); }
  };

  const openEditLes = (les: GeloofsonderrigLes) => {
    setEditingLes(les);
    setLesTitel(les.titel);
    setLesInhoud(les.inhoud);
    setLesSkrifverwysing(les.skrifverwysing || '');
    setLesVideoUrl(les.video_url || '');
    setLesOnderwerpId(les.onderwerp_id);
    setShowEditLes(true);
  };

  const handleDeleteLes = async (lesId: string, titel: string) => {
    if (!window.confirm(`Is jy seker jy wil die les "${titel}" verwyder?`)) return;
    try {
      // Eerstens verwyder geassosieerde data om foreign key foute te voorkom
      await supabase.from('geloofsonderrig_ai_logs').delete().eq('les_id', lesId);
      await supabase.from('geloofsonderrig_vordering').delete().eq('les_id', lesId);
      await supabase.from('geloofsonderrig_vrae').delete().eq('les_id', lesId);

      const { error } = await supabase.from('geloofsonderrig_lesse').delete().eq('id', lesId);
      if (error) throw error;
      toast.success('Les verwyder');
      fetchAlleLesse();
    } catch (error: any) {
      toast.error('Fout met verwydering: ' + error.message);
    }
  };

  const handleDeleteOnderwerp = async (onderwerpId: string, titel: string) => {
    if (!window.confirm(`Is jy seker jy wil die onderwerp "${titel}" EN AL SY LESSE verwyder? Hierdie aksie kan nie ongedaan gemaak word nie.`)) return;

    try {
      // 1. Kry al die les-id's vir hierdie onderwerp
      const { data: lesse } = await supabase.from('geloofsonderrig_lesse').select('id').eq('onderwerp_id', onderwerpId);
      const lesIds = lesse?.map(l => l.id) || [];

      if (lesIds.length > 0) {
        // 2. Verwyder alle data wat aan die lesse gekoppel is
        await supabase.from('geloofsonderrig_ai_logs').delete().in('les_id', lesIds);
        await supabase.from('geloofsonderrig_vordering').delete().in('les_id', lesIds);
        await supabase.from('geloofsonderrig_vrae').delete().in('les_id', lesIds);

        // 3. Verwyder die lesse self
        await supabase.from('geloofsonderrig_lesse').delete().in('id', lesIds);
      }

      // 4. Verwyder uiteindelik die onderwerp
      const { error } = await supabase.from('geloofsonderrig_onderwerpe').delete().eq('id', onderwerpId);

      if (error) throw error;
      toast.success('Onderwerp en alle lesse verwyder');
      fetchOnderwerpe();
      fetchAlleLesse();
    } catch (error: any) {
      toast.error('Fout met verwydering: ' + error.message);
    }
  };

  const handleSaveLesChanges = async () => {
    if (!editingLes) return;
    if (!lesTitel || !lesOnderwerpId) {
      toast.error('Titel en Onderwerp is verpligtend');
      return;
    }

    setIsUploading(true); // Borrow loading state
    try {
      const { error } = await supabase.from('geloofsonderrig_lesse').update({
        onderwerp_id: lesOnderwerpId,
        titel: lesTitel,
        inhoud: lesInhoud,
        skrifverwysing: lesSkrifverwysing,
        video_url: lesVideoUrl
      }).eq('id', editingLes.id);

      if (error) throw error;
      toast.success('Les opgedateer');
      setShowEditLes(false);
      setEditingLes(null);
      fetchAlleLesse();
    } catch (error: any) {
      toast.error('Kon nie les stoor nie: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopic.titel || !newTopic.graad_id) {
      toast.error('Vul asseblief die titel en graad in.');
      return;
    }
    setCreatingTopic(true);
    try {
      // Get max order
      const { data: maxOrderData } = await supabase.from('geloofsonderrig_onderwerpe')
        .select('volgorde')
        .eq('graad_id', newTopic.graad_id)
        .order('volgorde', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxOrderData?.volgorde || 0) + 1;

      const { error } = await supabase.from('geloofsonderrig_onderwerpe').insert({
        titel: newTopic.titel,
        beskrywing: newTopic.beskrywing,
        graad_id: newTopic.graad_id,
        kurrikulum_id: newTopic.kurrikulum_id || null,
        ikoon: newTopic.ikoon,
        volgorde: nextOrder,
        aktief: true,
        kleur: 'bg-blue-500' // Default color
      });

      if (error) throw error;
      toast.success('Nuwe onderwerp geskep!');
      setNewTopic({ titel: '', beskrywing: '', graad_id: '', ikoon: 'BookOpen' });
      setShowCreateTopic(false);
      fetchOnderwerpe();
    } catch (error: any) {
      toast.error(error.message || 'Kon nie onderwerp skep nie.');
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleCreateGrade = async () => {
    if (!newGradeName.trim()) return;
    setAddingGrade(true);
    try {
      const { data: maxOrderData } = await supabase.from('geloofsonderrig_grade')
        .select('volgorde')
        .order('volgorde', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxOrderData?.volgorde || 0) + 1;

      const { data, error } = await supabase.from('geloofsonderrig_grade').insert({
        naam: newGradeName.trim(),
        volgorde: nextOrder,
        aktief: true
      }).select().single();

      if (error) throw error;

      toast.success(`'${newGradeName}' bygevoeg!`);
      await fetchGrades();

      // Auto-select the new grade if in a topic modal
      if (showCreateTopic) setNewTopic({ ...newTopic, graad_id: data.id });
      if (showEditTopic && editingTopic) setEditingTopic({ ...editingTopic, graad_id: data.id });

      setNewGradeName('');
      setShowAddGrade(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAddingGrade(false);
    }
  };

  const openEditTopic = (onderwerp: GeloofsonderrigOnderwerp) => {
    setEditingTopic({ ...onderwerp });
    setShowEditTopic(true);
  };

  const handleSaveTopicChanges = async () => {
    if (!editingTopic || !editingTopic.titel || !editingTopic.graad_id) {
      toast.error('Titel en Graad is verpligtend.');
      return;
    }
    setSavingTopic(true);
    try {
      const { error } = await supabase.from('geloofsonderrig_onderwerpe')
        .update({
          titel: editingTopic.titel,
          beskrywing: editingTopic.beskrywing,
          graad_id: editingTopic.graad_id,
          kurrikulum_id: editingTopic.kurrikulum_id || null,
          ikoon: editingTopic.ikoon
        })
        .eq('id', editingTopic.id);

      if (error) throw error;
      toast.success('Onderwerp opgedateer!');
      setShowEditTopic(false);
      setEditingTopic(null);
      fetchOnderwerpe();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingTopic(false);
    }
  };

  const handleLessonUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedOnderwerp) return;
    setLessonUploadLoading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        // Clean filename for title
        const title = fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        const fileExt = fileName.split('.').pop() || '';

        // 1. Convert to Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            if (result.includes(',')) {
              resolve(result.split(',')[1]);
            } else {
              resolve(result);
            }
          };
          reader.onerror = error => reject(error);
        });

        // 2. Insert into DB (geloofsonderrig_files)
        const { data: fileRecord, error: uploadError } = await supabase
          .from('geloofsonderrig_files')
          .insert({
            file_name: fileName,
            mime_type: file.type || 'application/octet-stream',
            file_data: base64Data,
            size_bytes: file.size,
            uploaded_by: currentUser?.id
          })
          .select('id')
          .single();

        if (uploadError) throw uploadError;
        if (!fileRecord) throw new Error('Failed to save file to database');

        // 3. Construct Serve URL
        const fileUrl = `/api/serve-file.php?id=${fileRecord.id}`;

        // 4. Create Lesson
        await supabase.from('geloofsonderrig_lesse').insert({
          onderwerp_id: selectedOnderwerp,
          titel: title,
          inhoud: 'File Uploaded',
          skrifverwysing: '',
          volgorde: 99 + i,
          aktief: true,
          file_url: fileUrl,
          file_type: fileExt,
          file_name: fileName
        });
      }
      toast.success(`${files.length} lesse suksesvol opgelaai!`);
      setShowLessonUpload(false);
      setSelectedOnderwerp('');
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast.error(error.message || 'Kon nie lesse oplaai nie');
    } finally {
      setLessonUploadLoading(false);
    }
  };

  const handleCreateManualLesson = async () => {
    if (!manualLesson.title || !manualLesson.content || !selectedOnderwerp) {
      toast.error('Vul asseblief die titel en inhoud in, en kies \'n onderwerp.');
      return;
    }

    setCreatingManualLesson(true);
    let fileUrl = null;
    let fileType = null;
    let fileName = null;

    try {
      // 1. Upload File if present
      if (manualLesson.file) {
        const file = manualLesson.file;
        fileName = file.name;
        fileType = fileName.split('.').pop() || '';

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.includes(',') ? result.split(',')[1] : result);
          };
          reader.onerror = reject;
        });

        const { data: fileRecord, error: uploadError } = await supabase
          .from('geloofsonderrig_files')
          .insert({
            file_name: fileName,
            mime_type: file.type || 'application/octet-stream',
            file_data: base64Data,
            size_bytes: file.size,
            uploaded_by: currentUser?.id
          })
          .select('id')
          .single();

        if (uploadError) throw uploadError;
        if (fileRecord) fileUrl = `/api/serve-file.php?id=${fileRecord.id}`;
      }

      // 2. Insert Lesson
      // Determine Order
      const { count } = await supabase
        .from('geloofsonderrig_lesse')
        .select('*', { count: 'exact', head: true })
        .eq('onderwerp_id', selectedOnderwerp);

      const nextOrder = (count || 0) + 1;

      const { error: insertError } = await supabase.from('geloofsonderrig_lesse').insert({
        onderwerp_id: selectedOnderwerp,
        titel: manualLesson.title,
        inhoud: manualLesson.content, // KEY: Saving the text content for AI
        skrifverwysing: '',
        volgorde: nextOrder,
        aktief: true,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName
      });

      if (insertError) throw insertError;

      toast.success('Les suksesvol geskep!');
      setShowManualLessonCreate(false);
      setManualLesson({ title: '', content: '', file: null });
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      toast.error(error.message || 'Kon nie les skep nie.');
    } finally {
      setCreatingManualLesson(false);
    }
  };


  useEffect(() => {
    if (currentUser) {
      loadModerators();
      loadSubAdmins();
    }
  }, [currentUser]);

  const loadModerators = async () => {
    setLoadingModerators(true);
    try {
      const { data, error } = await supabase
        .from('gebruikers')
        .select('id, naam, van, epos, selfoon, aktief, created_at')
        .eq('rol', 'moderator')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModerators(data || []);
    } catch (error) {
      console.error('Error loading moderators:', error);
    }
    setLoadingModerators(false);
  };

  const loadSubAdmins = async () => {
    setLoadingSubAdmins(true);
    try {
      const { data, error } = await supabase
        .from('gebruikers')
        .select('id, naam, van, epos, selfoon, aktief, admin_permissions, created_at')
        .eq('rol', 'sub_admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubAdmins(data || []);
    } catch (error) {
      console.error('Error loading sub-admins:', error);
    }
    setLoadingSubAdmins(false);
  };

  const handleAddSubAdmin = async () => {
    if (!newSubAdmin.naam || !newSubAdmin.van || !newSubAdmin.epos || !newSubAdmin.wagwoord) {
      toast.error('Vul asb alle verpligte velde in');
      return;
    }
    if (newSubAdmin.wagwoord !== newSubAdmin.wagwoord_bevestig) {
      toast.error('Wagwoorde stem nie ooreen nie');
      return;
    }
    if (newSubAdmin.wagwoord.length < 6) {
      toast.error('Wagwoord moet ten minste 6 karakters wees');
      return;
    }
    if (newSubAdmin.permissions.length === 0) {
      toast.error('Kies ten minste een toestemming');
      return;
    }

    setAddingSubAdmin(true);
    try {
      const { error } = await supabase
        .from('gebruikers')
        .insert([{
          naam: newSubAdmin.naam,
          van: newSubAdmin.van,
          epos: newSubAdmin.epos,
          selfoon: newSubAdmin.selfoon || null,
          wagwoord_hash: btoa(newSubAdmin.wagwoord),
          rol: 'sub_admin',
          admin_permissions: newSubAdmin.permissions,
          aktief: true,
          gemeente_id: null
        }]);

      if (error) throw error;

      toast.success('Sub-Administrateur suksesvol bygevoeg');
      setShowAddSubAdmin(false);
      setNewSubAdmin({
        naam: '', van: '', epos: '', selfoon: '',
        wagwoord: '', wagwoord_bevestig: '',
        permissions: []
      });
      await loadSubAdmins();
    } catch (error: any) {
      console.error('Error adding sub-admin:', error);
      toast.error(error.message || 'Kon nie sub-admin byvoeg nie');
    }
    setAddingSubAdmin(false);
  };

  const handleToggleSubAdminStatus = async (subAdmin: SubAdminRow) => {
    try {
      const { error } = await supabase
        .from('gebruikers')
        .update({ aktief: !subAdmin.aktief })
        .eq('id', subAdmin.id);

      if (error) throw error;
      toast.success(`Sub-Admin ${subAdmin.aktief ? 'gedeaktiveer' : 'geaktiveer'}`);
      await loadSubAdmins();
    } catch (error: any) {
      toast.error(error.message || 'Fout met statusverandering');
    }
  };

  const handleDeleteSubAdmin = async (subAdmin: SubAdminRow) => {
    if (!window.confirm(`Is jy seker jy wil ${subAdmin.naam} ${subAdmin.van} verwyder?`)) return;
    try {
      const { error } = await supabase
        .from('gebruikers')
        .delete()
        .eq('id', subAdmin.id);

      if (error) throw error;
      toast.success('Sub-Admin verwyder');
      await loadSubAdmins();
    } catch (error: any) {
      toast.error(error.message || 'Kon nie verwyder nie');
    }
  };

  const handleSaveSubAdminPermissions = async () => {
    if (!editingSubAdmin) return;
    if (editSubAdminPermissions.length === 0) {
      toast.error('Kies ten minste een toestemming');
      return;
    }
    try {
      const { error } = await supabase
        .from('gebruikers')
        .update({ admin_permissions: editSubAdminPermissions })
        .eq('id', editingSubAdmin.id);

      if (error) throw error;
      toast.success('Toestemmings opgedateer');
      setEditingSubAdmin(null);
      await loadSubAdmins();
    } catch (error: any) {
      toast.error(error.message || 'Kon nie stoor nie');
    }
  };

  // Helper: check if current user has permission for a section
  const hasPerm = (permission: AdminPermission): boolean => {
    return hasAdminPermission(currentUser, permission);
  };

  // Check if current user is the full hoof_admin (not sub_admin)
  const isFullHoofAdmin = currentUser?.rol === 'hoof_admin';

  if (!currentUser) return null;

  const hoofAdmins = getHoofAdmins();

  // Calculate totals across all gemeentes - using toNumber for safe conversion
  const totals = gemeenteStats.reduce((acc, stat) => ({
    lidmate: acc.lidmate + toNumber(stat.totale_lidmate),
    wyke: acc.wyke + toNumber(stat.totale_wyke),
    besoekpunte: acc.besoekpunte + toNumber(stat.totale_besoekpunte),
    krisisse: acc.krisisse + toNumber(stat.oop_krisisse),
    vrae: acc.vrae + toNumber(stat.nuwe_vrae),
    betalings: acc.betalings + toNumber(stat.totale_betalings),
    aksies: acc.aksies + toNumber(stat.aksies_maand)
  }), {
    lidmate: 0,
    wyke: 0,
    besoekpunte: 0,
    krisisse: 0,
    vrae: 0,
    betalings: 0,
    aksies: 0
  });


  const handleAddHoofAdmin = async () => {
    if (!newAdmin.naam || !newAdmin.van || !newAdmin.epos || !newAdmin.wagwoord) {
      toast.error('Vul asb alle verpligte velde in');
      return;
    }

    if (newAdmin.wagwoord !== newAdmin.wagwoord_bevestig) {
      toast.error('Wagwoorde stem nie ooreen nie');
      return;
    }

    if (newAdmin.wagwoord.length < 6) {
      toast.error('Wagwoord moet ten minste 6 karakters wees');
      return;
    }

    setAddingAdmin(true);

    const result = await addHoofAdmin({
      naam: newAdmin.naam,
      van: newAdmin.van,
      epos: newAdmin.epos,
      selfoon: newAdmin.selfoon,
      wagwoord: newAdmin.wagwoord
    });

    setAddingAdmin(false);

    if (result.success) {
      toast.success('Hoof Administrateur suksesvol bygevoeg');
      setShowAddHoofAdmin(false);
      setNewAdmin({
        naam: '',
        van: '',
        epos: '',
        selfoon: '',
        wagwoord: '',
        wagwoord_bevestig: ''
      });
      await refreshAllGemeenteStats();
    } else {
      toast.error(result.error || 'Kon nie admin byvoeg nie');
    }
  };

  const handleAddModerator = async () => {
    if (!newModerator.naam || !newModerator.van || !newModerator.epos || !newModerator.wagwoord) {
      toast.error('Vul asb alle verpligte velde in');
      return;
    }

    if (newModerator.wagwoord !== newModerator.wagwoord_bevestig) {
      toast.error('Wagwoorde stem nie ooreen nie');
      return;
    }

    if (newModerator.wagwoord.length < 6) {
      toast.error('Wagwoord moet ten minste 6 karakters wees');
      return;
    }

    setAddingModerator(true);

    try {
      // Create the moderator - no gemeente_id needed
      const { error } = await supabase
        .from('gebruikers')
        .insert([{
          naam: newModerator.naam,
          van: newModerator.van,
          epos: newModerator.epos,
          selfoon: newModerator.selfoon || null,
          wagwoord_hash: btoa(newModerator.wagwoord),
          rol: 'moderator',
          aktief: true,
          gemeente_id: null
        }]);

      if (error) throw error;

      toast.success('Moderator suksesvol bygevoeg');
      setShowAddModerator(false);
      setNewModerator({
        naam: '',
        van: '',
        epos: '',
        selfoon: '',
        wagwoord: '',
        wagwoord_bevestig: ''
      });
      await loadModerators();
    } catch (error: any) {
      console.error('Error adding moderator:', error);
      toast.error(error.message || 'Kon nie moderator byvoeg nie');
    }

    setAddingModerator(false);
  };

  const handleToggleModeratorStatus = async (moderator: Moderator) => {
    try {
      const { error } = await supabase
        .from('gebruikers')
        .update({ aktief: !moderator.aktief })
        .eq('id', moderator.id);

      if (error) throw error;

      toast.success(`Moderator ${moderator.aktief ? 'gedeaktiveer' : 'geaktiveer'}`);
      await loadModerators();
    } catch (error) {
      console.error('Error toggling moderator status:', error);
      toast.error('Kon nie status verander nie');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editingUser.naam || !editingUser.van || !editingUser.epos) {
      toast.error('Vul asb alle verpligte velde in');
      return;
    }

    setAddingAdmin(true); // Reuse loading state

    try {
      const updates: any = {
        naam: editingUser.naam,
        van: editingUser.van,
        epos: editingUser.epos,
        selfoon: editingUser.selfoon || null,
      };

      // If password is being changed
      if ((editingUser as any).new_password) {
        if ((editingUser as any).new_password !== (editingUser as any).new_password_confirm) {
          toast.error('Wagwoorde stem nie ooreen nie');
          setAddingAdmin(false);
          return;
        }
        if ((editingUser as any).new_password.length < 6) {
          toast.error('Wagwoord moet ten minste 6 karakters wees');
          setAddingAdmin(false);
          return;
        }
        updates.wagwoord_hash = btoa((editingUser as any).new_password);
      }

      const result = await updateGebruiker(editingUser.id, updates);

      toast.success('Gebruiker suksesvol opgedateer');
      setEditingUser(null);
      if ((editingUser as any).rol === 'moderator') {
        await loadModerators();
      } else {
        await refreshAllGemeenteStats();
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Kon nie gebruiker opdateer nie');
    }

    setAddingAdmin(false);
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Is jy seker jy wil ${user.naam} ${user.van} verwyder? Hierdie aksie kan nie ongedaan gemaak word nie.`)) {
      return;
    }

    setDeletingUser(user.id);
    const result = await deleteUser(user.id);
    setDeletingUser(null);

    if (result.success) {
      toast.success('Gebruiker suksesvol verwyder');
      if (user.rol === 'moderator') {
        await loadModerators();
      } else {
        await refreshAllGemeenteStats();
      }
    } else {
      toast.error(result.error || 'Kon nie gebruiker verwyder nie');
    }
  };

  const handleViewGemeente = async (gemeenteId: string) => {
    const gemeente = gemeentes.find(g => g.id === gemeenteId);
    if (gemeente) {
      setCurrentGemeente(gemeente);
      setCurrentView('dashboard');
    }
  };

  // CSV Parsing Function
  const parseCSV = (text: string): CSVLidmaat[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

    const headerMap: Record<string, string> = {
      'name': 'naam',
      'first_name': 'naam',
      'firstname': 'naam',
      'voornaam': 'naam',
      'surname': 'van',
      'last_name': 'van',
      'lastname': 'van',
      'phone': 'selfoon',
      'tel': 'selfoon',
      'telefoon': 'selfoon',
      'cell': 'selfoon',
      'mobile': 'selfoon',
      'email': 'epos',
      'e-mail': 'epos',
      'address': 'adres',
      'street': 'adres',
      'straat_naam': 'straat_naam',
      'dob': 'geboortedatum',
      'birth_date': 'geboortedatum',
      'birthdate': 'geboortedatum',
      'date_of_birth': 'geboortedatum',
      'role': 'rol'
    };

    const normalizedHeaders = headers.map(h => headerMap[h] || h);
    const data: CSVLidmaat[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: any = {};
      normalizedHeaders.forEach((header, index) => {
        if (values[index]) {
          row[header] = values[index].trim().replace(/"/g, '');
        }
      });

      if (row.naam && row.van) {
        const validRoles: UserRole[] = ['lidmaat', 'groepleier', 'ouderling', 'diaken', 'predikant', 'subadmin', 'admin'];
        if (!row.rol || !validRoles.includes(row.rol)) {
          row.rol = 'lidmaat';
        }
        data.push(row as CSVLidmaat);
      }
    }

    return data;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Slegs CSV lêers word ondersteun');
      return;
    }

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        toast.error('Geen geldige data in CSV gevind nie. Maak seker die lêer het "naam" en "van" kolomme.');
        return;
      }

      setCsvData(parsed);
      setCsvPreview(parsed.slice(0, 5));
      setUploadStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedGemeenteId || csvData.length === 0) {
      toast.error('Kies asb \'n gemeente en laai \'n CSV lêer');
      return;
    }

    setIsUploading(true);
    const result: CSVImportResult = { success: 0, failed: 0, errors: [] };

    for (const lidmaat of csvData) {
      try {
        const { error } = await supabase
          .from('gebruikers')
          .insert([{
            naam: lidmaat.naam,
            van: lidmaat.van,
            selfoon: lidmaat.selfoon || null,
            epos: lidmaat.epos || null,
            straat_naam: lidmaat.straat_naam || null,
            adres: lidmaat.adres || null,
            geboortedatum: lidmaat.geboortedatum || null,
            rol: lidmaat.rol || 'lidmaat',
            gemeente_id: selectedGemeenteId,
            aktief: true,
            popia_toestemming: false
          }]);

        if (error) {
          result.failed++;
          result.errors.push(`${lidmaat.naam} ${lidmaat.van}: ${error.message}`);
        } else {
          result.success++;
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`${lidmaat.naam} ${lidmaat.van}: ${err.message}`);
      }
    }

    setIsUploading(false);
    setImportResult(result);
    setUploadStep('result');

    if (result.success > 0) {
      await refreshAllGemeenteStats();
    }

    if (result.failed === 0) {
      toast.success(`${result.success} lidmate suksesvol ingevoer!`);
    } else if (result.success > 0) {
      toast.warning(`${result.success} suksesvol, ${result.failed} misluk`);
    } else {
      toast.error('Alle invoere het misluk');
    }
  };

  const resetCSVUpload = () => {
    setCsvFile(null);
    setCsvData([]);
    setCsvPreview([]);
    setImportResult(null);
    setUploadStep('select');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeCSVModal = () => {
    setShowCSVUpload(false);
    setSelectedGemeenteId('');
    resetCSVUpload();
  };

  const downloadTemplate = () => {
    const template = 'naam,van,selfoon,epos,straat_naam,adres,geboortedatum,rol\nJan,van der Berg,0821234567,jan@email.com,Kerkstraat,"Kerkstraat 1, Pretoria",1985-03-15,lidmaat\nMaria,Botha,0839876543,maria@email.com,Hoofweg,"Hoofweg 23, Centurion",1990-07-22,lidmaat';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lidmate_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#002855] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#D4A84B] flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 md:w-6 md:h-6 text-[#002855]" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold">{isFullHoofAdmin ? 'Hoof Administrateur' : 'Sub-Administrateur'}</h1>
                <p className="text-[#D4A84B] text-sm md:text-base">Welkom, {currentUser.naam} {currentUser.van}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm md:text-base self-start sm:self-auto"
            >
              Teken Uit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8 space-y-6 md:space-y-8">
        {/* Overview Stats */}
        {isFullHoofAdmin && (
          <section>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
              <h2 className="text-lg md:text-xl font-bold text-[#002855]">Totale Oorsig</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4">
              <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
                <Church className="w-4 h-4 md:w-5 md:h-5 text-[#002855] mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[#002855]">{gemeentes.length}</p>
                <p className="text-xs text-gray-500">Gemeentes</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-[#7A8450] mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[#7A8450]">{totals.lidmate}</p>
                <p className="text-xs text-gray-500">Lidmate</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#8B7CB3] mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[#8B7CB3]">{totals.wyke}</p>
                <p className="text-xs text-gray-500">Wyke</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
                <Building2 className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B] mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[#D4A84B]">{totals.besoekpunte}</p>
                <p className="text-xs text-gray-500">Besoekpunte</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-[#9E2A2B] mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[#9E2A2B]">{totals.krisisse}</p>
                <p className="text-xs text-gray-500">Oop Krisisse</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-[#7A8450] mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[#7A8450]">{totals.aksies}</p>
                <p className="text-xs text-gray-500">Aksies (Maand)</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
                <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B] mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[#D4A84B]">R{totals.betalings.toFixed(0)}</p>
                <p className="text-xs text-gray-500">Bydraes</p>
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
            <h2 className="text-lg md:text-xl font-bold text-[#002855]">Vinnige Aksies</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {hasPerm('geloofsonderrig') && (<div className="flex flex-col gap-2">
              <button
                onClick={() => setShowLessonUpload(true)}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-400 transition-all group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                  <Upload className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[#002855] text-sm md:text-base">Laai Les Op</h3>
                  <p className="text-xs md:text-sm text-gray-500">Kies graad & onderwerp</p>
                </div>
              </button>
              <button
                onClick={() => setShowManualLessonCreate(true)}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#002855] transition-all group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#002855]/10 flex items-center justify-center group-hover:bg-[#002855]/20 transition-colors flex-shrink-0">
                  <Edit className="w-5 h-5 md:w-6 md:h-6 text-[#002855]" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[#002855] text-sm md:text-base">Skep Les</h3>
                  <p className="text-xs md:text-sm text-gray-500">Tik leriaar inhoud</p>
                </div>
              </button>
              <button
                onClick={() => setShowLesseBestuur(!showLesseBestuur)}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-400 transition-all group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors flex-shrink-0">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[#002855] text-sm md:text-base">Bestuur Lesse</h3>
                  <p className="text-xs md:text-sm text-gray-500">Kyk, wysig of verwyder</p>
                </div>
              </button>
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => setShowCreateTopic(true)}
                  className="text-xs text-blue-600 hover:underline text-center"
                >
                  + Skep Onderwerp
                </button>
                <button
                  onClick={() => setShowCreateKurrikulum(true)}
                  className="text-xs text-blue-600 hover:underline text-center"
                >
                  + Skep Kurrikulum
                </button>
              </div>
            </div>)}

            {hasPerm('hoof_admin_bestuur') && (<button
              onClick={() => setShowAddHoofAdmin(true)}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#D4A84B] transition-all group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#D4A84B]/10 flex items-center justify-center group-hover:bg-[#D4A84B]/20 transition-colors flex-shrink-0">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-[#D4A84B]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[#002855] text-sm md:text-base">Voeg Hoof Admin By</h3>
                <p className="text-xs md:text-sm text-gray-500">Nuwe hoof administrateur</p>
              </div>
            </button>)}

            {hasPerm('moderator_bestuur') && (<button
              onClick={() => setShowAddModerator(true)}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8B7CB3] transition-all group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#8B7CB3]/10 flex items-center justify-center group-hover:bg-[#8B7CB3]/20 transition-colors flex-shrink-0">
                <UserCog className="w-5 h-5 md:w-6 md:h-6 text-[#8B7CB3]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[#002855] text-sm md:text-base">Voeg Moderator By</h3>
                <p className="text-xs md:text-sm text-gray-500">VBO kursus moderator</p>
              </div>
            </button>)}

            {hasPerm('csv_upload') && (<button
              onClick={() => setShowCSVUpload(true)}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#7A8450] transition-all group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#7A8450]/10 flex items-center justify-center group-hover:bg-[#7A8450]/20 transition-colors flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 md:w-6 md:h-6 text-[#7A8450]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[#002855] text-sm md:text-base">Laai Lidmate CSV</h3>
                <p className="text-xs md:text-sm text-gray-500">Voer lidmate in massa in</p>
              </div>
            </button>)}

            {hasPerm('data_export') && (<button
              onClick={() => setShowDataExport(!showDataExport)}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#002855] transition-all group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#002855]/10 flex items-center justify-center group-hover:bg-[#002855]/20 transition-colors flex-shrink-0">
                <FileDown className="w-5 h-5 md:w-6 md:h-6 text-[#002855]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[#002855] text-sm md:text-base">Data Uitvoer</h3>
                <p className="text-xs md:text-sm text-gray-500">Verslae & CSV uitvoer</p>
              </div>
            </button>)}

            {hasPerm('csv_upload') && (<button
              onClick={downloadTemplate}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors flex-shrink-0">
                <Download className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[#002855] text-sm md:text-base">CSV Sjabloon</h3>
                <p className="text-xs md:text-sm text-gray-500">Laai formaat af</p>
              </div>
            </button>)}

            {hasPerm('menu_builder') && (<button
              onClick={() => setShowMenuBuilder(!showMenuBuilder)}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors flex-shrink-0">
                <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[#002855] text-sm md:text-base">Menu Bestuur</h3>
                <p className="text-xs md:text-sm text-gray-500">Pas navigasie aan</p>
              </div>
            </button>)}

            {hasPerm('omsendbrief_portaal') && (<button
              onClick={() => setShowOmsendbriefPortaal(!showOmsendbriefPortaal)}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-400 transition-all group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors flex-shrink-0">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[#002855] text-sm md:text-base">Omsendbrief Portaal</h3>
                <p className="text-xs md:text-sm text-gray-500">Laai dokumente op vir Kletsbot</p>
              </div>
            </button>)}

            {hasPerm('omsendbrief_analise') && (<button
              onClick={() => setShowOmsendbriefAnalise(!showOmsendbriefAnalise)}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors flex-shrink-0">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[#002855] text-sm md:text-base">Omsendbrief Analise</h3>
                <p className="text-xs md:text-sm text-gray-500">Kletsbot vrae-analise</p>
              </div>
            </button>)}

            {hasPerm('musiek_admin') && (<button
              onClick={() => setShowMusiekAdmin(!showMusiekAdmin)}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-400 transition-all group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors flex-shrink-0">
                <Music className="w-5 h-5 md:w-6 md:h-6 text-pink-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[#002855] text-sm md:text-base">Musiek Bestuur</h3>
                <p className="text-xs md:text-sm text-gray-500">AI musiekgenerasie van liedere</p>
              </div>
            </button>)}

            {/* Sub-Admin bestuur - slegs volle hoof_admin */}
            {isFullHoofAdmin && (
              <button
                onClick={() => setShowAddSubAdmin(true)}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors flex-shrink-0">
                  <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[#002855] text-sm md:text-base">Skep Sub-Admin</h3>
                  <p className="text-xs md:text-sm text-gray-500">Beperkte admin toegang</p>
                </div>
              </button>
            )}
          </div>
        </section>

        {/* Geloofsonderrig Lesse Bestuur Section */}
        {hasPerm('geloofsonderrig') && showLesseBestuur && (
          <section className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#002855]">Geloofsonderrig Lesse Bestuur</h2>
                  <p className="text-sm text-gray-500">Bestuur die kurrikulum per graad en onderwerp</p>
                </div>
              </div>
              <button
                onClick={() => setShowLesseBestuur(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {grades.map(grade => (
                <div key={grade.id} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-1.5 bg-[#D4A84B] rounded-full"></span>
                    <h3 className="text-lg font-bold text-[#002855]">{grade.naam}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {onderwerpe.filter(o => o.graad_id === grade.id).map(onderwerp => (
                      <div key={onderwerp.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-white p-3 border-b border-gray-200 flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[#002855] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            {onderwerp.titel}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                              {alleLesse.filter(l => l.onderwerp_id === onderwerp.id).length} lesse
                            </span>
                            <button
                              onClick={() => openEditTopic(onderwerp)}
                              className="p-1 text-blue-300 hover:text-blue-600 transition-colors"
                              title="Wysig Onderwerp"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOnderwerp(onderwerp.id, onderwerp.titel)}
                              className="p-1 text-red-300 hover:text-red-600 transition-colors"
                              title="Verwyder Onderwerp"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          {alleLesse.filter(l => l.onderwerp_id === onderwerp.id).map(les => (
                            <div key={les.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-gray-100 group hover:border-blue-300 transition-colors">
                              <span className="text-xs text-gray-700 truncate flex items-center gap-2">
                                <FileText className="w-3 h-3 text-gray-400" />
                                {les.titel}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditLes(les)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Wysig"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLes(les.id, les.titel)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Verwyder"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {alleLesse.filter(l => l.onderwerp_id === onderwerp.id).length === 0 && (
                            <p className="text-[10px] text-gray-400 italic py-2 text-center">Geen lesse nie</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Algemeen onderwerpe (onderwerpe sonder graad_id) */}
                    {grade.naam === 'Belydenisklas' && onderwerpe.filter(o => !o.graad_id).map(onderwerp => (
                      <div key={onderwerp.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-white p-3 border-b border-gray-200 flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[#002855] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            {onderwerp.titel}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                              {alleLesse.filter(l => l.onderwerp_id === onderwerp.id).length} lesse
                            </span>
                            <button
                              onClick={() => handleDeleteOnderwerp(onderwerp.id, onderwerp.titel)}
                              className="p-1 text-red-300 hover:text-red-600 transition-colors"
                              title="Verwyder Onderwerp"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          {alleLesse.filter(l => l.onderwerp_id === onderwerp.id).map(les => (
                            <div key={les.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-gray-100 group hover:border-blue-300 transition-colors">
                              <span className="text-xs text-gray-700 truncate flex items-center gap-2">
                                <FileText className="w-3 h-3 text-gray-400" />
                                {les.titel}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditLes(les)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteLes(les.id, les.titel)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {onderwerpe.filter(o => o.graad_id === grade.id).length === 0 && grade.naam !== 'Belydenisklas' && (
                      <div className="col-span-full py-4 text-center border-2 border-dashed border-gray-100 rounded-xl">
                        <p className="text-xs text-gray-400">Geen onderwerpe vir hierdie graad nie.</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Menu Builder Section */}
        {hasPerm('menu_builder') && showMenuBuilder && (
          <section className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-xl font-bold text-[#002855]">Dinamiese Menu Bestuurder</h2>
              <button onClick={() => setShowMenuBuilder(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <MenuBuilder />
          </section>
        )}

        {/* Omsendbrief Portaal Section */}
        {hasPerm('omsendbrief_portaal') && showOmsendbriefPortaal && (
          <section className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-xl font-bold text-[#002855]">Omsendbrief Portaal</h2>
              <button onClick={() => setShowOmsendbriefPortaal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <OmsendbriefPortaal />
          </section>
        )}

        {/* Omsendbrief Analise Section */}
        {hasPerm('omsendbrief_analise') && showOmsendbriefAnalise && (
          <section className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-xl font-bold text-[#002855]">Omsendbrief Kletsbot Analise</h2>
              <button onClick={() => setShowOmsendbriefAnalise(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <OmsendbriefAnalise />
          </section>
        )}

        {/* Musiek Admin Section */}
        {hasPerm('musiek_admin') && showMusiekAdmin && (
          <section className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-xl font-bold text-[#002855]">Musiek Bestuur</h2>
              <button onClick={() => setShowMusiekAdmin(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <MusiekAdmin />
          </section>
        )}

        {/* Data Export Section */}
        {hasPerm('data_export') && showDataExport && (
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 md:w-5 md:h-5 text-[#002855]" />
                <h2 className="text-lg md:text-xl font-bold text-[#002855]">Data Uitvoer & Verslae</h2>
              </div>
              <button
                onClick={() => setShowDataExport(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DataExport />
          </section>
        )}

        {/* Moderators Section */}
        {hasPerm('moderator_bestuur') && (
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <UserCog className="w-4 h-4 md:w-5 md:h-5 text-[#8B7CB3]" />
                <h2 className="text-lg md:text-xl font-bold text-[#002855]">VBO Moderators</h2>
              </div>
              <button
                onClick={() => setShowAddModerator(true)}
                className="px-3 md:px-4 py-2 text-xs md:text-sm bg-[#8B7CB3] text-white font-semibold rounded-lg hover:bg-[#7a6ba3] transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Voeg By</span>
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Naam</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">E-pos</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Selfoon</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loadingModerators ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <Loader2 className="w-6 h-6 text-[#8B7CB3] animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : moderators.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                          Geen moderators gevind nie
                        </td>
                      </tr>
                    ) : (
                      moderators.map(moderator => (
                        <tr key={moderator.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 md:px-4 py-3">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#8B7CB3] flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {moderator.naam[0]}{moderator.van[0]}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{moderator.naam} {moderator.van}</p>
                                <span className="text-xs text-[#8B7CB3] font-medium sm:hidden">{moderator.epos}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{moderator.epos || '-'}</td>
                          <td className="px-3 md:px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{moderator.selfoon || '-'}</td>
                          <td className="px-3 md:px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${moderator.aktief ? 'bg-[#7A8450]/10 text-[#7A8450]' : 'bg-gray-100 text-gray-500'
                              }`}>
                              {moderator.aktief ? 'Aktief' : 'Onaktief'}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleModeratorStatus(moderator)}
                                className={`px-2 md:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${moderator.aktief
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                              >
                                {moderator.aktief ? 'Deaktiveer' : 'Aktiveer'}
                              </button>
                              <button
                                onClick={() => setEditingUser(moderator)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Wysig"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser({ ...moderator, rol: 'moderator' })}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Verwyder"
                                disabled={deletingUser === moderator.id}
                              >
                                {deletingUser === moderator.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* VBO Bestuur Section */}
        {hasPerm('vbo_bestuur') && (
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
                <h2 className="text-lg md:text-xl font-bold text-[#002855]">VBO Bestuur (Indienings &amp; Aktiwiteite)</h2>
              </div>
              <button
                onClick={() => setShowVBOBestuur(!showVBOBestuur)}
                className="px-3 md:px-4 py-2 text-xs md:text-sm bg-[#D4A84B] text-[#002855] font-semibold rounded-lg hover:bg-[#c49a3d] transition-colors"
              >
                {showVBOBestuur ? 'Verberg' : 'Bestuur'}
              </button>
            </div>

            {showVBOBestuur && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
                <VBOBestuur />
              </div>
            )}
          </section>
        )}

        {/* KIOG Geloofsonderrig Transaksielog Section */}
        {hasPerm('geloofsonderrig_transaksies') && (
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
                <h2 className="text-lg md:text-xl font-bold text-[#002855]">KI-Kats Transaksielog</h2>
              </div>
              <div className="flex gap-2">
                {showGeloofsonderrigTransaksies && (
                  <button
                    onClick={() => setRefreshTransaksieKey(k => k + 1)}
                    className="px-3 md:px-4 py-2 text-xs md:text-sm bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                    title="Herlaai data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Herlaai
                  </button>
                )}
                <button
                  onClick={() => setShowGeloofsonderrigTransaksies(!showGeloofsonderrigTransaksies)}
                  className="px-3 md:px-4 py-2 text-xs md:text-sm bg-amber-100 text-amber-800 font-semibold rounded-lg hover:bg-amber-200 transition-colors"
                >
                  {showGeloofsonderrigTransaksies ? 'Verberg' : 'Wys'}
                </button>
              </div>
            </div>

            {showGeloofsonderrigTransaksies && (
              <GeloofsonderrigTransaksieLog key={refreshTransaksieKey} />
            )}
          </section>
        )}

        {/* KIOG Geloofsonderrig Leaderboard */}
        {hasPerm('geloofsonderrig_leaderboard') && (
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
                <h2 className="text-lg md:text-xl font-bold text-[#002855]">KI-Kats Ranglys (met name)</h2>
              </div>
              <div className="flex gap-2">
                {showGeloofsonderrigLeaderboard && (
                  <button
                    onClick={() => setRefreshLeaderboardKey(k => k + 1)}
                    className="px-3 md:px-4 py-2 text-xs md:text-sm bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                    title="Herlaai data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Herlaai
                  </button>
                )}
                <button
                  onClick={() => setShowGeloofsonderrigLeaderboard(!showGeloofsonderrigLeaderboard)}
                  className="px-3 md:px-4 py-2 text-xs md:text-sm bg-amber-100 text-amber-800 font-semibold rounded-lg hover:bg-amber-200 transition-colors"
                >
                  {showGeloofsonderrigLeaderboard ? 'Verberg' : 'Wys'}
                </button>
              </div>
            </div>

            {showGeloofsonderrigLeaderboard && (
              <GeloofsonderrigLeaderboardAdmin key={refreshLeaderboardKey} />
            )}
          </section>
        )}

        {/* LMS Kursus Bestuur Section */}
        {hasPerm('lms_stats') && (
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
                <h2 className="text-lg md:text-xl font-bold text-[#002855]">LMS Kursus Bestuur</h2>
              </div>
              <button
                onClick={() => setShowLMSKursusBestuur(!showLMSKursusBestuur)}
                className="px-3 md:px-4 py-2 text-xs md:text-sm bg-[#002855] text-white rounded-lg hover:bg-[#001a3d] transition-colors"
              >
                {showLMSKursusBestuur ? 'Verberg' : 'Bestuur'}
              </button>
            </div>

            {showLMSKursusBestuur && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
                <LMSKursusBestuur />
              </div>
            )}
          </section>
        )}

        {/* LMS Statistieke Section */}
        {hasPerm('lms_stats') && (
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
                <h2 className="text-lg md:text-xl font-bold text-[#002855]">LMS Statistieke</h2>
              </div>
              <button
                onClick={() => setShowLMSStats(!showLMSStats)}
                className="px-3 md:px-4 py-2 text-xs md:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showLMSStats ? 'Verberg' : 'Wys'}
              </button>
            </div>

            {showLMSStats && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
                <LMSStatistieke />
              </div>
            )}
          </section>
        )}

        {/* Denominasie Lidmaattellings Section */}
        {hasPerm('denom_stats') && (
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
                <h2 className="text-lg md:text-xl font-bold text-[#002855]">Algehele Lidmaattellings</h2>
              </div>
              <button
                onClick={() => setShowDenomStats(!showDenomStats)}
                className="px-3 md:px-4 py-2 text-xs md:text-sm bg-[#D4A84B]/10 text-[#002855] font-bold rounded-lg hover:bg-[#D4A84B]/20 transition-colors"
              >
                {showDenomStats ? 'Verberg' : 'Wys Denominasie Statistiek'}
              </button>
            </div>

            {showDenomStats && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
                <DenominationStats />
              </div>
            )}
          </section>
        )}

        {/* Hoof Admins Section */}
        {hasPerm('hoof_admin_bestuur') && (
          <section>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
              <h2 className="text-lg md:text-xl font-bold text-[#002855]">Hoof Administrateurs</h2>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Naam</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">E-pos</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Selfoon</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {hoofAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                          Geen hoof administrateurs gevind nie
                        </td>
                      </tr>
                    ) : (
                      hoofAdmins.map(admin => (
                        <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 md:px-4 py-3">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#D4A84B] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {admin.profile_pic_url ? (
                                  <img src={admin.profile_pic_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[#002855] text-xs font-bold">
                                    {admin.naam[0]}{admin.van[0]}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{admin.naam} {admin.van}</p>
                                <span className="text-xs text-[#D4A84B] font-medium sm:hidden">{admin.epos}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{admin.epos || '-'}</td>
                          <td className="px-3 md:px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{admin.selfoon || '-'}</td>
                          <td className="px-3 md:px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${admin.aktief ? 'bg-[#7A8450]/10 text-[#7A8450]' : 'bg-gray-100 text-gray-500'
                              }`}>
                              {admin.aktief ? 'Aktief' : 'Onaktief'}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingUser(admin)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Wysig"
                                disabled={admin.id === currentUser.id}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(admin)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Verwyder"
                                disabled={admin.id === currentUser.id || deletingUser === admin.id}
                              >
                                {deletingUser === admin.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Gemeentes Grid */}
        {hasPerm('gemeente_bestuur') && (
          <section>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Church className="w-4 h-4 md:w-5 md:h-5 text-[#D4A84B]" />
              <h2 className="text-lg md:text-xl font-bold text-[#002855]">Alle Gemeentes</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#D4A84B] animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {gemeenteStats.map(stat => {
                  const gemeente = gemeentes.find(g => g.id === stat.gemeente_id);
                  return (
                    <div key={stat.gemeente_id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-3 md:p-4 border-b border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {stat.logo_url ? (
                              <img src={stat.logo_url} alt={stat.gemeente_naam} className="w-full h-full object-cover" />
                            ) : (
                              <Church className="w-5 h-5 md:w-6 md:h-6 text-[#002855]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[#002855] truncate text-sm md:text-base">{stat.gemeente_naam}</h3>
                            {gemeente?.is_demo && (
                              <span className="px-2 py-0.5 bg-[#D4A84B]/20 text-[#D4A84B] text-xs font-medium rounded-full">
                                Demo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 md:p-4 grid grid-cols-2 gap-2 md:gap-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-600">{stat.totale_lidmate} lidmate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-600">{stat.totale_wyke} wyke</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#9E2A2B] flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-600">{stat.oop_krisisse} krisisse</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-[#8B7CB3] flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-600">{stat.nuwe_vrae} vrae</span>
                        </div>
                      </div>

                      <div className="p-3 md:p-4 pt-0">
                        <button
                          onClick={() => handleViewGemeente(stat.gemeente_id)}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001a3d] transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Bekyk Gemeente
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Add Hoof Admin Modal */}
      {showAddHoofAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4A84B] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#002855]" />
                </div>
                <h2 className="text-lg font-bold text-[#002855]">Nuwe Hoof Admin</h2>
              </div>
              <button onClick={() => setShowAddHoofAdmin(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                  <input
                    type="text"
                    value={newAdmin.naam}
                    onChange={(e) => setNewAdmin({ ...newAdmin, naam: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Van *</label>
                  <input
                    type="text"
                    value={newAdmin.van}
                    onChange={(e) => setNewAdmin({ ...newAdmin, van: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-pos / Gebruikersnaam *</label>
                <input
                  type="email"
                  value={newAdmin.epos}
                  onChange={(e) => setNewAdmin({ ...newAdmin, epos: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selfoon</label>
                <input
                  type="tel"
                  value={newAdmin.selfoon}
                  onChange={(e) => setNewAdmin({ ...newAdmin, selfoon: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wagwoord *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newAdmin.wagwoord}
                    onChange={(e) => setNewAdmin({ ...newAdmin, wagwoord: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-40" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bevestig Wagwoord *</label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    value={newAdmin.wagwoord_bevestig}
                    onChange={(e) => setNewAdmin({ ...newAdmin, wagwoord_bevestig: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordConfirm ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-40" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddHoofAdmin(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm"
              >
                Kanselleer
              </button>
              <button
                onClick={handleAddHoofAdmin}
                disabled={addingAdmin}
                className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {addingAdmin ? <><Loader2 className="w-4 h-4 animate-spin" />Besig...</> : 'Voeg By'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Moderator Modal */}
      {showAddModerator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8B7CB3] flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#002855]">Nuwe VBO Moderator</h2>
              </div>
              <button onClick={() => setShowAddModerator(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-[#8B7CB3]/10 rounded-lg p-3">
                <p className="text-sm text-[#8B7CB3]">
                  <strong>Let wel:</strong> Moderators kan VBO kursusse skep en krediet indienings bestuur.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                  <input
                    type="text"
                    value={newModerator.naam}
                    onChange={(e) => setNewModerator({ ...newModerator, naam: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#8B7CB3] focus:ring-2 focus:ring-[#8B7CB3]/20 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Van *</label>
                  <input
                    type="text"
                    value={newModerator.van}
                    onChange={(e) => setNewModerator({ ...newModerator, van: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#8B7CB3] focus:ring-2 focus:ring-[#8B7CB3]/20 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-pos / Gebruikersnaam *</label>
                <input
                  type="email"
                  value={newModerator.epos}
                  onChange={(e) => setNewModerator({ ...newModerator, epos: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#8B7CB3] focus:ring-2 focus:ring-[#8B7CB3]/20 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selfoon</label>
                <input
                  type="tel"
                  value={newModerator.selfoon}
                  onChange={(e) => setNewModerator({ ...newModerator, selfoon: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#8B7CB3] focus:ring-2 focus:ring-[#8B7CB3]/20 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wagwoord *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newModerator.wagwoord}
                    onChange={(e) => setNewModerator({ ...newModerator, wagwoord: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#8B7CB3] focus:ring-2 focus:ring-[#8B7CB3]/20 outline-none text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-40" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bevestig Wagwoord *</label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    value={newModerator.wagwoord_bevestig}
                    onChange={(e) => setNewModerator({ ...newModerator, wagwoord_bevestig: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#8B7CB3] focus:ring-2 focus:ring-[#8B7CB3]/20 outline-none text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordConfirm ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-40" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddModerator(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm"
              >
                Kanselleer
              </button>
              <button
                onClick={handleAddModerator}
                disabled={addingModerator}
                className="flex-1 py-2 px-4 rounded-xl bg-[#8B7CB3] text-white font-semibold hover:bg-[#7a6ba3] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {addingModerator ? <><Loader2 className="w-4 h-4 animate-spin" />Besig...</> : 'Voeg By'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#7A8450] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#002855]">Laai Lidmate CSV</h2>
                  <p className="text-sm text-gray-500">Voer lidmate in massa in</p>
                </div>
              </div>
              <button onClick={closeCSVModal} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {uploadStep === 'select' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kies Gemeente *</label>
                    <select
                      value={selectedGemeenteId}
                      onChange={(e) => setSelectedGemeenteId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none text-sm"
                    >
                      <option value="">-- Kies 'n gemeente --</option>
                      {gemeentes.map(g => (
                        <option key={g.id} value={g.id}>{g.naam}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CSV Lêer *</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-6 md:p-8 text-center cursor-pointer hover:border-[#7A8450] hover:bg-[#7A8450]/5 transition-all"
                    >
                      <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium text-sm md:text-base">{csvFile ? csvFile.name : 'Klik om CSV lêer te kies'}</p>
                      <p className="text-xs md:text-sm text-gray-400 mt-1">of sleep en los hier</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800 mb-1 text-sm">CSV Formaat</h4>
                        <ul className="text-xs md:text-sm text-blue-700 space-y-1">
                          <li>Verplig: <strong>naam</strong>, <strong>van</strong></li>
                          <li>Opsioneel: selfoon, epos, straat_naam, adres, geboortedatum, rol</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {uploadStep === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[#002855]">Voorskou van Data</h3>
                      <p className="text-sm text-gray-500">{csvData.length} lidmate gevind</p>
                    </div>
                    <button onClick={resetCSVUpload} className="text-sm text-gray-500 hover:text-gray-700">Kies ander lêer</button>
                  </div>

                  <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Naam</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Van</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 hidden sm:table-cell">Selfoon</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Rol</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {csvPreview.map((row, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2">{row.naam}</td>
                              <td className="px-3 py-2">{row.van}</td>
                              <td className="px-3 py-2 hidden sm:table-cell">{row.selfoon || '-'}</td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 bg-[#7A8450]/10 text-[#7A8450] text-xs font-medium rounded-full">
                                  {row.rol || 'lidmaat'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvData.length > 5 && (
                      <div className="px-3 py-2 bg-gray-100 text-center text-sm text-gray-500">
                        ... en {csvData.length - 5} meer
                      </div>
                    )}
                  </div>
                </div>
              )}

              {uploadStep === 'result' && importResult && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-xl text-center ${importResult.failed === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
                    {importResult.failed === 0 ? (
                      <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-green-500 mx-auto mb-3" />
                    ) : (
                      <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-amber-500 mx-auto mb-3" />
                    )}
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                      {importResult.failed === 0 ? 'Invoer Suksesvol!' : 'Invoer Voltooi'}
                    </h3>
                    <div className="flex justify-center gap-8 mt-4">
                      <div>
                        <p className="text-2xl md:text-3xl font-bold text-green-600">{importResult.success}</p>
                        <p className="text-sm text-gray-500">Suksesvol</p>
                      </div>
                      {importResult.failed > 0 && (
                        <div>
                          <p className="text-2xl md:text-3xl font-bold text-red-600">{importResult.failed}</p>
                          <p className="text-sm text-gray-500">Misluk</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-100">
              {uploadStep === 'select' && (
                <>
                  <button onClick={closeCSVModal} className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm">
                    Kanselleer
                  </button>
                  <button disabled={!selectedGemeenteId || !csvFile} className="flex-1 py-2 px-4 rounded-xl bg-gray-200 text-gray-400 font-semibold cursor-not-allowed text-sm">
                    Volgende
                  </button>
                </>
              )}

              {uploadStep === 'preview' && (
                <>
                  <button onClick={resetCSVUpload} className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm">
                    Terug
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isUploading}
                    className="flex-1 py-2 px-4 rounded-xl bg-[#7A8450] text-white font-semibold hover:bg-[#6a7446] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Besig...</> : <>Voer {csvData.length} Lidmate In</>}
                  </button>
                </>
              )}

              {uploadStep === 'result' && (
                <button onClick={closeCSVModal} className="w-full py-2 px-4 rounded-xl bg-[#002855] text-white font-semibold hover:bg-[#001a3d] text-sm">
                  Sluit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lesson Upload Modal */}
      {showLessonUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#002855] flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Geloofsonderrig Les Oplaai
              </h2>
              <button onClick={() => setShowLessonUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kies Onderwerp</label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={selectedOnderwerp}
                  onChange={(e) => setSelectedOnderwerp(e.target.value)}
                >
                  <option value="">-- Kies 'n onderwerp --</option>
                  {onderwerpe.map(o => (
                    <option key={o.id} value={o.id}>{o.titel}</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => lessonFileInputRef.current?.click()}>
                <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">Klik om lêers te kies</p>
                <p className="text-xs text-gray-500 mt-1">PDF, Word, Teks</p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={lessonFileInputRef}
                  onChange={(e) => handleLessonUpload(e.target.files)}
                  accept=".pdf,.doc,.docx,.txt"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLessonUpload(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                disabled={lessonUploadLoading}
              >
                Kanselleer
              </button>
              {lessonUploadLoading && (
                <div className="flex items-center px-4 py-2 text-blue-600 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Besig om op te laai...
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Create Kurrikulum Modal */}
      {showCreateKurrikulum && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#002855]">Skep Nuwe Kurrikulum</h2>
              <button onClick={() => setShowCreateKurrikulum(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Voeg 'n nuwe kurrikulum by om lesse te groepeer (bv. "Met Hart en Hand" of "Lewende Geloof").
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-[#D4A84B] focus:ring-1 focus:ring-[#D4A84B] outline-none"
                  value={newKurrikulumName}
                  onChange={(e) => setNewKurrikulumName(e.target.value)}
                  placeholder="Bv. Lewende Geloof"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing (Opsioneel)</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-[#D4A84B] focus:ring-1 focus:ring-[#D4A84B] outline-none"
                  value={newKurrikulumDesc}
                  onChange={(e) => setNewKurrikulumDesc(e.target.value)}
                  placeholder="Kort beskrywing van hierdie kurrikulum"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateKurrikulum(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Kanselleer
              </button>
              <button
                onClick={handleCreateKurrikulum}
                disabled={addingKurrikulum || !newKurrikulumName.trim()}
                className="px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001a3d] disabled:opacity-50 flex items-center transition-colors"
              >
                {addingKurrikulum ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Stoor...</> : 'Stoor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Topic Modal */}
      {showCreateTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#002855]">Skep Nuwe Onderwerp</h2>
              <button onClick={() => setShowCreateTopic(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center">
                  <span>Graad / Kategorie *</span>
                  <button onClick={() => setShowAddGrade(true)} className="text-[10px] text-blue-600 hover:underline">+ Nuwe Groep</button>
                </label>
                {showAddGrade ? (
                  <div className="flex gap-2 mb-2 animate-in fade-in slide-in-from-top-1">
                    <input
                      type="text"
                      className="flex-1 rounded-md border border-gray-300 p-2 text-sm"
                      value={newGradeName}
                      onChange={(e) => setNewGradeName(e.target.value)}
                      placeholder="bv. Volwassenes"
                      autoFocus
                    />
                    <button onClick={handleCreateGrade} disabled={addingGrade} className="px-3 bg-green-600 text-white rounded-lg text-xs">
                      {addingGrade ? '...' : 'Voeg'}
                    </button>
                    <button onClick={() => setShowAddGrade(false)} className="px-2 text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={newTopic.graad_id}
                    onChange={(e) => setNewTopic({ ...newTopic, graad_id: e.target.value })}
                  >
                    <option value="">-- Kies Graad / Groep --</option>
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.naam}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Onderwerp Titel *</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={newTopic.titel}
                  onChange={(e) => setNewTopic({ ...newTopic, titel: e.target.value })}
                  placeholder="bv. God die Vader"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={newTopic.beskrywing}
                  onChange={(e) => setNewTopic({ ...newTopic, beskrywing: e.target.value })}
                  placeholder="Kort beskrywing..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreateTopic(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Kanselleer</button>
              <button
                onClick={handleCreateTopic}
                disabled={creatingTopic || !newTopic.titel || !newTopic.graad_id}
                className="px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001a3d] disabled:opacity-50"
              >
                {creatingTopic ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Skep...</> : 'Skep Onderwerp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Topic Modal */}
      {showEditTopic && editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#002855]">Wysig Onderwerp</h2>
              <button onClick={() => setShowEditTopic(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center">
                  <span>Graad / Kategorie *</span>
                  <button onClick={() => setShowAddGrade(true)} className="text-[10px] text-blue-600 hover:underline">+ Nuwe Groep</button>
                </label>
                {showAddGrade ? (
                  <div className="flex gap-2 mb-2 animate-in fade-in slide-in-from-top-1">
                    <input
                      type="text"
                      className="flex-1 rounded-md border border-gray-300 p-2 text-sm"
                      value={newGradeName}
                      onChange={(e) => setNewGradeName(e.target.value)}
                      placeholder="bv. Volwassenes"
                      autoFocus
                    />
                    <button onClick={handleCreateGrade} disabled={addingGrade} className="px-3 bg-green-600 text-white rounded-lg text-xs">
                      {addingGrade ? '...' : 'Voeg'}
                    </button>
                    <button onClick={() => setShowAddGrade(false)} className="px-2 text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={editingTopic.graad_id || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, graad_id: e.target.value })}
                  >
                    <option value="">-- Kies Graad / Groep --</option>
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.naam}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Onderwerp Titel *</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editingTopic.titel}
                  onChange={(e) => setEditingTopic({ ...editingTopic, titel: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editingTopic.beskrywing || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, beskrywing: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowEditTopic(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Kanselleer</button>
              <button
                onClick={handleSaveTopicChanges}
                disabled={savingTopic || !editingTopic.titel || !editingTopic.graad_id}
                className="px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001a3d] disabled:opacity-50"
              >
                {savingTopic ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Stoor...</> : 'Stoor Veranderinge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Lesson Creation Modal */}
      {showManualLessonCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#002855]">Skep Nuwe Les</h2>
                  <p className="text-xs text-gray-500">Teks-inhoud is noodsaaklik vir die AI.</p>
                </div>
              </div>
              <button onClick={() => setShowManualLessonCreate(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 1. Onderwerp Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kies Onderwerp *</label>
                <select
                  value={selectedOnderwerp}
                  onChange={(e) => setSelectedOnderwerp(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                >
                  <option value="">-- Kies 'n Onderwerp --</option>
                  {onderwerpe.map(ond => (
                    <option key={ond.id} value={ond.id}>
                      {grades.find(g => g.id === ond.graad_id)?.naam} - {ond.titel}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Titel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Les Titel *</label>
                <input
                  type="text"
                  value={manualLesson.title}
                  onChange={(e) => setManualLesson({ ...manualLesson, title: e.target.value })}
                  placeholder="Bv. Die Gelykenis van die Saaier"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                />
              </div>

              {/* 3. Inhoud (Textarea) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Les Inhoud (Teks) *
                  <span className="ml-2 text-xs text-[#D4A84B] font-normal">(Hierdie teks word deur die AI gelees)</span>
                </label>
                <Textarea
                  value={manualLesson.content}
                  onChange={(e) => setManualLesson({ ...manualLesson, content: e.target.value })}
                  placeholder="Plak die volle teks van die les hier..."
                  className="min-h-[200px] text-base"
                />
              </div>

              {/* 4. Optional File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aanhegsel (Opsioneel)
                  <span className="ml-2 text-xs text-gray-400 font-normal">(.docx, .pdf vir leerders om af te laai)</span>
                </label>
                <div
                  onClick={() => manualLessonFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#D4A84B] hover:bg-[#D4A84B]/5 transition-colors"
                >
                  <input
                    type="file"
                    ref={manualLessonFileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setManualLesson({ ...manualLesson, file: e.target.files[0] });
                      }
                    }}
                  />
                  {manualLesson.file ? (
                    <div className="flex items-center gap-2 text-[#002855] font-medium">
                      <FileSpreadsheet className="w-5 h-5 text-[#D4A84B]" />
                      {manualLesson.file.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setManualLesson({ ...manualLesson, file: null });
                        }}
                        className="p-1 hover:bg-gray-200 rounded-full ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <CloudUpload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Klik om lêer te kies</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowManualLessonCreate(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Kanselleer
              </button>
              <button
                onClick={handleCreateManualLesson}
                disabled={creatingManualLesson}
                className="px-6 py-2 bg-[#002855] text-white rounded-lg font-medium hover:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creatingManualLesson ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Besig om te skep...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Skep Les
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#002855] flex items-center justify-center">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#002855]">Wysig Gebruiker</h2>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                  <input
                    type="text"
                    value={editingUser.naam}
                    onChange={(e) => setEditingUser({ ...editingUser, naam: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#002855] focus:ring-2 focus:ring-[#002855]/20 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Van *</label>
                  <input
                    type="text"
                    value={editingUser.van}
                    onChange={(e) => setEditingUser({ ...editingUser, van: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#002855] focus:ring-2 focus:ring-[#002855]/20 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-pos / Gebruikersnaam *</label>
                <input
                  type="email"
                  value={editingUser.epos}
                  onChange={(e) => setEditingUser({ ...editingUser, epos: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#002855] focus:ring-2 focus:ring-[#002855]/20 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selfoon</label>
                <input
                  type="tel"
                  value={editingUser.selfoon || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, selfoon: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#002855] focus:ring-2 focus:ring-[#002855]/20 outline-none text-sm"
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#D4A84B]" />
                  Verander Wagwoord (Opsioneel)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nuwe Wagwoord</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={(editingUser as any).new_password || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, new_password: e.target.value } as any)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#002855] focus:ring-2 focus:ring-[#002855]/20 outline-none text-sm pr-10"
                        placeholder="Los leeg om nie te verander nie"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-40" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bevestig Nuwe Wagwoord</label>
                    <div className="relative">
                      <input
                        type={showPasswordConfirm ? "text" : "password"}
                        value={(editingUser as any).new_password_confirm || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, new_password_confirm: e.target.value } as any)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#002855] focus:ring-2 focus:ring-[#002855]/20 outline-none text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswordConfirm ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-40" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm"
              >
                Kanselleer
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={addingAdmin}
                className="flex-1 py-2 px-4 rounded-xl bg-[#002855] text-white font-semibold hover:bg-[#001a3d] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {addingAdmin ? <><Loader2 className="w-4 h-4 animate-spin" />Besig...</> : 'Stoor Veranderinge'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Lesson Modal */}
      {showEditLes && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#002855]">Wysig Les</h2>
                  <p className="text-xs text-gray-500">Pas die inhoud van die les aan.</p>
                </div>
              </div>
              <button onClick={() => setShowEditLes(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Onderwerp *</label>
                <select
                  value={lesOnderwerpId || ''}
                  onChange={(e) => setLesOnderwerpId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                >
                  <option value="">-- Kies Onderwerp --</option>
                  {onderwerpe.map(ond => (
                    <option key={ond.id} value={ond.id}>
                      {grades.find(g => g.id === ond.graad_id)?.naam} - {ond.titel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Les Titel *</label>
                <input
                  type="text"
                  value={lesTitel}
                  onChange={(e) => setLesTitel(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skrifverwysing</label>
                <input
                  type="text"
                  value={lesSkrifverwysing}
                  onChange={(e) => setLesSkrifverwysing(e.target.value)}
                  placeholder="bv. Johannes 3:16"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Les Inhoud (Teks) *</label>
                <Textarea
                  value={lesInhoud}
                  onChange={(e) => setLesInhoud(e.target.value)}
                  className="min-h-[250px] text-base font-mono"
                  placeholder="Les inhoud..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                <input
                  type="text"
                  value={lesVideoUrl}
                  onChange={(e) => setLesVideoUrl(e.target.value)}
                  placeholder="YouTube of Vimeo skakel"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 sticky bottom-0">
              <button
                onClick={() => setShowEditLes(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Kanselleer
              </button>
              <button
                onClick={handleSaveLesChanges}
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Stoor Veranderinge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-Admin Modal */}
      {showAddSubAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#002855]">Nuwe Sub-Administrateur</h2>
              </div>
              <button onClick={() => setShowAddSubAdmin(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                  <input
                    type="text"
                    value={newSubAdmin.naam}
                    onChange={(e) => setNewSubAdmin({ ...newSubAdmin, naam: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Van *</label>
                  <input
                    type="text"
                    value={newSubAdmin.van}
                    onChange={(e) => setNewSubAdmin({ ...newSubAdmin, van: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-pos / Gebruikersnaam *</label>
                <input
                  type="email"
                  value={newSubAdmin.epos}
                  onChange={(e) => setNewSubAdmin({ ...newSubAdmin, epos: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selfoon</label>
                <input
                  type="tel"
                  value={newSubAdmin.selfoon}
                  onChange={(e) => setNewSubAdmin({ ...newSubAdmin, selfoon: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wagwoord *</label>
                  <input
                    type="password"
                    value={newSubAdmin.wagwoord}
                    onChange={(e) => setNewSubAdmin({ ...newSubAdmin, wagwoord: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                    placeholder="Min 6 karakters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bevestig Wagwoord *</label>
                  <input
                    type="password"
                    value={newSubAdmin.wagwoord_bevestig}
                    onChange={(e) => setNewSubAdmin({ ...newSubAdmin, wagwoord_bevestig: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div>
                <label className="block text-sm font-bold text-[#002855] mb-2">Toestemmings *</label>
                <p className="text-xs text-gray-500 mb-3">Kies watter funksies hierdie gebruiker mag gebruik:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {ALL_ADMIN_PERMISSIONS.filter(p => p !== 'sub_admin_bestuur').map(perm => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={newSubAdmin.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSubAdmin({ ...newSubAdmin, permissions: [...newSubAdmin.permissions, perm] });
                          } else {
                            setNewSubAdmin({ ...newSubAdmin, permissions: newSubAdmin.permissions.filter(p => p !== perm) });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{ADMIN_PERMISSION_LABELS[perm]}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setNewSubAdmin({ ...newSubAdmin, permissions: ALL_ADMIN_PERMISSIONS.filter(p => p !== 'sub_admin_bestuur') })}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Kies Alles
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSubAdmin({ ...newSubAdmin, permissions: [] })}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Kies Niks
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddSubAdmin}
                disabled={addingSubAdmin}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                {addingSubAdmin ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                Skep Sub-Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-Admin Permissions Modal */}
      {editingSubAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#002855]">Wysig Toestemmings</h2>
                  <p className="text-sm text-gray-500">{editingSubAdmin.naam} {editingSubAdmin.van}</p>
                </div>
              </div>
              <button onClick={() => setEditingSubAdmin(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200">
                {ALL_ADMIN_PERMISSIONS.filter(p => p !== 'sub_admin_bestuur').map(perm => (
                  <label key={perm} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={editSubAdminPermissions.includes(perm)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditSubAdminPermissions([...editSubAdminPermissions, perm]);
                        } else {
                          setEditSubAdminPermissions(editSubAdminPermissions.filter(p => p !== perm));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{ADMIN_PERMISSION_LABELS[perm]}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditSubAdminPermissions(ALL_ADMIN_PERMISSIONS.filter(p => p !== 'sub_admin_bestuur'))}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  Kies Alles
                </button>
                <button
                  type="button"
                  onClick={() => setEditSubAdminPermissions([])}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Kies Niks
                </button>
              </div>
              <button
                onClick={handleSaveSubAdminPermissions}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Stoor Toestemmings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Admins List Section - within main, before closing div */}
      {isFullHoofAdmin && subAdmins.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                <h2 className="text-lg md:text-xl font-bold text-[#002855]">Sub-Administrateurs</h2>
              </div>
              <button
                onClick={() => setShowAddSubAdmin(true)}
                className="px-3 md:px-4 py-2 text-xs md:text-sm bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Voeg By</span>
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Naam</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">E-pos</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Toestemmings</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loadingSubAdmins ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : (
                      subAdmins.map(subAdmin => (
                        <tr key={subAdmin.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 md:px-4 py-3">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {subAdmin.naam[0]}{subAdmin.van[0]}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{subAdmin.naam} {subAdmin.van}</p>
                                <span className="text-xs text-emerald-600 font-medium sm:hidden">{subAdmin.epos}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{subAdmin.epos || '-'}</td>
                          <td className="px-3 md:px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(subAdmin.admin_permissions || []).slice(0, 3).map(perm => (
                                <span key={perm} className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700">
                                  {ADMIN_PERMISSION_LABELS[perm]}
                                </span>
                              ))}
                              {(subAdmin.admin_permissions || []).length > 3 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500">
                                  +{(subAdmin.admin_permissions || []).length - 3} meer
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${subAdmin.aktief ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                              {subAdmin.aktief ? 'Aktief' : 'Onaktief'}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingSubAdmin(subAdmin);
                                  setEditSubAdminPermissions(subAdmin.admin_permissions || []);
                                }}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Wysig Toestemmings"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleSubAdminStatus(subAdmin)}
                                className={`px-2 md:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${subAdmin.aktief
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                              >
                                {subAdmin.aktief ? 'Deaktiveer' : 'Aktiveer'}
                              </button>
                              <button
                                onClick={() => handleDeleteSubAdmin(subAdmin)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Verwyder"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default HoofAdminDashboard;
