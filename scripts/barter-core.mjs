// Barter shared engine: word pools, lattice fill, exact minimum-trade par, and
// the uniqueness check. Imported by BOTH scripts/gen-barter.mjs (bank
// generation) and scripts/verify-barter.mjs (the shipping gate), so the two
// can never disagree on what a legal board is.
//
//   - Solution words: intersection of the common band of app/warmer/vocab.js
//     (top 20,000 by frequency) and public/crux-words.txt, minus the British
//     spelling, proper-noun and unsavory blocklists below. US spellings only.
//   - Par: the exact minimum number of two-tile trades from start to sol.
//     Misplaced tiles form a letter multigraph (edge cur->target per misplaced
//     tile); min trades = misplaced - max cycle decomposition. All 2-cycles are
//     stripped first (provably safe by an exchange argument), then the residual
//     is searched exactly with memoization; a scramble whose bounded search
//     blows its node budget is simply rejected at generation time.
//   - Uniqueness: every lattice admits its TRANSPOSE (same words, mirrored),
//     so the standard is unique-up-to-transposition against the common pool.
//     The in-game feedback is computed against the authored grid, so the
//     transpose reads as visibly wrong on the board.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

export const BASE = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- word pools ----
const BRITISH = new Set(['fibre','litre','metre','moult','ochre','tyred','pyjam',
  'flavour','harbour','saviour','candour','parlour','enquiry','enquire','defence','offence','licence','theatre','centred','coloured','honours','analyse','realise','cheques','dialled','fuelled','grammes','armoury','draught',
  // added 2026-08 during the Sep-Nov bank extension
  'aunty','brill','calibre','croft','footy','lorry','mould','netball','sabre','spectre','spelt','sulphur'
]);
const NAMES = new Set(['venus','hurst','cowan','dolce','dolci','cohan','rowan','nolte','marlo','carlo','pesto','kraft','kirby','mater','telly','wight','reddy','intra','nelly','mitch','monte','riley','merle','tyler','kylie','tesla','bantu','tonga','braille','riviera','kyrie','levin','waldo','ollie','dylan','logan','mason','ethan','aaron','caleb','chloe','derek','dixie','elias','elton','erica','fiona','gavin','greta','haley','heidi','jacob','jamie','jared','jenna','jesse','joyce','julia','julie','katie','kayla','keith','kerry','leigh','louie','louis','lucia','mabel','mandy','marge','mario','marla','megan','micah','mindy','moira','nadia','naomi','nigel','nolan','paige','pablo','percy','perry','quinn','ramon','reese','renee','rocco','rosie','rufus','sadie','scott','shawn','sonia','sonny','stella','tessa','tonya','trent','vince','wanda','wayne','zelda','eliza','ethel','edith','agnes','doris','flora','hilda','marta','boris','pierre','andre','ivanka','deidre','bianca','camila','carmen','claire','damian','darren','dmitri','duncan','dustin','gloria','hannah','harold','hector','horace','ingrid','isabel','joanna','jordan','joseph','joshua','judith','justin','lauren','leslie','lionel','lorena','marcus','marion','martin','melvin','miriam','morgan','nathan','nelson','norman','olivia','philip','rachel','ramona','robert','roland','ronald','samuel','sandra','sergio','sharon','shelby','sherry','sidney','silvia','sophia','stacey','stuart','sylvia','tamara','teresa','thomas','travis','trisha','ursula','valery','verona','victor','walter','warren','wesley','xavier','yvette','harry','peggy','norma','donny','bobby','billy','sarah','laura','maria','karen','kevin','jason','susan','nancy','brian','roger','terry','jerry','larry','henry','ralph','edgar','diane','linda','betty','carol','debra','donna','emily','ellen','helen','irene','janet','jenny','jimmy','kathy','kelly','kenny','lewis','lloyd','lucas','marty','mikey','molly','nikki','paula','randy','ricky','robin','sally','sandy','shane','stacy','steve','tammy','tanya','teddy','tommy','tracy','vicki','wanda','wendy','angus','argus','david','james','peter','simon','felix','oscar','elena','maya','anna','clara','marco','pedro','diego','carlos','miguel','johnny','freddy','danny','eddie','ozzie','lonnie','ronnie','connie','bonnie','vinnie','willie','albert','arthur','andrew','anthony','barbara','bernard','bradley','brandon','cameron','charles','chelsea','crystal','cynthia','deborah','dolores','douglas','earnest','eleanor','estelle','eugenia','frances','francis','gabriel','georgia','gilbert','gregory','heather','herbert','jasmine','jessica','joachim','jocelyn','johanna','juanita','katrina','kenneth','kristen','lindsay','lorenzo','lucille','malcolm','margery','marissa','martina','matthew','maxwell','melanie','melissa','michael','mildred','miranda','natalie','natasha','nicolas','octavia','orlando','pauline','phyllis','quentin','ramirez','raymond','rebecca','ricardo','richard','roberta','roberto','rodney','rosalie','russell','santiago','shannon','sheldon','shirley','stanley','stephen','stewart','tabitha','theresa','timothy','tristan','vanessa','vincent','wallace','whitney','william','winston','yolanda','zachary','antonio','abraham','barnaby','beatrix','bridget','carmelo','cecilia','clement','desmond','dominic','eduardo','emerson','ezekiel','fernand','gaspard','giselle','gustavo','horatio','ignacio','isabela','javier','joaquin','leandro','leonard','loretta','luciano','madison','marcelo','mariana','maurice','maximus','mckenna','nikolai','octavio','ophelia','patrick','preston','rafaela','ramona','rosanna','rosario','salvato','sampson','saundra','serrano','sheridan','solomon','stefano','tatiana','terrell','thaddeus','ulysses','valeria','vicente','virgil','wilbert','wilfred','ximena','yasmine','yvonne','zackary',
  // added 2026-08 during the Sep-Nov bank extension: proper nouns, places and
  // brands the launch blocklists had not met yet.
  'abigail','alameda','alamo','alfredo','amman','arcadia','ariel','assam','banco','bangkok','baptist','barca','barry','bassett',
  'benny','bigfoot','bohemia','bolivia','bowie','brent','bristol','britt','brock','bubba','buffy','bundy','burgess','burke',
  'burrell','butch','calif','carrick','carte','celeste','chang','chapman','charley','charlie','chevy','chico','chile','chinese',
  'christy','cisco','clint','cohen','colby','colin','colleen','collier','coney','congo','conte','corey','corolla','costa',
  'coulter','craig','creme','crore','cupid','darcy','derry','devon','dickens','dover','draco','drake','dutch','english',
  'fedex','felicia','femme','firth','fitch','fleming','flemish','foley','forza','freeman','fritz','gabby','galilee','gangsta',
  'garth','gemma','genoa','germain','gestapo','goliath','goodman','granger','greek','hackney','hamburg','hayward','hogan','holland',
  'honda','hotspur','india','intel','jackman','japan','johnnie','johnson','jones','judas','kashmir','khalifa','kremlin','lacey',
  'laird','lambert','langley','leone','liang','linux','lohan','lowry','lucifer','macon','madonna','mahatma','malik','maltese',
  'mamma','martian','masonic','massa','masse','matilda','mayan','mecca','missy','monde','monty','morales','morocco','morse',
  'munster','myspace','niger','nirvana','nouveau','paddy','paisley','pandora','paolo','pasha','pegasus','petit','pollard','polly',
  'portman','pratt','prima','proto','pullman','redding','rhine','richter','roman','romeo','rubin','sabha','sahib','salle',
  'sammy','santo','savoy','scala','seine','shiva','siemens','silva','slade','sloan','spain','spencer','spiegel','starr',
  'sumatra','supra','swede','sweeney','swiss','taser','templar','terra','texas','tiffany','torah','trinity','tripoli','trump',
  'twain','twitter','wally','weber','webster','welch','welsh','wigan'
]);
const NASTY = new Set(['thong','pubic','bitch','whore','penis','vulva','fecal','rapes','raped','nazis','negro','moron','idiot','bimbo','queer','vagina','nipple','orgasm','rectum','erotic','sexual','faeces','feces','urine','vomit','crotch','panties','condom','aroused','shitty','pissed',
  // added 2026-08 during the Sep-Nov bank extension
  'jackass','pervert','pooping','redneck','scumbag','suicide'
]);

