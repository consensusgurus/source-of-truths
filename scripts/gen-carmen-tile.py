#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Carmen, the daily globe chase, in the
# full-colour palette (the Noir look: dark water, lime land) and the brand-blue
# one (same drawing, remapped), as docs/claude/daily-authoring.md rule 12 asks.
#
#   python3 scripts/gen-carmen-tile.py
#
# Writes public/games/btn-carmen.png and public/games/blue/btn-carmen.png.
# Drawn at 4x and scaled down: a globe with two landmasses, a flight arc and a pin.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS
R = lambda v: v * SS

def draw(ground, ocean, land, arc, ink, pin):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=R(16), fill=ground)
    cx, cy, r = 38, 40, 24
    globe = Image.new('L', (W, W), 0)
    ImageDraw.Draw(globe).ellipse([R(cx - r), R(cy - r), R(cx + r), R(cy + r)], fill=255)
    layer = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    g = ImageDraw.Draw(layer)
    g.rectangle([0, 0, W, W], fill=ocean)
    g.polygon([(R(x), R(y)) for x, y in [(18, 30), (26, 22), (36, 24), (38, 32), (32, 38), (34, 46), (28, 52), (22, 46), (16, 40)]], fill=land)
    g.polygon([(R(x), R(y)) for x, y in [(44, 26), (54, 24), (62, 32), (60, 44), (52, 56), (46, 50), (48, 40), (42, 34)]], fill=land)
    im.paste(layer, (0, 0), globe)
    d = ImageDraw.Draw(im)
    d.ellipse([R(cx - r), R(cy - r), R(cx + r), R(cy + r)], outline=ink, width=int(R(1.4)))
    d.arc([R(22), R(18), R(58), R(54)], start=200, end=330, fill=arc, width=int(R(2.4)))
    # the pin, at the arc's end
    px, py = 55, 27
    d.ellipse([R(px - 5), R(py - 12), R(px + 5), R(py - 2)], fill=pin, outline=ink, width=int(R(1)))
    d.polygon([(R(px - 4), R(py - 5)), (R(px + 4), R(py - 5)), (R(px), R(py + 2))], fill=pin, outline=ink)
    d.ellipse([R(px - 1.8), R(py - 8.8), R(px + 1.8), R(py - 5.2)], fill=ink)
    return im.resize((S, S), Image.LANCZOS)

full = draw('#4d7c0f', '#1e232b', '#b9d97c', '#ffffff', '#16181d', '#f4f9e6')
blue = draw('#16306e', '#0f1f4d', '#8ab8ff', '#dbe9ff', '#0f1f4d', '#e8f2ff')
full.save('public/games/btn-carmen.png')
blue.save('public/games/blue/btn-carmen.png')
print('wrote btn-carmen.png (full and blue)')
