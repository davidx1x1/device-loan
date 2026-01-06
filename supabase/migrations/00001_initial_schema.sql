-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'staff');
CREATE TYPE device_category AS ENUM ('laptop', 'tablet', 'camera', 'other');
CREATE TYPE loan_status AS ENUM ('reserved', 'collected', 'returned', 'cancelled');

-- Profiles table (extends Supabase Auth users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Device models table
CREATE TABLE device_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  category device_category NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand, model)
);

-- Individual devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_model_id UUID NOT NULL REFERENCES device_models(id) ON DELETE CASCADE,
  serial_number VARCHAR(255) UNIQUE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  status loan_status NOT NULL DEFAULT 'reserved',
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  collected_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  collected_by_staff_id UUID REFERENCES public.profiles(id),
  returned_to_staff_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Waitlist table (for device model notifications)
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_model_id UUID NOT NULL REFERENCES device_models(id) ON DELETE CASCADE,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One waitlist entry per user per device model
  UNIQUE(user_id, device_model_id)
);

-- Audit log for important actions
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  correlation_id UUID NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

CREATE INDEX idx_devices_model_id ON devices(device_model_id);
CREATE INDEX idx_devices_available ON devices(is_available);

CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_device_id ON loans(device_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);

-- Ensure a device can only have one active loan at a time
CREATE UNIQUE INDEX idx_unique_active_loan ON loans(device_id, status)
  WHERE (status IN ('reserved', 'collected'));

CREATE INDEX idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX idx_waitlist_device_model_id ON waitlist(device_model_id);
CREATE INDEX idx_waitlist_notified ON waitlist(notified);

CREATE INDEX idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_models_updated_at BEFORE UPDATE ON device_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get available device count for a model
CREATE OR REPLACE FUNCTION get_available_device_count(model_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM devices d
    WHERE d.device_model_id = model_id
    AND d.is_available = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM loans l
      WHERE l.device_id = d.id
      AND l.status IN ('reserved', 'collected')
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read access to device models for unauthenticated users
CREATE POLICY "Anyone can view device models" ON device_models
  FOR SELECT USING (true);

-- Authenticated users can view all devices
CREATE POLICY "Authenticated users can view devices" ON devices
  FOR SELECT USING (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can view their own loans
CREATE POLICY "Users can view own loans" ON loans
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist entries" ON waitlist
  FOR SELECT USING (auth.uid() = user_id);

-- Note: INSERT/UPDATE/DELETE policies for reservations will be handled at the application level
-- with service role key for proper RBAC enforcement