// Fragments and bound forms that are not plain standalone English words.
const NOTWORDS = new Set(['avant','takin',
  // Dec restock (2026-11-12): slang and a Britishism the December draw surfaced
  'homie','dodgy','gonna','leafs','batsman','groin','bosom','dumbest','bigot','harem',
  'lesbian','fetus','filth','latex','bling','patsy','droid','thong','rabbi','tonne','tramp',
  // whole-pool read, 2026-11-12: names, slang, Britishisms, religion, drugs,
  // bodily and violent words a breakfast-table word game should not deal
  'bible','bloke','booty','booze','bowel','drunk','fella','gimme','gypsy','hijab','homer','jihad',
  'junta','lynch','mafia','momma','mommy','mucus','naked','pagan','potty','sissy','slave','spank',
  'sperm','swine','sorta','wanna','anglo','lupus','palsy','polio','chemo','papal','padre','shire',
  'pence','hubby','felon','fiend','sheik','cocky','haute','cabal',
  'abusing','abusive','alimony','anthrax','arousal','atheism','autopsy','bigoted','bigotry','bipolar',
  'bladder','bologna','brothel','bullock','cocaine','cholera','cyanide','drugged','drunken','ecstasy',
  'fascism','fascist','genital','heathen','killing','lunatic','measles','messiah','obscene','ovarian',
  'puberty','satanic','seduced','sensual','sexiest','slavery','stabbed','steroid','syringe','uterine',
  'urinary','warhead','pollock','griffin','marquis','sabbath','gentile','diocese','liturgy','googled',
  'handgun','shotgun','gunshot','gunfire','firearm','carnage','torture','wannabe','bonkers','manhunt']);

