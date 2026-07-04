create extension if not exists pgcrypto;

create table if not exists public.training_programs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  slug text not null unique,
  title text not null,
  description text,
  product_key text not null unique,
  status text not null default 'draft',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  constraint training_programs_status_check check (status in ('draft', 'published', 'archived')),
  constraint training_programs_slug_check check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  constraint training_programs_product_key_check check (product_key ~ '^[a-z0-9][a-z0-9._:-]{1,120}$')
);

create table if not exists public.training_packs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  program_id uuid not null references public.training_programs(id) on delete cascade,
  slug text not null,
  title text not null,
  short_description text,
  description text,
  product_key text not null,
  status text not null default 'draft',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  unique (program_id, slug),
  unique (product_key),
  constraint training_packs_status_check check (status in ('draft', 'published', 'archived')),
  constraint training_packs_slug_check check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  constraint training_packs_product_key_check check (product_key ~ '^[a-z0-9][a-z0-9._:-]{1,120}$')
);

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  pack_id uuid not null references public.training_packs(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  status text not null default 'draft',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  unique (pack_id, slug),
  constraint training_modules_status_check check (status in ('draft', 'published', 'archived')),
  constraint training_modules_slug_check check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$')
);

create table if not exists public.training_lessons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  trainer_name text,
  duration_seconds integer,
  video_provider text,
  video_asset_id text,
  status text not null default 'draft',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  unique (module_id, slug),
  constraint training_lessons_status_check check (status in ('draft', 'published', 'archived')),
  constraint training_lessons_slug_check check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  constraint training_lessons_duration_check check (duration_seconds is null or duration_seconds >= 0)
);

create table if not exists public.training_entitlements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.training_programs(id) on delete cascade,
  pack_id uuid references public.training_packs(id) on delete cascade,
  product_key text not null,
  source text not null default 'manual',
  status text not null default 'active',
  starts_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint training_entitlements_scope_check check ((program_id is not null and pack_id is null) or (program_id is null and pack_id is not null)),
  constraint training_entitlements_status_check check (status in ('active', 'revoked', 'expired', 'pending')),
  constraint training_entitlements_product_key_check check (product_key ~ '^[a-z0-9][a-z0-9._:-]{1,120}$')
);

create unique index if not exists training_entitlements_active_scope_idx on public.training_entitlements (user_id, product_key) where status = 'active';
create index if not exists training_entitlements_user_status_idx on public.training_entitlements (user_id, status);
create index if not exists training_lessons_module_order_idx on public.training_lessons (module_id, sort_order);
create index if not exists training_modules_pack_order_idx on public.training_modules (pack_id, sort_order);
create index if not exists training_packs_program_order_idx on public.training_packs (program_id, sort_order);

create table if not exists public.training_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  status text not null default 'in_progress',
  started_at timestamptz not null default timezone('utc', now()),
  last_activity_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, lesson_id),
  constraint training_lesson_progress_status_check check (status in ('not_started', 'in_progress', 'completed'))
);

create table if not exists public.training_favorites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  unique (user_id, lesson_id)
);

create table if not exists public.training_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  body text not null default '',
  unique (user_id, lesson_id)
);

create table if not exists public.training_resources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  title text not null,
  resource_type text not null,
  url text,
  storage_path text,
  is_downloadable boolean not null default false,
  status text not null default 'draft',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  constraint training_resources_type_check check (resource_type in ('pdf', 'link', 'file', 'template', 'checklist', 'document')),
  constraint training_resources_status_check check (status in ('draft', 'published', 'archived'))
);

create table if not exists public.training_comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  body text not null,
  status text not null default 'published',
  constraint training_comments_status_check check (status in ('published', 'hidden', 'deleted', 'pending'))
);

alter table public.training_programs enable row level security;
alter table public.training_packs enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_lessons enable row level security;
alter table public.training_entitlements enable row level security;
alter table public.training_lesson_progress enable row level security;
alter table public.training_favorites enable row level security;
alter table public.training_notes enable row level security;
alter table public.training_resources enable row level security;
alter table public.training_comments enable row level security;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at' and pronamespace = 'public'::regnamespace) then
    drop trigger if exists set_training_programs_updated_at on public.training_programs;
    create trigger set_training_programs_updated_at before update on public.training_programs for each row execute function public.set_updated_at();
    drop trigger if exists set_training_packs_updated_at on public.training_packs;
    create trigger set_training_packs_updated_at before update on public.training_packs for each row execute function public.set_updated_at();
    drop trigger if exists set_training_modules_updated_at on public.training_modules;
    create trigger set_training_modules_updated_at before update on public.training_modules for each row execute function public.set_updated_at();
    drop trigger if exists set_training_lessons_updated_at on public.training_lessons;
    create trigger set_training_lessons_updated_at before update on public.training_lessons for each row execute function public.set_updated_at();
    drop trigger if exists set_training_entitlements_updated_at on public.training_entitlements;
    create trigger set_training_entitlements_updated_at before update on public.training_entitlements for each row execute function public.set_updated_at();
    drop trigger if exists set_training_lesson_progress_updated_at on public.training_lesson_progress;
    create trigger set_training_lesson_progress_updated_at before update on public.training_lesson_progress for each row execute function public.set_updated_at();
    drop trigger if exists set_training_notes_updated_at on public.training_notes;
    create trigger set_training_notes_updated_at before update on public.training_notes for each row execute function public.set_updated_at();
    drop trigger if exists set_training_comments_updated_at on public.training_comments;
    create trigger set_training_comments_updated_at before update on public.training_comments for each row execute function public.set_updated_at();
  end if;
