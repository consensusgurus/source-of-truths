'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { DAILY_GAME_MAP, dailyAttemptRule } from '@/lib/daily-games';
import { fetchDailyMe, dailyMeQuery, invalidateDailyMe } from '../../dailyMeClient';
// EVERYONE / <group> over This Puzzle's board (owner, 2026-09-17).
import useGroupStanding from '../../groups/groupStanding';
import GroupSwitch, { useGroupScope } from '../../groups/GroupSwitch';
import { T } from '@/lib/theme';

// DailyBoardPanel — the on-page "<player> Stats" section, in the light page
// theme, placed directly under the Challenge / Share actions on every daily-game
// page. It mirrors the end-of-game card. Header shows the player's name (or a
// sign-up prompt for guests, who still see their hypothetical standings). Below
// sit three punchy tiles that double as the leaderboard selector. Their styling
// is deliberately the END CARD's tile treatment (DailyEndCard `.dec-tile`:
// 2px border, white-to-blue gradient, a colored cap across the top, a big
// centered numeral with the field size spelled out, and a gold/silver/bronze
// tint on a top-3 finish), and the board rows below match `.dec-expand`, so the
// popup a player just dismissed and the panel they scroll to are the same
// element in the same skin (owner consistency pass, 2026-08-01) —
//   1. This Puzzle    — my rank of today's per-game field (key 'today')
//   2. All Time       — my rank of the game's cumulative field (key 'alltime')
//   3. (was Today's Puzzles, the combined best-N board: removed 2026-08-01. The
//      combined standing lives on the /quizzes front page only, and fetching it
//      here cost this page its slowest request.)
//   4. <Game> Archive — % of this game's drops I've completed
// The board area under the tiles is EXPANDED by default (owner, 2026-07-31: a
// reader who opens a daily page should see the board without a second click) and
// defaults to Today's
// daily board; clicking a tile flips the category. Today, All-time and Combined
// Today all render the same condensed top-10 board style for consistency (the
// Combined view carries the "best N of M / max pts" caption). Archive opens this
// game's drop calendar.
//
// Self-contained: fetches /api/quiz/daily-me (my standing in THIS game + this
// day's per-game counts) and /api/quiz/daily-game (this game's all-time board +
// drop calendar) — the same two endpoints the end card reads, so the two agree.
// It used to read /api/quiz/daily-combined, which scores all ~40 of the day's
// games to answer a question about one; on a live page load that was the single
// slowest request (measured 3,289ms / 2,271ms / 2,934ms).
//
// Props: `self` (game key), `quizId` (scopes the combined fetch), `maxWidth`.

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const INK = T.ink;
const SLATE = T.slate;
const FADED = T.muted;
const BORD = '#e7eaf1';
const NAVY = T.accent;
const BLUE = T.blue;

const GAME_NAMES = Object.fromEntries(Object.values(DAILY_GAME_MAP).map((g) => [g.key, g.name]));
// Per-game brand accent (matches the end card / DailyCombinedLeaderboard).
const ACCENTS = { ...Object.fromEntries(Object.values(DAILY_GAME_MAP).map((g) => [g.key, g.color])), crux: T.blue, emcee: '#c026d3', garble: '#b7791f', links: '#166534', span: '#9d174d', dating: '#6d28d9', tally: T.successDeep, suds: '#ea580c', circa: '#0e7490', extra: '#b91c1c', carve: '#7c3aed', stet: '#0369a1', outwit: '#1f2937', tuck: '#92400e', alibi: '#8b1e2d', cipher: '#0f766e', ping: '#0284c7', warmer: '#dc2626', jester: '#7c3aed', sworn: '#be185d', outrank: '#4338ca', axiom: '#0f766e', hearsay: '#7c2d92', venn: '#b45309', stands: T.blueDeep, bracket: '#c2410c' };
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function etTodayEC() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function fmtPts(x) { return x == null ? '' : `${Math.round(Number(x) * 10) / 10} pts`; }
function fmtNum(x) { return x == null ? '' : String(Math.round(Number(x) * 10) / 10); }
function fmtTime(sec) { if (sec == null) return '—'; const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; }

