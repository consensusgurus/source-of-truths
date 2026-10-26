// The Mind Loft mark (owner, 2026-10-26): a solid house whose lower half is the M.
// The opening under the M's V is a true cutout, so it always shows the background.
// The geometry lives in lib/mindloft-mark.js, which every string-built copy (share
// cards, OG images, icon scripts) also reads, so there is one drawing on the whole
// site. Import this component; never paste the path.
//
// `ink` paints the house: near-black on the light register, --stg-ink on the dark
// one. `accent` and `cut` are still accepted so existing call sites keep working,
// but the mark has no second colour any more.

import { HOUSE } from '../lib/mindloft-mark';

// eslint-disable-next-line no-unused-vars
export default function MindLoftMark({ size = 32, ink = 'var(--stg-ink, var(--ink, #0b0d12))', accent, cut, title = 'Mind Loft' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      style={{ display: 'block', flex: 'none' }}
    >
      <path className="mlm-house" d={HOUSE} fill={ink} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
