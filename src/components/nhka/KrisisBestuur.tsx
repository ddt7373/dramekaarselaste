import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import {
    getKrisisTipeLabel,
    getKrisisStatusLabel,
    KrisisStatus,
    KrisisTipe,
    KrisisPrioriteit,
    isAdmin,
    isHoofAdmin,
    isLeier
} from '@/types/nhka';
import {
    AlertTriangle,
    Filter,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    X,
    User,
    FileText,
    MessageSquare,
    UserCheck,
    Search,
    Loader2,
    Shield,
    ArrowRight,
    BarChart3,
    Calendar,
    Phone
} from 'lucide-react';
import { toast } from 'sonner';

interface KrisisRecord {
    id: string;
    gebruiker_id: string;
    ingedien_deur: string;
    tipe: KrisisTipe;
    beskrywing: string;
    prioriteit: KrisisPrioriteit;
    status: KrisisStatus;
    notas?: string;
    toegewys_aan?: string;
    gemeente_id: string;
    created_at: string;
    updated_at: string;
    // Joined data
    gebruiker?: { naam: string; van: string; selfoon?: string };
    ingedien_deur_gebruiker?: { naam: string; van: string };
    gemeente?: { naam: string };
}

interface KrisisNota {
    id: string;
    krisis_id: string;
    nota: string;
    geskep_deur: string;
    geskep_deur_naam: string;
    created_at: string;
}

