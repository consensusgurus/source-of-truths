'use client';

// Client for /daily. A daily-games LANDING PAGE (archive-complete):
//   • a "your day" header — games played today, aced, and your live daily
//     rank/total (from /api/quiz/daily-combined);
//   • a "still to play today" rail of the games you haven't opened yet;
//   • every game grouped by type as a two-up CARD. Each card shows the game's
//     art, a one-line stat, and three quiet actions: Play, Standings, Archive.
//     Standings and Archive expand IN PLACE (mutually exclusive), so the card
//     face stays calm and the archive/leaderboard are one tap away.
//       - Standings → that game's daily board (top 3 + your row, full-standings
//         expander, This-game / Overall tabs), styled like DailyCombinedLeaderboard.
//       - Archive → every past drop as a date chip, played ✓ / aced ★ marks read
//         from per-puzzle localStorage + server play history.
// Self-contained styling (its own <style>) so it matches the daily pages'
// navy-and-gold look. Two fetches for the whole page: daily-status and
// daily-combined, both already edge-cached.

import React, { useState, useEffect, useMemo } from 'react';
import useDailyOrder, { sortByDailyOrder } from '../useDailyOrder';
import DailyCombinedLeaderboard from '../quiz/[id]/DailyCombinedLeaderboard';
import { postView } from '@/lib/api';
import { T } from '@/lib/theme';
import { isRetiredDaily, dailyUnit } from '@/lib/daily-games';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const INK = T.ink;
const FADED = T.muted;
const MUTED = T.slate;
const BG = T.surface;
const LINE = '#e7eaf1';
const NAVY = T.accent;
const GOLD = T.gold;
const GOLD_B = '#b26b00';
const GREEN = '#16a34a';
const BLUE = T.blue;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CAL_WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const FAMILIES = [
  { key: 'word', label: 'Word', keys: ['crux', 'strata', 'lode', 'encore', 'emcee', 'shards', 'garble', 'links', 'stet', 'tuck', 'warmer', 'glyph', 'anon', 'rung', 'hinge', 'babel', 'barter'] },
  { key: 'geography', label: 'Geography', keys: ['atlas', 'flank', 'span', 'ping'] },
  { key: 'numbers', label: 'Numbers', keys: ['tally', 'calc', 'carve', 'cipher', 'crunch', 'blitz', 'blitzed', 'sums'] },
  // Sudoku split out of Numbers on 2026-09-01, the same nine keys the Sudoku
  // circuit pools, so this shelf and that circuit stay one list.
  { key: 'sudoku', label: 'Sudoku', keys: ['suds', 'sixes', 'towers', 'quilt', 'cages', 'sando', 'mercury', 'polka', 'knight', 'diag', 'frame', 'rim', 'whittle'] },
  { key: 'crowd', label: 'Crowd Psychology', keys: ['outwit', 'outrank', 'feud'] },
  { key: 'trivia', label: 'Trivia', keys: ['deep', 'streak', 'atlas', 'sport', 'biz', 'script', 'quotes', 'focus', 'thread', 'slot', 'bracket', 'listed', 'niche', 'redact', 'dating', 'extra'] },
  { key: 'logic', label: 'Logic', keys: ['alibi', 'jester', 'sworn', 'axiom', 'hearsay', 'venn', 'stands', 'etch', 'hedge', 'park', 'impound', 'junkyard', 'fib', 'suffice', 'paths', 'chomp', 'docket', 'plot'] },
  { key: 'endgame', label: 'End Game', keys: ['mate', 'defend', 'queen', 'four', 'check', 'chain', 'turn'] },
  { key: 'cards', label: 'Cards', keys: ['taire', 'hands', 'shoe', 'finesse'] },
  { key: 'arcade', label: 'Arcade', keys: ['blocks', 'sweep'] },
  // Retired games keep their full archives playable here, at the bottom of the
  // page, but no longer run new daily puzzles (owner ruling 2026-07-20).
  { key: 'retired', label: 'Retired', keys: ['circa'] },
];

