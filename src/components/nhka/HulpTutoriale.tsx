import React, { useState } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import {
  HelpCircle,
  UserPlus,
  CreditCard,
  Mail,
  FileUp,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  MousePointer,
  Menu,
  Users,
  Plus,
  Send,
  Upload,
  X,
  BookOpen,
  Lightbulb
} from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: TutorialStep[];
}

const GUIDE_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/693a23b83be6a3fa1e4a5844_1766810779431_ea867b53.jpg';

const tutorials: Tutorial[] = [
  {
    id: 'lidmate',
    title: 'Lidmate Byvoeg',
    description: 'Leer hoe om nuwe lidmate by jou gemeente te registreer',
    icon: <UserPlus className="w-6 h-6" />,
    color: 'bg-blue-500',
    steps: [
      {
        title: 'Gaan na Administrasie',
        description: 'Klik op "Meer" in die kopstuk en kies "Administrasie" uit die kieslys.',
        icon: <Menu className="w-5 h-5" />
      },
      {
        title: 'Kies Gebruikers Tab',
        description: 'In die Administrasie paneel, klik op die "Gebruikers" oortjie om alle lidmate te sien.',
        icon: <Users className="w-5 h-5" />
      },
      {
        title: 'Klik "Voeg Lidmaat By"',
        description: 'Klik op die blou "+ Voeg Lidmaat By" knoppie regs bo.',
        icon: <Plus className="w-5 h-5" />
      },
      {
        title: 'Vul Besonderhede In',
        description: 'Vul die lidmaat se naam, van, e-pos, selfoon en ander besonderhede in.',
        icon: <UserPlus className="w-5 h-5" />
      },
      {
        title: 'Stoor die Lidmaat',
        description: 'Klik "Stoor" om die nuwe lidmaat by te voeg. Hulle sal \'n e-pos ontvang met aanmeldinligting.',
        icon: <CheckCircle2 className="w-5 h-5" />
      }
    ]
  },
  {
    id: 'betalings',
    title: 'Betalings Maak',
    description: 'Leer hoe om offergawes en ander betalings te maak',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'bg-green-500',
    steps: [
      {
        title: 'Gaan na Betalings',
        description: 'Klik op "Meer" en kies "Betalings" uit die navigasie kieslys.',
        icon: <Menu className="w-5 h-5" />
      },
      {
        title: 'Kies Betaling Tipe',
        description: 'Kies of jy \'n offergawe of ander tipe betaling wil maak.',
        icon: <CreditCard className="w-5 h-5" />
      },
      {
        title: 'Voer Bedrag In',
        description: 'Tik die bedrag in wat jy wil betaal (minimum R10).',
        icon: <Plus className="w-5 h-5" />
      },
      {
        title: 'Voeg Beskrywing By',
        description: 'Voeg \'n opsionele beskrywing by vir jou betaling.',
        icon: <FileUp className="w-5 h-5" />
      },
      {
        title: 'Voltooi Betaling',
        description: 'Klik "Betaal Nou" en volg die Yoco betaalinstruksies om jou betaling te voltooi.',
        icon: <CheckCircle2 className="w-5 h-5" />
      }
    ]
  },
  {
    id: 'boodskappe',
    title: 'Boodskappe Stuur',
    description: 'Leer hoe om boodskappe aan ander lidmate te stuur',
    icon: <Mail className="w-6 h-6" />,
    color: 'bg-purple-500',
    steps: [
      {
        title: 'Gaan na Boodskappe',
        description: 'Klik op die koevert ikoon in die kopstuk of kies "Boodskappe" uit die kieslys.',
        icon: <Mail className="w-5 h-5" />
      },
      {
        title: 'Klik "Nuwe Boodskap"',
        description: 'Klik op die "+ Nuwe Boodskap" knoppie om \'n nuwe boodskap te begin.',
        icon: <Plus className="w-5 h-5" />
      },
      {
        title: 'Kies Ontvangers',
        description: 'Kies of jy aan \'n individu, wyk, besoekpunt, of almal wil stuur.',
        icon: <Users className="w-5 h-5" />
      },
      {
        title: 'Skryf Jou Boodskap',
        description: 'Vul die onderwerp in en skryf jou boodskap in die teksarea.',
        icon: <FileUp className="w-5 h-5" />
      },
      {
        title: 'Stuur die Boodskap',
        description: 'Klik "Stuur" om jou boodskap af te stuur. Ontvangers sal dit in hulle inkassie sien.',
        icon: <Send className="w-5 h-5" />
      }
    ]
  },
  {
    id: 'dokumente',
    title: 'Dokumente Oplaai',
    description: 'Leer hoe om dokumente op te laai en te bestuur',
    icon: <FileUp className="w-6 h-6" />,
    color: 'bg-amber-500',
    steps: [
      {
        title: 'Gaan na Dokumente Bestuur',
        description: 'Klik op "Meer" en kies "Dokumente Bestuur" uit die kieslys (slegs vir admins).',
        icon: <Menu className="w-5 h-5" />
      },
      {
        title: 'Klik "Laai Dokument Op"',
        description: 'Klik op die "+ Laai Dokument Op" knoppie bo-aan die bladsy.',
        icon: <Upload className="w-5 h-5" />
      },
      {
        title: 'Kies die Lêer',
        description: 'Klik om \'n lêer te kies of sleep dit na die oplaai area. PDF, Word en beelde word ondersteun.',
        icon: <FileUp className="w-5 h-5" />
      },
      {
        title: 'Vul Besonderhede In',
        description: 'Gee die dokument \'n titel, kies \'n kategorie, en voeg \'n opsionele beskrywing by.',
        icon: <Plus className="w-5 h-5" />
      },
      {
        title: 'Stoor die Dokument',
        description: 'Klik "Laai Op" om die dokument te stoor. Dit sal nou beskikbaar wees vir lidmate.',
        icon: <CheckCircle2 className="w-5 h-5" />
      }
    ]
  }
];