export async function loadPools() {
  const dict = readFileSync(join(BASE, 'public/crux-words.txt'), 'utf8').split('\n').map(w=>w.trim()).filter(Boolean);
  const full5 = new Set(dict.filter(w=>w.length===5));
  const full7 = new Set(dict.filter(w=>w.length===7));
  const { VOCAB: arr } = await import(pathToFileURL(join(BASE, 'app/warmer/vocab.js')).href);
  const ok = (w) => !BRITISH.has(w) && !NASTY.has(w) && !NAMES.has(w) && !NOTWORDS.has(w);
  const common5 = arr.slice(0,20000).filter(w=>/^[a-z]{5}$/.test(w) && full5.has(w) && ok(w));
  const common7 = arr.slice(0,20000).filter(w=>/^[a-z]{7}$/.test(w) && full7.has(w) && ok(w));
  return { full5:[...full5], full7:[...full7], common5, common7 };
}

// ---- lattice helpers ----
// size S (5 or 7). Cells (r,c); holes where r odd AND c odd. Word rows at even r, word cols at even c.
export function latticeCells(S) {
  const cells = [];
  for (let r=0;r<S;r++) for (let c=0;c<S;c++) if (!(r%2===1 && c%2===1)) cells.push([r,c]);
  return cells;
}
export function gridWords(grid, S) { // grid: array of S strings ('.' holes)
  const words = [];
  for (let r=0;r<S;r+=2) words.push(grid[r]);
  for (let c=0;c<S;c+=2) { let w=''; for (let r=0;r<S;r++) w += grid[r][c]; words.push(w); }
  return words;
}
export function buildGrid(rows, cols, S) { // rows: words at even r; cols at even c
  const g = Array.from({length:S},()=>Array(S).fill('.'));
  rows.forEach((w,i)=>{ for(let c=0;c<S;c++) g[i*2][c]=w[c]; });
  cols.forEach((w,i)=>{ for(let r=0;r<S;r++) g[r][i*2]=w[r]; });
  return g.map(r=>r.join(''));
}

