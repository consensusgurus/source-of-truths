"""Write the Spot bank from the built boards: app/spot/puzzles.js, the photo
pairs under public/spot/ (opaque names, so tomorrow's pair cannot be guessed
from today's), and scripts/spot-grid.json (the changed-cell grid and file
hashes the JS verifier re-checks).  python3 scripts/spot/export.py <outdir>"""
import json, os, sys, shutil, hashlib, datetime, re
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..')
START = datetime.date(2026, 11, 12)
ORDER = [('nyhavn', 5), ('kyoto', 38), ('havana', 18), ('rialto', 14), ('windmill', 27), ('viron', 51), ('atrani', 9),
         ('zrinski', 34), ('frankfurt', 44), ('lviv', 61), ('dingle', 49), ('poodle', 36), ('masks', 24), ('bench', 37)]
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
# the credit comes from the Jig bank itself, so it cannot drift from Jig's
_jig = open(os.path.join(HERE, '..', '..', 'app', 'jig', 'puzzles.js'), encoding='utf8').read()
meta = {str(r['num']): r for r in (json.loads(l.strip().rstrip(',')) for l in _jig.splitlines() if l.strip().startswith('{"num"'))}
GONE = re.compile(r' (is|are) |turned|changed|melted|mirrored|^An extra|^Extra')
def label(t):
    return t if GONE.search(t) else t + ' is gone'
os.makedirs(f'{OUT}/public/spot', exist_ok=True)
os.makedirs(f'{OUT}/app/spot', exist_ok=True)
os.makedirs(f'{OUT}/scripts', exist_ok=True)
rows, grids = [], {}
for i, (bid, jig) in enumerate(ORDER):
    m = json.load(open(f'{HERE}/out/{bid}.json'))
    d = START + datetime.timedelta(days=i)
    img = hashlib.sha256(open(f'{HERE}/out/{bid}_b.jpg', 'rb').read()).hexdigest()[:12]
    shutil.copyfile(f'{HERE}/out/{bid}_a.jpg', f'{OUT}/public/spot/{img}-a.jpg')
    shutil.copyfile(f'{HERE}/out/{bid}_b.jpg', f'{OUT}/public/spot/{img}-b.jpg')
    j = meta[str(jig)]
    rows.append(dict(num=i + 1, quizId=f'spot-{d.month}-{d.day}-{d.year % 100}', live=d.isoformat(), dateLabel=f'{MONTHS[d.month - 1]} {d.day}, {d.year}',
                     img=img, w=m['w'], h=m['h'], jig=jig, name=j['name'], lic=j['lic'], by=j['by'],
                     diffs=[dict(x=q['x'], y=q['y'], rx=q['rx'], ry=q['ry'], t=label(q['label'])) for q in m['diffs']]))
    grids[img] = dict(a=m['sha_a'], b=m['sha_b'], rows=m['grid'])
HEAD = open(os.path.join(HERE, 'spot-header.txt'), encoding='utf8').read()
with open(f'{OUT}/app/spot/puzzles.js', 'w', encoding='utf8') as f:
    f.write(HEAD + 'export const PUZZLES = [\n' + ''.join('  ' + json.dumps(r, ensure_ascii=False, separators=(',', ':')) + ',\n' for r in rows) + '];\n')
json.dump(grids, open(f'{OUT}/scripts/spot-grid.json', 'w'), separators=(',', ':'))
tot = sum(os.path.getsize(f'{OUT}/public/spot/{f}') for f in os.listdir(f'{OUT}/public/spot'))
print(len(rows), 'boards', rows[0]['live'], 'to', rows[-1]['live'], 'photos', round(tot / 1e6, 1), 'MB')
for r in rows:
    print(r['num'], r['live'], r['name'], '|', '; '.join(q['t'] for q in r['diffs']))
