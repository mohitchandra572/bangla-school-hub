-- Create school_payments table for billing tracking
CREATE TABLE public.school_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  payment_method text, -- bkash, nagad, bank, cash
  transaction_id text,
  payment_date timestamptz DEFAULT now(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text DEFAULT 'completed', -- pending, completed, failed, refunded
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for school_payments
CREATE POLICY "Super admins can manage all payments"
ON public.school_payments
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "School admins can view own school payments"
ON public.school_payments
FOR SELECT
USING (is_school_admin(auth.uid(), school_id));

-- Add index for common queries
CREATE INDEX idx_school_payments_school_id ON public.school_payments(school_id);
CREATE INDEX idx_school_payments_payment_date ON public.school_payments(payment_date);
CREATE INDEX idx_school_payments_status ON public.school_payments(status);