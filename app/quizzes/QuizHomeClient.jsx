'use client';
import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QUIZ_COUNT } from '../SiteHeader';
import QuizCommandHeader, { jumpToQuizzes } from './QuizCommandHeader';
import StageToday from '../today/StageToday';
import ContestNote from '../ContestNote';
import QrPosterForm from '../QrPosterForm';
import DuelTile from './DuelTile';
import CommunityTile from './CommunityTile';
import FeaturedFlipTile from './FeaturedFlipTile';
import {
  Search, ChevronDown, ArrowRight, BarChart3, Crown, Sparkles, Flame,
  BadgeCheck, Clapperboard, Music, Gamepad2, Plane, Globe, Utensils,
  Briefcase, Leaf, Tv, BookOpen, Landmark, Trophy, UserPlus, Play, X,
  Check, Star, Swords, Newspaper, Blocks, GraduationCap,
  Flag, QrCode,
} from 'lucide-react';
import { QUIZZES } from '@/lib/quizzes';
import { KIDS_GAMES } from '@/lib/kids';
import DailyStrip from '../DailyStrip';
import TodayClient from '../today/TodayClient';

// THE MARQUEE HOME (owner, 2026-08-24): the category-first shelves (the /today
// preview, promoted) replace the cap/slate/rails console on the homepage.
// Kill switch: set false to restore the old console instantly. Replaces the
// console on every variant, v3 included: app/page.js serves variant="v3", so
// gating on !v3 would exempt the homepage itself (shipped that way for one
// deploy, 2026-08-24).
const MARQUEE_HOME = true;
import HomeRails from '../HomeRails';
import XpTile from './XpTile';
import { QUIZ_HEROES, DEPT_HERO, qotdIdFor } from '@/lib/quiz-heroes';
import { DAILY_GAMES, CAT_META } from '@/app/DailyEndCard';
import {
  quizDept as deptOf, DEPT_COLOR, DEPT_LABEL, DEPT_NAV,
} from '@/lib/quiz-departments';
import { getDailyChallenge, dailyChallengeId, openChallenges, challengeQuizIds, DAILY_CHALLENGE_ON, easternYmd } from '@/lib/challenges';
import { hasSundayEdition, SUNDAY_LABEL } from '@/lib/sunday-editions';
import { isBusinessNewsHubQuiz } from '@/lib/business-news-hub';
import Grain from '../Grain';
import Footer from '../Footer';
import { withRef } from '@/lib/referrals';
import { savedIdentity } from '@/lib/saved-identity';
import { T } from '@/lib/theme';
import SigninHelp, { isLockedOut } from '../SigninHelp';
import { catBlue, deptBlue } from '@/lib/home-blues';
// Daily Mastery moved here from the Loft on 2026-08-12, so this file now needs
// the live roster and the archive figures behind it. fetchDayStatus is the same
// memoized promise the command header already fires, so the second face costs
// no request.
import { liveDailyKeys, DAILY_GAME_MAP } from '@/lib/daily-games';
import { fetchDayStatus } from '../useDayStats';
import MindLoftMark from '../MindLoftMark';

// Brand mark (gradient ids suffixed per render so multiple instances stay unique).
let __logoSeq = 0;
function Logo({ size = 22 }) {
  return <MindLoftMark size={size} />;
}

// eslint-disable-next-line no-unused-vars -- size default kept at 22

// ─── palette / type ─────────────────────────────────────────────────────────
const C = {
  bg: T.white, ground: T.ground, surface: T.white, ink: T.ink, muted: T.muted,
  soft: T.muted, line: 'rgba(20,22,28,0.30)', accent: T.accent,
  accsoft: '#e8effb', live: T.success,
  cta: T.cta, ctaInk: T.ctaInk, ctaHover: T.ctaHover,
};
const MEDAL = [T.gold, '#b8bcc4', '#c8814b'];
// Leaderboard rail: the #1 name shrinks as it lengthens so a long handle keeps its
// descenders (the 'g' in VicMcDoogle) instead of being clipped by a fixed 37px line.
function lbNameSize(s) {
  const L = (s || '').length;
  return L > 11 ? 23 : L > 9 ? 26 : L > 7 ? 29 : 33;
}
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const STATUS_LABEL = { unplayed: 'Unplayed', played: 'Played', completed: 'Completed' };
// Quiz of the Day is computed per render from the hero registry + rotation (see the qotd useMemo).

// Alternate department heroes, used ONLY when the Trending tile would repeat
// the Newest tile's image (both quizzes falling back to the same DEPT_HERO,
// or two quizzes sharing one hero). A department without an entry falls back
// to its plain category-color block instead of repeating the photo.
const DEPT_HERO_ALT = {
  geography: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/960px-The_Earth_seen_from_Apollo_17.jpg',
};

