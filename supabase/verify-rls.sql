-- Run AFTER schema.sql and adding your owner to admin_users.
-- This creates temporary test rows inside a transaction and ALWAYS rolls them back.
-- Expected: NOTICE messages, followed by ROLLBACK. Any failed assertion raises an error.
begin;

do $$ begin
  if not exists(select 1 from public.admin_users) then
    raise exception 'Add your owner UUID to admin_users before running this test';
  end if;
end $$;

-- Only transaction-local settings; no real user is changed.
select set_config('test.owner_id', (select user_id::text from public.admin_users limit 1), true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
set local role anon;
do $$ begin
  perform count(*) from public.items;
  if public.is_admin() then raise exception 'Anonymous unexpectedly admin'; end if;
  begin
    insert into public.items(name, gold, baht) values ('RLS visitor test', 1, 1);
    raise exception 'Anonymous INSERT unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: anonymous can read but cannot insert';
end $$;
reset role;

set local role authenticated;
do $$ begin
  if public.is_admin() then raise exception 'Non-owner unexpectedly admin'; end if;
  begin
    insert into public.items(name, gold, baht) values ('RLS non-owner test', 1, 1);
    raise exception 'Non-owner INSERT unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.admin_users(user_id) values ('00000000-0000-0000-0000-000000000001');
    raise exception 'Non-owner could self-promote';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: signed-in non-owner cannot insert or self-promote';
end $$;
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.owner_id'), true);
set local role authenticated;
do $$ declare test_id uuid; begin
  if not public.is_admin() then raise exception 'Owner not recognized'; end if;
  insert into public.items(name, gold, baht) values ('RLS owner test', 123, 45) returning id into test_id;
  update public.items set gold = 456 where id = test_id;
  if not exists(select 1 from public.items where id = test_id and gold = 456) then
    raise exception 'Owner UPDATE did not persist';
  end if;
  perform set_config('test.row_id', test_id::text, true);
  raise notice 'PASS: owner can insert and update';
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ declare affected integer; begin
  update public.items set gold = 999 where id = current_setting('test.row_id')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Non-owner could update'; end if;
  delete from public.items where id = current_setting('test.row_id')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Non-owner could delete'; end if;
  begin
    insert into storage.objects(bucket_id, name) values ('item-images', '00000000-0000-0000-0000-000000000001.png');
    raise exception 'Non-owner could upload image metadata';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: non-owner cannot update, delete, or upload';
end $$;
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.owner_id'), true);
set local role authenticated;
do $$ declare affected integer; begin
  delete from public.items where id = current_setting('test.row_id')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner could not delete'; end if;
  raise notice 'PASS: owner can delete';
end $$;
reset role;
rollback;
