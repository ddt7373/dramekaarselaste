import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

/** Omskakel selfoon na internasionale formaat (+27 vir SA) */
function toInternationalPhone(val: string): string | null {
  if (!val || !val.trim()) return null;
  let s = val.replace(/\D/g, '');
  if (s.startsWith('27') && s.length >= 11) return '+' + s;
  if (s.startsWith('0') && s.length >= 10) return '+27' + s.slice(1);
  if (s.length >= 9) return '+27' + s;
  return val.trim() || null;
}

/** Parse datum (YYYY-MM-DD, YYYY-DD-MM, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY) */
function parseDate(val: string): string | null {
  if (!val || !val.trim()) return null;
  const v = val.trim();
  // YYYY-X-Y: as X > 12, dan is dit YYYY-DD-MM (dag-maand) - ruil om na YYYY-MM-DD
  const isoMatch = v.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const [, y, a, b] = isoMatch;
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (na > 12 && nb <= 12) return `${y}-${String(nb).padStart(2, '0')}-${String(Math.min(na, 31)).padStart(2, '0')}`;
    if (nb > 12 && na <= 12) return `${y}-${String(na).padStart(2, '0')}-${String(Math.min(nb, 31)).padStart(2, '0')}`;
    if (na <= 12 && nb <= 31) return `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
  }
  // DD/MM/YYYY of MM/DD/YYYY
  const m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const [, a, b, yr] = m;
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    const year = yr.length === 2 ? '20' + yr : yr;
    if (na > 12 && nb <= 12) return `${year}-${b.padStart(2, '0')}-${String(Math.min(na, 31)).padStart(2, '0')}`;
    if (nb > 12 && na <= 12) return `${year}-${a.padStart(2, '0')}-${String(Math.min(nb, 31)).padStart(2, '0')}`;
    return `${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
  }
  return null;
}

const CSV_HEADERS = [
  'geslag', 'titel', 'van', 'nooiensvan', 'voornaam_1', 'voornaam_2', 'voornaam_3', 'noemnaam',
  'selfoon', 'landlyn', 'epos_1', 'epos_2',
  'geboorte_datum', 'doop_datum', 'belydenis_van_geloof_datum', 'sterf_datum',
  'straat_naam', 'adres', 'straat_nommer', 'woonkompleks_naam', 'woonkompleks_nommer', 'voorstad', 'stad_dorp', 'poskode',
  'rol', 'portefeulje_1', 'portefeulje_2', 'portefeulje_3'
];

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface LidmateCSVImportProps {
  gemeenteId: string;
  onClose: () => void;
  onComplete: () => void;
}

