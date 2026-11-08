# Tile icons (76x76, plain and blue sets) for the colour twins, MercuryToo and the
# Small 6x6 sudokus (owner, 2026-11-08). Same language as the other sudoku tiles:
# a rounded square in the game's hue, a white grid with heavy box walls; the
# colour games carry a few site-pastel squares, the Small games their variant's
# mark in the pale tint.   python3 scripts/gen-colour-small-tiles.py <repo dir> [<key> ...]
import sys, os
from PIL import Image, ImageDraw
ROOT=sys.argv[1] if len(sys.argv)>1 else '.'
PAST=['#b1e5fd','#f1d289','#a8f1d4','#fdaab6','#d9b5fd','#d8f7a2','#f1b0fb','#c9d2fd','#fdbd92']
RAIN=['#fdaab6','#fdbd92','#f1d289','#d8f7a2','#a8f1d4','#b1e5fd','#c9d2fd','#d9b5fd','#f1b0fb']
HUE={'giant':'#3949ab','sixes':'#1d4ed8','suds':'#ea580c','diag':'#0e7490','window':'#be185d','knight':'#3730a3','racecar':'#475569','rim':'#4d7c0f','mercury':'#991b1b','sando':'#15616b','cages':'#6b21a8','arrow':'#86198f','frame':'#b45309','sumo':'#8a6d0b','polka':'#16a34a'}
GAMES={'sixestoo':('sixes','colour',6),'sudstoo':('suds','colour',9),'diagtoo':('diag','colour',9),'windowtoo':('window','colour',9),'knighttoo':('knight','colour',9),'racecartoo':('racecar','colour',9),'rimtoo':('rim','colour',9),'mercurytoo':('mercury','rainbow',9)}
for k,s in [('kayak','racecar'),('lip','rim'),('fever','mercury'),('snack','sando'),('coop','cages'),('dart','arrow'),('trim','frame'),('bout','sumo'),('dot','polka')]: GAMES[k]=(s,'mark',6)
for k,s in [('kayaktoo','racecar'),('liptoo','rim')]: GAMES[k]=(s,'colourmark',6)
GAMES['gianttoo']=('giant','giant',16)
GIANT16=['#fdaab6','#fdbd92','#f7e08a','#a8f1d4','#b1e5fd','#d9b5fd','#f1b0fb','#cbd2dc','#f7708a','#f99a52','#eab308','#3ccf99','#5aaef5','#a88bf8','#e27ff2','#8b97aa']
S=4  # supersample
def tile(key,blue):
    src,style,n=GAMES[key]; W=76*S
    im=Image.new('RGBA',(W,W),(0,0,0,0)); d=ImageDraw.Draw(im)
    bg='#15295e' if blue else HUE[src]
    d.rounded_rectangle([0,0,W-1,W-1],radius=16*S,fill=bg)
    x0,y0,x1,y1=9*S,9*S,67*S,67*S; cs=(x1-x0)/6
    cell=lambda r,c:[x0+c*cs,y0+r*cs,x0+(c+1)*cs,y0+(r+1)*cs]
    if style=='giant':
        # GiantToo: an 8x8 corner of the 16x16, heavy walls every four squares,
        # soft and bright pastels scattered across it.
        cs=(x1-x0)/8
        for r,c,k in [(0,1,0),(0,6,9),(1,3,12),(2,0,4),(2,5,2),(3,2,14),(3,7,6),(4,4,1),(5,1,11),(5,6,13),(6,3,5),(7,0,8),(7,5,10),(6,7,3),(1,6,15),(4,0,7)]:
            d.rectangle([x0+c*cs,y0+r*cs,x0+(c+1)*cs,y0+(r+1)*cs],fill=GIANT16[k])
        thin=(255,255,255,90) if not blue else (147,180,255,110); heavy=(255,255,255,235)
        for k in range(1,8):
            hw=(k==4)
            d.line([(x0+k*cs,y0),(x0+k*cs,y1)],fill=heavy if hw else thin,width=S*(2 if hw else 1))
            d.line([(x0,y0+k*cs),(x1,y0+k*cs)],fill=heavy if hw else thin,width=S*(2 if hw else 1))
        d.rectangle([x0,y0,x1,y1],outline=heavy,width=S*2)
        return im.resize((76,76),Image.LANCZOS)
    if style in ('colour','colourmark','rainbow'):
        pal=RAIN if style=='rainbow' else PAST
        spots=[(0,1,0),(1,4,1),(2,2,2),(3,5,3),(4,0,4),(5,3,5),(2,4,6 if n==9 else 0),(4,2,7 if n==9 else 1)]
        for r,c,k in spots: d.rectangle(cell(r,c),fill=pal[k])
    pale=(255,255,255,150) if not blue else (147,180,255,190)
    def mark():
        ctr=lambda r,c:(x0+(c+.5)*cs,y0+(r+.5)*cs)
        w=int(cs*.34)
        if src=='diag': d.line([ctr(0,0),ctr(5,5)],fill=pale,width=w//2); d.line([ctr(0,5),ctr(5,0)],fill=pale,width=w//2)
        if src=='knight': d.line([ctr(1,1),ctr(3,1),ctr(3,2)],fill=pale,width=w,joint='curve')
        if src=='racecar': d.line([ctr(1,1),ctr(2,2),ctr(2,3),ctr(1,4)],fill=pale,width=w,joint='curve')
        if src=='mercury': d.line([ctr(4,1),ctr(1,1),ctr(1,3)],fill=pale,width=w,joint='curve'); x,y=ctr(4,1); d.ellipse([x-cs*.4,y-cs*.4,x+cs*.4,y+cs*.4],fill=pale)
        if src=='arrow': x,y=ctr(1,1); d.ellipse([x-cs*.38,y-cs*.38,x+cs*.38,y+cs*.38],outline=pale,width=S*2); d.line([ctr(2,2),ctr(3,3),ctr(3,4)],fill=pale,width=S*2)
        if src=='cages': d.rectangle([x0+cs*1.12,y0+cs*1.12,x0+cs*2.88,y0+cs*2.88],outline=pale,width=S*2); d.rectangle([x0+cs*3.12,y0+cs*3.12,x0+cs*4.88,y0+cs*5.88],outline=pale,width=S*2)
        if src in ('sando','frame','rim'):
            for k in range(6):
                if src!='sando' or True: d.ellipse([x0+(k+.38)*cs,y0-cs*.62,x0+(k+.62)*cs,y0-cs*.38],fill=pale) if src!='rim' or k%2==0 else None
        if src=='sumo':
            for r in range(6):
                for c in (0,1,3,4):
                    x=x0+(c+1)*cs; y=y0+(r+.5)*cs; dx=cs*.18*(1 if (r+c)%2 else -1)
                    d.line([(x,y-cs*.22),(x+dx,y),(x,y+cs*.22)],fill=pale,width=S*2)
        if src=='polka':
            for (r,c,blk) in [(1,1,0),(2,3,1),(3,0,0),(4,4,1),(0,4,0)]:
                x=x0+(c+1)*cs; y=y0+(r+.5)*cs; rr=cs*.2
                d.ellipse([x-rr,y-rr,x+rr,y+rr],fill=('#0b1220' if blk else '#ffffff'),outline='#ffffff',width=S)
    if style in ('mark','colourmark'): mark()
    if style=='rainbow':
        ctr=lambda r,c:(x0+(c+.5)*cs,y0+(r+.5)*cs); w=int(cs*.3)
        d.line([ctr(4,0),ctr(4,2),ctr(2,2),ctr(2,4)],fill=(255,255,255,170),width=w,joint='curve'); x,y=ctr(4,0); d.ellipse([x-cs*.38,y-cs*.38,x+cs*.38,y+cs*.38],fill=(255,255,255,170))
    thin=(255,255,255,90) if not blue else (147,180,255,110); heavy=(255,255,255,235)
    for k in range(1,6):
        wall=(k==3) if True else False
        d.line([(x0+k*cs,y0),(x0+k*cs,y1)],fill=heavy if k==3 else thin,width=S*(2 if k==3 else 1))
        hw=(k%2==0)
        d.line([(x0,y0+k*cs),(x1,y0+k*cs)],fill=heavy if hw else thin,width=S*(2 if hw else 1))
    d.rectangle([x0,y0,x1,y1],outline=heavy,width=S*2)
    return im.resize((76,76),Image.LANCZOS)
ONLY=sys.argv[2:]
for key in GAMES:
    if ONLY and key not in ONLY: continue
    tile(key,False).save(os.path.join(ROOT,'public/games',f'btn-{key}.png'))
    tile(key,True).save(os.path.join(ROOT,'public/games/blue',f'btn-{key}.png'))
print('tiles',len(GAMES))
