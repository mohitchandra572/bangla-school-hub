-- Add comprehensive student fields for Bangladeshi school ERP
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS blood_group text,
ADD COLUMN IF NOT EXISTS religion text,
ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'বাংলাদেশী',
ADD COLUMN IF NOT EXISTS admission_id text,
ADD COLUMN IF NOT EXISTS academic_year text,
ADD COLUMN IF NOT EXISTS group_stream text,
ADD COLUMN IF NOT EXISTS shift text,
ADD COLUMN IF NOT EXISTS version text DEFAULT 'বাংলা',
ADD COLUMN IF NOT EXISTS father_name text,
ADD COLUMN IF NOT EXISTS father_name_bn text,
ADD COLUMN IF NOT EXISTS mother_name text,
ADD COLUMN IF NOT EXISTS mother_name_bn text,
ADD COLUMN IF NOT EXISTS guardian_name text,
ADD COLUMN IF NOT EXISTS guardian_name_bn text,
ADD COLUMN IF NOT EXISTS guardian_relation text,
ADD COLUMN IF NOT EXISTS guardian_mobile text,
ADD COLUMN IF NOT EXISTS alternative_contact text,
ADD COLUMN IF NOT EXISTS guardian_occupation text,
ADD COLUMN IF NOT EXISTS present_address text,
ADD COLUMN IF NOT EXISTS present_district text,
ADD COLUMN IF NOT EXISTS present_upazila text,
ADD COLUMN IF NOT EXISTS permanent_address text,
ADD COLUMN IF NOT EXISTS permanent_district text,
ADD COLUMN IF NOT EXISTS permanent_upazila text,
ADD COLUMN IF NOT EXISTS birth_certificate_no text,
ADD COLUMN IF NOT EXISTS previous_school text;

-- Add comprehensive teacher fields
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS blood_group text,
ADD COLUMN IF NOT EXISTS religion text,
ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'বাংলাদেশী',
ADD COLUMN IF NOT EXISTS subjects_taught text[],
ADD COLUMN IF NOT EXISTS assigned_classes text[],
ADD COLUMN IF NOT EXISTS assigned_sections text[],
ADD COLUMN IF NOT EXISTS education_details jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS training_details jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS employment_type text DEFAULT 'permanent',
ADD COLUMN IF NOT EXISTS salary_grade text,
ADD COLUMN IF NOT EXISTS national_id text,
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
ADD COLUMN IF NOT EXISTS bank_account text,
ADD COLUMN IF NOT EXISTS bank_name text;

-- Create unique constraint for admission_id per school
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_admission_id_school 
ON public.students(admission_id, school_id) 
WHERE admission_id IS NOT NULL;

-- Create unique constraint for employee_id per school
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_employee_id_school 
ON public.teachers(employee_id, school_id) 
WHERE employee_id IS NOT NULL;

-- Create unique constraint for national_id for teachers
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_national_id 
ON public.teachers(national_id) 
WHERE national_id IS NOT NULL;