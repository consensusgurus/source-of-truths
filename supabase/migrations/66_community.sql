-- 66_community.sql
-- THE COMMUNITY PAGE (owner, 2026-11-18: "Implement. Leave store as coming
-- soon for actual products."). Three things players write:
--
--   Post-Game Talk   one discussion per daily puzzle per day. Only a player who
--                    has finished that puzzle can read or post (the route checks
--                    quiz_results), so there are no spoilers and nothing mid game.
--                    Posts carry the poster's real result, snapshotted at post time.
--   The feel poll    Gentle / Moderate / Tough, one tap per player per puzzle-day.
--   The Idea Board   pitch a New Puzzle, a Variation or a Site Fix; one vote per
--                    idea per player; stages open -> review -> workshop -> built.
--
-- Cheers on posts, and reports on posts and ideas, are their own tables so a
-- player can cheer or report once. Three reports hide an item until the admin
-- looks at it; the admin can hide, restore, pin a Maker post and move an idea's
-- stage from the community pages themselves (isAdmin cookie).
--
-- Access is server-only, exactly like quiz_users and the group tables: RLS on
-- with NO policies, so the anon key cannot read or write any of it. Every read
-- and write goes through the service-role routes under /api/community, and
-- every one of them tolerates these tables being absent (the pages then say
-- "The community is being set up").

create table if not exists community_posts (
  id bigserial primary key,
  game_key text not null,
  day text not null,                       -- the daily's date suffix, M-D-YY
  user_id uuid references quiz_users(id) on delete cascade,
  username text not null,
  body text not null,
  result text,                             -- e.g. "#8 of 20", at post time
  maker boolean not null default false,    -- the pinned Maker post
  cheers integer not null default 0,
  reports integer not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists community_posts_day on community_posts (day, game_key, created_at desc);
create index if not exists community_posts_user on community_posts (user_id, created_at desc);

create table if not exists community_post_cheers (
  post_id bigint not null references community_posts(id) on delete cascade,
  user_id uuid not null references quiz_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists community_feel (
  game_key text not null,
  day text not null,
  user_id uuid not null references quiz_users(id) on delete cascade,
  feel smallint not null check (feel between 1 and 3),   -- 1 Gentle, 2 Moderate, 3 Tough
  created_at timestamptz not null default now(),
  primary key (game_key, day, user_id)
);

create table if not exists community_ideas (
  id bigserial primary key,
  kind text not null check (kind in ('puzzle', 'variation', 'fix')),
  title text not null,
  body text,
  game_key text,                           -- the game a Variation is about
  user_id uuid references quiz_users(id) on delete set null,
  username text not null,
  votes integer not null default 0,
  stage text not null default 'open' check (stage in ('open', 'review', 'workshop', 'built')),
  reports integer not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  staged_at timestamptz
);
create index if not exists community_ideas_stage on community_ideas (stage, votes desc, created_at desc);

create table if not exists community_idea_votes (
  idea_id bigint not null references community_ideas(id) on delete cascade,
  user_id uuid not null references quiz_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create table if not exists community_reports (
  target text not null check (target in ('post', 'idea')),
  target_id bigint not null,
  user_id uuid not null references quiz_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (target, target_id, user_id)
);

alter table community_posts enable row level security;
alter table community_post_cheers enable row level security;
alter table community_feel enable row level security;
alter table community_ideas enable row level security;
alter table community_idea_votes enable row level security;
alter table community_reports enable row level security;
