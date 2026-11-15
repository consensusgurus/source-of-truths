#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Bag in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-bag-tiles.py
# A paper grocery bag with a loaf, a carton and a tomato showing over the top. Drawn at 4x and scaled down.
from PIL import Image, ImageDraw
import sys, os
S, SS = 76, 4
W = S * SS
P = lambda pts: [(int(x * SS), int(y * SS)) for x, y in pts]

def bag(ground, line, paper, fold, a, b, c):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lw = int(1.6 * SS)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    # what shows over the top: a carton, a loaf, a tomato
    d.polygon(P([(24, 34), (24, 17), (29, 11), (35, 11), (40, 17), (40, 34)]), fill=a); d.line(P([(24, 34), (24, 17), (29, 11), (35, 11), (40, 17), (40, 34)]), fill=line, width=lw, joint='curve'); d.line(P([(24, 17), (40, 17)]), fill=line, width=lw)
    d.rounded_rectangle([36 * SS, 14 * SS, 47 * SS, 36 * SS], radius=5 * SS, fill=b, outline=line, width=lw)
    d.ellipse([45 * SS, 20 * SS, 58 * SS, 33 * SS], fill=c, outline=line, width=lw)
    # the bag
    body = [(17, 30), (59, 30), (56, 64), (20, 64)]
    d.polygon(P(body), fill=paper); d.line(P(body + [body[0]]), fill=line, width=lw, joint='curve')
    d.polygon(P([(17, 30), (59, 30), (58.2, 38), (17.8, 38)]), fill=fold); d.line(P([(17.8, 38), (58.2, 38)]), fill=line, width=lw)
    d.line(P([(17, 30), (59, 30)]), fill=line, width=lw)
    return im.resize((S, S), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/games'
os.makedirs(out + '/blue', exist_ok=True)
bag('#be123c', '#4c0519', '#fde9c8', '#f6d19a', '#bae6fd', '#fde68a', '#fb7185').save(out + '/btn-bag.png')
bag('#c2ddfe', '#214bb2', '#ffffff', '#e8f2ff', '#8db8f8', '#e8f2ff', '#6ea2f4').save(out + '/blue/btn-bag.png')
print('wrote btn-bag.png (full and blue)')