// ---- generation: fill a lattice from a pool ----
function idx1(pool) { // byPosLetter[pos][letter] -> array
  const m = {};
  for (const w of pool) for (let p=0;p<w.length;p++) {
    (m[p] ||= {}); (m[p][w[p]] ||= []).push(w);
  }
  return m;
}
function shuffled(a, rnd) { const b=a.slice(); for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }

export function makeRng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Fill: returns { rows, cols } of words or null. S=5: 3 rows x 3 cols; S=7: 4x4.
export function fillLattice(pool, S, rnd, banned) {
  const K = (S+1)/2; // words per direction: 3 or 4
  const by = idx1(pool);
  const evens = []; for (let r=0;r<S;r+=2) evens.push(r);
  const poolShuf = shuffled(pool, rnd);
  for (const r0 of poolShuf) {
    if (banned.has(r0)) continue;
    // choose columns: col i (at c=2i) must have w[0] === r0[2i]
    const colCand = evens.map((c) => shuffled((by[0][r0[c]]||[]).filter(w=>!banned.has(w) && w!==r0), rnd));
    if (colCand.some(l=>!l.length)) continue;
    const res = pickCols(colCand, 0, [], r0);
    if (res) return res;
  }
  return null;

  function rowCandidates(cols, r) { // r = even row index >=2; cols chosen so far (maybe partial: only used when complete)
    // pattern positions: at col 2i must equal cols[i][r]
    let list = by[0][cols[0][r]] || [];
    const out = [];
    for (const w of list) {
      let okw = true;
      for (let i=1;i<cols.length;i++) if (w[2*i] !== cols[i][r]) { okw=false; break; }
      if (okw) out.push(w);
    }
    return out;
  }
  function pickCols(colCand, i, chosen, r0) {
    if (i === K) {
      // now rows 2..S-1 even
      const used = new Set([r0, ...chosen]);
      const rowsRest = [];
      for (let r=2;r<S;r+=2) {
        const cand = shuffled(rowCandidates(chosen, r), rnd).filter(w=>!used.has(w) && !banned.has(w));
        if (!cand.length) return null;
        rowsRest.push(cand);
      }
      // choose rows ensuring distinctness
      const picked = [];
      function pickRow(j) {
        if (j === rowsRest.length) return true;
        for (const w of rowsRest[j]) {
          if (picked.includes(w)) continue;
          picked.push(w);
          if (pickRow(j+1)) return true;
          picked.pop();
        }
        return false;
      }
      if (!pickRow(0)) return null;
      return { rows: [r0, ...picked], cols: chosen };
    }
    let tried = 0;
    for (const w of colCand[i]) {
      if (chosen.includes(w) || w === r0) continue;
      if (++tried > 40) break;
      chosen.push(w);
      // prune: every later row must still have a candidate on the prefix of chosen cols
      let feasible = true;
      for (let r=2;r<S && feasible;r+=2) {
        const cand = rowCandidates(chosen, r);
        if (!cand.length) feasible = false;
      }
      if (feasible) {
        const res = pickCols(colCand, i+1, chosen, r0);
        if (res) return res;
      }
      chosen.pop();
    }
    return null;
  }
}

// ---- exact minimum swaps (multiset) ----
// Returns { par, exact } — par is exact when exact===true; a scramble whose
// bounded search blows the node budget returns exact:false and is rejected.
export function minSwaps(cur, target) {
  const edges = [];
  for (let i=0;i<cur.length;i++) if (cur[i] !== target[i]) edges.push(cur[i]+target[i]);
  const n = edges.length;
  if (!n) return { par: 0, exact: true };
  // strip 2-cycles (provably safe by the exchange argument)
  const count = new Map();
  for (const e of edges) count.set(e, (count.get(e)||0)+1);
  let cycles = 0;
  for (const [e,k] of [...count]) {
    const rev = e[1]+e[0];
    if (e < rev && count.has(rev)) {
      const m = Math.min(k, count.get(rev));
      cycles += m;
      count.set(e, k-m); count.set(rev, count.get(rev)-m);
    }
  }
  const rest = [];
  for (const [e,k] of count) for (let i=0;i<k;i++) if (k>0) rest.push(e);
  const ub = Math.floor(rest.length/3);           // residual has no 2-cycles
  const greedy = greedyCycles(rest);
  if (greedy === ub) return { par: n - (cycles + greedy), exact: true };
  const budget = { nodes: 300000, blown: false };
  const memo = new Map();
  const best = maxCyclesExact(rest, memo, budget);
  if (budget.blown) return { par: n - (cycles + greedy), exact: false };
  return { par: n - (cycles + best), exact: true };
}

