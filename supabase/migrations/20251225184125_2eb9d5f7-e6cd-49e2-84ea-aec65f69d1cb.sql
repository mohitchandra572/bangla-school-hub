-- Create subscription_plan enum type
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'standard', 'premium', 'enterprise');

-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name subscription_plan NOT NULL UNIQUE,
  name_bn TEXT,
  max_students INTEGER NOT NULL,
  max_teachers INTEGER NOT NULL,
  features JSONB DEFAULT '{}',
  max_storage_mb INTEGER DEFAULT 1024,
  price_monthly NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, name_bn, max_students, max_teachers, features, price_monthly) VALUES
  ('basic', 'বেসিক', 200, 10, '{"results": true, "messaging": false, "exports": false, "reports": false}', 0),
  ('standard', 'স্ট্যান্ডার্ড', 500, 30, '{"results": true, "messaging": true, "exports": true, "reports": false}', 5000),
  ('premium', 'প্রিমিয়াম', 2000, 100, '{"results": true, "messaging": true, "exports": true, "reports": true}', 15000),
  ('enterprise', 'এন্টারপ্রাইজ', -1, -1, '{"results": true, "messaging": true, "exports": true, "reports": true, "api": true}', 50000);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view subscription plans
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- Only super admins can manage subscription plans
CREATE POLICY "Super admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  subscription_plan subscription_plan DEFAULT 'basic',
  subscription_start DATE DEFAULT CURRENT_DATE,
  subscription_end DATE,
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all schools
CREATE POLICY "Super admins can manage schools" ON public.schools
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Create school_users junction table
CREATE TABLE public.school_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, user_id)
);

-- Enable RLS on school_users
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;

-- Super admins can manage school_users
CREATE POLICY "Super admins can manage school_users" ON public.school_users
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Users can view their own school association
CREATE POLICY "Users can view own school association" ON public.school_users
  FOR SELECT USING (user_id = auth.uid());

-- School admins can view their school users
CREATE POLICY "School admins can view school users" ON public.school_users
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.school_users 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create generated_credentials table for audit trail
CREATE TABLE public.generated_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  temporary_password TEXT,
  sent_via TEXT,
  sent_at TIMESTAMPTZ,
  first_login_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on generated_credentials
ALTER TABLE public.generated_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can view credentials
CREATE POLICY "Admins can view credentials" ON public.generated_credentials
  FOR SELECT USING (is_admin(auth.uid()));

-- System can insert credentials
CREATE POLICY "System can insert credentials" ON public.generated_credentials
  FOR INSERT WITH CHECK (true);

-- Add school_id to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Add school_id to teachers table
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Create function to get user school ID
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.school_users WHERE user_id = _user_id LIMIT 1;
$$;

-- Create function to check school subscription limits
CREATE OR REPLACE FUNCTION public.check_school_limit(
  _school_id UUID,
  _entity_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan subscription_plan;
  v_current_count INTEGER;
  v_max_count INTEGER;
  v_features JSONB;
  v_is_active BOOLEAN;
  v_is_suspended BOOLEAN;
BEGIN
  -- Get school's plan and status
  SELECT subscription_plan, is_active, is_suspended 
  INTO v_plan, v_is_active, v_is_suspended 
  FROM public.schools WHERE id = _school_id;
  
  -- Check school status
  IF NOT v_is_active OR v_is_suspended THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'School is inactive or suspended'
    );
  END IF;
  
  -- Get plan limits
  SELECT 
    CASE WHEN _entity_type = 'student' THEN max_students ELSE max_teachers END,
    features
  INTO v_max_count, v_features
  FROM public.subscription_plans WHERE name = v_plan;
  
  -- Get current count
  IF _entity_type = 'student' THEN
    SELECT COUNT(*) INTO v_current_count FROM public.students WHERE school_id = _school_id AND status = 'active';
  ELSE
    SELECT COUNT(*) INTO v_current_count FROM public.teachers WHERE school_id = _school_id AND status = 'active';
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', v_max_count = -1 OR v_current_count < v_max_count,
    'current', v_current_count,
    'max', v_max_count,
    'features', v_features,
    'plan', v_plan
  );
END;
$$;

-- Users can see their own school
CREATE POLICY "Users can view own school" ON public.schools
  FOR SELECT USING (
    id IN (SELECT school_id FROM public.school_users WHERE user_id = auth.uid())
  );

-- School admins can manage students in their school
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
CREATE POLICY "Admins can manage students in school" ON public.students
  FOR ALL USING (
    is_admin(auth.uid()) OR 
    (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'))
  );

-- School admins can manage teachers in their school
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
CREATE POLICY "Admins can manage teachers in school" ON public.teachers
  FOR ALL USING (
    is_admin(auth.uid()) OR
    (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'))
  );

-- Update timestamp triggers
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();