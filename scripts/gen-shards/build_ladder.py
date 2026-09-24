"""Rebuild the Shards bank on the difficulty ladder (owner ruling, 2026-08-01).

The first bank was too easy for a reason that size alone does not fix: almost every
puzzle in it was geometrically FORCED (the shard shapes tiled the outline exactly one
way), so it was solved by shape-fitting and the letters never had to be read. The
ladder therefore moves two dials at once:

  Mon-Thu  6x6, 3-4 cell shards, at least AMBIG geometric tilings
  Fri-Sat  7x7  (the old Sunday size)
  Sunday   8x8  (new, larger)

plus, on every tier, a hard AMBIGUITY FLOOR: the shard shapes must admit at least N
different tilings of the outline, so shape alone can never settle a placement and the
words become the only way through. That floor is re-proven in
scripts/verify-daily-banks.mjs, so a forced puzzle cannot ship again.

Days already played are frozen: entries whose `live` date is before FIRST_NEW are
copied through byte-for-byte. Existing grid fills are recycled as cut material (the
word fills were vetted; only the cuts were too kind).

The search is RESUMABLE: each run appends whatever days it completes to the state
file and exits, so it can be driven in short chunks. Run it repeatedly until it
reports DONE.

Usage:  python3 build_ladder.py [budget_seconds_per_puzzle] [wall_seconds_this_run]
State:  $SHARDS_BUILD_DIR/state.json (default /tmp/shards-build; resume point + finished entries)
Writes: $SHARDS_BUILD_DIR/puzzles.json (once every day is generated)
"""
import sys, os, re, json, random, time, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen
import fast

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
          'August', 'September', 'October', 'November', 'December']

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
PUZZLES_JS = os.path.join(REPO, 'app', 'shards', 'puzzles.js')

# 2026-08-20: rebuilt again to drop the two-letter slots (see gen.py's template
# note). Boards through 2026-08-19 are played and frozen.
FIRST_NEW = datetime.date(2026, 11, 1)
LAST_NEW = datetime.date(2026, 11, 30)

# n, shard size range, piece count range, ambiguity floor, scoring budget
# ambig = minimum geometric tilings; mindup = minimum repeated shard shapes, the
# cheap pre-filter that predicts ambiguity (see try_cuts)
TIERS = {
    'weekday': dict(n=6, smin=3, smax=4, kmin=8,  kmax=10, ambig=8,  mindup=2,
                    start=100, floor=10, hints=[10, 15, 20]),
    'weekend': dict(n=7, smin=3, smax=4, kmin=10, kmax=14, ambig=12, mindup=4,
                    start=150, floor=15, hints=[15, 20, 30]),
    'sunday':  dict(n=8, smin=3, smax=5, kmin=11, kmax=17, ambig=12, mindup=3,
                    start=200, floor=20, hints=[20, 30, 40]),
}


def tier_for(d):
    wd = d.weekday()            # Mon=0 .. Sun=6
    if wd == 6:
        return 'sunday'
    if wd in (4, 5):
        return 'weekend'
    return 'weekday'


def load_existing():
    src = open(PUZZLES_JS, encoding='utf-8').read()
    body = src[src.index('export const PUZZLES'):]
    body = body[body.index('['):].rstrip().rstrip(';')
    body = re.sub(r"(\w+):", r'"\1":', body)
    body = body.replace("'", '"')
    body = re.sub(r",(\s*[\]\}])", r"\1", body)
    return json.loads(body)


def words_current(pat, grid, n):
    """True when every run in a filled grid is still in the current fill pool."""
    for slot in gen.slots(pat, n):
        w = ''.join(grid[r][c] for r, c in slot)
        if w not in gen.COMMON.get(len(w), ()):
            return False
    return True


def fill_of(p):
    """Recover (pattern, letter grid) from a shipped puzzle entry."""
    n = p['rows']
    blocks = set((b[0], b[1]) for b in p['blocks'])
    grid = [[None] * n for _ in range(n)]
    for sh in p['shards']:
        for r, c, ch in sh['cells']:
            grid[r][c] = ch.lower()
    pat = [''.join('#' if (r, c) in blocks else '.' for c in range(n)) for r in range(n)]
    return pat, grid


def shape_sig(cells):
    """Canonical polyomino shape of a shard, ignoring its letters and position."""
    mr = min(r for r, c in cells); mc = min(c for r, c in cells)
    return tuple(sorted((r - mr, c - mc) for r, c in cells))


