create table if not exists public.client_collaboration_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_role text not null default 'client',
  author_name text not null default 'Utilisateur',
  message text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  constraint client_collaboration_messages_author_role_check check (
    author_role in ('admin', 'client')
  )
);

create index if not exists client_collaboration_messages_application_id_idx
  on public.client_collaboration_messages (application_id, created_at);

drop trigger if exists set_client_collaboration_messages_updated_at on public.client_collaboration_messages;

create trigger set_client_collaboration_messages_updated_at
before update on public.client_collaboration_messages
for each row
execute function public.set_updated_at();

alter table public.client_collaboration_messages enable row level security;

insert into storage.buckets (id, name, public)
values ('client-collaboration', 'client-collaboration', false)
on conflict (id) do nothing;
