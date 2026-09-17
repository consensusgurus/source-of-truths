'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { DAILY_GAME_MAP, dailyAttemptRule } from '@/lib/daily-games';
import { T } from '@/lib/theme';

// Unified daily leaderboard (2026-07-16). Replaces the single-game
// <QuizLeaderboard daily/> on every daily-game page. One "Overall" tab ranks
// players by their best-10 daily total (0..150); one tab per game shows that
// game's own board with the points it fed into the total (0..15 each).
//
// Self-contained: fetches /api/quiz/daily-combined itself using the identity the
// quiz client stores in localStorage. Props: `todayKey` (mark current game's
// tab), `identity` (fallback label), `compact` (collapsed top-3 + expander),
// `quizId` (scopes the fetch to a puzzle/date), and `light` (theme — see below).
//
// THEME: default is a NAVY + GOLD card (daily game pages + /daily archive), which
// owns its card and resets the light `#daily-leaderboard` wrapper the daily
// clients provide. Pass `light` for the white/blue/grey/black look (the Stat Hub,
// where navy clashes with the surrounding light cards).

const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
// gold / silver / bronze for the top-3 podium highlight (light theme)
const MEDAL = [T.gold, '#a9b0bd', '#c8814b'];
// The ink that rides ON a medal disc. It was T.white, which is 1.91:1 on gold,
// 2.18 on silver and 3.14 on bronze, and a medal is the same three colours in
// every register so no theme could fix it. Near-black clears all three (9.3 /
// 8.3 / 5.7) and matches the convention the rest of the site already uses for
// a medal: pale disc, dark numeral.
const MEDAL_INK = '#14181f';
const MEDAL_BG = ['#fdf8ec', '#f4f5f7', '#f8f1e9'];
const MEDAL_BD = ['#f0e2ba', '#e3e5ea', '#e8d6c2'];

const GAME_NAMES = Object.fromEntries(Object.values(DAILY_GAME_MAP).map((g) => [g.key, g.name]));
// Per-game accent for the game-board title. Light = the games' own (darker)
// colors; navy = lightened for legibility on the dark card.
const ACCENTS_LIGHT = Object.fromEntries(Object.values(DAILY_GAME_MAP).map((g) => [g.key, g.color]));
const ACCENTS_NAVY = Object.fromEntries(Object.values(DAILY_GAME_MAP).map((g) => [g.key, g.colorNavy]));
// STAGE: the page publishes ONE accent (its category step, as --stg-acc-dk /
// --stg-acc-lt) and every tab reads it. A per-game literal cannot follow the
// light/dark register, so 78 hard-coded hues would have been 78 things to fix
// the next time the ground moves. One var, and the page decides.
const STAGE_ACC = 'var(--stg-acc,#7dd3fc)';
const ACCENTS_STAGE = Object.fromEntries(Object.values(DAILY_GAME_MAP).map((g) => [g.key, STAGE_ACC]));

