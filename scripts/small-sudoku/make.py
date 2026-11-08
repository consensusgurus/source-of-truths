import sys, json, random, time
from engine import *
from games import GAMES
# weekday add-back: clue units added to a minimal board (0=Mon .. 6=Sun)
ADD={0:6,1:5,2:4,3:3,4:2,5:1,6:0}
def one(game,seed):
    R=random.Random(seed)
    for attempt in range(200):
        sol=random_solution(game.base(),R)
        st=game.structure(sol,R)
        if st is None: continue
        units=game.units(sol,st)
        base=game.base()+game.struct_cons(st)
        def ok(us):
            cs=base+[x for u in us for x in [game.unit_cons(u,sol,st)] if x]
            g=game.given_from(us,sol)
            return count_solutions(cs,g)==1 and logic_solves(cs,g) is not None
        if not ok(units): continue
        cur=units[:]; R.shuffle(cur)
        for u in list(cur):
            trial=[x for x in cur if x!=u]
            if ok(trial): cur=trial
        removed=[u for u in units if u not in cur]
        R.shuffle(removed)
        return sol,st,cur,removed
    raise RuntimeError('no board')
if __name__=='__main__':
    key=sys.argv[1]; seed0=int(sys.argv[2]); count=int(sys.argv[3]); out=sys.argv[4]
    g=GAMES[key]; res=[]
    t=time.time()
    for k in range(count):
        sol,st,minimal,removed=one(g,seed0+k)
        res.append({'sol':sol,'st':{a:b for a,b in st.items() if a!='sol'},'minimal':minimal,'removed':removed[:8],'export':None})
        print(key,k,len(minimal),round(time.time()-t,1),flush=True)
    json.dump(res,open(out,'w'))
