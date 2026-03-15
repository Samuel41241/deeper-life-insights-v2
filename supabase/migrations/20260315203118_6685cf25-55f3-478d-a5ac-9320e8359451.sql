
-- ENUMS
CREATE TYPE public.member_category AS ENUM ('adult_male', 'adult_female', 'youth_boy', 'youth_girl', 'children_boy', 'children_girl');
CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'transferred', 'deceased');
CREATE TYPE public.card_status AS ENUM ('active', 'lost', 'replaced', 'inactive');
CREATE TYPE public.alert_type AS ENUM ('absent_warning', 'absent_critical', 'new_member_check', 'trend_decline');
CREATE TYPE public.followup_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.app_role AS ENUM ('super_admin', 'state_admin', 'region_admin', 'group_admin', 'district_admin', 'location_admin', 'data_officer');

-- TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- HIERARCHY
CREATE TABLE public.states (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL UNIQUE, code TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.regions (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, state_id UUID NOT NULL REFERENCES public.states(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(name, state_id));
CREATE TABLE public.group_districts (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(name, region_id));
CREATE TABLE public.districts (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, group_district_id UUID NOT NULL REFERENCES public.group_districts(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(name, group_district_id));
CREATE TABLE public.locations (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, address TEXT, district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(name, district_id));

-- USER ROLES
CREATE TABLE public.user_roles (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL, district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL, group_district_id UUID REFERENCES public.group_districts(id) ON DELETE SET NULL, region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL, state_id UUID REFERENCES public.states(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id, role));

-- MEMBERS
CREATE TABLE public.members (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT, full_name TEXT NOT NULL, gender TEXT NOT NULL CHECK (gender IN ('male', 'female')), category public.member_category NOT NULL, phone TEXT, address TEXT, date_joined DATE NOT NULL DEFAULT CURRENT_DATE, status public.member_status NOT NULL DEFAULT 'active', passport_photo_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());

-- CARDS
CREATE TABLE public.cards (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, card_number TEXT NOT NULL UNIQUE, qr_code_value TEXT NOT NULL UNIQUE, member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE, status public.card_status NOT NULL DEFAULT 'active', issued_date DATE NOT NULL DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

-- SERVICES
CREATE TABLE public.services (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, service_type TEXT NOT NULL, day_of_week TEXT NOT NULL CHECK (day_of_week IN ('sunday','monday','tuesday','wednesday','thursday','friday','saturday')), start_time TIME, location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

-- ATTENDANCE
CREATE TABLE public.attendance (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE, service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE, location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE, card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL, check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(), date DATE NOT NULL DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE UNIQUE INDEX idx_attendance_unique ON public.attendance(member_id, service_id, date);

-- ENGAGEMENT
CREATE TABLE public.engagement_alerts (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE, alert_type public.alert_type NOT NULL, message TEXT, is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.followup_flags (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE, reason TEXT NOT NULL, assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, status public.followup_status NOT NULL DEFAULT 'pending', notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.attendance_trends (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE, period_start DATE NOT NULL, period_end DATE NOT NULL, total_services INTEGER NOT NULL DEFAULT 0, attended INTEGER NOT NULL DEFAULT 0, attendance_rate NUMERIC(5,2), trend TEXT CHECK (trend IN ('improving','stable','declining','critical')), created_at TIMESTAMPTZ NOT NULL DEFAULT now());

-- INDEXES
CREATE INDEX idx_members_location ON public.members(location_id);
CREATE INDEX idx_members_status ON public.members(status);
CREATE INDEX idx_cards_member ON public.cards(member_id);
CREATE INDEX idx_attendance_member ON public.attendance(member_id);
CREATE INDEX idx_attendance_service ON public.attendance(service_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_engagement_member ON public.engagement_alerts(member_id);
CREATE INDEX idx_followup_member ON public.followup_flags(member_id);
CREATE INDEX idx_trends_member ON public.attendance_trends(member_id);

-- TRIGGERS
CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON public.states FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_group_districts_updated_at BEFORE UPDATE ON public.group_districts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON public.districts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_followup_flags_updated_at BEFORE UPDATE ON public.followup_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_trends ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER FOR ROLE CHECKS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- RLS POLICIES (pilot: all authenticated users can CRUD)
CREATE POLICY "auth_read_states" ON public.states FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_states" ON public.states FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_states" ON public.states FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_states" ON public.states FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_regions" ON public.regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_regions" ON public.regions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_regions" ON public.regions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_regions" ON public.regions FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_group_districts" ON public.group_districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_group_districts" ON public.group_districts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_group_districts" ON public.group_districts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_group_districts" ON public.group_districts FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_districts" ON public.districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_districts" ON public.districts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_districts" ON public.districts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_districts" ON public.districts FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_locations" ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_locations" ON public.locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_locations" ON public.locations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_locations" ON public.locations FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_user_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_members" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_members" ON public.members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_members" ON public.members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_members" ON public.members FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_cards" ON public.cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_cards" ON public.cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cards" ON public.cards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_cards" ON public.cards FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_services" ON public.services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_services" ON public.services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_services" ON public.services FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_attendance" ON public.attendance FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_read_alerts" ON public.engagement_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_alerts" ON public.engagement_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_alerts" ON public.engagement_alerts FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_read_followup" ON public.followup_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_followup" ON public.followup_flags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_followup" ON public.followup_flags FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_read_trends" ON public.attendance_trends FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_trends" ON public.attendance_trends FOR INSERT TO authenticated WITH CHECK (true);