function findCycle(edges) { // shortest simple cycle in the multigraph, as index list
  // BFS from each edge over remaining edges
  for (let L=3; L<=edges.length; L++) {
    const found = dfsLen(edges, L);
    if (found) return found;
  }
  return null;
}
function dfsLen(edges, L) {
  const first = 0;
  const [a0,b0] = [edges[0][0], edges[0][1]];
  const used = [0];
  const seen = new Set([b0]);
  function walk(node, depth) {
    if (depth === L) return node === a0 ? used.slice() : null;
    for (let i=1;i<edges.length;i++) {
      if (used.includes(i)) continue;
      if (edges[i][0] !== node) continue;
      const to = edges[i][1];
      if (to !== a0 && seen.has(to)) continue;
      if (to === a0 && depth+1 !== L) continue;
      used.push(i); seen.add(to);
      const r = walk(to, depth+1);
      if (r) return r;
      used.pop(); seen.delete(to);
    }
    return null;
  }
  return walk(b0, 1);
}
function greedyCycles(edges) {
  let es = edges.slice(), k = 0;
  while (es.length >= 3) {
    const cyc = findCycle(es);
    if (!cyc) break;
    es = es.filter((_,i)=>!cyc.includes(i));
    k++;
  }
  return k;
}
function maxCyclesExact(edges, memo, budget) {
  if (edges.length < 3) return 0;
  if (budget.nodes-- <= 0) { budget.blown = true; return 0; }
  const sorted = edges.slice().sort();
  const key = sorted.join(',');
  if (memo.has(key)) return memo.get(key);
  const first = sorted[0];
  const rem = sorted.slice(1);
  let best = 0;
  const usedIdx = new Set();
  const seen = new Set([first[1]]);
  function walk(node) {
    if (budget.blown) return;
    if (node === first[0]) {
      const left = rem.filter((_,i)=>!usedIdx.has(i));
      const sub = 1 + maxCyclesExact(left, memo, budget);
      if (sub > best) best = sub;
      return;
    }
    for (let i=0;i<rem.length;i++) {
      if (usedIdx.has(i)) continue;
      if (rem[i][0] !== node) continue;
      const to = rem[i][1];
      if (to !== first[0] && seen.has(to)) continue;
      usedIdx.add(i); seen.add(to);
      walk(to);
      usedIdx.delete(i); seen.delete(to);
    }
  }
  walk(first[1]);
  // The first edge always lies on some cycle (balanced degrees), so best>=1 unless budget blew.
  memo.set(key, best);
  return best;
}

