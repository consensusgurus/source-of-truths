# 6x6 variant sudoku engine: constraint model, GAC "no-guess" logic, MAC uniqueness.
import random, itertools
N=6; BW,BH=3,2
CELLS=list(range(36))
def rc(i): return divmod(i,6)
def box(r,c): return (r//BH)*2+(c//BW)
ROWS=[[r*6+c for c in range(6)] for r in range(6)]
COLS=[[r*6+c for r in range(6)] for c in range(6)]
BOXES=[[r*6+c for r in range(6) for c in range(6) if box(r,c)==b] for b in range(6)]
DIAGS=[[k*6+k for k in range(6)],[k*6+5-k for k in range(6)]]
KNIGHT=[(1,2),(2,1),(-1,2),(-2,1),(1,-2),(2,-1),(-1,-2),(-2,-1)]

class C:
    __slots__=('scope','distinct','pred','kind')
    def __init__(s,scope,distinct=False,pred=None,kind=''):
        s.scope=tuple(scope); s.distinct=distinct; s.pred=pred; s.kind=kind

def house_cons(extra_houses=()):
    return [C(h,True,None,'house') for h in ROWS+COLS+BOXES+list(extra_houses)]
def knight_cons():
    out=[]; seen=set()
    for i in CELLS:
        r,c=rc(i)
        for dr,dc in KNIGHT:
            rr,cc=r+dr,c+dc
            if 0<=rr<6 and 0<=cc<6:
                j=rr*6+cc; k=(min(i,j),max(i,j))
                if k not in seen: seen.add(k); out.append(C(k,True,None,'knight'))
    return out

def supported(con,doms):
    """Return per-scope-cell sets of supported values (GAC), or None if unsatisfiable."""
    sc=con.scope; n=len(sc); sup=[set() for _ in sc]; vals=[0]*n
    ds=[sorted(doms[i]) for i in sc]
    found=[False]
    def dfs(k,used):
        if k==n:
            if con.pred is None or con.pred(vals):
                found[0]=True
                for q in range(n): sup[q].add(vals[q])
            return
        for v in ds[k]:
            if con.distinct and v in used: continue
            vals[k]=v
            dfs(k+1,used|{v} if con.distinct else used)
    dfs(0,frozenset())
    return sup if found[0] else None

def propagate(cons,doms,watch=None):
    """GAC to fixpoint. doms: list of sets (mutated). Returns False on contradiction, else number of passes."""
    bycell=[[] for _ in CELLS]
    for k,con in enumerate(cons):
        for i in con.scope: bycell[i].append(k)
    queue=list(range(len(cons))); inq=set(queue); passes=0
    while queue:
        k=queue.pop(); inq.discard(k); con=cons[k]; passes+=1
        sup=supported(con,doms)
        if sup is None: return False
        for q,i in enumerate(con.scope):
            if sup[q]!=doms[i]:
                doms[i]=doms[i]&sup[q]
                if not doms[i]: return False
                for k2 in bycell[i]:
                    if k2!=k and k2 not in inq: queue.append(k2); inq.add(k2)
    return passes

def logic_solves(cons,given):
    doms=[{given[i]} if given[i] else set(range(1,7)) for i in CELLS]
    p=propagate(cons,doms)
    if p is False: return None
    return p if all(len(d)==1 for d in doms) else None

def count_solutions(cons,given,limit=2):
    doms=[{given[i]} if given[i] else set(range(1,7)) for i in CELLS]
    n=[0]
    def rec(doms):
        if n[0]>=limit: return
        if propagate(cons,doms) is False: return
        open_=[i for i in CELLS if len(doms[i])>1]
        if not open_: n[0]+=1; return
        i=min(open_,key=lambda j:len(doms[j]))
        for v in sorted(doms[i]):
            d2=[set(d) for d in doms]; d2[i]={v}; rec(d2)
            if n[0]>=limit: return
    rec(doms); return n[0]

def random_solution(cons,R):
    doms=[set(range(1,7)) for _ in CELLS]
    res=[None]
    def rec(doms):
        if res[0]: return
        if propagate(cons,doms) is False: return
        open_=[i for i in CELLS if len(doms[i])>1]
        if not open_: res[0]=[next(iter(d)) for d in doms]; return
        i=min(open_,key=lambda j:(len(doms[j]),R.random()))
        vs=list(doms[i]); R.shuffle(vs)
        for v in vs:
            d2=[set(d) for d in doms]; d2[i]={v}; rec(d2)
            if res[0]: return
    rec(doms); return res[0]
