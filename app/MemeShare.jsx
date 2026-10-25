'use client';
// SHARE WITH A MEME (owner, 2026-10-23). A bottom sheet built from the same
// parts as the ending's Full details sheet (StageStick .sst-sheet): white
// sheet, the bold header with a Close pill, chips, and filled buttons in the
// category colour. It opens from the full-colour ending AND from the page after
// it, and only ever when the player taps for it; it never opens on its own.
//
// What it shares: a GIF (brag line, the reaction clip, the game strip) plus the
// player's challenge link, which carries their referral code, so a new player
// who finishes from it earns them a drawing ticket exactly as a challenge does.
//
// The GIF is built in the browser as soon as the sheet opens (lib/meme-gif.js)
// so the share sheet can open inside the tap: iOS refuses navigator.share once
// a tap has been spent waiting on async work.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { sharePalette, markSvg, isDarkPage } from '@/lib/share-palette';
import { MEMES, memeOrder, memeCaption } from '@/lib/meme-share';
import { buildMemeGif } from '@/lib/meme-gif';

const CSS = `
.msh-scrim{position:fixed;inset:0;z-index:9100;background:rgba(5,8,14,.5);animation:msh-in .25s ease both;}
.msh{position:fixed;left:0;right:0;bottom:0;z-index:9101;max-width:520px;margin:0 auto;max-height:94vh;max-height:94dvh;overflow-y:auto;
  background:#ffffff;color:#0b0d12;border-radius:20px 20px 0 0;padding:16px 18px max(20px,env(safe-area-inset-bottom));
  box-shadow:0 -10px 40px rgba(0,0,0,.25);font-family:Manrope,system-ui,sans-serif;animation:msh-up .38s cubic-bezier(.2,.8,.2,1) both;}
@keyframes msh-up{from{transform:translateY(100%)}to{transform:none}}
@keyframes msh-in{from{opacity:0}to{opacity:1}}
.msh-hd{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;}
.msh-hd small{display:block;font-size:11.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#5b6475;}
.msh-hd b{font-size:18px;font-weight:800;}
.msh-x{background:#eef1f6;border:0;border-radius:99px;padding:7px 14px;font:inherit;font-size:13px;font-weight:800;color:#0b0d12;cursor:pointer;}
.msh-card{border-radius:14px;overflow:hidden;background:#000;border:1px solid #d6dbe4;}
.msh-cap{padding:12px 14px;text-align:center;font-size:17px;line-height:1.2;font-weight:800;text-transform:uppercase;background:#000;color:#fff;}
.msh-card img{display:block;width:100%;height:auto;background:#111;}
.msh-strip{display:flex;align-items:center;gap:6px;padding:9px 14px;background:#000;color:#fff;font-size:12px;}
.msh-strip .mk{width:16px;height:16px;flex:none;display:block;background:none;}
.msh-strip .br{font-weight:800;}
.msh-strip i{font-style:normal;font-weight:700;margin-left:auto;}
.msh-sl{margin:14px 0 7px;font-size:11.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#5b6475;}
.msh-chips{display:flex;gap:8px;overflow-x:auto;padding-right:24px;scrollbar-width:none;-ms-overflow-style:none;
  -webkit-mask-image:linear-gradient(90deg,#000 85%,transparent);mask-image:linear-gradient(90deg,#000 85%,transparent);}
.msh-chips::-webkit-scrollbar{display:none;}
/* A mouse cannot swipe a hidden-scrollbar row, so on a fine pointer the chips WRAP and every GIF is on show (owner report, 2026-10-23). */
@media (hover:hover) and (pointer:fine){.msh-chips{flex-wrap:wrap;overflow:visible;padding-right:0;-webkit-mask-image:none;mask-image:none;}}
.msh-chip{flex:none;height:36px;padding:0 13px;border-radius:99px;border:1.5px solid #d6dbe4;background:#fff;color:#0b0d12;
  font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;}
.msh-chip.on{background:#0b0d12;border-color:#0b0d12;color:#fff;}
.msh-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}
.msh-ob{min-height:50px;border-radius:14px;border:2px solid #0b0d12;background:#fff;color:#0b0d12;font:inherit;font-size:15px;font-weight:800;cursor:pointer;}
.msh-go{display:block;width:100%;margin-top:10px;min-height:56px;border:0;border-radius:14px;font:inherit;font-size:17px;font-weight:800;cursor:pointer;color:#fff;}
.msh-go:disabled{opacity:.6;cursor:progress;}
.msh-note{margin-top:10px;text-align:center;font-size:12.5px;font-weight:700;color:#5b6475;min-height:17px;}
.msh-ob:hover,.msh-go:hover:not(:disabled){filter:brightness(1.08);}
.msh-ob:focus-visible,.msh-go:focus-visible,.msh-chip:focus-visible,.msh-x:focus-visible{outline:2px solid #0b0d12;outline-offset:2px;}
`;

