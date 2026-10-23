'use client';
// FINISHED ON ANOTHER DEVICE (owner, 2026-10-23). A player who finished today's
// board on one device and opens the game on another used to get the start
// gate, with no way to share the result: the end card lives on the device that
// played. This bar reads the result from the server (daily-me perGame, the same
// read the end card makes) and offers Challenge a friend and Share with a meme,
// built from that saved row.
//
// Renders nothing when this device holds today's finished board itself (its end
// card already does the job), on an archive replay (?p=), for a guest with no
// row, and on an abandoned run. Read in an effect: the server has no device.
import { useEffect, useState } from 'react';
import MemeShare from './MemeShare';
import { DAILY_GAMES, etTodayISO } from '@/lib/daily-games';
import { categoryAccentInkLight } from '@/lib/category-ramp';
import { encodeChallenge, challengeFig, ymdCompact } from '@/lib/challenge';
import { newCid, withCid, recordSend } from '@/lib/challenge-client';
import { withRef } from '@/lib/referrals';
import { savedIdentity } from '@/lib/saved-identity';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from './dailyMeClient';

const CSS = `
.odb{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 14px;padding:10px 16px;
  background:var(--stg-acc,#0369a1);color:var(--stg-onramp,#08222e);font-family:Manrope,system-ui,sans-serif;text-align:center;}
.odb .tx{display:flex;flex-direction:column;gap:1px;min-width:0;}
.odb .tx b{font-size:14.5px;font-weight:800;line-height:1.25;}
.odb .tx i{font-style:normal;font-size:12.5px;font-weight:700;}
.odb .bt{display:flex;gap:8px;}
.odb button{min-height:36px;padding:0 14px;border-radius:99px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;
  border:2px solid var(--stg-onramp,#08222e);background:var(--stg-onramp,#08222e);color:var(--stg-acc,#0369a1);}
.odb button.ol{background:transparent;color:var(--stg-onramp,#08222e);}
.odb button:focus-visible{outline:2px solid var(--stg-onramp,#08222e);outline-offset:2px;}
.odb .msg{flex-basis:100%;font-size:12.5px;font-weight:700;}
body:has(.stf) .odb,body:has(.sst) .odb{display:none;}
`;

const mmss = (t) => { const s = Math.max(0, Math.round(Number(t) || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export default function OtherDeviceBar({ gameKey }) {
  const [res, setRes] = useState(null);
  const [meme, setMeme] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!gameKey) return undefined;
    let live = true;
    try {
      if (/[?&]p=\d+/.test(window.location.search)) return undefined;
      const day = JSON.parse(localStorage.getItem(`sot_${gameKey}_day`) || 'null');
      if (day && day.d === etTodayISO() && day.done) return undefined;
    } catch (e) { /* no storage: ask the server */ }
    const id = dailyMeIdentity();
    if (!id.anonId && !id.email) return undefined;
    fetchDailyMe(dailyMeQuery({ ...id, game: gameKey }))
      .then((d) => {
        if (!live || !d) return;
        const pg = d.perGame && d.perGame[gameKey];
        const g = (d.games || []).find((x) => x.key === gameKey);
        if (!pg || pg.abandoned || !g) return;
        setRes({ ...pg, num: g.num });
      })
      .catch(() => {});
    // A finish on THIS device hands over to its own end card.
    const off = () => setRes(null);
    window.addEventListener('sot:daily-updated', off);
    return () => { live = false; window.removeEventListener('sot:daily-updated', off); };
  }, [gameKey]);

  if (!res) return null;
  const meta = DAILY_GAMES.find((g) => g.key === gameKey);
  if (!meta) return null;
  const total = Number(res.total) || 0;
  const score = Number(res.score) || 0;
  const won = total > 0 && score >= total;
  const t = won && res.time != null && Number(res.time) > 0 ? Math.round(Number(res.time)) : null;
  const mine = { name: '', t, s: score, o: total, n: res.num, won, m: null };
  const fig = challengeFig(mine, gameKey);
  const rank = res.rank != null && res.field ? `#${res.rank} of ${res.field}` : '';

  const link = (source) => {
    const who = savedIdentity().username || 'A friend';
    const d = ymdCompact(etTodayISO());
    const raw = encodeChallenge({ ...mine, name: who, d });
    const cid = newCid();
    const url = withRef(withCid(`${window.location.origin}/vs?g=${encodeURIComponent(gameKey)}&vs=${encodeURIComponent(raw)}&v=3`, cid));
    recordSend({ cid, gameKey, num: res.num, day: etTodayISO(), fig: mine, source });
    return url;
  };
  const challenge = () => {
    const url = link('otherdevice');
    let touch = false;
    try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
    if (touch && navigator.share) { navigator.share({ url }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(url).then(() => setMsg('Link copied. Paste it to a friend.'), () => setMsg(url)); } catch (e) { setMsg(url); }
  };
  let dLab = '';
  try { dLab = new Date(`${etTodayISO()}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch (e) { dLab = ''; }
  const ctx = {
    gameKey, game: meta.name, cat: meta.cat, hue: categoryAccentInkLight(meta.cat),
    fig, timed: t != null, won, pb: false,
    line1: [meta.name, dLab, rank].filter(Boolean).join(' · '),
    route: String(meta.href || `/${gameKey}`).replace(/^\//, ''),
  };

  return (
    <div className="odb" role="status">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span className="tx">
        <b>You finished today&rsquo;s {meta.name} on another device</b>
        <i>{[t != null ? mmss(t) : (total ? `${score}/${total}` : ''), rank].filter(Boolean).join(' · ')}</i>
      </span>
      <span className="bt">
        <button type="button" onClick={challenge}>Challenge a friend</button>
        <button type="button" className="ol" onClick={() => setMeme(true)}>Share with a meme</button>
      </span>
      {msg ? <span className="msg">{msg}</span> : null}
      <MemeShare open={meme} onClose={() => setMeme(false)} ctx={ctx} getLink={link} />
    </div>
  );
}
