'use client';

// Daily Puzzles home block. REDESIGN (owner-approved mockup, 2026-07-28,
// "three columns, expanding game tiles" — Stage 1 of the quiz-home redesign):
// the old horizontal strip becomes a paper-and-ink TILE BOARD. An UP NEXT hero
// (navy block) sits on top; a filter row (All / Unplayed / Streak at risk) plus
// a "Daily leaderboard" toggle sits below it; then a white-tile grid of every
// daily. Clicking a tile expands it IN PLACE as an overlay: DailyTilePanel is
// rendered absolutely inside .dhome, covering the whole console (stats bar and
// grid alike, so only the panel's own Play button shows) rather than
// displacing it, so the board's height never changes and nothing below moves
// (owner request, 2026-07-29; it previously inserted a strip at the end of the
// selected tile's row, which pushed every later tile down the page).
//
// CLICK MODEL (owner, 2026-07-31): the panel is no longer what a tile click
// does by default. A tile you have NOT finished today is a PLAIN LINK into the
// game, so the board is one tap from playing and nothing stands between the
// player and the puzzle; a small chart glyph in its bottom-right corner still
// opens the panel for anyone who wants the archive first. A FINISHED tile is
// where the panel lives: it turns solid green, sheds its icon and category
// chip, reads "Click for stats & archive", and the whole tile opens the panel.
// The panel carries the game's identity and a
// one-line how-to-play, today's record and standings (from the
// /api/quiz/daily-combined per-game board), and, from one lazy
// /api/quiz/daily-game fetch, the archive calendar, the game's all-time
// leaderboard, and the viewer's own all-time record. The OVERALL daily
// leaderboard (overall top 3, per-game minis, recent champions) is still
// reachable via the "Daily leaderboard" toggle so nothing is lost before Stage 2
// promotes the page into three columns.
//
// Palette: sits directly on the page ground (#f7f8fa). White tiles, navy
// (#ffffff) as a material for the hero + expand panel, gold (#e8b43a) reserved
// for daily identity, green for a finished game. Matches the live QuizHomeClient
// tokens (bg #f7f8fa / surface #fff / accent #233a63 / cta #2563eb).
//
// Data wiring is unchanged from the strip: completion follows the signed-in
// player across devices via /api/quiz/daily-status (with the same-device
// localStorage sot_<key>_day breadcrumb + per-puzzle save detection for first
// paint), per-game streaks come from daily-status, and the leaderboard payload
// is the /api/quiz/daily-combined `board` prop. Adding a game to GAMES adds it
// to the board everywhere it's used.

import React, { useState, useEffect, useRef } from 'react';
import { Crown, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Trophy, Play, Flame, ArrowRight, Users, X, BarChart3, Star, Type, Hash, Grid3x3, Puzzle, HelpCircle, Globe2, Swords, Spade, Gamepad2 } from 'lucide-react';
import useDailyOrder, { sortByDailyOrder } from './useDailyOrder';
import useMyGames, { sortByMyGames } from './useMyGames';
import DailyTilePanel from './DailyTilePanel';
import DailyFiveBand from './DailyFiveBand';
import { T } from '@/lib/theme';
import { fetchDayStatus } from './useDayStats';
import { catBlue, deptBlue } from '@/lib/home-blues';
import { isSundayET, hasSundayEdition } from '@/lib/sunday-editions';
import { isRetiredDaily, dailyScoreText, KEEPS_ANSWER } from '@/lib/daily-games';
import { CIRCUIT_NAME_LISTS } from '@/lib/circuits';

const GAMES = [
  { key: 'crux', href: '/crux', name: 'Crux', img: '/games/btn-crux.png', store: 'sot_crux_day', tag: "A clueless crossword" , cat: 'Word' },
  { key: 'emcee', href: '/emcee', name: 'Emcee', img: '/games/btn-emcee.png', store: 'sot_emcee_day', tag: "The daily mini crossword" , cat: 'Word' },
  { key: 'shards', href: '/shards', name: 'Shards', img: '/games/btn-shards.png', store: 'sot_shards_day', tag: "Reassemble the crossword" , cat: 'Word' },
  { key: 'garble', href: '/garble', name: 'Garble', img: '/games/btn-garble.png', store: 'sot_garble_day', tag: "Untangle five words" , cat: 'Word' },
  { key: 'links', href: '/links', name: 'Links', img: '/games/btn-links.png', store: 'sot_links_day', tag: "Four hidden groups" , cat: 'Word' },
  { key: 'span', href: '/span', name: 'Span', img: '/games/btn-span.png', store: 'sot_span_day', tag: "Cross the map" , cat: 'Geography' },
  { key: 'dating', href: '/dating', name: 'Dating', img: '/games/btn-dating.png', store: 'sot_dating_day', tag: "Put history in order" , cat: 'Trivia' },
  { key: 'tally', href: '/tally', name: 'Tally', img: '/games/btn-tally.png', store: 'sot_tally_day', tag: "Balance the books" , cat: 'Numbers' },
  { key: 'suds', href: '/suds', name: 'Suds', img: '/games/btn-suds.png', store: 'sot_suds_day', tag: "The daily sudoku" , cat: 'Numbers' },
  { key: 'quilt', href: '/quilt', name: 'Quilt', img: '/games/btn-quilt.png', store: 'sot_quilt_day', tag: "Sudoku with no straight lines" , cat: 'Numbers' },
  { key: 'cages', href: '/cages', name: 'Cages', img: '/games/btn-cages.png', store: 'sot_cages_day', tag: "The daily killer sudoku" , cat: 'Numbers' },
  { key: 'sando', href: '/sando', name: 'Sando', img: '/games/btn-sando.png', store: 'sot_sando_day', tag: "The daily sandwich sudoku" , cat: 'Numbers' },
  { key: 'sixes', href: '/sixes', name: 'Sixes', img: '/games/btn-sixes.png', store: 'sot_sixes_day', tag: "The daily mini sudoku" , cat: 'Numbers' },
  { key: 'niche', href: '/niche', name: 'Niche', img: '/games/btn-niche.png', store: 'sot_niche_day', tag: "One answer, two categories" , cat: 'Trivia' },
  { key: 'shoe', href: '/shoe', name: 'Shoe', img: '/games/btn-shoe.png', store: 'sot_shoe_day', tag: "The daily blackjack shoe" , cat: 'Cards' },
  { key: 'queen', href: '/queen', name: 'Queen', img: '/games/btn-queen.png', store: 'sot_queen_day', tag: "White to play and promote" , cat: 'End Game' },
  { key: 'towers', href: '/towers', name: 'Towers', img: '/games/btn-towers.png', store: 'sot_towers_day', tag: "Count the towers in view" , cat: 'Numbers' },
  { key: 'mercury', href: '/mercury', name: 'Mercury', img: '/games/btn-mercury.png', store: 'sot_mercury_day', tag: "The daily thermo sudoku" , cat: 'Numbers' },
  { key: 'polka', href: '/polka', name: 'Polka', img: '/games/btn-polka.png', store: 'sot_polka_day', tag: "No numbers, only dots" , cat: 'Numbers' },
  { key: 'diag', href: '/diag', name: 'Diag', img: '/games/btn-diag.png', store: 'sot_diag_day', tag: "The daily diagonal sudoku" , cat: 'Numbers' },
  { key: 'whittle', href: '/whittle', name: 'Whittle', img: '/games/btn-whittle.png', store: 'sot_whittle_day', tag: "The sudoku, backwards" , cat: 'Numbers' },
  { key: 'knight', href: '/knight', name: 'Knight', img: '/games/btn-knight.png', store: 'sot_knight_day', tag: "The daily anti-knight sudoku" , cat: 'Numbers' },
  { key: 'carve', href: '/carve', name: 'Carve', img: '/games/btn-carve.png', store: 'sot_carve_day', tag: "Equal-sum blocks" , cat: 'Numbers' },
  { key: 'extra', href: '/extra', name: 'Extra', img: '/games/btn-extra.png', store: 'sot_extra_day', tag: "Name the story" , cat: 'Trivia' },
  { key: 'stet', href: '/stet', name: 'Stet', img: '/games/btn-stet.png', store: 'sot_stet_day', tag: "Spot the error, fix the copy" , cat: 'Word' },
  { key: 'outwit', href: '/outwit', name: 'Outwit', img: '/games/btn-outwit.png', store: 'sot_outwit_day', tag: "Beat the crowd" , cat: 'Crowd Psychology' },
  { key: 'outrank', href: '/outrank', name: 'Outrank', img: '/games/btn-outrank.png', store: 'sot_outrank_day', tag: "Call the crowd's order" , cat: 'Crowd Psychology' },
  { key: 'tuck', href: '/tuck', name: 'Tuck', img: '/games/btn-tuck.png', store: 'sot_tuck_day', tag: "Same letters, highest score wins" , cat: 'Word' },
  { key: 'alibi', href: '/alibi', name: 'Alibi', img: '/games/btn-alibi.png', store: 'sot_alibi_day', tag: "Solve the nightly whodunit" , cat: 'Logic' },
  { key: 'cipher', href: '/cipher', name: 'Cipher', img: '/games/btn-cipher.png', store: 'sot_cipher_day', tag: "Crack the letter math" , cat: 'Numbers' },
  { key: 'ping', href: '/ping', name: 'Ping', img: '/games/btn-ping.png', store: 'sot_ping_day', tag: "Guess the secret city" , cat: 'Geography' },
  { key: 'warmer', href: '/warmer', name: 'Warmer', img: '/games/btn-warmer.png', store: 'sot_warmer_day', tag: "Hotter or colder" , cat: 'Word' },
  { key: 'jester', href: '/jesters', name: 'Jesters', img: '/games/btn-jester.png', store: 'sot_jester_day', tag: "Seat the court" , cat: 'Logic' },
  { key: 'sworn', href: '/sworn', name: 'Sworn', img: '/games/btn-sworn.png', store: 'sot_sworn_day', tag: "Spot the liars" , cat: 'Logic' },
  { key: 'axiom', href: '/axiom', name: 'Axiom', img: '/games/btn-axiom.png', store: 'sot_axiom_day', tag: "Find the hidden rule" , cat: 'Logic' },
  { key: 'hearsay', href: '/hearsay', name: 'Hearsay', img: '/games/btn-hearsay.png', store: 'sot_hearsay_day', tag: "Deduce what they don't know" , cat: 'Logic' },
  { key: 'venn', href: '/venn', name: 'Venn', img: '/games/btn-venn.png', store: 'sot_venn_day', tag: "Sort the overlaps" , cat: 'Logic' },
  { key: 'stands', href: '/stands', name: 'Stands', img: '/games/btn-stands.png', store: 'sot_stands_day', tag: "Rebuild the results" , cat: 'Logic' },
  { key: 'bracket', href: '/bracket', name: 'Bracket', img: '/games/btn-bracket.png', store: 'sot_bracket_day', tag: "Name every winner" , cat: 'Trivia' },
  // PRICER PULLED 2026-08-09 (see CLAUDE.md). Restore: grep -rn 'PRICER PULLED' slate tile
  // { key: 'pricer', href: '/pricer', name: 'Pricer', img: '/games/btn-pricer.png', store: 'sot_pricer_day', tag: "Some days more, some days less" , cat: 'Numbers' },
  { key: 'lode', href: '/lode', name: 'Lode', img: '/games/btn-lode.png', store: 'sot_lode_day', tag: "Seven letters, rare words pay" , cat: 'Word' },
  { key: 'etch', href: '/etch', name: 'Etch', img: '/games/btn-etch.png', store: 'sot_etch_day', tag: "A picture in the numbers" , cat: 'Logic' },
  { key: 'glyph', href: '/glyph', name: 'Glyph', img: '/games/btn-glyph.png', store: 'sot_glyph_day', tag: "A crossword with no clues" , cat: 'Word' },
  { key: 'hedge', href: '/hedge', name: 'Hedge', img: '/games/btn-hedge.png', store: 'sot_hedge_day', tag: "Draw one closed loop" , cat: 'Logic' },
  { key: 'listed', href: '/listed', name: 'Listed', img: '/games/btn-listed.png', store: 'sot_listed_day', tag: "Rank the list, top to bottom" , cat: 'Trivia' },
  { key: 'mate', href: '/mate', name: 'Mate', img: '/games/btn-mate.png', store: 'sot_mate_day', tag: "White to play and mate" , cat: 'End Game' },
  { key: 'four', href: '/four', name: 'Four', img: '/games/btn-four.png', store: 'sot_four_day', tag: "One column wins" , cat: 'End Game' },
  { key: 'park', href: '/parker', name: 'Parker', img: '/games/btn-park.png', store: 'sot_park_day', tag: "Get the red one out" , cat: 'Logic' },
  { key: 'impound', href: '/impound', name: 'Impound', img: '/games/btn-impound.png', store: 'sot_impound_day', tag: "Parker on a bigger lot" , cat: 'Logic' },
  { key: 'junkyard', href: '/junkyard', name: 'Junkyard', img: '/games/btn-junkyard.png', store: 'sot_junkyard_day', tag: "Parker on the biggest lot" , cat: 'Logic' },
  { key: 'check', href: '/check', name: 'Check', img: '/games/btn-check.png', store: 'sot_check_day', tag: "Red to play and sweep" , cat: 'End Game' },
  { key: 'rung', href: '/rung', name: 'Rung', img: '/games/btn-rung.png', store: 'sot_rung_day', tag: "One letter at a time" , cat: 'Word' },
  { key: 'hinge', href: '/hinge', name: 'Hinge', img: '/games/btn-hinge.png', store: 'sot_hinge_day', tag: "Chain the compounds" , cat: 'Word' },
  { key: 'crunch', href: '/crunch', name: 'Crunch', img: '/games/btn-crunch.png', store: 'sot_crunch_day', tag: "Six numbers, one target" , cat: 'Numbers' },
  { key: 'taire', href: '/taire', name: 'Taire', img: '/games/btn-taire.png', store: 'sot_taire_day', tag: "The daily solitaire" , cat: 'Cards' },
  { key: 'fib', href: '/fib', name: 'Fib', img: '/games/btn-fib.png', store: 'sot_fib_day', tag: "One clue is lying" , cat: 'Logic' },
  { key: 'streak', href: '/streak', name: 'Streak', img: '/games/btn-streak.png', store: 'sot_streak_day', tag: "Forty questions, one life" , cat: 'Trivia' },
  { key: 'feud', href: '/feud', name: 'Feud', img: '/games/btn-feud.png', store: 'sot_feud_day', tag: "Match the crowd" , cat: 'Crowd Psychology' },
  { key: 'babel', href: '/babel', name: 'Babel', img: '/games/btn-babel.png', store: 'sot_babel_day', tag: "The bag is empty" , cat: 'Word' },
  { key: 'hands', href: '/hands', name: 'Hands', img: '/games/btn-hands.png', store: 'sot_hands_day', tag: "The daily poker solitaire" , cat: 'Cards' },
  { key: 'finesse', href: '/finesse', name: 'Finesse', img: '/games/btn-finesse.png', store: 'sot_finesse_day', tag: "The daily double dummy" , cat: 'Cards' },
  { key: 'chain', href: '/chain', name: 'Chain', img: '/games/btn-chain.png', store: 'sot_chain_day', tag: "Take them, or leave them" , cat: 'End Game' },
  { key: 'turn', href: '/turn', name: 'Turn', img: '/games/btn-turn.png', store: 'sot_turn_day', tag: "Ten squares left" , cat: 'End Game' },
  { key: 'suffice', href: '/suffice', name: 'Suffice', img: '/games/btn-suffice.png', store: 'sot_suffice_day', tag: "Decide what is enough" , cat: 'Logic' },
  { key: 'strata', href: '/strata', name: 'Strata', img: '/games/btn-strata.png', store: 'sot_strata_day', tag: "Dig the words out" , cat: 'Word' },
  { key: 'chomp', href: '/chomp', name: 'Chomp', img: '/games/btn-chomp.png', store: 'sot_chomp_day', tag: "Eat them in order" , cat: 'Logic' },
  { key: 'blocks', href: '/blocks', name: 'Blocks', img: '/games/btn-blocks.png', store: 'sot_blocks_day', tag: "Same shapes, same order" , cat: 'Arcade' },
  { key: 'docket', href: '/docket', name: 'Docket', img: '/games/btn-docket.png', store: 'sot_docket_day', tag: "One setup, five deductions" , cat: 'Logic' },
  { key: 'plot', href: '/plot', name: 'Plot', img: '/games/btn-plot.png', store: 'sot_plot_day', tag: "Divide the whole board" , cat: 'Logic' },
  { key: 'barter', href: '/barter', name: 'Barter', img: '/games/btn-barter.png', store: 'sot_barter_day', tag: "Trade the letters home" , cat: 'Word' },
  { key: 'defend', href: '/defend', name: 'Defend', img: '/games/btn-defend.png', store: 'sot_defend_day', tag: "Black to play and survive" , cat: 'End Game' },
  { key: 'blitz', href: '/blitz', name: 'Blitz', img: '/games/btn-blitz.png', store: 'sot_blitz_day', tag: "Twenty problems, one life" , cat: 'Numbers' },
  { key: 'blitzed', href: '/blitzed', name: 'Blitzed', img: '/games/btn-blitzed.png', store: 'sot_blitzed_day', tag: "Twenty problems, three numbers each" , cat: 'Numbers' },
  { key: 'sums', href: '/sums', name: 'Sums', img: '/games/btn-sums.png', store: 'sot_sums_day', tag: "The daily kakuro" , cat: 'Numbers' },
  { key: 'sweep', href: '/sweep', name: 'Sweep', img: '/games/btn-sweep.png', store: 'sot_sweep_day', tag: "No bottom edge" , cat: 'Arcade' },
  { key: 'redact', href: '/redact', name: 'Redact', img: '/games/btn-redact.png', store: 'sot_redact_day', tag: "Uncover the story" , cat: 'Trivia' },
  { key: 'paths', href: '/paths', name: 'Paths', img: '/games/btn-paths.png', store: 'sot_paths_day', tag: "Link every town" , cat: 'Logic' },
  { key: 'deep', href: '/deep', name: 'Deep', img: '/games/btn-deep.png', store: 'sot_deep_day', tag: "One topic, fifteen questions" , cat: 'Trivia' },
  { key: 'anon', href: '/anon', name: 'Anon', img: '/games/btn-anon.png', store: 'sot_anon_day', tag: "A clueless acrostic" , cat: 'Word' },
  { key: 'atlas', href: '/atlas', name: 'Atlas', img: '/games/btn-atlas.png', store: 'sot_atlas_day', tag: "Twenty-five questions, one life" , cat: 'Geography' },
  { key: 'sport', href: '/sport', name: 'Sport', img: '/games/btn-sport.png', store: 'sot_sport_day', tag: "Every sport, one life" , cat: 'Trivia' },
  { key: 'calc', href: '/calc', name: 'Calc', img: '/games/btn-calc.png', store: 'sot_calc_day', tag: "Walk the calculator" , cat: 'Numbers' },
  { key: 'encore', href: '/encore', name: 'Encore', img: '/games/btn-encore.png', store: 'sot_encore_day', tag: "The daily crossword" , cat: 'Word' },
  { key: 'biz', href: '/biz', name: 'Biz', img: '/games/btn-biz.png', store: 'sot_biz_day', tag: "Business, one life" , cat: 'Trivia' },
  { key: 'flank', href: '/flank', name: 'Flank', img: '/games/btn-flank.png', store: 'sot_flank_day', tag: "Name every neighbor" , cat: 'Geography' },
  { key: 'script', href: '/script', name: 'Script', img: '/games/btn-script.png', store: 'sot_script_day', tag: "Movies and TV, one life" , cat: 'Trivia' },
  { key: 'quotes', href: '/quotes', name: 'Quotes', img: '/games/btn-quotes.png', store: 'sot_quotes_day', tag: "Who said it, one life" , cat: 'Trivia' },
  { key: 'focus', href: '/focus', name: 'Focus', img: '/games/btn-focus.png', store: 'sot_focus_day', tag: "Name the zoomed-in photo" , cat: 'Trivia' },
  { key: 'thread', href: '/thread', name: 'Thread', img: '/games/btn-thread.png', store: 'sot_thread_day', tag: "Nine films described badly, one thread" , cat: 'Trivia' },
  { key: 'slot', href: '/slot', name: 'Slot', img: '/games/btn-slot.png', store: 'sot_slot_day', tag: "Ten things, one at a time" , cat: 'Trivia' },
// Retired games leave the board by themselves the morning after their bank's
// last drop (RETIRED_DAILY in lib/daily-games). Every count on this strip is
// derived from GAMES, so the "all N done" copy follows along.
].filter((g) => !isRetiredDaily(g.key));

const NAME_BY_KEY = GAMES.reduce((m, g) => { m[g.key] = g.name; return m; }, {});
// Recent Champions list length (yesterday plus the prior days), sized to fill
// the overall-leaderboard column beside the per-game minis.
const CHAMPION_DAYS = 8;
// The breathing room left above an opened panel once the sticky page header has
// been cleared. Same 8px focusListSearch in QuizCommandHeader already leaves.
// See revealOpen.
const HEAD_GAP = 8;
// How many tiles the board WINDOW shows before the rest have to be scrolled to.
// The grid is six columns wide on a full-width desktop, so thirty is exactly the
// five rows the board has always been, and the console keeps one height no matter
// how many dailies the site runs. At narrower desktop widths the column count
// drops and the window keeps showing thirty tiles, just in more rows.
const BOARD_WINDOW = 30;
// Navy-legible per-game accents for the mini-board titles (match DailyCombinedLeaderboard).
const ACCENTS = { diag: '#7dd3fc', junkyard: '#d9b070', slot: '#b8cf6e', impound: '#e3bd85', whittle: '#dcae6a', finesse: '#c4b5fd', sums: '#f472b6', hinge: '#a5b4fc', blitzed: '#a8e063', thread: '#e9a3d0', focus: '#fdba74', script: '#c9a4ea', quotes: '#a8b8e8', knight: '#9d99f0', flank: '#b1d977', biz: '#4fbf8b', encore: '#86a9ff', plot: '#e0a86a', sando: '#5ec8d0', cages: '#cba6f7', quilt: '#eda5e6', crux: '#5b9bff', emcee: '#e879f9', garble: '#f0c95a', links: '#4ca878', span: '#e06aa0', dating: '#a483f0', tally: '#4cb377', suds: '#f0894c', circa: '#38b6cf', extra: '#e06a6a', carve: '#a483f0', stet: '#41b1e8', outwit: '#c3cfe3', tuck: '#e0a568', alibi: '#ef8896', cipher: '#3fc9b8', ping: '#4cb3f0', warmer: '#f3705c', jester: '#7c3aed', outrank: '#8b8af5', sworn: '#f472b6', shards: '#2dd4bf', hearsay: '#c4b5fd', venn: '#e0a568', stands: '#6aa3ff', bracket: '#f0894c', pricer: '#4ade80', lode: '#e0b34c', etch: '#8fbf5a', hedge: '#4cc0d4', listed: '#e07ad0', axiom: '#3fc9b8', mate: '#d9b38c', four: '#9db8ff', park: '#f0cf9a', check: '#5fd6b8', rung: '#7fd4e8', crunch: '#f0c07a', fib: '#c4b5fd', streak: '#fb7185', deep: '#7dd3fc', anon: '#e8969f', feud: '#fda4af', babel: '#6ee7b7', glyph: '#94a3b8', chain: '#f0abfc', turn: '#8cda81' };
// Saturated one-color-per-game identity for the tile accent + expand panel
// (the "one saturated color per game" system used on the live game pages).
const TCOL = { diag: '#0e7490', junkyard: '#5c3a16', slot: '#4a5d23', impound: '#6b4a1f', whittle: '#854d0e', finesse: '#4c1d95', sums: '#be185d', hinge: '#4f46e5', blitzed: '#3f6d1f', thread: '#8b2c6b', focus: '#8a4b08', script: '#4a1d6b', quotes: '#3d4f7c', knight: '#3730a3', flank: '#3f6212', biz: '#0f5132', encore: '#1d4ed8', plot: '#78350f', sando: '#15616b', cages: '#6b21a8', quilt: '#a21caf', crux: T.blue, emcee: '#c026d3', shards: '#0d9488', garble: '#8a6d1a', links: '#166534', span: '#9d174d', dating: '#6d28d9', tally: T.successDeep, suds: '#ea580c', carve: '#7c3aed', extra: '#b91c1c', stet: '#0369a1', outwit: '#1f2937', outrank: '#4338ca', tuck: '#92400e', alibi: '#8b1e2d', cipher: '#0f766e', ping: '#0284c7', warmer: '#dc2626', jester: '#7c3aed', sworn: '#be185d', axiom: '#0f766e', hearsay: '#5b21b6', venn: '#b45309', stands: T.blueDeep, bracket: '#c2410c', pricer: '#15803d', lode: T.goldInk, etch: '#4d7c0f', hedge: '#0891b2', listed: '#86198f', mate: '#6b4423', four: T.blueDark, park: '#7c5c2e', check: '#166e5a', rung: '#155e75', crunch: '#b45309', fib: '#4c1d95', streak: '#e11d48', deep: '#0c4a6e', anon: '#8c2f39', feud: '#9f1239', babel: '#14532d', glyph: '#334155', chain: '#4a044e', turn: '#226218' };
const tcol = (k) => TCOL[k] || T.blue;

// Homepage-only blue tile art. The slate rows and the two cap tiles use a
// recolored copy of each game's button art (same drawing, mapped onto the
// brand blue ramp) so the table reads as one palette instead of forty-four.
// The original full-color PNGs stay in /games and are what every game page,
// end card, and share image still uses. A missing blue file falls back to the
// original rather than showing a broken image (owner, 2026-08-04).
const blueTile = (p) => (typeof p === 'string' ? p.replace('/games/btn-', '/games/blue/btn-') : p);
const tileFallback = (e) => {
  const el = e && e.currentTarget;
  if (el && el.src && el.src.indexOf('/games/blue/') !== -1) el.src = el.src.replace('/games/blue/btn-', '/games/btn-');
};
// Today's play count, rendered in the tile's top-left corner. The badge has
// roughly 30px before it reaches a long game name, so four figures collapse to
// "1.2k" rather than running under the title.
const fmtPlays = (v) => (v >= 10000 ? Math.round(v / 1000) + 'k' : v >= 1000 ? (Math.round(v / 100) / 10) + 'k' : String(v));
// Faint tile tints (owner, 2026-07-29: "the colours should be more faint").
// Each game's saturated hue is mixed down into the board's own deep navy, so a
// tile is recognisably its game's colour while the board still reads as one
// calm surface. The saturated hue stays on the top rule for punch. Computed
// here rather than with CSS color-mix so it renders identically everywhere.
const TINT_BASE = T.white;
function mixHex(hex, pct, base) {
  const h = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const [r1, g1, b1] = h(hex), [r2, g2, b2] = h(base);
  const m = (a, b) => Math.round(a * pct + b * (1 - pct)).toString(16).padStart(2, '0');
  return '#' + m(r1, r2) + m(g1, g2) + m(b1, b2);
}

// The category chip is keyed to the CATEGORY, not the game (owner, 2026-07-29),
// so every Word chip matches every other Word chip and the grid gains a second,
// consistent layer of grouping. Navy-legible hues, one clearly distinct per
// category.
// Recolored to the homepage blue family 2026-08-04. Each category still gets
// its OWN shade so the column stays scannable, they are just all blues now.
// Values live in lib/home-blues so the slate chips and the live feed chips
// cannot drift apart.
const CAT_COLOR = {
  Word: catBlue('word'), Numbers: catBlue('numbers'), Logic: catBlue('logic'),
  Sudoku: catBlue('sudoku'),
  History: catBlue('history'), Geography: catBlue('geography'),
  'Crowd Psychology': catBlue('crowd'), Trivia: catBlue('trivia'),
  'End Game': catBlue('end game'), Cards: catBlue('cards'), Arcade: catBlue('arcade'),
};
const CAT_CHIP_BG = {}, CAT_BD = {};
for (const [k, v] of Object.entries(CAT_COLOR)) {
  CAT_CHIP_BG[k] = mixHex(v, 0.13, TINT_BASE);
  CAT_BD[k] = mixHex(v, 0.72, TINT_BASE);
}
const catCol = (cat) => CAT_COLOR[cat] || T.muted;

const CAT_GLYPH = {
  Word: Type,
  Numbers: Hash,
  Sudoku: Grid3x3,
  Logic: Puzzle,
  Geography: Globe2,
  Trivia: HelpCircle,
  'End Game': Swords,
  Cards: Spade,
  Arcade: Gamepad2,
  'Crowd Psychology': Users,
};
// 'Crowd Psychology' is too long for a tile chip.
const CAT_SHORT = { 'Crowd Psychology': 'Crowd' };

/* CIRCUITS (owner list, 2026-08-15). The cross-cut: a category says what a game
   IS, a circuit says what SKILL it exercises, so they are two axes and a game
   can sit in one, both or neither. A circuit that only restated a top-level
   category was dropped, and since 2026-08-24 the strip also DEDUPES the two
   axes on the label, so a circuit sharing a category's name never renders as a
   second chip saying the same word.

   Circuits cross categories on purpose: Span is Spatial Puzzles and the whole
   of Geography, Outrank is Ranking and Crowd. Keyed by display name, which is
   how the list was given and how the roster reads.

   MODULE SCOPE, NOT COMPONENT SCOPE, and that is load-bearing. slateMatch calls
   circuitsOf, and slateList runs slateMatch during render some 250 lines above
   where the rest of the catboard helpers are defined, so as a component-scope
   const it sat in the temporal dead zone and threw ReferenceError on every
   render. That is invisible to esbuild and to no-undef, and it fails the build
   at prerender rather than at parse. Neither of these depends on component
   state, so neither belongs in the component. */
// THE ROSTERS MOVED TO lib/circuits.js (owner, 2026-08-18), and this is now a
// derived view of them rather than a second list. A circuit is a thing you can
// RUN as well as a thing you can filter by, so the two had to become one list
// or they would have drifted the first time either changed. The shape is
// unchanged ([displayName, [gameName, ...]]), so circuitsOf, slateMatch and the
// filter strip below are untouched.
//
// What changed in the rosters themselves: they became SIXTEEN circuits ordered
// shortest-median-first like the Daily Five, each one holding the games its own
// title describes. They are NOT exclusive and NOT exhaustive (owner ruling,
// 2026-08-24): a game may be in several circuits or in none, and only the cap
// of five on a fixed roster and the floor of two still bind. So circuitsOf can
// return two names for one game, which is why it has always returned an array.
// See the block comment in lib/circuits.js for the whole rule set.
const CIRCUITS = CIRCUIT_NAME_LISTS;
const circuitsOf = (g) => CIRCUITS.filter(([, names]) => names.includes(g.name)).map(([n]) => n);
/* THE FILTER STRIP IS ONE STRIP, AT EVERY WIDTH, WITH NO NAME IN IT TWICE
   (owner, 2026-08-24). Three changes that are really one change:

   ONE STRIP. The circuits used to be a SECOND navy row on a desktop and, on a
   phone, a duplicate copy of themselves at the tail of row one, with each
   breakpoint display:none-ing the copy it did not want. That cost two rows, two
   refs, two overflow states, two scroll effects and a class (.sl-fc) whose only
   job was to hide the copy that was not wanted, and it had already mis-fired
   once and rendered every circuit twice. There is ONE list now, rendered once.
   The widths still differ, but only in how a chip is PAINTED: an underlined tab
   above 900px, a pill below it. No markup branch, so nothing to desynchronise
   between the server render and hydration, and nothing announced twice.

   NO DUPLICATE NAMES. A category and a circuit could carry the same name, which
   put one word in the strip twice pointing at two different sets (Arcade was
   both, a 2-game category and a 5-game circuit). The list is deduped on the
   LABEL THE READER SEES and the CATEGORY WINS: it is the axis the board itself
   groups by, and the circuit is still runnable from /circuits. Arcade's roster
   was cut to the category's two games the same day, so the two now name the
   same pair anyway. See the block comment in lib/circuits.js.

   LEAD, THEN A-Z. Five subjects lead in a fixed order and everything else
   follows alphabetically. The lead is the owner's order, not a size ranking,
   and its real job is the first slot on a 390px phone: pure A-Z put Word
   seventh, behind Arcade, Cards, Crowd, End Game and Geography, so the deepest
   pool on the site could only be reached with a sideways flick. A lead name
   that is not on today's board is skipped rather than rendered empty, so the
   order survives a roster change on its own. Note that Sudoku is a CIRCUIT and
   the other four are categories, which is exactly why the strip has to hold
   both kinds in ONE list rather than in two rows.

   WHAT LEFT WITH THEM: the "More in X" pill (owner, 2026-08-24). It jumped to
   the viewer's most-played unfinished category and sat in slot two, so in the
   commonest case of all, a reader whose top category also leads the row, the
   strip opened "More Logic ... Logic" and named the same thing twice under two
   different labels. The category it pointed at is in the strip already, and Up
   next on the cap above makes the same walk to the same game. */
const STRIP_LEAD = ['Word', 'Sudoku', 'Logic', 'End Game', 'Trivia'];
const CIRCUIT_NAMES = CIRCUITS.map(([n]) => n);
/* [filterKey, label] for every subject chip in the strip, deduped and ordered.
   `withCircuits` is false on the plain slate layout, which has never carried
   circuit chips; the catboard passes true. Pure, so it stays at module scope
   with the rest of the strip's data. */
const stripSubjects = (catNames, withCircuits) => {
  // Categories FIRST in the pool, which is what makes them win a name clash.
  const pool = catNames.map((c) => [c, CAT_SHORT[c] || c])
    .concat(withCircuits ? CIRCUIT_NAMES.map((n) => ['circuit:' + n, n]) : []);
  const seen = new Set();
  const rest = [];
  for (const e of pool) {
    const label = String(e[1]).toLowerCase();
    if (seen.has(label)) continue;
    seen.add(label);
    rest.push(e);
  }
  const lead = [];
  for (const name of STRIP_LEAD) {
    const i = rest.findIndex((e) => e[1] === name);
    if (i >= 0) lead.push(rest.splice(i, 1)[0]);
  }
  rest.sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'en', { sensitivity: 'base' }));
  return lead.concat(rest);
};
/* THE FILL PANEL (owner, 2026-08-15). A narrow group is three rows and then
   600px of white, because the board's height is MEASURED to the fold (--dh-fit)
   and does not shrink when a filter empties it. Rather than let that read as a
   bug, the space answers the question the filter just asked, what else is
   there, in the order a reader wants it: the last week of these same games,
   the neighbouring groups, quizzes on the same subject, and a way to ask for
   the game that is missing.

   DESKTOP ONLY, like the whole catboard. Every rule is inside the
   min-width:901px block and .cb-fill joins the max-width:900px hide list, so a
   phone renders the plain slate exactly as before. */
const FILL_DAYS = 7;    // catch-up chips per game
const FILL_GAMES = 24;  // games the catch-up table covers, i.e. all of them
/* THE PANEL IS NOT SIZE-GATED (owner, 2026-08-15). It used to render only on
   groups of eight games or fewer, on the reasoning that a long group fills the
   console by itself, which made Word, Logic and Numbers the only three subjects
   on the board that behaved differently and read as a bug rather than a rule.
   Every category and every circuit gets it now; a long one simply scrolls, which
   it already did. */
/* STATE CHIPS GET A TABLE, AND ONLY A TABLE (owner, 2026-08-15). Paused, Failed
   and Done are not subjects, so More in X and a matching quiz department mean
   nothing there and are dropped. Catch up and archive completion work on any
   list of games however it was assembled, and those screens are often the
   emptiest on the board: Failed regularly holds one row. All, Ready and Sundays
   stay out, since they are the whole slate rather than a narrowing of it. */
const FILL_STATES = ['paused', 'failed', 'done'];
const FILL_STATE_WORD = { paused: 'paused', failed: 'failed today', done: 'done today' };
// Is an ISO date a Sunday? Built on Date.UTC so it reads the date it was given
// and not the viewer's timezone, the same reason sunDate parses by hand.
function isoSunday(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return !!m && new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay() === 0;
}
/* Group -> quiz department, and DELIBERATELY partial. A wrong pairing is worse
   than no block: Logic, Deduction, Crowd and the number groups have no honest
   department, so they render the panel without the quiz section rather than
   pointing at Science because it was the nearest thing. Keys are quiz dept ids
   from lib/quiz-departments (DEPT_LABEL). */
