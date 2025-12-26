
-- Create chapters/topics table for organizing questions
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  subject_bn TEXT NOT NULL,
  class TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  chapter_name TEXT NOT NULL,
  chapter_name_bn TEXT NOT NULL,
  description TEXT,
  description_bn TEXT,
  is_active BOOLEAN DEFAULT true,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  UNIQUE(subject, class, chapter_number, school_id)
);

-- Create question_bank table for storing reusable questions
CREATE TABLE public.question_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  subject_bn TEXT NOT NULL,
  class TEXT NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq',
  question_text TEXT NOT NULL,
  question_text_bn TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  marks NUMERIC NOT NULL DEFAULT 1,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  difficulty_bn TEXT DEFAULT 'মধ্যম',
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create question_import_history for OCR imports
CREATE TABLE public.question_import_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  import_type TEXT NOT NULL DEFAULT 'manual',
  language TEXT DEFAULT 'bn',
  status TEXT DEFAULT 'pending',
  total_questions INTEGER DEFAULT 0,
  imported_questions INTEGER DEFAULT 0,
  failed_questions INTEGER DEFAULT 0,
  error_log JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create school_branding table for paper headers/footers
CREATE TABLE public.school_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE,
  header_text TEXT,
  header_text_bn TEXT,
  footer_text TEXT,
  footer_text_bn TEXT,
  watermark_text TEXT,
  watermark_text_bn TEXT,
  show_logo BOOLEAN DEFAULT true,
  logo_position TEXT DEFAULT 'center',
  paper_margin_top INTEGER DEFAULT 20,
  paper_margin_bottom INTEGER DEFAULT 20,
  paper_margin_left INTEGER DEFAULT 15,
  paper_margin_right INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add chapter_id and difficulty to exam_questions for better organization
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS difficulty_bn TEXT DEFAULT 'মধ্যম';
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS source_question_id UUID REFERENCES public.question_bank(id) ON DELETE SET NULL;

-- Add branding reference to exam_papers
ALTER TABLE public.exam_papers ADD COLUMN IF NOT EXISTS use_school_branding BOOLEAN DEFAULT true;
ALTER TABLE public.exam_papers ADD COLUMN IF NOT EXISTS custom_header TEXT;
ALTER TABLE public.exam_papers ADD COLUMN IF NOT EXISTS custom_footer TEXT;
ALTER TABLE public.exam_papers ADD COLUMN IF NOT EXISTS marks_distribution JSONB;
ALTER TABLE public.exam_papers ADD COLUMN IF NOT EXISTS exam_pattern TEXT;
ALTER TABLE public.exam_papers ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE public.exam_papers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_branding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chapters
CREATE POLICY "Teachers can view chapters" ON public.chapters
  FOR SELECT USING (has_role(auth.uid(), 'teacher'::app_role) OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage chapters" ON public.chapters
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for question_bank
CREATE POLICY "Teachers can view questions" ON public.question_bank
  FOR SELECT USING (has_role(auth.uid(), 'teacher'::app_role) OR is_admin(auth.uid()));

CREATE POLICY "Teachers can create questions" ON public.question_bank
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) OR is_admin(auth.uid()));

CREATE POLICY "Teachers can update own questions" ON public.question_bank
  FOR UPDATE USING (created_by = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete questions" ON public.question_bank
  FOR DELETE USING (is_admin(auth.uid()));

-- RLS Policies for question_import_history
CREATE POLICY "Teachers can view own imports" ON public.question_import_history
  FOR SELECT USING (created_by = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Teachers can create imports" ON public.question_import_history
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage imports" ON public.question_import_history
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for school_branding
CREATE POLICY "Users can view school branding" ON public.school_branding
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage school branding" ON public.school_branding
  FOR ALL USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_question_bank_subject ON public.question_bank(subject, class);
CREATE INDEX idx_question_bank_chapter ON public.question_bank(chapter_id);
CREATE INDEX idx_question_bank_difficulty ON public.question_bank(difficulty);
CREATE INDEX idx_chapters_subject ON public.chapters(subject, class);

-- Insert default difficulty levels for reference
COMMENT ON COLUMN public.question_bank.difficulty IS 'easy, medium, hard';
COMMENT ON COLUMN public.question_bank.question_type IS 'mcq, short, essay, fill_blank, true_false, matching';
