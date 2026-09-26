-- Generic external integration foundation. Additive: legacy Google Drive and Billing remain isolated.
-- This migration performs no provider calls and enables no runtime credential writer.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

do $$ begin
  if pg_catalog.to_regclass('public.profiles') is null
     or pg_catalog.to_regclass('public.organizations') is null
     or pg_catalog.to_regclass('public.organization_memberships') is null
     or pg_catalog.to_regclass('public.audit_logs') is null then
    raise exception using errcode='42P01', message='integration_core_preflight_failed: prerequisites are missing';
  end if;
end $$;

create table if not exists public.integration_connections (
  id uuid not null default gen_random_uuid(), provider text not null, scope_type text not null,
  profile_id uuid, organization_id uuid, external_account_id text not null, external_account_label text,
  status text not null default 'pending', scopes text[] not null default '{}', connected_at timestamptz,
  disconnected_at timestamptz, last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now())
);
create table if not exists public.integration_credentials (
  connection_id uuid not null, access_token_ciphertext text, refresh_token_ciphertext text,
  encryption_key_version text not null, token_type text, expires_at timestamptz, rotated_at timestamptz,
  revoked_at timestamptz, updated_at timestamptz not null default timezone('utc',now())
);
create table if not exists public.integration_oauth_states (
  state_hash text not null, profile_id uuid not null, provider text not null, return_path text not null,
  pkce_verifier_ciphertext text, expires_at timestamptz not null, consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc',now())
);
create table if not exists public.integration_webhook_events (
  id uuid not null default gen_random_uuid(), provider text not null, provider_event_id text not null,
  event_type text not null, connection_id uuid, status text not null default 'processing',
  received_at timestamptz not null default timezone('utc',now()),
  processing_started_at timestamptz not null default timezone('utc',now()), processed_at timestamptz,
  attempt_count integer not null default 1, error_code text, payload_hash text not null
);

