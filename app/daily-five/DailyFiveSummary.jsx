'use client';

// /daily-five — where a run ends (owner, 2026-08-17).
//
// A player who opts into a circuit should not be handed five ordinary end
// cards. Each of those is a full page of its own: an IQ hero, rank tiles, a
// share bar, "up next", "easiest leaderboard", the whole of today's slate, a
// popular quiz per category and a footer. Five of them in a row is the same
// furniture five times, and every one of them points AWAY from the run the
// player is in the middle of. So during a run the end card collapses to a
// verdict and a Next control (see the run branch in LoftFinish), and the
// summary they would otherwise have got arrives ONCE, here, at the end.
//
// IT SERVES EVERY CIRCUIT (owner, 2026-08-18). /daily-five is the marquee and
// /daily-five?circuit=<id> is one of the skill circuits: the same page,
// narrowed by the same query the board route already takes. A second page
// component for circuits would be a mirror of this one that has to be kept in
// step by hand, which is the failure this file warns about everywhere else.
//
// IT WEARS THE RUN CARD (owner, 2026-08-28). It used to draw a navy header
// block with the figures inside it, a board, and a column of per-game cards,
// while the Gauntlet run drew a white scorecard with a rail of per-game chips
// across the top. Two endings for the same event, kept in step by hand. Both
// render <CircuitScorecard/> now: the rail, then one card carrying the
// eyebrow, the headline, the figures, one row per game, the board and the
// actions. This file's only job is to turn what the server recorded into that
// component's props.
//
// It is a normal URL, so it is also the run's permalink: shareable, revisitable,
// and reachable without finishing (a half-done run renders honestly, with the
// unplayed games as open rows carrying a Play control).

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Check } from 'lucide-react';
import { circuitKeysFor, circuitHref, circuitName, readCircuitParam, isMarquee,
         MARQUEE_ID, circuitShareResult, circuitShareUrl, circuitPageHref, fmtClock } from '@/lib/circuits';
import { notifyShareCredit } from '../ShareCreditPop';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { DAILY_GAME_MAP, dailyScoreText } from '@/lib/daily-games';
import CircuitScorecard from '../circuits/CircuitScorecard';
import CircuitFrame from '../circuits/CircuitFrame';
import useCircuitBoard from '../circuits/useCircuitBoard';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

const etToday = () => {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
};

const r1 = (n) => Math.round(Number(n) * 10) / 10;
const clock = (s) => (Number.isFinite(s) && s > 0
  ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
  : null);

// The site's own per-game score wording where it has one (Blocks counts shapes,
// Tuck counts points, and so on), falling back to a bare fraction. Wrapped
// because a game with no entry throws rather than returning null.
function scoreLine(key, score, total) {
  try {
    const t = dailyScoreText(key, score, total);
    if (t) return t;
  } catch (e) { /* fall through */ }
  return Number.isFinite(total) && total > 0 ? `${score} of ${total}` : null;
}

