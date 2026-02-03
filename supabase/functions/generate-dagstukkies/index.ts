import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { preek_opsomming, tema, skriflesing } = await req.json()
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

        // Check if key exists
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing in Edge Function Secrets");
        }

        // Gebruik gemini-2.0-flash (gemini-1.5-flash is deprecated)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

        const systemPrompt = "Jy is 'n leraar. Genereer 6 Afrikaanse dagstukkies (Maandag tot Saterdag) as 'n skoon JSON array. Moenie enige markdown (```) insluit nie."
        const userMsg = `Tema: ${tema}\nInhoud: ${preek_opsomming}\n\nAntwoord slegs as: [{"dag":"...","titel":"...","inhoud":"...","skrifverwysing":"..."}]`

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMsg}` }] }]
            })
        })

        const resData = await response.json()
        if (!response.ok) throw new Error(`Google API: ${resData.error?.message || "Onbekende fout"}`);

        let reply = resData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
        // Maak skoon van enige markdown blocks
        reply = reply.replace(/```json/g, '').replace(/```/g, '').trim()

        return new Response(JSON.stringify({
            success: true,
            dagstukkies: JSON.parse(reply),
            v: "5.3.0"
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })

    } catch (error: any) {
        return new Response(JSON.stringify({
            success: false,
            error: `Fout (v5.3.0): ${error.message} (Key Length: ${Deno.env.get('GEMINI_API_KEY')?.length || 0})`
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
