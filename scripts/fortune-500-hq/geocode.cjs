const c=require('all-the-cities').filter(x=>x.country==='US');
const ST={Alabama:'AL',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',Delaware:'DE','District Of Columbia':'DC',Florida:'FL',Georgia:'GA',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Missouri:'MO',Nebraska:'NE',Nevada:'NV','New Jersey':'NJ','New York':'NY','North Carolina':'NC',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Virginia:'VA',Washington:'WA',Wisconsin:'WI'};
const ALIAS={'New York':'New York City','St. Louis':'St. Louis','St. Paul':'Saint Paul','St. Petersburg':'St. Petersburg','Washington, D.C.':'Washington','Mayfield Village':'Mayfield'};
const norm=s=>s.toLowerCase().replace(/^saint /,'st. ').replace(/^st /,'st. ');
const rows=require('fs').readFileSync('f500.txt','utf8').trim().split('\n').map(l=>l.split('|'));
const out=[],miss=[];
for(const [r,name,city,state] of rows){const sc=ST[state]; if(!sc){miss.push([r,city,state,'nostate']);continue}
 const q=norm(ALIAS[city]||city); const m=c.filter(x=>x.adminCode===sc&&(norm(x.name)===q||norm(x.altName||'')===q)).sort((a,b)=>b.population-a.population);
 if(!m.length){miss.push([r,name,city,state]);continue}
 out.push({r:+r,name,city,st:sc,lon:+m[0].loc.coordinates[0].toFixed(3),lat:+m[0].loc.coordinates[1].toFixed(3),n:m.length});}
require('fs').writeFileSync('geo.json',JSON.stringify(out));console.log(out.length,miss);
console.log(out.filter(o=>o.n>1).map(o=>o.city+','+o.st+':'+o.n).filter((v,i,a)=>a.indexOf(v)===i).join(' '));
