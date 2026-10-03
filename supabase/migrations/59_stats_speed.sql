-- Migration 59: faster /admin and /sitestats (2026-10-02).
-- Run this whole file in the Supabase SQL Editor.
--
-- SAFE TO APPLY LATE. Every reader of what this file creates is wrapped and
-- falls back to the previous behaviour when a table or function is missing,
-- so the deploy works before this runs. It gets faster afterwards.
--
-- Measured on the live site 2026-10-02, before this work:
--   /admin            10.0s, 18 MB response
--   /api/sitestats    28.6s on a cache miss (71ms on a CDN hit)

-- -------------------------------------------------------------------------
-- 1. stats_payloads: the last computed payload for a stats surface, kept so
--    a cold lambda (every deploy makes every lambda cold) can answer at once
--    from the stored copy and refresh behind it. One row per key:
--      sitestats:v1        the public /sitestats payload
--      admin:analytics:v1  the admin Analytics payload (trimmed player lists)
--    payload is base64(gzip(JSON)), text so it survives PostgREST's JSON
--    transport, the same shape the two snapshot tables use.
--    Service-role only: RLS on, no policies. The admin payload carries player
--    emails, so the anon key must never read it.
-- -------------------------------------------------------------------------
create table if not exists stats_payloads (
  key         text primary key,
  payload     text not null,
  updated_at  timestamptz not null default now()
);
alter table stats_payloads enable row level security;

-- -------------------------------------------------------------------------
-- 2. quiz_results had no index on created_at, so every "plays since X" read
--    was a full scan. The three functions below all filter on it.
-- -------------------------------------------------------------------------
create index if not exists quiz_results_created_at on quiz_results (created_at desc);

-- -------------------------------------------------------------------------
-- 3. Quiz-player trends for /sitestats, computed in SQL so the route no
--    longer loads the whole quiz_results table to count three windows.
--    A player is the registered user_id, else the browser anon_id, else the
--    lone row id: the same rule playerKey() uses everywhere in the app.
--      *_d = last 24h   *_dp = the 24h before
--      *_w = last 7d    *_wp = the 7d before
--      *_m = last 30d   *_mp = the 30d before
--    Called with the service role only (no grant to anon).
-- -------------------------------------------------------------------------
create or replace function site_play_trends()
returns table (
  people_d bigint, people_dp bigint, people_w bigint, people_wp bigint, people_m bigint, people_mp bigint,
  plays_d  bigint, plays_dp  bigint, plays_w  bigint, plays_wp  bigint, plays_m  bigint, plays_mp  bigint,
  secs_d   bigint, secs_dp   bigint, secs_w   bigint, secs_wp   bigint, secs_m   bigint, secs_mp   bigint
)
language sql
stable
as $$
  with r as (
    select coalesce('u:' || user_id::text, 'a:' || anon_id::text, 'r:' || id::text) as pk,
           created_at,
           greatest(coalesce(time_elapsed, 0), 0)::bigint as te
      from quiz_results
     where created_at >= now() - interval '60 days'
  )
  select
    count(distinct pk) filter (where created_at >= now() - interval '1 day'),
    count(distinct pk) filter (where created_at <  now() - interval '1 day'   and created_at >= now() - interval '2 days'),
    count(distinct pk) filter (where created_at >= now() - interval '7 days'),
    count(distinct pk) filter (where created_at <  now() - interval '7 days'  and created_at >= now() - interval '14 days'),
    count(distinct pk) filter (where created_at >= now() - interval '30 days'),
    count(distinct pk) filter (where created_at <  now() - interval '30 days' and created_at >= now() - interval '60 days'),
    count(*) filter (where created_at >= now() - interval '1 day'),
    count(*) filter (where created_at <  now() - interval '1 day'   and created_at >= now() - interval '2 days'),
    count(*) filter (where created_at >= now() - interval '7 days'),
    count(*) filter (where created_at <  now() - interval '7 days'  and created_at >= now() - interval '14 days'),
    count(*) filter (where created_at >= now() - interval '30 days'),
    count(*) filter (where created_at <  now() - interval '30 days' and created_at >= now() - interval '60 days'),
    coalesce(sum(te) filter (where created_at >= now() - interval '1 day'), 0)::bigint,
    coalesce(sum(te) filter (where created_at <  now() - interval '1 day'   and created_at >= now() - interval '2 days'), 0)::bigint,
    coalesce(sum(te) filter (where created_at >= now() - interval '7 days'), 0)::bigint,
    coalesce(sum(te) filter (where created_at <  now() - interval '7 days'  and created_at >= now() - interval '14 days'), 0)::bigint,
    coalesce(sum(te) filter (where created_at >= now() - interval '30 days'), 0)::bigint,
    coalesce(sum(te) filter (where created_at <  now() - interval '30 days' and created_at >= now() - interval '60 days'), 0)::bigint
  from r;
$$;

-- Today's plays by hour of day in the display timezone: distinct players and
-- play count, one row per hour that had activity.
create or replace function site_play_hourly_today(p_tz text default 'America/New_York')
returns table (hour int, people bigint, plays bigint)
language sql
stable
as $$
  select
    extract(hour from (created_at at time zone p_tz))::int,
    count(distinct coalesce('u:' || user_id::text, 'a:' || anon_id::text, 'r:' || id::text))::bigint,
    count(*)::bigint
  from quiz_results
  where created_at >= (date_trunc('day', now() at time zone p_tz)) at time zone p_tz
  group by 1
  order by 1;
$$;

-- Today's most played quiz ids. The route filters hidden quizzes and keeps
-- five, so this returns a few more than it shows.
create or replace function site_play_top_today(p_tz text default 'America/New_York', p_limit int default 40)
returns table (quiz_id text, plays bigint)
language sql
stable
as $$
  select quiz_id, count(*)::bigint
    from quiz_results
   where created_at >= (date_trunc('day', now() at time zone p_tz)) at time zone p_tz
   group by quiz_id
   order by 2 desc, 1
   limit greatest(1, least(p_limit, 200));
$$;
