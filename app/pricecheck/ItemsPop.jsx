'use client';

// THE PRICE CHECK ITEMS POP-UP (owner, 2026-10-02): ten seconds after the
// run's ending settles, the five items come up, NO MATTER WHERE THE PLAYER HAS
// GONE. So the run does not keep its own timer any more: it stamps the due time
// and the items into localStorage (`scheduleItems`), and `PriceCheckItemsGlobal`,
// mounted once in app/layout.js, opens the pop-up on whatever page is on screen
// when the time comes. A client navigation keeps the same timer; a full page
// load reads the stamp back and fires at the time that is left. Once per run:
// opening the items by hand on the run page also spends it. A stamp more than
// STALE_MS past due (the player left the site and came back much later) is
// dropped rather than shown out of nowhere. Closing it hands on to the Trivia
// Gauntlet offer, exactly as the run page did.

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, ExternalLink } from 'lucide-react';
import MoreRunsPop from '../circuits/MoreRuns';
import { PRICE_GAMES, fmtCents } from '@/lib/price-games';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const KEY = 'sot_pc_items';
export const ITEMS_DELAY = 10000;
const STALE_MS = 30 * 60 * 1000;

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Everything the pop-up shows, flattened, so it can render on any page.
export function itemsFor(sections, counted) {
  return sections.map((s, i) => {
    const D = s.day || {};
    return {
      key: s.key, name: s.name, col: (PRICE_GAMES[s.key] && PRICE_GAMES[s.key].tagDark) || '#7dd3fc',
      cat: D.cat || '', title: D.revealName || D.name || '', facts: D.facts || [],
      price: D.price, asOf: D.asOf || '', credit: D.credit || '', creditUrl: D.creditUrl || '',
      href: D.href || '', buy: D.buy || 'See it', sponsored: !!D.sponsored,
      img: D.imgs && D.imgs[0] ? D.imgs[0].src : '', fit: D.fit || '',
      score: counted[i] ? counted[i].score : 0,
    };
  });
}

