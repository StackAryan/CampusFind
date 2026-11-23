-- ============================================================
-- CampusFind — Campus Lost & Found
-- Initial schema: profiles, items, claims, notifications,
-- row level security, review workflow, storage and realtime.
--
-- Run this migration once in a fresh Supabase project.
-- ============================================================

-- ---------- Profiles ----------
-- Emails intentionally live only in auth.users. They are exposed
-- to administrators through the admin_list_users() function below.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Prevent students from promoting themselves through the API.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only administrators can change roles';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------- Items ----------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('lost', 'found')),
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 2000),
  category text not null,
  location text not null,
  event_date date not null,
  image_url text,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_status_idx on public.items (status);
create index items_type_idx on public.items (type);
create index items_created_at_idx on public.items (created_at desc);
create index items_user_id_idx on public.items (user_id);

-- Safe administrator-only user directory. Joins auth.users for email
-- without ever granting table access to auth.users.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  full_name text,
  role text,
  created_at timestamptz,
  email text,
  report_count bigint
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p.id,
    p.full_name,
    p.role,
    p.created_at,
    u.email,
    (select count(*) from public.items i where i.user_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at asc;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;


create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

-- ---------- Claims ----------
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  claimant_id uuid not null references public.profiles (id) on delete cascade,
  message text not null check (char_length(message) between 20 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index claims_item_id_idx on public.claims (item_id);
create index claims_claimant_id_idx on public.claims (claimant_id);
create unique index claims_one_pending_idx
  on public.claims (item_id, claimant_id)
  where status = 'pending';

-- ---------- Notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);

-- ---------- Claim workflow triggers ----------
create or replace function public.handle_new_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  select id, user_id, type, status, title into item
  from public.items where id = new.item_id;

  if item is null then
    raise exception 'Item not found';
  end if;
  if item.type <> 'found' then
    raise exception 'Claims can only be made on found items';
  end if;
  if item.status = 'resolved' then
    raise exception 'This item has already been recovered';
  end if;
  if item.user_id = new.claimant_id then
    raise exception 'You cannot claim your own report';
  end if;

  update public.items
  set status = 'in_review'
  where id = new.item_id and status = 'open';

  insert into public.notifications (user_id, title, body, link)
  values (
    item.user_id,
    'New claim received',
    'Someone submitted a claim for "' || item.title || '". An admin will verify it.',
    '/items/' || new.item_id
  );

  return new;
end;
$$;

create trigger claim_created
  after insert on public.claims
  for each row execute function public.handle_new_claim();

create or replace function public.handle_claim_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  if old.status <> 'pending' or new.status = 'pending' then
    return new;
  end if;

  select id, user_id, title into item
  from public.items where id = new.item_id;

  if new.status = 'approved' then
    update public.items
    set status = 'resolved'
    where id = new.item_id;

    update public.claims
    set status = 'rejected',
        review_note = 'Another claim was approved for this item.',
        reviewed_at = now(),
        reviewed_by = new.reviewed_by
    where item_id = new.item_id
      and id <> new.id
      and status = 'pending';

    insert into public.notifications (user_id, title, body, link)
    values (
      new.claimant_id,
      'Claim approved',
      'Your claim for "' || item.title || '" was approved.'
        || coalesce(' Note: ' || new.review_note, ''),
      '/items/' || new.item_id
    );

    insert into public.notifications (user_id, title, body, link)
    values (
      item.user_id,
      'Item recovered',
      '"' || item.title || '" has been marked as recovered.',
      '/items/' || new.item_id
    );
  else
    insert into public.notifications (user_id, title, body, link)
    values (
      new.claimant_id,
      'Claim not approved',
      'Your claim for "' || item.title || '" was not approved.'
        || coalesce(' Note: ' || new.review_note, ''),
      '/items/' || new.item_id
    );

    if not exists (
      select 1 from public.claims
      where item_id = new.item_id and status = 'pending'
    ) then
      update public.items
      set status = 'open'
      where id = new.item_id and status = 'in_review';
    end if;
  end if;

  return new;
end;
$$;

create trigger claim_reviewed
  after update of status on public.claims
  for each row execute function public.handle_claim_review();

-- Owners cannot resolve an item while claims are awaiting review.
create or replace function public.guard_item_resolution()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'resolved'
     and old.status = 'in_review'
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'This item has claims waiting for admin review';
  end if;
  return new;
end;
$$;

create trigger guard_item_resolution
  before update on public.items
  for each row execute function public.guard_item_resolution();

-- Trigger functions are not callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_claim() from public, anon, authenticated;
revoke execute on function public.handle_claim_review() from public, anon, authenticated;
revoke execute on function public.guard_item_resolution() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;

-- The claim author sees the item owner's profile name via the join.
-- Profiles contain only display names and roles, so authenticated
-- students may read them. Emails stay private in auth.users.

-- ---------- Row level security ----------
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.claims enable row level security;
alter table public.notifications enable row level security;

create policy "profiles are readable by signed-in students"
  on public.profiles for select to authenticated
  using (true);

create policy "students update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "students browse items"
  on public.items for select to authenticated
  using (true);

create policy "students create their own item reports"
  on public.items for insert to authenticated
  with check (user_id = auth.uid());

create policy "owners and admins update items"
  on public.items for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "owners and admins delete items"
  on public.items for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "claimants and admins read claims"
  on public.claims for select to authenticated
  using (claimant_id = auth.uid() or public.is_admin());

create policy "students claim found items"
  on public.claims for insert to authenticated
  with check (
    claimant_id = auth.uid()
    and exists (
      select 1 from public.items i
      where i.id = item_id
        and i.type = 'found'
        and i.status in ('open', 'in_review')
        and i.user_id <> auth.uid()
    )
  );

create policy "admins review claims"
  on public.claims for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "students read their notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "students update their notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.claims;
alter publication supabase_realtime add table public.notifications;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

create policy "item photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'item-photos');

create policy "students upload item photos to their folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "students delete their own item photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- After signing up an administrator, promote them with:
--   update public.profiles set role = 'admin' where id = (
--     select id from auth.users where email = 'admin@your.edu'
--   );
-- ============================================================
