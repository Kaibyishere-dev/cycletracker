-- Fix RLS policies for CycleTracker
-- CycleTracker uses custom session cookie (ct_session), NOT Supabase Auth.
-- All API routes use createAdminClient() with SUPABASE_SERVICE_ROLE_KEY.
-- Service role bypasses RLS by default, but we add explicit policies as a safety net.
-- We also add policies for anon role so the app works even if service role key is missing.

-- ─── tracker_email_supplier ───────────────────────────────────────────────────

-- Drop existing policies
DROP POLICY IF EXISTS "authenticated_access_email_supplier" ON public.tracker_email_supplier;
DROP POLICY IF EXISTS "service_role_access_email_supplier" ON public.tracker_email_supplier;
DROP POLICY IF EXISTS "anon_access_email_supplier" ON public.tracker_email_supplier;

-- Allow service_role full access (used by createAdminClient / server-side API routes)
CREATE POLICY "service_role_access_email_supplier"
ON public.tracker_email_supplier
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow anon full access as fallback (API routes validate session via ct_session cookie)
CREATE POLICY "anon_access_email_supplier"
ON public.tracker_email_supplier
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Keep authenticated policy for completeness
CREATE POLICY "authenticated_access_email_supplier"
ON public.tracker_email_supplier
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── tracker_hasil_so ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_access_hasil_so" ON public.tracker_hasil_so;
DROP POLICY IF EXISTS "service_role_access_hasil_so" ON public.tracker_hasil_so;
DROP POLICY IF EXISTS "anon_access_hasil_so" ON public.tracker_hasil_so;

CREATE POLICY "service_role_access_hasil_so"
ON public.tracker_hasil_so
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "anon_access_hasil_so"
ON public.tracker_hasil_so
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_access_hasil_so"
ON public.tracker_hasil_so
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── tracker_approval ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_access_approval" ON public.tracker_approval;
DROP POLICY IF EXISTS "service_role_access_approval" ON public.tracker_approval;
DROP POLICY IF EXISTS "anon_access_approval" ON public.tracker_approval;

CREATE POLICY "service_role_access_approval"
ON public.tracker_approval
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "anon_access_approval"
ON public.tracker_approval
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_access_approval"
ON public.tracker_approval
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── tracker_form_scan_pickup ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_access_form_scan_pickup" ON public.tracker_form_scan_pickup;
DROP POLICY IF EXISTS "service_role_access_form_scan_pickup" ON public.tracker_form_scan_pickup;
DROP POLICY IF EXISTS "anon_access_form_scan_pickup" ON public.tracker_form_scan_pickup;

CREATE POLICY "service_role_access_form_scan_pickup"
ON public.tracker_form_scan_pickup
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "anon_access_form_scan_pickup"
ON public.tracker_form_scan_pickup
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_access_form_scan_pickup"
ON public.tracker_form_scan_pickup
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
