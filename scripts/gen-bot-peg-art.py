#!/usr/bin/env python3
# The art for Bot and Peg (launched 2026-11-18): the 76x76 daily tiles in the
# full-colour and the brand-blue palette (same drawing, remapped), and the two
# hand-built 1200x630 share cards (public/og/bot.png, public/og/peg.png),
# laid out like Crate's. The cards are HTML screenshotted by Playwright with
# Manrope read from node_modules, so no network is needed.
#   python3 scripts/gen-bot-peg-art.py
import os, json, base64, math, asyncio
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
S, SS = 76, 4
W = S * SS
P = lambda x, y: (int(x * SS), int(y * SS))

# ---------- tiles ----------
def bot_tile(ground, field, top, side1, side2, lamp, lamp_lo, lit, lit_lo, body, body_lo, eye, arrow):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(9, 9), P(67, 67)], radius=7 * SS, fill=field)
    def block(cx, cy, h, face):
        tw, th, lh = 11, 5.5, 5
        t = [(cx, cy - th - h * lh), (cx + tw, cy - h * lh), (cx, cy + th - h * lh), (cx - tw, cy - h * lh)]
        d.polygon([P(*t[3]), P(*t[2]), P(t[2][0], t[2][1] + h * lh + 4), P(t[3][0], t[3][1] + h * lh + 4)], fill=side1)
        d.polygon([P(*t[2]), P(*t[1]), P(t[1][0], t[1][1] + h * lh + 4), P(t[2][0], t[2][1] + h * lh + 4)], fill=side2)
        d.polygon([P(*p) for p in t], fill=face)
        return t
    block(24, 50, 0, top); block(35, 55.5, 0, top); block(46, 50, 1, top); block(35, 44.5, 1, top); block(57, 44.5, 2, top)
    t = block(46, 50, 1, top)
    # a lit lamp on the right block, a dark one on the left
    l1 = block(57, 44.5, 2, top)
    d.polygon([P(l1[0][0], l1[0][1] + 2.5), P(l1[1][0] - 4, l1[1][1]), P(l1[2][0], l1[2][1] - 2.5), P(l1[3][0] + 4, l1[3][1])], fill=lit, outline=lit_lo)
    l2 = block(24, 50, 0, top)
    d.polygon([P(l2[0][0], l2[0][1] + 2.5), P(l2[1][0] - 4, l2[1][1]), P(l2[2][0], l2[2][1] - 2.5), P(l2[3][0] + 4, l2[3][1])], fill=lamp, outline=lamp_lo)
    # the robot on the middle block
    cx, cy = 46, 45
    d.rounded_rectangle([P(cx - 7, cy - 16), P(cx + 7, cy - 1)], radius=4 * SS, fill=body, outline=body_lo, width=int(1.3 * SS))
    d.rounded_rectangle([P(cx - 4.5, cy - 20), P(cx + 4.5, cy - 15.5)], radius=2 * SS, fill=body, outline=body_lo, width=int(1.1 * SS))
    d.line([P(cx, cy - 20), P(cx, cy - 24)], fill=body_lo, width=int(1.2 * SS))
    d.ellipse([P(cx - 1.6, cy - 26), P(cx + 1.6, cy - 22.8)], fill=lit_lo)
    d.ellipse([P(cx - 4.6, cy - 11), P(cx - 1.6, cy - 8)], fill=eye)
    d.ellipse([P(cx + 1.6, cy - 11), P(cx + 4.6, cy - 8)], fill=eye)
    return im.resize((S, S), Image.LANCZOS)

