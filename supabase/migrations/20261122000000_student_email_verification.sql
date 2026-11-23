-- ============================================================
-- CampusFind — student email verification
--
-- New accounts may only be created with an Adamas student
-- Outlook address (@stu.adamasuniversity.ac.in). The allowlist
-- exists so the single administrator account (and any trusted
-- staff address) can still be created.
--
-- Run this after 20260101000000_init.sql.
-- ============================================================

create table if not exists public.signup_allowlist (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

alter table public.signup_allowlist enable row level security;
revoke all on table public.signup_allowlist from public, anon, authenticated;

create or replace function public.enforce_signup_domain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) like '%@stu.adamasuniversity.ac.in' then
    return new;
  end if;

  if exists (
    select 1
    from public.signup_allowlist
    where lower(email) = lower(new.email)
  ) then
    return new;
  end if;

  raise exception 'Only Adamas student emails ending in @stu.adamasuniversity.ac.in can create an account';
end;
$$;

revoke execute on function public.enforce_signup_domain() from public, anon, authenticated;

drop trigger if exists enforce_signup_domain on auth.users;
create trigger enforce_signup_domain
  before insert on auth.users
  for each row execute function public.enforce_signup_domain();

drop trigger if exists enforce_signup_domain_update on auth.users;
create trigger enforce_signup_domain_update
  before update of email on auth.users
  for each row execute function public.enforce_signup_domain();

-- ============================================================
-- To create the administrator account:
--
--   insert into public.signup_allowlist (email, note)
--   values ('admin@yourcollege.ac.in', 'CampusFind administrator');
--
-- Then create that user in Supabase Authentication → Users (or
-- via signUp with a password), and promote the profile:
--
--   update public.profiles
--   set role = 'admin'
--   where id = (
--     select id from auth.users where email = 'admin@yourcollege.ac.in'
--   );
-- ============================================================
