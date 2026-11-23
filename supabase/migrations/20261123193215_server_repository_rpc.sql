begin;
create table portal_private.repository_version(id integer primary key check(id=1),version bigint not null default 0);
insert into portal_private.repository_version(id) values(1);
alter table portal_private.repository_version enable row level security;
revoke all on portal_private.repository_version from public,anon,authenticated;
grant all on portal_private.repository_version to service_role;

-- Only a server secret key may call these functions. No PUBLIC defaults remain.
create function public.portal_read_state() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('version',version,'state',portal_private.load_state()) from portal_private.repository_version where id=1;
$$;
revoke all on function public.portal_read_state() from public,anon,authenticated;
grant execute on function public.portal_read_state() to service_role;

create function public.portal_write_changes(expected_version bigint,changes jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare current_version bigint;
begin
 perform pg_advisory_xact_lock(72418031);
 select version into current_version from portal_private.repository_version where id=1 for update;
 if expected_version is distinct from current_version then
  raise exception 'PORTAL_CONCURRENT_UPDATE' using errcode='40001';
 end if;
 perform portal_private.persist_changes(changes);
 update portal_private.repository_version set version=version+1 where id=1;
end $$;
revoke all on function public.portal_write_changes(bigint,jsonb) from public,anon,authenticated;
grant execute on function public.portal_write_changes(bigint,jsonb) to service_role;
commit;