function theme(mode) {
  // THE STAGE. Every value is a --stg-* role token with the dark register as
  // its fallback, so the same object serves the light switch in the cap. The
  // card matches `.qzhub .card` exactly (surf on line), because this board sits
  // beside those cards and a second, brighter card is a second ground.
  if (mode === 'stage') return {
    light: false, stage: true,
    card: 'var(--stg-surf,rgba(255,255,255,0.045))', cardBorder: 'var(--stg-line,rgba(255,255,255,0.11))', boxShadow: 'none',
    label: 'var(--stg-mute,#8b95a8)', labelWeight: 700, sub: 'var(--stg-mute,#8b95a8)',
    line: 'var(--stg-line,rgba(255,255,255,0.11))',
    // A row is a hairline on the card, never a fill: --stg-surf painted on a
    // --stg-surf card stacks into a rectangle nobody designed (globals.css).
    row: 'transparent', topRow: 'transparent', topBorder: 'var(--stg-line2,rgba(255,255,255,0.17))',
    meRow: 'color-mix(in srgb, var(--stg-acc,#7dd3fc) 14%, transparent)', meBorder: 'var(--stg-acc,#7dd3fc)',
    rankTop: 'var(--stg-acc,#7dd3fc)', rankOther: 'var(--stg-mute,#8b95a8)',
    name: 'var(--stg-ink,#e9edf4)', nameDot: 'var(--stg-line2,rgba(255,255,255,0.17))', you: 'var(--stg-mute,#8b95a8)',
    dim: 'var(--stg-mute,#8b95a8)', total: 'var(--stg-ink,#e9edf4)', unit: 'var(--stg-dim,#747f97)',
    tabOnText: 'var(--stg-onramp,#08222e)', tabOffBg: 'transparent', tabOffText: 'var(--stg-mute,#8b95a8)',
    toggleTrack: 'var(--stg-surf2,rgba(255,255,255,0.08))', toggleOn: 'var(--stg-raise,#0e131f)', toggleOnShadow: 'none',
    expandColor: 'var(--stg-acc,#7dd3fc)', expandBorder: 'var(--stg-line2,rgba(255,255,255,0.17))',
    note: 'var(--stg-dim,#747f97)', empty: 'var(--stg-mute,#8b95a8)',
    skeleton: 'var(--stg-surf2,rgba(255,255,255,0.08))',
    scrollThumb: 'var(--stg-line2,rgba(255,255,255,0.17))',
    accents: ACCENTS_STAGE, overallAccent: STAGE_ACC,
  };
  if (mode === 'light') return {
    light: true, stage: false,
    card: T.white, cardBorder: 'rgba(20,22,28,0.12)', boxShadow: 'none',
    label: T.muted, labelWeight: 700, sub: T.muted,
    line: 'rgba(20,22,28,0.30)',
    row: T.white, topRow: T.white, topBorder: 'rgba(20,22,28,0.30)',
    meRow: T.accentSoft, meBorder: T.accentBorder,
    rankTop: T.accent, rankOther: T.muted,
    name: T.ink, nameDot: '#262b3588', you: T.muted,
    dim: T.muted, total: T.ink, unit: T.muted,
    tabOnText: T.white, tabOffBg: T.white, tabOffText: T.muted,
    expandColor: T.accent, expandBorder: T.accentBorder,
    note: T.muted, empty: T.muted,
    skeleton: 'linear-gradient(90deg,#f2f4f7,#f8fafc,#f2f4f7)',
    scrollThumb: 'rgba(20,22,28,0.18)',
    toggleTrack: '#f2f4f7', toggleOn: T.white, toggleOnShadow: '0 1px 2px rgba(20,22,28,0.12)',
    accents: ACCENTS_LIGHT, overallAccent: T.accent,
  };
  return {
    light: false, stage: false,
    card: 'linear-gradient(165deg,#16294f,#0c1a34)', cardBorder: 'rgba(232,180,58,0.28)', boxShadow: '0 10px 30px rgba(10,18,38,0.25)',
    label: T.gold, labelWeight: 800, sub: '#93a7cc',
    line: 'rgba(255,255,255,0.09)',
    row: 'rgba(255,255,255,0.045)', topRow: 'rgba(232,180,58,0.08)', topBorder: 'rgba(232,180,58,0.22)',
    meRow: 'rgba(232,180,58,0.16)', meBorder: 'rgba(232,180,58,0.55)',
    rankTop: '#f5d878', rankOther: '#93a7cc',
    name: '#eaf0fb', nameDot: '#93a7cc88', you: T.gold,
    dim: '#93a7cc', total: '#f5d878', unit: '#6a80a8',
    tabOnText: '#10203f', tabOffBg: 'transparent', tabOffText: '#93a7cc',
    expandColor: '#f5d878', expandBorder: 'rgba(232,180,58,0.45)',
    note: '#6a80a8', empty: '#93a7cc',
    skeleton: 'linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.08),rgba(255,255,255,0.03))',
    scrollThumb: 'rgba(255,255,255,0.18)',
    toggleTrack: 'rgba(255,255,255,0.06)', toggleOn: 'rgba(255,255,255,0.16)', toggleOnShadow: 'none',
    accents: ACCENTS_NAVY, overallAccent: T.gold,
  };
}
// Active-tab fill: navy = uniform gold; light = the game's own accent (blue for Overall).
function tabAccent(th, key) { return th.light ? (key === 'overall' ? th.overallAccent : th.accents[key] || T.accent) : th.overallAccent; }

