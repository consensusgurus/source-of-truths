#!/usr/bin/env python3
# The composed ending (owner, 2026-09-26): one-screen flood with rival, field,
# set and streak; rival + priced set block + 15s hand-off on the card; group
# board first when a member played. Anchored edits over origin extracts.
import sys, os, re
W = sys.argv[1]  # work dir holding the FETCH_HEAD extracts

def load(n): return open(os.path.join(W, n), encoding='utf-8').read()
def save(n, s): open(os.path.join(W, n), 'w', encoding='utf-8').write(s)
def rep(s, old, new, n=1):
    c = s.count(old)
    if c != n: raise SystemExit(f'anchor x{c} (wanted {n}): {old[:90]!r}')
    return s.replace(old, new)

# ─────────────────────────────── 1. board route: timeDist ───────────────────
r = load('board-route.js')
r = rep(r, "  return { plays, best, topTime: Number.isFinite(topTime) ? topTime : null, leaderboard, leaderboardMobile, leaderboardFirst, leaderboardAll, leaderboards, scoreDist };",
"""  // THE FIELD'S CLOCK (2026-09-26): twelve bins over the times recorded AT the
  // best score, all attempts, so the finish can draw the day's distribution
  // with the finisher's own bar lit. Linear from the fastest run to the 95th
  // percentile; anything slower lands in the last bin. Null under five runs.
  const timeDist = timeDistOf(rows, best);
  return { plays, best, topTime: Number.isFinite(topTime) ? topTime : null, leaderboard, leaderboardMobile, leaderboardFirst, leaderboardAll, leaderboards, scoreDist, timeDist };""")
r = rep(r, "// GET /api/quiz/board?quizId=...                       -> { plays, avg, leaderboard }",
"""const DIST_BINS = 12;
function timeDistOf(rows, best) {
  if (best == null) return null;
  const ts = rows.filter((r) => r.score === best && r.time_elapsed != null && !r.abandoned)
    .map((r) => Number(r.time_elapsed)).filter((t) => Number.isFinite(t) && t >= 0).sort((a, b) => a - b);
  if (ts.length < 5) return null;
  const lo = ts[0];
  const hi = Math.max(lo + 1, ts[Math.min(ts.length - 1, Math.floor(ts.length * 0.95))]);
  const bins = new Array(DIST_BINS).fill(0);
  for (const t of ts) bins[Math.min(DIST_BINS - 1, Math.floor(((t - lo) / (hi - lo)) * DIST_BINS))] += 1;
  return { n: ts.length, lo, hi, bins };
}

// GET /api/quiz/board?quizId=...                       -> { plays, avg, leaderboard }""")
save('board-route.js', r)

# ─────────────────────────────── 2. useDailyBoard: pass the distributions ──
u = load('useDailyBoard.js')
u = rep(u, """            plays: d.plays || 0,
            rows,""", """            plays: d.plays || 0,
            // The day's shape, for the ending's field figure (2026-09-26).
            best: d.best != null ? d.best : null,
            scoreDist: d.scoreDist || null,
            timeDist: d.timeDist || null,
            rows,""")
save('useDailyBoard.js', u)

# ─────────────────────────────── 3. lib/game-medians.js ─────────────────────
v = load('verify-daily-five.mjs')
m = re.search(r"const MED = \{\n(.*?)\n\};\n", v, re.S)
if not m: raise SystemExit('MED block not found')
body = m.group(1)
lib = f"""// TYPICAL CLOCKS, one per daily: the median timeElapsed of every top-10
// leaderboard row pooled across the days the game has been live (seconds).
// This is the snapshot scripts/verify-daily-five.mjs was built on (measured
// 2026-08-17, later games thinner), moved here 2026-09-26 so the finish card
// can price the rest of a set ("Anon, about 18 min"). It is a MEASUREMENT with
// a date on it, not a fact about the games: expect drift, and re-measure by
// pooling timeElapsed off /api/quiz/daily-combined?date=<M-D-YY> over a couple
// of weeks. The verifier imports this map, so there is one copy.
export const GAME_MEDIANS = {{
{body}
}};

export function typicalSeconds(key) {{
  const s = GAME_MEDIANS[key];
  return Number.isFinite(s) ? s : null;
}}

// "about a minute" / "~4 min" / "~18 min". Null when nothing was measured.
export function typicalLabel(key) {{
  const s = typicalSeconds(key);
  if (s == null) return null;
  if (s < 90) return 'about a minute';
  return `~${{Math.round(s / 60)}} min`;
}}
"""
save('game-medians.js', lib)
v = v.replace(m.group(0), "import { GAME_MEDIANS as MED } from '../lib/game-medians.js';\n")
save('verify-daily-five.mjs', v)

# ─────────────────────────────── 4. FinishGroupLine: onData ─────────────────
f = load('FinishGroupLine.jsx')
f = rep(f, "export default function FinishGroupLine({ gameKey, gameName = null, missLabel = null }) {\n  const [data, setData] = useState(null);",
"""export default function FinishGroupLine({ gameKey, gameName = null, missLabel = null, onData = null }) {
  const [data, setData] = useState(null);
  // THE FINISH READS THIS TOO (2026-09-26): StageFinish picks the rival off the
  // group's board on this game and leads with the group when a member has
  // played it, so the one read is handed up rather than made twice.
  useEffect(() => { if (typeof onData === 'function') onData(data); }, [data]);   // eslint-disable-line react-hooks/exhaustive-deps""")
save('FinishGroupLine.jsx', f)

# ─────────────────────────────── 5. StageFinish ─────────────────────────────
s = load('StageFinish.jsx')

# 5a. imports
s = rep(s, "import { gameStats, mmss } from '@/lib/daily-row-stats';",
"import { gameStats, mmss } from '@/lib/daily-row-stats';\nimport { typicalLabel } from '@/lib/game-medians';")

