#!/usr/bin/env python3
# Films after the Wikipedia list ends (2023 to 2025) for Bacon, from the IMDb
# datasets. Writes scripts/bacon-imdb-films.json, [[title, year, [cast...]]],
# which scripts/gen-bacon-graph.py adds as films.
#
#   python3 scripts/gen-bacon-imdb-new.py /path/to/extract /tmp/wiki-graph.json
#
# The extract is cut on the owner's machine from title.basics, title.ratings,
# title.principals and name.basics:
#   new_rated.tsv  tconst, primaryTitle, originalTitle, year, genres, numVotes
#                  (titleType movie, 2023 to 2025, 5,000+ votes)
#   new_cast.tsv   tconst, ordering, nconst (actor / actress)
#   new_names.tsv  nconst, primaryName, birthYear
#
# Kept: 20,000+ votes, not a Documentary, primary title equal to the original
# title (drops most foreign-language releases), not already in the graph (same
# title, year within one), and at least 3 billed actors already in the graph
# (2 for a film with 50,000+ votes), so the films stay the kind Bacon covers.
import json, re, sys, unicodedata, collections, os

d, gpath = sys.argv[1], sys.argv[2]
g = json.load(open(gpath))

def fold(s):
    s = unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

def tf(t):
    return re.sub(r'^(the|a|an) ', '', fold(re.sub(r'\s*\(with [^)]*\)$', '', t)))

# Known actors: the Wikipedia graph plus the IMDb cast additions.
known = {fold(a) for a in g['actors']}
try:
    for v in json.load(open('scripts/bacon-imdb-cast.json')).values():
        known |= {fold(a) for a in v}
except FileNotFoundError:
    pass
have = {(tf(t), y) for t, y, _ in g['films']}

names = {}
for line in open(os.path.join(d, 'new_names.tsv'), encoding='utf-8'):
    n, nm, _ = line.rstrip('\n').split('\t')
    names[n] = nm
cast = collections.defaultdict(list)
for line in open(os.path.join(d, 'new_cast.tsv'), encoding='utf-8'):
    tc, o, n = line.rstrip('\n').split('\t')
    cast[tc].append((int(o), n))

out, seen, why = [], set(), collections.Counter()
rows = [l.rstrip('\n').split('\t') for l in open(os.path.join(d, 'new_rated.tsv'), encoding='utf-8')]
rows.sort(key=lambda r: -int(r[5]))
for tc, pt, ot, y, gen, votes in rows:
    y, votes = int(y), int(votes)
    if votes < 20000:
        why['votes'] += 1; continue
    if 'Documentary' in gen:
        why['documentary'] += 1; continue
    if pt != ot:
        why['foreign title'] += 1; continue
    if any((tf(pt), yy) in have for yy in (y - 1, y, y + 1)) or (pt, y) in seen:
        why['already listed'] += 1; continue
    cs = []
    for _, n in sorted(cast[tc]):
        nm = names.get(n)
        if nm and fold(nm) not in {fold(c) for c in cs}:
            cs.append(nm)
    k = sum(fold(c) in known for c in cs)
    if k < 3 and not (k >= 2 and votes >= 50000):
        why['few known cast'] += 1; continue
    seen.add((pt, y))
    out.append([pt, y, cs])

json.dump(out, open('scripts/bacon-imdb-films.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(out)} films 2023 to 2025 kept; skipped {dict(why)}')
