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
  Laptop,
  Music,
  Zap,
  ClipboardList,
  ChevronDown,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface NavItem {
  id: AppView;
  label: string;
  dynamicLabel?: (rol: string) => string;
  icon: React.ReactNode;
  roles: ('lidmaat' | 'leier' | 'admin' | 'subadmin' | 'sub_admin' | 'hoof_admin' | 'wyk_leier' | 'predikant' | 'moderator' | 'eksterne_gebruiker')[];
  excludeRoles?: string[];
  isSection?: boolean;
  sectionLabel?: string;
}

const shouldSeeGemeente = (rol: string): boolean => {
  return ['predikant', 'subadmin', 'admin', 'hoof_admin'].includes(rol);
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Paneelbord', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'eksterne_gebruiker'] },

  // THREE PILLARS
  { id: 'worship-hub', label: 'Reis & Aanbidding', icon: <Church className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'community-hub', label: 'Gemeenskap & Sorg', icon: <Users className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'stewardship-hub', label: 'Bestuur & Rentmeesterskap', icon: <Heart className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },

  // PERSONAL & INFO
  { id: 'profiel', label: 'My Profiel', icon: <User className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'eksterne_gebruiker'], sectionLabel: 'Persoonlik' },
  { id: 'my-dokumente', label: 'My Dokumente', icon: <FolderOpen className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'my-sertifikate', label: 'My Sertifikate', icon: <Award className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'boodskappe', label: 'Boodskappe', icon: <Mail className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },

  // SERVICE TOOLS (Expanded for Leaders)
  {
    id: 'my-wyk',
    label: 'My Wyk / Gemeente',
    icon: <Users className="w-5 h-5" />,
    roles: ['leier', 'admin', 'hoof_admin'],
    sectionLabel: 'Diensgereedskap'
  },
  { id: 'pastorale-aksie', label: 'Pastorale Aksies', icon: <Heart className="w-5 h-5" />, roles: ['leier', 'admin', 'hoof_admin'] },
  { id: 'krisis', label: 'Krisisverslae', icon: <AlertTriangle className="w-5 h-5" />, roles: ['leier', 'admin', 'hoof_admin'] },
  { id: 'vbo', label: 'VBO Krediete', icon: <Award className="w-5 h-5" />, roles: ['predikant', 'moderator', 'hoof_admin'] },
  { id: 'konsistorieboek', label: 'Konsistorieboek', icon: <BookOpen className="w-5 h-5" />, roles: ['leier', 'admin', 'hoof_admin'] },

  // CORE FEATURES (Accessible via Hubs/Dynamic Menu but plumbed here)
  { id: 'geloofsonderrig', label: 'Geloofsonderrig', icon: <GraduationCap className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'bybelkennis', label: 'Bybelkennis', icon: <BookOpenCheck className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'erediens-info', label: 'Erediens Inligting', icon: <Music className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'nuusbrief', label: 'Nuusbriewe', icon: <Newspaper className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'program', label: 'Gemeenteprogram', icon: <Calendar className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'vrae', label: 'Vrae & Antwoorde', icon: <HelpCircle className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'advertensies', label: 'Gemeenskapskunde', icon: <ShoppingBag className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'kort-kragtig', label: 'Kort-Kragtig', icon: <Zap className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'denominasie-kaart', label: 'Denominasie Kaart', icon: <Globe className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },
  { id: 'gemeente-kaart', label: 'Gemeente Kaart', icon: <MapPin className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin'] },

  // ADMIN
  { id: 'admin', label: 'Administrasie', icon: <Settings className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'predikant', 'subadmin'], excludeRoles: ['ouderling', 'diaken', 'groepleier'], sectionLabel: 'Bestuur' },
  { id: 'hoof-admin-dashboard', label: 'Sinodale Dashboard', icon: <Crown className="w-5 h-5" />, roles: ['hoof_admin', 'subadmin'] },
  { id: 'wyk-toewysing', label: 'Wyk Toewysing', icon: <Map className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'subadmin'] },
  { id: 'verhoudings', label: 'Lidmaat Verhoudings', icon: <Handshake className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'subadmin'] },
  { id: 'dokumente', label: 'Dokumentebestuur', icon: <FolderOpen className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'subadmin'] },

  // HIDDEN/SYSTEM VIEWS (Only for dynamic menu resolution)
  { id: 'lms-bestuur', label: 'LMS Bestuur', icon: <Laptop className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'subadmin'] },
  { id: 'kuberkermis', label: 'Kuberkermis', icon: <ShoppingBag className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'subadmin'] },
  { id: 'oordrag', label: 'Oordragte', icon: <ArrowRightLeft className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'subadmin'] },
  { id: 'missionale-bediening', label: 'Missionale Bediening', icon: <Globe className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'subadmin'] },
  { id: 'sakramentsbeloftes', label: 'Sakramentsbeloftes', icon: <Baby className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'subadmin'] },
  { id: 'vanlyn-bestuur', label: 'Vanlyn Bestuur', icon: <CloudOff className="w-5 h-5" />, roles: ['lidmaat', 'leier', 'admin', 'hoof_admin', 'subadmin'] },
  { id: 'redaksie-portaal', label: 'Redaksie Portaal', icon: <Newspaper className="w-5 h-5" />, roles: ['admin', 'hoof_admin', 'subadmin'] },
];