function fmtTime(sec) { if (sec == null) return '—'; const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; }
function fmtPts(n) { const v = Math.round(Number(n) * 10) / 10; return Number.isInteger(v) ? String(v) : v.toFixed(1); }

export default function DailyCombinedLeaderboard({ todayKey = null, identity = null, compact = false, quizId = null, light = false, stage = false, allTimeToggle = false, embedded = false, initialTab = null, dense = false }) {
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | error
  const [tab, setTab] = useState(initialTab || todayKey || 'overall');
  const [expanded, setExpanded] = useState(!compact);
  // Per-game "Today vs All-time" scope (only when allTimeToggle is on). The
  // Overall/combined board has no all-time dimension, so it always reads today.
  const [gameScope, setGameScope] = useState('today'); // 'today' | 'alltime'
  const [allTimeCache, setAllTimeCache] = useState({}); // gameKey -> { board, field } | 'loading'
  const th = useMemo(() => ({ ...theme(stage ? 'stage' : light ? 'light' : 'navy'), dense }), [stage, light, dense]);

  useEffect(() => {
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    const qs = new URLSearchParams();
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    if (quizId) qs.set('quizId', quizId);
    let alive = true;
    // Live board: standings and point awards shift through the day as new
    // players post, so after the first load we silently re-poll (and refresh on
    // tab focus) instead of freezing on the mount snapshot.
    const load = (silent, fresh) => {
      if (!silent) { setState('loading'); setData(null); }
      const p = new URLSearchParams(qs);
      if (fresh) { p.set('fresh', '1'); p.set('_', String(Date.now())); }
      fetch('/api/quiz/daily-combined?' + p.toString(), { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (!alive) return; if (d && Array.isArray(d.overall)) { setData(d); setState('ok'); } else { setState((s) => (s === 'ok' ? 'ok' : 'error')); } })
        .catch(() => { if (alive) setState((s) => (s === 'ok' ? 'ok' : 'error')); });
    };
    load(false);
    const iv = setInterval(() => { if (typeof document === 'undefined' || document.visibilityState === 'visible') load(true); }, 45000);
    const onVis = () => { if (typeof document !== 'undefined' && document.visibilityState === 'visible') load(true); };
    // A daily game just finished on this page: the end card confirms the moment
    // the player's row has actually landed and dispatches this event. Reload the
    // board fresh (cache-bypassed) so the new row shows at once, instead of
    // waiting up to 45s for the next poll and risking the edge cache.
    const onUpdated = () => { if (alive) load(true, true); };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    if (typeof window !== 'undefined') { window.addEventListener('focus', onVis); window.addEventListener('sot:daily-updated', onUpdated); }
    return () => { alive = false; clearInterval(iv); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis); if (typeof window !== 'undefined') { window.removeEventListener('focus', onVis); window.removeEventListener('sot:daily-updated', onUpdated); } };
  }, [quizId]);

  // Switching to a different tab always returns to that game's Today board; the
  // player opts back into All-time per game.
  useEffect(() => { setGameScope('today'); }, [tab]);

  // All-time per game (opt-in via allTimeToggle): the game's OWN cumulative board
  // across every drop, from /api/quiz/daily-game. Fetched lazily the first time a
  // game is viewed all-time, then cached for the session.
  // NOTE: allTimeCache is intentionally NOT a dependency. Setting it to 'loading'
  // would otherwise re-run this effect, whose cleanup flips the in-flight fetch's
  // `alive` to false and drops the result — leaving the board stuck on skeleton.
  // A ref tracks which keys are already fetching so we never double-fetch.
  const atFetchedRef = React.useRef({});
  useEffect(() => {
    if (!allTimeToggle || tab === 'overall' || gameScope !== 'alltime') return undefined;
    const key = tab;
    if (atFetchedRef.current[key]) return undefined; // already fetching or fetched
    atFetchedRef.current[key] = true;
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    const p = new URLSearchParams({ game: key, fresh: '1' });
    if (anonId) p.set('anonId', anonId);
    if (email) p.set('email', email);
    let alive = true;
    setAllTimeCache((c) => ({ ...c, [key]: 'loading' }));
    fetch('/api/quiz/daily-game?' + p.toString(), { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (!alive) { delete atFetchedRef.current[key]; setAllTimeCache((c) => { if (c[key] === 'loading') { const n = { ...c }; delete n[key]; return n; } return c; }); return; } const at = d && d.allTime; setAllTimeCache((c) => ({ ...c, [key]: { board: (at && at.board) || [], field: (at && at.field) || 0 } })); })
      .catch(() => { if (alive) { delete atFetchedRef.current[key]; setAllTimeCache((c) => { const n = { ...c }; delete n[key]; return n; }); } });
    return () => { alive = false; };
  }, [allTimeToggle, tab, gameScope]);

  const myKey = data && data.me ? data.me.userKey : null;
  const maxTotal = (data && data.maxTotal) || 150;
  const gameMax = (data && data.gameMax) || 15;
  const gameCount = data ? (data.gameCount != null ? data.gameCount : (data.games || []).length) : null;
  const bestN = data && data.bestN != null ? data.bestN : null;

  // Tab order on a game page: the page's own game first (leftmost + default),
  // then Overall (the combined board), then every other game. Off a game page
  // (no todayKey, e.g. the Stat Hub) Overall stays first.
  const tabs = useMemo(() => {
    const games = (data && data.games) || [];
    const overallTab = { key: 'overall', name: 'Overall' };
    const gameTab = (g) => ({ key: g.key, name: GAME_NAMES[g.key] || g.key });
    if (!todayKey) return [overallTab, ...games.map(gameTab)];
    const mine = games.filter((g) => g.key === todayKey).map(gameTab);
    const rest = games.filter((g) => g.key !== todayKey).map(gameTab);
    // Even if the page's game has no board rows yet today, still show it first.
    if (!mine.length) mine.push({ key: todayKey, name: GAME_NAMES[todayKey] || todayKey });
    return [...mine, overallTab, ...rest];
  }, [data, todayKey]);

  // Scoped chrome: navy scrollbar for the tab scroller + a reset of the daily
  // clients' light `#daily-leaderboard` wrapper (navy owns the card). Harmless
  // where that id is absent (archive/hub).
  const chrome = (
    <style dangerouslySetInnerHTML={{ __html: `
      .dclb-tabs::-webkit-scrollbar{height:6px;}
      .dclb-tabs::-webkit-scrollbar-track{background:transparent;}
      .dclb-tabs::-webkit-scrollbar-thumb{background:${th.scrollThumb};border-radius:999px;}
      ${th.light || th.stage ? '' : '#daily-leaderboard{background:transparent !important;border:none !important;padding:0 !important;box-shadow:none !important;}'}
    ` }} />
  );

  const wrap = embedded
    ? { fontFamily: FONT, background: 'transparent', border: 'none', borderRadius: 0, padding: 0, boxShadow: 'none' }
    : { fontFamily: FONT, background: th.card, border: `1px solid ${th.cardBorder}`, borderRadius: 16, padding: '18px 18px 16px', boxShadow: th.boxShadow };
  const subtitle = (data && gameCount)
    ? (gameCount > 1 ? `Best ${bestN} of ${gameCount} · ${maxTotal} pts max` : `${maxTotal} pts max`)
    : 'Best 10';
  const header = (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 13, gap: 10 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: th.label, fontWeight: th.labelWeight }}>
        Daily Leaderboard
        {/* A past day's combined board is final (see the day freeze in
            lib/daily-combined). Per-game boards stay open, so this label is the
            only thing telling an archive player which of the two they moved. */}
        {data && data.frozen ? <span style={{ marginLeft: 8, color: th.sub, fontWeight: 700 }}>Final</span> : null}
      </div>
      <div style={{ fontSize: 11, letterSpacing: '0.04em', color: th.sub, fontWeight: 600 }}>{subtitle}</div>
    </div>
  );

  if (state === 'loading') {
    return (
      <div style={wrap}>{chrome}{header}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ height: 46, borderRadius: 11, background: th.skeleton, border: `1px solid ${th.line}` }} />)}
        </div>
      </div>
    );
  }
  if (state === 'error' || !data) {
    return <div style={wrap}>{chrome}{header}<p style={{ fontStyle: 'italic', fontSize: 15, color: th.dim }}>Couldn't load the daily leaderboard just now.</p></div>;
  }

  const active = tab;
  const tabBar = (
    <div className="dclb-tabs" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 14, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', scrollbarColor: `${th.scrollThumb} transparent` }}>
      {tabs.map((t) => {
        const on = t.key === active;
        const acc = tabAccent(th, t.key);
        // Overall (the combined board) is the anchor tab, so it always stands
        // out from the per-game tabs: when it isn't the active tab it keeps a
        // fatter accent-colored outline and accent text instead of the muted
        // off-tab look every other tab uses.
        const anchor = t.key === 'overall';
        const offBorder = anchor ? th.overallAccent : th.line;
        const offText = anchor ? th.overallAccent : th.tabOffText;
        const bw = on ? 1.5 : (anchor ? 2.5 : 1.5);
        return (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: '0 0 auto', padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: anchor ? 900 : 800, letterSpacing: '0.01em', whiteSpace: 'nowrap',
              background: on ? acc : th.tabOffBg, color: on ? th.tabOnText : offText, border: `${bw}px solid ${on ? acc : offBorder}` }}>
            {t.name}{t.key === todayKey ? ' •' : ''}
          </button>
        );
      })}
    </div>
  );

  const linkBtn = (label, onClick) => (
    <button onClick={onClick}
      style={{ width: '100%', marginTop: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: 800, color: th.expandColor, background: 'transparent', border: `1.5px solid ${th.expandBorder}` }}>
      {label}
    </button>
  );

  // Points explainer. An archived day pays the rule it was PLAYED under, so
  // the copy follows the day's own flag rather than today's rule.
  const scaleLine = (data && data.ladder === false)
    ? "Each game was worth 15: up to 5 for how much you got right, up to 10 for where you placed against that day's field."
    : 'Each game is worth 15, by where you finish: 15 for 1st, 12 for 2nd, 10 for 3rd, then 8, 7, 6, 5, 4, 3 and 2 down to 10th. Finish outside the top 10 and you still earn 1.';
  // Who you are ranked against. Guests are counted in the "of N" denominator but
  // not in the points, so say so rather than leaving the two to disagree.
  const poolLine = (data && data.ladder === false)
    ? 'Points reflect results from unregistered users.'
    : 'Guests play alongside you and count toward the field, but points are scored among registered players only.';
  const gc = gameCount || 0;
  const gameWord = gc === 1 ? 'game' : 'games';
  const totalLine = gc > 1
    ? `Your daily total is your best ${bestN} of the day's ${gc} games.`
    : 'One game ran this day, so your daily total is just that game.';

  if (compact && !expanded) {
    return (
      <div style={wrap}>{chrome}
        {header}
        <OverallBoard data={data} myKey={myKey} maxTotal={maxTotal} gameCount={gc} limit={3} showMe={false} th={th} />
        {linkBtn(`Show all ${gc} ${gameWord} & full standings`, () => setExpanded(true))}
      </div>
    );
  }

  const showScope = allTimeToggle && active !== 'overall';
  const scopeToggle = showScope ? (
    <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: th.toggleTrack, borderRadius: 999, padding: 3, width: 'fit-content' }}>
      {[['today', 'Today'], ['alltime', 'All-time']].map(([k, lbl]) => {
        const on = gameScope === k;
        return (
          <button key={k} onClick={() => setGameScope(k)}
            style={{ padding: '5px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', border: 'none',
              background: on ? th.toggleOn : 'transparent', color: on ? th.total : th.dim, boxShadow: on ? th.toggleOnShadow : 'none' }}>
            {lbl}
          </button>
        );
      })}
    </div>
  ) : null;
  const activeGame = (data.games || []).find((g) => g.key === active);
  // How a replay counts, which is not the same on all three kinds of daily
  // (dailyAttemptRule in lib/daily-games). A per-game tab can state its own
  // rule outright; the Overall board mixes every game of the day, so it states
  // the general shape instead of picking one.
  const attemptLine = active === 'overall'
    ? 'Most games count only your first attempt. End Game titles rank on how many runs the solve took, and Arcade games take your best run of the day.'
    : dailyAttemptRule(active).board;
  const gameView = active === 'overall'
    ? <OverallBoard data={data} myKey={myKey} maxTotal={maxTotal} gameCount={gc} th={th} />
    : (showScope && gameScope === 'alltime')
      ? <AllTimeBoard game={activeGame} entry={allTimeCache[active]} myKey={myKey} th={th} />
      : <GameBoard game={activeGame} myKey={myKey} gameMax={gameMax} th={th} />;

  return (
    <div style={wrap}>{chrome}
      {header}
      {tabBar}
      {scopeToggle}
      {gameView}
      <p style={{ fontSize: 11, color: th.note, marginTop: 12, lineHeight: 1.5 }}>
        {scaleLine} {totalLine} {poolLine} {attemptLine}
      </p>
      {compact ? linkBtn('Show less', () => { setExpanded(false); setTab(todayKey || 'overall'); }) : null}
    </div>
  );
}

