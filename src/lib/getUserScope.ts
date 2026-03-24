import { supabase } from "@/integrations/supabase/client";

export async function getUserScope(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("User role not found");
  }

  return data;
}