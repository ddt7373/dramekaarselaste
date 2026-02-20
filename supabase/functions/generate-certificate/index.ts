import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateSertifikaatNommer(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NHKA-${year}-${random}`;
}

function createCertificateSVG(gebruikerNaam: string, kursusTitel: string, datum: string): string {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#002855"/>
      <stop offset="100%" style="stop-color:#004895"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#D4A84B"/>
      <stop offset="100%" style="stop-color:#C49A3B"/>
    </linearGradient>
  </defs>
  <rect width="800" height="560" fill="url(#bg)"/>
  <rect x="20" y="20" width="760" height="520" fill="none" stroke="url(#gold)" stroke-width="3" rx="8"/>
  <rect x="30" y="30" width="740" height="500" fill="none" stroke="url(#gold)" stroke-width="1" rx="6" opacity="0.6"/>
  <text x="400" y="100" text-anchor="middle" fill="#D4A84B" font-family="Georgia, serif" font-size="28" font-weight="bold">NEDERDUITSCH HERVORMDE KERK</text>
  <text x="400" y="135" text-anchor="middle" fill="#D4A84B" font-family="Georgia, serif" font-size="28" font-weight="bold">VAN AFRIKA</text>
  <text x="400" y="200" text-anchor="middle" fill="#D4A84B" font-family="Georgia, serif" font-size="18" font-style="italic">Sertifikaat van Voltooiing</text>
  <text x="400" y="280" text-anchor="middle" fill="white" font-family="Georgia, serif" font-size="32" font-weight="bold">${escapeXml(gebruikerNaam)}</text>
  <text x="400" y="330" text-anchor="middle" fill="#E5E7EB" font-family="Georgia, serif" font-size="18">het suksesvol voltooi</text>
  <text x="400" y="380" text-anchor="middle" fill="#D4A84B" font-family="Georgia, serif" font-size="22" font-weight="bold">${escapeXml(kursusTitel)}</text>
  <text x="400" y="430" text-anchor="middle" fill="#9CA3AF" font-family="Georgia, serif" font-size="14">Voltooi op ${escapeXml(datum)}</text>
  <text x="400" y="510" text-anchor="middle" fill="#6B7280" font-family="sans-serif" font-size="12">Geloofsgroei Akademie</text>
</svg>`;
  return svg;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date): string {
  const months = [
    "Januarie", "Februarie", "Maart", "April", "Mei", "Junie",
    "Julie", "Augustus", "September", "Oktober", "November", "Desember"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { gebruiker_id, kursus_id, gebruiker_naam, kursus_titel } = await req.json();

    if (!gebruiker_id || !kursus_titel) {
      return new Response(
        JSON.stringify({ success: false, error: "gebruiker_id en kursus_titel vereis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const naam = (gebruiker_naam || "").trim() || "Leerder";
    const voltooiingDatum = new Date();
    const datumStr = formatDate(voltooiingDatum);
    const sertifikaatNommer = generateSertifikaatNommer();

    const svgContent = createCertificateSVG(naam, kursus_titel, datumStr);
    const base64 = btoa(unescape(encodeURIComponent(svgContent)));
    const pdfUrl = `data:image/svg+xml;base64,${base64}`;

    const { data: cert, error } = await supabase
      .from("lms_sertifikate")
      .insert({
        gebruiker_id,
        kursus_id: kursus_id || null,
        kursus_titel,
        gebruiker_naam: naam,
        sertifikaat_nommer: sertifikaatNommer,
        voltooiing_datum: voltooiingDatum.toISOString(),
        pdf_url: pdfUrl,
        is_geldig: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Certificate insert error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: cert.id,
        sertifikaat_nommer: sertifikaatNommer,
        pdf_url: pdfUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Generate certificate error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