const FILL_DEPT = {
  Word: 'word', Crosswords: 'word', 'Word Building': 'word', Anagrams: 'word', Sorting: 'word',
  Geography: 'geography', History: 'history', Trivia: 'entertainment',
  Cards: 'gaming', Arcade: 'gaming', Chess: 'gaming', 'Board Games': 'gaming',
};
// The PHONE peek: six UNPLAYED games, and only unplayed ones (owner,
// 2026-08-08). The collapsed slate is the "what should I play next" screen, so
// every line of it goes to a game you have NOT started. Paused games are already
// on the screen as cap cards directly above the board, so spending two of six
// lines restating them cost a third of the peek to say nothing new; they sit at
// the foot of Ready to play and appear when the group is expanded.
//
// Finished games peek NOTHING for the same reason, one step further along: you
// already know how you did, so the band plus its bar is the whole group until
// you ask.
//
// Desktop lists every unfinished row as before: the hide class and the bar are
// both inert above 900px.
// IN PROGRESS AND INCOMPLETE START SHUT ON A PHONE AND OPEN ON DESKTOP (owner,
// 2026-08-09). Both groups are already represented in the cap directly above the
// board, so on a phone, where the cap and the board cannot be seen at once,
// listing them again costs a screen to say what the hero cards just said. On
// desktop the cap and the board share the fold, so there is nothing to save and
// a collapsed group is just a lid over rows that had room anyway.
const PHONE_ROWS = 6;     // unplayed games visible while the group is collapsed
// From 641px the board runs TWO ACROSS (see the tablet tier in the stylesheet),
// so the same budget would peek half as many LINES: six games became three rows
// on an iPad mini in portrait. Doubled, so the peek is the same six lines deep
// it is on a phone (owner, 2026-08-08). Lines are what the reader counts.
const TABLET_ROWS = 12;
// The tablet tier: two columns, but still a touch device, so the row keeps the
// phone's whole-row-opens-the-drawer model. Portrait tablets (744, 768, 820) and
// the larger phones in landscape (844) all land here.
const TABLET_MQ = '(min-width:641px) and (max-width:900px)';
// ...and the tier ABOVE it, where the home page has ALREADY given up its three
// columns (owner, 2026-08-08). This is the same 901-1200px band the page grid
// uses: `.qzh .dhx` drops from `284px | 1fr | 300px` to two equal columns and
// `.dhx-center` takes order:-1, so the console runs FULL WIDTH with the rails
// stacked two-up beneath it rather than beside it. A slate listing every
// unfinished game is 46 rows there, which buries the leaderboard and the live
// feed under a screen and a half of scrolling. The peek belongs wherever the
// console is a block in a stack, which is exactly this band.
//
// It was briefly gated on `pointer:coarse` instead, on the reasoning that the
// devices landing here are tablets (iPad Pro 12.9" portrait is 1024, the 13" Air
// is 1024, an 11" in landscape is 1180). That was the wrong test twice over: an
// iPad carrying a Magic Keyboard reports pointer:FINE, and no device-preview
// tool emulates the pointer media feature at all, so the tier could not be seen
// in the one place it gets checked. The layout, not the input device, is what
// makes the long list wrong here.
const STACKED_MQ = '(min-width:901px) and (max-width:1200px)';
// The board runs TWO ACROSS in both tiers (the tablet grid below 900px and the
// desktop grid above it), so both double the peek budget to the same six LINES.
// A comma is an OR in a media query list, which is what matchMedia takes.
const TWO_UP_MQ = TABLET_MQ + ', ' + STACKED_MQ;
// How many PAUSED cards the cap shows before its expand bar takes over.
// ONE at both widths since 2026-08-09 (owner), down from two: the cap is a
// FOUR CARD grid now, and the fourth slot is the one a paused game rides in.
// The games this drops from the cap are not lost, they are listed in the slate
// directly below, at the foot of Ready to play, which is where every paused
// game has lived since 2026-08-08. The cut is CSS on the cards (.cap-hd /
// .cap-hm), not a slice in the JSX, so the server and the client render the
// same list at either width.
// The eyebrow each lower cap card carries. One line, so the three stay of a
// piece and none of them can drift into a second wording.
const CAP_LEAD_LABEL = { fav: 'Familiar favorite', fresh: 'New to you', crowd: 'Crowd favorite' };
// How many STATE cards the cap shows before its expander takes over: games you
// have already opened today, paused ones first and incomplete ones after. TWO at
// both widths (owner, 2026-08-09), which is exactly the cap's second row, and
// the pair share slots 3 and 4 with Familiar favorite giving way as they fill.
// So: nothing opened yet gives you favorite + New to you, one opened game gives
// favorite + that game, and two or more give the two games and an expander for
// the rest. The cards this leaves out are all still listed in the slate below.
const CAP_STATE_MAX = 2;
// EXPANDING THE PAUSED CARDS MUST NOT RESIZE THE CONSOLE (owner, 2026-08-08).
// The bar used to simply reveal every paused card, and with fifteen games open
// the cap grew past the whole window: the three-column row stretched, both
// rails stretched with it, and Ready to play was pushed clean off the fold. The
// open block is a SCROLLER instead. Its ceiling is measured in the fit effect
// so it takes exactly the room the board can spare, down to the board's own
// floor, and not a pixel more, which means the console's total height is
// IDENTICAL open or shut: the paused list borrows Ready to play's space rather
// than adding to the page. --cap-pmax carries the measurement, and the CSS
// fallback bounds the block on the first frame, before the effect has run, so
// it never flashes at full height.
const CAP_PMIN = 170;   // ...but always at least two rows of cards.
// The console is sized to leave this much of the page showing under it, so the
// three-column row ends just above the fold rather than at it or past it.
//
// 16, NOT 34 (owner, 2026-08-12). It is the GAP, not a peek: 16px is exactly
// the .dhx row's own margin-bottom, so the console ends one standard gap above
// the fold and the element under it (the search + tools row) starts precisely
// at the fold with none of itself showing. At 34 the extra 18px was not enough
// to read the tool row and was enough to CLIP it, which is the one outcome
// worth avoiding: a half-drawn control under a console that had 18px it could
// have spent on its own rows. Every panel in the row grows by the difference,
// because all three columns are pinned to this measurement. If .dhx's margin
// changes, change this with it.
const FOLD_SLIVER = 16;
// ...but never squeeze the board below this, however tall the cap has grown.
const BOARD_MIN = 240;
// HELD SIDEWAYS, THE FLOOR IS EIGHT LINES (owner, 2026-08-08). A phone or tablet
// in landscape has a fraction of a laptop's height, so fitting the console to
// the fold left the slate showing five lines of Ready to play. In that one case
// the board keeps EIGHT and simply runs past the fold, scrolling inside itself
// for the rest exactly as it always has. LINES, not games: above 900px the board
// runs two across, so eight lines is sixteen games, which is what the reader is
// counting on the screen. The gate is a COARSE POINTER, never a height alone, so
// a short desktop window is untouched.
const LAND_LINES = 8;
const LAND_TOUCH = '(orientation:landscape) and (pointer:coarse) and (max-height:1100px)';

// The scroll-content height that shows exactly `lines` lines of the slate grid,
// its group band included, or 0 when the board has not laid out more than that
// (nothing to scroll to, so the ordinary fit should govern). Rows abut, so the
// TOP of line n+1 is the bottom of line n. Distinct tops rather than a row
// count: the grid runs two rows to a line, and DOM order is not visual order
// since the rows are placed by `order`. Measured off the laid-out rows rather
// than a hardcoded row height, which is 49.8px and cannot be multiplied safely.
function slateLineHeight(board, lines) {
  const base = board.getBoundingClientRect().top - board.scrollTop;
  const tops = [];
  board.querySelectorAll('.sl-row').forEach((r) => {
    // offsetParent is null for a row this width hides (a paused card that lives
    // in the cap) or a collapsed group hides, and those occupy no line.
    if (r.offsetParent === null) return;
    const t = Math.round(r.getBoundingClientRect().top - base);
    if (!tops.includes(t)) tops.push(t);
  });
  tops.sort((a, b) => a - b);
  return tops.length > lines ? tops[lines] : 0;
}

// How far back Up next looks when deciding which game this viewer plays the
// most. Long enough to survive a few skipped days, short enough that a habit
// dropped last month stops winning.
const RECENT_DAYS = 30;

