
-- Newcomers / First-timers attendance table
CREATE TABLE public.newcomers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id),
  service_id uuid REFERENCES public.services(id),
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  total_count integer NOT NULL DEFAULT 0,
  male_count integer NOT NULL DEFAULT 0,
  female_count integer NOT NULL DEFAULT 0,
  youth_count integer NOT NULL DEFAULT 0,
  children_count integer NOT NULL DEFAULT 0,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newcomers ENABLE ROW LEVEL SECURITY;

-- RLS policies for newcomers
CREATE POLICY "auth_read_newcomers" ON public.newcomers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_newcomers" ON public.newcomers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_newcomers" ON public.newcomers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_newcomers" ON public.newcomers FOR DELETE TO authenticated USING (true);

-- Updated_at trigger
CREATE TRIGGER update_newcomers_updated_at BEFORE UPDATE ON public.newcomers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
