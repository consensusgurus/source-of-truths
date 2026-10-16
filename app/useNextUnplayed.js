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

// Which catalog departments a finished daily hands on to once its own category
// is cleared, as /api/quiz/next-quiz tiers (`|` between tiers, `,` pools). Geography goes to geography; a subject
// trivia daily goes to its own department first and then to the rest of the
// trivia departments; any other Trivia daily goes to all of them. Word (the
// dailies ARE the word games) and misc never; every other category returns
// null and keeps the old any-category fallback.
const TRIVIA_DEPTS = ['movies', 'music', 'sports', 'history', 'science', 'entertainment', 'business', 'arts', 'literature', 'food', 'gaming'];
const SUBJECT_DEPT = {
  sport: 'sports', biz: 'business', script: 'movies', thread: 'movies', sci: 'science', clade: 'science',
  art: 'arts', history: 'history', dating: 'history', circa: 'history', extra: 'history',
};
export function quizDeptsFor(game) {
  if (!game) return null;
  if (game.cat === 'Geography') return 'geography|travel';
  if (game.cat !== 'Trivia') return null;
  const first = SUBJECT_DEPT[game.key];
  const all = TRIVIA_DEPTS.join(',');
  return first ? `${first}|${all}` : all;
}

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
        const local = fam[0] || spotGame || sameCat[0] || null;
        if (local) { setNext(local); return; }
        // THE QUIZ AFTER THE DAILIES (owner, 2026-10-16). Every daily in this
        // category is done. Geography and Trivia have up to a hundred catalog
        // quizzes behind them, so the slot offers the most played one this
        // player has not played, before reaching into another category.
        const depts = mine ? quizDeptsFor(mine) : null;
        if (!depts) { setNext(open[0] || null); return; }
        const { anonId, email } = dailyMeIdentity();
        const qs = new URLSearchParams({ dept: depts });
        if (anonId) qs.set('anonId', anonId);
        if (email) qs.set('email', email);
        fetch(`/api/quiz/next-quiz?${qs}`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => {
            if (!alive) return;
            const q = j && j.quiz;
            setNext(q ? { name: q.title, tag: `${q.label} quiz`, href: q.href, quiz: true } : (open[0] || null));
          })
          .catch(() => { if (alive) setNext(open[0] || null); });
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
