const fs=require('fs');
const geo=require('./geo.json');
const ST={Alabama:'AL',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',Delaware:'DE','District Of Columbia':'DC',Florida:'FL',Georgia:'GA',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Missouri:'MO',Nebraska:'NE',Nevada:'NV','New Jersey':'NJ','New York':'NY','North Carolina':'NC',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Virginia:'VA',Washington:'WA',Wisconsin:'WI'};
const MAN={14:[41.831,-72.737],26:[38.895,-77.036],107:[42.301,-87.896],186:[38.895,-77.036],325:[36.060,-86.672],443:[38.895,-77.036]};
const REN={'MSD':'Merck','International Business Machines':'IBM','Exxon Mobil Holdings':'ExxonMobil','Lululemon athletica':'Lululemon','Ebay':'eBay','United Services Automobile Assn.':'USAA','Southern':'Southern Company','Williams':'Williams Companies','Ball':'Ball Corporation','Reliance':'Reliance Inc.','FM':'FM (Factory Mutual)','Block':'Block (Square)','Andersons':'The Andersons','VF':'VF Corp.','Fox':'Fox Corp.','APA':'APA Corp.','Dana':'Dana Inc.','Dover':'Dover Corp.','Loews':'Loews Corp.','Lear':'Lear Corp.','Guardian Life Ins. Co. of America':'Guardian Life','Expeditors Intl. of Washington':'Expeditors','Jones Financial (Edward Jones)':'Edward Jones','Peter Kiewit Sons\'':'Kiewit','Westinghouse Air Brake':'Wabtec','Fidelity National Information (FIS)':'FIS','Bank of New York (BNY)':'BNY'};
const rows=fs.readFileSync('f500.txt','utf8').trim().split('\n').map(l=>l.split('|'));
const byR={};geo.forEach(g=>byR[g.r]=g);
const all=rows.map(([r,name,city,state])=>{r=+r;let lat,lon;if(MAN[r])[lat,lon]=MAN[r];else{lat=byR[r].lat;lon=byR[r].lon}
 const st=ST[state]; const c=city.replace(/^Washington, D\.C\.$/,'Washington');
 name=REN[name]||name; return {rank:r,name,hq:st==='DC'?'Washington, DC':`${c}, ${st}`,lon,lat}});
if(all.length!==500||all.some(a=>a.lat==null))throw 'bad';
// seeded shuffle (mulberry32)
let s=0x5f500;const rnd=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const a=all.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
const base=Date.parse(process.argv[2]);
const quizzes=[];
for(let p=0;p<20;p++){const chunk=a.slice(p*25,p*25+25);
 quizzes.push({id:`fortune-500-hq-${p+1}`,publishedDate:new Date(base).toISOString().slice(0,10),publishedAt:new Date(base-(20-p)*1000).toISOString().replace(/\.\d+Z$/,'Z'),
 title:`Fortune 500 HQ Hunt (Part ${p+1})`,navTitle:`Fortune 500 HQs (Part ${p+1})`,category:'Business · Fortune 500',type:'other',tags:['other','business','geography'],
 format:'place-map',region:'usa',series:'fortune-500-hq',part:p+1,parts:20,timeLimit:150,maxPerCity:100,fullMiles:15,zeroMiles:300,
 blurb:`Twenty-five Fortune 500 companies, two and a half minutes, one blank map of the lower 48. A company appears and you click where it keeps its headquarters. Land in the same city or suburb for full credit, and the closer you land, the more points, up to 2,500. Part ${p+1} of 20: all 500 companies on the 2026 Fortune 500, shuffled across the set.`,
 source:{label:'2026 Fortune 500 · HQ coordinates GeoNames / OpenStreetMap',url:'https://fortune.com/ranking/fortune500/'},
 cities:chunk.map(c=>({name:c.name,hq:c.hq,lon:c.lon,lat:c.lat}))});}
fs.writeFileSync('quizzes-snippet.json',JSON.stringify(quizzes,null,2));
const ranks=new Set();quizzes.forEach(q=>q.cities.forEach(c=>ranks.add(c.name)));console.log('unique names',ranks.size, quizzes.length, quizzes[0].publishedAt, quizzes[19].publishedAt);
console.log(quizzes[0].cities.slice(0,5));
