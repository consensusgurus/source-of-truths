'use client';
// THE PAGE LOOK MENU (owner, 2026-10-19). Every cap's look icon opens this; the
// one-tap light/dark flip is retired. Two choices:
//
//   Background   Light / Dark            (lib/stage-theme.js, sot_theme2)
//   Color        Balanced / Full color    (lib/stage-theme.js, sot_color1)
//
// TWO SHAPES:
//   * THE INTRO, once per browser, for a NEW reader only. It opens by itself
//     on their first page with a cap, after the entry door and the other home
//     cards have cleared: the page dims, the icon is lit through a hole in the
//     dim, and both choices are spelled out with previews and a Done button.
//     A browser that already had history the day this shipped never sees it
//     (LOOK_INTRO_KEY is stamped 'skip'), so existing readers keep exactly the
//     page they had. It also answers the old light offer, which is retired.
//   * THE DROP-DOWN, every other open: a Light / Dark row and a Balanced /
//     Full color row, under the icon, no dim. Tap outside or Escape closes it.
//
// Mounted ONCE, in the root layout, and opened by openLook(anchor) from
// whichever cap was tapped, so the menu sits under that cap's icon. Portalled
// to <body>, outside any .stage-page, so it cannot read the stage tokens: its
// colours follow the register directly. No apostrophes in
// the CSS: it is a text child of a <style> element and React would escape them.
// ?look=intro previews the intro without stamping anything.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORY_RAMP, CATEGORY_RAMP_DEEP, RAMP_INK } from '@/lib/category-ramp';
import {
  LOOK_EVENT, LOOK_INTRO_KEY, LIGHT_OFFER_KEY, openLook, useStageColor, useStageTheme,
} from '@/lib/stage-theme';

const LEVELS = [
  { id: 'balanced', name: 'Balanced', sub: 'The usual' },
  { id: 'full', name: 'Full color', sub: 'Every tile filled' },
];
// Three real category steps (Word, Trivia, Cards), so a preview is honest about
// what the page will do.
const SAMPLE = [0, 4, 6];

// Any trace of play or a stored register means this browser is not new.
function hasHistory() {
  try {
    const ls = window.localStorage;
    if (ls.getItem(LIGHT_OFFER_KEY) === 'pending') return false; // came in through the door just now
    if (ls.getItem('sot_quiz_identity') || ls.getItem('sot_theme2') || ls.getItem('sot_color1')) return true;
    for (let i = 0; i < ls.length; i += 1) {
      const k = ls.key(i) || '';
      if (!k.startsWith('sot_')) continue;
      if (/^sot_(?!welcome_|hub_|theme|quiz_|vid_|look_|color)[a-z]+_day$/.test(k)) return true;
      if (/^sot_(?!welcome_|hub_|theme|quiz_|vid_|look_|color)[a-z]+_\d/.test(k)) return true;
    }
    return false;
  } catch (e) { return true; }
}

const BUSY = '.ent-door, .prm-scrim, .gpp-scrim, .stw';
function visibleSwitch() {
  try {
    const all = document.querySelectorAll('[data-look]');
    for (const b of all) {
      const r = b.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return b;
    }
  } catch (e) {}
  return null;
}