// ---- uniqueness: enumerate fillings of the lattice with EXACTLY this tile multiset,
// all words from `dict`. Returns up to `cap` solution grids. Every lattice admits its
// TRANSPOSE (same words, rows and columns swapped), so the acceptance test is
// "solutions === {sol, transpose(sol)}" — unique up to transposition. The in-game
// green/yellow feedback is computed against the authored target, so the transpose
// (and anything else) reads as visibly wrong; this check exists so no OTHER
// common-word arrangement of the same tiles fills the lattice.
export function transposeGrid(grid) {
  const S = grid.length;
  const out = [];
  for (let c=0;c<S;c++) { let w=''; for (let r=0;r<S;r++) w += grid[r][c]; out.push(w); }
  return out;
}
// `budget` is OPTIONAL and generation-only: pass { nodes: N } and the search
// gives up after N nodes, setting budget.blown. A blown search is REJECTED by
// uniqueUpToTranspose (never accepted), so the budget can only ever narrow the
// set of boards that ship — it never lets an unproven board through. The
// verifier passes no budget, so its proof stays exact and unbounded.
export function enumerateSolutions(sol, S, dict, cap=3, budget=null) {
  const K = (S+1)/2;
  const tiles = {};
  for (const [r,c] of latticeCells(S)) tiles[sol[r][c]] = (tiles[sol[r][c]]||0)+1;
  const pool = dict.filter(w=>{ for (const ch of w) if (!tiles[ch]) return false; return true; });
  const by = {};
  for (const w of pool) { (by[w[0]] ||= []).push(w); }
  // cross-prefix indexes over EVEN positions: prefix of (w[0], w[2], ..., w[2j]) for rows
  const crossSets = Array.from({length:K+1},()=>new Set());
  const rowsByCross = new Map();
  for (const w of pool) {
    let k='';
    for (let j=0;j<K;j++) { k += w[2*j]; crossSets[j+1].add(k); }
    const arr = rowsByCross.get(k); if (arr) arr.push(w); else rowsByCross.set(k, [w]);
  }
  const avail = { ...tiles };
  function takeStr(str) {
    const need = {};
    for (const ch of str) need[ch]=(need[ch]||0)+1;
    for (const ch in need) if ((avail[ch]||0)<need[ch]) return false;
    for (const ch in need) avail[ch]-=need[ch];
    return true;
  }
  function giveStr(str) { for (const ch of str) avail[ch]++; }
  const colsPicked=[];
  const found=[];
  function oddOf(w) { let s=''; for (let i=1;i<w.length;i+=2) s+=w[i]; return s; }
  function spend() { if (!budget) return false; if (budget.blown) return true; if (--budget.nodes <= 0) { budget.blown = true; return true; } return false; }
  function goRow(j, rowsAcc) {
    if (found.length>=cap) return;
    if (spend()) return;
    if (j===K) { found.push(buildGrid(rowsAcc, colsPicked.slice(), S)); return; }
    const r=j*2;
    let ck='';
    for (let i=0;i<K;i++) ck += colsPicked[i][r];
    for (const w of (rowsByCross.get(ck)||[])) {
      if (!takeStr(w)) continue;
      rowsAcc.push(w);
      goRow(j+1, rowsAcc);
      rowsAcc.pop();
      giveStr(w);
      if (found.length>=cap) return;
    }
  }
  function goCol(i, r0) {
    if (found.length>=cap) return;
    if (spend()) return;
    if (i===K) { goRow(1, [r0]); return; }
    for (const w of (by[r0[2*i]]||[])) {
      const odd = oddOf(w);
      if (!takeStr(odd)) continue;
      colsPicked.push(w);
      // prune: every later row's cross-prefix over chosen cols must exist in the pool
      let feasible = true;
      for (let j=1;j<K && feasible;j++) {
        const r=j*2;
        let pk='';
        for (let x=0;x<colsPicked.length;x++) pk += colsPicked[x][r];
        if (!crossSets[colsPicked.length].has(pk)) feasible = false;
      }
      if (feasible) goCol(i+1, r0);
      colsPicked.pop();
      giveStr(odd);
      if (found.length>=cap) return;
    }
  }
  for (const r0 of pool) {
    if (spend()) break;
    if (!takeStr(r0)) continue;
    goCol(0, r0);
    giveStr(r0);
    if (found.length>=cap) break;
    if (budget && budget.blown) break;
  }
  return found;
}
// A board passes when the only fillings are the authored grid and its transpose.
export function uniqueUpToTranspose(sol, S, dict, budget=null) {
  const sols = enumerateSolutions(sol, S, dict, 3, budget);
  if (budget && budget.blown) return false; // unproven => rejected, never accepted
  const t = transposeGrid(sol);
  const key = (g)=>g.join('|');
  const set = new Set(sols.map(key));
  if (!set.has(key(sol))) return false; // sanity: must find itself
  for (const k of set) if (k !== key(sol) && k !== key(t)) return false;
  return sols.length <= 2;
}

export function clearMemo() {}
