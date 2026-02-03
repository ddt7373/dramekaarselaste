import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { generateFrameworkPrintHtml } from '@/lib/gespreksraamwerkPrint';
import {
  Brain, Target, Heart, Lightbulb, Users, ChevronRight, ChevronLeft,
  MessageCircle, TrendingUp, AlertCircle, CheckCircle2, Loader2,
  BookOpen, Compass, Award, Zap, FileText, RefreshCw, Coffee,
  Flag, Clock, Phone, Shield, HelpCircle, Printer, Share2,
  Play, Pause, ChevronDown, Star, HandHeart, Sparkles, UserCheck,
  BarChart3, PieChart, Globe
} from 'lucide-react';

interface KGVWOpsomming {
  id: string;
  leerder_id: string;
  les_id: string;
  vaardighede_telling: number;
  kennis_telling: number;
  gesindheid_telling: number;
  waardes_telling: number;
  sterkpunte: string[];
  leemtes: string[];
  mentor_raamwerk: any;
  laaste_opdatering: string;
}

interface LeerderData {
  id: string;
  naam: string;
  van: string;
}

interface LesData {
  id: string;
  titel: string;
  inhoud?: string;
  skrifverwysing?: string;
}

interface MentorSKAVAnaliseProps {
  klasId: string;
  klasNaam: string;
  onBack: () => void;
}

type Language = 'af' | 'en';

// Translations - Afrikaans uses KGVW, English uses SKAV
const translations = {
  af: {
    title: 'KGVW Analise',
    subtitle: 'Groep Interaksie Analise',
    back: 'Terug',
    refresh: 'Herlaai',
    framework: 'KGVW Raamwerk',
    frameworkDesc: 'Kennis, Gesindheid, Vaardigheid, Waardes',
    knowledge: 'Kennis',
    knowledgeDesc: 'Feitelike begrip & verstaan',
    attitude: 'Gesindheid',
    attitudeDesc: 'Houdings & gevoelens',
    skill: 'Vaardigheid',
    skillDesc: 'Praktiese toepassing',
    values: 'Waardes',
    valuesDesc: 'Oortuigings & prioriteite',
    groupFramework: 'Groep Gespreksraamwerk',
    groupFrameworkDesc: 'Genereer \'n volledige 5-fase gespreksplan vir die hele klas. Die raamwerk bevat groepsgerigte openingsvrae, erkenning van groepsterkpunte, verdiepingsvrae gebaseer op KGVW leemtes, en afsluitingsvrae wat die leerders help om saam \'n verhouding met God te bou.',
    noLearners: 'Geen leerders in hierdie klas nie',
    addLearnersFirst: 'Voeg eers leerders by die klas om KGVW analise te sien.',
    learnersInClass: 'leerders in die klas',
    dataAvailable: 'Data Beskikbaar',
    noInteractionData: 'Geen interaksie data beskikbaar nie',
    groupStrengths: 'Groep Sterkpunte',
    developmentAreas: 'Areas vir Ontwikkeling',
    generateFramework: 'Genereer Groep Gespreksraamwerk',
    learnersInClassTitle: 'Leerders in Klas',
    interactions: 'interaksies',
    noData: 'Geen data',
    filterByLesson: 'Filter per Les',
    allLessons: 'Alle Lesse',
    preparation: 'Voorbereiding',
    opening: 'Opening',
    recognition: 'Erkenning',
    deepening: 'Verdieping',
    relationship: 'Verhouding',
    closing: 'Afsluiting',
    help: 'Hulp',
    goalOfDiscussion: 'Doel van die Groepsgesprek',
    tone: 'Toon',
    timeframe: 'Tydsraamwerk',
    groupSize: 'Groepgrootte',
    groupDynamicsTips: 'Groepsdinamika Wenke',
    preparationChecklist: 'Voorbereiding Kontrolelys',
    startDiscussion: 'Begin die Groepsgesprek',
    icebreakers: 'Groep Ysbreker Vrae',
    icebreakerTip: 'Laat elkeen \'n beurt kry om te antwoord',
    transitionToLesson: 'Oorgang na die Les',
    whyImportant: 'Hoekom belangrik',
    strengthsToRecognize: 'Groep Sterkpunte om te Erken',
    howToRecognize: 'Hoe om Erkenning in die Groep te Gee',
    avoidInGroup: 'Vermy Dit in Groepsverband',
    groupStrategy: 'Groepstrategie',
    strongArea: 'Groep se Sterk Area',
    developArea: 'Groep se Ontwikkel Area',
    discussionTechniques: 'Groepbespreking Tegnieke',
    coreMessage: 'Kernboodskap',
    relationshipQuestions: 'Groepsvrae oor Verhouding met God',
    groupPrayerOptions: 'Groep Gebed Opsies',
    scriptureReferences: 'Skrifverwysings vir die Groep',
    groupSummary: 'Groep Opsomming',
    groupChallenge: 'Groep Uitdaging vir die Week',
    closingWords: 'Groep Afsluitingswoorde',
    followUpPlan: 'Opvolg Plan',
    difficultSituations: 'Moeilike Groepsituasies',
    facilitationNotes: 'Groepsfasilitering Notas',
    remember: 'Onthou vir Groepsgesprekke',
    boundaries: 'Grense',
    resources: 'Hulpbronne',
    generated: 'Gegenereer',
    close: 'Sluit',
    copyAll: 'Kopieer Alles',
    print: 'Druk',
    copied: 'Gekopieer!',
    textCopied: 'Teks is na die knipbord gekopieer.',
    fullFrameworkCopied: 'Volledige raamwerk is na die knipbord gekopieer.',
    error: 'Fout',
    couldNotLoad: 'Kon nie data laai nie.',
    couldNotGenerate: 'Kon nie gespreksraamwerk genereer nie.',
    selectLanguage: 'Kies Taal',
    group: 'Groep',
    learners: 'leerders',
    goal: 'Doel',
    approach: 'Benadering',
    followUp: 'Opvolg',
    groupTip: 'Groep wenk',
    copy: 'Kopieer',
    signs: 'Tekens',
    emergencyLines: 'Noodlyne',
    application: 'Toepassing',
  },
  en: {
    title: 'SKAV Analysis',
    subtitle: 'Group Interaction Analysis',
    back: 'Back',
    refresh: 'Refresh',
    framework: 'SKAV Framework',
    frameworkDesc: 'Skill, Knowledge, Attitude, Values',
    knowledge: 'Knowledge',
    knowledgeDesc: 'Factual understanding & comprehension',
    attitude: 'Attitude',
    attitudeDesc: 'Attitudes & feelings',
    skill: 'Skill',
    skillDesc: 'Practical application',
    values: 'Values',
    valuesDesc: 'Beliefs & priorities',
    groupFramework: 'Group Conversation Framework',
    groupFrameworkDesc: 'Generate a complete 5-phase conversation plan for the entire class. The framework contains group-oriented opening questions, recognition of group strengths, deepening questions based on SKAV gaps, and closing questions that help students build a relationship with God together.',
    noLearners: 'No learners in this class',
    addLearnersFirst: 'Add learners to the class first to see SKAV analysis.',
    learnersInClass: 'learners in the class',
    dataAvailable: 'Data Available',
    noInteractionData: 'No interaction data available',
    groupStrengths: 'Group Strengths',
    developmentAreas: 'Areas for Development',
    generateFramework: 'Generate Group Conversation Framework',
    learnersInClassTitle: 'Learners in Class',
    interactions: 'interactions',
    noData: 'No data',
    filterByLesson: 'Filter by Lesson',
    allLessons: 'All Lessons',
    preparation: 'Preparation',
    opening: 'Opening',
    recognition: 'Recognition',
    deepening: 'Deepening',
    relationship: 'Relationship',
    closing: 'Closing',
    help: 'Help',
    goalOfDiscussion: 'Goal of the Group Discussion',
    tone: 'Tone',
    timeframe: 'Timeframe',
    groupSize: 'Group Size',
    groupDynamicsTips: 'Group Dynamics Tips',
    preparationChecklist: 'Preparation Checklist',
    startDiscussion: 'Start the Group Discussion',
    icebreakers: 'Group Icebreaker Questions',
    icebreakerTip: 'Let everyone have a turn to answer',
    transitionToLesson: 'Transition to the Lesson',
    whyImportant: 'Why important',
    strengthsToRecognize: 'Group Strengths to Recognize',
    howToRecognize: 'How to Give Recognition in the Group',
    avoidInGroup: 'Avoid This in Group Settings',
    groupStrategy: 'Group Strategy',
    strongArea: 'Group Strong Area',
    developArea: 'Group Development Area',
    discussionTechniques: 'Group Discussion Techniques',
    coreMessage: 'Core Message',
    relationshipQuestions: 'Group Questions about Relationship with God',
    groupPrayerOptions: 'Group Prayer Options',
    scriptureReferences: 'Scripture References for the Group',
    groupSummary: 'Group Summary',
    groupChallenge: 'Group Challenge for the Week',
    closingWords: 'Group Closing Words',
    followUpPlan: 'Follow-up Plan',
    difficultSituations: 'Difficult Group Situations',
    facilitationNotes: 'Group Facilitation Notes',
    remember: 'Remember for Group Discussions',
    boundaries: 'Boundaries',
    resources: 'Resources',
    generated: 'Generated',
    close: 'Close',
    copyAll: 'Copy All',
    print: 'Print',
    copied: 'Copied!',
    textCopied: 'Text copied to clipboard.',
    fullFrameworkCopied: 'Full framework copied to clipboard.',
    error: 'Error',
    couldNotLoad: 'Could not load data.',
    couldNotGenerate: 'Could not generate conversation framework.',
    selectLanguage: 'Select Language',
    group: 'Group',
    learners: 'learners',
    goal: 'Goal',
    approach: 'Approach',
    followUp: 'Follow-up',
    groupTip: 'Group tip',
    copy: 'Copy',
    signs: 'Signs',
    emergencyLines: 'Emergency Lines',
    application: 'Application',
  }
};

