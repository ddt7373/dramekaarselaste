import React from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { useOffline } from '@/contexts/OfflineContext';
import { AppView, isLeier, isAdmin, isHoofAdmin, isGemeenteAdmin, isWykLeier, isModerator } from '@/types/nhka';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  Users,
  User,
  Heart,
  AlertTriangle,
  Calendar,
  HelpCircle,
  Settings,
  X,
  Church,
  Crown,
  CreditCard,
  ArrowLeft,
  Newspaper,
  BookOpen,
  FileText,
  FolderOpen,
  ArrowRightLeft,
  MapPin,
  Home,
  Send,
  Megaphone,
  Sparkles,
  GraduationCap,
  Award,
  WifiOff,
  CloudOff,
  HardDrive,
  Handshake,
  Map,
  Baby,
  Globe,
  Mail,
  ShoppingBag,
  MessageCircle,
  BookOpenCheck,
  Zap,
  ClipboardList,
  ChevronDown,
  Shield,
  Music
} from 'lucide-react';


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: AppView;
  label: string;
  dynamicLabel?: (rol: string) => string;
  icon: React.ReactNode;
  roles: ('lidmaat' | 'leier' | 'admin' | 'hoof_admin' | 'wyk_leier' | 'predikant' | 'moderator' | 'eksterne_gebruiker')[];
  excludeRoles?: string[];
  isSection?: boolean;
  sectionLabel?: string;
}

