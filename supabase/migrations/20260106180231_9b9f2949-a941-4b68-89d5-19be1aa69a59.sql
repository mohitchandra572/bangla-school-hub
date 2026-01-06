-- Create question paper templates table
CREATE TABLE public.question_paper_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  description_bn TEXT,
  exam_pattern TEXT NOT NULL DEFAULT 'mixed',
  subject TEXT,
  subject_bn TEXT,
  class TEXT,
  total_marks NUMERIC DEFAULT 100,
  duration_minutes INTEGER DEFAULT 180,
  instructions_bn TEXT,
  marks_distribution JSONB,
  question_structure JSONB, -- Structure for question types, counts, marks
  is_system_template BOOLEAN DEFAULT false, -- System templates vs user-created
  is_public BOOLEAN DEFAULT false, -- Shared with other teachers
  created_by UUID REFERENCES auth.users(id),
  school_id UUID REFERENCES public.schools(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.question_paper_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view system and own templates"
  ON public.question_paper_templates
  FOR SELECT
  USING (
    is_system_template = true 
    OR created_by = auth.uid()
    OR is_public = true
    OR is_admin(auth.uid())
  );

CREATE POLICY "Teachers can create templates"
  ON public.question_paper_templates
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'teacher'::app_role) OR is_admin(auth.uid())
  );

CREATE POLICY "Teachers can update own templates"
  ON public.question_paper_templates
  FOR UPDATE
  USING (
    created_by = auth.uid() OR is_admin(auth.uid())
  );

CREATE POLICY "Teachers can delete own templates"
  ON public.question_paper_templates
  FOR DELETE
  USING (
    (created_by = auth.uid() AND is_system_template = false) OR is_admin(auth.uid())
  );

-- Create index for faster lookups
CREATE INDEX idx_templates_exam_pattern ON public.question_paper_templates(exam_pattern);
CREATE INDEX idx_templates_subject ON public.question_paper_templates(subject);
CREATE INDEX idx_templates_class ON public.question_paper_templates(class);

