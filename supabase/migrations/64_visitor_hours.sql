-- Migration 64: visitor figures from an hourly rollup (owner, 2026-11-11).
-- Run this whole file in the Supabase SQL Editor.
--
-- WHY. site_view_trends() (migration 59) grouped 60 days of RAW page views from
-- view_events + quiz_view_events on every call. Traffic roughly tripled month on
-- month in Oct/Nov 2026, the scan outgrew Postgres's statement timeout, and the
-- admin Pulse and /sitestats both showed "canceling statement due to statement
-- timeout" for visitors and page views.
--
-- WHAT. view_visitor_hours keeps one row per (hour, visitor) with that hour's
-- page views. refresh_view_visitor_hours() tops it up incrementally (it re-reads
-- only from the last stored hour, which may have been partial, to now), and
-- site_view_trends() now reads the rollup, which is far smaller than the raw logs.
-- Rows with a null visitor_id are kept under visitor_id '' so they still count as
-- page views but never as a visitor (the definition from migrations 30/36/59).
--
-- WINDOWS are whole UTC hours: "last 24h" is the current partial hour plus the
-- 23 before it, and every comparison window is cut the same way.
--
-- site_view_trends2() adds viewers_dw / views_dw: the same 24 hours one week
-- earlier (168 hours back), for the Pulse week-over-week column.
-- site_view_trends() keeps its exact name and columns for /sitestats.
--
-- Service role only.

create table if not exists view_visitor_hours (
  hour       timestamptz not null,
  visitor_id text        not null,
  views      integer     not null,
  primary key (hour, visitor_id)
);
alter table view_visitor_hours enable row level security;
revoke all on table view_visitor_hours from public, anon, authenticated;

create or replace function refresh_view_visitor_hours(p_max_hours int default 168)
returns table (hours_done int, through timestamptz, caught_up boolean)
language plpgsql
volatile
as $$
declare
  v_now  timestamptz := date_trunc('hour', now());
  v_from timestamptz;
  v_to   timestamptz;
begin
  -- One refresher at a time, so two desk builds cannot race the delete/insert.
  perform pg_advisory_xact_lock(640064);
  select max(hour) into v_from from view_visitor_hours;
  if v_from is null then v_from := v_now - interval '61 days'; end if;
  v_to := least(v_now + interval '1 hour', v_from + make_interval(hours => greatest(1, p_max_hours)));

  delete from view_visitor_hours where hour >= v_from and hour < v_to;
  insert into view_visitor_hours (hour, visitor_id, views)
  select date_trunc('hour', created_at), coalesce(visitor_id, ''), count(*)::int
    from (
      select visitor_id, created_at from view_events
       where created_at >= v_from and created_at < v_to
      union all
      select visitor_id, created_at from quiz_view_events
       where created_at >= v_from and created_at < v_to
    ) ev
   group by 1, 2;

  delete from view_visitor_hours where hour < v_now - interval '62 days';

  return query select (extract(epoch from (v_to - v_from)) / 3600)::int, v_to, v_to > v_now;
end;
$$;
revoke all on function refresh_view_visitor_hours(int) from public, anon, authenticated;

create or replace function site_view_trends2()
returns table (
  viewers_d  bigint, viewers_dp bigint, viewers_dw bigint,
  viewers_w  bigint, viewers_wp bigint,
  viewers_m  bigint, viewers_mp bigint,
  views_d    bigint, views_dp   bigint, views_dw   bigint,
  views_w    bigint, views_wp   bigint,
  views_m    bigint, views_mp   bigint
)
language sql
stable
as $$
  with b as (select date_trunc('hour', now()) as h),
  per as (
    select
      vh.visitor_id,
      sum(vh.views) filter (where vh.hour >  b.h - interval '24 hours') as c_d,
      sum(vh.views) filter (where vh.hour <= b.h - interval '24 hours'  and vh.hour > b.h - interval '48 hours')  as c_dp,
      sum(vh.views) filter (where vh.hour <= b.h - interval '168 hours' and vh.hour > b.h - interval '192 hours') as c_dw,
      sum(vh.views) filter (where vh.hour >  b.h - interval '168 hours') as c_w,
      sum(vh.views) filter (where vh.hour <= b.h - interval '168 hours' and vh.hour > b.h - interval '336 hours') as c_wp,
      sum(vh.views) filter (where vh.hour >  b.h - interval '720 hours') as c_m,
      sum(vh.views) filter (where vh.hour <= b.h - interval '720 hours' and vh.hour > b.h - interval '1440 hours') as c_mp
    from view_visitor_hours vh, b
    where vh.hour > b.h - interval '1440 hours'
    group by vh.visitor_id
  )
  select
    count(*) filter (where visitor_id <> '' and c_d  > 0),
    count(*) filter (where visitor_id <> '' and c_dp > 0),
    count(*) filter (where visitor_id <> '' and c_dw > 0),
    count(*) filter (where visitor_id <> '' and c_w  > 0),
    count(*) filter (where visitor_id <> '' and c_wp > 0),
    count(*) filter (where visitor_id <> '' and c_m  > 0),
    count(*) filter (where visitor_id <> '' and c_mp > 0),
    coalesce(sum(c_d), 0)::bigint,
    coalesce(sum(c_dp), 0)::bigint,
    coalesce(sum(c_dw), 0)::bigint,
    coalesce(sum(c_w), 0)::bigint,
    coalesce(sum(c_wp), 0)::bigint,
    coalesce(sum(c_m), 0)::bigint,
    coalesce(sum(c_mp), 0)::bigint
  from per;
$$;
revoke all on function site_view_trends2() from public, anon, authenticated;

-- Same name and columns as migration 59, so /sitestats needs no change.
create or replace function site_view_trends()
returns table (
  viewers_d  bigint, viewers_dp bigint,
  viewers_w  bigint, viewers_wp bigint,
  viewers_m  bigint, viewers_mp bigint,
  views_d    bigint, views_dp   bigint,
  views_w    bigint, views_wp   bigint,
  views_m    bigint, views_mp   bigint
)
language sql
stable
as $$
  select viewers_d, viewers_dp, viewers_w, viewers_wp, viewers_m, viewers_mp,
         views_d, views_dp, views_w, views_wp, views_m, views_mp
    from site_view_trends2();
$$;

-- BACKFILL: 61 days in one-week slices. Each line is its own short scan.
-- If the editor stops partway, just run the file again: every call resumes
-- from the last stored hour. The desk also catches up on its own.
select * from refresh_view_visitor_hours(168);
select * from refresh_view_visitor_hours(168);
select * from refresh_view_visitor_hours(168);
select * from refresh_view_visitor_hours(168);
select * from refresh_view_visitor_hours(168);
select * from refresh_view_visitor_hours(168);
select * from refresh_view_visitor_hours(168);
select * from refresh_view_visitor_hours(168);
select * from refresh_view_visitor_hours(168);
select * from refresh_view_visitor_hours(168);
