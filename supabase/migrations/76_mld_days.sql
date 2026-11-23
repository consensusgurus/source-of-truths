-- 76: MIND LOFT DAILY, WHO BUILDS A DAY (owner, 2026-11-22: "build that now",
-- after asking where he can see who created a day with Build Your Day).
--
-- One row per player per Eastern day they touched Mind Loft Daily. A player is
-- `u:<uuid>` when the browser's saved identity resolves to an account, else
-- `a:<anon id>` (the sot_quiz_anon id). Written only by /api/mld/event with the
-- service role; read only by /api/admin/my-day. Nothing public reads it.
--
--   setup     'new' the first time this browser ever saved a day, 'edit' when it
--             changed a saved day, null on a day it only opened the paper
--   keys      the day's puzzles in order, as last seen that day
--   done      how many of them were played that day (highest seen)
--
-- Safe to run more than once.

create table if not exists mld_days (
  player text not null,
  day date not null,
  user_id uuid,
  username text,
  anon_id text,
  keys text[] not null default '{}',
  pages int not null default 0,
  done int not null default 0,
  setup text,
  edits int not null default 0,
  opened_at timestamptz,
  finished_at timestamptz,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (player, day)
);
create index if not exists mld_days_day on mld_days (day desc);
create index if not exists mld_days_updated on mld_days (updated_at desc);

alter table mld_days enable row level security;
