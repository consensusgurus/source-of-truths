'use client';

// Potluck, the daily quiz mix (owner, 2026-10-09).
//
// Three quizzes from the catalog a day, picked by scripts/gen-potluck.mjs so
// the three are always a different KIND (one to type, one to match, one to
// spot on a map or in pictures) and a different SUBJECT. This page is the
// table they sit on: it lists the three, sends the player to each one's own
// page (/quiz/<id>?potluck=<num>&i=<slot>, where QuizClient plays it as it
// always does and reports back through lib/potluck.js), and scores the day.
//
// TURN IT IN (owner): nobody has to play all three. Each quiz is worth 10,
// scaled by how much of it you got; anything you skip counts zero; the Turn it
// in button posts the day whenever you are done, and finishing the third
// turns it in on its own. One row, posted once, on the ordinary daily board.

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import DailyChrome from '../DailyChrome';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import GamePanel from '../GamePanel';
import LoftFinish from '../LoftFinish';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import AddToHome from '../AddToHome';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import { isStage } from '@/lib/stage';
import { isLoft } from '@/lib/loft';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import { isMobileDevice } from '@/lib/is-mobile';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { T } from '@/lib/theme';
import { loadRun, startRun, turnInPotluck, potluckScore, etToday, PER_QUIZ, POT_TOTAL } from '@/lib/potluck';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const HELP_KEY = 'sot_potluck_help_seen';
const ACCENT = '#c2410c';

