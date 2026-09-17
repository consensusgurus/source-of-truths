'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, Globe, Camera, ArrowLeft, Eye, PenLine, Share2, ShoppingBag, ExternalLink, Play, Clock } from 'lucide-react';
import { useSampledBg } from '@/lib/useSampledBg';
import { DESCRIPTIONS } from '@/lib/descriptions';
import { SITE_HOST } from '@/lib/site';
import { HERO_IMAGES } from '@/lib/hero-images';
import { getSources, buildItemLink } from '@/lib/helpers';
import Count from '@/app/Count';
import { savedIdentity } from '@/lib/saved-identity';
import { T } from '@/lib/theme';

// Splits a "Name (Locality)" item into { displayName, locality }.
function parseItem(fullName) {
  const m = fullName.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  if (m) return { displayName: m[1].trim(), locality: m[2].trim() };
  return { displayName: fullName, locality: null };
}

// Categories that are generic labels, not real place names.
const GENERIC_CATEGORIES = new Set([
  'travel', 'tech', 'product', 'products', 'entertainment',
  'other', 'food', 'food-drink', 'stores', 'nightlife', 'bars', 'luxury',
]);

// Build Map / Website / Yelp / Google-pics / TripAdvisor links for one item.
// Mirrors buildAuxLinks in DetailClient: Yelp/TripAdvisor only when a real
// business-page URL is stored; Google is always an image search (picsTerm-aware).
export function buildLinks(name, list) {
  const m = name.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  const base = m ? m[1].trim() : name;
  const locality = m ? m[2].trim() : '';
  const cat = (list.category || '').trim();
  const anchor = cat && !GENERIC_CATEGORIES.has(cat.toLowerCase()) ? cat : '';
  let loc = locality;
  if (anchor) {
    if (!loc) loc = anchor;
    else if (!loc.toLowerCase().includes(anchor.toLowerCase())) loc = `${loc}, ${anchor}`;
  }
  const picsTerm = (list.picsTerm || '').trim();
  const gq = encodeURIComponent((base + ' ' + loc + ' ' + picsTerm).replace(/\s+/g, ' ').trim());
  const pick = (map) => (map && (map[name] || map[base])) || null;
  return {
    map: buildItemLink(name, list),
    website: pick(list.itemLinks),
    yelp: pick(list.itemYelp),
    google: `https://www.google.com/search?q=${gq}&tbm=isch`,
    tripadvisor: pick(list.itemTripadvisor),
    video: pick(list.itemVideo),
    buy: pick(list.itemBuy),
  };
}

// Per-category "pics" convention — MUST stay logic-identical to
// entryPicsConfig in DetailClient.jsx (same priority order, same fallback).
// The label is always a plain "Pics:" for every category (the old
// "Food Pics:" variant was retired 2026-06-05); the chip set still varies.
export function picsConfig(list) {
  const tags = list.tags || [];
  const type = list.type || '';
  // Regions without real Yelp coverage substitute the local platform (Tabelog,
  // OpenRice, TheFork...): `itemYelp` then stores that platform's business-page
  // URLs and `itemYelpLabel` renames the chip accordingly.
  const yelpLabel = list.itemYelpLabel || 'Yelp';
  // Venue-first places (breweries, beach clubs, wineries, distilleries):
  // always "Pics:", regardless of other tags.
  const venueKey = `${list.title || ''} ${list.id || ''}`.toLowerCase();
  const isVenue = /brewer|beach[\s-]?club|winer|distiller/.test(venueKey);
  const isGolf = /golf/.test(venueKey);
  if (isGolf) return { label: 'Pics:', links: [['tripadvisor', 'TripAdvisor'], ['google', 'Google']] };
  if (isVenue) return { label: 'Pics:', links: [['yelp', yelpLabel], ['google', 'Google']] };
  // Bars / nightlife: checked before food so the branch order stays identical
  // to entryPicsConfig in DetailClient.jsx (labels are all "Pics:" now).
  const isBar = tags.includes('bars') || tags.includes('nightlife');
  if (isBar) return { label: 'Pics:', links: [['yelp', yelpLabel], ['google', 'Google']] };
  // Explicit food venues (restaurants, bakeries, cafes).
  const isFood = type === 'food' || tags.includes('food') || tags.includes('food-drink');
  if (isFood) return { label: 'Pics:', links: [['yelp', yelpLabel], ['google', 'Google']] };
  // Hotels / travel: "Pics:" with TripAdvisor.
  const isHotel = type === 'travel' || tags.includes('travel') || tags.includes('luxury');
  if (isHotel) return { label: 'Pics:', links: [['tripadvisor', 'TripAdvisor'], ['google', 'Google']] };
  return { label: 'Pics:', links: [['yelp', yelpLabel], ['google', 'Google']] };
}

