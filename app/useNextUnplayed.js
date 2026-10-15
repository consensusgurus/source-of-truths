'use client';

// The game to offer after a finish: the first unplayed daily in the SAME
// category as the one just finished, falling back to the first unplayed of any
// category. Needs no new endpoint, since the daily registry and the played map
// both already exist.
//
// `perGame` marks an abandoned run as well as a finished one, and an abandon is
// not a completion, so the played test mirrors DailyGamesGrid exactly:
// played === entry exists AND it is not flagged abandoned. Getting this wrong
// would offer a player a game they are midway through as if it were new.
//
// Fetched fresh: the cached daily-me answer can predate the finish that just
// happened on this page, which is the case dailyMeClient's own comment warns of.
//
// A FAMILY OUTRANKS A CATEGORY (owner, 2026-09-04). Parker, Impound and Junkyard
// are one puzzle at three fixed sizes, so finishing any of them should hand the
// player the next SIZE they have not played, not merely another Logic game. The
// ladder lives in GAME_FAMILIES in lib/daily-games.js and is read here through
// familyAfter(), which returns the rest of the family cyclically from the rung
// after the one just finished, so the offer always moves forward and wraps.
// Every other daily is in no family, familyAfter returns [], and the category
// rule below is untouched.
//
// Use DAILY_GAMES, the EXPORTED registry, which also drops retired games. The
// first cut imported ALL_DAILY_GAMES, which is module-private, so the import was
// undefined, .find threw inside the .then, and the catch swallowed it: the row
// simply never appeared. Hence the catch now logs instead of going quiet.
import { useEffect, useState } from 'react';
import { DAILY_GAMES } from './DailyEndCard';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from './dailyMeClient';
import { familyAfter, spotlightFor } from '@/lib/daily-games';

export default function useNextUnplayed({ self = null, active = false }) {
  const [next, setNext] = useState(null);
  useEffect(() => {
    if (!active || !self) return undefined;
    let alive = true;
    fetchDailyMe(dailyMeQuery(dailyMeIdentity()), { fresh: true })
      .then((d) => {
        if (!alive) return;
        const per = (d && d.perGame) || {};
        const played = (k) => !!(per[k] && !per[k].abandoned);
        const mine = DAILY_GAMES.find((g) => g.key === self) || null;
        const open = DAILY_GAMES.filter((g) => g.key !== self && !played(g.key));
        const sameCat = mine ? open.filter((g) => g.cat === mine.cat) : [];
        // A retired family member is absent from DAILY_GAMES, so resolve through
        // it rather than trusting the key list, and drop what does not resolve.
        const fam = familyAfter(self)
          .map((k) => open.find((g) => g.key === k))
          .filter(Boolean);
        // A spotlit game (lib/daily-games SPOTLIGHT) leads the category pick.
        const spot = mine ? spotlightFor(mine.cat, self) : null;
        const spotGame = spot ? sameCat.find((g) => g.key === spot.key) : null;
        setNext(fam[0] || spotGame || sameCat[0] || open[0] || null);
      })
      .catch((e) => { if (typeof console !== 'undefined') console.warn('useNextUnplayed', e); });
    return () => { alive = false; };
  }, [self, active]);
  return next;
}

// The same pick, as a LIST, for the cap's finish tiles (owner, 2026-08-14). Once
// a game is over its SCORE / WORDS / GUESSES / TIME are already stated on the
// end card's own header line, so the cap's figure row is saying it twice; it
// carries what to play next instead. Same-category first, then anything else
// unplayed, so a word player is offered words before it reaches for filler.
export function useUnplayedSimilar({ self = null, active = false, count = 4 }) {
  const [list, setList] = useState([]);
  useEffect(() => {
    if (!active || !self) return undefined;
    let alive = true;
    fetchDailyMe(dailyMeQuery(dailyMeIdentity()), { fresh: true })
      .then((d) => {
        if (!alive) return;
        const per = (d && d.perGame) || {};
        const played = (k) => !!(per[k] && !per[k].abandoned);
        const mine = DAILY_GAMES.find((g) => g.key === self) || null;
        const open = DAILY_GAMES.filter((g) => g.key !== self && !played(g.key));
        const fam = familyAfter(self)
          .map((k) => open.find((g) => g.key === k))
          .filter(Boolean);
        const spot = mine ? spotlightFor(mine.cat, self) : null;
        const sameCat = (mine ? open.filter((g) => g.cat === mine.cat) : [])
          .filter((g) => !fam.includes(g))
          // a spotlit game (lib/daily-games SPOTLIGHT) goes first in its category
          .sort((a, b) => (spot ? (b.key === spot.key) - (a.key === spot.key) : 0));
        const rest = open.filter((g) => !fam.includes(g) && !sameCat.includes(g));
        setList([...fam, ...sameCat, ...rest].slice(0, count));
      })
      .catch((e) => { if (typeof console !== 'undefined') console.warn('useUnplayedSimilar', e); });
    return () => { alive = false; };
  }, [self, active, count]);
  return list;
}
