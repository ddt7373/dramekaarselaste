import React, { useState, useEffect } from 'react';
import { LMSLes, LMSKursus, LMSSubmission } from '@/types/nhka';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useNHKA } from '@/contexts/NHKAContext';
import { toast } from 'sonner';
import {
    Loader2,
    Upload,
    FileCheck,
    Clock,
    CheckCircle,
    AlertCircle,
    X,
    Send
} from 'lucide-react';

interface OpdragIndienerProps {
    les: LMSLes;
    kursus: LMSKursus;
    onSubmitted: () => void;
}

const OpdragIndiener: React.FC<OpdragIndienerProps> = ({ les, kursus, onSubmitted }) => {
    const { currentUser } = useNHKA();
    const [submission, setSubmission] = useState<LMSSubmission | null>(null);
    const [textAnswer, setTextAnswer] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchSubmission();
    }, [les.id, currentUser]);

    const fetchSubmission = async () => {
        if (!currentUser) return;
        try {
            const { data, error } = await supabase
                .from('lms_submissions')
                .select('*')
                .eq('les_id', les.id)
                .eq('gebruiker_id', currentUser.id)
                .maybeSingle();

            if (error) throw error;
            setSubmission(data);
            if (data) {
                setTextAnswer(data.teks_antwoord || '');
            }
        } catch (e) {
            console.error('Error fetching submission:', e);
        } finally {
            setFetching(false);
        }
    };

    const calculateGradeColor = (score: number, max: number) => {
        const percentage = (score / max) * 100;
        if (percentage >= 75) return 'text-green-600 bg-green-50 border-green-200';
        if (percentage >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const handleSubmit = async () => {
        if (!currentUser) return;
        if (!textAnswer && !file) {
            toast.error('Voeg asseblief teks of \'n lêer by');
            return;
        }

        setLoading(true);
        let fileUrl = submission?.leer_url;
        let fileName = submission?.leernaam;

        try {
            // 1. Upload File if selected
            if (file) {
                const fileExt = file.name.split('.').pop();
                const pathName = `${currentUser.id}/${les.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('lms-submissions')
                    .upload(pathName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('lms-submissions')
                    .getPublicUrl(pathName);

                fileUrl = publicUrl;
                fileName = file.name;
            }

            // 2. Save Submission Record
            const submissionData = {
                les_id: les.id,
                gebruiker_id: currentUser.id,
                teks_antwoord: textAnswer,
                leer_url: fileUrl,
                leernaam: fileName,
                status: 'ingedien',
                maksimum_punte: les.maksimum_punte || 100,
                ingedien_op: new Date().toISOString()
            };

            if (submission) {
                // Update existing
                const { error } = await supabase
                    .from('lms_submissions')
                    .update(submissionData)
                    .eq('id', submission.id);
                if (error) throw error;
            } else {
                // Create new
                const { error } = await supabase
                    .from('lms_submissions')
                    .insert([submissionData]);
                if (error) throw error;
            }

            toast.success('Opdrag suksesvol ingedien!');
            await fetchSubmission();
            onSubmitted();

        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error('Indiening het misluk: ' + error.message);
        } finally {
            setLoading(false);
            setFile(null);
        }
    };

    if (fetching) {
        return <div className="py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>;
    }

    // View: Already submitted (Pending grading or Graded)
    if (submission) {
        const isGraded = submission.status === 'gemerk';
        const isReturned = submission.status === 'teruggestuur';

        return (
            <div className="space-y-6">
                <Alert className={isGraded ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}>
                    {isGraded ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-blue-600" />}
                    <AlertTitle className={isGraded ? 'text-green-800' : 'text-blue-800'}>
                        {isGraded ? 'Opdrag Nagesien' : 'Opdrag Ingedien'}
                    </AlertTitle>
                    <AlertDescription className={isGraded ? 'text-green-700' : 'text-blue-700'}>
                        {isGraded
                            ? `Jou opdrag is gemerk deur die instrukteur.`
                            : `Ingedien op ${new Date(submission.ingedien_op).toLocaleDateString()} om ${new Date(submission.ingedien_op).toLocaleTimeString()}`}
                    </AlertDescription>
                </Alert>

                {isGraded && (
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg">Resultate</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 grid gap-6">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border">
                                <span className="font-medium text-gray-600">Punt Behaal</span>
                                <Badge
                                    variant="outline"
                                    className={`text-lg px-3 py-1 ${calculateGradeColor(submission.punt || 0, submission.maksimum_punte || 100)}`}
                                >
                                    {submission.punt} / {submission.maksimum_punte}
                                </Badge>
                            </div>

                            {submission.terugvoer && (
                                <div className="space-y-2">
                                    <span className="font-medium text-gray-600 block">Terugvoer</span>
                                    <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-lg text-gray-800 text-sm leading-relaxed">
                                        {submission.terugvoer}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Show submitted content */}
                <Card className="opacity-80">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-500">Jou Insubmissie</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {submission.teks_antwoord && (
                            <div className="p-3 bg-gray-50 rounded border text-sm text-gray-700 whitespace-pre-wrap">
                                {submission.teks_antwoord}
                            </div>
                        )}
                        {submission.leernaam && submission.leer_url && (
                            <a
                                href={submission.leer_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 p-3 bg-white border rounded hover:bg-gray-50 transition-colors"
                            >
                                <FileCheck className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-600 underline decoration-blue-300">
                                    {submission.leernaam}
                                </span>
                            </a>
                        )}

                        {isReturned && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-amber-600 mb-3">
                                    <AlertCircle className="w-4 h-4 inline mr-2" />
                                    Hierdie opdrag is teruggestuur vir verbetering. Jy kan dit weer indien.
                                </p>
                                <Button
                                    onClick={() => setSubmission(null)} // Reset local state to edit mode
                                    variant="outline"
                                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                                >
                                    Dien Weer In
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // View: Submission Form
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-[#002855] mb-4 flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Dien Opdrag In
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Voltooi die onderstaande velde of laai 'n lêer op om jou opdrag in te dien.
                    </p>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="teks">Teks Antwoord (Opsioneel)</Label>
                    <Textarea
                        id="teks"
                        placeholder="Tik jou antwoord of notas hier..."
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        className="min-h-[120px]"
                    />
                </div>

                <div className="space-y-3">
                    <Label htmlFor="file">Lêer Oplaai (Opsioneel)</Label>
                    {!file ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                            <Input
                                id="file"
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                                }}
                            />
                            <label htmlFor="file" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload className="w-8 h-8 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Klik om te kies of sleep lêer hier</span>
                                <span className="text-xs text-gray-400">PDF, Word, Prente (Maks 10MB)</span>
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileCheck className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">{file.name}</span>
                                <span className="text-xs text-blue-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="h-8 w-8 text-blue-400 hover:text-red-500 hover:bg-blue-100">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#002855] hover:bg-[#003875]">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Stuur Opdrag
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default OpdragIndiener;
