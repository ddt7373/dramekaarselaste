import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LMSLes, LMSQuestion } from '@/types/nhka';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
    Plus,
    Trash2,
    Save,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

interface KvvraagSkepperProps {
    les: LMSLes;
    onSave?: () => void;
}

const KvvraagSkepper: React.FC<KvvraagSkepperProps> = ({ les, onSave }) => {
    const [questions, setQuestions] = useState<LMSQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state for a single question
    const [form, setForm] = useState<{
        vraag_teks: string;
        vraag_tipe: 'mcq' | 'true_false' | 'text';
        opsies: string[];
        korrekte_antwoord: string;
        punte: number;
    }>({
        vraag_teks: '',
        vraag_tipe: 'mcq',
        opsies: ['', '', '', ''],
        korrekte_antwoord: '0', // Index for MCQ, 'true'/'false' for boolean
        punte: 1
    });

    useEffect(() => {
        fetchQuestions();
    }, [les.id]);

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

    const handleEdit = (q: LMSQuestion) => {
        setEditingId(q.id);
        setForm({
            vraag_teks: q.vraag_teks,
            vraag_tipe: q.vraag_tipe as any,
            opsies: (q.opsies && q.opsies.choices) ? q.opsies.choices : Array.isArray(q.opsies) ? q.opsies : ['', '', '', ''],
            korrekte_antwoord: q.korrekte_antwoord || '',
            punte: q.punte
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        resetForm();
    };

    const resetForm = () => {
        setForm({
            vraag_teks: '',
            vraag_tipe: 'mcq',
            opsies: ['', '', '', ''],
            korrekte_antwoord: '0',
            punte: 1
        });
    };

    const handleSaveQuestion = async () => {
        if (!form.vraag_teks.trim()) {
            toast.error('Vraag teks is verpligtend');
            return;
        }

        try {
            setSaving(true);

            const questionData = {
                les_id: les.id,
                vraag_teks: form.vraag_teks,
                vraag_tipe: form.vraag_tipe,
                opsies: form.vraag_tipe === 'mcq' ? { choices: form.opsies.filter(o => o.trim()) } : {},
                korrekte_antwoord: form.korrekte_antwoord,
                punte: form.punte,
                updated_at: new Date().toISOString()
            };

            if (editingId) {
                const { error } = await supabase
                    .from('lms_questions')
                    .update(questionData)
                    .eq('id', editingId);

                if (error) throw error;
                toast.success('Vraag opgedateer');
            } else {
                const { error } = await supabase
                    .from('lms_questions')
                    .insert([{ ...questionData, volgorde: questions.length }]);

                if (error) throw error;
                toast.success('Vraag bygevoeg');
            }

            await fetchQuestions();
            handleCancelEdit();
            if (onSave) onSave();
        } catch (error) {
            console.error('Error saving question:', error);
            toast.error('Kon nie vraag stoor nie');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Is jy seker?')) return;
        try {
            const { error } = await supabase
                .from('lms_questions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Vraag verwyder');
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (error) {
            toast.error('Kon nie verwyder nie');
        }
    };

    // Render helpers
    const renderForm = () => (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 mb-6">
            <h3 className="font-semibold text-[#002855]">
                {editingId ? 'Wysig Vraag' : 'Nuwe Vraag'}
            </h3>

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vraag Teks</label>
                <Textarea
                    value={form.vraag_teks}
                    onChange={e => setForm({ ...form, vraag_teks: e.target.value })}
                    placeholder="Tik jou vraag hier..."
                    className="bg-white"
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipe</label>
                    <select
                        value={form.vraag_tipe}
                        onChange={e => setForm({ ...form, vraag_tipe: e.target.value as any })}
                        className="w-full p-2 rounded border bg-white"
                    >
                        <option value="mcq">Meervoudige Keuse</option>
                        <option value="true_false">Waar / Onwaar</option>
                        <option value="text">Lang Teks (Handmerk)</option>
                    </select>
                </div>
                <div className="w-24">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Punte</label>
                    <Input
                        type="number"
                        min="1"
                        value={form.punte}
                        onChange={e => setForm({ ...form, punte: parseInt(e.target.value) || 1 })}
                        className="bg-white"
                    />
                </div>
            </div>

            {form.vraag_tipe === 'mcq' && (
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">Opsies (Merk die korrekte een)</label>
                    {form.opsies.map((opsie, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="correct_answer"
                                checked={form.korrekte_antwoord === idx.toString()}
                                onChange={() => setForm({ ...form, korrekte_antwoord: idx.toString() })}
                                className="w-4 h-4 text-[#D4A84B]"
                            />
                            <Input
                                value={opsie}
                                onChange={e => {
                                    const newOpsies = [...form.opsies];
                                    newOpsies[idx] = e.target.value;
                                    setForm({ ...form, opsies: newOpsies });
                                }}
                                placeholder={`Opsie ${idx + 1}`}
                                className="flex-1 bg-white"
                            />
                        </div>
                    ))}
                </div>
            )}

            {form.vraag_tipe === 'true_false' && (
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">Korrekte Antwoord</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="tf_answer"
                                checked={form.korrekte_antwoord === 'true'}
                                onChange={() => setForm({ ...form, korrekte_antwoord: 'true' })}
                            />
                            Waar
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="tf_answer"
                                checked={form.korrekte_antwoord === 'false'}
                                onChange={() => setForm({ ...form, korrekte_antwoord: 'false' })}
                            />
                            Onwaar
                        </label>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    Kanselleer
                </Button>
                <Button size="sm" onClick={handleSaveQuestion} disabled={saving} className="bg-[#D4A84B] text-[#002855]">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Stoor Vraag
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Vrae ({questions.length})</h3>
                {!editingId && (
                    <Button size="sm" variant="outline" onClick={() => resetForm()} className="text-[#D4A84B]">
                        <Plus className="w-4 h-4 mr-2" /> Nuwe Vraag
                    </Button>
                )}
            </div>

            {/* Logic to show form: if editingId is set OR (no questions AND not editing) OR explictly creating new? 
          Let's simplify: Always show form at bottom to add new, or replace item if editing.
          Wait, better UI: "Add Question" button expands the form.
      */}

            {/* List Questions */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-300" /></div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Nog geen vrae nie
                    </div>
                ) : (
                    questions.map((q, idx) => (
                        editingId === q.id ? (
                            renderForm()
                        ) : (
                            <div key={q.id} className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-xs">{idx + 1}</Badge>
                                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                                                {q.vraag_tipe === 'mcq' ? 'Meervoudige Keuse' : q.vraag_tipe === 'true_false' ? 'Waar/Onwaar' : 'Teks'}
                                            </Badge>
                                            <span className="text-xs text-gray-500 font-medium">({q.punte} punte)</span>
                                        </div>
                                        <p className="font-medium text-gray-800">{q.vraag_teks}</p>

                                        {q.vraag_tipe === 'mcq' && (
                                            <div className="mt-2 pl-4 text-sm text-gray-600 space-y-1">
                                                {((q.opsies as any)?.choices || (Array.isArray(q.opsies) ? q.opsies : [])).map((opt: string, i: number) => (
                                                    <div key={i} className={`flex items-center gap-2 ${i.toString() === q.korrekte_antwoord ? 'text-green-600 font-medium' : ''}`}>
                                                        <div className={`w-2 h-2 rounded-full ${i.toString() === q.korrekte_antwoord ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleEdit(q)}>
                                            <ArrowUp className="w-4 h-4" /> {/* Just icon reuse for edit */}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDelete(q.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    ))
                )}
            </div>

            {/* Show form at bottom for new question if not editing existing */}
            {!editingId && renderForm()}
        </div>
    );
};

export default KvvraagSkepper;