export default function DailyBoardPanel({
  self, quizId = null, maxWidth = 620, streak = null, dark = false,
  // THE STAGE IS NOT 'DARK': it is its own register pair. `dark` picks between
  // the Loft's two palettes, and on the LIGHT stage that meant the panel wore
  // the Loft's brand blue on a white card, inside a page built entirely from
  // stage tokens. With `stage` on, every colour below comes from a token, so
  // the panel follows whichever register is showing and wears the game's own
  // CATEGORY accent rather than the site blue.
  stage = false,
  // WHAT THE FOOT BUTTON DOES. Given a handler, the panel's own control closes
  // the WHOLE section rather than collapsing the board inside it, which is what
  // the stage wants: there the section is mounted by the cap's Rankings chip,
  // so the button at its foot has to be that chip's opposite, not a second and
  // quieter kind of hiding one level down. Without a handler (the Loft's board
  // slot) it keeps collapsing in place, which is all a host that never unmounts
  // the panel can offer.
  onClose = null,
}) {
  // Shadowing the module tokens, which is what makes this one prop rather
  // than an override list. Everything the stylesheet below interpolates
  // follows automatically; only genuinely hardcoded surfaces need naming.
  const INK = stage ? 'var(--stg-ink)' : (dark ? '#e9edf4' : T.ink);
  const SLATE = stage ? 'var(--stg-ink2)' : (dark ? '#aab5c7' : T.slate);
  const FADED = stage ? 'var(--stg-mute)' : (dark ? '#8b95a8' : T.muted);
  const NAVY = stage ? 'var(--stg-ink)' : (dark ? '#e9edf4' : T.accent);
  const BLUE = stage ? 'var(--stg-acc)' : (dark ? '#7dd3fc' : T.blue);
  const BORD = stage ? 'var(--stg-line)' : (dark ? 'rgba(255,255,255,0.12)' : '#e7eaf1');
  const SURF = stage ? 'var(--stg-surf)' : (dark ? 'rgba(255,255,255,0.05)' : 'var(--white)');
  const SOFT = stage ? 'var(--stg-chip)' : (dark ? 'rgba(125,211,252,0.12)' : '#eff4fd');
  // The hover step above SOFT. It was a bare #e4eefc, so hovering the pill
  // painted a pale blue sheet under BLUE ink: measured 1.42:1 on the stage
  // (sky #7dd3fc on #e4eefc). Only a SIGNED-OUT player ever sees this pill,
  // which is why nobody working on the site had hovered it.
  const SOFT2 = stage ? 'var(--stg-surf2)' : (dark ? 'rgba(125,211,252,0.2)' : '#e4eefc');
  // THE CALENDAR LEGEND MUST MATCH THE CALENDAR. These two feed both the
  // .played cell rule and the "Played" swatch, so the legend cannot describe a
  // board it no longer looks like. On the dark register the played cell is a
  // green wash over near-black while the swatch was a pale mint chip, and the
  // Unplayed and Today swatches were pure white against --stg-surf cells: three
  // light chips explaining three dark cells.
  const CAL_PLAYED_BG = dark ? 'rgba(52,168,110,0.22)' : '#e8f5ec';
  const CAL_PLAYED_BD = dark ? 'rgba(127,224,173,0.35)' : '#bfe3ca';
  const [ident, setIdent] = useState(null);        // { email, username } from localStorage
  const [combined, setCombined] = useState(null);  // /api/quiz/daily-me payload
  const [gameData, setGameData] = useState(null);  // /api/quiz/daily-game payload (allTime + drops)
  const [sel, setSel] = useState('today');          // 'today' | 'alltime' | 'archive'
  const grpData = useGroupStanding('today');
  // Today's puzzle only: an archive puzzle's board has no group version here.
  const grpGroups = grpData && grpData.groups
    ? grpData.groups.filter((g) => !g.failed && (!quizId || !g.quizIds || !g.quizIds[self] || g.quizIds[self] === quizId))
    : null;
  const [grpScope, setGrpScope, grpActive] = useGroupScope(grpGroups);
  const [open, setOpen] = useState(true);           // is the board area expanded (open by default, owner 2026-07-31)
  const [calMonth, setCalMonth] = useState(() => etTodayEC().slice(0, 7)); // 'YYYY-MM'

  const selfName = GAME_NAMES[self] || self;
  const accent = ACCENTS[self] || BLUE;
  // THE INITIAL IS AN EDGE ON THE STAGE, NOT A FILL (owner, 2026-08-31). Off
  // stage it is a disc filled with the game's own brand colour, which is the
  // Loft's vocabulary and is right there. On the stage that colour is a
  // SECOND accent: the page is already painted in the game's CATEGORY step, so
  // Mercury drew a red disc on a green page and it was the loudest thing in
  // the panel. On the stage the mark becomes the same rounded plate every
  // other small object on that surface is, marked with the page's own accent,
  // and the page keeps one colour family.
  //
  // THE ACCENT IS THE EDGE AND THE LETTER IS INK, which is not the obvious
  // version and is the only one that survives both registers. Painting the
  // LETTER in var(--stg-acc) reads well on the dark stage and fails on the
  // light one: three of the nine steps are warm, and a warm step on a pale
  // ground does not darken, it keeps its value and flips its INK (see
  // RAMP_INK_LIGHT). So End Game's gold is #e8b43a, which as text on the pale
  // --stg-chip is about 1.5:1. On the edge it is decoration and needs no
  // contrast ratio; the letter takes --stg-ink and clears in either register.
  const avCss = stage
    ? 'width:24px;height:24px;border-radius:7px;background:var(--stg-chip);'
      + 'border:1px solid var(--stg-acc);color:var(--stg-ink);font-family:' + MONO
      + ';font-size:11.5px;font-weight:700;'
    : 'width:22px;height:22px;border-radius:50%;color:var(--white);font-size:11px;font-weight:800;';
  // And the word "Stats" stops being part of the name. On the stage a heading
  // is a bold thing plus a mono label (see the home's category heads and the
  // cap's name over "player"), so the NAME carries the weight and the noun
  // becomes the label. Off stage it stays one bold string, a margin standing in
  // for the space it used to be.
  const sfxCss = stage
    ? 'font-family:' + MONO + ';font-size:10px;letter-spacing:.13em;text-transform:uppercase;'
      + 'font-weight:600;color:' + FADED + ';margin-left:9px;align-self:center;'
    : 'margin-left:6px;';
  // The header for this game's `guessesUsed` column. Every game posts that one
  // shared field but means a different thing by it (Parker = moves, Garble =
  // misses, Axiom = tests), so the word comes from the registry. A null/absent
  // label means the game always posts 0 there, and the column is dropped rather
  // than filled with zeros (owner, 2026-08-01). Keep in sync with DailyEndCard.
  const missLabel = (DAILY_GAME_MAP[self] || {}).miss || null;
  // A tally game reports a bare count with its unit ("7 rows"), so its Score
  // column drops the denominator (see lib/daily-games).
  const scoreUnit = (DAILY_GAME_MAP[self] || {}).unit || null;

  useEffect(() => { try { setIdent(JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null')); } catch (e) {} }, []);

  // The end-game card's "Full leaderboard" / "Leaderboards" buttons dispatch this
  // so we unfurl to the same view the reader was looking at (Today / All-time /
  // Combined / archive), instead of just scrolling to the collapsed tiles.
  useEffect(() => {
    const onOpen = (e) => {
      const v = e && e.detail && e.detail.view;
      // 'combined' is still accepted from older links/events; it falls back to
      // this game's own board rather than dead-ending.
      const valid = ['today', 'alltime', 'archive'];
      if (valid.includes(v)) { setSel(v); setOpen(true); }
      else setOpen(true);
    };
    if (typeof window !== 'undefined') window.addEventListener('sot:open-daily-board', onOpen);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('sot:open-daily-board', onOpen); };
  }, []);

  // My standing in this game + the day's per-game counts. Reloads fresh when a
  // game finishes on this page (the end card dispatches sot:daily-updated).
  useEffect(() => {
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    // Same query the end card builds, so a page that has just shown the card
    // joins the request it already made instead of issuing a second one.
    const qs = dailyMeQuery({ anonId, email, game: self, quizId });
    let alive = true;
    const load = (fresh) => {
      if (fresh) invalidateDailyMe();
      fetchDailyMe(qs, { fresh })
        .then((d) => {
          if (!alive || !d) return;
          // Shape it like the payload this component already read: the game just
          // played carries its board, the rest carry counts only.
          setCombined({
            ...d,
            me: d.me ? { ...d.me, perGame: d.perGame || {} } : null,
            games: Array.isArray(d.games)
              ? d.games.map((g) => (d.game && g.key === d.game.key ? { ...g, ...d.game } : g))
              : [],
          });
        })
        .catch(() => {});
    };
    load(false);
    const onUpdated = () => { if (alive) load(true); };
    if (typeof window !== 'undefined') window.addEventListener('sot:daily-updated', onUpdated);
    return () => { alive = false; if (typeof window !== 'undefined') window.removeEventListener('sot:daily-updated', onUpdated); };
  }, [quizId, self]);

  // This game's all-time board + drop calendar.
  useEffect(() => {
    if (!self) return undefined;
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    const qs = new URLSearchParams({ game: self, fresh: '1' });
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    let alive = true;
    const load = () => {
      fetch('/api/quiz/daily-game?' + qs.toString(), { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (alive && d) setGameData(d); })
        .catch(() => {});
    };
    load();
    const onUpdated = () => { if (alive) load(); };
    if (typeof window !== 'undefined') window.addEventListener('sot:daily-updated', onUpdated);
    return () => { alive = false; if (typeof window !== 'undefined') window.removeEventListener('sot:daily-updated', onUpdated); };
  }, [self]);

  // --- identity --------------------------------------------------------------
  const username = ident && ident.username ? ident.username : null;
  const registered = !!(ident && ident.email);

  // --- derived figures -------------------------------------------------------
  const me = combined && combined.me ? combined.me : null;
  // daily-me scores guests directly (scoreGame keys by anon_id), so there is no
  // separate provisional payload to fold in any more.
  const guest = null;
  const games = (combined && combined.games) || [];
  const todayGame = games.find((g) => g.key === self) || null;
  const allTime = gameData && gameData.allTime ? gameData.allTime : null;
  const drops = (gameData && gameData.drops) || [];

  const siteKey = me ? me.userKey : null;
  const provisional = !me && !!guest;

  const gameTodayRank = (me && me.perGame && me.perGame[self] && me.perGame[self].rank)
    || (guest && guest.perGame && guest.perGame[self] && guest.perGame[self].rank) || null;
  const gameTodayField = (todayGame ? (todayGame.plays ?? todayGame.field) : null)
    || (guest && guest.perGame && guest.perGame[self] && guest.perGame[self].field) || null;
  const allTimeRank = allTime ? allTime.myRank : null;
  const allTimeField = allTime ? (allTime.plays ?? allTime.field) : null;
  const allTimeProv = !!(allTime && allTime.provisional);

  const playedCount = drops.filter((d) => d.played).length;
  const totalDrops = drops.length;
  const pct = totalDrops ? Math.round((playedCount / totalDrops) * 100) : null;

  // --- board rows for the condensed views -----------------------------------
  const siteRows = (todayGame && Array.isArray(todayGame.board)) ? todayGame.board : [];
  // The group's rows for this game when the switch is on a group.
  const todayRows = grpActive ? ((grpActive.boards && grpActive.boards[self]) || []) : siteRows;
  const myKey = grpActive && sel === 'today' ? grpData.userKey : siteKey;
  const allTimeRows = (allTime && Array.isArray(allTime.board)) ? allTime.board : [];

  // --- calendar month cells --------------------------------------------------
  const dropByISO = useMemo(() => new Map((drops || []).map((d) => [d.dateISO, d])), [drops]);
  const todayISO = etTodayEC();
  const monthYMs = (drops && drops.length)
    ? { earliest: drops[0].dateISO.slice(0, 7), latest: todayISO.slice(0, 7) }
    : { earliest: todayISO.slice(0, 7), latest: todayISO.slice(0, 7) };
  const [calY, calM] = calMonth.split('-').map(Number);
  const monthLabel = `${MONTH_NAMES[(calM - 1) % 12]} ${calY}`;
  const firstWeekday = new Date(Date.UTC(calY, calM - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(calY, calM, 0)).getUTCDate();
  const calCells = [];
  for (let k = 0; k < firstWeekday; k++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);
  const shiftMonth = (delta) => {
    let y = calY, m = calM + delta;
    while (m < 1) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    setCalMonth(`${y}-${String(m).padStart(2, '0')}`);
  };
  const canPrev = calMonth > monthYMs.earliest;
  const canNext = calMonth < monthYMs.latest;

  // Click a tile: select it and open the board. Clicking the selected tile while
  // open collapses; the expand button toggles open without changing selection.
  const clickTile = (id) => {
    if (open && sel === id) { setOpen(false); return; }
    setSel(id); setOpen(true);
  };
  const goRegister = () => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('daily-join') || document.getElementById('daily-leaderboard');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // A punchy selector tile. `dash` = no rank yet; `big` overrides the numeral
  // (the archive tile shows a percentage).
  const rankTile = (id, label, rank, field, dash, prov, big) => {
    const on = sel === id;
    // Podium tint on a genuine top-3 finish, same rule as the end card. `big`
    // (the archive percentage) never medals: it is not a rank.
    const medal = (big == null && !dash && rank && rank <= 3) ? ` medal m${rank}` : '';
    return (
      <button type="button" key={id} onClick={() => clickTile(id)} aria-expanded={on && open}
        className={`dbp-tile${on ? ' on' : ''}${medal}`}>
        <div className="dbp-tile-lbl">{label}</div>
        <div className="dbp-tile-rk">
          {big != null ? big
            : dash ? <span className="dash">&mdash;</span>
            : rank ? <>#{rank}{prov ? <span className="prov"> prov.</span> : null}</>
            : <span className="dash">&middot;</span>}
        </div>
        <div className="dbp-tile-of">{field ? <>of {Number(field).toLocaleString()} player{Number(field) === 1 ? '' : 's'}</> : (dash ? 'registered only' : ' ')}</div>
        <ChevronDown className="dbp-tile-cx" size={15} strokeWidth={2.4} style={{ transform: on && open ? 'rotate(180deg)' : 'none' }} />
      </button>
    );
  };

  const simpleBoard = (rows, valOf, emptyMsg) => {
    if (!rows.length) return <div className="dbp-lbempty">{emptyMsg}</div>;
    return rows.slice(0, 10).map((r, i) => {
      const mine = !!(r.isMe || (myKey && r.userKey === myKey));
      return (
        <div className={`dbp-lbrow${mine ? ' me' : ''}`} key={r.userKey || i}>
          <span className="rk">#{r.rank}</span>
          <span className="nm">{r.username || '—'}{mine ? <span className="you"> (you)</span> : null}</span>
          <span className="vl">{valOf(r)}</span>
        </div>
      );
    });
  };

  return (
    <div id="daily-leaderboard" className="dbp" style={{ maxWidth, margin: '18px auto 26px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .dbp{font-family:${SANS};background:${(stage || dark) ? 'transparent' : 'var(--white)'};border:1.5px solid ${stage ? 'var(--stg-line)' : (dark ? 'rgba(255,255,255,0.10)' : 'rgba(20,22,28,0.12)')};border-radius:14px;padding:15px 16px 14px;}
        .dbp-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px;}
        .dbp-hd .t{font-size:16px;font-weight:800;letter-spacing:-.01em;color:${INK};display:flex;align-items:center;gap:8px;min-width:0;}
        .dbp-hd .t .av{${avCss}display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .dbp-hd .t .sfx{${sfxCss}flex-shrink:0;}
        .dbp-hd .t .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .dbp-hd .s{font-family:${MONO};font-size:10.5px;letter-spacing:.04em;color:${FADED};font-weight:500;white-space:nowrap;flex-shrink:0;}
        .dbp-signup{display:inline-flex;align-items:center;gap:6px;font-family:${SANS};font-size:12px;font-weight:800;color:${BLUE};background:${SOFT};border:1px solid ${stage ? 'var(--stg-line2)' : (dark ? 'rgba(125,211,252,0.3)' : '#cfe0fb')};border-radius:999px;padding:6px 12px;cursor:pointer;white-space:nowrap;flex-shrink:0;}
        .dbp-signup:hover{background:${SOFT2};}
        .dbp-streak{font-family:${SANS};font-size:11.5px;font-weight:600;color:${SLATE};white-space:nowrap;flex-shrink:0;}
        .dbp-streak b{font-weight:800;color:${INK};}
        .dbp-streak .best{color:${FADED};}

        /* Tiles mirror DailyEndCard .dec-tile exactly (owner, 2026-08-01): the
           card and this panel show the same three standings, so they now wear
           the same skin. Keep the two in sync when either changes. */
        .dbp-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
        .dbp-tile{position:relative;overflow:hidden;display:block;width:100%;text-align:center;font-family:${SANS};cursor:pointer;border:2px solid ${stage ? 'var(--stg-line)' : (dark ? 'rgba(255,255,255,0.12)' : '#cfdcf4')};background:${stage ? 'var(--stg-surf)' : (dark ? 'rgba(255,255,255,0.05)' : 'linear-gradient(180deg,var(--white),#eff5ff)')};border-radius:14px;padding:15px 10px 12px;min-width:0;box-shadow:${(stage || dark) ? 'none' : '0 3px 13px rgba(20,30,60,.08)'};transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease;}
        /* The colored cap across the top: three deliberate cards, not three
           pale boxes. */
        .dbp-tile::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:${BLUE};}
        .dbp-tile:hover{border-color:${BLUE};box-shadow:0 5px 18px rgba(37,99,235,.16);transform:translateY(-1px);}
        .dbp-tile.on{border-color:${BLUE};box-shadow:0 0 0 1px ${BLUE},0 5px 18px rgba(37,99,235,.16);}
        /* Podium tint: a top-3 finish is the point of the row, so it is colored
           gold / silver / bronze rather than left generic blue. */
        .dbp-tile.m1{border-color:#e3ba57;background:linear-gradient(180deg,#fffdf5,#fdf3d9);box-shadow:0 3px 14px rgba(190,145,25,.20);}
        .dbp-tile.m1::before{background:linear-gradient(90deg,#d9a327,#f2d489);}
        .dbp-tile.m1 .dbp-tile-lbl{color:#96700d;}
        .dbp-tile.m1 .dbp-tile-rk{color:#8a6407;}
        .dbp-tile.m2{border-color:#c3cad6;background:linear-gradient(180deg,var(--white),#f1f3f7);box-shadow:0 3px 13px rgba(40,50,70,.13);}
        .dbp-tile.m2::before{background:linear-gradient(90deg,#98a2b3,#d6dbe4);}
        .dbp-tile.m2 .dbp-tile-lbl{color:#5d6779;}
        .dbp-tile.m2 .dbp-tile-rk{color:#414b5e;}
        .dbp-tile.m3{border-color:#dcb695;background:linear-gradient(180deg,#fffbf7,#fbeee2);box-shadow:0 3px 13px rgba(150,95,45,.16);}
        .dbp-tile.m3::before{background:linear-gradient(90deg,#b8703c,#e2b189);}
        .dbp-tile.m3 .dbp-tile-lbl{color:#8c5527;}
        .dbp-tile.m3 .dbp-tile-rk{color:#7d4a1f;}
        .dbp-tile.m1 .dbp-tile-of,.dbp-tile.m1 .dbp-tile-cx{color:#7d5c0c;}
        .dbp-tile.m2 .dbp-tile-of,.dbp-tile.m2 .dbp-tile-cx{color:#4f5868;}
        .dbp-tile.m3 .dbp-tile-of,.dbp-tile.m3 .dbp-tile-cx{color:#74471f;}
        .dbp-tile-lbl{font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:${BLUE};padding:0 18px;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:28px;}
        .dbp-tile-rk{font-size:43px;font-weight:800;letter-spacing:-.035em;color:${NAVY};line-height:1.02;margin-top:2px;display:block;font-variant-numeric:tabular-nums;}
        .dbp-tile-rk .prov{font-size:12px;font-weight:700;color:${FADED};}
        .dbp-tile-rk .dash{color:${stage ? 'var(--stg-dim)' : (dark ? '#4a5468' : '#c2c8d2')};}
        .dbp-tile-of{font-size:12px;font-weight:700;color:${SLATE};display:block;margin-top:4px;}
        .dbp-tile-cx{position:absolute;top:9px;right:6px;color:${SLATE};transition:transform .15s ease;pointer-events:none;}
        .dbp-tile.on .dbp-tile-cx,.dbp-tile:hover .dbp-tile-cx{color:${BLUE};}

        .dbp-board{border:1px solid ${BORD};border-radius:12px;padding:11px 13px 10px;margin-top:11px;background:${SURF};}
        .dbp-board.plain{padding:0;border:none;}
        .dbp-board-ti{font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:${SLATE};margin-bottom:7px;}
        .dbp-lbrow{display:flex;align-items:center;gap:9px;font-size:13.5px;padding:6px 8px;border-radius:8px;}
        .dbp-lbrow.me{background:${SOFT};}
        .dbp-lbrow .rk{font-family:${MONO};font-size:11.5px;color:${FADED};width:30px;flex-shrink:0;}
        .dbp-lbrow .nm{font-weight:700;color:${INK};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}
        .dbp-lbrow .nm .you{color:${BLUE};font-weight:800;}
        .dbp-lbrow.me .nm{font-weight:800;}
        .dbp-lbrow .vl{font-family:${MONO};font-size:12px;color:${SLATE};flex-shrink:0;}
        .dbp-lbrow .vl .u{color:var(--muted);}
        .dbp-lbempty{font-size:12.5px;color:${FADED};padding:6px 2px;}
        .dbp-note{font-size:11px;color:${FADED};line-height:1.45;margin:9px 2px 1px;}

        /* Today board: richer per-attempt detail (score / time / mistakes / pts).
           On a narrow phone the six columns no longer FIT, and the old fix hid
           Time and Miss, which removed exactly the numbers that explain why a
           player finished where they did. They now stay and the table scrolls
           sideways inside its own box instead (owner, 2026-08-01). The header
           row and the score rows share one scroller so they never desync. */
        .dbp-scroll{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;margin:0 -4px;padding:0 4px;scrollbar-width:thin;}
        .dbp-scroll-in{min-width:406px;}
        /* .nomiss = a game that posts no wrong-answer figure (Suds, Bracket,
           Feud, Outrank, Outwit): five columns, no empty zero column. */
        .dbp-scroll-in.nomiss{min-width:348px;}
        .dbp-g{display:grid;grid-template-columns:30px minmax(74px,1fr) 52px 54px 58px 46px;gap:8px;align-items:center;}
        .nomiss .dbp-g{grid-template-columns:30px minmax(74px,1fr) 52px 54px 46px;}
        .dbp-gh{padding:0 8px 7px;}
        .dbp-gh .h{font-family:${MONO};font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:${FADED};}
        .dbp-grow{padding:7px 8px;border-radius:8px;}
        .dbp-grow.me{background:${SOFT};}
        .dbp-g .rk{font-family:${MONO};font-size:11.5px;color:${FADED};}
        .dbp-g .nm{font-weight:700;color:${INK};font-size:13.5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .dbp-g .nm .you{color:${BLUE};font-weight:800;}
        .dbp-g .num{font-family:${MONO};font-size:11.5px;color:${SLATE};text-align:right;font-variant-numeric:tabular-nums;}
        .dbp-g .pts{font-weight:800;color:${INK};text-align:right;font-variant-numeric:tabular-nums;font-size:13px;}
        /* A hint that there is more to the right, shown only where it scrolls. */
        .dbp-swipe{display:none;font-family:${MONO};font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:${FADED};padding:6px 2px 0;}
        @media(max-width:520px){
          .dbp-swipe{display:block;}
        }

        .dbp-cal-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;}
        .dbp-cal-mo{font-size:14px;font-weight:800;color:${INK};}
        .dbp-cal-nav{display:flex;gap:6px;}
        .dbp-cal-nav button{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid ${BORD};background:${SURF};color:${SLATE};cursor:pointer;}
        .dbp-cal-nav button:disabled{opacity:.4;cursor:default;}
        .dbp-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
        .dbp-cal-wd{font-family:${MONO};font-size:9.5px;color:${FADED};text-align:center;padding-bottom:2px;}
        .dbp-cal-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border-radius:8px;color:#c2c8d2;}
        .dbp-cal-cell.empty{background:transparent;}
        .dbp-cal-cell.none{color:${stage ? 'var(--stg-dim)' : (dark ? '#4a5468' : '#c9cdd6')};}
        a.dbp-cal-cell{text-decoration:none;}
        a.dbp-cal-cell.played{background:${CAL_PLAYED_BG};color:${dark ? '#7fe0ad' : 'var(--success-deep)'};border:1px solid ${CAL_PLAYED_BD};}
        a.dbp-cal-cell.unplayed{background:${SURF};color:${SLATE};border:1px solid ${BORD};}
        a.dbp-cal-cell.unplayed:hover{border-color:${BLUE};color:${BLUE};}
        a.dbp-cal-cell.today{box-shadow:0 0 0 2px ${BLUE};}
        .dbp-cal-key{display:flex;flex-wrap:wrap;gap:10px 14px;margin-top:10px;font-size:11px;color:${FADED};}
        .dbp-cal-key span{display:inline-flex;align-items:center;gap:5px;}
        .dbp-cal-sw{width:11px;height:11px;border-radius:3px;flex-shrink:0;}

        .dbp-full{width:100%;margin-top:11px;padding:9px 12px;border-radius:10px;cursor:pointer;font-family:${SANS};font-size:12.5px;font-weight:800;color:${BLUE};background:transparent;border:1.5px solid ${stage ? 'var(--stg-line2)' : 'var(--accent-border)'};display:inline-flex;align-items:center;justify-content:center;gap:5px;}
        .dbp-full:hover{background:${stage ? 'var(--stg-chip)' : '#f5f8ff'};}

        /* Phone: the three tiles stay side by side, tighter — same as the end
           card's max-width:640px block. */
        @media(max-width:640px){
          .dbp-tiles{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}
          .dbp-tile{padding:12px 6px 9px;border-radius:12px;}
          .dbp-tile::before{height:3px;}
          .dbp-tile-lbl{font-size:9.5px;letter-spacing:.05em;padding:0 11px;min-height:24px;}
          .dbp-tile-rk{font-size:30px;}
          .dbp-tile-of{font-size:11px;}
          .dbp-tile-cx{top:7px;right:5px;}
          .dbp-hd .t{font-size:15px;}
        }
      ` }} />

      <div className="dbp-hd">
        <span className="t">
          {registered && username ? (
            <>
              {/* The fill is inline OFF stage only: on the stage the colour is
                  the page's accent and comes from the token in avCss, so an
                  inline background here would outrank it. */}
              <span className="av" style={stage ? undefined : { background: accent }}>
                {String(username).slice(0, 1).toUpperCase()}
              </span>
              <span className="nm">{username}</span>
              <span className="sfx">Stats</span>
            </>
          ) : <span className="nm">Your Stats</span>}
        </span>
        {registered
          ? (streak ? <span className="dbp-streak">Current {selfName} streak: <b>{streak.current || 0}</b> <span className="best">({streak.best || 0} best)</span></span> : null)
          : <button type="button" className="dbp-signup" onClick={goRegister}><UserPlus size={13} strokeWidth={2.4} /> Sign up</button>}
      </div>

      <div className="dbp-tiles">
        {rankTile('today', 'This Puzzle', gameTodayRank, gameTodayField, false, provisional)}
        {rankTile('alltime', 'All Time', allTimeRank, allTimeField, !(allTime && allTime.myRank != null), allTimeProv)}
        {rankTile('archive', `${selfName} Archive`, null, null, false, false, (pct == null ? <span className="dash">&mdash;</span> : `${pct}%`))}
      </div>

      {open ? (
        <div className="dbp-board">
          {sel === 'today' ? (
            <>
              <div className="dbp-board-ti">{selfName} &middot; this puzzle &middot; {grpActive ? grpActive.name : 'top 10'}</div>
              {grpGroups && grpGroups.length ? (
                <GroupSwitch groups={grpGroups} value={grpScope} onChange={setGrpScope} />
              ) : null}
              {todayRows.length ? (
                <>
                  <div className="dbp-scroll">
                    <div className={`dbp-scroll-in${missLabel ? '' : ' nomiss'}`}>
                      <div className="dbp-g dbp-gh">
                        <span className="h">#</span>
                        <span className="h">Player</span>
                        <span className="h" style={{ textAlign: 'right' }}>{scoreUnit ? scoreUnit.charAt(0).toUpperCase() + scoreUnit.slice(1) : 'Score'}</span>
                        <span className="h" style={{ textAlign: 'right' }}>Time</span>
                        {missLabel ? <span className="h" style={{ textAlign: 'right' }}>{missLabel}</span> : null}
                        <span className="h" style={{ textAlign: 'right' }}>Pts</span>
                      </div>
                      {todayRows.slice(0, 10).map((r, i) => {
                        const mine = !!(myKey && r.userKey === myKey);
                        return (
                          <div className={`dbp-g dbp-grow${mine ? ' me' : ''}`} key={r.userKey || i}>
                            <span className="rk">#{r.rank}</span>
                            <span className="nm">{r.username || '—'}{mine ? <span className="you"> (you)</span> : null}</span>
                            <span className="num">{scoreUnit ? r.score : <>{r.score}/{r.total}</>}</span>
                            <span className="num">{fmtTime(r.timeElapsed)}</span>
                            {/* END GAME prints TRIES here (owner, 2026-08-12).
                                Its registry label is 'Tries' and its rows carry
                                the attempt the solve landed on, which is what
                                the board now ranks on; the per-run error count
                                it used to show no longer decides anything. A
                                run that never solved has no attempt number to
                                report, so it reads as a dash. Every other game
                                has no `tries` and falls through to guessesUsed
                                exactly as before. */}
                            {missLabel ? <span className="num">{r.tries != null ? r.tries : (r.egTier != null ? '—' : (r.guessesUsed == null ? '—' : r.guessesUsed))}</span> : null}
                            <span className="pts">{fmtNum(r.points)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="dbp-swipe">{missLabel ? <>Swipe for time, {missLabel.toLowerCase()} and points →</> : <>Swipe for time and points →</>}</div>
                </>
              ) : <div className="dbp-lbempty">{grpActive ? `Nobody in ${grpActive.name} has played this yet.` : 'No board yet. Be the first to post a score.'}</div>}
            </>
          ) : null}

          {sel === 'alltime' ? (
            <>
              <div className="dbp-board-ti">{selfName} &middot; all time &middot; top 10</div>
              {simpleBoard(allTimeRows, (r) => fmtPts(r.points), 'No all-time scores yet. Play a drop to get on the board.')}
            </>
          ) : null}

          {sel === 'archive' ? (
            drops && drops.length ? (
              <>
                <div className="dbp-cal-hd">
                  <span className="dbp-cal-mo">{monthLabel}</span>
                  <div className="dbp-cal-nav">
                    <button type="button" onClick={() => shiftMonth(-1)} disabled={!canPrev} aria-label="Previous month"><ChevronLeft size={16} strokeWidth={2.4} /></button>
                    <button type="button" onClick={() => shiftMonth(1)} disabled={!canNext} aria-label="Next month"><ChevronRight size={16} strokeWidth={2.4} /></button>
                  </div>
                </div>
                <div className="dbp-cal-grid">
                  {WEEKDAYS.map((w, i) => <div className="dbp-cal-wd" key={`wd${i}`}>{w}</div>)}
                  {calCells.map((d, i) => {
                    if (d == null) return <div className="dbp-cal-cell empty" key={`e${i}`} />;
                    const iso = `${calMonth}-${String(d).padStart(2, '0')}`;
                    const drop = dropByISO.get(iso);
                    const isToday = iso === todayISO;
                    if (!drop) return <div className={`dbp-cal-cell none${isToday ? ' today' : ''}`} key={iso}>{d}</div>;
                    const cls = drop.played ? 'played' : 'unplayed';
                    return <a className={`dbp-cal-cell ${cls}${isToday ? ' today' : ''}`} href={drop.href} key={iso} title={drop.played ? 'Played' : 'Play this drop'}>{d}</a>;
                  })}
                </div>
                <div className="dbp-cal-key">
                  {/* Each swatch reads the SAME value as the cell it stands
                      for. Never hardcode one here: a legend that does not match
                      its board is worse than no legend. */}
                  <span><span className="dbp-cal-sw" style={{ background: CAL_PLAYED_BG, border: `1px solid ${CAL_PLAYED_BD}` }} />Played</span>
                  <span><span className="dbp-cal-sw" style={{ background: SURF, border: `1px solid ${BORD}` }} />Unplayed</span>
                  <span><span className="dbp-cal-sw" style={{ background: SURF, boxShadow: `0 0 0 2px ${BLUE}` }} />Today</span>
                </div>
              </>
            ) : <div className="dbp-lbempty">No archive of {selfName} games yet.</div>
          ) : null}

          {((sel === 'today' && todayRows.length) || (sel === 'alltime' && allTimeRows.length)) ? (
            <p className="dbp-note">Guests play alongside you and count toward the field, but points are scored among registered players only. {dailyAttemptRule(self).board}</p>
          ) : null}
        </div>
      ) : null}

      {/* IT SAYS RANKINGS, because that is what the thing is called everywhere
          else a reader meets it: the cap's chip, the region's own label, the
          heading on the board. Calling it a leaderboard at the foot of the
          panel it opens was the one place the site used a different word for
          the same section. */}
      <button
        type="button"
        className="dbp-full"
        onClick={() => {
          if (onClose) { onClose(); return; }
          if (open) { setOpen(false); } else { setSel('today'); setOpen(true); }
        }}
        aria-expanded={onClose ? true : open}
      >
        {(onClose || open) ? 'Hide rankings' : 'Show rankings'}
        <ChevronDown size={14} strokeWidth={2.6} style={{ transform: (onClose || open) ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }} />
      </button>
    </div>
  );
}