-- Insert default system templates
INSERT INTO public.question_paper_templates (
  name, name_bn, description, description_bn, exam_pattern, 
  total_marks, duration_minutes, instructions_bn, 
  marks_distribution, question_structure, is_system_template
) VALUES
-- Primary School Pattern (Class 1-5)
(
  'Primary Creative Pattern',
  'প্রাথমিক সৃজনশীল পদ্ধতি',
  'Standard pattern for primary level (Class 1-5)',
  'প্রাথমিক স্তরের জন্য আদর্শ প্রশ্নপত্র (১ম-৫ম শ্রেণী)',
  'creative',
  50,
  120,
  'সকল প্রশ্নের উত্তর দিতে হবে।\nপ্রতিটি প্রশ্নের মান ডান পাশে উল্লেখ আছে।',
  '{"mcq": {"count": 10, "marks_each": 1, "total": 10}, "short": {"count": 5, "marks_each": 4, "total": 20}, "essay": {"count": 2, "marks_each": 10, "total": 20}}',
  '[{"type": "mcq", "section": "ক বিভাগ", "section_bn": "ক বিভাগ - বহুনির্বাচনী", "count": 10, "marks_each": 1, "instructions_bn": "সঠিক উত্তরটি বেছে নাও"}, {"type": "short", "section": "খ বিভাগ", "section_bn": "খ বিভাগ - সংক্ষিপ্ত প্রশ্ন", "count": 5, "marks_each": 4, "instructions_bn": "সংক্ষেপে উত্তর দাও"}, {"type": "essay", "section": "গ বিভাগ", "section_bn": "গ বিভাগ - রচনামূলক", "count": 2, "marks_each": 10, "instructions_bn": "বিস্তারিত উত্তর দাও"}]',
  true
),
-- SSC Creative Pattern
(
  'SSC Creative Pattern',
  'এসএসসি সৃজনশীল পদ্ধতি',
  'Standard SSC board exam pattern with creative questions',
  'এসএসসি বোর্ড পরীক্ষার সৃজনশীল পদ্ধতি',
  'creative',
  100,
  180,
  'সকল প্রশ্নের উত্তর দিতে হবে।\nডান পাশে প্রশ্নের মান উল্লেখ আছে।\nউত্তর সংক্ষিপ্ত ও যথাযথ হতে হবে।',
  '{"mcq": {"count": 30, "marks_each": 1, "total": 30}, "creative": {"count": 7, "marks_each": 10, "total": 70, "note": "11টি থেকে 7টি উত্তর দিতে হবে"}}',
  '[{"type": "mcq", "section": "ক বিভাগ", "section_bn": "ক বিভাগ - বহুনির্বাচনী", "count": 30, "marks_each": 1, "instructions_bn": "প্রতিটি প্রশ্নের জন্য চারটি বিকল্প উত্তর দেওয়া আছে। সঠিক উত্তরটি খাতায় লেখ।"}, {"type": "creative", "section": "খ বিভাগ", "section_bn": "খ বিভাগ - সৃজনশীল প্রশ্ন", "count": 11, "answer_count": 7, "marks_each": 10, "instructions_bn": "যেকোনো ৭টি প্রশ্নের উত্তর দাও। প্রতিটি প্রশ্নের মান ১০"}]',
  true
),
-- MCQ Only Pattern
(
  'MCQ Only Pattern',
  'শুধু MCQ পদ্ধতি',
  'Multiple choice questions only pattern',
  'শুধুমাত্র বহুনির্বাচনী প্রশ্ন',
  'mcq_only',
  40,
  40,
  'প্রতিটি প্রশ্নের জন্য একটিমাত্র সঠিক উত্তর আছে।\nভুল উত্তরের জন্য নম্বর কাটা যাবে না।',
  '{"mcq": {"count": 40, "marks_each": 1, "total": 40}}',
  '[{"type": "mcq", "section": "বহুনির্বাচনী", "section_bn": "বহুনির্বাচনী প্রশ্ন", "count": 40, "marks_each": 1, "instructions_bn": "সঠিক উত্তরটি বেছে নাও"}]',
  true
),
-- Half-Yearly Exam Pattern
(
  'Half-Yearly Exam',
  'অর্ধ-বার্ষিক পরীক্ষা',
  'Standard half-yearly examination pattern',
  'অর্ধ-বার্ষিক পরীক্ষার জন্য আদর্শ প্রশ্নপত্র',
  'mixed',
  100,
  180,
  'সকল প্রশ্নের উত্তর আবশ্যক।\nপ্রশ্নের মান ডান পাশে দেওয়া আছে।\nহাতের লেখা পরিষ্কার হতে হবে।',
  '{"mcq": {"count": 15, "marks_each": 1, "total": 15}, "short": {"count": 5, "marks_each": 5, "total": 25}, "essay": {"count": 4, "marks_each": 15, "total": 60}}',
  '[{"type": "mcq", "section": "ক বিভাগ", "section_bn": "ক বিভাগ - বহুনির্বাচনী", "count": 15, "marks_each": 1, "instructions_bn": "সঠিক উত্তর বেছে নাও"}, {"type": "short", "section": "খ বিভাগ", "section_bn": "খ বিভাগ - সংক্ষিপ্ত প্রশ্ন", "count": 5, "marks_each": 5, "instructions_bn": "সংক্ষেপে উত্তর দাও"}, {"type": "essay", "section": "গ বিভাগ", "section_bn": "গ বিভাগ - রচনামূলক", "count": 4, "marks_each": 15, "instructions_bn": "বিস্তারিত উত্তর দাও"}]',
  true
),
-- Class Test Pattern
(
  'Class Test',
  'শ্রেণী পরীক্ষা',
  'Quick class test pattern',
  'দ্রুত শ্রেণী পরীক্ষার জন্য',
  'mixed',
  20,
  30,
  'সকল প্রশ্নের উত্তর দাও।',
  '{"mcq": {"count": 10, "marks_each": 1, "total": 10}, "short": {"count": 2, "marks_each": 5, "total": 10}}',
  '[{"type": "mcq", "section": "MCQ", "section_bn": "বহুনির্বাচনী", "count": 10, "marks_each": 1, "instructions_bn": "সঠিক উত্তর বেছে নাও"}, {"type": "short", "section": "Short", "section_bn": "সংক্ষিপ্ত প্রশ্ন", "count": 2, "marks_each": 5, "instructions_bn": "উত্তর দাও"}]',
  true
),
-- Model Test Pattern
(
  'Model Test',
  'মডেল টেস্ট',
  'Full model test pattern for exam preparation',
  'পরীক্ষার প্রস্তুতির জন্য পূর্ণ মডেল টেস্ট',
  'creative',
  100,
  180,
  'সকল প্রশ্নের উত্তর দিতে হবে।\nসময় ব্যবস্থাপনা করে উত্তর দাও।\nপ্রশ্নের মান অনুযায়ী উত্তর লেখ।',
  '{"mcq": {"count": 25, "marks_each": 1, "total": 25}, "short": {"count": 5, "marks_each": 5, "total": 25}, "essay": {"count": 5, "marks_each": 10, "total": 50}}',
  '[{"type": "mcq", "section": "ক বিভাগ", "section_bn": "ক বিভাগ - বহুনির্বাচনী", "count": 25, "marks_each": 1, "instructions_bn": "সঠিক উত্তর বেছে নাও (২৫×১=২৫)"}, {"type": "short", "section": "খ বিভাগ", "section_bn": "খ বিভাগ - সংক্ষিপ্ত প্রশ্ন", "count": 5, "marks_each": 5, "instructions_bn": "সংক্ষেপে উত্তর দাও (৫×৫=২৫)"}, {"type": "essay", "section": "গ বিভাগ", "section_bn": "গ বিভাগ - রচনামূলক", "count": 5, "marks_each": 10, "instructions_bn": "বিস্তারিত উত্তর দাও (৫×১০=৫০)"}]',
  true
),
-- Traditional Pattern
(
  'Traditional Exam',
  'প্রচলিত পদ্ধতি',
  'Traditional question paper pattern',
  'প্রচলিত প্রশ্নপত্র পদ্ধতি',
  'traditional',
  100,
  180,
  'যেকোনো ১০টি প্রশ্নের উত্তর দাও।\nপ্রতিটি প্রশ্নের মান ১০।',
  '{"essay": {"count": 10, "marks_each": 10, "total": 100, "answer_required": 10}}',
  '[{"type": "essay", "section": "প্রশ্ন", "section_bn": "প্রশ্ন", "count": 12, "answer_count": 10, "marks_each": 10, "instructions_bn": "যেকোনো ১০টি প্রশ্নের উত্তর দাও"}]',
  true
),
-- Weekly Test Pattern
(
  'Weekly Test',
  'সাপ্তাহিক পরীক্ষা',
  'Weekly assessment test pattern',
  'সাপ্তাহিক মূল্যায়ন পরীক্ষা',
  'mixed',
  25,
  45,
  'সকল প্রশ্নের উত্তর দাও।\nসময়: ৪৫ মিনিট',
  '{"mcq": {"count": 10, "marks_each": 1, "total": 10}, "fill_blank": {"count": 5, "marks_each": 1, "total": 5}, "short": {"count": 2, "marks_each": 5, "total": 10}}',
  '[{"type": "mcq", "section": "ক", "section_bn": "ক - বহুনির্বাচনী", "count": 10, "marks_each": 1, "instructions_bn": "সঠিক উত্তর বেছে নাও"}, {"type": "fill_blank", "section": "খ", "section_bn": "খ - শূন্যস্থান পূরণ", "count": 5, "marks_each": 1, "instructions_bn": "শূন্যস্থান পূরণ কর"}, {"type": "short", "section": "গ", "section_bn": "গ - সংক্ষিপ্ত প্রশ্ন", "count": 2, "marks_each": 5, "instructions_bn": "উত্তর দাও"}]',
  true
);