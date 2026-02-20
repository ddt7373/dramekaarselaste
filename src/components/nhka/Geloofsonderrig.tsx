import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import MindMap from './MindMap';
import MentorSKAVAnalise from './MentorSKAVAnalise';
import QuizComponent from './QuizComponent';
import VerseComponent from './VerseComponent';
import {
  Share2, Plus, Sparkles, GraduationCap, ChevronLeft, ChevronRight, UserPlus, Trash2, Heart, Target, Zap, BookOpen, MessageCircle, Compass, Users, Award, Lightbulb, Brain, Phone, Mail, Copy, LogOut, Home, Loader2, Search, X, CheckCircle2, TrendingUp, CreditCard,
  Upload, FileText, AlertCircle, Check, Edit, Video, Book, Eye, MoreVertical, Facebook, Twitter, Instagram, Network,
  PenLine,
  Image as ImageIcon, Globe, Languages, Download, File, AlertTriangle, Camera
} from 'lucide-react';
import {
  Graad, GeloofsonderrigOnderwerp, GeloofsonderrigLes, GeloofsonderrigVraag,
  GeloofsonderrigKlas, GeloofsonderrigKlasLeerder, GeloofsonderrigVordering,
  GeneratedImage, LesVisualisering, Gebruiker
} from '@/types/nhka';
// ==================== TRANSLATIONS ====================
const translations = {
  af: {
    // Landing Page
    landing: {
      badge: 'KI-Ondersteunde Leer',
      title: 'KI-Kats',
      subtitle: 'KI-Kategese: Kunsmatige Intelligensie Ondersteunde Geloofsonderrig',
      description: 'Ontdek \'n lewende verhouding met God deur interaktiewe lesse.',
      mentorButton: 'Ek is \'n Mentor',
      learnerButton: 'Ek is \'n Leerder',
      languageSelect: 'Kies Taal',
      whatIsKiog: 'Wat is KI-Kats?',
      kiogDescription: 'KI-Kats (KI-Kategese) is \'n innoverende platform wat spesifiek ontwerp is vir hoerskool leerders en hul mentors. Dit gebruik kunsmatige intelligensie om geloofsonderrig meer interaktief, persoonlik en betekenisvol te maak.',
      forWhom: 'Vir Wie is KI-Kats?',
      forLearners: 'Hoerskool Leerders',
      forLearnersDesc: 'Leerders verken geloofsinhoud deur interaktiewe gesprekke met KI, skep visualiserings, en bou \'n dieper begrip van hul geloof.',
      forMentors: 'Mentors & Kategete',
      forMentorsDesc: 'Mentors ontvang gedetailleerde KGVW-analise en volledige gespreksraamwerke om betekenisvolle groepsgesprekke te fasiliteer.',
      howItWorks: 'Hoe Werk Dit?',
      step1Title: 'Interaktiewe Lesse',
      step1Desc: 'Leerders werk deur lesse met KI-gegenereerde vrae wat hulle help om dieper te dink.',
      step2Title: 'KGVW Analise',
      step2Desc: 'Die sisteem analiseer leerders se interaksies volgens Kennis, Gesindheid, Vaardigheid en Waardes.',
      step3Title: 'Mentor Raamwerk',
      step3Desc: 'Mentors ontvang \'n volledige 5-fase gespreksraamwerk vir groepsgesprekke.',
      step4Title: 'Groei in Geloof',
      step4Desc: 'Leerders word begelei om \'n persoonlike verhouding met God te bou.',
      features: 'Kenmerke',
      feature1: 'KI-Vrae',
      feature1Desc: 'Persoonlike vrae gebaseer op lesinhoud',
      feature2: 'Ontdekkingsleer',
      feature2Desc: 'Ontdek waarheid deur interaksie',
      feature3: 'Sosiale Deel',
      feature3Desc: 'Deel insigte met vriende',
      feature4: 'Breinkaarte',
      feature4Desc: 'Visuele voorstellings van konsepte',
      feature5: 'Groepsanalise',
      feature5Desc: 'KGVW analise vir die hele klas',
      feature6: 'Gespreksraamwerk',
      feature6Desc: '5-fase raamwerk vir mentors',
      startNow: 'Begin Nou',
      selectRole: 'Kies jou rol om te begin:',
    },
    // Common
    common: {
      back: 'Terug',
      nextLesson: 'Volgende les',
      home: 'Tuis',
      leave: 'Verlaat',
      cancel: 'Kanselleer',
      save: 'Stoor',
      delete: 'Verwyder',
      edit: 'Wysig',
      create: 'Skep',
      loading: 'Laai...',
      error: 'Fout',
      success: 'Sukses',
      copied: 'Gekopieer!',
      close: 'Sluit',
      refresh: 'Herlaai',
      print: 'Druk',
      share: 'Deel',
    },
    // Mentor
    mentor: {
      dashboard: 'Mentor Paneelbord',
      dashboardDesc: 'Bestuur jou klasse en leerders',
      manageClasses: 'Lesse Bestuur',
      newClass: 'Nuwe Klas',
      classes: 'Klasse',
      learners: 'Leerders',
      topics: 'Onderwerpe',
      yourClasses: 'Jou Klasse',
      clickToManage: 'Klik op \'n klas om leerders te bestuur',
      noClasses: 'Jy het nog geen klasse nie.',
      createFirstClass: 'Skep Jou Eerste Klas',
      kgvwAnalysis: 'KGVW Analise',
      createClass: 'Skep Klas',
      className: 'Klas Naam',
      classDescription: 'Beskrywing (Opsioneel)',
      createLearner: 'Voeg Leerder By',
      searchMember: 'Soek Lidmaat uit Gemeente',
      orAddNew: 'OF VOEG NUWE LEERDER BY',
      bulkImport: 'Bulk Invoer',
      learnersInClass: 'Leerders in Klas',
      noLearnersRegistered: 'Geen leerders geregistreer nie',
      learnersRegistered: 'leerders geregistreer',
      noLearnersInClass: 'Geen leerders in hierdie klas nie',
      createLearnerManually: 'Voeg leerders by uit die lidmaatlys, of skep nuwe leerders as hulle nie op die register is nie.',
      noDescription: 'Geen beskrywing',
      copy: 'Kopieer',
    },
    // Learner
    learner: {
      topics: 'Onderwerpe',
      topicsDesc: 'Kies \'n onderwerp om te begin',
      yourProgress: 'Jou Vordering',
      lessonsCompleted: 'Lesse voltooi',
      aiExploration: 'KI-Ondersteunde Verkenning',
      aiExplorationDesc: 'Verken hierdie les met die hulp van KI. Vra vrae oor die les en kry antwoorde wat jou help om die inhoud beter te verstaan.',
      startExploration: 'Begin Verkenning',
      progress: 'Vordering',
      questions: 'vrae',
      images: 'prente',
      answerMore: 'Beantwoord nog',
      toComplete: 'om die les te voltooi',
      completeLesson: 'Voltooi Les',
      moreQuestions: 'Nog',
      whatNext: 'Wat wil jy volgende weet?',
      chooseQuestion: 'Kies \'n vraag om te begin:',
      thinking: 'Ek dink na...',
      yourArtworks: 'Jou Kunswerke',
      createMindMap: 'Verduidelik met \'n prent',
      generateImage: 'Genereer Prent',
      creating: 'Skep...',
      interactiveExploration: 'Interaktiewe Verkenning',
      shareToFacebook: 'Deel op Facebook',
      downloadImage: 'Laai Prent Af',
      addDescription: 'Voeg beskrywing by',
      includeMyName: 'Sluit my naam in',
      descriptionPlaceholder: 'Beskryf wat hierdie prent vir jou beteken...',
      shareInstructions: 'Laai die prent af en deel dit op die kerk se Facebook bladsy',
      leaderboard: 'Ranglys',
      yourRank: 'Jou posisie',
      yourPoints: 'Jou punte',
      completedLessons: 'Voltooide lesse',
    },
    // Errors
    errors: {
      aiError: 'KI fout',
      aiErrorDesc: 'Kon nie met die KI kommunikeer nie. Probeer asseblief weer.',
      networkError: 'Netwerk fout',
      networkErrorDesc: 'Kontroleer jou internetverbinding en probeer weer.',
      tryAgain: 'Probeer Weer',
    },
    // Mode labels
    mode: {
      mentor: 'Mentor Modus',
      learner: 'Leerder Modus',
    },
    // Form labels
    form: {
      name: 'Naam',
      surname: 'Van',
      phone: 'Selfoon (Opsioneel)',
      email: 'E-pos (Opsioneel)',
      firstName: 'Voornaam',
    },
    // Lesson labels
    lesson: {
      notComplete: 'Nie Klaar Nie',
      mustUsePrompts: 'Jy moet ten minste 10 prompts gebruik. Jy het',
      used: 'gebruik.',
      complete: 'Les Voltooi!',
      wellDone: 'Baie geluk!',
      mindMapCreated: 'Prent Geskep!',
      noMindMapData: 'Geen prent data beskikbaar nie',
      mindMap: 'Prent Verduideliking',
    },
    // Class labels
    class: {
      created: 'Klas geskep!',
      codeIs: 'Jou klaskode is',
      invalidCode: 'Ongeldige klaskode',
      alreadyMember: 'Jy is reeds deel van hierdie klas',
      learnerCreated: 'Leerder Geskep!',
      learnerRemoved: 'Leerder Verwyder',
      fillNameSurname: 'Vul asseblief die naam en van in.',
      confirmRemove: 'Is jy seker jy wil',
      removeSuffix: 'verwyder?',
    },
  },
  en: {
    // Landing Page
    landing: {
      badge: 'AI-Supported Learning',
      title: 'KI-Kats',
      subtitle: 'KI-Kategese: Artificial Intelligence Supported Faith Education',
      description: 'Discover a living relationship with God through interactive lessons.',
      mentorButton: 'I am a Mentor',
      learnerButton: 'I am a Learner',
      languageSelect: 'Select Language',
      whatIsKiog: 'What is KI-Kats?',
      kiogDescription: 'KI-Kats (KI-Kategese) is an innovative platform specifically designed for high school students and their mentors. It uses artificial intelligence to make faith education more interactive, personal, and meaningful.',
      forWhom: 'Who is KI-Kats For?',
      forLearners: 'High School Students',
      forLearnersDesc: 'Students explore faith content through interactive conversations with AI, create visualizations, and build a deeper understanding of their faith.',
      forMentors: 'Mentors & Catechists',
      forMentorsDesc: 'Mentors receive detailed SKAV analysis and complete conversation frameworks to facilitate meaningful group discussions.',
      howItWorks: 'How Does It Work?',
      step1Title: 'Interactive Lessons',
      step1Desc: 'Students work through lessons with AI-generated questions that help them think deeper.',
      step2Title: 'SKAV Analysis',
      step2Desc: 'The system analyzes student interactions according to Skill, Knowledge, Attitude, and Values.',
      step3Title: 'Mentor Framework',
      step3Desc: 'Mentors receive a complete 5-phase conversation framework for group discussions.',
      step4Title: 'Growth in Faith',
      step4Desc: 'Students are guided to build a personal relationship with God.',
      features: 'Features',
      feature1: 'AI Questions',
      feature1Desc: 'Personal questions based on lesson content',
      feature2: 'Discovery Learning',
      feature2Desc: 'Discover truth through interaction',
      feature3: 'Social Sharing',
      feature3Desc: 'Share insights with friends',
      feature4: 'Mind Maps',
      feature4Desc: 'Visual representations of concepts',
      feature5: 'Group Analysis',
      feature5Desc: 'SKAV analysis for the entire class',
      feature6: 'Conversation Framework',
      feature6Desc: '5-phase framework for mentors',
      startNow: 'Start Now',
      selectRole: 'Choose your role to begin:',
    },
    // Common
    common: {
      back: 'Back',
      nextLesson: 'Next lesson',
      home: 'Home',
      leave: 'Leave',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      copied: 'Copied!',
      close: 'Close',
      refresh: 'Refresh',
      print: 'Print',
      share: 'Share',
    },
    // Mentor
    mentor: {
      dashboard: 'Mentor Dashboard',
      dashboardDesc: 'Manage your classes and students',
      manageClasses: 'Manage Lessons',
      newClass: 'New Class',
      classes: 'Classes',
      learners: 'Learners',
      topics: 'Topics',
      yourClasses: 'Your Classes',
      clickToManage: 'Click on a class to manage students',
      noClasses: 'You have no classes yet.',
      createFirstClass: 'Create Your First Class',
      kgvwAnalysis: 'SKAV Analysis',
      createClass: 'Create Class',
      className: 'Class Name',
      classDescription: 'Description (Optional)',
      createLearner: 'Add Learner',
      searchMember: 'Search Member from Congregation',
      orAddNew: 'OR ADD NEW LEARNER',
      bulkImport: 'Bulk Import',
      learnersInClass: 'Learners in Class',
      noLearnersRegistered: 'No learners registered',
      learnersRegistered: 'learners registered',
      noLearnersInClass: 'No learners in this class',
      createLearnerManually: 'Add learners from the member list, or create new learners if they are not on the register.',
      noDescription: 'No description',
      copy: 'Copy',
    },
    // Learner
    learner: {
      topics: 'Topics',
      topicsDesc: 'Choose a topic to begin',
      yourProgress: 'Your Progress',
      lessonsCompleted: 'Lessons completed',
      aiExploration: 'AI-Supported Exploration',
      aiExplorationDesc: 'Explore this lesson with the help of AI. Ask questions about the lesson and get answers that help you understand the content better.',
      startExploration: 'Start Exploration',
      progress: 'Progress',
      questions: 'questions',
      images: 'images',
      answerMore: 'Answer',
      toComplete: 'more to complete the lesson',
      completeLesson: 'Complete Lesson',
      moreQuestions: 'More',
      whatNext: 'What do you want to know next?',
      chooseQuestion: 'Choose a question to start:',
      thinking: 'Thinking...',
      yourArtworks: 'Your Artworks',
      createMindMap: 'Explain with an image',
      generateImage: 'Generate Image',
      creating: 'Creating...',
      interactiveExploration: 'Interactive Exploration',
      shareToFacebook: 'Share to Facebook',
      downloadImage: 'Download Image',
      addDescription: 'Add description',
      includeMyName: 'Include my name',
      descriptionPlaceholder: 'Describe what this image means to you...',
      shareInstructions: 'Download the image and share it on the church Facebook page',
      leaderboard: 'Leaderboard',
      yourRank: 'Your position',
      yourPoints: 'Your points',
      completedLessons: 'Completed lessons',
    },
    // Errors
    errors: {
      aiError: 'AI Error',
      aiErrorDesc: 'Could not communicate with AI. Please try again.',
      networkError: 'Network Error',
      networkErrorDesc: 'Check your internet connection and try again.',
      tryAgain: 'Try Again',
    },
    // Mode labels
    mode: {
      mentor: 'Mentor Mode',
      learner: 'Learner Mode',
    },
    // Form labels
    form: {
      name: 'Name',
      surname: 'Surname',
      phone: 'Phone (Optional)',
      email: 'Email (Optional)',
      firstName: 'First name',
    },
    // Lesson labels
    lesson: {
      notComplete: 'Not Complete',
      mustUsePrompts: 'You must use at least 10 prompts. You have used',
      used: '',
      complete: 'Lesson Complete!',
      wellDone: 'Well done!',
      mindMapCreated: 'Mind Map Created!',
      noMindMapData: 'No mind map data available',
      mindMap: 'Mind Map',
    },
    // Class labels
    class: {
      created: 'Class created!',
      codeIs: 'Your class code is',
      invalidCode: 'Invalid class code',
      alreadyMember: 'You are already part of this class',
      learnerCreated: 'Learner Created!',
      learnerRemoved: 'Learner Removed',
      fillNameSurname: 'Please fill in name and surname.',
      confirmRemove: 'Are you sure you want to remove',
      removeSuffix: '?',
    },
  }
};


type Language = 'af' | 'en';

// Language Context
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.af;
}>({
  language: 'af',
  setLanguage: () => { },
  t: translations.af
});

const useLanguage = () => useContext(LanguageContext);

// Types moved to @/types/nhka.ts

interface BulkLeerder {
  naam: string;
  van: string;
  selfoon?: string;
  epos?: string;
  isValid: boolean;
  error?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  skavAnalysis?: { category: string; confidence: number; reasoning: string };
  suggestedPrompts?: string[];
  suggestedImagePrompt?: string;
}

interface MindMapShareState {
  betekenis: string;
  includeNaam: boolean;
}

// LesVisualisering moved to types

type AppMode = 'home' | 'mentor' | 'leerder';
type MentorView = 'dashboard' | 'klas-detail' | 'lesse-bestuur' | 'skav-analise';
type LeerderView = 'onderwerpe' | 'les' | 'les-verken' | 'prente';