// Derive top-10 consensus items depending on list mode.
function getItems(list, voteData, extras) {
  const mode = list.mode || 'both';
  // Native voting removed (2026-06-18); list pages show the FULL ranking
  // (descriptions only on the top 10 - see LedgerRow). Home tiles, the cron
  // snapshot, and OG poster images stay capped at 10 by their own callers.
  if (mode === 'facts' || mode === 'scores' || mode === 'unranked') {
    return list.sources?.ai?.items || [];
  }
  if (mode === 'votes') {
    return list.vote?.items || [];
  }
  const sources = getSources(list, voteData, extras, { limit: Infinity });
  const consensus = sources.find((s) => s.id === 'consensus');
  return consensus?.items || list.sources?.ai?.items || [];
}

// Shared link button style.
function linkBtn(primary) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: 'DM Mono, monospace',
    fontSize: 8,
    letterSpacing: '0.13em',
    textTransform: 'uppercase',
    padding: '7px 12px',
    border: `1px solid ${T.ink}`,
    background: primary ? T.ink : 'transparent',
    color: primary ? T.surface : T.ink,
    textDecoration: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

// Homepage-style tile chrome: own border, paper background, small gaps between.
const tileChrome = {
  background: T.surfaceAlt,
  border: `1.5px solid ${T.ink}`,
};

// Map(or Shop) / Website / pics chip row shared by all tile sizes. Location
// lists get Map + pics; product and other non-place lists get a single
// Shop/View link with no map and no pics.
function LinkRow({ links, pics, websiteLabel, list }) {
  const isPlace = (list.linkType || 'mapsCity') === 'mapsCity';
  const primaryLabel = isPlace ? 'Map' : list.linkLabel ? list.linkLabel : list.linkType === 'amazon' ? 'Buy' : 'View';
  const PrimaryIcon = isPlace ? MapPin : list.linkType === 'amazon' ? ShoppingBag : ExternalLink;
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
      <a href={links.map} target="_blank" rel={isPlace ? 'noopener noreferrer' : 'noopener noreferrer sponsored'} style={linkBtn(true)}>
        <PrimaryIcon size={9} strokeWidth={2} /> {primaryLabel}
      </a>
      {links.website && (
        <a href={links.website} target="_blank" rel="noopener noreferrer" style={linkBtn(false)}>
          <Globe size={9} strokeWidth={2} /> {websiteLabel}
        </a>
      )}
      {/* Pics only make sense for places. Label + its chips wrap together as
          one unit so the association survives line breaks on mobile. */}
      {isPlace && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginLeft: 4, whiteSpace: 'nowrap' }}>
          {pics.links.map(([key, label]) =>
            links[key] ? (
              <a key={key} href={links[key]} target="_blank" rel="noopener noreferrer" title={`${pics.label} ${label}`} aria-label={`${pics.label} ${label}`} style={linkBtn(false)}>
                <Camera size={9} strokeWidth={2.4} color={T.accent} /> {label}
              </a>
            ) : null
          )}
        </span>
      )}
      {/* Video review chip (One Bite / Dave Portnoy YouTube review etc.) —
          shown for any list with a per-item URL in itemVideo, place or not. */}
      {links.video && (
        <a
          href={links.video}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...linkBtn(false), background: T.accent, color: T.surface, border: `1px solid ${T.accent}` }}
        >
          <Play size={9} strokeWidth={2} fill={T.surface} /> {list.itemVideoLabel || 'Video'}
        </a>
      )}
      {/* Affiliate Rent / Buy CTA chips (digital purchase of a film or song).
          buyLinks 'video' => Rent + Buy (both to the title page); 'music' => Buy.
          Filled-ink to read as a CTA; the retailer is never named. */}
      {links.buy && list.buyLinks === 'video' && (
        <>
          <a href={links.buy} target="_blank" rel="noopener noreferrer sponsored" style={linkBtn(true)}>
            <Clock size={9} strokeWidth={2} /> Rent
          </a>
          <a href={links.buy} target="_blank" rel="noopener noreferrer sponsored" style={linkBtn(true)}>
            <ShoppingBag size={9} strokeWidth={2} /> Buy
          </a>
        </>
      )}
      {links.buy && list.buyLinks === 'music' && (
        <a href={links.buy} target="_blank" rel="noopener noreferrer sponsored" style={linkBtn(true)}>
          <ShoppingBag size={9} strokeWidth={2} /> Buy
        </a>
      )}
    </div>
  );
}

