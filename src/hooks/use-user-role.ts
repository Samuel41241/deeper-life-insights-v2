import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface UserRoleData {
  id: string;
  user_id: string;
  role: string;
  email: string | null;
  state_id: string | null;
  region_id: string | null;
  group_district_id: string | null;
  district_id: string | null;
  location_id: string | null;
  must_change_password: boolean;
  is_active: boolean;
}

export function useUserRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserRoleData | null;
    },
    staleTime: 300000,
  });
}

export function useScopedLocationIds() {
  const { data: role } = useUserRole();
  return useQuery({
    queryKey: ["scoped-locations", role?.id],
    enabled: !!role,
    queryFn: async (): Promise<string[] | null> => {
      if (!role) return [];
      if (role.role === "super_admin") return null; // null = all locations

      if (role.role === "location_admin" || role.role === "data_officer") {
        return role.location_id ? [role.location_id] : [];
      }

      if (role.role === "district_admin" && role.district_id) {
        const { data } = await supabase.from("locations").select("id").eq("district_id", role.district_id);
        return data?.map((l) => l.id) || [];
      }

      if (role.role === "group_admin" && role.group_district_id) {
        const { data: districts } = await supabase.from("districts").select("id").eq("group_district_id", role.group_district_id);
        const ids = districts?.map((d) => d.id) || [];
        if (ids.length === 0) return [];
        const { data } = await supabase.from("locations").select("id").in("district_id", ids);
        return data?.map((l) => l.id) || [];
      }

      if (role.role === "region_admin" && role.region_id) {
        const { data: gds } = await supabase.from("group_districts").select("id").eq("region_id", role.region_id);
        const gdIds = gds?.map((g) => g.id) || [];
        if (gdIds.length === 0) return [];
        const { data: districts } = await supabase.from("districts").select("id").in("group_district_id", gdIds);
        const dIds = districts?.map((d) => d.id) || [];
        if (dIds.length === 0) return [];
        const { data } = await supabase.from("locations").select("id").in("district_id", dIds);
        return data?.map((l) => l.id) || [];
      }

      if (role.role === "state_admin" && role.state_id) {
        const { data: regions } = await supabase.from("regions").select("id").eq("state_id", role.state_id);
        const rIds = regions?.map((r) => r.id) || [];
        if (rIds.length === 0) return [];
        const { data: gds } = await supabase.from("group_districts").select("id").in("region_id", rIds);
        const gdIds = gds?.map((g) => g.id) || [];
        if (gdIds.length === 0) return [];
        const { data: districts } = await supabase.from("districts").select("id").in("group_district_id", gdIds);
        const dIds = districts?.map((d) => d.id) || [];
        if (dIds.length === 0) return [];
        const { data } = await supabase.from("locations").select("id").in("district_id", dIds);
        return data?.map((l) => l.id) || [];
      }

      return [];
    },
    staleTime: 300000,
  });
}

// Role display labels
export const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  state_admin: "State Admin",
  region_admin: "Region Admin",
  group_admin: "Group Admin",
  district_admin: "District Admin",
  location_admin: "Location Admin",
  data_officer: "Data Officer",
};

// Navigation access by role
export const roleNavAccess: Record<string, string[]> = {
  super_admin: ["dashboard", "hierarchy", "members", "register", "qr-cards", "scanner", "newcomers", "attendance", "reports", "engagement", "settings", "users"],
  state_admin: ["dashboard", "hierarchy", "members", "register", "qr-cards", "scanner", "newcomers", "attendance", "reports", "engagement", "settings"],
  region_admin: ["dashboard", "hierarchy", "members", "register", "qr-cards", "scanner", "newcomers", "attendance", "reports", "engagement"],
  group_admin: ["dashboard", "hierarchy", "members", "register", "qr-cards", "scanner", "newcomers", "attendance", "reports", "engagement"],
  district_admin: ["dashboard", "hierarchy", "members", "register", "qr-cards", "scanner", "newcomers", "attendance", "reports", "engagement"],
  location_admin: ["dashboard", "members", "register", "qr-cards", "scanner", "newcomers", "attendance", "engagement"],
  data_officer: ["dashboard", "members", "scanner", "newcomers", "attendance"],
};

export function useAllUserRoles() {
  return useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserRoleData[];
    },
  });
}
