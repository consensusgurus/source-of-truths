#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Arcos, the daily set of acrostics, in both
# the full-colour and the brand-blue palette (same drawing, remapped palette).
#
#   python3 scripts/gen-arcos-tile.py
#
# Writes public/games/btn-arcos.png and public/games/blue/btn-arcos.png. Drawn
# at 4x and box-filtered down: four rows of answer squares with the first
# column lit, the spine that spells the hidden word.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS

def draw(ground, cell, spine, diag):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    lens = [4, 3, 4, 3]
    c, g = 11 * SS, 3 * SS
    x0, y0 = 12 * SS, 13 * SS
    for r, n in enumerate(lens):
        for k in range(n):
            x = x0 + k * (c + g)
            y = y0 + r * (c + g)
            fill = spine if k == 0 else (diag if k == r and k > 0 else cell)
            d.rounded_rectangle([x, y, x + c, y + c], radius=2 * SS, fill=fill)
    return im.resize((S, S), Image.LANCZOS)

full = draw('#1e40af', '#dbeafe', '#fbbf24', '#93c5fd')
blue = draw('#16306e', '#dbe9ff', '#4a8cf0', '#245edf')
full.save('public/games/btn-arcos.png')
blue.save('public/games/blue/btn-arcos.png')
print('wrote btn-arcos.png (full and blue)')