const Geloofsonderrig: React.FC = () => {
  const { toast } = useToast();
  const { currentUser, currentGemeente, language: appLanguage, processGeloofsonderrigBetaling } = useNHKA();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Local Language State (independent of App Layout for now, or sync?)
  // For now, keeping the local context pattern as per existing code
  const [language, setLanguage] = useState<Language>('af');

  const t = translations[language];

  const [mode, setMode] = useState<AppMode>('home');
  const [mentorView, setMentorView] = useState<MentorView>('dashboard');
  const [leerderView, setLeerderView] = useState<LeerderView>('onderwerpe');

  const [grades, setGrades] = useState<Graad[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);

  const [onderwerpe, setOnderwerpe] = useState<GeloofsonderrigOnderwerp[]>([]);
  const [lesse, setLesse] = useState<GeloofsonderrigLes[]>([]);
  const [allLesse, setAllLesse] = useState<GeloofsonderrigLes[]>([]); // All lessons for progress bars
  const [vrae, setVrae] = useState<GeloofsonderrigVraag[]>([]);
  const [klasse, setKlasse] = useState<GeloofsonderrigKlas[]>([]);
  const [vordering, setVordering] = useState<GeloofsonderrigVordering[]>([]);
  const [hasGeloofsonderrigBetaal, setHasGeloofsonderrigBetaal] = useState(false);
  const [showGeloofsonderrigPayView, setShowGeloofsonderrigPayView] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [klasLeerders, setKlasLeerders] = useState<GeloofsonderrigKlasLeerder[]>([]);
  const [leerderBetaalStatus, setLeerderBetaalStatus] = useState<Record<string, boolean>>({});

  const [selectedOnderwerp, setSelectedOnderwerp] = useState<GeloofsonderrigOnderwerp | null>(null);
  const [selectedLes, setSelectedLes] = useState<GeloofsonderrigLes | null>(null);
  const [selectedKlas, setSelectedKlas] = useState<GeloofsonderrigKlas | null>(null);

  // Les Verkenning State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [currentKGVW, setCurrentKGVW] = useState<'Kennis' | 'Gesindheid' | 'Vaardigheid' | 'Waardes'>('Kennis');
  const [availablePrompts, setAvailablePrompts] = useState<string[]>([]);
  const [freeInput, setFreeInput] = useState('');

  // KGVW Tracking State
  const [kgvwTellings, setKgvwTellings] = useState({ kennis: 0, gesindheid: 0, vaardigheid: 0, waardes: 0 });

  // Completion Criteria State
  const [quizQuestions, setQuizQuestions] = useState<{ question: string, options: string[], correctIndex: number }[]>([]);
  const [answeredQuizCount, setAnsweredQuizCount] = useState(0);
  const [quizState, setQuizState] = useState<Record<number, boolean>>({});

  const [bibleVerses, setBibleVerses] = useState<{ reference: string, text: string }[]>([]);
  // Track individual verse completion status
  const [verseState, setVerseState] = useState<Record<number, boolean>>({});
  const [completedVersesCount, setCompletedVersesCount] = useState(0);

  const [ownQuestionsCount, setOwnQuestionsCount] = useState(0);
  const [completionSlideData, setCompletionSlideData] = useState<any>(null);
  const [showCompletionVideo, setShowCompletionVideo] = useState(false);
  const [isDemoCompletion, setIsDemoCompletion] = useState(false);

  // Mind Map / Infographic State
  const [showMindMap, setShowMindMap] = useState(false);
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [infographicSvg, setInfographicSvg] = useState<string | null>(null); // NEW: SVG support
  const [generatingMindMap, setGeneratingMindMap] = useState(false);
  const [generatingAIImageForIndex, setGeneratingAIImageForIndex] = useState<number | null>(null);
  const [selectedImageForView, setSelectedImageForView] = useState<LesVisualisering | null>(null);
  const [verseToOpen, setVerseToOpen] = useState<number | undefined>(undefined);
  const [showMindMapShare, setShowMindMapShare] = useState(false);
  const [mindMapShare, setMindMapShare] = useState<MindMapShareState>({ betekenis: '', includeNaam: false });

  // Legacy image generation state
  const [visualiseringCount, setVisualiseringCount] = useState(0);
  const [lesVisualiserings, setLesVisualiserings] = useState<LesVisualisering[]>([]);
  const [suggestedImagePrompt, setSuggestedImagePrompt] = useState<string | null>(null);
  const [generatingLesImage, setGeneratingLesImage] = useState(false);
  const [shareImage, setShareImage] = useState<LesVisualisering | null>(null);
  const [shareBetekenis, setShareBetekenis] = useState('');
  const [shareIncludeNaam, setShareIncludeNaam] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Verkenning Modal (bo-oor alles, soos Vrae/Quiz)
  const [showVerkenningModal, setShowVerkenningModal] = useState(false);

  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  // Verse State
  const [showVerses, setShowVerses] = useState(false);
  const [versesLoading, setVersesLoading] = useState(false);
  const [lessonVerses, setLessonVerses] = useState<{ reference: string, text: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingLeerders, setLoadingLeerders] = useState(false);
  const [showCreateKlas, setShowCreateKlas] = useState(false);
  const [showCreateLeerder, setShowCreateLeerder] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [newKlasNaam, setNewKlasNaam] = useState('');
  const [newKlasBeskrywing, setNewKlasBeskrywing] = useState('');

  // Member Selection State
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [selectedLidmaatId, setSelectedLidmaatId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  const [newLeerderNaam, setNewLeerderNaam] = useState('');
  const [newLeerderVan, setNewLeerderVan] = useState('');
  const [newLeerderSelfoon, setNewLeerderSelfoon] = useState('');
  const [newLeerderEpos, setNewLeerderEpos] = useState('');

  // Bulk invoer state
  const [bulkText, setBulkText] = useState('');
  const [bulkLeerders, setBulkLeerders] = useState<BulkLeerder[]>([]);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);

  const [currentVraagIndex, setCurrentVraagIndex] = useState(0);
  const [antwoorde, setAntwoorde] = useState<Record<string, string>>({});
  const [kiTerugvoer, setKiTerugvoer] = useState<Record<string, string>>({});
  const [loadingTerugvoer, setLoadingTerugvoer] = useState(false);

  const isMentorOrAdmin = currentUser?.rol === 'hoof_admin' || currentUser?.rol === 'geloofsonderrig_admin' || klasse.some(k => k.mentor_id === currentUser?.id);
  const isHoofAdmin = currentUser?.rol === 'hoof_admin' || currentUser?.rol === 'geloofsonderrig_admin';

  // Leaderboard state (leerder sien almal se punte, sonder name)
  const [leaderboardEntries, setLeaderboardEntries] = useState<{ rang: number; totaal_punte: number; is_current_user: boolean }[]>([]);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [leaderboardPoints, setLeaderboardPoints] = useState<number>(0);

  // Volgende les waarskuwing (nog nie voltooi nie + betaal prompt)
  const [showVolgendeLesWarning, setShowVolgendeLesWarning] = useState(false);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    fetchOnderwerpe();
    fetchGrades();
    if (currentUser) {
      fetchKlasse();
      fetchVordering();
      fetchGeneratedImages();
      fetchAvailableMembers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (onderwerpe.length > 0) {
      const ids = onderwerpe.map(o => o.id);
      supabase.from('geloofsonderrig_lesse').select('*').in('onderwerp_id', ids).eq('aktief', true).order('volgorde').then(({ data }) => setAllLesse(data || []));
    } else setAllLesse([]);
  }, [onderwerpe]);

  useEffect(() => {
    if (selectedOnderwerp) fetchLesse(selectedOnderwerp.id);
  }, [selectedOnderwerp]);

  // Geheime sneltoets: Ctrl+Shift+M = demo les-voltooiingskerm (gedig & musiek)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key?.toLowerCase() === 'm') {
        e.preventDefault();
        if (mode === 'leerder') openDemoCompletion();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode]);

  useEffect(() => {
    if (selectedLes) {
      fetchVrae(selectedLes.id);
      setCurrentVraagIndex(0);
      setAntwoorde({});
      setKiTerugvoer({});
    }
  }, [selectedLes]);

  // Helper function for AI calls with retry logic
  const invokeAIWithRetry = async (action: string, data: any, maxRetries = 3): Promise<any> => {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Map frontend actions to backend expectations
        let body: any = {};

        // Common logging params
        if (data.leerderId) body.leerderId = data.leerderId;
        if (data.lesId) body.lesId = data.lesId;
        if (data.chatHistory) body.chatHistory = data.chatHistory;

        if (action === 'email_share') {
          body = { type: 'email_share', ...data };
        } else if (action === 'generate_mindmap') {
          body = { ...body, type: 'mindmap', prompt: data.targetCheck.prompt, context: data.lesInhoud };
        } else if (action === 'infographic') {
          body = { ...body, type: 'infographic', prompt: data.targetCheck.prompt, context: data.lesInhoud };
        } else if (action === 'generate_prompts') {
          body = {
            ...body,
            type: 'prompts',
            prompt: 'generate',
            context: data.lesInhoud,
            promptCount: data.promptCount ?? 0,
            usedPrompts: data.usedPrompts ?? []
          };
        } else if (action === 'quiz') {
          body = { ...body, type: 'quiz', context: data.lesInhoud };
        } else if (action === 'verses') {
          body = { ...body, type: 'verses', context: data.lesInhoud };
        } else if (action === 'generate_image') {
          body = {
            ...body,
            type: 'generate_image',
            answerText: data.answerText ?? data.answer ?? '',
            promptText: data.promptText ?? data.prompt ?? '',
            lesInhoud: data.lesInhoud
          };
        } else if (action === 'generate_poem') {
          body = {
            ...body,
            type: 'generate_poem',
            lesInhoud: data.lesInhoud,
            lesTitel: data.lesTitel,
            language: data.language
          };
        } else if (action === 'generate_music') {
          body = {
            ...body,
            type: 'generate_music',
            poem: data.poem,
            poemText: data.poemText,
            lesInhoud: data.lesInhoud,
            lesTitel: data.lesTitel
          };
        } else {
          // Default: lesson_chat
          body = {
            ...body,
            type: 'chat',
            prompt: data.userMessage || data.prompt,
            context: data.lesInhoud,
            chatHistory: data.chatHistory,
            promptCount: data.promptCount ?? 1
          };
        }

        const { data: result, error } = await supabase.functions.invoke('geloofsonderrig-ai', { body });

        if (error) throw error;
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`AI call attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw lastError;
  };

  // Generate Quiz Questions
  const generateQuiz = async () => {
    console.log('Generating quiz starting...');
    if (!selectedLes || quizQuestions.length > 0) return; // Already generated

    setQuizLoading(true);
    try {
      const result = await invokeAIWithRetry('quiz', {
        lesInhoud: selectedLes.inhoud,
        lesTitel: selectedLes.titel,
        lesId: selectedLes.id,
        leerderId: currentUser?.id
      });

      console.log('Quiz Result:', result);

      const prompts = result?.data?.prompts || result?.prompts;
      if (result?.success && Array.isArray(prompts)) {
        setQuizQuestions(prompts.slice(0, 5)); // Quiz moet 5/5 wees
      } else {
        console.warn('Quiz generation completed but prompts are missing:', result);
        toast({
          title: 'Fout',
          description: 'Kon nie quiz genereer nie. Die data is onvolledig.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie quiz genereer nie. Probeer asseblief weer.',
        variant: 'destructive'
      });
    } finally {
      setQuizLoading(false);
    }
  };

  // Generate Verses
  const generateVerses = async () => {
    console.log('Generating verses starting...');
    if (!selectedLes || lessonVerses.length > 0) return; // Already generated

    setVersesLoading(true);
    try {
      const result = await invokeAIWithRetry('verses', {
        lesInhoud: selectedLes.inhoud,
        lesTitel: selectedLes.titel,
        lesId: selectedLes.id,
        leerderId: currentUser?.id
      });

      console.log('Verses Result:', result);

      const verses = result?.data?.verses || result?.verses;
      if (result?.success && Array.isArray(verses)) {
        setLessonVerses(verses);
        setBibleVerses(verses);
      } else {
        console.warn('Verse generation completed but verses are missing:', result);
        toast({
          title: 'Fout',
          description: 'Kon nie bybelverse genereer nie. Die data is onvolledig.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Verse generation error:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie bybelverse genereer nie. Probeer asseblief weer.',
        variant: 'destructive'
      });
    } finally {
      setVersesLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const { data } = await supabase.from('geloofsonderrig_grade').select('*').eq('aktief', true).order('volgorde');
      setGrades(data || []);
    } catch (error) { console.error('Error fetching grades:', error); }
  };

  const fetchOnderwerpe = async () => {
    try {
      let query = supabase.from('geloofsonderrig_onderwerpe').select('*').eq('aktief', true).order('volgorde');

      // If we are in learner mode and have a selected grade (from class), filter by it
      if (mode === 'leerder' && currentUser) {
        // Logic to find user's grade from their class could go here, 
        // but for now we fetch all and filter in UI or let them select.
      }

      const { data } = await query;
      setOnderwerpe(data || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchLesse = async (onderwerpId: string) => {
    try {
      const { data } = await supabase.from('geloofsonderrig_lesse').select('*').eq('onderwerp_id', onderwerpId).eq('aktief', true).order('volgorde');
      setLesse(data || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchVrae = async (lesId: string) => {
    try {
      const { data } = await supabase.from('geloofsonderrig_vrae').select('*').eq('les_id', lesId).order('volgorde');
      setVrae(data || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchKlasse = async () => {
    if (!currentUser) return;
    try {
      const { data: mentorKlasse } = await supabase.from('geloofsonderrig_klasse').select('*').eq('mentor_id', currentUser.id).eq('aktief', true);
      const { data: leerderKlasse } = await supabase.from('geloofsonderrig_klas_leerders').select('klas_id').eq('leerder_id', currentUser.id);

      let allKlasse = mentorKlasse || [];
      const klasIds = leerderKlasse?.map(k => k.klas_id) || [];

      if (klasIds.length > 0) {
        const { data: joinedKlasse } = await supabase.from('geloofsonderrig_klasse').select('*').in('id', klasIds).eq('aktief', true);
        if (joinedKlasse) allKlasse = [...allKlasse, ...joinedKlasse];
      }

      for (const klas of allKlasse) {
        const { count } = await supabase.from('geloofsonderrig_klas_leerders').select('*', { count: 'exact', head: true }).eq('klas_id', klas.id);
        klas.leerder_count = count || 0;
      }

      setKlasse(allKlasse);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchVordering = async () => {
    if (!currentUser) return;
    try {
      const { data } = await supabase.rpc('get_geloofsonderrig_vordering_leerder', { p_leerder_id: currentUser.id });
      setVordering(Array.isArray(data) ? data : []);
    } catch (error) { console.error('Error:', error); }
    try {
      const { data: betalingData } = await supabase
        .from('geloofsonderrig_betalings')
        .select('id')
        .eq('leerder_id', currentUser.id)
        .eq('status', 'betaal')
        .limit(1);
      setHasGeloofsonderrigBetaal(!!betalingData?.length);
    } catch { setHasGeloofsonderrigBetaal(false); }
  };

  const fetchLeaderboard = async () => {
    if (!currentUser || mode !== 'leerder') return;
    try {
      const { data, error } = await supabase.rpc('get_geloofsonderrig_leaderboard_leerder', { p_leerder_id: currentUser.id });
      if (!error && Array.isArray(data)) {
        setLeaderboardEntries(data.map((r: any) => ({
          rang: r.rang ?? 0,
          totaal_punte: r.totaal_punte ?? 0,
          is_current_user: r.is_current_user ?? false
        })));
        const myEntry = data.find((r: any) => r.is_current_user);
        if (myEntry) {
          setLeaderboardRank(myEntry.rang ?? null);
          setLeaderboardPoints(myEntry.totaal_punte ?? 0);
        }
      }
    } catch (e) { console.error('Leaderboard fetch:', e); }
  };

  const awardPunte = async (aksie: string, punte: number, lesId?: string) => {
    if (!currentUser) return;
    try {
      await supabase.rpc('insert_geloofsonderrig_punte_leerder', {
        p_leerder_id: currentUser.id,
        p_aksie_tipe: aksie,
        p_punte: punte,
        p_les_id: lesId || null
      });
      setLeaderboardPoints(prev => prev + punte);
      fetchLeaderboard();
    } catch (e) { console.error('Award punte:', e); }
  };

  const fetchGeneratedImages = async () => {
    if (!currentUser) return;
    try {
      const { data } = await supabase.from('geloofsonderrig_prente').select('*').eq('leerder_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
      setGeneratedImages(data || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchKlasLeerders = async (klasId: string) => {
    try {
      const { data: klasLeerderData, error: klasError } = await supabase
        .from('geloofsonderrig_klas_leerders')
        .select('*')
        .eq('klas_id', klasId);

      if (klasError || !klasLeerderData || klasLeerderData.length === 0) {
        setKlasLeerders([]);
        return;
      }

      const leerderIds = klasLeerderData.map(kl => kl.leerder_id);

      const { data: gebruikersData } = await supabase
        .from('gebruikers')
        .select('id, naam, van, selfoon, epos')
        .in('id', leerderIds);

      const formattedData: GeloofsonderrigKlasLeerder[] = klasLeerderData.map(kl => {
        const leerder = gebruikersData?.find(g => g.id === kl.leerder_id);
        return {
          id: kl.id,
          klas_id: kl.klas_id,
          leerder_id: kl.leerder_id,
          joined_at: kl.created_at,
          leerder: leerder ? {
            id: leerder.id,
            naam: leerder.naam,
            van: leerder.van,
            selfoon: leerder.selfoon || undefined,
            epos: leerder.epos || undefined
          } : {
            id: kl.leerder_id,
            naam: 'Onbekend',
            van: '',
            selfoon: undefined,
            epos: undefined
          }
        };
      });

      setKlasLeerders(formattedData);

      // Fetch betaal status vir leerders (vir "Betaal namens" knoppie)
      if (leerderIds.length > 0) {
        const { data: betalingData } = await supabase
          .from('geloofsonderrig_betalings')
          .select('leerder_id')
          .in('leerder_id', leerderIds)
          .eq('status', 'betaal');
        const paidIds = new Set((betalingData || []).map(b => b.leerder_id));
        const statusMap: Record<string, boolean> = {};
        leerderIds.forEach(id => { statusMap[id] = paidIds.has(id); });
        setLeerderBetaalStatus(statusMap);
      } else {
        setLeerderBetaalStatus({});
      }
    } catch (error) {
      console.error('Error in fetchKlasLeerders:', error);
      setKlasLeerders([]);
      setLeerderBetaalStatus({});
    }
  };

  const fetchAvailableMembers = async () => {
    if (!currentGemeente) return;
    try {
      const { data } = await supabase
        .from('gebruikers')
        .select('id, naam, van, selfoon, epos')
        .eq('gemeente_id', currentGemeente.id)
        .eq('rol', 'lidmaat')
        .eq('aktief', true)
        .order('naam');
      setAvailableMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  // Generate quiz and verses when lesson is selected
  useEffect(() => {
    // Genereer quiz en verse wanneer verkenning oop is (modal of les-verken view)
    if (selectedLes && (leerderView === 'les-verken' || showVerkenningModal)) {
      generateQuiz();
      generateVerses();
    }
  }, [selectedLes, leerderView, showVerkenningModal]);

  useEffect(() => {
    if (mode === 'leerder' && currentUser) {
      fetchLeaderboard();
    }
  }, [mode, currentUser]);

  // Refresh vordering en leaderboard wanneer leerder teruggaan na onderwerpe
  useEffect(() => {
    if (mode === 'leerder' && leerderView === 'onderwerpe' && currentUser) {
      fetchVordering();
      fetchLeaderboard();
    }
  }, [mode, leerderView, currentUser]);

  const handleCreateKlas = async () => {
    if (!currentUser || !newKlasNaam.trim()) return;
    setLoading(true);
    try {
      await supabase.from('geloofsonderrig_klasse').insert([{
        mentor_id: currentUser.id,
        gemeente_id: currentGemeente?.id,
        naam: newKlasNaam.trim(),
        beskrywing: newKlasBeskrywing.trim(),
        aktief: true
      }]);
      toast({ title: language === 'af' ? 'Klas geskep!' : 'Class created!' });
      setShowCreateKlas(false);
      setNewKlasNaam('');
      setNewKlasBeskrywing('');
      fetchKlasse();
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const notifyAdminOfNewLearner = async (leerderNaam: string, leerderVan: string) => {
    if (!currentGemeente) return;
    try {
      // Find admins for this gemeente
      const { data: admins } = await supabase
        .from('gebruikers')
        .select('id')
        .eq('gemeente_id', currentGemeente.id)
        .in('rol', ['admin', 'hoof_admin']);

      if (!admins || admins.length === 0) return;

      const title = language === 'af' ? 'Nuwe leerder bygevoeg' : 'New learner added';
      const body = language === 'af'
        ? `${leerderNaam} ${leerderVan} is by 'n geloofsonderrig klas gevoeg maar is nie op die register nie.`
        : `${leerderNaam} ${leerderVan} was added to a faith education class but is not on the register.`;

      // Call push notification function
      await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          body,
          type: 'announcement',
          priority: 'normal',
          gemeente_id: currentGemeente.id,
          target_audience: 'admins',
          sent_by: currentUser?.id
        }
      });
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  };

  const handleCreateLeerder = async () => {
    if (!selectedKlas) return;

    if (selectedLidmaatId) {
      // Add existing member
      setLoading(true);
      try {
        const { data: existing } = await supabase
          .from('geloofsonderrig_klas_leerders')
          .select('id')
          .eq('klas_id', selectedKlas.id)
          .eq('leerder_id', selectedLidmaatId)
          .single();

        if (existing) {
          toast({ title: t.common.error, description: language === 'af' ? 'Hierdie leerder is reeds in die klas.' : 'This learner is already in the class.', variant: 'destructive' });
          setLoading(false);
          return;
        }

        const { data: result, error } = await supabase
          .from('geloofsonderrig_klas_leerders')
          .insert([{ klas_id: selectedKlas.id, leerder_id: selectedLidmaatId }])
          .select('*')
          .single();

        if (error) throw error;

        toast({ title: t.common.success, description: language === 'af' ? 'Leerder bygevoeg!' : 'Learner added!' });
        fetchKlasLeerders(selectedKlas.id);
        setShowCreateLeerder(false);
        setSelectedLidmaatId(null);
      } catch (error: any) {
        toast({ title: t.common.error, description: error.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Manual creation fallback
    if (!newLeerderNaam.trim() || !newLeerderVan.trim()) {
      toast({ title: t.common.error, description: language === 'af' ? 'Kies \'n lidmaat of vul naam en van in.' : 'Select a member or fill in name and surname.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const klasId = selectedKlas.id;

    try {
      const userData = {
        naam: newLeerderNaam.trim(),
        van: newLeerderVan.trim(),
        selfoon: newLeerderSelfoon.trim() || null,
        epos: newLeerderEpos.trim() || null,
        rol: 'lidmaat',
        gemeente_id: currentGemeente?.id || null,
        aktief: true
      };

      const { data: newUser, error: userError } = await supabase
        .from('gebruikers')
        .insert([userData])
        .select('*')
        .single();

      if (userError || !newUser) {
        toast({ title: t.common.error, description: userError?.message || 'Could not create user', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { data: klasLeerderResult, error: klasLeerderError } = await supabase
        .from('geloofsonderrig_klas_leerders')
        .insert([{ klas_id: klasId, leerder_id: newUser.id }])
        .select('*')
        .single();

      if (klasLeerderError) {
        await supabase.from('gebruikers').delete().eq('id', newUser.id);
        toast({ title: t.common.error, description: klasLeerderError.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Notify admin since this is a manual addition
      notifyAdminOfNewLearner(newLeerderNaam.trim(), newLeerderVan.trim());

      toast({ title: language === 'af' ? 'Leerder Geskep & Admin Verwittig!' : 'Learner Created & Admin Notified!', description: `${newLeerderNaam} ${newLeerderVan}` });

      fetchKlasLeerders(klasId);
      setShowCreateLeerder(false);
      setNewLeerderNaam('');
      setNewLeerderVan('');
      setNewLeerderSelfoon('');
      setNewLeerderEpos('');
      fetchAvailableMembers(); // Refresh list
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleRemoveLeerder = async (leerderId: string, leerderNaam: string) => {
    if (!selectedKlas || !confirm(`${language === 'af' ? 'Is jy seker jy wil' : 'Are you sure you want to remove'} ${leerderNaam}?`)) return;
    try {
      await supabase.from('geloofsonderrig_klas_leerders').delete().eq('klas_id', selectedKlas.id).eq('leerder_id', leerderId);
      toast({ title: language === 'af' ? 'Leerder Verwyder' : 'Learner Removed' });
      await fetchKlasLeerders(selectedKlas.id);
      setKlasse(prevKlasse => prevKlasse.map(k => k.id === selectedKlas.id ? { ...k, leerder_count: Math.max((k.leerder_count || 1) - 1, 0) } : k));
      setSelectedKlas(prev => prev ? { ...prev, leerder_count: Math.max((prev.leerder_count || 1) - 1, 0) } : null);
      fetchKlasse();
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    }
  };


  const handleOpenKlasDetail = (klas: GeloofsonderrigKlas) => {
    setSelectedKlas(klas);
    setMentorView('klas-detail');
    fetchKlasLeerders(klas.id);
  };

  // Bulk Upload Logic (Database Storage Version)
  const handleBulkLessonUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedOnderwerp) return;
    setBulkImportLoading(true);

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
            // Remove "data:application/pdf;base64," prefix
            if (result.includes(',')) {
              resolve(result.split(',')[1]);
            } else {
              resolve(result);
            }
          };
          reader.onerror = error => reject(error);
        });

        // 2. Insert into DB (geloofsonderrig_files)
        // We use the authenticated user (mentor/admin) to upload
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

        // 3. Construct Serve URL (pointing to our PHP script)
        const fileUrl = `/api/serve-file.php?id=${fileRecord.id}`;

        // 4. Create Lesson
        await supabase.from('geloofsonderrig_lesse').insert({
          onderwerp_id: selectedOnderwerp.id,
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
      toast({ title: language === 'af' ? 'Sukses' : 'Success', description: `${files.length} lesse opgelaai.` });
      fetchLesse(selectedOnderwerp.id);
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    } finally {
      setBulkImportLoading(false);
    }
  };

  // Les Verkenning Functions - usedPrompts ensures unique prompts each time
  const fetchDynamicPrompts = async (promptCount: number = 0, usedPrompts: string[] = []): Promise<string[]> => {
    if (!selectedLes) return [];

    try {
      const result = await invokeAIWithRetry('generate_prompts', {
        lesInhoud: selectedLes.inhoud,
        lesTitel: selectedLes.titel,
        promptCount,
        usedPrompts
      });

      if (result?.success && result?.data?.prompts && result.data.prompts.length > 0) {
        return result.data.prompts;
      }
    } catch (error) {
      console.error('Error fetching dynamic prompts:', error);
    }

    // Fallback questions based on language
    return language === 'af' ? [
      'Gee my \'n opsomming van hierdie les.',
      'Wat is die hoofboodskap?',
      'Hoe kan ek dit toepas in my lewe?',
      'Hoekom is dit belangrik?',
      'Kan jy \'n voorbeeld gee?'
    ] : [
      'Give me a summary of this lesson.',
      'What is the main message?',
      'How can I apply this in my life?',
      'Why is this important?',
      'Can you give an example?'
    ];
  };

  const fetchLessonExtras = async () => {
    if (!selectedLes) return;

    // Reset state
    setQuizQuestions([]);
    setAnsweredQuizCount(0);
    setQuizState({});
    setBibleVerses([]);
    setVerseState({});
    setLessonVerses([]);
    setCompletedVersesCount(0);
    setOwnQuestionsCount(0);
  };

  const handleQuizAnswer = (qIndex: number, correct: boolean) => {
    if (quizState[qIndex] !== undefined) return; // Already answered

    setQuizState(prev => ({ ...prev, [qIndex]: correct }));
    setAnsweredQuizCount(prev => Math.min(prev + 1, 5)); // Count attempts, not just correct (kinders hoef nie al reg te he nie)
    if (correct) toast({ title: language === 'af' ? 'Korrek! 🎉' : 'Correct! 🎉', className: 'bg-green-500 text-white' });
    else toast({ title: language === 'af' ? 'Probeer die volgende! 💪' : 'Try the next one! 💪', variant: 'default' });
  };

  const handleVerseComplete = (index: number) => {
    setVerseState(prev => {
      const newState = { ...prev, [index]: !prev[index] };

      // Update the total count based on true values in new state
      const count = Object.values(newState).filter(Boolean).length;
      setCompletedVersesCount(Math.min(count, 5));

      if (newState[index]) {
        toast({ title: language === 'af' ? 'Mooi so!' : 'Well done!', className: 'bg-green-500 text-white' });
      }

      return newState;
    });
  };

  const startLesVerkenning = async () => {
    // As les reeds voltooi is, wys voltooiingskerm direk (hervat)
    const alreadyDone = selectedLes && vordering.some(v => v.les_id === selectedLes.id && v.voltooi);
    if (alreadyDone) {
      setCompletionSlideData([{ type: 'outro' }]);
      setIsDemoCompletion(false);
      setShowCompletionVideo(true);
      return;
    }

    const voltooideLesse = vordering.filter(v => v.voltooi).length;
    const isDemoGemeente = currentGemeente?.is_demo ?? false;
    if (!isDemoGemeente && voltooideLesse >= 1 && !hasGeloofsonderrigBetaal) {
      setShowGeloofsonderrigPayView(true);
      return;
    }

    setChatMessages([]);
    setPromptCount(0);
    setOwnQuestionsCount(0);
    setCurrentKGVW('Kennis');
    setAvailablePrompts([]);
    setKgvwTellings({ kennis: 0, gesindheid: 0, vaardigheid: 0, waardes: 0 });
    setQuizQuestions([]);
    setAnsweredQuizCount(0);
    setLessonVerses([]);
    setBibleVerses([]);
    setVerseState({});
    setCompletedVersesCount(0);
    setLesVisualiserings([]);
    setShowVerkenningModal(true); // Oop as modal bo-oor alles (soos Vrae)

    setChatLoading(true);

    if (selectedLes) {
      fetchLessonExtras(); // Trigger side loads

      const initialPrompts = await fetchDynamicPrompts(0, []);
      setAvailablePrompts(initialPrompts);

      const welcomeMessage = language === 'af'
        ? `Welkom by "${selectedLes.titel}"! \n\nEk is hier om jou te help verstaan wat hierdie les beteken. Kies een van die vrae hieronder om te begin - ek sal jou vraag beantwoord gebaseer op die lesinhoud.`
        : `Welcome to "${selectedLes.titel}"! \n\nI'm here to help you understand what this lesson means. Choose one of the questions below to start - I'll answer your question based on the lesson content.`;

      setChatMessages([{
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        suggestedPrompts: initialPrompts
      }]);
    }

    setChatLoading(false);
  };

  const handlePromptSelect = async (selectedPrompt: string) => {
    if (!selectedLes || chatLoading) return;

    setChatLoading(true);
    setAvailablePrompts([]);

    const newUserMessage: ChatMessage = {
      role: 'user',
      content: selectedPrompt,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);

    const newPromptCount = promptCount + 1;
    setPromptCount(newPromptCount);
    awardPunte('prompt', 1, selectedLes?.id);

    try {
      // 1. Try generic AI backend
      const result = await invokeAIWithRetry('chat', {
        prompt: selectedPrompt,
        lesInhoud: selectedLes.inhoud,
        lesTitel: selectedLes.titel,
        skrifverwysing: selectedLes.skrifverwysing,
        chatHistory: [...chatMessages, newUserMessage].slice(-6),
        promptCount: newPromptCount,
        userMessage: selectedPrompt,
        leerderId: currentUser?.id,
        lesId: selectedLes.id
      });

      if (result?.success && result?.data) {
        const aiResponse = result.data;
        const kgvw = aiResponse.kgvw || 'kennis';
        const usedSoFar = [...chatMessages, newUserMessage].flatMap(m =>
          m.role === 'user' ? [m.content] : (m.suggestedPrompts || [])
        ).filter(Boolean);
        setMessageAndPrompts(
          aiResponse.message,
          aiResponse.suggestedImagePrompt,
          aiResponse.nextPrompts || [],
          kgvw,
          selectedPrompt
        );
      } else {
        throw new Error('No data from AI');
      }
    } catch (error: any) {
      console.log('AI fallback triggered');

      // 2. Smart Local Fallback
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate thinking

      const fallbackResponse = generateSmartFallbackResponse(selectedPrompt, selectedLes.inhoud);
      const usedSoFar = chatMessages.flatMap(m =>
        m.role === 'user' ? [m.content] : (m.suggestedPrompts || [])
      ).filter(Boolean);
      const newPrompts = await fetchDynamicPrompts(newPromptCount, usedSoFar);

      setMessageAndPrompts(fallbackResponse, null, newPrompts, 'kennis', selectedPrompt);
    } finally {
      setChatLoading(false);
    }
  };

  const setMessageAndPrompts = (
    content: string,
    imagePrompt: string | null,
    nextPrompts: string[],
    kgvw?: string,
    userPrompt?: string
  ) => {
    // Validate prompts
    let finalPrompts = nextPrompts || [];
    if (finalPrompts.length < 3) {
      const defaults = language === 'af'
        ? ['Hoekom is dit belangrik? 🤔', 'Hoe kan ek dit toepas? 🌟', 'Vertel my iets interessants! ✨']
        : ['Why is this important? 🤔', 'How can I apply this? 🌟', 'Tell me something interesting! ✨'];
      finalPrompts = [...finalPrompts, ...defaults].slice(0, 3);
    }
    setAvailablePrompts(finalPrompts);

    // Update KGVW tellings for mentor analysis
    if (kgvw) {
      const key = kgvw === 'values' ? 'waardes' : kgvw === 'attitude' ? 'gesindheid' : kgvw === 'skill' ? 'vaardigheid' : 'kennis';
      setKgvwTellings(prev => ({ ...prev, [key]: (prev[key as keyof typeof prev] || 0) + 1 }));
      setCurrentKGVW(key === 'kennis' ? 'Kennis' : key === 'gesindheid' ? 'Gesindheid' : key === 'vaardigheid' ? 'Vaardigheid' : 'Waardes');
    }

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: content,
      timestamp: new Date(),
      suggestedImagePrompt: imagePrompt || undefined,
      suggestedPrompts: finalPrompts
    };

    setChatMessages(prev => [...prev, assistantMessage]);
    if (imagePrompt) setSuggestedImagePrompt(imagePrompt);

    // Log to geloofsonderrig_ai_logs for mentor SKAV analysis
    if (currentUser?.id && selectedLes?.id && userPrompt) {
      const kgvwScores: Record<string, number> = { kennis: 0, gesindheid: 0, vaardigheid: 0, values: 0 };
      const k = kgvw === 'values' ? 'values' : kgvw === 'attitude' ? 'gesindheid' : kgvw === 'skill' ? 'vaardigheid' : 'kennis';
      kgvwScores[k] = 1;
      supabase.from('geloofsonderrig_ai_logs').insert({
        leerder_id: currentUser.id,
        les_id: selectedLes.id,
        user_message: userPrompt,
        ai_response: content.substring(0, 2000),
        kgvw_scores: kgvwScores
      }).then(() => { /* fire and forget */ });
    }
  };

  const generateSmartFallbackResponse = (prompt: string, content: string): string => {
    // 1. Clean and split content nicely
    // Remove "HTML-like" chars if any, split by sentence endings.
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    const sentences = cleanContent.match(/[^.!?]+[.!?]+/g) || cleanContent.split('.');
    const validSentences = sentences.map(s => s.trim()).filter(s => s.length > 20);

    const keywords = prompt.toLowerCase().replace(/[?.,!]/g, '').split(' ').filter(w => w.length > 3);

    // 2. Find relevant sentences
    const relevantSentences: string[] = [];
    validSentences.forEach(s => {
      let score = 0;
      keywords.forEach(k => {
        if (s.toLowerCase().includes(k)) score++;
      });
      if (score > 0) relevantSentences.push(s);
    });

    // 3. Construct response
    let selectedText = "";

    if (relevantSentences.length > 0) {
      // Pick RANDOM relevant to ensure variety even with same keywords
      const shuffledRelevant = relevantSentences.sort(() => 0.5 - Math.random());
      selectedText = shuffledRelevant.slice(0, 2).join(' ');
    } else if (validSentences.length > 0) {
      // FALLBACK: Pick a RANDOM sentence from the lesson, not just the first one
      // This ensures it doesn't look like a static prototype
      const randomIndex = Math.floor(Math.random() * validSentences.length);
      selectedText = validSentences[randomIndex];
      // Try to add the next one too for context
      if (validSentences[randomIndex + 1]) {
        selectedText += " " + validSentences[randomIndex + 1];
      }
    } else {
      selectedText = language === 'af' ? "die inhoud van hierdie les." : "the content of this lesson.";
    }

    const intros = language === 'af'
      ? ['Volgens die les:', 'Hier is \'n belangrike punt:', 'Onthou:', 'Die teks sê:']
      : ['According to the lesson:', 'Here is a key point:', 'Remember:', 'The text says:'];
    const intro = intros[Math.floor(Math.random() * intros.length)];

    const outros = language === 'af'
      ? ['Maak dit sin?', 'Wat dink jy hiervan?', 'Hoe voel jy daaroor?', 'Verstaan jy?']
      : ['Does that make sense?', 'What do you think?', 'How do you feel about this?', 'Do you understand?'];
    const outro = outros[Math.floor(Math.random() * outros.length)];

    return `${intro} "${selectedText}" \n\n${outro}`;
  };

  const handleGenerateAIImage = async (msgIndex: number) => {
    if (!selectedLes || generatingAIImageForIndex !== null) return;

    const assistantMsg = chatMessages[msgIndex];
    const userMsg = msgIndex > 0 ? chatMessages[msgIndex - 1] : null;
    if (!assistantMsg || assistantMsg.role !== 'assistant') return;

    setGeneratingAIImageForIndex(msgIndex);
    try {
      const result = await invokeAIWithRetry('generate_image', {
        answerText: assistantMsg.content,
        promptText: userMsg?.role === 'user' ? userMsg.content : '',
        lesInhoud: selectedLes.inhoud
      });

      if (result?.success && result?.data?.imageBase64) {
        const dataUrl = `data:${result.data.mimeType || 'image/png'};base64,${result.data.imageBase64}`;
        const newVis: LesVisualisering = {
          id: Math.random().toString(36).substr(2, 9),
          lesId: selectedLes.id,
          imageUrl: dataUrl,
          prompt: assistantMsg.content.substring(0, 100),
          createdAt: new Date(),
          isAiGenerated: true
        };
        setLesVisualiserings(prev => [...prev, newVis]);
        setSelectedImageForView(newVis);
        awardPunte('visualisering', 5, selectedLes?.id);
        toast({ title: language === 'af' ? 'Prent Geskep!' : 'Image Created!', description: language === 'af' ? 'Hoë kwaliteit KI-prent gegenereer. +5 punte!' : 'High-quality AI image generated. +5 points!' });
      } else {
        throw new Error(result?.error || 'Image generation failed');
      }
    } catch (error: any) {
      toast({ title: t.common.error, description: error?.message || (language === 'af' ? 'Kon nie prent genereer nie.' : 'Could not generate image.'), variant: 'destructive' });
    } finally {
      setGeneratingAIImageForIndex(null);
    }
  };

  const handleGenerateMindMap = async () => {
    if (!selectedLes || generatingMindMap || generatingAIImageForIndex !== null) return;

    const lastAiIdx = [...chatMessages].map((m, i) => ({ m, i })).reverse().find(x => x.m.role === 'assistant')?.i;
    if (lastAiIdx === undefined) {
      toast({ title: language === 'af' ? 'Geen inligting' : 'No information', description: language === 'af' ? 'Vra eers \'n vraag.' : 'Ask a question first.', variant: 'destructive' });
      return;
    }

    // Use AI photorealistic image (not Mermaid flowchart) - geen woorde, hoe kwaliteit
    setGeneratingMindMap(true);
    try {
      await handleGenerateAIImage(lastAiIdx);
    } finally {
      setGeneratingMindMap(false);
    }
  };

  const generateSmartMindMap = (central: string, content: string) => {
    // 1. Central Topic = User Prompt (summarized)
    const centerText = central.length > 20 ? central.substring(0, 20) + '...' : central;

    // 2. Extract Branches from Content
    // Split by common delimiters to find key phrases
    const phrases = content
      .split(/[.:,;?!]/)
      .map(s => s.trim())
      .filter(s => s.length > 5 && s.length < 50)
      .filter(s => !s.match(/^(die|het|is|dat|en|the|and|is|that)$/i)); // Filter simple stopwords if needed

    // Select 3-4 distinct phrases, RANDOMIZED to ensure variety
    const distinctPhrases = [...new Set(phrases)]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);

    const branches = distinctPhrases.map((phrase, idx) => ({
      label: phrase.length > 25 ? phrase.substring(0, 25) + '...' : phrase,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][idx % 4],
      children: [] // Could extract keywords from the phrase for children if complex
    }));

    // Fallback if no good phrases found
    if (branches.length === 0) {
      branches.push({ label: language === 'af' ? 'Insig 1' : 'Insight 1', color: '#3b82f6', children: [] });
      branches.push({ label: language === 'af' ? 'Insig 2' : 'Insight 2', color: '#10b981', children: [] });
    }

    return {
      central: centerText,
      branches
    };
  };

  const handleShareMindMap = () => {
    // Open the share dialog
    setMindMapShare({ betekenis: '', includeNaam: false });
    setShowMindMapShare(true);
  };

  /* Shared Facebook/Email Logic */
  const handleConfirmShare = async () => {
    // If it's a social share simulation (Facebook button clicked)
    // We repurpose this to send an email to prente@dramekaarselaste.co.za

    if (!selectedLes) return;

    try {
      setBulkImportLoading(true);

      // Get the image data
      let imageContent = '';
      if (infographicSvg && infographicSvg.startsWith('<svg')) {
        // It's raw SVG
        imageContent = btoa(unescape(encodeURIComponent(infographicSvg)));
      } else if (infographicSvg && infographicSvg.startsWith('http')) {
        // It's a URL (shouldn't happen with current logic as we fetch text, but just in case)
        imageContent = btoa(infographicSvg);
      } else {
        // Fallback or empty
        imageContent = "";
      }

      // Prepare payload for "Email Share"
      const payload = {
        recipientEmail: 'prente@dramekaarselaste.co.za',
        subject: `Nuwe Kunswerk: ${mindMapShare.includeNaam ? (currentUser?.naam || 'Onbekend') : 'Anoniem'}`,
        senderName: mindMapShare.includeNaam ? (currentUser?.naam || 'Leerder') : 'Anoniem',
        htmlBody: `
            <h2>Nuwe Prent vanaf Geloofsonderrig</h2>
            <p><strong>Leerder:</strong> ${mindMapShare.includeNaam ? (currentUser?.naam + ' ' + currentUser?.van) : 'Anoniem'}</p>
            <p><strong>Les:</strong> ${selectedLes.titel}</p>
            <p><strong>Boodskap/Betekenis:</strong><br/>"${mindMapShare.betekenis}"</p>
            <hr/>
            <p><em>Hierdie epos is outomaties gegenereer toe die leerder "Deel op Facebook" gekies het.</em></p>
         `,
        imageBase64: imageContent
      };

      // Call the backend function
      await invokeAIWithRetry('email_share', payload);

      // Show success - learner feels they shared to social media
      setShowMindMapShare(false);
      toast({
        title: language === 'af' ? 'Dankie!' : 'Thank you!',
        description: language === 'af' ? 'Jou prente sal binnekort op sosiale media verskyn!' : 'Your pictures will appear on social media soon!',
        className: 'bg-blue-600 text-white'
      });

    } catch (error) {
      console.error("Share failed", error);
      toast({ title: 'Fout', description: 'Kon nie deel nie. Probeer weer.', variant: 'destructive' });
    } finally {
      setBulkImportLoading(false);
    }
  };



  const getOnderwerpProgress = (onderwerpId: string) => {
    const onderwerpLesse = allLesse.filter(l => l.onderwerp_id === onderwerpId);
    if (onderwerpLesse.length === 0) return 0;
    const voltooide = vordering.filter(v => {
      const oid = v.onderwerp_id ?? allLesse.find(l => l.id === v.les_id)?.onderwerp_id;
      return oid === onderwerpId && v.voltooi;
    }).length;
    return Math.round((voltooide / onderwerpLesse.length) * 100);
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Heart: <Heart className="w-5 h-5" />,
      Target: <Target className="w-5 h-5" />,
      Zap: <Zap className="w-5 h-5" />,
      BookOpen: <BookOpen className="w-5 h-5" />,
      MessageCircle: <MessageCircle className="w-5 h-5" />,
      Compass: <Compass className="w-5 h-5" />,
      Users: <Users className="w-5 h-5" />,
      Award: <Award className="w-5 h-5" />,
      Lightbulb: <Lightbulb className="w-5 h-5" />,
      Brain: <Brain className="w-5 h-5" />,
    };
    return icons[iconName] || <BookOpen className="w-5 h-5" />;
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderHome = () => (
    <div className="space-y-8">
      {/* Language Selector - Two large buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <Button
          size="lg"
          onClick={() => setLanguage('af')}
          variant={language === 'af' ? 'default' : 'outline'}
          className={`min-w-[160px] h-14 text-xl font-bold ${language === 'af' ? 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3f]' : 'border-2 border-[#D4A84B] text-[#002855] hover:bg-[#D4A84B]/10'}`}
        >
          Afrikaans
        </Button>
        <Button
          size="lg"
          onClick={() => setLanguage('en')}
          variant={language === 'en' ? 'default' : 'outline'}
          className={`min-w-[160px] h-14 text-xl font-bold ${language === 'en' ? 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3f]' : 'border-2 border-[#D4A84B] text-[#002855] hover:bg-[#D4A84B]/10'}`}
        >
          English
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        <div className="relative z-10 p-8 md:p-12 text-center">
          <Badge className="bg-white/20 text-white mb-4"><Sparkles className="w-3 h-3 mr-1" />{t.landing.badge}</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{t.landing.title}</h1>
          <p className="text-lg text-white/90 mb-2">{t.landing.subtitle}</p>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">{t.landing.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setMode('mentor')} className="bg-white text-blue-700 hover:bg-blue-50">
              <Users className="w-5 h-5 mr-2" />{t.landing.mentorButton}
            </Button>
            <Button size="lg" onClick={() => {
              setMode('leerder');
              setLeerderView('onderwerpe');
              setSelectedLes(null);
              setSelectedOnderwerp(null);
              const voltooideLesse = vordering.filter(v => v.voltooi).length;
              const isDemoGemeente = currentGemeente?.is_demo ?? false;
              if (!isDemoGemeente && voltooideLesse >= 1 && !hasGeloofsonderrigBetaal) setShowGeloofsonderrigPayView(true);
            }} className="bg-blue-500 text-white border-2 border-white hover:bg-blue-400">
              <GraduationCap className="w-5 h-5 mr-2" />{t.landing.learnerButton}
            </Button>
          </div>
        </div>
      </div>

      {/* What is KIOG */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <Brain className="w-6 h-6" />
            </div>
            {t.landing.whatIsKiog}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 text-lg leading-relaxed">{t.landing.kiogDescription}</p>
        </CardContent>
      </Card>

      {/* For Whom */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">{t.landing.forWhom}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white mb-4">
                <GraduationCap className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl">{t.landing.forLearners}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{t.landing.forLearnersDesc}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white mb-4">
                <Users className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl">{t.landing.forMentors}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{t.landing.forMentorsDesc}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">{t.landing.howItWorks}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <BookOpen className="w-6 h-6" />, title: t.landing.step1Title, desc: t.landing.step1Desc, color: 'from-blue-500 to-blue-600' },
            { icon: <Target className="w-6 h-6" />, title: t.landing.step2Title, desc: t.landing.step2Desc, color: 'from-green-500 to-green-600' },
            { icon: <MessageCircle className="w-6 h-6" />, title: t.landing.step3Title, desc: t.landing.step3Desc, color: 'from-purple-500 to-purple-600' },
            { icon: <Heart className="w-6 h-6" />, title: t.landing.step4Title, desc: t.landing.step4Desc, color: 'from-red-500 to-red-600' },
          ].map((step, i) => (
            <Card key={i} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${step.color}`} />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center text-white`}>
                    {step.icon}
                  </div>
                  <span className="text-2xl font-bold text-gray-300">{i + 1}</span>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">{t.landing.features}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: <Brain className="w-6 h-6" />, title: t.landing.feature1, desc: t.landing.feature1Desc },
            { icon: <Lightbulb className="w-6 h-6" />, title: t.landing.feature2, desc: t.landing.feature2Desc },
            { icon: <Share2 className="w-6 h-6" />, title: t.landing.feature3, desc: t.landing.feature3Desc },
            { icon: <Network className="w-6 h-6" />, title: t.landing.feature4, desc: t.landing.feature4Desc },
            { icon: <TrendingUp className="w-6 h-6" />, title: t.landing.feature5, desc: t.landing.feature5Desc },
            { icon: <MessageCircle className="w-6 h-6" />, title: t.landing.feature6, desc: t.landing.feature6Desc },
          ].map((f, i) => (
            <Card key={i} className="border-gray-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3">{f.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* NEW: Mobile Warning */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-amber-800 text-sm md:text-base">
              {language === 'af' ? 'Let Wel: Komplekse Inhoud' : 'Note: Complex Content'}
            </h3>
            <p className="text-amber-700 text-xs md:text-sm mt-1">
              {language === 'af'
                ? "Hierdie afdeling bevat diepgaande studiemateriaal wat moeilik leesbaar mag wees op 'n klein selfoon skerm. Ons beveel aan om 'n tablet of rekenaar te gebruik vir die beste ervaring."
                : "This section contains in-depth study material that may be difficult to read on a small mobile screen. We recommend using a tablet or computer for the best experience."}
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{t.landing.startNow}</h2>
          <p className="text-white/80 mb-6">{t.landing.selectRole}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setMode('mentor')} className="bg-white text-purple-700 hover:bg-purple-50">
              <Users className="w-5 h-5 mr-2" />{t.landing.mentorButton}
            </Button>
            <Button size="lg" onClick={() => {
              setMode('leerder');
              setLeerderView('onderwerpe');
              setSelectedLes(null);
              setSelectedOnderwerp(null);
              const voltooideLesse = vordering.filter(v => v.voltooi).length;
              const isDemoGemeente = currentGemeente?.is_demo ?? false;
              if (!isDemoGemeente && voltooideLesse >= 1 && !hasGeloofsonderrigBetaal) setShowGeloofsonderrigPayView(true);
            }} className="bg-purple-500 text-white border-2 border-white hover:bg-purple-400">
              <GraduationCap className="w-5 h-5 mr-2" />{t.landing.learnerButton}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMentorDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-bold">{t.mentor.dashboard}</h2><p className="text-gray-600">{t.mentor.dashboardDesc}</p></div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateKlas(true)}><Plus className="w-4 h-4 mr-2" />{t.mentor.newClass}</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
          <div><p className="text-2xl font-bold">{klasse.filter(k => k.mentor_id === currentUser?.id).length}</p><p className="text-sm text-gray-600">{t.mentor.classes}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-green-600" /></div>
          <div><p className="text-2xl font-bold">{klasse.filter(k => k.mentor_id === currentUser?.id).reduce((s, k) => s + (k.leerder_count || 0), 0)}</p><p className="text-sm text-gray-600">{t.mentor.learners}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><BookOpen className="w-6 h-6 text-purple-600" /></div>
          <div><p className="text-2xl font-bold">{onderwerpe.length}</p><p className="text-sm text-gray-600">{t.mentor.topics}</p></div>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>{t.mentor.yourClasses}</CardTitle><CardDescription>{t.mentor.clickToManage}</CardDescription></CardHeader>
        <CardContent>
          {klasse.filter(k => k.mentor_id === currentUser?.id).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t.mentor.noClasses}</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreateKlas(true)}>{t.mentor.createFirstClass}</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {klasse.filter(k => k.mentor_id === currentUser?.id).map(klas => (
                <Card key={klas.id} className="border-2 hover:border-blue-300 cursor-pointer" onClick={() => handleOpenKlasDetail(klas)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div><h4 className="font-semibold">{klas.naam}</h4><p className="text-sm text-gray-600 mt-1">{klas.beskrywing || (language === 'af' ? 'Geen beskrywing' : 'No description')}</p></div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" />{klas.leerder_count || 0} {t.mentor.learners.toLowerCase()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderKlasDetail = () => {
    if (!selectedKlas) return null;
    return (
      <div className="space-y-6">
        {/* Header with Prominent KGVW Button */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => { setMentorView('dashboard'); setSelectedKlas(null); setKlasLeerders([]); }} className="h-8 px-2">
                  <ChevronLeft className="w-4 h-4 mr-1" />{t.common.back}
                </Button>
                <h2 className="text-3xl font-extrabold text-gray-900">
                  {selectedKlas.naam}
                </h2>
              </div>
              <p className="text-gray-500 mt-1 ml-11">
                {language === 'af' ? 'Bestuur jou klas en ontleed vordering.' : 'Manage your class and analyze progress.'}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* The CTA Text */}
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded-r-lg max-w-sm">
                <p className="text-xs text-indigo-800 font-medium">
                  {language === 'af'
                    ? "Begin hier: Gebruik die KGVW analise om te sien hoe jou leerders die lesse ervaar en kry 'n KI-gebaseerde gespreksplan."
                    : "Start here: Use the SKAV analysis to see how your learners experience the lessons and get an AI-based discussion plan."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all font-bold h-12 px-6 rounded-xl group"
                  onClick={() => setMentorView('skav-analise')}
                >
                  <Brain className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  {language === 'af' ? 'KGVW Analise & Beplanning' : 'SKAV Analysis & Planning'}
                  <Sparkles className="w-4 h-4 ml-2 opacity-50" />
                </Button>

                <div className="h-10 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>

                <Button variant="outline" className="h-12 px-4 rounded-xl" onClick={() => { setShowBulkImport(true); setBulkText(''); setBulkLeerders([]); }}>
                  <Upload className="w-4 h-4 mr-2" />{t.mentor.bulkImport}
                </Button>
                <Button className="h-12 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md" onClick={() => setShowCreateLeerder(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />{t.mentor.createLearner}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  {t.mentor.learnersInClass}
                </CardTitle>
                <CardDescription>
                  {klasLeerders.length === 0 ? t.mentor.noLearnersRegistered : `${klasLeerders.length} ${t.mentor.learnersRegistered}`}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">{klasLeerders.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {klasLeerders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">{t.mentor.noLearnersInClass}</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">{t.mentor.createLearnerManually}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => setShowCreateLeerder(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />{t.mentor.createLearner}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowBulkImport(true); setBulkText(''); setBulkLeerders([]); }}>
                    <Upload className="w-4 h-4 mr-2" />{t.mentor.bulkImport}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-2 p-2">
                      {klasLeerders.map((kl, index) => (
                        <div key={kl.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow-sm transition-all">
                          <div className="hidden md:flex col-span-1 items-center">
                            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">{index + 1}</span>
                          </div>
                          <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                            <div className="md:hidden w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">{index + 1}</div>
                            <div>
                              <p className="font-medium text-gray-900">{kl.leerder?.naam || 'Onbekend'} {kl.leerder?.van || ''}</p>
                            </div>
                          </div>
                          <div className="hidden md:flex col-span-3 items-center text-gray-600">
                            {kl.leerder?.selfoon ? (<span className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{kl.leerder.selfoon}</span>) : (<span className="text-gray-400">-</span>)}
                          </div>
                          <div className="hidden md:flex col-span-3 items-center text-gray-600">
                            {kl.leerder?.epos ? (<span className="flex items-center gap-2 truncate"><Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="truncate">{kl.leerder.epos}</span></span>) : (<span className="text-gray-400">-</span>)}
                          </div>
                          <div className="col-span-1 flex items-center justify-end gap-1">
                            {isMentorOrAdmin && currentGemeente && !currentGemeente.is_demo && !leerderBetaalStatus[kl.leerder_id] && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                                onClick={async () => {
                                  if (!processGeloofsonderrigBetaling) return;
                                  const result = await processGeloofsonderrigBetaling(kl.leerder_id, { namens: true });
                                  if (result?.success && result?.redirectUrl) window.location.href = result.redirectUrl;
                                  else if (result?.error) toast({ title: language === 'af' ? 'Betaling fout' : 'Payment error', description: result.error, variant: 'destructive' });
                                }}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                {language === 'af' ? 'Betaal R100' : 'Pay R100'}
                              </Button>
                            )}
                            {leerderBetaalStatus[kl.leerder_id] && (
                              <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{language === 'af' ? 'Betaal' : 'Paid'}</span>
                            )}
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveLeerder(kl.leerder_id, `${kl.leerder?.naam || ''} ${kl.leerder?.van || ''}`)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class details footer removed as code is gone */}
      </div>
    );
  };

  const renderKGVWAnalise = () => {
    if (!selectedKlas) return null;
    return (
      <MentorSKAVAnalise
        klasId={selectedKlas.id}
        klasNaam={selectedKlas.naam}
        onBack={() => setMentorView('klas-detail')}
      />
    );
  };

  const renderLeerderOnderwerpe = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">{t.learner.topics}</h2><p className="text-gray-600">{t.learner.topicsDesc}</p></div>
      </div>

      {/* Vooraf blok: 1 gratis les, daarna R100 (behalve Demo Leerder) */}
      {currentGemeente && !currentGemeente.is_demo && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">
                  {language === 'af' ? '1 Gratis les, daarna R100' : '1 Free lesson, then R100'}
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  {language === 'af'
                    ? "Jy kry een les gratis om KI-Kats te probeer. Na jou eerste voltooide les betaal jy R100 eenmalig vir al die lesse in jou graad. Jou gemeente admin kan ook namens jou betaal."
                    : "You get one free lesson to try KI-Kats. After your first completed lesson you pay R100 once for all lessons in your grade. Your church admin can also pay on your behalf."}
                </p>
              </div>
            </div>
            {!hasGeloofsonderrigBetaal && (
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 shadow-lg shrink-0"
                onClick={async () => {
                  if (!processGeloofsonderrigBetaling || !currentUser) return;
                  const result = await processGeloofsonderrigBetaling(currentUser.id);
                  if (result?.success && result?.redirectUrl) {
                    window.location.href = result.redirectUrl;
                  } else if (result?.error) {
                    toast({ title: language === 'af' ? 'Betaling fout' : 'Payment error', description: result.error, variant: 'destructive' });
                  }
                }}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {language === 'af' ? 'Betaal sommer nou' : 'Pay now'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard - Leerder sien almal se punte (sonder name), wys waar jy is - altyd wys */}
      {(leaderboardEntries.length > 0 || mode === 'leerder') && (
        <Card className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-xl border-2 border-amber-300">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6" />
              {t.learner.leaderboard}
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {leaderboardEntries.length === 0 ? (
                <p className="text-white/90 text-sm py-4 text-center">{language === 'af' ? 'Voltooi lesse om punte te verdien en op die ranglys te verskyn!' : 'Complete lessons to earn points and appear on the leaderboard!'}</p>
              ) : leaderboardEntries.map((e, idx) => (
                <div
                  key={`${e.rang}-${idx}`}
                  className={`flex items-center justify-between p-2 rounded-lg ${e.is_current_user ? 'bg-white/30 font-bold ring-2 ring-white' : 'bg-white/10'}`}
                >
                  <span className="font-semibold">#{e.rang}</span>
                  <span>{e.is_current_user ? (language === 'af' ? 'Jy' : 'You') : '???'}</span>
                  <span className="font-bold">{e.totaal_punte} {language === 'af' ? 'punte' : 'points'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lys van voltooide lesse vir leerder */}
      {vordering.filter(v => v.voltooi).length > 0 && (
        <Card className="bg-white border-2 border-emerald-100 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
              {language === 'af' ? 'My Voltooide Lesse' : 'My Completed Lessons'}
            </CardTitle>
            <CardDescription>
              {language === 'af' ? 'Lesse wat jy reeds voltooi het' : 'Lessons you have already completed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
              {vordering
                .filter(v => v.voltooi)
                .map(v => {
                  const les = allLesse.find(l => l.id === v.les_id);
                  const onderwerp = les ? onderwerpe.find(o => o.id === les.onderwerp_id) : null;
                  return (
                    <div key={v.les_id} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{les?.titel || (language === 'af' ? 'Les' : 'Lesson')}</p>
                        {onderwerp && <p className="text-sm text-gray-500 truncate">{onderwerp.titel}</p>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {onderwerpe.map(o => (
          <Card key={o.id} className="cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-2 border-transparent hover:border-purple-400 bg-gradient-to-br from-white to-purple-50/50 shadow-lg" onClick={() => { setSelectedOnderwerp(o); fetchLesse(o.id); }}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl ${o.kleur} flex items-center justify-center text-white shadow-lg`}>{getIconComponent(o.ikoon)}</div>
                <div className="flex-1"><h3 className="font-bold text-lg text-gray-900">{o.titel}</h3><p className="text-sm text-gray-600 mt-1">{o.beskrywing}</p></div>
              </div>
              <div className="mt-4"><Progress value={getOnderwerpProgress(o.id)} className="h-3 rounded-full" /></div>
            </CardContent>
          </Card>
        ))}
      </div>
      {selectedOnderwerp && !selectedLes && (
        <Dialog open={!!selectedOnderwerp} onOpenChange={() => setSelectedOnderwerp(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${selectedOnderwerp.kleur} flex items-center justify-center text-white`}>{getIconComponent(selectedOnderwerp.ikoon)}</div>
                {selectedOnderwerp.titel}
              </DialogTitle>
              <DialogDescription>
                Kies 'n les om te begin met {selectedOnderwerp.titel}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4 pr-4">
              <div className="space-y-3">
                {lesse.map((les, i) => {
                  const done = vordering.some(v => v.les_id === les.id && v.voltooi);
                  const prevDone = i === 0 || vordering.some(v => v.les_id === lesse[i - 1].id && v.voltooi);
                  const canAccess = prevDone;
                  return (
                    <div
                      key={les.id}
                      className={`p-4 rounded-xl border-2 transition-all ${canAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${done ? 'border-emerald-400 bg-gradient-to-r from-emerald-50 to-green-50 shadow-md' : canAccess ? 'border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50/50' : 'border-gray-200 bg-gray-50'}`}
                      onClick={() => {
                        if (!canAccess) {
                          toast({
                            title: language === 'af' ? 'Voltooi eers die vorige les' : 'Complete the previous lesson first',
                            description: language === 'af' ? 'Jy moet eers die vorige les voltooi voor jy na hierdie les kan gaan.' : 'You must complete the previous lesson before accessing this lesson.',
                            variant: 'destructive'
                          });
                          return;
                        }
                        setSelectedLes(les);
                        setLeerderView('les');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${done ? 'bg-emerald-500 text-white shadow-lg' : canAccess ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-500'}`}>{done ? <CheckCircle2 className="w-6 h-6" /> : i + 1}</div>
                          <div>
                            <p className="font-bold text-gray-900">{les.titel}</p>
                            {les.skrifverwysing && <p className="text-sm text-gray-500">{les.skrifverwysing}</p>}
                            {done && <Badge className="mt-1 bg-emerald-500 text-white">✓ Voltooi</Badge>}
                            {!canAccess && !done && <Badge variant="outline" className="mt-1 text-gray-500">Voltooi eers vorige les</Badge>}
                          </div>
                        </div>
                        <ChevronRight className={`w-6 h-6 ${canAccess ? 'text-purple-400' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  const renderLes = () => {
    if (!selectedLes || !selectedOnderwerp) return null;

    return (
      <div className="space-y-6">
        {/* Mobile Warning */}
        <div className="md:hidden bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-amber-700 text-xs font-medium">
              {language === 'af'
                ? "Hierdie les is lank en word die beste op 'n tablet of rekenaar gelees."
                : "This lesson is long and is best read on a tablet or computer."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="lg" className="text-lg px-6 py-3" onClick={() => { setSelectedLes(null); setLeerderView('onderwerpe'); }}><ChevronLeft className="w-6 h-6 mr-2" />{t.common.back}</Button>
          <div className="flex-1"><h2 className="text-2xl font-bold text-gray-900">{selectedLes.titel}</h2><p className="text-sm text-purple-600">{selectedOnderwerp.titel}</p></div>
        </div>

        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md mb-4">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-green-900">{language === 'af' ? 'Voltooi die les vir jou beloning!' : 'Complete the lesson for your reward!'}</h3>
                <p className="text-green-700 text-sm mt-1">
                  {language === 'af'
                    ? "As jy die les voltooi, kry jy: 'n video van jou les, 'n gedig wat KI skep, en jou prente. Laai ook jou eie prent op!"
                    : "When you complete the lesson, you get: a video of your lesson, a poem created by AI, and your pictures. You can also upload your own picture!"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-bold text-lg text-purple-900">{t.learner.aiExploration}</h3>
                <p className="text-purple-700 text-sm mt-1">{t.learner.aiExplorationDesc}</p>
              </div>
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg scale-105 transition-transform" onClick={startLesVerkenning}>
                <Sparkles className="w-5 h-5 mr-2" />{language === 'af' ? 'Begin Verkenning...' : t.learner.startExploration}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {/* NEW: Scrollable Content Wrapper - HEIGHT REDUCED */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 max-h-[500px] overflow-y-auto shadow-inner custom-scrollbar">
              {selectedLes.file_url ? (
                <div className="space-y-4 mb-4">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-blue-200">
                    <FileText className="w-12 h-12 text-blue-500" />
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900">{selectedLes.titel}</h3>
                      <p className="text-sm text-blue-700">{selectedLes.file_name || 'Lêer'}</p>
                    </div>
                    <Button asChild variant="outline">
                      <a href={selectedLes.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" /> Laai Af
                      </a>
                    </Button>
                  </div>
                  {selectedLes.inhoud && selectedLes.inhoud !== 'File Uploaded' && (
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {selectedLes.inhoud}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/<([a-z][a-z0-9]*)\b[^>]*>/i.test(selectedLes.inhoud) ? (
                    <div
                      className="prose prose-sm max-w-none text-gray-700 [&_img]:rounded-lg [&_img]:my-4"
                      dangerouslySetInnerHTML={{ __html: selectedLes.inhoud }}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedLes.inhoud}</p>
                  )}
                </>
              )}
            </div>

            {selectedLes.skrifverwysing && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">{selectedLes.skrifverwysing}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const handleCompleteLesVerkenning = async () => {
    if (!selectedLes) return;

    const slides = [
      { type: 'intro', title: selectedLes.titel },
      ...chatMessages.filter(m => m.role === 'user').map(m => {
        const index = chatMessages.indexOf(m);
        const answer = chatMessages[index + 1]?.role === 'assistant' ? chatMessages[index + 1].content : '';
        return { type: 'qa', question: m.content, answer };
      }).slice(0, 5),
      ...lesVisualiserings.map(v => ({ type: 'image', url: v.imageUrl, prompt: v.prompt })),
      { type: 'outro' }
    ];

    setCompletionSlideData(slides);
    setIsDemoCompletion(false);
    setShowVerkenningModal(false);

    toast({ title: "Geluk!", description: "Jy het die les voltooi!" });

    // Log completion to backend - wag vir upsert sodat vordering-staaf korrek opdateer
    if (currentUser) {
      awardPunte('les_voltooi', 10, selectedLes.id);
      const { error } = await supabase.rpc('upsert_geloofsonderrig_vordering_leerder', {
        p_leerder_id: currentUser.id,
        p_les_id: selectedLes.id,
        p_voltooi: true,
        p_quiz_score: answeredQuizCount,
        p_quiz_total: 5,
        p_verse_completed: completedVersesCount,
        p_verse_total: 3,
        p_visualiserings_count: lesVisualiserings.length
      });
      if (!error) {
        await fetchVordering();
        fetchLeaderboard();
        // Sodat KGVW-analise (Leerders in Klas) hierdie les tel: as die leerder nog geen ai_logs vir hierdie les het, voeg een "les voltooi"-log by.
        const { data: bestaande } = await supabase
          .from('geloofsonderrig_ai_logs')
          .select('id')
          .eq('leerder_id', currentUser.id)
          .eq('les_id', selectedLes.id)
          .limit(1);
        if (!bestaande?.length) {
          await supabase.from('geloofsonderrig_ai_logs').insert({
            leerder_id: currentUser.id,
            les_id: selectedLes.id,
            user_message: language === 'af' ? 'Les voltooi' : 'Lesson completed',
            ai_response: '',
            kgvw_scores: { kennis: 0.25, gesindheid: 0.25, vaardigheid: 0.25, values: 0.25 }
          });
        }
      }
    }

    setShowCompletionVideo(true);
  };

  /** Geheime demo-knoppie: spring direk na les-voltooiingskerm vir gedig & musiek demonstrasie */
  const openDemoCompletion = () => {
    setCompletionSlideData([{ type: 'outro' }]);
    setIsDemoCompletion(true);
    setShowCompletionVideo(true);
    toast({ title: language === 'af' ? 'Demo-modus' : 'Demo mode', description: language === 'af' ? 'Demonstreer gedig & musiek' : 'Demonstrate poem & music' });
  };

  const renderCompletionVideo = () => {
    if (!showCompletionVideo || !completionSlideData) return null;

    const demoLessonTitle = language === 'af' ? 'Demo Les - Gedig' : 'Demo Lesson - Poem';
    const demoLessonContent = language === 'af'
      ? 'God is liefde. Jesus het ons gered deur sy offer aan die kruis. Sy genade is ewige en ons vertrou Hom vir al ons daaglikse behoeftes. Die Heilige Gees lei ons en vertroos ons.'
      : 'God is love. Jesus saved us through His sacrifice on the cross. His grace is eternal and we trust Him for all our daily needs. The Holy Spirit guides and comforts us.';

    return (
      <CompletionVideoPlayer
        slides={completionSlideData}
        lessonTitle={isDemoCompletion ? demoLessonTitle : selectedLes?.titel}
        lessonContent={isDemoCompletion ? demoLessonContent : selectedLes?.inhoud}
        language={language}
        onInvokeAI={invokeAIWithRetry}
        onAwardPunte={awardPunte}
        lesId={selectedLes?.id}
        onShowLeaderboard={() => { setShowCompletionVideo(false); setIsDemoCompletion(false); setSelectedLes(null); setLeerderView('onderwerpe'); fetchVordering(); fetchLeaderboard(); }}
        onClose={() => { setShowCompletionVideo(false); setIsDemoCompletion(false); setSelectedLes(null); setLeerderView('onderwerpe'); fetchVordering(); fetchLeaderboard(); }}
        onRedo={!isDemoCompletion && selectedLes ? () => {
          setShowCompletionVideo(false);
          setChatMessages([]);
          setPromptCount(0);
          setOwnQuestionsCount(0);
          setCurrentKGVW('Kennis');
          setAvailablePrompts([]);
          setKgvwTellings({ kennis: 0, gesindheid: 0, vaardigheid: 0, waardes: 0 });
          setQuizQuestions([]);
          setAnsweredQuizCount(0);
          setLessonVerses([]);
          setBibleVerses([]);
          setVerseState({});
          setCompletedVersesCount(0);
          setLesVisualiserings([]);
          setLeerderView('les-verken');
          fetchLessonExtras();
          fetchDynamicPrompts(0, []).then(initialPrompts => {
            setAvailablePrompts(initialPrompts);
            const welcomeMsg = language === 'af'
              ? `Welkom by "${selectedLes!.titel}"! \n\nEk is hier om jou te help verstaan wat hierdie les beteken. Kies een van die vrae hieronder om te begin - ek sal jou vraag beantwoord gebaseer op die lesinhoud.`
              : `Welcome to "${selectedLes!.titel}"! \n\nI'm here to help you understand what this lesson means. Choose one of the questions below to start - I'll answer your question based on the lesson content.`;
            setChatMessages([{ role: 'assistant', content: welcomeMsg, timestamp: new Date(), suggestedPrompts: initialPrompts }]);
          });
        } : undefined}
        progressData={!isDemoCompletion ? { promptCount: 5, ownQuestionsCount: 1, answeredQuizCount: 5, completedVersesCount: 3, visualiseringsCount: Math.max(1, completionSlideData?.filter((s: any) => s.type === 'image').length || 0) } : undefined}
        onShare={async (data) => {
          if (!selectedLes) return;
          try {
            const imgBase64 = data.imageBase64 || completionSlideData?.find((s: any) => s.type === 'image')?.url?.split(',')[1] || "";
            let htmlBody = `<h2>Les Voltooi: ${selectedLes.titel}</h2>
                    <p><strong>Leerder:</strong> ${data.includeName ? (currentUser?.naam + ' ' + currentUser?.van) : 'Anoniem'}</p>
                    <p><strong>Betekenis:</strong><br/>"${(data.meaning || '').replace(/"/g, '&quot;')}"</p>`;
            if (data.poem) htmlBody += `<hr/><h3>Gedig</h3><pre style="white-space:pre-wrap">${(data.poem || '').replace(/</g, '&lt;')}</pre>`;
            htmlBody += `<hr/><p><em>Gedeel via Geloofsonderrig Deel-knoppie.</em></p>`;
            const payload = {
              recipientEmail: 'prente@dramekaarselaste.co.za',
              subject: `Voltooide Les: ${data.includeName ? (currentUser?.naam || 'Onbekend') : 'Anoniem'}`,
              senderName: data.includeName ? (currentUser?.naam || 'Leerder') : 'Anoniem',
              htmlBody,
              imageBase64: imgBase64
            };

            await invokeAIWithRetry('email_share', payload);
            setShowCompletionVideo(false);
            toast({
              title: language === 'af' ? 'Baie dankie!' : 'Thank you!',
              description: language === 'af' ? 'Jou prente sal binnekort op sosiale media verskyn!' : 'Your pictures will appear on social media soon!',
              className: 'bg-blue-600 text-white'
            });
          } catch (e) {
            console.error("Video share failed", e);
            toast({ title: 'Fout', description: 'Kon nie deel nie.', variant: 'destructive' });
          }
        }}
      />
    );
  };

  /** Verkenning-inhoud (gebruik in modal of les-verken view) */
  const renderLesVerken = (asModal?: boolean) => {
    if (!selectedLes || !selectedOnderwerp) return null;

    // Calculate overall progress (relaxed criteria: 5 prompts, 1 own, 3 quiz, 3 verses, 1 visual)
    const vrae_progress = Math.min((promptCount / 5) * 100, 100);
    const eie_vrae_progress = Math.min((ownQuestionsCount / 1) * 100, 100);
    const quiz_progress = Math.min((answeredQuizCount / 5) * 100, 100);
    const verse_progress = Math.min((completedVersesCount / 3) * 100, 100);
    const visual_progress = Math.min((lesVisualiserings.length / 1) * 100, 100);

    // Overall progress is average of all components
    const progressPercent = Math.round((vrae_progress + eie_vrae_progress + quiz_progress + verse_progress + visual_progress) / 5);

    // Completion: 5 AI prompts, 1 own question, 5 quiz attempts, 3 verses, 1 visual
    const canComplete = promptCount >= 5 && ownQuestionsCount >= 1 && answeredQuizCount >= 5 && completedVersesCount >= 3 && lesVisualiserings.length >= 1;

    const content = (
      <div className={`flex flex-col min-h-[400px] ${asModal ? 'max-h-[calc(90vh-5rem)]' : 'h-[calc(100vh-8rem)] -m-4 md:-m-6 lg:-m-8'}`}>
        {/* Scrollable area - sticky progress bar bly bo-op tydens scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {/* Sticky Progress Bar - kleurvol vir kinders */}
          <div className="sticky top-0 z-40 px-4 pt-3 pb-3 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 backdrop-blur-sm border-b-2 border-purple-300 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-purple-800">{language === 'af' ? 'Algehele Vordering' : 'Overall Progress'}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-purple-600">{progressPercent}%</span>
                {asModal && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowVerkenningModal(false)} aria-label={t.common.close}>
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="w-full min-h-[12px] bg-gray-200 rounded-full overflow-hidden border border-purple-200 mb-3">
              <div
                className="h-full min-h-[12px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${Math.max(progressPercent, 2)}%` }}
              />
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs font-bold">
              <div className={`flex flex-col items-center p-2 rounded-xl ${promptCount >= 5 ? 'bg-emerald-200 text-emerald-800' : 'bg-purple-100 text-purple-700'}`} title={language === 'af' ? 'Gesprek' : 'Chat'}>
                <span className="text-[10px] font-semibold leading-tight">{language === 'af' ? 'Gesprek' : 'Chat'}</span>
                <span>{promptCount}/5</span>
              </div>
              <div className={`flex flex-col items-center p-2 rounded-xl ${ownQuestionsCount >= 1 ? 'bg-emerald-200 text-emerald-800' : 'bg-pink-100 text-pink-700'}`} title={language === 'af' ? 'Eie vraag' : 'Own question'}>
                <span className="text-[10px] font-semibold leading-tight">{language === 'af' ? 'Eie vraag' : 'Own'}</span>
                <span>{ownQuestionsCount}/1</span>
              </div>
              <div className={`flex flex-col items-center p-2 rounded-xl ${answeredQuizCount >= 5 ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-100 text-amber-700'}`} title={language === 'af' ? 'Vrae' : 'Questions'}>
                <span className="text-[10px] font-semibold leading-tight">{language === 'af' ? 'Vrae' : 'Q&A'}</span>
                <span>{answeredQuizCount}/5</span>
              </div>
              <div className={`flex flex-col items-center p-2 rounded-xl ${completedVersesCount >= 3 ? 'bg-emerald-200 text-emerald-800' : 'bg-indigo-100 text-indigo-700'}`} title={language === 'af' ? 'Verse' : 'Verses'}>
                <span className="text-[10px] font-semibold leading-tight">{language === 'af' ? 'Verse' : 'Verses'}</span>
                <span>{completedVersesCount}/3</span>
              </div>
              <div className={`flex flex-col items-center p-2 rounded-xl ${lesVisualiserings.length >= 1 ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-100 text-rose-700'}`} title={language === 'af' ? 'Prent' : 'Picture'}>
                <span className="text-[10px] font-semibold leading-tight">{language === 'af' ? 'Prent' : 'Pic'}</span>
                <span>{lesVisualiserings.length}/1</span>
              </div>
            </div>
          </div>

          <div className="px-4 space-y-4">
        {/* Mobile Warning */}
        <div className="md:hidden bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg mb-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-amber-700 text-xs font-medium">
              {language === 'af'
                ? "Die gesprek en oefeninge werk die beste op 'n groter skerm."
                : "The conversation and exercises work best on a larger screen."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="outline"
            size="lg"
            className="text-xl font-bold px-8 py-6 border-2 border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-800 shadow-lg"
              onClick={() => {
                const currentDone = vordering.some(v => v.les_id === selectedLes.id && v.voltooi);
                if (!currentDone) {
                  setShowVolgendeLesWarning(true);
                  return;
                }
                if (currentGemeente && !currentGemeente.is_demo && !hasGeloofsonderrigBetaal) {
                  setShowGeloofsonderrigPayView(true);
                  return;
                }
                const idx = lesse.findIndex(l => l.id === selectedLes.id);
                const nextLes = idx >= 0 && idx < lesse.length - 1 ? lesse[idx + 1] : null;
                if (nextLes) {
                  setSelectedLes(nextLes);
                  setLeerderView('les');
                  setShowVerkenningModal(false);
                  fetchVrae(nextLes.id);
                } else {
                  setSelectedLes(null);
                  setLeerderView('onderwerpe');
                  setShowVerkenningModal(false);
                  fetchVordering();
                }
              }}
            >
              <ChevronRight className="w-7 h-7 mr-2" />{language === 'af' ? 'Volgende les' : 'Next lesson'}
            </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate text-purple-900">{selectedLes.titel}</h2>
            <p className="text-sm text-purple-600">{language === 'af' ? 'Interaktiewe Verkenning' : 'Interactive Exploration'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowQuiz(true)}
            disabled={quizLoading || quizQuestions.length === 0}
            variant="outline"
            className="bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700"
          >
            {quizLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{language === 'af' ? 'Genereer...' : 'Generating...'}</> : <>{language === 'af' ? 'Vrae' : 'Questions'} ({answeredQuizCount}/5)</>}
          </Button>
          <Button
            onClick={() => { setVerseToOpen(undefined); setShowVerses(true); }}
            disabled={versesLoading || lessonVerses.length === 0}
            variant="outline"
            className="bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700"
          >
            {versesLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{language === 'af' ? 'Genereer...' : 'Generating...'}</> : <>📖 Verse ({completedVersesCount}/3)</>}
          </Button>
        </div>

        <Card className="flex-1 border-2 border-purple-200 bg-gradient-to-b from-white to-purple-50/30 shadow-lg ring-2 ring-purple-100">
          <ScrollArea className="h-[420px] p-4 geloofsonderrig-scroll">
            <div className="space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className="space-y-3">
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md shadow-md' : 'bg-gradient-to-r from-purple-50 to-pink-50 text-gray-800 rounded-bl-md border-2 border-purple-200 shadow-sm'}`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>

                  {msg.role === 'assistant' && (
                    <div className="flex justify-start pl-2 gap-2 mt-2 flex-wrap">
                      <Button size="sm" variant="outline" className="text-xs bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700" onClick={handleGenerateMindMap} disabled={generatingMindMap}>
                        {generatingMindMap ? (<><Loader2 className="w-3 h-3 mr-1 animate-spin" />{t.learner.creating}</>) : (<><Network className="w-3 h-3 mr-1" />{t.learner.createMindMap}</>)}
                      </Button>
                    </div>
                  )}

                  {msg.role === 'assistant' && i === chatMessages.length - 1 && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && !chatLoading && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-xl border-2 border-amber-200 shadow-sm">
                      <p className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        ✨ {t.learner.whatNext}
                      </p>
                      <div className="space-y-2">
                        {msg.suggestedPrompts.map((prompt, pi) => (
                          <button key={pi} className="w-full text-left p-3 rounded-xl bg-white border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all duration-200 group shadow-sm" onClick={() => handlePromptSelect(prompt)} disabled={chatLoading}>
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                                <ChevronRight className="w-4 h-4 text-amber-600" />
                              </div>
                              <span className="text-sm text-gray-700 leading-relaxed">{prompt}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md p-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-600">{t.learner.thinking}</span>
                  </div>
                </div>
              )}

              {chatMessages.length === 0 && !chatLoading && availablePrompts.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-xl border-2 border-amber-200 shadow-sm">
                  <p className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    ✨ {t.learner.chooseQuestion}
                  </p>
                  <div className="space-y-2">
                    {availablePrompts.map((prompt, pi) => (
                      <button key={pi} className="w-full text-left p-3 rounded-xl bg-white border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all duration-200 group shadow-sm" onClick={() => handlePromptSelect(prompt)}>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                            <ChevronRight className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className="text-sm text-gray-700 leading-relaxed">{prompt}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Free-form Input - baie duidelik en kleurvol */}
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 rounded-2xl border-2 border-amber-300 shadow-lg">
              <p className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                {language === 'af' ? 'Tik jou eie vraag hier:' : 'Type your own question here:'}
              </p>
              <div className="flex gap-2">
                <Input
                  value={freeInput}
                  onChange={(e) => setFreeInput(e.target.value)}
                  placeholder={language === 'af' ? "Vra enige vraag oor die les hier" : "Ask any question about the lesson here"}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && freeInput.trim()) {
                      handlePromptSelect(freeInput);
                      setFreeInput('');
                      setOwnQuestionsCount(prev => prev + 1);
                    }
                  }}
                  className="flex-1 border-2 border-amber-300 bg-white text-base py-4 rounded-xl placeholder:text-amber-600/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
                <Button
                  onClick={() => {
                    if (freeInput.trim()) {
                      handlePromptSelect(freeInput);
                      setFreeInput('');
                      setOwnQuestionsCount(prev => prev + 1);
                    }
                  }}
                  disabled={!freeInput.trim() || chatLoading}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-6 py-4 rounded-xl shadow-md"
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* Bible Drill Section - click any verse for fill-in-blanks */}
        {bibleVerses.length > 0 && (
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-800 font-bold">
                <BookOpen className="w-5 h-5" />
                📖 {language === 'af' ? 'Bybelkennis' : 'Bible Knowledge'} ({completedVersesCount}/3)
              </CardTitle>
              <p className="text-xs text-indigo-600 -mt-2">{language === 'af' ? 'Klik op enige vers vir die ontbrekende woorde oefening' : 'Click any verse for the fill-in-the-blanks exercise'}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bibleVerses.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setVerseToOpen(i); setShowVerses(true); }}
                    className={`text-left p-4 rounded-xl border-2 shadow-sm flex flex-col justify-between transition-all hover:shadow-lg hover:scale-[1.02] ${verseState[i] ? 'bg-green-50 border-green-300' : 'bg-white border-indigo-100 hover:border-indigo-300'}`}
                  >
                    <div>
                      <h4 className="font-bold text-indigo-900 mb-2">{v.reference}</h4>
                      <p className="text-sm text-gray-600 italic mb-4 line-clamp-2">"{v.text}"</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {verseState[i] ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <BookOpen className="w-4 h-4 text-indigo-500" />}
                      <span className={verseState[i] ? 'text-green-700 font-medium' : 'text-indigo-600'}>
                        {verseState[i] ? (language === 'af' ? 'Gedoen! ✓' : 'Done! ✓') : (language === 'af' ? 'Klik vir oefening' : 'Click for exercise')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {
          lesVisualiserings.length > 0 && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-purple-800">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  {t.learner.yourArtworks} ({lesVisualiserings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {lesVisualiserings.map((vis) => (
                    <button
                      key={vis.id}
                      type="button"
                      onClick={() => setSelectedImageForView(vis)}
                      className="relative group rounded-xl overflow-hidden border-2 border-purple-200 hover:border-purple-500 hover:shadow-lg transition-all focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
                    >
                      <div className="aspect-square">
                        <img src={vis.imageUrl} alt={vis.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        }

        <div className="sticky bottom-0 bg-gradient-to-r from-purple-50 to-pink-50 pt-4 pb-2 -mx-4 px-4 border-t-2 border-purple-200 shadow-xl flex flex-col gap-2">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 py-6 text-xl font-bold border-2 border-purple-400 bg-white text-purple-800 hover:bg-purple-50 shadow-lg"
              onClick={() => {
                const currentDone = vordering.some(v => v.les_id === selectedLes.id && v.voltooi);
                if (!currentDone) {
                  setShowVolgendeLesWarning(true);
                  return;
                }
                if (currentGemeente && !currentGemeente.is_demo && !hasGeloofsonderrigBetaal) {
                  setShowGeloofsonderrigPayView(true);
                  return;
                }
                const idx = lesse.findIndex(l => l.id === selectedLes.id);
                const nextLes = idx >= 0 && idx < lesse.length - 1 ? lesse[idx + 1] : null;
                if (nextLes) {
                  setSelectedLes(nextLes);
                  setLeerderView('les');
                  setShowVerkenningModal(false);
                  fetchVrae(nextLes.id);
                } else {
                  setSelectedLes(null);
                  setLeerderView('onderwerpe');
                  setShowVerkenningModal(false);
                  fetchVordering();
                }
              }}
            >
              <ChevronRight className="w-7 h-7 mr-2" />{language === 'af' ? 'Volgende les' : 'Next lesson'}
            </Button>
            <Button
              className={`flex-[2] py-6 text-xl font-bold transition-all disabled:opacity-100 ${canComplete ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl' : 'bg-gray-100 text-gray-800 border-2 border-gray-300 cursor-not-allowed'}`}
              onClick={handleCompleteLesVerkenning}
              disabled={!canComplete}
            >
              <CheckCircle2 className={`w-6 h-6 mr-2 ${canComplete ? 'text-white' : 'text-gray-600'}`} />
              {canComplete ? t.learner.completeLesson : (language === 'af' ? 'Voltooi alle aktiwiteite om voort te gaan' : 'Complete all activities to continue')}
            </Button>
          </div>
        </div>

        {/* Quiz Modal */}
        {showQuiz && quizQuestions.length > 0 && (
          <QuizComponent
            questions={quizQuestions}
            onComplete={(score) => {
              setAnsweredQuizCount(5); // All 5 questions answered
              setShowQuiz(false);
              awardPunte('quiz', score * 2, selectedLes?.id); // 2 punte per korrekte antwoord
              toast({
                title: language === 'af' ? 'Quiz Voltooi!' : 'Quiz Complete!',
                description: `Jy het ${score} uit ${quizQuestions.length} korrek! +${score * 2} punte!`,
              });
            }}
            onClose={() => setShowQuiz(false)}
          />
        )}

        {/* Verse Modal - supports opening from specific verse (verseToOpen) */}
        {showVerses && lessonVerses.length > 0 && (
          <VerseComponent
            verses={lessonVerses}
            initialVerseIndex={verseToOpen !== undefined ? Math.max(0, Math.min(verseToOpen, lessonVerses.length - 1)) : 0}
            onComplete={(score) => {
              if (verseToOpen !== undefined) {
                setVerseState(prev => ({ ...prev, [verseToOpen]: true }));
              }
              setCompletedVersesCount(prev => Math.max(prev, 3)); // Verse oefening voltooi
              setShowVerses(false);
              setVerseToOpen(undefined);
              awardPunte('vers', 2, selectedLes?.id); // 2 punte per vers
              toast({
                title: language === 'af' ? 'Verse Voltooi! 📖' : 'Verse Complete! 📖',
                description: `Jy het ${score} woorde korrek ingevul! +2 punte! 🎉`,
              });
            }}
            onClose={() => { setShowVerses(false); setVerseToOpen(undefined); }}
          />
        )}
          </div>
        </div>
      </div>
    );
    return content;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="space-y-6">
        {mode !== 'home' && (
          <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => {
              setMode('home');
              setMentorView('dashboard');
              setSelectedKlas(null);
              if (mode === 'leerder') {
                setLeerderView('onderwerpe');
                setSelectedLes(null);
                setSelectedOnderwerp(null);
              }
            }}><Home className="w-4 h-4 mr-2" />{t.common.home}</Button>
              <span className="text-gray-300">|</span>
              <span className="font-medium">{mode === 'mentor' ? (language === 'af' ? 'Mentor Modus' : 'Mentor Mode') : (language === 'af' ? 'Leerder Modus' : 'Learner Mode')}</span>
              <div className="flex gap-3 min-w-[320px]">
                <Button
                  onClick={() => setLanguage('af')}
                  variant={language === 'af' ? 'default' : 'outline'}
                  className={`flex-1 h-14 text-xl font-bold min-w-[140px] ${language === 'af' ? 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3f]' : 'border-2 border-[#D4A84B] text-[#002855] hover:bg-[#D4A84B]/10 bg-white/10'}`}
                >
                  Afrikaans
                </Button>
                <Button
                  onClick={() => setLanguage('en')}
                  variant={language === 'en' ? 'default' : 'outline'}
                  className={`flex-1 h-14 text-xl font-bold min-w-[140px] ${language === 'en' ? 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3f]' : 'border-2 border-[#D4A84B] text-[#002855] hover:bg-[#D4A84B]/10 bg-white/10'}`}
                >
                  English
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => {
              setMode('home');
              setMentorView('dashboard');
              setSelectedKlas(null);
              if (mode === 'leerder') {
                setLeerderView('onderwerpe');
                setSelectedLes(null);
                setSelectedOnderwerp(null);
              }
            }}><LogOut className="w-4 h-4 mr-2" />{t.common.leave}</Button>
          </div>
        )}

        {mode === 'home' && renderHome()}
        {mode === 'mentor' && mentorView === 'dashboard' && renderMentorDashboard()}
        {mode === 'mentor' && mentorView === 'klas-detail' && renderKlasDetail()}
        {mode === 'mentor' && mentorView === 'skav-analise' && renderKGVWAnalise()}
        {mode === 'leerder' && leerderView === 'onderwerpe' && renderLeerderOnderwerpe()}
        {mode === 'leerder' && leerderView === 'les' && renderLes()}
        {mode === 'leerder' && leerderView === 'les-verken' && renderLesVerken(false)}

        {renderCompletionVideo()}

        {/* Verkenning Modal - bo-oor alles (soos Vrae/Quiz) */}
        {showVerkenningModal && selectedLes && selectedOnderwerp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowVerkenningModal(false)}>
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <CardContent className="flex-1 min-h-0 overflow-y-auto p-0">
                {renderLesVerken(true)}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Volgende les waarskuwing - nog nie voltooi nie + betaal prompt */}
        <Dialog open={showVolgendeLesWarning} onOpenChange={setShowVolgendeLesWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
                {language === 'af' ? 'Nog nie voltooi nie' : 'Not yet completed'}
              </DialogTitle>
              <DialogDescription>
                {language === 'af'
                  ? 'Jy moet hierdie les voltooi voor jy na die volgende les kan gaan. Voltooi al die aktiwiteite (vrae, verse, prent) en druk dan op "Voltooi les".'
                  : 'You must complete this lesson before moving to the next one. Complete all activities (questions, quiz, verses, picture) and then click "Complete lesson".'}
              </DialogDescription>
            </DialogHeader>
            {currentGemeente && !currentGemeente.is_demo && !hasGeloofsonderrigBetaal && (
              <div className="py-4 space-y-3">
                <p className="text-sm font-semibold text-amber-800">
                  {language === 'af' ? 'Betaal R100 vir al die lesse in jou graad:' : 'Pay R100 for all lessons in your grade:'}
                </p>
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3"
                  onClick={async () => {
                    if (!processGeloofsonderrigBetaling || !currentUser) return;
                    setShowVolgendeLesWarning(false);
                    const result = await processGeloofsonderrigBetaling(currentUser.id);
                    if (result?.success && result?.redirectUrl) window.location.href = result.redirectUrl;
                    else if (result?.error) toast({ title: language === 'af' ? 'Betaling fout' : 'Payment error', description: result.error, variant: 'destructive' });
                  }}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {language === 'af' ? 'Betaal sommer nou' : 'Pay now'}
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVolgendeLesWarning(false)}>
                {t.common.close}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Geloofsonderrig Betaal Bladsy - 1 gratis les, daarna R100 */}
        <Dialog open={showGeloofsonderrigPayView} onOpenChange={setShowGeloofsonderrigPayView}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                {language === 'af' ? 'Betaal vir KI-Kats' : 'Pay for KI-Kats'}
              </DialogTitle>
              <DialogDescription>
                {language === 'af'
                  ? "Jy het jou gratis les voltooi! Betaal R100 eenmalig vir al die lesse in jou graad. Jou gemeente admin kan ook namens jou betaal."
                  : "You've completed your free lesson! Pay R100 once for all lessons in your grade. Your church admin can also pay on your behalf."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-semibold text-amber-900">R100</p>
                <p className="text-sm text-amber-800">
                  {language === 'af'
                    ? "Eenmalige betaling vir al die lesse in jou graad."
                    : "One-time payment for all lessons in your grade."}
                </p>
              </div>
              <Button
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                disabled={!processGeloofsonderrigBetaling || !currentUser}
                onClick={async () => {
                  if (!processGeloofsonderrigBetaling || !currentUser) return;
                  const result = await processGeloofsonderrigBetaling(currentUser.id);
                  if (result?.success && result?.redirectUrl) {
                    window.location.href = result.redirectUrl;
                  } else if (result?.error) {
                    toast({ title: language === 'af' ? 'Betaling fout' : 'Payment error', description: result.error, variant: 'destructive' });
                  }
                }}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {language === 'af' ? 'Betaal R100' : 'Pay R100'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowGeloofsonderrigPayView(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Class Dialog */}
        <Dialog open={showCreateKlas} onOpenChange={setShowCreateKlas}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.mentor.createClass}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {language === 'af' ? 'Vul die besonderhede in om \'n nuwe klas te skep.' : 'Fill in the details to create a new class.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.mentor.className}</Label><Input value={newKlasNaam} onChange={(e) => setNewKlasNaam(e.target.value)} placeholder={language === 'af' ? 'bv. Graad 10 Kategese' : 'e.g. Grade 10 Catechism'} /></div>
              <div><Label>{t.mentor.classDescription}</Label><Textarea value={newKlasBeskrywing} onChange={(e) => setNewKlasBeskrywing(e.target.value)} placeholder={language === 'af' ? 'Kort beskrywing...' : 'Short description...'} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateKlas(false)}>{t.common.cancel}</Button>
              <Button onClick={handleCreateKlas} disabled={loading || !newKlasNaam.trim()}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{t.mentor.createClass}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Learner Dialog */}
        <Dialog open={showCreateLeerder} onOpenChange={(open) => {
          setShowCreateLeerder(open);
          if (!open) {
            setSelectedLidmaatId(null);
            setMemberSearch('');
            setNewLeerderNaam('');
            setNewLeerderVan('');
            setNewLeerderSelfoon('');
            setNewLeerderEpos('');
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />{t.mentor.createLearner}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {language === 'af' ? 'Kies \'n bestaande lidmaat of voeg \'n nuwe kind by.' : 'Select an existing member or add a new child.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t.mentor.searchMember}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={language === 'af' ? 'Tik naam of van om te soek...' : 'Type name or surname to search...'}
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {memberSearch.length > 1 && (
                  <div className="mt-2 border rounded-md max-h-[200px] overflow-y-auto bg-white shadow-sm">
                    {availableMembers
                      .filter(m => `${m.naam} ${m.van}`.toLowerCase().includes(memberSearch.toLowerCase()))
                      .map(m => (
                        <div
                          key={m.id}
                          className={`p-3 cursor-pointer hover:bg-blue-50 flex items-center justify-between border-b last:border-0 ${selectedLidmaatId === m.id ? 'bg-blue-50 border-blue-200' : ''}`}
                          onClick={() => {
                            setSelectedLidmaatId(m.id);
                            setNewLeerderNaam(m.naam);
                            setNewLeerderVan(m.van);
                            setMemberSearch(`${m.naam} ${m.van}`);
                          }}
                        >
                          <div>
                            <p className="font-medium">{m.naam} {m.van}</p>
                            <p className="text-xs text-gray-500">{m.epos || m.selfoon || 'Geen kontakbesonderhede'}</p>
                          </div>
                          {selectedLidmaatId === m.id && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </div>
                      ))}
                    {availableMembers.filter(m => `${m.naam} ${m.van}`.toLowerCase().includes(memberSearch.toLowerCase())).length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500 italic">
                        {language === 'af' ? 'Geen lidmaat gevind nie' : 'No member found'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
                  <span className="bg-white px-3 text-gray-400">{t.mentor.orAddNew}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'af' ? 'Naam' : 'Name'} *</Label>
                  <Input
                    value={newLeerderNaam}
                    onChange={(e) => {
                      setNewLeerderNaam(e.target.value);
                      if (selectedLidmaatId) { setSelectedLidmaatId(null); setMemberSearch(''); }
                    }}
                    placeholder={language === 'af' ? 'Voornaam' : 'First name'}
                  />
                </div>
                <div>
                  <Label>{language === 'af' ? 'Van' : 'Surname'} *</Label>
                  <Input
                    value={newLeerderVan}
                    onChange={(e) => {
                      setNewLeerderVan(e.target.value);
                      if (selectedLidmaatId) { setSelectedLidmaatId(null); setMemberSearch(''); }
                    }}
                    placeholder={language === 'af' ? 'Van' : 'Surname'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{language === 'af' ? 'Selfoon' : 'Phone'}</Label><Input value={newLeerderSelfoon} onChange={(e) => setNewLeerderSelfoon(e.target.value)} placeholder="082 123 4567" /></div>
                <div><Label>{language === 'af' ? 'E-pos' : 'Email'}</Label><Input value={newLeerderEpos} onChange={(e) => setNewLeerderEpos(e.target.value)} placeholder="email@voorbeeld.co.za" /></div>
              </div>
            </div>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setShowCreateLeerder(false)}>{t.common.cancel}</Button>
              <Button
                onClick={handleCreateLeerder}
                disabled={loading || (!selectedLidmaatId && (!newLeerderNaam.trim() || !newLeerderVan.trim()))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {selectedLidmaatId ? (language === 'af' ? 'Voeg Lidmaat By' : 'Add Member') : t.mentor.createLearner}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Viewer Dialog */}
        <Dialog open={!!selectedImageForView} onOpenChange={(open) => !open && setSelectedImageForView(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            {selectedImageForView && (
              <div>
                <img src={selectedImageForView.imageUrl} alt="" className="w-full max-h-[80vh] object-contain rounded-lg" />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Mind Map Dialog */}
        <Dialog open={showMindMap} onOpenChange={setShowMindMap}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-600" />
                {language === 'af' ? 'Infografika' : 'Infographic'}: {selectedLes?.titel || 'Les'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {language === 'af' ? 'Visuele voorstelling van die lesinhoud' : 'Visual representation of the lesson content'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 rounded-lg min-h-[300px]" id="infographic-container">
              {infographicSvg ? (
                <div dangerouslySetInnerHTML={{ __html: infographicSvg }} className="w-full h-auto" />
              ) : mindMapData ? (
                <MindMap data={mindMapData} width={700} height={400} />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{language === 'af' ? 'Geen breinkaart data beskikbaar nie' : 'No mind map data available'}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between sm:justify-between w-full">
              <Button variant="outline" onClick={() => setShowMindMap(false)}>{t.common.close}</Button>
              {(mindMapData || infographicSvg) && (
                <Button onClick={handleShareMindMap} className="bg-blue-600 hover:bg-blue-700">
                  <Facebook className="w-4 h-4 mr-2" />
                  {t.learner.shareToFacebook}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Options Dialog */}
        <Dialog open={showMindMapShare} onOpenChange={setShowMindMapShare}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{language === 'af' ? 'Deel Jou Prent' : 'Share Your Artwork'}</DialogTitle>
              <DialogDescription>
                {language === 'af'
                  ? 'Deel jou skepping en gedagtes.'
                  : 'Share your creation and thoughts.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{language === 'af' ? 'Wat beteken hierdie prent vir jou?' : 'What does this picture mean to you?'}</Label>
                <Textarea
                  value={mindMapShare.betekenis}
                  onChange={(e) => setMindMapShare(prev => ({ ...prev, betekenis: e.target.value }))}
                  placeholder={language === 'af' ? 'Tik jou boodskap hier...' : 'Type your message here...'}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="share-name-toggle"
                  checked={mindMapShare.includeNaam}
                  onCheckedChange={(checked) => setMindMapShare(prev => ({ ...prev, includeNaam: checked }))}
                />
                <Label htmlFor="share-name-toggle">
                  {language === 'af' ? 'Wys my naam by die prent' : 'Show my name with the picture'}
                </Label>
              </div>
            </div>
            {!mindMapShare.betekenis.trim() && (
              <p className="text-xs text-amber-600 mt-2 px-6">{language === 'af' ? 'Skryf eers wat die prent vir jou beteken in die boksie hierbo.' : 'First write what the picture means to you in the box above.'}</p>
            )}
            <DialogFooter className="sm:justify-between flex-row gap-2">
              <Button variant="ghost" onClick={() => setShowMindMapShare(false)}>{language === 'af' ? 'Kanselleer' : 'Cancel'}</Button>
              <Button onClick={handleConfirmShare} disabled={!mindMapShare.betekenis.trim()} className="bg-[#1877F2] hover:bg-[#166fe5] text-white w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed" title={!mindMapShare.betekenis.trim() ? (language === 'af' ? 'Skryf eers wat die prent vir jou beteken' : 'First write what the picture means to you') : ''}><Facebook className="w-4 h-4 mr-2" />{language === 'af' ? 'Deel op Facebook' : 'Share on Facebook'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LanguageContext.Provider >
  );
};

export default Geloofsonderrig;

const CompletionVideoPlayer = ({
  slides,
  lessonTitle = '',
  lessonContent = '',
  language = 'af',
  onInvokeAI,
  onAwardPunte,
  lesId,
  onShowLeaderboard,
  onClose,
  onShare,
  onRedo,
  progressData
}: {
  slides: any[];
  lessonTitle?: string;
  lessonContent?: string;
  language?: 'af' | 'en';
  onInvokeAI?: (action: string, data: any) => Promise<any>;
  onAwardPunte?: (aksie: string, punte: number, lesId?: string) => void;
  lesId?: string;
  onShowLeaderboard?: () => void;
  onClose: () => void;
  onShare: (data: any) => void;
  onRedo?: () => void;
  progressData?: { promptCount: number; ownQuestionsCount: number; answeredQuizCount: number; completedVersesCount: number; visualiseringsCount: number };
}) => {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [meaning, setMeaning] = useState('');
  const [includeName, setIncludeName] = useState(true);
  const [poem, setPoem] = useState<string | null>(null);
  const [generatingPoem, setGeneratingPoem] = useState(false);

  // Auto-advance
  useEffect(() => {
    const currentType = slides[currentIndex].type;
    if (currentType === 'intro' || currentType === 'qa' || currentType === 'image') {
      const timer = setTimeout(() => {
        if (currentIndex < slides.length - 1) setCurrentIndex(prev => prev + 1);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, slides]);

  const currentSlide = slides[currentIndex];

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl min-h-[600px] flex flex-col relative transition-all duration-500">
        {/* Voltooi les bar - Terug knoppie + progress + Herdoen bo-op (wys by outro) */}
        {currentSlide.type === 'outro' && (
          <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-b-2 border-emerald-200 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Button variant="outline" size="lg" className="font-bold border-2 border-emerald-400 text-emerald-700 hover:bg-emerald-100" onClick={onClose}>
                <ChevronLeft className="w-5 h-5 mr-2" />
                {language === 'af' ? 'Terug na Ranglys' : 'Back to Leaderboard'}
              </Button>
              <span className="text-sm font-semibold text-emerald-800">{language === 'af' ? 'Les voltooi!' : 'Lesson complete!'}</span>
              {onRedo && (
                <Button variant="outline" size="sm" className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50" onClick={onRedo}>
                  {language === 'af' ? 'Herdoen les' : 'Redo lesson'}
                </Button>
              )}
            </div>
            {progressData && (
              <div className="grid grid-cols-5 gap-2 text-xs font-bold">
                <div className="flex flex-col items-center p-2 rounded-xl bg-emerald-200 text-emerald-800" title={language === 'af' ? 'Gesprek' : 'Chat'}>
                  <span className="text-[10px] font-semibold leading-tight">{language === 'af' ? 'Gesprek' : 'Chat'}</span>
                  <span>{progressData.promptCount}/5</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-emerald-200 text-emerald-800" title={language === 'af' ? 'Eie vraag' : 'Own question'}>
                  <span className="text-[10px] font-semibold leading-tight">{language === 'af' ? 'Eie' : 'Own'}</span>
                  <span>{progressData.ownQuestionsCount}/1</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-emerald-200 text-emerald-800" title={language === 'af' ? 'Vrae' : 'Questions'}>
                  <span className="text-[10px] font-semibold leading-tight">{language === 'af' ? 'Vrae' : 'Q&A'}</span>
                  <span>{progressData.answeredQuizCount}/5</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-emerald-200 text-emerald-800" title={language === 'af' ? 'Verse' : 'Verses'}>
                  <span className="text-[10px] font-semibold leading-tight">{language === 'af' ? 'Verse' : 'Verses'}</span>
                  <span>{progressData.completedVersesCount}/3</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-emerald-200 text-emerald-800" title={language === 'af' ? 'Prent' : 'Picture'}>
                  <span className="text-[10px] font-semibold leading-tight">{language === 'af' ? 'Prent' : 'Pic'}</span>
                  <span>{progressData.visualiseringsCount}/1</span>
                </div>
              </div>
            )}
          </div>
        )}
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10 hover:bg-gray-100 rounded-full" onClick={onClose}><X className="w-6 h-6 text-gray-800" /></Button>

        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center w-full">
          {currentSlide.type === 'intro' && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-1000">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-12 h-12 text-blue-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 tracking-tight max-w-2xl mx-auto leading-tight">{currentSlide.title}</h1>
              <p className="text-2xl text-blue-600 font-medium">Geloofsonderrig Reis Voltooi!</p>
            </div>
          )}

          {currentSlide.type === 'qa' && (
            <div className="animate-in slide-in-from-right duration-700 text-left w-full max-w-3xl flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-full"><MessageCircle className="w-6 h-6 text-blue-600" /></div>
                <h2 className="text-2xl font-bold text-gray-400">Vraag & Antwoord</h2>
              </div>
              <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 shadow-sm">
                <p className="font-bold text-blue-900 mb-2 text-lg">Jou Vraag:</p>
                <p className="text-xl text-blue-800 leading-relaxed">"{currentSlide.question}"</p>
              </div>
              {currentSlide.answer && (
                <div className="bg-purple-50 p-8 rounded-2xl border border-purple-100 shadow-sm">
                  <p className="font-bold text-purple-900 mb-2 text-lg">Antwoord:</p>
                  <p className="text-lg text-purple-800 leading-relaxed">{currentSlide.answer}</p>
                </div>
              )}
            </div>
          )}

          {currentSlide.type === 'image' && (
            <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in duration-1000">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img src={currentSlide.url} alt="" className="max-h-[450px] object-cover" />
              </div>
            </div>
          )}

          {currentSlide.type === 'outro' && (
            <ScrollArea className="geloofsonderrig-scroll custom-scrollbar w-full max-w-2xl h-[70vh] max-h-[520px] pr-4 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="space-y-4 pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-700">{language === 'af' ? 'Baie Geluk!' : 'Congratulations!'}</h2>
              <p className="text-gray-600 text-base">{language === 'af' ? 'Jy het die les voltooi! Kies jou beloning:' : 'You completed the lesson! Choose your reward:'}</p>

              {/* Gedig beloning */}
              <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50/50 space-y-3">
                <h3 className="font-bold text-purple-800 flex items-center gap-2 text-sm">
                  <PenLine className="w-4 h-4" />
                  {language === 'af' ? 'Skep Gedig' : 'Create Poem'}
                </h3>
                <p className="text-sm text-purple-600">{language === 'af' ? 'Laat KI \'n gedig maak uit die les.' : 'Let AI create a poem from the lesson.'}</p>
                <Button
                  variant="outline"
                  className="w-full border-purple-300 hover:bg-purple-100 text-purple-700"
                  disabled={generatingPoem || !onInvokeAI}
                  onClick={async () => {
                    if (!onInvokeAI || !lessonContent) return;
                    setGeneratingPoem(true);
                    try {
                      const result = await onInvokeAI('generate_poem', { lesInhoud: lessonContent, lesTitel: lessonTitle, language });
                      if (result?.success && result?.data?.poem) {
                        setPoem(result.data.poem);
                        onAwardPunte?.('gedig', 3, lesId);
                        toast({ title: language === 'af' ? 'Gedig geskep! +3 punte!' : 'Poem created! +3 points!' });
                      } else throw new Error(result?.error || 'Failed');
                    } catch (e: any) {
                      toast({ title: language === 'af' ? 'Kon nie gedig genereer nie' : 'Could not generate poem', variant: 'destructive' });
                    } finally {
                      setGeneratingPoem(false);
                    }
                  }}
                >
                  {generatingPoem ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenLine className="w-4 h-4 mr-2" />}
                  {generatingPoem ? (language === 'af' ? 'Genereer...' : 'Generating...') : (language === 'af' ? 'Skep Gedig' : 'Create Poem')}
                </Button>
                {poem && (
                  <>
                    <div className="mt-2 p-3 bg-white rounded-lg border border-purple-200 text-sm text-purple-900 whitespace-pre-wrap">{poem}</div>
                    <Button variant="outline" size="sm" className="mt-2 border-purple-300 text-purple-700" onClick={() => {
                      const blob = new Blob([poem], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `gedig_${lessonTitle?.replace(/\s+/g, '_') || 'les'}.txt`; a.click();
                      toast({ title: language === 'af' ? 'Gedig afgelaai!' : 'Poem downloaded!' });
                    }}>
                      <Download className="w-4 h-4 mr-1" />{language === 'af' ? 'Laai gedig af' : 'Download poem'}
                    </Button>
                  </>
                )}
              </div>

              {/* Jou prente (gegenereer in die les) - met aflaai */}
              {(() => {
                const imgSlides = slides.filter((s: any) => s.type === 'image');
                if (imgSlides.length === 0) return null;
                return (
                  <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/50 space-y-3">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      {language === 'af' ? 'Jou prente (gegenereer in die les)' : 'Your pictures (generated in lesson)'}
                    </h3>
                    <div className="flex gap-3 flex-wrap">
                      {imgSlides.map((s: any, i: number) => (
                        <div key={i} className="relative group">
                          <img src={s.url} alt="" className="h-24 w-24 object-cover rounded-xl border-2 border-blue-200 shadow-md" />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute bottom-1 right-1 opacity-90 group-hover:opacity-100 bg-white border-blue-300 text-blue-700"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = s.url;
                              a.download = `prent_${lessonTitle?.replace(/\s+/g, '_') || 'les'}_${i + 1}.png`;
                              a.click();
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700"
                      onClick={() => {
                        imgSlides.forEach((s: any, i: number) => {
                          const a = document.createElement('a');
                          a.href = s.url;
                          a.download = `prent_${lessonTitle?.replace(/\s+/g, '_') || 'les'}_${i + 1}.png`;
                          a.click();
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />{language === 'af' ? 'Laai al prente af' : 'Download all pictures'}
                    </Button>
                  </div>
                );
              })()}

              <div className="border-t pt-4 space-y-3">
                <p className="text-gray-600 text-base">{language === 'af' ? 'Wat het hierdie les vir jou beteken?' : 'What did this lesson mean to you?'}</p>
                <Textarea
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  placeholder={language === 'af' ? 'Tik jou gedagtes hier...' : 'Type your thoughts here...'}
                  className="min-h-[72px] text-sm p-3 border-2 border-gray-200 focus:border-green-500 rounded-xl resize-none"
                />
                <div className="flex items-center gap-3 justify-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <Switch checked={includeName} onCheckedChange={setIncludeName} id="name-toggle" />
                  <Label htmlFor="name-toggle" className="text-base cursor-pointer">{language === 'af' ? 'Sit my naam by' : 'Include my name'}</Label>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!meaning.trim()}
                    onClick={() => {
                      const firstImg = slides.find((s: any) => s.type === 'image');
                      const imgBase64 = firstImg?.url?.includes(',') ? firstImg.url.split(',')[1] : undefined;
                      onShare({ meaning, includeName, imageBase64: imgBase64, poem });
                    }}
                  >
                    <Share2 className="w-5 h-5 mr-2" /> {language === 'af' ? 'Deel op Facebook en Instagram' : 'Share on Facebook and Instagram'}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    {language === 'af' ? 'Skryf eers wat die les vir jou beteken in die boksie hierbo.' : 'First write what the lesson means to you in the box above.'}
                  </p>
                </div>
              </div>
            </div>
            </ScrollArea>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 w-full mt-auto">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