# 5b. constants
s = rep(s, "const FLOOD_SETTLE = 4500;  // a beat on the finished set, to read it whole",
"""// ONE SCREEN (owner, 2026-09-26). The sequence used to flip through its
// figures one at a time and the screen ran nine seconds; now every figure
// lands INTO the same screen and stays, so the settle is a read of the whole
// set rather than a wait, and it is shorter for it.
const FLOOD_SETTLE = 2200;
const FLOOD_RIVAL = 800;    // the pair, read as two clocks
const FLOOD_FIELD = 900;    // the bars draw in
const FLOOD_STREAK = 900;   // the strip stamps across, tomorrow last
// THE HAND-OFF COUNTS DOWN (owner, 2026-09-26): fifteen seconds after the
// curtain lands, Up next opens itself. Any tap elsewhere on the card stops it.
const HANDOFF_S = 15;""")

# 5c. CurtainFlood signature + figs
s = rep(s, "function CurtainFlood({ title, detail, iq, board, gameRank, streak, ready = null, bandRef, onDone, quick = false, boardWhen = null, catRun = null, vs = null }) {",
"function CurtainFlood({ title, detail, iq, board, gameRank, streak, ready = null, bandRef, onDone, quick = false, boardWhen = null, catRun = null, vs = null, rival = null, dist = null, gameName = null }) {")

s = rep(s, """    {
      k: 'streak',
      has: !!streak,
      value: streak,
      label: 'day streak',
    },""", """    // THE RIVAL (2026-09-26): the player one place above on the board, or the
    // group member above when a member has played this game. Two clocks.
    {
      k: 'rival', rival: true,
      has: !!rival,
      value: null,
      label: '',
    },
    // THE FIELD (2026-09-26): the day's distribution with this run's bar lit.
    {
      k: 'field', field: true,
      has: !!(dist && dist.bins && dist.bins.length),
      value: null,
      label: '',
    },""")

s = rep(s, """    {
      k: 'vs', vs: true,
      has: !!(vs && (vs.better || vs.pb)),
      value: null,
      label: '',
    },
    {
      k: 'cat', rack: true,""", """    {
      k: 'cat', rack: true,""")
s = rep(s, """      label: catRun ? `of ${catRun.games.length} ${catRun.cat} today` : '',
    },
  ]), [iq, board, gameRank, streak, quick, boardWhen, catRun, vs]);""",
"""      label: catRun ? `of ${catRun.games.length} ${catRun.cat} today` : '',
    },
    // THE STREAK AS A STRIP (2026-09-26): seven pips and a hollow eighth for
    // tomorrow. It was a bare number; the hollow shape is the argument.
    {
      k: 'streak', strip: true,
      has: !!streak,
      value: streak,
      label: 'day streak',
    },
  ]), [iq, board, gameRank, streak, quick, boardWhen, catRun, rival, dist]);""")

s = rep(s, "      at(next.count ? FLOOD_COUNT + 180 : next.rack ? (next.wide ? FLOOD_RACK_WIDE : FLOOD_RACK) : next.vs ? FLOOD_VS : FLOOD_STAMP, () => setShown((s) => s + 1));",
"      at(next.count ? FLOOD_COUNT + 180 : next.rack ? (next.wide ? FLOOD_RACK_WIDE : FLOOD_RACK) : next.rival ? FLOOD_RIVAL : next.field ? FLOOD_FIELD : next.strip ? FLOOD_STREAK : FLOOD_STAMP, () => setShown((s) => s + 1));")

# 5d. flood render
old_render = s[s.index('      <div className="stf-fl-in">\n        <div className="stf-fl-v">{title}</div>'):s.index('      {/* It goes on its own; this is only so a player who does not want to wait')]
new_render = """      <div className="stf-fl-in">
        <div className="stf-fl-v">{title}</div>
        {(detail || (vs && (vs.better || vs.pb))) ? (
          <div className="stf-fl-d">{detail}{vs && (vs.better || vs.pb) ? `${detail ? ' \\u00b7 ' : ''}${vsLine(vs)}` : ''}</div>
        ) : null}
        {/* ONE SCREEN, FIXED SLOTS. Each figure mounts when the queue reaches
            it and stays; the stamp is a CSS animation on mount. The three
            numbers share a row, the rival and the field take a line each, and
            the set rack and the streak strip sit side by side at the foot. */}
        <div className="stf-fl-figs">
          {(() => {
            const idx = new Map(figs.map((f, i) => [f.k, i]));
            const vis = (k) => idx.has(k) && idx.get(k) < shown && figs[idx.get(k)].has;
            const num = (k) => {
              if (!vis(k)) return null;
              const f = figs[idx.get(k)];
              return (
                <div className={'stf-fl-fig' + (f.lead ? ' lead' : '')} key={f.k}>
                  <b>{f.count ? <>+<FloodCount to={f.value} ms={FLOOD_COUNT} /></> : f.value}</b>
                  <i>{f.label}</i>
                </div>
              );
            };
            const row = ['iq', 'pos', 'all'].map(num).filter(Boolean);
            return (
              <>
                {row.length ? <div className="stf-fl-row">{row}</div> : null}
                {vis('rival') ? <div className="stf-fl-fig stf-fl-block stf-fl-rival"><RivalFlood r={rival} /></div> : null}
                {vis('field') ? <div className="stf-fl-fig stf-fl-block stf-fl-field"><FieldBars dist={dist} /></div> : null}
                {(vis('cat') || vis('streak')) ? (
                  <div className="stf-fl-pair">
                    {vis('cat') ? <div className="stf-fl-fig stf-fl-rack"><CategoryRack run={catRun} ring={!!(vs && vs.pb)} /></div> : null}
                    {vis('streak') ? <div className="stf-fl-fig stf-fl-strip"><StreakStrip n={streak} game={gameName} /></div> : null}
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>
      </div>
"""
s = s.replace(old_render, new_render)

