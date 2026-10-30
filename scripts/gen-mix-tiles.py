#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Mixtape and Mishmash (the two quiz-mix
# siblings of Potluck, 2026-10-30) in the full-colour and brand-blue palettes
# (same drawing, remapped palette).
#
#   python3 scripts/gen-mix-tiles.py
#
# Mixtape: a cassette, two reels and a label. Mishmash: three cards tumbled
# together, one lettered (type it), one with a joined pair (match it), one with
# a map pin (spot it). Drawn at 4x with PIL and box-filtered down.
from PIL import Image, ImageDraw, ImageFont
import os

S, SS = 76, 4
W = S * SS
root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')

def font(px):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(f, px)
        except Exception:
            pass
    return ImageFont.load_default()

def save(im, out):
    im = im.resize((S, S), Image.BOX)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('wrote', out, im.size)

def x(v):
    return int(v * SS)

def mixtape(ground, body, ink, label, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    d.rounded_rectangle([x(12), x(19), x(64), x(57)], radius=x(5), fill=body)
    d.rounded_rectangle([x(17), x(23), x(59), x(30)], radius=x(2), fill=label)
    d.rounded_rectangle([x(22), x(33), x(54), x(45)], radius=x(6), fill=ink)
    for cx in (28, 48):
        d.ellipse([x(cx - 5), x(34), x(cx + 5), x(44)], fill=body)
        d.ellipse([x(cx - 2), x(37), x(cx + 2), x(41)], fill=ink)
    d.polygon([(x(24), x(57)), (x(28), x(50)), (x(48), x(50)), (x(52), x(57))], fill=ink)
    save(im, out)

def card(w, h, angle, face, draw_fn):
    t = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    ox, oy = w // 2, h // 2
    d.rounded_rectangle([ox, oy, ox + w, oy + h], radius=int(w * 0.16), fill=face)
    draw_fn(d, ox, oy, w, h)
    return t.rotate(angle, resample=Image.BICUBIC)

def mishmash(ground, face, ink, accent, out):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=15 * SS, fill=ground)
    cw, ch = x(22), x(28)
    def letter(dd, ox, oy, w, h):
        dd.text((ox + w / 2, oy + h / 2), 'A', fill=ink, font=font(int(w * 0.7)), anchor='mm')
    def pair(dd, ox, oy, w, h):
        r = w * 0.13
        a = (ox + w * 0.3, oy + h * 0.3); b = (ox + w * 0.7, oy + h * 0.7)
        dd.line([a, b], fill=accent, width=int(w * 0.09))
        for (px, py) in (a, b):
            dd.ellipse([px - r, py - r, px + r, py + r], fill=ink)
    def pin(dd, ox, oy, w, h):
        cx, cy, r = ox + w / 2, oy + h * 0.4, w * 0.24
        dd.polygon([(cx - r * 0.85, cy + r * 0.5), (cx + r * 0.85, cy + r * 0.5), (cx, oy + h * 0.82)], fill=accent)
        dd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=accent)
        dd.ellipse([cx - r * 0.4, cy - r * 0.4, cx + r * 0.4, cy + r * 0.4], fill=face)
    for fn, cx, cy, ang in ((letter, 20, 40, 14), (pin, 56, 40, -13), (pair, 38, 36, 3)):
        t = card(cw, ch, ang, face, fn)
        im.alpha_composite(t, (int(x(cx) - t.width / 2), int(x(cy) - t.height / 2)))
    save(im, out)

# Mixtape: plum ground, cream shell, deep plum reels, pink label.
mixtape((157, 47, 107, 255), (255, 244, 248, 255), (90, 18, 56, 255), (244, 170, 205, 255), os.path.join(root, 'btn-mixtape.png'))
# Brand blue: mid-blue ground, shell #dbe9ff, reels #10214f, label a pale blue.
mixtape((33, 75, 178, 255), (219, 233, 255, 255), (16, 33, 79, 255), (125, 170, 250, 255), os.path.join(root, 'blue', 'btn-mixtape.png'))
# Mishmash: green ground, ivory cards, deep green ink, a bright green accent.
mishmash((47, 122, 92, 255), (250, 255, 251, 255), (20, 64, 46, 255), (62, 170, 120, 255), os.path.join(root, 'btn-mishmash.png'))
# Brand blue: pale ground, white cards, #10214f ink, a mid-blue accent.
mishmash((194, 221, 254, 255), (255, 255, 255, 255), (16, 33, 79, 255), (36, 94, 223, 255), os.path.join(root, 'blue', 'btn-mishmash.png'))
