import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

export function useMembers(search?: string, locationId?: string) {
  return useQuery({
    queryKey: ["members", search, locationId],
    queryFn: async () => {
      let q = supabase
        .from("members")
        .select("*, locations(name)")
        .order("full_name");
      if (locationId) q = q.eq("location_id", locationId);
      if (search) q = q.ilike("full_name", `%${search}%`);
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ["members", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*, locations(name, districts(name, group_districts(name, regions(name, states(name)))))")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useMemberCards(memberId: string) {
  return useQuery({
    queryKey: ["cards", memberId],
    enabled: !!memberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });
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
      const { data, error } = await supabase.from("members").insert(values).select().single();
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
      const { data, error } = await supabase.from("members").update(values).eq("id", id).select().single();
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
    mutationFn: async (values: { member_id: string; card_number: string; qr_code_value: string }) => {
      const { data, error } = await supabase.from("cards").insert(values).select().single();
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
    mutationFn: async ({ id, status }: { id: string; status: Enums<"card_status"> }) => {
      const { error } = await supabase.from("cards").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
  });
}

export function useAllCards() {
  return useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*, members(full_name, locations(name))")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}
