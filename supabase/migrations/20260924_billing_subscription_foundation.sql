-- Billing is a server-owned mirror. Product authorization remains in
-- zero_limit_entitlements. This migration performs no remote provider calls.
revoke create on schema public from public;

do $$ begin
  if pg_catalog.to_regclass('public.profiles') is null or pg_catalog.to_regclass('public.organizations') is null
    or pg_catalog.to_regclass('public.spaces') is null or pg_catalog.to_regclass('public.zero_limit_entitlements') is null
    or pg_catalog.to_regclass('public.audit_logs') is null then
    raise exception using errcode='42P01',message='billing prerequisites are missing';
  end if;
end $$;

create table if not exists public.billing_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  provider text not null,
  provider_customer_id text not null,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  constraint billing_accounts_exactly_one_owner check(num_nonnulls(profile_id,organization_id)=1),
  constraint billing_accounts_provider_check check(provider ~ '^[a-z][a-z0-9_]{1,31}$'),
  constraint billing_accounts_customer_check check(char_length(provider_customer_id) between 1 and 255),
  unique(provider,provider_customer_id)
);

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references public.billing_accounts(id) on delete restrict,
  provider text not null,
  provider_subscription_id text not null,
  plan_key text not null,
  entitlement_key text not null,
  target_space_id uuid references public.spaces(id) on delete restrict,
  target_kind text not null,
  personal_profession text,
  status text not null,
  quantity integer not null default 1,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  provider_updated_at timestamptz not null,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  constraint billing_subscriptions_provider_check check(provider ~ '^[a-z][a-z0-9_]{1,31}$'),
  constraint billing_subscriptions_plan_check check(plan_key ~ '^[a-z][a-z0-9_]{1,79}$'),
  constraint billing_subscriptions_entitlement_check check(entitlement_key in ('personal_access','creator_access','team_access')),
  constraint billing_subscriptions_target_check check(
    (target_kind='personal' and personal_profession in ('coach','manager_agent','ceo','community_manager'))
    or (target_kind in ('creator','team') and personal_profession is null)
  ),
  constraint billing_subscriptions_status_check check(status in ('incomplete','trialing','active','past_due','unpaid','canceled','paused')),
  constraint billing_subscriptions_quantity_check check(quantity between 1 and 100000),
  constraint billing_subscriptions_period_check check(current_period_end is null or current_period_start is null or current_period_end>current_period_start),
  unique(provider,provider_subscription_id)
);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  object_id text,
  payload_hash text not null,
  status text not null default 'processing',
  received_at timestamptz not null default timezone('utc',now()),
  processing_started_at timestamptz,
  provider_created_at timestamptz not null,
  processed_at timestamptz,
  attempt_count integer not null default 1,
  error_code text,
  constraint billing_webhook_events_status_check check(status in ('processing','processed','ignored','failed')),
  constraint billing_webhook_events_hash_check check(payload_hash ~ '^[a-f0-9]{64}$'),
  constraint billing_webhook_events_attempt_check check(attempt_count>0),
  unique(provider,provider_event_id)
);

-- Fail closed when a same-named partial object has incompatible columns. A
-- fully compatible prior/partial creation is accepted and repaired below.
do $$
declare missing text;
begin
  select string_agg(v.name,', ' order by v.name) into missing from (values
    ('billing_accounts','id','uuid',true),('billing_accounts','profile_id','uuid',false),('billing_accounts','organization_id','uuid',false),
    ('billing_accounts','provider','text',true),('billing_accounts','provider_customer_id','text',true),
    ('billing_subscriptions','id','uuid',true),('billing_subscriptions','billing_account_id','uuid',true),('billing_subscriptions','provider','text',true),
    ('billing_subscriptions','provider_subscription_id','text',true),('billing_subscriptions','plan_key','text',true),('billing_subscriptions','entitlement_key','text',true),
    ('billing_subscriptions','target_space_id','uuid',false),('billing_subscriptions','target_kind','text',true),('billing_subscriptions','personal_profession','text',false),
    ('billing_subscriptions','status','text',true),('billing_subscriptions','quantity','integer',true),('billing_subscriptions','provider_updated_at','timestamp with time zone',true),
    ('billing_webhook_events','id','uuid',true),('billing_webhook_events','provider','text',true),('billing_webhook_events','provider_event_id','text',true),
    ('billing_webhook_events','status','text',true),('billing_webhook_events','processing_started_at','timestamp with time zone',false),
    ('billing_webhook_events','attempt_count','integer',true),('billing_webhook_events','error_code','text',false)
  ) v(tbl,name,typ,required)
  left join information_schema.columns c on c.table_schema='public' and c.table_name=v.tbl and c.column_name=v.name
    and c.data_type=v.typ and (not v.required or c.is_nullable='NO')
  where c.column_name is null;
  if missing is not null then raise exception using errcode='42804',message='incompatible billing columns: '||missing; end if;
