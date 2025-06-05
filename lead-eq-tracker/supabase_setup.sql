-- Create profiles table
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    username text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

-- Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for profiles: Users can view and update their own profile
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create equipments table
CREATE TABLE public.equipments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    serial_number text UNIQUE,
    category text, -- New category column
    status text DEFAULT 'available' NOT NULL, -- 'available' or 'unavailable'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

-- Enable Row Level Security for equipments
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

-- Policy for equipments: All authenticated users can view, add, edit, and delete equipment
CREATE POLICY "All authenticated users can view equipments." ON public.equipments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can add equipments." ON public.equipments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update equipments." ON public.equipments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete equipments." ON public.equipments
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create transactions table
CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    equipment_id uuid REFERENCES public.equipments ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
    type text NOT NULL, -- 'check_in' or 'check_out'
    transaction_date timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

-- Enable Row Level Security for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy for transactions: All authenticated users can view and add transactions
CREATE POLICY "All authenticated users can view transactions." ON public.transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can add transactions." ON public.transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create logs table
CREATE TABLE public.logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action text NOT NULL,
    details jsonb,
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
    username text NOT NULL, -- For display purposes, denormalized from profiles
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

-- Enable Row Level Security for logs
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Policy for logs: All authenticated users can view and add logs
CREATE POLICY "All authenticated users can view logs." ON public.logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can add logs." ON public.logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Function to create a profile for new users
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users inserts
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set up storage for avatars (optional, but good practice for profiles)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true);

-- Policy for storage: Allow authenticated users to upload and view their own avatars
-- CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');

-- CREATE POLICY "Anyone can upload an avatar." ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- CREATE POLICY "Anyone can update their own avatar." ON storage.objects
--   FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);