-- Complete safe partial creations. Required columns can only be added while a
-- partial table is empty; otherwise the shape is ambiguous and fails closed.
do $$
declare item record; row_exists boolean; actual_type text; actual_nullable text; has_null boolean;
begin
  for item in select * from (values
    ('integration_connections','id','uuid','NO','id uuid default gen_random_uuid() not null'),
    ('integration_connections','provider','text','NO','provider text not null'),('integration_connections','scope_type','text','NO','scope_type text not null'),
    ('integration_connections','profile_id','uuid','YES','profile_id uuid'),('integration_connections','organization_id','uuid','YES','organization_id uuid'),
    ('integration_connections','external_account_id','text','NO','external_account_id text not null'),('integration_connections','external_account_label','text','YES','external_account_label text'),
    ('integration_connections','status','text','NO','status text not null default ''pending'''),('integration_connections','scopes','ARRAY','NO','scopes text[] not null default ''{}'''),
    ('integration_connections','connected_at','timestamp with time zone','YES','connected_at timestamptz'),('integration_connections','disconnected_at','timestamp with time zone','YES','disconnected_at timestamptz'),
    ('integration_connections','last_synced_at','timestamp with time zone','YES','last_synced_at timestamptz'),('integration_connections','created_at','timestamp with time zone','NO','created_at timestamptz not null default timezone(''utc'',now())'),
    ('integration_connections','updated_at','timestamp with time zone','NO','updated_at timestamptz not null default timezone(''utc'',now())'),
    ('integration_credentials','connection_id','uuid','NO','connection_id uuid not null'),('integration_credentials','access_token_ciphertext','text','YES','access_token_ciphertext text'),
    ('integration_credentials','refresh_token_ciphertext','text','YES','refresh_token_ciphertext text'),('integration_credentials','encryption_key_version','text','NO','encryption_key_version text not null'),
    ('integration_credentials','token_type','text','YES','token_type text'),('integration_credentials','expires_at','timestamp with time zone','YES','expires_at timestamptz'),
    ('integration_credentials','rotated_at','timestamp with time zone','YES','rotated_at timestamptz'),('integration_credentials','revoked_at','timestamp with time zone','YES','revoked_at timestamptz'),
    ('integration_credentials','updated_at','timestamp with time zone','NO','updated_at timestamptz not null default timezone(''utc'',now())'),
    ('integration_oauth_states','state_hash','text','NO','state_hash text not null'),('integration_oauth_states','profile_id','uuid','NO','profile_id uuid not null'),
    ('integration_oauth_states','provider','text','NO','provider text not null'),('integration_oauth_states','return_path','text','NO','return_path text not null'),
    ('integration_oauth_states','pkce_verifier_ciphertext','text','YES','pkce_verifier_ciphertext text'),('integration_oauth_states','expires_at','timestamp with time zone','NO','expires_at timestamptz not null'),
    ('integration_oauth_states','consumed_at','timestamp with time zone','YES','consumed_at timestamptz'),('integration_oauth_states','created_at','timestamp with time zone','NO','created_at timestamptz not null default timezone(''utc'',now())'),
    ('integration_webhook_events','id','uuid','NO','id uuid default gen_random_uuid() not null'),('integration_webhook_events','provider','text','NO','provider text not null'),
    ('integration_webhook_events','provider_event_id','text','NO','provider_event_id text not null'),('integration_webhook_events','event_type','text','NO','event_type text not null'),
    ('integration_webhook_events','connection_id','uuid','YES','connection_id uuid'),('integration_webhook_events','status','text','NO','status text not null default ''processing'''),
    ('integration_webhook_events','received_at','timestamp with time zone','NO','received_at timestamptz not null default timezone(''utc'',now())'),
    ('integration_webhook_events','processing_started_at','timestamp with time zone','NO','processing_started_at timestamptz not null default timezone(''utc'',now())'),
    ('integration_webhook_events','processed_at','timestamp with time zone','YES','processed_at timestamptz'),('integration_webhook_events','attempt_count','integer','NO','attempt_count integer not null default 1'),
    ('integration_webhook_events','error_code','text','YES','error_code text'),('integration_webhook_events','payload_hash','text','NO','payload_hash text not null')
  ) x(tbl,name,typ,nullable,definition) loop
    select data_type,is_nullable into actual_type,actual_nullable from information_schema.columns
      where table_schema='public' and table_name=item.tbl and column_name=item.name;
    if actual_type is null then
      execute format('select exists(select 1 from public.%I)',item.tbl) into row_exists;
      if item.nullable='NO' and row_exists then raise exception using errcode='42804',message='integration_core_preflight_failed: cannot safely add required column '||item.tbl||'.'||item.name; end if;
      execute format('alter table public.%I add column %s',item.tbl,item.definition);
    elsif actual_type<>item.typ then
      raise exception using errcode='42804',message='integration_core_preflight_failed: incompatible column '||item.tbl||'.'||item.name;
    elsif item.nullable='NO' and actual_nullable='YES' then
      execute format('select exists(select 1 from public.%I where %I is null)',item.tbl,item.name) into has_null;
      if has_null then raise exception using errcode='42804',message='integration_core_preflight_failed: null values prevent required column hardening '||item.tbl||'.'||item.name; end if;
      execute format('alter table public.%I alter column %I set not null',item.tbl,item.name);
    elsif item.nullable='YES' and actual_nullable='NO' then
      raise exception using errcode='42804',message='integration_core_preflight_failed: incompatible column nullability '||item.tbl||'.'||item.name;
    end if;
  end loop;
end $$;

