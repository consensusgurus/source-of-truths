'use client';

// THE PICTURE CREDIT for Jig and Saw (owner, 2026-11-28): the artist or
// photographer, linked when the board carries a `url` (Jig No. 70, Rebecca
// Mentz's watercolor, links to rhmentzart.com). Shown after the solve as
// before, and now also during play, below the play elements so it starts off
// screen. A submitted photo (`src`) carries its own `credit` line; a Commons
// photo keeps the photographer, licence and Commons link.
export default function JigCredit({ p, lead = true, className = 'jg-credit', style, nameColor }) {
  if (!p) return null;
  const ext = { target: '_blank', rel: 'noopener noreferrer' };
  const who = p.src
    ? (p.url ? <a href={p.url} {...ext}>{p.credit}</a> : p.credit)
    : <>Photo by {p.url ? <a href={p.url} {...ext}>{p.by}</a> : p.by}, {p.lic}, via{' '}
      <a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(String(p.t || '').replace(/ /g, '_'))}`} {...ext}>Wikimedia Commons</a></>;
  return (
    <p className={className} style={style}>
      {lead ? <>Today&rsquo;s picture: <b style={nameColor ? { color: nameColor } : undefined}>{p.name}</b>.{' '}</> : <><b style={nameColor ? { color: nameColor } : undefined}>{p.name}</b>.{' '}</>}
      {who}.
    </p>
  );
}

// The same line under a stage board: centred, muted, small.
export const CREDIT_AFTER_STYLE = { fontSize: 12, fontWeight: 600, lineHeight: 1.5, opacity: 0.8, textAlign: 'center', margin: 0, padding: '28px 18px 36px' };
