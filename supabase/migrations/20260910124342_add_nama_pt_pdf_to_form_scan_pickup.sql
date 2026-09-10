-- Migration: Add nama_pt, pdf_url, pdf_name to tracker_form_scan_pickup
-- Safe additive migration - no existing data is modified

ALTER TABLE public.tracker_form_scan_pickup
  ADD COLUMN IF NOT EXISTS nama_pt TEXT NOT NULL DEFAULT '';

ALTER TABLE public.tracker_form_scan_pickup
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

ALTER TABLE public.tracker_form_scan_pickup
  ADD COLUMN IF NOT EXISTS pdf_name TEXT;

-- Index for sorting/searching by nama_pt
CREATE INDEX IF NOT EXISTS idx_tracker_form_scan_pickup_nama_pt
  ON public.tracker_form_scan_pickup(nama_pt);

-- Index for sorting by tanggal_input
CREATE INDEX IF NOT EXISTS idx_tracker_form_scan_pickup_tanggal_input
  ON public.tracker_form_scan_pickup(tanggal_input);
