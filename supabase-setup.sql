-- Run once in Supabase Dashboard > SQL Editor.
create table if not exists public.songs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  prompt text not null,
  mode text not null check (mode in ('vocals','instrumental')),
  duration integer not null check (duration > 0),
  storage_key text not null unique,
  parent_id uuid references public.songs(id) on delete set null,
  version_label text not null default 'Original',
  created_at bigint not null
);
create index if not exists songs_user_created_idx on public.songs(user_id,created_at desc);
alter table public.songs enable row level security;
drop policy if exists "Users read own songs" on public.songs;
create policy "Users read own songs" on public.songs for select using (auth.uid()=user_id);

create table if not exists public.memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'Explore' check (plan in ('Explore','Creator','Studio')),
  status text not null default 'active',
  minutes_remaining numeric(8,2) not null default 2,
  free_song_claimed boolean not null default false,
  free_songs_remaining integer not null default 2 check (free_songs_remaining between 0 and 2),
  billing_currency text,
  billing_amount_minor integer,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end bigint,
  updated_at bigint not null default 0
);
alter table public.memberships enable row level security;
drop policy if exists "Users read own membership" on public.memberships;
create policy "Users read own membership" on public.memberships for select using (auth.uid()=user_id);

create or replace function public.create_cantoa_membership()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.memberships(user_id,email,plan,status,minutes_remaining,free_song_claimed,free_songs_remaining,updated_at)
  values(new.id,new.email,'Explore','active',2,false,2,(extract(epoch from now())*1000)::bigint)
  on conflict(user_id) do nothing;
  return new;
end $$;
drop trigger if exists cantoa_new_user on auth.users;
create trigger cantoa_new_user after insert on auth.users for each row execute function public.create_cantoa_membership();

-- v17.5: one welcome song per verified account.
-- IMPORTANT: do not infer a used welcome song from an old minutes_remaining value.
-- Earlier builds could leave test/existing Explore accounts below 2 minutes without a
-- successful song. The one-time repair below treats a cloud-saved song as evidence that
-- the welcome song was actually delivered. When evidence is absent, the account gets the
-- welcome song back. This intentionally favors a one-time extra song over falsely denying
-- a legitimate first song.
alter table public.memberships add column if not exists free_song_claimed boolean not null default false;

-- v18.7: two free complete songs per account, each capped at 2 minutes.
-- Existing Explore accounts that already used the old one-song entitlement receive one additional free song;
-- unused accounts receive the full two. Paid/cancelled accounts do not regain free songs.
alter table public.memberships add column if not exists free_songs_remaining integer not null default 2;
alter table public.memberships add column if not exists billing_currency text;
alter table public.memberships add column if not exists billing_amount_minor integer;

create table if not exists public.cantoa_schema_migrations (
  migration_key text primary key,
  applied_at timestamptz not null default now()
);
alter table public.cantoa_schema_migrations enable row level security;

do $$
begin
  if not exists (
    select 1 from public.cantoa_schema_migrations
    where migration_key='v17.5_repair_explore_welcome_entitlement'
  ) then
    update public.memberships m
       set free_song_claimed = exists (
             select 1 from public.songs s where s.user_id=m.user_id
           ),
           minutes_remaining = case
             when exists (select 1 from public.songs s where s.user_id=m.user_id) then 0
             else 2
           end,
           updated_at=(extract(epoch from now())*1000)::bigint
     where m.plan='Explore' and m.status='active';

    insert into public.cantoa_schema_migrations(migration_key)
    values('v17.5_repair_explore_welcome_entitlement');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from public.cantoa_schema_migrations
    where migration_key='v18.7_two_free_songs_and_regional_pricing'
  ) then
    update public.memberships
       set free_songs_remaining = case
             when plan='Explore' and status='active' and free_song_claimed then 1
             when plan='Explore' and status='active' then 2
             else 0
           end,
           minutes_remaining = case
             when plan='Explore' and status='active' then 2
             else minutes_remaining
           end,
           updated_at=(extract(epoch from now())*1000)::bigint;
    insert into public.cantoa_schema_migrations(migration_key)
    values('v18.7_two_free_songs_and_regional_pricing');
  end if;
