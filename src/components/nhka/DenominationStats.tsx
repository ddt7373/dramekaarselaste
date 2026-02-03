import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, TrendingDown, Users, Download, Loader2, Globe, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const DenominationStats: React.FC = () => {
    const [stats, setStats] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        totalLidmate: 0,
        totalGemeentes: 0,
        groeiJaar: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDenomStats();
    }, []);

    const fetchDenomStats = async () => {
        try {
            setLoading(true);

            // Fetch all statistics from all congregations
            const { data: allStats, error } = await supabase
                .from('congregation_statistics')
                .select('*, gemeentes(naam)')
                .order('year', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            if (!allStats || allStats.length === 0) {
                console.log('No statistics found in the database');
                setStats([]);
                setLoading(false);
                return;
            }

            // Group by year for charts
            const yearGroups = allStats.reduce((acc: any, curr) => {
                const year = curr.year;
                if (!acc[year]) {
                    acc[year] = { year, belydend: 0, gedoop: 0, totaal: 0, count: 0 };
                }
                const belydend = curr.confessing_members || 0;
                const gedoop = curr.baptized_members || 0;
                acc[year].belydend += belydend;
                acc[year].gedoop += gedoop;
                acc[year].totaal += (belydend + gedoop);
                acc[year].count += 1;
                return acc;
            }, {});

            const chartData = Object.values(yearGroups);
            setStats(chartData);

            // Fetch current member count from profiles (real-time)
            const { count: memberCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('active', true);

            // Fetch congregation count
            const { count: gCount } = await supabase
                .from('gemeentes')
                .select('*', { count: 'exact', head: true })
                .eq('active', true);

            setSummary({
                totalLidmate: memberCount || 0,
                totalGemeentes: gCount || 0,
                groeiJaar: chartData.length >= 2 ?
                    (chartData[chartData.length - 1] as any).totaal - (chartData[chartData.length - 2] as any).totaal : 0
            });

        } catch (err) {
            console.error('Error fetching denomination stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportGlobalCSV = () => {
        if (stats.length === 0) return;

        const headers = ['Jaar', 'Totale Belydend', 'Totale Gedoop', 'Totaal Siele', 'Aantal Gemeentes Rapporteer'];
        const csvContent = [
            headers.join(','),
            ...stats.map((s: any) => [s.year, s.belydend, s.gedoop, s.totaal, s.count].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Denominasie_Statistieke.csv');
        link.click();
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#D4A84B]" /></div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#002855] text-white">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white/60 text-xs font-bold uppercase">Totale Lidmate</p>
                                <h3 className="text-3xl font-bold mt-1">{summary.totalLidmate.toLocaleString()}</h3>
                            </div>
                            <Users className="text-[#D4A84B] w-8 h-8 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase">Aktiewe Gemeentes</p>
                                <h3 className="text-3xl font-bold mt-1 text-[#002855]">{summary.totalGemeentes}</h3>
                            </div>
                            <Building2 className="text-[#D4A84B] w-8 h-8 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase">Jaarlikse Netto Groei</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <h3 className={`text-3xl font-bold ${summary.groeiJaar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {summary.groeiJaar >= 0 ? '+' : ''}{summary.groeiJaar}
                                    </h3>
                                    {summary.groeiJaar >= 0 ? <TrendingUp className="text-green-600" /> : <TrendingDown className="text-red-600" />}
                                </div>
                            </div>
                            <Globe className="text-[#D4A84B] w-8 h-8 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-[#002855]">Algehele Denominasie Tendense</CardTitle>
                        <CardDescription>Gekombineerde statistieke oor alle gemeentes</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportGlobalCSV}>
                        <Download className="w-4 h-4 mr-2" /> Export Global CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    {stats.length === 0 ? (
                        <div className="h-[350px] flex flex-col items-center justify-center text-gray-400">
                            <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                            <p>Stoor eers statistieke in 'n gemeente om denominasie-tendense te sien.</p>
                        </div>
                    ) : (
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats}>
                                    <defs>
                                        <linearGradient id="colorTotaal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#002855" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#002855" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="top" align="right" />
                                    <Area
                                        type="monotone"
                                        dataKey="totaal"
                                        name="Totale Siele"
                                        stroke="#002855"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorTotaal)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="belydend"
                                        name="Belydende Lidmate"
                                        stroke="#D4A84B"
                                        strokeWidth={2}
                                        fill="transparent"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DenominationStats;
