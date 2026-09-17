-- Groups can be PUBLIC (owner, 2026-09-17).
--
-- Every group so far is invite-only: you need the five-letter code or the link.
-- A public group is also LISTED on /groups, where anyone can see it and join in
-- one tap. Private stays the default, so nothing that exists changes, and the
-- board itself is readable through a link either way (owner's call): the flag
-- decides listing and one-tap joining, not who may read the board.
alter table public.quiz_groups
  add column if not exists visibility text not null default 'private';

alter table public.quiz_groups
  drop constraint if exists quiz_groups_visibility_check;
alter table public.quiz_groups
  add constraint quiz_groups_visibility_check check (visibility in ('private', 'public'));

-- The listing reads only the public ones, newest first.
create index if not exists quiz_groups_visibility_idx
  on public.quiz_groups (visibility, created_at desc);
