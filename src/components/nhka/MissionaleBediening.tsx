import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import {
  Ear, Heart, Users, BookOpen, Church, RefreshCw, ArrowRight, ChevronDown, ChevronUp,
  Target, Lightbulb, CheckCircle2, Sparkles, Play, Award, MapPin, MessageCircle,
  Camera, Mic, Plus, Globe, Calendar, Clock, ThumbsUp, Send, Search, Filter,
  Home, Footprints, HandHeart, UserPlus, BookMarked, Repeat, Trophy, Star,
  Languages, ChevronRight, FileText, Download, BarChart3, Settings, Eye, X,
  Loader2, AlertCircle, PartyPopper, Flame, User, GraduationCap
} from 'lucide-react';

const HERO_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/693a23b83be6a3fa1e4a5844_1766919495457_e55d8e58.jpg';

// Fresh Expressions Color Palette
const COLORS = {
  gold: '#D4A84B',      // Kingdom of God - Pantone 139
  darkBlue: '#002855',  // Security & Stability - Pantone 281
  red: '#C8102E',       // Redemption & Love - Pantone 194
  olive: '#6B7B3C',     // Peace & Growth - Pantone 5825
  purple: '#8B7CB3',    // Spirituality - Pantone 7446
};

// Bilingual content
const content = {
  af: {
    appName: 'Aktiveer Missionale Bediening',
    subtitle: 'Reis van Missionale Gemeenskapsvorming',
    heroTitle: 'Begin Jou Missionale Reis',
    heroDesc: 'Word begelei deur ses transformerende stappe om nuwe geloofsgemeenskappe in Suid-Afrika te vestig.',
    startJourney: 'Begin Reis',
    viewProgress: 'Sien Vordering',
    tabs: {
      home: 'Tuis',
      journey: 'Reis',
      learn: 'Leer',
      community: 'Gemeenskap',
      prayer: 'Gebed',
      profile: 'Profiel'
    },
    steps: [
      { id: 1, title: 'Luister', subtitle: 'Ontdek behoeftes', icon: Ear, color: COLORS.gold, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' },
      { id: 2, title: 'Leef Liefde & Dien', subtitle: 'Wees Christus se hande', icon: Heart, color: COLORS.red, bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700' },
      { id: 3, title: 'Bou Gemeenskap', subtitle: 'Skep verbindings', icon: Users, color: COLORS.darkBlue, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
      { id: 4, title: 'Ontdek Dissipelskap', subtitle: 'Groei in geloof', icon: Footprints, color: COLORS.olive, bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
      { id: 5, title: 'Kerk Neem Vorm', subtitle: 'Vestig ritmes', icon: Church, color: COLORS.purple, bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
      { id: 6, title: 'Doen Dit Weer', subtitle: 'Vermenigvuldig', icon: RefreshCw, color: COLORS.gold, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' }
    ],
    bibleVerses: {
      1: ['Spreuke 18:13 - Wie antwoord voordat hy geluister het, dit is vir hom dwaasheid en skande.', 'Jakobus 1:19 - Weet dit, my geliefde broeders: elke mens moet gou wees om te luister, stadig om te praat.'],
      2: ['Johannes 13:34-35 - Hieraan sal almal weet dat julle my dissipels is, as julle liefde onder mekaar het.', 'Markus 10:45 - Want die Seun van die mens het ook nie gekom om gedien te word nie, maar om te dien.'],
      3: ['Handelinge 2:46-47 - Hulle het eendragtig volhard en elke dag brood gebreek in die huise.', 'Hebreërs 10:24-25 - Laat ons op mekaar ag gee om tot liefde en goeie werke aan te spoor.'],
      4: ['Matteus 28:19-20 - Gaan dan heen, maak dissipels van al die nasies.', '2 Timoteus 2:2 - Wat jy van my gehoor het, vertrou dit toe aan getroue manne.'],
      5: ['Handelinge 2:42 - Hulle het volhard in die leer van die apostels en in die gemeenskap.', 'Kolossense 3:16 - Laat die woord van Christus ryklik in julle woon.'],
      6: ['Filippense 1:6 - Hy wat \'n goeie werk in julle begin het, sal dit voleindig.', 'Galasiërs 6:9 - Laat ons nie moeg word om goed te doen nie.']
    },
    activities: {
      1: ['Gebedslopie', 'Buurt-onderhoude', 'Gemeenskapsnavorsing', 'Stilte voor God'],
      2: ['Vrywillige diens', 'Sopkombuis', 'Buurthulp', 'Kospakkies'],
      3: ['Huisete', 'Gemeenskapsgebeure', 'Kleingroep', 'Straatbraai'],
      4: ['Bybelstudie', 'Getuienis deel', 'Mentorskap', 'Geloofsgesprekke'],
      5: ['Weeklikse byeenkoms', 'Aanbidding', 'Leiersopleiding', 'Sakramente'],
      6: ['Evaluasie', 'Verslagskrywing', 'Nuwe area', 'Mentoring']
    },
    provinces: ['Gauteng', 'Wes-Kaap', 'KwaZulu-Natal', 'Oos-Kaap', 'Vrystaat', 'Mpumalanga', 'Limpopo', 'Noord-Wes', 'Noord-Kaap', 'Namibië', 'Botswana', 'Zimbabwe', 'Mosambiek', 'Zambië', 'Angola', 'Malawi', 'Tanzanië', 'Kenia', 'Uganda', 'Ethiopië', 'Nigeria', 'Ghana', 'Senegal', 'Marokko', 'Egipte'],
    prayerWall: 'Gebedsmuur',
    addPrayer: 'Voeg Gebed By',
    prayedFor: 'Ek bid saam',
    answered: 'Beantwoord',
    createProject: 'Skep Nuwe Projek',
    projectName: 'Projek Naam',
    description: 'Beskrywing',
    province: 'Provinsie',
    areaType: 'Area Tipe',
    urban: 'Stedelik',
    rural: 'Landelik',
    suburban: 'Voorstedelik',
    save: 'Stoor',
    cancel: 'Kanselleer',
    myProjects: 'My Projekte',
    communityHub: 'Gemeenskapsentrum',
    shareUpdate: 'Deel Opdatering',
    celebrate: 'Vier!',
    lessons: 'Lesse',
    quizzes: 'Toetse',
    certificates: 'Sertifikate',
    badges: 'Kentekens',
    statistics: 'Statistieke',
    todaySuggestion: 'Vandag se Voorstel',
    quickActions: 'Vinnige Aksies',
    logActivity: 'Log Aktiwiteit',
    viewLessons: 'Sien Lesse',
    joinPrayer: 'Sluit aan by Gebed',
    exploreMap: 'Verken Kaart',
    recentActivity: 'Onlangse Aktiwiteit',
    nationalStats: 'Nasionale Statistieke',
    activeProjects: 'Aktiewe Projekte',
    peopleReached: 'Mense Bereik',
    volunteerHours: 'Vrywillige Ure',
    newCommunities: 'Nuwe Gemeenskappe'
  },
  en: {
    appName: 'Activate Missional Ministry',
    subtitle: 'Journey of Missional Community Formation',
    heroTitle: 'Start Your Missional Journey',
    heroDesc: 'Be guided through six transformative steps to establish new faith communities in South Africa.',
    startJourney: 'Start Journey',
    viewProgress: 'View Progress',
    tabs: {
      home: 'Home',
      journey: 'Journey',
      learn: 'Learn',
      community: 'Community',
      prayer: 'Prayer',
      profile: 'Profile'
    },
    steps: [
      { id: 1, title: 'Listening', subtitle: 'Discover needs', icon: Ear, color: COLORS.gold, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' },
      { id: 2, title: 'Loving & Serving', subtitle: 'Be Christ\'s hands', icon: Heart, color: COLORS.red, bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700' },
      { id: 3, title: 'Building Community', subtitle: 'Create connections', icon: Users, color: COLORS.darkBlue, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
      { id: 4, title: 'Exploring Discipleship', subtitle: 'Grow in faith', icon: Footprints, color: COLORS.olive, bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
      { id: 5, title: 'Church Taking Shape', subtitle: 'Establish rhythms', icon: Church, color: COLORS.purple, bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
      { id: 6, title: 'Doing It Again', subtitle: 'Multiply', icon: RefreshCw, color: COLORS.gold, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' }
    ],
    bibleVerses: {
      1: ['Proverbs 18:13 - To answer before listening—that is folly and shame.', 'James 1:19 - Everyone should be quick to listen, slow to speak.'],
      2: ['John 13:34-35 - By this everyone will know that you are my disciples, if you love one another.', 'Mark 10:45 - For even the Son of Man did not come to be served, but to serve.'],
      3: ['Acts 2:46-47 - They broke bread in their homes and ate together with glad hearts.', 'Hebrews 10:24-25 - Let us consider how we may spur one another on toward love and good deeds.'],
      4: ['Matthew 28:19-20 - Go and make disciples of all nations.', '2 Timothy 2:2 - Entrust to reliable people who will also be qualified to teach others.'],
      5: ['Acts 2:42 - They devoted themselves to the apostles\' teaching and to fellowship.', 'Colossians 3:16 - Let the message of Christ dwell among you richly.'],
      6: ['Philippians 1:6 - He who began a good work in you will carry it on to completion.', 'Galatians 6:9 - Let us not become weary in doing good.']
    },
    activities: {
      1: ['Prayer walk', 'Neighbour interviews', 'Community research', 'Silence before God'],
      2: ['Volunteer service', 'Soup kitchen', 'Neighbour help', 'Food parcels'],
      3: ['Home meals', 'Community events', 'Small group', 'Street braai'],
      4: ['Bible study', 'Share testimony', 'Mentorship', 'Faith conversations'],
      5: ['Weekly gathering', 'Worship', 'Leadership training', 'Sacraments'],
      6: ['Evaluation', 'Report writing', 'New area', 'Mentoring']
    },
    provinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape', 'Namibia', 'Botswana', 'Zimbabwe', 'Mozambique', 'Zambia', 'Angola', 'Malawi', 'Tanzania', 'Kenya', 'Uganda', 'Ethiopia', 'Nigeria', 'Ghana', 'Senegal', 'Morocco', 'Egypt'],
    prayerWall: 'Prayer Wall',
    addPrayer: 'Add Prayer',
    prayedFor: 'I\'m praying',
    answered: 'Answered',
    createProject: 'Create New Project',
    projectName: 'Project Name',
    description: 'Description',
    province: 'Province',
    areaType: 'Area Type',
    urban: 'Urban',
    rural: 'Rural',
    suburban: 'Suburban',
    save: 'Save',
    cancel: 'Cancel',
    myProjects: 'My Projects',
    communityHub: 'Community Hub',
    shareUpdate: 'Share Update',
    celebrate: 'Celebrate!',
    lessons: 'Lessons',
    quizzes: 'Quizzes',
    certificates: 'Certificates',
    badges: 'Badges',
    statistics: 'Statistics',
    todaySuggestion: 'Today\'s Suggestion',
    quickActions: 'Quick Actions',
    logActivity: 'Log Activity',
    viewLessons: 'View Lessons',
    joinPrayer: 'Join Prayer',
    exploreMap: 'Explore Map',
    recentActivity: 'Recent Activity',
    nationalStats: 'National Statistics',
    activeProjects: 'Active Projects',
    peopleReached: 'People Reached',
    volunteerHours: 'Volunteer Hours',
    newCommunities: 'New Communities'
  }
};

// Sample data for demonstration with map coordinates
const sampleProjects = [
  { id: '1', name: 'Pretoria-Oos Bejaardes', nameEn: 'Pretoria East Elderly', province: 'Gauteng', currentStep: 2, status: 'active', peopleReached: 45, lat: -25.7479, lng: 28.2293, city: 'Pretoria' },
  { id: '2', name: 'Kaapstad Strand Uitreik', nameEn: 'Cape Town Surf Outreach', province: 'Western Cape', currentStep: 3, status: 'active', peopleReached: 120, lat: -33.9249, lng: 18.4241, city: 'Kaapstad' },
  { id: '3', name: 'Vrystaat Plaaswerkers', nameEn: 'Free State Farmworkers', province: 'Free State', currentStep: 1, status: 'active', peopleReached: 28, lat: -29.1211, lng: 26.2140, city: 'Bloemfontein' },
  { id: '4', name: 'Durban Gemeenskapstuin', nameEn: 'Durban Community Garden', province: 'KwaZulu-Natal', currentStep: 4, status: 'active', peopleReached: 65, lat: -29.8587, lng: 31.0218, city: 'Durban' },
  { id: '5', name: 'Johannesburg Binnestad', nameEn: 'Johannesburg Inner City', province: 'Gauteng', currentStep: 2, status: 'active', peopleReached: 89, lat: -26.2041, lng: 28.0473, city: 'Johannesburg' },
  { id: '6', name: 'Port Elizabeth Hawe', nameEn: 'Port Elizabeth Harbour', province: 'Eastern Cape', currentStep: 1, status: 'active', peopleReached: 32, lat: -33.9608, lng: 25.6022, city: 'Gqeberha' },
  { id: '7', name: 'Nelspruit Jeug', nameEn: 'Nelspruit Youth', province: 'Mpumalanga', currentStep: 3, status: 'active', peopleReached: 54, lat: -25.4753, lng: 30.9694, city: 'Nelspruit' },
  { id: '8', name: 'Polokwane Kliniek', nameEn: 'Polokwane Clinic', province: 'Limpopo', currentStep: 2, status: 'active', peopleReached: 41, lat: -23.9045, lng: 29.4689, city: 'Polokwane' }
];

const samplePrayers = [
  { id: '1', request: 'Bid vir ons buurt wat sukkel met werkloosheid.', requestEn: 'Pray for our neighbourhood struggling with unemployment.', prayerCount: 24, isAnswered: false },
  { id: '2', request: 'Dankie Here vir die nuwe vriende wat ons gemaak het!', requestEn: 'Thank you Lord for the new friends we made!', prayerCount: 18, isAnswered: true },
  { id: '3', request: 'Ons soek wysheid vir ons volgende stap.', requestEn: 'We seek wisdom for our next step.', prayerCount: 31, isAnswered: false }
];

const samplePosts = [
  { id: '1', title: 'Eerste Gebedslopie!', titleEn: 'First Prayer Walk!', content: 'Vandag het ons ons eerste gebedslopie gedoen. Ons het soveel gesien en gehoor.', contentEn: 'Today we did our first prayer walk. We saw and heard so much.', type: 'update', likes: 12, comments: 5, author: 'Anna van Wyk', project: 'Pretoria-Oos' },
  { id: '2', title: 'Sopkombuis Sukses', titleEn: 'Soup Kitchen Success', content: 'Ons sopkombuis het 50 mense gevoed hierdie week!', contentEn: 'Our soup kitchen fed 50 people this week!', type: 'celebration', likes: 34, comments: 8, author: 'Johan Botha', project: 'Kaapstad' },
  { id: '3', title: 'Nuwe Kleingroep Begin', titleEn: 'New Small Group Started', content: 'Ons het ons eerste kleingroep byeenkoms gehad met 8 mense.', contentEn: 'We had our first small group meeting with 8 people.', type: 'testimony', likes: 28, comments: 12, author: 'Marie du Plessis', project: 'Bloemfontein' }
];

const sampleLessons = [
  { id: '1', step: 1, title: 'Luister as Geestelike Dissipline', titleEn: 'Listening as Spiritual Discipline', duration: 15, completed: true },
  { id: '2', step: 1, title: 'Gebedslopies in Jou Gemeenskap', titleEn: 'Prayer Walking in Your Community', duration: 12, completed: false },
  { id: '3', step: 2, title: 'Klein Dade van Liefde', titleEn: 'Small Acts of Love', duration: 10, completed: false },
  { id: '4', step: 2, title: 'Gemeenskapsdiens Projekte', titleEn: 'Community Service Projects', duration: 15, completed: false }
];

const sampleBadges = [
  { id: '1', name: 'Eerste Luisteraar', nameEn: 'First Listener', icon: Ear, earned: true, color: COLORS.gold },
  { id: '2', name: 'Gebedslopie Held', nameEn: 'Prayer Walk Hero', icon: Footprints, earned: true, color: COLORS.gold },
  { id: '3', name: 'Dienende Hart', nameEn: 'Serving Heart', icon: Heart, earned: false, color: COLORS.red },
  { id: '4', name: 'Gemeenskapbouer', nameEn: 'Community Builder', icon: Users, earned: false, color: COLORS.darkBlue },
  { id: '5', name: 'Dissipelmaker', nameEn: 'Disciple Maker', icon: BookOpen, earned: false, color: COLORS.olive },
  { id: '6', name: 'Voltooier', nameEn: 'Completer', icon: Trophy, earned: false, color: COLORS.purple }
];

// Africa Map Component with project markers (whole continent)
const AfricaMap: React.FC<{ projects: typeof sampleProjects; language: 'af' | 'en'; onProjectClick: (project: typeof sampleProjects[0]) => void }> = ({ projects, language, onProjectClick }) => {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  // Africa bounds: lat -37 to 37, lng -18 to 52
  const getMapPosition = (lat: number, lng: number) => {
    const x = ((lng - (-18)) / (52 - (-18))) * 420 + 40;
    const y = ((37 - lat) / (37 - (-37))) * 320 + 20;
    return { x, y };
  };

  return (
    <div className="relative">
      <svg viewBox="0 0 500 360" className="w-full h-auto">
        {/* Africa continent outline - simplified */}
        <path
          d="M180,50 L220,45 L260,55 L300,50 L340,60 L380,75 L410,95 L430,130 L435,170 L425,210 L400,250 L370,285 L330,310 L280,320 L230,315 L190,300 L150,275 L120,245 L95,210 L80,170 L75,130 L85,95 L105,70 L135,55 L160,50 Z"
          fill="#f0f4f8"
          stroke="#002855"
          strokeWidth="2"
        />
        {/* Madagascar */}
        <path d="M420,220 L435,200 L440,230 L430,255 L415,250 Z" fill="#f0f4f8" stroke="#002855" strokeWidth="1" />

        {/* Project markers */}
        {projects.map((project) => {
          const pos = getMapPosition(project.lat, project.lng);
          const isHovered = hoveredProject === project.id;

          return (
            <g
              key={project.id}
              className="cursor-pointer transition-transform"
              onClick={() => onProjectClick(project)}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              {/* Pulse animation for active projects */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 20 : 12}
                fill={COLORS.red}
                opacity={0.2}
                className="animate-pulse"
              />
              {/* Main marker */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 10 : 6}
                fill={COLORS.red}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-200"
              />
              {/* Label on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={pos.x - 60}
                    y={pos.y - 45}
                    width="120"
                    height="35"
                    rx="4"
                    fill="white"
                    stroke={COLORS.darkBlue}
                    strokeWidth="1"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 30}
                    fontSize="10"
                    fontWeight="bold"
                    fill={COLORS.darkBlue}
                    textAnchor="middle"
                  >
                    {language === 'af' ? project.name : project.nameEn}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y - 18}
                    fontSize="9"
                    fill="#666"
                    textAnchor="middle"
                  >
                    {project.peopleReached} {language === 'af' ? 'bereik' : 'reached'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#C8102E]" />
          <span className="text-gray-600">{language === 'af' ? 'Aktiewe Projek' : 'Active Project'}</span>
        </div>
        <div className="text-gray-500">
          {projects.length} {language === 'af' ? 'projekte' : 'projects'}
        </div>
      </div>
    </div>
  );
};

const MissionaleBediening: React.FC = () => {
  const { currentUser, setCurrentView, language, setLanguage } = useNHKA();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [currentProject, setCurrentProject] = useState(sampleProjects[0]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [selectedMapProject, setSelectedMapProject] = useState<typeof sampleProjects[0] | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [newProjectData, setNewProjectData] = useState({ name: '', description: '', province: '', areaType: 'urban' });
  const [activityData, setActivityData] = useState({ title: '', notes: '', type: 'listening', comfortLevel: 3 });
  const [newPrayer, setNewPrayer] = useState('');
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [missionaleCourses, setMissionaleCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const t = content[language];
  const steps = t.steps;

  useEffect(() => {
    const fetchMissionaleCourses = async () => {
      try {
        setLoadingCourses(true);
        const { data, error } = await supabase
          .from('lms_kursusse')
          .select('*')
          .eq('is_missionaal', true)
          .eq('is_aktief', true);

        if (error) throw error;
        setMissionaleCourses(data || []);
      } catch (err) {
        console.error('Error fetching missionale courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchMissionaleCourses();
  }, []);

  const getStepProgress = (stepId: number) => {
    if (currentProject.currentStep > stepId) return 100;
    if (currentProject.currentStep === stepId) return 50;
    return 0;
  };

  const getTotalProgress = () => {
    return Math.round((currentProject.currentStep / 6) * 100);
  };

  const handleMapProjectClick = (project: typeof sampleProjects[0]) => {
    setSelectedMapProject(project);
    setShowProjectDetail(true);
  };

  // Home Tab Content
  const renderHomeTab = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Aktiveer Missionale Bediening" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002855]/90 via-[#002855]/70 to-transparent" />
        </div>
        <div className="relative z-10 p-6 md:p-10 min-h-[280px] flex flex-col justify-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-[#D4A84B] text-[#002855]">
                <Sparkles className="w-3 h-3 mr-1" />
                {t.appName}
              </Badge>
              <div className="flex bg-black/20 rounded-lg p-1 backdrop-blur-sm">
                <Button
                  size="sm"
                  onClick={() => setLanguage('af')}
                  variant={language === 'af' ? 'default' : 'ghost'}
                  className={`h-8 px-4 ${language === 'af' ? 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3f]' : 'text-white hover:text-white hover:bg-white/10'}`}
                >
                  Afrikaans
                </Button>
                <Button
                  size="sm"
                  onClick={() => setLanguage('en')}
                  variant={language === 'en' ? 'default' : 'ghost'}
                  className={`h-8 px-4 ${language === 'en' ? 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3f]' : 'text-white hover:text-white hover:bg-white/10'}`}
                >
                  English
                </Button>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">{t.heroTitle}</h1>
            <p className="text-white/90 mb-6">{t.heroDesc}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setActiveTab('journey')} className="bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855]">
                {t.startJourney}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 border-white/50 text-white hover:bg-white/30 hover:text-white"
                onClick={() => setActiveTab('profile')}
              >
                <Eye className="w-4 h-4 mr-2" />
                {t.viewProgress}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Project Card */}
      {currentProject && (
        <Card className="border-2 border-[#D4A84B]/30 bg-gradient-to-r from-[#D4A84B]/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>{language === 'af' ? 'Huidige Projek' : 'Current Project'}</CardDescription>
                <CardTitle className="text-[#002855]">{language === 'af' ? currentProject.name : currentProject.nameEn}</CardTitle>
              </div>
              <Badge className="bg-[#002855] text-white">
                <MapPin className="w-3 h-3 mr-1" />
                {currentProject.province}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{language === 'af' ? 'Vordering' : 'Progress'}</span>
                <span className="font-semibold text-[#002855]">{getTotalProgress()}%</span>
              </div>
              <Progress value={getTotalProgress()} className="h-2" />
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-gray-600">{language === 'af' ? 'Huidige Stap:' : 'Current Step:'}</span>
                <Badge style={{ backgroundColor: steps[currentProject.currentStep - 1].color }} className="text-white">
                  {steps[currentProject.currentStep - 1].title}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Suggestion */}
      <Card className="border-[#6B7B3C]/30 bg-[#6B7B3C]/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-[#6B7B3C]">
            <Lightbulb className="w-5 h-5" />
            {t.todaySuggestion}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-3">
            {language === 'af'
              ? 'Neem vandag 15 minute om \'n gebedslopie in jou buurt te doen. Bid met oop oë en let op wat jy sien.'
              : 'Take 15 minutes today to do a prayer walk in your neighbourhood. Pray with open eyes and notice what you see.'}
          </p>
          <Button variant="outline" size="sm" className="border-[#6B7B3C] text-[#6B7B3C] hover:bg-[#6B7B3C]/10">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {language === 'af' ? 'Merk as Gedoen' : 'Mark as Done'}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-[#002855] mb-3">{t.quickActions}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-[#D4A84B]/30 hover:bg-[#D4A84B]/10" onClick={() => setShowLogActivity(true)}>
            <Plus className="w-5 h-5 text-[#D4A84B]" />
            <span className="text-sm">{t.logActivity}</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-[#8B7CB3]/30 hover:bg-[#8B7CB3]/10" onClick={() => setActiveTab('learn')}>
            <BookOpen className="w-5 h-5 text-[#8B7CB3]" />
            <span className="text-sm">{t.viewLessons}</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-[#C8102E]/30 hover:bg-[#C8102E]/10" onClick={() => setActiveTab('prayer')}>
            <HandHeart className="w-5 h-5 text-[#C8102E]" />
            <span className="text-sm">{t.joinPrayer}</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-[#002855]/30 hover:bg-[#002855]/10" onClick={() => setActiveTab('community')}>
            <Globe className="w-5 h-5 text-[#002855]" />
            <span className="text-sm">{t.exploreMap}</span>
          </Button>
        </div>
      </div>

      {/* National Statistics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-[#002855]">{t.nationalStats}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-[#D4A84B]/10">
              <div className="text-2xl font-bold text-[#D4A84B]">47</div>
              <div className="text-xs text-gray-600">{t.activeProjects}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#C8102E]/10">
              <div className="text-2xl font-bold text-[#C8102E]">2,340</div>
              <div className="text-xs text-gray-600">{t.peopleReached}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#6B7B3C]/10">
              <div className="text-2xl font-bold text-[#6B7B3C]">1,856</div>
              <div className="text-xs text-gray-600">{t.volunteerHours}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#8B7CB3]/10">
              <div className="text-2xl font-bold text-[#8B7CB3]">12</div>
              <div className="text-xs text-gray-600">{t.newCommunities}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-[#002855]">{t.recentActivity}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {samplePosts.slice(0, 3).map((post) => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`p-2 rounded-full ${post.type === 'celebration' ? 'bg-[#D4A84B]/20' : post.type === 'testimony' ? 'bg-[#8B7CB3]/20' : 'bg-[#002855]/20'}`}>
                  {post.type === 'celebration' ? <PartyPopper className="w-4 h-4 text-[#D4A84B]" /> :
                    post.type === 'testimony' ? <Flame className="w-4 h-4 text-[#8B7CB3]" /> :
                      <MessageCircle className="w-4 h-4 text-[#002855]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#002855] text-sm">{language === 'af' ? post.title : post.titleEn}</p>
                  <p className="text-xs text-gray-500">{post.author} • {post.project}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ThumbsUp className="w-3 h-3" />
                  {post.likes}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Journey Tab Content
  const renderJourneyTab = () => (
    <div className="space-y-6">
      {/* Journey Progress Overview */}
      <Card className="bg-gradient-to-br from-[#002855] to-[#003d7a] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{language === 'af' ? 'Jou Reis Vordering' : 'Your Journey Progress'}</h3>
            <Badge className="bg-[#D4A84B] text-[#002855]">{getTotalProgress()}%</Badge>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${currentProject.currentStep > step.id ? 'bg-green-500' :
                    currentProject.currentStep === step.id ? 'bg-[#D4A84B]' : 'bg-white/20'
                    }`}
                  onClick={() => setExpandedStep(step.id)}
                >
                  {currentProject.currentStep > step.id ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <step.icon className={`w-5 h-5 ${currentProject.currentStep === step.id ? 'text-[#002855]' : 'text-white/70'}`} />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 rounded ${currentProject.currentStep > step.id ? 'bg-green-500' : 'bg-white/20'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-white/80">
            {language === 'af'
              ? `Jy is tans by Stap ${currentProject.currentStep}: ${steps[currentProject.currentStep - 1].title}`
              : `You are currently at Step ${currentProject.currentStep}: ${steps[currentProject.currentStep - 1].title}`}
          </p>
        </CardContent>
      </Card>

      {/* Step Cards */}
      <div className="space-y-4">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isExpanded = expandedStep === step.id;
          const isCompleted = currentProject.currentStep > step.id;
          const isCurrent = currentProject.currentStep === step.id;

          return (
            <Card
              key={step.id}
              className={`border-2 transition-all duration-300 overflow-hidden ${isExpanded ? `${step.bgColor} ${step.borderColor}` : 'border-gray-200'
                } ${isCompleted ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
            >
              <CardHeader className="cursor-pointer" onClick={() => setExpandedStep(isExpanded ? null : step.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${step.bgColor} border ${step.borderColor}`}>
                      <StepIcon className="w-6 h-6" style={{ color: step.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{language === 'af' ? 'Stap' : 'Step'} {step.id}</Badge>
                        {isCompleted && <Badge className="bg-green-500 text-white text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />{language === 'af' ? 'Voltooi' : 'Complete'}</Badge>}
                        {isCurrent && <Badge className="bg-[#D4A84B] text-[#002855] text-xs">{language === 'af' ? 'Huidig' : 'Current'}</Badge>}
                      </div>
                      <CardTitle className="text-lg text-[#002855]">{step.title}</CardTitle>
                      <CardDescription>{step.subtitle}</CardDescription>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-6">
                  {/* Bible Verses */}
                  <div className={`p-4 rounded-xl ${step.bgColor} border ${step.borderColor}`}>
                    <h4 className="font-semibold text-[#002855] mb-2 flex items-center gap-2">
                      <BookMarked className="w-4 h-4" />
                      {language === 'af' ? 'Skrifverwysings' : 'Scripture References'}
                    </h4>
                    <div className="space-y-2">
                      {t.bibleVerses[step.id as keyof typeof t.bibleVerses].map((verse, idx) => (
                        <p key={idx} className="text-sm text-gray-700 italic">{verse}</p>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div>
                    <h4 className="font-semibold text-[#002855] mb-3">{language === 'af' ? 'Aktiwiteite' : 'Activities'}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {t.activities[step.id as keyof typeof t.activities].map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white border">
                          <CheckCircle2 className="w-4 h-4 text-gray-300" />
                          <span className="text-sm">{activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setShowLogActivity(true)} style={{ backgroundColor: step.color }} className="text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      {t.logActivity}
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('learn')}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      {t.viewLessons}
                    </Button>
                    {isCurrent && (
                      <Button variant="ghost" className="text-green-600">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {language === 'af' ? 'Voltooi Stap' : 'Complete Step'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Learn Tab Content
  const renderLearnTab = () => (
    <div className="space-y-6">
      {/* LMS Header */}
      <Card className="bg-gradient-to-r from-[#8B7CB3] to-[#6B5B95] text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{language === 'af' ? 'Leersentrum' : 'Learning Centre'}</h2>
              <p className="text-white/80">{language === 'af' ? 'Voltooi lesse en verdien sertifikate' : 'Complete lessons and earn certificates'}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>{language === 'af' ? 'Algehele Vordering' : 'Overall Progress'}</span>
                <span>25%</span>
              </div>
              <Progress value={25} className="h-2 bg-white/20" />
            </div>
            <Badge className="bg-white text-[#8B7CB3]">
              <Award className="w-3 h-3 mr-1" />
              2 {t.badges}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Courses */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[#002855] px-1">{language === 'af' ? 'Toegewese Kursusse' : 'Assigned Courses'}</h3>

        {loadingCourses ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-[#002855] animate-spin" />
          </div>
        ) : missionaleCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {missionaleCourses.map((kursus) => (
              <Card
                key={kursus.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-red-100"
                onClick={() => setCurrentView('geloofsgroei')}
              >
                {kursus.foto_url && (
                  <div className="aspect-video relative overflow-hidden">
                    <img src={kursus.foto_url} alt={kursus.titel} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-sm font-bold truncate">{kursus.titel}</p>
                    </div>
                  </div>
                )}
                <CardContent className="p-4">
                  {!kursus.foto_url && <h4 className="font-bold text-[#002855] mb-2">{kursus.titel}</h4>}
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">{kursus.kort_beskrywing || kursus.beskrywing}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {kursus.duur_minute} min
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0">{kursus.kategorie}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{language === 'af' ? 'Geen kursusse is nog aan hierdie reis toegewys nie.' : 'No courses have been assigned to this journey yet.'}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="pt-6 border-t">
        <h3 className="font-semibold text-[#002855] px-1 mb-4">{language === 'af' ? 'Basiese Opleiding (Eksemplare)' : 'Basic Training (Samples)'}</h3>
        <div className="space-y-4">
          {steps.map((step) => {
            const stepLessons = sampleLessons.filter(l => l.step === step.id);
            if (stepLessons.length === 0) return null;

            const StepIcon = step.icon;
            return (
              <Card key={step.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${step.bgColor}`}>
                      <StepIcon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{language === 'af' ? 'Stap' : 'Step'} {step.id}: {step.title}</CardTitle>
                      <CardDescription>{stepLessons.length} {language === 'af' ? 'lesse' : 'lessons'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stepLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => { setSelectedLesson(lesson); setShowLessonModal(true); }}
                      >
                        <div className="flex items-center gap-3">
                          {lesson.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Play className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{language === 'af' ? lesson.title : lesson.titleEn}</p>
                            <p className="text-xs text-gray-500">{lesson.duration} min</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Badges Section */}
      < Card >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#D4A84B]" />
            {t.badges}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {sampleBadges.map((badge) => {
              const BadgeIcon = badge.icon;
              return (
                <div key={badge.id} className={`text-center p-3 rounded-xl border-2 ${badge.earned ? 'border-[#D4A84B] bg-[#D4A84B]/10' : 'border-gray-200 bg-gray-50 opacity-50'}`}>
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${badge.earned ? 'bg-[#D4A84B]/20' : 'bg-gray-200'}`}>
                    <BadgeIcon className="w-6 h-6" style={{ color: badge.earned ? badge.color : '#9ca3af' }} />
                  </div>
                  <p className="text-xs font-medium">{language === 'af' ? badge.name : badge.nameEn}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card >
    </div >
  );

  // Community Tab Content
  const renderCommunityTab = () => (
    <div className="space-y-6">
      {/* Community Hub Header */}
      <Card className="bg-gradient-to-r from-[#002855] to-[#003d7a] text-white">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-2">{t.communityHub}</h2>
          <p className="text-white/80 mb-4">{language === 'af' ? 'Verbind met missionale bedienings regoor die hele kontinent van Afrika' : 'Connect with missional ministries across the whole continent of Africa'}</p>
          <div className="flex gap-3">
            <Button className="bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855]">
              <Plus className="w-4 h-4 mr-2" />
              {t.shareUpdate}
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/50 text-white hover:bg-white/30">
              <Search className="w-4 h-4 mr-2" />
              {language === 'af' ? 'Soek' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SA Map with Projects */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#C8102E]" />
            {language === 'af' ? 'Aktiewe Projekte in Afrika' : 'Active Projects in Africa'}
          </CardTitle>
          <CardDescription>
            {language === 'af' ? 'Klik op \'n merker om meer te sien' : 'Click on a marker to see more'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AfricaMap
            projects={sampleProjects}
            language={language}
            onProjectClick={handleMapProjectClick}
          />

          {/* Province filter badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {t.provinces.map((province) => {
              const projectCount = sampleProjects.filter(p =>
                p.province === province ||
                (language === 'en' && content.af.provinces[t.provinces.indexOf(province)] === p.province)
              ).length;
              return (
                <Badge
                  key={province}
                  variant={projectCount > 0 ? "default" : "outline"}
                  className={`cursor-pointer ${projectCount > 0 ? 'bg-[#002855] hover:bg-[#003d7a]' : 'hover:bg-[#002855]/10'}`}
                >
                  {province} {projectCount > 0 && `(${projectCount})`}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Project List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{language === 'af' ? 'Alle Projekte' : 'All Projects'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sampleProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handleMapProjectClick(project)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-[#C8102E]/10">
                    <MapPin className="w-4 h-4 text-[#C8102E]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#002855]">{language === 'af' ? project.name : project.nameEn}</p>
                    <p className="text-xs text-gray-500">{project.city} • {project.province}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {language === 'af' ? 'Stap' : 'Step'} {project.currentStep}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Community Posts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#002855]">{language === 'af' ? 'Gemeenskapsposte' : 'Community Posts'}</h3>
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            {language === 'af' ? 'Filter' : 'Filter'}
          </Button>
        </div>
        {samplePosts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${post.type === 'celebration' ? 'bg-[#D4A84B]/20' :
                  post.type === 'testimony' ? 'bg-[#8B7CB3]/20' : 'bg-[#002855]/20'
                  }`}>
                  {post.type === 'celebration' ? <PartyPopper className="w-5 h-5 text-[#D4A84B]" /> :
                    post.type === 'testimony' ? <Flame className="w-5 h-5 text-[#8B7CB3]" /> :
                      <MessageCircle className="w-5 h-5 text-[#002855]" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#002855]">{language === 'af' ? post.title : post.titleEn}</span>
                    <Badge variant="outline" className="text-xs">{post.project}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{language === 'af' ? post.content : post.contentEn}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{post.author}</span>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#C8102E]">
                        <ThumbsUp className="w-4 h-4" />
                        {post.likes}
                      </button>
                      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#002855]">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Prayer Tab Content
  const renderPrayerTab = () => (
    <div className="space-y-6">
      {/* Prayer Wall Header */}
      <Card className="bg-gradient-to-r from-[#C8102E] to-[#9E2A2B] text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-white/20">
              <HandHeart className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t.prayerWall}</h2>
              <p className="text-white/80">{language === 'af' ? 'Bid saam met ander gelowiges' : 'Pray together with other believers'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder={language === 'af' ? 'Deel jou gebedsversoek...' : 'Share your prayer request...'}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
              value={newPrayer}
              onChange={(e) => setNewPrayer(e.target.value)}
            />
            <Button className="bg-white text-[#C8102E] hover:bg-white/90">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Prayer Prompt */}
      <Card className="border-[#8B7CB3]/30 bg-[#8B7CB3]/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-[#8B7CB3]/20">
              <Sparkles className="w-5 h-5 text-[#8B7CB3]" />
            </div>
            <div>
              <h4 className="font-semibold text-[#002855] mb-1">{language === 'af' ? 'Vandag se Gebedsaansporing' : 'Today\'s Prayer Prompt'}</h4>
              <p className="text-sm text-gray-700 italic">
                {language === 'af'
                  ? '"Here, help my om vandag met nuwe oë na my bure te kyk. Wys my waar U aan die werk is."'
                  : '"Lord, help me to see my neighbours with new eyes today. Show me where You are at work."'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prayer Requests */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[#002855]">{language === 'af' ? 'Gebedsversoeke' : 'Prayer Requests'}</h3>
        {samplePrayers.map((prayer) => (
          <Card key={prayer.id} className={`${prayer.isAnswered ? 'border-green-500/50 bg-green-50/50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-gray-700 mb-3">{language === 'af' ? prayer.request : prayer.requestEn}</p>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="text-[#C8102E] border-[#C8102E]/30 hover:bg-[#C8102E]/10">
                      <HandHeart className="w-4 h-4 mr-1" />
                      {t.prayedFor}
                    </Button>
                    <span className="text-sm text-gray-500">{prayer.prayerCount} {language === 'af' ? 'bid saam' : 'praying'}</span>
                  </div>
                </div>
                {prayer.isAnswered && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t.answered}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Profile Tab Content
  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-[#002855] to-[#003d7a] text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#D4A84B] flex items-center justify-center text-2xl font-bold text-[#002855]">
              {currentUser?.naam?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{currentUser?.naam || 'Gebruiker'}</h2>
              <p className="text-white/80">{currentUser?.gemeente || 'Gemeente'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t.myProjects}</CardTitle>
            <Button size="sm" onClick={() => setShowCreateProject(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'af' ? 'Nuwe Projek' : 'New Project'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sampleProjects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${currentProject.id === project.id ? 'border-[#D4A84B] bg-[#D4A84B]/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setCurrentProject(project)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-[#002855]">{language === 'af' ? project.name : project.nameEn}</h4>
                  <Badge variant="outline">{project.province}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {language === 'af' ? 'Stap' : 'Step'} {project.currentStep}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {project.peopleReached} {language === 'af' ? 'bereik' : 'reached'}
                  </span>
                </div>
                <Progress value={(project.currentStep / 6) * 100} className="h-1.5 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6B7B3C]" />
            {t.statistics}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#D4A84B]/10 text-center">
              <div className="text-2xl font-bold text-[#D4A84B]">12</div>
              <div className="text-xs text-gray-600">{language === 'af' ? 'Aktiwiteite Gelog' : 'Activities Logged'}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#C8102E]/10 text-center">
              <div className="text-2xl font-bold text-[#C8102E]">8</div>
              <div className="text-xs text-gray-600">{language === 'af' ? 'Vrywillige Ure' : 'Volunteer Hours'}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#6B7B3C]/10 text-center">
              <div className="text-2xl font-bold text-[#6B7B3C]">3</div>
              <div className="text-xs text-gray-600">{language === 'af' ? 'Lesse Voltooi' : 'Lessons Completed'}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#8B7CB3]/10 text-center">
              <div className="text-2xl font-bold text-[#8B7CB3]">2</div>
              <div className="text-xs text-gray-600">{t.badges}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export & Settings */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          {language === 'af' ? 'Voer Verslag Uit' : 'Export Report'}
        </Button>
        <Button variant="outline" className="flex-1">
          <Settings className="w-4 h-4 mr-2" />
          {language === 'af' ? 'Instellings' : 'Settings'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="home" className="mt-0">{renderHomeTab()}</TabsContent>
        <TabsContent value="journey" className="mt-0">{renderJourneyTab()}</TabsContent>
        <TabsContent value="learn" className="mt-0">{renderLearnTab()}</TabsContent>
        <TabsContent value="community" className="mt-0">{renderCommunityTab()}</TabsContent>
        <TabsContent value="prayer" className="mt-0">{renderPrayerTab()}</TabsContent>
        <TabsContent value="profile" className="mt-0">{renderProfileTab()}</TabsContent>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 lg:left-72">
          <TabsList className="w-full h-16 bg-transparent grid grid-cols-6 gap-0 p-0">
            {[
              { value: 'home', icon: Home, label: t.tabs.home },
              { value: 'journey', icon: Target, label: t.tabs.journey },
              { value: 'learn', icon: BookOpen, label: t.tabs.learn },
              { value: 'community', icon: Users, label: t.tabs.community },
              { value: 'prayer', icon: HandHeart, label: t.tabs.prayer },
              { value: 'profile', icon: User, label: t.tabs.profile }
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center justify-center gap-1 h-full rounded-none data-[state=active]:bg-[#002855]/5 data-[state=active]:text-[#002855]"
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* Log Activity Dialog */}
      <Dialog open={showLogActivity} onOpenChange={setShowLogActivity}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.logActivity}</DialogTitle>
            <DialogDescription>{language === 'af' ? 'Teken jou aktiwiteit aan' : 'Record your activity'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{language === 'af' ? 'Titel' : 'Title'}</label>
              <Input
                value={activityData.title}
                onChange={(e) => setActivityData({ ...activityData, title: e.target.value })}
                placeholder={language === 'af' ? 'Bv. Gebedslopie in Parkstraat' : 'E.g. Prayer walk on Park Street'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{language === 'af' ? 'Tipe' : 'Type'}</label>
              <Select value={activityData.type} onValueChange={(v) => setActivityData({ ...activityData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listening">{language === 'af' ? 'Luister' : 'Listening'}</SelectItem>
                  <SelectItem value="serving">{language === 'af' ? 'Diens' : 'Serving'}</SelectItem>
                  <SelectItem value="community">{language === 'af' ? 'Gemeenskap' : 'Community'}</SelectItem>
                  <SelectItem value="discipleship">{language === 'af' ? 'Dissipelskap' : 'Discipleship'}</SelectItem>
                  <SelectItem value="prayer">{language === 'af' ? 'Gebed' : 'Prayer'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{language === 'af' ? 'Notas' : 'Notes'}</label>
              <Textarea
                value={activityData.notes}
                onChange={(e) => setActivityData({ ...activityData, notes: e.target.value })}
                placeholder={language === 'af' ? 'Beskryf wat gebeur het...' : 'Describe what happened...'}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{language === 'af' ? 'Gemaksvlak' : 'Comfort Level'}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setActivityData({ ...activityData, comfortLevel: level })}
                    className={`flex-1 py-2 rounded-lg border-2 transition-all ${activityData.comfortLevel === level
                      ? 'border-[#D4A84B] bg-[#D4A84B]/20'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'af' ? '1 = Baie ongemaklik, 5 = Baie gemaklik' : '1 = Very uncomfortable, 5 = Very comfortable'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowLogActivity(false)}>
                {t.cancel}
              </Button>
              <Button className="flex-1 bg-[#002855]" onClick={() => setShowLogActivity(false)}>
                {t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.createProject}</DialogTitle>
            <DialogDescription>{language === 'af' ? 'Begin \'n nuwe missionale bedieningsprojek' : 'Start a new missional ministry project'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t.projectName}</label>
              <Input
                value={newProjectData.name}
                onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                placeholder={language === 'af' ? 'Bv. Parkstraat Uitreik' : 'E.g. Park Street Outreach'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.description}</label>
              <Textarea
                value={newProjectData.description}
                onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.province}</label>
              <Select value={newProjectData.province} onValueChange={(v) => setNewProjectData({ ...newProjectData, province: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'af' ? 'Kies provinsie' : 'Select province'} />
                </SelectTrigger>
                <SelectContent>
                  {t.provinces.map((province) => (
                    <SelectItem key={province} value={province}>{province}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t.areaType}</label>
              <Select value={newProjectData.areaType} onValueChange={(v) => setNewProjectData({ ...newProjectData, areaType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urban">{t.urban}</SelectItem>
                  <SelectItem value="suburban">{t.suburban}</SelectItem>
                  <SelectItem value="rural">{t.rural}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateProject(false)}>
                {t.cancel}
              </Button>
              <Button className="flex-1 bg-[#002855]" onClick={() => setShowCreateProject(false)}>
                {t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog open={showProjectDetail} onOpenChange={setShowProjectDetail}>
        <DialogContent className="max-w-md">
          {selectedMapProject && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#002855]">{language === 'af' ? selectedMapProject.name : selectedMapProject.nameEn}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {selectedMapProject.city}, {selectedMapProject.province}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#002855]/10 text-center">
                    <div className="text-2xl font-bold text-[#002855]">{selectedMapProject.currentStep}/6</div>
                    <div className="text-xs text-gray-600">{language === 'af' ? 'Huidige Stap' : 'Current Step'}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#C8102E]/10 text-center">
                    <div className="text-2xl font-bold text-[#C8102E]">{selectedMapProject.peopleReached}</div>
                    <div className="text-xs text-gray-600">{language === 'af' ? 'Mense Bereik' : 'People Reached'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">{language === 'af' ? 'Huidige Fase' : 'Current Phase'}</h4>
                  <Badge style={{ backgroundColor: steps[selectedMapProject.currentStep - 1].color }} className="text-white">
                    {steps[selectedMapProject.currentStep - 1].title}
                  </Badge>
                </div>
                <Progress value={(selectedMapProject.currentStep / 6) * 100} className="h-2" />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowProjectDetail(false)}>
                    {language === 'af' ? 'Sluit' : 'Close'}
                  </Button>
                  <Button className="flex-1 bg-[#002855]">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {language === 'af' ? 'Kontak' : 'Contact'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lesson Modal */}
      <Dialog open={showLessonModal} onOpenChange={setShowLessonModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedLesson && (
            <>
              <DialogHeader>
                <DialogTitle>{language === 'af' ? selectedLesson.title : selectedLesson.titleEn}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {selectedLesson.duration} {language === 'af' ? 'minute' : 'minutes'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                  <Play className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-gray-700">
                  {language === 'af'
                    ? 'Hierdie les sal jou help om die beginsels van missionale bediening te verstaan en toe te pas in jou daaglikse lewe.'
                    : 'This lesson will help you understand the principles of missional ministry and apply them in your daily life.'}
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#002855]">
                    <Play className="w-4 h-4 mr-2" />
                    {language === 'af' ? 'Begin Les' : 'Start Lesson'}
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    {language === 'af' ? 'Notas' : 'Notes'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MissionaleBediening;
