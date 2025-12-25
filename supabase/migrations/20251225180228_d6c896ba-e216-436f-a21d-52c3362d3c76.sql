-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'school_admin', 'teacher', 'parent', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  full_name_bn TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  roll_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  full_name_bn TEXT,
  class TEXT NOT NULL,
  section TEXT,
  date_of_birth DATE,
  gender TEXT,
  parent_id UUID,
  address TEXT,
  phone TEXT,
  email TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  full_name_bn TEXT,
  designation TEXT,
  department TEXT,
  qualification TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create notices table
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_bn TEXT,
  content TEXT NOT NULL,
  content_bn TEXT,
  category TEXT DEFAULT 'general',
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  remarks TEXT,
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_id, date)
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT,
  exam_type TEXT NOT NULL,
  class TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  academic_year TEXT,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create results table
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  marks_obtained NUMERIC(5,2),
  total_marks NUMERIC(5,2) DEFAULT 100,
  grade TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(exam_id, student_id, subject)
);

-- Create fees table
CREATE TABLE public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  fee_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create gallery table
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_bn TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin (super_admin or school_admin)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'school_admin')
  )
$$;

-- Profile policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (only admins can manage)
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Notice policies (public read, admin write)
CREATE POLICY "Anyone can view published notices" ON public.notices FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage notices" ON public.notices FOR ALL USING (public.is_admin(auth.uid()));

-- Gallery policies (public read, admin write)
CREATE POLICY "Anyone can view published gallery" ON public.gallery FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage gallery" ON public.gallery FOR ALL USING (public.is_admin(auth.uid()));

-- Student policies
CREATE POLICY "Admins can manage students" ON public.students FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Teachers can view students" ON public.students FOR SELECT USING (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Parents can view their children" ON public.students FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students s WHERE s.parent_id = auth.uid() AND s.id = students.id)
);

-- Teacher policies
CREATE POLICY "Admins can manage teachers" ON public.teachers FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Anyone can view teachers" ON public.teachers FOR SELECT USING (true);

-- Attendance policies
CREATE POLICY "Teachers can manage attendance" ON public.attendance FOR ALL USING (public.has_role(auth.uid(), 'teacher') OR public.is_admin(auth.uid()));
CREATE POLICY "Parents can view children attendance" ON public.attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students s WHERE s.parent_id = auth.uid() AND s.id = attendance.student_id)
);

-- Exam policies
CREATE POLICY "Anyone can view exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (public.is_admin(auth.uid()));

-- Results policies
CREATE POLICY "Admins and teachers can manage results" ON public.results FOR ALL USING (public.has_role(auth.uid(), 'teacher') OR public.is_admin(auth.uid()));
CREATE POLICY "Parents can view children results" ON public.results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students s WHERE s.parent_id = auth.uid() AND s.id = results.student_id)
);

-- Fees policies
CREATE POLICY "Admins can manage fees" ON public.fees FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Parents can view children fees" ON public.fees FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students s WHERE s.parent_id = auth.uid() AND s.id = fees.student_id)
);

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON public.results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fees_updated_at BEFORE UPDATE ON public.fees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();