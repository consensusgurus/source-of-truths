import { SEGMENTS } from '@/lib/housing/config.mjs';

export const metadata = { title: 'Builder models', alternates: { canonical: '/housing/models' } };

export default function Models() {
  return (
    <>
      <section className="page-head">
        <div className="eyebrow">Coming soon</div>
        <h1 className="display">Builder models</h1>
        <p>Operating and financial models for the public homebuilders, built and maintained by the Housing Watch team.</p>
      </section>
      <div className="card tile">
        <div className="label">Coverage</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SEGMENTS.builders.companies.map(([t, n]) => <span key={t} className="chip" title={n}>{t}</span>)}
        </div>
      </div>
    </>
  );
}
