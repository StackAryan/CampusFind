-- ============================================================
-- CampusFind — allow any email address
--
-- Removes the Adamas student domain restriction added by
-- 20261122000000_student_email_verification.sql. Any valid
-- email address can now create an account through Supabase Auth.
--
-- Run this after 20261122000000_student_email_verification.sql.
-- If that migration was never applied, this file is a no-op.
-- ============================================================

drop trigger if exists enforce_signup_domain on auth.users;
drop trigger if exists enforce_signup_domain_update on auth.users;

drop function if exists public.enforce_signup_domain();

drop table if exists public.signup_allowlist;
