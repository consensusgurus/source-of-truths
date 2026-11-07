#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Bacon, the link-two-actors-through-films
# daily, in both the full-colour and the brand-blue palette (same drawing,
# remapped).
#
#   python3 scripts/gen-bacon-tile.py
#
# Writes public/games/btn-bacon.png and public/games/blue/btn-bacon.png. Drawn
# at 4x and scaled down: two actor heads, top left and bottom right, linked by
# a line that runs through a strip of film.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS

def P(x, y):
    return (int(x * SS), int(y * SS))

def head(d, cx, cy, fill, ink):
    d.ellipse([P(cx - 9, cy - 9), P(cx + 9, cy + 9)], fill=fill, outline=ink, width=int(1.4 * SS))
    d.ellipse([P(cx - 3.4, cy - 5.6), P(cx + 3.4, cy + 1.2)], fill=ink)
    d.chord([P(cx - 6.4, cy + 1.6), P(cx + 6.4, cy + 13)], 180, 360, fill=ink)

def draw(ground, panel, film, ink, a1, a2):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    # the link: down from the first actor, across through the film, down to the second
    d.line([P(21, 21), P(21, 38), P(55, 38), P(55, 55)], fill=panel, width=int(2.6 * SS), joint='curve')
    # the film strip in the middle
    d.rounded_rectangle([P(27, 29), P(49, 47)], radius=2.5 * SS, fill=film, outline=ink, width=int(1.2 * SS))
    for x in (30, 35, 40, 45):
        d.rectangle([P(x, 31), P(x + 2.4, 33.2)], fill=ink)
        d.rectangle([P(x, 42.8), P(x + 2.4, 45)], fill=ink)
    d.rectangle([P(30, 35.4), P(46.4, 40.6)], fill=ink)
    head(d, 21, 19, a1, ink)
    head(d, 55, 57, a2, ink)
    return im.resize((S, S), Image.LANCZOS)

full = draw('#7c2d12', '#fdba74', '#fff3e6', '#2a0f05', '#fdba74', '#fde68a')
blue = draw('#182f71', '#8db8f7', '#e8f2ff', '#0f1f4d', '#8db8f7', '#dbe9ff')
full.save('public/games/btn-bacon.png')
blue.save('public/games/blue/btn-bacon.png')
print('wrote btn-bacon.png (full and blue)')
