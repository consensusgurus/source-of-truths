#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Saw, the tall daily jigsaw, in both the
# full-colour and the brand-blue palette (same drawing, remapped palette).
#
#   python3 scripts/gen-saw-tile.py
#
# Writes public/games/btn-saw.png and public/games/blue/btn-saw.png. Drawn at
# 4x with PIL and box-filtered down: Jig's tile turned tall, two TALL jigsaw
# pieces side by side, one locked and one sliding up to meet it (no frame).
from PIL import Image, ImageDraw
import os

S, SS = 76, 4
W = S * SS

def piece(d, x, y, s, face, ground, tabs, h=None):
    # body: s wide, h tall
    h = h or s
    d.rectangle([x, y, x + s, y + h], fill=face)
    r = s * 0.21
    for side, kind in tabs.items():
        if side == 'top':
            cx, cy = x + s / 2, y
        elif side == 'right':
            cx, cy = x + s, y + h / 2
        elif side == 'bottom':
            cx, cy = x + s / 2, y + h
        else:
            cx, cy = x, y + h / 2
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
    s, h = 22 * SS, 40 * SS
    # the tall piece on the left, put down
    piece(d, 10 * SS, 24 * SS, s, face, ground, {'right': 'tab'}, h)
    # its neighbour, a little higher and tilted, sliding in to lock
    lay = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    piece(ld, 44 * SS, 12 * SS, s, face2, (0, 0, 0, 0), {'left': 'blank'}, h)
    lay = lay.rotate(-7, resample=Image.BICUBIC, center=(55 * SS, 32 * SS))
    im.alpha_composite(lay)
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour: Saw's teal ground, an ivory piece and a pale-mint one
draw((15, 118, 110, 255), (255, 247, 236, 255), (153, 246, 228, 255), os.path.join(root, 'btn-saw.png'))
# brand blue: a deep navy ground, a #dbe9ff piece and a mid-blue one
draw((24, 47, 113, 255), (219, 233, 255, 255), (77, 132, 243, 255), os.path.join(root, 'blue', 'btn-saw.png'))
