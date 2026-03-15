import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

// ── States ──
export function useStates() {
  return useQuery({
    queryKey: ["states"],
    queryFn: async () => {
      const { data, error } = await supabase.from("states").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; code?: string }) => {
      const { data, error } = await supabase.from("states").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["states"] }),
  });
}

export function useDeleteState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("states").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["states"] }),
  });
}

// ── Regions ──
export function useRegions(stateId?: string) {
  return useQuery({
    queryKey: ["regions", stateId],
    queryFn: async () => {
      let q = supabase.from("regions").select("*, states(name)").order("name");
      if (stateId) q = q.eq("state_id", stateId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; state_id: string }) => {
      const { data, error } = await supabase.from("regions").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["regions"] }),
  });
}

export function useDeleteRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("regions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["regions"] }),
  });
}

// ── Group Districts ──
export function useGroupDistricts(regionId?: string) {
  return useQuery({
    queryKey: ["group_districts", regionId],
    queryFn: async () => {
      let q = supabase.from("group_districts").select("*, regions(name, states(name))").order("name");
      if (regionId) q = q.eq("region_id", regionId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateGroupDistrict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; region_id: string }) => {
      const { data, error } = await supabase.from("group_districts").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group_districts"] }),
  });
}

export function useDeleteGroupDistrict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("group_districts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group_districts"] }),
  });
}

// ── Districts ──
export function useDistricts(groupDistrictId?: string) {
  return useQuery({
    queryKey: ["districts", groupDistrictId],
    queryFn: async () => {
      let q = supabase.from("districts").select("*, group_districts(name, regions(name))").order("name");
      if (groupDistrictId) q = q.eq("group_district_id", groupDistrictId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDistrict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; group_district_id: string }) => {
      const { data, error } = await supabase.from("districts").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["districts"] }),
  });
}

export function useDeleteDistrict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("districts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["districts"] }),
  });
}

// ── Locations ──
export function useLocations(districtId?: string) {
  return useQuery({
    queryKey: ["locations", districtId],
    queryFn: async () => {
      let q = supabase.from("locations").select("*, districts(name, group_districts(name))").order("name");
      if (districtId) q = q.eq("district_id", districtId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useAllLocations() {
  return useQuery({
    queryKey: ["locations", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("locations").select("id, name, districts(name)").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; address?: string; district_id: string }) => {
      const { data, error } = await supabase.from("locations").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });
}
