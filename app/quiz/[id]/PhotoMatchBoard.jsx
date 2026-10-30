'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { T } from '@/lib/theme';

// Photo MATCH board (`format: 'photo-match'`). A photo-prompt twist on the bank
// board: ONE picture shows at a time (slideshow, with Back / Next to cycle the
// pictures not yet solved), and below sits ONE full bank of every answer tile,
// ALPHABETISED by title. Guess-budget model, identical to BankQuizBoard: you
// start with one guess per item; every tap, right OR wrong, spends a guess. A
// correct tile turns green and is removed and the slideshow advances; a wrong
// tap just costs a guess and the picture keeps looping so you can try it again
// later. The game ends when guesses run out, everything is matched, or the clock
// stops. Score = tiles matched. Reports up to QuizClient via
// onMatch/onWrong/onEnd/onHint, the same contract as PhotoBoard / BankQuizBoard.

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
function buzz(ok) {
  try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ok ? 18 : [0, 32, 48, 32]); } catch (e) {}
}

export default function PhotoMatchBoard({ items, started, ended, revealed, onMatch, onWrong, onEnd, onHint, answerNoun, stickyTop = 150, mobile = false }) {
  const list = items || [];
  const total = list.length;
  const noun = answerNoun || 'picture';

  // Slideshow order is shuffled; the tile bank is alphabetised by title.
  const order = useMemo(() => shuffle(list.map((_, i) => i)), [list]);
  const bankOrder = useMemo(
    () => list.map((_, i) => i).sort((a, b) => (list[a].t || '').localeCompare(list[b].t || '')),
    [list]
  );

  const [matched, setMatched] = useState(() => new Set()); // solved indices (tile + picture, 1:1)
  const [errors, setErrors] = useState(0);
  const [cur, setCur] = useState(() => (order.length ? order[0] : null));
  const [flash, setFlash] = useState(null); // { key, ok }

  const live = started && !ended;
  const dock = mobile && live;
  const barStyle = dock
    ? { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, background: `var(--stg-surf,${COLORS.cream})`, padding: '10px 14px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', borderTop: `1px solid var(--stg-line,${COLORS.faded}22)`, boxShadow: '0 -6px 18px rgba(20,22,28,0.10)', display: 'flex', alignItems: 'center', gap: 10 }
    : { position: 'sticky', top: stickyTop, zIndex: 4, background: `var(--stg-surf,${COLORS.cream})`, paddingTop: 4, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 10 };

  // Preconnect + warm the whole deck so cycling pictures never blanks.
  useEffect(() => {
    const origins = new Set();
    for (const it of list) { try { origins.add(new URL(it.img).origin); } catch (e) {} }
    const links = [];
    origins.forEach((origin) => { const l = document.createElement('link'); l.rel = 'preconnect'; l.href = origin; document.head.appendChild(l); links.push(l); });
    list.forEach((it) => { if (it && it.img) { const im = new Image(); im.decoding = 'async'; im.src = it.img; } });
    return () => { links.forEach((l) => l.remove()); };
  }, [list]);

  function nextPrompt(fromCur, doneSet) {
    if (!order.length) return null;
    const start = order.indexOf(fromCur);
    for (let s = 1; s <= order.length; s++) { const p = order[(start + s) % order.length]; if (!doneSet.has(p)) return p; }
    return null;
  }
  function prevPrompt(fromCur, doneSet) {
    if (!order.length) return null;
    const L = order.length; const start = order.indexOf(fromCur);
    for (let s = 1; s <= L; s++) { const p = order[((start - s) % L + L) % L]; if (!doneSet.has(p)) return p; }
    return null;
  }
  function flashTile(key, ok) {
    setFlash({ key, ok });
    setTimeout(() => setFlash((f) => (f && f.key === key ? null : f)), 480);
  }

  function clickTile(k) {
    if (!live || cur == null || matched.has(k)) return;
    if (k === cur) {
      const nm = new Set(matched); nm.add(k);
      const used = nm.size + errors;
      setMatched(nm); flashTile(k, true); buzz(true);
      if (onMatch) onMatch(k, nm.size, list[k].t, list[k].landmark);
      const np = nextPrompt(cur, nm);
      if (used >= total || np == null) { setCur(null); if (onEnd) onEnd(np == null, nm.size); }
      else setCur(np);
    } else {
      const ne = errors + 1; const used = matched.size + ne;
      setErrors(ne); flashTile(k, false); buzz(false);
      if (onWrong) onWrong(ne, list[cur].t);
      if (used >= total) { setCur(null); if (onEnd) onEnd(false, matched.size); }
      else setCur(nextPrompt(cur, matched));
    }
  }
  function skip() {
    if (!live || cur == null) return;
    const np = nextPrompt(cur, matched);
    if (np != null && np !== cur) { setCur(np); if (onHint) onHint('Skipped — it will come back around.', false); }
    else if (onHint) onHint('That is the only one left — take your shot.', false);
  }
  function back() {
    if (!live || cur == null) return;
    const np = prevPrompt(cur, matched);
    if (np != null && np !== cur) { setCur(np); if (onHint) onHint('Back to an earlier painting.', false); }
    else if (onHint) onHint('That is the only one left — take your shot.', false);
  }

  const curItem = cur != null ? list[cur] : null;
  const imgBorder = flash ? (flash.ok ? COLORS.forest : COLORS.ember) : COLORS.ink;

  // ── Game-over grid: every picture with its title (matched green, missed rust). ──
  if (ended) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {list.map((it, i) => {
          const got = matched.has(i);
          const show = got || revealed;
          return (
            <div key={i} style={{ borderRadius: 10, border: `1px solid ${got ? `var(--stg-good,${COLORS.forest})` : (revealed ? `var(--stg-warn,${COLORS.rust})` : `var(--stg-line,${COLORS.faded + '55'})`)}`, background: got ? `var(--stg-surf2,${T.white})` : `var(--stg-surf,${revealed ? '#f6ead9' : '#fbf7ef'})`, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: COLORS.ink, overflow: 'hidden' }}>
                <img src={it.img} alt={show ? it.t : `Picture ${i + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', opacity: show ? 1 : 0.5, filter: show ? 'none' : 'grayscale(0.5)' }} />
              </div>
              <div style={{ padding: '7px 9px 9px' }}>
                <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 14, lineHeight: 1.15, color: got ? COLORS.forest : (revealed ? COLORS.rust : `var(--stg-mute,${COLORS.faded})`) }}>{got ? '✓ ' + it.t : (revealed ? it.t : '• • •')}</div>
                {show && it.landmark && <div style={{ fontFamily: MONO, fontSize: 10, color: `var(--stg-mute,${COLORS.faded})`, marginTop: 2, lineHeight: 1.2 }}>{it.landmark}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {/* Slideshow prompt: one picture at a time. */}
      <div style={barStyle}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: live ? `var(--stg-ink,${COLORS.ink})` : `var(--stg-mute,${COLORS.faded})` }}>
          {live ? `Tap the title of this ${noun}.` : 'Press Play to start'}
        </span>
        {live && cur != null && (
          <button onClick={back} title="Go back to the previous painting." style={{ marginLeft: 'auto', flex: 'none', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '8px 12px', background: 'transparent', color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, cursor: 'pointer' }}>&larr; Back</button>
        )}
        {live && cur != null && (
          <button onClick={skip} title="Skip to the next painting; this one comes back around." style={{ flex: 'none', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '8px 12px', background: 'transparent', color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, cursor: 'pointer' }}>Skip &rarr;</button>
        )}
      </div>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', maxHeight: 460, background: COLORS.ink, borderRadius: 10, border: `2px solid ${imgBorder}`, overflow: 'hidden', marginBottom: 12, transition: 'border-color .15s' }}>
        {live && curItem ? (
          <img src={curItem.img} alt={`Match this ${noun} to its title`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--stg-mute,${COLORS.faded})`, fontFamily: SERIF, fontStyle: 'italic', fontSize: 18 }}>{started ? 'All done' : 'Press Play to start'}</div>
        )}
      </div>

      {/* Full answer bank, alphabetised by title. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', background: `var(--stg-surf2,${COLORS.paper})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '16px 14px' }}>
        {bankOrder.map((k) => {
          const isMatched = matched.has(k);
          const isFlash = flash && flash.key === k;
          let bg = '#fffdf8'; let fg = COLORS.ink;
          if (isMatched) { bg = COLORS.forest; fg = COLORS.cream; }
          else if (isFlash) { bg = flash.ok ? COLORS.forest : COLORS.ember; fg = COLORS.cream; }
          return (
            <button key={k} type="button" disabled={!live || isMatched} onClick={() => clickTile(k)}
              style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, padding: '11px 14px', minHeight: 44, background: bg, color: fg, borderRadius: 10, border: `1px solid ${isMatched ? COLORS.forest : COLORS.faded + '66'}`, borderRadius: 0, cursor: live && !isMatched ? 'pointer' : 'default', transition: 'all .12s' }}>
              {list[k].t}
            </button>
          );
        })}
      </div>
      {dock && <div aria-hidden="true" style={{ height: 'calc(110px + env(safe-area-inset-bottom))' }} />}
    </div>
  );
}
