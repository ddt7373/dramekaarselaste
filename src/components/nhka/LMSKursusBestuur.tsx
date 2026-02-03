import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Plus,
  X,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  ClipboardCheck,
  Award,
  Loader2,
  Clock,
  CheckCircle,
  ArrowLeft,
  Layers,
  AlertTriangle,
  GraduationCap,
  Heart,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  File as FileIcon,
  Download,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LMSKursus, LMSModule, LMSLes } from '@/types/nhka';
import KvvraagSkepper from './KvvraagSkepper';
import OpdragSkepper from './OpdragSkepper';
import OpdragMerker from './OpdragMerker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper functions


interface Bylae {
  titel: string;
  url: string;
  tipe: string;
  grootte: number;
}

// Helper functions
const getVlakLabel = (vlak: string): string => {
  const labels: Record<string, string> = {
    'beginner': 'Beginner',
    'intermediêr': 'Intermediêr',
    'gevorderd': 'Gevorderd'
  };
  return labels[vlak] || vlak || 'Beginner';
};

const getVlakKleur = (vlak: string): string => {
  const kleure: Record<string, string> = {
    'beginner': 'bg-green-100 text-green-800',
    'intermediêr': 'bg-yellow-100 text-yellow-800',
    'gevorderd': 'bg-red-100 text-red-800'
  };
  return kleure[vlak] || 'bg-gray-100 text-gray-800';
};

const formatDuur = (minute: number): string => {
  if (!minute || minute < 0) return '0 min';
  if (minute < 60) return `${minute} min`;
  const ure = Math.floor(minute / 60);
  const oorblywende = minute % 60;
  if (oorblywende === 0) return `${ure} uur`;
  return `${ure} uur ${oorblywende} min`;
};

// Sortable Lesson Item Component
interface SortableLesItemProps {
  les: LMSLes;
  onEdit: (les: LMSLes) => void;
  onDelete: (id: string) => void;
  getIcon: (tipe: string) => React.ReactNode;
}

const SortableLesItem = ({ les, onEdit, onDelete, getIcon }: SortableLesItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: les.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' as const : 'static' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group transition-colors ${isDragging ? 'shadow-lg border-[#D4A84B] opacity-80' : 'hover:border-[#D4A84B]/30'
        }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-gray-200 p-1 rounded text-gray-400 hover:text-gray-600 touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="p-1.5 bg-white rounded border border-gray-200">
          {getIcon(les.tipe)}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-700 truncate">{les.titel}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{les.duur_minute} min</span>
            {!les.is_aktief && (
              <Badge variant="outline" className="text-[10px] h-4 px-1">Onaktief</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#002855]" onClick={() => onEdit(les)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600" onClick={() => onDelete(les.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface SortableModuleItemProps {
  module: LMSModule;
  moduleIndex: number;
  expanded: boolean;
  onToggle: (id: string) => void;
  onEdit: (module: LMSModule) => void;
  onDelete: (id: string) => void;
  onBulkSlide: (e: React.ChangeEvent<HTMLInputElement>, moduleId: string) => void;
  uploading: boolean;
  onEditLes: (les: LMSLes) => void;
  onDeleteLes: (id: string) => void;
  onAddLes: (moduleId: string) => void;
  getLesIcon: (tipe: string) => React.ReactNode;
}

const SortableModuleItem = ({
  module,
  moduleIndex,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onBulkSlide,
  uploading,
  onEditLes,
  onDeleteLes,
  onAddLes,
  getLesIcon
}: SortableModuleItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' as const : 'static' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-100 rounded-lg overflow-hidden mb-2 bg-white ${isDragging ? 'shadow-xl ring-2 ring-[#D4A84B] opacity-80' : ''}`}
    >
      <div
        className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
        onClick={() => onToggle(module.id)}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-gray-200 p-1 rounded text-gray-400 hover:text-gray-600 touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}

        <span className="flex-1 font-medium text-sm text-[#002855] truncate">
          {moduleIndex + 1}. {module.titel}
        </span>
        <span className="text-xs text-gray-400">{module.lesse?.length || 0}</span>

        <div className="flex items-center gap-1">
          <label
            className="p-1 cursor-pointer text-[#002855] hover:bg-blue-100 rounded"
            title="Voer skyfies in (Bulk Upload)"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageIcon className="w-3 h-3" />
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => onBulkSlide(e, module.id)}
              disabled={uploading}
            />
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(module);
            }}
            className="p-1 h-auto"
          >
            <Edit2 className="w-3 h-3 text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(module.id);
            }}
            className="p-1 h-auto text-red-400"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-2 space-y-1 bg-white pl-8 border-t border-gray-100">
          <SortableContext
            items={module.lesse || []}
            strategy={verticalListSortingStrategy}
          >
            {(module.lesse || []).map((les) => (
              <SortableLesItem
                key={les.id}
                les={les}
                getIcon={getLesIcon}
                onDelete={() => onDeleteLes(les.id)}
                onEdit={() => onEditLes(les)}
              />
            ))}
          </SortableContext>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddLes(module.id)}
            className="w-full text-[#D4A84B] text-xs mt-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Voeg les by
          </Button>
        </div>
      )}
    </div>
  );
};