const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, className = "" }) => {
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

    if (itemRef.type === 'category') {
      const isOpen = openCategories[itemRef.id];
      return (
        <div key={itemRef.id} className="mb-4">
          <button
            onClick={() => toggleCategory(itemRef.id)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold font-serif text-primary/40 uppercase tracking-[0.2em] mb-2 mt-6 first:mt-0"
          >
            {itemRef.label}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          </button>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-1.5 overflow-hidden border-l border-primary/5 ml-4"
              >
                {itemRef.children.map((child: any) => renderMenuItem(child))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (!config) return null;

    if (config.excludeRoles && config.excludeRoles.includes(currentUser.rol)) return null;
    if (config.id === 'vbo' && !isPredikantUser && !isModeratorUser && !isHoofAdminUser) return null;

    const badge = getBadge(config.id);
    const isActive = currentView === config.id;
    const displayLabel = config.dynamicLabel ? config.dynamicLabel(currentUser.rol) : (itemRef.label || config.label);

    return (
      <motion.button
        key={config.id}
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleNavClick(config.id as AppView)}
        className={`w-full group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${isActive
          ? 'bg-primary text-white sacred-shadow-lg'
          : 'text-foreground/70 hover:bg-primary/[0.03] hover:text-primary'
          }`}
      >
        <div className="flex items-center gap-4 text-left flex-1 min-w-0">
          <span className={`transition-colors duration-300 ${isActive ? 'text-accent' : 'text-foreground/30 group-hover:text-primary'
            }`}>
            {React.isValidElement(config.icon)
              ? React.cloneElement(config.icon as React.ReactElement, { className: "w-5 h-5" })
              : config.icon}
          </span>
          <span className={`text-sm tracking-wide transition-all duration-300 ${isActive ? 'font-bold' : 'font-medium'
            }`}>
            {displayLabel}
          </span>
        </div>
        {badge > 0 && (
          <span className={`flex-shrink-0 ml-2 px-2.5 py-1 text-[10px] font-black rounded-full shadow-sm ${isActive ? 'bg-accent text-primary' : 'bg-destructive text-white'
            }`}>
            {badge}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 left-0 h-full w-72 z-50 transition-all duration-500
        glass-panel border-r border-primary/5 flex flex-col sacred-shadow
        lg:static lg:z-0 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${className}
      `}>
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center p-6 border-b border-primary/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center sacred-shadow-lg">
              <Church className="w-5 h-5 text-accent" />
            </div>
            <span className="font-serif font-black text-primary tracking-tight">NAVIGASIE</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-primary/5 transition-colors">
            <X className="w-5 h-5 text-primary" />
          </button>
        </div>

        {isHoofAdminUser && currentGemeente && (
          <div className="p-6 border-b border-primary/5 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBackToHoofAdmin}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-accent-foreground/5 text-accent-foreground hover:bg-accent-foreground/10 transition-colors border border-accent/20"
            >
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm block uppercase tracking-tight">Terug na Sinode</span>
                <span className="text-[10px] text-accent-foreground/50 font-black tracking-widest uppercase">Admin Beheer</span>
              </div>
            </motion.button>
          </div>
        )}

        <nav className="flex-1 p-6 space-y-1 overflow-y-auto custom-scrollbar">
          {renderedMenu ? (
            renderedMenu.map((item) => renderMenuItem(item))
          ) : (
            filteredItems.map((item) => {
              const badge = getBadge(item.id);
              const isActive = currentView === item.id;
              const displayLabel = item.dynamicLabel ? item.dynamicLabel(currentUser.rol) : item.label;

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${isActive
                    ? 'bg-primary text-white sacred-shadow-lg'
                    : 'text-foreground/70 hover:bg-primary/[0.03] hover:text-primary'
                    }`}
                >
                  <div className="flex items-center gap-4 text-left flex-1 min-w-0">
                    <span className={`transition-colors duration-300 ${isActive ? 'text-accent' : 'text-foreground/30 group-hover:text-primary'
                      }`}>
                      {React.isValidElement(item.icon)
                        ? React.cloneElement(item.icon as React.ReactElement, { className: "w-5 h-5" })
                        : item.icon}
                    </span>
                    <span className={`text-sm tracking-wide transition-all duration-300 ${isActive ? 'font-bold' : 'font-medium'
                      }`}>
                      {displayLabel}
                    </span>
                  </div>
                  {badge > 0 && (
                    <span className={`flex-shrink-0 ml-2 px-2.5 py-1 text-[10px] font-black rounded-full shadow-sm ${isActive ? 'bg-accent text-primary' : 'bg-destructive text-white'
                      }`}>
                      {badge}
                    </span>
                  )}
                </motion.button>
              );
            })
          )}
        </nav>

        <div className="flex-shrink-0 p-8 pt-0 mt-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-primary/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-primary/5 text-center">
              <p className="text-[11px] font-serif font-medium leading-relaxed italic text-primary/70">
                "Dra mekaar se laste en vervul so die wet van Christus."
              </p>
              <div className="h-px w-8 bg-accent/30 mx-auto my-3" />
              <p className="text-[9px] font-black tracking-[0.2em] text-accent-foreground/40 uppercase">Galasiërs 6:2</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