-- Canonical defaults are part of column shape, not PK/FK/UNIQUE/CHECK shape.
-- A missing default is safely repairable; a different default fails closed.
do $$
declare item record; actual text;
begin
  for item in select * from (values
    ('integration_connections','id','gen_random_uuid()','alter table public.integration_connections alter column id set default gen_random_uuid()'),
    ('integration_connections','status','''pending''::text','alter table public.integration_connections alter column status set default ''pending'''),
    ('integration_connections','scopes','''{}''::text[]','alter table public.integration_connections alter column scopes set default ''{}'''),
    ('integration_connections','created_at','timezone(''utc''::text, now())','alter table public.integration_connections alter column created_at set default timezone(''utc'',now())'),
    ('integration_connections','updated_at','timezone(''utc''::text, now())','alter table public.integration_connections alter column updated_at set default timezone(''utc'',now())'),
    ('integration_credentials','updated_at','timezone(''utc''::text, now())','alter table public.integration_credentials alter column updated_at set default timezone(''utc'',now())'),
    ('integration_oauth_states','created_at','timezone(''utc''::text, now())','alter table public.integration_oauth_states alter column created_at set default timezone(''utc'',now())'),
    ('integration_webhook_events','id','gen_random_uuid()','alter table public.integration_webhook_events alter column id set default gen_random_uuid()'),
    ('integration_webhook_events','status','''processing''::text','alter table public.integration_webhook_events alter column status set default ''processing'''),
    ('integration_webhook_events','received_at','timezone(''utc''::text, now())','alter table public.integration_webhook_events alter column received_at set default timezone(''utc'',now())'),
    ('integration_webhook_events','processing_started_at','timezone(''utc''::text, now())','alter table public.integration_webhook_events alter column processing_started_at set default timezone(''utc'',now())'),
    ('integration_webhook_events','attempt_count','1','alter table public.integration_webhook_events alter column attempt_count set default 1')
  ) x(tbl,name,expected,repair_sql) loop
    select column_default into actual from information_schema.columns where table_schema='public' and table_name=item.tbl and column_name=item.name;
    if actual is null then execute item.repair_sql;
    elsif actual<>item.expected then raise exception using errcode='42804',message='integration_core_preflight_failed: incompatible column default '||item.tbl||'.'||item.name; end if;
  end loop;
end $$;