def try_cuts(pat, grid, n, t, rng, deadline, want_ambig):
    """Cut one filled grid many ways; return the most ambiguous unique cut found.

    Ambiguity comes from INTERCHANGEABLE shards: two pieces of identical shape can
    swap homes, and every such pair multiplies the number of ways the shapes tile
    the outline. Counting duplicate shapes is nearly free, while proving uniqueness
    is not, so cuts without enough repeated shapes are discarded before the
    expensive work rather than after it.
    """
    cells = gen.fillable(pat, n)
    best = None
    while time.time() < deadline:
        pl = gen.cut(cells, rng, kmin=t['kmin'], kmax=t['kmax'], smin=t['smin'], smax=t['smax'])
        if pl is None:
            continue
        sigs = [shape_sig(p) for p in pl]
        if len(sigs) - len(set(sigs)) < t['mindup']:
            continue
        shards = []
        for p in pl:
            offs, anchor = gen.norm_shard(p, grid)
            shards.append({'offs': offs, 'anchor': anchor, 'cells': p})
        sols, _nodes, exhausted = fast.unique_solutions(shards, cells, n, cap=2, nodecap=400_000)
        # not exhausted means uniqueness was never proven, so the cut is unusable
        if not exhausted or len(sols) != 1:
            continue
        intended = ''.join(grid[r][c] for r, c in sorted(cells))
        if intended not in sols:
            continue
        g, _capped = fast.geom_count(shards, cells, n, floor=want_ambig * 3, nodecap=150_000)
        if best is None or g > best[1]:
            best = (shards, g, cells)
        if g >= want_ambig:
            return best
    return best


def find_puzzle(t, rng, reuse_fills, used_fills, budget):
    """Search reused fills first, then fresh ones, for a cut meeting the floor."""
    n = t['n']
    deadline = time.time() + budget
    best = None

    def consider(pat, grid, key, slice_budget):
        nonlocal best
        sub = min(deadline, time.time() + slice_budget)
        res = try_cuts(pat, grid, n, t, rng, sub, t['ambig'])
        if res and (best is None or res[1] > best[1]):
            best = (res[0], res[1], res[2], pat, grid, key)
        return best is not None and best[1] >= t['ambig']

    for key, (pat, grid) in list(reuse_fills.items()):
        if key in used_fills or time.time() > deadline:
            continue
        if consider(pat, grid, key, budget * 0.35):
            return best

    while time.time() < deadline:
        pat = gen.TEMPLATES[n][rng.randrange(len(gen.TEMPLATES[n]))]
        grid = gen.fill(pat, n, rng, tries=25000)
        if grid is None:
            continue
        key = ''.join(''.join(ch or '#' for ch in row) for row in grid)
        if key in used_fills:
            continue
        if consider(pat, grid, key, budget * 0.25):
            return best
    return best


def to_entry(num, d, t, shards, grid, pat, ambig):
    n = t['n']
    blocks = [[r, c] for r in range(n) for c in range(n) if pat[r][c] == '#']
    out = []
    for sh in shards:
        out.append({'cells': [[r, c, grid[r][c].upper()] for (r, c) in sorted(sh['cells'])]})
    return {
        'num': num,
        'quizId': f"shards-{d.month}-{d.day}-{str(d.year)[2:]}",
        'live': d.isoformat(),
        'dateLabel': f"{MONTHS[d.month - 1]} {d.day}, {d.year}",
        'sunday': d.weekday() == 6,
        'rows': n, 'cols': n,
        'start': t['start'], 'floor': t['floor'], 'hints': list(t['hints']),
        'blocks': blocks,
        'shards': out,
        '_ambig': ambig,
        '_grid': [''.join(ch or '#' for ch in row) for row in grid],
    }


# Scratch location, overridable so parallel builds never share a resume file.
BUILD_DIR = os.environ.get('SHARDS_BUILD_DIR', '/tmp/shards-build')
STATE = os.path.join(BUILD_DIR, 'state.json')


