#!/usr/bin/env python3
# Draw the tile art and app icons for Aorb, the daily A-or-B crowd game.
#
#   python3 scripts/gen-aorb-tile.py
#
# Two halves of a split: a solid A-side bar and a shorter B-side bar under a
# divider, read as a split vote. Writes public/games/btn-aorb.png,
# public/games/blue/btn-aorb.png and the PWA icons in public/aorb-icons/.
# Drawn at 4x and box-filtered down.
from PIL import Image, ImageDraw
import os

def draw(size, ground, a, b, line, out, radius=0.2, pad=0.0):
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
    X = lambda v: off + v * inner
    # two option cards
    r = int(inner * 0.07)
    d.rounded_rectangle([X(0.16), X(0.20), X(0.84), X(0.44)], radius=r, outline=a, width=max(2, int(inner * 0.035)))
    d.rounded_rectangle([X(0.16), X(0.56), X(0.84), X(0.80)], radius=r, outline=b, width=max(2, int(inner * 0.035)))
    # the split filling each card
    d.rounded_rectangle([X(0.16), X(0.20), X(0.62), X(0.44)], radius=r, fill=a)
    d.rounded_rectangle([X(0.16), X(0.56), X(0.38), X(0.80)], radius=r, fill=b)
    im = im.resize((size, size), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

pub = os.path.join(os.path.dirname(__file__), '..', 'public')
VIOLET, IVORY, LILAC = (109, 40, 217, 255), (250, 246, 255, 255), (216, 196, 250, 255)
draw(76, VIOLET, IVORY, LILAC, None, os.path.join(pub, 'games', 'btn-aorb.png'))
draw(76, (36, 94, 223, 255), (232, 242, 255, 255), (194, 221, 254, 255), None, os.path.join(pub, 'games', 'blue', 'btn-aorb.png'))
for n, sz in (('icon-192.png', 192), ('icon-512.png', 512), ('apple-touch-icon.png', 180)):
    draw(sz, VIOLET, IVORY, LILAC, None, os.path.join(pub, 'aorb-icons', n), radius=None)
draw(512, VIOLET, IVORY, LILAC, None, os.path.join(pub, 'aorb-icons', 'icon-512-maskable.png'), radius=None, pad=0.12)
