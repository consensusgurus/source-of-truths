# Build a full 6x6 bank: one board per day, weekday ramp by add-back.
import sys, json, random, datetime, time
from engine import *
from games import GAMES
from make import one
ADD={0:6,1:5,2:4,3:3,4:2,5:1,6:0}
CAGE_SIZES={0:[2,2,2,2,3],1:[2,2,2,3],2:[2,2,3,3],3:[2,2,3,3,4],4:[2,3,3,4],5:[2,3,3,4],6:[3,3,4,4]}
def main(out_key,gkey,seed,start,end,path):
    g=GAMES[gkey]; d=datetime.date.fromisoformat(start); e=datetime.date.fromisoformat(end)
    res=[]; k=0; t=time.time()
    while d<=e:
        wd=d.weekday()
        if gkey=='cages': g.sizes=CAGE_SIZES[wd]
        sol,st,minimal,removed=one(g,seed*100000+k)
        units=minimal+removed[:ADD[wd]] if g.units(sol,st) else []
        exp=g.export(units,sol,st)
        given=g.given_from(units,sol)
        res.append({'live':d.isoformat(),'sunday':wd==6,'sol':sol,'given':given,'export':exp,
                    'printed':sum(1 for u in units if u[0]=='g') if gkey!='rim' else len(units)})
        d+=datetime.timedelta(days=1); k+=1
    json.dump(res,open(path,'w'))
    print(out_key,len(res),round(time.time()-t,1),flush=True)
if __name__=='__main__':
    pass #[1:4][:2],int(sys.argv[3]),sys.argv[4],sys.argv[5],sys.argv[6])
