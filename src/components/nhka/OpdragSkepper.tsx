import React, { useState } from 'react';
import { LMSLes, LMSBylae } from '@/types/nhka';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Save, FileUp, Trash2, File as FileIcon } from 'lucide-react';

interface OpdragSkepperProps {
    les: LMSLes;
    onUpdate: () => void;
}

const OpdragSkepper: React.FC<OpdragSkepperProps> = ({ les, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [punte, setPunte] = useState(les.maksimum_punte || 100);
    const [instructions, setInstructions] = useState(les.inhoud || '');
    const [bylaes, setBylaes] = useState<LMSBylae[]>(les.bylaes || []);
    const [uploading, setUploading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('lms_lesse')
                .update({
                    maksimum_punte: punte,
                    inhoud: instructions,
                    bylaes: bylaes
                })
                .eq('id', les.id);

            if (error) throw error;
            toast.success('Opdrag gestoor');
            onUpdate();
        } catch (error) {
            console.error('Error saving assignment:', error);
            toast.error('Kon nie opdrag stoor nie');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `opdrag_bylaes/${les.id}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('lms-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('lms-assets')
                .getPublicUrl(filePath);

            const newBylae: LMSBylae = {
                titel: file.name,
                url: publicUrl,
                tipe: file.type,
                grootte: file.size
            };

            const updatedBylaes = [...bylaes, newBylae];
            setBylaes(updatedBylaes);

            // Auto save after upload
            await supabase
                .from('lms_lesse')
                .update({ bylaes: updatedBylaes })
                .eq('id', les.id);

            toast.success('Lêer opgelaai');
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Kon nie lêer oplaai nie');
        } finally {
            setUploading(false);
        }
    };

    const removeBylae = async (index: number) => {
        const updatedBylaes = bylaes.filter((_, i) => i !== index);
        setBylaes(updatedBylaes);
        // Auto save removal
        try {
            await supabase.from('lms_lesse').update({ bylaes: updatedBylaes }).eq('id', les.id);
            toast.success('Bylae verwyder');
        } catch (e) {
            toast.error('Fout met verwydering');
        }
    };

    return (
        <Card className="mt-6 border-blue-100 bg-blue-50/30">
            <CardHeader>
                <CardTitle className="text-lg text-[#002855]">Opdrag Instellings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="instruksies">Opdrag Instruksies</Label>
                    <Textarea
                        id="instruksies"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="min-h-[150px] bg-white"
                        placeholder="Beskryf wat van die student verwag word..."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="punte">Maksimum Punte</Label>
                    <Input
                        id="punte"
                        type="number"
                        value={punte}
                        onChange={(e) => setPunte(Number(e.target.value))}
                        className="bg-white max-w-[200px]"
                    />
                </div>

                <div className="space-y-4">
                    <Label>Hulpbronne / Bylaes</Label>
                    <div className="grid gap-2">
                        {bylaes.map((bylae, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border">
                                <div className="flex items-center gap-3">
                                    <FileIcon className="w-4 h-4 text-gray-500" />
                                    <a href={bylae.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                                        {bylae.titel}
                                    </a>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => removeBylae(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                            id="file-upload"
                        />
                        <Button variant="outline" type="button" disabled={uploading} asChild>
                            <label htmlFor="file-upload" className="cursor-pointer">
                                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
                                Laai Hulpbron Op
                            </label>
                        </Button>
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <Button onClick={handleSave} disabled={loading} className="bg-[#002855]">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        Stoor Opdrag
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default OpdragSkepper;
