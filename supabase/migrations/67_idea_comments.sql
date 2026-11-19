-- 67_idea_comments.sql
-- COMMENTS ON THE IDEA BOARD (owner, 2026-11-19: "Need a way to comment on
-- here. And when your thread receives a comment, you get a pop-up notice, but
-- more subtle than the new game notices, shown at bottom of screen with an x
-- to exit").
--
-- One row per comment on an idea. owner_seen is the notice: false until the
-- idea's pitcher has seen it (dismissed the bottom notice, opened it, or
-- loaded the Idea Board). A pitcher's own comment on their own idea is born
-- seen. Stored on the row, not in the browser, so a notice dismissed on the
-- phone does not come back on the desktop.
--
-- Reports on comments use community_reports with target 'comment'; three hide
-- the comment until the admin looks, same as posts and ideas.
--
-- Server only, like the rest of migration 66: RLS on, no policies. Until this
-- runs, the Idea Board works exactly as before and simply shows no comments.

create table if not exists community_idea_comments (
  id bigserial primary key,
  idea_id bigint not null references community_ideas(id) on delete cascade,
  user_id uuid references quiz_users(id) on delete set null,
  username text not null,
  body text not null,
  reports integer not null default 0,
  hidden boolean not null default false,
  owner_seen boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists community_idea_comments_idea on community_idea_comments (idea_id, created_at);
create index if not exists community_idea_comments_unseen on community_idea_comments (idea_id) where owner_seen = false;
create index if not exists community_idea_comments_user on community_idea_comments (user_id, created_at desc);

alter table community_reports drop constraint if exists community_reports_target_check;
alter table community_reports add constraint community_reports_target_check check (target in ('post', 'idea', 'comment'));

alter table community_idea_comments enable row level security;
