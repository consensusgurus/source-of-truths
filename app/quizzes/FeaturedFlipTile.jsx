'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Crown } from 'lucide-react';
import { T } from '@/lib/theme';

/**
 * Featured hero tile that FLIPS between several picks (owner request 2026-07-21).
 *
 * Replaces the old single-pick-per-Eastern-day "Featured Geo Guesser" / "Featured
 * Sports" tiles: each tile now carries an ORDERED POOL of picks and rotates
 * through them with the same 3D card flip the Duel tile uses, so a visitor sees
 * several quizzes (and, on the general Featured tile, several CATEGORIES) in one
 * sitting. The pools are built in QuizHomeClient; this component only animates
 * them.
 *
 * Contract for each item in `items`:
 *   { id, href, hero, pos, tag, tagColor, Icon, title, leader, accent }
 * `tag` / `tagColor` / `Icon` are per-face, which is what lets the general tile
 * relabel itself FEATURED SPORTS -> FEATURED MOVIES -> ... as it turns.
 *
 * Behaviour, matched to DuelTile:
 *   - holds each face ~7s, flips on rotateY with the same easing/duration;
 *   - pauses while hovered (so a face can be read and clicked);
 *   - never flips on phones (<=560px) or under prefers-reduced-motion, where the
 *     tile is simply the first pick, static.
 * Only the face currently showing is clickable / in the tab order.
 */
export default function FeaturedFlipTile({ items, className = '', holdMs = 7000 }) {
  const list = items && items.length ? items : [];
  const ids = list.map((it) => it.id).join('|');
  const [n, setN] = useState(0);
  const [faces, setFaces] = useState(() => [list[0] || null, list[1] || list[0] || null]);
  const [hovered, setHovered] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Rebuild from the top whenever the pool itself changes (play totals land, a
  // column hero shifts), so we never point at a stale index.
  useEffect(() => {
    setN(0);
    setFaces([list[0] || null, list[1] || list[0] || null]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  // Flip only on wide viewports and only when motion is welcome.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const check = () => setAnimate(window.innerWidth > 560 && !mq.matches);
    check();
    window.addEventListener('resize', check);
    if (mq.addEventListener) mq.addEventListener('change', check);
    return () => {
      window.removeEventListener('resize', check);
      if (mq.removeEventListener) mq.removeEventListener('change', check);
    };
  }, []);

  const running = animate && !hovered && list.length > 1;
  useEffect(() => {
    if (!running) return undefined;
    const t = setTimeout(() => setN((v) => v + 1), holdMs);
    return () => clearTimeout(t);
  }, [n, running, holdMs]);

  // Load the NEXT pick onto the face that just turned away, AFTER the flip has
  // settled. Swapping it any earlier would flash the upcoming quiz across the
  // outgoing face during the first half of the rotation.
  useEffect(() => {
    if (list.length < 2) return undefined;
    const t = setTimeout(() => {
      setFaces((f) => {
        const out = f.slice();
        out[(n + 1) % 2] = list[(n + 1) % list.length];
        return out;
      });
    }, 750);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, ids]);

  if (!list.length) return null;

  return (
    <div
      className={`hstile hsflip-wrap ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="hsflip" style={{ transform: `rotateY(${n * 180}deg)` }}>
        {[0, 1].map((i) => (
          <FlipFace key={i} it={faces[i]} back={i === 1} active={n % 2 === i} />
        ))}
      </div>
      {list.length > 1 && animate && (
        <div className="hsflip-dots" aria-hidden="true">
          {list.map((it, i) => (
            <span key={it.id} className={`hsflip-dot ${i === n % list.length ? 'on' : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function FlipFace({ it, back, active }) {
  const turn = back ? 'rotateY(180deg)' : 'none';
  if (!it) return <div className="hsface" style={{ transform: turn }} />;
  const Icon = it.Icon;
  // The photo lives on its OWN layer, inset -2px, rather than on the face's
  // background. The face clips it (overflow:hidden), so the outermost ring of
  // the image is cropped away and the tile's top edge can never show the raw
  // image edge, the border seam, or the compositor's antialiased boundary --
  // that was the discoloured strip across the top of every tile (2026-07-21).
  const bg = it.hero
    ? { backgroundImage: `url("${it.hero}")`, backgroundPosition: it.pos || 'center' }
    : { background: it.accent || T.accent };
  return (
    <Link
      href={it.href}
      className="hsface"
      tabIndex={active ? undefined : -1}
      aria-hidden={active ? undefined : 'true'}
      style={{ transform: turn, pointerEvents: active ? 'auto' : 'none' }}
    >
      <span className="hsface-ph" style={bg} />
      <span className="ttile-tag" style={{ color: it.tagColor, whiteSpace: 'nowrap' }}>
        {Icon ? <Icon size={11} style={{ verticalAlign: -1 }} /> : null} {it.tag}
      </span>
      <div className="ttile-ov">
        <div className="ttile-t">{it.title}</div>
        <div className="ttile-foot" style={{ flexWrap: 'nowrap' }}>
          <span className="ttile-p" style={{ flex: 'none' }}>Play <ArrowRight size={13} style={{ verticalAlign: -1 }} /></span>
          {it.leader ? (
            <span className="ttile-plays hpill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <Crown size={12} style={{ color: T.gold, flex: 'none' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingBottom: '0.16em', marginBottom: '-0.16em' }}>{it.leader}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