// Photo placeholder (shown until real heroImages are wired up).
// Optimized hero photo. Lazy-loaded, async-decoded WebP: the browser only
// fetches and decodes it when the tile nears the viewport, so memory and
// bandwidth cost stay minimal. Falls back to PhotoBox if the file 404s.
// The "best link" for an item (Purchase for products, Map otherwise) is
// buildItemLink(item, list), already computed as links.map. rel mirrors the
// chip row: plain for places, sponsored for affiliate/product links.
function bestRel(list) {
  const isPlace = (list.linkType || 'mapsCity') === 'mapsCity';
  return isPlace ? 'noopener noreferrer' : 'noopener noreferrer sponsored';
}

// Wraps tile content (name / description) in an invisible link to the best
// link. No underline and inherited color, so the link is not visually styled.
// When `href` is falsy (e.g. the static share-poster capture) the children
// render unwrapped.
function LinkWrap({ href, rel, style, children }) {
  if (!href) return children;
  return (
    <a
      href={href}
      target="_blank"
      rel={rel}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', ...style }}
    >
      {children}
    </a>
  );
}

function HeroPhoto({ photo, alt, poster, href, rel, fit = 'cover', bg, pad = 0, minH = 200 }) {
  const [failed, setFailed] = useState(false);
  const src = typeof photo === 'string' ? photo : photo?.src;
  const credit = photo && typeof photo === 'object' ? photo.credit : null;
  const creditUrl = photo && typeof photo === 'object' ? photo.creditUrl : null;
  // contain-fit pad matches the image's own background (sampled live).
  const sampledBg = useSampledBg(src, fit === 'contain');
  const padBg = fit === 'contain' ? (sampledBg || T.white) : bg;
  if (!src || failed) return <PhotoBox />;
  if (poster) {
    // Poster capture (share page): a plain eager <img> routed through the
    // site's own image optimizer, so html-to-image can inline it same-origin
    // (a raw remote URL would taint the canvas and blank the download).
    const optimized = `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`;
    return (
      <div style={{ position: 'relative', minHeight: minH, flexShrink: 0, overflow: 'hidden', backgroundColor: padBg, padding: pad, transition: 'background-color 0.2s ease' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={optimized}
          alt={alt}
          loading="eager"
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit }}
        />
        {credit && (
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              zIndex: 1,
              fontFamily: 'DM Mono, monospace',
              fontSize: 7,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(244,237,224,0.92)',
              background: 'rgba(26,22,17,0.55)',
              padding: '3px 7px',
            }}
          >
            Photo: {credit}
          </span>
        )}
      </div>
    );
  }
  const img = (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 700px) 100vw, 240px"
      onError={() => setFailed(true)}
      style={{ objectFit: fit }}
    />
  );
  return (
    <div style={{ position: 'relative', minHeight: minH, flexShrink: 0, overflow: 'hidden', backgroundColor: padBg, padding: pad, transition: 'background-color 0.2s ease' }}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel={rel}
          style={{ position: 'absolute', inset: 0, display: 'block', textDecoration: 'none' }}
        >
          {img}
        </a>
      ) : (
        img
      )}
      {credit && (
        <a
          href={creditUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            zIndex: 1,
            fontFamily: 'DM Mono, monospace',
            fontSize: 7,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(244,237,224,0.92)',
            background: 'rgba(26,22,17,0.55)',
            padding: '3px 7px',
            textDecoration: 'none',
            pointerEvents: creditUrl ? 'auto' : 'none',
          }}
        >
          Photo: {credit}
        </a>
      )}
    </div>
  );
}

function PhotoBox({ style }) {
  return (
    <div
      style={{
        background: '#d4c9b3',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 200,
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(154,142,122,0.18) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(154,142,122,0.18) 1px, transparent 1px)',
          backgroundSize: '25% 25%',
        }}
      />
      <Camera size={26} color="#9a8e7a" style={{ position: 'relative', zIndex: 1 }} strokeWidth={1.5} />
      <span
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: 8,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#9a8e7a',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 12px',
        }}
      >
        New addition: Check back soon for photo
      </span>
    </div>
  );
}

