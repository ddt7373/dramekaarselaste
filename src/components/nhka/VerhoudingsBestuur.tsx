import React, { useState, useEffect } from 'react';
import {
    Heart, Plus, Loader2, Trash2, ArrowRight, History,
    Search, X, Church
} from 'lucide-react';
import { useNHKA } from '../../contexts/NHKAContext';
import { supabase } from '../../lib/supabase';
import { Gebruiker, VerhoudingTipe, getVerhoudingLabel } from '../../types/nhka';
import { toast } from 'sonner';

const VerhoudingsBestuur: React.FC = () => {
    const {
        gemeentes,
        addVerhouding,
        deleteVerhouding
    } = useNHKA();

    // State
    const [person1GemeenteId, setPerson1GemeenteId] = useState('');
    const [person1List, setPerson1List] = useState<Gebruiker[]>([]);
    const [person1Id, setPerson1Id] = useState('');
    const [loadingPerson1, setLoadingPerson1] = useState(false);

    const [person2GemeenteId, setPerson2GemeenteId] = useState('');
    const [person2List, setPerson2List] = useState<Gebruiker[]>([]);
    const [person2Id, setPerson2Id] = useState('');
    const [loadingPerson2, setLoadingPerson2] = useState(false);

    const [globalVerhoudings, setGlobalVerhoudings] = useState<any[]>([]);
    const [loadingGlobalVerhoudings, setLoadingGlobalVerhoudings] = useState(false);

    const [globalRelType, setGlobalRelType] = useState<VerhoudingTipe>('getroud');
    const [globalRelDesc, setGlobalRelDesc] = useState('');
    const [addingGlobalRel, setAddingGlobalRel] = useState(false);

    // Search State
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<Gebruiker[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);

    useEffect(() => {
        fetchGlobalVerhoudings();
    }, []);

    const fetchGlobalVerhoudings = async () => {
        setLoadingGlobalVerhoudings(true);
        try {
            const { data, error } = await supabase
                .from('lidmaat_verhoudings')
                .select(`
          *,
          lidmaat:gebruikers!lidmaat_id(naam, van, gemeente_data:gemeentes(naam)),
          verwante:gebruikers!verwante_id(naam, van, gemeente_data:gemeentes(naam))
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGlobalVerhoudings(data || []);
        } catch (err) {
            console.error('Error fetching global verhoudings:', err);
        } finally {
            setLoadingGlobalVerhoudings(false);
        }
    };

    const handlePerson1GemeenteChange = async (gemeenteId: string) => {
        setPerson1GemeenteId(gemeenteId);
        setPerson1Id('');
        if (!gemeenteId) {
            setPerson1List([]);
            return;
        }

        setLoadingPerson1(true);
        try {
            const { data, error } = await supabase
                .from('gebruikers')
                .select('*')
                .eq('gemeente_id', gemeenteId)
                .order('naam');

            if (error) throw error;
            setPerson1List(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPerson1(false);
        }
    };

    const handlePerson2GemeenteChange = async (gemeenteId: string) => {
        setPerson2GemeenteId(gemeenteId);
        setPerson2Id('');
        setUserSearchQuery('');
        setUserSearchResults([]);
        if (!gemeenteId) {
            setPerson2List([]);
            return;
        }

        setLoadingPerson2(true);
        try {
            const { data, error } = await supabase
                .from('gebruikers')
                .select('*')
                .eq('gemeente_id', gemeenteId)
                .order('naam');

            if (error) throw error;
            setPerson2List(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPerson2(false);
        }
    };

    const handleUserSearch = async (query: string) => {
        setUserSearchQuery(query);
        if (query.length < 2) {
            setUserSearchResults([]);
            return;
        }

        setSearchingUsers(true);
        try {
            const { data, error } = await supabase
                .from('gebruikers')
                .select(`
                    *,
                    gemeente_data:gemeentes(naam)
                `)
                .or(`naam.ilike.%${query}%,van.ilike.%${query}%,epos.ilike.%${query}%`)
                .eq('aktief', true)
                .limit(10);

            if (error) throw error;
            setUserSearchResults(data || []);
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setSearchingUsers(false);
        }
    };

    const handleSaveGlobalVerhouding = async () => {
        if (!person1Id || !person2Id) {
            toast.error('Kies asb albei lidmate');
            return;
        }

        if (person1Id === person2Id) {
            toast.error('Lidmate moet verskil');
            return;
        }

        if (globalRelType === 'ander' && !globalRelDesc.trim()) {
            toast.error('Beskryf asb die verhouding');
            return;
        }

        setAddingGlobalRel(true);
        try {
            const result = await addVerhouding({
                lidmaat_id: person1Id,
                verwante_id: person2Id,
                verhouding_tipe: globalRelType,
                verhouding_beskrywing: globalRelType === 'ander' ? globalRelDesc : undefined
            });

            if (result.success) {
                toast.success('Verhouding suksesvol bygevoeg');
                setPerson1Id('');
                setPerson2Id('');
                setGlobalRelDesc('');
                await fetchGlobalVerhoudings();
            } else {
                toast.error(result.error || 'Kon nie verhouding byvoeg nie');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAddingGlobalRel(false);
        }
    };

    const handleDeleteGlobalVerhouding = async (id: string) => {
        if (!window.confirm('Is jy seker jy wil hierdie verhouding verwyder?')) return;
        await deleteVerhouding(id);
        toast.success('Verhouding verwyder');
        await fetchGlobalVerhoudings();
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#002855] to-[#003d7a] flex items-center justify-center shadow-lg">
                        <Heart className="w-6 h-6 text-[#D4A84B]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#002855]">Verhoudings</h1>
                        <p className="text-gray-500">Bestuur verhoudings tussen lede van alle gemeentes</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-[#002855] mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#D4A84B]" />
                    Voeg Nuwe Verhouding By
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Person 1 */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Lidmaat 1</label>
                        <select
                            value={person1GemeenteId}
                            onChange={(e) => handlePerson1GemeenteChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                        >
                            <option value="">Kies Gemeente...</option>
                            {gemeentes.map(g => (
                                <option key={g.id} value={g.id}>{g.naam}</option>
                            ))}
                        </select>

                        <div className="relative">
                            <select
                                value={person1Id}
                                onChange={(e) => setPerson1Id(e.target.value)}
                                disabled={!person1GemeenteId || loadingPerson1}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none disabled:bg-gray-50"
                            >
                                <option value="">{loadingPerson1 ? 'Laai...' : 'Kies Lidmaat...'}</option>
                                {person1List.map(u => (
                                    <option key={u.id} value={u.id}>{u.naam} {u.van}</option>
                                ))}
                            </select>
                            {loadingPerson1 && (
                                <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#D4A84B]" />
                            )}
                        </div>
                    </div>

                    {/* Relationship Type */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Verhouding Tipe</label>
                        <select
                            value={globalRelType}
                            onChange={(e) => setGlobalRelType(e.target.value as VerhoudingTipe)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                        >
                            <option value="getroud">Gelys as Getroud met</option>
                            <option value="ouer">Is Ouer van</option>
                            <option value="kind">Is Kind van</option>
                            <option value="broer_suster">Is Broer/Suster van</option>
                            <option value="ander">Ander...</option>
                        </select>

                        {globalRelType === 'ander' && (
                            <input
                                type="text"
                                value={globalRelDesc}
                                onChange={(e) => setGlobalRelDesc(e.target.value)}
                                placeholder="Beskryf verhouding..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                            />
                        )}
                        <div className="pt-2 text-center text-gray-400">
                            <ArrowRight className="w-5 h-5 mx-auto hidden lg:block" />
                        </div>
                    </div>

                    {/* Person 2 */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Verwante Lidmaat (Soek in alle gemeentes) *</label>
                        <p className="text-[10px] text-[#9E2A2B] font-bold">Name sal slegs wys indien hul geregistreer is as gebruikers.</p>

                        <div className="space-y-2">
                            <select
                                value={person2GemeenteId}
                                onChange={(e) => handlePerson2GemeenteChange(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                            >
                                <option value="">Filter volgens Gemeente (Opsioneel)...</option>
                                {gemeentes.map(g => (
                                    <option key={g.id} value={g.id}>{g.naam}</option>
                                ))}
                            </select>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={userSearchQuery}
                                    onChange={(e) => handleUserSearch(e.target.value)}
                                    placeholder="Soek op naam of epos..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                                />
                                {searchingUsers && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#D4A84B]" />
                                )}
                            </div>

                            <div className="relative">
                                <select
                                    value={person2Id}
                                    onChange={(e) => setPerson2Id(e.target.value)}
                                    disabled={(loadingPerson2 && !userSearchQuery) || (userSearchQuery.length > 0 && userSearchResults.length === 0 && !searchingUsers)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none disabled:bg-gray-50"
                                >
                                    <option value="">
                                        {searchingUsers ? 'Soek tans...' :
                                            userSearchQuery.length > 0 ?
                                                (userSearchResults.length > 0 ? 'Kies uit resultate...' : 'Geen gebruikers gevind nie') :
                                                'Kies uit lys...'}
                                    </option>
                                    {(userSearchQuery.length > 0 ? userSearchResults : person2List).map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.naam} {u.van} ({(u as any).gemeente_data?.naam || u.gemeente || 'Onbekend'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSaveGlobalVerhouding}
                        disabled={addingGlobalRel || !person1Id || !person2Id}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-[#D4A84B] text-[#002855] font-bold rounded-xl hover:bg-[#c49a3d] transition-colors shadow-lg disabled:opacity-50"
                    >
                        {addingGlobalRel ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        Voeg Verhouding By
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-[#002855]">Bestaande Verhoudings</h3>
                        <p className="text-sm text-gray-500">Lys van alle verhoudings in die stelsel</p>
                    </div>
                    <button
                        onClick={fetchGlobalVerhoudings}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                        title="Herlaai"
                    >
                        <History className={`w-5 h-5 ${loadingGlobalVerhoudings ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {loadingGlobalVerhoudings ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#D4A84B]" />
                        </div>
                    ) : globalVerhoudings.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            Geen verhoudings gevind nie
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lidmaat 1</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Verhouding</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lidmaat 2</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {globalVerhoudings.map(v => (
                                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#002855]/10 flex items-center justify-center text-[#002855] text-xs font-bold">
                                                    {v.lidmaat?.naam?.[0]}{v.lidmaat?.van?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{v.lidmaat?.naam} {v.lidmaat?.van}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{(v.lidmaat as any).gemeente_data?.naam || v.lidmaat?.gemeente || 'Onbekend'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-[#D4A84B]/10 text-[#D4A84B] text-xs font-bold rounded-full border border-[#D4A84B]/20">
                                                {getVerhoudingLabel(v.verhouding_tipe)}
                                                {v.verhouding_tipe === 'ander' && v.verhouding_beskrywing && `: ${v.verhouding_beskrywing}`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#8B7CB3]/10 flex items-center justify-center text-[#8B7CB3] text-xs font-bold">
                                                    {v.verwante?.naam?.[0]}{v.verwante?.van?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{v.verwante?.naam} {v.verwante?.van}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{(v.verwante as any).gemeente_data?.naam || v.verwante?.gemeente || 'Onbekend'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDeleteGlobalVerhouding(v.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Verwyder"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerhoudingsBestuur;