function rowStyle(th, mine, rank) {
  if (mine) return { background: th.meRow, border: `1px solid ${th.meBorder}` };
  // Podium: gold / silver / bronze tint for the top three (light theme).
  if (th.light && rank >= 1 && rank <= 3) return { background: MEDAL_BG[rank - 1], border: `1px solid ${MEDAL_BD[rank - 1]}` };
  const bg = rank <= 3 ? th.topRow : th.row;
  const bd = rank <= 3 ? th.topBorder : th.line;
  return { background: bg, border: `1px solid ${bd}` };
}

function RankNum({ n, th }) {
  const d = th.dense;
  // Top three get a filled gold/silver/bronze medal badge (light + stage; the
  // badge is a solid colour, so unlike the row TINT below it reads on either
  // ground and the stage keeps the podium rather than flattening it).
  if ((th.light || th.stage) && n >= 1 && n <= 3) {
    const sz = d ? 19 : 23;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: sz, height: sz, borderRadius: '50%', background: MEDAL[n - 1], color: MEDAL_INK, fontFamily: FONT, fontWeight: 900, fontSize: d ? 11 : 13, fontVariantNumeric: 'tabular-nums', boxShadow: '0 1px 2px rgba(20,22,28,0.18)' }}>{n}</span>
    );
  }
  return <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: d ? 14 : 17, color: n <= 3 ? th.rankTop : th.rankOther, fontVariantNumeric: 'tabular-nums' }}>{n}</span>;
}

