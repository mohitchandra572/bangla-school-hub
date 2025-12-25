-- Drop the problematic policies
DROP POLICY IF EXISTS "School admins can view school users" ON public.school_users;
DROP POLICY IF EXISTS "Admins can manage students in school" ON public.students;
DROP POLICY IF EXISTS "Admins can manage teachers in school" ON public.teachers;

-- Create security definer function to check school admin status
CREATE OR REPLACE FUNCTION public.is_school_admin(_user_id uuid, _school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.school_users
    WHERE user_id = _user_id
      AND school_id = _school_id
      AND is_admin = true
  )
$$;

-- Recreate school_users policy using the function
CREATE POLICY "School admins can view school users" ON public.school_users
FOR SELECT USING (
  public.is_school_admin(auth.uid(), school_id) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Recreate students policy without recursion
CREATE POLICY "Admins can manage students in school" ON public.students
FOR ALL USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR (school_id IS NOT NULL AND public.is_school_admin(auth.uid(), school_id))
);

-- Recreate teachers policy without recursion
CREATE POLICY "Admins can manage teachers in school" ON public.teachers
FOR ALL USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR (school_id IS NOT NULL AND public.is_school_admin(auth.uid(), school_id))
);