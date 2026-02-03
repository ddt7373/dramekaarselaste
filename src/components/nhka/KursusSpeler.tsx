import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import VideoSpeler from './VideoSpeler';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Play,
  FileText,
  ClipboardCheck,
  Award,
  ChevronRight,
  Loader2,
  AlertCircle,
  Trophy,

  GraduationCap,
  Download,
  File as FileIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { LMSKursus, LMSModule, LMSLes, LMSVordering, LMSQuizAttempt } from '@/types/nhka';
import KvvraagKieser from './KvvraagKieser';
import OpdragIndiener from './OpdragIndiener';
import { lmsTranslations } from './LMSTranslations';

// Helper function

// Helper function
// Helper function removed - moved inside component

interface KursusSpelerProps {
  kursus: LMSKursus;
  les: LMSLes;
  modules: LMSModule[];
  vordering: LMSVordering[];
  onBack: () => void;
  onLesChange: (les: LMSLes) => void;
  onVorderingUpdate?: () => void;
}

const KursusSpeler: React.FC<KursusSpelerProps> = ({
  kursus,
  les,
  modules,
  vordering,
  onBack,
  onLesChange,
  onVorderingUpdate
}) => {
  const { currentUser, language } = useNHKA();
  const { toast } = useToast();
  const t = lmsTranslations[language as 'af' | 'en'];

  const getLesTipeLabel = (tipe: string): string => {
    const labels: Record<string, string> = t.lessonTypes as Record<string, string>;
    return labels[tipe] || tipe || labels['teks'];
  };

  // State removed: vrae, antwoorde, score, submitted
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showVBOSuccess, setShowVBOSuccess] = useState(false);
  const [vboCreditsAwarded, setVboCreditsAwarded] = useState(0);

  const isToets = les.tipe === 'toets' || les.tipe === 'eksamen';
  const isAssignment = les.tipe === 'opdrag';
  const isVideo = les.tipe === 'video';
  const isPredikant = currentUser?.rol === 'predikant';

  // Get saved video position for current lesson
  const getSavedVideoPosition = (): number => {
    const lesVordering = vordering.find(v => v.les_id === les.id);
    return lesVordering?.video_posisie || 0;
  };

  useEffect(() => {
    // Reset state when lesson changes
    setShowVBOSuccess(false);

    // Update last accessed time
    const updateLastAccessed = async () => {
      if (!currentUser) return;
      try {
        const { data: existing } = await supabase
          .from('lms_vordering')
          .select('id')
          .eq('gebruiker_id', currentUser.id)
          .eq('les_id', les.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('lms_vordering')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('lms_vordering')
            .insert({
              gebruiker_id: currentUser.id,
              kursus_id: kursus.id,
              les_id: les.id,
              last_accessed_at: new Date().toISOString()
            });
        }

        if (onVorderingUpdate) onVorderingUpdate();
      } catch (e) {
        console.error('Error updating last accessed:', e);
      }
    };

    updateLastAccessed();
  }, [les.id]);

  // Removed fetchVrae

  const getAllLesse = (): LMSLes[] => {
    return modules.flatMap(m => m.lesse || []);
  };

  const getCurrentLesIndex = (): number => {
    const allLesse = getAllLesse();
    return allLesse.findIndex(l => l.id === les.id);
  };

  const checkAndAwardVBOCredits = async () => {
    // Only award VBO credits if:
    // 1. User is a predikant
    // 2. Course is VBO eligible
    // 3. All lessons are completed
    if (!isPredikant || !kursus.is_vbo_geskik || !currentUser?.id) {
      return;
    }

    const allLesse = getAllLesse();
    const completedLesIds = vordering
      .filter(v => v.status === 'voltooi')
      .map(v => v.les_id);

    // Add current lesson to completed list
    completedLesIds.push(les.id);

    // Check if all lessons are now completed
    const allCompleted = allLesse.every(l => completedLesIds.includes(l.id));

    if (!allCompleted) {
      return;
    }

    // Check if VBO credits were already awarded for this course this year
    const currentYear = new Date().getFullYear();

    try {
      const { data: existingCredit, error: checkError } = await supabase
        .from('vbo_indienings')
        .select('id')
        .eq('predikant_id', currentUser.id)
        .eq('kursus_id', kursus.id)
        .eq('jaar', currentYear)
        .single();

      if (existingCredit) {
        // Credits already awarded for this course this year
        console.log('VBO credits already awarded for this course this year');
        return;
      }

      // Award VBO credits automatically
      const vboKrediete = kursus.vbo_krediete || 5;

      const { error: insertError } = await supabase
        .from('vbo_indienings')
        .insert([{
          predikant_id: currentUser.id,
          aktiwiteit_id: 'lms-kursus',
          aktiwiteit_titel: `LMS Kursus: ${kursus.titel}`,
          aktiwiteit_tipe: 'kursus',
          krediete: vboKrediete,
          status: 'goedgekeur',
          notas: `Outomaties toegeken vir voltooiing van LMS kursus: ${kursus.titel}`,
          goedgekeur_op: new Date().toISOString(),
          jaar: currentYear,
          is_outomaties: true,
          kursus_id: kursus.id
        }]);

      if (insertError) {
        console.error('Error awarding VBO credits:', insertError);
        return;
      }

      // Show success notification
      setVboCreditsAwarded(vboKrediete);
      setShowVBOSuccess(true);

      toast({
        title: t.vboCreditsAwarded,
        description: t.vboCreditsMessage.replace('{credits}', vboKrediete.toString()),
      });
    } catch (error) {
      console.error('Error checking/awarding VBO credits:', error);
    }
  };

  // Generate certificate when course is completed
  const generateCertificate = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: {
          gebruiker_id: currentUser.id,
          kursus_id: kursus.id,
          gebruiker_naam: `${currentUser.naam} ${currentUser.van}`,
          kursus_titel: kursus.titel
        }
      });

      if (error) {
        console.error('Error generating certificate:', error);
        return;
      }

      if (data?.success) {
        toast({
          title: t.certificateGenerated,
          description: t.certificateMessage,
        });
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
  };

  const checkCourseCompletion = async () => {
    const allLesse = getAllLesse();
    const completedLesIds = vordering
      .filter(v => v.status === 'voltooi')
      .map(v => v.les_id);

    // Add current lesson to completed list
    completedLesIds.push(les.id);

    // Check if all lessons are now completed
    const allCompleted = allLesse.every(l => completedLesIds.includes(l.id));

    if (allCompleted) {
      // Generate certificate
      await generateCertificate();
    }
  };



  const handleQuizComplete = async (score: number, passed: boolean) => {
    if (!currentUser) return;

    try {
      // Pass/Fail logic handled by KvvraagKieser, we just record completion status
      // Note: KvvraagKieser records the attempt in lms_quiz_attempts.
      // We must check if passed to mark lesson as complete.

      if (passed) {
        const { data: existing } = await supabase
          .from('lms_vordering')
          .select('id')
          .eq('gebruiker_id', currentUser.id)
          .eq('les_id', les.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('lms_vordering')
            .update({
              status: 'voltooi',
              toets_geslaag: true,
              voltooi_datum: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('lms_vordering')
            .insert({
              gebruiker_id: currentUser.id,
              kursus_id: kursus.id,
              les_id: les.id,
              status: 'voltooi',
              toets_geslaag: true,
              voltooi_datum: new Date().toISOString()
            });
        }

        await checkAndAwardVBOCredits();
        await checkCourseCompletion();

        // Notify parent
        if (onVorderingUpdate) {
          onVorderingUpdate();
        }

        // Auto-advance on pass
        goToNextLes();
      }

    } catch (error) {
      console.error('Error handling quiz complete:', error);
    }
  };

  const handleOpdragSubmitted = async () => {
    if (!currentUser) return;
    try {
      const { data: existing } = await supabase
        .from('lms_vordering')
        .select('id')
        .eq('gebruiker_id', currentUser.id)
        .eq('les_id', les.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('lms_vordering')
          .update({
            status: 'voltooi',
            voltooi_datum: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('lms_vordering')
          .insert({
            gebruiker_id: currentUser.id,
            kursus_id: kursus.id,
            les_id: les.id,
            status: 'voltooi',
            voltooi_datum: new Date().toISOString()
          });
      }

      await checkAndAwardVBOCredits();
      await checkCourseCompletion();

      if (onVorderingUpdate) {
        onVorderingUpdate();
      }

      // Auto-advance on submission
      goToNextLes();

    } catch (error) {
      console.error('Error handling assignment submission:', error);
    }
  };

  const handleVideoComplete = async () => {
    if (!currentUser) return;

    try {
      const { data: existing } = await supabase
        .from('lms_vordering')
        .select('id')
        .eq('gebruiker_id', currentUser.id)
        .eq('les_id', les.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('lms_vordering')
          .update({
            status: 'voltooi',
            voltooi_datum: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('lms_vordering')
          .insert({
            gebruiker_id: currentUser.id,
            kursus_id: kursus.id,
            les_id: les.id,
            status: 'voltooi',
            voltooi_datum: new Date().toISOString()
          });
      }

      // Check and award VBO credits if applicable
      await checkAndAwardVBOCredits();

      // Notify parent to refresh vordering
      if (onVorderingUpdate) {
        onVorderingUpdate();
      }
    } catch (error) {
      console.error('Error completing video lesson:', error);
    }
  };

  const handleCompleteLes = async () => {
    if (!currentUser) return;

    setCompleting(true);

    try {
      // Manual UPSERT logic to avoid 42P10 error
      const { data: existing } = await supabase
        .from('lms_vordering')
        .select('id')
        .eq('gebruiker_id', currentUser.id)
        .eq('les_id', les.id)
        .maybeSingle();

      let error = null;

      if (existing) {
        const { error: updError } = await supabase
          .from('lms_vordering')
          .update({
            status: 'voltooi',
            voltooi_datum: new Date().toISOString()
          })
          .eq('id', existing.id);
        error = updError;
      } else {
        const { error: insError } = await supabase
          .from('lms_vordering')
          .insert({
            gebruiker_id: currentUser.id,
            kursus_id: kursus.id,
            les_id: les.id,
            status: 'voltooi',
            voltooi_datum: new Date().toISOString()
          });
        error = insError;
      }

      if (error) throw error;

      console.log('Lesson marked as complete in DB');

      // Check and award VBO credits if applicable
      await checkAndAwardVBOCredits();

      toast({
        title: t.lessonComplete,
        description: t.lessonCompleteDesc,
      });

      // Notify parent to refresh vordering
      if (onVorderingUpdate) {
        onVorderingUpdate();
      }

      goToNextLes();
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie les voltooi nie.',
        variant: 'destructive'
      });
    } finally {
      setCompleting(false);
    }
  };

  const goToNextLes = () => {
    const allLesse = getAllLesse();
    const currentIndex = getCurrentLesIndex();
    if (currentIndex < allLesse.length - 1) {
      onLesChange(allLesse[currentIndex + 1]);
    }
  };

  const goToPrevLes = () => {
    const allLesse = getAllLesse();
    const currentIndex = getCurrentLesIndex();
    if (currentIndex > 0) {
      onLesChange(allLesse[currentIndex - 1]);
    }
  };

  const isLesVoltooi = (lesId: string) => {
    return vordering.some(v => v.les_id === lesId && v.status === 'voltooi');
  };

  const getLesIcon = (tipe: string) => {
    switch (tipe) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'teks': return <FileText className="w-4 h-4" />;
      case 'toets': return <ClipboardCheck className="w-4 h-4" />;
      case 'eksamen': return <Award className="w-4 h-4" />;
      case 'opdrag': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // React Markdown Renderer
  // React Markdown Renderer with Iframe support
  const renderContent = (content: string) => {
    if (!content) return null;

    // Check if content looks like HTML (has common block tags)
    // Moodle content usually starts with <p>, <div>, etc.
    const isHtml = /<\/?(div|p|span|br|h[1-6]|ul|ol|li|table|img)[^>]*>/i.test(content);

    if (isHtml) {
      return (
        <div
          className="prose prose-sm mx-auto text-gray-700 [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-4 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:shadow-md"
          style={{ maxWidth: '800px' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    // Split content by iframe tags (capturing the delimiter to include it)
    const parts = content.split(/(<iframe.*?<\/iframe>)/gs);

    return (
      <div className="prose prose-sm mx-auto text-gray-700" style={{ maxWidth: '800px' }}>
        {parts.map((part, index) => {
          // Check if part is an iframe
          if (part.toLowerCase().includes('<iframe') && part.toLowerCase().includes('</iframe>')) {
            return (
              <div
                key={index}
                className="aspect-video w-full mx-auto rounded-xl overflow-hidden shadow-md my-6 [&_iframe]:w-full [&_iframe]:h-full relative z-[60]"
                style={{ maxWidth: '800px' }}
                dangerouslySetInnerHTML={{ __html: part }}
              />
            );
          }

          // Otherwise render as markdown
          if (!part.trim()) return null;

          return (
            <ReactMarkdown
              key={index}
              components={{
                a: ({ node, ...props }) => <a {...props} className="text-[#D4A84B] hover:underline" target="_blank" rel="noopener noreferrer" />,
                img: ({ node, ...props }) => (
                  <div className="my-4 rounded-xl overflow-hidden shadow-md">
                    <img {...props} className="w-full h-auto" />
                  </div>
                )
              }}
            >
              {part}
            </ReactMarkdown>
          );
        })}
      </div>
    );
  };

  const allLesse = getAllLesse();
  const currentIndex = getCurrentLesIndex();
  const hasNext = currentIndex < allLesse.length - 1;
  const hasPrevious = currentIndex > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToCourse}
        </Button>
        <div className="flex items-center gap-3">
          {kursus.is_vbo_geskik && isPredikant && (
            <Badge className="bg-[#D4A84B] text-[#002855]">
              <GraduationCap className="w-3 h-3 mr-1" />
              VBO {kursus.vbo_krediete} krediete
            </Badge>
          )}
          <div className="text-sm text-gray-500">
            {t.lesson} {currentIndex + 1} {t.of} {allLesse.length}
          </div>
        </div>
      </div>

      {/* VBO Success Banner */}
      {showVBOSuccess && (
        <div className="bg-gradient-to-r from-[#D4A84B]/20 to-[#D4A84B]/10 border border-[#D4A84B]/30 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#D4A84B] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#002855]">{t.vboCreditsAwarded}</h3>
              <p className="text-sm text-gray-600">
                {t.vboCreditsMessage.replace('{credits}', vboCreditsAwarded.toString())}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVBOSuccess(false)}
              className="text-gray-400"
            >
              Sluit
            </Button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Badge variant="outline">{getLesTipeLabel(les.tipe)}</Badge>
                <span>{les.duur_minute} min</span>
                {isLesVoltooi(les.id) && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Voltooi
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl text-[#002855]">{les.titel}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Text Content */}
              {les.tipe === 'teks' && les.inhoud && (
                <div className="mb-6">
                  {renderContent(les.inhoud)}
                </div>
              )}

              {/* Attachments / Bylaes */}
              {(() => {
                const bylaeList = Array.isArray(les.bylaes) ? les.bylaes : (typeof les.bylaes === 'string' ? (() => { try { const p = JSON.parse(les.bylaes as string); return Array.isArray(p) ? p : []; } catch { return []; } })() : []);
                return bylaeList.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="font-semibold text-[#002855] mb-4 flex items-center gap-2">
                    <FileIcon className="w-5 h-5" />
                    Hulpbronne
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {bylaeList.map((bylae: { titel?: string; url?: string; tipe?: string; grootte?: number }, idx: number) => (
                      <a
                        key={idx}
                        href={bylae.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="p-2 bg-white rounded border border-gray-200 mr-3 group-hover:border-[#D4A84B]">
                          <FileIcon className="w-5 h-5 text-[#002855]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-700 truncate">{bylae.titel || 'Hulpbron'}</p>
                          <p className="text-xs text-gray-500">
                            {(bylae.tipe || '').split('/')[1]?.toUpperCase() || 'FILE'} • {((bylae.grootte || 0) / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-[#D4A84B]" />
                      </a>
                    ))}
                  </div>
                </div>
              );
              })()}

              {/* Video Content - Using new VideoSpeler component */}
              {isVideo && (
                <div className="space-y-4 max-w-[800px] mx-auto">
                  <VideoSpeler
                    videoUrl={les.video_url || ''}
                    lesId={les.id}
                    kursusId={kursus.id}
                    lesTitel={les.titel}
                    onComplete={handleVideoComplete}
                    onNext={hasNext ? goToNextLes : undefined}
                    onPrevious={hasPrevious ? goToPrevLes : undefined}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    savedPosition={getSavedVideoPosition()}
                    autoAdvance={true}
                  />

                  {les.inhoud && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-[#002855] mb-3">Notas:</h3>
                      {renderContent(les.inhoud)}
                    </div>
                  )}

                  {/* Vorige/Volgende knoppies onder aan videoles */}
                  <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
                    <Button
                      onClick={goToPrevLes}
                      disabled={!hasPrevious}
                      className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Vorige
                    </Button>
                    <Button
                      onClick={goToNextLes}
                      disabled={!hasNext}
                      className="bg-[#D4A84B] hover:bg-[#C49A3B] text-[#002855] font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Volgende
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Quiz/Exam Content */}
              {isToets && (
                <div className="space-y-6">
                  <KvvraagKieser
                    les={les}
                    onComplete={handleQuizComplete}
                  />
                </div>
              )}

              {/* Assignment Content */}
              {isAssignment && (
                <div className="space-y-6">
                  <OpdragIndiener
                    les={les}
                    kursus={kursus}
                    onSubmitted={handleOpdragSubmitted}
                  />
                </div>
              )}

              {/* Navigation - Volgende & Vorige knoppies onder aan die les */}
              {!isVideo && (
                <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
                  <Button
                    onClick={goToPrevLes}
                    disabled={!hasPrevious}
                    className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Vorige
                  </Button>

                  {/* Volgende: vir teks-lesse voltooi of gaan na volgende; vir toets/opdrag net navigeer */}
                  {isToets || isAssignment ? (
                    <Button
                      onClick={goToNextLes}
                      disabled={!hasNext}
                      className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Volgende
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (!isLesVoltooi(les.id)) {
                          handleCompleteLes();
                        } else {
                          goToNextLes();
                        }
                      }}
                      disabled={completing || (!hasNext && !isLesVoltooi(les.id))}
                      className="bg-[#D4A84B] hover:bg-[#C49A3B] text-[#002855] font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : !hasNext ? (
                        <Trophy className="w-4 h-4 mr-2" />
                      ) : (
                        <ArrowRight className="w-4 h-4 ml-2" />
                      )}
                      {!hasNext ? 'Voltooi Kursus' : 'Volgende'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Completion / Certificate Screen */}
          {!hasNext && isLesVoltooi(les.id) && (
            <Card className="mt-8 bg-gradient-to-br from-[#002855] to-[#004895] text-white overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Trophy className="w-64 h-64" />
              </div>
              <CardContent className="p-8 relative z-10 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 bg-[#D4A84B] rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-10 h-10 text-[#002855]" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold mb-4">Baie Geluk!</h2>
                <p className="text-blue-100 text-lg mb-8 max-w-md mx-auto">
                  Jy het <span className="font-bold text-white">{kursus.titel}</span> suksesvol voltooi.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={generateCertificate}
                    className="bg-[#D4A84B] hover:bg-[#C49A3B] text-[#002855] font-bold"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Laai Sertifikaat Af
                  </Button>

                  <Button
                    variant="outline"
                    className="text-white border-white hover:bg-white/10"
                    onClick={onBack}
                  >
                    Terug na Kursusse
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Sidebar - Course Navigation */}
        <div className="space-y-4">
          {/* VBO Info Card */}
          {kursus.is_vbo_geskik && isPredikant && (
            <Card className="border-[#D4A84B]/30 bg-gradient-to-br from-[#D4A84B]/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="w-5 h-5 text-[#D4A84B]" />
                  <span className="font-semibold text-[#002855]">VBO Geskik</span>
                </div>
                <p className="text-sm text-gray-600">
                  Voltooi hierdie kursus om <span className="font-bold text-[#D4A84B]">{kursus.vbo_krediete} VBO krediete</span> outomaties te ontvang.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Kursus Navigasie</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {modules.map((module) => (
                  <div key={module.id} className="border-b last:border-b-0">
                    <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-[#002855]">
                      {module.titel}
                    </div>
                    <div className="divide-y">
                      {module.lesse?.map((moduleLes) => {
                        const isActive = moduleLes.id === les.id;
                        const isVoltooi = isLesVoltooi(moduleLes.id);

                        return (
                          <button
                            key={moduleLes.id}
                            onClick={() => onLesChange(moduleLes)}
                            className={`w-full px-4 py-3 flex items-center gap-3 text-left text-sm transition-colors ${isActive
                              ? 'bg-[#002855]/5 border-l-2 border-l-[#002855]'
                              : 'hover:bg-gray-50'
                              }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isVoltooi
                              ? 'bg-green-100 text-green-600'
                              : isActive
                                ? 'bg-[#002855] text-white'
                                : 'bg-gray-100 text-gray-500'
                              }`}>
                              {isVoltooi ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                getLesIcon(moduleLes.tipe)
                              )}
                            </div>
                            <span className={`flex-1 truncate ${isActive ? 'font-medium text-[#002855]' : 'text-gray-600'}`}>
                              {moduleLes.titel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-2">Kursus Vordering</div>
              <Progress
                value={allLesse.length > 0 ? (vordering.filter(v => v.status === 'voltooi').length / allLesse.length) * 100 : 0}
                className="h-2"
              />
              <div className="text-xs text-gray-400 mt-1">
                {vordering.filter(v => v.status === 'voltooi').length} / {allLesse.length} lesse voltooi
              </div>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts Info */}
          {isVideo && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Sleutelbord Kortpaaie</h4>
                <div className="space-y-1 text-xs text-blue-700">
                  <div className="flex justify-between">
                    <span>Speel/Pause</span>
                    <kbd className="bg-blue-100 px-1.5 py-0.5 rounded">Spasie</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Skip 10s</span>
                    <span>
                      <kbd className="bg-blue-100 px-1.5 py-0.5 rounded">←</kbd>
                      <kbd className="bg-blue-100 px-1.5 py-0.5 rounded ml-1">→</kbd>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volskerm</span>
                    <kbd className="bg-blue-100 px-1.5 py-0.5 rounded">F</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Demp</span>
                    <kbd className="bg-blue-100 px-1.5 py-0.5 rounded">M</kbd>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div >
    </div >
  );
};


export default KursusSpeler;
