import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
    created_profiles: any[];
}

const StaffCSVImport: React.FC<{ onClose: () => void; onComplete: () => void }> = ({ onClose, onComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseCSV = (text: string): any[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows: any[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }

        return rows;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                setError('Slegs CSV lêers word aanvaar');
                return;
            }
            setFile(selectedFile);
            setError('');
            setResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Kies asseblief \'n CSV lêer');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Read and parse CSV
            const text = await file.text();
            const csvData = parseCSV(text);

            if (csvData.length === 0) {
                setError('CSV lêer is leeg of ongeldig');
                setLoading(false);
                return;
            }

            // Call Edge Function
            const { data, error: funcError } = await supabase.functions.invoke('import-staff-csv', {
                body: { csvData }
            });

            if (funcError) throw funcError;

            setResult(data as ImportResult);

            if (data.success > 0) {
                onComplete();
            }
        } catch (err: any) {
            console.error('Import error:', err);
            setError(err.message || 'Fout met CSV import');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = [
            'Gemeentelys',
            'Predikant Naam',
            'Predikant Titel',
            'Predikant Sel',
            'Predikant Epos',
            'Predikant Foto',
            'Skriba Naam',
            'Skriba Sel',
            'Skriba Epos',
            'Kassier Naam',
            'Kassier Sel',
            'Kassier Epos',
            'Orrelis Naam',
            'Orrelis Sel',
            'Orrelis Epos',
            'NHSV Naam',
            'NHSV Sel',
            'NHSV Epos'
        ].join(',');

        const example = [
            'NHKA Pretoria-Oos',
            'Johan van der Merwe',
            'Ds.',
            '082 123 4567',
            'johan@nhka.org',
            'https://example.com/photo.jpg',
            'Maria Botha',
            '083 234 5678',
            'maria@nhka.org',
            'Pieter Smit',
            '084 345 6789',
            'pieter@nhka.org',
            'Anna Venter',
            '085 456 7890',
            'anna@nhka.org',
            'Hannes du Toit',
            '086 567 8901',
            'hannes@nhka.org'
        ].join(',');

        const csv = `${headers}\n${example}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'staff_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Personeel CSV Import
                            </CardTitle>
                            <CardDescription>
                                Laai personeel data op vanaf GEMEENTE-INLIGTING.csv
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Template Download */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 mb-1">CSV Template</h3>
                                <p className="text-sm text-blue-800 mb-2">
                                    Laai die template af om die korrekte formaat te sien
                                </p>
                                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Laai Template Af
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Role Mapping Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Rol Toekenning</h3>
                        <ul className="text-sm space-y-1">
                            <li className="flex items-start gap-2">
                                <span className="text-purple-600">•</span>
                                <span><strong>Predikant:</strong> Kry 'minister' + 'admin' rolle</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <span><strong>Skriba:</strong> Kry 'admin' rol</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-gray-600">•</span>
                                <span><strong>Kassier, Orrelis, NHSV:</strong> Kry 'member' rol + portefeulje</span>
                            </li>
                        </ul>
                    </div>

                    {/* File Upload */}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                        >
                            {file ? (
                                <div className="flex flex-col items-center">
                                    <FileText className="w-12 h-12 text-blue-600 mb-2" />
                                    <p className="text-gray-900 font-medium">{file.name}</p>
                                    <p className="text-sm text-gray-500 mt-1">Klik om te verander</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                                    <p className="text-gray-600 font-medium">Klik om CSV lêer op te laai</p>
                                    <p className="text-sm text-gray-400 mt-1">Of sleep lêer hierheen</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-3">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-green-700 mb-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-semibold">Import Voltooi</span>
                                </div>
                                <div className="text-sm text-green-600">
                                    <p>✓ {result.success} profiele suksesvol geskep</p>
                                    {result.failed > 0 && (
                                        <p className="text-red-600">✗ {result.failed} gefaal</p>
                                    )}
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-yellow-900 mb-2">Foute:</h4>
                                    <ul className="text-sm text-yellow-800 space-y-1 max-h-40 overflow-y-auto">
                                        {result.errors.map((err, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-yellow-600">•</span>
                                                <span>{err}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Sluit
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={!file || loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Importeer...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Importeer CSV
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StaffCSVImport;
