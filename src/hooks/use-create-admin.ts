import { supabase } from "@/integrations/supabase/client";
import { ROLE_HIERARCHY, Role } from "@/lib/roles";

export async function createAdminUser({
  email,
  password,
  role,
  locationId,
  currentUser,
}: {
  email: string;
  password: string;
  role: Role;
  locationId: string;
  currentUser: { id: string; role: Role };
}) {
  // 🔒 Check permission
  if (!ROLE_HIERARCHY[currentUser.role].includes(role)) {
    throw new Error("You cannot create this role");
  }

  // 🔹 Create auth user
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) throw authError;

  const userId = authUser.user.id;

  // 🔹 Insert profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    role,
  });

  if (profileError) throw profileError;

  // 🔹 Assign scope
  const { error: scopeError } = await supabase.from("user_scopes").insert({
    user_id: userId,
    location_id: locationId,
  });

  if (scopeError) throw scopeError;

  return userId;
}