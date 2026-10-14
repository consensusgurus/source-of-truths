// Verify the Swindle bank (White to play and draw).
//
//   node scripts/verify-swindle.mjs            full run
//   node scripts/verify-swindle.mjs --quick    skips the exhaustive half of the
//                                              book check (proving every move NOT
//                                              in a node throws the draw away) and
//                                              the drawIn minimality on boards of
//                                              drawIn 5 and up
//
// THIS FILE RECOMPUTES, IT DOES NOT TRUST. It imports nothing from
// lib/swindle-core.js, app/mate/chess.js or the generator: the chess here is a
// 10x12 mailbox written for this file (its own move generation, attack test,
// queen promotion, checkmate, stalemate, insufficient material and threefold
// repetition), with its own forced-mate search, its own draw search and its own
// copy of the defence, re-implemented from the rules stated in
// lib/swindle-core.js rather than lifted from it. Agreement with the bank is
// therefore two programs agreeing.
//
// WHAT IS CHECKED, per board
//   Shape      nums from 1, dates contiguous from 2026-10-14, quizId
//              (swindle-M-D-YY) and dateLabel from `live`, sunday exactly on
//              Sundays, every documented field present and in range.
//   Position   FEN White to move, castling '-', en passant '-', no pawn off
//              ranks 3 to 6 (so no double push, no en passant, ever), neither
//              king in check, Black up at least five points, Black threatening
//              mate in one. `legal` is White's legal move count and `decoys`
//              the losing first moves Black cannot mate in one.
//   Key        legal; keySan names it; the key draws within drawIn against
//              every Black defence, and not within drawIn - 1 (minimal).
//   Losing     every other first move is a forced mate within 3 Black moves.
//              No repetition can interfere: from the start position, whose
//              history is that one position, a third occurrence of anything
//              needs eight plies, and a mate in three after White's first move
//              is over in six.
//   Budget     drawIn + 2 when drawIn <= 3, drawIn + 1 above.
//   Book       re-derived node by node: the root holds the key alone; at every
//              White-to-move node the stored moves are EXACTLY the moves that
//              keep a draw inside the budget; every stored reply is the
//              defence's reply (this file's own copy of it); every stored end
//              is a real end.
//   Line       the principal line re-derived from the book (the holding move
//              that draws soonest, then the lowest UCI) equals `line`, ends in
//              a draw inside the budget, and `theme` names that draw.
//   Defence    replayed from every losing first move against White's longest
//              resistance, it collects the mate within 3 Black moves.
//   Bank       no position twice; weekday ramp on drawIn (Mon 1, Tue 1-2,
//              Wed 2, Thu 2-3, Fri 3-4, Sat 4-5, Sunday 5 up and never below
//              that week's deepest weekday); no theme over 60% of the bank.
//
// Mutation-tested by scripts/swindle-mutation-test.mjs (set VERIFY_SWINDLE_BANK
// to point this file at a mutated copy).
const BANK = process.env.VERIFY_SWINDLE_BANK
  ? `file://${process.env.VERIFY_SWINDLE_BANK}`
  : new URL('../app/swindle/puzzles.js', import.meta.url).href;
const { PUZZLES } = await import(BANK);
const QUICK = process.argv.includes('--quick');
// VERIFY_SWINDLE_ONLY=3,17 runs the searches on those boards only (the shape
// and bank-wide checks still cover every board). The mutation test uses it to
// stay fast; a normal run never sets it.
const ONLY = process.env.VERIFY_SWINDLE_ONLY ? new Set(process.env.VERIFY_SWINDLE_ONLY.split(',').map(Number)) : null;

let BAD = 0;
const fail = (id, msg) => { BAD++; console.error(`FAIL ${id}: ${msg}`); };

