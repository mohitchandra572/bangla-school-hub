-- Add photo_url to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url text;

-- Create exam_routines table for exam schedules
CREATE TABLE IF NOT EXISTS public.exam_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL,
  subject text NOT NULL,
  subject_bn text,
  exam_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  room_no text,
  total_marks numeric DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admit_cards table
CREATE TABLE IF NOT EXISTS public.admit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL,
  student_id uuid NOT NULL,
  admit_number text NOT NULL,
  qr_code_data text,
  eligibility_status text DEFAULT 'pending',
  eligibility_reason text,
  fees_cleared boolean DEFAULT false,
  documents_complete boolean DEFAULT false,
  is_downloaded boolean DEFAULT false,
  downloaded_at timestamptz,
  generated_by uuid,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- Create grading_rules table with Bangladesh GPA system
CREATE TABLE IF NOT EXISTS public.grading_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_bn text,
  grade_code text NOT NULL,
  grade_name_bn text,
  min_marks numeric NOT NULL,
  max_marks numeric NOT NULL,
  grade_point numeric NOT NULL,
  remarks_bn text,
  is_passing boolean DEFAULT true,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.exam_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_routines
CREATE POLICY "Admins can manage exam routines" ON public.exam_routines
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view exam routines" ON public.exam_routines
FOR SELECT USING (true);

-- RLS Policies for admit_cards
CREATE POLICY "Admins can manage admit cards" ON public.admit_cards
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Students can view own admit cards" ON public.admit_cards
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = admit_cards.student_id 
    AND (s.user_id = auth.uid() OR s.parent_id = auth.uid())
  )
);

-- RLS Policies for grading_rules
CREATE POLICY "Admins can manage grading rules" ON public.grading_rules
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view grading rules" ON public.grading_rules
FOR SELECT USING (true);

-- Insert Bangladesh GPA System (SSC/HSC Standard)
INSERT INTO public.grading_rules (name, name_bn, grade_code, grade_name_bn, min_marks, max_marks, grade_point, remarks_bn, is_passing, display_order) VALUES
('Bangladesh SSC/HSC', 'বাংলাদেশ এসএসসি/এইচএসসি', 'A+', 'এ+', 80, 100, 5.00, 'অসাধারণ', true, 1),
('Bangladesh SSC/HSC', 'বাংলাদেশ এসএসসি/এইচএসসি', 'A', 'এ', 70, 79, 4.00, 'অতি উত্তম', true, 2),
('Bangladesh SSC/HSC', 'বাংলাদেশ এসএসসি/এইচএসসি', 'A-', 'এ-', 60, 69, 3.50, 'উত্তম', true, 3),
('Bangladesh SSC/HSC', 'বাংলাদেশ এসএসসি/এইচএসসি', 'B', 'বি', 50, 59, 3.00, 'ভালো', true, 4),
('Bangladesh SSC/HSC', 'বাংলাদেশ এসএসসি/এইচএসসি', 'C', 'সি', 40, 49, 2.00, 'গড়', true, 5),
('Bangladesh SSC/HSC', 'বাংলাদেশ এসএসসি/এইচএসসি', 'D', 'ডি', 33, 39, 1.00, 'পাস', true, 6),
('Bangladesh SSC/HSC', 'বাংলাদেশ এসএসসি/এইচএসসি', 'F', 'এফ', 0, 32, 0.00, 'অকৃতকার্য', false, 7);

-- Create trigger for updated_at on exam_routines
CREATE TRIGGER update_exam_routines_updated_at
BEFORE UPDATE ON public.exam_routines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add section column to exams table if not exists
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS section text;

-- Add verification_status to results table
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS verified_by uuid;
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS verified_at timestamptz;