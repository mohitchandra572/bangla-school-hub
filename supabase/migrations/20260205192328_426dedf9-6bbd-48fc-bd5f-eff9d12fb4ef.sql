
-- Certificate types enum
CREATE TYPE certificate_type AS ENUM (
  'transfer_certificate',
  'testimonial',
  'character_certificate',
  'study_certificate',
  'bonafide_certificate'
);

-- Certificate status enum
CREATE TYPE certificate_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'issued',
  'cancelled'
);

-- Student ID Configuration table
CREATE TABLE public.student_id_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  prefix text DEFAULT '',
  include_year boolean DEFAULT true,
  year_format text DEFAULT 'YYYY', -- YYYY, YY
  include_class_code boolean DEFAULT true,
  separator text DEFAULT '-',
  serial_digits integer DEFAULT 4,
  current_serial integer DEFAULT 0,
  academic_year text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, academic_year)
);

-- Certificate templates table
CREATE TABLE public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  certificate_type certificate_type NOT NULL,
  name text NOT NULL,
  name_bn text NOT NULL,
  template_content text, -- HTML/Markdown template
  template_content_bn text,
  header_text text,
  header_text_bn text,
  footer_text text,
  footer_text_bn text,
  show_logo boolean DEFAULT true,
  show_principal_signature boolean DEFAULT true,
  show_stamp boolean DEFAULT true,
  principal_name text,
  principal_name_bn text,
  principal_designation text DEFAULT 'প্রধান শিক্ষক',
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, certificate_type)
);

-- Certificates table
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  certificate_type certificate_type NOT NULL,
  certificate_number text NOT NULL UNIQUE,
  issue_date date DEFAULT CURRENT_DATE,
  
  -- Certificate data (JSON for flexibility)
  certificate_data jsonb DEFAULT '{}',
  
  -- Student snapshot at time of generation
  student_name text NOT NULL,
  student_name_bn text,
  father_name text,
  father_name_bn text,
  mother_name text,
  mother_name_bn text,
  class text NOT NULL,
  section text,
  roll_number text,
  date_of_birth date,
  admission_date date,
  leaving_date date,
  
  -- For TC specific fields
  reason_for_leaving text,
  reason_for_leaving_bn text,
  conduct text DEFAULT 'Good',
  conduct_bn text DEFAULT 'ভালো',
  last_exam_passed text,
  last_exam_passed_bn text,
  
  -- Verification
  verification_code text NOT NULL UNIQUE,
  qr_code_data text,
  
  -- Workflow
  status certificate_status DEFAULT 'draft',
  requested_by uuid,
  requested_at timestamptz DEFAULT now(),
  approved_by uuid,
  approved_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  rejection_reason text,
  issued_by uuid,
  issued_at timestamptz,
  
  -- Tracking
  download_count integer DEFAULT 0,
  last_downloaded_at timestamptz,
  printed_count integer DEFAULT 0,
  last_printed_at timestamptz,
  
  -- Audit
  notes text,
  notes_bn text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Certificate verification log
CREATE TABLE public.certificate_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid REFERENCES public.certificates(id) ON DELETE CASCADE NOT NULL,
  verification_code text NOT NULL,
  verified_at timestamptz DEFAULT now(),
  verified_by_ip text,
  verified_by_user_agent text,
  is_valid boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.student_id_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_id_config
CREATE POLICY "Admins can manage student ID config"
  ON public.student_id_config FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view student ID config"
  ON public.student_id_config FOR SELECT
  USING (true);

-- RLS Policies for certificate_templates
CREATE POLICY "Admins can manage certificate templates"
  ON public.certificate_templates FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view active templates"
  ON public.certificate_templates FOR SELECT
  USING (is_active = true);

-- RLS Policies for certificates
CREATE POLICY "Admins can manage certificates"
  ON public.certificates FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can view and create certificates"
  ON public.certificates FOR SELECT
  USING (has_role(auth.uid(), 'teacher') OR is_admin(auth.uid()));

CREATE POLICY "Teachers can create certificate requests"
  ON public.certificates FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'teacher') OR is_admin(auth.uid()));

CREATE POLICY "Parents can view own children certificates"
  ON public.certificates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = certificates.student_id 
    AND s.parent_id = auth.uid()
  ));

-- RLS Policies for certificate_verifications
CREATE POLICY "Anyone can verify certificates"
  ON public.certificate_verifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view verifications"
  ON public.certificate_verifications FOR SELECT
  USING (is_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_certificates_student ON public.certificates(student_id);
CREATE INDEX idx_certificates_type ON public.certificates(certificate_type);
CREATE INDEX idx_certificates_status ON public.certificates(status);
CREATE INDEX idx_certificates_verification ON public.certificates(verification_code);
CREATE INDEX idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX idx_certificate_verifications_code ON public.certificate_verifications(verification_code);

-- Function to generate student ID
CREATE OR REPLACE FUNCTION public.generate_student_id(
  p_school_id uuid,
  p_class text,
  p_academic_year text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config student_id_config%ROWTYPE;
  v_student_id text;
  v_year_part text;
  v_class_code text;
  v_serial text;
BEGIN
  -- Get config
  SELECT * INTO v_config FROM student_id_config 
  WHERE school_id = p_school_id AND academic_year = p_academic_year AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Create default config
    INSERT INTO student_id_config (school_id, academic_year)
    VALUES (p_school_id, p_academic_year)
    RETURNING * INTO v_config;
  END IF;
  
  -- Update serial
  UPDATE student_id_config 
  SET current_serial = current_serial + 1, updated_at = now()
  WHERE id = v_config.id
  RETURNING current_serial INTO v_config.current_serial;
  
  -- Build ID
  v_student_id := COALESCE(v_config.prefix, '');
  
  -- Add year
  IF v_config.include_year THEN
    IF v_config.year_format = 'YY' THEN
      v_year_part := RIGHT(p_academic_year, 2);
    ELSE
      v_year_part := LEFT(p_academic_year, 4);
    END IF;
    v_student_id := v_student_id || v_year_part || COALESCE(v_config.separator, '');
  END IF;
  
  -- Add class code
  IF v_config.include_class_code THEN
    v_class_code := LPAD(REGEXP_REPLACE(p_class, '[^0-9]', '', 'g'), 2, '0');
    v_student_id := v_student_id || v_class_code || COALESCE(v_config.separator, '');
  END IF;
  
  -- Add serial
  v_serial := LPAD(v_config.current_serial::text, COALESCE(v_config.serial_digits, 4), '0');
  v_student_id := v_student_id || v_serial;
  
  RETURN v_student_id;
END;
$$;

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number(
  p_school_id uuid,
  p_certificate_type certificate_type
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_year text;
  v_count integer;
  v_number text;
BEGIN
  -- Set prefix based on type
  v_prefix := CASE p_certificate_type
    WHEN 'transfer_certificate' THEN 'TC'
    WHEN 'testimonial' THEN 'TM'
    WHEN 'character_certificate' THEN 'CC'
    WHEN 'study_certificate' THEN 'SC'
    WHEN 'bonafide_certificate' THEN 'BC'
  END;
  
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  
  -- Get count for this year and type
  SELECT COUNT(*) + 1 INTO v_count
  FROM certificates 
  WHERE school_id = p_school_id 
    AND certificate_type = p_certificate_type
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_number := v_prefix || '-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  
  RETURN v_number;
END;
$$;

-- Function to generate verification code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS text
LANGUAGE sql
AS $$
  SELECT UPPER(SUBSTRING(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text) FROM 1 FOR 12));
$$;
