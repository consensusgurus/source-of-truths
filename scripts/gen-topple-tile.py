#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Topple, the daily block-rolling puzzle, in
# both the full-colour and the brand-blue palette (same drawing, remapped).
#
#   python3 scripts/gen-topple-tile.py
#
# Writes public/games/btn-topple.png and public/games/blue/btn-topple.png. Drawn
# at 4x and scaled down: a strip of floor tiles, a tall block standing on it,
# and the spring at the far end with an up-chevron.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS

def P(x, y):
    return (int(x * SS), int(y * SS))

def draw(ground, tile, tileside, block, blockside, blocktop, spring):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    # floor: five tiles in a row, slab front below
    for i in range(5):
        x0 = 10 + i * 11.5
        d.polygon([P(x0 + 2.4, 46), P(x0 + 13.4, 46), P(x0 + 11, 52), P(x0, 52)], fill=tile)
        d.polygon([P(x0, 52), P(x0 + 11, 52), P(x0 + 11, 55), P(x0, 55)], fill=tileside)
    # the spring on the last tile: pad + chevron
    sx = 10 + 4 * 11.5
    d.polygon([P(sx + 2.6, 43), P(sx + 12.6, 43), P(sx + 10.8, 48.5), P(sx + 0.8, 48.5)], fill=spring)
    d.line([P(sx + 4.2, 47.2), P(sx + 6.9, 44.2), P(sx + 9.6, 47.2)], fill=ground, width=int(1.6 * SS))
    # the block, standing on the second tile
    bx = 10 + 1 * 11.5
    d.polygon([P(bx + 0.6, 50), P(bx + 10.6, 50), P(bx + 10.6, 22), P(bx + 0.6, 22)], fill=block)
    d.polygon([P(bx + 10.6, 50), P(bx + 13, 46), P(bx + 13, 18), P(bx + 10.6, 22)], fill=blockside)
    d.polygon([P(bx + 0.6, 22), P(bx + 10.6, 22), P(bx + 13, 18), P(bx + 3, 18)], fill=blocktop)
    return im.resize((S, S), Image.LANCZOS)

full = draw('#1f3a0a', '#d9e3cc', '#8a9a78', '#bef264', '#7da33a', '#e2fba8', '#fbbf24')
blue = draw('#16306e', '#dbe9ff', '#7f9cc9', '#4a8cf0', '#245edf', '#a9c8ff', '#dbe9ff')
full.save('public/games/btn-topple.png')
blue.save('public/games/blue/btn-topple.png')
print('wrote btn-topple.png (full and blue)')
