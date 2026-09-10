-- Migration: Add cycle_count, pdf_url, pdf_name to tracker_approval
-- Add Pending to remark_scan_status enum
-- Safe additive migration only

-- Step 1: Add 'Pending' to remark_scan_status enum (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'Pending'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'remark_scan_status')
  ) THEN
    ALTER TYPE remark_scan_status ADD VALUE 'Pending';
  END IF;
END;
$$;

-- Step 2: Add cycle_count column to tracker_approval (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tracker_approval'
      AND column_name = 'cycle_count'
  ) THEN
    ALTER TABLE public.tracker_approval ADD COLUMN cycle_count text NOT NULL DEFAULT '';
  END IF;
END;
$$;

-- Step 3: Add pdf_url column to tracker_approval (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tracker_approval'
      AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE public.tracker_approval ADD COLUMN pdf_url text NULL;
  END IF;
END;
$$;

-- Step 4: Add pdf_name column to tracker_approval (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tracker_approval'
      AND column_name = 'pdf_name'
  ) THEN
    ALTER TABLE public.tracker_approval ADD COLUMN pdf_name text NULL;
  END IF;
END;
$$;
