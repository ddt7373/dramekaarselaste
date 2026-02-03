import React, { useState, useEffect } from 'react';
import { LMSLes, LMSSubmission } from '@/types/nhka';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useNHKA } from '@/contexts/NHKAContext';
import { toast } from 'sonner';
import { Loader2, FileText, CheckCircle, XCircle, Clock, Search, Eye, Download } from 'lucide-react';

interface OpdragMerkerProps {
    les: LMSLes;
}

const OpdragMerker: React.FC<OpdragMerkerProps> = ({ les }) => {
    const { currentUser } = useNHKA();
    const [submissions, setSubmissions] = useState<LMSSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<LMSSubmission | null>(null);
    const [grade, setGrade] = useState<number | ''>('');
    const [feedback, setFeedback] = useState('');
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchSubmissions();
    }, [les.id]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            // Fetch submissions with user details
            // Note: Supabase join syntax required
            const { data, error } = await supabase
                .from('lms_submissions')
                .select(`
            *,
            gebruiker:gebruikers(naam, van, epos)
        `)
                .eq('les_id', les.id)
                .order('ingedien_op', { ascending: false });

            if (error) throw error;
            setSubmissions(data || []);
        } catch (e) {
            console.error('Error fetching submissions:', e);
            toast.error('Kon nie inskrywings laai nie');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenGrade = (sub: LMSSubmission) => {
        setSelectedSubmission(sub);
        setGrade(sub.punt || '');
        setFeedback(sub.terugvoer || '');
        setDialogOpen(true);
    };

    const submitGrade = async (status: 'gemerk' | 'teruggestuur') => {
        if (!selectedSubmission || !currentUser) return;

        // Validate grade
        if (status === 'gemerk' && (grade === '' || Number(grade) < 0 || Number(grade) > (selectedSubmission.maksimum_punte || 100))) {
            toast.error('Ongeldige punt toekenning');
            return;
        }

        setSaving(true);
        try {
            const updateData: any = {
                status: status,
                terugvoer: feedback,
                gemerk_op: new Date().toISOString(),
                gemerk_deur: currentUser.id
            };

            if (status === 'gemerk') {
                updateData.punt = Number(grade);
            }

            const { error } = await supabase
                .from('lms_submissions')
                .update(updateData)
                .eq('id', selectedSubmission.id);

            if (error) throw error;

            // If graded and passed (e.g. > 50%), mark progress as complete?
            // Assignments should probably count as "Complete" once graded?
            // We'll leave progress marking to 'manual' or implicit 'completed' status in submission for now.
            // Ideally we should update lms_vordering here too.

            if (status === 'gemerk') {
                await supabase
                    .from('lms_vordering')
                    .upsert({
                        gebruiker_id: selectedSubmission.gebruiker_id,
                        kursus_id: les.kursus_id,
                        les_id: les.id,
                        status: 'voltooi',
                        voltooi_datum: new Date().toISOString()
                        // Maybe add score here too if needed
                    }, { onConflict: 'gebruiker_id,les_id' });
            }

            toast.success(status === 'gemerk' ? 'Punt gestoor' : 'Opdrag teruggestuur');
            setDialogOpen(false);
            fetchSubmissions();

        } catch (e) {
            console.error('Grading error:', e);
            toast.error('Kon nie punt stoor nie');
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ingedien': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Ingedien</Badge>;
            case 'gemerk': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Gemerk</Badge>;
            case 'teruggestuur': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Teruggestuur</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#002855]">Inskrywings ({submissions.length})</h3>
                <Button variant="outline" size="sm" onClick={fetchSubmissions}>Verfris</Button>
            </div>

            {submissions.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-gray-50 text-gray-500">
                    Geen inskrywings ontvang nie.
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Datum</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Punt</TableHead>
                                <TableHead className="text-right">Aksie</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="font-medium">
                                            {sub.gebruiker?.naam} {sub.gebruiker?.van}
                                        </div>
                                        <div className="text-xs text-gray-500">{sub.gebruiker?.epos}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(sub.ingedien_op).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                    <TableCell>
                                        {sub.punt !== null ? (
                                            <span className="font-medium text-[#002855]">{sub.punt} / {sub.maksimum_punte}</span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenGrade(sub)}>
                                            <Eye className="w-4 h-4 text-gray-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Merk Opdrag</DialogTitle>
                    </DialogHeader>

                    {selectedSubmission && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <Label className="text-gray-500">Student</Label>
                                    <div className="font-medium">{selectedSubmission.gebruiker?.naam} {selectedSubmission.gebruiker?.van}</div>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Ingedien Op</Label>
                                    <div className="font-medium">{new Date(selectedSubmission.ingedien_op).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                <div>
                                    <Label className="mb-2 block font-semibold text-[#002855]">Inhoud</Label>
                                    {selectedSubmission.teks_antwoord ? (
                                        <div className="bg-white p-3 border rounded text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {selectedSubmission.teks_antwoord}
                                        </div>
                                    ) : <span className="text-gray-400 italic">Geen teks antwoord</span>}
                                </div>

                                {selectedSubmission.leer_url && (
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={selectedSubmission.leer_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 bg-white px-3 py-2 border rounded shadow-sm"
                                        >
                                            <FileText className="w-4 h-4" />
                                            {selectedSubmission.leernaam || 'Laai dokument af'}
                                            <Download className="w-3 h-3 ml-1" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex gap-4">
                                    <div className="w-1/3">
                                        <Label htmlFor="punt">Punt (uit {selectedSubmission.maksimum_punte})</Label>
                                        <Input
                                            id="punt"
                                            type="number"
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="terugvoer">Terugvoer</Label>
                                    <Textarea
                                        id="terugvoer"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Gee terugvoer aan die student..."
                                        className="mt-1 min-h-[100px]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => submitGrade('teruggestuur')} disabled={saving} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                            Stuur Terug
                        </Button>
                        <Button onClick={() => submitGrade('gemerk')} disabled={saving} className="bg-[#002855]">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Stoor & Merk
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OpdragMerker;
