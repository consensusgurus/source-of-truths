import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { funnel } from '@/lib/challenge-server';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { RUN_CHALLENGES } from '@/lib/challenge';

// THE CHALLENGE FUNNEL (owner, 2026-10-15): every step a Challenge a friend
// link goes through, from the rows migration 60 keeps. Admin cookie only.
//   ?days=7 (default) | 30 | 60
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Challenges | Mind Loft admin', robots: { index: false, follow: false } };

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '–');
const nameOf = (k) => (DAILY_GAME_MAP[k] || RUN_CHALLENGES[k] || { name: k }).name;

export default async function AdminChallenges({ searchParams }) {
  if (!isAdmin()) redirect('/admin/login');
  const days = [7, 30, 60].includes(Number(searchParams && searchParams.days)) ? Number(searchParams.days) : 7;
  let f = null; let err = '';
  try { f = await funnel(supabaseAdmin, { days }); } catch (e) { err = (e && e.message) || 'Could not read the challenge tables. Has migration 60 been applied?'; }
  const steps = f ? [
    ['Links sent', f.sent],
    ['Links opened', f.linksOpened],
    ['People who opened', f.opens],
    ['Games finished', f.finishes],
    ['New players', f.newPlayers],
  ] : [];
  const top = steps.length ? Math.max(1, steps[0][1]) : 1;
  const card = { background: '#fff', border: '1px solid rgba(20,22,28,.14)', borderRadius: 14, padding: '18px 20px' };
  return (
    <main style={{ fontFamily: SANS, background: '#eef1f6', minHeight: '100vh', color: '#0b0d12', padding: '28px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#5f6774' }}><Link href="/admin" style={{ color: '#5f6774' }}>Admin</Link> · Challenges</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', margin: '4px 0 0' }}>Challenge funnel, last {days} days</h1>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[7, 30, 60].map((d) => (
              <Link key={d} href={`/admin/challenges?days=${d}`} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 800, textDecoration: 'none', border: '1.5px solid ' + (d === days ? '#0b0d12' : 'rgba(11,15,26,.2)'), background: d === days ? '#0b0d12' : '#fff', color: d === days ? '#fff' : '#0b0d12' }}>{d} days</Link>
            ))}
          </div>
        </div>
        {err ? <div style={{ ...card, color: '#be123c', fontWeight: 700 }}>{err}</div> : null}
        {f ? (
          <>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Every step a link goes through</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, alignItems: 'end', height: 240, marginTop: 14 }}>
                {steps.map(([label, n], i) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{n}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#5f6774' }}>{i === 0 ? 'start' : `${pct(n, steps[i - 1][1])} of prev`}</div>
                    <div style={{ width: '100%', height: `${Math.max(2, (n / top) * 100)}%`, background: i === steps.length - 1 ? '#e8b43a' : '#2563eb', borderRadius: '8px 8px 3px 3px' }} />
                    <div style={{ fontSize: 12, fontWeight: 800, textAlign: 'center', minHeight: 30 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Top games by links sent</div>
                {f.games.length ? f.games.map(([k, n]) => (
                  <div key={k} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 40px', gap: 8, alignItems: 'center', padding: '5px 0' }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{nameOf(k)}</span>
                    <span style={{ height: 10, background: '#e6e9ef', borderRadius: 5, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${(n / f.games[0][1]) * 100}%`, background: '#2563eb' }} /></span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, textAlign: 'right' }}>{n}</span>
                  </div>
                )) : <div style={{ fontSize: 13, color: '#5f6774' }}>Nothing sent in this window yet.</div>}
              </div>
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>The rest</div>
                <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Distinct senders', f.senders],
                      ['Finished: sender won', f.senderWins],
                      ['Finished: friend won', f.takerWins],
                      ['Open rate (links opened / sent)', pct(f.linksOpened, f.sent)],
                      ['Finish rate (finished / opened)', pct(f.finishes, f.opens)],
                      ...f.sources.map(([s, n]) => [`Sent from ${s === 'endcard' ? 'daily end card' : s === 'run' ? 'a run' : s}`, n]),
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid rgba(11,15,26,.08)' }}><td style={{ padding: '7px 0', fontWeight: 600 }}>{k}</td><td style={{ textAlign: 'right', fontWeight: 800 }}>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 11.5, color: '#5f6774', marginTop: 10, lineHeight: 1.4 }}>A new player had no play on record before opening the link. Drawing tickets are still counted from referrals, on the drawing board.</div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
