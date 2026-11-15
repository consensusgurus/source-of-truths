#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Errands in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-errands-tiles.py
# A corner of town from above: four blocks, and a route from the house round two stops. Drawn at 4x.
from PIL import Image, ImageDraw
import sys, os
S, SS = 76, 4
W = S * SS

def errands(ground, line, block, road, route, a, b, house):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lw = int(1.6 * SS)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    for x in (13, 41):
        for y in (13, 41):
            d.rounded_rectangle([x * SS, y * SS, (x + 22) * SS, (y + 22) * SS], radius=4 * SS, fill=block)
    pts = [(20, 60), (38, 60), (38, 38), (60, 38), (60, 18)]
    d.line([(x * SS, y * SS) for x, y in pts], fill=route, width=int(4.4 * SS), joint='curve')
    def dot(x, y, r, fill):
        d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=fill, outline=line, width=lw)
    d.rounded_rectangle([12 * SS, 52 * SS, 28 * SS, 68 * SS], radius=4 * SS, fill=house, outline=line, width=lw)
    dot(38, 38, 7.5, a); dot(60, 18, 7.5, b)
    return im.resize((S, S), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/games'
os.makedirs(out + '/blue', exist_ok=True)
errands('#be123c', '#4c0519', '#e11d48', '#be123c', '#ffffff', '#fde68a', '#bae6fd', '#ffffff').save(out + '/btn-errands.png')
errands('#c2ddfe', '#214bb2', '#e8f2ff', '#c2ddfe', '#214bb2', '#ffffff', '#8db8f8', '#ffffff').save(out + '/blue/btn-errands.png')
print('wrote btn-errands.png (full and blue)')