-- Named PK, FK, CHECK and UNIQUE constraints are added when absent. A
-- same-named constraint with different semantics, type or validity fails 42804.
do $$
declare item record; actual text; normalized text; actual_type "char"; valid boolean;
begin
  -- Old contradictory credential checks from an aborted partial deployment are never rewritten silently.
  if exists(select 1 from pg_constraint where conrelid='public.integration_credentials'::regclass and conname in ('integration_credentials_ciphertext_check','integration_credentials_revoked_check')) then
    raise exception using errcode='42804',message='integration_core_preflight_failed: obsolete credential lifecycle constraints require manual review';
  end if;
  for item in select * from (values
    ('integration_connections','integration_connections_pkey','p','primarykeyid','alter table public.integration_connections add constraint integration_connections_pkey primary key(id)'),
    ('integration_connections','integration_connections_profile_id_fkey','f','foreignkeyprofile_idreferencesprofilesidondeletecascade','alter table public.integration_connections add constraint integration_connections_profile_id_fkey foreign key(profile_id) references public.profiles(id) on delete cascade'),
    ('integration_connections','integration_connections_organization_id_fkey','f','foreignkeyorganization_idreferencesorganizationsidondeletecascade','alter table public.integration_connections add constraint integration_connections_organization_id_fkey foreign key(organization_id) references public.organizations(id) on delete cascade'),
    ('integration_connections','integration_connections_provider_check','c','checkprovider=anyarray[discord,google]','alter table public.integration_connections add constraint integration_connections_provider_check check(provider in (''discord'',''google''))'),
    ('integration_connections','integration_connections_scope_check','c','checkscope_type=profileandprofile_idisnotnullandorganization_idisnullorscope_type=organizationandorganization_idisnotnullandprofile_idisnull','alter table public.integration_connections add constraint integration_connections_scope_check check((scope_type=''profile'' and profile_id is not null and organization_id is null) or (scope_type=''organization'' and organization_id is not null and profile_id is null))'),
    ('integration_connections','integration_connections_status_check','c','checkstatus=anyarray[pending,active,expired,revoked,error]','alter table public.integration_connections add constraint integration_connections_status_check check(status in (''pending'',''active'',''expired'',''revoked'',''error''))'),
    ('integration_connections','integration_connections_external_id_check','c','checkchar_lengthexternal_account_id>=1andchar_lengthexternal_account_id<=255','alter table public.integration_connections add constraint integration_connections_external_id_check check(char_length(external_account_id) between 1 and 255)'),
    ('integration_connections','integration_connections_label_check','c','checkexternal_account_labelisnullorchar_lengthexternal_account_label<=160','alter table public.integration_connections add constraint integration_connections_label_check check(external_account_label is null or char_length(external_account_label)<=160)'),
    ('integration_connections','integration_connections_lifecycle_check','c','checkstatus=activeandconnected_atisnotnullanddisconnected_atisnullorstatus=revokedanddisconnected_atisnotnullorstatus=anyarray[pending,expired,error]','alter table public.integration_connections add constraint integration_connections_lifecycle_check check((status=''active'' and connected_at is not null and disconnected_at is null) or (status=''revoked'' and disconnected_at is not null) or status in (''pending'',''expired'',''error''))'),
    ('integration_connections','integration_connections_provider_external_account_id_scope_type_key','u','uniqueprovider,external_account_id,scope_type','alter table public.integration_connections add constraint integration_connections_provider_external_account_id_scope_type_key unique(provider,external_account_id,scope_type)'),
    ('integration_connections','integration_connections_provider_profile_id_organization_id_key','u','uniquenullsnotdistinctprovider,profile_id,organization_id','alter table public.integration_connections add constraint integration_connections_provider_profile_id_organization_id_key unique nulls not distinct(provider,profile_id,organization_id)'),
    ('integration_credentials','integration_credentials_pkey','p','primarykeyconnection_id','alter table public.integration_credentials add constraint integration_credentials_pkey primary key(connection_id)'),
    ('integration_credentials','integration_credentials_connection_id_fkey','f','foreignkeyconnection_idreferencesintegration_connectionsidondeletecascade','alter table public.integration_credentials add constraint integration_credentials_connection_id_fkey foreign key(connection_id) references public.integration_connections(id) on delete cascade'),
    ('integration_credentials','integration_credentials_lifecycle_check','c','checkrevoked_atisnullandaccess_token_ciphertextisnotnullorrefresh_token_ciphertextisnotnullorrevoked_atisnotnullandaccess_token_ciphertextisnullandrefresh_token_ciphertextisnull','alter table public.integration_credentials add constraint integration_credentials_lifecycle_check check((revoked_at is null and (access_token_ciphertext is not null or refresh_token_ciphertext is not null)) or (revoked_at is not null and access_token_ciphertext is null and refresh_token_ciphertext is null))'),
    ('integration_oauth_states','integration_oauth_states_pkey','p','primarykeystate_hash','alter table public.integration_oauth_states add constraint integration_oauth_states_pkey primary key(state_hash)'),
    ('integration_oauth_states','integration_oauth_states_profile_id_fkey','f','foreignkeyprofile_idreferencesprofilesidondeletecascade','alter table public.integration_oauth_states add constraint integration_oauth_states_profile_id_fkey foreign key(profile_id) references public.profiles(id) on delete cascade'),
    ('integration_oauth_states','integration_oauth_states_hash_check','c','checkstate_hash~^[a-f0-9]{64}$','alter table public.integration_oauth_states add constraint integration_oauth_states_hash_check check(state_hash ~ ''^[a-f0-9]{64}$'')'),
    ('integration_oauth_states','integration_oauth_states_provider_check','c','checkprovider=anyarray[discord,google]','alter table public.integration_oauth_states add constraint integration_oauth_states_provider_check check(provider in (''discord'',''google''))'),
    ('integration_oauth_states','integration_oauth_states_return_check','c','checkchar_lengthreturn_path<=500andreturn_path~^/identite|espace/[A-Za-z0-9_-]+*\\?[A-Za-z0-9._~!$&*+,;=:@%/?-]*?$andreturn_path!~//andreturn_path!~\\\\andlowerreturn_path!~%2e|%2f|%5c','alter table public.integration_oauth_states add constraint integration_oauth_states_return_check check(char_length(return_path)<=500 and return_path ~ ''^/(identite|espace)(/[A-Za-z0-9_-]+)*(\\?[A-Za-z0-9._~!$&()*+,;=:@%/?-]*)?$'' and return_path !~ ''//'' and return_path !~ ''\\\\'' and lower(return_path) !~ ''%2e|%2f|%5c'')'),
    ('integration_webhook_events','integration_webhook_events_pkey','p','primarykeyid','alter table public.integration_webhook_events add constraint integration_webhook_events_pkey primary key(id)'),
    ('integration_webhook_events','integration_webhook_events_connection_id_fkey','f','foreignkeyconnection_idreferencesintegration_connectionsidondeletesetnull','alter table public.integration_webhook_events add constraint integration_webhook_events_connection_id_fkey foreign key(connection_id) references public.integration_connections(id) on delete set null'),
    ('integration_webhook_events','integration_webhook_events_status_check','c','checkstatus=anyarray[processing,processed,failed,ignored]','alter table public.integration_webhook_events add constraint integration_webhook_events_status_check check(status in (''processing'',''processed'',''failed'',''ignored''))'),
    ('integration_webhook_events','integration_webhook_events_hash_check','c','checkpayload_hash~^[a-f0-9]{64}$','alter table public.integration_webhook_events add constraint integration_webhook_events_hash_check check(payload_hash ~ ''^[a-f0-9]{64}$'')'),
    ('integration_webhook_events','integration_webhook_events_attempt_check','c','checkattempt_count>0','alter table public.integration_webhook_events add constraint integration_webhook_events_attempt_check check(attempt_count>0)'),
    ('integration_webhook_events','integration_webhook_events_provider_provider_event_id_key','u','uniqueprovider,provider_event_id','alter table public.integration_webhook_events add constraint integration_webhook_events_provider_provider_event_id_key unique(provider,provider_event_id)')
  ) x(tbl,name,typ,expected,add_sql) loop
    select pg_get_constraintdef(oid),contype,convalidated into actual,actual_type,valid from pg_constraint where conrelid=('public.'||item.tbl)::regclass and conname=item.name;
    normalized:=regexp_replace(replace(replace(replace(lower(coalesce(actual,'')),'public.',''),'::text[]',''),'::text',''),'[[:space:]()'']','','g');
    if actual is null then execute item.add_sql;
    elsif actual_type<>item.typ or normalized<>item.expected or not valid then raise exception using errcode='42804',message='integration_core_preflight_failed: incompatible constraint '||item.name; end if;
  end loop;
