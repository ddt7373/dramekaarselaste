import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Music,
    Play,
    Pause,
    Search,
    Loader2,
    ChevronDown,
    ChevronUp,
    Volume2,
    X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface GepubliseerdeLied {
    id: string;
    titel: string;
    lirieke?: string;
    oudio_url?: string;
    styl_prompt?: string;
    tempo?: number;
    created_at: string;
}

const Musiek: React.FC = () => {
    const [liedere, setLiedere] = useState<GepubliseerdeLied[]>([]);
    const [loading, setLoading] = useState(true);
    const [soek, setSoek] = useState('');
    const [speelId, setSpeelId] = useState<string | null>(null);
    const [toonLirieke, setToonLirieke] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const haal = async () => {
            try {
                const { data, error } = await supabase
                    .from('musiek_liedere')
                    .select('id, titel, lirieke, oudio_url, styl_prompt, tempo, created_at')
                    .eq('status', 'gepubliseer')
                    .order('titel', { ascending: true });
                if (error) throw error;
                setLiedere(data || []);
            } catch {
                // stil faal
            } finally {
                setLoading(false);
            }
        };
        haal();
    }, []);

    const gefiltreer = soek.trim()
        ? liedere.filter(
            (l) =>
                l.titel.toLowerCase().includes(soek.toLowerCase()) ||
                l.lirieke?.toLowerCase().includes(soek.toLowerCase())
        )
        : liedere;

    const toggleSpeel = (lied: GepubliseerdeLied) => {
        if (!lied.oudio_url) return;
        if (speelId === lied.id) {
            audioRef.current?.pause();
            setSpeelId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = lied.oudio_url;
                audioRef.current.play();
            }
            setSpeelId(lied.id);
        }
    };

    const speelVolgende = () => {
        if (!speelId) return;
        const idx = gefiltreer.findIndex((l) => l.id === speelId);
        if (idx < gefiltreer.length - 1) {
            const volgende = gefiltreer[idx + 1];
            if (volgende.oudio_url && audioRef.current) {
                audioRef.current.src = volgende.oudio_url;
                audioRef.current.play();
                setSpeelId(volgende.id);
            }
        }
    };

    const speelVorige = () => {
        if (!speelId) return;
        const idx = gefiltreer.findIndex((l) => l.id === speelId);
        if (idx > 0) {
            const vorige = gefiltreer[idx - 1];
            if (vorige.oudio_url && audioRef.current) {
                audioRef.current.src = vorige.oudio_url;
                audioRef.current.play();
                setSpeelId(vorige.id);
            }
        }
    };

    const huidige = speelId ? liedere.find((l) => l.id === speelId) : null;

    return (
        <div className="space-y-6">
            {/* Kop */}
            <div>
                <h2 className="text-xl font-semibold text-[#002855] flex items-center gap-2">
                    <Music className="w-6 h-6" />
                    Musiek
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Luister na AI-gegenereerde kerkliedere.
                </p>
            </div>

            {/* Soekbalk */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={soek}
                    onChange={(e) => setSoek(e.target.value)}
                    placeholder="Soek liedere op titel of lirieke..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[#002855]/20 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#002855] focus:border-[#002855] outline-none"
                />
            </div>



            {/* Liedere Lys */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Laai liedere...
                </div>
            ) : gefiltreer.length === 0 ? (
                <div className="text-center py-16">
                    <Music className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                        {soek.trim() ? 'Geen liedere gevind vir jou soektog nie.' : 'Nog geen liedere gepubliseer nie.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {gefiltreer.map((lied, idx) => (
                        <Card
                            key={lied.id}
                            className={`overflow-hidden transition-all duration-200 ${speelId === lied.id
                                ? 'ring-2 ring-[#002855] shadow-lg'
                                : 'hover:shadow-md'
                                }`}
                        >
                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    {/* Nommer */}
                                    <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0 font-mono">
                                        {idx + 1}
                                    </span>

                                    {/* Speel-knoppie */}
                                    <button
                                        onClick={() => toggleSpeel(lied)}
                                        disabled={!lied.oudio_url}
                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${lied.oudio_url
                                            ? speelId === lied.id
                                                ? 'bg-[#002855] text-white shadow-lg scale-110'
                                                : 'bg-[#002855]/10 text-[#002855] hover:bg-[#002855]/20 hover:scale-105'
                                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                            }`}
                                    >
                                        {speelId === lied.id ? (
                                            <Pause className="w-4 h-4" />
                                        ) : (
                                            <Play className="w-4 h-4 ml-0.5" />
                                        )}
                                    </button>

                                    {/* Titel & Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm sm:text-base font-semibold whitespace-normal line-clamp-2 ${speelId === lied.id ? 'text-[#002855]' : 'text-gray-900'}`}>
                                            {lied.titel}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {lied.styl_prompt && (
                                                <span className="text-xs text-gray-400 truncate">{lied.styl_prompt}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lirieke toggle */}
                                    {lied.lirieke && (
                                        <button
                                            onClick={() => setToonLirieke(toonLirieke === lied.id ? null : lied.id)}
                                            className="flex-shrink-0 text-xs text-[#002855] hover:text-[#001a35] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#002855]/5 transition-colors"
                                        >
                                            {toonLirieke === lied.id ? (
                                                <>
                                                    <ChevronUp className="w-3 h-3" />
                                                    Verberg
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-3 h-3" />
                                                    Lirieke
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>



                                {/* Lirieke */}
                                {toonLirieke === lied.id && lied.lirieke && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-4">
                                            {lied.lirieke}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {huidige && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t-2 border-[#002855]/20 shadow-2xl z-40 px-4 py-3 lg:ml-72 animate-in slide-in-from-bottom-5">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <div className="hidden sm:flex w-10 h-10 rounded-lg bg-gradient-to-br from-[#002855] to-[#D4A84B] items-center justify-center flex-shrink-0">
                            <Volume2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#002855] text-xs sm:text-sm truncate">{huidige.titel}</p>
                            {huidige.styl_prompt && (
                                <p className="text-xs text-gray-400 truncate">{huidige.styl_prompt}</p>
                            )}
                        </div>
                        <audio
                            ref={audioRef}
                            src={huidige.oudio_url}
                            controls
                            autoPlay
                            className="h-8 w-full max-w-md accent-[#002855]"
                            onEnded={() => speelVolgende()}
                        />
                        <button
                            onClick={() => {
                                audioRef.current?.pause();
                                setSpeelId(null);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        >
                            <X className="w-5 h-5 text-gray-400 hover:text-red-500" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Musiek;
