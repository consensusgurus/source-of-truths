'use client';

// RunQuickPlay — ONE quick, easy play straight after a run (owner, 2026-10-18).
//
// The Trivia Gauntlet's biggest problem was people arriving at it, playing it,
// and leaving for good. Its finish offered nothing near the top: the Play
// similar door is hidden on the Gauntlet and the only next step was a list at
// the very foot of the card. A player who has just answered a long run of
// questions is full, so the ask has to be SMALL, and it has to say how small.
//
// So this is one featured game, chosen to be quick and easy, carrying the two
// figures that make it an easy yes: about how long it takes, and how many
// people play it on an average day. Under it, up to two more short picks.
// Everything links out to the game itself.
//
// THE FIGURES ARE MEASURED, never written down: /api/quiz/pulse returns
// gameAvg, each daily's last seven FULL Eastern days (median finish clock,
// average distinct players a day, average share solved). The card renders
// nothing until that answer lands, so the pick cannot swap under the reader.
// If pulse fails it falls back to relatedness alone, with no figures shown
// rather than invented ones.
//
// THE PICK: never played today, never in this circuit. A game in one of this
// circuit's categories (or sharing a circuit with one of its games) is
// preferred, as long as it is genuinely quick; otherwise the quickest easy
// game anywhere. "Quick and easy" is the median clock, scaled up when the
// average player solves less than half of it, so a fast game nobody finishes
// is not offered as easy.
//
// Dark by design, on the run's stage. Colours are written down rather than
// inherited, and the CTA is sky #7dd3fc with dark ink, the stage's rule.
import React, { useEffect, useMemo, useState } from 'react';
import useDailyRoster from '../useDailyRoster';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { CIRCUITS, circuitById } from '@/lib/circuits';
import GameGlyph from '../GameGlyph';

const QUICK_SECS = 240;   // a related game slower than this is not "quick"
const MIN_SAMPLE = 3;     // fewer players a day than this and the clock is noise
const EXTRAS = 2;         // smaller picks under the featured one

function timeLabel(secs) {
  if (!Number.isFinite(secs) || secs <= 0) return null;
  if (secs < 60) return 'Under a minute';
  const m = Math.round(secs / 60);
  return `About ${m} min`;
}

function playersLabel(n) {
  if (!Number.isFinite(n) || n < 1) return null;
  const v = n < 20 ? Math.round(n) : Math.round(n / 5) * 5;
  return `${v.toLocaleString()} play${v === 1 ? 's' : ''} a day`;
}

// Lower is better: the clock, penalised when most players do not finish it.
function effort(s) {
  if (!s || !Number.isFinite(s.med) || s.med <= 0) return Infinity;
  const avg = Number.isFinite(s.avg) ? s.avg : 0.6;
  const k = avg >= 0.6 ? 1 : avg >= 0.4 ? 1.6 : 3;
  const thin = (s.players || 0) < MIN_SAMPLE ? 1.5 : 1;
  return s.med * k * thin;
}

