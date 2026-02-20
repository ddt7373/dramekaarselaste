import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Gebruiker } from '@/types/nhka';

interface HistoricalVBOImportProps {
    onClose: () => void;
    onComplete: () => void;
}

interface ParsedRecord {
    naam: string;
    van: string;
    jaar: number;
    punte: number;
    status: 'valid' | 'error';
    message?: string;
    predikant_id?: string;
}

export const HistoricalVBOImport: React.FC<HistoricalVBOImportProps> = ({ onClose, onComplete }) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const processFile = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            // 1. Fetch all predikante for matching
            // We accept 'predikant', 'emeritus', etc if they are in the system, but rol might be just 'predikant'
            const { data: predikante, error } = await supabase
                .from('gebruikers')
                .select('id, naam, van, rol')
                .in('rol', ['predikant', 'emeritus', 'diensleraar']); // Adjust roles as needed

            if (error) throw error;

            // 2. Read file
            const text = await file.text();
            const rows = text.split(/\r?\n/);

            const records: ParsedRecord[] = [];
            const headers = rows[0].toLowerCase().split(/[;,]/).map(h => h.trim());

            // Identify column indices
            const naamIdx = headers.findIndex(h => h.includes('naam'));
            const vanIdx = headers.findIndex(h => h.includes('van'));
            const jaarIdx = headers.findIndex(h => h.includes('jaar'));
            const punteIdx = headers.findIndex(h => h.includes('punt') || h.includes('krediet'));

            if (naamIdx === -1 || vanIdx === -1 || jaarIdx === -1 || punteIdx === -1) {
                throw new Error('CSV moet kolomme hê vir: Naam, Van, Jaar, Punte');
            }

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].split(/[;,]/).map(c => c.trim());
                if (row.length < 4 || !row[naamIdx]) continue;

                const naam = row[naamIdx];
                const van = row[vanIdx];
                const jaar = parseInt(row[jaarIdx]) || 0;
                const punte = parseFloat(row[punteIdx].replace(',', '.')) || 0;

                // Try to match predikant
                // Simple exact match on Name + Van. Can be improved with fuzzy search if needed.
                const predikant = predikante?.find(p =>
                    p.naam.toLowerCase().trim() === naam.toLowerCase().trim() &&
                    p.van.toLowerCase().trim() === van.toLowerCase().trim()
                );

                let status: 'valid' | 'error' = 'valid';
                let message = '';

                if (!predikant) {
                    // status = 'error'; // We now allow unmatched records
                    message = 'Sal gestoor word vir toekomstige gebruik';
                } else if (jaar < 1900 || jaar > 2100) {
                    status = 'error';
                    message = 'Ongeldige jaar';
                }

                records.push({
                    naam,
                    van,
                    jaar,
                    punte,
                    status,
                    message,
                    predikant_id: predikant?.id
                });
            }

            setParsedData(records);
            setStep('preview');

        } catch (err: any) {
            console.error(err);
            toast({
                title: "Fout met verwerking",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        const validRecords = parsedData.filter(r => r.status === 'valid');
        if (validRecords.length === 0) {
            toast({ title: "Geen geldige rekords om in te voer nie", variant: "destructive" });
            return;
        }

        setIsImporting(true);
        try {
            // Prepare bulk insert
            // Prepare bulk insert
            const insertData = validRecords.map(r => ({
                predikant_id: r.predikant_id || null, // Can be null now
                csv_naam: r.naam, // Store original names
                csv_van: r.van,
                jaar: r.jaar,
                punte: r.punte,
                beskrywing: r.predikant_id ? 'Historiese data invoer' : 'Ongekoppelde historiese data'
            }));

            const { error } = await supabase
                .from('vbo_historiese_punte')
                .insert(insertData);

            if (error) throw error;

            toast({
                title: "Sukses",
                description: `${validRecords.length} rekords suksesvol ingevoer.`
            });
            onComplete();
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Invoer Fout",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#002855]">Historiese VBO Krediete Invoer</h2>
                <Button variant="ghost" onClick={onClose}><XCircle className="w-5 h-5" /></Button>
            </div>

            {step === 'upload' ? (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        <p className="font-bold mb-2">Instruksies:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Laai 'n CSV lêer op.</li>
                            <li>Vereiste kolomme: <strong>Naam, Van, Jaar, Krediete</strong> (of Punte)</li>
                            <li>Rekords sonder 'n profiel sal gestoor word en outomaties gekoppel word wanneer die persoon registreer.</li>
                        </ul>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                {file ? (
                                    <p className="font-medium text-gray-900">{file.name}</p>
                                ) : (
                                    <p className="text-gray-500">Klik om CSV te kies</p>
                                )}
                            </div>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                            >
                                Kies Lêer
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose}>Kanselleer</Button>
                        <Button
                            onClick={processFile}
                            disabled={!file || isProcessing}
                            className="bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d]"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Verwerk CSV
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Voorskou ({parsedData.length} records)</h3>
                        <div className="flex gap-4 text-sm">
                            <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                {parsedData.filter(r => r.status === 'valid').length} Geldig
                            </span>
                            <span className="text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                {parsedData.filter(r => r.status === 'error').length} Foute
                            </span>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left">Naam</th>
                                    <th className="px-4 py-2 text-left">Van</th>
                                    <th className="px-4 py-2 text-left">Jaar</th>
                                    <th className="px-4 py-2 text-right">Krediete</th>
                                    <th className="px-4 py-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {parsedData.map((row, idx) => (
                                    <tr key={idx} className={row.status === 'error' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                        <td className="px-4 py-2">{row.naam}</td>
                                        <td className="px-4 py-2">{row.van}</td>
                                        <td className="px-4 py-2">{row.jaar}</td>
                                        <td className="px-4 py-2 text-right">{row.punte}</td>
                                        <td className="px-4 py-2 text-center">
                                            {row.status === 'error' ? (
                                                <span className="text-red-500 text-xs font-medium px-2 py-1 bg-red-100 rounded-full" title={row.message}>
                                                    {row.message}
                                                </span>
                                            ) : row.predikant_id ? (
                                                <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                            ) : (
                                                <span className="text-yellow-600 text-xs font-medium px-2 py-1 bg-yellow-100 rounded-full" title="Sal later gekoppel word">
                                                    Wag vir lidmaat
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setStep('upload')}>Terug</Button>
                        <Button
                            onClick={handleImport}
                            disabled={isImporting || parsedData.filter(r => r.status === 'valid').length === 0}
                            className="bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d]"
                        >
                            {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Voer In ({parsedData.filter(r => r.status === 'valid').length})
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
