// Fortune 500 HQ States: the click-the-state companion to HQ Hunt (2026-11-16).
// Same 500 companies as quizzes-snippet.json, reshuffled (different seed) so a
// part never repeats a Hunt part's set. Run: node gen-states.cjs 2026-11-16T15:30:00Z
const fs=require('fs');
const hunt=JSON.parse(fs.readFileSync(process.argv[3]||'quizzes-snippet.json','utf8'));
const all=hunt.flatMap(q=>q.cities);
if(all.length!==500) throw new Error('want 500, got '+all.length);
let s=0x57a7e5;const rnd=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const a=all.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
const base=Date.parse(process.argv[2]);
const out=[];
for(let p=0;p<20;p++){const chunk=a.slice(p*25,p*25+25);
 for(const c of chunk) if(!/, [A-Z]{2}$/.test(c.hq)) throw new Error('no state: '+c.hq);
 out.push({id:`fortune-500-hq-states-${p+1}`,publishedDate:new Date(base).toISOString().slice(0,10),publishedAt:new Date(base-(20-p)*1000).toISOString().replace(/\.\d+Z$/,'Z'),
 title:`Fortune 500 HQ States (Part ${p+1})`,navTitle:`Fortune 500 States (Part ${p+1})`,category:'Business · Fortune 500',type:'other',tags:['other','business','geography'],
 format:'place-map',region:'usa',pick:'state',series:'fortune-500-hq-states',part:p+1,parts:20,timeLimit:120,maxPerCity:100,
 blurb:`Twenty-five Fortune 500 companies, two minutes, every state on the map. A company appears and you click the state where it keeps its headquarters. The right state scores 100, so a perfect round is 2,500. Part ${p+1} of 20: all 500 companies on the 2026 Fortune 500, shuffled across the set. For exact cities, play the HQ Hunt.`,
 source:{label:'2026 Fortune 500 · HQ locations GeoNames / OpenStreetMap',url:'https://fortune.com/ranking/fortune500/'},
 cities:chunk.map(c=>({name:c.name,hq:c.hq,lon:c.lon,lat:c.lat}))});}
const names=new Set(out.flatMap(q=>q.cities.map(c=>c.name)));
if(names.size!==500) throw new Error('dupes '+names.size);
fs.writeFileSync('states-snippet.json',JSON.stringify(out,null,2));
console.log('ok',out.length,out[0].publishedAt,out[19].publishedAt);
