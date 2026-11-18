#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Crate in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-crate-tiles.py
# A corner of a warehouse: two walls, a crate with its cross brace, a crate
# already home on its spot, an empty spot, and the worker in a hard hat.
from PIL import Image, ImageDraw
import os
S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def crate(ground, field, wall, wall_lo, wood, wood_lo, home, home_lo, spot, hat, skin, shirt, ink):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(9, 9), P(67, 67)], radius=7 * SS, fill=field)
    # walls along the top and the left
    for x in (11, 23, 35, 47, 59):
        d.rounded_rectangle([P(x - 1, 11), P(x + 9, 19)], radius=2 * SS, fill=wall, outline=wall_lo, width=SS)
    for y in (23, 35, 47):
        d.rounded_rectangle([P(10, y), P(19, y + 9)], radius=2 * SS, fill=wall, outline=wall_lo, width=SS)
    # a crate with its brace
    d.rounded_rectangle([P(24, 24), P(40, 40)], radius=2 * SS, fill=wood, outline=wood_lo, width=int(1.5 * SS))
    d.line([P(27, 27), P(37, 37)], fill=wood_lo, width=int(1.5 * SS))
    d.line([P(37, 27), P(27, 37)], fill=wood_lo, width=int(1.5 * SS))
    # a crate home on its spot, with a tick
    d.rounded_rectangle([P(46, 24), P(62, 40)], radius=2 * SS, fill=home, outline=home_lo, width=int(1.5 * SS))
    d.line([P(50, 32), P(53, 35.5)], fill=home_lo, width=int(1.8 * SS))
    d.line([P(53, 35.5), P(58.5, 29)], fill=home_lo, width=int(1.8 * SS))
    # an empty spot
    d.ellipse([P(48, 49), P(60, 61)], outline=spot, width=int(2 * SS))
    # the worker
    d.ellipse([P(24, 55), P(40, 64)], fill=shirt)
    d.ellipse([P(26.5, 45), P(37.5, 56)], fill=skin)
    d.pieslice([P(25.5, 43.5), P(38.5, 56.5)], 180, 360, fill=hat)
    d.rounded_rectangle([P(24, 49), P(40, 51)], radius=1 * SS, fill=hat)
    d.ellipse([P(29, 52), P(30.6, 53.6)], fill=ink)
    d.ellipse([P(33.4, 52), P(35, 53.6)], fill=ink)
    return im.resize((S, S), Image.LANCZOS)

full = crate('#a16207', '#fff8e1', '#d4cfc5', '#a39c8f', '#ddb985', '#8f6533', '#cfe6c4', '#4f8a40', '#4f8a40', '#f2c94c', '#f0c8a0', '#7aa6d6', '#2a1d0c')
blue = crate('#c2ddfe', '#e8f2ff', '#a9c4f5', '#5a83d8', '#8fb6f5', '#245edf', '#e8f2ff', '#245edf', '#245edf', '#4a8cf0', '#e8f2ff', '#214bb2', '#0f1f4d')
root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
full.save(os.path.join(root, 'btn-crate.png'))
blue.save(os.path.join(root, 'blue', 'btn-crate.png'))
print('wrote btn-crate.png and blue/btn-crate.png')
