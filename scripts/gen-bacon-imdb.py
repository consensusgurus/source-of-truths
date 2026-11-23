#!/usr/bin/env python3
# Longer Bacon casts from the IMDb datasets (datasets.imdbws.com, non-commercial
# licence; the Bacon page credits IMDb). Writes scripts/bacon-imdb-cast.json,
# {"<title>|<year>": [extra actor, ...]}, which scripts/gen-bacon-graph.py adds
# on top of the Wikipedia casts.
#
#   python3 scripts/gen-bacon-graph.py movies.json --no-imdb --out /tmp/wiki-graph.json
#   python3 scripts/gen-bacon-imdb.py /path/to/extract /tmp/wiki-graph.json
#   python3 scripts/gen-bacon-graph.py movies.json
#
# It must read a Wikipedia-only graph (--no-imdb), never the live graph.json,
# or the IMDb names already in it would be dropped from the additions.
#
# The extract is three TSVs cut from the IMDb files on the owner's machine:
#   movies.tsv  tconst, primaryTitle, originalTitle, startYear  (titleType movie)
#   cast.tsv    tconst, ordering, nconst                         (actor / actress)
#   names.tsv   nconst, primaryName, birthYear
#
# Matching is strict, so a wrong film never lends its cast:
#   - folded title equal (primary or original title), year equal or one off;
#   - at least one of the film's Wikipedia cast is in the IMDb cast (two when
#     the Wikipedia cast has three or more names);
#   - when several IMDb films pass, the one sharing the most cast wins, and a
#     tie is skipped.
# Added names are dropped when two different IMDb people in the matched films
# fold to the same name (two "John Smith"s would wrongly link their films), and
# when the person ends up in only one film (they connect nothing).
import json, re, sys, unicodedata, collections, os

d = sys.argv[1] if len(sys.argv) > 1 else '.'
graph = json.load(open(sys.argv[2]))

def fold(s):
    s = unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

def tfold(t):
    t = re.sub(r'\s*\(with [^)]*\)$', '', t)
    t = fold(t)
    return re.sub(r'^(the|a|an) ', '', t)

names = {}
for line in open(os.path.join(d, 'names.tsv'), encoding='utf-8'):
    n, nm, by = line.rstrip('\n').split('\t')
    names[n] = nm

movies = {}
by_title = collections.defaultdict(list)
for line in open(os.path.join(d, 'movies.tsv'), encoding='utf-8'):
    tc, pt, ot, y = line.rstrip('\n').split('\t')
    y = int(y)
    movies[tc] = (pt, y)
    for k in {tfold(pt), tfold(ot)}:
        by_title[k].append(tc)

cast = collections.defaultdict(list)
for line in open(os.path.join(d, 'cast.tsv'), encoding='utf-8'):
    tc, o, n = line.rstrip('\n').split('\t')
    cast[tc].append((int(o), n))

actors = graph['actors']
matched = {}
skipped = collections.Counter()
for t, y, ids in graph['films']:
    wiki = {fold(actors[i]) for i in ids}
    need = 2 if len(wiki) >= 3 else 1
    best, tie = None, False
    for tc in set(by_title.get(tfold(t), [])):
        if abs(movies[tc][1] - y) > 1:
            continue
        got = {fold(names.get(n, '')) for _, n in cast.get(tc, [])}
        ov = len(wiki & got)
        if ov < need:
            continue
        if best is None or ov > best[0]:
            best, tie = (ov, tc), False
        elif ov == best[0]:
            tie = True
    if best is None:
        skipped['no match'] += 1
        continue
    if tie:
        skipped['tie'] += 1
        continue
    matched[(t, y)] = best[1]

# Folded names that belong to two different IMDb people in the matched films.
people = collections.defaultdict(set)
for tc in matched.values():
    for _, n in cast[tc]:
        if n in names:
            people[fold(names[n])].add(n)
ambiguous = {f for f, s in people.items() if len(s) > 1}

graph_names = {fold(a) for a in actors}
extra = {}
films_of = collections.Counter()
wiki_cast = {(t, y): {fold(actors[i]) for i in ids} for t, y, ids in graph['films']}
for (t, y), tc in matched.items():
    add = []
    for _, n in sorted(cast[tc]):
        nm = names.get(n)
        if not nm:
            continue
        f = fold(nm)
        if f in wiki_cast[(t, y)] or f in ambiguous or len(f) < 3:
            continue
        if f in {fold(a) for a in add}:
            continue
        add.append(nm)
    if add:
        extra[f'{t}|{y}'] = add
    for f in wiki_cast[(t, y)] | {fold(a) for a in add}:
        films_of[f] += 1
# Unmatched films still count toward their own cast's film totals.
for (t, y), w in wiki_cast.items():
    if (t, y) not in matched:
        for f in w:
            films_of[f] += 1

for k in list(extra):
    extra[k] = [a for a in extra[k] if films_of[fold(a)] >= 2]
    if not extra[k]:
        del extra[k]

json.dump(extra, open('scripts/bacon-imdb-cast.json', 'w'), ensure_ascii=False, separators=(',', ':'), sort_keys=True)
added = sum(len(v) for v in extra.values())
print(f'matched {len(matched)} of {len(graph["films"])} films; skipped {dict(skipped)}; '
      f'{len(ambiguous)} ambiguous names held back; {added} cast additions on {len(extra)} films')
