-- Typed relational storage for the two-profile course portal.
-- This replaces the app_private.entities adapter for new live installations.
begin;
create schema if not exists portal_private;
revoke all on schema portal_private from public;
grant usage on schema portal_private to anon,authenticated,service_role;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 80),
 email text not null,
 role text not null default 'user' check(role in ('user','admin')),
 country text not null default '', college text not null default '',
 created_at timestamptz not null default now()
);
create table public.domains (
 id text primary key,slug text not null unique,name text not null,short_name text not null,
 description text not null,category text not null,published boolean not null default false,
 outcomes text[] not null default '{}',duration_minutes integer not null default 30 check(duration_minutes between 5 and 180)
);
create table public.learning_resources (
 id uuid primary key,domain_id text not null references public.domains(id),title text not null,
 kind text not null check(kind in ('video','pdf','reading')),url text not null,storage_path text,position integer not null default 0
);
create index resources_domain_idx on public.learning_resources(domain_id);
create table portal_private.questions (
 id text primary key,domain_id text not null references public.domains(id),topic text not null,
 prompt text not null,options text[] not null check(cardinality(options)=4),correct integer not null check(correct between 0 and 3),
 explanation text not null,difficulty text not null check(difficulty in ('easy','medium','hard')),approved boolean not null default false
);
create index questions_pool_idx on portal_private.questions(domain_id,difficulty) where approved;
create table public.enrollments (
 id uuid primary key,user_id uuid not null references public.profiles(id) on delete cascade,
 domain_id text not null references public.domains(id),method text,acknowledged_at timestamptz,policy_version text,
 unique(user_id,domain_id)
);
create index enrollments_domain_idx on public.enrollments(domain_id);
create table public.lesson_progress (
 enrollment_id uuid not null references public.enrollments(id) on delete cascade,
 resource_id uuid not null references public.learning_resources(id),primary key(enrollment_id,resource_id)
);
create index progress_resource_idx on public.lesson_progress(resource_id);
create table public.exam_attempts (
 id uuid primary key,user_id uuid not null references public.profiles(id),domain_id text not null references public.domains(id),
 started_at timestamptz not null,ends_at timestamptz not null check(ends_at>started_at),
 status text not null check(status in ('active','submitted')),monitoring text not null check(monitoring in ('standard','accommodated')),
 policy_version text not null,consent_at timestamptz not null,direct boolean not null,
 score integer check(score between 0 and 30),reason text,submitted_at timestamptz,
 check((status='active' and score is null and submitted_at is null) or (status='submitted' and score is not null and submitted_at is not null))
);
create index attempts_owner_domain_idx on public.exam_attempts(user_id,domain_id);
create index attempts_domain_idx on public.exam_attempts(domain_id);
create unique index one_active_attempt on public.exam_attempts(user_id,domain_id) where status='active';
create table portal_private.attempt_questions (
 attempt_id uuid not null references public.exam_attempts(id),question_id text not null,position integer not null,
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),primary key(attempt_id,question_id),unique(attempt_id,position)
);
create table public.exam_responses (
 attempt_id uuid not null,question_id text not null,answer integer not null check(answer between 0 and 3),
 primary key(attempt_id,question_id),foreign key(attempt_id,question_id) references portal_private.attempt_questions(attempt_id,question_id)
);
create table public.exam_violations (
 id uuid primary key,attempt_id uuid not null references public.exam_attempts(id),occurred_at timestamptz not null,
 reason text not null check(reason in ('tab-hidden','fullscreen-exit'))
);
create index violations_attempt_idx on public.exam_violations(attempt_id);
create table public.orders (
 id uuid primary key,user_id uuid not null references public.profiles(id),domain_id text not null references public.domains(id),
 product text not null check(product in ('certificate','letter','bundle')),amount integer not null check(amount in (35000,40000,50000)),
 currency text not null default 'INR' check(currency='INR'),status text not null check(status in ('created','paid','review')),
 provider_order_id text unique,payment_id text unique,created_at timestamptz not null,expires_at timestamptz not null,
 paid_at timestamptz,mode text not null check(mode in ('sandbox','live'))
);
create index orders_owner_idx on public.orders(user_id);
create index orders_domain_idx on public.orders(domain_id);
create table public.issued_documents (
 id uuid primary key,user_id uuid not null references public.profiles(id),domain_id text not null references public.domains(id),
 domain_name text not null,signature_path text,kind text not null check(kind in ('certificate','letter')),
 recipient_name text not null,score integer not null check(score between 23 and 30),issued_at timestamptz not null,
 revoked boolean not null default false,mode text not null check(mode in ('sandbox','live')),unique(user_id,domain_id,kind)
);
create index documents_domain_idx on public.issued_documents(domain_id);
create table public.support_tickets (
 id uuid primary key,user_id uuid not null references public.profiles(id),message text not null check(length(message) between 10 and 3000),
 status text not null check(status in ('open','resolved')),created_at timestamptz not null
);
create index tickets_owner_idx on public.support_tickets(user_id);
create table portal_private.audit_logs (
 id uuid primary key,actor text not null,action text not null,target text not null,occurred_at timestamptz not null,detail text
);
create index audit_time_idx on portal_private.audit_logs(occurred_at desc);
create table portal_private.payment_webhook_events(id text primary key,created_at timestamptz not null default now());
create table portal_private.settings(id text primary key,logo_path text,signature_path text);

