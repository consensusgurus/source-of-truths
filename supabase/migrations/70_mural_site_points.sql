-- 70_mural_site_points.sql
-- MURAL POINTS COUNT TOWARD THE SITE DAY THEY ARE EARNED IN (owner, 2026-11-19:
-- "points until midnight ET, so only MuralToo ends on time").
--
-- Mural and MuralToo are registered dailies from this date, so each files
-- quiz_results rows per player per Eastern day like every other daily:
--   quiz_id  mural-M-D-YY / muraltoo-M-D-YY, the EASTERN DAY of the placements
--   score    the Mural points that player has earned on that kind SO FAR that
--            day, on whichever board was open (Mural's day is the last twelve
--            hours of one board and the first twelve of the next; MuralToo's is
--            one board)
--   total    100, the par a tally game needs (unit: points in lib/daily-games.js)
--   guesses_used  pieces placed first that day
--   time_elapsed  seconds from that day's first placement to its latest, capped
--
-- ROWS ARE APPENDED, NEVER UPDATED. Every quiz route keeps its own copy of
-- quiz_results and asks only for rows with a higher id (lib/quiz-results-cache),
-- so an update in place would never reach a board. A player's running total is
-- therefore a NEW row each time, and the registry marks both games `bestRun`,
-- so every board keeps the best (which is the latest) row of the day, exactly
-- as it does for an Arcade game.
--
-- To keep that from being a row per piece, mural_credit() writes a row only
-- when the total has grown AND either ten minutes have passed since this
-- player's last row or the caller forces it. /api/mural/place calls it unforced
-- after every placement; the page forces it when the player goes idle or leaves
-- (/api/mural/credit), so the last few minutes of a session are never lost.
-- A forced call in the first fifteen minutes after Eastern midnight settles
-- yesterday as well, for the player who placed right up to the line.

create or replace function mural_credit(p_mural text, p_player text, p_user uuid, p_name text, p_anon text, p_force boolean)
returns jsonb
language plpgsql
as $$
declare
  k text;
  nowet timestamp;
  d date;
  t0 timestamptz;
  t1 timestamptz;
  q text;
  pts integer;
  fst integer;
  secs integer;
  last_score integer;
  last_at timestamptz;
  wrote integer := 0;
  back integer;
begin
  select kind into k from mural_boards where id = p_mural;
  if k is null then return jsonb_build_object('error', 'no_board'); end if;
  nowet := now() at time zone 'America/New_York';
  back := case when p_force and extract(hour from nowet) = 0 and extract(minute from nowet) < 15 then 1 else 0 end;

  for i in 0..back loop
    d := nowet::date - i;
    t0 := d::timestamp at time zone 'America/New_York';
    t1 := (d + 1)::timestamp at time zone 'America/New_York';
    q := k || '-' || extract(month from d)::int || '-' || extract(day from d)::int || '-' || to_char(d, 'YY');

    select coalesce(sum(p.points), 0)::int, (count(*) filter (where p.first))::int,
           greatest(1, least(36000, coalesce(extract(epoch from (max(p.placed_at) - min(p.placed_at))), 0)))::int
      into pts, fst, secs
      from mural_places p join mural_boards b on b.id = p.mural_id
     where b.kind = k and p.player = p_player and p.placed_at >= t0 and p.placed_at < t1;
    continue when pts <= 0;

    perform pg_advisory_xact_lock(hashtext(q || '|' || p_player));
    last_score := null; last_at := null;
    if p_user is not null then
      select score, created_at into last_score, last_at from quiz_results where quiz_id = q and user_id = p_user order by id desc limit 1;
    else
      select score, created_at into last_score, last_at from quiz_results where quiz_id = q and user_id is null and anon_id = p_anon order by id desc limit 1;
    end if;
    if last_score is null or (pts > last_score and (p_force or last_at < now() - interval '10 minutes')) then
      insert into quiz_results (quiz_id, user_id, username, score, total, time_elapsed, anon_id, correct_count, guesses_used, abandoned)
      values (q, p_user, p_name, pts, 100, secs, p_anon, 1, fst, false);
      wrote := wrote + 1;
    end if;
  end loop;
  return jsonb_build_object('wrote', wrote);
end;
$$;

