#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Witness and Defuse, each in the full-colour
# and the brand-blue palette (same drawing, remapped).
#
#   python3 scripts/gen-witness-defuse-tiles.py
#
# Writes public/games/btn-witness.png, btn-defuse.png and their blue/ copies.
# Drawn at 4x and scaled down. Witness: an eye. Defuse: two terminal bars and
# three wires, the middle one cut.
from PIL import Image, ImageDraw

S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def witness(ground, white, iris, pupil):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    # the eye: two arcs meeting at the corners, drawn as the overlap of two circles
    eye = Image.new('L', (W, W), 0)
    a = Image.new('L', (W, W), 0); ImageDraw.Draw(a).ellipse([P(8, -2), P(68, 58)], fill=255)
    b = Image.new('L', (W, W), 0); ImageDraw.Draw(b).ellipse([P(8, 18), P(68, 78)], fill=255)
    from PIL import ImageChops
    eye = ImageChops.multiply(a, b)
    im.paste(Image.new('RGBA', (W, W), white), (0, 0), eye)
    d = ImageDraw.Draw(im)
    d.ellipse([P(26, 26), P(50, 50)], fill=iris)
    d.ellipse([P(32, 32), P(44, 44)], fill=pupil)
    d.ellipse([P(40, 30), P(45, 35)], fill=white)
    return im.resize((S, S), Image.LANCZOS)

def defuse(ground, bar, w1, w2, w3, badge):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(12, 12), P(64, 19)], radius=2 * SS, fill=bar)
    d.rounded_rectangle([P(12, 57), P(64, 64)], radius=2 * SS, fill=bar)
    d.rectangle([P(19, 19), P(26, 57)], fill=w1)
    d.rectangle([P(50, 19), P(57, 57)], fill=w3)
    d.rectangle([P(34.5, 19), P(41.5, 30)], fill=w2)
    d.rectangle([P(34.5, 46), P(41.5, 57)], fill=w2)
    d.ellipse([P(32, 32), P(44, 44)], fill=badge)
    return im.resize((S, S), Image.LANCZOS)

witness('#9f1239', '#fff1f2', '#fb7185', '#1f2937').save('public/games/btn-witness.png')
witness('#16306e', '#e8f2ff', '#4a8cf0', '#0f1f4d').save('public/games/blue/btn-witness.png')
defuse('#7c2d12', '#fff7ed', '#fde047', '#7dd3fc', '#f87171', '#fff7ed').save('public/games/btn-defuse.png')
defuse('#214bb2', '#dbe9ff', '#e8f2ff', '#8db8f8', '#0f1f4d', '#dbe9ff').save('public/games/blue/btn-defuse.png')
print('wrote btn-witness.png and btn-defuse.png (full and blue)')
