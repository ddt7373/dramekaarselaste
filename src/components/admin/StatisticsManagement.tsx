import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, Plus, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Save, X, Loader2, Download, Users, UserPlus, UserMinus, FileDown, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { CongregationStatistic } from '@/types/congregation-admin';
import { useToast } from '@/hooks/use-toast';

interface StatisticsManagementProps {
    congregationId: string;
}

interface RealTimeStats {
    baptized: number;
    confessing: number;
    vermeerdering: number;
    vermindering: number;
    oorlede: number;
    verhuis: number;
}

const StatisticsManagement: React.FC<StatisticsManagementProps> = ({ congregationId }) => {
    const { toast } = useToast();
    const [statistics, setStatistics] = useState<CongregationStatistic[]>([]);
    const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({
        baptized: 0,
        confessing: 0,
        vermeerdering: 0,
        vermindering: 0,
        oorlede: 0,
        verhuis: 0
    });
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        year: new Date().getFullYear(),
        baptized_members: 0,
        confessing_members: 0,
        births: 0,
        deaths: 0,
        baptisms: 0,
        confirmations: 0,
        transfers_in: 0,
        transfers_out: 0,
        notes: ''
    });

    useEffect(() => {
        fetchStatistics();
        fetchRealTimeStats();
    }, [congregationId]);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('congregation_statistics_with_growth')
                .select('*')
                .eq('congregation_id', congregationId)
                .order('year', { ascending: false });

            if (error) throw error;
            setStatistics(data || []);
        } catch (err) {
            console.error('Error fetching statistics:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRealTimeStats = async () => {
        try {
            // Count current members from profiles
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('lidmaat_status, app_roles')
                .eq('congregation_id', congregationId)
                .eq('active', true);

            if (pError) throw pError;

            // Simplified logic for baptized vs confessing based on roles for now
            // In a full implementation, there would be a specific field
            const baptized = profiles.filter(p => p.lidmaat_status === 'aktief' && (!p.app_roles || p.app_roles.length === 0 || p.app_roles.includes('member'))).length;
            const confessing = profiles.filter(p => p.lidmaat_status === 'aktief').length - baptized;

            // Get current year logs
            const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
            const { data: logs, error: lError } = await supabase
                .from('gemeente_statistiek_logs')
                .select('*')
                .eq('gemeente_id', congregationId)
                .gte('datum', startOfYear);

            if (lError) throw lError;

            const counts = {
                baptized: baptized,
                confessing: confessing,
                vermeerdering: logs.filter(l => l.tipe === 'vermeerdering').length,
                vermindering: logs.filter(l => l.tipe === 'vermindering').length,
                oorlede: logs.filter(l => l.rede === 'oorlede').length,
                verhuis: logs.filter(l => l.rede === 'verhuis').length
            };

            setRealTimeStats(counts);
        } catch (err) {
            console.error('Error fetching real-time stats:', err);
        }
    };

    const handleExportCSV = () => {
        if (statistics.length === 0) return;

        const headers = ['Jaar', 'Gedoopte', 'Belydend', 'Totaal', 'Geboortes', 'Sterftes', 'Dope', 'Belydenisse'];
        const rows = statistics.map(s => [
            s.year,
            s.baptized_members,
            s.confessing_members,
            s.total_souls,
            s.births || 0,
            s.deaths || 0,
            s.baptisms || 0,
            s.confirmations || 0
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Lidmaattellings_${congregationId.substring(0, 5)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Sukses", description: "CSV verslag afgelaai" });
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (formData.year < 1900 || formData.year > 2100) {
            toast({ title: "Fout", description: "Ongeldige jaar", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('congregation_statistics')
                .insert([{
                    congregation_id: congregationId,
                    ...formData
                }]);

            if (error) throw error;

            await fetchStatistics();
            setShowAddModal(false);
            resetForm();
            toast({ title: "Sukses", description: "Statistiek gestoor" });
        } catch (err: any) {
            console.error('Error saving statistics:', err);
            toast({ title: "Fout", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            year: new Date().getFullYear(),
            baptized_members: 0,
            confessing_members: 0,
            births: 0,
            deaths: 0,
            baptisms: 0,
            confirmations: 0,
            transfers_in: 0,
            transfers_out: 0,
            notes: ''
        });
    };

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const chartData = [...statistics]
        .reverse()
        .map(stat => ({
            year: stat.year,
            'Totaal': stat.total_souls,
            'Gedoopte': stat.baptized_members,
            'Belydend': stat.confessing_members
        }));

    return (
        <div className="space-y-6">
            {/* Real-time Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-[#002855] text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Users className="w-5 h-5 text-[#D4A84B]" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{realTimeStats.baptized + realTimeStats.confessing}</p>
                                <p className="text-xs text-white/60">Aktiewe Lidmate Uit Register</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-green-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <UserPlus className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-green-600">+{realTimeStats.vermeerdering}</p>
                                <p className="text-xs text-gray-500">Vermeerdering ({new Date().getFullYear()})</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-red-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <UserMinus className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-red-600">-{realTimeStats.vermindering}</p>
                                <p className="text-xs text-gray-500">Vermindering ({new Date().getFullYear()})</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-amber-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <Heart className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-amber-600">{realTimeStats.oorlede}</p>
                                <p className="text-xs text-gray-500">Sterftes Aangemeld</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-[#002855]">
                                <BarChart3 className="w-5 h-5 text-[#D4A84B]" />
                                Lidmaattellings & Tendense
                            </CardTitle>
                            <CardDescription>
                                Jaarlikse statistiek vergelyking en historiese data
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleExportCSV} disabled={statistics.length === 0}>
                                <FileDown className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button onClick={() => setShowAddModal(true)} className="bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d]">
                                <Plus className="w-4 h-4 mr-2" />
                                Voeg Jaar By
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Charts Grid */}
                    {statistics.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-[#002855] mb-4 text-sm uppercase">Lidmaat Groei Tendens</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Line type="monotone" dataKey="Totaal" stroke="#002855" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Belydend" stroke="#7A8450" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-[#002855] mb-4 text-sm uppercase">Jaarlikse Bewegings</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={statistics.slice(0, 5).reverse()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px' }} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Bar dataKey="births" name="Geboortes" fill="#D4A84B" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="deaths" name="Sterftes" fill="#002855" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Statistics Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#D4A84B]" />
                        </div>
                    ) : (
                        <div className="border rounded-xl overflow-hidden shadow-sm border-gray-100">
                            <table className="w-full">
                                <thead className="bg-[#002855] text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Jaar</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Gedoopte</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Belydend</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Totaal</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Groei</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Info</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {statistics.map(stat => {
                                        const isExpanded = expandedRows.has(stat.id);
                                        const growth = stat.growth || 0;
                                        const growthPercentage = stat.growth_percentage || 0;

                                        return (
                                            <React.Fragment key={stat.id}>
                                                <tr className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-[#002855]">{stat.year}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600">{stat.baptized_members}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600">{stat.confessing_members}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-[#002855] bg-gray-50/30">{stat.total_souls}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        {growth !== 0 ? (
                                                            <div className={`inline-flex items-center gap-1 ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                                <span className="font-bold">{growth > 0 ? '+' : ''}{growth}</span>
                                                                <span className="text-[10px]">({growthPercentage.toFixed(1)}%)</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleExpanded(stat.id)}
                                                            className="h-8 w-8 text-[#D4A84B]"
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </Button>
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr className="bg-gray-50/50">
                                                        <td colSpan={6} className="px-8 py-5">
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] uppercase font-bold text-gray-400">Vermeerdering</p>
                                                                    <div className="flex gap-4 text-sm">
                                                                        <p><span className="text-gray-500">Geboortes:</span> <span className="font-bold">{stat.births || 0}</span></p>
                                                                        <p><span className="text-gray-500">In:</span> <span className="font-bold">{stat.transfers_in || 0}</span></p>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] uppercase font-bold text-gray-400">Vermindering</p>
                                                                    <div className="flex gap-4 text-sm">
                                                                        <p><span className="text-gray-500">Sterftes:</span> <span className="font-bold">{stat.deaths || 0}</span></p>
                                                                        <p><span className="text-gray-500">Uit:</span> <span className="font-bold">{stat.transfers_out || 0}</span></p>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] uppercase font-bold text-gray-400">Bediening</p>
                                                                    <div className="flex gap-4 text-sm">
                                                                        <p><span className="text-gray-500">Dope:</span> <span className="font-bold">{stat.baptisms || 0}</span></p>
                                                                        <p><span className="text-gray-500">Belydenisse:</span> <span className="font-bold">{stat.confirmations || 0}</span></p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {stat.notes && (
                                                                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100 text-sm text-gray-600 italic">
                                                                    "{stat.notes}"
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal remains largely same but stylized */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-[#002855]/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <CardHeader className="bg-gray-50 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-[#002855]">Historiese Data Oplaai</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="year">Kalender Jaar *</Label>
                                    <Input
                                        id="year"
                                        type="number"
                                        value={formData.year}
                                        onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-[#002855]/5 rounded-xl border border-[#002855]/10 space-y-4">
                                <h3 className="font-bold text-[#002855] text-sm uppercase">Lidmaat Tellings</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Gedoopte (Nie-belydend)</Label>
                                        <Input
                                            type="number"
                                            value={formData.baptized_members}
                                            onChange={(e) => handleInputChange('baptized_members', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Belydende Lidmate</Label>
                                        <Input
                                            type="number"
                                            value={formData.confessing_members}
                                            onChange={(e) => handleInputChange('confessing_members', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Geboortes</Label>
                                    <Input type="number" value={formData.births} onChange={(e) => handleInputChange('births', parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sterftes</Label>
                                    <Input type="number" value={formData.deaths} onChange={(e) => handleInputChange('deaths', parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Dope</Label>
                                    <Input type="number" value={formData.baptisms} onChange={(e) => handleInputChange('baptisms', parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Belydenisse</Label>
                                    <Input type="number" value={formData.confirmations} onChange={(e) => handleInputChange('confirmations', parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Oordragte In</Label>
                                    <Input type="number" value={formData.transfers_in} onChange={(e) => handleInputChange('transfers_in', parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Oordragte Uit</Label>
                                    <Input type="number" value={formData.transfers_out} onChange={(e) => handleInputChange('transfers_out', parseInt(e.target.value) || 0)} />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                                    Kanselleer
                                </Button>
                                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#002855] hover:bg-[#003d7a]">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Stoor Jaar-data
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default StatisticsManagement;