end $$;

-- Compare canonical pg_get_constraintdef output directly. Normalization removes
-- only presentation details (whitespace, quotes, parentheses, public schema and
-- explicit text casts); it does not create helper objects or alter semantics.
do $$
declare item record; actual text; actual_norm text; actual_type "char"; actual_valid boolean;
begin
  for item in select * from (values
    ('billing_accounts','billing_accounts_exactly_one_owner','checknum_nonnullsprofile_id,organization_id=1','alter table public.billing_accounts add constraint billing_accounts_exactly_one_owner check(num_nonnulls(profile_id,organization_id)=1)'),
    ('billing_accounts','billing_accounts_provider_check','checkprovider~^[a-z][a-z0-9_]{1,31}$','alter table public.billing_accounts add constraint billing_accounts_provider_check check(provider ~ ''^[a-z][a-z0-9_]{1,31}$'')'),
    ('billing_accounts','billing_accounts_customer_check','checkchar_lengthprovider_customer_id>=1andchar_lengthprovider_customer_id<=255','alter table public.billing_accounts add constraint billing_accounts_customer_check check(char_length(provider_customer_id) between 1 and 255)'),
    ('billing_accounts','billing_accounts_profile_id_fkey','foreignkeyprofile_idreferencesprofilesidondeleterestrict','alter table public.billing_accounts add constraint billing_accounts_profile_id_fkey foreign key(profile_id) references public.profiles(id) on delete restrict'),
    ('billing_accounts','billing_accounts_organization_id_fkey','foreignkeyorganization_idreferencesorganizationsidondeleterestrict','alter table public.billing_accounts add constraint billing_accounts_organization_id_fkey foreign key(organization_id) references public.organizations(id) on delete restrict'),
    ('billing_accounts','billing_accounts_provider_provider_customer_id_key','uniqueprovider,provider_customer_id','alter table public.billing_accounts add constraint billing_accounts_provider_provider_customer_id_key unique(provider,provider_customer_id)'),
    ('billing_subscriptions','billing_subscriptions_billing_account_id_fkey','foreignkeybilling_account_idreferencesbilling_accountsidondeleterestrict','alter table public.billing_subscriptions add constraint billing_subscriptions_billing_account_id_fkey foreign key(billing_account_id) references public.billing_accounts(id) on delete restrict'),
    ('billing_subscriptions','billing_subscriptions_target_space_id_fkey','foreignkeytarget_space_idreferencesspacesidondeleterestrict','alter table public.billing_subscriptions add constraint billing_subscriptions_target_space_id_fkey foreign key(target_space_id) references public.spaces(id) on delete restrict'),
    ('billing_subscriptions','billing_subscriptions_provider_check','checkprovider~^[a-z][a-z0-9_]{1,31}$','alter table public.billing_subscriptions add constraint billing_subscriptions_provider_check check(provider ~ ''^[a-z][a-z0-9_]{1,31}$'')'),
    ('billing_subscriptions','billing_subscriptions_plan_check','checkplan_key~^[a-z][a-z0-9_]{1,79}$','alter table public.billing_subscriptions add constraint billing_subscriptions_plan_check check(plan_key ~ ''^[a-z][a-z0-9_]{1,79}$'')'),
    ('billing_subscriptions','billing_subscriptions_entitlement_check','checkentitlement_key=anyarray[personal_access,creator_access,team_access]','alter table public.billing_subscriptions add constraint billing_subscriptions_entitlement_check check(entitlement_key in (''personal_access'',''creator_access'',''team_access''))'),
    ('billing_subscriptions','billing_subscriptions_target_check','checktarget_kind=personalandpersonal_profession=anyarray[coach,manager_agent,ceo,community_manager]ortarget_kind=anyarray[creator,team]andpersonal_professionisnull','alter table public.billing_subscriptions add constraint billing_subscriptions_target_check check((target_kind=''personal'' and personal_profession in (''coach'',''manager_agent'',''ceo'',''community_manager'')) or (target_kind in (''creator'',''team'') and personal_profession is null))'),
    ('billing_subscriptions','billing_subscriptions_status_check','checkstatus=anyarray[incomplete,trialing,active,past_due,unpaid,canceled,paused]','alter table public.billing_subscriptions add constraint billing_subscriptions_status_check check(status in (''incomplete'',''trialing'',''active'',''past_due'',''unpaid'',''canceled'',''paused''))'),
    ('billing_subscriptions','billing_subscriptions_quantity_check','checkquantity>=1andquantity<=100000','alter table public.billing_subscriptions add constraint billing_subscriptions_quantity_check check(quantity between 1 and 100000)'),
    ('billing_subscriptions','billing_subscriptions_period_check','checkcurrent_period_endisnullorcurrent_period_startisnullorcurrent_period_end>current_period_start','alter table public.billing_subscriptions add constraint billing_subscriptions_period_check check(current_period_end is null or current_period_start is null or current_period_end>current_period_start)'),
    ('billing_subscriptions','billing_subscriptions_provider_provider_subscription_id_key','uniqueprovider,provider_subscription_id','alter table public.billing_subscriptions add constraint billing_subscriptions_provider_provider_subscription_id_key unique(provider,provider_subscription_id)'),
    ('billing_webhook_events','billing_webhook_events_status_check','checkstatus=anyarray[processing,processed,ignored,failed]','alter table public.billing_webhook_events add constraint billing_webhook_events_status_check check(status in (''processing'',''processed'',''ignored'',''failed''))'),
    ('billing_webhook_events','billing_webhook_events_hash_check','checkpayload_hash~^[a-f0-9]{64}$','alter table public.billing_webhook_events add constraint billing_webhook_events_hash_check check(payload_hash ~ ''^[a-f0-9]{64}$'')'),
    ('billing_webhook_events','billing_webhook_events_attempt_check','checkattempt_count>0','alter table public.billing_webhook_events add constraint billing_webhook_events_attempt_check check(attempt_count>0)'),
    ('billing_webhook_events','billing_webhook_events_provider_provider_event_id_key','uniqueprovider,provider_event_id','alter table public.billing_webhook_events add constraint billing_webhook_events_provider_provider_event_id_key unique(provider,provider_event_id)')
  ) x(tbl,name,expected_norm,add_sql) loop
    select pg_get_constraintdef(oid),contype,convalidated into actual,actual_type,actual_valid from pg_constraint where conrelid=('public.'||item.tbl)::regclass and conname=item.name;
    actual_norm:=regexp_replace(replace(replace(replace(lower(coalesce(actual,'')),'public.',''),'::text[]',''),'::text',''),'[[:space:]()'']','','g');
    if actual is null then execute item.add_sql;
    elsif actual_norm<>item.expected_norm then raise exception using errcode='42804',message='incompatible billing constraint: '||item.name;
    elsif actual_type in ('c','f') and not actual_valid then execute format('alter table public.%I validate constraint %I',item.tbl,item.name); end if;
  end loop;
