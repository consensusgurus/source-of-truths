'use client';

// DailyEndCard — the shared end-of-game result popup for every daily puzzle
// (Crux, Emcee, Garble, Links, Span, Dating, Tally, Suds, Circa, Extra,
// Carve, Stet, Outwit, Tuck, Alibi, Cipher, Ping, Warmer, Jesters, Sworn,
// Outrank, Axiom, Hearsay). One component, used by all daily clients.
//
// Layout, top to bottom (owner retention rework 2026-08-01):
//   1. header — one line: the finish mark + the finish state ("Completed!",
//      or "Not perfect." for a puzzle finished short of the win, "Defeated."
//      for an End Game loss, "Incomplete." when the player never reached the
//      end)
//      + the score node on the left, and the player's
//      identity chip (profile link, or the sign-up CTA for a guest) hard right,
//      padded clear of the modal's close button. Then the answer. The share
//      button is NOT here; it moved below the tiles;
//   2. IQ hero + rank tiles — the hero sits IMMEDIATELY under the title, so the
//      points earned are the first thing a finisher reads, and carries deliberate
//      visual weight (2px border, tinted gradient, soft shadow) so it outranks
//      the share bar below. It leads with the IQ gain this game paid (the card's
//      headline number), with the day's running total, the player's total IQ and
//      their global IQ rank beside it, and expands to their slot in the IQ
//      ranking. Below it, three rank tiles —
//      "Today" (today's drop of this game), "All Time" (this game's
//      cumulative points across every drop), and "All Games" (the combined
//      board) — big centered numerals with the field size spelled out, a
//      colored cap across the top and a gold/silver/bronze tint on a top-3
//      finish, each expanding in place to that board's top 10. The internal view keys stay
//      'today' / 'alltime' / 'combined' (owner redesign 2026-07-31).
//      The TODAY expansion is a full results table — rank / player / score /
//      time / misses / points — not a single value column, because a player's
//      first question on seeing their rank is why the people above them beat
//      them, and score-and-time is the answer (owner, 2026-08-01). It matches
//      the on-page DailyBoardPanel's today board column for column, and where
//      the six columns do not fit it scrolls sideways inside its own box
//      rather than dropping the middle columns. The wrong-answer column is
//      headed by the GAME'S OWN word (`miss` in lib/daily-games.js: Parker
//      counts moves, Garble misses, Axiom tests), and is dropped entirely on
//      the games that always post 0 there (owner, 2026-08-01).
//   3. guest-only claim banner (unregistered players only) — sits directly
//      under the rank tiles, loudly (pulsing ring + sweeping sheen + blinking
//      CTA) telling a guest their points and ranks are unclaimed. Moved above
//      the share bar 2026-08-01 (owner);
//   4. share / challenge bar — a full-width bar under the claim banner reading "Share
//      Result or Challenge a Friend for Site Credit", which fires the caller's
//      share handler and so opens the shared ShareCreditPop (ref-stamped link
//      for a registered sharer, sign-up view for a guest);
//      the archive control is the third rank tile, expanding to a month
//      calendar of this game's past drops;
//   4b. quick replay bar — a quiet white bar directly under the share bar,
//      rendered only when the caller passes onReplay. Moved up out of the
//      footer 2026-08-04 (owner) because some games invite an immediate
//      second run and the footer sits below the whole game grid;
//   5. a two-card row — "Up next" (25s auto-advance, counted down in a chip
//      beside the game name since 2026-08-04) and "Easiest leaderboard"
//      (the thinnest field, a podium is easiest there). Both cards lead with the
//      game's own icon in its brand accent, then its family and its one-liner.
//      The DAILY_GAMES `blurb` sentence was dropped 2026-08-04 (owner) to keep
//      the pair compact. Deliberately no play counts or field sizes: these cards
//      sell the next game, not numbers (owner 2026-08-01);
//   6. "More of today's games" — the still-to-play games grouped by family;
//   7. a bottom actions row — Leaderboards, Play a past <Game>, and a right-hand
//      "Daily puzzle landing page" link. (Try again moved to 4b, 2026-08-04.)
//
// Each client passes only its result strings + handlers (unchanged API):
//   <DailyEndCard modal self="tuck" completed
//     score={<>{finalScore} pts &middot; benchmark {BENCH}</>}
//     onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
//     onReplay={resetGame} onClose={() => setJustWon(false)} />
// `completed` (default = `won`) says the player REACHED THE END of the puzzle,
// which turns a non-win from "Incomplete." into "Not perfect."; pass it on every
// game whose `won` really means perfect-or-target. `defeat` forces "Defeated." and
// defaults on for the End Game titles. Pass a
// clean `score` node ONLY for variable-score games (Tuck/Outrank/Outwit) so every
// other game just reads its title with score/time/accuracy left to the board.
// `headline`/`subline` are deprecated and no longer rendered (kept for compat).
// The finish accent comes from `self` via GAME_META. To add a game: add it to
// GAME_META (accent) and to DAILY_GAMES (family + tile copy).

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Grid2x2,
  Type, Clock, Globe, Hash, Share2, BarChart3, RotateCcw, RefreshCw, Check, X,
  Trophy, Link2, Flag, CalendarCheck, Scale, Grid3x3, LayoutGrid, Newspaper, FlagTriangleRight,
  Brain, Pencil, Users, ArrowRight, Puzzle, Blocks, Fingerprint, KeyRound, Thermometer, Crown, ListOrdered,
  FlaskConical, Ear, CircleDot, Disc, Car, Swords, Calculator, MoveUp, Table2, Trophy as TrophyFin, Image as ImageIcon, Route,
  Club, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, UserPlus, Gavel, Shield,
  Flame, Frame, Contrast, Layers, FileText, Waypoints, Anchor, PenLine, Gamepad2, Zap, Sigma, Sandwich,
  ArrowLeftRight, Gem, Map as MapIcon, Divide, TableProperties, TrendingUp, Milestone, CornerUpRight,
  Clapperboard, Quote, ZoomIn, Axe, Truck, Rows3, Boxes, MoveDiagonal,
} from 'lucide-react';
import ReportIssue from './ReportIssue';
import MindLoftMark from './MindLoftMark';
import { notifyTrophies } from './TrophyPop';
import { fetchDailyMe, dailyMeQuery, invalidateDailyMe } from './dailyMeClient';
import { isRetiredDaily, DAILY_GAME_MAP, dailyAttemptRule, attemptsMode, isArcade } from '@/lib/daily-games';
import { circuitKeysFor, circuitHref, circuitName, readRunParam, runSummaryHref, isMarquee } from '@/lib/circuits';
import { T } from '@/lib/theme';
import { CONTEST, COPY, contestIsLive } from '@/lib/contest';

const RUST = T.danger;
const AMBER = '#b45309';

// Titles where a loss is a defeat against a live opponent, not a puzzle the
// player walked away from, so the card reads "Defeated." rather than
// "Incomplete." (owner, 2026-08-02). This set is keyed by GAME, not by category,
// which is why Taire stays in it after moving to Cards on 2026-08-04. Babel and
// Hands is scored against par and Babel against its solver benchmark, so falling
// short there is "Not perfect." like any other target game, and both are
// deliberately NOT in this set.
const DEFEAT_GAMES = new Set(['four', 'mate', 'check', 'taire', 'chain', 'turn', 'defend', 'queen']);

// LAUNCH WINDOW (owner ruling 2026-07-18): brand-new daily puzzles lead the
// "still to play" list for their first FOUR days so players actually meet
// them; after `until` (ET, inclusive) the canonical order resumes. Keep in
// sync with the same pin in app/api/quiz/daily-order/route.js.
const LAUNCH_PIN = { keys: ['diag', 'junkyard', 'slot', 'impound', 'whittle', 'finesse', 'sums', 'hinge', 'blitzed', 'thread', 'focus', 'script', 'quotes', 'knight', 'flank', 'biz', 'encore', 'calc', 'sport', 'atlas', 'towers', 'mercury', 'polka', 'queen', 'shoe', 'niche', 'sixes', 'plot', 'barter', 'sando', 'cages', 'quilt', 'defend', 'blitz', 'docket', 'sweep', 'chomp', 'blocks', 'anon', 'deep', 'paths', 'redact', 'strata', 'suffice', 'turn', 'chain', 'hands', 'glyph', 'babel'], until: '2026-10-15' };
function etTodayEC() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const INK = T.ink;
const SLATE = T.slate;
const FADED = T.muted;
const BORD = '#e7eaf1';
const NAVY = T.accent;
const GOLD = T.gold;
const BLUE = T.blue;

// ---- per-game finish accent (keyed by self) --------------------------------
// accent = the game's brand color; used for the primary Share button.
export const GAME_META = {
  crux:   { accent: T.blue, badgeBg: T.blue, badgeInk: T.white, Fin: LayoutGrid },
  emcee:  { accent: '#c026d3', badgeBg: '#c026d3', badgeInk: T.white, Fin: Type },
  garble: { accent: '#b7791f', badgeBg: GOLD, badgeInk: '#5c4a06', Fin: Trophy },
  links:  { accent: '#166534', badgeBg: '#166534', badgeInk: T.white, Fin: Link2 },
  span:   { accent: '#9d174d', badgeBg: '#9d174d', badgeInk: T.white, Fin: Flag },
  dating: { accent: '#6d28d9', badgeBg: '#6d28d9', badgeInk: T.white, Fin: CalendarCheck },
  circa:  { accent: '#0e7490', badgeBg: '#0e7490', badgeInk: T.white, Fin: Clock },
  extra:  { accent: '#b91c1c', badgeBg: '#b91c1c', badgeInk: T.white, Fin: Newspaper },
  tally:  { accent: T.successDeep, badgeBg: T.successDeep, badgeInk: T.white, Fin: Scale },
  suds:   { accent: '#ea580c', badgeBg: '#ea580c', badgeInk: T.white, Fin: Grid3x3 },
  quilt:  { accent: '#a21caf', badgeBg: '#a21caf', badgeInk: T.white, Fin: Puzzle },
  cages:  { accent: '#6b21a8', badgeBg: '#6b21a8', badgeInk: T.white, Fin: Sigma },
  sando:  { accent: '#15616b', badgeBg: '#15616b', badgeInk: T.white, Fin: Sandwich },
  carve:  { accent: '#7c3aed', badgeBg: '#7c3aed', badgeInk: T.white, Fin: LayoutGrid },
  stet:   { accent: '#0369a1', badgeBg: '#0369a1', badgeInk: T.white, Fin: Pencil },
  outwit: { accent: '#1f2937', badgeBg: '#1f2937', badgeInk: T.gold, Fin: Users },
  tuck:   { accent: '#92400e', badgeBg: '#92400e', badgeInk: T.white, Fin: Puzzle },
  alibi:  { accent: '#8b1e2d', badgeBg: '#8b1e2d', badgeInk: T.white, Fin: Fingerprint },
  cipher: { accent: '#0f766e', badgeBg: '#0f766e', badgeInk: T.white, Fin: KeyRound },
  ping:   { accent: '#0284c7', badgeBg: '#0284c7', badgeInk: T.white, Fin: Globe },
  warmer: { accent: '#dc2626', badgeBg: '#dc2626', badgeInk: T.white, Fin: Thermometer },
  jester: { accent: '#7c3aed', badgeBg: '#7c3aed', badgeInk: T.white, Fin: Crown },
  sworn:  { accent: '#be185d', badgeBg: '#be185d', badgeInk: T.white, Fin: Scale },
  outrank: { accent: '#4338ca', badgeBg: '#4338ca', badgeInk: T.white, Fin: ListOrdered },
  shards: { accent: '#0d9488', badgeBg: '#0d9488', badgeInk: T.white, Fin: Blocks },
  axiom:  { accent: '#0f766e', badgeBg: '#0f766e', badgeInk: T.white, Fin: FlaskConical },
  hearsay: { accent: '#7c2d92', badgeBg: '#7c2d92', badgeInk: T.white, Fin: Ear },
  venn:   { accent: '#b45309', badgeBg: '#b45309', badgeInk: T.white, Fin: CircleDot },
  stands:  { accent: T.blueDeep, badgeBg: T.blueDeep, badgeInk: T.white, Fin: Table2 },
  bracket: { accent: '#c2410c', badgeBg: '#c2410c', badgeInk: T.white, Fin: TrophyFin },
  pricer: { accent: '#15803d', badgeBg: '#15803d', badgeInk: T.white, Fin: TrophyFin },
  lode: { accent: T.goldInk, badgeBg: T.goldInk, badgeInk: T.white, Fin: TrophyFin },
  etch: { accent: '#4d7c0f', badgeBg: '#4d7c0f', badgeInk: T.white, Fin: ImageIcon },
  glyph: { accent: '#334155', badgeBg: '#334155', badgeInk: T.white, Fin: KeyRound },
  hedge: { accent: '#0891b2', badgeBg: '#0891b2', badgeInk: T.white, Fin: Route },
  listed: { accent: '#86198f', badgeBg: '#86198f', badgeInk: T.white, Fin: BarChart3 },
  mate: { accent: '#6b4423', badgeBg: '#6b4423', badgeInk: T.white, Fin: Crown },
  four: { accent: T.blueDark, badgeBg: T.blueDark, badgeInk: T.white, Fin: Disc },
  park: { accent: '#7c5c2e', badgeBg: '#7c5c2e', badgeInk: T.white, Fin: Car },
  impound: { accent: '#6b4a1f', badgeBg: '#6b4a1f', badgeInk: T.white, Fin: Truck },
  junkyard: { accent: '#5c3a16', badgeBg: '#5c3a16', badgeInk: T.white, Fin: Boxes },
  check: { accent: '#166e5a', badgeBg: '#166e5a', badgeInk: T.white, Fin: Swords },
  rung: { accent: '#155e75', badgeBg: '#155e75', badgeInk: T.white, Fin: MoveUp },
  crunch: { accent: '#b45309', badgeBg: '#b45309', badgeInk: T.white, Fin: Calculator },
  taire: { accent: '#1d6b4f', badgeBg: '#1d6b4f', badgeInk: T.white, Fin: Club },
  finesse: { accent: '#4c1d95', badgeBg: '#4c1d95', badgeInk: T.white, Fin: Layers },
  fib: { accent: '#4c1d95', badgeBg: '#4c1d95', badgeInk: T.white, Fin: Scale },
  streak: { accent: '#e11d48', badgeBg: '#e11d48', badgeInk: T.white, Fin: Flame },
  feud: { accent: '#9f1239', badgeBg: '#9f1239', badgeInk: T.white, Fin: BarChart3 },
  babel: { accent: '#14532d', badgeBg: '#14532d', badgeInk: T.white, Fin: Blocks },
  chain: { accent: '#4a044e', badgeBg: '#4a044e', badgeInk: T.white, Fin: Frame },
  turn: { accent: '#226218', badgeBg: '#226218', badgeInk: T.white, Fin: Contrast },
  suffice: { accent: '#4338ca', badgeBg: '#4338ca', badgeInk: T.white, Fin: CheckCircle2 },
  docket: { accent: '#5b2333', badgeBg: '#5b2333', badgeInk: T.white, Fin: Gavel },
  plot: { accent: '#78350f', badgeBg: '#78350f', badgeInk: T.white, Fin: LayoutGrid },
  sixes:  { accent: '#1d4ed8', badgeBg: '#1d4ed8', badgeInk: T.white, Fin: Grid2x2 },
  niche:  { accent: '#115e59', badgeBg: '#115e59', badgeInk: T.white, Fin: LayoutGrid },
  shoe:  { accent: '#0c4a6e', badgeBg: '#0c4a6e', badgeInk: T.white, Fin: Layers },
  queen: { accent: '#a16207', badgeBg: '#a16207', badgeInk: T.white, Fin: Gem },
  towers: { accent: '#075985', badgeBg: '#075985', badgeInk: T.white, Fin: Building2 },
  mercury: { accent: '#991b1b', badgeBg: '#991b1b', badgeInk: T.white, Fin: Thermometer },
  polka: { accent: '#16a34a', badgeBg: '#16a34a', badgeInk: T.white, Fin: CircleDot },
  diag: { accent: '#0e7490', badgeBg: '#0e7490', badgeInk: T.white, Fin: MoveDiagonal },
  whittle: { accent: '#854d0e', badgeBg: '#854d0e', badgeInk: T.white, Fin: Axe },
  knight: { accent: '#3730a3', badgeBg: '#3730a3', badgeInk: T.white, Fin: CornerUpRight },
  atlas: { accent: '#047857', badgeBg: '#047857', badgeInk: T.white, Fin: MapIcon },
  sport: { accent: '#7c2d12', badgeBg: '#7c2d12', badgeInk: T.white, Fin: Trophy },
  calc: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Divide },
  encore: { accent: '#1d4ed8', badgeBg: '#1d4ed8', badgeInk: T.white, Fin: TableProperties },
  biz: { accent: '#0f5132', badgeBg: '#0f5132', badgeInk: T.white, Fin: TrendingUp },
  flank: { accent: '#3f6212', badgeBg: '#3f6212', badgeInk: T.white, Fin: Milestone },
  script: { accent: '#4a1d6b', badgeBg: '#4a1d6b', badgeInk: T.white, Fin: Clapperboard },
  quotes: { accent: '#3d4f7c', badgeBg: '#3d4f7c', badgeInk: T.white, Fin: Quote },
  focus: { accent: '#8a4b08', badgeBg: '#8a4b08', badgeInk: T.white, Fin: ZoomIn },
  thread: { accent: '#8b2c6b', badgeBg: '#8b2c6b', badgeInk: T.white, Fin: Waypoints },
  slot: { accent: '#4a5d23', badgeBg: '#4a5d23', badgeInk: T.white, Fin: Rows3 },
  race:  { accent: '#1d4ed8', badgeBg: '#1d4ed8', badgeInk: T.white, Fin: FlagTriangleRight },
  barter: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: ArrowLeftRight },
  defend: { accent: '#2f4f4f', badgeBg: '#2f4f4f', badgeInk: T.white, Fin: Shield },
  blitz: { accent: '#657512', badgeBg: '#657512', badgeInk: T.white, Fin: Zap },
  blitzed: { accent: '#3f6d1f', badgeBg: '#3f6d1f', badgeInk: T.white, Fin: Sigma },
  sums: { accent: '#be185d', badgeBg: '#be185d', badgeInk: T.white, Fin: Sigma },
  hinge: { accent: '#4f46e5', badgeBg: '#4f46e5', badgeInk: T.white, Fin: Link2 },
  strata: { accent: '#9a3412', badgeBg: '#9a3412', badgeInk: T.white, Fin: Layers },
  blocks: { accent: '#1d4ed8', badgeBg: '#1d4ed8', badgeInk: T.white, Fin: Grid3x3 },
  sweep:  { accent: '#0f766e', badgeBg: '#0f766e', badgeInk: T.white, Fin: Flag },
  chomp:  { accent: '#a8430f', badgeBg: '#a8430f', badgeInk: T.white, Fin: Route },
  redact: { accent: '#27272a', badgeBg: '#18181b', badgeInk: T.white, Fin: FileText },
  paths: { accent: '#065f46', badgeBg: '#065f46', badgeInk: T.white, Fin: Waypoints },
  deep: { accent: '#0c4a6e', badgeBg: '#0c4a6e', badgeInk: T.white, Fin: Anchor },
  anon: { accent: '#8c2f39', badgeBg: '#8c2f39', badgeInk: T.white, Fin: PenLine },
};

// ---- the five families (type label + color shown on each tile/header) -------
export const CAT_META = {
  word:      { name: 'Word',      color: T.blue, Icon: Type },
  geography: { name: 'Geography', color: '#0e7c5a', Icon: Globe },
  numbers:   { name: 'Numbers',   color: '#ea580c', Icon: Hash },
  // Sudoku split out of Numbers on 2026-09-01 (owner). The colour is the
  // category ramp's own light periwinkle, so the badge here and the stage on
  // the game's own page are the same colour rather than two systems.
  sudoku:    { name: 'Sudoku',    color: '#3949ab', Icon: Table2 },
  logic:     { name: 'Logic',     color: '#9f1239', Icon: Fingerprint },
  crowd:     { name: 'Crowd Psychology', color: T.goldInk, Icon: Users },
  trivia:    { name: 'Trivia',    color: '#0f766e', Icon: Brain },
  // End Game (Check/Mate/Four/Taire/Babel) split out of Logic on 2026-08-02 but was
  // never given a CAT_META row, so CAT_META[g.cat] came back null for all five: the
  // Last Played / live feed labelled them the generic "Daily Puzzle", and the
  // "more of today's games" grid below dropped them entirely (CAT_ORDER too).
  // The colour is the muted navy those tiles already fall back to, so the badges
  // are unchanged. (owner, 2026-08-03)
  endgame:   { name: 'End Game',  color: T.muted,   Icon: Crown },
  cards:     { name: 'Cards',     color: '#7f1d1d', Icon: Club },
  // Arcade split out for Blocks (owner, 2026-08-08): a reflex-free falling-shapes
  // game is neither Logic nor End Game, and the label leaves room for the rest of
  // the arcade shelf later.
  arcade:    { name: 'Arcade',    color: '#1d4ed8', Icon: Gamepad2 },
};
// Family render order for the "more games" grid.
const CAT_ORDER = ['word', 'numbers', 'sudoku', 'trivia', 'crowd', 'logic', 'endgame', 'cards', 'arcade', 'geography'];