def main():
    budget = float(sys.argv[1]) if len(sys.argv) > 1 else 25.0
    wall = float(sys.argv[2]) if len(sys.argv) > 2 else 1e9
    existing = load_existing()
    frozen = [p for p in existing if datetime.date.fromisoformat(p['live']) < FIRST_NEW]
    print(f"{len(frozen)} played days frozen (through {frozen[-1]['live']})", file=sys.stderr)

    # recycle the vetted word fills from days we are replacing
    reuse = {6: {}, 7: {}, 8: {}}
    for p in existing:
        if datetime.date.fromisoformat(p['live']) < FIRST_NEW:
            continue
        n = p['rows']
        pat, grid = fill_of(p)
        # A recycled fill carries its old block pattern with it, so a fill lifted from
        # a board built on a two-letter-slot template would put those slots straight
        # back. Recycle only the fills whose pattern clears the current MIN_RUN bar.
        if min(gen._runs(pat, n)) < gen.MIN_RUN:
            continue
        # ...and its WORDS have to clear the current pool too. A recycled fill was
        # written under whatever vocabulary was in force when it was built, so a fill
        # lifted from an old board carries that board's ISH, ANA, ONS and ING straight
        # through the new filters untouched.
        if not words_current(pat, grid, n):
            continue
        key = ''.join(''.join(ch or '#' for ch in row) for row in grid)
        reuse.setdefault(n, {})[key] = (pat, grid)
    print(f"recyclable fills: " + ", ".join(f"{n}x{n}={len(v)}" for n, v in sorted(reuse.items())),
          file=sys.stderr)

    dates = []
    d = FIRST_NEW
    while d <= LAST_NEW:
        dates.append(d)
        d += datetime.timedelta(days=1)

    os.makedirs(BUILD_DIR, exist_ok=True)
    if os.path.exists(STATE):
        st = json.load(open(STATE))
    else:
        st = {'done': [], 'used_fills': [], 'seed_bump': 0}
    done_dates = {e['live'] for e in st['done']}
    used_fills = set(st['used_fills'])
    # Every grid already in the bank is spent, frozen or not: an extension that
    # only knew about its own run could hand back a fill a player saw last month.
    for p in frozen:
        _pat, g = fill_of(p)
        used_fills.add(''.join(''.join(ch or '#' for ch in row) for row in g))

    t0 = time.time()
    made = 0
    for i, d in enumerate(dates):
        if d.isoformat() in done_dates:
            continue
        if time.time() - t0 > wall:
            break
        num = frozen[-1]['num'] + i + 1
        name = tier_for(d)
        t = TIERS[name]
        # a fresh stream per day keeps resumed runs from repeating earlier searches
        # Seeded off the BOARD NUMBER, not the index in this run: the Oct 2026 run
        # seeded off i, so a later run starting again at i=0 would replay its
        # searches. Board numbers never repeat, so neither do the streams.
        rng = random.Random(20260801 + num * 7919 + st['seed_bump'])
        res = find_puzzle(t, rng, reuse[t['n']], used_fills, budget)
        if res is None:
            print(f"  !! {d} ({name}) no puzzle within budget, will retry next run",
                  file=sys.stderr, flush=True)
            st['seed_bump'] += 1
            continue
        shards, ambig, cells, pat, grid, key = res
        if ambig < t['ambig']:
            print(f"  .. {d} ({name}) best so far ambiguity={ambig} < floor {t['ambig']}, retrying",
                  file=sys.stderr, flush=True)
            st['seed_bump'] += 1
            continue
        used_fills.add(key)
        st['done'].append(to_entry(num, d, t, shards, grid, pat, ambig))
        made += 1
        # checkpoint every day: a run that gets cut short must never lose work
        st['used_fills'] = sorted(used_fills)
        json.dump(st, open(STATE, 'w'))
        print(f"  {num:3d} {d} {name:8s} {t['n']}x{t['n']} "
              f"{len(shards):2d} shards  ambiguity={ambig}", file=sys.stderr, flush=True)

    st['used_fills'] = sorted(used_fills)
    json.dump(st, open(STATE, 'w'))
    remaining = len(dates) - len(st['done'])
    print(f"\n+{made} this run, {len(st['done'])}/{len(dates)} days built, {remaining} remaining",
          file=sys.stderr)
    if remaining == 0:
        out = list(frozen) + sorted(st['done'], key=lambda e: e['live'])
        for i, e in enumerate(out):
            e['num'] = i + 1
        json.dump(out, open(os.path.join(BUILD_DIR, 'puzzles.json'), 'w'))
        print(f"DONE: {len(out)} entries ({len(frozen)} frozen + {len(dates)} new) "
              f"-> {os.path.join(BUILD_DIR, 'puzzles.json')}", file=sys.stderr)


if __name__ == '__main__':
    main()