end $$;

-- Index names are also fail-closed: IF NOT EXISTS is never allowed to conceal
-- an invalid, non-index, or differently defined object.
do $$
declare item record; relation_kind "char"; valid boolean; actual text;
begin
  for item in select * from (values
    ('billing_accounts_profile_provider_unique','CREATE UNIQUE INDEX billing_accounts_profile_provider_unique ON public.billing_accounts USING btree (profile_id, provider) WHERE (profile_id IS NOT NULL)','create unique index billing_accounts_profile_provider_unique on public.billing_accounts(profile_id,provider) where profile_id is not null'),
    ('billing_accounts_organization_provider_unique','CREATE UNIQUE INDEX billing_accounts_organization_provider_unique ON public.billing_accounts USING btree (organization_id, provider) WHERE (organization_id IS NOT NULL)','create unique index billing_accounts_organization_provider_unique on public.billing_accounts(organization_id,provider) where organization_id is not null'),
    ('billing_subscriptions_account_idx','CREATE INDEX billing_subscriptions_account_idx ON public.billing_subscriptions USING btree (billing_account_id)','create index billing_subscriptions_account_idx on public.billing_subscriptions(billing_account_id)'),
    ('billing_subscriptions_space_idx','CREATE INDEX billing_subscriptions_space_idx ON public.billing_subscriptions USING btree (target_space_id) WHERE (target_space_id IS NOT NULL)','create index billing_subscriptions_space_idx on public.billing_subscriptions(target_space_id) where target_space_id is not null'),
    ('billing_webhook_events_failures_idx','CREATE INDEX billing_webhook_events_failures_idx ON public.billing_webhook_events USING btree (received_at DESC) WHERE (status = ''failed''::text)','create index billing_webhook_events_failures_idx on public.billing_webhook_events(received_at desc) where status=''failed''')
  ) x(name,expected,create_sql) loop
    select c.relkind,i.indisvalid,pg_get_indexdef(c.oid) into relation_kind,valid,actual from pg_class c left join pg_index i on i.indexrelid=c.oid where c.oid=to_regclass('public.'||item.name);
    if relation_kind is null then execute item.create_sql;
    elsif relation_kind not in ('i','I') or not coalesce(valid,false) or actual<>item.expected then raise exception using errcode='42804',message='incompatible billing index: '||item.name; end if;
  end loop;
