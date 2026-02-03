import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ChevronLeft,
  BookOpen,
  Eye,
  EyeOff,
  Archive,
  Copy,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  KKLesson, 
  KKLessonVariant, 
  KKQuestion, 
  KKLessonStatus,
  KKVariantType,
  KKQuestionType,
  KKSkillTag,
  isAdmin
} from '@/types/nhka';

const themeOptions = ['Stories', 'Jesus', 'Wysheid', 'Gebed', 'Vrug van die Gees', 'Liefde', 'God'];
const ageBandOptions = ['6-8', '9-11', '6-11', '12-13'];
const questionTypes: { value: KKQuestionType; label: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: 'Meervoudige Keuse' },
  { value: 'TRUE_FALSE', label: 'Waar/Onwaar' },
  { value: 'REFLECTION', label: 'Refleksie' }
];
const skillTags: KKSkillTag[] = ['Feite', 'Begrip', 'Toepassing', 'Vers'];

const KortKragtigAdmin: React.FC = () => {
  const { currentUser, setCurrentView } = useNHKA();
  
  const [lessons, setLessons] = useState<KKLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLesson, setEditingLesson] = useState<KKLesson | null>(null);
  const [editingVariant, setEditingVariant] = useState<KKLessonVariant | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<KKQuestion | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<KKLesson | null>(null);
  const [variants, setVariants] = useState<KKLessonVariant[]>([]);
  const [questions, setQuestions] = useState<KKQuestion[]>([]);
  
  // Form state
  const [lessonForm, setLessonForm] = useState({
    title: '',
    passage_reference: '',
    theme_tags: [] as string[],
    age_band: '6-11',
    difficulty: 1,
    summary: '',
    core_truths: [''],
    status: 'DRAFT' as KKLessonStatus
  });
  
  const [variantForm, setVariantForm] = useState({
    variant_type: 'STANDARD' as KKVariantType,
    hook_text: '',
    story_text: '',
    explanation_points: [''],
    parent_prompt: ''
  });
  
  const [questionForm, setQuestionForm] = useState({
    question_type: 'MULTIPLE_CHOICE' as KKQuestionType,
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    skill_tag: 'Feite' as KKSkillTag,
    difficulty: 1,
    hint_text: '',
    explanation: '',
    variant_type: 'STANDARD'
  });

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kk_lessons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setLessons(data);
    setLoading(false);
  };

  const loadLessonDetails = async (lesson: KKLesson) => {
    setSelectedLesson(lesson);
    
    const [variantsRes, questionsRes] = await Promise.all([
      supabase.from('kk_lesson_variants').select('*').eq('lesson_id', lesson.id),
      supabase.from('kk_questions').select('*').eq('lesson_id', lesson.id)
    ]);
    
    if (variantsRes.data) setVariants(variantsRes.data);
    if (questionsRes.data) setQuestions(questionsRes.data);
  };

  const handleSaveLesson = async () => {
    if (!currentUser) return;
    setSaving(true);
    
    try {
      const lessonData = {
        ...lessonForm,
        core_truths: lessonForm.core_truths.filter(t => t.trim()),
        created_by: editingLesson ? editingLesson.created_by : currentUser.id,
        updated_at: new Date().toISOString()
      };
      
      if (editingLesson) {
        await supabase.from('kk_lessons').update(lessonData).eq('id', editingLesson.id);
      } else {
        await supabase.from('kk_lessons').insert(lessonData);
      }
      
      await loadLessons();
      resetLessonForm();
    } catch (error) {
      console.error('Error saving lesson:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVariant = async () => {
    if (!selectedLesson) return;
    setSaving(true);
    
    try {
      const variantData = {
        ...variantForm,
        lesson_id: selectedLesson.id,
        explanation_points: variantForm.explanation_points.filter(p => p.trim()),
        updated_at: new Date().toISOString()
      };
      
      if (editingVariant) {
        await supabase.from('kk_lesson_variants').update(variantData).eq('id', editingVariant.id);
      } else {
        await supabase.from('kk_lesson_variants').insert(variantData);
      }
      
      await loadLessonDetails(selectedLesson);
      resetVariantForm();
    } catch (error) {
      console.error('Error saving variant:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!selectedLesson) return;
    setSaving(true);
    
    try {
      const questionData = {
        ...questionForm,
        lesson_id: selectedLesson.id,
        options: questionForm.options.filter(o => o.trim()),
        correct_answers: [questionForm.correct_answer]
      };
      
      if (editingQuestion) {
        await supabase.from('kk_questions').update(questionData).eq('id', editingQuestion.id);
      } else {
        await supabase.from('kk_questions').insert(questionData);
      }
      
      await loadLessonDetails(selectedLesson);
      resetQuestionForm();
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Is jy seker jy wil hierdie les verwyder?')) return;
    await supabase.from('kk_lessons').delete().eq('id', id);
    await loadLessons();
    if (selectedLesson?.id === id) setSelectedLesson(null);
  };

  const handleDeleteVariant = async (id: string) => {
    if (!confirm('Is jy seker jy wil hierdie variant verwyder?')) return;
    await supabase.from('kk_lesson_variants').delete().eq('id', id);
    if (selectedLesson) await loadLessonDetails(selectedLesson);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Is jy seker jy wil hierdie vraag verwyder?')) return;
    await supabase.from('kk_questions').delete().eq('id', id);
    if (selectedLesson) await loadLessonDetails(selectedLesson);
  };

  const handleToggleStatus = async (lesson: KKLesson) => {
    const newStatus = lesson.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await supabase.from('kk_lessons').update({ status: newStatus }).eq('id', lesson.id);
    await loadLessons();
    if (selectedLesson?.id === lesson.id) {
      setSelectedLesson({ ...selectedLesson, status: newStatus });
    }
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      passage_reference: '',
      theme_tags: [],
      age_band: '6-11',
      difficulty: 1,
      summary: '',
      core_truths: [''],
      status: 'DRAFT'
    });
    setEditingLesson(null);
    setShowLessonForm(false);
  };

  const resetVariantForm = () => {
    setVariantForm({
      variant_type: 'STANDARD',
      hook_text: '',
      story_text: '',
      explanation_points: [''],
      parent_prompt: ''
    });
    setEditingVariant(null);
    setShowVariantForm(false);
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question_type: 'MULTIPLE_CHOICE',
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      skill_tag: 'Feite',
      difficulty: 1,
      hint_text: '',
      explanation: '',
      variant_type: 'STANDARD'
    });
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  const editLesson = (lesson: KKLesson) => {
    setLessonForm({
      title: lesson.title,
      passage_reference: lesson.passage_reference || '',
      theme_tags: lesson.theme_tags || [],
      age_band: lesson.age_band || '6-11',
      difficulty: lesson.difficulty || 1,
      summary: lesson.summary || '',
      core_truths: lesson.core_truths?.length ? lesson.core_truths : [''],
      status: lesson.status
    });
    setEditingLesson(lesson);
    setShowLessonForm(true);
  };

  const editVariant = (variant: KKLessonVariant) => {
    setVariantForm({
      variant_type: variant.variant_type,
      hook_text: variant.hook_text || '',
      story_text: variant.story_text || '',
      explanation_points: variant.explanation_points?.length ? variant.explanation_points : [''],
      parent_prompt: variant.parent_prompt || ''
    });
    setEditingVariant(variant);
    setShowVariantForm(true);
  };

  const editQuestion = (question: KKQuestion) => {
    setQuestionForm({
      question_type: question.question_type,
      question_text: question.question_text,
      options: question.options?.length >= 4 ? question.options : [...(question.options || []), '', '', '', ''].slice(0, 4),
      correct_answer: question.correct_answer || '',
      skill_tag: question.skill_tag,
      difficulty: question.difficulty || 1,
      hint_text: question.hint_text || '',
      explanation: question.explanation || '',
      variant_type: question.variant_type || 'STANDARD'
    });
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const getStatusBadge = (status: KKLessonStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge className="bg-green-100 text-green-800">Gepubliseer</Badge>;
      case 'DRAFT':
        return <Badge className="bg-yellow-100 text-yellow-800">Konsep</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-gray-100 text-gray-800">Geargiveer</Badge>;
    }
  };

  if (!currentUser || !isAdmin(currentUser.rol)) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-gray-600">Jy het nie toegang tot hierdie bladsy nie.</p>
        <Button className="mt-4" onClick={() => setCurrentView('kort-kragtig')}>
          Terug na Kort & Kragtig
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Lesson Detail View
  if (selectedLesson) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedLesson(null)}>
            <ChevronLeft className="w-5 h-5 mr-1" />
            Terug
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{selectedLesson.title}</h2>
            <p className="text-gray-500">{selectedLesson.passage_reference}</p>
          </div>
          {getStatusBadge(selectedLesson.status)}
        </div>

        {/* Variants Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Les Variante</CardTitle>
              <CardDescription>Verskillende weergawes vir verskillende tydkeuses</CardDescription>
            </div>
            <Button onClick={() => setShowVariantForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuwe Variant
            </Button>
          </CardHeader>
          <CardContent>
            {showVariantForm && (
              <Card className="mb-4 border-2 border-amber-200 bg-amber-50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{editingVariant ? 'Wysig Variant' : 'Nuwe Variant'}</h4>
                    <Button variant="ghost" size="sm" onClick={resetVariantForm}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <Label>Variant Tipe</Label>
                    <select
                      className="w-full p-2 border rounded-lg mt-1"
                      value={variantForm.variant_type}
                      onChange={(e) => setVariantForm({ ...variantForm, variant_type: e.target.value as KKVariantType })}
                    >
                      <option value="SHORT">Kort (3 min)</option>
                      <option value="STANDARD">Standaard (5 min)</option>
                      <option value="EXTENDED">Uitgebrei (10-15 min)</option>
                      <option value="REMEDIAL">Hersienings</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Hook Teks (Inleiding)</Label>
                    <Textarea
                      value={variantForm.hook_text}
                      onChange={(e) => setVariantForm({ ...variantForm, hook_text: e.target.value })}
                      placeholder="'n Vraag of stelling om die kind se aandag te kry..."
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label>Storie Teks</Label>
                    <Textarea
                      value={variantForm.story_text}
                      onChange={(e) => setVariantForm({ ...variantForm, story_text: e.target.value })}
                      placeholder="Die Bybelstorie in kindervriendelike taal..."
                      rows={6}
                    />
                  </div>
                  
                  <div>
                    <Label>Verduideliking Punte</Label>
                    {variantForm.explanation_points.map((point, i) => (
                      <div key={i} className="flex gap-2 mt-2">
                        <Input
                          value={point}
                          onChange={(e) => {
                            const newPoints = [...variantForm.explanation_points];
                            newPoints[i] = e.target.value;
                            setVariantForm({ ...variantForm, explanation_points: newPoints });
                          }}
                          placeholder={`Punt ${i + 1}`}
                        />
                        {i === variantForm.explanation_points.length - 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setVariantForm({ ...variantForm, explanation_points: [...variantForm.explanation_points, ''] })}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <Label>Ouer Gesprekspunt</Label>
                    <Textarea
                      value={variantForm.parent_prompt}
                      onChange={(e) => setVariantForm({ ...variantForm, parent_prompt: e.target.value })}
                      placeholder="Gesprekspunt vir ouers om met kinders te bespreek..."
                      rows={2}
                    />
                  </div>
                  
                  <Button onClick={handleSaveVariant} disabled={saving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Stoor...' : 'Stoor Variant'}
                  </Button>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-3">
              {variants.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Geen variante nog nie</p>
              ) : (
                variants.map((variant) => (
                  <div key={variant.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {variant.variant_type === 'SHORT' && 'Kort (3 min)'}
                          {variant.variant_type === 'STANDARD' && 'Standaard (5 min)'}
                          {variant.variant_type === 'EXTENDED' && 'Uitgebrei (10-15 min)'}
                          {variant.variant_type === 'REMEDIAL' && 'Hersienings'}
                        </Badge>
                        <p className="text-sm text-gray-600 line-clamp-2">{variant.hook_text}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => editVariant(variant)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteVariant(variant.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vrae</CardTitle>
              <CardDescription>Interaktiewe vrae vir die les</CardDescription>
            </div>
            <Button onClick={() => setShowQuestionForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuwe Vraag
            </Button>
          </CardHeader>
          <CardContent>
            {showQuestionForm && (
              <Card className="mb-4 border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{editingQuestion ? 'Wysig Vraag' : 'Nuwe Vraag'}</h4>
                    <Button variant="ghost" size="sm" onClick={resetQuestionForm}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Vraag Tipe</Label>
                      <select
                        className="w-full p-2 border rounded-lg mt-1"
                        value={questionForm.question_type}
                        onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value as KKQuestionType })}
                      >
                        {questionTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Vaardigheid</Label>
                      <select
                        className="w-full p-2 border rounded-lg mt-1"
                        value={questionForm.skill_tag}
                        onChange={(e) => setQuestionForm({ ...questionForm, skill_tag: e.target.value as KKSkillTag })}
                      >
                        {skillTags.map((tag) => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Vraag Teks</Label>
                    <Textarea
                      value={questionForm.question_text}
                      onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                      placeholder="Die vraag wat gevra word..."
                      rows={2}
                    />
                  </div>
                  
                  {(questionForm.question_type === 'MULTIPLE_CHOICE' || questionForm.question_type === 'TRUE_FALSE') && (
                    <>
                      <div>
                        <Label>Opsies</Label>
                        {questionForm.question_type === 'TRUE_FALSE' ? (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <Input value="Waar" disabled />
                            <Input value="Onwaar" disabled />
                          </div>
                        ) : (
                          <div className="space-y-2 mt-2">
                            {questionForm.options.map((option, i) => (
                              <Input
                                key={i}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...questionForm.options];
                                  newOptions[i] = e.target.value;
                                  setQuestionForm({ ...questionForm, options: newOptions });
                                }}
                                placeholder={`Opsie ${i + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label>Korrekte Antwoord</Label>
                        <select
                          className="w-full p-2 border rounded-lg mt-1"
                          value={questionForm.correct_answer}
                          onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                        >
                          <option value="">Kies...</option>
                          {questionForm.question_type === 'TRUE_FALSE' ? (
                            <>
                              <option value="Waar">Waar</option>
                              <option value="Onwaar">Onwaar</option>
                            </>
                          ) : (
                            questionForm.options.filter(o => o.trim()).map((option, i) => (
                              <option key={i} value={option}>{option}</option>
                            ))
                          )}
                        </select>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <Label>Wenk (Opsioneel)</Label>
                    <Input
                      value={questionForm.hint_text}
                      onChange={(e) => setQuestionForm({ ...questionForm, hint_text: e.target.value })}
                      placeholder="'n Wenk om die kind te help..."
                    />
                  </div>
                  
                  <div>
                    <Label>Verduideliking (Opsioneel)</Label>
                    <Textarea
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                      placeholder="Verduideliking van die korrekte antwoord..."
                      rows={2}
                    />
                  </div>
                  
                  <Button onClick={handleSaveQuestion} disabled={saving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Stoor...' : 'Stoor Vraag'}
                  </Button>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-3">
              {questions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Geen vrae nog nie</p>
              ) : (
                questions.map((question, i) => (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">
                            {i + 1}
                          </span>
                          <Badge variant="outline">{question.skill_tag}</Badge>
                          <Badge variant="secondary">
                            {questionTypes.find(t => t.value === question.question_type)?.label}
                          </Badge>
                        </div>
                        <p className="font-medium">{question.question_text}</p>
                        {question.correct_answer && (
                          <p className="text-sm text-green-600 mt-1">
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            {question.correct_answer}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => editQuestion(question)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(question.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lessons List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setCurrentView('kort-kragtig')}>
            <ChevronLeft className="w-5 h-5 mr-1" />
            Terug
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              Kort & Kragtig Admin
            </h1>
            <p className="text-gray-500">Bestuur mikro-lesse vir kinders</p>
          </div>
        </div>
        <Button onClick={() => setShowLessonForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuwe Les
        </Button>
      </div>

      {/* Lesson Form */}
      {showLessonForm && (
        <Card className="border-2 border-amber-200">
          <CardHeader>
            <CardTitle>{editingLesson ? 'Wysig Les' : 'Nuwe Les'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Titel</Label>
                <Input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Bv. Die Verlore Skaap"
                />
              </div>
              <div>
                <Label>Skrifverwysing</Label>
                <Input
                  value={lessonForm.passage_reference}
                  onChange={(e) => setLessonForm({ ...lessonForm, passage_reference: e.target.value })}
                  placeholder="Bv. Lukas 15:1-7"
                />
              </div>
            </div>
            
            <div>
              <Label>Temas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {themeOptions.map((theme) => (
                  <Badge
                    key={theme}
                    variant={lessonForm.theme_tags.includes(theme) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (lessonForm.theme_tags.includes(theme)) {
                        setLessonForm({ ...lessonForm, theme_tags: lessonForm.theme_tags.filter(t => t !== theme) });
                      } else {
                        setLessonForm({ ...lessonForm, theme_tags: [...lessonForm.theme_tags, theme] });
                      }
                    }}
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ouderdomsgroep</Label>
                <select
                  className="w-full p-2 border rounded-lg mt-1"
                  value={lessonForm.age_band}
                  onChange={(e) => setLessonForm({ ...lessonForm, age_band: e.target.value })}
                >
                  {ageBandOptions.map((age) => (
                    <option key={age} value={age}>{age} jaar</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Moeilikheidsgraad (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={lessonForm.difficulty}
                  onChange={(e) => setLessonForm({ ...lessonForm, difficulty: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            
            <div>
              <Label>Opsomming</Label>
              <Textarea
                value={lessonForm.summary}
                onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })}
                placeholder="'n Kort beskrywing van wat die les behels..."
                rows={2}
              />
            </div>
            
            <div>
              <Label>Kernwaarhede</Label>
              {lessonForm.core_truths.map((truth, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input
                    value={truth}
                    onChange={(e) => {
                      const newTruths = [...lessonForm.core_truths];
                      newTruths[i] = e.target.value;
                      setLessonForm({ ...lessonForm, core_truths: newTruths });
                    }}
                    placeholder={`Kernwaarheid ${i + 1}`}
                  />
                  {i === lessonForm.core_truths.length - 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLessonForm({ ...lessonForm, core_truths: [...lessonForm.core_truths, ''] })}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleSaveLesson} disabled={saving || !lessonForm.title}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Stoor...' : 'Stoor Les'}
              </Button>
              <Button variant="outline" onClick={resetLessonForm}>
                Kanselleer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lessons List */}
      <div className="grid gap-4">
        {lessons.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Geen lesse nog nie. Skep jou eerste les!</p>
          </Card>
        ) : (
          lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => loadLessonDetails(lesson)}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{lesson.title}</h3>
                      {getStatusBadge(lesson.status)}
                    </div>
                    {lesson.passage_reference && (
                      <p className="text-sm text-amber-600 mb-2">{lesson.passage_reference}</p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">{lesson.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lesson.theme_tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(lesson)}
                      title={lesson.status === 'PUBLISHED' ? 'Verberg' : 'Publiseer'}
                    >
                      {lesson.status === 'PUBLISHED' ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => editLesson(lesson)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default KortKragtigAdmin;
