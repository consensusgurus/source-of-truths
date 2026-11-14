#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Chef in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-chef-tiles.py
# A chef's hat over a plate. Drawn at 4x and scaled down.
from PIL import Image, ImageDraw
import sys, os
S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def chef(ground, hat, line, plate, food):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    # the plate
    d.ellipse([P(12, 50), P(64, 68)], fill=line)
    d.ellipse([P(14, 51), P(62, 66)], fill=plate)
    d.ellipse([P(26, 54), P(50, 62)], fill=food)
    # the hat: three puffs, the crown, the band
    for cx, cy, r in ((25, 26, 11), (38, 20, 13), (51, 26, 11)):
        d.ellipse([P(cx - r - 1.6, cy - r - 1.6), P(cx + r + 1.6, cy + r + 1.6)], fill=line)
    d.rectangle([P(24.4, 26), P(51.6, 46.6)], fill=line)
    for cx, cy, r in ((25, 26, 11), (38, 20, 13), (51, 26, 11)):
        d.ellipse([P(cx - r, cy - r), P(cx + r, cy + r)], fill=hat)
    d.rectangle([P(26, 26), P(50, 45)], fill=hat)
    d.rounded_rectangle([P(23, 40), P(53, 47)], radius=2 * SS, fill=line)
    d.rounded_rectangle([P(24.6, 41.6), P(51.4, 45.4)], radius=1 * SS, fill=hat)
    return im.resize((S, S), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/games'
os.makedirs(out + '/blue', exist_ok=True)
chef('#be123c', '#ffffff', '#881337', '#fff7ed', '#fbbf24').save(out + '/btn-chef.png')
chef('#c2ddfe', '#ffffff', '#214bb2', '#e8f2ff', '#8db8f8').save(out + '/blue/btn-chef.png')
print('wrote btn-chef.png (full and blue)')
