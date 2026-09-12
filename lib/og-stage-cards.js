// EVERY SHARE CARD ON THE SITE, AS DATA.
//
// lib/og-stage-card.js is the renderer; this file is the roster. A surface here
// is a handful of strings plus a category, and the category is the whole of its
// visual identity: the hue for the band, the wordmark, the tile rule and the
// footer instruction all come off it, and a daily game's tile art comes off its
// glyph. Nothing in this file draws anything.
//
// The per-game cards read lib/daily-games.js directly, so a new game gets a
// share card the moment its row lands there. Do not add a per-game entry below.

import {
  renderStageCard, stageCardElement, glyphURI, markURI, mono, T, Row, Col, clamp, D, size, contentType,
} from './og-stage-card.js';
import { DAILY_GAMES, DAILY_GAME_MAP } from './daily-games.js';
import { gameColor, categoryColor } from './category-ramp.js';
import { SHARE_HOST } from './site.js';

export { size, contentType };

const HOST = SHARE_HOST;

// -- A DAILY GAME -----------------------------------------------------------
// name, cat, tag and how all come off the game's row. `tag` is the short shelf
// label ("A clueless crossword") and `how` is the full sentence; a card has
// room for the sentence, so it takes `how` and falls back to `tag`.
// THE SUB LINE. `how` is the full how-to-play copy and `tag` is the short shelf
// label ("A clueless crossword"). The card has room for about three lines at
// 29px, roughly 150 characters.
const SUB_MAX = 150;

// Trim to whole sentences rather than to a character count. Sweep's `how` runs
// three sentences and used to ellipse mid-word, which reads as a bug; dropping
// it to `tag` instead gave "No bottom edge", three words under a 92px name.
// Taking as many whole sentences as fit is right both times.
function fitSentences(text, max) {
  const t = String(text || '').trim();
  if (!t) return '';
  if (t.length <= max) return t;
  const parts = t.split(/(?<=\.)\s+/);
  let out = '';
  for (let i = 0; i < parts.length; i += 1) {
    const next = out ? out + ' ' + parts[i] : parts[i];
    if (next.length > max) break;
    out = next;
  }
  return out;
}

export function gameCardOpts(key) {
  const g = DAILY_GAME_MAP[key];
  if (!g) return null;
  const how = g.how || '';
  return {
    layout: 'A',
    hue: gameColor(key),
    glyph: key,
    eyebrow: g.cat + ' · Daily puzzle',
    headline: g.name,
    sub: fitSentences(how, SUB_MAX) || g.tag || how,
    url: HOST + (g.href || '/' + key),
    cta: 'Play free',
  };
}

export function renderGameCard(key) {
  const o = gameCardOpts(key);
  if (!o) throw new Error('renderGameCard: no daily game with key ' + key);
  return renderStageCard(o);
}

export function gameCardAlt(key) {
  const g = DAILY_GAME_MAP[key];
  if (!g) return 'Mind Loft';
  return g.name + ' — ' + (g.tag || 'a daily puzzle') + ', free every day from Mind Loft';
}

// Every key the bake script should draw.
export function bakeableGameKeys() {
  return DAILY_GAMES.map(function (g) { return g.key; });
}

// -- THE SITE-LEVEL CARDS ---------------------------------------------------
// No glyph: the headline takes the full width and the mark in the cap is the
// only art. The root card carries the tagline alone.
export function renderBrandCard() {
  return renderStageCard({
    layout: 'A',
    hue: categoryColor('Word'),
    eyebrow: 'Mind Loft',
    headline: 'Sharpen your mind.',
    sub: 'A new word, number and logic puzzle every morning, plus timed quizzes across film, music, sport and beyond.',
    url: HOST,
    cta: 'Free · no ads',
  });
}

export function renderDailyCard() {
  return renderStageCard({
    layout: 'A',
    hue: categoryColor('Numbers'),
    eyebrow: 'Daily puzzles',
    headline: DAILY_GAMES.length + ' a day.',
    sub: 'Word, Numbers, Logic, Geography, Cards, Arcade and End Game. One slate, one shot each, and everyone plays the same board.',
    url: HOST + '/daily',
    cta: 'Play today',
  });
}

