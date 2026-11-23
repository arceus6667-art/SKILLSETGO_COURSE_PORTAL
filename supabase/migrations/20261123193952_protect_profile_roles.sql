-- Profile editing must never overwrite the owner-assigned authorization role.
create or replace function portal_private.persist_changes(s jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare r jsonb; q jsonb; answer record; n integer;
begin
 for r in select value from jsonb_array_elements(coalesce(s->'users','[]')) loop
  insert into public.profiles(id,name,email,role,country,college) values((r->>'id')::uuid,r->>'name',r->>'email',r->>'role',coalesce(r->>'country',''),coalesce(r->>'college',''))
  on conflict(id) do update set name=excluded.name,email=excluded.email,country=excluded.country,college=excluded.college;
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
