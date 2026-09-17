'use client';

// Locate the Restaurant — NYC aerial geo game.
//
// Ten iconic New York restaurants, one straight-down aerial map (NYC official
// 6-inch orthophotography via maps.nyc.gov). Each round shows a restaurant name
// and gives the player 45 seconds to click where they think it is. Score per
// round decays with distance: 1000 points dead-on, fading exponentially. Miss
// the clock and the round scores zero. Built on the site's quiz visual language
// (SiteHeader, Grain, Footer, Manrope, blue accent) but uses a Leaflet aerial
// map instead of a vector silhouette. Leaflet is loaded from CDN at runtime so
// it adds no build dependency.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Share2, Flag, RotateCcw, ArrowRight, Trophy, Clock } from 'lucide-react';
import Grain from '../../Grain';
import Footer from '../../Footer';
import SiteHeader from '../../SiteHeader';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '@/app/ShareCreditPop';
import { T } from '@/lib/theme';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  forest: T.success,
  faded: T.muted,
};
const MONO = "'Manrope', system-ui, -apple-system, sans-serif";
const SERIF = "'Manrope', system-ui, -apple-system, sans-serif";
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

const ROUND_SECONDS = 45;
const TICK_MS = 100;
const TILE_URL = 'https://maps{s}.nyc.gov/xyz/1.0.0/photo/2018/{z}/{x}/{y}.png8';
const START_VIEW = [40.758, -73.978];
const START_ZOOM = 12;

// Ten iconic NYC restaurants. Coordinates are approximate (hand-entered).
const SPOTS = [
  { name: "Katz's Delicatessen", hood: 'Lower East Side', lat: 40.72226, lng: -73.98740 },
  { name: 'Peter Luger Steak House', hood: 'Williamsburg, Brooklyn', lat: 40.70985, lng: -73.96243 },
  { name: 'Balthazar', hood: 'SoHo', lat: 40.72255, lng: -73.99847 },
  { name: 'Carbone', hood: 'Greenwich Village', lat: 40.72805, lng: -74.00030 },
  { name: 'Eleven Madison Park', hood: 'Flatiron', lat: 40.74155, lng: -73.98722 },
  { name: 'Le Bernardin', hood: 'Midtown West', lat: 40.76165, lng: -73.98165 },
  { name: 'The Russian Tea Room', hood: 'Midtown', lat: 40.76480, lng: -73.97870 },
  { name: 'Grand Central Oyster Bar', hood: 'Grand Central Terminal', lat: 40.75270, lng: -73.97720 },
  { name: "Rao's", hood: 'East Harlem', lat: 40.79385, lng: -73.93455 },
  { name: 'Tavern on the Green', hood: 'Central Park', lat: 40.77235, lng: -73.97770 },
];
const TOTAL = SPOTS.length;
const MAX_PER = 1000;
const MAX_POINTS = TOTAL * MAX_PER;

