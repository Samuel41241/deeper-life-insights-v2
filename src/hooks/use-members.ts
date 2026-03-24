import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

// scopedLocationIds: null = all, string[] = filter to these locations
export function useMembers(
  search?: string,
  locationId?: string,
  scopedLocationIds?: string[] | null
) {
  return useQuery({
    queryKey: ["members", search, locationId, scopedLocationIds],
    queryFn: async () => {
      let q = supabase
        .from("members")
        .select("*, locations(name)")
        .order("full_name");

      // If an explicit location is selected, respect it first
      if (locationId) {
        q = q.eq("location_id", locationId);
      } else if (scopedLocationIds && scopedLocationIds.length > 0) {
        q = q.in("location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return [];
      }

      if (search) q = q.ilike("full_name", `%${search}%`);

      const { data, error } = await q.limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useMember(id: string, scopedLocationIds?: string[] | null) {
  return useQuery({
    queryKey: ["members", id, scopedLocationIds],
    enabled: !!id,
    queryFn: async () => {
      let q = supabase
        .from("members")
        .select("*, locations(name, districts(name, group_districts(name, regions(name, states(name)))))")
        .eq("id", id);

      if (scopedLocationIds && scopedLocationIds.length > 0) {
        q = q.in("location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return null;
      }

      const { data, error } = await q.single();
      if (error) throw error;
      return data;
    },
  });
}

export function useMemberCards(
  memberId: string,
  scopedLocationIds?: string[] | null
) {
  return useQuery({
    queryKey: ["cards", memberId, scopedLocationIds],
    enabled: !!memberId,
    queryFn: async () => {
      let q = supabase
        .from("cards")
        .select("*, members!inner(id, location_id)")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });

      if (scopedLocationIds && scopedLocationIds.length > 0) {
        q = q.in("members.location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return [];
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      full_name: string;
      gender: string;
      category: Enums<"member_category">;
      location_id: string;
      phone?: string;
      address?: string;
      date_joined?: string;
    }) => {
      const { data, error } = await supabase
        .from("members")
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("members")
        .update(values)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["members", vars.id] });
    },
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      member_id: string;
      card_number: string;
      qr_code_value: string;
    }) => {
      const { data, error } = await supabase
        .from("cards")
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cards", vars.member_id] });
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useUpdateCardStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Enums<"card_status">;
    }) => {
      const { error } = await supabase
        .from("cards")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
  });
}

export function useAllCards(scopedLocationIds?: string[] | null) {
  return useQuery({
    queryKey: ["cards", scopedLocationIds],
    queryFn: async () => {
      let q = supabase
        .from("cards")
        .select("*, members(full_name, location_id, locations(name))")
        .order("created_at", { ascending: false })
        .limit(200);

      if (scopedLocationIds && scopedLocationIds.length > 0) {
        q = q.in("members.location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return [];
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}