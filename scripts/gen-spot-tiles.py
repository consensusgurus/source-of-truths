#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Spot in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-spot-tiles.py
# Two copies of one small picture; the sun is missing from the second, and a
# ring marks the spot. Drawn at 4x and scaled down.
from PIL import Image, ImageDraw
import sys, os
S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def spot(ground, card, sky, sun, hill, ring):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    for k, x in enumerate((9, 40)):
        d.rounded_rectangle([P(x, 18), P(x + 27, 58)], radius=4 * SS, fill=card)
        d.rectangle([P(x + 3, 21), P(x + 24, 55)], fill=sky)
        d.polygon([P(x + 3, 55), P(x + 3, 44), P(x + 11, 36), P(x + 17, 42), P(x + 21, 38), P(x + 24, 41), P(x + 24, 55)], fill=hill)
        if k == 0:
            d.ellipse([P(x + 14, 24), P(x + 21, 31)], fill=sun)
        else:
            d.ellipse([P(x + 11, 21), P(x + 24, 34)], outline=ring, width=int(2.2 * SS))
    return im.resize((S, S), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/games'
os.makedirs(out + '/blue', exist_ok=True)
spot('#be123c', '#fff1f2', '#bae6fd', '#fbbf24', '#15803d', '#be123c').save(out + '/btn-spot.png')
spot('#c2ddfe', '#e8f2ff', '#8db8f8', '#e8f2ff', '#0f1f4d', '#214bb2').save(out + '/blue/btn-spot.png')
print('wrote btn-spot.png (full and blue)')
