import { getTeam, getMetros } from '@/lib/housing/data';
import { fmtNum, fmtPct, fmtMonth } from '@/lib/housing/format.mjs';
import LineChart, { Legend } from '../_components/LineChart';

export const revalidate = 3600;

export const metadata = { title: 'Market share', alternates: { canonical: '/housing/share' } };

const quarterToDate = (q) => {
  const [y, n] = q.split('-Q').map(Number);
  return `${y}-${String(n * 3).padStart(2, '0')}-28`;
};

export default async function Share() {
  const [{ share }, { metros, through }] = await Promise.all([getTeam(), getMetros()]);
  const builders = share?.builders ?? [];
  const top = builders.slice(0, 12);
  const max = Math.max(...top.map((b) => b.share), 1);
  const trend = share?.trend ?? [];
  const trendSeries = [
    { name: 'Top 10 public builders', color: 'var(--accent)', obs: trend.filter((t) => t.top10 !== null).map((t) => [quarterToDate(t.quarter), t.top10]) },
    { name: 'Top 5', color: 'var(--ink)', obs: trend.map((t) => [quarterToDate(t.quarter), t.top5]) },
  ].filter((s) => s.obs.length > 1);
  const combined10 = builders.slice(0, 10).reduce((s, b) => s + b.share, 0);

  return (
    <>
      <section className="page-head">
        <div className="eyebrow">{share?.asOf ? `Trailing four quarters through ${share.asOf.replace('-', ' ')}` : 'Awaiting builder data'}</div>
        <h1 className="display">Market share</h1>
        <p>Public builder closings as a share of US new home sales.</p>
      </section>

      <div className="grid-2">
        <div className="card chart-card">
          <h2 className="display">National share, top builders</h2>
          {top.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {top.map((b) => (
                <div key={b.ticker} className="bar-row">
                  <span title={`${fmtNum(b.closingsTTM)} closings, trailing four quarters`}>{b.name}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(b.share / max) * 100}%` }} /></div>
                  <span className="mono" style={{ textAlign: 'right' }}>{b.share.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ padding: 0 }}>Shares appear once the team has entered four quarters of closings for a builder.</div>
          )}
          {top.length > 0 && (
            <div className="note">
              Top 10 combined: <b className="mono">{combined10.toFixed(1)}%</b> of {fmtNum(share.denominator)} new home sales.
            </div>
          )}
        </div>

        <div className="card chart-card">
          <h2 className="display">Consolidation trend</h2>
          {trendSeries.length ? (
            <>
              <Legend items={trendSeries} />
              <LineChart series={trendSeries} label="Share of new home sales held by the largest public builders" format="pct0" />
            </>
          ) : (
            <div className="empty" style={{ padding: 0 }}>The trend needs at least two quarters of data for five or more builders.</div>
          )}
        </div>
      </div>

      <p className="note" style={{ marginTop: 12, maxWidth: 900 }}>
        Method: each builder&apos;s closings over its last four reported quarters, divided by Census new single-family
        home sales (not seasonally adjusted) over the matching twelve months. Fiscal quarters are mapped to the
        nearest calendar quarter, and builder closings can include homes Census counts differently, so read shares as
        close estimates.
      </p>

      <section className="section">
        <div className="section-head">
          <div>
            <h2 className="display">Top metros by single-family permits</h2>
            <div className="note">{through ? `Year to date through ${fmtMonth(`${through}-01`)} · Census Building Permits Survey` : ''}</div>
          </div>
        </div>
        <div className="card table-scroll" style={{ paddingTop: 6 }}>
          <table>
            <thead><tr><th>Metro area</th><th>1-unit permits, YTD</th><th>Y/Y</th><th>All units, YTD</th><th>1-unit share</th></tr></thead>
            <tbody>
              {metros.map((m) => (
                <tr key={m.cbsa}>
                  <td className="name">{m.name}</td>
                  <td className="mono">{fmtNum(m.sf)}</td>
                  <td className="mono">{fmtPct(m.sfYoY)}</td>
                  <td className="mono">{fmtNum(m.total)}</td>
                  <td className="mono">{m.total ? `${Math.round((m.sf / m.total) * 100)}%` : 'n/a'}</td>
                </tr>
              ))}
              {!metros.length && <tr><td colSpan={5} className="empty">Metro data not available yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 10 }}>Builder share by metro needs licensed data and is not shown yet.</p>
      </section>
    </>
  );
}
