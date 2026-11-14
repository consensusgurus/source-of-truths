#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Mop in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-mop-tiles.py
# A tiled floor, half of it mopped clean, and the mop standing on it.
# Drawn at 4x and scaled down.
from PIL import Image, ImageDraw
import sys, os
S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def mop(ground, clean, dirt, line, head, collar, handle):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    x0, y0, c = 14, 14, 12
    d.rounded_rectangle([P(x0 - 2, y0 - 2), P(x0 + 4 * c + 2, y0 + 4 * c + 2)], radius=4 * SS, fill=line)
    wet = {(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (0, 2), (1, 2), (0, 3)}
    for r in range(4):
        for k in range(4):
            d.rectangle([P(x0 + k * c + 0.6, y0 + r * c + 0.6), P(x0 + (k + 1) * c - 0.6, y0 + (r + 1) * c - 0.6)], fill=clean if (k, r) in wet else dirt)
    d.line([P(40, 42), P(58, 14)], fill=handle, width=int(3.4 * SS))
    d.polygon([P(27, 41), P(49, 41), P(53, 57), P(47, 54), P(43, 59), P(38, 54), P(33, 59), P(29, 54), P(23, 57)], fill=head)
    d.rounded_rectangle([P(27, 37), P(49, 43)], radius=2 * SS, fill=collar)
    return im.resize((S, S), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/games'
os.makedirs(out + '/blue', exist_ok=True)
mop('#be123c', '#ffffff', '#fda4af', '#881337', '#fff7ed', '#881337', '#fbbf24').save(out + '/btn-mop.png')
mop('#c2ddfe', '#e8f2ff', '#8db8f8', '#214bb2', '#ffffff', '#0f1f4d', '#0f1f4d').save(out + '/blue/btn-mop.png')
print('wrote btn-mop.png (full and blue)')
