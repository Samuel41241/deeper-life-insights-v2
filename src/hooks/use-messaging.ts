import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MessageTemplate {
  id: string;
  code: string;
  title: string;
  channel: string;
  target_type: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageSchedule {
  id: string;
  template_id: string;
  service_id: string | null;
  day_of_week: string;
  send_time: string;
  timezone: string;
  recipient_rule: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  message_templates?: MessageTemplate;
  services?: { name: string; location_id?: string | null } | null;
}

export interface MessageLog {
  id: string;
  member_id: string | null;
  phone: string | null;
  template_id: string | null;
  service_id: string | null;
  location_id: string | null;
  message_body: string;
  status: string;
  provider_message_id: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  members?: { full_name: string } | null;
  message_templates?: { title: string } | null;
}

export interface MessagingSettings {
  id: string;
  provider_name: string;
  sender_name: string;
  default_timezone: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Templates
export function useMessageTemplates() {
  return useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("message_templates")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as MessageTemplate[];
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...values
    }: {
      id: string;
      title?: string;
      body?: string;
      is_active?: boolean;
      target_type?: string;
    }) => {
      const { error } = await (supabase as any)
        .from("message_templates")
        .update(values)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message-templates"] }),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      code: string;
      title: string;
      body: string;
      target_type: string;
      channel?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from("message_templates")
        .insert({ ...values, channel: values.channel || "sms" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message-templates"] }),
  });
}

// Schedules
export function useMessageSchedules(scopedServiceIds?: string[] | null) {
  return useQuery({
    queryKey: ["message-schedules", scopedServiceIds],
    queryFn: async () => {
      let query = (supabase as any)
        .from("message_schedules")
        .select("*, message_templates(title, code), services(name, location_id)")
        .order("day_of_week");

      if (scopedServiceIds && scopedServiceIds.length > 0) {
        query = query.in("service_id", scopedServiceIds);
      } else if (scopedServiceIds && scopedServiceIds.length === 0) {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MessageSchedule[];
    },
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      template_id: string;
      service_id?: string;
      day_of_week: string;
      send_time: string;
      recipient_rule: string;
      timezone?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from("message_schedules")
        .insert({
          ...values,
          service_id: values.service_id || null,
          timezone: values.timezone || "Africa/Lagos",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message-schedules"] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...values
    }: {
      id: string;
      is_active?: boolean;
      send_time?: string;
      day_of_week?: string;
    }) => {
      const { error } = await (supabase as any)
        .from("message_schedules")
        .update(values)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message-schedules"] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("message_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message-schedules"] }),
  });
}

// Logs
export function useMessageLogs(limit = 100, scopedLocationIds?: string[] | null) {
  return useQuery({
    queryKey: ["message-logs", limit, scopedLocationIds],
    queryFn: async () => {
      let query = (supabase as any)
        .from("message_logs")
        .select("*, members(full_name), message_templates(title)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (scopedLocationIds && scopedLocationIds.length > 0) {
        query = query.in("location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MessageLog[];
    },
  });
}

// Settings
export function useMessagingSettings() {
  return useQuery({
    queryKey: ["messaging-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("messaging_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as MessagingSettings | null;
    },
  });
}

export function useUpsertMessagingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      provider_name?: string;
      sender_name?: string;
      default_timezone?: string;
      enabled?: boolean;
      id?: string;
    }) => {
      if (values.id) {
        const { id, ...rest } = values;
        const { error } = await (supabase as any)
          .from("messaging_settings")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("messaging_settings")
          .insert(values)
          .select()
          .single();
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messaging-settings"] }),
  });
}

// Manual send / test
export function useSendTestMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      template_id: string;
      phone: string;
      member_id?: string;
      location_id?: string;
    }) => {
      const res = await supabase.functions.invoke("send-sms", {
        body: {
          mode: "test",
          template_id: values.template_id,
          phone: values.phone,
          member_id: values.member_id || null,
          location_id: values.location_id || null,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message-logs"] }),
  });
}