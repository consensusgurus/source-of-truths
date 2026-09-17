import { getCompanies, getTeam } from '@/lib/housing/data';
import { SEGMENTS, HEALTH_CHECKS, PRODUCT_MAP } from '@/lib/housing/config.mjs';
import { fmtMetric, score, describeCheck, fmtDate, fmtMonth } from '@/lib/housing/format.mjs';
import HealthTabs from '../_components/HealthTabs';

export const revalidate = 3600;

export const metadata = { title: 'Health checks', alternates: { canonical: '/housing/health' } };

export default async function Health() {
  const [{ companies, updatedAt }, team] = await Promise.all([getCompanies(), getTeam()]);

  const segments = Object.entries(SEGMENTS).map(([key, seg]) => {
    const checks = HEALTH_CHECKS[key];
    const rows = seg.companies.map(([ticker, name]) => {
      const sec = companies[ticker];
      const kpi = team.latest?.[ticker];
      const cells = checks.map((c) => {
        const v = c.from === 'team' ? kpi?.[c.key] : sec?.[c.key];
        return { text: fmtMetric(v, c.unit), status: score(v, c) };
      });
      const scored = cells.filter((c) => c.status !== 'none');
      const passes = scored.filter((c) => c.status === 'pass').length;
      const fails = scored.filter((c) => c.status === 'fail').length;
      const periods = [
        sec && `SEC: quarter ended ${fmtDate(sec.periodEnd)}`,
        kpi && `Team KPIs: ${kpi.fiscalPeriod || fmtMonth(kpi.periodEnd)}`,
      ].filter(Boolean).join(' · ');
      return {
        ticker,
        name,
        cells,
        passes,
        scored: scored.length,
        fails,
        period: periods,
        filing: sec?.accn ? `https://www.sec.gov/Archives/edgar/data/${Number(sec.cik)}/${sec.accn.replace(/-/g, '')}/` : null,
      };
    });
    rows.sort((a, b) => (b.scored ? b.passes / b.scored : -1) - (a.scored ? a.passes / a.scored : -1) || a.fails - b.fails);
    return {
      key,
      label: seg.label,
      checks: checks.map((c) => ({ label: c.label, from: c.from, rule: describeCheck(c) })),
      rows,
    };
  });

  const hasTeam = team.rowCount > 0;

  return (
    <>
      <section className="page-head">
        <div className="eyebrow">{updatedAt ? `Filings through ${fmtDate(updatedAt)}` : 'Awaiting first data refresh'}</div>
        <h1 className="display">Health checks</h1>
        <p>
          A pass, watch or fail on the metrics that matter for each part of the chain, from the latest 10-Q or 10-K.
          Hover a column name to see its rule.
        </p>
      </section>

      <HealthTabs segments={segments} />

      {!hasTeam && (
        <p className="note" style={{ marginTop: 14 }}>
          Homebuilder orders, cancellations, margins and lot position come from the team&apos;s models
          and will fill in once the team adds its first quarter.
        </p>
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <h2 className="display">Parts and products map</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>What goes into a new home, and which public companies make or move it.</p>
          </div>
        </div>
        <div className="grid-4">
          {PRODUCT_MAP.map((p) => (
            <div key={p.cat} className="card tile">
              <div className="label" style={{ fontSize: 17 }}>{p.cat}</div>
              <div className="muted" style={{ fontSize: 13 }}>{p.stage}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {p.names.map((n) => <span key={n} className="chip">{n}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