# 5e. the three small flood pieces, beside VsBox
s = rep(s, "function VsBox({ vs }) {", """function RivalFlood({ r }) {
  if (!r) return null;
  return (
    <>
      <span className="stf-fl-lab">{r.eyebrow}</span>
      <span className="stf-rvf" aria-hidden="true">
        <span className="them"><small>{r.them.name} &middot; {r.them.sub}</small><b>{r.them.run}</b></span>
        <span className="x">vs</span>
        <span className="you"><small>You &middot; {r.you.sub}</small><b>{r.you.run}</b></span>
      </span>
      <i>{r.line}</i>
    </>
  );
}
function FieldBars({ dist }) {
  if (!dist || !dist.bins) return null;
  const max = Math.max(1, ...dist.bins);
  return (
    <>
      <span className="stf-fl-lab">{dist.eyebrow}</span>
      <span className="stf-bars" aria-hidden="true">
        {dist.bins.map((n, i) => (
          <s key={i} className={i === dist.mine ? 'me' : undefined} style={{ height: `${Math.max(4, Math.round((n / max) * 100))}%`, animationDelay: `${i * 28}ms` }} />
        ))}
      </span>
      <i>{dist.line}</i>
    </>
  );
}
const STRIP_PIPS = 7;
function StreakStrip({ n, game = null }) {
  const lit = Math.min(STRIP_PIPS, Math.max(0, Number(n) || 0));
  return (
    <>
      <span className="stf-fl-lab">{game ? `${game} streak` : 'Streak'} &middot; {n} {Number(n) === 1 ? 'day' : 'days'}</span>
      <span className="stf-dstrip" aria-hidden="true">
        {Array.from({ length: STRIP_PIPS }, (_, i) => (
          <s key={i} className={i < STRIP_PIPS - lit ? 'off' : 'on'} style={{ animationDelay: `${i * 70}ms` }} />
        ))}
        <s className="next" style={{ animationDelay: `${STRIP_PIPS * 70 + 160}ms` }} />
      </span>
      <i>Tomorrow makes {Number(n) + 1}</i>
    </>
  );
}
function VsBox({ vs }) {""")

