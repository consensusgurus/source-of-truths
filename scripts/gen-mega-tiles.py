#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Colossus and Mammoth, the massive sudokus,
# in both the full-colour and the brand-blue palette (same drawing, remapped).
#
#   python3 scripts/gen-mega-tiles.py
#
# Writes public/games/btn-<key>.png and public/games/blue/btn-<key>.png. Drawn at
# 4x with PIL and box-filtered down. Colossus: two sudokus overlapping at a
# corner box, the shared box lit. Mammoth: a mammoth built out of small squares,
# the way the board is built out of small sudokus.
from PIL import Image, ImageDraw, ImageFont
import os

S, SS = 76, 4
W = S * SS

def font(px):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(f, px)
        except Exception:
            pass
    return ImageFont.load_default()

def colossus(ground, paper, ink, lit, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    c = 9 * SS                      # one box of three squares
    for (x0, y0) in ((9 * SS, 9 * SS), (27 * SS, 27 * SS)):
        d.rectangle([x0, y0, x0 + 3 * c, y0 + 3 * c], fill=paper)
    d.rectangle([27 * SS, 27 * SS, 36 * SS, 36 * SS], fill=lit)   # the shared corner
    for (x0, y0) in ((9 * SS, 9 * SS), (27 * SS, 27 * SS)):
        for k in range(4):
            d.line([x0 + k * c, y0, x0 + k * c, y0 + 3 * c], fill=ink, width=SS)
            d.line([x0, y0 + k * c, x0 + 3 * c, y0 + k * c], fill=ink, width=SS)
        d.rectangle([x0, y0, x0 + 3 * c, y0 + 3 * c], outline=ink, width=int(SS * 1.8))
    f = font(int(c * 0.74))
    for (bx, by, ch) in ((0, 0, '9'), (2, 1, '4'), (1, 2, '7'), (3, 3, '2'), (4, 4, '6'), (4, 2, '1'), (2, 4, '8')):
        d.text((9 * SS + bx * c + c // 2, 9 * SS + by * c + c // 2 + SS // 2), ch, fill=ink, font=f, anchor='mm')
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out); print('wrote', out, im.size)

MAMMOTH = [
    "....XXXXX...........",
    "..XXXXXXXXX.XXXX....",
    ".XXXXXXXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXXXXXX.",
    "XXEXXXXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXXXXXX",
    "XXXX.XXXXXXXXXXXXXXX",
    "XXX..XXXXXXXXXXXXXX.",
    "XX.T..XXXXXXXXXXXXX.",
    "XX.T..XXXX....XXXX..",
    "XX.TT.XXXX....XXXX..",
    ".X..TTTXXX....XXXX..",
    ".X....T.XXX...XXXX..",
    ".XX.....XXX...XXXX..",
]

def mammoth(ground, body, tusk, eye, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    p = 3 * SS
    x0 = (W - len(MAMMOTH[0]) * p) // 2
    y0 = (W - len(MAMMOTH) * p) // 2
    for r, row in enumerate(MAMMOTH):
        for c, ch in enumerate(row):
            if ch == '.':
                continue
            fill = {'X': body, 'T': tusk, 'E': eye}[ch]
            d.rectangle([x0 + c * p + 1, y0 + r * p + 1, x0 + (c + 1) * p - 2, y0 + (r + 1) * p - 2], fill=fill)
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out); print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour
colossus((154, 52, 18, 255), (255, 250, 240, 255), (40, 18, 8, 255), (253, 186, 116, 255), os.path.join(root, 'btn-colossus.png'))
mammoth((30, 79, 163, 255), (255, 250, 240, 255), (253, 224, 71, 255), (30, 79, 163, 255), os.path.join(root, 'btn-mammoth.png'))
# brand blue: a deep navy ground on two pale blue steps
colossus((22, 48, 110, 255), (232, 242, 255, 255), (16, 32, 78, 255), (120, 170, 245, 255), os.path.join(root, 'blue', 'btn-colossus.png'))
mammoth((22, 48, 110, 255), (232, 242, 255, 255), (120, 170, 245, 255), (22, 48, 110, 255), os.path.join(root, 'blue', 'btn-mammoth.png'))
