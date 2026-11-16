#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Dash in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-dash-tiles.py
# A corner of town from above: four blocks, a route from a restaurant (a circle)
# past a second one to a door (a square). Drawn at 4x.
from PIL import Image, ImageDraw
import sys, os
S, SS = 76, 4
W = S * SS

def dash(ground, line, block, route, a, b, door):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lw = int(1.6 * SS)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    for x in (13, 41):
        for y in (13, 41):
            d.rounded_rectangle([x * SS, y * SS, (x + 22) * SS, (y + 22) * SS], radius=4 * SS, fill=block)
    pts = [(18, 18), (38, 18), (38, 38), (58, 38), (58, 58)]
    d.line([(x * SS, y * SS) for x, y in pts], fill=route, width=int(4.4 * SS), joint='curve')
    def dot(x, y, r, fill):
        d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=fill, outline=line, width=lw)
    dot(18, 18, 7.5, a); dot(38, 38, 7.5, b)
    d.rounded_rectangle([50 * SS, 50 * SS, 66 * SS, 66 * SS], radius=4 * SS, fill=door, outline=line, width=lw)
    return im.resize((S, S), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/games'
os.makedirs(out + '/blue', exist_ok=True)
dash('#be123c', '#4c0519', '#e11d48', '#ffffff', '#fde68a', '#bbf7d0', '#ffffff').save(out + '/btn-dash.png')
dash('#c2ddfe', '#214bb2', '#e8f2ff', '#214bb2', '#ffffff', '#8db8f8', '#ffffff').save(out + '/blue/btn-dash.png')
print('wrote btn-dash.png (full and blue)')
