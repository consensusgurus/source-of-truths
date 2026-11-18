-- Migration 65: the admin Pulse and Cheat Watch figures come from SQL, not from
-- the whole results table held in memory (owner, 2026-11-18).
-- Run this whole file in the Supabase SQL Editor, then run the backfill line at
-- the bottom once.
--
-- WHY. lib/admin-pulse.js and lib/admin-integrity.js both read EVERY row of
-- quiz_results (600k+ rows, 18 columns) into the function's memory on each
-- build. That is what killed the desk's Refresh with "ran out of memory" and why
-- each build took 7 to 12 seconds. These functions hand back finished numbers.
--
-- WHAT.
--   admin_player_first   one row per player: the time of their first play.
--   admin_play_days      one row per (ET day, player) with that day's plays and
--                        seconds. A few thousand rows a day, far smaller than the
--                        raw table, and what DAU / WAU / MAU are counted from.
--   refresh_admin_play_rollup()  tops both up from the last finished ET day.
--                        Today is always re-read, since it is still filling.
--   admin_pulse_windows()  the rolling day / week / month figures (players,
--                        plays, seconds, new players, sign-ups) and the
--                        week-over-week 24 hours, anchored on now.
--   admin_play_daily(since, until)  one row per ET day: DAU, WAU, MAU, plays,
--                        seconds, new players, sign-ups. The app stores finished
--                        days, so after the backfill it asks for two days a build.
--   admin_pulse_referrers()  distinct players per referring host, this week and
--                        the week before. The app folds hosts (google.*, t.co).
--   admin_perfect_history(...)  Cheat Watch's jump test: for the named players,
--                        the perfect-finish rate on the first and second half of
--                        their first tries on daily boards, all time.
--
-- A player is user_id, else anon_id, else the row id (playerKey in the app).
-- Rows deleted from quiz_results after a day is rolled up stay counted in that
-- day; moderation deletes are rare and the desk is a trend view.
--
-- Service role only.

create table if not exists admin_player_first (
  pk       text        primary key,
  first_at timestamptz not null
);
create index if not exists admin_player_first_at on admin_player_first (first_at);

create table if not exists admin_play_days (
  day   date   not null,
  pk    text   not null,
  plays integer not null,
  secs  bigint  not null,
  primary key (day, pk)
);

create table if not exists admin_rollup_state (
  name    text        primary key,
  through timestamptz not null
);

alter table admin_player_first enable row level security;
alter table admin_play_days    enable row level security;
alter table admin_rollup_state enable row level security;
revoke all on table admin_player_first, admin_play_days, admin_rollup_state from public, anon, authenticated;

-- Tops up the rollup. Re-reads from the start of the last ET day it had not
-- finished, up to p_max_days days a call, and says whether it reached now.
create or replace function refresh_admin_play_rollup(p_max_days int default 20)
returns table (through timestamptz, caught_up boolean)
language plpgsql
volatile
as $$
#variable_conflict use_column
declare
  v_tz    text := 'America/New_York';
  v_now   timestamptz := now();
  v_today timestamptz := (date_trunc('day', now() at time zone 'America/New_York')) at time zone 'America/New_York';
  v_from  timestamptz;
  v_to    timestamptz;
  v_done  boolean;
