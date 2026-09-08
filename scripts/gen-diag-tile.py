#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Diag, the diagonal sudoku, in both the
# full-colour and the brand-blue palette (rule 12 of the daily puzzle
# authoring standard: same drawing, remapped palette, never a redraw).
#
#   python3 scripts/gen-diag-tile.py
#
# Writes public/games/btn-diag.png and public/games/blue/btn-diag.png. Drawn
# at 4x with PIL and box-filtered down, like scripts/gen-quilt-tile.py: a
# grid fragment with the two diagonals ruled across it and a few printed
# digits sitting in the corners, which is what a Sudoku X looks like at a
# glance.
from PIL import Image, ImageDraw, ImageFont
import os

S, SS = 76, 4
W = S * SS

def draw(ground, line, diag, ink, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    # a 6x6 fragment of the grid, inset, with the heavy box rules
    x0, x1 = 10 * SS, 66 * SS
    n = 6
    step = (x1 - x0) / n
    for k in range(n + 1):
        p = x0 + k * step
        wgt = 3 * SS // 2 if k % 3 == 0 else SS // 2 + 1
        d.line([(p, x0), (p, x1)], fill=line, width=wgt)
        d.line([(x0, p), (x1, p)], fill=line, width=wgt)
    # the X: both diagonals, thick and pale, corner to corner of the fragment
    d.line([(x0, x0), (x1, x1)], fill=diag, width=3 * SS)
    d.line([(x1, x0), (x0, x1)], fill=diag, width=3 * SS)
    # a few printed digits, off the diagonals so the X stays clean
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', int(step * 0.62))
    except Exception:
        font = ImageFont.load_default()
    for (r, c, ch) in [(0, 4, '4'), (2, 0, '7'), (3, 5, '1'), (5, 1, '9')]:
        cx = x0 + (c + 0.5) * step
        cy = x0 + (r + 0.5) * step
        d.text((cx, cy), ch, fill=ink, font=font, anchor='mm')
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour: the cyan ground Diag wears on the legacy slate
draw((14, 116, 144, 255), (232, 246, 250, 210), (255, 255, 255, 235), (255, 255, 255, 255), os.path.join(root, 'btn-diag.png'))
# brand blue: a mid-blue ground, the drawing's light parts to #dbe9ff
draw((33, 75, 178, 255), (219, 233, 255, 200), (232, 242, 255, 240), (232, 242, 255, 255), os.path.join(root, 'blue', 'btn-diag.png'))
