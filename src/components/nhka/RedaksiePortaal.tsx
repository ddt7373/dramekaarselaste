import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { ArtikelTipe, ArtikelIndiening } from '@/types/nhka';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    ClipboardList,
    Settings,
    Download,
    Plus,
    Trash2,
    Save,
    FileText,
    Search,
    Clock,
    User,
    ChevronRight,
    Loader2,
    X
} from 'lucide-react';

const RedaksiePortaal: React.FC = () => {
    const { currentUser } = useNHKA();
    const { toast } = useToast();

    // State for configuration
    const [tipes, setTipes] = useState<ArtikelTipe[]>([]);
    const [editingTipe, setEditingTipe] = useState<string | null>(null);
    const [newTipe, setNewTipe] = useState({ naam: '', maks_woorde: '' });

    // State for submissions
    const [indienings, setIndienings] = useState<ArtikelIndiening[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndiening, setSelectedIndiening] = useState<ArtikelIndiening | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchTipes();
        fetchIndienings();
    }, []);

    const fetchTipes = async () => {
        const { data, error } = await supabase
            .from('artikels_tipes')
            .select('*')
            .eq('aktief', true)
            .order('naam');

        if (data) setTipes(data);
    };

    const fetchIndienings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('artikels_indienings')
            .select('*, gebruiker:gebruikers(*), artikel_tipe:artikels_tipes(*)')
            .order('created_at', { ascending: false });

        if (data) setIndienings(data);
        setLoading(false);
    };

    const handleSelectIndiening = (item: ArtikelIndiening) => {
        setSelectedIndiening(item);
    };


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ingedien': return 'bg-blue-50 text-blue-600';
            case 'in_hersiening': return 'bg-amber-50 text-amber-600';
            case 'gepubliseer': return 'bg-green-50 text-green-600';
            case 'afgewys': return 'bg-red-50 text-red-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ingedien': return 'Nuut';
            case 'in_hersiening': return 'In Hersiening';
            case 'gepubliseer': return 'Gepubliseer';
            case 'afgewys': return 'Afgewys';
            default: return status;
        }
    };

    const handleUpdateMaksWoorde = async (id: string, count: number | null) => {
        try {
            const { error } = await supabase
                .from('artikels_tipes')
                .update({ maks_woorde: count })
                .eq('id', id);

            if (error) throw error;
            toast({ title: 'Opgedateer', description: 'Woord-limiet is suksesvol gestoor.' });
            setEditingTipe(null);
            fetchTipes();
        } catch (error: any) {
            toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        }
    };

    const handleAddTipe = async () => {
        if (!newTipe.naam) return;
        try {
            const { error } = await supabase
                .from('artikels_tipes')
                .insert({
                    naam: newTipe.naam,
                    maks_woorde: newTipe.maks_woorde ? parseInt(newTipe.maks_woorde) : null
                });

            if (error) throw error;
            toast({ title: 'Bygevoeg', description: 'Nuwe artikel tipe is geskep.' });
            setNewTipe({ naam: '', maks_woorde: '' });
            fetchTipes();
        } catch (error: any) {
            toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        }
    };

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteIndiening = async (e: React.MouseEvent, item: ArtikelIndiening) => {
        e.stopPropagation();
        if (!currentUser?.id) {
            toast({ title: 'Fout', description: 'Jy moet aangemeld wees om te verwyder.', variant: 'destructive' });
            return;
        }
        if (!window.confirm(`Is jy seker jy wil hierdie artikel verwyder?\n\n"${item.titel}"\n\nDit kan nie ongedaan gemaak word nie.`)) return;
        setDeletingId(item.id);
        try {
            const { error } = await supabase.rpc('delete_artikel_indiening', {
                p_indiening_id: item.id,
                p_gebruiker_id: currentUser.id
            });
            if (error) throw error;
            toast({ title: 'Verwyder', description: 'Artikel is verwyder.' });
            setIndienings(prev => prev.filter(i => i.id !== item.id));
            if (selectedIndiening?.id === item.id) setSelectedIndiening(null);
        } catch (error: any) {
            toast({ title: 'Fout', description: error.message || 'Kon nie artikel verwyder nie.', variant: 'destructive' });
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = (indiening: ArtikelIndiening) => {
        const content = `
TITEL: ${indiening.titel}
SKRYWER: ${indiening.gebruiker?.naam} ${indiening.gebruiker?.van}
TIPE: ${indiening.artikel_tipe?.naam}
DATUM: ${new Date(indiening.created_at).toLocaleDateString()}
WOORDE: ${indiening.woord_telling}

--------------------------------------------------------------------------------
${indiening.inhoud}
`.trim();

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${indiening.titel.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#002855]">Redaksie-portaal</h1>
                    <p className="text-gray-500">Bestuur indienings en artikel konfigurasie.</p>
                </div>
                <Button variant="outline" onClick={fetchIndienings} className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Verfris
                </Button>
            </div>

            <Tabs defaultValue="indienings" className="w-full">
                <TabsList className="bg-gray-100 p-1 rounded-xl mb-6">
                    <TabsTrigger value="indienings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Indienings
                    </TabsTrigger>
                    <TabsTrigger value="konfigurasie" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Konfigurasie
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="indienings" className="space-y-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Soek op titel of skrywer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Label className="whitespace-nowrap text-gray-500">Status:</Label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[150px]"
                            >
                                <option value="all">Alle Statusse</option>
                                <option value="ingedien">Nuut</option>
                                <option value="in_hersiening">In Hersiening</option>
                                <option value="gepubliseer">Gepubliseer</option>
                                <option value="afgewys">Afgewys</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* List of Submissions */}
                        <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading && <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>}

                            {!loading && indienings.filter(item => {
                                const matchesSearch = item.titel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    `${item.gebruiker?.naam} ${item.gebruiker?.van}`.toLowerCase().includes(searchTerm.toLowerCase());
                                const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
                                return matchesSearch && matchesStatus;
                            }).length === 0 && (
                                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-400">Geen indienings gevind wat aan die kriteria voldoen nie.</p>
                                    </div>
                                )}

                            {indienings.filter(item => {
                                const matchesSearch = item.titel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    `${item.gebruiker?.naam} ${item.gebruiker?.van}`.toLowerCase().includes(searchTerm.toLowerCase());
                                const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
                                return matchesSearch && matchesStatus;
                            }).map(item => (
                                <Card
                                    key={item.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${selectedIndiening?.id === item.id ? 'border-[#002855] ring-1 ring-[#002855]/10' : 'border-gray-100'}`}
                                    onClick={() => handleSelectIndiening(item)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-[#002855] truncate">{item.titel}</h3>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {item.gebruiker?.naam} {item.gebruiker?.van}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full"
                                                    onClick={(e) => handleDeleteIndiening(e, item)}
                                                    disabled={deletingId === item.id}
                                                    title="Verwyder artikel"
                                                >
                                                    {deletingId === item.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                    {item.artikel_tipe?.naam}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>
                                                    {getStatusLabel(item.status)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                            <span>{item.woord_telling} woorde</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* View/Download Submissions */}
                        <div className="lg:col-span-2">
                            {selectedIndiening ? (
                                <Card className="border-none shadow-xl min-h-[500px] flex flex-col bg-white">
                                    <CardHeader className="border-b border-gray-50 bg-gray-50/50">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div className="space-y-2 flex-1">
                                                <CardTitle className="text-xl md:text-2xl text-[#002855]">{selectedIndiening.titel}</CardTitle>
                                                <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {selectedIndiening.gebruiker?.naam} {selectedIndiening.gebruiker?.van}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(selectedIndiening.created_at).toLocaleString()}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-gray-400">Status:</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(selectedIndiening.status)}`}>
                                                            {getStatusLabel(selectedIndiening.status)}
                                                        </span>
                                                    </div>
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button onClick={() => handleDownload(selectedIndiening)} className="bg-green-600 hover:bg-green-700">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Laai Af
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={(e) => handleDeleteIndiening(e, selectedIndiening)}
                                                    disabled={deletingId === selectedIndiening.id}
                                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    {deletingId === selectedIndiening.id ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                    )}
                                                    Verwyder
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 md:p-8 flex-1">
                                        <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-100 font-serif text-lg leading-relaxed text-gray-800 whitespace-pre-wrap min-h-full">
                                            {selectedIndiening.inhoud}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="h-full min-h-[500px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <p>Kies 'n indiening aan die linkerkant om dit te lees.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="konfigurasie" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current Types */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg">Artikel Tipes</CardTitle>
                                <CardDescription>Bestuur bestaande tipes en hul woord-limiete.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-50">
                                    {tipes.map(tipe => (
                                        <div key={tipe.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className="font-bold text-[#002855]">{tipe.naam}</p>
                                                {editingTipe === tipe.id ? (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            placeholder="Maks woorde"
                                                            defaultValue={tipe.maks_woorde || ''}
                                                            onBlur={(e) => handleUpdateMaksWoorde(tipe.id, e.target.value ? parseInt(e.target.value) : null)}
                                                            className="h-8 max-w-[120px]"
                                                            autoFocus
                                                        />
                                                        <Button variant="ghost" size="sm" onClick={() => setEditingTipe(null)}>
                                                            <X className="w-3 h-3 text-gray-400" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-500">
                                                        Limiet: {tipe.maks_woorde || 'Geen limiet'} woorde
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingTipe(tipe.id)}
                                                className="text-gray-400 hover:text-[#002855]"
                                            >
                                                Wysig
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Add New Type */}
                        <Card className="border-none shadow-lg h-fit">
                            <CardHeader>
                                <CardTitle className="text-lg">Nuwe Tipe Byvoeg</CardTitle>
                                <CardDescription>Definieer 'n nuwe kategorie vir skrywers.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Naam</Label>
                                    <Input
                                        placeholder="Bv. Resensies"
                                        value={newTipe.naam}
                                        onChange={(e) => setNewTipe(prev => ({ ...prev, naam: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Maksimum Woorde (Opsioneel)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Bv. 500"
                                        value={newTipe.maks_woorde}
                                        onChange={(e) => setNewTipe(prev => ({ ...prev, maks_woorde: e.target.value }))}
                                    />
                                </div>
                                <Button onClick={handleAddTipe} className="w-full bg-[#002855] hover:bg-[#003d7a]">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Voeg Tipe By
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default RedaksiePortaal;