const shouldSeeGemeente = (rol: string): boolean => {
  return ['predikant', 'subadmin', 'admin', 'hoof_admin'].includes(rol);
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Paneelbord', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'eksterne_gebruiker'] },
  {
    id: 'my-wyk',
    label: 'My Wyk',
    dynamicLabel: (rol: string) => shouldSeeGemeente(rol) ? 'Gemeente' : 'My Wyk',
    icon: <Users className="w-5 h-5" />,
    roles: ['leier', 'admin', 'hoof_admin']
  },
  { id: 'gemeente-kaart', label: 'Gemeente Kaart', icon: <Map className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'denominasie-kaart', label: 'Alle gemeentes', icon: <Globe className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'konsistorieboek', label: 'Konsistorieboek', icon: <ClipboardList className="w-5 h-5" />, roles: ['admin', 'predikant'], excludeRoles: ['ouderling', 'diaken', 'groepleier', 'lidmaat'] },
  { id: 'wyk-toewysing', label: 'Wyk Toewysing', icon: <MapPin className="w-5 h-5" />, roles: ['admin', 'predikant'], excludeRoles: ['ouderling', 'diaken', 'groepleier', 'hoof_admin'] },
  { id: 'besoekpunt-toewysing', label: 'Besoekpunt Toewysing', icon: <Home className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'predikant'], excludeRoles: ['ouderling', 'diaken', 'groepleier'] },
  { id: 'erediens-info', label: 'Erediens Info', icon: <Church className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'predikant'], excludeRoles: ['ouderling', 'diaken', 'groepleier'] },
  { id: 'nuusbrief', label: 'Nuusbrief', icon: <Newspaper className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'predikant'], excludeRoles: ['ouderling', 'diaken', 'groepleier'] },
  { id: 'dokumente', label: 'Dokumente Bestuur', icon: <FileText className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'predikant'], excludeRoles: ['ouderling', 'diaken', 'groepleier'] },
  { id: 'my-dokumente', label: 'My Dokumente', icon: <FolderOpen className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'oordrag', label: 'Lidmaatskap Oordrag', icon: <ArrowRightLeft className="w-5 h-5" />, roles: ['lidmaat', 'admin', 'hoof_admin', 'predikant'], excludeRoles: ['ouderling', 'diaken', 'groepleier'] },
  { id: 'profiel', label: 'My Profiel', icon: <User className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'eksterne_gebruiker'] },
  { id: 'boodskappe', label: 'Boodskappe', icon: <Mail className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'betaling', label: 'Betalings', icon: <CreditCard className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'bybelkennis', label: 'Bybelkennis', icon: <BookOpenCheck className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'], sectionLabel: 'Leer & Groei' },
  { id: 'geloofsgroei', label: 'Geloofsgroei', icon: <GraduationCap className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'sakramentsbeloftes', label: 'Sakramentsbeloftes', icon: <Baby className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'kort-kragtig', label: 'Kort & Kragtig', icon: <Zap className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'geloofsonderrig', label: 'Geloofsonderrig', icon: <BookOpen className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },

  { id: 'vbo', label: 'VBO Krediete', icon: <Award className="w-5 h-5" />, roles: ['predikant', 'moderator', 'hoof_admin'] },
  { id: 'advertensies', label: 'Advertensies', icon: <Megaphone className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'gawes-soek', label: 'Gawes Soek', icon: <Sparkles className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'pastorale-aksie', label: 'Pastorale Aksies', icon: <Heart className="w-5 h-5" />, roles: ['leier', 'admin', 'hoof_admin'] },
  { id: 'missionale-bediening', label: 'Missionale Bediening', icon: <Sparkles className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'krisis', label: 'Krisisverslae', icon: <AlertTriangle className="w-5 h-5" />, roles: ['leier', 'admin', 'hoof_admin', 'predikant'] },
  { id: 'krisis-bestuur', label: 'Krisisbestuur', icon: <Shield className="w-5 h-5" />, roles: ['leier', 'admin', 'hoof_admin', 'predikant'] },
  { id: 'bedieningsbehoeftes', label: 'Bedieningsbehoeftes', icon: <Handshake className="w-5 h-5" />, roles: ['leier', 'admin', 'hoof_admin', 'predikant'], excludeRoles: ['lidmaat'] },
  { id: 'program', label: 'Gemeenteprogram', icon: <Calendar className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'vrae', label: 'Vrae & Versoeke', icon: <HelpCircle className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'artikel-portaal', label: 'Artikels-portaal', icon: <FileText className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'predikant'] },
  { id: 'redaksie-portaal', label: 'Redaksie-portaal', icon: <ClipboardList className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'moderator', 'predikant'] },
  { id: 'verhoudings', label: 'Verhoudings', icon: <Heart className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'eksterne_gebruiker'] },
  { id: 'kuberkermis', label: 'Kuberkermis', icon: <ShoppingBag className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'eksterne_gebruiker'] },
  { id: 'vanlyn-bestuur', label: 'Van-lyn-af Bestuur', icon: <HardDrive className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'hulp-tutoriale', label: 'Gebruiksaanwysings', icon: <BookOpenCheck className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'eksterne_gebruiker'] },
  { id: 'musiek', label: 'Musiek', icon: <Music className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'omsendbrief-kletsbot', label: 'Omsendbrief Kletsbot', icon: <MessageCircle className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'], sectionLabel: 'Meer' },
  { id: 'admin', label: 'Administrasie', icon: <Settings className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'predikant'], excludeRoles: ['ouderling', 'diaken', 'groepleier'] },
];