# 5f. component: state + derived data. Anchor: after the vs effect.
s = rep(s, """  const [vs, setVs] = useState(null);
  useEffect(() => {
    if (!me) return;
    try { setVs(compareRuns(me.key, Array.isArray(archive) ? archive : [], me.cat === 'Arcade')); } catch (e) { setVs(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);""", """  const [vs, setVs] = useState(null);
  useEffect(() => {
    if (!me) return;
    try { setVs(compareRuns(me.key, Array.isArray(archive) ? archive : [], me.cat === 'Arcade')); } catch (e) { setVs(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // AN ARCHIVE REPLAY IS NOT A FINISH. It gets no rival stamp and no
  // countdown; the flood has the same rule under FLOOD_FRESH.
  const [archived, setArchived] = useState(true);
  useEffect(() => { setArchived(/[?&]p=/.test(window.location.search)); }, []);

  // THE GROUP'S BOARD ON THIS GAME (2026-09-26), handed up by FinishGroupLine.
  // When another member has played it, the group is the story: the rival is
  // the member above, and the group board takes the board slot.
  const [grpData, setGrpData] = useState(null);
  const grpGame = useMemo(() => {
    if (!grpData || !me || !Array.isArray(grpData.groups)) return null;
    const groups = grpData.groups.filter((g) => g && !g.failed && g.rank);
    const lead = groups[0];
    if (!lead) return null;
    const all = (lead.boards && lead.boards[me.key]) || [];
    const mine = all.find((r) => r.userKey === grpData.userKey) || null;
    if (!mine || all.length < 2) return null;
    return { lead, all, mine };
  }, [grpData, me]);

  // THE RIVAL. One clock against one clock; a board of forty names is a crowd
  // and one name is a target. Public: the player one place above on the board
  // the card prints (or, for #1, the player they are holding off). Group: the
  // member above on this game's group board. Registered players only: a guest
  // has no place on the board to be one above.
  const keyFig = (r) => (r && r.score != null && r.total != null && Number(r.score) >= Number(r.total) && r.timeElapsed != null
    ? mmss(r.timeElapsed) : (r && r.score != null ? `${r.score}${r.total != null ? `/${r.total}` : ''}` : '\\u2014'));
  const gapLine = (a, b, aName) => {
    // a is the better row, b the worse. Both solved and clocked: seconds. Else points.
    if (a.score != null && b.score != null && Number(a.score) === Number(b.score) && a.timeElapsed != null && b.timeElapsed != null) {
      const d = Math.abs(Math.round(Number(b.timeElapsed) - Number(a.timeElapsed)));
      return d ? `${d}s` : 'level on the clock';
    }
    if (a.score != null && b.score != null) {
      const d = Math.abs(Number(a.score) - Number(b.score));
      return `${d} ${d === 1 ? 'point' : 'points'}`;
    }
    return null;
  };
  const ord = (n) => { const j = n % 10, k = n % 100; return n + (j === 1 && k !== 11 ? 'st' : j === 2 && k !== 12 ? 'nd' : j === 3 && k !== 13 ? 'rd' : 'th'); };
  const [rivalCount, setRivalCount] = useState(0);
  const rival = useMemo(() => {
    if (!me) return null;
    if (grpGame) {
      const { lead, all, mine } = grpGame;
      const above = mine.rank > 1 ? all.find((r) => r.rank === mine.rank - 1) : null;
      const below = mine.rank === 1 ? all.find((r) => r.rank === 2) : null;
      const other = above || below;
      if (!other) return null;
      const gap = above ? gapLine(above, mine, above.username) : gapLine(mine, below, null);
      const unplayed = Math.max(0, (lead.members || 0) - all.length);
      const line = above
        ? `${gap ? `${gap} behind ${above.username} today` : `Behind ${above.username} today`}${unplayed ? `. ${unplayed} ${unplayed === 1 ? 'member has' : 'members have'} not played it yet.` : '.'}`
        : `${gap ? `Holding off ${below.username} by ${gap}` : `Ahead of ${below.username}`}${unplayed ? `. ${unplayed} ${unplayed === 1 ? 'member has' : 'members have'} not played it yet.` : '.'}`;
      return {
        group: true,
        eyebrow: `Your group \\u00b7 ${lead.name}`,
        sub: mine.rank === 1 ? `You lead on ${me.name}` : `You\\u2019re ${ord(mine.rank)} of ${all.length} on ${me.name}`,
        them: { name: other.username, run: keyFig(other), sub: `${ord(other.rank)} in group` },
        you: { run: keyFig(mine), sub: `${ord(mine.rank)} in group` },
        line,
      };
    }
    const rows = board && Array.isArray(board.rows) ? board.rows : [];
    const myRank = board && board.myRank != null ? board.myRank : null;
    const mine = board && board.myRow ? board.myRow : null;
    if (myRank == null || !mine || !rows.length) return null;
    const rankOfRow = (r, i) => (r.rank != null ? r.rank : i + 1);
    const above = myRank > 1 ? rows.find((r, i) => rankOfRow(r, i) === myRank - 1) : null;
    const below = myRank === 1 ? rows.find((r, i) => rankOfRow(r, i) === 2) : null;
    const other = above || below;
    if (!other || !other.username) return null;
    const gap = above ? gapLine(above, mine) : gapLine(mine, below);
    let line = above ? (gap ? `${gap} back today.` : 'One place back today.') : (gap ? `Holding off ${below.username} by ${gap}.` : `Ahead of ${below.username}.`);
    // What your own best would have placed, when today was not it.
    if (above && vs && vs.mode === 'time' && !vs.pb && vs.best != null && mine.score != null) {
      const n = 1 + rows.filter((r) => r.score != null && Number(r.score) >= Number(mine.score) && r.timeElapsed != null && Number(r.timeElapsed) < vs.best).length;
      if (n < myRank && n <= rows.length) line += ` Your fastest ${me.name} is ${mmss(vs.best)}, which would have taken #${n}.`;
    }
    const times = rivalCount >= 2 ? `, ${ord(rivalCount)} time in two weeks` : '';
    return {
      group: false,
      eyebrow: above ? 'Your rival today' : 'Holding them off',
      sub: `${other.username}${above ? times : ''}`,
      them: { name: other.username, run: keyFig(other), sub: `#${rankOfRow(other, rows.indexOf(other))} of ${board.field || rows.length}` },
      you: { run: keyFig(mine), sub: `#${myRank} of ${board.field || rows.length}` },
      line,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, grpGame, board, vs, rivalCount]);

  // A STANDING RIVAL is the same name above you again and again. Stamped per
  // game per day in localStorage; counted over the last fourteen days. Never
  // stamped on an archive replay, which is not a finish.
  useEffect(() => {
    if (!me || archived || !rival || rival.group || !rival.them || !rival.them.name || rival.eyebrow !== 'Your rival today') return;
    try {
      const key = `sot_rival_${me.key}`;
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const cut = new Date(Date.now() - 14 * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const map = readLS(key) || {};
      const name = rival.them.name;
      const days = new Set((map[name] || []).filter((d) => d >= cut));
      days.add(today);
      map[name] = [...days].sort();
      for (const k of Object.keys(map)) { map[k] = (map[k] || []).filter((d) => d >= cut); if (!map[k].length) delete map[k]; }
      localStorage.setItem(key, JSON.stringify(map));
      setRivalCount(days.size);
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, archived, rival && rival.them && rival.them.name]);

  // THE FIELD. Twelve bars, worst on the left and best on the right, this run's
  // bar lit. The clock when the day is a race (most runs solved it and this one
  // did), the score otherwise. Drawn only when the field is real: five runs.
  const dist = useMemo(() => {
    if (!board || board.myRank == null || !board.field || board.field < 5 || !board.myRow) return null;
    const pct = Math.max(0, Math.round(((board.field - board.myRank) / board.field) * 100));
    const mine = board.myRow;
    const td = board.timeDist;
    const solvedShare = td && board.plays ? td.n / board.plays : 0;
    if (td && td.n >= 5 && solvedShare >= 0.6 && board.best != null && Number(mine.score) === Number(board.best) && mine.timeElapsed != null) {
      const bins = td.bins.slice().reverse();   // slowest left, fastest right
      const raw = Math.min(td.bins.length - 1, Math.max(0, Math.floor(((Number(mine.timeElapsed) - td.lo) / Math.max(1, td.hi - td.lo)) * td.bins.length)));
      return { kind: 'time', bins, mine: td.bins.length - 1 - raw, eyebrow: `Today\\u2019s field \\u00b7 ${td.n} solved runs`, line: `Faster than ${pct}% of the board` };
    }
    const sd = board.scoreDist;
    if (!sd || mine.score == null) return null;
    const keys = Object.keys(sd).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (keys.length < 2) return null;
    const bins = keys.map((k) => sd[k]);
    const mi = keys.indexOf(Number(mine.score));
    if (mi < 0) return null;
    return { kind: 'score', bins, mine: mi, eyebrow: `Today\\u2019s field \\u00b7 ${board.plays || board.field} runs`, line: `Better than ${pct}% of the board` };
  }, [board]);""")

# 5g. flood call: pass rival/dist/gameName
s = rep(s, """        <CurtainFlood title={title} detail={detail} iq={iq} board={board}
          gameRank={gameRank} streak={streak} ready={ready} bandRef={bandRef}
          boardWhen={boardWhen} catRun={catRun} vs={vs}
          onDone={() => setFlood(false)} />""", """        <CurtainFlood title={title} detail={detail} iq={iq} board={board}
          gameRank={gameRank} streak={streak} ready={ready} bandRef={bandRef}
          boardWhen={boardWhen} catRun={catRun} vs={vs} rival={rival} dist={dist}
          gameName={me ? me.name : null}
          onDone={() => { setFlood(false); setFloodDone(true); }} />""")

