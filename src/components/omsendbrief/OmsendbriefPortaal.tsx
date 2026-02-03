import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useNHKA } from '@/contexts/NHKAContext';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Upload,
  FileText,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Archive,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface OmsendbriefDokument {
  id: string;
  filename: string;
  mime_type?: string;
  file_size?: number;
  status: string;
  chunk_count: number;
  created_at: string;
}

const OmsendbriefPortaal: React.FC = () => {
  const { currentUser } = useNHKA();
  const [dokumente, setDokumente] = useState<OmsendbriefDokument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDokumente = async () => {
    try {
      const { data, error } = await supabase
        .from('omsendbrief_dokumente')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDokumente(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Kon nie dokumente laai nie');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDokumente();
  }, []);

  /** Extract text with Markdown-like structure (paragraph breaks for better chunking) */
  const extractTextFromFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'txt') {
      return await file.text();
    }
    if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const lines: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items as { str: string; transform?: number[] }[];
        let lastY = 0;
        let lineWords: string[] = [];
        for (const item of items) {
          const y = item.transform?.[5] ?? 0;
          const dy = Math.abs(y - lastY);
          if (dy > 12 && lineWords.length > 0) {
            lines.push(lineWords.join(' '));
            lineWords = [];
            if (dy > 25) lines.push(''); // paragraph break
          }
          lastY = y;
          if (item.str?.trim()) lineWords.push(item.str);
        }
        if (lineWords.length > 0) lines.push(lineWords.join(' '));
        if (i < pdf.numPages) lines.push(''); // page break
      }
      return lines.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
    }
    if (['docx', 'doc'].includes(ext)) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    return '';
  };

  /** Clean title: replace hyphens and underscores with spaces (e.g. Predikante-verlofreglement-2024 -> Predikante verlofreglement 2024) */
  const cleanTitleFromFilename = (filename: string): string => {
    const base = filename.replace(/\.[^.]+$/, '');
    return base.replace(/[-_]/g, ' ').trim();
  };

  const processZip = async (file: File): Promise<{ filename: string; content: string; rawFile: File }[]> => {
    const zip = await JSZip.loadAsync(file);
    const results: { filename: string; content: string; rawFile: File }[] = [];
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const ext = path.split('.').pop()?.toLowerCase() || '';
      if (!['txt', 'pdf', 'docx', 'doc'].includes(ext)) continue;
      const blob = await entry.async('blob');
      const f = new File([blob], path.split('/').pop() || path, { type: blob.type });
      const text = await extractTextFromFile(f);
      if (text.trim()) results.push({ filename: path.split('/').pop() || path, content: text, rawFile: f });
    }
    return results;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        let texts: { filename: string; content: string; rawFile?: File }[] = [];

        if (ext === 'zip') {
          texts = await processZip(file);
        } else if (['txt', 'pdf', 'docx', 'doc'].includes(ext)) {
          const content = await extractTextFromFile(file);
          if (content.trim()) texts.push({ filename: file.name, content, rawFile: file });
        } else {
          toast.warning(`Formaat nie ondersteun: ${file.name}`);
          continue;
        }

        for (const { filename, content, rawFile } of texts) {
          const { data: doc, error: docErr } = await supabase
            .from('omsendbrief_dokumente')
            .insert({
              filename,
              mime_type: rawFile?.type || file.type,
              file_size: content.length,
              status: 'pending',
              uploaded_by: currentUser?.id,
            })
            .select('id')
            .single();

          if (docErr) throw docErr;

          let originalFileUrl = '';
          if (rawFile) {
            const storagePath = `${doc.id}/${filename}`;
            const { error: uploadErr } = await supabase.storage
              .from('omsendbrief-dokumente')
              .upload(storagePath, rawFile, { upsert: true });
            if (!uploadErr) {
              const { data: urlData } = supabase.storage.from('omsendbrief-dokumente').getPublicUrl(storagePath);
              originalFileUrl = urlData?.publicUrl || '';
            }
          }

          const cleanTitle = cleanTitleFromFilename(filename);
          setProcessing(doc.id);
          const { error: funcErr } = await supabase.functions.invoke('omsendbrief-ai', {
            body: {
              type: 'process_document',
              data: {
                dokument_id: doc.id,
                content,
                filename,
                original_file_url: originalFileUrl || undefined,
                clean_title: cleanTitle,
              },
            },
          });
          setProcessing(null);

          if (funcErr) {
            await supabase.from('omsendbrief_dokumente').update({ status: 'error', error_message: funcErr.message }).eq('id', doc.id);
            toast.error(`${filename}: ${funcErr.message}`);
          } else {
            toast.success(`${filename} verwerk`);
          }
        }
      }
      await fetchDokumente();
    } catch (err: any) {
      toast.error(err.message || 'Oplaai misluk');
    } finally {
      setUploading(false);
      setProcessing(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Is jy seker jy wil hierdie dokument verwyder?')) return;
    const { error } = await supabase.from('omsendbrief_dokumente').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Dokument verwyder');
      fetchDokumente();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#002855]">Omsendbrief Portaal</h2>
        <p className="text-sm text-gray-500">Laai dokumente op (PDF, DOCX, TXT, ZIP). Hulle word outomaties gechunk en gevector vir die Kletsbot.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Laai Dokument Op
          </CardTitle>
          <CardDescription>
            Ondersteun: PDF, DOCX, DOC, TXT. ZIP-lêers word outomaties uitgepak.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.zip"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full sm:w-auto"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Kies Lêer(s)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opgelaai Dokumente</CardTitle>
          <CardDescription>{dokumente.length} dokumente</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Laai...
            </div>
          ) : dokumente.length === 0 ? (
            <p className="text-gray-500">Nog geen dokumente opgelaai nie.</p>
          ) : (
            <div className="space-y-2">
              {dokumente.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{d.filename}</p>
                      <p className="text-xs text-gray-500">
                        {d.chunk_count} chunks • {d.status}
                        {d.status === 'ready' && <CheckCircle className="inline w-3 h-3 ml-1 text-green-500" />}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {processing === d.id && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OmsendbriefPortaal;