// ─── the board: 10x12 mailbox, '#' off the board, '.' empty ────────────────
const OFFB = '#';
const mb = (i) => 21 + (i >> 3) * 10 + (i & 7);
const sqIdx = (m) => (Math.floor(m / 10) - 2) * 8 + (m % 10 - 1);
const nameOf = (m) => String.fromCharCode(97 + (m % 10 - 1)) + String(10 - Math.floor(m / 10));
const isW = (p) => p >= 'A' && p <= 'Z';
const isB = (p) => p >= 'a' && p <= 'z';
const KN = [-21, -19, -12, -8, 8, 12, 19, 21];
const KG = [-11, -10, -9, -1, 1, 9, 10, 11];
const RK = [-10, -1, 1, 10];
const BS = [-11, -9, 9, 11];

function fromFen(fen) {
  const [place, side, castle, ep] = fen.split(' ');
  const b = new Array(120).fill(OFFB);
  for (let i = 0; i < 64; i++) b[mb(i)] = '.';
  let i = 0;
  for (const ch of place) {
    if (ch === '/') continue;
    if (ch >= '1' && ch <= '8') i += Number(ch); else b[mb(i++)] = ch;
  }
  return { b, side, castle, ep, count: i };
}
function attacked(b, sq, byWhite) {
  const own = byWhite ? isW : isB;
  const P = byWhite ? 'P' : 'p', N = byWhite ? 'N' : 'n', K = byWhite ? 'K' : 'k';
  const B = byWhite ? 'B' : 'b', R = byWhite ? 'R' : 'r', Q = byWhite ? 'Q' : 'q';
  // a white pawn attacks up the board, so it sits below the square
  if (byWhite) { if (b[sq + 9] === P || b[sq + 11] === P) return true; }
  else if (b[sq - 9] === P || b[sq - 11] === P) return true;
  for (const d of KN) if (b[sq + d] === N) return true;
  for (const d of KG) if (b[sq + d] === K) return true;
  for (const d of RK) { let t = sq + d; while (b[t] === '.') t += d; if (b[t] === R || b[t] === Q) return true; }
  for (const d of BS) { let t = sq + d; while (b[t] === '.') t += d; if (b[t] === B || b[t] === Q) return true; }
  void own;
  return false;
}
const kingAt = (b, white) => b.indexOf(white ? 'K' : 'k');
const checked = (b, white) => attacked(b, kingAt(b, white), !white);
function pseudo(b, white) {
  const own = white ? isW : isB, foe = white ? isB : isW;
  const out = [];
  for (let s = 21; s <= 98; s++) {
    const p = b[s];
    if (p === '.' || p === OFFB || !own(p)) continue;
    const k = p.toUpperCase();
    if (k === 'P') {
      const f = white ? -10 : 10;
      if (b[s + f] === '.') out.push([s, s + f]);
      for (const c of [f - 1, f + 1]) if (b[s + c] !== OFFB && b[s + c] !== '.' && foe(b[s + c])) out.push([s, s + c]);
    } else if (k === 'N' || k === 'K') {
      for (const d of (k === 'N' ? KN : KG)) { const t = s + d; if (b[t] === OFFB) continue; if (b[t] === '.' || foe(b[t])) out.push([s, t]); }
    } else {
      const dirs = k === 'R' ? RK : k === 'B' ? BS : RK.concat(BS);
      for (const d of dirs) {
        let t = s + d;
        while (b[t] === '.') { out.push([s, t]); t += d; }
        if (b[t] !== OFFB && foe(b[t])) out.push([s, t]);
      }
    }
  }
  return out;
}
function doMove(b, m) {
  const [f, t] = m;
  const u = { f, t, pf: b[f], pt: b[t] };
  b[t] = b[f]; b[f] = '.';
  if (b[t] === 'P' && t < 30) b[t] = 'Q';
  if (b[t] === 'p' && t > 90) b[t] = 'q';
  return u;
}
const undo = (b, u) => { b[u.f] = u.pf; b[u.t] = u.pt; };
function legal(b, white) {
  const out = [];
  for (const m of pseudo(b, white)) { const u = doMove(b, m); if (!checked(b, white)) out.push(m); undo(b, u); }
  return out;
}
const uciOf = (m) => nameOf(m[0]) + nameOf(m[1]);
const sortUci = (ms) => ms.map((m) => ({ m, u: uciOf(m) })).sort((x, y) => (x.u < y.u ? -1 : x.u > y.u ? 1 : 0));
function keyOf(b, white) { let k = ''; for (let i = 0; i < 64; i++) k += b[mb(i)]; return k + (white ? 'w' : 'b'); }
const irreversible = (u) => u.pt !== '.' || u.pf === 'P' || u.pf === 'p';
function deadMaterial(b) {
  let n = 0, minor = true;
  for (let s = 21; s <= 98; s++) { const p = b[s]; if (p === '.' || p === OFFB || p === 'K' || p === 'k') continue; n++; if (!'NnBb'.includes(p)) minor = false; }
  return n === 0 || (n === 1 && minor);
}
// The game's own order: no legal move first (mate or stalemate), then dead
// material, then the third occurrence.
function ending(b, white, hist) {
  if (!legal(b, white).length) return checked(b, white) ? 'mate' : 'stalemate';
  if (deadMaterial(b)) return 'material';
  const last = hist[hist.length - 1];
  let c = 0; for (const k of hist) if (k === last) c++;
  if (c >= 3) return 'repetition';
  return null;
}
const nextHist = (hist, u, b, whiteToMove) => (irreversible(u) ? [keyOf(b, whiteToMove)] : hist.concat([keyOf(b, whiteToMove)]));