create function portal_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
revoke all on function portal_private.is_admin() from public;
grant execute on function portal_private.is_admin() to anon,authenticated,service_role;

create function portal_private.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,name,email,role)
 values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),split_part(new.email,'@',1),'Learner'),80),coalesce(new.email,''),'user')
 on conflict(id) do nothing;
 return new;
end $$;
revoke all on function portal_private.create_profile() from public,anon,authenticated;
create trigger portal_auth_profile after insert on auth.users for each row execute function portal_private.create_profile();
insert into public.profiles(id,name,email) select id,left(coalesce(nullif(raw_user_meta_data->>'full_name',''),split_part(email,'@',1),'Learner'),80),coalesce(email,'') from auth.users on conflict(id) do nothing;

-- Only the trusted backend changes exams, payments, roles, and issuance.
-- Authenticated clients have read-only ownership policies and limited profile updates.
do $$ declare t text; begin
 foreach t in array array['profiles','domains','learning_resources','enrollments','lesson_progress','exam_attempts','exam_responses','exam_violations','orders','issued_documents','support_tickets'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
 foreach t in array array['questions','attempt_questions','audit_logs','payment_webhook_events','settings'] loop
  execute format('alter table portal_private.%I enable row level security',t);
  execute format('revoke all on portal_private.%I from anon,authenticated',t);
 end loop;
end $$;
grant select on public.domains to anon;
grant update(name,country,college) on public.profiles to authenticated;
create policy profile_read on public.profiles for select to authenticated using(id=(select auth.uid()) or (select portal_private.is_admin()));
create policy profile_edit on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy domains_read on public.domains for select to anon,authenticated using(published or (select portal_private.is_admin()));
create policy resources_read on public.learning_resources for select to authenticated using((select portal_private.is_admin()) or exists(select 1 from public.enrollments e join public.domains d on d.id=e.domain_id where e.user_id=(select auth.uid()) and e.domain_id=learning_resources.domain_id and d.published));
create policy enrollment_read on public.enrollments for select to authenticated using(user_id=(select auth.uid()) or (select portal_private.is_admin()));
create policy progress_read on public.lesson_progress for select to authenticated using((select portal_private.is_admin()) or exists(select 1 from public.enrollments e where e.id=enrollment_id and e.user_id=(select auth.uid())));
create policy attempt_read on public.exam_attempts for select to authenticated using(user_id=(select auth.uid()) or (select portal_private.is_admin()));
create policy response_read on public.exam_responses for select to authenticated using((select portal_private.is_admin()) or exists(select 1 from public.exam_attempts a where a.id=attempt_id and a.user_id=(select auth.uid())));
create policy violation_read on public.exam_violations for select to authenticated using((select portal_private.is_admin()) or exists(select 1 from public.exam_attempts a where a.id=attempt_id and a.user_id=(select auth.uid())));
create policy orders_read on public.orders for select to authenticated using(user_id=(select auth.uid()) or (select portal_private.is_admin()));
create policy documents_read on public.issued_documents for select to authenticated using(user_id=(select auth.uid()) or (select portal_private.is_admin()));
create policy tickets_read on public.support_tickets for select to authenticated using(user_id=(select auth.uid()) or (select portal_private.is_admin()));
grant all on all tables in schema portal_private to service_role;
grant all on public.profiles,public.domains,public.learning_resources,public.enrollments,public.lesson_progress,public.exam_attempts,public.exam_responses,public.exam_violations,public.orders,public.issued_documents,public.support_tickets to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('skillset-private','skillset-private',false,10485760,array['application/pdf','image/png'])
on conflict(id) do update set public=false;
create policy portal_storage_read on storage.objects for select to authenticated using(bucket_id='skillset-private' and (
 (select portal_private.is_admin()) or exists(select 1 from public.learning_resources r join public.enrollments e on e.domain_id=r.domain_id join public.domains d on d.id=r.domain_id where r.storage_path=storage.objects.name and e.user_id=(select auth.uid()) and d.published)
 or exists(select 1 from public.issued_documents d where d.user_id=(select auth.uid()) and d.signature_path=storage.objects.name and not d.revoked)
));
create policy portal_storage_upload on storage.objects for insert to authenticated with check(bucket_id='skillset-private' and (select portal_private.is_admin()));
create function portal_private.load_state() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'users',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'email',email,'role',role,'country',country,'college',college) order by id) from public.profiles),'[]'),
 'domains',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'slug',d.slug,'name',d.name,'short',d.short_name,'description',d.description,'category',d.category,'published',d.published,'outcomes',d.outcomes,'duration',d.duration_minutes,
 'resources',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',r.id,'title',r.title,'kind',r.kind,'url',r.url,'storagePath',r.storage_path)) order by r.position,r.id) from public.learning_resources r where r.domain_id=d.id),'[]')) order by d.id) from public.domains d),'[]'),
 'questions',coalesce((select jsonb_agg(jsonb_build_object('id',id,'domainId',domain_id,'topic',topic,'prompt',prompt,'options',options,'correct',correct,'explanation',explanation,'difficulty',difficulty,'approved',approved) order by id) from portal_private.questions),'[]'),
 'enrollments',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',e.id,'userId',e.user_id,'domainId',e.domain_id,'method',e.method,'acknowledgedAt',e.acknowledged_at,'policyVersion',e.policy_version,'completed',coalesce((select jsonb_agg(p.resource_id order by p.resource_id) from public.lesson_progress p where p.enrollment_id=e.id),'[]'))) order by e.id) from public.enrollments e),'[]'),
 'attempts',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',a.id,'userId',a.user_id,'domainId',a.domain_id,'startedAt',a.started_at,'endsAt',a.ends_at,'status',a.status,'monitoring',a.monitoring,'consent',jsonb_build_object('version',a.policy_version,'at',a.consent_at,'direct',a.direct),'score',a.score,'reason',a.reason,'submittedAt',a.submitted_at,
 'questions',coalesce((select jsonb_agg(q.snapshot order by q.position) from portal_private.attempt_questions q where q.attempt_id=a.id),'[]'),
 'answers',coalesce((select jsonb_object_agg(r.question_id,r.answer) from public.exam_responses r where r.attempt_id=a.id),'{}'),
 'violations',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'at',v.occurred_at,'reason',v.reason) order by v.occurred_at) from public.exam_violations v where v.attempt_id=a.id),'[]'))) order by a.started_at,a.id) from public.exam_attempts a),'[]'),
 'orders',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',id,'userId',user_id,'domainId',domain_id,'product',product,'amount',amount,'currency',currency,'status',status,'providerOrderId',provider_order_id,'paymentId',payment_id,'createdAt',created_at,'expiresAt',expires_at,'paidAt',paid_at,'mode',mode)) order by created_at,id) from public.orders),'[]'),
 'credentials',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',id,'userId',user_id,'domainId',domain_id,'domainName',domain_name,'signaturePath',signature_path,'kind',kind,'name',recipient_name,'score',score,'issuedAt',issued_at,'revoked',revoked,'mode',mode)) order by issued_at,id) from public.issued_documents),'[]'),
 'audit',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',id,'actor',actor,'action',action,'target',target,'at',occurred_at,'detail',detail)) order by occurred_at,id) from portal_private.audit_logs),'[]'),
 'tickets',coalesce((select jsonb_agg(jsonb_build_object('id',id,'userId',user_id,'message',message,'status',status,'at',created_at) order by created_at,id) from public.support_tickets),'[]'),
 'webhooks',coalesce((select jsonb_agg(id order by id) from portal_private.payment_webhook_events),'[]'),
 'settings',coalesce((select jsonb_strip_nulls(jsonb_build_object('logoPath',logo_path,'signaturePath',signature_path)) from portal_private.settings where id='brand'),'{}')
 );
