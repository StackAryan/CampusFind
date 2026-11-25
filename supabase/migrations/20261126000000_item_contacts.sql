-- ============================================================
-- CampusFind — private contact details for lost/found reports
--
-- Every new lost or found report must include a phone number or
-- Instagram handle so an administrator can connect the finder and
-- the owner once a claim is verified.
--
-- Contacts live in a separate table so they are never exposed in
-- public item reads or Supabase Realtime item payloads.
-- ============================================================

create table public.item_contacts (
  item_id uuid primary key references public.items (id) on delete cascade,
  contact_method text not null,
  contact_value text not null,
  created_at timestamptz not null default now(),
  constraint item_contacts_method_chk
    check (contact_method in ('phone', 'instagram')),
  constraint item_contacts_value_chk
    check (
      (
        contact_method = 'phone'
        and char_length(regexp_replace(contact_value, '\D', '', 'g')) between 7 and 15
      )
      or (
        contact_method = 'instagram'
        and char_length(btrim(contact_value)) between 1 and 30
      )
    )
);

alter table public.item_contacts enable row level security;

create policy "owners and admins read item contacts"
  on public.item_contacts for select to authenticated
  using (
    exists (
      select 1
      from public.items i
      where i.id = item_id
        and (i.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "owners add contact to their own report"
  on public.item_contacts for insert to authenticated
  with check (
    exists (
      select 1
      from public.items i
      where i.id = item_id
        and i.user_id = auth.uid()
    )
  );

revoke all on public.item_contacts from anon;
grant select, insert on public.item_contacts to authenticated;
grant all privileges on public.item_contacts to service_role;

-- Atomic report creation: insert the item and its private contact
-- in one transaction. Runs as the caller so RLS and constraints apply.
create or replace function public.create_item(
  p_type text,
  p_title text,
  p_description text,
  p_category text,
  p_location text,
  p_event_date date,
  p_image_url text default null,
  p_contact_method text default null,
  p_contact_value text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item_id uuid;
  v_contact_value text := btrim(coalesce(p_contact_value, ''));
begin
  if auth.uid() is null then
    raise exception 'Please sign in to continue.';
  end if;

  if p_contact_method is null
     or p_contact_method not in ('phone', 'instagram')
     or v_contact_value = '' then
    raise exception 'A phone number or Instagram handle is required so an admin can connect both parties.';
  end if;

  insert into public.items (
    user_id, type, title, description, category, location, event_date, image_url
  ) values (
    auth.uid(),
    p_type,
    btrim(p_title),
    btrim(p_description),
    p_category,
    p_location,
    p_event_date,
    p_image_url
  )
  returning id into v_item_id;

  insert into public.item_contacts (item_id, contact_method, contact_value)
  values (v_item_id, p_contact_method, v_contact_value);

  return v_item_id;
end;
$$;

revoke all on function public.create_item(text, text, text, text, text, date, text, text, text) from public, anon;
grant execute on function public.create_item(text, text, text, text, text, date, text, text, text) to authenticated;

-- Guarantee that every new report has contact details even if an API
-- client bypasses the create_item RPC. The check is deferred so the RPC
-- can insert the contact immediately after the item.
create or replace function public.ensure_item_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.item_contacts where item_id = new.id
  ) then
    raise exception 'A phone number or Instagram handle is required for every report.';
  end if;
  return new;
end;
$$;

revoke all on function public.ensure_item_contact() from public, anon, authenticated;

create constraint trigger items_require_contact
after insert on public.items
deferrable initially deferred
for each row execute function public.ensure_item_contact();