// ─── forced mate (repetition not modelled, as stated above) ────────────────
function mateSearch() {
  const memo = new Map();
  function forces(b, white, n) {
    if (n <= 0) return false;
    const mk = keyOf(b, white) + n;
    if (memo.has(mk)) return memo.get(mk);
    let res = false;
    for (const m of legal(b, white)) {
      const u = doMove(b, m);
      const opp = legal(b, !white);
      if (!opp.length) { if (checked(b, !white)) res = true; }
      else if (n > 1) {
        let all = true;
        for (const r of opp) { const u2 = doMove(b, r); const ok = forces(b, white, n - 1); undo(b, u2); if (!ok) { all = false; break; } }
        if (all) res = true;
      }
      undo(b, u);
      if (res) break;
    }
    memo.set(mk, res);
    return res;
  }
  return forces;
}

// ─── the draw search ───────────────────────────────────────────────────────
// hold(b, hist, d): White to move; can White end the game in anything but its
// own loss (a draw, or mating Black, which the game counts as a save) within d
// more White moves against every Black reply? The memo keeps only the part of
// the history that could still matter: a position X can recur twice more only
// if each colour has enough moves to put its displaced pieces back, plus a
// two-move cycle per extra visit. Positions outside that reach cannot make a
// repetition inside the horizon, so the answer does not depend on them.
function drawSearch() {
  const memo = new Map();
  const mates = mateSearch();
  function reach(hist, d) {
    const cur = hist[hist.length - 1];
    const tally = new Map();
    for (const k of hist) tally.set(k, (tally.get(k) || 0) + 1);
    const keep = [];
    for (const [k, c] of tally) {
      if (k === cur) { if (2 * (3 - c) <= d) for (let i = 0; i < c; i++) keep.push(k); continue; }
      let w = 0, bl = 0;
      for (let i = 0; i < 64; i++) { const x = k[i]; if (x === '.' || x === cur[i]) continue; if (isW(x)) w++; else bl++; }
      const cyc = 2 * (2 - c);
      if (w + cyc <= d && bl + cyc <= d) for (let i = 0; i < c; i++) keep.push(k);
    }
    const out = keep.filter((k) => k !== cur);
    let cc = 0; for (const k of hist) if (k === cur) cc++;
    if (2 * (3 - cc) <= d) for (let i = 0; i < cc - 1; i++) out.push(cur);
    out.push(cur);
    return out;
  }
  function hold(b, hist0, d) {
    if (d <= 0) return false;
    const hist = reach(hist0, d);
    const mk = d + '#' + hist.slice().sort().join('|');
    if (memo.has(mk)) return memo.get(mk);
    let res = false;
    for (const m of legal(b, true)) {
      const u = doMove(b, m);
      const h1 = nextHist(hist, u, b, false);
      const e = ending(b, false, h1);
      let ok;
      if (e) ok = true;
      else {
        let rep = false; { const t = new Map(); for (const k of h1) { t.set(k, (t.get(k) || 0) + 1); if (t.get(k) > 1) rep = true; } }
        ok = !(!rep && mates(b, false, 1)) && answers(b, h1, d - 1);
      }
      undo(b, u);
      if (ok) { res = true; break; }
    }
    memo.set(mk, res);
    return res;
  }
  // Black to move: every reply ends it in a draw or leaves White holding within d
  function answers(b, hist, d) {
    for (const r of legal(b, false)) {
      const u = doMove(b, r);
      const h2 = nextHist(hist, u, b, true);
      const e = ending(b, true, h2);
      const ok = e === 'mate' ? false : e ? true : hold(b, h2, d);
      undo(b, u);
      if (!ok) return false;
    }
    return true;
  }
  return { hold, answers, mates };
}

