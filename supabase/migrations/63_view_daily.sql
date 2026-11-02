-- Migration 63: daily visitors and page views, for the admin desk's all-time
-- highs (owner, 2026-11-02). Run this whole file in the Supabase SQL Editor.
--
-- SAFE TO APPLY LATE. lib/admin-pulse.js wraps every call; until this exists
-- the Pulse view simply leaves the visitor and page-view highs out.
--
-- One row per Eastern calendar day between p_since and p_until (inclusive):
-- distinct non-null visitor_id and all page views across both page-view logs,
-- the same definitions as site_view_trends() (migrations 30, 36, 59).
-- The desk keeps the history in stats_payloads (admin:viewdaily:v1), so after
-- a one-time backfill in 31-day slices it asks for yesterday and today only.
-- Both bounds become a created_at range, so the created_at indexes from
-- migrations 04 and 21 serve it. Service role only (no grant to anon).
create or replace function site_view_daily(
  p_since date,
  p_until date,
  p_tz    text default 'America/New_York'
)
returns table (day date, viewers bigint, views bigint)
language sql
stable
as $$
  with ev as (
    select visitor_id, created_at
      from view_events
     where created_at >= (p_since::timestamp at time zone p_tz)
       and created_at <  ((p_until + 1)::timestamp at time zone p_tz)
    union all
    select visitor_id, created_at
      from quiz_view_events
     where created_at >= (p_since::timestamp at time zone p_tz)
       and created_at <  ((p_until + 1)::timestamp at time zone p_tz)
  )
  select (created_at at time zone p_tz)::date as day,
         count(distinct visitor_id)::bigint   as viewers,
         count(*)::bigint                     as views
    from ev
   group by 1
   order by 1;
$$;

revoke all on function site_view_daily(date, date, text) from public, anon, authenticated;