// -- MIND LOFT KIDS ----------------------------------------------------------
// The /kids hub and all seven kids dailies share this card: the pitch is the
// THINKING (counting, sorting, spotting patterns), never the score, because
// there is no score. The hue is the Logic step so it does not read as a daily.
export function renderKidsCard() {
  return renderStageCard({
    layout: 'A',
    hue: categoryColor('Logic'),
    glyph: 'sixes',
    eyebrow: 'Mind Loft Kids',
    headline: 'Little puzzles, big thinking.',
    sub: 'Seven gentle puzzles a day that get kids counting, sorting, spotting patterns and reasoning things out. No sign-up, no ads, nothing counts against them.',
    url: HOST + '/kids',
    cta: 'Free · for ages 5 and up',
  });
}

export function renderQuizzesCard(count) {
  return renderStageCard({
    layout: 'A',
    hue: categoryColor('Trivia'),
    glyph: 'listed',
    eyebrow: 'The quizzes',
    headline: 'Beat the clock.',
    sub: (count ? count + ' timed quizzes' : 'Timed quizzes') + ' across film, music, sport and beyond. Name them, match them, map them.',
    url: HOST + '/quizzes',
    cta: 'Top the board',
  });
}

export function renderListsBrandCard() {
  return renderStageCard({
    layout: 'A',
    hue: categoryColor('Cards'),
    eyebrow: 'Source of Truths',
    headline: 'Where the experts agree.',
    sub: 'Top 10 lists built from expert and reader consensus, for everything worth knowing.',
    url: HOST + '/lists',
    cta: 'Browse the lists',
  });
}

// -- A QUIZ -----------------------------------------------------------------
export function renderQuizCard(o) {
  return renderStageCard({
    layout: 'A',
    hue: categoryColor('Trivia'),
    glyph: 'listed',
    eyebrow: (o.category || 'Quiz') + ' · Quiz',
    headline: clamp(o.title, 42),
    big: 66,
    sub: o.blurb || 'A timed quiz from Mind Loft. Beat the clock, then the leaderboard.',
    url: HOST + '/quiz/' + o.id,
    cta: 'Play free',
  });
}

// Posted AS AN IMAGE with no link (better reach on X), so the URL is printed.
export function renderQuizPromoCard(o) {
  return renderStageCard({
    layout: 'A',
    hue: categoryColor('Trivia'),
    glyph: 'listed',
    eyebrow: (o.category || 'Quiz') + ' · Quiz',
    headline: clamp(o.title, 40),
    big: 68,
    sub: o.blurb || 'Beat the clock, then the leaderboard.',
    url: HOST + '/quiz/' + o.id,
    cta: 'Free · no ads',
  });
}

// -- A RESULT ---------------------------------------------------------------
export function renderQuizResultCard(o) {
  const pct = Math.max(0, Math.min(100, Number(o.pct) || 0));
  const beat = pct > 0 && pct < 100
    ? 'Top ' + (100 - pct) + '% of players. Can you beat it?'
    : 'Can you beat it?';
  return renderStageCard({
    layout: 'B',
    hue: categoryColor('Trivia'),
    eyebrow: (o.category || 'Quiz') + ' · Result',
    headline: clamp(o.title, 56),
    sub: beat,
    figure: o.score + '/' + o.total,
    figSize: 82,
    figLabel: 'Score',
    stats: o.stats || [],
    url: HOST + '/quiz/' + o.id,
    cta: 'Beat it',
  });
}

