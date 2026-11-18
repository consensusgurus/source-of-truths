-- Migration 65: the admin Pulse figures come from SQL, not from
-- the whole results table held in memory (owner, 2026-11-18).
-- Run this whole file in the Supabase SQL Editor, then run the backfill line at
-- the bottom once.
--
-- WHY. lib/admin-pulse.js (and lib/admin-integrity.js) read EVERY row of
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

-- pid: a small integer per player, so the hourly rollup counts distinct
-- integers rather than text keys (the micro instance spent ~5s hashing text).
alter table admin_player_first add column if not exists pid bigint generated always as identity;
create unique index if not exists admin_player_first_pid on admin_player_first (pid);

-- One row per (UTC hour, player): the rolling 24h / 7d / 30d windows are cut on
-- whole hours from this, the same way the visitor figures are (migration 64).
create table if not exists admin_play_hours (
  hour  timestamptz not null,
  pid   bigint      not null,
  plays integer     not null,
  secs  bigint      not null,
  primary key (hour, pid)
);

create table if not exists admin_rollup_state (
  name    text        primary key,
  through timestamptz not null
);

alter table admin_player_first enable row level security;
alter table admin_play_days    enable row level security;
alter table admin_play_hours   enable row level security;
alter table admin_rollup_state enable row level security;
revoke all on table admin_player_first, admin_play_days, admin_play_hours, admin_rollup_state from public, anon, authenticated;

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

  drop table if exists _apr;
  create temporary table _apr (pk text, day date, created_at timestamptz, te bigint) on commit drop;
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

  delete from admin_play_hours where hour >= v_from and hour < v_to;
  insert into admin_play_hours (hour, pid, plays, secs)
  select date_trunc('hour', a.created_at), f.pid, count(*)::int, sum(a.te)::bigint
    from _apr a join admin_player_first f on f.pk = a.pk
   group by 1, 2;

  insert into admin_rollup_state (name, through)
  values ('play_days', case when v_done then v_today else v_to end)
  on conflict (name) do update set through = excluded.through;

  return query select (case when v_done then v_today else v_to end), v_done;
end;
$$;

-- Rolling windows, cut on whole UTC hours like the visitor figures: "last 24h"
-- is the current partial hour plus the 23 before it. d / dp = last 24h and the
-- 24h before, dw = the same 24h one week earlier, w / wp = 7 days, m / mp = 30
-- days. Players, plays and time come from admin_play_hours; new players and
-- sign-ups are exact times. Call refresh_admin_play_rollup() first.
create or replace function admin_pulse_windows()
returns table (
  win text, players bigint, plays bigint, secs bigint, new_players bigint, signups bigint
)
language sql
stable
as $$
  with b as (select date_trunc('hour', now()) + interval '1 hour' as h1),
  w(win, lo_h, hi_h) as (
    values ('d', 0, 24), ('dp', 24, 48), ('dw', 168, 192), ('w', 0, 168), ('wp', 168, 336), ('m', 0, 720), ('mp', 720, 1440)
  ),
  r as (
    select ((extract(epoch from (b.h1 - x.hour)) / 3600)::int - 1) as ah, x.pid, x.plays, x.secs
      from admin_play_hours x, b
     where x.hour >= b.h1 - interval '1440 hours'
  ),
  agg as (
    select w.win,
           count(distinct r.pid) as players,
           coalesce(sum(r.plays), 0)::bigint as plays,
           coalesce(sum(r.secs), 0)::bigint as secs
      from w left join r on r.ah >= w.lo_h and r.ah < w.hi_h
     group by w.win
  ),
  ex as (
    select w.win,
           (select count(*) from admin_player_first f where f.first_at >= now() - make_interval(hours => w.hi_h) and f.first_at < now() - make_interval(hours => w.lo_h)) as np,
           (select count(*) from quiz_users u where u.created_at >= now() - make_interval(hours => w.hi_h) and u.created_at < now() - make_interval(hours => w.lo_h)) as su
      from w
  )
  select agg.win, agg.players, agg.plays, agg.secs, ex.np, ex.su
    from agg join ex using (win);
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
  with x as (
    select case when created_at >= now() - interval '7 days' then 0 else 1 end as half,
           referrer,
           coalesce('u:' || user_id::text, 'a:' || anon_id::text, 'r:' || id::text) as pk
      from quiz_results
     where created_at >= now() - interval '14 days'
       and referrer is not null and referrer <> ''
     group by 1, 2, 3
  )
  select half,
         regexp_replace(
           regexp_replace(
             regexp_replace(lower(btrim(referrer)), '^[a-z][a-z0-9+.-]*://', ''),
             '[/?#].*$', ''),
           '^(www\.|m\.|l\.|lm\.)+', ''),
         count(distinct pk)
    from x
   group by 1, 2;
$$;

-- Cheat Watch is NOT here. An all-SQL version (per-board first tries off a
-- board-day rollup) was tried on 2026-11-18 and took 48 to 54 seconds on the
-- micro instance, far past the 8s API timeout; repeated test runs in the SQL
-- Editor overloaded the database. Cheat Watch stays on the in-memory admin
-- cache (lib/admin-integrity.js) until there is a cheaper design.
drop function if exists admin_integrity(int, int, int, text);
drop function if exists admin_perfect_history(uuid[], text[], text);
drop table if exists admin_board_days;

revoke all on function refresh_admin_play_rollup(int) from public, anon, authenticated;
revoke all on function admin_pulse_windows() from public, anon, authenticated;
revoke all on function admin_play_daily(date, date) from public, anon, authenticated;
revoke all on function admin_pulse_referrers() from public, anon, authenticated;

-- BACKFILL: run once after the functions exist. It walks the whole history in
-- one go (a few seconds here; the app's own calls step 20 days at a time).
-- delete from admin_rollup_state where name = 'play_days';
-- select * from refresh_admin_play_rollup(1000);
