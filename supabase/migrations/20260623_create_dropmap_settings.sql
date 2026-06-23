create table if not exists public.dropmap_settings (
  id boolean primary key default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  visibility_mode text not null default 'private',
  maintenance_message text,
  updated_by uuid references auth.users(id) on delete set null,
  constraint dropmap_settings_singleton_check check (id = true),
  constraint dropmap_settings_visibility_mode_check check (
    visibility_mode in ('private', 'maintenance', 'public')
  )
);

insert into public.dropmap_settings (id, visibility_mode, maintenance_message)
values (true, 'private', null)
on conflict (id) do nothing;

drop trigger if exists set_dropmap_settings_updated_at on public.dropmap_settings;

create trigger set_dropmap_settings_updated_at
before update on public.dropmap_settings
for each row
execute function public.set_updated_at();

alter table public.dropmap_settings enable row level security;
