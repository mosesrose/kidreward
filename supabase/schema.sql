-- ============================================================
-- KidReward — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Profiles ────────────────────────────────────────────────
-- Extends auth.users with app-specific fields
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  role        text not null check (role in ('parent', 'child')),
  avatar_emoji text not null default '🧒',
  created_at  timestamptz default now(),
  current_streak    integer not null default 0,
  longest_streak    integer not null default 0,
  last_streak_date  date
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Parent can read child profiles"
  on public.profiles for select using (
    exists (
      select 1 from public.family_members fm
      join public.families f on f.id = fm.family_id
      where fm.child_id = profiles.id and f.parent_id = auth.uid()
    )
  );

-- ── Families ────────────────────────────────────────────────
create table public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now()
);

alter table public.families enable row level security;

create policy "Parent can manage own family"
  on public.families for all using (auth.uid() = parent_id);

create policy "Children can read their family"
  on public.families for select using (
    exists (
      select 1 from public.family_members
      where family_id = families.id and child_id = auth.uid()
    )
  );

-- ── Family Members ───────────────────────────────────────────
create table public.family_members (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  child_id    uuid not null references public.profiles(id) on delete cascade,
  gem_balance integer not null default 0,
  total_gems_earned integer not null default 0,
  joined_at   timestamptz default now(),
  unique (family_id, child_id)
);

alter table public.family_members enable row level security;

-- SECURITY DEFINER helper: looks up a parent's family_id without triggering RLS
-- (needed to break circular dependency: families policy → family_members → families)
create or replace function public.parent_family_id(p_parent_id uuid)
returns uuid language sql security definer set search_path = public as $$
  select id from families where parent_id = p_parent_id limit 1;
$$;

create policy "Parent can manage family members"
  on public.family_members for all using (
    family_id = public.parent_family_id(auth.uid())
  );

create policy "Child can read own membership"
  on public.family_members for select using (auth.uid() = child_id);

create policy "Child can insert own membership"
  on public.family_members for insert with check (auth.uid() = child_id);

-- ── Invites ──────────────────────────────────────────────────
create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  code        text not null unique,
  email       text,                                            -- child's email; invite only valid for this address
  created_by  uuid not null references public.profiles(id),
  used_by     uuid references public.profiles(id),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  invite_type text not null default 'child' check (invite_type in ('child', 'parent')),
  status      text not null default 'pending' check (status in ('pending', 'used', 'cancelled')),
  used_at     timestamptz,
  created_at  timestamptz default now()
);

alter table public.invites enable row level security;

create policy "Parent can manage own invites"
  on public.invites for all using (auth.uid() = created_by);

create policy "Anyone can read unused invite by code"
  on public.invites for select using (used_at is null and expires_at > now());

create policy "Child can claim invite"
  on public.invites for update using (auth.uid() = used_by or used_by is null);

-- ── Co-Parents ───────────────────────────────────────────────
-- Links a co-parent (another parent-role user) to a family they were invited to manage
create table if not exists public.family_co_parents (
  family_id    uuid not null references public.families(id) on delete cascade,
  co_parent_id uuid not null references public.profiles(id) on delete cascade,
  invited_by   uuid not null references public.profiles(id),
  joined_at    timestamptz default now(),
  primary key (family_id, co_parent_id)
);

alter table public.family_co_parents enable row level security;

-- Helper function: returns the family_id a co-parent belongs to (used in RLS policies)
create or replace function public.co_parent_family_id(p_uid uuid)
returns uuid language sql security definer set search_path = public as $$
  select family_id from public.family_co_parents where co_parent_id = p_uid limit 1;
$$;

create policy "Co-parent can view own membership"
  on public.family_co_parents for select
  using (auth.uid() = co_parent_id or family_id in (select id from families where parent_id = auth.uid()));

create policy "Owner can delete co-parents"
  on public.family_co_parents for delete
  using (family_id in (select id from families where parent_id = auth.uid()));

create policy "Co-parent can join family"
  on public.family_co_parents for insert
  with check (auth.uid() = co_parent_id);

-- Additional RLS policies on other tables to grant co-parent access:
-- (families) "Co-parent can read family"
--   USING (id = public.co_parent_family_id(auth.uid()));
-- (challenges) "Co-parent can manage challenges"
--   USING (family_id = public.co_parent_family_id(auth.uid()));
-- (completions) "Co-parent can manage completions" (via challenge family_id)
-- (rewards) "Co-parent can manage rewards"
-- (redemptions) "Co-parent can manage redemptions"
-- (profiles) "Co-parent can read child profiles" (via family_members)
-- (family_members) "Co-parent can manage family members"
-- (invites) "Co-parent can manage invites"