// Full-width hero tile (used for ranks 1, 2, 3).
function HeroTile({ item, rank, list, desc, pics, poster }) {
  const { displayName, locality } = parseItem(item);
  const links = buildLinks(item, list);
  const heroSrc = (HERO_IMAGES[list.id] || {})[item];
  // No links in the static share-poster capture; live tiles link name /
  // description / photo to the best link (Purchase for products, Map otherwise).
  const href = poster ? null : links.map;
  const rel = bestRel(list);
  const isProduct = list.type === 'product' || (list.tags || []).includes('product');
  // Lists can opt portrait-photo heroes into the same crop-free contain+pad
  // treatment as products (e.g. people/player headshots) via heroFit:'contain'.
  const containHero = isProduct || list.heroFit === 'contain';

  return (
    <div
      className={poster ? undefined : 'lov-hero'}
      style={{
        gridColumn: 'span 2',
        display: 'grid',
        gridTemplateColumns: poster ? '240px 1fr' : 'clamp(160px, 30%, 240px) 1fr',
        ...tileChrome,
      }}
    >
      {heroSrc ? <HeroPhoto photo={heroSrc} alt={displayName} poster={poster} href={href} rel={rel} fit={containHero ? 'contain' : 'cover'} bg={containHero ? T.surfaceAlt : undefined} pad={containHero ? 14 : 0} /> : <PhotoBox />}
      <div
        style={{
          padding: '20px 22px 18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: `1.5px solid ${T.ink}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.ink,
                }}
              >
                {rank}
              </span>
            </div>
            {locality && (
              <span
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: T.slate,
                }}
              >
                {locality}
              </span>
            )}
          </div>
          <LinkWrap href={href} rel={rel}>
            <p
              style={{
                fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1.15,
                margin: '0 0 8px',
                fontVariationSettings: '"SOFT" 100',
                color: T.ink,
              }}
            >
              {displayName}
            </p>
          </LinkWrap>
          <LinkWrap href={href} rel={rel}>
            <p
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 14,
                color: desc ? '#5a5045' : T.slate,
                fontStyle: desc ? 'normal' : 'italic',
                lineHeight: 1.55,
                margin: '0 0 4px',
              }}
            >
              {desc || 'New addition: Check back soon for description'}
            </p>
          </LinkWrap>
        </div>
        <LinkRow links={links} pics={pics} websiteLabel="Website" list={list} />
      </div>
    </div>
  );
}

