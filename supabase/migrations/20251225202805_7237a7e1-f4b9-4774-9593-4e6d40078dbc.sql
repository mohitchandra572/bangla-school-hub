-- Create fee_categories table for organizing fee types
CREATE TABLE public.fee_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_bn text NOT NULL,
  description text,
  description_bn text,
  is_recurring boolean DEFAULT false,
  frequency text, -- monthly, yearly, one-time
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Insert default fee categories for Bangladesh schools
INSERT INTO public.fee_categories (name, name_bn, is_recurring, frequency, display_order) VALUES
('Admission Fee', 'ভর্তি ফি', false, 'one-time', 1),
('Tuition Fee', 'টিউশন ফি', true, 'monthly', 2),
('Exam Fee', 'পরীক্ষা ফি', true, 'yearly', 3),
('Session Charge', 'সেশন চার্জ', true, 'yearly', 4),
('Development Fee', 'উন্নয়ন ফি', true, 'yearly', 5),
('Transport Fee', 'পরিবহন ফি', true, 'monthly', 6),
('Lab Fee', 'ল্যাব ফি', true, 'yearly', 7),
('Library Fee', 'লাইব্রেরি ফি', true, 'yearly', 8),
('Sports Fee', 'খেলাধুলা ফি', true, 'yearly', 9),
('Fine', 'জরিমানা', false, 'one-time', 10),
('Other', 'অন্যান্য', false, 'one-time', 11);

-- Enable RLS on fee_categories
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fee categories" ON public.fee_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fee categories" ON public.fee_categories
  FOR ALL USING (is_admin(auth.uid()));

-- Create fee_discounts table for scholarships, sibling discounts, etc.
CREATE TABLE public.fee_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_bn text NOT NULL,
  discount_type text NOT NULL, -- percentage, fixed
  discount_value numeric NOT NULL,
  applies_to text, -- all, specific_category, specific_class
  category_id uuid REFERENCES public.fee_categories(id),
  class text,
  criteria text, -- scholarship, sibling, staff_child, merit, need_based
  criteria_bn text,
  max_beneficiaries integer,
  current_beneficiaries integer DEFAULT 0,
  academic_year text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.fee_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage discounts" ON public.fee_discounts
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active discounts" ON public.fee_discounts
  FOR SELECT USING (is_active = true);

-- Create student_discounts to track which students have which discounts
CREATE TABLE public.student_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  discount_id uuid REFERENCES public.fee_discounts(id) ON DELETE CASCADE NOT NULL,
  approved_by uuid,
  approved_at timestamptz,
  reason text,
  reason_bn text,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, discount_id)
);

ALTER TABLE public.student_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage student discounts" ON public.student_discounts
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Students can view own discounts" ON public.student_discounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_discounts.student_id 
            AND (s.user_id = auth.uid() OR s.parent_id = auth.uid()))
  );

-- Create fee_invoices table for proper invoice management
CREATE TABLE public.fee_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  academic_year text NOT NULL,
  month text, -- For monthly fees
  invoice_date date DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  late_fee numeric DEFAULT 0,
  previous_dues numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  paid_amount numeric DEFAULT 0,
  balance_amount numeric GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status text DEFAULT 'pending', -- pending, partial, paid, overdue, cancelled
  notes text,
  notes_bn text,
  generated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fee_invoices_student ON public.fee_invoices(student_id);
CREATE INDEX idx_fee_invoices_status ON public.fee_invoices(status);
CREATE INDEX idx_fee_invoices_academic_year ON public.fee_invoices(academic_year);

ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoices" ON public.fee_invoices
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Parents can view children invoices" ON public.fee_invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = fee_invoices.student_id AND s.parent_id = auth.uid())
  );