function readStamp() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
function writeStamp(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

export function scheduleItems(items, delay = ITEMS_DELAY) {
  const cur = readStamp();
  if (cur && cur.day === etToday() && cur.shown) return;
  writeStamp({ day: etToday(), due: Date.now() + delay, shown: false, items });
  try { window.dispatchEvent(new Event('sot-pc-items')); } catch (e) {}
}
// The player opened the items by hand: the timed one is spent.
export function spendItems() {
  const cur = readStamp();
  if (cur) writeStamp({ ...cur, shown: true });
  else writeStamp({ day: etToday(), due: 0, shown: true, items: [] });
}

export function PriceCheckItemsGlobal() {
  const path = usePathname();
  const [items, setItems] = useState(null);
  const [at, setAt] = useState(0);
  const [nudge, setNudge] = useState(false);
  const timer = useRef(null);

  const arm = useCallback(() => {
    clearTimeout(timer.current);
    const s = readStamp();
    if (!s || s.shown || s.day !== etToday() || !s.items || !s.items.length) return;
    const left = s.due - Date.now();
    if (left < -STALE_MS) { writeStamp({ ...s, shown: true }); return; }
    timer.current = setTimeout(() => {
      const now = readStamp();
      if (!now || now.shown) return;
      writeStamp({ ...now, shown: true });
      setAt(0); setItems(now.items);
    }, Math.max(0, left));
  }, []);

  useEffect(() => {
    arm();
    const on = () => arm();
    const onStore = (e) => { if (e.key === KEY) arm(); };
    window.addEventListener('sot-pc-items', on);
    window.addEventListener('storage', onStore);
    return () => { clearTimeout(timer.current); window.removeEventListener('sot-pc-items', on); window.removeEventListener('storage', onStore); };
  }, [arm]);
  // The pop-up is the reveal, so do not leave it up over a page change.
  useEffect(() => { arm(); }, [path, arm]);

  return (
    <>
      {items && <ItemsPop items={items} at={at} setAt={setAt} onClose={() => { setItems(null); setNudge(true); }} />}
      <MoreRunsPop self="pricecheck" ready={nudge} delay={10000} fireOnLeave />
    </>
  );
}

export default function ItemsPop({ items, at, setAt, onClose, closeLabel = 'Close' }) {
  const tabsRef = useRef(null);
  const [arrows, setArrows] = useState({ l: false, r: false });
  const n = items.length;
  const s = items[at] || items[0];
  const measure = useCallback(() => {
    const t = tabsRef.current;
    if (!t) return;
    const over = t.scrollWidth > t.clientWidth + 2;
    setArrows({ l: over && t.scrollLeft > 4, r: over && t.scrollLeft + t.clientWidth < t.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    measure();
    const on = () => measure();
    window.addEventListener('resize', on);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setAt((at + 1) % n);
      if (e.key === 'ArrowLeft') setAt((at + n - 1) % n);
    };
    window.addEventListener('keydown', onKey);
    try { const b = tabsRef.current && tabsRef.current.children[at]; if (b) b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
    const t = setTimeout(measure, 350);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [at, measure, onClose, n, setAt]);
  if (!s) return null;
  return (
    <div className="ip" role="dialog" aria-modal="true" aria-label="Today's Price Check items">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ip-scrim" onClick={onClose} />
      <div className="ip-card">
        <button type="button" className="ip-x" aria-label="Close" onClick={onClose}><X size={18} /></button>
        <div className={`ip-tabwrap${arrows.l ? ' fl' : ''}${arrows.r ? ' fr' : ''}`}>
          {arrows.l && <button type="button" className="ip-arr l" aria-label="Earlier tags" onClick={() => tabsRef.current.scrollBy({ left: -140, behavior: 'smooth' })}>&lsaquo;</button>}
          <div className="ip-tabs" ref={tabsRef} onScroll={measure}>
            {items.map((x, i) => <button key={x.key} type="button" className={i === at ? 'on' : ''} style={{ background: x.col }} onClick={() => setAt(i)}>{x.name}</button>)}
          </div>
          {arrows.r && <button type="button" className="ip-arr r" aria-label="More tags" onClick={() => tabsRef.current.scrollBy({ left: 140, behavior: 'smooth' })}>&rsaquo;</button>}
        </div>
        <div className={`ip-img${s.fit === 'cover' ? ' cover' : ''}`}>{s.img && <img src={s.img} alt={s.title} referrerPolicy="no-referrer" />}</div>
        <div className="ip-body">
          <div className="ip-eb" style={{ color: s.col }}>Price Check · {s.name}{s.cat ? ` · ${s.cat}` : ''}</div>
          <h3>{s.title}</h3>
          {s.facts.length > 0 && <div className="ip-meta">{s.facts.join(' · ')}</div>}
          <div className="ip-price"><b>{fmtCents(s.price)}</b><span>You scored {s.score} / 10</span></div>
          <div className="ip-asof">{s.asOf}</div>
          {s.credit && <div className="ip-credit">{s.creditUrl ? <a href={s.creditUrl} target="_blank" rel="noopener">{s.credit}</a> : s.credit}</div>}
          <div className="ip-act">
            {s.href && <a href={s.href} target="_blank" rel={s.sponsored ? 'noopener sponsored' : 'noopener'}>{s.buy} <ExternalLink size={13} /></a>}
            <button type="button" onClick={onClose}>{closeLabel}</button>
          </div>
          <div className="ip-nav">
            <button type="button" onClick={() => setAt((at + n - 1) % n)}>&larr; Prev</button>
            <span>{at + 1} of {n}</span>
            <button type="button" onClick={() => setAt((at + 1) % n)}>Next &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Self-contained: the run page's palette, set on the root, so the pop-up reads
// the same over the home page, a daily, or the run itself.
const CSS = `
.ip{--ip-panel:#0d1220;--ip-line:rgba(255,255,255,.12);--ip-ink:#e9edf4;--ip-mute:#9aa8c4;--ip-cta:#7dd3fc;--ip-cta-ink:#08222e;position:fixed;inset:0;z-index:4050;display:flex;align-items:center;justify-content:center;padding:16px;font-family:${SANS};color:var(--ip-ink);animation:ipfade .35s ease both}
.ip *{box-sizing:border-box}
.ip-scrim{position:absolute;inset:0;background:rgba(5,7,13,.72);backdrop-filter:blur(3px)}
.ip-card{position:relative;width:100%;max-width:430px;max-height:92vh;overflow-y:auto;scrollbar-width:none;background:var(--ip-panel);border:1px solid var(--ip-line);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);animation:iprise .45s cubic-bezier(.2,1.3,.4,1) both}
.ip-card::-webkit-scrollbar{display:none}
.ip-x{position:absolute;top:10px;right:10px;z-index:3;width:34px;height:34px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.ip-tabwrap{position:relative;margin-right:46px}
.ip-tabs{display:flex;gap:6px;padding:12px 12px 0;overflow-x:auto;scrollbar-width:none;scroll-behavior:smooth}
.ip-tabs::-webkit-scrollbar{display:none}
.ip-tabs button{flex:0 0 auto;font:800 11px ${SANS};letter-spacing:.05em;text-transform:uppercase;border:0;border-radius:5px 7px 7px 5px;padding:6px 10px;cursor:pointer;color:#0b0f1a;opacity:.42;transition:opacity .2s,transform .2s}
.ip-tabs button.on{opacity:1;transform:translateY(-1px)}
.ip-arr{position:absolute;top:10px;width:30px;height:30px;border-radius:50%;border:0;background:var(--ip-panel);color:var(--ip-ink);font:800 16px ${SANS};box-shadow:0 2px 10px rgba(0,0,0,.35);cursor:pointer;z-index:2;padding:0}
.ip-arr.l{left:4px}.ip-arr.r{right:-4px}
.ip-tabwrap:before,.ip-tabwrap:after{content:"";position:absolute;top:0;bottom:0;width:34px;pointer-events:none;opacity:0;transition:opacity .2s;z-index:1}
.ip-tabwrap:before{left:0;background:linear-gradient(90deg,var(--ip-panel),transparent)}
.ip-tabwrap:after{right:0;background:linear-gradient(270deg,var(--ip-panel),transparent)}
.ip-tabwrap.fl:before,.ip-tabwrap.fr:after{opacity:1}
.ip-img{margin:12px 12px 0;height:220px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ip-img img{max-width:92%;max-height:92%;object-fit:contain}
.ip-img.cover img{max-width:none;max-height:none;width:100%;height:100%;object-fit:cover}
.ip-body{padding:14px 16px 14px;text-align:left}
.ip-eb{font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase}
.ip-body h3{margin:4px 0 2px;font-size:18px;font-weight:900;color:var(--ip-ink);font-family:${SANS}}
.ip-meta{color:var(--ip-mute);font-weight:700;font-size:13px}
.ip-price{display:flex;align-items:baseline;gap:10px;margin:10px 0 2px;flex-wrap:wrap}
.ip-price b{font:500 28px ${MONO};color:var(--ip-ink)}
.ip-price span{font-weight:800;font-size:13px;color:var(--ip-mute)}
.ip-asof{font-size:12px;color:var(--ip-mute);font-weight:600;line-height:1.45}
.ip-credit{font-size:10.5px;color:var(--ip-mute);margin-top:4px}
.ip-credit a{color:var(--ip-mute)}
.ip-act{display:flex;gap:8px;margin-top:14px}
.ip-act a,.ip-act button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-align:center;font:800 14px ${SANS};padding:11px 10px;border-radius:11px;text-decoration:none;cursor:pointer}
.ip-act a{background:var(--ip-cta);color:var(--ip-cta-ink);border:0}
.ip-act button{background:transparent;border:1px solid var(--ip-line);color:var(--ip-ink)}
.ip-nav{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font:700 12px ${SANS};color:var(--ip-mute)}
.ip-nav button{background:none;border:0;color:var(--ip-ink);font:800 13px ${SANS};cursor:pointer;padding:6px}
@keyframes ipfade{from{opacity:0}to{opacity:1}}
@keyframes iprise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.ip,.ip-card{animation:none}}
`;
