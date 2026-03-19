import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check messaging is enabled
    const { data: settings } = await supabaseAdmin
      .from("messaging_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!settings?.enabled) {
      console.log("[Scheduler] Messaging is disabled — skipping");
      return new Response(JSON.stringify({ message: "Messaging disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current day/time in Africa/Lagos
    const now = new Date();
    const lagosTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
    const currentDay = dayNames[lagosTime.getDay()];
    const currentHour = lagosTime.getHours().toString().padStart(2, "0");
    const currentMinute = lagosTime.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;
    const today = lagosTime.toISOString().split("T")[0];

    console.log(`[Scheduler] Running for ${currentDay} at ${currentTime} (Africa/Lagos)`);

    // Find active schedules for current day and time (within 5 min window)
    const { data: schedules, error: schedErr } = await supabaseAdmin
      .from("message_schedules")
      .select("*, message_templates(*)")
      .eq("day_of_week", currentDay)
      .eq("is_active", true);

    if (schedErr) {
      console.error("[Scheduler] Error fetching schedules:", schedErr.message);
      throw schedErr;
    }

    if (!schedules || schedules.length === 0) {
      console.log("[Scheduler] No active schedules for", currentDay);
      return new Response(JSON.stringify({ message: "No schedules to process" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter schedules within ±5 min window
    const matchingSchedules = schedules.filter((s: any) => {
      const [sh, sm] = s.send_time.split(":").map(Number);
      const schedMinutes = sh * 60 + sm;
      const nowMinutes = parseInt(currentHour) * 60 + parseInt(currentMinute);
      return Math.abs(schedMinutes - nowMinutes) <= 5;
    });

    console.log(`[Scheduler] ${matchingSchedules.length} schedules match current time window`);

    let totalSent = 0;
    let totalFailed = 0;

    for (const schedule of matchingSchedules) {
      const template = schedule.message_templates;
      if (!template || !template.is_active) continue;

      console.log(`[Scheduler] Processing: ${template.title} (rule: ${schedule.recipient_rule})`);

      // Determine recipients based on rule
      let recipients: Array<{ id: string; phone: string; location_id: string }> = [];

      if (schedule.recipient_rule === "all_active") {
        // All active members with phone numbers
        const { data: members } = await supabaseAdmin
          .from("members")
          .select("id, phone, location_id, do_not_contact")
          .eq("status", "active")
          .eq("do_not_contact", false)
          .not("phone", "is", null);

        recipients = (members || [])
          .filter((m: any) => m.phone && m.phone.trim())
          .map((m: any) => ({ id: m.id, phone: m.phone.trim(), location_id: m.location_id }));

      } else if (schedule.recipient_rule === "present") {
        // Members who attended today
        const { data: attendance } = await supabaseAdmin
          .from("attendance")
          .select("member_id, members(phone, do_not_contact, location_id)")
          .eq("date", today);

        const seen = new Set<string>();
        recipients = (attendance || [])
          .filter((a: any) => {
            if (seen.has(a.member_id)) return false;
            seen.add(a.member_id);
            return a.members?.phone && !a.members?.do_not_contact;
          })
          .map((a: any) => ({ id: a.member_id, phone: a.members.phone.trim(), location_id: a.members.location_id }));

      } else if (schedule.recipient_rule === "absent") {
        // Active members who did NOT attend today
        const { data: allMembers } = await supabaseAdmin
          .from("members")
          .select("id, phone, location_id, do_not_contact")
          .eq("status", "active")
          .eq("do_not_contact", false)
          .not("phone", "is", null);

        const { data: attendance } = await supabaseAdmin
          .from("attendance")
          .select("member_id")
          .eq("date", today);

        const presentIds = new Set((attendance || []).map((a: any) => a.member_id));
        recipients = (allMembers || [])
          .filter((m: any) => m.phone && m.phone.trim() && !presentIds.has(m.id))
          .map((m: any) => ({ id: m.id, phone: m.phone.trim(), location_id: m.location_id }));
      }

      console.log(`[Scheduler] ${recipients.length} recipients for ${template.title}`);

      // Send to each recipient (with dedup check)
      for (const recipient of recipients) {
        // Dedup: check if already sent today
        const { data: existing } = await supabaseAdmin
          .from("message_logs")
          .select("id")
          .eq("member_id", recipient.id)
          .eq("template_id", template.id)
          .gte("created_at", `${today}T00:00:00`)
          .limit(1);

        if (existing && existing.length > 0) {
          continue; // Skip duplicate
        }

        // Log and attempt send
        const { data: logRecord } = await supabaseAdmin
          .from("message_logs")
          .insert({
            member_id: recipient.id,
            phone: recipient.phone,
            template_id: template.id,
            service_id: schedule.service_id,
            location_id: recipient.location_id,
            message_body: template.body,
            status: "pending",
          })
          .select()
          .single();

        if (!logRecord) continue;

        // Try send via Twilio
        let status = "pending";
        let providerMsgId = null;
        let error = null;

        try {
          const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
          const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");

          if (LOVABLE_API_KEY && TWILIO_API_KEY) {
            const response = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "X-Connection-Api-Key": TWILIO_API_KEY,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: recipient.phone,
                From: settings.sender_name || "DLBC",
                Body: template.body,
              }),
            });

            const result = await response.json();
            if (response.ok && result.sid) {
              status = "sent";
              providerMsgId = result.sid;
              totalSent++;
            } else {
              status = "failed";
              error = result.message || JSON.stringify(result);
              totalFailed++;
            }
          } else {
            status = "pending";
            error = "SMS provider not configured";
          }
        } catch (sendErr: any) {
          status = "failed";
          error = sendErr.message;
          totalFailed++;
        }

        // Update log
        await supabaseAdmin
          .from("message_logs")
          .update({
            status,
            provider_message_id: providerMsgId,
            sent_at: status === "sent" ? new Date().toISOString() : null,
            error_message: error,
          })
          .eq("id", logRecord.id);
      }
    }

    console.log(`[Scheduler] Complete: ${totalSent} sent, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({ sent: totalSent, failed: totalFailed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Scheduler] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
