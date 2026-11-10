#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Filing, the name-the-company-from-its-IPO-
# filing daily, in both the full-colour and the brand-blue palette (same
# drawing, remapped).
#
#   python3 scripts/gen-filing-tile.py
#
# Writes public/games/btn-filing.png and public/games/blue/btn-filing.png.
# Drawn at 4x and scaled down: a filing page with a folded corner, a form
# header, text lines and one black redaction bar where the name would be.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS

def P(x, y):
    return (int(x * SS), int(y * SS))

def draw(ground, page, fold, head, line, bar):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.polygon([P(17, 9), P(51, 9), P(60, 18), P(60, 67), P(17, 67)], fill=page)
    d.polygon([P(51, 9), P(60, 18), P(51, 18)], fill=fold)
    d.rounded_rectangle([P(22, 15), P(44, 19)], radius=1.5 * SS, fill=head)
    d.rounded_rectangle([P(22, 24), P(55, 26)], radius=1 * SS, fill=line)
    d.rectangle([P(22, 31), P(42, 37)], fill=bar)
    for i, w in enumerate([55, 49, 55, 44, 52]):
        y = 42 + i * 4.8
        d.rounded_rectangle([P(22, y), P(w, y + 2)], radius=1 * SS, fill=line)
    return im.resize((S, S), Image.LANCZOS)

full = draw('#1f3a5f', '#f7f6f1', '#c9c6ba', '#1f3a5f', '#9aa3ae', '#111111')
blue = draw('#182f71', '#e8f2ff', '#a9c3f2', '#0f1f4d', '#8aa0cf', '#0f1f4d')
full.save('public/games/btn-filing.png')
blue.save('public/games/blue/btn-filing.png')
print('wrote btn-filing.png (full and blue)')
