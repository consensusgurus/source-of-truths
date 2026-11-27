'use client';

// Wanted: the enormous hidden figure hunt (owner, 2026-11-26: "as interesting as
// a where's waldo page, but humongous. It should play like search"). One huge
// crowd scene made of districts; Otis, his friends, lost things, odd scenes and
// one-of-a-kind people are hidden in every district.
//
// THE SCENE IS DRAWN HERE, NOT DOWNLOADED. lib/wanted-engine.js builds the whole
// board from its seed (about a tenth of a second) and this page paints it in
// square tiles at whatever zoom the player is at, so the drawings are sharp at
// any size (owner: "make the drawings a bit sharper"). Tiles are painted a few
// per frame, nearest the middle first, kept in a small cache, and a coarser tile
// stands in until the sharp one is ready.
//
// It plays like Search: your own copy, every find is a pot of 100 points split
// among its finders, a find says who else has it, Refresh (or two minutes)
// brings the crowd's latest. No clock, no Give up, and a wrong tap costs
// nothing. A board stays open until the crowd has found everything on it.

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { wantedValue, WANTED_POT } from '@/lib/wanted';
import { wantedBuild, wantedDraw, wantedHit, wantedIcon } from '@/lib/wanted-engine';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const REFRESH_MS = 120000;
const SYNC_MS = 12000;
const TILE = 512;
const KIND = { cast: 'Otis and friends', lost: 'Lost thing', scene: 'Odd scene', one: 'One of a kind' };

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

// A list portrait, drawn by the same code that draws the scene.
function Portrait({ t, size = 40, board }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !t) return;
    const d = Math.min(3, window.devicePixelRatio || 1), w = size, h = Math.round(size * 1.15);
    c.width = w * d; c.height = h * d;
    const g = c.getContext('2d');
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h - 4); g.scale(size / 36, size / 36);
    const drew = wantedIcon(g, t);
    g.restore();
    if (!drew && board) {
      // An odd scene has no portrait of its own: show the scene itself, cut out of the page.
      const b = t.box, bw = b[2] - b[0] + 8, bh = b[3] - b[1] + 8, k = Math.min(w / bw, h / bh);
      g.save(); g.translate(w / 2, h / 2); g.scale(k, k); g.translate(-(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2);
      wantedDraw(board, g, b[0] - 4 - w / k, b[1] - 4 - h / k, b[2] + 4 + w / k, b[3] + 4 + h / k, 1);
      g.restore();
    }
  }, [t, size, board]);
  return <canvas ref={ref} className="pic" style={{ width: size, height: Math.round(size * 1.15) }} aria-hidden="true" />;
}