// Animated Tutorial Viewer Component
const TutorialViewer: React.FC<{ tutorial: Tutorial; onClose: () => void }> = ({ tutorial, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-advance steps when playing
  React.useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentStep < tutorial.steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, tutorial.steps.length]);

  const handleRestart = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`${tutorial.color} text-white p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tutorial.icon}
              <h2 className="text-xl font-bold">{tutorial.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-white/80 text-sm">{tutorial.description}</p>
        </div>

        {/* Animation Area */}
        <div className="p-6 bg-gray-50">
          <div className="relative bg-white rounded-xl border-2 border-gray-200 p-8 min-h-[200px] flex items-center justify-center overflow-hidden">
            {/* Animated Step Display */}
            <div className="text-center animate-in fade-in slide-in-from-right-4 duration-500" key={currentStep}>
              <div className={`w-20 h-20 mx-auto rounded-full ${tutorial.color} text-white flex items-center justify-center mb-4 animate-bounce`}>
                {tutorial.steps[currentStep].icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Stap {currentStep + 1}: {tutorial.steps[currentStep].title}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {tutorial.steps[currentStep].description}
              </p>
            </div>

            {/* Animated Arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 animate-pulse">
              <ArrowRight className="w-8 h-8" />
            </div>

            {/* Mouse Pointer Animation */}
            <div
              className="absolute transition-all duration-1000 ease-in-out"
              style={{
                left: `${20 + (currentStep * 15)}%`,
                top: `${40 + (currentStep % 2 === 0 ? 10 : -10)}%`,
              }}
            >
              <MousePointer className="w-6 h-6 text-[#002855] drop-shadow-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              Stap {currentStep + 1} van {tutorial.steps.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-gray-600" />
                ) : (
                  <Play className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <button
                onClick={handleRestart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Herbegin"
              >
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex gap-2">
            {tutorial.steps.map((step, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${index === currentStep
                    ? tutorial.color
                    : index < currentStep
                      ? `${tutorial.color} opacity-50`
                      : 'bg-gray-200'
                  }`}
              />
            ))}
          </div>

          {/* Step List */}
          <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
            {tutorial.steps.map((step, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${index === currentStep
                    ? 'bg-gray-100 border-l-4 border-[#002855]'
                    : 'hover:bg-gray-50'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${index < currentStep
                    ? 'bg-green-100 text-green-600'
                    : index === currentStep
                      ? `${tutorial.color} text-white`
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                  {index < currentStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`font-medium text-sm truncate ${index === currentStep ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                    {step.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
          <button
            onClick={() => currentStep > 0 && handleStepClick(currentStep - 1)}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vorige
          </button>
          {currentStep === tutorial.steps.length - 1 ? (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#003d7a] transition-colors font-medium"
            >
              Klaar
            </button>
          ) : (
            <button
              onClick={() => handleStepClick(currentStep + 1)}
              className="px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#003d7a] transition-colors flex items-center gap-2"
            >
              Volgende
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Quick Tips Section
const QuickTips: React.FC = () => {
  const tips = [
    {
      icon: <Menu className="w-5 h-5" />,
      title: 'Meer Kieslys',
      description: 'Gebruik die "Meer" knoppie in die kopstuk om toegang tot alle funksies te kry.'
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: 'Boodskappe',
      description: 'Die koevert ikoon in die kopstuk wys hoeveel ongelees boodskappe jy het.'
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Profiel',
      description: 'Klik op jou naam regs bo om jou profiel te sien of uit te teken.'
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Geloofsgroei',
      description: 'Voltooi kursusse in Geloofsgroei om sertifikate te verdien.'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-[#002855] to-[#003d7a] rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="w-6 h-6 text-[#D4A84B]" />
        <h3 className="text-lg font-bold">Vinnige Wenke</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tips.map((tip, index) => (
          <div key={index} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
            <div className="w-10 h-10 rounded-full bg-[#D4A84B] text-[#002855] flex items-center justify-center flex-shrink-0">
              {tip.icon}
            </div>
            <div>
              <h4 className="font-semibold text-sm">{tip.title}</h4>
              <p className="text-xs text-white/80 mt-1">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HulpTutoriale: React.FC = () => {
  const { currentUser, setCurrentView } = useNHKA();
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);


  const faqs = [
    {
      id: 'wagwoord',
      question: 'Hoe verander ek my wagwoord?',
      answer: 'Gaan na jou profiel deur op jou naam in die kopstuk te klik, dan "My Profiel". Daar sal jy \'n opsie vind om jou wagwoord te verander.'
    },
    {
      id: 'wyk',
      question: 'Hoe sien ek watter wyk ek aan behoort?',
      answer: 'Jou wyk word op jou Paneelbord (Dashboard) gewys. Jy kan ook na "My Wyk" gaan om meer besonderhede te sien.'
    },
    {
      id: 'kontak',
      question: 'Hoe kontak ek my wykleier?',
      answer: 'Gaan na "My Wyk" om jou wykleier se kontakbesonderhede te sien, of stuur \'n boodskap via die Boodskappe funksie.'
    },
    {
      id: 'krisis',
      question: 'Hoe rapporteer ek \'n krisis?',
      answer: 'Gaan na "Krisisverslae" in die kieslys en klik op "Nuwe Krisis". Vul die besonderhede in en jou wykleier sal gekontak word.'
    },
    {
      id: 'offergawe',
      question: 'Hoe maak ek \'n offergawe?',
      answer: 'Gaan na "Betalings" in die kieslys, kies "Offergawe" as tipe, voer die bedrag in, en volg die betaalinstruksies.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#002855] to-[#003d7a] p-1 flex-shrink-0">
            <img
              src={GUIDE_IMAGE}
              alt="Hulp Gids"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-[#002855] flex items-center gap-2 justify-center md:justify-start">
              <HelpCircle className="w-7 h-7 text-[#D4A84B]" />
              Gebruiksaanwysings
            </h1>
            <p className="text-gray-600 mt-2">
              Welkom, {currentUser?.naam}! Hier vind jy stap-vir-stap gidse om die app te gebruik.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <QuickTips />

      {/* Tutorial Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-[#002855]" />
          Video Tutoriale
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Klik op \'n tutoriaal om \'n geanimeerde stap-vir-stap gids te sien.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tutorials.map((tutorial) => (
            <button
              key={tutorial.id}
              onClick={() => setSelectedTutorial(tutorial)}
              className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-5 text-left transition-all duration-200 border-2 border-transparent hover:border-[#002855]/20"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${tutorial.color} text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {tutorial.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 group-hover:text-[#002855] transition-colors">
                    {tutorial.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {tutorial.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-[#002855] text-sm font-medium">
                    <Play className="w-4 h-4" />
                    <span>{tutorial.steps.length} stappe</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#002855]" />
          Gereelde Vrae
        </h2>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expandedFaq === faq.id ? 'rotate-180' : ''
                  }`} />
              </button>
              {expandedFaq === faq.id && (
                <div className="px-4 pb-4 text-gray-600 text-sm animate-in slide-in-from-top-2 duration-200">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-[#D4A84B]/20 to-[#D4A84B]/10 rounded-2xl p-6 border border-[#D4A84B]/30">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#D4A84B] text-white flex items-center justify-center flex-shrink-0">
            <Mail className="w-8 h-8" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="font-bold text-gray-900">Nog steeds hulp nodig?</h3>
            <p className="text-gray-600 text-sm mt-1">
              Kontak jou gemeente se administrateur of stuur 'n vraag via die "Vrae & Versoeke" funksie.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('vrae')}
            className="px-6 py-3 bg-[#002855] text-white rounded-xl hover:bg-[#003d7a] transition-colors font-medium flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            Vra 'n Vraag
          </button>
        </div>
      </div>



      {/* Tutorial Viewer Modal */}
      {selectedTutorial && (
        <TutorialViewer
          tutorial={selectedTutorial}
          onClose={() => setSelectedTutorial(null)}
        />
      )}
    </div>
  );
};

export default HulpTutoriale;
