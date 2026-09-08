#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Frame and Rim, the two gutter sudokus, in
# both the full-colour and the brand-blue palette (rule 12 of the daily puzzle
# authoring standard: same drawing, remapped palette, never a redraw).
#
#   python3 scripts/gen-gutter-tiles.py
#
# Writes public/games/btn-{frame,rim}.png and public/games/blue/btn-{frame,rim}.png,
# drawn at 4x with PIL and box-filtered down like scripts/gen-diag-tile.py: a
# grid fragment with its gutter drawn around it, Frame carrying sums in the
# margin, Rim carrying digits in the margin and nothing inside.
from PIL import Image, ImageDraw, ImageFont
import os

S, SS = 76, 4
W = S * SS

def font(px):
    try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', px)
    except Exception: return ImageFont.load_default()

def draw(kind, ground, line, ink, gut, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    n = 6
    x0, x1 = 19 * SS, 63 * SS       # the grid, inset to leave the gutter room
    step = (x1 - x0) / n
    for k in range(n + 1):
        p = x0 + k * step
        wgt = 3 * SS // 2 if k % 3 == 0 else SS // 2 + 1
        d.line([(p, x0), (p, x1)], fill=line, width=wgt)
        d.line([(x0, p), (x1, p)], fill=line, width=wgt)
    f = font(int(step * 0.62)); fs = font(int(step * 0.52))
    if kind == 'frame':
        # sums in the top and left gutters, a couple of digits inside
        for k, v in enumerate(['12', '9', '17', '', '14', '20']):
            if v: d.text((x0 + (k + 0.5) * step, x0 - 6 * SS), v, fill=gut, font=fs, anchor='mm')
        for k, v in enumerate(['6', '', '21', '15', '', '11']):
            if v: d.text((x0 - 8 * SS, x0 + (k + 0.5) * step), v, fill=gut, font=fs, anchor='mm')
        for (r, c, ch) in [(1, 4, '7'), (4, 1, '3')]:
            d.text((x0 + (c + 0.5) * step, x0 + (r + 0.5) * step), ch, fill=ink, font=f, anchor='mm')
    else:
        # a few gutters carrying their three digits, drawn as three stacked
        # marks each (three real digits are unreadable at 76px), and nothing
        # inside the grid at all
        r = int(step * 0.13)
        for k in [0, 2, 3, 5]:
            cx = x0 + (k + 0.5) * step
            for j in range(3):
                x = cx + (j - 1) * 2.6 * r
                d.ellipse([x - r, x0 - 7 * SS - r, x + r, x0 - 7 * SS + r], fill=gut)
        for k in [1, 3, 4]:
            cy = x0 + (k + 0.5) * step
            for j in range(3):
                y = cy + (j - 1) * 2.6 * r
                d.ellipse([x0 - 8 * SS - r, y - r, x0 - 8 * SS + r, y + r], fill=gut)
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out); print('wrote', out)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
draw('frame', (180, 83, 9, 255), (253, 243, 227, 210), (255, 255, 255, 255), (255, 230, 190, 255), os.path.join(root, 'btn-frame.png'))
draw('frame', (33, 75, 178, 255), (219, 233, 255, 200), (232, 242, 255, 255), (200, 220, 255, 255), os.path.join(root, 'blue', 'btn-frame.png'))
draw('rim', (77, 124, 15, 255), (241, 248, 230, 210), (255, 255, 255, 255), (235, 250, 205, 255), os.path.join(root, 'btn-rim.png'))
draw('rim', (24, 47, 113, 255), (219, 233, 255, 200), (232, 242, 255, 255), (200, 220, 255, 255), os.path.join(root, 'blue', 'btn-rim.png'))
