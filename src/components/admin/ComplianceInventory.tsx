import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, CheckCircle, AlertCircle, Save, Loader2, Calendar, Search, Filter, Archive, History, FileCheck, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CongregationInventoryItem, InventoryFormat, InventoryCategory } from '@/types/congregation-admin';
import { STANDARD_INVENTORY_ITEMS, getFormatLabel, getFormatColor, getCategoryColor } from '@/types/congregation-admin';
import { useToast } from '@/hooks/use-toast';

interface ComplianceInventoryProps {
    congregationId: string;
}

const ComplianceInventory: React.FC<ComplianceInventoryProps> = ({ congregationId }) => {
    const { toast } = useToast();
    const [inventory, setInventory] = useState<CongregationInventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    useEffect(() => {
        fetchInventory();
    }, [congregationId]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('congregation_inventory')
                .select('*')
                .eq('congregation_id', congregationId)
                .order('item_category', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                setInventory(data);
            } else {
                // Initialize with standard items if none exist
                await initializeInventory();
            }
        } catch (err) {
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    const initializeInventory = async () => {
        const itemsToInsert = STANDARD_INVENTORY_ITEMS.map(item => ({
            congregation_id: congregationId,
            item_name: item.name,
            item_category: item.category,
            is_compliant: false
        }));

        const { data, error } = await supabase
            .from('congregation_inventory')
            .insert(itemsToInsert)
            .select();

        if (!error && data) {
            setInventory(data);
        }
    };

    const handleUpdateItem = async (itemId: string, updates: Partial<CongregationInventoryItem>) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('congregation_inventory')
                .update(updates)
                .eq('id', itemId);

            if (error) throw error;

            setInventory(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
            setEditingItemId(null);
            toast({ title: "Opgedateer", description: "Argief item rekord is gestoor." });
        } catch (err) {
            console.error('Error updating inventory item:', err);
            toast({ title: "Fout", description: "Kon nie item stoor nie.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'all' || item.item_category === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const completionStats = {
        total: inventory.length,
        compliant: inventory.filter(i => i.is_compliant).length,
        percent: Math.round((inventory.filter(i => i.is_compliant).length / (inventory.length || 1)) * 100)
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#002855] text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl">
                                <Archive className="w-6 h-6 text-[#D4A84B]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{completionStats.compliant} / {completionStats.total}</p>
                                <p className="text-xs text-white/60">Voldoen aan Argief-vereistes</p>
                            </div>
                        </div>
                        <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#D4A84B] transition-all duration-500"
                                style={{ width: `${completionStats.percent}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <History className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{inventory.filter(i => i.date_to).length}</p>
                                <p className="text-xs text-gray-500">Items met Datums op datum</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-xl">
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{completionStats.percent}%</p>
                                <p className="text-xs text-gray-500">Algehele Nakoming</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <CardTitle className="text-[#002855] flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#D4A84B]" />
                                Gemeente Argiewe & Inventaris
                            </CardTitle>
                            <CardDescription>Oorsig van alle registers en wetlike dokumentasie</CardDescription>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Soek argief..."
                                    className="pl-9 w-[200px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={activeFilter} onValueChange={setActiveFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Kategorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle</SelectItem>
                                    <SelectItem value="Registers">Registers</SelectItem>
                                    <SelectItem value="Minutes">Notules</SelectItem>
                                    <SelectItem value="Financial">Finansieel</SelectItem>
                                    <SelectItem value="Legal">Wetlik</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item / Register</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kategorie</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Datums</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Formaat</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksies</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin text-[#D4A84B] mx-auto" />
                                            <p className="mt-4 text-gray-500 font-medium">Laai argiefdata...</p>
                                        </td>
                                    </tr>
                                ) : filteredInventory.map((item) => (
                                    <InventoryItemRow
                                        key={item.id}
                                        item={item}
                                        isEditing={editingItemId === item.id}
                                        onEdit={() => setEditingItemId(item.id)}
                                        onCancelEdit={() => setEditingItemId(null)}
                                        onSave={(updates) => handleUpdateItem(item.id, updates)}
                                        saving={saving}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

interface InventoryItemRowProps {
    item: CongregationInventoryItem;
    isEditing: boolean;
    onEdit: () => void;
    onCancelEdit: () => void;
    onSave: (updates: Partial<CongregationInventoryItem>) => void;
    saving: boolean;
}

const InventoryItemRow: React.FC<InventoryItemRowProps> = ({ item, isEditing, onEdit, onCancelEdit, onSave, saving }) => {
    const [localItem, setLocalItem] = useState(item);

    useEffect(() => {
        setLocalItem(item);
    }, [item]);

    if (isEditing) {
        return (
            <tr className="bg-[#D4A84B]/5 animate-in fade-in duration-300">
                <td className="px-6 py-4">
                    <Input
                        value={localItem.item_name}
                        onChange={(e) => setLocalItem({ ...localItem, item_name: e.target.value })}
                        className="font-bold"
                    />
                </td>
                <td className="px-6 py-4">
                    <Badge className={getCategoryColor(localItem.item_category)}>{localItem.item_category}</Badge>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            className="w-32 text-xs"
                            value={localItem.date_from || ''}
                            onChange={(e) => setLocalItem({ ...localItem, date_from: e.target.value })}
                        />
                        <span className="text-gray-400">tot</span>
                        <Input
                            type="date"
                            className="w-32 text-xs"
                            value={localItem.date_to || ''}
                            onChange={(e) => setLocalItem({ ...localItem, date_to: e.target.value })}
                        />
                    </div>
                </td>
                <td className="px-6 py-4">
                    <Select
                        value={localItem.format}
                        onValueChange={(v: any) => setLocalItem({ ...localItem, format: v })}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paper">Papier</SelectItem>
                            <SelectItem value="electronic">Elektronies</SelectItem>
                            <SelectItem value="both">Beide</SelectItem>
                        </SelectContent>
                    </Select>
                </td>
                <td className="px-6 py-4">
                    <Button
                        variant={localItem.is_compliant ? "default" : "outline"}
                        size="sm"
                        className={localItem.is_compliant ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={() => setLocalItem({ ...localItem, is_compliant: !localItem.is_compliant })}
                    >
                        {localItem.is_compliant ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                        {localItem.is_compliant ? 'Voldoen' : 'Ontbreek'}
                    </Button>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                        <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => onSave(localItem)} disabled={saving} className="bg-[#002855]">
                        <Save className="w-4 h-4" />
                    </Button>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-gray-50/50 transition-colors">
            <td className="px-6 py-4">
                <p className="font-bold text-[#002855]">{item.item_name}</p>
                {item.compliance_notes && <p className="text-xs text-gray-500 mt-1">{item.compliance_notes}</p>}
            </td>
            <td className="px-6 py-4">
                <Badge className={`${getCategoryColor(item.item_category)} border-none`}>{item.item_category}</Badge>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                {item.date_from ? (
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#D4A84B]" />
                        <span>{new Date(item.date_from).getFullYear()} - {item.date_to ? new Date(item.date_to).getFullYear() : 'Hede'}</span>
                    </div>
                ) : <span className="text-gray-300">-</span>}
            </td>
            <td className="px-6 py-4">
                <Badge variant="outline" className={`${getFormatColor(item.format)} border-none`}>
                    {getFormatLabel(item.format)}
                </Badge>
            </td>
            <td className="px-6 py-4">
                {item.is_compliant ? (
                    <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                        <CheckCircle className="w-4 h-4" />
                        VOLDOEN
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-red-500 font-bold text-xs">
                        <AlertCircle className="w-4 h-4" />
                        ONTBREEK
                    </div>
                )}
            </td>
            <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="sm" onClick={onEdit} className="text-[#002855] hover:text-[#D4A84B]">
                    <Edit className="w-4 h-4" />
                </Button>
            </td>
        </tr>
    );
};

const Edit = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
);

export default ComplianceInventory;
