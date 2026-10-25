import { ImageResponse } from 'next/og';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResults } from '@/lib/quiz-results-load';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { rankPlayers } from '@/lib/quiz-xp';
import { computeXpCached } from '@/lib/quiz-derived-cache';
import { dailyGameName } from '@/lib/daily-games';
import { categoryColor } from '@/lib/category-ramp';
import { SHARE_HOST } from '@/lib/site';
import { D, markURI, stageFonts } from '@/lib/og-stage-card';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Downloadable "my day" share card (1080x1080 PNG). The day's IQ Points gain as
// the hero number, a ladder showing how much of today's slate is cleared, and
// four figures underneath.
// GET /api/quiz/day-card?anonId=&email=[&date=M-D-YY]
//
// Data comes from the same two places the daily end card already reads, so this
// adds no new queries and no new tables:
//   IQ + global rank -> computeXp/rankPlayers over quiz_results (as /api/quiz/iq-standing)
//   the day's slate  -> /api/quiz/daily-combined on this same deployment
//
// -- THE REGISTER -----------------------------------------------------------
// Dark, and every colour comes from lib/og-stage-card.js. Same chrome as the
// 1200x630 cards: a full-bleed band in the accent, the mark plus wordmark with
// "Loft" in the accent, a mono cap label, and a footer split between the URL
// and one instruction. No opacity on ink anywhere; hierarchy is size and
// weight, and a fill in the accent carries D.onramp as its ink.
//
// -- THE LADDER REPLACED THE BRAIN METER ------------------------------------
// The meter used to be two flat PNGs from /public/day-card (a pale brain and a
// solid one), the solid one clipped inside an overflow-hidden box anchored to
// the bottom. That trick existed only because Satori ignores SVG masks, so an
// inline <svg mask> rendered as a full brain at every score and the fill had to
// be faked with two images and a clip.
//
// The Stage's own object for "a countable thing you get through" is the LADDER,
// and it needs neither a mask nor an image: it is a flex row of one rung per
// game, lit rungs full height in the accent and unlit ones short in D.line. It
// says how many games as well as how far, which the brain never did, and it
// scales to any slate size. The PNGs, BRAIN_W/BRAIN_H and the no-image fallback
// box are gone with it.
const SZ = 1080;
const SANS = 'Manrope';
const MONO = 'Manrope'; // one typeface site-wide (owner, 2026-10-08)

// The card's own step. The daily slate crosses every category, so it takes no
// game's colour; sky is the ramp's first step and the Stage's brand blue.
const ACCENT = categoryColor('Word');

const ET = 'America/New_York';
function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: ET }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function etDate(ts) {
  try { return new Date(ts).toLocaleDateString('en-CA', { timeZone: ET }); }
  catch (e) { return String(ts || '').slice(0, 10); }
}
// "7-30-26" -> "Thu Jul 30". Returns '' if the suffix is malformed.
function prettyDay(suffix) {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{2})$/.exec(String(suffix || ''));
  if (!m) return '';
  const d = new Date(Date.UTC(2000 + Number(m[3]), Number(m[1]) - 1, Number(m[2]), 12));
  try {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  } catch (e) { return suffix; }
}

function mono(extra) {
  return { display: 'flex', fontFamily: MONO, fontWeight: 700, ...(extra || {}) };
}

function textImage(msg) {
  return new ImageResponse(
    (
      <div style={{ width: SZ, height: SZ, background: D.ground, color: D.ink, fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, textAlign: 'center' }}>
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 800 }}>{msg}</div>
      </div>
    ),
    { width: SZ, height: SZ, fonts: stageFonts() }
  );
}

/**
 * THE DRAWING, as a pure function of plain data. Split out from GET so the card
 * can be rendered and looked at without a database or a live slate: everything
 * above this line loads data, everything below only draws.
 *
 * d = { iqToday, gameCount, gamesPlayed, dayLabel, rows: [{label, value, sub,
 *       accent}], url }
 */
