// THE WITNESS SCENE: one street, drawn from data. Shared by the client (the
// board), the generator and the verifier, so the picture a player studies and
// the facts the questions are checked against are the same object.
//
// A scene is plain data (see app/witness/puzzles.js for the fields). sceneSvg
// turns it into SVG markup: every outline is the 1px page ink, the fills are
// the site's soft tones, and nothing is dashed (owner, 2026-10-25).
//
// The geometry constants are exported because the generator needs them to
// place the numbered pins the reveal shows.

export const W = 360, H = 400;
export const INK = '#0b0f1a';
export const BASE = 240;        // where the buildings meet the sidewalk
export const WALK = 302;        // where sidewalk things stand
export const ROAD = 388;        // where wheels touch
export const WALK_SLOTS = 12, ROAD_SLOTS = 3, SKY_SLOTS = 6;
export const COLORS = { red: '#f87171', blue: '#7dd3fc', green: '#86efac', yellow: '#fde047', orange: '#fb923c', purple: '#c084fc', white: '#ffffff', black: '#1f2937' };
export const COLOR_NAMES = Object.keys(COLORS);
export const WALLS = ['#ffffff', '#f8fafc', '#fef9e7', '#eef6ff', '#fdf2f4', '#f1f7f1'];

export const walkX = (slot) => 15 + 30 * slot;
export const roadX = (slot) => 60 + 120 * slot;
export const skyX = (slot) => 30 + 60 * slot;
export const shopBox = (scene, i) => {
  const n = scene.shops.length, bw = W / n, h = 118 + 14 * (scene.shops[i].tall || 0);
  return { x: i * bw, y: BASE - h, w: bw, h };
};

