"""Append new Spot days to the bank WITHOUT rebuilding live boards (December
restock, 2026-11-13). export.py rebuilds every row from ORDER and needs every
past board's source photo; this keeps app/spot/puzzles.js and
scripts/spot-grid.json as they are and adds only the rows in APPEND, built by
spotkit.py into scripts/spot/out/.   python3 scripts/spot/append.py
A photo runs only after its Jig day; no two days in a row of color changes only."""
import json, os, shutil, hashlib, datetime, re
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
# (board id, Jig number), from 2026-11-26 on, one per day
APPEND = [('grant', 67), ('bulldogs', 2), ('ride', 1), ('caracol', 56), ('mushrooms', 13), ('tekapo', 26), ('calafuria', 69),
          ('secondbeach', 31), ('tea', 40), ('lunersee', 33), ('sassolungo', 71), ('footbridge', 66), ('rakovets', 72), ('chola', 41),
          ('tennfjord', 73), ('opalpool', 48), ('kotor', 74), ('poppies', 32), ('fuji', 54), ('scharl', 22), ('longsheng', 35),
          ('market', 77), ('sasov', 57), ('bussaglia', 62), ('rerik', 80), ('goldengate', 64), ('grau', 81), ('lacderoy', 58),
          ('heilbronn', 82), ('calico', 83), ('bronxfalls', 86), ('corrour', 87), ('messara', 88), ('rotenfels', 95),
          ('fischburg', 91), ('sandhamn', 96)]
_jig = open(os.path.join(ROOT, 'app', 'jig', 'puzzles.js'), encoding='utf8').read()
meta = {r['num']: r for r in (json.loads(l.strip().rstrip(',')) for l in _jig.splitlines() if l.strip().startswith('{"num"'))}
GONE = re.compile(r' (is|are) |turned|changed|melted|mirrored|^An extra|^Extra')
label = lambda t: t if GONE.search(t) else t + ' is gone'
bank = os.path.join(ROOT, 'app', 'spot', 'puzzles.js')
src = open(bank, encoding='utf8').read()
rows = [json.loads(l.strip().rstrip(',')) for l in src.splitlines() if l.strip().startswith('{"num"')]
grids = json.load(open(os.path.join(ROOT, 'scripts', 'spot-grid.json')))
last = rows[-1]
d0 = datetime.date.fromisoformat(last['live'])
add = []
for i, (bid, jig) in enumerate(APPEND):
    m = json.load(open(f'{HERE}/out/{bid}.json'))
    assert not m['warn'] or all('overlap' in w for w in m['warn']), (bid, m['warn'])
    d = d0 + datetime.timedelta(days=i + 1)
    j = meta[jig]
    assert j['live'] < d.isoformat(), (bid, j['live'], d)
    img = hashlib.sha256(open(f'{HERE}/out/{bid}_b.jpg', 'rb').read()).hexdigest()[:12]
    shutil.copyfile(f'{HERE}/out/{bid}_a.jpg', f'{ROOT}/public/spot/{img}-a.jpg')
    shutil.copyfile(f'{HERE}/out/{bid}_b.jpg', f'{ROOT}/public/spot/{img}-b.jpg')
    add.append(dict(num=last['num'] + i + 1, quizId=f'spot-{d.month}-{d.day}-{d.year % 100}', live=d.isoformat(), dateLabel=f'{MONTHS[d.month - 1]} {d.day}, {d.year}',
                    img=img, w=m['w'], h=m['h'], jig=jig, name=j['name'], lic=j['lic'], by=j['by'],
                    diffs=[dict(x=q['x'], y=q['y'], rx=q['rx'], ry=q['ry'], t=label(q['label'])) for q in m['diffs']]))
    grids[img] = dict(a=m['sha_a'], b=m['sha_b'], rows=m['grid'])
close = src.rindex('];')
src = src[:close] + ''.join('  ' + json.dumps(r, ensure_ascii=False, separators=(',', ':')) + ',\n' for r in add) + src[close:]
open(bank, 'w', encoding='utf8').write(src)
json.dump(grids, open(os.path.join(ROOT, 'scripts', 'spot-grid.json'), 'w'), separators=(',', ':'))
print(len(add), 'boards', add[0]['live'], 'to', add[-1]['live'])
for r in add:
    print(r['num'], r['live'], r['name'], '|', '; '.join(q['t'] for q in r['diffs']))
