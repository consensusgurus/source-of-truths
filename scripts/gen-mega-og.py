#!/usr/bin/env python3
# Bake the share cards for Colossus and Mammoth (public/og/<key>.png, 1200x630).
# HAND_BAKED (lib/og-stage-cards.js): drawn as a web page and photographed with
# Playwright, not by scripts/bake-og.mjs. Each card is the real board 1 tilted
# away, a few sudokus on it solved. NO CHARACTERS (owner, 2026-11-22: the first
# cards had a colossus and a mammoth built out of squares; "get rid of the
# characters").
#
#   npm pack @fontsource/manrope@5.1.0 && tar xzf fontsource-manrope-5.1.0.tgz
#   MANROPE_DIR=$PWD/package/files python3 scripts/gen-mega-og.py
import asyncio, json, re, sys
from playwright.async_api import async_playwright
import os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
FONTS=os.environ.get('MANROPE_DIR', os.path.abspath('package/files'))  # npm pack @fontsource/manrope@5.1.0, untarred
def board(game):
    s=open(f'{ROOT}/app/{game}/boards.js').read()
    line=[l for l in s.split('\n') if l.startswith('  {"num":1')][0]
    return json.loads(line.rstrip(','))
def plane(game, N, bh, bw, W, H, given, cell, rows, cols, r0, c0, solved, acc):
    # a window of the real board 1, drawn flat; CSS tilts it
    A=(W-N)//(N-bw)+1
    out=[]
    cov=set()
    pos=[]
    B=(H-N)//(N-bh)+1
    for b in range(B):
        for a in range(A):
            if (a+b)%2==0: pos.append(((N-bh)*b,(N-bw)*a))
    for (gr,gc) in pos:
        for i in range(N):
            for j in range(N): cov.add((gr+i,gc+j))
    # the solved sudokus: the few nearest a point right of centre, whole in the window
    inside=[gi for gi,(gr,gc) in enumerate(pos) if gr>=r0 and gc>=c0 and gr+N<=r0+rows and gc+N<=c0+cols]
    inside.sort(key=lambda gi:(pos[gi][0]+N/2-(r0+rows*0.42))**2+(pos[gi][1]+N/2-(c0+cols*0.6))**2)
    solved=inside[:solved]
    done=set()
    for gi in solved:
        gr,gc=pos[gi]
        for i in range(N):
            for j in range(N): done.add((gr+i,gc+j))
    for r in range(r0,r0+rows):
        for c in range(c0,c0+cols):
            if (r,c) not in cov: continue
            d=given[r*W+c]
            cls='c'+(' d' if (r,c) in done else '')
            txt=d if d!='0' else ''
            if (r,c) in done and d=='0': txt=str((r*7+c*3)%N+1); cls+=' m'
            out.append(f'<b class="{cls}" style="left:{(c-c0)*cell}px;top:{(r-r0)*cell}px">{txt}</b>')
    for gi,(gr,gc) in enumerate(pos):
        if gr+N<=r0 or gc+N<=c0 or gr>=r0+rows or gc>=c0+cols: continue
        out.append(f'<u style="left:{(gc-c0)*cell}px;top:{(gr-r0)*cell}px;width:{N*cell}px;height:{N*cell}px"></u>')
    return ''.join(out), pos
