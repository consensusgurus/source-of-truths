-- 75: PRIVATE MURALS (owner, 2026-11-19: "ability to do murals with your group
-- or with A group").
--
-- A private mural's board is one more row in mural_boards (kind 'private', id
-- `mural-p<code>`), so placing, the snapshot, the standings and the wall all work
-- on it unchanged. This table says who started it and, when it is a group's
-- mural, which group: a group's mural takes pieces from members only, a link-only
-- one from anyone with the link.
--
-- Nothing on the public Mural path reads this table. mural_shelf() (migration 71)
-- already lists only `mural-YYYY-MM-DD` ids, so a private mural is never on the
-- public shelf, and it is never the open Mural (currentBoard asks for kind
-- 'mural' / 'muraltoo'). A private mural files no site points: the place and
-- credit routes skip mural_credit() for it.
--
-- Safe to run more than once.

create table if not exists mural_private (
  mural_id text primary key references mural_boards(id) on delete cascade,
  code text not null,
  owner text not null,
  owner_user uuid,
  owner_name text,
  group_id uuid references quiz_groups(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists mural_private_code on mural_private (code);
create index if not exists mural_private_owner on mural_private (owner);
create index if not exists mural_private_group on mural_private (group_id) where group_id is not null;

alter table mural_private enable row level security;