// THE GIF ON SHOW (owner, 2026-10-24): the GIF the sheet would open on, full
// width and prominent on the page after the full-colour ending, under the share
// doors. Full frame, never cropped (burned-in text stays). A tap opens the
// sheet. The full-colour card itself stays clean: no GIF there.
const PEEK_CSS = `
.msh-peek{display:block;width:100%;margin:4px 0 0;padding:0;border:0;background:#000;border-radius:16px;overflow:hidden;cursor:pointer;
  color:#fff;font-family:Manrope,system-ui,sans-serif;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.18);}
.msh-peek .cap{display:block;padding:12px 14px;font-size:17px;line-height:1.2;font-weight:800;text-transform:uppercase;}
.msh-peek img{display:block;width:100%;height:auto;max-height:min(440px,62vh);object-fit:contain;background:#000;}
.msh-peek .ft{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 14px;font-size:15px;font-weight:800;}
.msh-peek:hover{filter:brightness(1.06);}
.msh-peek:focus-visible{outline:2px solid currentColor;outline-offset:3px;}
`;

export function MemePeek({ ctx, onOpen }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(isDarkPage()); }, []);
  if (!ctx) return null;
  const k = memeOrder(ctx)[0];
  if (!k || !MEMES[k]) return null;
  const pal = sharePalette(ctx.cat, dark);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PEEK_CSS }} />
      <button type="button" className="msh-peek" onClick={onOpen} aria-label={`Share with a meme: ${MEMES[k].name}`}>
        <span className="cap">{memeCaption(k, ctx)}</span>
        <img src={MEMES[k].src} alt={`${MEMES[k].name} reaction GIF`} loading="lazy" />
        <span className="ft" style={{ background: pal.fill, color: pal.onFill }}>Share this GIF <span aria-hidden="true">→</span></span>
      </button>
    </>
  );
}

function isTouch() {
  try { return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { return false; }
}

function download(blob, filename) {
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  } catch (e) { /* nothing to fall back to */ }
}

