// THE WALL: a mural's closing screen, and the first thing a returning player
// sees (owner, 2026-11-19: "should look something like the pastel full screens
// that we see for gauntlet animations and pages. and this will be immortalized.
// if a player returns to the puzzle via archive or shelf, they will see this
// first before clicking replay").
//
// One full screen on the category pastel, one dark ink, Manrope. The picture
// builds itself in the order the site placed it, each piece in its player's
// colour, then turns into the photograph. Beside it, Who Built It: one block a
// player, sized by the pieces they were first to place, guests in one block.
// Tap a block and the wall shows only that player's pieces.
//
// This file only DRAWS. engine.js decides when it opens, what the buttons do
// and what comes next. Plain DOM and canvas, like the engine.

const INK = '#08222e';
const GROUND = '#f1affb';          // Visual's step, softened: softGround('#e879f9')
const DARK_GROUND = '#0b0f1a';
const DARK_INK = '#e9edf4';
// The ramp without Visual's own magenta, which is the ground here.
const RAMP = ['#7dd3fc', '#6ee7b7', '#fbbf24', '#fb7185', '#a5b4fc', '#bef264', '#fb923c', '#c084fc', '#e8b43a'];

function mix(a, b, p) {
  const h = (s, i) => parseInt(s.slice(i, i + 2), 16);
  return '#' + [1, 3, 5].map((i) => Math.round(h(a, i) * (1 - p) + h(b, i) * p).toString(16).padStart(2, '0')).join('');
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (n) => Number(n || 0).toLocaleString('en-US');
const plural = (n, one, many) => (n === 1 ? one : many);

export const MEMORIAL_CSS = `
.mrl .fin.mwOn{background:var(--mw-bg);color:var(--mw-ink);overflow:hidden;animation:none}
.mrl .mw{--mw-bg:${GROUND};--mw-ink:${INK};--mw-card:color-mix(in srgb,#ffffff 46%,${GROUND});--mw-slot:color-mix(in srgb,#ffffff 30%,${GROUND});--mw-soft:color-mix(in srgb,${INK} 62%,${GROUND});
  position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;gap:12px;padding:12px max(20px,calc((100vw - 1480px)/2)) 14px;background:var(--mw-bg);color:var(--mw-ink);font-family:'Manrope',system-ui,sans-serif;overflow:hidden}
.mrl[data-theme='dark'] .mw{--mw-bg:${DARK_GROUND};--mw-ink:${DARK_INK};--mw-card:#161c29;--mw-slot:#131926;--mw-soft:#a3adbd}
.mrl .mw *{box-sizing:border-box}
.mrl .mw button{font-family:inherit;color:inherit}
.mrl .mwTop{display:flex;align-items:center;gap:18px;min-height:34px;flex:none}
.mrl .mwTop .sp{flex:1}
.mrl .mwHome{display:inline-flex;align-items:center;gap:7px;color:var(--mw-ink);text-decoration:none;font:800 15px/1.3 'Manrope',sans-serif;letter-spacing:-.01em}
.mrl .mwTxt{appearance:none;border:0;background:none;padding:6px 0;margin:0;cursor:pointer;color:var(--mw-ink);font:800 13.5px/1.3 'Manrope',sans-serif;text-decoration:none;white-space:nowrap}
.mrl .mwTxt:hover{text-decoration:underline;text-underline-offset:3px}
.mrl .mwHead{flex:none}
.mrl .mwEb{font:800 12px/1.5 'Manrope',sans-serif;letter-spacing:.14em;text-transform:uppercase}
.mrl .mwH{margin:2px 0 4px;font:800 clamp(30px,4.6vw,68px)/1.12 'Manrope',sans-serif;letter-spacing:-.035em;display:flex;flex-wrap:wrap;gap:0 .32em;padding-bottom:.06em}
.mrl .mwH span{display:inline-block;white-space:nowrap}
.mrl .mwLead{margin:0;max-width:980px;font:600 15.5px/1.5 'Manrope',sans-serif}
.mrl .mwMain{flex:1 1 auto;min-height:0;display:flex;gap:16px;align-items:flex-start}
.mrl .mwCol{display:flex;flex-direction:column;gap:8px;min-width:0}
.mrl .mwWall{position:relative;border:1px solid var(--mw-ink);border-radius:14px;overflow:hidden;background:var(--mw-slot);cursor:pointer}
.mrl .mwWall canvas{display:block;width:100%;height:100%}
.mrl .mwCount{position:absolute;left:10px;bottom:10px;padding:5px 11px;border:1px solid var(--mw-ink);border-radius:999px;background:var(--mw-bg);font:800 13px/1.3 'Manrope',sans-serif;font-variant-numeric:tabular-nums;min-width:15ch;text-align:center;transition:opacity .4s}
.mrl .mwCount.off{opacity:0;pointer-events:none}
.mrl .mwRow{display:flex;align-items:center;gap:8px 14px;min-height:34px;flex-wrap:wrap}
.mrl .mwCap{flex:1 1 200px;min-width:0;font:600 13px/1.45 'Manrope',sans-serif}
.mrl .mwCap b{font-weight:800}
.mrl .mwSeg{display:inline-flex;border:1px solid var(--mw-ink);border-radius:999px;overflow:hidden;flex:none}
.mrl .mwSeg button{appearance:none;border:0;border-radius:0;margin:0;background:transparent;padding:7px 14px;font:800 12.5px/1.3 'Manrope',sans-serif;cursor:pointer;white-space:nowrap}
.mrl .mwSeg button+button{border-left:1px solid var(--mw-ink)}
.mrl .mwSeg button.on{background:var(--mw-ink);color:var(--mw-bg)}
.mrl .mwTree{position:relative;overflow:hidden;border-radius:14px}
.mrl .mwTile{position:absolute;appearance:none;margin:0;padding:0;border:1px solid var(--mw-ink);border-radius:8px;overflow:hidden;cursor:pointer;text-align:left;color:${INK};transition:opacity .25s,transform .45s cubic-bezier(.2,1.3,.4,1)}
.mrl[data-theme='dark'] .mwTile{color:${DARK_INK}}
.mrl .mwTile.sm{border-radius:4px}
.mrl .mwTile.me{border-width:3px}
.mrl .mwTile i{position:absolute;left:0;top:0;right:0;display:block;font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:800;line-height:1.3;letter-spacing:-.01em}
.mrl .mwTile em{position:absolute;left:0;right:0;display:block;font-style:normal;white-space:nowrap;overflow:hidden;font-weight:700;line-height:1.3;font-variant-numeric:tabular-nums}
.mrl .mwTip{position:fixed;z-index:9;left:0;top:0;max-width:300px;pointer-events:none;border:1px solid var(--mw-ink);border-radius:12px;background:var(--mw-ink);color:var(--mw-bg);padding:9px 13px 10px;font:600 13px/1.45 'Manrope',sans-serif;opacity:0;transition:opacity .12s}
.mrl .mwTip.on{opacity:1}
.mrl .mwTip b{display:block;font:800 17px/1.3 'Manrope',sans-serif;letter-spacing:-.01em;overflow-wrap:anywhere}
.mrl .mwTip span{display:block;font-variant-numeric:tabular-nums}
.mrl .mwTree.dim .mwTile{opacity:.32}
.mrl .mwTree.dim .mwTile.hl{opacity:1}
.mrl .mwFoot{flex:none;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.9fr) minmax(0,1.1fr);gap:16px;align-items:stretch}
.mrl .mwCard{border:1px solid var(--mw-ink);border-radius:14px;background:var(--mw-card);padding:10px 14px 12px;min-width:0}
.mrl .mwCard h4{margin:0 0 6px;font:800 11.5px/1.5 'Manrope',sans-serif;letter-spacing:.14em;text-transform:uppercase;display:flex;align-items:center;gap:10px}
.mrl .mwCard h4 .sp{flex:1}
.mrl .mwCard h4 .mwTxt{letter-spacing:0;text-transform:none;padding:0;font-size:12.5px;text-decoration:underline;text-underline-offset:3px}
.mrl .mwStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.mrl .mwStats b{display:block;font:800 clamp(20px,2vw,30px)/1.2 'Manrope',sans-serif;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap}
.mrl .mwStats span{display:block;font:700 11.5px/1.4 'Manrope',sans-serif}
.mrl .mwNone{margin:0;font:600 14px/1.5 'Manrope',sans-serif}
.mrl .mwPts{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:1px 18px}
.mrl .mwPts li{display:flex;gap:8px;align-items:baseline;font:700 13.5px/1.55 'Manrope',sans-serif;min-width:0}
.mrl .mwPts li.me{font-weight:800}
.mrl .mwPts .r{flex:none;width:1.4em;font-variant-numeric:tabular-nums}
.mrl .mwPts .n{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mrl .mwPts .p{flex:none;font-variant-numeric:tabular-nums}
.mrl .mwActs{display:flex;flex-direction:column;gap:8px;justify-content:center;min-width:0}
.mrl .mwGo{appearance:none;display:block;width:100%;border:1px solid var(--mw-ink);background:var(--mw-ink);color:var(--mw-bg) !important;border-radius:999px;padding:14px 18px;font:800 16px/1.25 'Manrope',sans-serif;text-align:center;text-decoration:none;cursor:pointer}
.mrl .mwSub{margin:0;font:600 12.5px/1.45 'Manrope',sans-serif;text-align:center}
.mrl .mwAlt{display:flex;flex-wrap:wrap;gap:8px}
.mrl .mwAlt .mwBtn{appearance:none;flex:1 1 auto;border:1px solid var(--mw-ink);background:var(--mw-card);color:var(--mw-ink);border-radius:999px;padding:10px 16px;font:800 13.5px/1.25 'Manrope',sans-serif;text-align:center;text-decoration:none;cursor:pointer;white-space:nowrap}
.mrl .mwNext{font:700 13.5px/1.45 'Manrope',sans-serif;text-align:center}
.mrl .mwNext p{margin:0}
.mrl .mwNext .mwGo{margin-top:6px}
.mrl .mwCredit{flex:none;margin:0;font:500 11.5px/1.4 'Manrope',sans-serif;color:var(--mw-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mrl .mwSweep{position:absolute;inset:0;z-index:5;pointer-events:none;display:flex;flex-direction:column}
.mrl .mwSweep i{flex:1;display:block;transform:translateX(0);animation:mwBand .7s cubic-bezier(.7,0,.2,1) both}
@keyframes mwBand{to{transform:translateX(101%)}}
.mrl .mw .rise{opacity:0;transform:translateY(14px);transition:opacity .5s ease-out,transform .6s cubic-bezier(.2,.8,.2,1)}
.mrl .mw.in .mwTop.rise,.mrl .mw.in .mwHead.rise,.mrl .mw.in .mwWallCol.rise,.mrl .mw.in .mwTreeCol.rise{opacity:1;transform:none}
.mrl .mw.in .mwTreeCol.rise{transition-delay:.5s}
.mrl .mw.in .mwHead.rise{transition-delay:.12s}
.mrl .mw.in .mwWallCol.rise{transition-delay:.24s}
.mrl .mw.done .rise{opacity:1;transform:none}
.mrl .mw.done .mwFoot.rise{transition-delay:.25s}
.mrl .mw.done .mwCredit.rise{transition-delay:.35s}
.mrl .mwTree.pre .mwTile{opacity:0;transform:scale(.6)}
.mrl .mw.still .rise{transition:none}
.mrl .mw.stack{overflow:auto;-webkit-overflow-scrolling:touch;padding:10px 14px 28px}
.mrl .mw.stack .mwMain{flex:none;flex-direction:column;align-items:stretch}
.mrl .mw.stack .mwFoot{grid-template-columns:1fr;gap:12px}
.mrl .mw.stack .mwStats b{font-size:24px}
.mrl .mw.stack .mwCredit{white-space:normal}
.mrl .mw.stack .mwLead{font-size:14.5px}
@media (max-width:520px){.mrl .mwH{font-size:clamp(28px,9.4vw,44px)}
.mrl .mw.stack .mwStats{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 8px}
.mrl .mwPts{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.mrl .mwSweep{display:none}
.mrl .mw .rise,.mrl .mwTile{transition:none}}
`;

// Squarified treemap. items: [{v}] largest first. Returns [{o,x,y,w,h}].
function squarify(items, W, H) {
  const total = items.reduce((a, b) => a + b.v, 0);
  if (!total || W <= 0 || H <= 0) return [];
  const k = (W * H) / total;
  const rect = { x: 0, y: 0, w: W, h: H };
  const out = [];
  const sum = (r) => r.reduce((a, b) => a + b.a, 0);
  const worst = (r, side) => {
    const s = sum(r); let mx = 0, mn = Infinity;
    for (const q of r) { if (q.a > mx) mx = q.a; if (q.a < mn) mn = q.a; }
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };
  const lay = (r) => {
    const s = sum(r);
    if (rect.w >= rect.h) {
      const cw = s / rect.h; let y = rect.y;
      for (const q of r) { const h = q.a / cw; out.push({ o: q.o, x: rect.x, y, w: cw, h }); y += h; }
      rect.x += cw; rect.w -= cw;
    } else {
      const rh = s / rect.w; let x = rect.x;
      for (const q of r) { const w = q.a / rh; out.push({ o: q.o, x, y: rect.y, w, h: rh }); x += w; }
      rect.y += rh; rect.h -= rh;
    }
  };
  let row = [];
  for (const o of items) {
    const q = { o, a: o.v * k };
    const side = Math.min(rect.w, rect.h);
    if (!row.length || worst(row.concat(q), side) <= worst(row, side)) row.push(q);
    else { lay(row); row = [q]; }
  }
  if (row.length) lay(row);
  return out;
}

const MAX_TILES = 120;

/**
 * Opens the wall inside `fin` (the engine's full-screen closing layer).
 *
 * d: { name, eyebrow, cols, rows, src (canvas of the whole photo), wall (the
 *      /api/mural/wall answer, or null), state (the crowd snapshot), me
 *      { name, firsts, pts, rank, pieces }, complete, hoursOpen, dark, animate,
 *      credit, homeHref, top: [{label, href|onClick}], primary {label, sub,
 *      href|onClick}, alts: [{label, href|onClick}], note, next(el), bars(color),
 *      sweep (false when the board's own reveal already filled the screen) }
 * Returns { close() }.
 */
export function openMemorial(fin, d) {
  const cols = d.cols, rows = d.rows, total = cols * rows;
  const dark = !!d.dark;
  const ground = dark ? DARK_GROUND : GROUND;
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = !!d.animate && !reduce;
  const st = d.state || {};
  const wall = d.wall && Array.isArray(d.wall.order) && Array.isArray(d.wall.own) && d.wall.order.length === d.wall.own.length ? d.wall : null;

  /* ---------- who built it ---------- */
  // who[0] is every guest together; the members follow, most pieces first.
  let who;
  if (wall) {
    who = [{ n: 'Guests', f: (wall.guests && wall.guests.f) || 0, guest: true, players: (wall.guests && wall.guests.players) || 0 }]
      .concat((wall.who || []).map((o) => ({ n: o.n || 'Player', f: o.f || 0, c: typeof o.c === 'string' ? o.c : '', ...(o.g ? { g: true } : {}) })));
  } else {
    const g = st.guests || {};
    who = [{ n: 'Guests', f: g.firsts || 0, guest: true, players: g.players || 0 }]
      .concat((st.contrib || []).filter((o) => o.firsts > 0).map((o) => ({ n: o.name || 'Player', f: o.firsts })));
  }
  const placed = wall ? wall.order.length : (st.n || 0);
  const ownerOf = new Int32Array(total).fill(-1);
  const byOwner = who.map(() => []);
  if (wall) for (let k = 0; k < wall.order.length; k++) { const p = wall.order[k], o = wall.own[k]; if (p >= 0 && p < total && who[o]) { ownerOf[p] = o; byOwner[o].push(p); } }

  // Which block is the reader's own: the member whose every first is among my pieces.
  const me = d.me || {};
  const myPieces = me.pieces ? Array.from(me.pieces) : [];
  let meIdx = -1;
  if (wall && myPieces.length) {
    const tally = new Map();
    for (const p of myPieces) { const o = ownerOf[p]; if (o > 0) tally.set(o, (tally.get(o) || 0) + 1); }
    let best = 0;
    if (me.name) for (const [o, c] of tally) if (c === who[o].f && c > best && who[o].n === me.name) { best = c; meIdx = o; }
    if (meIdx < 0) for (const [o, c] of tally) if (c === who[o].f && c > best) { best = c; meIdx = o; }
  } else if (!wall && me.name) {
    meIdx = who.findIndex((o, i) => i > 0 && o.n === me.name);
  }
  const myFirsts = wall
    ? (meIdx > 0 ? byOwner[meIdx] : myPieces.filter((p) => ownerOf[p] === 0))
    : [];

  // The blocks: the top members, the rest as one block, the guests as one block.
  const members = who.map((o, i) => ({ ...o, idx: [i] })).slice(1).filter((o) => o.f > 0);
  members.forEach((o, i) => { o.rank = i + 1; });
  let tiles = members.slice(0, MAX_TILES);
  const rest = members.slice(MAX_TILES);
  if (meIdx > 0 && !tiles.some((t) => t.idx[0] === meIdx)) {
    const mine = rest.findIndex((t) => t.idx[0] === meIdx);
    if (mine >= 0) tiles.push(rest.splice(mine, 1)[0]);
  }
  tiles.forEach((t, i) => {
    const c = RAMP[i % RAMP.length], tier = Math.floor(i / RAMP.length);
    t.fill = dark ? mix(c, DARK_GROUND, [0.45, 0.6, 0.7][Math.min(2, tier)]) : mix(c, '#ffffff', [0.18, 0.42, 0.6][Math.min(2, tier)]);
    t.me = t.idx[0] === meIdx;
  });
  if (rest.length) {
    tiles.push({ n: num(rest.length) + ' More ' + plural(rest.length, 'Player', 'Players'), f: rest.reduce((a, b) => a + b.f, 0), idx: rest.map((o) => o.idx[0]), fill: dark ? '#252d3d' : mix(GROUND, '#ffffff', 0.5), bucket: true });
  }
  if (who[0].f > 0) {
    tiles.push({ n: 'Guests', f: who[0].f, idx: [0], guest: true, sub: num(who[0].players) + plural(who[0].players, ' guest', ' guests'), fill: dark ? '#313a4d' : mix(GROUND, '#ffffff', 0.78) });
  }
  tiles.forEach((t) => { t.v = t.f; });
  tiles.sort((a, b) => b.v - a.v);
  const fillOf = who.map(() => (dark ? '#252d3d' : mix(GROUND, '#ffffff', 0.5)));
  for (const t of tiles) for (const i of t.idx) fillOf[i] = t.fill;

  /* ---------- where it was built (owner, 2026-11-22: "show contributions by country") ----------
     The same blocks, one a country, sized by the pieces its players placed first. The wall
     answers each player's country; a player it could not place reads as Unknown. */
  let regionName = (c) => c;
  try { const dn = new Intl.DisplayNames(['en'], { type: 'region' }); regionName = (c) => { try { return dn.of(c) || c; } catch (e) { return c; } }; } catch (e) { /* old browser: the code */ }
  const byCode = new Map();
  if (wall) for (let i = 1; i < who.length; i++) {
    if (!(who[i].f > 0)) continue;
    const c = who[i].c || '';
    let g = byCode.get(c);
    if (!g) { g = { code: c, n: c ? regionName(c) : 'Unknown', f: 0, idx: [], players: 0, country: true, unknown: !c }; byCode.set(c, g); }
    g.f += who[i].f; g.idx.push(i); g.players += 1;
  }
  const nations = [...byCode.values()].filter((g) => !g.unknown).sort((a, b) => b.f - a.f || (a.n < b.n ? -1 : 1));
  const nCountries = nations.length;
  const cTiles = nations.slice();
  if (byCode.has('')) cTiles.push(byCode.get(''));
  cTiles.forEach((t, i) => {
    t.rank = t.unknown ? 0 : i + 1;
    // The best builder of each country, for the hover card.
    let top = -1; for (const o of t.idx) if (top < 0 || who[o].f > who[top].f) top = o;
    t.lead = top > 0 ? who[top] : null;
    t.mine = meIdx > 0 && t.idx.includes(meIdx);
    const c = RAMP[i % RAMP.length], tier = Math.floor(i / RAMP.length);
    t.fill = t.unknown ? (dark ? '#313a4d' : mix(GROUND, '#ffffff', 0.78))
      : dark ? mix(c, DARK_GROUND, [0.45, 0.6, 0.7][Math.min(2, tier)]) : mix(c, '#ffffff', [0.18, 0.42, 0.6][Math.min(2, tier)]);
    t.v = t.f;
  });
  cTiles.sort((a, b) => b.v - a.v);
  const cFillOf = who.map(() => (dark ? '#252d3d' : mix(GROUND, '#ffffff', 0.5)));
  for (const t of cTiles) for (const i of t.idx) cFillOf[i] = t.fill;
  const hasCountries = nCountries > 0;
  let view = 'players';
  const curTiles = () => (view === 'countries' ? cTiles : tiles);
  const curFill = () => (view === 'countries' ? cFillOf : fillOf);

  /* ---------- the words ---------- */
  const nMembers = typeof st.players === 'number' ? st.players : members.length;
  const nGuests = (st.guests && st.guests.players) || who[0].players || 0;
  const builders = nMembers + nGuests;
  const hrs = Math.max(0, Math.floor(d.hoursOpen || 0));
  const span = hrs >= 72 ? num(Math.round(hrs / 24)) + ' Days.' : hrs >= 1 ? num(hrs) + plural(hrs, ' Hour.', ' Hours.') : 'Under An Hour.';
  const head = d.complete
    ? [num(total) + ' Pieces.', num(builders) + plural(builders, ' Builder.', ' Builders.')].concat(nCountries > 1 ? [num(nCountries) + ' Countries.'] : [], [span])
    : [num(placed) + ' Of ' + num(total) + ' Pieces.', num(builders) + plural(builders, ' Builder.', ' Builders.')].concat(nCountries > 1 ? [num(nCountries) + ' Countries.'] : []);
  const nameAt = (k) => { const o = who[wall.own[k]]; return o ? (o.guest ? 'a guest' : o.n) : 'a player'; };
  let lead = num(nMembers) + plural(nMembers, ' player', ' players') + ' and ' + num(nGuests) + plural(nGuests, ' guest', ' guests') + ' built this ' + d.name + (d.complete ? '.' : ' before it closed.');
  if (wall && wall.order.length > 1) {
    const a = nameAt(0), b = nameAt(wall.order.length - 1);
    const A = a === 'a guest' ? 'A guest' : esc(a);
    lead += ' ' + A + ' placed the first piece' + (d.complete ? ', and ' + esc(b) + ' placed the last.' : '.');
  }
  if (d.note) lead += ' ' + esc(d.note);

  const link = (o, cls) => (o.href
    ? '<a class="' + cls + '" href="' + esc(o.href) + '">' + esc(o.label) + '</a>'
    : '<button type="button" class="' + cls + '" data-act="' + esc(o.key) + '">' + esc(o.label) + '</button>');
  const acts = new Map();
  const reg = (list) => (list || []).map((o, i) => { const key = 'a' + acts.size + '_' + i; if (o.onClick) acts.set(key, o.onClick); return { ...o, key }; });
  const top = reg(d.top), alts = reg(d.alts), primary = d.primary ? reg([d.primary])[0] : null;

  const share = total ? (me.firsts || 0) / total * 100 : 0;
  const you = (me.firsts || 0) > 0 || myPieces.length > 0
    ? '<div class="mwStats">'
      + '<div><b>' + num(me.firsts) + '</b><span>Placed First</span></div>'
      + '<div><b>' + share.toFixed(share < 10 ? 1 : 0) + '%</b><span>Of The Wall</span></div>'
      + '<div><b>' + num(me.pts) + '</b><span>Points</span></div>'
      + '<div><b>' + (me.rank ? '#' + num(me.rank) : '–') + '</b><span>Place</span></div>'
      + '</div>'
    : '<p class="mwNone">You did not place a piece on this one. Every ' + esc(d.name) + ' is kept like this once it is finished.</p>';
  const tops = (st.top || []).slice(0, 6);
  const topCard = tops.length
    ? '<div class="mwCard"><h4>Top Points</h4><ol class="mwPts">' + tops.map((r, i) => '<li class="' + (me.name && r.member && r.name === me.name ? 'me' : '') + '"><span class="r">' + (i + 1) + '</span><span class="n">' + esc(r.name) + '</span><span class="p">' + num(r.points) + '</span></li>').join('') + '</ol></div>'
    : '<div class="mwCard"><h4>Top Points</h4><p class="mwNone">No points were scored.</p></div>';

  const sweepCols = dark ? RAMP.slice(0, 6).map((c) => mix(c, DARK_GROUND, 0.55)) : RAMP.slice(0, 6).map((c) => mix(c, '#ffffff', 0.4));
  const el = document.createElement('div');
  el.className = animate ? 'mw' : 'mw still';
  el.innerHTML = (animate && d.sweep !== false ? '<div class="mwSweep" aria-hidden="true">' + sweepCols.map((c, i) => '<i style="background:' + c + ';animation-delay:' + (120 + i * 70) + 'ms"></i>').join('') + '</div>' : '')
    + '<div class="mwTop rise">'
    + '<a class="mwHome" href="' + esc(d.homeHref || '/') + '" aria-label="Back to Mind Loft home"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><svg width="22" height="22" viewBox="0 0 26 26" aria-hidden="true"><path d="M3 22V11l10-8 10 8v11h-5v-8l-5 5-5-5v8z" fill="currentColor"/></svg><span>Mind Loft</span></a>'
    + '<span class="sp"></span>' + top.map((o) => link(o, 'mwTxt')).join('')
    + '</div>'
    + '<div class="mwHead rise"><div class="mwEb">' + esc(d.eyebrow) + '</div>'
    + '<h2 class="mwH">' + head.map((t) => '<span>' + esc(t) + '</span>').join(' ') + '</h2>'
    + '<p class="mwLead">' + lead + '</p></div>'
    + '<div class="mwMain">'
    + '<div class="mwCol mwWallCol rise"><div class="mwWall" id="mwWall"><canvas id="mwCv" role="img" aria-label="The finished ' + esc(d.name) + '"></canvas><div class="mwCount off" id="mwCount"></div></div>'
    + '<div class="mwRow"><div class="mwCap" id="mwCap"></div>'
    + (wall ? '<div class="mwSeg" id="mwSeg" role="group" aria-label="What the wall shows"><button type="button" data-m="pic" class="on">Picture</button><button type="button" data-m="own">Who Placed What</button></div><button type="button" class="mwTxt" id="mwReplay">Watch It Build</button>' : '')
    + '</div></div>'
    + '<div class="mwCol mwTreeCol rise"><div class="mwTree' + (animate ? ' pre' : '') + '" id="mwTree" role="group" aria-label="Who built it"></div>'
    + '<div class="mwRow"><div class="mwCap" id="mwTreeCap"></div>'
    + (hasCountries ? '<div class="mwSeg" id="mwView" role="group" aria-label="Show builders by"><button type="button" data-v="players" class="on">Players</button><button type="button" data-v="countries">Countries</button></div>' : '')
    + '</div></div>'
    + '</div>'
    + '<div class="mwFoot rise">'
    + '<div class="mwCard"><h4>Your Part<span class="sp"></span>' + (wall && myFirsts.length ? '<button type="button" class="mwTxt" id="mwMine">Show My Pieces</button>' : '') + '</h4>' + you + '</div>'
    + topCard
    + '<div class="mwActs">'
    + (primary ? link(primary, 'mwGo') + (primary.sub ? '<p class="mwSub">' + esc(primary.sub) + '</p>' : '') : '')
    + '<div class="mwNext" id="mwNext"></div>'
    + (alts.length ? '<div class="mwAlt">' + alts.map((o) => link(o, 'mwBtn')).join('') + '</div>' : '')
    + '</div></div>'
    + (d.credit ? '<p class="mwCredit rise">' + esc(d.credit) + ' Kept as the site finished it.</p>' : '');

  const q = (s) => el.querySelector(s);
  fin.querySelectorAll('.mw').forEach((n) => n.remove());
  fin.appendChild(el);
  fin.classList.add('mwOn', 'show');
  fin.scrollTop = 0;
  // The reader's light or dark look reaches the layer itself, which sits behind the sweep.
  fin.style.setProperty('--mw-bg', ground);
  fin.style.setProperty('--mw-ink', dark ? DARK_INK : INK);
  const release = typeof d.bars === 'function' ? d.bars(ground) : null;

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && acts.has(b.dataset.act)) { e.preventDefault(); acts.get(b.dataset.act)(); }
  });
  if (typeof d.next === 'function') d.next(q('#mwNext'));

  /* ---------- the wall ---------- */
  const cv = q('#mwCv'), cx = cv.getContext('2d');
  let cs = 0, picC = null, ownC = null, mode = 'pic', hl = null, hlLabel = '', building = false, raf = 0, closed = false;
  const slot = dark ? '#131926' : mix(GROUND, '#ffffff', 0.3);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function cell(ctx, p, fill) { ctx.fillStyle = fill; ctx.fillRect((p % cols) * cs, ((p / cols) | 0) * cs, cs, cs); }
  function ownLayer() {
    if (!ownC) return;
    const ox = ownC.getContext('2d'), fills = curFill();
    ox.fillStyle = slot; ox.fillRect(0, 0, ownC.width, ownC.height);
    if (wall) for (let k = 0; k < wall.order.length; k++) cell(ox, wall.order[k], fills[wall.own[k]] || slot);
  }
  function layers(cssW) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const want = Math.max(4, Math.min(24, Math.round((cssW * dpr) / cols)));
    if (want === cs && picC) return;
    cs = want;
    cv.width = cols * cs; cv.height = rows * cs;
    picC = mk(cv.width, cv.height);
    const px = picC.getContext('2d');
    px.imageSmoothingQuality = 'high';
    px.drawImage(d.src, 0, 0, picC.width, picC.height);
    if (!d.complete) {
      // An unfinished wall keeps its gaps.
      const has = (p) => (wall ? ownerOf[p] >= 0 : typeof st.placed === 'string' && st.placed.charCodeAt(p) === 49);
      for (let p = 0; p < total; p++) if (!has(p)) cell(px, p, slot);
    }
    ownC = mk(cv.width, cv.height);
    ownLayer();
  }
  function paint(a) {
    if (!picC) return;
    cx.globalAlpha = 1;
    if (hl) {
      cx.fillStyle = slot; cx.fillRect(0, 0, cv.width, cv.height);
      cx.globalAlpha = dark ? 0.22 : 0.2; cx.drawImage(picC, 0, 0); cx.globalAlpha = 1;
      for (const p of hl) { const x = (p % cols) * cs, y = ((p / cols) | 0) * cs; cx.drawImage(picC, x, y, cs, cs, x, y, cs, cs); }
      return;
    }
    const pic = a == null ? (mode === 'pic' ? 1 : 0) : a;
    if (pic < 1) cx.drawImage(ownC, 0, 0);
    if (pic > 0) { cx.globalAlpha = pic; cx.drawImage(picC, 0, 0); cx.globalAlpha = 1; }
  }
  const cap = q('#mwCap'), count = q('#mwCount');
  function caption() {
    if (!cap) return;
    if (hl) { cap.innerHTML = hlLabel; return; }
    if (!wall) { cap.textContent = d.complete ? 'The finished picture.' : 'The picture as the site left it.'; return; }
    cap.textContent = mode === 'own'
      ? (view === 'countries' ? 'Every piece in the colour of the country it was placed from first.' : 'Every piece in the colour of the player who placed it first.')
      : (d.complete ? 'The finished picture, every piece in place.' : 'The picture as the site left it.');
  }
  function setMode(m) {
    mode = m; hl = null;
    const seg = q('#mwSeg');
    if (seg) seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
    tree.classList.remove('dim'); tree.querySelectorAll('.hl').forEach((n) => n.classList.remove('hl'));
    const mb = q('#mwMine'); if (mb) mb.textContent = 'Show My Pieces';
    caption(); paint();
  }
  function fade(to, ms, then) {
    cancelAnimationFrame(raf);
    const t0 = performance.now(), from = 1 - to;
    (function step() {
      if (closed) return;
      const k = Math.min(1, (performance.now() - t0) / ms), e = k * k * (3 - 2 * k);
      paint(from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(step); else if (then) then();
    })();
  }
  function reveal() {
    building = false;
    el.classList.add('in', 'done');
    tree.classList.remove('pre');
    if (count) count.classList.add('off');
    caption();
    // The stagger belongs to the entrance only; a tap must answer at once.
    setTimeout(() => { if (!closed) tree.querySelectorAll('.mwTile').forEach((n) => { n.style.transitionDelay = '0ms'; }); }, 1400);
  }
  // The build: the pieces arrive in the order the site placed them.
  function build() {
    if (!wall || !wall.order.length) { reveal(); paint(); return; }
    cancelAnimationFrame(raf);
    building = true; hl = null; mode = 'pic';
    const seg = q('#mwSeg'); if (seg) seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.m === 'pic'));
    tree.classList.remove('dim'); tree.querySelectorAll('.hl').forEach((n) => n.classList.remove('hl'));
    cx.globalAlpha = 1; cx.fillStyle = slot; cx.fillRect(0, 0, cv.width, cv.height);
    count.classList.remove('off');
    cap.textContent = 'Building it in the order it was placed. Tap the wall to skip.';
    const N = wall.order.length, T = 5200, t0 = performance.now() + (el.classList.contains('done') ? 0 : 650);
    let at = 0;
    (function step() {
      if (closed || !building) return;
      const k = Math.max(0, Math.min(1, (performance.now() - t0) / T));
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const upto = Math.round(e * N);
      const fills = curFill();
      for (; at < upto; at++) cell(cx, wall.order[at], fills[wall.own[at]] || slot);
      count.textContent = num(at) + plural(at, ' piece', ' pieces');
      if (k < 1) { raf = requestAnimationFrame(step); return; }
      setTimeout(() => { if (closed || !building) return; fade(1, 1100, reveal); el.classList.add('done'); tree.classList.remove('pre'); }, 450);
    })();
  }
  function skip() { if (!building) return; building = false; cancelAnimationFrame(raf); reveal(); paint(); }

  /* ---------- who built it, as blocks ---------- */
  const tree = q('#mwTree');
  let treeW = 0, treeH = 0;
  function drawTree(W, H) {
    const lay = squarify(curTiles(), W, H);
    treeW = W; treeH = H;
    tree.style.width = W + 'px'; tree.style.height = H + 'px';
    if (!lay.length) { tree.innerHTML = '<p class="mwNone" style="padding:14px">Nobody placed a piece on this one.</p>'; return; }
    tree.innerHTML = lay.map((r, i) => {
      const t = r.o, g = 3, w = Math.max(1, r.w - g), h = Math.max(1, r.h - g);
      const nm = t.me && !t.country ? 'You' : t.n;
      const pad = w > 90 ? 10 : 6;
      const fs = Math.max(10, Math.min(30, h * 0.3, (w - pad * 2) / (Math.max(3, nm.length) * 0.6)));
      const showName = w >= 38 && h >= 22;
      const fs2 = Math.max(10.5, Math.min(14, fs * 0.62));
      const showCt = showName && h >= fs * 1.3 + fs2 * 1.3 + pad + 4;
      const pct = t.f / total * 100;
      const sub = t.country ? num(t.players) + plural(t.players, ' player', ' players') : t.sub;
      const ct = num(t.f) + (w > 110 ? ' · ' + pct.toFixed(pct < 10 ? 1 : 0) + '%' : '') + (sub && w > 190 ? ' · ' + sub : '');
      const title = (t.me && !t.country ? 'You, ' + t.n : t.n) + ': ' + num(t.f) + plural(t.f, ' piece', ' pieces') + ', ' + pct.toFixed(1) + '% of the wall' + (t.country ? ', ' + sub : '');
      return '<button type="button" class="mwTile' + (t.me || t.mine ? ' me' : '') + (Math.min(w, h) < 14 ? ' sm' : '') + '" data-t="' + i + '" aria-label=""' + esc(title) + '" style="left:' + r.x.toFixed(1) + 'px;top:' + r.y.toFixed(1) + 'px;width:' + w.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px;background:' + t.fill + ';transition-delay:' + Math.min(900, i * 22) + 'ms">'
        + (showName ? '<i style="font-size:' + fs.toFixed(1) + 'px;padding:' + (pad - 3) + 'px ' + pad + 'px 0">' + esc(nm) + '</i>' : '')
        + (showCt ? '<em style="font-size:' + fs2.toFixed(1) + 'px;top:' + (pad - 3 + fs * 1.3).toFixed(1) + 'px;padding:0 ' + pad + 'px">' + esc(ct) + '</em>' : '')
        + '</button>';
    }).join('');
    tree._lay = lay;
  }
  function pick(i, node) {
    if (!wall || building) return;
    const t = tree._lay && tree._lay[i] ? tree._lay[i].o : null;
    if (!t) return;
    if (node.classList.contains('hl')) { setMode(mode); return; }
    const mb = q('#mwMine'); if (mb) mb.textContent = 'Show My Pieces';
    hl = []; for (const o of t.idx) for (const p of byOwner[o]) hl.push(p);
    hlLabel = t.country
      ? '<b>' + esc(t.unknown ? 'Players we could not place' : t.n) + '</b>' + ' placed ' + (hl.length === 1 ? 'this piece' : 'these ' + num(hl.length) + ' pieces') + ' first' + (t.unknown ? '' : ', across ' + num(t.players) + plural(t.players, ' player', ' players')) + '. Tap again to bring the picture back.'
      : '<b>' + esc(t.me ? 'You' : t.n) + '</b> placed ' + (hl.length === 1 ? 'this piece' : 'these ' + num(hl.length) + ' pieces') + ' first. Tap again to bring the picture back.';
    tree.classList.add('dim'); tree.querySelectorAll('.hl').forEach((n) => n.classList.remove('hl')); node.classList.add('hl');
    caption(); paint();
  }
  tree.addEventListener('click', (e) => { const b = e.target.closest('.mwTile'); if (b) pick(+b.dataset.t, b); });
  q('#mwWall').addEventListener('click', () => { if (building) skip(); else if (hl) setMode(mode); });
  const seg = q('#mwSeg');
  if (seg) seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || building) return; const m = b.dataset.m; if (m === mode && !hl) return; hl = null; mode = m; setMode(m); });
  const rp = q('#mwReplay'); if (rp) rp.addEventListener('click', () => { if (building) skip(); else { layout(); build(); } });
  const mb = q('#mwMine');
  if (mb) mb.addEventListener('click', () => {
    if (building) return;
    if (mb.textContent === 'Show The Picture') { setMode(mode); return; }
    setMode(mode);
    hl = myFirsts.slice();
    hlLabel = '<b>You</b> placed ' + (hl.length === 1 ? 'this piece' : 'these ' + num(hl.length) + ' pieces') + ' first.';
    tree.classList.add('dim'); const mine = tree.querySelector('.mwTile.me'); if (mine) mine.classList.add('hl');
    mb.textContent = 'Show The Picture';
    caption(); paint();
    if (el.classList.contains('stack')) q('#mwWall').scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  });

  const treeCap = q('#mwTreeCap');
  function treeCaption() {
    if (!treeCap) return;
    treeCap.innerHTML = view === 'countries'
      ? '<b>Where It Was Built.</b> One block a country, sized by pieces placed first.' + (nCountries > 1 ? ' ' + num(nCountries) + ' countries in all.' : '') + ' Point at a block for the detail. Tap one for its pieces.'
      : '<b>Who Built It.</b> One block a player, sized by pieces placed first.' + (wall ? ' Point at a block or a piece for the name. Tap a block for their pieces.' : '');
  }
  treeCaption();
  const viewSeg = q('#mwView');
  if (viewSeg) viewSeg.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || building) return;
    const v = b.dataset.v; if (!v || v === view) return;
    view = v;
    viewSeg.querySelectorAll('button').forEach((n) => n.classList.toggle('on', n.dataset.v === v));
    hideTip();
    ownLayer();
    drawTree(treeW, treeH);
    tree.querySelectorAll('.mwTile').forEach((n) => { n.style.transitionDelay = '0ms'; });
    treeCaption();
    setMode(mode);
  });

  /* ---------- the hover card (owner, 2026-11-19: "you can't see the user names. maybe putting
     cursor over gives full details for the given square") ----------
     A mouse over a block, or over a piece on the wall, shows who it is in full: the whole name,
     their pieces, their share and their place. Touch has no hover; a tap already names the player
     under the wall. */
  const tip = document.createElement('div');
  tip.className = 'mwTip'; tip.setAttribute('aria-hidden', 'true');
  el.appendChild(tip);
  const share1 = (f) => { const p = total ? f / total * 100 : 0; return p.toFixed(p < 10 ? 1 : 0) + '% of the wall'; };
  function tipFor(t) {
    if (!t) return '';
    const pcs = num(t.f) + plural(t.f, ' piece', ' pieces') + ' placed first';
    if (t.country) {
      return '<b>' + esc(t.n) + (t.mine ? ' (Yours)' : '') + '</b><span>' + pcs + ' \u00b7 ' + share1(t.f) + '</span>'
        + '<span>' + num(t.players) + plural(t.players, ' player', ' players') + (t.rank ? ' \u00b7 #' + num(t.rank) + ' of ' + num(nCountries) + plural(nCountries, ' country', ' countries') : '') + '</span>'
        + (t.lead && t.players > 1 ? '<span>Top builder: ' + esc(t.lead.n) + ', ' + num(t.lead.f) + '</span>' : '')
        + (t.unknown ? '<span>Players whose country we could not tell.</span>' : '');
    }
    if (t.guest) return '<b>Guests</b><span>' + esc(t.sub || '') + ' together</span><span>' + pcs + ' \u00b7 ' + share1(t.f) + '</span>';
    if (t.bucket) return '<b>' + esc(t.n) + '</b><span>' + pcs + ' \u00b7 ' + share1(t.f) + '</span><span>Each placed fewer than the players shown.</span>';
    return '<b>' + esc(t.n) + (t.me ? ' (You)' : '') + '</b><span>' + pcs + ' \u00b7 ' + share1(t.f) + '</span>'
      + (t.rank ? '<span>#' + num(t.rank) + ' of ' + num(members.length) + plural(members.length, ' player', ' players') + ' by pieces</span>' : '');
  }
  const tileOf = new Map(), cTileOf = new Map();
  for (const t of tiles) for (const i of t.idx) tileOf.set(i, t);
  for (const t of cTiles) for (const i of t.idx) cTileOf.set(i, t);
  let tipKey = null;
  function showTip(key, html, e) {
    if (!html) { hideTip(); return; }
    if (key !== tipKey) { tip.innerHTML = html; tipKey = key; }
    tip.classList.add('on');
    const w = tip.offsetWidth, h = tip.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    let x = e.clientX + 16, y = e.clientY + 18;
    if (x + w > vw - 8) x = Math.max(8, e.clientX - w - 12);
    if (y + h > vh - 8) y = Math.max(8, e.clientY - h - 12);
    tip.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }
  function hideTip() { tip.classList.remove('on'); tipKey = null; }
  tree.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const b = e.target.closest('.mwTile');
    const t = b && tree._lay && tree._lay[+b.dataset.t] ? tree._lay[+b.dataset.t].o : null;
    if (t) showTip('t' + b.dataset.t, tipFor(t), e); else hideTip();
  });
  tree.addEventListener('pointerleave', hideTip);
  const wallEl = q('#mwWall');
  wallEl.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !wall || building) { hideTip(); return; }
    const r = cv.getBoundingClientRect();
    const c = Math.floor((e.clientX - r.left) / r.width * cols), rw = Math.floor((e.clientY - r.top) / r.height * rows);
    if (c < 0 || rw < 0 || c >= cols || rw >= rows) { hideTip(); return; }
    const o = ownerOf[rw * cols + c];
    if (o < 0) { showTip('none', '<b>Not placed</b><span>Nobody placed this piece before it closed.</span>', e); return; }
    if (view === 'countries') {
      const ct = cTileOf.get(o);
      if (!ct) { hideTip(); return; }
      showTip('c' + o, '<span>This piece was placed by</span><b>' + esc(who[o].n) + '</b><span>from ' + esc(ct.unknown ? 'an unknown country' : ct.n) + '</span><span>' + esc(ct.n) + ': ' + num(ct.f) + plural(ct.f, ' piece', ' pieces') + ' \u00b7 ' + share1(ct.f) + '</span>', e);
      return;
    }
    const t = tileOf.get(o);
    if (!t) { hideTip(); return; }
    // A player folded into the "more players" block is still named on their own piece.
    const one = t.bucket ? { n: who[o].n, f: who[o].f, rank: (members.find((m) => m.idx[0] === o) || {}).rank } : t;
    if (t.guest) { showTip('w0', '<span>This piece was placed by</span><b>A Guest</b><span>' + esc(t.sub || 'Guests') + ' placed ' + num(t.f) + plural(t.f, ' piece', ' pieces') + ' together \u00b7 ' + share1(t.f) + '</span>', e); return; }
    showTip('w' + o, '<span>This piece was placed by</span>' + tipFor(one), e);
  });
  wallEl.addEventListener('pointerleave', hideTip);

  /* ---------- fitting the screen ---------- */
  const main = q('.mwMain'), wallBox = q('#mwWall'), treeCol = q('.mwTreeCol'), wallCol = q('.mwWallCol');
  function layout() {
    if (closed) return;
    const vw = fin.clientWidth, vh = fin.clientHeight;
    const stack = vw < 900 || vh < 600;
    el.classList.toggle('stack', stack);
    let ww, wh, tw, th;
    if (stack) {
      ww = main.clientWidth; wh = Math.round(ww * rows / cols);
      tw = ww; th = Math.round(Math.max(300, Math.min(520, ww * 1.05)));
    } else {
      // One screen: the wall and the blocks share the row left over by the rest.
      wallBox.style.height = '0px'; tree.style.height = '0px';
      const gap = 16, full = main.clientWidth, rowsEl = main.querySelectorAll('.mwRow');
      // The caption rows wrap on a narrow column, so their real height is measured, not assumed.
      let under = 44;
      for (let pass = 0; pass < 3; pass++) {
        const avail = Math.max(180, main.clientHeight - under);
        ww = Math.min(avail * cols / rows, full * 0.62); wh = Math.round(ww * rows / cols); ww = Math.round(ww);
        tw = Math.max(240, full - ww - gap); th = wh;
        wallCol.style.width = ww + 'px'; treeCol.style.width = tw + 'px';
        let tall = 0; rowsEl.forEach((r) => { tall = Math.max(tall, r.offsetHeight); });
        if (tall + 10 <= under) break;
        under = tall + 10;
      }
    }
    wallBox.style.width = ww + 'px'; wallBox.style.height = wh + 'px';
    wallCol.style.width = stack ? '' : ww + 'px';
    treeCol.style.width = stack ? '' : tw + 'px';
    const was = cs; layers(ww);
    drawTree(tw, th);
    if (hl) { hl = null; }
    if (was !== cs || !building) { if (building) { building = false; cancelAnimationFrame(raf); reveal(); } tree.classList.remove('dim'); caption(); paint(); }
  }
  let rz = 0;
  const onResize = () => { clearTimeout(rz); rz = setTimeout(layout, 120); };
  window.addEventListener('resize', onResize);

  layout();
  if (animate) {
    requestAnimationFrame(() => { if (!closed) el.classList.add('in'); });
    setTimeout(() => { if (!closed) tree.classList.remove('pre'); }, 1100);
    setTimeout(() => { const s = q('.mwSweep'); if (s) s.remove(); }, 1500);
    build();
  } else { reveal(); paint(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!closed && !building) layout(); }).catch(() => {});

  return {
    close() {
      if (closed) return;
      closed = true; building = false;
      cancelAnimationFrame(raf); clearTimeout(rz);
      window.removeEventListener('resize', onResize);
      if (release) release();
      fin.classList.remove('show', 'mwOn');
      fin.style.removeProperty('--mw-bg'); fin.style.removeProperty('--mw-ink');
      el.remove();
    },
  };
}
