#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Scram, the themed word scramble, in both the
# full-colour and the brand-blue palette (same drawing, remapped palette).
#
#   python3 scripts/gen-scram-tile.py
#
# Writes public/games/btn-scram.png and public/games/blue/btn-scram.png. Drawn
# at 4x with PIL and box-filtered down: three letter tiles tumbled at angles
# above a row of three answer blanks, the scramble and the answer it becomes.
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

def tile(ch, size, angle, face, ink):
    t = Image.new('RGBA', (size * 2, size * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    o = size // 2
    d.rounded_rectangle([o, o, o + size, o + size], radius=int(size * 0.18), fill=face)
    d.text((o + size / 2, o + size / 2 + size * 0.02), ch, fill=ink, font=font(int(size * 0.62)), anchor='mm')
    return t.rotate(angle, resample=Image.BICUBIC)

def draw(ground, face, ink, blank, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    size = 19 * SS
    for ch, cx, cy, ang in (('R', 18, 26, 12), ('M', 38, 22, -9), ('A', 58, 27, 7)):
        t = tile(ch, size, ang, face, ink)
        im.alpha_composite(t, (int(cx * SS - t.width / 2), int(cy * SS - t.height / 2)))
    d = ImageDraw.Draw(im)
    for cx in (18, 38, 58):
        d.rounded_rectangle([(cx - 8) * SS, 53 * SS, (cx + 8) * SS, 56 * SS], radius=SS, fill=blank)
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
# full colour: Scram's rose, ivory tiles
draw((190, 18, 60, 255), (255, 247, 240, 255), (130, 10, 40, 255), (255, 214, 222, 235), os.path.join(root, 'btn-scram.png'))
# brand blue: a deep navy ground, tiles #dbe9ff, letters #10214f, blanks a mid blue
draw((24, 47, 113, 255), (219, 233, 255, 255), (16, 33, 79, 255), (77, 132, 243, 255), os.path.join(root, 'blue', 'btn-scram.png'))
