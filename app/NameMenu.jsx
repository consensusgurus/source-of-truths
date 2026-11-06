'use client';
// THE NAME MENU (owner, 2026-11-06). The signed-in name on the home cap (the
// desktop chip and the phone pill) opens a small drop-down instead of going
// straight to the profile:
//   Stats     the player's profile, where the name used to go on its own
//   Log out   asks once ("Log out of <name> on this device?"), then signs the
//             browser out and reloads as a guest. See lib/sign-out.js for what
//             logging out clears and why the browser gets a fresh id.
// Why: a player who typed the wrong details had no way to start over.
//
// The trigger stays a link with the className it had, so every existing chip/pill rule
// (hover fill, phone sizing, hiding at narrow widths) still applies. The menu is
// portalled to <body> with fixed positioning because the phone figure row
// scrolls sideways and would clip anything absolutely placed inside it. It is
// outside any .stage-page, so its colours follow the register directly.
// Rows fill to the menu's edges on hover (owner, 2026-10-30). No apostrophes in
// the CSS: it is a text child of a <style> element.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStageTheme } from '@/lib/stage-theme';
import { signOut } from '@/lib/sign-out';

export default function NameMenu({ name, href, className, children, title }) {
  const [at, setAt] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [theme] = useStageTheme();
  const btn = useRef(null);
  const box = useRef(null);

  const close = (refocus) => {
    setAt(null);
    setConfirm(false);
    if (refocus) { try { btn.current && btn.current.focus({ preventScroll: true }); } catch (e) {} }
  };

  const toggle = () => {
    if (at) { close(false); return; }
    const r = btn.current ? btn.current.getBoundingClientRect() : null;
    if (!r) return;
    setConfirm(false);
    setAt({ top: r.bottom + 8, right: Math.max(12, window.innerWidth - r.right) });
  };

  useEffect(() => {
    if (!at) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(true); };
    const onDown = (e) => {
      if (box.current && box.current.contains(e.target)) return;
      if (btn.current && btn.current.contains(e.target)) return;
      close(false);
    };
    const onMove = () => close(false);
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, { passive: true });
    const f = setTimeout(() => {
      try { const b = box.current && box.current.querySelector('a,button'); if (b) b.focus({ preventScroll: true }); } catch (e) {}
    }, 0);
    return () => {
      clearTimeout(f);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove);
    };
  }, [at]);

  const dark = theme === 'dark';

  return (
    <>
      {/* An <a> on purpose: the chip and pill rules are written for a.sty-who and
          .sty-mpill links, and with no script it still opens the profile. */}
      <a ref={btn} href={href} className={className} title={title}
        aria-haspopup="menu" aria-expanded={!!at}
        onClick={(e) => { e.preventDefault(); toggle(); }}>
        {children}
        <svg className="nmm-car" viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="currentColor"
          strokeWidth="1.8" aria-hidden="true" style={{ marginLeft: 6, flex: 'none' }}>
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </a>
      {at && typeof document !== 'undefined' ? createPortal(
        <>
          <style dangerouslySetInnerHTML={{ __html: CSS }} />
          <div ref={box} className={'nmm' + (dark ? ' dk' : '') + (confirm ? ' cf' : '')}
            role={confirm ? 'dialog' : 'menu'} aria-label={confirm ? 'Log out' : name}
            style={{ top: at.top, right: at.right }}>
            {confirm ? (
              <>
                <p className="nmm-q">Log out of <b>{name}</b> on this device?</p>
                <div className="nmm-ab">
                  <button type="button" className="nmm-b" onClick={() => close(true)}>Cancel</button>
                  <button type="button" className="nmm-b go"
                    onClick={() => { if (signOut()) window.location.reload(); }}>Log out</button>
                </div>
              </>
            ) : (
              <>
                <a role="menuitem" className="nmm-r" href={href}>
                  Stats
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M5 19V11M12 19V5M19 19v-6" /></svg>
                </a>
                <button role="menuitem" type="button" className="nmm-r" onClick={() => setConfirm(true)}>
                  Log out
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" /></svg>
                </button>
              </>
            )}
          </div>
        </>,
        document.body,
      ) : null}
    </>
  );
}

const CSS = `
.nmm{position:fixed;z-index:2147483000;width:200px;box-sizing:border-box;border-radius:14px;overflow:hidden;
  background:#ffffff;color:#0b0d12;border:1px solid #0b0d12;box-shadow:0 18px 40px rgba(11,15,26,.22);
  display:flex;flex-direction:column;font-family:Manrope,system-ui,sans-serif;}
.nmm.dk{background:#171d2b;color:#e9edf4;border-color:#e9edf4;box-shadow:0 18px 40px rgba(0,0,0,.55);}
.nmm.cf{width:240px;padding:14px;gap:12px;}
@media (prefers-reduced-motion:no-preference){.nmm{animation:nmm-in .14s ease-out;}}
@keyframes nmm-in{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:none;}}
.nmm-r{display:flex;align-items:center;justify-content:space-between;height:48px;box-sizing:border-box;padding:0 16px;
  margin:0;border:0;background:none;font:inherit;font-size:14px;font-weight:800;color:inherit !important;
  text-decoration:none;text-align:left;cursor:pointer;}
.nmm-r + .nmm-r{border-top:1px solid rgba(11,15,26,.2);}
.nmm.dk .nmm-r + .nmm-r{border-top-color:rgba(255,255,255,.2);}
.nmm-r:hover,.nmm-r:focus-visible{background:#0b0d12;color:#ffffff !important;outline:none;}
.nmm.dk .nmm-r:hover,.nmm.dk .nmm-r:focus-visible{background:#e9edf4;color:#0b0f1a !important;}
.nmm-q{margin:0;font-size:14px;font-weight:600;line-height:1.4;color:#5f6774;overflow-wrap:anywhere;}
.nmm.dk .nmm-q{color:#8b95a8;}
.nmm-q b{font-weight:800;color:#0b0d12;}
.nmm.dk .nmm-q b{color:#e9edf4;}
.nmm-ab{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
.nmm-b{height:44px;border-radius:10px;border:1px solid #0b0d12;background:none;font:inherit;font-size:14px;font-weight:800;color:#0b0d12;cursor:pointer;}
.nmm.dk .nmm-b{border-color:#e9edf4;color:#e9edf4;}
.nmm-b.go{background:#0b0d12;color:#ffffff;}
.nmm.dk .nmm-b.go{background:#e9edf4;color:#0b0f1a;}
.nmm-b:focus-visible{outline:2px solid #2563eb;outline-offset:2px;}
.nmm.dk .nmm-b:focus-visible{outline-color:#7dd3fc;}
`;
