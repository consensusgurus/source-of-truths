#!/usr/bin/env python3
# Draw the tile art and app icons for Herd, the daily crowd-selection game.
#
#   python3 scripts/gen-herd-tile.py
#
# A herd of dots packed on one side of a split, one stray dot on the other.
# Writes public/games/btn-herd.png, public/games/blue/btn-herd.png and the PWA
# icons in public/herd-icons/. Drawn at 4x and box-filtered down.
from PIL import Image, ImageDraw
import os

HERD = [(0.28, 0.32), (0.40, 0.27), (0.24, 0.47), (0.37, 0.43), (0.50, 0.40),
        (0.30, 0.61), (0.43, 0.58), (0.35, 0.75), (0.48, 0.72)]
STRAY = (0.76, 0.66)

def draw(size, ground, dot, stray, line, out, radius=0.2, pad=0.0):
    SS = 4
    W = size * SS
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if radius is None:
        d.rectangle([0, 0, W - 1, W - 1], fill=ground)
    else:
        d.rounded_rectangle([0, 0, W - 1, W - 1], radius=int(W * radius), fill=ground)
    inner = W * (1 - 2 * pad)
    off = W * pad
    P = lambda x, y: (off + x * inner, off + y * inner)
    lx = off + 0.62 * inner
    d.line([(lx, off + 0.2 * inner), (lx, off + 0.82 * inner)], fill=line, width=max(2, int(inner * 0.025)))
    r = inner * 0.058
    for (x, y) in HERD:
        cx, cy = P(x, y)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=dot)
    cx, cy = P(*STRAY)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=stray)
    im = im.resize((size, size), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

pub = os.path.join(os.path.dirname(__file__), '..', 'public')
BROWN, IVORY, GOLD = (146, 64, 14, 255), (255, 248, 235, 255), (252, 211, 77, 255)
draw(76, BROWN, IVORY, GOLD, (255, 248, 235, 110), os.path.join(pub, 'games', 'btn-herd.png'))
draw(76, (33, 75, 178, 255), (232, 242, 255, 255), (194, 221, 254, 255), (232, 242, 255, 110), os.path.join(pub, 'games', 'blue', 'btn-herd.png'))
for n, sz in (('icon-192.png', 192), ('icon-512.png', 512), ('apple-touch-icon.png', 180)):
    draw(sz, BROWN, IVORY, GOLD, (255, 248, 235, 110), os.path.join(pub, 'herd-icons', n), radius=None)
draw(512, BROWN, IVORY, GOLD, (255, 248, 235, 110), os.path.join(pub, 'herd-icons', 'icon-512-maskable.png'), radius=None, pad=0.12)
