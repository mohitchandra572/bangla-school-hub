-- Exam Papers table for teachers to create question papers
CREATE TABLE public.exam_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  subject_bn TEXT,
  title TEXT NOT NULL,
  title_bn TEXT,
  total_marks NUMERIC DEFAULT 100,
  duration_minutes INTEGER DEFAULT 60,
  instructions TEXT,
  instructions_bn TEXT,
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exam Questions within papers
CREATE TABLE public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_text_bn TEXT,
  options JSONB,
  correct_answer TEXT,
  marks NUMERIC NOT NULL DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fee Structures
CREATE TABLE public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT,
  class TEXT,
  fee_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  academic_year TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fee Receipts
CREATE TABLE public.fee_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id UUID REFERENCES public.fees(id) ON DELETE CASCADE,
  receipt_number TEXT UNIQUE NOT NULL,
  amount_paid NUMERIC NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT now(),
  payment_method TEXT,
  received_by UUID REFERENCES auth.users(id),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- System Settings
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_bn TEXT,
  message TEXT NOT NULL,
  message_bn TEXT,
  type TEXT DEFAULT 'info',
  category TEXT,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_papers
CREATE POLICY "Teachers and admins can manage exam papers"
ON public.exam_papers FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role) OR is_admin(auth.uid()));

CREATE POLICY "Anyone can view published exam papers"
ON public.exam_papers FOR SELECT
USING (status = 'published');

-- RLS Policies for exam_questions
CREATE POLICY "Teachers and admins can manage questions"
ON public.exam_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.exam_papers ep 
    WHERE ep.id = exam_questions.paper_id 
    AND (ep.created_by = auth.uid() OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Anyone can view questions of published papers"
ON public.exam_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.exam_papers ep 
    WHERE ep.id = exam_questions.paper_id 
    AND ep.status = 'published'
  )
);

-- RLS Policies for fee_structures
CREATE POLICY "Admins can manage fee structures"
ON public.fee_structures FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active fee structures"
ON public.fee_structures FOR SELECT
USING (is_active = true);

-- RLS Policies for fee_receipts
CREATE POLICY "Admins can manage receipts"
ON public.fee_receipts FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Parents can view their children receipts"
ON public.fee_receipts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fees f
    JOIN public.students s ON s.id = f.student_id
    WHERE f.id = fee_receipts.fee_id AND s.parent_id = auth.uid()
  )
);

-- RLS Policies for audit_logs
CREATE POLICY "Only super admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- RLS Policies for system_settings
CREATE POLICY "Admins can manage settings"
ON public.system_settings FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view settings"
ON public.system_settings FOR SELECT
USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Triggers for updated_at
CREATE TRIGGER update_exam_papers_updated_at
BEFORE UPDATE ON public.exam_papers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_structures_updated_at
BEFORE UPDATE ON public.fee_structures
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();