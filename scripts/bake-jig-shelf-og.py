#!/usr/bin/env python3
# Bakes public/og/jig-shelf.png, the share card for /jig/shelf.
#
#   python3 scripts/bake-jig-shelf-og.py /path/to/atrani.jpg
#
# 2026-11-21: rebuilt for the Jigsaw Puzzles portal (the old card still said
# "The Jig Puzzle Shelf"). Same dark table as the page (TABLE.dark in
# ShelfClient.jsx): title and lede left, one photo right cut three ways
# (24, 300 and 4,000 pieces) to show "any picture at any size". The photo is
# board #9 (Atrani, Sept 28), permanently past, so the card never leaks a
# future day. Pass a 1280px Commons thumb of it; credit is printed on the card.
# Fonts: Manrope TTFs (convert node_modules/@fontsource/manrope woffs with
# fontTools if /tmp/og has none). Needs Pillow.
import os, sys, random
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FD = os.environ.get('MANROPE_DIR', '/tmp/og')
S = 2
W, H = 1200 * S, 630 * S
s = lambda v: int(round(v * S))
GROUND = (22, 18, 14); SURF = (33, 27, 21)
INK = (244, 234, 216); INK2 = (214, 205, 190); MUTE = (165, 158, 147)
F = lambda w, px: ImageFont.truetype(os.path.join(FD, f'm{w}.ttf'), s(px))

im = Image.new('RGB', (W, H), GROUND)
d = ImageDraw.Draw(im)

def spaced(x, y, text, font, fill, track):
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + track
    return x

# left column
spaced(s(64), s(70), 'MIND LOFT', F(800, 22), INK, s(0.6))
spaced(s(64), s(156), 'FREE ONLINE JIGSAW PUZZLES', F(800, 15), MUTE, s(2.2))
d.text((s(60), s(184)), 'Jigsaw', font=F(800, 84), fill=INK)
d.text((s(60), s(278)), 'Puzzles', font=F(800, 84), fill=INK)
for i, ln in enumerate(['Any picture at 24 to', '4,000 pieces. A new one', 'every day. No download.']):
    d.text((s(64), s(396 + i * 36)), ln, font=F(500, 26), fill=INK2)
spaced(s(64), s(546), 'mindloftdaily.com/jig/shelf', F(700, 19), MUTE, s(0.3))

# right: one photo, cut three ways
PX, PY, PW, PH = 612, 70, 528, 470
ph = Image.open(sys.argv[1]).convert('RGB')
ph = ImageOps.fit(ph, (s(PW), s(PH)), Image.LANCZOS, centering=(0.42, 0.5))
sh = Image.new('L', (s(PW + 60), s(PH + 60)), 0)
ImageDraw.Draw(sh).rounded_rectangle([s(30), s(30), s(PW + 30), s(PH + 30)], radius=s(14), fill=170)
sh = sh.filter(ImageFilter.GaussianBlur(s(14)))
im.paste((0, 0, 0), (s(PX - 30), s(PY - 22)), sh)

cut = Image.new('RGBA', ph.size, (0, 0, 0, 0))
cd = ImageDraw.Draw(cut)
bands = [(24, 0, PW / 3), (300, PW / 3, 2 * PW / 3), (4000, 2 * PW / 3, PW)]
def tabbed(x0, y0, x1, y1, t, flip, width, fill):
    # a straight edge with one round knob in the middle (horizontal or vertical)
    if y0 == y1:
        L = x1 - x0; a, b = x0 + L * 0.38, x0 + L * 0.62
        cd.line([s(x0), s(y0), s(a), s(y0)], fill=fill, width=width)
        cd.line([s(b), s(y0), s(x1), s(y0)], fill=fill, width=width)
        r = (b - a) / 2; cx = (a + b) / 2
        box = [s(cx - r), s(y0 - r), s(cx + r), s(y0 + r)]
        cd.arc(box, 180 if flip else 0, 360 if flip else 180, fill=fill, width=width)
    else:
        L = y1 - y0; a, b = y0 + L * 0.38, y0 + L * 0.62
        cd.line([s(x0), s(y0), s(x0), s(a)], fill=fill, width=width)
        cd.line([s(x0), s(b), s(x0), s(y1)], fill=fill, width=width)
        r = (b - a) / 2; cy = (a + b) / 2
        box = [s(x0 - r), s(cy - r), s(x0 + r), s(cy + r)]
        cd.arc(box, 90 if flip else 270, 270 if flip else 450, fill=fill, width=width)
rnd = random.Random(7)
for n, bx0, bx1 in bands:
    bw = bx1 - bx0
    # cells sized as if the whole photo were cut at n pieces
    cols_full = max(2, round((n * PW / PH) ** 0.5)); cell = PW / cols_full
    cols = max(1, round(bw / cell)); rows = max(2, round(PH / cell))
    cw, ch = bw / cols, PH / rows
    lw = s(2.2) if n < 100 else s(1.4) if n < 1000 else s(0.9)
    col = (255, 255, 255, 150 if n < 1000 else 120)
    for i in range(1, cols):
        x = bx0 + i * cw
        for j in range(rows):
            tabbed(x, j * ch, x, (j + 1) * ch, 0, rnd.random() < .5, lw, col)
    for j in range(1, rows):
        y = j * ch
        for i in range(cols):
            tabbed(bx0 + i * cw, y, bx0 + (i + 1) * cw, y, 0, rnd.random() < .5, lw, col)
ph = ph.convert('RGBA'); ph.alpha_composite(cut)
pd = ImageDraw.Draw(ph)
for k in (1, 2):  # band seams
    x = s(PW * k / 3); pd.rectangle([x - s(2), 0, x + s(2), s(PH)], fill=GROUND + (255,))
fl = F(800, 17)
for n, bx0, bx1 in bands:
    lab = f'{n:,} pieces'
    tw = pd.textlength(lab, font=fl)
    cx = s((bx0 + bx1) / 2); bh = s(36)
    y0 = s(PH - 54)
    pd.rounded_rectangle([cx - tw / 2 - s(14), y0, cx + tw / 2 + s(14), y0 + bh], radius=bh // 2, fill=(22, 18, 14, 235))
    pd.text((cx - tw / 2, y0 + s(7)), lab, font=fl, fill=INK)
m = Image.new('L', ph.size, 0)
ImageDraw.Draw(m).rounded_rectangle([0, 0, ph.size[0] - 1, ph.size[1] - 1], radius=s(14), fill=255)
im.paste(ph.convert('RGB'), (s(PX), s(PY)), m)
d = ImageDraw.Draw(im)
d.text((s(PX), s(PY + PH + 18)), 'Atrani, Amalfi Coast · Photo: Paolo Costa Baldi, CC BY 3.0, Wikimedia Commons', font=F(500, 12.5), fill=MUTE)

out = im.resize((1200, 630), Image.LANCZOS)
dest = os.path.join(ROOT, 'public', 'og', 'jig-shelf.png')
out.save(dest, optimize=True)
print('wrote', dest, os.path.getsize(dest), 'bytes')