const c = (name) => COLORS[name] || name || '#ffffff';
const S = `stroke="${INK}" stroke-width="1"`;
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function shop(scene, i) {
  const s = scene.shops[i], b = shopBox(scene, i), cx = b.x + b.w / 2;
  let o = `<rect x="${b.x + 0.5}" y="${b.y}" width="${b.w - 1}" height="${b.h}" fill="${WALLS[(s.wall || 0) % WALLS.length]}" ${S}/>`;
  if (s.clock) {
    const { h, m } = s.clock, ty = b.y - 30;
    const ma = (m / 60) * 2 * Math.PI, ha = (((h % 12) + m / 60) / 12) * 2 * Math.PI;
    const ccx = cx, ccy = ty + 15;
    o += `<rect x="${cx - 18}" y="${ty}" width="36" height="30" fill="#ffffff" ${S}/><circle cx="${ccx}" cy="${ccy}" r="12" fill="#ffffff" ${S}/>`;
    for (let k = 0; k < 12; k += 3) { const a = (k / 12) * 2 * Math.PI; o += `<line x1="${(ccx + 9.5 * Math.sin(a)).toFixed(1)}" y1="${(ccy - 9.5 * Math.cos(a)).toFixed(1)}" x2="${(ccx + 11.5 * Math.sin(a)).toFixed(1)}" y2="${(ccy - 11.5 * Math.cos(a)).toFixed(1)}" stroke="${INK}"/>`; }
    o += `<line x1="${ccx}" y1="${ccy}" x2="${(ccx + 9 * Math.sin(ma)).toFixed(1)}" y2="${(ccy - 9 * Math.cos(ma)).toFixed(1)}" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`;
    o += `<line x1="${ccx}" y1="${ccy}" x2="${(ccx + 5.5 * Math.sin(ha)).toFixed(1)}" y2="${(ccy - 5.5 * Math.cos(ha)).toFixed(1)}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  const nw = s.windows || 1, ww = 16, gap = (b.w - nw * ww) / (nw + 1);
  for (let k = 0; k < nw; k++) o += `<rect x="${(b.x + gap + k * (ww + gap)).toFixed(1)}" y="${b.y + 8}" width="${ww}" height="20" fill="#eef2f7" ${S}/>`;
  o += `<rect x="${b.x + 6}" y="${BASE - 84}" width="${b.w - 12}" height="16" fill="#ffffff" ${S}/>`;
  o += `<text x="${cx}" y="${BASE - 72}" text-anchor="middle" font-size="${b.w < 100 ? 10.5 : 12}" font-weight="800" fill="${INK}">${esc(s.name)}</text>`;
  if (s.awning) {
    const ax = b.x + 4, aw = b.w - 8, ay = BASE - 64;
    o += `<rect x="${ax}" y="${ay}" width="${aw}" height="12" fill="${s.awning.striped ? '#ffffff' : c(s.awning.color)}" ${S}/>`;
    if (s.awning.striped) { const n = 7, sw = aw / n; for (let k = 0; k < n; k += 2) o += `<rect x="${(ax + k * sw).toFixed(1)}" y="${ay}" width="${sw.toFixed(1)}" height="12" fill="${c(s.awning.color)}" ${S}/>`; }
  }
  o += `<rect x="${b.x + 8}" y="${BASE - 48}" width="${(b.w / 2 - 24).toFixed(1)}" height="28" fill="#eef2f7" ${S}/>`;
  o += `<rect x="${cx - 11}" y="${BASE - 46}" width="22" height="46" fill="${c(s.door)}" ${S}/><circle cx="${cx + 6}" cy="${BASE - 23}" r="1.6" fill="${s.door === 'black' ? '#ffffff' : INK}"/>`;
  if (s.number) o += `<rect x="${cx + 16}" y="${BASE - 42}" width="22" height="13" fill="#ffffff" ${S}/><text x="${cx + 27}" y="${BASE - 32}" text-anchor="middle" font-size="9.5" font-weight="800" fill="${INK}">${s.number}</text>`;
  return o;
}

function walkItem(it) {
  const x = walkX(it.slot), y = WALK;
  switch (it.kind) {
    case 'person': {
      let o = `<line x1="${x - 4}" y1="${y - 12}" x2="${x - 4}" y2="${y}" stroke="${INK}" stroke-width="2"/><line x1="${x + 4}" y1="${y - 12}" x2="${x + 4}" y2="${y}" stroke="${INK}" stroke-width="2"/>`;
      o += `<rect x="${x - 8}" y="${y - 40}" width="16" height="29" rx="6" fill="${c(it.color)}" ${S}/><circle cx="${x}" cy="${y - 47}" r="6.5" fill="#ffffff" ${S}/>`;
      if (it.hat) o += `<rect x="${x - 9}" y="${y - 54}" width="18" height="2.5" fill="${INK}"/><rect x="${x - 5.5}" y="${y - 61}" width="11" height="8" fill="${INK}"/>`;
      if (it.umbrella) o += `<line x1="${x + 9}" y1="${y - 28}" x2="${x + 9}" y2="${y - 62}" stroke="${INK}" stroke-width="1.5"/><path d="M${x - 7} ${y - 62}a16 14 0 0 1 32 0z" fill="${c(it.umbrella)}" ${S}/>`;
      return o;
    }
    case 'dog':
      return `<path d="M${x - 9} ${y - 8}v8M${x - 4} ${y - 8}v8M${x + 5} ${y - 8}v8M${x + 9} ${y - 8}v8M${x - 11} ${y - 14}l-4 -5" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/><ellipse cx="${x}" cy="${y - 11}" rx="11" ry="5.5" fill="#e7c9a0" ${S}/><circle cx="${x + 11}" cy="${y - 17}" r="5" fill="#e7c9a0" ${S}/><path d="M${x + 9} ${y - 21}l-3 -4l5 1z" fill="${INK}"/><circle cx="${x + 13}" cy="${y - 18}" r="0.9" fill="${INK}"/>`;
    case 'cat':
      return `<path d="M${x + 7} ${y - 2}q8 -2 5 -12" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M${x - 7} ${y}v-9a7 8 0 0 1 14 0v9z" fill="#cbd5e1" ${S}/><circle cx="${x}" cy="${y - 19}" r="5.5" fill="#cbd5e1" ${S}/><path d="M${x - 5} ${y - 22}l1 -6l4 3zM${x + 5} ${y - 22}l-1 -6l-4 3z" fill="#cbd5e1" ${S}/><circle cx="${x - 2}" cy="${y - 19.5}" r="0.9" fill="${INK}"/><circle cx="${x + 2}" cy="${y - 19.5}" r="0.9" fill="${INK}"/>`;
    case 'bike':
      return `<circle cx="${x - 8}" cy="${y - 8}" r="7.5" fill="none" stroke="${INK}" stroke-width="1.5"/><circle cx="${x + 8}" cy="${y - 8}" r="7.5" fill="none" stroke="${INK}" stroke-width="1.5"/><path d="M${x - 8} ${y - 8}l5 -11h8l3 11M${x - 3} ${y - 19}l4 11h-9M${x + 3} ${y - 19}l2 -4h4M${x - 6} ${y - 21}h6" stroke="${INK}" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M${x - 8} ${y - 8}l5 -11h8l3 11M${x - 3} ${y - 19}l4 11h-9" stroke="${c(it.color)}" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
    case 'bench':
      return `<path d="M${x - 10} ${y - 9}v9M${x + 10} ${y - 9}v9" stroke="${INK}" stroke-width="2"/><rect x="${x - 13}" y="${y - 13}" width="26" height="5" fill="#e7c9a0" ${S}/><rect x="${x - 13}" y="${y - 24}" width="26" height="7" fill="#e7c9a0" ${S}/><path d="M${x - 11} ${y - 17}v4M${x + 11} ${y - 17}v4" stroke="${INK}" stroke-width="1.5"/>`;
    case 'lamp':
      return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 62}" stroke="${INK}" stroke-width="2.5"/><rect x="${x - 4}" y="${y - 4}" width="8" height="4" fill="${INK}"/><path d="M${x - 7} ${y - 62}h14l-3 -11h-8z" fill="#fde68a" ${S}/>`;
    case 'hydrant':
      return `<rect x="${x - 5}" y="${y - 16}" width="10" height="16" fill="#f87171" ${S}/><path d="M${x - 6} ${y - 16}a6 6 0 0 1 12 0z" fill="#f87171" ${S}/><rect x="${x - 8}" y="${y - 12}" width="16" height="4" fill="#f87171" ${S}/>`;
    case 'mailbox':
      return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 14}" stroke="${INK}" stroke-width="2.5"/><path d="M${x - 9} ${y - 14}v-10a9 9 0 0 1 18 0v10z" fill="#7dd3fc" ${S}/><rect x="${x - 5}" y="${y - 24}" width="10" height="2.5" fill="${INK}"/>`;
    case 'tree':
      return `<rect x="${x - 2.5}" y="${y - 30}" width="5" height="30" fill="#b08968" ${S}/><circle cx="${x}" cy="${y - 44}" r="14" fill="#86efac" ${S}/>`;
    case 'stop':
      return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 52}" stroke="${INK}" stroke-width="2"/><rect x="${x - 12}" y="${y - 70}" width="24" height="20" rx="3" fill="#ffffff" ${S}/><text x="${x}" y="${y - 55.5}" text-anchor="middle" font-size="11" font-weight="800" fill="${INK}">${it.route}</text>`;
    case 'bin':
      return `<path d="M${x - 7} ${y - 18}h14l-1.5 18h-11z" fill="#cbd5e1" ${S}/><rect x="${x - 8.5}" y="${y - 21}" width="17" height="3.5" fill="#94a3b8" ${S}/>`;
    default: return '';
  }
}

