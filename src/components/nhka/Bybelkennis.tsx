import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  ChevronRight, 
  Trophy, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  Target,
  Award
} from 'lucide-react';

// Perikope data - Bible passages with words that can be blanked
interface Perikoop {
  id: string;
  verwysing: string;
  teks: string;
  woorde: string[]; // All significant words that can be blanked
}

const PERIKOPE: Perikoop[] = [
  {
    id: '1',
    verwysing: 'Johannes 3:16',
    teks: 'Want so lief het God die wêreld gehad, dat Hy sy eniggebore Seun gegee het, sodat elkeen wat in Hom glo, nie verlore mag gaan nie, maar die ewige lewe kan hê.',
    woorde: ['lief', 'God', 'wêreld', 'eniggebore', 'Seun', 'gegee', 'elkeen', 'glo', 'verlore', 'ewige', 'lewe']
  },
  {
    id: '2',
    verwysing: 'Psalm 23:1-3',
    teks: 'Die HERE is my Herder; niks sal my ontbreek nie. Hy laat my neerlê in groen weivelde; na waters waar rus is, lei Hy my heen. Hy verkwik my siel; Hy lei my in die spore van geregtigheid, om sy Naam ontwil.',
    woorde: ['HERE', 'Herder', 'ontbreek', 'neerlê', 'groen', 'weivelde', 'waters', 'rus', 'lei', 'verkwik', 'siel', 'spore', 'geregtigheid', 'Naam']
  },
  {
    id: '3',
    verwysing: 'Romeine 8:28',
    teks: 'En ons weet dat vir hulle wat God liefhet, alles ten goede meewerk, vir hulle wat na sy voorneme geroep is.',
    woorde: ['weet', 'God', 'liefhet', 'alles', 'goede', 'meewerk', 'voorneme', 'geroep']
  },
  {
    id: '4',
    verwysing: 'Filippense 4:13',
    teks: 'Ek is tot alles in staat deur Christus wat my krag gee.',
    woorde: ['alles', 'staat', 'Christus', 'krag', 'gee']
  },
  {
    id: '5',
    verwysing: 'Jeremia 29:11',
    teks: 'Want Ék weet watter gedagtes Ek oor julle koester, spreek die HERE, gedagtes van vrede en nie van onheil nie, om julle \'n hoopvolle toekoms te gee.',
    woorde: ['weet', 'gedagtes', 'koester', 'HERE', 'vrede', 'onheil', 'hoopvolle', 'toekoms', 'gee']
  },
  {
    id: '6',
    verwysing: 'Spreuke 3:5-6',
    teks: 'Vertrou op die HERE met jou hele hart en steun nie op jou eie insig nie. Ken Hom in al jou weë, dan sal Hy jou paaie gelykmaak.',
    woorde: ['Vertrou', 'HERE', 'hele', 'hart', 'steun', 'insig', 'Ken', 'weë', 'paaie', 'gelykmaak']
  },
  {
    id: '7',
    verwysing: 'Matteus 28:19-20',
    teks: 'Gaan dan heen, maak dissipels van al die nasies, en doop hulle in die Naam van die Vader en die Seun en die Heilige Gees, en leer hulle om alles te onderhou wat Ek julle beveel het.',
    woorde: ['Gaan', 'dissipels', 'nasies', 'doop', 'Naam', 'Vader', 'Seun', 'Heilige', 'Gees', 'leer', 'onderhou', 'beveel']
  },
  {
    id: '8',
    verwysing: 'Galasiërs 5:22-23',
    teks: 'Maar die vrug van die Gees is liefde, blydskap, vrede, lankmoedigheid, vriendelikheid, goedheid, getrouheid, sagmoedigheid, selfbeheersing.',
    woorde: ['vrug', 'Gees', 'liefde', 'blydskap', 'vrede', 'lankmoedigheid', 'vriendelikheid', 'goedheid', 'getrouheid', 'sagmoedigheid', 'selfbeheersing']
  },
  {
    id: '9',
    verwysing: '1 Korintiërs 13:4-7',
    teks: 'Die liefde is lankmoedig en vriendelik; die liefde is nie jaloers nie; die liefde praat nie groot nie, is nie opgeblase nie, handel nie onwelvoeglik nie, soek nie sy eie belang nie, word nie verbitterd nie, reken die kwaad nie toe nie.',
    woorde: ['liefde', 'lankmoedig', 'vriendelik', 'jaloers', 'groot', 'opgeblase', 'onwelvoeglik', 'belang', 'verbitterd', 'kwaad']
  },
  {
    id: '10',
    verwysing: 'Jesaja 40:31',
    teks: 'Maar die wat op die HERE wag, kry nuwe krag; hulle vaar op met vleuels soos arende; hulle hardloop en word nie moeg nie, hulle wandel en word nie mat nie.',
    woorde: ['HERE', 'wag', 'nuwe', 'krag', 'vaar', 'vleuels', 'arende', 'hardloop', 'moeg', 'wandel', 'mat']
  },
  // Bergpredikasie - Matteus 5-7
  {
    id: '11',
    verwysing: 'Matteus 5:3-6 (Saligsprekinge)',
    teks: 'Salig is die wat arm van gees is, want aan hulle behoort die koninkryk van die hemele. Salig is die wat treur, want hulle sal vertroos word. Salig is die sagmoediges, want hulle sal die aarde beërwe. Salig is die wat honger en dors na die geregtigheid, want hulle sal versadig word.',
    woorde: ['Salig', 'arm', 'gees', 'koninkryk', 'hemele', 'treur', 'vertroos', 'sagmoediges', 'aarde', 'beërwe', 'honger', 'dors', 'geregtigheid', 'versadig']
  },
  {
    id: '12',
    verwysing: 'Matteus 5:7-10 (Saligsprekinge)',
    teks: 'Salig is die barmhartiges, want aan hulle sal barmhartigheid bewys word. Salig is die wat rein van hart is, want hulle sal God sien. Salig is die vredemakers, want hulle sal kinders van God genoem word. Salig is die wat vervolg word ter wille van die geregtigheid, want aan hulle behoort die koninkryk van die hemele.',
    woorde: ['Salig', 'barmhartiges', 'barmhartigheid', 'bewys', 'rein', 'hart', 'God', 'sien', 'vredemakers', 'kinders', 'genoem', 'vervolg', 'geregtigheid', 'koninkryk', 'hemele']
  },
  {
    id: '13',
    verwysing: 'Matteus 5:13-16 (Sout en Lig)',
    teks: 'Julle is die sout van die aarde. Maar as die sout laf geword het, waarmee sal dit gesout word? Julle is die lig van die wêreld. \'n Stad wat bo-op \'n berg lê, kan nie weggesteek word nie. Laat julle lig so skyn voor die mense, dat hulle julle goeie werke kan sien en julle Vader wat in die hemele is, verheerlik.',
    woorde: ['sout', 'aarde', 'laf', 'gesout', 'lig', 'wêreld', 'stad', 'berg', 'weggesteek', 'skyn', 'mense', 'goeie', 'werke', 'Vader', 'hemele', 'verheerlik']
  },
  {
    id: '14',
    verwysing: 'Matteus 6:9-13 (Onse Vader)',
    teks: 'Onse Vader wat in die hemele is, laat u Naam geheilig word; laat u koninkryk kom; laat u wil geskied, soos in die hemel net so ook op die aarde; gee ons vandag ons daaglikse brood; en vergeef ons ons skulde, soos ons ook ons skuldenaars vergewe; en lei ons nie in versoeking nie, maar verlos ons van die Bose.',
    woorde: ['Vader', 'hemele', 'Naam', 'geheilig', 'koninkryk', 'wil', 'geskied', 'hemel', 'aarde', 'daaglikse', 'brood', 'vergeef', 'skulde', 'skuldenaars', 'versoeking', 'verlos', 'Bose']
  },
  {
    id: '15',
    verwysing: 'Matteus 6:25-27 (Moenie Bekommerd Wees)',
    teks: 'Daarom sê Ek vir julle: Moenie julle kwel oor jul lewe, wat julle sal eet of drink nie; of oor jul liggaam, wat julle sal aantrek nie. Is die lewe nie meer as die voedsel en die liggaam as die klere nie? Kyk na die voëls van die hemel; hulle saai nie en hulle maai nie en hulle bring nie bymekaar in skure nie, en tog voed julle hemelse Vader hulle.',
    woorde: ['kwel', 'lewe', 'eet', 'drink', 'liggaam', 'aantrek', 'voedsel', 'klere', 'voëls', 'hemel', 'saai', 'maai', 'skure', 'voed', 'hemelse', 'Vader']
  },
  {
    id: '16',
    verwysing: 'Matteus 7:7-8 (Vra, Soek, Klop)',
    teks: 'Bid, en vir julle sal gegee word; soek, en julle sal vind; klop, en vir julle sal oopgemaak word. Want elkeen wat bid, ontvang; en hy wat soek, vind; en vir hom wat klop, sal oopgemaak word.',
    woorde: ['Bid', 'gegee', 'soek', 'vind', 'klop', 'oopgemaak', 'elkeen', 'ontvang', 'hom']
  },
  {
    id: '17',
    verwysing: 'Matteus 7:24-27 (Wyse en Dwase Bouer)',
    teks: 'Elkeen dan wat na hierdie woorde van My luister en dit doen, hom sal Ek vergelyk met \'n verstandige man wat sy huis op die rots gebou het. En die reën het geval en die waterstrome het gekom en die winde het gewaai en teen daardie huis aangestorm, en dit het nie geval nie, want sy fondament was op die rots.',
    woorde: ['woorde', 'luister', 'doen', 'vergelyk', 'verstandige', 'huis', 'rots', 'gebou', 'reën', 'waterstrome', 'winde', 'gewaai', 'aangestorm', 'geval', 'fondament']
  },
  // Gelykenis van die Verlore Seun - Lukas 15
  {
    id: '18',
    verwysing: 'Lukas 15:11-14 (Verlore Seun - Deel 1)',
    teks: 'En Hy het gesê: \'n Sekere man het twee seuns gehad. En die jongste van hulle het vir sy vader gesê: Vader, gee my die deel van die goed wat my toekom. En hy het die goed tussen hulle verdeel. En nie baie dae daarna nie het die jongste seun alles bymekaargemaak en na \'n ver land weggereis, en daar het hy sy goed verkwis deur losbandig te lewe.',
    woorde: ['man', 'seuns', 'jongste', 'vader', 'gee', 'deel', 'goed', 'toekom', 'verdeel', 'dae', 'bymekaargemaak', 'land', 'weggereis', 'verkwis', 'losbandig', 'lewe']
  },
  {
    id: '19',
    verwysing: 'Lukas 15:17-20 (Verlore Seun - Deel 2)',
    teks: 'Maar toe hy tot homself kom, sê hy: Hoeveel huurlinge van my vader het oorvloed van brood, en ek vergaan van honger! Ek sal opstaan en na my vader gaan, en ek sal vir hom sê: Vader, ek het gesondig teen die hemel en voor u. En hy het opgestaan en na sy vader gegaan. En toe hy nog ver was, het sy vader hom gesien en innig jammer vir hom gevoel en gehardloop en hom omhels en hartlik gesoen.',
    woorde: ['homself', 'huurlinge', 'vader', 'oorvloed', 'brood', 'vergaan', 'honger', 'opstaan', 'gesondig', 'hemel', 'opgestaan', 'ver', 'gesien', 'jammer', 'gehardloop', 'omhels', 'gesoen']
  },
  {
    id: '20',
    verwysing: 'Lukas 15:22-24 (Verlore Seun - Deel 3)',
    teks: 'Maar die vader het vir sy diensknegte gesê: Bring die beste kleed en trek hom dit aan, en gee \'n ring vir sy hand en skoene vir sy voete. En bring die vetgemaakte kalf en slag dit, en laat ons eet en vrolik wees. Want hierdie seun van my was dood en het weer lewendig geword; hy was verlore en is gevind. En hulle het begin vrolik wees.',
    woorde: ['vader', 'diensknegte', 'beste', 'kleed', 'ring', 'hand', 'skoene', 'voete', 'vetgemaakte', 'kalf', 'slag', 'eet', 'vrolik', 'seun', 'dood', 'lewendig', 'verlore', 'gevind']
  },
  // Liefdeshoofstuk - 1 Korintiërs 13
  {
    id: '21',
    verwysing: '1 Korintiërs 13:1-3 (Liefde is Noodsaaklik)',
    teks: 'Al sou ek die tale van mense en engele spreek, en ek het nie die liefde nie, dan het ek \'n klinkende metaal of \'n luidende simbaal geword. En al sou ek die gawe van profesie hê en al die geheimenisse weet en al die kennis, en al sou ek al die geloof hê, sodat ek berge kan versit, en ek het nie die liefde nie, dan is ek niks.',
    woorde: ['tale', 'mense', 'engele', 'spreek', 'liefde', 'klinkende', 'metaal', 'simbaal', 'gawe', 'profesie', 'geheimenisse', 'weet', 'kennis', 'geloof', 'berge', 'versit', 'niks']
  },
  {
    id: '22',
    verwysing: '1 Korintiërs 13:4-7 (Eienskappe van Liefde)',
    teks: 'Die liefde is lankmoedig en vriendelik; die liefde is nie jaloers nie; die liefde praat nie groot nie, is nie opgeblase nie, handel nie onwelvoeglik nie, soek nie sy eie belang nie, word nie verbitterd nie, reken die kwaad nie toe nie, is nie bly oor die ongeregtigheid nie, maar is bly saam met die waarheid.',
    woorde: ['liefde', 'lankmoedig', 'vriendelik', 'jaloers', 'groot', 'opgeblase', 'onwelvoeglik', 'belang', 'verbitterd', 'kwaad', 'bly', 'ongeregtigheid', 'waarheid']
  },
  {
    id: '23',
    verwysing: '1 Korintiërs 13:8-10 (Liefde Vergaan Nooit)',
    teks: 'Die liefde vergaan nimmermeer; maar profesieë, hulle sal tot niet gaan; of tale, hulle sal ophou; of kennis, dit sal tot niet gaan. Want ons ken ten dele en ons profeteer ten dele. Maar wanneer die volmaakte gekom het, dan sal wat ten dele is, tot niet gaan.',
    woorde: ['liefde', 'vergaan', 'nimmermeer', 'profesieë', 'niet', 'tale', 'ophou', 'kennis', 'ken', 'dele', 'profeteer', 'volmaakte', 'gekom']
  },
  {
    id: '24',
    verwysing: '1 Korintiërs 13:11-13 (Die Grootste is Liefde)',
    teks: 'Toe ek \'n kind was, het ek gepraat soos \'n kind, gedink soos \'n kind, geredeneer soos \'n kind; maar nou dat ek \'n man is, het ek die dinge van die kind afgelê. Want nou sien ons deur \'n spieël in \'n raaisel, maar eendag van aangesig tot aangesig. Nou ken ek ten dele, maar eendag sal ek ten volle ken, net soos ek ook ten volle geken is. En nou bly geloof, hoop, liefde, hierdie drie; maar die grootste hiervan is die liefde.',
    woorde: ['kind', 'gepraat', 'gedink', 'geredeneer', 'man', 'afgelê', 'sien', 'spieël', 'raaisel', 'eendag', 'aangesig', 'ken', 'volle', 'geken', 'geloof', 'hoop', 'liefde', 'grootste']
  }
];


