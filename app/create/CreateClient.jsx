'use client';

import { useState, useRef, useMemo, useEffect, forwardRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, X, Download, Plus } from 'lucide-react';
import { getSources, voteKey, dedupeByName } from '@/lib/helpers';
import { fetchBootstrap } from '@/lib/api';
import { T } from '@/lib/theme';

// Mirror the homepage tile preview exactly — including live fan votes — so the
// grid shows the same rows the main page does for each list.
function previewFor(list, voteData, extrasArr) {
  const mode = list.mode || 'both';
  const extras = extrasArr || [];

  function topByVotes() {
    const base = (list.vote && list.vote.items) || [];
    const all = dedupeByName([...base, ...extras]);
    const scored = all.map((item, idx) => ({ item, score: voteData[voteKey(list.id, item)] || 0, idx }));
    scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
    return scored.slice(0, 3).map((s) => s.item);
  }

  if (mode === 'facts' || mode === 'scores' || mode === 'unranked') {
    return { label: 'Top of the list', items: ((list.sources && list.sources.ai && list.sources.ai.items) || []).slice(0, 3) };
  }
  if (mode === 'votes') {
    return { label: 'Currently topping the votes', items: topByVotes() };
  }
  try {
    const sources = getSources(list, voteData, extras);
    const consensus = sources.find((s) => s.id === 'consensus');
    if (consensus && consensus.items.length > 0) {
      return { label: 'Current Consensus', items: consensus.items.slice(0, 3) };
    }
  } catch (e) {
    // fall through to votes
  }
  return { label: 'Currently topping the votes', items: topByVotes() };
}

// Same gold/silver/bronze medal accents the homepage tiles use.
const RANK_MEDALS = [
  { fill: '#c9a227', num: '#8a6d12' },
  { fill: '#9ca3a8', num: '#6b7278' },
  { fill: '#a9743f', num: '#7a4f2b' },
];

const FORMATS = [
  { key: '2 × 2', cols: 2, rows: 2 },
  { key: '2 × 3', cols: 2, rows: 3 },
  { key: '3 × 2', cols: 3, rows: 2 },
  { key: '3 × 3', cols: 3, rows: 3 },
  { key: '3 × 4', cols: 3, rows: 4 },
  { key: '4 × 3', cols: 4, rows: 3 },
];

// The board is always rendered at this fixed pixel width and captured at that
// size, then scaled down for on-screen preview. This is what makes the export
// produce a correct-ratio image on every device — including iOS Safari, where
// capturing a viewport-sized (responsive) node fails.
const BOARD_W = 1080;

