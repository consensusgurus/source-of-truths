'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { T } from '@/lib/theme';

// Photo-recall board (`format: 'photo'`). ONE landmark photo shows at a time with
// a Next button to cycle through photos not yet solved; below sits a single text
// input where you TYPE the city. Same guess-budget model as the type-it/bank
// boards: one guess per item, a wrong submitted answer spends a guess, Next skips
// for free. A correct answer is auto-accepted as you type (or on Enter) and
// advances to the next photo. Reports up to QuizClient via
// onMatch/onWrong/onEnd/onHint exactly like TypeItBoard, so it inherits the
// shared Game Over card, the username-gated answer reveal, Challenge a friend,
// stats and leaderboard. Only the photo changes between answers; the input bar
// stays put and keeps focus.

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, forest: T.success, faded: T.muted,
};
const MONO = "'Manrope', system-ui, -apple-system, sans-serif";
const SERIF = "'Manrope', system-ui, -apple-system, sans-serif";
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function deArticle(s) { return s.replace(/^(?:the|a|an) (?=.{2})/, ''); }
function keyHit(g, key) {
  const k = deArticle(norm(key)); if (!k) return false;
  if (g.includes(k)) return true;
  const kt = k.split(' '); if (kt.length < 2) return false;
  const gt = g.split(' '); return kt.every((w) => gt.includes(w));
}
function anyKey(g, keys) { return (keys || []).some((k) => keyHit(g, k)); }
function accepts(raw, item) {
  const g = norm(raw); if (!g) return false;
  if (anyKey(g, item.keys)) return true;
  if (item.anti && anyKey(g, item.anti)) return false;
  return deArticle(g) === deArticle(norm(item.t));
}

