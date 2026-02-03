import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { ArtikelTipe, ArtikelIndiening } from '@/types/nhka';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Send, AlertCircle, CheckCircle2, Info, ArrowLeft, Loader2, ListChecks, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ArtikelPortaal: React.FC = () => {
    const { currentUser } = useNHKA();
    const { toast } = useToast();
    const [tipes, setTipes] = useState<ArtikelTipe[]>([]);
    const [selectedTipeId, setSelectedTipeId] = useState<string>('');
    const [titel, setTitel] = useState('');
    const [inhoud, setInhoud] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [anderTipe, setAnderTipe] = useState('');
    const [myIndienings, setMyIndienings] = useState<ArtikelIndiening[]>([]);
    const [fetchingMyIndienings, setFetchingMyIndienings] = useState(false);

    useEffect(() => {
        fetchTipes();
        if (currentUser) {
            fetchMyIndienings();
        }
    }, [currentUser]);

    const fetchTipes = async () => {
        const { data, error } = await supabase
            .from('artikels_tipes')
            .select('*')
            .eq('aktief', true)
            .order('naam');

        if (data) setTipes(data);
    };

    const fetchMyIndienings = async () => {
        if (!currentUser) return;
        setFetchingMyIndienings(true);
        const { data, error } = await supabase
            .from('artikels_indienings')
            .select('*, artikel_tipe:artikels_tipes(*)')
            .eq('gebruiker_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (data) setMyIndienings(data);
        setFetchingMyIndienings(false);
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'ingedien': return { label: 'In Waglys', color: 'bg-blue-50 text-blue-600 border-blue-100' };
            case 'in_hersiening': return { label: 'In Hersiening', color: 'bg-amber-50 text-amber-600 border-amber-100' };
            case 'gepubliseer': return { label: 'Gepubliseer', color: 'bg-green-50 text-green-600 border-green-100' };
            case 'afgewys': return { label: 'Nie Aanvaar', color: 'bg-red-50 text-red-600 border-red-100' };
            default: return { label: status, color: 'bg-gray-50 text-gray-600 border-gray-100' };
        }
    };

    const selectedTipe = tipes.find(t => t.id === selectedTipeId);

    const wordCount = inhoud.trim() ? inhoud.trim().split(/\s+/).length : 0;
    const isOverLimit = selectedTipe?.maks_woorde ? wordCount > selectedTipe.maks_woorde : false;

    const handleIndien = async () => {
        if (!currentUser) return;
        if (!selectedTipeId || !titel.trim() || !inhoud.trim()) {
            toast({
                title: 'Velde ontbreek',
                description: 'Vul asseblief alle verpligte velde in.',
                variant: 'destructive'
            });
            return;
        }

        if (isOverLimit) {
            toast({
                title: 'Te veel woorde',
                description: `Jou artikel is ${wordCount} woorde. Die maksimum vir hierdie tipe is ${selectedTipe?.maks_woorde}.`,
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            const finalTitel = selectedTipe?.naam === 'Ander' ? `${anderTipe}: ${titel}` : titel;

            const { error } = await supabase
                .from('artikels_indienings')
                .insert({
                    gebruiker_id: currentUser.id,
                    tipe_id: selectedTipeId,
                    titel: finalTitel,
                    inhoud: inhoud,
                    woord_telling: wordCount,
                    status: 'ingedien'
                });

            if (error) throw error;

            toast({
                title: 'Sukses!',
                description: 'Jou artikel is suksesvol ingedien by die redaksie.',
            });
            setSubmitted(true);
            fetchMyIndienings();
        } catch (error: any) {
            toast({
                title: 'Fout',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <Card className="border-green-100 bg-green-50/30">
                    <CardContent className="pt-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#002855]">Artikel Ingedien!</h2>
                        <p className="text-gray-600">
                            Dankie vir jou bydrae. Die redaksie sal jou artikel hersien.
                        </p>
                        <Button
                            onClick={() => {
                                setSubmitted(false);
                                setTitel('');
                                setInhoud('');
                                setSelectedTipeId('');
                                setAnderTipe('');
                            }}
                            className="bg-[#002855] hover:bg-[#003d7a]"
                        >
                            Dien nog 'n artikel in
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-[#002855]">Artikels-portaal</h1>
                <p className="text-gray-500">Dien jou artikels in vir Die Hervormer en volg hul vordering.</p>
            </div>

            <Tabs defaultValue="nuut" className="w-full">
                <TabsList className="bg-gray-100 p-1 rounded-xl mb-6">
                    <TabsTrigger value="nuut" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Send className="w-4 h-4 mr-2" />
                        Nuwe Indiening
                    </TabsTrigger>
                    <TabsTrigger value="geskiedenis" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <History className="w-4 h-4 mr-2" />
                        My Geskiedenis
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="nuut">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-[#002855] text-white">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-[#D4A84B]" />
                                <div>
                                    <CardTitle className="text-white">Nuwe Artikel Indiening</CardTitle>
                                    <CardDescription className="text-blue-100">
                                        Volg die instruksies hieronder om jou werk te deel.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-[#002855] text-white flex items-center justify-center text-xs font-bold">1</div>
                                    <Label className="text-sm font-bold uppercase tracking-wider text-gray-500">Kies Artikel Tipe</Label>
                                </div>
                                <Select value={selectedTipeId} onValueChange={setSelectedTipeId}>
                                    <SelectTrigger className="w-full md:w-[300px]">
                                        <SelectValue placeholder="Kies artikel tipe..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tipes.map(tipe => (
                                            <SelectItem key={tipe.id} value={tipe.id}>
                                                {tipe.naam} {tipe.maks_woorde ? `(${tipe.maks_woorde} woorde)` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedTipe?.naam === 'Ander' && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                        <Label htmlFor="ander-tipe">Spesifiseer Tipe Artikel</Label>
                                        <Input
                                            id="ander-tipe"
                                            placeholder="Bv. Resensie, Gedig, ens."
                                            value={anderTipe}
                                            onChange={(e) => setAnderTipe(e.target.value)}
                                            className="max-w-md"
                                        />
                                    </div>
                                )}
                            </div>

                            {selectedTipe && (
                                <>
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 animate-in fade-in slide-in-from-top-4">
                                        <Info className="w-6 h-6 text-amber-600 flex-shrink-0" />
                                        <div className="space-y-1">
                                            <p className="font-bold text-amber-900">Instruksie:</p>
                                            <p className="text-amber-800 text-sm leading-relaxed">
                                                Skryf asseblief eers jou artikel in 'n woordverwerker (soos Microsoft Word of Google Docs).
                                                Sodra jy tevrede is, kopieer en plak die teks in die blokjie hieronder.
                                                {selectedTipe.maks_woorde && (
                                                    <span className="block mt-1 font-semibold">
                                                        Maksimum woorde toegelaat vir hierdie tipe: {selectedTipe.maks_woorde}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 animate-in fade-in slide-in-from-top-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-[#002855] text-white flex items-center justify-center text-xs font-bold">2</div>
                                            <Label className="text-sm font-bold uppercase tracking-wider text-gray-500">Artikel Inhoud</Label>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="titel" className="text-gray-700">Titel van Artikel</Label>
                                                <Input
                                                    id="titel"
                                                    value={titel}
                                                    onChange={(e) => setTitel(e.target.value)}
                                                    placeholder="Gooi hier 'n kragtige titel..."
                                                    className="text-lg font-medium border-gray-200 focus:border-[#002855] focus:ring-[#002855]"
                                                />
                                            </div>

                                            <div className="relative">
                                                <Label htmlFor="inhoud" className="text-gray-700">Teks</Label>
                                                <Textarea
                                                    id="inhoud"
                                                    value={inhoud}
                                                    onChange={(e) => setInhoud(e.target.value)}
                                                    placeholder="Plak jou artikel hier..."
                                                    className="min-h-[400px] font-serif p-6 text-lg border-gray-200 focus:border-[#002855] focus:ring-[#002855]"
                                                />

                                                <div className={`absolute bottom-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 shadow-sm ${isOverLimit ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                                                    }`}>
                                                    {isOverLimit ? <AlertCircle className="w-3.5 h-3.5" /> : null}
                                                    Woorde: {wordCount} {selectedTipe.maks_woorde ? `/ ${selectedTipe.maks_woorde}` : ''}
                                                </div>
                                            </div>

                                            {isOverLimit && (
                                                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-pulse">
                                                    <AlertCircle className="w-5 h-5" />
                                                    Jy het die maksimum aantal woorde oorskrei. Verminder asseblief jou teks voordat jy indien.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                        {selectedTipe && (
                            <CardFooter className="bg-gray-50 p-6 flex justify-between items-center border-t border-gray-100">
                                <p className="text-xs text-gray-400">
                                    Deur op indien te klik, verklaar jy dat hierdie jou eie werk is.
                                </p>
                                <Button
                                    onClick={handleIndien}
                                    disabled={loading || isOverLimit || !titel.trim() || !inhoud.trim()}
                                    className="bg-[#002855] hover:bg-[#003d7a] text-white px-8 py-6 rounded-xl shadow-lg transition-transform active:scale-95"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Indiening...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 mr-2" />
                                            Indien Artikel
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="geskiedenis">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {fetchingMyIndienings && (
                            <div className="col-span-full py-20 flex justify-center">
                                <Loader2 className="w-10 h-10 animate-spin text-[#002855]" />
                            </div>
                        )}

                        {!fetchingMyIndienings && myIndienings.length === 0 && (
                            <Card className="col-span-full p-12 text-center border-dashed border-2 border-gray-200 bg-transparent">
                                <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">Nog geen indienings nie</h3>
                                <p className="text-gray-400 mt-2">Dien jou eerste artikel in onder die 'Nuwe Indiening' oortjie.</p>
                            </Card>
                        )}

                        {!fetchingMyIndienings && myIndienings.map(item => {
                            const status = getStatusInfo(item.status);
                            return (
                                <Card key={item.id} className="border-none shadow-md hover:shadow-lg transition-shadow bg-white overflow-hidden flex flex-col">
                                    <div className={`h-1.5 w-full ${status.color.split(' ')[1].replace('text-', 'bg-')}`}></div>
                                    <CardHeader className="p-4 flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                                                {item.artikel_tipe?.naam}
                                            </span>
                                            <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <CardTitle className="text-lg text-[#002855] line-clamp-2">{item.titel}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="flex justify-between text-[11px] text-gray-400">
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                            <span>{item.woord_telling} woorde</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                                        <Button variant="ghost" size="sm" className="text-xs text-[#002855]" onClick={() => {
                                            // Handle view details if needed, for now just show a toast or something
                                            toast({ title: item.titel, description: 'Die redaksie is tans besig met hierdie artikel.' });
                                        }}>
                                            Besonderhede
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ArtikelPortaal;