-- A MURAL CLOSES WHEN IT IS COMPLETE (owner, 2026-11-19: "This puzzle closes
-- when complete. It will be available to play on the puzzle shelf."). The
-- placement that puts the last piece on the shared mural stamps completed_at,
-- and from then on mural_place() answers 'closed' for everyone. The page shows
-- the closing screen and sends players to the other mural or the Puzzle Shelf,
-- where a finished or closed mural can be built alone. mural_state() reports
-- the stamp, and mural_shelf() lists what the shelf may offer (never a mural
-- nobody placed a piece on).

alter table mural_boards add column if not exists completed_at timestamptz;

create or replace function mural_place(p_mural text, p_piece integer, p_player text, p_user uuid, p_name text)
returns jsonb
language plpgsql
as $$
declare
  b mural_boards%rowtype;
  old mural_places%rowtype;
  g integer;
  ch text;
  col integer;
  rw integer;
  n integer := 0;
  nb integer;
  claimed boolean;
  hrs numeric;
  val numeric;
  pts integer;
begin
  select * into b from mural_boards where id = p_mural;
  if not found then return jsonb_build_object('error', 'no_board'); end if;
  if now() < b.opens_at or now() >= b.closes_at then return jsonb_build_object('error', 'closed'); end if;
  if b.completed_at is not null then return jsonb_build_object('error', 'closed'); end if;
  if p_piece < 0 or p_piece >= b.cols * b.rows then return jsonb_build_object('error', 'bad_piece'); end if;

  select * into old from mural_places where mural_id = p_mural and player = p_player and piece = p_piece;
  if found then return jsonb_build_object('points', old.points, 'first', old.first, 'dup', true); end if;

  ch := substr(b.grades, p_piece + 1, 1);
  g := case when ch between '0' and '9' then ch::integer else ascii(ch) - 87 end;
  if g is null or g < 1 then g := 3; end if;

  col := p_piece % b.cols;
  rw := p_piece / b.cols;
  foreach nb in array array[
    case when col > 0 then p_piece - 1 else -1 end,
    case when col < b.cols - 1 then p_piece + 1 else -1 end,
    case when rw > 0 then p_piece - b.cols else -1 end,
    case when rw < b.rows - 1 then p_piece + b.cols else -1 end
  ] loop
    if nb >= 0 and exists (
      select 1 from mural_places where mural_id = p_mural and piece = nb and (first or player = p_player)
    ) then n := n + 1; end if;
  end loop;

  claimed := exists (select 1 from mural_places where mural_id = p_mural and piece = p_piece and first);
  hrs := floor(extract(epoch from (now() - b.opens_at)) / 3600);

  for attempt in 1..2 loop
    val := g * greatest(0.2, 1 - 0.2 * n);
    if not claimed then val := val * (1 + least(1, 0.05 * hrs)) * 2; end if;
    pts := greatest(1, round(val));
    begin
      insert into mural_places (mural_id, player, piece, user_id, username, first, points)
      values (p_mural, p_player, p_piece, p_user, p_name, not claimed, pts);
      if not claimed and (select count(*) from mural_places where mural_id = p_mural and first) >= b.cols * b.rows then
        update mural_boards set completed_at = now() where id = p_mural and completed_at is null;
      end if;
      return jsonb_build_object('points', pts, 'first', not claimed, 'dup', false);
    exception when unique_violation then
      -- Someone took the first between the check and the insert (or this same
      -- player's request arrived twice). Settle it as a repeat placement.
      select * into old from mural_places where mural_id = p_mural and player = p_player and piece = p_piece;
      if found then return jsonb_build_object('points', old.points, 'first', old.first, 'dup', true); end if;
      claimed := true;
    end;
  end loop;
  return jsonb_build_object('error', 'busy');
end;
$$;

create or replace function mural_state(p_mural text)
returns jsonb
language sql
stable
as $$
  with b as (select cols * rows as total from mural_boards where id = p_mural),
  firsts as (select piece from mural_places where mural_id = p_mural and first),
  per as (
    select player,
           max(username) as username,
           bool_or(user_id is not null) as member,
           sum(points)::integer as points,
           count(*) filter (where first)::integer as firsts,
           count(*)::integer as pieces
    from mural_places where mural_id = p_mural group by player
  )
  select jsonb_build_object(
    'total', (select total from b),
    'n', (select count(*) from firsts),
    'placed', coalesce((
      select string_agg(case when f.piece is null then '0' else '1' end, '' order by s.i)
      from generate_series(0, (select total from b) - 1) as s(i)
      left join firsts f on f.piece = s.i
    ), ''),
    'top', coalesce((
      select jsonb_agg(t) from (
        select coalesce(username, 'Guest') as name, member, points, firsts, pieces
        from per order by points desc, firsts desc, player limit 30
      ) t
    ), '[]'::jsonb),
    'contrib', coalesce((
      select jsonb_agg(c) from (
        select coalesce(username, 'Player') as name, firsts
        from per where member and firsts > 0 order by firsts desc limit 150
      ) c
    ), '[]'::jsonb),
    'guests', (
      select jsonb_build_object('players', count(*), 'firsts', coalesce(sum(firsts), 0))
      from per where not member
    ),
    'players', (select count(*) from per where member),
    'completed', (select completed_at from mural_boards where id = p_mural)
  );
$$;

create or replace function mural_shelf()
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(x order by x.opens_at desc), '[]'::jsonb) from (
    select b.id, b.kind, b.name, b.lic, b.by, b.opens_at, b.closes_at, b.completed_at,
           (select count(*) from mural_places p where p.mural_id = b.id and p.first) as placed
      from mural_boards b
     where (b.completed_at is not null or b.closes_at <= now())
       and exists (select 1 from mural_places p where p.mural_id = b.id)
     order by b.opens_at desc limit 60
  ) x;
$$;
