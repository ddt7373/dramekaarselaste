import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const DEFAULT_FROM = Deno.env.get("EMAIL_FROM") || "Dra Mekaar <gereedskap@dramekaarselaste.co.za>";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not set in Edge Function Secrets");
      return new Response(
        JSON.stringify({
          success: false,
          error: "E-pos nie gekonfigureer nie. Voeg RESEND_API_KEY by in Supabase Dashboard > Edge Functions > Secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, subject, html, text } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ success: false, error: "to en subject vereis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || text || "",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ success: false, error: data.message || "Kon nie e-pos stuur nie" }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Send email error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
