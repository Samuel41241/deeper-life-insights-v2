import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MANAGEABLE_CHILD_ROLES: Record<string, string[]> = {
  super_admin: ["state_admin", "region_admin", "group_admin", "district_admin", "location_admin", "data_officer"],
  state_admin: ["region_admin", "group_admin", "district_admin", "location_admin", "data_officer"],
  region_admin: ["group_admin", "district_admin", "location_admin", "data_officer"],
  group_admin: ["district_admin", "location_admin", "data_officer"],
  district_admin: ["location_admin", "data_officer"],
  location_admin: ["data_officer"],
  data_officer: [],
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caller full role row
    const { data: callerRole, error: callerRoleErr } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", caller.id)
      .single();

    if (callerRoleErr || !callerRole) {
      return new Response(JSON.stringify({ error: "Caller role not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { target_user_id, new_password } = await req.json();

    if (!target_user_id || !new_password) {
      return new Response(
        JSON.stringify({ error: "target_user_id and new_password required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: targetRole, error: targetRoleErr } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", target_user_id)
      .single();

    if (targetRoleErr || !targetRole) {
      return new Response(JSON.stringify({ error: "Target user role not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowed = MANAGEABLE_CHILD_ROLES[callerRole.role] || [];
    if (!allowed.includes(targetRole.role)) {
      return new Response(JSON.stringify({ error: "You cannot manage this user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (callerRole.role === "state_admin" && callerRole.state_id !== targetRole.state_id) {
      return new Response(JSON.stringify({ error: "Target user is outside your state" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (callerRole.role === "region_admin" && callerRole.region_id !== targetRole.region_id) {
      return new Response(JSON.stringify({ error: "Target user is outside your region" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      callerRole.role === "group_admin" &&
      callerRole.group_district_id !== targetRole.group_district_id
    ) {
      return new Response(
        JSON.stringify({ error: "Target user is outside your group of districts" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (callerRole.role === "district_admin" && callerRole.district_id !== targetRole.district_id) {
      return new Response(JSON.stringify({ error: "Target user is outside your district" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (callerRole.role === "location_admin" && callerRole.location_id !== targetRole.location_id) {
      return new Response(JSON.stringify({ error: "Target user is outside your location" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
      password: new_password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin
      .from("user_roles")
      .update({ must_change_password: true })
      .eq("user_id", target_user_id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});