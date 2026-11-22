'use client';

// Colossus and Mammoth: the massive sudokus (owner, 2026-11-21). One enormous
// board of overlapping sudokus (9x9 on Colossus, 6x6 on Mammoth); see lib/mega.js
// for the rules and app/api/mega/route.js for the crowd. This one client plays
// both: `game` picks the size, the name and the colours.
//
// Everyone plays their own copy. Nothing says a digit is right until a whole
// sudoku is full; then the server answers solved or not, and a solved one locks
// and a small note names who else has it. Counts and names stay hidden for any
// sudoku this player has not solved. No clock and no Give up, as on Search.
//
// The board is a fixed full-screen layer drawn on a canvas, only the squares
// in view. Drag to move, pinch or wheel to zoom, tap a square and then a digit.

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MEGA, megaLayout, megaHouses, megaValue, MEGA_POT } from '@/lib/mega';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const REFRESH_MS = 120000;
const LOOKS = {
  colossus: {
    light: { acc: '#9a3412', tint: '#fbd9c2', done: '#fbf1e8' },
    dark: { acc: '#fdba74', tint: '#5c3516', done: '#2a2119' },
  },
  mammoth: {
    light: { acc: '#1e4fa3', tint: '#cfdffa', done: '#edf3fd' },
    dark: { acc: '#93c5fd', tint: '#203c66', done: '#18232f' },
  },
};
const BASE = {
  light: { bg: '#eef1f6', cell: '#ffffff', ink: '#0b0d12', ink2: '#3f4757', line: 'rgba(11,15,26,.16)', line3: 'rgba(11,15,26,.5)', peer: '#e7ebf2', c2: '#bcc5d3', c3: '#8e99ab', frame: '#d08a00' },
  dark: { bg: '#0b0f1a', cell: '#1a1d28', ink: '#e9edf4', ink2: '#aab5c7', line: 'rgba(255,255,255,.13)', line3: 'rgba(255,255,255,.45)', peer: '#242938', c2: '#454e63', c3: '#6a7590', frame: '#fbbf24' },
};

