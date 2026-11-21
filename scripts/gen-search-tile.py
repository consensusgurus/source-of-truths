#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Search, the enormous word search, in both the
# full-colour and the brand-blue palette (same drawing, remapped palette).
#
#   python3 scripts/gen-search-tile.py
#
# Writes public/games/btn-search.png and public/games/blue/btn-search.png. Drawn at
# 4x with PIL and box-filtered down: a dense 7 by 7 field of small letters, much
# tighter than Scour's four by four, with three found-word capsules across it,
# so it reads as the big search where many words are hidden.
from PIL import Image, ImageDraw, ImageFont
import os

S, SS = 76, 4
W = S * SS
GRID = ['TSEARCH', 'OSCARME', 'PBJAWSR', 'GRIEDUN', 'UOHALKE', 'NCLUESA', 'ADMOVIE']

def font(px):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(f, px)
        except Exception:
            pass
    return ImageFont.load_default()

def draw(ground, ink, caps, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    n = len(GRID)
    cell = 9 * SS
    x0 = (W - n * cell) // 2
    y0 = (W - n * cell) // 2
    ctr = lambda r, c: (x0 + c * cell + cell // 2, y0 + r * cell + cell // 2)
    cap = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cap)
    # three finds: TOPGUN down the left, JAWS across, MOVIE along the bottom
    for (r0, c0, r1, c1), fill in zip([(0, 0, 5, 0), (2, 2, 2, 5), (6, 2, 6, 6)], caps):
        a, b = ctr(r0, c0), ctr(r1, c1)
        cd.line([a, b], fill=fill, width=int(cell * 0.82))
        rr = int(cell * 0.41)
        for (px, py) in (a, b):
            cd.ellipse([px - rr, py - rr, px + rr, py + rr], fill=fill)
    im.alpha_composite(cap)
    d = ImageDraw.Draw(im)
    f = font(int(cell * 0.66))
    for r_, row in enumerate(GRID):
        for c_, ch in enumerate(row):
            px, py = ctr(r_, c_)
            d.text((px, py + cell * 0.03), ch, fill=ink, font=f, anchor='mm')
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour: Search's deep teal ground, ivory letters, three pastel capsules
draw((21, 94, 117, 255), (255, 250, 240, 255), [(253, 224, 71, 160), (134, 239, 172, 150), (249, 168, 212, 150)], os.path.join(root, 'btn-search.png'))
# brand blue: a deep navy ground, letters #e8f2ff, capsules on two pale blue steps
draw((22, 48, 110, 255), (232, 242, 255, 255), [(194, 221, 254, 120), (74, 140, 240, 150), (219, 233, 255, 110)], os.path.join(root, 'blue', 'btn-search.png'))
