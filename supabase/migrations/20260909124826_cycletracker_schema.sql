-- CycleTracker Database Schema
-- Tables: user_profiles, tracker_hasil_so, tracker_approval, tracker_form_scan_pickup, tracker_email_supplier

-- ─── 1. TYPES ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.remark_scan_status AS ENUM ('Sudah Di Scan', 'Belum Di Scan');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.remark_adjust_status AS ENUM ('Sudah Di Adjust', 'Belum Di Adjust');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.letter_status AS ENUM ('LETTER 1', 'LETTER 2', 'LETTER 3', 'FINAL LETTER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.reply_status AS ENUM ('Belum Ada Balasan', 'Sudah Ada Balasan');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('Administrator', 'Supervisor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. CORE TABLES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'Supervisor'::public.user_role,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.tracker_hasil_so (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_pt TEXT NOT NULL,
  remark_sudah_di_scan public.remark_scan_status NOT NULL DEFAULT 'Belum Di Scan'::public.remark_scan_status,
  tanggal_input DATE NOT NULL,
  photo_url TEXT,
  photo_name TEXT,
  catatan TEXT NOT NULL DEFAULT '',
  edited_by TEXT NOT NULL DEFAULT '',
  edited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.tracker_approval (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL,
  week_approval TEXT NOT NULL,
  remark_sudah_di_scan public.remark_scan_status NOT NULL DEFAULT 'Belum Di Scan'::public.remark_scan_status,
  photo_url TEXT,
  photo_name TEXT,
  catatan TEXT NOT NULL DEFAULT '',
  edited_by TEXT NOT NULL DEFAULT '',
  edited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.tracker_form_scan_pickup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remark_sudah_di_scan public.remark_scan_status NOT NULL DEFAULT 'Belum Di Scan'::public.remark_scan_status,
  remark_sudah_di_adjust public.remark_adjust_status NOT NULL DEFAULT 'Belum Di Adjust'::public.remark_adjust_status,
  tanggal_input DATE NOT NULL,
  photo_url TEXT,
  photo_name TEXT,
  catatan TEXT NOT NULL DEFAULT '',
  edited_by TEXT NOT NULL DEFAULT '',
  edited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.tracker_email_supplier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_pt TEXT NOT NULL,
  nama_barang TEXT NOT NULL,
  kode_barang TEXT NOT NULL,
  letter_status public.letter_status NOT NULL DEFAULT 'LETTER 1'::public.letter_status,
  tanggal_letter1 DATE NOT NULL,
  tanggal_letter_terakhir DATE NOT NULL,
  reply_status public.reply_status NOT NULL DEFAULT 'Belum Ada Balasan'::public.reply_status,
  catatan TEXT NOT NULL DEFAULT '',
  edited_by TEXT NOT NULL DEFAULT '',
  edited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── 2b. ENSURE ALL COLUMNS EXIST (safe for re-runs if table already existed) ─

-- tracker_hasil_so columns
ALTER TABLE public.tracker_hasil_so ADD COLUMN IF NOT EXISTS nama_pt TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_hasil_so ADD COLUMN IF NOT EXISTS remark_sudah_di_scan public.remark_scan_status NOT NULL DEFAULT 'Belum Di Scan'::public.remark_scan_status;
ALTER TABLE public.tracker_hasil_so ADD COLUMN IF NOT EXISTS tanggal_input DATE;
ALTER TABLE public.tracker_hasil_so ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.tracker_hasil_so ADD COLUMN IF NOT EXISTS photo_name TEXT;
ALTER TABLE public.tracker_hasil_so ADD COLUMN IF NOT EXISTS catatan TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_hasil_so ADD COLUMN IF NOT EXISTS edited_by TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_hasil_so ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.tracker_hasil_so ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- tracker_approval columns
ALTER TABLE public.tracker_approval ADD COLUMN IF NOT EXISTS tanggal DATE;
ALTER TABLE public.tracker_approval ADD COLUMN IF NOT EXISTS week_approval TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_approval ADD COLUMN IF NOT EXISTS remark_sudah_di_scan public.remark_scan_status NOT NULL DEFAULT 'Belum Di Scan'::public.remark_scan_status;
ALTER TABLE public.tracker_approval ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.tracker_approval ADD COLUMN IF NOT EXISTS photo_name TEXT;
ALTER TABLE public.tracker_approval ADD COLUMN IF NOT EXISTS catatan TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_approval ADD COLUMN IF NOT EXISTS edited_by TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_approval ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.tracker_approval ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- tracker_form_scan_pickup columns
ALTER TABLE public.tracker_form_scan_pickup ADD COLUMN IF NOT EXISTS remark_sudah_di_scan public.remark_scan_status NOT NULL DEFAULT 'Belum Di Scan'::public.remark_scan_status;
ALTER TABLE public.tracker_form_scan_pickup ADD COLUMN IF NOT EXISTS remark_sudah_di_adjust public.remark_adjust_status NOT NULL DEFAULT 'Belum Di Adjust'::public.remark_adjust_status;
ALTER TABLE public.tracker_form_scan_pickup ADD COLUMN IF NOT EXISTS tanggal_input DATE;
ALTER TABLE public.tracker_form_scan_pickup ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.tracker_form_scan_pickup ADD COLUMN IF NOT EXISTS photo_name TEXT;
ALTER TABLE public.tracker_form_scan_pickup ADD COLUMN IF NOT EXISTS catatan TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_form_scan_pickup ADD COLUMN IF NOT EXISTS edited_by TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_form_scan_pickup ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.tracker_form_scan_pickup ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- tracker_email_supplier columns
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS nama_pt TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS nama_barang TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS kode_barang TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS letter_status public.letter_status NOT NULL DEFAULT 'LETTER 1'::public.letter_status;
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS tanggal_letter1 DATE;
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS tanggal_letter_terakhir DATE;
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS reply_status public.reply_status NOT NULL DEFAULT 'Belum Ada Balasan'::public.reply_status;
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS catatan TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS edited_by TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.tracker_email_supplier ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ─── 3. INDEXES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tracker_hasil_so_created_at ON public.tracker_hasil_so(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_hasil_so_tanggal ON public.tracker_hasil_so(tanggal_input);
CREATE INDEX IF NOT EXISTS idx_tracker_approval_created_at ON public.tracker_approval(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_approval_week ON public.tracker_approval(week_approval);
CREATE INDEX IF NOT EXISTS idx_tracker_form_scan_pickup_created_at ON public.tracker_form_scan_pickup(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_email_supplier_created_at ON public.tracker_email_supplier(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_email_supplier_letter_status ON public.tracker_email_supplier(letter_status);

-- ─── 4. FUNCTIONS ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Supervisor')::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- ─── 5. ENABLE RLS ────────────────────────────────────────────────────────────

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_hasil_so ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_approval ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_form_scan_pickup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_email_supplier ENABLE ROW LEVEL SECURITY;

-- ─── 6. RLS POLICIES ──────────────────────────────────────────────────────────

-- user_profiles: users manage their own profile
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow authenticated users to read all profiles (for editedBy display)
DROP POLICY IF EXISTS "users_read_all_profiles" ON public.user_profiles;
CREATE POLICY "users_read_all_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- tracker_hasil_so: all authenticated users can read/write
DROP POLICY IF EXISTS "authenticated_access_hasil_so" ON public.tracker_hasil_so;
CREATE POLICY "authenticated_access_hasil_so"
ON public.tracker_hasil_so
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- tracker_approval: all authenticated users can read/write
DROP POLICY IF EXISTS "authenticated_access_approval" ON public.tracker_approval;
CREATE POLICY "authenticated_access_approval"
ON public.tracker_approval
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- tracker_form_scan_pickup: all authenticated users can read/write
DROP POLICY IF EXISTS "authenticated_access_form_scan_pickup" ON public.tracker_form_scan_pickup;
CREATE POLICY "authenticated_access_form_scan_pickup"
ON public.tracker_form_scan_pickup
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- tracker_email_supplier: all authenticated users can read/write
DROP POLICY IF EXISTS "authenticated_access_email_supplier" ON public.tracker_email_supplier;
CREATE POLICY "authenticated_access_email_supplier"
ON public.tracker_email_supplier
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── 7. TRIGGERS ──────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 8. SEED DATA ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
  supervisor_uuid UUID := gen_random_uuid();
BEGIN
  -- Create admin user in auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES
    (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.cyclecount@cycletracker.app', crypt('CC@dmin2026', gen_salt('bf', 10)), now(), now(), now(),
     jsonb_build_object('username', 'admin.cyclecount', 'name', 'Admin Cycle Count', 'role', 'Administrator'),
     jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
     false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
    (supervisor_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'supervisor.cc@cycletracker.app', crypt('Sup3rv1sor!', gen_salt('bf', 10)), now(), now(), now(),
     jsonb_build_object('username', 'supervisor.cc', 'name', 'Supervisor Cycle Count', 'role', 'Supervisor'),
     jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
     false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
  ON CONFLICT (id) DO NOTHING;

  -- Seed tracker_hasil_so
  INSERT INTO public.tracker_hasil_so (id, nama_pt, remark_sudah_di_scan, tanggal_input, photo_url, photo_name, catatan, edited_by, edited_at) VALUES
    (gen_random_uuid(), 'PT Sumber Makmur Abadi', 'Sudah Di Scan'::public.remark_scan_status, '2026-09-01', 'https://images.unsplash.com/photo-1652860520332-7b1dca630a25', 'scan_sumber_makmur_01.jpg', 'Scan lengkap semua halaman', 'admin.cyclecount', '2026-09-01T08:32:00Z'),
    (gen_random_uuid(), 'PT Cahaya Nusantara', 'Sudah Di Scan'::public.remark_scan_status, '2026-09-01', 'https://images.unsplash.com/photo-1597126470565-af3a035ae004', 'scan_cahaya_nusantara_01.jpg', '', 'admin.cyclecount', '2026-09-01T09:15:00Z'),
    (gen_random_uuid(), 'PT Maju Bersama Sejahtera', 'Belum Di Scan'::public.remark_scan_status, '2026-09-02', null, null, 'Menunggu dokumen dari gudang', 'supervisor.cc', '2026-09-02T07:45:00Z'),
    (gen_random_uuid(), 'PT Karya Mandiri Utama', 'Sudah Di Scan'::public.remark_scan_status, '2026-09-02', 'https://img.rocket.new/generatedImages/rocket_gen_img_1d87e7be4-1766525130357.png', 'scan_karya_mandiri_01.jpg', 'Scan 3 lembar', 'admin.cyclecount', '2026-09-02T10:20:00Z'),
    (gen_random_uuid(), 'PT Indo Global Persada', 'Belum Di Scan'::public.remark_scan_status, '2026-09-03', null, null, '', 'admin.cyclecount', '2026-09-03T08:00:00Z'),
    (gen_random_uuid(), 'PT Sentosa Jaya Abadi', 'Sudah Di Scan'::public.remark_scan_status, '2026-09-03', 'https://images.unsplash.com/photo-1568435307471-3c0c8b921188', 'scan_sentosa_jaya_01.jpg', 'Lengkap 5 halaman', 'supervisor.cc', '2026-09-03T11:30:00Z'),
    (gen_random_uuid(), 'PT Berkah Mulya Pratama', 'Belum Di Scan'::public.remark_scan_status, '2026-09-04', null, null, 'Dokumen sedang diproses', 'admin.cyclecount', '2026-09-04T07:15:00Z'),
    (gen_random_uuid(), 'PT Surya Gemilang Nusantara', 'Sudah Di Scan'::public.remark_scan_status, '2026-09-04', 'https://images.unsplash.com/photo-1692758449128-f2e2d3b40cd6', 'scan_surya_gemilang_01.jpg', '', 'admin.cyclecount', '2026-09-04T14:05:00Z')
  ON CONFLICT (id) DO NOTHING;

  -- Seed tracker_approval
  INSERT INTO public.tracker_approval (id, tanggal, week_approval, remark_sudah_di_scan, photo_url, photo_name, catatan, edited_by, edited_at) VALUES
    (gen_random_uuid(), '2026-09-01', 'W36', 'Sudah Di Scan'::public.remark_scan_status, 'https://img.rocket.new/generatedImages/rocket_gen_img_14bad72c6-1785528183192.png', 'apv_w36_01.jpg', 'Approval minggu 36 lengkap', 'admin.cyclecount', '2026-09-01T10:00:00Z'),
    (gen_random_uuid(), '2026-09-01', 'W36', 'Sudah Di Scan'::public.remark_scan_status, 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400', 'apv_w36_02.jpg', '', 'supervisor.cc', '2026-09-01T11:20:00Z'),
    (gen_random_uuid(), '2026-09-02', 'W36', 'Belum Di Scan'::public.remark_scan_status, null, null, 'Menunggu tanda tangan', 'admin.cyclecount', '2026-09-02T08:30:00Z'),
    (gen_random_uuid(), '2026-09-03', 'W36', 'Sudah Di Scan'::public.remark_scan_status, 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400', 'apv_w36_04.jpg', '', 'admin.cyclecount', '2026-09-03T13:00:00Z'),
    (gen_random_uuid(), '2026-09-08', 'W37', 'Belum Di Scan'::public.remark_scan_status, null, null, 'Minggu baru', 'admin.cyclecount', '2026-09-08T08:00:00Z'),
    (gen_random_uuid(), '2026-09-08', 'W37', 'Sudah Di Scan'::public.remark_scan_status, 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400', 'apv_w37_01.jpg', '', 'admin.cyclecount', '2026-09-08T09:45:00Z'),
    (gen_random_uuid(), '2026-08-25', 'W35', 'Sudah Di Scan'::public.remark_scan_status, 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400', 'apv_w35_01.jpg', 'Lengkap', 'supervisor.cc', '2026-08-25T10:00:00Z')
  ON CONFLICT (id) DO NOTHING;

  -- Seed tracker_form_scan_pickup
  INSERT INTO public.tracker_form_scan_pickup (id, remark_sudah_di_scan, remark_sudah_di_adjust, tanggal_input, photo_url, photo_name, catatan, edited_by, edited_at) VALUES
    (gen_random_uuid(), 'Sudah Di Scan'::public.remark_scan_status, 'Sudah Di Adjust'::public.remark_adjust_status, '2026-09-01', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400', 'fsp_01.jpg', 'Selesai proses', 'admin.cyclecount', '2026-09-01T10:30:00Z'),
    (gen_random_uuid(), 'Sudah Di Scan'::public.remark_scan_status, 'Belum Di Adjust'::public.remark_adjust_status, '2026-09-02', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400', 'fsp_02.jpg', 'Menunggu adjust dari tim gudang', 'supervisor.cc', '2026-09-02T09:00:00Z'),
    (gen_random_uuid(), 'Belum Di Scan'::public.remark_scan_status, 'Belum Di Adjust'::public.remark_adjust_status, '2026-09-03', null, null, '', 'admin.cyclecount', '2026-09-03T08:00:00Z'),
    (gen_random_uuid(), 'Sudah Di Scan'::public.remark_scan_status, 'Sudah Di Adjust'::public.remark_adjust_status, '2026-09-04', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400', 'fsp_04.jpg', 'OK', 'admin.cyclecount', '2026-09-04T12:00:00Z'),
    (gen_random_uuid(), 'Belum Di Scan'::public.remark_scan_status, 'Belum Di Adjust'::public.remark_adjust_status, '2026-09-05', null, null, 'Dokumen belum tiba', 'supervisor.cc', '2026-09-05T07:30:00Z'),
    (gen_random_uuid(), 'Sudah Di Scan'::public.remark_scan_status, 'Belum Di Adjust'::public.remark_adjust_status, '2026-09-08', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400', 'fsp_06.jpg', 'Adjust masih pending', 'admin.cyclecount', '2026-09-08T08:45:00Z')
  ON CONFLICT (id) DO NOTHING;

  -- Seed tracker_email_supplier
  INSERT INTO public.tracker_email_supplier (id, nama_pt, nama_barang, kode_barang, letter_status, tanggal_letter1, tanggal_letter_terakhir, reply_status, catatan, edited_by, edited_at) VALUES
    (gen_random_uuid(), 'PT Sumber Makmur Abadi', 'Spare Part Mesin A', 'SP-001', 'LETTER 2'::public.letter_status, '2026-08-18', '2026-08-25', 'Belum Ada Balasan'::public.reply_status, 'Sudah follow up 2x, belum ada respons', 'admin.cyclecount', '2026-08-25T09:00:00Z'),
    (gen_random_uuid(), 'PT Cahaya Nusantara', 'Komponen Elektronik B', 'KE-045', 'LETTER 1'::public.letter_status, '2026-09-01', '2026-09-01', 'Belum Ada Balasan'::public.reply_status, '', 'admin.cyclecount', '2026-09-01T10:00:00Z'),
    (gen_random_uuid(), 'PT Maju Bersama Sejahtera', 'Bahan Baku Plastik C', 'BB-112', 'FINAL LETTER'::public.letter_status, '2026-07-28', '2026-08-18', 'Belum Ada Balasan'::public.reply_status, 'Sudah 3 kali surat, tidak ada respons sama sekali', 'supervisor.cc', '2026-08-18T14:00:00Z'),
    (gen_random_uuid(), 'PT Karya Mandiri Utama', 'Suku Cadang Motor D', 'SC-078', 'LETTER 3'::public.letter_status, '2026-08-04', '2026-08-18', 'Belum Ada Balasan'::public.reply_status, 'Menunggu konfirmasi dari manajemen supplier', 'admin.cyclecount', '2026-08-18T11:30:00Z'),
    (gen_random_uuid(), 'PT Indo Global Persada', 'Material Kemasan E', 'MK-033', 'LETTER 1'::public.letter_status, '2026-09-05', '2026-09-05', 'Belum Ada Balasan'::public.reply_status, '', 'admin.cyclecount', '2026-09-05T08:00:00Z'),
    (gen_random_uuid(), 'PT Sentosa Jaya Abadi', 'Komponen Mesin F', 'KM-201', 'LETTER 2'::public.letter_status, '2026-08-20', '2026-08-27', 'Sudah Ada Balasan'::public.reply_status, 'Supplier konfirmasi akan proses retur', 'supervisor.cc', '2026-09-03T15:00:00Z')
  ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data insertion failed: %', SQLERRM;
END $$;