def peg_tile(ground, field, board, hole, peg, peg_lo, shine):
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=16 * SS, fill=ground)
    d.rounded_rectangle([P(9, 9), P(67, 67)], radius=7 * SS, fill=field)
    a, b, e0, e1 = 27, 49, 12, 64
    d.rounded_rectangle([P(a, e0), P(b, e1)], radius=4 * SS, fill=board)
    d.rounded_rectangle([P(e0, a), P(e1, b)], radius=4 * SS, fill=board)
    pegs = {(2, 1), (3, 2), (3, 3), (2, 3), (4, 3), (3, 4), (3, 5), (1, 3)}
    for r in range(7):
        for c in range(7):
            if (r < 2 or r > 4) and (c < 2 or c > 4): continue
            x, y = 13.5 + c * 8.2 + 0.5, 13.5 + r * 8.2 + 0.5
            if (r, c) in pegs:
                d.ellipse([P(x - 3.4, y - 3.4), P(x + 3.4, y + 3.4)], fill=peg, outline=peg_lo, width=int(0.9 * SS))
                d.ellipse([P(x - 2, y - 2), P(x - 0.6, y - 0.6)], fill=shine)
            else:
                d.ellipse([P(x - 1.7, y - 1.7), P(x + 1.7, y + 1.7)], fill=hole)
    return im.resize((S, S), Image.LANCZOS)

g = os.path.join(ROOT, 'public', 'games')
bot_tile('#be123c', '#fff1f2', '#f5f3ef', '#dcd8cf', '#c9c4b9', '#cfe0f1', '#7fa7cf', '#f6e3a1', '#d8a92a', '#ffffff', '#8b95a3', '#3d7fc4', '#15171c').save(os.path.join(g, 'btn-bot.png'))
bot_tile('#16306e', '#dbe9ff', '#e8f2ff', '#a9c4f5', '#8fb6f5', '#c2ddfe', '#4a8cf0', '#e8f2ff', '#4a8cf0', '#ffffff', '#5a83d8', '#0f1f4d', '#0f1f4d').save(os.path.join(g, 'blue', 'btn-bot.png'))
peg_tile('#1d6b4f', '#e6f2ec', '#ffffff', '#cfc9bd', '#e9b8a4', '#a8654d', (255, 255, 255, 170)).save(os.path.join(g, 'btn-peg.png'))
peg_tile('#214bb2', '#c2ddfe', '#e8f2ff', '#8fb6f5', '#4a8cf0', '#0f1f4d', (255, 255, 255, 170)).save(os.path.join(g, 'blue', 'btn-peg.png'))
print('wrote btn-bot.png, btn-peg.png and their blue copies')

# ---------- share cards ----------
TW, TH, LH = 46, 23, 20
def iso(x, y, h): return ((x - y) * TW, (x + y) * TH - h * LH)
def pts(a): return ' '.join(f'{p[0]:.1f},{p[1]:.1f}' for p in a)