const KrisisBestuur: React.FC = () => {
    const { currentUser, currentGemeente, gemeentes } = useNHKA();
    const [krisisse, setKrisisse] = useState<KrisisRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKrisis, setSelectedKrisis] = useState<KrisisRecord | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('aktief');
    const [filterTipe, setFilterTipe] = useState<string>('all');
    const [filterGemeente, setFilterGemeente] = useState<string>('all');
    const [filterPrioriteit, setFilterPrioriteit] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [krisisNotas, setKrisisNotas] = useState<KrisisNota[]>([]);
    const [loadingNotas, setLoadingNotas] = useState(false);
    const [savingNote, setSavingNote] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totaal: 0,
        ingedien: 0,
        erken: 0,
        in_proses: 0,
        opgelos: 0,
        dringend: 0
    });

    const hasAccess = isAdmin(currentUser.rol) || isLeier(currentUser.rol) || currentUser.rol === 'predikant';
    if (!currentUser || !hasAccess) return null;
    const isHoofAdminUser = isHoofAdmin(currentUser.rol);

    // Fetch all crises
    const fetchKrisisse = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('krisis_verslae')
                .select(`
          *,
          gebruiker:gebruikers!gebruiker_id(naam, van, selfoon),
          ingedien_deur_gebruiker:gebruikers!ingedien_deur(naam, van),
          gemeente:gemeentes!gemeente_id(naam)
        `)
                .order('created_at', { ascending: false });

            // If not hoof admin, only show current gemeente
            if (!isHoofAdminUser && currentGemeente) {
                query = query.eq('gemeente_id', currentGemeente.id);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching krisisse:', error);
                toast.error('Kon nie krisisse laai nie');
                return;
            }

            const records = (data || []) as KrisisRecord[];
            setKrisisse(records);

            // Calculate stats
            setStats({
                totaal: records.length,
                ingedien: records.filter(k => k.status === 'ingedien').length,
                erken: records.filter(k => k.status === 'erken').length,
                in_proses: records.filter(k => k.status === 'in_proses').length,
                opgelos: records.filter(k => k.status === 'opgelos').length,
                dringend: records.filter(k => k.prioriteit === 'dringend' && k.status !== 'opgelos').length
            });
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKrisisse();
    }, [currentGemeente?.id]);

    // Fetch notes for a crisis
    const fetchNotas = async (krisisId: string) => {
        setLoadingNotas(true);
        try {
            const { data, error } = await supabase
                .from('krisis_notas')
                .select('*')
                .eq('krisis_id', krisisId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setKrisisNotas(data);
            } else {
                // Table might not exist yet, that's okay
                setKrisisNotas([]);
            }
        } catch {
            setKrisisNotas([]);
        } finally {
            setLoadingNotas(false);
        }
    };

    // Update crisis status
    const handleStatusUpdate = async (krisisId: string, newStatus: KrisisStatus) => {
        setUpdatingStatus(true);
        try {
            const { error } = await supabase
                .from('krisis_verslae')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', krisisId);

            if (error) throw error;

            toast.success(`Status opgedateer na "${getKrisisStatusLabel(newStatus)}"`);

            // Update local state
            setKrisisse(prev => prev.map(k =>
                k.id === krisisId ? { ...k, status: newStatus, updated_at: new Date().toISOString() } : k
            ));

            if (selectedKrisis?.id === krisisId) {
                setSelectedKrisis(prev => prev ? { ...prev, status: newStatus } : null);
            }

            // Recalculate stats
            const updated = krisisse.map(k => k.id === krisisId ? { ...k, status: newStatus } : k);
            setStats({
                totaal: updated.length,
                ingedien: updated.filter(k => k.status === 'ingedien').length,
                erken: updated.filter(k => k.status === 'erken').length,
                in_proses: updated.filter(k => k.status === 'in_proses').length,
                opgelos: updated.filter(k => k.status === 'opgelos').length,
                dringend: updated.filter(k => k.prioriteit === 'dringend' && k.status !== 'opgelos').length
            });
        } catch (err: any) {
            toast.error('Kon nie status opdateer nie: ' + err.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Add note to crisis
    const handleAddNote = async () => {
        if (!newNote.trim() || !selectedKrisis || !currentUser) return;
        setSavingNote(true);
        try {
            const noteData = {
                krisis_id: selectedKrisis.id,
                nota: newNote.trim(),
                geskep_deur: currentUser.id,
                geskep_deur_naam: `${currentUser.naam} ${currentUser.van}`
            };

            const { error } = await supabase
                .from('krisis_notas')
                .insert([noteData]);

            if (error) {
                // If table doesn't exist, save note in the krisis_verslae.notas field instead
                const existingNotas = selectedKrisis.notas || '';
                const timestamp = new Date().toLocaleString('af-ZA');
                const updatedNotas = `${existingNotas}\n[${timestamp}] ${currentUser.naam} ${currentUser.van}: ${newNote.trim()}`.trim();

                const { error: updateError } = await supabase
                    .from('krisis_verslae')
                    .update({ notas: updatedNotas, updated_at: new Date().toISOString() })
                    .eq('id', selectedKrisis.id);

                if (updateError) throw updateError;

                setSelectedKrisis(prev => prev ? { ...prev, notas: updatedNotas } : null);
                setKrisisse(prev => prev.map(k =>
                    k.id === selectedKrisis.id ? { ...k, notas: updatedNotas } : k
                ));
            } else {
                await fetchNotas(selectedKrisis.id);
            }

            setNewNote('');
            toast.success('Nota bygevoeg');
        } catch (err: any) {
            toast.error('Kon nie nota byvoeg nie: ' + err.message);
        } finally {
            setSavingNote(false);
        }
    };

    // Update notes directly on the krisis_verslae record
    const handleUpdateKrisisNotas = async (notas: string) => {
        if (!selectedKrisis) return;
        try {
            const { error } = await supabase
                .from('krisis_verslae')
                .update({ notas, updated_at: new Date().toISOString() })
                .eq('id', selectedKrisis.id);

            if (error) throw error;

            setSelectedKrisis(prev => prev ? { ...prev, notas } : null);
            setKrisisse(prev => prev.map(k =>
                k.id === selectedKrisis.id ? { ...k, notas } : k
            ));
        } catch (err: any) {
            toast.error('Kon nie notas opdateer nie');
        }
    };

    // Filter crises
    const filteredKrisisse = krisisse.filter(k => {
        if (filterStatus === 'aktief' && k.status === 'opgelos') return false;
        if (filterStatus !== 'all' && filterStatus !== 'aktief' && k.status !== filterStatus) return false;
        if (filterTipe !== 'all' && k.tipe !== filterTipe) return false;
        if (filterGemeente !== 'all' && k.gemeente_id !== filterGemeente) return false;
        if (filterPrioriteit !== 'all' && k.prioriteit !== filterPrioriteit) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const gebruikerNaam = `${k.gebruiker?.naam || ''} ${k.gebruiker?.van || ''}`.toLowerCase();
            const beskrywing = (k.beskrywing || '').toLowerCase();
            return gebruikerNaam.includes(q) || beskrywing.includes(q);
        }
        return true;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ingedien': return <AlertCircle className="w-4 h-4" />;
            case 'erken': return <Clock className="w-4 h-4" />;
            case 'in_proses': return <Clock className="w-4 h-4" />;
            case 'opgelos': return <CheckCircle className="w-4 h-4" />;
            default: return <AlertTriangle className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ingedien': return 'bg-[#9E2A2B]/10 text-[#9E2A2B] border-[#9E2A2B]/20';
            case 'erken': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'in_proses': return 'bg-[#D4A84B]/10 text-[#D4A84B] border-[#D4A84B]/20';
            case 'opgelos': return 'bg-[#7A8450]/10 text-[#7A8450] border-[#7A8450]/20';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getPrioriteitColor = (prioriteit: string) => {
        switch (prioriteit) {
            case 'dringend': return 'bg-[#9E2A2B] text-white';
            case 'hoog': return 'bg-[#9E2A2B]/80 text-white';
            case 'normaal': return 'bg-[#D4A84B] text-[#002855]';
            case 'laag': return 'bg-gray-200 text-gray-700';
            default: return 'bg-gray-200 text-gray-700';
        }
    };

    const getPrioriteitLabel = (p: string) => {
        switch (p) {
            case 'dringend': return 'Dringend';
            case 'hoog': return 'Hoog';
            case 'normaal': return 'Normaal';
            case 'laag': return 'Laag';
            default: return p;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('af-ZA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const openDetail = (krisis: KrisisRecord) => {
        setSelectedKrisis(krisis);
        fetchNotas(krisis.id);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#D4A84B] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#002855] flex items-center gap-2">
                        <Shield className="w-6 h-6 text-[#9E2A2B]" />
                        Krisisbestuur
                    </h1>
                    <p className="text-gray-500">
                        {isHoofAdminUser ? 'Bestuur krisisse oor alle gemeentes' : 'Bestuur krisisse vir jou gemeente'}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button onClick={() => setFilterStatus('all')} className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${filterStatus === 'all' ? 'ring-2 ring-[#002855]' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#002855]" />
                        <div>
                            <p className="text-xl font-bold text-[#002855]">{stats.totaal}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Totaal</p>
                        </div>
                    </div>
                </button>

                {stats.dringend > 0 && (
                    <button onClick={() => setFilterPrioriteit(filterPrioriteit === 'dringend' ? 'all' : 'dringend')} className={`bg-[#9E2A2B] rounded-xl p-4 border border-[#9E2A2B] shadow-sm hover:shadow-md transition-all animate-pulse ${filterPrioriteit === 'dringend' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#9E2A2B]' : ''}`}>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-white" />
                            <div>
                                <p className="text-xl font-bold text-white">{stats.dringend}</p>
                                <p className="text-[10px] text-white/80 uppercase tracking-wider font-medium">Dringend</p>
                            </div>
                        </div>
                    </button>
                )}

                <button onClick={() => setFilterStatus(filterStatus === 'ingedien' ? 'aktief' : 'ingedien')} className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${filterStatus === 'ingedien' ? 'ring-2 ring-[#9E2A2B]' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-[#9E2A2B]" />
                        <div>
                            <p className="text-xl font-bold text-[#9E2A2B]">{stats.ingedien}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Ingedien</p>
                        </div>
                    </div>
                </button>

                <button onClick={() => setFilterStatus(filterStatus === 'erken' ? 'aktief' : 'erken')} className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${filterStatus === 'erken' ? 'ring-2 ring-blue-500' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="text-xl font-bold text-blue-600">{stats.erken}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Erken</p>
                        </div>
                    </div>
                </button>

                <button onClick={() => setFilterStatus(filterStatus === 'in_proses' ? 'aktief' : 'in_proses')} className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${filterStatus === 'in_proses' ? 'ring-2 ring-[#D4A84B]' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#D4A84B]" />
                        <div>
                            <p className="text-xl font-bold text-[#D4A84B]">{stats.in_proses}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">In Proses</p>
                        </div>
                    </div>
                </button>

                <button onClick={() => setFilterStatus(filterStatus === 'opgelos' ? 'aktief' : 'opgelos')} className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${filterStatus === 'opgelos' ? 'ring-2 ring-[#7A8450]' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#7A8450]" />
                        <div>
                            <p className="text-xl font-bold text-[#7A8450]">{stats.opgelos}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Opgelos</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Soek per naam of beskrywing..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm"
                        />
                    </div>

                    {/* Type filter */}
                    <div className="relative">
                        <select
                            value={filterTipe}
                            onChange={(e) => setFilterTipe(e.target.value)}
                            className="pl-9 pr-8 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white text-sm"
                        >
                            <option value="all">Alle Tipes</option>
                            <option value="mediese">Mediese Nood</option>
                            <option value="finansieel">Finansiële Nood</option>
                            <option value="geestelik">Geestelike Nood</option>
                            <option value="sterfgeval">Sterfgeval</option>
                            <option value="ander">Ander</option>
                        </select>
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Priority filter */}
                    <div className="relative">
                        <select
                            value={filterPrioriteit}
                            onChange={(e) => setFilterPrioriteit(e.target.value)}
                            className="pl-9 pr-8 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white text-sm"
                        >
                            <option value="all">Alle Prioriteite</option>
                            <option value="dringend">Dringend</option>
                            <option value="hoog">Hoog</option>
                            <option value="normaal">Normaal</option>
                            <option value="laag">Laag</option>
                        </select>
                        <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Gemeente filter (hoof admin only) */}
                    {isHoofAdminUser && (
                        <div className="relative">
                            <select
                                value={filterGemeente}
                                onChange={(e) => setFilterGemeente(e.target.value)}
                                className="pl-9 pr-8 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white text-sm"
                            >
                                <option value="all">Alle Gemeentes</option>
                                {gemeentes.map(g => (
                                    <option key={g.id} value={g.id}>{g.naam}</option>
                                ))}
                            </select>
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* Crisis List */}
            <div className="space-y-3">
                {filteredKrisisse.length > 0 ? (
                    filteredKrisisse.map(krisis => (
                        <div
                            key={krisis.id}
                            onClick={() => openDetail(krisis)}
                            className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all cursor-pointer ${krisis.prioriteit === 'dringend' ? 'border-[#9E2A2B]/40 border-l-4 border-l-[#9E2A2B]' :
                                krisis.prioriteit === 'hoog' ? 'border-[#9E2A2B]/20 border-l-4 border-l-[#9E2A2B]/60' :
                                    'border-gray-100'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Status Icon */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusColor(krisis.status)}`}>
                                    {getStatusIcon(krisis.status)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-gray-900">
                                                    {krisis.gebruiker ? `${krisis.gebruiker.naam} ${krisis.gebruiker.van}` : 'Onbekend'}
                                                </h3>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${getPrioriteitColor(krisis.prioriteit)}`}>
                                                    {getPrioriteitLabel(krisis.prioriteit)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                                                    {getKrisisTipeLabel(krisis.tipe)}
                                                </span>
                                                {isHoofAdminUser && krisis.gemeente?.naam && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-xs font-medium text-[#002855]">{krisis.gemeente.naam}</span>
                                                    </>
                                                )}
                                                <span>•</span>
                                                <span className="text-xs">{formatDate(krisis.created_at)}</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(krisis.status)}`}>
                                                {getKrisisStatusLabel(krisis.status)}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                        {krisis.beskrywing}
                                    </p>

                                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            Ingedien deur {krisis.ingedien_deur_gebruiker ? `${krisis.ingedien_deur_gebruiker.naam} ${krisis.ingedien_deur_gebruiker.van}` : 'Onbekend'}
                                        </span>
                                        {krisis.notas && (
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                Het notas
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <CheckCircle className="w-16 h-16 mx-auto text-[#7A8450] mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {filterStatus === 'aktief' ? 'Geen aktiewe krisisse' : 'Geen krisisse gevind'}
                        </h3>
                        <p className="text-gray-500">
                            {filterStatus === 'aktief'
                                ? 'Alle krisisse is hanteer'
                                : 'Probeer ander filter opsies'}
                        </p>
                    </div>
                )}
            </div>

            {/* Crisis Detail Modal */}
            {selectedKrisis && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor(selectedKrisis.status)}`}>
                                    {getStatusIcon(selectedKrisis.status)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#002855]">Krisis Besonderhede</h2>
                                    <p className="text-xs text-gray-500">
                                        {selectedKrisis.gemeente?.naam && `${selectedKrisis.gemeente.naam} • `}
                                        {formatDate(selectedKrisis.created_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedKrisis(null); setKrisisNotas([]); setNewNote(''); }}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Person Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#002855] flex items-center justify-center flex-shrink-0">
                                        <User className="w-6 h-6 text-[#D4A84B]" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-[#002855] text-lg">
                                            {selectedKrisis.gebruiker ? `${selectedKrisis.gebruiker.naam} ${selectedKrisis.gebruiker.van}` : 'Onbekend'}
                                        </h3>
                                        {selectedKrisis.gebruiker?.selfoon && (
                                            <a href={`tel:${selectedKrisis.gebruiker.selfoon}`} className="flex items-center gap-1 text-sm text-[#D4A84B] hover:underline mt-1">
                                                <Phone className="w-3.5 h-3.5" />
                                                {selectedKrisis.gebruiker.selfoon}
                                            </a>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">
                                            Ingedien deur: {selectedKrisis.ingedien_deur_gebruiker ? `${selectedKrisis.ingedien_deur_gebruiker.naam} ${selectedKrisis.ingedien_deur_gebruiker.van}` : 'Onbekend'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${getPrioriteitColor(selectedKrisis.prioriteit)}`}>
                                        {getPrioriteitLabel(selectedKrisis.prioriteit)}
                                    </span>
                                </div>
                            </div>

                            {/* Crisis Info */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-[#002855]" />
                                    <h4 className="font-semibold text-[#002855]">Krisis Inligting</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Tipe</p>
                                        <p className="font-medium text-gray-900">{getKrisisTipeLabel(selectedKrisis.tipe)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Status</p>
                                        <p className="font-medium text-gray-900 flex items-center gap-1">
                                            {getStatusIcon(selectedKrisis.status)}
                                            {getKrisisStatusLabel(selectedKrisis.status)}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Beskrywing</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedKrisis.beskrywing}</p>
                                </div>
                            </div>

                            {/* Status Update */}
                            {selectedKrisis.status !== 'opgelos' && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <ArrowRight className="w-4 h-4 text-[#002855]" />
                                        <h4 className="font-semibold text-[#002855]">Dateer Status Op</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(['erken', 'in_proses', 'opgelos'] as KrisisStatus[]).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusUpdate(selectedKrisis.id, status)}
                                                disabled={selectedKrisis.status === status || updatingStatus}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${selectedKrisis.status === status
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : status === 'opgelos'
                                                        ? 'bg-[#7A8450] text-white hover:bg-[#6a7445] shadow-sm'
                                                        : status === 'erken'
                                                            ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                                                            : 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] shadow-sm'
                                                    }`}
                                            >
                                                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : getStatusIcon(status)}
                                                {getKrisisStatusLabel(status)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-[#002855]" />
                                    <h4 className="font-semibold text-[#002855]">Notas & Opvolgings</h4>
                                </div>

                                {/* Existing notes from krisis_verslae.notas field */}
                                {selectedKrisis.notas && (
                                    <div className="bg-amber-50 rounded-lg p-3 mb-3 border border-amber-100">
                                        <p className="text-[10px] text-amber-700 uppercase tracking-wider font-medium mb-1">Bestaande Notas</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedKrisis.notas}</p>
                                    </div>
                                )}

                                {/* Notes from krisis_notas table */}
                                {loadingNotas ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-5 h-5 text-[#D4A84B] animate-spin" />
                                    </div>
                                ) : krisisNotas.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {krisisNotas.map(nota => (
                                            <div key={nota.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs font-medium text-[#002855]">{nota.geskep_deur_naam}</p>
                                                    <p className="text-[10px] text-gray-400">{formatDate(nota.created_at)}</p>
                                                </div>
                                                <p className="text-sm text-gray-700">{nota.nota}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add new note */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Voeg 'n nota of opvolging by..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                    />
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!newNote.trim() || savingNote}
                                        className="px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001a35] transition-colors disabled:opacity-50 flex items-center gap-1 text-sm font-medium"
                                    >
                                        {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                        Voeg by
                                    </button>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-[#002855]" />
                                    <h4 className="font-semibold text-[#002855]">Tydlyn</h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <div className="w-2 h-2 rounded-full bg-[#9E2A2B]" />
                                        <span>Ingedien: {formatDate(selectedKrisis.created_at)}</span>
                                    </div>
                                    {selectedKrisis.updated_at !== selectedKrisis.created_at && (
                                        <div className="flex items-center gap-3 text-gray-500">
                                            <div className="w-2 h-2 rounded-full bg-[#D4A84B]" />
                                            <span>Laas opgedateer: {formatDate(selectedKrisis.updated_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 p-4 border-t border-gray-100">
                            <button
                                onClick={() => { setSelectedKrisis(null); setKrisisNotas([]); setNewNote(''); }}
                                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Sluit
                            </button>
                            {selectedKrisis.gebruiker?.selfoon && (
                                <a
                                    href={`https://wa.me/${selectedKrisis.gebruiker.selfoon.replace(/[^0-9+]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 px-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    WhatsApp
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KrisisBestuur;
