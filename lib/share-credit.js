// SHARE FOR CREDIT (owner, 2026-10-23): share the page the player is on,
// stamped with their referral code, so a new player who finishes from it earns
// them a drawing ticket (lib/referrals.js, lib/drawing.js). Used by the phone
// cap (app/StageChrome.jsx) and the desktop frame (app/LayoutCInner.jsx).
//
// Returns the message to show, or '' when the phone's own share sheet took it.
import { withRef, myRefCode } from './referrals';
import { drawingIsLive, DRAWING } from './drawing';

export function shareForCredit(onMsg) {
  if (typeof window === 'undefined') return;
  let url = '';
  try {
    url = window.location.origin + window.location.pathname;
    const p = new URLSearchParams(window.location.search).get('p');
    if (p) url += `?p=${encodeURIComponent(p)}`;
  } catch (e) { return; }
  url = withRef(url);
  const named = !!myRefCode();
  const live = drawingIsLive();
  const after = !live ? 'Link copied.'
    : named ? `Link copied. New players from it earn you ${DRAWING.prizeLabel} drawing tickets.`
      : `Link copied. Pick a name to earn ${DRAWING.prizeLabel} drawing tickets from it.`;
  let touch = false;
  try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
  if (touch && navigator.share) {
    navigator.share({ url, title: document.title }).catch(() => {});
    return;
  }
  try { navigator.clipboard.writeText(url).then(() => onMsg(after), () => onMsg(url)); } catch (e) { onMsg(url); }
}