// ─── the defence, re-implemented from its stated rules ─────────────────────
const VALS = { q: 9, r: 5, b: 3, n: 3, p: 1 };
function defence(b, hist, left, S) {
  const moves = sortUci(legal(b, false));
  for (let n = 1; n <= 3; n++) {
    if (!S.mates(b, false, n)) continue;
    for (const { m, u: uc } of moves) {
      const u = doMove(b, m);
      const opp = legal(b, true);
      let hit = false;
      if (!opp.length) hit = checked(b, true);
      else if (n > 1) {
        hit = true;
        for (const r of opp) { const u2 = doMove(b, r); const ok = S.mates(b, false, n - 1); undo(b, u2); if (!ok) { hit = false; break; } }
      }
      undo(b, u);
      if (hit) return { m, uci: uc, mateIn: n };
    }
  }
  const cap = Math.max(0, Math.min(left, 2));
  let best = null;
  for (const { m, u: uc } of moves) {
    const gain = VALS[(b[m[1]] || '').toLowerCase()] || 0;
    const u = doMove(b, m);
    const h = nextHist(hist, u, b, true);
    let score;
    if (ending(b, true, h)) score = 0;
    else {
      let wm = false;
      for (const w of legal(b, true)) { const u2 = doMove(b, w); if (!legal(b, false).length && checked(b, false)) wm = true; undo(b, u2); if (wm) break; }
      if (wm) score = -1;
      else { score = cap + 1; for (let d = 1; d <= cap; d++) if (S.hold(b, h, d)) { score = d; break; } }
    }
    undo(b, u);
    if (!best || score > best.score || (score === best.score && gain > best.gain)) best = { m, uci: uc, score, gain };
  }
  return best;
}

// ─── per board ─────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BANDS = { 1: [1, 1], 2: [1, 2], 3: [2, 2], 4: [2, 3], 5: [3, 4], 6: [4, 5], 0: [5, 99] };
const THEME = { stalemate: 'stalemate', material: 'material', repetition: 'perpetual' };
const budgetOf = (d) => d + (d <= 3 ? 2 : 1);
const seen = new Set();
const themes = { stalemate: 0, perpetual: 0, material: 0 };
const t0 = Date.now();
let expectT = Date.parse('2026-10-14T12:00:00Z');

