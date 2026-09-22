-- 54_newsletter.sql
--
-- THE PLAYER NEWSLETTER: an opt-out, and a ledger of who has been sent what.
--
-- Registered players gave an email to join the leaderboard, not to receive a
-- newsletter, so the first thing this migration adds is the way OUT. The
-- second is what makes a send re-runnable: a campaign goes out in daily
-- batches under the sender's free tier (99 a day), and a batch that is
-- re-run, retried after a timeout, or fired twice by a cron must never send
-- the same person the same campaign twice. The unique index below is that
-- guarantee; the send route inserts BEFORE it sends, so a crash between the
-- two loses at most one email rather than duplicating one.
--
-- Apply in the Supabase SQL editor (service role), like every migration here.

alter table quiz_users add column if not exists newsletter_opt_out timestamptz;

create table if not exists newsletter_sends (
  id bigint generated always as identity primary key,
  campaign text not null,
  user_id uuid references quiz_users(id) on delete set null,
  email text not null,
  provider_id text,
  status text not null default 'queued',   -- queued | sent | failed
  error text,
  sent_at timestamptz not null default now()
);
create unique index if not exists newsletter_sends_campaign_email
  on newsletter_sends (campaign, email);   -- email is stored lowercased by the send route, so a plain index is what PostgREST's on_conflict can target

alter table newsletter_sends enable row level security;   -- service role only, no policies
