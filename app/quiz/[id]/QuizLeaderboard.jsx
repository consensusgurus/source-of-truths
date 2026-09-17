'use client';
import React, { useState } from 'react';
import { LB_POPS, LB_FILTERS, pickLb, lbEmptyNote } from '@/lib/quiz-lb';
import { T } from '@/lib/theme';

// Shared full leaderboard element (owner rule, 2026-07-02).
//
// The complete leaderboard the quiz results and the Leaderboard tab both show:
// the "N plays" header, the Registered/All-players and
// All/Mobile/First-try toggles, and the ranked table with the player's row
// highlighted. Self-contained (own toggle state); pass the board payload,
// identity, and the quiz total. No "Quiz stats" boxes (that info lives in the
// header line), per the owner rule.

const C = { ink: T.ink, ember: T.accent, faded: T.muted, soft: T.muted, line: 'rgba(20,22,28,0.30)', accSoft: T.accentSoft, accBorder: T.accentBorder };
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

function fmtTime(sec) { if (sec == null) return '—'; const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; }
function fmtWhen(ts) { try { const d = new Date(ts); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }

export default function QuizLeaderboard({ board, identity, total, wordsCol = null, guessLabel = 'Guesses', daily = false }) {
  const [lbPop, setLbPop] = useState('registered');
  const [lbFilter, setLbFilter] = useState('all');
  // Daily games (Crux/Garble/Links/Span/Dating) show ONE fixed view: registered players, first attempt only, no toggles (owner rule 2026-07-15).
  const effPop = daily ? 'registered' : lbPop;
  const effFilter = daily ? 'first' : lbFilter;
  let lb = pickLb(board, effPop, effFilter);
  // Words mode (Garble): Score / Words / Misses / Time. "Guesses" was the
  // wrong label for misses (a 0 next to a finished game read as broken), so
  // the same data comes back under an honest name. Rank score -> misses -> time.
  if (wordsCol) lb = lb.slice().sort((a, b) => b.score - a.score || ((a.guessesUsed ?? 1e9) - (b.guessesUsed ?? 1e9)) || ((a.timeElapsed ?? 0) - (b.timeElapsed ?? 0)));
  // An End Game board prints the attempt the solve landed on in this column
  // instead of the per-run error count, and its caller passes guessLabel
  // 'Tries'. A run that never solved has no attempt number to report and reads
  // as a dash; `egTier` is what tells those two cases apart.
  const endgame = lb.some((r) => r.egTier != null);
  const missOf = (r) => (endgame ? (r.tries != null ? r.tries : '\u2014') : (r.guessesUsed != null ? r.guessesUsed : '\u2014'));
  const hasGuesses = !wordsCol && (endgame || lb.some((r) => r.guessesUsed != null));
  const gridClass = hasGuesses ? 'qlb-grid' : wordsCol ? 'qlb-grid6' : undefined;
  const gridCols = '40px 1fr 76px 64px';
  // Words untangled: new rows post it as `correct`; older rows fall back to
  // deriving from score (score > 5 means the finale's 5 points are included).
  const wordsOf = (r) => { const v = r.correct != null ? r.correct : r.score; return v > wordsCol.total ? v - 5 : v; };
  // Two rows are shown as TIED only when nothing the board sorts on separates
  // them. `progress` (migration 51) is one of those terms on the End Game
  // titles, so a deeper loss and a shallower one at the same score and clock
  // are genuinely different runs and must not share a rank number. It is null
  // everywhere else, so every other board reads exactly as before.
  // `tries` joins it for the same reason (owner, 2026-08-12): on an End Game
  // board the attempt the solve landed on is what the ranking turns on, so two
  // players who both solved at the same score and clock but on different runs
  // are not tied. Null everywhere else, so every other board is unchanged.
  const samePerf = (x, y) => x.score === y.score && (x.tries ?? null) === (y.tries ?? null) && (x.progress ?? null) === (y.progress ?? null) && x.timeElapsed === y.timeElapsed;
  const lbRanks = [], lbTied = [];
  for (let i = 0; i < lb.length; i++) { const p = i > 0 && samePerf(lb[i], lb[i - 1]); lbRanks[i] = p ? lbRanks[i - 1] : i + 1; }
  for (let i = 0; i < lb.length; i++) { const p = i > 0 && samePerf(lb[i], lb[i - 1]); const n = i < lb.length - 1 && samePerf(lb[i], lb[i + 1]); lbTied[i] = p || n; }
  const chip = (on) => ({ padding: '6px 14px', background: on ? `var(--stg-surf2,${T.white})` : 'transparent', color: on ? `var(--stg-ink,${C.ink})` : `var(--stg-mute,${C.soft})`, border: 'none', borderRadius: 7, fontFamily: FONT, fontSize: 11, letterSpacing: '0.04em', fontWeight: 700, cursor: 'pointer', boxShadow: on ? '0 1px 2px rgba(20,22,28,0.06)' : 'none' });
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `.qlb-grid{grid-template-columns:40px 1fr 76px 70px 64px;}
.qlb-grid6{grid-template-columns:40px 1fr 68px 58px 58px 58px;}
@media(max-width:560px){.qlb-grid{grid-template-columns:34px 1fr 64px 56px;}.qlb-grid6{grid-template-columns:34px 1fr 56px 48px 50px;}.qlb-time{display:none;}}` }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontFamily: FONT, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-mute,${C.faded})` }}>Leaderboard</div>
        <div style={{ fontFamily: FONT, fontSize: 11, letterSpacing: '0.08em', color: `var(--stg-mute,${C.faded})` }}>{board.plays} {board.plays === 1 ? 'play' : 'plays'}</div>
      </div>
      {!daily && board.plays > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, width: 'fit-content' }}>
          <div style={{ display: 'inline-flex', gap: 4, borderRadius: 10, background: T.surfaceAlt, padding: 4, width: 'fit-content' }}>
            {LB_POPS.map(([k, label]) => <button key={k} onClick={() => setLbPop(k)} style={chip(lbPop === k)}>{label}</button>)}
          </div>
          <div style={{ display: 'inline-flex', gap: 4, borderRadius: 10, background: T.surfaceAlt, padding: 4, width: 'fit-content' }}>
            {LB_FILTERS.map(([k, label]) => <button key={k} onClick={() => setLbFilter(k)} style={chip(lbFilter === k)}>{label}</button>)}
          </div>
        </div>
      )}
      {lb.length === 0 ? (
        <p style={{ fontFamily: FONT, fontStyle: 'italic', fontSize: 16, color: `var(--stg-mute,${C.faded})` }}>{(daily ? null : lbEmptyNote(lbFilter)) || 'No one has posted a score yet. Be the first.'}</p>
      ) : (
        <div>
          <div className={gridClass} style={{ display: 'grid', gridTemplateColumns: gridClass ? undefined : gridCols, gap: 8, padding: '0 14px 8px', fontFamily: FONT, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: `var(--stg-mute,${C.faded})` }}>
            <span>#</span><span>Display Name</span><span style={{ textAlign: 'right' }}>{wordsCol ? 'Score' : 'Correct'}</span>{hasGuesses ? <span style={{ textAlign: 'right' }}>{endgame ? 'Tries' : guessLabel}</span> : null}{wordsCol ? <span style={{ textAlign: 'right' }}>Words</span> : null}{wordsCol ? <span style={{ textAlign: 'right' }}>Misses</span> : null}<span className={gridClass ? 'qlb-time' : undefined} style={{ textAlign: 'right' }}>Time</span>
          </div>
          {lb.map((row, i) => { const mine = identity && row.username === identity.username; return (
            <div key={i} className={gridClass} style={{ display: 'grid', gridTemplateColumns: gridClass ? undefined : gridCols, gap: 8, alignItems: 'center', padding: '11px 14px', marginBottom: 6, background: mine ? `var(--stg-acc-tint,${C.accSoft})` : `var(--stg-surf,${T.white})`, borderRadius: 10, border: `1px solid ${mine ? `var(--stg-acc,${C.accBorder})` : `var(--stg-line,${C.line})`}` }}>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: lbRanks[i] <= 3 ? `var(--stg-acc-ink,${C.ember})` : `var(--stg-mute,${C.faded})` }}>{lbTied[i] ? `T${lbRanks[i]}` : lbRanks[i]}</span>
              <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: FONT, fontSize: 17, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.userKey ? <a href={`/quizzes/hub?player=${encodeURIComponent(row.userKey)}`} style={{ color: 'inherit', textDecoration: 'none', borderBottom: `1px dotted var(--stg-line,${C.faded}88)` }}>{row.username}</a> : row.username}{mine ? ' (you)' : ''}{!daily && row.tryNum ? <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 400, color: `var(--stg-mute,${C.faded})`, marginLeft: 6 }}>{row.tryNum > 1 ? '(retried)' : '(1st Try)'}</span> : ''}</span>
                {row.playedAt ? <span style={{ fontFamily: FONT, fontSize: 10.5, color: `var(--stg-mute,${C.faded})` }}>{fmtWhen(row.playedAt)}</span> : null}
              </span>
              <span style={{ fontFamily: FONT, fontSize: 14, textAlign: 'right' }}>{row.score}/{total}</span>
              {hasGuesses ? <span style={{ fontFamily: FONT, fontSize: 14, textAlign: 'right', color: `var(--stg-mute,${C.faded})` }}>{missOf(row)}</span> : null}
              {wordsCol ? <span style={{ fontFamily: FONT, fontSize: 14, textAlign: 'right', color: `var(--stg-mute,${C.faded})` }}>{wordsOf(row)}/{wordsCol.total}</span> : null}
              {wordsCol ? <span style={{ fontFamily: FONT, fontSize: 14, textAlign: 'right', color: `var(--stg-mute,${C.faded})` }}>{row.guessesUsed != null ? row.guessesUsed : '\u2014'}</span> : null}
              <span className={gridClass ? 'qlb-time' : undefined} style={{ fontFamily: FONT, fontSize: 14, textAlign: 'right', color: `var(--stg-mute,${C.faded})` }}>{fmtTime(row.timeElapsed)}</span>
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}