function fmtTime(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function msToMidnightET() {
  try {
    const now = new Date();
    const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const next = new Date(et); next.setHours(24, 0, 0, 0);
    return next - et;
  } catch (e) { return 0; }
}
function fmtCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function getStats() {
  try { const s = JSON.parse(localStorage.getItem('sot_potluck_stats')); if (s && s.rec) return s; } catch (e) {}
  return { v: 1, rec: {} };
}
function streakOf(s, todayNum) {
  const rec = (s && s.rec) || {};
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return cur;
}

export default function PotluckClient({ puzzles = [], day, quizzes = [], forceNum = null }) {
  const searchParams = useSearchParams();
  const [run, setRun] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [shareCta, setShareCta] = useState('Share');

  useEffect(() => {
    setRun(loadRun(day.num));
    setStats(getStats());
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.username) setIdentity(id); } catch (e) {}
    try { if (!localStorage.getItem(HELP_KEY)) setShowHelp(false); } catch (e) {}
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
    setHydrated(true);
    // A quiz finished in another tab (or this one, before the back button)
    // shows up the moment the page is looked at again.
    const sync = () => { setRun(loadRun(day.num)); setStats(getStats()); };
    window.addEventListener('focus', sync);
    window.addEventListener('pageshow', sync);
    window.addEventListener('storage', sync);
    try { fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: day.quizId }) }).catch(() => {}); } catch (e) {}
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('pageshow', sync);
      window.removeEventListener('storage', sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cur = run || { done: {}, turnedIn: false, t0: null };
  const turnedIn = !!cur.turnedIn;
  const playing = !turnedIn;
  const { score, time, played } = potluckScore(day, cur);
  const total = POT_TOTAL;
  const won = turnedIn && score === total;
  const started = !!cur.t0;
  const isTodays = day.live === etToday();

  useEffect(() => {
    if (playing) return undefined;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [playing]);

  const LOFT = isLoft('potluck');
  const STAGE = isStage('potluck', searchParams);
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('potluck');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('potluck'), '--stg-acc-lt': gameColorLight('potluck'), '--stg-onramp-lt': gameOnrampLight('potluck'), '--stg-acc-ink-lt': gameAccentInkLight('potluck') };
  const Cap = STAGE ? StageChrome : LoftCap;
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : T.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : T.muted;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const LINE = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.25)';
  const CELL = STAGE ? 'var(--stg-cell,rgba(255,255,255,0.03))' : T.surface;
  const ACC = STAGE ? STAGE_C : ACCENT;
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : ACCENT;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : T.white;
  const GOOD = STAGE ? 'var(--stg-good,#3fb27f)' : T.successDeep;

  const finished = LOFT && !playing;
  const iq = useIqStanding({ game: 'potluck', quizId: day.quizId, active: finished });
  const nextUp = useNextUnplayed({ self: 'potluck', active: finished });
  const upNext = useUnplayedSimilar({ self: 'potluck', active: finished });
  const dailyBoard = useDailyBoard({ quizId: day.quizId, active: finished });
  const allTime = useGameAllTime({ game: 'potluck', active: finished });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'potluck', active: finished });
  const prevPuzzle = puzzles.find((x) => x.num === day.num - 1) || null;
  const todayNum = (puzzles[puzzles.length - 1] || day).num;
  const streak = useMemo(() => streakOf(stats, todayNum), [stats, todayNum]);

  function openQuiz(i) {
    if (turnedIn || cur.done[i]) return;
    startRun(day);
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    window.location.href = `/quiz/${encodeURIComponent(quizzes[i].id)}?potluck=${day.num}&i=${i}`;
  }
  function turnIn() {
    const r = turnInPotluck(day);
    setRun({ ...r });
    setStats(getStats());
    setConfirm(false);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/potluck${isTodays ? '' : `?p=${day.num}`}`); }
  function shareText() {
    const cells = quizzes.map((q, i) => {
      const r = cur.done[i];
      if (!r) return '⬜';
      const pts = r.t ? Math.round((PER_QUIZ * r.s) / r.t) : 0;
      return pts >= 10 ? '\u{1F7E9}' : pts >= 6 ? '\u{1F7E8}' : '\u{1F7E7}';
    }).join('');
    return `Potluck #${day.num} · ${score}/${total} · ${fmtTime(time)}${isTodays && streak >= 2 ? ` · streak ${streak}` : ''}\n${cells}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing ? `Potluck #${day.num}: three quizzes, three subjects, one score, from Mind Loft.\n${shareUrl()}` : shareText();
    if (notifyShareCredit(text)) return;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={ACCENT} accentSoft="#fff1e8"
      lead="Three quizzes, three subjects, one score."
      steps={[
        <>Every day brings <b>three quizzes</b> from the Mind Loft catalog: one where you <b>type</b> the answers, one where you <b>match</b> them, and one where you <b>spot</b> them on a map or in pictures. Each is from a different subject.</>,
        <>Play them in <b>any order</b>. Each runs on its own clock, and when it ends you come straight back here.</>,
        <>Each quiz is worth <b>10 points</b>, scaled by how much of it you got, so the day is out of <b>30</b>. A quiz you skip counts zero.</>,
        <>Press <b>Turn it in</b> whenever you are done. Finishing the third turns it in for you. Your first turn-in is the one the board keeps.</>,
      ]}
      knack="The three are worth the same however long they are, so a short quiz you nail counts as much as a long one."
      footer="Everyone gets the same three each day. Ties on the daily board break by the three quizzes' clocks added together."
    />
  );

  const card = (q, i) => {
    const r = cur.done[i];
    const pts = r && r.t ? Math.round((PER_QUIZ * r.s) / r.t) : null;
    const open = !r && !turnedIn;
    return (
      <div key={q.id} className="pl-card" style={{ background: SURF, border: `1px solid ${r ? GOOD : LINE}`, borderRadius: 12, padding: '14px 15px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, letterSpacing: '0.13em', textTransform: 'uppercase', fontWeight: 800, color: ACC_INK }}>{q.familyLabel}</span>
          <span style={{ fontSize: 10.5, letterSpacing: '0.13em', textTransform: 'uppercase', fontWeight: 700, color: FADED }}>{q.dept}</span>
        </div>
        <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, lineHeight: 1.3 }}>{q.title}</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED }}>{q.answers} answers · {q.clock} on the clock</div>
        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {r ? (
            <>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: INK }}>{r.s}/{r.t} · {fmtTime(r.e)}</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: GOOD }}>{pts} pts</span>
            </>
          ) : turnedIn ? (
            <>
              <span style={{ fontSize: 13, fontWeight: 700, color: FADED }}>Skipped · 0 pts</span>
              <a href={`/quiz/${encodeURIComponent(q.id)}`} style={{ fontSize: 13, fontWeight: 800, color: ACC_INK }}>Play it anyway &rarr;</a>
            </>
          ) : (
            <>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: FADED }}>Worth 10</span>
              <button type="button" className="pl-btn" onClick={() => openQuiz(i)} disabled={!open} style={{ background: ACC, borderColor: ACC, color: ON_ACC }}>Play</button>
            </>
          )}
        </div>
      </div>
    );
  };

  const doneCount = Object.keys(cur.done || {}).length;

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? INK : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && <DailyChrome slug="potluck" name="Potluck" collapsed={false} loft={LOFT} />}
      {LOFT && (
        <Cap gameKey="potluck" quizId={day.quizId}
          name="Potluck"
          cat="Trivia"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={day.num}
          tiles={playing ? null : upNext}
          dateLabel={day.dateLabel}
          onHelp={() => setShowHelp(true)}
          figures={[
            { v: `${score}/${total}`, k: 'points' },
            { v: `${doneCount}/3`, k: 'played' },
            { v: fmtTime(time), k: 'time' },
          ]}
        />
      )}
      <div className="pl-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.pl-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .pl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
          @media(max-width:760px){.pl-grid{grid-template-columns:1fr;}}
          .pl-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid;border-radius:8px;padding:8px 18px;cursor:pointer;}
          .pl-btn:disabled{opacity:.5;cursor:default;}
        ` }} />
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
            <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
            <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
            <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
              <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? 'transparent' : T.white, border: STAGE ? 'none' : `2px solid ${T.ink}`, borderRadius: 12, padding: STAGE ? 0 : 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>
                    {turnedIn ? <>Turned in: <span style={{ color: ACC_INK }}>{score} of {total}</span></> : started ? 'Today’s three. Play any, in any order.' : 'Today’s three quizzes'}
                  </div>
                  {!started && !turnedIn && (
                    <button type="button" onClick={() => setShowHelp(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>How it works</button>
                  )}
                </div>
                <div className="pl-grid">{quizzes.map(card)}</div>
                {!turnedIn && (
                  <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: CELL, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: FADED }}>
                      {doneCount === 0 ? 'Each quiz is worth 10. Skip one and it counts zero.' : `${score} points so far from ${doneCount} of 3. Done for the day?`}
                    </span>
                    {confirm ? (
                      <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>Turn in {score} of {total}? The skipped {3 - doneCount === 1 ? 'quiz counts' : 'quizzes count'} zero.</span>
                        <button type="button" className="pl-btn" onClick={turnIn} style={{ background: ACC, borderColor: ACC, color: ON_ACC }}>Yes, turn it in</button>
                        <button type="button" onClick={() => setConfirm(false)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>Keep playing</button>
                      </span>
                    ) : (
                      <button type="button" className="pl-btn" disabled={!hydrated || doneCount === 0} onClick={() => setConfirm(true)} style={{ background: 'transparent', borderColor: ACC, color: ACC_INK }}>Turn it in</button>
                    )}
                  </div>
                )}
              </div>

              {!playing && (
                <div className={STAGE ? undefined : 'loft-sol'} style={{ maxWidth: 520, margin: '14px auto 0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: FADED, lineHeight: 1.5 }}>
                    {isTodays
                      ? <>{countdown ? <>Next Potluck in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new three at midnight Eastern.'}{prevPuzzle && <> Meanwhile: <a href={`/potluck?p=${prevPuzzle.num}`} style={{ color: ACC_INK, fontWeight: 800 }}>yesterday&rsquo;s three &rarr;</a></>}</>
                      : <>You&rsquo;re playing the {day.dateLabel} Potluck. <a href="/potluck" style={{ color: ACC_INK, fontWeight: 800 }}>Back to today&rsquo;s &rarr;</a></>}
                  </div>
                </div>
              )}
              {LOFT && !playing && revealed && (
                <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
              )}
            </div>
            {LOFT && !playing && (
              <LoftFinish
                name="Potluck"
                catRank={catRank}
                outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
                title={won ? 'A clean sweep' : 'Turned in'}
                detail={`${score}/${total} points · ${played} of 3 played · ${fmtTime(time)}`}
                iq={iq}
                board={dailyBoard}
                gameRank={allTime && allTime.ready
                  ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                      label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Potluck all time` : 'all-time rank' }
                  : null}
                day={dayStats}
                streak={isTodays ? streak : null}
                archive={puzzles
                  .filter((p) => p.live <= etToday() && p.num !== day.num)
                  .sort((x, y) => y.num - x.num)
                  .map((p) => ({
                    num: p.num, dateLabel: p.dateLabel, sunday: false, href: `/potluck?p=${p.num}`,
                    done: !!(stats && stats.rec && stats.rec[p.num]),
                    score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                  }))}
                options={[
                  { label: copied ? 'Copied' : shareCta, sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                  { tone: 'board', label: 'Return to board', sub: 'Your three quizzes', onClick: () => setRevealed(true) },
                  prevPuzzle && { tone: 'another', label: 'Play another Potluck', sub: `No. ${prevPuzzle.num}, yesterday’s three`, href: `/potluck?p=${prevPuzzle.num}` },
                  nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                  { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
                ]}
              />
            )}
            </div>
            </div>
          </div>
        </div>

        {!STAGE && <GamePanel self="potluck" name="Potluck" onShow={() => {}} />}
        <div style={{ margin: '30px auto 0', maxWidth: 860 }}>
          <div className={STAGE ? undefined : 'loft-report'}>
            <ReportIssue self="potluck" name="Potluck" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          </div>
          <AddToHome name="Potluck" />
          <div id="stf-stats-slot" />
          {!identity && (
            <div id="daily-join" style={{ margin: '18px auto 0' }}>
              <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => setIdentity(id)} />
            </div>
          )}
        </div>
      </div>

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${T.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => setShowHelp(false)} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: INK }}>About Potluck</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Potluck is a free daily trivia mix from Mind Loft. Every day it sets out three quizzes from the catalog, one where you type the answers, one where you match them, and one where you find them on a map or in pictures, each from a different subject, so no two days taste the same.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Each quiz is worth 10 points, scaled by how much of it you got, so a short quiz counts as much as a long one and the day is scored out of 30. Play as many as you like, then turn it in; a quiz you skip counts zero, and finishing all three turns it in for you. Everyone gets the same three, and the daily leaderboard breaks ties on the three clocks added together.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new three every day at midnight Eastern. No app, no signup. More trivia: <a href="/streak" style={{ color: INK, fontWeight: 800 }}>Streak</a>, <a href="/deep" style={{ color: INK, fontWeight: 800 }}>Deep</a> and <a href="/atlas" style={{ color: INK, fontWeight: 800 }}>Atlas</a>.
        </p>
      </section>
      {!STAGE && <div style={{ position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
