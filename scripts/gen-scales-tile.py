#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Scales in the full-colour and the
# brand-blue palette (same drawing, remapped).
#
#   python3 scripts/gen-scales-tile.py
#
# Writes public/games/btn-scales.png and public/games/blue/btn-scales.png.
# Drawn at 4x and scaled down: a white card with one level balance on its
# stand, a circle and a triangle on the left arm and a numbered weight on the
# right.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def scales(ground, card, ink, c1, c2):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(9, 13), P(67, 63)], radius=6 * SS, fill=card)
    # the beam and its stand
    d.rounded_rectangle([P(14, 43), P(62, 46)], radius=1.5 * SS, fill=ink)
    d.polygon([P(38, 46), P(45, 59), P(31, 59)], fill=ink)
    # left arm: a circle and a triangle
    d.ellipse([P(16, 29), P(29, 42)], fill=c1, outline=ink, width=SS)
    d.polygon([P(37.5, 29), P(44, 42), P(31, 42)], fill=c2, outline=ink)
    d.line([P(37.5, 29), P(44, 42), P(31, 42), P(37.5, 29)], fill=ink, width=SS)
    # right arm: a numbered weight (a dark trapezoid with a ring on top)
    d.ellipse([P(52.5, 24.5), P(57.5, 29.5)], outline=ink, width=SS)
    d.polygon([P(50, 29), P(60, 29), P(63, 42), P(47, 42)], fill=ink)
    d.rectangle([P(53, 34), P(57, 35.4)], fill=card)
    d.rectangle([P(53, 37), P(57, 38.4)], fill=card)
    return im.resize((S, S), Image.LANCZOS)

scales('#c2410c', '#ffffff', '#2a1206', '#bbd7f0', '#f6d889').save('public/games/btn-scales.png')
scales('#182f71', '#e8f2ff', '#0f1f4d', '#4a8cf0', '#c2ddfe').save('public/games/blue/btn-scales.png')
print('wrote btn-scales.png (full and blue)')
