'use client';
// /challenges — YOUR CHALLENGES (owner, 2026-10-15). The tracker the home's
// result card and rail panel link to: the drawing tickets, what was sent, who
// opened it, who finished and how it went. Data: /api/challenge/mine through the
// shared client (lib/challenge-client.js). Mock-up screen 3:
// claude.ai/artifact/YJbzZkVJA4KUnkBEX1d6QK.
import { useEffect, useState } from 'react';
import { useStageTheme } from '@/lib/stage-theme';
import { fetchMine, challengeTotals, markSeen } from '@/lib/challenge-client';
import { challengeFig, challengeResult, RUN_CHALLENGES } from '@/lib/challenge';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { DRAWING } from '@/lib/drawing';
import { TICKET_PATH } from '../TicketDoor';
import MindLoftMark from '../MindLoftMark';

const gameOf = (key) => DAILY_GAME_MAP[key] || RUN_CHALLENGES[key] || null;
const gameName = (key) => { const g = gameOf(key); return g ? g.name : key; };

function ago(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 60) return m <= 1 ? 'just now' : `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

const HUES = ['#2563eb', '#db2777', '#ea580c', '#7c3aed', '#0891b2', '#0f766e', '#65a30d'];
const hueOf = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return HUES[h % HUES.length]; };

// One row per person who opened a link, plus one per link nobody opened.
function rowsOf(data) {
  const out = [];
  for (const c of (data && data.challenges) || []) {
    const you = c.fig || {};
    if (!(c.takes || []).length) {
      out.push({ key: c.cid, ini: '?', av: 'var(--stg-mute2,#78859d)', who: 'Not opened yet', game: gameName(c.game),
        line: `Sent ${ago(c.sentAt)} · your ${challengeFig(you, c.game)}`, pill: 'Sent', k: 'sent', at: c.sentAt });
      continue;
    }
    for (const t of c.takes) {
      const name = t.name || 'A friend';
      if (!t.finishedAt) {
        out.push({ key: t.id, ini: name.slice(0, 1).toUpperCase(), av: hueOf(name), who: name, game: gameName(c.game),
          line: `Opened ${ago(t.openedAt)}, not finished yet`, pill: 'Opened', k: 'opened', at: t.openedAt });
        continue;
      }
      const res = challengeResult(you, t.fig || {}, c.game) || { res: 'tie' };
      const vs = `${challengeFig(t.fig || {}, c.game)} vs your ${challengeFig(you, c.game)}`;
      out.push({
        key: t.id, id: t.id, unseen: !t.seen, ini: name.slice(0, 1).toUpperCase(), av: hueOf(name), who: name, game: gameName(c.game),
        line: `${t.newPlayer ? 'New player · ' : ''}${vs}`,
        pill: t.newPlayer && data.drawingLive && data.named ? '+1 ticket' : res.res === 'win' ? 'You won' : res.res === 'loss' ? 'Beat you' : 'Level',
        k: t.newPlayer && data.drawingLive && data.named ? 'ticket' : res.res === 'win' ? 'won' : res.res === 'loss' ? 'lost' : 'sent',
        at: t.finishedAt,
      });
    }
  }
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

const CSS = `
.chx{min-height:100vh;background:var(--stg-ground,#0b0f1a);color:var(--stg-ink,#e9edf4);font-family:'Manrope',system-ui,-apple-system,sans-serif;}
.chx-cap{display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--stg-line,rgba(255,255,255,.08));}
.chx-cap a{display:flex;align-items:center;gap:8px;color:var(--stg-ink,#e9edf4);text-decoration:none;font-weight:800;font-size:15px;min-height:44px;}
.chx-cap h1{margin:0 0 0 auto;font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute,#8b95a8);}
.chx-w{max-width:720px;margin:0 auto;padding:20px 16px 48px;display:flex;flex-direction:column;gap:14px;}
.chx-tk{display:flex;align-items:center;gap:16px;background:#e8b43a;color:#2a1f04;border-radius:16px;padding:16px 18px;}
.chx-tk svg{flex:none;transform:rotate(-6deg);}
.chx-tk small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;}
.chx-tk b{display:block;font-size:21px;font-weight:800;line-height:1.15;margin-top:3px;}
.chx-tk span{display:block;font-size:13px;font-weight:700;margin-top:3px;}
.chx-fg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--stg-line,rgba(255,255,255,.11));border-radius:14px;overflow:hidden;background:var(--stg-surf,rgba(255,255,255,.043));}
.chx-fg div{padding:12px 4px;text-align:center;border-right:1px solid var(--stg-line,rgba(255,255,255,.08));}
.chx-fg div:last-child{border-right:0;}
.chx-fg b{display:block;font-size:22px;font-weight:800;}
.chx-fg i{display:block;font-style:normal;font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--stg-mute,#8b95a8);text-transform:uppercase;margin-top:2px;}
.chx-eb{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute,#8b95a8);margin-top:4px;}
.chx-ls{border:1px solid var(--stg-line,rgba(255,255,255,.11));border-radius:14px;overflow:hidden;background:var(--stg-surf,rgba(255,255,255,.043));}
.chx-r{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--stg-line,rgba(255,255,255,.08));animation:chxRise .4s ease-out both;}
.chx-r:last-child{border-bottom:0;}
.chx-r.unseen{background:color-mix(in srgb,#e8b43a 10%,transparent);}
.chx-av{flex:none;width:34px;height:34px;border-radius:50%;color:#fff;display:grid;place-items:center;font-size:14px;font-weight:800;}
.chx-tx{flex:1;min-width:0;}
.chx-tx b{display:block;font-size:14.5px;font-weight:800;}
.chx-tx span{display:block;font-size:12.5px;font-weight:600;color:var(--stg-mute,#8b95a8);margin-top:2px;}
.chx-p{flex:none;font-size:11px;font-weight:800;border-radius:999px;padding:4px 10px;}
.chx-p.ticket{background:#e8b43a;color:#2a1f04;}
.chx-p.won{background:color-mix(in srgb,var(--stg-good,#6ee7b7) 22%,transparent);color:var(--stg-good,#6ee7b7);}
.chx-p.lost{background:color-mix(in srgb,var(--stg-bad,#fb7185) 22%,transparent);color:var(--stg-bad,#fb7185);}
.chx-p.opened{background:color-mix(in srgb,var(--stg-acc,#7dd3fc) 20%,transparent);color:var(--stg-acc-ink,var(--stg-acc,#7dd3fc));}
.chx-p.sent{background:var(--stg-line,rgba(255,255,255,.1));color:var(--stg-ink2,#aab5c7);}
.chx-em{padding:22px 16px;text-align:center;color:var(--stg-ink2,#aab5c7);font-weight:600;font-size:14px;line-height:1.5;}
.chx-go{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:12px;background:#2a1f04;color:#fff4d6;font-weight:800;font-size:15px;text-decoration:none;margin-top:6px;}
.stage-page[data-stage-theme=light] .chx-go{background:#2a1f04;}
@keyframes chxRise{0%{transform:translateY(10px);opacity:0}100%{transform:translateY(0);opacity:1}}
@media (prefers-reduced-motion:reduce){.chx-r{animation:none}}
@media (max-width:480px){.chx-fg b{font-size:19px}.chx-tk b{font-size:18px}}
`;

export default function ChallengesClient() {
  const [stageTheme] = useStageTheme();
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetchMine({ force: true }).then((d) => { setData(d); setLoaded(true); });
  }, []);
  const rows = rowsOf(data);
  // Opening the tracker counts as seeing every result on it.
  useEffect(() => {
    const ids = rows.filter((r) => r.unseen && r.id).map((r) => r.id);
    if (ids.length) markSeen(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  const t = challengeTotals(data);
  const named = !!(data && data.named);
  const live = !!(data && data.drawingLive);
  const n = data && Number.isFinite(data.tickets) ? data.tickets : 0;

  return (
    <div className="chx stage-page" data-stage-theme={stageTheme}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="chx-cap">
        <a href="/" aria-label="Mind Loft home">
          <MindLoftMark size={20} ink="var(--stg-ink)" accent="var(--stg-brand,#7dd3fc)" />
          Mind Loft
        </a>
        <h1>Your challenges</h1>
      </div>
      <main className="chx-w">
        {live ? (
          <div className="chx-tk">
            <svg width="72" height="50" viewBox="0 0 96 66" aria-hidden="true">
              <path d={TICKET_PATH} fill="#fff8e6" stroke="#2a1f04" strokeWidth="2.5" />
              <line x1="27" y1="7" x2="27" y2="59" stroke="#2a1f04" strokeWidth="2.5" strokeDasharray="3 4" />
              <text x="61" y="45" textAnchor="middle" fontFamily="inherit" fontSize="30" fontWeight="800" fill="#2a1f04">{named ? n : 0}</text>
            </svg>
            <div>
              <small>The {DRAWING.prizeLabel} drawing · drawn {DRAWING.drawLabel}</small>
              <b>{named ? `${n} ticket${n === 1 ? '' : 's'} in the drum` : 'Pick a name to earn tickets'}</b>
              <span>{named ? 'Each new friend who finishes a game from your link adds one.' : 'Your challenges still work; a name is what turns new friends into tickets.'}</span>
            </div>
          </div>
        ) : null}

        <div className="chx-fg">
          <div><b>{t.sent}</b><i>Sent</i></div>
          <div><b>{t.opened}</b><i>Opened</i></div>
          <div><b>{t.played}</b><i>Played</i></div>
          <div><b style={{ color: 'var(--stg-good,#6ee7b7)' }}>{t.won}–{t.lost}</b><i>Your record</i></div>
        </div>

        <div className="chx-eb">Every link you sent</div>
        <div className="chx-ls">
          {!loaded ? <div className="chx-em">Loading…</div>
            : !rows.length ? (
              <div className="chx-em">
                No challenges yet. Finish any daily puzzle, then press <b>Challenge a friend</b> on the end card.
                When they play it, you will see how it went right here.
              </div>
            ) : rows.map((r, i) => (
              <div key={r.key} className={'chx-r' + (r.unseen ? ' unseen' : '')} style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}>
                <span className="chx-av" style={{ background: r.av }} aria-hidden="true">{r.ini}</span>
                <span className="chx-tx"><b>{r.who} · {r.game}</b><span>{r.line}</span></span>
                <span className={'chx-p ' + r.k}>{r.pill}</span>
              </div>
            ))}
        </div>

        <a className="chx-go" href="/">Play today&rsquo;s puzzles and challenge someone</a>
      </main>
    </div>
  );
}
