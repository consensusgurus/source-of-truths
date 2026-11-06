// PASSPORT, THE RUN (owner, 2026-10-14), from 2026-10-15: the day's Span,
// Flank and Ping, then nine bigger-or-smaller calls on their countries. This
// builds one day of it from the three games' own banks, so the run and each
// game's own page deal the same boards. SERVER ONLY: it reads whole banks,
// which ship to no browser; app/passport/page.js hands the client the one
// day's boards and calls. scripts/verify-passport.mjs builds every run day
// through it too, so the page and the check cannot disagree.

import { PUZZLES as SPAN } from '../app/span/puzzles.js';
import { PUZZLES as FLANK } from '../app/flank/puzzles.js';
import { PUZZLES as PING } from '../app/ping/puzzles.js';
import * as SPAN_BORDERS from '../app/span/borders.js';
import { passportSizes, spanRoute } from './passport-sizes.js';

const at = (bank, iso) => bank.find((p) => p.live === iso) || null;

// One run day: { sections: [span, flank, ping], calls } or null when any of
// the three games has no board that day (the bank has run out).
export function passportRunDay(iso, quizId) {
  const sp = at(SPAN, iso), fl = at(FLANK, iso), pg = at(PING, iso);
  if (!sp || !fl || !pg) return null;
  const route = spanRoute(sp, SPAN_BORDERS);
  const spanNamed = [sp.start, sp.end, sp.via, sp.avoid].filter(Boolean);
  const calls = passportSizes({ iso, quizId: quizId || `passport-${iso}`, route, spanNamed, flank: { c: fl.c, a: fl.a }, ping: { country: pg.country } });
  const { num, quizId: fq, live, dateLabel, sunday, a, c } = fl;
  return {
    route,
    sections: [
      { key: 'span', num: sp.num, quizId: sp.quizId, puzzle: sp },
      { key: 'flank', num: fl.num, quizId: fq, light: { num, quizId: fq, live, dateLabel, sunday, total: a.length }, day: { c, a } },
      { key: 'ping', num: pg.num, quizId: pg.quizId, puzzle: pg },
    ],
    calls,
  };
}

// ── THE TRIP (owner, 2026-11-06), from TRIP_FROM ───────────────────────────
// One journey a day from app/passport/trips.js: Ping (the city you depart
// from), Span (from that city's country to the destination), Flank (the
// destination's ring). The three legs are RUN-ONLY boards, so each carries
// its own quizId and num (passport-<leg>-<m>-<d>-<yy>, the Passport num) and
// the run mounts them detached (app/RunEmbed.jsx): no row, no stats, no save
// under the standalone game's keys. `trip` hands the client what Stamps needs:
// the road's two ends, the perfect road (the fallback when a player does not
// reach the destination) and every Span country's capital, which are public
// facts and ship to the browser.
import { TRIPS } from '../app/passport/trips.js';
import { COUNTRIES as FACT_COUNTRIES } from '../app/niche/facts-countries.js';

const legId = (leg, iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return `passport-${leg}-${m}-${d}-${String(y).slice(2)}`;
};

export function passportTripDay(iso) {
  const t = TRIPS.find((x) => x.live === iso);
  if (!t) return null;
  return tripDayOf(t, iso);
}

// One trip record (the shape app/passport/trips.js holds) into a run day.
// The preview page (app/passport/preview) feeds it its own demo trips.
export function tripDayOf(t, iso) {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const [y, m, d] = iso.split('-').map(Number);
  const dateLabel = `${MONTHS[m - 1]} ${d}, ${y}`;
  const base = { num: t.num, live: iso, dateLabel, sunday: !!t.sunday };
  const ping = { ...base, quizId: legId('ping', iso), city: t.city, country: t.from, lat: t.lat, lng: t.lng, blurb: t.blurb };
  const span = { ...base, quizId: legId('span', iso), start: t.from, end: t.to, perfect: t.perfect, note: t.note };
  const adj = SPAN_BORDERS.buildAdj();
  const road = SPAN_BORDERS.shortestRoute(adj, t.from, t.to) || [t.from, t.to];
  const names = new Set(Object.keys(adj));
  const caps = {};
  // A country listed with more than one capital (the Netherlands, Bolivia) is
  // asked for its first, the official seat, and never offered its others.
  for (const c of FACT_COUNTRIES) if (names.has(c.t) && c.cap) caps[c.t] = Array.isArray(c.cap) ? c.cap[0] : c.cap;
  return {
    trip: { city: t.city, from: t.from, to: t.to, perfect: t.perfect, road, caps },
    sections: [
      { key: 'ping', num: t.num, quizId: ping.quizId, puzzle: ping },
      { key: 'span', num: t.num, quizId: span.quizId, puzzle: span },
      { key: 'flank', num: t.num, quizId: legId('flank', iso), light: { ...base, quizId: legId('flank', iso), total: t.a.length }, day: { c: t.c, a: t.a } },
    ],
    calls: [],
  };
}

// THE PREVIEW TRIPS (owner, 2026-11-06: "give me a playable version").
// app/passport/preview plays these through the real run with nothing filed.
// They are NOT in the bank: cities no Ping or trip day uses, destinations no
// trip day uses, so playing them spoils nothing. Derived like the generator.
const PREVIEW_SPECS = [
  { city: 'Bilbao', from: 'Spain', to: 'Hungary', blurb: 'Its titanium-clad Guggenheim Museum, opened in 1997, turned an old port city into a destination.' },
  { city: 'Kano', from: 'Nigeria', to: 'Kenya', blurb: 'The dye pits at Kofar Mata have been coloring cloth with indigo for centuries.' },
  { city: 'Mandalay', from: 'Myanmar', to: 'Turkey', blurb: 'It was the last royal capital of Burma, founded by King Mindon in 1857.' },
];
export const PREVIEW_COUNT = PREVIEW_SPECS.length;
export function passportPreviewDay(n, iso) {
  const spec = PREVIEW_SPECS[n - 1];
  if (!spec) return null;
  const adj = SPAN_BORDERS.buildAdj();
  const perfect = SPAN_BORDERS.distancesFrom(adj, spec.from)[spec.to];
  const code = Object.keys(FLANK_BORDERS).find((c) => FLANK_BORDERS[c].name === spec.to);
  const city = PING_CITIES.find((c) => c.name === spec.city && c.country === spec.from);
  if (!perfect || !code || !city) return null;
  const a = [...FLANK_BORDERS[code].n].sort((x, y) => FLANK_BORDERS[x].name.localeCompare(FLANK_BORDERS[y].name));
  const t = { num: 9000 + n, live: iso, sunday: false, city: spec.city, from: spec.from, lat: city.lat, lng: city.lng, blurb: spec.blurb, to: spec.to, perfect, note: `The shortest road from ${spec.from} to ${spec.to} is ${perfect} borders.`, c: code, a };
  const day = tripDayOf(t, iso);
  for (const sec of day.sections) {
    const pv = `passport-preview-${sec.key}-${n}`;
    sec.quizId = pv;
    if (sec.puzzle) sec.puzzle = { ...sec.puzzle, quizId: pv };
    if (sec.light) sec.light = { ...sec.light, quizId: pv };
  }
  return day;
}
import { BORDERS as FLANK_BORDERS } from '../app/flank/borders.js';
import { CITIES as PING_CITIES } from './ping-cities.js';
