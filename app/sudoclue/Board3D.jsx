'use client';

// THE 3D BOARD (owner, 2026-11-02). The scene itself is lib/sudoclue-3d.js; this component mounts it, keeps it in
// step with the game, and lays the flat text over it.
//   Camera   angled, looking down at 68 degrees (owner: "reduce the tilt"); drag turns the room a little and it
//            springs back. A tap that does not drag picks the square under the finger (raycast, so a seat's
//            top counts as its square).
//   Text     room names, name tags and role tags are HTML, never drawn in 3D (owner: "that should still be
//            flat"). A room name tries the left then the right end of its back wall, then one step lower, and
//            takes the first spot clear of people and other names; it fades only if every spot is taken.
//   Overlay  per move: shaded taken rows and columns, Mark crosses, the selected person's named objects glow,
//            the Nudge squares, the selection, clash and answer rings, and the cast as painted figures.
// Anything that fails (no WebGL, the library will not load) calls onFail and the game shows the flat board.
import React, { useEffect, useRef } from 'react';
import { CAST as LOOKS, ROLE_COLORS } from '@/lib/sudoclue-art';
import { createKit, placeData, buildRoom } from '@/lib/sudoclue-3d';

const ANG = 68, DIST = 2.45, FOV = 26;
const k2 = (r, c) => `${r},${c}`;