# 5h. flood state: add floodDone + hand-off countdown. Anchor on the flood effect close.
s = rep(s, """    if (!forced && since < FLOOD_FRESH) return;   // the page opened on a finished board
    setFlood(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);""", """    if (!forced && since < FLOOD_FRESH) return;   // the page opened on a finished board
    setFlood(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The curtain has landed (or never ran). The hand-off counts from here.
  const [floodDone, setFloodDone] = useState(false);
  const [freshFinish, setFreshFinish] = useState(false);
  useEffect(() => {
    const since = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 1e9;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const forced = /[?&]flood=1(&|$)/.test(window.location.search);
    // Fresh means a game that JUST ended, the same test the flood makes. A
    // reduced-motion reader gets no flood, so the countdown starts at once.
    setFreshFinish(forced || since >= FLOOD_FRESH);
    if (reduced || (!forced && since < FLOOD_FRESH)) setFloodDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);""")

# 5i. hand-off countdown state, placed after setNext memo
s = rep(s, """  const forward = opts.find((o) => o.tone === 'similar') || null;""", """  const forward = opts.find((o) => o.tone === 'similar') || null;

  // THE HAND-OFF COUNTDOWN (owner, 2026-09-26). Up next opens itself HANDOFF_S
  // seconds after the curtain lands, on a game that just ended. `left` is
  // seconds remaining, null when there is no countdown (archive replay, retry
  // card, nothing to hand to, or the reader stopped it). Any click on the card
  // that is not the hand-off itself stops it, as does Escape or hiding the tab:
  // a reader who is doing something else has answered the question.
  const [left, setLeft] = useState(null);
  const [handoffOff, setHandoffOff] = useState(false);
  const handoffTarget = setNext ? { href: setNext.g.href || `/${setNext.g.key}`, onClick: null } : (forward || null);
  const handoffOn = !!(freshFinish && !archived && !isRetry && !handoffOff && handoffTarget && (handoffTarget.href || handoffTarget.onClick));
  useEffect(() => {
    if (!handoffOn || !floodDone) { setLeft(null); return undefined; }
    let l = HANDOFF_S;
    setLeft(l);
    const t = setInterval(() => {
      l -= 0.1;
      if (l <= 0) {
        clearInterval(t);
        setLeft(0);
        const tgt = handoffTarget;
        if (tgt && tgt.href) window.location.assign(tgt.href);
        else if (tgt && typeof tgt.onClick === 'function') tgt.onClick({ preventDefault() {} });
        return;
      }
      setLeft(l);
    }, 100);
    const stop = () => setHandoffOff(true);
    const onKey = (e) => { if (e.key === 'Escape') stop(); };
    const onVis = () => { if (document.visibilityState === 'hidden') stop(); };
    // A real scroll is a reader reading the board, which answers the question.
    const y0 = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - y0) > 160) stop(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoffOn, floodDone]);
  const stopHandoff = (e) => {
    if (left == null) return;
    if (e && e.target && e.target.closest && e.target.closest('.stf-fwd.auto')) return;
    setHandoffOff(true);
  };""")