export default function CreateClient({ lists }) {
  const [format, setFormat] = useState(FORMATS[0]);
  const [tiles, setTiles] = useState(() => Array(4).fill(null));
  const [title, setTitle] = useState('');
  const [query, setQuery] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [voteData, setVoteData] = useState({});
  const [extrasMap, setExtrasMap] = useState({});
  const [scale, setScale] = useState(0.33);
  const [boardH, setBoardH] = useState(760);
  const boardRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    fetchBootstrap().then((d) => {
      if (d) {
        setVoteData(d.votes || {});
        setExtrasMap(d.extras || {});
      }
    });
  }, []);

  // Fit the fixed-width board to the screen (never upscale past 1:1).
  useEffect(() => {
    function fit() {
      // Scale off the actual preview container width (never the window) so the
      // fixed-width board fits the page column on both desktop and mobile.
      const avail = wrapRef.current ? wrapRef.current.clientWidth : Math.min(window.innerWidth - 36, BOARD_W);
      setScale(Math.min(avail / BOARD_W, 1));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Measure the board's natural height so the scaled preview reserves the
  // right space and the export captures the full board.
  useEffect(() => {
    if (boardRef.current) setBoardH(boardRef.current.offsetHeight);
  }, [tiles, format, title, voteData, extrasMap, scale]);

  function chooseFormat(f) {
    setFormat(f);
    setTiles((prev) => {
      const next = Array(f.cols * f.rows).fill(null);
      for (let i = 0; i < Math.min(prev.length, next.length); i++) next[i] = prev[i];
      return next;
    });
  }

  // Order-based selection: each pick drops into the next open tile.
  function addList(list) {
    setTiles((prev) => {
      const i = prev.indexOf(null);
      if (i === -1) return prev;
      const n = [...prev];
      n[i] = list;
      return n;
    });
    setQuery('');
  }

  function removeSlot(i) {
    setTiles((prev) => {
      const n = [...prev];
      n[i] = null;
      return n;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return lists.filter((l) => `${l.title} ${l.category}`.toLowerCase().includes(q)).slice(0, 40);
  }, [query, lists]);

  async function download() {
    if (!boardRef.current) return;
    setDownloading(true);
    try {
      // Make sure web fonts are ready before snapshotting (iOS otherwise
      // captures a blank/fallback-font board).
      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (e) { /* ignore */ }
      }
      const { toPng } = await import('html-to-image');
      const h = boardRef.current.offsetHeight;
      const opts = { cacheBust: true, pixelRatio: 2, width: BOARD_W, height: h, backgroundColor: T.surface };
      // First pass warms Safari's image/font cache; the second is reliable.
      await toPng(boardRef.current, opts);
      const dataUrl = await toPng(boardRef.current, opts);
      const link = document.createElement('a');
      link.download = 'source-of-truths-grid.png';
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Download failed', e);
      alert('Could not generate image. Try again, or take a screenshot of the preview instead.');
    }
    setDownloading(false);
  }

  const filledCount = tiles.filter(Boolean).length;
  const gridFull = filledCount === tiles.length;

  return (
    <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, margin: '0 auto', padding: '28px 16px 80px' }}>
      <Link
        href="/lists"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'Manrope, monospace',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: T.slate,
          textDecoration: 'none',
          marginBottom: 18,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} /> All lists
      </Link>

      <h1
        style={{
          fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
          fontWeight: 600,
          fontSize: 38,
          lineHeight: 1,
          letterSpacing: '-0.015em',
          margin: '0 0 8px',
          fontVariationSettings: '"SOFT" 100',
        }}
      >
        Create Your Own Grid
      </h1>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, color: T.slate, margin: '0 0 28px', maxWidth: 560 }}>
        Pick a format, add lists in order to fill the tiles, drop in a title if you like, then download a clean image to share.
      </p>

      {/* Step 1 — format */}
      <SectionLabel>1 · Format</SectionLabel>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        {FORMATS.map((f) => {
          const active = f.key === format.key;
          return (
            <button
              key={f.key}
              onClick={() => chooseFormat(f)}
              style={{
                cursor: 'pointer',
                fontFamily: 'Manrope, monospace',
                fontSize: 13,
                letterSpacing: '0.12em',
                padding: '10px 18px',
                border: `1.5px solid ${T.ink}`,
                background: active ? T.ink : 'transparent',
                color: active ? T.surface : T.ink,
                transition: 'all 0.15s ease',
              }}
            >
              {f.key}
            </button>
          );
        })}
      </div>

      {/* Step 2 — title */}
      <SectionLabel>2 · Title (optional)</SectionLabel>
      <input
        type="text"
        value={title}
        maxLength={60}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Nashville City Guide"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '14px 16px',
          background: T.surfaceAlt,
          border: `1.5px solid ${T.ink}`,
          fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
          fontSize: 18,
          color: T.ink,
          outline: 'none',
          marginBottom: 28,
          fontVariationSettings: '"SOFT" 100',
        }}
      />

      {/* Step 3 — add lists in order */}
      <SectionLabel>3 · Add lists ({filledCount} of {tiles.length})</SectionLabel>
      {gridFull ? (
        <div style={{ padding: '14px 16px', border: `1.5px dashed ${T.slate}`, marginBottom: 16, fontFamily: 'Manrope, sans-serif', fontSize: 14, color: T.slate }}>
          All {tiles.length} tiles are filled. Remove one below to swap in a different list.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: T.surfaceAlt, border: `1.5px solid ${T.ink}`, marginBottom: filtered.length ? 0 : 16 }}>
            <Search size={16} strokeWidth={2.5} style={{ color: T.slate, flex: '0 0 auto' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search lists to fill tile ${filledCount + 1}…`}
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'Manrope, sans-serif', fontSize: 16, color: T.ink }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: T.slate, display: 'flex', flex: '0 0 auto' }}>
                <X size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
          {filtered.length > 0 && (
            <div style={{ border: `1.5px solid ${T.ink}`, borderTop: 'none', maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
              {filtered.map((l) => (
                <button
                  key={l.id}
                  onClick={() => addList(l)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid rgba(122,111,94,0.2)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Plus size={16} strokeWidth={2.5} style={{ color: T.accent, flex: '0 0 auto' }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <span style={{ fontFamily: 'Manrope, monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.slate }}>{l.category}</span>
                    <span style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 600, fontSize: 17, fontVariationSettings: '"SOFT" 100' }}>{l.title}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Ordered slots — tap the × to clear and re-fill in order */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        {tiles.map((t, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 14px',
              border: t ? `1.5px solid ${T.ink}` : `1.5px dashed ${T.slate}`,
              background: t ? T.surfaceAlt : 'transparent',
            }}
          >
            <span style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 16, width: 22, flex: '0 0 auto', color: t ? T.ink : T.slate }}>{i + 1}</span>
            {t ? (
              <>
                <span style={{ flex: 1, minWidth: 0, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 600, fontSize: 16, fontVariationSettings: '"SOFT" 100', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                <button onClick={() => removeSlot(i)} aria-label="Remove" style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: T.slate, display: 'flex', flex: '0 0 auto' }}>
                  <X size={18} strokeWidth={2.5} />
                </button>
              </>
            ) : (
              <span style={{ flex: 1, fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.slate }}>Open tile</span>
            )}
          </div>
        ))}
      </div>

      {/* Step 4 — preview + export */}
      <SectionLabel>4 · Preview</SectionLabel>
      <div ref={wrapRef} style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ width: BOARD_W * scale, height: boardH * scale, position: 'relative', overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, width: BOARD_W }}>
            <Board ref={boardRef} tiles={tiles} format={format} title={title} voteData={voteData} extrasMap={extrasMap} />
          </div>
        </div>
      </div>
      <p style={{ textAlign: 'center', fontFamily: 'Manrope, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.slate, margin: '0 0 22px' }}>
        {BOARD_W} × {Math.round(boardH)} · share-ready PNG
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button
          onClick={download}
          disabled={downloading || filledCount === 0}
          style={{
            cursor: filledCount === 0 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'Manrope, monospace',
            fontSize: 13,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '15px 26px',
            border: `1.5px solid ${T.ink}`,
            background: filledCount === 0 ? 'transparent' : T.ink,
            color: filledCount === 0 ? T.slate : T.surface,
            boxShadow: filledCount === 0 ? 'none' : `3px 3px 0 ${T.accent}`,
            opacity: downloading ? 0.6 : 1,
          }}
        >
          <Download size={16} strokeWidth={2.5} />
          {downloading ? 'Generating…' : 'Download image'}
        </button>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: T.slate }}>
          On a phone, press and hold the saved image to share it.
        </span>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: 'Manrope, monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.slate, marginBottom: 10 }}>
      {children}
    </div>
  );
}

// Fixed-width export board — homepage-style tiles, subtle header, scaled down
// for display but captured at full BOARD_W for a crisp, correctly-proportioned
// share image.
const Board = forwardRef(function Board({ tiles, format, title, voteData, extrasMap }, ref) {
  return (
      <div ref={ref} style={{ width: BOARD_W, boxSizing: 'border-box', background: T.surface, border: `3px solid ${T.ink}`, padding: 44 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'baseline',
            gap: 16,
            borderBottom: `2px solid ${T.ink}`,
            paddingBottom: 20,
            marginBottom: 28,
            fontFamily: 'Manrope, monospace',
            fontSize: 16,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: T.slate,
          }}
        >
          <span style={{ textAlign: 'left' }}>Mind Loft</span>
          <span
            style={{
              textAlign: 'center',
              whiteSpace: 'nowrap',
              fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
              fontWeight: 900,
              fontSize: 34,
              lineHeight: 1,
              letterSpacing: '-0.01em',
              textTransform: 'none',
              color: T.ink,
              fontVariationSettings: '"SOFT" 100',
            }}
          >
            {title.trim()}
          </span>
          <span style={{ textAlign: 'right' }}>Where Experts and Aggregators Agree</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${format.cols}, minmax(0, 1fr))`, gap: 22, alignItems: 'stretch' }}>
          {tiles.map((t, i) => {
            const pv = t ? previewFor(t, voteData, extrasMap[t.id] || []) : null;
            return (
              <div
                key={i}
                style={{
                  boxSizing: 'border-box',
                  height: '100%',
                  minWidth: 0,
                  minHeight: 230,
                  background: t ? T.surfaceAlt : 'transparent',
                  color: T.ink,
                  border: t ? `2px solid ${T.ink}` : `2px dashed ${T.slate}`,
                  padding: 26,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: t ? 'flex-start' : 'center',
                  alignItems: t ? 'stretch' : 'center',
                }}
              >
                {t ? (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ fontFamily: 'Manrope, monospace', fontSize: 15, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.75 }}>{t.category}</span>
                    </div>
                    <h3 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 16px', fontVariationSettings: '"SOFT" 100' }}>{t.title}</h3>
                    <div style={{ fontFamily: 'Manrope, monospace', fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 10 }}>{pv.label}</div>
                    <ol style={{ margin: 0, padding: 0, listStyle: 'none', fontFamily: 'Manrope, sans-serif', fontSize: 19 }}>
                      {pv.items.map((it, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: idx < 2 ? `1px dashed ${T.slate}` : 'none' }}>
                          {idx < 3 ? (
                            <span style={{ position: 'relative', width: 30, height: 30, flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: RANK_MEDALS[idx].fill, opacity: 0.3 }} />
                              <span style={{ position: 'relative', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 600, fontSize: 17, color: RANK_MEDALS[idx].num }}>{idx + 1}</span>
                            </span>
                          ) : (
                            <span style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 600, width: 22, color: T.slate }}>{idx + 1}</span>
                          )}
                          <span style={{ flex: 1, minWidth: 0 }}>{it}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: T.slate, fontFamily: 'Manrope, monospace', fontSize: 15, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    <Plus size={28} strokeWidth={2} />
                    Tile {i + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 28, fontFamily: 'Manrope, monospace', fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.slate }}>
          mindloftdaily.com
        </div>
      </div>
  );
});