export function dayCardElement(d) {
  const gameCount = Math.max(0, Number(d.gameCount) || 0);
  const played = Math.max(0, Math.min(gameCount, Number(d.gamesPlayed) || 0));
  // A cleared slate is the one thing on this card that is not the accent: the
  // figure and the footer instruction go to D.good, and the band stays sky so
  // the card is still recognisably the same object.
  const full = gameCount > 0 && played >= gameCount;
  const hero = D.ink; // ink on white: a pastel cannot be text (owner, 2026-10-25 white set)
  const rungs = [];
  for (let i = 0; i < gameCount; i += 1) rungs.push(i < played);

  return (
    <div style={{ width: SZ, height: SZ, background: D.ground, color: D.ink, fontFamily: SANS, display: 'flex', flexDirection: 'column' }}>
      {/* the band */}
      <div style={{ display: 'flex', width: SZ, height: 14, background: D.ground, flex: 'none' }} />

      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', padding: '48px 56px 44px' }}>
        {/* the cap */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={markURI(ACCENT)} width={46} height={46} alt="" />
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 32, fontWeight: 800, letterSpacing: '-0.3px', marginLeft: 14 }}>
              <span style={{ display: 'flex' }}>Mind</span>
              <span style={{ display: 'flex', marginLeft: 11 }}>Loft</span>
            </div>
          </div>
          <span style={mono({ fontSize: 22, color: D.mute })}>
            {d.dayLabel ? `Daily slate · ${d.dayLabel}` : 'Daily slate'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* the hero figure */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ display: 'flex', fontWeight: 800, fontSize: 196, letterSpacing: '-0.055em', lineHeight: 1, color: hero }}>
              {`+${Number(d.iqToday || 0).toLocaleString()}`}
            </span>
            <span style={mono({ fontSize: 24, color: D.mute, marginTop: 8 })}>IQ Points Today</span>
          </div>

          {/* the slate, as a ladder. A slate the route could not read has no
              rungs to draw, so the block goes rather than leaving a bare band. */}
          {gameCount > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={mono({ fontSize: 20, color: D.mute })}>Today&apos;s Slate</span>
              <div style={mono({ fontSize: 26, color: D.ink })}>
                <span style={{ display: 'flex' }}>{String(played)}</span>
                <span style={{ display: 'flex', color: D.mute2, marginLeft: 9 }}>/</span>
                <span style={{ display: 'flex', color: D.mute2, marginLeft: 9 }}>{String(gameCount)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 72, marginTop: 16 }}>
              {rungs.map((lit, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', flex: '1 1 0', minWidth: 2, marginLeft: i ? 3 : 0,
                    height: lit ? '100%' : '34%', borderRadius: 3,
                    background: lit ? ACCENT : D.line,
                  }}
                />
              ))}
            </div>
          </div>
          ) : null}

          {/* the four figures */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 18 }}>
            {(d.rows || []).map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: 'flex', alignItems: 'baseline',
                  background: D.surf, border: `1px solid ${D.line}`,
                  borderLeft: `8px solid ${row.accent ? ACCENT : D.line2}`,
                  borderRadius: 18, padding: '16px 28px', marginTop: i ? 8 : 0,
                }}
              >
                <span style={{ display: 'flex', flex: 'none', width: 250, fontFamily: MONO, fontWeight: 700, fontSize: 19, color: D.mute2 }}>{row.label}</span>
                <span style={{ display: 'flex', fontWeight: 800, fontSize: 46, letterSpacing: '-0.02em' }}>{row.value}</span>
                {row.sub ? <span style={{ display: 'flex', fontWeight: 600, fontSize: 24, color: D.ink2, marginLeft: 14 }}>{row.sub}</span> : null}
              </div>
            ))}
          </div>
        </div>

        {/* the footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${D.line}`, paddingTop: 24 }}>
          <span style={mono({ fontSize: 22, letterSpacing: '0.04em', color: D.ink2 })}>{d.url}</span>
          <span style={mono({ fontSize: 20, color: D.ink })}>Beat My Score</span>
        </div>
      </div>
    </div>
  );
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const date = (searchParams.get('date') || '').trim() || null;

  // --- the day's slate: games played, combined rank, best finish -------------
  let daily = null;
  try {
    const qs = new URLSearchParams();
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    if (date) qs.set('date', date);
    const r = await fetch(`${origin}/api/quiz/daily-combined?${qs.toString()}`, { cache: 'no-store' });
    if (r.ok) daily = await r.json();
  } catch (e) { daily = null; }

  const dMe = (daily && (daily.me || daily.meProvisional)) || null;
  const perGame = (dMe && dMe.perGame) || {};
  const gameCount = (daily && daily.gameCount) || 0;
  const gamesPlayed = dMe ? (typeof dMe.gamesPlayed === 'number' ? dMe.gamesPlayed : Object.keys(perGame).length) : 0;
  const dailyRank = dMe ? dMe.rank : null;
  const dailyField = daily ? (daily.uniquePlayers ?? daily.overallField ?? 0) : 0;

  let bestKey = null, bestRank = null;
  for (const k of Object.keys(perGame)) {
    const g = perGame[k];
    if (!g || g.abandoned || !g.rank) continue;
    if (bestRank == null || g.rank < bestRank) { bestRank = g.rank; bestKey = k; }
  }

  // --- IQ Points banked today, and the global standing ----------------------
  let iqToday = null, iqRank = null, iqTotal = null;
  try {
    let myKey = null;
    const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
    if (ident && ident.id) myKey = `u:${ident.id}`;
    else if (anonId) myKey = `a:${anonId}`;
    if (myKey) {
      const { data, error } = await loadQuizResults(supabaseAdmin);
      if (!error) {
        const { players } = computeXpCached(data || [], { recentN: 200 });
        const me = players.get(myKey);
        if (me) {
          const day = etToday();
          const recent = Array.isArray(me.recent) ? me.recent : [];
          iqToday = Math.round(recent
            .filter((r) => r.createdAt && etDate(r.createdAt) === day)
            .reduce((s, r) => s + (Number(r.xp) || 0), 0));
          const ranked = rankPlayers(players, 'all');
          const idx = ranked.findIndex((p) => p.key === myKey);
          if (idx >= 0) { iqRank = idx + 1; iqTotal = ranked.length; }
        }
      }
    }
  } catch (e) { /* the card still renders without the IQ figures */ }

  if (!gamesPlayed && !iqToday) return textImage('No games played yet today');

  try {
    return new ImageResponse(
      dayCardElement({
        iqToday,
        gameCount,
        gamesPlayed,
        dayLabel: prettyDay((daily && daily.date) || date || ''),
        rows: [
          { label: 'Games played', value: String(gamesPlayed), sub: gameCount ? `of ${gameCount} today` : '' },
          { label: 'Daily rank', value: dailyRank ? `#${Number(dailyRank).toLocaleString()}` : '—', sub: dailyField ? `of ${Number(dailyField).toLocaleString()} players` : '' },
          { label: 'Best finish', value: bestRank ? `#${bestRank}` : '—', sub: bestKey ? `in ${dailyGameName(bestKey)}` : '' },
          // The one accented rule on the card: the figure that is not about today.
          { label: 'Global IQ', value: iqRank ? `#${Number(iqRank).toLocaleString()}` : '—', sub: iqTotal ? `of ${Number(iqTotal).toLocaleString()}` : '', accent: true },
        ],
        url: `${SHARE_HOST}/daily`,
      }),
      { width: SZ, height: SZ, fonts: stageFonts(), headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    );
  } catch (e) {
    return textImage('Mind Loft');
  }
}
