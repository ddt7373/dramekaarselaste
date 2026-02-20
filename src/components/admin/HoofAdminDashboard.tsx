import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Church,
    Users,
    CheckCircle,
    Download,
    Loader2,
    Calendar,
    Phone,
    Mail,
    AlertTriangle,
    TrendingUp,
    EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GemeenteSummary {
    id: string;
    naam: string;
    ring?: string;
    stigtingsdatum?: string;
    erediens_tye?: string;
    last_data_update?: string;
    latest_total_souls?: number;
    latest_baptized?: number;
    latest_confessing?: number;
    latest_stats_year?: number;
    predikant_naam?: string;
    predikant_sel?: string;
    predikant_epos?: string;
    skriba_naam?: string;
    skriba_sel?: string;
    skriba_epos?: string;
    total_inventory_items?: number;
    compliant_items?: number;
    is_fully_compliant?: boolean;
    sluit_uit_van_statistiek?: boolean;
}

const HoofAdminDashboard: React.FC = () => {
    const { toast } = useToast();
    const [gemeentes, setGemeentes] = useState<GemeenteSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [stats, setStats] = useState({
        totalGemeentes: 0,
        totalSouls: 0,
        compliantGemeentes: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch gemeente summaries
            const { data: gemeenteData, error: gemeenteError } = await supabase
                .from('hoof_admin_gemeente_summary')
                .select('*')
                .order('naam');

            if (gemeenteError) throw gemeenteError;

            // Fetch extra fields from gemeentes table for exclusion flag
            const { data: gemeentesExtra, error: extraError } = await supabase
                .from('gemeentes')
                .select('id, sluit_uit_van_statistiek');

            if (extraError) console.error("Error fetching extra fields", extraError);

            const mergedData = (gemeenteData || []).map(g => {
                const extra = gemeentesExtra?.find(e => e.id === g.id);
                return { ...g, sluit_uit_van_statistiek: extra?.sluit_uit_van_statistiek };
            });

            setGemeentes(mergedData);

            // Calculate stats
            const totalGemeentes = mergedData.length;
            const totalSouls = mergedData
                .filter(g => !g.sluit_uit_van_statistiek)
                .reduce((sum, g) => sum + (g.latest_total_souls || 0), 0) || 0;
            const compliantGemeentes = mergedData.filter(g => g.is_fully_compliant).length;

            setStats({
                totalGemeentes,
                totalSouls,
                compliantGemeentes
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleExclusion = async (gemeente: GemeenteSummary) => {
        try {
            const newValue = !gemeente.sluit_uit_van_statistiek;

            // Optimistic update
            const updatedGemeentes = gemeentes.map(g =>
                g.id === gemeente.id ? { ...g, sluit_uit_van_statistiek: newValue } : g
            );
            setGemeentes(updatedGemeentes);

            // Recalculate stats
            const totalGemeentes = updatedGemeentes.length;
            const totalSouls = updatedGemeentes
                .filter(g => !g.sluit_uit_van_statistiek)
                .reduce((sum, g) => sum + (g.latest_total_souls || 0), 0) || 0;
            const compliantGemeentes = updatedGemeentes.filter(g => g.is_fully_compliant).length;

            setStats({ totalGemeentes, totalSouls, compliantGemeentes });

            const { error } = await supabase
                .from('gemeentes')
                .update({ sluit_uit_van_statistiek: newValue })
                .eq('id', gemeente.id);

            if (error) throw error;

            toast({ title: "Sukses", description: "Instelling opgedateer" });
        } catch (err) {
            console.error(err);
            toast({ title: "Fout", description: "Kon nie opdateer nie", variant: "destructive" });
            fetchDashboardData(); // Revert
        }
    };

    const exportAlmanakData = async () => {
        setExporting(true);
        try {
            // Prepare CSV data
            const headers = [
                'Gemeente Naam',
                'Ring',
                'Stigtingsdatum',
                'Erediens Tye',
                'Predikant Naam',
                'Predikant Sel',
                'Predikant Epos',
                'Skriba Naam',
                'Skriba Sel',
                'Skriba Epos',
                'Totale Lidmate',
                'Belydende Lidmate',
                'Doop Lidmate',
                'Statistiek Jaar'
            ].join(',');

            const rows = gemeentes.map(g => [
                `"${g.naam || ''}"`,
                `"${g.ring || ''}"`,
                g.stigtingsdatum || '',
                `"${g.erediens_tye || ''}"`,
                `"${g.predikant_naam || ''}"`,
                g.predikant_sel || '',
                g.predikant_epos || '',
                `"${g.skriba_naam || ''}"`,
                g.skriba_sel || '',
                g.skriba_epos || '',
                g.latest_total_souls || 0,
                g.latest_confessing || 0,
                g.latest_baptized || 0,
                g.latest_stats_year || ''
            ].join(','));

            const csv = [headers, ...rows].join('\n');

            // Download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `almanak_data_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting almanak data:', err);
            alert('Kon nie data eksporteer nie');
        } finally {
            setExporting(false);
        }
    };

    const exportComplianceReport = async () => {
        setExporting(true);
        try {
            // Fetch non-compliant items
            const { data, error } = await supabase
                .from('non_compliant_inventory')
                .select('*')
                .order('gemeente_naam');

            if (error) throw error;

            // Prepare CSV
            const headers = [
                'Gemeente Naam',
                'Item Naam',
                'Kategorie',
                'Van Datum',
                'Tot Datum',
                'Formaat',
                'Voldoen',
                'Probleem Tipe',
                'Notas'
            ].join(',');

            const rows = (data || []).map(item => [
                `"${item.gemeente_naam || ''}"`,
                `"${item.item_name || ''}"`,
                `"${item.item_category || ''}"`,
                item.date_from || '',
                item.date_to || '',
                item.format || '',
                item.is_compliant ? 'Ja' : 'Nee',
                `"${item.issue_type || ''}"`,
                `"${item.compliance_notes || ''}"`
            ].join(','));

            const csv = [headers, ...rows].join('\n');

            // Download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `inventaris_verslag_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting compliance report:', err);
            alert('Kon nie verslag eksporteer nie');
        } finally {
            setExporting(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('af-ZA');
    };

    const getComplianceColor = (isCompliant?: boolean) => {
        return isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#002855]">Hoof Admin Dashboard</h1>
                    <p className="text-gray-500">Oorsig van alle gemeentes in die kerk</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={exportComplianceReport}
                        disabled={exporting}
                        variant="outline"
                    >
                        {exporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        Laai Inventaris Verslag Af
                    </Button>
                    <Button
                        onClick={exportAlmanakData}
                        disabled={exporting}
                        className="bg-[#D4A84B] hover:bg-[#c49a3d] text-[#002855]"
                    >
                        {exporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        Laai Almanak Data Af
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                                <Church className="w-6 h-6 text-[#002855]" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-[#002855]">{stats.totalGemeentes}</p>
                                <p className="text-sm text-gray-500">Geregistreerde Gemeentes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#7A8450]/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-[#7A8450]" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-[#7A8450]">
                                    {stats.totalSouls.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500">Totale Sieletal (Kerk)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-green-600">{stats.compliantGemeentes}</p>
                                <p className="text-sm text-gray-500">Voldoende Gemeentes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gemeentes Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Alle Gemeentes</CardTitle>
                    <CardDescription>
                        Oorsig van alle gemeentes met hul predikante en laaste opdatering
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Gemeente
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Predikant
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Kontak
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Lidmate
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                Nakoming
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                Sluit Uit
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Laaste Opdatering
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {gemeentes.map(gemeente => (
                                            <tr key={gemeente.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{gemeente.naam}</p>
                                                        {gemeente.ring && (
                                                            <p className="text-sm text-gray-500">{gemeente.ring}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="text-gray-900">{gemeente.predikant_naam || '-'}</p>
                                                        {gemeente.skriba_naam && (
                                                            <p className="text-sm text-gray-500">
                                                                Skriba: {gemeente.skriba_naam}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        {gemeente.predikant_sel && (
                                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                <Phone className="w-3 h-3" />
                                                                {gemeente.predikant_sel}
                                                            </div>
                                                        )}
                                                        {gemeente.predikant_epos && (
                                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                <Mail className="w-3 h-3" />
                                                                {gemeente.predikant_epos}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {gemeente.latest_total_souls?.toLocaleString() || '-'}
                                                        </p>
                                                        {gemeente.latest_stats_year && (
                                                            <p className="text-xs text-gray-500">({gemeente.latest_stats_year})</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge className={getComplianceColor(gemeente.is_fully_compliant)}>
                                                        {gemeente.is_fully_compliant ? (
                                                            <><CheckCircle className="w-3 h-3 mr-1" /> Voldoen</>
                                                        ) : (
                                                            <><AlertTriangle className="w-3 h-3 mr-1" /> Nie Voldoen</>
                                                        )}
                                                    </Badge>
                                                    {gemeente.total_inventory_items && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {gemeente.compliant_items}/{gemeente.total_inventory_items}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center" title="Sluit uit van statistiek">
                                                        <input
                                                            type="checkbox"
                                                            checked={gemeente.sluit_uit_van_statistiek || false}
                                                            onChange={() => handleToggleExclusion(gemeente)}
                                                            className="w-4 h-4 rounded border-gray-300 text-[#002855] focus:ring-[#002855]"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(gemeente.last_data_update)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {gemeentes.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    Geen gemeentes gevind nie
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default HoofAdminDashboard;