// Generate decoy words for options
const DECOY_WOORDE = [
  'sonde', 'duisternis', 'vrees', 'twyfel', 'swakheid', 'vyand', 'dood', 'straf',
  'hartseer', 'pyn', 'swaarkry', 'beproewing', 'stryd', 'oorlog', 'haat',
  'woede', 'jaloesie', 'trots', 'selfsug', 'ongehoorsaamheid', 'skuld',
  'skande', 'verwerping', 'eensaamheid', 'angs', 'kommer', 'bekommernis',
  'teleurstelling', 'mislukking', 'nederlaag', 'verlies', 'smart', 'rou',
  'bitter', 'koud', 'donker', 'stil', 'leeg', 'alleen', 'ver', 'lank',
  'klein', 'groot', 'min', 'baie', 'eerste', 'laaste', 'nuwe', 'ou'
];

interface BlankWord {
  original: string;
  position: number;
  startIndex: number;
  endIndex: number;
  filled: boolean;
  userAnswer: string;
}

interface GameState {
  currentPerikoopIndex: number;
  roundInPerikoop: number; // 1-5
  blanks: BlankWord[];
  selectedBlankIndex: number | null;
  showOptions: boolean;
  options: string[];
  correctCount: number;
  wrongAttempts: number;
  totalCorrect: number;
  totalPerikope: number;
  isComplete: boolean;
}

