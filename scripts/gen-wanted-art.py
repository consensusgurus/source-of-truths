#!/usr/bin/env python3
# Draw Wanted's tile art and share card from the real engine (lib/wanted-engine.js).
#
#   npm pack @fontsource/manrope@5.1.0 && tar xzf fontsource-manrope-5.1.0.tgz
#   MANROPE_DIR=$PWD/package/files python3 scripts/gen-wanted-art.py
#
# Writes public/games/btn-wanted.png and public/games/blue/btn-wanted.png (76x76:
# Otis on a cream disc, ringed in red; the blue one is the same drawing remapped
# to the brand ramp) and public/og/wanted.png (1200x630, HAND_BAKED in
# lib/og-stage-cards.js: a window of a fairground built from a seed no live board uses, so it gives nothing away, with the title card).
# Needs Playwright (chromium) and Pillow.
import asyncio, base64, json, os, re
from io import BytesIO
from PIL import Image
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FONTS = os.environ.get('MANROPE_DIR', os.path.abspath('package/files'))
engine = open(f'{ROOT}/lib/wanted-engine.js').read()
line = [l for l in open(f'{ROOT}/app/wanted/puzzles.js').read().split('\n') if l.startswith('  {"num":1')][0].rstrip(',')
def face(w):
    return 'data:font/woff2;base64,' + base64.b64encode(open(f'{FONTS}/manrope-latin-{w}-normal.woff2', 'rb').read()).decode()
HTML = '''<!DOCTYPE html><html><head><style>
@font-face{font-family:Manrope;font-weight:600;src:url(%s)}@font-face{font-family:Manrope;font-weight:800;src:url(%s)}
body{margin:0;background:#7f1d1d;font-family:Manrope}
#og{position:relative;width:1200px;height:630px;overflow:hidden;background:#7f1d1d}
#og canvas{position:absolute;left:-40px;top:-70px;transform:rotate(-4deg);border-radius:26px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
#card{position:absolute;right:54px;bottom:54px;width:520px;background:#15171c;border-radius:28px;padding:38px 40px 34px;box-sizing:border-box;box-shadow:0 20px 60px rgba(0,0,0,.45)}
#card .e{font-weight:800;font-size:17px;letter-spacing:.14em;color:#fca5a5}
#card .t{font-weight:800;font-size:104px;line-height:1.05;color:#fffaf0;letter-spacing:-.02em;margin:4px 0 6px}
#card .d{font-weight:600;font-size:25px;line-height:1.36;color:#fffaf0}
#card .f{font-weight:600;font-size:18px;color:#9aa3b2;margin-top:18px}
#tile{width:304px;height:304px}
</style></head><body><div id="og"><canvas id="scene" width="1900" height="1300" style="width:950px;height:650px"></canvas>
<div id="card"><div class="e">THE DAILY HIDDEN PICTURE PUZZLE</div><div class="t">Wanted</div><div class="d">A new crowd scene every day and a list of things to find. Can you spot Otis?</div><div class="f">Mind Loft · free, every day</div></div></div>
<canvas id="tile" width="304" height="304"></canvas>
<script type="module">
%s
// NOT a live day (the card must not give a real Otis away): its own seed.
const live = %s;
const b = wantedBuild({ seed: 4242, cols: 1, districts: ['fairground'], pool: live.pool });
const otis = b.targets.find((t) => t.kind === 'cast' && t.name === 'Otis');
// the share card: a window of the fairground with its Otis inside, ringed
{ const c = document.getElementById('scene'), g = c.getContext('2d'), k = 2.2, cx = (otis.box[0] + otis.box[2]) / 2, cy = (otis.box[1] + otis.box[3]) / 2;
  const x0 = Math.max(0, cx - 300), y0 = Math.max(0, cy - 300);
  g.scale(k, k); g.translate(-x0, -y0); wantedDraw(b, g, x0, y0, x0 + 1900 / k, y0 + 1300 / k, 1);
  g.beginPath(); g.ellipse(cx, cy, 13, 21, -0.08, 0, 7); g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#d22b2b'; g.lineWidth = 2.6; g.stroke(); }
// the tile, at 4x
{ const c = document.getElementById('tile'), g = c.getContext('2d');
  g.fillStyle = '#b91c1c'; g.beginPath(); g.roundRect(0, 0, 304, 304, 60); g.fill();
  g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(152, 152, 112, 0, 7); g.fill();
  g.save(); g.beginPath(); g.arc(152, 152, 112, 0, 7); g.clip(); g.translate(152, 266); g.scale(6.5, 6.5); wantedIcon(g, otis); g.restore();
  g.beginPath(); g.arc(152, 152, 112, 0, 7); g.strokeStyle = '#26221e'; g.lineWidth = 9; g.stroke(); }
document.fonts.ready.then(() => { window.done = 1; });
</script></body></html>''' % (face(600), face(800), re.sub(r'^export ', '', engine, flags=re.M), line)

def blue(im):
    # the brand-blue palette: the same drawing, remapped by lightness onto navy -> pale blue
    lo, hi = (22, 48, 110), (232, 242, 255)
    px = im.convert('RGBA'); out = Image.new('RGBA', px.size)
    data = []
    for (r, g, b, a) in list(px.getdata()):
        l = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        data.append(tuple(round(lo[i] + (hi[i] - lo[i]) * l) for i in range(3)) + (a,))
    out.putdata(data); return out

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(viewport={'width': 1200, 'height': 960})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.set_content(HTML); await pg.wait_for_function('window.done===1', timeout=60000)
        assert not errs, errs
        await pg.locator('#og').screenshot(path=f'{ROOT}/public/og/wanted.png')
        Image.open(f'{ROOT}/public/og/wanted.png').convert('RGB').save(f'{ROOT}/public/og/wanted.png', optimize=True)
        raw = await pg.locator('#tile').screenshot(omit_background=True)
        t = Image.open(BytesIO(raw)).convert('RGBA').resize((76, 76), Image.BOX)
        t.save(f'{ROOT}/public/games/btn-wanted.png'); blue(t).save(f'{ROOT}/public/games/blue/btn-wanted.png')
        print('wrote public/og/wanted.png, public/games/btn-wanted.png, public/games/blue/btn-wanted.png')
        await br.close()
asyncio.run(main())
