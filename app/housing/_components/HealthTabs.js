'use client';
import { useState } from 'react';

const STATUS = { pass: 'Pass', watch: 'Watch', fail: 'Fail', none: 'Not available' };

export default function HealthTabs({ segments }) {
  const [active, setActive] = useState(segments[0].key);
  const seg = segments.find((s) => s.key === active);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div className="seg lg" role="group" aria-label="Segment">
          {segments.map((s) => (
            <button key={s.key} type="button" aria-pressed={s.key === active} onClick={() => setActive(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="legend">
          <span><span className="dot pass" style={{ marginLeft: 0 }} />Pass</span>
          <span><span className="dot watch" style={{ marginLeft: 0 }} />Watch</span>
          <span><span className="dot fail" style={{ marginLeft: 0 }} />Fail</span>
          <span><span className="dot none" style={{ marginLeft: 0 }} />Not available</span>
        </div>
      </div>
      <div className="card table-scroll" style={{ paddingTop: 6 }}>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              {seg.checks.map((c) => (
                <th key={c.label} title={`${c.rule}. Source: ${c.from === 'team' ? 'Housing Watch team models' : 'SEC filings'}`}>
                  {c.label}{c.from === 'team' ? ' *' : ''}
                </th>
              ))}
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {seg.rows.map((r) => (
              <tr key={r.ticker}>
                <td className="name" title={r.period || 'No data yet'}>
                  {r.filing ? <a href={r.filing} style={{ color: 'inherit' }}>{r.name}</a> : r.name}
                  <span className="tk">{r.ticker}</span>
                </td>
                {r.cells.map((c, i) => (
                  <td key={i} className="mono">
                    {c.text}
                    <span className={`dot ${c.status}`} role="img" aria-label={STATUS[c.status]} />
                  </td>
                ))}
                <td><span className="score">{r.scored ? `${r.passes}/${r.scored}` : 'n/a'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {seg.checks.some((c) => c.from === 'team') && (
        <p className="note" style={{ marginTop: 10 }}>* From the Housing Watch team&apos;s builder models. Everything else is computed from SEC filings.</p>
      )}
    </>
  );
}
