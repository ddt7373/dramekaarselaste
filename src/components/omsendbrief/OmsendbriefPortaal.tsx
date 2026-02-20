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
  X,
  CopyMinus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allIds = dokumente.map((d) => d.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  /** Groepeer volgens filename (kleinletters); vir elke groep met duplikate behou ons die nuutste (grootste created_at) en verwyder die oudstes. */
  const duplicateIdsToRemove = React.useMemo(() => {
    const byName = new Map<string, OmsendbriefDokument[]>();
    for (const d of dokumente) {
      const key = d.filename.trim().toLowerCase();
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(d);
    }
    const ids: string[] = [];
    for (const [, group] of byName) {
      if (group.length <= 1) continue;
      const sorted = [...group].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      for (let i = 0; i < sorted.length - 1; i++) ids.push(sorted[i].id);
    }
    return ids;
  }, [dokumente]);
  const hasDuplicates = duplicateIdsToRemove.length > 0;

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
          let storagePath = '';
          if (rawFile) {
            storagePath = `${doc.id}/${filename}`;
            const { error: uploadErr } = await supabase.storage
              .from('omsendbrief-dokumente')
              .upload(storagePath, rawFile, { upsert: true });
            if (!uploadErr) {
              const { data: urlData } = supabase.storage.from('omsendbrief-dokumente').getPublicUrl(storagePath);
              originalFileUrl = urlData?.publicUrl || '';
              // Store storage_path so the chatbot can download the original file
              await supabase.from('omsendbrief_dokumente').update({ storage_path: storagePath }).eq('id', doc.id);
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) setSelectedIds(new Set(allIds));
    else setSelectedIds(new Set());
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Is jy seker jy wil hierdie dokument verwyder?')) return;
    const { error } = await supabase.from('omsendbrief_dokumente').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Dokument verwyder');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchDokumente();
    }
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const msg =
      ids.length === 1
        ? 'Is jy seker jy wil hierdie dokument verwyder?'
        : `Is jy seker jy wil ${ids.length} dokumente verwyder?`;
    if (!window.confirm(msg)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('omsendbrief_dokumente').delete().in('id', ids);
      if (error) throw error;
      toast.success(ids.length === 1 ? 'Dokument verwyder' : `${ids.length} dokumente verwyder`);
      setSelectedIds(new Set());
      await fetchDokumente();
    } catch (err: any) {
      toast.error(err.message || 'Kon nie dokumente verwyder nie');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (dokumente.length === 0) return;
    if (!window.confirm(`Is jy seker jy wil al ${dokumente.length} dokumente verwyder? Dit kan nie ongedaan gemaak word nie.`)) return;
    setDeleting(true);
    try {
      const ids = dokumente.map((d) => d.id);
      const { error } = await supabase.from('omsendbrief_dokumente').delete().in('id', ids);
      if (error) throw error;
      toast.success('Alle dokumente verwyder');
      setSelectedIds(new Set());
      await fetchDokumente();
    } catch (err: any) {
      toast.error(err.message || 'Kon nie dokumente verwyder nie');
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (duplicateIdsToRemove.length === 0) return;
    if (!window.confirm(`Verwyder ${duplicateIdsToRemove.length} oudste duplikate? Die nuutste weergawe van elke lêer bly behou.`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('omsendbrief_dokumente').delete().in('id', duplicateIdsToRemove);
      if (error) throw error;
      toast.success(`${duplicateIdsToRemove.length} oudste duplikate verwyder; nuutstes behou.`);
      setSelectedIds(new Set());
      await fetchDokumente();
    } catch (err: any) {
      toast.error(err.message || 'Kon nie duplikate verwyder nie');
    } finally {
      setDeleting(false);
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
              <div className="flex flex-wrap items-center gap-3 p-2 rounded-lg border border-gray-100 bg-gray-50/80 mb-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="omsendbrief-select-all"
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label htmlFor="omsendbrief-select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Kies almal
                  </label>
                </div>
                {someSelected && (
                  <span className="text-sm text-gray-500">
                    {selectedIds.size} gekies
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveDuplicates}
                    disabled={!hasDuplicates || deleting}
                    className="text-amber-700 border-amber-200 hover:bg-amber-50"
                    title="Verwyder oudste weergawes van duplikate (dieselfde lêernaam); nuutste bly."
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CopyMinus className="w-4 h-4 mr-1" />}
                    Verwyder duplikate {hasDuplicates ? `(${duplicateIdsToRemove.length})` : ''}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={!someSelected || deleting}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                    Verwyder gekies
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAll}
                    disabled={deleting}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Verwyder almal
                  </Button>
                </div>
              </div>
              {dokumente.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      id={`omsendbrief-doc-${d.id}`}
                      checked={selectedIds.has(d.id)}
                      onCheckedChange={() => toggleSelect(d.id)}
                    />
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
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-600" title="Verwyder hierdie dokument">
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