const Bybelkennis: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentPerikoopIndex: 0,
    roundInPerikoop: 1,
    blanks: [],
    selectedBlankIndex: null,
    showOptions: false,
    options: [],
    correctCount: 0,
    wrongAttempts: 0,
    totalCorrect: 0,
    totalPerikope: 0,
    isComplete: false
  });

  const [showCelebration, setShowCelebration] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  // Get current perikoop
  const currentPerikoop = PERIKOPE[gameState.currentPerikoopIndex];

  // Generate blanks for current round
  const generateBlanks = useCallback((perikoop: Perikoop, round: number): BlankWord[] => {
    const availableWords = [...perikoop.woorde];
    const numBlanks = Math.min(3 + Math.floor(round / 2), availableWords.length); // 3-5 blanks depending on round
    
    // Shuffle and pick words for this round
    // Use round number as seed to get different words each round
    const shuffled = availableWords.sort(() => {
      const seed = round * 1000 + perikoop.id.charCodeAt(0);
      return Math.sin(seed) - 0.5;
    });
    
    const selectedWords = shuffled.slice(0, numBlanks);
    
    // Find positions in text
    const blanks: BlankWord[] = [];
    let searchText = perikoop.teks;
    
    selectedWords.forEach((word, idx) => {
      // Find word in text (case insensitive)
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      const match = searchText.match(regex);
      
      if (match && match.index !== undefined) {
        const originalWord = perikoop.teks.substring(
          perikoop.teks.toLowerCase().indexOf(word.toLowerCase()),
          perikoop.teks.toLowerCase().indexOf(word.toLowerCase()) + word.length
        );
        
        // Find actual position in original text
        let startIndex = 0;
        let foundCount = 0;
        for (let i = 0; i < perikoop.teks.length; i++) {
          if (perikoop.teks.toLowerCase().substring(i, i + word.length) === word.toLowerCase()) {
            if (foundCount === 0) {
              startIndex = i;
              break;
            }
            foundCount++;
          }
        }
        
        blanks.push({
          original: perikoop.teks.substring(startIndex, startIndex + word.length),
          position: idx,
          startIndex: startIndex,
          endIndex: startIndex + word.length,
          filled: false,
          userAnswer: ''
        });
      }
    });
    
    // Sort by position in text
    return blanks.sort((a, b) => a.startIndex - b.startIndex);
  }, []);

  // Initialize game
  useEffect(() => {
    if (currentPerikoop) {
      const blanks = generateBlanks(currentPerikoop, gameState.roundInPerikoop);
      setGameState(prev => ({
        ...prev,
        blanks,
        selectedBlankIndex: null,
        showOptions: false,
        options: [],
        correctCount: 0,
        wrongAttempts: 0
      }));
    }
  }, [gameState.currentPerikoopIndex, gameState.roundInPerikoop, generateBlanks]);

  // Generate options for a blank
  const generateOptions = (blank: BlankWord): string[] => {
    const correctAnswer = blank.original;
    const options = [correctAnswer];
    
    // Add decoy words
    const shuffledDecoys = [...DECOY_WOORDE].sort(() => Math.random() - 0.5);
    
    // Also add some words from the same perikoop as harder decoys
    const samePerikopWords = currentPerikoop.woorde
      .filter(w => w.toLowerCase() !== correctAnswer.toLowerCase())
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    const allDecoys = [...samePerikopWords, ...shuffledDecoys];
    
    for (const decoy of allDecoys) {
      if (options.length >= 4) break;
      if (!options.some(o => o.toLowerCase() === decoy.toLowerCase())) {
        options.push(decoy);
      }
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };

  // Handle blank click
  const handleBlankClick = (index: number) => {
    if (gameState.blanks[index].filled) return;
    
    const options = generateOptions(gameState.blanks[index]);
    setGameState(prev => ({
      ...prev,
      selectedBlankIndex: index,
      showOptions: true,
      options
    }));
    setLastAnswerCorrect(null);
  };

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    if (gameState.selectedBlankIndex === null) return;
    
    const blank = gameState.blanks[gameState.selectedBlankIndex];
    const isCorrect = option.toLowerCase() === blank.original.toLowerCase();
    
    setLastAnswerCorrect(isCorrect);
    
    if (isCorrect) {
      // Correct answer
      const newBlanks = [...gameState.blanks];
      newBlanks[gameState.selectedBlankIndex] = {
        ...blank,
        filled: true,
        userAnswer: option
      };
      
      const newCorrectCount = gameState.correctCount + 1;
      const allFilled = newBlanks.every(b => b.filled);
      
      setGameState(prev => ({
        ...prev,
        blanks: newBlanks,
        correctCount: newCorrectCount,
        totalCorrect: prev.totalCorrect + 1,
        selectedBlankIndex: null,
        showOptions: false,
        options: []
      }));
      
      if (allFilled) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    } else {
      // Wrong answer - just increment wrong attempts, keep options open
      setGameState(prev => ({
        ...prev,
        wrongAttempts: prev.wrongAttempts + 1
      }));
      
      // Shake animation handled by CSS
      setTimeout(() => setLastAnswerCorrect(null), 500);
    }
  };

  // Handle next round/perikoop
  const handleNext = () => {
    const allFilled = gameState.blanks.every(b => b.filled);
    if (!allFilled) return;
    
    if (gameState.roundInPerikoop < 5) {
      // Next round of same perikoop
      setGameState(prev => ({
        ...prev,
        roundInPerikoop: prev.roundInPerikoop + 1
      }));
    } else {
      // Next perikoop
      if (gameState.currentPerikoopIndex < PERIKOPE.length - 1) {
        setGameState(prev => ({
          ...prev,
          currentPerikoopIndex: prev.currentPerikoopIndex + 1,
          roundInPerikoop: 1,
          totalPerikope: prev.totalPerikope + 1
        }));
      } else {
        // Game complete
        setGameState(prev => ({
          ...prev,
          isComplete: true,
          totalPerikope: prev.totalPerikope + 1
        }));
      }
    }
  };

  // Reset game
  const handleReset = () => {
    setGameState({
      currentPerikoopIndex: 0,
      roundInPerikoop: 1,
      blanks: [],
      selectedBlankIndex: null,
      showOptions: false,
      options: [],
      correctCount: 0,
      wrongAttempts: 0,
      totalCorrect: 0,
      totalPerikope: 0,
      isComplete: false
    });
  };

  // Render text with blanks
  const renderTextWithBlanks = () => {
    if (!currentPerikoop || gameState.blanks.length === 0) return null;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    gameState.blanks.forEach((blank, idx) => {
      // Add text before blank
      if (blank.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`} className="text-gray-800">
            {currentPerikoop.teks.substring(lastIndex, blank.startIndex)}
          </span>
        );
      }
      
      // Add blank or filled word
      if (blank.filled) {
        parts.push(
          <span
            key={`blank-${idx}`}
            className="inline-block px-2 py-1 mx-1 bg-green-100 text-green-700 font-semibold rounded-lg border-2 border-green-300"
          >
            {blank.userAnswer}
            <CheckCircle2 className="inline-block w-4 h-4 ml-1" />
          </span>
        );
      } else {
        const isSelected = gameState.selectedBlankIndex === idx;
        parts.push(
          <button
            key={`blank-${idx}`}
            onClick={() => handleBlankClick(idx)}
            className={`inline-block px-4 py-1 mx-1 min-w-[80px] rounded-lg border-2 border-dashed transition-all duration-200 ${
              isSelected
                ? 'bg-[#002855] text-white border-[#002855] scale-105'
                : 'bg-gray-100 text-gray-400 border-gray-300 hover:bg-[#002855]/10 hover:border-[#002855] hover:text-[#002855]'
            }`}
          >
            {isSelected ? '?' : '______'}
          </button>
        );
      }
      
      lastIndex = blank.endIndex;
    });
    
    // Add remaining text
    if (lastIndex < currentPerikoop.teks.length) {
      parts.push(
        <span key="text-end" className="text-gray-800">
          {currentPerikoop.teks.substring(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };

  // Game complete screen
  if (gameState.isComplete) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-[#002855] to-[#003d7a] text-white">
          <CardContent className="p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-[#D4A84B] rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Baie Geluk!</h1>
            <p className="text-xl text-white/90 mb-6">
              Jy het al {PERIKOPE.length} perikope voltooi!
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-3xl font-bold text-[#D4A84B]">{gameState.totalCorrect}</p>
                <p className="text-sm text-white/70">Korrekte Antwoorde</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-3xl font-bold text-[#D4A84B]">{gameState.totalPerikope}</p>
                <p className="text-sm text-white/70">Perikope Voltooi</p>
              </div>
            </div>
            <Button
              onClick={handleReset}
              className="bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855] font-semibold px-8 py-3"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Begin Weer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allFilled = gameState.blanks.every(b => b.filled);
  const progressPercent = (gameState.correctCount / Math.max(gameState.blanks.length, 1)) * 100;
  const overallProgress = ((gameState.currentPerikoopIndex * 5 + gameState.roundInPerikoop - 1) / (PERIKOPE.length * 5)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#002855] flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-[#D4A84B]" />
            Bybelkennis
          </h1>
          <p className="text-gray-600 mt-1">Vul die ontbrekende woorde in</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 text-sm border-[#002855] text-[#002855]">
            <Target className="w-4 h-4 mr-1" />
            Perikoop {gameState.currentPerikoopIndex + 1}/{PERIKOPE.length}
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 text-sm border-[#D4A84B] text-[#D4A84B]">
            <Award className="w-4 h-4 mr-1" />
            Rondte {gameState.roundInPerikoop}/5
          </Badge>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-[#002855]/5 to-[#D4A84B]/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Algehele Vordering</span>
            <span className="text-sm font-bold text-[#002855]">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Perikoop Card */}

      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#002855] to-[#003d7a] pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{currentPerikoop?.verwysing}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/80">
                {gameState.correctCount}/{gameState.blanks.length} woorde
              </span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 mt-3 bg-white/20" />
        </CardHeader>


        
        <CardContent className="p-6">
          {/* Celebration overlay */}
          {showCelebration && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 animate-pulse">
              <div className="text-center">
                <Sparkles className="w-16 h-16 text-[#D4A84B] mx-auto mb-4 animate-bounce" />
                <p className="text-2xl font-bold text-[#002855]">Uitstekend!</p>
              </div>
            </div>
          )}
          
          {/* Bible text with blanks */}
          <div className="text-lg leading-relaxed mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            {renderTextWithBlanks()}
          </div>
          
          {/* Options panel */}
          {gameState.showOptions && gameState.selectedBlankIndex !== null && (
            <div className="mt-6 p-4 bg-[#002855]/5 rounded-xl border border-[#002855]/10">
              <p className="text-sm font-medium text-gray-600 mb-3">Kies die regte woord:</p>
              <div className="grid grid-cols-2 gap-3">
                {gameState.options.map((option, idx) => (
                  <Button
                    key={idx}
                    onClick={() => handleOptionSelect(option)}
                    variant="outline"
                    className={`py-4 text-base font-medium transition-all duration-200 ${
                      lastAnswerCorrect === false
                        ? 'animate-shake border-red-300 bg-red-50'
                        : 'hover:bg-[#002855] hover:text-white hover:border-[#002855]'
                    }`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              {lastAnswerCorrect === false && (
                <p className="text-red-500 text-sm mt-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Probeer weer!
                </p>
              )}
            </div>
          )}
          
          {/* Instructions when no blank selected */}
          {!gameState.showOptions && !allFilled && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-blue-700 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Klik op 'n oop spasie om die opsies te sien
              </p>
            </div>
          )}
          
          {/* Next button */}
          {allFilled && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleNext}
                className="bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855] font-semibold px-8 py-3 text-lg"
              >
                {gameState.roundInPerikoop < 5 ? (
                  <>
                    Volgende Rondte
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                ) : gameState.currentPerikoopIndex < PERIKOPE.length - 1 ? (
                  <>
                    Volgende Perikoop
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Voltooi
                    <Trophy className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#002855]">{gameState.totalCorrect}</p>
              <p className="text-xs text-gray-500">Korrekte Antwoorde</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#D4A84B]">{gameState.wrongAttempts}</p>
              <p className="text-xs text-gray-500">Verkeerde Pogings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {gameState.totalCorrect > 0 
                  ? Math.round((gameState.totalCorrect / (gameState.totalCorrect + gameState.wrongAttempts)) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500">Akkuraatheid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Bybelkennis;
