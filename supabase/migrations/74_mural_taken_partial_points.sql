-- 74_mural_taken_partial_points.sql
-- Back to partial points for a piece someone else placed first (owner,
-- 2026-11-19: "if two players are working in the same color area, two minutes
-- can mean a lot ... they should get partial points as before"). Undoes 73:
-- mural_place() is exactly as in 72 again. Not doubled, neighbor cut applies.

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
    if not claimed then val := val * 2; end if;
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

