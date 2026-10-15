#!/usr/bin/env python3
# Draw the 76x76 daily tile art for the two line sudokus, Five (German
# whispers) and Racecar (palindrome), in both the full-colour and the
# brand-blue palette (same drawing, remapped palette). A fork of
# gen-window-tile.py: a 6x6 grid fragment with the game's line laid across it.
#
#   python3 scripts/gen-lines-tile.py
#
# Writes public/games/btn-{five,racecar}.png and their blue/ copies.
from PIL import Image, ImageDraw, ImageFont
import os

S, SS = 76, 4
W = S * SS
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def draw(kind, ground, line, stroke, ink, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    x0, x1 = 10 * SS, 66 * SS
    n = 6
    step = (x1 - x0) / n
    for k in range(n + 1):
        p = x0 + k * step
        wgt = 3 * SS // 2 if k % 3 == 0 else SS // 2 + 1
        d.line([(p, x0), (p, x1)], fill=line, width=wgt)
        d.line([(x0, p), (x1, p)], fill=line, width=wgt)
    ctr = lambda r, c: (x0 + (c + 0.5) * step, x0 + (r + 0.5) * step)
    if kind == 'five':
        path = [(4, 0), (2, 1), (4, 2), (2, 3), (4, 4), (2, 5)]   # a zigzag, low-high-low
        digits = [(4, 0, '2'), (2, 1, '8'), (4, 2, '1'), (2, 3, '9')]
    else:
        path = [(1, 0), (2, 1), (3, 2), (3, 3), (2, 4), (1, 5)]   # a symmetric arc
        digits = [(1, 0, '7'), (1, 5, '7'), (3, 2, '3'), (3, 3, '3')]
    pts = [ctr(r, c) for r, c in path]
    d.line(pts, fill=stroke, width=int(step * 0.42), joint='curve')
    rr = step * 0.21
    for (x, y) in (pts[0], pts[-1]):
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=stroke)
    font = ImageFont.truetype(FONT, int(step * 0.62))
    for (r, c, ch) in digits:
        d.text(ctr(r, c), ch, fill=ink, font=font, anchor='mm', stroke_width=int(SS * 1.6), stroke_fill=ground)
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour: Five's green and Racecar's slate, as on the legacy slate
draw('five', (21, 128, 61, 255), (230, 248, 236, 190), (134, 239, 172, 200), (255, 255, 255, 255), os.path.join(root, 'btn-five.png'))
draw('racecar', (71, 85, 105, 255), (235, 239, 245, 190), (203, 213, 225, 190), (255, 255, 255, 255), os.path.join(root, 'btn-racecar.png'))
# brand blue: Five on the deep navy, Racecar on the pale ground with dark ink
draw('five', (22, 48, 110, 255), (219, 233, 255, 190), (74, 140, 240, 220), (232, 242, 255, 255), os.path.join(root, 'blue', 'btn-five.png'))
draw('racecar', (194, 221, 254, 255), (16, 33, 79, 150), (74, 140, 240, 170), (15, 31, 77, 255), os.path.join(root, 'blue', 'btn-racecar.png'))
