-- Create biometric_devices table for device management
CREATE TABLE IF NOT EXISTS public.biometric_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text NOT NULL,
  device_name_bn text,
  location text,
  location_bn text,
  device_type text DEFAULT 'fingerprint', -- fingerprint, face, card, multi
  assigned_classes text[] DEFAULT '{}',
  assigned_sections text[] DEFAULT '{}',
  ip_address text,
  port integer DEFAULT 4370,
  auth_key text,
  sync_interval_minutes integer DEFAULT 15,
  is_active boolean DEFAULT true,
  status text DEFAULT 'offline', -- online, offline, error, syncing
  last_sync_at timestamptz,
  last_heartbeat_at timestamptz,
  total_synced_records integer DEFAULT 0,
  error_count integer DEFAULT 0,
  last_error text,
  last_error_at timestamptz,
  firmware_version text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, device_id)
);

-- Create device_sync_logs table
CREATE TABLE IF NOT EXISTS public.device_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES public.biometric_devices(id) ON DELETE CASCADE NOT NULL,
  sync_type text NOT NULL, -- auto, manual, recovery
  sync_status text NOT NULL, -- started, success, failed, partial
  records_fetched integer DEFAULT 0,
  records_processed integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  error_details jsonb,
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  initiated_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create attendance_approvals table for manual entry workflow
CREATE TABLE IF NOT EXISTS public.attendance_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL,
  submitted_by uuid NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  approval_status text DEFAULT 'pending', -- pending, approved, rejected
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add source tracking columns to attendance table
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'; -- manual, biometric, bulk_import
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS device_id uuid;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS biometric_timestamp timestamptz;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved'; -- pending, approved, rejected
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_in_time time;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out_time time;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS is_late boolean DEFAULT false;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS late_minutes integer DEFAULT 0;

-- Create teacher_attendance table
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present', -- present, absent, late, leave, half_day
  source text DEFAULT 'manual', -- manual, biometric
  device_id uuid,
  check_in_time time,
  check_out_time time,
  biometric_timestamp timestamptz,
  is_late boolean DEFAULT false,
  late_minutes integer DEFAULT 0,
  remarks text,
  marked_by uuid,
  approval_status text DEFAULT 'approved',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, date)
);

-- Enable RLS on new tables
ALTER TABLE public.biometric_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for biometric_devices
CREATE POLICY "School admins can manage their devices" ON public.biometric_devices
FOR ALL USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (school_id IS NOT NULL AND is_school_admin(auth.uid(), school_id))
);

CREATE POLICY "Teachers can view devices" ON public.biometric_devices
FOR SELECT USING (has_role(auth.uid(), 'teacher'::app_role));

-- RLS Policies for device_sync_logs
CREATE POLICY "Admins can view sync logs" ON public.device_sync_logs
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert sync logs" ON public.device_sync_logs
FOR INSERT WITH CHECK (true);

-- RLS Policies for attendance_approvals
CREATE POLICY "Admins can manage approvals" ON public.attendance_approvals
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can view their submissions" ON public.attendance_approvals
FOR SELECT USING (submitted_by = auth.uid());

-- RLS Policies for teacher_attendance
CREATE POLICY "Admins can manage teacher attendance" ON public.teacher_attendance
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can view own attendance" ON public.teacher_attendance
FOR SELECT USING (
  EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_attendance.teacher_id AND t.user_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_biometric_devices_school ON public.biometric_devices(school_id);
CREATE INDEX IF NOT EXISTS idx_biometric_devices_status ON public.biometric_devices(status);
CREATE INDEX IF NOT EXISTS idx_device_sync_logs_device ON public.device_sync_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON public.teacher_attendance(date);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher ON public.teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);

-- Trigger for updated_at
CREATE TRIGGER update_biometric_devices_updated_at
BEFORE UPDATE ON public.biometric_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_attendance_updated_at
BEFORE UPDATE ON public.teacher_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();