def bot_svg():
    rows = ['3222', '3..1', '3..1', '0001']; lamps = [(3, 3), (3, 0), (0, 0), (0, 3)]; lit = {(3, 3), (3, 0)}
    tiles = [(x, y, int(rows[y][x])) for y in range(4) for x in range(4) if rows[y][x] != '.']
    tiles.sort(key=lambda t: (t[0] + t[1], t[0]))
    out = []; xs = []; ys = []
    for (x, y, h) in tiles:
        top = h + 0.5
        c = lambda dx, dy, hh: iso(x + dx, y + dy, hh)
        B0, R0, F0, L0 = c(-.5, -.5, top), c(.5, -.5, top), c(.5, .5, top), c(-.5, .5, top)
        F1, L1, R1 = c(.5, .5, 0), c(-.5, .5, 0), c(.5, -.5, 0)
        for p in (B0, R0, F0, L0, F1, L1, R1): xs.append(p[0]); ys.append(p[1])
        out.append(f'<polygon points="{pts([L0, F0, F1, L1])}" fill="#dcd8cf" stroke="#9b958a"/>')
        out.append(f'<polygon points="{pts([F0, R0, R1, F1])}" fill="#c9c4b9" stroke="#9b958a"/>')
        for lv in range(1, h + 1): out.append(f'<polyline points="{pts([c(-.5, .5, lv), c(.5, .5, lv), c(.5, -.5, lv)])}" fill="none" stroke="#9b958a" stroke-width=".8" opacity=".45"/>')
        out.append(f'<polygon points="{pts([B0, R0, F0, L0])}" fill="#efede8" stroke="#9b958a"/>')
        if (x, y) in lamps:
            on = (x, y) in lit; s = .3; q = c(0, 0, top)
            if on: out.append(f'<ellipse cx="{q[0]}" cy="{q[1]}" rx="{TW*.95}" ry="{TH*.95}" fill="rgba(246,214,110,.55)"/>')
            out.append(f'<polygon points="{pts([c(-s, -s, top), c(s, -s, top), c(s, s, top), c(-s, s, top)])}" fill="{"#f6e3a1" if on else "#cfe0f1"}" stroke="{"#e3c25a" if on else "#9fbfdf"}" stroke-width="2.5"/>')
            out.append(f'<g transform="translate({q[0]},{q[1]-16})">' + ('<circle r="13" fill="rgba(246,214,110,.55)"/>' if on else '') + f'<path d="M0 -9a7 7 0 0 0-4.2 12.6c.9.7 1.4 1.6 1.4 2.7h5.6c0-1.1.5-2 1.4-2.7A7 7 0 0 0 0 -9z" fill="{"#f6e3a1" if on else "#ffffff"}" stroke="{"#e3c25a" if on else "#9fbfdf"}" stroke-width="2"/></g>')
        if (x, y) == (3, 1):  # the robot, mid-climb, facing north
            sx, sy = iso(3, 1, 1.5)
            out.append(f'<g transform="translate({sx},{sy})"><ellipse rx="17" ry="8" fill="rgba(0,0,0,.16)"/><rect x="-15" y="-38" width="30" height="34" rx="9" fill="#f4f4f2" stroke="#9aa3ae" stroke-width="2.5"/><rect x="-10" y="-46" width="20" height="10" rx="4" fill="#f4f4f2" stroke="#9aa3ae" stroke-width="2.5"/><line x1="0" y1="-46" x2="0" y2="-53" stroke="#9aa3ae" stroke-width="2.5"/><circle cy="-55" r="3.2" fill="#e3c25a"/><rect x="-7" y="-30" width="14" height="12" rx="3" fill="none" stroke="#9aa3ae" stroke-width="2"/></g>')
            D, Pp = (0, -1), (1, 0)
            def pr(a, b):
                u, v = D[0] * a + Pp[0] * b, D[1] * a + Pp[1] * b
                return (sx + (u - v) * TW, sy + (u + v) * TH)
            arrow = pts([pr(.34, -.09), pr(.62, -.09), pr(.62, -.24), pr(.95, 0), pr(.62, .24), pr(.62, .09), pr(.34, .09)])
    out.append(f'<polygon points="{arrow}" fill="#15171c" stroke="#fbfaf7" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/>')
    x0, x1, y0, y1 = min(xs) - 20, max(xs) + 20, min(ys) - 80, max(ys) + 14
    return f'<svg viewBox="{x0} {y0} {x1-x0} {y1-y0}" width="100%" height="100%">' + ''.join(out) + '</svg>'

def peg_svg():
    rows = ['--.o.--', '--ooo--', '.ooooo.', '...o...', '...o...', '--ooo--', '--ooo--']
    a, b, e0, e1, r = 40 + 160 - 38, 40 + 320 + 38, 2, 558, 16
    V = [(a, e0), (b, e0), (b, a), (e1, a), (e1, b), (b, b), (b, e1), (a, e1), (a, b), (e0, b), (e0, a), (a, a)]
    dd = ''
    for i, p in enumerate(V):
        def to(q):
            dx, dy = q[0] - p[0], q[1] - p[1]; L = math.hypot(dx, dy); return (p[0] + dx / L * r, p[1] + dy / L * r)
        s1, s2 = to(V[i - 1]), to(V[(i + 1) % len(V)])
        dd += ('L' if i else 'M') + f'{s1[0]} {s1[1]}Q{p[0]} {p[1]} {s2[0]} {s2[1]}'
    out = [f'<path d="{dd}Z" fill="#ffffff" stroke="#15171c"/>']
    for rr in range(7):
        for cc in range(7):
            ch = rows[rr][cc]
            if ch == '-': continue
            cx, cy = 40 + cc * 80, 40 + rr * 80
            out.append(f'<circle cx="{cx}" cy="{cy}" r="15" fill="#e6e2da" stroke="#cfc9bd" stroke-width="2"/>')
            if ch == 'o':
                out.append(f'<ellipse cx="{cx}" cy="{cy+16}" rx="20" ry="6" fill="rgba(0,0,0,.12)"/><circle cx="{cx}" cy="{cy}" r="24" fill="#e9b8a4" stroke="#c98a73" stroke-width="3"/><circle cx="{cx-8}" cy="{cy-8}" r="6" fill="rgba(255,255,255,.55)"/>')
    return '<svg viewBox="-14 -14 588 588" width="100%" height="100%">' + ''.join(out) + '</svg>'

