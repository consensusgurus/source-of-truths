-- 69_mural.sql
-- MURAL AND MURALTOO (owner, 2026-11-19): one very large jigsaw a day that the
-- whole site builds together. Mural runs noon to noon Eastern, MuralToo
-- midnight to midnight. Every player works their own copy; the shared mural is
-- the union of everyone's FIRST placements.
--
-- mural_boards: one row per mural, written by the server the first time the
-- mural is asked for (it picks the photo and grades every piece then).
--   grades: one base-36 character per piece, row by row. 1 corner, 2 edge,
--   3 detailed, 4 busy, 6 plain, 8 / a / c flat colour by block size.
--
-- mural_places: one row per (mural, player, piece). `first` marks the one
-- placement of each piece that put it on the shared mural; the partial unique
-- index is what makes "first" mean exactly one player.
--
-- mural_place() settles a placement in one call, on the server, at the moment
-- of placing (owner: strict first, decided when you place, not at the refresh):
--   value = grade
--           x (1 + 5% per hour open, capped at double)   while nobody has it
--           x (1 - 20% per neighbour in place, floor 20%) crowd's or your own
--           x 2                                           if you are first
--   rounded, minimum 1.
--
-- Server only, like the rest of the site: RLS on, no policies. Until this runs
-- the Mural pages say they are not open yet and nothing else is affected.

create table if not exists mural_boards (
  id text primary key,
  kind text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  photo text not null,
  name text,
  lic text,
  by text,
  cols integer not null,
  rows integer not null,
  grades text not null,
  created_at timestamptz not null default now()
);

create table if not exists mural_places (
  mural_id text not null references mural_boards(id) on delete cascade,
  player text not null,
  piece integer not null,
  user_id uuid,
  username text,
  first boolean not null default false,
  points integer not null,
  placed_at timestamptz not null default now(),
  primary key (mural_id, player, piece)
);
create unique index if not exists mural_places_first on mural_places (mural_id, piece) where first;

alter table mural_boards enable row level security;
alter table mural_places enable row level security;

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

-- The shared picture and the standings, in one read (PostgREST caps a plain
-- select at 1,000 rows; a mural has 10,000 pieces). `placed` is one character
-- per piece, '1' where somebody has placed it.
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
    'players', (select count(*) from per where member)
  );
$$;

create or replace function mural_me(p_mural text, p_player text)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'pieces', coalesce(jsonb_agg(piece), '[]'::jsonb),
    'points', coalesce(sum(points), 0),
    'firsts', count(*) filter (where first),
    'rank', (
      select 1 + count(*) from (
        select player, sum(points) as p from mural_places where mural_id = p_mural group by player
      ) x where x.p > coalesce((select sum(points) from mural_places where mural_id = p_mural and player = p_player), 0)
    )
  )
  from mural_places where mural_id = p_mural and player = p_player;
$$;