function getAnonId() {
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch (e) { return null; }
}
function getEmail() {
  try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); return j && j.email ? String(j.email) : undefined; } catch (e) { return undefined; }
}
function whenText(t) {
  try {
    const d = new Date(t);
    const day = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' });
    const tm = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).replace(':00', '').replace(' ', '').toLowerCase();
    return `${day} ${tm} ET`;
  } catch (e) { return ''; }
}
function ago(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 50) return 'just now';
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} hr ago`;
}
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const ord = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

export default function MegaClient({ game, board, win, currentNum, past = [] }) {
  const META = MEGA[game];
  const NAME = META.name;
  const STORE = `sot_${game}_${board.num}`;
  const VIEW = `sot_${game}_view_${board.num}`;

  // The board, built once: the weave, each square's peers, the printed digits.
  const G = useMemo(() => {
    const L = megaLayout(game, board.A, board.B);
    const given = Uint8Array.from(board.given, Number);
    const peerSets = Array.from({ length: L.T }, () => new Set());
    L.grids.forEach((_, id) => { for (const h of megaHouses(L, id)) for (const x of h) for (const y of h) if (x !== y) peerSets[x].add(y); });
    return {
      ...L, given, peers: peerSets.map((s) => [...s]), cov: L.cellGrids.map((g) => g.length),
      val: new Uint8Array(L.T), notes: new Uint16Array(L.T), done: new Uint8Array(L.grids.length), doneAt: new Map(),
      hl: new Uint8Array(L.T), sel: -1, cur: -1, s: 0, ox: 0, oy: 0, asked: new Map(), waiting: new Set(),
    };
  }, [game, board]);
  const SUD = G.grids.length;

  const [closedNow, setClosedNow] = useState(false);
  const closesAt = win && win.closes;
  const live = !closedNow && !(closesAt && closesAt <= Date.now());
  const isCurrent = board.num === currentNum;

  const [theme, setTheme] = useState('light');
  const [crowd, setCrowd] = useState(null);
  const [me, setMe] = useState(null);
  const [panel, setPanel] = useState(null); // 'standings' | 'help' | 'final'
  const [toast, setToast] = useState(null);
  const [noteMode, setNoteMode] = useState(false);
  const [mapMode, setMapMode] = useState(0); // 0 small, 1 large, 2 hidden
  const [hydrated, setHydrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [, setRev] = useState(0);
  const bump = useCallback(() => setRev((x) => x + 1), []);

  const stageRef = useRef(null);
  const cvRef = useRef(null);
  const mapRef = useRef(null);
  const ptrs = useRef(new Map());
  const gest = useRef({ moved: false, pinch: null, down: null });
  const toastT = useRef(null);
  const themeRef = useRef(theme); themeRef.current = theme;
  const crowdRef = useRef(crowd); crowdRef.current = crowd;
  const meRef = useRef(me); meRef.current = me;
  const liveRef = useRef(live); liveRef.current = live;
  const noteRef = useRef(noteMode); noteRef.current = noteMode;
  const mapModeRef = useRef(mapMode); mapModeRef.current = mapMode;
  const panelRef = useRef(panel); panelRef.current = panel;
  const raf = useRef(0);

  const digit = (i) => (G.given[i] ? G.given[i] : G.val[i]);
  const isDone = (i) => { for (const g of G.cellGrids[i]) if (G.done[g]) return true; return false; };
  const editable = (i) => i >= 0 && !G.given[i] && !isDone(i);

  // ---- saves ----------------------------------------------------------------
  const save = useCallback(() => {
    try {
      const notes = {};
      for (let i = 0; i < G.T; i++) if (G.notes[i]) notes[i] = G.notes[i];
      const done = []; for (let g = 0; g < SUD; g++) if (G.done[g]) done.push(g);
      localStorage.setItem(STORE, JSON.stringify({ v: 1, val: Array.from(G.val).join(''), notes, done }));
    } catch (e) {}
  }, [G, STORE, SUD]);
  const saveView = useCallback(() => {
    try { localStorage.setItem(VIEW, JSON.stringify({ s: G.s, ox: G.ox, oy: G.oy, cur: G.cur })); } catch (e) {}
  }, [G, VIEW]);

  function say(t, ms = 6500) {
    setToast(t);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), ms);
  }

  // ---- the canvas ---------------------------------------------------------------
  const draw = useCallback(() => {
    raf.current = 0;
    const cv = cvRef.current, st = stageRef.current;
    if (!cv || !st || !G.s) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const vw = st.clientWidth, vh = st.clientHeight;
    if (cv.width !== Math.round(vw * dpr) || cv.height !== Math.round(vh * dpr)) { cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); }
    const cx = cv.getContext('2d');
    const P = { ...BASE[themeRef.current], ...LOOKS[game][themeRef.current] };
    const { W, H, N, bh, bw, s, ox, oy } = G;
    window.__megaView = G; // read by the browser test harness
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.fillStyle = P.bg; cx.fillRect(0, 0, vw, vh);
    const c0 = Math.max(0, Math.floor(-ox / s)), c1 = Math.min(W - 1, Math.floor((vw - ox) / s));
    const r0 = Math.max(0, Math.floor(-oy / s)), r1 = Math.min(H - 1, Math.floor((vh - oy) / s));
    const big = s >= 13, fs = Math.round(s * 0.58);
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const i = r * W + c; if (!G.cov[i]) continue;
      const x = ox + c * s, y = oy + r * s, dn = isDone(i);
      let f;
      if (!big) f = dn ? P.acc : G.given[i] ? P.c2 : G.val[i] ? P.c3 : P.cell;
      else { f = dn ? P.done : P.cell; if (G.hl[i]) f = P.peer; if (i === G.sel) f = P.tint; }
      cx.fillStyle = f; cx.fillRect(x, y, s + 0.5, s + 0.5);
      if (s >= 7) { cx.strokeStyle = P.line; cx.lineWidth = 1; cx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, s, s); }
      if (big) {
        const d = digit(i);
        if (d) {
          cx.fillStyle = G.given[i] ? P.ink : P.acc;
          cx.font = `${G.given[i] || dn ? 800 : 600} ${fs}px ${SANS}`;
          cx.fillText(d, x + s / 2, y + s / 2 + 1);
        } else if (G.notes[i] && s >= 24) {
          cx.fillStyle = P.ink2; cx.font = `600 ${Math.round(s * 0.24)}px ${SANS}`;
          for (let k = 1; k <= N; k++) if (G.notes[i] & (1 << k)) cx.fillText(k, x + s * (((k - 1) % 3) + 0.5) / 3, y + s * (Math.floor((k - 1) / 3) + 0.5) / 3 + 0.5);
        }
      }
    }
    G.pos.forEach(([gr, gc], id) => {
      const x = Math.round(ox + gc * s), y = Math.round(oy + gr * s), w = Math.round(N * s);
      if (x > vw || y > vh || x + w < 0 || y + w < 0) return;
      if (s >= 7) {
        cx.strokeStyle = P.line3; cx.lineWidth = 1; cx.beginPath();
        for (let k = bw; k < N; k += bw) { const p = Math.round(k * s) + 0.5; cx.moveTo(x + p, y); cx.lineTo(x + p, y + w); }
        for (let k = bh; k < N; k += bh) { const p = Math.round(k * s) + 0.5; cx.moveTo(x, y + p); cx.lineTo(x + w, y + p); }
        cx.stroke();
      }
      cx.strokeStyle = P.ink; cx.lineWidth = id === G.cur && big ? 3 : s >= 7 ? 2 : 1;
      cx.strokeRect(x + 0.5, y + 0.5, w, w);
    });
    // the map: this player's own progress only
    const mp = mapRef.current;
    if (mp && mapModeRef.current !== 2) {
      const m = Math.max(1, Math.floor((mapModeRef.current === 1 ? 300 : 172) / W));
      if (mp.width !== W * m || mp.height !== H * m) { mp.width = W * m; mp.height = H * m; mp.style.width = `${W * m}px`; mp.style.height = `${H * m}px`; }
      const mx = mp.getContext('2d');
      mx.fillStyle = P.bg; mx.fillRect(0, 0, mp.width, mp.height);
      for (let i = 0; i < G.T; i++) {
        if (!G.cov[i]) continue;
        mx.fillStyle = isDone(i) ? P.acc : G.given[i] ? P.c2 : G.val[i] ? P.c3 : P.cell;
        mx.fillRect((i % W) * m, Math.floor(i / W) * m, m, m);
      }
      mx.strokeStyle = P.frame; mx.lineWidth = 2; mx.strokeRect((-ox / s) * m, (-oy / s) * m, (vw / s) * m, (vh / s) * m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [G, game]);
  const redraw = useCallback(() => { if (!raf.current) raf.current = requestAnimationFrame(draw); }, [draw]);

  const size = () => { const st = stageRef.current; return st ? [st.clientWidth, st.clientHeight] : [0, 0]; };
  const fitScale = () => { const [vw, vh] = size(); return Math.min((vw - 16) / G.W, (vh - 16) / G.H); };
  const startScale = () => { const [vw, vh] = size(); return Math.max(24, Math.min(G.N === 6 ? 52 : 40, (Math.min(vw, vh) - 20) / (G.N + 0.6))); };
  const clamp = () => { const [vw, vh] = size(); const m = 60; G.ox = Math.min(vw - m, Math.max(m - G.W * G.s, G.ox)); G.oy = Math.min(vh - m, Math.max(m - G.H * G.s, G.oy)); };
  const zoomAt = (px, py, ns) => {
    ns = Math.max(fitScale() * 0.9, Math.min(72, ns));
    const bx = (px - G.ox) / G.s, by = (py - G.oy) / G.s;
    G.s = ns; G.ox = px - bx * ns; G.oy = py - by * ns; clamp(); redraw(); saveView();
  };
  const centerOn = (r, c) => { const [vw, vh] = size(); G.ox = vw / 2 - c * G.s; G.oy = vh / 2 - r * G.s; clamp(); redraw(); saveView(); };
  const zoomBtn = (k) => { const [vw, vh] = size(); zoomAt(vw / 2, vh / 2, G.s * k); };
  const fit = () => { const [vw, vh] = size(); G.s = fitScale(); G.ox = (vw - G.W * G.s) / 2; G.oy = (vh - G.H * G.s) / 2; redraw(); saveView(); };

  // ---- load ---------------------------------------------------------------------
  useEffect(() => {
    try { if (localStorage.getItem('sot_theme2') === 'dark') setTheme('dark'); } catch (e) {}
    try {
      const sv = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (sv && sv.v === 1 && typeof sv.val === 'string' && sv.val.length === G.T) {
        for (let i = 0; i < G.T; i++) if (!G.given[i] && G.cov[i]) G.val[i] = Number(sv.val[i]) || 0;
        for (const k of Object.keys(sv.notes || {})) G.notes[Number(k)] = Number(sv.notes[k]) || 0;
        // `done` is confirmed again by the server below; until then they are plain fills.
      }
    } catch (e) {}
    let v = null;
    try { v = JSON.parse(localStorage.getItem(VIEW) || 'null'); } catch (e) { v = null; }
    const [vw, vh] = size();
    if (v && v.s > 0) { G.s = v.s; G.ox = v.ox; G.oy = v.oy; G.cur = Number.isInteger(v.cur) ? v.cur : -1; clamp(); }
    else {
      // A first visit opens zoomed in on a sudoku of its own, away from the
      // edge, so the crowd does not all start in one corner.
      const inside = G.pos.map((p, id) => id).filter((id) => { const [r, c] = G.pos[id]; return r > 0 && c > 0 && r < G.H - G.N && c < G.W - G.N; });
      const g0 = inside.length ? inside[Math.floor(Math.random() * inside.length)] : 0;
      G.cur = g0; G.s = startScale();
      G.ox = vw / 2 - (G.pos[g0][1] + G.N / 2) * G.s; G.oy = vh / 2 - (G.pos[g0][0] + G.N / 2) * G.s; clamp();
    }
    if (window.innerWidth < 720) setMapMode(2); // a phone opens with the map tucked away
    setHydrated(true);
    redraw();
    const onR = () => { clamp(); redraw(); };
    window.addEventListener('resize', onR);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw).catch(() => {});
    return () => window.removeEventListener('resize', onR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { redraw(); }, [theme, mapMode, redraw]);

  // ---- the crowd --------------------------------------------------------------
  const loadCrowd = useCallback(async (manual) => {
    if (manual) setRefreshing(true);
    try {
      const r = await fetch(`/api/mega?game=${game}&board=${board.num}${manual ? `&r=${Math.floor(Date.now() / 30000)}` : ''}`);
      const d = await r.json();
      if (d && !d.error && Array.isArray(d.counts)) { setCrowd(d); if (d.closed) setClosedNow(true); }
    } catch (e) {}
    if (manual) setTimeout(() => setRefreshing(false), 400);
  }, [game, board.num]);
  useEffect(() => {
    loadCrowd(false);
    const iv = setInterval(() => { if (document.visibilityState !== 'hidden') loadCrowd(false); }, REFRESH_MS);
    const t = setInterval(bump, 15000);
    return () => { clearInterval(iv); clearInterval(t); };
  }, [loadCrowd, bump]);

  // How many players have solved sudoku g, counting this player once.
  const countOf = (g) => {
    const c = crowdRef.current;
    const base = c ? c.counts[g] || 0 : 0;
    if (!G.done[g] || !liveRef.current) return base;
    const at = G.doneAt.get(g) || 0;
    // The crowd counts a solve once it was computed after the solve reached the server.
    const counted = c && (c.at > at + 3000 || (c.by[g] || []).some((p) => p[0] === meRef.current));
    return counted ? Math.max(1, base) : base + 1;
  };
  const othersOf = (g) => {
    const c = crowdRef.current;
    const list = c ? (c.by[g] || []).filter((p) => p[0] !== meRef.current).map((p) => p[1]) : [];
    const n = Math.max(list.length, countOf(g) - 1);
    return { names: list.slice(0, 3), n };
  };
  function whoLine(g) {
    const { names, n } = othersOf(g);
    if (!n) return 'You are the first to solve it.';
    if (!names.length) return `${fmt(n)} other ${n === 1 ? 'player has' : 'players have'} solved it.`;
    const rest = n - names.length;
    if (!rest) {
      if (names.length === 1) return `Also solved by ${names[0]}.`;
      if (names.length === 2) return `Also solved by ${names[0]} and ${names[1]}.`;
      return `Also solved by ${names[0]}, ${names[1]}, and ${names[2]}.`;
    }
    return `Also solved by ${names.join(', ')}, and ${fmt(rest)} ${rest === 1 ? 'other' : 'others'}.`;
  }

  // ---- talking to the server ----------------------------------------------------
  const applyServer = useCallback((d) => {
    if (d.me) setMe(d.me);
    let changed = false;
    for (const g of d.solved || []) {
      const ds = d.digits && d.digits[g];
      if (ds) G.grids[g].forEach((x, k) => { if (!G.given[x]) G.val[x] = Number(ds[k]); });
      if (!G.done[g]) { G.done[g] = 1; changed = true; }
    }
    return changed;
  }, [G]);
  const post = useCallback(async (extra) => {
    const body = JSON.stringify({ game, board: board.num, anonId: getAnonId(), email: getEmail(), ...extra });
    const r = await fetch('/api/mega', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body });
    return r.json();
  }, [game, board.num]);

  // A full sudoku goes to the server: solved, or something is off.
  const offer = useCallback(async (g) => {
    if (G.done[g] || G.waiting.has(g)) return;
    const d = G.grids[g].map((x) => digit(x)).join('');
    if (d.includes('0') || G.asked.get(g) === d) return;
    G.waiting.add(g);
    try {
      const res = await post({ solve: { g, d } });
      if (!res || res.error) throw new Error('no answer');
      G.asked.set(g, d);
      if (res.ok) {
        G.done[g] = 1; G.doneAt.set(g, Date.now());
        applyServer(res);
        const n = countOf(g);
        say({ title: `Sudoku ${g + 1} solved`, line: `${whoLine(g)} It pays about ${megaValue(n)} right now.`, good: true }, 7500);
      } else {
        say({ title: `Sudoku ${g + 1} is full, but something is off`, line: 'Keep working. There is no penalty.' });
      }
      save(); showSel(); bump(); redraw();
    } catch (e) {
      say({ title: 'Could not check that sudoku', line: 'It will try again in a moment.' });
    }
    G.waiting.delete(g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [G, post, applyServer, save, bump, redraw]);

  // On arrival: what this player has already solved (another device, a cleared
  // browser), and any full sudoku left unchecked.
  useEffect(() => {
    if (!hydrated) return undefined;
    let dead = false;
    (async () => {
      try {
        const d = await post({});
        if (dead || !d || d.error) return;
        applyServer(d); save(); bump(); redraw();
      } catch (e) {}
      for (let g = 0; g < SUD; g++) if (!G.done[g] && G.grids[g].every((x) => digit(x))) offer(g);
    })();
    const iv = setInterval(() => { for (let g = 0; g < SUD; g++) if (!G.done[g] && !G.asked.has(g) && G.grids[g].every((x) => digit(x))) offer(g); }, 15000);
    const onHide = () => { if (document.visibilityState === 'hidden' && liveRef.current && G.done.some((x) => x)) post({ force: true }).catch(() => {}); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => { dead = true; clearInterval(iv); document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', onHide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // The closing screen opens by itself, once, when a board is over.
  const finalShown = useRef(false);
  useEffect(() => {
    if (!live && crowd && crowd.closed && !finalShown.current) { finalShown.current = true; setPanel('final'); }
  }, [live, crowd]);

  // ---- play ---------------------------------------------------------------------
  const [selInfo, setSelInfo] = useState(null);
  function showSel() {
    if (G.sel < 0 || G.cur < 0) { setSelInfo(null); return; }
    const g = G.cur;
    setSelInfo({ g, done: !!G.done[g], left: G.grids[g].filter((x) => !digit(x)).length });
  }
  function select(i) {
    G.sel = i; G.hl.fill(0);
    if (i >= 0) {
      if (!G.cellGrids[i].includes(G.cur)) G.cur = G.cellGrids[i][0];
      for (const k of G.peers[i]) G.hl[k] = 1;
    }
    showSel(); redraw(); saveView();
  }
  function autoMove() {
    const cells = G.grids[G.cur]; if (!cells) return;
    const k = cells.indexOf(G.sel);
    for (let j = 1; j <= cells.length; j++) { const x = cells[(k + j) % cells.length]; if (!digit(x)) { select(x); return; } }
    showSel(); redraw();
  }
  function place(d) {
    const i = G.sel;
    if (!editable(i) || d < 1 || d > G.N) return;
    if (noteRef.current) { if (!G.val[i]) { G.notes[i] ^= 1 << d; save(); redraw(); } return; }
    G.val[i] = G.val[i] === d ? 0 : d;
    save();
    if (G.val[i]) { for (const g of G.cellGrids[i]) offer(g); autoMove(); } else { showSel(); redraw(); }
    bump();
  }
  function erase() {
    const i = G.sel; if (!editable(i)) return;
    G.val[i] = 0; G.notes[i] = 0; save(); showSel(); redraw(); bump();
  }

  const xy = (e) => { const b = cvRef.current.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  function onDown(e) {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) {}
    const [x, y] = xy(e);
    ptrs.current.set(e.pointerId, { x, y });
    if (ptrs.current.size === 1) { gest.current.moved = false; gest.current.down = { x, y }; }
    if (ptrs.current.size === 2) { const [a, b] = [...ptrs.current.values()]; gest.current.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: G.s }; gest.current.moved = true; }
  }
  function onMove(e) {
    const p = ptrs.current.get(e.pointerId); if (!p) return;
    const [x, y] = xy(e); const dx = x - p.x, dy = y - p.y; p.x = x; p.y = y;
    if (ptrs.current.size === 2 && gest.current.pinch) {
      const [a, b] = [...ptrs.current.values()];
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, gest.current.pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / gest.current.pinch.d);
      return;
    }
    if (ptrs.current.size === 1) {
      if (!gest.current.moved && Math.hypot(x - gest.current.down.x, y - gest.current.down.y) < 7) return;
      gest.current.moved = true; G.ox += dx; G.oy += dy; clamp(); redraw();
    }
  }
  function onUp(e) {
    if (!ptrs.current.has(e.pointerId)) return;
    const [x, y] = xy(e);
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size < 2) gest.current.pinch = null;
    if (gest.current.moved) { saveView(); return; }
    if (ptrs.current.size === 0 && e.type === 'pointerup') {
      const c = Math.floor((x - G.ox) / G.s), r = Math.floor((y - G.oy) / G.s);
      if (c >= 0 && c < G.W && r >= 0 && r < G.H && G.cov[r * G.W + c]) {
        if (G.s < 13) { G.s = startScale(); centerOn(r + 0.5, c + 0.5); }
        select(r * G.W + c);
      } else select(-1);
    }
  }
  function onWheel(e) { const [x, y] = xy(e); zoomAt(x, y, G.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }
  function onMap(e) {
    const b = mapRef.current.getBoundingClientRect();
    centerOn(((e.clientY - b.top) / b.height) * G.H, ((e.clientX - b.left) / b.width) * G.W);
  }
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return undefined;
    const w = (e) => { e.preventDefault(); onWheel(e); };
    cv.addEventListener('wheel', w, { passive: false });
    const key = (e) => {
      if (panelRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA') return;
      if (e.key >= '1' && e.key <= '9') { place(Number(e.key)); return; }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { erase(); return; }
      if (e.key === 'n' || e.key === 'N') { setNoteMode((v) => !v); return; }
      const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
      if (!mv || G.sel < 0) return;
      e.preventDefault();
      let r = Math.floor(G.sel / G.W) + mv[0], c = (G.sel % G.W) + mv[1];
      while (r >= 0 && r < G.H && c >= 0 && c < G.W) {
        if (G.cov[r * G.W + c]) {
          select(r * G.W + c);
          const [vw, vh] = size(); const x = G.ox + (c + 0.5) * G.s, y = G.oy + (r + 0.5) * G.s;
          if (x < G.s || y < G.s || x > vw - G.s || y > vh - G.s) centerOn(r + 0.5, c + 0.5);
          return;
        }
        r += mv[0]; c += mv[1];
      }
    };
    window.addEventListener('keydown', key);
    return () => { cv.removeEventListener('wheel', w); window.removeEventListener('keydown', key); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [G]);

  function toggleTheme() {
    const n = theme === 'dark' ? 'light' : 'dark';
    setTheme(n);
    try { localStorage.setItem('sot_theme2', n); } catch (e) {}
  }

  // ---- the numbers in the header --------------------------------------------------
  const mine = []; for (let g = 0; g < SUD; g++) if (G.done[g]) mine.push(g);
  const total = mine.length;
  const points = mine.reduce((a, g) => a + megaValue(countOf(g)), 0);
  let place_ = null;
  if (crowd && total) {
    let better = 0;
    for (const [pt, t] of crowd.field) if (pt > points || (pt === points && t > total)) better++;
    const inField = crowd.standings.some((s) => s.id === me);
    place_ = { at: better + 1, of: Math.max(crowd.players + (inField ? 0 : 1), better + 1) };
  }
  let windowText = '';
  if (win) {
    if (!live) windowText = closesAt ? `Closed ${whenText(closesAt)}` : 'Closed';
    else if (closesAt) windowText = `Closes ${whenText(closesAt)}`;
    else if (!isCurrent) windowText = '';
    else windowText = Date.now() < win.min
      ? `Open until every sudoku is solved, ${whenText(win.min)} at the earliest`
      : `Closes when every sudoku is solved, ${whenText(win.cap)} at the latest`;
  }
  const dark = theme === 'dark';

  const css = `
