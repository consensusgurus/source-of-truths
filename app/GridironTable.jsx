// The consensus ranking board, shared by /nflrankings and /collegefootballrankings.
//
// A SERVER component on purpose. The two sports live at their own URLs rather
// than behind a toggle, so nothing here needs client state, and the whole board
// ships as HTML: the ranking is in the source for search engines instead of
// being assembled by script after load.
//
// Layout rules live in CLAUDE-RANKINGS.md section 6. The load-bearing ones:
// the composite rating sits immediately beside the team name and ahead of every
// column; every column shows its own date; and an excluded source keeps its
// column, struck through, rather than silently disappearing. A source is
// excluded by the age gate OR, from 2026-09-14, by `excluded` on the source
// itself when its own content describes an earlier week than the board does.
//
// v2 (2026-09-01): columns are the three PILLARS (results, betting markets,
// analytics models) with each pillar's sources beside it. There are no media
// or poll columns because nothing of that kind is scored.
import Image from 'next/image';
import { computeComposite, MAX_AGE_DAYS, PILLAR_LABEL, PILLAR_ORDER, RAMP_WEEKS, pillarsFor } from '@/lib/gridiron';

// Pillar colours, used only on mobile, where the desktop column grouping is gone
// and a chip has to say which pillar it came from on its own. Descending the
// site's own blue ramp in weight order. No gold: the theme reserves that for medals.
const TIER_COLOR = {
  results: 'var(--t-results)',
  market: 'var(--t-market)',
  model: 'var(--t-model)',
};
const MEDAL = ['#e8b43a', '#aeb4bd', '#c88a55'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Sources report freshness in whatever form they publish it: an ISO date, or a
// phrase like "2026 preseason" when the source genuinely has no finer stamp.
// Render an ISO date as "Aug 17" and pass anything else through untouched,
// rather than inventing a precision the source never claimed.
function fmtDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? `${MON[+m[2] - 1]} ${+m[3]}` : (s || 'undated');
}
const signed = (v, d = 1) => (v > 0 ? '+' : '') + v.toFixed(d);

// Decimals for the composite. A rating in RUNS spans about a fifth of what one
// in POINTS does, so a single decimal prints "-0.0" for a third of a baseball
// board and reads as a bug. Chosen from the board's own RANGE rather than from
// the sport, so it stays right for whatever a future league is measured in.
const scoreDp = (rows) => {
  const v = rows.map((r) => r.score);
  return Math.max(...v) - Math.min(...v) < 5 ? 2 : 1;
};
// Teams the composite cannot separate share a rank and are marked, rather than
// being handed an alphabetical order the data never supported. Same idiom the
// source cells already use for a futures board where fifteen teams share a
// price. See the tie block in lib/gridiron.js.
const rankText = (r) => (r.tied ? `T${r.rank}` : r.rank);
// 1st / 2nd / 3rd / 11th / 21st. Used in prose, where "#1" reads as a label.
const ord = (n) => {
  const t = n % 100;
  const s = t >= 11 && t <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
  return `${n}${s}`;
};
const pct = (v) => (Math.abs(v * 100 - Math.round(v * 100)) < 0.05 ? (v * 100).toFixed(0) : (v * 100).toFixed(1));

