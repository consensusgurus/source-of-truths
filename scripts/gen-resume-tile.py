#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Resume, the name-the-person-from-their-
# career-profile daily, in both the full-colour and the brand-blue palette
# (same drawing, remapped).
#
#   python3 scripts/gen-resume-tile.py
#
# Writes public/games/btn-resume.png and public/games/blue/btn-resume.png.
# Drawn at 4x and scaled down: a profile card with a banner, a hidden face in a
# round frame, a name bar and three job lines with square logo tiles.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS

def P(x, y):
    return (int(x * SS), int(y * SS))

def draw(ground, card, banner, face, bar, tile, line):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(12, 10), P(64, 66)], radius=5 * SS, fill=card)
    d.rounded_rectangle([P(12, 10), P(64, 22)], radius=5 * SS, fill=banner)
    d.rectangle([P(12, 17), P(64, 22)], fill=banner)
    d.ellipse([P(17, 15), P(31, 29)], fill=card)
    d.ellipse([P(18.5, 16.5), P(29.5, 27.5)], fill=face)
    d.ellipse([P(21.6, 18.4), P(26.4, 23.2)], fill=card)
    d.pieslice([P(19.8, 23.4), P(28.2, 31.8)], 180, 360, fill=card)
    d.rounded_rectangle([P(34, 24), P(58, 28)], radius=2 * SS, fill=bar)
    for i in range(3):
        y = 36 + i * 9.5
        d.rounded_rectangle([P(18, y), P(24, y + 6)], radius=1.5 * SS, fill=tile)
        d.rounded_rectangle([P(28, y + 1.5), P(58 - i * 7, y + 4.5)], radius=1.5 * SS, fill=line)
    return im.resize((S, S), Image.LANCZOS)

full = draw('#0d3f73', '#f6f9fc', '#93c5fd', '#9fb4c9', '#0b2238', '#cfe0f2', '#9aa9b8')
blue = draw('#182f71', '#e8f2ff', '#4a8cf0', '#7f9ee0', '#0f1f4d', '#bcd3fb', '#8aa0cf')
full.save('public/games/btn-resume.png')
blue.save('public/games/blue/btn-resume.png')
print('wrote btn-resume.png (full and blue)')