-- Create fee_invoice_items for line items in invoice
CREATE TABLE public.fee_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.fee_invoices(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.fee_categories(id),
  description text NOT NULL,
  description_bn text,
  amount numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  net_amount numeric GENERATED ALWAYS AS (amount - discount_amount) STORED,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fee_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoice items" ON public.fee_invoice_items
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Parents can view invoice items" ON public.fee_invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fee_invoices fi 
      JOIN students s ON s.id = fi.student_id 
      WHERE fi.id = fee_invoice_items.invoice_id AND s.parent_id = auth.uid()
    )
  );

-- Create payment_transactions for tracking all payments
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  transaction_number text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  payment_method text NOT NULL, -- cash, bank, bkash, nagad, rocket, cheque
  payment_method_bn text,
  gateway_transaction_id text, -- For online payments
  gateway_response jsonb,
  cheque_number text,
  cheque_date date,
  bank_name text,
  payment_date timestamptz DEFAULT now(),
  status text DEFAULT 'completed', -- pending, completed, failed, refunded
  received_by uuid,
  verified_by uuid,
  verified_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payment_transactions_student ON public.payment_transactions(student_id);
CREATE INDEX idx_payment_transactions_invoice ON public.payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_date ON public.payment_transactions(payment_date);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage transactions" ON public.payment_transactions
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Parents can view own transactions" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = payment_transactions.student_id AND s.parent_id = auth.uid())
  );

-- Create fee_adjustments for refunds, waivers, corrections
CREATE TABLE public.fee_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  adjustment_type text NOT NULL, -- waiver, refund, correction, late_fee_waiver
  adjustment_type_bn text,
  amount numeric NOT NULL,
  reason text NOT NULL,
  reason_bn text,
  approved_by uuid,
  approved_at timestamptz,
  status text DEFAULT 'pending', -- pending, approved, rejected
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fee_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage adjustments" ON public.fee_adjustments
  FOR ALL USING (is_admin(auth.uid()));

-- Create installment_plans for students who pay in installments
CREATE TABLE public.installment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL,
  number_of_installments integer NOT NULL,
  start_date date NOT NULL,
  status text DEFAULT 'active', -- active, completed, defaulted
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage installments" ON public.installment_plans
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Parents can view own installments" ON public.installment_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = installment_plans.student_id AND s.parent_id = auth.uid())
  );

-- Create installment_schedule for individual installment due dates
CREATE TABLE public.installment_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.installment_plans(id) ON DELETE CASCADE NOT NULL,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  paid_amount numeric DEFAULT 0,
  paid_date date,
  status text DEFAULT 'pending', -- pending, paid, overdue, partial
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.installment_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedule" ON public.installment_schedule
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Parents can view own schedule" ON public.installment_schedule
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM installment_plans ip 
      JOIN students s ON s.id = ip.student_id 
      WHERE ip.id = installment_schedule.plan_id AND s.parent_id = auth.uid()
    )
  );

-- Add late fee settings to system_settings (insert if not exists)
INSERT INTO public.system_settings (key, value, category) VALUES
('late_fee_percentage', '5', 'fees'),
('late_fee_grace_days', '7', 'fees'),
('fee_reminder_days', '["7", "3", "1"]', 'fees')
ON CONFLICT (key) DO NOTHING;

-- Create function to check if student has pending fees (for exam eligibility)
CREATE OR REPLACE FUNCTION public.check_student_fee_status(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_dues numeric;
  v_pending_invoices integer;
  v_is_cleared boolean;
BEGIN
  SELECT 
    COALESCE(SUM(balance_amount), 0),
    COUNT(*)
  INTO v_total_dues, v_pending_invoices
  FROM fee_invoices
  WHERE student_id = p_student_id
    AND status IN ('pending', 'partial', 'overdue');
  
  v_is_cleared := v_total_dues = 0;
  
  RETURN jsonb_build_object(
    'is_cleared', v_is_cleared,
    'total_dues', v_total_dues,
    'pending_invoices', v_pending_invoices
  );
END;
$$;

-- Update triggers
CREATE TRIGGER update_fee_invoices_updated_at
BEFORE UPDATE ON public.fee_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();