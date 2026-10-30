-- Run once in a new Supabase project's SQL Editor as postgres.
begin;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

-- No user metadata or editable email claims can confer admin privileges.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120 and name = btrim(name)),
  description text not null default '' check (char_length(description) <= 2000),
  gold numeric not null check (gold >= 0 and gold <= 999999999999.99 and gold = round(gold, 2)),
  baht numeric not null check (baht >= 0 and baht <= 999999999999.99 and baht = round(baht, 2)),
  image_path text check (image_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_item_timestamps() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = clock_timestamp();
  if TG_OP = 'UPDATE' then new.created_at = old.created_at;
  else new.created_at = new.updated_at;
  end if;
  return new;
end;
$$;
create trigger item_timestamps before insert or update on public.items
for each row execute function public.set_item_timestamps();
create index items_updated_at_idx on public.items(updated_at desc);

alter table public.items enable row level security;
revoke all on public.items from anon, authenticated;
grant select on public.items to anon, authenticated;
grant insert, update, delete on public.items to authenticated;
create policy items_public_read on public.items for select to anon, authenticated using (true);
create policy items_admin_insert on public.items for insert to authenticated with check ((select public.is_admin()));
create policy items_admin_update on public.items for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy items_admin_delete on public.items for delete to authenticated using ((select public.is_admin()));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy item_images_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'item-images' and (select public.is_admin())
  and name ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$');
create policy item_images_admin_select on storage.objects for select to authenticated
using (bucket_id = 'item-images' and (select public.is_admin()));
create policy item_images_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'item-images' and (select public.is_admin()));
-- No UPDATE/UPSERT permission: each replacement gets a fresh filename.
commit;
