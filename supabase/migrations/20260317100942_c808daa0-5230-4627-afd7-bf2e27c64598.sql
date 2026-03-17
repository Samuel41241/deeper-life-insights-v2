
-- Add management columns to user_roles
ALTER TABLE public.user_roles ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_roles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.user_roles ADD COLUMN email text;

-- Super admin can manage user roles
CREATE POLICY "admin_insert_user_roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "admin_update_user_roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "admin_delete_user_roles" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Function for users to mark their own password as changed
CREATE OR REPLACE FUNCTION public.mark_password_changed()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.user_roles SET must_change_password = false WHERE user_id = auth.uid();
$$;
