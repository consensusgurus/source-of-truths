-- 61_email_at.sql
--
-- WHEN AN EMAIL WAS ADDED (owner, 2026-10-21). The $500 drawing gives tickets
-- only from the moment a player has an email on their account ("if you add
-- one, that's when tickets start, you don't get earned ones prior"), and gives
-- a referrer half a ticket once a friend they brought in adds one. Neither is
-- possible without knowing WHEN the email arrived, and quiz_users only knew
-- whether it was there.
--
--   email_at   set when an email first lands on the account (insert or update),
--              kept when the email is merely changed, cleared if it is removed.
--
-- A trigger rather than application code, because an email reaches quiz_users
-- through several routes (join, sign-in recovery, admin) and every one of them
-- must stamp it the same way.
--
-- BACKFILL: accounts that already have an email get their creation time. Most
-- joined with one; for the rest the true moment is unknown, and the drawing
-- clamps to its own start (October 9) anyway, so this only matters for an
-- account created during the drawing that added an email later.
--
-- lib/drawing-server.js reads email_at when the column exists and falls back to
-- created_at when it does not, so the code ships ahead of this migration.
--
-- Apply in the Supabase SQL editor (service role), like every migration here.
-- Safe to run twice.

alter table quiz_users add column if not exists email_at timestamptz;

update quiz_users
   set email_at = created_at
 where email_at is null
   and email is not null
   and length(trim(email)) > 0;

create or replace function quiz_users_stamp_email_at()
returns trigger
language plpgsql
as $$
begin
  if new.email is null or length(trim(new.email)) = 0 then
    new.email_at := null;
  elsif tg_op = 'INSERT' then
    new.email_at := coalesce(new.email_at, now());
  elsif old.email is null or length(trim(old.email)) = 0 then
    new.email_at := now();                       -- first email on this account
  else
    new.email_at := coalesce(old.email_at, now()); -- changed address: keep the original moment
  end if;
  return new;
end;
$$;

drop trigger if exists quiz_users_email_at on quiz_users;
create trigger quiz_users_email_at
  before insert or update of email on quiz_users
  for each row execute function quiz_users_stamp_email_at();