function scoreFor(distM) {
  if (distM == null) return 0;
  return Math.max(0, Math.round(MAX_PER * Math.exp(-distM / 600)));
}
function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function fmtDist(m) {
  if (m == null) return '—';
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}
function shuffle(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function percentile(points) {
  const frac = MAX_POINTS ? points / MAX_POINTS : 0;
  return Math.round(Math.min(99, Math.max(2, Math.pow(frac, 1.35) * 100)));
}

export default function GeoClient() {
  const [leafletReady, setLeafletReady] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | playing | done
  const [order, setOrder] = useState([]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]); // { name, distM, pts }
  const [revealed, setRevealed] = useState(false);
  const [last, setLast] = useState(null); // { name, hood, distM, pts }
  const [remaining, setRemaining] = useState(ROUND_SECONDS * 1000);
  const [best, setBest] = useState(null);
  const [copied, setCopied] = useState(false);

  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const timerRef = useRef(null);
  const deadlineRef = useRef(0);
  const resolvedRef = useRef(false);
  const layersRef = useRef([]);
  const resolveRef = useRef(() => {});

  const points = results.reduce((s, r) => s + (r.pts || 0), 0);

  // ── Load Leaflet from CDN once ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.L) { setLeafletReady(true); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
    s.async = true;
    s.onload = () => setLeafletReady(true);
    document.body.appendChild(s);
  }, []);

  // ── Best score (local) ──
  useEffect(() => {
    try { const b = localStorage.getItem('sot_geo_nyc_best'); if (b != null) setBest(Number(b)); } catch {}
  }, []);

  // ── Cleanup ──
  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (mapRef.current) { try { mapRef.current.remove(); } catch {} mapRef.current = null; }
  }, []);

  function stopTimer() { clearInterval(timerRef.current); timerRef.current = null; }

  function clearLayers() {
    const map = mapRef.current;
    if (map) layersRef.current.forEach((l) => { try { map.removeLayer(l); } catch {} });
    layersRef.current = [];
  }

  function drawReveal(spot, latlng, distM, pts) {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;
    const actual = [spot.lat, spot.lng];
    const aMark = L.circleMarker(actual, { radius: 9, color: T.white, weight: 2.5, fillColor: COLORS.forest, fillOpacity: 1 })
      .addTo(map).bindPopup(`<b>${spot.name}</b><br>${spot.hood}`);
    layersRef.current.push(aMark);
    if (latlng) {
      const g = L.circleMarker(latlng, { radius: 7, color: COLORS.ink, weight: 2, fillColor: T.white, fillOpacity: 1 }).addTo(map);
      const line = L.polyline([latlng, actual], { color: COLORS.ember, weight: 2.5, dashArray: '5,7' }).addTo(map);
      layersRef.current.push(g, line);
      try { map.fitBounds(L.latLngBounds([latlng, actual]).pad(0.5)); } catch {}
    } else {
      map.setView(actual, 15);
    }
    aMark.openPopup();
  }

  function resolveRound(latlng) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    stopTimer();
    const spot = SPOTS[order[idx]];
    let distM = null;
    if (latlng && mapRef.current) {
      try { distM = mapRef.current.distance(latlng, [spot.lat, spot.lng]); } catch { distM = null; }
    }
    const pts = scoreFor(distM);
    drawReveal(spot, latlng, distM, pts);
    setResults((prev) => [...prev, { name: spot.name, distM, pts }]);
    setLast({ name: spot.name, hood: spot.hood, distM, pts });
    setRemaining((r) => r); // keep displayed value
    setRevealed(true);
  }
  resolveRef.current = resolveRound;

  function beginRound() {
    resolvedRef.current = false;
    clearLayers();
    if (mapRef.current) mapRef.current.setView(START_VIEW, START_ZOOM);
    setRevealed(false);
    setLast(null);
    setRemaining(ROUND_SECONDS * 1000);
    deadlineRef.current = Date.now() + ROUND_SECONDS * 1000;
    stopTimer();
    timerRef.current = setInterval(() => {
      const left = deadlineRef.current - Date.now();
      if (left <= 0) { stopTimer(); setRemaining(0); if (!resolvedRef.current) resolveRef.current(null); }
      else setRemaining(left);
    }, TICK_MS);
  }

  function startGame() {
    setOrder(shuffle(TOTAL));
    setIdx(0);
    setResults([]);
    setPhase('playing');
    beginRound();
  }

  function nextRound() {
    if (idx < TOTAL - 1) { setIdx(idx + 1); beginRound(); }
    else finishGame();
  }

  function finishGame() {
    stopTimer();
    setPhase('done');
    const total = results.reduce((s, r) => s + (r.pts || 0), 0);
    setBest((prev) => {
      const nb = prev == null ? total : Math.max(prev, total);
      try { localStorage.setItem('sot_geo_nyc_best', String(nb)); } catch {}
      return nb;
    });
  }

  function playAgain() {
    clearLayers();
    setPhase('idle');
    setResults([]);
    setIdx(0);
    setRevealed(false);
    setLast(null);
    setRemaining(ROUND_SECONDS * 1000);
    resolvedRef.current = false;
  }

  // ── Map init when entering play ──
  useEffect(() => {
    if (phase !== 'playing' || !leafletReady || !mapElRef.current || mapRef.current) return;
    const L = window.L;
    const map = L.map(mapElRef.current, { minZoom: 11, maxZoom: 19, zoomControl: true }).setView(START_VIEW, START_ZOOM);
    map.setMaxBounds(L.latLngBounds([40.49, -74.27], [40.93, -73.69]));
    L.tileLayer(TILE_URL, {
      subdomains: '1234', minNativeZoom: 8, maxNativeZoom: 19, maxZoom: 19,
      bounds: L.latLngBounds([40.4888, -74.2759], [40.9279, -73.6896]),
      attribution: '&copy; City of New York',
    }).addTo(map);
    map.on('click', (e) => { if (resolveRef.current) {
      if (phaseRef.current === 'playing' && !resolvedRef.current) resolveRef.current(e.latlng);
    } });
    mapRef.current = map;
    setTimeout(() => { try { map.invalidateSize(); } catch {} }, 60);
  }, [phase, leafletReady]);

  // keep a live phase ref for the leaflet click closure
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const secsLeft = Math.ceil(remaining / 1000);
  const timeFrac = Math.max(0, Math.min(1, remaining / (ROUND_SECONDS * 1000)));
  const lowClock = phase === 'playing' && !revealed && remaining <= 10000;
  const promptSpot = phase === 'playing' && order.length ? SPOTS[order[idx]] : null;
  const lastIsHit = last && last.pts >= 700;

  const shareUrl = withRef(typeof window !== 'undefined' ? window.location.href : 'https://mindloftdaily.com/geo/nyc-restaurants');
  function share() {
    const text = phase === 'done' ? `I scored ${points}/${MAX_POINTS} on Locate the Restaurant (NYC). Can you beat me?` : 'Locate the Restaurant — a NYC aerial geo game.';
    if (notifyShareCredit(`${text} ${shareUrl}`)) return;
    if (typeof navigator !== 'undefined' && navigator.share) { navigator.share({ title: 'Locate the Restaurant', text, url: shareUrl }).catch(() => {}); }
    else if (typeof navigator !== 'undefined' && navigator.clipboard) { navigator.clipboard.writeText(`${text} ${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {}); }
  }

  const recap = phase === 'done'
    ? results.map((r, i) => ({ ...r, rank: i + 1 })).slice().sort((a, b) => b.pts - a.pts)
    : [];

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, color: COLORS.ink, position: 'relative', overflow: 'clip' }}>
      <div style={{ position: 'relative', zIndex: 3 }}><SiteHeader active="quizzes" /></div>
      <div className="qzf-w" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '4px 38px 80px' }}>
        <div className="qzf-line" aria-hidden="true" />
        <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');` }} />

        {/* Header */}
        <div style={{ paddingBottom: 0, marginTop: 8 }}>
          <h1 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: 0, color: COLORS.ink }}>Locate the Restaurant</h1>
          <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.55, margin: '10px 0 0', color: COLORS.faded, maxWidth: 680 }}>
            Ten iconic New York restaurants on a straight-down aerial of the city. Read the name, drop a pin where you think it is, and beat the clock. Closer is more points.
          </p>
        </div>

        <div style={{ marginTop: 22 }} />

        {/* Scoreboard + timer (sticky) */}
        <div style={{ position: 'sticky', top: 0, zIndex: 24, background: COLORS.cream, paddingBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: COLORS.paper, borderRadius: 12, border: `1px solid ${COLORS.faded}33`, padding: '16px 20px' }}>
            <div>
              <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 34, lineHeight: 1 }}>{points}<span style={{ fontSize: 20, color: COLORS.faded }}>/{MAX_POINTS}</span></div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded }}>Points</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: `1px solid ${COLORS.faded}33`, borderRight: `1px solid ${COLORS.faded}33`, padding: '0 22px' }}>
              <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 34, lineHeight: 1, color: COLORS.ember }}>{best != null ? best : '—'}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded }}>Your best</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: MONO, fontSize: 28, lineHeight: 1, color: phase === 'playing' && !revealed ? (lowClock ? COLORS.ember : COLORS.ink) : COLORS.faded }}>{phase === 'playing' ? fmtTime(secsLeft) : fmtTime(ROUND_SECONDS)}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded }}>{phase === 'idle' ? `${TOTAL} rounds` : `Round ${Math.min(idx + 1, TOTAL)}/${TOTAL}`}</div>
            </div>
          </div>
          {phase === 'playing' && (
            <div style={{ height: 10, marginTop: 8, background: COLORS.paper, borderRadius: 10, border: `1px solid ${COLORS.faded}44`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${timeFrac * 100}%`, background: revealed ? COLORS.faded : (lowClock ? COLORS.ember : COLORS.forest), transition: `width ${TICK_MS}ms linear` }} />
            </div>
          )}
        </div>

        {/* IDLE — start screen */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '28px 24px 32px', borderRadius: 10, border: `1.5px solid ${COLORS.ink}`, background: COLORS.paper, marginTop: 12 }}>
            <MapPin size={26} strokeWidth={2.2} style={{ color: COLORS.ember }} />
            <h2 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 26, margin: '8px 0 6px' }}>Know the city?</h2>
            <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: '#3f444e', maxWidth: 500, margin: '0 auto 6px' }}>
              {TOTAL} iconic restaurants, {ROUND_SECONDS} seconds each. A name appears, click as close to it as you can on the aerial. Land on it for the full {MAX_PER} points; the credit fades with distance. Miss the clock and the round scores zero.
            </p>
            <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', color: COLORS.faded, margin: '0 0 20px' }}>
              {MAX_POINTS.toLocaleString()} points in play.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={startGame} disabled={!leafletReady} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, padding: '0 40px', lineHeight: '52px', border: 'none', background: COLORS.ember, color: T.white, cursor: leafletReady ? 'pointer' : 'default', opacity: leafletReady ? 1 : 0.5 }}>{leafletReady ? 'Start' : 'Loading map…'}</button>
              <button onClick={share} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '0 28px', lineHeight: '52px', border: `1.5px solid ${COLORS.ink}`, background: COLORS.cream, color: COLORS.ink, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={14} strokeWidth={2.5} /> {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>
        )}

        {/* PLAYING */}
        {phase === 'playing' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.ember }}>Find</span>
              <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(22px, 3.4vw, 30px)', lineHeight: 1.05 }}>{promptSpot ? promptSpot.name : ''}</span>
            </div>

            <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.faded}55` }}>
              <div ref={mapElRef} style={{ height: 480, width: '100%', background: '#0b1a2b', cursor: revealed ? 'grab' : 'crosshair' }} />
            </div>

            {/* Reveal banner */}
            <div style={{ minHeight: 26, marginTop: 12, textAlign: 'center' }}>
              {revealed && last && (
                <span style={{ fontFamily: SANS, fontSize: 15, color: COLORS.ink }}>
                  <b style={{ color: lastIsHit ? COLORS.forest : COLORS.rust }}>{last.pts > 0 ? `+${last.pts}` : 'Out of time'}</b>
                  {last.distM != null ? <span style={{ color: COLORS.faded }}> · {fmtDist(last.distM)} away · {last.name} ({last.hood})</span> : <span style={{ color: COLORS.faded }}> · {last.name} ({last.hood})</span>}
                </span>
              )}
            </div>

            <div style={{ marginTop: 10, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {revealed ? (
                <button onClick={nextRound} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, padding: '0 36px', lineHeight: '50px', border: 'none', background: COLORS.ember, color: T.white, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {idx < TOTAL - 1 ? <>Next round <ArrowRight size={15} strokeWidth={2.5} /></> : <>See results <ArrowRight size={15} strokeWidth={2.5} /></>}
                </button>
              ) : (
                <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.faded, display: 'inline-flex', alignItems: 'center', gap: 7, lineHeight: '50px' }}>
                  <Clock size={14} strokeWidth={2.5} /> Click the map to lock your guess
                </span>
              )}
              <button onClick={finishGame} style={ghostBtn()}><Flag size={12} strokeWidth={2.5} /> End game</button>
            </div>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ padding: 24, borderRadius: 10, border: `1.5px solid ${COLORS.ink}`, background: COLORS.paper, textAlign: 'center' }}>
              <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.ember, marginBottom: 8 }}>
                {points === MAX_POINTS ? 'Perfect run' : results.length < TOTAL ? 'Ended early' : 'Final score'}
              </div>
              <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 44, lineHeight: 1, marginBottom: 6 }}>{points}<span style={{ fontSize: 24, color: COLORS.faded }}>/{MAX_POINTS}</span></div>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, lineHeight: 1.15, marginBottom: 10 }}>
                {results.length} of {TOTAL} located · you beat {percentile(points)}% of players
              </div>
              <p style={{ fontFamily: SANS, fontSize: 15, color: '#3f444e', maxWidth: 440, margin: '0 auto' }}>
                {best != null && points >= best ? 'That is your best score yet.' : best != null ? `Your best is ${best}.` : ''}
              </p>
            </div>

            {recap.length > 0 && (
              <ol style={{ margin: '18px 0 0', padding: 0, listStyle: 'none' }}>
                {recap.map((row, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: `1px solid ${row.pts >= 700 ? COLORS.forest : COLORS.faded + '33'}`, marginBottom: 8, background: row.pts >= 700 ? T.white : COLORS.paper }}>
                    <span style={{ flex: 1, fontFamily: SANS, fontSize: 15, fontWeight: 600 }}>{row.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: COLORS.faded }}>{row.distM != null ? `${fmtDist(row.distM)} off` : 'no guess'}</span>
                    <span style={{ fontFamily: MONO, fontSize: 14, color: row.pts >= 700 ? COLORS.forest : COLORS.faded, minWidth: 52, textAlign: 'right' }}>+{row.pts}</span>
                  </li>
                ))}
              </ol>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
              <button onClick={playAgain} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, lineHeight: '48px', width: 210, padding: 0, background: COLORS.ember, color: T.white, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <RotateCcw size={14} strokeWidth={2.5} /> Play again
              </button>
              <button onClick={share} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, lineHeight: '48px', width: 210, padding: 0, background: COLORS.ink, color: COLORS.cream, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Share2 size={14} strokeWidth={2.5} /> {copied ? 'Link copied!' : 'Share'}
              </button>
            </div>
          </div>
        )}

        {/* Credit */}
        <div style={{ marginTop: 40, paddingTop: 18, borderTop: `1px solid ${COLORS.faded}33`, fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: COLORS.faded }}>
          Imagery &copy; City of New York, <a href="https://maps.nyc.gov/tiles/" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.ember }}>NYC Map Tiles</a> (CC BY 4.0). Restaurant coordinates are approximate.
        </div>
      </div>

      <Footer />
    </div>
  );
}

function ghostBtn() {
  return { fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, padding: '0 18px', lineHeight: '50px', background: 'transparent', color: COLORS.faded, borderRadius: 10, border: `1px solid ${COLORS.faded}55`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
}