begin
  perform pg_advisory_xact_lock(650065);
  select s.through into v_from from admin_rollup_state s where s.name = 'play_days';
  if v_from is null then
    select (date_trunc('day', min(created_at) at time zone v_tz)) at time zone v_tz into v_from from quiz_results;
    if v_from is null then v_from := v_today; end if;
  end if;
  -- v_from is always the start of an ET day. Step whole ET days (23 or 25 hours
  -- at the clock changes), so every rolled-up day is complete.
  v_to := ((((v_from at time zone v_tz)::date + greatest(1, p_max_days))::timestamp) at time zone v_tz);
  v_done := v_to > v_now;
  if v_done then v_to := v_now + interval '1 second'; end if;

  create temporary table if not exists _apr (pk text, day date, created_at timestamptz, te bigint) on commit drop;
  truncate _apr;
  insert into _apr
  select coalesce('u:' || user_id::text, 'a:' || anon_id::text, 'r:' || id::text),
         (created_at at time zone v_tz)::date,
         created_at,
         greatest(coalesce(time_elapsed, 0), 0)::bigint
    from quiz_results
   where created_at >= v_from and created_at < v_to;

  delete from admin_play_days
   where day >= (v_from at time zone v_tz)::date
     and day <= ((v_to - interval '1 microsecond') at time zone v_tz)::date;
  insert into admin_play_days (day, pk, plays, secs)
  select day, pk, count(*)::int, sum(te)::bigint from _apr group by day, pk;

  insert into admin_player_first (pk, first_at)
  select pk, min(created_at) from _apr group by pk
  on conflict (pk) do update set first_at = least(admin_player_first.first_at, excluded.first_at);

  insert into admin_rollup_state (name, through)
  values ('play_days', case when v_done then v_today else v_to end)
  on conflict (name) do update set through = excluded.through;

  return query select (case when v_done then v_today else v_to end), v_done;
end;
$$;

-- Rolling windows, anchored on now. Same cuts as the app's buildPulse:
-- d = last 24h, dp = the 24h before, dw = 8 to 7 days ago, w / wp = 7 days,
-- m / mp = 30 days. Players / plays / seconds read the raw rows of the last 60
-- days (the created_at index); new players read admin_player_first, so call
-- refresh_admin_play_rollup() first.
create or replace function admin_pulse_windows()
returns table (
  win text, players bigint, plays bigint, secs bigint, new_players bigint, signups bigint
)
language sql
stable
as $$
  with w(win, lo, hi) as (
    values ('d',  now() - interval '1 day',   now() + interval '1 second'),
           ('dp', now() - interval '2 days',  now() - interval '1 day'),
           ('dw', now() - interval '8 days',  now() - interval '7 days'),
           ('w',  now() - interval '7 days',  now() + interval '1 second'),
           ('wp', now() - interval '14 days', now() - interval '7 days'),
           ('m',  now() - interval '30 days', now() + interval '1 second'),
           ('mp', now() - interval '60 days', now() - interval '30 days')
  ),
  r as (
    select coalesce('u:' || user_id::text, 'a:' || anon_id::text, 'r:' || id::text) as pk,
           created_at,
           greatest(coalesce(time_elapsed, 0), 0)::bigint as te
      from quiz_results
     where created_at >= now() - interval '60 days'
  ),
  agg as (
    select w.win, count(distinct r.pk) as players, count(r.pk) as plays, coalesce(sum(r.te), 0)::bigint as secs
      from w left join r on r.created_at >= w.lo and r.created_at < w.hi
     group by w.win
  ),
  np as (
    select w.win, count(f.pk) as n
      from w left join admin_player_first f on f.first_at >= w.lo and f.first_at < w.hi
     group by w.win
  ),
  su as (
    select w.win, count(u.id) as n
      from w left join quiz_users u on u.created_at >= w.lo and u.created_at < w.hi
     group by w.win
  )
  select agg.win, agg.players, agg.plays, agg.secs, np.n, su.n
    from agg join np using (win) join su using (win);
$$;