// "Jul 27", from the ISO date a puzzle goes live on. Built by hand rather than
// through toLocaleDateString, which would read the VIEWER's timezone and can
// slide an ET date back a day for anyone west of it.
const SUN_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function sunDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? `${SUN_MON[Number(m[2]) - 1]} ${Number(m[3])}` : '';
}

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function etDateLabel() {
  const o = { timeZone: 'America/New_York' };
  try {
    return {
      long: new Date().toLocaleDateString('en-US', { ...o, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      short: new Date().toLocaleDateString('en-US', { ...o, weekday: 'short', month: 'short', day: 'numeric' }),
    };
  } catch (e) { return { long: '', short: '' }; }
}

function fmtPts(x) { const v = Math.round(Number(x) * 10) / 10; return Number.isInteger(v) ? String(v) : v.toFixed(1); }

// A player's game-native score line for the panel's "Today" figure, from the
// daily-combined per-game board row. score/total when the game reports a total
// (e.g. 100/100, 10/10), otherwise the raw score, otherwise the daily points.
// A TALLY game (Blocks) reads "7 rows" instead of a fraction: its total is a
// par, not a set of answers, so a fraction reads as a failure (daily-games).
function todayScoreLine(row, key) {
  if (!row) return null;
  if (row.score != null) {
    const t = dailyScoreText(key, fmtPts(row.score), row.total != null ? fmtPts(row.total) : null);
    if (t) return t;
  }
  if (row.points != null) return `${fmtPts(row.points)} pts`;
  return null;
}

export default function DailyStrip({ board = null, layout = 'tiles', quizCats = [] }) {
  // 'slate' reflows the SAME tiles into a table of rows (owner-approved
  // scoreboard redesign, 2026-08-03). It is a layout switch only: the data,
  // the per-tile panel, the reset timer and every state flag are untouched,
  // so reverting is a one-word prop change.
  // The category-tile board (home v3). Deliberately NOT the string 'tiles',
  // which is already this component's DEFAULT layout and means the legacy
  // tile-card grid: reusing it would silently change every caller that omits
  // the prop.
  //
  // catboard IMPLIES slate, and that is the whole trick. The category board is
  // not a third layout, it is the slate with a desktop-only override layer on
  // top: the slate's own markup, effects, fit measurement and phone styling all
  // still run, and above 901px CSS hides the rows and the four-card cap and
  // shows the tiles and the two-card cap instead. Both renders sit in the DOM
  // at once, which is the same approach the home rails already use for their
  // phone hero, and it means the phone is byte-identical to today and there is
  // no viewport branch in the markup to desynchronise SSR from hydration.
  const cats = layout === 'catboard';
  const slate = layout === 'slate' || cats;
  const [done, setDone] = useState(() => new Set());
  const [inprog, setInprog] = useState(() => new Set());
  // Finished today, never solved, on a game that did not show the answer. A
  // strict subset of `done`: these rows leave Complete today for the red group
  // above it, because the puzzle is still live for this player.
  const [unsolved, setUnsolved] = useState(() => new Set());
  // A finished game is one of two things now. `isFail` is the red group; note it
  // is ALWAYS a subset of `done`, so every existing done/!done test still reads
  // correctly and only the places that need the split have to know about it.
  //
  // Declared HERE, beside the state it reads, and NOT beside the slate code that
  // uses it most: the cap calls it some 240 lines earlier, so a const declared
  // at the slate sits in the temporal dead zone at that call site and the build
  // dies on "Cannot access 'isFail' before initialization". esbuild parses that
  // happily, which is why the deploy is the first thing that sees it.
  const isFail = (key) => done.has(key) && unsolved.has(key);
  const [streaks, setStreaks] = useState({}); // per-game consecutive-day streaks, from daily-status
  const [archive, setArchive] = useState({}); // per-game { played, total }, from the same payload
  // Per-game plays by THIS viewer over the last RECENT_DAYS ET days, derived
  // client side from the same daily-status payload (its `played` array is a
  // list of dated quiz ids). Drives Up next: the game you actually play most.
  const [recent, setRecent] = useState({});
  // The newest ET day this viewer finished each game, as a sortable ordinal,
  // over their WHOLE history rather than the RECENT_DAYS window. Drives the
  // category order Up next walks: a category has to stay rankable for a player
  // who last showed up six weeks ago, which a windowed count cannot do.
  const [lastPlay, setLastPlay] = useState({});
  // NOTE the day figures this component used to own (IQ Points earned today,
  // the day's move on the IQ board, the cross-game day streak) moved into the
  // page header on 2026-08-03 and are read there from useDayStats. Do not
  // re-derive them here: the header is the one place they render.
  const [sel, setSel] = useState(null); // selected game key (expanded tile), or null
  const [lbOpen, setLbOpen] = useState(false); // overall daily leaderboard toggle

  const [hist, setHist] = useState(null); // recent daily champions, from /api/quiz/daily-history
  // "resets in Xh Ym" countdown to ET midnight; set after mount (SSR-safe).
  const [resetLbl, setResetLbl] = useState('');
  useEffect(() => {
    const tick = () => {
      try {
        const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const mid = new Date(et); mid.setHours(24, 0, 0, 0);
        const ms = Math.max(0, mid - et);
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        setResetLbl(h > 0 ? `${h}h ${m}m` : `${m}m`);
      } catch (e) { setResetLbl(''); }
    };
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, []);
  // -- board payload (per-game plays + standings) --
  // Read up here, ahead of the display order, because the order now keys off
  // today's play counts. The leaderboard wiring further down reuses these maps.
  const bgames = board && Array.isArray(board.games) ? board.games : null;
  const byKey = {};
  if (bgames) for (const g of bgames) byKey[g.key] = g;
  const hasBoard = !!(bgames && bgames.length);
  // Plays today for one game (everyone, guests included -- the same number the
  // tile badge shows). Null when no board payload has arrived.
  const playsOf = (key) => {
    const b = byKey[key];
    return b && typeof b.plays === 'number' ? b.plays : null;
  };

  // Display order = MOST PLAYED TODAY first (owner, 2026-07-31), so the board
  // matches the play count each tile now shows in its corner. Yesterday's
  // popularity (useDailyOrder) is the tiebreak, and carries the whole order
  // until the board payload lands, so first paint never janks and a fresh ET
  // morning -- when every count is still 0 -- falls back to yesterday rather
  // than to noise.
  const dailyOrder = useDailyOrder();
  // The viewer's pinned games, promoted above the global order (owner,
  // 2026-08-02). Pins are the ONLY personalization: the sort is (1) your stars,
  // (2) total plays on the day. An earlier version also promoted each player's
  // most-played games; the owner cut it, so do not reintroduce a derived tier
  // without asking. Empty for a guest, which makes sortByMyGames a no-op and
  // leaves the global order untouched. See app/useMyGames.js.
  const { favorites, orderFavorites, canPin, max: favMax, toggleFavorite } = useMyGames();
  // The star is offered only when it can actually WRITE: registered AND the
  // quiz_users.favorites column exists. Otherwise the board simply keeps the
  // global order and shows no control.
  const myGamesOn = canPin;
  const favSet = new Set(favorites);
  // No cap unless the server sends one (owner, 2026-08-26). The `|| 12` this
  // replaced kept disabling the star at twelve pins after the cap was removed.
  const favFull = typeof favMax === 'number' && favMax > 0 && favorites.length >= favMax;
  const games = (() => {
    const base = sortByDailyOrder(GAMES, dailyOrder);
    let out = base;
    if (hasBoard) {
      const rank = new Map(base.map((g, i) => [g.key, i]));
      out = [...base].sort((a, b) => (playsOf(b.key) || 0) - (playsOf(a.key) || 0)
        || rank.get(a.key) - rank.get(b.key));
    }
    return sortByMyGames(out, orderFavorites);
  })();

  // first paint: same-device breadcrumbs
  useEffect(() => {
    const today = etToday();
    const d = new Set();
    const ip = new Set();
    for (const g of GAMES) {
      try {
        const c = JSON.parse(localStorage.getItem(g.store) || 'null');
        if (c && c.d === today) { if (c.done) d.add(g.key); else ip.add(g.key); }
      } catch (e) {}
    }
    if (d.size) setDone(d);
    if (ip.size) setInprog(ip);
  }, []);

  // How many rows the sheet has been shifted up by, and the geometry needed to
  // shift it. `metrics` is null until measured AND on narrow screens, which is
  // what turns the whole mechanism off there.
  const [rowOffset, setRowOffset] = useState(0);
  const [metrics, setMetrics] = useState(null);
  // Phones open on the first eight tiles only (owner, 2026-07-31). This is the
  // toggle behind .dh-mall; the cut itself is CSS, see .dh-board.mcut below.
  const [showAll, setShowAll] = useState(false);
  // The two lead-in bars drop their game icon on a phone (they carry a white
  // rule instead). Hiding it in CSS still let the browser lay it out and paint
  // it for a frame, which read as a flicker, so it is not rendered at all.
  const [etLabel, setEtLabel] = useState({ long: '', short: '' });
  useEffect(() => { setEtLabel(etDateLabel()); }, []);
  // The fill panel's catch-up dates, computed in an effect for the same reason
  // etLabel is: reading the clock during render makes the server and the client
  // disagree either side of midnight. Until it resolves a chip names its puzzle
  // number instead, so the first paint is deterministic.
  const [backDates, setBackDates] = useState(null);
  useEffect(() => {
    const out = [];
    for (let k = 1; k <= FILL_DAYS; k++) {
      const d = new Date(Date.now() - k * 86400000);
      let iso;
      try { iso = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
      catch (e) { iso = d.toISOString().slice(0, 10); }
      out.push({ label: sunDate(iso), sun: isoSunday(iso) });
    }
    setBackDates(out);
  }, []);
  // The category strip runs past the console's right edge (Sundays was cut in
  // half on a 1180px desktop), and a horizontal scroller with its scrollbar
  // hidden gives a mouse no way to reach the rest and no hint there IS a rest.
  // So: one small chevron chip on whichever edge has more to show, which nudges
  // the strip along, plus a short fade under it. Same idea as the quiz ribbon's
  // scroll cue, made clickable, since that one is touch-only and this strip has
  // to work under a mouse. Nothing renders when everything already fits.
  const filtRef = useRef(null);
  const [filtMore, setFiltMore] = useState({ l: false, r: false });
  const [phone, setPhone] = useState(false);
  // The Sundays tab. `sunToday` is computed in an effect, never during render:
  // the server has no idea what day it is in Eastern time and a mismatch is a
  // hydration error. It starts false, so the chip is present on the server's
  // markup and removed on the client if today IS Sunday, which is the safe
  // direction (a chip that vanishes beats one that appears).
  const [sunToday, setSunToday] = useState(false);
  const [sunRows, setSunRows] = useState(null);   // null = not fetched yet
  const [sunErr, setSunErr] = useState(false);
  // Incomplete cards the viewer has waved off TODAY. The red card is loud on
  // purpose, which is exactly why it needs a way out: a game you have decided
  // not to go back to should not keep shouting at you for the rest of the day.
  // Dismissing takes it out of the CAP only. The slate's Incomplete today group
  // still lists it, so nothing is actually hidden, it just stops being a hero.
  // Same-device and same-day by design: it is a mood, not a preference, and it
  // clears itself at midnight along with the state it is about.
  const [capDismiss, setCapDismiss] = useState(() => new Set());
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 900px)');
    const on = () => setPhone(mq.matches);
    on();
    if (mq.addEventListener) { mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }
    mq.addListener(on); return () => mq.removeListener(on);
  }, []);
  // Two across from 641px (the tablet tier). Same shape as `phone` above: a
  // media query, resolved after mount, so the server and the client agree on the
  // first paint and the budget corrects itself a frame later.
  const [twoUp, setTwoUp] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(TWO_UP_MQ);
    const on = () => setTwoUp(mq.matches);
    on();
    if (mq.addEventListener) { mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }
    mq.addListener(on); return () => mq.removeListener(on);
  }, []);
  const capIcon = !(slate && phone);
  // Board filter: 'all' | 'todo' | a category name. Defaults to 'all' on
  // every viewport; the phone-only Unplayed default was removed (owner rule).
  const [filter, setFilter] = useState('all');
  // Slate sort: null keeps the board's own order (unplayed first, then done).
  // Text columns default to A-Z, number columns to biggest first, because that
  // is what someone clicking "Players" or "Streak" is looking for.
  const [sort, setSort] = useState(null);
  // Which phone groups the reader has expanded. Collapsed is the default on
  // every load, deliberately: the point is what the FIRST screen shows.
  const [grpOpen, setGrpOpen] = useState({ prog: false, todo: false, fail: false, dn: false });
  useEffect(() => { setSunToday(isSundayET()); }, []);
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('sot_cap_dismiss') || 'null');
      if (c && c.d === etToday() && Array.isArray(c.keys)) setCapDismiss(new Set(c.keys));
    } catch (e) { /* no breadcrumb, nothing dismissed */ }
  }, []);
  // Fetched only when the tab is actually opened, and only once: the answer is
  // per-player and the route is force-dynamic, so there is no reason to spend
  // the request on the many more visitors who never touch the tab.
  useEffect(() => {
    if (filter !== 'sunday' || sunRows || sunErr) return undefined;
    let alive = true;
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    const qs = new URLSearchParams();
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    fetch('/api/quiz/sunday-slate' + (qs.toString() ? '?' + qs.toString() : ''))
      .then((r) => r.json())
      .then((d) => { if (alive) setSunRows((d && d.games) || []); })
      .catch(() => { if (alive) setSunErr(true); });
    return () => { alive = false; };
  }, [filter, sunRows, sunErr]);
  // Paused games ride in the CAP now, beside Up next and Easiest leaderboard
  // (owner, 2026-08-08), as cards of the cap's own shape in gold rather than a
  // group of rows inside the board. The board therefore opens on Ready to play,
  // which is what pulled the category strip down to sit directly above it.
  const [capOpen, setCapOpen] = useState(false);
  const vpRef = useRef(null);
  const boardRef = useRef(null);
  const capFillRef = useRef(null);

  // cross-device: the signed-in player's finished-today set from the server.
  // Goes through the shared fetchDayStatus (app/useDayStats.js) rather than its
  // own fetch, because the page header now reads the same /api/quiz/daily-status
  // payload for its day chips and the two must not request it twice.
  useEffect(() => {
    let alive = true;
    fetchDayStatus()
      .then((data) => {
        if (!alive || !data) return;
        if (data.streaks && typeof data.streaks === 'object') setStreaks(data.streaks);
        if (data.archive && typeof data.archive === 'object') setArchive(data.archive);
        const [Y, M, D] = etToday().split('-').map(Number);
        const yy = Y % 100;
        const completed = new Set(data.completed || []);
        const played = new Set(data.played || []);
        const abandoned = new Set(data.abandoned || []);
        // Started and still open, per daily_in_progress. This is the half that
        // actually crosses devices: an abandoned row only exists when the exit
        // fired `pagehide`, and a phone that gets backgrounded frequently never
        // does, which is why a game paused on a phone used to be invisible here
        // (owner report, 2026-08-10). daily-status has already superseded any id
        // the player has since finished, so everything in this set is genuinely
        // still open.
        const openIds = new Set(data.inProgress || []);
        const unsolvedIds = new Set(data.unsolved || []);
        // REBUILT, not merged. `done` and `inprog` merge into what the
        // same-device breadcrumbs already put there, but nothing seeds this set
        // locally, and merging would make it one-way: solve a game on a retry
        // and the key it had already added could never leave again within the
        // session. Building it fresh from each payload lets it heal.
        setUnsolved(() => {
          const next = new Set();
          for (const g of GAMES) {
            const id = `${g.key}-${M}-${D}-${yy}`;
            if (unsolvedIds.has(id) && KEEPS_ANSWER.has(g.key)) next.add(g.key);
          }
          return next;
        });
        setDone((cur) => {
          const next = new Set(cur);
          for (const g of GAMES) {
            const id = `${g.key}-${M}-${D}-${yy}`;
            if (completed.has(id) || played.has(id)) next.add(g.key);
          }
          return next;
        });
        setInprog((cur) => {
          const next = new Set(cur);
          for (const g of GAMES) {
            const id = `${g.key}-${M}-${D}-${yy}`;
            if ((abandoned.has(id) || openIds.has(id)) && !completed.has(id) && !played.has(id)) next.add(g.key);
          }
          return next;
        });
        // Recent habit, for Up next. `played` holds every dated id this player
        // has finished, so counting the ones inside the last RECENT_DAYS ET days
        // costs one pass and no extra request. Today's own row is included and
        // harmless: a game played today is not an Up next candidate anyway.
        try {
          const days = new Set();
          const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
          for (let i = 0; i < RECENT_DAYS; i++) {
            const d = new Date(et); d.setDate(et.getDate() - i);
            days.add(`${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear() % 100}`);
          }
          const counts = {};
          const last = {};
          for (const qid of played) {
            const m = /^([a-z]+)-(\d+)-(\d+)-(\d+)$/.exec(qid);
            if (!m) continue;
            const key = m[1];
            if (days.has(`${Number(m[2])}-${Number(m[3])}-${Number(m[4])}`)) {
              counts[key] = (counts[key] || 0) + 1;
            }
            // yyyymmdd, so a December day never outranks the January after it.
            const ord = (2000 + Number(m[4])) * 10000 + Number(m[2]) * 100 + Number(m[3]);
            if (ord > (last[key] || 0)) last[key] = ord;
          }
          setRecent(counts);
          setLastPlay(last);
        } catch (e) {}
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const n = GAMES.filter((g) => done.has(g.key)).length;
  const pct = Math.round((n / GAMES.length) * 100);
  const left = GAMES.length - n;
  // The day in four numbers, for the slate header (owner, 2026-08-10). It
  // REPLACED the slate size, which said 56 every single day, and it outranks
  // the date: what the reader wants off that bar is where their day stands.
  // The four states, their order and their colours are the phone bands' own
  // (todo / prog / fail / dn), so the header is a legend for the groups
  // directly below it and there is only one vocabulary to learn.
  //
  // Counted over the WHOLE roster, never the filtered rows: the bar sits ABOVE
  // the category strip and describes the day, so narrowing to Word Games must
  // not rewrite it. Same reasoning as the Ready-to-play band printing the
  // global `n` rather than its own size. A zero state renders nothing at all,
  // so a fresh day reads "56 ready to play" and fills in as you play.
  const dayTally = (() => {
    let todo = 0, prog = 0, fail = 0, dn = 0;
    for (const g of GAMES) {
      if (isFail(g.key)) fail += 1;
      else if (done.has(g.key)) dn += 1;
      else if (inprog.has(g.key)) prog += 1;
      else todo += 1;
    }
    return [
      // The four state words, the same ones the bands and the cap's state
      // cards use. `short` is the phone's wording and none of them needs one
      // any more: they were shortened to a single word each in 2026-08, so the
      // narrowest form and the full one are the same string. The mechanism
      // stays for the next word that outgrows the first line.
      { k: 'todo', n: todo, word: 'ready' },
      { k: 'prog', n: prog, word: 'paused' },
      { k: 'fail', n: fail, word: 'failed' },
      { k: 'dn', n: dn, word: 'done' },
    ].filter((t) => t.n > 0);
  })();
  // role="img" + the label, because the word can be display:none (the short
  // form swaps in on a phone), which takes a string out of the accessibility
  // tree as well as off the screen. The pip has to say what it is on its own,
  // and it always says the LONG word there whatever is drawn.
  const slatePip = (t, extra) => (
    <i key={t.k} className={`sl-pip ${t.k}${extra || ''}`} role="img" title={`${t.n} ${t.word}`} aria-label={`${t.n} ${t.word}`}>
      <i className="sl-pd" aria-hidden="true" />
      <b>{t.n}</b>
      <i className={`sl-pw${t.short ? ' alt' : ''}`} aria-hidden="true">{t.word}</i>
      {t.short ? <i className="sl-ps" aria-hidden="true">{t.short}</i> : null}
    </i>
  );
  // UP NEXT IS CATEGORY FIRST (owner, 2026-08-10). It takes the category this
  // viewer played MOST RECENTLY and offers the most popular unplayed game in
  // it; where that category has nothing open left, it walks to the second most
  // recently played category, and so on. The rule it replaces ranked individual
  // GAMES by how often this viewer played them, which kept handing back the same
  // two or three titles and never pointed at the rest of a category the player
  // had just shown an appetite for.
  //
  // "Most recently" is the newest ET day the viewer finished anything in that
  // category, read off lastPlay so it counts the whole history, with plays over
  // the last RECENT_DAYS days as the tiebreak when two categories were last
  // played on the SAME day.
  //
  // WHICH GAME INSIDE THAT CATEGORY IS YOUR CALL, NOT THE ROOM'S (owner,
  // 2026-08-23: "up next is almost never what i want to play"). Until this date
  // the card got the category right and then handed the slot to whatever the
  // whole site was playing most in it, which is a figure about everybody except
  // the one person reading it. Nothing in the rule could ever learn: a title you
  // have declined every day for a month stayed permanently eligible, because
  // popular-and-unplayed is precisely what it is, so the card kept re-offering
  // the same refusal. See topByAffinity below for the order it uses now. The
  // crowd term survives as a TIEBREAK, which is what answers for a viewer with
  // no history in that category at all, and the plays figure the card prints
  // stays the crowd's, since that is the number the board's Players column
  // shows and the two must not contradict each other.
  const habitDays = (g) => (recent[g.key] || 0);
  const habitAllTime = (g) => ((archive[g.key] && archive[g.key].played) || 0);
  const hasHabit = (g) => (habitDays(g) > 0 || habitAllTime(g) > 0);
  // Familiar favorite in slot 3 reads this ranking, and since 2026-08-23 so
  // does Up next, inside one category. That is not the pair of cards collapsing
  // into one: Up next is scoped to the category you were last in and the
  // favourite is scoped to nothing, so they answer "more of what you were just
  // doing" and "the game you play most, full stop". They can never PRINT the
  // same game either, because favGame below excludes whatever Up next took.
  // `games` is already in board order and the index is the last tiebreak.
  const habitRank = games.filter((g) => !done.has(g.key))
    .map((g, i) => ({ g, i }))
    .sort((a, b) => (habitDays(b.g) - habitDays(a.g))
      || (habitAllTime(b.g) - habitAllTime(a.g))
      || (a.i - b.i))
    .map((x) => x.g);
  const habitFresh = habitRank.filter((g) => !inprog.has(g.key));
  // Categories, most recently played first. A category nobody has touched is
  // dropped rather than ranked last, so the walk below runs out and hands over
  // to the fallback instead of picking on a zero.
  const catRank = (() => {
    const last = {}; const plays = {};
    for (const g of GAMES) {
      if (!g.cat) continue;
      const d = lastPlay[g.key] || 0;
      if (d > (last[g.cat] || 0)) last[g.cat] = d;
      plays[g.cat] = (plays[g.cat] || 0) + habitDays(g);
    }
    return Object.keys(last).filter((c) => last[c] > 0).sort((a, b) => (last[b] - last[a])
      || ((plays[b] || 0) - (plays[a] || 0)) || a.localeCompare(b));
  })();
  // Most crowd plays today, board order as the tiebreak so the pick holds still
  // through an ET morning when every count is still 0. Board order, NOT the
  // `games` array's first entry: `games` is pin-sorted, and a pinned game must
  // not jump the category's popularity order.
  const boardAt = new Map(games.map((g, i) => [g.key, i]));
  //   1  plays in the last RECENT_DAYS days   the habit you are in NOW
  //   2  all-time plays from the archive      a habit older than that window
  //   3  today's crowd plays                  no history here, so ask the room
  //   4  board order                          holds the pick still all morning
  //
  // Term 4 matters more than it looks: through an ET morning every crowd count
  // is still 0, and without a stable last term the card would reshuffle itself
  // on each poll. It is board order rather than `games[0]` for the reason the
  // old rule gave, that `games` is pin-sorted and a pinned game must not jump
  // its category's order.
  const topByAffinity = (pool) => (pool.length
    ? [...pool].sort((a, b) => (habitDays(b) - habitDays(a))
      || (habitAllTime(b) - habitAllTime(a))
      || ((playsOf(b.key) || 0) - (playsOf(a.key) || 0))
      || (boardAt.get(a.key) - boardAt.get(b.key)))[0]
    : null);
  const byCategory = (pool) => {
    for (const c of catRank) {
      const hit = topByAffinity(pool.filter((g) => g.cat === c));
      if (hit) return hit;
    }
    return null;
  };
  // A PAUSED GAME IS NOT UP NEXT (owner, 2026-08-09). Paused games have their
  // own card in the cap now, so pointing this one at a paused game as well says
  // the same thing twice and forces the card to read Resume, which is not what
  // it is for. The pool is therefore games this viewer has NOT started today,
  // and the card says Play.
  //
  // Everything after the first term is a fallback, in order: a started game in a
  // played category, then the habit ranking, which for a viewer with NO history
  // at all (a guest, or a first visit) sorts to the first unfinished game in
  // board order, the day's most played game globally.
  const openFresh = games.filter((g) => !done.has(g.key) && !inprog.has(g.key));
  const openAny = games.filter((g) => !done.has(g.key));
  const nextGame = byCategory(openFresh) || byCategory(openAny)
    || habitFresh[0] || habitRank[0] || null;

  // (The strip's "More in X" jump lived here until 2026-08-24, along with the
  // category walk that fed it. Both are gone; the strip's block comment at
  // module scope has the reasoning. Up next on the cap above still makes the
  // same walk and still lands on the same game, so nothing was lost with it.)

  // ── leaderboard wiring (only when a board payload is provided) ──
  // bgames / byKey / hasBoard are built above, beside the display order.
  const overall = board && Array.isArray(board.overall) ? board.overall : [];
  const maxTotal = (board && board.maxTotal) || 150;
  const gameCount = (board && board.gameCount) || (bgames ? bgames.length : 0);
  const bestN = board && board.bestN != null ? board.bestN : Math.min(10, gameCount || 10);
  const meKey = board && board.me ? board.me.userKey : null;
  const top3 = overall.slice(0, 3);
  const meShown = meKey && top3.some((r) => r.userKey === meKey);
  const uniquePlayers = board && typeof board.uniquePlayers === 'number' ? board.uniquePlayers : null;

  // Easiest board to climb: fewest players today among the games still open to
  // you. Ties keep the earlier game in daily order. Since 2026-08-03 the cap's
  // left half is Up next, which already offers nextGame, so the easiest board is
  // chosen from the OTHER open games: a cap pointing at the same game twice
  // wastes half its width. A day with exactly one game left therefore has no
  // easiest card, and that half shows the almost-done note instead.
  const easiest = (() => {
    if (!nextGame) return null;
    const pool = games.filter((g) => !done.has(g.key) && g.key !== nextGame.key);
    // Same rule as Up next: skip the started games, unless that leaves nothing.
    const unstarted = pool.filter((g) => !inprog.has(g.key));
    const open = unstarted.length ? unstarted : pool;
    let best = null, bestN = Infinity;
    for (const g of open) {
      const b = byKey[g.key];
      const cnt = b && typeof b.field === 'number' ? b.field : null;
      if (cnt == null) continue;
      if (cnt < bestN) { bestN = cnt; best = g; }
    }
    return best ? { game: best, players: bestN } : (open[0] ? { game: open[0], players: null } : null);
  })();

  // The cap's two halves count DIFFERENT things, deliberately (owner ruling,
  // 2026-08-06). Up next prints PLAYS, the very figure the board's Players
  // column shows for that game, so the two can never contradict each other.
  // Easiest leaderboard keeps the FIELD, the number of scored entries, because
  // that is what "easiest to place on" actually measures: Jester ran 430 plays
  // today against a field of 38, and ranking it by plays would call the day's
  // busiest game an easy board. Its note is worded "on the leaderboard" so the
  // smaller number reads as a different measure rather than a wrong one.
  // Either note is dropped entirely when no board payload has arrived, rather
  // than rendering a zero.
  const playsNote = (n) => (n == null
    ? ''
    : ` \u00b7 ${n === 0 ? 'no players today' : `${n.toLocaleString()} ${n === 1 ? 'player' : 'players'} today`}`);
  const fieldNote = (n) => (n == null
    ? ''
    : ` \u00b7 ${n === 0 ? 'nobody on the leaderboard yet' : `${n.toLocaleString()} on the leaderboard`}`);
  const nextPlays = nextGame ? playsOf(nextGame.key) : null;

  // The paused cards, in board order. Up next and Easiest leaderboard are
  // frequently paused games themselves and already have a card of their own, so
  // they are excluded here rather than printed twice.
  const capProg = games.filter((g) => inprog.has(g.key) && !done.has(g.key)
    && !(nextGame && g.key === nextGame.key)
    && !(easiest && g.key === easiest.game.key));

  // ── the two lower cards (owner, 2026-08-09) ──────────────────────────────
  // The cap used to be two fixed halves with the paused cards dropped in after
  // them, which meant ONE paused game left an odd number of cards and the last
  // one spanned the whole width. A lone banner where a card should be reads as
  // a bug rather than a layout. Adding a third card would only move the odd
  // number along (3 with nothing paused, 5 with two), so the fix is parity, not
  // an extra card: the cap now fills FOUR slots and the count is always even.
  //
  //   1  Up next            YOUR most played open game in your last category
  //   2  Easiest board      the thinnest field today, unchanged
  //   3  Familiar favorite  the game YOU play most, on the habit ranking
  //   4  a paused game      else New to you, a game with no history at all
  //
  // Familiar favorite skips in-progress games on purpose: a paused game belongs
  // in the gold card in slot 4, and a cap that named one game twice would waste
  // a quarter of itself.
  const favGame = habitRank.find((g) => hasHabit(g) && !inprog.has(g.key)
    && !(nextGame && g.key === nextGame.key)
    && !(easiest && g.key === easiest.game.key)) || null;
  // Games this viewer has never touched, in board order.
  const freshPool = games.filter((g) => !done.has(g.key) && !inprog.has(g.key) && !hasHabit(g));
  // What the CROWD is on today, most played first (`games` is already in that
  // order wherever a board payload has arrived). This is the card that keeps
  // BOTH ends of the roster honest (owner, 2026-08-09): a brand new account has
  // no habit, so slots 3 and 4 both fell to New to you and printed the same
  // eyebrow twice; someone who has played every game has nothing new left, so
  // both fell to Familiar favorite and did the same at the other extreme. Each
  // card TYPE may appear once, and the crowd is the one signal that is always
  // available, whoever is looking.
  const crowdPool = games.filter((g) => !done.has(g.key) && !inprog.has(g.key)
    && !(nextGame && g.key === nextGame.key)
    && !(easiest && g.key === easiest.game.key));
  // Whether this viewer's history is KNOWN, rather than merely empty.
  // /api/quiz/daily-status answers a signed-out request with no archive at all,
  // so every game reads as untouched for a guest who in fact plays daily. The
  // New to you card states "never played", and it may only state that where the
  // history exists to back it.
  const knowsHistory = Object.keys(archive).length > 0;
  // Slot 4 goes to a paused game first and an incomplete one second: both are
  // games you have already opened today, and the paused one still has a live
  // board to return to where the incomplete one has a spent score and a puzzle
  // you can still solve for yourself.
  // Everything you have already opened today, in one list. Paused leads
  // incomplete throughout: a paused board is still live where an incomplete one
  // is spent, so it is the better thing to hand back.
  // ONE OF EACH KIND BEFORE A SECOND OF EITHER (owner, 2026-08-09). Two paused
  // games and one incomplete used to fill both slots with paused and leave the
  // incomplete one to the expander, so a whole state could go unrepresented in
  // the cap. Interleaved, the two slots show one of each whenever both exist,
  // and only double up when one kind is all there is. Paused still leads, since
  // a paused board is live where an incomplete one is spent.
  const capState = (() => {
    const prog = capProg.map((g) => ({ game: g, kind: 'prog' }));
    const fail = games.filter((g) => isFail(g.key) && !capDismiss.has(g.key))
      .map((g) => ({ game: g, kind: 'fail' }));
    const out = [];
    for (let i = 0; i < Math.max(prog.length, fail.length); i += 1) {
      if (prog[i]) out.push(prog[i]);
      if (fail[i]) out.push(fail[i]);
    }
    return out;
  })();
  const capStateShown = capOpen ? capState : capState.slice(0, CAP_STATE_MAX);
  const dismissFail = (key) => setCapDismiss((cur) => {
    const next = new Set(cur);
    next.add(key);
    try { localStorage.setItem('sot_cap_dismiss', JSON.stringify({ d: etToday(), keys: [...next] })); } catch (e) {}
    return next;
  });
  const capLead = (() => {
    // SHUT: whatever the state cards leave of the two lower slots.
    // OPEN: parity, and nothing else (owner, 2026-08-11). The open block shows
    // every state card, so an ODD number of them left the last one spanning the
    // whole width, which is the lone banner the four-card grid was built to
    // retire in the first place. The fix is the same one: not a wider card, but
    // an even count. ONE lead card comes back as the block's last tile, filling
    // the hole beside the odd card rather than stretching it, so the open cap
    // runs three blue over three gold with every card the same size.
    const want = capOpen
      ? (capStateShown.length % 2 === 1 ? 1 : 0)
      : Math.max(0, 2 - capStateShown.length);
    const taken = new Set([nextGame && nextGame.key, easiest && easiest.game.key].filter(Boolean));
    const out = [];
    const pick = (pool) => pool.find((g) => !taken.has(g.key)) || null;
    const take = (g, kind) => { if (!g) return false; out.push({ game: g, kind }); taken.add(g.key); return true; };
    // Slot 3 is the habit card, and the crowd stands in for a viewer who has
    // not built one yet, which is every brand new account.
    take(favGame && !taken.has(favGame.key) ? favGame : null, 'fav') || take(pick(crowdPool), 'crowd');
    // Slot 4, whenever no paused game is taking it: something they have never
    // opened, and the crowd again for the viewer who has opened everything.
    if (out.length < want) take(pick(freshPool), 'fresh') || take(pick(crowdPool), 'crowd');
    return out.slice(0, want);
  })();
  // WHERE a lead card renders depends on the lid, because the two states are
  // two different grids. SHUT, the block is display:contents and every card is
  // an item of the cap's own grid, so the lead cards sit above the block and
  // their count is part of the cap's parity. OPEN (above 901px) the block is a
  // grid of its OWN, scrolling inside a measured ceiling, so a lead card left
  // above it would be the odd one out on the fixed row instead: the parity card
  // rides INSIDE the block as its last tile, where the hole actually is.
  const capLeadShown = capLead;
  const capLeadTop = capOpen ? [] : capLeadShown;
  const capLeadIn = capOpen ? capLeadShown : [];
  const capFixed = 2 + capLeadTop.length;
  // Which column a paused card lands in. SHUT the block is display:contents, so
  // its cards continue the cap's own grid and the fixed cards above them set the
  // parity; OPEN it is its own two-column grid and starts at column one. Only
  // column-one cards carry the divider, since two gold cards side by side have
  // no colour change between them. A class, not :nth-child, because the wrapper
  // makes the DOM position and the grid position disagree.
  const capCol1 = (i) => ((capOpen ? i : capFixed + i) % 2 === 0);
  const capShownN = capStateShown.length;
  // Desktop runs the cap two cards to a row, so an ODD total would leave a
  // half-width hole beside the last card: it takes the full width instead. With
  // four cards this never fires; it is the backstop for the states that cannot
  // fill all four (a brand new viewer, or the open paused block).
  // The parity card makes the open count even too, so as of 2026-08-11 this
  // fires in neither state and no card is ever widened. It stays as the
  // backstop it always was, now counting the in-block card as well: a future
  // state that cannot reach an even number still degrades to a full-width card
  // rather than a half-width hole.
  const capOddD = ((capOpen ? capShownN + capLeadIn.length : capFixed + capShownN) % 2 === 1);
  const capWideAt = capOddD && capShownN > 0 ? capShownN - 1 : -1;
  const capLeadWideAt = capOddD && capShownN === 0 ? capLeadShown.length - 1 : -1;
  // The sub line each lower card carries. Familiar favorite prints the habit it
  // was chosen on, which is the one figure that explains why the card is there;
  // New to you says plainly that there is no history to print.
  // New to you says "never played" only where the history is known; a guest
  // gets the tagline alone rather than a claim nothing backs. Crowd favorite
  // prints the same plays figure Up next does, which is the whole point of it.
  const leadNote = (c) => (c.kind === 'fav' ? habitNote(c.game)
    : c.kind === 'crowd' ? playsNote(playsOf(c.game.key))
    : (knowsHistory ? ' \u00b7 never played' : ''));
  const habitNote = (g) => (habitDays(g) > 0
    ? ` \u00b7 played ${habitDays(g)} of the last ${RECENT_DAYS} days`
    : (habitAllTime(g) > 0 ? ` \u00b7 ${habitAllTime(g)} days played all time` : ''));
  // ONE renderer for the lead card, called from both places it can land (above
  // the block when shut, inside it when open). Two copies of this JSX would be
  // two cards to keep identical, and they would not stay that way.
  const capLeadCard = (c, wide) => (
    <a
      key={c.game.key}
      href={c.game.href}
      aria-label={`Play ${c.game.name}`}
      className={'dh-cell ' + c.kind + (wide ? ' capw' : '')}
    >
      <div className="dh-bupt">
        <div className="dh-bue">{CAP_LEAD_LABEL[c.kind]}</div>
        <div className="dh-bun">{c.game.name}</div>
        <div className="dh-busub">{c.game.tag}{leadNote(c)}</div>
      </div>
      <span className="dh-play">
        <Play size={11} fill="currentColor" strokeWidth={0} />Play
      </span>
    </a>
  );

  // The player's row on a game's per-game board (their score/rank today).
  const myRow = (key) => {
    if (!meKey) return null;
    const b = byKey[key] && byKey[key].board;
    const onBoard = b ? b.find((x) => x && x.userKey === meKey) : null;
    if (onBoard) return onBoard;
    const pg = board && board.me && board.me.perGame ? board.me.perGame[key] : null;
    if (!pg) return null;
    return { userKey: meKey, username: (board.me && board.me.username) || 'You', ...pg };
  };

  // Same-device in-progress/finished detection for TODAY via each game's own
  // per-puzzle save, keyed by the puzzle nums the daily-combined payload carries.
  useEffect(() => {
    if (!bgames || !bgames.length) return;
    const ip = new Set(); const dn = new Set();
    for (const g of bgames) {
      if (!g || g.num == null) continue;
      const saveKeys = [`sot_${g.key}_${g.num}`];
      if (g.key === 'crux' && g.rev) saveKeys.push(`sot_crux_${g.num}_r${g.rev}`);
      let playing = false, finished = false;
      for (const k of saveKeys) {
        try {
          const sv = JSON.parse(localStorage.getItem(k) || 'null') || {};
          // 'playing' alone is NOT started. Every client seeds its state as
          // { t0: null, status: 'playing' } and persists it the moment hydration
          // finishes, so simply OPENING a game writes that save with no
          // interaction, and reading status alone marked the row paused on the
          // slate (owner report, 2026-08-10: clicked into Docket, never pressed
          // start, got an in-progress label). t0 is the real started signal and
          // is universal: every client that seeds status 'playing' seeds
          // t0: null with it and stamps t0: Date.now() on the first real move.
          // This matches the definition the sot_<key>_day breadcrumb and the
          // abandon flush already use, that answering is the start and opening
          // the page and leaving is not.
          if (sv.status === 'playing') { if (sv.t0) playing = true; }
          else if (sv.status) finished = true;
        } catch (e) {}
      }
      if (finished) dn.add(g.key);
      else if (playing) ip.add(g.key);
    }
    if (dn.size) setDone((cur) => new Set([...cur, ...dn]));
    if (ip.size) setInprog((cur) => new Set([...cur, ...ip]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  // Recent champions only load once the overall board is opened.
  useEffect(() => {
    if (!lbOpen || !hasBoard || hist !== null) return;
    let alive = true;
    fetch('/api/quiz/daily-history')
      .then((r) => r.json())
      .then((d) => { if (alive && d && Array.isArray(d.history)) setHist(d.history.slice(0, CHAMPION_DAYS)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [lbOpen, hasBoard, hist]);

  // Per-game archive + all-time record, fetched on first expand and cached by
  // game key (so re-opening a tile costs nothing). Shape: { allTime, drops, mine }.
  const [gameData, setGameData] = useState({});
  const fetchedRef = useRef(new Set());
  useEffect(() => {
    if (!sel || fetchedRef.current.has(sel)) return;
    fetchedRef.current.add(sel);
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    const qs = new URLSearchParams({ game: sel });
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    let alive = true;
    fetch('/api/quiz/daily-game?' + qs.toString())
      .then((r) => r.json())
      .then((d) => { if (alive && d && !d.error) setGameData((cur) => ({ ...cur, [sel]: d })); })
      .catch(() => { fetchedRef.current.delete(sel); });
    return () => { alive = false; };
  }, [sel]);

  // FIT THE CONSOLE TO THE FOLD (owner, 2026-08-08). The board used to take a
  // hardcoded calc(100vh - 300px), where 300 was the sum of everything above it
  // back when the cap was a single row of two cards. The cap carries the paused
  // games now, so that number went stale the moment it grew and the whole
  // three-column row (the rails stretch to the console, so all three) ran past
  // the bottom of the window. The board measures the room it actually has
  // instead: its own document top already accounts for whatever sits above it,
  // so the cap can grow or shrink and the row still ends FOLD_SLIVER above the
  // fold. Desktop only; the phone board is height:auto and scrolls with the
  // page. Never hardcode that sum again, in either direction.
  useEffect(() => {
    if (!slate || typeof window === 'undefined') return undefined;
    const board = boardRef.current;
    if (!board) return undefined;
    const con = board.closest('.dhome');
    let raf = 0;
    const fit = () => {
      raf = 0;
      const prog = con ? con.querySelector('.dh-cprog') : null;
      // THE BOARD'S SCROLLBAR GUTTER, published so the cap above can line its
      // cards up with the columns under them (owner, 2026-08-15: the three
      // colored cards do not line up with the grid below). Both are three
      // equal tracks across the same console width, but only the board is a
      // scroller, and its gutter comes out of the CONTENT box: measured, its
      // 1fr tracks were 384px against the cap's 387.3px, so card two started
      // 3px right of its column and card three 7px. Measured rather than
      // hardcoded at 10px because the number is the OS and engine's, not ours
      // (macOS overlay scrollbars are 0 and this correctly collapses to it),
      // and read before the width bail below so the 901-1200px tier, where the
      // board is overflow:visible, publishes the 0 that tier actually has.
      // scrollbar-gutter:stable on the board is what keeps it CONSTANT rather
      // than appearing with the 43rd row.
      if (con) con.style.setProperty('--dh-sbw', Math.max(0, board.offsetWidth - board.clientWidth) + 'px');
      // The board is height:auto and scrolls with the page in BOTH peek tiers, so
      // there is no fixed port to size: the phone/tablet one under 900px, and the
      // stacked one above it (STACKED_MQ), which would otherwise get a fold-height
      // scroll port holding six rows and a lot of white.
      if (window.innerWidth <= 1200) {
        board.style.removeProperty('--dh-fit');
        // Where the board flows, the paused block is never bounded either: the
        // page absorbs its length, so it stacks out in full and never scrolls
        // inside itself.
        if (prog) prog.style.removeProperty('--cap-pmax');
        return;
      }
      // The floor is BOARD_MIN everywhere except a touch device in landscape,
      // where it is whatever eight lines actually measure (see LAND_LINES).
      let floor = BOARD_MIN;
      if (window.matchMedia && window.matchMedia(LAND_TOUCH).matches) {
        floor = Math.max(floor, slateLineHeight(board, LAND_LINES));
      }
      // Bound the open paused block FIRST, since it is one of the things
      // sitting above the board. Its ceiling is whatever room is left between
      // the top of the block and the fold once the board has been handed its
      // floor, so the block can only ever eat space the board could spare and
      // the console still ends FOLD_SLIVER above the fold either way.
      //
      // No feedback loop: the top measured here does not depend on the block's
      // own height. Open, the block is a scroller, so its box top is fixed and
      // the cards move inside it; shut, it is display:contents and has no box
      // at all, so the FIRST CARD stands in for it and sits at the same pixel.
      const bar = con ? con.querySelector('.dh-cmore') : null;
      if (prog && !bar) {
        // No bar means the block can never open, so there is nothing to bound.
        prog.style.removeProperty('--cap-pmax');
      } else if (prog) {
        const r = prog.getBoundingClientRect();
        const first = r.height ? null : prog.querySelector('.dh-cell.prog');
        const pTop = (first ? first.getBoundingClientRect().top : r.top) + window.scrollY;
        const barR = bar.getBoundingClientRect();
        const bdR = board.getBoundingClientRect();
        const conR = con.getBoundingClientRect();
        // MEASURE the furniture between the block and the fold, never model it.
        // The first version subtracted the bar and the board's floor and came
        // out 36px generous, because the board wrap's padding and the sticky
        // column header sit in between and were not in the sum, so the console
        // ran past the fold by exactly that much. HEAD is the bar plus
        // everything under it down to the board's top edge; TAIL is the wrap's
        // bottom edge under the board. Both are constant whatever height the
        // block settles at, which is what makes this one pass rather than an
        // iteration that visibly settles.
        const head = Math.round(barR.height) + Math.max(0, Math.round(bdR.top - barR.bottom));
        const tail = Math.max(0, Math.round(conR.bottom - bdR.bottom));
        const room = Math.round(window.innerHeight - pTop - head - tail - FOLD_SLIVER) - floor;
        prog.style.setProperty('--cap-pmax', Math.max(CAP_PMIN, room) + 'px');
      }
      // Document offset, not the viewport rect: the row is meant to fit the
      // fold as seen from the TOP of the page, wherever the reader has
      // scrolled to when a resize happens to fire. Read AFTER the block above
      // has been bounded, so this same pass sees the height it settled at.
      const top = board.getBoundingClientRect().top + window.scrollY;
      const h = Math.max(floor, Math.round(window.innerHeight - top - FOLD_SLIVER));
      board.style.setProperty('--dh-fit', h + 'px');
    };
    // requestAnimationFrame NEVER FIRES in a background tab, so a queued fit in
    // one would sit unmeasured until the reader looked at the page. Coalesce
    // with a frame when there are frames, and just measure when there are not.
    const q = () => {
      if (raf) return;
      if (typeof document !== 'undefined' && document.hidden) { fit(); return; }
      raf = requestAnimationFrame(fit);
    };
    // A HIDDEN DOCUMENT RUNS NO RENDERING STEPS, so a ResizeObserver in one
    // never DELIVERS, and the branch above never gets called. Plain timers do
    // still run, so two late re-fits are the safety net under the observer
    // (the same belt-and-braces the rails' own measure uses).
    const t1 = setTimeout(q, 450);
    const t2 = setTimeout(q, 1400);
    // The FIRST fit is direct, not queued: requestAnimationFrame never fires in
    // a background tab, so a page opened in one would have sat at the fallback
    // calc until it was looked at.
    fit();
    window.addEventListener('resize', q);
    // ...and re-measure when a tab that loaded in the background is finally
    // shown, since everything above it may have settled while it was hidden.
    document.addEventListener('visibilitychange', q);
    // The cap is the thing above the board whose height moves (expanding the
    // paused cards). Observe IT, never the console: the console's height is
    // driven by the board we are setting, which would loop.
    let ro = null;
    const cap = con && con.querySelector('.dh-sbar');
    if (cap && typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(q); ro.observe(cap); }
    return () => {
      window.removeEventListener('resize', q);
      document.removeEventListener('visibilitychange', q);
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
    // Deps: everything that changes the CAP's height, since that is the only
    // thing above the board that moves it. This is the deterministic path; the
    // observer and the timers above are the backstop for a late data arrival.
  }, [slate, capOpen, phone, capProg.length, nextGame && nextGame.key, easiest && easiest.game.key]);

  // THE SCROLLER STOPS AT THE CAP (owner, 2026-08-14). The port reserves a
  // ~10px gutter for its scrollbar and that gutter is taken OUT of the content
  // box, so every row and every band ends short of the card's right edge. On a
  // row that is invisible. On the band pinned to the BOTTOM edge it is not,
  // because that band IS the card's bottom edge: the green stopped short of
  // the corner and the port's 13px bottom-right radius was drawn in scrollbar
  // track instead, so the cap read as cut off and the scroller looked like it
  // ran on past it. Content cannot paint over the gutter (overflow clips it at
  // the padding box, and a width past 100% is clipped with it), so the fill is
  // a SIBLING of the scroller, absolutely positioned in .dhome, whose
  // bottom-right corner is the port's own. It takes the pinned band's colour
  // and the port's radius, so the cap runs the full width and rounds on both
  // corners and the gutter ends where the pinned stack begins.
  //
  // It follows the stack rather than assuming green: any of the four bands can
  // be the one flush at the bottom and up to all four can be stacked there. A
  // band is pinned iff its bottom sits exactly the following bands' heights
  // above the port's, so the run is counted from the last band up and stops at
  // the first that is not (heights measured, never the 30px constant --bh, so
  // the two cannot drift). Scrolled to the very end of an OPEN group the last
  // thing in the port is a row, no band is flush, and the fill goes away: that
  // is "not unless it is expanded". Size travels as inline custom properties
  // rather than state, so a scroll paints without a re-render, and zero size
  // rather than display:none is what hides it, so the CSS keeps the last word
  // on when it may show at all.
  //
  // ONE SEGMENT PER PINNED BAND, not one colour for the stack (owner,
  // 2026-08-14). The first version painted the whole run in the FLUSH band's
  // colour, so with In progress pinned above Complete today the green ran up
  // the gutter across the gold band, and the red Incomplete today band would
  // have done the same. The fill is a hard-stop gradient instead, a band of
  // colour per pinned band at its own measured height. The colours are READ
  // OFF each band's computed background rather than restated here, so a band
  // that gets a new colour cannot leave a stale twin in the gutter, and no
  // palette literal lives in this file's JS.
  useEffect(() => {
    const port = boardRef.current;
    const fill = capFillRef.current;
    if (!slate || !port || !fill || typeof window === 'undefined') return undefined;
    let raf = 0;
    const paint = () => {
      raf = 0;
      const gutter = port.offsetWidth - port.clientWidth;
      const pr = port.getBoundingClientRect();
      const bands = port.querySelectorAll('.sl-band');
      let stack = 0;
      const stops = [];
      for (let k = bands.length - 1; k >= 0; k -= 1) {
        const r = bands[k].getBoundingClientRect();
        if (Math.abs(r.bottom - (pr.bottom - stack)) > 1) break;
        const col = window.getComputedStyle(bands[k]).backgroundColor;
        stops.push(`${col} ${Math.round(stack)}px`, `${col} ${Math.round(stack + r.height)}px`);
        stack += r.height;
      }
      const on = gutter > 0 && stops.length > 0;
      fill.style.setProperty('--cf-w', on ? `${gutter}px` : '0px');
      fill.style.setProperty('--cf-h', on ? `${Math.round(stack)}px` : '0px');
      if (on) fill.style.setProperty('--cf-bg', `linear-gradient(to top,${stops.join(',')})`);
    };
    const q = () => { if (!raf) raf = requestAnimationFrame(paint); };
    paint();
    port.addEventListener('scroll', q, { passive: true });
    window.addEventListener('resize', q);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      port.removeEventListener('scroll', q);
      window.removeEventListener('resize', q);
    };
    // No dep array on purpose: opening a group, filtering, sorting and the
    // day's data all change which bands render and where they sit, and a
    // measure this cheap after every render beats enumerating them and missing
    // one. The scroll listener is what carries the frames in between.
  });

  // filtered tile set
  const list = games.filter((g) => !done.has(g.key)).concat(games.filter((g) => done.has(g.key)));
  // The slate filters for real (the tile board still dims rather than removes).
  const nReadyAll = games.filter((g) => !done.has(g.key) && !inprog.has(g.key)).length;
  const nProgAll = games.filter((g) => inprog.has(g.key) && !done.has(g.key)).length;
  const nFailAll = games.filter((g) => isFail(g.key)).length;
  const nDoneAll = games.filter((g) => done.has(g.key) && !isFail(g.key)).length;
  const slateMatch = (g) => (filter === 'all' ? true
    : filter === 'ready' ? (!done.has(g.key) && !inprog.has(g.key))
      : filter === 'paused' ? (inprog.has(g.key) && !done.has(g.key))
      : filter === 'failed' ? isFail(g.key)
      : filter === 'done' ? (done.has(g.key) && !isFail(g.key))
        : filter === 'todo' ? !done.has(g.key)
      : String(filter).startsWith('circuit:') ? circuitsOf(g).includes(String(filter).slice(8))
          : g.cat === filter);
  const SORT_NUMERIC = new Set(['players', 'streak', 'archive', 'status']);
  const sortVal = (g, key) => {
    if (key === 'game') return g.name || '';
    if (key === 'cat') return g.cat || '';
    if (key === 'players') return playsOf(g.key) || 0;
    if (key === 'streak') return streaks[g.key] || 0;
    if (key === 'leader') {
      const b = byKey[g.key];
      return (hasBoard && b && b.board && b.board[0] && b.board[0].username) || '';
    }
    // done (2) beats in progress (1) beats untouched (0)
    if (key === 'status') return done.has(g.key) ? 2 : (inprog.has(g.key) ? 1 : 0);
    if (key === 'archive') {
      const a = archive[g.key];
      return (a && a.total) ? (a.played / a.total) : -1;
    }
    return '';
  };
  const slateList = (() => {
    const rows = list.filter(slateMatch);
    if (!sort) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    // A blank leader sorts last either way rather than clumping at the top of
    // an ascending list.
    return rows.slice().sort((a, b) => {
      const x = sortVal(a, sort.key), y = sortVal(b, sort.key);
      if (typeof x === 'string' || typeof y === 'string') {
        const sx = String(x), sy = String(y);
        if (!sx !== !sy) return sx ? -1 : 1;
        return sx.localeCompare(sy) * dir || (a.name || '').localeCompare(b.name || '');
      }
      return (x - y) * dir || (a.name || '').localeCompare(b.name || '');
    });
  })();
  const toggleSort = (key) => setSort((cur) => (
    cur && cur.key === key
      ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: SORT_NUMERIC.has(key) ? 'desc' : 'asc' }
  ));
  const slateCats = [];
  for (const g of games) if (!slateCats.includes(g.cat)) slateCats.push(g.cat);
  // Re-measured on scroll, on resize, and whenever the TAB SET changes, which is
  // the only thing that moves the strip's width: the Sundays tab comes and goes
  // with the day and the categories are built from the board just above. Note
  // the dep list is load-bearing rather than tidy. Without one this re-subscribes
  // on every render, and the clock ticking once a second means every render.
  useEffect(() => {
    const el = filtRef.current;
    if (!el) return undefined;
    const update = () => {
      const more = el.scrollWidth - el.clientWidth;
      setFiltMore({ l: el.scrollLeft > 2, r: more > 2 && el.scrollLeft < more - 2 });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [slate, cats, sunToday, slateCats.join('|')]);
  const nudgeFilt = (dir) => {
    const el = filtRef.current;
    if (!el) return;
    // Most of a screenful, not all of it: leaving a tab or two in view is what
    // tells the reader the strip moved rather than jumped somewhere new.
    el.scrollBy({ left: dir * Math.max(120, Math.round(el.clientWidth * 0.7)), behavior: 'smooth' });
  };
  const shift = metrics ? Math.min(rowOffset, metrics.maxOffset) : 0;
  const selGame = sel != null ? list.find((g) => g.key === sel) || games.find((g) => g.key === sel) || null : null;

  // Measure the board window so the sheet can be shifted by exactly one row.
  //
  // The TILES decide the height here, never the column. An earlier version did
  // the opposite, deriving a row height from whatever vertical space the page
  // grid handed the board, which meant a tall right hand rail stretched every
  // tile (they came out at 154px instead of their natural ~127px). So the row
  // step is now READ OFF the laid out grid and the window is sized to exactly
  // `vis` of those rows. Rows keep their natural height, and any space the
  // column has left over simply sits under the board.
  //
  // No feedback loop: the grid is absolutely positioned, so its own row heights
  // are content driven and do not depend on the window height we write back.
  useEffect(() => {
    const vp = vpRef.current, bd = boardRef.current;
    if (!vp || !bd) return undefined;
    const GAP = 8;
    const measure = () => {
      // Below this width the board simply flows: the spare tiles take their own
      // row, no window, no arrow, no animation (owner, 2026-07-30).
      if (typeof window === 'undefined' || window.innerWidth < 861) { setMetrics(null); return; }
      const cols = (getComputedStyle(bd).gridTemplateColumns || '').split(' ').filter(Boolean).length || 6;
      const vis = Math.max(1, Math.ceil(BOARD_WINDOW / cols));
      const tiles = bd.children;
      if (!tiles.length) return;
      const totalRows = Math.ceil(tiles.length / cols);
      // Distance from one row to the next, gap included, for the shift.
      //
      // Read FRACTIONALLY off the grid's own box, not from offsetTop: a tile is
      // 127.09px tall on a 135.09px step, and offsetTop/offsetHeight round to
      // whole pixels, so an integer step drifted a tenth of a pixel per shifted
      // row (owner, 2026-07-31). The parent's rect is immune to a child tile's
      // :hover transform, which a per-tile rect is not.
      const bdH = bd.getBoundingClientRect().height;
      const rowStep = totalRows > 1 && bdH > 1
        ? (bdH + GAP) / totalRows
        : (tiles.length > cols
          ? tiles[cols].offsetTop - tiles[0].offsetTop
          : tiles[0].offsetHeight + GAP);
      if (!(rowStep > 1)) return;
      // The window height is taken from the BOTTOM OF THE LAST VISIBLE TILE
      // rather than from vis * rowStep. Row heights can settle a pixel or two
      // late (web fonts, tile art), and multiplying an early row step left the
      // last row clipped by the accumulated error.
      //
      // Plus two pixels of slack. The rounded measurement above came out under
      // a pixel short of the true row bottom, which was enough to shave the
      // last row's 1.5px bottom border and make the bottom row read as cut off.
      // The slack can only expose part of the 8px gap below the row, never a
      // tile.
      const last = tiles[Math.min(vis * cols, tiles.length) - 1];
      const windowH = last.offsetTop + last.offsetHeight - tiles[0].offsetTop + 2;
      if (!(windowH > 1)) return;
      const maxOffset = Math.max(0, Math.ceil(list.length / cols) - vis);
      setMetrics((cur) => (cur && cur.rowStep === rowStep && cur.windowH === windowH
        && cur.vis === vis && cur.maxOffset === maxOffset
        ? cur : { rowStep, windowH, vis, maxOffset }));
    };
    measure();
    // Re-measure once the first paint and any late web font have settled, so a
    // row height that arrives a frame later still produces an exact window.
    const raf = requestAnimationFrame(() => requestAnimationFrame(measure));
    const settle = setTimeout(measure, 500);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(vp);
    window.addEventListener('resize', measure);
    return () => {
      if (ro) ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      window.removeEventListener('resize', measure);
    };
  }, [list.length]);

  // AN OPENED PANEL LANDS ON ITS HEAD (owner, 2026-08-14). Expanding a row near
  // the FOOT of the console left the reader looking at the MIDDLE of what had
  // just opened. TWO different causes, one per layout, which is why the fix is
  // a landing rather than a patch to either.
  //
  // Above 900px the panel is position:absolute;inset:0 over the whole .dhome
  // (one expanded console), so its top is the CONSOLE'S top: scrolled far
  // enough down to reach the last rows, that top is already above the viewport
  // and the panel opens showing its middle. Measured on the live board at
  // 1096x856 with every group open, clicking the last row put the panel at top
  // -1117 of its own 1912, so the foot of the archive calendar was what came up.
  //
  // Below 900px the panel is an inline drawer and the browser moves the page
  // ITSELF: inserting the drawer triggers SCROLL ANCHORING, which holds
  // whatever it picked as the anchor still and so scrolls the page down by the
  // height of what was just inserted. Measured at 876x860: scrollY 1527 -> 1800
  // on the click, with the row sitting at the same document offset throughout,
  // and NO scroll event, scrollTo, scrollIntoView or focus call anywhere in the
  // trace, which is the signature of an anchoring adjustment rather than
  // anything this code did. That is also why the landing is UNCONDITIONAL: a
  // "only move it when the top is hidden" guard reads the geometry AFTER the
  // adjustment, by which point the row is still on screen and the guard sees
  // nothing wrong. Assigning the position outright is what defeats it.
  //
  // The anchor is whichever comes FIRST of the panel's own box and the row's,
  // which resolves both layouts without reading a style: over the console the
  // panel's top is above the row's, inline it is below it.
  //
  // Two frames, the same wait revealGroup uses, so the panel has mounted and
  // laid out before anything is measured, then once more a beat later, since
  // the panel's data lands async and growing it can trip anchoring a second
  // time. Instant, not smooth: html carries scroll-behavior:smooth site-wide,
  // and gliding 1,100px through a console that has just been replaced reads
  // worse than arriving.
  const revealOpen = (anchor) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const land = () => {
      try {
        const con = document.querySelector('.dhome');
        const panel = con ? con.querySelector('.dtp') : null;
        if (!panel) return;
        let top = panel.getBoundingClientRect().top;
        if (anchor && anchor.isConnected) top = Math.min(top, anchor.getBoundingClientRect().top);
        // The one thing that overlaps the top of the page. MEASURED rather than
        // modelled: the header's height changes with width, and a landing that
        // models it puts the head of the panel underneath it. --ml-headh is the
        // LOCKED height the header itself publishes, which is the right number
        // in the landscape-touch layout too (there .qchm is display:contents and
        // its own rect measures 0); the rect is the fallback for any page that
        // does not run the home variant.
        const lock = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ml-headh'));
        const head = document.querySelector('.qchm');
        const off = ((lock > 0 ? lock : 0) || (head ? head.getBoundingClientRect().height : 0)) + HEAD_GAP;
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const y = Math.min(max, Math.max(0, Math.round(window.scrollY + top - off)));
        if (Math.abs(y - window.scrollY) < 2) return;
        try { window.scrollTo({ top: y, behavior: 'instant' }); }
        catch (x) { window.scrollTo(0, y); }
      } catch (x) { /* older Safari: leaving the scroll alone beats throwing */ }
    };
    requestAnimationFrame(() => requestAnimationFrame(() => { land(); setTimeout(land, 180); }));
  };

  // `anchor` is the row (or tile) that was clicked, captured synchronously by
  // the caller: React re-renders the button, so reading it back out of the
  // event inside the callback is too late.
  const pick = (key, anchor) => {
    setLbOpen(false);
    const opening = sel !== key;
    setSel((cur) => (cur === key ? null : key));
    if (opening) revealOpen(anchor || null);
  };

  // ── the per-game expand panel (overlays the board; see DailyTilePanel) ──
  const renderPanel = (g) => {
    const bg = byKey[g.key] || null;
    return (
      <DailyTilePanel
        key={'panel-' + g.key}
        game={g}
        accent={catCol(g.cat)}
        isDone={done.has(g.key)}
        inProgress={inprog.has(g.key)}
        streak={streaks[g.key] || 0}
        todayRow={myRow(g.key)}
        todayField={bg && typeof bg.field === 'number' ? bg.field : null}
        standings={bg && Array.isArray(bg.board) ? bg.board : []}
        meKey={meKey}
        data={gameData[g.key] || null}
        canPin={myGamesOn}
        pinned={favSet.has(g.key)}
        onTogglePin={() => toggleFavorite(g.key)}
        onClose={() => setSel(null)}
      />
    );
  };

  // The slate: one row per game, with the per-game panel opening as a drawer
  // directly under its own row rather than as an overlay over the board.
  /* ── HOME v3: the category board ──────────────────────────────────────
     Two things replace the slate at layout="catboard": a cap of picks, and
     nine category tiles instead of 63 rows. Everything reads values the
     component already computes; no new state, no new data. The one piece of
     state is `filter`, the SAME one the slate's chip strip drives, so the
     open category is not a second source of truth.

     THE BOARD HAS TWO MODES (owner, 2026-08-15):
       shut  cap of SIX picks, and the nine tiles own the rest of the screen.
       open  cap shrinks to THREE, the tiles step aside, and the chosen
             category takes the whole board.
     So the cap is the "what should I play" zone and it yields space the
     moment you have answered that question yourself by picking a category. */
  const circuitGames = (name) => {
    const row = CIRCUITS.find(([n]) => n === name);
    if (!row) return [];
    return games.filter((g) => row[1].includes(g.name));
  };
  const openCircuit = String(filter || '').startsWith('circuit:') ? filter.slice(8) : null;

  const catOf = (c) => games.filter((g) => g.cat === c);
  const catOpen = slateCats.includes(filter) ? filter : null;
  const boardOpen = catOpen || openCircuit;
  const fillState = FILL_STATES.includes(filter) ? filter : null;
  const fillOn = cats && !!(boardOpen || fillState);

  /* The cap's candidates, best first, deduped. The first three are the old
     cap's own ranking and keep its wording: play, resume, retry. After those
     come the easiest leaderboard and the lead picks (familiar favorite, new to
     you, crowd favorite), and if the day is quiet enough that even those run
     out it fills from unplayed games in board order, so six slots are always
     six real suggestions rather than four and two holes. */
  const capPool = (() => {
    const out = []; const seen = new Set();
    const add = (kind, eb, g, btn, note) => {
      if (!g || seen.has(g.key)) return;
      seen.add(g.key); out.push({ kind, eb, g, btn, note });
    };
    /* THE CAP IS ONE ROW OF THREE, and its colour is a rule rather than an
       accident (owner, 2026-08-15): three blue when nothing is outstanding, at
       most ONE gold, and blue-gold-red when there is one of each.

       Unbounded state cards were what made this necessary. Paused and failed
       boards accumulate, so a busy day filled the cap with gold and red and it
       stopped suggesting anything: it just listed what you had left lying
       around. One of each is enough to say you have unfinished business, and
       every remaining slot goes to a pick that actually recommends something.
       Up next always leads, so there is always at least one blue. */
    if (nextGame) add('up', 'Up next', nextGame, 'Play', playsNote(nextPlays));
    const prog = capState.find((c) => c.kind === 'prog');
    if (prog) add('prog', 'Paused', prog.game, 'Resume', playsNote(playsOf(prog.game.key)));
    const fail = capState.find((c) => c.kind === 'fail');
    if (fail) add('fail', 'Failed', fail.game, 'Retry', '');
    if (easiest) add('easy', 'Easiest leaderboard', easiest.game, 'Play', fieldNote(easiest.players));
    for (const c of (capLead || [])) add('lead', CAP_LEAD_LABEL[c.kind], c.game, 'Play', '');
    for (const g of games) {
      if (out.length >= 3) break;
      if (done.has(g.key) || inprog.has(g.key)) continue;
      add('lead', CAT_SHORT[g.cat] || g.cat, g, 'Play', playsNote(playsOf(g.key)));
    }
    return out;
  })();

  const renderCatCap = () => {
    /* BLUE LEADS, STATE TRAILS (owner, 2026-08-15: blue tiles always upper
       left, push paused to the right). Composition picks WHAT is in the cap;
       this orders it. Without the sort a lone paused board landed in the middle
       (blue, gold, blue) because it was chosen second; sorted, the recommending
       picks group left and whatever is outstanding sits on the right edge where
       it reads as a tail rather than an interruption. Stable, so the pick order
       inside each colour survives. */
    // EVERY TRACK BUT THE LAST is sized against the board's content width, and
    // the last one takes the remainder. That puts every card's LEFT edge on its
    // column's edge while the cap still runs the full width of the console: a
    // first attempt reserved a matching gutter on the cap itself, which aligned
    // the cards but left the last one ending 10px short, so the red card had a
    // dark notch beside it while the navy strips above and below ran to the
    // edge. --dh-sbw defaults to 0, which is both the pre-measurement state and
    // the correct answer wherever the board does not scroll.
    const capCols = (n) => (n <= 1
      ? '1fr'
      : 'repeat(' + (n - 1) + ',calc((100% - var(--dh-sbw,0px)) / ' + n + ')) 1fr');
    const RANK = { up: 0, easy: 0, lead: 0, prog: 1, fail: 2 };
    const slots = capPool.slice(0, 3)
      .map((sl, i) => ({ sl, i }))
      .sort((a, b) => (RANK[a.sl.kind] ?? 0) - (RANK[b.sl.kind] ?? 0) || a.i - b.i)
      .map((x) => x.sl);
    if (!slots.length) {
      return (
        <div className="cb-cap" style={{ gridTemplateColumns: '1fr' }}>
          <span className="cb-card up">
            <span className="cb-ct">
              <span className="cb-ce">Clean sweep</span>
              <span className="cb-cn">All {GAMES.length} done</span>
              <span className="cb-cs">A fresh slate lands at midnight</span>
            </span>
          </span>
        </div>
      );
    }
    return (
      <div className="cb-cap" style={{ gridTemplateColumns: capCols(Math.max(1, slots.length)) }}>
        {slots.map((sl) => (
          <a key={sl.g.key} href={sl.g.href} className={'cb-card ' + sl.kind} aria-label={sl.btn + ' ' + sl.g.name}>
            <span className="cb-ct">
              <span className="cb-ce">{sl.eb}</span>
              <span className="cb-cn">{sl.g.name}</span>
              <span className="cb-cs">{sl.g.tag}{sl.note}</span>
            </span>
            <span className="cb-cb"><Play size={11} fill="currentColor" strokeWidth={0} />{sl.btn}</span>
          </a>
        ))}
      </div>
    );
  };


  // The fill panel's catch-up strip wants each game's real drop list: the true
  // dates, and whether the VIEWER played that day. That is exactly what the
  // drawer fetch above returns, so this reuses its endpoint, its gameData cache
  // and its fetchedRef rather than adding a second source of truth: a game
  // loaded here costs nothing when its drawer opens later, and the other way
  // round. Only the handful of games on a thin, open group are fetched, and
  // only once the panel is actually on screen. Until it lands the strip renders
  // from num arithmetic (see renderFill), so the panel never waits on a fetch.
  // PLACEMENT IS LOAD-BEARING (2026-08-15). A dependency array is evaluated
  // during render, at the line the hook is called on, so an effect naming
  // slateList or boardOpen must sit BELOW them. Declared 500 lines earlier it
  // threw Cannot access before initialization and took the whole homepage down.
  useEffect(() => {
    if (!fillOn) return undefined;
    let alive = true;
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    for (const g of slateList.slice(0, FILL_GAMES)) {
      if (fetchedRef.current.has(g.key)) continue;
      fetchedRef.current.add(g.key);
      const key = g.key;
      const qs = new URLSearchParams({ game: key });
      if (anonId) qs.set('anonId', anonId);
      if (email) qs.set('email', email);
      fetch('/api/quiz/daily-game?' + qs.toString())
        .then((r) => r.json())
        .then((d) => { if (alive && d && !d.error) setGameData((cur) => ({ ...cur, [key]: d })); })
        .catch(() => { fetchedRef.current.delete(key); });
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillOn, filter, slateList.length]);

  const renderFill = () => {
    if (!fillOn) return null;
    // A state has no subject to name, so the copy says "these games" and the
    // two subject blocks fall away on their own: nbr finds nothing without a
    // category or circuit, and FILL_DEPT has no entry for an empty label.
    const label = boardOpen || '';
    const subj = boardOpen || 'these games';

    /* CATCH UP. The puzzle numbers come from the daily-combined payload the
       strip already holds (byKey[key].num, the same field the same-device save
       detection reads), so a week of archive links costs no fetch: drops are
       daily, so num - k is k days ago. A game younger than a week simply shows
       fewer chips, and one the payload has no number for is skipped. */
    const back = [];
    let anySun = false;
    for (const g of slateList.slice(0, FILL_GAMES)) {
      const gd = gameData[g.key];
      const chips = [];
      if (gd && Array.isArray(gd.drops) && gd.drops.length) {
        // The real thing: the game's own live drops, today excluded (it is the
        // row directly above), newest first. played/incomplete are the viewer's,
        // resolved server side, so they hold on a device this browser has never
        // seen. A Sunday drop is only an EDITION where the game runs one, which
        // is the sunday-editions registry's job to say.
        for (const d of gd.drops.filter((x) => !x.isToday).slice(-FILL_DAYS).reverse()) {
          const sun = isoSunday(d.dateISO) && hasSundayEdition(g.key);
          if (sun) anySun = true;
          chips.push({
            p: d.num, href: d.href, label: sunDate(d.dateISO) || ('No. ' + d.num),
            played: !!d.played, part: !!d.incomplete, sun,
          });
        }
      } else {
        // Before the fetch lands. Drops are daily, so num - k is k days ago, and
        // the numbers are already in hand from the daily-combined payload.
        const b = byKey[g.key];
        const num = b && b.num != null ? Number(b.num) : null;
        if (!num) continue;
        for (let k = 1; k <= FILL_DAYS && num - k >= 1; k++) {
          const bd = backDates && backDates[k - 1];
          const sun = !!(bd && bd.sun) && hasSundayEdition(g.key);
          if (sun) anySun = true;
          chips.push({
            p: num - k, href: g.href + '?p=' + (num - k),
            label: bd ? bd.label : 'No. ' + (num - k), sun,
          });
        }
      }
      if (chips.length) back.push({ g, chips });
    }

    /* NEIGHBOURS. A circuit crosses categories on purpose, so its neighbours
       are whatever shares a category with it rather than a hand-kept list: the
       categories it reaches, then every other circuit that reaches one of them.
       An open CATEGORY instead offers the circuits that cut through it. */
    const nbr = [];
    const push = (k, text, n) => { if (n && k !== filter && !nbr.some((x) => x.k === k)) nbr.push({ k, text, n }); };
    if (openCircuit) {
      const mine = new Set(circuitGames(openCircuit).map((g) => g.cat));
      for (const c of slateCats) if (mine.has(c)) push(c, 'All ' + (CAT_SHORT[c] || c), catOf(c).length);
      for (const [n] of CIRCUITS) {
        if (n === openCircuit) continue;
        const gs = circuitGames(n);
        if (gs.some((g) => mine.has(g.cat))) push('circuit:' + n, n, gs.length);
      }
    } else {
      for (const [n] of CIRCUITS) {
        if (circuitGames(n).some((g) => g.cat === catOpen)) push('circuit:' + n, n, circuitGames(n).length);
      }
    }

    const dept = FILL_DEPT[label];
    const qc = dept ? (quizCats || []).find((c) => c.key === dept) : null;
    const quizzes = qc && Array.isArray(qc.top) ? qc.top.slice(0, 6) : [];

    const sect = (key, title, sub, body) => (
      <section className="cb-fs" key={key}>
        <h4 className="cb-fh">{title}{sub ? <i>{sub}</i> : null}</h4>
        {body}
      </section>
    );

    // DEFINED AFTER sect, WHICH IT CALLS. A const arrow is in its temporal dead
    // zone until its own line, so hoisting this above sect throws at runtime and
    // esbuild passes it clean.
    /* ARCHIVE COMPLETION for the same games (owner, 2026-08-15). The right
       column's own block, and the one that is always there: every game has an
       archive and a percentage of it done, where a quiz department exists for
       only some groups. Numbers come from the archive map daily-status already
       returns and the row's own ring already draws, so this costs no fetch and
       cannot disagree with the ring beside it. */
    const arch = slateList.slice(0, FILL_GAMES)
      .map((g) => ({ g, a: archive[g.key] }))
      .filter((x) => x.a && x.a.total)
      .map((x) => ({ g: x.g, played: x.a.played || 0, total: x.a.total,
                     pct: Math.round(((x.a.played || 0) / x.a.total) * 100) }));
    /* ONE ROW PER GAME (owner, 2026-08-15). Catch up and Archive completion
       named the SAME games in the SAME order in two columns, so every title was
       printed twice and the two lists sat on different pitches, which put a name
       beside the wrong bar by the sixth game. One table instead: the name once
       on the left, then its week of drops, then how much of that game's whole
       archive is done. Reading across a row is the point now rather than an
       accident of alignment. A game missing either half still gets its row. */
    const backBy = {}; for (const b of back) backBy[b.g.key] = b;
    const archBy = {}; for (const a of arch) archBy[a.g.key] = a;
    const recs = slateList.slice(0, FILL_GAMES)
      .map((g) => ({ g, chips: (backBy[g.key] && backBy[g.key].chips) || [], a: archBy[g.key] || null }))
      .filter((r) => r.chips.length || r.a);

    const quizSect = quizzes.length ? sect('quiz', 'Quizzes on the same subject', qc.label + ' \u00b7 ' + qc.count, (
      <div className="cb-fq">
        {quizzes.map((q) => (
          <a key={q.id} className={'cb-fqc' + (q.done ? ' done' : '')} href={'/quiz/' + q.id}>
            <span className="cb-fqt">{q.title}</span>
            <span className="cb-fqm">{q.done ? 'Played' : 'Play'}</span>
          </a>
        ))}
      </div>
    )) : null;

    return (
      <div className="cb-fill">
        {recs.length ? sect('rec', 'Catch up', 'The last week of ' + subj + (anySun ? ' \u00b7 S marks a Sunday Edition' : ''), (
          <div className="cb-frows">
            <div className="cb-frow head">
              <span />
              <span>Last week</span>
              <span className="ar">Archive to date</span>
            </div>
            {recs.map(({ g, chips, a }) => (
              <div className="cb-frow" key={g.key}>
                <span className="cb-fbn">{g.name}</span>
                <span className="cb-fbd">
                  {chips.map((c) => (
                    <a
                      key={c.p}
                      className={'cb-fbc' + (c.played ? (c.part ? ' part' : ' done') : '') + (c.sun ? ' sun' : '')}
                      href={c.href}
                      title={g.name + ' ' + c.label + (c.sun ? ', Sunday Edition' : '') + (c.played ? (c.part ? ', started' : ', played') : '')}
                    >
                      {c.sun ? <i className="cb-fbs" aria-hidden="true">S</i> : null}
                      {c.label}
                      {c.played ? (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.2" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                      ) : null}
                    </a>
                  ))}
                </span>
                <span className="cb-fbar">{a ? <i style={{ width: Math.max(a.pct, 1) + '%' }} /> : null}</span>
                <span className="cb-fap">{a ? <>{a.pct}<em>%</em></> : null}</span>
                <span className="cb-fac">{a ? a.played + ' of ' + a.total : ''}</span>
              </div>
            ))}
          </div>
        )) : null}
        <div className={'cb-fcols' + (quizSect ? '' : ' one')}>
          <div className="cb-fcl">
            {nbr.length ? sect('nbr', 'More in ' + label, null, (
              <div className="cb-fnb">
                {nbr.slice(0, 9).map((x) => (
                  <button key={x.k} type="button" className="cb-fnc" onClick={() => setFilter(x.k)}>
                    {x.text}<b>{x.n}</b>
                  </button>
                ))}
              </div>
            )) : null}
          </div>
          {quizSect ? <div className="cb-fcr">{quizSect}</div> : null}
        </div>
        {fillState ? (
          <button type="button" className="cb-fask" onClick={() => setFilter('ready')}>
            <span className="cb-fat">
              <b>{slateList.length === 1 ? 'One game' : slateList.length + ' games'} {FILL_STATE_WORD[fillState]}</b>
              <i>Here is where each one stands</i>
            </span>
            <span className="cb-fab">Show what is left<ArrowRight size={12} strokeWidth={2.8} /></span>
          </button>
        ) : (
          <a className="cb-fask" href="/request">
            <span className="cb-fat">
              <b>{slateList.length === 1 ? 'One game' : slateList.length + ' games'} in {label}</b>
              <i>Tell us what belongs here and we will build it</i>
            </span>
            <span className="cb-fab">Suggest a game<ArrowRight size={12} strokeWidth={2.8} /></span>
          </a>
        )}
      </div>
    );
  };

  const renderSlate = (rows0, dim) => {
    const out = [];
    // A PAUSED GAME IS A READY-TO-PLAY ROW AT THE FOOT OF THAT GROUP (owner,
    // 2026-08-08). Paused games left the board for the cap earlier that day,
    // which left a game you had started findable in exactly one place, and only
    // while the cap still had a slot for it. They are back in the slate as
    // ordinary rows: same group as everything else you have not finished, sorted
    // BELOW the untouched ones, carrying the faint amber ground and gold left
    // rule that say the game is already open. The cap still promotes the first
    // couple of them; this is the copy you can always scroll to.
    //
    // So the slate holds TWO bands: Ready to play (untouched, then paused) and
    // Done today. There is no In progress band, its rows or its bar any more.
    // The partition is stable, so each of the three keeps the order the sort
    // handed it.
    // THE SUNDAYS TAB is its own view, not a filter over today's games: every
    // row points at an ARCHIVED puzzle, so none of today's state (played,
    // paused, incomplete) means anything here and none of the bands apply.
    if (filter === 'sunday') {
      const out = [<div className="sl-note" key="sun-note">
        This is a slate of your unplayed or oldest Sunday Editions of each game.
      </div>];
      if (sunErr) {
        out.push(<div className="sl-note dim" key="sun-e">That did not load. Try the tab again in a moment.</div>);
      } else if (!sunRows) {
        out.push(<div className="sl-note dim" key="sun-l">Finding your Sunday Editions&hellip;</div>);
      } else if (!sunRows.length) {
        out.push(<div className="sl-note dim" key="sun-0">No Sunday Editions have run yet.</div>);
      } else {
        for (const r of sunRows) {
          const g = GAMES.find((x) => x.key === r.key);
          if (!g) continue;
          out.push(
            <a className="sl-row sun" key={'sun-' + r.key} href={r.href}>
              <span className="sl-ic"><img src={blueTile(g.img)} alt="" aria-hidden="true" onError={tileFallback} /></span>
              <span className="sl-nm">
                <b>{g.name}</b><span className="sl-cm">{g.cat}</span>
                <span className="sl-sub">
                  <span className="sl-tg">{g.tag}</span>
                  <span className="sl-dot">&middot;</span>
                  <span className="sl-mld">{r.live ? sunDate(r.live) : `No. ${r.num}`}</span>
                </span>
              </span>
              <span className="sl-status"><span className="sl-btn play">{r.played ? 'Replay' : 'Play'}</span></span>
            </a>
          );
        }
      }
      return out;
    }
    const arr = rows0.filter((g) => !done.has(g.key) && !inprog.has(g.key))
      .concat(rows0.filter((g) => !done.has(g.key) && inprog.has(g.key)))
      .concat(rows0.filter((g) => isFail(g.key)))
      .concat(rows0.filter((g) => done.has(g.key) && !isFail(g.key)));
    // Phone layout groups the slate by state (owner-approved direction B,
    // 2026-08-07). The band headers are pushed FIRST and moved into place
    // by CSS `order` inside the <=900px block, NOT interleaved here, so the
    // DESKTOP source order is byte-identical to before and the sortable column
    // headers keep working exactly as they did. Above 900px the bands are
    // display:none. A row and its own drawer carry the same order value, and
    // equal-order flex items keep source order, so a drawer never leaves its
    // row. An empty group renders no band.
    let nProg = 0, nTodo = 0, nFail = 0, nDone = 0;
    arr.forEach((g) => {
      if (isFail(g.key)) nFail += 1;
      else if (done.has(g.key)) nDone += 1;
      else if (inprog.has(g.key)) nProg += 1;
      else nTodo += 1;
    });
    // Ready to play is BOTH sub-groups: the untouched rows and the paused ones
    // beneath them.
    const nReady = nTodo + nProg;
    // A band normally prints its own size on the right. Ready to play prints the
    // DAY instead (owner, 2026-08-08): how many of the whole slate are finished.
    // That figure used to be the third box in the phone header, where it competed
    // with the two IQ figures for a ~120px column; here it sits directly above the
    // rows it is counting. `n` is the GLOBAL done count, so a category filter
    // narrows the rows without rewriting the day's score. The ready count it
    // replaces is the same fact stated backwards, and the band only renders when
    // something is ready anyway.
    // One expand bar per group, ordered to the END of its own group by CSS,
    // exactly like the bands. A group with nothing hidden renders no bar, and a
    // group showing NOTHING renders no bar either: its band becomes the control
    // (see `band` below). The peek numbers are declared up here because the band
    // needs them.
    // The whole budget goes to UNPLAYED rows; paused rows peek zero and wait for
    // the bar. That is why the peek is measured against each sub-group's own
    // index below (`bucket`) rather than one running count.
    const todoPeek = twoUp ? TABLET_ROWS : PHONE_ROWS;
    // What the one Ready-to-play bar has to promise: the unplayed overflow PLUS
    // every paused row, and nothing at all under a filter, which shows every row
    // by itself.
    // Paused rows have their own band now, so they are no longer part of what
    // this figure has to promise.
    const readyHidden = filter === 'all' ? Math.max(0, nTodo - todoPeek) : 0;
    // A FILTER already is the reader asking to narrow the slate, so peeking
    // inside it would be answering that request with another lid (owner,
    // 2026-08-07): any filter other than All shows every paused and unplayed
    // row, with no bar. Finished games stay collapsed regardless, since the
    // reason they are collapsed is that you already know how you did.
    const peekOf = (grp) => {
      if (grp === 'dn') return 0;
      if (filter !== 'all') return Infinity;
      // SHUT AT EVERY WIDTH (owner, 2026-08-12), where desktop used to return
      // Infinity and list these rows inline under a band that was a plain
      // label. That was the other half of the cap's expander: with two ways to
      // reach a paused game the cap grew a bar for it, and now that the bar is
      // gone the band has to be able to open the group itself. Every populated
      // group is its own expander, and the row you want sits directly under the
      // band that names it. A filter is still the exception above: it shows
      // every row with no lid anywhere.
      if (grp === 'prog' || grp === 'fail') return 0;
      return todoPeek;
    };
    const toggle = (grp) => setGrpOpen((cur) => ({ ...cur, [grp]: !cur[grp] }));
    // OPENING A GROUP BRINGS IT INTO THE PORT (owner, 2026-08-12). The board is a
    // fixed-height scroller (--dh-fit) and a band is sticky at the BOTTOM edge
    // until its own rows are reached, so pressing Complete today revealed five
    // rows BELOW the pinned band, outside the visible port, and the band itself
    // did not move: the click looked like it had done nothing. The group's foot
    // now comes up to the port's bottom edge, so the group becomes the new end
    // of the scroll, which for Complete today (the last group) is the foot of
    // the board.
    //
    // BOTH STICKY STACKS COUNT, and forgetting the bottom one is what put the
    // last In progress row UNDER the pinned Complete today band on the first
    // pass. A band is sticky at the top by the bands above it and at the bottom
    // by the bands below it, so the port's usable window is inset at both ends:
    // bi bands above at --bh (30px) each, and bn - 1 - bi below. Scrolling to
    // the raw box.bottom hides the last row behind whatever is pinned there.
    // For the last group the bottom stack is zero, so it still lands flush.
    //
    // The top inset is the clamp, so a group TALLER than the port lands on its
    // head rather than skipping past it. Keep BH in step with --bh on .sl-band.
    //
    // Two frames, the same wait the "show fewer" bar uses, so the re-render and
    // its layout have both landed before anything is measured. The groups are
    // laid out by CSS `order`, so this reads geometry and never DOM position.
    const GRP_ROWS = { todo: '.sl-row:not(.done):not(.fail):not(.inprog)', prog: '.sl-row.inprog', fail: '.sl-row.fail', dn: '.sl-row.done' };
    const revealGroup = (port, grp, bi, bn) => {
      const BH = 30;
      if (!port || !GRP_ROWS[grp]) return;
      // RUN IT TWICE, and the second pass is not belt and braces. Measured: the
      // first landing came out exactly 30px (one band) short, because the
      // browser clamps an assignment to scrollTop against the scroll range AS
      // IT STANDS, and at two frames the range was still 30 short of what it
      // settled at. Chasing the exact frame the layout finishes is a losing
      // game, so the landing simply re-measures once more a beat later. It is
      // idempotent: on a run that already landed, delta comes out under a pixel
      // and nothing moves.
      const land = () => {
        try {
          const rows = [...port.querySelectorAll(GRP_ROWS[grp])].filter((r) => !r.classList.contains('sl-hid'));
          if (!rows.length) return;
          const box = port.getBoundingClientRect();
          let foot = -Infinity, head = Infinity;
          rows.forEach((r) => { const b = r.getBoundingClientRect(); if (b.bottom > foot) foot = b.bottom; if (b.top < head) head = b.top; });
          const delta = Math.min(foot - (box.bottom - (Math.max(0, (bn || 1) - 1 - bi) * BH)), head - box.top - (bi * BH));
          // Assigned, NOT scrollTo({behavior:'smooth'}). Measured on the live
          // board: a smooth scrollTo on this port is silently a NO-OP in some
          // Chromes (a plain scrollTo(500) moved it, the same call with
          // behavior:'smooth' left scrollTop where it was), which shipped a fix
          // that did nothing. An instant landing also reads better here, since
          // the rows it is scrolling to have only just appeared.
          if (delta > 1) port.scrollTop = Math.min(port.scrollHeight - port.clientHeight, port.scrollTop + delta);
        } catch (x) { /* older Safari: leaving the scroll alone beats throwing */ }
      };
      requestAnimationFrame(() => requestAnimationFrame(() => { land(); setTimeout(land, 140); }));
    };
    // A band normally prints its own size on the right. Ready to play prints the
    // DAY instead (owner, 2026-08-08): how many of the whole slate are finished.
    // That figure used to be the third box in the phone header, where it competed
    // with the two IQ figures for a ~120px column; here it sits directly above the
    // rows it is counting. `n` is the GLOBAL done count, so a category filter
    // narrows the rows without rewriting the day's score. The ready count it
    // replaces is the same fact stated backwards, and the band only renders when
    // something is ready anyway.
    //
    // THE BAND IS THE CONTROL WHEN ITS GROUP SHOWS NOTHING (owner, 2026-08-08).
    // Done today peeks zero rows, so a band saying "Done today 6" sat directly on
    // a bar saying "Show all 6": two full rows spent on one shut group. The band
    // takes a chevron and the click instead, and `more` drops the second row. A
    // group that peeks SOME rows keeps its bar, since there the bar counts what
    // is still hidden, which is not what the band says.
    const band = (grp, label, count, fig, bi, bn) => {
      if (!count) return null;
      const shut = count > peekOf(grp) && peekOf(grp) === 0;
      const inner = (
        <>
          <span className="sl-bt">{label}</span>
          <span className="sl-bc">{fig == null ? count : fig}</span>
          {shut ? (grpOpen[grp]
            ? <ChevronUp className="sl-bch" size={13} strokeWidth={2.8} />
            : <ChevronDown className="sl-bch" size={13} strokeWidth={2.8} />) : null}
        </>
      );
      return shut ? (
        <button
          type="button"
          className={`sl-band ${grp} tog`}
          key={`band-${grp}`}
          style={{ '--bi': String(bi), '--bn': String(bn) }}
          onClick={(e) => {
            // The PORT is captured here, synchronously, rather than walked up
            // from the button inside the callback: the button is what React
            // re-renders, the scroller is not.
            const port = e.currentTarget.closest('.dh-board');
            const wasOpen = grpOpen[grp];
            toggle(grp);
            if (!wasOpen) revealGroup(port, grp, bi, bn);
          }}
          aria-expanded={grpOpen[grp]}
        >{inner}</button>
      ) : (
        <div className={`sl-band ${grp}`} key={`band-${grp}`} style={{ '--bi': String(bi), '--bn': String(bn) }}>{inner}</div>
      );
    };
    // EVERY BAND STAYS ON SCREEN (owner, 2026-08-12): the groups you have
    // scrolled past stack at the top of the port and the groups still to come
    // stack at the bottom, so Complete today is reachable in one click instead
    // of a 1,400px scroll. That is a sticky TOP offset of the bands above it
    // and a sticky BOTTOM offset of the bands below it, and both depend on how
    // many bands ACTUALLY rendered, so the index and the count travel to CSS as
    // --bi / --bn rather than being hardcoded: with only Ready to play and
    // Complete today on the board the green band pins flush to the bottom edge
    // instead of holding room for two groups that do not exist. The offsets
    // themselves live on .sl-band in the min-width:901px block.
    // The two started groups sit between the untouched games and the finished
    // ones, in the order a game passes through them: still going, then over and
    // unsolved, then done.
    // ONE WORD EACH (owner, 2026-08-14). The bands used to read Ready to play /
    // In progress / Incomplete today / Complete today, four phrases stacked
    // down the right of the board saying what a single word says: the group's
    // colour, its count and the rows under it carry the rest. "Paused" is also
    // the word the cap has always used for a game with a live board waiting,
    // so the two surfaces finally say the same thing. Keep this vocabulary in
    // step with the day tally's pips and the cap's state cards, which are the
    // same four states named in two other places. The group KEYS are unchanged
    // (todo / prog / fail / dn), so the older comments through this file that
    // still call a band by its old phrase are describing these same four.
    const bandSpec = [
      ['todo', 'Ready', nReady, `${n}/${GAMES.length} played`],
      ['prog', 'Paused', nProg, null],
      ['fail', 'Failed', nFail, null],
      ['dn', 'Done', nDone, null],
    ].filter((b) => b[2]);
    bandSpec.forEach(([grp, label, count, fig], i) => out.push(band(grp, label, count, fig, i, bandSpec.length)));
    // The bar names how many rows are HIDDEN, not how many the group holds
    // (owner, 2026-08-07): "Show all 38" made you do the subtraction against a
    // band that already printed the total.
    // PHONE ONLY, and one bar. Desktop lists every unfinished row (its .sl-hid
    // rule is scoped to the finished ones) and shuts Done today from the band
    // itself, so there is nothing left for a desktop bar to do: .sl-more is
    // display:none above 900px.
    const more = (grp, hidden) => (hidden > 0 ? (
      <button
        type="button"
        className={`sl-more ${grp}`}
        key={`more-${grp}`}
        onClick={(e) => {
          const el = e.currentTarget;
          const wasOpen = grpOpen[grp];
          toggle(grp);
          // COLLAPSING FOLLOWS THE READER (owner, 2026-08-07). Taking 34 rows
          // back out of the page leaves them wherever those rows used to be,
          // which is a long way from the bar they just pressed. Two frames, so
          // the re-render and its layout have both landed before we measure.
          if (wasOpen) {
            requestAnimationFrame(() => requestAnimationFrame(() => {
              try { el.scrollIntoView({ block: 'center' }); } catch (x) { /* older Safari */ }
            }));
          }
        }}
        aria-expanded={grpOpen[grp]}
      >
        {grpOpen[grp]
          ? <>Show fewer <ChevronUp size={12} strokeWidth={2.8} /></>
          : <>{`Show ${hidden} more`}<ChevronDown size={12} strokeWidth={2.8} /></>}
      </button>
    ) : null);
    // ONE BAR FOR EVERYTHING STILL UNDER A LID (owner, 2026-08-09). Now that it
    // sits at the FOOT of the board rather than between the groups, Ready to
    // play is no longer the only group above it, so opening just that one left
    // Complete today shut directly under a control that had said "show more".
    // It opens both and names the whole figure. Complete's own band keeps its
    // chevron, for opening that group by itself.
    const shutGroups = ['todo', 'prog', 'fail', 'dn'];
    const allOpen = shutGroups.every((g) => grpOpen[g]);
    const hiddenOf = { todo: readyHidden, prog: nProg, fail: nFail, dn: nDone };
    // Only a group a lid is actually ON counts toward the figure: on desktop the
    // two started groups peek Infinity, so nothing of theirs is hidden and the
    // bar must not offer to reveal it.
    const hiddenAll = shutGroups.reduce(
      (n, g) => n + (grpOpen[g] || peekOf(g) === Infinity ? 0 : hiddenOf[g]), 0);
    if (hiddenAll > 0 || allOpen) {
      out.push(
        <button
          type="button"
          className="sl-more todo"
          key="more-all"
          onClick={(e) => {
            const el = e.currentTarget;
            const next = !allOpen;
            setGrpOpen((cur) => ({ ...cur, todo: next, prog: next, fail: next, dn: next }));
            // Collapsing follows the reader, exactly as the per-group bar does:
            // taking dozens of rows back out of the page otherwise leaves them
            // wherever those rows used to be, a long way from what they pressed.
            if (!next) {
              requestAnimationFrame(() => requestAnimationFrame(() => {
                try { el.scrollIntoView({ block: 'center' }); } catch (x) { /* older Safari */ }
              }));
            }
          }}
          aria-expanded={allOpen}
        >
          {allOpen
            ? <>Show fewer <ChevronUp size={12} strokeWidth={2.8} /></>
            : <>{`Show all ${hiddenAll}`}<ChevronDown size={12} strokeWidth={2.8} /></>}
        </button>
      );
    }
    // Counted in DOM order, which IS the visual order WITHIN a group (equal
    // `order` values keep source order), so "the first two" means the same thing
    // to the reader as it does here.
    const seen = { prog: 0, todo: 0, fail: 0, dn: 0 };
    arr.forEach((g) => {
      const isDone = done.has(g.key);
      const fail = isFail(g.key);
      const ip = !isDone && inprog.has(g.key);
      // A paused row BELONGS to Ready to play (one band, one bar, one open
      // state) but is COUNTED against the paused half of the budget, since the
      // two halves peek different numbers of rows.
      const grp = fail ? 'fail' : (isDone ? 'dn' : (ip ? 'prog' : 'todo'));
      const bucket = fail ? 'fail' : (isDone ? 'dn' : (ip ? 'prog' : 'todo'));
      const gi = seen[bucket];
      seen[bucket] = gi + 1;
      const hid = !grpOpen[grp] && gi >= peekOf(bucket);
      const st = streaks[g.key] >= 2 ? streaks[g.key] : 0;
      const pl = playsOf(g.key);
      const bd = byKey[g.key];
      const lead = hasBoard && bd && bd.board && bd.board[0] ? bd.board[0].username : null;
      const row = isDone ? myRow(g.key) : null;
      const sl = row ? todayScoreLine(row, g.key) : null;
      const col = catCol(g.cat);
      const cat = CAT_SHORT[g.cat] || g.cat;
      const open = sel === g.key;
      const fav = favSet.has(g.key);
      out.push(
        <div
          key={g.key}
          className={`sl-row${isDone && !fail ? ' done' : ''}${fail ? ' fail' : ''}${ip ? ' inprog' : ''}${open ? ' open' : ''}${dim ? ' dim' : ''}${hid ? ' sl-hid' : ''}`}
          style={{ '--rc': col }}
          onClick={(e) => {
            // A click anywhere on the row, the emblem included, opens the stats
            // and archive drawer, and Play / Resume is the only control that
            // navigates into the game. This was phone-only behaviour from
            // 2026-08-07; desktop joined it 2026-08-08 when the row lost its
            // chevron along with the rest of its columns, so selecting the game
            // tile still expands exactly as it did.
            // The status cell holds the one control that leaves for the
            // game, so a click anywhere inside it follows that link rather than
            // expanding, even if it lands on the cell's padding instead of the
            // button itself (owner, 2026-08-08).
            const st = e.target.closest && e.target.closest('.sl-status');
            const go = st && st.querySelector('a[href]');
            if (go) { e.preventDefault(); window.location.assign(go.getAttribute('href')); return; }
            // A FINISHED ROW GOES BACK TO ITS BOARD, AND ITS SCORE CHIP IS THE
            // DRAWER (owner, 2026-08-16). Until now a done row was the ONE row
            // on the slate with no path back to the page you played it on: its
            // chip was a static score with no link in it and the row swallowed
            // the name link's navigation, so clicking a game you had already
            // played could open its stats and nothing else. The two swap round
            // here. The row is the primary target and it goes to the game, like
            // every other row in the column does; the chip that appears in the
            // hover zone on the right edge keeps the score AND becomes the way
            // into the stats and archive drawer.
            // It has to be the chip because .sl-arch, the archive chevron this
            // handler used to defer to, is display:none at EVERY width in the
            // card slate, so the row click was the drawer's only door.
            // Which leaves the phone, where .sl-status is display:none and
            // there is no hover to reveal it: no chip means no door, so a done
            // row there keeps the drawer on the row and reaches the board
            // through the Play again chip at the top of it. That is gated on
            // the cell ACTUALLY BEING RENDERED rather than on a breakpoint, so
            // the behaviour and the CSS can never drift apart.
            const stCell = e.currentTarget.querySelector('.sl-status');
            const stShown = !!(stCell && stCell.offsetParent !== null);
            // Anywhere in the cell, not just on the chip: the same courtesy the
            // link branch above extends to Play, Resume and Retry.
            if (isDone && st) { e.preventDefault(); pick(g.key, e.currentTarget); return; }
            if (e.target.closest && e.target.closest('.sl-btn.play,.sl-btn.prog,.sl-ab,.sl-favb')) return;
            if (isDone && stShown) {
              // Already inside a real link (the emblem, the name), so let the
              // browser have it and keep middle-click and cmd-click opening a
              // tab.
              if (e.target.closest && e.target.closest('a[href]')) return;
              e.preventDefault();
              window.location.assign(g.href);
              return;
            }
            e.preventDefault(); // swallow the name link's navigation
            pick(g.key, e.currentTarget);
          }}
        >
          {/* Pin. Restored to the row on 2026-08-07: the star used to live in a
              tile corner, and when the tile board was retired for the slate the
              only surviving control was the one inside the expanded drawer,
              which nobody found. Registered viewers only (a guest has no row to
              store the set on), so the column and its grid track both disappear
              for everyone else rather than leaving a dead gutter. */}
          {myGamesOn ? (
            <span className="sl-fav">
              <button
                type="button"
                className={`sl-favb${fav ? ' on' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // A tap leaves the button focused and phones keep painting it,
                  // which reads as a smudge stuck behind the star (same fix the
                  // tile star carried).
                  if (e.currentTarget && e.currentTarget.blur) e.currentTarget.blur();
                  toggleFavorite(g.key);
                }}
                disabled={!fav && favFull}
                aria-pressed={fav}
                aria-label={fav ? `Unpin ${g.name} from your games` : `Pin ${g.name} to the top of your board`}
                title={fav
                  ? 'One of your games. Unpin it here.'
                  : (favFull
                    ? `You have ${favMax} games pinned. Unpin one first.`
                    : 'Pin to your games. Your board reorders next visit.')}
              >
                <Star size={13} strokeWidth={2.4} fill={fav ? T.gold : 'none'} aria-hidden="true" />
              </button>
            </span>
          ) : null}
          <a className="sl-ic" href={g.href} aria-label={g.name}><img src={blueTile(g.img)} alt="" aria-hidden="true" onError={tileFallback} /></a>
          {/* Source order is now eyebrow, name, then the sub line that carries
              the leader. The desktop row is unaffected: .sl-cm and .sl-mld are
              both display:none above 900px, so it still renders exactly the
              name over its tagline. The phone's play count moved OUT of the sub
              line and into the .sl-pl figure on the right edge, which is why
              .sl-mpl is gone. */}
          <a className="sl-nm" href={g.href}>
            <i className="sl-cm" style={{ color: col }}>{cat}</i>
            {/* The count sits INSIDE the name line on a phone, small and quiet
                (owner, 2026-08-07): as a right-edge figure it cost a whole
                column and made every row taller. Desktop still reads it from
                the .sl-pl column below, which is why there are two of them and
                each is display:none at the other width. */}
            <b>{g.name}{pl != null ? <i className="sl-npl">{`${fmtPlays(pl)} playing`}</i> : null}</b>
            <span className="sl-sub">
              {/* The tagline is WRAPPED so it can be the flex item that yields.
                  As a bare text node the sub line's single ellipsis fell at the
                  end, which meant a long tagline (Emcee, Garble, Hands) ate the
                  leader chip instead of truncating itself. */}
              <i className="sl-tg">{g.tag}</i>
              <i className="sl-dot">{'\u00b7'}</i>
              <i className="sl-mld">{lead ? <><Crown size={9} strokeWidth={2.6} />{lead}</> : 'Be the first'}</i>
            </span>
          </a>
          <span className="sl-cat"><span style={{ background: `${col}1a`, color: col }}>{cat}</span></span>
          {/* One element, two readings: a bare centred number in the desktop
              Players column, a stacked figure on the phone. The <b>/<i> are
              neutralised above 900px (see .sl-pl b / .sl-pl i). */}
          <span className="sl-pl">{pl != null ? <><b>{fmtPlays(pl)}</b><i>playing</i></> : '\u2014'}</span>
          <span className={`sl-st${st ? '' : ' none'}`}>{st ? <><Flame size={10} strokeWidth={2.8} />{st}</> : '\u2013'}</span>
          <span className="sl-ld">{lead
            ? <><Crown size={10} strokeWidth={2.6} /><span>{lead}</span></>
            : <span className="sl-nl">Be the first</span>}</span>
          <span className="sl-status">
            {fail
              ? <a className="sl-btn fail" href={g.href} aria-label={`Retry ${g.name}`}>Retry</a>
              : isDone
              ? <button
                  type="button"
                  className="sl-btn done"
                  aria-expanded={open}
                  aria-label={`${g.name}${sl ? `, you scored ${sl} today` : ', done today'} \u2014 stats and archive`}
                  title="Stats and archive. The row itself goes back to the board."
                >{sl || 'Done'}</button>
              : ip
                ? <a className="sl-btn prog" href={g.href} aria-label={`Resume ${g.name}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg>
                    {/* The word rides with the triangle only where the paused
                        row is a cap-shaped card with a cap-sized button to put
                        it in; everywhere else the chip stays icon-only. */}
                    <i className="sl-rz">Resume</i>
                  </a>
                : <a className="sl-btn play" href={g.href}>Play</a>}
          </span>
          <span className="sl-arch">
            <button
              type="button"
              className={`sl-ab${open ? ' on' : ''}`}
              onClick={(e) => pick(g.key, e.currentTarget.closest('.sl-row'))}
              aria-expanded={open}
              aria-label={`${g.name} archive and stats`}
            >
              {(() => {
                const a = archive[g.key];
                const pct = (a && a.total) ? Math.round((a.played / a.total) * 100) : null;
                return pct == null ? <span className="sl-ab-pct">Archive</span> : (
                  <>
                    <span className="sl-ring" style={{ background: `conic-gradient(currentColor ${pct}%, rgba(20,22,28,0.14) 0)` }}><i /></span>
                    <span className="sl-ab-pct">{`${pct}%`}</span>
                  </>
                );
              })()}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
          </span>
        </div>,
      );
      // The state class is what pairs the drawer with its row under the phone
      // `order` grouping; it has no effect above 900px.
      // The drawer inherits sl-hid, so collapsing a group takes an open drawer
      // with it rather than leaving a panel with no row above it.
      if (open) out.push(<div className={`sl-drawer${isDone && !fail ? ' done' : ''}${fail ? ' fail' : ''}${ip ? ' inprog' : ''}${hid ? ' sl-hid' : ''}`} key={`drawer-${g.key}`}>{renderPanel(g)}</div>);
    });
    return out;
  };

  // Renders one group of tiles. `dim` marks the games a filter did not match:
  // they still render (so the board keeps its full height) but recede.
  //
  // Two shapes, per the click model at the top of this file. UNFINISHED: a div
  // carrying a stretched <a> over the whole face (a real link, so middle-click
  // and open-in-new-tab work) plus the corner stats button. FINISHED: a single
  // button that opens the panel, green, with no icon or category chip.
  const renderTiles = (arr, dim) => arr.map((g) => {
    const isDone = done.has(g.key);
    const ip = !isDone && inprog.has(g.key);
    const st = streaks[g.key] >= 2 ? streaks[g.key] : 0;
    const pl = playsOf(g.key);
    const lead = hasBoard && byKey[g.key] && byKey[g.key].board && byKey[g.key].board[0] ? byKey[g.key].board[0].username : null;
    const row = isDone ? myRow(g.key) : null;
    const sl = row ? todayScoreLine(row, g.key) : null;
    const fav = favSet.has(g.key);
    const cls = `dh-tile${isDone ? ' done' : ''}${ip ? ' inprog' : ''}${sel === g.key ? ' sel' : ''}${dim ? ' dim' : ''}${myGamesOn || fav ? ' pinnable' : ''}${fav ? ' pinned' : ''}`;
    const face = (
      <>
        <span className="dh-acc" style={{ background: catCol(g.cat) }} aria-hidden="true" />
        {/* A finished tile is itself a <button> (it opens the panel), so its
            star is a static indicator, never a nested button. The pin control
            for a finished game lives in that panel. */}
        {isDone && fav ? (
          <span className="dh-tfav ind" aria-hidden="true">
            <Star size={10} strokeWidth={0} fill="currentColor" />
          </span>
        ) : null}
        <span className="dh-tdot" style={{ background: isDone ? '#16a34a' : (ip ? T.gold : 'transparent') }} aria-hidden="true" />
        {pl != null ? (
          <span className="dh-tcorner">
            <span className="dh-tplays" title={`${pl.toLocaleString()} ${pl === 1 ? 'play' : 'plays'} today`}>
              <Users size={9} strokeWidth={2.6} aria-hidden="true" />{fmtPlays(pl)}
            </span>
          </span>
        ) : null}
        <span className="dh-tnm">{g.name}</span>
        {isDone ? (
          <span className="dh-tcta">Click for stats &amp; archive</span>
        ) : null}
        {(!isDone || slate) ? (
          <>
            <span className="dh-tcat" style={{ background: catCol(g.cat), color: T.white }}>
              {CAT_SHORT[g.cat] || g.cat}
            </span>
            <span className="dh-tic"><img src={g.img} alt="" aria-hidden="true" /></span>
          </>
        ) : null}
        <span className="dh-tmeta">
          <span className="dh-mrow">
            {isDone ? (
              <span className="dh-msc"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" aria-hidden="true"><path d="M4 12.5 L10 18.5 L20 6" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{sl || 'Done'}</span>
            ) : null}
            <span className={`dh-mstrk${st ? '' : ' none'}`}><Flame size={9} strokeWidth={2.8} />{st || 0}</span>
          </span>
          <span className="dh-mlead">
            {lead
              ? <><Crown size={9} strokeWidth={2.6} /><span>{lead}</span></>
              : <span className="dh-nolead">Be the first</span>}
          </span>
        </span>
      </>
    );

    if (isDone) {
      return (
        <button
          type="button"
          key={g.key}
          className={cls}
          onClick={(e) => pick(g.key, e.currentTarget)}
          aria-expanded={sel === g.key}
          aria-label={`${g.name} — done today${sl ? `, ${sl}` : ''}${fav ? ' — one of your games' : ''} — open stats and archive`}
        >
          {face}
        </button>
      );
    }
    return (
      <div key={g.key} className={cls} style={{ borderColor: CAT_BD[g.cat] }}>
        <a
          className="dh-tfill"
          href={g.href}
          aria-label={`${ip ? 'Resume' : 'Play'} ${g.name} — ${g.tag}${st ? ` — ${st}-day streak` : ''}${pl != null ? ` — ${pl} ${pl === 1 ? 'play' : 'plays'} today` : ''}`}
        />
        {face}
        <button
          type="button"
          className="dh-tstats"
          onClick={(e) => pick(g.key, e.currentTarget.closest('.dh-tile'))}
          aria-expanded={sel === g.key}
          aria-label={`${g.name} stats and archive`}
          title="Stats & archive"
        >
          <BarChart3 size={11} strokeWidth={2.6} aria-hidden="true" />
        </button>
        {/* Pin control. Registered viewers only: the set is stored on the
            account so it follows them across devices, and a guest has no row
            to store it on (owner ruling, 2026-08-02). It sits ABOVE the
            stretched .dh-tfill link (z-index 3, same as the stats glyph) and
            stops the click, so pinning never navigates into the game. */}
        {myGamesOn ? (
          <button
            type="button"
            className={`dh-tfav${fav ? ' on' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // A tap leaves the button focused, and on a phone the browser
              // keeps painting it until you tap something else, which read as a
              // faint block stuck behind the star after un-starring.
              if (e.currentTarget && e.currentTarget.blur) e.currentTarget.blur();
              toggleFavorite(g.key);
            }}
            disabled={!fav && favFull}
            aria-pressed={fav}
            aria-label={fav ? `Unpin ${g.name} from your games` : `Pin ${g.name} to the top of your board`}
            title={fav
              ? 'One of your games. Unpin it here.'
              : (favFull
                ? `You have ${favMax} games pinned. Unpin one first.`
                : 'Pin to your games. Your board reorders next visit.')}
          >
            <Star size={11} strokeWidth={2.4} fill={fav ? T.gold : 'none'} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  });

  return (
    <div className={'dhome' + (selGame ? ' open' : '') + (slate ? ' slate' : '') + (cats ? ' cats' : '')}>
      {/* RAW, not a JSX text child: React escapes `>` in a text node, so as
          `{`...`}` every child-combinator selector in here reached the browser
          as `.dh-cell &gt; img` and was dropped as invalid until hydration
          replaced the node. Nine rules were dead on first paint, among them
          the two that hide the cap's tile art and the one that sizes it, so
          the cap flashed two full-size game tiles on every load (owner,
          2026-08-06). Nothing inside contains `</`, so raw insertion is safe. */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dhome{position:relative;margin-bottom:16px;font-family:'Manrope',system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;min-height:100%;}
        /* ── stats bar, welded onto the grid ── */
        .dh-sbar{container-type:inline-size;position:relative;z-index:3;flex-wrap:nowrap;display:flex;align-items:center;gap:10px;background:var(--white);border:1.5px solid var(--border);border-bottom:none;border-radius:13px 13px 0 0;padding:10px 12px;color:var(--ink);border-bottom:1px solid #eef0f4;}
        /* ── the cap: two equal halves ── (owner, 2026-08-03)
           The Your-day stat row and its phone-only variant moved OUT of this bar
           and up into the page header, where each figure pairs with its lifetime
           counterpart. What is left is a pure "where to go next" cap, split down
           the middle: Up next (the most played open game in the category this
           viewer played last) on the left, Easiest leaderboard (fewest players
           today) on the right. Both
           halves are flex:1 1 0 so they hold exactly 50% each at every width,
           desktop and phone alike, rather than one growing to fit its text. */
        /* flex-basis 50%, not 0: with a 0 basis the right half's 14px padding
           and 1.5px divider are added OUTSIDE the equal share, so it came out
           ~15px wider than the left. A percentage basis is a border-box
           measurement, so the two halves come out exactly equal (each
           shrinking by half the gap), which is what the owner asked for. */
        .dh-cell{display:flex;align-items:center;gap:12px;flex:1 1 50%;min-width:0;box-sizing:border-box;}
        .dh-cell + .dh-cell{padding-left:14px;border-left:1.5px solid var(--border);}
        .dh-cell .dh-play{flex:0 0 auto;margin-left:auto;width:112px;min-width:0;font-size:13.5px;padding:11px 0;}
        .dh-cell>img{height:32px;width:auto;max-width:40px;object-fit:contain;flex:none;}
        .dh-bupt{min-width:0;}
        /* Both eyebrows read blue (owner, 2026-08-03). The easiest board used to
           own gold against Up next's blue; the cap now sits on the brand blue like
           the rest of the surface, so the .up modifier is a no-op kept for callers. */
        .dh-bue{font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--blue);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dh-bue.up{color:var(--blue);}
        .dh-bshort{display:none;}
        .dh-bun{font-size:17px;font-weight:800;letter-spacing:-.3px;line-height:1.3;padding-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dh-busub{font-size:11px;font-weight:600;color:var(--muted);line-height:1.35;padding-bottom:1px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        /* @container widths are the BAR's content box, not the viewport (.dh-sbar
           is border-box with 12px side padding), so a 390px phone queries at
           ~366px. Both halves shed furniture at the same width so neither wraps. */
        @container (max-width:620px){
          .dh-sbar{gap:8px;}
          .dh-cell{gap:9px;}
          .dh-cell + .dh-cell{padding-left:9px;}
          .dh-busub{display:none;}
          .dh-wideonly{display:none;}
          .dh-cell .dh-play{min-width:0;font-size:12px;padding:9px 13px;}
        }
        .dh-play{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--cta);color:var(--cta-ink);font-weight:800;font-size:13px;border-radius:9px;padding:10px 18px;text-decoration:none;border:none;cursor:pointer;transition:background .12s;}
        .dh-play:hover{background:var(--cta-hover);}
        /* The cap's expand bar. Same object as the board's group bars, spanning
           the cap's columns at the foot of the paused cards. */
        /* DEAD SINCE 2026-08-12: nothing renders .dh-cmore any more (the cap's
           expander moved to the bands at the foot of the board). Kept only
           because the fit effect still looks the bar up by class and treats
           its absence as "the block can never open"; delete both together. */
        .dh-cmore{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:6px;width:100%;
          padding:7px 13px;border:0;border-top:2px solid #c2ccdc;border-bottom:2px solid #c2ccdc;border-radius:0;
          background:#e8edf5;font-family:inherit;font-size:10.5px;font-weight:800;letter-spacing:.08em;
          text-transform:uppercase;line-height:1.5;color:var(--ink);cursor:pointer;}
        .dh-cmore:hover{background:#dde5f0;}
        /* Each figure in its own card's colour, so the number and the kind it
           counts read as one piece. font-weight is already 800 on the bar, so
           the <b> adds colour only. */
        .dh-cmp{color:var(--gold-ink);font-weight:inherit;}
        .dh-cmf{color:#b91c1c;font-weight:inherit;}
        .dh-cmd{color:var(--slate);}
        /* Clicking the bar left the browser's own focus ring on it once it had
           been used: a hard dark box around a band that is otherwise all soft
           greys, so a bar that had been pressed no longer matched one that had
           not (owner, 2026-08-08). Pointer focus is silent; KEYBOARD focus keeps
           a ring, in the site blue, inset so it cannot widen the bar. Same
           treatment on the board's own group bars, which are the same object. */
        .dh-cmore:focus{outline:none;}
        .dh-cmore:focus-visible{outline:2px solid var(--blue);outline-offset:-2px;}
        /* The paused block. SHUT it is display:contents, so the cards are grid
           items of the cap exactly as they were before this wrapper existed and
           every rule addressing them (the two-up tracks, the odd-child hairline,
           the width cuts) behaves identically. OPEN, above 900px, it becomes its
           own two-up grid with a measured ceiling and scrolls inside itself: see
           CAP_PMIN and the fit effect. The phone board is height:auto and flows
           with the page, so there it stays display:contents at any length and
           the cards simply stack. */
        .dh-cprog{display:contents;}
        /* daily leaderboard: always-visible Today's Top 3 + expand */
        @media(max-width:640px){.dh-dtop{gap:8px 10px;padding:8px 11px;}.dh-dtop-exp{font-size:11px;padding:6px 10px;}}
        /* ── tile board ── */
        .dh-boardwrap{position:relative;background:var(--white);border:1.5px solid var(--border);border-top:none;border-radius:0 0 13px 13px;
          /* SLATE HAS NO SIDE BORDERS (owner, 2026-08-09): every band above the
             board runs the full width of the console, and a 1.5px border here
             insets the board, so each group band inside it started one pixel in
             from the strip directly above. The rule lives beside the shorthand
             it overrides so the two are read together. */padding:10px;flex:1 1 auto;display:flex;flex-direction:column;min-height:0;}
        .dh-boardwrap.open{min-height:475px;}
        .dh-board{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;flex:1 1 auto;align-content:stretch;grid-auto-rows:minmax(118px,1fr);}
/* The board window. Until it has been measured (and always below 861px) this is
           a plain passthrough, so the grid flows normally and nothing is ever clipped
           by a stylesheet the JS has not caught up with. The .on class is what arms it. */
        .dh-vpwrap{position:relative;flex:0 0 auto;}
        .dh-vp{position:relative;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;}
        .dh-vp.on{flex:0 0 auto;}
        .dh-vp.on{overflow:hidden;}
        .dh-vp.on > .dh-board{position:absolute;top:0;left:0;right:0;transition:transform .32s cubic-bezier(.4,0,.2,1);}
        /* The arrow sits ON the window's bottom edge, centred, so it half-covers the
           bottom of the two middle tiles in the last visible row (owner, 2026-07-30).
           It lives outside .dh-vp because the window clips its own overflow. */
        .dh-more{position:absolute;left:50%;bottom:0;transform:translate(-50%,50%);z-index:5;width:38px;height:38px;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--white);border:1.5px solid var(--border);box-shadow:0 3px 10px rgba(20,22,28,0.20);cursor:pointer;color:var(--accent);font-family:inherit;}
        .dh-more:hover{border-color:var(--accent);background:var(--surface);box-shadow:0 4px 13px rgba(20,22,28,0.26);}
        @media(max-width:860px){.dh-more{display:none;}}
        /* The phone "show all / show fewer" toggle under the board. Hidden
           everywhere but phones; see the 640px block for the reveal + the cut. */
        .dh-mall{display:none;width:100%;margin-top:8px;align-items:center;justify-content:center;gap:6px;background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:11px 14px;font-family:inherit;font-size:12.5px;font-weight:800;letter-spacing:-.1px;color:var(--accent);cursor:pointer;}
        .dh-mall:active{background:#eef1f6;border-color:var(--accent);}
        /* Tile icon art is normalised to a dark-on-transparent set so it reads on the
       white tile with no plate. warmer, carve and suds resisted the recolour, so
       those three PNGs carry a baked navy plate instead (owner 2026-07-29). */
        .dh-tile{container-type:inline-size;position:relative;overflow:hidden;background:var(--white);border:1.5px solid var(--border);border-radius:11px;padding:10px 8px 9px;text-align:center;cursor:pointer;text-decoration:none;color:var(--ink);transition:transform .12s,filter .12s,box-shadow .12s;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:0;font-family:inherit;min-height:118px;}
        .dh-tile:hover{transform:translateY(-2px);background:#f7f9fc;box-shadow:0 5px 14px rgba(20,22,28,0.12);}
        .dh-tile.sel{border-color:var(--gold-ink);box-shadow:0 0 0 2px var(--gold);}
        .dh-tile.inprog{background:#fffaeb;}
        /* A finished tile reads green (owner, 2026-07-31): the completed games
           sink to the end of the board, so the block of green is the day's
           progress read at a glance. It is also the only tile that opens the
           panel, hence the CTA line where its icon and chip used to be. The
           green is a FAINT wash with dark-green ink, not a solid fill: a solid
           #166534 tile shipped first and read far too heavy against the white
           board (owner, 2026-07-31). Keep any future change on the pale side. */
        .dh-tile.done{background:#dcfce7;border-color:#16a34a;color:#14532d;}
        .dh-tile.done:hover{background:#cdf5dc;}
        .dh-tile.done .dh-tnm{color:#14532d;}
        .dh-tile.done .dh-msc{color:var(--success-deep);}
        .dh-tile.done .dh-mstrk{color:#8a5300;}
        .dh-tile.done .dh-mstrk.none{color:#5d7a68;}
        .dh-tile.done .dh-mlead{color:#2f4a3a;}
        .dh-tile.done .dh-mlead svg{color:var(--gold-ink);}
        .dh-tile.done .dh-nolead{color:#5d7a68;}
        /* Replaces the icon + category chip on a finished tile. Wraps to two
           lines on a narrow tile, which is exactly the room those two freed. */
        .dh-tcta{margin:6px 2px 0;font-family:'DM Mono',ui-monospace,monospace;font-size:8.5px;line-height:1.35;letter-spacing:.05em;text-transform:uppercase;color:var(--success-deep);max-width:100%;}
        /* The play target on an unfinished tile: a real link stretched over the
           whole face, so the tile is one click from the game and still supports
           middle-click / open in new tab. It sits ABOVE the tile's own spans
           (which are decorative) and BELOW the stats button. */
        .dh-tfill{position:absolute;inset:0;z-index:2;border-radius:10px;text-decoration:none;}
        .dh-tile:focus-within{outline:2px solid var(--blue);outline-offset:1px;}
        /* Stats + archive, for a game you have not finished. Bottom-right
           rather than top-right: the top corners already carry the play count
           and the status dot, and a button up there would run
           under the centred game name on a six-across tile. .dh-mlead pads
           EQUALLY on both sides (owner, 2026-07-31): a right-only pad cleared
           the button but pushed the leader name visibly off centre, so the
           name now sits dead centre and simply ellipsizes 16px earlier. */
        .dh-tstats{position:absolute;right:3px;bottom:4px;z-index:3;width:17px;height:17px;padding:0;display:flex;align-items:center;justify-content:center;border:1px solid #d5dce6;border-radius:5px;background:var(--white);color:#6b7686;cursor:pointer;font-family:inherit;transition:color .12s,background .12s,border-color .12s;}
        .dh-tstats:hover{color:var(--accent);background:#eef1f6;border-color:var(--accent);}
        /* Pin control / pinned indicator. BOTTOM-LEFT, mirroring the stats
           glyph at bottom-right (owner, 2026-08-02). It sat top-right at first,
           which forced the centred game name to pad right and knocked it off
           centre; the bottom corners are the tile's control row and .dh-mlead
           already reserves 16px on both sides for exactly this. Unpinned it is
           a quiet outline that fills gold on hover, so it reads as an
           affordance without competing with the game art. .ind is the static
           span a finished tile shows, which has no hit area of its own. */
        .dh-tfav{position:absolute;left:3px;bottom:4px;z-index:3;width:17px;height:17px;padding:0;display:flex;align-items:center;justify-content:center;border:0;border-radius:5px;background:transparent;color:#798393;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent;transition:color .12s,background .12s,transform .12s;}
        /* Hover is gated on a real pointer. A TAP applies :hover on a phone and
           the browser keeps it painted until you tap somewhere else, so
           star-then-unstar left a faint gold block sitting behind the star
           (owner, 2026-08-02). Same reason the tap highlight is cleared above. */
        @media(hover:hover){
          .dh-tfav:hover{color:var(--gold-ink);background:#fdf4dc;transform:scale(1.12);}
          .dh-tfav:disabled:hover{color:#798393;background:transparent;transform:none;}
        }
        .dh-tfav.on{color:var(--gold-ink);}
        .dh-tfav:disabled{cursor:default;opacity:.35;}
        .dh-tfav.ind{pointer-events:none;color:var(--gold-ink);}
        .dh-tile.done .dh-tfav.ind{color:var(--success-deep);}
        .dh-tfav:focus-visible{outline:2px solid var(--blue);outline-offset:1px;}
        /* A FINISHED tile has no stats glyph, so .dh-mlead there is unpadded and
           a long leader name would run under the star. Pad it only when a star
           is actually drawn (.pinned), so an unpinned tile keeps its leader
           line perfectly centred. Unfinished tiles already carry symmetric
           16px via the .dh-mlead rule below. */
        .dh-tile.done.pinned .dh-mlead{padding-left:16px;}
        .dh-tile:not(.done) .dh-mlead{padding:0 16px;}
        .dh-acc{position:absolute;top:0;left:0;right:0;height:3px;border-radius:12px 12px 0 0;opacity:.95;}
        .dh-tile.done .dh-acc{background:#22c55e !important;}
        .dh-tic{width:46px;height:30px;display:flex;align-items:center;justify-content:center;flex:none;margin:5px 0 6px;}
        .dh-tic img{height:24px;width:auto;max-width:30px;object-fit:contain;}
        .dh-tnm{font-size:15px;font-weight:800;letter-spacing:-.3px;line-height:1.34;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
        .dh-tcat{margin-top:3px;font-family:'DM Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.09em;text-transform:uppercase;border-radius:999px;padding:1px 6px;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
        .dh-tmeta{display:flex;flex-direction:column;align-items:center;gap:2px;width:100%;min-width:0;margin-top:auto;}
        .dh-mrow{display:flex;align-items:center;justify-content:center;flex-wrap:nowrap;gap:6px;max-width:100%;}
        .dh-nolead{color:#49525f;font-weight:600;}
        .dh-msc{display:inline-flex;align-items:center;gap:3px;font-size:9.5px;font-weight:800;color:#116932;flex:none;}
        .dh-mstrk{display:inline-flex;align-items:center;gap:2px;font-size:9.5px;font-weight:800;color:#8a5300;flex:none;}
        .dh-mstrk.none{color:#4d5872;}
        .dh-mlead{display:flex;align-items:center;justify-content:center;gap:3px;font-size:9.5px;font-weight:700;color:var(--muted);min-width:0;max-width:100%;width:100%;}
        .dh-mlead svg{flex:none;color:var(--gold-ink);}
        .dh-mlead span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .dh-tdot{position:absolute;top:8px;right:9px;width:7px;height:7px;border-radius:50%;}
        /* Top-left corner row: today's play count. It sits opposite
           .dh-tdot and clears the centred game name on a 123px tile. */
        .dh-tcorner{position:absolute;top:7px;left:6px;display:flex;align-items:center;gap:4px;max-width:calc(100% - 22px);pointer-events:none;}
        /* The player glyph STACKS UNDER the number rather than sitting beside it
           (owner, 2026-08-02). Side by side it cost ~34px of the tile's top
           edge, which ran under the longest centred names on a six-across
           board, so a @container (max-width:117px) rule hid the glyph and the
           number was left unlabelled on every desktop tile (content box 105px).
           Stacked, the badge is only as wide as the number itself, 12px, so the
           glyph is free: measured on the live board it clears the longest name
           (Outrank) by 14px and the category chip below it by 5px vertically.
           column-reverse keeps the DOM order glyph-then-number, so the number
           still reads first to a screen reader while rendering on top. */
        .dh-tplays{display:inline-flex;flex-direction:column-reverse;align-items:center;gap:1px;font-size:9.5px;font-weight:800;line-height:1;color:#4d5872;font-variant-numeric:tabular-nums;flex:none;}
        .dh-tplays svg{flex:none;opacity:.85;}
        /* ── expand panel (navy, full width) ── */
        /* ── overall daily leaderboard (toggled) ── */
        .dh-lbpanel{background:var(--white);border:1.5px solid var(--border);;border:1px solid #e8c46a;border-radius:12px;padding:16px 16px 14px;margin-bottom:12px;color:var(--ink);}
        .dsd-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;}
        .dsd-l{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-ink);font-weight:800;}
        .dsd-r{font-size:10.5px;color:var(--muted);font-weight:600;}
        .dsd-grid{display:grid;grid-template-columns:320px 1fr;gap:18px;align-items:start;}
        @media(max-width:900px){.dsd-grid{grid-template-columns:1fr;}}
        .dsd-sub{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:800;margin-bottom:8px;}
        .dsd-cols{display:grid;grid-template-columns:24px 1fr 46px 60px;gap:8px;padding:0 11px 6px;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}
        .dsd-row{display:grid;grid-template-columns:24px 1fr 46px 60px;gap:8px;align-items:center;padding:8px 11px;margin-bottom:5px;border-radius:10px;background:#fdf3dd;border:1px solid #fdf3dd;}
        .dsd-row.plain{background:var(--surface);border-color:var(--muted);}
        .dsd-row.me{background:#fdf3dd;border-color:#8a5300;}
        .dsd-rk{font-weight:800;font-size:15px;color:#8a5300;font-variant-numeric:tabular-nums;}
        .dsd-row.plain .dsd-rk{color:var(--muted);}
        .dsd-pn{font-size:13.5px;font-weight:500;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .dsd-pn b{color:var(--gold-ink);font-weight:700;}
        .dsd-g{font-size:12px;color:var(--muted);text-align:right;font-variant-numeric:tabular-nums;font-weight:600;}
        .dsd-tt{font-size:13.5px;font-weight:800;color:#8a5300;text-align:right;font-variant-numeric:tabular-nums;}
        .dsd-tt s{font-size:10px;font-weight:600;color:var(--muted);text-decoration:none;}
        .dsd-empty{font-size:12.5px;color:var(--muted);font-weight:600;padding:8px 2px;}
        .dsd-row.first{background:#fdf3dd;border-color:#8a5300;}
        .dsd-row.first .dsd-rk{font-size:17px;color:#8a5300;}
        .dsd-row.first .dsd-pn{font-weight:800;font-size:14.5px;color:#8a5300;display:flex;align-items:center;gap:5px;}
        .dsd-row.first .dsd-cr{color:var(--gold-ink);flex:none;}
        .dsd-row.first .dsd-tt{font-size:15px;}
        .dsd-past{margin-top:20px;padding-top:16px;border-top:1px solid #eef0f4;}
        .dsd-yest{display:flex;align-items:center;gap:7px;margin-top:6px;padding:7px 11px;border-radius:10px;background:var(--surface);border:1px solid #eef0f4;}
        .dsd-yest.top{padding:9px 11px;background:var(--surface);border-color:var(--muted);}
        .dsd-yest .yl{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:800;flex:none;min-width:56px;}
        .dsd-yest b{min-width:0;font-size:12px;color:#c9d6ee;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .dsd-yest.top b{font-size:13px;color:var(--ink);font-weight:700;}
        .dsd-yest .yt{margin-left:auto;flex:none;font-size:11.5px;font-weight:700;color:#d8c489;font-variant-numeric:tabular-nums;}
        .dsd-yest.top .yt{font-size:12.5px;font-weight:800;color:#8a5300;}
        .dsd-yest .yt s{font-size:9.5px;font-weight:600;color:var(--muted);text-decoration:none;}
        .dsd-yest .ynone{font-size:12px;color:var(--muted);font-weight:600;}
        .dsd-hof{display:flex;align-items:center;gap:6px;padding:9px 11px;border-radius:10px;background:#fdf3dd;border:1px solid #e8c46a;color:#8a5300;font-size:12px;font-weight:800;text-decoration:none;transition:background .12s;}
        .dsd-hof:hover{background:#fdf3dd;}
        .dsd-hof svg{color:var(--gold-ink);flex:none;}
        .dsd-players{margin-top:9px;font-size:11.5px;color:var(--muted);font-weight:600;}
        .dsd-players b{color:var(--ink);font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;}
        .dsd-players s{color:var(--muted);text-decoration:none;font-size:10.5px;}
        .dsd-gt{font-size:11px;font-weight:800;margin-bottom:7px;display:flex;justify-content:space-between;align-items:baseline;text-decoration:none;}
        .dsd-gt span{font-size:9px;color:var(--muted);font-weight:600;}
        .dsd-minis{display:grid;grid-template-columns:repeat(5,1fr);gap:9px;}
        @media(max-width:1200px){.dsd-minis{grid-template-columns:repeat(4,1fr);}}
        @media(max-width:900px){.dsd-minis{grid-template-columns:repeat(2,1fr);}}
        .dsd-mini{background:var(--surface);border:1px solid #eef0f4;border-radius:11px;padding:10px 11px;}
        .dsd-mr{display:flex;gap:6px;align-items:baseline;font-size:11.5px;padding:2px 0;}
        .dsd-k{width:11px;font-weight:800;color:#8a5300;font-variant-numeric:tabular-nums;flex:0 0 auto;}
        .dsd-n2{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink);font-weight:500;}
        .dsd-n2 b{color:var(--gold-ink);font-weight:700;}
        .dsd-p{color:var(--muted);font-variant-numeric:tabular-nums;font-weight:600;font-size:10.5px;}
        .dsd-none{color:var(--muted);font-size:10.5px;padding:2px 0;}
        /* ── responsive ── */
        /* ── slate layout ──────────────────────────────────────────────
           A real table of rows, not the tile card reflowed: the tile's parts are
           absolutely positioned corner furniture and a finished tile swaps its
           category chip for a CTA line, so columns could never line up. This is
           its own markup (renderSlate) over the SAME data and the same pick(),
           and the per-game panel opens as a drawer under its own row. */
        /* NO HAIRLINE UNDER THE BOARD (owner, 2026-08-12). The wrapper's 1.5px
           bottom border drew a light line between the pinned Complete today
           band and the ground behind the console, so the green stopped a pixel
           short of the navy instead of running into it. Taking it off also
           makes the wrapper's inner radius equal its outer one, which is why
           the port below rounds at 13 and not 12. */
        .dh-boardwrap.slate{padding:0;border-bottom:none;}
        .dh-boardwrap.slate.open{min-height:0;}
        /* --dh-fit is measured (see the fit effect); the calc is only the value
           before the first measurement lands. min-height stays BELOW the
           measured floor so the measurement, not this rule, is what governs. */
        /* THE PORT ROUNDS ITS OWN BOTTOM CORNERS (owner, 2026-08-12). The card
           edge is .dh-boardwrap's 13px radius, but the SCROLLER is three
           elements deep inside it (.dh-vpwrap > .dh-vp > .dh-board) and its
           overflow clips to a SQUARE box, so whatever sat at the foot of the
           scroll painted square corners over that radius: the pinned Complete
           today band, or the last row once the group is open. Rounding the
           scroller itself is what clips them, since overflow-y:auto already
           makes this the clipping box. Putting overflow:hidden on the wrapper
           instead would ALSO clip the expanded .dtp panel, which fills .dhome.
           13px, matching the wrapper exactly: the wrapper's bottom border is
           gone (see .dh-boardwrap.slate above), so there is no border to inset
           the inner radius from. Squared again below 900px, where the wrapper
           goes full bleed and square itself. */
        .dh-board.slate{display:block;grid-template-columns:none;grid-auto-rows:auto;height:var(--dh-fit,calc(100vh - 300px));min-height:240px;overflow-y:auto;border-radius:0 0 13px 13px;scrollbar-width:thin;scrollbar-color:#d3d9e2 transparent;}
        .dh-board.slate::-webkit-scrollbar{width:6px;}
        .dh-board.slate::-webkit-scrollbar-track{background:transparent;}
        .dh-board.slate::-webkit-scrollbar-thumb{background:#dfe4ec;border-radius:3px;}
        .dh-board.slate:hover::-webkit-scrollbar-thumb{background:#c9d1dd;}
        /* The scrollbar gutter beside the pinned band stack, filled in that
           band's own colour so the cap runs the full width of the card and
           rounds into the corner (owner, 2026-08-14; the reasoning and the
           measurement are on the paint effect). Sized and painted entirely by
           --cf-w / --cf-h / --cf-bg, which the effect writes and zeroes, so
           this rule governs whether it may show at all. No colour is named
           here on purpose: --cf-bg is a hard-stop gradient built from the
           pinned bands' own computed backgrounds, one segment each, so a band
           colour has exactly one home. */
        .dh-capfill{position:absolute;right:0;bottom:0;width:var(--cf-w,0px);height:var(--cf-h,0px);background:var(--cf-bg,transparent);border-bottom-right-radius:13px;pointer-events:none;}
        /* Up next and Easiest leaderboard are a matched pair on the slate: two
           equal cells, same eyebrow, same button (owner, 2026-08-03). On a phone
           they stop being cells and become two full-width bars, one under the
           other, the way the mockup has them. */
        .dhome.slate .dh-cell{flex:1 1 50%;}
        .dhome.slate .dh-cell .dh-play{width:112px;}
        /* Desktop slate cap (owner, 2026-08-04): the phone's solid slabs, run
           side by side. The white bar carried five competing accents at once
           (two blue eyebrows, two blue button fills, a grey icon plate and a
           divider rule), so nothing led the eye. Each half now takes its own
           tone off the brand ramp, deep navy on the left and blue on the
           right, with white type and a white button: MORE pop from LESS colour
           variety. The phone block below (<=900px) keeps its own tones and its
           stacking, and is untouched. */
        @media(min-width:901px){
          /* A GRID, not a two-cell flex row (owner, 2026-08-08): the paused
             games are cards in this cap now, so it holds 2 + n cards two to a
             row rather than exactly two halves.
             border:none, not just border-bottom: the bar's 1.5px grey SIDE
             borders were the slight indentation against the title band above,
             whose own border is the colour of its fill and so reaches the
             console edge. Both bands now start on the same pixel. */
          .dhome.slate .dh-sbar{display:grid;grid-template-columns:1fr 1fr;align-items:stretch;padding:0;gap:0;background:transparent;border:none;}
          .dhome.slate .dh-cell{position:relative;padding:14px 16px 14px 26px;background:#1a2e61;color:var(--white);min-width:0;}
          /* Cards are addressed by CLASS now: the adjacent-sibling rule
             used to mean "the Easiest half", and with paused cards in the same
             bar it would mean every card but the first. */
          .dhome.slate .dh-cell + .dh-cell{padding-left:26px;border-left:none;}
          .dhome.slate .dh-cell.easy{background:var(--blue-deep);}
          /* a white rule replaces the game icon, which is unreadable at 32px on
             a saturated ground */
          .dhome.slate .dh-cell > img{display:none;}
          .dhome.slate .dh-cell::before{content:'';position:absolute;left:13px;top:14px;bottom:14px;width:4px;border-radius:2px;background:rgba(255,255,255,.9);}
          .dhome.slate .dh-bue,.dhome.slate .dh-bue.up{color:var(--blue-200);font-size:9.5px;letter-spacing:.11em;}
          /* line-height 1.3 + a pixel of pad, NOT the shared 1.1: these lines
             are overflow:hidden for the ellipsis, so a 1.1 box clips the
             descender off a g/p/y in a game name or its tagline. */
          .dhome.slate .dh-bun{color:var(--white);font-size:20px;line-height:1.3;padding-bottom:1px;}
          .dhome.slate .dh-busub{display:block;color:var(--blue-200);font-weight:600;line-height:1.35;padding-bottom:1px;}
          .dhome.slate .dh-cell .dh-play{margin-left:auto;background:var(--white);color:var(--blue-deep);width:104px;min-width:0;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:11px 0;border-radius:8px;}
          .dhome.slate .dh-cell .dh-play:hover{background:var(--blue-200);}
          /* EVERY card's button is the same box, whatever the card says (owner,
             2026-08-08). A width alone left it a flexible item, so a long name
             or a long sub line squeezed its own control by a pixel or two and
             the two halves came out visibly unequal. A fixed basis cannot. */
          .dhome.slate .dh-cell .dh-play{flex:0 0 104px;box-sizing:border-box;}
          /* Paused cards: the cap's shape, in the gold the slate has always used
             for a game you have started. Hairlines between them, since two gold
             cards side by side have no colour change to divide them. */
          .dhome.slate .dh-cell.prog{background:var(--gold);color:#2a1f04;text-decoration:none;border-bottom:1px solid rgba(20,22,28,.12);}
          .dhome.slate .dh-cell.prog.capL,.dhome.slate .dh-cell.failc.capL{border-right:1px solid rgba(20,22,28,.12);}
          .dhome.slate .dh-cell.prog:hover{background:#e0a92c;}
          .dhome.slate .dh-cell.prog::before{background:rgba(42,31,4,.55);}
          .dhome.slate .dh-cell.prog .dh-bue{color:#7a5a10;}
          .dhome.slate .dh-cell.prog .dh-bun{color:#2a1f04;}
          .dhome.slate .dh-cell.prog .dh-busub{color:#6b5210;}
          .dhome.slate .dh-cell.prog .dh-play{background:var(--white);color:#8a5306;}
          .dhome.slate .dh-cell.prog:hover .dh-play{background:var(--white);}
          .dhome.slate .dh-cell.failc.capw{grid-column:1/-1;}
          .dhome.slate .dh-cell.prog.capw{grid-column:1/-1;border-right:none;}
          /* Familiar favorite and New to you: the third and fourth tones of the
             cap's blue ramp (owner, 2026-08-09). Hairlines above them the way
             the gold cards carry them, since two blues of one family sitting in
             the same row need a divider where the first two tones, far enough
             apart to divide themselves, do not. */
          .dhome.slate .dh-cell.fav{background:#3b6fd4;text-decoration:none;border-top:1px solid rgba(255,255,255,.18);}
          .dhome.slate .dh-cell.fresh{background:#0f1d3e;text-decoration:none;border-top:1px solid rgba(255,255,255,.18);}
          .dhome.slate .dh-cell.crowd{background:#245edf;text-decoration:none;border-top:1px solid rgba(255,255,255,.18);}
          /* The incomplete card carries the Incomplete today band's red, so the
             cap and the group below it read as the same thing said twice. */
          .dhome.slate .dh-cell.failc{background:#dc2626;text-decoration:none;border-top:1px solid rgba(255,255,255,.18);}
          .dhome.slate .dh-cell.failc:hover{background:#e33f3f;}
          .dhome.slate .dh-cell.failc .dh-play{color:#b91c1c;}
          .dhome.slate .dh-cell.failc.capw{grid-column:1/-1;}
          .dhome.slate .dh-cell.crowd:hover{background:#3170ec;}
          .dhome.slate .dh-cell.crowd.capw{grid-column:1/-1;}
          .dhome.slate .dh-cell.fav:hover{background:#4a7ce0;}
          .dhome.slate .dh-cell.fresh:hover{background:#12244c;}
          .dhome.slate .dh-cell.fav.capw,.dhome.slate .dh-cell.fresh.capw{grid-column:1/-1;}
          /* Open: a scroller that borrows Ready to play's space instead of
             pushing the console past the fold. The ceiling is --cap-pmax,
             measured in the fit effect; the vh fallback only ever applies for
             the frame before that runs. Gold thumb on a gold ground, kept thin,
             so the scroller reads as a hint that there is more rather than as a
             piece of furniture. */
          .dhome.slate .dh-cprog.open{display:grid;grid-column:1/-1;grid-template-columns:1fr 1fr;align-items:stretch;min-width:0;
            max-height:var(--cap-pmax,46vh);overflow-y:auto;overscroll-behavior:contain;
            scrollbar-width:thin;scrollbar-color:#bb9226 transparent;}
          .dhome.slate .dh-cprog.open::-webkit-scrollbar{width:9px;}
          .dhome.slate .dh-cprog.open::-webkit-scrollbar-track{background:transparent;}
          .dhome.slate .dh-cprog.open::-webkit-scrollbar-thumb{background:rgba(42,31,4,.3);border-radius:5px;border:2px solid transparent;background-clip:content-box;}
          .dhome.slate .dh-cprog.open::-webkit-scrollbar-thumb:hover{background:rgba(42,31,4,.45);background-clip:content-box;}
          /* The desktop cut: four cards, two rows of two. */
          .dh-cell.cap-hd{display:none;}
          /* With exactly four paused games desktop shows them all, so its bar
             has nothing to say; the phone, showing three, still needs one. */
          .dh-cmore.mo{display:none;}
        }
        /* The Incomplete card's dismiss X. BASE SCOPE, NEVER inside a width
           query (owner, 2026-08-09): these rules used to live in the
           @media(min-width:901px) block above, so below 901px the button got no
           styling at all and fell back to a raw native control, a grey #f0f0f0
           chip with a 2px outset border, black icon, sitting STATIC in the
           card's flex row beside Retry rather than in its corner, which also ate
           the sub line's width. The card's top-right corner is free at both
           widths, so one rule serves both and there is nothing width-specific
           left to say. */
        .dh-cx{position:absolute;top:4px;right:5px;z-index:2;width:21px;height:21px;padding:0;
          display:flex;align-items:center;justify-content:center;border:0;border-radius:6px;
          background:transparent;color:rgba(255,255,255,.72);cursor:pointer;font-family:inherit;
          -webkit-tap-highlight-color:transparent;transition:background .12s,color .12s;}
        /* HOVER STAYS BEHIND @media(hover:hover), the file's own rule: at base
           scope a tap would otherwise leave the lit state stuck on the button. */
        @media(hover:hover){
          .dh-cx:hover{background:rgba(255,255,255,.2);color:var(--white);}
        }
        .dh-cx:focus{outline:none;}
        .dh-cx:focus-visible{outline:2px solid var(--white);outline-offset:-2px;}
        /* 21px is fine under a cursor and small under a thumb, so on a touch
           pointer the HIT BOX grows to 34 while the DRAWING stays 21: an
           ::after overlay centred on the button, which cannot move the icon or
           the corner it sits in the way a width change would. */
        @media(pointer:coarse){
          .dh-cx::after{content:'';position:absolute;top:50%;left:50%;width:34px;height:34px;
            transform:translate(-50%,-50%);}
        }
        @media(max-width:900px){
          /* edge to edge. Negative margins, NOT the 50%/translateX trick: a
             transform makes the console a containing block and kills the sticky
             strip bar and column header inside it. */
          .dhome.slate{margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);width:auto;max-width:none;border-radius:0;box-shadow:none;}
          .dhome.slate .sl-bar{border-left:none;border-right:none;border-radius:0;border-top:none;margin-top:0;}
          .dhome.slate .dh-boardwrap{border-left:none;border-right:none;border-radius:0;}
          .dhome.slate .dh-board.slate{border-radius:0;}
          /* Full bleed and square here, so the gutter fill squares with it. It
             normally has nothing to do at this width (a phone scrollbar is an
             overlay and reserves no gutter, which measures as zero and hides
             it); it earns its keep on a narrow DESKTOP window, where the
             scrollbar is classic and the gutter is real. */
          .dhome.slate .dh-capfill{border-radius:0;}
          /* THE PHONE ORDER MATCHES THE DESKTOP ONE (owner, 2026-08-09): the
             slate's title band leads, the hero cards sit under the band that
             names them, then the category strip, then the board. The cap used to
             carry order:-1 and lead the whole page, which put four cards above
             any label saying what they were. Source order is already title, cap,
             strip, board, so DROPPING the order off the cap is the entire
             change; the board keeps order:1 so it always lands last whatever
             else is added above it. */
          .dhome.slate .dh-sbar{flex-direction:column;align-items:stretch;gap:0;padding:0;background:transparent;border:none;}
          .dhome.slate .sl-bar{order:0;}
          .dhome.slate .dh-boardwrap{order:1;}
          .dhome.slate .dh-cell > img{display:none !important;}
          .dhome.slate .dh-cell{position:relative;flex:none;width:100%;padding:13px 14px 13px 22px;border:none;border-radius:0;background:var(--blue);color:var(--white);}
          .dhome.slate .dh-cell + .dh-cell{padding-left:22px;border-left:none;}
          .dhome.slate .dh-cell.easy{background:#4d84f3;}
          /* a white rule replaces the game icon, which is unreadable at this
             size on a saturated ground */
          .dhome.slate .dh-cell::before{content:'';position:absolute;left:10px;top:12px;bottom:12px;width:4px;border-radius:2px;background:rgba(255,255,255,.9);}
          .dhome.slate .dh-bue{color:#dbe8ff;font-size:9.5px;letter-spacing:.11em;}
          .dhome.slate .dh-bun{color:var(--white);font-size:19px;line-height:1.3;padding-bottom:1px;}
          .dhome.slate .dh-busub{display:block;color:#dbe8ff;font-weight:600;line-height:1.35;padding-bottom:1px;}
          .dhome.slate .dh-cell .dh-play{margin-left:auto;background:var(--white);color:var(--blue-deep);width:98px;min-width:0;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:10px 0;border-radius:8px;flex:0 0 98px;box-sizing:border-box;}
          /* Paused cards, stacked with the other two and inked gold. */
          .dhome.slate .dh-cell.prog{background:var(--gold);color:#2a1f04;text-decoration:none;border-bottom:1px solid rgba(20,22,28,.12);}
          .dhome.slate .dh-cell.prog::before{background:rgba(42,31,4,.55);}
          .dhome.slate .dh-cell.prog .dh-bue{color:#7a5a10;}
          .dhome.slate .dh-cell.prog .dh-bun{color:#2a1f04;}
          .dhome.slate .dh-cell.prog .dh-busub{color:#6b5210;}
          .dhome.slate .dh-cell.prog .dh-play{background:var(--white);color:#8a5306;}
          /* The other two cap cards, stacked with the rest. Same two tones the
             desktop cap uses, so the ramp reads the same at both widths. */
          .dhome.slate .dh-cell.fav{background:#3b6fd4;text-decoration:none;}
          .dhome.slate .dh-cell.fresh{background:#0f1d3e;text-decoration:none;}
          .dhome.slate .dh-cell.crowd{background:#245edf;text-decoration:none;}
          .dhome.slate .dh-cell.failc{background:#dc2626;text-decoration:none;}
          .dhome.slate .dh-cell.failc .dh-play{color:#b91c1c;}
          /* The phone cut. */
          .dh-cell.cap-hm{display:none;}
        }
        /* 43px, matched to the rails' panel headers so the Up next bar below
           starts on the same line as each rail's first band (owner,
           2026-08-08). 43 rather than 42 because a rail panel has a 1px border
           ABOVE its header and this bar does not, and border-box so this bar's
           own 1.5px top border is counted inside the number. Moving .hr-ph's
           min-height in HomeRails.jsx means moving this one too. */
        .sl-bar{display:flex;align-items:center;gap:9px;padding:9px 13px;min-height:43px;box-sizing:border-box;background:var(--accent);border:1.5px solid var(--accent);border-bottom:none;border-radius:13px 13px 0 0;}
        .dhome.slate .dh-sbar{border-radius:0;border-top:none;}
        .dhome.slate .dh-boardwrap{border-left:none;border-right:none;}
        .dhome.slate{border-radius:13px;box-shadow:0 1px 2px rgba(16,24,40,.06),0 8px 20px -12px rgba(16,24,40,.28);}
        /* The bar has FOUR flex children: the title, the ready pip, the pip
           group and the date, placed by the order property. Desktop reads
           title / ready / the rest / date, one continuous run. A phone reorders
           it to title / ready / date on the first line and hands the remaining
           pips a line of their own, which is what holds the header to two lines
           while every pip keeps its word.
           The right-grouping lives on the TITLE's margin rather than on any one
           of the three that follow it, because which of those exist depends on
           the day: an auto margin on two of them would split the free space. */
        .sl-ttl{font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--white);order:1;margin-right:auto;}
        .sl-ptodo{order:2;}
        .sl-count{order:3;display:flex;align-items:center;gap:6px;}
        /* The four state counts. Each pip is a coloured dot, the number, and the
           word — and the WORD is the part that carries it on a wide viewport,
           because the phone bands that teach these colours are display:none
           above 900px, so up here a bare dot would mean nothing. Below 900px the
           bands are on screen, so the word comes off and the dot reads against
           them. Dot colours are the bands' hues lifted for the navy ground:
           #1a2e61 and #16a34a are legible on white and invisible on this bar. */
        /* Typography sits on the PIP, not on .sl-count, since the ready pip
           lives outside that group and has to look identical to the ones in it. */
        .sl-pip{display:inline-flex;align-items:center;gap:5px;font-style:normal;padding:2px 8px 2px 6px;border-radius:999px;background:rgba(255,255,255,0.11);font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--blue-200);white-space:nowrap;}
        .sl-pip b{font-weight:800;color:var(--white);font-variant-numeric:tabular-nums;}
        .sl-pw,.sl-ps{font-style:normal;font-weight:700;letter-spacing:.07em;color:var(--blue-200);}
        .sl-ps{display:none;}
        .sl-pd{width:7px;height:7px;border-radius:50%;flex:none;background:currentColor;}
        .sl-pip.todo{color:#8fb4ff;}
        .sl-pip.prog{color:var(--gold);}
        .sl-pip.fail{color:#f87171;}
        .sl-pip.dn{color:#4ade80;}
        .sl-dt{order:4;font-style:normal;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--blue-200);white-space:nowrap;}
        .sl-dt i{font-style:normal;}
        .sl-dt .p{display:none;}
        /* The category strip and the expand bars were var(--surface) between two
           1px --border rules, which is the page's own background between two
           hairlines: at the console's edge they dissolved into it (owner,
           2026-08-08). Each takes the deeper --surface-alt fill and a darker
           rule top AND bottom now, so it reads as a band across the console
           rather than a gap in it. */
        /* THE STRIP SCROLLS, AND SAYS SO (owner, 2026-08-10). Its scrollbar is
           hidden, which on a desktop left the last tab sliced by the console
           edge with no way to reach it and no sign there was more. The wrapper
           is the positioning context for one chevron chip per overflowing edge;
           .ml / .mr are set from the measured scroll, so nothing renders at all
           when the tabs already fit.
           The fade is a pseudo-element on the WRAPPER rather than a border on
           the strip, so it sits above the tabs and below the chip and no tab
           appears to run under the chevron. Its colour has to be quoted per
           breakpoint because the strip is --accent on a desktop and #1a2e61 on
           a phone. */
        .sl-filtw{position:relative;flex:none;}
        .sl-filt{flex:none;display:flex;background:var(--accent);border-top:1.5px solid #0f1d3e;border-bottom:2px solid #0f1d3e;overflow-x:auto;scrollbar-width:none;scroll-behavior:smooth;}
        .sl-filt::-webkit-scrollbar{display:none;}
        /* Room for the last tab to clear the chip once it is scrolled to. */
        .sl-filtw.mr .sl-filt{padding-right:26px;}
        .sl-filtw.ml .sl-filt{padding-left:26px;}
        /* The fade holds SOLID under the chip before it starts fading, rather
           than fading the whole way from the edge. A plain gradient left the
           sliced last tab showing through at about a third strength, so the
           strip read "SU" with a button sitting on it, which looks broken
           rather than scrollable. Solid to just past the chip, then out. */
        .sl-filtw.ml::before,.sl-filtw.mr::after{content:'';position:absolute;top:0;bottom:2px;width:60px;pointer-events:none;z-index:1;}
        .sl-filtw.ml::before{left:0;background:linear-gradient(to right,var(--accent) 0,var(--accent) 30px,rgba(35,58,99,0) 100%);}
        .sl-filtw.mr::after{right:0;background:linear-gradient(to left,var(--accent) 0,var(--accent) 30px,rgba(35,58,99,0) 100%);}
        .sl-fnav{position:absolute;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:50%;border:0;padding:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.18);color:var(--white);cursor:pointer;z-index:2;-webkit-tap-highlight-color:transparent;}
        .sl-fnav:hover{background:rgba(255,255,255,0.34);}
        .sl-fnav:focus{outline:none;}
        .sl-fnav:focus-visible{outline:2px solid var(--white);outline-offset:1px;}
        .sl-fnav.l{left:4px;}
        .sl-fnav.r{right:4px;}
        .sl-filt button{border:0;border-radius:0;background:transparent;font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#b9cbec;padding:9px 13px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;white-space:nowrap;}
        .sl-filt button:hover{color:var(--white);}
        /* Still an UNDERLINE, not a pill: navy simply changed what colour the
           tab and its rule have to be. -2px above pulls the rule down onto the
           strip's own 2px bottom border so the two read as one edge. */
        .sl-filt button.on{color:var(--white);border-bottom-color:var(--white);background:transparent;}
        /* The state chips carry a dot beside their label, so they lay out as a
           flex row at EVERY width. This rule used to live in the phone block
           alone, because above 900px the same declarations reached them through
           .dhome.cats .sl-filt button. */
        .sl-filt .sl-fs{display:inline-flex;align-items:center;gap:6px;}
        .sl-head,.sl-row{display:grid;grid-template-columns:44px minmax(0,1fr) 74px 72px 64px 132px 88px 112px;align-items:center;gap:10px;padding:6px 14px;}
        .sl-head{background:var(--surface);border-bottom:1px solid var(--border);box-shadow:0 1px 0 var(--border);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--slate);font-weight:800;position:sticky;top:0;z-index:3;}
        /* Pinnable board: one 26px star column at the far left, 36px including
           its gap, taken back out of Category (-4), Players (-4), Streak (-6),
           Leader (-14) and Archive (-8). The 1fr name column is deliberately
           untouched, so adding the star costs the row nothing. */
        .dh-board.pins .sl-head,.dh-board.pins .sl-row{grid-template-columns:26px 44px minmax(0,1fr) 70px 68px 58px 118px 88px 104px;}
        .sl-fav{display:flex;align-items:center;justify-content:center;}
        .sl-favb{width:24px;height:24px;padding:0;display:flex;align-items:center;justify-content:center;border:0;border-radius:6px;background:transparent;color:#c3c8d1;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent;transition:color .12s,background .12s,transform .12s;}
        /* HOVER STAYS BEHIND @media(hover:hover). A tap applies :hover on a
           phone and the browser keeps painting it until you tap elsewhere, so
           an unstar left the gold #fdf4dc block sitting behind the star (owner,
           2026-08-07). Same rule the retired tile star carried; any new
           row-level control needs it too. */
        @media(hover:hover){
          .sl-favb:hover{color:var(--gold-ink);background:#fdf4dc;transform:scale(1.12);}
          .sl-favb:disabled:hover{color:#c3c8d1;background:transparent;transform:none;}
        }
        .sl-favb.on{color:var(--gold-ink);}
        .sl-favb:disabled{cursor:default;opacity:.3;}
        .sl-favb:focus-visible{outline:2px solid var(--blue);outline-offset:1px;}
        .sl-head .r,.sl-row .r{text-align:right;}
        .sl-head .c{display:flex;align-items:center;justify-content:center;text-align:center;}
        .sl-sort{display:inline-flex;align-items:center;gap:4px;border:0;border-radius:0;background:transparent;padding:0;font:inherit;color:inherit;letter-spacing:inherit;text-transform:inherit;cursor:pointer;white-space:nowrap;}
        .sl-sort svg{opacity:0;transition:opacity .12s;flex:none;}
        .sl-sort:hover{color:var(--accent);}
        .sl-sort:hover svg{opacity:.45;}
        .sl-sort.on{color:var(--blue-deep);}
        .sl-sort.on svg{opacity:1;}
        .sl-row{border-bottom:1px solid #f0f2f6;font-size:13px;}
        .sl-row:hover{background:var(--surface);}
        .sl-row.done{background:#f6fbf8;}
        /* Incomplete today: the red twin of the green finished row, and the same
           faint wash rather than a fill, so a screen of them still reads as a
           list. The Play chip is the one thing that separates it from a
           complete row at a glance, which is the point of the group. */
        .sl-row.fail{background:#fef4f3;}
        /* The Sundays tab's own row: a plain white row like Ready to play's,
           since nothing about today applies to it. */
        .sl-row.sun{background:var(--white);text-decoration:none;color:var(--ink);}
        .sl-row.sun:hover{background:var(--surface);}
        /* The line under the strip that says what the tab is showing. Full
           width in both grids, and quiet: it explains, it does not announce. */
        .sl-note{grid-column:1/-1;padding:10px 14px;font-size:12px;line-height:1.5;
          color:var(--muted);background:var(--surface);border-bottom:1px solid var(--border);}
        .sl-note.dim{color:var(--slate);background:var(--white);}
        .sl-row.inprog{background:#fffaeb;}
        .sl-row.open{background:var(--accent-soft);}
        /* An OPEN row keeps its STATE colour (owner, 2026-08-07). .open sits
           last in this list, so opening a paused or finished row repainted it
           blue and threw away the amber or green that says what the row IS.
           Open now DEEPENS the state tint instead of replacing it, and the left
           rule was already immune. Applies at every width: the same swap was
           happening on the desktop slate. */
        .sl-row.inprog.open{background:#fdf3d6;}
        .sl-row.done.open{background:#e6f6ee;}
        .sl-row.fail.open{background:#fde9e7;}
        .sl-ic{display:flex;align-items:center;justify-content:center;height:34px;background:var(--surface-alt);border-radius:8px;}
        .sl-ic img{height:24px;width:auto;max-width:30px;object-fit:contain;}
        .sl-nm{min-width:0;text-decoration:none;color:var(--ink);display:block;}
        /* padding-bottom + an equal negative margin so descenders clear the clip box
           without the line-height, and therefore every row's height, changing.
           The two media-query overrides below only restate font-size and
           line-height, so they inherit this and need no copy of it. */
        .sl-nm b{display:block;font-size:15px;font-weight:800;letter-spacing:-.3px;line-height:1.15;padding-bottom:3px;margin-bottom:-3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sl-nm .sl-sub{display:block;font-size:11.5px;color:var(--slate);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sl-cm{display:none;}
        /* The tagline's wrapper. Desktop renders it as the plain inline text it
           has always been; only the phone makes it a shrinking flex item. */
        .sl-tg{font-style:normal;}
        /* Phone-only play count, inside the name line. Currently unused: the
           count went back to the .sl-pl figure at the row's right edge on
           2026-08-07. Kept because it has been swapped once already. */
        .sl-npl{display:none;font-style:normal;}
        /* Separator between the tagline and the leader chip; phone only. */
        .sl-dot{display:none;font-style:normal;}
        .sl-mld{display:none;font-style:normal;}
        .sl-cat{display:flex;justify-content:center;}
        .sl-cat > span{display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:3px 6px;border-radius:5px;max-width:100%;overflow:hidden;white-space:nowrap;}
        .sl-pl{font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;text-align:center;color:var(--muted);}
        /* The Players cell now wraps its number in <b> and carries an <i> label
           for the phone figure. Both are neutralised here so the DESKTOP column
           renders the same bare centred number it always did. */
        .sl-pl b{font-weight:inherit;font-size:inherit;}
        .sl-pl i{display:none;}
        /* Group bands and their expand bars. Phone-only furniture: both are in
           the DOM at every width and only the <=900px block gives them a box,
           an order, and (for .sl-hid) any effect at all. */
        .sl-band{display:none;}
        /* A band that is also its group's toggle. It keeps every band rule (the
           selector is the same class); this only undoes the UA button styling
           and adds the chevron. */
        /* border-radius:0 is NOT redundant: globals.css rounds every button to
           8px, so the Done today band shipped with rounded corners in a stack
           of square ones (owner, 2026-08-08). Any future full-width band or
           bar built out of a <button> needs the same reset. */
        button.sl-band{width:100%;border:0;border-radius:0;font:inherit;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;}
        button.sl-band:hover{filter:brightness(1.14);}
        .sl-bch{flex:none;color:var(--white);opacity:.8;margin-left:1px;}
        .sl-more{display:none;}
        .sl-more:focus,button.sl-band:focus{outline:none;}
        .sl-more:focus-visible,button.sl-band:focus-visible{outline:2px solid var(--blue);outline-offset:-2px;}
        .sl-st{font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;color:#a16207;display:flex;align-items:center;justify-content:center;gap:2px;}
        .sl-st.none{color:#c3c8d1;}
        .sl-ld{display:flex;align-items:center;justify-content:center;gap:4px;font-size:11.5px;color:var(--muted);min-width:0;}
        .sl-ld svg{flex:none;color:var(--gold-ink);}
        .sl-ld span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .sl-nl{color:#8a93a3;}
        .sl-status{display:flex;justify-content:center;}
        .sl-btn{display:inline-flex;align-items:center;justify-content:center;width:70px;padding:6px 0;border-radius:7px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;border:1px solid var(--accent-border);background:var(--accent-soft);color:var(--blue-deep);cursor:pointer;font-family:inherit;}
        .sl-btn.play:hover{background:var(--blue);border-color:var(--blue);color:var(--white);}
        /* A CONTROL NOW, NOT A LABEL (owner, 2026-08-16): the score chip opens
           the stats and archive drawer, since the row around it goes to the
           game. cursor:default read as inert. The hover is a deepening rather
           than the full invert Play and Retry take, because it opens a panel in
           place instead of leaving the page. */
        .sl-btn.done{border-color:#cfeadd;background:#f1faf5;color:var(--success-deep);}
        .sl-btn.done:hover{background:#dcf2e6;border-color:#a9d9c2;}
        .sl-btn.fail{border-color:#f6c9c4;background:#fdeceb;color:#b91c1c;}
        .sl-btn.fail:hover{background:#dc2626;border-color:#dc2626;color:var(--white);}
        .sl-btn.prog{border-color:#f0d79a;background:#fdf2df;color:#a16207;}
        .sl-arch{display:flex;justify-content:center;}
        .sl-rz{display:none;font-style:normal;}
        .sl-ab{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--accent-border);background:var(--white);color:var(--blue-deep);border-radius:7px;padding:5px 9px;font-family:inherit;font-size:10.5px;font-weight:800;letter-spacing:.04em;cursor:pointer;white-space:nowrap;}
        .sl-ab:hover{background:var(--accent-soft);}
        .sl-ab.on{background:var(--blue);border-color:var(--blue);color:var(--white);}
        .sl-ab svg{flex:none;transition:transform .15s;}
        .sl-ab.on svg{transform:rotate(180deg);}
        .sl-ring{width:19px;height:19px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;}
        .sl-ring i{width:13px;height:13px;border-radius:50%;background:var(--white);display:block;}
        .sl-ab.on .sl-ring i{background:var(--blue);}
        .sl-drawer{border-bottom:1px solid var(--border);background:#fbfcfe;}
        /* ── desktop slate: the phone's grouping and its three-track row, in
           TWO columns (owner, 2026-08-08) ─────────────────────────────────
           The console keeps the height cap and the inner scroller it already
           had; two columns of a shorter row simply mean it holds roughly twice
           as many games before you reach for the scrollbar, so the panel is
           full rather than a tall thin ribbon.
           Nothing here is a second implementation of the row: the bands, the
           category eyebrow, the leader on the sub line and the stacked crowd
           figure are the same elements the phone renders, restated for this
           width. The two media queries are mutually exclusive, so the phone
           block below is untouched and neither can leak into the other.
           What leaves the row: the star, the Category, Streak, Leader and
           Archive columns, and the column header (and with it desktop column
           sorting, which the filter strip and the grouping now cover). Each was
           saying something the band above the group, the eyebrow beside the
           name or the sub line says already. Play fades in over the crowd
           figure on hover, so a mouse still starts a game in one click without
           forty blue buttons sitting on the page; where there is no hover,
           Play leads the drawer exactly as it does on a phone. */
        @media(min-width:901px){
          .dh-board.slate{display:grid;grid-template-columns:1fr 1fr;align-content:start;gap:0;
            background:linear-gradient(to right,transparent calc(50% - .5px),#eef0f4 calc(50% - .5px),#eef0f4 calc(50% + .5px),transparent calc(50% + .5px));}
          .dh-board.slate .sl-head{display:none;}
          /* Bands and the open drawer are the only full-width items. A band is
             sticky inside the scroll port, so the group you are reading always
             names itself. */
          /* A BAND IS ALWAYS VISIBLE, at whichever edge it belongs to (owner,
             2026-08-12). top:0 alone only pinned a band once you had scrolled
             PAST it, so Complete today, the last group in the flow, sat about
             1,370px down a 472px port: the group you most often want was the
             one you had to go looking for. Each band now carries a sticky TOP
             offset of the bands above it and a sticky BOTTOM offset of the
             bands below it, so passed groups stack at the top of the port and
             coming groups stack at the bottom, every one of them legible and
             clickable. --bi (this band's index) and --bn (how many bands
             rendered) come from renderSlate, so the offsets shrink to fit the
             day. --bh is the band's own height; keep the two in step if the
             padding or type size here changes. */
          .sl-band{display:flex;align-items:center;gap:9px;padding:8px 14px;background:#1a2e61;grid-column:1/-1;order:4;
            --bh:30px;position:sticky;top:calc(var(--bi,0) * var(--bh));bottom:calc((var(--bn,1) - 1 - var(--bi,0)) * var(--bh));z-index:3;}
          .sl-band .sl-bt{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--white);}
          .sl-band .sl-bc{margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--blue-200);font-variant-numeric:tabular-nums;}
          /* In progress: the gold the slate has always used for a game you have
             started, and dark ink on it, since white on gold does not read. */
          .sl-band.prog{order:6;background:var(--gold);}
          .sl-band.prog .sl-bt{color:#2a1f04;}
          .sl-band.prog .sl-bc{color:#7a5a10;}
          .sl-band.prog .sl-bch{color:#2a1f04;opacity:.75;}
          .sl-band.fail{order:8;background:#dc2626;}
          .sl-band.fail .sl-bc{color:#ffe0dd;}
          .sl-band.dn{order:11;background:var(--success-deep);}
          .sl-drawer{grid-column:1/-1;}
          /* THE OPEN PANEL TAKES THE WHOLE CONSOLE, not just the board (owner,
             2026-08-12). .dtp is position:absolute;inset:0 and overflow:hidden,
             so it fills its nearest POSITIONED ancestor and clips whatever does
             not fit. On the slate that ancestor was .dh-vp, the board window,
             whose height is the measured --dh-fit: the panel is taller than
             that at every desktop size, so the foot of the record chart was cut
             off with no way to scroll to it. Making the three board wrappers
             static hands the panel .dhome instead, which is the SAME box the
             TILE board's panel has always filled (one expanded console, one
             Play button, owner 2026-07-29), and adds the title band, the cap
             and the filter strip to its height. All three are positioned only
             for tile-board furniture, the .dh-vp.on translateY window and the
             .dh-more pager, and both of those are gated on !slate in the JSX,
             so neither exists at this width. overflow:auto is the backstop for
             a short viewport, where even the whole console may not be enough:
             the panel scrolls itself rather than losing its bottom. */
          .dhome.slate .dh-boardwrap,.dhome.slate .dh-vpwrap,.dhome.slate .dh-vp{position:static;}
          /* ROUNDED ON ALL FOUR CORNERS (owner, 2026-08-12), reversing the
             square top this rule shipped with earlier the same day. The
             reasoning behind the square top was that a radius made the panel
             read as a card floating INSIDE the console; that held while the
             console's own top band was still visible above it. It is not: the
             panel fills .dhome outright, so those two corners are the console's
             own top edge sitting against the ground, and square is what reads
             as a break in the card there. 13px matches .dh-sbar's top radius
             and .dh-boardwrap's bottom one, which are the edges it replaces.
             Desktop only: this whole block is min-width:901px, and below that
             the console is full bleed and square anyway. */
          .dhome.slate .sl-drawer .dtp{border-radius:13px;overflow:auto;}
          /* ...and the three columns take the height that came with it. The
             grid is flex:none by default, sized to the board window it used to
             live in, so against the taller console it left ~150px of white
             under the archive calendar. Growing it stretches the record chart
             and the standings, which is where the extra room is worth having. */
          .dhome.slate .sl-drawer .dtp .dtp-grid{flex:1 1 auto;min-height:0;}
          /* Same order scheme the phone uses, since grid honours it too: a row
             and its own drawer carry the same value and equal-order items keep
             source order, so a drawer never leaves its row. */
          .sl-row,.sl-drawer{order:5;}
          /* Paused rows sink to the FOOT of Ready to play (owner, 2026-08-08),
             above the group's bar and below every untouched row. */
          .sl-row.inprog,.sl-drawer.inprog{order:7;}
          .sl-row.fail,.sl-drawer.fail{order:9;}
          .sl-more.fail{order:10;}
          .sl-row.done,.sl-drawer.done{order:12;}
          /* THREE tracks: emblem, name, crowd size. Pins add no track, the same
             call the phone made: the star left the row and the pin control is
             the chip at the top of the drawer. */
          .dh-board.slate .sl-row,.dh-board.pins .sl-row{grid-template-columns:30px minmax(0,1fr) auto;gap:11px;padding:7px 14px;position:relative;cursor:pointer;box-shadow:inset 4px 0 0 var(--rc,#475b78);}
          .sl-fav,.sl-cat,.sl-st,.sl-ld,.sl-arch,.sl-npl{display:none;}
          .sl-row.inprog{box-shadow:inset 4px 0 0 var(--gold);}
          .sl-row.done{box-shadow:inset 4px 0 0 #16a34a;}
          .sl-row.fail{box-shadow:inset 4px 0 0 #dc2626;}
          .sl-ic{order:1;height:30px;background:transparent;border-radius:0;}
          .sl-ic img{height:26px;max-width:30px;}
          .sl-nm{order:2;display:flex;flex-direction:row;flex-wrap:wrap;align-items:baseline;column-gap:7px;}
          .sl-nm b{order:1;min-width:0;display:block;font-size:15px;line-height:1.2;}
          .sl-cm{order:2;flex:none;display:block;font-size:8.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;line-height:1.2;margin:0;}
          .sl-nm .sl-sub{order:3;flex:1 1 100%;min-width:0;display:flex;align-items:baseline;font-size:11px;line-height:1.35;margin-top:1px;}
          .sl-tg{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
          .sl-dot{display:inline;flex:none;margin:0 5px;color:#c3c8d1;}
          .sl-mld{flex:none;display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:var(--muted);max-width:10vw;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
          .sl-mld svg{flex:none;color:var(--gold-ink);}
          .sl-pl{order:3;display:block;text-align:right;line-height:1;min-width:38px;}
          .sl-pl b{display:block;font-size:13px;font-weight:800;color:var(--ink);}
          .sl-pl i{display:block;font-style:normal;font-size:8px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--slate);margin-top:3px;}
          /* EVERY STATE ROW CARRIES THE CROWD SIZE, AND EVERY CHIP WAITS FOR A
             HOVER (owner, 2026-08-12). The count used to belong to Ready to play
             alone: a finished row hid it behind a permanent score chip, an
             incomplete one behind Retry, and a paused one behind Resume. So the
             one column the slate reads down, "how many people are on this
             today", had holes in it wherever you had actually played, which is
             exactly where you are most likely to be looking. The figure is the
             resting state on all four groups now and the chip is what the hover
             swaps in, which is the model Ready to play already used. The score
             is not lost: it is the chip, one hover away, and it is also the
             first thing in the row's drawer. */
          /* An invisible button still takes clicks, so a chip is inert until it
             is actually showing. */
          .sl-status{position:absolute;right:13px;top:50%;transform:translateY(-50%);z-index:2;opacity:0;pointer-events:none;}
          /* DONE TODAY IS SHUT AT THIS WIDTH TOO (owner, 2026-08-08). Its band
             is the toggle, so the rows it hides have to actually hide here as
             well; until now sl-hid only meant anything below 900px and the
             desktop band's chevron did nothing. Scoped to done, because the
             same class also marks the Ready-to-play rows outside the PHONE's
             six-row budget, and desktop deliberately lists every one of those.
             Three classes, because the base sl-row display:grid rule sits later
             in this stylesheet and would otherwise win. */
          /* In progress and Incomplete today joined it 2026-08-12, when their
             bands became expanders too. Still NOT a bare .sl-hid: the same
             class marks the Ready-to-play rows outside the PHONE's six-row
             budget, and desktop deliberately lists every one of those. */
          .dh-board.slate .sl-row.done.sl-hid,.dh-board.slate .sl-drawer.done.sl-hid,
          .dh-board.slate .sl-row.inprog.sl-hid,.dh-board.slate .sl-drawer.inprog.sl-hid,
          .dh-board.slate .sl-row.fail.sl-hid,.dh-board.slate .sl-drawer.fail.sl-hid{display:none;}
          /* Each width prints its own count on the CAP's expand bar (the board's
             own bar is phone-only now, so this pair serves the cap alone). */
          .sl-mtxt.p{display:none;}
          /* A PAUSED GAME IS A FAINTLY SHADED ROW (owner, 2026-08-08). It spent
             one deploy as a cap-shaped gold card at the top of the slate, which
             is the shape the CAP already uses for the same games directly above
             the board: the same card twice on one screen, and a row that shouted
             where the group it sits in is a quiet list. It keeps the ordinary
             row's shape and columns now, and says what it is with the base
             amber ground and the gold left rule instead. Its Resume chip WAITED
             on no hover until 2026-08-12, when the owner put the crowd size back
             on every state row: the chip is now the hover state here too, like
             Play, Retry and the score chip. The gold rule and ground are what
             say the game is paused, and they need no hover to be read. */
          /* The Sunday Editions tab is a plain list of links rather than the
             state slate, so its rows keep a permanent chip: there is no count to
             give way to and nothing about them to hover for. */
          .sl-row.sun .sl-status{opacity:1;pointer-events:auto;}
          /* The chip reads RESUME here rather than a bare triangle, so it sits
             in the same 64px shape as the Play chip on every row above it. */
          .sl-row.inprog .sl-rz{display:inline;}
          .sl-row.inprog .sl-btn.prog svg{display:none;}
          .sl-btn{width:64px;}
        }
        @media(min-width:901px) and (hover:hover){
          /* No :not(.done) any more: a finished row trades its count for its
             score chip on hover exactly like every other row trades it for
             Play, Retry or Resume. */
          .sl-row:hover .sl-status{opacity:1;pointer-events:auto;}
          .sl-row:hover .sl-pl{opacity:0;pointer-events:none;}
        }
        /* ── phone slate: direction B (owner-approved 2026-08-07) ──────────
           Replaces the 2026-08-03 phone row (icon plate, category beside the
           name, play count in the subtitle, status button on the right edge).
           Everything below the two blue cap bars is rebuilt out of the four
           moves those bars already make: a solid ground, a 4px left rule where
           the icon used to be, a small uppercase eyebrow over a big name, and
           one control on the right edge. Rows group under solid state bands.
           NOTHING in here escapes the media query: the desktop slate keeps its
           icon plate, its eight sortable columns and its centred cells. */
        @media(max-width:900px){
          /* flex, so the bands and rows can be ordered into their groups.
             gap:0 IS LOAD-BEARING: the tile board sets gap:7px on .dh-board in
             the 640px block, and as a flex container the slate inherited it as a
             7px white band between every row (owner, 2026-08-07). The slate's
             rows separate with their own 1px bottom border and nothing else. */
          .dh-board.slate{height:auto;max-height:none;min-height:0;overflow:visible;display:flex;flex-direction:column;gap:0;}
          .sl-head{display:none;}
          /* Ordered slots, one group per band: Ready to play is 4 (band), 5
             (untouched rows), 6 (paused rows) and 7 (its expand bar); Done
             today is 8 (band) and 9 (rows), shut from its own band. A drawer
             shares its row's value, and equal-order items keep source order, so
             a drawer stays under its own row. */
          .sl-band{display:flex;align-items:center;gap:9px;padding:9px 13px;background:#1a2e61;order:4;}
          .sl-band .sl-bt{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--white);}
          .sl-band .sl-bc{margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--blue-200);font-variant-numeric:tabular-nums;}
          /* In progress: the gold the slate has always used for a game you have
             started, and dark ink on it, since white on gold does not read. */
          .sl-band.prog{order:6;background:var(--gold);}
          .sl-band.prog .sl-bt{color:#2a1f04;}
          .sl-band.prog .sl-bc{color:#7a5a10;}
          .sl-band.prog .sl-bch{color:#2a1f04;opacity:.75;}
          .sl-band.fail{order:8;background:#dc2626;}
          .sl-band.fail .sl-bc{color:#ffe0dd;}
          .sl-band.dn{order:11;background:var(--success-deep);}
          .sl-row,.sl-drawer{order:5;}
          .sl-row.inprog,.sl-drawer.inprog{order:7;}
          .sl-row.fail,.sl-drawer.fail{order:9;}
          .sl-row.done,.sl-drawer.done{order:12;}
          /* The rows a group is not peeking. Nothing else may set display on a
             .sl-row inside the slate without excluding this class, or the row
             comes back: see the :not(.sl-hid) on the .mcut rule in the 640px
             block, which is more specific AND later in source. */
          .sl-hid{display:none;}
          /* The expand bar: one full-width rectangle at the foot of its group,
             inked to its group's colour so the pair reads as one block. */
          .sl-more{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;
            padding:5px 13px;border:0;border-radius:0;border-top:2px solid #c2ccdc;border-bottom:2px solid #c2ccdc;background:#e8edf5;
            font-family:inherit;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
            line-height:1.5;color:var(--blue-deep);cursor:pointer;}
          .sl-more:active{background:#dde5f0;}
          /* READY TO PLAY'S BAR SITS AT THE FOOT OF THE WHOLE BOARD (owner,
             2026-08-09), below Complete today rather than between the groups.
             It was breaking the run of coloured bands in half: three bands that
             belong together, with a grey strip driven through the middle of
             them. At 13 it lands after every band and row (todo 4-6, incomplete
             8-10, complete 11-12), so the board ends on it and the rails start
             directly under. Incomplete's own bar keeps its place inside its
             group, since it is tinted to that group and reads as part of it. */
          .sl-more.todo{order:13;}
          /* The phone bar, tinted to its own band rather than the shared grey. */
          .sl-more.fail{order:10;border-top-color:#f3c2bd;border-bottom-color:#f3c2bd;background:#fdeceb;color:#b91c1c;}
          .sl-more.fail:active{background:#fbdedb;}
          .sl-mtxt.d{display:none;}
          /* THREE tracks: name, count, icon (owner, 2026-08-07, against a
             reference image). The row used to carry a star, a tile plate, the
             name, a Play button and a chevron, five things competing with the
             one that matters, on a 390px line. Everything that was a control
             has left: the WHOLE ROW expands the drawer, Play now lives at the
             top of that drawer with the other chips, and the pin lives there
             too. What is left is the name with room to breathe, the crowd size,
             and the game's own emblem on the right edge where the button was.
             a11y: with the chevron gone the row's focusable child is the name
             link, and activating it expands rather than navigating (the row's
             onClick preventDefaults). */
          .sl-row{grid-template-columns:minmax(0,1fr) auto 40px;gap:11px;padding:9px 13px 9px 16px;cursor:pointer;box-shadow:inset 4px 0 0 var(--rc,#475b78);}
          .sl-row.inprog{box-shadow:inset 4px 0 0 var(--gold);}
          .sl-row.done{box-shadow:inset 4px 0 0 #16a34a;}
          .sl-row.fail{box-shadow:inset 4px 0 0 #dc2626;}
          /* Pins no longer add a track: the star is one of the things that left
             the row, and the pin control is the full-width chip at the top of
             the drawer. Same grid either way. */
          .dh-board.pins .sl-row{grid-template-columns:minmax(0,1fr) auto 40px;gap:11px;padding:9px 13px 9px 16px;}
          .sl-fav,.sl-cat,.sl-st,.sl-ld,.sl-status,.sl-arch,.sl-npl{display:none;}
          /* Grid honours the order property, so the icon moves to the far right
             without the JSX changing: name, count, icon. */
          .sl-nm{order:1;}
          .sl-pl{order:2;}
          .sl-ic{order:3;}
          /* No plate on the icon here. At the right edge a filled, rounded box
             reads as the button that used to be there; bare art reads as the
             game's emblem. */
          .sl-ic{height:40px;background:transparent;border-radius:0;}
          .sl-ic img{height:34px;max-width:40px;}
          /* The crowd size goes BACK to a stacked right-edge figure. It rode
             inside the name line while the row still had a button and a chevron
             to make room for; with both gone the figure is the clearer read and
             the name keeps its own line. */
          .sl-pl{display:block;text-align:right;line-height:1;}
          .sl-pl b{display:block;font-size:13px;font-weight:800;color:var(--ink);}
          .sl-pl i{display:block;font-style:normal;font-size:8.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--slate);margin-top:3px;}
          .sl-dot{display:inline;flex:none;margin:0 5px;color:#c3c8d1;}
          /* No archive chevron on a phone any more: the whole row opens the
             drawer, so a control that does the same thing is just clutter. The
             .sl-ab rules stay for the desktop button's benefit only. */
          /* TITLE FIRST, category small to its right (owner, 2026-08-07). The
             category had a line of its own above the name; on its own line a
             three-word tagline underneath, it was a third line of type competing
             with the title for the row. Beside the title it is a footnote, the
             title gets 18px, and the row comes out SHORTER than the stacked
             version despite the bigger name.
             Row flex + wrap rather than a JSX change: the DOM order is category,
             name, sub, so the order property puts the name first and a 100% basis on the
             sub line breaks it onto its own line. Baselines align, so the tiny
             caps sit on the title's baseline. */
          .sl-nm{display:flex;flex-direction:row;flex-wrap:wrap;align-items:baseline;column-gap:7px;}
          .sl-nm b{order:1;min-width:0;display:block;font-size:18px;line-height:1.2;}
          .sl-cm{order:2;flex:none;display:block;font-size:8.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;line-height:1.2;margin:0;}
          /* The sub line is a flex row: the tagline shrinks and ellipsizes, the
             leader chip is flex:none, so the leader is never the thing that gets
             cut off. It still caps at 38vw and ellipsizes its own long names. */
          .sl-nm .sl-sub{order:3;flex:1 1 100%;min-width:0;display:flex;align-items:baseline;font-size:11.5px;line-height:1.4;margin-top:1px;}
          .sl-tg{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
          .sl-mld{flex:none;display:inline-flex;align-items:center;gap:3px;font-size:11.5px;font-weight:700;color:var(--muted);max-width:42vw;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
          .sl-mld svg{flex:none;color:var(--gold-ink);}
          .sl-btn{width:64px;}
          /* The category selector is a DARK strip of pills on a phone (owner,
             2026-08-07), so it belongs to the navy slate header above it rather
             than reading as a pale gap between the header and the first row.
             Desktop keeps its light underline tabs. */
          /* ONE LINE, AND THE TITLE PAYS FOR IT (owner, 2026-08-17). This bar
             used to WRAP on a phone: title / ready / date on line one, and the
             other three pips centred on a line of their own, because the title
             plus four worded pips did not fit a 390px viewport. What buys the
             width back is the DATE COMING OFF entirely. It was the least
             important thing here (it was already dropping to its short form,
             and then out under 400px), and the four state counts describe the
             day better than it did. What is left is one line, right-aligned
             against the title's auto margin.

             THE TITLE STAYS "Today's slate" IN FULL (owner, 2026-08-17). It was
             briefly shortened to "Today:" in the same pass; dropping the date
             turned out to free enough room without it, and measured on the live
             bar it does: 17px of slack at 390px and 6px at 375px, on a
             FOUR-state day, which is the worst case. See .sl-bar.four below,
             which is what makes the four-state case fit.

             The pips KEEP THEIR WORDS, which is the 2026-08-10 owner rule this
             preserves: four bare dots at the top of the page read as nothing.
             Under 372px the words do come off, since that is the width where
             something still has to give, and the dot plus number carries it
             against the bands below. */
          .sl-bar{flex-wrap:nowrap;gap:7px;}
          .sl-ttl{flex:none;white-space:nowrap;}
          .sl-ptodo{margin-left:0;}
          .sl-dt{display:none;}
          .sl-count{order:3;flex-wrap:nowrap;gap:7px;}
          /* No pill chrome: nothing sits beside a pip to be separated from any
             more, and dropping it plus a hair off the type is what fits four
             worded pips beside the title. */
          .sl-pip{flex:none;padding:0;background:none;gap:4px;font-size:10px;letter-spacing:.02em;}
          .sl-pw.alt{display:none;}
          .sl-ps{display:inline;}
          /* A FOUR-STATE DAY IS THE WORST CASE, and it is the only one that
             needs this. Three states and the full title fit at 375px with room
             over; add a fourth worded pip and the bar overflowed by 9px at
             390px and 24px at 375px, and since it no longer wraps that would
             CLIP rather than fall to a second line. So the four-state day, and
             only that day, takes a hair off the type and the gaps: measured
             after, 17px of slack at 390px and 6px at 375px, still one line.
             The class comes from dayTally's own length, so a day that gains or
             loses a state gets the right treatment with no other change. */
          .sl-bar.four{gap:6px;}
          .sl-bar.four .sl-count{gap:5px;}
          .sl-bar.four .sl-pip{font-size:9px;gap:3px;letter-spacing:0;}
          .sl-filt{background:#1a2e61;border-top:none;border-bottom:none;gap:6px;padding:7px 8px;}
          /* Same fade, the phone strip's own ground. The bottom is flush here
             because this strip carries no 2px bottom rule to sit above. */
          .sl-filtw.ml::before,.sl-filtw.mr::after{bottom:0;}
          .sl-filtw.ml::before{background:linear-gradient(to right,#1a2e61 0,#1a2e61 30px,rgba(44,79,168,0) 100%);}
          .sl-filtw.mr::after{background:linear-gradient(to left,#1a2e61 0,#1a2e61 30px,rgba(44,79,168,0) 100%);}
          .sl-filtw.mr .sl-filt{padding-right:30px;}
          .sl-filtw.ml .sl-filt{padding-left:30px;}
          .sl-filt button{flex:none;background:rgba(255,255,255,.12);color:#c3d5f4;border-radius:999px;padding:6px 12px;font-size:10.5px;letter-spacing:.09em;border-bottom:0;margin-bottom:0;}
          .sl-filt button.on{border-bottom-color:transparent;}
          .sl-filt button:hover{color:var(--white);}
          .sl-filt button.on{background:var(--white);color:var(--blue-deep);border-bottom-color:transparent;}
          /* ONE LONG FLICKABLE ROW (owner, 2026-08-17), and since 2026-08-24
             the desktop reads the same one. The circuits used to be a SECOND
             strip stacked under this one AND a duplicate copy of themselves at
             the tail of this one, with each breakpoint hiding the copy it did
             not want. On a phone two navy scrolling rows in the same shade never
             read as two questions, they read as one line overflowing. It is one
             list in source order now, states last, so nothing here reorders
             anything and there is no second copy to hide.

             NO CHEVRONS: a phone flicks. They are hidden rather than removed so
             the desktop affordance is unchanged, and the 30px padding they
             reserved comes back off the strip with them. */
          .sl-fnav{display:none;}
          .sl-filtw.mr .sl-filt{padding-right:8px;}
          .sl-filtw.ml .sl-filt{padding-left:8px;}
        }
        /* The width where the worded pips stop fitting beside the title. Placed
           AFTER the max-width:900px block on purpose: same specificity, so the
           later rule is the one that wins. */
        @media(max-width:372px){
          .sl-pw,.sl-ps{display:none;}
        }
        /* ── TABLET AND LANDSCAPE PHONE: THE PHONE SLATE, TWO ACROSS ──────────
           (owner, 2026-08-08.) From 641px there is room for two of everything,
           and one game per full-width row left 300px of empty middle on an iPad
           mini in portrait (744) or an iPhone in landscape (844).
           The ROW ITSELF is untouched: same three tracks, same 18px name, same
           whole-row-opens-the-drawer model, because this tier is a touch device
           either way and the desktop row's hover-to-reveal Play would be
           unreachable. Only the CONTAINERS become two-column grids. The bands,
           the expand bars and an open drawer still span both columns, and the
           phone's ordered slots keep working because grid honours the order
           property exactly as flex does.
           Below 641 nothing changes: there the second column would be 170px. */
        @media(min-width:641px) and (max-width:900px){
          /* The cap: Up next | Easiest leaderboard, then the paused cards two to
             a row. The two blue cards carry different tones so they need no
             divider; two gold cards side by side do. Odd children are always
             column one here, which is the same trick the desktop cap uses. */
          .dhome.slate .dh-sbar{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);}
          .dhome.slate .dh-cell{width:auto;}
          .dhome.slate .dh-cell.prog.capL,.dhome.slate .dh-cell.failc.capL{border-right:1px solid rgba(20,22,28,.12);}
          .dhome.slate .dh-cell.failc.capw{grid-column:1/-1;}
          .dhome.slate .dh-cell.prog.capw{grid-column:1/-1;}
          .dhome.slate .dh-cell.fav.capw,.dhome.slate .dh-cell.fresh.capw{grid-column:1/-1;}
          /* The board. The centre hairline is the same painted gradient the
             desktop slate uses, so a column with fewer rows than its neighbour
             still shows the split all the way down. */
          .dh-board.slate{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-content:start;
            background:linear-gradient(to right,transparent calc(50% - .5px),#eef0f4 calc(50% - .5px),#eef0f4 calc(50% + .5px),transparent calc(50% + .5px));}
          .sl-band,.sl-more,.sl-drawer{grid-column:1/-1;}
          /* 42vw of leader chip is most of a 364px track, and the tagline is the
             item that should be shrinking, not the thing after it. */
          .sl-mld{max-width:19vw;}
        }
        /* -- the STACKED tier, 901-1200px: the desktop slate, with the phone's
           peek (owner, 2026-08-08) --------------------------------------------
           NO BACKTICKS IN HERE. This whole stylesheet is one template literal,
           so a backtick around a class name CLOSES it: the comment naming
           '.qzh .dhx' below shipped a pair of them, and the parser read the rest
           as a member access on the string, which prerendered as "Cannot read
           properties of undefined (reading 'dhx')" and failed the build. Quote a
           selector with apostrophes, never backticks.
           The width band where '.qzh .dhx' has already dropped to two equal
           columns and put '.dhx-center' first, so the console is full width with
           the rails BELOW it. 46 rows of slate there is a screen and a half
           between the reader and the leaderboard.
           This keeps everything the min-width:901px block just built (the
           two-column grid, the three-track row, the bands, the whole-row drawer)
           and adds only the lid. Four rules, and nothing here is a second
           implementation of anything.
           This block must stay AFTER the 901px block and after the base .sl-more
           rule: it wins on source order, not specificity. */
        @media(min-width:901px) and (max-width:1200px){
          /* Height first. The desktop board is a fixed scroll port sized to the
             fold (--dh-fit); with only six rows peeking, that port would be
             mostly white. It scrolls with the page here, exactly as it does on a
             phone, and the fit effect leaves --dh-fit unset to match. */
          .dh-board.slate{height:auto;max-height:none;min-height:0;overflow:visible;}
          /* ...which also means there is no scroll port for a band to stick
             inside, and a sticky band would pin itself to the VIEWPORT and ride
             over the page. The band goes back to sitting on its group. */
          .sl-band{position:static;}
          /* The lid itself. Desktop scopes this to .done, because it lists every
             unfinished row; here every hidden row hides, paused ones included.
             Three classes because the base .sl-row display rule sits later in
             this stylesheet, the same reason the desktop rule carries them. */
          .dh-board.slate .sl-row.sl-hid,.dh-board.slate .sl-drawer.sl-hid{display:none;}
          /* ...and the way back out, which is dead (display:none) at every other
             width above 900px. Same bar the phone renders, spanning both
             columns, at the foot of Ready to play. */
          .sl-more{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;grid-column:1/-1;
            padding:5px 13px;border:0;border-radius:0;border-top:2px solid #c2ccdc;border-bottom:2px solid #c2ccdc;background:#e8edf5;
            font-family:inherit;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
            line-height:1.5;color:var(--blue-deep);cursor:pointer;}
          .sl-more:active{background:#dde5f0;}
          /* READY TO PLAY'S BAR SITS AT THE FOOT OF THE WHOLE BOARD (owner,
             2026-08-09), below Complete today rather than between the groups.
             It was breaking the run of coloured bands in half: three bands that
             belong together, with a grey strip driven through the middle of
             them. At 13 it lands after every band and row (todo 4-6, incomplete
             8-10, complete 11-12), so the board ends on it and the rails start
             directly under. Incomplete's own bar keeps its place inside its
             group, since it is tinted to that group and reads as part of it. */
          .sl-more.todo{order:13;}
          /* The phone bar, tinted to its own band rather than the shared grey. */
          .sl-more.fail{order:10;border-top-color:#f3c2bd;border-bottom-color:#f3c2bd;background:#fdeceb;color:#b91c1c;}
          .sl-more.fail:active{background:#fbdedb;}
          /* ...and no bounded paused block either, for the same reason: with the
             board flowing there is no fixed console height for it to fit inside,
             so the cards stack out in full exactly as they do on a phone. */
          .dhome.slate .dh-cprog.open{display:contents;}
        }
        @media(max-width:1080px){.dh-board{grid-template-columns:repeat(5,minmax(0,1fr));}}
        @media(max-width:940px){.dh-cell + .dh-cell{padding-left:10px;}}
        @media(max-width:860px){.dh-board{grid-template-columns:repeat(4,minmax(0,1fr));}.dh-boardwrap.open{min-height:560px;}}
        @media(max-width:640px){
          .dh-board{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;grid-auto-rows:minmax(122px,1fr);}
          /* Phones KEEP the game art (owner, 2026-07-30), reversing the 07-29
             decision to drop it: the tile is 26px taller instead, which is room
             for a smaller icon between the category chip and the day's leader. */
          .dh-tile{padding:9px 5px 8px;border-radius:10px;min-height:122px;}
          .dh-tic{display:flex;width:38px;height:26px;margin:4px 0 5px;}
          .dh-tic img{height:22px;max-width:26px;}
          .dh-tnm{font-size:14.5px;}
          .dh-tcat{font-size:8.5px;padding:1px 7px;margin-top:4px;}
          .dh-tmeta{gap:3px;}
          .dh-msc,.dh-mstrk,.dh-mlead{font-size:10px;}
          .dh-tcorner{top:6px;left:5px;gap:3px;}
          .dh-tplays{font-size:9px;}
          /* Eight tiles, then the toggle: exactly two rows at four across. The
             430px block below bumps it to nine, because eight across three
             columns leaves the bottom-right cell empty (owner, 2026-07-31). */
          .dh-board.mcut > .dh-tile:nth-child(n+9){display:none;}
          .dh-mall{display:flex;}
          /* the slate lists every game already, so it needs neither the row cut
             nor the show-all control */
          .dhome.slate .dh-mall{display:none;}
          /* :not(.sl-hid) is load-bearing. This rule undoes the tile board's
             eight-tile cut for slate rows, and it outranks .sl-hid on both
             specificity and source order, so without the guard every collapsed
             row reappears below 640px. */
          .dh-board.slate.mcut > .sl-row:not(.sl-hid){display:grid;}
        }
        @media(max-width:430px){
          .dh-board{grid-template-columns:repeat(3,minmax(0,1fr));}
          .dh-tnm{font-size:13px;}
          .dh-tcat{font-size:8px;}
          /* Three across, so the cut is NINE: three full rows with no hole in
             the corner. Same specificity as the rule above, later in source, so
             it simply re-shows the ninth tile. */
          .dh-board.mcut > .dh-tile:nth-child(9){display:flex;}
        }
        /* No tiny-screen date drop any more: the date shares the first line with
           the title and nothing else, so "Today's slate  Mon, Aug 10" fits at
           320px with room to spare, and the pips have their own row to wrap in.
           The 330px rule this replaces was solving a crowding problem that the
           reordering removed. */
        @media(max-width:720px){.dh-boardwrap.open{min-height:620px;}}
        /* Small screens: the expanded panel is IN FLOW (see DailyTilePanel), so
           the grid hides beneath it and the wrapper takes the panel's own
           height. No min-height floor, no overlay, no nested scroller: the page
           scrolls normally wherever you drag. */
        @media(max-width:980px){
          .dh-boardwrap.open{min-height:0;}
          .dhome.open:not(.slate):not(.cats) .dh-sbar{display:none;}
          .dhome.open:not(.slate):not(.cats) .dh-boardwrap{display:none;}
        }
        /* Phone cap (owner 2026-08-03). Both halves survive here, unlike the old
           bar where the Easiest CTA was hidden below 640px to make room for the
           stat row: with the stats gone there is room for two. Each half keeps
           50%, sheds its game icon and subtitle, and runs a compact Play button.
           .dh-sbar takes the grid's 10px side padding so the right button's edge
           lands exactly on the tile grid's. */
        @media(max-width:640px){
          .dh-sbar{padding-left:10px;padding-right:10px;gap:6px;}
          .dh-cell{gap:7px;}
          .dh-cell + .dh-cell{padding-left:8px;}
          .dh-cell>img{display:none;}
          .dh-busub{display:none;}
          /* Halving the bar leaves the right eyebrow ~63px (the Resume button
             takes 81 of the half's 160), where "EASIEST LEADERBOARD" clipped to
             "EASIEST LEAD...". Type size was not the binding constraint, so the
             LABEL shortens here instead: see .dh-bshort in the markup. */
          .dh-bue{font-size:7.5px;letter-spacing:.02em;}
          .dh-bwide{display:none;}
          .dh-bshort{display:inline;}
          .dh-bun{font-size:14px;}
          .dh-cell .dh-play{margin-left:auto;flex:0 0 auto;min-width:0;font-size:11.5px;padding:8px 10px;gap:4px;}
        }
        /* Under 375px the eyebrows clip first, so ease them down rather than let
           a game name wrap. */
        @media(max-width:374px){
          .dh-bue{font-size:7px;}
          .dh-bun{font-size:13px;}
          .dh-cell .dh-play{padding:8px 8px;font-size:11px;}
        }
        /* LANDSCAPE ON A TABLET (owner, 2026-08-08). The console's own furniture
           tightens so the eight lines the board now keeps (see LAND_LINES) land
           ABOVE the fold rather than an inch below it: on a 1024x768 iPad the
           title band, the two cap cards, the paused bar and the category strip
           spent 287px between the header and the first row, which is more than
           five of the lines they sit above. Nothing is hidden and nothing moves,
           each box is simply less padded and the cap's game names come down from
           20px to 17. LAST IN THIS SHEET on purpose: several of these selectors
           tie with the min-width:901px block above on specificity, so source
           order is what decides them.
           min-width:901px, because below it the cap is a stack of full-width
           bars and the board flows with the page: a landscape phone gets the
           header's own landscape treatment (QuizCommandHeader) and nothing
           here. pointer:coarse, never a height alone, so a short desktop window
           is untouched. */
        @media(min-width:901px) and (orientation:landscape) and (pointer:coarse) and (max-height:1100px){
          .dhome.slate .sl-bar{min-height:34px;padding:6px 13px;}
          .dhome.slate .dh-cell{padding:9px 14px 9px 24px;}
          .dhome.slate .dh-cell::before{top:9px;bottom:9px;}
          .dhome.slate .dh-bun{font-size:17px;}
          .dhome.slate .dh-cell .dh-play{padding:8px 0;}
          .dhome.slate .sl-filt button{padding:7px 13px;}
          .dhome.slate .dh-cmore{padding:4px 13px;}
        }























      /* ── HOME v3 category board (min-width:901px only) ───────────────────
         Everything is scoped to .dhome.cats, so the slate and the legacy tile
         board are untouched. Below 901px this block does not apply and the
         phone keeps the layout it ships with. NO BACKTICKS anywhere in here,
         comments included: the whole sheet is one template literal. */
      @media(min-width:901px){
        /* THE CONSOLE FILLS THE SCREEN (owner, 2026-08-15). It is a flex column
           pinned to the height its column hands it, the cap is fixed, and the
           board takes the rest and scrolls INSIDE itself, so opening a sixteen
           game category never grows the page. Same shape as the rail beside it,
           which is what makes the two columns end on one line. */
        .dhome.cats{display:flex;flex-direction:column;height:100%;min-height:0;}
        .dhome.cats .sl-bar{flex:none;}
        .dhome.cats .dh-sbar{flex:none;display:block;padding:0;gap:0;background:transparent;border:none;}
        /* THE WHOLE CHAIN HAS TO GROW, not just the ends. Between the board
           wrapper and the board sit .dh-vpwrap and .dh-vp, and .dh-vpwrap is a
           plain block at flex:0 0 auto, so it stopped the height dead and
           everything under it fell back to content size however many flex:1
           rules were on the board itself. Measured: wrapper 607, vpwrap 369.
           Every link in the chain is a growing flex column here. */
        .dhome.cats .dh-boardwrap{flex:1 1 auto;min-height:0;height:auto;overflow:hidden;display:flex;flex-direction:column;}
        .dhome.cats .dh-vpwrap,.dhome.cats .dh-vp{flex:1 1 auto;min-height:0;height:auto;display:flex;flex-direction:column;}
        /* LESS WHITE (owner, 2026-08-15: the face is still far too white). The
           board was a white sheet edge to edge with white tiles on it, which
           next to a navy header and a saturated cap read as glare rather than
           as paper. Everything steps one value down into the same blue family:
           the board ground goes blue-grey, the tiles a barely-tinted off-white,
           and the grid lines a blue-grey rather than neutral. White is kept for
           HOVER, so it now means "this one", which is what it should have been
           spending itself on all along. */
                /* THREE COLUMNS (owner, 2026-08-15). The one 340px rail replaced two
           rails totalling 584px, so the centre is about 240px wider than it was
           and a third column fits without squeezing the row. height:auto and
           the flex sizing because the console above hands this its height now,
           rather than --dh-fit measuring it independently. */
        .dhome.cats .dh-board.slate{grid-template-columns:1fr 1fr 1fr;flex:1 1 auto;min-height:0;height:auto;max-height:none;
          /* THE BOARD IS A SCROLLER, so it is 10px narrower INSIDE than out
             and two things drifted off it (owner, 2026-08-15: the three
             colored cards do not line up with the columns below them).
             stable so the reservation is CONSTANT rather than appearing
             with the 43rd row. The cap's own tracks are sized off the gutter
             this reserves (see capCols); the background-origin that goes with
             it is noted under the gradient below. */
          scrollbar-gutter:stable;
          background:linear-gradient(to right,
            transparent calc(33.333% - .5px),#eef0f4 calc(33.333% - .5px),#eef0f4 calc(33.333% + .5px),
            transparent calc(33.333% + .5px),transparent calc(66.667% - .5px),
            #eef0f4 calc(66.667% - .5px),#eef0f4 calc(66.667% + .5px),transparent calc(66.667% + .5px));
          /* AFTER the shorthand above, which resets it. The divider lines are
             percentages of the background positioning area, and on the default
             padding-box that area includes the scrollbar gutter: they landed at
             387.3px while the rows they divide broke at 384px, so the board
             disagreed with its own columns before the cap was ever involved. */
          background-origin:content-box;}
        /* ONE ROW, one line, scrolling on its own, with the chevrons at either
           end as the way a mouse reaches the rest. Wrapping was an earlier
           answer and it made a block of chips of indeterminate height that
           pushed the board around; a scroller is a fixed height whatever is in
           it. Two rows was the answer after that (owner, 2026-08-18) and it is
           gone too: see the strip's block comment at module scope.

           It has to be smaller than the strip's base size to manage it, since
           with the state chips, the categories, the circuits and Sundays there
           are about thirty chips in a 1180px console. */
        .dhome.cats .sl-filt{flex-wrap:nowrap;overflow-x:auto;}
        .dhome.cats .sl-filt button{font-size:10px;letter-spacing:.06em;padding:7px 11px;display:inline-flex;align-items:center;justify-content:center;gap:6px;flex:1 0 auto;}
        /* The same four colours the header pills use, so the strip and the
           header say the same thing the same way. */
        .sl-sdot{width:6px;height:6px;border-radius:50%;flex:none;display:block;}
        .sl-sdot.rdy{background:#9dbcf7;}
        .sl-sdot.prg{background:var(--gold);}
        .sl-sdot.fal{background:#f08a8a;}
        .sl-sdot.dne{background:#5ad48f;}
        /* ALL MEANS ALL (owner, 2026-08-15), and it is the default. The slate
           hides done rows behind a peek budget, which is right when the board
           is a to-do list and wrong when the strip has a Done chip of its own:
           the state chips are how you narrow now, so the unfiltered view stops
           narrowing anything. */
        .dhome.cats .dh-board .sl-row.sl-hid{display:grid !important;}
        /* Shut, the grid fits by construction and must not scroll. Open, the
           game list is as long as the category is and scrolling is the point. */
        .dhome.cats .dh-board.cb-open{overflow-y:auto;background:var(--white);}
        /* The override layer: the slate's own rows, bands, column header and
           chip strip are still in the DOM and still correct on a phone; up here
           they step aside for the tiles, and the four-card cap for the three. */
        .dhome.cats .sl-more{display:none !important;}
        .dhome.cats .dh-sbar > .dh-cell,.dhome.cats .dh-sbar > .dh-cprog{display:none !important;}

        /* THE CAP IS THE "WHAT SHOULD I PLAY" ZONE, six picks wide open and three
           once you have answered that yourself by choosing a category. Always
           three across, so six is two rows and the shrink is a row leaving
           rather than the cards resizing. */
        /* THE PANEL ABSORBS THE SLACK (owner, 2026-08-15). With the panel
           present the board stops growing and takes only what its rows need,
           and the panel grows into the rest, so the console still fills the
           screen exactly as it was built to and no white is left under either.
           A first attempt shrank the BOARD instead and did nothing, because the
           height comes down a chain of flex:1 1 auto from a console pinned to
           the viewport: the board was never the thing setting it. */
        .dhome.cats .dh-boardwrap.cb-fitted .dh-vpwrap{flex:0 0 auto;}
        /* The wrapper clips (overflow:hidden for its rounded bottom), so a panel
           a few pixels taller than the console lost the bottom of its own blue
           bar silently. Measured: Word Building overflowed by 9px. */
        .dhome.cats .dh-boardwrap.cb-fitted{overflow-y:auto;}
        /* The fill panel. A full-width item at the foot of the two-column
           board grid, so it sits under both columns however many rows the
           group has, and last whatever order the rows and bands carry. */
        /* NATURAL HEIGHT, NOT STRETCHED (owner, 2026-08-15: "horrible use of
           space"). Stretching the panel over the pinned console did not fill it,
           it just moved the emptiness inside the columns and left 300px of blank
           bordered box. Every block here is per-game, so a thin group has thin
           content by definition and no amount of stretching invents any. The
           panel ends where it ends; the board above it still gives up the rows
           it does not need, so the panel sits directly under them. */
        .cb-fill{--fillrow:22px;--fillgap:6px;flex:1 0 auto;display:flex;flex-direction:column;border-top:1px solid var(--border);background:var(--surface);}
        .cb-fcols{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);}
        .cb-fcols.one{grid-template-columns:minmax(0,1fr);}
        .cb-fcl,.cb-fcr{min-width:0;display:flex;flex-direction:column;}
        .cb-fcr{border-left:1px solid var(--border);}
        .cb-fcl > .cb-fs:last-child,.cb-fcr > .cb-fs:last-child{border-bottom:none;}
        .cb-fs{padding:13px 16px 15px;border-bottom:1px solid var(--border);}
        .cb-fh{margin:0 0 9px;display:flex;align-items:baseline;gap:8px;font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--slate);}
        .cb-fh i{font-style:normal;font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:none;color:var(--muted);}
        /* ONE GRID FOR BOTH HALVES, so the week and the archive share a row and
           a pitch by construction rather than by two lists agreeing to be the
           same height. Columns: name, the week's chips, the archive bar, its
           percent, its count. */
        /* EVERY TRACK FIXED BUT ONE, which is what makes the rows agree. Each row
           is its own grid, so a CONTENT-SIZED track (the minmax(90px,190px) the
           archive bar had) resolves per row: the header row is tiny text, so its
           tracks came out narrower and both column labels sat over the wrong
           columns. With four fixed widths and a single 1fr, every row solves to
           the same numbers because the container width is the same for all of
           them. Do not reintroduce a content-sized track here.
           display:contents on the row was tried and is worse: it makes the cells
           direct items of one grid, which does fix the widths, but the header's
           two spans and each row's five then auto-place into one shared stream
           and everything lands a column out. */
        .cb-frows{display:flex;flex-direction:column;gap:var(--fillgap,6px);}
        .cb-frow{display:grid;grid-template-columns:104px minmax(0,1fr) 190px 40px 58px;align-items:center;gap:12px;min-height:var(--fillrow,22px);}
        .cb-frow.head{min-height:0;margin-bottom:1px;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);}
        .cb-frow.head .ar{grid-column:3 / span 3;}
        .cb-fbn{font-size:12.5px;font-weight:800;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .cb-fbd{display:flex;flex-wrap:wrap;gap:5px;}
        .cb-fbc{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;background:var(--white);font-size:10.5px;font-weight:700;color:var(--slate);text-decoration:none;font-variant-numeric:tabular-nums;}
        .cb-fbc:hover{border-color:var(--blue);color:var(--blue);}
        /* A day you finished, in the green the slate already uses for a done
           row, so the strip reads as a to-do list at a glance. Amber is a board
           you opened and left, matching the paused row's gold. */
        .cb-fbc.done{border-color:#bfe3cd;background:#eff8f3;color:var(--success-deep);}
        .cb-fbc.part{border-color:#eed9a6;background:#fdf7e8;color:#8a6d1a;}
        .cb-fbc.sun{border-color:#e8cf92;}
        .cb-fbs{display:inline-flex;align-items:center;justify-content:center;width:12px;height:12px;border-radius:3px;background:var(--gold);color:#2a1f04;font-style:normal;font-size:8.5px;font-weight:800;letter-spacing:0;}
        .cb-fnb{display:flex;flex-wrap:wrap;gap:6px;}
        .cb-fnc{display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border:1px solid var(--border);border-radius:999px;background:var(--white);font:inherit;font-size:11.5px;font-weight:700;color:var(--ink);cursor:pointer;}
        .cb-fnc:hover{border-color:var(--blue);color:var(--blue);}
        .cb-fnc b{font-weight:800;color:var(--muted);font-variant-numeric:tabular-nums;}
        /* NOT .cb-fab: that is the Suggest button at the foot of the panel, and
           sharing the name painted the bar white and the button 6px tall. */
        .cb-fbar{height:6px;border-radius:3px;background:#e3e8f0;overflow:hidden;}
        .cb-fbar i{display:block;height:100%;border-radius:3px;background:var(--blue);}
        .cb-fap{font-size:12.5px;font-weight:800;color:var(--blue-deep);text-align:right;font-variant-numeric:tabular-nums;}
        .cb-fap em{font-style:normal;font-size:9px;font-weight:700;color:var(--muted);margin-left:1px;}
        .cb-fac{font-size:10px;font-weight:700;color:var(--muted);text-align:right;font-variant-numeric:tabular-nums;}
        .cb-fq{display:grid;grid-template-columns:minmax(0,1fr);gap:5px;}
        .cb-fqc{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;padding:9px 11px;border:1px solid var(--border);border-radius:8px;background:var(--white);text-decoration:none;}
        .cb-fqc:hover{border-color:var(--blue);}
        .cb-fqt{font-size:12.5px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .cb-fqm{flex:none;font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--blue);}
        .cb-fqc.done .cb-fqm{color:var(--muted);}
        /* THE SUGGEST BAR TAKES THE FLOOR (owner, 2026-08-15). Whatever the
           pinned console has left over after the table and the chips is blue
           rather than a strip of dead board ground, so the panel ends on an edge
           instead of trailing off. Its content stays at the TOP of that blue,
           exactly where the bar sat before, so nothing moves when a group is
           thick enough to leave no slack at all: only the fill grows. It is the
           one growing child, so the sections and the two columns keep their own
           heights. flex-shrink 0 throughout, so a panel taller than the console
           is scrolled by the wrapper rather than crushed. */
        button.cb-fask{width:100%;border:0;border-radius:0;font:inherit;text-align:left;cursor:pointer;}
        .cb-fask{flex:1 0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 16px;background:var(--blue-deep);color:var(--white);text-decoration:none;}
        .cb-fat{display:flex;flex-direction:column;gap:3px;min-width:0;}
        .cb-fat b{font-size:14px;font-weight:800;}
        .cb-fat i{font-style:normal;font-size:11.5px;color:var(--blue-200);}
        .cb-fab{flex:none;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:7px;background:var(--white);color:var(--blue-deep);font-size:11.5px;font-weight:800;}
        .cb-cap{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;padding:0;background:transparent;}
        /* The cap's TRACKS carry the alignment, not a gutter of its own: see
           capCols in the component. The cap stays full width. */
        /* NO ART ON THE CAP CARDS, and none in the tiles either (owner,
           2026-08-15). Sixty-three little pictures on one board read as noise
           rather than detail, and the cards are the one place on the page that
           has to be legible at a glance. The cards keep their full size at six,
           tagline and all: the extra row is what pays for the space, not
           shrinking the cards. */
        .cb-card{display:flex;align-items:center;gap:10px;padding:15px 16px;border-radius:0;text-decoration:none;border-left:none;min-width:0;}
        .cb-card + .cb-card{box-shadow:inset 1.5px 0 0 rgba(255,255,255,.30);}
        .cb-card.up{background:var(--blue);color:var(--white);}
        .cb-card.easy,.cb-card.lead{background:var(--blue-deep);color:var(--white);}
        .cb-card.prog{background:var(--gold);color:#3a2a05;border-left-color:#f7d98a;}
        .cb-card.fail{background:#b91c1c;color:var(--white);border-left-color:#f3a5a5;}
        .cb-ct{display:flex;flex-direction:column;min-width:0;}
        .cb-ce{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.82;margin-bottom:4px;}
        .cb-cn{font-size:20px;font-weight:800;letter-spacing:-.015em;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .cb-cs{font-size:11.5px;line-height:1.45;font-weight:500;opacity:.85;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .cb-cb{margin-left:auto;flex:none;display:inline-flex;align-items:center;gap:5px;background:var(--white);color:var(--accent);border-radius:7px;padding:10px 14px;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;}
        .cb-card.prog .cb-cb{color:#3a2a05;}
        .cb-card.fail .cb-cb{color:#b91c1c;}

        /* BIGGER TILES (owner, 2026-08-15). They are the primary navigation on
           this page now, so they carry a 38px emblem, a 17px name and real
           breathing room rather than reading as a dense index. They also GROW
           into whatever height the board has spare, which is what fills the
           screen when no category is open. */
        .cb-tile:hover{background:var(--white);}
        .cb-tile.on{background:var(--accent-soft);box-shadow:inset 0 0 0 2px var(--blue);}
        /* The row rule was removed with the name-list era and never put back,
           so the glyph and the name stacked and the tile grew a hole above
           them. One line: glyph, name, count. */
        /* line-height, and it is load-bearing: an overflow:hidden nowrap name at
           the default 1.2 clips the descender of a g or y (Rung lost its tail).
           Anything that ellipsizes text needs a line box taller than the glyphs
           it is hiding the sides of. */
        /* NO margin-top:auto here. With the game art gone the tile has three short
           rows and a tall box, and an auto top margin pinned this one to the
           floor and opened a 92px hole above it. Centred as a group instead,
           which is what justify-content on the tile was already asking for. */
        .cb-gnm{font-size:11px;font-weight:700;color:var(--muted);line-height:1.15;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;}
        /* With no category open the nine tiles ARE the board, so they take the
           whole of it: three equal rows rather than a short block with a void
           of ground under it. */
        /* THE TILES GROW INTO THE BOARD. min-height:100% could never have done
           this: a percentage min-height resolves against a parent whose height
           property is auto, so it was ignored and the tiles sat in a short block
           with a void of ground underneath (owner, 2026-08-15: far too much dead
           space). As a flex child with a definite parent height it just works. */
        .dhome.cats .cb-tiles{flex:1 1 auto;grid-auto-rows:1fr;}
        /* Open: the category owns the whole board. The tiles are not shrunk,
           they are not rendered at all, which is what "takes over the full
           space" has to mean if the list is going to be worth opening. */
        .dhome.cats .cb-hd{flex:none;}

      }
      /* 901-1200px: the columns are NOT pinned at this width (railH is not set
         either), so the console goes back to natural height and scrolls with
         the page. Two tiles across, and a tighter cap. */
      @media(min-width:901px) and (max-width:1200px){
        .cb-cap{gap:0;padding:0;}
        .cb-card{padding:12px;}
        .cb-cn{font-size:17px;}
        .cb-cb{padding:9px 11px;}
        .cb-tiles{grid-template-columns:repeat(2,minmax(0,1fr));}
        .dhome.cats{height:auto;}
        .dhome.cats .dh-board{overflow:visible;}
        .dhome.cats .cb-tiles{flex:none;grid-auto-rows:auto;}
      }
      /* THE BANDS ARE GONE AT BOTH WIDTHS, so this rule sits outside the
         desktop block on purpose. Their job moved to the filter strip, where
         Ready, Paused, Failed and Done are now selections rather than coloured
         bars you scroll to (owner, 2026-08-15). */
      .dhome.cats .sl-band{display:none !important;}
      /* ONE PAIR OF CHEVRONS ON THE PHONE, centred between the two rows. Row
         one's pair already scrolls both and already sits against a box that
         spans both rows, since row two's strip is nested inside row one's
         wrapper; the only thing wrong was that row two still drew its own.
         This rule has to live OUT here: inside the min-width:901px block it
         read "at least 901 and at most 900", which is never, because a nested
         media query intersects with its parent rather than replacing it. */
      /* NO ARROWS AND NO FADES ON TOUCH (owner, 2026-08-15): flick to slide.
         A chevron is a MOUSE affordance. It exists to tell a pointer that a
         strip scrolls, because a pointer cannot simply try; a finger tries. On
         a phone both the button and the fade are chrome sitting on top of the
         thing they advertise, and the fade is the worse of the two, because
         what it dims is the first and last chip you are reaching for.

         The padding goes with them: .ml and .mr add 26px to clear a button
         that is no longer drawn, and that padding is why the strip would
         otherwise start with a gap where the arrow used to be. */
      @media(max-width:900px){
        .dhome.cats .sl-fnav{display:none !important;}
        .dhome.cats .sl-filtw::before,.dhome.cats .sl-filtw::after,
        .dhome.cats .sl-filtw2::before,.dhome.cats .sl-filtw2::after{display:none !important;}
        .dhome.cats .sl-filtw.ml .sl-filt,.dhome.cats .sl-filtw.mr .sl-filt,
        .dhome.cats .sl-filtw2.ml .sl-filt,.dhome.cats .sl-filtw2.mr .sl-filt{padding-left:0;padding-right:0;}
        /* Momentum scrolling on the older iOS engines, and the strip owns its
           horizontal gestures so a flick along it never turns into a page
           scroll halfway through. */
        .dhome.cats .sl-filt{-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;touch-action:pan-x;}
      }
      /* Below 901px the catboard does not exist: every rule above is desktop
         only, so without this its elements would render unstyled underneath a
         perfectly good phone slate. MOBILE IS UNTOUCHED, and this is the line
         that guarantees it. */
      @media(max-width:900px){
        .dhome.cats .cb-cap,.dhome.cats .cb-sect,.dhome.cats .cb-tiles,.dhome.cats .cb-hd,.dhome.cats .cb-fill{display:none !important;}
      }

      ` }} />

      {/* The cap. Welded directly onto the grid below (rounded top corners only,
          no margin), split into two equal halves: Up next on the left, Easiest
          leaderboard on the right. The Your-day stats that used to live here
          moved into the page header on 2026-08-03. */}
      {slate ? (
        <div className={dayTally.length > 3 ? 'sl-bar four' : 'sl-bar'}>
          <span className="sl-ttl">Today&rsquo;s slate</span>
          {/* THE READY PIP IS ITS OWN FLEX CHILD, not one of the group (owner,
              2026-08-10), which is what holds the phone header to two lines: it
              rides up beside the title and the date, leaving the other three to
              share the second line. On a desktop the order property puts it back
              at the head of the run and the bar renders exactly as before. */}
          {dayTally.filter((t) => t.k === 'todo').map((t) => slatePip(t, ' sl-ptodo'))}
          {etLabel.long ? <i className="sl-dt"><i className="d">{etLabel.long}</i><i className="p">{etLabel.short}</i></i> : null}
          <span className="sl-count">{dayTally.filter((t) => t.k !== 'todo').map((t) => slatePip(t))}</span>
        </div>
      ) : null}
      {/* THE DAILY FIVE, above the cap and below the title band (owner,
          2026-08-17). First thing on the console, because it is the thing a
          visitor should start with, and it takes no slot away from anything:
          the cap keeps all three of its cards. Returns null on any date with no
          entry in the bank, which is the correct degrade (see lib/daily-five
          rule 4), so the console is byte-identical to before on such a day. */}
      <DailyFiveBand />
      <div className="dh-sbar">
        {cats ? renderCatCap() : null}
        <div className="dh-cell up">
          {nextGame ? (
            <>
              {capIcon ? <img src={blueTile(nextGame.img)} alt="" aria-hidden="true" onError={tileFallback} /> : null}
              <div className="dh-bupt">
                <div className="dh-bue up">Up next</div>
                <div className="dh-bun">{nextGame.name}</div>
                <div className="dh-busub">{nextGame.tag}{playsNote(nextPlays)}</div>
              </div>
              <a href={nextGame.href} className="dh-play">
                <Play size={11} fill="currentColor" strokeWidth={0} />Play
              </a>
            </>
          ) : (
            <>
              <Trophy size={22} color={T.gold} strokeWidth={2.2} />
              <div className="dh-bupt">
                <div className="dh-bue">Clean sweep</div>
                <div className="dh-bun">All {GAMES.length} done</div>
                <div className="dh-busub">A fresh slate lands at midnight</div>
              </div>
            </>
          )}
        </div>
        <div className="dh-cell easy">
          {easiest ? (
            <>
              {capIcon ? <img src={blueTile(easiest.game.img)} alt="" aria-hidden="true" onError={tileFallback} /> : null}
              <div className="dh-bupt">
                <div className="dh-bue"><span className="dh-bwide">Easiest leaderboard</span><span className="dh-bshort">Easiest board</span></div>
                <div className="dh-bun">{easiest.game.name}</div>
                {/* The game's own description leads, the same as Up next, and
                    the field size follows it (owner, 2026-08-03). The count on
                    its own said nothing about what the game IS. This half counts
                    the leaderboard field, NOT plays: see playsNote/fieldNote. */}
                <div className="dh-busub">{easiest.game.tag}{fieldNote(easiest.players)}</div>
              </div>
              <a href={easiest.game.href} className="dh-play">
                <Play size={11} fill="currentColor" strokeWidth={0} />Play
              </a>
            </>
          ) : (
            <>
              <Trophy size={22} color={T.gold} strokeWidth={2.2} />
              <div className="dh-bupt">
                <div className="dh-bue">{nextGame ? 'Almost there' : 'Clean sweep'}</div>
                <div className="dh-bun">{nextGame ? 'One to go' : `All ${GAMES.length} done`}</div>
                <div className="dh-busub">{nextGame ? 'Finish the slate to sweep the day' : 'Every daily played today'}</div>
              </div>
            </>
          )}
        </div>
        {/* Familiar favorite, and New to you beside it when nothing is paused.
            Between them they hold the cap at four cards in every state, which is
            what retired the full-width lone paused card: with an even grid no
            card is ever left standing on its own row. Two more tones of the same
            blue ramp, and the WHOLE card is the link (the button is a span
            inside it, never a second anchor), exactly as the paused cards are.
            SHUT only: open, the one card that survives rides inside the block
            below, since that is the grid whose parity needs it. */}
        {capLeadTop.map((c, i) => capLeadCard(c, i === capLeadWideAt))}
        {/* The state cards: paused in gold, incomplete in red, in one block so
            one budget and one expander cover both. Each is a single link with
            the button as a span inside it, never a second anchor, because the
            one thing you want from a game you have already opened is to get
            back into it. The paused card says Resume because its board is still
            live; the incomplete one says Play because there is nothing to
            resume, only a puzzle this game never showed you the answer to. */}
        {capState.length ? (
          <div className={'dh-cprog' + (capOpen ? ' open' : '')}>
            {capStateShown.map((c, i) => {
              const paused = c.kind === 'prog';
              return (
                <a
                  key={c.game.key}
                  href={c.game.href}
                  aria-label={`${paused ? 'Resume' : 'Retry'} ${c.game.name}`}
                  className={'dh-cell ' + (paused ? 'prog' : 'failc')
                    + (capCol1(i) ? ' capL' : '')
                    + (i === capWideAt ? ' capw' : '')}
                >
                  <div className="dh-bupt">
                    <div className="dh-bue">{paused ? 'Paused' : 'Failed'}</div>
                    <div className="dh-bun">{c.game.name}</div>
                    <div className="dh-busub">
                      {c.game.tag}
                      {paused ? playsNote(playsOf(c.game.key)) : ' \u00b7 the answer is still yours to find'}
                    </div>
                  </div>
                  <span className="dh-play">
                    {/* RETRY, not Play: the run is over and the score is
                        banked, so this is another go at a puzzle you have not
                        seen the answer to, which is a different offer from
                        starting a game you have not touched. */}
                    <Play size={11} fill="currentColor" strokeWidth={0} />{paused ? 'Resume' : 'Retry'}
                  </span>
                  {/* The card is one big link, so the dismiss has to swallow the
                      click itself; without preventDefault it would open the game
                      on its way out. Offered on the red card only: a paused game
                      is a standing invitation with a live board behind it, where
                      an incomplete one is just a puzzle you may be done with. */}
                  {!paused ? (
                    <button
                      type="button"
                      className="dh-cx"
                      aria-label={`Dismiss ${c.game.name} for today`}
                      title="Dismiss for today. It stays in Failed below."
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissFail(c.game.key); }}
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  ) : null}
                </a>
              );
            })}
            {/* The parity card. Open with an odd number of state cards, the
                last one had nothing beside it, so one lead card takes that
                square instead of the odd card stretching across both. It sits
                inside the block because the open block is its own grid: put
                above, it would be the odd card on the fixed row instead. */}
            {capLeadIn.map((c) => capLeadCard(c, false))}
          </div>
        ) : null}
        {/* NO EXPANDER ON THE CAP (owner, 2026-08-12). The cap used to grow a
            "Show N in progress / N incomplete" bar the moment a third state
            card existed, so the console carried TWO ways to reach the same
            games: that bar, and the bands at the foot of the board. The bands
            win, because they sit with the rows they open and every group has
            one. The cap keeps its two cards and says nothing about the rest;
            In progress and Incomplete today below list every one of them.

            capOpen and the .dh-cprog scroller it drives are deliberately left
            in place rather than torn out: nothing sets capOpen now, so the
            block simply stays shut, and the fit effect already handles a
            missing bar (it removes --cap-pmax and stops bounding a block that
            can never open). */}
      </div>

      {/* overall daily leaderboard (toggled) */}
      {hasBoard && lbOpen ? (
        <div className="dh-lbpanel">
          <div className="dsd-head">
            <span className="dsd-l">Daily Leaderboard</span>
            <span className="dsd-r">Best {bestN} of {gameCount} · {maxTotal} pts max · resets at midnight</span>
          </div>
          <div className="dsd-grid">
            <div>
              <div className="dsd-sub">Overall · Top 3</div>
              <div className="dsd-cols"><span>#</span><span>Player</span><span style={{ textAlign: 'right' }}>Games</span><span style={{ textAlign: 'right' }}>Total</span></div>
              {top3.length ? top3.map((r) => {
                const mine = meKey && r.userKey === meKey;
                return (
                  <div key={r.userKey} className={`dsd-row${r.rank === 1 ? ' first' : ''}${mine ? ' me' : ''}`}>
                    <span className="dsd-rk">{r.rank}</span>
                    <span className="dsd-pn">{r.rank === 1 ? <Crown className="dsd-cr" size={13} /> : null}{r.username || 'Player'}{mine ? <b> (you)</b> : ''}</span>
                    <span className="dsd-g">{r.gamesPlayed}/{gameCount}</span>
                    <span className="dsd-tt">{fmtPts(r.total)}<s>/{maxTotal}</s></span>
                  </div>
                );
              }) : <div className="dsd-empty">No daily scores yet today. Be the first.</div>}
              {meKey && board.me && !meShown ? (
                <div className="dsd-row me" style={{ marginTop: 7 }}>
                  <span className="dsd-rk">{board.me.rank}</span>
                  <span className="dsd-pn">{board.me.username || 'You'} <b>(you)</b></span>
                  <span className="dsd-g">{board.me.gamesPlayed}/{gameCount}</span>
                  <span className="dsd-tt">{fmtPts(board.me.total)}<s>/{maxTotal}</s></span>
                </div>
              ) : null}
              <a href="/quizzes/hub?tab=daily" className="dsd-gt" style={{ marginTop: 11, color: '#8a5300' }}>Full standings &amp; game boards →</a>
              {uniquePlayers != null ? (
                <div className="dsd-players" style={{ marginTop: 2 }}><b>{uniquePlayers.toLocaleString()}</b> {uniquePlayers === 1 ? 'player' : 'players'} today <s>· guests included</s></div>
              ) : null}
              <div className="dsd-past">
                <a href="/quizzes/hub?tab=daily&section=champions" className="dsd-hof"><Trophy size={12} /> Hall of Fame →</a>
                <div className="dsd-sub" style={{ marginTop: 13 }}>Recent Champions</div>
                {hist === null ? (
                  <div className="dsd-empty">Loading…</div>
                ) : hist.length ? hist.map((d, i) => (
                  <div key={d.date || i} className={`dsd-yest${i === 0 ? ' top' : ''}`}>
                    <Crown size={i === 0 ? 13 : 11} style={{ color: i === 0 ? T.gold : '#8d7c52', flex: 'none' }} />
                    <span className="yl">{i === 0 ? 'Yesterday' : d.label}</span>
                    {d.winner ? (
                      <>
                        <b>{d.winner.username || 'Champion'}</b>
                        <span className="yt">{fmtPts(d.winner.total)}<s>/{d.maxTotal}</s></span>
                      </>
                    ) : (
                      <span className="ynone">No champion</span>
                    )}
                  </div>
                )) : <div className="dsd-empty">No champions yet.</div>}
              </div>
            </div>
            <div>
              <div className="dsd-sub">Each Game · Top 3</div>
              <div className="dsd-minis">
                {sortByDailyOrder(bgames, dailyOrder).map((g) => {
                  const t3 = (g.board || []).slice(0, 3);
                  const acc = ACCENTS[g.key] || '#8a5300';
                  return (
                    <div key={g.key} className="dsd-mini">
                      <a href={g.href || `/${g.key}`} className="dsd-gt" style={{ color: acc }}>{NAME_BY_KEY[g.key] || g.key} →<span>top 3</span></a>
                      {t3.length ? t3.map((r, i) => {
                        const mine = meKey && r.userKey === meKey;
                        return (
                          <div key={r.userKey || i} className="dsd-mr"><span className="dsd-k">{i + 1}</span><span className="dsd-n2">{r.username || 'Player'}{mine ? <b> (you)</b> : ''}</span><span className="dsd-p">{fmtPts(r.points)}</span></div>
                        );
                      }) : <div className="dsd-none">No scores yet</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* tile board. The expand panel is absolutely positioned over the whole
          console (see below), so opening a tile covers this rather than
          displacing it. */}
      {/* The category strip is a SIBLING of the board wrap, never a child of it
          (owner, 2026-08-09). Inside it, the wrap's 1.5px side borders inset the
          strip, so this navy band came out 3px narrower than the navy title band
          directly above it and a grey hairline ran down each side. Up here both
          navy bands span the console on the same pixel. It keeps no `order`, so
          the phone's order flip (bar -1, title 0, board 1) still lands it between
          the title band and the board on source order alone. */}
      {slate ? (
        <div className={`sl-filtw${filtMore.l ? ' ml' : ''}${filtMore.r ? ' mr' : ''}`}>
        <div className="sl-filt" ref={filtRef} role="tablist" aria-label="Filter the slate">
          {[['all', 'All']]
            // The subjects: categories and circuits in ONE deduped list, five
            // leading in a fixed order and the rest A-Z. Built by stripSubjects
            // at module scope, where the reasoning for all of that lives.
            .concat(stripSubjects(slateCats, cats))
            // LAST of the subjects, and absent on a Sunday: on the day itself
            // the Sunday Editions ARE the board, so a tab pointing at last
            // week's would only be competing with them.
            .concat(sunToday ? [] : [['sunday', 'Sundays']])
            // Ready / Paused / Failed / Done, which used to be the bands at the
            // foot of the board. They carry their counts because that is the one
            // thing a band said that a chip otherwise would not.
            //
            // AFTER the subjects at BOTH widths, and by source order now rather
            // than by the phone's CSS order property. A state is not a subject:
            // leading with four of them is what pushed every category off the
            // right edge of a 390px phone, which is why the phone already
            // reordered them to the end. One strip means one answer, and the
            // desktop takes the phone's.
            .concat(cats ? [['ready', <><i className="sl-sdot rdy" />Ready {nReadyAll}</>, 'sl-fs']] : [])
            .concat(cats && nProgAll ? [['paused', <><i className="sl-sdot prg" />Paused {nProgAll}</>, 'sl-fs']] : [])
            .concat(cats && nFailAll ? [['failed', <><i className="sl-sdot fal" />Failed {nFailAll}</>, 'sl-fs']] : [])
            .concat(cats && nDoneAll ? [['done', <><i className="sl-sdot dne" />Done {nDoneAll}</>, 'sl-fs']] : [])
            .map(([k, label, cls]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={filter === k}
              className={[cls, filter === k ? 'on' : null].filter(Boolean).join(' ') || undefined}
              onClick={() => setFilter(k)}
            >{label}</button>
          ))}
        </div>
        {filtMore.l ? (
          <button type="button" className="sl-fnav l" onClick={() => nudgeFilt(-1)} aria-label="Scroll the categories left">
            <ChevronLeft size={14} strokeWidth={3} />
          </button>
        ) : null}
        {filtMore.r ? (
          <button type="button" className="sl-fnav r" onClick={() => nudgeFilt(1)} aria-label="Scroll the categories right">
            <ChevronRight size={14} strokeWidth={3} />
          </button>
        ) : null}
        </div>
      ) : null}
      <div className={'dh-boardwrap' + (selGame ? ' open' : '') + (slate ? ' slate' : '') + (fillOn ? ' cb-fitted' : '')}>
        <div className="dh-vpwrap">
        <div
          ref={vpRef}
          className={'dh-vp' + (!slate && !cats && metrics && metrics.maxOffset > 0 ? ' on' : '')}
          style={!slate && !cats && metrics && metrics.maxOffset > 0
            ? { height: metrics.windowH }
            : undefined}
          onScroll={(e) => { e.currentTarget.scrollTop = 0; }}
        >
          <div
            ref={boardRef}
            className={'dh-board' + (showAll ? '' : ' mcut') + (slate ? ' slate' : '') + (slate && myGamesOn ? ' pins' : '') + (cats && filter !== 'all' && filter !== 'todo' && filter !== 'sunday' ? ' cb-open' : '')}
            role="navigation"
            aria-label="Daily puzzles"
            aria-hidden={selGame && !slate ? 'true' : undefined}
            style={!slate && !cats && metrics && metrics.maxOffset > 0
              ? { transform: `translateY(-${shift * metrics.rowStep}px)` }
              : undefined}
          >
            {slate ? (
              <div className="sl-head" role="row">
                {myGamesOn ? <span /> : null}
                <span />
                {[['game', 'Game', ''], ['cat', 'Category', 'c'], ['players', 'Players', 'c'],
                  ['streak', 'Streak', 'c'], ['leader', 'Leader', 'c'], ['status', 'Status', 'c'],
                  ['archive', 'Archive & stats', 'c']].map(([key, label, cls]) => {
                  const on = sort && sort.key === key;
                  return (
                    <span key={key} className={cls || undefined}>
                      <button
                        type="button"
                        className={`sl-sort${on ? ' on' : ''}`}
                        onClick={() => toggleSort(key)}
                        aria-label={`Sort by ${label}`}
                        aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        {label}
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" aria-hidden="true">
                          {on && sort.dir === 'asc' ? <path d="m6 15 6-6 6 6" /> : <path d="m6 9 6 6 6-6" />}
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : null}
            {slate ? renderSlate(slateList, false) : renderTiles(list, false)}
          </div>
        </div>
        {/* Row-window pager (the round chevron under the board). It belongs to
            the TILE board only: the viewport height and the translateY shift
            above are both gated on !slate, so on the slate it rendered a button
            that moved nothing (owner, 2026-08-07). Gated to match, rather than
            deleted, so it comes back on its own if the tile board ever returns.
            All wiring stays: rowOffset/metrics state, the measure effect, and
            the .dh-more CSS. */}
        {!slate && !cats && metrics && metrics.maxOffset > 0 && !selGame ? (
          <button
            type="button"
            className="dh-more"
            onClick={() => setRowOffset(shift < metrics.maxOffset ? shift + 1 : 0)}
            aria-label={shift < metrics.maxOffset ? 'Show more daily puzzles' : 'Back to the top of the daily puzzles'}
            title={shift < metrics.maxOffset ? 'More puzzles' : 'Back to the top'}
          >
            {shift < metrics.maxOffset
              ? <ChevronDown size={19} strokeWidth={2.8} />
              : <ChevronUp size={19} strokeWidth={2.8} />}
          </button>
        ) : null}
        </div>
        {/* THE PANEL IS A SIBLING OF THE BOARD, not a row inside it (2026-08-15).
            Above 1200px the console and the Loft rail are both pinned to the
            viewport on purpose, so the home board is exactly one screen, and
            shrinking the board would undo that rather than fix anything. So the
            board keeps the height it is given and gives up only what its rows
            do not need: .dh-vpwrap goes flex:0 0 auto and the panel takes the
            rest, which is what closes the 121px of white at 1440 and 221px at
            1920 without the console moving at all. Inside the board it was also
            a row in the scroller; out here it stays put while long groups
            scroll past it. */}
        {fillOn ? renderFill() : null}
        {/* Phone board cut (owner, 2026-07-31): eight tiles, then this toggle.
            The cut is CSS-only -- .mcut hides :nth-child(n+9) under 640px -- so
            the server renders the collapsed board and a phone never flashes all
            thirty-seven tiles before the JS makes up its mind. Above 640px the
            class does nothing and the button is display:none, so the desktop
            row window is untouched. */}
        <button
          type="button"
          className="dh-mall"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
        >
          {showAll
            ? <>Show fewer <ChevronUp size={15} strokeWidth={2.8} /></>
            : <>Show all {list.length} games <ChevronDown size={15} strokeWidth={2.8} /></>}
        </button>
      </div>
      {/* The panel is a child of .dhome, not of the board, so it covers the
          stats bar as well as the grid: one expanded console, one Play button
          (owner, 2026-07-29). */}
      {selGame && !slate ? renderPanel(selGame) : null}
      {/* The scrollbar-gutter fill under the pinned band stack (see the paint
          effect). Last child of .dhome, so it covers the gutter the scroller
          reserves; NOT rendered while a panel is open, since that panel fills
          .dhome too and this would paint over its bottom-right corner. */}
      {slate && !selGame ? <i className="dh-capfill" ref={capFillRef} aria-hidden="true" /> : null}
    </div>
  );
}