// Small tile used for ranks 4-9.
function SmallTile({ item, rank, list, desc, pics, poster }) {
  const { displayName, locality } = parseItem(item);
  const links = buildLinks(item, list);
  const href = poster ? null : links.map;
  const rel = bestRel(list);

  return (
    <div
      style={{
        ...tileChrome,
        padding: '16px 18px 14px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 22,
            height: 22,
            border: `1.5px solid ${T.slate}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
              fontSize: 10,
              fontWeight: 600,
              color: T.slate,
            }}
          >
            {rank}
          </span>
        </div>
        {locality && (
          <span
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 8,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: T.slate,
            }}
          >
            {locality}
          </span>
        )}
      </div>
      <LinkWrap href={href} rel={rel}>
        <p
          style={{
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.2,
            margin: '0 0 6px',
            fontVariationSettings: '"SOFT" 100',
            color: T.ink,
          }}
        >
          {displayName}
        </p>
      </LinkWrap>
      <LinkWrap href={href} rel={rel} style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 14,
            color: desc ? '#5a5045' : T.slate,
            fontStyle: desc ? 'normal' : 'italic',
            lineHeight: 1.5,
            margin: '0 0 10px',
          }}
        >
          {desc || 'New addition: Check back soon for description'}
        </p>
      </LinkWrap>
      <div style={{ marginTop: 'auto', paddingTop: 10 }}>
        <LinkRow links={links} pics={pics} websiteLabel="Website" list={list} />
      </div>
    </div>
  );
}

// Full-width ledger row (live consensus tab). One row per item: rank
// numeral / hero photo (ranks 1-3 only) / name + full description / a
// right-hand action column carrying the same chip set as the old tiles
// (video review, Map or Purchase, Website, and the "Pics:" label group).
// The share poster (ListOverviewPoster) now renders this same ledger layout
// (LedgerRow in poster mode), so the share captures stay in sync with the live
// list page. HeroTile/SmallTile/CompactRow below are the retained legacy tiles.
function LedgerRow({ item, rank, list, desc, pics, isTop, heavyDivider, poster, compact }) {
  const { displayName, locality } = parseItem(item);
  // Compact ledger row (share-card capture, ranks 4-10): rank + name + locality
  // only, in the same ledger aesthetic as the full rows.
  if (poster && compact) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '52px minmax(0,1fr)', gap: 22, alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(26,22,17,0.16)' }}>
        <div style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 20, lineHeight: 1, color: T.slate, textAlign: 'center' }}>{rank}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
          <span style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 17, fontWeight: 700, color: T.ink, fontVariationSettings: '"SOFT" 100', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
          {locality && (
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.slate, marginLeft: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>{locality}</span>
          )}
        </div>
      </div>
    );
  }
  const links = buildLinks(item, list);
  const heroSrc = isTop ? (HERO_IMAGES[list.id] || {})[item] : null;
  // Poster capture: name/description render inert (no nested anchors in the
  // image); the action-column buttons still build from `links` directly.
  const href = poster ? null : links.map;
  const rel = bestRel(list);
  const isPlace = (list.linkType || 'mapsCity') === 'mapsCity';
  const primaryLabel = isPlace ? 'Map' : list.linkLabel ? list.linkLabel : list.linkType === 'amazon' ? 'Buy' : 'View';
  const PrimaryIcon = isPlace ? MapPin : list.linkType === 'amazon' ? ShoppingBag : ExternalLink;
  const isProduct = list.type === 'product' || (list.tags || []).includes('product');
  const containHero = isProduct || list.heroFit === 'contain';

  return (
    <div
      className={poster ? undefined : (isTop ? 'lov-row lov-row-top' : 'lov-row')}
      style={
        poster
          ? {
              display: 'grid',
              gridTemplateColumns: isTop ? '52px 280px minmax(0,1fr) 196px' : '52px minmax(0,1fr) 196px',
              gap: 22,
              alignItems: 'center',
              padding: '18px 14px',
              borderBottom: heavyDivider ? `2px solid ${T.ink}` : '1px solid rgba(26,22,17,0.16)',
            }
          : { borderBottom: heavyDivider ? `2px solid ${T.ink}` : '1px solid rgba(26,22,17,0.16)' }
      }
    >
      <div
        className="lov-rank"
        style={{
          fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
          fontWeight: 900,
          fontSize: isTop ? 30 : 20,
          lineHeight: 1,
          color: rank === 1 ? T.gold : rank === 2 ? '#b8bcc4' : rank === 3 ? '#c8814b' : T.slate,
          textAlign: 'center',
        }}
      >
        {rank}
      </div>
      {isTop && (
        <div className={poster ? undefined : 'lov-photo'} style={{ alignSelf: 'stretch', display: 'grid', minHeight: 200 }}>
          {heroSrc ? (
            <HeroPhoto
              photo={heroSrc}
              alt={displayName}
              poster={poster}
              href={href}
              rel={rel}
              fit={containHero ? 'contain' : 'cover'}
              bg={containHero ? T.surfaceAlt : undefined}
              pad={containHero ? 10 : 0}
              minH={200}
            />
          ) : (
            <PhotoBox style={{ minHeight: 200 }} />
          )}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <LinkWrap href={href} rel={rel} style={{ display: 'inline-block' }}>
            <p
              style={{
                fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
                fontSize: isTop ? 21 : 17,
                fontWeight: 700,
                lineHeight: 1.15,
                margin: 0,
                fontVariationSettings: '"SOFT" 100',
                color: T.ink,
              }}
            >
              {displayName}
            </p>
          </LinkWrap>
          {locality && (
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: T.slate,
              }}
            >
              {locality}
            </span>
          )}
        </div>
        {rank <= 10 && (
          <LinkWrap href={href} rel={rel}>
            <p
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 14,
                color: desc ? '#5a5045' : T.slate,
                fontStyle: desc ? 'normal' : 'italic',
                lineHeight: 1.55,
                margin: '5px 0 0',
              }}
            >
              {desc || 'New addition: Check back soon for description'}
            </p>
          </LinkWrap>
        )}
      </div>
      <div className="lov-actions" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {links.buy && list.buyLinks === 'video' && (
          <div style={{ display: 'flex', gap: 5 }}>
            <a href={links.buy} target="_blank" rel="noopener noreferrer sponsored" style={{ ...linkBtn(true), justifyContent: 'center', flex: 1 }}>
              <Clock size={9} strokeWidth={2} /> Rent
            </a>
            <a href={links.buy} target="_blank" rel="noopener noreferrer sponsored" style={{ ...linkBtn(true), justifyContent: 'center', flex: 1 }}>
              <ShoppingBag size={9} strokeWidth={2} /> Buy
            </a>
          </div>
        )}
        {links.buy && list.buyLinks === 'music' && (
          <a href={links.buy} target="_blank" rel="noopener noreferrer sponsored" style={{ ...linkBtn(true), justifyContent: 'center' }}>
            <ShoppingBag size={9} strokeWidth={2} /> Buy
          </a>
        )}
        <div style={{ display: 'flex', gap: 5 }}>
          <a
            href={links.map}
            target="_blank"
            rel={isPlace ? 'noopener noreferrer' : 'noopener noreferrer sponsored'}
            style={{ ...linkBtn(true), justifyContent: 'center', flex: 1 }}
          >
            <PrimaryIcon size={9} strokeWidth={2} /> {primaryLabel}
          </a>
          {links.website && (
            <a href={links.website} target="_blank" rel="noopener noreferrer" style={{ ...linkBtn(false), justifyContent: 'center', flex: 1 }}>
              <Globe size={9} strokeWidth={2} /> Website
            </a>
          )}
        </div>
        {isPlace && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: T.accent,
                whiteSpace: 'nowrap',
              }}
            >
              {pics.label}
            </span>
            {pics.links.map(([key, label]) =>
              links[key] ? (
                <a
                  key={key}
                  href={links[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${pics.label} ${label}`}
                  aria-label={`${pics.label} ${label}`}
                  style={{ ...linkBtn(false), flex: 1, justifyContent: 'center' }}
                >
                  <Camera size={9} strokeWidth={2.4} color={T.accent} /> {label}
                </a>
              ) : null
            )}
          </div>
        )}
        {links.video && (
          <a
            href={links.video}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...linkBtn(false), justifyContent: 'center', background: T.accent, color: T.surface, border: `1px solid ${T.accent}` }}
          >
            <Play size={9} strokeWidth={2} fill={T.surface} /> {list.itemVideoLabel || 'Video'}
          </a>
        )}
      </div>
    </div>
  );
}

