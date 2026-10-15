#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Window, the windoku, in both the
# full-colour and the brand-blue palette (rule 12 of the daily puzzle
# authoring standard: same drawing, remapped palette, never a redraw).
#
#   python3 scripts/gen-window-tile.py
#
# Writes public/games/btn-window.png and public/games/blue/btn-window.png.
# Drawn at 4x with PIL and box-filtered down (a fork of gen-diag-tile.py): a
# grid fragment with one pale window framed across a box corner and a few
# printed digits, which is what a windoku looks like at a glance.
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
    # one window, 3x3 squares straddling the heavy rules, washed and framed
    w0, w1 = x0 + 1 * step, x0 + 4 * step
    pane = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    ImageDraw.Draw(pane).rectangle([w0, w0, w1, w1], fill=diag[:3] + (70,))
    im.alpha_composite(pane)
    d = ImageDraw.Draw(im)
    d.rectangle([w0, w0, w1, w1], outline=diag, width=3 * SS)
    # a few printed digits
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', int(step * 0.62))
    except Exception:
        font = ImageFont.load_default()
    for (r, c, ch) in [(0, 4, '4'), (2, 2, '7'), (3, 5, '1'), (5, 0, '9')]:
        cx = x0 + (c + 0.5) * step
        cy = x0 + (r + 0.5) * step
        d.text((cx, cy), ch, fill=ink, font=font, anchor='mm')
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour: the rose ground Window wears on the legacy slate
draw((190, 24, 93, 255), (253, 236, 245, 210), (255, 255, 255, 235), (255, 255, 255, 255), os.path.join(root, 'btn-window.png'))
# brand blue: a mid-blue ground, the drawing's light parts to #dbe9ff
draw((33, 75, 178, 255), (219, 233, 255, 200), (232, 242, 255, 240), (232, 242, 255, 255), os.path.join(root, 'blue', 'btn-window.png'))
