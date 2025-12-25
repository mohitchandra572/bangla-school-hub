-- Create absence_responses table to track parent responses to absence notifications
CREATE TABLE public.absence_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid REFERENCES public.attendance(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid NOT NULL,
  response_type text NOT NULL DEFAULT 'pending', -- pending, acknowledged, reason_submitted, correction_requested
  reason_category text, -- illness, family, permission, other
  reason_category_bn text, -- অসুস্থতা, পারিবারিক কারণ, অনুমতি নিয়ে, অন্যান্য
  reason_text text,
  reason_text_bn text,
  document_url text, -- doctor note or other supporting document
  correction_note text, -- if requesting correction, what's wrong
  admin_status text DEFAULT 'pending', -- pending, approved, rejected
  admin_note text,
  admin_reviewed_by uuid,
  admin_reviewed_at timestamptz,
  is_acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(attendance_id, parent_id)
);

-- Add index for faster queries
CREATE INDEX idx_absence_responses_parent_id ON public.absence_responses(parent_id);
CREATE INDEX idx_absence_responses_student_id ON public.absence_responses(student_id);
CREATE INDEX idx_absence_responses_attendance_id ON public.absence_responses(attendance_id);
CREATE INDEX idx_absence_responses_admin_status ON public.absence_responses(admin_status);

-- Enable RLS
ALTER TABLE public.absence_responses ENABLE ROW LEVEL SECURITY;

-- Parents can view and manage their own responses
CREATE POLICY "Parents can view own absence responses" ON public.absence_responses
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert own responses" ON public.absence_responses
  FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own responses" ON public.absence_responses
  FOR UPDATE USING (parent_id = auth.uid() AND admin_status = 'pending');

-- Admins can manage all responses
CREATE POLICY "Admins can manage all absence responses" ON public.absence_responses
  FOR ALL USING (is_admin(auth.uid()));

-- Create function to trigger notification when student marked absent
CREATE OR REPLACE FUNCTION public.notify_parent_on_absence()
RETURNS trigger AS $$
DECLARE
  v_student RECORD;
  v_parent_user_id uuid;
BEGIN
  -- Only trigger for absent status
  IF NEW.status = 'absent' THEN
    -- Get student info
    SELECT id, full_name, full_name_bn, class, section, parent_id 
    INTO v_student 
    FROM public.students 
    WHERE id = NEW.student_id;
    
    IF v_student.parent_id IS NOT NULL THEN
      -- Create notification for parent
      INSERT INTO public.notifications (
        user_id,
        title,
        title_bn,
        message,
        message_bn,
        type,
        category,
        action_url
      ) VALUES (
        v_student.parent_id,
        'Absence Alert: ' || COALESCE(v_student.full_name, 'Student'),
        'অনুপস্থিতির সতর্কতা: ' || COALESCE(v_student.full_name_bn, v_student.full_name),
        'Your child was marked absent on ' || NEW.date || '.',
        'আপনার সন্তান ' || COALESCE(v_student.full_name_bn, v_student.full_name) || ' (' || v_student.class || ' শ্রেণি' || COALESCE(', ' || v_student.section || ' শাখা', '') || ') আজ স্কুলে অনুপস্থিত ছিল।',
        'alert',
        'attendance',
        '/dashboard/parent/absence-response/' || NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for absence notification
CREATE TRIGGER trigger_notify_parent_on_absence
AFTER INSERT OR UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.notify_parent_on_absence();

-- Create function to update updated_at
CREATE TRIGGER update_absence_responses_updated_at
BEFORE UPDATE ON public.absence_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();