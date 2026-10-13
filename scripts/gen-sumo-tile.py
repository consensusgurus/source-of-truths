#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Sumo, the greater-than sudoku, in both the
# full-colour and the brand-blue palette (same drawing, remapped palette).
#
#   python3 scripts/gen-sumo-tile.py
#
# Writes public/games/btn-sumo.png and public/games/blue/btn-sumo.png. Drawn at
# 4x with PIL and box-filtered down: one 3x3 box, its four inner lines BENT
# into signs exactly as the board draws them, with two digits that agree.
from PIL import Image, ImageDraw, ImageFont
import os

S, SS = 76, 4
W = S * SS

def draw(ground, line, heavy, fill, ink, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    x0, x1 = 12 * SS, 64 * SS
    step = (x1 - x0) / 3
    K, H = step * 0.2, step * 0.2
    # two filled squares: the 9 the bends point away from, the 1 they point at
    d.rectangle([x0, x0, x0 + step, x0 + step], fill=fill)
    lw = int(SS * 1.6)
    # the box the tile shows; every bend is read off it, so the art is a legal
    # board: 9 top left (every bend points away), 1 bottom right (every bend in)
    B = [[9, 4, 6], [7, 3, 5], [8, 2, 1]]
    for r in range(3):
        for c in (1, 2):
            dr = 1 if B[r][c - 1] > B[r][c] else -1   # point at the smaller square
            x = x0 + c * step; y = x0 + r * step; m = y + step / 2
            d.line([(x, y), (x, m - H), (x + dr * K, m), (x, m + H), (x, y + step)], fill=line, width=lw, joint='curve')
    for r in (1, 2):
        for c in range(3):
            dr = 1 if B[r - 1][c] > B[r][c] else -1
            y = x0 + r * step; x = x0 + c * step; m = x + step / 2
            d.line([(x, y), (m - H, y), (m, y + dr * K), (m + H, y), (x + step, y)], fill=line, width=lw, joint='curve')
    d.rectangle([x0, x0, x1, x1], outline=heavy, width=int(2.5 * SS))
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', int(step * 0.62))
    except Exception:
        font = ImageFont.load_default()
    d.text((x0 + step / 2, x0 + step / 2), '9', fill=ink, font=font, anchor='mm')
    d.text((x0 + 2.5 * step, x0 + 2.5 * step), '1', fill=heavy, font=font, anchor='mm')
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour: Sumo's ochre, the clay of the ring
draw((138, 109, 11, 255), (250, 236, 190, 235), (255, 255, 255, 245), (196, 160, 52, 255), (255, 255, 255, 255), os.path.join(root, 'btn-sumo.png'))
# brand blue: a mid-blue ground, light parts to #dbe9ff, dark to #0f1f4d
draw((33, 75, 178, 255), (219, 233, 255, 235), (232, 242, 255, 245), (77, 132, 243, 255), (232, 242, 255, 255), os.path.join(root, 'blue', 'btn-sumo.png'))
