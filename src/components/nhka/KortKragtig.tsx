import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Clock, 
  BookOpen, 
  Heart, 
  Star, 
  ChevronRight, 
  ChevronLeft,
  Trophy,
  Target,
  Flame,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Users,
  Play,
  BarChart3,
  Sparkles,
  RefreshCw,
  Home,
  Award,
  MessageCircle
} from 'lucide-react';
import { 
  KKLesson, 
  KKLessonVariant, 
  KKQuestion, 
  KKUserProgress, 
  KKLessonAttempt,
  KKVariantType,
  isAdmin
} from '@/types/nhka';

// Theme icons mapping
const themeIcons: Record<string, React.ReactNode> = {
  'Stories': <BookOpen className="w-5 h-5" />,
  'Jesus': <Heart className="w-5 h-5" />,
  'Wysheid': <Lightbulb className="w-5 h-5" />,
  'Gebed': <MessageCircle className="w-5 h-5" />,
  'Vrug van die Gees': <Sparkles className="w-5 h-5" />,
  'Liefde': <Heart className="w-5 h-5" />,
  'God': <Star className="w-5 h-5" />
};

// Time options
const timeOptions = [
  { value: 3, label: '3 min', variant: 'SHORT' as KKVariantType, questions: 2 },
  { value: 5, label: '5 min', variant: 'STANDARD' as KKVariantType, questions: 4 },
  { value: 10, label: '10 min', variant: 'EXTENDED' as KKVariantType, questions: 6 },
  { value: 15, label: '15 min', variant: 'EXTENDED' as KKVariantType, questions: 8 }
];

// Theme tabs
const themeTabs = ['Aanbeveel', 'Stories', 'Jesus', 'Wysheid', 'Gebed', 'Vrug van die Gees'];

type LessonStep = 'landing' | 'time-select' | 'theme-select' | 'lesson' | 'results' | 'progress';

