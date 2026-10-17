#!/usr/bin/env python3
# Bakes public/og/jig-shelf.png, the share card for /jig/shelf (2026-10-17).
#
#   python3 scripts/bake-jig-shelf-og.py
#
# Same frame as the baked Jig card (public/og/jig.png, whose logo strip it
# lifts so the two match exactly): title and lede left, two shelves of boxes
# right, today a question mark. The photos are BACKFILL boards (Sep 20 to
# Oct 4), which are permanently past, so the card can never leak a future
# day. They are fetched from upload.wikimedia.org thumbnails; fonts come from
# node_modules/@fontsource. Needs Pillow. Credits are printed on the card.
import os, json, re, hashlib, subprocess, tempfile, time, urllib.parse
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FONTS = os.path.join(ROOT, 'node_modules', '@fontsource')
D = tempfile.mkdtemp(prefix='jigshelf-')
SRC = open(os.path.join(ROOT, 'app', 'jig', 'puzzles.js'), encoding='utf-8').read()
ROWS = {json.loads(m)['num']: json.loads(m) for m in re.findall(r'^\s*(\{"num".*\}),?\s*$', SRC, re.M)}
def fetch(n):
    f = ROWS[n]['t'].replace(' ', '_'); h = hashlib.md5(f.encode()).hexdigest(); q = urllib.parse.quote(f)
    url = f'https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{q}/500px-{q}'
    for _ in range(5):
        code = subprocess.run(['curl', '-s', '-A', 'MindLoftOGBake/1.0 (https://mindloftdaily.com)', '-o', os.path.join(D, f'p{n}.jpg'), '-w', '%{http_code}', url], capture_output=True, text=True).stdout
        if code == '200': return
        time.sleep(6)
    raise SystemExit(f'could not fetch board {n}')
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
S = 2  # supersample
W, H = 1200 * S, 630 * S
GROUND = (11, 15, 26); SURF = (21, 25, 34); LINE = (37, 43, 54)
INK = (233, 237, 244); INK2 = (170, 181, 199); MUTE = (139, 149, 168); MUTE2 = (120, 133, 157)
LIME = (190, 242, 100); LID = (43, 58, 85)
WOOD = (168, 125, 85); WOOD2 = (138, 100, 64); WOOD3 = (92, 64, 41)

def F(name, px):
    sub = 'manrope' if name.startswith('manrope') else 'dm-mono'
    return ImageFont.truetype(os.path.join(FONTS, sub, 'files', name), px * S)
SANS8, SANS7, SANS6 = 'manrope-latin-800-normal.woff', 'manrope-latin-700-normal.woff', 'manrope-latin-600-normal.woff'
MONO5, MONO4 = 'dm-mono-latin-500-normal.woff', 'dm-mono-latin-400-normal.woff'

im = Image.new('RGB', (W, H), GROUND)
d = ImageDraw.Draw(im)
s = lambda v: int(round(v * S))

# top rule
d.rectangle([0, 0, W, s(9)], fill=LIME)

# header: logo + wordmark lifted from the baked Jig card so it matches exactly
src = Image.open(os.path.join(ROOT, 'public', 'og', 'jig.png')).convert('RGB')
logo = src.crop((56, 64, 272, 124)).resize((s(216), s(60)), Image.LANCZOS)
im.paste(logo, (s(56), s(64)))
d.line([s(287), s(66), s(287), s(120)], fill=LINE, width=s(1.5))
def spaced(x, y, text, font, fill, track):
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + track
    return x
spaced(s(303), s(85), 'LOGIC · PUZZLE SHELF', F(MONO4, 15), MUTE, s(2.6))

# title + lede
d.text((s(56), s(196)), 'The Jig', font=F(SANS8, 76), fill=INK)
d.text((s(56), s(278)), 'Puzzle Shelf', font=F(SANS8, 76), fill=INK)
lede = ['Every daily jigsaw so far,', 'one photograph a day.', 'Pick a box and play it free.']
for i, ln in enumerate(lede):
    d.text((s(56), s(386 + i * 38)), ln, font=F(SANS6, 26), fill=INK2)

# footer
d.line([s(56), s(537), s(1144), s(537)], fill=LINE, width=s(1))
spaced(s(56), s(561), 'mindloftdaily.com/jig/shelf', F(MONO4, 18), INK2, s(0.6))
f = F(MONO5, 16)
txt = 'PLAY ANY DAY FREE'
tw = sum(d.textlength(c, font=f) + s(2.4) for c in txt) - s(2.4)
spaced(s(1144) - tw, s(561), txt, f, LIME, s(2.4))