font = lambda w: base64.b64encode(open(os.path.join(ROOT, 'node_modules/@fontsource/manrope/files', f'manrope-latin-{w}-normal.woff2'), 'rb').read()).decode()
FONTS = ''.join(f"@font-face{{font-family:Manrope;font-weight:{w};src:url(data:font/woff2;base64,{font(w)}) format('woff2')}}" for w in (600, 700, 800))
HOUSE = 'M60 10L113 43V109H93V63L60 86L27 63V109H7V43Z'

def card(key, name, pill, line1, line2, accent, shadow, board, chips, board_pad):
    chip_html = ''.join(f'<div class="chip"><b>{a}</b><span>{b}</span></div>' for a, b in chips)
    return f'''<!DOCTYPE html><html><head><meta charset="utf-8"><style>{FONTS}
*{{box-sizing:border-box;margin:0}}body{{width:1200px;height:630px;font-family:Manrope;background:#10214a;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:40px 40px;color:#fff;position:relative;overflow:hidden}}
.brand{{position:absolute;left:64px;top:60px;display:flex;align-items:center;gap:12px;font:800 22px/1 Manrope}}
.pill{{position:absolute;left:64px;top:120px;background:{accent};color:#10214a;font:800 15px/1 Manrope;letter-spacing:.12em;text-transform:uppercase;padding:12px 18px;border-radius:999px}}
h1{{position:absolute;left:62px;top:178px;font:800 124px/1.1 Manrope;letter-spacing:-.04em;text-shadow:5px 7px 0 {shadow}}}
.tag{{position:absolute;left:64px;top:328px;font:800 31px/1.35 Manrope}}.tag em{{font-style:normal;color:{accent};display:block}}
.play{{position:absolute;left:64px;top:510px;background:#fff;color:#10214a;font:800 22px/1 Manrope;padding:20px 28px;border-radius:999px}}
.url{{position:absolute;left:238px;top:529px;font:700 22px/1 Manrope;color:#c7d6f5}}
.board{{position:absolute;left:576px;top:56px;width:572px;height:410px;background:#fbfaf7;border-radius:24px;padding:{board_pad}}}
.chips{{position:absolute;left:576px;top:490px;width:572px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}
.chip{{background:#fbfaf7;color:#15171c;border-radius:16px;height:84px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}}.chip b{{font:800 24px/1.1 Manrope}}.chip span{{font:700 15px/1.2 Manrope;color:#334155}}
</style></head><body>
<div class="brand"><svg width="30" height="28" viewBox="5.5 8.5 109 102"><path d="{HOUSE}" fill="#fff" fill-rule="evenodd"/></svg>Mind Loft</div>
<div class="pill">{pill}</div><h1>{name}</h1><div class="tag">{line1}<em>{line2}</em></div>
<div class="play">Play free</div><div class="url">mindloftdaily.com/{key}</div>
<div class="board">{board}</div><div class="chips">{chip_html}</div></body></html>'''

cards = {
    'bot': card('bot', 'Bot', 'Daily programming puzzle', 'Program the robot.', 'Switch on every lamp.', '#fda4af', '#be123c', bot_svg(),
                [('Par 5 to 6', 'Monday'), ('Par 7 to 9', 'late week'), ('P2 and P3', 'Sunday Edition')], '22px 40px 26px'),
    'peg': card('peg', 'Peg', 'Daily peg solitaire', 'Jump them off, one by one.', 'Leave one, in the center.', '#86efac', '#1d6b4f', peg_svg(),
                [('About 10 pegs', 'Monday'), ('13 to 22', 'later in the week'), ('24 to 30', 'Sunday Edition')], '16px 98px'),
}

async def shoot():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1200, 'height': 630})
        for k, html in cards.items():
            await pg.set_content(html); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(ROOT, 'public', 'og', k + '.png'))
        await b.close()
asyncio.run(shoot())
print('wrote public/og/bot.png and public/og/peg.png')