end $$;

alter table public.zero_limit_entitlements add column if not exists billing_subscription_id uuid;
do $$
declare actual text; actual_norm text; actual_type "char"; actual_valid boolean;
begin
  select pg_get_constraintdef(oid),contype,convalidated into actual,actual_type,actual_valid from pg_constraint where conrelid='public.zero_limit_entitlements'::regclass and conname='zero_limit_entitlements_billing_subscription_id_fkey';
  actual_norm:=regexp_replace(replace(replace(replace(lower(coalesce(actual,'')),'public.',''),'::text[]',''),'::text',''),'[[:space:]()'']','','g');
  if actual is null then
    alter table public.zero_limit_entitlements add constraint zero_limit_entitlements_billing_subscription_id_fkey foreign key(billing_subscription_id) references public.billing_subscriptions(id) on delete restrict;
  elsif actual_norm<>'foreignkeybilling_subscription_idreferencesbilling_subscriptionsidondeleterestrict' then
    raise exception using errcode='42804',message='incompatible billing constraint: zero_limit_entitlements_billing_subscription_id_fkey';
  elsif actual_type='f' and not actual_valid then
    alter table public.zero_limit_entitlements validate constraint zero_limit_entitlements_billing_subscription_id_fkey;
  end if;

  select pg_get_constraintdef(oid),contype,convalidated into actual,actual_type,actual_valid from pg_constraint where conrelid='public.zero_limit_entitlements'::regclass and conname='zero_limit_entitlements_billing_origin_check';
  actual_norm:=regexp_replace(replace(replace(replace(lower(coalesce(actual,'')),'public.',''),'::text[]',''),'::text',''),'[[:space:]()'']','','g');
  if actual is null then
    alter table public.zero_limit_entitlements add constraint zero_limit_entitlements_billing_origin_check check(billing_subscription_id is null or source='subscription') not valid;
  elsif actual_norm<>'checkbilling_subscription_idisnullorsource=subscription' then
    raise exception using errcode='42804',message='incompatible billing constraint: zero_limit_entitlements_billing_origin_check';
  end if;
  alter table public.zero_limit_entitlements validate constraint zero_limit_entitlements_billing_origin_check;
end $$;

-- Inspect legacy index semantics before replacing them. Never silently drop an
-- unknown same-named index.
do $$
declare item record; actual text;
begin
  for item in select * from (values
    ('zero_limit_entitlements_profile_key_unique','CREATE UNIQUE INDEX zero_limit_entitlements_profile_key_unique ON public.zero_limit_entitlements USING btree (profile_id, key) WHERE (profile_id IS NOT NULL)'),
    ('zero_limit_entitlements_space_key_unique','CREATE UNIQUE INDEX zero_limit_entitlements_space_key_unique ON public.zero_limit_entitlements USING btree (space_id, key) WHERE (space_id IS NOT NULL)'),
    ('zero_limit_entitlements_organization_key_unique','CREATE UNIQUE INDEX zero_limit_entitlements_organization_key_unique ON public.zero_limit_entitlements USING btree (organization_id, key) WHERE (organization_id IS NOT NULL)')
  ) x(name,expected) loop
    if to_regclass('public.'||item.name) is not null then
      select pg_get_indexdef(to_regclass('public.'||item.name)) into actual;
      if actual<>item.expected then raise exception using errcode='42804',message='incompatible legacy index: '||item.name; end if;
      execute format('drop index public.%I',item.name);
    end if;
  end loop;