# 5j. the card body: reorder. Replace from the slower-case block through the setNext/forward block.
start = s.index("        {/* THE SLOWER CASE (owner, 2026-09-07): stated plainly, in the card's")
end = s.index("        {/* MORE OF THE SAME, directly under the one recommendation. Up next is")
old_body = s[start:end]
new_body = """        {/* THE SLOWER CASE (owner, 2026-09-07): stated plainly, in the card's
            own ink, with the figure to beat. Never a colour: red on a finished
            game reads as failure. */}
        {vs && !vs.better && !vs.pb && !vs.tie ? (
          <div className="stf-vslow">
            <b>{fmtRun(vs, vs.today)}</b> today &middot; your best on {name || 'this one'} is <b>{vs.mode === 'time' ? mmss(vs.best) : `${vs.best.score}/${vs.best.total}`}</b>{vs.bestDate ? `, set ${vs.bestDate}` : ''}. Beat it tomorrow.
          </div>
        ) : null}
        {/* THE RIVAL LEADS (owner, 2026-09-26). One name, two clocks, the gap.
            The group member above when a member has played this game, else
            the public player one place up. See `rival` above. */}
        {rival ? (
          <section className="stf-rival">
            <div className="stf-eb">{rival.eyebrow}<em> &middot; {rival.sub}</em></div>
            <div className="stf-vs">
              <div className="stf-vside"><span className="nm">{rival.them.name}</span><b>{rival.them.run}</b><small>{rival.them.sub}</small></div>
              <div className="stf-vsx2">vs</div>
              <div className="stf-vside you"><span className="nm">You</span><b>{rival.you.run}</b><small>{rival.you.sub}</small></div>
            </div>
            <div className="stf-rline">{rival.line}</div>
          </section>
        ) : null}
        {/* THE SET, PRICED (owner, 2026-09-26). The pips the band already
            carries, and under them every game in the set with a clock on it:
            your own for the ones you played, the typical top-10 clock for the
            ones you have not. A reader deciding whether to keep going is
            weighing minutes, not pips. */}
        {pushSet && me ? (
          <section className="stf-setblk">
            <div className="stf-eb">
              {pushSet.name} <em>&middot; {pushSet.total - pushSet.open.length} of {pushSet.total} today</em>
              {catRun ? <> &middot; {catRun.cat} {catRun.n} of {catRun.games.length}</> : null}
            </div>
            <div className="stf-pips">
              {pushSet.keys.map((k) => <i key={k} className={k === me.key ? 'now' : pushSet.open.includes(k) ? '' : 'on'} />)}
            </div>
            <div className="stf-est">
              {pushSet.keys.map((k) => {
                const g = LIVE().find((x) => x.key === k);
                if (!g) return null;
                const isMe = k === me.key;
                const done = isMe || !pushSet.open.includes(k);
                const next = !done && pushSet.open[0] === k;
                const t = isMe && vs && vs.mode === 'time' ? mmss(vs.today) : (isMe ? 'today' : done ? 'played' : (typicalLabel(k) || 'open'));
                return (
                  <a key={k} className={'stf-estc' + (done ? ' done' : '') + (next ? ' next' : '')} href={done ? undefined : (g.href || `/${g.key}`)}>
                    <b>{g.name}</b><small>{t}</small>
                  </a>
                );
              })}
            </div>
          </section>
        ) : null}
        {/* THE HAND-FORWARD, ABOVE THE BOARD NOW (owner, 2026-09-26), with the
            countdown ring when the game just ended. For LoftFinish's own
            reason it is early: a finisher should not pass two exits before
            reaching the one that carries on. */}
        {setNext ? (
          <a className={'stf-fwd stf-fwdset' + (left != null ? ' auto' : '')} href={setNext.g.href || `/${setNext.g.key}`}>
            {left != null ? <span className="stf-ring" style={{ '--p': `${((HANDOFF_S - left) / HANDOFF_S) * 100}%` }}><b>{Math.ceil(left)}</b></span> : null}
            <div>
              <div className="stf-eb">{setNext.set.handoff ? <>Up next &middot; {catRun.group.name} done, next set</> : <>Up next &middot; finish the set</>}</div>
              <div className="stf-fwdn">{setNext.g.name}</div>
              <div className="stf-fwdt">
                {left != null ? <span className="stf-auto">{left > 0 ? `Starts in ${Math.ceil(left)}s \\u00b7 tap or scroll to stay` : 'Opening'}</span> : null}
                <em className="stf-setchip">{setNext.set.name} &middot; {setNext.set.handoff ? `${setNext.set.open.length} of ${setNext.set.total} open` : `${setNext.set.open.length} left`}</em>
                {rival && rival.group && grpGame && grpGame.lead.boards && grpGame.lead.boards[setNext.g.key] ? (() => {
                  const b = grpGame.lead.boards[setNext.g.key];
                  const top = b && b[0];
                  return top && top.username ? <em className="stf-setchip ok">{top.username} did it in {keyFig(top)}</em> : null;
                })() : null}
              </div>
            </div>
            <span className="stf-go">Play</span>
          </a>
        ) : forward ? (
          <a className={'stf-fwd' + (left != null ? ' auto' : '')} href={forward.href} onClick={forward.onClick}>
            {left != null ? <span className="stf-ring" style={{ '--p': `${((HANDOFF_S - left) / HANDOFF_S) * 100}%` }}><b>{Math.ceil(left)}</b></span> : null}
            <div>
              <div className="stf-eb">Up next</div>
              <div className="stf-fwdn">{fwdName}</div>
              <div className="stf-fwdt">
                {left != null ? <span className="stf-auto">{left > 0 ? `Starts in ${Math.ceil(left)}s \\u00b7 tap or scroll to stay` : 'Opening'}</span> : null}
                {fwdTag ? fwdTag : null}
              </div>
            </div>
            <span className="stf-go">Play</span>
          </a>
        ) : null}
        {/* THE BOARD(S). When a group member has played this game the group's
            board leads (FinishGroupLine draws it) and the public board folds to
            its eyebrow, one tap from opening; otherwise the public board leads
            and the group card follows, as it did. */}
        {(() => {
          // KEYED, so the group card keeps its node (and its one read) when it
          // moves above the board; a remount would refetch, land null, and
          // flip the order straight back.
          const grpLine = (me && !boardLabel)
            ? <FinishGroupLine key="grp" gameKey={me.key} gameName={me.name} missLabel={missLabel} onData={setGrpData} />
            : null;
          const pubBoard = rows.length ? (
            <section key="pub">
              <div className="stf-eb">{boardLabel || <>Today&rsquo;s board</>}{myRank != null ? <em> &middot; you are #{myRank}{field ? ` of ${field}` : ''}</em> : null}{standings.length ? <em className="stf-dx"> &middot; {standings.join(' \\u00b7 ')}</em> : null}
                {grpGame && !pubOpen ? <> &middot; <button type="button" className="stf-seeall" onClick={() => setPubOpen(true)}>see all</button></> : null}
              </div>
              {(!grpGame || pubOpen) ? (
              <table className="stf-tbl">
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.username || i} className={isMine(r) ? 'me' : undefined}>
                      <td className="stf-pos">{r.rank != null ? `#${r.rank}` : `#${i + 1}`}</td>
                      <td className="stf-who">{r.username || 'Guest'}</td>
                      <td className="stf-st">{gameStats(r, missLabel) || '\\u2014'}</td>
                    </tr>
                  ))}
                  {!rows.some(isMine) && board && board.myRow ? (
                    <>
                      {myRank != null && myRank > rows.length + 1 ? (
                        <tr className="gap"><td colSpan={3}>&middot;&middot;&middot;</td></tr>
                      ) : null}
                      <tr className="me">
                        <td className="stf-pos">{myRank != null ? `#${myRank}` : ''}</td>
                        <td className="stf-who">{board.myRow.username || 'You'}</td>
                        <td className="stf-st">{gameStats(board.myRow, missLabel) || '\\u2014'}</td>
                      </tr>
                    </>
                  ) : null}
                </tbody>
              </table>
              ) : null}
            </section>
          ) : null;
          return grpGame ? [grpLine, pubBoard] : [pubBoard, grpLine];
        })()}
        {/* CLAIM YOUR RANK: full width, guests only. The figure is the guest's
            would-be placement on the registered board; without one (the row
            has not landed yet) the tile still makes the offer, just without
            a number. */}
        {guest && !claimed && !isRetry ? (
          <section className="stf-claim">
            <div className="stf-eb">Claim your rank</div>
            <div className="stf-clhd">
              <div>
                <div className="stf-fwdn">
                  {board && board.guest ? (
                    <>You would be <em>#{board.guest.placement}</em>{board.guest.field ? ` of ${board.guest.field}` : ''} on {boardLabel ? <>the {String(boardLabel).toLowerCase()}</> : <>today&rsquo;s board</>}</>
                  ) : 'Your finish is not on the board yet'}
                </div>
                <div className="stf-fwdt">Ranks and points count for registered names only. A display name is enough, no password, and the games you already finished come with you.</div>
              </div>
              {!claimOpen ? (
                <button type="button" className="stf-go stf-clgo" onClick={() => setClaimOpen(true)}>Claim my rank</button>
              ) : null}
            </div>
            {claimOpen ? (
              <div className="stf-clform">
                <JoinLeaderboardForm heading="Claim your rank" hideIcon
                  onJoined={() => { setClaimed(true); if (onClaimed) onClaimed(); }} />
              </div>
            ) : null}
          </section>
        ) : null}
        {claimed ? (
          <div className="stf-claimed">You&rsquo;re on the board. Every finish counts under your name now.</div>
        ) : null}
"""
s = s.replace(old_body, new_body)
# pubOpen state
s = rep(s, "  const [claimOpen, setClaimOpen] = useState(false);\n  const [claimed, setClaimed] = useState(false);",
"  const [claimOpen, setClaimOpen] = useState(false);\n  const [claimed, setClaimed] = useState(false);\n  const [pubOpen, setPubOpen] = useState(false);   // the folded public board, when the group leads")