end $$;

-- Critical named indexes are definition-checked; invalid or same-named foreign objects fail closed.
do $$
declare item record; kind "char"; valid boolean; actual text;
begin
  for item in select * from (values
    ('integration_connections_profile_idx','CREATE INDEX integration_connections_profile_idx ON public.integration_connections USING btree (profile_id) WHERE (profile_id IS NOT NULL)','create index integration_connections_profile_idx on public.integration_connections(profile_id) where profile_id is not null'),
    ('integration_connections_organization_idx','CREATE INDEX integration_connections_organization_idx ON public.integration_connections USING btree (organization_id) WHERE (organization_id IS NOT NULL)','create index integration_connections_organization_idx on public.integration_connections(organization_id) where organization_id is not null'),
    ('integration_webhook_status_idx','CREATE INDEX integration_webhook_status_idx ON public.integration_webhook_events USING btree (status, processing_started_at)','create index integration_webhook_status_idx on public.integration_webhook_events(status,processing_started_at)'),
    ('integration_oauth_expiry_idx','CREATE INDEX integration_oauth_expiry_idx ON public.integration_oauth_states USING btree (expires_at) WHERE (consumed_at IS NULL)','create index integration_oauth_expiry_idx on public.integration_oauth_states(expires_at) where consumed_at is null')
  ) x(name,expected,create_sql) loop
    select c.relkind,i.indisvalid,pg_get_indexdef(c.oid) into kind,valid,actual from pg_class c left join pg_index i on i.indexrelid=c.oid where c.oid=to_regclass('public.'||item.name);
    if kind is null then execute item.create_sql;
    elsif kind not in ('i','I') or not coalesce(valid,false) or actual<>item.expected then raise exception using errcode='42804',message='integration_core_preflight_failed: incompatible index '||item.name; end if;
  end loop;
end $$;

drop trigger if exists set_integration_connections_updated_at on public.integration_connections;
create trigger set_integration_connections_updated_at before update on public.integration_connections for each row execute function public.set_updated_at();
drop trigger if exists set_integration_credentials_updated_at on public.integration_credentials;
create trigger set_integration_credentials_updated_at before update on public.integration_credentials for each row execute function public.set_updated_at();

alter table public.integration_connections enable row level security;
alter table public.integration_credentials enable row level security;
alter table public.integration_oauth_states enable row level security;
alter table public.integration_webhook_events enable row level security;
revoke all on public.integration_connections,public.integration_credentials,public.integration_oauth_states,public.integration_webhook_events from public,anon,authenticated;
grant all on public.integration_connections,public.integration_credentials,public.integration_oauth_states,public.integration_webhook_events to service_role;

