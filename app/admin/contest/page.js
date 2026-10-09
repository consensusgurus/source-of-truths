import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { T } from '@/lib/theme';
import { CONTEST, contestScore, formatScore } from '@/lib/contest';
import { DRAWING, drawingIsLive } from '@/lib/drawing';
import { buildFraudReview, BANDS, MIN_REFERRALS } from '@/lib/contest-fraud';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contest review | Mind Loft',
  robots: { index: false, follow: false },
};

// Same admin palette as AdminClient and the Campaigns page.
const C = {
  cream: T.surface,
  paper: T.white,
  ink: T.ink,
  faded: T.muted,
  ember: T.accent,
  forest: T.success,
  line: 'rgba(20,22,28,0.30)',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const BAND_STYLE = {
  high:   { bg: '#fef2f2', border: '#fecaca', fg: '#b91c1c', label: 'High' },
  review: { bg: '#fff7ed', border: '#fed7aa', fg: '#c2410c', label: 'Review' },
  low:    { bg: '#f0fdf4', border: '#bbf7d0', fg: '#15803d', label: 'Clear' },
  none:   { bg: '#f8fafc', border: '#e2e8f0', fg: '#64748b', label: '—' },
};

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return iso; }
}
function place(city, region, country) {
  const p = [city, region, country].filter(Boolean);
  return p.length ? p.join(', ') : '—';
}
function device(browser, os, isMobile) {
  const p = [browser, os].filter(Boolean);
  const d = isMobile === true ? 'mobile' : isMobile === false ? 'desktop' : null;
  if (d) p.push(d);
  return p.length ? p.join(' · ') : '—';
}

// The contest board's own arithmetic, re-applied here so the review can show
// what each referrer is actually playing for alongside how they look. The caps
// are per REFERRED PERSON and must be applied before summing (migration 46);
// capping the referrer's total instead would silently disagree with the board.
function boardScore(referrals) {
  let sessions = 0;
  let plays = 0;
  for (const r of referrals) {
    const s = Number(r.sessions || 0);
    const p = Number(r.plays || 0);
    sessions += CONTEST.SESSION_CAP ? Math.min(s, CONTEST.SESSION_CAP) : s;
    plays += CONTEST.PLAY_CAP ? Math.min(p, CONTEST.PLAY_CAP) : p;
  }
  return contestScore({ users: referrals.length, sessions, plays });
}