const KortKragtig: React.FC = () => {
  const { currentUser, setCurrentView } = useNHKA();
  
  // State
  const [step, setStep] = useState<LessonStep>('landing');
  const [lessons, setLessons] = useState<KKLesson[]>([]);
  const [userProgress, setUserProgress] = useState<KKUserProgress | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<KKLessonAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lesson flow state
  const [selectedTime, setSelectedTime] = useState<number>(5);
  const [challengeMode, setChallengeMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('Aanbeveel');
  const [selectedLesson, setSelectedLesson] = useState<KKLesson | null>(null);
  const [currentVariant, setCurrentVariant] = useState<KKLessonVariant | null>(null);
  const [questions, setQuestions] = useState<KKQuestion[]>([]);
  
  // Lesson progress state
  const [currentBlock, setCurrentBlock] = useState<'hook' | 'story' | 'explanation' | 'interactive' | 'reflection' | 'reward'>('hook');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [reflectionAnswer, setReflectionAnswer] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    
    try {
      // Load published lessons
      const { data: lessonsData } = await supabase
        .from('kk_lessons')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('difficulty', { ascending: true });
      
      if (lessonsData) {
        setLessons(lessonsData);
      }
      
      // Load user progress
      const { data: progressData } = await supabase
        .from('kk_user_progress')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      if (progressData) {
        setUserProgress(progressData);
      }
      
      // Load recent attempts
      const { data: attemptsData } = await supabase
        .from('kk_lesson_attempts')
        .select('*, lesson:kk_lessons(*)')
        .eq('user_id', currentUser.id)
        .order('completed_at', { ascending: false })
        .limit(5);
      
      if (attemptsData) {
        setRecentAttempts(attemptsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLesson = async (lesson: KKLesson) => {
    setSelectedLesson(lesson);
    
    // Get variant based on time selection
    const variantType = timeOptions.find(t => t.value === selectedTime)?.variant || 'STANDARD';
    
    const { data: variantData } = await supabase
      .from('kk_lesson_variants')
      .select('*')
      .eq('lesson_id', lesson.id)
      .eq('variant_type', variantType)
      .single();
    
    if (variantData) {
      setCurrentVariant(variantData);
    } else {
      // Fallback to STANDARD if variant not found
      const { data: fallbackVariant } = await supabase
        .from('kk_lesson_variants')
        .select('*')
        .eq('lesson_id', lesson.id)
        .eq('variant_type', 'STANDARD')
        .single();
      
      if (fallbackVariant) {
        setCurrentVariant(fallbackVariant);
      }
    }
    
    // Load questions
    const questionCount = timeOptions.find(t => t.value === selectedTime)?.questions || 4;
    const { data: questionsData } = await supabase
      .from('kk_questions')
      .select('*')
      .eq('lesson_id', lesson.id)
      .limit(questionCount);
    
    if (questionsData) {
      setQuestions(questionsData);
    }
    
    // Reset lesson state
    setCurrentBlock('hook');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowHint(false);
    setHintsUsed(0);
    setScore(0);
    setLessonComplete(false);
    setReflectionAnswer('');
    setStartTime(Date.now());
    setStep('lesson');
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setShowHint(false);
  };

  const checkAnswer = (question: KKQuestion): boolean => {
    const userAnswer = answers[question.id];
    if (!userAnswer) return false;
    
    if (question.question_type === 'REFLECTION') return true;
    
    return userAnswer === question.correct_answer;
  };

  const nextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && checkAnswer(currentQuestion)) {
      setScore(prev => prev + 1);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowHint(false);
    } else {
      // Move to reflection
      setCurrentBlock('reflection');
    }
  };

  const completeLesson = async () => {
    if (!currentUser || !selectedLesson) return;
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const scorePercent = questions.length > 0 ? (score / questions.length) * 100 : 0;
    
    // Save attempt
    await supabase.from('kk_lesson_attempts').insert({
      user_id: currentUser.id,
      lesson_id: selectedLesson.id,
      variant_type: currentVariant?.variant_type || 'STANDARD',
      time_selected: selectedTime,
      challenge_mode: challengeMode,
      score_percent: scorePercent,
      hints_used: hintsUsed,
      time_spent_seconds: timeSpent,
      questions_answered: questions.length,
      questions_correct: score
    });
    
    // Update or create user progress
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userProgress?.last_lesson_date !== today;
    const newStreak = isNewDay ? (userProgress?.current_streak || 0) + 1 : (userProgress?.current_streak || 1);
    
    if (userProgress) {
      await supabase.from('kk_user_progress').update({
        total_lessons_completed: userProgress.total_lessons_completed + 1,
        total_time_spent_seconds: userProgress.total_time_spent_seconds + timeSpent,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, userProgress.longest_streak),
        last_lesson_date: today,
        average_score: ((userProgress.average_score * userProgress.total_lessons_completed) + scorePercent) / (userProgress.total_lessons_completed + 1),
        updated_at: new Date().toISOString()
      }).eq('user_id', currentUser.id);
    } else {
      await supabase.from('kk_user_progress').insert({
        user_id: currentUser.id,
        total_lessons_completed: 1,
        total_time_spent_seconds: timeSpent,
        current_streak: 1,
        longest_streak: 1,
        last_lesson_date: today,
        average_score: scorePercent
      });
    }
    
    setLessonComplete(true);
    setCurrentBlock('reward');
    loadData(); // Refresh data
  };

  const getFilteredLessons = () => {
    if (selectedTheme === 'Aanbeveel') {
      // Return lessons sorted by recommendation logic
      return lessons.slice(0, 6);
    }
    return lessons.filter(l => l.theme_tags.includes(selectedTheme));
  };

  const getScoreColor = (percent: number) => {
    if (percent >= 85) return 'text-green-600';
    if (percent >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percent: number) => {
    if (percent >= 85) return 'Uitstekend! Jy het dit baie goed gedoen!';
    if (percent >= 60) return 'Goed gedoen! Bly oefen!';
    return 'Moenie moed opgee nie! Probeer weer!';
  };

  // Render functions for each step
  const renderLanding = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white border-0 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Kort & Kragtig</h1>
                  <p className="text-white/80">Aanpasbare mikro-lesse vir laerskool kinders en ouers</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6 text-white/90">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Kort, praktiese Bybel-leer ervaring vir laerskool kinders saam met hul ouers.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Lesse is aanpasbaar: kies hoeveel tyd jy vandag het (3, 5, 10 of 15 minute).</span>
                </p>
                <p className="flex items-start gap-2">
                  <BookOpen className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Elke les het 'n storie, eenvoudige verduideliking, interaktiewe vrae en 'n refleksie.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Target className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Jou vordering word gestoor; die app pas volgende lesse aan op grond van jou resultate.</span>
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  size="lg" 
                  className="bg-white text-orange-600 hover:bg-white/90 font-semibold"
                  onClick={() => setStep('time-select')}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Begin 'n Les
                </Button>
                <Button 
                  size="lg" 
                  className="bg-orange-700 text-white hover:bg-orange-800 border-2 border-white/30 font-semibold"
                  onClick={() => setStep('progress')}
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Sien My Vordering
                </Button>
              </div>
            </div>

            {/* Stats Card */}
            {userProgress && (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 min-w-[200px]">
                <div className="text-center space-y-4">
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Flame className="w-6 h-6 text-yellow-300" />
                      <span className="text-3xl font-bold">{userProgress.current_streak}</span>
                    </div>
                    <p className="text-sm text-white/80">Dag Streak</p>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-2xl font-bold">{userProgress.total_lessons_completed}</p>
                    <p className="text-sm text-white/80">Lesse Voltooi</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Math.round(userProgress.average_score)}%</p>
                    <p className="text-sm text-white/80">Gemiddelde Telling</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Hoe Dit Werk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: <Clock className="w-6 h-6" />, title: '1. Kies Jou Tyd', desc: 'Kies 3, 5, 10 of 15 minute' },
              { icon: <BookOpen className="w-6 h-6" />, title: '2. Doen Die Les', desc: 'Lees, leer en beantwoord vrae' },
              { icon: <Star className="w-6 h-6" />, title: '3. Kry Terugvoer', desc: 'Sien jou telling en leer meer' },
              { icon: <Trophy className="w-6 h-6" />, title: '4. Bou Jou Streak', desc: 'Groei elke dag in begrip' }
            ].map((item, i) => (
              <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500" />
              Onlangse Lesse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">{attempt.lesson?.title || 'Les'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(attempt.completed_at).toLocaleDateString('af-ZA')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getScoreColor(attempt.score_percent)}`}>
                      {Math.round(attempt.score_percent)}%
                    </p>
                    <p className="text-xs text-gray-500">{attempt.time_selected} min</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Link */}
      {currentUser && isAdmin(currentUser.rol) && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setCurrentView('kort-kragtig-admin')}
            >
              <Zap className="w-4 h-4 mr-2" />
              Bestuur Lesse (Admin)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTimeSelect = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => setStep('landing')}>
          <ChevronLeft className="w-5 h-5 mr-1" />
          Terug
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hoeveel tyd het julle vandag?</h2>
          <p className="text-gray-600">Kies die tyd wat die beste by julle pas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {timeOptions.map((option) => (
          <Card 
            key={option.value}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTime === option.value 
                ? 'ring-2 ring-amber-500 bg-amber-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedTime(option.value)}
          >
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                selectedTime === option.value ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-1">{option.label}</h3>
              <p className="text-sm text-gray-500">{option.questions} vrae</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={challengeMode}
                onChange={(e) => setChallengeMode(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="font-medium">Meer Uitdagend</span>
                <p className="text-sm text-gray-500">Moeiliker vrae vir ekstra uitdaging</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Button 
        size="lg" 
        className="w-full bg-amber-500 hover:bg-amber-600"
        onClick={() => setStep('theme-select')}
      >
        Volgende: Kies 'n Tema
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );

  const renderThemeSelect = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => setStep('time-select')}>
          <ChevronLeft className="w-5 h-5 mr-1" />
          Terug
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kies 'n Tema</h2>
          <p className="text-gray-600">Wat wil julle vandag leer?</p>
        </div>
      </div>

      {/* Theme Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {themeTabs.map((theme) => (
          <Button
            key={theme}
            variant={selectedTheme === theme ? 'default' : 'outline'}
            className={selectedTheme === theme ? 'bg-amber-500 hover:bg-amber-600' : ''}
            onClick={() => setSelectedTheme(theme)}
          >
            {themeIcons[theme] || <Sparkles className="w-4 h-4 mr-2" />}
            <span className="ml-2">{theme}</span>
          </Button>
        ))}
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getFilteredLessons().map((lesson) => (
          <Card 
            key={lesson.id}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => startLesson(lesson)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  {themeIcons[lesson.theme_tags[0]] || <BookOpen className="w-6 h-6 text-amber-600" />}
                </div>
                <Badge variant="outline" className="text-xs">
                  {Array(lesson.difficulty).fill('★').join('')}
                </Badge>
              </div>
              <h3 className="font-bold text-lg mb-2">{lesson.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{lesson.summary}</p>
              {lesson.passage_reference && (
                <p className="text-xs text-amber-600 font-medium">{lesson.passage_reference}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-3">
                {lesson.theme_tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {getFilteredLessons().length === 0 && (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Geen lesse gevind vir hierdie tema nie.</p>
        </Card>
      )}
    </div>
  );

  const renderLesson = () => {
    if (!selectedLesson || !currentVariant) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const progressPercent = currentBlock === 'interactive' 
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : currentBlock === 'hook' ? 10 
      : currentBlock === 'story' ? 25 
      : currentBlock === 'explanation' ? 40 
      : currentBlock === 'reflection' ? 85 
      : 100;

    return (
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="sticky top-0 bg-white z-10 pb-4">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={() => setStep('theme-select')}>
              <Home className="w-4 h-4 mr-1" />
              Verlaat Les
            </Button>
            <span className="text-sm text-gray-500">
              {selectedLesson.title}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Hook Block */}
        {currentBlock === 'hook' && (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-amber-500 rounded-full flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Dink Daaroor...</h2>
              <p className="text-lg text-gray-700 mb-8 max-w-xl mx-auto">
                {currentVariant.hook_text}
              </p>
              <Button 
                size="lg" 
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => setCurrentBlock('story')}
              >
                Kom Ons Lees!
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Story Block */}
        {currentBlock === 'story' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Die Storie</CardTitle>
                  {selectedLesson.passage_reference && (
                    <CardDescription>{selectedLesson.passage_reference}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none mb-8">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {currentVariant.story_text}
                </p>
              </div>
              <Button 
                size="lg" 
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => setCurrentBlock('explanation')}
              >
                Wat Beteken Dit?
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Explanation Block */}
        {currentBlock === 'explanation' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle>Wat Ons Leer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                {currentVariant.explanation_points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">{i + 1}</span>
                    </div>
                    <p className="text-gray-700">{point}</p>
                  </div>
                ))}
              </div>
              
              {/* Core Truths */}
              {selectedLesson.core_truths.length > 0 && (
                <div className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Kernwaarhede
                  </h4>
                  <ul className="space-y-2">
                    {selectedLesson.core_truths.map((truth, i) => (
                      <li key={i} className="text-amber-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0" />
                        {truth}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button 
                size="lg" 
                className="w-full bg-green-500 hover:bg-green-600"
                onClick={() => setCurrentBlock('interactive')}
              >
                Toets Jou Kennis!
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Interactive Block - Questions */}
        {currentBlock === 'interactive' && currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Vraag {currentQuestionIndex + 1} van {questions.length}</CardTitle>
                    <CardDescription>{currentQuestion.skill_tag}</CardDescription>
                  </div>
                </div>
                {currentQuestion.hint_text && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowHint(true);
                      setHintsUsed(prev => prev + 1);
                    }}
                    disabled={showHint}
                  >
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Wenk
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-xl font-semibold mb-6">{currentQuestion.question_text}</h3>
              
              {showHint && currentQuestion.hint_text && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    {currentQuestion.hint_text}
                  </p>
                </div>
              )}
              
              {/* Multiple Choice / True False */}
              {(currentQuestion.question_type === 'MULTIPLE_CHOICE' || currentQuestion.question_type === 'TRUE_FALSE') && (
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, i) => {
                    const isSelected = answers[currentQuestion.id] === option;
                    return (
                      <button
                        key={i}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleAnswer(currentQuestion.id, option)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <span className={isSelected ? 'font-medium' : ''}>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Reflection Question */}
              {currentQuestion.question_type === 'REFLECTION' && (
                <div className="mb-6">
                  <textarea
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-0 min-h-[120px]"
                    placeholder="Skryf jou gedagtes hier..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  />
                </div>
              )}
              
              <Button 
                size="lg" 
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={nextQuestion}
                disabled={!answers[currentQuestion.id]}
              >
                {currentQuestionIndex < questions.length - 1 ? 'Volgende Vraag' : 'Klaar met Vrae'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reflection Block */}
        {currentBlock === 'reflection' && (
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Ouer-Kind Gesprek</CardTitle>
                  <CardDescription>Gesels saam oor wat julle geleer het</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentVariant.parent_prompt && (
                <div className="p-6 bg-white rounded-xl shadow-sm mb-6">
                  <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Gesprekspunt vir Ouers
                  </h4>
                  <p className="text-gray-700 text-lg">{currentVariant.parent_prompt}</p>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wat het julle vandag geleer? (Opsioneel)
                </label>
                <textarea
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-0 min-h-[100px]"
                  placeholder="Skryf julle gedagtes hier..."
                  value={reflectionAnswer}
                  onChange={(e) => setReflectionAnswer(e.target.value)}
                />
              </div>
              
              <Button 
                size="lg" 
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={completeLesson}
              >
                Voltooi Les
                <Trophy className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reward Block */}
        {currentBlock === 'reward' && lessonComplete && (
          <Card className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
                <Trophy className="w-12 h-12 text-amber-500" />
              </div>
              
              <h2 className="text-3xl font-bold mb-2">Baie Geluk!</h2>
              <p className="text-white/80 mb-6">Jy het die les voltooi!</p>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
                <div className="text-5xl font-bold mb-2">
                  {questions.length > 0 ? Math.round((score / questions.length) * 100) : 100}%
                </div>
                <p className="text-white/80">
                  {getScoreMessage(questions.length > 0 ? (score / questions.length) * 100 : 100)}
                </p>
                <div className="mt-4 text-sm text-white/70">
                  {score} van {questions.length} vrae korrek
                  {hintsUsed > 0 && ` • ${hintsUsed} wenke gebruik`}
                </div>
              </div>
              
              {/* Core Truths Summary */}
              <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Wat Jy Vandag Geleer Het
                </h4>
                <ul className="space-y-1 text-sm text-white/90">
                  {selectedLesson.core_truths.map((truth, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {truth}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  className="flex-1 bg-white text-orange-600 hover:bg-white/90"
                  onClick={() => {
                    setStep('theme-select');
                    setSelectedLesson(null);
                  }}
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Nog 'n Les
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="flex-1 border-white/50 text-white hover:bg-white/20"
                  onClick={() => setStep('landing')}
                >
                  <Home className="w-5 h-5 mr-2" />
                  Klaar vir Vandag
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderProgress = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => setStep('landing')}>
          <ChevronLeft className="w-5 h-5 mr-1" />
          Terug
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Vordering</h2>
          <p className="text-gray-600">Sien hoe jy groei in jou Bybel-kennis</p>
        </div>
      </div>

      {userProgress ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <CardContent className="p-6 text-center">
                <Flame className="w-8 h-8 mx-auto mb-2" />
                <div className="text-3xl font-bold">{userProgress.current_streak}</div>
                <p className="text-sm text-white/80">Dag Streak</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <div className="text-3xl font-bold">{userProgress.total_lessons_completed}</div>
                <p className="text-sm text-gray-500">Lesse Voltooi</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="text-3xl font-bold">{Math.round(userProgress.average_score)}%</div>
                <p className="text-sm text-gray-500">Gemiddelde Telling</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-3xl font-bold">
                  {Math.round(userProgress.total_time_spent_seconds / 60)}
                </div>
                <p className="text-sm text-gray-500">Minute Geleer</p>
              </CardContent>
            </Card>
          </div>

          {/* Skill Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Vaardighede</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(userProgress.skill_scores || {}).map(([skill, score]) => (
                  <div key={skill}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{skill}</span>
                      <span className="text-sm text-gray-500">{Math.round(Number(score))}%</span>
                    </div>
                    <Progress value={Number(score)} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          {userProgress.badges_earned.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Belonings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {userProgress.badges_earned.map((badge, i) => (
                    <Badge key={i} className="px-4 py-2 bg-amber-100 text-amber-800">
                      <Star className="w-4 h-4 mr-1" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2">Nog Geen Vordering</h3>
          <p className="text-gray-500 mb-6">Begin jou eerste les om jou vordering te sien!</p>
          <Button 
            className="bg-amber-500 hover:bg-amber-600"
            onClick={() => setStep('time-select')}
          >
            <Play className="w-5 h-5 mr-2" />
            Begin Nou
          </Button>
        </Card>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {step === 'landing' && renderLanding()}
      {step === 'time-select' && renderTimeSelect()}
      {step === 'theme-select' && renderThemeSelect()}
      {step === 'lesson' && renderLesson()}
      {step === 'progress' && renderProgress()}
    </div>
  );
};

export default KortKragtig;
