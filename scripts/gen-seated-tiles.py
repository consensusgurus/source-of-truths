#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Seated in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-seated-tiles.py
# A round table from above with six chairs, five taken and one still empty. Drawn at 4x and scaled down.
from PIL import Image, ImageDraw
import sys, os, math
S, SS = 76, 4
W = S * SS

def seated(ground, line, top, chairs, empty):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    lw = int(1.6 * SS)
    def disc(cx, cy, r, fill):
        d.ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], fill=fill, outline=line, width=lw)
    for i in range(6):
        a = -math.pi / 2 + i * math.pi / 3
        disc(38 + math.cos(a) * 23, 38 + math.sin(a) * 23, 8.6, empty if i == 4 else chairs[i % len(chairs)])
    disc(38, 38, 13.5, top)
    return im.resize((S, S), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/games'
os.makedirs(out + '/blue', exist_ok=True)
seated('#be123c', '#4c0519', '#ffffff', ['#fde68a', '#bae6fd', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#fed7aa'], '#e11d48').save(out + '/btn-seated.png')
seated('#c2ddfe', '#214bb2', '#ffffff', ['#ffffff', '#8db8f8', '#e8f2ff', '#6ea2f4', '#c9e0fd', '#ffffff'], '#c2ddfe').save(out + '/blue/btn-seated.png')
print('wrote btn-seated.png (full and blue)')