-- ── Challenges ───────────────────────────────────────────────
create table public.challenges (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  child_id     uuid references public.profiles(id) on delete set null, -- null = all children
  title        text not null,
  description  text,
  category     text not null,
  emoji        text not null default '⭐',
  gem_reward   integer not null default 10,
  bonus_gems   integer not null default 0,
  status       text not null default 'active' check (status in ('active', 'completed', 'archived')),
  repeat_type  text not null default 'once' check (repeat_type in ('once', 'daily', 'weekly')),
  due_date     date,
  value        text check (value is null or value in (
                 'responsibility','kindness','patience','curiosity','courage','empathy'
               )),
  created_by   uuid not null references public.profiles(id),
  created_at   timestamptz default now()
);

alter table public.challenges enable row level security;

create policy "Parent can manage challenges in own family"
  on public.challenges for all using (
    exists (
      select 1 from public.families
      where id = challenges.family_id and parent_id = auth.uid()
    )
  );

create policy "Child can read own challenges"
  on public.challenges for select using (
    (child_id = auth.uid() or child_id is null)
    and exists (
      select 1 from public.family_members
      where family_id = challenges.family_id and child_id = auth.uid()
    )
  );

-- ── Challenge Completions ────────────────────────────────────
create table public.completions (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  child_id     uuid not null references public.profiles(id) on delete cascade,
  note         text,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  gems_awarded integer,
  submitted_at timestamptz default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid references public.profiles(id)
);

alter table public.completions enable row level security;

create policy "Child can submit completions"
  on public.completions for insert with check (auth.uid() = child_id);

create policy "Child can read own completions"
  on public.completions for select using (auth.uid() = child_id);

create policy "Parent can view and review completions"
  on public.completions for all using (
    exists (
      select 1 from public.challenges c
      join public.families f on f.id = c.family_id
      where c.id = completions.challenge_id and f.parent_id = auth.uid()
    )
  );

-- ── Rewards ──────────────────────────────────────────────────
create table public.rewards (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  title       text not null,
  description text,
  emoji       text not null default '🎁',
  gem_cost    integer not null,
  reward_type text not null default 'gift' check (reward_type in ('money', 'gift', 'screen_time', 'activity')),
  is_active   boolean not null default true,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz default now()
);

alter table public.rewards enable row level security;

create policy "Parent can manage rewards"
  on public.rewards for all using (
    exists (
      select 1 from public.families
      where id = rewards.family_id and parent_id = auth.uid()
    )
  );

create policy "Child can read active rewards"
  on public.rewards for select using (
    is_active = true
    and exists (
      select 1 from public.family_members
      where family_id = rewards.family_id and child_id = auth.uid()
    )
  );

-- ── Redemptions ──────────────────────────────────────────────
create table public.redemptions (
  id          uuid primary key default gen_random_uuid(),
  reward_id   uuid not null references public.rewards(id) on delete cascade,
  child_id    uuid not null references public.profiles(id) on delete cascade,
  family_id   uuid not null references public.families(id) on delete cascade,
  gems_spent  integer not null,
  status      text not null default 'pending' check (status in ('pending', 'fulfilled', 'rejected', 'consumed')),
  note        text,
  requested_at timestamptz default now(),
  fulfilled_at timestamptz
);

alter table public.redemptions enable row level security;

create policy "Child can request redemptions"
  on public.redemptions for insert with check (auth.uid() = child_id);

create policy "Child can read own redemptions"
  on public.redemptions for select using (auth.uid() = child_id);

create policy "Parent can manage redemptions"
  on public.redemptions for all using (
    exists (
      select 1 from public.families
      where id = redemptions.family_id and parent_id = auth.uid()
    )
  );

-- ── Gem transaction function ─────────────────────────────────
-- Called when parent approves a completion
create or replace function public.award_gems(
  p_child_id uuid,
  p_family_id uuid,
  p_gems integer
)
returns void language plpgsql security definer as $$
begin
  update public.family_members
  set
    gem_balance = gem_balance + p_gems,
    total_gems_earned = total_gems_earned + p_gems
  where child_id = p_child_id and family_id = p_family_id;
end;
$$;

-- Deduct gems when redeeming
create or replace function public.spend_gems(
  p_child_id uuid,
  p_family_id uuid,
  p_gems integer
)
returns void language plpgsql security definer as $$
begin
  update public.family_members
  set gem_balance = gem_balance - p_gems
  where child_id = p_child_id and family_id = p_family_id
    and gem_balance >= p_gems;

  if not found then
    raise exception 'Insufficient gems';
  end if;
end;
$$;