-- One row per ET day from p_since to p_until (inclusive), off the rollup.
create or replace function admin_play_daily(p_since date, p_until date)
returns table (
  day date, dau bigint, wau bigint, mau bigint, plays bigint, secs bigint, new_players bigint, signups bigint
)
language sql
stable
as $$
  with d as (
    select g::date as day from generate_series(p_since, p_until, interval '1 day') g
  ),
  base as (
    select day, count(*) as dau, sum(plays)::bigint as plays, sum(secs)::bigint as secs
      from admin_play_days where day between p_since and p_until group by day
  ),
  np as (
    select (first_at at time zone 'America/New_York')::date as day, count(*) as n
      from admin_player_first
     where first_at >= (p_since::timestamp at time zone 'America/New_York') - interval '1 day'
       and first_at <  ((p_until + 1)::timestamp at time zone 'America/New_York') + interval '1 day'
     group by 1
  ),
  su as (
    select (created_at at time zone 'America/New_York')::date as day, count(*) as n
      from quiz_users
     where created_at >= (p_since::timestamp at time zone 'America/New_York') - interval '1 day'
       and created_at <  ((p_until + 1)::timestamp at time zone 'America/New_York') + interval '1 day'
     group by 1
  )
  select d.day,
         coalesce(base.dau, 0),
         (select count(distinct x.pk) from admin_play_days x where x.day between d.day - 6 and d.day),
         (select count(distinct x.pk) from admin_play_days x where x.day between d.day - 29 and d.day),
         coalesce(base.plays, 0),
         coalesce(base.secs, 0),
         coalesce(np.n, 0),
         coalesce(su.n, 0)
    from d
    left join base on base.day = d.day
    left join np on np.day = d.day
    left join su on su.day = d.day
   order by d.day;
$$;

-- Distinct players per referring host: half 0 = the last 7 days, 1 = the 7
-- before. The host is the referrer lowercased, without scheme, path, query or a
-- leading www. / m. / l. / lm.; the app's refHost() folds the rest.
create or replace function admin_pulse_referrers()
returns table (half int, host text, players bigint)
language sql
stable
as $$
  select case when created_at >= now() - interval '7 days' then 0 else 1 end,
         regexp_replace(
           regexp_replace(
             regexp_replace(lower(btrim(referrer)), '^[a-z][a-z0-9+.-]*://', ''),
             '[/?#].*$', ''),
           '^(www\.|m\.|l\.|lm\.)+', ''),
         count(distinct coalesce('u:' || user_id::text, 'a:' || anon_id::text, 'r:' || id::text))
    from quiz_results
   where created_at >= now() - interval '14 days'
     and referrer is not null and btrim(referrer) <> ''
   group by 1, 2;
$$;

-- Cheat Watch jump test, for the players it is about to score. A first try is
-- the player's lowest-id row on a board; boards are dated daily ids that are not
-- Arcade (p_arcade_re is the app's Arcade id pattern). Only boards with a total
-- count. `mid_at` is the time of the first try that opens the second half.
create or replace function admin_perfect_history(p_uids uuid[], p_anons text[], p_arcade_re text)
returns table (pk text, n bigint, before_rate numeric, after_rate numeric, mid_at timestamptz)
language sql
stable
as $$
  with r as (
    select id, quiz_id, score, total, created_at,
           coalesce('u:' || user_id::text, 'a:' || anon_id::text) as pk
      from quiz_results
     where (user_id = any(p_uids))
        or (user_id is null and anon_id = any(p_anons))
  ),
  ft as (
    select distinct on (pk, quiz_id) pk, quiz_id, score, total, created_at
      from r
     where quiz_id ~ '^[a-z0-9]+-\d{1,2}-\d{1,2}-\d{2}'
       and (p_arcade_re is null or quiz_id !~ p_arcade_re)
     order by pk, quiz_id, id
  ),
  h as (
    select pk, created_at, (score >= total) as perfect,
           row_number() over (partition by pk order by created_at) as rn,
           count(*) over (partition by pk) as n
      from ft where total > 0
  )
  select pk, n,
         avg(case when perfect then 1 else 0 end) filter (where rn <= n / 2),
         avg(case when perfect then 1 else 0 end) filter (where rn > n / 2),
         max(created_at) filter (where rn = n / 2 + 1)
    from h
   group by pk, n;
$$;

revoke all on function refresh_admin_play_rollup(int) from public, anon, authenticated;
revoke all on function admin_pulse_windows() from public, anon, authenticated;
revoke all on function admin_play_daily(date, date) from public, anon, authenticated;
revoke all on function admin_pulse_referrers() from public, anon, authenticated;
revoke all on function admin_perfect_history(uuid[], text[], text) from public, anon, authenticated;

-- BACKFILL: run once after the functions exist. It walks the whole history in
-- one go (a few seconds here; the app's own calls step 20 days at a time).
-- select * from refresh_admin_play_rollup(1000);
