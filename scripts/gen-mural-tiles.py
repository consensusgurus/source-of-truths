#!/usr/bin/env python3
# Draw the 76x76 daily tile art for Mural and MuralToo in the full-colour and the
# brand-blue palette (same drawing, remapped).   python3 scripts/gen-mural-tiles.py
# A wide picture in a fine grid of pieces: sky over hills, most of it placed and
# a few pieces still open, with one loose piece coming in. Mural has a sun (it
# opens at noon); MuralToo has a moon on a night sky (it opens at midnight).
from PIL import Image, ImageDraw
import os
S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

def mural(ground, field, sky, hill, hill2, orb, gap, grid, piece, piece_lo, night):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(9, 9), P(67, 67)], radius=7 * SS, fill=field)
    x0, y0, x1, y1 = 13, 19, 63, 51
    cw = (x1 - x0) / 10.0
    chh = (y1 - y0) / 6.0
    # the picture: sky, then two hills, drawn on its own layer and cropped
    pic = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pic)
    pd.rectangle([P(x0, y0), P(x1, y1)], fill=sky)
    pd.ellipse([P(40, 23), P(50, 33)], fill=orb)
    if night:
        pd.ellipse([P(43, 21.5), P(52, 30.5)], fill=sky)
    pd.pieslice([P(x0 - 14, 36), P(x0 + 34, 70)], 180, 360, fill=hill)
    pd.pieslice([P(30, 40), P(x1 + 16, 76)], 180, 360, fill=hill2)
    box = (*P(x0, y0), *P(x1, y1))
    im.paste(pic.crop(box), box[:2])
    # pieces nobody has placed yet
    for (c, r) in ((7, 1), (8, 1), (2, 3), (3, 3), (3, 4), (6, 4), (8, 5)):
        d.rectangle([P(x0 + c * cw, y0 + r * chh), P(x0 + (c + 1) * cw, y0 + (r + 1) * chh)], fill=gap)
    # the cut
    for c in range(1, 10):
        d.line([P(x0 + c * cw, y0), P(x0 + c * cw, y1)], fill=grid, width=1 * SS // 2)
    for r in range(1, 6):
        d.line([P(x0, y0 + r * chh), P(x1, y0 + r * chh)], fill=grid, width=1 * SS // 2)
    d.rectangle([P(x0, y0), P(x1, y1)], outline=grid, width=SS)
    # one loose piece on its way in
    d.rounded_rectangle([P(44, 54), P(54, 63)], radius=1.5 * SS, fill=piece, outline=piece_lo, width=SS)
    d.ellipse([P(52.5, 56.5), P(57, 61)], fill=piece, outline=piece_lo, width=SS)
    d.rectangle([P(51.5, 57.6), P(54, 59.9)], fill=piece)
    return im.resize((S, S), Image.LANCZOS)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'games')
day_full = mural('#0369a1', '#f1f8fd', '#8fd0f5', '#5fae5a', '#3f8f52', '#f7c948', '#ffffff', '#1c3d52', '#f7c948', '#8a6a10', False)
day_blue = mural('#c2ddfe', '#e8f2ff', '#a9c4f5', '#5a83d8', '#245edf', '#e8f2ff', '#ffffff', '#214bb2', '#8fb6f5', '#214bb2', False)
night_full = mural('#4338ca', '#f2f1fd', '#27245e', '#3c6e63', '#2a5750', '#f6e3a1', '#ffffff', '#15133a', '#f6e3a1', '#8a6a10', True)
night_blue = mural('#c2ddfe', '#e8f2ff', '#214bb2', '#5a83d8', '#8fb6f5', '#e8f2ff', '#ffffff', '#0f1f4d', '#8fb6f5', '#214bb2', True)
day_full.save(os.path.join(root, 'btn-mural.png'))
day_blue.save(os.path.join(root, 'blue', 'btn-mural.png'))
night_full.save(os.path.join(root, 'btn-muraltoo.png'))
night_blue.save(os.path.join(root, 'blue', 'btn-muraltoo.png'))
print('wrote btn-mural.png, btn-muraltoo.png and their blue twins')
