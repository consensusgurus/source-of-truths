#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Scour, the themed word search, in both the
# full-colour and the brand-blue palette (same drawing, remapped palette).
#
#   python3 scripts/gen-scour-tile.py
#
# Writes public/games/btn-scour.png and public/games/blue/btn-scour.png. Drawn
# at 4x with PIL and box-filtered down: a small letter grid with one word ringed
# by a found-word capsule running diagonally across it.
from PIL import Image, ImageDraw, ImageFont
import os

S, SS = 76, 4
W = S * SS
GRID = ['SCOU', 'TRAE', 'MOUR', 'LANE']

def font(px):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(f, px)
        except Exception:
            pass
    return ImageFont.load_default()

def draw(ground, ink, capsule, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    cell = 14 * SS
    x0 = (W - 4 * cell) // 2
    y0 = (W - 4 * cell) // 2
    # the found word, a diagonal capsule from the top left to the bottom right
    cap = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cap)
    a = (x0 + cell // 2, y0 + cell // 2)
    b = (x0 + 3 * cell + cell // 2, y0 + 3 * cell + cell // 2)
    cd.line([a, b], fill=capsule, width=int(cell * 0.8))
    r = int(cell * 0.4)
    for (px, py) in (a, b):
        cd.ellipse([px - r, py - r, px + r, py + r], fill=capsule)
    im.alpha_composite(cap)
    d = ImageDraw.Draw(im)
    f = font(int(cell * 0.62))
    for r_, row in enumerate(GRID):
        for c_, ch in enumerate(row):
            d.text((x0 + c_ * cell + cell / 2, y0 + r_ * cell + cell / 2 + cell * 0.03), ch, fill=ink, font=f, anchor='mm')
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour: Scour's sky blue ground, ivory letters, a pale amber capsule
draw((3, 105, 161, 255), (255, 250, 240, 255), (253, 224, 71, 150), os.path.join(root, 'btn-scour.png'))
# brand blue: a mid blue ground, letters #e8f2ff, a capsule in a pale blue step
draw((33, 75, 178, 255), (232, 242, 255, 255), (194, 221, 254, 120), os.path.join(root, 'blue', 'btn-scour.png'))