const LidmateCSVImport: React.FC<LidmateCSVImportProps> = ({ gemeenteId, onClose, onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    const parseRow = (line: string): string[] => {
      const out: string[] = [];
      let cur = '';
      let inQ = false;
      for (let j = 0; j < line.length; j++) {
        const c = line[j];
        if (c === '"') inQ = !inQ;
        else if (c === ',' && !inQ) {
          out.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else cur += c;
      }
      out.push(cur.trim().replace(/^"|"$/g, ''));
      return out;
    };

    const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_').replace(/[\/]/g, '_'));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      rows.push(row);
    }
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith('.csv')) {
        setError('Slegs CSV lêers word aanvaar');
        return;
      }
      setFile(f);
      setError('');
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file || !gemeenteId) {
      setError('Kies asseblief \'n CSV lêer');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setError('CSV lêer is leeg of ongeldig');
        setLoading(false);
        return;
      }

      const validRoles = ['lidmaat', 'groepleier', 'ouderling', 'diaken', 'predikant', 'subadmin', 'kerkraad', 'eksterne_gebruiker', 'hoof_admin', 'admin', 'moderator', 'geloofsonderrig_admin'];
      const res: ImportResult = { success: 0, failed: 0, errors: [] };

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const voornaam1 = r.voornaam_1 || r.voornaam1 || r.naam || '';
        const van = r.van || '';
        if (!voornaam1.trim() && !van.trim()) continue;

        const naam = [voornaam1, r.voornaam_2 || r.voornaam2, r.voornaam_3 || r.voornaam3].filter(Boolean).join(' ').trim() || voornaam1;
        const rolleRaw = (r.rol || r.app_roles || 'lidmaat').split(/[,;|]/).map((x: string) => x.trim().toLowerCase()).filter(Boolean);
        const appRoles = rolleRaw.filter((x: string) => validRoles.includes(x));
        if (appRoles.length === 0) appRoles.push('lidmaat');

        const vanVal = van?.trim() || 'Onbekend';
        const eposVal = (r.epos_1 || r.epos1 || r.epos || '').trim() || null;
        const epos2Val = (r.epos_2 || r.epos2 || '').trim() || null;

        const rowData: Record<string, unknown> = {
          gemeente_id: gemeenteId,
          naam,
          van: vanVal,
          voornaam_1: r.voornaam_1 || r.voornaam1 || voornaam1 || null,
          voornaam_2: r.voornaam_2 || r.voornaam2 || null,
          voornaam_3: r.voornaam_3 || r.voornaam3 || null,
          noemnaam: (r.noemnaam || '').trim() || null,
          nooiensvan: (r.nooiensvan || '').trim() || null,
          titel: (r.titel || '').trim() || null,
          geslag: ['man', 'vrou', 'ander'].includes((r.geslag || '').toLowerCase()) ? (r.geslag || '').toLowerCase() : null,
          selfoon: toInternationalPhone(r.selfoon || '') || null,
          landlyn: (r.landlyn || '').trim() || null,
          epos: eposVal,
          epos_2: epos2Val,
          geboortedatum: parseDate(r.geboorte_datum || r.geboortedatum || '') || null,
          doop_datum: parseDate(r.doop_datum || r.doopdatum || '') || null,
          belydenis_van_geloof_datum: parseDate(r.belydenis_van_geloof_datum || r.belydenisdatum || '') || null,
          sterf_datum: parseDate(r.sterf_datum || r.sterfdatum || '') || null,
          straat_naam: (r.straat_naam || r.straatnaam || '').trim() || null,
          adres: (r.adres || '').trim() || [r.straat_naam || r.straatnaam, r.straat_nommer, r.voorstad, r.stad_dorp].filter(Boolean).join(', ').trim() || null,
          straat_nommer: (r.straat_nommer || r.straatnommer || '').trim() || null,
          woonkompleks_naam: (r.woonkompleks_naam || '').trim() || null,
          woonkompleks_nommer: (r.woonkompleks_nommer || '').trim() || null,
          voorstad: (r.voorstad || '').trim() || null,
          stad_dorp: (r.stad_dorp || r.staddorp || '').trim() || null,
          poskode: (r.poskode || '').trim() || null,
          app_roles: appRoles,
          rol: appRoles[0],
          portefeulje_1: r.portefeulje_1 || r.portefeulje1 || null,
          portefeulje_2: r.portefeulje_2 || r.portefeulje2 || null,
          portefeulje_3: r.portefeulje_3 || r.portefeulje3 || null,
          aktief: true,
          popia_toestemming: false
        };

        try {
          // Soek bestaande: eers op (gemeente, van, naam), anders op (gemeente, epos) as epos gegee is
          let existing: { id: string } | null = null;
          const { data: byNaam } = await supabase
            .from('gebruikers')
            .select('id')
            .eq('gemeente_id', gemeenteId)
            .eq('van', vanVal)
            .eq('naam', naam)
            .maybeSingle();
          existing = byNaam ?? null;

          if (!existing && eposVal) {
            const { data: byEpos } = await supabase
              .from('gebruikers')
              .select('id')
              .eq('epos', eposVal)
              .maybeSingle();
            existing = byEpos ?? null;
          }

          if (existing) {
            const { error: err } = await supabase
              .from('gebruikers')
              .update(rowData)
              .eq('id', existing.id);
            if (err) throw err;
            res.success++;
          } else {
            const { error: err } = await supabase.from('gebruikers').insert([rowData]);
            if (err) throw err;
            res.success++;
          }
        } catch (e: unknown) {
          res.failed++;
          const err = e as { message?: string; details?: string; hint?: string };
          const msg = err?.message || String(e);
          const detail = err?.details ? ` (${err.details})` : '';
          res.errors.push(`Ry ${i + 2}: ${msg}${detail}`);
        }
      }

      setResult(res);
      if (res.success > 0) {
        toast.success(`${res.success} lidmate suksesvol opgelaai`);
        onComplete();
      }
      if (res.failed > 0 && res.errors.some(e => /column|does not exist/i.test(e))) {
        toast.error('Kolomme ontbreek dalk in die databasis. Voer asseblief die migrasies uit (supabase db push).', { duration: 8000 });
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Fout met CSV import');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = CSV_HEADERS.join(',');
    const example = [
      'vrou', 'Mev.', 'van der Merwe', 'Botha', 'Maria', 'Johanna', '', 'Ria',
      '082 123 4567', '012 345 6789', 'maria@voorbeeld.co.za', 'maria.werk@voorbeeld.co.za',
      '1985-03-15', '1985-06-20', '1999-04-10', '',
      'Hoofstraat', '123 Hoofstraat, Hatfield, Pretoria 0028', '123', 'Geen', '', 'Hatfield', 'Pretoria', '0028',
      'lidmaat', 'NHSV', '', ''
    ].join(',');
    const csv = `${headers}\n${example}`;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lidmate_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Lidmate CSV Oplaai
            </CardTitle>
            <CardDescription>
              Laai lidmate op via CSV. Alle kolomme is opsioneel behalwe naam en van. Herlaai sal bestaande rekords opdateer (geen duplikate).
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Laai Sjabloon Af
            </Button>
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">Kies \'n CSV lêer</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Kies Lêer
            </Button>
            {file && <p className="mt-2 text-sm font-medium text-green-600">{file.name}</p>}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{result.success} suksesvol, {result.failed} misluk</span>
            </div>
          )}

          {result?.errors && result.errors.length > 0 && (
            <div className="max-h-32 overflow-y-auto text-sm text-red-600">
              {result.errors.slice(0, 10).map((e, i) => <div key={i}>{e}</div>)}
              {result.errors.length > 10 && <div>... en {result.errors.length - 10} meer</div>}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Kanselleer</Button>
            <Button onClick={handleImport} disabled={!file || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Laai Op
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LidmateCSVImport;
