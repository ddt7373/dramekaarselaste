import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "Dra Mekaar <gereedskap@dramekaarselaste.co.za>";

    const {
      title,
      body,
      type,
      priority,
      gemeente_id,
      target_audience,
      target_wyk_id,
      data,
    } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ success: false, error: "title en body vereis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build query for target users (gebruikers in gemeente)
    let gebruikerQuery = supabase
      .from("gebruikers")
      .select("id, naam, van, epos, rol, wyk_id")
      .eq("gemeente_id", gemeente_id || "")
      .not("epos", "is", null);

    if (!gemeente_id) {
      return new Response(
        JSON.stringify({ success: false, error: "gemeente_id vereis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: gebruikers, error: gebruikerError } = await gebruikerQuery;

    if (gebruikerError || !gebruikers?.length) {
      await saveNotificationRecord(supabase, {
        gemeente_id,
        title,
        body,
        type,
        priority,
        target_audience,
        target_wyk_id,
        total_sent: 0,
      });
      return new Response(
        JSON.stringify({ success: true, eligible_subscriptions: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter by target_audience
    let filtered = gebruikers;
    if (target_audience === "admins") {
      filtered = filtered.filter((g) => ["admin", "hoofadmin", "moderator"].includes(g.rol || ""));
    } else if (target_audience === "leraars") {
      filtered = filtered.filter((g) => g.rol === "leraar");
    } else if (target_audience === "ouderlings") {
      filtered = filtered.filter((g) => g.rol === "ouderling");
    } else if (target_audience === "diakens") {
      filtered = filtered.filter((g) => g.rol === "diaken");
    } else if (target_audience === "specific_wyk" && target_wyk_id) {
      filtered = filtered.filter((g) => g.wyk_id === target_wyk_id);
    }

    // Get users with email_notifications enabled
    const userIds = filtered.map((g) => g.id);
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .in("user_id", userIds)
      .eq("email_notifications", true);

    const emailUserIds = new Set((prefs || []).map((p) => p.user_id));
    const toEmail = filtered
      .filter((g) => emailUserIds.has(g.id) && g.epos?.trim())
      .map((g) => g.epos!.trim());

    let emailsSent = 0;

    if (RESEND_API_KEY && toEmail.length > 0) {
      const url = data?.url || "https://dramekaarselaste.co.za";
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #002855, #004895); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">${escapeHtml(title)}</h2>
    <p style="margin: 8px 0 0; opacity: 0.9;">Dra Mekaar se Laste</p>
  </div>
  <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; line-height: 1.6;">${escapeHtml(body)}</p>
    ${url ? `<p><a href="${escapeHtml(url)}" style="color: #D4A84B; font-weight: bold;">Bekyk in die app</a></p>` : ""}
  </div>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">Jy ontvang hierdie e-pos omdat jy e-pos kennisgewings aktiveer het.</p>
</body>
</html>`;

      for (const email of toEmail) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: EMAIL_FROM,
              to: [email],
              subject: title,
              html,
            }),
          });
          if (res.ok) emailsSent++;
          else console.error("Resend error for", email, await res.json());
        } catch (e) {
          console.error("Email send error:", e);
        }
      }
    } else if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping email notifications.");
    }

    await saveNotificationRecord(supabase, {
      gemeente_id,
      title,
      body,
      type,
      priority,
      target_audience,
      target_wyk_id,
      total_sent: emailsSent,
    });

    return new Response(
      JSON.stringify({
        success: true,
        eligible_subscriptions: emailsSent,
        emails_sent: emailsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Send notification error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function saveNotificationRecord(
  supabase: any,
  record: {
    gemeente_id: string;
    title: string;
    body: string;
    type?: string;
    priority?: string;
    target_audience?: string;
    target_wyk_id?: string | null;
    total_sent: number;
  }
) {
  try {
    await supabase.from("notifications").insert({
      gemeente_id: record.gemeente_id,
      title: record.title,
      body: record.body,
      type: record.type || "announcement",
      priority: record.priority || "normal",
      target_audience: record.target_audience || "all",
      target_wyk_id: record.target_wyk_id,
      total_sent: record.total_sent,
    });
  } catch (e) {
    console.error("Could not save notification record:", e);
  }
}