export default function GridironTable({ data, fetchedAt, sport, eyebrow, boardTitle }) {
  const out = computeComposite(data, sport);
  const { ranked, columns, tierShare, depth, excluded, week, weeksPlayed } = out;
  const cols = [...columns].sort((a, b) => PILLAR_ORDER.indexOf(a.tier) - PILLAR_ORDER.indexOf(b.tier));
  // The results pillar names itself: 'Résumé' where margin and wins score,
  // 'vs Expected' where the pillar is the cover term alone (lib/gridiron.js).
  // Never hardcode either word here, or the prose and the column header drift.
  const resCol = columns.find((c) => c.id === 'results');
  const resShort = (resCol && resCol.short) || 'Results';
  const coverOnly = !!(resCol && resCol.coverOnly);
  // "Scoring" means CARRYING WEIGHT, not merely being fresh (§6). A source can
  // pass the age gate and still score nothing, which is exactly what the MLB
  // futures board does: it is shown because a source considered and rejected
  // teaches a reader something, and counting it here would say four sources
  // move a board that three of them move.
  const live = cols.filter((c) => c.kind === 'source' && c.ok && c.weight > 0);
  const nSrc = cols.filter((c) => c.kind === 'source').length;
  const gone = excluded;
  const maxGap = Math.max(...ranked.map((r) => Math.abs(r.gap || 0)), 1);
  const fullIn = RAMP_WEEKS[sport];
  const PILLARS = pillarsFor(sport);
  const rampNote = weeksPlayed < fullIn
    ? `Results carry ${pct(tierShare.results || 0)}% this week and reach ${pct(PILLARS.results)}% after week ${fullIn}.`
    : `Results carry their full ${pct(PILLARS.results)}%.`;
  // The unit the rating is in, and the league it is measured against.
  const MLB = sport === 'mlb';
  const unit = MLB ? 'runs' : 'points';
  const dp = scoreDp(ranked);
  const unitShort = MLB ? 'runs' : 'pts';
  const league = MLB ? 'MLB' : sport === 'nfl' ? 'NFL' : 'FBS';

  // Pillar header groups: one cell spanning each pillar's run of columns.
  const groups = [];
  cols.forEach((c, i) => {
    if (!groups.length || groups[groups.length - 1].tier !== c.tier) groups.push({ tier: c.tier, n: 1, at: i });
    else groups[groups.length - 1].n++;
  });
  const startsGroup = (i) => groups.some((g) => g.at === i && g.at !== 0);

  // Deviation shading scales with depth: 3 spots means much less on a 50-deep
  // board than on a 32-deep one, and much less again on a 138-deep one. Written
  // as a ratio rather than a ladder of magic numbers so the full FBS board did
  // not need a third branch; it reproduces the old 3/5 at 32 and 5/9 at 50.
  const hi = Math.max(3, Math.round(depth / 10));
  const lo = Math.max(5, Math.round(hi * 1.8));

  // How far the analytics models actually reach this week, computed from the
  // board rather than written down, per the rule that a callout must not be
  // able to go stale against its own data.
  const offBoard = ranked.filter((r) => r.shown.model === 'off board').length;
  const modelDepth = ranked.reduce((m, r) => (r.ranks.model != null ? Math.max(m, r.ranks.model) : m), 0);

  // ---- how much of the score has seen the most recent games ----
  // Every scoring input carries its own as-of date, and between weekly rebuilds
  // the games run ahead of all of them: a result lands on Thursday against a
  // market priced on Monday. That gap is real and worth stating, but it is also
  // temporary, so it is MEASURED off the board rather than written into the copy
  // and it disappears on its own the week the sources republish. Same rule as
  // the callouts under the table.
  const isoDate = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s : null);
  // An undated source ("2026 preseason") cannot raise the priced-through date;
  // claiming it could is how a preseason column would hide a stale week.
  const pricedThrough = cols
    .filter((c) => c.ok && c.weight > 0 && c.kind !== 'record')
    .map((c) => isoDate(c.asOf))
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || null;
  const sinceGames = pricedThrough
    ? (data.games || []).filter((g) => isoDate(g.d) && g.d > pricedThrough)
    : [];
  // The rows the gap is doing the most to. Deliberately ONE IN EACH DIRECTION
  // rather than the two largest: the two largest are often the same story told
  // twice, and a reader needs to see that the lag cuts both ways, holding a team
  // up as readily as it holds one down.
  const withRes = ranked
    .filter((r) => r.ranks.results != null)
    .map((r) => ({ team: r.team, res: r.ranks.results, at: r.rank, gap: Math.abs(r.ranks.results - r.rank) }));
  const worst = (dir) => withRes.filter(dir).sort((a, b) => b.gap - a.gap)[0] || null;
  const splits = [worst((s) => s.res < s.at), worst((s) => s.res > s.at)].filter(Boolean);
  const weightText = (c) => {
    if (c.kind === 'record') return 'shown';
    if (!c.ok) return c.kind === 'source' ? 'excluded' : 'not yet';
    return `${(c.weight * 100).toFixed(1)}%`;
  };
  const cellTitle = (c, r) => {
    if (c.kind === 'pillar' && r.pts[c.id] != null) return `${signed(r.pts[c.id])} points vs an average team`;
    if (c.id === 'ats' && r.pts.ats != null) return `${signed(r.pts.ats)} per game against the closing spread, luck-adjusted`;
    if (c.kind === 'source' && r.ranks[c.id] != null) return `scored as rank ${r.ranks[c.id]}`;
    return undefined;
  };

  return (
    <div className="gr">
      <style dangerouslySetInnerHTML={{ __html: `
.gr{font-family:'Manrope',system-ui,-apple-system,sans-serif;color:var(--stg-ink,#e9edf4);
/* THE THREE PILLARS ARE THREE RAMP STEPS, and this is the one place on the site
   where a surface with no category takes ramp colours (owner, 2026-09-04). The
   board's own accent is sky, and the pillars used to run down the blue ramp, so
   on the stage all four would have been the same colour. Mint / gold / violet
   are well separated in hue, each has a light twin, and nothing new is invented.
   Same bend the Crux categories got: the three pillars ARE the board's
   structure, so they have to be three tellable things. */
  --t-results:#6ee7b7;--t-results-ink:#6ee7b7;
  --t-market:#e8b43a;--t-market-ink:#e8b43a;
  --t-model:#c084fc;--t-model-ink:#c084fc;
/* The legend swatches are inline styles in the JSX, so they read these. */
  --sw-up:color-mix(in srgb,var(--stg-cool) 26%,var(--stg-raise));
  --sw-dn:color-mix(in srgb,var(--stg-warn) 29%,var(--stg-raise));
  --sw-hot:var(--stg-acc);}
/* Guarded by the boot stamp, like every other light-register rule on the site:
   through the frame before React resolves, the root div's attribute is a guess
   and <html> holds the answer. See app/layout.js. */
html:not([data-stage-boot='dark']) [data-stage-theme='light'] .gr{
  --t-results:#047857;--t-results-ink:#046c4e;
  --t-market:#e8b43a;--t-market-ink:#7c5104;
  --t-model:#6d28d9;--t-model-ink:#6d28d9;}
[data-tier="results"]{--t:var(--t-results);--t-ink:var(--t-results-ink);}
[data-tier="market"]{--t:var(--t-market);--t-ink:var(--t-market-ink);}
[data-tier="model"]{--t:var(--t-model);--t-ink:var(--t-model-ink);}
.gr-console{background:var(--stg-raise);border:1px solid var(--stg-line);border-radius:14px;overflow:hidden;}
.gr-chead{padding:14px 18px;background:var(--stg-panel);border-bottom:1px solid var(--stg-line);
  display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;}
.gr-eyebrow{font-family:'DM Mono',ui-monospace,monospace;font-size:9.5px;font-weight:500;
  letter-spacing:.15em;text-transform:uppercase;color:var(--stg-mute2);}
.gr-chead h2{margin:4px 0 0;font-size:17px;font-weight:800;letter-spacing:-.015em;color:var(--stg-ink);}
.gr-stamp{font-family:'DM Mono',ui-monospace,monospace;font-size:11px;color:var(--stg-mute);
  text-align:right;line-height:1.65;}
.gr-stamp b{color:var(--stg-ink);font-weight:500;}
/* A MEANING CHIP GIVES UP ITS FILL ON THE STAGE and keeps its border and its
   ink, which is what --stg-chip is for: a warning stops being the brightest
   thing on a near-black page without stopping being a warning. */
.gr-warn{margin:10px 18px 0;padding:10px 12px;border-radius:9px;background:var(--stg-chip);
  border:1px solid color-mix(in srgb,var(--stg-warn) 42%,transparent);
  color:var(--stg-warn);font-size:12px;line-height:1.55;}
.gr-warn b{color:var(--stg-warn);}
/* Informational, not a fault: the board is between weekly rebuilds. It takes
   the page accent rather than the warn colour, because nothing here is broken
   or excluded. */
.gr-note{margin:10px 18px 0;padding:10px 12px;border-radius:9px;background:var(--stg-chip);
  border:1px solid var(--stg-line);border-left:3px solid var(--stg-acc);color:var(--stg-ink2);
  font-size:12px;line-height:1.55;}
.gr-note b{color:var(--stg-ink);}
.gr-scroll{overflow-x:auto;}
.gr table{border-collapse:separate;border-spacing:0;width:100%;min-width:1260px;font-size:13px;}
/* Column widths are FIXED so the three sticky columns (rank 46 + team 224 +
   rating 74 = 344px) never overlap a scrolling column: with v2's fourteen
   columns the browser was shrinking the team column and the sticky rating box
   sat on top of the results column. Below the table's min-width the console
   scrolls sideways; the page container is 1440px on desktop so it fits on a
   wide screen without scrolling at all.
   ⚠️ EVERY ONE OF THE THREE NEEDS A min-width, NOT ONLY A width. A width on a
   table cell is a hint, not a rule: at the table's own min-width the browser
   squeezed the rank column to 25px, so the sticky rating box (pinned at
   left:270 = 46 + 224) was pushed 21px past the team column and sat on top of
   the first source column, clipping it. cTeam and cScore already carried one
   and cRank did not, which is why only that end of the row went wrong. */
.gr td.tm,.gr th.cTeam{width:224px;min-width:224px;max-width:224px;}
.gr td.cScore,.gr th.cScore{width:74px;min-width:74px;}
.gr td.cell,.gr thead .gr-srcs th:not(.cRank):not(.cTeam):not(.cScore){min-width:66px;}
.gr th,.gr td{padding:0;text-align:center;white-space:nowrap;}
/* The pillar band names its pillar in that pillar's own ink, with the fill as a
   small mark beside it. Separate TEXT from FILL, per the stage rule. */
.gr thead .gr-tiers th{padding:10px 8px 6px;font-family:'DM Mono',ui-monospace,monospace;
  font-size:9.5px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;
  color:var(--t-ink,var(--stg-mute2));border-bottom:1px solid var(--stg-line);background:var(--stg-panel);}
.gr thead .gr-tiers th[data-tier]::before{content:'';display:inline-block;width:7px;height:7px;
  border-radius:2px;background:var(--t,var(--stg-mute2));margin-right:7px;vertical-align:baseline;}
.gr thead .gr-srcs th{padding:8px 8px 10px;font-size:11px;font-weight:700;color:var(--stg-ink2);
  background:var(--stg-panel);border-bottom:2px solid var(--stg-acc);vertical-align:bottom;}
.gr thead th.tg,.gr td.tg{border-left:1px solid var(--stg-line);}
.gr-w{display:block;font-family:'DM Mono',ui-monospace,monospace;font-size:9.5px;font-weight:500;
  color:var(--stg-acc-ink);margin-top:3px;letter-spacing:.04em;}
.gr-asof{display:block;font-family:'DM Mono',ui-monospace,monospace;font-size:9.5px;
  color:var(--stg-mute2);margin-top:3px;letter-spacing:.02em;}
.gr-asof.bad{color:var(--stg-bad);}
.gr-asof.bad::before{content:'\\25B2 ';font-size:8px;}
/* An excluded source keeps its column, hatched out of the surface ladder rather
   than out of a pair of greys that only exist on a white page. */
.gr thead .gr-srcs th.out{
  background-image:repeating-linear-gradient(135deg,var(--stg-b1),var(--stg-b1) 6px,var(--stg-b2) 6px,var(--stg-b2) 12px);
  color:var(--stg-mute2);text-decoration:line-through;text-decoration-thickness:1px;}
.gr thead .gr-srcs th.out .gr-w{color:var(--stg-bad);text-decoration:none;display:inline-block;
  text-transform:uppercase;letter-spacing:.08em;font-size:8.5px;}
.gr thead .gr-srcs th.out .gr-asof{text-decoration:none;}
.gr td.cell.out{color:var(--stg-mute2);font-weight:600;
  background-image:repeating-linear-gradient(135deg,transparent,transparent 6px,var(--stg-b1) 6px,var(--stg-b1) 12px);}
/* THE THREE STICKY COLUMNS MUST BE OPAQUE, so they take the console's own
   surface as a background-COLOR and the zebra rides on top as a background
   IMAGE. A translucent lift here would let every scrolling column through the
   rating box. */
.gr .cRank,.gr .cTeam,.gr .cScore{position:sticky;background-color:var(--stg-raise);z-index:2;}
.gr .cRank{left:0;width:46px;min-width:46px;}
.gr .cTeam{left:46px;text-align:left;}
.gr .cScore{left:270px;box-shadow:1px 0 0 var(--stg-line);}
.gr thead .cRank,.gr thead .cTeam,.gr thead .cScore{background-color:var(--stg-panel);z-index:3;}
.gr tbody tr:nth-child(even) td{background-image:linear-gradient(var(--stg-b1),var(--stg-b1));}
.gr tbody tr:hover td{background-image:linear-gradient(var(--stg-acc-tint),var(--stg-acc-tint));}
.gr td.rk{font-size:15px;font-weight:800;color:var(--stg-ink);padding:9px 0;}
/* The medals keep their metals and take the ramp's dark ink. White on gold is
   1.9:1 and was failing on the light page too; this is the same fix the
   category ramp made for its three warm steps. */
.gr-medal{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;
  border-radius:50%;color:#08222e;font-size:12.5px;font-weight:800;}
.gr td.tm{padding:7px 14px 7px 8px;font-size:13.5px;font-weight:700;letter-spacing:-.01em;width:224px;}
.gr-tmw{display:flex;align-items:center;gap:9px;}
.gr-lg{width:26px;height:26px;flex:none;object-fit:contain;}
/* A TEAM CREST IS ARTWORK DRAWN FOR A WHITE PAGE, and on the dark register the
   navy and black ones are not dim, they are GONE: measured against this board's
   own --stg-raise (#0d1220) across all 200 crests in the registry, 97 put less
   than half their ink above 3:1 and a dozen of those put NONE of it there.
   Penn State, Oklahoma, Kansas State, TCU, SMU, San Diego State and Utah State
   each rendered as an empty 26px square where the mark should be, on a column
   whose whole job is to let a reader find their team by its shape.
   The crest cannot be recoloured: it is a third-party PNG and the colour IS the
   brand. So it gets an EDGE instead, the same answer the board palette gave for
   the hue. Two 1px white drop-shadows stacked trace the alpha edge of whatever
   the file happens to contain, which is why this needs no per-team data and
   covers a sport that has not been added yet: a dark mark gains an outline and
   reads, a mark that is already light gains a white edge on a white shape and
   is unchanged. One shadow was measured too and is too thin on the darkest
   navies, a single soft 3px reads as a glow and blurs the mark.
   ESPN's own 500-dark variant was the other candidate and was measured against
   the same ground: it exists for every one of the 200, but it is BYTE-IDENTICAL
   to the light file for 79 of them and repairs only 45 of the 97, so it is not
   sufficient on its own. It also costs a second URL per team, in a second
   next/image entry, fetched on a register the reader may never open, and it
   throws the team's colour away where it does differ (a white OU, a white A).
   THE LIGHT REGISTER TURNS IT OFF THROUGH THE BOOT STAMP, the same guard the
   pillar-hue block above uses, and for the same reason: this wrapper's data-stage-theme is server
   rendered as the default and corrected in an effect, so for one frame it
   claims light on a reader who chose dark, and <html> is what holds the answer
   by then. Dark needs no mirror of this: dark is the unguarded rule. */
.gr-lg{filter:drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(0 0 1px rgba(255,255,255,.9));}
html:not([data-stage-boot='dark']) [data-stage-theme='light'] .gr-lg{filter:none;}
.gr-mono{width:26px;height:26px;flex:none;border-radius:6px;background:var(--stg-b2);
  color:var(--stg-ink2);font-family:'DM Mono',ui-monospace,monospace;font-size:9.5px;font-weight:500;
  display:flex;align-items:center;justify-content:center;letter-spacing:.02em;}
.gr-tmn{overflow:hidden;text-overflow:ellipsis;}
.gr-apps{display:block;font-family:'DM Mono',ui-monospace,monospace;font-size:10px;
  font-weight:400;color:var(--stg-mute2);letter-spacing:.02em;}
.gr td.cScore{padding:7px 12px 7px 4px;width:74px;}
.gr-score{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;
  min-width:56px;padding:4px 8px 5px;border-radius:8px;background:var(--stg-acc);color:var(--stg-onramp);}
.gr-score b{font-size:15px;font-weight:800;letter-spacing:-.01em;line-height:1;font-variant-numeric:tabular-nums;}
.gr-score i{font-style:normal;font-size:8px;font-weight:800;letter-spacing:.1em;
  text-transform:uppercase;opacity:.72;margin-top:2px;}
.gr thead th.cScore{color:var(--stg-acc-ink);}
.gr td.cell{font-size:13px;font-weight:700;color:var(--stg-ink2);padding:9px 6px;
  border-left:1px solid transparent;font-variant-numeric:tabular-nums;}
.gr td.cell.nr{color:var(--stg-mute2);font-weight:600;}
.gr td.cell.rv{font-family:'DM Mono',ui-monospace,monospace;font-size:10.5px;font-weight:500;
  letter-spacing:.04em;color:var(--stg-mute);}
/* Deviation: one hue up, one hue down, two steps each, mixed into whatever
   surface the row is already carrying rather than replacing it. */
.gr td.cell.up1{background-image:linear-gradient(color-mix(in srgb,var(--stg-cool) 13%,transparent),color-mix(in srgb,var(--stg-cool) 13%,transparent));color:var(--stg-cool);}
.gr td.cell.up2{background-image:linear-gradient(color-mix(in srgb,var(--stg-cool) 26%,transparent),color-mix(in srgb,var(--stg-cool) 26%,transparent));color:var(--stg-cool);}
.gr td.cell.dn1{background-image:linear-gradient(color-mix(in srgb,var(--stg-warn) 15%,transparent),color-mix(in srgb,var(--stg-warn) 15%,transparent));color:var(--stg-warn);}
.gr td.cell.dn2{background-image:linear-gradient(color-mix(in srgb,var(--stg-warn) 29%,transparent),color-mix(in srgb,var(--stg-warn) 29%,transparent));color:var(--stg-warn);}
.gr td.sp{padding:9px 10px;width:112px;}
.gr-spbar{display:flex;align-items:center;gap:7px;justify-content:flex-end;}
.gr-spbar i{display:block;height:5px;border-radius:3px;
  background:color-mix(in srgb,var(--stg-acc) 42%,var(--stg-b2));}
.gr-spbar i.hot{background:var(--stg-acc);}
.gr-spbar span{font-family:'DM Mono',ui-monospace,monospace;font-size:11px;font-weight:500;
  color:var(--stg-ink2);width:22px;text-align:right;font-variant-numeric:tabular-nums;}
.gr-legend{display:flex;gap:20px;flex-wrap:wrap;align-items:center;padding:12px 18px;
  background:var(--stg-panel);border-top:1px solid var(--stg-line);font-size:11.5px;color:var(--stg-ink2);}
.gr-k{display:inline-flex;align-items:center;gap:6px;}
.gr-sw{width:15px;height:15px;border-radius:4px;border:1px solid var(--stg-line);}
.gr-notes{padding:15px 18px;border-top:1px solid var(--stg-line);font-size:12.5px;
  color:var(--stg-ink2);line-height:1.7;}
.gr-notes b{color:var(--stg-ink);}
/* ---- mobile: one card per team ----
   A ten-column table behind a horizontal scrollbar is not a mobile layout: the
   whole point of this page is comparing sources, and on a phone every source
   was off-screen. Below 760px the table is replaced by a card per team that
   keeps EVERY source visible, as wrapped chips, with no sideways scrolling.
   Both renders sit in the DOM and CSS picks one, so the pages stay server
   components with no client JS; display:none also keeps the hidden one out of
   the accessibility tree. */
.gr-cards,.gr-tierkey{display:none;}
@media(max-width:760px){
  .gr-scroll{display:none;}
  .gr-cards{display:block;list-style:none;margin:0;padding:0;}
  .gr-tierkey{display:flex;flex-wrap:wrap;gap:8px 13px;padding:9px 13px;
    border-bottom:1px solid var(--stg-line);background:var(--stg-panel);}
  .gr-tk{display:inline-flex;align-items:center;gap:5px;font-family:'DM Mono',ui-monospace,monospace;
    font-size:9.5px;font-weight:500;letter-spacing:.07em;text-transform:uppercase;color:var(--stg-mute);}
  .gr-tk i{width:9px;height:9px;border-radius:3px;display:block;}
  .gr-chead{padding:10px 13px;}
  .gr-chead h2{font-size:15px;}
  .gr-stamp{font-size:10.5px;line-height:1.45;text-align:left;}
  .gr-warn{margin:8px 13px 0;padding:8px 10px;font-size:11px;line-height:1.45;}
  .gr-note{margin:8px 13px 0;padding:8px 10px;font-size:11px;line-height:1.45;}
  .gr-card{padding:11px 14px 12px;border-bottom:1px solid var(--stg-line);}
  .gr-card:last-child{border-bottom:0;}
  .gr-chead2{display:flex;align-items:center;gap:9px;}
  .gr-crank{font-size:15px;font-weight:800;color:var(--stg-ink);min-width:22px;text-align:center;flex:none;}
  .gr-card .gr-lg,.gr-card .gr-mono{width:28px;height:28px;}
  .gr-cname{flex:1;min-width:0;font-size:15px;font-weight:800;letter-spacing:-.01em;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--stg-ink);}
  .gr-cscore{flex:none;display:inline-flex;flex-direction:column;align-items:center;
    min-width:56px;padding:4px 9px 5px;border-radius:8px;background:var(--stg-acc);color:var(--stg-onramp);}
  .gr-cscore b{font-size:15px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;}
  .gr-cscore i{font-style:normal;font-size:7.5px;font-weight:800;letter-spacing:.1em;
    text-transform:uppercase;opacity:.72;margin-top:2px;}
  .gr-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px;}
  .gr-chip{display:inline-flex;align-items:baseline;gap:5px;padding:3px 8px 3px 6px;
    border:1px solid var(--stg-line);border-left-width:3px;border-radius:6px;background:var(--stg-b1);}
  .gr-chip s{font-family:'DM Mono',ui-monospace,monospace;font-size:9px;font-weight:500;
    letter-spacing:.06em;text-transform:uppercase;color:var(--stg-mute);text-decoration:none;}
  .gr-chip b{font-size:12.5px;font-weight:800;color:var(--stg-ink2);font-variant-numeric:tabular-nums;}
  .gr-chip.up{background:color-mix(in srgb,var(--stg-cool) 16%,transparent);}
  .gr-chip.up b{color:var(--stg-cool);}
  .gr-chip.dn{background:color-mix(in srgb,var(--stg-warn) 18%,transparent);}
  .gr-chip.dn b{color:var(--stg-warn);}
  .gr-chip.rvc b{font-size:10px;letter-spacing:.06em;}
  .gr-chip.gone{background-image:repeating-linear-gradient(135deg,transparent,transparent 5px,var(--stg-b1) 5px,var(--stg-b1) 10px);
    border-left-color:var(--stg-line2)!important;}
  .gr-chip.gone s,.gr-chip.gone b{color:var(--stg-mute2);text-decoration:line-through;}
  .gr-crange{margin-top:8px;font-family:'DM Mono',ui-monospace,monospace;font-size:10px;
    color:var(--stg-mute);letter-spacing:.03em;}
  .gr-crange em{font-style:normal;color:var(--stg-ink2);}
}
      ` }} />
      <div className="gr-console">
        <div className="gr-chead">
          <div>
            <div className="gr-eyebrow">{eyebrow}</div>
            <h2>{boardTitle}</h2>
          </div>
          <div className="gr-stamp">
            <b>{live.length} of {nSrc} sources</b> scoring, across{' '}
            {Object.keys(tierShare).length} pillars<br />
            week {week} &middot; built {fetchedAt}
          </div>
        </div>

        {gone.length > 0 && (
          <div className="gr-warn">
            {/*
              This banner used to name the 30-day rule, because age was the only way a source
              could be excluded. From 2026-09-14 a source can also be excluded for describing a
              week the board has already left, per CLAUDE-RANKINGS.md section 5 rule 2. So the
              headline states the fact and each source's own `why` gives the reason.
            */}
            <b>{gone.length} source{gone.length > 1 ? 's' : ''} excluded from this week&rsquo;s score.</b>{' '}
            {gone.map((s) => `${s.label} (${s.why})`).join('; ')}. Their columns are shown struck
            through for transparency, but they score nothing and their pillar reweighted around them.
          </div>
        )}

        {sinceGames.length > 0 && (
          <div className="gr-note">
            <b>
              {sinceGames.length} game{sinceGames.length > 1 ? 's have' : ' has'} been played since
              this board was priced.
            </b>{' '}
            Every column that scores is dated {fmtDate(pricedThrough)} or earlier, so none of them
            has seen {sinceGames.length > 1 ? 'those results' : 'that result'} yet. The rankings
            rebuild once a week, when the polls, the models and the betting market all republish
            together; between rebuilds the board is the last full set of data, not a live one.
            {(tierShare.results || 0) === 0
              ? ` Results carry no weight until a week of games is complete, so a win or a loss this week shows in the ${resShort} column without moving the rating.`
              : ` Results carry ${pct(tierShare.results)}% right now and reach ${pct(PILLARS.results)}% after week ${fullIn}.`}
            {splits.length > 0 && splits[0].gap >= Math.max(10, Math.round(depth / 6)) && (
              <>
                {' '}Which is why{' '}
                {splits.map((s, i) => (
                  <span key={s.team}>
                    {i > 0 ? ', and ' : ''}
                    <b>{s.team}</b> is {ord(s.res)} on results and {ord(s.at)} here
                  </span>
                ))}
                . Expect that to close at the next rebuild, not before.
              </>
            )}
          </div>
        )}

        <div className="gr-scroll">
          <table>
            <thead>
              <tr className="gr-tiers">
                <th className="cRank" /><th className="cTeam" /><th className="cScore" />
                {groups.map((g, i) => (
                  <th key={g.tier} colSpan={g.n} className={i ? 'tg' : undefined} data-tier={g.tier}>
                    {PILLAR_LABEL[g.tier]} &middot; {pct(tierShare[g.tier] || 0)}%
                  </th>
                ))}
                <th />
              </tr>
              <tr className="gr-srcs">
                <th className="cRank">#</th>
                <th className="cTeam">Team</th>
                <th className="cScore">Rating</th>
                {cols.map((c, i) => (
                  <th
                    key={c.id}
                    className={[startsGroup(i) ? 'tg' : '', c.ok || c.kind !== 'source' ? '' : 'out'].filter(Boolean).join(' ') || undefined}
                    title={`${c.label} — ${c.why}`}
                  >
                    {c.short || c.label}
                    <span className="gr-w">{weightText(c)}</span>
                    <span className={`gr-asof${c.ok || c.kind !== 'source' ? '' : ' bad'}`}>{fmtDate(c.asOf)}</span>
                  </th>
                ))}
                <th style={{ paddingRight: 16 }} title="Results rank minus market rank. Positive: the results say better than the market does.">Results vs market</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => {
                const g = r.gap;
                const hot = g != null && Math.abs(g) >= Math.max(hi, maxGap * 0.6);
                return (
                  <tr key={r.team}>
                    <td className="cRank rk">
                      {r.rank <= 3
                        ? <span className="gr-medal" style={{ background: MEDAL[r.rank - 1] }}>{r.rank}</span>
                        : rankText(r)}
                    </td>
                    <td className="cTeam tm">
                      <div className="gr-tmw">
                        {r.logo
                          ? <Image className="gr-lg" src={r.logo} alt="" width={26} height={26} unoptimized={false} />
                          : <span className="gr-mono">{r.mono}</span>}
                        <div className="gr-tmn">
                          {r.team}
                          {r.record && <span className="gr-apps">{r.record.text}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="cScore">
                      <span className="gr-score"><b>{signed(r.score, dp)}</b><i>{unitShort}</i></span>
                    </td>
                    {cols.map((c, i) => {
                      const tg = startsGroup(i) ? ' tg' : '';
                      const shown = r.shown[c.id];
                      if (c.kind === 'source' && !c.ok) return <td key={c.id} className={`cell out${tg}`}>{shown == null ? '—' : shown}</td>;
                      if (shown == null) return <td key={c.id} className={`cell nr${tg}`}>{'—'}</td>;
                      if (c.kind === 'record') return <td key={c.id} className={`cell rv${tg}`} title={cellTitle(c, r)}>{shown}</td>;
                      const v = r.ranks[c.id];
                      if (v == null) return <td key={c.id} className={`cell rv${tg}`}>{shown}</td>;
                      const dev = r.rank - v;   // positive: this column is HIGHER on them
                      const cls = dev >= lo ? ' up2' : dev >= hi ? ' up1' : dev <= -lo ? ' dn2' : dev <= -hi ? ' dn1' : '';
                      return <td key={c.id} className={`cell${cls}${tg}`} title={cellTitle(c, r)}>{shown}</td>;
                    })}
                    <td className="sp">
                      {g == null ? <span className="gr-spbar"><span>—</span></span> : (
                        <div className="gr-spbar">
                          <i className={hot ? 'hot' : undefined}
                             style={{ width: Math.max(4, (Math.abs(g) / maxGap) * 62) }} />
                          <span>{g > 0 ? `+${g}` : g}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile render. Same data, same order, no horizontal scrolling. */}
        <div className="gr-tierkey">
          {groups.map((g) => (
            <span key={g.tier} className="gr-tk">
              <i style={{ background: TIER_COLOR[g.tier] }} />
              {PILLAR_LABEL[g.tier]} {pct(tierShare[g.tier] || 0)}%
            </span>
          ))}
        </div>
        <ul className="gr-cards">
          {ranked.map((r) => (
            <li className="gr-card" key={r.team}>
              <div className="gr-chead2">
                <span className="gr-crank">
                  {r.rank <= 3
                    ? <span className="gr-medal" style={{ background: MEDAL[r.rank - 1] }}>{r.rank}</span>
                    : rankText(r)}
                </span>
                {r.logo
                  ? <Image className="gr-lg" src={r.logo} alt="" width={28} height={28} />
                  : <span className="gr-mono">{r.mono}</span>}
                <span className="gr-cname">{r.team}{r.record ? ` · ${r.record.text}` : ''}</span>
                <span className="gr-cscore"><b>{signed(r.score, dp)}</b><i>{unitShort}</i></span>
              </div>
              <div className="gr-chips">
                {cols.map((c) => {
                  if (c.kind === 'record') return null;
                  const shown = r.shown[c.id];
                  if (shown == null) return null;
                  const v = r.ranks[c.id];
                  const dev = v == null ? 0 : r.rank - v;
                  const dead = c.kind === 'source' && !c.ok;
                  const cls = dead ? 'gone' : dev >= hi ? 'up' : dev <= -hi ? 'dn' : '';
                  return (
                    <span
                      key={c.id}
                      className={`gr-chip ${cls}${v == null ? ' rvc' : ''}`.trim()}
                      style={{ borderLeftColor: TIER_COLOR[c.tier] }}
                    >
                      <s>{c.short || c.label}</s><b>{shown}</b>
                    </span>
                  );
                })}
              </div>
              <div className="gr-crange">
                Results <em>{r.rR ? `#${r.rR}` : 'no games'}</em> &middot; market <em>#{r.rO}</em>
                {r.rA && <> &middot; models <em>#{r.rA}</em></>}
                {r.gap != null && <> &middot; results vs market <em>{r.gap > 0 ? `+${r.gap}` : r.gap}</em></>}
              </div>
            </li>
          ))}
        </ul>

        <div className="gr-legend">
          <span className="gr-k"><i className="gr-sw" style={{ background: 'var(--sw-up)' }} /> column ranks them higher than the composite</span>
          <span className="gr-k"><i className="gr-sw" style={{ background: 'var(--sw-dn)' }} /> lower than the composite</span>
          <span className="gr-k"><i className="gr-sw" style={{ background: 'var(--sw-hot)' }} /> widest results-versus-market gap</span>
          <span className="gr-k">{'—'} not ranked by that column</span>
        </div>

        <div className="gr-notes">
          <b>How the rating is built.</b> Every team gets a rating in {unit} better than an average{' '}
          {league} team on a neutral field, from each of three pillars, and
          the composite is their weighted sum.{' '}
          {MLB ? (
            <>
              <b>Results</b> is what actually happened, in two parts: a run-differential rating
              solved across the whole schedule, so beating good teams counts for more than beating
              bad ones and margins are capped at 5 runs, blended 65 / 35 with a win rating so a win
              counts beyond its margin.{' '}
              <b>Betting markets</b> is what money says. Baseball has no spread worth reading, since
              the runline is fixed at a run and a half with the price doing the work, so the rating
              is fit to ten weeks of closing <i>moneylines</i>, the most recent weighted heaviest,
              and converted to runs at the rate the season itself sets. The futures board is shown
              at 0% and scores nothing: by September it had separated all thirty teams into fifteen
              distinct prices, and what it is really pricing is the playoff path rather than the
              team. Every club has a moneyline in all six of its games a week, so the lines already
              carry what the futures would, and carry it better.{' '}
            </>
          ) : coverOnly ? (
            <>
              <b>Results</b> is what actually happened, measured one way: how far above or below the
              closing line&rsquo;s expectation each game landed, averaged per game. The line already
              prices the opponent and the site, so a narrow win over a good team counts for more than
              a rout of a weak one, and playing an extra game earns nothing by itself. Each game is
              luck-adjusted first, half the scoreboard and half what the yardage says the margin
              should have been, then capped at {sport === 'nfl' ? 21 : 28} points. Margin and wins
              were removed from this pillar in September because in the first weeks of a season
              neither can tell a good opponent from a bad one, so between them they mostly counted
              games played.{' '}
              <b>Read this column as what-you-did-against-expectation, not as who-you-beat.</b> A
              team that won every game as a heavy favourite can rank low in it, and a team that lost
              outright as a four-touchdown underdog can rank high. The composite is the place the
              three pillars argue that out.{' '}
              <b>Betting markets</b> is what money says: a rating fit to the last three weeks of point
              spreads, blended with the futures boards.{' '}
            </>
          ) : (
            <>
              <b>Results</b> is what actually happened, in three parts. A luck-adjusted margin: half
              the scoreboard, half what the yardage says the margin should have been, so a team that
              doubled its opponent&rsquo;s yards and lost on fumbles is docked about half of what the
              score says, while a team that was out-gained and still lost takes the full hit. Margins
              are capped at {sport === 'nfl' ? 21 : 28} points and solved across the whole schedule so
              that beating good teams counts for more than beating bad ones. A win rating, so a win
              counts beyond its margin. And performance against the spread: how far above or below the
              closing line&rsquo;s expectation each game landed, which already prices the opponent and
              the site. Blended 45 / 30 / 25.{' '}
              <b>Betting markets</b> is what money says: a rating fit to the last three weeks of point
              spreads, blended with the futures boards.{' '}
            </>
          )}
          <b>Analytics models</b> is what the models say: every live model, placed on the same points
          scale by its position against the market.{' '}
          Full-season weights are results {pct(PILLARS.results)}%, markets {pct(PILLARS.market)}%,
          models {pct(PILLARS.model)}%; results phase in over the first {fullIn} weeks because a
          September record predicts almost nothing, and a pillar with nothing to say this week hands
          its share to the others. {rampNote}{' '}
          <b>There are no media rankings and no human polls in the score.</b> Voters anchor on where a
          team started the season, reward reputation, and see a fraction of the games they rank; the
          three pillars here are each accountable to something real, a score, a price, or a
          measurement.{' '}
          {MLB && (
            <>
              <b>Two columns are shown and not scored.</b> <i>vs MKT</i> is wins above what the
              closing moneyline expected, and <i>Luck</i> is runs scored above or below the BaseRuns
              estimate from the team&rsquo;s own hits, walks and extra bases: the part of the record
              that was sequencing rather than production. Both were tested and neither made the
              ranking better, which in a 162-game season is the point, so they are reported rather
              than scored.{' '}
            </>
          )}
          <b>Results vs market</b> is the results rank minus the market rank: a large positive number
          is a team whose record the market does not yet believe, a large negative one is a favourite
          that keeps losing. A source is excluded from scoring, and shown struck through, when its
          data is more than {MAX_AGE_DAYS} days old or when it describes an earlier week than the
          one this board is built on.{' '}
          {offBoard > 0 && (
            <>
              <b>How deep the models go.</b> No live analytics model publishes past{' '}
              {modelDepth} teams this week, so {offBoard} of the {ranked.length} rows read{' '}
              <i>off board</i> in the models column. Those teams still carry a models value, the one
              every model implies for a team below its board, but it is the same value for all of
              them, so it separates none of them: below rank {modelDepth + 1} the order is the
              market&rsquo;s and the results&rsquo;, not the models&rsquo;. The column is left empty
              rather than filled with a position no model published.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