# the shelf: two planks of boxes, newest first, today a question mark
rows = [[None, 15, 14, 12, 10], [8, 6, 5, 4, 2]]
pcs = {n: ROWS[n]['cols'] * ROWS[n]['rows'] for r in rows for n in r if n}
for r in rows:
    for n in r:
        if n: fetch(n); time.sleep(3)
X0, X1 = 552, 1144
BW, BH, GAP = 106, 98, 15.5
LIDH = 19
plank_y = [262, 448]
fl = F(MONO5, 10)
for r, row in enumerate(rows):
    py = plank_y[r]
    for i, n in enumerate(row):
        bx = X0 + i * (BW + GAP)
        by = py - BH
        # soft shadow on the wall behind the box
        sh = Image.new('L', (s(BW + 30), s(BH + 30)), 0)
        ImageDraw.Draw(sh).rounded_rectangle([s(15), s(15), s(BW + 15), s(BH + 15)], radius=s(5), fill=150)
        sh = sh.filter(ImageFilter.GaussianBlur(s(7)))
        im.paste((0, 0, 0), (s(bx - 15 + 3), s(by - 15 + 5)), sh)
        d = ImageDraw.Draw(im)
        if n is None:
            d.rounded_rectangle([s(bx), s(by), s(bx + BW), s(by + BH)], radius=s(5), fill=SURF, outline=LIME, width=s(2))
            q = F(SANS8, 44)
            qw = d.textlength('?', font=q)
            d.text((s(bx + BW / 2) - qw / 2, s(by + 12)), '?', font=q, fill=LIME)
            lab = 'TODAY'
            lw = sum(d.textlength(c, font=fl) + s(1.2) for c in lab) - s(1.2)
            spaced(s(bx + BW / 2) - lw / 2, s(by + BH - 18), lab, fl, LIME, s(1.2))
            continue
        ph = Image.open(os.path.join(D, f'p{n}.jpg')).convert('RGB')
        ph = ImageOps.fit(ph, (s(BW), s(BH - LIDH)), Image.LANCZOS, centering=(0.5, 0.45))
        box = Image.new('RGB', (s(BW), s(BH)), LID)
        box.paste(ph, (0, 0))
        bd = ImageDraw.Draw(box)
        lab = f'#{n} · {pcs[n]} PCS'
        lw = sum(bd.textlength(c, font=fl) + s(0.4) for c in lab) - s(0.4)
        x = s(BW / 2) - lw / 2
        for ch in lab:
            bd.text((x, s(BH - LIDH + 2.5)), ch, font=fl, fill=(255, 255, 255))
            x += bd.textlength(ch, font=fl) + s(0.4)
        m = Image.new('L', box.size, 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, box.size[0] - 1, box.size[1] - 1], radius=s(5), fill=255)
        im.paste(box, (s(bx), s(by)), m)
        d = ImageDraw.Draw(im)
    # plank
    d.rectangle([s(X0 - 14), s(py), s(X1 + 14), s(py + 10)], fill=WOOD)
    d.rectangle([s(X0 - 14), s(py + 10), s(X1 + 14), s(py + 17)], fill=WOOD2)
    d.rectangle([s(X0 - 14), s(py + 17), s(X1 + 14), s(py + 19)], fill=WOOD3)
    for gx in (X0 + 40, X0 + 210, X0 + 395, X0 + 520):
        d.line([s(gx), s(py + 4), s(gx + 70), s(py + 4)], fill=WOOD2, width=s(1))

# photo credits, small, under the shelves
fc = F(MONO4, 10.5)
cred = ['Photos: W.carter, Rhododendrites, Moahim, Christopher Michel, Brocken Inaglory,',
        'Anass Errihani, Ganga Raj Sunuwar, Kallerna, Basile Morin · Wikimedia Commons']
for i, ln in enumerate(cred):
    d.text((s(X0 - 14), s(484 + i * 16)), ln, font=fc, fill=MUTE2)

out = im.resize((1200, 630), Image.LANCZOS)
dest = os.path.join(ROOT, 'public', 'og', 'jig-shelf.png')
out.save(dest, optimize=True)
print('wrote', dest, os.path.getsize(dest), 'bytes')
