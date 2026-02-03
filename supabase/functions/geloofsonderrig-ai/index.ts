import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_URL = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

async function callGemini(apiKey: string, systemPrompt: string, userContent: string, options: {
    responseMimeType?: string;
    temperature?: number;
} = {}) {
    const url = `${GEMINI_URL('gemini-2.0-flash')}?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                response_mime_type: options.responseMimeType || "text/plain"
            }
        })
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error?.message || "Gemini Fout");
    return resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const body = await req.json();
        const type = body.type || body.action || 'chat';
        const data = body.data || body;

        // ========== EMAIL SHARE (stuur na prente@dramekaarselaste.co.za - gebruiker weet nie) ==========
        if (type === 'email_share') {
            const recipientEmail = data.recipientEmail || 'prente@dramekaarselaste.co.za';
            const subject = data.subject || 'Nuwe Geloofsonderrig Prent';
            const senderName = data.senderName || 'Anoniem';
            const htmlBody = data.htmlBody || '';
            const imageBase64 = data.imageBase64 || '';
            const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
            const FROM_EMAIL = Deno.env.get('GELOOFSONDERRIG_FROM_EMAIL') || 'Geloofsonderrig <onboarding@resend.dev>';

            if (RESEND_API_KEY) {
                try {
                    let html = htmlBody;
                    if (imageBase64) {
                        html += `<hr/><p><strong>Prent:</strong></p><img src="data:image/png;base64,${imageBase64}" alt="Prent" style="max-width:100%;height:auto;" />`;
                    }
                    const res = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${RESEND_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: FROM_EMAIL,
                            to: [recipientEmail],
                            subject,
                            html: html || `<p>Gedeel deur ${senderName}</p>`,
                        }),
                    });
                    const resData = await res.json();
                    if (!res.ok) throw new Error(resData?.message || 'Resend fout');
                } catch (e: any) {
                    console.error('Email share failed:', e?.message || e);
                }
            }
            return new Response(JSON.stringify({ success: true, data: { sent: true }, v: "5.2.0" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY nie gestel nie");

        const context = data.context || data.lesInhoud || "";
        const prompt = data.prompt || "Hallo";
        const lang = data.language === 'en' ? 'en' : 'af';

        // ========== GENERATE MENTOR FRAMEWORK ==========
        if (type === 'generate_mentor_framework') {
            const lesTitel = data.lesTitel || "Les";
            const klasNaam = data.klasNaam || "Klas";
            const skavTellings = data.skavTellings || { kennis: 0, gesindheid: 0, vaardighede: 0, waardes: 0 };
            const sterkpunte = data.sterkpunte || [];
            const leemtes = data.leemtes || [];
            const isGroep = data.isGroep !== false;
            const aantalLeerders = data.aantalLeerders || 1;

            const sysPrompt = lang === 'af'
                ? `Jy is 'n ervare geloofsonderrig mentor. Genereer 'n volledige 5-fase groepsgesprek raamwerk in Afrikaans as JSON.
Die raamwerk moet hierdie presiese struktuur volg (gebruik presies hierdie sleutels):
{
  "inleiding": {
    "titel": "Groep Gespreksraamwerk",
    "subtitel": "5-fase geloofsgesprek",
    "doel": "Beskrywing van die doel",
    "toon": "Aanmoedigend, ondersteunend",
    "tydsraamwerk": "45-60 minute"
  },
  "skav_opsomming": {
    "kennis": {"persentasie": 25},
    "gesindheid": {"persentasie": 25},
    "vaardighede": {"persentasie": 25},
    "waardes": {"persentasie": 25},
    "sterkste_area": "kennis",
    "swakste_area": "waardes"
  },
  "voorbereiding": {
    "kontrolelys": ["item1", "item2", "item3"]
  },
  "fase1_opening": {
    "begin_so": {"titel": "Begin", "voorbeelde": ["vraag1", "vraag2"]},
    "ysbreker_vrae": [{"vraag": "vraag", "doel": "doel"}],
    "oorgang_na_les": {"titel": "Oorgang", "voorbeelde": ["voorbeeld"]}
  },
  "fase2_erkenning": {
    "sterkpunte_om_te_erken": ["sterk1"],
    "hoe_om_te_erken": "Beskrywing",
    "waarom_belangrik": "Beskrywing waarom erkenning belangrik is",
    "vermy_dit": ["vermy1", "vermy2"]
  },
  "fase3_verdieping": {
    "titel": "Verdieping",
    "tydsduur": "10-15 minute",
    "ikoon": "lightbulb",
    "kleur": "from-amber-500 to-orange-600",
    "strategie": "Beskrywing van hoe om die groep te verdiep",
    "vrae_per_area": {
      "sterkste": {"area": "kennis", "persentasie": 30, "status": "Beskrywing", "vrae": [{"vraag": "vraag", "doel": "doel"}], "benadering": "Beskrywing"},
      "swakste": {"area": "waardes", "persentasie": 15, "status": "Beskrywing", "vrae": [{"vraag": "vraag", "doel": "doel"}], "benadering": "Beskrywing"}
    },
    "luister_tegnieke": [{"tegniek": "naam", "voorbeeld": "voorbeeld", "doel": "doel"}]
  },
  "fase4_verhouding": {
    "titel": "Verhouding met God",
    "tydsduur": "8-12 minute",
    "ikoon": "heart",
    "kleur": "from-purple-500 to-pink-600",
    "kernboodskap": "Beskrywing van die kernboodskap",
    "verhouding_vrae": [{"vraag": "vraag", "doel": "doel"}],
    "gebed_opsies": [{"tipe": "opsie", "beskrywing": "beskrywing", "voorbeeld": "voorbeeld"}],
    "skrifverwysings": [{"vers": "vers", "teks": "teks", "toepassing": "toepassing"}]
  },
  "fase5_afsluiting": {
    "titel": "Afsluiting",
    "tydsduur": "5-8 minute",
    "ikoon": "flag",
    "kleur": "from-indigo-500 to-blue-600",
    "opsomming": {"titel": "Opsomming", "voorbeeld": "voorbeeld teks"},
    "praktiese_stappe": [{"stap": "stap", "beskrywing": "beskrywing", "voorbeeld": "voorbeeld"}],
    "afsluitingswoorde": ["woord1", "woord2"],
    "opvolg_plan": {"titel": "Opvolg", "aksies": ["aksie1", "aksie2"]}
  }
}
BELANGRIK: fase3_verdieping, fase4_verhouding en fase5_afsluiting moet RYK inhoud hê. Vul AL die velde in.
KRITIES: Die raamwerk moet SPESIFIEK vir HIERDIE les wees - nie generies nie. Gebruik die lesinhoud, les titel, skrifverwysings en temas direk in jou vrae en strategieë. Verwerk die leerders se sterkpunte en leemtes (uit hul interaksie) in fase2 en fase3. As voorbeelde van interaksie gegee word, bou jou ysbreker-vrae, verdiepingsvrae en verhoudingsvrae daarop - verwys na wat die kinders gevra of gesê het. Moet nie 'n algemene groepsgesprek wees nie - dit moet voel soos 'n gesprek wat net vir hierdie les en hierdie groep ontwerp is.
Antwoord SLEGS met geldige JSON. Geen markdown.`
                : `You are an experienced faith education mentor. Generate a COMPLETE 5-phase group discussion framework in English as JSON. ALL phases must be fully filled.
Use this exact structure (use exactly these keys). EVERY phase must have content:
{
  "inleiding": {"titel": "Group Conversation Framework", "subtitel": "5-phase faith discussion", "doel": "Description", "toon": "Encouraging, supportive", "tydsraamwerk": "45-60 minutes"},
  "skav_opsomming": {"kennis": {"persentasie": N}, "gesindheid": {"persentasie": N}, "vaardighede": {"persentasie": N}, "waardes": {"persentasie": N}, "sterkste_area": "kennis", "swakste_area": "waardes"},
  "voorbereiding": {"kontrolelys": ["item1", "item2", "item3"]},
  "fase1_opening": {"begin_so": {"titel": "Start", "voorbeelde": ["q1", "q2"]}, "ysbreker_vrae": [{"vraag": "question", "doel": "goal"}], "oorgang_na_les": {"titel": "Transition", "voorbeelde": ["example"]}},
  "fase2_erkenning": {"sterkpunte_om_te_erken": ["strength1"], "hoe_om_te_erken": "Description or array of items", "waarom_belangrik": "text", "vermy_dit": ["avoid1"]},
  "fase3_verdieping": {"titel": "Deepening", "tydsduur": "10-15 min", "ikoon": "lightbulb", "kleur": "from-amber-500 to-orange-600", "strategie": "text", "vrae_per_area": {"sterkste": {"area": "kennis", "persentasie": 30, "status": "text", "vrae": [{"vraag": "q", "doel": "d"}], "benadering": "text"}, "swakste": {"area": "waardes", "persentasie": 15, "status": "text", "vrae": [{"vraag": "q", "doel": "d"}], "benadering": "text"}}, "luister_tegnieke": [{"tegniek": "name", "voorbeeld": "example", "doel": "goal"}]},
  "fase4_verhouding": {"titel": "Relationship with God", "tydsduur": "8-12 min", "ikoon": "heart", "kleur": "from-purple-500 to-pink-600", "kernboodskap": "text", "verhouding_vrae": [{"vraag": "q", "doel": "d"}], "gebed_opsies": [{"tipe": "type", "beskrywing": "desc", "voorbeeld": "example"}], "skrifverwysings": [{"vers": "verse", "teks": "text", "toepassing": "application"}]},
  "fase5_afsluiting": {"titel": "Closing", "tydsduur": "5-8 min", "ikoon": "flag", "kleur": "from-indigo-500 to-blue-600", "opsomming": {"titel": "Summary", "voorbeeld": "example"}, "praktiese_stappe": [{"stap": "step", "beskrywing": "desc", "voorbeeld": "example"}], "afsluitingswoorde": ["word1", "word2"], "opvolg_plan": {"titel": "Follow-up", "aksies": ["action1", "action2"]}}
}
CRITICAL: fase3_verdieping, fase4_verhouding and fase5_afsluiting must have RICH content. Fill ALL fields. Reply with valid JSON only. No markdown.`;

            const interaksieKontekst = data.interaksieVoorbeelde ? `\n\n=== VIRBEDEELDE INTERAKSIES (gebruik dit om jou vrae te bou - verwys na spesifieke vrae/antwoorde): ===\n${data.interaksieVoorbeelde}\n=== EINDE INTERAKSIES ===` : '';
            const skrifKontekst = data.skrifverwysing ? `\nSkrifverwysing vir hierdie les: ${data.skrifverwysing}` : '';
            const userContent = `Les titel: ${lesTitel}\nKlas: ${klasNaam}\nAantal leerders: ${aantalLeerders}${skrifKontekst}\n\n=== LESINHOUD (bou jou vrae en strategieë HIEROP - gebruik temas, konsepte en terme uit die les): ===\n${context.substring(0, 4500)}\n=== EINDE LESINHOUD ===\n\nKGVW tellings (uit leerders se interaksie): Kennis=${skavTellings.kennis}, Gesindheid=${skavTellings.gesindheid}, Vaardighede=${skavTellings.vaardighede}, Waardes=${skavTellings.waardes}\nSterkpunte (uit interaksie - erken en bou daarop): ${sterkpunte.join(', ') || 'Geen'}\nLeemtes (uit interaksie - verdiep en adresseer): ${leemtes.join(', ') || 'Geen'}${interaksieKontekst}\n\nBELANGRIK: Bou die groepsgesprek SPESIFIEK op hierdie les en die kinders se interaksie. Moet nie generies wees nie. Verwerk die sterkpunte en leemtes in die vrae en strategieë. As interaksies gegee is, bou jou vrae daarop.`;

            const reply = await callGemini(GEMINI_API_KEY, sysPrompt, userContent, {
                responseMimeType: "application/json",
                temperature: 0.6
            });

            const cleanJson = reply.replace(/```json/g, '').replace(/```/g, '').trim();
            let framework: any;
            try {
                framework = JSON.parse(cleanJson);
            } catch {
                throw new Error("Kon nie raamwerk parse nie");
            }

            return new Response(JSON.stringify({
                success: true,
                framework,
                data: { framework },
                v: "5.2.0"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ========== PROMPTS (unique, SKAV-structured for 12-17) ==========
        if (type === 'prompts') {
            const promptCount = data.promptCount || 0;
            const usedPrompts = data.usedPrompts || [];

            const sysPrompt = lang === 'af'
                ? `Jy is Gids, 'n vriendelike KI-assistent vir hoerskool leerders (12-17). Genereer 4 UNIEKE vrae in Afrikaans as JSON array.
Elke vraag moet 'n ander KGVW-area fokus: kennis (feit), gesindheid (houding), vaardigheid (toepassing), waardes (oortuiging).
Formaat: [{"vraag": "vraag teks", "kgvw": "kennis|gesindheid|vaardigheid|waardes"}]
Vrae moet aanmoedigend wees, nie te formeel nie. Moenie hierdie vrae herhaal nie: ${usedPrompts.join('; ')}
Genereer vars, kreatiewe vrae wat die kind help om die les te verken. Antwoord SLEGS met JSON.`
                : `You are Gids, a friendly AI for high school learners (12-17). Generate 4 UNIQUE questions in English as JSON array.
Each question must focus a different SKAV area: knowledge, attitude, skill, values.
Format: [{"vraag": "question text", "kgvw": "kennis|gesindheid|vaardigheid|waardes"}]
Be encouraging, not too formal. Do NOT repeat: ${usedPrompts.join('; ')}
Generate fresh, creative questions. Reply with JSON only.`;

            const userContent = `Lesinhoud (eerste 2000 karakters):\n${context.substring(0, 2000)}\n\nVraagnommer in gesprek: ${promptCount}`;

            const reply = await callGemini(GEMINI_API_KEY, sysPrompt, userContent, {
                responseMimeType: "application/json",
                temperature: 0.9
            });

            const cleanJson = reply.replace(/```json/g, '').replace(/```/g, '').trim();
            let items: any[] = [];
            try {
                const parsed = JSON.parse(cleanJson);
                items = Array.isArray(parsed) ? parsed : (parsed.prompts || []);
                items = items.map((p: any) => typeof p === 'string' ? p : (p.vraag || p.question || p));
            } catch {
                items = lang === 'af'
                    ? ['Vertel my meer oor die hoofidee', 'Hoekom is dit vir my belangrik?', 'Hoe kan ek dit in my lewe gebruik?', 'Wat dink jy is die belangrikste les?']
                    : ['Tell me more about the main idea', 'Why is this important for me?', 'How can I use this in my life?', 'What do you think is the key lesson?'];
            }

            return new Response(JSON.stringify({
                success: true,
                data: { prompts: items, message: "" },
                v: "5.2.0"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ========== CHAT (encouraging, returns nextPrompts + kgvw) ==========
        if (type === 'chat') {
            const chatHistory = data.chatHistory || [];
            const promptCount = data.promptCount || 1;

            const sysPrompt = lang === 'af'
                ? `Jy is Gids, soos 'n vriendelike maat (peer) wat met hoerskool kinders (12-17) praat. Antwoord in Afrikaans.
BELANGRIK: Wees EENVOUDIG - gebruik maklike woorde, kort sinne. Praat soos 'n vriend, nie 'n onderwyser nie.
Gebruik gereeld emojis (min 2-3 per antwoord) - byv. 😊 🙏 ✨ 💪 🌟 ❤️ 📖
Moenie formeel of prekerig wees nie. Wees warm, aanmoedigend, soos iemand wat saam met hulle ontdek.
Antwoorde moet 2-4 kort paragrawe wees, maklik om te lees.
Na jou antwoord, genereer 4 NUWE vervolgvrae (verskillend van enige vorige vrae).
Formaat jou finale antwoord as: 
ANTWOORD:[jou volledige antwoord hier]

VRAE:[vraag1|vraag2|vraag3|vraag4]

KGVW:[kennis of gesindheid of vaardigheid of waardes]`
                : `You are Gids, like a friendly peer talking to high school kids (12-17). Reply in English.
IMPORTANT: Be SIMPLE - use easy words, short sentences. Talk like a friend, not a teacher.
Use emojis regularly (at least 2-3 per answer) - e.g. 😊 🙏 ✨ 💪 🌟 ❤️ 📖
Don't be formal or preachy. Be warm, encouraging, like someone discovering with them.
Answers should be 2-4 short paragraphs, easy to read.
After your answer, generate 4 NEW follow-up questions (different from any previous).
Format your final reply as:
ANSWER:[your full answer here]

QUESTIONS:[q1|q2|q3|q4]

SKAV:[knowledge or attitude or skill or values]`;

            const historyText = chatHistory.slice(-4).map((m: any) =>
                `${m.role === 'user' ? 'Leerder' : 'Gids'}: ${m.content}`
            ).join('\n');
            const userContent = `Lesinhoud:\n${context.substring(0, 3500)}\n\n${historyText ? `Gesprek:\n${historyText}\n\n` : ''}Leerder se vraag: ${prompt}`;

            const reply = await callGemini(GEMINI_API_KEY, sysPrompt, userContent, { temperature: 0.8 });

            let message = reply;
            let nextPrompts: string[] = [];
            let kgvw = 'kennis';

            const antwoordMatch = reply.match(/(?:ANTWOORD|ANSWER):\s*([\s\S]*?)(?=(?:VRAE|QUESTIONS):|$)/i);
            const vraeMatch = reply.match(/(?:VRAE|QUESTIONS):\s*([\s\S]*?)(?=(?:KGVW|SKAV):|$)/i);
            const kgvwMatch = reply.match(/(?:KGVW|SKAV):\s*(\w+)/i);

            if (antwoordMatch) message = antwoordMatch[1].trim();
            if (vraeMatch) nextPrompts = vraeMatch[1].split('|').map((s: string) => s.trim()).filter(Boolean).slice(0, 4);
            if (kgvwMatch) kgvw = (kgvwMatch[1] || 'kennis').toLowerCase();

            if (nextPrompts.length < 2) {
                nextPrompts = lang === 'af'
                    ? ['Vertel my meer!', 'Hoekom is dit belangrik?', 'Hoe pas dit by my lewe in?', 'Wat is die volgende stap?']
                    : ['Tell me more!', 'Why is this important?', 'How does this fit my life?', 'What is the next step?'];
            }

            return new Response(JSON.stringify({
                success: true,
                data: {
                    message: message || reply,
                    nextPrompts,
                    kgvw,
                    suggestedImagePrompt: `Visualiseer hierdie konsep vir 'n kind: ${message.substring(0, 100)}...`
                },
                v: "5.2.0"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ========== QUIZ ==========
        if (type === 'quiz') {
            const sysPrompt = "Genereer 5 Afrikaanse multikeuse vrae as JSON array: [{ \"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctIndex\": 0 }]. Antwoord SLEGS met JSON.";
            const reply = await callGemini(GEMINI_API_KEY, sysPrompt, `Kontekst: ${context}\n\nGenereer quiz.`, {
                responseMimeType: "application/json"
            });
            const cleanJson = reply.replace(/```json/g, '').replace(/```/g, '').trim();
            let items: any[] = [];
            try {
                const parsed = JSON.parse(cleanJson);
                items = Array.isArray(parsed) ? parsed : (parsed.questions || []);
            } catch { }
            return new Response(JSON.stringify({
                success: true,
                data: { message: "", prompts: items, verses: [] },
                v: "5.2.0"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ========== VERSES ==========
        if (type === 'verses') {
            const sysPrompt = "Extraheer 5 Afrikaanse Bybelverse as JSON array: [{ \"reference\": \"...\", \"text\": \"...\" }]. Antwoord SLEGS met JSON.";
            const reply = await callGemini(GEMINI_API_KEY, sysPrompt, `Kontekst: ${context}\n\nExtraheer verse.`, {
                responseMimeType: "application/json"
            });
            const cleanJson = reply.replace(/```json/g, '').replace(/```/g, '').trim();
            let items: any[] = [];
            try {
                const parsed = JSON.parse(cleanJson);
                items = Array.isArray(parsed) ? parsed : (parsed.verses || []);
            } catch { }
            return new Response(JSON.stringify({
                success: true,
                data: { message: "", prompts: [], verses: items },
                v: "5.2.0"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ========== GENERATE IMAGE (Imagen - flat design, symbolic, NO text) ==========
        if (type === 'generate_image') {
            const answerText = data.answerText || data.answer || "";
            const promptText = data.promptText || data.prompt || "";
            const lessonExcerpt = (answerText || promptText).substring(0, 500);

            // CRITICAL: Interpret MEANING, not literal words. E.g. "liefde" → big red heart, NOT text "liefde"
            const visualPromptSys = `You are an expert at converting abstract concepts into visual metaphors for image generation.

TASK: Given faith lesson content (answer or question), create an English image prompt that VISUALIZES THE MEANING using symbols and metaphors. NEVER include any text, words, or letters in the image.

RULES:
- INTERPRET the meaning: "liefde" → a large red heart; "geloof" → mountain or anchor; "vrede" → dove; "gebed" → hands together; "hoop" → sunrise; "vergeving" → embrace or open hands
- Use ONLY visual symbols: hearts, mountains, doves, hands, sun, light, paths, trees, water, etc.
- NO text, NO words, NO letters anywhere
- Style: minimalist flat design, modern 2D illustration (like Kurzgesagt, Google Material Design, Dribbble)
- Bright gradient backgrounds (warm sunsets, fresh blue skies, vibrant pink/purple)
- Simple geometric shapes with soft rounded edges
- Limited palette of 3-5 main colors per image
- Central composition, one main visual metaphor
- Subtle shadows and glow for depth
- Youthful, contemporary aesthetic for 12-17 year olds
- 1:1 square format, social media optimized
- Fresh, energetic, positive, aspirational feel

Output ONLY the image prompt in English, max 100 words.`;
            const visualPrompt = await callGemini(GEMINI_API_KEY, visualPromptSys,
                `Faith lesson content to visualize (interpret the MEANING, not the words):\n${lessonExcerpt}`,
                { temperature: 0.7 }
            );

            const imgPrompt = (visualPrompt || `Minimalist flat design illustration of hope and faith, large red heart symbol, warm gradient background, soft rounded shapes, no text, 1:1 square`).substring(0, 480);

            const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`;
            const imgResponse = await fetch(imagenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: imgPrompt }],
                    parameters: { sampleCount: 1, aspectRatio: "1:1" }
                })
            });

            const imgData = await imgResponse.json();
            let imageBase64 = "";
            if (imgResponse.ok && imgData?.predictions?.[0]?.bytesBase64Encoded) {
                imageBase64 = imgData.predictions[0].bytesBase64Encoded;
            } else if (imgData?.predictions?.[0]?.image?.bytesBase64Encoded) {
                imageBase64 = imgData.predictions[0].image.bytesBase64Encoded;
            }

            return new Response(JSON.stringify({
                success: !!imageBase64,
                data: { imageBase64, mimeType: "image/png" },
                error: !imageBase64 ? (imgData?.error?.message || "Image generation failed") : undefined,
                v: "5.2.0"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ========== GENERATE POEM (from lesson content - beloning) ==========
        if (type === 'generate_poem') {
            const lessonContent = data.lesInhoud || data.lessonContent || data.context || "";
            const lessonTitle = data.lesTitel || data.lessonTitle || "Les";

            const poemSys = lang === 'en'
                ? `You are a creative poet. Create a short, uplifting poem (4-8 lines) based on the faith lesson content. The poem should capture the key message in a memorable, rhythmic way. Use simple language suitable for 12-17 year olds. Output ONLY the poem, no title or explanation.`
                : `Jy is 'n kreatiewe digter. Skep 'n kort, opbeurende gedig (4-8 reëls) gebaseer op die geloofsles-inhoud. Die gedig moet die kernboodskap vasvang op 'n onthoubare, ritmiese manier. Gebruik eenvoudige taal vir 12-17 jariges. Antwoord SLEGS met die gedig, geen titel of verduideliking nie.`;

            const poem = await callGemini(GEMINI_API_KEY, poemSys,
                `Les: ${lessonTitle}\n\nInhoud:\n${lessonContent.substring(0, 800)}`,
                { temperature: 0.8 }
            );

            return new Response(JSON.stringify({
                success: true,
                data: { poem: (poem || "").trim(), title: lessonTitle },
                v: "5.2.0"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ========== GENERATE MUSIC (Suno API or ABC fallback - beloning) ==========
        if (type === 'generate_music') {
            const poemText = data.poem || data.poemText || "";
            const lessonContent = data.lesInhoud || data.lessonContent || "";
            const lessonTitle = (data.lesTitel || data.lessonTitle || "Geloofsgedig").substring(0, 80);
            const lyrics = (poemText || lessonContent.substring(0, 400)).trim().substring(0, 3000) || "God is liefde. Jesus het ons gered.";
            const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');

            if (SUNO_API_KEY && lyrics) {
                try {
                    const sunoRes = await fetch('https://api.sunoapi.org/api/v1/generate', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${SUNO_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            customMode: true,
                            instrumental: false,
                            model: 'V4_5ALL',
                            callBackUrl: 'https://example.com/callback',
                            prompt: lyrics.substring(0, 3000),
                            style: 'Gospel, Inspirational, Acoustic',
                            title: lessonTitle.substring(0, 80)
                        })
                    });
                    const sunoJson = await sunoRes.json();

                    if (sunoJson?.code !== 200) {
                        const errMsg = sunoJson?.msg || sunoJson?.error || `Suno API: ${sunoJson?.code || sunoRes.status}`;
                        console.error('Suno generate failed:', errMsg);
                    } else if (sunoJson?.data?.taskId) {
                        const taskId = sunoJson.data.taskId;
                        for (let i = 0; i < 12; i++) {
                            await new Promise(r => setTimeout(r, 5000));
                            const statusRes = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
                                method: 'GET',
                                headers: { 'Authorization': `Bearer ${SUNO_API_KEY}` }
                            });
                            const statusJson = await statusRes.json();
                            const dataObj = statusJson?.data ?? statusJson;
                            const status = dataObj?.status;
                            const sunoData = dataObj?.response?.sunoData ?? dataObj?.sunoData;
                            if (status === 'SUCCESS' || status === 'FIRST_SUCCESS') {
                                const first = Array.isArray(sunoData) ? sunoData[0] : sunoData;
                                const audioUrl = first?.audioUrl || first?.streamAudioUrl || first?.stream_url;
                                if (audioUrl) {
                                    return new Response(JSON.stringify({
                                        success: true,
                                        data: {
                                            audioUrl,
                                            streamAudioUrl: first?.streamAudioUrl || first?.stream_url || audioUrl,
                                            poem: poemText.substring(0, 200),
                                            suno: true
                                        },
                                        v: "5.2.0"
                                    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                                }
                            }
                            if (status === 'CREATE_TASK_FAILED' || status === 'GENERATE_AUDIO_FAILED' || status === 'SENSITIVE_WORD_ERROR') {
                                console.error('Suno task failed:', status, dataObj?.errorMessage);
                                break;
                            }
                        }
                    }
                } catch (e: any) {
                    console.error('Suno API error:', e);
                }
            }

            const musicSys = `You are a music composer. Create a simple ABC notation melody (4-8 bars) that could accompany the given text/poem. Use a gentle, uplifting tune in C major. Keep it simple - quarter and half notes. Output ONLY valid ABC notation starting with X:1 and including T:, M:, L:, K: and the melody. No explanation.`;
            const abcContent = await callGemini(GEMINI_API_KEY, musicSys,
                `Text/Poem:\n${lyrics}\n\nCreate simple ABC melody.`,
                { temperature: 0.6 }
            );
            let abc = (abcContent || "").replace(/```\w*/g, '').replace(/```/g, '').trim();
            if (!abc.includes('X:') && !abc.includes('K:')) {
                abc = `X:1\nT:${lessonTitle}\nM:4/4\nL:1/4\nK:C\nC E G c|`;
            }
            return new Response(JSON.stringify({
                success: true,
                data: { abc, poem: poemText.substring(0, 200), suno: false },
                v: "5.2.0"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ========== INFOGRAPHIC / MINDMAP (Mermaid SVG) ==========
        if (type === 'infographic' || type === 'mindmap') {
            const targetCheck = data.targetCheck || {};
            const promptText = targetCheck.prompt || prompt;
            const answerText = targetCheck.answer || "";

            const sysPrompt = `Skep 'n Mermaid flowchart (graph) wat die konsep visualiseer. Gebruik graph TD of graph LR.
Formaat: Begin met "graph TD" of "graph LR", dan nodusse soos A[teks] --> B[teks].
Antwoord SLEGS met die Mermaid kode. Geen uitleg. Geen markdown blokke.`;
            const userContent = `Vraag: ${promptText}\nAntwoord: ${answerText.substring(0, 500)}\n\nGenereer Mermaid flowchart.`;

            const reply = await callGemini(GEMINI_API_KEY, sysPrompt, userContent, { temperature: 0.5 });
            const svg = reply.replace(/```mermaid/g, '').replace(/```/g, '').trim();

            return new Response(JSON.stringify({
                success: true,
                data: { svg: svg.startsWith('graph') ? svg : `graph TD\n  A[${promptText.substring(0, 30)}]\n  B[Konsep]` },
                svg,
                v: "5.2.0"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ========== DEFAULT CHAT ==========
        const sysPrompt = "Jy is Gids. Antwoord in Afrikaans.";
        const reply = await callGemini(GEMINI_API_KEY, sysPrompt, `Kontekst: ${context}\n\n${prompt}`);
        return new Response(JSON.stringify({
            success: true,
            data: { message: reply, prompts: [], verses: [] },
            v: "5.2.0"
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