// -- A PLAYER ---------------------------------------------------------------
// A profile has no category of its own, so it wears its CROWN CATEGORY: the one
// the player ranks highest in. Two profiles then look unlike each other, and
// the colour is earned rather than assigned. A player with no daily play falls
// back to the brand step. Shared with the profile PAGE via lib/crown.js, so the
// card and the page it links to are always the same colour.
export function renderPlayerCard(o) {
  const stats = [];
  if (o.xp != null) stats.push([Number(o.xp).toLocaleString(), 'IQ points']);
  if (o.trophies != null) stats.push([o.trophies + '/' + o.trophyTotal, 'trophies']);
  if (o.daysPlayed != null) stats.push([Number(o.daysPlayed).toLocaleString(), 'days played']);
  if (o.correct != null) stats.push([Number(o.correct).toLocaleString(), 'correct']);
  const detail = [o.tier, o.level != null ? 'Level ' + o.level : null, o.crown]
    .filter(Boolean).join(' · ');
  return renderStageCard({
    layout: 'B',
    hue: o.hue || D.brand,
    eyebrow: 'Player profile',
    headline: clamp(o.name, 24),
    sub: detail || 'A Mind Loft player',
    figure: o.rank ? '#' + o.rank : '—',
    figSize: 100,
    figLabel: o.totalPlayers ? 'of ' + Number(o.totalPlayers).toLocaleString() + ' players' : 'unranked',
    stats: stats.slice(0, 4),
    url: HOST + '/player/' + encodeURIComponent(o.name),
    cta: 'Out-rank me',
  });
}

// -- A LIST -----------------------------------------------------------------
export function renderListCard(o) {
  const rows = (o.previewItems || []).map(function (name, i) {
    return {
      pos: o.isUnranked ? '·' : String((o.startPosition || 10) - i).padStart(2, '0'),
      name,
      right: '',
    };
  });
  return renderStageCard({
    layout: 'C',
    hue: categoryColor('Cards'),
    eyebrow: clamp(o.category || 'Lists', 26) + ' · ' + (o.isUnranked ? 'The set' : 'Top 10'),
    headline: o.title,
    rows,
    url: HOST + '/list/' + o.id,
    cta: o.isUnranked ? 'See the full set' : 'See 5 through 1',
  });
}

// -- THE REFERRAL CONTEST ---------------------------------------------------
// Layout C: the three prizes are a ranked list, which is what they are.
export function renderContestCard(o) {
  const rows = (o.prizes || []).slice(0, 3).map(function (amt, i) {
    return { pos: ['1st', '2nd', '3rd'][i], name: '$' + amt, right: '' };
  });
  return renderStageCard({
    layout: 'C',
    hue: categoryColor('End Game'),
    eyebrow: o.daysLeft != null ? o.daysLeft + ' days left' : 'Referral contest',
    headline: 'Win ' + o.prizeLabel + '.',
    rows,
    url: HOST + '/quizzes/contest',
    cta: o.deadlineLabel ? 'Free · ends ' + o.deadlineLabel : 'Free to enter',
  });
}

// -- A CIRCUIT --------------------------------------------------------------
// Takes the props gauntletCardProps() in app/circuits/[id]/gauntlet-card.js
// already builds, unchanged: that file owns the bank map and the counted
// figures, and its whole reason for existing is that two routes read one map.
// A bank keeps its OWN colour here — b.color is the circuit's ramp slot, which
// is what the gate paints each bank in — so the card and the run agree.
export function renderGauntletCard(o) {
  const all = o.banks || [];
  const rows = all.slice(0, 4).map(function (b, i) {
    return {
      pos: String(i + 1).padStart(2, '0'),
      name: b.name,
      right: b.asked ? b.asked + ' asked' : '',
      hue: b.color || (b.key ? gameColor(b.key) : null),
    };
  });
  // The list shows four; the headline states the whole run, so a five-bank
  // circuit never looks like a four-bank one.
  const headline = [o.line1, o.line2].filter(Boolean).join(' ')
    || (all.length + ' quizzes. One life each.');
  return renderStageCard({
    layout: 'C',
    hue: categoryColor('Trivia'),
    eyebrow: (o.name || 'Circuit') + ' · One life each',
    headline,
    rows,
    url: HOST + '/circuits/' + (o.id || ''),
    cta: o.cta || 'Twenty seconds a question',
  });
}

// Re-exported so a route can compose its own body on the same chrome.
export { renderStageCard, stageCardElement, glyphURI, markURI, mono, T, Row, Col, clamp, D };