export default function PhotoBoard({ items, started, ended, revealed, onMatch, onWrong, onEnd, onHint, answerNoun, photoAspect = '4 / 3', stickyTop = 150, strike = false, noSkip = false, mobile = false }) {
  const list = items || [];
  const total = list.length;
  const order = useMemo(() => shuffle(list.map((_, i) => i)), [list]);
  const [matched, setMatched] = useState(() => new Set());
  const [errors, setErrors] = useState(0);
  const [cur, setCur] = useState(() => (order.length ? order[0] : null));
  const [val, setVal] = useState('');
  const [flash, setFlash] = useState(null); // { ok, key }
  const inputRef = useRef(null);
  const clueRef = useRef(null);
  const [zoomOn, setZoomOn] = useState(false); // tap-to-zoom lightbox open
  const [zoomed, setZoomed] = useState(false); // lightbox: fit vs ~2.3x

  const live = started && !ended;
  const [kbInset, setKbInset] = useState(0);
  useEffect(() => {
    if (!(mobile && started && !ended)) { setKbInset(0); return undefined; }
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const onVV = () => setKbInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    onVV();
    vv.addEventListener('resize', onVV);
    vv.addEventListener('scroll', onVV);
    return () => { vv.removeEventListener('resize', onVV); vv.removeEventListener('scroll', onVV); };
  }, [mobile, started, ended]);
  const dock = mobile && live;
  const barStyle = dock
    ? { position: 'fixed', left: 0, right: 0, bottom: kbInset, zIndex: 40, background: `var(--stg-surf,${COLORS.cream})`, padding: '8px 14px', paddingBottom: kbInset > 0 ? 8 : 'calc(8px + env(safe-area-inset-bottom))', borderTop: `1px solid var(--stg-line,${COLORS.faded}22)`, boxShadow: '0 -6px 18px rgba(20,22,28,0.10)' }
    : { position: 'sticky', top: stickyTop, zIndex: 4, background: `var(--stg-surf,${COLORS.cream})`, paddingTop: 4, paddingBottom: 8 };
  // The input is docked at the bottom on mobile, so focusing it would otherwise
  // jump the page to the bottom and scroll the photo clue off-screen. Re-center
  // the photo in view on focus (and when the photo changes while still focused).
  function centerClue() {
    if (!dock) return;
    const el = clueRef.current;
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  useEffect(() => {
    if (!dock) return undefined;
    if (inputRef.current && document.activeElement === inputRef.current) {
      const t = setTimeout(centerClue, 60);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [cur, dock]);
  const guessesLeft = Math.max(0, total - matched.size - errors);
  const remaining = total - matched.size;
  const noun = answerNoun || 'city';
  const _ar = String(photoAspect).split('/');
  const portrait = parseFloat(_ar[0]) < parseFloat(_ar[1]);

  useEffect(() => {
    const origins = new Set();
    for (const it of list) { try { origins.add(new URL(it.img).origin); } catch (e) {} }
    const links = [];
    origins.forEach((origin) => {
      const l = document.createElement('link');
      l.rel = 'preconnect'; l.href = origin;
      document.head.appendChild(l); links.push(l);
    });
    return () => { links.forEach((l) => l.remove()); };
  }, [list]);

  useEffect(() => {
    if (cur == null || !order.length) return;
    const start = order.indexOf(cur);
    let n = 0;
    // Preload the current photo plus the next few. This runs even BEFORE Play (no
    // `live` gate) so the first image is already cached when the player presses
    // Play, eliminating the cold-fetch delay before the first photo appears.
    for (let s = 0; s <= order.length && n < 4; s++) {
      const q = order[(start + s) % order.length];
      if (!matched.has(q) && list[q] && list[q].img) {
        const im = new Image(); im.decoding = 'async'; im.src = list[q].img; n++;
      }
    }
  }, [cur, matched, order, list]);

  function nextIdx(fromCur, doneSet) {
    if (!order.length) return null;
    const start = order.indexOf(fromCur);
    for (let s = 1; s <= order.length; s++) {
      const p = order[(start + s) % order.length];
      if (!doneSet.has(p)) return p;
    }
    return null;
  }
  function prevIdx(fromCur, doneSet) {
    if (!order.length) return null;
    const L = order.length;
    const start = order.indexOf(fromCur);
    for (let s = 1; s <= L; s++) {
      const p = order[((start - s) % L + L) % L];
      if (!doneSet.has(p)) return p;
    }
    return null;
  }
  function flashIt(ok) {
    const key = Date.now(); setFlash({ ok, key });
    setTimeout(() => setFlash((f) => (f && f.key === key ? null : f)), 480);
  }
  function submit(raw, viaEnter) {
    if (!live || cur == null) return false;
    if (accepts(raw, list[cur])) {
      const nm = new Set(matched); nm.add(cur);
      setMatched(nm); setVal(''); flashIt(true);
      if (onMatch) onMatch(cur, nm.size, list[cur].t, list[cur].landmark);
      const np = nextIdx(cur, nm);
      if (np == null) { setCur(null); if (onEnd) onEnd(true, nm.size); }
      else setCur(np);
      return true;
    }
    if (viaEnter && norm(raw)) {
      flashIt(false); setVal('');
      if (strike && onEnd) { onEnd(false, matched.size); }
    }
    return false;
  }
  function onChange(e) {
    const v = e.target.value;
    if (!(live && cur != null)) { setVal(v); return; }
    // Correct answer for the CURRENT shape always wins: advance immediately.
    if (accepts(v, list[cur])) { submit(v, false); return; }
    // Strike mode: end the run the instant the typed text equals ANY OTHER
    // answer's name/alias (no Enter needed), e.g. typing "ohio" on a non-Ohio
    // shape. Guard: if the text is still a prefix of some longer valid name
    // (e.g. "niger" while typing "nigeria"), wait rather than end.
    if (strike) {
      const nv = deArticle(norm(v));
      if (nv.length >= 3) {
        const cands = (a) => [norm(a.t)].concat((a.keys || []).map(norm)).map(deArticle);
        const stillTyping = list.some((a) => cands(a).some((sN) => sN.length > nv.length && sN.startsWith(nv)));
        if (!stillTyping && list.some((a, j) => j !== cur && cands(a).some((sN) => sN === nv))) {
          flashIt(false); setVal(''); if (onEnd) onEnd(false, matched.size); return;
        }
      }
    }
    setVal(v);
  }
  function onKey(e) {
    if (e.key !== 'Enter' || !live) return;
    submit(val, true);
  }
  function skip() {
    if (!live || cur == null) return;
    const np = nextIdx(cur, matched);
    if (np != null && np !== cur) { setCur(np); setVal(''); if (onHint) onHint('Skipped — you will come back to it.', false); }
    else if (onHint) onHint('That is the last one — take your shot.', false);
    if (inputRef.current) inputRef.current.focus();
  }
  function back() {
    if (!live || cur == null) return;
    const np = prevIdx(cur, matched);
    if (np != null && np !== cur) { setCur(np); setVal(''); if (onHint) onHint('Back to an earlier photo — you can still answer it.', false); }
    else if (onHint) onHint('That is the only one left — take your shot.', false);
    if (inputRef.current) inputRef.current.focus();
  }

  const curItem = cur != null ? list[cur] : null;
  const borderColor = flash ? (flash.ok ? COLORS.forest : COLORS.ember) : COLORS.ink;

  // Tap the photo to open a fullscreen zoom view. Blur the input first so the
  // keyboard drops (the zoom view is for looking, not typing) and pinch-zoom is
  // free of the keyboard. Masked photos keep their ink masks in the zoom view so
  // zooming never reveals a redacted answer.
  function openZoom() { if (!(live && curItem)) return; try { if (inputRef.current) inputRef.current.blur(); } catch (e) {} setZoomed(false); setZoomOn(true); }
  function closeZoom() { setZoomOn(false); setZoomed(false); }

  return (
    <div>
      {/* Answer bar — frozen FLUSH beneath the score/time block so it never leaves
          the screen; the photo scrolls below. The input element is never remounted
          between photos, so it keeps focus after a correct answer or Next. */}
      {live && (
        <div style={barStyle}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8, ...(portrait ? { maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' } : null) }}>
            <input
              ref={inputRef}
              value={val}
              disabled={!live}
              onChange={onChange}
              onKeyDown={onKey}
              onFocus={() => { setTimeout(centerClue, 60); setTimeout(centerClue, 350); }}
              placeholder={live ? `Type the ${noun}…` : ''}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', fontFamily: SANS, fontSize: 18, padding: '14px 16px', borderRadius: 10, border: `2px solid ${borderColor}`, background: live ? `var(--stg-surf,${T.white})` : `var(--stg-surf2,${COLORS.paper})`, color: `var(--stg-ink,${COLORS.ink})`, opacity: live ? 1 : 0.6, transition: 'border-color .15s' }}
            />
            {live && cur != null && noSkip && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => submit(val, true)} title="Submit your guess" style={{ flex: 'none', fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '0 22px', background: COLORS.ember, color: T.white, borderRadius: 10, border: 'none', cursor: 'pointer' }}>Guess</button>
            )}
            {live && cur != null && !noSkip && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={back} title="Go back to the previous photo." style={{ flex: 'none', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '0 11px', background: 'transparent', color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, cursor: 'pointer' }}>&larr; Back</button>
            )}
            {live && cur != null && !noSkip && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={skip} title="Skip to the next photo without spending a guess, you can come back." style={{ flex: 'none', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '0 11px', background: 'transparent', color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, cursor: 'pointer' }}>Skip &rarr;</button>
            )}
          </div>
        </div>
      )}
      {/* Photo prompt — only this changes between answers; scrolls beneath the frozen bar. */}
      <div ref={clueRef}>
      {live && curItem && curItem.mask !== undefined ? (
        // Masked photo (e.g. ski trail maps with names blacked out): render the
        // image at its NATURAL aspect inside a wrapper sized to the image, so the
        // percentage-based mask rectangles line up exactly regardless of the
        // image's own aspect ratio. Each mask is an opaque ink bar redacting a
        // logo / name printed on the photo.
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div onClick={openZoom} style={{ position: 'relative', display: 'inline-block', lineHeight: 0, maxWidth: '100%', background: COLORS.ink, borderRadius: 10, border: `2px solid ${borderColor}`, transition: 'border-color .15s', cursor: live && curItem ? 'zoom-in' : 'default' }}>
            <img src={curItem.img} alt={`Name the ${noun} in this photo`} style={{ display: 'block', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: 520 }} />
            {(curItem.mask || []).map((m, mi) => (
              <div key={mi} style={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%`, background: COLORS.ink }} />
            ))}
          </div>
        </div>
      ) : (
      <div onClick={openZoom} style={{ position: 'relative', width: '100%', aspectRatio: photoAspect, maxHeight: 500, ...(portrait ? { maxWidth: 420, maxHeight: 560, marginLeft: 'auto', marginRight: 'auto' } : null), background: COLORS.ink, borderRadius: 10, border: `2px solid ${borderColor}`, overflow: 'hidden', marginBottom: 10, transition: 'border-color .15s', cursor: live && curItem ? 'zoom-in' : 'default' }}>
        {live && curItem ? (
          <img src={curItem.img} alt={`Name the ${noun} in this photo`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--stg-mute,${COLORS.faded})`, fontFamily: SERIF, fontStyle: 'italic', fontSize: 18 }}>{ended ? 'Game over' : 'Press Play to start'}</div>
        )}
      </div>
      )}
      </div>
      {live && curItem && <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.faded})`, marginTop: -2, marginBottom: 8 }}>Tap the photo to zoom</div>}
      {ended && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {list.map((it, i) => {
            const got = matched.has(i);
            const show = got || revealed;
            return (
              <div key={i} style={{ borderRadius: 10, border: `1px solid ${got ? `var(--stg-good,${COLORS.forest})` : (revealed ? `var(--stg-warn,${COLORS.rust})` : `var(--stg-line,${COLORS.faded + '55'})`)}`, background: got ? `var(--stg-surf2,${T.white})` : `var(--stg-surf,${revealed ? '#f6ead9' : '#fbf7ef'})`, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: photoAspect, background: COLORS.ink, overflow: 'hidden' }}>
                  <img src={it.img} alt={show ? it.t : `Photo ${i + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: show ? 1 : 0.5, filter: show ? 'none' : 'grayscale(0.5)' }} />
                </div>
                <div style={{ padding: '7px 9px 9px' }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 15, lineHeight: 1.1, color: got ? COLORS.forest : (revealed ? COLORS.rust : `var(--stg-mute,${COLORS.faded})`) }}>{got ? '✓ ' + it.t : (revealed ? it.t : '• • •')}</div>
                  {show && it.landmark && <div style={{ fontFamily: MONO, fontSize: 10, color: `var(--stg-mute,${COLORS.faded})`, marginTop: 2, lineHeight: 1.2 }}>{it.landmark}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {zoomOn && curItem && createPortal(
        (<div onClick={closeZoom} style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(8,8,10,0.95)', overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <button onClick={(e) => { e.stopPropagation(); closeZoom(); }} aria-label="Close" style={{ position: 'fixed', top: 'calc(10px + env(safe-area-inset-top))', right: 12, zIndex: 2, width: 42, height: 42, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.18)', color: T.white, fontSize: 20, lineHeight: '42px', textAlign: 'center', cursor: 'pointer' }}>&#10005;</button>
          <div style={{ width: '100%', minHeight: '100%', boxSizing: 'border-box', padding: 16, textAlign: 'center', display: zoomed ? 'block' : 'flex', alignItems: zoomed ? undefined : 'center', justifyContent: zoomed ? undefined : 'center' }}>
            <div onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }} style={{ position: 'relative', display: 'inline-block', lineHeight: 0, width: zoomed ? '230%' : 'auto', maxWidth: zoomed ? 'none' : '100%', cursor: zoomed ? 'zoom-out' : 'zoom-in' }}>
              <img src={curItem.img} alt={`Name the ${noun} in this photo`} style={{ display: 'block', width: zoomed ? '100%' : 'auto', height: 'auto', maxWidth: zoomed ? 'none' : '100%', maxHeight: zoomed ? 'none' : '86vh' }} />
              {(curItem.mask || []).map((m, mi) => (
                <div key={mi} style={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%`, background: COLORS.ink }} />
              ))}
            </div>
          </div>
        </div>),
        document.body
      )}
      {dock && <div aria-hidden="true" style={{ height: 'calc(110px + env(safe-area-inset-bottom))' }} />}
    </div>
  );
}