end $$;

create or replace function public.reserve_generation_minutes(p_user_id uuid,p_minutes numeric)
returns numeric language plpgsql security definer set search_path=public as $$
declare
  current_plan text;
  current_status text;
  current_minutes numeric;
  free_remaining integer;
  remaining numeric;
begin
  select plan,status,minutes_remaining,free_songs_remaining
    into current_plan,current_status,current_minutes,free_remaining
  from memberships where user_id=p_user_id for update;
  if current_status is distinct from 'active' then raise exception 'USAGE_NOT_CONFIGURED'; end if;
  if current_plan='Explore' then
    if coalesce(free_remaining,0) <= 0 then raise exception 'FREE_SONGS_USED'; end if;
    if p_minutes>2 then raise exception 'FREE_SONG_TOO_LONG'; end if;
    update memberships
       set free_songs_remaining=greatest(0,free_songs_remaining-1),
           free_song_claimed=(free_songs_remaining-1)<=0,
           minutes_remaining=case when (free_songs_remaining-1)>0 then 2 else 0 end,
           updated_at=(extract(epoch from now())*1000)::bigint
     where user_id=p_user_id
     returning free_songs_remaining into free_remaining;
    return free_remaining;
  end if;
  update memberships set minutes_remaining=minutes_remaining-p_minutes,updated_at=(extract(epoch from now())*1000)::bigint
    where user_id=p_user_id and status='active' and minutes_remaining>=p_minutes
    returning minutes_remaining into remaining;
  if remaining is null then raise exception 'INSUFFICIENT_MINUTES'; end if;
  return remaining;
end $$;

create or replace function public.refund_generation_minutes(p_user_id uuid,p_minutes numeric)
returns void language plpgsql security definer set search_path=public as $$
declare current_plan text;
begin
  select plan into current_plan from memberships where user_id=p_user_id for update;
  if current_plan='Explore' then
    update memberships
       set free_songs_remaining=least(2,free_songs_remaining+1),
           free_song_claimed=false,
           minutes_remaining=2,
           updated_at=(extract(epoch from now())*1000)::bigint
     where user_id=p_user_id;
  else
    update memberships set minutes_remaining=minutes_remaining+p_minutes,updated_at=(extract(epoch from now())*1000)::bigint where user_id=p_user_id;
  end if;
end $$;
revoke all on function public.reserve_generation_minutes(uuid,numeric) from public,anon,authenticated;
revoke all on function public.refund_generation_minutes(uuid,numeric) from public,anon,authenticated;
grant execute on function public.reserve_generation_minutes(uuid,numeric) to service_role;
grant execute on function public.refund_generation_minutes(uuid,numeric) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('songs','songs',false,52428800,array['audio/mpeg','audio/wav','audio/mp4','text/plain'])
on conflict(id) do update set public=false,allowed_mime_types=excluded.allowed_mime_types;

-- v17: opt-in public gift/share pages. The private audio bucket remains private;
-- the server issues short-lived signed URLs only when a valid share token is open.
alter table public.songs add column if not exists public_share boolean not null default false;
alter table public.songs add column if not exists share_token text unique;
alter table public.songs add column if not exists gift_to text;
alter table public.songs add column if not exists dedication text;
create index if not exists songs_share_token_idx on public.songs(share_token) where public_share=true;


-- v17.5: backfill accounts created before the membership trigger was installed.
insert into public.memberships(user_id,email,plan,status,minutes_remaining,free_song_claimed,free_songs_remaining,updated_at)
select id,email,'Explore','active',2,false,2,(extract(epoch from now())*1000)::bigint
from auth.users
on conflict(user_id) do nothing;

-- v17.5: server-side abuse throttling for provider-backed endpoints.
create table if not exists public.cantoa_rate_limits (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);
create index if not exists cantoa_rate_limits_lookup_idx on public.cantoa_rate_limits(user_id,action,created_at desc);
alter table public.cantoa_rate_limits enable row level security;