const LMSKursusBestuur: React.FC = () => {
  const { currentUser, setCurrentView } = useNHKA();
  const [kursusse, setKursusse] = useState<LMSKursus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // View state
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [selectedKursus, setSelectedKursus] = useState<LMSKursus | null>(null);

  // Form state for course
  const [kursusForm, setKursusForm] = useState({
    titel: '',
    beskrywing: '',
    kort_beskrywing: '',
    kategorie: 'Bybelstudie',
    vlak: 'beginner',
    prys: 0,
    is_gratis: true,
    duur_minute: 60,
    foto_url: '',
    video_voorskou_url: '',
    vereistes: '',
    wat_jy_sal_leer: [''],
    is_vbo_geskik: false,
    vbo_krediete: 5,
    is_missionaal: false
  });

  // Modules state
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Modal states
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<LMSModule | null>(null);
  const [moduleForm, setModuleForm] = useState({ titel: '', beskrywing: '' });

  // Lesson modal
  const [showLesModal, setShowLesModal] = useState(false);
  const [editingLes, setEditingLes] = useState<LMSLes | null>(null);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [lesForm, setLesForm] = useState({
    titel: '',
    tipe: 'teks' as LMSLes['tipe'],
    inhoud: '',
    video_url: '',
    duur_minute: 10,
    bylaes: [] as Bylae[]
  });
  const [uploading, setUploading] = useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  const kategorieë = [
    'Bybelstudie',
    'Gebed',
    'Geestelike Dissiplines',
    'Teologie',
    'Kerkgeskiedenis',
    'Pastorale Sorg',
    'Leierskap',
    'Sending',
    'Jeugbediening',
    'Huwelik & Gesin',
    'Geloofsgrondslag',
    'VBO Opleiding',
    'Ander'
  ];

  // Check if user is hoof_admin
  const isHoofAdmin = currentUser?.rol === 'hoof_admin';

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // 1. Check if it's a MODULE drag
    const activeModuleIndex = modules.findIndex(m => m.id === active.id);
    if (activeModuleIndex !== -1) {
      let overModuleIndex = modules.findIndex(m => m.id === over.id);

      // Improved collision: If dropped over a lesson, find the parent module
      if (overModuleIndex === -1) {
        overModuleIndex = modules.findIndex(m => m.lesse?.some(l => l.id === over.id));
      }

      if (overModuleIndex !== -1) {
        // Reorder modules
        const newModules = arrayMove(modules, activeModuleIndex, overModuleIndex);
        setModules(newModules);

        // Update Database for MODULES
        try {
          const updates = newModules.map((mod, index) => ({
            ...mod, // Spread all fields to satisfy constraints
            volgorde: index,
            updated_at: new Date().toISOString(),
            lesse: undefined // Don't send nested lessons to DB
          }));

          const { error } = await supabase
            .from('lms_modules')
            .upsert(updates, { onConflict: 'id' });

          if (error) {
            console.error('Error reordering modules:', error);
            toast.error('Kon nie module volgorde stoor nie');
          }
        } catch (error) {
          console.error('Error reordering modules:', error);
        }
      }
      return;
    }

    // 2. Check if it's a LESSON drag
    // Find which module contains the active lesson
    const moduleIndex = modules.findIndex(m => m.lesse?.some(l => l.id === active.id));
    if (moduleIndex !== -1) {
      const currentLesList = modules[moduleIndex].lesse || [];
      const oldIndex = currentLesList.findIndex(l => l.id === active.id);
      const newIndex = currentLesList.findIndex(l => l.id === over.id);

      // If over is not found directly, strictly speaking we shouldn't drop
      // But usually in SortableContext items match over.id
      if (oldIndex !== -1 && newIndex !== -1) {
        // Optimistic update
        const newLesList = arrayMove(currentLesList, oldIndex, newIndex);

        // Update local state deeply
        const newModules = [...modules];
        newModules[moduleIndex] = {
          ...newModules[moduleIndex],
          lesse: newLesList
        };
        setModules(newModules);

        // Calculate and save updates
        try {
          const updates = newLesList.map((les, index) => ({
            ...les,
            volgorde: index,
            updated_at: new Date().toISOString()
          }));

          const { error } = await supabase
            .from('lms_lesse')
            .upsert(updates, { onConflict: 'id' });

          if (error) {
            console.error('Error reordering lessons:', error);
            toast.error('Kon nie volgorde stoor nie');
          }
        } catch (error) {
          console.error('Error reordering lessons:', error);
        }
      }
    }
  };


  useEffect(() => {
    if (!isHoofAdmin) {
      toast.error('Slegs Hoof Administrateurs het toegang tot hierdie bladsy');
      setCurrentView('geloofsgroei');
      return;
    }
    fetchKursusse();
  }, [isHoofAdmin]);

  const fetchKursusse = async () => {
    try {
      setLoading(true);
      console.log('Fetching all kursusse for admin...');

      const { data, error } = await supabase
        .from('lms_kursusse')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        toast.error('Kon nie kursusse laai nie: ' + error.message);
        setKursusse([]);
      } else {
        console.log('Kursusse loaded:', data?.length || 0);
        setKursusse(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast.error('Kon nie kursusse laai nie');
    } finally {
      setLoading(false);
    }
  };

  const fetchKursusDetails = async (kursusId: string) => {
    try {
      console.log('Fetching modules for kursus:', kursusId);

      const { data: modulesData, error: modulesError } = await supabase
        .from('lms_modules')
        .select('*')
        .eq('kursus_id', kursusId)
        .order('volgorde');

      if (modulesError) {
        console.error('Modules error:', modulesError);
        setModules([]);
        return;
      }

      // Fetch lessons for each module
      const modulesWithLesse = await Promise.all(
        (modulesData || []).map(async (module) => {
          const { data: lesseData } = await supabase
            .from('lms_lesse')
            .select('*')
            .eq('module_id', module.id)
            .order('volgorde');

          return { ...module, lesse: lesseData || [] };
        })
      );

      setModules(modulesWithLesse);
    } catch (error: any) {
      console.error('Error fetching course details:', error);
      setModules([]);
    }
  };

  const handleNewKursus = () => {
    setSelectedKursus(null);
    setKursusForm({
      titel: '',
      beskrywing: '',
      kort_beskrywing: '',
      kategorie: 'Bybelstudie',
      vlak: 'beginner',
      prys: 0,
      is_gratis: true,
      duur_minute: 60,
      foto_url: '',
      video_voorskou_url: '',
      vereistes: '',
      wat_jy_sal_leer: [''],
      is_vbo_geskik: false,
      vbo_krediete: 5,
      is_missionaal: false
    });
    setModules([]);
    setView('edit');
  };

  const handleEditKursus = async (kursus: LMSKursus) => {
    setSelectedKursus(kursus);
    setKursusForm({
      titel: kursus.titel || '',
      beskrywing: kursus.beskrywing || '',
      kort_beskrywing: kursus.kort_beskrywing || '',
      kategorie: kursus.kategorie || 'Bybelstudie',
      vlak: kursus.vlak || 'beginner',
      prys: Number(kursus.prys) || 0,
      is_gratis: kursus.is_gratis ?? true,
      duur_minute: kursus.duur_minute || 60,
      foto_url: kursus.foto_url || '',
      video_voorskou_url: kursus.video_voorskou_url || '',
      vereistes: kursus.vereistes || '',
      wat_jy_sal_leer: kursus.wat_jy_sal_leer || [''],
      is_vbo_geskik: kursus.is_vbo_geskik ?? false,
      vbo_krediete: kursus.vbo_krediete ?? 5,
      is_missionaal: kursus.is_missionaal ?? false
    });
    await fetchKursusDetails(kursus.id);
    setView('edit');
  };

  const handleSaveKursus = async () => {
    if (!kursusForm.titel.trim()) {
      toast.error('Voer asb \'n kursus titel in');
      return;
    }

    try {
      setSaving(true);

      const kursusData = {
        titel: kursusForm.titel,
        beskrywing: kursusForm.beskrywing,
        kort_beskrywing: kursusForm.kort_beskrywing,
        kategorie: kursusForm.kategorie,
        vlak: kursusForm.vlak,
        prys: kursusForm.is_gratis ? 0 : kursusForm.prys,
        is_gratis: kursusForm.is_gratis,
        duur_minute: kursusForm.duur_minute,
        foto_url: kursusForm.foto_url || null,
        video_voorskou_url: kursusForm.video_voorskou_url || null,
        vereistes: kursusForm.vereistes || null,
        wat_jy_sal_leer: kursusForm.wat_jy_sal_leer.filter(s => s.trim()),
        geskep_deur: currentUser?.id,
        is_vbo_geskik: kursusForm.is_vbo_geskik,
        vbo_krediete: kursusForm.is_vbo_geskik ? kursusForm.vbo_krediete : 0,
        is_missionaal: kursusForm.is_missionaal,
        updated_at: new Date().toISOString()
      };

      if (selectedKursus) {
        const { error } = await supabase
          .from('lms_kursusse')
          .update(kursusData)
          .eq('id', selectedKursus.id);

        if (error) throw error;
        toast.success('Kursus suksesvol opgedateer');
      } else {
        const { data, error } = await supabase
          .from('lms_kursusse')
          .insert([{ ...kursusData, is_gepubliseer: false, is_aktief: true }])
          .select()
          .single();

        if (error) throw error;
        setSelectedKursus(data);
        toast.success('Kursus suksesvol geskep');
      }

      await fetchKursusse();
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(error.message || 'Kon nie kursus stoor nie');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (kursus: LMSKursus) => {
    try {
      const newStatus = !kursus.is_gepubliseer;
      // If publishing, also ensure it is active
      const updateData: any = {
        is_gepubliseer: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus) {
        updateData.is_aktief = true;
      }

      const { error } = await supabase
        .from('lms_kursusse')
        .update(updateData)
        .eq('id', kursus.id);

      if (error) throw error;

      toast.success(newStatus ? 'Kursus gepubliseer' : 'Kursus gedepubliseer');
      await fetchKursusse();
    } catch (error: any) {
      toast.error('Kon nie status verander nie');
    }
  };

  const handleDeleteKursus = async (kursusId: string) => {
    if (!confirm('Is jy seker jy wil hierdie kursus verwyder? Dit sal ook alle modules en lesse verwyder.')) return;

    try {
      const { error } = await supabase
        .from('lms_kursusse')
        .delete()
        .eq('id', kursusId);

      if (error) throw error;

      toast.success('Kursus suksesvol verwyder');
      await fetchKursusse();
    } catch (error: any) {
      toast.error('Kon nie kursus verwyder nie');
    }
  };

  const handleSaveModule = async () => {
    if (!selectedKursus || !moduleForm.titel.trim()) return;

    try {
      setSaving(true);

      if (editingModule) {
        const { error } = await supabase
          .from('lms_modules')
          .update({
            titel: moduleForm.titel,
            beskrywing: moduleForm.beskrywing,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingModule.id);

        if (error) throw error;
        toast.success('Module opgedateer');
      } else {
        const { error } = await supabase
          .from('lms_modules')
          .insert([{
            kursus_id: selectedKursus.id,
            titel: moduleForm.titel,
            beskrywing: moduleForm.beskrywing,
            volgorde: modules.length,
            is_aktief: true
          }]);

        if (error) throw error;
        toast.success('Module bygevoeg');
      }

      await fetchKursusDetails(selectedKursus.id);
      setShowModuleModal(false);
      setEditingModule(null);
      setModuleForm({ titel: '', beskrywing: '' });
    } catch (error: any) {
      toast.error('Kon nie module stoor nie');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Verwyder hierdie module en al sy lesse?')) return;

    try {
      const { error } = await supabase
        .from('lms_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      toast.success('Module verwyder');
      if (selectedKursus) await fetchKursusDetails(selectedKursus.id);
    } catch (error: any) {
      toast.error('Kon nie module verwyder nie');
    }
  };

  const handleBulkSlideUpload = async (event: React.ChangeEvent<HTMLInputElement>, moduleId: string) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedKursus) return;

    try {
      setUploading(true);
      const fileArray = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));
      let processedCount = 0;
      const currentModule = modules.find(m => m.id === moduleId);
      const startVolgorde = currentModule?.lesse?.length || 0;

      toast.info(`Besig om ${files.length} skyfies op te laai...`);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `slides/${selectedKursus.id}/${moduleId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('lms-content')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading slide:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('lms-content')
          .getPublicUrl(filePath);

        // Create lesson
        const { error: lessonError } = await supabase
          .from('lms_lesse')
          .insert([{
            module_id: moduleId,
            kursus_id: selectedKursus.id,
            titel: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "), // Remove extension and cleanup
            tipe: 'teks',
            inhoud: `![Skyfie](${publicUrl})\n\n**Notas:**\n`,
            duur_minute: 5,
            volgorde: startVolgorde + i,
            is_aktief: true,
            slaag_persentasie: 70
          }]);

        if (lessonError) console.error('Error creating lesson:', lessonError);
        else processedCount++;
      }

      toast.success(`${processedCount} skyfies suksesvol ingevoer`);
      await fetchKursusDetails(selectedKursus.id);
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast.error('Kon nie skyfies oplaai nie');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedKursus) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `attachments/${selectedKursus.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lms-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lms-content')
        .getPublicUrl(filePath);

      const newBylae: Bylae = {
        titel: file.name,
        url: publicUrl,
        tipe: file.type,
        grootte: file.size
      };

      setLesForm(prev => ({
        ...prev,
        bylaes: [...(prev.bylaes || []), newBylae]
      }));

      toast.success('Lêer opgelaai');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Kon nie lêer oplaai nie');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleInlineImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedKursus) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `images/${selectedKursus.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lms-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lms-content')
        .getPublicUrl(filePath);

      // Insert markdown image syntax
      insertMarkdown(`![${file.name}](${publicUrl})`, '');

      toast.success('Prent ingevoeg');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('Kon nie prent oplaai nie');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const insertMarkdown = (prefix: string, suffix: string) => {
    const textarea = document.getElementById('les-inhoud') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = lesForm.inhoud;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}${prefix}${selection}${suffix}${after}`;
    setLesForm({ ...lesForm, inhoud: newText });

    // Focus back and set cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSaveLes = async () => {
    if (!selectedKursus || !currentModuleId || !lesForm.titel.trim()) return;

    // Sanitize bylaes to ensure they are plain objects and valid JSON
    const cleanBylaes = Array.isArray(lesForm.bylaes)
      ? lesForm.bylaes.map(b => ({
        titel: String(b.titel || ''),
        url: String(b.url || ''),
        tipe: String(b.tipe || ''),
        grootte: Number(b.grootte || 0)
      }))
      : [];

    try {
      setSaving(true);
      const module = modules.find(m => m.id === currentModuleId);

      if (editingLes) {
        const { error } = await supabase
          .from('lms_lesse')
          .update({
            titel: lesForm.titel,
            tipe: lesForm.tipe,
            inhoud: lesForm.inhoud,
            video_url: lesForm.video_url,
            duur_minute: lesForm.duur_minute,
            bylaes: JSON.stringify(cleanBylaes) as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingLes.id);

        if (error) throw error;
        toast.success('Les opgedateer');
      } else {
        const { error } = await supabase
          .from('lms_lesse')
          .insert([{
            module_id: currentModuleId,
            kursus_id: selectedKursus.id,
            titel: lesForm.titel,
            tipe: lesForm.tipe,
            inhoud: lesForm.inhoud,
            video_url: lesForm.video_url,
            duur_minute: lesForm.duur_minute,
            volgorde: module?.lesse?.length || 0,
            is_aktief: true,
            slaag_persentasie: 70,
            bylaes: JSON.stringify(cleanBylaes) as any
          }]);

        if (error) throw error;
        toast.success('Les bygevoeg');
      }

      await fetchKursusDetails(selectedKursus.id);
      setShowLesModal(false);
      setEditingLes(null);
      setCurrentModuleId(null);
      setEditingLes(null);
      setCurrentModuleId(null);
      setLesForm({ titel: '', tipe: 'teks', inhoud: '', video_url: '', duur_minute: 10, bylaes: [] });
    } catch (error: any) {
      console.error('Save error detailed:', error);
      console.log('Full Payload JSON:', JSON.stringify({
        titel: lesForm.titel,
        tipe: lesForm.tipe,
        inhoud: lesForm.inhoud,
        video_url: lesForm.video_url,
        duur_minute: lesForm.duur_minute,
        bylaes: cleanBylaes
      }, null, 2));
      toast.error('Kon nie les stoor nie: ' + (error.message || error.details || 'Onbekende fout'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLes = async (lesId: string) => {
    if (!confirm('Verwyder hierdie les?')) return;

    try {
      const { error } = await supabase
        .from('lms_lesse')
        .delete()
        .eq('id', lesId);

      if (error) throw error;

      toast.success('Les verwyder');
      if (selectedKursus) await fetchKursusDetails(selectedKursus.id);
    } catch (error: any) {
      toast.error('Kon nie les verwyder nie');
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getLesIcon = (tipe: string) => {
    switch (tipe) {
      case 'video': return <Video className="w-4 h-4 text-blue-500" />;
      case 'teks': return <FileText className="w-4 h-4 text-green-500" />;
      case 'toets': return <ClipboardCheck className="w-4 h-4 text-orange-500" />;
      case 'eksamen': return <Award className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleImportMoodle = async () => {
    if (!driveLink && !importFile) {
      toast.error('Voeg asseblief \'n Google Drive skakel in OF laai die .mbz lêer op');
      return;
    }

    try {
      setImporting(true);
      toast.info('Besig om in te voer... Dit kan \'n rukkie neem.');

      let response: Response;
      if (importFile) {
        const formData = new FormData();
        formData.append('file', importFile);
        response = await fetch('/api/import-moodle.php', {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch('/api/import-moodle.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drive_url: driveLink })
        });
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Kon nie invoer nie');
      }

      toast.success('Kursus suksesvol ingevoer!');
      setShowImportModal(false);
      setDriveLink('');
      setImportFile(null);
      await fetchKursusse();

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Fout tydens invoer');
    } finally {
      setImporting(false);
    }
  };

  const goBack = () => {
    if (view === 'edit') {
      setView('list');
    } else {
      setCurrentView('geloofsgroei');
    }
  };

  // Not authorized
  if (!isHoofAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#002855] mb-2">Geen Toegang</h2>
          <p className="text-gray-600 mb-4">
            Slegs Hoof Administrateurs het toegang tot die LMS Bestuur bladsy.
          </p>
          <Button onClick={() => setCurrentView('geloofsgroei')} className="bg-[#002855]">
            Terug na Geloofsgroei
          </Button>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#D4A84B] mx-auto mb-4" />
          <p className="text-gray-500">Laai kursusse...</p>
        </div>
      </div>
    );
  }

  // Course list view
  if (view === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-3 bg-[#D4A84B]/10 rounded-xl">
              <BookOpen className="w-6 h-6 text-[#D4A84B]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#002855]">LMS Kursus Bestuur</h2>
              <p className="text-sm text-gray-500">Skep en bestuur Geloofsgroei kursusse</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImportModal(true)} variant="outline" className="border-[#D4A84B] text-[#D4A84B] hover:bg-[#D4A84B]/10">
            <Download className="w-5 h-5 mr-2" />
            Importeer Moodle
          </Button>
          <Button onClick={handleNewKursus} className="bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d]">
            <Plus className="w-5 h-5 mr-2" />
            Nuwe Kursus
          </Button>
        </div>


        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <BookOpen className="w-5 h-5 text-[#002855] mb-2" />
              <p className="text-2xl font-bold text-[#002855]">{kursusse.length}</p>
              <p className="text-xs text-gray-500">Totale Kursusse</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Eye className="w-5 h-5 text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{kursusse.filter(k => k.is_gepubliseer).length}</p>
              <p className="text-xs text-gray-500">Gepubliseer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <EyeOff className="w-5 h-5 text-gray-400 mb-2" />
              <p className="text-2xl font-bold text-gray-600">{kursusse.filter(k => !k.is_gepubliseer).length}</p>
              <p className="text-xs text-gray-500">Konsep</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Award className="w-5 h-5 text-[#D4A84B] mb-2" />
              <p className="text-2xl font-bold text-[#D4A84B]">{kursusse.filter(k => !k.is_gratis).length}</p>
              <p className="text-xs text-gray-500">Betaalde Kursusse</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#002855]/5 to-[#D4A84B]/5">
            <CardContent className="p-4">
              <GraduationCap className="w-5 h-5 text-[#002855] mb-2" />
              <p className="text-2xl font-bold text-[#002855]">{kursusse.filter(k => k.is_vbo_geskik).length}</p>
              <p className="text-xs text-gray-500">VBO Geskik</p>
            </CardContent>
          </Card>
        </div>

        {/* Course List */}
        {
          kursusse.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Geen kursusse nog nie</h3>
              <p className="text-gray-500 mb-4">Skep jou eerste kursus om te begin</p>
              <Button onClick={handleNewKursus} className="bg-[#D4A84B] text-[#002855]">
                <Plus className="w-5 h-5 mr-2" />
                Skep Kursus
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kursusse.map(kursus => (
                <Card key={kursus.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="h-32 bg-gradient-to-br from-[#002855] to-[#004895] relative">
                    {kursus.foto_url ? (
                      <img src={kursus.foto_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
                      <Badge className={getVlakKleur(kursus.vlak)}>
                        {getVlakLabel(kursus.vlak)}
                      </Badge>
                      <Badge className={kursus.is_gepubliseer ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}>
                        {kursus.is_gepubliseer ? 'Gepubliseer' : 'Konsep'}
                      </Badge>
                      {kursus.is_vbo_geskik && (
                        <Badge className="bg-[#D4A84B] text-[#002855]">
                          VBO {kursus.vbo_krediete}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-[#002855] mb-1 line-clamp-1">{kursus.titel}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{kursus.kort_beskrywing || 'Geen beskrywing'}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuur(kursus.duur_minute)}
                      </span>
                      <span className="font-semibold text-[#002855]">
                        {kursus.is_gratis ? 'Gratis' : `R${Number(kursus.prys || 0).toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditKursus(kursus)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Wysig
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={kursus.is_gepubliseer ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}
                        onClick={() => handleTogglePublish(kursus)}
                        title={kursus.is_gepubliseer ? 'Depubliseer' : 'Publiseer'}
                      >
                        {kursus.is_gepubliseer ? 'Depubliseer' : 'Publiseer'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKursus(kursus.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        }
      </div >
    );
  }

  // Course edit view
  // Course edit view
  return (
    <div className="space-y-6">
      {/* Header - Fixed with sticky positioning */}
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 py-2 -mt-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('list')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-[#002855]">
              {selectedKursus ? 'Wysig Kursus' : 'Nuwe Kursus'}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedKursus ? kursusForm.titel : 'Skep \'n nuwe Geloofsgroei kursus'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setView('list')}>
            Kanselleer
          </Button>
          <Button size="sm" onClick={handleSaveKursus} disabled={saving} className="bg-[#002855]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Stoor
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Course Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-[#002855] flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Kursus Besonderhede
              </h3>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <Input
                  value={kursusForm.titel}
                  onChange={(e) => setKursusForm({ ...kursusForm, titel: e.target.value })}
                  placeholder="bv. Inleiding tot Bybelstudie"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kort Beskrywing</label>
                <Input
                  value={kursusForm.kort_beskrywing}
                  onChange={(e) => setKursusForm({ ...kursusForm, kort_beskrywing: e.target.value })}
                  placeholder="'n Kort opsomming van die kursus"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volledige Beskrywing</label>
                <Textarea
                  value={kursusForm.beskrywing}
                  onChange={(e) => setKursusForm({ ...kursusForm, beskrywing: e.target.value })}
                  rows={4}
                  placeholder="Beskryf die kursus in detail..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                  <select
                    value={kursusForm.kategorie}
                    onChange={(e) => setKursusForm({ ...kursusForm, kategorie: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                  >
                    {kategorieë.map(kat => (
                      <option key={kat} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vlak</label>
                  <select
                    value={kursusForm.vlak}
                    onChange={(e) => setKursusForm({ ...kursusForm, vlak: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediêr">Intermediêr</option>
                    <option value="gevorderd">Gevorderd</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duur (minute)</label>
                  <Input
                    type="number"
                    value={kursusForm.duur_minute}
                    onChange={(e) => setKursusForm({ ...kursusForm, duur_minute: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prys</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={kursusForm.is_gratis}
                        onChange={(e) => setKursusForm({ ...kursusForm, is_gratis: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#D4A84B] focus:ring-[#D4A84B]"
                      />
                      <span className="text-sm text-gray-600">Gratis</span>
                    </label>
                    {!kursusForm.is_gratis && (
                      <div className="flex-1 flex items-center">
                        <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg text-gray-500">R</span>
                        <Input
                          type="number"
                          value={kursusForm.prys}
                          onChange={(e) => setKursusForm({ ...kursusForm, prys: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                          className="rounded-l-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kursus Foto URL</label>
                <Input
                  type="url"
                  value={kursusForm.foto_url}
                  onChange={(e) => setKursusForm({ ...kursusForm, foto_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* VBO Settings Card */}
          <Card className="border-[#D4A84B]/30 bg-gradient-to-br from-[#D4A84B]/5 to-transparent">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-[#002855] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#D4A84B]" />
                VBO Instellings
              </h3>

              <p className="text-sm text-gray-600">
                Merk hierdie kursus as VBO-geskik sodat predikante outomaties krediete ontvang wanneer hulle die kursus voltooi.
              </p>

              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[#D4A84B]/20">
                <input
                  type="checkbox"
                  id="is_vbo_geskik"
                  checked={kursusForm.is_vbo_geskik}
                  onChange={(e) => setKursusForm({ ...kursusForm, is_vbo_geskik: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-[#D4A84B] focus:ring-[#D4A84B]"
                />
                <label htmlFor="is_vbo_geskik" className="flex-1 cursor-pointer">
                  <span className="font-medium text-[#002855]">VBO Geskik</span>
                  <p className="text-sm text-gray-500">Predikante ontvang outomaties VBO krediete by voltooiing</p>
                </label>
              </div>

              {kursusForm.is_vbo_geskik && (
                <div className="p-4 bg-white rounded-lg border border-[#D4A84B]/20">
                  <label className="block text-sm font-medium text-gray-700 mb-2">VBO Krediete</label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={kursusForm.vbo_krediete}
                      onChange={(e) => setKursusForm({ ...kursusForm, vbo_krediete: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="50"
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">krediete by voltooiing</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Standaard: 5 krediete. Predikante benodig 100 krediete per jaar.
                  </p>
                </div>
              )}

              <div className="p-4 bg-white rounded-lg border border-red-100 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-[#002855]">Missionaal</p>
                      <p className="text-xs text-gray-500">Wys hierdie kursus toe aan die "Reis van Missionale Gemeenskapsvorming".</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={kursusForm.is_missionaal}
                      onChange={(e) => setKursusForm({ ...kursusForm, is_missionaal: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Outcomes */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-[#002855] flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Wat Jy Sal Leer
              </h3>

              {kursusForm.wat_jy_sal_leer.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...kursusForm.wat_jy_sal_leer];
                      newItems[index] = e.target.value;
                      setKursusForm({ ...kursusForm, wat_jy_sal_leer: newItems });
                    }}
                    placeholder="bv. Verstaan die basiese beginsels van Bybelstudie"
                  />
                  {kursusForm.wat_jy_sal_leer.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newItems = kursusForm.wat_jy_sal_leer.filter((_, i) => i !== index);
                        setKursusForm({ ...kursusForm, wat_jy_sal_leer: newItems });
                      }}
                      className="text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setKursusForm({ ...kursusForm, wat_jy_sal_leer: [...kursusForm.wat_jy_sal_leer, ''] })}
                className="text-[#002855]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Voeg nog 'n punt by
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Modules Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#002855] flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Modules & Lesse
                </h3>
                {selectedKursus && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingModule(null);
                      setModuleForm({ titel: '', beskrywing: '' });
                      setShowModuleModal(true);
                    }}
                    className="text-[#D4A84B]"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {!selectedKursus ? (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Stoor eers die kursus om modules by te voeg</p>
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm mb-2">Geen modules nog nie</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingModule(null);
                      setModuleForm({ titel: '', beskrywing: '' });
                      setShowModuleModal(true);
                    }}
                    className="text-[#D4A84B]"
                  >
                    Voeg eerste module by
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={modules}
                      strategy={verticalListSortingStrategy}
                    >
                      {modules.map((module, moduleIndex) => (
                        <SortableModuleItem
                          key={module.id}
                          module={module}
                          moduleIndex={moduleIndex}
                          expanded={expandedModules.has(module.id)}
                          onToggle={toggleModule}
                          onEdit={(mod) => {
                            setEditingModule(mod);
                            setModuleForm({ titel: mod.titel, beskrywing: mod.beskrywing || '' });
                            setShowModuleModal(true);
                          }}
                          onDelete={handleDeleteModule}
                          onBulkSlide={handleBulkSlideUpload}
                          uploading={uploading}
                          getLesIcon={getLesIcon}
                          onEditLes={(les) => {
                            setEditingLes(les);
                            setCurrentModuleId(module.id);
                            setLesForm({
                              titel: les.titel,
                              tipe: les.tipe as any,
                              inhoud: les.inhoud || '',
                              video_url: les.video_url || '',
                              duur_minute: les.duur_minute,
                              bylaes: Array.isArray(les.bylaes) ? les.bylaes : []
                            });
                            setShowLesModal(true);
                          }}
                          onDeleteLes={handleDeleteLes}
                          onAddLes={(modId) => {
                            setEditingLes(null);
                            setCurrentModuleId(modId);
                            setLesForm({ titel: '', tipe: 'teks' as LMSLes['tipe'], inhoud: '', video_url: '', duur_minute: 10, bylaes: [] });
                            setShowLesModal(true);
                          }}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#002855]">
                    {editingModule ? 'Wysig Module' : 'Nuwe Module'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {editingModule ? 'Pas module besonderhede aan' : 'Skep \'n nuwe module vir hierdie kursus'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowModuleModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Module Titel *</label>
                  <Input
                    value={moduleForm.titel}
                    onChange={(e) => setModuleForm({ ...moduleForm, titel: e.target.value })}
                    placeholder="bv. Inleiding"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing</label>
                  <Textarea
                    value={moduleForm.beskrywing}
                    onChange={(e) => setModuleForm({ ...moduleForm, beskrywing: e.target.value })}
                    rows={3}
                    placeholder="Kort beskrywing van die module..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowModuleModal(false)}>
                  Kanselleer
                </Button>
                <Button
                  className="flex-1 bg-[#D4A84B] text-[#002855]"
                  onClick={handleSaveModule}
                  disabled={saving || !moduleForm.titel.trim()}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Stoor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lesson Modal */}
      {showLesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <CardContent className="p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#002855]">
                    {editingLes ? 'Wysig Les' : 'Nuwe Les'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {editingLes ? 'Pas les inhoud aan' : 'Voeg \'n nuwe les by'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowLesModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Les Titel *</label>
                  <Input
                    value={lesForm.titel}
                    onChange={(e) => setLesForm({ ...lesForm, titel: e.target.value })}
                    placeholder="bv. Wat is Bybelstudie?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                    <select
                      value={lesForm.tipe}
                      onChange={(e) => setLesForm({ ...lesForm, tipe: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    >
                      <option value="teks">Teks</option>
                      <option value="video">Video</option>
                      <option value="toets">Toets</option>
                      <option value="eksamen">Eksamen</option>
                      <option value="opdrag">Opdrag</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duur (minute)</label>
                    <Input
                      type="number"
                      value={lesForm.duur_minute}
                      onChange={(e) => setLesForm({ ...lesForm, duur_minute: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>

                {lesForm.tipe === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                    <Input
                      value={lesForm.video_url}
                      onChange={(e) => setLesForm({ ...lesForm, video_url: e.target.value })}
                      placeholder="https://youtube.com/ of <iframe...>"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inhoud</label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
                      <Button variant="ghost" size="sm" onClick={() => insertMarkdown('**', '**')} title="Bold">
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertMarkdown('*', '*')} title="Italic">
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertMarkdown('\n- ', '')} title="Bulleted List">
                        <List className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertMarkdown('[', '](url)')} title="Link">
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => imageInputRef.current?.click()} title="Image">
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <input
                        type="file"
                        ref={imageInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleInlineImageUpload}
                      />
                    </div>
                    <Textarea
                      id="les-inhoud"
                      value={lesForm.inhoud}
                      onChange={(e) => setLesForm({ ...lesForm, inhoud: e.target.value })}
                      rows={10}
                      placeholder="Les inhoud (Markdown ondersteun)..."
                      className="border-0 focus-visible:ring-0 rounded-none resize-y"
                    />
                  </div>
                </div>

                {editingLes && (lesForm.tipe === 'toets' || lesForm.tipe === 'eksamen') && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-md font-bold text-[#002855] mb-4">Vrae Bestuur</h3>
                    <KvvraagSkepper les={editingLes} />
                  </div>
                )}

                {editingLes && lesForm.tipe === 'opdrag' && (
                  <div className="mt-6 border-t pt-6">
                    <Tabs defaultValue="settings" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="settings">Instellings</TabsTrigger>
                        <TabsTrigger value="submissions">Inskrywings & Merk</TabsTrigger>
                      </TabsList>
                      <TabsContent value="settings">
                        <OpdragSkepper
                          les={editingLes}
                          onUpdate={() => {
                            if (selectedKursus) fetchKursusDetails(selectedKursus.id);
                          }}
                        />
                      </TabsContent>
                      <TabsContent value="submissions">
                        <OpdragMerker les={editingLes} />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Bylaes Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bylaes & Dokumente</label>
                  <div className="space-y-3">
                    {Array.isArray(lesForm.bylaes) && lesForm.bylaes.map((bylae, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <FileIcon className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{bylae.titel}</p>
                            <p className="text-xs text-gray-400">{(bylae.grootte / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => {
                            const newBylaes = [...(lesForm.bylaes || [])];
                            newBylaes.splice(idx, 1);
                            setLesForm({ ...lesForm, bylaes: newBylaes });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                      <label className="cursor-pointer text-center">
                        {uploading ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[#D4A84B] mb-2" />
                            <span className="text-sm text-gray-500">Laai op...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-[#002855]">Laai nuwe lêer op</span>
                            <span className="text-xs text-gray-500 mt-1">PDF, Word, Excel, Prente</span>
                          </div>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowLesModal(false)}>
                  Kanselleer
                </Button>
                <Button
                  className="flex-1 bg-[#D4A84B] text-[#002855]"
                  onClick={handleSaveLes}
                  disabled={saving || !lesForm.titel.trim()}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Stoor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#002855]">Invoer Moodle Kursus</h2>
                  <p className="text-sm text-gray-500">Voer 'n kursus in vanaf 'n Moodle rugsteunlêer</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowImportModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-200">
                  <strong>Instruksies:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li><strong>Opsie 1:</strong> Laai .mbz op na Google Drive, stel "Anyone with the link", plak skakel.</li>
                    <li><strong>Opsie 2:</strong> Laai die .mbz lêer direk op (werk beter as Drive 404 gee).</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Skakel</label>
                  <Input
                    value={driveLink}
                    onChange={(e) => { setDriveLink(e.target.value); setImportFile(null); }}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">of</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Laai .mbz lêer direk op</label>
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".mbz,.imscc,.zip"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setImportFile(f); setDriveLink(''); }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => importFileInputRef.current?.click()}
                  >
                    {importFile ? importFile.name : 'Kies lêer (.mbz, .imscc, .zip)'}
                  </Button>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowImportModal(false); setImportFile(null); }}>Kanselleer</Button>
                  <Button
                    className="flex-1 bg-[#D4A84B] text-[#002855]"
                    onClick={handleImportMoodle}
                    disabled={importing || (!driveLink && !importFile)}
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    Voer in
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LMSKursusBestuur;
