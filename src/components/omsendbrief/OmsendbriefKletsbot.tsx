import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNHKA } from '@/contexts/NHKAContext';
import { MessageCircle, Send, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bronne?: { id: string; content: string; dokument?: string; original_file_url?: string; filename?: string }[];
  timestamp: Date;
}

const OmsendbriefKletsbot: React.FC = () => {
  const { currentUser, currentGemeente } = useNHKA();
  const [vraag, setVraag] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchYears = async () => {
      const { data, error } = await supabase
        .from('omsendbrief_dokumente')
        .select('created_at')
        .not('created_at', 'is', null);
      if (error) return;
      const years = [...new Set((data || []).map((r) => new Date(r.created_at).getFullYear()))].sort((a, b) => b - a);
      setAvailableYears(years);
    };
    fetchYears();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /** Determine MIME type from file extension so the browser opens the correct application */
  const getMimeType = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ppt: 'application/vnd.ms-powerpoint',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    return map[ext] || 'application/octet-stream';
  };

  const handleDownloadDocument = async (filename: string) => {
    try {
      // Look up the document — get content and storage_path
      const { data: doc, error: docErr } = await supabase
        .from('omsendbrief_dokumente')
        .select('id, content, storage_path, original_file_url')
        .eq('filename', filename)
        .maybeSingle();
      if (docErr || !doc) {
        toast.error('Kon nie dokument vind nie');
        return;
      }

      // Option 1: Try to get a signed URL from Supabase Storage (works even for private buckets)
      if (doc.storage_path) {
        const { data: signedData, error: signedErr } = await supabase.storage
          .from('omsendbrief-dokumente')
          .createSignedUrl(doc.storage_path, 300); // 5-minute signed URL
        if (!signedErr && signedData?.signedUrl) {
          // Use signed URL — open in new tab for PDF, or download for other types
          const ext = filename.split('.').pop()?.toLowerCase() || '';
          if (ext === 'pdf') {
            window.open(signedData.signedUrl, '_blank');
          } else {
            const a = document.createElement('a');
            a.href = signedData.signedUrl;
            a.download = filename;
            a.click();
          }
          toast.success('Oorspronklike dokument afgelaai');
          return;
        }

        // Fallback: direct download from storage
        const { data: fileData, error: fileErr } = await supabase.storage
          .from('omsendbrief-dokumente')
          .download(doc.storage_path);
        if (!fileErr && fileData) {
          const mimeType = getMimeType(filename);
          const blob = new Blob([fileData], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Oorspronklike dokument afgelaai');
          return;
        }
      }

      // Option 2: If there's a public URL, open it
      if (doc.original_file_url) {
        window.open(doc.original_file_url, '_blank');
        return;
      }

      // Option 3: Download the full text content from the database (last resort)
      const textContent = doc.content;
      if (textContent && textContent.trim()) {
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace(/\.[^.]+$/, '') + '.txt';
        a.click();
        URL.revokeObjectURL(url);
        toast.info('Slegs teksinhoud was beskikbaar — oorspronklike lêer nie gevind nie.');
        return;
      }

      // Fallback: concatenate chunks
      const { data: chunks, error: chunkErr } = await supabase
        .from('omsendbrief_chunks')
        .select('content, chunk_index')
        .eq('dokument_id', doc.id)
        .order('chunk_index', { ascending: true });
      if (chunkErr || !chunks?.length) {
        toast.error('Kon nie inhoud laai nie');
        return;
      }
      const fullText = chunks.map((c) => c.content).join('\n\n');
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace(/\.[^.]+$/, '') + '.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast.info('Slegs teksinhoud was beskikbaar — oorspronklike lêer nie gevind nie.');
    } catch {
      toast.error('Aflaai misluk');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = vraag.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setVraag('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('omsendbrief-ai', {
        body: {
          type: 'chat',
          data: {
            vraag: trimmed,
            gebruiker_id: currentUser?.id || null,
            gemeente_id: currentGemeente?.id || null,
            filter_year: filterYear,
          },
        },
      });

      if (error) throw error;

      const antwoord = data?.antwoord || 'Kon nie antwoord genereer nie.';
      const bronne = data?.bronne || [];

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: antwoord,
        bronne: bronne.length ? bronne : undefined,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error(err.message || 'Vraag misluk');
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Jammer, daar was 'n fout. Probeer weer.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#002855] flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          Omsendbrief Kletsbot
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Alle omsendbriewe vanaf 2022 kan hier ondervra word. Tik jou vraag in die blokkie onderaan en druk Stuur.
        </p>
        {availableYears.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor="omsendbrief-jaar" className="text-sm font-medium text-[#002855]">
              Filter op jaar (oplaai-jaar):
            </label>
            <select
              id="omsendbrief-jaar"
              value={filterYear ?? ''}
              onChange={(e) => setFilterYear(e.target.value === '' ? null : parseInt(e.target.value, 10))}
              className="rounded-lg border-2 border-[#002855]/30 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#002855] focus:border-[#002855] outline-none"
            >
              <option value="">Alle jare</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {filterYear != null && (
              <span className="text-xs text-gray-500">Slegs dokumente van {filterYear}</span>
            )}
          </div>
        )}
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
          <strong>Wenk:</strong> Stel jou vraag so volledig as moontlik. Moenie net &quot;lisensie&quot; tik nie – eerder: &quot;Wat is die voordele van die Microsoft 365 lisensie?&quot;
        </p>
      </div>

      <Card className="overflow-hidden flex flex-col">
        {/* Gesprek-area */}
        <div className="h-[380px] overflow-y-auto p-4 space-y-4 flex-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageCircle className="w-14 h-14 text-gray-300 mb-3" />
              <p className="text-gray-500 max-w-sm font-medium">
                Tik jou vraag onderaan en druk Stuur. Die Kletsbot sal antwoord op grond van die omsendbriewe.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                  ? 'bg-[#002855] text-white'
                  : 'bg-gray-100 text-gray-900'
                  }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.bronne && msg.bronne.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200/50">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Bronne:</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const docMap = new Map<string, { url?: string; filename?: string }>();
                        msg.bronne.forEach((b) => {
                          if (b.dokument && !docMap.has(b.dokument)) docMap.set(b.dokument, { url: b.original_file_url, filename: b.filename });
                        });
                        return [...docMap.entries()].map(([dokument, { filename }]) => (
                          <button
                            key={dokument}
                            type="button"
                            onClick={() => handleDownloadDocument(filename || dokument)}
                            className="flex items-center gap-1.5 text-xs text-[#002855] bg-white/60 hover:bg-white/90 rounded-lg px-2 py-1 transition-colors cursor-pointer border border-transparent hover:border-[#002855]/30"
                            title="Laai oorspronklike dokument af"
                          >
                            <Download className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-medium underline decoration-dotted">{dokument}</span>
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#002855]" />
                <span className="text-sm text-gray-600">Dink...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Vraag-blokkie ondertoe – altyd aan die onderkant */}
        <div className="p-4 border-t-2 border-[#002855]/20 bg-[#002855]/5 shrink-0">
          <form onSubmit={handleSubmit} className="space-y-2">
            <label htmlFor="omsendbrief-vraag" className="block text-sm font-semibold text-[#002855]">
              Stel jou vraag
            </label>
            <div className="flex gap-2">
              <input
                id="omsendbrief-vraag"
                type="text"
                value={vraag}
                onChange={(e) => setVraag(e.target.value)}
                placeholder="bv. Wat is die reiskostes vir predikante sonder reistoelaag vir 2026?"
                className="flex-1 px-4 py-3.5 rounded-xl border-2 border-[#002855]/30 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#002855] focus:border-[#002855] outline-none text-base"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !vraag.trim()}
                className="bg-[#002855] hover:bg-[#001a35] px-6 shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-1" />
                    Stuur
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default OmsendbriefKletsbot;
