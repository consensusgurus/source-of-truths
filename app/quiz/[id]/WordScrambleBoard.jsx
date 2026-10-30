'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { T } from '@/lib/theme';

// Word-scramble board (`format: 'word-scramble'`). ONE scrambled country shows
// at a time as letter tiles; below sits a single text input where you TYPE the
// unscrambled answer. Same guess model as TypeItBoard: misses are not counted,
// Next/Back cycle through unsolved clues, a correct answer auto-accepts as you
// type (or on Enter) and advances. Reports up via onMatch/onWrong/onEnd/onHint
// exactly like TypeItBoard. A Shuffle button re-randomizes the visible tiles
// (cosmetic only — never changes the answer).

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, forest: T.success, faded: T.muted,
};
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
// re-scramble the visible letters per word (keep word boundaries), cosmetic only
function reshuffleLabel(label) {
  return (label || '').split(/\s+/).map((w) => {
    if (w.length < 2) return w;
    for (let t = 0; t < 20; t++) { const s = shuffle(w.split('')).join(''); if (s !== w) return s; }
    return w;
  }).join(' ');
}

function Tiles({ text }) {
  const words = (text || '').split(/\s+/);
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      {words.map((w, wi) => (
        <span key={wi} style={{ display: 'inline-flex', gap: 4 }}>
          {w.split('').map((ch, ci) => (
            <span key={ci} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'clamp(22px,4.6vw,34px)', height: 'clamp(28px,5.6vw,42px)', borderRadius: 7, background: `var(--stg-surf,${T.white})`, color: `var(--stg-ink,${COLORS.ink})`, fontFamily: SANS, fontWeight: 800, fontSize: 'clamp(15px,3vw,22px)', boxShadow: '0 1px 0 rgba(20,22,28,0.18)', textTransform: 'uppercase' }}>{ch}</span>
          ))}
        </span>
      ))}
    </span>
  );
}

