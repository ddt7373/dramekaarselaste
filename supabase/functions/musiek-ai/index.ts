import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * musiek-ai Edge Function
 * Hanteer musiekgenerasie via Suno of Replicate (MusicGen)
 *
 * Aksies:
 *  - genereer_suno    : Genereer musiek via Suno API
 *  - genereer_replicate : Genereer musiek via Replicate (MusicGen)
 *  - kyk_status       : Kyk of Suno/Replicate klaar is
 *  - stoor_oudio      : Stoor voltooide oudio na Storage
 */
serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await req.json();
        const type = body.type || "genereer_suno";
        const data = body.data || body;

        // ========== GENEREER VIA SUNO (sunoapi.org) ==========
        if (type === "genereer_suno") {
            const SUNO_API_KEY = Deno.env.get("SUNO_API_KEY");
            if (!SUNO_API_KEY) throw new Error("SUNO_API_KEY nie gestel nie. Voeg dit by in Supabase Dashboard > Edge Functions > Secrets.");

            const { lied_id, lirieke, styl_prompt, titel } = data;
            if (!lied_id || !lirieke) throw new Error("lied_id en lirieke vereis");

            // Opdateer status na 'genereer'
            await supabase.from("musiek_liedere").update({
                status: "genereer",
                ai_diens: "suno",
                fout_boodskap: null,
                updated_at: new Date().toISOString(),
            }).eq("id", lied_id);

            // Roep Suno API (sunoapi.org)
            const sunoEndpoint = data.verwysing_oudio_pad
                ? "https://api.sunoapi.org/api/v1/generate/upload-cover" // As daar oudio is, doen 'n cover
                : "https://api.sunoapi.org/api/v1/generate";             // Anders gewone generasie

            // Base body
            let sunoBody: any = {};

            if (data.verwysing_oudio_pad) {
                // === COVER GENERATION (BEHOU MELODIE) ===
                const { data: signedUrlData, error: signedErr } = await supabase
                    .storage
                    .from('musiek-liedere')
                    .createSignedUrl(data.verwysing_oudio_pad, 600);

                if (signedErr || !signedUrlData?.signedUrl) {
                    throw new Error("Kon nie toegang kry tot verwysings-oudio nie.");
                }

                // Vir 'upload-cover' wil ons MELODIE van oudio en LIRIEKE van teks hê.
                // Volgens nuutste navorsing:
                // As instrumental=false en customMode=true vir 'upload-cover', gebruik dit 'prompt' as Lirieke.
                // Dit is krities dat ons die Lirieke in die 'prompt' veld sit, anders ignoreer hy dit.
                sunoBody = {
                    uploadUrl: signedUrlData.signedUrl,
                    customMode: true,
                    instrumental: false,
                    prompt: lirieke.substring(0, 3000), // Prompt is die lirieke
                    style: styl_prompt || "Gospel, Koor, Eerbiedig",
                    title: titel || "Kerklied",
                    model: "V4_5ALL",
                    callBackUrl: "https://dramekaarselaste.co.za/api/suno-callback",
                };
            } else {
                // === GEWONE GENERASIE (NUWE MELODIE) ===
                sunoBody = {
                    customMode: true,
                    instrumental: false,
                    model: "V4_5ALL",
                    prompt: lirieke.substring(0, 3000),
                    style: styl_prompt || "Gospel, Koor, Eerbiedig",
                    title: titel || "Kerklied",
                    callBackUrl: "https://dramekaarselaste.co.za/api/suno-callback",
                };
            }


            const sunoRes = await fetch(sunoEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${SUNO_API_KEY}`,
                },
                body: JSON.stringify(sunoBody),
            });

            const sunoData = await sunoRes.json();

            // sunoapi.org gee gewoonlik kode 200 en 'n data object met taskId
            if (sunoData.code !== 200 && !sunoData.data?.taskId) {
                const err = sunoData.msg || sunoData.error || "Onbekende fout by Suno API";
                await supabase.from("musiek_liedere").update({
                    status: "fout",
                    fout_boodskap: `Suno fout: ${err}`,
                    updated_at: new Date().toISOString(),
                }).eq("id", lied_id);
                throw new Error(`Suno API fout: ${err}`);
            }

            const taskId = sunoData.data.taskId;

            await supabase.from("musiek_liedere").update({
                suno_taak_id: taskId,
                updated_at: new Date().toISOString(),
            }).eq("id", lied_id);

            return new Response(
                JSON.stringify({ success: true, taak_id: taskId, boodskap: "Musiek word gegenereer..." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ========== GENEREER VIA REPLICATE (MusicGen) ==========
        if (type === "genereer_replicate") {
            const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
            if (!REPLICATE_API_TOKEN) throw new Error("REPLICATE_API_TOKEN nie gestel nie. Voeg dit by in Supabase Dashboard > Edge Functions > Secrets.");

            const { lied_id, lirieke, styl_prompt, tempo } = data;
            if (!lied_id) throw new Error("lied_id vereis");

            await supabase.from("musiek_liedere").update({
                status: "genereer",
                ai_diens: "replicate",
                fout_boodskap: null,
                updated_at: new Date().toISOString(),
            }).eq("id", lied_id);

            // Bou 'n beskrywende prompt
            const description = [
                styl_prompt || "Church hymn, choir, organ",
                lirieke ? `Lyrics: ${lirieke.substring(0, 500)}` : "",
                tempo ? `${tempo} BPM` : "80 BPM",
            ].filter(Boolean).join(". ");

            const repRes = await fetch("https://api.replicate.com/v1/predictions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
                },
                body: JSON.stringify({
                    // Nuwe weergawe ID vir meta/musicgen (large) - 2024 update
                    version: "7be0f12c54a8d033a0fbd14418c9af98962da9a86f5ff7811f9b3423a1f0b7d7",
                    input: {
                        prompt: description,
                        duration: 30,
                        output_format: "mp3",
                        normalization_strategy: "peak",
                    },
                }),
            });

            if (!repRes.ok) {
                const err = await repRes.text();
                await supabase.from("musiek_liedere").update({
                    status: "fout",
                    fout_boodskap: `Replicate fout: ${err}`,
                    updated_at: new Date().toISOString(),
                }).eq("id", lied_id);
                throw new Error(`Replicate API fout: ${err}`);
            }

            const repData = await repRes.json();

            await supabase.from("musiek_liedere").update({
                replicate_taak_id: repData.id,
                updated_at: new Date().toISOString(),
            }).eq("id", lied_id);

            return new Response(
                JSON.stringify({ success: true, taak_id: repData.id, boodskap: "Musiek word gegenereer via MusicGen..." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ========== KYK STATUS ==========
        if (type === "kyk_status") {
            const { lied_id } = data;
            if (!lied_id) throw new Error("lied_id vereis");

            const { data: lied } = await supabase
                .from("musiek_liedere")
                .select("*")
                .eq("id", lied_id)
                .single();

            if (!lied) throw new Error("Lied nie gevind nie");

            // As dit reeds gereed of gepubliseer is, stuur terug
            if (["gereed", "gepubliseer", "fout"].includes(lied.status)) {
                return new Response(
                    JSON.stringify({ success: true, status: lied.status, oudio_url: lied.oudio_url, fout: lied.fout_boodskap }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Kyk by die AI diens
            // Kyk by die AI diens
            if (lied.ai_diens === "suno" && lied.suno_taak_id) {
                const SUNO_API_KEY = Deno.env.get("SUNO_API_KEY");
                // Gebruik record-info endpoint vir sunoapi.org
                const statusRes = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${lied.suno_taak_id}`, {
                    headers: { "Authorization": `Bearer ${SUNO_API_KEY}` },
                });

                if (statusRes.ok) {
                    const statusJson = await statusRes.json();
                    const dataObj = statusJson?.data ?? statusJson;
                    const status = dataObj?.status;

                    // Suksesvolle generasie
                    if (status === 'SUCCESS' || status === 'FIRST_SUCCESS') {
                        const sunoData = dataObj?.response?.sunoData ?? dataObj?.sunoData;
                        // Soms is dit 'n array, soms nie
                        const msgData = Array.isArray(sunoData) ? sunoData[0] : sunoData;
                        const songUrl = msgData?.audioUrl || msgData?.streamAudioUrl || msgData?.stream_url;

                        if (songUrl) {
                            // Laai die oudio af en stoor in Supabase Storage
                            const audioRes = await fetch(songUrl);
                            const audioBlob = await audioRes.blob();
                            const storagePath = `${lied_id}/lied.mp3`;

                            const { error: uploadError } = await supabase.storage.from("musiek-liedere").upload(storagePath, audioBlob, { upsert: true, contentType: "audio/mpeg" });
                            if (uploadError) throw uploadError;

                            const { data: urlData } = supabase.storage.from("musiek-liedere").getPublicUrl(storagePath);

                            await supabase.from("musiek_liedere").update({
                                status: "gereed",
                                oudio_pad: storagePath,
                                oudio_url: urlData?.publicUrl || songUrl,
                                updated_at: new Date().toISOString(),
                            }).eq("id", lied_id);

                            return new Response(
                                JSON.stringify({ success: true, status: "gereed", oudio_url: urlData?.publicUrl || songUrl }),
                                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                            );
                        }
                    }

                    // Foutiewe generasie
                    if (status === 'CREATE_TASK_FAILED' || status === 'GENERATE_AUDIO_FAILED' || status === 'SENSITIVE_WORD_ERROR') {
                        await supabase.from("musiek_liedere").update({
                            status: "fout",
                            fout_boodskap: `Suno fout: ${dataObj?.errorMessage || status}`,
                            updated_at: new Date().toISOString(),
                        }).eq("id", lied_id);

                        return new Response(
                            JSON.stringify({ success: true, status: "fout", fout: dataObj?.errorMessage || status }),
                            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                        );
                    }
                }
            }

            if (lied.ai_diens === "replicate" && lied.replicate_taak_id) {
                const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
                const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${lied.replicate_taak_id}`, {
                    headers: { "Authorization": `Bearer ${REPLICATE_API_TOKEN}` },
                });
                if (statusRes.ok) {
                    const statusData = await statusRes.json();

                    if (statusData.status === "succeeded" && statusData.output) {
                        const audioUrl = typeof statusData.output === "string" ? statusData.output : statusData.output[0];
                        // Laai en stoor in Supabase Storage
                        const audioRes = await fetch(audioUrl);
                        const audioBlob = await audioRes.blob();
                        const storagePath = `${lied_id}/lied.mp3`;
                        await supabase.storage.from("musiek-liedere").upload(storagePath, audioBlob, { upsert: true, contentType: "audio/mpeg" });
                        const { data: urlData } = supabase.storage.from("musiek-liedere").getPublicUrl(storagePath);

                        await supabase.from("musiek_liedere").update({
                            status: "gereed",
                            oudio_pad: storagePath,
                            oudio_url: urlData?.publicUrl || audioUrl,
                            updated_at: new Date().toISOString(),
                        }).eq("id", lied_id);

                        return new Response(
                            JSON.stringify({ success: true, status: "gereed", oudio_url: urlData?.publicUrl || audioUrl }),
                            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                        );
                    }

                    if (statusData.status === "failed") {
                        await supabase.from("musiek_liedere").update({
                            status: "fout",
                            fout_boodskap: statusData.error || "Replicate generasie het gefaal",
                            updated_at: new Date().toISOString(),
                        }).eq("id", lied_id);

                        return new Response(
                            JSON.stringify({ success: true, status: "fout", fout: statusData.error }),
                            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                        );
                    }
                }
            }

            // Nog besig
            return new Response(
                JSON.stringify({ success: true, status: "genereer", boodskap: "Nog besig met generasie..." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        throw new Error(`Onbekende aksie: ${type}`);
    } catch (error: any) {
        console.error("musiek-ai fout:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