// A game moves itself into Retired the morning after its bank's last drop
// (RETIRED_DAILY in lib/daily-games), so nothing has to ship on the day. Its key
// stays listed under its real family above, which is where it goes back if the
// bank is ever extended.
const CATEGORIES = (() => {
  const retiredGroup = FAMILIES.find((c) => c.key === 'retired');
  const moved = [];
  const live = FAMILIES
    .filter((c) => c.key !== 'retired')
    .map((c) => ({ ...c, keys: c.keys.filter((k) => (isRetiredDaily(k) ? (moved.push(k), false) : true)) }))
    .filter((c) => c.keys.length);
  return [...live, { ...retiredGroup, keys: [...retiredGroup.keys, ...moved] }];
})();
// Each game's accent, lightened for legibility on the dark leaderboard card
// (mirrors ACCENTS_NAVY in DailyCombinedLeaderboard).
const NAVY_ACCENT = {
  barter: '#fb7fa2', plot: '#e0a86a', sixes: '#7da2f5', niche: '#3ecfbd', shoe: '#7cc4ec', queen: '#f2c14e', race: '#93c5fd', towers: '#58b7f2', mercury: '#f18c8c', polka: '#67dd9a', knight: '#9d99f0', whittle: '#dcae6a', diag: '#7dd3fc', frame: '#f2c27a', rim: '#bef264', calc: '#fb7185', encore: '#86a9ff', biz: '#4fbf8b', flank: '#b1d977', script: '#c9a4ea', quotes: '#a8b8e8', focus: '#fdba74', thread: '#e9a3d0', slot: '#b8cf6e',
  defend: '#8fbdbd', blitz: '#c3d94a', blitzed: '#a8e063', sums: '#f472b6', hinge: '#a5b4fc', docket: '#c9a3ae', chomp: '#f0a071', blocks: '#93b4f0', sweep: '#5eead4', babel: '#6ee7b7', glyph: '#94a3b8', hands: '#fca5a5', finesse: '#c4b5fd', chain: '#f0abfc', turn: '#8cda81', suffice: '#a5b4fc', strata: '#f4a06a', redact: '#b9bdc7', paths: '#34d399', deep: '#7dd3fc', anon: '#e8969f',
  atlas: '#4ade9c', sport: '#f2a56b', crux: '#5b9bff', emcee: '#e879f9', garble: '#f0c95a', links: '#4ca878', span: '#e06aa0', dating: '#a483f0',
  sando: '#5ec8d0', cages: '#cba6f7', quilt: '#eda5e6', tally: '#4cb377', suds: '#f0894c', circa: '#38b6cf', extra: '#e06a6a', carve: '#a483f0', stet: '#41b1e8',
  outwit: '#c3cfe3', tuck: '#e0a568', alibi: '#ef8896', cipher: '#3fc9b8', ping: '#4cb3f0', warmer: '#f3705c',
  jester: '#a78bfa', sworn: '#f472b6', outrank: '#8b8af5', shards: '#2dd4bf',
  axiom: '#5eead4', hearsay: '#d8b4fe', venn: '#fbbf24', stands: '#93c5fd', bracket: '#fb923c', pricer: '#4ade80',
  lode: '#e0b13f', etch: '#a3e635', hedge: '#67e8f9', listed: '#e9b8f5', mate: '#d9b38c', four: '#9db8ff', park: '#f0cf9a', impound: '#e3bd85', junkyard: '#d9b070', check: '#5fd6b8', rung: '#7fd4e8', crunch: '#f0c07a', taire: '#86efac', fib: '#c4b5fd', streak: '#fb7185', feud: '#fda4af',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function keysFor(gameKey, num, rev) {
  if (gameKey === 'crux') {
    const ks = [`sot_crux_${num}`];
    if (rev) ks.push(`sot_crux_${num}_r${rev}`);
    return ks;
  }
  return [`sot_${gameKey}_${num}`];
}
function shortDate(dateLabel) {
  return (dateLabel || '').replace(/,\s*\d{4}$/, '');
}
function fmtTime(sec) {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
function fmtPts(n) {
  const v = Math.round(Number(n) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
function tint(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
// Deterministic on server + client, so it can render during SSR without a
// hydration mismatch.
function dateHeadline(today) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today || '');
  if (!m) return 'Today';
  const y = +m[1], mo = +m[2], d = +m[3];
  const wd = WEEKDAYS[new Date(y, mo - 1, d).getDay()];
  return `${wd}, ${MONTHS[mo - 1]} ${d}`;
}

// Cross-game daily streak: consecutive calendar days (newest first) where at
// least one game's drop for that day has a save. An unplayed today does not
// break the streak; it just doesn't count yet.
function computeStreak(games, played) {
  const byDate = new Map();
  for (const g of games) for (const p of g.puzzles) {
    const t = Date.parse(p.dateLabel || '');
    if (!isFinite(t)) continue;
    if (!byDate.has(t)) byDate.set(t, []);
    byDate.get(t).push(`${g.key}:${p.num}`);
  }
  const dates = [...byDate.keys()].sort((a, b) => b - a);
  let s = 0;
  for (let i = 0; i < dates.length; i++) {
    const any = byDate.get(dates[i]).some((k) => played.has(k));
    if (any) s++;
    else if (i === 0) continue;
    else break;
  }
  return s;
}

export default function DailyArchiveClient({ games = [], today = '' }) {
  const [played, setPlayed] = useState(() => new Set());
  const [completed, setCompleted] = useState(() => new Set());
  const [progress, setProgress] = useState(() => new Set()); // started today, not finished
  const [ready, setReady] = useState(false);
  const [combined, setCombined] = useState(null);
  const [gameStreaks, setGameStreaks] = useState({}); // per-game consecutive-day streaks, from daily-status
  const [allTimeByKey, setAllTimeByKey] = useState({}); // gameKey -> { rank, field } (per-game cumulative)

  const dailyOrder = useDailyOrder();

  // Deep-link support: /daily?archive=<gameKey> opens that game's Archive panel
  // and scrolls to it (used by the end-of-game "Play a past <Game>" action).
  useEffect(() => {
    let key = null;
    try { key = new URLSearchParams(window.location.search).get('archive'); } catch (e) {}
    if (!key) return undefined;
    const t = setTimeout(() => {
      const btn = document.querySelector('[data-arch="' + key + '"]');
      if (!btn) return;
      if (btn.getAttribute('aria-expanded') !== 'true') btn.click();
      const card = btn.closest('.dl-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => clearTimeout(t);
  }, [ready]);

  // Log a /daily page view so the admin analytics ViewsPanel can see hub
  // traffic. Mirrors the homepage pattern: a pseudo list id ('daily') in the
  // views table, deduped to once per browser session via sessionStorage so
  // reopening a tab or navigating back doesn't inflate the count. NOTE: never
  // create a real list with id 'daily'; this id is reserved for hub traffic.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('sot-daily-viewed') === '1';
      if (!seen) sessionStorage.setItem('sot-daily-viewed', '1');
    } catch (e) {
      // sessionStorage unavailable: fall through and count this load.
    }
    if (!seen) postView('daily');
  }, []);
  const gamesByKey = useMemo(() => {
    const m = {};
    for (const g of games) m[g.key] = g;
    return m;
  }, [games]);

  useEffect(() => {
    let alive = true;
    const pl = new Set();
    const cp = new Set();
    const pg = new Set();
    const byQuiz = {};
    for (const g of games) {
      for (const p of g.puzzles) {
        if (p.quizId) byQuiz[p.quizId] = `${g.key}:${p.num}`;
        let finished = false, won = false, hasSave = false;
        for (const k of keysFor(g.key, p.num, p.rev)) {
          let raw = null;
          try { raw = localStorage.getItem(k); } catch (e) {}
          if (!raw) continue;
          hasSave = true;
          let st = null;
          try { st = (JSON.parse(raw) || {}).status; } catch (e) {}
          // "Played" = a FINISHED attempt (won or lost), never a game merely
          // opened or still in progress ('playing'). Mirrors the sot_<key>_day
          // breadcrumb's done = status !== 'playing', so a started-then-left
          // game no longer shows a check.
          if (st && st !== 'playing') finished = true;
          if (st === 'won') won = true;
        }
        if (finished) pl.add(`${g.key}:${p.num}`);
        else if (hasSave) pg.add(`${g.key}:${p.num}`); // a save exists but the game is not finished
        if (won) cp.add(`${g.key}:${p.num}`);
      }
    }
    setPlayed(new Set(pl));
    setCompleted(new Set(cp));
    setProgress(new Set(pg));
    setReady(true);

    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    const qs = new URLSearchParams();
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    const q = qs.toString();

    fetch('/api/quiz/daily-status?' + q)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d) return;
        const p2 = new Set(pl), c2 = new Set(cp), g2 = new Set(pg);
        for (const qid of (d.played || [])) { const k = byQuiz[qid]; if (k) p2.add(k); }
        for (const qid of (d.completed || [])) { const k = byQuiz[qid]; if (k) c2.add(k); }
        for (const qid of (d.abandoned || [])) { const k = byQuiz[qid]; if (k) g2.add(k); }
        for (const k of p2) g2.delete(k); // a finished game is never "in progress"
        if (d.streaks && typeof d.streaks === 'object') setGameStreaks(d.streaks);
        setPlayed(p2);
        setCompleted(c2);
        setProgress(g2);
      })
      .catch(() => {});

    fetch('/api/quiz/daily-combined?' + q)
      .then((r) => r.json())
      .then((d) => { if (alive && d && Array.isArray(d.overall)) setCombined(d); })
      .catch(() => {});

    // Per-game all-time (cumulative) rank for each row's "Rank All-Time" stat.
    // One /api/quiz/daily-game read per game; the rows show "…" until it lands.
    Promise.all(games.map((g) => {
      const p = new URLSearchParams(q);
      p.set('game', g.key);
      return fetch('/api/quiz/daily-game?' + p.toString())
        .then((r) => r.json())
        .then((d) => ({ k: g.key, at: d && d.allTime }))
        .catch(() => ({ k: g.key, at: null }));
    })).then((res) => {
      if (!alive) return;
      const m = {};
      for (const it of res) m[it.k] = it.at ? { rank: it.at.myRank, field: it.at.field, leader: (it.at.board && it.at.board[0] && it.at.board[0].username) || null } : null;
      setAllTimeByKey(m);
    });

    return () => { alive = false; };
  }, [games]);

  const myKey = combined && combined.me ? combined.me.userKey : null;
  const boardsByKey = useMemo(() => {
    const m = {};
    if (combined && Array.isArray(combined.games)) for (const g of combined.games) m[g.key] = g;
    return m;
  }, [combined]);

  const streak = useMemo(() => (ready ? computeStreak(games, played) : 0), [ready, games, played]);

  const todayNum = (g) => (g.puzzles[0] ? g.puzzles[0].num : null);
  const isPlayedToday = (g) => { const n = todayNum(g); return n != null && played.has(`${g.key}:${n}`); };
  const isDoneToday = (g) => { const n = todayNum(g); return n != null && completed.has(`${g.key}:${n}`); };
  const isResumeToday = (g) => { const n = todayNum(g); return n != null && progress.has(`${g.key}:${n}`) && !played.has(`${g.key}:${n}`); };

  // Only games running a puzzle TODAY count toward the day's tallies. A retired
  // game (e.g. Circa, last drop 2026-07-20) keeps its archive, its category
  // tile, and the Retired section at the bottom of the page, but publishes no
  // puzzle today, so it drops out of "played today", the denominator, and the
  // gauntlet — matching the server leaderboard, which scores only the games
  // that are live on the date (see gameCount in /api/quiz/daily-combined).
  const activeGames = games.filter((g) => g.puzzles[0] && g.puzzles[0].live === today);
  const playedToday = activeGames.filter(isPlayedToday);
  const doneToday = activeGames.filter(isDoneToday);
  const stillToPlay = sortByDailyOrder(activeGames.filter((g) => !isPlayedToday(g)), dailyOrder);

  const groups = CATEGORIES.map((cat) => {
    const gs = sortByDailyOrder(cat.keys.map((k) => gamesByKey[k]).filter(Boolean), dailyOrder);
    return { ...cat, games: gs };
  }).filter((grp) => grp.games.length);

  const me = combined && combined.me;
  const myName = me ? me.username : null;

  // Rival hook for the scoreboard card: the player directly ahead of you today.
  let rivalAv = '★';
  let rivalText = <>Post a score in any puzzle to join today&rsquo;s board</>;
  if (me && combined) {
    const rows = combined.overall || [];
    if (me.rank === 1) {
      rivalAv = '♛';
      rivalText = <>You lead today&rsquo;s board. Keep it.</>;
    } else {
      const ahead = rows.find((r) => r.rank === me.rank - 1);
      if (ahead) {
        rivalAv = String(ahead.username || '?').trim().slice(0, 2).toUpperCase();
        rivalText = <><b>{ahead.username}</b> is {fmtPts(ahead.total - me.total)} pts ahead of you today</>;
      } else if (rows[9]) {
        rivalAv = String(rows[9].username || '?').trim().slice(0, 2).toUpperCase();
        rivalText = <>{fmtPts(rows[9].total - me.total)} pts from today&rsquo;s top 10</>;
      }
    }
  }

  // Live ticker items from today's boards.
  const tickerItems = [];
  if (combined) {
    const o = (combined.overall || [])[0];
    if (o && o.username) tickerItems.push({ name: o.username, post: ` leads the day · ${fmtPts(o.total)}/${combined.maxTotal} pts`, accent: GOLD });
    for (const gb of combined.games || []) {
      const lead = gb.board && gb.board[0];
      const game = gamesByKey[gb.key];
      if (!lead || !lead.username || !game) continue;
      tickerItems.push({ name: lead.username, post: ` leads ${game.name} · ${fmtPts(lead.points)}/${combined.gameMax}`, accent: game.accent });
    }
  }

  const pt = playedToday.length;
  const gauntTease = pt >= activeGames.length && activeGames.length > 0 ? 'Perfect day · every puzzle played'
    : pt < 5 ? `${5 - pt} more to warm-up`
    : pt < 10 ? `${10 - pt} more to grinder`
    : `${activeGames.length - pt} more to a perfect day`;

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <style>{`
        .dl-wrap{max-width:1080px;margin:0 auto;padding:22px 22px 100px;font-family:${SANS};}
        .dl-nav a{font-family:${MONO};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${FADED};text-decoration:none;border-bottom:1px solid rgba(28,30,36,0.22);padding-bottom:1px;}
        .dl-nav a:hover{color:${INK};border-color:${INK};}

        .dl-top{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:24px;align-items:stretch;margin-top:16px;}
        .dl-top-l{display:flex;flex-direction:column;justify-content:center;min-width:0;}
        .dl-top-l .dl-gaunt{margin-top:auto;}
        @media(max-width:860px){.dl-top{grid-template-columns:1fr;}.dl-top-l .dl-gaunt{margin-top:20px;}}
        .dl-kick{font-family:${MONO};font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:${FADED};font-weight:500;}
        .dl-h1{margin:8px 0 7px;font-size:34px;font-weight:800;letter-spacing:-0.9px;color:${INK};line-height:1.0;}
        .dl-sub{margin:0;font-size:14.5px;font-weight:500;color:${FADED};line-height:1.55;max-width:620px;}
        .dl-day{display:flex;flex-direction:column;gap:13px;justify-content:center;background:var(--white);color:${INK};border:1px solid ${LINE};border-radius:16px;padding:18px 20px;box-shadow:0 6px 22px rgba(14,29,64,0.08);min-width:300px;}
        .dl-day-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
        .dl-day-idrow{display:flex;align-items:baseline;gap:8px;min-width:0;}
        .dl-day-name{font-size:14px;font-weight:800;letter-spacing:-.2px;color:${INK};line-height:1.1;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .dl-day-kick{font-family:${MONO};font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:${FADED};font-weight:500;flex:0 0 auto;}
        .dl-streak{display:inline-flex;align-items:center;gap:6px;background:rgba(232,180,58,0.15);border:1px solid rgba(232,180,58,0.42);border-radius:999px;padding:3px 10px;}
        .dl-streak b{color:#8a6d1f;font-size:13px;font-weight:900;line-height:1;}
        .dl-streak span{font-family:${MONO};font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:#9a7c2e;}
        .dl-day-stats{display:flex;align-items:flex-end;gap:16px;}
        .dl-rk{flex:1 1 auto;min-width:0;}
        .dl-rk .n{font-size:36px;font-weight:900;letter-spacing:-1px;line-height:.9;color:${INK};}
        .dl-rk .n .ofn{font-size:15px;font-weight:700;letter-spacing:0;color:#9aa3b5;}
        .dl-rk .l{font-family:${MONO};font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:${FADED};margin-top:6px;}
        .dl-rk .l .of{color:#9aa3b5;}
        .dl-mini{text-align:center;padding-bottom:2px;}
        .dl-mini .n{font-size:24px;font-weight:800;line-height:1;color:${INK};}
        .dl-mini .l{font-family:${MONO};font-size:8.5px;letter-spacing:.09em;text-transform:uppercase;color:${FADED};margin-top:6px;}
        .dl-day .dv{width:1px;align-self:stretch;background:${LINE};}

        .dl-legend{display:flex;gap:18px;flex-wrap:wrap;margin-top:16px;font-family:${SANS};font-size:12.5px;font-weight:600;color:${FADED};}

        .dl-sec-h{display:flex;align-items:baseline;gap:12px;margin:34px 0 14px;}
        .dl-sec-h h2{margin:0;font-size:18px;font-weight:800;letter-spacing:-.4px;color:${INK};}
        .dl-sec-h span{font-family:${MONO};font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:${FADED};}

        .dl-rail{display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;}
        .dl-railcard{flex:0 0 auto;display:flex;align-items:center;gap:11px;border:1px solid ${LINE};border-radius:13px;background:var(--white);padding:10px 15px 10px 11px;text-decoration:none;transition:border-color .15s,box-shadow .15s;}
        .dl-railcard:hover{border-color:#cdd6e6;box-shadow:0 4px 14px rgba(14,29,64,0.07);}
        .dl-alldone{border:1px dashed #cfd6e2;border-radius:13px;background:var(--white);padding:15px 18px;font-size:13.5px;font-weight:600;color:${MUTED};}
        .dl-alldone b{color:${GREEN};}
        .dl-stp{background:var(--white);border:1px solid ${LINE};border-radius:16px;padding:15px 18px;margin-top:16px;display:grid;grid-template-columns:200px minmax(0,1fr);gap:20px;align-items:center;}
        .dl-stp-l{border-right:1px solid #eef1f7;padding-right:18px;}
        .dl-stp-l h2{margin:0 0 11px;font-size:15px;font-weight:800;letter-spacing:-.3px;color:${INK};}
        .dl-stp-count{font-family:${MONO};font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;color:${INK};margin-top:8px;}
        .dl-stp-r{min-width:0;}
        @media(max-width:820px){.dl-stp{grid-template-columns:1fr;}.dl-stp-l{border-right:none;padding-right:0;border-bottom:1px solid #eef1f7;padding-bottom:12px;}}

        .dl-glabel{display:flex;align-items:center;gap:12px;margin:28px 0 14px;}
        .dl-glabel .k{font-family:${MONO};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:500;color:${MUTED};}
        .dl-glabel .line{flex:1 1 auto;height:1px;background:${LINE};}
        .dl-glabel .ct{font-family:${MONO};font-size:10px;color:#9aa3b5;}
        .dl-cards{display:flex;flex-direction:column;gap:10px;}

        /* compact game ROW (owner rework 2026-07-23) */
        .dl-row{border:1px solid ${LINE};border-radius:14px;background:var(--white);transition:border-color .15s,box-shadow .15s;}
        .dl-row:hover{box-shadow:0 3px 12px rgba(14,29,64,0.06);}
        .dl-row.open{border-color:#c9d3e5;box-shadow:0 8px 26px rgba(14,29,64,0.09);}
        .dl-rmain{display:grid;grid-template-columns:minmax(0,1fr) 100px 100px auto auto;gap:16px;align-items:center;padding:13px 16px;cursor:pointer;}
        .dl-rid{display:flex;align-items:center;gap:12px;min-width:0;}
        .dl-ridtext{flex:1 1 auto;min-width:0;}
        .dl-rid .dl-rid-play{flex:0 0 auto;width:132px;box-sizing:border-box;text-align:center;}
        .dl-stbtn{justify-self:start;width:132px;box-sizing:border-box;justify-content:center;display:inline-flex;align-items:center;gap:6px;font-family:${SANS};font-weight:800;font-size:12.5px;color:${MUTED};background:var(--white);border:1px solid ${LINE};border-radius:10px;padding:9px 13px;white-space:nowrap;}
        .dl-stbtn .cx{font-size:10px;color:${MUTED};transition:transform .15s ease;}
        .dl-stbtn.on{border-color:${BLUE};color:${BLUE};}
        .dl-stbtn.on .cx{transform:rotate(180deg);color:${BLUE};}
        .dl-row:hover .dl-stbtn{border-color:#c9d3e5;}
        .dl-rexpand{display:none;}
        .dl-rbeat{font-size:11.5px;font-weight:600;color:${FADED};margin-top:4px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dl-rbeat b{color:${INK};font-weight:800;}
        .dl-rstat{min-width:0;}
        .dl-rlbl{font-family:${MONO};font-size:9px;font-weight:500;letter-spacing:.07em;text-transform:uppercase;color:${MUTED};margin-bottom:3px;white-space:nowrap;}
        .dl-rrk{font-size:21px;font-weight:900;letter-spacing:-.02em;color:${INK};line-height:1.05;font-variant-numeric:tabular-nums;}
        .dl-rrk .of{font-size:11px;font-weight:600;color:${FADED};}
        .dl-rrk.sub{font-size:13px;font-weight:800;color:#8a92a6;}
        .dl-rlink{text-decoration:none;cursor:pointer;}
        .dl-rlink:hover{text-decoration:underline;}
        .dl-rled{font-size:10.5px;font-weight:600;color:${MUTED};margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dl-rled .dl-crown{color:${GOLD};}
        .dl-rled.dim{color:#9aa3b5;font-weight:500;}
        /* archive cell = calendar expander */
        .dl-rarch{display:block;text-align:left;background:none;border:none;padding:0;margin:0;font-family:inherit;cursor:pointer;min-width:0;width:100%;}
        .dl-rarch .cx{display:inline-block;color:${MUTED};transition:transform .15s ease;font-size:10px;vertical-align:1px;}
        .dl-rarch:hover .dl-rlbl,.dl-rarch.on .dl-rlbl{color:${BLUE};}
        .dl-rarch:hover .cx,.dl-rarch.on .cx{color:${BLUE};}
        .dl-rarch.on .cx{transform:rotate(180deg);}
        .dl-rprog{height:8px;border-radius:99px;background:#eef1f7;overflow:hidden;}
        .dl-rprog div{height:100%;border-radius:99px;transition:width .3s;}
        .dl-rprogt{font-size:11px;color:${FADED};margin-top:4px;}
        .dl-rprogt b{color:${INK};font-weight:800;}
        .dl-ract{display:flex;gap:8px;align-items:center;justify-content:flex-end;}
        .dl-ract .dl-btn{flex:0 0 auto;}
        .dl-ract .dl-play{min-width:104px;}
        .dl-ract .dl-ghost{min-width:92px;}
        .dl-exp{padding:0 16px 15px;}
        .dl-exp.two{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:stretch;}
        @media(max-width:900px){.dl-exp.two{grid-template-columns:1fr;} .dl-cal-fadewrap{display:none;}}
        .dl-exp-col{min-width:0;display:flex;flex-direction:column;}
        @media(max-width:760px){
          /* Compact mobile: identity on top; the two rank sections flank a central
             expand chevron; the Archive tracker spans the full width below.
             Standings is hidden (tapping the row / chevron expands). */
          .dl-rmain{grid-template-columns:1fr auto 1fr;gap:10px 12px;align-items:center;}
          .dl-rid{grid-column:1 / -1;}
          .dl-rstat{text-align:center;}
          .dl-rled{white-space:normal;}
          .dl-rexpand{display:flex;align-items:center;justify-content:center;color:${MUTED};font-size:15px;transition:transform .15s ease;}
          .dl-row.open .dl-rexpand{transform:rotate(180deg);color:${BLUE};}
          .dl-stbtn{display:none;}
          .dl-rarch{grid-column:1 / -1;display:block;width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid ${LINE};border-radius:11px;background:#fafbfc;}
          .dl-rarch.on{border-color:${BLUE};background:#f5f8ff;}
          .dl-rarch .dl-rlbl{margin-bottom:7px;}
          .dl-rprog{width:100%;}
          .dl-rprogt{margin-top:6px;}
        }

        /* archive calendar (matches game-page / end-card calendar) */
        .dl-cal{border:none;border-radius:0;padding:0;background:transparent;flex:1 1 auto;display:flex;flex-direction:column;min-height:0;}
        .dl-cal-fadewrap{flex:1 1 0;min-height:0;overflow:hidden;position:relative;margin-top:2px;}
        .dl-cal-fadewrap::after{content:'';position:absolute;left:0;right:0;bottom:0;height:52px;background:linear-gradient(rgba(255,255,255,0),var(--white));pointer-events:none;}
        .dl-cal-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;}
        .dl-cal-mo{font-size:14px;font-weight:800;color:${INK};}
        .dl-cal-nav{display:flex;gap:6px;}
        .dl-cal-nav button{width:28px;height:28px;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid ${LINE};background:var(--white);color:${MUTED};cursor:pointer;}
        .dl-cal-nav button:disabled{opacity:.4;cursor:default;}
        .dl-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
        .dl-cal-wd{font-family:${MONO};font-size:9.5px;color:${FADED};text-align:center;padding-bottom:2px;}
        .dl-cal-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border-radius:8px;color:#c2c8d2;}
        .dl-cal-cell.empty{background:transparent;}
        .dl-cal-cell.none{color:#c9cdd6;}
        a.dl-cal-cell{text-decoration:none;}
        a.dl-cal-cell.played{background:#e8f5ec;color:var(--success-deep);border:1px solid #bfe3ca;}
        a.dl-cal-cell.unplayed{background:var(--white);color:${MUTED};border:1px solid ${LINE};}
        a.dl-cal-cell.unplayed:hover{border-color:${BLUE};color:${BLUE};}
        a.dl-cal-cell.today{box-shadow:0 0 0 2px ${BLUE};}
        .dl-cal-key{display:flex;flex-wrap:wrap;gap:10px 14px;margin-top:10px;font-size:11px;color:${FADED};}
        .dl-cal-key span{display:inline-flex;align-items:center;gap:5px;}
        .dl-cal-key .sw{width:11px;height:11px;border-radius:3px;flex-shrink:0;}
        .dl-cal-header{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:13px;}
        .dl-cal-header .t{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:700;}
        .dl-cal-header .s{font-size:11px;letter-spacing:.04em;color:var(--muted);font-weight:600;white-space:nowrap;}
        .dl-cal-mo2{font-size:12px;font-weight:800;color:${MUTED};margin:14px 0 8px;}
        .dl-cal-month.faded{opacity:.42;pointer-events:none;}
        .dl-cal-wd.sun{color:#b45309;font-weight:700;}
        .dl-cal-cell.none.sun{background:#fdf7ee;color:#c8a24a;}
        a.dl-cal-cell.unplayed.sun{background:#fdf3e0;border-color:rgba(180,83,9,0.28);color:#9a6a12;}
        a.dl-cal-cell.played.sun{box-shadow:0 0 0 1.5px rgba(180,83,9,0.42);}

        .dl-card{border:1px solid ${LINE};border-radius:16px;background:var(--white);transition:border-color .15s,box-shadow .15s;}
        .dl-card:hover{box-shadow:0 4px 16px rgba(14,29,64,0.06);}
        .dl-card.open{border-color:#c9d3e5;box-shadow:0 10px 30px rgba(14,29,64,0.10);}
        .dl-chead{display:flex;align-items:center;gap:14px;padding:16px 18px 0;}
        .dl-art{box-sizing:border-box;border-radius:13px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;overflow:hidden;}
        .dl-art img{width:78%;height:78%;object-fit:contain;}
        .dl-cname{font-size:17.5px;font-weight:800;letter-spacing:-.4px;line-height:1.05;color:${INK};text-decoration:none;}
        /* per-game streak pill, inline after the name on the title row; inline-flex
           + margin-left so it never shifts the icon, name, or Play button */
        .dl-gstreak{display:inline-flex;align-items:center;gap:3px;margin-left:8px;vertical-align:2px;background:rgba(232,180,58,0.15);border:1px solid rgba(232,180,58,0.42);border-radius:999px;padding:1.5px 7px 1.5px 5px;font-size:10.5px;font-weight:800;color:#8a6d1f;font-variant-numeric:tabular-nums;line-height:1.4;white-space:nowrap;}
        .dl-gstreak svg{flex:none;}
        /* mobile: the pill moves out of the title line (which would wrap to an
           extra row) and stacks under the Play button instead. display:contents
           keeps the desktop flex row byte-identical. */
        .dl-playwrap{display:contents;}
        .dl-gstreak.mob{display:none;margin-left:0;}
        @media(max-width:760px){
          .dl-playwrap{display:flex;flex-direction:column;align-items:center;gap:4px;flex:0 0 auto;}
          .dl-gstreak.inl{display:none;}
          .dl-gstreak.mob{display:inline-flex;}
        }
        .dl-cname:hover{text-decoration:underline;text-decoration-color:rgba(28,30,36,.3);text-underline-offset:2px;}
        .dl-ctag{font-size:12.5px;font-weight:500;color:${FADED};margin-top:3px;line-height:1.3;}
        .dl-cbody{padding:13px 18px 17px;}
        .dl-cstat{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-family:${MONO};font-size:11px;font-weight:400;color:${FADED};}
        .dl-cstat b{color:${MUTED};font-weight:500;}
        .dl-cstat .dot{color:#c8cede;}
        .dl-crown{color:${GOLD};}

        .dl-actions{display:flex;gap:8px;margin-top:15px;flex-wrap:wrap;}
        .dl-btn{flex:1 1 auto;text-align:center;font-family:${SANS};font-weight:700;font-size:12.5px;border-radius:10px;padding:10px 12px;cursor:pointer;text-decoration:none;transition:all .13s;white-space:nowrap;}
        .dl-play{flex:1.35 1 auto;color:var(--ink);font-weight:800;border:1px solid transparent;}
        .dl-play:hover{filter:brightness(1.06);}
        .dl-ghost{color:${MUTED};background:var(--white);border:1px solid ${LINE};}
        .dl-ghost:hover{border-color:#c9d3e5;color:${INK};}
        .dl-ghost.on{background:#eef1f7;border-color:#c9d3e5;color:${INK};}
        .dl-ghost .cnt{color:#9aa3b5;font-weight:500;}

        /* expandable panels */
        .dl-panel{margin-top:14px;}
        .dl-archpanel{background:${BG};border:1px solid ${LINE};border-radius:12px;padding:13px 14px;}
        .dl-archpanel .lab{font-family:${MONO};font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:${FADED};margin-bottom:9px;}
        .dl-chips{display:flex;gap:7px;flex-wrap:wrap;}
        .dl-chip{display:inline-flex;align-items:center;gap:6px;font-family:${SANS};font-weight:600;font-size:12px;text-decoration:none;border-radius:8px;padding:6px 10px;border:1px solid ${LINE};color:${MUTED};background:var(--white);}
        .dl-chip:hover{border-color:#c9d3e5;color:${INK};}
        .dl-tick{font-size:11px;font-weight:900;line-height:1;}
        .dl-today-tag{font-family:${MONO};font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;border-radius:4px;padding:1px 5px;color:var(--ink);}
        .dl-morechip{border-style:dashed;color:${FADED};font-family:${MONO};font-size:11px;cursor:pointer;}

        /* leaderboard panel (matches DailyCombinedLeaderboard navy/gold) */
        .lb{background:var(--white);border:1.5px solid var(--border);;border:1px solid rgba(232,180,58,0.26);border-radius:12px;padding:14px 15px 12px;}
        .lb-tabs{display:flex;gap:6px;margin-bottom:12px;}
        .lb-tab{font-family:${SANS};font-size:11.5px;font-weight:800;padding:6px 13px;border-radius:999px;cursor:pointer;border:1.5px solid var(--surface-alt);background:transparent;color:var(--muted);}
        .lb-tab.on{background:${GOLD};color:#10203f;border-color:${GOLD};}
        .lb-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px;}
        .lb-h a{font-size:12px;font-weight:800;text-decoration:none;}
        .lb-h .plays{font-size:11px;color:var(--muted);font-weight:500;white-space:nowrap;}
        .lb-cols{display:grid;gap:8px;padding:0 12px 7px;font-family:${SANS};font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}
        .lb-row{display:grid;gap:8px;align-items:center;padding:8px 12px;margin-bottom:5px;border-radius:10px;background:var(--surface);border:1px solid var(--surface);}
        .lb-row.top{background:rgba(232,180,58,0.08);border-color:rgba(232,180,58,0.22);}
        .lb-row.you{background:rgba(232,180,58,0.16);border:1px solid rgba(232,180,58,0.55);}
        .lb-r{text-align:right;}
        .lb-rk{font-family:${SANS};font-weight:800;font-size:15px;color:var(--muted);font-variant-numeric:tabular-nums;}
        .lb-rk.gold{color:${GOLD_B};}
        .lb-nm{min-width:0;font-family:${SANS};font-size:14px;font-weight:500;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .lb-nm a{color:inherit;text-decoration:none;border-bottom:1px dotted rgba(147,167,204,0.5);}
        .lb-nm .you{color:${GOLD};font-weight:700;}
        .lb-num{font-family:${SANS};font-size:12.5px;font-weight:600;text-align:right;color:var(--muted);font-variant-numeric:tabular-nums;}
        .lb-pt{font-family:${SANS};font-size:13.5px;font-weight:800;text-align:right;color:${GOLD_B};font-variant-numeric:tabular-nums;}
        .lb-pt small{font-size:9.5px;font-weight:600;color:var(--muted);}
        .lb-more{width:100%;margin-top:4px;padding:8px 12px;border-radius:10px;cursor:pointer;font-family:${SANS};font-size:12px;font-weight:800;color:${GOLD_B};background:transparent;border:1.5px solid rgba(232,180,58,0.4);}
        .lb-sep{margin-top:7px;padding-top:8px;border-top:1px dashed var(--surface-alt);}
        .lb-note{font-size:10.5px;color:var(--muted);margin:9px 2px 0;line-height:1.5;}
        .lb-empty{font-family:${SANS};font-style:italic;font-size:14px;color:var(--muted);padding:4px 2px;}
        .lb-g5{grid-template-columns:34px 1fr 48px 52px 54px;}
        .lb-g3{grid-template-columns:34px 1fr 62px;}
        @media(max-width:440px){.lb-g5{grid-template-columns:30px 1fr 44px 50px;}.lb-time{display:none;}}

        /* your-day extras: rival line + next-game CTA */
        .dl-rival{display:flex;align-items:center;gap:9px;background:${BG};border-left:3px solid ${GOLD};border-radius:0 9px 9px 0;padding:8px 11px;font-size:12.5px;font-weight:500;color:${MUTED};}
        .dl-rival b{color:${INK};font-weight:700;}
        .dl-rival .av{width:22px;height:22px;border-radius:50%;background:${GOLD};color:var(--accent);display:inline-flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:800;flex:0 0 auto;}
        .dl-cta{display:block;text-align:center;background:${GOLD};color:#10203f;font-weight:800;font-size:13px;border-radius:10px;padding:11px 14px;text-decoration:none;}
        .dl-cta:hover{filter:brightness(1.05);}
        .dl-cta.done{background:rgba(232,180,58,0.16);color:#8a6d1f;cursor:default;}
        .dl-cattiles{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:6px;}
        .dl-cattile{display:inline-flex;align-items:center;gap:9px;text-decoration:none;background:var(--white);border:1px solid ${LINE};border-radius:11px;padding:9px 13px;transition:border-color .15s,box-shadow .15s;}
        .dl-cattile:hover{border-color:#c9d3e5;box-shadow:0 4px 14px rgba(14,29,64,0.07);}
        .dl-cattile .dot{width:9px;height:9px;border-radius:3px;flex:0 0 auto;}
        .dl-cattile .lbl{font-size:13.5px;font-weight:800;letter-spacing:-.2px;color:${INK};}
        .dl-cattile .ct{font-family:${MONO};font-size:10px;color:#9aa3b5;}
        .dl-cattile .jmp{color:#c2c8d2;font-size:12px;}

        /* live activity ticker */
        .dl-ticker{overflow:hidden;background:var(--white);border:1px solid ${LINE};border-left:4px solid ${GOLD};border-radius:10px;padding:7px 0;margin-top:16px;}
        .dl-tickrow{display:flex;gap:34px;white-space:nowrap;width:max-content;animation:dlTick 30s linear infinite;font-size:12.5px;font-weight:500;color:${MUTED};padding-left:18px;align-items:center;}
        .dl-tickrow b{color:${INK};font-weight:700;}
        .dl-tickrow .sw{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:7px;}
        @keyframes dlTick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @media (prefers-reduced-motion: reduce){.dl-tickrow{animation:none;}}

        /* gauntlet meter */
        .dl-gaunt{background:var(--white);border:1px solid ${LINE};border-radius:16px;padding:15px 18px;margin-top:14px;}
        .dl-gaunt-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:10px;}
        .dl-gaunt-h h2{margin:0;font-size:16px;font-weight:800;letter-spacing:-.3px;color:${INK};}
        .dl-gaunt-h .tease{font-size:11.5px;font-weight:800;color:var(--ink);background:${NAVY};border-radius:999px;padding:4px 12px;}
        .dl-segs{display:flex;gap:3px;margin-bottom:9px;}
        .dl-seg{flex:1 1 auto;height:13px;border-radius:3px;background:#eef1f7;}
        .dl-seg.on{background:${GOLD};}
        .dl-gaunt-l{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-family:${MONO};font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;font-weight:500;color:${FADED};}

        /* card chase line */
        .dl-chase{margin-top:10px;}
        .dl-chase-t{font-size:12px;font-weight:600;color:${MUTED};}
        .dl-chase-t b{color:${INK};}
        .dl-bar{height:7px;border-radius:4px;background:#eef1f7;margin-top:5px;overflow:hidden;}
        .dl-bar div{height:100%;border-radius:4px;transition:width .3s;}
      `}</style>

      <div className="dl-wrap">
        <div className="dl-top">
          <div className="dl-top-l">
            <div className="dl-nav" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <a href="/">Puzzles &amp; Quizzes</a>
              <a href="/lists">Top 10 Lists</a>
            </div>
            <h1 className="dl-h1">Daily Puzzles</h1>
            <p className="dl-sub">
              {activeGames.length} original puzzles, a fresh one each and every day. Play today, chase the leaderboard,
              or replay any past drop. Archive runs never touch your streak.
            </p>
          </div>

          <div className="dl-day" role="group" aria-label="Your day">
            <div className="dl-day-top">
              <div className="dl-day-idrow">
                <span className="dl-day-kick">Your day</span>
                {myName ? <span className="dl-day-name">{myName}</span> : null}
              </div>
              <div className="dl-streak"><b>{ready ? streak : '—'}</b><span>day streak</span></div>
            </div>
            <div className="dl-day-stats">
              <div className="dl-rk">
                <div className="n">{me ? <>#{me.rank}{combined.overallField ? <span className="ofn"> of {combined.overallField}</span> : null}</> : '—'}</div>
                <div className="l">Today&rsquo;s rank{me ? <> <span className="of">· {fmtPts(me.total)}/{combined.maxTotal} pts</span></> : ''}</div>
              </div>
              <div className="dv" />
              <div className="dl-mini">
                <div className="n">{ready ? doneToday.length : '—'}</div>
                <div className="l">Aced today</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dl-stp">
          <div className="dl-stp-l">
            <h2>Still to play today</h2>
            <div className="dl-segs" aria-hidden="true">
              {activeGames.map((g, i) => (
                <span key={g.key} className={`dl-seg${i < playedToday.length ? ' on' : ''}`} />
              ))}
            </div>
            <div className="dl-stp-count">{ready ? `${playedToday.length}/${activeGames.length} played` : '…'}</div>
          </div>
          <div className="dl-stp-r">
            {ready && stillToPlay.length === 0 ? (
              <div className="dl-alldone"><b>&#9733; All caught up.</b> You&rsquo;ve played every puzzle today. The archives below are always open.</div>
            ) : (
              <div className="dl-rail">
                {(ready ? [...stillToPlay].sort((a, b) => (isResumeToday(b) ? 1 : 0) - (isResumeToday(a) ? 1 : 0)) : activeGames).map((g) => {
                  const resume = ready && isResumeToday(g);
                  return (
                  <a key={g.key} className="dl-railcard" href={g.path} aria-label={`${resume ? 'Resume' : 'Play'} ${g.name} today`}>
                    <GameArt g={g} size={36} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px', color: INK, lineHeight: 1.1 }}>{g.name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: MONO, fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase', color: resume ? '#b9791a' : FADED, marginTop: 2 }}>
                        {resume ? (
                          <><svg viewBox="0 0 12 12" width="10" height="10" fill="none" style={{ flex: 'none' }} aria-hidden="true"><circle cx="6" cy="6" r="4" stroke="#e0b866" strokeWidth="1.8" /><path d="M6 2 A4 4 0 0 1 6 10" stroke="#d98a1f" strokeWidth="1.8" strokeLinecap="round" /></svg>Resume →</>
                        ) : 'Play today →'}
                      </span>
                    </span>
                  </a>
                );})}
              </div>
            )}
          </div>
        </div>

        <div className="dl-sec-h" style={{ marginBottom: 10 }}>
          <h2>All daily puzzles</h2>
        </div>
        <div className="dl-cattiles">
          {groups.map((grp) => (
            <a key={grp.key} className="dl-cattile" href={`#cat-${grp.key}`}>
              <span className="dot" style={{ background: grp.games[0].accent }} />
              <span className="lbl">{grp.label}</span>
              <span className="ct">{grp.games.length}</span>
              <span className="jmp" aria-hidden="true">&#8595;</span>
            </a>
          ))}
        </div>
        {groups.map((grp) => (
          <div key={grp.key} id={`cat-${grp.key}`} style={{ scrollMarginTop: 14 }}>
            <div className="dl-glabel">
              <span className="k">{grp.label}</span>
              <span className="line" />
              <span className="ct">{grp.games.length} puzzle{grp.games.length === 1 ? '' : 's'}</span>
            </div>
            <div className="dl-cards">
              {grp.games.map((g) => (
                <GameCard
                  key={g.key}
                  g={g}
                  ready={ready}
                  played={played}
                  progress={progress}
                  board={boardsByKey[g.key]}
                  myKey={myKey}
                  allTime={allTimeByKey[g.key]}
                  today={today}
                  streak={gameStreaks[g.key] || 0}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Today's combined leaderboard, at the foot of the page: top 3 up front,
            expand to flip through every game's board (compact, light). */}
        <div className="dl-sec-h" style={{ marginTop: 40 }}>
          <h2>Today&rsquo;s combined leaderboard</h2>
          <span>best 10 · 150 max</span>
        </div>
        <DailyCombinedLeaderboard light compact allTimeToggle />

        <p style={{ marginTop: 34, fontSize: 12.5, fontWeight: 500, color: FADED }}>
          Played &amp; aced marks are saved on this device (and follow your account when signed in). Leaderboards
          refresh through the day. <a href="/" style={{ color: INK, fontWeight: 700, textDecoration: 'underline' }}>Back to all quizzes →</a>
        </p>
      </div>
    </div>
  );
}

// game art tile with a monogram fallback if the PNG is missing
function GameArt({ g, size = 52 }) {
  const [err, setErr] = useState(0);
  return (
    <div className="dl-art" style={{ width: size, height: size, background: tint(g.accent, 0.10) }}>
      {err > 1
        ? <span style={{ fontWeight: 800, color: g.accent, fontSize: Math.round(size * 0.42) }}>{g.name[0]}</span>
        : <img src={err ? `/games/btn-${g.key}.png` : `/games/tile/${g.key}.png`} alt="" aria-hidden="true" onError={() => setErr((e) => e + 1)} />}
    </div>
  );
}

// ---------------------------------------------------------------- one game card
function GameCard({ g, ready, played, progress, board, myKey, allTime, today, streak = 0 }) {
  // One expand for the row: Standings AND Archive open together, side by side on
  // a wide screen (each is too tall to be useful full-width), stacked below 900px.
  const [open, setOpen] = useState(false);

  const total = g.puzzles.length;
  const playedCount = g.puzzles.reduce((n, p) => n + (played.has(`${g.key}:${p.num}`) ? 1 : 0), 0);
  const pct = total ? Math.round((playedCount / total) * 100) : 0;
  const todayN = g.puzzles[0] ? g.puzzles[0].num : null;
  const resumeToday = todayN != null && progress && progress.has(`${g.key}:${todayN}`) && !played.has(`${g.key}:${todayN}`);
  const leader = board && board.board && board.board[0];
  const myRow = myKey && board && board.board ? board.board.find((r) => r.userKey === myKey) : null;
  const todayQuiz = g.puzzles[0] && g.puzzles[0].quizId;
  const field = board ? (board.field || (board.board ? board.board.length : 0)) : 0;
  const atRank = allTime ? allTime.rank : null;
  const atField = allTime ? allTime.field : null;
  const atLeader = allTime ? allTime.leader : null;

  return (
    <section className={`dl-row${open ? ' open' : ''}`}>
      {/* The whole row is a click target that expands to Standings + Archive.
          Play/Resume and the game name stay real links (stopPropagation). */}
      <div className="dl-rmain" role="button" tabIndex={0} aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}>
        <div className="dl-rid">
          <GameArt g={g} size={44} />
          <div className="dl-ridtext">
            <a className="dl-cname" href={g.path} onClick={(e) => e.stopPropagation()}>{g.name}</a>
            {streak >= 2 ? (
              <span className="dl-gstreak inl" title={`${streak}-day streak`} aria-label={`${streak}-day streak`}>
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke="#b9791a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {streak}
              </span>
            ) : null}
            <div className="dl-ctag">{g.tag}</div>
          </div>
          <div className="dl-playwrap">
            <a className="dl-btn dl-play dl-rid-play" href={g.path} style={{ background: g.accent }} onClick={(e) => e.stopPropagation()}>{resumeToday ? 'Resume →' : 'Play →'}</a>
            {streak >= 2 ? (
              <span className="dl-gstreak mob" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke="#b9791a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {streak}
              </span>
            ) : null}
          </div>
        </div>

        {/* rank today + who leads today */}
        <div className="dl-rstat">
          <div className="dl-rlbl">Rank Today</div>
          {ready && myRow ? (
            <div className="dl-rrk">#{myRow.rank}<span className="of"> of {field}</span></div>
          ) : resumeToday ? (
            <div className="dl-rrk sub" style={{ color: '#b9791a' }}>Resume today</div>
          ) : (
            <div className="dl-rrk sub">Play to rank</div>
          )}
          {leader ? <div className="dl-rled"><span className="dl-crown" aria-hidden="true">♛</span> {leader.username}</div> : <div className="dl-rled dim">no scores yet</div>}
        </div>

        {/* mobile-only expand chevron, sits between the two rank sections */}
        <span className="dl-rexpand" aria-hidden="true">&#9662;</span>

        {/* rank all-time + who leads all-time */}
        <div className="dl-rstat">
          <div className="dl-rlbl">Rank All-Time</div>
          {atRank ? (
            <div className="dl-rrk">#{atRank}<span className="of"> of {atField}</span></div>
          ) : (
            <div className="dl-rrk sub">{allTime === undefined ? '…' : '—'}</div>
          )}
          {atLeader ? <div className="dl-rled"><span className="dl-crown" aria-hidden="true">♛</span> {atLeader}</div> : (allTime === undefined ? <div className="dl-rled dim">&nbsp;</div> : <div className="dl-rled dim">no scores yet</div>)}
        </div>

        {/* Standings — sits between the ranks and Archive; the whole row expands */}
        <span className={`dl-stbtn${open ? ' on' : ''}`}>Standings <span className="cx" aria-hidden="true">&#9662;</span></span>

        {/* archive completion (the row toggles the expansion) */}
        <div className={`dl-rarch${open ? ' on' : ''}`}>
          <div className="dl-rlbl">Archive complete <span className="cx" aria-hidden="true">&#9662;</span></div>
          <div className="dl-rprog"><div style={{ width: `${pct}%`, background: g.accent }} /></div>
          <div className="dl-rprogt"><b>{playedCount}</b> of {total} &middot; {pct}%</div>
        </div>
      </div>

      {/* Expanded: the game-page Standings board and the Archive calendar, side by
          side on widescreen (stacked below 900px / on mobile). */}
      {open && (
        <div className="dl-exp two">
          <div className="dl-exp-col">
            <DailyCombinedLeaderboard todayKey={g.key} quizId={todayQuiz} light allTimeToggle embedded dense />
          </div>
          <div className="dl-exp-col">
            <ArchiveCalendar g={g} played={played} today={today} />
          </div>
        </div>
      )}
    </section>
  );
}

// Month calendar of a game's past drops — matches the game-page / end-card
// calendar (played = green, today ringed), built from g.puzzles (each carries a
// `live` ISO date). Replaces the old date-chip archive.
function ArchiveCalendar({ g, played, today }) {
  const todayISO = today || (g.puzzles[0] && g.puzzles[0].live) || '';
  const byISO = useMemo(() => {
    const m = new Map();
    for (const p of g.puzzles) if (p.live) m.set(p.live, p);
    return m;
  }, [g]);
  const isos = g.puzzles.map((p) => p.live).filter(Boolean).sort();
  const earliest = isos.length ? isos[0].slice(0, 7) : todayISO.slice(0, 7);
  const latest = todayISO.slice(0, 7);
  const [month, setMonth] = useState(latest); // 'YYYY-MM'
  const firstNum = g.puzzles[0] ? g.puzzles[0].num : null;
  const total = g.puzzles.length;
  const playedCount = g.puzzles.reduce((n, p) => n + (played.has(`${g.key}:${p.num}`) ? 1 : 0), 0);
  const pct = total ? Math.round((playedCount / total) * 100) : 0;
  const addMonths = (ym, delta) => {
    let [yy, mm] = ym.split('-').map(Number);
    mm += delta;
    while (mm < 1) { mm += 12; yy -= 1; }
    while (mm > 12) { mm -= 12; yy += 1; }
    return `${yy}-${String(mm).padStart(2, '0')}`;
  };
  const canPrev = month > earliest;
  const canNext = month < latest;

  // Render one month's grid. `faded` = a non-interactive preview that fills the
  // vertical space next to the (taller) leaderboard; its label shows so it reads
  // as the month the back arrow rolls up to.
  const monthGrid = (ym, faded) => {
    const [yy, mm] = ym.split('-').map(Number);
    const fw = new Date(Date.UTC(yy, mm - 1, 1)).getUTCDay();
    const dim = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
    const cells = [];
    for (let k = 0; k < fw; k++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(d);
    return (
      <div className={`dl-cal-month${faded ? ' faded' : ''}`} key={ym + (faded ? 'f' : '')} aria-hidden={faded || undefined}>
        {faded ? <div className="dl-cal-mo2">{MONTH_NAMES[(mm - 1) % 12]} {yy}</div> : null}
        <div className="dl-cal-grid">
          {CAL_WD.map((w, i) => <div className={`dl-cal-wd${i === 0 ? ' sun' : ''}`} key={`wd${i}`}>{w}</div>)}
          {cells.map((d, i) => {
            if (d == null) return <div className="dl-cal-cell empty" key={`e${i}`} />;
            const iso = `${ym}-${String(d).padStart(2, '0')}`;
            const p = byISO.get(iso);
            const isToday = iso === todayISO;
            const sun = new Date(Date.UTC(yy, mm - 1, d)).getUTCDay() === 0 ? ' sun' : '';
            if (!p) return <div className={`dl-cal-cell none${isToday ? ' today' : ''}${sun}`} key={iso}>{d}</div>;
            const isPlayed = played.has(`${g.key}:${p.num}`);
            const cls = `dl-cal-cell ${isPlayed ? 'played' : 'unplayed'}${isToday ? ' today' : ''}${sun}`;
            if (faded) return <div className={cls} key={iso}>{d}</div>;
            const href = p.num === firstNum ? g.path : `${g.path}?p=${p.num}`;
            return <a className={cls} href={href} key={iso} title={isPlayed ? 'Played' : 'Play this drop'}>{d}</a>;
          })}
        </div>
      </div>
    );
  };

  const [cy, cm] = month.split('-').map(Number);
  const prevYM = addMonths(month, -1);

  return (
    <div className="dl-cal">
      <div className="dl-cal-header">
        <span className="t">{g.name} Archive</span>
        <span className="s">{playedCount} of {total} &middot; {pct}% complete</span>
      </div>
      <div className="dl-cal-hd">
        <span className="dl-cal-mo">{MONTH_NAMES[(cm - 1) % 12]} {cy}</span>
        <div className="dl-cal-nav">
          <button type="button" onClick={() => setMonth((v) => addMonths(v, -1))} disabled={!canPrev} aria-label="Previous month">‹</button>
          <button type="button" onClick={() => setMonth((v) => addMonths(v, 1))} disabled={!canNext} aria-label="Next month">›</button>
        </div>
      </div>
      {monthGrid(month, false)}
      {/* faded prior months fill the space beside the (taller) leaderboard,
          clipped to its height so no new dead space is created. */}
      <div className="dl-cal-fadewrap">
        {monthGrid(prevYM, true)}
        {monthGrid(addMonths(prevYM, -1), true)}
      </div>
      <div className="dl-cal-key">
        <span><span className="sw" style={{ background: '#e8f5ec', border: '1px solid #bfe3ca' }} />Played</span>
        <span><span className="sw" style={{ background: T.white, border: `1px solid ${LINE}` }} />Unplayed</span>
        <span><span className="sw" style={{ background: T.white, boxShadow: `0 0 0 2px ${BLUE}` }} />Today</span>
        <span><span className="sw" style={{ background: '#fdf3e0', border: '1px solid rgba(180,83,9,0.3)' }} />Sunday (bigger)</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- archive (chips)
function ArchivePanel({ g, ready, played, completed }) {
  const [showAll, setShowAll] = useState(false);
  const PREVIEW = 14;
  const list = showAll ? g.puzzles : g.puzzles.slice(0, PREVIEW);
  const hidden = g.puzzles.length - list.length;
  const firstNum = g.puzzles[0] ? g.puzzles[0].num : null;
  return (
    <div className="dl-archpanel">
      <div className="lab">Every past drop — replay any day, your streak is safe</div>
      <div className="dl-chips">
        {list.map((p) => {
          const first = p.num === firstNum;
          const isPlayed = played.has(`${g.key}:${p.num}`);
          const isDone = completed.has(`${g.key}:${p.num}`);
          const href = first ? g.path : `${g.path}?p=${p.num}`;
          return (
            <a
              key={p.num}
              href={href}
              className="dl-chip"
              style={first ? { background: g.bg, borderColor: g.accent, color: g.accent, fontWeight: 800 } : isPlayed ? { borderColor: g.accent } : undefined}
              aria-label={`${g.name} — ${shortDate(p.dateLabel)}${first ? ' (today)' : ''}${p.sunday ? ', Sunday edition' : ''}${isDone ? ', aced' : isPlayed ? ', played' : ''}`}
            >
              {first && <span className="dl-today-tag" style={{ background: g.accent }}>Today</span>}
              <span>{shortDate(p.dateLabel)}</span>
              {ready && isDone && <span className="dl-tick" style={{ color: GOLD }} aria-hidden="true">&#9733;</span>}
              {ready && !isDone && isPlayed && <span className="dl-tick" style={{ color: GREEN }} aria-hidden="true">&#10003;</span>}
            </a>
          );
        })}
        {hidden > 0 && <button type="button" className="dl-chip dl-morechip" onClick={() => setShowAll(true)}>+{hidden} more</button>}
        {showAll && g.puzzles.length > PREVIEW && <button type="button" className="dl-chip dl-morechip" onClick={() => setShowAll(false)}>Show less</button>}
      </div>
    </div>
  );
}

// ------------------------------------------------------- expandable leaderboard
function StandingsPanel({ g, navy, tab, setTab, board, overall, me, myKey, maxTotal, gameMax, gameCount, ready }) {
  const [full, setFull] = useState(false);
  useEffect(() => { setFull(false); }, [tab]);

  return (
    <div className="lb">
      <div className="lb-tabs">
        <button type="button" className={`lb-tab${tab === 'game' ? ' on' : ''}`} onClick={() => setTab('game')}>This game</button>
        <button type="button" className={`lb-tab${tab === 'overall' ? ' on' : ''}`} onClick={() => setTab('overall')}>Overall</button>
      </div>
      {!ready ? (
        <p className="lb-empty">Loading today&rsquo;s leaderboard…</p>
      ) : tab === 'game' ? (
        <GameBoard g={g} navy={navy} board={board} myKey={myKey} gameMax={gameMax} full={full} setFull={setFull} />
      ) : (
        <OverallBoard overall={overall} me={me} myKey={myKey} maxTotal={maxTotal} gameCount={gameCount} full={full} setFull={setFull} />
      )}
    </div>
  );
}

function PlayerName({ row, mine }) {
  const label = mine ? 'you' : row.username;
  return (
    <span className="lb-nm">
      {mine ? <span className="you">you</span>
        : row.userKey ? <a href={`/quizzes/hub?player=${encodeURIComponent(row.userKey)}`}>{label}</a>
        : label}
    </span>
  );
}

function GameBoard({ g, navy, board, myKey, gameMax, full, setFull }) {
  const rows = (board && board.board) || [];
  const plays = board ? (board.plays != null ? board.plays : board.field) || 0 : 0;
  const head = (
    <div className="lb-h">
      <a href={(board && board.href) || g.path} style={{ color: navy }}>{g.name} today →</a>
      <span className="plays">{plays.toLocaleString()} {plays === 1 ? 'play' : 'plays'} today</span>
    </div>
  );
  if (!rows.length) {
    return (
      <div>{head}
        <p className="lb-empty">{plays > 0 ? 'No ranked scores here yet — sign in and play to claim the top spot.' : 'No one has posted a score here yet. Be the first.'}</p>
      </div>
    );
  }
  const meRow = myKey ? rows.find((r) => r.userKey === myKey) : null;
  const top = rows.slice(0, 3);
  const meInTop = meRow && top.some((r) => r.userKey === myKey);
  const shown = full ? rows : top;
  const rowEl = (r) => {
    const mine = myKey && r.userKey === myKey;
    return (
      <div key={r.userKey || r.rank} className={`lb-row lb-g5${mine ? ' you' : r.rank <= 3 ? ' top' : ''}`}>
        <span className={`lb-rk${r.rank <= 3 ? ' gold' : ''}`}>{r.rank}</span>
        <PlayerName row={r} mine={mine} />
        <span className="lb-num">{dailyUnit(g.key) ? r.score : <>{r.score}/{r.total}</>}</span>
        <span className="lb-num lb-time">{fmtTime(r.timeElapsed)}</span>
        <span className="lb-pt">{fmtPts(r.points)}<small>/{gameMax}</small></span>
      </div>
    );
  };
  return (
    <div>
      {head}
      <div className="lb-cols lb-g5"><span>#</span><span>Player</span><span className="lb-r">Score</span><span className="lb-r lb-time">Time</span><span className="lb-r">Pts</span></div>
      {shown.map(rowEl)}
      {!full && meRow && !meInTop && <div className="lb-sep">{rowEl(meRow)}</div>}
      {!full && rows.length > 3 && <button type="button" className="lb-more" onClick={() => setFull(true)}>Show full standings ({rows.length})</button>}
      {full && rows.length > 3 && <button type="button" className="lb-more" onClick={() => setFull(false)}>Show less</button>}
      <p className="lb-note">15 per game by where you finish: 15 for 1st, 12 for 2nd, 10 for 3rd, then 8, 7, 6, 5, 4, 3 and 2 down to 10th, and 1 for finishing outside the top 10.</p>
    </div>
  );
}

function OverallBoard({ overall, me, myKey, maxTotal, gameCount, full, setFull }) {
  const rows = overall || [];
  if (!rows.length) {
    return <p className="lb-empty">No one has posted a daily score yet. Be the first.</p>;
  }
  const meInRows = myKey && rows.some((r) => r.userKey === myKey);
  const top = rows.slice(0, 3);
  const meInTop = me && top.some((r) => r.userKey === myKey);
  const shown = full ? rows : top;
  const rowEl = (r) => {
    const mine = myKey && r.userKey === myKey;
    return (
      <div key={r.userKey || r.rank} className={`lb-row lb-g3${mine ? ' you' : r.rank <= 3 ? ' top' : ''}`}>
        <span className={`lb-rk${r.rank <= 3 ? ' gold' : ''}`}>{r.rank}</span>
        <PlayerName row={r} mine={mine} />
        <span className="lb-pt">{fmtPts(r.total)}<small>/{maxTotal}</small></span>
      </div>
    );
  };
  return (
    <div>
      <div className="lb-h">
        <span style={{ fontSize: 12, fontWeight: 800, color: T.gold }}>Overall standings</span>
        <span className="plays">{gameCount ? `best ${Math.min(10, gameCount)} of ${gameCount}` : ''} · {maxTotal} max</span>
      </div>
      <div className="lb-cols lb-g3"><span>#</span><span>Player</span><span className="lb-r">Total</span></div>
      {shown.map(rowEl)}
      {!full && me && !meInTop && !meInRows && <div className="lb-sep">{rowEl(me)}</div>}
      {!full && rows.length > 3 && <button type="button" className="lb-more" onClick={() => setFull(true)}>Show full standings ({rows.length})</button>}
      {full && rows.length > 3 && <button type="button" className="lb-more" onClick={() => setFull(false)}>Show less</button>}
      <p className="lb-note">Your daily total is your best {gameCount ? Math.min(10, gameCount) : 10} of today&rsquo;s puzzles.</p>
    </div>
  );
}