// Static, fixed-width (1080px) rendering of the new list page, used by the
// share page (/snapshot/[id]) as a downloadable image. Reuses the exact same
// tiles, descriptions, hero images, and pics config as the live overview so
// the two can never drift; strips everything interactive (back button, meta
// buttons, CTA, complaint modal) and avoids the responsive class names so a
// narrow window can't collapse the capture layout.
// Slim one-line tile for ranks 4-10 on the social share card: rank, name,
// locality. No photo or description, so seven of them stay compact.
function CompactRow({ item, rank }) {
  const { displayName, locality } = parseItem(item);
  return (
    <div style={{ ...tileChrome, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 22, height: 22, border: `1.5px solid ${T.slate}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, fontWeight: 600, color: T.slate }}>{rank}</span>
      </div>
      <span style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 16, fontWeight: 700, color: T.ink, fontVariationSettings: '"SOFT" 100', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
      {locality && (
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.slate, marginLeft: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>{locality}</span>
      )}
    </div>
  );
}

export function ListOverviewPoster({ list, voteData, extras, variant }) {
  const top3 = variant === 'top3';
  const social = variant === 'social';
  const compact = top3 || social;
  const items = getItems(list, voteData, extras);
  const descs = DESCRIPTIONS[list.id] || {};
  const pics = picsConfig(list);
  if (!items.length) return null;

  // Ledger layout (mirrors the live list page): ranks 1-3 are full rows with a
  // hero photo; the rest are full rows too. The share card (social) keeps the
  // top 3 as photo rows and renders ranks 4-10 as compact one-line rows.
  const fullItems = compact ? items.slice(0, 3) : items.slice(0, 10);
  const compactItems = social ? items.slice(3, 10) : [];
  const hasMoreAfterTop3 = social ? compactItems.length > 0 : items.length > 3;

  return (
    <div style={{ width: 1080, background: T.surface, color: T.ink, boxSizing: 'border-box', padding: compact ? '38px 48px 28px' : '52px 60px 40px', position: 'relative' }}>
      {/* Masthead */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${T.ink}`, paddingBottom: 14, marginBottom: compact ? 20 : 28, fontFamily: 'DM Mono, monospace', fontSize: 14, letterSpacing: '0.3em', textTransform: 'uppercase', color: T.ink }}>
        <span style={{ fontWeight: 600 }}>Mind Loft</span>
        <span style={{ color: T.slate, fontSize: 11 }}>{SITE_HOST}</span>
      </div>

      {/* Header (same composition as the live list page) */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28 }}>
        <h1
          style={{
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontWeight: 800,
            fontSize: 50,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            margin: 0,
            color: T.ink,
            fontVariationSettings: '"SOFT" 100',
          }}
        >
          {list.title}
        </h1>
        <div style={{ flex: 1, minWidth: 120, marginBottom: 6 }}>
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.accent,
              textAlign: 'right',
              marginBottom: 8,
            }}
          >
            {list.category} · {top3 ? 'Top Three' : `Top ${Math.min(items.length, 10)}`}
          </div>
          <div style={{ borderBottom: `1px solid ${T.ink}`, marginBottom: 4 }} />
          <div style={{ borderBottom: `2px solid ${T.accent}` }} />
        </div>
      </div>
      {!compact && list.blurb && (
        <p
          style={{
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontStyle: 'italic',
            fontSize: 16,
            lineHeight: 1.45,
            margin: '12px 0 0',
            color: T.slate,
            maxWidth: 680,
          }}
        >
          {list.blurb}
        </p>
      )}

      {/* Ledger rows (mirror the live list page): rank / hero photo on the
          top 3 / name + description / action column. No responsive classes in a
          static capture; the social share card adds compact rows for 4-10. */}
      <div style={{ marginTop: compact ? 18 : 26, borderTop: `2px solid ${T.ink}` }}>
        {fullItems.map((item, i) => (
          <LedgerRow
            key={item}
            item={item}
            rank={i + 1}
            list={list}
            desc={descs[item]}
            pics={pics}
            isTop={i < 3}
            heavyDivider={i === 2 && hasMoreAfterTop3}
            poster
          />
        ))}
        {compactItems.map((item, i) => (
          <LedgerRow
            key={item}
            item={item}
            rank={i + 4}
            list={list}
            pics={pics}
            poster
            compact
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: compact ? 20 : 28, borderTop: `2px solid ${T.ink}`, paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.slate }}>
        <span>Consensus · {top3 ? 'Top 3' : `Top ${Math.min(items.length, 10)}`}</span>
        <span>{SITE_HOST}/list/{list.id}</span>
      </div>
    </div>
  );
}

