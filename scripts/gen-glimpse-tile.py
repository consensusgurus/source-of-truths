#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Glimpse in the full-colour and the
# brand-blue palette (same drawing, remapped).
#
#   python3 scripts/gen-glimpse-tile.py
#
# Writes public/games/btn-glimpse.png and public/games/blue/btn-glimpse.png.
# Drawn at 4x and scaled down: the four-quadrant panel, a few dots top left,
# a lit square pattern top right, a clock bottom left and a bar of characters
# bottom right.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def glimpse(ground, panel, ink, accent, off):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(10, 10), P(66, 66)], radius=6 * SS, fill=panel)
    d.rectangle([P(37.6, 10), P(38.4, 66)], fill=ink)
    d.rectangle([P(10, 37.6), P(66, 38.4)], fill=ink)
    for (x, y, c) in [(16, 17, ink), (22, 24, accent), (29, 16, ink), (18, 31, ink), (27, 30, accent), (32, 24, ink)]:
        d.ellipse([P(x - 2, y - 2), P(x + 2, y + 2)], fill=c)
    for i in range(4):
        x, y = 43 + (i % 2) * 10, 15 + (i // 2) * 10
        lit = i in (0, 3)
        d.rounded_rectangle([P(x, y), P(x + 8, y + 8)], radius=1.5 * SS, fill=accent if lit else off)
    d.ellipse([P(15, 43), P(33, 61)], outline=ink, width=int(1.6 * SS))
    d.line([P(24, 52), P(24, 46)], fill=ink, width=int(2 * SS))
    d.line([P(24, 52), P(29, 52)], fill=ink, width=int(2 * SS))
    d.rounded_rectangle([P(43, 49), P(61, 55)], radius=3 * SS, fill=ink)
    return im.resize((S, S), Image.LANCZOS)

glimpse('#86198f', '#ffffff', '#1f1029', '#e879f9', '#f1e4f5').save('public/games/btn-glimpse.png')
glimpse('#182f71', '#e8f2ff', '#0f1f4d', '#4a8cf0', '#c2ddfe').save('public/games/blue/btn-glimpse.png')
print('wrote btn-glimpse.png (full and blue)')
