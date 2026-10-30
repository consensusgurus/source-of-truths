'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import ClueBox from './ClueBox';
import { T } from '@/lib/theme';

// Typed-recall board (`format: 'type-it'`). ONE clue (e.g. an airport) shows at a
// time in the clue bar with a Next button to cycle through clues not yet solved;
// below sits a single text input where you TYPE the answer (e.g. the IATA code).
// Same guess-budget model as the bank/map boards: one guess per item, a wrong
// submitted answer spends a guess, Next skips for free. A correct answer is
// auto-accepted as you type (or on Enter) and advances to the next clue. Reports
// up to QuizClient via onMatch/onWrong/onEnd/onHint exactly like BankQuizBoard.

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
  const kt = k.split(' ');
  if (kt.length >= 2) { const gt = g.split(' '); if (kt.every((w) => gt.includes(w))) return true; }
  return g.replace(/ /g, '') === k.replace(/ /g, ''); // space-insensitive whole-answer match ("sanmarino" === "san marino")
}
function anyKey(g, keys) { return (keys || []).some((k) => keyHit(g, k)); }
function accepts(raw, item) {
  const g = norm(raw); if (!g) return false;
  if (anyKey(g, item.keys)) return true;
  if (item.anti && anyKey(g, item.anti)) return false;
  return deArticle(g) === deArticle(norm(item.t));
}