function vehicle(v) {
  const x = roadX(v.slot), y = ROAD, f = c(v.color);
  const wheel = (wx) => `<circle cx="${wx}" cy="${y - 8}" r="8" fill="${INK}"/><circle cx="${wx}" cy="${y - 8}" r="3" fill="#e5e7eb"/>`;
  let o = '', top = y - 44;
  if (v.kind === 'car') {
    o += `<path d="M${x - 24} ${y - 26}l8 -15h30l10 15z" fill="${f}" ${S}/><path d="M${x - 17} ${y - 27}l5 -10h10v10zM${x + 2} ${y - 27}v-10h10l7 10z" fill="#eef2f7" ${S}/><rect x="${x - 42}" y="${y - 27}" width="84" height="18" rx="6" fill="${f}" ${S}/>${wheel(x - 24)}${wheel(x + 24)}`;
    top = y - 41;
  } else if (v.kind === 'van') {
    o += `<path d="M${x - 44} ${y - 9}v-33a5 5 0 0 1 5 -5h58l22 18v20z" fill="${f}" ${S}/><path d="M${x + 16} ${y - 42}h3l15 12h-18z" fill="#eef2f7" ${S}/>${wheel(x - 24)}${wheel(x + 24)}`;
    top = y - 47;
  } else if (v.kind === 'bus') {
    o += `<rect x="${x - 52}" y="${y - 56}" width="104" height="47" rx="7" fill="${f}" ${S}/>`;
    for (let k = 0; k < 5; k++) o += `<rect x="${x - 46 + k * 19}" y="${y - 49}" width="15" height="15" fill="#eef2f7" ${S}/>`;
    o += `${wheel(x - 30)}${wheel(x + 30)}`;
    top = y - 56;
  } else if (v.kind === 'truck') {
    o += `<rect x="${x - 50}" y="${y - 54}" width="62" height="45" fill="#f8fafc" ${S}/><path d="M${x + 12} ${y - 9}v-31h22l14 14v17z" fill="${f}" ${S}/><path d="M${x + 22} ${y - 35}h10l9 9h-19z" fill="#eef2f7" ${S}/>${wheel(x - 30)}${wheel(x + 28)}`;
    top = y - 40;
  }
  if (v.rack) {
    const rx = v.kind === 'van' ? x - 30 : x - 14, rw = v.kind === 'van' ? 44 : 28;
    o += `<path d="M${rx} ${top}v-4M${rx + rw} ${top}v-4M${rx - 3} ${top - 4}h${rw + 6}" stroke="${INK}" stroke-width="1.5" fill="none"/><rect x="${rx + 3}" y="${top - 13}" width="${rw - 6}" height="9" fill="#e7c9a0" ${S}/>`;
  }
  return o;
}

