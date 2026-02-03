import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Church, User, Mail, Phone, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Congregation, MemberProfile } from '@/types/member-profiles';

interface UserOnboardingProps {
    userId: string; // Authenticated user ID
    onComplete: (profile: MemberProfile) => void;
}

const UserOnboarding: React.FC<UserOnboardingProps> = ({ userId, onComplete }) => {
    const [step, setStep] = useState<'congregation' | 'profile' | 'complete'>('congregation');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Data
    const [congregations, setCongregations] = useState<Congregation[]>([]);
    const [selectedCongregationId, setSelectedCongregationId] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        cellphone: '',
        email: ''
    });

    // Fetch congregations on mount
    useEffect(() => {
        fetchCongregations();
    }, []);

    const fetchCongregations = async () => {
        try {
            const { data, error } = await supabase
                .from('gemeentes')
                .select('*')
                .eq('aktief', true)
                .order('naam');

            if (error) throw error;

            // Map to Congregation type
            const mapped: Congregation[] = (data || []).map(g => ({
                id: g.id,
                name: g.naam,
                description: g.beskrywing,
                address: g.adres,
                phone: g.telefoon,
                email: g.epos,
                website: g.webwerf,
                logo_url: g.logo_url,
                active: g.aktief,
                created_at: g.created_at,
                updated_at: g.updated_at
            }));

            setCongregations(mapped);
        } catch (err: any) {
            console.error('Error fetching congregations:', err);
            setError('Kon nie gemeentes laai nie');
        }
    };

    const handleCongregationSelect = () => {
        if (!selectedCongregationId) {
            setError('Kies asseblief \'n gemeente');
            return;
        }
        setError('');
        setStep('profile');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const validateForm = (): boolean => {
        if (!formData.first_name.trim()) {
            setError('Naam is verplig');
            return false;
        }
        if (!formData.last_name.trim()) {
            setError('Van is verplig');
            return false;
        }
        if (!formData.cellphone.trim()) {
            setError('Selfoon is verplig');
            return false;
        }
        if (!formData.email.trim()) {
            setError('E-pos is verplig');
            return false;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Ongeldige e-pos adres');
            return false;
        }
        return true;
    };

    const handleProfileSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            // Create profile
            const profileData = {
                user_id: userId,
                congregation_id: selectedCongregationId,
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                cellphone: formData.cellphone.trim(),
                email: formData.email.trim(),
                app_roles: ['member'], // Default role
                active: true
            };

            const { data, error } = await supabase
                .from('profiles')
                .insert([profileData])
                .select()
                .single();

            if (error) throw error;

            // Map to MemberProfile type
            const profile: MemberProfile = {
                id: data.id,
                user_id: data.user_id,
                congregation_id: data.congregation_id,
                first_name: data.first_name,
                last_name: data.last_name,
                cellphone: data.cellphone,
                email: data.email,
                app_roles: data.app_roles,
                active: data.active,
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            setStep('complete');
            setTimeout(() => onComplete(profile), 2000);
        } catch (err: any) {
            console.error('Error creating profile:', err);
            setError(err.message || 'Kon nie profiel skep nie');
        } finally {
            setLoading(false);
        }
    };

    const selectedCongregation = congregations.find(c => c.id === selectedCongregationId);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Welkom!</CardTitle>
                    <CardDescription className="text-center">
                        Kom ons stel jou profiel op
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'congregation' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                            }`}>
                            {step === 'congregation' ? '1' : <CheckCircle className="w-5 h-5" />}
                        </div>
                        <div className={`w-12 h-1 ${step !== 'congregation' ? 'bg-green-600' : 'bg-gray-300'}`} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'profile' ? 'bg-blue-600 text-white' : step === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                            }`}>
                            {step === 'complete' ? <CheckCircle className="w-5 h-5" /> : '2'}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Congregation Selection */}
                    {step === 'congregation' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Church className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Kies Jou Gemeente</h3>
                                    <p className="text-sm text-gray-500">Waar is jy 'n lidmaat?</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="congregation">Gemeente *</Label>
                                <Select value={selectedCongregationId} onValueChange={setSelectedCongregationId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kies gemeente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {congregations.map(cong => (
                                            <SelectItem key={cong.id} value={cong.id}>
                                                {cong.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleCongregationSelect}
                                className="w-full"
                                disabled={!selectedCongregationId}
                            >
                                Volgende
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Profile Creation */}
                    {step === 'profile' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Jou Besonderhede</h3>
                                    <p className="text-sm text-gray-500">{selectedCongregation?.name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">Naam *</Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        placeholder="Johan"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Van *</Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        placeholder="van der Merwe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cellphone">
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    Selfoon *
                                </Label>
                                <Input
                                    id="cellphone"
                                    name="cellphone"
                                    type="tel"
                                    value={formData.cellphone}
                                    onChange={handleInputChange}
                                    placeholder="082 123 4567"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    E-pos *
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="johan@example.com"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('congregation')}
                                    className="flex-1"
                                >
                                    Terug
                                </Button>
                                <Button
                                    onClick={handleProfileSubmit}
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Besig...
                                        </>
                                    ) : (
                                        'Voltooi'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Complete */}
                    {step === 'complete' && (
                        <div className="text-center space-y-4 py-8">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    Welkom, {formData.first_name}!
                                </h3>
                                <p className="text-gray-600">
                                    Jou profiel is suksesvol geskep
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UserOnboarding;
