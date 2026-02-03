import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LMSLes, LMSQuestion, LMSQuizAttempt } from '@/types/nhka';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    ClipboardCheck,
    CheckCircle,
    AlertCircle,
    Trophy,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import { useNHKA } from '@/contexts/NHKAContext';

interface KvvraagKieserProps {
    les: LMSLes;
    onComplete: (score: number, passed: boolean) => void;
    previousAttempt?: LMSQuizAttempt | null;
}

const KvvraagKieser: React.FC<KvvraagKieserProps> = ({ les, onComplete, previousAttempt }) => {
    const { currentUser } = useNHKA();
    const [questions, setQuestions] = useState<LMSQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ score: number; max: number; passed: boolean } | null>(null);

    useEffect(() => {
        fetchQuestions();
        if (previousAttempt) {
            setResult({
                score: previousAttempt.telling,
                max: previousAttempt.maksimum_punte,
                passed: previousAttempt.geslaag
            });
            if (previousAttempt.antwoorde) {
                setAnswers(previousAttempt.antwoorde);
            }
        } else {
            setResult(null);
            setAnswers({});
        }
    }, [les.id, previousAttempt]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('lms_questions')
                .select('*')
                .eq('les_id', les.id)
                .order('volgorde');

            if (error) throw error;
            setQuestions(data || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Kon nie vrae laai nie');
        } finally {
            setLoading(false);
        }
    };

    const calculateScore = () => {
        let score = 0;
        let max = 0;

        questions.forEach(q => {
            max += q.punte;
            // Convert answer index to string for comparison if MCQ
            if (q.vraag_tipe === 'mcq' || q.vraag_tipe === 'true_false') {
                if (answers[q.id] === q.korrekte_antwoord) {
                    score += q.punte;
                }
            }
            // Text questions are manual grade usually, but for now we might auto-mark correct if matches perfectly?
            // Or purely ignore text questions in auto-score?
            // Let's assume text questions get 0 until graded (conceptually), but for "Quiz" it's usually auto.
            // If 'text', we can't auto-grade easily. 
        });
        return { score, max };
    };

    const handleSubmit = async () => {
        if (!currentUser) return;

        // Validate all answered?
        const unanswered = questions.filter(q => !answers[q.id]);
        if (unanswered.length > 0) {
            toast.error(`Beantwoord asseblief alle vrae (${unanswered.length} oor)`);
            return;
        }

        setSubmitting(true);
        try {
            const { score, max } = calculateScore();
            const percentage = max > 0 ? (score / max) * 100 : 0;
            const passed = percentage >= les.slaag_persentasie;

            // Save attempt
            const { error } = await supabase
                .from('lms_quiz_attempts')
                .insert([{
                    les_id: les.id,
                    gebruiker_id: currentUser.id,
                    telling: score,
                    maksimum_punte: max,
                    persentasie: percentage,
                    geslaag: passed,
                    antwoorde: answers,
                    voltooi_op: new Date().toISOString()
                }]);

            if (error) throw error;

            setResult({ score, max, passed });
            onComplete(score, passed);

            if (passed) {
                toast.success(`Geluk! Jy het geslaag met ${Math.round(percentage)}%`);
            } else {
                toast.error(`Ongelukkig het jy nie geslaag nie. Jy het ${Math.round(percentage)}% gekry.`);
            }

        } catch (error) {
            console.error('Error submitting quiz:', error);
            toast.error('Kon nie antwoorde indien nie');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = () => {
        setResult(null);
        setAnswers({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;
    }

    if (questions.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Geen vrae vir hierdie toets nie.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            {result && (
                <Card className={`${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <CardContent className="p-6 text-center">
                        {result.passed ? (
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        ) : (
                            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                        )}
                        <h3 className={`text-2xl font-bold mb-2 ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                            {result.passed ? 'Toets Geslaag!' : 'Toets Nie Geslaag Nie'}
                        </h3>
                        <p className="text-lg mb-4">
                            Jou telling: <span className="font-bold">{result.score}</span> / {result.max} ({Math.round((result.score / result.max) * 100)}%)
                        </p>
                        <p className="text-sm text-gray-500">
                            Slaagvereiste: {les.slaag_persentasie}%
                        </p>
                        {!result.passed && (
                            <Button onClick={handleRetry} className="mt-6 bg-[#002855]">
                                Probeer Weer
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {questions.map((q, idx) => (
                    <Card key={q.id} className={`${result ? 'opacity-90' : ''}`}>
                        <CardContent className="p-6">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#002855] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <p className="text-lg font-medium text-gray-800">{q.vraag_teks}</p>
                                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap ml-2">
                                            {q.punte} {q.punte === 1 ? 'punt' : 'punte'}
                                        </span>
                                    </div>

                                    {q.vraag_tipe === 'mcq' && (
                                        <RadioGroup
                                            value={answers[q.id] || ''}
                                            onValueChange={(val) => !result && setAnswers({ ...answers, [q.id]: val })}
                                            className="space-y-3"
                                        >
                                            {((q.opsies as any)?.choices || (Array.isArray(q.opsies) ? q.opsies : [])).map((opsie: string, optIdx: number) => {
                                                const isSelected = answers[q.id] === optIdx.toString();
                                                const isCorrect = q.korrekte_antwoord === optIdx.toString();

                                                let borderColor = 'border-gray-200';
                                                let bgColor = 'bg-white';

                                                if (result) {
                                                    if (isCorrect) {
                                                        borderColor = 'border-green-500 ring-1 ring-green-500';
                                                        bgColor = 'bg-green-50';
                                                    } else if (isSelected && !isCorrect) {
                                                        borderColor = 'border-red-500';
                                                        bgColor = 'bg-red-50';
                                                    }
                                                } else if (isSelected) {
                                                    borderColor = 'border-[#D4A84B]';
                                                    bgColor = 'bg-[#D4A84B]/5';
                                                }

                                                return (
                                                    <div
                                                        key={optIdx}
                                                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${borderColor} ${bgColor}`}
                                                    >
                                                        <RadioGroupItem value={optIdx.toString()} id={`${q.id}-${optIdx}`} disabled={!!result} />
                                                        <Label htmlFor={`${q.id}-${optIdx}`} className="flex-1 cursor-pointer">
                                                            {opsie}
                                                        </Label>
                                                        {result && isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                                                        {result && isSelected && !isCorrect && <AlertCircle className="w-5 h-5 text-red-500" />}
                                                    </div>
                                                );
                                            })}
                                        </RadioGroup>
                                    )}

                                    {q.vraag_tipe === 'true_false' && (
                                        <RadioGroup
                                            value={answers[q.id] || ''}
                                            onValueChange={(val) => !result && setAnswers({ ...answers, [q.id]: val })}
                                            className="flex gap-4"
                                        >
                                            {['true', 'false'].map((val) => {
                                                const label = val === 'true' ? 'Waar' : 'Onwaar';
                                                const isSelected = answers[q.id] === val;
                                                const isCorrect = q.korrekte_antwoord === val;

                                                let styleClass = "border-gray-200 hover:bg-gray-50";
                                                if (result) {
                                                    if (isCorrect) styleClass = "border-green-500 bg-green-50 ring-1 ring-green-500";
                                                    else if (isSelected) styleClass = "border-red-500 bg-red-50";
                                                } else if (isSelected) {
                                                    styleClass = "border-[#D4A84B] bg-[#D4A84B]/5";
                                                }

                                                return (
                                                    <div key={val} className={`flex-1 flex items-center p-4 rounded-lg border cursor-pointer transition-all ${styleClass}`}>
                                                        <RadioGroupItem value={val} id={`${q.id}-${val}`} className="mr-3" disabled={!!result} />
                                                        <Label htmlFor={`${q.id}-${val}`} className="cursor-pointer font-medium w-full">{label}</Label>
                                                        {result && isCorrect && <CheckCircle className="w-5 h-5 text-green-500 ml-2" />}
                                                    </div>
                                                )
                                            })}
                                        </RadioGroup>
                                    )}

                                    {q.vraag_tipe === 'text' && (
                                        <div>
                                            <Textarea
                                                value={answers[q.id] || ''}
                                                onChange={(e) => !result && setAnswers({ ...answers, [q.id]: e.target.value })}
                                                disabled={!!result}
                                                placeholder="Tik jou antwoord hier..."
                                                className="min-h-[100px]"
                                            />
                                            {result && (
                                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Hierdie vraag vereis handmerk. Punte word nie outomaties bygetel nie.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {!result && (
                <div className="flex justify-end pt-6">
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-[#D4A84B] text-[#002855] hover:bg-[#C49A3B] px-8"
                    >
                        {submitting ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Merk Toets...</>
                        ) : (
                            'Dien Toets In'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default KvvraagKieser;
