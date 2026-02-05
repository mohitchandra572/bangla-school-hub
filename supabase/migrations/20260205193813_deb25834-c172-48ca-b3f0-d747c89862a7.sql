-- Website Content Management Tables

-- Create website_content table for all page sections
CREATE TABLE public.website_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  page text NOT NULL, -- 'home', 'about', 'contact', 'footer'
  section text NOT NULL, -- 'hero', 'features', 'stats', 'about_intro', etc.
  title text,
  title_bn text,
  content text,
  content_bn text,
  image_url text,
  metadata jsonb DEFAULT '{}',
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, page, section)
);

-- Create website_settings for general settings
CREATE TABLE public.website_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE,
  site_name text,
  site_name_bn text,
  tagline text,
  tagline_bn text,
  logo_url text,
  favicon_url text,
  contact_email text,
  contact_phone text,
  contact_phone_alt text,
  address text,
  address_bn text,
  facebook_url text,
  youtube_url text,
  twitter_url text,
  map_embed_url text,
  office_hours text,
  office_hours_bn text,
  copyright_text text,
  copyright_text_bn text,
  metadata jsonb DEFAULT '{}',
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create website_features for home page features section
CREATE TABLE public.website_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  icon text DEFAULT 'Star',
  title text NOT NULL,
  title_bn text NOT NULL,
  description text,
  description_bn text,
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create website_stats for stats/counters section
CREATE TABLE public.website_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  icon text DEFAULT 'Users',
  label text NOT NULL,
  label_bn text NOT NULL,
  value text NOT NULL,
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for website_content
CREATE POLICY "Admins can manage website content"
ON public.website_content FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view published website content"
ON public.website_content FOR SELECT
USING (is_published = true);

-- RLS Policies for website_settings
CREATE POLICY "Admins can manage website settings"
ON public.website_settings FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view website settings"
ON public.website_settings FOR SELECT
USING (true);

-- RLS Policies for website_features
CREATE POLICY "Admins can manage website features"
ON public.website_features FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view published features"
ON public.website_features FOR SELECT
USING (is_published = true);

-- RLS Policies for website_stats
CREATE POLICY "Admins can manage website stats"
ON public.website_stats FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view published stats"
ON public.website_stats FOR SELECT
USING (is_published = true);

-- Create indexes
CREATE INDEX idx_website_content_page ON public.website_content(page);
CREATE INDEX idx_website_content_section ON public.website_content(section);
CREATE INDEX idx_website_features_order ON public.website_features(display_order);
CREATE INDEX idx_website_stats_order ON public.website_stats(display_order);

-- Create storage bucket for website assets
INSERT INTO storage.buckets (id, name, public) VALUES ('website-assets', 'website-assets', true);

-- Storage policies for website assets
CREATE POLICY "Anyone can view website assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'website-assets');

CREATE POLICY "Admins can upload website assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'website-assets' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update website assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'website-assets' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete website assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'website-assets' AND is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_website_content_updated_at
  BEFORE UPDATE ON public.website_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_settings_updated_at
  BEFORE UPDATE ON public.website_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_features_updated_at
  BEFORE UPDATE ON public.website_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_stats_updated_at
  BEFORE UPDATE ON public.website_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();