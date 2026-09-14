-- Cantoa v18.9.2 hardening: server-authoritative My Voice ownership.
-- Safe to run repeatedly. Direct client access remains blocked; API routes use service role.
create table if not exists public.cantoa_voice_profiles (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_voice_id text not null unique,
  name text not null,
  provider text not null default 'elevenlabs',
  created_at timestamptz not null default now()
);
create index if not exists cantoa_voice_profiles_user_idx on public.cantoa_voice_profiles(user_id, created_at desc);
alter table public.cantoa_voice_profiles enable row level security;
revoke all on table public.cantoa_voice_profiles from anon, authenticated;
