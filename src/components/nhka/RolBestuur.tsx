import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { UserRole, getRolLabel } from '@/types/nhka';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  Eye,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  Loader2,
  Info,
  Crown,
  UserCog,
  Church,
  Heart,
  AlertTriangle,
  Calendar,
  HelpCircle,
  FileText,
  CreditCard,
  GraduationCap,
  Award,
  Megaphone,
  Sparkles,
  MapPin,
  Home,
  Newspaper,
  ArrowRightLeft,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Handshake
} from 'lucide-react';

// Define all available permissions
interface Permission {
  id: string;
  naam: string;
  beskrywing: string;
  kategorie: string;
  ikoon: React.ReactNode;
}

const PERMISSION_CATEGORIES = [
  { id: 'algemeen', naam: 'Algemeen', kleur: 'bg-blue-500' },
  { id: 'lidmate', naam: 'Lidmate Bestuur', kleur: 'bg-green-500' },
  { id: 'pastorale', naam: 'Pastorale Sorg', kleur: 'bg-purple-500' },
  { id: 'administrasie', naam: 'Administrasie', kleur: 'bg-orange-500' },
  { id: 'finansies', naam: 'Finansies', kleur: 'bg-yellow-500' },
  { id: 'lms', naam: 'LMS & VBO', kleur: 'bg-indigo-500' },
  { id: 'kommunikasie', naam: 'Kommunikasie', kleur: 'bg-pink-500' },
];

