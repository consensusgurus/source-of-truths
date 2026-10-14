'use client';

// Shared "your day" figures: IQ Points earned today, today's rank on the board
// of everyone who has banked IQ today, today's move on the global IQ board, and
// how many of today's dailies are finished.
//
// It lives here rather than inside DailyStrip because on 2026-08-03 the owner
// moved the Your-day stats OUT of the daily board's cap and INTO the quizzes
// home command header, where each figure pairs with its lifetime counterpart
// (rank change beside rank, IQ gained beside total IQ, games played beside
// completed). Two components now want the same numbers, so the fetch is
// memoized for the page load: whoever asks second reuses the first request's
// promise instead of hitting /api/quiz/daily-status twice.

import { useEffect, useState } from 'react';
import { liveDailyKeys } from '@/lib/daily-games';
import { sharedGet } from './sharedGet';

// Retired games keep scoring their archived days, so they stay in DAILY_KEYS,
// but they are not on today's board and must never inflate the "x of N today"
// denominator. This is the same roster the daily board renders. Retirement is
// DATED in lib/daily-games (RETIRED_DAILY), so a game leaves this roster by
// itself the morning after its bank's final drop.
export const DAY_ROSTER = liveDailyKeys();

export function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export function fetchDayStatus() {
  let anonId = null, email = null;
  try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
  try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
  const qs = new URLSearchParams();
  if (anonId) qs.set('anonId', anonId);
  if (email) qs.set('email', email);
  // No identity at all: there is nothing for the server to look up, so resolve
  // null rather than firing a request that can only come back empty.
  // Shared with every other daily-status reader on the page for a minute, and
  // dropped the moment a game is finished (app/sharedGet.js).
  return qs.toString()
    ? sharedGet('/api/quiz/daily-status?' + qs.toString()).catch(() => null)
    : Promise.resolve(null);
}

// Same-device breadcrumbs, so the count is right on first paint and still right
// for a signed-out player the server knows nothing about. Mirrors DailyStrip's
// own first-paint pass over sot_<key>_day.
function localDone(today) {
  const out = new Set();
  for (const k of DAY_ROSTER) {
    try {
      const c = JSON.parse(localStorage.getItem(`sot_${k}_day`) || 'null');
      if (c && c.d === today && c.done) out.add(k);
    } catch (e) {}
  }
  return out;
}

export default function useDayStats() {
  const [s, setS] = useState({ todayXp: null, rankChange: null, dayRank: null, dayField: null, communityRank: null, communityTotal: null, communityCredits: null, done: 0, total: DAY_ROSTER.length, ready: false });
  useEffect(() => {
    let alive = true;
    const today = etToday();
    const [Y, M, D] = today.split('-').map(Number);
    const yy = Y % 100;
    const done = localDone(today);
    if (done.size) setS((p) => ({ ...p, done: done.size }));
    fetchDayStatus().then((data) => {
      if (!alive) return;
      if (!data) { setS((p) => ({ ...p, ready: true })); return; }
      const completed = new Set(data.completed || []);
      const played = new Set(data.played || []);
      for (const k of DAY_ROSTER) {
        const id = `${k}-${M}-${D}-${yy}`;
        if (!completed.has(id) && !played.has(id)) continue;
        done.add(k);
        // Cross-device first paint (2026-08-09). The server is the only thing
        // that knows a game was finished on ANOTHER device, so write the same
        // breadcrumb the game itself writes on finishing. Every surface that
        // paints before its own fetch resolves (the slate, the rail, this
        // counter) then shows the right status straight away instead of
        // flashing the game as unplayed. ONE DIRECTION ONLY: a missing server
        // row must never erase a local finish, so nothing here clears a
        // breadcrumb, and the board's own per-puzzle save is untouched.
        try {
          const cur = JSON.parse(localStorage.getItem(`sot_${k}_day`) || 'null');
          if (!cur || cur.d !== today || !cur.done) {
            localStorage.setItem(`sot_${k}_day`, JSON.stringify({ d: today, done: true }));
          }
        } catch (e) {}
      }
      setS({
        todayXp: typeof data.todayXp === 'number' ? data.todayXp : null,
        rankChange: typeof data.rankChange === 'number' ? data.rankChange : null,
        dayRank: typeof data.dayRank === 'number' ? data.dayRank : null,
        dayField: typeof data.dayField === 'number' ? data.dayField : null,
        // The 90-day community board's standing. Not a day figure, but it is
        // per-player and this is the one per-player request the header already
        // makes, so it rides along rather than costing a second round trip.
        communityRank: typeof data.communityRank === 'number' ? data.communityRank : null,
        communityTotal: typeof data.communityTotal === 'number' ? data.communityTotal : null,
        communityCredits: typeof data.communityCredits === 'number' ? data.communityCredits : null,
        done: done.size,
        total: DAY_ROSTER.length,
        ready: true,
      });
    });
    return () => { alive = false; };
  }, []);
  return s;
}
