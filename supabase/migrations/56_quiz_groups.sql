-- 56_quiz_groups.sql
-- GROUPS (owner request, 2026-09-17): a player makes a group, shares one link
-- or code, and everyone in it gets a private daily board, per-game boards,
-- member stats and history.
--
-- A GROUP IS A LENS OVER THE EXISTING BOARDS, never a second scoring path.
-- Nothing here stores a result. /api/quiz/daily-combined?group=<code> runs the
-- same scoreGame / combineDaily over the same rows and keeps only the members,
-- so a group board can never disagree with the site board about a result.
--
-- MEMBERS ARE ACCOUNTS (quiz_users rows). A guest who joins from an invite
-- link first gets the same name-only account /api/quiz/join makes today, so
-- every member has a user_id and every one of their plays is attributable.
--
-- Access is server-only, exactly like quiz_users (migration 20): RLS on with
-- NO policies, so the anon key cannot read or write either table. Every read
-- and write goes through the service-role routes under /api/groups.
--
-- Caps (50 members, 5 groups per player) are enforced in lib/groups.js, not
-- here, so they can change without a migration.

create table if not exists quiz_groups (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  owner_id uuid references quiz_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists quiz_groups_code_key on quiz_groups (upper(code));

create table if not exists quiz_group_members (
  group_id uuid not null references quiz_groups(id) on delete cascade,
  user_id uuid not null references quiz_users(id) on delete cascade,
  role text not null default 'member',   -- 'owner' | 'member'
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists quiz_group_members_user on quiz_group_members (user_id);

alter table quiz_groups enable row level security;
alter table quiz_group_members enable row level security;
