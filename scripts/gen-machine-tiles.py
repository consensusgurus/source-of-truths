#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Machine in the full-colour and the brand-blue
# palette (same drawing, remapped).   python3 scripts/gen-machine-tiles.py
# A shelf with a ball rolling off it, a wooden ramp below turning the fall, a
# spring, and a basketball dropping toward a hoop. Drawn at 4x and scaled down.
from PIL import Image, ImageDraw
import os
S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def machine(ground, field, wood, wood_lo, ball1, ball2, seam, steel, spring_top, rim, ink):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(9, 9), P(67, 67)], radius=7 * SS, fill=field)
    # the top shelf and the ball leaving it
    d.rounded_rectangle([P(12, 22), P(36, 26)], radius=1.2 * SS, fill=wood, outline=wood_lo, width=SS)
    d.ellipse([P(26, 12), P(36, 22)], fill=ball1, outline=ink, width=SS)
    # the ramp
    d.polygon([P(30, 36), P(30, 50), P(54, 50)], fill=wood, outline=wood_lo)
    d.line([P(30.5, 36.5), P(53.5, 49.5)], fill=wood_lo, width=int(1.4 * SS))
    # the spring, bottom left
    d.rectangle([P(13, 59), P(25, 61)], fill=steel)
    for i in range(4):
        y0 = 58 - i * 2.2
        d.line([P(15 if i % 2 == 0 else 23, y0), P(23 if i % 2 == 0 else 15, y0 - 2.2)], fill=steel, width=int(1.2 * SS))
    d.rounded_rectangle([P(12, 46.5), P(26, 49)], radius=1 * SS, fill=spring_top)
    # the basketball heading for the hoop
    d.ellipse([P(52, 38), P(62, 48)], fill=ball2, outline=ink, width=SS)
    d.line([P(52, 43), P(62, 43)], fill=seam, width=int(0.8 * SS))
    d.line([P(57, 38), P(57, 48)], fill=seam, width=int(0.8 * SS))
    # the floor and the hoop
    d.line([P(12, 62), P(64, 62)], fill=ink, width=int(1.2 * SS))
    d.rounded_rectangle([P(48, 56.5), P(64, 58.5)], radius=1 * SS, fill=rim)
    for x in (50, 54, 58, 62):
        d.line([P(x, 58.5), P(x - 1 if x > 56 else x + 1, 64)], fill=steel, width=int(0.7 * SS))
    return im.resize((S, S), Image.LANCZOS)

full = machine('#b45309', '#fff7e6', '#dcc29a', '#9a6a33', '#5b3f8f', '#e8833a', '#6b3416', '#6f7884', '#e05a5a', '#e8743b', '#3a2a14')
blue = machine('#c2ddfe', '#e8f2ff', '#8fb6f5', '#245edf', '#10214f', '#4a8cf0', '#e8f2ff', '#214bb2', '#245edf', '#245edf', '#0f1f4d')
root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
full.save(os.path.join(root, 'btn-machine.png'))
blue.save(os.path.join(root, 'blue', 'btn-machine.png'))
print('wrote btn-machine.png and blue/btn-machine.png')
