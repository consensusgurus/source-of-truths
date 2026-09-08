'use client';

// "Still on the table today" — the cross-promo strip every daily game shows
// on its result card. Reads each game's same-device day breadcrumb
// (sot_<game>_day, written by that game's client for TODAY'S puzzle only)
// and lists the dailies the player hasn't finished yet. Adding a game to the
// registry here adds it to every other game's end screen.

import React, { useState, useEffect } from 'react';
import { T } from '@/lib/theme';
import { isRetiredDaily } from '@/lib/daily-games';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

export const DAILY_GAMES = [
  { key: 'crux', href: '/crux', name: 'Crux', tag: 'a clueless crossword', store: 'sot_crux_day', accent: T.blue, bg: '#eef4ff', border: 'rgba(37,99,235,0.35)' },
  { key: 'emcee', href: '/emcee', name: 'Emcee', tag: 'the daily mini crossword', store: 'sot_emcee_day', accent: '#c026d3', bg: '#fbeefc', border: 'rgba(192,38,211,0.4)' },
  { key: 'shards', href: '/shards', name: 'Shards', tag: 'reassemble the shattered crossword', store: 'sot_shards_day', accent: '#0d9488', bg: '#d9f0ee', border: 'rgba(13,148,136,0.4)' },
  { key: 'garble', href: '/garble', name: 'Garble', tag: 'five garbled words, one clued finale', store: 'sot_garble_day', accent: '#8a6d1a', bg: '#fdf6e3', border: 'rgba(230,185,63,0.6)' },
  { key: 'links', href: '/links', name: 'Links', tag: 'sixteen words, four hidden groups', store: 'sot_links_day', accent: '#166534', bg: '#eefaf1', border: 'rgba(90,169,106,0.5)' },
  { key: 'span', href: '/span', name: 'Span', tag: 'cross the map, border by border', store: 'sot_span_day', accent: '#9d174d', bg: '#fdf0f6', border: 'rgba(217,99,153,0.45)' },
  { key: 'dating', href: '/dating', name: 'Dating', tag: 'put five moments in order', store: 'sot_dating_day', accent: '#6d28d9', bg: '#f5f0ff', border: 'rgba(124,58,237,0.4)' },
  { key: 'tally', href: '/tally', name: 'Tally', tag: 'balance every row and column', store: 'sot_tally_day', accent: T.successDeep, bg: '#eefaf1', border: 'rgba(21,128,61,0.45)' },
  { key: 'suds', href: '/suds', name: 'Suds', tag: 'the daily 9×9 sudoku', store: 'sot_suds_day', accent: '#ea580c', bg: '#fff5ed', border: 'rgba(234,88,12,0.4)' },
  { key: 'quilt', href: '/quilt', name: 'Quilt', tag: 'the daily jigsaw sudoku', store: 'sot_quilt_day', accent: '#a21caf', bg: '#fdf4ff', border: 'rgba(162,28,175,0.4)' },
  { key: 'cages', href: '/cages', name: 'Cages', tag: 'the daily killer sudoku', store: 'sot_cages_day', accent: '#6b21a8', bg: '#f6f2fd', border: 'rgba(107,33,168,0.4)' },
  { key: 'sando', href: '/sando', name: 'Sando', tag: 'the daily sandwich sudoku', store: 'sot_sando_day', accent: '#15616b', bg: '#eaf6f7', border: 'rgba(21,97,107,0.4)' },
  { key: 'carve', href: '/carve', name: 'Carve', tag: 'carve the grid into equal sums', store: 'sot_carve_day', accent: '#7c3aed', bg: '#f5f0ff', border: 'rgba(124,58,237,0.4)' },
  { key: 'outrank', href: '/outrank', name: 'Outrank', tag: "call the crowd's order", store: 'sot_outrank_day', accent: '#4338ca', bg: '#eef0fb', border: 'rgba(67,56,202,0.4)' },
  { key: 'extra', href: '/extra', name: 'Extra', tag: 'unredact the front page', store: 'sot_extra_day', accent: '#b91c1c', bg: '#fdeeee', border: 'rgba(185,28,28,0.4)' },
  { key: 'stet', href: '/stet', name: 'Stet', tag: 'spot the error, fix the copy', store: 'sot_stet_day', accent: '#0369a1', bg: '#e8f3fa', border: 'rgba(3,105,161,0.4)' },
  { key: 'outwit', href: '/outwit', name: 'Outwit', tag: 'five duels against the crowd', store: 'sot_outwit_day', accent: '#1f2937', bg: T.surfaceAlt, border: 'rgba(31,41,55,0.35)' },
  { key: 'tuck', href: '/tuck', name: 'Tuck', tag: 'same letters, highest score wins', store: 'sot_tuck_day', accent: '#92400e', bg: '#f5e9dc', border: 'rgba(146,64,14,0.35)' },
  { key: 'alibi', href: '/alibi', name: 'Alibi', tag: 'the nightly whodunit', store: 'sot_alibi_day', accent: '#8b1e2d', bg: '#f6e3e5', border: 'rgba(139,30,45,0.35)' },
  { key: 'cipher', href: '/cipher', name: 'Cipher', tag: 'crack the letter math', store: 'sot_cipher_day', accent: '#0f766e', bg: '#d9f0ee', border: 'rgba(15,118,110,0.35)' },
  { key: 'ping', href: '/ping', name: 'Ping', tag: 'find the secret city', store: 'sot_ping_day', accent: '#0284c7', bg: '#e0f2fe', border: 'rgba(2,132,199,0.35)' },
  { key: 'warmer', href: '/warmer', name: 'Warmer', tag: 'hotter or colder', store: 'sot_warmer_day', accent: '#dc2626', bg: '#fef2f2', border: 'rgba(220,38,38,0.35)' },
  { key: 'jester', href: '/jesters', name: 'Jesters', tag: 'seat the court', store: 'sot_jester_day', accent: '#7c3aed', bg: '#f3e8ff', border: 'rgba(124,58,237,0.35)' },
  { key: 'sworn', href: '/sworn', name: 'Sworn', tag: 'spot the liars', store: 'sot_sworn_day', accent: '#be185d', bg: '#fce7f3', border: 'rgba(190,24,93,0.35)' },
  { key: 'axiom', href: '/axiom', name: 'Axiom', tag: 'find the hidden rule', store: 'sot_axiom_day', accent: '#0f766e', bg: '#d9f0ee', border: 'rgba(15,118,110,0.35)' },
  { key: 'hearsay', href: '/hearsay', name: 'Hearsay', tag: "deduce what they don't know", store: 'sot_hearsay_day', accent: '#7c2d92', bg: '#f5e8fa', border: 'rgba(124,45,146,0.35)' },
  { key: 'venn', href: '/venn', name: 'Venn', tag: 'sort the overlaps', store: 'sot_venn_day', accent: '#b45309', bg: '#fdf0e3', border: 'rgba(180,83,9,0.35)' },
  { key: 'stands', href: '/stands', name: 'Stands', tag: 'rebuild the results', store: 'sot_stands_day', accent: T.blueDeep, bg: '#e8effd', border: 'rgba(29,78,216,0.35)' },
  { key: 'bracket', href: '/bracket', name: 'Bracket', tag: 'name every winner', store: 'sot_bracket_day', accent: '#c2410c', bg: '#fdece3', border: 'rgba(196,65,12,0.35)' },
  // PRICER PULLED 2026-08-09 (see CLAUDE.md). Restore: grep -rn 'PRICER PULLED' promo tile
  // { key: 'pricer', href: '/pricer', name: 'Pricer', tag: 'some days more, some days less', store: 'sot_pricer_day', accent: '#15803d', bg: '#dcfce7', border: 'rgba(21,128,61,0.35)' },
  { key: 'lode', href: '/lode', name: 'Lode', tag: 'seven letters, rare words pay', store: 'sot_lode_day', accent: T.goldInk, bg: '#fef7e0', border: 'rgba(161,98,7,0.35)' },
  { key: 'etch', href: '/etch', name: 'Etch', tag: 'a picture hidden in the numbers', store: 'sot_etch_day', accent: '#4d7c0f', bg: '#f3f8e8', border: 'rgba(77,124,15,0.35)' },
  { key: 'glyph', href: '/glyph', name: 'Glyph', tag: 'a crossword with no clues at all', store: 'sot_glyph_day', accent: '#334155', bg: T.surfaceAlt, border: 'rgba(51,65,85,0.35)' },
  { key: 'hedge', href: '/hedge', name: 'Hedge', tag: 'draw one closed loop', store: 'sot_hedge_day', accent: '#0891b2', bg: '#e6f6fa', border: 'rgba(8,145,178,0.35)' },
  { key: 'listed', href: '/listed', name: 'Listed', tag: 'rank the list, top to bottom', store: 'sot_listed_day', accent: '#86198f', bg: '#fdf2fe', border: 'rgba(134,25,143,0.35)' },
  { key: 'mate', href: '/mate', name: 'Mate', tag: 'white to play and mate', store: 'sot_mate_day', accent: '#6b4423', bg: '#f6efe6', border: 'rgba(107,68,35,0.35)' },
  { key: 'four', href: '/four', name: 'Four', tag: 'one column wins', store: 'sot_four_day', accent: T.blueDark, bg: '#e8eefc', border: 'rgba(35,58,99,0.35)' },
  { key: 'park', href: '/parker', name: 'Parker', tag: 'get the red one out', store: 'sot_park_day', accent: '#7c5c2e', bg: '#f6efe2', border: 'rgba(124,92,46,0.35)' },
  { key: 'impound', href: '/impound', name: 'Impound', tag: 'parker on a bigger lot', store: 'sot_impound_day', accent: '#6b4a1f', bg: '#f3ece0', border: 'rgba(107,74,31,0.35)' },
  { key: 'junkyard', href: '/junkyard', name: 'Junkyard', tag: 'parker on the biggest lot', store: 'sot_junkyard_day', accent: '#5c3a16', bg: '#f0e7d8', border: 'rgba(92,58,22,0.35)' },
  { key: 'check', href: '/check', name: 'Check', tag: 'red to play and sweep', store: 'sot_check_day', accent: '#166e5a', bg: '#e6f3ef', border: 'rgba(22,110,90,0.35)' },
  { key: 'hinge', href: '/hinge', name: 'Hinge', tag: 'chain the compounds', store: 'sot_hinge_day', accent: '#4f46e5', bg: '#e0e7ff', border: 'rgba(79,70,229,0.4)' },
  { key: 'rung', href: '/rung', name: 'Rung', tag: 'one letter at a time', store: 'sot_rung_day', accent: '#155e75', bg: '#e4f2f6', border: 'rgba(21,94,117,0.35)' },
  { key: 'crunch', href: '/crunch', name: 'Crunch', tag: 'six numbers, one target', store: 'sot_crunch_day', accent: '#b45309', bg: '#fdf3e3', border: 'rgba(180,83,9,0.35)' },
  { key: 'taire', href: '/taire', name: 'Taire', tag: 'the daily solitaire', store: 'sot_taire_day', accent: '#1d6b4f', bg: '#e6f2ec', border: 'rgba(29,107,79,0.35)' },
  { key: 'fib', href: '/fib', name: 'Fib', tag: 'one clue is lying', store: 'sot_fib_day', accent: '#4c1d95', bg: '#f1edfb', border: 'rgba(76,29,149,0.35)' },
  { key: 'streak', href: '/streak', name: 'Streak', tag: 'forty questions, one life', store: 'sot_streak_day', accent: '#e11d48', bg: '#fdecef', border: 'rgba(225,29,72,0.35)' },
  { key: 'feud', href: '/feud', name: 'Feud', tag: 'match the crowd', store: 'sot_feud_day', accent: '#9f1239', bg: '#fdf0f3', border: 'rgba(159,18,57,0.4)' },
  { key: 'babel', href: '/babel', name: 'Babel', tag: 'the bag is empty', store: 'sot_babel_day', accent: '#14532d', bg: '#e9f2ec', border: 'rgba(20,83,45,0.4)' },
  { key: 'finesse', href: '/finesse', name: 'Finesse', tag: 'the daily double dummy', store: 'sot_finesse_day', accent: '#4c1d95', bg: '#ede9fe', border: 'rgba(76,29,149,0.4)' },
  { key: 'hands', href: '/hands', name: 'Hands', tag: 'the daily poker solitaire', store: 'sot_hands_day', accent: '#7f1d1d', bg: '#f6eaea', border: 'rgba(127,29,29,0.4)' },
  { key: 'chain', href: '/chain', name: 'Chain', tag: 'take them, or leave them', store: 'sot_chain_day', accent: '#4a044e', bg: '#f6ecf8', border: 'rgba(74,4,78,0.4)' },
  { key: 'suffice', href: '/suffice', name: 'Suffice', tag: 'decide what is enough', store: 'sot_suffice_day', accent: '#4338ca', bg: '#eef0ff', border: 'rgba(67,56,202,0.4)' },
  { key: 'turn', href: '/turn', name: 'Turn', tag: 'ten squares left', store: 'sot_turn_day', accent: '#226218', bg: '#e9f3e6', border: 'rgba(34,98,24,0.4)' },
  { key: 'strata', href: '/strata', name: 'Strata', tag: 'dig the words out', store: 'sot_strata_day', accent: '#9a3412', bg: '#fdf0e7', border: 'rgba(154,52,18,0.4)' },
  { key: 'chomp', href: '/chomp', name: 'Chomp', tag: 'eat them in order', store: 'sot_chomp_day', accent: '#a8430f', bg: '#fbeadf', border: 'rgba(168,67,15,0.4)' },
  { key: 'sweep', href: '/sweep', name: 'Sweep', tag: 'no bottom edge', store: 'sot_sweep_day', accent: '#0f766e', bg: '#e2f2f0', border: 'rgba(15,118,110,0.4)' },
  { key: 'blocks', href: '/blocks', name: 'Blocks', tag: 'same shapes, same order', store: 'sot_blocks_day', accent: '#1d4ed8', bg: '#e8edfa', border: 'rgba(29,78,216,0.4)' },
  { key: 'docket', href: '/docket', name: 'Docket', tag: 'one setup, five deductions', store: 'sot_docket_day', accent: '#5b2333', bg: '#f7e8ec', border: 'rgba(91,35,51,0.4)' },
  { key: 'defend', href: '/defend', name: 'Defend', tag: 'black to play and survive', store: 'sot_defend_day', accent: '#2f4f4f', bg: '#e9f0ef', border: 'rgba(47,79,79,0.4)' },
  { key: 'blitz', href: '/blitz', name: 'Blitz', tag: 'twenty problems, one life', store: 'sot_blitz_day', accent: '#657512', bg: '#f3f7de', border: 'rgba(101,117,18,0.4)' },
  { key: 'sums', href: '/sums', name: 'Sums', tag: 'the daily kakuro', store: 'sot_sums_day', accent: '#be185d', bg: '#fce7f3', border: 'rgba(190,24,93,0.4)' },
  { key: 'blitzed', href: '/blitzed', name: 'Blitzed', tag: 'twenty problems, three numbers each', store: 'sot_blitzed_day', accent: '#3f6d1f', bg: '#eaf5e2', border: 'rgba(63,109,31,0.4)' },
  { key: 'paths', href: '/paths', name: 'Paths', tag: 'link every town', store: 'sot_paths_day', accent: '#065f46', bg: '#e6f4ee', border: 'rgba(6,95,70,0.4)' },
  { key: 'deep', href: '/deep', name: 'Deep', tag: 'one topic, fifteen questions', store: 'sot_deep_day', accent: '#0c4a6e', bg: '#e6f1f8', border: 'rgba(12,74,110,0.4)' },
  { key: 'anon', href: '/anon', name: 'Anon', tag: 'a clueless acrostic', store: 'sot_anon_day', accent: '#8c2f39', bg: '#f8ecee', border: 'rgba(140,47,57,0.4)' },
  { key: 'redact', href: '/redact', name: 'Redact', tag: 'uncover the article', store: 'sot_redact_day', accent: '#27272a', bg: '#f4f4f5', border: 'rgba(39,39,42,0.4)' },
  { key: 'plot', href: '/plot', name: 'Plot', tag: 'divide the whole board', store: 'sot_plot_day', accent: '#78350f', bg: '#fbf1e5', border: 'rgba(120,53,15,0.4)' },
  { key: 'towers', href: '/towers', name: 'Towers', tag: 'the daily skyscrapers puzzle', store: 'sot_towers_day', accent: '#075985', bg: '#eaf4fa', border: 'rgba(7,89,133,0.4)' },
  { key: 'mercury', href: '/mercury', name: 'Mercury', tag: 'the daily thermo sudoku', store: 'sot_mercury_day', accent: '#991b1b', bg: '#fdf1f1', border: 'rgba(153,27,27,0.4)' },
  { key: 'polka', href: '/polka', name: 'Polka', tag: 'the daily kropki sudoku', store: 'sot_polka_day', accent: '#16a34a', bg: '#ecf9f1', border: 'rgba(22,163,74,0.4)' },
  { key: 'diag', href: '/diag', name: 'Diag', tag: 'the daily diagonal sudoku', store: 'sot_diag_day', accent: '#0e7490', bg: '#e8f6fa', border: 'rgba(14,116,144,0.4)' },
  { key: 'frame', href: '/frame', name: 'Frame', tag: 'the daily frame sudoku', store: 'sot_frame_day', accent: '#b45309', bg: '#fdf3e3', border: 'rgba(180,83,9,0.4)' },
  { key: 'rim', href: '/rim', name: 'Rim', tag: 'the daily outside sudoku', store: 'sot_rim_day', accent: '#4d7c0f', bg: '#f1f8e6', border: 'rgba(77,124,15,0.4)' },
  { key: 'whittle', href: '/whittle', name: 'Whittle', tag: 'the sudoku, backwards', store: 'sot_whittle_day', accent: '#854d0e', bg: '#fdf6e9', border: 'rgba(133,77,14,0.4)' },
  { key: 'knight', href: '/knight', name: 'Knight', tag: 'the daily anti-knight sudoku', store: 'sot_knight_day', accent: '#3730a3', bg: '#f1f0fd', border: 'rgba(55,48,163,0.4)' },
  { key: 'shoe', href: '/shoe', name: 'Shoe', tag: 'the daily blackjack shoe', store: 'sot_shoe_day', accent: '#0c4a6e', bg: '#e8f3fa', border: 'rgba(12,74,110,0.4)' },
  { key: 'queen', href: '/queen', name: 'Queen', tag: 'white to play and promote', store: 'sot_queen_day', accent: '#a16207', bg: '#faf3e3', border: 'rgba(161,98,7,0.4)' },
  { key: 'sport', href: '/sport', name: 'Sport', tag: 'every sport, one life', store: 'sot_sport_day', accent: '#7c2d12', bg: '#fbeee6', border: 'rgba(124,45,18,0.4)' },
  { key: 'calc', href: '/calc', name: 'Calc', tag: 'walk the calculator', store: 'sot_calc_day', accent: '#be123c', bg: '#fff1f4', border: 'rgba(190,18,60,0.4)' },
  { key: 'encore', href: '/encore', name: 'Encore', tag: 'the daily crossword', store: 'sot_encore_day', accent: '#1d4ed8', bg: '#eff6ff', border: 'rgba(29,78,216,0.4)' },
  { key: 'biz', href: '/biz', name: 'Biz', tag: 'business, one life', store: 'sot_biz_day', accent: '#0f5132', bg: '#e9f5ee', border: 'rgba(15,81,50,0.4)' },
  { key: 'flank', href: '/flank', name: 'Flank', tag: 'name every neighbor', store: 'sot_flank_day', accent: '#3f6212', bg: '#f3f8ea', border: 'rgba(63,98,18,0.4)' },
  { key: 'script', href: '/script', name: 'Script', tag: 'movies and TV, one life', store: 'sot_script_day', accent: '#4a1d6b', bg: '#f3ecf9', border: 'rgba(74,29,107,0.4)' },
  { key: 'quotes', href: '/quotes', name: 'Quotes', tag: 'who said it, one life', store: 'sot_quotes_day', accent: '#3d4f7c', bg: '#eef1f8', border: 'rgba(61,79,124,0.4)' },
  { key: 'focus', href: '/focus', name: 'Focus', tag: 'name the zoomed-in photo', store: 'sot_focus_day', accent: '#8a4b08', bg: '#fdf3e6', border: 'rgba(138,75,8,0.4)' },
  { key: 'thread', href: '/thread', name: 'Thread', tag: 'nine films described badly, one thread', store: 'sot_thread_day', accent: '#8b2c6b', bg: '#f7e9f2', border: 'rgba(139,44,107,0.4)' },
  { key: 'slot', href: '/slot', name: 'Slot', tag: 'ten things, one at a time', store: 'sot_slot_day', accent: '#4a5d23', bg: '#eef2e3', border: 'rgba(74,93,35,0.4)' },
  { key: 'atlas', href: '/atlas', name: 'Atlas', tag: 'twenty-five questions, one life', store: 'sot_atlas_day', accent: '#047857', bg: '#e7f4ee', border: 'rgba(4,120,87,0.4)' },
  { key: 'niche', href: '/niche', name: 'Niche', tag: 'one answer, two categories', store: 'sot_niche_day', accent: '#115e59', bg: '#ecfdf8', border: 'rgba(17,94,89,0.4)' },
  { key: 'sixes', href: '/sixes', name: 'Sixes', tag: 'the daily mini sudoku', store: 'sot_sixes_day', accent: '#1d4ed8', bg: '#eef3ff', border: 'rgba(29,78,216,0.4)' },
  { key: 'barter', href: '/barter', name: 'Barter', tag: 'trade the letters home', store: 'sot_barter_day', accent: '#be123c', bg: '#fdeef2', border: 'rgba(190,18,60,0.4)' },
// Retired games (RETIRED_DAILY in lib/daily-games) are never promoted: their
// bank has no next drop to sell.
].filter((g) => !isRetiredDaily(g.key));

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function DailyGamesPromo({ self, refresh }) {
  const [open, setOpen] = useState([]);
  // Games the signed-in player already finished TODAY on ANY device (from the
  // server), so a game done on their phone drops off this list here too. Null
  // until the fetch resolves; localStorage still gates the first paint.
  const [serverDoneToday, setServerDoneToday] = useState(null);

  useEffect(() => {
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    const qs = new URLSearchParams();
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    let alive = true;
    fetch('/api/quiz/daily-status?' + qs.toString())
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d) return;
        const [Y, M, D] = etToday().split('-').map(Number);
        const yy = Y % 100; // today's quizId per game is `<key>-<M>-<D>-<YY>`
        const playedSet = new Set(d.played || []);
        const done = new Set();
        for (const g of DAILY_GAMES) { if (playedSet.has(`${g.key}-${M}-${D}-${yy}`)) done.add(g.key); }
        setServerDoneToday(done);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [refresh]);

  useEffect(() => {
    const today = etToday();
    const pending = DAILY_GAMES.filter((g) => {
      if (g.key === self) return false;
      if (serverDoneToday && serverDoneToday.has(g.key)) return false;
      try {
        const c = JSON.parse(localStorage.getItem(g.store) || 'null');
        return !(c && c.d === today && c.done);
      } catch (e) { return true; }
    });
    setOpen(pending);
  }, [self, refresh, serverDoneToday]);
  if (!open.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: T.muted, marginBottom: 7 }}>
        Still on the table today
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {open.map((g) => (
          <a key={g.key} href={g.href}
            style={{ display: 'block', padding: '9px 13px', borderRadius: 10, background: g.bg, border: `1.5px solid ${g.border}`, textDecoration: 'none', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: T.ink }}>
            <b style={{ color: g.accent }}>{g.name}</b> &mdash; {g.tag} &rarr;
          </a>
        ))}
      </div>
    </div>
  );
}
