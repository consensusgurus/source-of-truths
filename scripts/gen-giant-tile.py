#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Giant, the 16x16 sudoku, in both the
# full-colour and the brand-blue palette (rule 12 of the daily puzzle
# authoring standard: same drawing, remapped palette, never a redraw).
#
#   python3 scripts/gen-giant-tile.py
#
# Writes public/games/btn-giant.png and public/games/blue/btn-giant.png. Drawn
# at 4x with PIL and box-filtered down: the whole 16x16 at a glance, its
# sixteen boxes ruled heavy, with a few squares filled in and two of them
# carrying the letters that tell a giant sudoku from an ordinary one.
from PIL import Image, ImageDraw, ImageFont
import os

S, SS = 76, 4
W = S * SS

def draw(ground, line, heavy, fill, ink, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    x0, x1 = 9 * SS, 67 * SS
    n = 16
    step = (x1 - x0) / n
    # a scatter of filled squares, the printed clues
    for (r, c) in [(0, 2), (1, 9), (2, 13), (3, 5), (5, 0), (6, 11), (7, 7), (9, 3), (10, 14), (11, 9), (12, 1), (13, 6), (14, 12), (15, 15), (4, 15), (8, 10)]:
        d.rectangle([x0 + c * step, x0 + r * step, x0 + (c + 1) * step, x0 + (r + 1) * step], fill=fill)
    for k in range(n + 1):
        p = x0 + k * step
        if k % 4 == 0:
            continue
        d.line([(p, x0), (p, x1)], fill=line, width=SS // 2 + 1)
        d.line([(x0, p), (x1, p)], fill=line, width=SS // 2 + 1)
    for k in range(0, n + 1, 4):
        p = x0 + k * step
        d.line([(p, x0 - SS), (p, x1 + SS)], fill=heavy, width=2 * SS)
        d.line([(x0 - SS, p), (x1 + SS, p)], fill=heavy, width=2 * SS)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', int(step * 3.1))
    except Exception:
        font = ImageFont.load_default()
    # two big symbols sitting in whole boxes: a G and a 16-ness hint
    for (br, bc, ch) in [(0, 0, 'G'), (2, 2, 'A')]:
        cx = x0 + (bc * 4 + 2) * step
        cy = x0 + (br * 4 + 2) * step
        d.rectangle([x0 + bc * 4 * step + SS, x0 + br * 4 * step + SS, x0 + (bc + 1) * 4 * step - SS, x0 + (br + 1) * 4 * step - SS], fill=ground)
        d.text((cx, cy), ch, fill=ink, font=font, anchor='mm')
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour: the slate indigo Giant wears on the legacy slate
draw((57, 73, 171, 255), (199, 206, 245, 150), (255, 255, 255, 240), (121, 134, 203, 255), (255, 255, 255, 255), os.path.join(root, 'btn-giant.png'))
# brand blue: a deep-blue ground, light parts to #dbe9ff
draw((22, 48, 110, 255), (219, 233, 255, 140), (232, 242, 255, 240), (36, 94, 223, 255), (232, 242, 255, 255), os.path.join(root, 'blue', 'btn-giant.png'))