end $$;

create or replace function public.has_training_access(target_program_id uuid, target_pack_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin_user()
    or exists (
      select 1 from public.training_entitlements te
      where te.user_id = auth.uid()
        and te.status = 'active'
        and te.starts_at <= timezone('utc', now())
        and (te.expires_at is null or te.expires_at > timezone('utc', now()))
        and (
          (target_program_id is not null and te.program_id = target_program_id)
          or (target_pack_id is not null and te.pack_id = target_pack_id)
          or (target_pack_id is not null and te.program_id = (select tp.program_id from public.training_packs tp where tp.id = target_pack_id))
        )
    );
$$;

revoke all on function public.has_training_access(uuid, uuid) from public;
grant execute on function public.has_training_access(uuid, uuid) to authenticated;

drop policy if exists training_programs_access_select on public.training_programs;
create policy training_programs_access_select on public.training_programs for select to authenticated using (public.has_training_access(id, null));
drop policy if exists training_packs_access_select on public.training_packs;
create policy training_packs_access_select on public.training_packs for select to authenticated using (public.has_training_access(program_id, id));
drop policy if exists training_modules_access_select on public.training_modules;
create policy training_modules_access_select on public.training_modules for select to authenticated using (public.has_training_access((select p.program_id from public.training_packs p where p.id = pack_id), pack_id));
drop policy if exists training_lessons_access_select on public.training_lessons;
create policy training_lessons_access_select on public.training_lessons for select to authenticated using (public.has_training_access((select p.program_id from public.training_packs p join public.training_modules m on m.pack_id = p.id where m.id = module_id), (select m.pack_id from public.training_modules m where m.id = module_id)));
drop policy if exists training_resources_access_select on public.training_resources;
create policy training_resources_access_select on public.training_resources for select to authenticated using (status = 'published' and public.has_training_access((select p.program_id from public.training_packs p join public.training_modules m on m.pack_id = p.id join public.training_lessons l on l.module_id = m.id where l.id = lesson_id), (select m.pack_id from public.training_modules m join public.training_lessons l on l.module_id = m.id where l.id = lesson_id)));

drop policy if exists training_entitlements_self_or_admin_select on public.training_entitlements;
create policy training_entitlements_self_or_admin_select on public.training_entitlements for select to authenticated using (user_id = auth.uid() or public.is_admin_user());
drop policy if exists training_entitlements_admin_insert on public.training_entitlements;
create policy training_entitlements_admin_insert on public.training_entitlements for insert to authenticated with check (public.is_admin_user());
drop policy if exists training_entitlements_admin_update on public.training_entitlements;
create policy training_entitlements_admin_update on public.training_entitlements for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists training_lesson_progress_self_select on public.training_lesson_progress;
create policy training_lesson_progress_self_select on public.training_lesson_progress for select to authenticated using (user_id = auth.uid() or public.is_admin_user());
drop policy if exists training_lesson_progress_self_insert on public.training_lesson_progress;
create policy training_lesson_progress_self_insert on public.training_lesson_progress for insert to authenticated with check (user_id = auth.uid());
drop policy if exists training_lesson_progress_self_update on public.training_lesson_progress;
create policy training_lesson_progress_self_update on public.training_lesson_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists training_favorites_self_all on public.training_favorites;
create policy training_favorites_self_all on public.training_favorites for all to authenticated using (user_id = auth.uid() or public.is_admin_user()) with check (user_id = auth.uid());
drop policy if exists training_notes_self_all on public.training_notes;
create policy training_notes_self_all on public.training_notes for all to authenticated using (user_id = auth.uid() or public.is_admin_user()) with check (user_id = auth.uid());
drop policy if exists training_comments_self_or_admin_select on public.training_comments;
create policy training_comments_self_or_admin_select on public.training_comments for select to authenticated using ((status = 'published' and public.has_training_access((select p.program_id from public.training_packs p join public.training_modules m on m.pack_id = p.id join public.training_lessons l on l.module_id = m.id where l.id = lesson_id), (select m.pack_id from public.training_modules m join public.training_lessons l on l.module_id = m.id where l.id = lesson_id))) or user_id = auth.uid() or public.is_admin_user());
drop policy if exists training_comments_self_insert on public.training_comments;
create policy training_comments_self_insert on public.training_comments for insert to authenticated with check (user_id = auth.uid());
drop policy if exists training_comments_self_update on public.training_comments;
create policy training_comments_self_update on public.training_comments for update to authenticated using (user_id = auth.uid() or public.is_admin_user()) with check (user_id = auth.uid() or public.is_admin_user());