export default function Board3D({ layout, cast, colors, place, sel, roles, cross, bad, glow, shade, nudge, hl, interactive, isOpen, onTap, onThumbs, onItemThumbs, onFail, cellLabel }) {
  const boxRef = useRef(null), labRef = useRef(null);
  const S = useRef({});                     // three.js state, outside React
  const props = useRef({}); props.current = { place, sel, roles, cross, bad, glow, shade, nudge, hl, interactive, onTap, cast, colors };

  // ---- mount: renderer, camera, lights, the room
  useEffect(() => {
    let dead = false; const s = S.current;
    (async () => {
      let THREE, RBG;
      try { THREE = await import('three'); RBG = (await import('three/examples/jsm/geometries/RoundedBoxGeometry.js')).RoundedBoxGeometry; }
      catch (e) { if (!dead && onFail) onFail(); return; }
      if (dead) return;
      let renderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
      catch (e) { if (onFail) onFail(); return; }
      if (!renderer.getContext()) { if (onFail) onFail(); return; }
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .75;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.setClearColor(0x2b1e15);
      const box = boxRef.current; if (!box) return;
      box.insertBefore(renderer.domElement, box.firstChild);
      Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(FOV, 1, 1, 60);
      const sun = new THREE.DirectionalLight(0xfff0dc, 2.4 * Math.PI); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0015; sun.shadow.normalBias = .02;
      scene.add(sun, sun.target, new THREE.HemisphereLight(0xf4f7ff, 0x8a929c, .18 * Math.PI));
      const kit = createKit(THREE, RBG);
      const P = placeData(layout); const N = P.N;
      const isOpenFn = (r, c) => (isOpen ? isOpen(k2(r, c)) : true);
      let room;
      try { room = await buildRoom(kit, THREE, P, isOpenFn); } catch (e) { if (onFail) onFail(); renderer.dispose(); return; }
      if (dead) { renderer.dispose(); return; }
      scene.add(room.root);
      // lamps were authored for the old light model: scale them to the physical one
      room.root.traverse((o) => { if (o.isPointLight) { o.intensity *= Math.PI * 1.6; o.decay = 2; } });
      const overlay = new THREE.Group(), people = new THREE.Group(); scene.add(overlay, people);
      sun.position.set(-N * .55, N * 1.3, -N * .7); const sc = sun.shadow.camera; sc.left = -N; sc.right = N; sc.top = N; sc.bottom = -N; sc.near = .5; sc.far = N * 4; sc.updateProjectionMatrix();
      // flat room names
      const lab = labRef.current; lab.innerHTML = '';
      const roomLabels = room.labels.map((l) => { const el = document.createElement('div'); el.className = 'b3-room' + (l.out ? ' out' : ''); el.textContent = l.name; lab.appendChild(el);
        return { el, k: l.k, a: new THREE.Vector3(...l.a), b: new THREE.Vector3(...l.b) }; });
      Object.assign(s, { THREE, renderer, scene, cam, kit, P, N, room, overlay, people, roomLabels, tags: [], figs: {}, az: 0, el: ANG, raf: 0 });
      // figures for the cast cards
      if (onItemThumbs) { try { onItemThumbs(await kit.itemThumbs(room.foot)); } catch (e) {} }
      if (dead) return;
      if (onThumbs) { try { onThumbs(await kit.figureThumbs(cast.map((id) => ({ id, look: LOOKS[id], color: colors[id] })))); } catch (e) {} }
      if (dead) return;
      const ro = new ResizeObserver(() => size()); ro.observe(box); s.ro = ro;
      size(); sync();
    })();
    return () => { dead = true; const t = S.current; if (t.ro) t.ro.disconnect(); if (t.raf) cancelAnimationFrame(t.raf);
      if (t.renderer) { t.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { if (x.map) x.map.dispose(); if (x.bumpMap) x.bumpMap.dispose(); x.dispose(); }); });
        t.renderer.dispose(); if (t.renderer.domElement.parentNode) t.renderer.domElement.parentNode.removeChild(t.renderer.domElement); }
      S.current = {}; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // ---- every move: overlays, people, tags
  useEffect(() => { sync(); });

  function size() { const s = S.current; const box = boxRef.current; if (!s.renderer || !box) return; const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    s.renderer.setSize(w, h, false); s.cam.aspect = w / h; s.cam.updateProjectionMatrix(); render(); }
  function aim() { const s = S.current; const e = s.el * Math.PI / 180, a = s.az * Math.PI / 180, d = s.N * DIST;
    s.cam.position.set(Math.sin(a) * Math.cos(e) * d, Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d); s.cam.lookAt(0, 0, .08); s.cam.updateMatrixWorld(); }
  function render() { const s = S.current; if (!s.renderer || s.raf) return; s.raf = requestAnimationFrame(() => { s.raf = 0; aim(); s.renderer.render(s.scene, s.cam); layout3(); }); }

  function sync() {
    const s = S.current; if (!s.renderer) return; const { THREE, N, overlay, people, kit } = s; const p = props.current;
    const X = (c) => c - N / 2 + 0.5, Z = (r) => r - N / 2 + 0.5; const top = (r, c) => s.room.cellTop[r * N + c] || 0;
    const clear = (g) => { for (const o of [...g.children]) { g.remove(o); o.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material && !Array.isArray(x.material)) x.material.dispose(); }); } };
    clear(overlay); for (const o of [...people.children]) people.remove(o);
    const tile = (r, c, color, op) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.94, .94), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(X(c), top(r, c) + .01, Z(r)); m.renderOrder = 2; overlay.add(m); };
    const outline = (r, c, color, w) => { const m = new THREE.Mesh(new THREE.RingGeometry(.4, .4 + (w || .06), 4, 1, Math.PI / 4), new THREE.MeshBasicMaterial({ color, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.scale.set(1.41, 1.41, 1); m.position.set(X(c), top(r, c) + .016, Z(r)); m.renderOrder = 3; overlay.add(m); };
    const ring = (r, c, color, rad) => { const m = new THREE.Mesh(new THREE.TorusGeometry(rad, .028, 8, 40), new THREE.MeshBasicMaterial({ color })); m.rotation.x = -Math.PI / 2; m.position.set(X(c), top(r, c) + .03, Z(r) + .05); overlay.add(m); };
    if (p.shade) { p.shade.forEach((k) => { const [r, c] = k.split(',').map(Number); tile(r, c, 0x05070d, .55); });
      // each placed person's row and column also gets two solid light edges, so the strip reads at a glance
      const edgeM = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: .85, depthWrite: false });
      const edge = (x, z, w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), edgeM); m.rotation.x = -Math.PI / 2; m.position.set(x, .014, z); m.renderOrder = 3; overlay.add(m); };
      const rows = new Set(), cols = new Set(); for (const id of p.cast) { const x = p.place[id]; if (x) { rows.add(x[0]); cols.add(x[1]); } }
      rows.forEach((r) => { if (!rows.has(r - 1)) edge(0, Z(r) - .5, N, .045); if (!rows.has(r + 1)) edge(0, Z(r) + .5, N, .045); });
      cols.forEach((c) => { if (!cols.has(c - 1)) edge(X(c) - .5, 0, .045, N); if (!cols.has(c + 1)) edge(X(c) + .5, 0, .045, N); }); }
    if (p.nudge) p.nudge.forEach(([r, c]) => tile(r, c, 0xfb7185, .3));
    if (p.glow) p.glow.forEach(([r, c]) => outline(r, c, 0xfacc15));
    if (p.cross) Object.keys(p.cross).forEach((k) => { if (!p.cross[k]) return; const [r, c] = k.split(',').map(Number); const mat = new THREE.MeshStandardMaterial({ color: 0x1f2229, roughness: .6 });
      for (const a of [Math.PI / 4, -Math.PI / 4]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.52, .03, .07), mat); b.position.set(X(c), top(r, c) + .02, Z(r)); b.rotation.y = a; b.castShadow = true; overlay.add(b); } });
    if (p.hl) p.hl.forEach(([r, c]) => ring(r, c, 0xfde047, .4));
    // people: painted figures, built once per person and moved
    const tags = []; const lab = labRef.current;
    s.tags.forEach((t) => t.el.remove());
    for (const id of p.cast) { const x = p.place[id]; if (!x) continue; const [r, c] = x; const y = top(r, c);
      let f = s.figs[id]; if (!f) { f = kit.figure(LOOKS[id], p.colors[id]); f.scale.setScalar(2.05); f.rotation.x = -.5; s.figs[id] = f; }
      f.position.set(X(c), y, Z(r) + .05); people.add(f);
      if (p.sel === id && p.interactive) ring(r, c, 0xbe123c, .36);
      if (p.bad && p.bad.has(id)) ring(r, c, 0xf97316, .42);
      const nt = document.createElement('div'); nt.className = 'b3-tag' + (p.sel === id && p.interactive ? ' on' : ''); nt.textContent = id; lab.appendChild(nt);
      tags.push({ el: nt, at: new THREE.Vector3(X(c), y + .02, Z(r) + .3), base: new THREE.Vector3(X(c), y + .05, Z(r)), top: new THREE.Vector3(X(c), y + .74, Z(r)), up: false });
      if (p.roles && p.roles[id]) { const rt = document.createElement('div'); rt.className = 'b3-role'; rt.textContent = p.roles[id]; rt.style.background = ROLE_COLORS[p.roles[id]] || '#1f2229'; lab.appendChild(rt);
        tags.push({ el: rt, at: new THREE.Vector3(X(c), y + .8, Z(r) + .05), up: true, name: nt }); } }
    s.tags = tags; render();
  }

  // flat text, placed from the camera
  function layout3() {
    const s = S.current; const box = boxRef.current; if (!s.cam || !box) return; const W = box.clientWidth, H = box.clientHeight;
    const proj = (v) => { const q = v.clone().project(s.cam); return [(q.x + 1) / 2 * W, (1 - q.y) / 2 * H]; };
    const taken = [];
    for (const t of s.tags) { const [x, y] = proj(t.at); t.el.style.left = x + 'px'; t.el.style.top = y + 'px';
      if (t.base) { const [, yb] = proj(t.base), [, yt] = proj(t.top); const w = (yb - yt) * 1.2; taken.push({ x: x - w / 2, y: yt - 4, w, h: yb - yt + 24, person: 1 }); } }
    // a role tag that would cover someone else's name tag drops to just under its own name instead
    const bx0 = box.getBoundingClientRect(); const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - bx0.left, y: r.top - bx0.top, w: r.width, h: r.height }; };
    const meet = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    for (const t of s.tags) if (t.up && t.name) { const me = rectOf(t.el);
      if (s.tags.some((o) => o !== t && o.el !== t.name && meet(me, rectOf(o.el)))) { const nr = rectOf(t.name); t.el.style.top = (nr.y + nr.h + 2 + me.h) + 'px'; } }
    for (const t of s.tags) taken.push(rectOf(t.el));
    // furniture: the screen box of every standing piece, so a room name never sits on a bench or a stall
    const X = (c) => c - s.N / 2 + 0.5, Z = (r) => r - s.N / 2 + 0.5;
    const furn = (s.P.items || []).map((it) => { const ht = s.room.cellTop[it.r * s.N + it.c] || .3; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const xx of [X(it.c) - .45, X(it.c + it.w - 1) + .45]) for (const zz of [Z(it.r) - .45, Z(it.r + it.h - 1) + .45]) for (const yy of [0, ht]) {
        const [px, py] = proj(new s.THREE.Vector3(xx, yy, zz)); x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; });
    const ov = (a, q, pad) => Math.max(0, Math.min(a.x + a.w, q.x + q.w) - Math.max(a.x, q.x) + pad) * Math.max(0, Math.min(a.y + a.h, q.y + q.h) - Math.max(a.y, q.y) + pad);
    const placed = [];
    const cost = (r) => { let k = 0; for (const q of taken) k += ov(r, q, 3) * (q.person ? 300 : 60); for (const q of placed) k += ov(r, q, 3) * 40; for (const q of furn) k += ov(r, q, 2) * 15;
      if (r.x < 2) k += (2 - r.x) * 200; if (r.y < 2) k += (2 - r.y) * 200; if (r.x + r.w > W - 2) k += (r.x + r.w - W + 2) * 200; if (r.y + r.h > H - 2) k += (r.y + r.h - H + 2) * 200; return k; };
    // PHONES (owner, 2026-11-03: "the room labels cover up too much on mobile"): smaller, slimmer, see-through
    // pills that may run a little past their room before they shrink or wrap.
    const phone = W < 500; labRef.current.classList.toggle('sm', phone);
    const R = s.P.rooms, N = s.N; const base = phone ? 8 : 11, minF = phone ? 7 : 8, give = phone ? 1.3 : 1;
    for (const l of s.roomLabels) { const e = l.el; const [ax, ay] = proj(l.a), [bx] = proj(l.b); const maxw = Math.max(24, (bx - ax) * give);
      // too wide for its room: break the name into 2 or 3 balanced lines (so the pill hugs its words), then shrink
      const words = (e.dataset.t || (e.dataset.t = e.textContent)).split(' ');
      const lines = (k) => { if (k === 1) return [words.join(' ')]; let best = null;
        const cut = (from, left) => { if (left === 1) return [[words.slice(from).join(' ')]]; const out = [];
          for (let i = from + 1; i <= words.length - left + 1; i++) for (const rest of cut(i, left - 1)) out.push([words.slice(from, i).join(' '), ...rest]); return out; };
        for (const ls of cut(0, k)) { const m = Math.max(...ls.map((x) => x.length)); if (!best || m < best.m) best = { m, ls }; } return best.ls; };
      const setK = (k) => { e.textContent = ''; lines(k).forEach((t, i) => { if (i) e.appendChild(document.createElement('br')); e.appendChild(document.createTextNode(t)); }); };
      e.style.fontSize = base + 'px'; e.style.opacity = 1; setK(1);
      for (let k = 2; k <= Math.min(3, words.length) && e.offsetWidth > maxw; k++) setK(k);
      if (e.offsetWidth > maxw) e.style.fontSize = Math.max(minF, base * maxw / e.offsetWidth) + 'px';
      const w = e.offsetWidth, h = e.offsetHeight;
      // candidate spots: on the back wall first, then the top-left / top-right / middle of every row of the room
      const spots = [[ax, ay - h], [bx - w, ay - h], [ax, ay + 2], [bx - w, ay + 2]];
      for (let r = 0; r < N; r++) { let c = 0; while (c < N) { if (R[r][c] !== l.k) { c++; continue; } let e2 = c; while (e2 + 1 < N && R[r][e2 + 1] === l.k) e2++;
        const [lx, ly] = proj(new s.THREE.Vector3(X(c) - .43, .02, Z(r) - .45)), [rx] = proj(new s.THREE.Vector3(X(e2) + .43, .02, Z(r) - .45)), [, my] = proj(new s.THREE.Vector3(X(c), .02, Z(r))), [, by] = proj(new s.THREE.Vector3(X(c), .02, Z(r) + .45));
        spots.push([lx, ly], [rx - w, ly], [(lx + rx - w) / 2, ly], [lx, my - h / 2], [rx - w, my - h / 2], [(lx + rx - w) / 2, my - h / 2], [lx, by - h], [rx - w, by - h]); c = e2 + 1; } }
      let best = null, bk = Infinity; spots.forEach(([x, y], i) => { const k = cost({ x, y, w, h }) + i * 2; if (k < bk) { bk = k; best = [x, y]; } });
      e.style.left = best[0] + 'px'; e.style.top = best[1] + 'px'; placed.push({ x: best[0], y: best[1], w, h }); }
  }

  // ---- drag to turn, tap to play
  useEffect(() => {
    const box = boxRef.current; if (!box) return undefined; let drag = null, spring = 0;
    const down = (e) => { const s = S.current; if (!s.renderer) return; drag = { x: e.clientX, y: e.clientY, az: s.az, el: s.el, moved: 0 }; try { box.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = (e) => { const s = S.current; if (!drag || !s.renderer) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
      if (drag.moved > 8) { s.az = Math.max(-40, Math.min(40, drag.az - dx * .25)); s.el = Math.max(40, Math.min(88, drag.el + dy * .2)); render(); } };
    const up = (e) => { const s = S.current; if (!drag || !s.renderer) return; const tap = drag.moved <= 8; drag = null;
      if (tap) { const p = props.current; if (!p.interactive || !p.onTap) return; const r = box.getBoundingClientRect(); const ray = new s.THREE.Raycaster();
        ray.setFromCamera(new s.THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), s.cam);
        const h = ray.intersectObjects(s.room.pick, false)[0]; if (!h) return; const N = s.N; const c = Math.floor(h.point.x + N / 2), rr = Math.floor(h.point.z + N / 2);
        if (c >= 0 && rr >= 0 && c < N && rr < N) p.onTap(k2(rr, c)); return; }
      cancelAnimationFrame(spring); const step = () => { s.az *= .82; s.el += (ANG - s.el) * .18; render(); if (Math.abs(s.az) > .2 || Math.abs(s.el - ANG) > .2) spring = requestAnimationFrame(step); else { s.az = 0; s.el = ANG; render(); } }; spring = requestAnimationFrame(step); };
    const cancel = () => { drag = null; };
    box.addEventListener('pointerdown', down); box.addEventListener('pointermove', move); box.addEventListener('pointerup', up); box.addEventListener('pointercancel', cancel);
    return () => { box.removeEventListener('pointerdown', down); box.removeEventListener('pointermove', move); box.removeEventListener('pointerup', up); box.removeEventListener('pointercancel', cancel); cancelAnimationFrame(spring); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const N = layout.rooms.length;
  return (
    <div className="b3" style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', background: '#2b1e15', cursor: interactive ? 'pointer' : 'default' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .b3 canvas{display:block;width:100%;height:100%;}
        .b3-lab{position:absolute;inset:0;pointer-events:none;overflow:hidden;font-family:Manrope,system-ui,sans-serif;}
        .b3-room{position:absolute;background:#fffdf8;color:#1f2229;border:1px solid rgba(8,34,46,.45);border-radius:6px;padding:2px 6px;font-weight:800;line-height:1.15;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;box-shadow:0 2px 4px rgba(8,34,46,.3);}
        .b3-room.out{background:#f1f7ee;} .b3-lab.sm .b3-room{padding:1px 4px;border-radius:4px;border-color:rgba(8,34,46,.25);letter-spacing:.02em;line-height:1.1;background:rgba(255,253,248,.82);box-shadow:0 1px 2px rgba(8,34,46,.25);} .b3-lab.sm .b3-room.out{background:rgba(241,247,238,.82);} .b3-lab.sm .b3-tag{font-size:10.5px;padding:0 6px;} .b3-room.wrap{white-space:normal;}
        .b3-tag{position:absolute;z-index:1;transform:translate(-50%,0);background:rgba(11,13,18,.88);color:#fff;border-radius:999px;padding:1px 8px;font-size:11.5px;font-weight:700;line-height:1.5;white-space:nowrap;}
        .b3-tag.on{background:#be123c;}
        .b3-role{position:absolute;z-index:1;transform:translate(-50%,-100%);color:#fff;border:1.5px solid #fff;border-radius:999px;padding:0 7px;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;line-height:1.6;white-space:nowrap;}
        .b3-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
      ` }} />
      <div ref={boxRef} style={{ position: 'absolute', inset: 0 }}>
        <div ref={labRef} className="b3-lab" />
      </div>
      {interactive && (
        <div className="b3-sr" role="group" aria-label="Board squares">
          {Array.from({ length: N * N }, (_, i) => { const r = Math.floor(i / N), c = i % N; return <button key={i} type="button" tabIndex={0} onClick={() => onTap && onTap(k2(r, c))}>{cellLabel ? cellLabel(k2(r, c), r, c) : k2(r, c)}</button>; })}
        </div>
      )}
    </div>
  );
}