create or replace function public.can_manage_integration_connection(connection_value uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
 select exists(select 1 from public.integration_connections c
 left join public.organization_memberships m on m.organization_id=c.organization_id and m.profile_id=public.current_profile_id()
 left join public.organizations o on o.id=c.organization_id where c.id=connection_value and
 (c.profile_id=public.current_profile_id() or (c.scope_type='organization' and (o.owner_profile_id=public.current_profile_id() or m.role='admin'))))
$$;

create or replace function public.get_my_integration_connections()
returns table(id uuid,provider text,scope_type text,status text,external_account_label text,scopes text[],connected_at timestamptz,disconnected_at timestamptz,last_synced_at timestamptz,created_at timestamptz,updated_at timestamptz)
language sql stable security definer set search_path = pg_catalog, public as $$
 select c.id,c.provider,c.scope_type,c.status,c.external_account_label,c.scopes,c.connected_at,c.disconnected_at,c.last_synced_at,c.created_at,c.updated_at
 from public.integration_connections c where c.profile_id=public.current_profile_id() or (c.organization_id is not null and exists(
 select 1 from public.organization_memberships m where m.organization_id=c.organization_id and m.profile_id=public.current_profile_id())) order by c.created_at,c.id
$$;

create or replace function public.get_my_integration_connection(connection_value uuid)
returns table(id uuid,provider text,scope_type text,status text,external_account_label text,scopes text[],connected_at timestamptz,disconnected_at timestamptz,last_synced_at timestamptz,created_at timestamptz,updated_at timestamptz)
language sql stable security definer set search_path = pg_catalog, public as $$
 select * from public.get_my_integration_connections() c where c.id=connection_value
$$;

create or replace function public.consume_integration_oauth_state(state_hash_value text,profile_value uuid,provider_value text)
returns text language plpgsql security definer set search_path = pg_catalog, public as $$
declare path text;
begin
 update public.integration_oauth_states set consumed_at=timezone('utc',now()) where state_hash=state_hash_value and profile_id=profile_value and provider=provider_value and consumed_at is null and expires_at>timezone('utc',now()) returning return_path into path;
 if path is null then raise exception using errcode='22023',message='integration_state_invalid'; end if;
 return path;
end $$;

create or replace function public.disconnect_integration(connection_value uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare target public.integration_connections%rowtype;
begin
 select * into target from public.integration_connections where id=connection_value for update;
 if not found then raise exception using errcode='P0002',message='integration_not_found'; end if;
 if not public.can_manage_integration_connection(connection_value) then raise exception using errcode='42501',message='integration_forbidden'; end if;
 if target.status='revoked' then return; end if;
 update public.integration_credentials set access_token_ciphertext=null,refresh_token_ciphertext=null,revoked_at=timezone('utc',now()) where connection_id=connection_value;
 update public.integration_connections set status='revoked',disconnected_at=timezone('utc',now()) where id=connection_value;
 insert into public.audit_logs(actor_user_id,actor_profile_id,actor_role,action,resource_type,resource_id,metadata)
 values(auth.uid(),public.current_profile_id(),auth.role(),'integration_disconnected','integration_connection',connection_value::text,'{}');
end $$;

revoke all on function public.can_manage_integration_connection(uuid),public.get_my_integration_connections(),public.get_my_integration_connection(uuid),public.consume_integration_oauth_state(text,uuid,text),public.disconnect_integration(uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_my_integration_connections(),public.get_my_integration_connection(uuid),public.disconnect_integration(uuid) to authenticated;
grant execute on function public.can_manage_integration_connection(uuid),public.get_my_integration_connections(),public.get_my_integration_connection(uuid),public.consume_integration_oauth_state(text,uuid,text),public.disconnect_integration(uuid) to service_role;

comment on table public.integration_connections is 'Provider authorization, never product authority. All organization members may read the safe projection; only owner/admin manage. external_account_id means a user for profile scope and a provider resource for organization scope.';
comment on table public.integration_credentials is 'Schema prepared; runtime credential storage disabled until KMS/Vault is selected. Raw access is service-role only.';
comment on table public.integration_webhook_events is 'Preparatory schema only: no endpoint, signature runtime, claim, retry, stale reclaim, or worker exists.';
