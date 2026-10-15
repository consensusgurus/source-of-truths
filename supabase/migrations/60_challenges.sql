-- 60_challenges.sql
--
-- CHALLENGE A FRIEND, WITH A RETURN LEG (owner, 2026-10-15).
--
-- Until now a challenge lived entirely in its link (lib/challenge.js): no row,
-- no count, and the sender never learned who took it. Two tables give it the
-- missing half without changing what the link carries for the receiver:
--
--   quiz_challenges        one row per SEND. The link gains c=<cid>, a short
--                          random id the browser mints, so the send costs the
--                          player nothing (the row is written fire-and-forget).
--   quiz_challenge_takes   one row per PERSON who opened it, filled in when they
--                          finish. A link dropped in a group chat can have many.
--
-- NOTHING HERE SCORES. The figures are copies of what the link already carries
-- and what the receiver's own end card computed, kept so the sender's home can
-- say "Sam beat your 1:24 by 9 seconds". Leaderboards never read these tables,
-- and drawing tickets still come only from quiz_referrals.
--
-- Access is server-only, like quiz_users and the groups tables: RLS on with no
-- policies, so every read and write goes through the service-role routes under
-- /api/challenge.
--
-- Apply in the Supabase SQL editor (service role), like every migration here.
-- Safe to run twice.

create table if not exists quiz_challenges (
  id uuid primary key default gen_random_uuid(),
  cid text not null,
  game_key text not null,
  num integer,
  day text,
  sender_user_id uuid references quiz_users(id) on delete set null,
  sender_anon text,
  sender_name text,
  fig jsonb,
  source text,
  created_at timestamptz not null default now()
);
create unique index if not exists quiz_challenges_cid_key on quiz_challenges (cid);
create index if not exists quiz_challenges_sender_user on quiz_challenges (sender_user_id, created_at desc);
create index if not exists quiz_challenges_sender_anon on quiz_challenges (sender_anon, created_at desc);
create index if not exists quiz_challenges_created on quiz_challenges (created_at desc);

create table if not exists quiz_challenge_takes (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references quiz_challenges(id) on delete cascade,
  taker_anon text not null,
  taker_user_id uuid references quiz_users(id) on delete set null,
  taker_name text,
  opened_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  fig jsonb,
  outcome text,              -- the TAKER's result against the sender: win | loss | tie
  new_player boolean,        -- no play on record before they opened the link
  seen_at timestamptz        -- the sender has seen (or closed) this result
);
create unique index if not exists quiz_challenge_takes_one on quiz_challenge_takes (challenge_id, taker_anon);
create index if not exists quiz_challenge_takes_opened on quiz_challenge_takes (opened_at desc);

alter table quiz_challenges enable row level security;
alter table quiz_challenge_takes enable row level security;
