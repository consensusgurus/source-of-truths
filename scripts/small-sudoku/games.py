# Clue structures for each 6x6 game, built from a solution, plus how to dig.
import random, json
from engine import *

def adj_paths(start,L,R,ok,diag=True,used=()):
    path=[start]
    while len(path)<L:
        r,c=rc(path[-1]); opts=[]
        for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)]+([(-1,-1),(-1,1),(1,-1),(1,1)] if diag else []):
            rr,cc=r+dr,c+dc
            if 0<=rr<6 and 0<=cc<6:
                j=rr*6+cc
                if j not in path and j not in used and ok(path,j): opts.append(j)
        if not opts: return None
        # prefer orthogonal
        orth=[j for j in opts if j//6==path[-1]//6 or j%6==path[-1]%6]
        path.append(R.choice(orth if orth and R.random()<0.7 else opts))
    return path

class Game:
    key=''; base_extra=(); knight=False; prints_digits=True
    def base(self): 
        cs=house_cons(self.base_extra)
        if self.knight: cs+=knight_cons()
        return cs
    def structure(self,sol,R): return {}          # clue data that is always printed
    def struct_cons(self,st): return []           # constraints from that data
    def units(self,sol,st): return [('g',i) for i in CELLS]   # diggable clue units
    def unit_cons(self,u,sol,st):
        return None
    def given_from(self,units,sol):
        g=[0]*36
        for u in units:
            if u[0]=='g': g[u[1]]=sol[u[1]]
        return g
    def cons_for(self,units,sol,st):
        cs=self.base()+self.struct_cons(st)
        for u in units:
            x=self.unit_cons(u,sol,st)
            if x: cs.append(x)
        return cs
    def export(self,units,sol,st): return {}

class Plain(Game): key='plain'
class Diag(Game): key='diag'; base_extra=DIAGS
class Knight(Game): key='knight'; knight=True

class Mercury(Game):
    key='mercury'
    def structure(self,sol,R):
        for _ in range(400):
            used=set(); th=[]
            for _ in range(R.randint(4,6)):
                L=R.randint(3,5)
                free=[i for i in CELLS if i not in used]
                p=adj_paths(R.choice(free),L,R,lambda path,j: sol[j]>sol[path[-1]],True,used)
                if p: th.append(p); used|=set(p)
            if len(th)>=4: return {'thermos':th}
        return None
    def struct_cons(self,st):
        return [C((t[k],t[k+1]),False,lambda v:v[0]<v[1],'thermo') for t in st['thermos'] for k in range(len(t)-1)]
    def export(self,units,sol,st): return {'thermos':[[list(rc(i)) for i in t] for t in st['thermos']]}

def sandwich(vals):
    a=vals.index(1); b=vals.index(6)
    lo,hi=min(a,b),max(a,b); return sum(vals[lo+1:hi])
class Sando(Game):
    key='sando'
    def structure(self,sol,R):
        return {'rows':[sandwich([sol[i] for i in h]) for h in ROWS],'cols':[sandwich([sol[i] for i in h]) for h in COLS]}
    def struct_cons(self,st):
        out=[]
        for h,s in zip(ROWS,st['rows']): out.append(C(h,True,(lambda s: lambda v: sandwich(v)==s)(s),'sando'))
        for h,s in zip(COLS,st['cols']): out.append(C(h,True,(lambda s: lambda v: sandwich(v)==s)(s),'sando'))
        return out
    def export(self,units,sol,st): return {'rowSums':st['rows'],'colSums':st['cols']}

def edge(side,k):
    return [j*6+k for j in range(3)] if side=='top' else [(5-j)*6+k for j in range(3)] if side=='bottom' else [k*6+j for j in range(3)] if side=='left' else [k*6+5-j for j in range(3)]
SIDES=['top','bottom','left','right']
class Frame(Game):
    key='frame'
    def structure(self,sol,R): return {s:[sum(sol[i] for i in edge(s,k)) for k in range(6)] for s in SIDES}
    def struct_cons(self,st):
        return [C(edge(s,k),True,(lambda t: lambda v: sum(v)==t)(st[s][k]),'frame') for s in SIDES for k in range(6)]
    def export(self,units,sol,st): return {'sums':{s:st[s] for s in ['top','bottom','left','right']}}

class Rim(Game):
    key='rim'; prints_digits=False
    def units(self,sol,st): return [('e',s,k) for s in SIDES for k in range(6)]
    def unit_cons(self,u,sol,st):
        cells=edge(u[1],u[2]); S=frozenset(sol[i] for i in cells)
        return C(cells,True,lambda v,S=S: set(v)==S,'rim')
    def export(self,units,sol,st):
        rim={s:[None]*6 for s in SIDES}
        for u in units:
            if u[0]=='e': rim[u[1]][u[2]]=''.join(str(x) for x in sorted(sol[i] for i in edge(u[1],u[2])))
        return {'rim':rim}

class Racecar(Game):
    key='racecar'
    def structure(self,sol,R):
        for _ in range(600):
            used=set(); lines=[]
            for _ in range(60):
                if len(lines)>=R.randint(4,6): break
                L=R.choice([3,3,4,5])
                free=[i for i in CELLS if i not in used]
                p=adj_paths(R.choice(free),L,R,lambda path,j: True,True,used)
                if not p: continue
                v=[sol[i] for i in p]
                if v==v[::-1]: lines.append(p); used|=set(p)
            if len(lines)>=4: return {'lines':lines}
        return None
    def struct_cons(self,st):
        out=[]
        for ln in st['lines']:
            for k in range(len(ln)//2): out.append(C((ln[k],ln[-1-k]),False,lambda v:v[0]==v[1],'pal'))
        return out
    def export(self,units,sol,st): return {'lines':[[list(rc(i)) for i in ln] for ln in st['lines']]}

class Arrow(Game):
    key='arrow'
    def structure(self,sol,R):
        for _ in range(800):
            used=set(); arrows=[]
            for _ in range(80):
                if len(arrows)>=R.randint(4,6): break
                circ=R.choice([i for i in CELLS if i not in used and sol[i]>=3])
                L=R.choice([2,2,3])
                p=adj_paths(circ,L+1,R,lambda path,j: True,True,used)
                if not p: continue
                if sum(sol[i] for i in p[1:])==sol[circ]: arrows.append(p); used|=set(p)
            if len(arrows)>=4: return {'arrows':arrows}
        return None
    def struct_cons(self,st):
        return [C(a,False,lambda v: v[0]==sum(v[1:]),'arrow') for a in st['arrows']]
    def export(self,units,sol,st): return {'arrows':[[list(rc(i)) for i in a] for a in st['arrows']]}

def in_box_edges():
    h=[];v=[]
    for r in range(6):
        for c in range(5):
            if box(r,c)==box(r,c+1): h.append((r*6+c,r*6+c+1))
    for r in range(5):
        for c in range(6):
            if box(r,c)==box(r+1,c): v.append((r*6+c,(r+1)*6+c))
    return h,v
class Sumo(Game):
    key='sumo'
    def struct_cons(self,st):
        h,v=in_box_edges(); out=[]
        for a,b in h+v:
            out.append(C((a,b),False,(lambda gt: (lambda x: x[0]>x[1]) if gt else (lambda x: x[0]<x[1]))(st['sol'][a]>st['sol'][b]),'sign'))
        return out
    def structure(self,sol,R): return {'sol':sol}
    def export(self,units,sol,st):
        # h: per row, the in-box horizontal edges left to right ('>' left bigger);
        # v: per band gap row, every column ('^' upper smaller? see client): 'v' when the upper is bigger.
        H=[];V=[]
        for r in range(6):
            s=''
            for c in range(5):
                if box(r,c)==box(r,c+1): s+='>' if sol[r*6+c]>sol[r*6+c+1] else '<'
            H.append(s)
        for r in range(5):
            if box(r,0)==box(r+1,0):
                V.append(''.join('v' if sol[r*6+c]>sol[(r+1)*6+c] else '^' for c in range(6)))
        return {'h':H,'v':V}

def kro(a,b):
    if abs(a-b)==1: return 1
    if a==2*b or b==2*a: return 2
    return 0
class Polka(Game):
    key='polka'; prints_digits=False
    def units(self,sol,st): return []
    def structure(self,sol,R): return {'sol':sol}
    def struct_cons(self,st):
        s=st['sol']; out=[]
        for r in range(6):
            for c in range(6):
                i=r*6+c
                for j in ([i+1] if c<5 else [])+([i+6] if r<5 else []):
                    k=kro(s[i],s[j])
                    # 1-2 qualifies as both: print white (the 9x9 Polka convention is checked in the client)
                    out.append(C((i,j),False,(lambda k: lambda v: kro(v[0],v[1])==k)(k),'dot'))
        return out
    def export(self,units,sol,st):
        h=[[kro(sol[r*6+c],sol[r*6+c+1]) for c in range(5)] for r in range(6)]
        v=[[kro(sol[r*6+c],sol[(r+1)*6+c]) for c in range(6)] for r in range(5)]
        return {'dots':{'h':h,'v':v}}

class Cages(Game):
    key='cages'; prints_digits=False; sizes=[2,2,2,3,3,4]
    def units(self,sol,st): return []
    def structure(self,sol,R):
        # random partition into cages of 1..4 squares, no repeated digit in a cage
        for _ in range(500):
            cage=[-1]*36; cid=0; order=CELLS[:]; R.shuffle(order); ok=True
            for i in order:
                if cage[i]>=0: continue
                size=R.choice(self.sizes)
                cells=[i]; cage[i]=cid
                while len(cells)<size:
                    nb=[]
                    for x in cells:
                        r,c=rc(x)
                        for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                            rr,cc=r+dr,c+dc
                            if 0<=rr<6 and 0<=cc<6:
                                j=rr*6+cc
                                if cage[j]<0 and sol[j] not in [sol[y] for y in cells]: nb.append(j)
                    if not nb: break
                    j=R.choice(nb); cage[j]=cid; cells.append(j)
                cid+=1
            singles=sum(1 for k in range(cid) if cage.count(k)==1)
            if singles<=1: 
                sums=[sum(sol[i] for i in CELLS if cage[i]==k) for k in range(cid)]
                return {'cage':cage,'sums':sums}
        return None
    def struct_cons(self,st):
        out=[]
        for k,s in enumerate(st['sums']):
            cells=[i for i in CELLS if st['cage'][i]==k]
            out.append(C(cells,True,(lambda s: lambda v: sum(v)==s)(s),'cage'))
        return out
    def export(self,units,sol,st):
        return {'cage':[st['cage'][r*6:(r+1)*6] for r in range(6)],'sums':st['sums']}

GAMES={g.key:g for g in [Plain(),Diag(),Knight(),Mercury(),Sando(),Frame(),Rim(),Racecar(),Arrow(),Sumo(),Polka(),Cages()]}
