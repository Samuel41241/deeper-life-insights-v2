import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewcomerEntry {
  id: string;
  location_id: string;
  service_id: string | null;
  attendance_date: string;
  total_count: number;
  male_count: number;
  female_count: number;
  youth_count: number;
  children_count: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useRecordNewcomers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      location_id: string;
      service_id?: string;
      attendance_date?: string;
      total_count: number;
      male_count: number;
      female_count: number;
      youth_count?: number;
      children_count?: number;
      notes?: string;
      created_by: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from("newcomers")
        .insert({
          location_id: values.location_id,
          service_id: values.service_id || null,
          attendance_date: values.attendance_date || new Date().toISOString().split("T")[0],
          total_count: values.total_count,
          male_count: values.male_count,
          female_count: values.female_count,
          youth_count: values.youth_count || 0,
          children_count: values.children_count || 0,
          notes: values.notes || null,
          created_by: values.created_by,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["newcomers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useTodayNewcomerCount(serviceId?: string, scopedLocationIds?: string[] | null) {
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["dashboard-stats", "today-newcomers", today, serviceId, scopedLocationIds],
    queryFn: async () => {
      let q = (supabase as any)
        .from("newcomers")
        .select("total_count")
        .eq("attendance_date", today);
      if (serviceId) q = q.eq("service_id", serviceId);
      if (scopedLocationIds && scopedLocationIds.length > 0) {
        q = q.in("location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return 0;
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data as any[])?.reduce((sum: number, r: any) => sum + (r.total_count || 0), 0) || 0;
    },
  });
}

export function useNewcomerHistory(filters: {
  date?: string;
  serviceId?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: ["newcomers", filters],
    queryFn: async () => {
      let q = (supabase as any)
        .from("newcomers")
        .select("*, services(name), locations(name)")
        .order("attendance_date", { ascending: false })
        .limit(200);

      if (filters.date) q = q.eq("attendance_date", filters.date);
      if (filters.serviceId) q = q.eq("service_id", filters.serviceId);
      if (filters.locationId) q = q.eq("location_id", filters.locationId);

      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });
}
