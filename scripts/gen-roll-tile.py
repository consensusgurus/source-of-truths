#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Roll, the daily die-rolling puzzle, in both
# the full-colour and the brand-blue palette (same drawing, remapped).
#
#   python3 scripts/gen-roll-tile.py
#
# Writes public/games/btn-roll.png and public/games/blue/btn-roll.png. Drawn at
# 4x and scaled down: a strip of floor tiles, a numbered square ahead, and a die
# seen from a corner showing three faces (top, front, right) with their pips.
from PIL import Image, ImageDraw, ImageFont

S, SS = 76, 4
W = S * SS

def P(x, y):
    return (int(x * SS), int(y * SS))

def dot(d, x, y, r, fill):
    d.ellipse([P(x - r, y - r), P(x + r, y + r)], fill=fill)

def draw(ground, tile, tileside, die, dieside, dietop, pip, mark):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    for i in range(5):
        x0 = 10 + i * 11.5
        d.polygon([P(x0 + 2.4, 48), P(x0 + 13.4, 48), P(x0 + 11, 54), P(x0, 54)], fill=tile)
        d.polygon([P(x0, 54), P(x0 + 11, 54), P(x0 + 11, 57), P(x0, 57)], fill=tileside)
    # a numbered square ahead, outlined
    nx = 10 + 3 * 11.5
    d.polygon([P(nx + 3.4, 49), P(nx + 12.4, 49), P(nx + 10.4, 53), P(nx + 1.4, 53)], outline=mark, width=int(1.2 * SS))
    # the die, standing on the first tiles: front, right side, top
    x0, x1, yb, yt, k = 12, 30, 52, 34, 6
    d.polygon([P(x0, yb), P(x1, yb), P(x1, yt), P(x0, yt)], fill=die)
    d.polygon([P(x1, yb), P(x1 + k, yb - k * 0.75), P(x1 + k, yt - k * 0.75), P(x1, yt)], fill=dieside)
    d.polygon([P(x0, yt), P(x1, yt), P(x1 + k, yt - k * 0.75), P(x0 + k, yt - k * 0.75)], fill=dietop)
    # front face shows 3, top shows 1, side shows 2
    for (u, v) in [(0.25, 0.25), (0.5, 0.5), (0.75, 0.75)]:
        dot(d, x0 + (x1 - x0) * u, yt + (yb - yt) * v, 1.7, pip)
    dot(d, (x0 + x1) / 2 + k / 2, yt - k * 0.375, 1.5, pip)
    dot(d, x1 + k * 0.33, yt + 4, 1.2, pip)
    dot(d, x1 + k * 0.67, yb - 6, 1.2, pip)
    return im.resize((S, S), Image.LANCZOS)

full = draw('#123d1f', '#d6e7d9', '#86a08b', '#86efac', '#3f9e63', '#c8f7d8', '#0b2a16', '#fbbf24')
blue = draw('#182f71', '#dbe9ff', '#7f9cc9', '#4a8cf0', '#245edf', '#a9c8ff', '#0f1f4d', '#dbe9ff')
full.save('public/games/btn-roll.png')
blue.save('public/games/blue/btn-roll.png')
print('wrote btn-roll.png (full and blue)')