const Sun = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const Moon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
);
const Tick = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export default function LookSheet() {
  const [at, setAt] = useState(null);
  const [theme, setTheme] = useStageTheme();
  const [color, setColor] = useStageColor();
  const box = useRef(null);
  const opener = useRef(null);
  // THE SWITCH TOGGLES (owner report, 2026-10-24): a tap on the look button
  // while the sheet is open used to close it on pointerdown and reopen it on
  // the click, so it flickered instead of collapsing. The press that closes it
  // is remembered, and the open it would trigger is dropped.
  const justClosed = useRef(0);
  const openNow = useRef(false);

  useEffect(() => {
    const onOpen = (e) => {
      if (Date.now() - justClosed.current < 800) { justClosed.current = 0; return; }
      if (openNow.current && !(e.detail && e.detail.intro)) { openNow.current = false; setAt(null); return; }
      opener.current = document.activeElement;
      setAt(e.detail && e.detail.bottom ? e.detail : { top: 8, bottom: 56, left: window.innerWidth - 60, right: window.innerWidth - 12, intro: !!(e.detail && e.detail.intro) });
    };
    window.addEventListener(LOOK_EVENT, onOpen);
    return () => window.removeEventListener(LOOK_EVENT, onOpen);
  }, []);

  // THE INTRO OPENS ITSELF, once, for a new reader.
  useEffect(() => {
    let preview = false;
    try {
      const q = new URLSearchParams(window.location.search);
      preview = q.get('look') === 'intro';
      if (!preview) {
        if (window.localStorage.getItem(LOOK_INTRO_KEY)) return undefined;
        if (q.get('theme') || q.get('color')) return undefined; // review link: nothing burned
        if (hasHistory()) { window.localStorage.setItem(LOOK_INTRO_KEY, 'skip'); return undefined; }
      }
    } catch (e) { return undefined; }
    let t = 0;
    let tries = 0;
    const tick = () => {
      tries += 1;
      if (tries > 60) return; // ~30s and no cap with an icon: try again next page
      if (document.querySelector(BUSY) || document.querySelector('.lks')) { t = setTimeout(tick, 500); return; }
      const b = visibleSwitch();
      if (!b) { t = setTimeout(tick, 500); return; }
      if (!preview) {
        try {
          window.localStorage.setItem(LOOK_INTRO_KEY, 'shown');
          window.localStorage.setItem(LIGHT_OFFER_KEY, 'done');
        } catch (e) {}
      }
      openLook(b, { intro: true });
    };
    t = setTimeout(tick, 1200);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setAt(null);
    try { if (opener.current && opener.current.focus) opener.current.focus({ preventScroll: true }); } catch (e) {}
  };

  useEffect(() => { openNow.current = !!at; }, [at]);
  useEffect(() => {
    if (!at) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) {
        const t = e.target && e.target.closest ? e.target.closest('[data-look]') : null;
        if (t) justClosed.current = Date.now();
        close();
      }
    };
    const onResize = () => setAt(null);
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('resize', onResize);
    const f = setTimeout(() => {
      try { const b = box.current && box.current.querySelector('[aria-pressed=true],[aria-checked=true]'); if (b) b.focus({ preventScroll: true }); } catch (e) {}
    }, 0);
    return () => {
      clearTimeout(f);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('resize', onResize);
    };
  }, [at]);

  if (!at || typeof document === 'undefined') return null;

  const intro = !!at.intro;
  const dark = theme === 'dark';
  const vw = window.innerWidth;
  const cx = (at.left + at.right) / 2;
  const w = Math.min(intro ? 430 : 290, vw - 24);
  const left = Math.max(12, Math.min(vw - w - 12, cx - w + (intro ? 70 : 52)));
  const top = at.bottom + 10;
  const caret = Math.max(16, Math.min(w - 28, cx - left - 7));

  const mini = (lv, i) => {
    if (lv === 'full') return { box: { background: CATEGORY_RAMP[i], borderColor: CATEGORY_RAMP[i] }, dot: { background: RAMP_INK } };
    return { box: {}, dot: { background: dark ? CATEGORY_RAMP[i] : CATEGORY_RAMP_DEEP[i] } };
  };

  const regButtons = (cls) => ['light', 'dark'].map((t) => (
    <button key={t} type="button" aria-pressed={theme === t} className={cls + (theme === t ? ' on' : '')}
      onClick={() => { if (theme !== t) setTheme(t); }}>
      {cls === 'lks-bg' ? (
        <>
          <span className={'lks-prev ' + t} aria-hidden="true"><i /><i /></span>
          <span className="lks-bgr">
            <span className="lks-bgn">{t === 'light' ? <Sun /> : <Moon />}{t === 'light' ? 'Light' : 'Dark'}</span>
            <span className="lks-tick" aria-hidden="true">{theme === t ? <Tick /> : null}</span>
          </span>
        </>
      ) : (
        <>{t === 'light' ? <Sun /> : <Moon />}{t === 'light' ? 'Light' : 'Dark'}</>
      )}
    </button>
  ));

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {intro ? (
        <>
          <div className="lks-catch" aria-hidden="true" />
          <span className={'lks-hole' + (dark ? ' dk' : '')} aria-hidden="true"
            style={{ left: at.left - 4, top: at.top - 4, width: at.right - at.left + 8, height: at.bottom - at.top + 8 }} />
        </>
      ) : null}
      <i className={'lks-caret' + (dark ? ' dk' : '')} style={{ left: left + caret, top: top - 6 }} aria-hidden="true" />
      <div ref={box} className={'lks' + (dark ? ' dk' : '') + (intro ? ' intro' : '')} role="dialog"
        aria-label={intro ? 'Choose how Mind Loft looks' : 'Page look'}
        style={{ left, top, width: w, maxHeight: `calc(100vh - ${top + 12}px)` }}>
        {intro ? (
          <>
            <div className="lks-hi">
              <span className="lks-ey">New · Page look</span>
              <b>Choose how Mind Loft looks</b>
              <p>Pick a background and how much color the puzzles wear. This button keeps your choice, so you can change it any time.</p>
            </div>
            <span className="lks-l">Background</span>
            <div className="lks-bgs">{regButtons('lks-bg')}</div>
            <span className="lks-l">Color</span>
            <div className="lks-lv">
              {LEVELS.map((lv) => (
                <button key={lv.id} type="button" aria-pressed={color === lv.id} className={color === lv.id ? 'on' : ''}
                  onClick={() => setColor(lv.id)}>
                  <span className="lks-sw" aria-hidden="true">
                    {SAMPLE.map((i) => { const m = mini(lv.id, i); return <i key={i} style={m.box}><u style={m.dot} /></i>; })}
                  </span>
                  <b>{lv.name}</b>
                  <em>{lv.sub}</em>
                </button>
              ))}
            </div>
            <button type="button" className="lks-done" onClick={close}>Done</button>
          </>
        ) : (
          <>
            <div className="lks-seg">{regButtons('lks-sg')}</div>
            <div className="lks-seg" role="group" aria-label="Color">
              {LEVELS.map((lv) => (
                <button key={lv.id} type="button" aria-pressed={color === lv.id}
                  className={'lks-sg' + (color === lv.id ? ' on' : '')} onClick={() => setColor(lv.id)}>
                  <span className={'lks-dots' + (lv.id === 'full' ? ' full' : '')} aria-hidden="true">
                    {SAMPLE.map((i) => <i key={i} style={{ background: lv.id === 'full' ? CATEGORY_RAMP[i] : 'transparent', borderColor: lv.id === 'full' ? CATEGORY_RAMP[i] : (dark ? CATEGORY_RAMP[i] : CATEGORY_RAMP_DEEP[i]) }} />)}
                  </span>
                  {lv.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>,
    document.body,
  );
}

const CSS = `
.lks{position:fixed;z-index:2147483000;box-sizing:border-box;padding:12px;border-radius:16px;overflow:auto;
  background:#ffffff;color:#0b0d12;border:1px solid rgba(11,15,26,.16);box-shadow:0 22px 50px rgba(11,15,26,.28);
  display:flex;flex-direction:column;gap:10px;font-family:Manrope,system-ui,sans-serif;overscroll-behavior:contain;}
.lks.dk{background:#171d2b;color:#e9edf4;border-color:rgba(255,255,255,.16);box-shadow:0 22px 50px rgba(0,0,0,.55);}
.lks.intro{padding:18px;border-radius:18px;gap:12px;}
.lks-caret{position:fixed;z-index:2147483001;width:12px;height:12px;transform:rotate(45deg);background:#ffffff;
  border-left:1px solid rgba(11,15,26,.16);border-top:1px solid rgba(11,15,26,.16);pointer-events:none;}
.lks-caret.dk{background:#171d2b;border-color:rgba(255,255,255,.16);}
.lks-catch{position:fixed;inset:0;z-index:2147482990;background:transparent;}
.lks-hole{position:fixed;z-index:2147482995;border-radius:999px;pointer-events:none;
  box-shadow:0 0 0 3px #2563eb,0 0 0 9px rgba(37,99,235,.22),0 0 0 9999px rgba(11,15,26,.48);}
.lks-hole.dk{box-shadow:0 0 0 3px #7dd3fc,0 0 0 9px rgba(125,211,252,.25),0 0 0 9999px rgba(3,5,10,.66);}
.lks-hi{display:flex;flex-direction:column;gap:6px;}
.lks-ey{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#2563eb;}
.lks.dk .lks-ey{color:#7dd3fc;}
.lks-hi b{font-size:21px;font-weight:800;letter-spacing:-.015em;line-height:1.15;}
.lks-hi p{margin:0;font-size:14px;font-weight:500;line-height:1.45;color:#5f6774;}
.lks.dk .lks-hi p{color:#8b95a8;}
.lks-l{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#5f6774;margin:2px 0 -4px 4px;}
.lks.dk .lks-l{color:#8b95a8;}
.lks.intro .lks-l{margin-left:0;}
.lks button{font:inherit;color:inherit;cursor:pointer;}
.lks button:focus-visible{outline:2px solid #2563eb;outline-offset:2px;}
.lks.dk button:focus-visible{outline-color:#7dd3fc;}
.lks-bgs,.lks-lv{display:grid;gap:8px;}
.lks-bgs{grid-template-columns:repeat(2,minmax(0,1fr));}
.lks-lv{grid-template-columns:repeat(2,minmax(0,1fr));}
.lks-bg,.lks-lv button{display:flex;flex-direction:column;gap:7px;padding:8px;border-radius:12px;text-align:left;
  background:none;border:1.5px solid rgba(11,15,26,.16);}
.lks.dk .lks-bg,.lks.dk .lks-lv button{border-color:rgba(255,255,255,.16);}
.lks-bg.on,.lks-lv button.on{border:2.5px solid #2563eb;padding:7px;box-shadow:0 0 0 3px rgba(37,99,235,.14);}
.lks.dk .lks-bg.on,.lks.dk .lks-lv button.on{border-color:#7dd3fc;box-shadow:0 0 0 3px rgba(125,211,252,.18);}
.lks-prev{display:flex;flex-direction:column;gap:5px;padding:8px;height:52px;box-sizing:border-box;border-radius:8px;}
.lks-prev.light{background:#eef1f6;border:1px solid rgba(11,15,26,.14);}
.lks-prev.dark{background:#0b0f1a;border:1px solid rgba(255,255,255,.12);}
.lks-prev i{display:block;border-radius:3px;}
.lks-prev i:first-child{height:8px;width:60%;}
.lks-prev i:last-child{height:14px;border-radius:4px;}
.lks-prev.light i:first-child{background:#0b0d12;}
.lks-prev.light i:last-child{background:#ffffff;border:1px solid rgba(11,15,26,.14);}
.lks-prev.dark i:first-child{background:#e9edf4;}
.lks-prev.dark i:last-child{background:#141925;border:1px solid rgba(255,255,255,.1);}
.lks-bgr{display:flex;align-items:center;justify-content:space-between;padding:0 2px;}
.lks-bgn{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:800;}
.lks-tick{width:18px;height:18px;border-radius:9px;display:grid;place-items:center;box-sizing:border-box;
  border:1.5px solid rgba(11,15,26,.2);color:#ffffff;}
.lks.dk .lks-tick{border-color:rgba(255,255,255,.2);color:${RAMP_INK};}
.lks-bg.on .lks-tick{border:0;background:#2563eb;}
.lks.dk .lks-bg.on .lks-tick{background:#7dd3fc;}
.lks-sw{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;}
.lks-sw i{display:grid;place-items:center;height:24px;border-radius:5px;box-sizing:border-box;
  background:#ffffff;border:1px solid rgba(11,15,26,.13);}
.lks.dk .lks-sw i{background:#141925;border-color:rgba(255,255,255,.1);}
.lks-sw u{display:block;width:6px;height:6px;border-radius:3px;}
.lks-lv b{font-size:13.5px;font-weight:800;}
.lks-lv em{font-style:normal;font-size:11px;font-weight:600;line-height:1.25;color:#5f6774;}
.lks.dk .lks-lv em{color:#8b95a8;}
.lks-done{height:48px;border-radius:12px;border:0;font-size:15px !important;font-weight:800;background:#2563eb;color:#ffffff !important;flex:none;}
.lks.dk .lks-done{background:#7dd3fc;color:${RAMP_INK} !important;}
.lks-seg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;padding:4px;border-radius:12px;background:#eef1f6;}
.lks.dk .lks-seg{background:#0f1420;}
.lks-sg{display:flex;align-items:center;justify-content:center;gap:8px;height:42px;border-radius:9px;border:0;
  background:none;font-size:14px;font-weight:800;color:#5f6774 !important;}
.lks.dk .lks-sg{color:#8b95a8 !important;}
.lks-sg.on{background:#ffffff;color:#0b0d12 !important;box-shadow:0 1px 3px rgba(11,15,26,.22);}
.lks.dk .lks-sg.on{background:#2b354c;color:#e9edf4 !important;box-shadow:none;}
.lks-dots{display:inline-flex;gap:2px;}
.lks-dots i{display:block;width:8px;height:8px;border-radius:2px;border:1.5px solid;box-sizing:border-box;}
@media (prefers-reduced-motion:no-preference){.lks{animation:lks-in .16s ease-out;}}
@keyframes lks-in{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:none;}}
`;