for (let idx = 0; idx < PUZZLES.length; idx++) {
  const p = PUZZLES[idx];
  const id = `#${p.num} ${p.live}`;
  // shape
  if (p.num !== idx + 1) fail(id, `num ${p.num} should be ${idx + 1}`);
  const dt = new Date(expectT); expectT += 86400000;
  const iso = dt.toISOString().slice(0, 10);
  if (p.live !== iso) fail(id, `live should be ${iso}`);
  const [Y, M, D] = p.live.split('-').map(Number);
  if (p.quizId !== `swindle-${M}-${D}-${String(Y).slice(2)}`) fail(id, `quizId ${p.quizId}`);
  if (p.dateLabel !== `${MONTHS[M - 1]} ${D}, ${Y}`) fail(id, `dateLabel ${p.dateLabel}`);
  const dow = new Date(Date.UTC(Y, M - 1, D)).getUTCDay();
  if (p.sunday !== (dow === 0)) fail(id, `sunday flag ${p.sunday} on weekday ${dow}`);
  for (const f of ['fen', 'key', 'keySan', 'drawIn', 'budget', 'theme', 'legal', 'decoys', 'line', 'book']) if (p[f] === undefined) fail(id, `missing ${f}`);
  if (!Number.isInteger(p.drawIn) || p.drawIn < 1 || p.drawIn > 7) { fail(id, `drawIn ${p.drawIn} out of 1..7`); continue; }
  const [lo, hi] = BANDS[dow];
  if (p.drawIn < lo || p.drawIn > hi) fail(id, `drawIn ${p.drawIn} outside the weekday band ${lo}-${hi}`);
  if (p.budget !== budgetOf(p.drawIn)) fail(id, `budget ${p.budget} should be ${budgetOf(p.drawIn)}`);
  if (!['stalemate', 'perpetual', 'material'].includes(p.theme)) fail(id, `theme ${p.theme}`);
  if (ONLY && !ONLY.has(p.num)) {
    // shape only: count the stored theme, check the placement repeats
    if (themes[p.theme] !== undefined) themes[p.theme]++;
    const F0 = fromFen(String(p.fen));
    if (F0.count === 64) { const k0 = keyOf(F0.b, true); if (seen.has(k0)) fail(id, 'position repeats an earlier board'); seen.add(k0); }
    continue;
  }

  // position
  const F = fromFen(p.fen);
  if (F.count !== 64 || F.side !== 'w' || F.castle !== '-' || F.ep !== '-') { fail(id, `bad FEN ${p.fen}`); continue; }
  const b = F.b;
  const place = keyOf(b, true);
  if (seen.has(place)) fail(id, 'position repeats an earlier board');
  seen.add(place);
  let wMat = 0, bMat = 0;
  for (let i = 0; i < 64; i++) {
    const x = b[mb(i)];
    if ((x === 'P' || x === 'p') && ((i >> 3) < 2 || (i >> 3) > 5)) fail(id, `pawn on ${nameOf(mb(i))}: only ranks 3 to 6 are allowed`);
    if (x !== '.' && x !== 'K' && x !== 'k') { if (isW(x)) wMat += VALS[x.toLowerCase()]; else bMat += VALS[x]; }
  }
  if (bMat - wMat < 5) fail(id, `Black is up ${bMat - wMat}, not badly enough`);
  if (checked(b, true) || checked(b, false)) fail(id, 'a king starts in check');
  const S = drawSearch();
  if (!S.mates(b, false, 1)) fail(id, 'Black threatens no mate in one');
  const moves = sortUci(legal(b, true));
  if (moves.length !== p.legal) fail(id, `legal ${p.legal}, counted ${moves.length}`);
  const key = moves.find((x) => x.u === p.key);
  if (!key) { fail(id, `key ${p.key} is not legal`); continue; }
  if (!p.keySan.includes(nameOf(key.m[1])) || (b[key.m[0]] !== 'P' && !p.keySan.startsWith(b[key.m[0]]))) fail(id, `keySan ${p.keySan} does not name ${p.key}`);

  // losing first moves
  let decoys = 0;
  for (const { m, u: uc } of moves) {
    if (uc === p.key) continue;
    const u = doMove(b, m);
    if (!S.mates(b, false, 3)) fail(id, `${uc} is not a forced mate within 3`);
    if (!S.mates(b, false, 1)) decoys++;
    undo(b, u);
  }
  if (decoys !== p.decoys) fail(id, `decoys ${p.decoys}, counted ${decoys}`);

  // the key: a draw within drawIn, not within drawIn - 1
  const h0 = [place];
  {
    const u = doMove(b, key.m);
    const h1 = nextHist(h0, u, b, false);
    const e = ending(b, false, h1);
    if (e === 'mate') fail(id, 'the key mates: this is a win, not a draw');
    const within = (d) => (e ? true : S.answers(b, h1, d - 1));
    if (!within(p.drawIn)) fail(id, `key does not draw within ${p.drawIn}`);
    if (p.drawIn > 1 && (!QUICK || p.drawIn < 5) && within(p.drawIn - 1)) fail(id, `key draws within ${p.drawIn - 1}: drawIn is not minimal`);
    undo(b, u);
  }

  // the book
  const budget = p.budget;
  let nodes = 0;
  const walk = (node, hist, left, path) => {
    nodes++;
    if (!node || typeof node !== 'object' || Array.isArray(node)) { fail(id, `book node at ${path} is not an object`); return; }
    const want = new Set();
    for (const { m, u: uc } of sortUci(legal(b, true))) {
      const listed = Object.prototype.hasOwnProperty.call(node, uc);
      if (!listed && QUICK) continue;
      const u = doMove(b, m);
      const h1 = nextHist(hist, u, b, false);
      const e = ending(b, false, h1);
      const holds = e === 'mate' ? 'win' : e ? true : S.answers(b, h1, left - 1);
      if (holds === 'win') fail(id, `${path} ${uc} mates: White wins there`);
      if (holds) want.add(uc);
      if (holds && !listed) fail(id, `book at ${path || 'root'} misses holding move ${uc}`);
      if (!holds && listed) fail(id, `book at ${path || 'root'} lists ${uc}, which throws the draw away`);
      if (holds && listed) {
        const entry = node[uc];
        if (e) { if (entry !== 0) fail(id, `${path} ${uc} ends the game, entry should be 0`); }
        else if (!Array.isArray(entry) || !entry.length) fail(id, `${path} ${uc} entry malformed`);
        else {
          const def = defence(b, h1, left - 1, S);
          if (!def || def.uci !== entry[0]) fail(id, `${path} ${uc}: the defence plays ${def && def.uci}, the book says ${entry[0]}`);
          else {
            const u2 = doMove(b, def.m);
            const h2 = nextHist(h1, u2, b, true);
            const e2 = ending(b, true, h2);
            if (e2 === 'mate') fail(id, `${path} ${uc} ${def.uci} mates White on a holding line`);
            else if (e2) { if (entry.length !== 1) fail(id, `${path} ${uc} ${def.uci} ends the game, entry should stop there`); }
            else if (entry.length !== 2) fail(id, `${path} ${uc} ${def.uci} does not end the game, entry should continue`);
            else if (left - 1 <= 0) fail(id, `${path} ${uc}: the line runs past the budget`);
            else walk(entry[1], h2, left - 1, `${path} ${uc} ${def.uci}`.trim());
            undo(b, u2);
          }
        }
      }
      undo(b, u);
    }
    if (!want.size) fail(id, `book node at ${path} has no holding move`);
  };
  {
    // root: the key alone
    const rootKeys = Object.keys(p.book || {});
    if (rootKeys.length !== 1 || rootKeys[0] !== p.key) fail(id, `book root should hold the key alone, has ${rootKeys.join(',')}`);
    else {
      const u = doMove(b, key.m);
      const h1 = nextHist(h0, u, b, false);
      const e = ending(b, false, h1);
      const entry = p.book[p.key];
      if (e) { if (entry !== 0) fail(id, 'key ends the game, root entry should be 0'); }
      else {
        const def = defence(b, h1, budget - 1, S);
        if (!Array.isArray(entry) || def.uci !== entry[0]) fail(id, `root: the defence plays ${def.uci}, the book says ${entry && entry[0]}`);
        else {
          const u2 = doMove(b, def.m);
          const h2 = nextHist(h1, u2, b, true);
          const e2 = ending(b, true, h2);
          if (e2 === 'mate') fail(id, 'the defence mates after the key');
          else if (e2) { if (entry.length !== 1) fail(id, 'root reply ends the game, entry should stop'); }
          else if (entry.length !== 2) fail(id, 'root entry should continue');
          else walk(entry[1], h2, budget - 1, `${p.key} ${def.uci}`);
          undo(b, u2);
        }
      }
      undo(b, u);
    }
  }

  // the principal line, re-derived from the book
  {
    const line = [];
    const undos = [];
    let node = p.book, hist = h0, end = null, wMoves = 0;
    for (let guard = 0; guard < 40 && node && !end; guard++) {
      const left = budget - wMoves;
      let pick = null;
      for (let k = 0; k < left && !pick; k++) {
        for (const uc of Object.keys(node).sort()) {
          const mv = sortUci(legal(b, true)).find((x) => x.u === uc);
          if (!mv) continue;
          const u = doMove(b, mv.m);
          const h1 = nextHist(hist, u, b, false);
          const ok = node[uc] === 0 ? true : S.answers(b, h1, k);
          undo(b, u);
          if (ok) { pick = mv; break; }
        }
      }
      if (!pick) { fail(id, 'principal line: no book move draws inside the budget'); break; }
      const u = doMove(b, pick.m); undos.push(u); wMoves++;
      hist = nextHist(hist, u, b, false);
      line.push(pick.u);
      const entry = node[pick.u];
      if (entry === 0) { end = ending(b, false, hist); break; }
      const r = sortUci(legal(b, false)).find((x) => x.u === entry[0]);
      if (!r) { fail(id, `principal line: ${entry[0]} is not legal`); break; }
      const u2 = doMove(b, r.m); undos.push(u2);
      hist = nextHist(hist, u2, b, true);
      line.push(r.u);
      if (entry.length === 1) { end = ending(b, true, hist); break; }
      node = entry[1];
    }
    while (undos.length) undo(b, undos.pop());
    if (line.join(' ') !== (p.line || []).join(' ')) fail(id, `line should be ${line.join(' ')}`);
    if (!THEME[end]) fail(id, `principal line ends ${end}, not a draw`);
    else if (THEME[end] !== p.theme) fail(id, `theme ${p.theme}, the line ends in ${THEME[end]}`);
    if (wMoves > budget) fail(id, 'principal line runs past the budget');
    if (THEME[end]) themes[THEME[end]]++;
  }

  // the defence collects every losing first move
  for (const { m, u: uc } of moves) {
    if (uc === p.key) continue;
    const undos = [];
    let u = doMove(b, m); undos.push(u);
    let hist = nextHist(h0, u, b, false);
    let wMoves = 1, bMoves = 0, end = null;
    for (let guard = 0; guard < 20 && !end; guard++) {
      const def = defence(b, hist, budget - wMoves, S);
      if (!def || !def.mateIn) { end = 'no mate found'; break; }
      u = doMove(b, def.m); undos.push(u); bMoves++;
      hist = nextHist(hist, u, b, true);
      const e = ending(b, true, hist);
      if (e) { end = e; break; }
      let best = null;
      for (const w of sortUci(legal(b, true))) {
        const u2 = doMove(b, w.m);
        let n = 1; while (n <= 3 && !S.mates(b, false, n)) n++;
        undo(b, u2);
        if (!best || n > best.n) best = { w, n };
      }
      u = doMove(b, best.w.m); undos.push(u); wMoves++;
      hist = nextHist(hist, u, b, false);
      const e2 = ending(b, false, hist);
      if (e2) { end = 'White ' + e2; break; }
    }
    while (undos.length) undo(b, undos.pop());
    if (end !== 'mate' || bMoves > 3) fail(id, `after ${uc} the defence ends ${end} in ${bMoves} moves`);
  }
  if (Date.now() - t0 > 0 && idx % 10 === 9) process.stderr.write(`… ${idx + 1} boards, ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
}

// bank-wide
{
  const n = PUZZLES.length;
  for (const [t, c] of Object.entries(themes)) if (c > 0.6 * n) fail('bank', `theme ${t} is ${c} of ${n}, over 60%`);
  // Sunday is the deepest of its week
  for (let i = 0; i < n; i++) {
    const p = PUZZLES[i];
    if (!p.sunday) continue;
    const wk = PUZZLES.slice(Math.max(0, i - 6), i);
    const deepest = Math.max(0, ...wk.map((x) => x.drawIn));
    if (p.drawIn < deepest) fail(`#${p.num}`, `Sunday drawIn ${p.drawIn} below the week's ${deepest}`);
  }
  console.log(`swindle: ${n} boards, themes ${JSON.stringify(themes)}, ${((Date.now() - t0) / 1000).toFixed(1)}s${QUICK ? ' (quick)' : ''}`);
}
if (BAD) { console.error(`${BAD} FAILURE(S)`); process.exit(1); }
console.log('swindle: OK');