// SKAV/KGVW Colors - using internal keys
const CATEGORY_COLORS = {
  knowledge: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', icon: BookOpen },
  attitude: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', icon: Heart },
  skill: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', icon: Target },
  values: { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', icon: Compass }
};

const FASE_ICONS: Record<string, any> = {
  coffee: Coffee,
  award: Award,
  lightbulb: Lightbulb,
  heart: Heart,
  flag: Flag,
  users: Users
};

const FASE_COLORS: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  amber: 'from-amber-500 to-amber-600',
  purple: 'from-purple-500 to-purple-600',
  indigo: 'from-indigo-500 to-indigo-600'
};

const MentorSKAVAnalise: React.FC<MentorSKAVAnaliseProps> = ({ klasId, klasNaam, onBack }) => {
  const { toast } = useToast();

  const [language, setLanguage] = useState<Language>('af');
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [leerders, setLeerders] = useState<LeerderData[]>([]);
  const [lesse, setLesse] = useState<LesData[]>([]);
  const [kgvwData, setKgvwData] = useState<KGVWOpsomming[]>([]);
  const [selectedLes, setSelectedLes] = useState<LesData | null>(null);
  const [showFramework, setShowFramework] = useState(false);
  const [currentFramework, setCurrentFramework] = useState<any>(null);
  const [generatingFramework, setGeneratingFramework] = useState(false);

  // Get category names based on language
  const getCategoryNames = () => {
    if (language === 'af') {
      return {
        knowledge: 'Kennis',
        attitude: 'Gesindheid',
        skill: 'Vaardigheid',
        values: 'Waardes'
      };
    }
    return {
      knowledge: 'Knowledge',
      attitude: 'Attitude',
      skill: 'Skill',
      values: 'Values'
    };
  };

  useEffect(() => {
    fetchData();
  }, [klasId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Class Info and Grade
      const { data: klasData, error: klasError } = await supabase
        .from('geloofsonderrig_klasse')
        .select('graad_id')
        .eq('id', klasId)
        .single();

      if (klasError) throw klasError;

      // 2. Fetch Learners in this class
      const { data: klasLeerders } = await supabase
        .from('geloofsonderrig_klas_leerders')
        .select('leerder_id')
        .eq('klas_id', klasId);

      const leerderIds = klasLeerders?.map(kl => kl.leerder_id) || [];

      if (leerderIds.length > 0) {
        const { data: gebruikers } = await supabase
          .from('gebruikers')
          .select('id, naam, van')
          .in('id', leerderIds);
        setLeerders(gebruikers || []);
      } else {
        setLeerders([]);
      }

      // 3. Fetch ALL relevant lessons for this class's grade
      if (klasData?.graad_id) {
        // First find topics for this grade
        const { data: topics } = await supabase
          .from('geloofsonderrig_onderwerpe')
          .select('id')
          .eq('graad_id', klasData.graad_id);

        const topicIds = topics?.map(t => t.id) || [];

        if (topicIds.length > 0) {
          const { data: allLesse } = await supabase
            .from('geloofsonderrig_lesse')
            .select('id, titel, inhoud, skrifverwysing')
            .in('onderwerp_id', topicIds)
            .order('volgorde');
          setLesse(allLesse || []);
        }
      }

      // 4. Fetch Analysis (SKAV/KGVW) summary for these learners
      if (leerderIds.length > 0) {
        const { data: kgvw } = await supabase
          .from('geloofsonderrig_skav_opsomming')
          .select('*')
          .in('leerder_id', leerderIds);
        setKgvwData(kgvw || []);
      } else {
        setKgvwData([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: t.error, description: t.couldNotLoad, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getKlasKGVW = (lesId?: string) => {
    let filteredData = kgvwData;
    if (lesId) {
      filteredData = kgvwData.filter(s => s.les_id === lesId);
    }

    if (filteredData.length === 0) return null;

    return {
      kennis_telling: filteredData.reduce((sum, d) => sum + (d.kennis_telling || 0), 0),
      gesindheid_telling: filteredData.reduce((sum, d) => sum + (d.gesindheid_telling || 0), 0),
      vaardigheid_telling: filteredData.reduce((sum, d) => sum + (d.vaardighede_telling || 0), 0),
      waardes_telling: filteredData.reduce((sum, d) => sum + (d.waardes_telling || 0), 0),
      sterkpunte: [...new Set(filteredData.flatMap(d => d.sterkpunte || []))],
      leemtes: [...new Set(filteredData.flatMap(d => d.leemtes || []))]
    };
  };

  const getLeerderKGVW = (leerderId: string) => {
    const leerderData = kgvwData.filter(s => s.leerder_id === leerderId);
    // Return zeros for learners with no data so they still appear in the analysis
    if (leerderData.length === 0) {
      return {
        kennis_telling: 0,
        gesindheid_telling: 0,
        vaardigheid_telling: 0,
        waardes_telling: 0
      };
    }
    return {
      kennis_telling: leerderData.reduce((sum, d) => sum + (d.kennis_telling || 0), 0),
      gesindheid_telling: leerderData.reduce((sum, d) => sum + (d.gesindheid_telling || 0), 0),
      vaardigheid_telling: leerderData.reduce((sum, d) => sum + (d.vaardighede_telling || 0), 0),
      waardes_telling: leerderData.reduce((sum, d) => sum + (d.waardes_telling || 0), 0)
    };
  };

  // Helper function for AI calls with retry logic
  const invokeAIWithRetry = async (action: string, data: any, maxRetries = 3): Promise<any> => {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data: result, error } = await supabase.functions.invoke('geloofsonderrig-ai', {
          body: { type: action, data: { ...data, language } }
        });

        if (error) throw error;
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`AI call attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  };

  const generateGroupFramework = async () => {
    console.log('Generating framework starting...');
    setGeneratingFramework(true);
    try {
      const klasKGVW = getKlasKGVW(selectedLes?.id);
      const leerderName = leerders.map(l => `${l.naam} ${l.van}`).join(', ');
      const leerderIds = leerders.map(l => l.id);

      let interaksieVoorbeelde = '';
      if (selectedLes?.id && leerderIds.length > 0) {
        try {
          const { data: logs } = await supabase
            .from('geloofsonderrig_ai_logs')
            .select('user_message, ai_response')
            .eq('les_id', selectedLes.id)
            .in('leerder_id', leerderIds)
            .order('created_at', { ascending: false })
            .limit(10);
          if (logs?.length) {
            interaksieVoorbeelde = logs.map((l: any) => `Vraag: ${(l.user_message || '').substring(0, 150)}...\nAntwoord: ${(l.ai_response || '').substring(0, 200)}...`).join('\n\n---\n\n');
          }
        } catch (_) { /* ignore */ }
      }

      console.log('Calling AI with retry...');
      const result = await invokeAIWithRetry('generate_mentor_framework', {
        leerderNaam: `${t.group}: ${leerderName}`,
        isGroep: true,
        aantalLeerders: leerders.length,
        klasNaam: klasNaam,
        lesTitel: selectedLes?.titel || (language === 'af' ? 'Algemene Groepsgesprek' : 'General Group Discussion'),
        context: selectedLes?.inhoud || '',
        lesInhoud: selectedLes?.inhoud || '',
        interaksieVoorbeelde: interaksieVoorbeelde || undefined,
        skavTellings: {
          kennis: klasKGVW?.kennis_telling || 0,
          gesindheid: klasKGVW?.gesindheid_telling || 0,
          vaardighede: klasKGVW?.vaardigheid_telling || 0,
          waardes: klasKGVW?.waardes_telling || 0
        },
        sterkpunte: klasKGVW?.sterkpunte || [],
        leemtes: klasKGVW?.leemtes || [],
        skrifverwysing: selectedLes?.skrifverwysing || undefined
      });

      console.log('AI Result:', result);

      // Robust extraction: API returns { success, framework, data: { framework } }
      const framework = result?.framework ?? result?.data?.framework ?? (
        result?.data && typeof result.data === 'object' && (result.data.inleiding || result.data.skav_opsomming)
          ? result.data
          : null
      );
      if (result?.success && framework && (framework.inleiding || framework.skav_opsomming || framework.voorbereiding)) {
        setCurrentFramework(framework);
        setShowFramework(true);
      } else {
        console.warn('Framework generation succeeded but framework data is missing:', result);
        toast({
          title: t.error,
          description: language === 'af' ? 'KI het nie \'n volledige raamwerk teruggestuur nie. Probeer weer.' : 'AI did not return a complete framework. Try again.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error in framework generation:', error);
      toast({ title: t.error, description: (error as any).message, variant: 'destructive' });
    } finally {
      setGeneratingFramework(false);
    }
  };


  const renderKGVWChart = (kgvw: any, size: 'sm' | 'lg' = 'lg') => {
    if (!kgvw) return null;

    const total = (kgvw.kennis_telling || 0) + (kgvw.gesindheid_telling || 0) +
      (kgvw.vaardigheid_telling || 0) + (kgvw.waardes_telling || 0);

    if (total === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t.noInteractionData}</p>
        </div>
      );
    }

    const catNames = getCategoryNames();

    const categories = [
      { name: catNames.knowledge, value: kgvw.kennis_telling || 0, ...CATEGORY_COLORS.knowledge },
      { name: catNames.attitude, value: kgvw.gesindheid_telling || 0, ...CATEGORY_COLORS.attitude },
      { name: catNames.skill, value: kgvw.vaardigheid_telling || 0, ...CATEGORY_COLORS.skill },
      { name: catNames.values, value: kgvw.waardes_telling || 0, ...CATEGORY_COLORS.values }
    ];

    return (
      <div className={`space-y-${size === 'lg' ? '4' : '2'}`}>
        {categories.map(cat => {
          const percentage = total > 0 ? Math.round((cat.value / total) * 100) : 0;
          const Icon = cat.icon;
          return (
            <div key={cat.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`${size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'} rounded ${cat.light} flex items-center justify-center`}>
                    <Icon className={`${size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${cat.text}`} />
                  </div>
                  <span className={`font-medium ${size === 'lg' ? 'text-base' : 'text-sm'}`}>{cat.name}</span>
                </div>
                <span className={`font-semibold ${cat.text}`}>{Math.round(cat.value)} ({percentage}%)</span>
              </div>
              <Progress value={percentage} className={size === 'lg' ? 'h-3' : 'h-2'} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderPhaseHeader = (fase: any, faseKey: string) => {
    const Icon = FASE_ICONS[fase.ikoon] || MessageCircle;
    const colorClass = FASE_COLORS[fase.kleur] || 'from-gray-500 to-gray-600';

    return (
      <div className={`bg-gradient-to-r ${colorClass} text-white p-4 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{fase.titel}</h3>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{fase.tydsduur}</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-2 text-white/90 text-sm">{fase.doel}</p>
      </div>
    );
  };

  const renderVraagKaart = (vraag: any, index: number) => (
    <div key={index} className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageCircle className="w-3.5 h-3.5 text-purple-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-800">{vraag.vraag || vraag}</p>
          {vraag.doel && (
            <p className="text-xs text-gray-500 mt-1">{t.goal}: {vraag.doel}</p>
          )}
          {vraag.opvolg && (
            <p className="text-xs text-purple-600 mt-1 italic">{t.followUp}: "{vraag.opvolg}"</p>
          )}
          {vraag.benadering && (
            <p className="text-xs text-amber-600 mt-1">{t.approach}: {vraag.benadering}</p>
          )}
          {vraag.groep_wenk && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {t.groupTip}: {vraag.groep_wenk}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderFrameworkDialog = () => {
    if (!currentFramework) return null;

    const fw = currentFramework;
    const catNames = getCategoryNames();

    // Default tips based on language
    const defaultGroupTips = language === 'af' ? [
      'Moedig stiller leerders aan om te deel deur hulle direk te vra',
      'Gebruik "rond-die-tafel" tegniek waar elkeen \'n beurt kry',
      'Erken elke bydrae positief om veilige ruimte te skep',
      'Laat leerders op mekaar se antwoorde reageer'
    ] : [
      'Encourage quieter learners to share by asking them directly',
      'Use "round-the-table" technique where everyone gets a turn',
      'Acknowledge every contribution positively to create a safe space',
      'Let learners respond to each other\'s answers'
    ];

    const defaultPrepChecklist = language === 'af' ? [
      'Reel stoele in \'n sirkel vir beter groepsinteraksie',
      'Ken elke leerder se naam en agtergrond',
      'Berei ekstra vrae voor vir stiller oomblikke',
      'Sorg vir \'n rustige, private ruimte',
      'Bid vooraf vir wysheid en leiding'
    ] : [
      'Arrange chairs in a circle for better group interaction',
      'Know each learner\'s name and background',
      'Prepare extra questions for quiet moments',
      'Ensure a quiet, private space',
      'Pray beforehand for wisdom and guidance'
    ];

    return (
      <Dialog open={showFramework} onOpenChange={setShowFramework}>
        <DialogContent id="framework-print" className="w-[95vw] max-w-5xl h-[90vh] overflow-hidden flex flex-col p-0 print:!w-full print:!max-w-none print:!h-auto print:!max-h-none print:!overflow-visible print:!p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span>{fw.inleiding?.titel || t.groupFramework}</span>
                  <p className="text-sm font-normal text-white/80 mt-1">{fw.inleiding?.subtitel}</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">{t.group}: {klasNaam}</span>
                <Badge variant="secondary" className="bg-white/20 text-white ml-2">
                  {leerders.length} {t.learners}
                </Badge>
              </div>
              <p className="text-sm text-white/80">
                {leerders.map(l => l.naam).join(', ')}
              </p>
            </div>

            {(() => {
              const klasKGVW = getKlasKGVW(selectedLes?.id);
              const total = (klasKGVW?.kennis_telling || 0) + (klasKGVW?.gesindheid_telling || 0) + (klasKGVW?.vaardigheid_telling || 0) + (klasKGVW?.waardes_telling || 0);
              const counts: Record<string, number> = { knowledge: klasKGVW?.kennis_telling || 0, attitude: klasKGVW?.gesindheid_telling || 0, skill: klasKGVW?.vaardigheid_telling || 0, values: klasKGVW?.waardes_telling || 0 };
              const persentasies: Record<string, number> = total > 0
                ? { knowledge: Math.round((counts.knowledge / total) * 100), attitude: Math.round((counts.attitude / total) * 100), skill: Math.round((counts.skill / total) * 100), values: Math.round((counts.values / total) * 100) }
                : { knowledge: fw.skav_opsomming?.kennis?.persentasie ?? 25, attitude: fw.skav_opsomming?.gesindheid?.persentasie ?? 25, skill: fw.skav_opsomming?.vaardighede?.persentasie ?? 25, values: fw.skav_opsomming?.waardes?.persentasie ?? 25 };
              const entries = Object.entries(counts);
              const sterkste = total > 0 ? entries.reduce((a, b) => (counts[a[0]] >= counts[b[0]] ? a : b))[0] : (fw.skav_opsomming?.sterkste_area || 'kennis');
              const swakste = total > 0 ? entries.reduce((a, b) => (counts[a[0]] <= counts[b[0]] ? a : b))[0] : (fw.skav_opsomming?.swakste_area || 'waardes');
              return (fw.skav_opsomming || total > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {Object.entries(CATEGORY_COLORS).map(([key, config]) => {
                    const displayName = catNames[key as keyof typeof catNames];
                    const Icon = config.icon;
                    const kgvwKey = key === 'knowledge' ? 'kennis' : key === 'attitude' ? 'gesindheid' : key === 'skill' ? 'vaardighede' : 'waardes';
                    const persentasie = total > 0 ? persentasies[key] : (fw.skav_opsomming?.[kgvwKey]?.persentasie ?? 25);
                    const isSterkste = (total > 0 && sterkste === key) || (!total && (fw.skav_opsomming?.sterkste_area === key || fw.skav_opsomming?.sterkste_area === kgvwKey));
                    const isSwakste = (total > 0 && swakste === key) || (!total && (fw.skav_opsomming?.swakste_area === key || fw.skav_opsomming?.swakste_area === kgvwKey));
                    return (
                      <div key={key} className={`p-3 rounded-lg bg-white/10 ${isSterkste ? 'ring-2 ring-green-400' : isSwakste ? 'ring-2 ring-amber-400' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-medium">{displayName}</span>
                          {isSterkste && <Star className="w-3 h-3 text-green-400" />}
                          {isSwakste && <AlertCircle className="w-3 h-3 text-amber-400" />}
                        </div>
                        <p className="text-xl font-bold">{Math.round(counts[key])} ({persentasie}%)</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Een lang bladsy met opskrifte (nie tabs) - nie kopieerbaar, slegs drukbaar */}
            <div id="framework-content" className="flex-1 overflow-y-auto print:overflow-visible print:max-h-none print:block print:break-inside-avoid scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 select-none" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6', userSelect: 'none' }} onCopy={(e) => e.preventDefault()}>
              {/* Voorbereiding */}
              <section className="p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-purple-800 pb-2 border-b-2 border-purple-200">
                  <HelpCircle className="w-5 h-5" />
                  {t.preparation}
                </h2>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        {t.goalOfDiscussion}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{fw.inleiding?.doel}</p>
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-800">
                          <strong>{t.tone}:</strong> {fw.inleiding?.toon}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{t.timeframe}: {fw.inleiding?.tydsraamwerk}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{t.groupSize}: {leerders.length} {t.learners}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        {t.groupDynamicsTips}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(fw.inleiding?.groepsdinamika_wenke || defaultGroupTips).map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        {t.preparationChecklist}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(fw.inleiding?.voorbereiding || defaultPrepChecklist).map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded border-2 border-green-500 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer hover:bg-green-50">
                              <CheckCircle2 className="w-3 h-3 text-green-500 opacity-0 hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* 1. Opening */}
              {fw.fase1_opening && (
              <section className="p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-purple-800 pb-2 border-b-2 border-purple-200">
                  <Coffee className="w-5 h-5" />
                  1. {t.opening}
                </h2>
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                      {renderPhaseHeader(fw.fase1_opening, 'fase1')}
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Play className="w-4 h-4 text-blue-600" />
                            {fw.fase1_opening.begin_so?.titel || t.startDiscussion}
                          </h4>
                          <div className="space-y-2">
                            {(fw.fase1_opening.begin_so?.voorbeelde || []).map((v: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                <span className="text-blue-800 flex-1">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Coffee className="w-4 h-4 text-amber-600" />
                            {t.icebreakers}
                          </h4>
                          <p className="text-sm text-gray-500 mb-3">{t.icebreakerTip}</p>
                          <div className="space-y-2">
                            {(fw.fase1_opening.ysbreker_vrae || []).map((vraag: any, i: number) =>
                              renderVraagKaart(vraag, i)
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-green-600" />
                            {fw.fase1_opening.oorgang_na_les?.titel || t.transitionToLesson}
                          </h4>
                          <div className="space-y-2">
                            {(fw.fase1_opening.oorgang_na_les?.voorbeelde || []).map((v: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                <span className="text-green-800 flex-1">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              )}

              {/* 2. Erkenning */}
              {fw.fase2_erkenning && (
              <section className="p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-purple-800 pb-2 border-b-2 border-purple-200">
                  <Award className="w-5 h-5" />
                  2. {t.recognition}
                </h2>
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                      {renderPhaseHeader(fw.fase2_erkenning, 'fase2')}
                      <CardContent className="p-4 space-y-4">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800">
                            <strong>{t.whyImportant}:</strong> {fw.fase2_erkenning.waarom_belangrik}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            {t.strengthsToRecognize}
                          </h4>
                          <ul className="space-y-2">
                            {(Array.isArray(fw.fase2_erkenning.sterkpunte_om_te_erken) ? fw.fase2_erkenning.sterkpunte_om_te_erken : (typeof fw.fase2_erkenning.sterkpunte_om_te_erken === 'string' ? [fw.fase2_erkenning.sterkpunte_om_te_erken] : [])).map((punt: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <span className="text-amber-800">{punt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-green-600" />
                            {t.howToRecognize}
                          </h4>
                          <div className="space-y-3">
                            {(Array.isArray(fw.fase2_erkenning.hoe_om_te_erken) ? fw.fase2_erkenning.hoe_om_te_erken : (typeof fw.fase2_erkenning.hoe_om_te_erken === 'string' ? [fw.fase2_erkenning.hoe_om_te_erken] : [])).map((item: any, i: number) => (
                              <div key={i} className="border rounded-lg p-3">
                                {typeof item === 'object' && item?.tipe && <Badge variant="outline" className="mb-2">{item.tipe}</Badge>}
                                <p className="text-gray-800 italic mb-2">"{typeof item === 'object' ? (item.voorbeeld || item) : item}"</p>
                                {typeof item === 'object' && item?.waarom && <p className="text-xs text-gray-500">{item.waarom}</p>}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {t.avoidInGroup}
                          </h4>
                          <ul className="space-y-1">
                            {(Array.isArray(fw.fase2_erkenning.vermy_dit) ? fw.fase2_erkenning.vermy_dit : (typeof fw.fase2_erkenning.vermy_dit === 'string' ? [fw.fase2_erkenning.vermy_dit] : [])).map((item: string, i: number) => (
                              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                                <span className="text-red-500">×</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              )}

              {/* 3. Verdieping */}
              {fw.fase3_verdieping && (
              <section className="p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-purple-800 pb-2 border-b-2 border-purple-200">
                  <Lightbulb className="w-5 h-5" />
                  3. {t.deepening}
                </h2>
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                      {renderPhaseHeader(fw.fase3_verdieping, 'fase3')}
                      <CardContent className="p-4 space-y-4">
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>{t.groupStrategy}:</strong> {fw.fase3_verdieping.strategie}
                          </p>
                        </div>

                        {fw.fase3_verdieping.vrae_per_area?.sterkste && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-green-500">{t.strongArea}</Badge>
                              <span className="font-semibold">{fw.fase3_verdieping.vrae_per_area.sterkste.area}</span>
                              <span className="text-sm text-gray-500">({fw.fase3_verdieping.vrae_per_area.sterkste.persentasie}%)</span>
                            </div>
                            <p className="text-sm text-green-700 mb-2">{fw.fase3_verdieping.vrae_per_area.sterkste.status}</p>
                            <div className="space-y-2">
                              {(fw.fase3_verdieping.vrae_per_area.sterkste.vrae || []).map((vraag: any, i: number) =>
                                renderVraagKaart(vraag, i)
                              )}
                            </div>
                          </div>
                        )}

                        {fw.fase3_verdieping.vrae_per_area?.swakste && (
                          <div className="mt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-amber-500">{t.developArea}</Badge>
                              <span className="font-semibold">{fw.fase3_verdieping.vrae_per_area.swakste.area}</span>
                              <span className="text-sm text-gray-500">({fw.fase3_verdieping.vrae_per_area.swakste.persentasie}%)</span>
                            </div>
                            <p className="text-sm text-amber-700 mb-2">{fw.fase3_verdieping.vrae_per_area.swakste.status}</p>
                            <div className="p-3 bg-amber-50 rounded-lg mb-3">
                              <p className="text-sm text-amber-800">{fw.fase3_verdieping.vrae_per_area.swakste.benadering}</p>
                            </div>
                            <div className="space-y-2">
                              {(fw.fase3_verdieping.vrae_per_area.swakste.vrae || []).map((vraag: any, i: number) =>
                                renderVraagKaart(vraag, i)
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            {t.discussionTechniques}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(fw.fase3_verdieping.luister_tegnieke || []).map((tegniek: any, i: number) => (
                              <div key={i} className="p-3 bg-blue-50 rounded-lg">
                                <p className="font-medium text-blue-800">{tegniek.tegniek}</p>
                                <p className="text-sm text-blue-600 italic mt-1">"{tegniek.voorbeeld}"</p>
                                <p className="text-xs text-gray-500 mt-1">{tegniek.doel}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              )}

              {/* 4. Verhouding */}
              {fw.fase4_verhouding && (
              <section className="p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-purple-800 pb-2 border-b-2 border-purple-200">
                  <Heart className="w-5 h-5" />
                  4. {t.relationship}
                </h2>
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                      {renderPhaseHeader(fw.fase4_verhouding, 'fase4')}
                      <CardContent className="p-4 space-y-4">
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-800">
                            <strong>{t.coreMessage}:</strong> {fw.fase4_verhouding.kernboodskap}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            {t.relationshipQuestions}
                          </h4>
                          <div className="space-y-2">
                            {(fw.fase4_verhouding.verhouding_vrae || []).map((vraag: any, i: number) =>
                              renderVraagKaart(vraag, i)
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <HandHeart className="w-4 h-4 text-purple-600" />
                            {t.groupPrayerOptions}
                          </h4>
                          <div className="space-y-3">
                            {(fw.fase4_verhouding.gebed_opsies || []).map((opsie: any, i: number) => (
                              <div key={i} className="border rounded-lg p-3 bg-gradient-to-r from-purple-50 to-indigo-50">
                                <Badge variant="outline" className="mb-2 border-purple-300 text-purple-700">{opsie.tipe}</Badge>
                                <p className="text-sm text-gray-600 mb-2">{opsie.beskrywing}</p>
                                <p className="text-purple-800 italic">"{opsie.voorbeeld}"</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            {t.scriptureReferences}
                          </h4>
                          <div className="space-y-2">
                            {(fw.fase4_verhouding.skrifverwysings || []).map((skrif: any, i: number) => (
                              <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="font-semibold text-blue-800">{skrif.vers}</p>
                                <p className="text-sm text-blue-700 italic mt-1">"{skrif.teks}"</p>
                                <p className="text-xs text-gray-600 mt-2">{t.application}: {skrif.toepassing}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              )}

              {/* 5. Afsluiting */}
              {fw.fase5_afsluiting && (
              <section className="p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-purple-800 pb-2 border-b-2 border-purple-200">
                  <Flag className="w-5 h-5" />
                  5. {t.closing}
                </h2>
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                      {renderPhaseHeader(fw.fase5_afsluiting, 'fase5')}
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            {fw.fase5_afsluiting.opsomming?.titel || t.groupSummary}
                          </h4>
                          <div className="p-3 bg-indigo-50 rounded-lg">
                            <p className="text-indigo-800">{fw.fase5_afsluiting.opsomming?.voorbeeld}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-600" />
                            {t.groupChallenge}
                          </h4>
                          <div className="space-y-3">
                            {(fw.fase5_afsluiting.praktiese_stappe || []).map((stap: any, i: number) => (
                              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-green-700">{i + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">{stap.stap}</p>
                                  <p className="text-sm text-gray-600">{stap.beskrywing}</p>
                                  <p className="text-xs text-green-600 mt-1 italic">"{stap.voorbeeld}"</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            {t.closingWords}
                          </h4>
                          <div className="space-y-2">
                            {(fw.fase5_afsluiting.afsluitingswoorde || []).map((woord: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                                <span className="text-red-800 flex-1 italic">"{woord}"</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <h4 className="font-semibold text-gray-800 mb-2">{fw.fase5_afsluiting.opvolg_plan?.titel || t.followUpPlan}</h4>
                          <ul className="space-y-1">
                            {(fw.fase5_afsluiting.opvolg_plan?.aksies || []).map((aksie: string, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                {aksie}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              )}

              {/* Hulp */}
              <section className="p-4">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-purple-800 pb-2 border-b-2 border-purple-200">
                  <Shield className="w-5 h-5" />
                  {t.help}
                </h2>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-red-600" />
                        {t.difficultSituations}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {(fw.moeilike_situasies?.situasies || []).map((sit: any, i: number) => (
                          <AccordionItem key={i} value={`sit-${i}`}>
                            <AccordionTrigger className="text-left">
                              <span className="font-medium">{sit.situasie}</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                {sit.tekens && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">{t.signs}:</p>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                      {sit.tekens.map((teken: string, j: number) => (
                                        <li key={j} className="flex items-center gap-2">
                                          <AlertCircle className="w-3 h-3 text-amber-500" />
                                          {teken}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">{t.approach}:</p>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {(sit.benadering || []).map((b: string, j: number) => (
                                      <li key={j} className="flex items-start gap-2">
                                        <ChevronRight className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                                        {b}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {sit.noodlyne && (
                                  <div className="p-3 bg-red-50 rounded-lg mt-2">
                                    <p className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                                      <Phone className="w-4 h-4" />
                                      {t.emergencyLines}:
                                    </p>
                                    <ul className="text-sm space-y-1">
                                      {sit.noodlyne.map((n: any, j: number) => (
                                        <li key={j} className="text-red-700">
                                          <strong>{n.naam}:</strong> {n.nommer}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-blue-600" />
                        {t.facilitationNotes}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">{t.remember}:</h4>
                        <ul className="space-y-1">
                          {(fw.mentor_notas?.onthou || []).map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">{t.boundaries}:</h4>
                        <ul className="space-y-1">
                          {(fw.mentor_notas?.grense || []).map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <Shield className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">{t.resources}:</h4>
                        <ul className="space-y-1">
                          {(fw.mentor_notas?.hulpbronne || []).map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </div>

          {/* Footer - verberg by druk */}
          <div className="border-t p-4 bg-gray-50 flex items-center justify-between flex-shrink-0 print:hidden">
            <div className="text-xs text-gray-500">
              {t.generated}: {fw.meta?.gegenereer ? new Date(fw.meta.gegenereer).toLocaleString(language === 'af' ? 'af-ZA' : 'en-US') : new Date().toLocaleString(language === 'af' ? 'af-ZA' : 'en-US')}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFramework(false)}>
                {t.close}
              </Button>
              <Button onClick={() => {
                const klasKGVW = getKlasKGVW(selectedLes?.id);
                const total = (klasKGVW?.kennis_telling || 0) + (klasKGVW?.gesindheid_telling || 0) + (klasKGVW?.vaardigheid_telling || 0) + (klasKGVW?.waardes_telling || 0);
                const counts = { knowledge: klasKGVW?.kennis_telling || 0, attitude: klasKGVW?.gesindheid_telling || 0, skill: klasKGVW?.vaardigheid_telling || 0, values: klasKGVW?.waardes_telling || 0 };
                const persentasies = total > 0
                  ? { knowledge: Math.round((counts.knowledge / total) * 100), attitude: Math.round((counts.attitude / total) * 100), skill: Math.round((counts.skill / total) * 100), values: Math.round((counts.values / total) * 100) }
                  : { knowledge: 25, attitude: 25, skill: 25, values: 25 };
                const entries = Object.entries(counts);
                const sterkste = total > 0 ? entries.reduce((a, b) => (counts[a[0] as keyof typeof counts] >= counts[b[0] as keyof typeof counts] ? a : b))[0] : 'kennis';
                const swakste = total > 0 ? entries.reduce((a, b) => (counts[a[0] as keyof typeof counts] <= counts[b[0] as keyof typeof counts] ? a : b))[0] : 'waardes';
                const defaultGroupTips = language === 'af' ? ['Moedig stiller leerders aan om te deel deur hulle direk te vra', 'Gebruik "rond-die-tafel" tegniek waar elkeen \'n beurt kry', 'Erken elke bydrae positief om veilige ruimte te skep', 'Laat leerders op mekaar se antwoorde reageer'] : ['Encourage quieter learners to share by asking them directly', 'Use "round-the-table" technique where everyone gets a turn', 'Acknowledge every contribution positively to create a safe space', 'Let learners respond to each other\'s answers'];
                const defaultPrepChecklist = language === 'af' ? ['Reel stoele in \'n sirkel vir beter groepsinteraksie', 'Ken elke leerder se naam en agtergrond', 'Berei ekstra vrae voor vir stiller oomblikke', 'Sorg vir \'n rustige, private ruimte', 'Bid vooraf vir wysheid en leiding'] : ['Arrange chairs in a circle for better group interaction', 'Know each learner\'s name and background', 'Prepare extra questions for quiet moments', 'Ensure a quiet, private space', 'Pray beforehand for wisdom and guidance'];
                const html = generateFrameworkPrintHtml({
                  fw,
                  t,
                  language,
                  klasNaam,
                  leerders,
                  catNames,
                  kgvwCounts: counts,
                  kgvwPersentasies: persentasies,
                  sterkste,
                  swakste,
                  defaultGroupTips,
                  defaultPrepChecklist
                });
                const w = window.open('', '_blank');
                if (w) {
                  w.document.write(html);
                  w.document.close();
                  w.focus();
                  setTimeout(() => w.print(), 300);
                }
              }}>
                <Printer className="w-4 h-4 mr-2" />
                {t.print}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const klasKGVW = getKlasKGVW();
  const hasData = klasKGVW && (klasKGVW.kennis_telling + klasKGVW.gesindheid_telling + klasKGVW.vaardigheid_telling + klasKGVW.waardes_telling) > 0;
  const catNames = getCategoryNames();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-5 h-5 mr-1" />{t.back}
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            {t.title}
          </h2>
          <p className="text-gray-600">{klasNaam} - {t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <Select value={language} onValueChange={(val: Language) => setLanguage(val)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="af">Afrikaans</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t.refresh}
        </Button>
      </div>

      {/* Framework Legend */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-900">{t.framework}</span>
            <Badge variant="secondary" className="ml-2">{t.frameworkDesc}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'knowledge', name: catNames.knowledge, desc: t.knowledgeDesc },
              { key: 'attitude', name: catNames.attitude, desc: t.attitudeDesc },
              { key: 'skill', name: catNames.skill, desc: t.skillDesc },
              { key: 'values', name: catNames.values, desc: t.valuesDesc }
            ].map(item => {
              const config = CATEGORY_COLORS[item.key as keyof typeof CATEGORY_COLORS];
              const Icon = config.icon;
              return (
                <div key={item.key} className={`p-3 rounded-lg ${config.light} border border-white`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${config.text}`} />
                    <span className={`text-sm font-semibold ${config.text}`}>{item.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">{t.groupFramework}</h3>
              <p className="text-sm text-blue-700 mt-1">{t.groupFrameworkDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Overview */}
      {leerders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">{t.noLearners}</h3>
            <p className="text-gray-500">{t.addLearnersFirst}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Class Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    {klasNaam}
                  </CardTitle>
                  <CardDescription>{leerders.length} {t.learnersInClass}</CardDescription>
                </div>
                {hasData && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {t.dataAvailable}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {renderKGVWChart(klasKGVW)}

              {klasKGVW && (klasKGVW.sterkpunte?.length > 0 || klasKGVW.leemtes?.length > 0) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {klasKGVW.sterkpunte?.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        {t.groupStrengths}
                      </h4>
                      <ul className="space-y-1">
                        {klasKGVW.sterkpunte.slice(0, 5).map((punt, i) => (
                          <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 mt-1 flex-shrink-0" />
                            {punt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {klasKGVW.leemtes?.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {t.developmentAreas}
                      </h4>
                      <ul className="space-y-1">
                        {klasKGVW.leemtes.slice(0, 5).map((leemte, i) => (
                          <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-1 flex-shrink-0" />
                            {leemte}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 pt-6 border-t">
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-inner mb-2">
                  <p className="text-sm md:text-base text-purple-800 mb-6 text-center font-medium leading-relaxed">
                    {language === 'af'
                      ? "Klik hier om die KGVW analise te doen om jou te help met voorbereiding van die geloofsgespek met jou jou klas."
                      : "Click here to perform the SKAV analysis to help you prepare for the faith discussion with your class."}
                  </p>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-xl hover:shadow-purple-200 transition-all text-lg h-16 rounded-xl group"
                    size="lg"
                    onClick={generateGroupFramework}
                    disabled={generatingFramework}
                  >
                    {generatingFramework ? (
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    ) : (
                      <Brain className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="font-bold">{t.generateFramework}</span>
                    {!generatingFramework && <Sparkles className="w-5 h-5 ml-3 opacity-50" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learners Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                {t.learnersInClassTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {leerders.map(leerder => {
                    const leerderKGVW = getLeerderKGVW(leerder.id);
                    const total = (leerderKGVW?.kennis_telling || 0) + (leerderKGVW?.gesindheid_telling || 0) + (leerderKGVW?.vaardigheid_telling || 0) + (leerderKGVW?.waardes_telling || 0);

                    return (
                      <div key={leerder.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800">{leerder.naam} {leerder.van}</span>
                          {total > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(total)} {t.interactions}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-400">
                              {t.noData}
                            </Badge>
                          )}
                        </div>
                        {leerderKGVW && (
                          <div className="flex gap-1">
                            {total > 0 ? (
                              [
                                { key: 'knowledge', value: leerderKGVW.kennis_telling, color: 'bg-green-500' },
                                { key: 'attitude', value: leerderKGVW.gesindheid_telling, color: 'bg-purple-500' },
                                { key: 'skill', value: leerderKGVW.vaardigheid_telling, color: 'bg-blue-500' },
                                { key: 'values', value: leerderKGVW.waardes_telling, color: 'bg-amber-500' }
                              ].map(cat => {
                                const pct = Math.round((cat.value / total) * 100);
                                return (
                                  <div
                                    key={cat.key}
                                    className={`h-2 rounded-full ${cat.color}`}
                                    style={{ width: `${pct}%` }}
                                    title={`${catNames[cat.key as keyof typeof catNames]}: ${Math.round(cat.value)} (${pct}%)`}
                                  />
                                );
                              })
                            ) : (
                              <p className="text-xs text-gray-400 italic">{language === 'af' ? 'Nog geen interaksies' : 'No interactions yet'}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lesson Filter */}
      {lesse.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.filterByLesson}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedLes === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLes(null)}
              >
                {t.allLessons}
              </Button>
              {lesse.map(les => (
                <Button
                  key={les.id}
                  variant={selectedLes?.id === les.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLes(les)}
                >
                  {les.titel}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Framework Dialog */}
      {renderFrameworkDialog()}

      {/* Custom scrollbar + print styles - net raamwerk-inhoud, geen modal-rame */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        @media print {
          /* Formaat soos info.html - behoorlike marges, geen afsny aan kante */
          @page {
            margin: 2cm;
          }
          body * {
            visibility: hidden;
          }
          #framework-print,
          #framework-print * {
            visibility: visible;
          }
          #framework-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            right: 0 !important;
            width: auto !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 20px 24px !important;
            box-sizing: border-box !important;
          }
          /* Verberg Radix dialog overlay */
          [data-radix-dialog-overlay] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MentorSKAVAnalise;
