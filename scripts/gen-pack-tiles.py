#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Pack in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-pack-tiles.py
# Three boxes stacked the way they sit in a trunk, seen from a corner. Drawn at 4x and scaled down.
from PIL import Image, ImageDraw
import sys, os
S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def cube(d, cx, cy, a, h, top, left, right, line):
    # an isometric box: (cx, cy) is the near bottom corner, a the half width, h the height
    t = [(cx, cy - h - a), (cx + a, cy - h - a / 2), (cx, cy - h), (cx - a, cy - h - a / 2)]
    l = [(cx - a, cy - h - a / 2), (cx, cy - h), (cx, cy), (cx - a, cy - a / 2)]
    r = [(cx + a, cy - h - a / 2), (cx, cy - h), (cx, cy), (cx + a, cy - a / 2)]
    for poly, fill in ((t, top), (l, left), (r, right)):
        d.polygon([P(*p) for p in poly], fill=fill)
        d.line([P(*p) for p in poly + [poly[0]]], fill=line, width=int(1.6 * SS), joint='curve')

def pack(ground, line, a1, a2, a3):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    cube(d, 27, 62, 15, 16, a1[0], a1[1], a1[2], line)
    cube(d, 51, 60, 13, 26, a2[0], a2[1], a2[2], line)
    cube(d, 30, 37, 11, 11, a3[0], a3[1], a3[2], line)
    return im.resize((S, S), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/games'
os.makedirs(out + '/blue', exist_ok=True)
pack('#a21caf', '#3b0a45', ('#fde68a', '#fbbf24', '#f59e0b'), ('#bae6fd', '#7dd3fc', '#38bdf8'), ('#ffffff', '#fbcfe8', '#f9a8d4')).save(out + '/btn-pack.png')
pack('#c2ddfe', '#214bb2', ('#ffffff', '#e8f2ff', '#c9e0fd'), ('#e8f2ff', '#8db8f8', '#6ea2f4'), ('#ffffff', '#c9e0fd', '#8db8f8')).save(out + '/blue/btn-pack.png')
print('wrote btn-pack.png (full and blue)')
