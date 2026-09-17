'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { notifyTrophies } from '../../TrophyPop';
import { quizDept, DEPT_LABEL } from '@/lib/quiz-departments';
import { T } from '@/lib/theme';

// Shared end-of-quiz IQ card, rendered by every quiz board (the twelve that use
// QuizResultModal plus the inline QuizClient end screen).
//
// Redesigned 2026-07-31 (owner) to match the daily-puzzle end card (DailyEndCard):
// a full-width IQ hero banner led by the brain meter, with the IQ this quiz paid
// as the headline number, expanding in place to the player's slot in the global
// IQ ranking; then three rank tiles that each expand to their board's top rows.
// It replaced a flat three-column "Your standing" strip.
//
//   hero   IQ Points earned  ->  expands to the global IQ ranking around you
//   tile 1 This Quiz         ->  expands to this quiz's leaderboard
//   tile 2 <Category>        ->  expands to the category's IQ board
//   tile 3 Global            ->  expands to the global IQ board
//
// BRAIN METER: filled by IQ Points banked TODAY against a 250 IQ daily goal
// (owner ruling 2026-07-31), turning green once the goal is met. The daily card
// fills the same art with progress through that day's puzzle slate; a quiz has no
// slate, so the day's IQ is the equivalent "how much have you done today" signal,
// and it means the meter reads the same on both cards for the same player. The
// meter is SILENT: it carried a "113 of 250 IQ today" caption for a day, which the
// owner cut on 2026-07-31 as noise next to the headline gain. The art still tells
// the story, so keep the fill and leave the number off.
//
// Props keep their historical names (eloAfter/eloBefore are the /api/quiz/me
// profiles after/before the game) so the board callers did not have to change
// when Elo was retired for IQ Points (2026-07-08). `quiz`, `board`, `identity`
// and `placement` are the new optional additions; QuizResultModal injects them
// via cloneElement, so only the QuizClient caller passes them directly. Without
// them the card still renders, minus the This Quiz tile's figures.
const C = { ember: T.accent, ink: T.ink, faded: T.muted, slate: T.slate, bord: '#e7eaf1', blue: T.blue, forest: T.success };
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

// The IQ hero's brain art, shared with the daily end card and the day-card share image.
const BRAIN_EMPTY = '/day-card/brain-empty.png';
const BRAIN_BLUE = '/day-card/brain-blue.png';
const BRAIN_GREEN = '/day-card/brain-green.png';

// The daily IQ goal the brain meter fills toward.
const IQ_GOAL = 250;

function prefersReducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  catch (e) { return false; }
}