// Per-sport hero photos for the "Top Sports" tile, matched by keyword against the
// quiz title/id so e.g. a golf quiz shows a golf course, not a football stadium.
// First match wins; a quiz with its own QUIZ_HEROES entry still overrides this.
const SPORT_HERO = [
  [/\b(golf|pga|masters|ryder\s*cup|open\s*championship|augusta|st\.?\s*andrews)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Pebble_Beach_Golf_Links_02.jpg/960px-Pebble_Beach_Golf_Links_02.jpg'],
  [/\b(tennis|wimbledon|roland\s*garros|australian\s*open|atp|wta)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/National_Tennis_Center_outside_courts_and_stadium.jpg/960px-National_Tennis_Center_outside_courts_and_stadium.jpg'],
  [/\b(nba|basketball|march\s*madness|wnba)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Rose_Garden_Arena_Interior.jpg/960px-Rose_Garden_Arena_Interior.jpg'],
  [/\b(nfl|super\s*bowl|american\s*football|quarterback)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Lambeau_Field_-_Green_Bay_Packers_Football_Stadium_-_Wisconsin.jpg/960px-Lambeau_Field_-_Green_Bay_Packers_Football_Stadium_-_Wisconsin.jpg'], // Lambeau Field (NFL)
  [/\b(heisman|college\s*football|ncaa\s*football)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Michigan_Stadium_Aerial.jpg/960px-Michigan_Stadium_Aerial.jpg'], // Michigan Stadium (college football)
  [/\b(soccer|premier\s*league|fifa|world\s*cup|la\s*liga|uefa|champions\s*league|bundesliga|serie\s*a|mls)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Kashima_Soccer_Stadium_1.jpg/960px-Kashima_Soccer_Stadium_1.jpg'],
  [/\b(baseball|mlb|world\s*series|home\s*run)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Tianmu_Baseball_Stadium_aerial_photograph.jpg/960px-Tianmu_Baseball_Stadium_aerial_photograph.jpg'],
  [/\b(hockey|nhl|stanley\s*cup)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Ice_Hockey_Game_-_Madison_Square_Garden_-_Boston_vs_New_York.jpg/960px-Ice_Hockey_Game_-_Madison_Square_Garden_-_Boston_vs_New_York.jpg'],
  [/\b(olympic|olympics|olympian)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/London_Olympic_Stadium_West_Ham.jpg/960px-London_Olympic_Stadium_West_Ham.jpg'],
  [/\b(formula\s*1|formula\s*one|f1|grand\s*prix|nascar|indycar|motogp|le\s*mans|racing)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Formula_1_race_cars_on_display.jpg/960px-Formula_1_race_cars_on_display.jpg'],
  [/\b(boxing|heavyweight|ufc|mma|knockout)\b/i, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Mall_of_Asia_Arena_during_Pacquiao-Bradley_PPV.jpg/960px-Mall_of_Asia_Arena_during_Pacquiao-Bradley_PPV.jpg'],
];
function sportHeroFor(q) {
  if (!q) return null;
  const hay = ((q.title || '') + ' ' + (q.id || ''));
  for (let i = 0; i < SPORT_HERO.length; i++) { if (SPORT_HERO[i][0].test(hay)) return SPORT_HERO[i][1]; }
  return null;
}

// Daily-game quizzes are date/topic-stamped (crux-*, emcee-*, garble-*, links-*, span-*, dating-*,
// tally-*, suds-*, circa-*, extra-*, carve-*, stet-*, outwit-*, tuck-*, alibi-*, cipher-*, ping-*, jester-*, sworn-*, closer-*) and every entry in a family shares ONE hero image, so the two hero
// tiles (Newest + Trending) must never both draw from the same family.
const DAILY_GAME_FAMILY_RE = /^(crux|emcee|garble|links|span|dating|tally|suds|quilt|circa|extra|carve|stet|outwit|tuck|alibi|cipher|ping|warmer|jester|sworn|closer|outrank|shards|axiom|hearsay|venn|stands|bracket|lode|etch|hedge|listed|mate|four|park|impound|junkyard|check|rung|hinge|sums|crunch|taire|fib|streak|feud|babel|glyph|hands|finesse|chain|turn|suffice|strata|redact|paths|deep|anon|blocks|chomp|sweep|docket|blitz|blitzed|defend|cages|sando|barter|plot|sixes|niche|shoe|queen|towers|mercury|polka|atlas|sport|calc|encore|biz|flank|knight|script|quotes|focus|thread|slot|whittle|diag|frame|rim)-/;
function gameFamily(id) { const m = (id || '').match(DAILY_GAME_FAMILY_RE); return m ? m[1] : null; }
// A recorded PLAY carries the quiz's id, but a daily-game play id is date-stamped
// ('<key>-M-D-YY') and has NO /quiz/<id> route -- its board lives at /<family>.
// Route daily-game plays to the game; everything else to its quiz page.
function playHref(id) { const fam = gameFamily(id); return fam ? `/${fam}` : `/quiz/${id}`; }
// Rule: daily puzzles (Crux, Emcee, Garble, Links, Span, Dating, Tally, Suds, Circa, Extra, Carve, Stet, Outwit, Tuck, Alibi, Cipher, Ping, Closer) publish a fresh
// dated entry every day, so by publishedAt they are ALWAYS the "newest" quiz and
// would monopolize the Newest tile. They have their own hub tiles, so the Newest
// tile/list must never surface one. Keep this in sync with DAILY_GAME_FAMILY_RE.
const isDailyGame = (id) => DAILY_GAME_FAMILY_RE.test(id || '');
// Daily-game category (Word/Logic/Numbers/Geography/History) keyed by family.
const DG_CAT = Object.fromEntries((DAILY_GAMES || []).map((g) => [g.key, CAT_META[g.cat] || null]));
// Short category labels for the narrow activity rows.
const CAT_SHORT = { 'Crowd Psychology': 'Crowd' };
const shortCat = (n) => CAT_SHORT[n] || n;
// Daily puzzles publish a fresh dated instance ('<key>-M-D-YY') each day that is
// NOT a static QUIZZES entry, so titleById can't resolve it. Build a display
// title from the roster so the live feed / Last Played tile still surface daily
// plays; without this a whole daily puzzle silently drops out of the feed (the
// newer games were missing for exactly this reason).
const DG_NAME = Object.fromEntries((DAILY_GAMES || []).map((g) => [g.key, g.name]));
const DAILY_DATED_ID_RE = /^([a-z]+)-(\d{1,2})-(\d{1,2})-(\d{2})$/;
function dailyTitleFor(id) {
  const m = DAILY_DATED_ID_RE.exec(id || '');
  if (!m || !DG_NAME[m[1]]) return null;
  const [, key, mo, da, yr] = m;
  let t = `${DG_NAME[key]}: ${mo}/${da}/${yr}`;
  // A dated daily instance whose own date is a Sunday shows the Sunday Edition
  // suffix, but only for games that actually run a Sunday variant. getDay() on
  // the calendar date is timezone-independent for the day-of-week.
  if (hasSundayEdition(key) && new Date(2000 + Number(yr), Number(mo) - 1, Number(da)).getDay() === 0) {
    t += ` (${SUNDAY_LABEL})`;
  }
  return t;
}
// Daily-game hero banners: /public/games/hero/<family>.png, the game's own icon
// on a white app-icon plate over the site navy, built from /public/games/btn-*.png
// by scripts/generate-game-heroes.py. The plate is load-bearing, the hero tile
// lays a dark scrim over the image and a light banner would vanish under it.
//
// These REPLACE the per-date /quiz-heroes/<family>.png entries that QUIZ_HEROES
// carries for every daily puzzle. Those are wide promo cards (big wordmark, tagline,
// a mindloftdaily.com URL) built for sharing, and they read as an advert rather
// than a hero when cropped into a column card, which is why the banner wins here.
// Checked BEFORE QUIZ_HEROES for exactly that reason (owner, 2026-07-20).
// `closer` is deliberately absent: it has no btn art, so it keeps its promo card.
const DG_HERO_FAMS = new Set(['alibi', 'axiom', 'bracket', 'carve', 'cipher', 'circa', 'crux', 'dating', 'emcee', 'extra',
  'garble', 'hearsay', 'jester', 'links', 'outwit', 'outrank', 'ping', 'span', 'stands', 'stet', 'suds', 'sworn', 'tally', 'tuck', 'venn', 'warmer', 'shards', 'lode']);
// One resolver for every hero image on the page: a daily puzzle's icon banner if it
// has one, else the quiz's own photo, else the department hero, else the fallback.
// `pos` is the background-position that goes with the chosen image.
function heroFor(id, dept) {
  const fam = gameFamily(id);
  // The banner is drawn around a centred icon, so it must not be re-positioned.
  if (fam && DG_HERO_FAMS.has(fam)) return { src: `/games/hero/${fam}.png`, pos: 'center' };
  const qh = id ? QUIZ_HEROES[id] : null;
  if (qh && qh.src) return { src: qh.src, pos: qh.pos };
  if (dept === 'sports') { const sh = sportHeroFor({ id }); if (sh) return { src: sh, pos: undefined }; }
  return { src: DEPT_HERO[dept] || FALLBACK_HERO, pos: undefined };
}
// Business News hub quizzes are normally kept out of the Newest tile/panel, but
// individual ids can be allowlisted to headline there (owner decision). The Netflix
// earnings quiz is allowlisted so its print-day quiz can be the Newest tile.
const NEWEST_BN_ALLOW = new Set(['weekly-business-quiz-2026-07-31', 'paypal-2q26-earnings-quiz', 'netflix-2q26-earnings-quiz', 'tesla-2q26-earnings-quiz', 'alphabet-2q26-earnings-quiz', 'intel-2q26-earnings-quiz']);
const bnHiddenFromNewest = (id) => isBusinessNewsHubQuiz(id) && !NEWEST_BN_ALLOW.has(id);

// Per-quiz completion status for the CURRENT player, supplied once at the top of
// the tree so any quiz row can show a check (played) or a circled check (aced at
// 100%) without threading props. Visible only to that player (built from their
// own profile). Empty for signed-out/preview visitors.
const QuizDoneContext = createContext({ played: null, completed: null });
function DoneMark({ id, size = 13 }) {
  const { played, completed } = useContext(QuizDoneContext);
  if (!id || (!played && !completed)) return null;
  if (completed && completed.has(id)) {
    return <Star className="donemark" size={size} strokeWidth={1.5} fill={T.gold} color={T.goldInk} style={{ flex: 'none', marginLeft: 5, verticalAlign: '-2px' }} aria-label="Completed (100%)" />;
  }
  if (played && played.has(id)) {
    return <Check className="donemark" size={size} strokeWidth={2.75} style={{ color: C.live, flex: 'none', marginLeft: 5, verticalAlign: '-2px' }} aria-label="Played" />;
  }
  return null;
}

// One lucide icon per department (no global CSS / webfonts).
const DEPT_ICON = {
  movies: Clapperboard, music: Music, gaming: Gamepad2, travel: Plane,
  sports: Trophy, geography: Globe, food: Utensils, business: Briefcase,
  science: Leaf, entertainment: Tv, literature: BookOpen, history: Landmark,
  school: GraduationCap, misc: Sparkles,
};

function seededShuffle(arr, seed) {
  const out = arr.slice();
  let s = (seed >>> 0) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    const j = (s >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function cleanTitle(t) { return (t || '').replace(/^Name (the )?/i, '').trim(); }
// Drop a leading action verb (and an optional the/all the/these) from a browse
// title for a tighter, scannable label. The FULL title is kept as the link's
// tooltip. e.g. "Click the Countries of Europe" -> "Countries of Europe",
// "Match the Slogan to the Company" -> "Slogan to the Company".
const VERB_RE = /^(Click|Name|Guess|Find|Identify|Pick|Select|Match|Pinpoint)\b\s*(all the|the|these)?\s*/i;
const FALLBACK_HERO = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Earth%27s_City_Lights_by_DMSP%2C_1994-1995_%28large%29.jpg/1280px-Earth%27s_City_Lights_by_DMSP%2C_1994-1995_%28large%29.jpg';
// Promo tiles pinned to the very end of the browse grid (they link OUT of the
// main quiz catalog). Heroes are local SVGs in /public.
const PROMO_HERO = {
  business: '/qhero-business.svg',
  kids: '/qhero-kids.svg',
  tests: '/qhero-tests.svg',
};
// Rows shown inside the Standardized Tests tile (the six /exams practice tests).
const EXAM_TILE_ROWS = [
  { id: 'gmat', title: 'GMAT', href: '/gmat' },
  { id: 'sat', title: 'SAT', href: '/sat' },
  { id: 'act', title: 'ACT', href: '/act' },
  { id: 'gre', title: 'GRE', href: '/gre' },
  { id: 'lsat', title: 'LSAT', href: '/lsat' },
  { id: 'lsat-logic-game-gallery-wall', title: 'Logic Games: The Gallery Wall', rawTitle: 'LSAT Logic Games: The Gallery Wall', href: '/quiz/lsat-logic-game-gallery-wall' },
];
// The six standardized-test practice tests (/lsat, /gmat, /sat, /act, /gre,
// /mcat). Finishing one (tracked in localStorage 'sot_exam_done' by
// ExamQuizClient) counts toward the Standardized Tests mastery bar alongside
// the LSAT logic-game quizzes (dept 'school').
const EXAM_SLUGS = ['lsat', 'gmat', 'sat', 'act', 'gre', 'mcat'];
function stripVerb(t) {
  const out = (t || '').replace(VERB_RE, '').trim();
  return out || (t || '');
}
function relTime(iso) {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
function getAnonId() {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('sot_quiz_anon'); } catch { return null; }
}
function getIdentity() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('sot_quiz_identity')); } catch { return null; }
}

// ─── small presentational bits ──────────────────────────────────────────────
// Wraps a player name so clicking it opens that player on the Stat Hub
// (?player=<key>). Used inside quiz-row anchors, so it suppresses the parent
// link's navigation. No key (unattributable play) renders plain, unlinked.
function PlayerLink({ userKey, children }) {
  const router = useRouter();
  if (!userKey) return children;
  const go = (e) => { e.preventDefault(); e.stopPropagation(); router.push(`/quizzes/hub?player=${encodeURIComponent(userKey)}`); };
  return (
    <span role="link" tabIndex={0} onClick={go} onKeyDown={(e) => { if (e.key === 'Enter') go(e); }} style={{ cursor: 'pointer' }}>{children}</span>
  );
}

function WhoTag({ name, isAnon }) {
  if (isAnon) return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <span style={{ fontWeight: 600, color: C.muted }}>{name}</span>{' '}
      <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: C.soft, border: `1px solid ${C.line}`, borderRadius: 4, padding: '1px 4px' }}>guest</span>
    </span>
  );
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <span style={{ fontWeight: 700 }}>{name}</span>{' '}
      <BadgeCheck size={12} strokeWidth={2.5} style={{ color: C.accent, verticalAlign: '-2px' }} aria-hidden="true" />
    </span>
  );
}

function Medal({ i }) {
  if (i < 3) return (
    <span className="medaldot" style={{ flex: 'none', width: 18, height: 18, borderRadius: '50%', background: MEDAL[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.ink }}>{i + 1}</span>
  );
  return <span style={{ flex: 'none', width: 18, textAlign: 'center', fontSize: 11, color: C.soft }}>{i + 1}</span>;
}

// Leaderboard row: medal + name + value, with a gold/silver/bronze (neutral
// for 4th+) progress bar under the name scaled to the top score.
function LbRow({ i, name, value, frac }) {
  const col = i < 3 ? MEDAL[i] : C.soft;
  const w = Math.max(4, Math.min(100, Math.round((frac || 0) * 100)));
  return (
    <div className="lrow">
      <Medal i={i} />
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="qtitle" style={{ flex: '1 1 auto' }}>{name}</span>
          <span style={{ flex: 'none', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        </div>
        <div style={{ height: 3, borderRadius: 3, background: T.surfaceAlt, marginTop: 4, overflow: 'hidden' }}><div className="lbbar" style={{ height: '100%', width: `${w}%`, background: col }} /></div>
      </div>
    </div>
  );
}

// Sign-up popup: claim a display name (email optional) so the player's name
// shows on the leaderboards. Posts to /api/quiz/join, stores identity, reloads.
function SignupModal({ onClose }) {
  const [u, setU] = useState('');
  const [em, setEm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const inp = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 13px', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 15, color: C.ink, outline: 'none' };
  async function submit() {
    setErr('');
    if (!u.trim()) { setErr('Pick a display name'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/quiz/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u.trim(), email: em.trim() || undefined, anonId: getAnonId() }) });
      const d = await r.json();
      if (d && d.username) {
        try { localStorage.setItem('sot_quiz_identity', JSON.stringify({ username: d.username, email: d.email || undefined })); } catch (e) {}
        window.location.reload();
      } else { setErr((d && d.error) || 'Could not sign up. Try again.'); setBusy(false); }
    } catch (e) { setErr('Could not sign up. Try again.'); setBusy(false); }
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(20,22,28,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: '100%', background: T.white, borderRadius: 14, border: `1px solid ${C.line}`, padding: 22, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>Claim your name</div>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.soft, display: 'flex' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px', lineHeight: 1.5 }}>Pick a display name to appear on the leaderboards. Email is optional, only used to recover your name on another device. No password needed.</p>
        {err && <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.4)', color: T.danger, fontSize: 13 }}>{err}</div>}
        <input value={u} onChange={(e) => setU(e.target.value)} placeholder="Display name" maxLength={15} style={inp} />
        <input value={em} onChange={(e) => setEm(e.target.value)} placeholder="Email (optional)" maxLength={120} style={{ ...inp, marginTop: 10 }} />
        <button onClick={submit} disabled={busy} style={{ marginTop: 16, width: '100%', background: C.cta, color: C.ctaInk, border: 'none', borderRadius: 10, padding: '12px', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'Joining…' : 'Join the leaderboard'}</button>
        <SigninHelp name={u} email={em} prominent={isLockedOut(err)} />
      </div>
    </div>
  );
}

// Report an issue / Talk to the manager. Two entry points, ONE form and one
// pipeline: both POST /api/complaints (the same `complaints` table + admin
// "Notices" tab that list feedback and the per-quiz Critique modal use). Only
// the heading, blurb and the stored list_title differ, so the editors can tell
// a bug report from a note to the manager. "Request a quiz" is NOT wired here:
// it links straight to the existing /request form.
const FEEDBACK_MODES = {
  issue: {
    heading: 'Report an issue',
    blurb: 'Something broken, a wrong answer, a tile that will not load? Tell us what happened and where.',
    placeholder: 'What went wrong? Include the puzzle or quiz name if you can.',
    title: 'Quiz home: issue report',
    cta: 'Send report',
  },
  manager: {
    heading: 'Talk to the manager',
    blurb: 'Praise, complaints, an idea for the site, or anything you want a human to read. This goes straight to the editors.',
    placeholder: 'What is on your mind?',
    title: 'Quiz home: talk to the manager',
    cta: 'Send message',
  },
};

function FeedbackModal({ mode, onClose }) {
  const cfg = FEEDBACK_MODES[mode] || FEEDBACK_MODES.issue;
  const [msg, setMsg] = useState('');
  const [nm, setNm] = useState('');
  const [em, setEm] = useState('');
  // A signed-in player's name + email prefill the reply fields, so a report
  // always comes back with somewhere to answer it. Still editable, still
  // optional: a guest sees empty fields exactly as before.
  useEffect(() => {
    const who = savedIdentity();
    if (who.username) setNm((v) => v || who.username);
    if (who.email) setEm((v) => v || who.email);
  }, []);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const inp = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 13px', fontFamily: FONT, fontSize: 14, color: C.ink, outline: 'none' };
  async function submit() {
    setErr('');
    if (!msg.trim()) { setErr('Add a note so we know what to look at'); return; }
    setBusy(true);
    try {
      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: `quiz-home-${mode}`, listTitle: cfg.title, message: msg.trim(), name: nm.trim(), email: em.trim() }),
      });
    } catch (e) {
      // Best effort, same as the per-quiz critique modal: we still acknowledge.
    }
    setSent(true);
    setBusy(false);
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(20,22,28,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: '100%', background: T.white, borderRadius: 14, border: `1px solid ${C.line}`, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{sent ? 'Thanks, noted.' : cfg.heading}</div>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.soft, display: 'flex' }}><X size={18} /></button>
        </div>
        {sent ? (
          <>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px', lineHeight: 1.5 }}>It went to the editors&apos; desk. We read every one.</p>
            <button onClick={onClose} style={{ width: '100%', background: C.cta, color: C.ctaInk, border: 'none', borderRadius: 10, padding: 12, fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Close</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px', lineHeight: 1.5 }}>{cfg.blurb}</p>
            {err && <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.4)', color: T.danger, fontSize: 13 }}>{err}</div>}
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={cfg.placeholder} maxLength={1000} rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.45 }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <input value={nm} onChange={(e) => setNm(e.target.value)} placeholder="Name (optional)" maxLength={120} style={inp} />
              <input value={em} onChange={(e) => setEm(e.target.value)} placeholder="Email (optional)" maxLength={200} style={inp} />
            </div>
            <button onClick={submit} disabled={busy} style={{ marginTop: 16, width: '100%', background: C.cta, color: C.ctaInk, border: 'none', borderRadius: 10, padding: 12, fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'Sending…' : cfg.cta}</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── main ───────────────────────────────────────────────────────────────────
// THE HOME GROUND IS DEEPER THAN T.paper, ON PURPOSE (owner, 2026-08-25).
// Measured before the change: the whole page lived inside a 4% slice of the
// value range (ground #f4f6f9, cards #ffffff, tiles #f7f8fa, card shadow at 4%
// opacity over 2px of blur), so nothing could read as sitting forward of
// anything else. Dropping the ground is the cheapest fix: every white card on
// the page, the marquee shelves and the quiz browse sheets alike, starts
// reading as a lit surface instead of blending into the page.
//
// DO NOT "fix" this by moving T.paper. That token is the ground on every daily
// GAME page, where a white board sits on it and the contrast is already right.
// This is the home surface only.
const HOME_GROUND = '#e7ecf3';

export default function QuizHomeClient({ variant = 'current', sourceCount = 0, stageDefault = true}) {
  // HOME v3, served at /home-preview only. Everything it changes is gated on
  // this one flag, so / renders byte-identically to before.
  const v3 = variant === 'v3';
  const [scope, setScope] = useState('all');
  const [ddOpen, setDdOpen] = useState(false);
  const playerBarRef = useRef(null);
  const bestCatRef = useRef(null);
  const quizzesRef = useRef(null);
  // The inner surfaces' nav has no browse row to scroll to, so its Quizzes link
  // is `/#quizzes` and the jump happens here on arrival. jumpToQuizzes handles
  // resolving WHICH search field is on screen (the two swap at 820px) and
  // offsetting for the sticky bar; what it cannot handle is WHEN.
  //
  // A single deferred call is not enough, verified live: the browse row's final
  // position is not settled at first paint, because the three-column daily
  // section above it fills in from async data and pushes it down. An 80ms call
  // focused the field but computed its target against the pre-fill layout and
  // left the page at scrollY 0. So re-run on a short schedule until the layout
  // stops moving, and stand down the instant the visitor takes the scroll over
  // themselves, which is the only way a repeated scrollTo could annoy anyone.
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash !== '#quizzes') return undefined;
    let cancelled = false;
    const stop = () => { cancelled = true; };
    const evs = ['wheel', 'touchstart', 'keydown'];
    evs.forEach((e) => window.addEventListener(e, stop, { passive: true }));
    const timers = [140, 700, 1500].map((ms) => setTimeout(() => { if (!cancelled) jumpToQuizzes(); }, ms));
    return () => {
      timers.forEach(clearTimeout);
      evs.forEach((e) => window.removeEventListener(e, stop));
    };
  }, []);
  const [search, setSearch] = useState('');
  const [listMode, setListMode] = useState(null); // null | 'newest' | 'mostplayed' | 'live' (View all expansions)
  const [doneFilter, setDoneFilter] = useState('all'); // 'all' | 'unplayed' | 'played' | 'completed' (my-progress filter)
  const [boardsExpanded, setBoardsExpanded] = useState(false); // header click expands both boards 5 -> 10
  const [cmOpen, setCmOpen] = useState(false); // right-rail Category Mastery collapsed to its title by default
  // Desktop: pin the left + right rails to the center board's height, so the
  // left leaderboards split into equal boxes and Category Mastery expands UP
  // into Last Played's space instead of pushing the page down.
  const centerRef = useRef(null);
  const [railH, setRailH] = useState(null);
  // v3 only: publish the sticky masthead's height so the pinned rail can sit
  // directly under it and size itself to the rest of the viewport. Measured
  // rather than hardcoded, the same reasoning as --dh-fit on the slate board.
  useEffect(() => {
    if (!v3 || typeof window === 'undefined') return undefined;
    const set = () => {
      try {
        const el = document.querySelector('.qchm-r1') || document.querySelector('.qchm');
        const h = el ? Math.round(el.getBoundingClientRect().height) : 56;
        document.documentElement.style.setProperty('--v3top', (h + 12) + 'px');
      } catch (e) {}
    };
    set();
    const t = setTimeout(set, 500);
    window.addEventListener('resize', set);
    return () => { window.removeEventListener('resize', set); clearTimeout(t); };
  }, [v3]);
  // v3 only: publish the sticky masthead's height so the pinned rail can sit
  // directly under it and size itself to the rest of the viewport. Measured
  // rather than hardcoded, the same reasoning as --dh-fit on the slate board.
  useEffect(() => {
    if (!v3 || typeof window === 'undefined') return undefined;
    const set = () => {
      try {
        const el = document.querySelector('.qchm-r1') || document.querySelector('.qchm');
        const h = el ? Math.round(el.getBoundingClientRect().height) : 56;
        document.documentElement.style.setProperty('--v3top', (h + 12) + 'px');
        // The rail STICKS at --v3top, but until the page is scrolled it SITS
        // lower than that, because the stat bar above it is not sticky. Sizing
        // it off the sticky offset therefore hangs it below the fold at scroll
        // zero by exactly that difference (measured: sticks at 67, sits at 133,
        // so 66px of it was under the fold and three of the four accordion
        // bands with it). Size it off where it actually STARTS instead. The
        // centre column is not sticky, so its document top is the row's true
        // top, and the rail can then only ever come up SHORT once stuck, which
        // is invisible, never long, which is the bug.
        const row = document.querySelector('.dhx-v3 .dhx-center');
        if (row) document.documentElement.style.setProperty('--v3nat', Math.round(row.getBoundingClientRect().top + window.scrollY) + 'px');
      } catch (e) {}
    };
    set();
    const t = setTimeout(set, 500);
    window.addEventListener('resize', set);
    return () => { window.removeEventListener('resize', set); clearTimeout(t); };
  }, [v3]);
  useEffect(() => {
    const el = centerRef.current;
    if (!el) return undefined;
    const measure = () => { try { setRailH((typeof window !== 'undefined' && window.innerWidth > 1200) ? el.offsetHeight : null); } catch (e) {} };
    measure();
    // The centre settles LATE: the daily board measures itself after mount and
    // then sizes its own window, which changes this column's height. Observing
    // only the column missed that, so the rails stayed pinned to the taller
    // first-paint height until something else fired a resize. Watch the console
    // itself as well, and re-measure once the first frames have settled.
    const raf = requestAnimationFrame(() => requestAnimationFrame(measure));
    const t1 = setTimeout(measure, 400);
    const t2 = setTimeout(measure, 1200);
    let ro;
    try {
      ro = new ResizeObserver(measure);
      ro.observe(el);
      const console_ = el.querySelector('.dhome');
      if (console_) ro.observe(console_);
    } catch (e) {}
    if (typeof window !== 'undefined') window.addEventListener('resize', measure);
    return () => {
      try { ro && ro.disconnect(); } catch (e) {}
      cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2);
      if (typeof window !== 'undefined') window.removeEventListener('resize', measure);
    };
  }, []);
  // Leaderboard data for the left element (rebuilt from data so the three
  // sections lay out cleanly — no embedded-tile gaps / overlap / mobile break).
  const [refData, setRefData] = useState(null); // community referrals { top:[{username,credits}] }
  const [xp30, setXp30] = useState([]); // 30-day IQ Points [{ name, value }]
  const [xpAll, setXpAll] = useState([]); // all-time IQ Points [{ name, value }]
  const [xpFlip, setXpFlip] = useState(0); // Top SoT Player flips 30d (even) <-> all-time (odd), like the old tile
  const [xpToday, setXpToday] = useState([]); // IQ Points earned so far today, Eastern day [{ name, value }]
  const [dailyFlip, setDailyFlip] = useState(0); // Daily Puzzle board flips standings (even) <-> today's IQ gainers (odd)
  const [creditOpen, setCreditOpen] = useState(false); // "share a link to get credit" modal
  const [creditCopied, setCreditCopied] = useState(false);
  // The QR poster offer inside that modal, collapsed until asked for. The modal
  // is opened to copy a link, so the poster is an aside, never the thing in the
  // way. Reset every time the modal opens.
  const [creditQr, setCreditQr] = useState(false);
  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams();
    try { const anon = localStorage.getItem('sot_quiz_anon'); if (anon) qs.set('anonId', anon); const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (id && id.email) qs.set('email', id.email); } catch (e) {}
    fetch('/api/quiz/referrals' + (qs.toString() ? `?${qs.toString()}` : '')).then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d) setRefData(d); }).catch(() => {});
    fetch('/api/quiz/xp?sort=xp30d').then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d && Array.isArray(d.players)) setXp30(d.players.filter((p) => (p.xp30d || 0) > 0).slice(0, 10).map((p) => ({ name: p.name, value: p.xp30d }))); }).catch(() => {});
    fetch('/api/quiz/xp').then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d && Array.isArray(d.players)) setXpAll(d.players.filter((p) => (p.xp || 0) > 0).slice(0, 10).map((p) => ({ name: p.name, value: p.xp }))); }).catch(() => {});
    fetch('/api/quiz/xp?sort=xpToday').then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d && Array.isArray(d.players)) setXpToday(d.players.filter((p) => (p.xpToday || 0) > 0).slice(0, 10).map((p) => ({ name: p.name, value: p.xpToday }))); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  useEffect(() => { const iv = setInterval(() => setXpFlip((v) => v + 1), 8000); return () => clearInterval(iv); }, []);
  // Same 8s cadence as the player board, offset by 4s so the two rail sections
  // never turn over on the same beat.
  useEffect(() => {
    let iv = null;
    const t = setTimeout(() => { setDailyFlip((v) => v + 1); iv = setInterval(() => setDailyFlip((v) => v + 1), 8000); }, 4000);
    return () => { clearTimeout(t); if (iv) clearInterval(iv); };
  }, []);
  const [mobileBoard, setMobileBoard] = useState(null); // mobile-only: null | 'lb' | 'live' (which board panel is shown)
  // Daily puzzles row: Crux is pinned top-right on mobile; the top-LEFT slot
  // cycles through the other dailies on each page load (localStorage counter,
  // set post-mount so SSR/hydration stay deterministic).
  const [gameRot, setGameRot] = useState('garble');
  useEffect(() => {
    try {
      const others = ['garble', 'links', 'span', 'dating', 'tally'];
      const n = (parseInt(localStorage.getItem('sot_hub_game_rot') || '-1', 10) + 1) % others.length;
      localStorage.setItem('sot_hub_game_rot', String(n));
      setGameRot(others[n]);
    } catch (e) {}
  }, []);
  const lastTapRef = useRef({ k: null, t: 0 });
  const dblTapBoard = (k) => {
    const now = Date.now(); const last = lastTapRef.current;
    if (last.k === k && now - last.t < 400) { setMobileBoard((v) => (v === k ? null : k)); lastTapRef.current = { k: null, t: 0 }; }
    else { lastTapRef.current = { k, t: now }; }
  };

  // NOTE: this is a WHITELIST, not a spread, so a new field on /api/quiz/totals
  // has to be added in BOTH places below or it silently arrives as undefined.
  // todayPlayers did exactly that on 2026-08-12 and rendered "0 players" on the
  // Loft's live slab while the endpoint itself was returning 94.
  const [totals, setTotals] = useState({ byQuiz: {}, recent7: {}, leaders: {}, leaderKeys: {}, today: 0, todayPlayers: 0, todayByQuiz: {}, todayTime: 0, toughest: null });
  const [xpBoard, setXpBoard] = useState([]); // [{rank,name,isAnon,userKey}]
  const [xpScope, setXpScope] = useState('all');
  const [catBoards, setCatBoards] = useState({}); // { dept: [{rank,name,isAnon,userKey,rating}] } for the "Top Rated <Category>" slides
  const [recent, setRecent] = useState([]); // [{quizId,username,score,total,playedAt,isAnon,attempt}]
  // Plays since Eastern midnight, per quiz id, from the same /api/quiz/recent
  // payload. Drives the "(x25)" day-count chip on each live feed row.
  const [dayPlays, setDayPlays] = useState({});
  const [me, setMe] = useState(null);
  const [lbIdx, setLbIdx] = useState(0); // which leaderboard stat is showing
  const [view, setView] = useState('compact'); // 'compact' | 'detailed' browse layout
  const [statsById, setStatsById] = useState({}); // /api/quiz/stats keyed by quizId
  const [signupOpen, setSignupOpen] = useState(false);
  // Read in an effect: this page is statically rendered, where useSearchParams
  // hands back null and the flag silently reads false.
  // THE STAGE REPLACES THIS PAGE, it does not sit inside it (owner,
  // 2026-08-31: "grey slab surround both above and to the sides").
  //
  // TodayClient's own default was flipped to the stage first, and this one was
  // missed — so `/` kept rendering the whole quiz-home shell and the stage came
  // up INSIDE .dhx-marquee: 1512px wide, inset 197px, with .qzloft painting grey
  // around it and the entire old home still below it. The early return below is
  // what makes the stage the page, so its condition has to match TodayClient's:
  // on by default, '?stage=0' to opt out.
  // Seeded by the SERVER from the URL, so the first paint is already the right
  // page. The effect stays as the client-side correction for a soft navigation,
  // where the prop was computed for a different URL.
  const [stageHome, setStageHome] = useState(stageDefault);
  useEffect(() => {
    try { setStageHome(new URLSearchParams(window.location.search).get('stage') !== '0'); } catch (e) { setStageHome(true); }
  }, []);
  const [feedbackMode, setFeedbackMode] = useState(null); // null | 'issue' | 'manager' (the tool row's first two buttons)
  const [duels, setDuels] = useState([]); // last few completed duels, for the header ticker
  const [dailyLead, setDailyLead] = useState(null); // daily-board leader for the header ticker
  const [dailyBoard, setDailyBoard] = useState(null); // full daily-combined payload (passed to DailyStrip's leaderboard)
  const [statsOpen, setStatsOpen] = useState(false);
  const [dailyLb, setDailyLb] = useState(null); // today's daily-challenge standings (registered players)
  const [chRun, setChRun] = useState(null); // local run-state for today's daily challenge (completion ticks)
  const [examsDone, setExamsDone] = useState({}); // { <examSlug>: true } finished practice tests (localStorage 'sot_exam_done')
  const [isMobile, setIsMobile] = useState(false);
  const [acc, setAcc] = useState({ lastplayed: true, mostplayed: true, newest: true, daily: true }); // mobile-only: which accordion panels are open
  const [lbLiveTab, setLbLiveTab] = useState(null); // mobile combined leaderboard/live: null | 'lb' | 'live'
  const toggleAcc = (k) => setAcc((o) => ({ ...o, [k]: !o[k] }));
  const mobLbOpen = false; // mobile leaderboard shows top 5 (desktop click-to-expand still applies via boardsExpanded)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width:560px)');
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const [todayData, setTodayData] = useState({ byCorrect: [], byQuizzes: [] }); // /api/quiz/today leaders
  // Today's daily challenge (deterministic from the date; no server state needed).
  const daily = useMemo(() => getDailyChallenge(), []);
  const qotd = useMemo(() => {
    const existing = new Set(QUIZZES.map((q) => q.id));
    let id = qotdIdFor(easternYmd(), existing);
    let q = id ? QUIZZES.find((x) => x.id === id) : null;
    if (!q) { for (const hid of Object.keys(QUIZ_HEROES)) { const cand = QUIZZES.find((x) => x.id === hid); if (cand) { q = cand; id = hid; break; } } }
    if (!q) return null;
    const h = QUIZ_HEROES[id] || {};
    return { id: q.id, eyebrow: `Quiz of the Day · ${DEPT_LABEL[deptOf(q)] || 'Quiz'}`, title: cleanTitle(q.title), blurb: q.blurb || '', hero: h.src || '', pos: h.pos };
  }, []);
  const dailyCat = daily ? daily.accent : '';
  // Every challenge open right now (today's daily + open events like the Outline
  // Challenge). The header CTA rotates through these like the leaderboard slides.
  const openChs = useMemo(() => openChallenges(), []);
  // Business News moved to its own tile at the end of the browse grid, so the
  // browse-row rotating CTA is now empty (curCh becomes null → nothing renders).
  const rotation = useMemo(() => [], []);
  const [chSlide, setChSlide] = useState(0);
  useEffect(() => {
    if (rotation.length < 2) return;
    const id = setTimeout(() => setChSlide((i) => (i + 1) % rotation.length), 5000);
    return () => clearTimeout(id);
  }, [chSlide, rotation.length]);
  const curCh = rotation.length ? rotation[chSlide % rotation.length] : null;
  // Count visits to the quizzes index in the per-quiz analytics, under the
  // pseudo quiz id 'home' (mirrors the homepage's 'home' list-view row).
  // Deduped to once per browser session. Restored 2026-06-28 after the June 18
  // redesign dropped it.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('sot-quizhome-viewed') === '1';
      if (!seen) sessionStorage.setItem('sot-quizhome-viewed', '1');
    } catch (e) { /* sessionStorage unavailable: count this load */ }
    if (!seen) {
      fetch('/api/quiz/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: 'home' }),
      }).catch(() => {});
    }
  }, []);

  // Restore the saved browse-view preference once on mount.
  useEffect(() => {
    try { const v = localStorage.getItem('sot_quiz_browse_view'); if (v === 'detailed' || v === 'compact') setView(v); } catch {}
  }, []);
  function setBrowseView(v) { setView(v); try { localStorage.setItem('sot_quiz_browse_view', v); } catch {} }

  // Build the catalog once: every quiz, with its department + nav title.
  const catalog = useMemo(() => (QUIZZES || []).filter((q) => q && q.id && !q.unlisted && (!q.publishedAt || Date.parse(q.publishedAt) <= Date.now())).map((q) => ({
    id: q.id,
    title: q.navTitle || cleanTitle(q.title) || q.id,
    rawTitle: q.title || '',
    category: q.category || '',
    blurb: q.blurb || '',
    dept: deptOf(q),
    publishedAt: q.publishedAt || (q.publishedDate ? `${q.publishedDate}T12:00:00Z` : ''),
  })), []);

  const titleById = useMemo(() => Object.fromEntries(catalog.map((q) => [q.id, q.title])), [catalog]);
  // Resolve a play row's title: static catalog first, then a generated daily
  // title for dated daily instances that are not static QUIZZES entries.
  const resolveTitle = (id) => titleById[id] || dailyTitleFor(id);
  // Play-feed rows carry only a quizId, so heroFor() needs a dept lookup.
  const deptById = useMemo(() => Object.fromEntries(catalog.map((q) => [q.id, q.dept])), [catalog]);

  // Today's daily challenge: ordered quiz ids + local completion (run-state).
  const dailyId = daily ? daily.id : null;
  const dailyIds = useMemo(() => (daily ? challengeQuizIds(daily) : []), [daily]);
  const chScores = (chRun && chRun.scores) || {};
  // Server-truth completion for the signed-in player (cross-device): the daily
  // challenge leaderboard carries each registered user's per-quiz scores today.
  const myDaily = useMemo(() => (dailyLb || []).find((u) => (me && me.userKey && u.userKey === me.userKey) || (me && me.username && u.username && u.username.toLowerCase() === me.username.toLowerCase())) || null, [dailyLb, me]);
  const serverScores = (myDaily && myDaily.scores) || {};
  const dailyIsDone = (id) => !!chScores[id] || serverScores[id] != null;
  const dailyDoneCount = dailyIds.filter(dailyIsDone).length;
  // Leader of today's challenge board (already sorted best-first by the API).
  const dailyChLeader = (() => {
    const top = (dailyLb || [])[0];
    return top && top.username && (top.totalCorrect || 0) > 0 ? top.username : '';
  })();
  const dailyAllDone = dailyIds.length > 0 && dailyDoneCount === dailyIds.length;
  const dailyNextIdx = (() => { const k = dailyIds.findIndex((id) => !dailyIsDone(id)); return k < 0 ? 0 : k; })();
  const dailyEntryUrl = (dailyId && dailyIds.length) ? `/quiz/${dailyIds[dailyNextIdx]}?ch=${encodeURIComponent(dailyId)}&i=${dailyNextIdx}` : '/quizzes';
  const dailyDateLabel = daily ? (() => { try { return new Date(`${daily.date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); } catch { return ''; } })() : '';

  // Departments present, with counts, ordered by size desc (mockup order).
  const cats = useMemo(() => {
    const byDept = new Map();
    for (const q of catalog) {
      if (!byDept.has(q.dept)) byDept.set(q.dept, []);
      byDept.get(q.dept).push(q);
    }
    const list = [];
    for (const { id } of DEPT_NAV) if (byDept.has(id)) list.push(id);
    for (const k of byDept.keys()) if (!list.includes(k)) list.push(k);
    return list.map((key) => {
      const color = DEPT_COLOR[key] || DEPT_COLOR.misc;
      return {
        key,
        label: DEPT_LABEL[key] || 'Quiz',
        c: color.c, t: color.t,
        Icon: DEPT_ICON[key] || Sparkles,
        quizzes: byDept.get(key),
        count: byDept.get(key).length,
      };
    }).sort((a, b) => b.count - a.count);
  }, [catalog]);
  const byKey = useMemo(() => Object.fromEntries(cats.map((c) => [c.key, c])), [cats]);
  const quizCats = useMemo(() => {
    const seen = new Set((me && me.found && me.playedIds) || []);
    return cats.map((c) => ({
      key: c.key,
      label: c.label,
      count: c.count,
      played: c.quizzes.reduce((n, q) => n + (seen.has(q.id) ? 1 : 0), 0),
      // A department's six picks SKIP its dated daily-game archive (Crux 7/6/26,
      // 7/7/26, ...). Those are one game's back catalogue sitting in catalog
      // order, so on Word Puzzles they filled all six slots and the slate's fill
      // panel recommended the same puzzle six times.
      //
      // TEST THE ID, NOT THE UNIT. The first attempt filtered on
      // dailyUnitOfQuizId, which returns a game's SCORING UNIT and is null for
      // every game that has none, so it read "not a daily" for exactly the games
      // it was meant to catch and Crux sailed straight through. Match the dated
      // shape and confirm the prefix is a real daily.
      //
      // UNPLAYED FIRST, for the same reason: a pick you have already finished is
      // not a recommendation. Played ones only backfill once the unplayed run out.
      top: (() => {
        const dated = /^([a-z]+)-\d{1,2}-\d{1,2}-\d{2}$/;
        const isDaily = (id) => { const m = dated.exec(id || ''); return !!(m && DAILY_GAME_MAP[m[1]]); };
        const pool = c.quizzes.filter((q) => !isDaily(q.id));
        const list = pool.length ? pool : c.quizzes;
        const fresh = list.filter((q) => !seen.has(q.id));
        const order = fresh.length >= 6 ? fresh : fresh.concat(list.filter((q) => seen.has(q.id)));
        return order.slice(0, 6).map((q) => ({ id: q.id, title: q.title || q.id, done: seen.has(q.id) }));
      })(),
    }));
  }, [cats, me]);

  const totalCount = catalog.length;
  const scopeCount = scope === 'all' ? totalCount : (byKey[scope]?.count || 0);
  // My-progress filter: split the catalog by the player's played/aced status,
  // matching the row icons (green check = played, gold star = aced at 100%).
  const statusSets = useMemo(() => ({
    played: new Set((me && me.found && me.playedIds) || []),
    completed: new Set((me && me.found && me.completedIds) || []),
  }), [me]);
  const statusCounts = useMemo(() => {
    const pl = statusSets.played, cp = statusSets.completed;
    const playedNotAced = [...pl].filter((id) => !cp.has(id)).length;
    return { unplayed: Math.max(0, totalCount - pl.size), played: playedNotAced, completed: cp.size };
  }, [statusSets, totalCount]);
  const statusList = useMemo(() => {
    if (doneFilter === 'all') return null;
    const pl = statusSets.played, cp = statusSets.completed;
    return catalog.filter((q) => {
      const p = pl.has(q.id), c = cp.has(q.id);
      if (doneFilter === 'completed') return c;
      if (doneFilter === 'played') return p && !c;
      return !p; // unplayed
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [doneFilter, catalog, statusSets]);

  // ── data loads ──
  useEffect(() => {
    fetch('/api/quiz/totals').then((r) => r.json()).then((d) => {
      if (d && !d.error) setTotals({ byQuiz: d.byQuiz || {}, recent7: d.recent7 || {}, leaders: d.leaders || {}, leaderKeys: d.leaderKeys || {}, today: d.today || 0, todayPlayers: d.todayPlayers || 0, todayByQuiz: d.todayByQuiz || {}, todayTime: d.todayTime || 0, toughest: d.toughest || null });
    }).catch(() => {});
    fetch('/api/quiz/recent').then((r) => r.json()).then((d) => {
      if (d && Array.isArray(d.plays)) setRecent(d.plays);
      if (d && d.todayByQuiz) setDayPlays(d.todayByQuiz);
    }).catch(() => {});
    fetch('/api/quiz/stats').then((r) => r.json()).then((d) => {
      if (d && Array.isArray(d.quizzes)) setStatsById(Object.fromEntries(d.quizzes.map((q) => [q.quizId, q])));
    }).catch(() => {});
    if (DAILY_CHALLENGE_ON) fetch(`/api/quiz/challenge-leaderboard?id=${encodeURIComponent(dailyChallengeId())}`).then((r) => r.json()).then((d) => {
      if (d && Array.isArray(d.users)) setDailyLb(d.users);
    }).catch(() => {});
    fetch('/api/quiz/today').then((r) => r.json()).then((d) => {
      if (d) setTodayData({ byCorrect: Array.isArray(d.leaders) ? d.leaders : [], byQuizzes: Array.isArray(d.quizLeaders) ? d.quizLeaders : [] });
    }).catch(() => {});
    fetch('/api/duel/latest').then((r) => r.json()).then((d) => {
      if (d) setDuels(Array.isArray(d.duels) ? d.duels : (d.duel ? [d.duel] : []));
    }).catch(() => {});
  }, []);

  // Read today's daily-challenge run-state from localStorage (drives the box's
  // per-quiz completion ticks); refresh on focus so finishing a quiz updates it.
  useEffect(() => {
    if (!dailyId) return;
    const read = () => { try { setChRun(JSON.parse(localStorage.getItem(`sot_chrun_${dailyId}`) || 'null')); } catch { setChRun(null); } };
    read();
    const onVis = () => { if (!document.hidden) read(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', read);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', read); };
  }, [dailyId]);

  // Standardized-test practice completions (finished once, stored by
  // ExamQuizClient); refresh on focus so finishing a test updates the
  // Standardized Tests mastery bar.
  useEffect(() => {
    const read = () => { try { setExamsDone(JSON.parse(localStorage.getItem('sot_exam_done') || '{}') || {}); } catch { setExamsDone({}); } };
    read();
    const onVis = () => { if (!document.hidden) read(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', read);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', read); };
  }, []);

  // IQ Points leaderboard re-loads when the scope changes.
  useEffect(() => {
    // Pull the FULL ranking (not just top-12-by-IQ Points) so the cycling
    // leaderboard's non-IQ Points slides (Most Correct, etc.) surface the true
    // per-metric leaders, not just whoever is already top by IQ Points.
    const q = scope === 'all' ? '?full=1' : `?scope=${encodeURIComponent(scope)}&full=1`;
    let alive = true;
    fetch(`/api/quiz/xp${q}`).then((r) => r.json()).then((d) => {
      if (!alive) return;
      if (d && Array.isArray(d.players)) { setXpBoard(d.players); setXpScope(d.scope || scope); }
    }).catch(() => {});
    return () => { alive = false; };
  }, [scope]);

  // Per-category IQ Points boards (computed once) power the rotating
  // "<Category> IQ Leaders" leaderboard slides.
  useEffect(() => {
    fetch('/api/quiz/xp-categories').then((r) => r.json()).then((d) => {
      if (d && d.boards) setCatBoards(d.boards);
    }).catch(() => {});
  }, []);

  const [duelNotif, setDuelNotif] = useState({ challenges: [], results: [], yourTurn: [] });
  const [duelSeen, setDuelSeen] = useState({});
  const [duelLater, setDuelLater] = useState({});
  const [duelMuted, setDuelMuted] = useState({});
  const [duelMuteAll, setDuelMuteAll] = useState(false);
  function loadDuelNotif() {
    const anon = getAnonId();
    if (!anon) return;
    const em = getIdentity();
    const emq = em && em.email ? `&email=${encodeURIComponent(em.email)}` : '';
    fetch(`/api/duel/notifications?anonId=${encodeURIComponent(anon)}${emq}`).then((r) => r.json()).then((d) => { if (d) setDuelNotif({ challenges: d.challenges || [], results: d.results || [], yourTurn: d.yourTurn || [] }); }).catch(() => {});
  }
  useEffect(() => {
    try { setDuelSeen(JSON.parse(localStorage.getItem('sot_duel_seen') || '{}') || {}); } catch {}
    try { setDuelLater(JSON.parse(localStorage.getItem('sot_duel_later') || '{}') || {}); } catch {}
    try { setDuelMuted(JSON.parse(localStorage.getItem('sot_duel_muted') || '{}') || {}); } catch {}
    try { setDuelMuteAll(localStorage.getItem('sot_duel_mute_all') === '1'); } catch {}
    loadDuelNotif();
    // 45s -> 120s and skip hidden tabs (egress fix 2026-07-12); the
    // visibilitychange refresh catches up as soon as the tab returns.
    const _dnPoll = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') loadDuelNotif();
    }, 120000);
    const _dnVis = () => { if (document.visibilityState === 'visible') loadDuelNotif(); };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', _dnVis);
    return () => {
      clearInterval(_dnPoll);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', _dnVis);
    };
  }, []);
  async function duelDecline(token) { const idn = getIdentity(); const nm = (idn && idn.username) || 'Player'; try { await fetch('/api/duel/decline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, anonId: getAnonId(), name: nm, email: (idn && idn.email) || undefined }) }); } catch {} loadDuelNotif(); }
  function duelDismissServer(token, kind) { try { const anon = getAnonId(); if (!anon) return; const idn = getIdentity(); fetch('/api/duel/dismiss', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, kind, anonId: anon, email: (idn && idn.email) || undefined }) }).catch(() => {}); } catch {} }
  function duelSeenAdd(token) { duelDismissServer(token, 'seen'); setDuelSeen((s) => { const n = { ...s, [token]: 1 }; try { localStorage.setItem('sot_duel_seen', JSON.stringify(n)); } catch {} return n; }); }
  function duelLaterAdd(token) { duelDismissServer(token, 'later'); setDuelLater((s) => { const n = { ...s, [token]: 1 }; try { localStorage.setItem('sot_duel_later', JSON.stringify(n)); } catch {} return n; }); }
  function duelMuteAdd(anon, name, token) { if (!anon) { duelLaterAdd(token); return; } setDuelMuted((m) => { const n = { ...m, [anon]: name || 'Player' }; try { localStorage.setItem('sot_duel_muted', JSON.stringify(n)); } catch {} return n; }); duelLaterAdd(token); }

  // Current player's stats (overall — used for the player bar + pinned "You").
  useEffect(() => {
    const ident = getIdentity();
    const anonId = getAnonId();
    const email = ident && ident.email ? ident.email : '';
    if (!anonId && !email) { setMe(null); return; }
    const params = new URLSearchParams();
    if (anonId) params.set('anonId', anonId);
    if (email) params.set('email', email);
    // light=1: the player bar reads ranks / activity / byCategory only, never
    // `recent` or `trophies`, and skipping those turns this from a full-corpus
    // derivation into a shared memo lookup. It was the slowest call on the
    // homepage by a distance (1,645ms measured).
    params.set('light', '1');
    const key = params.toString();
    // The inline script in app/page.js started this request during HTML parse,
    // ~800ms before this effect could run. Adopt it when it asked the same
    // question; otherwise fetch normally (identity changed since parse, or the
    // script did not run).
    const pre = (typeof window !== 'undefined' && window.__sotMe && window.__sotMe.key === key)
      ? window.__sotMe.promise
      : null;
    (pre || fetch(`/api/quiz/me?${key}`).then((r) => r.json())).then((d) => {
      if (d) setMe(d);
    }).catch(() => {});
  }, []);

  function plays(id) { return totals.byQuiz[id] || 0; }
  function todayPlays(id) { return totals.todayByQuiz[id] || 0; }
  function leader(id) { return totals.leaders[id] || ''; }
  // Leader of the Quiz of the Day row (per-quiz leaders come with /api/quiz/totals).
  const qotdLeader = qotd ? leader(qotd.id) : '';
  function leaderKey(id) { return (totals.leaderKeys && totals.leaderKeys[id]) || ''; }

  // Player-bar stats: overall by default; for a selected category, the player's
  // figures + rank WITHIN that category (from me.byCategory[scope]). Falls back
  // to overall / '—' when the player has no matches in the chosen category.
  const playerStats = useMemo(() => {
    if (!me || !me.found) return null;
    if (scope === 'all') {
      const a = me.activity || {};
      return {
        rank: (me.ranks && me.ranks.xp) || me.rank || null,
        denom: me.totalPlayers || 0,
        correct: a.correct ?? null,
        played: a.played ?? null,
        completed: a.completed ?? null,
        accuracy: a.accuracy ?? null,
        playedRank: (me.ranks && me.ranks.played) || null,
        correctRank: (me.ranks && me.ranks.correct) || null,
        completedRank: (me.ranks && me.ranks.completed) || null,
        accuracyRank: (me.ranks && me.ranks.accuracy) || null,
      };
    }
    const c = me.byCategory ? me.byCategory[scope] : null;
    if (!c) return { rank: null, denom: 0, correct: null, played: null, completed: null, accuracy: null };
    return {
      rank: c.rank || null,
      denom: c.catTotal || 0,
      correct: c.correct ?? null,
      played: c.played ?? null,
      completed: c.completed ?? null,
      accuracy: c.accuracy ?? null,
      playedRank: c.playedRank || null,
      correctRank: c.correctRank || null,
      completedRank: c.completedRank || null,
      accuracyRank: c.accuracyRank || null,
    };
  }, [me, scope]);

  // ── leaderboard: re-ranks per slide AND per category ──
  // Each slide sorts the board by that slide's metric (desc; ties by IQ Points then
  // name), scoped to the selected category (the IQ Points API already returns the
  // per-category metric values). The Most IQ Points slide DOES show the IQ Points total.
  // Today's daily-challenge standings, ranked by total correct then least time.
  const dailyRows = useMemo(() => (dailyLb || []).slice()
    .sort((a, b) => (b.totalCorrect || 0) - (a.totalCorrect || 0) || (a.totalTime || 0) - (b.totalTime || 0) || (a.username || '').localeCompare(b.username || ''))
    .slice(0, (boardsExpanded || mobLbOpen) ? 10 : 5), [dailyLb, boardsExpanded, mobLbOpen]);
  const todayCorrectRows = useMemo(() => (todayData.byCorrect || []).slice(0, (boardsExpanded || mobLbOpen) ? 10 : 5), [todayData, boardsExpanded, mobLbOpen]);
  const todayQuizRows = useMemo(() => (todayData.byQuizzes || []).slice(0, (boardsExpanded || mobLbOpen) ? 10 : 5), [todayData, boardsExpanded, mobLbOpen]);
  const myCats = useMemo(() => {
    const bc = (me && me.byCategory) || {};
    return Object.keys(bc).map((k) => {
      const c = bc[k] || {};
      if (!(c.matches > 0)) return null;
      return {
        key: k,
        name: DEPT_LABEL[k] || k,
        rank: c.completedRank ?? c.rank ?? null,
        total: c.catTotal || 0,
        completed: c.completed || 0,
        matches: c.matches || 0,
      };
    }).filter(Boolean).sort((x, y) => (x.rank || 1e9) - (y.rank || 1e9));
  }, [me]);

  const bestCat = useMemo(() => {
    if (!me || !me.byCategory) return null;
    // Best category = where the player ranks highest on COMPLETED; ties break to
    // IQ Points rank in that category, then to played rank.
    let best = null;
    for (const k of Object.keys(me.byCategory)) {
      const c = me.byCategory[k];
      if (!c || !(c.matches > 0)) continue;
      const cand = { key: k, rank: c.completedRank ?? c.rank, catTotal: c.catTotal,
        cR: c.completedRank ?? Infinity, sR: c.rank ?? Infinity, pR: c.playedRank ?? Infinity };
      if (!best || cand.cR < best.cR
          || (cand.cR === best.cR && cand.sR < best.sR)
          || (cand.cR === best.cR && cand.sR === best.sR && cand.pR < best.pR)) best = cand;
    }
    return best;
  }, [me]);
  // The daily-challenge slide joins the rotation ONLY once >=2 registered
  // players have played today's challenge.
  const LB_METRICS = useMemo(() => {
    const base = [
      { key: 'xp', label: 'Most IQ Points', fmt: (v) => (v || 0).toLocaleString(), ms: 7000 },
      { key: 'correct', label: 'Most Correct Answers', fmt: (v) => (v || 0).toLocaleString(), ms: 5000 },
      { key: 'completed', label: 'Most Quizzes Aced (100%)', fmt: (v) => (v || 0).toLocaleString(), ms: 5000 },
      { key: 'daysPlayed', label: 'Most Days Played', fmt: (v) => (v || 0).toLocaleString(), ms: 5000 },
      { key: 'accuracy', label: 'Highest Accuracy', fmt: (v) => `${v || 0}%`, ms: 5000 },
    ];
    if (DAILY_CHALLENGE_ON && dailyRows.length >= 2) base.splice(1, 0, { key: 'dailyChallenge', special: true, label: `Today's Challenge${dailyCat ? ` · ${dailyCat}` : ''}`, fmt: (v) => (v || 0).toLocaleString(), ms: 6000 });
    const extra = [];
    if (todayCorrectRows.length >= 1) extra.push({ key: 'correctToday', special: true, label: 'Correct Today', fmt: (v) => (v || 0).toLocaleString(), ms: 5000 });
    if (todayQuizRows.length >= 1) extra.push({ key: 'quizzesToday', special: true, label: 'Quizzes Today', fmt: (v) => (v || 0).toLocaleString(), ms: 5000 });
    if (extra.length) base.splice((DAILY_CHALLENGE_ON && dailyRows.length >= 2) ? 2 : 1, 0, ...extra);
    // Per-category "Top Rated <Category>" slides join the rotation only on the
    // overall view (Category: All), in DEPT_NAV order, skipping empty boards.
    const catSlides = scope === 'all'
      ? DEPT_NAV
          .filter((d) => Array.isArray(catBoards[d.id]) && catBoards[d.id].length > 0)
          .map((d) => ({ key: 'catRating', catKey: d.id, special: true, label: `${DEPT_LABEL[d.id] || d.label} IQ Leaders`, fmt: (v) => (v || 0).toLocaleString(), ms: 5000 }))
      : [];
    return [...base, ...catSlides];
  }, [dailyRows.length, dailyCat, todayCorrectRows.length, todayQuizRows.length, scope, catBoards]);
  const lbMetric = LB_METRICS[Math.min(lbIdx, LB_METRICS.length - 1)];
  // Per-slide timeout: the IQ Points slide holds 7s, every other slide 5s.
  useEffect(() => {
    const id = setTimeout(() => setLbIdx((i) => (i + 1) % LB_METRICS.length), lbMetric.ms);
    return () => clearTimeout(id);
  }, [lbIdx, lbMetric.ms, LB_METRICS.length]);
  // Sort the displayed board by the active slide's metric, scoped to the current
  // category (xpBoard is already category-scoped via the /api/quiz/xp refetch).
  const leaderRows = useMemo(() => {
    const k = lbMetric.key;
    // Highest Accuracy needs a real sample: only players with >=10 unique
    // quizzes played qualify (a 100% from one quiz shouldn't top the board).
    const pool = k === 'accuracy' ? xpBoard.filter((p) => (p.played || 0) >= 10) : xpBoard;
    const sorted = pool.slice().sort((a, b) =>
      ((b[k] || 0) - (a[k] || 0))
      || ((b.xp || 0) - (a.xp || 0))
      || (a.name || '').localeCompare(b.name || '')
    );
    // Guests are included in the public board (owner rule 2026-06-30).
    const list = sorted;
    return list.slice(0, 20);
  }, [xpBoard, lbMetric.key, boardsExpanded, mobLbOpen]);

  // Compact top-3 for the active leaderboard slide, shown in the player stat
  // bar on the quiz hub (the leaderboard lives in the stat line here).
  const lbBar = useMemo(() => {
    const label = (lbMetric.special || scope === 'all' ? lbMetric.label : `${(byKey[scope] && byKey[scope].label) || ''} ${lbMetric.label}`.trim()) + ':';
    let rows = [];
    if (lbMetric.special) {
      if (lbMetric.key === 'catRating') {
        rows = (catBoards[lbMetric.catKey] || []).filter((r) => !r.isAnon).slice(0, 3).map((r) => ({ name: r.name || 'Player', value: lbMetric.fmt(r.xp) }));
      } else {
        const src = lbMetric.key === 'dailyChallenge' ? dailyRows : lbMetric.key === 'correctToday' ? todayCorrectRows : todayQuizRows;
        const valOf = lbMetric.key === 'dailyChallenge' ? ((r) => r.totalCorrect) : lbMetric.key === 'correctToday' ? ((r) => r.correct) : ((r) => r.quizzes);
        rows = src.filter((r) => !r.isAnon).slice(0, 3).map((r) => ({ name: r.username || 'Player', value: (valOf(r) || 0).toLocaleString() }));
      }
    } else {
      rows = leaderRows.filter((r) => !r.isAnon).slice(0, 3).map((r) => ({ name: r.name || 'Player', value: lbMetric.fmt(r[lbMetric.key]) }));
    }
    return { label, rows };
  }, [lbMetric, scope, byKey, catBoards, dailyRows, todayCorrectRows, todayQuizRows, leaderRows]);

  // ── live feed (scoped by quiz department) ──
  const liveRows = useMemo(() => {
    const rows = recent.filter((p) => p && p.quizId && resolveTitle(p.quizId)).map((p) => ({ ...p, dept: deptOf({ id: p.quizId }), title: resolveTitle(p.quizId), dayCount: dayPlays[p.quizId] || 0 }));
    const scoped = scope === 'all' ? rows : rows.filter((r) => r.dept === scope);
    return scoped.slice(0, boardsExpanded ? 10 : 4);
  }, [recent, scope, titleById, boardsExpanded, dayPlays]);

  const playsToday = totals.today || 0;

  // ── browse columns ──
  // Newest first (so the dedupe sets below can reference it), then Most Played
  // excluding anything already in Newest, then each category column excluding
  // everything shown in Newest + Most Played. No quiz appears twice on the page.
  const newest = useMemo(() => catalog.slice()
    .filter((q) => !bnHiddenFromNewest(q.id) && !isDailyGame(q.id))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0))
    .slice(0, 6), [catalog]);
  // ── header ticker: recent plays + today's leaders + duels + new quizzes ──
  // Round-robin interleaved so types alternate. Built from data the page
  // already loads; the only extra fetch is /api/duel/latest (last few duels).
  useEffect(() => {
    let alive = true;
    // Pass the viewer's identity so the payload's `me` block resolves and the
    // strip can show per-game ranks on finished cells (same params as
    // /api/quiz/daily-status; the API ignores them when absent).
    let dcQs = '';
    try {
      const a = localStorage.getItem('sot_quiz_anon');
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
      const p = new URLSearchParams();
      if (a) p.set('anonId', a);
      if (id && id.email) p.set('email', id.email);
      dcQs = p.toString();
    } catch (e) {}
    fetch('/api/quiz/daily-combined' + (dcQs ? `?${dcQs}` : ''))
      .then((r) => r.json())
      .then((d) => { if (!alive || !d || !Array.isArray(d.overall)) return; setDailyBoard(d); if (d.overall[0]) setDailyLead({ name: d.overall[0].username, total: d.overall[0].total, maxTotal: d.maxTotal }); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const tickerItems = useMemo(() => {
    const ago = (iso) => {
      if (!iso) return null;
      const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
      if (!(m >= 1)) return 'now';
      if (m < 60) return `${m}m`;
      const h = Math.round(m / 60);
      return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
    };
    const playRows = (recent || [])
      .filter((p) => p && p.quizId && resolveTitle(p.quizId) && !(p.total > 0 && p.score === p.total))
      .slice(0, 8)
      .map((p) => ({ type: 'play', href: playHref(p.quizId), segs: [
        { text: p.name || 'Player', strong: true },
        { text: ` ${p.score}/${p.total} on ` },
        { text: resolveTitle(p.quizId), strong: true },
        ...(ago(p.playedAt) ? [{ text: ` · ${ago(p.playedAt)}`, dim: true }] : []),
      ] }));
    const leads = (todayCorrectRows || []).filter((r) => !r.isAnon).slice(0, 3).map((r, i) => ({
      type: 'lead', href: '/quizzes/hub', segs: [
        { text: r.username || 'Player', strong: true },
        { text: i === 0 ? ' leads Correct Today' : ` is #${i + 1} for Correct Today` },
        { text: ` · ${(r.correct || 0).toLocaleString()}`, dim: true },
      ] }));
    if (dailyLead && dailyLead.name) {
      leads.unshift({ type: 'lead', href: '/quizzes/hub?tab=daily', segs: [
        { text: dailyLead.name, strong: true },
        { text: ' leads the Daily Board' },
        { text: ` · ${dailyLead.total}/${dailyLead.maxTotal}`, dim: true },
      ] });
    }
    if (DAILY_CHALLENGE_ON && dailyRows.length && dailyRows[0] && !dailyRows[0].isAnon) {
      leads.push({ type: 'lead', href: '/quizzes/hub', segs: [
        { text: dailyRows[0].username || 'Player', strong: true },
        { text: ` leads Today's Challenge${dailyCat ? ` (${dailyCat})` : ''}` },
      ] });
    }
    const duelRows = (duels || []).slice(0, 4).map((d) => {
      const tie = d.winner === 'tie';
      const chWon = d.winner === 'challenger';
      const w = (tie || chWon) ? d.challenger_name : d.opponent_name;
      const l = (tie || chWon) ? d.opponent_name : d.challenger_name;
      const ws = (tie || chWon) ? d.challenger_score : d.opponent_score;
      const ls = (tie || chWon) ? d.opponent_score : d.challenger_score;
      return { type: 'duel', href: '/quizzes/hub?tab=duels', segs: tie
        ? [{ text: w || 'Player', strong: true }, { text: ' and ' }, { text: l || 'Player', strong: true }, { text: ` tied a Duel ${ws} to ${ls}` }]
        : [{ text: w || 'Player', strong: true }, { text: ' beat ' }, { text: l || 'Player', strong: true }, { text: ` in a Duel ${ws} to ${ls}` }] };
    });
    const fresh = (newest || []).slice(0, 2).map((q) => ({ type: 'new', href: `/quiz/${q.id}`, segs: [
      { text: 'New quiz: ' }, { text: q.title, strong: true },
    ] }));
    const stat = playsToday > 0 ? [{ type: 'stat', href: '/quizzes/hub', segs: [
      { text: `${playsToday.toLocaleString()} plays today`, strong: true },
    ] }] : [];
    // Top community member: the #1 all-time IQ Points player.
    const topP = (xpBoard || []).find((p) => p && !p.isAnon);
    const top = topP ? [{ type: 'top', href: '/quizzes/hub', segs: [
      { text: topP.name || 'Player', strong: true },
      { text: ' tops the community' },
      { text: ` · Lvl ${topP.level} · ${(topP.xp || 0).toLocaleString()} IQ`, dim: true },
    ] }] : [];
    // Category wins: the #1 player in a spread of departments.
    const champCats = ['movies', 'music', 'sports', 'geography', 'history', 'science', 'gaming', 'food'];
    const champs = champCats.map((k) => {
      const b = catBoards[k];
      if (!b || !b.length) return null;
      const w = b.find((p) => p && !p.isAnon);
      if (!w) return null;
      return { type: 'champ', href: '/quizzes/hub', segs: [
        { text: w.name || 'Player', strong: true },
        { text: ` is #1 in ${DEPT_LABEL[k] || k}` },
        ...(w.level ? [{ text: ` · Lvl ${w.level}`, dim: true }] : []),
      ] };
    }).filter(Boolean).slice(0, 6);
    // Achievements: recent perfect scores (maxed the game).
    const achRows = (recent || [])
      .filter((p) => p && p.quizId && resolveTitle(p.quizId) && !p.isAnon && p.total > 0 && p.score === p.total)
      .slice(0, 4)
      .map((p) => ({ type: 'ach', href: playHref(p.quizId), segs: [
        { text: p.name || 'Player', strong: true },
        { text: ` aced ${resolveTitle(p.quizId)}` },
        { text: ` · perfect ${p.score}/${p.total}`, dim: true },
        ...(ago(p.playedAt) ? [{ text: ` · ${ago(p.playedAt)}`, dim: true }] : []),
      ] }));
    // Streaks: the most consistent players by distinct days played.
    const streakRows = (xpBoard || [])
      .filter((p) => p && !p.isAnon && (p.daysPlayed || 0) >= 5)
      .slice()
      .sort((a, b) => (b.daysPlayed || 0) - (a.daysPlayed || 0))
      .slice(0, 3)
      .map((p) => ({ type: 'streak', href: '/quizzes/hub', segs: [
        { text: p.name || 'Player', strong: true },
        { text: ` has played ${p.daysPlayed} days` },
        ...(p.accuracy != null ? [{ text: ` · ${p.accuracy}% accuracy`, dim: true }] : []),
      ] }));
    const pools = [playRows, [...top, ...champs], duelRows, achRows, [...leads, ...stat], streakRows, fresh];
    const out = [];
    for (let i = 0; out.length < 28; i += 1) {
      const before = out.length;
      for (const pool of pools) { if (pool[i]) out.push(pool[i]); }
      if (out.length === before) break;
    }
    return out;
  }, [recent, titleById, todayCorrectRows, dailyRows, dailyCat, duels, newest, playsToday, dailyLead, xpBoard, catBoards]);
  // Business News hub quizzes (market-moving recaps, earnings, sector updates),
  // newest first — shown inside the Business News promo tile.
  const businessNewsRows = useMemo(() => catalog.slice()
    .filter((q) => isBusinessNewsHubQuiz(q.id))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0))
    .slice(0, 6), [catalog]);
  const newestIds = useMemo(() => new Set(newest.map((q) => q.id)), [newest]);
  const mostPlayed = useMemo(() => {
    let pool;
    if (scope === 'all') pool = catalog;
    else pool = byKey[scope] ? byKey[scope].quizzes : [];
    const exclude = scope === 'all' ? newestIds : new Set();
    return pool.map((q) => ({ ...q, p: plays(q.id) }))
      .filter((q) => q.p > 0 && !exclude.has(q.id))
      .sort((a, b) => b.p - a.p || a.title.localeCompare(b.title))
      .slice(0, 15);
  }, [catalog, byKey, scope, totals, newestIds]);

  // Trending = highest-plays quiz that is NOT in the top-3 most played, NOT the
  // newest, and NOT the quiz of the day. Drives the second hero tile.
  const trending = useMemo(() => {
    const week = (id) => (totals.recent7 && totals.recent7[id]) || 0;
    // Exclusions stay the same: the top-3 most-played (ALL-TIME, since those are
    // the tiles shown in the Most Played board), the newest quiz, and the quiz of
    // the day, so the tile never repeats what is already featured elsewhere.
    const rankedAll = catalog.map((q) => ({ ...q, p: plays(q.id) })).filter((q) => q.p > 0)
      .sort((a, b) => b.p - a.p || (a.title || '').localeCompare(b.title || ''));
    const excl = new Set(rankedAll.slice(0, 3).map((q) => q.id));
    if (newest[0]) excl.add(newest[0].id);
    if (qotd) excl.add(qotd.id);
    // Newest and Trending must never be the same daily-game family (they'd share
    // one hero image), so also block whatever family the Newest / QOTD tiles use.
    const blockedFams = new Set([newest[0] && gameFamily(newest[0].id), qotd && gameFamily(qotd.id)].filter(Boolean));
    const blocked = (cand) => excl.has(cand.id) || blockedFams.has(gameFamily(cand.id));
    // Pick the single most-played quiz OVER THE LAST 7 DAYS among the rest. Fall
    // back to the all-time pick only if nothing was played this week (edge case),
    // so the tile never goes empty.
    const rankedWeek = catalog.map((q) => ({ ...q, p: week(q.id) })).filter((q) => q.p > 0)
      .sort((a, b) => b.p - a.p || (a.title || '').localeCompare(b.title || ''));
    return rankedWeek.find((cand) => !blocked(cand)) || rankedAll.find((cand) => !blocked(cand)) || null;
  }, [catalog, newest, qotd, totals]);
  // Ids already surfaced in the Newest + Most Played columns (all-scope only).
  const shownIds = useMemo(() => {
    if (scope !== 'all') return new Set();
    const set = new Set(newestIds);
    mostPlayed.slice(0, 6).forEach((q) => set.add(q.id));
    return set;
  }, [scope, newestIds, mostPlayed]);
  // Full "View all" lists (every quiz, not the 6-row column preview).
  // Conditional navy backdrops for the hero-tile leader chips: probe the photo
  // behind each footer overlay (scrim folded in) and pill only when too light.
  const nQH = newest[0] ? QUIZ_HEROES[newest[0].id] : null;
  const nHero = newest[0] ? ((nQH && nQH.src) || (newest[0].dept === 'sports' ? sportHeroFor(newest[0]) : null) || DEPT_HERO[newest[0].dept] || null) : null;
  // Rule: the Trending tile may never repeat the Newest tile's hero image.
  // When both resolve to the same src, Trending swaps to the department's
  // alternate hero (DEPT_HERO_ALT), or to its category-color block if the
  // department has no alternate. Computed BEFORE the pill probe so the probe
  // samples the image actually rendered.
  const tQH = trending ? QUIZ_HEROES[trending.id] : null;
  let tHero = trending ? ((tQH && tQH.src) || (trending.dept === 'sports' ? sportHeroFor(trending) : null) || DEPT_HERO[trending.dept] || null) : null;
  let tHeroPos = tQH ? tQH.pos : undefined;
  if (tHero && tHero === nHero) { tHero = DEPT_HERO_ALT[trending.dept] || FALLBACK_HERO; tHeroPos = undefined; }
  const [ttileProbeRef, ttilePill] = usePillProbe(tHero, PILL_REGION_FOOTER, 0.72, true);

  // ── Featured flip tiles: rotation day ─────────────────────────────────────
  // The two featured tiles used to show ONE pick per Eastern day. They now flip
  // through a POOL of picks (see geoFaces / featFaces below, built after the
  // browse-column heroes so they can exclude them); rotDay only decides where in
  // each pool the rotation STARTS, so the opening face still changes daily.
  // [[timezone: rotations key off easternYmd, never the sandbox UTC clock]]
  const rotDay = useMemo(() => {
    try { return Math.round((Date.parse(easternYmd() + 'T00:00:00.000Z') - Date.parse('2026-07-01T00:00:00.000Z')) / 86400000); }
    catch { return 0; }
  }, []);
  const wkPlays = (id) => (totals.recent7 && totals.recent7[id]) || 0;
  const rotateFrom = (arr, k) => (arr.length ? arr.slice(((k % arr.length) + arr.length) % arr.length).concat(arr.slice(0, ((k % arr.length) + arr.length) % arr.length)) : arr);

  const newestAll = useMemo(() => catalog.slice()
    .filter((q) => !bnHiddenFromNewest(q.id) && !isDailyGame(q.id))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0)), [catalog]);
  const mostPlayedAll = useMemo(() => catalog.slice()
    .sort((a, b) => plays(b.id) - plays(a.id) || a.title.localeCompare(b.title)), [catalog, totals]);
  // dayIndex is this ROW's own play number for the day, dayCount the day's
  // total for that quiz (owner, 2026-08-25: the face counts up, the tooltip
  // carries the total, so ten rows of one game no longer read identically).
  const liveAll = useMemo(() => recent.filter((p) => p && p.quizId && resolveTitle(p.quizId)).map((p) => ({ ...p, title: resolveTitle(p.quizId), dayCount: dayPlays[p.quizId] || 0, dayIndex: Number(p.dayIndex) || 0 })), [recent, titleById, dayPlays]);
  // "Last Played" browse column: most recent plays, deduped to distinct quizzes
  // (the live feed relocated into the browse grid as the first column).
  const lastPlayed = useMemo(() => {
    // Multiplier: how many of the recent raw plays (across the whole fetched
    // feed, which now reaches back ~1000 games) were this quiz, so repeat plays
    // hidden by the distinct-quiz dedupe still surface as "xN". Capped x99.9k
    // (rendered as e.g. x1.2k / x99.9k by fmtMult in the badge below). The
    // deep window lets the distinct-quiz list fill its 5 rows even when the
    // newest plays are dominated by a single quiz.
    const windowCounts = {};
    for (const f of liveAll) { if (f && f.quizId) windowCounts[f.quizId] = (windowCounts[f.quizId] || 0) + 1; }
    const seen = new Set(); const out = [];
    for (const f of liveAll) { if (!f || !f.quizId || seen.has(f.quizId)) continue; seen.add(f.quizId); out.push({ ...f, mult: Math.min(99900, windowCounts[f.quizId] || 1) }); if (out.length >= 15) break; }
    return out;
  }, [liveAll]);
  // The three activity columns (Last Played / Most Played / Newest) each hero
  // their own #1 row. Hoisted here rather than derived inline in the JSX so the
  // category columns below can see which images are already spoken for: without
  // this, Most Played and Geography both landed on the same Europe satellite
  // photo, since the most-played quiz IS the top geography quiz.
  const lpTop = lastPlayed[0] || null;
  const mpTop = mostPlayed[0] || null;
  const nwTop = newestAll[0] || null;
  const activityHeroIds = useMemo(
    () => new Set([lpTop && lpTop.quizId, mpTop && mpTop.id, nwTop && nwTop.id].filter(Boolean)),
    [lpTop, mpTop, nwTop],
  );
  // Hero quiz for each browse CATEGORY column below, hoisted out of the JSX
  // (it used to be computed inline where the columns render). Two reasons: the
  // featured flip tiles above must be able to exclude anything already heroed
  // below (owner rule 2026-07-21, no photo/quiz shown twice on the page), and
  // the logic now has exactly one home. Mirrors what the column render did:
  // prefer the most-played quiz that owns a real photo and is not already an
  // activity-column hero, else the most-played survivor, else the top quiz.
  const catHeroQ = useMemo(() => {
    const out = {};
    for (const c of cats) {
      if (c.key === 'school') continue;
      const tilePool = c.key === 'word' ? c.quizzes : c.quizzes.filter((q) => !isDailyGame(q.id));
      const ranked = tilePool.slice().sort((a, b) => plays(b.id) - plays(a.id) || a.title.localeCompare(b.title));
      const heroPool = ranked.filter((q) => !activityHeroIds.has(q.id));
      out[c.key] = heroPool.find((q) => QUIZ_HEROES[q.id] || DG_HERO_FAMS.has(gameFamily(q.id))) || heroPool[0] || ranked[0] || null;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats, activityHeroIds, totals]);
  // Every quiz that already carries a hero photo somewhere in the list section
  // below (the three activity columns + every category column).
  const columnHeroIds = useMemo(() => {
    const set = new Set(activityHeroIds);
    for (const q of Object.values(catHeroQ)) if (q) set.add(q.id);
    return set;
  }, [activityHeroIds, catHeroQ]);

  // ── Featured flip tile pools ──────────────────────────────────────────────
  // Shared exclusions: whatever the other header tiles already show, plus every
  // hero in the list section below.
  const featExcl = useMemo(() => {
    const set = new Set(columnHeroIds);
    for (const id of [qotd && qotd.id, newest[0] && newest[0].id, trending && trending.id]) if (id) set.add(id);
    return set;
  }, [columnHeroIds, qotd, newest, trending]);
  const byWeek = (a, b) => wkPlays(b.id) - wkPlays(a.id) || plays(b.id) - plays(a.id) || (a.title || '').localeCompare(b.title || '');

  // Tile 1: Geo Guesser is its OWN subset, so this tile only ever flips between
  // Geo Guesser games (never a general geography quiz).
  const geoFaces = useMemo(() => {
    const pool = catalog.filter((q) => /geo-guesser/.test(q.id) && !featExcl.has(q.id)).sort(byWeek);
    const seen = new Set();
    const out = [];
    for (const q of rotateFrom(pool, rotDay)) {
      const h = heroFor(q.id, q.dept);
      const src = h.src || DEPT_HERO.geography || FALLBACK_HERO;
      if (seen.has(src)) continue; // two faces on the same photo would look frozen
      seen.add(src);
      out.push({ id: q.id, href: `/quiz/${q.id}`, hero: src, pos: h.pos, tag: 'FEATURED GEO GUESSER', tagColor: '#0f766e', Icon: Globe, title: stripVerb(q.title), leader: leader(q.id), accent: C.accent });
      if (out.length >= 6) break;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, featExcl, totals, rotDay]);

  // Tile 2: the general Featured tile. One pick per CATEGORY, so the tile works
  // through the departments as it flips, relabelling itself each turn (FEATURED
  // SPORTS -> FEATURED MOVIES -> ...). Geo Guesser ids are excluded: they belong
  // to tile 1's subset. Ordered by 7-day plays so the liveliest category leads,
  // then rotated by the day so every visit does not open on the same one.
  const featFaces = useMemo(() => {
    const geoIds = new Set(geoFaces.map((f) => f.id));
    const picks = [];
    for (const c of cats) {
      if (c.key === 'school') continue;
      const pick = c.quizzes
        .filter((q) => !featExcl.has(q.id) && !geoIds.has(q.id) && !/geo-guesser/.test(q.id) && !isDailyGame(q.id))
        .sort(byWeek)[0];
      if (pick) picks.push(pick);
    }
    picks.sort(byWeek);
    const seen = new Set();
    const out = [];
    for (const q of rotateFrom(picks, rotDay)) {
      const qh = QUIZ_HEROES[q.id];
      // Sports keeps its per-sport photo resolver; every other dept uses the
      // shared heroFor (daily-game banner -> quiz photo -> dept photo).
      const h = q.dept === 'sports'
        ? { src: (qh && qh.src) || sportHeroFor(q) || DEPT_HERO.sports || FALLBACK_HERO, pos: qh ? qh.pos : undefined }
        : heroFor(q.id, q.dept);
      const src = h.src || FALLBACK_HERO;
      if (seen.has(src)) continue;
      seen.add(src);
      const col = DEPT_COLOR[q.dept] || DEPT_COLOR.misc;
      out.push({ id: q.id, href: `/quiz/${q.id}`, hero: src, pos: h.pos, tag: `FEATURED ${(DEPT_LABEL[q.dept] || 'Quiz').toUpperCase()}`, tagColor: col.c, Icon: DEPT_ICON[q.dept] || Sparkles, title: stripVerb(q.title), leader: leader(q.id), accent: C.accent });
      if (out.length >= 8) break;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats, featExcl, geoFaces, totals, rotDay]);

  const [chCopied, setChCopied] = useState(false);
  const [mDaily, setMDaily] = useState(false);
  const [mLb, setMLb] = useState(false);
  function shareChallenge() {
    const url = withRef((typeof window !== 'undefined' ? window.location.origin : '') + `/quiz/${qotd ? qotd.id : ''}`);
    const data = { title: 'Mind Loft', text: 'Can you beat me on today’s quiz?', url };
    if (typeof navigator !== 'undefined' && navigator.share) { navigator.share(data).catch(() => {}); }
    else if (typeof navigator !== 'undefined' && navigator.clipboard) { navigator.clipboard.writeText(url).then(() => { setChCopied(true); setTimeout(() => setChCopied(false), 2000); }).catch(() => {}); }
  }
  function goCat(key) { setScope(key); setDoneFilter('all'); setListMode(null); setSearch(''); try { if (quizzesRef.current) quizzesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {} }
  const [dayArchive, setDayArchive] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchDayStatus().then((d) => { if (alive) setDayArchive(d || {}); });
    return () => { alive = false; };
  }, []);
  const catMastery = useMemo(() => {
    if (!cats || !cats.length) return [];
    const bc = (me && me.byCategory) || {};
    // Standardized Tests (dept 'school') completion blends the LSAT logic-game
    // quizzes with the six practice tests: denominator = logic games + 6 tests,
    // numerator = distinct logic games played + distinct tests finished once.
    const examsDoneCount = EXAM_SLUGS.filter((s) => examsDone && examsDone[s]).length;
    const rows = cats.map((c) => {
      const cc = bc[c.key] || {};
      let played = cc.played || 0;
      let total = c.count || 0;
      if (c.key === 'school') { played += examsDoneCount; total += EXAM_SLUGS.length; }
      const pct = total > 0 ? Math.round((played / total) * 100) : 0;
      return { key: c.key, label: c.label, pct };
    }).sort((a, b) => b.pct - a.pct || a.label.localeCompare(b.label));
    if (!rows.length || rows[0].pct === 0) return [];
    return rows.map((r) => ({ key: r.key, label: r.label, acc: r.pct }));
  }, [me, cats, examsDone]);

  // DAILY MASTERY (owner, 2026-08-12): one row per LIVE daily game, showing how
  // much of that game's archive this player has played. `archive` comes straight
  // off /api/quiz/daily-status as { <gameKey>: { total, played } }, where `total`
  // is every day the game has ever run and `played` is the days THIS player
  // finished, so the percentage answers "how much of this game have I done" the
  // way Quiz Mastery answers it for a category. Retired games are excluded
  // (liveDailyKeys): their archive is closed, so a bar for one can never move.
  //
  // ORDER IS UNDER WAY, THEN DONE, THEN UNTOUCHED, which is the same rule the
  // Loft's banded version followed and it matters more here, because the tile
  // shows eight rows out of fifty-odd. Sorted purely by percentage it would open
  // on the games already finished, the least actionable rows it could pick.
  const dailyMastery = useMemo(() => {
    const arch = (dayArchive && dayArchive.archive) || null;
    if (!arch) return [];
    const rows = liveDailyKeys().map((k) => {
      const g = DAILY_GAME_MAP[k] || { name: k, cat: '' };
      const a = arch[k] || {};
      const total = Number(a.total) || 0;
      const played = Math.min(Number(a.played) || 0, total || Number(a.played) || 0);
      return { key: k, label: g.name, cat: g.cat, played, acc: total > 0 ? Math.round((played / total) * 100) : 0 };
    });
    if (!rows.some((r) => r.played > 0)) return [];
    const rank = (r) => (r.played <= 0 ? 2 : (r.acc >= 100 ? 1 : 0));
    return rows
      .sort((a, b) => rank(a) - rank(b) || b.acc - a.acc || b.played - a.played || a.label.localeCompare(b.label))
      .map((r) => ({ key: r.key, label: r.label, acc: r.acc, href: `/${r.key}`, cat: r.cat }));
  }, [dayArchive]);

  function colRows(cat, lim, exclude) {
    // Business tile preview hides the whole Business News quiz hub (daily/weekly
    // recaps, company earnings, sector updates); they still show under View all.
    // Daily puzzles are hidden from tile previews for all categories EXCEPT Word
    // Games; they still appear in the expanded CategoryFull (View All) view.
    const hideDG = cat.key !== 'word';
    let base = cat.key === 'business' ? cat.quizzes.filter((q) => !isBusinessNewsHubQuiz(q.id)) : cat.quizzes;
    if (hideDG) base = base.filter((q) => !isDailyGame(q.id));
    const sorted = base.slice()
      .sort((a, b) => plays(b.id) - plays(a.id) || a.title.localeCompare(b.title));
    if (!exclude) return sorted.slice(0, lim);
    const primary = sorted.filter((q) => !exclude.has(q.id));
    // Backfill short department columns (e.g. a small/new-heavy dept whose newest
    // quizzes are surfaced in the Newest column and thus excluded) so the card is
    // never left near-empty; big columns never run short and keep full de-dup.
    if (primary.length >= lim) return primary.slice(0, lim);
    const backfill = sorted.filter((q) => exclude.has(q.id));
    return primary.concat(backfill).slice(0, lim);
  }

  // Search across the whole catalog.
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const terms = q.split(/\s+/).filter(Boolean);
    return catalog.filter((c) => {
      const hay = (c.rawTitle + ' ' + c.title + ' ' + c.category + ' ' + c.blurb).toLowerCase();
      return terms.every((t) => hay.includes(t));
    }).slice(0, 80);
  }, [search, catalog]);

  // Hide "Best category" only when the player bar is forced to wrap to a new
  // row. Gated on width change so toggling the element (a height-only change)
  // can't cause a feedback loop. Below the mobile breakpoint CSS owns layout.
  useEffect(() => {
    const bar = playerBarRef.current;
    if (!bar) return;
    let lastW = -1;
    const evaluate = () => {
      const w = bar.clientWidth;
      if (w === lastW) return;
      lastW = w;
      const el = bestCatRef.current;
      if (el) el.style.display = '';
      const maxRows = w <= 560 ? 2 : 1;
      // Count visual rows by each child's vertical CENTER: with align-items:center
      // all items on one flex line share a center, so this is robust to the
      // differing item heights that make raw offsetTop read as multiple rows.
      const rows = [];
      for (const child of bar.children) {
        if (child.offsetWidth === 0 && child.offsetHeight === 0) continue;
        const cen = child.offsetTop + child.offsetHeight / 2;
        if (!rows.some((x) => Math.abs(x - cen) <= 6)) rows.push(cen);
      }
      if (el) el.style.display = rows.length > maxRows ? 'none' : '';
      bar.classList.toggle('hub-bleed', rows.length === 1 && w > 560);
    };
    const ro = new ResizeObserver(evaluate);
    ro.observe(bar);
    evaluate();
    return () => ro.disconnect();
  }, [bestCat, playerStats, scope]);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
    .qzh{font-family:${FONT};color:${C.ink};}
    .qzh .lbl{font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};}
    .qzh .card{background:${C.surface};border:1px solid ${C.line};border-radius:12px;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
    .qzh .boards .card{background:${C.surface};border-color:${C.line};}
    .qzh .head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 13px 9px;background:#f1f3f6;border-bottom:1px solid ${C.line};min-height:42px;cursor:pointer;}
    .qzh .head .lbl{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;}
    .qzh .head .qlink{flex:none;white-space:nowrap;}
    .qzh .lrow{display:flex;align-items:center;gap:9px;padding:5.5px 13px;font-size:12.5px;}
    /* "(x25)": that game's play count since Eastern midnight, beside the title. */
    .qzh .lf-day{flex:none;font-size:10.5px;font-weight:700;color:var(--muted);font-variant-numeric:tabular-nums;}
    .qzh .qtitle{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .qzh .att{font-size:9.5px;font-weight:700;color:${C.soft};}
    .qzh .score{flex:none;font-weight:700;color:${C.accent};font-variant-numeric:tabular-nums;}
    @media(max-width:680px){.qzh .lf-extra{display:none;}}
    @keyframes qzp{0%{opacity:1}50%{opacity:.35}100%{opacity:1}}
    .qzh .dd{position:relative;}
    .qzh .ddbtn{display:flex;align-items:center;gap:8px;background:var(--white);border:1.5px solid #b8c0cc;border-radius:10px;padding:9px 12px;cursor:pointer;font:inherit;}
    .qzh .qz-searchwrap input::placeholder{color:#5b6472;opacity:1;}
    .qzh .ddmenu{position:absolute;top:calc(100% + 6px);right:0;z-index:30;background:var(--white);border:1px solid ${C.line};border-radius:10px;box-shadow:0 8px 24px rgba(20,22,28,0.12);padding:6px;min-width:430px;display:grid;grid-template-columns:1fr 1fr;gap:1px 4px;}
    .qzh .ddmenu .ddall{grid-column:1 / -1;}
    @media(max-width:560px){.qzh .ddmenu{left:0;right:auto;width:88vw;min-width:0;max-width:88vw;grid-template-columns:1fr 1fr;max-height:60vh;overflow-y:auto;}}
    .qzh .dditem{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:7px;cursor:pointer;font-size:13px;}
    .qzh .ddhead{display:none;}
    @media(max-width:560px){.qzh .ddhead{display:flex !important;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--white);margin:-6px -6px 5px;padding:10px 12px;border-bottom:1px solid ${C.line};z-index:3;font-weight:700;font-size:13px;color:${C.ink};}.qzh .ddhead .ddclose{background:#eef1f6;border:none;border-radius:8px;width:34px;height:34px;font-size:17px;line-height:1;cursor:pointer;color:${C.ink};display:flex;align-items:center;justify-content:center;flex:none;}}
    .qzh .dditem:hover{background:${C.bg};}
    .qzh .dot{width:9px;height:9px;border-radius:3px;flex:none;}
    /* Daily puzzles row: four half-height buttons above the hero tiles */
    .qzh .th-games{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:14px;}
    @media(min-width:761px){.qzh .th-g-crux{order:1;}.qzh .th-g-garble{order:2;}.qzh .th-g-links{order:3;}.qzh .th-g-span{order:4;}.qzh .th-g-dating{order:5;}.qzh .th-g-tally{order:6;}}
    .qzh .th-game{position:relative;display:flex;flex-direction:row;align-items:center;gap:10px;min-height:86px;border:1px solid ${C.line};border-radius:14px;background:var(--white);padding:11px 15px;text-decoration:none;overflow:hidden;}
    .qzh .th-game:hover{border-color:var(--blue);}
    .qzh .th-game-txt{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1 1 auto;overflow:hidden;}
    .qzh .th-game-art{flex:0 0 auto;height:52px;width:auto;max-width:56px;object-fit:contain;}
    .qzh .th-game-tag{font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#8a5300;margin-bottom:3px;}
    .qzh .th-game-t{font-size:17px;font-weight:800;letter-spacing:-.3px;color:var(--ink);line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .qzh .th-game-p{font-size:11.5px;font-weight:700;color:var(--muted);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    @media(max-width:1180px){.qzh .th-game-art{height:44px;max-width:48px;}.qzh .th-game-p{display:none;}}
    @media(max-width:1080px){.qzh .th-game-art{height:40px;}.qzh .th-game{padding:11px 12px;gap:8px;}}
    @media(max-width:980px){.qzh .th-game-art{height:34px;max-width:36px;}.qzh .th-game{padding:10px 10px;gap:7px;}.qzh .th-game-t{font-size:15.5px;}}
    @media(max-width:900px){.qzh .th-game{min-height:64px;}}
    @media(max-width:760px){
      .qzh .th-games{grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;}
      .qzh .th-game{min-height:58px;background-position:right center;}
      .qzh .th-game:nth-child(-n+2){grid-column:span 3;}
      .qzh .th-game:nth-child(n+3){grid-column:span 3;min-height:44px;padding:8px 9px;gap:6px;}
      .qzh .th-game:nth-child(n+3) .th-game-tag{display:none;}
      .qzh .th-game:nth-child(n+3) .th-game-t{font-size:13.5px;}
      .qzh .th-game:nth-child(n+3) .th-game-art{height:24px;}
    }
    .qzh .qotd{display:flex;align-items:stretch;gap:0;background:var(--white);border:1px solid ${C.line};border-radius:14px;overflow:hidden;min-height:215px;text-decoration:none;color:var(--ink);}
    .qzh .qotd-photo{flex:0 0 48%;background-size:cover;background-position:center;min-height:180px;}
    .qzh .qotd-body{flex:1 1 auto;min-width:0;padding:18px 22px;display:flex;flex-direction:column;justify-content:center;}
    .qzh .qotd-eyebrow{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#8a5300;margin-bottom:7px;}
    .qzh .qotd-title{font-size:28px;font-weight:800;letter-spacing:-.02em;line-height:1.04;color:var(--ink);}
    .qzh .qotd-meta{font-size:13px;color:var(--muted);margin-top:7px;max-width:560px;line-height:1.45;}
    .qzh .qotd-foot{display:flex;align-items:center;gap:14px;margin-top:15px;flex-wrap:wrap;}
    .qzh .qotd-play{display:inline-flex;align-items:center;gap:7px;background:${C.cta};color:${C.ctaInk};border-radius:9px;padding:10px 20px;font-weight:800;font-size:14px;}
    .qzh .qotd:hover .qotd-play{background:${C.ctaHover};}
    .qzh .th-heroes{display:grid;grid-template-columns:minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,1fr) minmax(0,1fr);gap:12px;}
    /* Desktop: top row shares the second row's 4-col template so QOTD lines up exactly over Geo+Sports, Newest over Trending, Daily Challenge over Duel. */
    @media(min-width:1025px){.qzh .th-heroes .th-qotd{grid-column:1 / 3;}}
    @media(max-width:760px){.qzh .th-heroes{grid-template-columns:minmax(0,1fr);}}
    .qzh .ttile{position:relative;border:1px solid ${C.line};border-radius:14px;overflow:hidden;text-decoration:none;display:flex;flex-direction:column;justify-content:flex-end;min-height:215px;background-size:cover;background-position:center;background-color:var(--accent);}
    .qzh .ttile-tag{position:absolute;top:12px;left:12px;font-size:10px;font-weight:800;letter-spacing:.08em;background:var(--white);border-radius:10px;padding:4px 10px;z-index:2;color:#c2410c;display:inline-flex;align-items:center;gap:4px;}
    .qzh .ttile-ov{position:relative;z-index:1;padding:18px 16px 15px;background:linear-gradient(to top, rgba(8,15,35,0.9), rgba(8,15,35,0.45) 55%, rgba(8,15,35,0));}
    .qzh .ttile-t{font-size:20px;font-weight:800;letter-spacing:-.3px;line-height:1.1;color:var(--white);}
    .qzh .ttile-foot{display:flex;align-items:center;gap:12px;margin-top:9px;}
    .qzh .ttile-p{font-size:13px;font-weight:800;color:var(--white);}
    .qzh .ttile-plays{font-size:12px;font-weight:800;color:var(--white);}
    /* Daily-rotating category hero tiles (Top Geo Guesser / Top Sports): same look as .ttile, own class so th-r2 order rules do not collide. */
    .qzh .hstile{position:relative;border:1px solid ${C.line};border-radius:14px;overflow:hidden;text-decoration:none;display:flex;flex-direction:column;justify-content:flex-end;min-height:215px;background-size:cover;background-position:center;background-color:var(--accent);}
    /* Flip variant of .hstile (Featured Geo Guesser / Featured <category>): the
       tile itself becomes a transparent 3D stage and the two faces carry the look.
       Rotation/duration/easing match DuelTile so the header reads as one system. */
    .qzh .hsflip-wrap{background:transparent !important;background-color:transparent !important;border:0 !important;overflow:visible;perspective:1100px;}
    .qzh .hsflip{position:relative;flex:1;width:100%;transform-style:preserve-3d;transition:transform .65s cubic-bezier(.3,.7,.25,1);}
    .qzh .hsface{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border:0;border-radius:14px;overflow:hidden;text-decoration:none;display:flex;flex-direction:column;justify-content:flex-end;background-color:var(--accent);box-shadow:inset 0 0 0 1px ${C.line};}
    /* The photo sits on its own layer, 2px PROUD of the face on every side, and
       the face clips it. So the visible top edge is always interior image, never
       the image's own first row, the border seam, or the composited layer's
       antialiased boundary -- that combination was rendering as a discoloured
       strip across the top of every tile. Costs a ~2% centre crop, invisible. */
    .qzh .hsface-ph{position:absolute;inset:-2px;z-index:0;background-size:cover;background-position:center;background-repeat:no-repeat;}
    .qzh .hsflip-dots{position:absolute;right:11px;bottom:9px;z-index:3;display:flex;gap:4px;pointer-events:none;}
    .qzh .hsflip-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.4);transition:background .3s;}
    .qzh .hsflip-dot.on{background:var(--white);}
    @media(max-width:560px){.qzh .hsflip-dots{display:none;}}
    .qzh .qotd-stats{font-size:12px;color:var(--ink);font-weight:800;display:inline-flex;align-items:center;gap:6px;min-width:0;}
    @media(max-width:760px){.qzh .qotd{flex-direction:column;min-height:0;}.qzh .qotd-photo{flex:none;height:128px;}.qzh .qotd-title{font-size:21px;}}
    .qzh .thub{display:flex;gap:12px;margin-bottom:14px;align-items:stretch;}
    .qzh .thub-left{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:12px;}
    .qzh .th-rail{flex:0 0 188px;}
    .qzh .th-r2{display:grid;grid-template-columns:minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:stretch;}
    .qzh .th-r2 .th-slot-hold{min-height:215px;}
    @media(max-width:820px){.qzh .thub{flex-direction:column;}.qzh .th-rail{align-self:stretch;}.qzh .th-r2{grid-template-columns:1fr 1fr;}.qzh .th-r2 .dtile{grid-column:1 / -1;}.qzh .th-r2 .dueltile{grid-column:1 / -1;}}
    @media(max-width:560px){.qzh .th-r2{grid-template-columns:minmax(0,1fr);}.qzh .th-rail{display:none !important;}.qzh .th-heroes .ttile{min-height:220px;}.qzh .th-r2 .stile{order:1;min-height:220px;}.qzh .th-r2 .xptile{order:2;min-height:220px;}.qzh .th-r2 .dtile{order:3;}.qzh .th-r2 .dueltile{order:4;}.qzh .th-r2 .th-slot-hold{display:none;}.qzh .duelbtn{display:none !important;}}
    /* Narrow desktop / tablet (561-1024px): mirror the mobile combine - pair the promo tiles two-up (QOTD full row, Newest+Geo, Daily+Trending, Sports+Duel) and drop the Category Mastery rail. minmax(0,1fr) keeps the Newest/Geo hero images clipped inside their tiles (bare 1fr let them bleed). Added 2026-07-15 per Marshall. */
    @media (min-width:561px) and (max-width:1024px){.qzh .thub{flex-direction:column;}.qzh .th-rail{display:none !important;}.qzh .th-heroes{grid-template-columns:minmax(0,1fr) minmax(0,1fr);}.qzh .th-heroes .th-qotd{grid-column:1 / -1;}.qzh .th-r2{grid-template-columns:minmax(0,1fr) minmax(0,1fr);}.qzh .th-r2 .dtile{grid-column:auto;}.qzh .th-r2 .dueltile{grid-column:auto;}}
    /* Short landscape phones (<=480px tall): compact TWO-ROW header. Reworked 2026-07-17 per Marshall - QOTD no longer takes a full row (it shares row 1 with Newest + Geo), and Featured Geo + Featured Sports are shown here (they stay hidden only on the rare <561px landscape). Row 2 = Daily + Sports + Trending + Duel. The base rule below still hides gtile/stile; the min-width:561 block re-shows them. Portrait phones (<=560px) keep the stacked full-width layout. */
    @media (max-height:480px){.qzh .gtile{display:none !important;}.qzh .stile{display:none !important;}}
    @media (max-height:480px) and (min-width:561px){
      .qzh .th-heroes{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr);}
      .qzh .th-heroes .th-qotd{grid-column:auto;}
      .qzh .th-heroes .gtile{display:flex !important;}
      .qzh .th-r2{grid-template-columns:repeat(4,minmax(0,1fr));}
      .qzh .th-r2 .stile{display:flex !important;}
      .qzh .th-r2 .dtile{grid-column:auto;}
      .qzh .th-r2 .dueltile{grid-column:auto;}
      .qzh .th-r2 .th-slot-hold{display:none;}
      .qzh .th-heroes .hstile,.qzh .th-r2 .hstile,.qzh .th-heroes .ttile,.qzh .th-r2 .ttile,.qzh .th-r2 .dueltile{min-height:158px;}
      .qzh .qotd{min-height:158px;}
      .qzh .dtile{min-height:158px;}
      .qzh .qotd-photo{flex-basis:38%;}
      .qzh .qotd-body{padding:13px 15px;}
      .qzh .qotd-title{font-size:19px;}
      .qzh .qotd-foot{margin-top:11px;}
      .qzh .qotd-play{padding:8px 16px;font-size:13px;}
      /* Daily Challenge tile head: drop the N/N counter (the progress bars already show it) and let the title/chip wrap+ellipsis instead of running off the narrow tile. */
      .qzh .dtile-count{display:none !important;}
      .qzh .dtile-head{flex-wrap:wrap;gap:6px 7px;}
      .qzh .dtile-head .x8{font-size:12px !important;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .qzh .dtile-chip{font-size:9px;padding:2px 7px;}
    }
    .qzh .dtile{background:var(--white);border:1.5px solid var(--border);border-radius:14px;padding:14px 15px;color:var(--ink);display:flex;flex-direction:column;min-height:190px;}
    .qzh .th-only-desk{display:none !important;}
    @media(min-width:1025px){.qzh .th-only-mob{display:none !important;}.qzh .th-only-desk{display:flex !important;}}
    .qzh .dtile-head{display:flex;align-items:center;gap:8px;margin-bottom:9px;}
    .qzh .dtile-chip{font-size:10px;font-weight:800;background:var(--surface-alt);border-radius:12px;padding:2px 9px;text-transform:uppercase;letter-spacing:.04em;}
    .qzh .dtile-prog{display:flex;gap:5px;margin-bottom:10px;}
    .qzh .dtile-rows{display:flex;flex-direction:column;justify-content:space-evenly;flex:1;margin:2px 0 8px;}
    .qzh .dtile-row{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--ink);text-decoration:none;padding:2px 0;}
    .qzh .dtile-num{width:16px;height:16px;border-radius:50%;border:2px solid #c8ced9;flex:none;font-size:9px;display:flex;align-items:center;justify-content:center;}
    .qzh .dtile-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .qzh .dtile-cta{margin-top:auto;display:flex;align-items:center;justify-content:center;gap:10px;background:${C.cta};color:${C.ctaInk};border-radius:10px;padding:9px 12px;font-weight:800;font-size:12.5px;text-decoration:none;}
    .qzh .dtile-cta-go{display:inline-flex;align-items:center;gap:6px;flex:none;font-size:13.5px;font-weight:900;letter-spacing:0.01em;}
    .qzh .dtile-cta-ldr{display:inline-flex;align-items:center;gap:6px;min-width:0;flex:1;justify-content:center;padding:0 6px 0 10px;border-left:1px solid rgba(28,30,36,0.25);}
    .qzh .dtile-cta-nm{min-width:0;font-size:13.5px;font-weight:900;letter-spacing:0.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .qzh .dtile-cta-unseat{flex:0 1 auto;min-width:0;gap:5px;}
    .qzh .lbtile{background:var(--white);border:1px solid ${C.line};border-radius:14px;padding:12px 15px;flex:1;display:flex;flex-direction:column;min-height:132px;overflow:hidden;}
    .qzh .lbtile-head{display:flex;align-items:center;gap:7px;margin-bottom:6px;}
    .qzh .duelbtn{background:${C.cta};color:${C.ctaInk};border:none;border-radius:12px;padding:12px;font-weight:800;font-size:12px;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;flex:none;}
    .qzh .dueltile-chev{display:none;}
    .qzh .duel-mob-last{display:none;flex-direction:column;flex:1;}
    @media(max-width:560px){.qzh .dueltile{min-height:0 !important;}.qzh .dueltile-head{cursor:pointer;}.qzh .dueltile-chev{display:inline-flex !important;transition:transform .15s;}.qzh .dueltile.mc-closed .dueltile-body{display:none !important;}.qzh .dueltile.has-mob-last .duel-flip{display:none !important;}.qzh .dueltile.has-mob-last .duel-mob-last{display:flex !important;}}
    .qzh .rail{background:var(--white);border:1.5px solid var(--border);border-radius:14px;padding:10px 9px 9px;display:flex;flex-direction:column;}
    .qzh .rail-head{display:flex;align-items:center;gap:5px;margin-bottom:7px;}
    .qzh .rail-bars{flex:1;display:flex;flex-direction:column;gap:3px;min-height:0;}
    .qzh .rseg{position:relative;isolation:isolate;overflow:hidden;flex:1 1 0;min-height:24px;display:flex;align-items:center;background:#f1f3f6;border:none;border-radius:7px;margin:0;padding:0 9px;cursor:pointer;width:100%;text-align:left;}
    .qzh .rseg:hover{background:#e9edf3;}
    .qzh .rseg:hover .rmeter{filter:brightness(1.18);}
    .qzh .rmeter{position:absolute;left:0;top:0;bottom:0;z-index:0;min-width:3px;background:linear-gradient(90deg,rgba(37,99,235,.16),rgba(37,99,235,.05));border-right:2px solid var(--blue);border-radius:7px 0 0 7px;}
    .qzh .rseg-top{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;}
    .qzh .rseg .rnm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:600;color:var(--ink);}
    .qzh .rseg .rpct{font-size:10.5px;font-weight:800;flex:none;color:var(--slate);font-variant-numeric:tabular-nums;}
    /* Search + category + submit moved into the top command bar on desktop, so
       the browse control row collapses to just its (conditional) heading there. */
    @media(min-width:821px){.qzh .qz-browserow .qz-catbtn,.qzh .qz-browserow .qz-searchwrap,.qzh .qz-browserow .qz-submit,.qzh .qz-browserow .qz-daily{display:none !important;}}
    @media(max-width:820px){.qzh .qz-browserow{margin-bottom:14px !important;}}
    .qzh .dchev,.qzh .lchev{display:none;}
    @media(max-width:560px){
      .qzh .dtile-head,.qzh .lbtile-head{cursor:pointer;}
      .qzh .dchev,.qzh .lchev{display:inline-flex;flex:none;transition:transform .15s;}
      .qzh .dtile.mc-closed .dtile-collapse{display:none !important;}
      .qzh .lbtile{min-height:0 !important;}
      .qzh .dtile.mc-closed{min-height:0;padding-bottom:12px;}
      .qzh .lbtile.mc-closed .lbtile-collapse{display:none !important;}
      /* Collapsed leaderboard on mobile mirrors the blue Daily Challenge tile;
         stays white on desktop and when expanded. */
      .qzh .lbtile.mc-closed{background:${C.cta};border-color:${C.cta};}
      .qzh .lbtile.mc-closed .lbtile-head{color:${C.ctaInk};}
      .qzh .lbtile.mc-closed .lbtile-head .x8{color:${C.ctaInk} !important;}
      .qzh .lbtile.mc-closed .lbtile-head a{color:${C.ctaInk} !important;}
      .qzh .lbtile.mc-closed .lbtile-head .lchev{color:${C.ctaInk} !important;}
    }
    /* Full-width tool row under the three-column daily section, styled as ONE
       integrated element (owner 2026-07-29): a navy casing wraps the white search
       field and the three white action buttons, all one uniform treatment. */
    .qzh .qz-toolrow{position:relative;overflow:hidden;display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 16px;background:var(--white);border:1.5px solid var(--border);border-radius:13px;padding:8px 8px 8px 12px;}
    .qzh .qz-toolrow::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:${C.cta};pointer-events:none;}
    .qzh .qz-toolrow{border-left-color:${C.cta};}
    .qzh .qz-toolsearch{position:relative;flex:1 1 320px;min-width:0;display:flex;align-items:center;gap:9px;background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:0 12px;height:42px;transition:border-color .14s ease,background .14s ease;}
    .qzh .qz-toolsearch:hover{border-color:var(--muted);}
    .qzh .qz-toolsearch:focus-within{border-color:var(--muted);background:var(--surface);}
    .qzh .qz-toolsearch svg{flex:none;color:var(--muted);}
    .qzh .qz-toolsearch input{flex:1;min-width:0;border:none;outline:none;background:transparent;font-family:${FONT};font-size:14.5px;font-weight:600;color:var(--ink);}
    .qzh .qz-toolsearch input::placeholder{color:var(--muted);font-weight:500;}
    .qzh .qz-toolclear{flex:none;border:none;background:transparent;padding:0;cursor:pointer;color:var(--muted);display:flex;}
    .qzh .qz-toolclear:hover{color:var(--ink);}
    .qzh .qz-toolbtns{display:flex;align-items:center;gap:8px;flex:none;}
    .qzh .qz-toolbtn{display:inline-flex;align-items:center;gap:7px;height:42px;padding:0 15px;border-radius:10px;border:1.5px solid var(--border);background:transparent;color:var(--slate);font-family:${FONT};font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap;transition:background .14s ease,color .14s ease,border-color .14s ease;}
    .qzh .qz-toolbtn svg{flex:none;color:var(--muted);transition:color .14s ease;}
    .qzh .qz-toolbtn:hover{background:var(--surface);border-color:var(--muted);color:var(--ink);}
    .qzh .qz-toolbtn:hover svg{color:var(--ink);}
    .qzh .qz-toolbtn.qz-toolcta{background:${C.cta};border-color:${C.cta};color:${C.ctaInk};}
    .qzh .qz-toolbtn.qz-toolcta svg{color:${C.ctaInk};}
    .qzh .qz-toolbtn.qz-toolcta:hover{background:${C.ctaHover};border-color:${C.ctaHover};color:${C.ctaInk};}
    .qzh .qz-toolbtn.qz-toolcta:hover svg{color:${C.ctaInk};}
    /* One accent in the row: Share my day, the button we most want pressed
       (owner 2026-07-30). It leads the row, left of the search field. */
    @media(max-width:1024px){.qzh .qz-toolsearch{flex:1 1 100%;}.qzh .qz-toolbtns{flex:1 1 100%;}.qzh .qz-toolbtn{flex:1 1 0;justify-content:center;}}
    /* ONE search bar at every width. The browse row's own field is hidden from
       821px up (rule above), so this tool-row field is the desktop search; at
       <=820px that browse-row field comes back as the mobile search, so the
       tool-row one hides and only the three buttons remain here. Mobile layout
       is therefore exactly what it was, plus the buttons. */
    @media(max-width:820px){.qzh .qz-toolsearch{display:none !important;}.qzh .qz-toolrow{margin-top:14px;}}
    @media(max-width:560px){.qzh .qz-toolrow{gap:7px;padding:7px;margin-bottom:13px;}.qzh .qz-toolbtns{flex-wrap:wrap;gap:7px;}.qzh .qz-toolbtn{flex:1 1 calc(50% - 4px);height:40px;padding:0 10px;font-size:12px;}}
    .qzh .boards{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:12px;align-items:stretch;margin-bottom:12px;}
    .qzh .qz-mobtoggle{display:none;}
    /* Desktop: leaderboard LEFT (1fr), daily challenge WIDE MIDDLE (1.5fr),
       last-played feed RIGHT (1fr) via the min-width:681px order rule below. */
    @media(max-width:760px){.qzh .boards{grid-template-columns:1fr;}}
    /* Desktop (3-col) only: daily challenge in the WIDE middle track, last-played feed on the RIGHT, leaderboard LEFT. Tablet single-col (<=680) and mobile (<=560) unchanged. */
    @media(min-width:761px){.qzh .boards .daily-card{order:1;}.qzh .boards .lb-card{order:2;}.qzh .boards .live-card{display:none;}}
    .qzh .qcols{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px;}
    /* Last Played fills better on phones with fewer, taller rows: show only the 3 most recent (owner 2026-07-24). */
    @media(max-width:560px){.qzh .lp-mobhide{display:none !important;}.qzh .lp-row{flex:0 0 auto !important;min-height:56px !important;}}
    .qzh .qfull{column-count:2;column-gap:18px;}
    .qzh .qfull > a{display:flex;break-inside:avoid;-webkit-column-break-inside:avoid;}
    .qzh .qflow{column-width:310px;column-gap:18px;}
    .qzh .qflow > a{display:flex;break-inside:avoid;-webkit-column-break-inside:avoid;}
    @media(max-width:680px){.qzh .qfull{column-count:1;}}
    .qzh .colhead{display:flex;align-items:center;gap:9px;padding:8px 11px;background:var(--white);border-bottom:2px solid ${C.ink};border-radius:8px 8px 0 0;margin-bottom:3px;}
    .qzh .viewall{margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;}
    .qzh .qrow{display:flex;align-items:baseline;gap:10px;padding:6px 0;border-bottom:1px solid rgba(20,22,28,0.07);text-decoration:none;color:${C.ink};min-width:0;overflow:hidden;}
    .qzh .qrow:hover .qtitle{color:${C.accent};}
    .qzh .qrow .qtitle{font-size:13px;font-weight:500;}
    .qzh .qmeta{flex:none;display:flex;align-items:center;gap:10px;font-size:10.5px;}
    .qzh .catcard{position:relative;border:1px solid ${C.line};border-radius:12px;overflow:hidden;background:var(--white);display:flex;flex-direction:column;padding-bottom:4px;}
    /* Direction B (owner, 2026-08-14): the 24px pastel icon square that used to
       open every browse header is gone, and the category colour it carried now
       runs as a 4px left rule down the WHOLE card, the same rule the cap bars
       and the phone slate rows use. It is a ::before rather than a border-left
       for two reasons: a border would reflow every grid track by 4px, and it
       would curve into the 12px corner radius instead of reading as a straight
       bar. The card's own overflow:hidden clips it to the radius for free, and
       z-index 3 puts it OVER the hero photo (cc-ov is 1, cc-stat/cc-btm are 2)
       so the rule reads past the picture instead of stopping at the header.
       --cc is the category colour, --cct its pale tint; both are set inline by
       BrowseColumn, so a card with neither simply renders no rule. */
    .qzh .catcard::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--cc,transparent);z-index:3;pointer-events:none;}
    /* The card's own border would otherwise show as a pale hairline to the
       left of the strip. --cc is the same value the strip is painted with, so
       one declaration covers every category, and it falls back to the border
       colour for a column that sets no accent. */
    .qzh .catcard{border-left-color:var(--cc,${C.line});}
    /* Phone: the browse columns run edge to edge and stop being cards, matching
       the slate and the rails above them (owner, 2026-08-03). */
    @media(max-width:900px){
      .qzh .mc-open{margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);width:auto;max-width:none;}
      .qzh .catcard{border-left:none;border-right:none;border-radius:0;}
      .qzh .mc-open .colhead{border-radius:0;}
    }
    /* ...BUT THE BLEED ABOVE ASSUMES ONE COLUMN, AND .qcols IS TWO FROM ~645px
       UP (owner, 2026-08-08). The grid is repeat(auto-fill,minmax(min(100%,300px),
       1fr)), so a 744px iPad mini in portrait lays TWO 340px tracks, and every
       card in them was still taking the phone's 50%-50vw bleed: two 729px cards
       stacked on top of each other, hero photo over hero photo, with the card
       beneath showing through in strips. It broke every viewport from about 645
       to 900px, which is both tablets in portrait and the larger phones in
       landscape.
       So the edge-to-edge treatment stops where the second column starts, and a
       card inside the grid keeps its track and stays a card. Child selectors,
       deliberately: mc-open is a shared "expanded on mobile" state class that
       the boards and the duel tile also carry, and those keep the bleed. */
    @media(min-width:641px) and (max-width:900px){
      .qzh .qcols > .mc-open{margin-left:0;margin-right:0;}
      .qzh .qcols > .catcard{border-left:1px solid ${C.line};border-right:1px solid ${C.line};border-radius:12px;}
      .qzh .qcols > .catcard{border-left-color:var(--cc,${C.line});}
    }
    /* Hero height = 7 row-units (7 x 31px .qrow) so its bottom edge lands flush
   on a list-row gridline instead of ending mid-row; keeps quiz rows aligned
   across neighbouring columns with no ragged end gap. cover = crop, no stretch. */
    .qzh .cc-hero{position:relative;display:block;min-height:217px;background-size:cover;background-position:center;background-color:var(--accent);text-decoration:none;}
    .qzh .cc-ov{position:absolute;inset:0;background:linear-gradient(to top, rgba(8,15,35,0.92), rgba(8,15,35,0.4) 52%, rgba(8,15,35,0.05));z-index:1;}
    .qzh .cc-stat{position:absolute;top:8px;left:10px;z-index:2;font-size:10px;font-weight:700;color:var(--white);display:inline-flex;align-items:center;gap:3px;border-radius:999px;padding:3px 9px;max-width:calc(100% - 20px);white-space:nowrap;overflow:hidden;text-shadow:0 1px 6px rgba(0,0,0,.65);transition:background-color .18s ease;}
    .qzh .cc-stat.pill{background:rgba(17,32,74,.82);backdrop-filter:blur(2px);text-shadow:none;}
    .qzh .hpill{background:rgba(17,32,74,.85);border-radius:999px;padding:2px 8px;backdrop-filter:blur(2px);}
    .qzh .cc-btm{position:absolute;left:12px;right:12px;bottom:11px;z-index:2;display:flex;flex-direction:column;gap:5px;}
    .qzh .cc-htitle{color:var(--white);font-size:17px;font-weight:800;letter-spacing:-.2px;line-height:1.14;text-shadow:0 1px 8px rgba(0,0,0,.5);}
    .qzh .cc-play{font-size:13px;font-weight:800;color:var(--white);display:inline-flex;align-items:center;gap:4px;}
    .qzh .catcard .colhead.cc-head{border-radius:0;border:none;margin:0;order:-1;padding:9px 12px;background:var(--cct,var(--surface));}
    .qzh .cc-head .colicon{display:none;}
    .qzh .cc-hgroup{display:flex;flex-direction:column;gap:1px;min-width:0;}
    .qzh .cc-eyebrow{font-size:9.5px;letter-spacing:.13em;font-weight:800;text-transform:uppercase;color:var(--muted);line-height:1.35;}
    .qzh .cc-head h3{line-height:1.15;}
    /* One control on the right edge, filled in the card's own colour. The old
       'View all >' text link and its chevron are both retired here. */
    .qzh .cc-head .viewall{margin-left:auto;flex:none;background:var(--cc,${C.accent});border-radius:7px;padding:5px 10px;line-height:1.2;}
    .qzh .catcard .qrow{padding-left:11px;padding-right:11px;}
    .qzh .catcard .qrow:last-child{border-bottom:none;}
    .qzh .colhead.cc-filled{border-bottom:none;}
    .qzh .hubbtn{display:flex;align-items:center;gap:7px;background:var(--white);color:${C.accent};border:1px solid var(--accent-border);border-right:3px solid ${C.accent};padding:10px 15px;border-radius:10px;font-weight:700;font-size:13px;text-decoration:none;white-space:nowrap;}
    .qzh .qz-playerbar.hub-bleed .hubbtn{align-self:stretch;padding:0 18px;margin:-11px -14px -11px 0;border-radius:0 11px 11px 0;border-top:none;border-bottom:none;border-left:none;}
    .qz-playerbar .qz-skill-empty{display:none !important;}
    .qz-playerbar .lbl{font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:2px;}
    .qz-chev{display:none;}
    @media(max-width:560px){.qz-playerbar{flex-wrap:wrap !important;align-items:center !important;gap:10px 14px !important;}.qz-playerbar .qz-div{display:none !important;}.qz-playerbar:not(.open) .qz-stats{display:none !important;}.qz-playerbar.open .qz-stats{order:9 !important;flex:1 1 100% !important;margin-left:0 !important;justify-content:space-between !important;gap:10px !important;}.qz-playerbar{cursor:pointer;}.qz-chev{display:inline-flex !important;}.qz-playerbar .qz-bestcat{display:none !important;}.qz-playerbar .hubbtn{order:4 !important;margin-left:auto !important;flex:0 0 auto !important;}.qzh .boards{display:flex !important;flex-direction:column;gap:12px;}.qzh .boards .lb-card{display:none !important;}.qzh .boards .live-card{display:none !important;}.qzh .boards .lblive-card{order:1;}.qzh .boards .daily-card{order:2;}.qz-submit{display:none !important;}.qzh{padding-left:14px !important;padding-right:14px !important;}}
    .qzh .hubbtn:hover{background:${C.accsoft};}
    .qzh .crumb1{font-size:18px;font-weight:800;letter-spacing:-0.02em;}
    .qzh .crumb2{font-size:18px;font-weight:600;color:${C.accent};}
    .qzh a.qlink{text-decoration:none;color:inherit;}
    .qzh .qz-catbtn .ddmenu{left:0;right:auto;}
    .qzh .qz-catbtn{align-self:stretch;}
    .qzh .qz-searchwrap{align-self:stretch;}
    .qzh .qz-searchwrap input{height:100%;box-sizing:border-box;}
    .qzh .qz-submit{align-self:stretch;}
    .qzh .qz-daily{align-self:stretch;}
    .qzh .qz-srank{font-size:9px;font-weight:600;color:${C.soft};}
    .qzh .qz-pname{max-width:160px;}
    @media(max-width:560px){.qzh .qz-pname{max-width:120px;}}
    @media(max-width:560px){.qzh .qz-srank{display:none !important;}}
    .qzh .qz-catbtn .ddbtn{height:100%;box-sizing:border-box;}
    @media(max-width:560px){.qzh .qz-browserow{align-items:stretch !important;gap:8px !important;}.qzh .qz-catbtn{display:none !important;}.qzh .qz-daily{display:none !important;}.qzh .qz-searchwrap{flex:1 1 100% !important;order:3 !important;}}
    /* Mobile: the category menu can be taller than the space below its button,
       and the outside-click overlay freezes the page so the page itself can't
       scroll to reveal the rest. Anchor it as a viewport-bounded fixed sheet so
       every category is reachable via the menu's own internal scroll. */
    @media(max-width:560px){.qzh .qz-catbtn .ddmenu{position:fixed;z-index:60;left:50%;right:auto;transform:translateX(-50%);top:auto;bottom:12px;width:92vw;max-width:92vw;min-width:0;max-height:72vh;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;grid-template-columns:1fr 1fr;box-shadow:0 -8px 28px rgba(20,22,28,0.18);}}
    @media(max-width:560px){.qzh .qz-dd-overlay{z-index:55 !important;background:rgba(20,22,28,0.4);}}
    /* Mobile: surface the leaderboard + last-played boards (otherwise display:none on phones)
       as two side-by-side toggle buttons; tapping one expands its existing card full-width below. */
    @media(max-width:560px){
      .qzh .qz-mobtoggle{display:flex;gap:4px;margin-bottom:12px;background:var(--surface-alt);border-radius:12px;padding:4px;}
      .qzh .qz-mobtoggle .mtbtn{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;gap:7px;background:transparent;border:none;border-radius:9px;padding:9px 12px;cursor:pointer;font:inherit;color:${C.soft};font-weight:700;font-size:12.5px;}
      .qzh .qz-mobtoggle .mtbtn.active{background:var(--white);color:${C.ink};box-shadow:0 1px 2px rgba(20,22,28,0.06);}
      .qzh .qz-mobtoggle .mtbtn .mtlbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .qzh .qz-mobtoggle .mtbtn{justify-content:center !important;}
      .qzh .qz-mobtoggle .mtbtn svg:last-child{margin-left:0 !important;}
      .qzh .boards.show-lb .lb-card{display:flex !important;order:-1;}
      .qzh .boards.show-live .live-card{display:flex !important;order:-1;}
    }
    /* Mobile landscape (short viewport): keep the browse row on ONE line by letting the
       search field shrink, and stretch all four controls to a single shared height. */
    @media (orientation: landscape) and (max-height: 500px){
      .qzh .qz-browserow{flex-wrap:nowrap !important;align-items:stretch !important;gap:8px !important;}
      .qzh .qz-catbtn{flex:0 0 auto !important;align-self:stretch;}
      .qzh .qz-catbtn .ddbtn{height:100%;box-sizing:border-box;}
      .qzh .qz-searchwrap{flex:1 1 0 !important;min-width:90px !important;}
      .qzh .qz-searchwrap input{height:100%;box-sizing:border-box;}
      .qzh .qz-submit{flex:0 0 auto !important;align-self:stretch;box-sizing:border-box;}
      .qzh .qz-daily{flex:0 0 auto !important;align-self:stretch;box-sizing:border-box;}
    }
    .qzh .qz-mobhub{display:none;}
    .qzh .duelbtn-mob{display:none;}    .qzh .lblive-card{display:none;}
    .qzh .accchev{display:none;}
    @media(max-width:560px){
      .qzh .boards .head{cursor:pointer;}
      .qzh .accchev{display:inline-flex !important;transition:transform .15s;}
      .qzh .boards .card.mc-closed > div:not(.head){display:none !important;}
      .qzh section.mc-closed > .qrow{display:none !important;}
      .qzh .dailyicon{color:#374151 !important;}
      .qzh .livedot{background:#9aa1ab !important;animation:none !important;}
      .qzh .colhead:not(.cc-head){background:var(--white) !important;}
      .qzh .colhead .colicon{background:#f1f3f6 !important;}
      .qzh .colhead h3{color:var(--ink) !important;}
      .qzh .colhead:not(.cc-head) .viewall{color:var(--muted) !important;}
      .qzh .dot{background:#9aa1ab !important;}
      .qzh .mc-closed .vall{display:none !important;}
      .qzh .vall{text-transform:uppercase !important;font-size:10px !important;font-weight:700 !important;letter-spacing:.05em !important;}
      .qzh .lb-card.mc-open .lbbody{max-height:50vh;overflow-y:auto;justify-content:flex-start;}
      .qzh .qz-searchwrap input{font-size:16px !important;}
      .qzh .qz-mobhub{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;background:${C.accsoft};color:${C.accent};border:1px solid var(--accent-border);border-radius:12px;padding:14px 16px;text-decoration:none;font-family:${FONT};}
      .qzh .duelbtn-mob{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;background:${C.cta};color:${C.ctaInk};border:none;border-radius:12px;padding:14px;font-weight:800;font-size:14px;text-decoration:none;font-family:${FONT};}      .qzh .lblive-card{display:flex;flex-direction:column;}
      .qzh .lblive-head{background:var(--white) !important;}
      .qzh .lblive-tabs{display:flex;gap:4px;flex:1 1 auto;min-width:0;background:var(--surface-alt);border-radius:10px;padding:4px;}
      .qzh .lblive-tab{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;background:transparent;border:none;border-radius:8px;padding:8px 6px;font:inherit;font-weight:700;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#5f5e5a;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .qzh .lblive-tab.on{background:var(--white);color:var(--ink);box-shadow:0 1px 2px rgba(20,22,28,0.08);}
      .qzh .lblive-tab .livedot2{width:8px;height:8px;border-radius:50%;background:#9aa1ab;flex:none;}
      .qzh .lblive-body{max-height:50vh;overflow-y:auto;padding:3px 0;}
      .qzh .lblive-sub{position:sticky;top:0;z-index:1;display:block;padding:9px 13px 8px;background:var(--white);border-bottom:1px solid ${C.line};font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${C.soft};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    }

    /* ── THE PAPER GROUND (owner, 2026-08-24: "apply background fully") ─────
       The page sits on T.paper, the same light ground the daily game pages
       use, matching the marquee home's paper treatment above. This REPLACED
       the 2026-08-12 midnight Loft ground: the heavy dark-ground shadows,
       the border:0 lit-surface rule, and the footer's light-blue re-ink are
       all gone with it (pale-on-pale text would be unreadable here). Cards
       return to the light convention: white, 1px hairline, soft shadow. The
       bare row lists keep the white sheet the dark ground gave them, since
       it reads just as well on paper. */
    .qzh .qz-empty{padding:18px 2px;font-size:14px;color:${C.soft};}
    .qzh > .qflow,.qzh > .qfull,.qzh > .qz-empty,.qzh > section{background:var(--white);border:1px solid var(--border);border-radius:14px;padding:15px 18px;box-shadow:0 1px 2px rgba(16,24,40,0.04);}
    /* CategoryFull is a <section> whose own head bar must stay flush to the top
       of the sheet, so the sheet carries no padding and the list inside does. */
    .qzh > section{padding:0;overflow:hidden;}
    .qzh > section > .colhead{border-radius:0;margin-bottom:0;}
    .qzh > section > .qfull{border:none;border-radius:0;box-shadow:none;padding:13px 18px 16px;}
    .qzh .catcard,.qzh .qz-toolrow,.qzh .hr-panel{box-shadow:0 1px 2px rgba(16,24,40,0.04);}
  `;

  const renderLb = () => (
    lbMetric.special ? (
                (() => {
                  if (lbMetric.key === 'catRating') {
                    const rows = (catBoards[lbMetric.catKey] || []).slice(0, 3);
                    if (rows.length === 0) return <div style={{ padding: '12px 13px', fontSize: 12, color: C.soft }}>No ranked players yet.</div>;
                    return rows.map((r, i) => (
                      <LbRow key={r.userKey || i} i={i}
                        name={r.userKey ? <Link href={`/quizzes/hub?player=${encodeURIComponent(r.userKey)}`} style={{ color: 'inherit', textDecoration: 'none' }}><WhoTag name={r.name} isAnon={r.isAnon} /></Link> : <WhoTag name={r.name} isAnon={r.isAnon} />}
                        value={lbMetric.fmt(r.xp)} frac={(r.xp || 0) / (rows[0]?.xp || 1)} />
                    ));
                  }
                  const rows = (lbMetric.key === 'dailyChallenge' ? dailyRows : lbMetric.key === 'correctToday' ? todayCorrectRows : todayQuizRows).slice(0, 3);
                  const valOf = lbMetric.key === 'dailyChallenge' ? ((r) => r.totalCorrect) : lbMetric.key === 'correctToday' ? ((r) => r.correct) : ((r) => r.quizzes);
                  if (rows.length === 0) return <div style={{ padding: '12px 13px', fontSize: 12, color: C.soft }}>No plays yet today.</div>;
                  return rows.map((r, i) => (
                    <LbRow key={`s${i}`} i={i}
                      name={r.userKey ? <Link href={`/quizzes/hub?player=${encodeURIComponent(r.userKey)}`} style={{ color: 'inherit', textDecoration: 'none' }}><WhoTag name={r.username || 'Player'} isAnon={false} /></Link> : <WhoTag name={r.username || 'Player'} isAnon={false} />}
                      value={(valOf(r) || 0).toLocaleString()} frac={(valOf(r) || 0) / (valOf(rows[0]) || 1)} />
                  ));
                })()
              ) : (
                <>
                  {leaderRows.length === 0 && <div style={{ padding: '12px 13px', fontSize: 12, color: C.soft }}>No ranked players yet.</div>}
                  {leaderRows.map((r, i) => (
                    <LbRow key={r.userKey || i} i={i}
                      name={r.userKey ? <Link href={`/quizzes/hub?player=${encodeURIComponent(r.userKey)}`} style={{ color: 'inherit', textDecoration: 'none' }}><WhoTag name={r.name} isAnon={r.isAnon} /></Link> : <WhoTag name={r.name} isAnon={r.isAnon} />}
                      value={lbMetric.fmt(r[lbMetric.key])} frac={(r[lbMetric.key] || 0) / (leaderRows[0]?.[lbMetric.key] || 1)} />
                  ))}
                </>
              )
  );
  const renderLive = () => (
    <>
      {liveRows.length === 0 && <div style={{ padding: '12px 13px', fontSize: 12, color: C.soft }}>No recent plays{scope === 'all' ? '' : ' in this category'} yet.</div>}
              {liveRows.map((f, i) => (
                <Link href={playHref(f.quizId)} className="qlink" key={i}>
                  <div className="lrow" style={{ gap: 4, flexDirection: 'column', alignItems: 'stretch', padding: '7px 13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span className="qtitle" style={{ fontWeight: 600 }}>{f.title}</span>
                      {f.dayCount > 0 ? <span className="lf-day" title={`${f.dayCount} play${f.dayCount === 1 ? '' : 's'} today`}>(x{f.dayCount})</span> : null}
                      {dailyIds.includes(f.quizId) ? <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', color: C.accent, background: C.accsoft, padding: '1px 6px', borderRadius: 6 }}><Flame size={10} />Daily</span> : null}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: C.soft }}>
                          <span className="scorebadge" style={{ flex: 'none', fontWeight: 700, padding: '1px 6px', borderRadius: 6, fontVariantNumeric: 'tabular-nums', background: f.total && f.score / f.total >= 0.8 ? '#e7f7ed' : '#eef1f6', color: f.total && f.score / f.total >= 0.8 ? T.successDeep : C.soft }}>{f.score}/{f.total}</span>
                      <span style={{ fontWeight: 700 }}>{f.attempt > 1 ? `attempt ${f.attempt}` : '1st try'}</span>
                      <span style={{ marginLeft: 'auto' }}>{relTime(f.playedAt)}</span>
                    </span>
                  </div>
                </Link>
              ))}
    </>
  );

  const doneCtx = useMemo(() => ({
    played: (me && me.found && Array.isArray(me.playedIds)) ? new Set(me.playedIds) : null,
    completed: (me && me.found && Array.isArray(me.completedIds)) ? new Set(me.completedIds) : null,
  }), [me]);

  // THE STAGE HOME IS THE WHOLE PAGE. Rule one of the pattern is that the page
  // is the thing: no masthead above it and no stat bar, exactly as on a board.
  // TodayClient's own early return was not enough, because the chrome is drawn
  // HERE, one level up, so this returns the surface on its own.
  if (stageHome) return <StageToday />;

  return (
    <QuizDoneContext.Provider value={doneCtx}>
    <div className="qzloft" style={{ background: HOME_GROUND, minHeight: '100vh', position: 'relative' }}>
      <Grain />
      <style>{css}</style>
      {/* Live ticker marquee removed from the quiz home per owner (2026-07-28). */}
      <QuizCommandHeader me={me} onSignup={() => setSignupOpen(true)} ticker={[]} variant="home" onCredit={() => { setCreditQr(false); setCreditOpen(true); }} />
      <div className="qzh qzf-w" style={{ maxWidth: 1560, margin: '0 auto', padding: '14px clamp(16px, 1.7vw, 24px) 70px', position: 'relative' }}><style>{`@media(max-width:560px){.qzf-w{padding-left:14px !important;padding-right:14px !important;}}
        /* Phone: the daily console butts straight up against the command bar,
           so the page's own top padding goes and the section carries no gap
           above it (owner, 2026-08-03). */
        @media(max-width:900px){.qzf-w{padding-top:0 !important;}.qzh .dhx{padding-top:0 !important;}.qzh .dhx-center{margin-top:0 !important;}}`}</style>

        {(() => {
          if (duelMuteAll) return null;
          const myA = getAnonId();
          const q = [];
          (duelNotif.yourTurn || []).forEach((c) => { if (duelLater[c.token]) return; q.push({ kind: 'yourturn', ...c }); });
          (duelNotif.challenges || []).forEach((c) => { if (duelLater[c.token]) return; if (c.challenger_anon && duelMuted[c.challenger_anon]) return; q.push({ kind: 'challenge', ...c }); });
          (duelNotif.results || []).forEach((r) => { if (duelSeen[r.token]) return; const iAmCh = r.mine ? r.mine === 'challenger' : r.challenger_anon === myA; if (r.status === 'declined' && !iAmCh) return; q.push({ kind: 'result', iAmCh, ...r }); });
          if (!q.length) return null;
          const it = q[0];
          // resolveTitle, not titleById: a duel can be on a daily puzzle, whose
          // dated id is not in the static catalog and would print raw.
          const qTitle = (resolveTitle(it.quiz_id) || it.quiz_id);
          const more = q.length > 1 ? q.length - 1 : 0;
          let outcome = '';
          if (it.kind === 'result') {
            if (it.status === 'declined') outcome = `${it.opponent_name || 'Your opponent'} turned down your duel`;
            else if (it.winner === 'tie') outcome = 'It was a tie!';
            else { const iWon = (it.iAmCh && it.winner === 'challenger') || (!it.iAmCh && it.winner === 'opponent'); outcome = iWon ? 'You won your duel!' : 'You lost your duel'; }
          }
          const txtBtn = { background: 'transparent', border: 'none', fontFamily: FONT, fontWeight: 800, fontSize: 13, cursor: 'pointer' };
          return (
            <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 90, width: 352, maxWidth: 'calc(100vw - 28px)', background: T.white, borderRadius: 16, border: `2px solid ${C.accent}`, boxShadow: '0 16px 44px rgba(20,22,28,0.22)', overflow: 'hidden', fontFamily: FONT }}>
              <div style={{ background: C.accent, color: T.white, padding: '11px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', display: 'inline-flex', alignItems: 'center', gap: 7 }}><Swords size={16} /> {it.kind === 'challenge' ? 'DUEL CHALLENGE' : it.kind === 'yourturn' ? 'YOUR MOVE' : 'DUEL RESULT'}</span>
                <button onClick={() => (it.kind === 'challenge' || it.kind === 'yourturn') ? duelLaterAdd(it.token) : duelSeenAdd(it.token)} aria-label="Dismiss" style={{ border: 'none', background: 'transparent', color: T.white, cursor: 'pointer', fontSize: 18, lineHeight: 1, opacity: 0.85 }}>×</button>
              </div>
              <div style={{ padding: '16px 16px 15px' }}>
                {(it.kind === 'challenge' || it.kind === 'yourturn') ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 36, height: 36, borderRadius: '50%', background: C.accsoft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{((it.kind === 'yourturn' ? it.opponent_name : it.challenger_name) || 'P').slice(0, 2).toUpperCase()}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.soft }}>VS</span>
                      <span style={{ width: 36, height: 36, borderRadius: '50%', background: '#faedd0', color: '#a9781a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>YOU</span>
                      {it.device && it.device !== 'any' && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: T.white, background: C.ink, borderRadius: 999, padding: '3px 9px', textTransform: 'uppercase' }}>{it.device === 'mobile' ? 'Mobile Only' : 'Desktop Only'}</span>}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: '13px 0 3px' }}>{it.kind === 'yourturn' ? `${it.opponent_name || 'Your opponent'} played, your move` : `${it.challenger_name || 'Someone'} Challenged You`}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{qTitle}{more ? ` · +${more} More` : ''}</div>
                    <a href={`/duel/${it.token}`} style={{ display: 'block', textAlign: 'center', background: C.accent, color: T.white, padding: '12px', borderRadius: 10, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>Play Now →</a>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 11 }}>
                      {it.kind === 'challenge' && <button onClick={() => duelDecline(it.token)} style={{ ...txtBtn, color: T.danger }}>Turn Down</button>}
                      <button onClick={() => duelLaterAdd(it.token)} style={{ ...txtBtn, color: C.soft }}>Maybe Later</button>
                      {it.kind === 'challenge' && <button onClick={() => duelMuteAdd(it.challenger_anon, it.challenger_name, it.token)} style={{ ...txtBtn, color: C.soft }}>Mute User</button>}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: 3 }}>{outcome}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{qTitle}{more ? ` · +${more} More` : ''}</div>
                    <a href={`/duel/${it.token}`} style={{ display: 'block', textAlign: 'center', background: C.accent, color: T.white, padding: '11px', borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>See Duel →</a>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 11 }}>
                      <button onClick={() => duelSeenAdd(it.token)} style={{ ...txtBtn, color: C.soft }}>Dismiss</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {signupOpen && <SignupModal onClose={() => setSignupOpen(false)} />}

        {feedbackMode && <FeedbackModal mode={feedbackMode} onClose={() => setFeedbackMode(null)} />}

        {creditOpen && (() => {
          const shareUrl = (refData && refData.me && refData.me.shareUrl) || null;
          const copyIt = async () => { if (!shareUrl) return; try { await navigator.clipboard.writeText(shareUrl); setCreditCopied(true); setTimeout(() => setCreditCopied(false), 1800); } catch (e) {} };
          return (
            <div onClick={() => setCreditOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(20,22,28,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: '100%', background: T.white, borderRadius: 14, border: `1px solid ${C.line}`, padding: 22, fontFamily: FONT }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>How to get credit</h3>
                  <button onClick={() => setCreditOpen(false)} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.soft, display: 'flex' }}><X size={18} /></button>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: '0 0 8px' }}>I&apos;m a single person startup! Word of mouth is how this grows.</p>
                <p style={{ fontSize: 13, color: C.muted, margin: '0 0 14px', lineHeight: 1.5 }}>Registered users get a share link, and the Share button on every quiz and daily game already includes it. Anyone who opens one and finishes a puzzle or quiz credits you.</p>
                {/* The terms, from the shared component: this modal opens off a
                    button that names a dollar figure, so it has to state what the
                    figure is for (owner, 2026-08-08). */}
                <ContestNote />
                {shareUrl ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: C.ink, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 9, padding: '10px 12px' }} title={shareUrl}>{shareUrl.replace(/^https:\/\//, '')}</span>
                      <button onClick={copyIt} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: C.cta, color: C.ctaInk, border: 'none', borderRadius: 9, padding: '10px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>{creditCopied ? <Check size={14} /> : null}{creditCopied ? 'Copied' : 'Copy'}</button>
                    </div>
                    {/* The offline half of the same job. Same component the
                        contest board and the global share pop-up render, so the
                        copy and the request payload cannot drift. It suppresses
                        itself once the contest ends. */}
                    <div style={{ marginTop: 14, border: `1px solid ${C.line}`, borderRadius: 12, padding: '13px 14px' }}>
                      {creditQr ? <QrPosterForm /> : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
                          <span style={{ color: C.cta, flexShrink: 0, lineHeight: 1 }}><QrCode size={20} strokeWidth={2.2} /></span>
                          <div style={{ flex: 1, minWidth: 165, fontSize: 12.5, color: C.muted, lineHeight: 1.45 }}>
                            A link reaches the people you know. We will also make you a printable{' '}
                            <b style={{ color: C.ink }}>QR poster</b> for a coffee shop, a classroom or work.
                          </div>
                          <button
                            type="button"
                            onClick={() => setCreditQr(true)}
                            style={{ flexShrink: 0, background: C.cta, color: C.ctaInk, border: 'none', borderRadius: 9, padding: '9px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}
                          >
                            Get a QR poster
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <button onClick={() => { setCreditOpen(false); setSignupOpen(true); }} style={{ width: '100%', background: C.cta, color: C.ctaInk, border: 'none', borderRadius: 10, padding: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}>Register to get your link →</button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Stage 2: three-column daily section — the puzzle board flanked by a
            community rail (Top Community Member + Daily Challenge) and an activity
            rail (Quiz of the Day + Last Played). The board carries the daily
            leaderboard (Today's Top 3 + expand) itself. Stacks to one column
            (board first) below 1200px. */}
        {MARQUEE_HOME ? (
          <div className="dhx-marquee" style={{ marginBottom: 12 }}>
            <TodayClient onSignup={() => setSignupOpen(true)} />
          </div>
        ) : (
        <div className={v3 ? 'dhx dhx-v3' : 'dhx'}>
          <style>{`
            .qzh .dhx{display:grid;grid-template-columns:284px minmax(0,1fr) 300px;gap:10px;align-items:start;margin-bottom:12px;}
            /* HOME v3: the left rail is gone, so two columns, and BOTH are pinned
               to the viewport so the page is exactly one screen (owner,
               2026-08-15: the slate must fill the whole screen). Each column is
               a flex box that hands its height to the one scrollable region
               inside it: the games list on the left, the open board on the
               right. Declared here, BEFORE the stacked and phone blocks further
               down, so those keep overriding it and mobile is untouched. Pinned
               above 1200px only, the same threshold railH uses. */
            .qzh .dhx-v3{grid-template-columns:minmax(0,1fr) 340px;}
            @media(min-width:1201px){
              .qzh .dhx-v3 .dhx-center,.qzh .dhx-v3 .dhx-right{height:calc(100vh - var(--v3nat,140px) - 16px);min-height:0;}
              .qzh .dhx-v3 .dhx-center{display:flex;flex-direction:column;}
              .qzh .dhx-v3 .dhx-center > *{flex:1 1 auto;min-height:0;}
              .qzh .dhx-v3 .dhx-right{position:sticky;top:var(--v3top,86px);align-self:start;overflow:hidden;}
              .qzh .dhx-v3 .dhx-right > .hr-panel{flex:1 1 auto;min-height:0;}
            }
            /* start, not stretch: the CENTRE column has to report its own content
               height, because railH below measures it and pins both rails to it. With
               stretch the centre reported the row height instead, which was itself the
               tallest rail, so a rail that grew through the day (Last Played filling up)
               dragged the whole row taller and left the board floating in a long column
               (owner, 2026-07-30: "right and left columns are far too long"). The rails
               are built to compress into whatever height they are given: .dhx-lp-rows is
               overflow:hidden and its rows are flex:1 1 auto. */
            .qzh .dhx-rail{display:flex;flex-direction:column;gap:13px;min-width:0;}
            .qzh .dhx-center{min-width:0;display:flex;flex-direction:column;}
            /* right rail: Last Played absorbs the slack, so collapsing Category Mastery gives it back its space */
            .qzh .dhx-right .dhx-lp{flex:1 1 auto;display:flex;flex-direction:column;}
            .qzh .dhx-right .dhx-lp .dhx-lp-rows{flex:1 1 auto;}
            /* left leaderboards element */
            .qzh .dhx-lb{background:var(--white);border:1px solid ${C.line};border-radius:14px;padding:13px 14px;}
            .qzh .dhx-lb-eb{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:.02em;margin-bottom:8px;color:var(--gold-ink);}
            .qzh .dhx-lb-eb svg{color: var(--gold-ink);flex:none;}
            .qzh .dhx-lb1{display:flex;align-items:center;gap:9px;border-radius:11px;padding:8px 10px;margin-bottom:4px;background:linear-gradient(90deg,#fdf1d3,var(--white));border:1px solid #f0dcae;}
            .qzh .dhx-lb1 .av{width:32px;height:32px;border-radius:50%;background:var(--gold);color:#2b1d00;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex:none;}
            .qzh .dhx-lb1 .m{flex:1;min-width:0;}
            .qzh .dhx-lb1 .m .n{display:block;font-size:19px;font-weight:800;line-height:1.02;color:var(--gold-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .qzh .dhx-lb1 .m .s{display:block;font-size:10px;font-weight:600;color:var(--muted);margin-top:1px;}
            .qzh .dhx-lb1 .sc{flex:none;font-size:14px;font-weight:800;color:var(--gold-ink);font-variant-numeric:tabular-nums;}
            .qzh .dhx-lrow{display:flex;align-items:center;gap:9px;padding:4px 0;font-size:12px;color:#4a4f5c;}
            .qzh .dhx-lrow .pl{width:15px;font-size:10.5px;font-weight:700;color:var(--muted);font-variant-numeric:tabular-nums;flex:none;}
            .qzh .dhx-lrow b{flex:1;min-width:0;color:var(--ink);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .qzh .dhx-lrow .sc{flex:none;font-size:11.5px;font-weight:700;color:var(--muted);font-variant-numeric:tabular-nums;}
            .qzh .dhx-lrow.you{background:#fdf7ec;border-radius:7px;padding:5px 8px;margin:2px -8px 0;}
            .qzh .dhx-lrow.you b{color:var(--gold-ink);}
            .qzh .dhx-lb-more{display:inline-block;margin-top:8px;font-size:11px;font-weight:800;color:var(--blue);text-decoration:none;}
            /* full Last Played: white game rows on the navy card + hourly activity bars */
            .qzh .dhx-lp-bars{margin-left:auto;display:flex;align-items:flex-end;gap:2px;height:30px;}
            .qzh .dhx-lp-bars span{width:5px;border-radius:2px;flex:none;}
            .qzh .dhx-lp .dhx-lp-rows{background:var(--white);border-radius:12px;padding:3px 11px;margin-top:2px;overflow:hidden;gap:0;}
            .qzh .dhx-lpr{display:flex;align-items:center;gap:10px;padding:7px 0;text-decoration:none;border-bottom:1px solid #eef1f6;flex:1 1 auto;min-height:0;}
            .qzh .dhx-lpr:last-child{border-bottom:none;}
            .qzh .dhx-lpr .ring{width:30px;height:30px;flex:none;border-radius:999px;display:flex;align-items:center;justify-content:center;}
            .qzh .dhx-lpr .ring .in{width:23px;height:23px;border-radius:999px;background:var(--white);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--ink);}
            .qzh .dhx-lpr .mid{flex:1;min-width:0;}
            .qzh .dhx-lpr .mid .t{display:block;font-size:12px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
            .qzh .dhx-lpr .mid .c .x{font-weight:600;color:var(--muted);}
            .qzh .dhx-lpr .mid .c{display:flex;align-items:center;gap:4px;font-size:9.5px;color:var(--muted);margin-top:1px;}
            .qzh .dhx-lpr .mid .c i{width:6px;height:6px;border-radius:2px;flex:none;}
            .qzh .dhx-lpr .rt{flex:none;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
            .qzh .dhx-lpr .rt .s{font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;}
            .qzh .dhx-lpr .rt .beat{font-size:8.5px;font-weight:800;color:var(--success-deep);background:#e7f7ed;border-radius:999px;padding:1px 6px;}
            .qzh .dhx-lpr .rt .tm{font-size:9.5px;color:var(--muted);font-weight:600;white-space:nowrap;}
            /* beat chip and "how long ago" share one line under the score */
            .qzh .dhx-lpr .rt .when{display:flex;align-items:center;gap:5px;}
            /* quick play element */
            .qzh .dhx-quick{background:var(--white);border:1px solid ${C.line};border-radius:14px;padding:5px;flex:none;}
            .qzh .dhx-qrow{display:flex;align-items:center;gap:11px;padding:9px 9px;border-radius:11px;text-decoration:none;}
            .qzh .dhx-qrow + .dhx-qrow{border-top:1px solid ${C.line};}
            .qzh .dhx-qrow:hover{background:#f6f7f9;}
            .qzh .dhx-qrow .qic{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:none;color:var(--white);}
            .qzh .dhx-qrow .qm{flex:1;min-width:0;}
            .qzh .dhx-qrow .qm .qt{display:block;font-size:13px;font-weight:800;color:var(--ink);}
            .qzh .dhx-qrow .qm .qs{display:block;font-size:10.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
            /* who currently leads this row, beside the title */
            .qzh .dhx-qrow .qm .qlead{display:inline-flex;align-items:center;gap:3px;margin-left:6px;vertical-align:1px;max-width:110px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:9.5px;font-weight:800;border-radius:999px;padding:1px 7px;background:#fdf7ec;color:var(--gold-ink);border:1px solid #f0dcae;}
            .qzh .dhx-qrow .qm .qlead svg{flex:none;}
            .qzh .dhx-rone .dhx-qrow .qm .qlead{background:rgba(232,180,58,0.16);color:var(--gold-ink);border-color:rgba(232,180,58,0.42);}
            .qzh .dhx-qrow .qa{flex:none;color:var(--muted);font-weight:800;font-size:16px;}
            /* Category Mastery (collapsible) */
            .qzh .dhx-cm{background:var(--white);border:1px solid ${C.line};border-radius:14px;flex:none;overflow:hidden;}
            .qzh .dhx-cm-h{width:100%;display:flex;align-items:center;gap:7px;padding:12px 14px;background:none;border:none;cursor:pointer;font-family:inherit;font-size:12px;font-weight:800;letter-spacing:.02em;color:var(--blue);}
            .qzh .dhx-cm-h .cmchev{margin-left:auto;color:var(--muted);transition:transform .2s;}
            .qzh .dhx-cm.open .dhx-cm-h .cmchev{transform:rotate(180deg);}
            .qzh .dhx-cm-bars{padding:0 13px 12px;display:flex;flex-direction:column;gap:5px;}
            .qzh .dhx-cmbar{position:relative;display:flex;align-items:center;background:#eef1f6;border:none;border-radius:7px;padding:7px 10px;cursor:pointer;font-family:inherit;overflow:hidden;}
            .qzh .dhx-cmbar .mtr{position:absolute;left:0;top:0;bottom:0;background:#dbe6fb;border-radius:7px;}
            .qzh .dhx-cmbar .nm{position:relative;font-size:11.5px;font-weight:700;color:var(--ink);}
            .qzh .dhx-cmbar .p{position:relative;margin-left:auto;font-size:11px;font-weight:800;color:#4a4f5c;font-variant-numeric:tabular-nums;}
            .qzh .dhx-cm-empty{padding:0 14px 13px;font-size:11px;color:#4b5563;font-weight:600;}
            /* ── LEFT: one integrated navy element (three leaderboards) ── */
            .qzh .dhx-lone{background:var(--white);border:1.5px solid var(--border);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;height:100%;}
            .qzh .dhx-lone > *{border:0 !important;border-radius:0 !important;box-shadow:none !important;margin:0 !important;background:transparent !important;}
            .qzh .dhx-lone > * + *{border-top:1.5px solid var(--border) !important;}
            /* neutralize CommunityTile / XpTile tile chrome so they read as sections of the one card */
            .qzh .dhx-lone .cmtile,.qzh .dhx-lone .ttile{min-height:0 !important;background:var(--white) !important;}
            .qzh .dhx-lone .cmtile:before,.qzh .dhx-lone .cmtile:after,.qzh .dhx-lone .ttile:before,.qzh .dhx-lone .ttile:after{display:none !important;}
            .qzh .dhx-lone .xp-body{background:var(--white) !important;}
            /* three equal fixed boxes that fill the element; clip hover panels/scrollers; no load shift */
            .qzh .dhx-lone > *{flex:1 1 0 !important;min-height:0 !important;overflow:hidden !important;}
            .qzh .dhx-lone .cm-who,.qzh .dhx-lone .xp-who{font-size:32px !important;line-height:1.15 !important;}
            .qzh .dhx-lone .cm-namewrap,.qzh .dhx-lone .xp-namewrap{min-height:0 !important;}
            /* the three leaderboard sections: identical layout, equal size (flex:1),
               content distributed so each has the same spacing and no dead gaps */
            .qzh .dhx-lb{padding:0;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;}
            .qzh .dhx-lb-band{padding:11px 15px 12px;background:var(--surface-alt);}
            .qzh .dhx-lone > .dhx-lb:first-child .dhx-lb-band{border-top-left-radius:12.5px;border-top-right-radius:12.5px;}
            .qzh .dhx-lb.comm .dhx-lb-band{background:#f3edff;}
            .qzh .dhx-lb.daily .dhx-lb-band{background:#fdf3dc;}
            .qzh .dhx-lb.xp .dhx-lb-band{background:#e9f0ff;}
            .qzh .dhx-lb-body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:space-between;padding:9px 15px 12px;}
            .qzh .dhx-lb-tag{display:flex;width:100%;align-items:center;gap:6px;font-family:'DM Mono',ui-monospace,monospace;font-size:11.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px;}
            .qzh .dhx-lb-tag svg{flex:none;}
            .qzh .dhx-lb.comm .dhx-lb-tag{color:#5b21b6;}
            .qzh .dhx-lb.daily .dhx-lb-tag{color:#7c4a06;}
            .qzh .dhx-lb.xp .dhx-lb-tag{color:#162b5c;}
            .qzh .dhx-lb-hero{display:flex;align-items:flex-end;gap:8px;min-width:0;min-height:43px;}
            .qzh .dhx-lb-name{display:block;flex:1;min-width:0;font-weight:800;line-height:1.3;letter-spacing:-.5px;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .qzh .dhx-lb.comm .dhx-lb-name{color:#5b21b6;}
            .qzh .dhx-lb.daily .dhx-lb-name{color:#7c4a06;}
            .qzh .dhx-lb.xp .dhx-lb-name{color:#162b5c;}
            .qzh .dhx-lb-name:hover{text-decoration:underline;}
            .qzh .dhx-lb-stat{flex:none;text-align:right;padding-bottom:3px;}
            .qzh .dhx-lb-stat b{display:block;font-size:20px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;}
            .qzh .dhx-lb-stat b em{font-style:normal;font-size:12px;opacity:.7;}
            .qzh .dhx-lb-stat i{display:block;font-style:normal;font-family:'DM Mono',ui-monospace,monospace;font-size:8.5px;font-weight:600;letter-spacing:.07em;margin-top:3px;white-space:nowrap;}
            .qzh .dhx-lb-stat i.wrap{white-space:normal;line-height:1.45;}
            .qzh .dhx-lb.comm .dhx-lb-stat b{color:#7c3aed;}
            .qzh .dhx-lb.comm .dhx-lb-stat i{color:#6d28d9;}
            .qzh .dhx-lb.daily .dhx-lb-stat b{color:var(--gold-ink);}
            .qzh .dhx-lb.daily .dhx-lb-stat i{color:#8a5b0a;}
            .qzh .dhx-lb.xp .dhx-lb-stat b{color:var(--blue);}
            .qzh .dhx-lb.xp .dhx-lb-stat i{color:#162b5c;}
            .qzh .dhx-lb-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 13px;}
            .qzh .dhx-lb-gi{display:flex;align-items:center;gap:6px;font-size:11.5px;min-width:0;padding:3px 0;text-decoration:none;border-bottom:1px solid #eef1f6;}
            .qzh .dhx-lb-gi:nth-last-child(-n+2){border-bottom:none;}
            .qzh .dhx-lb-gi .rk{width:14px;height:14px;border-radius:4px;flex:none;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;}
            .qzh .dhx-lb.comm .dhx-lb-gi .rk{background:#ece5fb;color:#5b21b6;}
            .qzh .dhx-lb.daily .dhx-lb-gi .rk{background:#f6ebd2;color:#7c4a06;}
            .qzh .dhx-lb.xp .dhx-lb-gi .rk{background:#e1ebfd;color:#162b5c;}
            .qzh .dhx-lb-gi b{flex:1;min-width:0;color:var(--ink);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .qzh .dhx-lb-gi:hover b{text-decoration:underline;}
            .qzh .dhx-lb-gi .sc{flex:none;color:var(--slate);font-weight:700;font-variant-numeric:tabular-nums;}
            .qzh .dhx-lb-gi.me b{color:var(--gold-ink);}
            .qzh .dhx-lb-none{font-size:11.5px;color:#4b5563;padding:4px 0;}
            .qzh .dhx-lb-links{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;}
            .qzh .dhx-lb-more{display:inline-block;margin-top:9px;font-size:11px;font-weight:800;color:var(--blue);text-decoration:none;}
            .qzh .dhx-lb-morebtn{background:none;border:none;padding:0;cursor:pointer;font-family:inherit;text-align:left;}
            .qzh .dhx-lb-dots{display:inline-flex;align-items:center;gap:3px;margin-left:auto;}
            .qzh .dhx-lb-dots i{width:4px;height:4px;border-radius:50%;background:#c3cdd9;display:block;font-style:normal;}
            .qzh .dhx-lb-dots i.on{background:var(--blue);}
            /* ── RIGHT: one integrated navy element ── */
            .qzh .dhx-rone{background:var(--white);border:1.5px solid var(--border);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;height:100%;}
            .qzh .dhx-rone > *{border-radius:0 !important;border-left:0 !important;border-right:0 !important;box-shadow:none !important;background:transparent !important;}
            .qzh .dhx-rone .dhx-lp{border:0 !important;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;}
            .qzh .dhx-rone .dhx-lp .dhx-lp-rows{flex:1 1 auto;min-height:0;overflow:hidden;}
            /* Quick play + Category Mastery hold their size; expanding CM eats Last Played's space above */
            .qzh .dhx-rone .dhx-quick,.qzh .dhx-rone .dhx-cm{flex:none;}
            /* CM open: it becomes the flexible element (full list, scrolls if needed) and Last Played collapses */
            .qzh .dhx-rone.cm-open .dhx-lp{flex:0 0 auto;max-height:104px;}
            .qzh .dhx-rone.cm-open .dhx-cm{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;}
            .qzh .dhx-rone.cm-open .dhx-cm-bars{flex:1 1 auto;min-height:0;overflow-y:auto;}
            .qzh .dhx-rone .dhx-quick{border-top:1.5px solid var(--border) !important;padding:5px;}
            .qzh .dhx-rone .dhx-qrow + .dhx-qrow{border-top-color:var(--border) !important;}
            .qzh .dhx-rone .dhx-qrow:hover{background:var(--surface) !important;}
            .qzh .dhx-rone .dhx-qrow .qt{color:var(--ink) !important;}
            .qzh .dhx-rone .dhx-qrow .qs{color:var(--muted) !important;}
            .qzh .dhx-rone .dhx-qrow .qa{color:#5b7099 !important;}
            .qzh .dhx-rone .dhx-cm{border-top:1.5px solid var(--border) !important;}
            .qzh .dhx-rone .dhx-cm-h{color:var(--blue) !important;}
            .qzh .dhx-rone .dhx-cm-h .cmchev{color:var(--muted) !important;}
            .qzh .dhx-rone .dhx-cmbar{background:#f1f3f6 !important;}
            .qzh .dhx-rone .dhx-cmbar .mtr{background:#dbe6fb !important;}
            .qzh .dhx-rone .dhx-cmbar .nm{color:var(--ink) !important;}
            .qzh .dhx-rone .dhx-cmbar .p{color:var(--slate) !important;}
            .qzh .dhx-rone .dhx-cm-empty{color:var(--muted) !important;}
            .qzh .dhx-center .dstrip-wrap,.qzh .dhx-center .dhome{margin-bottom:0;}
            /* Quiz of the Day sized for the narrow right rail: photo over body */
            .qzh .dhx-qotd{flex-direction:column;min-height:0;}
            .qzh .dhx-qotd .qotd-photo{flex:0 0 auto;min-height:132px;}
            .qzh .dhx-qotd .qotd-body{padding:14px 16px;}
            /* Last Played rail card (navy) */
            .qzh .dhx-lp{background:var(--white);border:1.5px solid var(--border);border-radius:14px;padding:14px 15px;color:var(--ink);}
            .qzh .dhx-lp-top{display:flex;align-items:center;gap:8px;margin-bottom:11px;}
            .qzh .dhx-lp-ttl{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:800;color:var(--ink);}
            .qzh .dhx-lp-ttl svg{color:var(--ink);flex:none;}
            .qzh .dhx-live{display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:800;letter-spacing:.06em;color:var(--success-deep);background:rgba(16,185,129,0.16);border-radius:999px;padding:2px 7px;}
            .qzh .dhx-live i{width:5px;height:5px;border-radius:999px;background:var(--success);display:block;}
            .qzh .dhx-lp-all{margin-left:auto;background:none;border:none;color:var(--slate);font-family:inherit;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;padding:0;}
            .qzh .dhx-lp-stats{display:flex;flex-wrap:nowrap;align-items:flex-start;gap:12px;margin-bottom:11px;}
            .qzh .dhx-lp-stats b{display:block;font-size:15px;font-weight:800;line-height:1;white-space:nowrap;}
            .qzh .dhx-lp-stats span{display:block;font-size:8px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-top:4px;white-space:nowrap;}
            .qzh .dhx-lp-rows{display:flex;flex-direction:column;gap:1px;}
            .qzh .dhx-lp-row{display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:1.5px solid var(--border);text-decoration:none;}
            .qzh .dhx-lp-row:last-child{border-bottom:none;}
            .qzh .dhx-lp-nm{flex:1;min-width:0;font-size:12px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .qzh .dhx-lp-sc{flex:none;font-size:11px;font-weight:700;font-variant-numeric:tabular-nums;border-radius:7px;padding:2px 7px;}
            .qzh .dhx-lp-none{font-size:12px;color:var(--muted);padding:6px 0;}
            @media(max-width:1200px){
              .qzh .dhx{grid-template-columns:1fr;}.qzh .dhx-center{order:-1;}.qzh .dhx-left{order:1;}.qzh .dhx-right{order:2;}.qzh .dhx-qotd .qotd-photo{min-height:150px;}
              /* mobile: rails stack at natural height — no fixed boxes, no clipping/collapse */
              .qzh .dhx-rail{height:auto !important;}
              .qzh .dhx-lone,.qzh .dhx-rone{height:auto !important;overflow:visible !important;}
              .qzh .dhx-lone > *,.qzh .dhx-lb{flex:none !important;overflow:visible !important;height:auto !important;justify-content:flex-start !important;}
              .qzh .dhx-lb{padding:0 !important;}
              .qzh .dhx-lb-band{padding:14px 16px 13px !important;}
              .qzh .dhx-lb-body{padding:11px 16px 15px !important;}
              .qzh .dhx-rone .dhx-lp{flex:none !important;}
              .qzh .dhx-rone > *:last-child{border-bottom:0 !important;}
              .qzh .dhx-rone .dhx-lp .dhx-lp-rows,.qzh .dhx-rone.cm-open .dhx-cm-bars{overflow:visible !important;max-height:none !important;}
              .qzh .dhx-rone.cm-open .dhx-lp{max-height:none !important;}
              .qzh .dhx-lpr{flex:none !important;}
              .qzh .dhx-lone .cm-who,.qzh .dhx-lone .xp-who{font-size:32px !important;}
            }
            /* 901-1200: the board goes full width on its own row, but the two rails
               sit SIDE BY SIDE beneath it instead of each stretching to full width
               (owner, 2026-08-03: a narrowed desktop rendered them as giant full-width
               bands). Each column lands at ~360px+, i.e. wider than the 284/300 desktop
               rails, so every rail card keeps its intended proportions.
               ⚠️ The floor is 901, NOT 761. HomeRails takes .hr-panel FULL BLEED below
               900px (margin-left:calc(50% - 50vw)), so between 761 and 900 the two
               rules fought and both rails escaped their columns: measured on the live
               site at 800px, every panel rendered 785px wide, the left rail at x=-190
               and the right at x=190, i.e. overlapping each other and hanging off the
               page. Below 901 the rails now stack in one column, which is what the
               full-bleed treatment already assumes. */
            @media(min-width:901px) and (max-width:1200px){
              .qzh .dhx{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:stretch;}
              .qzh .dhx-center{grid-column:1 / -1;}
              .qzh .dhx-left{grid-column:1;}
              .qzh .dhx-right{grid-column:2;}
              /* paired rails run to the SAME bottom edge: whichever card has less
                 content stretches to the row height and shares the slack between its
                 blocks, instead of stopping short and leaving a ragged column
                 (owner, 2026-08-03: "the leaderboard side needs to stretch to match"). */
              .qzh .dhx-rail{height:auto !important;align-self:stretch;}
              .qzh .dhx-rail > *{flex:1 1 auto !important;}
              .qzh .dhx-lone,.qzh .dhx-rone{height:auto !important;}
              .qzh .dhx-lone > *{flex:1 1 auto !important;}
              .qzh .dhx-rone .dhx-lp{flex:1 1 auto !important;}
              /* HOME v3 HAS NO LEFT RAIL, so pinning the Loft to column 2 left
                 column 1 as an empty strip of page ground beside it (owner,
                 2026-08-15: "the loft gets locked to one side instead of
                 filling"). It spans the row here, the same as the console above
                 it. The two-column rule stays for the legacy two-rail layout,
                 which still has something to put in column 1. */
              .qzh .dhx-v3 .dhx-right{grid-column:1 / -1;}
            }
            /* PHONE: no seams between sections (owner, 2026-08-08). Below 900px
               every rail panel already goes full-bleed edge to edge, so the
               grid's 14px gap and the rail's 13px gap were rendering as thin
               strips of page background BETWEEN full-width bands: the board and
               the leaderboard under it read as two things that had come apart,
               and the same strip showed again at the break below the rails.
               Zeroing both gaps (and the section's bottom margin) makes the
               phone home one continuous stack, which is the direction-B shape
               the cap bars and the slate already follow. HomeRails drops the
               doubled border where two panels now meet.
               Desktop and the 901-1200px stacked-but-inset layout are untouched:
               there the panels are still rounded cards in a gutter, where a gap
               is the thing that separates them. */
            @media(max-width:900px){
              .qzh .dhx{gap:0;margin-bottom:0;}
              .qzh .dhx-rail{gap:0;}
              /* The tool row is the "next section break" the same complaint
                 named: it carried its own 2px top margin on top of the grid's
                 bottom margin. This block is later in source than the tool
                 row's own rule at equal specificity, so it wins.
                 It is NOT zero, though (owner, 2026-08-13). The seam rule above
                 is about two FULL-BLEED bands meeting, where a strip of page
                 background between them reads as the stack coming apart. The
                 tool row is the opposite shape: an inset rounded card in the
                 14px gutter. Butting that straight into the bleeding Featured
                 panel above it put the search block hard against the last tile
                 with no edge at all. So it takes a real gap, matched to the
                 page gutter and to its own 13px bottom margin. */
              .qzh .qz-toolrow{margin-top:14px;}
            }
            /* TABLET AND LANDSCAPE PHONE: the two rails SIDE BY SIDE (owner,
               2026-08-08). Stacked, the five panels ran 1,575px tall on a 744px
               iPad mini, which put the browse row two screens below the board.
               Same shape as the 901-1200 tier above: the console keeps its own
               full-width row, the rails pair beneath it.
               The BLEED MOVES, it does not come off. Below 900px every rail
               panel bleeds itself edge to edge, and a full-bleed child of a
               two-column grid escapes its column, which is the exact fight the
               901 floor above was set to avoid. So .dhx takes the bleed, its
               panels drop theirs (see HomeRails), and the console drops its own,
               since its parent now spans the viewport for it. The page still
               reads as one continuous edge-to-edge stack, with a seam down the
               middle of the rails.
               Below 641 the rails stay stacked: a 320px rail column would put
               the leaderboard's name and score on top of each other. */
            @media(min-width:641px) and (max-width:900px){
              .qzh .dhx{margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);width:auto;max-width:none;
                grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;}
              .qzh .dhx-center{grid-column:1 / -1;}
              .qzh .dhx-left{grid-column:1;}
              .qzh .dhx-right{grid-column:2;border-left:1px solid var(--border);}
              .qzh .dhx-rail{height:auto !important;}
              .qzh .dhx-center .dhome.slate{margin-left:0;margin-right:0;width:auto;max-width:none;}
              /* THE TWO COLUMNS END LEVEL, AND THE LIVE FEED IS WHAT STRETCHES
                 (owner, 2026-08-08). The right column ran 699px against the
                 leaderboards' 876, so a 177px notch of page showed under
                 Featured while the left column carried on. The row stretches
                 both rails, and inside the right one the slack goes to the
                 feed, the only panel here whose content is unbounded: the
                 column ends level by showing MORE FEED, never by padding
                 anything out. Featured is three fixed rows and keeps its own
                 height (.hr-feat is already flex:none).
                 The max-height:none is the point of the last rule: HomeRails
                 caps the feed body at 360px below 1200px because a stacked rail
                 has no height to fill, and here it does.
                 flex-basis ZERO on both, not auto: the feed's content is 2,105px
                 of rows, so with basis:auto its hypothetical size drives the
                 grid ROW and the pair came out 2,444px tall with the
                 leaderboards stretched to match. Basis 0 means the panel asks
                 for nothing and only grows into the height the row already
                 has. */
              .qzh .dhx{align-items:stretch;}
              .qzh .dhx-rail{align-self:stretch;}
              .qzh .dhx-right > .hr-panel.hr-flex{flex:1 1 0;min-height:0;}
              .qzh .dhx-right .hr-actbody{max-height:none;flex:1 1 0;min-height:0;overflow-y:auto;}
              /* Same as the tier above: v3's Loft spans the row rather than
                 sitting in column 2 with nothing beside it. The seam border
                 comes off with it, since there is no left column to divide it
                 from. */
              .qzh .dhx-v3 .dhx-right{grid-column:1 / -1;border-left:none;}
            }
            @media(max-width:760px){
              /* rails stack full width on phones: the leaderboards stay a top 5 */
              .qzh .dhx-lb-gi:nth-child(n+5){display:none !important;}
              .qzh .dhx-lb-gi{padding:5px 0 !important;}
            }
          `}</style>
          {v3 ? null : (
          <div className="dhx-rail dhx-left" style={{ height: railH || undefined }}>
            <HomeRails
              side="left"
              refData={refData}
              dailyBoard={dailyBoard}
              xpToday={xpToday}
              xp30={xp30}
              xpAll={xpAll}
              onCredit={() => { setCreditQr(false); setCreditOpen(true); }}
            />
          </div>
          )}
          <div className="dhx-center" ref={centerRef}>
            <DailyStrip board={dailyBoard} layout={v3 ? 'catboard' : 'slate'} quizCats={v3 ? quizCats : undefined} />
          </div>
          <div className="dhx-rail dhx-right" style={{ height: v3 ? undefined : (railH || undefined) }}>
            <HomeRails
              side={v3 ? 'board' : 'right'}
              refData={refData}
              me={me}
              myCats={myCats}
              dailyMastery={dailyMastery}
              qotd={qotd}
              xp30={xp30}
              xpAll={xpAll}
              onCredit={() => { setCreditQr(false); setCreditOpen(true); }}
              dailyBoard={dailyBoard}
              totals={totals}
              lastPlayed={(lastPlayed || []).map((f) => ({ ...f, when: relTime(f.playedAt) ? `${relTime(f.playedAt)} ago` : '' }))}
              titleFor={(id) => stripVerb(resolveTitle(id) || id)}
              hrefFor={(id) => playHref(id)}
              catFor={(id) => {
                const fam = gameFamily(id);
                const dgc = fam ? DG_CAT[fam] : null;
                const color = dgc ? catBlue(dgc.name) : deptBlue(deptById[id]);
                const label = dgc ? shortCat(dgc.name) : (fam ? 'Daily' : (DEPT_LABEL[deptById[id]] || 'Quiz'));
                return { label, color, tint: (typeof color === 'string' && color.length === 7) ? `${color}18` : 'rgba(0,0,0,0.05)' };
              }}
              onAllLive={() => setListMode('live')}
            />
          </div>
        </div>
        )}

        {/* The hub row (featured tiles + Top SoT Player + Duel + Category Mastery)
            was dismantled 2026-07-29: Top SoT Player moved into the left
            leaderboards element, Category Mastery + the duel entry moved into the
            right rail, and the featured tiles were removed. */}

        {/* Full-width tool row (owner 2026-07-29): the search box that used to
            live in the blue header now sits HERE, spanning the whole content
            width directly below the three-column daily section, with two
            actions beside it. Report an issue posts to /api/complaints (see
            FeedbackModal); Request a quiz links to the existing /request form.
            It stays bound to the same `search` state as the browse-row field
            below, so typing in either filters the same feed.
            The "Share my day (for credit)" CTA was DELETED here 2026-08-08
            (owner). It sat below every board where nobody found it, and the ask
            now lives where the reason for it does: the phone share strip under
            the community leaderboard in HomeRails, and the header's own credit
            entry on desktop. */}
        <div className="qz-toolrow">
          <div className="qz-toolsearch">
            <Search size={17} aria-hidden="true" />
            <input
              id="qz-hero-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${QUIZ_COUNT.toLocaleString()} quizzes…`}
              aria-label="Search quizzes"
              autoComplete="off"
            />
            {search ? (
              <button type="button" className="qz-toolclear" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>
            ) : null}
          </div>
          <div className="qz-toolbtns">
            <button type="button" className="qz-toolbtn" onClick={() => setFeedbackMode('issue')}>
              <Flag size={15} aria-hidden="true" />Report an issue
            </button>
            <Link href="/request" className="qz-toolbtn qz-toolcta">
              <Sparkles size={15} aria-hidden="true" />Request a quiz
            </Link>
          </div>
        </div>

        {/* browse header + search (in the left column, beside the mastery rail) */}
        <div ref={quizzesRef} className="qz-browserow" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0, flexWrap: 'wrap' }}>
          {(searchResults || listMode || doneFilter !== 'all' || scope !== 'all') && (
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 10, color: T.white }}>
              {!searchResults && (listMode || doneFilter !== 'all' || scope !== 'all') && (
                <button type="button" onClick={() => { setListMode(null); setDoneFilter('all'); setScope('all'); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: T.blue200, fontWeight: 700, fontSize: 14 }}>‹ Back</button>
              )}
              {searchResults ? `Search Results · ${searchResults.length}`
                : doneFilter !== 'all' ? `${STATUS_LABEL[doneFilter]} Quizzes · ${(statusList || []).length}`
                : scope !== 'all' ? `${byKey[scope]?.label} Quizzes`
                : listMode === 'newest' ? `Newest Quizzes · ${newestAll.length}`
                : listMode === 'mostplayed' ? `Most Played · ${mostPlayedAll.length}`
                : 'Live Quiz Feed'}
            </h2>
          )}
          <div className="dd qz-catbtn" onClick={(e) => e.stopPropagation()}>
            <button className="ddbtn" onClick={(e) => { e.stopPropagation(); setDdOpen((o) => !o); }}>
              <span className="dot" style={{ background: scope === 'all' ? C.ink : (byKey[scope]?.c || C.ink) }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>{doneFilter !== 'all' ? STATUS_LABEL[doneFilter] : (scope === 'all' ? 'Category: All' : byKey[scope]?.label)}</span>
              <ChevronDown size={16} style={{ color: C.muted }} />
            </button>
            {ddOpen && (
              <div className="ddmenu" onClick={(e) => e.stopPropagation()}>
                <div className="ddall ddhead"><span>Categories</span><button type="button" className="ddclose" aria-label="Close" onClick={() => setDdOpen(false)}>✕</button></div>
                {me && me.found && (
                  <>
                    <div className="ddall" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: C.soft, padding: '4px 9px 2px' }}>My progress</div>
                    {[['unplayed', 'Unplayed'], ['played', 'Played'], ['completed', 'Completed']].map(([k, lbl]) => (
                      <div key={k} className="dditem ddall" onClick={() => { setDoneFilter(k); setScope('all'); setDdOpen(false); setSearch(''); setListMode(null); }} style={doneFilter === k ? { background: C.accsoft } : undefined}>
                        {k === 'completed' ? <Star size={14} strokeWidth={1.5} fill={T.gold} color={T.goldInk} /> : k === 'played' ? <Check size={14} strokeWidth={2.75} style={{ color: C.live }} /> : <span style={{ width: 13, height: 13, borderRadius: '50%', border: `1.5px solid ${C.soft}`, display: 'inline-block' }} />}
                        <span style={{ flex: 1 }}>{lbl}</span>
                        <span style={{ fontSize: 11, color: C.soft }}>{statusCounts[k]}</span>
                      </div>
                    ))}
                    <div className="ddall" style={{ height: 1, background: C.line, margin: '5px 2px' }} />
                  </>
                )}
                {openChs.length > 0 && (
                  <>
                    <div className="ddall" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: C.soft, padding: '4px 9px 2px' }}>Active challenges</div>
                    {openChs.map((c) => (
                      <Link key={c.id} href={`/quizzes/hub?tab=challenges&ch=${encodeURIComponent(c.id)}`} className="dditem ddall" onClick={() => setDdOpen(false)} style={{ textDecoration: 'none', color: C.ink }}>
                        <Flame size={14} style={{ color: C.accent, flex: 'none' }} />
                        <span style={{ flex: 1 }}>{c.title}</span>
                        <span style={{ fontSize: 11, color: C.soft, whiteSpace: 'nowrap' }}>{c.sub}</span>
                      </Link>
                    ))}
                    <div className="ddall" style={{ height: 1, background: C.line, margin: '5px 2px' }} />
                  </>
                )}
                <div className="dditem ddall" onClick={() => { setScope('all'); setDoneFilter('all'); setDdOpen(false); setSearch(''); setListMode(null); }}>
                  <span className="dot" style={{ background: C.ink }} /><span style={{ flex: 1 }}>All Categories</span>
                  <span style={{ fontSize: 11, color: C.soft }}>{totalCount}</span>
                </div>
                {cats.map((c) => (
                  <div key={c.key} className="dditem" onClick={() => { setScope(c.key); setDoneFilter('all'); setDdOpen(false); setSearch(''); setListMode(null); }}>
                    <span className="dot" style={{ background: c.c }} /><span style={{ flex: 1 }}>{c.label}</span>
                    <span style={{ fontSize: 11, color: C.soft }}>{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="qz-searchwrap" style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.soft }} />
            <input
              id="qz-main-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${QUIZ_COUNT.toLocaleString()} quizzes…`}
              autoComplete="off"
              style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #b8c0cc', borderRadius: 10, font: 'inherit', fontFamily: FONT, fontSize: 13.5, background: T.white, color: C.ink, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {(!searchResults && scope === 'all' && !listMode) && (
            <Link href="/submit?for=quiz" className="qz-submit" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, background: C.cta, color: C.ctaInk, border: `1px solid ${C.cta}`, padding: '8px 14px', borderRadius: 10, fontFamily: FONT, fontWeight: 700, fontSize: 12.5, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Submit a Quiz
            </Link>
          )}
          {curCh && (
            <Link key={curCh.id} href={curCh.href || `/quizzes/hub?tab=challenges&ch=${encodeURIComponent(curCh.id)}`} className="qz-daily" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 9, background: C.accsoft, color: C.accent, border: `1px solid ${T.accentBorder}`, padding: '8px 14px', borderRadius: 10, textDecoration: 'none' }} title={curCh.title}>
              <Flame size={17} style={{ flex: 'none' }} />
              <span style={{ lineHeight: 1.15, display: 'grid' }}>
                {rotation.map((c, i) => (
                  <span key={c.id} style={{ gridArea: '1 / 1', visibility: i === (chSlide % rotation.length) ? 'visible' : 'hidden' }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>{c.title}</span>
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 600, opacity: 0.85 }}>{c.sub || 'Open now'}</span>
                  </span>
                ))}
              </span>
              {rotation.length > 1 ? (
                <span aria-hidden="true" style={{ display: 'flex', gap: 3, flex: 'none', marginLeft: 1 }}>
                  {rotation.map((_, i) => (
                    <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, opacity: i === (chSlide % rotation.length) ? 1 : 0.4 }} />
                  ))}
                </span>
              ) : null}
              <ArrowRight size={15} style={{ flex: 'none' }} />
            </Link>
          )}
        </div>

        {/* lists */}
        {searchResults ? (
          searchResults.length === 0 ? (
            <div className="qz-empty">No quizzes match “{search}”.</div>
          ) : (
            <div className="qflow">
              {searchResults.map((r) => {
                const cc = (DEPT_COLOR[r.dept] || DEPT_COLOR.misc).c;
                return (
                  <Link href={`/quiz/${r.id}`} className="qrow" key={r.id} title={r.rawTitle || r.title}>
                    <span className="dot" style={{ background: cc, alignSelf: 'center' }} />
                    <span className="qtitle">{stripVerb(r.title)}</span><DoneMark id={r.id} />
                    <span className="qmeta" style={{ color: C.soft, fontSize: 10, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>{DEPT_LABEL[r.dept]}</span>
                  </Link>
                );
              })}
            </div>
          )
        ) : doneFilter !== 'all' ? (
          (statusList && statusList.length) ? (
            <div className="qflow">
              {statusList.map((q) => {
                const cc = (DEPT_COLOR[q.dept] || DEPT_COLOR.misc).c;
                return (
                  <Link href={`/quiz/${q.id}`} className="qrow" key={q.id} title={q.rawTitle || q.title}>
                    <span className="dot" style={{ background: cc, alignSelf: 'center' }} />
                    <span className="qtitle">{stripVerb(q.title)}</span><DoneMark id={q.id} />
                    <span className="qmeta" style={{ color: C.soft, fontSize: 10, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>{DEPT_LABEL[q.dept]}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="qz-empty">{doneFilter === 'unplayed' ? 'You have played every quiz. Nice.' : doneFilter === 'completed' ? 'No quizzes aced at 100% yet. Go get a perfect score.' : 'No quizzes in progress yet. Play one to start.'}</div>
          )
        ) : scope !== 'all' ? (
          <CategoryFull cat={byKey[scope]} plays={plays} leader={leader} leaderKey={leaderKey} />
        ) : listMode === 'live' ? (
          <div className="qfull">
            {liveAll.length === 0 ? (
              <div className="qz-empty">No recent plays yet.</div>
            ) : liveAll.map((f, i) => (
              <Link href={playHref(f.quizId)} className="qrow" key={i} title={f.title}>
                <span className="qtitle">{stripVerb(f.title)}</span>
                {f.dayIndex > 0 ? <span className="lf-day" title={f.dayCount > 0 ? `Play ${f.dayIndex} of ${f.dayCount} today` : `Play ${f.dayIndex} today`}>play #{f.dayIndex}</span> : null}
                <span className="qmeta" style={{ gap: 8 }}>
                  <span className="lf-extra scorebadge" style={{ flex: 'none', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 7, fontVariantNumeric: 'tabular-nums', background: f.total && f.score / f.total >= 0.8 ? '#e7f7ed' : '#eef1f6', color: f.total && f.score / f.total >= 0.8 ? T.successDeep : C.soft }}>{f.score}/{f.total}</span>
                  <span className="lf-extra" style={{ color: C.soft }}>{relTime(f.playedAt)}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : listMode ? (
          <div className="qflow">
            {(listMode === 'newest' ? newestAll : mostPlayedAll).map((q) => {
              const cc = (DEPT_COLOR[q.dept] || DEPT_COLOR.misc).c;
              return (
                <Link href={`/quiz/${q.id}`} className="qrow" key={q.id} title={q.rawTitle || q.title}>
                  <span className="dot" style={{ background: cc, alignSelf: 'center' }} />
                  <span className="qtitle">{stripVerb(q.title)}</span><DoneMark id={q.id} />
                  <span className="qmeta">{listMode === 'newest' ? <NewRight q={q} /> : <PlaysRight id={q.id} plays={plays} leader={leader} leaderKey={leaderKey} color={C.accent} />}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="qcols">
            {/* Category Mastery leads the grid (top-left), the slot the owner
                named when it moved out of the right rail. It self-suppresses
                for a viewer with no plays, in which case Most Played leads as
                it did before. */}
            <CategoryMasteryTile
              rows={catMastery}
              onPick={goCat}
              colorFor={(k) => (byKey[k] && byKey[k].c)}
            />
            {/* Last Played / Most Played / Newest each lead with a hero photo
                (added 2026-07-20 per Marshall), so the three activity columns
                match the category columns beside them instead of reading as a
                wall of text. The hero IS the column's own #1 row, pulled out of
                the list below it so nothing shows twice. Daily puzzles resolve to
                their icon banner via heroFor(). */}
            {/* Last Played moved to the top-right rail; the browse-row copy is
                suppressed so it only shows once (owner 2026-07-29). */}
            {false && (() => {
              const nowMs = Date.now();
              const HB = 11;
              const bars = new Array(HB).fill(0);
              for (const p of recent) { const tt = (p && p.playedAt) ? Date.parse(p.playedAt) : 0; if (!tt) continue; const hrsAgo = Math.floor((nowMs - tt) / 3600000); if (hrsAgo >= 0 && hrsAgo < HB) bars[HB - 1 - hrsAgo] += 1; }
              const maxBar = Math.max(1, ...bars);
              const hot = trending;
              const tough = (totals.toughest && resolveTitle(totals.toughest.quizId)) ? totals.toughest : null;
              const fmtT = (v) => { const x = Math.round(v || 0); const h = Math.floor(x / 3600); const m = Math.round((x % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
              const lpRows = lastPlayed.slice(0, 6);
              return (
                <section className="mc-open catcard" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: C.accent, color: T.white, padding: '11px 13px 12px', borderRadius: '8px 8px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, background: T.surfaceAlt, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Play size={13} /></span>
                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: T.white }}>Last Played</h3>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4, fontSize: 9, fontWeight: 800, letterSpacing: '.06em', color: T.successDeep, background: 'rgba(16,185,129,0.16)', borderRadius: 999, padding: '2px 7px' }}><span style={{ width: 5, height: 5, borderRadius: 999, background: C.live }} />LIVE</span>
                      <button type="button" onClick={() => setListMode('live')} style={{ marginLeft: 'auto', color: T.slate, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>View all ›</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 12 }}>
                      <div style={{ flex: 'none' }}>
                        <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em' }}>{(playsToday || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', color: T.muted, marginTop: 4, textTransform: 'uppercase' }}>plays today</div>
                      </div>
                      <div style={{ flex: 'none' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, letterSpacing: '-.01em', paddingBottom: 1 }}>{fmtT(totals.todayTime)}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', color: T.muted, marginTop: 5, textTransform: 'uppercase' }}>played today</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: 2, height: 32 }} title="plays per hour (last 11h)">
                        {bars.map((b, i) => (
                          <span key={i} style={{ width: 5, borderRadius: 2, height: `${Math.max(9, Math.round((b / maxBar) * 100))}%`, background: i >= HB - 2 ? C.live : 'rgba(255,255,255,0.22)' }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: 11, display: 'flex', gap: 6 }}>
                      {hot ? (
                        <a href={playHref(hot.id)} style={{ flex: '1 1 0', minWidth: 0, background: T.surface, border: `1px solid ${T.surfaceAlt}`, borderRadius: 8, padding: '4px 8px', textDecoration: 'none', display: 'block' }}>
                          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.04em', color: '#f4b183', textTransform: 'uppercase', display: 'block' }}>🔥 Hot now</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: T.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', marginTop: 1 }}>{stripVerb(titleById[hot.id] || hot.title)}</span>
                        </a>
                      ) : null}
                      {tough ? (
                        <a href={playHref(tough.quizId)} style={{ flex: '1 1 0', minWidth: 0, background: T.surface, border: `1px solid ${T.surfaceAlt}`, borderRadius: 8, padding: '4px 8px', textDecoration: 'none', display: 'block' }}>
                          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.04em', color: '#9ec5e8', textTransform: 'uppercase', display: 'block' }}>🧠 Toughest · {Math.round((tough.aceRate || 0) * 100)}% ace</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: T.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', marginTop: 1 }}>{stripVerb(resolveTitle(tough.quizId) || '')}</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px 4px' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em', color: C.soft, textTransform: 'uppercase' }}>Recent plays</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: C.soft }}>ring = score · beat = vs all</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {lpRows.map((f, idx) => {
                      const dc = DEPT_COLOR[deptById[f.quizId]] || DEPT_COLOR.misc;
                      const fam = gameFamily(f.quizId);
                      const dgc = fam ? DG_CAT[fam] : null;
                      const catLabel = dgc ? shortCat(dgc.name) : (fam ? 'Daily Puzzle' : (DEPT_LABEL[deptById[f.quizId]] || 'Quiz'));
                      const catColor = dgc ? dgc.color : (fam ? '#5b6472' : dc.c);
                      const frac = f.total ? f.score / f.total : 0;
                      const pctScore = Math.min(100, Math.round(frac * 100));
                      const ringCol = frac >= 0.8 ? '#16a34a' : (frac >= 0.4 ? C.cta : '#dc2626');
                      const good = frac >= 0.8;
                      return (
                        <Link href={playHref(f.quizId)} className={`qrow lp-row${idx >= 3 ? ' lp-mobhide' : ''}`} key={f.quizId} title={f.title} style={{ alignItems: 'center', gap: 10, padding: '0 11px', flex: '1 1 0', minHeight: 0 }}>
                          <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 999, background: `conic-gradient(${ringCol} ${pctScore}%, #eef1f6 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ width: 23, height: 23, borderRadius: 999, background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: C.ink }}>{pctScore}%</span>
                          </span>
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0 }}>
                              <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: C.ink, minWidth: 0 }}>{stripVerb(f.title)}</span>
                              {todayPlays(f.quizId) > 0 ? <span style={{ flex: 'none', fontSize: 9.5, fontWeight: 700, color: C.soft, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>(x{todayPlays(f.quizId).toLocaleString()} today)</span> : null}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                              <span style={{ width: 6, height: 6, borderRadius: 2, background: catColor, flex: 'none' }} />
                              <span style={{ fontSize: 10, color: C.soft, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{catLabel}</span>
                            </span>
                          </span>
                          <span style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: good ? T.successDeep : C.ink, fontVariantNumeric: 'tabular-nums' }}>{f.score}/{f.total}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              {typeof f.pct === 'number' ? <span style={{ fontSize: 9, fontWeight: 800, color: good ? T.successDeep : '#b45309', background: good ? '#e7f7ed' : '#fef6e7', borderRadius: 999, padding: '1px 6px' }}>beat {f.pct}%</span> : null}
                              <span style={{ fontSize: 9.5, color: C.soft, fontWeight: 600 }}>{relTime(f.playedAt)}</span>
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })()}
            {(() => {
              const mpHero = mpTop ? heroFor(mpTop.id, mpTop.dept) : null;
              return (
                <BrowseColumn label="Most Played" eyebrow="Trending" Icon={Flame} color="#c2691c" tint="#f8eee2" filled fill baseCount={5}
                  heroUrl={mpHero ? mpHero.src : undefined} heroPos={mpHero ? mpHero.pos : undefined}
                  heroId={mpTop ? mpTop.id : undefined} heroTitle={mpTop ? mpTop.title : ''}
                  heroPlays={mpTop ? plays(mpTop.id) : 0} heroLeader={mpTop ? leader(mpTop.id) : ''}
                  rows={mostPlayed.filter((q) => !mpTop || q.id !== mpTop.id).map((q) => ({ q, right: <PlaysRight id={q.id} plays={plays} leader={leader} leaderKey={leaderKey} color="#c2691c" hidePlays /> }))} cta="View all" onCta={() => setListMode('mostplayed')} />
              );
            })()}
            {(() => {
              const nwHero = nwTop ? heroFor(nwTop.id, nwTop.dept) : null;
              return (
                <BrowseColumn label="Newest" eyebrow="Just added" Icon={Sparkles} color={C.accent} tint={C.accsoft} filled fill baseCount={5}
                  heroUrl={nwHero ? nwHero.src : undefined} heroPos={nwHero ? nwHero.pos : undefined}
                  heroId={nwTop ? nwTop.id : undefined} heroTitle={nwTop ? nwTop.title : ''}
                  heroPlays={nwTop ? plays(nwTop.id) : 0} heroLeader={nwTop ? leader(nwTop.id) : ''}
                  rows={newestAll.slice(0, 16).filter((q) => !nwTop || q.id !== nwTop.id).map((q) => ({ q, right: <NewRight q={q} /> }))} cta="View all" onCta={() => setListMode('newest')} />
              );
            })()}
            {cats.filter((c) => c.key !== 'school').map((c) => {
              const tilePool = c.key === 'word' ? c.quizzes : c.quizzes.filter((q) => !isDailyGame(q.id));
              // Skip anything an activity column already heroes, so no photo shows
              // twice on the page (Most Played and Geography both landed on the same
              // Europe satellite image before this). Prefer a quiz with a real photo,
              // else the most-played survivor; topQ is the last resort, for the (rare)
              // case where every candidate is already spoken for, since a hero card
              // with no quiz behind it would render titleless and link nowhere.
              const heroQ = catHeroQ[c.key];
              const heroId = heroQ && heroQ.id;
              // Same resolver as the activity columns, so a Word Games hero that
              // lands on a daily puzzle gets its icon banner rather than a dept photo.
              const ch = heroFor(heroId, c.key);
              const heroUrl = ch.src;
              const heroPos = ch.pos;
              const heroTitle = heroId ? (titleById[heroId] || '') : '';
              const exSet = heroId ? new Set([...shownIds, heroId]) : shownIds;
              const rowq = colRows(c, 7, exSet).filter((q) => q.id !== heroId).slice(0, 6);
              return (
                <BrowseColumn key={c.key} label={c.label} eyebrow={`Category \u00b7 ${c.count}`} Icon={c.Icon} color={c.c} tint={c.t}
                  heroUrl={heroUrl} heroPos={heroPos} heroId={heroId} heroTitle={heroTitle}
                  heroPlays={heroId ? plays(heroId) : 0} heroLeader={heroId ? leader(heroId) : ''}
                  rows={rowq.map((q) => ({ q, right: <PlaysRight id={q.id} plays={plays} leader={leader} leaderKey={leaderKey} color={c.c} hidePlays /> }))}
                  cta="View all" onCta={() => setScope(c.key)} />
              );
            })}
            {/* Promo tiles — always the last three (Kids Corner last). */}
            <BrowseColumn label="Business News" eyebrow="Markets" Icon={Newspaper} color="#4d6b8a" tint="#e8eef4"
              heroUrl={PROMO_HERO.business} heroHref="/quizzes/business-news" heroCta="Open" heroTitle="Market-moving business quizzes"
              rows={businessNewsRows.map((q) => ({ q, href: `/quiz/${q.id}`, right: <PlaysRight id={q.id} plays={plays} leader={leader} leaderKey={leaderKey} color="#4d6b8a" hidePlays /> }))}
              cta="View all" ctaHref="/quizzes/business-news" />
            <BrowseColumn label="Standardized Tests" eyebrow="Admissions" Icon={GraduationCap} color="#2f6f9f" tint="#e4eef6"
              heroUrl={PROMO_HERO.tests} heroHref="/exams" heroCta="Start" heroTitle="Where will you get in?"
              rows={EXAM_TILE_ROWS.map((e) => ({ q: { id: e.id, title: e.title, rawTitle: e.title }, href: e.href }))}
              cta="View all" ctaHref="/exams" />
            <BrowseColumn label="Kids Corner" eyebrow="For kids" Icon={Blocks} color="#3ea0e0" tint="#e4f2fc"
              heroUrl={PROMO_HERO.kids} heroHref="/kids" heroCta="Play" heroTitle="Tap-and-play games for kids"
              rows={KIDS_GAMES.slice(0, 6).map((g) => ({ q: { id: g.id, title: g.title, rawTitle: g.title }, href: g.href }))}
              cta="View all" ctaHref="/kids" />
          </div>
        )}
      </div>

      {/* close the dropdown on outside click */}
      {ddOpen && <div className="qz-dd-overlay" onClick={() => setDdOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, flexWrap: 'wrap', margin: '30px 0 8px', fontSize: 12.5, color: '#9fb4d8', fontFamily: FONT }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check className="donemark" size={14} strokeWidth={2.75} style={{ color: C.live }} /> Played</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Star className="donemark" size={14} strokeWidth={1.5} fill={T.gold} color={T.goldInk} /> Completed (100%)</span>
      </div>

      {/* About Mind Loft. Crawlable prose, server-rendered into the initial HTML.
          Before this existed the homepage carried the brand name only in chrome
          (logo, footer heading, copyright, Amazon Associates line) and nowhere in
          a sentence, so for the query "mind loft" Google picked /terms as the page
          this site is ABOUT and never showed the homepage at all. Keep real
          sentences here, and keep the brand name in them. */}
      <section style={{ maxWidth: 940, margin: '10px auto 0', padding: '0 4px', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: '#e8eefc' }}>About Mind Loft</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: '#9fb4d8', fontWeight: 500 }}>
          Mind Loft is a free daily brain games site. Every day at midnight Eastern, Mind Loft publishes a fresh slate of more than sixty puzzles across word, number, logic, trivia, geography and card categories, from a clueless crossword to a killer sudoku to a chess endgame, with a bigger Sunday Edition each week. There is no app to install and no signup required to play.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: '#9fb4d8', fontWeight: 500 }}>
          Alongside the daily games, Mind Loft holds a library of {QUIZ_COUNT.toLocaleString()} timed quizzes covering films, music, sports, geography, business and brands, in formats running from name-them-all and matching to map-clicking and timed multiple choice. Every finished game posts to a daily leaderboard and earns IQ Points toward a running rank.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: '#9fb4d8', fontWeight: 500 }}>
          Mind Loft also publishes consensus <Link href="/lists" style={{ color: '#cddffb', fontWeight: 700 }}>Top 10 Lists</Link>, rankings of the best restaurants, hotels, films, books and products scored from {sourceCount} expert publications and rating platforms rather than from one editor's opinion. <Link href="/about" style={{ color: '#cddffb', fontWeight: 700 }}>Read more about how Mind Loft works</Link>, or browse the <Link href="/quizzes/all" style={{ color: '#cddffb', fontWeight: 700 }}>full quiz index</Link>.
        </p>
      </section>

      <Footer />
    </div>
    </QuizDoneContext.Provider>
  );
}

// Compact play-count badge label: 1..999 shown as-is, 1000..99900 as "1k".."99.9k".
function fmtMult(n) {
  if (!Number.isFinite(n)) return n;
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
}
function fmtAvgTime(s, plays) {
  if (!plays || !Number.isFinite(s) || s <= 0) return '—';
  const avg = Math.round(s / plays);
  const m = Math.floor(avg / 60);
  const sec = avg % 60;
  return m ? `${m}m ${sec}s` : `${sec}s`;
}

// Detailed browse card: title + department dot, then plays / current leader /
// high score / avg time, sourced from /api/quiz/stats + the totals leaders map.
function DetailCard({ q, s, leader, color }) {
  const plays = s ? (s.plays || 0) : 0;
  const high = s ? (s.bestScore || 0) : 0;
  const avgTime = fmtAvgTime(s ? s.totalTime : 0, plays);
  const Stat = ({ label, value }) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: C.soft }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
  return (
    <Link href={`/quiz/${q.id}`} className="qlink" title={q.rawTitle || q.title}>
      <div className="card" style={{ padding: '12px 14px', gap: 10, height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="dot" style={{ background: color, flex: 'none' }} />
          <span style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stripVerb(q.title)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
          <Stat label="Plays" value={plays ? plays.toLocaleString() : '0'} />
          <Stat label="Current Leader" value={leader || '—'} />
          <Stat label="High Score" value={plays ? high.toLocaleString() : '—'} />
          <Stat label="Avg Time" value={avgTime} />
        </div>
      </div>
    </Link>
  );
}

function PlaysRight({ id, plays, leader, leaderKey, color, hidePlays }) {
  const p = plays(id);
  const ld = leader(id);
  return (
    <>
      {!hidePlays && p > 0 ? <span className="score" style={{ fontSize: 11 }}>▶ {p.toLocaleString()}</span> : null}
      {ld ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Crown size={11} style={{ color }} /><PlayerLink userKey={leaderKey ? leaderKey(id) : ''}>{ld}</PlayerLink></span>
      ) : <span style={{ color: C.soft }}>Empty</span>}
    </>
  );
}

function NewRight({ q }) {
  const t = Date.parse(q.publishedAt);
  let when = '';
  if (Number.isFinite(t)) {
    const d = new Date(t);
    when = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return (
    <>
      <span style={{ color: C.soft }}>{when}</span>
    </>
  );
}

// Selected-category compact view: the WHOLE category, leader-only, laid out in
// two columns (single column under ~680px). Header shows the category icon +
// label + total count.
function CategoryFull({ cat, plays, leader, leaderKey }) {
  if (!cat) return null;
  const rows = cat.quizzes.slice()
    .sort((a, b) => plays(b.id) - plays(a.id) || a.title.localeCompare(b.title));
  const { Icon, c: color, t: tint } = cat;
  return (
    <section style={{ minWidth: 0 }}>
      <div className="colhead" style={{ borderColor: C.ink, background: C.accent }}>
        <span style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(255,255,255,0.22)', color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} />
        </span>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: T.white }}>{cat.label}</h3>
        <span className="viewall" style={{ color: T.white }}>{cat.count} quizzes</span>
      </div>
      <div className="qfull">
        {rows.map((q) => (
          <Link href={`/quiz/${q.id}`} className="qrow" key={q.id} title={q.rawTitle || q.title}>
            <span className="qtitle">{stripVerb(q.title)}</span><DoneMark id={q.id} />
            <span className="qmeta"><PlaysRight id={q.id} plays={plays} leader={leader} leaderKey={leaderKey} color={color} hidePlays /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------- Conditional overlay backdrop (navy pill only when the photo needs it) ----------
// Samples the region of a cover-cropped hero photo that sits behind a small white
// text overlay and reports whether bare white text would blend in (light or busy
// area), in which case the caller adds a navy backdrop pill. `region` is
// [x0,y0,x1,y1] in fractions of the tile box; `scrim` (0..1) folds in any dark
// gradient already covering that region; `useParentBox` measures the ref
// element's parent (for refs attached to an inner overlay div). Fails safe: if
// the image cannot be read even via the same-origin optimizer, the pill goes on.
const PILL_REGION_TOPLEFT = [0.02, 0.02, 0.66, 0.18];
const PILL_REGION_FOOTER = [0.03, 0.76, 0.97, 0.98];
function usePillProbe(url, region, scrim, useParentBox) {
  const ref = useRef(null);
  const [pill, setPill] = useState(false);
  useEffect(() => {
    if (!url) { setPill(false); return undefined; }
    let dead = false;
    const raw = ref.current;
    const el = useParentBox && raw && raw.parentElement ? raw.parentElement : raw;
    const box = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    const tw = box && box.width > 10 ? box.width : 340;
    const th = box && box.height > 10 ? box.height : 215;
    const proxied = `/_next/image?url=${encodeURIComponent(url)}&w=384&q=50`;
    const attempt = (src, last) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (dead) return;
        try {
          const W = 96;
          const H = Math.max(24, Math.round((W * th) / tw));
          const c = document.createElement('canvas');
          c.width = W; c.height = H;
          const g = c.getContext('2d', { willReadFrequently: true });
          const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
          g.drawImage(img, (W - img.naturalWidth * sc) / 2, (H - img.naturalHeight * sc) / 2, img.naturalWidth * sc, img.naturalHeight * sc);
          const rx = Math.max(0, Math.floor(region[0] * W));
          const ry = Math.max(0, Math.floor(region[1] * H));
          const rw = Math.min(W - rx, Math.max(1, Math.ceil((region[2] - region[0]) * W)));
          const rh = Math.min(H - ry, Math.max(1, Math.ceil((region[3] - region[1]) * H)));
          const d = g.getImageData(rx, ry, rw, rh).data;
          let sum = 0; let bright = 0; const n = d.length / 4;
          for (let i = 0; i < d.length; i += 4) {
            let L = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
            L = L * (1 - scrim) + 0.05 * scrim;
            sum += L; if (L > 0.6) bright += 1;
          }
          if (!dead) setPill(sum / n > 0.44 || bright / n > 0.3);
        } catch (e) {
          if (!dead) { if (last) setPill(true); else attempt(proxied, true); }
        }
      };
      img.onerror = () => { if (!dead) { if (last) setPill(true); else attempt(proxied, true); } };
      img.src = src;
    };
    attempt(url, false);
    return () => { dead = true; };
  }, [url, scrim]);
  return [ref, pill];
}

// CATEGORY MASTERY TILE (owner, 2026-08-08). Category mastery used to be a link
// in the right rail's footer, pointing at the Stat Hub. It came out to the
// browse row and became a real tile: first cell of .qcols, i.e. the top-left of
// the grid.
//
// It borrows BrowseColumn's `catcard` + `cc-head` shell deliberately, so it
// reads as one of the columns beside it rather than a widget that wandered in,
// and its body is bars instead of quiz-title rows because the thing it reports
// is a proportion per category, not a list of things to play. Each bar is a
// button that filters the feed to that category, the same jump the tile's
// "Stat hub" CTA used to make in the rail.
//
// ONE FACE, QUIZ MASTERY (owner, 2026-08-15). It carried a second face on an 8s
// flip, Daily Mastery, from 2026-08-12. Daily mastery now lives in the Loft's
// You tab, where it sits beside the player's streak and rank rather than in a
// tile that had to be waited out to read either half. So the flip, its dots and
// its hold-on-hover came off and the tile is what its title says it is. The
// `dailyMastery` memo is still built: the Loft reads it.
//
// `rows` is the catMastery memo, [{ key, label, acc }] already sorted, where acc
// is the share of that category's quizzes played. The tile self-suppresses when
// there is nothing in it, in which case Most Played leads the grid as it did
// before this tile existed.
function CategoryMasteryTile({ rows, onPick, colorFor }) {
  if (!rows || !rows.length) return null;
  return (
    <section className="mc-open catcard cmt" style={{ minWidth: 0, '--cc': T.blue, '--cct': '#eef3ff' }}>
      <style>{`
        .qzh .cmt-body{padding:9px 11px 11px;display:flex;flex-direction:column;gap:5px;}
        .qzh .cmt-bar{position:relative;display:flex;align-items:center;gap:8px;width:100%;background:#eef1f6;border:none;border-radius:8px;padding:8px 10px;cursor:pointer;font-family:inherit;overflow:hidden;text-align:left;text-decoration:none;box-sizing:border-box;}
        .qzh .cmt-bar:hover{background:#e6ebf3;}
        .qzh .cmt-bar .mtr{position:absolute;left:0;top:0;bottom:0;background:#dbe6fb;border-radius:8px;pointer-events:none;}
        .qzh .cmt-bar .dot{position:relative;width:7px;height:7px;border-radius:2px;flex:none;}
        .qzh .cmt-bar .nm{position:relative;flex:1;min-width:0;font-size:12px;font-weight:700;color:${C.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .qzh .cmt-bar .p{position:relative;flex:none;font-size:11.5px;font-weight:800;color:#4a4f5c;font-variant-numeric:tabular-nums;}
        .qzh .cmt-note{padding:0 11px 10px;font-size:10.5px;color:${C.soft};font-weight:600;}
      `}</style>
      <div className="colhead cc-head cc-filled" style={{ borderColor: T.ink }}>
        <div className="cc-hgroup">
          <span className="cc-eyebrow">Your progress</span>
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: T.ink }}>Quiz Mastery</h3>
        </div>
        <Link href="/quizzes/hub?tab=player&pview=category" className="viewall vall" style={{ color: T.white, textDecoration: 'none', fontSize: 10, fontWeight: 700 }}>Stat hub</Link>
      </div>
      <div className="cmt-body">
        {rows.slice(0, 8).map((r) => (
          <button type="button" key={r.key} className="cmt-bar" onClick={() => onPick(r.key)}>
            <span className="mtr" style={{ width: `${Math.max(0, Math.min(100, r.acc))}%` }} />
            <span className="dot" style={{ background: (colorFor && colorFor(r.key)) || C.accent }} />
            <span className="nm">{r.label}</span>
            <span className="p">{r.acc}%</span>
          </button>
        ))}
      </div>
      <div className="cmt-note">Share of each category’s quizzes you have played.</div>
    </section>
  );
}

function BrowseColumn({ label, eyebrow, Icon, color, tint, rows, cta, onCta, ctaHref, heroUrl, heroPos, heroId, heroHref, heroCta, heroTitle, heroPlays, heroLeader, filled, fill, baseCount }) {
  const hasHero = !!heroUrl;
  const blueHead = hasHero || filled;
  const headFg = T.ink;
  // The right-edge control is a filled chip inside a card header (direction B),
  // so its ink is white there and the header ink everywhere else.
  const ctaFg = blueHead ? T.white : T.ink;
  const heroLink = heroHref || (heroId ? `/quiz/${heroId}` : '#');
  const base = baseCount || rows.length;
  // A column with its own hero is already the full row height, so the gap-fill
  // measurement below is both unnecessary and wrong for it (it would size to a
  // sibling hero and over-fill). Only heroless `fill` columns need it.
  const fillGap = fill && !hasHero;
  const secRef = useRef(null);
  const headRef = useRef(null);
  const [shown, setShown] = useState(base);
  const [pillRef, statPill] = usePillProbe(hasHero && heroId ? heroUrl : null, PILL_REGION_TOPLEFT, 0.06, false);
  // A filled column (Last Played / Most Played / Newest) that shares a grid row
  // with a taller hero card gets stretched by align-items:stretch, leaving a
  // blank gap below its rows. Fill that gap with more quiz-title rows. We size
  // to the hero sibling's own (fixed) height, NOT this column's stretched
  // height: sizing to self would let a filled column prop up its own grid row
  // and ratchet taller on resize (ResizeObserver feedback). Sizing to the hero
  // means no feedback loop, and the column collapses back to `base` whenever it
  // no longer sits beside a hero (e.g. after resizing 2-col -> 3-col). Works on
  // every viewport, desktop included.
  useEffect(() => {
    if (!fillGap || typeof window === 'undefined') return;
    const sec = secRef.current; if (!sec) return;
    const measure = () => {
      const grid = sec.parentElement; if (!grid) return;
      const myTop = sec.getBoundingClientRect().top;
      let rowHeroH = 0;
      for (const sib of grid.children) {
        if (sib === sec) continue;
        const r = sib.getBoundingClientRect();
        if (Math.abs(r.top - myTop) > 2) continue;            // same grid row only
        if (sib.querySelector('.cc-hero')) rowHeroH = Math.max(rowHeroH, r.height);
      }
      let n = base;
      if (rowHeroH > 0) {
        const headH = headRef.current ? headRef.current.offsetHeight : 44;
        const firstRow = sec.querySelector('.qrow');
        const rowH = firstRow ? firstRow.getBoundingClientRect().height : 34;
        n = Math.max(base, Math.floor((rowHeroH - headH) / Math.max(1, rowH)));
      }
      setShown(Math.min(rows.length, n));
    };
    measure();
    const grid = sec.parentElement;
    const ro = new ResizeObserver(measure);
    ro.observe(sec);
    if (grid) ro.observe(grid);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [fillGap, base, rows.length]);
  // A hero column is a fixed card: hero + 6 rows, matching the category columns.
  // (Without this the three activity columns, which pass 15+ rows for the
  // gap-fill they no longer do, would render every one of them.)
  const shownRows = fillGap ? rows.slice(0, shown) : (hasHero ? rows.slice(0, 6) : rows);
  return (
    <section ref={secRef} className={`mc-open${(hasHero || filled) ? ' catcard' : ''}`} style={{ minWidth: 0, '--cc': color, '--cct': tint }}>
      {hasHero ? (
        <Link href={heroLink} className="cc-hero" style={{ backgroundImage: `url("${heroUrl}")`, backgroundPosition: heroPos || 'center' }} title={heroTitle}>
          <span className="cc-ov" ref={pillRef} />
          {heroId ? <span className={`cc-stat${statPill ? ' pill' : ''}`}>{heroPlays > 0 ? `${heroPlays.toLocaleString()} plays` : 'New quiz'}{heroLeader ? <><span aria-hidden="true"> · </span><Crown size={11} style={{ color: T.goldInk, flex: 'none' }} /> {heroLeader}</> : null}</span> : null}
          <div className="cc-btm">
            <span className="cc-htitle">{stripVerb(heroTitle)}</span>
            <span className="cc-play">{heroCta || 'Play'} <ArrowRight size={13} style={{ verticalAlign: -2 }} /></span>
          </div>
        </Link>
      ) : null}
      <div ref={headRef} className={`colhead${blueHead ? ' cc-head' : ''}${filled ? ' cc-filled' : ''}`} style={{ borderColor: T.ink }}>
        {blueHead ? null : (
          <span className="colicon" style={{ width: 24, height: 24, borderRadius: 7, background: tint, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon size={14} />
          </span>
        )}
        <div className="cc-hgroup">
          {eyebrow ? <span className="cc-eyebrow">{eyebrow}</span> : null}
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: headFg }}>{label}</h3>
        </div>
        {ctaHref
          ? <Link href={ctaHref} className="viewall vall" style={{ color: ctaFg, textDecoration: 'none', fontSize: 10, fontWeight: 700 }}>{cta}</Link>
          : onCta
          ? <button type="button" onClick={(e) => { e.stopPropagation(); onCta(); }} className="viewall vall" style={{ color: ctaFg, background: blueHead ? undefined : 'none', border: 'none', padding: blueHead ? undefined : 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 700 }}>{cta}</button>
          : <span className="viewall vall" style={{ color: ctaFg }}>{cta}</span>}
      </div>
      {shownRows.map(({ q, right, href }) => (
        <Link href={href || `/quiz/${q.id}`} className="qrow" key={q.id} title={q.rawTitle || q.title}>
          <span className="qtitle">{stripVerb(q.title)}</span><DoneMark id={q.id} />
          <span className="qmeta">{right}</span>
        </Link>
      ))}
    </section>
  );
}