$$;
revoke all on function portal_private.load_state() from public,anon,authenticated;
grant execute on function portal_private.load_state() to service_role;

create function portal_private.persist_changes(s jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare r jsonb; q jsonb; answer record; n integer;
begin
 for r in select value from jsonb_array_elements(coalesce(s->'users','[]')) loop
  insert into public.profiles(id,name,email,role,country,college) values((r->>'id')::uuid,r->>'name',r->>'email',r->>'role',coalesce(r->>'country',''),coalesce(r->>'college',''))
  on conflict(id) do update set name=excluded.name,email=excluded.email,role=excluded.role,country=excluded.country,college=excluded.college;
 end loop;
 for r in select value from jsonb_array_elements(coalesce(s->'domains','[]')) loop
  insert into public.domains(id,slug,name,short_name,description,category,published,outcomes,duration_minutes)
  values(r->>'id',r->>'slug',r->>'name',r->>'short',r->>'description',r->>'category',(r->>'published')::boolean,array(select jsonb_array_elements_text(r->'outcomes')),(r->>'duration')::integer)
  on conflict(id) do update set slug=excluded.slug,name=excluded.name,short_name=excluded.short_name,description=excluded.description,category=excluded.category,published=excluded.published,outcomes=excluded.outcomes,duration_minutes=excluded.duration_minutes;
  n=0;
  for q in select value from jsonb_array_elements(coalesce(r->'resources','[]')) loop
   insert into public.learning_resources(id,domain_id,title,kind,url,storage_path,position) values((q->>'id')::uuid,r->>'id',q->>'title',q->>'kind',q->>'url',q->>'storagePath',n)
   on conflict(id) do update set title=excluded.title,kind=excluded.kind,url=excluded.url,storage_path=excluded.storage_path,position=excluded.position;
   n=n+1;
  end loop;
 end loop;
 for r in select value from jsonb_array_elements(coalesce(s->'questions','[]')) loop
  insert into portal_private.questions(id,domain_id,topic,prompt,options,correct,explanation,difficulty,approved) values(r->>'id',r->>'domainId',r->>'topic',r->>'prompt',array(select jsonb_array_elements_text(r->'options')),(r->>'correct')::integer,r->>'explanation',r->>'difficulty',(r->>'approved')::boolean)
  on conflict(id) do update set topic=excluded.topic,prompt=excluded.prompt,options=excluded.options,correct=excluded.correct,explanation=excluded.explanation,difficulty=excluded.difficulty,approved=excluded.approved;
 end loop;
 for r in select value from jsonb_array_elements(coalesce(s->'enrollments','[]')) loop
  insert into public.enrollments(id,user_id,domain_id,method,acknowledged_at,policy_version) values((r->>'id')::uuid,(r->>'userId')::uuid,r->>'domainId',r->>'method',(r->>'acknowledgedAt')::timestamptz,r->>'policyVersion')
  on conflict(id) do update set method=excluded.method,acknowledged_at=excluded.acknowledged_at,policy_version=excluded.policy_version;
  for q in select value from jsonb_array_elements(coalesce(r->'completed','[]')) loop
   insert into public.lesson_progress(enrollment_id,resource_id) values((r->>'id')::uuid,(q#>>'{}')::uuid) on conflict do nothing;
  end loop;
 end loop;
 for r in select value from jsonb_array_elements(coalesce(s->'attempts','[]')) loop
  insert into public.exam_attempts(id,user_id,domain_id,started_at,ends_at,status,monitoring,policy_version,consent_at,direct,score,reason,submitted_at)
  values((r->>'id')::uuid,(r->>'userId')::uuid,r->>'domainId',(r->>'startedAt')::timestamptz,(r->>'endsAt')::timestamptz,r->>'status',r->>'monitoring',r->'consent'->>'version',(r->'consent'->>'at')::timestamptz,(r->'consent'->>'direct')::boolean,(r->>'score')::integer,r->>'reason',(r->>'submittedAt')::timestamptz)
  on conflict(id) do update set status=excluded.status,score=excluded.score,reason=excluded.reason,submitted_at=excluded.submitted_at;
  n=0;
  for q in select value from jsonb_array_elements(coalesce(r->'questions','[]')) loop
   insert into portal_private.attempt_questions(attempt_id,question_id,position,snapshot) values((r->>'id')::uuid,q->>'id',n,q) on conflict do nothing;
   n=n+1;
  end loop;
  delete from public.exam_responses where attempt_id=(r->>'id')::uuid;
  for answer in select key,value from jsonb_each(coalesce(r->'answers','{}')) loop
   insert into public.exam_responses(attempt_id,question_id,answer) values((r->>'id')::uuid,answer.key,(answer.value#>>'{}')::integer);
  end loop;
  for q in select value from jsonb_array_elements(coalesce(r->'violations','[]')) loop
   insert into public.exam_violations(id,attempt_id,occurred_at,reason) values((q->>'id')::uuid,(r->>'id')::uuid,(q->>'at')::timestamptz,q->>'reason') on conflict do nothing;
  end loop;
 end loop;
 for r in select value from jsonb_array_elements(coalesce(s->'orders','[]')) loop
  insert into public.orders(id,user_id,domain_id,product,amount,currency,status,provider_order_id,payment_id,created_at,expires_at,paid_at,mode)
  values((r->>'id')::uuid,(r->>'userId')::uuid,r->>'domainId',r->>'product',(r->>'amount')::integer,r->>'currency',r->>'status',r->>'providerOrderId',r->>'paymentId',(r->>'createdAt')::timestamptz,(r->>'expiresAt')::timestamptz,(r->>'paidAt')::timestamptz,r->>'mode')
  on conflict(id) do update set status=excluded.status,provider_order_id=excluded.provider_order_id,payment_id=excluded.payment_id,paid_at=excluded.paid_at;
 end loop;
 for r in select value from jsonb_array_elements(coalesce(s->'credentials','[]')) loop
  insert into public.issued_documents(id,user_id,domain_id,domain_name,signature_path,kind,recipient_name,score,issued_at,revoked,mode)
  values((r->>'id')::uuid,(r->>'userId')::uuid,r->>'domainId',r->>'domainName',r->>'signaturePath',r->>'kind',r->>'name',(r->>'score')::integer,(r->>'issuedAt')::timestamptz,(r->>'revoked')::boolean,r->>'mode')
  on conflict(id) do update set revoked=excluded.revoked;
 end loop;
 for r in select value from jsonb_array_elements(coalesce(s->'tickets','[]')) loop
  insert into public.support_tickets(id,user_id,message,status,created_at) values((r->>'id')::uuid,(r->>'userId')::uuid,r->>'message',r->>'status',(r->>'at')::timestamptz)
  on conflict(id) do update set status=excluded.status;
 end loop;
 for r in select value from jsonb_array_elements(coalesce(s->'audit','[]')) loop
  insert into portal_private.audit_logs(id,actor,action,target,occurred_at,detail) values((r->>'id')::uuid,r->>'actor',r->>'action',r->>'target',(r->>'at')::timestamptz,r->>'detail') on conflict do nothing;
 end loop;
 for r in select value from jsonb_array_elements(coalesce(s->'webhooks','[]')) loop
  insert into portal_private.payment_webhook_events(id) values(r#>>'{}') on conflict do nothing;
 end loop;
 if s?'settings' then insert into portal_private.settings(id,logo_path,signature_path) values('brand',s->'settings'->>'logoPath',s->'settings'->>'signaturePath') on conflict(id) do update set logo_path=excluded.logo_path,signature_path=excluded.signature_path; end if;
end $$;
revoke all on function portal_private.persist_changes(jsonb) from public,anon,authenticated;
grant execute on function portal_private.persist_changes(jsonb) to service_role;
commit;