function PlayerName({ row, mine, th }) {
  const label = row.username;
  return (
    <span style={{ minWidth: 0, fontFamily: FONT, fontSize: th.dense ? 13.5 : 16, fontWeight: 500, color: th.name, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {row.userKey ? <a href={`/quizzes/hub?player=${encodeURIComponent(row.userKey)}`} style={{ color: 'inherit', textDecoration: 'none', borderBottom: `1px dotted ${th.nameDot}` }}>{label}</a> : label}
      {mine ? <span style={{ color: th.you, fontWeight: 700 }}> (you)</span> : ''}
    </span>
  );
}

function OverallBoard({ data, myKey, maxTotal, gameCount = 10, limit = 10, showMe = true, th }) {
  const rows = (data.overall || []).slice(0, limit);
  const grid = { display: 'grid', gridTemplateColumns: '40px 1fr 66px 72px', gap: 8 };
  const meShown = myKey && rows.some((r) => r.userKey === myKey);
  if (!rows.length) {
    return <p style={{ fontFamily: FONT, fontStyle: 'italic', fontSize: 15, color: th.empty }}>No one has posted a daily score yet. Be the first.</p>;
  }
  const totalCell = (v) => (
    <span style={{ fontFamily: FONT, fontSize: th.dense ? 13 : 15, fontWeight: 800, textAlign: 'right', color: th.total, fontVariantNumeric: 'tabular-nums' }}>{fmtPts(v)}<span style={{ fontSize: 11, fontWeight: 600, color: th.unit }}>/{maxTotal}</span></span>
  );
  return (
    <div>
      <div style={{ ...grid, padding: '0 14px 8px', fontFamily: FONT, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: th.dim }}>
        <span>#</span><span>Player</span><span style={{ textAlign: 'right' }}>Games</span><span style={{ textAlign: 'right' }}>Total</span>
      </div>
      {rows.map((r) => {
        const mine = myKey && r.userKey === myKey;
        return (
          <div key={r.userKey} style={{ ...grid, ...rowStyle(th, mine, r.rank), alignItems: 'center', padding: th.dense ? '7px 12px' : '10px 14px', marginBottom: th.dense ? 5 : 6, borderRadius: 10 }}>
            <RankNum n={r.rank} th={th} />
            <PlayerName row={r} mine={mine} th={th} />
            <span style={{ fontFamily: FONT, fontSize: th.dense ? 12 : 13.5, fontWeight: 600, textAlign: 'right', color: th.dim, fontVariantNumeric: 'tabular-nums' }}>{r.gamesPlayed}/{gameCount}</span>
            {totalCell(r.total)}
          </div>
        );
      })}
      {showMe && myKey && data.me && !meShown ? (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${th.line}` }}>
          <div style={{ ...grid, ...rowStyle(th, true, data.me.rank), alignItems: 'center', padding: th.dense ? '7px 12px' : '10px 14px', borderRadius: 10 }}>
            <RankNum n={data.me.rank} th={th} />
            <PlayerName row={data.me} mine th={th} />
            <span style={{ fontFamily: FONT, fontSize: th.dense ? 12 : 13.5, fontWeight: 600, textAlign: 'right', color: th.dim, fontVariantNumeric: 'tabular-nums' }}>{data.me.gamesPlayed}/{gameCount}</span>
            {totalCell(data.me.total)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GameBoard({ game, myKey, gameMax, th }) {
  if (!game) return <p style={{ fontFamily: FONT, fontStyle: 'italic', fontSize: 15, color: th.empty }}>No board for this game today.</p>;
  const rows = game.board || [];
  const gridSm = '34px 1fr 54px 60px';
  const acc = th.accents[game.key] || th.total;
  const plays = (game.plays != null ? game.plays : game.field) || 0;
  // Header (game link + play count) shows in EVERY state, so a game whose only
  // plays today are guests still reports its play count instead of looking dead.
  const gameHeader = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
      <a href={game.href || `/${game.key}`} style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: acc, textDecoration: 'none' }}>{GAME_NAMES[game.key] || game.key} <span style={{ fontWeight: 700, opacity: 0.85 }}>&rarr;</span></a>
      <div style={{ fontFamily: FONT, fontSize: 11, color: th.dim }}>{plays.toLocaleString()} {plays === 1 ? 'play' : 'plays'}</div>
    </div>
  );
  if (!rows.length) {
    return (
      <div>
        {gameHeader}
        <p style={{ fontFamily: FONT, fontStyle: 'italic', fontSize: 15, color: th.empty }}>{plays > 0 ? 'No ranked scores here yet — sign in and play to claim the top spot.' : 'No one has posted a score here yet. Be the first.'}</p>
      </div>
    );
  }
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `.dclb-g{grid-template-columns:40px 1fr 60px 58px 66px;}@media(max-width:520px){.dclb-g{grid-template-columns:${gridSm};}.dclb-time{display:none;}}` }} />
      {gameHeader}
      <div className="dclb-g" style={{ display: 'grid', gap: 8, padding: '0 14px 8px', fontFamily: FONT, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: th.dim }}>
        <span>#</span><span>Player</span><span style={{ textAlign: 'right' }}>Score</span><span className="dclb-time" style={{ textAlign: 'right' }}>Time</span><span style={{ textAlign: 'right' }}>Pts</span>
      </div>
      {rows.map((r) => {
        const mine = myKey && r.userKey === myKey;
        return (
          <div key={r.userKey} className="dclb-g" style={{ display: 'grid', gap: 8, ...rowStyle(th, mine, r.rank), alignItems: 'center', padding: th.dense ? '7px 12px' : '10px 14px', marginBottom: th.dense ? 5 : 6, borderRadius: 10 }}>
            <RankNum n={r.rank} th={th} />
            <PlayerName row={r} mine={mine} th={th} />
            <span style={{ fontFamily: FONT, fontSize: th.dense ? 12 : 13.5, fontWeight: 600, textAlign: 'right', color: th.dim, fontVariantNumeric: 'tabular-nums' }}>{(DAILY_GAME_MAP[game.key] || {}).unit ? r.score : <>{r.score}/{r.total}</>}</span>
            <span className="dclb-time" style={{ fontFamily: FONT, fontSize: th.dense ? 12 : 13.5, fontWeight: 600, textAlign: 'right', color: th.dim, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(r.timeElapsed)}</span>
            <span style={{ fontFamily: FONT, fontSize: th.dense ? 12.5 : 14.5, fontWeight: 800, textAlign: 'right', color: th.total, fontVariantNumeric: 'tabular-nums' }}>{fmtPts(r.points)}<span style={{ fontSize: 10.5, fontWeight: 600, color: th.unit }}>/{gameMax}</span></span>
          </div>
        );
      })}
    </div>
  );
}

// The game's OWN cumulative all-time board: each registered player's per-drop
// points summed across every drop of this game to date (from /api/quiz/daily-game).
// Points are cumulative (no fixed max), so there is no /15 denominator or time.
function AllTimeBoard({ game, entry, myKey, th }) {
  const key = game ? game.key : null;
  const acc = (key && th.accents[key]) || th.total;
  const gameHeader = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
      <a href={(game && game.href) || `/${key || ''}`} style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: acc, textDecoration: 'none' }}>{(key && GAME_NAMES[key]) || key} <span style={{ fontWeight: 700, opacity: 0.85 }}>&rarr;</span></a>
      <div style={{ fontFamily: FONT, fontSize: 11, color: th.dim }}>All-time · cumulative points</div>
    </div>
  );
  if (entry === 'loading' || entry == null) {
    return <div>{gameHeader}<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[0, 1, 2].map((i) => <div key={i} style={{ height: 40, borderRadius: 11, background: th.skeleton, border: `1px solid ${th.line}` }} />)}</div></div>;
  }
  const rows = entry.board || [];
  if (!rows.length) {
    return <div>{gameHeader}<p style={{ fontFamily: FONT, fontStyle: 'italic', fontSize: 15, color: th.empty }}>No all-time scores here yet. Play a drop to get on the board.</p></div>;
  }
  const grid = { display: 'grid', gridTemplateColumns: '40px 1fr 84px', gap: 8 };
  return (
    <div>
      {gameHeader}
      <div style={{ ...grid, padding: '0 14px 8px', fontFamily: FONT, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: th.dim }}>
        <span>#</span><span>Player</span><span style={{ textAlign: 'right' }}>Points</span>
      </div>
      {rows.map((r) => {
        const mine = !!(r.isMe || (myKey && r.userKey === myKey));
        return (
          <div key={r.userKey || r.rank} style={{ ...grid, ...rowStyle(th, mine, r.rank), alignItems: 'center', padding: th.dense ? '7px 12px' : '10px 14px', marginBottom: th.dense ? 5 : 6, borderRadius: 10 }}>
            <RankNum n={r.rank} th={th} />
            <PlayerName row={r} mine={mine} th={th} />
            <span style={{ fontFamily: FONT, fontSize: th.dense ? 12.5 : 14.5, fontWeight: 800, textAlign: 'right', color: th.total, fontVariantNumeric: 'tabular-nums' }}>{fmtPts(r.points)}<span style={{ fontSize: 10.5, fontWeight: 600, color: th.unit }}> pts</span></span>
          </div>
        );
      })}
    </div>
  );
}
