#!/usr/bin/env python3
# Build Bacon's film graph, public/bacon/graph.json, from the Wikipedia movie
# data (github.com/prust/wikipedia-movie-data, movies.json: every American
# film Wikipedia lists by year, with its principal cast).
#
#   python3 scripts/gen-bacon-graph.py /path/to/movies.json
#
# Kept: films released 1930 to 2022 with at least one cast name, and not marked
# "upcoming" (the 2023 rows were scraped before release and their casts are
# incomplete). Cast names are cleaned (a trailing "(actor)" or "(narrator)"
# dropped, "(voices)" rows removed) and merged on a folded key so "Timothee
# Chalamet" and "Timothée Chalamet" are one person; the spelling shown is the
# most common one, accented forms winning a tie. Two different films sharing a
# title and year stay apart, each titled "(with <first-billed>)". A " 3D" re-release of a
# listed film is dropped, and the hand corrections in
# scripts/bacon-cast-fixes.json are applied.
#
# Output: {"v":1,"actors":[name...],"films":[[title,year,[actor index...]]...]}
# Films are stored most-known first (the summed film counts of their cast), so
# the type-ahead offers famous films first. Actors are stored by film count.
# Do not hand-edit; app/bacon/puzzles.js names actors by NAME, so a rebuild
# never breaks a board, and scripts/verify-bacon.mjs re-proves every par.
import json, re, sys, unicodedata, collections

args = [a for a in sys.argv[1:] if not a.startswith('--')]
src = args[0] if args else 'movies.json'
NO_IMDB = '--no-imdb' in sys.argv
OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else 'public/bacon/graph.json'
if '--out' in sys.argv:
    args.remove(OUT)
rows = json.load(open(src))

def fold(s):
    s = unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

# One person listed under two names (scripts/bacon-cast-fixes.json "merge_names":
# [other spelling, name to show]) becomes one actor.
MERGE = {fold(a): b for a, b in json.load(open('scripts/bacon-cast-fixes.json')).get('merge_names', [])}

def clean(c):
    c = re.sub(r'\s*\([^)]*\)\s*$', '', c.strip()).strip()
    c = re.sub(r'\s+', ' ', c)
    if not c or c.startswith('(') or len(c) > 40 or len(fold(c)) < 3:
        return None
    return MERGE.get(fold(c), c)

films = collections.OrderedDict()
seen_href = set()
for r in rows:
    y = r.get('year')
    if not isinstance(y, int) or y < 1930 or y > 2022:
        continue
    if 'upcoming' in (r.get('extract') or '')[:300]:
        continue
    t = (r.get('title') or '').strip()
    if not t:
        continue
    cast = [x for x in (clean(c) for c in r.get('cast') or []) if x]
    if not cast:
        continue
    # One article is one film, even when the source lists it twice.
    h = r.get('href') or f'{t}|{y}'
    if h in seen_href:
        continue
    seen_href.add(h)
    k = (t, y, h)
    films[k] = []
    for c in cast:
        if c not in films[k]:
            films[k].append(c)

# Two different films with one title and one year (Swan Song, 2021) keep both,
# and each title gains "(with <first-billed>)" so the player can tell them
# apart and a link through one never counts for the other.
by_ty = collections.defaultdict(list)
for k in films:
    by_ty[(k[0], k[1])].append(k)
renamed = collections.OrderedDict()
for k, cast in films.items():
    t, y, h = k
    if len(by_ty[(t, y)]) > 1:
        t = f'{t} (with {cast[0]})'
    renamed[(t, y)] = cast
films = renamed

# Hand corrections (scripts/bacon-cast-fixes.json).
FIX = json.load(open('scripts/bacon-cast-fixes.json'))
for t, y in FIX['drop_films']:
    films.pop((t, y), None)
for t, y, n in FIX['drop_cast']:
    if (t, y) in films:
        films[(t, y)] = [c for c in films[(t, y)] if fold(c) != fold(n)]
for t, y0, y1 in FIX.get('set_year', []):
    if (t, y0) in films and (t, y1) not in films:
        films = collections.OrderedDict(((t, y1) if k == (t, y0) else k, v) for k, v in films.items())
for t, y, cast in FIX.get('add_films', []):
    films.setdefault((t, y), list(cast))
for t, y, n in FIX['add_cast']:
    n = MERGE.get(fold(n), n)
    if (t, y) in films and all(fold(c) != fold(n) for c in films[(t, y)]):
        films[(t, y)].append(n)

# Longer casts from IMDb (scripts/bacon-imdb-cast.json, built by
# scripts/gen-bacon-imdb.py), added after the Wikipedia names so billing
# order holds.
if not NO_IMDB:
    try:
        IMDB = json.load(open('scripts/bacon-imdb-cast.json'))
    except FileNotFoundError:
        IMDB = {}
    for k, names in IMDB.items():
        t, y = k.rsplit('|', 1)
        key = (t, int(y))
        if key in films:
            have = {fold(c) for c in films[key]}
            have |= {fold(n) for tt, yy, n in FIX['drop_cast'] if (tt, yy) == key}
            for n in names:
                n = MERGE.get(fold(n), n)
                if fold(n) not in have:
                    films[key].append(n)
                    have.add(fold(n))

# A " 3D" re-release of a film already listed is the same film.
for (t, y) in list(films):
    if t.endswith(' 3D') and any(k[0] == t[:-3] for k in films):
        del films[(t, y)]

spell = collections.defaultdict(collections.Counter)
count = collections.Counter()
for (t, y), cast in films.items():
    seen = set()
    for c in cast:
        f = fold(c)
        if f in seen:
            continue
        seen.add(f)
        spell[f][c] += 1
        count[f] += 1

def best(f):
    sp = spell[f]
    return max(sp, key=lambda s: (sp[s], s != unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode(), s))

order = sorted(count, key=lambda f: (-count[f], f))
idx = {f: i for i, f in enumerate(order)}
actors = [best(f) for f in order]

out = []
for (t, y), cast in films.items():
    ids = []
    for c in cast:
        i = idx[fold(c)]
        if i not in ids:
            ids.append(i)
    fame = sum(count[order[i]] for i in ids)
    out.append((fame, t, y, ids))
out.sort(key=lambda x: (-x[0], x[1], x[2]))
graph = {'v': 1, 'actors': actors, 'films': [[t, y, ids] for _, t, y, ids in out]}
json.dump(graph, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'wrote {OUT}: {len(out)} films, {len(actors)} actors')