end $$;
do $$
declare item record; relation_kind "char"; valid boolean; actual text;
begin
  for item in select * from (values
    ('zero_limit_entitlements_profile_key_nonbilling_unique','CREATE UNIQUE INDEX zero_limit_entitlements_profile_key_nonbilling_unique ON public.zero_limit_entitlements USING btree (profile_id, key) WHERE ((profile_id IS NOT NULL) AND (billing_subscription_id IS NULL))','create unique index zero_limit_entitlements_profile_key_nonbilling_unique on public.zero_limit_entitlements(profile_id,key) where profile_id is not null and billing_subscription_id is null'),
    ('zero_limit_entitlements_space_key_nonbilling_unique','CREATE UNIQUE INDEX zero_limit_entitlements_space_key_nonbilling_unique ON public.zero_limit_entitlements USING btree (space_id, key) WHERE ((space_id IS NOT NULL) AND (billing_subscription_id IS NULL))','create unique index zero_limit_entitlements_space_key_nonbilling_unique on public.zero_limit_entitlements(space_id,key) where space_id is not null and billing_subscription_id is null'),
    ('zero_limit_entitlements_organization_key_nonbilling_unique','CREATE UNIQUE INDEX zero_limit_entitlements_organization_key_nonbilling_unique ON public.zero_limit_entitlements USING btree (organization_id, key) WHERE ((organization_id IS NOT NULL) AND (billing_subscription_id IS NULL))','create unique index zero_limit_entitlements_organization_key_nonbilling_unique on public.zero_limit_entitlements(organization_id,key) where organization_id is not null and billing_subscription_id is null'),
    ('zero_limit_entitlements_subscription_key_unique','CREATE UNIQUE INDEX zero_limit_entitlements_subscription_key_unique ON public.zero_limit_entitlements USING btree (billing_subscription_id, key) WHERE (billing_subscription_id IS NOT NULL)','create unique index zero_limit_entitlements_subscription_key_unique on public.zero_limit_entitlements(billing_subscription_id,key) where billing_subscription_id is not null')
  ) x(name,expected,create_sql) loop
    select c.relkind,i.indisvalid,pg_get_indexdef(c.oid) into relation_kind,valid,actual from pg_class c left join pg_index i on i.indexrelid=c.oid where c.oid=to_regclass('public.'||item.name);
    if relation_kind is null then execute item.create_sql;
    elsif relation_kind not in ('i','I') or not coalesce(valid,false) or actual<>item.expected then raise exception using errcode='42804',message='incompatible entitlement index: '||item.name; end if;
  end loop;
end $$;

drop trigger if exists set_billing_accounts_updated_at on public.billing_accounts;
create trigger set_billing_accounts_updated_at before update on public.billing_accounts for each row execute function public.set_updated_at();
drop trigger if exists set_billing_subscriptions_updated_at on public.billing_subscriptions;
create trigger set_billing_subscriptions_updated_at before update on public.billing_subscriptions for each row execute function public.set_updated_at();

alter table public.billing_accounts enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;
revoke all on public.billing_accounts,public.billing_subscriptions,public.billing_webhook_events from public,anon,authenticated;
grant all on public.billing_accounts,public.billing_subscriptions,public.billing_webhook_events to service_role;