def page(game):
    b=board(game)
    if game=='colossus':
        N,bh,bw=9,3,3; name='Colossus'; pill='THE GIANT LINKED SUDOKU'; l1='61 sudokus. One board.'; l2='Solve the ones nobody else does.'
        bg='radial-gradient(1200px 700px at 78% 30%, #f59e0b 0%, #c2410c 38%, #7c2d12 72%, #431407 100%)'
        ink='#fff7ed'; pillbg='#fed7aa'; pillink='#7c2d12'; acc='#9a3412'; tint='#fed7aa'; cell=46
        rows,cols,r0,c0=22,26,6,6; solved=3
        shadow='rgba(67,20,7,.55)'
    else:
        N,bh,bw=6,2,3; name='Mammoth'; pill='257 LINKED 6X6 SUDOKUS'; l1='A whole herd of Sixes.'; l2='One enormous board.'
        bg='radial-gradient(1200px 700px at 78% 28%, #bfdbfe 0%, #60a5fa 34%, #1e4fa3 70%, #0f2a5c 100%)'
        ink='#f0f7ff'; pillbg='#dbeafe'; pillink='#12315f'; acc='#1e4fa3'; tint='#bfdbfe'; cell=46
        rows,cols,r0,c0=22,26,8,9; solved=5
        shadow='rgba(15,42,92,.5)'
    W=(N-bw)*(b['A']-1)+N; H=(N-bh)*(b['B']-1)+N
    p,_=plane(game,N,bh,bw,W,H,b['given'],cell,rows,cols,r0,c0,solved,acc)
    return f'''<!DOCTYPE html><html><head><meta charset="utf-8">
<style>@font-face{{font-family:Manrope;font-weight:500;src:url(file://{FONTS}/manrope-latin-500-normal.woff2)}}@font-face{{font-family:Manrope;font-weight:700;src:url(file://{FONTS}/manrope-latin-700-normal.woff2)}}@font-face{{font-family:Manrope;font-weight:800;src:url(file://{FONTS}/manrope-latin-800-normal.woff2)}}</style>
<style>
*{{box-sizing:border-box}}body{{margin:0;width:1200px;height:630px;overflow:hidden;font-family:Manrope,sans-serif;background:{bg};color:{ink};position:relative}}
.plane{{overflow:hidden;position:absolute;left:690px;top:-270px;width:{cols*cell}px;height:{rows*cell}px;transform:perspective(1500px) rotateX(52deg) rotateZ(-24deg);transform-origin:30% 55%;box-shadow:0 60px 90px {shadow}}}
.plane b{{position:absolute;width:{cell}px;height:{cell}px;background:#fffdf8;border:1px solid rgba(20,20,30,.22);color:#16181d;font-weight:800;font-size:{int(cell*.6)}px;line-height:{cell-2}px;text-align:center}}
.plane b.d{{background:{tint}}} .plane b.m{{color:{acc}}}
.plane u{{position:absolute;border:4px solid #16181d;text-decoration:none}}
.fade{{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.36) 0%,rgba(0,0,0,.26) 44%,rgba(0,0,0,0) 66%)}}
.brand{{position:absolute;left:64px;top:56px;display:flex;align-items:center;gap:12px;font-weight:800;font-size:24px}}
.pill{{position:absolute;left:64px;top:138px;background:{pillbg};color:{pillink};font-weight:800;font-size:17px;letter-spacing:.14em;border-radius:999px;padding:9px 20px}}
h1{{position:absolute;left:58px;top:190px;margin:0;font-size:{118 if game=='mammoth' else 130}px;font-weight:800;letter-spacing:-.045em;line-height:1.15;text-shadow:0 6px 0 rgba(0,0,0,.18)}}
.tag{{position:absolute;left:64px;top:372px;font-size:33px;font-weight:700;line-height:1.3}}
.tag b{{font-weight:800}}
.cta{{position:absolute;left:64px;top:522px;background:#fff;color:#16181d;font-weight:800;font-size:23px;border-radius:999px;padding:14px 28px}}
.url{{position:absolute;left:268px;top:536px;font-weight:700;font-size:22px;opacity:.95}}
</style></head><body>
<div class="plane">{p}</div>
<div class="fade"></div>
<div class="brand"><svg width="30" height="30" viewBox="0 0 26 26"><path d="M3 22V11l10-8 10 8v11h-5v-8l-5 5-5-5v8z" fill="currentColor"/></svg>Mind Loft</div>
<div class="pill">{pill}</div>
<h1>{name}</h1>
<div class="tag"><b>{l1}</b><br>{l2}</div>
<div class="cta">Play free</div><div class="url">mindloftdaily.com/{game}</div>
</body></html>'''
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch()
        pg=await br.new_page(viewport={'width':1200,'height':630})
        for g in ['colossus','mammoth']:
            tmp=os.path.abspath(f'_og_{g}.html'); open(tmp,'w').write(page(g))  # a file page, so the file:// fonts load
            await pg.goto('file://'+tmp);await pg.wait_for_timeout(1500); os.remove(tmp)
            await pg.screenshot(path=os.path.join(ROOT,'public','og',f'{g}.png'))
        await br.close()
asyncio.run(main())