// ---- the daily slate (31 games) --------------------------------------------
// Canonical order = the order the "still to play" tiles appear in.
// `tag` is the short one-liner used on the compact rows; `blurb` is the fuller
// "what you actually do" sentence the Up next / Easiest cards show, so a player
// who has never opened that game knows what they are walking into (owner
// rework 2026-08-01: those two cards sell the game, not the numbers).
const ALL_DAILY_GAMES = [
  { key: 'crux',   cat: 'word',      name: 'Crux',   tag: 'A clueless crossword',      blurb: 'A full crossword grid with no clues at all. Solve it from the crossings alone.', href: '/crux' },
  { key: 'encore', cat: 'word',      name: 'Encore', tag: 'The daily crossword',            blurb: 'The big grid: nine by nine on weekdays and around twenty-six answers, so it wants a few minutes rather than a few seconds. Sundays go to eleven by eleven.', href: '/encore' },
  { key: 'emcee',  cat: 'word',      name: 'Emcee',  tag: 'The daily mini crossword',  blurb: 'A quick mini crossword with sharp clues, built to be finished in a couple of minutes.', href: '/emcee' },
  { key: 'shards', cat: 'word',      name: 'Shards', tag: 'Reassemble the crossword',   blurb: 'A finished crossword cut into pieces. Slot every shard back where it belongs.', href: '/shards' },
  { key: 'links',  cat: 'word',      name: 'Links',  tag: 'Four hidden groups',       blurb: 'Sixteen words hide four secret connections. Find all four groups before your mistakes run out.', href: '/links' },
  { key: 'plot',   cat: 'logic',     name: 'Plot',   tag: 'Divide the whole board',    blurb: 'Numbers scattered on a grid, each one the size of its own plot. Cut the board into rectangles until every number has exactly its share.', href: '/plot' },
  { key: 'barter', cat: 'word',      name: 'Barter', tag: 'Trade the letters home',    blurb: 'Six interlocking words, every letter already on the board. Trade two tiles at a time and land the lattice at par.', href: '/barter' },
  { key: 'garble', cat: 'word',      name: 'Garble', tag: 'Untangle five words',       blurb: 'Five scrambled words against the clock. Unscramble each one before time runs out.', href: '/garble' },
  { key: 'stet',   cat: 'word',      name: 'Stet',   tag: 'Spot the error, fix the copy',        blurb: 'A short passage hides one slip of fact, spelling or grammar. Catch it, then correct it.', href: '/stet' },
  { key: 'tuck',   cat: 'word',      name: 'Tuck',   tag: 'Same letters, highest score wins',  blurb: 'Everyone gets the identical letters. Tuck them into the grid for the biggest score of the day.', href: '/tuck' },
  { key: 'dating', cat: 'trivia',     name: 'Dating', tag: 'Put five moments in order', blurb: 'Five moments from history, no dates given. Put them on the timeline, earliest to latest.', href: '/dating' },
  { key: 'extra',  cat: 'trivia',     name: 'Extra',  tag: 'Name the redacted front page', blurb: 'A real front page with the key words blacked out. Work out the story it broke.', href: '/extra' },
  { key: 'span',   cat: 'geography', name: 'Span',   tag: 'Cross the map, border by border', blurb: 'Travel from one country to another over land, naming every border you cross on the way.', href: '/span' },
  { key: 'ping',   cat: 'geography', name: 'Ping',   tag: 'Find the secret city',        blurb: 'Name any city and get the distance back. Triangulate your way to the hidden one.', href: '/ping' },
  { key: 'tally',  cat: 'numbers',   name: 'Tally',  tag: 'Balance every row and column', blurb: 'Place the numbers so every row and column lands exactly on its target total.', href: '/tally' },
  { key: 'suds',   cat: 'sudoku' ,   name: 'Suds',   tag: 'The daily 9x9 sudoku',      blurb: 'A fresh, hand-checked 9x9 sudoku with one clean solving path from start to finish.', href: '/suds' },
  { key: 'quilt',  cat: 'sudoku' ,   name: 'Quilt',  tag: 'Sudoku with no straight lines', blurb: 'The same 9x9 grid, but the boxes are nine crooked regions instead of squares.', href: '/quilt' },
  { key: 'cages',  cat: 'sudoku' ,   name: 'Cages',  tag: 'The daily killer sudoku',    blurb: 'Killer sudoku: nothing is printed but the cage totals, and they are the whole clue set.', href: '/cages' },
  { key: 'niche',  cat: 'trivia',    name: 'Niche',  tag: 'One answer, two categories', blurb: 'Fill the grid with answers that fit both their row and their column, from a different universe every day. Rare picks are the flex.', href: '/niche' },
  { key: 'sixes',  cat: 'sudoku' ,   name: 'Sixes',  tag: 'The daily mini sudoku',     blurb: 'A 6x6 sudoku in boxes two tall and three wide. The short one: nothing counts against you, so the clock decides the day.', href: '/sixes' },
  { key: 'towers', cat: 'sudoku' ,   name: 'Towers', tag: 'Count the towers in view',  blurb: 'A skyline Latin square: border clues count the towers you can see, taller ones hiding shorter. 5x5 weekdays, 7x7 Sundays.', href: '/towers' },
  { key: 'mercury', cat: 'sudoku' ,  name: 'Mercury', tag: 'The daily thermo sudoku',  blurb: 'Digits climb every thermometer from its bulb. Pure visual ordering, one logical solution, and Sundays print almost nothing.', href: '/mercury' },
  { key: 'knight', cat: 'sudoku' ,   name: 'Knight', tag: 'The daily anti-knight sudoku',     blurb: 'One rule on top of sudoku: no digit repeats a knight move away. Select a square and its knights light up, and the board prints as few as thirteen digits.', href: '/knight' },
  { key: 'whittle', cat: 'sudoku' ,  name: 'Whittle', tag: 'The sudoku, backwards',            blurb: 'The one played backwards: a solved grid, eighteen clues, and you take clues out for as long as it still has one answer.', href: '/whittle' },
  { key: 'diag',  cat: 'sudoku' ,   name: 'Diag',  tag: 'The daily diagonal sudoku',    blurb: 'Sudoku X: both long diagonals hold 1 to 9 as well, so two extra houses cross the grid and the board prints fewer clues.', href: '/diag' },
  { key: 'polka',  cat: 'sudoku' ,   name: 'Polka',  tag: 'No numbers, only dots',     blurb: 'Kropki: not one digit printed. White dots mean consecutive, black mean double, and the silent edges are clues too.', href: '/polka' },
  { key: 'sando',  cat: 'sudoku' ,   name: 'Sando',  tag: 'The daily sandwich sudoku',  blurb: 'Each margin number totals the digits between that line\u2019s 1 and its 9. Find them and the grid falls out.', href: '/sando' },
  { key: 'carve',  cat: 'numbers',   name: 'Carve',  tag: 'Carve equal-sum regions',   blurb: 'Slice the number grid into regions that every one of them adds up to the same total.', href: '/carve' },
  { key: 'outwit', cat: 'crowd',     name: 'Outwit', tag: 'Beat the crowd',            blurb: 'Pick the answers today’s other players will not. The rarer your pick, the more it pays.', href: '/outwit' },
  { key: 'outrank', cat: 'crowd',    name: 'Outrank', tag: "Call the crowd's order",   blurb: 'Predict how everyone else ranked the list today, not how you would rank it yourself.', href: '/outrank' },
  { key: 'cipher', cat: 'numbers',   name: 'Cipher', tag: 'Crack the letter math',     blurb: 'A sum written in letters instead of digits. Work out which digit each letter stands for.', href: '/cipher' },
  { key: 'alibi',  cat: 'logic',     name: 'Alibi',  tag: 'Solve the nightly whodunit', blurb: 'Statements, motives and one liar. Deduce who did it before your questions run out.', href: '/alibi' },
  { key: 'jester', cat: 'logic',     name: 'Jesters', tag: 'Seat the court',             blurb: 'Seat the jesters so every row, column and colored court holds its quota, and no two ever touch.', href: '/jesters' },
  { key: 'sworn',  cat: 'logic',     name: 'Sworn',  tag: 'Spot the liars',             blurb: 'Some witnesses always tell the truth and some never do. Work out which is which.', href: '/sworn' },
  { key: 'warmer', cat: 'word',      name: 'Warmer', tag: 'Hotter or colder',           blurb: 'Guess a word and get told how close in meaning it is. Close in on today’s secret word.', href: '/warmer' },
  { key: 'listed', cat: 'trivia',    name: 'Listed', tag: 'Rank the list, top to bottom', blurb: 'Eight real things, one true order. Rank them by the figures behind them, best to worst.', href: '/listed' },
  { key: 'mate',   cat: 'endgame',     name: 'Mate',   tag: 'White to play and mate',      blurb: 'A real chess position with a forced mate hiding in it. Find the move that ends it.', href: '/mate' },
  { key: 'four',   cat: 'endgame',     name: 'Four',   tag: 'One column wins',             blurb: 'A Connect Four board where exactly one drop wins. Pick the column and play it out.', href: '/four' },
  { key: 'park',   cat: 'logic',     name: 'Parker', tag: 'Get the red one out',         blurb: 'A jammed parking lot. Slide the other cars aside and drive the red one free in as few moves as you can.', href: '/parker' },
  { key: 'impound',   cat: 'logic',     name: 'Impound', tag: 'Parker on a bigger lot',         blurb: 'Parker on a seven by seven lot, with around twenty blocks in your way. Same one gap in the wall, a good deal more between you and it.', href: '/impound' },
  { key: 'junkyard',   cat: 'logic',     name: 'Junkyard', tag: 'Parker on the biggest lot',         blurb: 'Parker on an eight by eight lot, the biggest board in the family, with close to thirty blocks in your way. Same one gap in the wall, a great deal more between you and it.', href: '/junkyard' },
  { key: 'check',  cat: 'endgame',     name: 'Check',  tag: 'Red to play and sweep',       blurb: 'A checkers position where one move sets off a chain that clears the whole board.', href: '/check' },
  { key: 'chain',  cat: 'endgame',     name: 'Chain',  tag: 'Take them, or leave them',    blurb: 'A dots and boxes endgame you are already winning. One edge keeps it, and the free box is usually bait.', href: '/chain' },
  { key: 'suffice', cat: 'logic',      name: 'Suffice', tag: 'Decide what is enough',      blurb: 'Eight questions you never answer. For each one, decide whether the two statements are enough to settle it.', href: '/suffice' },
  { key: 'docket', cat: 'logic',      name: 'Docket', tag: 'One setup, five deductions',   blurb: 'A small world and a few conditions, then five questions about what they force. Diagram once, answer five times.', href: '/docket' },
  { key: 'blitz',  cat: 'numbers',   name: 'Blitz',  tag: 'Twenty problems, one life',   blurb: 'Mental arithmetic against a fifteen second clock. Twenty problems, getting harder, and one wrong answer ends the run.', href: '/blitz' },
  { key: 'sums',  cat: 'numbers',   name: 'Sums',  tag: 'The daily kakuro',   blurb: 'The cross-sums crossword. Every run of squares adds up to the total at its head, digits 1 to 9, no repeats. One solution, and the clock decides the day.', href: '/sums' },
  { key: 'blitzed',  cat: 'numbers',   name: 'Blitzed',  tag: 'Twenty problems, three numbers each',   blurb: 'Blitz with a third number on every line, like 5 + 10 × 2. Twenty problems, twenty seconds each, and one wrong answer ends the run.', href: '/blitzed' },
  { key: 'defend', cat: 'endgame',     name: 'Defend', tag: 'Black to play and survive',   blurb: 'The other half of a mate puzzle. Five moves look like they stop the mate, one does, and then you have to do it again.', href: '/defend' },
  { key: 'turn',   cat: 'endgame',     name: 'Turn',   tag: 'Ten squares left',            blurb: 'An Othello endgame you are already winning. One square keeps it, and the careful little move is not always it.', href: '/turn' },
  { key: 'paths', cat: 'logic',      name: 'Paths',  tag: 'Link every town, cheaply',  blurb: 'One depot, a scatter of towns, a river and two ridges. Link them all for as little as you can, against a proven cheapest network.', href: '/paths' },
  { key: 'redact', cat: 'trivia',     name: 'Redact', tag: 'Uncover the blacked-out article', blurb: 'A whole article about one famous subject, every word behind a block. Guess words to uncover it and name the subject.', href: '/redact' },
  { key: 'chomp', cat: 'logic',      name: 'Chomp', tag: 'Eat them in order',        blurb: 'Seven mascots, eaten in order, and a trail that never goes away. The only thing in your way is where you have already been.', href: '/chomp' },
  { key: 'sweep', cat: 'arcade',     name: 'Sweep', tag: 'No bottom edge',           blurb: 'Minesweeper that runs downward forever. The same field for everybody, never a guess, one life a run and as many runs as you like.', href: '/sweep' },
  { key: 'blocks', cat: 'arcade',    name: 'Blocks', tag: 'Same shapes, same order',   blurb: 'Falling shapes in a short well, the same order for everybody, and as many runs as you like with your best one scored. It never speeds up.', href: '/blocks' },
  { key: 'strata', cat: 'word',       name: 'Strata', tag: 'Dig the words out',          blurb: 'Every letter belongs to a buried word. Take one out and the letters above it fall, which is what lets you read the next.', href: '/strata' },
  { key: 'hinge',   cat: 'word',      name: 'Hinge',   tag: 'Chain the compounds',   blurb: 'First and last word given. Fill the chain so every pair of neighbours makes a compound word or a phrase everyone knows. Any chain that holds counts.', href: '/hinge' },
  { key: 'rung',   cat: 'word',      name: 'Rung',   tag: 'One letter at a time',       blurb: 'Climb from the first word to the last, changing a single letter on every rung.', href: '/rung' },
  { key: 'crunch', cat: 'numbers',   name: 'Crunch', tag: 'Six numbers, one target',    blurb: 'Six numbers, four operations, one target. Hit it exactly or get as close as you can.', href: '/crunch' },
  { key: 'taire',  cat: 'cards',       name: 'Taire',  tag: 'The daily solitaire',        blurb: 'A trimmed solitaire deal that always has a finish in it. Clear the board and beat par.', href: '/taire' },
  { key: 'fib',    cat: 'logic',     name: 'Fib',    tag: 'One clue is lying',          blurb: 'A logic grid where exactly one clue is false. Find the lie, then solve the rest.', href: '/fib' },
  { key: 'streak', cat: 'trivia',    name: 'Streak', tag: 'Forty questions, one life',  blurb: 'Forty trivia questions, sudden death. One wrong answer ends the run for the day.', href: '/streak' },
  { key: 'deep',   cat: 'trivia',    name: 'Deep',   tag: 'One topic, fifteen questions', blurb: 'One subject a day, fifteen questions on it, easy to expert. One wrong answer ends the dive.', href: '/deep' },
  { key: 'calc',  cat: 'numbers',   name: 'Calc',  tag: 'Walk the calculator',      blurb: 'Step across a grid of numbers and operators, one touching button at a time, and land on exactly the target. Reads left to right, like a calculator.', href: '/calc' },
  { key: 'script', cat: 'trivia',   name: 'Script', tag: 'Movies and TV, one life', blurb: 'Twenty-five film and television questions, gimme to expert, five lanes a round from the movies themselves to the awards, the money and what happened behind the camera. One wrong answer ends the run.', href: '/script' },
  { key: 'thread', cat: 'trivia',   name: 'Thread', tag: 'Nine films described badly, one thread', blurb: 'Nine films described by someone who missed the point, and one thing they all share. Name the films, then call the thread, early if you dare.', href: '/thread' },
  { key: 'slot', cat: 'trivia',   name: 'Slot', tag: 'Ten things, one at a time', blurb: 'Ten things on one axis, dealt one at a time. Drop each into a slot before you see the next; nothing moves once it is down, and the reveal shows the true order beside yours.', href: '/slot' },
  { key: 'focus', cat: 'trivia',   name: 'Focus', tag: 'Name the zoomed-in photo', blurb: 'One photo a day, zoomed in close. Name it before six frames pull the camera all the way back; the earlier the frame, the more it pays.', href: '/focus' },
  { key: 'quotes', cat: 'trivia',   name: 'Quotes', tag: 'Who said it, one life', blurb: 'Twenty-five famous lines, gimme to expert, five lanes a round from presidents and generals to scientists, writers and the odd film character. One wrong attribution ends the run.', href: '/quotes' },
  { key: 'biz',   cat: 'trivia',    name: 'Biz',   tag: 'Business, one life', blurb: 'Twenty-five business questions, gimme to expert, five lanes a round from brands and markets to founders, deals and business history. One wrong answer ends the run.', href: '/biz' },
  { key: 'sport', cat: 'trivia',    name: 'Sport', tag: 'Every sport, one life', blurb: 'Twenty-five sports questions, gimme to expert, five lanes a round from the NFL to the Olympics. One wrong answer ends the run.', href: '/sport' },
  { key: 'atlas', cat: 'geography', name: 'Atlas', tag: 'Twenty-five questions, one life', blurb: 'Twenty-five geography questions, gimme to expert, five subjects a round. One wrong answer ends the run.', href: '/atlas' },
  { key: 'flank', cat: 'geography', name: 'Flank', tag: 'Name every neighbor', blurb: 'One country a day; name every country on its land border before three wrong countries end the run. Sundays hand you a fourteen-neighbor giant.', href: '/flank' },
  { key: 'anon',  cat: 'word',       name: 'Anon',   tag: 'A clueless acrostic',    blurb: "An unsigned passage and a bank of answers built from its letters. Solve them, and their first letters spell out who wrote it.", href: '/anon' },
  { key: 'feud',   cat: 'crowd',     name: 'Feud',   tag: 'Match the crowd',            blurb: 'Name the answers real players gave most often. The most popular answers pay the most.', href: '/feud' },
  { key: 'babel',  cat: 'word',      name: 'Babel',  tag: 'The bag is empty',           blurb: 'A word tile game picked up at the very end. Their rack is knowable, so race them out or block the lane they need.', href: '/babel' },
  { key: 'hands',  cat: 'cards',     name: 'Hands',  tag: 'The daily poker solitaire', blurb: 'Cards come one at a time into a grid where every row and column scores as a poker hand. Same deal for everybody, so it is decisions and not luck.', href: '/hands' },
  { key: 'finesse',  cat: 'cards',     name: 'Finesse',  tag: 'The daily double dummy', blurb: 'All four hands face up and a defence that never errs. Play South and the dummy, and take the tricks the contract asks for. Three rules, no bidding, no luck.', href: '/finesse' },
  { key: 'shoe',  cat: 'cards',     name: 'Shoe',  tag: 'The daily blackjack shoe', blurb: 'Five hands of blackjack off one fixed shoe, the same cards for everybody. Par is the book line, and the count is how you beat it.', href: '/shoe' },
  { key: 'queen', cat: 'endgame',   name: 'Queen', tag: 'White to play and promote',   blurb: 'King and pawn against king, with a proven win. Walk the pawn to the eighth rank against a perfect defence, with every move exact.', href: '/queen' },
  { key: 'axiom',  cat: 'logic',     name: 'Axiom',  tag: 'Find the hidden rule',       blurb: 'Test examples against a secret rule and name the rule before your guesses run out.', href: '/axiom' },
  { key: 'hearsay', cat: 'logic',    name: 'Hearsay', tag: "Deduce what they don't know", blurb: 'Work out the answer purely from what each player admits they cannot yet tell.', href: '/hearsay' },
  { key: 'venn',   cat: 'logic',     name: 'Venn',   tag: 'Sort the overlaps',          blurb: 'Drop every item into the right slice of the overlapping circles, overlaps included.', href: '/venn' },
  { key: 'stands', cat: 'logic',     name: 'Stands', tag: 'Rebuild the results',       blurb: 'Reconstruct a full league table from a handful of scattered results and clues.', href: '/stands' },
  { key: 'bracket', cat: 'trivia',   name: 'Bracket', tag: 'Name every winner',        blurb: 'A real tournament bracket, empty. Fill in every winner round by round from memory.', href: '/bracket' },
  // PRICER PULLED 2026-08-09 (see CLAUDE.md). Restore: grep -rn 'PRICER PULLED' end-card suggestion
  // { key: 'pricer',  cat: 'numbers',  name: 'Pricer',  tag: 'Some days more, some days less', blurb: 'Sixteen real things from one category, seeded by price. Call every matchup before a single price tag is revealed.', href: '/pricer' },
  { key: 'lode',    cat: 'word',     name: 'Lode',    tag: 'Seven letters, rare words pay',     blurb: 'Seven letters and unlimited words. The rarer the word you find, the bigger it scores.', href: '/lode' },
  { key: 'etch',    cat: 'logic',    name: 'Etch',    tag: 'A picture in the numbers',   blurb: 'A nonogram: follow the row and column counts to uncover the picture hidden in the grid.', href: '/etch' },
  { key: 'hedge',   cat: 'logic',    name: 'Hedge',   tag: 'Draw one closed loop',       blurb: 'Draw a single unbroken loop that satisfies every number printed on the board.', href: '/hedge' },
  { key: 'glyph',   cat: 'word',     name: 'Glyph',   tag: 'A crossword with no clues',  blurb: 'A codeword: every letter is a number, and two given letters are all you get to crack the alphabet.', href: '/glyph' },
];

// The slate of games a player is offered next. A retired game leaves it on
// its own the morning after its bank's last drop (RETIRED_DAILY in
// lib/daily-games), and this card's "N done" totals follow from this list.
// Lookups for the game being PLAYED go through ALL_DAILY_GAMES instead, so a
// retired game's own end card still knows its name and family.
export const DAILY_GAMES = ALL_DAILY_GAMES.filter((g) => !isRetiredDaily(g.key));

const AUTO_SECONDS = 30;
const REVEAL_MS = 2000; // win only: MIN time the finished board + confetti shows before the popup
const REVEAL_CAP_MS = 3000; // hard cap: pop even if data is slow (usually pops at REVEAL_MS = 2s)

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// The IQ hero's brain art. 640x576 source. It used to be shared with the
// downloadable day card; that card's meter is a flex ladder now, so this art is
// the end card's and QuizStandings' alone.
// The unfilled state of the meter. Deliberately an OUTLINED brain (stroke +
// interior detail lines, same silhouette as the filled art so the meter lines
// up), not the solid silhouette faded down: at 20% opacity that art read as an
// unrecognizable blob on the navy panel (owner 2026-08-01).
const BRAIN_EMPTY = '/day-card/brain-outline.png';
const BRAIN_BLUE = '/day-card/brain-blue.png';
const BRAIN_GREEN = '/day-card/brain-green.png';

function prefersReducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  catch (e) { return false; }
}

