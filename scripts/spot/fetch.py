"""Download Jig photographs from Wikimedia Commons at 1920 px wide for Spot
boards.   python3 scripts/spot/fetch.py 5,38,18
Reads the Commons file title from app/jig/puzzles.js and writes
scripts/spot/src/jig<num>.jpg (a scratch folder, not committed)."""
import json, urllib.request, urllib.parse, time, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, '..', '..', 'app', 'jig', 'puzzles.js'), encoding='utf8').read()
rows = [json.loads(l.strip().rstrip(',')) for l in src.splitlines() if l.strip().startswith('{"num"')]
want = [int(x) for x in sys.argv[1].split(',')]
out = os.path.join(HERE, 'src')
os.makedirs(out, exist_ok=True)
UA = {'User-Agent': 'MindLoftSpot/1.0 (admin@mindloftdaily.com)'}
for r in rows:
    if r['num'] not in want:
        continue
    fn = f"{out}/jig{r['num']}.jpg"
    if os.path.exists(fn) and os.path.getsize(fn) > 20000:
        continue
    q = 'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|size&iiurlwidth=1920&format=json&titles=' + urllib.parse.quote('File:' + r['t'])
    d = json.load(urllib.request.urlopen(urllib.request.Request(q, headers=UA), timeout=30))
    ii = list(d['query']['pages'].values())[0]['imageinfo'][0]
    # the API hands back thumb.wikimedia.org; upload.wikimedia.org serves the same file
    url = ii['thumburl'].split('?')[0].replace('thumb.wikimedia.org', 'upload.wikimedia.org')
    data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
    open(fn, 'wb').write(data)
    print(r['num'], len(data), r['name'])
    time.sleep(1.2)