export default function RunQuickPlay({ circuitId }) {
  const roster = useDailyRoster({ active: true });
  const [stats, setStats] = useState(null); // null loading, {} failed, map ok

  useEffect(() => {
    let alive = true;
    fetch('/api/quiz/pulse')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setStats((d && d.gameAvg) || {}); })
      .catch(() => { if (alive) setStats({}); });
    return () => { alive = false; };
  }, []);

  const me = circuitById(circuitId);
  const mine = useMemo(() => new Set((me && me.keys) || []), [me]);

  // Near = shares a category with this circuit, or shares a circuit with one
  // of its games. For the Gauntlet that is the trivia and geography dailies.
  const near = useMemo(() => {
    const cats = new Set();
    mine.forEach((k) => { const g = DAILY_GAME_MAP[k]; if (g && g.cat) cats.add(g.cat); });
    const keys = new Set();
    CIRCUITS.forEach((c) => {
      if (c.id === circuitId || !Array.isArray(c.keys)) return;
      if (c.keys.some((k) => mine.has(k))) c.keys.forEach((k) => keys.add(k));
    });
    return { cats, keys };
  }, [mine, circuitId]);

  const picks = useMemo(() => {
    if (stats === null) return [];
    const all = (roster.cats || []).reduce((a, c) => a.concat(c.games), []);
    const open = all.filter((g) => !g.played && !mine.has(g.key));
    if (!open.length) return [];
    const rows = open.map((g) => {
      const s = stats[g.key] || null;
      const related = near.cats.has(g.cat) || near.keys.has(g.key);
      return { g, s, related, e: effort(s) };
    });
    const haveStats = rows.some((x) => Number.isFinite(x.e));
    if (!haveStats) {
      // Pulse failed: relatedness alone, registry order, no figures.
      const rel = rows.filter((x) => x.related);
      return (rel.length ? rel : rows).slice(0, 1 + EXTRAS);
    }
    const byEffort = (a, b) => a.e - b.e;
    const quickRel = rows.filter((x) => x.related && x.e <= QUICK_SECS).sort(byEffort);
    const anyQuick = rows.filter((x) => Number.isFinite(x.e)).sort(byEffort);
    const lead = quickRel[0] || anyQuick[0] || rows[0];
    // The extras: more related quick ones first, then the next quickest
    // anywhere, and never two from one category so the row is a spread.
    const out = [lead];
    const seenCat = new Set([lead.g.cat]);
    const pool = quickRel.concat(anyQuick);
    for (const x of pool) {
      if (out.length >= 1 + EXTRAS) break;
      if (out.some((y) => y.g.key === x.g.key)) continue;
      if (seenCat.has(x.g.cat) && pool.length > 6) continue;
      out.push(x);
      seenCat.add(x.g.cat);
    }
    return out;
  }, [stats, roster.cats, mine, near]);

  if (!picks.length) return null;
  const [lead, ...rest] = picks;
  const lt = lead.s && timeLabel(lead.s.med);
  const lp = lead.s && playersLabel(lead.s.players);

  return (
    <div className="rqp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rqp-cap">Sharpen up <span>one quick play</span></div>

      <a className="rqp-lead" href={lead.g.href}>
        <span className="rqp-ic"><GameGlyph gameKey={lead.g.key} size={34} on="dark" /></span>
        <span className="rqp-tx">
          <span className="rqp-nm">{lead.g.name}</span>
          <span className="rqp-tg">{lead.g.tag}</span>
          {lt || lp ? (
            <span className="rqp-facts">
              {lt ? <span>{lt}</span> : null}
              {lp ? <span>{lp}</span> : null}
            </span>
          ) : null}
        </span>
        <span className="rqp-go">Play {lead.g.name}</span>
      </a>

      {rest.length ? (
        <div className="rqp-more">
          {rest.map(({ g, s }) => {
            const t = s && timeLabel(s.med);
            const p = s && playersLabel(s.players);
            return (
              <a key={g.key} className="rqp-mini" href={g.href}>
                <span className="rqp-mic"><GameGlyph gameKey={g.key} size={20} on="dark" /></span>
                <span className="rqp-mtx">
                  <b>{g.name}</b>
                  <i>{[t, p].filter(Boolean).join(' · ') || g.tag}</i>
                </span>
                <span className="rqp-mar" aria-hidden="true">&rsaquo;</span>
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const CSS = `
.rqp{margin:18px 0 6px;font-family:'Manrope',system-ui,-apple-system,sans-serif;}
.rqp-cap{font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#7dd3fc;
  margin-bottom:9px;text-align:left;}
.rqp-cap span{color:#9aa8c4;margin-left:6px;letter-spacing:.1em;}
.rqp-lead{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;
  text-decoration:none;border:1.5px solid #7dd3fc;border-radius:14px;padding:14px 16px;
  background:linear-gradient(180deg,rgba(125,211,252,.16),rgba(125,211,252,.06));color:#eef2fa;}
.rqp-lead:hover{background:linear-gradient(180deg,rgba(125,211,252,.24),rgba(125,211,252,.1));}
.rqp-ic{width:54px;height:54px;border-radius:12px;display:flex;align-items:center;justify-content:center;
  background:rgba(255,255,255,.08);}
.rqp-tx{min-width:0;display:flex;flex-direction:column;gap:3px;}
.rqp-nm{font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.1;color:#fff;}
.rqp-tg{font-size:12.5px;font-weight:600;line-height:1.35;color:#b8c4dc;}
.rqp-facts{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px;}
.rqp-facts span{font-size:11.5px;font-weight:800;color:#08222e;background:#d4efff;border-radius:999px;
  padding:3px 9px;white-space:nowrap;}
.rqp-go{background:#7dd3fc;color:#08222e;border-radius:10px;padding:12px 16px;font-weight:800;font-size:14px;
  white-space:nowrap;}
.rqp-more{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
.rqp-mini{display:flex;align-items:center;gap:9px;text-decoration:none;border:1px solid rgba(255,255,255,.14);
  border-radius:10px;padding:9px 11px;background:rgba(255,255,255,.05);color:#eef2fa;min-width:0;}
.rqp-mini:hover{border-color:#7dd3fc;background:rgba(125,211,252,.1);}
.rqp-mic{flex:0 0 auto;width:30px;height:30px;border-radius:7px;display:flex;align-items:center;
  justify-content:center;background:rgba(255,255,255,.07);}
.rqp-mtx{min-width:0;flex:1;}
.rqp-mtx b{display:block;font-size:13.5px;font-weight:800;line-height:1.15;color:#fff;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;}
.rqp-mtx i{display:block;font-style:normal;font-size:11px;font-weight:600;color:#9aa8c4;margin-top:2px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rqp-mar{color:#7dd3fc;font-size:20px;font-weight:700;}
@media (max-width:640px){
  .rqp-lead{grid-template-columns:auto 1fr;}
  .rqp-go{grid-column:1 / -1;text-align:center;}
  .rqp-more{grid-template-columns:1fr;}
}
`;
