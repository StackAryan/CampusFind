-- ============================================================
-- CampusFind — table privileges for the API roles
--
-- RLS policies decide which rows a user may read or change, but
-- PostgREST roles still need table-level GRANTs. Some Supabase
-- projects do not apply the default public-schema grants to
-- tables created by migrations.
--
-- Run this after the other migrations.
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on public.profiles, public.items, public.claims, public.notifications
  to authenticated;

grant all privileges
  on public.profiles, public.items, public.claims, public.notifications
  to service_role;
