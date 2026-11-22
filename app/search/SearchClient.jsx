'use client';

// Search: the enormous daily word search (owner, 2026-11-20). One big topic a
// day and hundreds of entries hidden in one huge grid. Everyone gets the same
// grid; the standings rank UNIQUE finds first (entries nobody else has found)
// and total finds second. Finding an entry shows how many players have found
// it, and Refresh (or the two-minute auto refresh) shows the crowd's latest.
//
// The board is a fixed full-screen layer drawn on a canvas, only the squares
// in view, so a 100 by 100 grid stays smooth on a phone. Mouse: drag across a
// word to circle it, wheel or trackpad to move around, Ctrl + wheel or the
// buttons to zoom, right drag to pan. Touch: drag to move around, pinch to
// zoom, and tap a word's first letter and then its last to circle it. Any
// stroke is graded from its letters alone (each entry is in the grid exactly
// once, scripts/verify-search.mjs). No clock and no Give up, as on Mural.

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { searchCells, searchIndex, searchValue, SEARCH_POT } from '@/lib/search';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const HUES = [200, 145, 32, 280, 350, 95, 175, 255, 15, 60, 320, 120];
const OCT = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
const REFRESH_MS = 120000;
const SYNC_MS = 12000;

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
function msToMidnightET() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const next = new Date(et); next.setHours(24, 0, 0, 0);
  return next - et;
}
function whenText(t) {
  try {
    const d = new Date(t);
    const day = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' });
    const tm = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).replace(':00', '').replace(' ', '').toLowerCase();
    return `${day} ${tm} ET`;
  } catch (e) { return ''; }
}
function fmtLeft(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}
function ago(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 50) return 'just now';
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} hr ago`;
}
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const ord = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

export default function SearchClient({ puzzle, win, currentNum, past = [] }) {
  const P = puzzle;
  const N = P.items.length;
  const SIZE = P.size;
  const STORE = `sot_search_${P.num}`;
  const VIEW = `sot_search_view_${P.num}`;
  const [closedNow, setClosedNow] = useState(false);
  const closesAt = win && win.closes;
  const live = !closedNow && !(closesAt && closesAt <= Date.now());
  const isCurrent = P.num === currentNum;
  const index = useMemo(() => searchIndex(P.items), [P]);

  const [theme, setTheme] = useState('light');
  const [found, setFound] = useState({}); // i -> [r0, c0, r1, c1, foundAtMs, syncedAtMs]
  const [crowd, setCrowd] = useState(null);
  const [me, setMe] = useState(null);
  const [myName, setMyName] = useState(null);
  const [panel, setPanel] = useState(null); // 'list' | 'standings' | 'help'
  const [toast, setToast] = useState(null);
  const [read, setRead] = useState('');
  const [anchor, setAnchor] = useState(null);
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const [listTab, setListTab] = useState('all');
  const [hydrated, setHydrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [narrow, setNarrow] = useState(false);

  const stageRef = useRef(null);
  const cvRef = useRef(null);
  const miniRef = useRef(null);
  const view = useRef({ s: 30, ox: 0, oy: 0 });
  const dragSel = useRef(null); // { r0, c0, r1, c1 }
  const ptrs = useRef(new Map());
  const gesture = useRef(null);
  const raf = useRef(0);
  const foundRef = useRef(found); foundRef.current = found;
  const anchorRef = useRef(anchor); anchorRef.current = anchor;
  const pulse = useRef(null);
  const miss = useRef(null);
  const toastT = useRef(null);
  const dirty = useRef(false);
  const themeRef = useRef(theme); themeRef.current = theme;
  const spaceDown = useRef(false);

  // ---- saves ----------------------------------------------------------------
  useEffect(() => {
    try { if (localStorage.getItem('sot_theme2') === 'dark') setTheme('dark'); } catch (e) {}
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (s && s.v === 1 && s.found) setFound(s.found);
    } catch (e) {}
    try {
      const v = JSON.parse(localStorage.getItem(VIEW) || 'null');
      if (v && v.s > 0) view.current = v; else view.current.init = true;
    } catch (e) { view.current.init = true; }
    setNarrow(window.innerWidth < 720);
    setHydrated(true);
    const onR = () => setNarrow(window.innerWidth < 720);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE, JSON.stringify({ v: 1, found })); } catch (e) {}
  }, [found, hydrated, STORE]);
  const saveView = useCallback(() => {
    try { const { s, ox, oy } = view.current; localStorage.setItem(VIEW, JSON.stringify({ s, ox, oy })); } catch (e) {}
  }, [VIEW]);

  // ---- the crowd --------------------------------------------------------------
  const loadCrowd = useCallback(async (manual) => {
    if (manual) setRefreshing(true);
    try {
      const r = await fetch(`/api/search?board=${P.num}${manual ? `&r=${Math.floor(Date.now() / 30000)}` : ''}`);
      const d = await r.json();
      if (d && !d.error && Array.isArray(d.counts)) {
        setCrowd(d);
        if (d.closed) setClosedNow(true);
      }
    } catch (e) {}
    if (manual) setTimeout(() => setRefreshing(false), 400);
  }, [P.num]);
  useEffect(() => {
    loadCrowd(false);
    const iv = setInterval(() => { if (document.visibilityState !== 'hidden') loadCrowd(false); }, REFRESH_MS);
    const t = setInterval(() => setTick((x) => x + 1), 15000);
    return () => { clearInterval(iv); clearInterval(t); };
  }, [loadCrowd]);

  // ---- sending finds ------------------------------------------------------------
  const sync = useCallback(async (force) => {
    if (!live) return;
    const f = foundRef.current;
    const ids = Object.keys(f).map(Number);
    if (!ids.length && !force) return;
    const body = JSON.stringify({ board: P.num, anonId: getAnonId(), email: getEmail(), found: ids, force: !!force });
    const sentAt = Date.now();
    try {
      const r = await fetch('/api/search', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body });
      const d = await r.json();
      if (!d || d.error) return;
      dirty.current = false;
      if (d.me) setMe(d.me);
      if (d.name) setMyName(d.name);
      setFound((cur) => {
        const next = { ...cur };
        for (const i of ids) if (next[i] && !next[i][5]) next[i] = [...next[i].slice(0, 5), sentAt];
        // Finds made on another device come back here; they are circled when located.
        for (const i of d.found || []) if (!next[i]) next[i] = [-1, -1, -1, -1, 0, sentAt];
        return next;
      });
    } catch (e) {}
  }, [live, P.num]);
  useEffect(() => {
    if (!hydrated || !live) return undefined;
    sync(false);
    const iv = setInterval(() => { if (dirty.current) sync(false); }, SYNC_MS);
    const onHide = () => { if (document.visibilityState === 'hidden' && Object.keys(foundRef.current).length) sync(true); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', onHide); };
  }, [hydrated, live, sync]);

  // How many players have found entry i, counting this player once.
  const countOf = useCallback((i) => {
    const base = crowd ? crowd.counts[i] || 0 : 0;
    const f = found[i];
    if (!f || !live) return base;
    const counted = f[5] && crowd && f[5] < crowd.at;
    return counted ? base : base + 1;
  }, [crowd, found, live]);

  const mine = Object.keys(found).map(Number);
  const total = mine.length;
  const points = mine.reduce((a, i) => a + searchValue(countOf(i)), 0);
  const place = useMemo(() => {
    if (!crowd || !total) return null;
    let better = 0;
    for (const [pt, t] of crowd.field) if (pt > points || (pt === points && t > total)) better++;
    const inField = crowd.standings.some((s) => s.id === me);
    return { at: better + 1, of: Math.max(crowd.players + (inField ? 0 : 1), better + 1) };
  }, [crowd, points, total, me]);
  // The closing screen opens by itself, once, when a board is over.
  const finalShown = useRef(false);
  useEffect(() => {
    if (!live && crowd && crowd.closed && !finalShown.current) { finalShown.current = true; setPanel('final'); }
  }, [live, crowd]);

  function say(t) {
    setToast({ ...t, k: Date.now() });
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), t.find ? 2800 : 3400);
  }

  // ---- the canvas ---------------------------------------------------------------
  const colors = () => (themeRef.current === 'dark'
    ? { bg: '#0f1218', card: '#171b23', ink: '#eef1f6', mute: '#98a2b3', sel: 'rgba(125,180,255,0.40)', miss: 'rgba(248,113,113,0.30)', light: 60, alpha: 0.55 }
    : { bg: '#ebe9e3', card: '#ffffff', ink: '#15171c', mute: '#6b7280', sel: 'rgba(37,99,235,0.26)', miss: 'rgba(185,28,28,0.20)', light: 62, alpha: 0.46 });

  const draw = useCallback(() => {
    raf.current = 0;
    const cv = cvRef.current, st = stageRef.current;
    if (!cv || !st) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const W = st.clientWidth, H = st.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d');
    const C = colors();
    const { s, ox, oy } = view.current;
    window.__searchView = view.current; // read by the browser test harness
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.card;
    ctx.fillRect(ox, oy, SIZE * s, SIZE * s);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
    ctx.strokeRect(ox - 0.5, oy - 0.5, SIZE * s + 1, SIZE * s + 1);
    const c0 = Math.max(0, Math.floor(-ox / s) - 1), c1 = Math.min(SIZE - 1, Math.ceil((W - ox) / s) + 1);
    const r0 = Math.max(0, Math.floor(-oy / s) - 1), r1 = Math.min(SIZE - 1, Math.ceil((H - oy) / s) + 1);
    const cap = (a, b, c, d, style, wmul = 0.76) => {
      ctx.strokeStyle = style; ctx.lineWidth = s * wmul; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ox + (b + 0.5) * s, oy + (a + 0.5) * s); ctx.lineTo(ox + (d + 0.5) * s, oy + (c + 0.5) * s); ctx.stroke();
    };
    const f = foundRef.current;
    const now = performance.now();
    for (const k in f) {
      const at = f[k];
      if (at[0] < 0) continue;
      const i = Number(k);
      const minR = Math.min(at[0], at[2]), maxR = Math.max(at[0], at[2]), minC = Math.min(at[1], at[3]), maxC = Math.max(at[1], at[3]);
      if (maxR < r0 || minR > r1 || maxC < c0 || minC > c1) continue;
      const hot = pulse.current && pulse.current.i === i && now - pulse.current.t < 900;
      cap(at[0], at[1], at[2], at[3], `hsla(${HUES[i % HUES.length]}, 78%, ${C.light}%, ${hot ? 0.78 : C.alpha})`, hot ? 0.9 : 0.76);
    }
    if (miss.current && now - miss.current.t < 520) {
      const m = miss.current; cap(m.r0, m.c0, m.r1, m.c1, C.miss);
    }
    const d = dragSel.current;
    if (d) cap(d.r0, d.c0, d.r1, d.c1, C.sel);
    const an = anchorRef.current;
    if (an && !d) {
      ctx.fillStyle = C.sel; ctx.beginPath(); ctx.arc(ox + (an.c + 0.5) * s, oy + (an.r + 0.5) * s, s * 0.42, 0, Math.PI * 2); ctx.fill();
    }
    if (s >= 7) {
      ctx.fillStyle = C.ink;
      ctx.font = `800 ${Math.round(s * 0.56)}px ${SANS}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let r = r0; r <= r1; r++) {
        const row = P.grid[r], y = oy + (r + 0.53) * s;
        for (let c = c0; c <= c1; c++) ctx.fillText(row[c], ox + (c + 0.5) * s, y);
      }
    }
    if ((pulse.current && now - pulse.current.t < 900) || (miss.current && now - miss.current.t < 520)) raf.current = requestAnimationFrame(draw);
    drawMini();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [P, SIZE]);
  const redraw = useCallback(() => { if (!raf.current) raf.current = requestAnimationFrame(draw); }, [draw]);

  function drawMini() {
    const mc = miniRef.current, st = stageRef.current;
    if (!mc || !st) return;
    const px = 120, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (mc.width !== px * dpr) { mc.width = px * dpr; mc.height = px * dpr; }
    const ctx = mc.getContext('2d');
    const C = colors();
    const k = px / SIZE;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.card; ctx.fillRect(0, 0, px, px);
    const f = foundRef.current;
    for (const key in f) {
      const at = f[key]; if (at[0] < 0) continue;
      ctx.strokeStyle = `hsla(${HUES[Number(key) % HUES.length]}, 70%, ${C.light - 8}%, 0.9)`; ctx.lineWidth = Math.max(1.2, k); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo((at[1] + 0.5) * k, (at[0] + 0.5) * k); ctx.lineTo((at[3] + 0.5) * k, (at[2] + 0.5) * k); ctx.stroke();
    }
    const { s, ox, oy } = view.current;
    const vx = (-ox / s) * k, vy = (-oy / s) * k, vw = (st.clientWidth / s) * k, vh = (st.clientHeight / s) * k;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
    ctx.strokeRect(Math.max(0.75, vx), Math.max(0.75, vy), Math.min(px - 1.5, vw), Math.min(px - 1.5, vh));
  }

  // Keep the board on screen: at most a third of the view may hang off an edge.
  function clampView() {
    const st = stageRef.current; if (!st) return;
    const v = view.current, W = st.clientWidth, H = st.clientHeight, B = SIZE * v.s;
    const minS = Math.min(W, H) / SIZE * 0.9;
    v.s = Math.max(minS, Math.min(64, v.s));
    const B2 = SIZE * v.s;
    const padX = W / 3, padY = H / 3;
    if (B2 + 2 * padX < W) v.ox = (W - B2) / 2; else v.ox = Math.min(padX, Math.max(W - B2 - padX, v.ox));
    if (B2 + 2 * padY < H) v.oy = (H - B2) / 2; else v.oy = Math.min(padY, Math.max(H - B2 - padY, v.oy));
    void B;
  }
  function zoomAt(f, x, y) {
    const v = view.current;
    const wx = (x - v.ox) / v.s, wy = (y - v.oy) / v.s;
    v.s *= f; clampView();
    v.ox = x - wx * v.s; v.oy = y - wy * v.s; clampView();
    redraw();
  }
  function zoomBtn(f) { const st = stageRef.current; if (st) zoomAt(f, st.clientWidth / 2, st.clientHeight / 2); saveView(); }
  function fit() {
    const st = stageRef.current; if (!st) return;
    const v = view.current; v.s = Math.min(st.clientWidth, st.clientHeight) / SIZE * 0.96;
    v.ox = (st.clientWidth - SIZE * v.s) / 2; v.oy = (st.clientHeight - SIZE * v.s) / 2;
    redraw(); saveView();
  }
  function jumpTo(r, c) {
    const st = stageRef.current; if (!st) return;
    const v = view.current;
    if (v.s < 24) v.s = 30;
    v.ox = st.clientWidth / 2 - (c + 0.5) * v.s; v.oy = st.clientHeight / 2 - (r + 0.5) * v.s;
    clampView(); redraw(); saveView();
  }

  useEffect(() => {
    if (!hydrated) return undefined;
    const st = stageRef.current;
    if (view.current.init) {
      delete view.current.init;
      const s = st.clientWidth < 720 ? 28 : 32;
      view.current = { s, ox: st.clientWidth / 2 - (SIZE / 2) * s, oy: st.clientHeight / 2 - (SIZE / 2) * s };
    }
    clampView(); redraw();
    const ro = new ResizeObserver(() => { clampView(); redraw(); });
    ro.observe(st);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  useEffect(() => { redraw(); }, [found, anchor, theme, redraw]);

  // ---- grading a stroke --------------------------------------------------------
  function grade(a, b, c, d) {
    const cells = searchCells(a, b, c, d);
    if (!cells || cells.length < 4) { if (cells && cells.length >= 2) { miss.current = { r0: a, c0: b, r1: c, c1: d, t: performance.now() }; redraw(); } return; }
    const s = cells.map(([r, cc]) => P.grid[r][cc]).join('');
    const i = index.get(s);
    if (i == null) { miss.current = { r0: a, c0: b, r1: c, c1: d, t: performance.now() }; redraw(); return; }
    const it = P.items[i];
    const prior = foundRef.current[i];
    if (prior && prior[0] >= 0) { say({ title: it.t, y: it.y, line: 'Already found' }); return; }
    const now = Date.now();
    setFound((cur) => ({ ...cur, [i]: [a, b, c, d, now, prior ? prior[5] : 0] }));
    dirty.current = !prior;
    pulse.current = { i, t: performance.now() };
    const others = crowd ? Math.max(0, (crowd.counts[i] || 0) - (prior && prior[5] && prior[5] < crowd.at ? 1 : 0)) : null;
    let line;
    if (prior) line = 'Found on your other device, now circled here';
    else if (!live) line = others == null ? 'This board is closed: finds here are for fun' : (others === 0 ? 'Nobody found it while the board was open' : `${fmt(others)} ${others === 1 ? 'player' : 'players'} found it`);
    else if (others == null) line = 'Counting the crowd...';
    else if (others === 0) line = `You're the first finder · all ${SEARCH_POT} points, for now`;
    else {
      // WHO ELSE FOUND IT (owner, 2026-11-21): a find names the players who got it
      // first, "and N others" past three; the first to find it is told so.
      const mine = new Set([myName, me ? `Guest ${me.slice(0, 4).toUpperCase()}` : null].filter(Boolean));
      const names = ((crowd && crowd.whoBy && crowd.whoBy[i]) || []).filter((n) => !mine.has(n)).slice(0, 3);
      const rest = Math.max(0, others - names.length);
      const parts = rest ? [...names, `${fmt(rest)} ${names.length ? (rest === 1 ? 'other' : 'others') : (rest === 1 ? 'other player' : 'other players')}`] : names;
      const who = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
      line = `Also found by ${who} · ${fmt(searchValue(others + 1))} ${searchValue(others + 1) === 1 ? 'pt' : 'pts'} each, for now`;
    }
    say({ title: it.t, y: it.y, line, uniq: others === 0 && !prior && live, find: true });
  }

  // ---- pointers ----------------------------------------------------------------
  function cellAt(x, y) {
    const v = view.current;
    return { c: Math.floor((x - v.ox) / v.s), r: Math.floor((y - v.oy) / v.s), fx: (x - v.ox) / v.s, fy: (y - v.oy) / v.s };
  }
  const inGrid = (r, c) => r >= 0 && c >= 0 && r < SIZE && c < SIZE;
  function snap(r0, c0, fx, fy) {
    const dx = fx - (c0 + 0.5), dy = fy - (r0 + 0.5);
    if (Math.hypot(dx, dy) < 0.5) return [r0, c0];
    const oct = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
    const [dr, dc] = OCT[oct];
    let k = Math.max(0, Math.round((dx * dc + dy * dr) / (dr && dc ? 2 : 1)));
    while (k > 0 && !inGrid(r0 + dr * k, c0 + dc * k)) k--;
    return [r0 + dr * k, c0 + dc * k];
  }
  function lettersOf(a, b, c, d) {
    const cells = searchCells(a, b, c, d);
    return cells ? cells.map(([r, cc]) => P.grid[r][cc]).join('') : '';
  }
  function local(e) { const rect = cvRef.current.getBoundingClientRect(); return [e.clientX - rect.left, e.clientY - rect.top]; }

  function onDown(e) {
    const [x, y] = local(e);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    ptrs.current.set(e.pointerId, { x, y, type: e.pointerType });
    if (ptrs.current.size === 2) {
      const [p1, p2] = [...ptrs.current.values()];
      dragSel.current = null;
      gesture.current = { kind: 'pinch', d: Math.hypot(p1.x - p2.x, p1.y - p2.y), cx: (p1.x + p2.x) / 2, cy: (p1.y + p2.y) / 2 };
      redraw(); return;
    }
    if (ptrs.current.size > 2) return;
    const mouse = e.pointerType === 'mouse';
    if (mouse && (e.button === 1 || e.button === 2 || spaceDown.current)) { gesture.current = { kind: 'pan', x, y, moved: true }; return; }
    const at = cellAt(x, y);
    gesture.current = { kind: mouse ? 'select' : 'maybe', x, y, r: at.r, c: at.c, moved: false, mouse };
  }
  function onMove(e) {
    const p = ptrs.current.get(e.pointerId);
    if (!p) {
      if (e.pointerType === 'mouse' && !gesture.current) {
        const [x, y] = local(e); const at = cellAt(x, y);
        const an = anchorRef.current;
        if (an && inGrid(at.r, at.c)) { const [r1, c1] = snap(an.r, an.c, at.fx, at.fy); dragSel.current = { r0: an.r, c0: an.c, r1, c1, hover: true }; setRead(lettersOf(an.r, an.c, r1, c1)); redraw(); }
      }
      return;
    }
    const [x, y] = local(e);
    const g = gesture.current; if (!g) return;
    if (g.kind === 'pinch') {
      p.x = x; p.y = y;
      const [p1, p2] = [...ptrs.current.values()];
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y), cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
      const v = view.current;
      v.ox += cx - g.cx; v.oy += cy - g.cy;
      if (g.d > 0) zoomAt(d / g.d, cx, cy);
      g.d = d; g.cx = cx; g.cy = cy; clampView(); redraw();
      return;
    }
    const dx = x - p.x, dy = y - p.y;
    if (g.kind === 'pan') { view.current.ox += dx; view.current.oy += dy; p.x = x; p.y = y; clampView(); redraw(); return; }
    if (g.kind === 'maybe') {
      if (Math.hypot(x - g.x, y - g.y) > 9) { g.kind = 'pan'; g.moved = true; setAnchor(null); dragSel.current = null; }
      p.x = x; p.y = y; return;
    }
    if (g.kind === 'select') {
      if (!g.moved && Math.hypot(x - g.x, y - g.y) > view.current.s * 0.35) g.moved = true;
      if (!inGrid(g.r, g.c)) return;
      const at = cellAt(x, y);
      const [r1, c1] = snap(g.r, g.c, at.fx, at.fy);
      if (g.moved) { dragSel.current = { r0: g.r, c0: g.c, r1, c1 }; setRead(lettersOf(g.r, g.c, r1, c1)); redraw(); }
    }
  }
  function onUp(e) {
    const p = ptrs.current.get(e.pointerId);
    ptrs.current.delete(e.pointerId);
    const g = gesture.current;
    if (!p || !g) return;
    if (g.kind === 'pinch') { if (ptrs.current.size === 0) { gesture.current = null; saveView(); } else gesture.current = { kind: 'pan', moved: true }; return; }
    gesture.current = null;
    if (g.kind === 'pan') { saveView(); return; }
    const sel = dragSel.current;
    dragSel.current = null;
    if (g.kind === 'select' && g.moved && sel && !sel.hover) { setAnchor(null); setRead(''); grade(sel.r0, sel.c0, sel.r1, sel.c1); redraw(); return; }
    // A tap: the first marks a word's first letter, the second its last.
    const r = g.r, c = g.c;
    if (!inGrid(r, c)) { setAnchor(null); setRead(''); redraw(); return; }
    const an = anchorRef.current;
    if (an && an.r === r && an.c === c) { setAnchor(null); setRead(''); return; }
    if (an && searchCells(an.r, an.c, r, c)) { setAnchor(null); setRead(''); grade(an.r, an.c, r, c); return; }
    setAnchor({ r, c }); setRead(P.grid[r][c] + '...');
  }
  function onCancel(e) { ptrs.current.delete(e.pointerId); gesture.current = null; dragSel.current = null; redraw(); }
  function onWheel(e) {
    e.preventDefault();
    const [x, y] = local(e);
    if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.0022), x, y);
    else { view.current.ox -= e.deltaX; view.current.oy -= e.deltaY; clampView(); redraw(); }
    clearTimeout(onWheel.t); onWheel.t = setTimeout(saveView, 300);
  }
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return undefined;
    cv.addEventListener('wheel', onWheel, { passive: false });
    const kd = (e) => {
      if (e.key === 'Escape') { setAnchor(null); setRead(''); dragSel.current = null; redraw(); }
      if (e.code === 'Space' && e.target === document.body) { spaceDown.current = true; e.preventDefault(); }
    };
    const ku = (e) => { if (e.code === 'Space') spaceDown.current = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { cv.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  function onMini(e) {
    const rect = miniRef.current.getBoundingClientRect();
    const c = ((e.clientX - rect.left) / rect.width) * SIZE, r = ((e.clientY - rect.top) / rect.height) * SIZE;
    jumpTo(Math.floor(r), Math.floor(c));
  }

  // Finds that came from another device get circled once located on this one.
  useEffect(() => {
    const pending = Object.entries(found).filter(([, at]) => at[0] < 0);
    if (!pending.length) return;
    import('@/lib/search').then(({ searchLocate }) => {
      setFound((cur) => {
        const next = { ...cur };
        for (const [k] of pending) { const at = searchLocate(P.grid, P.items[k].w); if (at && next[k]) next[k] = [...at, next[k][4], next[k][5]]; }
        return next;
      });
    });
  }, [found, P]);

  function toggleTheme() {
    const t = theme === 'dark' ? 'light' : 'dark';
    setTheme(t);
    try { localStorage.setItem('sot_theme2', t); } catch (e) {}
  }

  // ---- panels -------------------------------------------------------------------
  const q = query.trim().toLowerCase();
  const listRows = useMemo(() => {
    const rows = P.items.map((it, i) => ({ it, i })).filter(({ it, i }) => {
      if (listTab === 'found' && !found[i]) return false;
      if ((listTab === 'left' || listTab === 'rare') && found[i]) return false;
      return !q || it.t.toLowerCase().includes(q);
    });
    const abc = (a, b) => a.it.t.replace(/^(the|a|an) /i, '').localeCompare(b.it.t.replace(/^(the|a|an) /i, ''));
    // UNFOUND (owner, 2026-11-21): entries nobody has found come first, then the
    // least found, so the rarest of what you still need sits at the top.
    if (listTab === 'rare' && crowd) rows.sort((a, b) => (crowd.counts[a.i] || 0) - (crowd.counts[b.i] || 0) || abc(a, b));
    else rows.sort(abc);
    return rows;
  }, [P, found, listTab, q, crowd]);
  const unfoundN = crowd ? crowd.counts.filter((c) => !c).length : null;

  // The board's window, in words: open until solved, between its 24 hour
  // minimum and its 72 hour cap.
  const W = crowd && crowd.opens ? crowd : win;
  let windowText = '';
  if (W && hydrated) {
    if (!live) windowText = crowd && crowd.solvedAt ? 'Closed: solved by the crowd' : 'Closed';
    else if (W.solvedAt) windowText = `Solved! Closes ${whenText(W.min)}`;
    else if (P.num === currentNum && W.cap && W.min) windowText = Date.now() < W.min ? `Open until solved, ${whenText(W.min)} at the earliest, ${whenText(W.cap)} at the latest` : `Open until solved, ${whenText(W.cap)} at the latest`;
  }
  void msToMidnightET;
  void tick;
  const C = theme === 'dark';

  const css = `
.trl{--page:#f5f4f0;--card:#ffffff;--ink:#15171c;--mute:#6b7280;--line:#15171c;--soft:#e9e7e1;--good:#d9e8d0;--good-ink:#24401c;--gold:#f6e3a1;--gold-ink:#4a3b06;}
.trl[data-theme='dark']{--page:#0f1218;--card:#171b23;--ink:#eef1f6;--mute:#98a2b3;--line:#eef1f6;--soft:#252b36;--good:#2c3f27;--good-ink:#d9e8d0;--gold:#5c4c1f;--gold-ink:#f6e3a1;}
.trl *{box-sizing:border-box}
.trl{position:fixed;inset:0;z-index:900;display:grid;grid-template-rows:auto 1fr;background:var(--page);color:var(--ink);font-family:${SANS};-webkit-font-smoothing:antialiased;overscroll-behavior:none}
.trl button{font-family:inherit;color:inherit}
.trl .top{display:flex;align-items:center;gap:8px 16px;padding:8px 14px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.trl .logo{display:flex;align-items:center;gap:7px;font:800 15px/1.3 ${SANS};color:var(--ink);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px 5px 8px}
.trl .name{display:flex;flex-direction:column;line-height:1.15}
.trl .name b{font-size:19px;font-weight:800;letter-spacing:-.01em}
.trl .name span{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.trl .stats{display:flex;gap:14px;align-items:baseline;flex-wrap:wrap}
.trl .stats div{font:800 11.5px/1.4 ${SANS};letter-spacing:.08em;text-transform:uppercase;color:var(--mute);white-space:nowrap}
.trl .stats b{font:800 20px/1.25 ${SANS};color:var(--ink);font-variant-numeric:tabular-nums;letter-spacing:0;margin-right:4px}
.trl .sp{flex:1}
.trl .meta{font:700 12.5px/1.4 ${SANS};color:var(--mute);white-space:nowrap;text-align:right}
.trl .btns{display:flex;gap:8px;flex-wrap:wrap}
.trl .pill{border:1px solid var(--line);background:var(--card);color:var(--ink);font:800 12.5px/1.3 ${SANS};border-radius:999px;padding:7px 13px;cursor:pointer;white-space:nowrap}
.trl .pill.on{background:var(--ink);color:var(--page)}
.trl .stage{position:relative;min-height:0;overflow:hidden}
.trl canvas.board{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:crosshair}
.trl .read{position:absolute;left:50%;top:10px;transform:translateX(-50%);pointer-events:none;max-width:80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:5px 14px;border-radius:999px;font-weight:800;font-size:15px;letter-spacing:.14em;background:var(--card);border:1px solid var(--line);box-shadow:0 4px 14px rgba(0,0,0,.14)}
.trl .toast{position:absolute;left:50%;top:52px;transform:translateX(-50%);min-width:240px;max-width:min(460px,calc(100% - 24px));background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 16px 11px;box-shadow:0 8px 26px rgba(0,0,0,.18);text-align:center;pointer-events:none;animation:trlIn .28s cubic-bezier(.2,.9,.25,1.2)}
.trl .toast.find{min-width:0;padding:7px 14px 8px;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,.12);animation:trlUp .22s ease-out,trlOut .5s ease-in 2.3s forwards}
.trl .toast.find b{display:inline;font-size:14px}
.trl .toast.find b i{font-size:12px}
.trl .toast.find span{display:inline;font-size:12.5px;margin:0 0 0 8px;opacity:.8}
@keyframes trlUp{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes trlOut{to{opacity:0}}
.trl .toast.uniq{background:var(--good);color:var(--good-ink);border-color:var(--good-ink)}
.trl .toast b{display:block;font-size:17px;font-weight:800;letter-spacing:-.01em;line-height:1.3}
.trl .toast b i{font-style:normal;font-weight:700;opacity:.65;margin-left:6px;font-size:14px}
.trl .toast span{display:block;font-size:13px;font-weight:700;margin-top:2px;opacity:.85}
@keyframes trlIn{from{opacity:0;transform:translate(-50%,-8px) scale(.96)}to{opacity:1;transform:translate(-50%,0)}}
.trl .zoom{position:absolute;left:12px;bottom:12px;display:flex;border:1px solid var(--line);border-radius:999px;background:var(--card);box-shadow:0 2px 10px rgba(0,0,0,.12);overflow:hidden}
.trl .zoom button{-webkit-appearance:none;appearance:none;border:0;border-radius:0;margin:0;background:transparent;font:800 15px/1 ${SANS};height:42px;min-width:46px;padding:0 12px;cursor:pointer}
.trl .zoom button+button{border-left:1px solid var(--line)}
.trl .mini{position:absolute;right:12px;bottom:12px;width:120px;height:120px;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--card);box-shadow:0 2px 10px rgba(0,0,0,.12);cursor:pointer}
.trl .mini canvas{width:120px;height:120px;display:block}
.trl .arch{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);background:var(--gold);color:var(--gold-ink);border:1px solid var(--gold-ink);border-radius:999px;padding:7px 14px;font:800 12.5px/1.3 ${SANS};white-space:nowrap}
.trl .arch a{color:inherit}
.trl .sheet{position:absolute;top:10px;right:10px;bottom:10px;width:min(400px,calc(100% - 20px));background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;z-index:3}
.trl .sheet .hd{display:flex;align-items:center;gap:8px;padding:12px 14px 10px;border-bottom:1px solid var(--soft)}
.trl .sheet .hd h3{margin:0;font-size:17px;font-weight:800;flex:1}
.trl .sheet .x{border:1px solid var(--line);background:var(--card);border-radius:999px;width:32px;height:32px;cursor:pointer;font:800 16px/1 ${SANS}}
.trl .sheet .body{flex:1;overflow-y:auto;padding:8px 14px 14px;overscroll-behavior:contain;scrollbar-width:thin;margin-right:4px;margin-bottom:6px}
.trl .seg{display:flex;border:1px solid var(--line);border-radius:999px;overflow:hidden;margin:10px 14px 0}
.trl .seg button{-webkit-appearance:none;appearance:none;border:0;border-radius:0;margin:0;flex:1;background:transparent;font:800 12.5px/1.3 ${SANS};padding:8px 6px;cursor:pointer;white-space:nowrap}
.trl .seg button+button{border-left:1px solid var(--line)}
.trl .seg button.on{background:var(--ink);color:var(--page)}
.trl .search{margin:10px 14px 0;border:1px solid var(--line);border-radius:10px;padding:9px 12px;font:700 14px/1.3 ${SANS};background:var(--page);color:var(--ink);outline:none}
.trl .row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--soft);font-size:14px;font-weight:700}
.trl .row .t{flex:1;min-width:0;line-height:1.35}
.trl .row .t i{font-style:normal;color:var(--mute);font-weight:700;margin-left:6px;font-size:12.5px}
.trl .row.got .t{color:var(--mute);text-decoration:line-through;text-decoration-thickness:2px}
.trl .row .n{flex:none;font-size:12px;font-weight:800;border-radius:999px;padding:3px 9px;background:var(--soft);font-variant-numeric:tabular-nums}
.trl .row .n.z{background:transparent;color:var(--mute);border:1px solid var(--soft)}
.trl .row .n.u{background:var(--good);color:var(--good-ink)}
.trl .row .dot{width:10px;height:10px;border-radius:999px;flex:none;border:1px solid var(--mute)}
.trl .row .go{flex:none;border:1px solid var(--line);background:var(--card);border-radius:999px;font:800 11.5px/1.3 ${SANS};padding:4px 9px;cursor:pointer}
.trl table{width:100%;border-collapse:collapse;font-size:14px;font-weight:700}
.trl th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);text-align:right;padding:8px 4px;font-weight:800}
.trl th:nth-child(2),.trl td:nth-child(2){text-align:left}
.trl td{padding:8px 4px;border-bottom:1px solid var(--soft);text-align:right;font-variant-numeric:tabular-nums}
.trl td:nth-child(2){max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.trl tr.me td{background:var(--gold);color:var(--gold-ink)}
.trl .help p{margin:0 0 10px;font-size:14px;line-height:1.6;font-weight:600}
.trl .help b{font-weight:800}
.trl .mwin{display:none}
@media (max-width:719px){.trl .mwin{display:block;order:6;width:100%;font:700 12px/1.3 ${SANS};color:var(--mute)}}
.trl .fh{margin:16px 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:var(--mute)}
.trl .note a,.trl .arch a{color:inherit;font-weight:800}
.trl .lnk{border:0;background:none;padding:0;font:inherit;text-decoration:underline;cursor:pointer;color:inherit}
.trl .note{font-size:12.5px;color:var(--mute);font-weight:700;margin:10px 0 0;line-height:1.5}
@media (max-width:719px){
  .trl .top{padding:7px 10px;gap:6px 10px}
  .trl .logo span{display:none}
  .trl .name b{font-size:17px}
  .trl .stats{gap:10px;order:5;width:100%;justify-content:space-between}
  .trl .stats b{font-size:17px}
  .trl .meta{display:none}
  .trl .btns{gap:6px}
  .trl .pill{padding:6px 10px;font-size:12px}
  .trl .seg button{font-size:11.5px;padding:8px 3px}
  .trl .sheet{top:auto;left:0;right:0;bottom:0;width:auto;height:min(72%,560px);border-radius:16px 16px 0 0;border-bottom:0}
  .trl .mini{width:84px;height:84px}
  .trl .mini canvas{width:84px;height:84px}
}
`;

  const listPanel = (
    <div className="sheet" role="dialog" aria-label="The list">
      <div className="hd"><h3>{P.theme}: the list</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
      <div className="seg" role="group" aria-label="Show">
        <button className={listTab === 'all' ? 'on' : ''} onClick={() => setListTab('all')}>All {fmt(N)}</button>
        <button className={listTab === 'left' ? 'on' : ''} onClick={() => setListTab('left')}>To find {fmt(N - total)}</button>
        <button className={listTab === 'found' ? 'on' : ''} onClick={() => setListTab('found')}>Found {fmt(total)}</button>
        <button className={listTab === 'rare' ? 'on' : ''} onClick={() => setListTab('rare')} title="Nobody has found these yet; the least found come next">Unfound{unfoundN != null ? ` ${fmt(unfoundN)}` : ''}</button>
      </div>
      <input className="search" placeholder={`Search the ${P.noun}`} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the list" />
      <div className="body">
        {listTab === 'rare' && crowd && listRows.length > 0 && !(crowd.counts[listRows[0].i] || 0) && <div className="fh">Nobody has found these</div>}
        {listRows.map(({ it, i }, k) => {
          const got = !!found[i];
          const n = crowd ? countOf(i) : null;
          const lessFound = listTab === 'rare' && crowd && (crowd.counts[i] || 0) > 0 && (k === 0 || !(crowd.counts[listRows[k - 1].i] || 0));
          return (
            <div key={i} style={{ display: 'contents' }}>{lessFound && <div className="fh">Least found next</div>}
            <div className={'row' + (got ? ' got' : '')}>
              <span className="dot" style={got ? { background: `hsl(${HUES[i % HUES.length]}, 72%, 62%)`, borderColor: 'transparent' } : undefined} />
              <span className="t">{it.t}{it.y ? <i>{it.y}</i> : null}</span>
              {got && found[i][0] >= 0 && <button className="go" onClick={() => { jumpTo(found[i][0], found[i][1]); if (narrow) setPanel(null); }}>Show</button>}
              {/* EVERY ROW SHOWS ITS FINDS (owner, 2026-11-20: "mark the number of finds
                  in the list"): how many players have found it so far, found by you or
                  not, and on your own finds what each finder is paid right now. */}
              {n != null && <span className={'n' + (got && n === 1 ? ' u' : (!n ? ' z' : ''))} title="How many players have found it, and what it pays each of them">{got ? (n === 1 ? `Only you · ${SEARCH_POT} pts` : `${fmt(n)} finds · ${fmt(searchValue(n))} pts`) : (n ? `${fmt(n)} ${n === 1 ? 'find' : 'finds'}` : 'No finds')}</span>}
            </div>
            </div>
          );
        })}
        {!listRows.length && <p className="note">Nothing on the list matches that.</p>}
        <p className="note">Finds are how many players have found each one so far; on yours, pts is what each finder is paid right now. Refresh for the latest. They lock when the board closes.</p>
      </div>
    </div>
  );

  const myRowIn = crowd && me ? crowd.standings.find((s) => s.id === me) : null;
  const standingsPanel = (
    <div className="sheet" role="dialog" aria-label="Standings">
      <div className="hd"><h3>Standings</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
      <div className="body">
        <p className="note" style={{ marginTop: 4 }}>Every entry is a pot of {SEARCH_POT} points split among everyone who found it. Ranked on <b>points</b>, then on total finds. Values move as the crowd catches up and lock when the board closes.</p>
        {!crowd ? <p className="note">Loading the standings...</p> : (
          <table>
            <thead><tr><th>#</th><th>Player</th><th>Points</th><th>Found</th></tr></thead>
            <tbody>
              {crowd.standings.map((s) => (
                <tr key={s.id} className={s.id === me ? 'me' : ''}><td>{s.place}</td><td>{s.name}</td><td>{fmt(s.points)}</td><td>{fmt(s.total)}</td></tr>
              ))}
              {!myRowIn && place && (
                <tr className="me"><td>{place.at}</td><td>You</td><td>{fmt(points)}</td><td>{fmt(total)}</td></tr>
              )}
            </tbody>
          </table>
        )}
        {crowd && !crowd.standings.length && <p className="note">Nobody has found anything yet. Be the first.</p>}
        {crowd && <p className="note">{fmt(crowd.players)} {crowd.players === 1 ? 'player' : 'players'} so far. Updated {ago(Date.now() - crowd.at)}.</p>}
      </div>
    </div>
  );

  // THE CLOSING SCREEN: the final standings, the finds only one player got, and
  // what nobody found. Opens by itself once when the board is over.
  const finalPanel = (() => {
    const counts = crowd ? crowd.counts : [];
    const solo = crowd && crowd.soloBy ? Object.entries(crowd.soloBy).map(([i, name]) => ({ i: Number(i), name })) : [];
    const none = counts.map((c, i) => (c === 0 ? i : -1)).filter((i) => i >= 0);
    return (
      <div className="sheet" role="dialog" aria-label="Final results">
        <div className="hd"><h3>{P.theme}: final results</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
        <div className="body">
          {!crowd ? <p className="note">Loading the results...</p> : (
            <>
              <p className="note" style={{ marginTop: 4 }}>{crowd.solvedAt ? `The crowd found all ${fmt(N)}.` : `The crowd found ${fmt(crowd.crowdFound)} of ${fmt(N)} before the 72 hour cap.`} {fmt(crowd.players)} {crowd.players === 1 ? 'player' : 'players'} took part.{total ? ` You found ${fmt(total)} for ${fmt(points)} points${place ? `, ${ord(place.at)} of ${fmt(place.of)}` : ''}.` : ''}</p>
              <table>
                <thead><tr><th>#</th><th>Player</th><th>Points</th><th>Found</th></tr></thead>
                <tbody>
                  {crowd.standings.slice(0, 10).map((x) => (
                    <tr key={x.id} className={x.id === me ? 'me' : ''}><td>{x.place}</td><td>{x.name}</td><td>{fmt(x.points)}</td><td>{fmt(x.total)}</td></tr>
                  ))}
                </tbody>
              </table>
              {solo.length > 0 && (<>
                <h4 className="fh">Found by one player only</h4>
                {solo.slice(0, 60).map(({ i, name }) => <div key={i} className="row"><span className="t">{P.items[i].t}{P.items[i].y ? <i>{P.items[i].y}</i> : null}</span><span className="n u">{name}</span></div>)}
              </>)}
              {none.length > 0 && (<>
                <h4 className="fh">Nobody found</h4>
                <p className="note" style={{ marginTop: 0 }}>{none.map((i) => P.items[i].t).join(', ')}</p>
              </>)}
              {!isCurrent && <p className="note"><a href="/search">Play the open board &rarr;</a></p>}
              {past.length > 0 && <p className="note">Other boards: {past.slice(0, 12).map((b, k) => <span key={b.num}>{k ? ', ' : ''}<a href={`/search?b=${b.num}`}>{b.theme}</a></span>)}</p>}
            </>
          )}
        </div>
      </div>
    );
  })();

  const helpPanel = (
    <div className="sheet" role="dialog" aria-label="How to play">
      <div className="hd"><h3>How Search works</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
      <div className="body help">
        <p>One enormous word search a day, on one big topic. Today it is <b>{fmt(N)} {P.theme.toLowerCase()}</b> hidden in a {SIZE} by {SIZE} grid. Each one runs in a straight line in any of the eight directions, backward too, with its spaces and punctuation dropped.</p>
        <p><b>To circle one:</b> drag across it with a mouse, or tap its first letter and then its last. A wrong line costs nothing.</p>
        <p><b>To move around:</b> scroll or drag with two fingers on a trackpad, drag with one finger on a phone, pinch or use the zoom buttons. The little map in the corner jumps you anywhere.</p>
        <p><b>The list</b> stays behind the List button. Open it any time to see what is hidden, or play without it.</p>
        <p><b>Scoring:</b> everyone has the same grid, and every entry is a pot of <b>{SEARCH_POT} points</b> split evenly among the players who find it. Find one alone and you keep all {SEARCH_POT}; share it with one other player and you each get 50; a title forty players found pays 3. The standings rank points first and total finds second.</p>
        <p>Each find tells you how many players found it before you. Values move as the crowd catches up: Refresh (or wait two minutes) to see the latest.</p>
        <p><b>How long it runs:</b> a board stays open until the crowd has found every entry, at least 24 hours and at most 72. The next topic opens the moment it closes, and the values lock. Your points count toward the day you made each find. No clock and no Give up.</p>
      </div>
    </div>
  );

  return (
    <div className="trl" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="top">
        <a className="logo" href="/" aria-label="Back to Mind Loft home">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          <svg width="22" height="22" viewBox="0 0 26 26" aria-hidden="true"><path d="M3 22V11l10-8 10 8v11h-5v-8l-5 5-5-5v8z" fill="currentColor" /></svg>
          <span>Mind Loft</span>
        </a>
        <div className="name"><b>Search</b><span>No. {P.num} · {P.theme}</span></div>
        <div className="stats">
          <div><b>{fmt(total)}</b>of {fmt(N)} found</div>
          <div title="Your points: each entry's 100 split among its finders"><b>{fmt(points)}</b>Points</div>
          <div title="Your place in today's standings"><b>{place ? `#${fmt(place.at)}` : '—'}</b>{place ? `of ${fmt(place.of)}` : 'Place'}</div>
        </div>
        {windowText ? <div className="mwin">{windowText}</div> : null}
        <div className="sp" />
        <div className="meta">{crowd ? `Crowd has ${fmt(crowd.crowdFound)} of ${fmt(N)} · updated ${ago(Date.now() - crowd.at)}` : 'Counting the crowd'}{windowText ? <><br />{windowText}</> : null}</div>
        <div className="btns">
          <button className="pill" onClick={() => loadCrowd(true)} disabled={refreshing}>{refreshing ? 'Refreshing' : 'Refresh'}</button>
          <button className={'pill' + (panel === 'list' ? ' on' : '')} onClick={() => setPanel(panel === 'list' ? null : 'list')}>List</button>
          <button className={'pill' + (panel === 'standings' ? ' on' : '')} onClick={() => setPanel(panel === 'standings' ? null : 'standings')}>Standings</button>
          <button className="pill" onClick={toggleTheme}>{C ? 'Light' : 'Dark'}</button>
          <button className={'pill' + (panel === 'help' ? ' on' : '')} onClick={() => setPanel(panel === 'help' ? null : 'help')} aria-label="How to play">?</button>
        </div>
      </div>
      <div className="stage" ref={stageRef}>
        <canvas ref={cvRef} className="board" aria-label={`${SIZE} by ${SIZE} word search of ${P.theme}`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse' && dragSel.current && dragSel.current.hover) { dragSel.current = null; redraw(); } }}
          onContextMenu={(e) => e.preventDefault()} />
        {read ? <div className="read" aria-live="polite">{read}</div> : null}
        {toast && (
          <div key={toast.k} className={'toast' + (toast.uniq ? ' uniq' : '') + (toast.find ? ' find' : '')} aria-live="polite">
            <b>{toast.title}{toast.y ? <i>{toast.y}</i> : null}</b>
            <span>{toast.line}</span>
          </div>
        )}
        <div className="zoom" role="group" aria-label="Zoom">
          <button onClick={() => zoomBtn(1 / 1.35)} aria-label="Zoom out">&minus;</button>
          <button onClick={fit} aria-label="Show the whole grid">Fit</button>
          <button onClick={() => zoomBtn(1.35)} aria-label="Zoom in">+</button>
        </div>
        <div className="mini" onClick={onMini} title="Jump anywhere on the grid"><canvas ref={miniRef} /></div>
        {!live && hydrated && (
          <div className="arch">This board is closed: finds here are for fun. <button className="lnk" onClick={() => setPanel('final')}>Final results</button>{!isCurrent && <> · <a href="/search">The open board</a></>}</div>
        )}
        {panel === 'list' && listPanel}
        {panel === 'standings' && standingsPanel}
        {panel === 'help' && helpPanel}
        {panel === 'final' && finalPanel}
      </div>
    </div>
  );
}