const ALL_PERMISSIONS: Permission[] = [
  // Algemeen
  { id: 'view_dashboard', naam: 'Bekyk Paneelbord', beskrywing: 'Kan die hoofpaneelbord sien', kategorie: 'algemeen', ikoon: <Eye className="w-4 h-4" /> },
  { id: 'view_profile', naam: 'Bekyk Profiel', beskrywing: 'Kan eie profiel sien en wysig', kategorie: 'algemeen', ikoon: <Users className="w-4 h-4" /> },
  { id: 'view_program', naam: 'Bekyk Program', beskrywing: 'Kan gemeente program sien', kategorie: 'algemeen', ikoon: <Calendar className="w-4 h-4" /> },
  { id: 'view_gemeente_kaart', naam: 'Bekyk Gemeente Kaart', beskrywing: 'Kan die gemeente kaart sien', kategorie: 'algemeen', ikoon: <MapPin className="w-4 h-4" /> },
  
  // Lidmate Bestuur
  { id: 'view_my_wyk', naam: 'Bekyk My Wyk', beskrywing: 'Kan eie wyk lede sien', kategorie: 'lidmate', ikoon: <Users className="w-4 h-4" /> },
  { id: 'view_gemeente', naam: 'Bekyk Gemeente', beskrywing: 'Kan alle gemeente lede sien', kategorie: 'lidmate', ikoon: <Church className="w-4 h-4" /> },
  { id: 'manage_wyke', naam: 'Bestuur Wyke', beskrywing: 'Kan wyke skep, wysig en verwyder', kategorie: 'lidmate', ikoon: <MapPin className="w-4 h-4" /> },
  { id: 'manage_besoekpunte', naam: 'Bestuur Besoekpunte', beskrywing: 'Kan besoekpunte skep en toewys', kategorie: 'lidmate', ikoon: <Home className="w-4 h-4" /> },
  { id: 'assign_lidmate', naam: 'Toewys Lidmate', beskrywing: 'Kan lidmate aan wyke/besoekpunte toewys', kategorie: 'lidmate', ikoon: <Users className="w-4 h-4" /> },
  { id: 'create_lidmate', naam: 'Skep Lidmate', beskrywing: 'Kan nuwe lidmate registreer', kategorie: 'lidmate', ikoon: <Plus className="w-4 h-4" /> },
  { id: 'edit_lidmate', naam: 'Wysig Lidmate', beskrywing: 'Kan lidmaat inligting wysig', kategorie: 'lidmate', ikoon: <Edit className="w-4 h-4" /> },
  { id: 'delete_lidmate', naam: 'Verwyder Lidmate', beskrywing: 'Kan lidmate deaktiveer/verwyder', kategorie: 'lidmate', ikoon: <Trash2 className="w-4 h-4" /> },
  { id: 'manage_oordrag', naam: 'Bestuur Oordragte', beskrywing: 'Kan lidmaat oordragte verwerk', kategorie: 'lidmate', ikoon: <ArrowRightLeft className="w-4 h-4" /> },
  
  // Pastorale Sorg
  { id: 'view_pastorale_aksies', naam: 'Bekyk Pastorale Aksies', beskrywing: 'Kan pastorale aksies sien', kategorie: 'pastorale', ikoon: <Heart className="w-4 h-4" /> },
  { id: 'create_pastorale_aksies', naam: 'Skep Pastorale Aksies', beskrywing: 'Kan nuwe pastorale aksies aanmeld', kategorie: 'pastorale', ikoon: <Heart className="w-4 h-4" /> },
  { id: 'view_krisisse', naam: 'Bekyk Krisisse', beskrywing: 'Kan krisisverslae sien', kategorie: 'pastorale', ikoon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'manage_krisisse', naam: 'Bestuur Krisisse', beskrywing: 'Kan krisisverslae hanteer en status opdateer', kategorie: 'pastorale', ikoon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'report_krisis', naam: 'Meld Krisis', beskrywing: 'Kan nuwe krisisverslae indien', kategorie: 'pastorale', ikoon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'view_vrae', naam: 'Bekyk Vrae', beskrywing: 'Kan vrae en versoeke sien', kategorie: 'pastorale', ikoon: <HelpCircle className="w-4 h-4" /> },
  { id: 'answer_vrae', naam: 'Beantwoord Vrae', beskrywing: 'Kan vrae beantwoord', kategorie: 'pastorale', ikoon: <HelpCircle className="w-4 h-4" /> },
  { id: 'ask_vrae', naam: 'Vra Vrae', beskrywing: 'Kan vrae aan leiers stel', kategorie: 'pastorale', ikoon: <HelpCircle className="w-4 h-4" /> },
  { id: 'manage_bedieningsbehoeftes', naam: 'Bestuur Bedieningsbehoeftes', beskrywing: 'Kan bedieningsbehoeftes skep en bestuur', kategorie: 'pastorale', ikoon: <Handshake className="w-4 h-4" /> },
  { id: 'view_bedieningsbehoeftes', naam: 'Bekyk Bedieningsbehoeftes', beskrywing: 'Kan bedieningsbehoeftes sien', kategorie: 'pastorale', ikoon: <Handshake className="w-4 h-4" /> },
  { id: 'respond_bedieningsbehoeftes', naam: 'Reageer op Bedieningsbehoeftes', beskrywing: 'Kan op bedieningsbehoeftes reageer', kategorie: 'pastorale', ikoon: <Handshake className="w-4 h-4" /> },
  
  // Administrasie
  { id: 'view_admin_panel', naam: 'Bekyk Admin Paneel', beskrywing: 'Toegang tot administrasie paneel', kategorie: 'administrasie', ikoon: <Settings className="w-4 h-4" /> },
  { id: 'manage_program', naam: 'Bestuur Program', beskrywing: 'Kan gemeente program skep en wysig', kategorie: 'administrasie', ikoon: <Calendar className="w-4 h-4" /> },
  { id: 'manage_dokumente', naam: 'Bestuur Dokumente', beskrywing: 'Kan dokumente oplaai en bestuur', kategorie: 'administrasie', ikoon: <FileText className="w-4 h-4" /> },
  { id: 'view_my_dokumente', naam: 'Bekyk My Dokumente', beskrywing: 'Kan eie dokumente sien', kategorie: 'administrasie', ikoon: <FileText className="w-4 h-4" /> },
  { id: 'manage_erediens', naam: 'Bestuur Erediens Info', beskrywing: 'Kan erediens inligting en dagstukkies skep', kategorie: 'administrasie', ikoon: <Church className="w-4 h-4" /> },
  { id: 'view_erediens', naam: 'Bekyk Erediens Info', beskrywing: 'Kan erediens inligting en dagstukkies sien', kategorie: 'administrasie', ikoon: <Church className="w-4 h-4" /> },
  { id: 'manage_rolle', naam: 'Bestuur Rolle', beskrywing: 'Kan gebruiker rolle wysig', kategorie: 'administrasie', ikoon: <Shield className="w-4 h-4" /> },
  { id: 'view_oudit_log', naam: 'Bekyk Oudit Log', beskrywing: 'Kan veranderingslogboek sien', kategorie: 'administrasie', ikoon: <FileText className="w-4 h-4" /> },
  
  // Finansies
  { id: 'view_betalings', naam: 'Bekyk Betalings', beskrywing: 'Kan betalingsgeskiedenis sien', kategorie: 'finansies', ikoon: <CreditCard className="w-4 h-4" /> },
  { id: 'make_betaling', naam: 'Maak Betaling', beskrywing: 'Kan betalings/offergawes maak', kategorie: 'finansies', ikoon: <CreditCard className="w-4 h-4" /> },
  { id: 'view_finansiele_verslae', naam: 'Bekyk Finansiële Verslae', beskrywing: 'Kan finansiële verslae sien', kategorie: 'finansies', ikoon: <CreditCard className="w-4 h-4" /> },
  
  // LMS & VBO
  { id: 'view_geloofsgroei', naam: 'Bekyk Geloofsgroei', beskrywing: 'Kan LMS kursusse sien en voltooi', kategorie: 'lms', ikoon: <GraduationCap className="w-4 h-4" /> },
  { id: 'manage_lms_kursusse', naam: 'Bestuur LMS Kursusse', beskrywing: 'Kan LMS kursusse skep en wysig', kategorie: 'lms', ikoon: <GraduationCap className="w-4 h-4" /> },
  { id: 'view_vbo', naam: 'Bekyk VBO', beskrywing: 'Kan VBO krediete en indienings sien', kategorie: 'lms', ikoon: <Award className="w-4 h-4" /> },
  { id: 'submit_vbo', naam: 'Dien VBO In', beskrywing: 'Kan VBO krediet indienings maak', kategorie: 'lms', ikoon: <Award className="w-4 h-4" /> },
  { id: 'manage_vbo', naam: 'Bestuur VBO', beskrywing: 'Kan VBO indienings goedkeur/afkeur', kategorie: 'lms', ikoon: <Award className="w-4 h-4" /> },
  { id: 'view_lms_stats', naam: 'Bekyk LMS Statistieke', beskrywing: 'Kan LMS statistieke en verslae sien', kategorie: 'lms', ikoon: <GraduationCap className="w-4 h-4" /> },
  
  // Kommunikasie
  { id: 'view_nuusbrief', naam: 'Bekyk Nuusbrief', beskrywing: 'Kan nuusbriewe sien', kategorie: 'kommunikasie', ikoon: <Newspaper className="w-4 h-4" /> },
  { id: 'send_nuusbrief', naam: 'Stuur Nuusbrief', beskrywing: 'Kan nuusbriewe skep en stuur', kategorie: 'kommunikasie', ikoon: <Newspaper className="w-4 h-4" /> },
  { id: 'view_advertensies', naam: 'Bekyk Advertensies', beskrywing: 'Kan advertensies sien', kategorie: 'kommunikasie', ikoon: <Megaphone className="w-4 h-4" /> },
  { id: 'create_advertensies', naam: 'Skep Advertensies', beskrywing: 'Kan advertensies plaas', kategorie: 'kommunikasie', ikoon: <Megaphone className="w-4 h-4" /> },
  { id: 'view_gawes', naam: 'Bekyk Gawes', beskrywing: 'Kan gawes en talente soek', kategorie: 'kommunikasie', ikoon: <Sparkles className="w-4 h-4" /> },
  { id: 'register_gawes', naam: 'Registreer Gawes', beskrywing: 'Kan eie gawes en talente registreer', kategorie: 'kommunikasie', ikoon: <Sparkles className="w-4 h-4" /> },
  { id: 'send_sms', naam: 'Stuur SMS', beskrywing: 'Kan SMS boodskappe stuur', kategorie: 'kommunikasie', ikoon: <Newspaper className="w-4 h-4" /> },
];