create or replace function public.ensure_billing_subscription_space(subscription_value uuid)
returns uuid language plpgsql volatile security definer set search_path=pg_catalog,public as $$
declare sub public.billing_subscriptions%rowtype; account public.billing_accounts%rowtype; target public.spaces%rowtype; result uuid;
begin
  if auth.role()<>'service_role' then raise exception using errcode='42501',message='backend_only'; end if;
  select * into sub from public.billing_subscriptions where id=subscription_value for update;
  if not found then raise exception using errcode='P0002',message='subscription_not_found'; end if;
  select * into account from public.billing_accounts where id=sub.billing_account_id for share;
  if sub.target_space_id is not null then
    select * into target from public.spaces where id=sub.target_space_id for share;
    if target.id is null or target.kind<>sub.target_kind
      or (target.kind='personal' and (target.owner_profile_id<>account.profile_id or target.personal_profession<>sub.personal_profession))
      or (target.kind='creator' and target.owner_profile_id<>account.profile_id)
      or (target.kind='team' and target.organization_id<>account.organization_id) then
      raise exception using errcode='22023',message='billing_scope_mismatch';
    end if;
    return target.id;
  end if;
  if sub.target_kind='personal' and account.profile_id is not null then
    insert into public.spaces(kind,name,owner_profile_id,personal_profession) values('personal','Espace '||replace(initcap(sub.personal_profession),'_',' '),account.profile_id,sub.personal_profession)
      on conflict(owner_profile_id,personal_profession) where kind='personal' do update set owner_profile_id=excluded.owner_profile_id returning id into result;
  elsif sub.target_kind='creator' and account.profile_id is not null then
    insert into public.spaces(kind,name,owner_profile_id) values('creator','Espace Creator',account.profile_id)
      on conflict(owner_profile_id) where kind='creator' do update set owner_profile_id=excluded.owner_profile_id returning id into result;
  elsif sub.target_kind='team' and account.organization_id is not null then
    insert into public.spaces(kind,name,organization_id) select 'team',name,id from public.organizations where id=account.organization_id
      on conflict(organization_id) where kind='team' do update set organization_id=excluded.organization_id returning id into result;
  else raise exception using errcode='22023',message='billing_scope_mismatch';
  end if;
  if result is null then raise exception using errcode='22023',message='billing_scope_mismatch'; end if;
  update public.billing_subscriptions set target_space_id=result where id=sub.id;
  insert into public.audit_logs(actor_role,action,resource_type,resource_id,metadata) values('service_role','billing_space_provisioned','space',result::text,jsonb_build_object('subscription_id',sub.id,'kind',sub.target_kind));
  return result;
end $$;

create or replace function public.sync_subscription_entitlements(subscription_value uuid)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public as $$
declare sub public.billing_subscriptions%rowtype; target public.spaces%rowtype; grants_access boolean; entitlement_status text;
begin
  if auth.role()<>'service_role' then raise exception using errcode='42501',message='backend_only'; end if;
  select * into sub from public.billing_subscriptions where id=subscription_value for update;
  if not found then raise exception using errcode='P0002',message='subscription_not_found'; end if;
  grants_access:=sub.status in ('trialing','active') or (sub.status='canceled' and sub.current_period_end is not null and sub.current_period_end>timezone('utc',now()));
  if sub.current_period_end is not null and sub.current_period_end<=timezone('utc',now()) then grants_access:=false; end if;
  if sub.target_space_id is null then
    if not grants_access then return; end if;
    perform public.ensure_billing_subscription_space(sub.id);
    select * into sub from public.billing_subscriptions where id=subscription_value;
  end if;
  select * into target from public.spaces where id=sub.target_space_id for share;
  entitlement_status:=case when grants_access then 'active' when sub.status in ('canceled','unpaid') then 'revoked' else 'suspended' end;
  if target.kind='team' then
    if sub.entitlement_key<>'team_access' then raise exception using errcode='22023',message='billing_scope_mismatch'; end if;
    insert into public.zero_limit_entitlements(key,organization_id,source,status,billing_subscription_id,metadata) values(sub.entitlement_key,target.organization_id,'subscription',entitlement_status,sub.id,jsonb_build_object('origin','billing'))
      on conflict(billing_subscription_id,key) where billing_subscription_id is not null do update set status=excluded.status,expires_at=null,updated_at=timezone('utc',now());
  else
    if (target.kind='personal' and sub.entitlement_key<>'personal_access') or (target.kind='creator' and sub.entitlement_key<>'creator_access') then raise exception using errcode='22023',message='billing_scope_mismatch'; end if;
    insert into public.zero_limit_entitlements(key,space_id,source,status,billing_subscription_id,metadata) values(sub.entitlement_key,target.id,'subscription',entitlement_status,sub.id,jsonb_build_object('origin','billing'))
      on conflict(billing_subscription_id,key) where billing_subscription_id is not null do update set status=excluded.status,expires_at=null,updated_at=timezone('utc',now());
  end if;
  insert into public.audit_logs(actor_role,action,resource_type,resource_id,metadata) values('service_role',case when grants_access then 'billing_entitlement_granted' else 'billing_entitlement_suspended' end,'billing_subscription',sub.id::text,jsonb_build_object('entitlement_key',sub.entitlement_key,'status',entitlement_status));
end $$;

