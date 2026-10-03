'use client';
// ADD TO HOME SCREEN, as one component (2026-10-03). Most daily clients carry
// their own copy of this button and its help sheet inline; the ten that never
// had one (Chomp, Blocks, Sweep, Strata, Suffice, Finesse, Redact, Hands,
// Anon, Docket) use this instead, so every daily ending has the button and the
// finish card's stat cards have a slot to land under it (#stf-stats-slot,
// app/StageFinish.jsx). Same look and same rule as the inline copies: phones
// only, never once the site is already installed.
import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { isMobileDevice } from '@/lib/is-mobile';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const INK = 'var(--stg-ink, #0b0d12)';

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export default function AddToHome({ name, noun = 'puzzle' }) {
  const [installEvt, setInstallEvt] = useState(null);
  const [help, setHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);

  useEffect(() => {
    try {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      setMobileUi(isMobileDevice());
    } catch (e) {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (!mobileUi || standalone) return null;
  const click = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setHelp(true); } };

  return (
    <>
      <button type="button" onClick={click} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: 'var(--stg-acc, #1d4ed8)', color: 'var(--stg-onramp, #ffffff)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
        <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
      </button>
      {help && (
        <div onClick={() => setHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--stg-raise, #ffffff)', borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: '1px solid var(--stg-line, rgba(20,22,28,0.12))' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add {name} to your Home Screen</div>
            {isIosDevice() ? (
              <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s {noun}, every day.</li>
              </ol>
            ) : (
              <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s {noun}, every day.
              </p>
            )}
            <button type="button" onClick={() => setHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: 'var(--stg-acc, #1d4ed8)', color: 'var(--stg-onramp, #fff)', cursor: 'pointer' }}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