const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentView, setCurrentView, setCurrentGemeente, krisisse, vrae, currentGemeente } = useNHKA();
  const [dynamicMenu, setDynamicMenu] = React.useState<any[] | null>(null);
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (currentUser?.rol) {
      const fetchMenu = async () => {
        // Normalize role for shared menus
        let searchRole = currentUser.rol;

        // Group similar roles to share layouts
        if (['ouderling', 'diaken', 'groepleier', 'kerkraad'].includes(searchRole)) {
          searchRole = 'groepleier';
        } else if (['subadmin', 'admin'].includes(searchRole)) {
          searchRole = 'admin';
        }

        // 1. Try fetching layout for specific gemeente
        if (currentUser.gemeente_id) {
          const { data: specificData } = await supabase
            .from('sys_menu_layouts')
            .select('layout')
            .eq('role', searchRole)
            .eq('gemeente_id', currentUser.gemeente_id)
            .maybeSingle();

          if (specificData) {
            setDynamicMenu(specificData.layout || []);
            return;
          }
        }

        // 2. Fallback to default layout for the role
        const { data: defaultData } = await supabase
          .from('sys_menu_layouts')
          .select('layout')
          .eq('role', searchRole)
          .is('gemeente_id', null)
          .maybeSingle();

        if (defaultData) {
          setDynamicMenu(defaultData.layout || []);
        } else {
          setDynamicMenu(null);
        }
      };

      fetchMenu();
    }
  }, [currentUser?.id, currentUser?.rol, currentUser?.gemeente_id]);

  const toggleCategory = (catId: string) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  if (!currentUser) return null;

  const isHoofAdminUser = isHoofAdmin(currentUser.rol);
  const isPredikantUser = currentUser.rol === 'predikant';
  const isModeratorUser = isModerator(currentUser.rol);

  const userRoleCategory = isHoofAdminUser
    ? 'hoof_admin'
    : isAdmin(currentUser.rol)
      ? 'admin'
      : isPredikantUser
        ? 'predikant'
        : isModeratorUser
          ? 'moderator'
          : isLeier(currentUser.rol)
            ? 'leier'
            : currentUser.rol === 'eksterne_gebruiker'
              ? 'eksterne_gebruiker'
              : 'lidmaat';

  // Fallback to hardcoded filtering if no dynamic menu
  const filteredItems = navItems.filter(item => {
    if (item.excludeRoles && item.excludeRoles.includes(currentUser.rol)) return false;
    if (item.id === 'vbo') return isPredikantUser || isModeratorUser || isHoofAdminUser;

    // Explicit checks matching keys in navItems
    if (item.roles.includes('hoof_admin') && userRoleCategory === 'hoof_admin') return true;
    if (item.roles.includes('admin') && (userRoleCategory === 'admin' || userRoleCategory === 'hoof_admin')) return true;
    if (item.roles.includes('predikant') && (userRoleCategory === 'predikant' || userRoleCategory === 'admin' || userRoleCategory === 'hoof_admin')) return true;
    if (item.roles.includes('moderator') && (userRoleCategory === 'moderator' || userRoleCategory === 'hoof_admin')) return true;
    if (item.roles.includes('leier') && (userRoleCategory === 'leier' || userRoleCategory === 'predikant' || userRoleCategory === 'admin' || userRoleCategory === 'hoof_admin')) return true;
    if (item.roles.includes('eksterne_gebruiker') && userRoleCategory === 'eksterne_gebruiker') return true;

    // Lidmaat falls through only if NOT external user
    if (item.roles.includes('lidmaat') && userRoleCategory === 'lidmaat') return true;

    return false;
  });

  const pendingKrisisse = krisisse.filter(k => k.status === 'ingedien').length;
  const newVrae = vrae.filter(v => v.status === 'nuut').length;
  const canAnswerQuestions = ['hoof_admin', 'subadmin', 'admin', 'predikant', 'ouderling', 'diaken'].includes(currentUser.rol);

  const getBadge = (id: AppView): number => {
    if (id === 'krisis' && isAdmin(currentUser.rol)) return pendingKrisisse;
    if (id === 'vrae' && canAnswerQuestions) return newVrae;
    return 0;
  };

  const handleNavClick = (view: AppView) => {
    setCurrentView(view);
    onClose();
  };

  const handleBackToHoofAdmin = () => {
    setCurrentGemeente(null);
    setCurrentView('hoof-admin-dashboard');
    onClose();
  };

  // Helper to structure flat list into categories
  const structureMenu = (flatItems: any[]) => {
    const structured: any[] = [];
    let currentCategory: any = null;

    flatItems.forEach(item => {
      if (item.type === 'category') {
        // New Category found, push old one if exists
        if (currentCategory) {
          structured.push(currentCategory);
        }
        // Start new category
        // Initialize children array
        currentCategory = { ...item, children: [] };
      } else {
        // Normal Item
        if (currentCategory) {
          // Add to current category
          currentCategory.children.push(item);
        } else {
          // Orphan item (top level)
          structured.push(item);
        }
      }
    });

    // Push final category
    if (currentCategory) {
      structured.push(currentCategory);
    }

    return structured;
  };

  const renderedMenu = dynamicMenu ? structureMenu(dynamicMenu) : null;

  // Default categories to closed when user logs in
  React.useEffect(() => {
    if (renderedMenu) {
      const cats = renderedMenu.filter((m: any) => m.type === 'category').map((m: any) => m.id);
      setOpenCategories(prev => {
        const next = { ...prev };
        cats.forEach((id: string) => { if (next[id] === undefined) next[id] = false; });
        return next;
      });
    }
  }, [dynamicMenu]);

  // Resolve view id for lookup (handles legacy ids like "bybelkennis-1234567890-abc")
  const getViewId = (id: string) => {
    if (!id) return id;
    const base = id.split(/-\d{10,}-[a-z0-9]+$/)[0];
    return base || id;
  };

  const renderMenuItem = (itemRef: any) => {
    const viewId = getViewId(itemRef.id);
    const config = navItems.find(n => n.id === viewId || n.id === itemRef.id);

    // If it's a category, render differently
    if (itemRef.type === 'category') {
      const isOpen = openCategories[itemRef.id];
      return (
        <div key={itemRef.id} className="mb-2">
          <button
            onClick={() => toggleCategory(itemRef.id)}
            className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-black bg-[#001a35] text-white uppercase tracking-wider rounded-lg mb-1 mt-4 first:mt-0 shadow-sm"
          >
            {itemRef.label}
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && itemRef.children && (
            <div className="space-y-1 mt-1">
              {itemRef.children.map((child: any) => renderMenuItem(child))}
            </div>
          )}
        </div>
      );
    }

    if (!config) return null;

    // Apply role exclusions for dynamic menu
    if (config.excludeRoles && config.excludeRoles.includes(currentUser.rol)) return null;
    if (config.id === 'vbo' && !isPredikantUser && !isModeratorUser && !isHoofAdminUser) return null;

    const badge = getBadge(config.id);
    const isActive = currentView === config.id;
    const displayLabel = config.dynamicLabel ? config.dynamicLabel(currentUser.rol) : (itemRef.label || config.label);

    return (
      <button
        key={config.id}
        onClick={() => handleNavClick(config.id as AppView)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#002855] text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        <div className="flex items-center gap-3 text-left flex-1 min-w-0">
          <span className={`flex-shrink-0 ${isActive ? 'text-[#D4A84B]' : 'text-gray-500'}`}>{config.icon}</span>
          <span className="font-medium text-left leading-tight">{displayLabel}</span>
        </div>
        {badge > 0 && (
          <span className={`flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-[#D4A84B] text-[#002855]' : 'bg-[#9E2A2B] text-white'}`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="lg:hidden flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Church className="w-6 h-6 text-[#002855]" />
            <span className="font-bold text-[#002855]">Navigasie</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {isHoofAdminUser && currentGemeente && (
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <button onClick={handleBackToHoofAdmin} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#D4A84B]/10 text-[#D4A84B] hover:bg-[#D4A84B]/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <div className="text-left">
                <span className="font-medium block">Terug na Hoof Admin</span>
                <span className="text-xs text-[#D4A84B]/70">Alle Gemeentes</span>
              </div>
            </button>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {renderedMenu ? (
            // Dynamic Menu Rendering (Grouped)
            renderedMenu.map((item) => renderMenuItem(item))
          ) : (
            // Static Fallback Filtering
            filteredItems.map((item) => {
              const badge = getBadge(item.id);
              const isActive = currentView === item.id;
              const displayLabel = item.dynamicLabel ? item.dynamicLabel(currentUser.rol) : item.label;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#002855] text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                    <span className={`flex-shrink-0 ${isActive ? 'text-[#D4A84B]' : 'text-gray-500'}`}>{item.icon}</span>
                    <span className="font-medium text-left leading-tight">{displayLabel}</span>
                  </div>
                  {badge > 0 && (
                    <span className={`flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-[#D4A84B] text-[#002855]' : 'bg-[#9E2A2B] text-white'}`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </nav>


        <div className="flex-shrink-0 p-4 border-t border-gray-100">
          <div className="bg-[#8B7CB3]/10 rounded-xl p-4 border border-[#8B7CB3]/20">
            <p className="text-sm text-[#8B7CB3] italic leading-relaxed">"Dra mekaar se laste en vervul so die wet van Christus."</p>
            <p className="text-xs text-[#8B7CB3]/70 mt-2 font-medium">— Galasiërs 6:2</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