create or replace function public.process_billing_subscription_event(
  provider_value text,provider_event_id_value text,event_type_value text,provider_created_at_value timestamptz,provider_snapshot_at_value timestamptz,
  object_id_value text,payload_hash_value text,billing_account_value uuid,target_space_value uuid,target_kind_value text,personal_profession_value text,
  provider_customer_value text,plan_key_value text,entitlement_key_value text,status_value text,quantity_value integer,
  current_period_start_value timestamptz,current_period_end_value timestamptz,cancel_at_period_end_value boolean,canceled_at_value timestamptz
) returns jsonb language plpgsql volatile security definer set search_path=pg_catalog,public as $$
declare inbox public.billing_webhook_events%rowtype; sub public.billing_subscriptions%rowtype; account public.billing_accounts%rowtype; created boolean:=false; safe_error text; inserted_event uuid;
begin
  if auth.role()<>'service_role' then raise exception using errcode='42501',message='backend_only'; end if;
  insert into public.billing_webhook_events(provider,provider_event_id,event_type,object_id,payload_hash,provider_created_at,processing_started_at)
    values(provider_value,provider_event_id_value,event_type_value,object_id_value,payload_hash_value,provider_created_at_value,timezone('utc',now())) on conflict(provider,provider_event_id) do nothing returning id into inserted_event;
  select * into inbox from public.billing_webhook_events where provider=provider_value and provider_event_id=provider_event_id_value for update;
  if inbox.status in ('processed','ignored') then return jsonb_build_object('duplicate',true,'status',inbox.status); end if;
  if inserted_event is null and inbox.status='processing' and inbox.processing_started_at is not null and inbox.processing_started_at>timezone('utc',now())-interval '5 minutes' then
    return jsonb_build_object('processing',true);
  end if;
  if inbox.status='failed' or (inbox.status='processing' and inbox.processing_started_at<=timezone('utc',now())-interval '5 minutes') then
    update public.billing_webhook_events set status='processing',processing_started_at=timezone('utc',now()),processed_at=null,error_code=null,attempt_count=attempt_count+1 where id=inbox.id;
  end if;
  begin
    select * into sub from public.billing_subscriptions where provider=provider_value and provider_subscription_id=object_id_value for update;
    if found and provider_snapshot_at_value<sub.provider_updated_at then
      update public.billing_webhook_events set status='ignored',processed_at=timezone('utc',now()) where id=inbox.id;
      return jsonb_build_object('ignored',true,'reason','older_provider_snapshot');
    end if;
    if not found then
      select * into account from public.billing_accounts where id=billing_account_value and provider=provider_value and provider_customer_id=provider_customer_value for update;
      if account.id is null then raise exception using errcode='22023',message='billing_scope_mismatch'; end if;
      insert into public.billing_subscriptions(billing_account_id,provider,provider_subscription_id,plan_key,entitlement_key,target_space_id,target_kind,personal_profession,status,quantity,current_period_start,current_period_end,cancel_at_period_end,canceled_at,provider_updated_at)
        values(account.id,provider_value,object_id_value,plan_key_value,entitlement_key_value,target_space_value,target_kind_value,personal_profession_value,status_value,quantity_value,current_period_start_value,current_period_end_value,cancel_at_period_end_value,canceled_at_value,provider_snapshot_at_value) returning * into sub; created:=true;
    else
      if (billing_account_value is not null and billing_account_value<>sub.billing_account_id) or (target_space_value is not null and sub.target_space_id is not null and target_space_value<>sub.target_space_id)
        or target_kind_value<>sub.target_kind or personal_profession_value is distinct from sub.personal_profession or plan_key_value<>sub.plan_key or entitlement_key_value<>sub.entitlement_key then
        raise exception using errcode='22023',message='billing_scope_mismatch';
      end if;
      update public.billing_subscriptions set target_space_id=coalesce(target_space_id,target_space_value),status=status_value,quantity=quantity_value,current_period_start=current_period_start_value,current_period_end=current_period_end_value,cancel_at_period_end=cancel_at_period_end_value,canceled_at=canceled_at_value,provider_updated_at=provider_snapshot_at_value where id=sub.id returning * into sub;
    end if;
    perform public.sync_subscription_entitlements(sub.id);
    insert into public.audit_logs(actor_role,action,resource_type,resource_id,metadata) values('service_role',case when created then 'billing_subscription_created' when status_value='canceled' then 'billing_subscription_canceled' else 'billing_subscription_updated' end,'billing_subscription',sub.id::text,jsonb_build_object('status',status_value,'plan_key',plan_key_value));
  exception when others then
    safe_error:=case when sqlstate='22023' then 'billing_scope_mismatch' when sqlstate='P0002' then 'subscription_not_found' when sqlstate in ('23503','23505','23514') then 'billing_constraint_failed' else 'billing_processing_failed' end;
    update public.billing_webhook_events set status='failed',processed_at=timezone('utc',now()),error_code=safe_error where id=inbox.id;
    return jsonb_build_object('failed',true,'error_code',safe_error);
  end;
  update public.billing_webhook_events set status='processed',processed_at=timezone('utc',now()),error_code=null where id=inbox.id;
  return jsonb_build_object('processed',true,'subscription_id',sub.id);
