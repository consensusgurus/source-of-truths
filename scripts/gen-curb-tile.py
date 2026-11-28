#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Curb in the full-colour and the
# brand-blue palette (same drawing, remapped).
#
#   python3 scripts/gen-curb-tile.py
#
# Writes public/games/btn-curb.png and public/games/blue/btn-curb.png.
# Drawn at 4x and scaled down: a card of grey asphalt with the curb on the
# right, two parked cars against it and the player's car angled into the gap.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def car(im, cx, cy, w, h, ang, fill, ink, glass):
    layer = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0 = cx - w / 2, cy - h / 2
    d.rounded_rectangle([P(x0, y0), P(x0 + w, y0 + h)], radius=2.6 * SS, fill=fill, outline=ink, width=SS)
    d.rounded_rectangle([P(x0 + 2, y0 + 3), P(x0 + w - 2, y0 + 7)], radius=1.2 * SS, fill=glass, outline=ink, width=int(SS * 0.75))
    if ang:
        layer = layer.rotate(ang, resample=Image.BICUBIC, center=P(cx, cy))
    im.alpha_composite(layer)

def curb(ground, card, road, walk, ink, c1, c2, me, glass):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(9, 9), P(67, 67)], radius=6 * SS, fill=road)
    d.rectangle([P(55, 9.5), P(66.5, 66.5)], fill=walk)
    d.rectangle([P(54, 9.5), P(55.5, 66.5)], fill=ink)
    d.rectangle([P(28, 9.5), P(29, 66.5)], fill=card)
    car(im, 46, 20, 12, 18, 0, c1, ink, glass)
    car(im, 46, 57, 12, 16, 0, c2, ink, glass)
    car(im, 37, 39, 12, 18, 12, me, ink, glass)
    return im.resize((S, S), Image.LANCZOS)

curb('#1e40af', '#ffffff', '#dfe3ea', '#f4f5f2', '#0b1636', '#f4c6cf', '#d9eab0', '#93c5fd', '#ffffff').save('public/games/btn-curb.png')
curb('#182f71', '#e8f2ff', '#cfdcf5', '#e8f2ff', '#0f1f4d', '#c2ddfe', '#c2ddfe', '#4a8cf0', '#e8f2ff').save('public/games/blue/btn-curb.png')
print('wrote btn-curb.png (full and blue)')
