#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Tape, the name-the-company-from-its-chart
# daily, in both the full-colour and the brand-blue palette (same drawing,
# remapped).
#
#   python3 scripts/gen-tape-tile.py
#
# Writes public/games/btn-tape.png and public/games/blue/btn-tape.png. Drawn at
# 4x and scaled down: a chart panel with a shaded price line that climbs,
# crashes and climbs again, and one numbered pin on the low.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS

def P(x, y):
    return (int(x * SS), int(y * SS))

LINE = [(13, 44), (19, 38), (24, 40), (29, 30), (33, 27), (37, 33), (41, 50), (45, 47), (49, 40), (54, 37), (58, 28), (63, 20)]

def draw(ground, panel, area, line, pin, pinink):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(9, 14), P(67, 60)], radius=5 * SS, fill=panel)
    d.polygon([P(x, y) for x, y in LINE] + [P(63, 56), P(13, 56)], fill=area)
    d.line([P(x, y) for x, y in LINE], fill=line, width=int(2.4 * SS), joint='curve')
    d.line([P(13, 56), P(63, 56)], fill=line, width=int(1 * SS))
    d.ellipse([P(41 - 5, 50 - 15 - 5), P(41 + 5, 50 - 15 + 5)], fill=pin)
    d.line([P(41, 40), P(41, 49)], fill=pin, width=int(1 * SS))
    d.ellipse([P(39.6, 48.6), P(42.4, 51.4)], fill=line)
    d.ellipse([P(39.8, 33.3), P(42.2, 35.7)], fill=pinink)
    return im.resize((S, S), Image.LANCZOS)

full = draw('#123a5c', '#f4f8fb', '#7dd3fc', '#0b2238', '#f59e0b', '#fff7e6')
blue = draw('#182f71', '#e8f2ff', '#4a8cf0', '#0f1f4d', '#245edf', '#dbe9ff')
full.save('public/games/btn-tape.png')
blue.save('public/games/blue/btn-tape.png')
print('wrote btn-tape.png (full and blue)')
