
-- Add attendance_status enum
CREATE TYPE public.attendance_status AS ENUM ('present', 'late', 'absent');

-- Add status column to attendance table
ALTER TABLE public.attendance ADD COLUMN status public.attendance_status NOT NULL DEFAULT 'present';

-- Add unique constraint to prevent duplicate attendance
ALTER TABLE public.attendance ADD CONSTRAINT attendance_member_service_date_unique UNIQUE (member_id, service_id, date);