export default function WordScrambleBoard({ items, started, ended, revealed, onMatch, onWrong, onEnd, onHint, promptLabel, answerNoun, stickyTop = 150, mobile = false }) {
  const list = items || [];
  const total = list.length;
  const order = useMemo(() => shuffle(list.map((_, i) => i)), [list]);
  const [matched, setMatched] = useState(() => new Set());
  const [cur, setCur] = useState(() => (order.length ? order[0] : null));
  const [val, setVal] = useState('');
  const [flash, setFlash] = useState(null);
  const [disp, setDisp] = useState('');
  const inputRef = useRef(null);

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
    ? { position: 'fixed', left: 0, right: 0, bottom: kbInset, zIndex: 40, background: `var(--stg-surf,${COLORS.cream})`, padding: '8px 14px', paddingBottom: kbInset > 0 ? 8 : 'calc(8px + env(safe-area-inset-bottom))', borderTop: `1px solid var(--stg-line,${COLORS.faded}22)`, boxShadow: '0 -6px 18px rgba(20,22,28,0.10)', display: 'flex', flexDirection: 'column-reverse', gap: 8 }
    : { position: 'sticky', top: stickyTop, zIndex: 4, background: `var(--stg-surf,${COLORS.cream})`, paddingTop: 4, paddingBottom: 8 };
  const noun = answerNoun || 'country';
  const curLabel = cur != null && list[cur] ? (list[cur].label || list[cur].t) : '';
  useEffect(() => { setDisp(curLabel); }, [curLabel]);

  function nextIdx(fromCur, doneSet) {
    if (!order.length) return null;
    const start = order.indexOf(fromCur);
    for (let s = 1; s <= order.length; s++) { const p = order[(start + s) % order.length]; if (!doneSet.has(p)) return p; }
    return null;
  }
  function prevIdx(fromCur, doneSet) {
    if (!order.length) return null;
    const L = order.length; const start = order.indexOf(fromCur);
    for (let s = 1; s <= L; s++) { const p = order[((start - s) % L + L) % L]; if (!doneSet.has(p)) return p; }
    return null;
  }
  function flashIt(ok) { const key = Date.now(); setFlash({ ok, key }); setTimeout(() => setFlash((f) => (f && f.key === key ? null : f)), 480); }
  function submit(raw, viaEnter) {
    if (!live || cur == null) return false;
    if (accepts(raw, list[cur])) {
      const nm = new Set(matched); nm.add(cur); setMatched(nm); setVal(''); flashIt(true);
      if (onMatch) onMatch(cur, nm.size, list[cur].t, list[cur].label);
      const np = nextIdx(cur, nm);
      if (np == null) { setCur(null); if (onEnd) onEnd(true, nm.size); } else setCur(np);
      return true;
    }
    if (viaEnter && norm(raw)) { flashIt(false); setVal(''); }
    return false;
  }
  function onChange(e) { const v = e.target.value; if (live && cur != null && accepts(v, list[cur])) submit(v, false); else setVal(v); }
  function onKey(e) { if (e.key !== 'Enter' || !live) return; submit(val, true); }
  function skip() {
    if (!live || cur == null) return;
    const np = nextIdx(cur, matched);
    if (np != null && np !== cur) { setCur(np); setVal(''); if (onHint) onHint('Skipped — come back to it later.', false); }
    else if (onHint) onHint('That is the last one — take your shot.', false);
    if (inputRef.current) inputRef.current.focus();
  }
  function back() {
    if (!live || cur == null) return;
    const np = prevIdx(cur, matched);
    if (np != null && np !== cur) { setCur(np); setVal(''); }
    if (inputRef.current) inputRef.current.focus();
  }
  function reshuffle() { setDisp((d) => reshuffleLabel(d) || curLabel); if (inputRef.current) inputRef.current.focus(); }

  const borderColor = flash ? (flash.ok ? COLORS.forest : COLORS.ember) : COLORS.ink;

  return (
    <div>
      <div style={barStyle}>
        {live && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input
              ref={inputRef} value={val} disabled={!live} onChange={onChange} onKeyDown={onKey}
              placeholder={live ? `Type the ${noun}…` : ''}
              autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
              style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', fontFamily: SANS, fontSize: 18, padding: '14px 16px', borderRadius: 10, border: `2px solid ${borderColor}`, background: `var(--stg-surf,${T.white})`, color: `var(--stg-ink,${COLORS.ink})`, transition: 'border-color .15s' }}
            />
            {cur != null && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={reshuffle} title="Re-shuffle the visible letters." style={{ flex: 'none', fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '0 13px', background: 'transparent', color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, cursor: 'pointer' }}>↻ Shuffle</button>
            )}
            {cur != null && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={back} title="Previous clue." style={{ flex: 'none', fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '0 13px', background: 'transparent', color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, cursor: 'pointer' }}>&larr; Back</button>
            )}
            {cur != null && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={skip} title="Skip to the next clue without spending a guess." style={{ flex: 'none', fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '0 13px', background: 'transparent', color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, cursor: 'pointer' }}>Skip &rarr;</button>
            )}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, background: live ? COLORS.ink : `var(--stg-surf2,${COLORS.paper})`, color: live ? COLORS.cream : `var(--stg-mute,${COLORS.faded})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '16px 16px', minHeight: 30 }}>
          <span style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, flex: 'none' }}>{promptLabel || 'Scramble'}</span>
          {!started ? <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 20 }}>Press Play to start</span>
            : ended ? <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 20 }}>Game over</span>
            : cur != null ? <Tiles text={disp || curLabel} /> : <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 20 }}>All done</span>}
        </div>
      </div>
      {ended && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 8 }}>
          {list.map((it, i) => {
            const got = matched.has(i);
            return (
              <div key={i} style={{ border: `1px solid ${got ? `var(--stg-good,${COLORS.forest})` : `var(--stg-line,${COLORS.faded + '55'})`}`, background: got ? `var(--stg-surf2,#e8efdd)` : `var(--stg-surf,#fbf7ef)`, padding: '8px 11px', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.faded})`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
                <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 17, lineHeight: 1.1, color: got ? COLORS.forest : (revealed ? COLORS.rust : `var(--stg-mute,${COLORS.faded})`) }}>{got ? '✓ ' + it.t : (revealed ? it.t : '• • •')}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