// Counts a number up from 0 to `target` on an easeOutCubic over ~1s, so the IQ
// gain lands as an event rather than simply appearing. Returns `target`
// straight away for a null/zero value or a reduced-motion viewer. `done` flips
// true on the last frame, which is what fires the panel's glow pulse.
function useCountUp(target, ms = 1000) {
  const [n, setN] = useState(target == null ? null : target);
  const [done, setDone] = useState(target != null);
  useEffect(() => {
    if (target == null) { setN(null); setDone(false); return undefined; }
    if (prefersReducedMotion() || target <= 0) { setN(target); setDone(true); return undefined; }
    let raf = null;
    let alive = true;
    const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const tick = () => {
      if (!alive) return;
      const t = Math.min(1, (now() - start) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    setN(0);
    setDone(false);
    raf = requestAnimationFrame(tick);
    return () => { alive = false; if (raf) cancelAnimationFrame(raf); };
  }, [target, ms]);
  return [n, done];
}

/* The prize figure is the hook in the share teaser, so it is picked out of the
   copy string and rendered gold, heavy and underlined instead of sitting flat
   in the sentence. Split on CONTEST.prizeLabel so lib/contest.js stays the one
   source of the number: if the label ever stops appearing in the teaser the
   split yields a single part and the copy renders unchanged. */
function teaserNodes() {
  const label = CONTEST.prizeLabel;
  const parts = String(COPY.teaser).split(label);
  if (parts.length < 2) return COPY.teaser;
  const out = [];
  parts.forEach((part, i) => {
    if (i > 0) out.push(<span className="pz" key={`p${i}`}>{label}</span>);
    if (part) out.push(<span key={`t${i}`}>{part}</span>);
  });
  return <>{out}</>;
}

/**
 * @param self          game key, e.g. "garble"
 * @param completed      bool; the player reached the end of the puzzle (default =
 *                       won). With won=false this reads "Not perfect." rather
 *                       than "Incomplete."
 * @param defeat         bool; the loss was to an opponent => "Defeated." (default:
 *                       on for four/mate/check/taire, see DEFEAT_GAMES)
 * @param score          node; a clean score shown at top for variable-score games only
 * @param headline       DEPRECATED, no longer rendered
 * @param subline        DEPRECATED, no longer rendered
 * @param onShare / shareLabel   share handler + label
 * @param onReplay      replay handler; renders the quick replay bar under the share bar.
 *                       The board's FIRST completed attempt is what the daily
 *                       leaderboard and the local streak keep (see the first-
 *                       completion selection in /api/quiz/daily-game and the
 *                       write-once recordStat in each client), so a replay is
 *                       free practice and never overwrites the recorded run.
 * @param onClose       closes any celebration modal; run before scroll
 * @param boardId       leaderboard element id to scroll to (default "daily-leaderboard")
 * @param onLeaderboard optional override for the whole close+scroll behavior
 */
export default function DailyEndCard({
  self,
  won = true,
  completed = null,
  defeat = null,
  modal = false,
  headline = 'You scored 100%',
  subline = null,
  score = null,
  answer = null,
  onShare, shareLabel = 'Share Result',
  onReplay,
  onClose,
  boardId = 'daily-leaderboard',
  onLeaderboard,
  quizId = null,
}) {
  // "(for credit)" only for a registered viewer: every caller's share handler
  // builds its URL through withRef, so a registered sharer genuinely earns the
  // credit, while a signed-out one would be promised something they can't get.
  // If the completion fetch is very slow, stop showing the loading skeletons after
  // a beat and collapse those slots rather than lingering on a shimmer.
  useEffect(() => {
    const t = setTimeout(() => setSkelTimedOut(true), 1500);
    return () => clearTimeout(t);
  }, []);
  const [ident, setIdent] = useState(null);          // { email, username } from localStorage
  const [dailyMe, setDailyMe] = useState(null);
  const [dailyGuest, setDailyGuest] = useState(null); // provisional standing for an unregistered player
  const [boardGames, setBoardGames] = useState(null); // per-game field/plays/board for the day
  const [allTime, setAllTime] = useState(null);       // { field, myRank, myPoints, board } for `self`
  const [allTimeResolved, setAllTimeResolved] = useState(false); // daily-game answered => all-time tile known
  const [drops, setDrops] = useState(null);           // this game's live drops (calendar)
  const [secs, setSecs] = useState(AUTO_SECONDS);
  const [autoCancel, setAutoCancel] = useState(false);
  const [combinedResolved, setCombinedResolved] = useState(false); // daily-me answered => completion set is known
  const [skelTimedOut, setSkelTimedOut] = useState(false);          // collapse loading skeletons if the fetch is very slow
  // Contest teaser on the share button. Resolved AFTER mount rather than at
  // render: contestIsLive() reads the clock, so evaluating it during SSR and
  // again on the client can disagree across the window boundary and trip a
  // hydration mismatch. Off for the first paint, which is correct anyway once
  // the contest has ended.
  const [contestLive, setContestLive] = useState(false);
  useEffect(() => { setContestLive(contestIsLive()); }, []);
  // WHICH RUN is this page part of — the marquee, one of the thirteen skill
  // circuits, or none? A circuit ID, not a boolean (fixed 2026-08-18; it read
  // ?five=1 alone, so a skill circuit got no run branch and, worse, no
  // suppression of autoRun below). Read in an effect for the same reason
  // contestLive above is: it reads window, so evaluating it during SSR and
  // again on the client can disagree across that boundary. Null for the first
  // paint, which is also the correct answer for every ordinary page.
  const [inRun, setInRun] = useState(null);
  useEffect(() => { setInRun(readRunParam()); }, []);
  const [runSecs, setRunSecs] = useState(6);
  const [runStay, setRunStay] = useState(false);
  const [popularCats, setPopularCats] = useState(null);             // popular quiz per category, once every daily is done
  const [pastHref, setPastHref] = useState(null);     // most-recent unplayed PAST drop of this game
  const [iq, setIq] = useState(null);                 // { gained, todayGained, rank, total, xp, level, window, provisional }
  const [iqResolved, setIqResolved] = useState(false); // iq-standing answered (or gave up retrying)
  const [openTile, setOpenTile] = useState(null);     // which rank tile is expanded: 'iq'|'today'|'alltime'|'combined'|null
  const [calOpen, setCalOpen] = useState(false);      // calendar slip expanded
  const [calMonth, setCalMonth] = useState(() => etTodayEC().slice(0, 7)); // 'YYYY-MM'

  // Win reveal delay: on a win, hold the popup back ~2s so the player sees the
  // completed board with the confetti first (and the placement fetch has time to
  // land). Losses and reduced-motion viewers get the card immediately.
  const [revealed, setRevealed] = useState(() => {
    if (!(won && modal)) return true;
    try {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    } catch (e) {}
    return false;
  });
  // Hold the reveal until the card's data has actually landed (the combined
  // standing that fills the tiles, and the all-time board), so the player never
  // sees the tiles pop in from "—" after the card appears. These refs are flipped
  // by the fetch callbacks below; the reveal poller reads their latest values.
  const standingReadyRef = React.useRef(false);
  const allTimeReadyRef = React.useRef(false);
  useEffect(() => {
    if (revealed) return undefined;
    const start = Date.now();
    let alive = true;
    let t = null;
    const tick = () => {
      if (!alive) return;
      const el = Date.now() - start;
      // Reveal once BOTH the minimum confetti window AND the data are ready, or at
      // the hard cap so a slow/failed fetch can never leave the card hidden.
      if ((el >= REVEAL_MS && standingReadyRef.current && allTimeReadyRef.current) || el >= REVEAL_CAP_MS) {
        setRevealed(true);
        return;
      }
      t = setTimeout(tick, 140);
    };
    t = setTimeout(tick, 140);
    return () => { alive = false; if (t) clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Identity (username / registered state) for the header right stack.
  useEffect(() => {
    try { setIdent(JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null')); } catch (e) {}
  }, []);

  useEffect(() => {
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    // After Part 3 guests appear in d.me once their rows land, so the retry
    // check covers both registered and guest players via d.me.perGame.
    const registered = !!email;
    let alive = true;
    let timer = null;
    // The result of the game just finished is POSTed to /api/quiz/result at the
    // same moment this card mounts, and the board reads a cached snapshot (a ~5s
    // in-process burst TTL plus an edge cache). So the FIRST read here can still
    // predate our own row landing, which renders the player at the
    // bottom (as if they scored zero) until the write propagates. Re-fetch, cache-
    // busted, until our standing reflects the game we just finished (or we run out
    // of tries), so the end-card placement is never stale. delays are CUMULATIVE ms
    // after mount and cover the write commit + the 5s snapshot TTL, so each retry
    // must be scheduled with the GAP `delays[i] - delays[i - 1]`, exactly as the
    // iq-standing effect below does. Passing delays[i] straight to setTimeout
    // treated the cumulative targets as gaps and stretched the real ladder to
    // 0 / 1.5s / 5s / 11s / 21s, so a player whose first read lost the race to
    // their own write waited up to 21 seconds to see their ranking.
    const delays = [0, 1500, 3500, 6000, 10000];
    let i = 0;
    let notified = false;
    // Once our own row is confirmed on the board, tell the on-page daily
    // leaderboard to reload fresh so it shows us at once. Fire twice (now + a
    // beat later) to cover the board mounting a tick after this fetch resolves.
    const notifyBoard = () => {
      // Drop the shared answer first: the panel and the grid refetch on this
      // event, and they must not be handed the pre-finish payload.
      invalidateDailyMe();
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('sot:daily-updated', { detail: { game: self } })); } catch (e) {}
    };
    const run = () => {
      // `game` is REQUIRED: daily-me scores ONE game in full (board + live
      // re-score if it is adaptive) and only counts the rest, so it needs to know
      // which. Without it the endpoint returns game:null and the Today tile
      // renders an empty board even though the puzzle has a full field.
      //
      // /api/quiz/daily-me, NOT daily-combined: scoreGame() reads one game's
      // rows, so the rank this card shows is local to the puzzle just played.
      // daily-combined scores all ~40 games, re-scores the three adaptive ones
      // live, computes every player's best-N total and builds 40 boards, and the
      // card used one rank out of it. Measured on the same day's data: 527ms and
      // 7KB here against 1,671ms and 95KB there.
      //
      // fresh on EVERY attempt: this is checking for our own just-written row, so
      // a cached answer is exactly the wrong thing. The result still seeds the
      // shared entry, which is what lets the on-page panel and grid ride along on
      // this request instead of making their own.
      fetchDailyMe(dailyMeQuery({ anonId, email, game: self, quizId }), { fresh: true })
        .then((d) => {
          if (!alive || !d) return;
          setCombinedResolved(true); // the completion set is now as complete as it will get
          // perGame covers guests too (scoreGame keys by anon_id), so there is no
          // separate provisional path to merge any more.
          if (d.perGame) setDailyMe({ userKey: d.me ? d.me.userKey : null, perGame: d.perGame, gameCount: d.gameCount });
          // The day's per-game counts feed the easiest-board card; the game just
          // played also carries its top-10 board for the Today tile.
          if (Array.isArray(d.games)) {
            setBoardGames(d.games.map((g) => (d.game && g.key === d.game.key ? { ...g, ...d.game } : g)));
          }
          // Does our standing already include the game we just finished? If so
          // (or retries are exhausted), stop. Otherwise the write hasn't
          // propagated yet, so try again.
          // An ABANDONED entry is not the finish we are waiting for. scoreGame
          // already prefers a completed row over an abandon, so perGame[self]
          // reports abandoned only while our own finished row is still missing;
          // counting it as landed stopped this ladder on the first read and left
          // the rank tiles showing the pre-finish standing (owner-reported
          // 2026-08-01, alongside the same bug in /api/quiz/iq-standing).
          const mineToday = d.perGame ? d.perGame[self] : null;
          const reflectsSelf = !self || !!(mineToday && !mineToday.abandoned);
          if (reflectsSelf && !notified) { notified = true; notifyBoard(); setTimeout(notifyBoard, 600); }
          if (reflectsSelf || i >= delays.length - 1) { standingReadyRef.current = true; return; }
          i += 1;
          timer = setTimeout(run, delays[i] - delays[i - 1]);
        })
        .catch(() => {
          if (!alive) return;
          setCombinedResolved(true); // don't leave the loading skeletons up on a failed read
          if (i >= delays.length - 1) { standingReadyRef.current = true; return; }
          i += 1;
          timer = setTimeout(run, delays[i] - delays[i - 1]);
        });
    };
    timer = setTimeout(run, delays[0]);
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, []);

  // Resolve the most-recent unplayed PAST drop of this game so "Play a past" can
  // one-tap straight into it; the button hides when the player has done them all.
  useEffect(() => {
    if (!self) return undefined;
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    const qs = new URLSearchParams({ game: self });
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    let alive = true;
    fetch('/api/quiz/daily-unplayed?' + qs.toString())
      .then((r) => r.json())
      .then((d) => { if (alive && d && d.href) setPastHref(d.href); })
      .catch(() => {});
    return () => { alive = false; };
  }, [self]);

  // The game's all-time (cumulative-points) leaderboard + its drop calendar.
  useEffect(() => {
    if (!self) return undefined;
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    const qs = new URLSearchParams({ game: self, fresh: '1' });
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    let alive = true;
    fetch('/api/quiz/daily-game?' + qs.toString())
      .then((r) => r.json())
      .then((d) => { if (alive && d) { if (d.allTime) setAllTime(d.allTime); if (Array.isArray(d.drops)) setDrops(d.drops); } if (alive) setAllTimeResolved(true); allTimeReadyRef.current = true; })
      .catch(() => { if (alive) setAllTimeResolved(true); allTimeReadyRef.current = true; });
    return () => { alive = false; };
  }, [self]);

  const meta = GAME_META[self] || GAME_META.crux;
  const selfGame = ALL_DAILY_GAMES.find((g) => g.key === self) || null;
  // Header for this game's `guessesUsed` column; null = it always posts 0, so
  // the column is dropped. Read from the registry so the card and the on-page
  // DailyBoardPanel can never disagree about the word.
  const missLabel = (DAILY_GAME_MAP[self] || {}).miss || null;
  // A tally game reports a bare count with its unit ("7 rows"), so its Score
  // column drops the denominator and takes the unit as its heading instead.
  const scoreUnit = (DAILY_GAME_MAP[self] || {}).unit || null;
  const selfCat = selfGame ? selfGame.cat : 'word';
  const selfName = selfGame ? selfGame.name : (self || 'today’s game');
  const selfCatMeta = CAT_META[selfCat] || CAT_META.word;
  // The finish state, four ways (owner, 2026-08-02). `won` alone used to drive
  // both the mark and the title, so every game whose `won` really means PERFECT
  // (Bracket's 15/15, Cipher's clean run, Venn's no-reject sheet) told a player
  // who had filled in the entire puzzle that it was "Incomplete." A caller
  // passes `completed` when the player REACHED THE END whatever they scored,
  // which splits that one loss state into two honest ones:
  //   won                        -> "Completed!"   green check
  //   finished, short of the win -> "Not perfect."  amber check
  //   lost to an opponent        -> "Defeated."     rust flag
  //   never reached the end      -> "Incomplete."   rust flag
  const isCompleted = (completed == null ? won : completed);
  const defeated = !won && (defeat == null ? DEFEAT_GAMES.has(self) : !!defeat);
  const finish = won ? 'won' : (defeated ? 'defeat' : (isCompleted ? 'near' : 'loss'));
  const finishTitle = { won: 'Completed!', near: 'Not perfect.', defeat: 'Defeated.', loss: 'Incomplete.' }[finish];
  const headColor = finish === 'won' ? meta.accent : (finish === 'near' ? AMBER : RUST);

  // The player's IQ Points standing: what this game paid, what they have banked
  // today, and their window of the global IQ ranking. Same write-propagation race
  // as the combined board above (our /api/quiz/result row is POSTed as this card
  // mounts), and the route reports gained:null until that row is visible, so
  // retry on the same schedule rather than render a stale number.
  useEffect(() => {
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    if (!anonId && !email) { setIqResolved(true); return undefined; }
    let alive = true;
    let timer = null;
    let i = 0;
    // One more try than the combined board: a FIRST-time player's row has to be
    // inserted, committed, and picked up by the results cache before any IQ
    // figure exists at all, so give it the extra window rather than settle on a
    // dash for someone who just finished their first ever puzzle.
    const delays = [0, 1500, 3500, 6000, 10000, 15000];
    const run = () => {
      const qs = new URLSearchParams();
      if (anonId) qs.set('anonId', anonId);
      if (email) qs.set('email', email);
      if (self) qs.set('game', self);
      if (quizId) qs.set('quizId', quizId);
      if (i > 0) qs.set('_', String(Date.now())); // bust the edge cache on retries
      fetch('/api/quiz/iq-standing?' + qs.toString())
        .then((r) => r.json())
        .then((d) => {
          if (!alive || !d) return;
          if (d.found) setIq(d);
          if (d.found && Array.isArray(d.trophies)) notifyTrophies(d.trophies);
          // Done when the row landed (gained known), the player has no profile at
          // all, or we are out of tries.
          if (!d.found || d.gained != null || i >= delays.length - 1) { setIqResolved(true); return; }
          i += 1;
          timer = setTimeout(run, delays[i] - delays[i - 1]);
        })
        .catch(() => { if (alive) setIqResolved(true); });
    };
    timer = setTimeout(run, delays[0]);
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [self, quizId]);

  const hasEmail = !!(ident && ident.email);
  const username = ident && ident.username ? ident.username : null;

  // Which daily puzzles the viewer has completed today. The just-finished game is
  // always checked; dailyMe.perGame fills in every other game already played so
  // the whole day resolves, not just the leaf they came from.
  const doneKeys = new Set();
  const unfinished = new Set(); // started today but abandoned (not finished)
  if (self) doneKeys.add(self);
  // Registered players carry the day's completions on dailyMe.perGame; guests carry
  // them on the provisional standing, so read whichever we have (else the guest's
  // already-played games would look unplayed and skew "up next" / the grid).
  const perGameDone = (dailyMe && dailyMe.perGame) || (dailyGuest && dailyGuest.perGame) || null;
  if (perGameDone) {
    for (const [k, v] of Object.entries(perGameDone)) {
      if (v && v.abandoned) unfinished.add(k);
      else doneKeys.add(k);
    }
  }
  if (self) unfinished.delete(self); // the game just finished is never unfinished
  const total = DAILY_GAMES.length;
  const doneCount = DAILY_GAMES.filter((g) => doneKeys.has(g.key)).length;

  // ── the Daily Five run ────────────────────────────────────────────────────
  // Computed HERE, above autoRun, because autoRun has to be suppressed inside a
  // run: it navigates to the most similar unplayed daily after 30 seconds, which
  // in a run means walking the player out of it and into an unrelated game.
  const runDay = etTodayEC();
  const runMembers = inRun ? circuitKeysFor(inRun, runDay) : [];
  const runName = circuitName(inRun);
  const runMarq = isMarquee(inRun);
  // Declared above the auto-advance effect that names it in its dependency
  // array, since a dep array is evaluated during render.
  const runSummary = runSummaryHref(inRun);
  // REPLAY UNTIL VICTORY, the mirror of the rule in LoftFinish.jsx — read the
  // block there for why the gate exists and why Arcade is exempt from it.
  const runRetry = !!onReplay && !won && (!!attemptsMode(self) || isArcade(self));
  const runUnsolvedEG = !!onReplay && !won && !!attemptsMode(self);
  // A stale or hand-typed flag must not put a game inside a run that does not
  // contain it.
  const runActive = runMembers.length >= 2 && runMembers.includes(self);
  const runDoneKeys = runMembers.filter((k) => doneKeys.has(k));
  // Gated on combinedResolved: until the day's completions land, doneKeys holds
  // only the game just finished, so an ungated test would call a run complete on
  // its first finish and bounce the player to the summary after one game.
  const runComplete = runActive && combinedResolved && runDoneKeys.length === runMembers.length;
  const runNextKey = runActive ? (runMembers.find((k) => k !== self && !doneKeys.has(k)) || null) : null;
  const runNext = runNextKey ? DAILY_GAME_MAP[runNextKey] : null;
  const runPoints = runMembers.reduce((s, k) => {
    const p = perGameDone && perGameDone[k];
    return s + (p && !p.abandoned ? (Number(p.points) || 0) : 0);
  }, 0);
  // Finishing the fifth TAKES you to the board rather than offering it, because
  // the board is the thing the run was for. Six seconds and an escape hatch, the
  // same shape as the card's own auto-advance.
  const runAuto = runComplete && revealed && !runStay && !(runActive && runUnsolvedEG);
  useEffect(() => {
    if (!runAuto) return undefined;
    if (runSecs <= 0) {
      if (typeof window !== 'undefined') window.location.href = runSummary;
      return undefined;
    }
    const t = setTimeout(() => setRunSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [runAuto, runSecs, runSummary]);

  // Slate strip cells, PACKED. Rendering DAILY_GAMES in its own order put the
  // filled cells wherever those games happen to sit in the list, so the strip
  // read as scattered noise rather than as progress. Finished games come
  // first, then this one (the cell that just lit up), then everything left.
  const slateCells = [
    ...DAILY_GAMES.filter((g) => g.key !== self && doneKeys.has(g.key)),
    ...DAILY_GAMES.filter((g) => g.key === self),
    ...DAILY_GAMES.filter((g) => g.key !== self && !doneKeys.has(g.key)),
  ];

  // Still-to-play games, launch-pinned to the front during a new game's window.
  let todo = DAILY_GAMES.filter((g) => !doneKeys.has(g.key));
  if (etTodayEC() <= LAUNCH_PIN.until) {
    todo = [
      ...todo.filter((g) => LAUNCH_PIN.keys.includes(g.key)),
      ...todo.filter((g) => !LAUNCH_PIN.keys.includes(g.key)),
    ];
  }

  // Up next = the closest unplayed game of the SAME family, else the next unplayed.
  const nextTarget = todo.find((g) => g.cat === selfCat) || todo[0] || null;

  // --- rank-tile figures ----------------------------------------------------
  // Today, this game: my rank of the game's registered field.
  const todayGame = boardGames ? boardGames.find((g) => g.key === self) : null;
  const gameTodayRank = (dailyMe && dailyMe.perGame && dailyMe.perGame[self] && dailyMe.perGame[self].rank)
    || (dailyGuest && dailyGuest.perGame && dailyGuest.perGame[self] && dailyGuest.perGame[self].rank)
    || null;
  const gameTodayField = (todayGame ? (todayGame.plays ?? todayGame.field) : null)
    || (dailyGuest && dailyGuest.perGame && dailyGuest.perGame[self] && dailyGuest.perGame[self].field)
    || null;
  // Provisional (guest) standings are marked so the tile can say so.
  const provisional = !dailyMe && !!dailyGuest;

  // Rankings still loading: neither the combined standing nor the all-time board
  // has answered yet. While loading, show a single "Loading your rankings…" banner
  // spanning the tiles row instead of empty dash tiles. Both fetches always resolve
  // or error (each sets its flag in .then AND .catch), so this can never spin
  // forever — a guest with no rank resolves fast and falls through to the tiles.
  const ranksLoading = !(combinedResolved && allTimeResolved);

  const myKey = dailyMe ? dailyMe.userKey : null;

  // IQ tile values. `gained` stays null until our result row is visible, so the
  // tile shows a placeholder rather than a wrong number. The "today" line only
  // appears once the day's total exceeds this game's gain (i.e. this is not the
  // player's first daily today), where it would otherwise just repeat it.
  const iqGained = (iq && typeof iq.gained === 'number') ? iq.gained : null;
  const showIqToday = !!(iq && typeof iq.todayGained === 'number' && iqGained != null && iq.todayGained > iqGained);
  // The gain counts up from zero once it is known; `iqLanded` fires the panel's
  // glow pulse on the last frame.
  const [iqCount, iqLanded] = useCountUp(iqGained);
  // Brain meter: filled by the player's progress through today's slate, exactly
  // as on the shareable day card, and green rather than blue once the whole
  // slate is done. `brainOn` defers the fill by a beat so it animates up from
  // empty instead of rendering pre-filled.
  const slateFrac = total > 0 ? Math.max(0, Math.min(1, doneCount / total)) : 0;
  const slateFull = total > 0 && doneCount >= total;
  const [brainOn, setBrainOn] = useState(() => prefersReducedMotion());
  useEffect(() => {
    if (brainOn) return undefined;
    const t = setTimeout(() => setBrainOn(true), 260);
    return () => clearTimeout(t);
  }, [brainOn]);

  // Most open leaderboard = the thinnest-field daily among the REMAINING unplayed
  // games, AFTER excluding the "closest" (up-next) pick. So the two cards are
  // always distinct: with two games left, one is the closest and the other is the
  // most-open of what's left (even if still fairly full). No fallback to
  // already-played games, so with 0 or 1 remaining there is simply no second card.
  // field = full pool (registered + guests); registered = named/registered
  // players only (what the public board shows); plays = total attempts.
  let grab = null;
  if (boardGames && boardGames.length) {
    const nextKey = nextTarget ? nextTarget.key : null;
    const pool = boardGames.filter((g) => !doneKeys.has(g.key) && g.key !== nextKey);
    pool.sort((a, b) => (a.registered - b.registered) || (a.field - b.field) || (a.plays - b.plays));
    const g0 = pool[0];
    const gm = g0 && DAILY_GAMES.find((x) => x.key === g0.key);
    if (g0 && gm) grab = { ...gm, field: g0.field || 0, plays: g0.plays || 0, registered: g0.registered || 0, href: g0.href || gm.href };
  }

  // Completion-derived UI (Up next, Easiest leaderboard, the still-to-play grid)
  // must wait for the daily-me fetch: before it lands the only finished game
  // we know is `self`, so an ungated "up next" can point at a game already played
  // today (and the auto-advance would open it). Gate on combinedResolved, show a
  // skeleton meanwhile, and collapse the skeleton if the fetch is very slow.
  const completionKnown = combinedResolved;
  // Every daily finished today (none unplayed, none abandoned). In this state the
  // up-next / easiest-board duo has nothing to point at, so it collapses and the
  // grid below becomes a "try a quiz" block instead.
  const allDailiesDone = completionKnown && todo.length === 0;
  // Suggest quizzes once the player is down to half (or fewer) of the day's
  // puzzles, not only when they've cleared them all.
  const showPopular = completionKnown && (total - doneCount) <= total / 2;
  const nextReal = !allDailiesDone && completionKnown && !!nextTarget; // trustworthy up-next
  const nextSkel = !allDailiesDone && !completionKnown && !skelTimedOut; // still loading
  const grabSkel = !allDailiesDone && !boardGames && !skelTimedOut;   // easiest-board data still loading

  // Pull the most-played quiz in each category once the player is at half (or
  // fewer) dailies remaining, to suggest alongside (or, when all are done, in
  // place of) the still-to-play grid. Fetched lazily and once.
  useEffect(() => {
    if (!showPopular || popularCats) return undefined;
    let alive = true;
    fetch('/api/quiz/popular-by-category')
      .then((r) => r.json())
      .then((d) => { if (alive && d && Array.isArray(d.cats)) setPopularCats(d.cats); })
      .catch(() => {});
    return () => { alive = false; };
  }, [showPopular, popularCats]);

  // 25s auto-advance to the next game (win only; a loss shows the block without
  // the ticking clock so the player can retry or read the board first).
  const autoRun = revealed && won && completionKnown && !!nextTarget && !autoCancel && !runActive;
  useEffect(() => {
    if (!autoRun) return undefined;
    if (secs <= 0) {
      if (typeof window !== 'undefined') window.location.href = nextTarget.href;
      return undefined;
    }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [autoRun, secs, nextTarget]);

  // Leaderboard: close the popup, then smooth-scroll to the board below the card.
  const goBoard = () => {
    if (onLeaderboard) { onLeaderboard(); return; }
    if (onClose) onClose();
    if (typeof document !== 'undefined') {
      const el = document.getElementById(boardId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // "Full leaderboard": close the popup, tell the on-page DailyBoardPanel to
  // unfurl to the SAME view (Today / All-time / Combined) via a window event, and
  // scroll to it — so the reader lands on the full, expanded board, not the
  // collapsed tiles.
  const openPanel = (view) => {
    if (onLeaderboard) { onLeaderboard(); return; }
    if (onClose) onClose();
    if (typeof window !== 'undefined') { try { window.dispatchEvent(new CustomEvent('sot:open-daily-board', { detail: { view } })); } catch (e) {} }
    if (typeof document !== 'undefined') {
      const el = document.getElementById(boardId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Register CTA (guests): close the popup, then bring the on-page sign-up
  // form into view (falls back to the leaderboard, which sits just below it).
  const goRegister = () => {
    if (onClose) onClose();
    if (typeof document !== 'undefined') {
      const el = document.getElementById('daily-join') || document.getElementById(boardId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // "Try again": close the card, hand the board back to the caller's resetGame,
  // and return the reader to the top of the page so they land on the fresh
  // board rather than halfway down the leaderboard.
  const goReplay = () => {
    if (onClose) onClose();
    if (onReplay) onReplay();
    if (typeof window !== 'undefined') {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    }
  };

  const RING_C = 150.8; // 2*pi*24

  // Identity chip, shown INSIDE the IQ hero directly above the three figures
  // (owner 2026-08-01) so the ranks are visibly the viewer's own: a link to the
  // public player profile once a username exists, otherwise the sign-up CTA.
  const idChip = (hasEmail && username) ? (
    <a className="dec-idbox" href={`/player/${encodeURIComponent(username)}`} aria-label={`Open ${username}'s player profile`}>
      <span className="av" style={{ background: meta.accent }}>{String(username).slice(0, 1).toUpperCase()}</span>
      <span className="nm">{username}</span>
      <ChevronRight size={14} strokeWidth={2.4} style={{ flexShrink: 0, opacity: 0.7 }} />
    </a>
  ) : (
    <button type="button" className="dec-idbox guest" onClick={goRegister}>
      <UserPlus size={15} strokeWidth={2.2} />
      {/* The long label only fits beside the gain on desktop; the phone shows
          the short one (CSS-swapped, so the row never takes its own line). */}
      <span className="lg">Sign up to keep your rank</span>
      <span className="sm">Sign up</span>
    </button>
  );

  // The two suggestion cards lead with the game's own icon in its brand accent,
  // then its family, its one-liner and the fuller blurb, so a player who has
  // never opened that game knows what it is before tapping (owner 2026-08-01).
  const nextMeta = nextTarget ? (GAME_META[nextTarget.key] || GAME_META.crux) : null;
  const NextIcon = nextMeta ? (nextMeta.Fin || Puzzle) : Puzzle;
  const nextCat = nextTarget ? (CAT_META[nextTarget.cat] || CAT_META.word) : null;
  const grabMeta = grab ? (GAME_META[grab.key] || GAME_META.crux) : null;
  const GrabIcon = grabMeta ? (grabMeta.Fin || Puzzle) : Puzzle;
  const grabCat = grab ? (CAT_META[grab.cat] || CAT_META.word) : null;

  // Build the "more games" family blocks (still-to-play), then bin-pack them into
  // up to 3 columns (greedy: each family, largest first, into the shortest column)
  // so the grid fills evenly. The "Other quizzes" block was dropped from the popup.
  const famBlocks = CAT_ORDER
    .map((cat) => ({ type: 'fam', cat, cm: CAT_META[cat], items: todo.filter((g) => g.cat === cat) }))
    .filter((b) => b.items.length > 0)
    .map((b) => ({ ...b, h: 1 + b.items.length }));
  const showMore = famBlocks.length > 0;
  let packedCols = [];
  if (showMore) {
    const sorted = famBlocks.slice().sort((a, z) => z.h - a.h);
    const cols = [[], [], []], hs = [0, 0, 0];
    for (const b of sorted) {
      let i = 0;
      for (let j = 1; j < 3; j++) { if (hs[j] < hs[i]) i = j; }
      cols[i].push(b); hs[i] += b.h;
    }
    packedCols = cols.filter((c) => c.length > 0);
  }

  // Win-only celebratory confetti (fires when the player fully completes the
  // game). Deterministic + reduced-motion aware; the shared card means every
  // daily puzzle gets the same burst on a finish, with no per-client wiring.
  const confetti = React.useMemo(() => {
    if (!won) return [];
    const cols = [meta.accent, GOLD, T.blue, T.successDeep, T.danger, '#c026d3', '#0e7490'];
    return Array.from({ length: 96 }, (_, i) => {
      const w = 7 + ((i * 13) % 8);
      return {
        left: `${(i * 137) % 100}%`,
        w, h: Math.round(w * 1.6),
        color: cols[i % cols.length],
        dur: `${2.2 + ((i * 29) % 15) / 10}s`,
        delay: `${((i * 53) % 80) / 100}s`,
      };
    });
  }, [won, meta.accent]);

  // --- expanded-tile board rows ---------------------------------------------
  // Each rank tile expands in place to its board's top 10, the viewer's own row
  // highlighted, plus a "Full leaderboard" link to the on-page board below.
  function tileBoard(which) {
    if (which === 'iq') {
      const rows = (iq && Array.isArray(iq.window)) ? iq.window : [];
      return rows.map((r) => ({ rank: r.rank, name: r.name, val: `${(r.xp || 0).toLocaleString()} IQ`, me: !!r.me }));
    }
    if (which === 'today') {
      const rows = (todayGame && Array.isArray(todayGame.board)) ? todayGame.board : [];
      // Today's rows keep their score / time / misses so the expansion can render
      // the full results table; `val` stays for any single-column consumer.
      return rows.map((r) => ({
        rank: r.rank, name: r.username, val: fmtPts(r.points), me: !!(myKey && r.userKey === myKey),
        score: r.score, total: r.total, timeElapsed: r.timeElapsed, guessesUsed: r.guessesUsed, points: r.points,
        // End Game only: the attempt the solve landed on, and its tier. Null
        // elsewhere, so the misses column below is unchanged on every other game.
        tries: r.tries ?? null, egTier: r.egTier ?? null,
      }));
    }
    if (which === 'alltime') {
      const rows = (allTime && Array.isArray(allTime.board)) ? allTime.board : [];
      return rows.map((r) => ({ rank: r.rank, name: r.username, val: fmtPts(r.points), me: !!r.isMe }));
    }
    return [];
  }
  const fmtPts = (x) => (x == null ? '' : `${Math.round(Number(x) * 10) / 10} pts`);
  const fmtNum = (x) => (x == null ? '' : String(Math.round(Number(x) * 10) / 10));
  const fmtTime = (sec) => {
    if (sec == null) return '\u2014';
    const m = Math.floor(sec / 60), ss = sec % 60;
    return `${m}:${String(ss).padStart(2, '0')}`;
  };

  // --- archive completion (this game's drops played) ------------------------
  const playedCount = (drops || []).filter((d) => d.played).length;
  const totalDrops = (drops || []).length;
  const archivePct = totalDrops ? Math.round((playedCount / totalDrops) * 100) : null;

  // --- calendar month cells -------------------------------------------------
  const dropByISO = new Map((drops || []).map((d) => [d.dateISO, d]));
  const todayISO = etTodayEC();
  const monthYMs = (drops && drops.length) ? {
    earliest: drops[0].dateISO.slice(0, 7),
    latest: todayISO.slice(0, 7),
  } : { earliest: todayISO.slice(0, 7), latest: todayISO.slice(0, 7) };
  const [calY, calM] = calMonth.split('-').map(Number);
  const monthLabel = `${MONTH_NAMES[(calM - 1) % 12]} ${calY}`;
  const firstWeekday = new Date(Date.UTC(calY, calM - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(calY, calM, 0)).getUTCDate();
  const calCells = [];
  for (let k = 0; k < firstWeekday; k++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);
  const shiftMonth = (delta) => {
    let y = calY, m = calM + delta;
    while (m < 1) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    setCalMonth(`${y}-${String(m).padStart(2, '0')}`);
  };
  const canPrev = calMonth > monthYMs.earliest;
  const canNext = calMonth < monthYMs.latest;

  // Render one rank tile (plain helper, not a nested component). `prov` (a guest's
  // unclaimed standing) is accepted for compatibility but no longer rendered: the
  // old " prov." badge read as a modifier on the field size and duplicated the
  // guest claim banner below (owner 2026-08-01).
  const renderTile = (id, label, rank, field, dash, prov) => (
    <button
      type="button"
      className={`dec-tile${openTile === id ? ' open' : ''}${(!dash && rank && rank <= 3) ? ` medal m${rank}` : ''}`}
      key={id}
      aria-label={`Expand ${label} leaderboard`}
      aria-expanded={openTile === id}
      onClick={() => setOpenTile((o) => (o === id ? null : id))}
    >
      <div className="dec-tile-lbl">{label}</div>
      {dash ? (
        <div className="dec-tile-rk"><span className="dash">—</span></div>
      ) : rank ? (
        <div className="dec-tile-rk">#{rank}</div>
      ) : (
        <div className="dec-tile-rk"><span className="dash">·</span></div>
      )}
      <div className="dec-tile-of">{field ? <>of {Number(field).toLocaleString()} player{Number(field) === 1 ? '' : 's'}</> : (dash ? 'registered only' : ' ')}</div>
      <span className="dec-tile-mx">
        <ChevronDown size={15} strokeWidth={2.4} style={{ transform: openTile === id ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }} />
      </span>
    </button>
  );

  // The archive tile: third in the rank row, on desktop AND mobile, replacing
  // the All Games (combined) tile which now lives only on the quizzes front
  // page. It reads local data the card already has (this game's drops), so
  // unlike the tile it replaced it costs no request and never shows a loading
  // state. The ring fills to the share of drops played, percent inside.
  const renderArchiveTile = () => (
    <button
      type="button"
      className={`dec-tile dec-tile-arc${calOpen ? ' open' : ''}`}
      key="archive"
      aria-label="Open the archive calendar"
      aria-expanded={calOpen}
      onClick={() => setCalOpen((v) => !v)}
    >
      <div className="dec-tile-lbl">{selfName} Archive</div>
      <div className="dec-tile-ring">
        <span className="dec-arcring">
          <svg width="54" height="54" viewBox="0 0 56 56" aria-hidden="true">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#dbe6f7" strokeWidth="4.5" />
            {/* A 0% archive still shows a sliver so the ring reads as a meter
                rather than an empty circle, matching the old progress bar. */}
            <circle
              cx="28" cy="28" r="24" fill="none" stroke={BLUE} strokeWidth="4.5" strokeLinecap="round"
              transform="rotate(-90 28 28)"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - Math.max(0.02, (archivePct || 0) / 100))}
            />
          </svg>
          <span className="num">{archivePct != null ? `${archivePct}%` : '—'}</span>
        </span>
      </div>
      <div className="dec-tile-of">{totalDrops ? <>{playedCount} of {totalDrops} played</> : ' '}</div>
      <div className="dec-arcbar" aria-hidden="true"><i style={{ width: `${Math.max(2, archivePct || 0)}%` }} /></div>
      <span className="dec-tile-mx">
        <ChevronDown size={15} strokeWidth={2.4} style={{ transform: calOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }} />
      </span>
    </button>
  );

  // The month calendar, opened by the archive tile above.
  const calendarEl = (
    <div className="dec-cal">
      <div className="dec-cal-hd">
        <span className="dec-cal-mo">{monthLabel}</span>
        <div className="dec-cal-nav">
          <button type="button" onClick={() => shiftMonth(-1)} disabled={!canPrev} aria-label="Previous month"><ChevronLeft size={16} strokeWidth={2.4} /></button>
          <button type="button" onClick={() => shiftMonth(1)} disabled={!canNext} aria-label="Next month"><ChevronRight size={16} strokeWidth={2.4} /></button>
        </div>
      </div>
      <div className="dec-cal-grid">
        {WEEKDAYS.map((w, i) => <div className="dec-cal-wd" key={`wd${i}`}>{w}</div>)}
        {calCells.map((d, i) => {
          if (d == null) return <div className="dec-cal-cell empty" key={`e${i}`} />;
          const iso = `${calMonth}-${String(d).padStart(2, '0')}`;
          const drop = dropByISO.get(iso);
          const isToday = iso === todayISO;
          if (!drop) return <div className={`dec-cal-cell none${isToday ? ' today' : ''}`} key={iso}>{d}</div>;
          const cls = drop.played ? 'played' : 'unplayed';
          return <a className={`dec-cal-cell ${cls}${isToday ? ' today' : ''}`} href={drop.href} key={iso} title={drop.played ? 'Played' : 'Play this drop'}>{d}</a>;
        })}
      </div>
      <div className="dec-cal-key">
        <span><span className="dec-cal-sw" style={{ background: '#e8f5ec', border: '1px solid #bfe3ca' }} />Played</span>
        <span><span className="dec-cal-sw" style={{ background: T.white, border: `1px solid ${BORD}` }} />Unplayed</span>
        <span><span className="dec-cal-sw" style={{ background: T.white, boxShadow: `0 0 0 2px ${BLUE}` }} />Today</span>
      </div>
    </div>
  );

  const inner = (
    <div className="dec-card" style={modal ? { position: 'relative', maxHeight: '92vh', overflowY: 'auto' } : undefined}>
      {modal && (
        <button type="button" className="dec-x" onClick={onClose} aria-label="Close">
          <X size={14} strokeWidth={2.6} />
        </button>
      )}
      <style>{`
        .dec-card{background:var(--white);border:1px solid ${BORD};border-radius:16px;padding:20px 22px 16px;max-width:760px;width:100%;margin:0 auto;font-family:${SANS};color:${INK};}
        .dec-backdrop{position:fixed;inset:0;z-index:85;background:rgba(20,22,28,0.55);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;}
        .dec-x{position:absolute;top:7px;right:13px;width:24px;height:24px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:7px;background:var(--white);border:1px solid ${BORD};color:${SLATE};cursor:pointer;z-index:3;}
        .dec-x:hover{color:${INK};background:var(--surface);}
        /* Modal scroller: round the track to match the card's 16px corners
           (owner 2026-07-31). The track margin insets it below the curve so the
           bar never pokes into the rounded corner. */
        .dec-card{scrollbar-width:thin;scrollbar-color:#c9cfda transparent;}
        .dec-card::-webkit-scrollbar{width:10px;}
        .dec-card::-webkit-scrollbar-track{background:transparent;border-radius:16px;margin:16px 0;}
        .dec-card::-webkit-scrollbar-thumb{background:#c9cfda;border-radius:999px;border:2px solid var(--white);background-clip:padding-box;}
        .dec-card::-webkit-scrollbar-thumb:hover{background:#aeb6c5;background-clip:padding-box;}

        .dec-head{margin-bottom:12px;}
        .dec-check{width:30px;height:30px;border-radius:50%;background:#e8f5ec;color:var(--success-deep);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
        .dec-check.loss{background:#fdecec;color:${RUST};}
        .dec-check.near{background:#fdf2e2;color:${AMBER};}
        /* Title line: the result on the left, the player chip hard right. The
           right padding keeps the chip clear of the modal's close button. */
        .dec-toprow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-right:38px;margin-bottom:5px;}
        .dec-topid{display:flex;min-width:0;flex:0 1 auto;}
        .dec-titlerow{display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;min-width:0;}
        .dec-title{font-size:25px;font-weight:800;letter-spacing:-.02em;color:${INK};}
        .dec-detail{font-size:13px;font-weight:600;color:${SLATE};}
        .dec-detailm{display:none;font-size:12px;font-weight:600;color:${SLATE};margin:-1px 0 0;}
        .dec-sub{display:flex;align-items:center;gap:7px;font-size:13px;color:${SLATE};flex-wrap:wrap;}
        .dec-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
        .dec-sub b{font-weight:800;color:${INK};}
        .dec-sub .sc{color:${SLATE};}
        .dec-answer{display:flex;align-items:baseline;gap:9px;margin:9px 0 0;}
        .dec-answer-lbl{font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:${SLATE};flex-shrink:0;}
        .dec-answer-word{font-size:21px;font-weight:800;letter-spacing:-.02em;color:${RUST};}
        .dec-idbox{display:inline-flex;align-items:center;gap:8px;font-family:${SANS};font-size:12.5px;font-weight:700;color:${INK};background:#f4f6fa;border:1px solid ${BORD};border-radius:999px;padding:5px 13px 5px 5px;max-width:100%;}
        .dec-idbox .av{width:23px;height:23px;border-radius:50%;color:var(--white);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;}
        .dec-idbox .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        /* Guest CTA: the long label on desktop, the short one on a phone. */
        .dec-idbox .sm{display:none;}
        button.dec-idbox{cursor:pointer;color:${BLUE};background:#eff4fd;border-color:#cfe0fb;padding:8px 15px;}
        button.dec-idbox:hover{background:#e4eefc;}
        /* Registered chip links to the public player profile; the chevron marks
           it as clickable (owner 2026-07-31, replacing the Share-my-day slot). */
        a.dec-idbox{text-decoration:none;cursor:pointer;transition:background .12s ease;}
        a.dec-idbox:hover{background:#eef0f4;}
        /* Share / challenge bar: a full-width feature under the rank tiles
           (owner 2026-08-01), sized to be the second thing a finisher reaches
           for after their score. Opens the shared ShareCreditPop through the
           caller's own share handler. */
        /* Action row: share + back, side by side (owner 2026-08-05). Replaces
           the full-width black share bar. Neither button is black now: share
           carries the promo so it takes brand blue, and Back to Main reuses the
           exact treatment of the replay bar below it so the two read as peers
           rather than as a third visual language on an already busy card.
           1.55 / 1 split gives share the emphasis, since it is the one with
           money attached. */
        .dec-actions{display:grid;grid-template-columns:1.55fr 1fr;gap:10px;margin-bottom:11px;}
        .dec-sharebar{display:flex;align-items:center;gap:11px;width:100%;box-sizing:border-box;text-align:left;font-family:${SANS};color:var(--white);background:${BLUE};border:2px solid ${BLUE};border-radius:14px;padding:12px 13px;cursor:pointer;transition:filter .12s ease;}
        .dec-sharebar:hover{filter:brightness(1.08);}
        .dec-sharebar .ic{width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .dec-sharebar .tx{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;}
        .dec-sharebar .t{font-size:13.5px;font-weight:800;letter-spacing:-.01em;line-height:1.25;}
        /* The prize figure inside the teaser: gold on the blue bar, heavier
           than the sentence around it, underlined so it reads as the offer. */
        .dec-sharebar .t .pz{font-weight:900;color:#ffd76b;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:2px;}
        .dec-sharebar .s{font-size:11px;font-weight:600;color:rgba(255,255,255,.72);}
        .dec-back{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;box-sizing:border-box;font-family:${SANS};font-weight:800;font-size:13.5px;color:${INK};text-decoration:none;background:linear-gradient(180deg,#ffffff 0%,#f3f5f9 100%);border:2px solid #d8dee9;border-radius:14px;padding:12px 13px;cursor:pointer;transition:filter .12s ease;}
        .dec-back:hover{filter:brightness(0.985);}
        .dec-back .bi{color:${SLATE};flex-shrink:0;}
        /* Contest footnote: carries the asterisk on the share label. Tappable,
           opening the same rules page the pop-up links to. */
        .dec-fine{grid-column:1/-1;font-size:10.5px;line-height:1.45;color:#8a92a6;margin:-3px 2px 0;}
        .dec-fine a{color:#8a92a6;text-decoration:underline;}
        /* Quick replay: a quiet full-width bar directly under the share bar
           (owner 2026-08-04). Some games invite an immediate second run, and
           the old "Try again" chip was buried in the footer below the whole
           game grid. Carries the same 2px border, gradient fill and shadow as
           the Up next / Easiest cards below it, in a neutral key so it reads
           as their peer without competing with the blue and gold. */
        .dec-replay{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;box-sizing:border-box;font-family:${SANS};font-weight:800;font-size:13.5px;color:${INK};background:linear-gradient(180deg,#ffffff 0%,#f3f5f9 100%);border:2px solid #d8dee9;box-shadow:0 3px 14px rgba(15,23,42,.07);border-radius:16px;padding:12px 14px;margin-bottom:10px;cursor:pointer;transition:filter .12s ease;}
        .dec-replay:hover{filter:brightness(0.985);}
        .dec-replay .rs{font-weight:600;font-size:11.5px;color:#8a92a6;}
        /* Guest claim banner: the loudest element on the card by design. */
        .dec-claim{position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;text-align:left;font-family:${SANS};color:${NAVY};background:linear-gradient(180deg,#f3f7ff,#e4edff);border:2px solid ${BLUE};border-radius:13px;padding:11px 13px;margin-bottom:10px;cursor:pointer;animation:dec-claimpulse 1.8s ease-in-out infinite;}
        .dec-claim:hover{filter:brightness(1.03);}
        .dec-claim .ic{width:32px;height:32px;border-radius:9px;background:${BLUE};color:var(--white);display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;}
        .dec-claim .tx{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;position:relative;z-index:1;}
        .dec-claim .t{font-size:13.5px;font-weight:800;letter-spacing:-.01em;}
        .dec-claim .s{font-size:11.5px;font-weight:600;color:${SLATE};}
        .dec-claim .cta{flex-shrink:0;position:relative;z-index:1;font-size:11.5px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:var(--white);background:${BLUE};border-radius:999px;padding:7px 13px;animation:dec-claimblink 1.8s ease-in-out infinite;}
        .dec-claim::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 32%,rgba(255,255,255,.7) 50%,transparent 68%);transform:translateX(-100%);animation:dec-claimsweep 2.8s ease-in-out infinite;pointer-events:none;}
        @keyframes dec-claimpulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.36);}55%{box-shadow:0 0 0 7px rgba(37,99,235,0);}}
        @keyframes dec-claimblink{0%,100%{opacity:1;}50%{opacity:.52;}}
        @keyframes dec-claimsweep{0%{transform:translateX(-100%);}55%,100%{transform:translateX(100%);}}
        @media(prefers-reduced-motion:reduce){.dec-claim,.dec-claim .cta{animation:none;}.dec-claim::after{display:none;}}

        .dec-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:10px;}
        .dec-tiles-loading{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;height:74px;margin-bottom:10px;border:1px solid ${BORD};border-radius:12px;background:var(--surface);font-family:${MONO};font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:${SLATE};}
        .dec-tiles-loading::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:dec-shim 1.15s ease-in-out infinite;}
        @media(prefers-reduced-motion:reduce){.dec-tiles-loading::after{animation:none;}}
        .dec-tile-cal{position:absolute;top:11px;right:8px;color:${SLATE};}
        /* Tiles carry the same confidence as the hero (owner 2026-08-01): a 2px
           border, white ground, soft shadow and a bigger numeral, so the row
           does not read as a pale afterthought under the navy panel. */
        .dec-tile{position:relative;overflow:hidden;display:block;width:100%;text-align:center;font-family:inherit;cursor:pointer;border:2px solid #cfdcf4;background:linear-gradient(180deg,var(--white),#eff5ff);border-radius:14px;padding:15px 10px 12px;min-width:0;box-shadow:0 3px 13px rgba(20,30,60,.08);transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease;}
        /* A colored cap across the top of every tile: the row reads as three
           deliberate cards rather than three pale boxes (owner 2026-08-01). */
        .dec-tile::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:${BLUE};}
        .dec-tile:hover{border-color:${BLUE};box-shadow:0 5px 18px rgba(37,99,235,.16);transform:translateY(-1px);}
        .dec-tile.open{border-color:${BLUE};box-shadow:0 0 0 1px ${BLUE},0 5px 18px rgba(37,99,235,.16);}
        /* Podium tint: a top-3 finish is the whole point of the row, so it is
           colored gold / silver / bronze rather than left generic blue. */
        .dec-tile.m1{border-color:#e3ba57;background:linear-gradient(180deg,#fffdf5,#fdf3d9);box-shadow:0 3px 14px rgba(190,145,25,.20);}
        .dec-tile.m1::before{background:linear-gradient(90deg,#d9a327,#f2d489);}
        .dec-tile.m1 .dec-tile-lbl{color:#96700d;}
        .dec-tile.m1 .dec-tile-rk{color:#8a6407;}
        .dec-tile.m2{border-color:#c3cad6;background:linear-gradient(180deg,var(--white),#f1f3f7);box-shadow:0 3px 13px rgba(40,50,70,.13);}
        .dec-tile.m2::before{background:linear-gradient(90deg,#98a2b3,#d6dbe4);}
        .dec-tile.m2 .dec-tile-lbl{color:#5d6779;}
        .dec-tile.m2 .dec-tile-rk{color:#414b5e;}
        .dec-tile.m3{border-color:#dcb695;background:linear-gradient(180deg,#fffbf7,#fbeee2);box-shadow:0 3px 13px rgba(150,95,45,.16);}
        .dec-tile.m3::before{background:linear-gradient(90deg,#b8703c,#e2b189);}
        .dec-tile.m3 .dec-tile-lbl{color:#8c5527;}
        .dec-tile.m3 .dec-tile-rk{color:#7d4a1f;}
        .dec-tile-lbl{font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:${BLUE};padding:0 18px;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:28px;}
        /* Big centered numeral, with the field size spelled out on its own
           line below (owner 2026-07-31: larger ranks, easier-to-read text). */
        .dec-tile-rk{font-size:43px;font-weight:800;letter-spacing:-.035em;color:${NAVY};line-height:1.02;margin-top:2px;display:block;}
        .dec-tile-rk .dash{color:#c2c8d2;}
        .dec-tile-of{font-size:12px;font-weight:700;color:${SLATE};display:block;margin-top:4px;}
        .dec-tile-mx{position:absolute;top:9px;right:6px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:${SLATE};pointer-events:none;}
        .dec-tile.open .dec-tile-mx,.dec-tile:hover .dec-tile-mx{color:${BLUE};}
        /* Archive tile: same shell as a rank tile, a completion ring where the
           rank numeral sits. No chevron, because it opens the calendar below
           rather than a leaderboard. */
        .dec-tile-arc.open{border-color:${BLUE};box-shadow:0 0 0 1px ${BLUE},0 5px 18px rgba(37,99,235,.16);}
        /* Ring sized around its widest label, "100%", measured rather than
           guessed: at 12px it renders 40px wide, and a 50px ring with a 5px
           stroke leaves 41px of clear middle, so it fit by one pixel and read as
           cramped. 54px outer, a 4.5px stroke and 11.5px text give 45px of clear
           middle for a 38px label, i.e. about 3px of air each side. */
        .dec-tile-ring{display:flex;align-items:center;justify-content:center;height:58px;margin-top:3px;}
        .dec-arcring{position:relative;display:block;width:58px;height:58px;}
        .dec-arcring svg{width:58px;height:58px;}
        .dec-arcring svg{display:block;}
        .dec-arcring .num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:800;letter-spacing:-.04em;color:${INK};font-variant-numeric:tabular-nums;}

        /* IQ hero: the gain is THE headline number of the card (owner redesign
           2026-07-31), a full-width banner above the rank tiles, led by the brain
           meter from the shareable day card. The brain fills with the player's
           progress through today's slate and turns green once the slate is done,
           the gain counts up from zero, and the panel pulses as it lands. Expands
           to the player's slot in the IQ ranking exactly like a tile. */
        /* Weight (owner 2026-08-01): a pale panel lost the page to the black
           share bar, so the hero is now a FILLED dark navy block with light
           blue type (dark green once the slate is complete). It is the darkest,
           largest element on the card by design. */
        .dec-iqhero{position:relative;overflow:hidden;display:block;width:100%;text-align:center;font-family:inherit;border:1px solid #1c4796;background:linear-gradient(180deg,#123170 0%,#0b2151 100%);box-shadow:0 6px 20px rgba(9,26,64,.26);border-radius:17px;padding:18px 18px 15px;margin-bottom:11px;transition:border-color .12s ease,box-shadow .12s ease,background .3s ease;}
        .dec-iqhero.full{border-color:#125c3e;background:linear-gradient(180deg,#0d3f2b 0%,#07301f 100%);box-shadow:0 6px 20px rgba(6,45,28,.26);}
        .dec-iqhero:hover{border-color:#2f6ad0;}
        .dec-iqhero.full:hover{border-color:#1a8055;}
        .dec-iqhero.open{border-color:#93c5fd;box-shadow:0 0 0 1px #93c5fd;}
        .dec-iqhero.full.open{border-color:#86efac;box-shadow:0 0 0 1px #86efac;}
        /* Light rays behind the numeral, revealed by the landing pulse. */
        .dec-iqhero-rays{position:absolute;top:50%;left:50%;width:420px;height:420px;margin:-210px 0 0 -210px;pointer-events:none;opacity:0;background:radial-gradient(circle,rgba(147,197,253,.30) 0%,rgba(147,197,253,0) 62%);}
        .dec-iqhero.full .dec-iqhero-rays{background:radial-gradient(circle,rgba(134,239,172,.28) 0%,rgba(134,239,172,0) 62%);}
        .dec-iqhero.landed .dec-iqhero-rays{animation:dec-iqrays 1.1s ease-out 1;}
        .dec-iqhero.landed{animation:dec-iqpop .5s cubic-bezier(.34,1.56,.64,1) 1;}
        /* Transparent expand layer under the content: the panel toggles the IQ
           ranking, while the identity chip inside it stays independently
           clickable (content is pointer-transparent except that chip). */
        .dec-iqhero-hit{position:absolute;inset:0;z-index:1;width:100%;height:100%;padding:0;border:none;background:transparent;cursor:pointer;}
        .dec-iqhero-in{position:relative;z-index:2;pointer-events:none;display:flex;align-items:center;justify-content:flex-start;gap:18px;}
        .dec-iqhero-in a,.dec-iqhero-in button{pointer-events:auto;}
        /* Brain meter: empty art as the base, the filled art clipped to the
           slate fraction and anchored to the bottom, so it fills upward. */
        .dec-brain{position:relative;display:block;flex:0 0 auto;width:104px;height:94px;}
        .dec-brain img{display:block;width:104px;height:94px;object-fit:contain;}
        /* The art is drawn for the day card's WHITE background. On the dark
           panel the empty state is inverted to a dim pale outline and the
           filled art is brightened, so unfilled-vs-filled still reads as a
           meter (owner dark hero, 2026-08-01). */
        .dec-brain-base{opacity:1;}
        .dec-brain-fill img{filter:brightness(1.75) saturate(1.25);}
        .dec-brain-fill{position:absolute;left:0;bottom:0;width:104px;height:0;overflow:hidden;display:flex;align-items:flex-end;transition:height .9s cubic-bezier(.22,1,.36,1);}
        .dec-iqhero-lead{display:flex;align-items:center;gap:16px;flex:0 0 auto;min-width:0;}
        .dec-iqhero-txt{display:flex;flex-direction:column;align-items:flex-start;min-width:0;}
        /* Desktop: gain anchors the left, a hairline, then the three figures. */
        .dec-iqhero-rule{flex:0 0 auto;width:1px;align-self:stretch;margin:2px 0;background:rgba(147,197,253,.28);}
        .dec-iqhero.full .dec-iqhero-rule{background:rgba(134,239,172,.26);}
        .dec-iqhero-stats{flex:1 1 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:10px;min-width:0;}
        .dec-iqhero-stats:empty{display:none;}
        .dec-iqhero-stats .st{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:0;}
        .dec-iqhero-stats .k{font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;color:#8ab2ee;white-space:nowrap;}
        .dec-iqhero.full .dec-iqhero-stats .k{color:#82d3aa;}
        .dec-iqhero-stats .v{font-size:31px;font-weight:800;letter-spacing:-.025em;line-height:1.05;color:#dbeafe;font-variant-numeric:tabular-nums;}
        .dec-iqhero.full .dec-iqhero-stats .v{color:#d6f7e4;}
        .dec-iqhero-stats .m{font-size:11px;font-weight:700;color:#9dc0ef;}
        .dec-iqhero.full .dec-iqhero-stats .m{color:#95d9b7;}
        .dec-iqhero-lbl{display:block;font-family:${SANS};font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8ab2ee;}
        .dec-iqhero.full .dec-iqhero-lbl{color:#82d3aa;}
        .dec-iqhero-gain{display:block;font-size:68px;font-weight:800;letter-spacing:-.04em;line-height:1;color:#cfe3ff;margin-top:2px;font-variant-numeric:tabular-nums;text-shadow:0 2px 18px rgba(147,197,253,.35);}
        .dec-iqhero.full .dec-iqhero-gain{color:#cdf5df;text-shadow:0 2px 18px rgba(134,239,172,.32);}
        .dec-iqhero-gain .dash{color:#5f81b8;}
        .dec-iqhero-slate{display:block;font-size:12px;font-weight:700;color:#9dc0ef;margin-top:4px;}
        .dec-iqhero.full .dec-iqhero-slate{color:#95d9b7;}
        /* MOBILE ONLY: the footnote row is the phone presentation of the three
           figures that .dec-iqhero-stats shows on desktop. Hidden here and
           switched back on in the max-width:640px block, so exactly one of the
           two is ever rendered (and only one is in the a11y tree). Setting this
           on the source rule matters: an earlier display:none loses to this
           declaration. */
        .dec-iqhero-sub{position:relative;display:none;flex-wrap:wrap;justify-content:center;gap:4px 16px;margin-top:9px;padding-top:8px;border-top:1px solid rgba(147,197,253,.22);font-size:12.5px;color:#9dc0ef;}
        .dec-iqhero.full .dec-iqhero-sub{border-top-color:rgba(134,239,172,.22);color:#95d9b7;}
        .dec-iqhero-sub b{font-weight:800;color:#dbeafe;}
        .dec-iqhero.full .dec-iqhero-sub b{color:#d6f7e4;}
        .dec-iqhero-sub:empty{display:none;}
        .dec-iqhero-mx{position:absolute;top:10px;right:9px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:#8ab2ee;pointer-events:none;}
        .dec-iqhero.full .dec-iqhero-mx{color:#82d3aa;}
        .dec-iqhero.open .dec-iqhero-mx,.dec-iqhero:hover .dec-iqhero-mx{color:#dbeafe;}
        .dec-iqhero.full.open .dec-iqhero-mx,.dec-iqhero.full:hover .dec-iqhero-mx{color:#d6f7e4;}
        @keyframes dec-iqpop{0%{transform:scale(1);}38%{transform:scale(1.028);}100%{transform:scale(1);}}
        @keyframes dec-iqrays{0%{opacity:0;transform:scale(.6);}30%{opacity:1;}100%{opacity:0;transform:scale(1.25);}}
        @media(prefers-reduced-motion:reduce){
          .dec-iqhero.landed,.dec-iqhero.landed .dec-iqhero-rays{animation:none;}
          .dec-brain-fill{transition:none;}
        }

        .dec-expand{border:1px solid ${BORD};border-radius:12px;padding:11px 13px 9px;margin:-2px 0 12px;background:var(--white);}
        .dec-expand-hd{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;}
        .dec-expand-ti{font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:${SLATE};}
        .dec-expand-full{font-size:11.5px;font-weight:800;color:${BLUE};background:none;border:none;padding:0;cursor:pointer;display:inline-flex;align-items:center;gap:3px;}
        .dec-lbrow{display:flex;align-items:center;gap:9px;font-size:13px;padding:4px 7px;border-radius:7px;}
        .dec-lbrow.me{background:#eff4fd;}
        .dec-lbrow .rk{font-family:${MONO};font-size:11px;color:${FADED};width:26px;flex-shrink:0;}
        .dec-lbrow .nm{font-weight:700;color:${INK};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}
        .dec-lbrow.me .nm{font-weight:800;}
        .dec-lbrow .vl{font-family:${MONO};font-size:11.5px;color:${SLATE};flex-shrink:0;}
        .dec-lbempty{font-size:12.5px;color:${FADED};padding:6px 2px;}
        /* Today's expansion is a results TABLE (owner, 2026-08-01): the same
           rank / player / score / time / misses / points columns the on-page
           DailyBoardPanel shows, so a player can see WHY they placed where they
           did. Keep the two grids in sync. On a phone the six columns do not
           fit; rather than hiding Time and Miss (which are the explanation) the
           table scrolls sideways inside its own box, header row and score rows
           together in one scroller so they never desync.
           NOTE the dec-lbg* namespace: the obvious .dec-g / .dec-gh names
           collide with the EXISTING .dec-gh family-header pill further down
           (display:flex), which won on source order and flattened this header
           row on the first deploy. */
        .dec-lbscroll{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;margin:0 -3px;padding:0 3px;scrollbar-width:thin;}
        .dec-lbscroll-in{min-width:402px;}
        /* .nomiss = a game that posts no wrong-answer figure (Suds, Bracket,
           Feud, Outrank, Outwit): five columns, no empty zero column. */
        .dec-lbscroll-in.nomiss{min-width:344px;}
        .dec-lbg{display:grid;grid-template-columns:28px minmax(72px,1fr) 52px 52px 58px 46px;gap:8px;align-items:center;}
        .nomiss .dec-lbg{grid-template-columns:28px minmax(72px,1fr) 52px 52px 46px;}
        .dec-lbghead{padding:0 7px 6px;}
        .dec-lbghead .h{font-family:${MONO};font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:${FADED};}
        .dec-lbgrow{padding:5px 7px;border-radius:7px;}
        .dec-lbgrow.me{background:#eff4fd;}
        .dec-lbg .rk{font-family:${MONO};font-size:11px;color:${FADED};}
        .dec-lbg .nm{font-weight:700;color:${INK};font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .dec-lbgrow.me .nm{font-weight:800;}
        .dec-lbg .num{font-family:${MONO};font-size:11px;color:${SLATE};text-align:right;font-variant-numeric:tabular-nums;}
        .dec-lbg .pts{font-weight:800;color:${INK};text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px;}
        .dec-lbswipe{display:none;font-family:${MONO};font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:${FADED};padding:5px 2px 0;}
        .dec-note{font-size:11px;color:${FADED};line-height:1.45;margin:9px 2px 1px;}
        @media(max-width:520px){.dec-lbswipe{display:block;}}

        .dec-slip{display:flex;align-items:center;gap:8px;font-size:12.5px;padding:9px 13px;border-radius:11px;margin-bottom:10px;width:100%;text-align:left;}
        .dec-slip.info{background:#eff4fd;border:1px solid #d7e3f8;color:${SLATE};}
        .dec-slip.info b{font-weight:800;color:${NAVY};}
        .dec-slip.neutral{background:var(--surface);border:1px solid ${BORD};color:${SLATE};cursor:pointer;font-family:${SANS};font-weight:600;}
        .dec-slip.neutral:hover{background:#eef0f4;}
        .dec-slip .clink{font:inherit;font-weight:800;color:${BLUE};background:none;border:none;padding:0;text-decoration:underline;text-underline-offset:2px;cursor:pointer;}
        .dec-slip .chev{margin-left:auto;display:inline-flex;color:${SLATE};}
        .dec-slip-right{margin-left:auto;display:inline-flex;align-items:center;gap:9px;flex:none;}
        .dec-slip-pct{font-weight:800;color:${INK};white-space:nowrap;}

        .dec-cal{border:1px solid ${BORD};border-radius:12px;padding:12px 13px;margin:-2px 0 12px;background:var(--white);}
        .dec-cal-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;}
        .dec-cal-mo{font-size:14px;font-weight:800;color:${INK};}
        .dec-cal-nav{display:flex;gap:6px;}
        .dec-cal-nav button{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid ${BORD};background:var(--white);color:${SLATE};cursor:pointer;}
        .dec-cal-nav button:disabled{opacity:.4;cursor:default;}
        .dec-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
        .dec-cal-wd{font-family:${MONO};font-size:9.5px;color:${FADED};text-align:center;padding-bottom:2px;}
        .dec-cal-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border-radius:8px;color:#c2c8d2;}
        .dec-cal-cell.empty{background:transparent;}
        .dec-cal-cell.none{color:#c9cdd6;}
        a.dec-cal-cell{text-decoration:none;}
        a.dec-cal-cell.played{background:#e8f5ec;color:var(--success-deep);border:1px solid #bfe3ca;}
        a.dec-cal-cell.unplayed{background:var(--white);color:${SLATE};border:1px solid ${BORD};}
        a.dec-cal-cell.unplayed:hover{border-color:${BLUE};color:${BLUE};}
        a.dec-cal-cell.today{box-shadow:0 0 0 2px ${BLUE};}
        .dec-cal-key{display:flex;flex-wrap:wrap;gap:10px 14px;margin-top:10px;font-size:11px;color:${FADED};}
        .dec-cal-key span{display:inline-flex;align-items:center;gap:5px;}
        .dec-cal-sw{width:11px;height:11px;border-radius:3px;flex-shrink:0;}

        .dec-duo{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px;}
        .dec-sk{position:relative;overflow:hidden;background:#dfe6f1;border-radius:6px;}
        .dec-sk::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:dec-shim 1.15s ease-in-out infinite;}
        @keyframes dec-shim{100%{transform:translateX(100%);}}
        .dec-sk-ring{width:56px;height:56px;border-radius:16px;flex-shrink:0;}
        .dec-sk-line{height:11px;}
        .dec-sk-btn{height:34px;border-radius:10px;}
        .dec-fadein{animation:dec-fadein .32s ease both;}
        @keyframes dec-fadein{from{opacity:0;transform:translateY(3px);}to{opacity:1;transform:none;}}
        @media(prefers-reduced-motion:reduce){.dec-sk::after{animation:none;}.dec-fadein{animation:none;}}
        /* Popular-quiz suggestion rows only: let the full title wrap to a 2nd line
           (daily-game rows keep their single-line ellipsis), and give every tile
           the SAME height so the grid looks uniform regardless of title length. */
        .dec-row.dec-pop{align-items:flex-start;min-height:72px;box-sizing:border-box;}
        .dec-row.dec-pop .nm{white-space:normal;}
        .dec-row.dec-pop .nm span.t{white-space:normal;overflow:visible;text-overflow:clip;}
        .dec-row.dec-pop .play{align-self:center;}
        /* The two suggestion cards (owner rework 2026-08-01): each leads with
           the game's own icon in its brand accent, then family + one-liner, then
           a full sentence describing the game. No live figures, by owner ruling:
           the job of these cards is to sell the next game, not report numbers. */
        /* Up next is the card that should pull the finisher into another game,
           so it carries the same 2px/shadow weight as the IQ hero and a taller,
           shadowed primary button (owner 2026-08-01). The Easiest card stays a
           step quieter on purpose: it is the secondary offer. */
        .dec-nx{border:2px solid #bcd6fb;background:linear-gradient(180deg,#f2f7ff 0%,#e6effd 100%);box-shadow:0 3px 14px rgba(37,99,235,.10);border-radius:16px;padding:15px 16px;display:flex;flex-direction:column;gap:12px;min-width:0;}
        .dec-nx-top{flex:1 1 auto;display:flex;align-items:center;gap:13px;min-width:0;}
        /* The icon takes the same square tile as the Easiest card (owner
           2026-08-04): the countdown ring that used to wrap it made this one
           icon a circle and reshaped the card. The countdown now rides beside
           the game name instead. */
        .dec-nx-ico{width:60px;height:60px;border-radius:16px;background:var(--white);border:1px solid #bcd6fb;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .dec-nx-ico > svg{width:22px;height:22px;}
        .dec-eye{font-family:${MONO};font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px;}
        .dec-nx-name{display:flex;align-items:center;flex-wrap:wrap;gap:5px 8px;font-size:24px;font-weight:800;letter-spacing:-.025em;color:${INK};line-height:1.1;}
        .dec-nx-cd{font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#2b5bb5;background:rgba(37,99,235,.10);border:1px solid #bcd6fb;border-radius:999px;padding:3px 8px;white-space:nowrap;}
        .dec-nx-fam{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:${SLATE};margin-top:3px;min-width:0;}
        .dec-nx-fam,.dec-ez-fam{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .dec-nx-btns{display:flex;gap:7px;}
        .dec-nx-btns .b{flex:1;justify-content:center;font-family:${SANS};font-weight:800;font-size:14.5px;border-radius:11px;padding:13px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none;border:1px solid #ccd8ea;background:var(--white);color:${SLATE};}
        .dec-nx-btns .b.primary{flex:1.7;background:${BLUE};border-color:${BLUE};color:var(--white);box-shadow:0 3px 10px rgba(37,99,235,.30);}
        .dec-nx-btns .b.primary:hover{background:var(--blue-deep);filter:none;}
        .dec-nx-btns .b:hover{filter:brightness(0.98);}

        /* Same weight as Up next, in the gold key: 2px border, gradient fill,
           shadow, 60px icon and a taller shadowed button (owner 2026-08-01). */
        .dec-ez{border:2px solid #eed79c;background:linear-gradient(180deg,#fffaee 0%,#fdf2d9 100%);box-shadow:0 3px 14px rgba(184,138,20,.12);border-radius:16px;padding:15px 16px;display:flex;flex-direction:column;gap:12px;min-width:0;}
        .dec-ez-top{flex:1 1 auto;display:flex;align-items:center;gap:13px;min-width:0;}
        .dec-ez-ico{position:relative;width:60px;height:60px;border-radius:16px;background:var(--white);border:1px solid #eed79c;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .dec-ez-ico > svg{width:22px;height:22px;}
        .dec-ez-ico .tr{position:absolute;right:-5px;bottom:-5px;width:22px;height:22px;border-radius:50%;background:${GOLD};color:#5c4a06;display:flex;align-items:center;justify-content:center;border:2px solid #fdf6e4;}
        .dec-ez-name{font-size:24px;font-weight:800;letter-spacing:-.025em;color:${INK};line-height:1.1;}
        .dec-ez-fam{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#8a6d1c;margin-top:3px;min-width:0;}
        .dec-ez-btn{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;box-sizing:border-box;text-align:center;font-family:${SANS};font-weight:800;font-size:14.5px;color:#4d3d04;background:${GOLD};border:none;border-radius:11px;padding:13px 15px;cursor:pointer;text-decoration:none;white-space:nowrap;box-shadow:0 3px 10px rgba(184,138,20,.30);}
        .dec-ez-btn:hover{filter:brightness(1.05);}

        .dec-morehd{display:flex;align-items:baseline;justify-content:space-between;margin:18px 2px 12px;}
        .dec-more-eye{font-family:${MONO};font-size:10.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:${SLATE};}
        .dec-more-count{font-size:12px;color:#8a92a6;}
        .dec-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start;}
        .dec-grid.cols-1{grid-template-columns:minmax(0,1fr);}
        .dec-grid.cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}
        .dec-col{min-width:0;display:flex;flex-direction:column;}
        .dec-group{margin-bottom:12px;}
        .dec-gh{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;margin-bottom:8px;text-decoration:none;}
        .dec-gh .lbl{font-family:${MONO};font-size:10.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--white);}
        .dec-gh .cnt{margin-left:auto;font-size:11px;color:rgba(255,255,255,.78);display:flex;align-items:center;}
        .dec-row{display:flex;align-items:center;gap:9px;padding:9px 11px;border:1px solid ${BORD};border-radius:11px;background:var(--white);margin-bottom:7px;text-decoration:none;min-width:0;}
        .dec-row:hover{background:var(--surface);}
        .dec-row .nm{font-size:14px;font-weight:800;letter-spacing:-.01em;color:${INK};display:flex;align-items:center;gap:6px;min-width:0;}
        .dec-row .nm span.t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .dec-row .tg{font-size:11px;color:#8a92a6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dec-row .play{margin-left:auto;font-size:11px;font-weight:800;color:${SLATE};display:inline-flex;align-items:center;gap:2px;flex-shrink:0;}
        .dec-row .play.resume{color:#b9791a;}
        .dec-rz{display:inline-flex;align-items:center;margin-left:5px;vertical-align:-1px;}

        .dec-foot{display:flex;align-items:stretch;gap:8px;margin-top:16px;}
        .dec-foot .dec-btn{flex:1;justify-content:center;}
        .dec-btn{font-family:${SANS};font-weight:700;font-size:12.5px;border:1px solid ${BORD};background:var(--white);color:${SLATE};border-radius:10px;padding:9px 13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;text-decoration:none;}
        .dec-btn:hover{background:var(--surface);}
        .dec-btn.ink{background:${INK};border-color:${INK};color:var(--white);font-weight:800;}
        .dec-btn.ink:hover{filter:brightness(1.12);background:${INK};}

        @media(max-width:640px){
          .dec-card{padding:18px 16px 14px;}
          /* Title + chip share the top line on a phone. The chip does NOT
             shrink to fit (it collapsed to "G.." when it did): it holds a
             fixed slot, long usernames ellipsis inside it, and the score is
             what wraps to the second line. */
          /* Phone: the title NEVER breaks to make room for the chip. The row
             wraps as a whole, so mark + title hold line one and the chip sits
             beside them whenever it fits (it does at normal phone widths),
             dropping to a right-aligned second line only on a very narrow
             screen or a very long game name. The score always takes its own
             line. */
          .dec-toprow{gap:6px 8px;padding-right:28px;align-items:flex-start;flex-wrap:wrap;}
          .dec-titlerow{gap:4px 8px;flex:1 0 auto;max-width:100%;}
          .dec-check{width:26px;height:26px;}
          .dec-title{font-size:20px;}
          .dec-detail{display:none;}
          .dec-detailm{display:block;}
          .dec-topid{flex:0 0 auto;margin-left:auto;}
          .dec-topid .dec-idbox{font-size:12px;padding:4px 10px 4px 4px;gap:6px;max-width:150px;}
          .dec-topid .dec-idbox .av{width:19px;height:19px;font-size:10px;}
          .dec-topid button.dec-idbox{padding:6px 11px;}
          .dec-idbox .lg{display:none;}
          .dec-idbox .sm{display:inline;}
          /* Phone: stack the action row. A 1.55/1 split squeezes "Share for
             your chance at $5*" into three ragged lines at this width, and
             shortening the label would leave the asterisk carrying the whole
             offer. Share stays on top, as the primary action. */
          .dec-actions{grid-template-columns:1fr;gap:8px;}
          /* Stacked, the footnote sits directly under the share bar it
             annotates instead of trailing "Back to Main". */
          .dec-sharebar{order:1;gap:11px;padding:11px 12px;}
          .dec-sharebar .t{font-size:13px;}
          .dec-sharebar .s{font-size:11px;}
          .dec-fine{order:2;font-size:10px;margin:-2px 2px -1px;}
          .dec-back{order:3;padding:11px 12px;font-size:13px;}
          .dec-replay{font-size:12.5px;padding:11px 12px;gap:7px;}
          .dec-replay .rs{display:none;}
          .dec-claim{gap:10px;padding:10px 11px;}
          .dec-claim .t{font-size:12.5px;}
          .dec-claim .s{font-size:11px;}
          .dec-claim .cta{font-size:10.5px;padding:6px 10px;letter-spacing:.02em;}
          /* Mobile: the three rank tiles stay side by side, tighter. */
          .dec-tiles{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}
          .dec-tile{padding:12px 6px 9px;border-radius:12px;}
          .dec-tile::before{height:3px;}
          .dec-tile-lbl{font-size:9.5px;letter-spacing:.05em;padding:0 11px;min-height:24px;}
          .dec-tile-rk{font-size:30px;}
          .dec-tile-of{font-size:11px;}
          .dec-tile-mx{top:7px;right:5px;width:17px;height:17px;border-radius:5px;}
          .dec-iqhero{padding:13px 12px 11px;}
          /* Phone: hero is the centred brain + gain, with the three figures as
             the footnote row under a hairline (the identity chip lives on the
             title line, so nothing here takes a line of its own). */
          .dec-iqhero-in{gap:11px;justify-content:center;}
          .dec-iqhero-lead{gap:11px;}
          .dec-iqhero-rule,.dec-iqhero-stats{display:none;}
          .dec-iqhero-sub{display:flex;}
          /* The archive tile rides the same tighter tile metrics as its
             neighbours, with a smaller ring. */
          .dec-tile-ring{height:46px;}
          .dec-arcring,.dec-arcring svg{width:46px;height:46px;}
          .dec-arcring .num{font-size:10px;}
          .dec-brain,.dec-brain img,.dec-brain-fill{width:72px;}
          .dec-brain,.dec-brain img{height:65px;}
          .dec-iqhero-gain{font-size:50px;}
          .dec-iqhero-lbl{font-size:10.5px;}
          .dec-iqhero-slate{font-size:10.5px;}
          .dec-iqhero-sub{font-size:11.5px;gap:3px 12px;margin-top:8px;padding-top:7px;}
          .dec-iqhero-rays{width:300px;height:300px;margin:-150px 0 0 -150px;}
          .dec-duo{grid-template-columns:1fr;}
          .dec-nx-name,.dec-ez-name{font-size:21px;}
          .dec-nx-ico,.dec-ez-ico{width:54px;height:54px;}
          .dec-nx-btns .b,.dec-ez-btn{font-size:14px;padding:12px 10px;}
          .dec-grid,.dec-grid.cols-1,.dec-grid.cols-2,.dec-grid.cols-3{grid-template-columns:1fr;}
          .dec-rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;}
          .dec-rows.one{grid-template-columns:1fr;}
          .dec-row{margin-bottom:0;padding:8px 9px;}
          .dec-row .pl{display:none;}
          /* Mobile: the three footer actions stack full-width (side by side
             they overflow and wrap unevenly on a phone). */
          .dec-foot{flex-direction:column;gap:7px;}
          .dec-foot .dec-btn{width:100%;}
        }

        /* ============================================================
           SCOREBOARD THEME (owner direction, 2026-08-06)
           ------------------------------------------------------------
           The card used to be a white panel with a dark navy IQ hero
           inside it, plus a blue share bar, a grey back button and two
           tinted duo cards: seven surfaces, none of which appear
           anywhere else on the site. The owner picked the "scoreboard"
           direction from the 2026-08-06 mockups, so the whole card is
           now ONE navy surface built from the header's own gradient,
           and every child is a translucent glass panel ranked by
           opacity rather than by colour.

           This block deliberately sits at the END of the stylesheet and
           overrides the light rules above rather than rewriting them in
           place. Two reasons: the light rules still encode a lot of
           hard-won layout (tile clamps, the phone title-row fix, the
           action-row ordering) that has nothing to do with colour, and
           keeping the override contiguous makes the theme reversible by
           deleting one block. Colour and depth live here; geometry
           stays above.

           Mockups: end-game-modal-navy-buttons.html (P1 buttons),
           end-game-modal-C-centered-hero.html, -C-day-and-iqrank.html,
           -C-mobile-ranks-2up.html, -C-altA-manrope.html.
           ============================================================ */

        .dec-card{background:linear-gradient(178deg,#1a3573 0%,#12295e 46%,#0a1a3d 100%);border:1px solid rgba(147,197,253,.22);color:#fff;overflow:hidden;}
        .dec-card{scrollbar-color:#3f5fa8 transparent;}
        .dec-card::-webkit-scrollbar-thumb{background:#3f5fa8;border-color:transparent;}
        .dec-card::-webkit-scrollbar-thumb:hover{background:#5378c4;}
        .dec-x{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);color:#cfe0ff;}
        .dec-x:hover{background:rgba(255,255,255,.18);color:#fff;}

        /* Cap band: the ONLY place the card names itself. Full-bleed via
           negative margins against .dec-card's padding, so it reads as a
           masthead rather than a chip. A screenshot of the card is now
           branded, which it never was. */
        .dec-cap{display:flex;align-items:center;gap:10px;margin:-20px -22px 0;padding:10px 52px 10px 18px;background:${NAVY};}
        .dec-cap .mk{width:19px;height:19px;border-radius:5px;background:var(--white);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .dec-cap .wm{font-family:${SANS};font-size:13px;font-weight:800;letter-spacing:-.01em;color:var(--white);}
        .dec-cap .wm i{font-style:normal;color:#60a5fa;}
        .dec-cap .gm{font-family:${SANS};font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#a9c0f0;border-left:1px solid rgba(255,255,255,.22);padding-left:10px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

        /* Hero: verdict | gain | identity, on one line. The gain used to
           sit stacked under the verdict inside its own filled panel,
           which left a wide dead zone in the middle of the card and put
           its biggest number off to one side. Centring it fills the gap
           AND removes a row, so the hero is ~45px shorter than it was. */
        .dec-hero{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;padding:15px 0 16px;margin-bottom:0;border-bottom:1px solid rgba(147,197,253,.2);}
        .dec-head{margin-bottom:0;min-width:0;}
        .dec-toprow{padding-right:0;margin-bottom:0;}
        .dec-title{color:var(--white);font-size:26px;}
        .dec-detail,.dec-detailm{color:#93aae0;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;}
        .dec-sub{color:#93aae0;}
        .dec-sub b{color:var(--white);}
        .dec-check{background:rgba(126,226,184,.16);color:#7ee2b8;box-shadow:inset 0 0 0 1.5px rgba(70,197,142,.55);}
        .dec-check.loss{background:rgba(240,164,160,.14);color:#f0a4a0;box-shadow:inset 0 0 0 1.5px rgba(240,164,160,.45);}
        .dec-check.near{background:rgba(250,204,21,.14);color:#facc15;box-shadow:inset 0 0 0 1.5px rgba(250,204,21,.45);}
        .dec-answer-lbl{font-family:${SANS};font-size:10px;font-weight:800;letter-spacing:.11em;color:#8ab2ee;}
        .dec-answer-word{color:#ffd76b;}

        /* The gain: no longer a filled panel, just the number. On one
           navy surface a panel-within-a-panel is noise, and the glow
           carries the emphasis the fill used to. */
        .dec-iqhero{border:none;background:none;box-shadow:none;border-radius:14px;padding:4px 10px;margin-bottom:0;width:auto;justify-self:center;}
        .dec-iqhero.full,.dec-iqhero:hover,.dec-iqhero.full:hover{border:none;background:none;box-shadow:none;}
        .dec-iqhero.open{box-shadow:0 0 0 1px rgba(147,197,253,.55);}
        .dec-iqhero.full.open{box-shadow:0 0 0 1px rgba(134,239,172,.55);}
        .dec-iqhero-in{justify-content:center;gap:13px;}
        .dec-iqhero-lead{gap:13px;}
        .dec-iqhero-txt{align-items:flex-start;}
        .dec-brain,.dec-brain img,.dec-brain-fill{width:58px;height:52px;}
        .dec-brain-base{opacity:.20;filter:grayscale(1) brightness(3.6);}
        .dec-brain-fill img{filter:brightness(1.75) saturate(1.25);}
        .dec-iqhero-lbl{font-family:${SANS};font-size:10.5px;font-weight:800;letter-spacing:.1em;color:#8ab2ee;}
        .dec-iqhero-gain{font-size:52px;letter-spacing:-.045em;color:#dbeafe;text-shadow:0 0 32px rgba(147,197,253,.6);}
        .dec-iqhero.full .dec-iqhero-gain{color:#d6f7e4;text-shadow:0 0 32px rgba(134,239,172,.55);}
        /* The three figures and the mobile footnote both moved into the
           day bar below, which states them at a readable size instead of
           trailing them in 12px grey. */
        .dec-iqhero-slate,.dec-iqhero-mx{display:none;}

        /* Identity slot, hero right. A registered player gets their chip;
           a guest gets the gold claim pill (Alt A) with the figure it is
           protecting named underneath. Gold is the one colour on a navy
           card that outranks white without shouting, and it appears
           exactly twice: here and on the $50 inside the share bar. */
        .dec-topid{justify-self:end;display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:0;}
        a.dec-idbox{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.18);color:var(--white);}
        a.dec-idbox:hover{background:rgba(255,255,255,.16);}
        button.dec-idbox{background:${GOLD};border-color:${GOLD};color:#3a2c00;font-weight:900;font-size:13px;border-radius:11px;padding:10px 15px;box-shadow:0 4px 14px rgba(255,215,107,.3);}
        button.dec-idbox:hover{background:#ffe08c;border-color:#ffe08c;}
        .dec-idsub{font-family:${SANS};font-size:11.5px;font-weight:700;color:#e5d3a4;text-align:right;line-height:1.35;max-width:190px;}
        .dec-idsub b{color:${GOLD};}

        /* ---- "Your day" bar -------------------------------------------
           IQ rank and today's completion are the two figures that belong
           to the PLAYER rather than to this game, and both were buried:
           rank in an 11.5px line under the chip, completion in the words
           "N of M puzzles today" inside a grey run. They now get a band
           of their own, and the 42 cells state the day the way a number
           cannot: 38 empty cells under a finished puzzle is the most
           honest "keep going" prompt on the card. The strip is built from
           the live slate, so it tracks DAILY_GAMES rather than a
           hardcoded count, and it mirrors the slate rail in the page
           header directly behind the modal. */
        .dec-day{display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.05);border:1px solid rgba(147,197,253,.2);border-radius:14px;padding:12px 13px;margin:13px 0 0;}
        .dec-day .blk{flex:0 0 auto;min-width:0;}
        .dec-day .l{font-family:${SANS};font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#8ab2ee;white-space:nowrap;}
        .dec-day .v{font-size:24px;font-weight:800;letter-spacing:-.03em;color:var(--white);margin-top:5px;line-height:1;font-variant-numeric:tabular-nums;}
        .dec-day .v small{font-size:14px;font-weight:700;color:#8ea9d6;margin-left:1px;}
        .dec-day .f{font-size:11.5px;font-weight:700;color:#8ea9d6;margin-top:4px;white-space:nowrap;}
        .dec-day .vr{width:1px;align-self:stretch;background:rgba(147,197,253,.2);flex:0 0 auto;}
        .dec-day .rk{text-align:right;margin-left:auto;}
        .dec-dots{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:7px;}
        .dec-dotrow{display:flex;gap:3px;flex-wrap:wrap;}
        .dec-dt{width:11px;height:11px;border-radius:3px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.07);flex:none;}
        .dec-dt.on{background:#5fd39b;border-color:#5fd39b;box-shadow:0 0 6px rgba(95,211,155,.5);}
        .dec-dt.now{background:var(--white);border-color:var(--white);box-shadow:0 0 8px rgba(255,255,255,.7);}
        .dec-dots .cta{font-size:11.5px;font-weight:700;color:#9dc0ef;}
        .dec-dots .cta b{color:#cfe3ff;}
        .dec-delta{display:inline-flex;font-size:11px;font-weight:800;color:#5fd39b;background:rgba(95,211,155,.14);border:1px solid rgba(95,211,155,.32);border-radius:999px;padding:1px 7px;margin-left:6px;vertical-align:3px;}
        .dec-delta.dn{color:#f0a4a0;background:rgba(240,164,160,.12);border-color:rgba(240,164,160,.3);}

        /* Group rule: the card carries two kinds of number and never said
           so. "This game" separates the Crux ranks from the day bar's
           site-wide figures above it. */
        .dec-grouplbl{display:flex;align-items:center;gap:10px;font-family:${SANS};font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#7e9fd4;padding:15px 0 0;}
        .dec-grouplbl::after{content:'';flex:1;height:1px;background:rgba(147,197,253,.16);}

        /* Rank tiles as glass. On a dark ground the old white tiles were
           the brightest thing on the card, which put three secondary
           figures above the share bar in the visual order. */
        .dec-tiles{margin:11px 0 10px;}
        .dec-tile{background:rgba(255,255,255,.07);border:1px solid rgba(147,197,253,.24);box-shadow:none;border-radius:12px;padding:12px 10px 11px;}
        .dec-tile::before{display:none;}
        .dec-tile:hover{border-color:rgba(147,197,253,.55);background:rgba(255,255,255,.11);box-shadow:none;transform:translateY(-1px);}
        .dec-tile.open{border-color:#93c5fd;box-shadow:0 0 0 1px #93c5fd;background:rgba(255,255,255,.11);}
        .dec-tile-lbl{font-size:10px;letter-spacing:.09em;color:#8ab2ee;padding:0 16px;min-height:26px;}
        .dec-tile-rk{font-size:30px;color:var(--white);margin-top:4px;}
        .dec-tile-rk .dash{color:#5f7cb0;}
        .dec-tile-of{font-size:11.5px;color:#8ea9d6;}
        .dec-tile-mx{color:#7e9fd4;}
        .dec-tile.open .dec-tile-mx,.dec-tile:hover .dec-tile-mx{color:#cfe3ff;}
        /* Podium tint survives, restated for a dark ground. */
        .dec-tile.m1{background:rgba(255,215,107,.11);border-color:rgba(255,215,107,.45);box-shadow:none;}
        .dec-tile.m1 .dec-tile-lbl{color:#e8cd8b;}
        .dec-tile.m1 .dec-tile-rk{color:#ffe08c;}
        .dec-tile.m1 .dec-tile-of{color:#d3bd85;}
        .dec-tile.m2{background:rgba(226,232,240,.11);border-color:rgba(226,232,240,.42);box-shadow:none;}
        .dec-tile.m2 .dec-tile-lbl{color:#cbd5e1;}
        .dec-tile.m2 .dec-tile-rk{color:#f1f5f9;}
        .dec-tile.m3{background:rgba(226,150,95,.12);border-color:rgba(226,150,95,.42);box-shadow:none;}
        .dec-tile.m3 .dec-tile-lbl{color:#e0b08b;}
        .dec-tile.m3 .dec-tile-rk{color:#f3c8a4;}
        .dec-tile-arc.open{border-color:#93c5fd;box-shadow:0 0 0 1px #93c5fd;}
        .dec-tile-ring{height:52px;}
        .dec-arcring,.dec-arcring svg{width:52px;height:52px;}
        .dec-arcring .num{color:var(--white);}
        .dec-arcring svg circle:first-child{stroke:rgba(255,255,255,.16);}
        .dec-arcring svg circle+circle{stroke:#7fb4ff;}
        /* Desktop keeps the ring; the phone swaps it for a full-width bar
           (see the 640px block), because Archive is a COMPLETION, not a
           rank, and it was showing "63%" in a slot shaped for "#58". */
        .dec-arcbar{display:none;}
        .dec-tiles-loading{background:rgba(255,255,255,.05);border-color:rgba(147,197,253,.2);color:#8ab2ee;font-family:${SANS};font-size:11.5px;font-weight:800;letter-spacing:.09em;}
        .dec-tiles-loading::after{background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);}
        .dec-tile-cal{color:#7e9fd4;}

        /* Expanded leaderboard panel. */
        .dec-expand{background:rgba(255,255,255,.05);border-color:rgba(147,197,253,.2);color:var(--white);}
        .dec-expand-ti{color:var(--white);}
        .dec-expand-full{color:#93c5fd;}
        .dec-lbempty,.dec-note,.dec-lbswipe{color:#8ea9d6;}
        .dec-lbrow,.dec-lbgrow{border-color:rgba(147,197,253,.14);color:#dbeafe;}
        .dec-lbrow .rk,.dec-lbg .rk{color:#8ab2ee;}
        .dec-lbrow .nm,.dec-lbg .nm{color:var(--white);}
        .dec-lbrow .vl,.dec-lbg .num,.dec-lbg .pts{color:#cfe3ff;}
        .dec-lbghead .h{color:#8ab2ee;}
        .dec-lbrow.me,.dec-lbgrow.me{background:rgba(147,197,253,.16);}
        .dec-cal{background:rgba(255,255,255,.05);border-color:rgba(147,197,253,.2);color:var(--white);}
        .dec-cal-mo,.dec-cal-wd,.dec-cal-key{color:#8ea9d6;}
        .dec-cal-cell{border-color:rgba(147,197,253,.2);color:#dbeafe;background:rgba(255,255,255,.05);}
        .dec-cal-nav button{color:#cfe3ff;border-color:rgba(147,197,253,.28);background:rgba(255,255,255,.07);}

        /* Guest claim banner, restated on navy. Gold ground, blue is NOT
           used for the CTA here because the share bar below already owns
           the one solid non-gold fill on the card. */
        .dec-claim{background:linear-gradient(135deg,rgba(255,215,107,.19),rgba(255,215,107,.08));border-color:rgba(255,215,107,.5);color:var(--white);}
        .dec-claim .ic{background:rgba(255,215,107,.2);color:${GOLD};box-shadow:inset 0 0 0 1px rgba(255,215,107,.42);}
        .dec-claim .t{color:var(--white);}
        .dec-claim .s{color:#e5d3a4;}
        .dec-claim .cta{background:${GOLD};color:#3a2c00;}
        .dec-claim::after{background:linear-gradient(100deg,transparent 32%,rgba(255,255,255,.22) 50%,transparent 68%);}
        @keyframes dec-claimpulse{0%,100%{box-shadow:0 0 0 0 rgba(255,215,107,.4);}55%{box-shadow:0 0 0 7px rgba(255,215,107,0);}}

        /* ---- P1 buttons ------------------------------------------------
           The secondary buttons had NO fill, just a 1.5px hairline, so on
           a gradient the "button" was the same colour as the card behind
           it: the weakest control there is. P1 gives them a real body.
           The numbers matter: on a dark ground rgba(255,255,255,.06) is
           invisible and .08 is a smudge, the step change is around
           .13, and it needs the inset top highlight or the shape reads
           as a hole cut in the card rather than something raised. Every
           raised control also loses its shadow on :active, or the lift is
           decoration rather than feedback. The share bar stays the ONLY
           solid fill on the card at every level. */
        .dec-sharebar{background:var(--white);border-color:var(--white);color:${NAVY};box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 6px 20px rgba(0,0,0,.42);}
        .dec-sharebar:hover{filter:brightness(1);background:#f4f7ff;border-color:#f4f7ff;}
        .dec-sharebar .ic{background:#eaf0fd;color:${BLUE};}
        .dec-sharebar .t{color:#0b1c40;}
        .dec-sharebar .t .pz{color:#a37800;}
        .dec-sharebar .s{color:#5a6a8c;}
        .dec-sharebar:active{transform:translateY(1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 3px 10px rgba(0,0,0,.42);}
        .dec-back,.dec-replay{background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.06));border:2px solid rgba(147,197,253,.4);color:#dbeafe;box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 3px 10px rgba(0,0,0,.3);}
        .dec-back:hover,.dec-replay:hover{filter:none;background:linear-gradient(180deg,rgba(255,255,255,.19),rgba(255,255,255,.09));border-color:rgba(147,197,253,.55);color:var(--white);}
        .dec-back:active,.dec-replay:active{transform:translateY(1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 1px 5px rgba(0,0,0,.3);}
        .dec-back .bi{color:#93c5fd;}
        .dec-replay .rs{color:#8ea9d6;}
        .dec-fine{color:#7e9fd4;}
        .dec-fine a{color:#93c5fd;}

        /* Up next / Easiest, as glass rather than tinted paper. */
        .dec-nx,.dec-ez{background:rgba(255,255,255,.07);border:1.5px solid rgba(147,197,253,.26);box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 3px 12px rgba(0,0,0,.26);color:var(--white);}
        .dec-ez{background:rgba(255,215,107,.09);border-color:rgba(255,215,107,.34);}
        .dec-nx-fam,.dec-ez-fam{color:#8ab2ee;}
        .dec-ez-fam{color:#e0c98a;}
        .dec-nx-name,.dec-ez-name{color:var(--white);}
        .dec-nx-cd,.dec-blurb{color:#9dc0ef;}
        .dec-ez .dec-blurb{color:#dcc79a;}
        .dec-nx-ico,.dec-ez-ico{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);}
        .dec-nx-btns .dec-btn,.dec-ez-btn{border-color:rgba(147,197,253,.4);color:#dbeafe;background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.06));box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 3px 10px rgba(0,0,0,.3);}
        .dec-nx-btns .dec-btn:active,.dec-ez-btn:active{transform:translateY(1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 1px 5px rgba(0,0,0,.3);}
        .dec-sk{background:rgba(255,255,255,.09);}
        .dec-sk::after{background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent);}

        /* Still-to-play grid, month slip and the popular-quiz block. */
        .dec-morehd,.dec-more-count,.dec-more-eye,.dec-group,.dec-col{color:#8ea9d6;}
        .dec-row{background:rgba(255,255,255,.07);border-color:rgba(147,197,253,.22);color:var(--white);}
        .dec-row:hover{background:rgba(255,255,255,.12);border-color:rgba(147,197,253,.45);}
        .dec-row .pl{color:#8ea9d6;}
        .dec-slip{background:rgba(255,255,255,.05);border-color:rgba(147,197,253,.2);color:var(--white);}
        .dec-slip-pct,.dec-slip-right{color:#9dc0ef;}
        .dec-foot .dec-btn{background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.06));border-color:rgba(147,197,253,.4);color:#dbeafe;box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 3px 10px rgba(0,0,0,.3);}
        .dec-eye,.dec-rz,.dec-gh{color:#8ea9d6;}

        @media(max-width:640px){
          .dec-cap{margin:-18px -16px 0;padding:9px 40px 9px 14px;}
          /* Hero collapses to one centred column. It was always going to
             be one column on a phone, so the centred desktop composition
             is simply what mobile already wanted: the two viewports now
             share a layout instead of diverging. Order is
             verdict -> gain -> identity, which is the right priority. */
          .dec-hero{grid-template-columns:1fr;justify-items:center;text-align:center;gap:11px;padding:13px 0 14px;}
          .dec-toprow{justify-content:center;}
          .dec-titlerow{justify-content:center;}
          .dec-title{font-size:23px;}
          .dec-topid{justify-self:center;align-items:center;margin-left:0;}
          .dec-idsub{text-align:center;max-width:100%;}
          .dec-iqhero-gain{font-size:44px;}
          .dec-brain,.dec-brain img,.dec-brain-fill{width:50px;height:45px;}
          .dec-day{flex-wrap:wrap;gap:12px;padding:11px 12px;}
          .dec-day .vr{display:none;}
          .dec-dots{flex-basis:100%;}
          .dec-dt{width:7px;height:7px;border-radius:2px;}
          /* Today + All Time pair naturally (both are a rank out of a
             field) and read fine at half width. Archive is a completion,
             so it takes the full row as a bar. Saves ~34px, which is the
             difference between the share bar starting above or below the
             fold on a 780px viewport. */
          .dec-tiles{grid-template-columns:1fr 1fr;}
          .dec-tile{padding:9px 11px;text-align:left;}
          .dec-tile-lbl{padding:0 18px 0 0;min-height:0;font-size:9.5px;}
          .dec-tile-rk{font-size:23px;margin-top:5px;display:inline-block;}
          .dec-tile-of{display:inline-block;margin:0 0 0 6px;font-size:10.5px;}
          .dec-tile-mx{top:8px;right:5px;}
          .dec-tile-arc{grid-column:1/-1;}
          .dec-tile-arc .dec-tile-ring{display:none;}
          .dec-tile-arc .dec-tile-lbl{display:inline-block;}
          .dec-arcbar{display:block;height:7px;border-radius:4px;background:rgba(255,255,255,.13);overflow:hidden;margin-top:8px;}
          .dec-arcbar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,${BLUE},#7fb4ff);}
        }

        /* ---- post-ship corrections (2026-08-06) --------------------------
           1. The "More of today's puzzles" rows still rendered their game
              NAMES in near-black. The theme set .dec-row{color:var(--white)}
              at specificity (0,1,0), but the original stylesheet sets
              .dec-row .nm{color:${INK}} at (0,2,0), so the child won and the
              names were black on navy glass. Anything the theme recolours by
              inheritance needs the CHILD selector restated whenever the
              original names that child explicitly. Same class of bug for the
              tag line, the Play affordance and the two remaining light
              surfaces (.dec-btn, .dec-slip variants). */
        .dec-row .nm{color:var(--white);}
        .dec-row .tg{color:#8ea9d6;}
        .dec-row .play{color:#93c5fd;}
        .dec-row .play.resume{color:#ffd08a;}
        .dec-row.resume{border-color:rgba(255,208,138,.34);background:rgba(255,208,138,.08);}
        .dec-gh .cnt{color:rgba(255,255,255,.85);}
        .dec-btn{background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.06));border-color:rgba(147,197,253,.4);color:#dbeafe;box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 3px 10px rgba(0,0,0,.3);}
        .dec-btn:hover{background:linear-gradient(180deg,rgba(255,255,255,.19),rgba(255,255,255,.09));border-color:rgba(147,197,253,.55);color:var(--white);}
        .dec-btn:active{transform:translateY(1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 1px 5px rgba(0,0,0,.3);}
        .dec-btn.ink{background:var(--white);border-color:var(--white);color:#0b1c40;}
        .dec-btn.ink:hover{background:#f4f7ff;border-color:#f4f7ff;color:#0b1c40;}
        .dec-slip.info{background:rgba(147,197,253,.12);border-color:rgba(147,197,253,.32);}
        .dec-slip.neutral{background:rgba(255,255,255,.06);}
        .dec-slip.neutral:hover{background:rgba(255,255,255,.12);}
        /* Cells are bordered, so without border-box the 42-cell strip is 2px
           per cell wider than it measures, which is what pushed it onto a
           second row on a phone. */
        .dec-dt{box-sizing:border-box;}

        @media(max-width:640px){
          /* 2. The day bar wrapped to THREE rows: .dec-dots takes the full
                width, and since it sits between the two figure blocks in the
                DOM it pushed IQ rank below the strip. Ordering puts the two
                figures together on row one and the strip on row two, and the
                cells shrink to 5px so 42 of them still fit a single line at
                365px and up. */
          .dec-day{gap:10px;}
          .dec-day .blk{order:1;}
          .dec-day .rk{order:2;margin-left:auto;}
          .dec-dots{order:3;flex-basis:100%;gap:5px;}
          .dec-day .v{font-size:21px;}
          .dec-day .f{font-size:11px;}
          .dec-dotrow{gap:2px;}
          .dec-dt{width:5px;height:5px;border-radius:1.5px;}
          .dec-dots .cta{font-size:11px;}
          .dec-dots .cta .pr{display:none;}
        }

        /* ---- layout revision (owner, 2026-08-06) -------------------------
           The hero was verdict | gain | identity across one row. The owner
           moved the identity up ONTO the verdict line and the gain below it,
           which reads better because the verdict and the name are both
           labels for the same thing ("who did what"), while the gain is the
           result and wants its own space. The day bar also moved BELOW the
           game ranks, under its own rule, so the card now reads: what you
           did -> what you earned -> this game -> your day. */
        .dec-hero{display:block;padding:14px 0 15px;}
        .dec-toprow{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        .dec-topid{justify-self:auto;flex:0 1 auto;align-items:flex-end;margin-left:auto;}
        .dec-iqhero{width:100%;margin:13px 0 0;justify-self:auto;padding:2px 10px 0;}
        .dec-day{margin:11px 0 0;}

        @media(max-width:640px){
          /* One column, but NOT centred any more: with the chip beside it the
             verdict is a left-aligned label row again, and only the gain
             stays centred under it. */
          .dec-hero{display:block;text-align:left;}
          .dec-toprow{justify-content:space-between;gap:8px;}
          .dec-titlerow{justify-content:flex-start;}
          .dec-topid{justify-self:auto;align-items:flex-end;margin-left:auto;}
          .dec-idsub{text-align:right;max-width:170px;}
          .dec-iqhero{margin-top:11px;}
        }

        /* ---- IQ figures rejoin the gain (owner, 2026-08-06) ---------------
           They were split: the gain here, the rank and totals down in the day
           bar. A number belongs beside the number it qualifies, so the
           original -rule / -stats / -sub trio is un-hidden and restyled. That
           trio already carried the responsive swap (three figures beside the
           gain on desktop, a footnote row under it on a phone), so the phone
           case comes back for free. The day bar is now purely completion:
           the count and the 42 checks. */
        .dec-iqhero{padding:2px 10px 4px;}
        .dec-iqhero-rule{display:block;margin:4px 0;}
        .dec-iqhero-stats{display:flex;flex:0 1 auto;align-items:center;gap:26px;grid-template-columns:none;}
        .dec-iqhero-stats .k{font-family:${SANS};font-size:10px;font-weight:800;letter-spacing:.1em;}
        .dec-iqhero-stats .v{font-size:24px;}
        .dec-iqhero-stats .m{font-size:11px;}
        .dec-iqhero-sub{font-size:12px;}
        /* The bar sat flush against the share button below it. */
        .dec-day{margin:11px 0 12px;}
        .dec-day .blk{flex:0 0 auto;}

        @media(max-width:640px){
          /* Restated because the plain rules above sit AFTER the original
             640 block and would otherwise beat it: on a phone the three
             figures collapse to the footnote row under the gain. */
          .dec-iqhero-rule,.dec-iqhero-stats{display:none;}
          .dec-iqhero-sub{display:flex;font-size:11.5px;}
          .dec-day{margin-bottom:11px;}
        }

        /* ---- tightening + action grid (owner, 2026-08-06) ----------------
           The card had accumulated slack: every block carried its own comfy
           padding from when it was a white panel, and on a dark ground the
           borders already do the separating, so the same gaps read as holes.
           Roughly 60px comes out of the desktop card and 50px off a phone.
           Card padding and the cap's negative bleed margins MUST move
           together, or the cap stops reaching the card's edges. */
        .dec-card{padding:18px 20px 14px;}
        .dec-cap{margin:-18px -20px 0;padding:9px 44px 9px 18px;}
        .dec-hero{padding:12px 0 13px;}
        .dec-iqhero{margin:11px 0 0;}
        .dec-iqhero-rule{margin:2px 0;}
        .dec-grouplbl{padding:13px 0 0;}
        .dec-tiles{margin:9px 0 0;}
        .dec-tile{padding:11px 10px 10px;}
        .dec-day{margin:9px 0 11px;padding:10px 12px;}
        .dec-day .v{margin-top:3px;}
        .dec-day .f{margin-top:3px;}
        .dec-dots{gap:6px;}
        .dec-expand{margin-top:9px;}

        /* Replay now lives in the action grid. Desktop keeps it as a full
           width bar under share + back; the phone puts it beside Back to
           Main. :has() lets Back go full width when a caller passes no
           onReplay, and a browser without :has() just gets the safe
           full-width fallback. */
        .dec-replay{grid-column:1/-1;margin-bottom:0;}

        @media(max-width:640px){
          .dec-card{padding:16px 14px 12px;}
          .dec-cap{margin:-16px -14px 0;padding:8px 40px 8px 14px;}
          /* Cap band is 35px tall on a phone; keep the button centred in it. */
          .dec-x{top:6px;right:10px;}
          .dec-hero{padding:11px 0 12px;}
          .dec-day{margin:8px 0 10px;padding:9px 11px;}
          .dec-grouplbl{padding:11px 0 0;}
          .dec-tiles{margin:8px 0 0;}
          .dec-actions{grid-template-columns:1fr 1fr;gap:7px;}
          .dec-sharebar{grid-column:1/-1;order:1;}
          .dec-fine{grid-column:1/-1;order:2;}
          .dec-back{order:3;grid-column:1/-1;}
          .dec-back:has(~ .dec-replay){grid-column:auto;}
          .dec-replay{order:4;grid-column:auto;margin-bottom:0;}
        }

        /* ---- rank tiles, DESKTOP ONLY (owner, 2026-08-06) ----------------
           The tiles read as mostly empty: a 10px label floating at the top,
           then a 14px hole, then the numeral. Two causes, both fixed here.
           The label was sized for a caption when it is really the tile's
           title, so it goes to 13px; and .dec-tile-lbl carried a 26px
           min-height to keep the three numerals level when a long game name
           wrapped to two lines, which spent that space on EVERY tile to
           insure against a case the current roster never hits (the longest
           label is a short game name plus " All Time"). The 2-line clamp
           stays as the safety net, so a future long name still truncates
           rather than shoving one numeral out of line.

           Scoped to min-width:641px on purpose: the phone lays these out as
           two-up rows with the label and numeral on ONE line, where none of
           this applies and 9.5px is correct. */
        @media(min-width:641px){
          .dec-tiles{margin:7px 0 0;}
          .dec-tile{padding:10px 10px 9px;}
          .dec-tile-lbl{font-size:13px;font-weight:800;letter-spacing:.03em;line-height:1.25;min-height:0;padding:0 18px;}
          .dec-tile-rk{font-size:32px;margin-top:3px;}
          .dec-tile-of{font-size:12px;margin-top:2px;}
          .dec-tile-ring{height:44px;margin-top:2px;}
          .dec-arcring,.dec-arcring svg{width:44px;height:44px;}
          .dec-arcring .num{font-size:11px;}
          .dec-tile-mx{top:8px;right:5px;}
          /* The three tiles are grid cells of equal height, but .dec-tile is a
             <button>, and a button vertically CENTRES its content box. The
             archive tile is the tallest (a 44px ring where the others have a
             32px numeral), so the two rank tiles were centring their shorter
             content and their titles floated ~10px lower than the archive's.
             Making the tile a flex column pins all three titles to the top
             deterministically, and margin-top:auto on the footnote pins the
             three "of N players" lines to the bottom, so the numeral and the
             ring float between two aligned rails instead of dragging the
             labels around with them. The ring also comes down to 40px so the
             leftover slack in the middle is a few pixels, not a hole. */
          .dec-tile{display:flex;flex-direction:column;justify-content:flex-start;}
          .dec-tile-ring{height:40px;margin-top:2px;}
          .dec-arcring,.dec-arcring svg{width:40px;height:40px;}
          .dec-arcring .num{font-size:10.5px;}
          .dec-tile-of{margin-top:auto;padding-top:2px;}
        }
      `}</style>

      {/* ---- 0. cap band ---- */}
      {/* The card never named itself, so a screenshot of it was unbranded.
          Full-bleed navy cap, the one piece of the page header carried
          into the modal. */}
      <div className="dec-cap">
        <span className="mk" aria-hidden="true">
          {/* The SHARED site mark (app/MindLoftMark.jsx), not a hand-inlined copy.
              This cap carried a leftover house glyph from before the rebrand, so a
              screenshot of the end card was branded differently from every other
              surface. Sized down to 16px to sit inside the 19px white tile. */}
          <MindLoftMark size={16} ink="#233a63" accent="#2563eb" title="Mind Loft" />
        </span>
        <span className="wm">Mind <i>Loft</i></span>
        <span className="gm">{selfName} {'\u00b7'} {MONTH_NAMES[Number(todayISO.slice(5, 7)) - 1]} {Number(todayISO.slice(8, 10))}</span>
      </div>

      {/* ---- 1. hero: verdict | gain | identity ---- */}
      <div className="dec-hero">
      {/* ---- 1a. verdict ---- */}
      <div className="dec-head">
        {/* Title on the left, the player's chip on the right of the SAME line
            (owner 2026-08-01), clear of the modal's close button. */}
        <div className="dec-toprow">
          <div className="dec-titlerow">
            {/* Mark, tint and title all read from the SAME finish state. They
                used to disagree: the title branched on `completed` while the
                mark branched on `won`, so the games that pass `completed`
                (Feud, Outwit, Outrank, Lode, Babel) drew a rust loss flag right
                next to the word "Completed!". */}
            <span className={`dec-check${finish === 'won' ? '' : (finish === 'near' ? ' near' : ' loss')}`}>
              {isCompleted ? <CheckCircle2 size={19} strokeWidth={2.4} /> : <Flag size={17} strokeWidth={2.4} />}
            </span>
            <span className="dec-title">{finishTitle}</span>
            {score ? <span className="dec-detail">{score}</span> : null}
          </div>
          {/* Identity on the SAME line as the verdict (owner 2026-08-06): the
              player's chip, or for a guest the claim pill with the figures it
              is protecting named under it. Naming the rank as well as the
              points is the point, a guest can see the standing they would
              lose. The gain then sits under this line, on its own. */}
          <span className="dec-topid">
            {idChip}
            {!hasEmail && iq && (iq.rank || typeof iq.xp === 'number') ? (
              <span className="dec-idsub">
                <b>
                  {iq.rank ? `#${iq.rank.toLocaleString()}` : null}
                  {iq.rank && typeof iq.xp === 'number' ? ' and ' : null}
                  {typeof iq.xp === 'number' ? `${iq.xp.toLocaleString()} IQ` : null}
                </b>{' '}unclaimed
              </span>
            ) : null}
          </span>
        </div>
        {/* Phone copy of the score: on a phone it sits on its own line under the
            title, because leaving it inside the title row inflated that row's
            intrinsic width and pushed the chip off the line. Exactly one of the
            two is displayed at any width. */}
        {score ? <div className="dec-detailm">{score}</div> : null}
        {answer ? (
          <div className="dec-answer">
            <span className="dec-answer-lbl">Answer</span>
            <span className="dec-answer-word">{answer}</span>
          </div>
        ) : null}
      </div>

      {/* ---- 2. IQ hero + rank tiles ---- */}
      {/* IQ Points hero: what this game paid is the card's headline number, on a
          full-width banner led by the brain meter from the shareable day card.
          The brain fills with the player's progress through today's slate (green
          once it is complete) and the gain counts up from zero as it lands. The
          whole panel expands to the player's slot in the global IQ ranking.
          Renders immediately (it has its own fetch), showing a placeholder until
          the standing resolves. */}
      <div
        className={`dec-iqhero${openTile === 'iq' ? ' open' : ''}${slateFull ? ' full' : ''}${iqLanded && iqGained ? ' landed' : ''}`}
      >
        {/* The whole panel is the expand control, but the identity chip inside it
            is its own link, so the toggle is a transparent hit layer UNDER the
            content rather than a <button> wrapping it (a button inside a button
            is invalid and swallows the chip's click). */}
        <button
          type="button"
          className="dec-iqhero-hit"
          aria-label="Expand your IQ points ranking"
          aria-expanded={openTile === 'iq'}
          onClick={() => setOpenTile((o) => (o === 'iq' ? null : 'iq'))}
        />
        <span className="dec-iqhero-rays" aria-hidden="true" />
        <span className="dec-iqhero-in">
          <span className="dec-iqhero-lead">
          <span className="dec-brain" aria-hidden="true">
            <img className="dec-brain-base" src={BRAIN_EMPTY} alt="" width={640} height={576} />
            <span className="dec-brain-fill" style={{ height: `${brainOn ? Math.round(slateFrac * 100) : 0}%` }}>
              <img src={slateFull ? BRAIN_GREEN : BRAIN_BLUE} alt="" width={640} height={576} />
            </span>
          </span>
          <span className="dec-iqhero-txt">
            <span className="dec-iqhero-lbl">IQ points earned</span>
            {iqGained != null ? (
              <span className="dec-iqhero-gain">+{(iqCount == null ? iqGained : iqCount).toLocaleString()}</span>
            ) : (
              <span className="dec-iqhero-gain"><span className="dash">{iqResolved ? '\u2014' : '\u00b7'}</span></span>
            )}
            <span className="dec-iqhero-slate">
              {doneCount} of {total} puzzles today{slateFull ? ' \u00b7 slate complete' : ''}
            </span>
          </span>
          </span>
          {/* Desktop only: the three figures that were a 12.5px footnote row
              become real numbers beside the gain. The mobile footnote below is
              the SAME data in the layout that already worked on a phone, and the
              two are swapped by display:none, so only one is ever in the a11y
              tree. */}
          <span className="dec-iqhero-rule" aria-hidden="true" />
          <span className="dec-iqhero-stats">
            {showIqToday ? <span className="st"><span className="k">Today</span><span className="v">+{iq.todayGained.toLocaleString()}</span></span> : null}
            {iq && typeof iq.xp === 'number' ? <span className="st"><span className="k">Total</span><span className="v">{iq.xp.toLocaleString()}</span></span> : null}
            {iq && iq.rank ? (
              <span className="st">
                <span className="k">IQ rank</span>
                <span className="v">#{iq.rank.toLocaleString()}</span>
                <span className="m">of {(iq.total || 0).toLocaleString()}</span>
              </span>
            ) : null}
          </span>
        </span>
        <span className="dec-iqhero-sub">
          {showIqToday ? <span><b>+{iq.todayGained.toLocaleString()}</b> today</span> : null}
          {iq && typeof iq.xp === 'number' ? <span><b>{iq.xp.toLocaleString()}</b> total</span> : null}
          {iq && iq.rank ? <span>IQ rank <b>#{iq.rank.toLocaleString()}</b> of {(iq.total || 0).toLocaleString()}</span> : null}
          {iq && iq.firstPlay ? <span>Your first IQ points are banking</span> : null}
        </span>
        <span className="dec-iqhero-mx">
          <ChevronDown size={15} strokeWidth={2.4} style={{ transform: openTile === 'iq' ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }} />
        </span>
      </div>
      </div>

      {/* ---- 3. this game ---- */}
      <div className="dec-grouplbl">This game</div>
      {ranksLoading ? (
        <div className="dec-tiles-loading" role="status" aria-live="polite">Loading your rankings…</div>
      ) : null}
      <div className="dec-tiles" style={ranksLoading ? { display: 'none' } : undefined}>
        {/* Labels name the game (owner 2026-08-01): "Garble Today", not "Today",
            so the tiles never read as site-wide boards. */}
        {renderTile('today', `${selfName} Today`, gameTodayRank, gameTodayField, false, provisional)}
        {renderTile('alltime', `${selfName} All Time`, allTime ? allTime.myRank : null, allTime ? (allTime.plays ?? allTime.field) : null, !(allTime && allTime.myRank != null), !!(allTime && allTime.provisional))}
        {drops && drops.length ? renderArchiveTile() : null}
      </div>
      {calOpen && drops && drops.length ? calendarEl : null}
      {openTile ? (() => {
        const rows = tileBoard(openTile);
        const ti = openTile === 'iq' ? 'Global IQ points ranking'
          : openTile === 'today' ? `${selfName} · today's puzzle`
          : `${selfName} · all time`;
        return (
          <div className="dec-expand">
            <div className="dec-expand-hd">
              <span className="dec-expand-ti">{ti}</span>
              {openTile === 'iq' ? (
                <a className="dec-expand-full" href="/quizzes/hub?tab=player">Full ranking <ArrowRight size={12} strokeWidth={2.4} /></a>
              ) : (
                <button type="button" className="dec-expand-full" onClick={() => openPanel(openTile)}>Full leaderboard <ArrowRight size={12} strokeWidth={2.4} /></button>
              )}
            </div>
            {!rows.length ? (
              <div className="dec-lbempty">{openTile === 'iq' ? 'Your IQ ranking appears once this game is counted.' : 'No board yet. Be the first to post a score.'}</div>
            ) : openTile === 'today' ? (
              <>
                <div className="dec-lbscroll">
                  <div className={`dec-lbscroll-in${missLabel ? '' : ' nomiss'}`}>
                    <div className="dec-lbg dec-lbghead">
                      <span className="h">#</span>
                      <span className="h">Player</span>
                      <span className="h" style={{ textAlign: 'right' }}>{scoreUnit ? scoreUnit.charAt(0).toUpperCase() + scoreUnit.slice(1) : 'Score'}</span>
                      <span className="h" style={{ textAlign: 'right' }}>Time</span>
                      {missLabel ? <span className="h" style={{ textAlign: 'right' }}>{missLabel}</span> : null}
                      <span className="h" style={{ textAlign: 'right' }}>Pts</span>
                    </div>
                    {rows.map((r, idx) => (
                      <div className={`dec-lbg dec-lbgrow${r.me ? ' me' : ''}`} key={idx}>
                        <span className="rk">#{r.rank}</span>
                        <span className="nm">{r.name || '—'}</span>
                        <span className="num">{r.score == null ? '—' : (scoreUnit ? r.score : <>{r.score}/{r.total}</>)}</span>
                        <span className="num">{fmtTime(r.timeElapsed)}</span>
                        {/* END GAME prints TRIES here (owner, 2026-08-12): its
                            registry label is 'Tries' and its board ranks on the
                            attempt the solve landed on, not on the per-run error
                            count. A run that never solved has no attempt number
                            to report and reads as a dash. Mirrors the same cell
                            in DailyBoardPanel. */}
                        {missLabel ? <span className="num">{r.tries != null ? r.tries : (r.egTier != null ? '—' : (r.guessesUsed == null ? '—' : r.guessesUsed))}</span> : null}
                        <span className="pts">{fmtNum(r.points)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="dec-lbswipe">{missLabel ? <>Swipe for time, {missLabel.toLowerCase()} and points →</> : <>Swipe for time and points →</>}</div>
              </>
            ) : rows.map((r, idx) => (
              <div className={`dec-lbrow${r.me ? ' me' : ''}`} key={idx}>
                <span className="rk">#{r.rank}</span>
                <span className="nm">{r.name || '—'}</span>
                <span className="vl">{r.val}</span>
              </div>
            ))}
            {rows.length > 0 && openTile !== 'iq' ? (
              <p className="dec-note">Guests play alongside you and count toward the field, but points are scored among registered players only. {dailyAttemptRule(self).board}</p>
            ) : null}
          </div>
        );
      })() : null}
      {/* ---- 4. your day: completion + IQ rank ---- */}
      {/* These are the two figures that belong to the PLAYER rather than to
          this game, and both used to be buried: rank in an 11.5px line under
          the chip, completion in the words "N of M puzzles today" inside a
          grey run. The 42 cells state the day in a way the number cannot,
          and they mirror the slate rail in the page header behind the modal.
          Built from DAILY_GAMES, so the strip tracks the live slate. */}
      <div className="dec-grouplbl">Your day</div>
      <div className="dec-day">
        <div className="blk">
          <div className="l">Puzzles today</div>
          <div className="v">{doneCount}<small>/{total}</small></div>
        </div>
        <div className="dec-dots">
          <div className="dec-dotrow" aria-hidden="true">
            {slateCells.map((g) => (
              <span
                key={g.key}
                className={`dec-dt${g.key === self ? ' now' : (doneKeys.has(g.key) ? ' on' : '')}`}
              />
            ))}
          </div>
          <div className="cta">
            {slateFull
              ? <><b>Slate complete.</b> <span className="pr">Every puzzle today is done.</span></>
              : <><b>{total - doneCount} left today.</b> <span className="pr">Finishing the slate fills the brain.</span></>}
          </div>
        </div>
      </div>

      {/* ---- 5. guest claim banner ---- */}
      {/* Sits DIRECTLY under the rank tiles (owner 2026-08-01), not below the
          share bar: an unregistered player reads their ranks and immediately
          learns those ranks are unclaimed. It is deliberately loud (pulsing
          ring, sweeping sheen, blinking CTA pill) because claiming a name is
          the single highest-value action a guest can take here. Motion is
          dropped under prefers-reduced-motion. */}
      {!hasEmail ? (
        <button type="button" className="dec-claim" onClick={goRegister}>
          <span className="ic"><Trophy size={17} strokeWidth={2.3} /></span>
          <span className="tx">
            <span className="t">
              {iq && typeof iq.xp === 'number' && iq.xp > 0
                ? <>Your ranking and {iq.xp.toLocaleString()} IQ points are unclaimed</>
                : <>Your ranking and IQ points are unclaimed</>}
            </span>
            <span className="s">Pick a username to keep them and hold your place on these boards.</span>
          </span>
          <span className="cta">Claim name</span>
        </button>
      ) : null}

      {/* ---- 4. share / challenge bar ---- */}
      {/* Sits under the rank tiles (and the guest claim banner) as a
          full-width feature bar rather than a chip in the header. It calls the
          caller's own share handler, which is what opens the shared
          ShareCreditPop (result + ref-stamped link, or the sign-up view for a
          guest), so a shared link and a challenge are the same action here. */}
      <div className="dec-actions">
        <button type="button" className="dec-sharebar" onClick={onShare}>
          <span className="ic"><Share2 size={16} strokeWidth={2.3} /></span>
          <span className="tx">
            <span className="t">
              {/copied/i.test(shareLabel || '')
                ? shareLabel
                : (contestLive ? teaserNodes() : 'Share result or challenge a friend')}
            </span>
            <span className="s">
              {contestLive ? `Top ${CONTEST.winners} referrers win` : 'You get the credit when they play.'}
            </span>
          </span>
        </button>
        <a className="dec-back" href="/quizzes">
          <LayoutGrid size={16} strokeWidth={2.2} className="bi" />
          <span>Back to Main</span>
        </a>
        {/* The footnote lives INSIDE the action grid so the phone layout can
            order it. Stacked one-per-row, a footnote after the grid reads as
            fine print for "Back to Main" rather than for the share offer it
            actually annotates, so on mobile it is ordered between the two
            (see the .dec-actions order rules). On desktop it spans both
            columns on the row below, exactly where it sat before. */}
        {contestLive ? (
          <p className="dec-fine">
            *Contest ends {CONTEST.deadlineLabel}. Email on your account required.{' '}
            <a href="/quizzes/contest">See rules</a>.
          </p>
        ) : null}
        {/* ---- 4b. quick replay ---- */}
        {/* Inside the action grid (owner 2026-08-06) so it can sit BESIDE
            Back to Main on a phone instead of taking a third full-width row.
            A replay is free practice: the first completed attempt is what the
            leaderboard and streak keep, so a second run never overwrites the
            recorded score. */}
        {onReplay ? (
          <button type="button" className="dec-replay" onClick={goReplay}>
            <RefreshCw size={15} strokeWidth={2.2} />
            <span>Replay today’s {selfGame ? selfGame.name : 'puzzle'}</span>
            <span className="rs">{dailyAttemptRule(self).chip}</span>
          </button>
        ) : null}
      </div>

      {/* ---- 5. up next + easiest leaderboard ---- */}
      {/* Both cards are completion-derived, so each shows a shimmer skeleton until
          its data lands (never a guessed game), fades the real card in on arrival,
          and collapses if the fetch stalls past the skeleton timeout. */}
      {(!allDailiesDone && (nextReal || nextSkel || grab || grabSkel)) ? (
        <div className="dec-duo">
          {nextSkel ? (
            <div className="dec-nx" aria-hidden="true">
              <div className="dec-nx-top">
                <div className="dec-sk dec-sk-ring" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="dec-sk dec-sk-line" style={{ width: '58%', marginBottom: 8 }} />
                  <div className="dec-sk dec-sk-line" style={{ width: '82%', height: 15, marginBottom: 7 }} />
                  <div className="dec-sk dec-sk-line" style={{ width: '66%' }} />
                </div>
              </div>
              <div className="dec-nx-btns"><div className="dec-sk dec-sk-btn" style={{ flex: 1 }} /></div>
            </div>
          ) : nextReal ? (
            <div className="dec-nx dec-fadein">
              <div className="dec-nx-top">
                <div className="dec-nx-ico" style={{ color: nextMeta.accent }}>
                  <NextIcon size={24} strokeWidth={2} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="dec-eye" style={{ color: BLUE }}>Up next &middot; most similar unplayed</div>
                  <div className="dec-nx-name">
                    {nextTarget.name}
                    {autoRun ? (
                      <span className="dec-nx-cd">{secs > 0 ? <>Opens in {secs}s</> : <>Opening&hellip;</>}</span>
                    ) : null}
                  </div>
                  <div className="dec-nx-fam">
                    <span className="dec-dot" style={{ background: nextCat.color }} />
                    {nextCat.name} &middot; {nextTarget.tag}
                  </div>
                </div>
              </div>
              <div className="dec-nx-btns">
                <a className="b primary" href={nextTarget.href}>Play {nextTarget.name} <ArrowRight size={14} strokeWidth={2.6} /></a>
                {autoRun ? <button type="button" className="b" onClick={() => setAutoCancel(true)}>Not now</button> : null}
              </div>
            </div>
          ) : null}
          {grabSkel ? (
            <div className="dec-ez" aria-hidden="true">
              <div className="dec-ez-top">
                <div className="dec-sk" style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="dec-sk dec-sk-line" style={{ width: '62%', marginBottom: 8 }} />
                  <div className="dec-sk dec-sk-line" style={{ width: '46%', height: 15, marginBottom: 7 }} />
                  <div className="dec-sk dec-sk-line" style={{ width: '72%' }} />
                </div>
              </div>
              <div className="dec-sk dec-sk-btn" style={{ width: '100%' }} />
            </div>
          ) : grab ? (
            <div className="dec-ez dec-fadein">
              <div className="dec-ez-top">
                <div className="dec-ez-ico" style={{ color: grabMeta.accent }}>
                  <GrabIcon size={24} strokeWidth={2} />
                  <span className="tr" aria-hidden="true"><Trophy size={12} strokeWidth={2.6} /></span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="dec-eye" style={{ color: T.blue }}>Easiest leaderboard today</div>
                  <div className="dec-ez-name">{grab.name}</div>
                  <div className="dec-ez-fam">
                    <span className="dec-dot" style={{ background: grabCat.color }} />
                    {grabCat.name} &middot; {grab.tag}
                  </div>
                </div>
              </div>
              <a className="dec-ez-btn" href={grab.href}>Play {grab.name} <ArrowRight size={14} strokeWidth={2.6} /></a>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- 6. more of today's games ---- */}
      {/* Held until the completion set is known so the grid never lists a game the
          player already finished today (or shows a wrong "N of M played" count). */}
      {completionKnown && showMore ? (
        <>
          <div className="dec-morehd">
            <span className="dec-more-eye">More of today&rsquo;s puzzles</span>
            <span className="dec-more-count">{doneCount} of {total} played</span>
          </div>
          <div className={`dec-grid cols-${packedCols.length}`}>
            {packedCols.map((col, ci) => (
              <div className="dec-col" key={ci}>
                {col.map((block) => (
                  <div className="dec-group" key={block.cat}>
                    <div className="dec-gh" style={{ background: block.cm.color }}>
                      <span className="lbl">{block.cm.name}</span>
                      <span className="cnt">{block.items.length}</span>
                    </div>
                    <div className="dec-rows">
                    {block.items.map((g) => (
                      <a className={`dec-row${unfinished.has(g.key) ? ' resume' : ''}`} href={g.href} key={g.key}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="nm"><span className="t">{g.name}</span>{unfinished.has(g.key) ? <span className="dec-rz" aria-hidden="true"><svg viewBox="0 0 12 12" width="10" height="10" fill="none"><circle cx="6" cy="6" r="4" stroke="#e0b866" strokeWidth="1.8" /><path d="M6 2 A4 4 0 0 1 6 10" stroke="#d98a1f" strokeWidth="1.8" strokeLinecap="round" /></svg></span> : null}</div>
                          <div className="tg">{unfinished.has(g.key) ? 'Started, not finished' : g.tag}</div>
                        </div>
                        <span className={`play${unfinished.has(g.key) ? ' resume' : ''}`}><span className="pl">{unfinished.has(g.key) ? 'Resume' : 'Play'}</span><ArrowRight size={11} strokeWidth={2.6} /></span>
                      </a>
                    ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* ---- 6b. half or fewer dailies left: popular quizzes, one per category ---- */}
      {showPopular ? (
        <>
          <div className="dec-morehd">
            <span className="dec-more-eye">{allDailiesDone ? <>You&rsquo;ve cleared today&rsquo;s dailies &middot; try a quiz</> : <>While you&rsquo;re here &middot; try a quiz</>}</span>
            <span className="dec-more-count">{popularCats && popularCats.length ? 'one per category' : ''}</span>
          </div>
          {popularCats && popularCats.length ? (
            <div className={`dec-grid cols-${Math.min(3, popularCats.length)}`}>
              {(() => {
                const N = Math.min(3, popularCats.length);
                const cols = Array.from({ length: N }, () => []);
                popularCats.forEach((c, i) => cols[i % N].push(c));
                return cols.map((col, ci) => (
                  <div className="dec-col" key={ci}>
                    {col.map((c) => (
                      <div className="dec-group" key={c.dept}>
                        <div className="dec-gh" style={{ background: c.color }}>
                          <span className="lbl">{c.label}</span>
                        </div>
                        <div className="dec-rows one">
                          <a className="dec-row dec-pop dec-fadein" href={c.href}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div className="nm"><span className="t">{c.title}</span></div>
                              <div className="tg">{c.plays ? `${c.plays.toLocaleString()} plays` : 'Popular quiz'}</div>
                            </div>
                            <span className="play"><span className="pl">Play</span><ArrowRight size={11} strokeWidth={2.6} /></span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="dec-grid cols-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div className="dec-col" key={i}>
                  <div className="dec-group">
                    <div className="dec-sk" style={{ height: 34, borderRadius: 10, marginBottom: 8 }} />
                    <div className="dec-sk" style={{ height: 48, borderRadius: 11 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {/* ---- 7. bottom actions ---- */}
      <div className="dec-foot">
        <button type="button" className="dec-btn" onClick={() => openPanel('today')}>
          <BarChart3 size={15} strokeWidth={2} /> Leaderboards
        </button>
        {pastHref ? (
          <a className="dec-btn ink" href={pastHref}>
            <RotateCcw size={15} strokeWidth={2} /> Play a past {selfName}
          </a>
        ) : null}
      </div>

      {self ? (
        <ReportIssue
          self={self}
          name={selfName}
          accent={meta.accent}
        />
      ) : null}
    </div>
  );

  // THE RUN CARD. Verdict, where you are in the five, and one control. It
  // carries its own styles because the card's stylesheet lives INSIDE `inner`
  // (including .dec-backdrop and .dec-x, which the modal wrapper below needs),
  // so a branch that renders instead of `inner` renders unstyled without them.
  // The run card's own derived bits: the mini board's rows, and the gate.
  // runNextKey is needed by the gate, so both sit under it rather than beside
  // the other run consts further up.
  const runLb = (() => {
    const all = tileBoard('today');
    const top = all.slice(0, 3);
    const meRow = all.find((r) => r.me);
    return meRow && !top.some((r) => r.me) ? [...top, meRow] : top;
  })();
  const runGate = runActive && runUnsolvedEG && !!runNextKey;
  const replayNow = () => { if (onReplay) onReplay(); };

  const runInner = (
    <div className={`d5e-card${runMarq ? '' : ' circ'}`} style={modal ? { position: 'relative' } : undefined}>
      {modal && (
        <button type="button" className="dec-x" onClick={onClose} aria-label="Close">
          <X size={14} strokeWidth={2.6} />
        </button>
      )}
      <style>{`
        .dec-backdrop{position:fixed;inset:0;z-index:85;background:rgba(20,22,28,0.55);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;}
        .dec-x{position:absolute;top:9px;right:11px;width:24px;height:24px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:7px;background:rgba(255,255,255,.14);border:1px solid #2c437c;color:#cfe0ff;cursor:pointer;z-index:3;}
        .d5e-card{position:relative;background:var(--ground);color:#fff;border-radius:16px;padding:0;max-width:520px;width:100%;margin:0 auto;overflow:hidden;font-family:${SANS};}
        .d5e-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--gold);z-index:2;}
        /* Blue for a skill circuit, gold for the marquee, green when done. */
        .d5e-card.circ::before{background:var(--blue,#2563eb);}
        .d5e-card.done::before,.d5e-card.circ.done::before{background:var(--success);}
        .d5e-card.circ .d5e-eye{color:var(--blue-400,#60a5fa);}
        .d5e-cap{display:flex;align-items:center;gap:8px;padding:9px 16px;background:rgba(0,0,0,.22);}
        .d5e-mk{display:inline-flex;width:19px;height:19px;border-radius:5px;background:#fff;align-items:center;justify-content:center;flex:none;}
        .d5e-wm{font-size:11.5px;font-weight:800;letter-spacing:-.2px;}
        .d5e-wm i{font-style:normal;font-weight:500;opacity:.85;}
        .d5e-gm{margin-left:auto;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#9fb6e8;}
        .d5e-body{padding:17px 18px 18px;}
        .d5e-vd{display:flex;align-items:center;gap:9px;}
        .d5e-ck{display:inline-flex;color:var(--success);flex:none;}
        .d5e-ck.loss{color:#ffb3ad;}
        .d5e-tt{font-size:22px;font-weight:800;letter-spacing:-.5px;}
        .d5e-sc{margin-left:auto;font-size:13px;font-weight:700;color:#cfe0ff;font-variant-numeric:tabular-nums;}
        .d5e-eye{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-top:15px;}
        .d5e-card.done .d5e-eye{color:#7ff0c0;}
        .d5e-pips{display:flex;gap:5px;margin-top:8px;}
        .d5e-pips span{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.17);}
        .d5e-pips span.on{background:var(--success);}
        .d5e-pips span.now{background:var(--blue-400);}
        .d5e-go{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;background:var(--gold);color:#3a2a05;border-radius:10px;padding:14px 16px;font-size:13px;font-weight:800;letter-spacing:.03em;text-decoration:none;}
        .d5e-go:hover{background:#f0c65c;}
        .d5e-go.done{background:var(--success);color:#04301f;}
        .d5e-cd{font-size:11px;font-weight:700;opacity:.75;}
        .d5e-alt{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:11px;}
        .d5e-alt a,.d5e-alt button{background:none;border:0;padding:0;font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.04em;color:#93aae2;text-decoration:none;cursor:pointer;}
        .d5e-alt a:hover,.d5e-alt button:hover{color:#dbe6ff;}
        /* The mini board for the game just finished. */
        .d5e-lb{margin-top:13px;}
        .d5e-lb .h{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:5px;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#9fb6e8;}
        .d5e-lb .h s{text-decoration:none;letter-spacing:.04em;}
        .d5e-lbr{display:flex;align-items:center;gap:9px;padding:5px 8px;border-radius:7px;font-size:12px;font-weight:700;color:#dbe6ff;}
        .d5e-lbr .r{flex:none;width:15px;color:#93aae2;font-weight:800;font-variant-numeric:tabular-nums;}
        .d5e-lbr .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .d5e-lbr .v{flex:none;font-weight:800;font-variant-numeric:tabular-nums;}
        .d5e-lbr.first{background:rgba(232,180,58,.18);}
        .d5e-lbr.me{background:rgba(37,99,235,.30);}
        .d5e-lb .empty{font-size:11.5px;font-weight:700;color:#93aae2;}
        /* Retry stands in for the hand-off when the position is unsolved, so
           it takes the same shape and the blue, never the gold. */
        .d5e-go.retry{background:var(--blue,#2563eb);color:#fff;}
        .d5e-gate{margin-top:8px;font-size:11px;font-weight:700;color:#93aae2;text-align:center;}
        .d5e-again{display:block;width:100%;margin-top:9px;padding:9px;border-radius:9px;border:1px solid #35529e;background:rgba(255,255,255,.08);color:#dbe6ff;font-family:inherit;font-weight:800;font-size:11.5px;cursor:pointer;}
        .d5e-again:hover{background:rgba(255,255,255,.16);}
      `}</style>
      <div className="d5e-cap">
        <span className="d5e-mk" aria-hidden="true"><MindLoftMark size={15} ink="#233a63" accent="#2563eb" title="Mind Loft" /></span>
        <span className="d5e-wm">Mind <i>Loft</i></span>
        <span className="d5e-gm">{runName}</span>
      </div>
      <div className="d5e-body">
        <div className="d5e-vd">
          <span className={`d5e-ck${isCompleted ? '' : ' loss'}`}>
            {isCompleted ? <CheckCircle2 size={21} strokeWidth={2.4} /> : <Flag size={19} strokeWidth={2.4} />}
          </span>
          <span className="d5e-tt">{selfName} {isCompleted ? 'done' : 'finished'}</span>
          {score ? <span className="d5e-sc">{score}</span> : null}
        </div>

        <div className="d5e-eye">
          {runComplete
            ? `All ${runMembers.length} done ${runPoints ? `\u00b7 ${Math.round(runPoints * 10) / 10} pts` : ''}`
            : `${runDoneKeys.length} of ${runMembers.length} ${runPoints ? `\u00b7 ${Math.round(runPoints * 10) / 10} pts banked` : ''}`}
        </div>
        <div className="d5e-pips">
          {runMembers.map((k) => (
            <span key={k} className={doneKeys.has(k) ? 'on' : (k === runNextKey ? 'now' : '')} />
          ))}
        </div>

        {/* The board for the game just finished: top three plus your own row. */}
        <div className="d5e-lb">
          <div className="h">
            <b>{selfName} {'\u00b7'} today</b>
            {gameTodayField ? <s>{Number(gameTodayField).toLocaleString()} played</s> : null}
          </div>
          {runLb.length
            ? runLb.map((r, i) => (
                <div key={`${r.rank}-${i}`} className={`d5e-lbr${r.rank === 1 ? ' first' : ''}${r.me ? ' me' : ''}`}>
                  <span className="r">{r.rank}</span>
                  <span className="n">{r.me ? 'You' : (r.name || 'Anonymous')}</span>
                  <span className="v">{r.val}</span>
                </div>
              ))
            : <span className="empty">Nobody has finished this one yet.</span>}
        </div>

        {runGate ? (
          <>
            <button type="button" className="d5e-go retry" onClick={replayNow}>
              Play it again
              <RotateCcw size={15} strokeWidth={2.6} />
            </button>
            <div className="d5e-gate">
              Solve it to move on to {runNext ? runNext.name : 'the next game'}. {dailyAttemptRule(self).replay}
            </div>
          </>
        ) : runComplete ? (
          <a className="d5e-go done" href={runSummary}>
            <Trophy size={15} strokeWidth={2.4} />
            See how the run went
            {runAuto ? <span className="d5e-cd">{runSecs > 0 ? `${runSecs}s` : '\u2026'}</span> : null}
          </a>
        ) : runNext ? (
          <a className="d5e-go" href={circuitHref(runNextKey, inRun)}>
            Next {'\u00b7'} {runNext.name}
            <ArrowRight size={15} strokeWidth={2.6} />
          </a>
        ) : (
          <a className="d5e-go" href={runSummary}>Run summary <ArrowRight size={15} strokeWidth={2.6} /></a>
        )}

        {!runGate && runRetry ? (
          <button type="button" className="d5e-again" onClick={replayNow}>
            Play it again {'\u00b7'} {dailyAttemptRule(self).chip}
          </button>
        ) : null}

        <div className="d5e-alt">
          {runAuto ? <button type="button" onClick={() => setRunStay(true)}>Stay here</button> : null}
          {!runComplete ? <a href={runSummary}>Run summary</a> : null}
          <a href={(DAILY_GAME_MAP[self] || {}).href || `/${self}`}>Leave the run</a>
        </div>
      </div>
    </div>
  );

  // Which card this render is. The ordinary path is untouched.
  const cardBody = runActive ? runInner : inner;

  // Confetti is a fixed, pointer-events-off overlay rendered continuously so it
  // plays over the completed board during the reveal delay AND behind the popup.
  const confettiEl = confetti.length ? (
    <div aria-hidden="true">
      <style>{`
        .dec-conf{position:fixed;top:-6vh;z-index:120;pointer-events:none;border-radius:2px;will-change:transform,opacity;animation:dec-fall linear forwards;}
        @keyframes dec-fall{0%{transform:translateY(-6vh) rotate(0deg);opacity:1;}85%{opacity:1;}100%{transform:translateY(112vh) rotate(710deg);opacity:0;}}
        @media(prefers-reduced-motion:reduce){.dec-conf{display:none;}}
      `}</style>
      {confetti.map((c, i) => (
        <span
          key={i}
          className="dec-conf"
          style={{ left: c.left, width: c.w, height: c.h, background: c.color, animationDuration: c.dur, animationDelay: c.delay }}
        />
      ))}
    </div>
  ) : null;

  if (!modal) {
    return (<>{confettiEl}{revealed ? cardBody : null}</>);
  }
  return (
    <>
      {confettiEl}
      {revealed ? (
        <div className="dec-backdrop" onClick={onClose}>
          <div style={{ width: '100%', maxWidth: 760, margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            {cardBody}
          </div>
        </div>
      ) : null}
    </>
  );
}
