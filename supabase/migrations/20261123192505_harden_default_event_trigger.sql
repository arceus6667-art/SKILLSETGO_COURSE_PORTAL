-- Supabase's default DDL event trigger is not an API endpoint.
-- Retain the trigger while removing direct API-role execution rights.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
 end if;
end $$;
