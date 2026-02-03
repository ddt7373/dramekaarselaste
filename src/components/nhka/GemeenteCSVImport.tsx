import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CSVRow {
    [key: string]: string;
}

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

// CSV Header to Database Column Mapping
// Maps CSV headers from Head Office to database columns
const COLUMN_MAPPING: Record<string, string> = {
    'Gemeentelys': 'naam',
    'Beskrywing': 'beskrywing',
    'Straatadres': 'adres',
    'Gemeente Kerkkantoor Landlyn': 'telefoon',
    'Hoof epos': 'epos',
    'Webwerf': 'webwerf'
};

const GemeenteCSVImport: React.FC<{ onClose: () => void; onComplete: () => void }> = ({ onClose, onComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseCSV = (text: string): CSVRow[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows: CSVRow[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: CSVRow = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }

        return rows;
    };

    const mapCSVRowToDatabase = (row: CSVRow): any => {
        const dbRow: any = {};

        Object.entries(COLUMN_MAPPING).forEach(([csvHeader, dbColumn]) => {
            const value = row[csvHeader];
            if (value && value.trim()) {
                dbRow[dbColumn] = value.trim();
            }
        });

        return dbRow;
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
            // Read file
            const text = await file.text();
            const rows = parseCSV(text);

            if (rows.length === 0) {
                setError('CSV lêer is leeg of ongeldig');
                setLoading(false);
                return;
            }

            let successCount = 0;
            let failedCount = 0;
            const errors: string[] = [];

            // Process each row
            for (const row of rows) {
                const dbRow = mapCSVRowToDatabase(row);

                if (!dbRow.naam) {
                    errors.push(`Ry oorgesla: Geen gemeente naam nie`);
                    failedCount++;
                    continue;
                }

                try {
                    // Check if congregation exists
                    const { data: existing } = await supabase
                        .from('gemeentes')
                        .select('id')
                        .eq('naam', dbRow.naam)
                        .single();

                    if (existing) {
                        // UPDATE existing record
                        const { error: updateError } = await supabase
                            .from('gemeentes')
                            .update(dbRow)
                            .eq('id', existing.id);

                        if (updateError) {
                            errors.push(`${dbRow.naam}: ${updateError.message}`);
                            failedCount++;
                        } else {
                            successCount++;
                        }
                    } else {
                        // INSERT new record
                        const { error: insertError } = await supabase
                            .from('gemeentes')
                            .insert([dbRow]);

                        if (insertError) {
                            errors.push(`${dbRow.naam}: ${insertError.message}`);
                            failedCount++;
                        } else {
                            successCount++;
                        }
                    }
                } catch (err: any) {
                    errors.push(`${dbRow.naam}: ${err.message}`);
                    failedCount++;
                }
            }

            setResult({
                success: successCount,
                failed: failedCount,
                errors: errors.slice(0, 10) // Show first 10 errors only
            });

            if (successCount > 0) {
                onComplete();
            }
        } catch (err: any) {
            setError(err.message || 'Fout met CSV verwerking');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = Object.keys(COLUMN_MAPPING).join(',');
        const example = 'NHKA Pretoria-Oos,Gemeente in Pretoria-Oos,Kerkstraat 123,012 345 6789,info@nhka-pta.org,https://www.nhka-pta.org';
        const csv = `${headers}\n${example}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gemeente_template.csv';
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
                                Gemeente CSV Import
                            </CardTitle>
                            <CardDescription>
                                Laai 'n CSV lêer op om gemeente data te importeer of op te dateer
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
                                    Laai die template af om te sien watter kolomme verwag word
                                </p>
                                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Laai Template Af
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Column Mapping Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Kolom Mapping</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(COLUMN_MAPPING).map(([csv, db]) => (
                                <div key={csv} className="flex items-center gap-2">
                                    <span className="text-gray-600">{csv}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-gray-900 font-mono">{db}</span>
                                </div>
                            ))}
                        </div>
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
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#D4A84B] transition-colors"
                        >
                            {file ? (
                                <div className="flex flex-col items-center">
                                    <FileText className="w-12 h-12 text-[#D4A84B] mb-2" />
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
                                    <p>✓ {result.success} gemeentes suksesvol geïmporteer/opgedateer</p>
                                    {result.failed > 0 && (
                                        <p className="text-red-600">✗ {result.failed} gefaal</p>
                                    )}
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-yellow-900 mb-2">Foute:</h4>
                                    <ul className="text-sm text-yellow-800 space-y-1">
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
                            className="flex-1 bg-[#D4A84B] hover:bg-[#c49a3d] text-[#002855]"
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

export default GemeenteCSVImport;
