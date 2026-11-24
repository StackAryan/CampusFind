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

-- Neutralize the old check first. This stops the domain rejection even if
-- the current role cannot drop triggers on auth.users.
create or replace function public.enforce_signup_domain()
returns trigger
language plpgsql
as $$
begin
  return new;
end;
$$;

-- Remove the old triggers and function. If the role lacks permission, keep
-- the no-op function above and report a notice instead of failing.
do $$
begin
  drop trigger if exists enforce_signup_domain on auth.users;
  drop trigger if exists enforce_signup_domain_update on auth.users;
  drop function if exists public.enforce_signup_domain() cascade;
exception
  when insufficient_privilege or dependent_objects_still_exist then
    raise notice 'Could not drop the old auth trigger; the function is now a no-op.';
end $$;

drop table if exists public.signup_allowlist;
