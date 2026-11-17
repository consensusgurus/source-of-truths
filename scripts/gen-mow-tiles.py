#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Mow in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-mow-tiles.py
# A lawn, the left of it mown in stripes, a tree in the long grass, and the
# mower pushed up the edge of the cut. Drawn at 4x and scaled down.
from PIL import Image, ImageDraw
import sys, os
S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def mow(ground, tall, cut, cut2, tree, tree2, body, dark, fence):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    x0, y0, c = 14, 14, 12
    d.rounded_rectangle([P(x0 - 2, y0 - 2), P(x0 + 4 * c + 2, y0 + 4 * c + 2)], radius=4 * SS, fill=fence)
    d.rectangle([P(x0, y0), P(x0 + 4 * c, y0 + 4 * c)], fill=tall)
    for k in range(2):
        d.rectangle([P(x0 + k * c, y0), P(x0 + (k + 1) * c, y0 + 4 * c)], fill=cut)
        d.rectangle([P(x0 + k * c + 3, y0), P(x0 + (k + 1) * c - 3, y0 + 4 * c)], fill=cut2)
    d.ellipse([P(44, 18), P(60, 34)], fill=tree)
    d.ellipse([P(46, 20), P(53, 27)], fill=tree2)
    # the mower, pushed up: handle behind it, then the deck
    d.line([P(30, 56), P(27, 67)], fill=dark, width=int(2.4 * SS))
    d.line([P(40, 56), P(43, 67)], fill=dark, width=int(2.4 * SS))
    d.line([P(25, 67), P(45, 67)], fill=dark, width=int(3.2 * SS))
    for wx, wy in [(23, 38), (43, 38), (23, 51), (43, 51)]:
        d.rounded_rectangle([P(wx, wy), P(wx + 4, wy + 6)], radius=1 * SS, fill=dark)
    d.rounded_rectangle([P(25, 36), P(45, 58)], radius=4 * SS, fill=body, outline=dark, width=int(1.4 * SS))
    d.ellipse([P(29, 41), P(41, 53)], fill=dark)
    d.ellipse([P(33, 45), P(37, 49)], fill=body)
    return im.resize((S, S), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/games'
os.makedirs(out + '/blue', exist_ok=True)
mow('#be123c', '#4e8f33', '#a7dc7c', '#c9eda6', '#2f6e2c', '#5fb04f', '#ffffff', '#0b0d12', '#7a4a20').save(out + '/btn-mow.png')
mow('#c2ddfe', '#5d8ee8', '#b9d4fb', '#e8f2ff', '#214bb2', '#8db8f8', '#ffffff', '#0f1f4d', '#214bb2').save(out + '/blue/btn-mow.png')
print('wrote btn-mow.png (full and blue)')
