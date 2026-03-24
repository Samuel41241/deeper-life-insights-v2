import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_CHILD_ROLES: Record<string, string[]> = {
  super_admin: ["state_admin", "region_admin", "group_admin", "district_admin", "location_admin", "data_officer"],
  state_admin: ["region_admin", "group_admin", "district_admin", "location_admin", "data_officer"],
  region_admin: ["group_admin", "district_admin", "location_admin", "data_officer"],
  group_admin: ["district_admin", "location_admin", "data_officer"],
  district_admin: ["location_admin", "data_officer"],
  location_admin: ["data_officer"],
  data_officer: [],
};

const REQUIRED_SCOPE_BY_ROLE: Record<string, string | null> = {
  super_admin: null,
  state_admin: "state_id",
  region_admin: "region_id",
  group_admin: "group_district_id",
  district_admin: "district_id",
  location_admin: "location_id",
  data_officer: "location_id",
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
      return new Response(JSON.stringify({ error: "No authorization header" }), {
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
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caller full role row
    const { data: callerRole, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", caller.id)
      .single();

    if (roleErr || !callerRole) {
      console.error("Role check failed:", roleErr?.message, callerRole);
      return new Response(JSON.stringify({ error: "Caller role not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    const normalizedEmail = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "");

    if (!normalizedEmail || !password || !role) {
      return new Response(
        JSON.stringify({ error: "email, password, and role are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedRoles = ALLOWED_CHILD_ROLES[callerRole.role] || [];
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `You cannot create role ${role}` }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Inherit scope from caller where needed
    const targetScopes = {
      state_id: body.state_id || callerRole.state_id || null,
      region_id: body.region_id || callerRole.region_id || null,
      group_district_id: body.group_district_id || callerRole.group_district_id || null,
      district_id: body.district_id || callerRole.district_id || null,
      location_id: body.location_id || callerRole.location_id || null,
    };

    const requiredField = REQUIRED_SCOPE_BY_ROLE[role];
    if (requiredField && !targetScopes[requiredField as keyof typeof targetScopes]) {
      return new Response(
        JSON.stringify({ error: `${requiredField} is required for role ${role}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Enforce caller scope boundaries
    if (callerRole.role === "state_admin" && callerRole.state_id !== targetScopes.state_id) {
      return new Response(
        JSON.stringify({ error: "Target user must be within your state" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (callerRole.role === "region_admin" && callerRole.region_id !== targetScopes.region_id) {
      return new Response(
        JSON.stringify({ error: "Target user must be within your region" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (
      callerRole.role === "group_admin" &&
      callerRole.group_district_id !== targetScopes.group_district_id
    ) {
      return new Response(
        JSON.stringify({ error: "Target user must be within your group of districts" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (callerRole.role === "district_admin" && callerRole.district_id !== targetScopes.district_id) {
      return new Response(
        JSON.stringify({ error: "Target user must be within your district" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (callerRole.role === "location_admin" && callerRole.location_id !== targetScopes.location_id) {
      return new Response(
        JSON.stringify({ error: "Target user must be within your location" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Create-user payload:", {
      caller: caller.id,
      callerRole: callerRole.role,
      email: normalizedEmail,
      role,
      targetScopes,
    });

    // Check for duplicate email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const duplicate = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (duplicate) {
      return new Response(
        JSON.stringify({ error: "A user with this email already exists" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create auth user
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });

    if (createError) {
      console.error("Create user error:", createError.message);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert user_role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      email: normalizedEmail,
      role,
      state_id: targetScopes.state_id,
      region_id: targetScopes.region_id,
      group_district_id: targetScopes.group_district_id,
      district_id: targetScopes.district_id,
      location_id: targetScopes.location_id,
      must_change_password: true,
      is_active: true,
    });

    if (roleError) {
      console.error("Role insert error:", roleError.message);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User created successfully:", newUser.user.id, normalizedEmail, role);

    return new Response(
      JSON.stringify({ user_id: newUser.user.id, email: normalizedEmail }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});