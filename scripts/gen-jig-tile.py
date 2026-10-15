#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Jig, the daily jigsaw, in both the
# full-colour and the brand-blue palette (same drawing, remapped palette).
#
#   python3 scripts/gen-jig-tile.py
#
# Writes public/games/btn-jig.png and public/games/blue/btn-jig.png. Drawn at
# 4x with PIL and box-filtered down: two interlocking jigsaw pieces, one
# seated and one lifting away, so the tile reads as a jigsaw at a glance.
from PIL import Image, ImageDraw
import os

S, SS = 76, 4
W = S * SS

def piece(d, x, y, s, face, ground, tabs):
    # body
    d.rectangle([x, y, x + s, y + s], fill=face)
    r = s * 0.19
    for side, kind in tabs.items():
        if side == 'top':
            cx, cy = x + s / 2, y
        elif side == 'right':
            cx, cy = x + s, y + s / 2
        elif side == 'bottom':
            cx, cy = x + s / 2, y + s
        else:
            cx, cy = x, y + s / 2
        if kind == 'tab':
            off = r * 0.75
            dx = {'top': 0, 'right': off, 'bottom': 0, 'left': -off}[side]
            dy = {'top': -off, 'right': 0, 'bottom': off, 'left': 0}[side]
            d.ellipse([cx + dx - r, cy + dy - r, cx + dx + r, cy + dy + r], fill=face)
        else:
            off = r * 0.75
            dx = {'top': 0, 'right': -off, 'bottom': 0, 'left': off}[side]
            dy = {'top': off, 'right': 0, 'bottom': -off, 'left': 0}[side]
            d.ellipse([cx + dx - r, cy + dy - r, cx + dx + r, cy + dy + r], fill=ground)

def draw(ground, face, face2, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    s = 26 * SS
    # the seated piece, lower left
    piece(d, 13 * SS, 37 * SS, s, face, ground, {'top': 'tab', 'right': 'blank'})
    # the lifted piece, upper right, a little apart
    lay = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    piece(ld, 39 * SS, 12 * SS, s, face2, (0, 0, 0, 0), {'left': 'tab', 'bottom': 'tab'})
    lay = lay.rotate(-10, resample=Image.BICUBIC, center=(52 * SS, 25 * SS))
    im.alpha_composite(lay)
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour: Jig's cyan ground, an ivory piece and a pale-sky one
draw((14, 116, 144, 255), (255, 247, 236, 255), (165, 243, 252, 255), os.path.join(root, 'btn-jig.png'))
# brand blue: a deep navy ground, a #dbe9ff piece and a mid-blue one
draw((24, 47, 113, 255), (219, 233, 255, 255), (77, 132, 243, 255), os.path.join(root, 'blue', 'btn-jig.png'))
