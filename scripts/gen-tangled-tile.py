#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Tangled, the daily rope untangling puzzle,
# in the full-colour palette and the brand-blue one (same drawing, remapped), as
# docs/claude/daily-authoring.md rule 12 asks.
#
#   python3 scripts/gen-tangled-tile.py
#
# Writes public/games/btn-tangled.png and public/games/blue/btn-tangled.png.
# Drawn at 4x and scaled down: a ring of holes, two cream ropes crossing, and
# four coloured pegs.
import math
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS
R = lambda v: v * SS

def bez(p0, p1, p2, n=40):
    out = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        out.append((R(x), R(y)))
    return out

def draw(ground, felt, rope, rope_edge, ink, pegs):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=R(16), fill=ground)
    cx = cy = 38; rad = 24
    d.ellipse([R(cx - rad - 5), R(cy - rad - 5), R(cx + rad + 5), R(cy + rad + 5)], outline=felt, width=int(R(6)))
    pts = [(cx + rad * math.cos(math.radians(-90 + k * 45)), cy + rad * math.sin(math.radians(-90 + k * 45))) for k in range(8)]
    # holes
    for k in (2, 6):
        x, y = pts[k]
        d.ellipse([R(x - 3.6), R(y - 3.6), R(x + 3.6), R(y + 3.6)], fill=ink)
    # two ropes, crossing
    for a, b, c in ((pts[7], (cx, cy + 4), pts[3]), (pts[1], (cx, cy - 4), pts[5])):
        line = bez(a, c and b, c)
        d.line(line, fill=rope_edge, width=int(R(5.2)), joint='curve')
        d.line(line, fill=rope, width=int(R(3.6)), joint='curve')
    for k, col in zip((7, 3, 1, 5), pegs):
        x, y = pts[k]
        d.ellipse([R(x - 4.4), R(y - 4.4), R(x + 4.4), R(y + 4.4)], fill=col, outline=ink, width=int(R(0.9)))
    return im.resize((S, S), Image.LANCZOS)

full = draw('#0f766e', '#99f6e4', '#f2ece0', '#8f826b', '#042f2e', ['#f6d58a', '#f4b5c4', '#a9d8f2', '#d6bdf0'])
blue = draw('#182f71', '#3b5bb5', '#dbe9ff', '#0f1f4d', '#0f1f4d', ['#8ab8ff', '#dbe9ff', '#8ab8ff', '#dbe9ff'])
full.save('public/games/btn-tangled.png')
blue.save('public/games/blue/btn-tangled.png')
print('wrote btn-tangled.png (full and blue)')
