import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useNHKA } from '@/contexts/NHKAContext';
import {
    Music,
    Upload,
    Play,
    Pause,
    Loader2,
    Trash2,
    Send,
    CheckCircle,
    AlertCircle,
    Globe,
    FileText,
    Volume2,
    RotateCcw,
    Sparkles,
    Pencil,
    X,
    FileAudio,
    Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface MusiekLied {
    id: string;
    titel: string;
    lirieke?: string;
    bladmusiek_pad?: string;
    oudio_url?: string;
    styl_prompt?: string;
    tempo?: number;
    status: string;
    ai_diens?: string;
    fout_boodskap?: string;
    verwysing_oudio_pad?: string;
    created_at: string;
    updated_at: string;
}

const STYL_OPSIES = [
    { value: 'Himne, koor, orrel, eerbiedig', label: 'Klassieke Himne (Orrel & Koor)' },
    { value: 'Gospel, lewendig, koor, klavier', label: 'Gospel (Lewendig)' },
    { value: 'Akoestiese kitaar, sagtemusiek, meditasie', label: 'Akoesties (Rustig)' },
    { value: 'Koor, a cappella, harmonie', label: 'A Cappella Koor' },
    { value: 'Moderne aanbidding, band, kontemporêr', label: 'Moderne Aanbidding' },
    { value: 'Kerkorrel solo, klassiek, statig', label: 'Orrelmusiek (Solo)' },
    { value: 'Kinderlied, vrolik, eenvoudig', label: 'Kinderlied (Vrolik)' },
];

const MusiekAdmin: React.FC = () => {
    const { currentUser } = useNHKA();
    const [liedere, setLiedere] = useState<MusiekLied[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Nuwe lied form
    const [toonVorm, setToonVorm] = useState(false);
    const [redigeerId, setRedigeerId] = useState<string | null>(null);
    const [titel, setTitel] = useState('');
    const [lirieke, setLirieke] = useState('');
    const [stylPrompt, setStylPrompt] = useState(STYL_OPSIES[0].value);
    const [eieStyl, setEieStyl] = useState('');
    const [tempo, setTempo] = useState(80);
    const [aiDiens, setAiDiens] = useState<'suno' | 'replicate'>('replicate');
    const [modus, setModus] = useState<'ai' | 'handmatig'>('ai');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);

    const referenceAudioInputRef = useRef<HTMLInputElement>(null);
    const [referenceAudioFile, setReferenceAudioFile] = useState<File | null>(null);

    // Handmatige MP3 oplaai
    const mp3InputRef = useRef<HTMLInputElement>(null);
    const [mp3File, setMp3File] = useState<File | null>(null);

    // Oudio speler
    const [speelId, setSpeelId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Polling
    const pollingRef = useRef<Record<string, number>>({});

    useEffect(() => {
        haalLiedere();
        return () => {
            Object.values(pollingRef.current).forEach(clearInterval);
        };
    }, []);

    const haalLiedere = async () => {
        try {
            const { data, error } = await supabase
                .from('musiek_liedere')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setLiedere(data || []);

            // Begin polling vir liedere wat nog genereer word
            (data || []).forEach((l: MusiekLied) => {
                if (l.status === 'genereer') beginPolling(l.id);
            });
        } catch (err: any) {
            toast.error('Kon nie liedere laai nie');
        } finally {
            setLoading(false);
        }
    };

    const beginPolling = (liedId: string) => {
        if (pollingRef.current[liedId]) return;
        pollingRef.current[liedId] = window.setInterval(async () => {
            try {
                const { data, error } = await supabase.functions.invoke('musiek-ai', {
                    body: { type: 'kyk_status', data: { lied_id: liedId } },
                });
                if (error) return;
                if (data?.status === 'gereed' || data?.status === 'fout' || data?.status === 'gepubliseer') {
                    clearInterval(pollingRef.current[liedId]);
                    delete pollingRef.current[liedId];
                    haalLiedere();
                    if (data.status === 'gereed') toast.success('Musiek is gereed!');
                    if (data.status === 'fout') toast.error(`Generasie het gefaal: ${data.fout || ''}`);
                }
            } catch { /* ignoreer */ }
        }, 8000);
    };

    const sanitizeFileName = (name: string) => {
        // Remove accents/diacritics
        const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // Replace non-alphanumeric (except dots and dashes) with underscores
        return normalized.replace(/[^a-zA-Z0-9.-]/g, '_');
    };

    const handleLêerKies = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            if (!titel) {
                setTitel(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
            }
        }
    };

    const handleReferenceAudioKies = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setReferenceAudioFile(f);
        }
    };

    const handleMp3Kies = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setMp3File(f);
            if (!titel) {
                setTitel(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
            }
        }
    };

    const handleSkep = async () => {
        if (!titel.trim()) {
            toast.error('Titel is verplig');
            return;
        }

        // Handmatige modus: MP3 is verplig
        if (modus === 'handmatig') {
            if (!mp3File) {
                toast.error('Kies asseblief \'n MP3-lêer om op te laai');
                return;
            }
        } else {
            // AI-modus: Lirieke is verplig
            if (!lirieke.trim()) {
                toast.error('Lirieke is verplig');
                return;
            }
        }

        setUploading(true);
        try {
            if (modus === 'handmatig') {
                // === HANDMATIGE MP3 OPLAAI ===
                // Skep rekord in databasis met status 'gereed'
                const { data: nuwe, error: dbErr } = await supabase
                    .from('musiek_liedere')
                    .insert({
                        titel: titel.trim(),
                        lirieke: lirieke.trim() || null,
                        styl_prompt: null,
                        tempo: null,
                        status: 'gereed',
                        ai_diens: 'handmatig',
                        opgelaai_deur: currentUser?.id,
                    })
                    .select('id')
                    .single();
                if (dbErr) throw dbErr;

                if (nuwe?.id && mp3File) {
                    // Laai MP3 op na Storage
                    const safeName = sanitizeFileName(mp3File.name);
                    const storagePath = `${nuwe.id}/oudio-${safeName}`;
                    const { error: uploadErr } = await supabase.storage
                        .from('musiek-liedere')
                        .upload(storagePath, mp3File, { upsert: true });
                    if (uploadErr) throw uploadErr;

                    // Kry publieke URL
                    const { data: pubUrl } = supabase.storage
                        .from('musiek-liedere')
                        .getPublicUrl(storagePath);

                    // Opdateer rekord met oudio pad en URL
                    const { error: updateErr } = await supabase
                        .from('musiek_liedere')
                        .update({
                            oudio_pad: storagePath,
                            oudio_url: pubUrl.publicUrl,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', nuwe.id);
                    if (updateErr) throw updateErr;

                    // Laai ook bladmusiek op (opsioneel)
                    if (file) {
                        const safeSheetName = sanitizeFileName(file.name);
                        const sheetPath = `${nuwe.id}/bladmusiek-${safeSheetName}`;
                        await supabase.storage.from('musiek-liedere').upload(sheetPath, file, { upsert: true });
                        await supabase.from('musiek_liedere').update({ bladmusiek_pad: sheetPath }).eq('id', nuwe.id);
                    }
                }

                toast.success('MP3 suksesvol opgelaai! Jy kan dit nou publiseer.');
            } else {
                // === AI GENERASIE (bestaande logika) ===
                const finalStyl = eieStyl.trim() || stylPrompt;

                // Skep rekord in databasis
                const { data: nuwe, error: dbErr } = await supabase
                    .from('musiek_liedere')
                    .insert({
                        titel: titel.trim(),
                        lirieke: lirieke.trim(),
                        styl_prompt: finalStyl,
                        tempo,
                        status: 'konsep',
                        opgelaai_deur: currentUser?.id,
                    })
                    .select('id')
                    .single();
                if (dbErr) throw dbErr;

                // Laai bladmusiek-lêer op (opsioneel)
                if (file && nuwe?.id) {
                    const safeName = sanitizeFileName(file.name);
                    const storagePath = `${nuwe.id}/bladmusiek-${safeName}`;
                    await supabase.storage.from('musiek-liedere').upload(storagePath, file, { upsert: true });
                    await supabase.from('musiek_liedere').update({ bladmusiek_pad: storagePath }).eq('id', nuwe.id);
                }

                // Laai verwysings-oudio op (indien gekies)
                let verwysingOudioPadRemote = null;
                if (referenceAudioFile && nuwe?.id) {
                    const safeName = sanitizeFileName(referenceAudioFile.name);
                    const storagePath = `${nuwe.id}/verwysing-${safeName}`;
                    await supabase.storage.from('musiek-liedere').upload(storagePath, referenceAudioFile, { upsert: true });
                    await supabase.from('musiek_liedere').update({ verwysing_oudio_pad: storagePath }).eq('id', nuwe.id);
                    verwysingOudioPadRemote = storagePath;
                }

                // Stuur na AI vir generasie
                if (nuwe?.id) {
                    const { error: aiErr } = await supabase.functions.invoke('musiek-ai', {
                        body: {
                            type: aiDiens === 'suno' ? 'genereer_suno' : 'genereer_replicate',
                            data: {
                                lied_id: nuwe.id,
                                lirieke: lirieke.trim(),
                                styl_prompt: finalStyl,
                                titel: titel.trim(),
                                tempo,
                                verwysing_oudio_pad: verwysingOudioPadRemote,
                            },
                        },
                    });
                    if (aiErr) throw aiErr;
                    beginPolling(nuwe.id);
                    toast.success('Musiek word gegenereer... Dit kan 1-3 minute neem.');
                }
            }

            // Herstel vorm
            resetVorm();
            await haalLiedere();
        } catch (err: any) {
            toast.error(err.message || 'Kon nie lied skep nie');
        } finally {
            setUploading(false);
        }
    };

    const resetVorm = () => {
        setTitel('');
        setLirieke('');
        setEieStyl('');
        setStylPrompt(STYL_OPSIES[0].value);
        setTempo(80);
        setFile(null);
        setReferenceAudioFile(null);
        setMp3File(null);
        setModus('ai');
        setToonVorm(false);
        setRedigeerId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (referenceAudioInputRef.current) referenceAudioInputRef.current.value = '';
        if (mp3InputRef.current) mp3InputRef.current.value = '';
    };

    const handleRedigeer = (lied: MusiekLied) => {
        setRedigeerId(lied.id);
        setTitel(lied.titel);
        setLirieke(lied.lirieke || '');

        // Stel modus gebaseer op ai_diens
        if (lied.ai_diens === 'handmatig') {
            setModus('handmatig');
        } else {
            setModus('ai');
            // Check if style is in options or custom
            const knownStyle = STYL_OPSIES.find(s => s.value === lied.styl_prompt);
            if (knownStyle) {
                setStylPrompt(lied.styl_prompt || STYL_OPSIES[0].value);
                setEieStyl('');
            } else {
                setStylPrompt(STYL_OPSIES[0].value); // Default
                setEieStyl(lied.styl_prompt || '');
            }
            setTempo(lied.tempo || 80);
            setAiDiens((lied.ai_diens as 'suno' | 'replicate') || 'suno');
        }

        setToonVorm(true);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpdateer = async () => {
        if (!redigeerId) return;
        if (!titel.trim()) { toast.error('Titel is verplig'); return; }
        if (modus === 'ai' && !lirieke.trim()) { toast.error('Lirieke is verplig'); return; }

        setUploading(true);
        try {
            // Update DB
            const updates: any = {
                titel: titel.trim(),
                lirieke: lirieke.trim() || null,
                updated_at: new Date().toISOString()
            };

            if (modus === 'ai') {
                const finalStyl = eieStyl.trim() || stylPrompt;
                updates.styl_prompt = finalStyl;
                updates.tempo = tempo;
                updates.ai_diens = aiDiens;
            }

            // Handle new bladmusiek files if uploaded
            if (file) {
                const safeName = sanitizeFileName(file.name);
                const storagePath = `${redigeerId}/bladmusiek-${safeName}`;
                await supabase.storage.from('musiek-liedere').upload(storagePath, file, { upsert: true });
                updates.bladmusiek_pad = storagePath;
            }

            // Handle new MP3 file for manual uploads
            if (mp3File && modus === 'handmatig') {
                const safeName = sanitizeFileName(mp3File.name);
                const storagePath = `${redigeerId}/oudio-${safeName}`;
                const { error: uploadErr } = await supabase.storage
                    .from('musiek-liedere')
                    .upload(storagePath, mp3File, { upsert: true });
                if (uploadErr) throw uploadErr;

                const { data: pubUrl } = supabase.storage
                    .from('musiek-liedere')
                    .getPublicUrl(storagePath);

                updates.oudio_pad = storagePath;
                updates.oudio_url = pubUrl.publicUrl;
            }

            if (referenceAudioFile && modus === 'ai') {
                const safeName = sanitizeFileName(referenceAudioFile.name);
                const storagePath = `${redigeerId}/verwysing-${safeName}`;
                await supabase.storage.from('musiek-liedere').upload(storagePath, referenceAudioFile, { upsert: true });
                updates.verwysing_oudio_pad = storagePath;
            }

            const { error } = await supabase
                .from('musiek_liedere')
                .update(updates)
                .eq('id', redigeerId);

            if (error) throw error;

            toast.success(modus === 'handmatig'
                ? 'Lied opgedateer!'
                : 'Lied opgedateer! Klik "Hergenereer" as jy nuwe musiek wil maak.');
            resetVorm();
            haalLiedere();

        } catch (err: any) {
            toast.error('Kon nie opdateer nie: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handlePubliseer = async (id: string) => {
        const { error } = await supabase
            .from('musiek_liedere')
            .update({ status: 'gepubliseer', updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) toast.error('Kon nie publiseer nie');
        else {
            toast.success('Lied gepubliseer! Alle gebruikers kan dit nou hoor.');
            haalLiedere();
        }
    };

    const handleOnpubliseer = async (id: string) => {
        const { error } = await supabase
            .from('musiek_liedere')
            .update({ status: 'gereed', updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) toast.error('Kon nie onpubliseer nie');
        else {
            toast.success('Lied is nou onsigbaar vir gebruikers.');
            haalLiedere();
        }
    };

    const handleHergenereer = async (lied: MusiekLied) => {
        try {
            const { error } = await supabase.functions.invoke('musiek-ai', {
                body: {
                    type: (lied.ai_diens || aiDiens) === 'suno' ? 'genereer_suno' : 'genereer_replicate',
                    data: {
                        lied_id: lied.id,
                        lirieke: lied.lirieke || '',
                        styl_prompt: lied.styl_prompt || STYL_OPSIES[0].value,
                        titel: lied.titel,
                        tempo: lied.tempo || 80,
                        verwysing_oudio_pad: lied.verwysing_oudio_pad,
                    },
                },
            });
            if (error) throw error;
            beginPolling(lied.id);
            toast.success('Lied word weer gegenereer...');
            haalLiedere();
        } catch (err: any) {
            toast.error(err.message || 'Hergenerering het gefaal');
        }
    };

    const handleSkrap = async (id: string) => {
        if (!window.confirm('Is jy seker jy wil hierdie lied skrap?')) return;
        const { error } = await supabase.from('musiek_liedere').delete().eq('id', id);
        if (error) toast.error('Kon nie skrap nie');
        else {
            toast.success('Lied geskrap');
            if (speelId === id) {
                audioRef.current?.pause();
                setSpeelId(null);
            }
            haalLiedere();
        }
    };

    const toggleSpeel = (lied: MusiekLied) => {
        if (!lied.oudio_url) return;
        if (speelId === lied.id) {
            setSpeelId(null);
        } else {
            setSpeelId(lied.id);
        }
    };

    const getStatusKleur = (status: string) => {
        switch (status) {
            case 'konsep': return 'bg-gray-100 text-gray-700';
            case 'genereer': return 'bg-amber-100 text-amber-700';
            case 'gereed': return 'bg-blue-100 text-blue-700';
            case 'gepubliseer': return 'bg-green-100 text-green-700';
            case 'fout': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'konsep': return 'Konsep';
            case 'genereer': return 'Word gegenereer...';
            case 'gereed': return 'Gereed';
            case 'gepubliseer': return 'Gepubliseer';
            case 'fout': return 'Fout';
            default: return status;
        }
    };

    const isHandmatig = (lied: MusiekLied) => lied.ai_diens === 'handmatig';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-[#002855] flex items-center gap-2">
                        <Music className="w-6 h-6" />
                        Musiek Bestuur
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Laai kerkliedere op, genereer musiek met AI, en publiseer dit vir alle gebruikers.
                    </p>
                </div>
                <Button
                    onClick={() => { resetVorm(); setToonVorm(!toonVorm); }}
                    className="bg-[#002855] hover:bg-[#001a35]"
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Nuwe Lied
                </Button>
            </div>



            {/* Nuwe Lied Vorm */}
            {toonVorm && (
                <Card className="border-2 border-[#002855]/20">
                    <CardHeader>
                        <CardTitle className="text-[#002855]">{redigeerId ? 'Lied Redigeer' : 'Nuwe Lied Skep'}</CardTitle>
                        <CardDescription>
                            {redigeerId
                                ? 'Pas die lied se inligting aan.'
                                : 'Kies of jy musiek met AI wil genereer of \u2019n bestaande MP3 wil oplaai.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* === Modus Skakelaar === */}
                        {!redigeerId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hoe wil jy die lied byvoeg?
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModus('ai')}
                                        className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${modus === 'ai'
                                            ? 'border-[#002855] bg-[#002855]/5 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Wand2 className="w-4 h-4 text-[#002855]" />
                                            <p className="font-semibold text-sm text-[#002855]">AI Genereer</p>
                                        </div>
                                        <p className="text-xs text-gray-500">Voer lirieke in en laat AI musiek skep</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModus('handmatig')}
                                        className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${modus === 'handmatig'
                                            ? 'border-emerald-600 bg-emerald-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <FileAudio className="w-4 h-4 text-emerald-600" />
                                            <p className="font-semibold text-sm text-emerald-700">Eie MP3 Oplaai</p>
                                        </div>
                                        <p className="text-xs text-gray-500">Laai 'n bestaande MP3-lêer direk op</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Titel */}
                        <div>
                            <label htmlFor="musiek-titel" className="block text-sm font-medium text-gray-700 mb-1">
                                Titel *
                            </label>
                            <input
                                id="musiek-titel"
                                type="text"
                                value={titel}
                                onChange={(e) => setTitel(e.target.value)}
                                placeholder="bv. Psalm 23 - Die Here is my Herder"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#002855] focus:border-[#002855] outline-none"
                            />
                        </div>

                        {/* === HANDMATIGE MODUS: MP3 Oplaai === */}
                        {modus === 'handmatig' && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <label className="block text-sm font-medium text-emerald-900 mb-1">
                                    MP3-Lêer *
                                </label>
                                <p className="text-xs text-emerald-700 mb-3">
                                    Kies die MP3-lêer wat jy wil oplaai. Dit sal direk beskikbaar wees om te publiseer.
                                </p>
                                <input
                                    ref={mp3InputRef}
                                    type="file"
                                    accept=".mp3,audio/mpeg"
                                    onChange={handleMp3Kies}
                                    className="hidden"
                                />
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => mp3InputRef.current?.click()}
                                        className="text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Kies MP3
                                    </Button>
                                    {mp3File && (
                                        <span className="text-sm text-emerald-800 flex items-center gap-1">
                                            <FileAudio className="w-4 h-4" />
                                            {mp3File.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bladmusiek Oplaai (Opsioneel - albei modusse) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bladmusiek (Opsioneel — PPT, PPTX of PDF)
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".ppt,.pptx,.pdf"
                                onChange={handleLêerKies}
                                className="hidden"
                            />
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-[#002855] border-[#002855]/30"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Kies Lêer
                                </Button>
                                {file && (
                                    <span className="text-sm text-gray-600 flex items-center gap-1">
                                        <FileText className="w-4 h-4" />
                                        {file.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* === AI MODUS: Verwysing Oudio === */}
                        {modus === 'ai' && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <label className="block text-sm font-medium text-amber-900 mb-1">
                                    Melodie Gids (Opsioneel — MP3, WAV, M4A)
                                </label>
                                <p className="text-xs text-amber-700 mb-3">
                                    Laai 'n opname op van hoe die lied moet klink (bv. iemand wat sing of speel).
                                    Die AI sal hierdie melodie probeer behou maar die styl verander.
                                </p>
                                <input
                                    ref={referenceAudioInputRef}
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleReferenceAudioKies}
                                    className="hidden"
                                />
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => referenceAudioInputRef.current?.click()}
                                        className="text-amber-900 border-amber-300 hover:bg-amber-100"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Kies Oudio
                                    </Button>
                                    {referenceAudioFile && (
                                        <span className="text-sm text-amber-800 flex items-center gap-1">
                                            <Volume2 className="w-4 h-4" />
                                            {referenceAudioFile.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Lirieke */}
                        <div>
                            <label htmlFor="musiek-lirieke" className="block text-sm font-medium text-gray-700 mb-1">
                                Lirieke {modus === 'ai' ? '*' : '(Opsioneel)'}
                            </label>
                            <textarea
                                id="musiek-lirieke"
                                value={lirieke}
                                onChange={(e) => setLirieke(e.target.value)}
                                placeholder={modus === 'handmatig'
                                    ? 'Voeg opsioneel lirieke by sodat gebruikers dit kan sien terwyl hulle luister...'
                                    : "Die Here is my Herder,\nNiks sal my ontbreek nie.\nHy laat my neerle in groen weivelde;\nHy lei my na waters waar dit stil is."}
                                rows={modus === 'handmatig' ? 5 : 8}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#002855] focus:border-[#002855] outline-none resize-y font-mono text-sm"
                            />
                        </div>

                        {/* === AI MODUS: Styl, Tempo, AI Diens === */}
                        {modus === 'ai' && (
                            <>
                                {/* Styl */}
                                <div>
                                    <label htmlFor="musiek-styl" className="block text-sm font-medium text-gray-700 mb-1">
                                        Musiekstyl
                                    </label>
                                    <select
                                        id="musiek-styl"
                                        value={stylPrompt}
                                        onChange={(e) => setStylPrompt(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#002855] focus:border-[#002855] outline-none"
                                    >
                                        {STYL_OPSIES.map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            value={eieStyl}
                                            onChange={(e) => setEieStyl(e.target.value)}
                                            placeholder="Of tik jou eie styl-beskrywing hier (bv. 'Statige orrelmusiek, koor, 4-stemmig')"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#002855] focus:border-[#002855] outline-none text-sm"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">As jy hier iets invul, word die keuse bo geïgnoreer.</p>
                                    </div>
                                </div>

                                {/* Tempo */}
                                <div>
                                    <label htmlFor="musiek-tempo" className="block text-sm font-medium text-gray-700 mb-1">
                                        Tempo: {tempo} BPM
                                    </label>
                                    <input
                                        id="musiek-tempo"
                                        type="range"
                                        min={40}
                                        max={180}
                                        value={tempo}
                                        onChange={(e) => setTempo(parseInt(e.target.value))}
                                        className="w-full accent-[#002855]"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Stadig (40)</span>
                                        <span>Matig (90)</span>
                                        <span>Vinnig (180)</span>
                                    </div>
                                </div>

                                {/* AI Diens */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        AI Diens
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setAiDiens('suno')}
                                            className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${aiDiens === 'suno'
                                                ? 'border-[#002855] bg-[#002855]/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className="font-medium text-sm">Suno</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Beste vir liedere met lirieke</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAiDiens('replicate')}
                                            className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${aiDiens === 'replicate'
                                                ? 'border-[#002855] bg-[#002855]/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className="font-medium text-sm">MusicGen (Replicate)</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Beter melodie-behoud</p>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Aksie-knoppies */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={redigeerId ? handleOpdateer : handleSkep}
                                disabled={uploading || !titel.trim() || (modus === 'ai' && !lirieke.trim()) || (modus === 'handmatig' && !mp3File && !redigeerId)}
                                className={`flex-1 ${modus === 'handmatig' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#002855] hover:bg-[#001a35]'}`}
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : modus === 'handmatig' ? (
                                    <Upload className="w-4 h-4 mr-2" />
                                ) : (
                                    <Sparkles className="w-4 h-4 mr-2" />
                                )}
                                {redigeerId
                                    ? 'Stoor Veranderinge'
                                    : modus === 'handmatig'
                                        ? 'Laai MP3 Op'
                                        : 'Genereer Musiek'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={resetVorm}
                            >
                                Kanselleer
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Liedere Lys */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5" />
                        Alle Liedere
                    </CardTitle>
                    <CardDescription>{liedere.length} liedere</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Laai liedere...
                        </div>
                    ) : liedere.length === 0 ? (
                        <div className="text-center py-12">
                            <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Nog geen liedere geskep nie.</p>
                            <p className="text-sm text-gray-400 mt-1">Klik "Nuwe Lied" om te begin.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {liedere.map((lied) => (
                                <div
                                    key={lied.id}
                                    className={`p-4 rounded-xl border transition-all ${speelId === lied.id
                                        ? 'border-[#002855] bg-[#002855]/5 shadow-md'
                                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {/* Speel-knoppie */}
                                            <button
                                                onClick={() => toggleSpeel(lied)}
                                                disabled={!lied.oudio_url}
                                                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${lied.oudio_url
                                                    ? speelId === lied.id
                                                        ? 'bg-[#002855] text-white shadow-lg'
                                                        : 'bg-[#002855]/10 text-[#002855] hover:bg-[#002855]/20'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {lied.status === 'genereer' ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : speelId === lied.id ? (
                                                    <Pause className="w-4 h-4" />
                                                ) : (
                                                    <Play className="w-4 h-4 ml-0.5" />
                                                )}
                                            </button>

                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-semibold text-gray-900 truncate">{lied.titel}</h4>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusKleur(lied.status)}`}>
                                                        {getStatusLabel(lied.status)}
                                                    </span>
                                                    {lied.ai_diens && (
                                                        <span className={`text-xs ${lied.ai_diens === 'handmatig' ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                                                            {lied.ai_diens === 'suno' ? 'Suno' : lied.ai_diens === 'handmatig' ? '📁 Handmatig' : 'MusicGen'}
                                                        </span>
                                                    )}
                                                    {lied.tempo && (
                                                        <span className="text-xs text-gray-400">{lied.tempo} BPM</span>
                                                    )}
                                                </div>
                                                {lied.styl_prompt && (
                                                    <p className="text-xs text-gray-500 mt-1 truncate">{lied.styl_prompt}</p>
                                                )}
                                                {lied.fout_boodskap && (
                                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {lied.fout_boodskap}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Aksie-knoppies */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {lied.status === 'gereed' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePubliseer(lied.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-xs"
                                                    title="Publiseer vir alle gebruikers"
                                                >
                                                    <Globe className="w-3.5 h-3.5 mr-1" />
                                                    Publiseer
                                                </Button>
                                            )}
                                            {lied.status === 'gepubliseer' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOnpubliseer(lied.id)}
                                                    className="text-amber-700 border-amber-200 text-xs"
                                                    title="Onpubliseer"
                                                >
                                                    Onpubliseer
                                                </Button>
                                            )}
                                            {!isHandmatig(lied) && (lied.status === 'gereed' || lied.status === 'fout' || lied.status === 'gepubliseer') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleHergenereer(lied)}
                                                    title="Hergenereer musiek"
                                                    className="text-[#002855]"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRedigeer(lied)}
                                                className="text-[#002855] hover:text-[#001a35]"
                                                title="Redigeer lied"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleSkrap(lied.id)}
                                                className="text-red-500 hover:text-red-600"
                                                title="Skrap lied"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>


                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Fixed Bottom Player */}
            {speelId && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-[#002855]/10 p-3 shadow-2xl z-50 lg:ml-72 animate-in slide-in-from-bottom-5">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <div className="hidden sm:flex flex-shrink-0 w-10 h-10 bg-[#002855]/10 rounded-lg items-center justify-center text-[#002855]">
                            <Music className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[#002855] truncate text-sm">
                                {liedere.find(l => l.id === speelId)?.titel}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                                {liedere.find(l => l.id === speelId)?.styl_prompt}
                            </p>
                        </div>
                        <audio
                            ref={audioRef}
                            src={liedere.find(l => l.id === speelId)?.oudio_url}
                            controls
                            autoPlay
                            className="h-8 w-full max-w-md accent-[#002855]"
                            onEnded={() => setSpeelId(null)}
                        />
                        <button
                            onClick={() => {
                                audioRef.current?.pause();
                                setSpeelId(null);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400 hover:text-red-500" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MusiekAdmin;
