#!/usr/bin/env python3
# Draw the 76x76 daily tile art for the six dailies of 2026-11-01 (Swap, Slide,
# Spin, Fill, Connect, Pairs), in the full-colour palette and the brand-blue one
# (same drawing, remapped palette), as docs/claude/daily-authoring.md rule 12 asks.
#
#   python3 scripts/gen-six-tiles.py
#
# Writes public/games/btn-<key>.png and public/games/blue/btn-<key>.png. Drawn at
# 4x with PIL and box-filtered down.
from PIL import Image, ImageDraw
import math, os

S, SS = 76, 4
W = S * SS
R = lambda v: int(v * SS)

PAL = {
  # key: (ground, light, accent, ink) full colour ; blue ramp
  'swap':  (('#9a3412', '#ffedd5', '#fdba74', '#431407'), ('#16306e', '#dbe9ff', '#4a8cf0', '#0f1f4d')),
  'slide': (('#1e40af', '#dbeafe', '#93c5fd', '#172554'), ('#214bb2', '#e8f2ff', '#8ab8ff', '#10214f')),
  'spin':  (('#6d28d9', '#ede9fe', '#c4b5fd', '#2e1065'), ('#182f71', '#dbe9ff', '#4a8cf0', '#0f1f4d')),
  'fill':  (('#047857', '#ecfdf5', '#6ee7b7', '#022c22'), ('#245edf', '#e8f2ff', '#c2ddfe', '#10214f')),
  'connect':  (('#be123c', '#fff1f2', '#fda4af', '#4c0519'), ('#c2ddfe', '#ffffff', '#245edf', '#0f1f4d')),
  'pairs': (('#b91c1c', '#ffffff', '#fca5a5', '#1f2937'), ('#16306e', '#e8f2ff', '#4a8cf0', '#0f1f4d')),
}

def base(ground):
  im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
  d = ImageDraw.Draw(im)
  d.rounded_rectangle([0, 0, W - 1, W - 1], radius=R(16), fill=ground)
  return im, d

def sq(d, x, y, s, fill, r=2.5):
  d.rounded_rectangle([R(x), R(y), R(x + s), R(y + s)], radius=R(r), fill=fill)

def draw(key, pal):
  ground, light, acc, ink = pal
  im, d = base(ground)
  if key == 'swap':
    for i in range(3):
      for j in range(3):
        sq(d, 14 + j * 17, 14 + i * 17, 14, light)
    sq(d, 14, 14, 14, acc); sq(d, 48, 48, 14, acc)
    d.line([R(30), R(21), R(44), R(21), R(55), R(32), R(55), R(44)], fill=ink, width=R(2.6), joint='curve')
    d.polygon([R(51), R(42), R(59), R(42), R(55), R(47)], fill=ink)
  elif key == 'slide':
    for i in range(3):
      for j in range(3):
        if (i, j) == (2, 2): continue
        sq(d, 14 + j * 17, 14 + i * 17, 14, acc if (i, j) == (2, 1) else light)
    d.line([R(32), R(55), R(43), R(55)], fill=ink, width=R(2.6))
    d.polygon([R(43), R(51), R(48), R(55), R(43), R(59)], fill=ink)
  elif key == 'spin':
    for i in range(2):
      for j in range(2):
        if (i, j) == (0, 1): continue
        sq(d, 14 + j * 25, 14 + i * 25, 22, light, 3)
    cx, cy, h = 50, 25, 11
    pts = []
    for a in range(4):
      t = math.radians(25 + 90 * a)
      pts.append((R(cx + h * 1.41 * math.cos(t + math.pi / 4)), R(cy + h * 1.41 * math.sin(t + math.pi / 4))))
    d.polygon(pts, fill=acc)
    d.arc([R(36), R(9), R(64), R(41)], start=200, end=320, fill=ink, width=R(2.6))
  elif key == 'fill':
    for j in range(5):
      sq(d, 10 + j * 11.5, 33, 10, light, 2)
    for i in range(5):
      if i == 2: continue
      sq(d, 33, 10 + i * 11.5, 10, acc if i < 2 else light, 2)
    sq(d, 33, 33, 10, acc, 2)
  elif key == 'connect':
    col = [acc, light]
    d.line([R(18), R(18), R(18), R(40), R(40), R(40), R(40), R(58)], fill=acc, width=R(6), joint='curve')
    d.line([R(58), R(18), R(40), R(18), R(40), R(28), R(58), R(28), R(58), R(58)], fill=light, width=R(6), joint='curve')
    for (x, y, c) in [(18, 18, acc), (40, 58, acc), (58, 18, light), (58, 58, light)]:
      d.ellipse([R(x - 6), R(y - 6), R(x + 6), R(y + 6)], fill=c, outline=ink, width=R(1.6))
  elif key == 'pairs':
    for (x, y, rot) in [(15, 17, -8), (37, 15, 8)]:
      card = Image.new('RGBA', (R(24), R(34)), (0, 0, 0, 0))
      cd = ImageDraw.Draw(card)
      cd.rounded_rectangle([0, 0, R(24) - 1, R(34) - 1], radius=R(3), fill=light, outline=ink, width=R(1.4))
      # a heart
      hx, hy, hs = R(12), R(18), R(6)
      cd.ellipse([hx - hs, hy - hs, hx, hy], fill=acc if key == 'pairs' else ink)
      cd.ellipse([hx, hy - hs, hx + hs, hy], fill=acc)
      cd.polygon([(hx - hs, hy - hs // 2), (hx + hs, hy - hs // 2), (hx, hy + hs)], fill=acc)
      card = card.rotate(rot, resample=Image.BICUBIC, expand=True)
      im.alpha_composite(card, (R(x), R(y)))
  return im.resize((S, S), Image.BOX)

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'games')
for key, (full, blue) in PAL.items():
  draw(key, full).save(os.path.join(root, f'btn-{key}.png'))
  draw(key, blue).save(os.path.join(root, 'blue', f'btn-{key}.png'))
  print('wrote', key)