# the wrap catches taps to stop the countdown
s = rep(s, "      <div className=\"stf-wrap\">\n        {/* THE SLOWER CASE", "      <div className=\"stf-wrap\" onClickCapture={stopHandoff}>\n        {/* THE SLOWER CASE")

# 5k. CSS: replace flood layout block and add card pieces
s = rep(s, """.stf-fl-in{max-width:900px;text-align:center;opacity:0;
  transform:translateY(12px) scale(.985);""", """.stf-fl-in{width:100%;max-width:720px;text-align:left;opacity:0;
  transform:translateY(12px) scale(.985);""")
s = rep(s, """.stf-fl-v{font-size:clamp(38px,8.4vw,104px);font-weight:800;letter-spacing:-.045em;
  line-height:.98;text-wrap:balance;}
.stf-fl-d{margin-top:14px;font-size:clamp(13px,2vw,19px);font-weight:700;opacity:.78;}
.stf-fl-figs{margin-top:26px;display:flex;flex-wrap:wrap;justify-content:center;
  align-items:flex-end;gap:16px 42px;}""", """.stf-fl-v{font-size:clamp(34px,6.4vw,72px);font-weight:800;letter-spacing:-.04em;
  line-height:.98;text-wrap:balance;}
.stf-fl-d{margin-top:10px;font-size:clamp(13px,1.8vw,17px);font-weight:700;opacity:.78;}
/* ONE SCREEN (2026-09-26): a column of landings. The three numbers share a
   row; the rival and the field take a line each under a hairline; the set
   rack and the streak strip pair up at the foot. */
.stf-fl-figs{margin-top:18px;display:flex;flex-direction:column;align-items:stretch;gap:0;}
.stf-fl-row{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:12px;align-items:end;}
.stf-fl-block{margin-top:16px;padding-top:14px;border-top:1px solid rgba(0,0,0,.16);}
[data-stage-theme="light"] .stf-fl-block,[data-stage-theme="light"] .stf-fl-pair{border-top-color:rgba(255,255,255,.32);}
.stf-fl-pair{margin-top:16px;padding-top:14px;border-top:1px solid rgba(0,0,0,.16);
  display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;}
.stf-fl-lab{display:block;font-family:${MONO};font-size:clamp(9px,1.1vw,10.5px);letter-spacing:.14em;
  text-transform:uppercase;opacity:.8;margin-bottom:8px;font-weight:700;}
.stf-fl-figs .stf-fl-block i,.stf-fl-figs .stf-fl-pair i{display:block;font-style:normal;font-size:clamp(12px,1.5vw,14px);font-weight:700;
  opacity:.85;margin-top:8px;letter-spacing:0;text-transform:none;font-family:${SANS};}
.stf-rvf{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:end;}
.stf-fl-figs .stf-rvf small{display:block;font-family:${MONO};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.8;margin-bottom:5px;}
.stf-fl-figs .stf-rvf b{display:block;font-size:clamp(26px,4.4vw,40px);font-weight:800;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums;}
.stf-rvf .you{text-align:right;}
.stf-rvf .x{font-family:${MONO};font-size:12px;opacity:.7;padding-bottom:6px;}
.stf-bars{display:flex;align-items:flex-end;gap:3px;height:clamp(40px,7vh,64px);}
.stf-bars s{text-decoration:none;flex:1;display:block;background:rgba(0,0,0,.2);border-radius:2px 2px 0 0;
  transform-origin:bottom;animation:stf-bar 480ms cubic-bezier(.2,.8,.2,1) both;}
[data-stage-theme="light"] .stf-bars s{background:rgba(255,255,255,.4);}
.stf-bars s.me{background:currentColor;}
@keyframes stf-bar{ from{transform:scaleY(0)} to{transform:none} }
.stf-dstrip{display:flex;gap:4px;}
.stf-dstrip s{text-decoration:none;flex:1;display:block;height:12px;border-radius:6px;background:currentColor;opacity:.9;
  animation:stf-rackhit 300ms cubic-bezier(.2,.9,.3,1.3) both;}
.stf-dstrip s.off{background:none;border:1.5px solid currentColor;opacity:.35;}
.stf-dstrip s.next{background:none;border:1.5px dashed currentColor;opacity:1;}""")
# the rack in its pair slot: left-aligned, compact
s = rep(s, ".stf-rk-pips{display:flex;justify-content:center;flex-wrap:wrap;gap:5px;max-width:340px;margin:0 auto 14px;}",
".stf-rk-pips{display:flex;justify-content:flex-start;flex-wrap:wrap;gap:5px;max-width:340px;margin:0 0 10px;}")
s = rep(s, """.stf-fl-fig.lead b{font-size:clamp(46px,10vw,118px);line-height:.9;letter-spacing:-.05em;}
.stf-fl-fig.lead i{font-size:clamp(10px,1.4vw,13px);letter-spacing:.18em;
  opacity:.78;margin-top:12px;}""", """.stf-fl-fig.lead b{font-size:clamp(40px,7vw,80px);line-height:.9;letter-spacing:-.05em;}
.stf-fl-fig.lead i{font-size:clamp(10px,1.4vw,13px);letter-spacing:.18em;
  opacity:.78;margin-top:10px;}
.stf-fl-fig.lead{flex-basis:auto;}
.stf-fl-rack{flex-basis:auto;margin-top:0;}
.stf-fl-rack .stf-rack b{display:block;font-size:clamp(22px,3.6vw,34px);font-weight:800;letter-spacing:-.03em;line-height:1;}
.stf-fl-rack .stf-rack i{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.75;margin-top:6px;}
/* A SHORT SCREEN (an iPhone SE, a landscape phone) steps everything down so
   all six landings still fit above the tap hint. */
@media (max-height:720px){
  .stf-flood{padding-top:clamp(28px,6vh,60px);}
  .stf-fl-v{font-size:clamp(30px,5.6vw,60px);}
  .stf-fl-figs{margin-top:12px;}
  .stf-fl-fig.lead b{font-size:clamp(34px,6vw,64px);}
  .stf-fl-fig b{font-size:clamp(22px,3.6vw,36px);}
  .stf-fl-block,.stf-fl-pair{margin-top:11px;padding-top:10px;}
  .stf-fl-lab{margin-bottom:5px;}
  .stf-bars{height:clamp(32px,6vh,48px);}
  .stf-fl-block i,.stf-fl-pair i{margin-top:5px;font-size:12px;}
  .stf-fl-figs .stf-rvf b{font-size:clamp(22px,3.8vw,32px);}
  .stf-fl-skip{bottom:10px;}
}""")
s = rep(s, ".stf-flood{position:fixed;inset:0;z-index:9000;cursor:pointer;\n  background:var(--stg-acc);color:var(--stg-onramp,#08222e);\n  display:flex;align-items:flex-start;justify-content:center;overflow:hidden;\n  padding:clamp(80px,18vh,200px) 24px 28px;",
".stf-flood{position:fixed;inset:0;z-index:9000;cursor:pointer;\n  background:var(--stg-acc);color:var(--stg-onramp,#08222e);\n  display:flex;align-items:flex-start;justify-content:center;overflow:hidden;\n  padding:clamp(40px,9vh,110px) 24px 28px;")
s = rep(s, """@media (max-width:640px){
  .stf-flood{padding:clamp(64px,14vh,140px) 18px 22px;}
  .stf-fl-d{margin-top:11px;}
  .stf-fl-figs{margin-top:20px;gap:12px 26px;}""", """@media (max-width:640px){
  .stf-flood{padding:clamp(34px,7vh,80px) 18px 22px;}
  .stf-fl-d{margin-top:8px;}
  .stf-fl-figs{margin-top:14px;}
  .stf-fl-row{gap:8px;}""")