.mga{--page:#eef1f6;--card:#ffffff;--ink:#0b0d12;--mute:#5f6774;--line:#0b0d12;--soft:#e4e9f1;--acc:${LOOKS[game].light.acc};--tint:${LOOKS[game].light.tint};}
.mga[data-theme='dark']{--page:#0b0f1a;--card:#0e131f;--ink:#e9edf4;--mute:#8b95a8;--line:#e9edf4;--soft:#252b36;--acc:${LOOKS[game].dark.acc};--tint:${LOOKS[game].dark.tint};}
.mga *{box-sizing:border-box}
.mga{position:fixed;inset:0;z-index:900;display:grid;grid-template-rows:auto 1fr auto;background:var(--page);color:var(--ink);font-family:${SANS};-webkit-font-smoothing:antialiased;overscroll-behavior:none}
.mga button{font-family:inherit;color:inherit}
.mga .top{display:flex;align-items:center;gap:8px 16px;padding:8px 14px;border-bottom:1px solid var(--line);flex-wrap:wrap;background:var(--card)}
.mga .logo{display:flex;align-items:center;gap:7px;font:800 15px/1.3 ${SANS};color:var(--ink);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px 5px 8px}
.mga .name{display:flex;flex-direction:column;line-height:1.2}
.mga .name b{font-size:19px;font-weight:800;letter-spacing:-.01em}
.mga .name span{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.mga .stats{display:flex;gap:14px;align-items:baseline;flex-wrap:wrap}
.mga .stats div{font:800 11.5px/1.4 ${SANS};letter-spacing:.08em;text-transform:uppercase;color:var(--mute);white-space:nowrap}
.mga .stats b{font:800 20px/1.3 ${SANS};color:var(--ink);font-variant-numeric:tabular-nums;letter-spacing:0;margin-right:4px}
.mga .sp{flex:1}
.mga .meta{font:700 12.5px/1.45 ${SANS};color:var(--mute);text-align:right}
.mga .btns{display:flex;gap:8px;flex-wrap:wrap}
.mga .pill{border:1px solid var(--line);background:var(--card);color:var(--ink);font:800 12.5px/1.3 ${SANS};border-radius:999px;padding:7px 13px;cursor:pointer;white-space:nowrap}
.mga .pill.on{background:var(--ink);color:var(--page)}
.mga .stage{position:relative;min-height:0;overflow:hidden}
.mga canvas.board{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.mga .toast{position:absolute;left:50%;top:12px;transform:translateX(-50%);min-width:240px;max-width:min(480px,calc(100% - 24px));background:var(--card);border:1px solid var(--line);border-radius:14px;padding:9px 16px 10px;box-shadow:0 8px 26px rgba(0,0,0,.16);text-align:center;pointer-events:none;animation:mgaIn .28s ease-out;z-index:2}
.mga .toast.good{background:var(--tint)}
.mga .toast b{display:block;font-size:15.5px;font-weight:800;line-height:1.35}
.mga .toast span{display:block;font-size:13px;font-weight:700;margin-top:1px;line-height:1.45}
@keyframes mgaIn{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
.mga .seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;background:var(--card);overflow:hidden}
.mga .seg button{-webkit-appearance:none;appearance:none;border:0;border-radius:0;margin:0;background:transparent;font:800 13px/1.3 ${SANS};padding:8px 14px;cursor:pointer;white-space:nowrap}
.mga .seg button+button{border-left:1px solid var(--line)}
.mga .seg button.on{background:var(--ink);color:var(--page)}
.mga .zoom{position:absolute;left:12px;bottom:12px;box-shadow:0 2px 10px rgba(0,0,0,.12)}
.mga .zoom button{font-size:15px;min-width:44px;height:40px;padding:0 12px}
.mga .mapbox{position:absolute;right:12px;top:12px;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.12)}
.mga .mapbox button{display:block;width:100%;border:0;background:transparent;font:800 11.5px/1.3 ${SANS};padding:5px 10px;text-align:left;cursor:pointer;white-space:nowrap}
.mga .mapbox canvas{display:block;border-top:1px solid var(--line);cursor:pointer;max-width:none}
.mga .arch{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);background:var(--tint);color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:7px 14px;font:800 12.5px/1.3 ${SANS};white-space:nowrap}
.mga .arch a{color:inherit}
.mga .foot{background:var(--card);border-top:1px solid var(--line);padding:8px 10px 10px}
.mga .info{font:700 12.5px/1.5 ${SANS};color:var(--mute);min-height:19px;margin-bottom:6px;text-align:center}
.mga .info b{color:var(--ink);font-weight:800}
.mga .pad{display:grid;gap:5px;max-width:620px;margin:0 auto}
.mga .pad button{background:var(--card);border:1px solid var(--line);border-radius:10px;font:700 20px/1.25 ${SANS};padding:9px 0;cursor:pointer}
.mga .pad button:active{background:var(--tint)}
.mga .row2{display:flex;gap:8px;justify-content:center;margin-top:8px;flex-wrap:wrap}
.mga .sheet{position:absolute;top:10px;right:10px;bottom:10px;width:min(420px,calc(100% - 20px));background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;z-index:3}
.mga .sheet .hd{display:flex;align-items:center;gap:8px;padding:12px 14px 10px;border-bottom:1px solid var(--soft)}
.mga .sheet .hd h3{margin:0;font-size:17px;font-weight:800;flex:1;line-height:1.3}
.mga .sheet .x{border:1px solid var(--line);background:var(--card);border-radius:999px;width:32px;height:32px;cursor:pointer;font:800 16px/1 ${SANS}}
.mga .sheet .body{flex:1;overflow-y:auto;padding:8px 14px 14px;overscroll-behavior:contain;scrollbar-width:thin;margin-right:4px;margin-bottom:6px}
.mga table{width:100%;border-collapse:collapse;font-size:14px;font-weight:700}
.mga th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);text-align:right;padding:8px 4px;font-weight:800}
.mga th:nth-child(2),.mga td:nth-child(2){text-align:left}
.mga td{padding:8px 4px;border-bottom:1px solid var(--soft);text-align:right;font-variant-numeric:tabular-nums;line-height:1.35}
.mga td:nth-child(2){max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mga tr.me td{background:var(--tint)}
.mga .help p{margin:0 0 10px;font-size:14px;line-height:1.6;font-weight:600}
.mga .help b{font-weight:800}
.mga .fh{margin:16px 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:var(--mute)}
.mga .note{font-size:12.5px;color:var(--mute);font-weight:700;margin:10px 0 0;line-height:1.5}
.mga .note a,.mga .arch a{color:inherit;font-weight:800}
.mga .lnk{border:0;background:none;padding:0;font:inherit;text-decoration:underline;cursor:pointer;color:inherit}
.mga .mwin{display:none}
@media (max-width:719px){
  .mga .top{padding:7px 10px;gap:6px 10px}
  .mga .logo span{display:none}
  .mga .name b{font-size:17px}
  .mga .stats{gap:10px;order:5;width:100%;justify-content:space-between}
  .mga .stats b{font-size:17px}
  .mga .meta{display:none}
  .mga .mwin{display:block;order:6;width:100%;font:700 12px/1.4 ${SANS};color:var(--mute)}
  .mga .btns{gap:6px}
  .mga .pill{padding:6px 10px;font-size:12px}
  .mga .seg button{padding:8px 11px;font-size:12.5px}
  .mga .pad button{font-size:19px;padding:10px 0}
  .mga .toast{top:auto;bottom:62px}
  .mga .sheet{top:auto;left:0;right:0;bottom:0;width:auto;height:min(76%,580px);border-radius:16px 16px 0 0;border-bottom:0}
}
`;

  const standingsPanel = (
    <div className="sheet" role="dialog" aria-label="Standings">
      <div className="hd"><h3>Standings</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
      <div className="body">
        {!crowd ? <p className="note">Loading the standings...</p> : crowd.standings.length === 0 ? <p className="note">Nobody has solved a sudoku on this board yet. The first one is worth {MEGA_POT}.</p> : (
          <table>
            <thead><tr><th>#</th><th>Player</th><th>Points</th><th>Solved</th></tr></thead>
            <tbody>
              {crowd.standings.map((x) => (
                <tr key={x.id} className={x.id === me ? 'me' : ''}><td>{x.place}</td><td>{x.name}</td><td>{fmt(x.points)}</td><td>{fmt(x.total)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="note">{live ? `Points are an estimate until the board closes: every sudoku's ${MEGA_POT} is split among everyone who solves it by then.` : 'Final.'}{crowd ? ` Updated ${ago(Date.now() - crowd.at)}.` : ''}</p>
      </div>
    </div>
  );

  const finalPanel = (() => {
    const solo = [], none = [];
    if (crowd) for (let g = 0; g < SUD; g++) { if (crowd.counts[g] === 1) solo.push(g); else if (!crowd.counts[g]) none.push(g); }
    return (
      <div className="sheet" role="dialog" aria-label="Final results">
        <div className="hd"><h3>{NAME} No. {board.num}: final results</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
        <div className="body">
          {!crowd ? <p className="note">Loading the results...</p> : (
            <>
              <p className="note" style={{ marginTop: 4 }}>{crowd.solvedAt ? `Every one of the ${fmt(SUD)} sudokus was solved by somebody.` : `${fmt(crowd.crowdSolved)} of the ${fmt(SUD)} sudokus were solved before the 72 hour cap.`} {fmt(crowd.players)} {crowd.players === 1 ? 'player' : 'players'} took part.{total ? ` You solved ${fmt(total)} for ${fmt(points)} points${place_ ? `, ${ord(place_.at)} of ${fmt(place_.of)}` : ''}.` : ''}</p>
              <table>
                <thead><tr><th>#</th><th>Player</th><th>Points</th><th>Solved</th></tr></thead>
                <tbody>
                  {crowd.standings.slice(0, 10).map((x) => (
                    <tr key={x.id} className={x.id === me ? 'me' : ''}><td>{x.place}</td><td>{x.name}</td><td>{fmt(x.points)}</td><td>{fmt(x.total)}</td></tr>
                  ))}
                </tbody>
              </table>
              {solo.length > 0 && (<>
                <h4 className="fh">Solved by one player only</h4>
                <p className="note" style={{ marginTop: 0 }}>{solo.slice(0, 80).map((g) => `No. ${g + 1} (${(crowd.by[g][0] || [])[1] || 'a guest'})`).join(', ')}</p>
              </>)}
              {none.length > 0 && (<>
                <h4 className="fh">Nobody solved</h4>
                <p className="note" style={{ marginTop: 0 }}>{none.slice(0, 120).map((g) => `No. ${g + 1}`).join(', ')}</p>
              </>)}
              {!isCurrent && <p className="note"><a href={`/${game}`}>Play the open board &rarr;</a></p>}
              {past.length > 0 && <p className="note">Other boards: {past.slice(0, 12).map((b, k) => <span key={b.num}>{k ? ', ' : ''}<a href={`/${game}?b=${b.num}`}>No. {b.num}</a></span>)}</p>}
            </>
          )}
        </div>
      </div>
    );
  })();

  const helpPanel = (
    <div className="sheet" role="dialog" aria-label="How to play">
      <div className="hd"><h3>How {NAME} works</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
      <div className="body help">
        <p><b>One enormous board, and everyone plays their own copy.</b> {NAME} is a field of {fmt(SUD)} sudokus, each {G.N} by {G.N}{G.N === 6 ? ' (the digits 1 to 6, in boxes two rows tall and three columns wide)' : ''}. Every sudoku shares each of its four corner boxes with a neighbor, so a digit in a shared corner counts in both, and each one you finish starts the four around it.</p>
        <p><b>To play:</b> tap an empty square, then a digit. Tap the same digit again to take it back, or use Erase. Notes are yours alone. Drag to move around, pinch or scroll to zoom, and the map jumps you anywhere.</p>
        <p><b>Nothing is marked right or wrong until a sudoku is full.</b> Fill all of one. If every digit is right it locks in. If not, it says something is off and you keep working. There is no penalty and no time out.</p>
        <p><b>Scoring:</b> every sudoku is a pot of <b>{MEGA_POT} points</b>, split evenly among everyone who solves it before the board closes. Solve one nobody else does and you keep all {MEGA_POT}; one that forty players solve pays 3. Nobody can take a sudoku from you, and it does not matter what hour you play.</p>
        <p><b>Who else solved a sudoku, and what it pays, stay hidden until you solve it.</b> Then a short note names them. The map shows only your own progress.</p>
        <p><b>How long it runs:</b> a board stays open until every sudoku on it has been solved by at least one player, no sooner than 24 hours and no later than 72. The next board opens the moment it closes, and the points lock. Your points count toward the day you solved each sudoku. No clock and no Give up.</p>
        <p>Every sudoku has exactly one solution and can be solved from its own printed digits, with logic alone.{game === 'mammoth' ? ' For the same idea in 9 by 9, play Colossus.' : ' For a bigger field of quick 6 by 6 sudokus, play Mammoth.'}</p>
      </div>
    </div>
  );

  let infoLine = <>Tap an empty square, then a digit. Drag to move, pinch or scroll to zoom.</>;
  if (selInfo) {
    const g = selInfo.g;
    if (selInfo.done) {
      const n = countOf(g);
      infoLine = <><b>Sudoku {g + 1}</b> · Solved. {n > 1 ? <>Shared with <b>{fmt(n - 1)}</b>, paying about <b>{megaValue(n)}</b></> : <>Only you so far, paying <b>{MEGA_POT}</b></>}</>;
    } else infoLine = <><b>Sudoku {g + 1}</b> · <b>{selInfo.left}</b> {selInfo.left === 1 ? 'square' : 'squares'} to go</>;
  }
  const mapLabel = ['Map: Small', 'Map: Large', 'Map: Hidden'][mapMode];

  return (
    <div className="mga" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="top">
        <a className="logo" href="/" aria-label="Back to Mind Loft home">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          <svg width="22" height="22" viewBox="0 0 26 26" aria-hidden="true"><path d="M3 22V11l10-8 10 8v11h-5v-8l-5 5-5-5v8z" fill="currentColor" /></svg>
          <span>Mind Loft</span>
        </a>
        <div className="name"><b>{NAME}</b><span>No. {board.num} · {fmt(SUD)} sudokus, {G.N}x{G.N}</span></div>
        <div className="stats">
          <div><b>{fmt(total)}</b>of {fmt(SUD)} solved</div>
          <div title={`Your points: each sudoku's ${MEGA_POT} split among its solvers. An estimate until the board closes.`}><b>{fmt(points)}</b>Points</div>
          <div title="Your place in the standings"><b>{place_ ? `#${fmt(place_.at)}` : '–'}</b>{place_ ? `of ${fmt(place_.of)}` : 'Place'}</div>
        </div>
        {windowText ? <div className="mwin">{windowText}</div> : null}
        <div className="sp" />
        <div className="meta">{crowd ? `${fmt(crowd.crowdSolved)} of ${fmt(SUD)} solved by someone · updated ${ago(Date.now() - crowd.at)}` : 'Counting the crowd'}{windowText ? <><br />{windowText}</> : null}</div>
        <div className="btns">
          <button className="pill" onClick={() => loadCrowd(true)} disabled={refreshing}>{refreshing ? 'Refreshing' : 'Refresh'}</button>
          <button className={'pill' + (panel === 'standings' ? ' on' : '')} onClick={() => setPanel(panel === 'standings' ? null : 'standings')}>Standings</button>
          <button className="pill" onClick={toggleTheme}>{dark ? 'Light' : 'Dark'}</button>
          <button className={'pill' + (panel === 'help' ? ' on' : '')} onClick={() => setPanel(panel === 'help' ? null : 'help')} aria-label="How to play">?</button>
        </div>
      </div>
      <div className="stage" ref={stageRef}>
        <canvas ref={cvRef} className="board" aria-label={`${NAME}: ${SUD} overlapping ${G.N} by ${G.N} sudokus`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onContextMenu={(e) => e.preventDefault()} />
        {toast && (
          <div className={'toast' + (toast.good ? ' good' : '')} aria-live="polite">
            <b>{toast.title}</b>
            <span>{toast.line}</span>
          </div>
        )}
        <div className="mapbox">
          <button onClick={() => setMapMode((m) => (m + 1) % 3)}>{mapLabel}</button>
          {mapMode !== 2 && <canvas ref={mapRef} onPointerDown={onMap} />}
        </div>
        <div className="seg zoom" role="group" aria-label="Zoom">
          <button onClick={() => zoomBtn(1 / 1.35)} aria-label="Zoom out">&minus;</button>
          <button onClick={fit} aria-label="Show the whole board">Fit</button>
          <button onClick={() => zoomBtn(1.35)} aria-label="Zoom in">+</button>
        </div>
        {!live && hydrated && (
          <div className="arch">This board is closed: play it for fun. <button className="lnk" onClick={() => setPanel('final')}>Final results</button>{!isCurrent && <> · <a href={`/${game}`}>The open board</a></>}</div>
        )}
        {panel === 'standings' && standingsPanel}
        {panel === 'help' && helpPanel}
        {panel === 'final' && finalPanel}
      </div>
      <div className="foot">
        <div className="info">{infoLine}</div>
        <div className="pad" style={{ gridTemplateColumns: `repeat(${G.N}, 1fr)` }}>
          {Array.from({ length: G.N }, (_, k) => <button key={k} onClick={() => place(k + 1)} aria-label={`Digit ${k + 1}`}>{k + 1}</button>)}
        </div>
        <div className="row2">
          <div className="seg" role="group" aria-label="Entry mode">
            <button className={noteMode ? '' : 'on'} onClick={() => setNoteMode(false)}>Digits</button>
            <button className={noteMode ? 'on' : ''} onClick={() => setNoteMode(true)}>Notes</button>
          </div>
          <button className="pill" onClick={erase}>Erase</button>
        </div>
      </div>
    </div>
  );
}
