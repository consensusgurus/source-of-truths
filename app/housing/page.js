import { getSeries, summarize, tail } from '@/lib/housing/data';
import { fmtMonth, fmtDate, fmtPct, fmtThousands, fmtCount, fmtDollars, fmtNum, isNum } from '@/lib/housing/format.mjs';
import Sparkline from './_components/Sparkline';
import PipelineChart from './_components/PipelineChart';
import LineChart, { Legend } from './_components/LineChart';

export const revalidate = 3600;

export const metadata = { title: { absolute: 'Housing Watch | US housing data, from permit to sale' } };

const Change = ({ v, suffix = 'y/y' }) =>
  isNum(v) ? <span className={`mono chg ${v > 0 ? 'up' : v < 0 ? 'down' : ''}`}>{fmtPct(v)} {suffix}</span> : <span className="mono chg muted">n/a {suffix}</span>;

export default async function HousingHome() {
  const { series, updatedAt } = await getSeries();
  const S = (k) => summarize(series[k]);
  const hasData = Object.keys(series).length > 0;

  const stages = [
    ['01', 'Permits', 'permits', 'Authorized, SAAR'],
    ['02', 'Starts', 'starts', 'Begun, SAAR'],
    ['03', 'Under way', 'underConstruction', 'Under construction, SA'],
    ['04', 'Completions', 'completions', 'Finished, SAAR'],
    ['05', 'New home sales', 'newSales', 'Single-family, SAAR'],
  ];
  const latestMonth = S('starts')?.date;

  const existing = S('existingSales');
  const supply = S('monthsSupply');
  const rate = S('mortgage30');

  const dom = S('redfinDom') ?? S('medianDaysRealtor');
  const pulse = [
    { k: 'zhvi', label: 'Home values', fmt: fmtDollars },
    { k: 'activeListings', label: 'Active listings', fmt: fmtCount },
    { s: dom, label: 'Days on market', fmt: (v) => fmtNum(v) },
    { k: 'caseShiller', label: 'National home prices', fmt: (v) => fmtNum(v, 1) },
  ];

  const ten = (k) => tail(series[k]?.obs, 120);
  const pipelineSets = {
    total: [
      { name: 'Permits', color: 'var(--accent)', obs: ten('permits') },
      { name: 'Starts', color: 'var(--ink)', obs: ten('starts') },
      { name: 'Completions', color: 'var(--chart-3)', obs: ten('completions') },
    ],
    single: [
      { name: 'Permits', color: 'var(--accent)', obs: ten('permits1') },
      { name: 'Starts', color: 'var(--ink)', obs: ten('starts1') },
      { name: 'Completions', color: 'var(--chart-3)', obs: ten('completions1') },
    ],
  };

  const prices = [
    { name: 'Median new home (Census)', color: 'var(--accent)', obs: ten('medianNewPrice') },
    { name: 'Zillow home value index', color: 'var(--ink)', obs: ten('zhvi') },
    { name: 'Median sale price (Redfin)', color: 'var(--chart-3)', obs: ten('redfinMedianPrice') },
  ].filter((s) => s.obs.length);
  const rates = [{ name: '30-year fixed', color: 'var(--accent)', obs: ten('mortgage30') }].filter((s) => s.obs.length);

  const regions = [
    ['Northeast', 'NE'], ['Midwest', 'MW'], ['South', 'S'], ['West', 'W'],
  ].map(([name, k]) => ({ name, permits: S(`permits${k}`), starts: S(`starts${k}`), sales: S(`newSales${k}`) }));
  regions.push({ name: 'United States', permits: S('permits'), starts: S('starts'), sales: S('newSales'), total: true });

  return (
    <>
      <section className="page-head">
        <div className="eyebrow">
          {latestMonth ? `${fmtMonth(latestMonth)} data · updated ${fmtDate(updatedAt)}` : 'Awaiting first data refresh'}
        </div>
        <h1 className="display">The build pipeline</h1>
        <p>Every new home, from permit to sale.</p>
      </section>

      {!hasData && (
        <div className="card empty">
          The first data refresh has not run yet. It runs daily at 13:30 UTC, or by hand at <code>/api/cron/housing?part=macro</code> while signed in as admin.
        </div>
      )}

      {hasData && (
        <>
          <div className="card pipeline">
            {stages.map(([n, label, key, unit], i) => {
              const s = S(key);
              return (
                <div key={key} className={i === 0 ? 'first' : ''}>
                  <div className="eyebrow">{n} · {label}</div>
                  <div className="big">{s ? fmtThousands(s.value) : 'n/a'}</div>
                  <div className="muted" style={{ fontSize: 14 }}>{unit}{s && s.date !== latestMonth ? ` · ${fmtMonth(s.date)}` : ''}</div>
                  <Sparkline obs={tail(s?.obs, 36)} color={i === 0 ? 'var(--accent)' : 'var(--ink)'} />
                  <Change v={s?.yoy} />
                </div>
              );
            })}
          </div>

          <div className="strip">
            <span>Existing home sales<b className="mono">{existing ? fmtCount(existing.value) : 'n/a'}</b> {existing && <span className="muted mono" style={{ fontSize: 12 }}>{fmtMonth(existing.date)}</span>}</span>
            <span>Months&apos; supply, new<b className="mono">{supply ? supply.value.toFixed(1) : 'n/a'}</b></span>
            <span>30-year fixed<b className="mono">{rate ? `${rate.value.toFixed(2)}%` : 'n/a'}</b> {rate && <span className="muted mono" style={{ fontSize: 12 }}>week of {fmtDate(rate.date)}</span>}</span>
          </div>

          <section className="section">
            <div className="section-head">
              <h2 className="display">Market pulse</h2>
              <a href="/housing/indicators" style={{ fontWeight: 600 }}>All indicators</a>
            </div>
            <div className="grid-4">
              {pulse.map((p) => {
                const s = p.s ?? S(p.k);
                return (
                  <div key={p.label} className="card tile">
                    <div className="label">{p.label}</div>
                    <div className="value">{s ? p.fmt(s.value) : 'n/a'}</div>
                    <div className="meta">{s ? `${s.source} · ${fmtMonth(s.date)}` : 'not available'}</div>
                    <Change v={s?.yoy} />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="section grid-5-3-2">
            <PipelineChart sets={pipelineSets} />
            <div className="card" style={{ paddingTop: 8 }}>
              <div style={{ padding: '18px 18px 6px' }}>
                <h2 className="display" style={{ fontSize: 21 }}>By region</h2>
                <div className="note">{latestMonth ? `${fmtMonth(latestMonth)}, SAAR thousands` : ''}</div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Region</th><th>Permits</th><th>Starts</th><th>New sales</th></tr></thead>
                  <tbody>
                    {regions.map((r) => (
                      <tr key={r.name}>
                        <td className="name" style={r.total ? { fontWeight: 800 } : undefined}>{r.name}</td>
                        {[r.permits, r.starts, r.sales].map((s, i) => (
                          <td key={i} className="mono" title={s && isNum(s.yoy) ? `${fmtPct(s.yoy)} y/y` : undefined}>
                            {s ? fmtNum(s.value) : 'n/a'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="section grid-2">
            <div className="card chart-card">
              <h2 className="display">Home prices</h2>
              <Legend items={prices} />
              <LineChart series={prices} label="Home prices, last ten years" format="dollarsK" />
              <div className="note mono">Census median is quarterly · Zillow and Redfin are monthly</div>
            </div>
            <div className="card chart-card">
              <h2 className="display">30-year mortgage rate</h2>
              <Legend items={rates} />
              <LineChart series={rates} area label="30-year fixed mortgage rate, last ten years" format="pct1" />
              <div className="note mono">Weekly · Freddie Mac Primary Mortgage Market Survey</div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