create or replace function public.check_cantoa_rate_limit(p_user_id uuid,p_action text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare recent_count integer;
begin
  delete from cantoa_rate_limits where user_id=p_user_id and created_at < now() - interval '24 hours';
  select count(*) into recent_count from cantoa_rate_limits
    where user_id=p_user_id and action=p_action
      and created_at >= now() - make_interval(secs => greatest(1,p_window_seconds));
  if recent_count >= greatest(1,p_limit) then return false; end if;
  insert into cantoa_rate_limits(user_id,action) values(p_user_id,left(p_action,40));
  return true;
end $$;
revoke all on function public.check_cantoa_rate_limit(uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.check_cantoa_rate_limit(uuid,text,integer,integer) to service_role;


-- v17.8: Gift Experience 2.0 sender attribution and privacy-preserving recipient reactions.
alter table public.songs add column if not exists gift_from text;
create table if not exists public.gift_reactions (
  id bigint generated by default as identity primary key,
  song_id uuid not null references public.songs(id) on delete cascade,
  fingerprint text not null,
  reaction text not null check (reaction in ('love','wow','moved','celebrate')),
  created_at timestamptz not null default now(),
  unique(song_id,fingerprint)
);
create index if not exists gift_reactions_song_idx on public.gift_reactions(song_id,created_at desc);
alter table public.gift_reactions enable row level security;

-- v18.5: owner-only provider analytics and generation-cost observability.
-- This table contains compact operational metadata, not lyrics or full prompts.
create table if not exists public.generation_events (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  plan text,
  request_type text not null,
  provider text,
  preferred_provider text,
  attempted_providers text[] not null default '{}',
  fallback_used boolean not null default false,
  requested_seconds integer not null default 0,
  charged_minutes numeric(10,4) not null default 0,
  estimated_cost_usd numeric(10,4),
  cost_basis text,
  latency_ms integer,
  status text not null check (status in ('success','failed','refunded')),
  error_code text,
  request_summary text,
  created_at timestamptz not null default now()
);
create index if not exists generation_events_created_idx on public.generation_events(created_at desc);
create index if not exists generation_events_provider_idx on public.generation_events(provider,created_at desc);
create index if not exists generation_events_user_idx on public.generation_events(user_id,created_at desc);
alter table public.generation_events enable row level security;
-- Intentionally no client RLS policies. Owner analytics are served only through
-- authenticated server routes using the service-role client after an owner check.

insert into public.cantoa_schema_migrations(migration_key)
values('v18.5_generation_observability')
on conflict(migration_key) do nothing;

-- v18.7.4: repair the two-free-creation launch entitlement.
-- Signing in must never consume a free creation. Earlier accounts could inherit the old
-- one-song state and therefore appear to lose a creation immediately after sign-in.
-- Recalculate from cloud-saved songs created after the v18.7 entitlement launch. This
-- intentionally favors the customer if a historical/failed test is ambiguous.
do $$
declare
  launch_at timestamptz;
begin
  if not exists (
    select 1 from public.cantoa_schema_migrations
    where migration_key='v18.7.4_free_creation_signin_repair'
  ) then
    select applied_at into launch_at
      from public.cantoa_schema_migrations
      where migration_key='v18.7_two_free_songs_and_regional_pricing';

    if launch_at is null then launch_at := now(); end if;

    update public.memberships m
       set free_songs_remaining = greatest(
             0,
             2 - least(2, (
               select count(*)::integer
               from public.songs s
               where s.user_id=m.user_id
                 and to_timestamp(s.created_at / 1000.0) >= launch_at
             ))
           ),
           free_song_claimed = (
             2 - least(2, (
               select count(*)::integer
               from public.songs s
               where s.user_id=m.user_id
                 and to_timestamp(s.created_at / 1000.0) >= launch_at
             ))
           ) <= 0,
           minutes_remaining = case
             when greatest(
               0,
               2 - least(2, (
                 select count(*)::integer
                 from public.songs s
                 where s.user_id=m.user_id
                   and to_timestamp(s.created_at / 1000.0) >= launch_at
               ))
             ) > 0 then 2 else 0 end,
           updated_at=(extract(epoch from now())*1000)::bigint
     where m.plan='Explore' and m.status='active';

    insert into public.cantoa_schema_migrations(migration_key)
    values('v18.7.4_free_creation_signin_repair');
  end if;
end $$;
