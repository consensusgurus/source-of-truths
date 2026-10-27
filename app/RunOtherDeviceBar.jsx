'use client';
// FINISHED ON ANOTHER DEVICE, FOR THE RUNS (owner, 2026-10-26: "users should
// get the same share bar on runs when on different devices"). The daily pages
// carry app/OtherDeviceBar.jsx; a run had nothing, so a player who finished the
// Trivia Gauntlet on a phone and opened it on a laptop met the start gate with
// no way to share the result, because a run's ending lives on the device that
// played it. This is the same bar, same look and same two buttons, fed from
// the run's own combined board (useCircuitBoard, the read its ending makes)
// and the run's own challenge link (runChallengeLink in app/RunChallenge.jsx).
//
// It shows only when the caller says this device has not played the run
// (`show`, the gate with nothing started or finished here) AND the board has
// this player down for every game in it, none abandoned. It can be closed,
// and it remembers that for the day on this device.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import MemeShare from './MemeShare';
import { ODB_CSS } from './OtherDeviceBar';
import useCircuitBoard from './circuits/useCircuitBoard';
import { RUN_CHALLENGES } from '@/lib/challenge';
import { runChallengeLink, runToken } from './RunChallenge';
import { titleFor } from '@/lib/run-titles';
import { categoryColor } from '@/lib/category-ramp';
import { playedToday } from '@/lib/daily-run';

const etToday = () => {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
};
const mmss = (t) => { const s = Math.max(0, Math.round(Number(t) || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export default function RunOtherDeviceBar({ runId, keys = [], show = false, board: given = null }) {
  const meta = RUN_CHALLENGES[runId] || null;
  const shutKey = `sot_rodb_x_${runId}_${etToday()}`;
  const [shut, setShut] = useState(true);
  const [meme, setMeme] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    try { setShut(!!localStorage.getItem(shutKey)); } catch (e) { setShut(false); }
  }, [shutKey]);
  const live = !!(meta && show && !shut && keys.length);
  // ONE READ, NOT TWO. A run that already reads its board at the gate passes
  // it in. Otherwise the bar asks only when the slate has synced a finish for
  // one of the run's games onto this device, so a gate nobody played from
  // elsewhere costs no fresh board read.
  const [synced, setSynced] = useState(false);
  useEffect(() => { if (live && !given) setSynced(keys.some((k) => playedToday(k))); }, [live, given, keys.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const own = useCircuitBoard(runId, live && !given && synced);
  const board = given || own;
  if (!live || !board.data) return null;
  const me = board.data.me;
  const pg = me && me.perGame;
  if (!pg || !keys.every((k) => pg[k] && !pg[k].abandoned)) return null;

  const unit = meta.unit;
  const total = Number(board.data.maxTotal) || 0;
  const score = Math.round(Number(me.total) || 0);
  const t = me.timeTotal != null && Number(me.timeTotal) > 0 ? Math.round(Number(me.timeTotal)) : null;
  const won = total > 0 && score >= total;
  const timed = unit === 'time' && t != null;
  const fig = timed ? mmss(t) : unit === 'right' ? `${score} right` : total ? `${score} of ${total}` : String(score);
  const field = Number(board.data.overallField) || 0;
  const rank = Number.isFinite(me.rank) && me.rank > 0 ? (field ? `#${me.rank} of ${field}` : `#${me.rank}`) : '';
  const title = (titleFor(runId, score) || {}).name || '';
  const n = runToken();
  const link = (source) => runChallengeLink({ gameKey: runId, score, total, n, t: timed ? t : null, won, rank: title, source: source || 'otherdevice' });

  const close = () => {
    try { localStorage.setItem(shutKey, '1'); } catch (e) { /* hide for this visit */ }
    setShut(true);
  };
  const challenge = () => {
    const url = link('otherdevice');
    let touch = false;
    try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
    if (touch && navigator.share) { navigator.share({ url }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(url).then(() => setMsg('Link copied. Paste it to a friend.'), () => setMsg(url)); } catch (e) { setMsg(url); }
  };
  let route = `circuits/${runId}/run`;
  try { route = window.location.pathname.replace(/^\//, '') || route; } catch (e) { /* keep the run path */ }
  const ctx = {
    gameKey: runId, game: meta.name, cat: meta.cat, fig, timed, won: !!score || won, pb: false,
    line1: [meta.name, title, rank].filter(Boolean).join(' · '),
    route,
  };
  // The daily bar's look: dark ground, the run's category hue as the type.
  const vars = { '--stg-acc': '#10202e', '--stg-onramp': categoryColor(meta.cat) || '#7dd3fc', borderRadius: 'inherit' };

  return (
    <div className="odb" role="status" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: ODB_CSS }} />
      <span className="tx">
        <b>You finished today&rsquo;s {meta.name} on another device</b>
        <i>{[fig, rank].filter(Boolean).join(' · ')}</i>
      </span>
      <span className="bt">
        <button type="button" onClick={challenge}>Challenge a friend</button>
        <button type="button" className="ol" onClick={() => setMeme(true)}>Share with a meme</button>
      </span>
      {msg ? <span className="msg">{msg}</span> : null}
      <button type="button" className="x" onClick={close} aria-label="Hide this">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      {/* The sheet goes to <body>: the gate's banner clips and animates, and a
          fixed sheet inside a transformed box is drawn inside that box. */}
      {meme && typeof document !== 'undefined'
        ? createPortal(<MemeShare open={meme} onClose={() => setMeme(false)} ctx={ctx} getLink={link} />, document.body)
        : null}
    </div>
  );
}