// Default permissions for each role
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  hoof_admin: ALL_PERMISSIONS.map(p => p.id), // All permissions
  
  admin: [
    'view_dashboard', 'view_profile', 'view_program', 'view_gemeente_kaart',
    'view_gemeente', 'manage_wyke', 'manage_besoekpunte', 'assign_lidmate', 'create_lidmate', 'edit_lidmate', 'delete_lidmate', 'manage_oordrag',
    'view_pastorale_aksies', 'create_pastorale_aksies', 'view_krisisse', 'manage_krisisse', 'report_krisis', 'view_vrae', 'answer_vrae',
    'manage_bedieningsbehoeftes', 'view_bedieningsbehoeftes', 'respond_bedieningsbehoeftes',
    'view_admin_panel', 'manage_program', 'manage_dokumente', 'view_my_dokumente', 'manage_erediens', 'view_erediens', 'manage_rolle', 'view_oudit_log',
    'view_betalings', 'make_betaling', 'view_finansiele_verslae',
    'view_geloofsgroei', 'manage_lms_kursusse', 'view_lms_stats',
    'view_nuusbrief', 'send_nuusbrief', 'view_advertensies', 'create_advertensies', 'view_gawes', 'register_gawes', 'send_sms'
  ],
  
  subadmin: [
    'view_dashboard', 'view_profile', 'view_program', 'view_gemeente_kaart',
    'view_gemeente', 'manage_wyke', 'manage_besoekpunte', 'assign_lidmate', 'create_lidmate', 'edit_lidmate', 'delete_lidmate', 'manage_oordrag',
    'view_pastorale_aksies', 'create_pastorale_aksies', 'view_krisisse', 'manage_krisisse', 'report_krisis', 'view_vrae', 'answer_vrae',
    'manage_bedieningsbehoeftes', 'view_bedieningsbehoeftes', 'respond_bedieningsbehoeftes',
    'view_admin_panel', 'manage_program', 'manage_dokumente', 'view_my_dokumente', 'manage_erediens', 'view_erediens', 'manage_rolle', 'view_oudit_log',
    'view_betalings', 'make_betaling', 'view_finansiele_verslae',
    'view_geloofsgroei', 'manage_lms_kursusse', 'view_lms_stats',
    'view_nuusbrief', 'send_nuusbrief', 'view_advertensies', 'create_advertensies', 'view_gawes', 'register_gawes', 'send_sms'
  ],
  
  predikant: [
    'view_dashboard', 'view_profile', 'view_program', 'view_gemeente_kaart',
    'view_gemeente', 'manage_wyke', 'manage_besoekpunte', 'assign_lidmate', 'create_lidmate', 'edit_lidmate', 'manage_oordrag',
    'view_pastorale_aksies', 'create_pastorale_aksies', 'view_krisisse', 'manage_krisisse', 'report_krisis', 'view_vrae', 'answer_vrae',
    'manage_bedieningsbehoeftes', 'view_bedieningsbehoeftes', 'respond_bedieningsbehoeftes',
    'view_admin_panel', 'manage_program', 'manage_dokumente', 'view_my_dokumente', 'manage_erediens', 'view_erediens',
    'view_betalings', 'make_betaling',
    'view_geloofsgroei', 'view_vbo', 'submit_vbo',
    'view_nuusbrief', 'send_nuusbrief', 'view_advertensies', 'create_advertensies', 'view_gawes', 'register_gawes', 'send_sms'
  ],
  
  moderator: [
    'view_dashboard', 'view_profile',
    'view_geloofsgroei', 'manage_lms_kursusse', 'view_vbo', 'manage_vbo', 'view_lms_stats'
  ],
  
  ouderling: [
    'view_dashboard', 'view_profile', 'view_program', 'view_gemeente_kaart',
    'view_my_wyk', 'view_pastorale_aksies', 'create_pastorale_aksies', 'view_krisisse', 'report_krisis', 'view_vrae', 'answer_vrae',
    'view_bedieningsbehoeftes', 'respond_bedieningsbehoeftes',
    'view_my_dokumente', 'view_erediens',
    'view_betalings', 'make_betaling',
    'view_geloofsgroei',
    'view_nuusbrief', 'view_advertensies', 'create_advertensies', 'view_gawes', 'register_gawes'
  ],
  
  diaken: [
    'view_dashboard', 'view_profile', 'view_program', 'view_gemeente_kaart',
    'view_my_wyk', 'view_pastorale_aksies', 'create_pastorale_aksies', 'view_krisisse', 'report_krisis', 'view_vrae', 'answer_vrae',
    'view_bedieningsbehoeftes', 'respond_bedieningsbehoeftes',
    'view_my_dokumente', 'view_erediens',
    'view_betalings', 'make_betaling',
    'view_geloofsgroei',
    'view_nuusbrief', 'view_advertensies', 'create_advertensies', 'view_gawes', 'register_gawes'
  ],
  
  groepleier: [
    'view_dashboard', 'view_profile', 'view_program', 'view_gemeente_kaart',
    'view_my_wyk', 'view_pastorale_aksies', 'create_pastorale_aksies', 'report_krisis', 'view_vrae', 'ask_vrae',
    'view_bedieningsbehoeftes',
    'view_my_dokumente', 'view_erediens',
    'view_betalings', 'make_betaling',
    'view_geloofsgroei',
    'view_nuusbrief', 'view_advertensies', 'create_advertensies', 'view_gawes', 'register_gawes'
  ],
  
  lidmaat: [
    'view_dashboard', 'view_profile', 'view_program', 'view_gemeente_kaart',
    'report_krisis', 'ask_vrae',
    'view_my_dokumente', 'view_erediens',
    'make_betaling',
    'view_geloofsgroei',
    'view_nuusbrief', 'view_advertensies', 'create_advertensies', 'view_gawes', 'register_gawes'
  ]
};

