#!/usr/bin/env python3
# Draw the tile art and app icons for Poll, the daily crowd-percentage game.
#
#   python3 scripts/gen-poll-tile.py
#
# Two answer cards over a split bar with a slider knob sitting on the split:
# pick yours, then guess how everyone divided. Writes
# public/games/btn-poll.png, public/games/blue/btn-poll.png and the PWA icons
# in public/poll-icons/. Drawn at 4x and box-filtered down.
from PIL import Image, ImageDraw
import os

SPLIT = 0.62

def draw(size, ground, a, b, knob, ring, out, radius=0.2, pad=0.0):
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
    X = lambda x: off + x * inner
    # the two answer cards
    r = int(inner * 0.05)
    d.rounded_rectangle([X(0.16), X(0.2), X(0.47), X(0.45)], radius=r, fill=a)
    d.rounded_rectangle([X(0.53), X(0.2), X(0.84), X(0.45)], radius=r, outline=a, width=max(2, int(inner * 0.03)))
    # the split bar
    y0, y1 = X(0.62), X(0.76)
    br = int((y1 - y0) / 2)
    d.rounded_rectangle([X(0.14), y0, X(0.86), y1], radius=br, fill=b)
    d.rounded_rectangle([X(0.14), y0, X(SPLIT), y1], radius=br, fill=a)
    d.rectangle([X(SPLIT) - br, y0, X(SPLIT), y1], fill=a)
    # the knob
    cx, cy, kr = X(SPLIT), (y0 + y1) / 2, inner * 0.115
    d.ellipse([cx - kr, cy - kr, cx + kr, cy + kr], fill=ring)
    kr2 = kr * 0.68
    d.ellipse([cx - kr2, cy - kr2, cx + kr2, cy + kr2], fill=knob)
    im = im.resize((size, size), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

pub = os.path.join(os.path.dirname(__file__), '..', 'public')
TEAL, IVORY, DEEP, GOLD = (15, 118, 110, 255), (240, 253, 250, 255), (17, 78, 74, 255), (252, 211, 77, 255)
draw(76, TEAL, IVORY, DEEP, GOLD, DEEP, os.path.join(pub, 'games', 'btn-poll.png'))
draw(76, (194, 221, 254, 255), (33, 75, 178, 255), (232, 242, 255, 255), (74, 140, 240, 255), (15, 31, 77, 255), os.path.join(pub, 'games', 'blue', 'btn-poll.png'))
for n, sz in (('icon-192.png', 192), ('icon-512.png', 512), ('apple-touch-icon.png', 180)):
    draw(sz, TEAL, IVORY, DEEP, GOLD, DEEP, os.path.join(pub, 'poll-icons', n), radius=None)
draw(512, TEAL, IVORY, DEEP, GOLD, DEEP, os.path.join(pub, 'poll-icons', 'icon-512-maskable.png'), radius=None, pad=0.12)
