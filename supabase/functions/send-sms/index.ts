import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only super_admin can send messages
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (!callerRole || callerRole.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { mode, template_id, phone, member_id, location_id } = body;

    if (!template_id || !phone) {
      return new Response(JSON.stringify({ error: "template_id and phone are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate phone format
    const cleanPhone = phone.replace(/\s+/g, "");
    if (!/^\+\d{10,15}$/.test(cleanPhone)) {
      return new Response(JSON.stringify({ error: "Invalid phone number format. Use international format: +234XXXXXXXXXX" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch template
    const { data: template, error: tplErr } = await supabaseAdmin
      .from("message_templates")
      .select("*")
      .eq("id", template_id)
      .single();

    if (tplErr || !template) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check messaging settings
    const { data: settings } = await supabaseAdmin
      .from("messaging_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    // Check if member has do_not_contact
    if (member_id) {
      const { data: member } = await supabaseAdmin
        .from("members")
        .select("do_not_contact, phone")
        .eq("id", member_id)
        .single();
      if (member?.do_not_contact) {
        return new Response(JSON.stringify({ error: "Member has opted out of communications" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check for duplicate message within last hour (idempotency)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existingLogs } = await supabaseAdmin
      .from("message_logs")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("template_id", template_id)
      .gte("created_at", oneHourAgo)
      .limit(1);

    if (existingLogs && existingLogs.length > 0) {
      return new Response(JSON.stringify({ error: "Duplicate message: already sent to this number within the last hour" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the message attempt
    const logEntry = {
      member_id: member_id || null,
      phone: cleanPhone,
      template_id: template_id,
      service_id: body.service_id || null,
      location_id: location_id || null,
      message_body: template.body,
      status: "pending",
    };

    const { data: logRecord, error: logErr } = await supabaseAdmin
      .from("message_logs")
      .insert(logEntry)
      .select()
      .single();

    if (logErr) {
      console.error("Failed to create log entry:", logErr.message);
      return new Response(JSON.stringify({ error: "Failed to log message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If messaging not enabled or mode is test with no provider, log as pending
    if (!settings?.enabled) {
      console.log("[SMS] Messaging disabled — logged as pending:", logRecord.id);
      return new Response(
        JSON.stringify({
          success: true,
          log_id: logRecord.id,
          status: "pending",
          message: "Message logged but SMS delivery is disabled. Enable messaging in settings to send.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Attempt SMS delivery via Twilio (if configured)
    let deliveryStatus = "pending";
    let providerMessageId = null;
    let errorMessage = null;

    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");

      if (LOVABLE_API_KEY && TWILIO_API_KEY) {
        const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
        const senderName = settings.sender_name || "DLBC";

        const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: cleanPhone,
            From: senderName,
            Body: template.body,
          }),
        });

        const result = await response.json();
        if (response.ok && result.sid) {
          deliveryStatus = "sent";
          providerMessageId = result.sid;
          console.log("[SMS] Sent successfully:", result.sid);
        } else {
          deliveryStatus = "failed";
          errorMessage = result.message || JSON.stringify(result);
          console.error("[SMS] Delivery failed:", errorMessage);
        }
      } else {
        console.log("[SMS] No Twilio credentials — message logged as pending");
        deliveryStatus = "pending";
        errorMessage = "SMS provider not configured";
      }
    } catch (sendErr: any) {
      deliveryStatus = "failed";
      errorMessage = sendErr.message;
      console.error("[SMS] Send error:", sendErr.message);
    }

    // Update log with result
    await supabaseAdmin
      .from("message_logs")
      .update({
        status: deliveryStatus,
        provider_message_id: providerMessageId,
        sent_at: deliveryStatus === "sent" ? new Date().toISOString() : null,
        error_message: errorMessage,
      })
      .eq("id", logRecord.id);

    return new Response(
      JSON.stringify({
        success: deliveryStatus === "sent",
        log_id: logRecord.id,
        status: deliveryStatus,
        provider_message_id: providerMessageId,
        error: errorMessage,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[SMS] Unexpected error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
