// The Mind Loft mark: a caret over a side-profile brain over a floor line.
//
// The caret is doing double duty, which is the whole idea: it is a roofline (loft, the room
// under the roof) AND an upward arrow (loft, to raise). The brain is a silhouette rather
// than a folded drawing so it survives at favicon size.
//
// ONE component, used everywhere. The six previous logo copies were each a hand-inlined SVG
// of the retired mark, which is why the rebrand did not reach them: there was nothing to
// find and replace. Import this instead of pasting a new one.

const BRAIN =
  'M14 42C12 28 22 16 36 16C40 8 54 6 60 14C70 8 84 14 86 26C96 30 98 44 88 50C92 58 86 66 76 64'
  + 'C74 72 64 74 60 66C48 70 36 66 32 56C20 56 12 50 14 42Z';

export default function MindLoftMark({ size = 32, ink = 'var(--ink)', accent = 'var(--stg-brand, #7dd3fc)', title = 'Mind Loft' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      style={{ display: 'block', flex: 'none' }}
    >
      <path d="M20 52l40-34 40 34" stroke={ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M14 102h92" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      <g transform="translate(31,48) scale(0.53)">
        <path d={BRAIN} fill={accent} />
      </g>
    </svg>
  );
}
