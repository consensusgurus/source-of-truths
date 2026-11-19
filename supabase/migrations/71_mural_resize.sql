-- 71_mural_resize.sql
-- MURALS ARE 4,000 PIECES, NOT 10,000 (owner, 2026-11-19: "Let's go to 4,000
-- now"). The mural open that afternoon had already been cut at 125 x 80 and had
-- placements on it. mural_resize() recuts an open mural WITHOUT losing anything:
--   1. the old board is copied to <id>-was-<pieces> and closed,
--   2. every placement moves to that archive board (so the day's points, which
--      mural_credit() sums by kind and day, are unchanged),
--   3. the live id takes the new cols, rows and grades and starts empty.
-- lib/mural.js calls it once, the first time an open mural of the old size is
-- asked for. It does nothing when the board is already the asked-for size.
-- mural_shelf() lists only real mural ids (never an archive), and reports each
-- mural's own piece count.

create or replace function mural_resize(p_id text, p_cols integer, p_rows integer, p_grades text)
returns boolean
language plpgsql
as $$
declare
  b mural_boards%rowtype;
  arch text;
begin
  select * into b from mural_boards where id = p_id for update;
  if not found or (b.cols = p_cols and b.rows = p_rows) then return false; end if;
  if length(p_grades) <> p_cols * p_rows then return false; end if;
  arch := p_id || '-was-' || (b.cols * b.rows);
  insert into mural_boards (id, kind, opens_at, closes_at, photo, name, lic, "by", cols, rows, grades, created_at, completed_at)
  select arch, m.kind, m.opens_at, now(), m.photo, m.name, m.lic, m."by", m.cols, m.rows, m.grades, m.created_at, m.completed_at
    from mural_boards m where m.id = p_id
  on conflict (id) do nothing;
  update mural_places set mural_id = arch where mural_id = p_id;
  update mural_boards set cols = p_cols, rows = p_rows, grades = p_grades, completed_at = null where id = p_id;
  return true;
end;
$$;

create or replace function mural_shelf()
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(x order by x.opens_at desc), '[]'::jsonb) from (
    select b.id, b.kind, b.name, b.lic, b.by, b.opens_at, b.closes_at, b.completed_at,
           b.cols * b.rows as total,
           (select count(*) from mural_places p where p.mural_id = b.id and p.first) as placed
      from mural_boards b
     where (b.completed_at is not null or b.closes_at <= now())
       and b.id ~ '^(mural|muraltoo)-[0-9]{4}-[0-9]{2}-[0-9]{2}$'
       and exists (select 1 from mural_places p where p.mural_id = b.id)
     order by b.opens_at desc limit 60
  ) x;
$$;