const ROLES_ORDER: UserRole[] = ['hoof_admin', 'admin', 'subadmin', 'predikant', 'moderator', 'ouderling', 'diaken', 'groepleier', 'lidmaat'];

const RolBestuur: React.FC = () => {
  const { currentUser } = useNHKA();
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>(DEFAULT_ROLE_PERMISSIONS);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(PERMISSION_CATEGORIES.map(c => c.id));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load permissions from database on mount
  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rol_toestemmings')
        .select('*');

      if (error) {
        // Table might not exist, use defaults
        console.log('Using default permissions');
      } else if (data && data.length > 0) {
        const loaded: Record<string, string[]> = {};
        data.forEach((item: any) => {
          loaded[item.rol] = item.toestemmings || [];
        });
        setRolePermissions({ ...DEFAULT_ROLE_PERMISSIONS, ...loaded } as Record<UserRole, string[]>);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
    setLoading(false);
  };

  const handleTogglePermission = (role: UserRole, permissionId: string) => {
    if (role === 'hoof_admin') {
      toast.error('Hoof Admin toestemmings kan nie gewysig word nie');
      return;
    }

    setRolePermissions(prev => {
      const current = prev[role] || [];
      const updated = current.includes(permissionId)
        ? current.filter(p => p !== permissionId)
        : [...current, permissionId];
      
      return { ...prev, [role]: updated };
    });
    setHasChanges(true);
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      // Upsert permissions for each role
      for (const role of ROLES_ORDER) {
        if (role === 'hoof_admin') continue; // Skip hoof_admin
        
        const { error } = await supabase
          .from('rol_toestemmings')
          .upsert({
            rol: role,
            toestemmings: rolePermissions[role],
            updated_at: new Date().toISOString()
          }, { onConflict: 'rol' });

        if (error) throw error;
      }

      toast.success('Toestemmings suksesvol gestoor');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error('Kon nie toestemmings stoor nie. Maak seker die databasis tabel bestaan.');
    }
    setSaving(false);
  };

  const handleResetToDefaults = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setHasChanges(true);
    toast.info('Toestemmings herstel na verstek waardes');
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getPermissionsByCategory = (categoryId: string) => {
    return ALL_PERMISSIONS.filter(p => p.kategorie === categoryId);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'hoof_admin': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'subadmin': return <Shield className="w-4 h-4" />;
      case 'predikant': return <Church className="w-4 h-4" />;
      case 'moderator': return <UserCog className="w-4 h-4" />;
      case 'ouderling': return <Heart className="w-4 h-4" />;
      case 'diaken': return <Heart className="w-4 h-4" />;
      case 'groepleier': return <Users className="w-4 h-4" />;
      case 'lidmaat': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'hoof_admin': return 'bg-[#D4A84B] text-[#002855]';
      case 'admin': return 'bg-[#002855] text-white';
      case 'subadmin': return 'bg-[#002855] text-white';
      case 'predikant': return 'bg-[#7A8450] text-white';
      case 'moderator': return 'bg-[#8B7CB3] text-white';
      case 'ouderling': return 'bg-purple-500 text-white';
      case 'diaken': return 'bg-purple-500 text-white';
      case 'groepleier': return 'bg-blue-500 text-white';
      case 'lidmaat': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const countPermissions = (role: UserRole) => {
    return rolePermissions[role]?.length || 0;
  };

  if (!currentUser || currentUser.rol !== 'hoof_admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Slegs Hoof Administrateurs kan rolle bestuur</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#002855] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#D4A84B]" />
            Rol Bestuur
          </h2>
          <p className="text-sm text-gray-500 mt-1">Bestuur toestemmings vir elke gebruikersrol</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetToDefaults}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Herstel Verstek</span>
          </button>
          <button
            onClick={handleSavePermissions}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
              hasChanges 
                ? 'bg-[#7A8450] text-white hover:bg-[#6a7446]' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Stoor</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Hoe werk dit?</h4>
            <p className="text-sm text-blue-700">
              Klik op 'n rol om die toestemmings te sien en te wysig. Hoof Admin toestemmings kan nie gewysig word nie - hulle het altyd volle toegang.
            </p>
          </div>
        </div>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ROLES_ORDER.map(role => (
          <button
            key={role}
            onClick={() => setSelectedRole(selectedRole === role ? null : role)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedRole === role 
                ? 'border-[#D4A84B] bg-[#D4A84B]/5 shadow-md' 
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg ${getRoleColor(role)} flex items-center justify-center mb-3`}>
              {getRoleIcon(role)}
            </div>
            <h3 className="font-semibold text-[#002855] text-sm truncate">{getRolLabel(role)}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {countPermissions(role)} toestemmings
            </p>
            {role === 'hoof_admin' && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-[#D4A84B]/20 text-[#D4A84B] text-xs font-medium rounded-full">
                Volle Toegang
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Selected Role Permissions */}
      {selectedRole && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${getRoleColor(selectedRole)} flex items-center justify-center`}>
                  {getRoleIcon(selectedRole)}
                </div>
                <div>
                  <h3 className="font-bold text-[#002855]">{getRolLabel(selectedRole)}</h3>
                  <p className="text-sm text-gray-500">{countPermissions(selectedRole)} van {ALL_PERMISSIONS.length} toestemmings</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {PERMISSION_CATEGORIES.map(category => {
              const permissions = getPermissionsByCategory(category.id);
              const isExpanded = expandedCategories.includes(category.id);
              const grantedCount = permissions.filter(p => rolePermissions[selectedRole]?.includes(p.id)).length;

              return (
                <div key={category.id}>
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${category.kleur}`} />
                      <span className="font-medium text-gray-800">{category.naam}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {grantedCount}/{permissions.length}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {permissions.map(permission => {
                        const isGranted = rolePermissions[selectedRole]?.includes(permission.id);
                        const isDisabled = selectedRole === 'hoof_admin';

                        return (
                          <button
                            key={permission.id}
                            onClick={() => handleTogglePermission(selectedRole, permission.id)}
                            disabled={isDisabled}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                              isGranted 
                                ? 'border-[#7A8450] bg-[#7A8450]/5' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            } ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isGranted ? 'bg-[#7A8450] text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {isGranted ? <Check className="w-3 h-3" /> : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">{permission.ikoon}</span>
                                <span className={`font-medium text-sm ${isGranted ? 'text-[#002855]' : 'text-gray-600'}`}>
                                  {permission.naam}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{permission.beskrywing}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Permissions Matrix Table */}
      {!selectedRole && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-[#002855]">Toestemmings Matriks</h3>
            <p className="text-sm text-gray-500">Vinnige oorsig van alle rolle en hul toestemmings</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 sticky left-0 bg-gray-50 min-w-[200px]">Toestemming</th>
                  {ROLES_ORDER.map(role => (
                    <th key={role} className="text-center px-2 py-3 font-semibold text-gray-600 min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-6 h-6 rounded ${getRoleColor(role)} flex items-center justify-center`}>
                          {getRoleIcon(role)}
                        </div>
                        <span className="text-xs truncate max-w-[70px]">{getRolLabel(role).split(' ')[0]}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {PERMISSION_CATEGORIES.map(category => (
                  <React.Fragment key={category.id}>
                    <tr className="bg-gray-50">
                      <td colSpan={ROLES_ORDER.length + 1} className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${category.kleur}`} />
                          <span className="font-semibold text-gray-700 text-xs uppercase">{category.naam}</span>
                        </div>
                      </td>
                    </tr>
                    {getPermissionsByCategory(category.id).slice(0, 5).map(permission => (
                      <tr key={permission.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 sticky left-0 bg-white">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">{permission.ikoon}</span>
                            <span className="text-gray-700 truncate">{permission.naam}</span>
                          </div>
                        </td>
                        {ROLES_ORDER.map(role => {
                          const hasPermission = rolePermissions[role]?.includes(permission.id);
                          return (
                            <td key={role} className="text-center px-2 py-2">
                              {hasPermission ? (
                                <Check className="w-4 h-4 text-[#7A8450] mx-auto" />
                              ) : (
                                <X className="w-4 h-4 text-gray-300 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
            <p className="text-sm text-gray-500">
              Klik op 'n rol hierbo om alle toestemmings te sien en te wysig
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolBestuur;
