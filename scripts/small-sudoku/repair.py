import json, sys, random, datetime
from games import GAMES
from make import one
from bank import ADD
key,kind=sys.argv[1],sys.argv[2]; nums=[int(x) for x in sys.argv[3].split(',')]; fam=sys.argv[4].split(',')
B=json.load(open(f'bank_{key}.json'))
others=[(b['live'],tuple(b['sol'])) for k in fam for b in json.load(open(f'bank_{k}.json'))]
g=GAMES[kind]
for n in nums:
    b=B[n-1]; d=datetime.date.fromisoformat(b['live']); seed=777000+n
    while True:
        sol,st,minimal,removed=one(g,seed); seed+=1
        near=[s for (lv,s) in others+[(x['live'],tuple(x['sol'])) for x in B if x is not b] if abs((datetime.date.fromisoformat(lv)-d).days)<14]
        if tuple(sol) in near: continue
        units=minimal+removed[:ADD[d.weekday()]]
        b.update(sol=sol,given=g.given_from(units,sol),export=g.export(units,sol,st),printed=sum(1 for u in units if u[0]=='g') if kind!='rim' else len(units))
        print('repaired',key,n); break
json.dump(B,open(f'bank_{key}.json','w'))