function sky(scene) {
  const k = scene.sky || {};
  let o = '';
  if (k.sun != null) o += `<circle cx="${skyX(k.sun)}" cy="30" r="15" fill="#fde047" ${S}/>`;
  for (const s of k.clouds || []) { const x = skyX(s); o += `<path d="M${x - 20} 40a8 8 0 0 1 4 -15a11 11 0 0 1 21 -3a9 9 0 0 1 13 9a7 7 0 0 1 -2 9z" fill="#ffffff" ${S}/>`; }
  if (k.birds) {
    const x = skyX(k.birds.slot), pos = [[-18, 16], [0, 10], [18, 18], [-10, 32], [10, 34], [0, 46]];
    for (let i = 0; i < k.birds.n; i++) { const [dx, dy] = pos[i]; o += `<path d="M${x + dx - 7} ${dy + 3}q4 -6 7 0q3 -6 7 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; }
  }
  if (k.flyer) {
    const x = skyX(k.flyer.slot), f = c(k.flyer.color);
    if (k.flyer.kind === 'plane') o += `<path d="M${x - 22} 30h34a8 5 0 0 1 0 10h-30z" fill="#ffffff" ${S}/><path d="M${x - 22} 30l-5 -9h7l6 9zM${x - 4} 37l-8 10h7l11 -10z" fill="#cbd5e1" ${S}/>`;
    else if (k.flyer.kind === 'balloon') o += `<path d="M${x - 5} 44l-8 -13M${x + 5} 44l8 -13" stroke="${INK}"/><circle cx="${x}" cy="22" r="16" fill="${f}" ${S}/><rect x="${x - 5}" y="44" width="10" height="8" fill="#e7c9a0" ${S}/>`;
    else if (k.flyer.kind === 'kite') o += `<path d="M${x} 44q8 8 -2 14q-8 6 2 12" stroke="${INK}" fill="none"/><path d="M${x} 8l13 16l-13 20l-13 -20z" fill="${f}" ${S}/><path d="M${x} 8v36M${x - 13} 24h26" stroke="${INK}" fill="none"/>`;
  }
  return o;
}

// pins: [[x, y], ...] numbered from 1, drawn over the scene on the reveal.
export function sceneSvg(scene, { pins = null, label = 'Street scene' } = {}) {
  let o = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}" viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;font-family:'Manrope',system-ui,sans-serif">`;
  o += `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="#ffffff" ${S}/>`;
  o += `<rect x="1" y="${BASE}" width="${W - 2}" height="${306 - BASE}" fill="#f3f4f6"/><rect x="1" y="306" width="${W - 2}" height="${H - 307}" fill="#e2e5ea"/><line x1="1" y1="306" x2="${W - 1}" y2="306" stroke="${INK}"/>`;
  o += sky(scene);
  scene.shops.forEach((_, i) => { o += shop(scene, i); });
  o += `<line x1="1" y1="${BASE}" x2="${W - 1}" y2="${BASE}" stroke="${INK}"/>`;
  for (const it of [...scene.walk].sort((a, b) => a.slot - b.slot)) o += walkItem(it);
  for (const v of scene.road) o += vehicle(v);
  if (pins) pins.forEach(([px, py], i) => { o += `<circle cx="${px}" cy="${py}" r="10" fill="${INK}" stroke="#ffffff" stroke-width="1.5"/><text x="${px}" y="${py + 4}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#ffffff">${i + 1}</text>`; });
  return o + '</svg>';
}

// How many separate things the scene shows (the weekly detail ramp is stated
// and checked in this number).
export function objectCount(scene) {
  const k = scene.sky || {};
  return scene.shops.length + scene.shops.filter((s) => s.clock).length + scene.walk.length + scene.road.length
    + (k.sun != null ? 1 : 0) + (k.clouds || []).length + (k.birds ? k.birds.n : 0) + (k.flyer ? 1 : 0);
}

// Names the questions use for the sidewalk things and the flyers.
export const WALK_NAMES = { person: 'A person', dog: 'A dog', cat: 'A cat', bike: 'A bicycle', bench: 'A bench', lamp: 'A street lamp', hydrant: 'A fire hydrant', mailbox: 'A mailbox', tree: 'A tree', stop: 'A bus stop sign', bin: 'A trash can' };
export const FLYER_NAMES = { plane: 'A plane', balloon: 'A hot air balloon', kite: 'A kite' };
export const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase();