end $$;

create or replace function public.record_billing_webhook_event(provider_value text,provider_event_id_value text,event_type_value text,provider_created_at_value timestamptz,object_id_value text,payload_hash_value text)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog,public as $$
declare event_value uuid;
begin
  if auth.role()<>'service_role' then raise exception using errcode='42501',message='backend_only'; end if;
  insert into public.billing_webhook_events(provider,provider_event_id,event_type,object_id,payload_hash,status,provider_created_at,processed_at)
    values(provider_value,provider_event_id_value,event_type_value,object_id_value,payload_hash_value,'ignored',provider_created_at_value,timezone('utc',now())) on conflict(provider,provider_event_id) do nothing returning id into event_value;
  return case when event_value is null then jsonb_build_object('duplicate',true) else jsonb_build_object('ignored',true) end;
end $$;

create or replace function public.record_billing_webhook_failure(provider_value text,provider_event_id_value text,event_type_value text,provider_created_at_value timestamptz,object_id_value text,payload_hash_value text,error_code_value text)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog,public as $$
declare current_status text;
begin
  if auth.role()<>'service_role' then raise exception using errcode='42501',message='backend_only'; end if;
  if error_code_value not in ('invalid_plan','provider_unavailable','billing_processing_failed') then error_code_value:='billing_processing_failed'; end if;
  insert into public.billing_webhook_events(provider,provider_event_id,event_type,object_id,payload_hash,status,provider_created_at,processed_at,error_code)
    values(provider_value,provider_event_id_value,event_type_value,object_id_value,payload_hash_value,'failed',provider_created_at_value,timezone('utc',now()),error_code_value)
    on conflict(provider,provider_event_id) do update set
      status=case when billing_webhook_events.status in ('processed','ignored') then billing_webhook_events.status else 'failed' end,
      processed_at=case when billing_webhook_events.status in ('processed','ignored') then billing_webhook_events.processed_at else timezone('utc',now()) end,
      error_code=case when billing_webhook_events.status in ('processed','ignored') then billing_webhook_events.error_code else excluded.error_code end,
      attempt_count=case when billing_webhook_events.status in ('processed','ignored') then billing_webhook_events.attempt_count else billing_webhook_events.attempt_count+1 end
    returning status into current_status;
  return jsonb_build_object('status',current_status);
end $$;

revoke all on function public.ensure_billing_subscription_space(uuid),public.sync_subscription_entitlements(uuid) from public,anon,authenticated;
revoke all on function public.process_billing_subscription_event(text,text,text,timestamptz,timestamptz,text,text,uuid,uuid,text,text,text,text,text,text,integer,timestamptz,timestamptz,boolean,timestamptz) from public,anon,authenticated;
revoke all on function public.record_billing_webhook_event(text,text,text,timestamptz,text,text) from public,anon,authenticated;
revoke all on function public.record_billing_webhook_failure(text,text,text,timestamptz,text,text,text) from public,anon,authenticated;
grant execute on function public.ensure_billing_subscription_space(uuid),public.sync_subscription_entitlements(uuid) to service_role;
grant execute on function public.process_billing_subscription_event(text,text,text,timestamptz,timestamptz,text,text,uuid,uuid,text,text,text,text,text,text,integer,timestamptz,timestamptz,boolean,timestamptz) to service_role;
grant execute on function public.record_billing_webhook_event(text,text,text,timestamptz,text,text) to service_role;
grant execute on function public.record_billing_webhook_failure(text,text,text,timestamptz,text,text,text) to service_role;

comment on table public.billing_accounts is 'Server-only payer identity; not product authority.';
comment on table public.billing_subscriptions is 'Provider-authoritative local subscription mirror; target Space may be provisioned only after access-valid provider state.';
comment on table public.billing_webhook_events is 'PII-minimized retryable inbox; raw provider payloads are not retained.';