// ctx: { gameKey, game, cat, hue, fig, timed, won, pb, line1, route }
// getLink(source): returns the player's challenge link (records the send).
export default function MemeShare({ open, onClose, ctx, getLink }) {
  const order = ctx ? memeOrder(ctx) : [];
  const [key, setKey] = useState(null);
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const linkRef = useRef(null);
  const k = key && order.includes(key) ? key : order[0];
  const caption = ctx && k ? memeCaption(k, ctx) : '';
  // The caption takes the reader's register, light or dark; the strip under
  // the clip is a black bar with the Mind Loft row (owner, 2026-10-23). The
  // puzzle's name and description are on the link card beside the GIF.
  const [dark, setDark] = useState(false);
  useEffect(() => { if (open) setDark(isDarkPage()); }, [open]);
  const pal = ctx ? sharePalette(ctx.cat, dark) : null;
  const siteUrl = ctx ? `mindloftdaily.com/${ctx.route}` : '';

  useEffect(() => { if (!open) { setNote(''); linkRef.current = null; } }, [open]);

  // Build the GIF for the template on screen, ahead of the tap.
  useEffect(() => {
    if (!open || !ctx || !k) return undefined;
    let live = true;
    setBlob(null); setBusy(true);
    buildMemeGif({ src: MEMES[k].src, top: caption, url: siteUrl, pal })
      .then((b) => { if (live) { setBlob(b); setBusy(false); } })
      .catch(() => { if (live) { setBusy(false); setNote('Could not make the GIF here. The link still works.'); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, k, caption, siteUrl, dark]);

  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open || !ctx || typeof document === 'undefined') return null;

  const link = () => { if (!linkRef.current) linkRef.current = getLink('meme'); return linkRef.current; };
  const fname = `mind-loft-${ctx.gameKey}.gif`;
  // Beside the GIF the link previews as the bare button (m=1); Copy link keeps
  // the plain link, whose preview carries the whole sentence.
  const memeLink = () => { const u = link(); return u + (u.includes('?') ? '&' : '?') + 'm=1'; };
  const copyLink = (msg, withGif) => {
    const url = withGif ? memeLink() : link();
    try { navigator.clipboard.writeText(url).then(() => setNote(msg || 'Link copied.'), () => setNote(url)); } catch (e) { setNote(url); }
  };
  const share = () => {
    const url = memeLink();
    if (blob) {
      const file = new File([blob], fname, { type: 'image/gif' });
      let canFiles = false;
      try { canFiles = !!(navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { canFiles = false; }
      if (canFiles && isTouch()) {
        navigator.share({ files: [file], text: url }).catch(() => {});
        return;
      }
      // A desktop has no GIF share sheet: save the GIF, put the link on the clipboard.
      download(blob, fname);
      copyLink('GIF saved and link copied. Drop both into a message.', true);
      return;
    }
    // No GIF made: the link goes alone, so it carries the detail.
    if (isTouch() && navigator.share) { navigator.share({ url: link() }).catch(() => {}); return; }
    copyLink();
  };

  return createPortal((
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="msh-scrim" onClick={onClose} />
      <div className="msh" role="dialog" aria-modal="true" aria-label="Share with a meme">
        <div className="msh-hd">
          <div><small>Picked for your result</small><b>{MEMES[k].name}</b></div>
          <button type="button" className="msh-x" onClick={onClose}>Close</button>
        </div>
        <div className="msh-card">
          <div className="msh-cap">{caption}</div>
          <img src={MEMES[k].src} alt={`${MEMES[k].name} reaction GIF`} />
          <div className="msh-strip">
            <img className="mk" alt="" src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markSvg('#ffffff', '#ffffff'))} />
            <b className="br">Mind Loft</b>
            <i>{siteUrl}</i>
          </div>
        </div>
        <div className="msh-sl">Or pick another</div>
        <div className="msh-chips" role="radiogroup" aria-label="Meme">
          {order.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={m === k} className={'msh-chip' + (m === k ? ' on' : '')}
              onClick={() => { setKey(m); setNote(''); }}>{MEMES[m].name}</button>
          ))}
        </div>
        <div className="msh-row">
          <button type="button" className="msh-ob" onClick={() => copyLink()}>Copy link</button>
          <button type="button" className="msh-ob" disabled={!blob} onClick={() => { if (blob) { download(blob, fname); setNote('GIF saved.'); } }}>Save GIF</button>
        </div>
        <button type="button" className="msh-go" style={{ background: pal.cta, color: pal.onCta }} disabled={busy} onClick={share}>
          {busy ? 'Making your GIF…' : 'Share the GIF'}
        </button>
        <div className="msh-note" role="status">{note || 'Each new player who finishes from your link earns you a drawing ticket.'}</div>
      </div>
    </>
  ), document.body);
}