// Counts a number up from 0 to `target` on an easeOutCubic over ~1s, so the IQ
// gain lands as an event rather than simply appearing. Returns `target` straight
// away for a null/zero value or a reduced-motion viewer. `done` flips true on the
// last frame, which fires the panel's glow pulse. Mirrors DailyEndCard.
function useCountUp(target, ms = 1000) {
  const [n, setN] = useState(target == null ? null : target);
  const [done, setDone] = useState(target != null);
  useEffect(() => {
    if (target == null) { setN(null); setDone(false); return undefined; }
    if (prefersReducedMotion() || target <= 0) { setN(target); setDone(true); return undefined; }
    let raf = null;
    let alive = true;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const start = now();
    const tick = () => {
      if (!alive) return;
      const t = Math.min(1, (now() - start) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    setN(0);
    setDone(false);
    raf = requestAnimationFrame(tick);
    return () => { alive = false; if (raf) cancelAnimationFrame(raf); };
  }, [target, ms]);
  return [n, done];
}

export default function QuizStandings({
  eloAfter: eloAfterProp = null, eloBefore = null, eloDept: eloDeptProp = null, eloDeptLabel: eloDeptLabelProp = null,
  quiz = null, board = null, identity = null, placement = null, quizTotal = null,
  fill = false, hideCategory = false,
}) {
  // The department is derivable from the quiz, so a board that never fetched a
  // profile (GridFill, LogicGrid) still gets the right category tile.
  const dept = eloDeptProp || (quiz ? quizDept(quiz) : null);
  const deptLabel = eloDeptLabelProp || (dept ? (DEPT_LABEL[dept] || 'Category') : 'Category');

  // Most boards hand the post-game profile in as eloAfter. The two that don't
  // (they pass standings={null} and never call /api/quiz/me) get it here, so the
  // card is self-sufficient and renders the same on every board. The delay lets
  // the just-POSTed result row land first, the same race the IQ fetch below
  // handles with its retry ladder.
  const [meFetched, setMeFetched] = useState(null);
  const needMe = !eloAfterProp;
  useEffect(() => {
    if (!needMe) return undefined;
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    if (!anonId && !email) return undefined;
    let alive = true;
    const qs = new URLSearchParams();
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    // Post-game read: bypass the /api/quiz/me CDN cache, or the trophy unlock
    // toast fires off the pre-game profile and misses the trophy just earned.
    qs.set('fresh', '1');
    const t = setTimeout(() => {
      fetch('/api/quiz/me?' + qs.toString())
        .then((r) => r.json())
        .then((d) => { if (alive && d && d.found) setMeFetched(d); })
        .catch(() => {});
    }, 1200);
    return () => { alive = false; clearTimeout(t); };
  }, [needMe]);
  const eloAfter = eloAfterProp || meFetched;
  const eloDept = dept;
  const eloDeptLabel = deptLabel;
  // Trophy unlock toast: the post-game /api/quiz/me profile carries the earned
  // trophy list; hand the ids to the global TrophyPop, which diffs against what
  // this device has already celebrated.
  useEffect(() => {
    const list = eloAfter && eloAfter.trophies && eloAfter.trophies.list;
    if (Array.isArray(list)) notifyTrophies(list.filter((t) => t.earned).map((t) => t.id));
  }, [eloAfter]);

  const quizId = quiz && quiz.id ? quiz.id : null;

  // --- IQ standing ---------------------------------------------------------
  // What this quiz paid, what the player has banked today, and their window of
  // the global IQ ranking. The /api/quiz/result row for the game just finished is
  // POSTed as this card mounts, so the first read often predates it; the route
  // reports gained:null until the row is visible, and we retry on the same
  // schedule the daily end card uses rather than render a stale number.
  const [iq, setIq] = useState(null);
  const [iqResolved, setIqResolved] = useState(false);
  useEffect(() => {
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    if (!anonId && !email) { setIqResolved(true); return undefined; }
    let alive = true;
    let timer = null;
    let i = 0;
    const delays = [0, 1500, 3500, 6000, 10000, 15000];
    const run = () => {
      const qs = new URLSearchParams();
      if (anonId) qs.set('anonId', anonId);
      if (email) qs.set('email', email);
      if (quizId) qs.set('quizId', quizId);
      qs.set('span', '4');
      if (i > 0) qs.set('_', String(Date.now())); // bust the edge cache on retries
      fetch('/api/quiz/iq-standing?' + qs.toString())
        .then((r) => r.json())
        .then((d) => {
          if (!alive || !d) return;
          if (d.found) setIq(d);
          if (d.found && Array.isArray(d.trophies)) notifyTrophies(d.trophies);
          if (!d.found || d.gained != null || i >= delays.length - 1) { setIqResolved(true); return; }
          i += 1;
          timer = setTimeout(run, delays[i] - delays[i - 1]);
        })
        .catch(() => { if (alive) setIqResolved(true); });
    };
    timer = setTimeout(run, delays[0]);
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [quizId]);

  // --- figures -------------------------------------------------------------
  const fmtN = (x) => (x == null ? null : Number(x).toLocaleString());
  const aXp = (iq && typeof iq.xp === 'number') ? iq.xp : (eloAfter && eloAfter.xp != null ? eloAfter.xp : null);
  const bXp = eloBefore && eloBefore.xp != null ? eloBefore.xp : null;
  const aLevel = (eloAfter && eloAfter.level) || (iq && iq.level) || 1;
  const bLevel = eloBefore && eloBefore.level != null ? eloBefore.level : null;
  const leveledUp = bLevel != null && aLevel > bLevel;
  const rg = (eloAfter && eloAfter.recent && eloAfter.recent[0]) ? eloAfter.recent[0] : null;
  // Prefer the IQ route's figure (it is pinned to THIS quizId); fall back to the
  // profile's most recent game, then to the before/after delta.
  const gained = (iq && typeof iq.gained === 'number') ? iq.gained
    : (rg && typeof rg.xp === 'number') ? rg.xp
      : (aXp != null && bXp != null ? Math.max(0, aXp - bXp) : null);
  const todayGained = (iq && typeof iq.todayGained === 'number') ? iq.todayGained : (gained || 0);

  const [iqCount, iqLanded] = useCountUp(gained);

  // Brain meter: today's IQ against the daily goal. `brainOn` defers the fill by
  // a beat so it animates up from empty instead of rendering pre-filled.
  const goalFrac = Math.max(0, Math.min(1, todayGained / IQ_GOAL));
  const goalFull = todayGained >= IQ_GOAL;
  const [brainOn, setBrainOn] = useState(() => prefersReducedMotion());
  useEffect(() => {
    if (brainOn) return undefined;
    const t = setTimeout(() => setBrainOn(true), 260);
    return () => clearTimeout(t);
  }, [brainOn]);

  // Global + category standing.
  const globalRank = (eloAfter && eloAfter.rank != null) ? eloAfter.rank : (iq && iq.rank != null ? iq.rank : null);
  const globalField = (eloAfter && eloAfter.totalPlayers) || (iq && iq.total) || null;
  const catObj = (eloAfter && eloAfter.byCategory && eloDept) ? eloAfter.byCategory[eloDept] : null;
  const catRank = catObj ? catObj.rank : null;
  const catField = catObj ? catObj.catTotal : null;
  const provisional = !!(iq && iq.provisional) || !!(eloAfter && eloAfter.isAnon);

  // This quiz's board.
  const quizPlays = board && board.plays != null ? board.plays : null;
  const quizRank = placement != null ? placement : null;

  // Rankings still loading: the profile has not landed AND the IQ route has not
  // resolved. Show one "Loading stats and rankings…" shimmer across the tiles row
  // rather than three empty dash tiles. Both always resolve (the fetch sets its
  // flag in .then AND .catch), so this can never spin forever.
  const ranksLoading = !eloAfter && !iqResolved && !iq;

  // --- expansion -----------------------------------------------------------
  const [openTile, setOpenTile] = useState(null); // 'iq' | 'quiz' | 'cat' | 'global' | null
  // The IQ boards behind the Category / Global tiles, fetched lazily the first
  // time one is opened (both are CDN-cached for 5 minutes, so this costs nothing
  // for the many players who never expand a tile).
  const [xpBoards, setXpBoards] = useState({});
  const fetching = useRef({});
  useEffect(() => {
    const scope = openTile === 'global' ? 'all' : openTile === 'cat' ? eloDept : null;
    if (!scope || xpBoards[scope] || fetching.current[scope]) return undefined;
    fetching.current[scope] = true;
    let alive = true;
    fetch(`/api/quiz/xp?scope=${encodeURIComponent(scope)}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setXpBoards((m) => ({ ...m, [scope]: (d && Array.isArray(d.players)) ? d.players : [] })); })
      .catch(() => { if (alive) setXpBoards((m) => ({ ...m, [scope]: [] })); });
    return () => { alive = false; };
  }, [openTile, eloDept, xpBoards]);

  const myKey = (eloAfter && eloAfter.userKey) || null;
  const myName = (identity && identity.username) || (eloAfter && eloAfter.name) || null;

  // Rows for whichever tile is expanded: { rank, name, val, me }.
  function tileRows(which) {
    if (which === 'iq') {
      const rows = (iq && Array.isArray(iq.window)) ? iq.window : [];
      return rows.map((r) => ({ rank: r.rank, name: r.name, val: `${(r.xp || 0).toLocaleString()} IQ`, me: !!r.me }));
    }
    if (which === 'quiz') {
      const rows = (board && (board.leaderboard || board.leaderboardAll)) || [];
      return rows.slice(0, 10).map((r, i) => ({
        rank: r.rank != null ? r.rank : i + 1,
        name: r.username,
        val: `${r.score}${quizTotal != null ? `/${quizTotal}` : ''}`,
        me: !!(myName && r.username === myName),
      }));
    }
    const scope = which === 'global' ? 'all' : eloDept;
    const rows = xpBoards[scope];
    if (!Array.isArray(rows)) return null; // still loading
    return rows.slice(0, 10).map((r) => ({
      rank: r.rank, name: r.name, val: `${(r.xp || 0).toLocaleString()} IQ`,
      me: !!(myKey && r.userKey === myKey),
    }));
  }

  const catLabel = eloDeptLabel || 'Category';
  const tiles = [
    { id: 'quiz', label: 'This Quiz', rank: quizRank, field: quizPlays, unit: 'play', prov: false },
    { id: 'cat', label: catLabel, rank: catRank, field: catField, unit: 'player', prov: provisional },
    { id: 'global', label: 'Global', rank: globalRank, field: globalField, unit: 'player', prov: provisional },
  ].filter((t) => !(hideCategory && t.id === 'cat'));

  const expandTitle = openTile === 'iq' ? 'Global IQ Points ranking'
    : openTile === 'quiz' ? 'This quiz · leaderboard'
      : openTile === 'cat' ? `${catLabel} · IQ Points`
        : 'All quizzes · IQ Points';

  const outer = fill ? { flex: '1 1 0', minWidth: 0 } : { margin: '0 auto 18px', maxWidth: 560 };
  const rows = openTile ? tileRows(openTile) : null;

  return (
    <div className="qiq" style={outer}>
      <style dangerouslySetInnerHTML={{ __html: `
        .qiq{font-family:${FONT};color:var(--stg-ink,${C.ink});text-align:left;}
        .qiq-hero{position:relative;overflow:hidden;display:block;width:100%;text-align:center;font-family:inherit;cursor:pointer;border:1px solid #cfe0f7;background:linear-gradient(180deg,#f4f8ff 0%,#eaf2fe 100%);border-radius:16px;padding:15px 16px 13px;margin-bottom:10px;transition:border-color .12s ease,box-shadow .12s ease,background .3s ease;}
        .qiq-hero.full{border-color:#cdeeda;background:linear-gradient(180deg,#f2fcf6 0%,#e6f7ee 100%);}
        .qiq-hero:hover{border-color:#9dbdea;}
        .qiq-hero.full:hover{border-color:#9fd3ba;}
        .qiq-hero.open{border-color:${C.blue};box-shadow:0 0 0 1px ${C.blue};}
        .qiq-hero.full.open{border-color:var(--success-deep);box-shadow:0 0 0 1px var(--success-deep);}
        .qiq-rays{position:absolute;top:50%;left:50%;width:420px;height:420px;margin:-210px 0 0 -210px;pointer-events:none;opacity:0;background:radial-gradient(circle,rgba(37,99,235,.16) 0%,rgba(37,99,235,0) 62%);}
        .qiq-hero.full .qiq-rays{background:radial-gradient(circle,rgba(21,128,61,.17) 0%,rgba(21,128,61,0) 62%);}
        .qiq-hero.landed .qiq-rays{animation:qiq-rays 1.1s ease-out 1;}
        .qiq-hero.landed{animation:qiq-pop .5s cubic-bezier(.34,1.56,.64,1) 1;}
        .qiq-in{position:relative;display:flex;align-items:center;justify-content:center;gap:16px;}
        .qiq-brain{position:relative;display:block;flex:0 0 auto;width:92px;height:83px;}
        .qiq-brain img{display:block;width:92px;height:83px;object-fit:contain;}
        .qiq-brain-base{opacity:1;filter:contrast(1.5) brightness(.88);}
        .qiq-brain-fill{position:absolute;left:0;bottom:0;width:92px;height:0;overflow:hidden;display:flex;align-items:flex-end;transition:height .9s cubic-bezier(.22,1,.36,1);}
        .qiq-txt{display:flex;flex-direction:column;align-items:flex-start;min-width:0;}
        .qiq-lbl{display:block;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#3d63a8;}
        .qiq-hero.full .qiq-lbl{color:#0f6e56;}
        .qiq-gain{display:block;font-size:58px;font-weight:800;letter-spacing:-.03em;line-height:1;color:${C.blue};margin-top:1px;font-variant-numeric:tabular-nums;}
        .qiq-hero.full .qiq-gain{color:var(--success-deep);}
        .qiq-gain .dash{color:#c2c8d2;}
        .qiq-sub{position:relative;display:flex;flex-wrap:wrap;justify-content:center;gap:4px 16px;margin-top:9px;padding-top:8px;border-top:1px solid rgba(61,99,168,.16);font-size:12.5px;color:#4d6a97;}
        .qiq-hero.full .qiq-sub{border-top-color:rgba(15,110,86,.16);color:#3d6b58;}
        .qiq-sub b{font-weight:800;color:var(--blue-deep);}
        .qiq-hero.full .qiq-sub b{color:#0f6e56;}
        .qiq-sub .prov,.qiq-rk .prov{font-weight:700;color:var(--stg-mute,${C.faded});}
        .qiq-sub .lvl{font-weight:800;color:${C.forest};}
        .qiq-sub:empty{display:none;}
        .qiq-mx{position:absolute;top:10px;right:9px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:#3d63a8;pointer-events:none;}
        .qiq-hero.full .qiq-mx{color:#0f6e56;}
        .qiq-hero.open .qiq-mx,.qiq-hero:hover .qiq-mx{color:${C.blue};}
        .qiq-tiles{display:grid;grid-template-columns:repeat(${tiles.length},minmax(0,1fr));gap:10px;margin-bottom:10px;}
        .qiq-loading{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;height:74px;margin-bottom:10px;border:1px solid ${C.bord};border-radius:12px;background:var(--surface);font-family:${MONO};font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:${C.slate};}
        .qiq-loading::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:qiq-shim 1.15s ease-in-out infinite;}
        .qiq-tile{position:relative;display:block;width:100%;text-align:center;font-family:inherit;cursor:pointer;border:1px solid ${C.bord};background:var(--surface);border-radius:12px;padding:13px 10px 11px;min-width:0;transition:background .12s ease,border-color .12s ease;}
        .qiq-tile:hover{background:var(--white);border-color:#cfd6e2;}
        .qiq-tile.open{border-color:${C.blue};box-shadow:0 0 0 1px ${C.blue};background:var(--white);}
        .qiq-tile-lbl{font-size:12.5px;font-weight:700;color:${C.slate};padding:0 20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .qiq-rk{font-size:34px;font-weight:800;letter-spacing:-.02em;color:var(--stg-ink,${C.ink});line-height:1.1;margin-top:4px;display:block;}
        .qiq-rk .dash{color:#c2c8d2;}
        .qiq-rk .prov{font-size:11px;}
        .qiq-of{font-size:12px;color:var(--stg-mute,${C.faded});display:block;margin-top:3px;}
        .qiq-tile-mx{position:absolute;top:9px;right:8px;color:${C.slate};display:flex;}
        .qiq-expand{border:1px solid ${C.bord};border-radius:12px;padding:11px 13px 9px;margin:-2px 0 12px;background:var(--white);}
        .qiq-expand-hd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:6px;}
        .qiq-expand-ti{font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:${C.slate};}
        .qiq-expand-full{font-size:11.5px;font-weight:800;color:${C.blue};background:none;border:none;padding:0;cursor:pointer;display:inline-flex;align-items:center;gap:3px;text-decoration:none;white-space:nowrap;}
        .qiq-row{display:flex;align-items:center;gap:9px;font-size:13px;padding:4px 7px;border-radius:7px;}
        .qiq-row.me{background:#eff4fd;}
        .qiq-row .rk{font-family:${MONO};font-size:11px;color:var(--stg-mute,${C.faded});width:26px;flex-shrink:0;}
        .qiq-row .nm{font-weight:700;color:var(--stg-ink,${C.ink});min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}
        .qiq-row.me .nm{font-weight:800;}
        .qiq-row .vl{font-family:${MONO};font-size:11.5px;color:${C.slate};flex-shrink:0;}
        .qiq-empty{font-size:12.5px;color:var(--stg-mute,${C.faded});padding:6px 2px;}
        @keyframes qiq-pop{0%{transform:scale(1);}38%{transform:scale(1.028);}100%{transform:scale(1);}}
        @keyframes qiq-rays{0%{opacity:0;transform:scale(.6);}30%{opacity:1;}100%{opacity:0;transform:scale(1.25);}}
        @keyframes qiq-shim{100%{transform:translateX(100%);}}
        @media(prefers-reduced-motion:reduce){
          .qiq-hero.landed,.qiq-hero.landed .qiq-rays,.qiq-loading::after{animation:none;}
          .qiq-brain-fill{transition:none;}
        }
        @media(max-width:560px){
          .qiq-hero{padding:13px 12px 11px;}
          .qiq-in{gap:11px;}
          .qiq-brain,.qiq-brain img,.qiq-brain-fill{width:66px;}
          .qiq-brain,.qiq-brain img{height:59px;}
          .qiq-gain{font-size:44px;}
          .qiq-tiles{gap:7px;}
          .qiq-tile{padding:11px 6px 9px;}
          .qiq-tile-lbl{font-size:11px;padding:0 14px;}
          .qiq-rk{font-size:27px;}
          .qiq-of{font-size:10.5px;}
        }
      ` }} />

      {/* IQ hero: what this quiz paid, on the brain meter of the day's IQ. */}
      <button
        type="button"
        className={`qiq-hero${openTile === 'iq' ? ' open' : ''}${goalFull ? ' full' : ''}${iqLanded && gained ? ' landed' : ''}`}
        aria-label="Expand your IQ Points ranking"
        aria-expanded={openTile === 'iq'}
        onClick={() => setOpenTile((o) => (o === 'iq' ? null : 'iq'))}
      >
        <span className="qiq-rays" aria-hidden="true" />
        <span className="qiq-in">
          <span className="qiq-brain" aria-hidden="true">
            <img className="qiq-brain-base" src={BRAIN_EMPTY} alt="" width={640} height={576} />
            <span className="qiq-brain-fill" style={{ height: `${brainOn ? Math.round(goalFrac * 100) : 0}%` }}>
              <img src={goalFull ? BRAIN_GREEN : BRAIN_BLUE} alt="" width={640} height={576} />
            </span>
          </span>
          <span className="qiq-txt">
            <span className="qiq-lbl">IQ Points earned</span>
            {gained != null ? (
              <span className="qiq-gain">+{(iqCount == null ? gained : iqCount).toLocaleString()}</span>
            ) : (
              <span className="qiq-gain"><span className="dash">{iqResolved ? '—' : '·'}</span></span>
            )}
          </span>
        </span>
        <span className="qiq-sub">
          {aXp != null ? <span><b>{fmtN(aXp)}</b> total</span> : null}
          <span>{leveledUp ? <span className="lvl">▲ Level {aLevel}!</span> : <>Level <b>{aLevel}</b></>}</span>
          {globalRank ? <span>IQ rank <b>#{fmtN(globalRank)}</b>{globalField ? ` of ${fmtN(globalField)}` : ''}{provisional ? <span className="prov"> prov.</span> : null}</span> : null}
          {iq && iq.firstPlay ? <span>Your first IQ Points are banking</span> : null}
        </span>
        <span className="qiq-mx">
          <ChevronDown size={15} strokeWidth={2.4} style={{ transform: openTile === 'iq' ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }} />
        </span>
      </button>

      {ranksLoading ? (
        <div className="qiq-loading" role="status" aria-live="polite">Loading stats and rankings…</div>
      ) : null}
      <div className="qiq-tiles" style={ranksLoading ? { display: 'none' } : undefined}>
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`qiq-tile${openTile === t.id ? ' open' : ''}`}
            aria-label={`Expand the ${t.label} ranking`}
            aria-expanded={openTile === t.id}
            onClick={() => setOpenTile((o) => (o === t.id ? null : t.id))}
          >
            <span className="qiq-tile-lbl">{t.label}</span>
            <span className="qiq-rk">
              {t.rank != null ? <>#{fmtN(t.rank)}{t.prov ? <span className="prov"> prov.</span> : null}</> : <span className="dash">—</span>}
            </span>
            <span className="qiq-of">
              {t.field ? `of ${fmtN(t.field)} ${t.unit}${Number(t.field) === 1 ? '' : 's'}` : ' '}
            </span>
            <span className="qiq-tile-mx">
              <ChevronDown size={15} strokeWidth={2.4} style={{ transform: openTile === t.id ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }} />
            </span>
          </button>
        ))}
      </div>

      {openTile ? (
        <div className="qiq-expand">
          <div className="qiq-expand-hd">
            <span className="qiq-expand-ti">{expandTitle}</span>
            {openTile === 'quiz' ? null : (
              <a className="qiq-expand-full" href="/quizzes/hub?tab=player">
                Full ranking <ArrowRight size={12} strokeWidth={2.4} />
              </a>
            )}
          </div>
          {rows == null ? (
            <div className="qiq-empty">Loading stats and rankings…</div>
          ) : rows.length ? rows.map((r, i) => (
            <div className={`qiq-row${r.me ? ' me' : ''}`} key={i}>
              <span className="rk">#{r.rank}</span>
              <span className="nm">{r.name || '—'}</span>
              <span className="vl">{r.val}</span>
            </div>
          )) : (
            <div className="qiq-empty">{openTile === 'quiz' ? 'No board yet. Be the first to post a score.' : 'Your ranking appears once this game is counted.'}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
