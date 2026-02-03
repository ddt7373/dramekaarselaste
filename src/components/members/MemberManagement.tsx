import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Search, Edit, Plus, X, Save, Loader2, UserMinus, UserCheck, Heart, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MemberProfile, AppRole } from '@/types/member-profiles';
import { getRoleLabel, getRoleBadgeColor } from '@/types/member-profiles';
import { useToast } from '@/hooks/use-toast';

interface MemberManagementProps {
    congregationId: string;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ congregationId }) => {
    const { toast } = useToast();
    const [members, setMembers] = useState<MemberProfile[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<MemberProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);
    const [saving, setSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, [congregationId]);

    useEffect(() => {
        if (searchTerm.trim()) {
            const filtered = members.filter(m =>
                `${m.first_name} ${m.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.cellphone?.includes(searchTerm) ||
                m.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredMembers(filtered);
        } else {
            setFilteredMembers(members);
        }
    }, [searchTerm, members]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('congregation_id', congregationId)
                .order('surname');

            if (error) throw error;

            const mapped: MemberProfile[] = (data || []).map(p => ({
                id: p.id,
                user_id: p.user_id,
                congregation_id: p.congregation_id,
                first_name: p.first_name || '',
                surname: p.surname || '',
                cellphone: p.cellphone || '',
                email: p.email || '',
                title: p.title || p.titel || '',
                date_of_birth: p.date_of_birth,
                address_street: p.address_street || p.straatadres,
                address_suburb: p.address_suburb || p.voorstad,
                address_city: p.address_city || p.stad,
                address_code: p.address_code || p.poskode,
                app_roles: p.app_roles || ['member'],
                portfolio: p.portfolio,
                photo_url: p.photo_url,
                lidmaat_status: p.lidmaat_status || 'aktief',
                active: p.active ?? true,
                created_at: p.created_at,
                updated_at: p.updated_at
            }));

            setMembers(mapped);
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (member: MemberProfile) => {
        setEditingMember({ ...member });
        setIsAdding(false);
    };

    const handleAdd = () => {
        const newMember: any = {
            id: '',
            congregation_id: congregationId,
            first_name: '',
            surname: '',
            cellphone: '',
            email: '',
            title: '',
            app_roles: ['member'],
            lidmaat_status: 'aktief',
            active: true
        };
        setEditingMember(newMember);
        setIsAdding(true);
    };

    const handleSave = async () => {
        if (!editingMember) return;
        if (!editingMember.first_name || !editingMember.surname) {
            toast({ title: "Fout", description: "Naam en Van is verpligtend", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            if (isAdding) {
                const { data, error } = await supabase
                    .from('profiles')
                    .insert([{
                        congregation_id: congregationId,
                        first_name: editingMember.first_name,
                        surname: editingMember.surname,
                        cellphone: editingMember.cellphone,
                        email: editingMember.email,
                        title: editingMember.title,
                        date_of_birth: editingMember.date_of_birth,
                        address_street: editingMember.address_street,
                        address_suburb: editingMember.address_suburb,
                        address_city: editingMember.address_city,
                        address_code: editingMember.address_code,
                        portfolio: editingMember.portfolio,
                        app_roles: editingMember.app_roles,
                        lidmaat_status: editingMember.lidmaat_status || 'aktief',
                        active: true
                    }])
                    .select()
                    .single();

                if (error) throw error;
                toast({ title: "Sukses", description: "Lidmaat bygevoeg" });
                fetchMembers();
            } else {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        first_name: editingMember.first_name,
                        surname: editingMember.surname,
                        cellphone: editingMember.cellphone,
                        email: editingMember.email,
                        title: editingMember.title,
                        date_of_birth: editingMember.date_of_birth,
                        address_street: editingMember.address_street,
                        address_suburb: editingMember.address_suburb,
                        address_city: editingMember.address_city,
                        address_code: editingMember.address_code,
                        portfolio: editingMember.portfolio,
                        app_roles: editingMember.app_roles,
                        lidmaat_status: editingMember.lidmaat_status
                    })
                    .eq('id', editingMember.id);

                if (error) throw error;
                toast({ title: "Sukses", description: "Lidmaat opgedateer" });
                setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m));
            }
            setEditingMember(null);
        } catch (err: any) {
            console.error('Error saving member:', err);
            toast({ title: "Fout", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: keyof MemberProfile, value: any) => {
        setEditingMember(prev => prev ? { ...prev, [field]: value } : null);
    };

    const getCompletionPercentage = (member: MemberProfile): number => {
        const fields = [
            member.title,
            member.date_of_birth,
            member.address_street,
            member.address_city,
            member.address_code
        ];
        const filled = fields.filter(f => f && f.toString().trim()).length;
        return Math.round((filled / fields.length) * 100);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-[#002855]">
                                <Users className="w-5 h-5" />
                                Lidmaatregister
                            </CardTitle>
                            <CardDescription>
                                Intydse bestuur van gemeentelede
                            </CardDescription>
                        </div>
                        <Button onClick={handleAdd} className="bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d]">
                            <Plus className="w-4 h-4 mr-2" />
                            Voeg Lidmaat By
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Soek op naam, van, selfoon..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#D4A84B]" />
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden border-gray-100 shadow-sm">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lidmaat</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Kontak</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Volledigheid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksies</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredMembers.map(member => {
                                        const completion = getCompletionPercentage(member);
                                        const isDeceased = member.lidmaat_status === 'oorlede';

                                        return (
                                            <tr key={member.id} className={`hover:bg-gray-50/50 transition-colors ${isDeceased ? 'opacity-60 grayscale' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-bold text-[#002855]">
                                                            {member.title && <span className="text-gray-400 font-normal mr-1">{member.title}</span>}
                                                            {member.first_name} {member.surname}
                                                        </p>
                                                        {member.portfolio && (
                                                            <p className="text-xs text-[#D4A84B] font-medium">{member.portfolio}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge className={
                                                        member.lidmaat_status === 'aktief' ? 'bg-green-100 text-green-700' :
                                                            member.lidmaat_status === 'oorlede' ? 'bg-gray-100 text-gray-700' :
                                                                'bg-amber-100 text-amber-700'
                                                    }>
                                                        {member.lidmaat_status?.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                                                    {member.cellphone || member.email || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
                                                            <div
                                                                className={`h-1.5 rounded-full ${completion === 100 ? 'bg-green-500' : completion >= 50 ? 'bg-[#D4A84B]' : 'bg-red-400'}`}
                                                                style={{ width: `${completion}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-medium text-gray-500">{completion}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(member)}
                                                        className="text-[#002855] hover:text-[#D4A84B]"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit/Add Modal */}
            {editingMember && (
                <div className="fixed inset-0 z-50 bg-[#002855]/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
                        <CardHeader className="border-b bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-[#002855]">{isAdding ? 'Nuwe Lidmaat' : 'Wysig Profiel'}</CardTitle>
                                    <CardDescription>{isAdding ? 'Skepping van nuwe lidmaat rekord' : `${editingMember.first_name} ${editingMember.surname}`}</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setEditingMember(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            {/* Status Section */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <Label className="text-xs font-bold uppercase text-gray-500 mb-3 block">Lidmaat Status & Titel</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Titel</Label>
                                        <Select
                                            value={editingMember.title || ''}
                                            onValueChange={(v) => handleInputChange('title', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Kies Titel" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Mnr.">Mnr.</SelectItem>
                                                <SelectItem value="Mev.">Mev.</SelectItem>
                                                <SelectItem value="Mej.">Mej.</SelectItem>
                                                <SelectItem value="Dr.">Dr.</SelectItem>
                                                <SelectItem value="Prof.">Prof.</SelectItem>
                                                <SelectItem value="Ds.">Ds.</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={editingMember.lidmaat_status || 'aktief'}
                                            onValueChange={(v) => handleInputChange('lidmaat_status', v)}
                                        >
                                            <SelectTrigger className={editingMember.lidmaat_status === 'oorlede' ? 'border-red-300 bg-red-50 text-red-700' : ''}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="aktief">Aktief</SelectItem>
                                                <SelectItem value="oorlede">Oorlede (Vermindering)</SelectItem>
                                                <SelectItem value="verhuis">Verhuis (Vermindering)</SelectItem>
                                                <SelectItem value="bedank">Bedank (Vermindering)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Naam *</Label>
                                    <Input
                                        value={editingMember.first_name}
                                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Van *</Label>
                                    <Input
                                        value={editingMember.surname}
                                        onChange={(e) => handleInputChange('surname', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Selfoon</Label>
                                    <Input
                                        value={editingMember.cellphone || ''}
                                        onChange={(e) => handleInputChange('cellphone', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>E-pos</Label>
                                    <Input
                                        type="email"
                                        value={editingMember.email || ''}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Geboortedatum</Label>
                                <Input
                                    type="date"
                                    value={editingMember.date_of_birth || ''}
                                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-sm text-[#002855] border-b pb-1 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Woonadres
                                </h3>
                                <Input
                                    placeholder="Straatadres"
                                    value={editingMember.address_street || ''}
                                    onChange={(e) => handleInputChange('address_street', e.target.value)}
                                />
                                <div className="grid grid-cols-3 gap-4">
                                    <Input
                                        placeholder="Voorstad"
                                        value={editingMember.address_suburb || ''}
                                        onChange={(e) => handleInputChange('address_suburb', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Stad"
                                        value={editingMember.address_city || ''}
                                        onChange={(e) => handleInputChange('address_city', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Poskode"
                                        value={editingMember.address_code || ''}
                                        onChange={(e) => handleInputChange('address_code', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Portefeulje (bv. Kassier, Orrelis)</Label>
                                <Input
                                    value={editingMember.portfolio || ''}
                                    onChange={(e) => handleInputChange('portfolio', e.target.value)}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-6 border-t">
                                <Button variant="outline" onClick={() => setEditingMember(null)} className="flex-1">
                                    Kanselleer
                                </Button>
                                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#002855] hover:bg-[#003d7a]">
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Besig om te stoor...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {isAdding ? 'Voeg Lidmaat By' : 'Stoor Veranderinge'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default MemberManagement;
