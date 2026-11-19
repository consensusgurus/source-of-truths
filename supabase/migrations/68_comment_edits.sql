-- 68_comment_edits.sql
-- Idea Board comments can be edited by their author (owner, 2026-11-19:
-- "Users should be able to edit comments if possible"). edited_at marks an
-- edited comment so the thread can say "Edited". Admin deletes are plain row
-- deletes and need no schema change.
alter table community_idea_comments add column if not exists edited_at timestamptz;