// `embedded` renders just the consensus tile grid + bottom CTA row, with no
// header/meta chrome of its own: the list page (DetailClient) embeds it as
// the content of its Consensus tab, beneath the page's own header and chips.
export default function ListOverview({ list, voteData, extras, viewCount, onBack, onOpenSources, onOpenVote, embedded }) {
  const items = getItems(list, voteData, extras);
  const descs = DESCRIPTIONS[list.id] || {};
  const pics = picsConfig(list);
  const mode = list.mode || 'both';
  const showVote = mode !== 'facts' && mode !== 'scores' && mode !== 'unranked';

  // "Speak With The Manager" complaint modal (same as the rankings page).
  const [complainOpen, setComplainOpen] = useState(false);
  const [complainMsg, setComplainMsg] = useState('');
  const [complainName, setComplainName] = useState('');
  const [complainEmail, setComplainEmail] = useState('');
  // A signed-in player's name + email prefill the reply fields, so a report
  // always comes back with somewhere to answer it. Still editable, still
  // optional: a guest sees empty fields exactly as before.
  useEffect(() => {
    const who = savedIdentity();
    if (who.username) setComplainName((v) => v || who.username);
    if (who.email) setComplainEmail((v) => v || who.email);
  }, []);
  const [complainSent, setComplainSent] = useState(false);
  const [complainBusy, setComplainBusy] = useState(false);

  async function submitComplaint() {
    if (complainBusy) return;
    setComplainBusy(true);
    try {
      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: list.id, listTitle: list.title, message: complainMsg.trim(), name: complainName.trim(), email: complainEmail.trim() }),
      });
    } catch (e) {
      // swallow — we still acknowledge the request to the reader
    }
    setComplainSent(true);
    setComplainBusy(false);
  }

  if (!items.length) return null;

  return (
    <div style={{ position: 'relative', zIndex: 2, background: T.surface }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .lov-row{display:grid;grid-template-columns:52px minmax(0,1fr) 196px;gap:22px;align-items:center;padding:18px 14px;}
        .lov-row-top{grid-template-columns:52px 280px minmax(0,1fr) 196px;}
        @media(max-width:760px){
          .lov-row,.lov-row-top{grid-template-columns:1fr;gap:12px;padding:20px 16px;}
          .lov-rank{text-align:left !important;}
          .lov-photo{min-height:220px !important;}
          .lov-actions{flex-direction:row !important;flex-wrap:wrap;align-items:center;row-gap:6px;}
        }
      ` }} />
      <div style={embedded ? undefined : { maxWidth: 1040, margin: '0 auto', padding: '28px 20px 0' }}>
        {/* Condensed header — hidden when embedded as the Consensus tab of
            the list page, which renders its own header and chip row. */}
        {!embedded && (
        <>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: 'DM Mono, monospace',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.ink,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 0 14px',
            }}
          >
            <ArrowLeft size={13} strokeWidth={2.5} />
            Back to all lists
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(16px, 4vw, 28px)' }}>
          <h1
            style={{
              fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(30px, 5vw, 50px)',
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
              margin: 0,
              color: T.ink,
              fontVariationSettings: '"SOFT" 100',
            }}
          >
            {list.title}
          </h1>
          <div style={{ flex: 1, minWidth: 120, marginBottom: 6 }}>
            <div
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: 'clamp(9px, 1.1vw, 11px)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: T.accent,
                textAlign: 'right',
                marginBottom: 8,
              }}
            >
              {list.category} · Top {Math.min(items.length, 10)}
            </div>
            <div style={{ borderBottom: `1px solid ${T.ink}`, marginBottom: 4 }} />
            <div style={{ borderBottom: `2px solid ${T.accent}` }} />
          </div>
        </div>
        {list.blurb && (
          <p
            style={{
              fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
              fontStyle: 'italic',
              fontSize: 16,
              lineHeight: 1.45,
              margin: '12px 0 0',
              color: T.slate,
              maxWidth: 640,
            }}
          >
            {list.blurb}
          </p>
        )}

        {/* Meta row: visitors + manager/share (matches the rankings page) */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.slate,
            }}
          >
            <Eye size={11} strokeWidth={2} />
            <span><Count value={viewCount} /> visitors</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={onOpenSources}
              style={{
                background: 'transparent',
                color: T.accent,
                border: `1.5px solid ${T.accent}`,
                padding: '8px 14px',
                fontFamily: 'DM Mono, monospace',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Consensus Sources
            </button>
            {showVote && (
              <button
                onClick={onOpenVote}
                style={{
                  background: 'transparent',
                  color: T.accent,
                  border: `1.5px solid ${T.accent}`,
                  padding: '8px 14px',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Vote
              </button>
            )}
            <button
              onClick={() => { setComplainSent(false); setComplainOpen(true); }}
              style={{
                background: 'transparent',
                color: T.ink,
                border: `1.5px solid ${T.ink}`,
                padding: '8px 14px',
                fontFamily: 'DM Mono, monospace',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <PenLine size={12} strokeWidth={2.5} />
              Disagree?
            </button>
            <a
              href={`/snapshot/${encodeURIComponent(list.id)}`}
              style={{
                background: 'transparent',
                color: T.ink,
                border: `1.5px solid ${T.ink}`,
                padding: '8px 14px',
                fontFamily: 'DM Mono, monospace',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
              }}
            >
              <Share2 size={12} strokeWidth={2.5} />
              Share
            </a>
          </div>
        </div>
        </>
        )}

        {/* Ledger rows: rank / photo (ranks 1-3) / name + full description /
            action column. Top-3 block closes with a heavy rule. */}
        <div style={{ marginTop: embedded ? 0 : 26, borderTop: `2px solid ${T.ink}` }}>
          {items.map((item, i) => (
            <LedgerRow
              key={item}
              item={item}
              rank={i + 1}
              list={list}
              desc={descs[item]}
              pics={pics}
              isTop={i < 3}
              heavyDivider={i === 2 && items.length > 3}
            />
          ))}
        </div>

      </div>

      {complainOpen && (
        <div
          onClick={() => setComplainOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(26,22,17,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6vh 16px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: T.surface, border: `2px solid ${T.ink}`, padding: 24 }}>
            {complainSent ? (
              <>
                <h3 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 22, margin: '0 0 10px' }}>Thanks — noted.</h3>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, color: T.slate, margin: '0 0 20px' }}>
                  Your note went to the editors' desk. Flagged lists get re-researched.
                </p>
                <button
                  onClick={() => { setComplainOpen(false); setComplainSent(false); setComplainMsg(''); setComplainName(''); setComplainEmail(''); }}
                  style={{ cursor: 'pointer', background: T.ink, color: T.surface, border: `1.5px solid ${T.ink}`, padding: '12px 20px', fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 22, margin: '0 0 6px' }}>Comments? Questions?</h3>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: T.slate, margin: '0 0 14px' }}>
                  Think this list is wrong or stale? Tell the editors what to re-research.
                </p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={complainName}
                    onChange={(e) => setComplainName(e.target.value)}
                    maxLength={120}
                    placeholder="Name (optional)"
                    style={{ flex: 1, minWidth: 140, boxSizing: 'border-box', padding: 12, border: `1.5px solid ${T.ink}`, background: T.surfaceAlt, fontFamily: 'Manrope, sans-serif', fontSize: 14, color: T.ink, outline: 'none' }}
                  />
                  <input
                    type="email"
                    value={complainEmail}
                    onChange={(e) => setComplainEmail(e.target.value)}
                    maxLength={200}
                    placeholder="Email (optional)"
                    style={{ flex: 1, minWidth: 140, boxSizing: 'border-box', padding: 12, border: `1.5px solid ${T.ink}`, background: T.surfaceAlt, fontFamily: 'Manrope, sans-serif', fontSize: 14, color: T.ink, outline: 'none' }}
                  />
                </div>
                <textarea
                  value={complainMsg}
                  onChange={(e) => setComplainMsg(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="What's off about this list? (optional)"
                  style={{ width: '100%', boxSizing: 'border-box', padding: 12, border: `1.5px solid ${T.ink}`, background: T.surfaceAlt, fontFamily: 'Manrope, sans-serif', fontSize: 14, color: T.ink, outline: 'none', resize: 'vertical', marginBottom: 16 }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setComplainOpen(false)}
                    style={{ cursor: 'pointer', background: 'transparent', color: T.ink, border: `1.5px solid ${T.ink}`, padding: '10px 18px', fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitComplaint}
                    disabled={complainBusy}
                    style={{ cursor: 'pointer', background: T.blueDeep, color: T.surface, border: `1.5px solid ${T.blueDeep}`, padding: '10px 18px', fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, opacity: complainBusy ? 0.6 : 1 }}
                  >
                    {complainBusy ? 'Sending…' : 'Send to editors'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
