'use client';
// THE LOFT SHOP, /community/shop (owner, 2026-11-18: "Leave store as coming
// soon for actual products"). The shelf is shown so players know what is
// coming; nothing here sells, links to a vendor or names a price yet.
import React from 'react';
import Link from 'next/link';
import CommunityShell from './CommunityShell';

const I = {
  tee: <path d="M8 4l-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4z" />,
  mug: <><path d="M5 7h11v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" /><path d="M16 9h2a2 2 0 0 1 0 4h-2M8 4v1M11 3v2M14 4v1" /></>,
  sticker: <><path d="M5 4h14v9l-6 7H5z" /><path d="M13 20v-5a2 2 0 0 1 2-2h4" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 21V5M9 8h6M9 11h6" /></>,
  poster: <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M8 16V12M12 16V8M16 16v-5" /></>,
  jersey: <><path d="M9 3h6l5 4-2 4-2-1v11H8V10l-2 1-2-4z" /><path d="M10 13h4" /></>,
  tote: <><path d="M5 8h14l-1 13H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  pin: <><circle cx="12" cy="10" r="6" /><path d="M9 15l-2 6 5-3 5 3-2-6" /></>,
};
const ITEMS = [
  { k: 'tee', name: 'The Mind Loft Tee', blurb: 'The house M on the chest. A new slogan every month, picked by vote on the Idea Board.', tone: 'var(--cm-sky)' },
  { k: 'tee', name: 'Category Tees', blurb: 'One for each shelf: Sudoku, Words, Logic, Trivia, and the rest, in their own colours.', tone: 'var(--cm-teal)' },
  { k: 'mug', name: 'The Morning Mug', blurb: 'For people who solve before they talk.', tone: 'var(--cm-peach)' },
  { k: 'sticker', name: 'Glyph Sticker Pack', blurb: 'Every daily’s glyph as a sticker. Laptop, water bottle, rival’s forehead.', tone: 'var(--cm-lime)' },
  { k: 'book', name: 'The Paper Puzzle Book', blurb: 'A year of favourite boards in print, for flights and power cuts.', tone: 'var(--cm-violet)' },
  { k: 'poster', name: 'Your Stats Poster', blurb: 'Your own year on Mind Loft, drawn as a print.', tone: 'var(--cm-rose)' },
  { k: 'jersey', name: 'Club Jerseys', blurb: 'Your club’s name and colours, for the group chat that takes it too seriously.', tone: 'var(--cm-green)' },
  { k: 'tote', name: 'The Loft Tote', blurb: 'Carries a puzzle book, a mug, and your pride.', tone: 'var(--cm-indigo)' },
];

export default function ShopClient() {
  return (
    <CommunityShell tab="shop" title="Loft Shop" sub="Merchandise for puzzle people. The shop is not open yet: here is what is coming."
      aside={<span className="cm-chip dk" style={{ fontSize: 13, padding: '6px 14px' }}>Coming Soon</span>}>
      <div className="cm-g4">
        {ITEMS.map((it) => (
          <article key={it.name} className="cm-card">
            <div style={{ height: 150, background: it.tone, borderBottom: '1px solid var(--stg-ink)', display: 'grid', placeItems: 'center', color: 'var(--stg-ink)' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[it.k]}</svg>
            </div>
            <div className="cm-cb">
              <b style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{it.name}</b>
              <p className="cm-mut">{it.blurb}</p>
            </div>
            <div className="cm-foot"><span className="cm-chip">Coming Soon</span></div>
          </article>
        ))}
      </div>
      <section className="cm-card" style={{ marginTop: 20 }}>
        <div className="cm-ch" style={{ background: 'var(--cm-peach)' }}><b>The 100 Day Streak Pin</b><span>Earned, never sold</span></div>
        <div className="cm-cb" style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>{I.pin}</svg>
          <p className="cm-mut">Play a hundred days in a row and we will send you an enamel pin. It will never be for sale.</p>
        </div>
      </section>
      <p className="cm-mut" style={{ marginTop: 16 }}>Want something on the shelf? <Link href="/community/ideas?pitch=fix" style={{ color: 'var(--stg-ink)', fontWeight: 800 }}>Pitch it on the Idea Board</Link>.</p>
    </CommunityShell>
  );
}