export default function TypeItBoard({ items, started, ended, revealed, onMatch, onWrong, onEnd, onHint, promptLabel, answerNoun, clueVariant, sequential = false, stickyTop = 150, mobile = false }) {
  const list = items || [];
  const total = list.length;
  // `sequential` (opt-in via quiz.sequential) keeps the authored clue order
  // instead of shuffling, so a quiz can play as a strict countdown (e.g. 2026->1986).
  const order = useMemo(() => (sequential ? list.map((_, i) => i) : shuffle(list.map((_, i) => i))), [list, sequential]);
  const [matched, setMatched] = useState(() => new Set());
  const [errors, setErrors] = useState(0);
  const [cur, setCur] = useState(() => (order.length ? order[0] : null));
  const [val, setVal] = useState('');
  const [flash, setFlash] = useState(null); // { ok, key }
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
  const guessesLeft = Math.max(0, total - matched.size - errors);
  const remaining = total - matched.size;
  const noun = answerNoun || 'answer';

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
      if (onMatch) onMatch(cur, nm.size, list[cur].t, list[cur].label);
      const np = nextIdx(cur, nm);
      if (np == null) { setCur(null); if (onEnd) onEnd(true, nm.size); }
      else setCur(np);
      return true;
    }
    if (viaEnter && norm(raw)) {
      // Misses are not counted against the player: flash, clear, and let them
      // keep guessing (use Next to cycle) until they solve it or time runs out.
      flashIt(false); setVal('');
    }
    return false;
  }
  function onChange(e) {
    const v = e.target.value;
    if (live && cur != null && accepts(v, list[cur])) submit(v, false);
    else setVal(v);
  }
  function onKey(e) {
    if (e.key !== 'Enter' || !live) return;
    submit(val, true);
  }
  function skip() {
    if (!live || cur == null) return;
    const np = nextIdx(cur, matched);
    if (np != null && np !== cur) { setCur(np); setVal(''); if (onHint) onHint(`Next: ${list[np].label}`, false); }
    else if (onHint) onHint('That is the last one — take your shot.', false);
    if (inputRef.current) inputRef.current.focus();
  }
  function back() {
    if (!live || cur == null) return;
    const np = prevIdx(cur, matched);
    if (np != null && np !== cur) { setCur(np); setVal(''); if (onHint) onHint(`Back: ${list[np].label}`, false); }
    else if (onHint) onHint('That is the only one left — take your shot.', false);
    if (inputRef.current) inputRef.current.focus();
  }

  const promptText = !started ? 'Press Play to start' : ended ? 'Game over' : (cur != null ? list[cur].label : 'All done');
  const borderColor = flash ? (flash.ok ? COLORS.forest : COLORS.ember) : COLORS.ink;

  return (
    <div>
      {/* Frozen answer bar: input ON TOP (abuts the score block, light so any
          1px overlap is invisible), clue BELOW it. The whole bar is sticky just
          under the score/timer block. Next/Back use onMouseDown preventDefault +
          refocus so tapping them never blurs the input (keyboard stays open, no
          reflow that would slide the bar behind the stats on mobile). */}
      <div style={barStyle}>
        {live && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input
              ref={inputRef}
              value={val}
              disabled={!live}
              onChange={onChange}
              onKeyDown={onKey}
              placeholder={live ? `Type the ${noun}…` : ''}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', fontFamily: SANS, fontSize: 18, padding: '14px 16px', borderRadius: 10, border: `2px solid ${borderColor}`, background: `var(--stg-surf,${T.white})`, color: `var(--stg-ink,${COLORS.ink})`, transition: 'border-color .15s' }}
            />
            {cur != null && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={back} title="Go back to the previous clue." style={{ flex: 'none', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '0 13px', background: 'transparent', color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, cursor: 'pointer' }}>&larr; Back</button>
            )}
            {cur != null && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={skip} title="Skip to the next clue without spending a guess, you can come back." style={{ flex: 'none', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '0 13px', background: 'transparent', color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, cursor: 'pointer' }}>Skip &rarr;</button>
            )}
          </div>
        )}
        {clueVariant === 'careers' ? (
        <div style={{ background: `var(--stg-surf,${T.white})`, color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 12, border: `1px solid var(--stg-line,${COLORS.faded}44)`, padding: '14px 16px' }}>
          <div style={{ textAlign: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 15, letterSpacing: '0.01em', color: `var(--stg-ink,${COLORS.ink})`, paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid var(--stg-line,${COLORS.faded}33)` }}>Career history</div>
          {(live && cur != null) ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {(list[cur].stints || []).map((s, si) => (
                <li key={si} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 6, padding: '3px 0', lineHeight: 1.4 }}>
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(15px, 2.6vw, 19px)', color: `var(--stg-acc-ink,${COLORS.ember})` }}>{s.team}</span>
                  <span style={{ fontFamily: SANS, fontSize: 'clamp(14px, 2.4vw, 17px)', color: `var(--stg-mute,${COLORS.faded})` }}>({s.years}){s.note ? '*' : ''}</span>
                </li>
              ))}
              {list[cur].note ? (<li style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid var(--stg-line,${COLORS.faded}33)`, fontFamily: SANS, fontStyle: 'italic', fontSize: 12, color: `var(--stg-mute,${COLORS.faded})` }}>* Offseason and/or practice squad member only</li>) : null}
            </ul>
          ) : (
            <div style={{ textAlign: 'center', fontFamily: SERIF, fontSize: 18, color: `var(--stg-mute,${COLORS.faded})`, padding: '12px 0' }}>{!started ? 'Press Play to start' : ended ? 'Game over' : 'All done'}</div>
          )}
        </div>
        ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, background: live ? COLORS.ink : `var(--stg-surf2,${COLORS.paper})`, color: live ? COLORS.cream : `var(--stg-mute,${COLORS.faded})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '14px 16px', minHeight: 30 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, flex: 'none' }}>{promptLabel || 'Clue'}</span>
          <ClueBox current={promptText} clues={list.map((x) => x.label)} align="left" style={{ flex: '1 1 320px', minWidth: 'min(100%, 220px)' }} textStyle={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(20px, 3.4vw, 28px)', lineHeight: 1.15, overflowWrap: 'break-word', wordBreak: 'normal', hyphens: 'none' }} />
        </div>
        )}
      </div>
      {ended && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 8 }}>
          {list.map((it, i) => {
            const got = matched.has(i);
            return (
              <div key={i} style={{ borderRadius: 10, border: `1px solid ${got ? `var(--stg-good,${COLORS.forest})` : `var(--stg-line,${COLORS.faded + '55'})`}`, background: got ? `var(--stg-surf2,#e8efdd)` : `var(--stg-surf,#fbf7ef)`, padding: '8px 11px', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.faded})`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
                <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 17, lineHeight: 1.1, color: got ? COLORS.forest : (revealed ? COLORS.rust : `var(--stg-mute,${COLORS.faded})`) }}>{got ? '✓ ' + it.t : (revealed ? it.t : '• • •')}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
