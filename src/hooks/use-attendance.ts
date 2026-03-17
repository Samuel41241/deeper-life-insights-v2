import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRecordAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      member_id: string;
      location_id: string;
      service_id: string;
      card_id?: string;
      status?: "present" | "late";
    }) => {
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          member_id: values.member_id,
          location_id: values.location_id,
          service_id: values.service_id,
          card_id: values.card_id || null,
          status: (values.status || "present") as any,
        })
        .select("*, members(full_name)")
        .single();
      if (error) {
        if (error.code === "23505") {
          throw new Error("DUPLICATE");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useLookupCard(qrValue: string) {
  return useQuery({
    queryKey: ["card-lookup", qrValue],
    enabled: !!qrValue,
    staleTime: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*, members(id, full_name, location_id, status, locations(name))")
        .or(`qr_code_value.eq.${qrValue},card_number.eq.${qrValue}`)
        .eq("status", "active")
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useAttendanceHistory(filters: {
  date?: string;
  serviceId?: string;
  locationId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["attendance", filters],
    queryFn: async () => {
      let q = supabase
        .from("attendance")
        .select("*, members(full_name, category), services(name), locations(name), cards(card_number)")
        .order("check_in_time", { ascending: false })
        .limit(200);

      if (filters.date) q = q.eq("date", filters.date);
      if (filters.serviceId) q = q.eq("service_id", filters.serviceId);
      if (filters.locationId) q = q.eq("location_id", filters.locationId);

      const { data, error } = await q;
      if (error) throw error;

      if (filters.search) {
        const s = filters.search.toLowerCase();
        return data.filter((r: any) =>
          r.members?.full_name?.toLowerCase().includes(s)
        );
      }
      return data;
    },
  });
}

// scopedLocationIds: null = all, string[] = filter to these locations
export function useTodayAttendanceCount(serviceId?: string, scopedLocationIds?: string[] | null) {
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["dashboard-stats", "today-attendance", today, serviceId, scopedLocationIds],
    queryFn: async () => {
      let q = supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("date", today);
      if (serviceId) q = q.eq("service_id", serviceId);
      if (scopedLocationIds && scopedLocationIds.length > 0) {
        q = q.in("location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return 0; // no access
      }
      const { count, error } = await q;
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useTotalMembers(scopedLocationIds?: string[] | null) {
  return useQuery({
    queryKey: ["dashboard-stats", "total-members", scopedLocationIds],
    queryFn: async () => {
      let q = supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      if (scopedLocationIds && scopedLocationIds.length > 0) {
        q = q.in("location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return 0;
      }
      const { count, error } = await q;
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useRecentScans(limit = 10, scopedLocationIds?: string[] | null) {
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["dashboard-stats", "recent-scans", today, scopedLocationIds],
    refetchInterval: 5000,
    queryFn: async () => {
      let q = supabase
        .from("attendance")
        .select("*, members(full_name), services(name)")
        .eq("date", today)
        .order("check_in_time", { ascending: false })
        .limit(limit);
      if (scopedLocationIds && scopedLocationIds.length > 0) {
        q = q.in("location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return [];
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}
