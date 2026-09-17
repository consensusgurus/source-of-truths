import { getSeries, summarize } from '@/lib/housing/data';
import { fmtMonth, fmtDate, fmtPct, fmtNum, isNum } from '@/lib/housing/format.mjs';

export const revalidate = 3600;

export const metadata = { title: 'All indicators', alternates: { canonical: '/housing/indicators' } };

const fmtValue = (s) => {
  if (!isNum(s.value)) return 'n/a';
  if (s.unit === 'percent') return `${s.value.toFixed(2)}%`;
  if (/dollars/.test(s.unit)) return `$${fmtNum(s.value)}`;
  if (/index/.test(s.unit)) return fmtNum(s.value, 1);
  return fmtNum(s.value, s.value < 100 ? 1 : 0);
};

export default async function Indicators() {
  const { series, updatedAt } = await getSeries();
  const rows = Object.entries(series)
    .map(([k, v]) => ({ k, ...summarize(v) }))
    .filter((r) => r.value !== undefined)
    .sort((a, b) => a.source.localeCompare(b.source) || a.label.localeCompare(b.label));

  return (
    <>
      <section className="page-head">
        <div className="eyebrow">{updatedAt ? `Updated ${fmtDate(updatedAt)}` : 'Awaiting first data refresh'}</div>
        <h1 className="display">All indicators</h1>
        <p>Every series Housing Watch tracks, with its latest reading and source.</p>
      </section>
      <div className="card table-scroll" style={{ paddingTop: 6 }}>
        <table>
          <thead>
            <tr><th>Series</th><th style={{ textAlign: 'left' }}>Source</th><th>Latest</th><th>As of</th><th>Change</th><th>Y/Y</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k}>
                <td className="name">
                  {r.label}
                  <div className="muted" style={{ fontWeight: 400, fontSize: 13 }}>{r.unit}</div>
                </td>
                <td style={{ textAlign: 'left' }}>
                  {r.id ? <a href={`https://fred.stlouisfed.org/series/${r.id}`}>{r.source}</a> : r.source}
                </td>
                <td className="mono">{fmtValue(r)}</td>
                <td className="mono">{fmtMonth(r.date)}</td>
                <td className="mono">{fmtPct(r.mom)}</td>
                <td className="mono">{fmtPct(r.yoy)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="empty">No data yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
