#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Simon, the Arcade memory sequence daily, in
# the full-colour palette and the brand-blue one (same drawing, remapped), as
# docs/claude/daily-authoring.md rule 12 asks.
#
#   python3 scripts/gen-simon-tile.py
#
# Writes public/games/btn-simon.png and public/games/blue/btn-simon.png. Drawn at
# 4x and scaled down: a 3x3 grid of pads with one lit.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS
R = lambda v: int(v * SS)

def draw(ground, pad, lit, ink):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=R(16), fill=ground)
    x0, cell, gap = 14, 14, 3.5
    for r in range(3):
        for c in range(3):
            x = x0 + c * (cell + gap); y = x0 + r * (cell + gap)
            on = (r, c) == (1, 1)
            d.rounded_rectangle([R(x), R(y), R(x + cell), R(y + cell)], radius=R(3.4), fill=lit if on else pad, outline=ink, width=R(0.9))
    return im.resize((S, S), Image.LANCZOS)

full = draw('#7c3aed', '#ede9fe', '#fbbf24', '#2e1065')
blue = draw('#182f71', '#dbe9ff', '#8ab8ff', '#0f1f4d')
full.save('public/games/btn-simon.png')
blue.save('public/games/blue/btn-simon.png')
print('wrote btn-simon.png (full and blue)')
