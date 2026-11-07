'use client';
// Analytics -> Cheat Watch (owner, 2026-11-07).
//
// Players whose recent daily results look too good to be human, highest risk
// first. Data: /api/admin/data?part=integrity, built by lib/admin-integrity.js,
// which documents every signal. A queue, not a verdict: open the examples and
// the player's plays before acting. Hiding a player is a line in
// lib/hidden-players.js.
import React, { useState } from 'react';
import { T } from '@/lib/theme';

const C = {
  ink: T.ink,
  faded: T.muted,
  paper: T.white,
  surface: T.surface,
  line: 'rgba(20,22,28,0.18)',
  high: '#b91c1c',
  mid: '#b45309',
  low: '#15803d',
  accent: T.accent,
};
const MONO = 'Manrope, monospace';
const SANS = 'Manrope, system-ui, -apple-system, sans-serif';

function riskColor(r) { return r >= 60 ? C.high : r >= 35 ? C.mid : C.low; }

function fmtTime(s) {
  if (s == null) return '-';
  if (s < 90) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 90 ? `${m}m ${s % 60}s` : `${Math.round(m / 60)}h`;
}

function exampleLine(e) {
  const day = e.q;
  if (e.why === 'instant') return `${day}: ${e.score}/${e.total} in ${fmtTime(e.time)} (field ${e.field})`;
  if (e.why === 'alone') return `${day}: ${e.score}/${e.total}, next best ${e.next} (field ${e.field})`;
  return `${day}: ${e.score}/${e.total} in ${fmtTime(e.time)}, next best ${fmtTime(e.nextTime)} (field ${e.field})`;
}

const TH = { textAlign: 'left', padding: '8px 10px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.faded, borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap' };
const TD = { padding: '8px 10px', fontFamily: SANS, fontSize: 13, color: C.ink, borderBottom: `1px solid ${C.line}`, verticalAlign: 'top' };
const NUM = { ...TD, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

export default function IntegrityPanel({ part }) {
  const d = part.data || {};
  const players = d.players || [];
  const [open, setOpen] = useState(null);
  const [showLow, setShowLow] = useState(false);
  const shown = showLow ? players : players.filter((p) => p.risk >= 20);
  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: C.faded, marginBottom: 12, lineHeight: 1.5 }}>
        First-try results on non-Arcade dailies over the last {d.windowDays || 14} days, boards with 5+ players.
        {' '}{d.scored || 0} players with 10+ boards were scored. This is a list to review, not a verdict.
        {d.builtAt ? <> Built {new Date(d.builtAt).toLocaleString()}.</> : null}
        {' '}
        <button onClick={() => part.reload('force')} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${C.line}`, background: 'transparent', padding: '4px 8px', cursor: 'pointer', color: C.ink }}>
          {part.refreshing ? 'Refreshing' : 'Refresh'}
        </button>
        {' '}
        <label style={{ fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={showLow} onChange={(e) => setShowLow(e.target.checked)} /> Show low risk
        </label>
      </div>
      {!shown.length ? (
        <div style={{ padding: 30, textAlign: 'center', fontFamily: SANS, color: C.faded, border: `1px solid ${C.line}` }}>Nobody looks suspicious right now.</div>
      ) : (
        <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, background: C.paper }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={TH}>Player</th>
                <th style={{ ...TH, textAlign: 'right' }}>Risk</th>
                <th style={{ ...TH, textAlign: 'right' }}>Boards</th>
                <th style={{ ...TH, textAlign: 'right' }}>Win %</th>
                <th style={{ ...TH, textAlign: 'right' }}>Blowouts</th>
                <th style={{ ...TH, textAlign: 'right' }}>Instant</th>
                <th style={{ ...TH, textAlign: 'right' }}>Alone on top</th>
                <th style={{ ...TH, textAlign: 'right' }}>Replays</th>
                <th style={TH}>Why</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <React.Fragment key={p.key}>
                  <tr onClick={() => setOpen(open === p.key ? null : p.key)} style={{ cursor: 'pointer', background: open === p.key ? C.surface : 'transparent' }}>
                    <td style={TD}>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      {p.email ? <div style={{ fontSize: 11, color: C.faded }}>{p.email}</div> : null}
                      {p.hidden ? <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.high, marginTop: 2 }}>Hidden</div> : null}
                    </td>
                    <td style={{ ...NUM, fontWeight: 800, color: riskColor(p.risk) }}>{p.risk}</td>
                    <td style={NUM}>{p.boards}</td>
                    <td style={NUM}>{p.winRate}%</td>
                    <td style={NUM}>{p.blowouts}</td>
                    <td style={NUM}>{p.instant}</td>
                    <td style={NUM}>{p.soleTops}</td>
                    <td style={NUM}>{p.replayDays}</td>
                    <td style={{ ...TD, fontSize: 12, color: C.faded }}>{p.flags.join('; ') || '-'}</td>
                  </tr>
                  {open === p.key ? (
                    <tr>
                      <td colSpan={9} style={{ ...TD, background: C.surface, fontSize: 12 }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.faded, marginBottom: 6 }}>Examples</div>
                        {p.examples.length ? p.examples.map((e, i) => <div key={i} style={{ marginBottom: 3 }}>{exampleLine(e)}</div>) : <div>No single board stands out.</div>}
                        <div style={{ marginTop: 8, color: C.faded }}>Player key: {p.key}</div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