export default async function ContestReviewPage({ searchParams }) {
  if (!isAdmin()) redirect('/admin/login');

  // Default to the contest window, matching the board being reviewed. ?window=all
  // widens to every referral ever credited, which is what you want when checking
  // whether a suspicious account was already at it before the contest opened.
  // While the $100 ticket drawing runs it is the default window (?window=contest
  // still reviews the August contest); ?window=drawing forces it afterwards.
  const w = searchParams?.window || '';
  const all = w === 'all';
  const drawing = !all && (w === 'drawing' || (w !== 'contest' && drawingIsLive()));
  const WIN = drawing ? DRAWING : CONTEST;
  const start = all ? '1970-01-01T00:00:00Z' : WIN.startsAt;
  const end = all ? new Date(Date.now() + 86400000).toISOString() : WIN.endsAt;

  const { data, error } = await supabaseAdmin.rpc('quiz_contest_referrals', {
    p_start: start,
    p_end: end,
  });

  // Before migration 49 is applied the function does not exist. Say so plainly
  // rather than rendering an empty review that reads as "nothing suspicious".
  const pending = Boolean(error);
  const rows = error ? [] : (data || []);
  const { referrers, totals } = buildFraudReview(rows);

  const th = { textAlign: 'left', padding: '10px 12px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.faded, borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap' };
  const td = { padding: '12px', borderBottom: `1px solid ${C.line}`, fontSize: 14, verticalAlign: 'top' };
  const gth = { textAlign: 'left', padding: '7px 10px', fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.faded, borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap' };
  const gtd = { padding: '8px 10px', borderBottom: `1px solid ${C.line}`, fontSize: 13, verticalAlign: 'top' };
  const card = { background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px' };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: SANS, color: C.ink }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 20px 80px' }}>
        <Link href="/admin" style={{ fontSize: 13, color: C.faded, textDecoration: 'none' }}>
          &larr; Editor&rsquo;s Desk
        </Link>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: '14px 0 6px' }}>Contest review</h1>
        <p style={{ color: C.faded, fontSize: 14, margin: '0 0 18px', maxWidth: 700, lineHeight: 1.55 }}>
          Every referral credited {all ? 'since the site opened' : `between ${WIN.startLabel} and ${WIN.endLabel}`},
          grouped by who earned it and scored on how much the people they brought in look like the same
          person. <strong style={{ color: C.ink }}>Nothing here is a verdict.</strong> Every signal has an
          innocent explanation, so treat a high number as a prompt to open the drill-down and look.
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 26, fontSize: 12 }}>
          <Link
            href="/admin/contest"
            style={{ padding: '6px 12px', borderRadius: 999, textDecoration: 'none', border: `1px solid ${C.line}`, color: all ? C.faded : C.paper, background: all ? 'transparent' : C.ink }}
          >
            Contest window
          </Link>
          <Link
            href="/admin/contest?window=all"
            style={{ padding: '6px 12px', borderRadius: 999, textDecoration: 'none', border: `1px solid ${C.line}`, color: all ? C.paper : C.faded, background: all ? C.ink : 'transparent' }}
          >
            All time
          </Link>
        </div>

        {pending && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '14px 16px', marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>
            <strong>Waiting on the database.</strong> Run{' '}
            <code>supabase/migrations/49_contest_fraud.sql</code> in the Supabase SQL Editor and this page
            fills in. Until then no review is possible, and referral crediting is unaffected.
            <div style={{ marginTop: 8, fontSize: 12, color: C.faded, fontFamily: MONO }}>
              {error?.message || 'quiz_contest_referrals() not found'}
            </div>
          </div>
        )}

        {!pending && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div style={card}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.faded }}>Referrers</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{totals.referrers}</div>
              </div>
              <div style={card}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.faded }}>Referrals</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{totals.referrals}</div>
              </div>
              <div style={card}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.faded }}>High risk</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: totals.high ? BAND_STYLE.high.fg : C.ink }}>{totals.high}</div>
              </div>
              <div style={card}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.faded }}>Worth a look</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: totals.review ? BAND_STYLE.review.fg : C.ink }}>{totals.review}</div>
              </div>
              <div style={card}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.faded }}>Machine data</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{Math.round(totals.ipCoverage * 100)}%</div>
              </div>
            </div>

            {totals.ipCoverage < 1 && totals.referrals > 0 && (
              <div style={{ background: '#f8fafc', border: `1px solid ${C.line}`, borderRadius: 10, padding: '12px 16px', marginBottom: 26, fontSize: 13, color: C.faded, lineHeight: 1.55 }}>
                Machine data (the salted IP hash) only exists for games played after migration 49 was
                applied. The raw addresses were never recorded, so the earlier {100 - Math.round(totals.ipCoverage * 100)}%
                cannot be filled in later. For those referrals the two strongest signals are unavailable and
                the risk number is computed from the geo, device and timing signals alone.
              </div>
            )}
          </>
        )}

        {!pending && referrers.length === 0 && (
          <div style={{ ...card, padding: '28px 20px', fontSize: 14, color: C.faded }}>
            No referrals credited in this window yet.
          </div>
        )}

        {referrers.length > 0 && (
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Referrer</th>
                    <th style={th}>Risk</th>
                    <th style={th}>Referrals</th>
                    <th style={th}>Board score</th>
                    <th style={th}>Same machine as them</th>
                    <th style={th}>Shared machine</th>
                    <th style={th}>Same profile</th>
                    <th style={th}>One and done</th>
                    <th style={th}>Peak hour</th>
                    <th style={th}>Peak day</th>
                  </tr>
                </thead>
                <tbody>
                  {referrers.map((r) => {
                    const b = BAND_STYLE[r.band] || BAND_STYLE.none;
                    const s = r.signals;
                    return (
                      <tr key={r.id}>
                        <td style={{ ...td, fontWeight: 700 }}>
                          {r.username}
                          <div style={{ fontSize: 11, color: C.faded, fontWeight: 400, marginTop: 3 }}>
                            {r.refCode ? <span style={{ fontFamily: MONO }}>{r.refCode}</span> : 'no code'}
                            {!r.hasEmail && <span style={{ color: BAND_STYLE.review.fg }}> · no email</span>}
                          </div>
                        </td>
                        <td style={td}>
                          <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: b.bg, border: `1px solid ${b.border}`, color: b.fg, whiteSpace: 'nowrap' }}>
                            {r.risk == null ? b.label : `${b.label} ${r.risk}`}
                          </span>
                        </td>
                        <td style={{ ...td, fontWeight: 700 }}>{s.n}</td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatScore(boardScore(r.referrals))}</td>
                        <td style={{ ...td, color: s.ipSelf ? BAND_STYLE.high.fg : C.faded, fontWeight: s.ipSelf ? 700 : 400 }}>
                          {s.ipSelf || '—'}
                        </td>
                        <td style={{ ...td, color: s.ipCluster ? BAND_STYLE.review.fg : C.faded, fontWeight: s.ipCluster ? 700 : 400 }}>
                          {s.ipCluster || '—'}
                        </td>
                        <td style={td}>
                          {s.fingerprint}
                          <span style={{ color: C.faded }}>{' / '}{s.n}</span>
                        </td>
                        <td style={td}>
                          {s.oneAndDone}
                          <span style={{ color: C.faded }}>{' / '}{s.n}</span>
                        </td>
                        <td style={td}>{s.burst > 1 ? s.burst : '—'}</td>
                        <td style={td}>
                          {s.sameDay > 1 ? s.sameDay : '—'}
                          {s.sameDay > 1 && s.sameDayKey && (
                            <div style={{ fontSize: 11, color: C.faded, marginTop: 3 }}>{s.sameDayKey}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {referrers.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Referral detail</h2>
            <p style={{ color: C.faded, fontSize: 13, margin: '0 0 18px', maxWidth: 700, lineHeight: 1.55 }}>
              The individual people behind each referrer&rsquo;s count, with where and on what they played
              their first game. The referrer&rsquo;s own most recent game is shown at the top of each panel,
              so you can see at a glance whether the people they brought in look like them.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {referrers.map((r) => {
                const b = BAND_STYLE[r.band] || BAND_STYLE.none;
                return (
                  <details key={r.id} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
                    <summary style={{ cursor: 'pointer', listStyle: 'revert', padding: '14px 16px', fontSize: 15, fontWeight: 700 }}>
                      {r.username}
                      <span style={{ color: b.fg, fontWeight: 700 }}>
                        {'  '}· {r.risk == null ? `under ${MIN_REFERRALS} referrals` : `${b.label} ${r.risk}`}
                      </span>
                      <span style={{ color: C.faded, fontWeight: 500 }}>
                        {'  '}· {r.signals.n} referral{r.signals.n === 1 ? '' : 's'}
                      </span>
                    </summary>
                    <div style={{ padding: '0 16px 16px' }}>
                      <div style={{ fontSize: 13, color: C.faded, marginBottom: 12, lineHeight: 1.6 }}>
                        <div>
                          <strong style={{ color: C.ink }}>Plays from:</strong>{' '}
                          {place(r.self.city, r.self.region, r.self.country)}
                          {' · '}
                          {device(r.self.browser, r.self.os, r.self.isMobile)}
                          {r.self.timezone ? ` · ${r.self.timezone}` : ''}
                        </div>
                        <div>
                          <strong style={{ color: C.ink }}>Joined:</strong> {fmtDate(r.createdAt)}
                        </div>
                      </div>

                      {r.flags.length > 0 && (
                        <ul style={{ margin: '0 0 14px', paddingLeft: 18, fontSize: 13, color: b.fg, lineHeight: 1.7 }}>
                          {r.flags.map((f) => <li key={f}>{f}</li>)}
                        </ul>
                      )}

                      <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={gth}>Referred</th>
                                <th style={gth}>Credited</th>
                                <th style={gth}>Games</th>
                                <th style={gth}>Days</th>
                                <th style={gth}>Where</th>
                                <th style={gth}>Device</th>
                                <th style={gth}>Came from</th>
                                <th style={gth}>Machine</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.referrals.map((x) => (
                                <tr key={x.referred_key}>
                                  <td style={gtd}>
                                    {x.referred_username || 'Anonymous'}
                                    <div style={{ fontFamily: MONO, fontSize: 11, color: C.faded, marginTop: 2 }}>
                                      {String(x.referred_key || '').slice(0, 12)}
                                    </div>
                                  </td>
                                  <td style={{ ...gtd, color: C.faded, whiteSpace: 'nowrap' }}>{fmtDate(x.credited_at)}</td>
                                  <td style={{ ...gtd, fontWeight: Number(x.plays || 0) <= 1 ? 700 : 400 }}>{x.plays}</td>
                                  <td style={gtd}>{x.sessions}</td>
                                  <td style={{ ...gtd, color: C.faded }}>{place(x.city, x.region, x.country)}</td>
                                  <td style={{ ...gtd, color: C.faded }}>{device(x.ua_browser, x.ua_os, x.is_mobile)}</td>
                                  <td style={{ ...gtd, color: C.faded }}>{x.referrer_host || '—'}</td>
                                  <td style={gtd}>
                                    {x.ip_match_referrer === true ? (
                                      <span style={{ color: BAND_STYLE.high.fg, fontWeight: 700 }}>same as referrer</span>
                                    ) : x.ip_hash ? (
                                      <span style={{ fontFamily: MONO, fontSize: 11, color: C.faded }}>{x.ip_hash}</span>
                                    ) : (
                                      <span style={{ color: C.faded }}>—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 34, fontSize: 13, color: C.faded, lineHeight: 1.65, maxWidth: 720 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: C.ink, margin: '0 0 8px' }}>How the risk number is built</h3>
          <p style={{ margin: '0 0 8px' }}>
            Six signals, weighted out of 100:{' '}
            <strong style={{ color: C.ink }}>same machine as the referrer</strong> (40),{' '}
            <strong style={{ color: C.ink }}>shared machine between referrals</strong> (25),{' '}
            <strong style={{ color: C.ink }}>same city, browser and OS</strong> (15),{' '}
            <strong style={{ color: C.ink }}>one game and gone</strong> (10),{' '}
            <strong style={{ color: C.ink }}>credited inside one hour</strong> (5),{' '}
            <strong style={{ color: C.ink }}>credited on one day</strong> (5).
            {' '}{BANDS.high}+ bands High, {BANDS.review}+ bands Review. Accounts with fewer than{' '}
            {MIN_REFERRALS} referrals are not scored, because with one or two every share is 0 or 1 and
            means nothing.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            The last four signals have a tolerance built in, so telling six local friends who all own
            iPhones scores nothing. Only the excess above what a normal referrer looks like counts.
          </p>
          <p style={{ margin: 0 }}>
            The IP is <strong style={{ color: C.ink }}>never stored</strong>. What is stored is a salted
            SHA-256 truncated to 16 characters, which can say &ldquo;these two games came from the same
            connection&rdquo; and nothing else. It cannot be turned back into an address, and it is not
            shown to anyone but you.
          </p>
        </div>
      </div>
    </div>
  );
}
