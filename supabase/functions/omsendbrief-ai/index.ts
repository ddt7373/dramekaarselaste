import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";
const GEMINI_CHAT_URL = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

async function getGeminiEmbedding(apiKey: string, text: string): Promise<number[]> {
  const res = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text: text.substring(0, 3000) }] },
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: 768,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Embedding fout");
  return data.embedding?.values || [];
}

async function callGeminiChat(apiKey: string, systemPrompt: string, userContent: string): Promise<string> {
  const url = `${GEMINI_CHAT_URL("gemini-2.0-flash")}?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Gemini fout");
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start >= text.length) break;
  }
  return chunks.filter((c) => c.length > 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY nie gestel nie");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const type = body.type || body.action || "chat";
    const data = body.data || body;

    // ========== PROCESS DOCUMENT ==========
    if (type === "process_document") {
      const dokumentId = data.dokument_id;
      const content = data.content || data.text || "";
      const filename = data.filename || "dokument";
      const originalFileUrl = data.original_file_url || null;
      const cleanTitle = data.clean_title || filename.replace(/[-_]/g, " ").replace(/\.[^.]+$/, "");

      if (!dokumentId || !content) {
        throw new Error("dokument_id en content vereis");
      }

      const chunks = chunkText(content);
      const bronChunkIds: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const embedding = await getGeminiEmbedding(GEMINI_API_KEY, chunks[i]);
        const { data: inserted, error } = await supabase
          .from("omsendbrief_chunks")
          .insert({
            dokument_id: dokumentId,
            chunk_index: i,
            content: chunks[i],
            embedding: `[${embedding.join(",")}]`,
          })
          .select("id")
          .single();

        if (error) throw error;
        if (inserted?.id) bronChunkIds.push(inserted.id);
      }

      await supabase
        .from("omsendbrief_dokumente")
        .update({
          status: "ready",
          chunk_count: chunks.length,
          original_file_url: originalFileUrl,
          content,
          metadata: { title: cleanTitle },
          updated_at: new Date().toISOString(),
        })
        .eq("id", dokumentId);

      return new Response(
        JSON.stringify({
          success: true,
          chunk_count: chunks.length,
          dokument_id: dokumentId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== CHAT (RAG) ==========
    if (type === "chat") {
      const vraag = data.vraag || data.question || "";
      const gebruikerId = data.gebruiker_id || null;
      const gemeenteId = data.gemeente_id || null;
      const filterYear = data.filter_year != null ? Number(data.filter_year) : null;

      if (!vraag.trim()) throw new Error("Vraag vereis");

      const vraagEmbedding = await getGeminiEmbedding(GEMINI_API_KEY, vraag);

      let similarChunks: any[] | null = null;
      let searchError: any = null;
      const hybridParams: Record<string, unknown> = {
        p_query_text: vraag,
        p_query_embedding: vraagEmbedding,
        p_limit: 10,
        p_vector_weight: 0.5,
        p_fts_weight: 0.5,
      };
      if (filterYear != null && !Number.isNaN(filterYear)) hybridParams.p_filter_year = filterYear;
      const { data: hybridResults, error: hybridErr } = await supabase.rpc("omsendbrief_hybrid_search", hybridParams);
      if (!hybridErr && hybridResults?.length) {
        similarChunks = hybridResults;
      } else {
        if (hybridErr) searchError = hybridErr;
        const matchParams: Record<string, unknown> = {
          query_embedding: vraagEmbedding,
          match_count: 10,
          match_threshold: 0.4,
        };
        if (filterYear != null && !Number.isNaN(filterYear)) matchParams.p_filter_year = filterYear;
        const { data: fallback } = await supabase.rpc("match_omsendbrief_chunks", matchParams);
        similarChunks = fallback?.length ? fallback : hybridResults || null;
        if (fallback?.length) searchError = hybridErr || true;
      }

      let context = "";
      const bronChunkIds: string[] = [];
      const bronne: { id: string; content: string; dokument?: string; original_file_url?: string; filename?: string }[] = [];

      if (similarChunks?.length) {
        const chunkId = (c: any) => c.chunk_id ?? c.id;
        if (searchError) {
          const dokumentIds = [...new Set(similarChunks.map((c: any) => c.dokument_id).filter(Boolean))];
          const { data: docs } = await supabase
            .from("omsendbrief_dokumente")
            .select("id, filename, metadata, original_file_url")
            .in("id", dokumentIds);
          const docMap = new Map((docs || []).map((d: any) => [d.id, d]));
          similarChunks.forEach((c: any) => {
            bronChunkIds.push(chunkId(c));
            const doc = docMap.get(c.dokument_id);
            bronne.push({
              id: chunkId(c),
              content: (c.content || "").substring(0, 200) + "...",
              dokument: doc?.metadata?.title || doc?.filename || undefined,
              original_file_url: doc?.original_file_url || undefined,
              filename: doc?.filename || undefined,
            });
          });
        } else {
          similarChunks.forEach((c: any) => {
            bronChunkIds.push(chunkId(c));
            bronne.push({
              id: chunkId(c),
              content: (c.content || "").substring(0, 200) + "...",
              dokument: c.document_title || undefined,
              original_file_url: c.original_file_url || undefined,
              filename: c.filename || undefined,
            });
          });
        }
        context = similarChunks.map((c: any) => c.content).join("\n\n---\n\n");
      }

      const sysPrompt = `Jy is die Omsendbrief Kletsbot. Antwoord SLEGS op grond van die gegewe kontekst. As die antwoord nie in die kontekst is nie, sê dit duidelik. Antwoord in Afrikaans.`;
      const userContent = context
        ? `Kontekst:\n${context}\n\nVraag: ${vraag}\n\nAntwoord (verwys na die bronne waar moontlik):`
        : `Geen dokumente is nog opgelaai nie. Sê die gebruiker dat die hoofadministrateur dokumente moet oplaai in die Omsendbrief Portaal.\n\nVraag: ${vraag}`;

      const antwoord = await callGeminiChat(GEMINI_API_KEY, sysPrompt, userContent);

      await supabase.from("omsendbrief_vrae").insert({
        gebruiker_id: gebruikerId,
        gemeente_id: gemeenteId,
        vraag,
        antwoord,
        bron_chunk_ids: bronChunkIds,
      });

      return new Response(
        JSON.stringify({
          success: true,
          antwoord,
          bronne: bronne.length ? bronne : undefined,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Onbekende aksie: ${type}`);
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