export default function WantedClient({ puzzle, win, currentNum, past = [] }) {
  const P = puzzle;
  const N = P.n;
  const STORE = `sot_wanted_${P.num}`;
  const VIEW = `sot_wanted_view_${P.num}`;
  const [closedNow, setClosedNow] = useState(false);
  const closesAt = win && win.closes;
  const live = !closedNow && !(closesAt && closesAt <= Date.now());
  const isCurrent = P.num === currentNum;

  const [theme, setTheme] = useState('light');
  const [found, setFound] = useState({}); // id -> [foundAtMs, syncedAtMs]
  const [crowd, setCrowd] = useState(null);
  const [me, setMe] = useState(null);
  const [myName, setMyName] = useState(null);
  const [panel, setPanel] = useState(null); // 'list' | 'standings' | 'help' | 'final' | 'past'
  const [toast, setToast] = useState(null);
  const [tick, setTick] = useState(0);
  const [listTab, setListTab] = useState('left');
  const [listD, setListD] = useState(-1);
  const [hydrated, setHydrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [ready, setReady] = useState(false);
  const [want, setWant] = useState(0);

  const stageRef = useRef(null);
  const cvRef = useRef(null);
  const miniRef = useRef(null);
  const boardRef = useRef(null);
  const view = useRef({ z: 1, ox: 0, oy: 0, init: true });
  const tiles = useRef(new Map());
  const frame = useRef(0);
  const miniBase = useRef(null);
  const ptrs = useRef(new Map());
  const gesture = useRef(null);
  const raf = useRef(0);
  const foundRef = useRef(found); foundRef.current = found;
  const themeRef = useRef(theme); themeRef.current = theme;
  const pulse = useRef(null);
  const ripple = useRef(null);
  const toastT = useRef(null);
  const dirty = useRef(false);
  const miniDrag = useRef(false);
  const saveT = useRef(null);

  // ---- saves and the build ------------------------------------------------------
  useEffect(() => {
    try { if (localStorage.getItem('sot_theme2') === 'dark') setTheme('dark'); } catch (e) {}
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (s && s.v === 1 && s.found) setFound(s.found);
    } catch (e) {}
    try {
      const v = JSON.parse(localStorage.getItem(VIEW) || 'null');
      if (v && v.z > 0) view.current = v;
    } catch (e) {}
    setNarrow(window.innerWidth < 720);
    setHydrated(true);
    const onR = () => setNarrow(window.innerWidth < 720);
    window.addEventListener('resize', onR);
    // The page paints its loading message first, then builds the scene.
    const t = setTimeout(() => {
      try { boardRef.current = wantedBuild(P); } catch (e) { boardRef.current = null; }
      tiles.current = new Map();
      const first = boardRef.current && boardRef.current.targets.find((x) => x.kind === 'cast');
      if (first) setWant(first.id);
      setReady(!!boardRef.current);
    }, 40);
    return () => { window.removeEventListener('resize', onR); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE, JSON.stringify({ v: 1, found })); } catch (e) {}
  }, [found, hydrated, STORE]);
  const saveView = useCallback(() => {
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => { try { const { z, ox, oy } = view.current; localStorage.setItem(VIEW, JSON.stringify({ z, ox, oy })); } catch (e) {} }, 300);
  }, [VIEW]);
  const T = ready && boardRef.current ? boardRef.current.targets : [];
  const D = ready && boardRef.current ? boardRef.current.districts : [];

  // ---- the crowd ------------------------------------------------------------------
  const loadCrowd = useCallback(async (manual) => {
    if (manual) setRefreshing(true);
    try {
      const r = await fetch(`/api/wanted?board=${P.num}${manual ? `&r=${Math.floor(Date.now() / 30000)}` : ''}`);
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

  // ---- sending finds ----------------------------------------------------------------
  const sync = useCallback(async (force) => {
    if (!live) return;
    const f = foundRef.current;
    const ids = Object.keys(f).map(Number);
    if (!ids.length && !force) return;
    const body = JSON.stringify({ board: P.num, anonId: getAnonId(), email: getEmail(), found: ids, force: !!force });
    const sentAt = Date.now();
    try {
      const r = await fetch('/api/wanted', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body });
      const d = await r.json();
      if (!d || d.error) return;
      dirty.current = false;
      if (d.me) setMe(d.me);
      if (d.name) setMyName(d.name);
      setFound((cur) => {
        const next = { ...cur };
        for (const i of ids) if (next[i] && !next[i][1]) next[i] = [next[i][0], sentAt];
        for (const i of d.found || []) if (!next[i]) next[i] = [0, sentAt]; // found on another device
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

  // How many players have found thing i, counting this player once.
  const countOf = useCallback((i) => {
    const base = crowd ? crowd.counts[i] || 0 : 0;
    const f = found[i];
    if (!f || !live) return base;
    const counted = f[1] && crowd && f[1] < crowd.at;
    return counted ? base : base + 1;
  }, [crowd, found, live]);

  const mine = Object.keys(found).map(Number).filter((i) => i < N);
  const total = mine.length;
  const points = mine.reduce((a, i) => a + wantedValue(countOf(i)), 0);
  const place = useMemo(() => {
    if (!crowd || !total) return null;
    let better = 0;
    for (const [pt, t] of crowd.field) if (pt > points || (pt === points && t > total)) better++;
    const inField = crowd.standings.some((s) => s.id === me);
    return { at: better + 1, of: Math.max(crowd.players + (inField ? 0 : 1), better + 1) };
  }, [crowd, points, total, me]);
  const finalShown = useRef(false);
  useEffect(() => {
    if (!live && crowd && crowd.closed && !finalShown.current) { finalShown.current = true; setPanel('final'); }
  }, [live, crowd]);

  function say(t) {
    setToast({ ...t, k: Date.now() });
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), t.find ? 3200 : 3000);
  }

  // ---- the canvas ---------------------------------------------------------------------
  const pageBg = () => (themeRef.current === 'dark' ? '#0f1218' : '#e9e4d6');
  function renderTile(board, k, ix, iy) {
    const L = Math.pow(2, k), tw = TILE / L;
    const c = document.createElement('canvas'); c.width = TILE; c.height = TILE;
    const g = c.getContext('2d');
    g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, TILE, TILE);
    g.scale(L, L); g.translate(-ix * tw, -iy * tw);
    g.beginPath(); g.rect(0, 0, board.W, board.H); g.clip();
    wantedDraw(board, g, ix * tw, iy * tw, (ix + 1) * tw, (iy + 1) * tw, L >= 0.5 ? 1 : 0);
    return c;
  }
  const draw = useCallback(() => {
    raf.current = 0;
    const cv = cvRef.current, st = stageRef.current;
    if (!cv || !st) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const W = st.clientWidth, H = st.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = pageBg(); ctx.fillRect(0, 0, W, H);
    const board = boardRef.current;
    if (!board) return;
    const v = view.current;
    const k = Math.max(-5, Math.min(3, Math.ceil(Math.log2(v.z * dpr) - 0.02)));
    const tw = TILE / Math.pow(2, k);
    const wx0 = -v.ox / v.z, wy0 = -v.oy / v.z, wx1 = wx0 + W / v.z, wy1 = wy0 + H / v.z;
    const ix0 = Math.max(0, Math.floor(wx0 / tw)), ix1 = Math.min(Math.ceil(board.W / tw) - 1, Math.floor(wx1 / tw));
    const iy0 = Math.max(0, Math.floor(wy0 / tw)), iy1 = Math.min(Math.ceil(board.H / tw) - 1, Math.floor(wy1 / tw));
    const f = ++frame.current, need = [];
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const cxm = (wx0 + wx1) / 2, cym = (wy0 + wy1) / 2;
    for (let iy = iy0; iy <= iy1; iy++) for (let ix = ix0; ix <= ix1; ix++) {
      const sx = Math.floor(ix * tw * v.z + v.ox), sy = Math.floor(iy * tw * v.z + v.oy), ss = Math.ceil(tw * v.z) + 1;
      const t = tiles.current.get(`${k}:${ix}:${iy}`);
      if (t) { t.used = f; ctx.drawImage(t.c, sx, sy, ss, ss); continue; }
      for (let kk = k - 1; kk >= Math.max(-5, k - 5); kk--) {
        const q = Math.pow(2, k - kk), pt = tiles.current.get(`${kk}:${Math.floor(ix / q)}:${Math.floor(iy / q)}`);
        if (pt) { pt.used = f; const sub = TILE / q; ctx.drawImage(pt.c, (ix % q) * sub, (iy % q) * sub, sub, sub, sx, sy, ss, ss); break; }
      }
      const dx = (ix + 0.5) * tw - cxm, dy = (iy + 0.5) * tw - cym;
      need.push([dx * dx + dy * dy, ix, iy]);
    }
    // what you have found: a red circle, like a pen on the page
    const fd = foundRef.current, now = performance.now();
    for (const key in fd) {
      const t = board.targets[key]; if (!t) continue;
      const b = t.box;
      if (b[2] < wx0 - 40 || b[0] > wx1 + 40 || b[3] < wy0 - 40 || b[1] > wy1 + 40) continue;
      const cx = (b[0] + b[2]) / 2 * v.z + v.ox, cy = (b[1] + b[3]) / 2 * v.z + v.oy;
      let grow = 1;
      if (pulse.current && pulse.current.i === Number(key)) { const a = (now - pulse.current.t) / 520; grow = a < 1 ? 1.5 - 0.5 * a : 1; }
      const rx = Math.max(13, (b[2] - b[0]) / 2 * v.z + 6) * grow, ry = Math.max(13, (b[3] - b[1]) / 2 * v.z + 6) * grow;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, -0.08, 0, 7);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = '#d22b2b'; ctx.lineWidth = 3; ctx.stroke();
    }
    let again = false;
    if (pulse.current && now - pulse.current.t < 520) again = true;
    if (ripple.current) {
      const a = (now - ripple.current.t) / 420;
      if (a < 1) { ctx.beginPath(); ctx.arc(ripple.current.x, ripple.current.y, 6 + a * 16, 0, 7); ctx.strokeStyle = `rgba(31,29,26,${1 - a})`; ctx.lineWidth = 2; ctx.stroke(); again = true; } else ripple.current = null;
    }
    if (need.length) {
      need.sort((a, b) => a[0] - b[0]);
      const t0 = performance.now(); let made = 0;
      for (const n of need) {
        if (made && performance.now() - t0 > 12) break;
        tiles.current.set(`${k}:${n[1]}:${n[2]}`, { c: renderTile(board, k, n[1], n[2]), used: f });
        made++;
      }
      again = true;
      const cap = window.innerWidth < 720 ? 44 : 90;
      if (tiles.current.size > cap) {
        const old = [...tiles.current.entries()].filter(([, t]) => t.used < f - 1).sort((a, b) => a[1].used - b[1].used);
        for (let i = 0; i < old.length && tiles.current.size > cap * 0.8; i++) tiles.current.delete(old[i][0]);
      }
    }
    drawMini();
    if (again) raf.current = requestAnimationFrame(draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const redraw = useCallback(() => { if (!raf.current) raf.current = requestAnimationFrame(draw); }, [draw]);

  function miniSize() { const board = boardRef.current; const w = window.innerWidth < 720 ? 92 : 132; return [w, board ? Math.round(w * board.H / board.W) : Math.round(w * 0.75)]; }
  function drawMini() {
    const mc = miniRef.current, st = stageRef.current, board = boardRef.current;
    if (!mc || !st || !board) return;
    const [mw, mh] = miniSize(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (mc.width !== mw * dpr || mc.height !== mh * dpr) { mc.width = mw * dpr; mc.height = mh * dpr; mc.style.width = mw + 'px'; mc.style.height = mh + 'px'; }
    const ctx = mc.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (miniBase.current) ctx.drawImage(miniBase.current, 0, 0, mw, mh); else { ctx.fillStyle = '#cfe6bd'; ctx.fillRect(0, 0, mw, mh); }
    const k = mw / board.W;
    ctx.fillStyle = '#d22b2b';
    for (const key in foundRef.current) { const t = board.targets[key]; if (!t) continue; ctx.beginPath(); ctx.arc((t.box[0] + t.box[2]) / 2 * k, (t.box[1] + t.box[3]) / 2 * k, 1.6, 0, 7); ctx.fill(); }
    const v = view.current;
    const vx = (-v.ox / v.z) * k, vy = (-v.oy / v.z) * k, vw = (st.clientWidth / v.z) * k, vh = (st.clientHeight / v.z) * k;
    ctx.strokeStyle = '#15171c'; ctx.lineWidth = 1.5;
    ctx.strokeRect(Math.max(0.75, vx), Math.max(0.75, vy), Math.min(mw - 1.5 - Math.max(0, vx), vw), Math.min(mh - 1.5 - Math.max(0, vy), vh));
  }

  function zMin() { const st = stageRef.current, board = boardRef.current; if (!st || !board) return 0.05; return Math.min(st.clientWidth / board.W, st.clientHeight / board.H) * 0.96; }
  function clampView() {
    const st = stageRef.current, board = boardRef.current; if (!st || !board) return;
    const v = view.current, W = st.clientWidth, H = st.clientHeight;
    v.z = Math.max(zMin(), Math.min(3.2, v.z));
    const bw = board.W * v.z, bh = board.H * v.z, px = W / 4, py = H / 4;
    if (bw + 2 * px < W) v.ox = (W - bw) / 2; else v.ox = Math.min(px, Math.max(W - bw - px, v.ox));
    if (bh + 2 * py < H) v.oy = (H - bh) / 2; else v.oy = Math.min(py, Math.max(H - bh - py, v.oy));
  }
  function zoomAt(f, x, y) {
    const v = view.current;
    const wx = (x - v.ox) / v.z, wy = (y - v.oy) / v.z;
    v.z *= f; clampView();
    v.ox = x - wx * v.z; v.oy = y - wy * v.z; clampView();
    redraw();
  }
  function zoomBtn(f) { const st = stageRef.current; if (st) zoomAt(f, st.clientWidth / 2, st.clientHeight / 2); saveView(); }
  function fit() {
    const st = stageRef.current, board = boardRef.current; if (!st || !board) return;
    const v = view.current; v.z = zMin();
    v.ox = (st.clientWidth - board.W * v.z) / 2; v.oy = (st.clientHeight - board.H * v.z) / 2;
    redraw(); saveView();
  }
  function lookAt(x0, y0, x1, y1, zWant) {
    const st = stageRef.current; if (!st) return;
    const v = view.current;
    v.z = zWant || Math.min(st.clientWidth / (x1 - x0), st.clientHeight / (y1 - y0)) * 0.98;
    clampView();
    v.ox = st.clientWidth / 2 - ((x0 + x1) / 2) * v.z; v.oy = st.clientHeight / 2 - ((y0 + y1) / 2) * v.z;
    clampView(); redraw(); saveView();
  }
  function showDistrict(d) { const dd = D[d]; if (dd) lookAt(dd.ox, dd.oy, dd.ox + 1600, dd.oy + 1200); }
  function showTarget(t) { const b = t.box; lookAt(b[0], b[1], b[2], b[3], Math.max(view.current.z, 1.4)); }

  useEffect(() => {
    if (!hydrated || !ready) return undefined;
    const st = stageRef.current, board = boardRef.current;
    if (view.current.init) {
      // A first visit opens zoomed in on a district picked at random, so the
      // crowd does not all start hunting in the same corner.
      const d = board.districts[Math.floor(Math.random() * board.districts.length)];
      const z = st.clientWidth < 720 ? 0.85 : 1.2;
      view.current = { z, ox: st.clientWidth / 2 - (d.ox + 800) * z, oy: st.clientHeight / 2 - (d.oy + 620) * z };
    }
    clampView(); redraw();
    const ro = new ResizeObserver(() => { clampView(); redraw(); });
    ro.observe(st);
    // The little map: the whole board, painted once when the page is idle.
    const mt = setTimeout(() => {
      const w = 264, c = document.createElement('canvas'); c.width = w; c.height = Math.round(w * board.H / board.W);
      const g = c.getContext('2d'); g.scale(w / board.W, w / board.W);
      wantedDraw(board, g, 0, 0, board.W, board.H, 0);
      miniBase.current = c; redraw();
    }, 900);
    return () => { ro.disconnect(); clearTimeout(mt); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, ready]);
  useEffect(() => { redraw(); }, [found, theme, redraw]);

  // ---- a tap ----------------------------------------------------------------------------
  function tapAt(x, y) {
    const board = boardRef.current; if (!board) return;
    const v = view.current;
    const hit = wantedHit(board, (x - v.ox) / v.z, (y - v.oy) / v.z, Math.max(2, 10 / v.z));
    if (!hit) { ripple.current = { x, y, t: performance.now() }; redraw(); return; }
    if (hit.why) { ripple.current = { x, y, t: performance.now() }; say({ title: 'Close', line: `Not Otis: ${hit.why}` }); redraw(); return; }
    const t = hit.t, i = t.id, where = D[t.d] ? D[t.d].name : '';
    const prior = foundRef.current[i];
    if (prior) { say({ title: t.name, y: where, line: 'Already found' }); return; }
    setFound((cur) => ({ ...cur, [i]: [Date.now(), 0] }));
    dirty.current = true;
    pulse.current = { i, t: performance.now() };
    const others = crowd ? (crowd.counts[i] || 0) : null;
    let line;
    if (!live) line = others == null ? 'This board is closed: finds here are for fun' : (others === 0 ? 'Nobody found it while the board was open' : `${fmt(others)} ${others === 1 ? 'player' : 'players'} found it`);
    else if (others == null) line = 'Counting the crowd...';
    else if (others === 0) line = `You're the first finder · all ${WANTED_POT} points, for now`;
    else {
      const self = new Set([myName, me ? `Guest ${me.slice(0, 4).toUpperCase()}` : null].filter(Boolean));
      const names = ((crowd && crowd.whoBy && crowd.whoBy[i]) || []).filter((n) => !self.has(n)).slice(0, 3);
      const rest = Math.max(0, others - names.length);
      const parts = rest ? [...names, `${fmt(rest)} ${names.length ? (rest === 1 ? 'other' : 'others') : (rest === 1 ? 'other player' : 'other players')}`] : names;
      const who = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
      const val = wantedValue(others + 1);
      line = `Also found by ${who} · ${fmt(val)} ${val === 1 ? 'pt' : 'pts'} each, for now`;
    }
    say({ title: t.name, y: where, line, uniq: others === 0 && live, find: true });
  }

  // ---- pointers ---------------------------------------------------------------------------
  function local(e) { const rect = cvRef.current.getBoundingClientRect(); return [e.clientX - rect.left, e.clientY - rect.top]; }
  function onDown(e) {
    const [x, y] = local(e);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    ptrs.current.set(e.pointerId, { x, y });
    if (ptrs.current.size === 2) {
      const [p1, p2] = [...ptrs.current.values()];
      gesture.current = { kind: 'pinch', d: Math.hypot(p1.x - p2.x, p1.y - p2.y), cx: (p1.x + p2.x) / 2, cy: (p1.y + p2.y) / 2 };
      return;
    }
    if (ptrs.current.size > 2) return;
    gesture.current = { kind: 'maybe', x, y };
  }
  function onMove(e) {
    const p = ptrs.current.get(e.pointerId); if (!p) return;
    const [x, y] = local(e);
    const g = gesture.current; if (!g) return;
    if (g.kind === 'pinch') {
      p.x = x; p.y = y;
      const [p1, p2] = [...ptrs.current.values()];
      if (!p2) return;
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y), cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
      view.current.ox += cx - g.cx; view.current.oy += cy - g.cy;
      if (g.d > 0) zoomAt(d / g.d, cx, cy);
      g.d = d; g.cx = cx; g.cy = cy; clampView(); redraw();
      return;
    }
    if (g.kind === 'maybe' && Math.hypot(x - g.x, y - g.y) > 8) g.kind = 'pan';
    if (g.kind === 'pan') { view.current.ox += x - p.x; view.current.oy += y - p.y; clampView(); redraw(); }
    p.x = x; p.y = y;
  }
  function onUp(e) {
    const p = ptrs.current.get(e.pointerId);
    ptrs.current.delete(e.pointerId);
    const g = gesture.current;
    if (!p || !g) return;
    if (g.kind === 'pinch') { if (ptrs.current.size === 0) { gesture.current = null; saveView(); } else gesture.current = { kind: 'pan' }; return; }
    gesture.current = null;
    if (g.kind === 'pan') { saveView(); return; }
    tapAt(g.x, g.y);
  }
  function onCancel(e) { ptrs.current.delete(e.pointerId); gesture.current = null; }
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const [x, y] = local(e);
      const unit = e.deltaMode === 1 ? 16 : 1;
      zoomAt(Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0016)), x, y);
      saveView();
    };
    cv.addEventListener('wheel', onWheel, { passive: false });
    const kd = (e) => {
      if (e.key === 'Escape') setPanel(null);
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const st = stageRef.current; if (!st) return;
      if (/^Arrow/.test(e.key)) {
        const step = Math.round(Math.min(st.clientWidth, st.clientHeight) * (e.shiftKey ? 0.5 : 0.2));
        const d = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
        if (d) { e.preventDefault(); view.current.ox += d[0]; view.current.oy += d[1]; clampView(); redraw(); saveView(); }
      }
      if (e.key === '+' || e.key === '=') zoomBtn(1.35);
      if (e.key === '-' || e.key === '_') zoomBtn(1 / 1.35);
    };
    window.addEventListener('keydown', kd);
    return () => { cv.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', kd); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  function onMini(e) {
    const board = boardRef.current, st = stageRef.current; if (!board || !st) return;
    const rect = miniRef.current.getBoundingClientRect();
    const wx = ((e.clientX - rect.left) / rect.width) * board.W, wy = ((e.clientY - rect.top) / rect.height) * board.H;
    const v = view.current;
    if (v.z < 0.5) v.z = 0.8;
    v.ox = st.clientWidth / 2 - wx * v.z; v.oy = st.clientHeight / 2 - wy * v.z;
    clampView(); redraw();
  }
  function onMiniDown(e) { miniDrag.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {} onMini(e); }
  function onMiniMove(e) { if (miniDrag.current) onMini(e); }
  function onMiniUp() { if (miniDrag.current) { miniDrag.current = false; saveView(); } }

  function toggleTheme() {
    const t = theme === 'dark' ? 'light' : 'dark';
    setTheme(t);
    try { localStorage.setItem('sot_theme2', t); } catch (e) {}
  }

  // ---- looking for ------------------------------------------------------------------------
  // The bar under the scene names one thing you have not found yet. It never
  // says where in the district it is.
  const wantT = T.length ? (found[want] ? (T.find((t) => !found[t.id]) || null) : T[want]) : null;
  function nextWant() {
    if (!T.length) return;
    const from = wantT ? wantT.id : -1;
    for (let k = 1; k <= T.length; k++) { const t = T[(from + k + T.length) % T.length]; if (!found[t.id]) { setWant(t.id); return; } }
  }

  // ---- panels -----------------------------------------------------------------------------
  const listRows = useMemo(() => {
    const rows = T.filter((t) => {
      if (listD >= 0 && t.d !== listD) return false;
      if (listTab === 'found' && !found[t.id]) return false;
      if ((listTab === 'left' || listTab === 'rare') && found[t.id]) return false;
      if (listTab === 'rare' && crowd && (crowd.counts[t.id] || 0) > 0) return false;
      return true;
    });
    // Within a district: Otis and friends first, then the people, the lost things, the scenes.
    const order = { cast: 0, one: 1, lost: 2, scene: 3 };
    return rows.sort((a, b) => a.d - b.d || order[a.kind] - order[b.kind] || a.id - b.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, found, listTab, listD, crowd]);
  const unfoundN = crowd ? crowd.counts.filter((c) => !c).length : null;

  const W = crowd && crowd.opens ? crowd : win;
  let windowText = '';
  if (W && hydrated) {
    if (!live) windowText = 'Closed: the crowd found everything';
    else if (W.solvedAt) windowText = `Everything found! Closes ${whenText(W.min)}`;
    else if (isCurrent && W.min) windowText = Date.now() < W.min ? `Open until everything is found, ${whenText(W.min)} at the earliest` : 'Open until everything is found';
  }
  void tick;
  const C = theme === 'dark';
  const done = past.filter((b) => b.num !== currentNum);
  const pastBtn = done.length ? <button className="lnk pastl" onClick={() => setPanel(panel === 'past' ? null : 'past')}>Finished Boards</button> : null;

  const css = `
.wnt{--page:#f5f4f0;--card:#ffffff;--ink:#15171c;--mute:#6b7280;--line:#15171c;--soft:#e9e7e1;--good:#d9e8d0;--good-ink:#24401c;--gold:#f6e3a1;--gold-ink:#4a3b06;}
.wnt[data-theme='dark']{--page:#0f1218;--card:#171b23;--ink:#eef1f6;--mute:#98a2b3;--line:#eef1f6;--soft:#252b36;--good:#2c3f27;--good-ink:#d9e8d0;--gold:#5c4c1f;--gold-ink:#f6e3a1;}
.wnt *{box-sizing:border-box}
.wnt{position:fixed;inset:0;z-index:900;display:grid;grid-template-rows:auto 1fr;background:var(--page);color:var(--ink);font-family:${SANS};-webkit-font-smoothing:antialiased;overscroll-behavior:none}
.wnt button{font-family:inherit;color:inherit}
.wnt .top{display:flex;align-items:center;gap:8px 16px;padding:8px 14px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.wnt .logo{display:flex;align-items:center;gap:7px;font:800 15px/1.3 ${SANS};color:var(--ink);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px 5px 8px}
.wnt .name{display:flex;flex-direction:column;line-height:1.15}
.wnt .name b{font-size:19px;font-weight:800;letter-spacing:-.01em}
.wnt .name span{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.wnt .stats{display:flex;gap:14px;align-items:baseline;flex-wrap:wrap}
.wnt .stats div{font:800 11.5px/1.4 ${SANS};letter-spacing:.08em;text-transform:uppercase;color:var(--mute);white-space:nowrap}
.wnt .stats b{font:800 20px/1.25 ${SANS};color:var(--ink);font-variant-numeric:tabular-nums;letter-spacing:0;margin-right:4px}
.wnt .sp{flex:1}
.wnt .meta{font:700 12.5px/1.4 ${SANS};color:var(--mute);white-space:nowrap;text-align:right}
.wnt .btns{display:flex;gap:8px;flex-wrap:wrap}
.wnt .pill{border:1px solid var(--line);background:var(--card);color:var(--ink);font:800 12.5px/1.3 ${SANS};border-radius:999px;padding:7px 13px;cursor:pointer;white-space:nowrap}
.wnt .pill.on{background:var(--ink);color:var(--page)}
.wnt .stage{position:relative;min-height:0;overflow:hidden}
.wnt canvas.board{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}
.wnt .load{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;padding:24px;background:var(--page);z-index:2}
.wnt .load b{font-size:26px;font-weight:800;letter-spacing:-.01em;line-height:1.25}
.wnt .load span{font-size:15px;font-weight:700;color:var(--mute);line-height:1.4}
.wnt .toast{position:absolute;left:50%;top:12px;transform:translateX(-50%);min-width:220px;max-width:min(460px,calc(100% - 24px));background:var(--card);border:1px solid var(--line);border-radius:14px;padding:9px 16px 10px;box-shadow:0 8px 26px rgba(0,0,0,.18);text-align:center;pointer-events:none;animation:wntUp .22s ease-out,wntOut .5s ease-in 2.6s forwards;z-index:2}
.wnt .toast.uniq{background:var(--good);color:var(--good-ink);border-color:var(--good-ink)}
.wnt .toast b{display:block;font-size:16px;font-weight:800;letter-spacing:-.01em;line-height:1.3}
.wnt .toast b i{font-style:normal;font-weight:700;opacity:.65;margin-left:6px;font-size:13px}
.wnt .toast span{display:block;font-size:13px;font-weight:700;margin-top:2px;opacity:.85;line-height:1.35}
@keyframes wntUp{from{opacity:0;transform:translate(-50%,-6px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes wntOut{to{opacity:0}}
.wnt .zoom{position:absolute;left:12px;bottom:12px;display:flex;border:1px solid var(--line);border-radius:999px;background:var(--card);box-shadow:0 2px 10px rgba(0,0,0,.12);overflow:hidden}
.wnt .zoom button{-webkit-appearance:none;appearance:none;border:0;border-radius:0;margin:0;background:transparent;font:800 15px/1 ${SANS};height:42px;min-width:46px;padding:0 12px;cursor:pointer}
.wnt .zoom button+button{border-left:1px solid var(--line)}
.wnt .mini{position:absolute;right:12px;bottom:12px;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--card);box-shadow:0 2px 10px rgba(0,0,0,.12);cursor:pointer;line-height:0;touch-action:none}
.wnt .mini canvas{display:block}
.wnt .look{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(430px,calc(100% - 330px));display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:7px 9px;box-shadow:0 2px 10px rgba(0,0,0,.12)}
.wnt .look .k{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);line-height:1.3}
.wnt .look .n{font-size:15px;font-weight:800;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wnt .look .d{font-size:12px;font-weight:700;color:var(--mute);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.wnt .look .tx{min-width:0;border:0;background:none;padding:0;text-align:left;cursor:pointer;color:inherit}
.wnt .look .bs{display:flex;gap:6px}
.wnt .sq{border:1px solid var(--line);background:var(--card);border-radius:10px;font:800 12.5px/1.2 ${SANS};padding:9px 10px;cursor:pointer;white-space:nowrap}
.wnt .pic{flex:none;border-radius:8px;background:#cfe6bd;border:1px solid var(--soft);display:block}
.wnt .arch{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:var(--gold);color:var(--gold-ink);border:1px solid var(--gold-ink);border-radius:999px;padding:7px 14px;font:800 12.5px/1.3 ${SANS};white-space:nowrap;max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis}
.wnt .arch a{color:inherit}
.wnt .sheet{position:absolute;top:10px;right:10px;bottom:10px;width:min(420px,calc(100% - 20px));background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;z-index:3}
.wnt .sheet .hd{display:flex;align-items:center;gap:8px;padding:12px 14px 10px;border-bottom:1px solid var(--soft)}
.wnt .sheet .hd h3{margin:0;font-size:17px;font-weight:800;flex:1}
.wnt .sheet .x{border:1px solid var(--line);background:var(--card);border-radius:999px;width:32px;height:32px;cursor:pointer;font:800 16px/1 ${SANS}}
.wnt .sheet .body{flex:1;overflow-y:auto;padding:8px 14px 14px;overscroll-behavior:contain;scrollbar-width:thin;margin-right:4px;margin-bottom:6px}
.wnt .seg{display:flex;border:1px solid var(--line);border-radius:999px;overflow:hidden;margin:10px 14px 0}
.wnt .seg button{-webkit-appearance:none;appearance:none;border:0;border-radius:0;margin:0;flex:1;background:transparent;font:800 12.5px/1.3 ${SANS};padding:8px 6px;cursor:pointer;white-space:nowrap}
.wnt .seg button+button{border-left:1px solid var(--line)}
.wnt .seg button.on{background:var(--ink);color:var(--page)}
.wnt .pickd{margin:10px 14px 0;border:1px solid var(--line);border-radius:10px;padding:9px 12px;font:700 14px/1.3 ${SANS};background:var(--page);color:var(--ink);outline:none}
.wnt .row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--soft);font-size:14px;font-weight:700;width:100%;background:none;border-left:0;border-right:0;border-top:0;border-radius:0;text-align:left;cursor:pointer;color:inherit}
.wnt .row .t{flex:1;min-width:0;line-height:1.3}
.wnt .row .t b{display:block;font-weight:800}
.wnt .row .t i{display:block;font-style:normal;color:var(--mute);font-weight:700;font-size:12px;line-height:1.35}
.wnt .row.got .t b{color:var(--good-ink)}
.wnt[data-theme='dark'] .row.got .t b{color:#b7dba6}
.wnt .row .n{flex:none;font-size:12px;font-weight:800;border-radius:999px;padding:3px 9px;background:var(--soft);font-variant-numeric:tabular-nums;white-space:nowrap}
.wnt .row .n.z{background:transparent;color:var(--mute);border:1px solid var(--soft)}
.wnt .row .n.u{background:var(--good);color:var(--good-ink)}
.wnt table{width:100%;border-collapse:collapse;font-size:14px;font-weight:700}
.wnt th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);text-align:right;padding:8px 4px;font-weight:800}
.wnt th:nth-child(2),.wnt td:nth-child(2){text-align:left}
.wnt td{padding:8px 4px;border-bottom:1px solid var(--soft);text-align:right;font-variant-numeric:tabular-nums}
.wnt td:nth-child(2){max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wnt tr.me td{background:var(--gold);color:var(--gold-ink)}
.wnt .help p{margin:0 0 10px;font-size:14px;line-height:1.6;font-weight:600}
.wnt .help b{font-weight:800}
.wnt .mwin{display:none}
@media (max-width:719px){.wnt .mwin{display:flex;align-items:baseline;justify-content:space-between;gap:12px;order:6;width:100%;font:700 12px/1.3 ${SANS};color:var(--mute)}.wnt .mwin .pastl{flex:none;margin-left:auto}}
.wnt .fh{margin:16px 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:var(--mute);display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.wnt .note a,.wnt .arch a{color:inherit;font-weight:800}
.wnt .lnk{border:0;background:none;padding:0;font:inherit;text-decoration:underline;cursor:pointer;color:inherit}
.wnt .pastl{color:var(--mute);font-weight:700;text-underline-offset:2px;text-decoration-thickness:1px}
.wnt .pastl:hover{color:var(--ink)}
.wnt a.row{text-decoration:none}
.wnt .note{font-size:12.5px;color:var(--mute);font-weight:700;margin:10px 0 0;line-height:1.5}
@media (max-width:719px){
  .wnt .top{padding:7px 10px;gap:6px 10px}
  .wnt .logo span{display:none}
  .wnt .name b{font-size:17px}
  .wnt .stats{gap:10px;order:5;width:100%;justify-content:space-between}
  .wnt .stats b{font-size:17px}
  .wnt .meta{display:none}
  .wnt .btns{gap:6px}
  .wnt .pill{padding:6px 10px;font-size:12px}
  .wnt .seg button{font-size:11.5px;padding:8px 3px}
  .wnt .sheet{top:auto;left:0;right:0;bottom:0;width:auto;height:min(76%,600px);border-radius:16px 16px 0 0;border-bottom:0}
  .wnt .look{left:10px;right:10px;bottom:62px;width:auto;transform:none}
  .wnt .zoom{left:10px;bottom:10px}
  .wnt .zoom button{height:40px}
  .wnt .mini{right:10px;bottom:132px}
  .wnt .load b{font-size:22px}
}
`;

  const chip = (t) => {
    const got = !!found[t.id];
    const n = crowd ? countOf(t.id) : null;
    if (n == null) return null;
    return <span className={'n' + (got && n === 1 ? ' u' : (!n ? ' z' : ''))} title="How many players have found it, and what it pays each of them">{got ? (n === 1 ? `Only you · ${WANTED_POT} pts` : `${fmt(n)} finds · ${fmt(wantedValue(n))} pts`) : (n ? `${fmt(n)} ${n === 1 ? 'find' : 'finds'}` : 'No finds')}</span>;
  };
  const listPanel = (
    <div className="sheet" role="dialog" aria-label="The wanted list">
      <div className="hd"><h3>The Wanted List</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
      <div className="seg" role="group" aria-label="Show">
        <button className={listTab === 'left' ? 'on' : ''} onClick={() => setListTab('left')}>To find {fmt(N - total)}</button>
        <button className={listTab === 'found' ? 'on' : ''} onClick={() => setListTab('found')}>Found {fmt(total)}</button>
        <button className={listTab === 'rare' ? 'on' : ''} onClick={() => setListTab('rare')} title="Things nobody has found yet">Unfound{unfoundN != null ? ` ${fmt(unfoundN)}` : ''}</button>
        <button className={listTab === 'all' ? 'on' : ''} onClick={() => setListTab('all')}>All {fmt(N)}</button>
      </div>
      <select className="pickd" value={listD} onChange={(e) => setListD(Number(e.target.value))} aria-label="District">
        <option value={-1}>Every district</option>
        {D.map((d, i) => <option key={i} value={i}>{d.name}</option>)}
      </select>
      <div className="body">
        {listRows.map((t, k) => {
          const got = !!found[t.id];
          const head = k === 0 || listRows[k - 1].d !== t.d;
          return (
            <div key={t.id} style={{ display: 'contents' }}>
              {head && <div className="fh"><span>{D[t.d] ? D[t.d].name : ''}</span><button className="lnk pastl" onClick={() => { showDistrict(t.d); if (narrow) setPanel(null); }}>Go there</button></div>}
              <button className={'row' + (got ? ' got' : '')} onClick={() => { if (got) showTarget(t); else setWant(t.id); if (narrow) setPanel(null); }}>
                <Portrait t={t} size={46} board={boardRef.current} />
                <span className="t"><b>{got ? '✓ ' : ''}{t.name}</b><i>{t.hint}</i></span>
                {chip(t)}
              </button>
            </div>
          );
        })}
        {!listRows.length && <p className="note">{listTab === 'found' ? 'Nothing found here yet.' : (listTab === 'rare' ? 'Somebody has found everything here.' : 'Nothing left to find here.')}</p>}
        <p className="note">Tap one you have not found to hunt for it; tap one you have found to see it again. Finds are how many players have each one so far; on yours, pts is what each finder is paid right now. They lock when the board closes.</p>
      </div>
    </div>
  );

  const myRowIn = crowd && me ? crowd.standings.find((s) => s.id === me) : null;
  const standingsPanel = (
    <div className="sheet" role="dialog" aria-label="Standings">
      <div className="hd"><h3>Standings</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
      <div className="body">
        <p className="note" style={{ marginTop: 4 }}>Everything on the list is a pot of {WANTED_POT} points split among everyone who found it. Ranked on <b>points</b>, then on total finds. Values move as the crowd catches up and lock when the board closes.</p>
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

  const nameOf = (i) => (T[i] ? `${T[i].name} (${D[T[i].d] ? D[T[i].d].name : ''})` : `No. ${i + 1}`);
  const finalPanel = (() => {
    const counts = crowd ? crowd.counts : [];
    const solo = crowd && crowd.soloBy ? Object.entries(crowd.soloBy).map(([i, name]) => ({ i: Number(i), name })) : [];
    const none = counts.map((c, i) => (c === 0 ? i : -1)).filter((i) => i >= 0);
    return (
      <div className="sheet" role="dialog" aria-label="Final results">
        <div className="hd"><h3>Wanted No. {P.num}: final results</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
        <div className="body">
          {!crowd ? <p className="note">Loading the results...</p> : (
            <>
              <p className="note" style={{ marginTop: 4 }}>{none.length ? `The crowd found ${fmt(crowd.crowdFound)} of ${fmt(N)}.` : `The crowd found all ${fmt(N)}.`} {fmt(crowd.players)} {crowd.players === 1 ? 'player' : 'players'} took part.{total ? ` You found ${fmt(total)} for ${fmt(points)} points${place ? `, ${ord(place.at)} of ${fmt(place.of)}` : ''}.` : ''}</p>
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
                {solo.slice(0, 60).map(({ i, name }) => <div key={i} className="row" style={{ cursor: 'default' }}><span className="t"><b>{nameOf(i)}</b></span><span className="n u">{name}</span></div>)}
              </>)}
              {none.length > 0 && (<>
                <h4 className="fh">Nobody found</h4>
                <p className="note" style={{ marginTop: 0 }}>{none.map(nameOf).join(', ')}</p>
              </>)}
              {!isCurrent && <p className="note"><a href="/wanted">Play the open board &rarr;</a></p>}
            </>
          )}
        </div>
      </div>
    );
  })();

  const helpPanel = (
    <div className="sheet" role="dialog" aria-label="How to play">
      <div className="hd"><h3>How Wanted works</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
      <div className="body help">
        <p>One enormous crowd scene, {fmt(D.length || P.districts.length)} districts wide, with <b>{fmt(N)} things to find</b>. Think of a seek-and-find page in the spirit of Where&rsquo;s Waldo, only the page is the size of a town and everybody is searching it at once.</p>
        <p><b>Who is wanted:</b> in every district there is <b>Otis</b> (green cap, orange scarf, mustache), his friend <b>Mabel</b>, his dog <b>Biscuit</b>, a few lost things, some odd scenes, and a couple of one-of-a-kind people. Plenty of people look almost like Otis. Tap one and you are told what is wrong with him.</p>
        <p><b>To find something:</b> tap it. A wrong tap costs nothing.</p>
        <p><b>To move around:</b> drag to move, and pinch, scroll or use the buttons to zoom. Fit shows the whole page, and the little map jumps anywhere. The drawings stay sharp however far in you go.</p>
        <p><b>The Wanted List</b> stays behind the List button, sorted by district, with a picture and a hint for each. The bar at the bottom names one to hunt for; it never says where.</p>
        <p><b>Scoring:</b> everyone has the same scene, and everything on the list is a pot of <b>{WANTED_POT} points</b> split evenly among the players who find it. Find one alone and you keep all {WANTED_POT}; share it with one other player and you each get 50. The standings rank points first and total finds second.</p>
        <p>Each find tells you who found it before you. Values move as the crowd catches up: Refresh (or wait two minutes) to see the latest.</p>
        <p><b>How long it runs:</b> a board stays open until the crowd has found everything on it, however long that takes, and never less than 24 hours. There is no time limit. The next board opens the moment it closes, and the values lock. Your points count toward the day you made each find. No clock and no Give up.</p>
        <p className="note"><a href="/complaints">Report an issue</a></p>
      </div>
    </div>
  );

  return (
    <div className="wnt" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="top">
        <a className="logo" href="/" aria-label="Back to Mind Loft home">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          <svg width="22" height="22" viewBox="0 0 26 26" aria-hidden="true"><path d="M3 22V11l10-8 10 8v11h-5v-8l-5 5-5-5v8z" fill="currentColor" /></svg>
          <span>Mind Loft</span>
        </a>
        <div className="name"><b>Wanted</b><span>No. {P.num} · {fmt(P.districts.length)} districts</span></div>
        <div className="stats">
          <div><b>{fmt(total)}</b>of {fmt(N)} found</div>
          <div title="Your points: each find's 100 split among its finders"><b>{fmt(points)}</b>Points</div>
          <div title="Your place in the standings"><b>{place ? `#${fmt(place.at)}` : '—'}</b>{place ? `of ${fmt(place.of)}` : 'Place'}</div>
        </div>
        {windowText || pastBtn ? <div className="mwin">{windowText ? <span>{windowText}</span> : null}{pastBtn}</div> : null}
        <div className="sp" />
        <div className="meta">{crowd ? `Crowd has ${fmt(crowd.crowdFound)} of ${fmt(N)} · updated ${ago(Date.now() - crowd.at)}` : 'Counting the crowd'}{!windowText && pastBtn ? <> · {pastBtn}</> : null}{windowText ? <><br />{windowText}{pastBtn ? <> · {pastBtn}</> : null}</> : null}</div>
        <div className="btns">
          <button className="pill" onClick={() => loadCrowd(true)} disabled={refreshing}>{refreshing ? 'Refreshing' : 'Refresh'}</button>
          <button className={'pill' + (panel === 'list' ? ' on' : '')} onClick={() => setPanel(panel === 'list' ? null : 'list')}>List</button>
          <button className={'pill' + (panel === 'standings' ? ' on' : '')} onClick={() => setPanel(panel === 'standings' ? null : 'standings')}>Standings</button>
          <button className="pill" onClick={toggleTheme}>{C ? 'Light' : 'Dark'}</button>
          <button className={'pill' + (panel === 'help' ? ' on' : '')} onClick={() => setPanel(panel === 'help' ? null : 'help')} aria-label="How to play">?</button>
        </div>
      </div>
      <div className="stage" ref={stageRef}>
        <canvas ref={cvRef} className="board" aria-label={`A crowd scene of ${P.districts.length} districts with ${N} things to find`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}
          onContextMenu={(e) => e.preventDefault()} />
        {!ready && <div className="load" aria-live="polite"><b>Loading Wanted</b><span>This is a big page. Drawing the crowd...</span></div>}
        {toast && (
          <div key={toast.k} className={'toast' + (toast.uniq ? ' uniq' : '')} aria-live="polite">
            <b>{toast.title}{toast.y ? <i>{toast.y}</i> : null}</b>
            <span>{toast.line}</span>
          </div>
        )}
        <div className="zoom" role="group" aria-label="Zoom">
          <button onClick={() => zoomBtn(1 / 1.5)} aria-label="Zoom out">&minus;</button>
          <button onClick={fit} aria-label="Show the whole page">Fit</button>
          <button onClick={() => zoomBtn(1.5)} aria-label="Zoom in">+</button>
        </div>
        <div className="mini" onPointerDown={onMiniDown} onPointerMove={onMiniMove} onPointerUp={onMiniUp} onPointerCancel={onMiniUp} title="Click or drag to move around the page"><canvas ref={miniRef} /></div>
        {ready && !panel && (wantT ? (
          <div className="look">
            <Portrait t={wantT} size={44} board={boardRef.current} />
            <button className="tx" onClick={() => setPanel('list')} aria-label="Open the wanted list">
              <div className="k">Looking for · {D[wantT.d] ? D[wantT.d].name : ''}</div>
              <div className="n">{wantT.name}</div>
              <div className="d">{wantT.hint}</div>
            </button>
            <div className="bs">
              <button className="sq" onClick={() => showDistrict(wantT.d)}>Go there</button>
              <button className="sq" onClick={nextWant} aria-label="Next one to look for">&rarr;</button>
            </div>
          </div>
        ) : (
          <div className="look" style={{ gridTemplateColumns: '1fr' }}><div><div className="n">You found everything</div><div className="d">{fmt(points)} points. They move until the board closes.</div></div></div>
        ))}
        {!live && hydrated && (
          <div className="arch">This board is closed: finds here are for fun. <button className="lnk" onClick={() => setPanel('final')}>Final results</button>{!isCurrent && <> · <a href="/wanted">The open board</a></>}</div>
        )}
        {panel === 'list' && listPanel}
        {panel === 'standings' && standingsPanel}
        {panel === 'help' && helpPanel}
        {panel === 'final' && finalPanel}
        {panel === 'past' && (
          <div className="sheet" role="dialog" aria-label="Finished boards">
            <div className="hd"><h3>Finished Boards</h3><button className="x" onClick={() => setPanel(null)} aria-label="Close">&times;</button></div>
            <div className="body">
              <p className="note" style={{ marginTop: 4 }}>Every closed board stays here with its final results. Finds on them are for fun.</p>
              {done.map((b) => (
                <a key={b.num} className="row" href={`/wanted?b=${b.num}`}><span className="t"><b>Wanted No. {b.num}</b></span><span className="n z">{b.closes ? `Closed ${new Date(b.closes).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}` : 'Closed'}</span></a>
              ))}
              {!isCurrent && <p className="note"><a href="/wanted">Play the open board &rarr;</a></p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
