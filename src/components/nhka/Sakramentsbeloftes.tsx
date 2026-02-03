import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Heart,
  Baby,
  BookOpen,
  Calendar,
  Sparkles,
  Users,
  Church,
  Gift,
  Star,
  ChevronRight,
  ChevronLeft,
  Bell,
  CheckCircle2,
  Clock,
  Home,
  Route,
  Wrench,
  BookMarked,
  User,
  Plus,
  Droplets,
  Wine,
  Music,
  Flame,
  Sun,
  Moon,
  TreePine,
  Flower2,
  Bird,
  Camera,
  Edit3,
  Trash2,
  Download,
  Share2,
  Settings,
  HelpCircle,
  MessageCircle,
  X,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

const HERO_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/693a23b83be6a3fa1e4a5844_1766918104072_4ea2338d.jpg';

// Phase definitions
const PHASES = [
  { id: 1, name: 'Voorgeboorte', ageRange: 'Swangerskap', icon: Baby, color: 'pink', bgColor: 'bg-pink-50', textColor: 'text-pink-600', borderColor: 'border-pink-200' },
  { id: 2, name: 'Eerste Jaar', ageRange: '0-1 jaar', icon: Heart, color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-500', borderColor: 'border-red-200' },
  { id: 3, name: 'Peuter', ageRange: '1-3 jaar', icon: Sparkles, color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-500', borderColor: 'border-orange-200' },
  { id: 4, name: 'Voorskool', ageRange: '3-6 jaar', icon: Sun, color: 'amber', bgColor: 'bg-amber-50', textColor: 'text-amber-500', borderColor: 'border-amber-200' },
  { id: 5, name: 'Junior Laerskool', ageRange: '6-10 jaar', icon: BookOpen, color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-600', borderColor: 'border-green-200' },
  { id: 6, name: 'Senior Laerskool', ageRange: '10-13 jaar', icon: Star, color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
  { id: 7, name: 'Tiener Junior', ageRange: '13-16 jaar', icon: Flame, color: 'indigo', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600', borderColor: 'border-indigo-200' },
  { id: 8, name: 'Tiener Senior', ageRange: '16-18 jaar', icon: Users, color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-600', borderColor: 'border-purple-200' },
];

// Toolkit categories
const TOOLKIT_CATEGORIES = [
  { id: 'prayer', name: 'Gebede', icon: Heart, color: 'text-red-500' },
  { id: 'bible_story', name: 'Bybelverhale', icon: BookOpen, color: 'text-blue-600' },
  { id: 'communion', name: 'Nagmaal', icon: Wine, color: 'text-purple-600' },
  { id: 'baptism', name: 'Doop', icon: Droplets, color: 'text-cyan-500' },
  { id: 'liturgy', name: 'Liturgiese Jaar', icon: Calendar, color: 'text-amber-500' },
  { id: 'ritual', name: 'Ritme', icon: Sparkles, color: 'text-pink-500' },

  { id: 'music', name: 'Musiek', icon: Music, color: 'text-green-500' },
];

interface Child {
  id: string;
  name: string;
  birth_date: string | null;
  expected_date: string | null;
  baptism_date: string | null;
  first_communion_date: string | null;
  phase: number;
  profile_image_url: string | null;
}

interface JournalEntry {
  id: string;
  child_id: string;
  entry_type: string;
  title: string;
  content: string;
  image_url: string | null;
  date: string;
  phase: number;
  tags: string[];
}

interface ToolkitItem {
  id: string;
  category: string;
  title: string;
  content: string;
  description: string;
  age_groups: string[];
  liturgical_season: string | null;
}

interface PhaseContent {
  id: string;
  phase: number;
  phase_name: string;
  age_range: string;
  baptism_focus: string;
  communion_focus: string;
  development_goals: string[];
  symbolism: string;
  worship_integration: string;
  conversation_themes: string[];
  family_projects: string[];
  weekly_activities: any;
  monthly_activities: any;
  parent_reflections: string[];
}

const Sakramentsbeloftes: React.FC = () => {
  const { currentUser, currentGemeente } = useNHKA();
  const { toast } = useToast();

  // Main navigation state
  const [activeTab, setActiveTab] = useState<'tuis' | 'pad' | 'toolkit' | 'joernaal' | 'profiel'>('tuis');

  // Data states
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [toolkitItems, setToolkitItems] = useState<ToolkitItem[]>([]);
  const [phaseContent, setPhaseContent] = useState<PhaseContent[]>([]);
  const [loading, setLoading] = useState(true);

  // UI states
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const [selectedToolkitCategory, setSelectedToolkitCategory] = useState<string>('prayer');
  const [selectedToolkitItem, setSelectedToolkitItem] = useState<ToolkitItem | null>(null);

  // Form states
  const [newChild, setNewChild] = useState({ name: '', birth_date: '', expected_date: '', baptism_date: '' });
  const [newJournal, setNewJournal] = useState({ title: '', content: '', entry_type: 'reflection' as string, image_url: '' as string });
  const [saving, setSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      // Load children
      const { data: childrenData } = await supabase
        .from('jy_is_myne_children')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });

      if (childrenData) {
        setChildren(childrenData);
        if (childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0]);
        }
      }

      // Load toolkit items
      const { data: toolkitData } = await supabase
        .from('jy_is_myne_toolkit')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (toolkitData) {
        setToolkitItems(toolkitData);
      }

      // Load phase content
      const { data: phaseData } = await supabase
        .from('jy_is_myne_phase_content')
        .select('*')
        .order('phase', { ascending: true });

      if (phaseData) {
        setPhaseContent(phaseData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load journal entries when child changes
  useEffect(() => {
    if (selectedChild) {
      loadJournalEntries();
    }
  }, [selectedChild]);

  const loadJournalEntries = async () => {
    if (!selectedChild) return;

    const { data } = await supabase
      .from('jy_is_myne_journal')
      .select('*')
      .eq('child_id', selectedChild.id)
      .order('date', { ascending: false });

    if (data) {
      setJournalEntries(data);
    }
  };

  // Calculate child's phase based on age
  const calculatePhase = (birthDate: string | null, expectedDate: string | null): number => {
    if (!birthDate && expectedDate) return 1; // Voorgeboorte
    if (!birthDate) return 1;

    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    const ageInYears = ageInMonths / 12;

    if (ageInYears < 1) return 2;
    if (ageInYears < 3) return 3;
    if (ageInYears < 6) return 4;
    if (ageInYears < 10) return 5;
    if (ageInYears < 13) return 6;
    if (ageInYears < 16) return 7;
    return 8;
  };

  // Add new child
  const handleAddChild = async () => {
    if (!currentUser || !newChild.name) return;

    setSaving(true);
    try {
      const phase = calculatePhase(newChild.birth_date || null, newChild.expected_date || null);

      const { data, error } = await supabase
        .from('jy_is_myne_children')
        .insert({
          user_id: currentUser.id,
          gemeente_id: currentGemeente?.id,
          name: newChild.name.trim(),
          birth_date: newChild.birth_date || null,
          expected_date: newChild.expected_date || null,
          baptism_date: newChild.baptism_date || null,
          phase
        })
        .select();

      if (error) {
        console.error('Error adding child:', error);
        toast({ title: 'Fout', description: `Kon nie kind byvoeg nie: ${error.message}`, variant: 'destructive' });
        return;
      }

      const inserted = Array.isArray(data) ? data[0] : data;
      if (inserted) {
        setChildren([...children, inserted]);
        setSelectedChild(inserted);
        setNewChild({ name: '', birth_date: '', expected_date: '', baptism_date: '' });
        setShowAddChild(false);
        toast({ title: 'Sukses', description: 'Kind suksesvol bygevoeg!' });
      }
    } catch (error: any) {
      console.error('Error adding child:', error);
      toast({ title: 'Fout', description: `Kon nie kind byvoeg nie: ${error?.message || 'Onbekende fout'}`, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Add journal entry
  const handleAddJournal = async () => {
    if (!currentUser || !selectedChild || !newJournal.title) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        user_id: currentUser.id,
        child_id: selectedChild.id,
        entry_type: newJournal.entry_type,
        title: newJournal.title,
        content: newJournal.content || '',
        phase: selectedChild.phase,
        date: new Date().toISOString().split('T')[0]
      };
      if (newJournal.image_url) payload.image_url = newJournal.image_url;

      const { data, error } = await supabase
        .from('jy_is_myne_journal')
        .insert(payload)
        .select()
        .single();

      if (error) {
        toast({ title: 'Kon nie stoor nie', description: error.message, variant: 'destructive' });
        return;
      }
      if (data) {
        setJournalEntries([data, ...journalEntries]);
        setNewJournal({ title: '', content: '', entry_type: 'reflection' as string, image_url: '' });
        setShowAddJournal(false);
        toast({ title: 'Inskrywing gestoor', description: 'Jou joernaal-inskrywing is suksesvol bygevoeg.' });
      }
    } catch (error: unknown) {
      console.error('Error adding journal entry:', error);
      toast({ title: 'Fout', description: (error as Error)?.message || 'Kon nie inskrywing stoor nie.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Get today's suggestion based on phase
  const getTodaySuggestion = () => {
    if (!selectedChild) return null;
    const phase = phaseContent.find(p => p.phase === selectedChild.phase);
    if (!phase) return null;

    const dayOfWeek = new Date().getDay();
    const weekKey = `week${(dayOfWeek % 4) + 1}`;
    return phase.weekly_activities?.[weekKey] || 'Bid saam met jou kind vandag.';
  };

  // Render Home Tab
  const renderTuis = () => {
    const suggestion = getTodaySuggestion();
    const currentPhase = selectedChild ? PHASES.find(p => p.id === selectedChild.phase) : null;

    return (
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden">
          <img src={HERO_IMAGE} alt="Jy is Myne" className="w-full h-48 md:h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002855]/90 via-[#002855]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Badge className="bg-[#D4A84B] text-[#002855] mb-2">
              <Droplets className="w-3 h-3 mr-1" />
              Sakramentsbeloftes
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              "Jy is Myne"
            </h1>
            <p className="text-white/80 text-sm mt-1 max-w-lg">
              Hierdie funksie help jou om jou sakramentsbeloftes na te kom en jou kind se geloofsreis te begelei vanaf voorgeboorte tot volwassenheid.
            </p>
          </div>
        </div>

        {/* Informasie Seksie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-[#D4A84B]/20 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
              <Droplets className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="font-bold text-[#002855] leading-tight mb-1">God se inisiatief in die verbond</h3>
            <p className="text-[#D4A84B] font-bold text-xs uppercase tracking-wider mb-2">Doopfokus</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Verstaan en vier die doop as God se belofte dat jou kind aan Hom behoort.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-[#D4A84B]/20 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
              <Wine className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-[#002855] leading-tight mb-1">Voorbereiding vir die tafel</h3>
            <p className="text-[#D4A84B] font-bold text-xs uppercase tracking-wider mb-2">Nagmaalfokus</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Help jou kind om die nagmaal te verstaan en voor te berei vir deelname.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-[#D4A84B]/20 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
              <Route className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-bold text-[#002855] leading-tight mb-1">Van voorgeboorte tot volwassenheid</h3>
            <p className="text-[#D4A84B] font-bold text-xs uppercase tracking-wider mb-2">18-Jaar Verbondspad</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              8 lewensfases met aktiwiteite, gesprekke en rituele vir elke ouderdom.
            </p>
          </div>
        </div>

        {children.length > 0 ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-gray-600">Kies Kind</Label>
                <Button variant="ghost" size="sm" onClick={() => setShowAddChild(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Voeg By
                </Button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedChild?.id === child.id
                      ? 'bg-[#002855] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-2 border-[#D4A84B]">
            <CardContent className="p-6 text-center">
              <Baby className="w-12 h-12 text-[#D4A84B] mx-auto mb-3" />
              <h3 className="font-bold text-[#002855] mb-2">Voeg Jou Kind By</h3>
              <p className="text-sm text-gray-600 mb-4">
                Begin jou geloofsreis deur jou kind se inligting by te voeg.
              </p>
              <Button onClick={() => setShowAddChild(true)} className="bg-[#D4A84B] hover:bg-[#c49a3d] text-[#002855]">
                <Plus className="w-4 h-4 mr-2" />
                Voeg Kind By
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Phase Card */}
        {selectedChild && currentPhase && (
          <Card className={`${currentPhase.bgColor} ${currentPhase.borderColor} border-2`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                  <currentPhase.icon className={`w-6 h-6 ${currentPhase.textColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Huidige Fase</p>
                  <h3 className={`font-bold ${currentPhase.textColor}`}>{currentPhase.name}</h3>
                  <p className="text-sm text-gray-600">{currentPhase.ageRange}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedPhase(selectedChild.phase); setActiveTab('pad'); }}
                  className={currentPhase.textColor}
                >
                  Sien Meer
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Suggestion */}
        {suggestion && (
          <Card className="bg-gradient-to-br from-[#002855] to-[#003d7a] text-white">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#D4A84B] rounded-lg">
                  <Sparkles className="w-5 h-5 text-[#002855]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">Vandag se Voorstel</h3>
                  <p className="text-white/90 text-sm">{suggestion}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Balanced between Doop and Nagmaal */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('pad')}>
            <CardContent className="p-4 text-center">
              <Route className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Verbondspad</h4>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('toolkit')}>
            <CardContent className="p-4 text-center">
              <Wrench className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Hulp</h4>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedToolkitCategory('baptism'); setActiveTab('toolkit'); }}>
            <CardContent className="p-4 text-center">
              <Droplets className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Doopbeloftes</h4>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedToolkitCategory('communion'); setActiveTab('toolkit'); }}>
            <CardContent className="p-4 text-center">
              <Wine className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Nagmaalbeloftes</h4>
            </CardContent>
          </Card>
        </div>

        {/* Recent Journal */}
        {journalEntries.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-[#D4A84B]" />
                Onlangse Inskrywings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {journalEntries.slice(0, 3).map(entry => (
                  <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{entry.title}</h4>
                      <span className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString('af-ZA')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{entry.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };



  // Render Verbondspad Tab
  const renderPad = () => {
    const currentPhaseContent = selectedPhase ? phaseContent.find(p => p.phase === selectedPhase) : null;
    const currentPhaseInfo = selectedPhase ? PHASES.find(p => p.id === selectedPhase) : null;

    if (selectedPhase && currentPhaseContent && currentPhaseInfo) {
      return (
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => setSelectedPhase(null)} className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Terug na Fases
          </Button>

          {/* Phase Header */}
          <Card className={`${currentPhaseInfo.bgColor} ${currentPhaseInfo.borderColor} border-2`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-xl shadow-sm">
                  <currentPhaseInfo.icon className={`w-8 h-8 ${currentPhaseInfo.textColor}`} />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${currentPhaseInfo.textColor}`}>
                    {currentPhaseContent.phase_name}
                  </h2>
                  <p className="text-gray-600">{currentPhaseContent.age_range}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doop Fokus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-500" />
                Doop Fokus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{currentPhaseContent.baptism_focus}</p>
            </CardContent>
          </Card>

          {/* Nagmaal Fokus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wine className="w-5 h-5 text-purple-600" />
                Nagmaal Fokus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{currentPhaseContent.communion_focus}</p>
            </CardContent>
          </Card>

          {/* Development Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Ontwikkelingsdoelwitte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentPhaseContent.development_goals?.map((goal, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className={`w-5 h-5 ${currentPhaseInfo.textColor} flex-shrink-0 mt-0.5`} />
                    <span className="text-gray-700">{goal}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Conversation Themes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Gesprekstemas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentPhaseContent.conversation_themes?.map((theme, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm py-1 px-3">
                    {theme}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Family Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Familieprojekte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentPhaseContent.family_projects?.map((project, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Gift className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{project}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Parent Reflections */}
          <Card className="bg-gradient-to-br from-[#002855] to-[#003d7a] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Heart className="w-5 h-5 text-[#D4A84B]" />
                Ouerrefleksies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {currentPhaseContent.parent_reflections?.map((reflection, idx) => (
                  <li key={idx} className="text-white/90 italic">
                    "{reflection}"
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#002855]">Verbondspad</h2>
          <p className="text-gray-600">18 Jaar van Geloofsvorming</p>
        </div>

        {/* Phase Progress */}
        {selectedChild && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Vordering: {selectedChild.name}</span>
                <span className="text-sm text-gray-500">Fase {selectedChild.phase} van 8</span>
              </div>
              <Progress value={(selectedChild.phase / 8) * 100} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* All Phases */}
        <div className="space-y-3">
          {PHASES.map((phase) => {
            const isCurrentPhase = selectedChild?.phase === phase.id;
            const isPastPhase = selectedChild ? selectedChild.phase > phase.id : false;

            return (
              <Card
                key={phase.id}
                className={`cursor-pointer transition-all hover:shadow-md ${isCurrentPhase ? `${phase.bgColor} ${phase.borderColor} border-2` : ''
                  } ${isPastPhase ? 'opacity-60' : ''}`}
                onClick={() => setSelectedPhase(phase.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${phase.bgColor}`}>
                      <phase.icon className={`w-6 h-6 ${phase.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#002855]">{phase.name}</h3>
                        {isCurrentPhase && (
                          <Badge className="bg-[#D4A84B] text-[#002855] text-xs">Huidig</Badge>
                        )}
                        {isPastPhase && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{phase.ageRange}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Toolkit Tab
  const renderToolkit = () => {
    const filteredItems = toolkitItems.filter(item => item.category === selectedToolkitCategory);

    if (selectedToolkitItem) {
      return (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setSelectedToolkitItem(null)}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Terug
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{selectedToolkitItem.title}</CardTitle>
              {selectedToolkitItem.description && (
                <CardDescription>{selectedToolkitItem.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {selectedToolkitItem.content.split('\n').map((line, idx) => (
                  <p key={idx} className="text-gray-700 mb-2">{line}</p>
                ))}
              </div>

              {selectedToolkitItem.age_groups && selectedToolkitItem.age_groups.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-500 mb-2">Geskik vir:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedToolkitItem.age_groups.map((age, idx) => (
                      <Badge key={idx} variant="outline">{age}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#002855]">Hulp</h2>
          <p className="text-gray-600">Hulpbronne vir Huisgeloof</p>

        </div>

        {/* Category Tabs */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {TOOLKIT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedToolkitCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedToolkitCategory === cat.id
                  ? 'bg-[#002855] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <cat.icon className={`w-4 h-4 ${selectedToolkitCategory === cat.id ? 'text-white' : cat.color}`} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedToolkitItem(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-[#002855]">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Geen items in hierdie kategorie nie.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  // Render Joernaal Tab
  const renderJoernaal = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#002855]">Joernaal</h2>
            <p className="text-gray-600">Geloofsgroeiboek</p>
          </div>
          {selectedChild && (
            <Button onClick={() => setShowAddJournal(true)} className="bg-[#D4A84B] hover:bg-[#c49a3d] text-[#002855]">
              <Plus className="w-4 h-4 mr-2" />
              Nuwe Inskrywing
            </Button>
          )}
        </div>

        {!selectedChild ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Voeg eers 'n kind by om die joernaal te gebruik.</p>
              <Button onClick={() => setShowAddChild(true)} className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Voeg Kind By
              </Button>
            </CardContent>
          </Card>
        ) : journalEntries.length === 0 ? (
          <Card className="border-dashed border-2 border-[#D4A84B]">
            <CardContent className="p-8 text-center">
              <BookMarked className="w-12 h-12 text-[#D4A84B] mx-auto mb-3" />
              <h3 className="font-bold text-[#002855] mb-2">Begin Jou Joernaal</h3>
              <p className="text-gray-600 mb-4">
                Teken mylpale, gebede, refleksies en spesiale oomblikke aan.
              </p>
              <Button onClick={() => setShowAddJournal(true)} className="bg-[#D4A84B] hover:bg-[#c49a3d] text-[#002855]">
                <Plus className="w-4 h-4 mr-2" />
                Eerste Inskrywing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Entry Type Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['Alles', 'Mylpaal', 'Refleksie', 'Gebed', 'Foto'].map(type => (
                <Badge
                  key={type}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                >
                  {type}
                </Badge>
              ))}
            </div>

            {/* Entries */}
            {journalEntries.map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {entry.entry_type === 'milestone' ? 'Mylpaal' :
                            entry.entry_type === 'reflection' ? 'Refleksie' :
                              entry.entry_type === 'prayer' ? 'Gebed' :
                                entry.entry_type === 'photo' ? 'Foto' : entry.entry_type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.date).toLocaleDateString('af-ZA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#002855]">{entry.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{entry.content}</p>
                      {entry.image_url && (
                        <img src={entry.image_url} alt="" className="mt-2 rounded-lg max-h-48 object-cover w-full" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Export Button */}
            <Card className="bg-gray-50">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Laai jou volledige geloofsjoernaal af as 'n 18-jaar boek
                </p>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Laai Joernaal Af
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  // Render Profiel Tab
  const renderProfiel = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#002855]">Profiel</h2>
          <p className="text-gray-600">Jou Gesin & Instellings</p>
        </div>

        {/* User Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#002855] flex items-center justify-center text-white text-2xl font-bold">
                {currentUser?.naam?.charAt(0) || 'G'}
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#002855]">{currentUser?.naam || 'Gebruiker'}</h3>
                <p className="text-sm text-gray-500">{currentGemeente?.naam || 'Geen gemeente'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">My Kinders</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddChild(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Voeg By
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {children.length > 0 ? (
              <div className="space-y-3">
                {children.map(child => {
                  const phase = PHASES.find(p => p.id === child.phase);
                  return (
                    <div key={child.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${phase?.bgColor || 'bg-gray-100'}`}>
                        {phase ? <phase.icon className={`w-5 h-5 ${phase.textColor}`} /> : <Baby className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{child.name}</h4>
                        <p className="text-xs text-gray-500">
                          {phase?.name} ({phase?.ageRange})
                        </p>
                      </div>
                      {child.baptism_date && (
                        <Badge variant="outline" className="text-xs">
                          <Droplets className="w-3 h-3 mr-1" />
                          Gedoop
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Geen kinders bygevoeg nie.</p>
            )}
          </CardContent>
        </Card>

        {/* Gemeente Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Church className="w-5 h-5 text-[#D4A84B]" />
              Gemeente Koppeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentGemeente ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">{currentGemeente.naam}</p>
                  <p className="text-sm text-gray-500">Gekoppel</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Nie aan 'n gemeente gekoppel nie.</p>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardContent className="p-0">
            <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="flex-1 text-left">Kennisgewings</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b">
              <Settings className="w-5 h-5 text-gray-500" />
              <span className="flex-1 text-left">Instellings</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
              <HelpCircle className="w-5 h-5 text-gray-500" />
              <span className="flex-1 text-left">Hulp & Ondersteuning</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A84B]" />
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Main Content */}
      <div className="max-w-lg mx-auto">
        {activeTab === 'tuis' && renderTuis()}
        {activeTab === 'pad' && renderPad()}
        {activeTab === 'toolkit' && renderToolkit()}
        {activeTab === 'joernaal' && renderJoernaal()}
        {activeTab === 'profiel' && renderProfiel()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto flex">
          {[
            { id: 'tuis', label: 'Tuis', icon: Home },
            { id: 'pad', label: 'Pad', icon: Route },
            { id: 'toolkit', label: 'Hulp', icon: Wrench },
            { id: 'joernaal', label: 'Joernaal', icon: BookMarked },
            { id: 'profiel', label: 'Profiel', icon: User },

          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center py-3 transition-colors ${activeTab === tab.id
                ? 'text-[#002855]'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#D4A84B]' : ''}`} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Child Dialog */}
      <Dialog open={showAddChild} onOpenChange={setShowAddChild}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Voeg Kind By</DialogTitle>
            <DialogDescription>
              Vul die inligting hieronder in om 'n nuwe kind by te voeg.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Naam *</Label>
              <Input
                value={newChild.name}
                onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                placeholder="Kind se naam"
              />
            </div>
            <div>
              <Label>Geboortedatum (indien reeds gebore)</Label>
              <Input
                type="date"
                value={newChild.birth_date}
                onChange={(e) => setNewChild({ ...newChild, birth_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Verwagte datum (indien swanger)</Label>
              <Input
                type="date"
                value={newChild.expected_date}
                onChange={(e) => setNewChild({ ...newChild, expected_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Doopdatum (indien gedoop)</Label>
              <Input
                type="date"
                value={newChild.baptism_date}
                onChange={(e) => setNewChild({ ...newChild, baptism_date: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddChild(false)} className="flex-1">
                Kanselleer
              </Button>
              <Button
                onClick={handleAddChild}
                disabled={!newChild.name || saving}
                className="flex-1 bg-[#D4A84B] hover:bg-[#c49a3d] text-[#002855]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Voeg By'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Journal Dialog */}
      <Dialog open={showAddJournal} onOpenChange={setShowAddJournal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuwe Joernaal Inskrywing</DialogTitle>
            <DialogDescription>
              Skryf 'n nuwe inskrywing in jou geloofsjoernaal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipe</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { id: 'milestone', label: 'Mylpaal' },
                  { id: 'reflection', label: 'Refleksie' },
                  { id: 'prayer', label: 'Gebed' },
                  { id: 'photo', label: 'Foto' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setNewJournal({ ...newJournal, entry_type: type.id })}
                    className={`px-3 py-1.5 rounded-full text-sm ${newJournal.entry_type === type.id
                      ? 'bg-[#002855] text-white'
                      : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Titel *</Label>
              <Input
                value={newJournal.title}
                onChange={(e) => setNewJournal({ ...newJournal, title: e.target.value })}
                placeholder="Gee jou inskrywing 'n titel"
              />
            </div>
            <div>
              <Label>Inhoud</Label>
              <Textarea
                value={newJournal.content}
                onChange={(e) => setNewJournal({ ...newJournal, content: e.target.value })}
                placeholder="Skryf jou gedagtes, gebede of herinneringe..."
                rows={4}
              />
            </div>
            <div>
              <Label>Foto (opsioneel)</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="journal-photo"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !currentUser) return;
                    try {
                      const ext = file.name.split('.').pop() || 'jpg';
                      const path = `jy-is-myne/${currentUser.id}/${selectedChild?.id || 'general'}/${Date.now()}.${ext}`;
                      const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('jy-is-myne-fotos')
                        .upload(path, file, { upsert: true });
                      if (uploadError) throw uploadError;
                      const { data: urlData } = supabase.storage.from('jy-is-myne-fotos').getPublicUrl(uploadData.path);
                      setNewJournal(prev => ({ ...prev, image_url: urlData.publicUrl }));
                      toast({ title: 'Foto gelaai', description: 'Die foto is gereed om by te voeg.' });
                    } catch (err: unknown) {
                      toast({ title: 'Kon nie foto laai nie', description: (err as Error)?.message, variant: 'destructive' });
                    }
                    e.target.value = '';
                  }}
                />
                <label htmlFor="journal-photo" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm">
                  <Camera className="w-4 h-4" />
                  {newJournal.image_url ? 'Verander foto' : 'Kies foto'}
                </label>
                {newJournal.image_url && (
                  <div className="relative">
                    <img src={newJournal.image_url} alt="Voorgeskou" className="h-10 w-10 object-cover rounded-lg" />
                    <button type="button" onClick={() => setNewJournal(prev => ({ ...prev, image_url: '' }))} className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddJournal(false)} className="flex-1">
                Kanselleer
              </Button>
              <Button
                onClick={handleAddJournal}
                disabled={!newJournal.title || saving}
                className="flex-1 bg-[#D4A84B] hover:bg-[#c49a3d] text-[#002855]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Stoor'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sakramentsbeloftes;
