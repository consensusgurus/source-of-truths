#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Plow in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-plow-tiles.py
# A snowed-in crossroads from above, the left street plowed to asphalt with
# banks of snow either side, and the orange plow truck pushing up it, blade first.
# Drawn at 4x and scaled down.
from PIL import Image, ImageDraw
import sys, os
S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def plow(ground, field, snow, asph, line, body, blade, dark, glass):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(10, 10), P(66, 66)], radius=6 * SS, fill=field)
    # the two snowy streets of a crossroads
    d.rectangle([P(10, 34), P(66, 46)], fill=snow)
    d.rectangle([P(22, 10), P(34, 66)], fill=snow)
    # the plowed street: asphalt up the left street, banks either side
    d.rectangle([P(24, 30), P(32, 66)], fill=asph)
    d.line([P(28, 32), P(28, 66)], fill=line, width=int(0.9 * SS))
    # a house in the corner, roof under snow
    d.rectangle([P(44, 15), P(60, 28)], fill=dark)
    d.rectangle([P(45, 16), P(59, 21)], fill=(255, 255, 255, 255))
    d.rectangle([P(45, 22), P(59, 27)], fill=snow)
    d.rectangle([P(44, 52), P(60, 62)], fill=dark)
    d.rectangle([P(45, 53), P(59, 57)], fill=(255, 255, 255, 255))
    d.rectangle([P(45, 57), P(59, 61)], fill=snow)
    # the truck, facing up, blade first
    d.polygon([P(19, 21), P(37, 23), P(37, 25.5), P(19, 23.5)], fill=blade, outline=dark)
    d.rounded_rectangle([P(23.5, 34), P(32.5, 46)], radius=1.2 * SS, fill=dark)
    d.rounded_rectangle([P(24.5, 35), P(31.5, 45)], radius=1 * SS, fill=(230, 225, 214, 255))
    d.rounded_rectangle([P(23, 25), P(33, 34)], radius=1.8 * SS, fill=body)
    d.rounded_rectangle([P(24.5, 26), P(31.5, 28.5)], radius=0.8 * SS, fill=glass)
    d.ellipse([P(25, 30), P(27.4, 32.4)], fill='#ffb020')
    d.ellipse([P(28.6, 30), P(31, 32.4)], fill='#ffb020')
    return im.resize((S, S), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/games'
os.makedirs(out + '/blue', exist_ok=True)
plow('#be123c', '#e6edf5', '#ffffff', '#4b525d', '#e7bd4f', '#ee7d22', '#f2c94c', '#2b2f36', '#26313f').save(out + '/btn-plow.png')
plow('#c2ddfe', '#e8f2ff', '#ffffff', '#214bb2', '#8db8f8', '#5d8ee8', '#b9d4fb', '#0f1f4d', '#0f1f4d').save(out + '/blue/btn-plow.png')
print('wrote btn-plow.png (full and blue)')
