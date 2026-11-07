#!/usr/bin/env python3
# Author Bacon's daily boards, app/bacon/puzzles.js, from public/bacon/graph.json.
#
#   python3 scripts/gen-bacon.py [last-date]      (default 2027-03-07)
#
# APPEND-ONLY: boards already in app/bacon/puzzles.js are kept exactly as they
# are (a board that has gone live is never rewritten); new days are added after
# the last one, up to last-date.
#
# A board is two actors, start and target, and par: the fewest films that link
# them in the graph (a breadth-first search over actor-film-actor steps), plus
# one shortest chain to show at the end, the one whose films are best known.
#   Weekdays: two household names of today (the modern list in
#     scripts/bacon-stars.json, 6+ films in the graph), par 2 or 3.
#   Sundays (the Sunday Edition): a classic star (the classic list, 8+ films)
#     to a household name of today, par 3 or 4.
# The chain shown on the ending never uses a chain_avoid credit
# (scripts/bacon-cast-fixes.json) and prefers listed stars in the middle, then films
# where both are billed in the first eight (no cameos), then films no earlier
# chain used, then films billing the most listed stars.
# No pair repeats, no par 1, and no actor is used twice within 21 days.
# scripts/verify-bacon.mjs recomputes every par and chain from the graph.
import json, random, re, sys, datetime, collections, os

LAST = sys.argv[1] if len(sys.argv) > 1 else '2027-03-07'
START = '2026-11-07'
g = json.load(open('public/bacon/graph.json'))
A, F = g['actors'], g['films']
ix = {n: i for i, n in enumerate(A)}
af = collections.defaultdict(list)
lead = collections.Counter()
for fi, (t, y, ids) in enumerate(F):
    for k, a in enumerate(ids):
        af[a].append(fi)
        if k < 3:
            lead[a] += 1
last = {a: max(F[f][1] for f in fs) for a, fs in af.items()}
first = {a: min(F[f][1] for f in fs) for a, fs in af.items()}
STARS = json.load(open('scripts/bacon-stars.json'))
def pool(names, least):
    return sorted({ix[n] for n in names if n in ix and len(af[ix[n]]) >= least})
modern = pool(STARS['modern'], 6)
classic = pool(STARS['classic'], 8)
starset = set(modern) | set(classic)

def dists(s):
    d = {s: 0}; q = [s]
    while q:
        nq = []
        for a in q:
            for fi in af[a]:
                for b in F[fi][2]:
                    if b not in d:
                        d[b] = d[a] + 1; nq.append(b)
        q = nq
    return d

used_films = set()
FIX = json.load(open('scripts/bacon-cast-fixes.json'))
avoid = {(t, y, n) for t, y, n in FIX.get('chain_avoid', [])}
# How many listed stars a film bills in its first eight: the best-known films.
starcount = [sum(1 for a in f[2][:8] if a in starset) for f in F]
def chain(s, t, dt):
    out = [A[s]]; a = s
    while a != t:
        best = None
        for fi in af[a]:
            ids = F[fi][2]
            for b in ids:
                if dt.get(b, 99) == dt[a] - 1:
                    f = F[fi]
                    if (f[0], f[1], A[a]) in avoid or (f[0], f[1], A[b]) in avoid:
                        continue
                    # Prefer listed stars in the middle, then a film where both
                    # are billed in its first eight (not a cameo), then a film
                    # no earlier chain has shown, then the best known.
                    cameo = max(ids.index(a), ids.index(b)) >= 8
                    key = (b not in starset, cameo, fi in used_films, -starcount[fi], fi)
                    if best is None or key < best[0]:
                        best = (key, fi, b)
        _, fi, a = best
        used_films.add(fi)
        out += [[F[fi][0], F[fi][1]], A[a]]
    return out

MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
path = 'app/bacon/puzzles.js'
kept = []
if os.path.exists(path):
    txt = open(path).read()
    kept = [json.loads(l.strip().rstrip(',')) for l in txt.split('\n') if l.strip().startswith('{"num"')]

rnd = random.Random(20261107 + len(kept))
for p in kept:
    for x in p['chain'][1::2]:
        k = next((i for i, f in enumerate(F) if f[0] == x[0] and f[1] == x[1]), None)
        if k is not None:
            used_films.add(k)
used_pairs = {(p['from'], p['to']) for p in kept} | {(p['to'], p['from']) for p in kept}
recent = collections.deque([p['from'] for p in kept[-21:]] + [p['to'] for p in kept[-21:]], maxlen=42)
d0 = datetime.date.fromisoformat(kept[-1]['live']) + datetime.timedelta(days=1) if kept else datetime.date.fromisoformat(START)
end = datetime.date.fromisoformat(LAST)
cache = {}
new = []
num = len(kept)
day = d0
while day <= end:
    sun = day.weekday() == 6
    for tries in range(5000):
        s = rnd.choice(classic if sun else modern)
        t = rnd.choice(modern)
        if s == t or A[s] in recent or A[t] in recent or (A[s], A[t]) in used_pairs:
            continue
        if t not in cache:
            cache[t] = dists(t)
        par = cache[t].get(s)
        if par is None or not ((3 <= par <= 4) if sun else (2 <= par <= 3)):
            continue
        # Weekdays lean to par 2: take a par 3 one time in four.
        if not sun and par == 3 and rnd.random() > 0.25:
            continue
        break
    else:
        raise SystemExit(f'no board found for {day}')
    num += 1
    p = {'num': num, 'quizId': f'bacon-{day.month}-{day.day}-{str(day.year)[2:]}', 'live': day.isoformat(),
         'dateLabel': f'{MONTHS[day.month - 1]} {day.day}, {day.year}', 'sunday': sun,
         'from': A[s], 'to': A[t], 'par': par, 'chain': chain(s, t, cache[t])}
    new.append(p)
    used_pairs |= {(A[s], A[t]), (A[t], A[s])}
    recent.extend([A[s], A[t]])
    day += datetime.timedelta(days=1)

HEAD = '''// Puzzle data for Bacon, the daily link-two-actors-through-their-films game.
// Imported ONLY by the server page (app/bacon/page.js), which filters
// live<=today before handing puzzles to the client, so future boards never
// reach a browser.
//
// A board is a start actor and a target actor. The player builds a chain:
// name a film the current actor is in, then an actor in that film's cast, and
// so on, until the target is reached, in at most seven films. The film graph
// is public/bacon/graph.json (American films 1930 to 2022 with their principal
// cast as Wikipedia lists it; scripts/gen-bacon-graph.py).
//
// Fields: from / to are actor names exactly as the graph spells them. par is
// the fewest films that link them. chain is one shortest chain, actor, [film,
// year], actor ..., shown on the ending. Weekdays pair two household names of
// today (scripts/bacon-stars.json) at par 2 or 3; the Sunday Edition starts
// from a classic star and runs at par 3 or 4. No pair repeats, no par 1, no actor twice
// within 21 days. A good board is one a casual film fan can solve: both names
// should be household names in their era.
//
// Do NOT hand-edit. Extend with scripts/gen-bacon.py (append-only) and re-run
// scripts/verify-bacon.mjs, which recomputes every par and chain.
export const PUZZLES = [
'''
with open(path, 'w') as f:
    f.write(HEAD)
    for p in kept + new:
        f.write('  ' + json.dumps(p, ensure_ascii=False, separators=(',', ':')) + ',\n')
    f.write('];\n')
print(f'{path}: kept {len(kept)}, added {len(new)}; modern pool {len(modern)}, classic pool {len(classic)}')