# card CSS
s = rep(s, ".stf-vslow{font-size:13.5px;color:var(--stg-ink2);}", """/* THE RIVAL PAIR on the card (2026-09-26). */
.stf-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;}
.stf-vside{background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:9px;padding:10px 12px;min-width:0;}
.stf-vside .nm{display:block;font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.stf-vside b{display:block;font-family:${MONO};font-size:22px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums;color:var(--stg-ink);}
.stf-vside small{display:block;font-family:${MONO};font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);margin-top:3px;}
.stf-vside.you{border-color:var(--stg-acc);}
.stf-vside.you .nm{color:var(--stg-acc-ink,var(--stg-acc));}
.stf-vsx2{font-family:${MONO};font-size:11px;color:var(--stg-mute);}
.stf-rline{margin-top:8px;font-size:13px;color:var(--stg-ink2);line-height:1.45;}
/* THE SET, PRICED (2026-09-26). */
.stf-pips{display:flex;gap:5px;}
.stf-pips i{flex:1;height:8px;border-radius:4px;background:var(--stg-surf);border:1px solid var(--stg-line);}
.stf-pips i.on{background:var(--stg-acc);border-color:var(--stg-acc);}
.stf-pips i.now{background:var(--stg-gold,#e8b43a);border-color:var(--stg-gold,#e8b43a);}
.stf-est{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:6px;margin-top:10px;}
.stf-estc{display:block;text-decoration:none;color:var(--stg-ink);background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:8px;padding:8px 10px;min-width:0;}
.stf-estc b{display:block;font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.stf-estc small{display:block;font-family:${MONO};font-size:9.5px;letter-spacing:.06em;color:var(--stg-mute);margin-top:2px;}
.stf-estc.done{opacity:.5;}
.stf-estc.done b{text-decoration:line-through;}
.stf-estc.next{border-color:var(--stg-gold,#e8b43a);}
/* THE COUNTDOWN RING on the hand-off (2026-09-26). */
.stf-fwd.auto{border-left-color:var(--stg-gold,#e8b43a);}
.stf-ring{flex:none;width:50px;height:50px;border-radius:50%;display:grid;place-items:center;
  background:conic-gradient(var(--stg-gold,#e8b43a) var(--p,0%),var(--stg-line) 0);}
.stf-ring b{width:38px;height:38px;border-radius:50%;background:var(--stg-surf);display:grid;place-items:center;
  font-family:${MONO};font-size:13px;font-weight:700;color:var(--stg-ink);}
.stf-auto{display:block;color:var(--stg-ink2);margin-bottom:3px;}
.stf-seeall{font:inherit;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;
  background:none;border:0;padding:0;color:var(--stg-acc-ink,var(--stg-acc));cursor:pointer;font-weight:700;}
.stf-vslow{font-size:13.5px;color:var(--stg-ink2);}""")

save('StageFinish.jsx', s)
print('patched')