export default function DailyFiveSummary() {
  // Read in an effect, never during render: the server has no idea what today
  // is in Eastern, so deriving the run during render makes the first client
  // paint disagree with the server's.
  const [day, setDay] = useState(null);
  // Which run's summary this is. Defaults to the marquee, so the bare
  // /daily-five URL is unchanged. Read in the same effect as the day and for
  // the same reason: window does not exist on the server.
  const [runId, setRunId] = useState(MARQUEE_ID);

  useEffect(() => { setDay(etToday()); setRunId(readCircuitParam() || MARQUEE_ID); }, []);

  // The board, fetched by the shared hook the run's finish card uses. Gated on
  // the day so it does not fire before the run is known.
  const { data, state } = useCircuitBoard(runId, !!day);

  const members = day ? circuitKeysFor(runId, day) : [];
  const marq = isMarquee(runId);
  const runName = circuitName(runId);
  const ran = data && Array.isArray(data.games) && data.games.length
    ? new Set(data.games.map((g) => g.key)) : null;
  const run = ran ? members.filter((k) => ran.has(k)) : members;

  const me = (data && data.me) || null;
  const perGame = (me && me.perGame) || {};
  const played = run.filter((k) => perGame[k] && !perGame[k].abandoned);
  const complete = run.length > 0 && played.length === run.length;
  // Which unit this board is in. It comes off the payload rather than off the
  // circuit because this page renders every circuit, and the route is the thing
  // that decides: 'correct' is questions answered right, anything else is the
  // 0..15 ladder summed over the roster.
  const byCorrect = !!(data && data.scoreMode === 'correct');
  // The clock board (Valet Gauntlet, 2026-09-05): `total` is lots parked and
  // the figure a reader wants is the combined time.
  const byTime = !!(data && data.scoreMode === 'time');
  const maxTotal = (data && Number.isFinite(data.maxTotal) ? data.maxTotal : 0) || (byCorrect ? 0 : byTime ? run.length : run.length * 15);

  // ── SHARING A FINISHED RUN ────────────────────────────────────────────────
  // The result text is built by lib/circuits, so the wording and the pip grid
  // live beside the roster they describe rather than in this component.
  //
  // THE LINK POINTS AT THE CIRCUIT'S OWN PAGE, NOT AT THIS ONE (owner,
  // 2026-08-18). This page is the run summary: noindex, one viewer's own
  // results, an hourly leaderboard. Sharing it hands a recipient a stranger's
  // scorecard and no way in. /circuits/<id> is the same run with the games, the
  // order and a Start button, which is what somebody who has not played needs.
  const [copied, setCopied] = useState(false);
  function shareRun() {
    const url = withRef(circuitShareUrl(runId));
    const text = circuitShareResult(runId, {
      points: me ? me.total : 0,
      maxTotal,
      secs: me && byTime ? me.timeTotal : null,
      rank: me && me.rank ? me.rank : null,
      field: (data && data.overallField) || 0,
      done: played.length,
      total: run.length,
    }, url);
    if (notifyShareCredit(text, `https://${circuitShareUrl(runId)}`)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) {
        navigator.share({ text }).catch(() => {});
        return;
      }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    } catch (e) {}
  }

  const dateLabel = day
    ? `${MONTHS[Number(day.slice(5, 7)) - 1]} ${Number(day.slice(8, 10))}, ${day.slice(0, 4)}`
    : '';

  // ── the card's props ──────────────────────────────────────────────────────
  // One row per game in run order. A game not played today is an OPEN row
  // carrying the control that plays it, which is the one thing a half-done run
  // is for; a played one carries what it scored, what it took and what it paid.
  const rows = run.map((k) => {
    const g = DAILY_GAME_MAP[k] || { name: k, cat: '', tag: '' };
    const p = perGame[k];
    const done = !!(p && !p.abandoned);
    const t = done ? clock(p.timeElapsed) : null;
    const bits = [g.cat];
    if (done) {
      if (t) bits.push(t);
      if (p.rank) bits.push(`#${p.rank} of ${p.field}`);
    } else {
      bits.push('not played today');
    }
    return {
      key: k,
      name: g.name,
      href: g.href || `/${k}`,
      sub: bits.filter(Boolean).join(' · '),
      accent: g.colorNavy || g.color || 'var(--accent,#233a63)',
      score: done ? p.score : null,
      total: done ? p.total : null,
      railText: done ? (scoreLine(k, p.score, p.total) || '') : 'open',
      // The per-game ladder points, EXCEPT on a board that does not rank on
      // them: quoting a points figure beside a run whose board counts questions
      // is the exact confusion this rule was written to remove. The game's own
      // score is already on the rail and its rank is already in the sub line.
      right: done ? ((byCorrect || byTime) ? '' : `${r1(p.points)} pts`) : '',
      state: done ? (p.rank === 1 ? 'won' : 'done') : 'open',
      action: done ? null : { label: 'Play', href: circuitHref(k, runId) },
    };
  });

  const figures = [
    byTime
      ? { v: me && me.timeTotal ? fmtClock(me.timeTotal) : '0:00',
          k: me && me.total === run.length ? 'combined clock' : `clock, ${me ? r1(me.total) : 0} of ${run.length} parked`,
          big: true }
      : { v: me ? r1(me.total) : 0,
          k: byCorrect ? (maxTotal ? `of ${maxTotal} right` : 'questions right') : `of ${maxTotal} points`,
          big: true },
    { v: me && me.rank ? `#${me.rank}` : '—', k: `of ${(data && data.overallField) || 0} players` },
    { v: `${played.length}/${run.length}`, k: 'games played' },
  ];

  return (
    <CircuitFrame label="Run summary">
    <div className="d5s">
      <style dangerouslySetInnerHTML={{ __html: `
        .d5s{max-width:860px;margin:0 auto;padding:10px 18px 70px;
             font-family:'Manrope',system-ui,-apple-system,sans-serif;color:var(--stg-ink);}
        /* One way back, at the foot, where a reader who has finished reading
           is. The run's other exits all lead deeper into a game; this is the
           only one that leaves. It sits on the PAGE rather than in the card, so
           it is drawn in the stage's tokens and follows whichever register the
           reader is in. It used to be a white slab with navy ink, which was
           right on the navy page this replaced and unreadable on the light
           stage. */
        .d5s-home{display:flex;align-items:center;justify-content:center;gap:8px;
                  background:var(--stg-surf);color:var(--stg-ink);
                  border:1px solid var(--stg-line);
                  border-radius:11px;padding:14px 18px;font-size:13px;font-weight:800;
                  letter-spacing:.03em;text-decoration:none;}
        .d5s-home:hover{border-color:var(--stg-line2);}
        .d5s-home:focus-visible{outline:2px solid var(--stg-acc-ink, var(--stg-acc));outline-offset:2px;}
        @media(max-width:620px){.d5s{padding:8px 12px 60px;}}
      ` }} />

      <CircuitScorecard
        eyebrow={`${runName} · ${dateLabel}`}
        headline={complete ? 'Run complete.' : 'Your run.'}
        lead={complete
          ? `All ${run.length} played. Here is where that left you.`
          : `${played.length} of ${run.length} played. The rest are still open today.`}
        figures={figures}
        rows={rows}
        board={{
          rows: (data && Array.isArray(data.overall)) ? data.overall : [],
          me,
          field: (data && data.overallField) || 0,
          keys: run,
          maxTotal,
          clock: byTime,
          limit: 10,
        }}
        boardState={state}
        boardNote={byTime
          ? `This board is your combined clock across all ${run.length} lots, fastest first. Moves do not count here. A lot played on its own still counts, but you need all ${run.length} parked to take a rank on it.`
          : byCorrect
          ? `This board is the plain count of questions you get right across all ${run.length}, and the shorter clock takes a tie. A game played on its own still counts, but you need all ${run.length} played to take a rank on it.`
          : `Each game pays the same 15/12/10/8/7/6/5/4/3/2/1 by finish, and the run adds the ${run.length} up. A game played on its own still counts, but you need all ${run.length} played to take a rank on this board.`}
        actions={[
          { label: copied ? 'Copied' : 'Share this run', onClick: shareRun,
            icon: copied ? <Check size={15} strokeWidth={2.8} /> : <Share2 size={15} strokeWidth={2.8} />,
            primary: true, key: 'share' },
          { label: 'The circuit', href: circuitPageHref(runId), key: 'circuit' },
        ]}
        fine={complete
          ? (marq ? 'A fresh five lands at midnight Eastern.'
                  : 'The same circuit, new puzzles, at midnight Eastern.')
          : 'Every game here still counts on its own board, whether you finish the run or not.'}
      />

      <a className="d5s-home" href="/">
        <ArrowLeft size={15} strokeWidth={2.6} />
        Return to main
      </a>
    </div>
    </CircuitFrame>
  );
}
