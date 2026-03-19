
-- Phase G: Messaging tables

-- Message Templates
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'sms',
  target_type TEXT NOT NULL DEFAULT 'all_active',
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Message Schedules
CREATE TABLE public.message_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.message_templates(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  day_of_week TEXT NOT NULL,
  send_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  recipient_rule TEXT NOT NULL DEFAULT 'all_active',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Message Logs
CREATE TABLE public.message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  phone TEXT,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messaging Settings
CREATE TABLE public.messaging_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL DEFAULT 'twilio',
  sender_name TEXT NOT NULL DEFAULT 'DLBC',
  default_timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extend members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

-- RLS for message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_templates" ON public.message_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_templates" ON public.message_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- RLS for message_schedules
ALTER TABLE public.message_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_schedules" ON public.message_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_schedules" ON public.message_schedules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- RLS for message_logs
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_logs" ON public.message_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_logs" ON public.message_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- RLS for messaging_settings
ALTER TABLE public.messaging_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_msg_settings" ON public.messaging_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_msg_settings" ON public.messaging_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Updated_at triggers
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_schedules_updated_at BEFORE UPDATE ON public.message_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messaging_settings_updated_at BEFORE UPDATE ON public.messaging_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
