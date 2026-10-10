// Verify the Glyph bank (app/glyph/puzzles.js), the daily codeword. Run after
// ANY edit:  node scripts/verify-glyph.mjs
//
// Per puzzle, RECOMPUTED and never trusted from the stored fields:
//   key        must be a true permutation of A-Z (26 distinct uppercase
//              letters; the header says "all 26 letters appear on every
//              board").
//   given      weekdays reveal 3 numbers, Sundays reveal 2 (per the header,
//              note this is FEWER on the bigger Sunday grid, which is correct
//              and intentional, not a bug); every given number must actually
//              occur on the board.
//   w / h      weekdays 15x15, Sundays 17x17 (per the header); every row must
//              actually be that width, and the row count must match `h`.
//   words      the declared word count is recomputed by scanning `rows` for
//              every across/down run of length >= 2 and must match exactly.
//   solvability + uniqueness: proved, not assumed. This is the puzzle's core
//              claim ("EXACTLY ONE consistent letter mapping... solvable by
//              deduction and never by guesswork"), so it is checked with a
//              real constraint-propagation solver (naked singles + hidden
//              singles on the number<->letter permutation, plus dictionary
//              pattern-filtering per across/down run, to a fixpoint) backed
//              by a bounded backtracking search that proves the count of
//              valid completions (capped at 2). A board whose true dictionary
//              answer is outside the site's own word list (this bank ships a
//              handful, e.g. ZEN) is supplemented with its own intended word
//              for solving purposes ONLY, so a dictionary gap does not read as
//              a puzzle defect — but it is still reported as a REVIEW note,
//              same as emcee/crux's non-dictionary reporting. A board that
//              resolves to 2+ distinct valid mappings is a genuine ambiguity
//              and a hard FAIL.
//   run length every run must be 3-8 letters. Two is not a hard puzzle, it is
//              a coin flip (a codeword gives no clue, so nothing separates the
//              dozens of two-letter words), and the site dictionary stops at
//              eight, so a nine-letter run has an empty candidate pool and can
//              only be "solved" by the supplement below. The whole live bank
//              already sits inside 3-8; this check is what keeps it there.
//   variety    no answer may appear more than WORD_CEILING times across the
//              boards live on or after WORD_CEILING_FROM. A per-board check
//              passes happily on a bank that says ZOO every third day, which
//              is the failure mode CLAUDE.md's bank-extension rule 3 is about.
//              Scoped by date because the boards before it are shipped history
//              (ZOO runs to seven times there) and history is never rewritten.
//   spelling   any run that decodes to a British-only SPELLING VARIANT
//              (COLOUR, LABOUR, etc, see BRITISH below) is a hard FAIL,
//              independent of
//              whether the dictionary happens to contain it — the site is
//              US-spelling only, and a codeword answer being "a real word" is
//              not sufficient if it is the wrong regional spelling.
//   blocklist  any run that decodes to a word on scripts/glyph-blocklist.mjs
//              (sexual and bodily words, slurs and identity terms, weapons,
//              disease and drug terms, proper nouns, obscure abbreviations) is
//              a hard FAIL on boards live on or after GLYPH_BLOCK_FROM
//              (2026-10-10). Earlier boards are shipped history.
//   sunday     must equal the true UTC weekday of `live`; quizId/live/num
//              internally consistent (mirrors the alibi checks).
//
// GRANDFATHER: a board whose `live` date is before GLYPH_FLOOR_FROM
// (2026-08-03) is already-played history; a solvability/uniqueness defect
// found there is reported as a note, never a hard FAIL, exactly like
// verify-daily-banks.mjs's CRUX_FLOOR_FROM. Everything live on or after that
// date is still editable and a hard FAIL. The dictionary-word-list source is
// public/tuck-dict.txt, same as every other verifier in this repo.
//
// Performance: propagation converges in a handful of iterations for nearly
// every board; the rare board that needs backtracking resolves in single-digit
// nodes once propagation has narrowed it. Full bank (49 boards, 7 of them
// 17x17 Sundays) runs in a couple of seconds. NODECAP bounds worst case.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PUZZLES } from '../app/glyph/puzzles.js';
import { isGlyphBlocked, GLYPH_BLOCK_FROM } from './glyph-blocklist.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const GLYPH_FLOOR_FROM = '2026-08-03';
const WORD_CEILING = 3;
const WORD_CEILING_FROM = '2026-09-20';
const MIN_RUN = 3, MAX_RUN = 8;
const NODECAP = 2_000_000;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const dictRaw = readFileSync(join(here, '../public/tuck-dict.txt'), 'utf8').trim().split('\n');
const byLen = new Map();
for (const w of dictRaw) {
  const u = w.toUpperCase();
  if (!byLen.has(u.length)) byLen.set(u.length, []);
  byLen.get(u.length).push(u);
}

// British-only spellings a US site must never surface as a codeword answer.
// Curated, not exhaustive; extend it whenever a new one turns up. This is the
// hard-fail list; AMONGST (live 2026-09-04) is the confirmed defect that
// motivated this script.
const BRITISH = new Set([
  // AMONGST and WHILST are formal but perfectly valid American English, so
  // they are NOT on this list. The list is spelling variants only.
  'COLOUR', 'COLOURS', 'COLOURED', 'COLOURFUL', 'FAVOUR', 'FAVOURS',
  'FAVOURITE', 'FAVOURABLE', 'HONOUR', 'HONOURS', 'HONOURED', 'HONOURABLE', 'NEIGHBOUR',
  'NEIGHBOURS', 'NEIGHBOURHOOD', 'THEATRE', 'THEATRES', 'CENTRE', 'CENTRES', 'CENTRED',
  'METRE', 'METRES', 'LITRE', 'LITRES', 'DEFENCE', 'OFFENCE', 'LICENCE', 'LICENCED',
  'PROGRAMME', 'PROGRAMMES', 'CHEQUE', 'CHEQUES', 'TRAVELLED', 'TRAVELLING', 'TRAVELLER',
  'TRAVELLERS', 'CANCELLED', 'CANCELLING', 'MODELLED', 'MODELLING', 'LABELLED', 'LABELLING',
  'JEWELLERY', 'ALUMINIUM', 'MOULD', 'MOULDY', 'MOULDING', 'SMOULDER', 'PLOUGH', 'PLOUGHED',
  'TYRE', 'TYRES', 'KERB', 'KERBS', 'ARTEFACT', 'ARTEFACTS', 'MANOEUVRE', 'MANOEUVRES',
  'ENCYCLOPAEDIA', 'AEROPLANE', 'AEROPLANES', 'PYJAMAS', 'LEARNT', 'SPELT', 'DREAMT',
  'REALISE', 'REALISED', 'REALISING', 'REALISATION', 'ORGANISE', 'ORGANISED', 'ORGANISING',
  'ORGANISATION', 'ANALYSE', 'ANALYSED', 'ANALYSING', 'APOLOGISE', 'APOLOGISED', 'CRITICISE',
  'CRITICISED', 'RECOGNISE', 'RECOGNISED', 'CATALOGUE', 'CATALOGUES', 'DIALOGUE', 'DIALOGUES',
  'STOREY', 'STOREYS', 'COSY', 'COSIER', 'COSIEST', 'SCEPTIC', 'SCEPTICS', 'SCEPTICAL',
  'PRACTISE', 'PRACTISED', 'PRACTISING', 'ENROL', 'ENROLLED', 'ENROLLING', 'ENROLMENT',
  'FULFIL', 'FULFILLED', 'FULFILLING', 'FULFILMENT', 'SKILFUL', 'WILFUL', 'INSTALMENT',
  'INSTALMENTS', 'GAOL', 'GAOLED', 'DRAUGHT', 'DRAUGHTS', 'HUMOUR', 'HUMOURED', 'HUMOROUS',
  'RUMOUR', 'RUMOURS', 'RUMOURED', 'LABOUR', 'LABOURS', 'LABOURED', 'LABOURER', 'LABOURERS',
  'VAPOUR', 'VAPOURS', 'ARMOUR', 'ARMOURED', 'ARMOURY', 'SAVOUR', 'SAVOURY', 'FLAVOUR',
  'FLAVOURS', 'FLAVOURFUL', 'FLAVOURED', 'ENDEAVOUR', 'ENDEAVOURS', 'HARBOUR', 'HARBOURS',
  'VIGOUR', 'VALOUR', 'BEHAVIOUR', 'BEHAVIOURAL', 'SULPHUR', 'OESTROGEN', 'FOETUS', 'FOETAL',
  'PAEDIATRIC', 'ORTHOPAEDIC', 'ANAEMIA', 'ANAEMIC', 'DIARRHOEA', 'HAEMOGLOBIN', 'MEDIAEVAL',
  // Extended 2026-08-21 while banking the Sep 20 - Nov 19 range, which surfaced
  // FIBRE from the Zipf 3.0 fill pool: the original list covered the famous
  // -our and -ise families but not the -re family beyond CENTRE/METRE/LITRE.
  'FIBRE', 'FIBRES', 'SABRE', 'SABRES', 'CALIBRE', 'CALIBRES', 'SPECTRE', 'SPECTRES', 'LUSTRE',
  'SOMBRE', 'MEAGRE', 'OCHRE', 'MITRE', 'GREY', 'GREYER', 'GREYISH', 'ODOUR', 'ODOURS', 'ARDOUR',
  'CLAMOUR', 'CANDOUR', 'FERVOUR', 'PARLOUR', 'PARLOURS', 'RANCOUR', 'SPLENDOUR', 'TUMOUR',
  'TUMOURS', 'DEMEANOUR', 'PRETENCE', 'PRETENCES', 'DEFENCES', 'OFFENCES', 'JEWELLER',
  'JEWELLERS', 'MARVELLED', 'MARVELLING', 'LEVELLED', 'LEVELLING', 'SIGNALLED', 'SIGNALLING',
  'TOTALLED', 'FUELLED', 'FUELLING', 'QUARRELLED', 'COUNSELLOR', 'COUNSELLORS', 'MOULDS',
  'MOULDED', 'SMOULDERS', 'SMOULDERING', 'PLOUGHS', 'PLOUGHING', 'KERBED', 'MOULTED',
  'EMPHASISE', 'EMPHASISED', 'MEMORISE', 'MEMORISED', 'MINIMISE', 'MINIMISED', 'MAXIMISE',
  'MAXIMISED', 'SUMMARISE', 'SUMMARISED', 'SPECIALISE', 'SPECIALISED', 'UTILISE', 'UTILISED',
  'PENALISE', 'PENALISED', 'CIVILISE', 'CIVILISED', 'MOBILISE', 'MOBILISED', 'PRIORITISE',
  'HYPNOTISE', 'FANTASISE', 'ORGANISES', 'RECOGNISES', 'APOLOGISES', 'CRITICISES', 'REALISES',
  'COLOURING', 'HONOURING', 'FAVOURING', 'LABOURING',
  // Added 2026-08-21, when SAVIOUR was found on glyph-8-23-26. That board was
  // banked but not yet played, so it was regenerated rather than grandfathered,
  // and the rest of the -our family went on with it: the fill pool carries all
  // of them and only one had surfaced so far. Checked against the whole bank
  // before adding, no live board decodes to any of these.
  'SAVIOUR', 'SAVIOURS', 'ARMOUR', 'ARMOURS', 'ARMOURED', 'ARMOURY', 'RUMOUR',
  'RUMOURS', 'RUMOURED', 'HUMOUR', 'HUMOURS', 'HUMOURED', 'HARBOUR', 'HARBOURS',
  'HARBOURED', 'ENDEAVOUR', 'ENDEAVOURS', 'BEHAVIOUR', 'BEHAVIOURS', 'SPLENDOUR',
  'SPLENDOURS', 'VAPOUR', 'VAPOURS', 'ODOUR', 'ODOURS', 'CLAMOUR', 'CLAMOURS',
  'PARLOUR', 'PARLOURS', 'SAVOUR', 'SAVOURS', 'SAVOURED', 'SAVOURY',
]);

const fail = (id, msg) => { BAD++; console.error(`✗ ${id}: ${msg}`); };
const ok = (id, msg) => console.log(`✓ ${id}  ${msg}`);
const note = (id, msg) => console.log(`… ${id}  ${msg}`);
let BAD = 0;

function runsOf(p) {
  const H = p.h, W = p.w;
  const blocks = p.rows.map((r) => r.split('').map((ch) => ch === '.'));
  const nums = p.rows.map((r) => r.split('').map((ch) => (ch === '.' ? -1 : ch.charCodeAt(0) - 97 + 1)));
  const runs = [];
  for (let r = 0; r < H; r++) { let c = 0; while (c < W) { if (!blocks[r][c]) { const arr = []; while (c < W && !blocks[r][c]) { arr.push(nums[r][c]); c++; } if (arr.length >= 2) runs.push(arr); } else c++; } }
  for (let c = 0; c < W; c++) { let r = 0; while (r < H) { if (!blocks[r][c]) { const arr = []; while (r < H && !blocks[r][c]) { arr.push(nums[r][c]); r++; } if (arr.length >= 2) runs.push(arr); } else r++; } }
  return runs;
}

function decodedWord(run, keyArr) { return run.map((n) => keyArr[n - 1]).join(''); }

function propagate(cand, runs, poolByLen) {
  while (true) {
    let changed = false;
    const singles = new Map();
    for (let n = 1; n <= 26; n++) if (cand[n].size === 1) singles.set(n, [...cand[n]][0]);
    const used = new Set(singles.values());
    for (let n = 1; n <= 26; n++) { if (cand[n].size === 1) continue; for (const L of [...cand[n]]) if (used.has(L)) { cand[n].delete(L); changed = true; } }
    for (const L of ALPHABET) {
      const fits = []; for (let n = 1; n <= 26; n++) if (cand[n].has(L)) fits.push(n);
      if (fits.length === 1 && cand[fits[0]].size > 1) { cand[fits[0]] = new Set([L]); changed = true; }
    }
    for (const run of runs) {
      const len = run.length, pool = poolByLen.get(len) || [];
      const compat = pool.filter((w) => { for (let i = 0; i < len; i++) if (!cand[run[i]].has(w[i])) return false; return true; });
      if (compat.length === 0) return { error: `no dictionary word compatible with run of length ${len} (numbers ${run.join(',')})` };
      for (let i = 0; i < len; i++) {
        const observed = new Set(compat.map((w) => w[i]));
        const before = cand[run[i]].size;
        for (const L of [...cand[run[i]]]) if (!observed.has(L)) cand[run[i]].delete(L);
        if (cand[run[i]].size !== before) changed = true;
      }
    }
    if (!changed) return {};
  }
}

// Proves the count of valid full number->letter assignments (capped at `cap`)
// consistent with the givens and with every run decoding to a pool word.
function solveGlyph(p, runs, poolByLen, cap = 2) {
  const cand0 = Array.from({ length: 27 }, () => new Set(ALPHABET.split('')));
  for (const n of p.given) cand0[n] = new Set([p.key[n - 1]]);
  const pr = propagate(cand0, runs, poolByLen);
  if (pr.error) return { solutions: [], error: pr.error };
  let nodes = 0, capped = false;
  const found = [];
  function fullyAssigned(cand) { for (let n = 1; n <= 26; n++) if (cand[n].size !== 1) return false; return true; }
  function runsOK(cand) {
    for (const run of runs) {
      if (!run.every((n) => cand[n].size === 1)) continue;
      const w = decodedWord(run, Array.from({ length: 26 }, (_, i) => [...cand[i + 1]][0]));
      if (!(poolByLen.get(run.length) || []).includes(w)) return false;
    }
    return true;
  }
  function rec(cand) {
    if (found.length >= cap || capped) return;
    if (++nodes > NODECAP) { capped = true; return; }
    const pr2 = propagate(cand, runs, poolByLen);
    if (pr2.error) return;
    if (!runsOK(cand)) return;
    if (fullyAssigned(cand)) { found.push(Array.from({ length: 26 }, (_, i) => [...cand[i + 1]][0]).join('')); return; }
    let best = -1, bestSize = 99;
    for (let n = 1; n <= 26; n++) if (cand[n].size > 1 && cand[n].size < bestSize) { bestSize = cand[n].size; best = n; }
    for (const L of [...cand[best]]) {
      let usedElsewhere = false;
      for (let n = 1; n <= 26; n++) if (n !== best && cand[n].size === 1 && [...cand[n]][0] === L) { usedElsewhere = true; break; }
      if (usedElsewhere) continue;
      const c2 = cand.map((s) => new Set(s));
      c2[best] = new Set([L]);
      rec(c2);
      if (found.length >= cap || capped) return;
    }
  }
  rec(cand0);
  return { solutions: found, capped };
}

PUZZLES.forEach((p, i) => {
  const errs = [];
  const notes = [];

  // ── identity / date consistency ─────────────────────────────────────────
  if (p.num !== i + 1) errs.push(`num ${p.num} != ${i + 1}`);
  const m = p.quizId.match(/^glyph-(\d+)-(\d+)-(\d+)$/);
  if (!m) errs.push('bad quizId');
  else {
    const iso = `20${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    if (iso !== p.live) errs.push(`live ${p.live} != quizId date ${iso}`);
    const isSun = new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0;
    if (p.sunday !== isSun) errs.push(`sunday must be ${isSun} for ${p.live}`);
  }

  // ── dimensions / given / key shape ──────────────────────────────────────
  const wantDim = p.sunday ? 17 : 15;
  if (p.w !== wantDim || p.h !== wantDim) errs.push(`dims ${p.w}x${p.h}, want ${wantDim}x${wantDim} (${p.sunday ? 'Sunday' : 'weekday'})`);
  if (!Array.isArray(p.rows) || p.rows.length !== p.h) errs.push(`rows has ${p.rows?.length} entries, want h=${p.h}`);
  else for (const r of p.rows) if (r.length !== p.w) errs.push(`a row is ${r.length} wide, want w=${p.w}`);
  const wantGiven = p.sunday ? 2 : 3;
  if (!Array.isArray(p.given) || p.given.length !== wantGiven) errs.push(`given has ${p.given?.length} numbers, want ${wantGiven}`);
  if (typeof p.key !== 'string' || p.key.length !== 26 || new Set(p.key).size !== 26 || !/^[A-Z]{26}$/.test(p.key)) errs.push('key is not a 26-letter permutation of A-Z');

  if (!errs.length) {
    const runs = runsOf(p);
    if (runs.length !== p.words) errs.push(`words=${p.words}, but the grid actually has ${runs.length} runs of length >= 2`);

    const badLen = runs.filter((r) => r.length < MIN_RUN || r.length > MAX_RUN).map((r) => r.length);
    if (badLen.length) errs.push(`run length(s) outside ${MIN_RUN}-${MAX_RUN}: ${[...new Set(badLen)].join(', ')}`);

    const onBoard = new Set();
    for (const run of runs) for (const n of run) onBoard.add(n);
    for (const g of p.given) if (!onBoard.has(g)) errs.push(`given number ${g} does not appear on the board`);

    // supplement the pool with each run's true decoded word, so a dictionary
    // gap (e.g. ZEN, missing from tuck-dict.txt) doesn't masquerade as an
    // unsolvable board; it is still flagged below as a REVIEW note.
    const poolByLen = new Map(byLen);
    const dictGaps = [];
    const britishHits = [];
    for (const run of runs) {
      const w = decodedWord(run, p.key.split(''));
      if (BRITISH.has(w)) britishHits.push(w);
      const pool = poolByLen.get(run.length) || [];
      if (!pool.includes(w)) { poolByLen.set(run.length, [...pool, w]); dictGaps.push(w); }
    }
    if (p.live >= GLYPH_BLOCK_FROM) {
      const blocked = runs.map((run) => decodedWord(run, p.key.split(''))).filter(isGlyphBlocked);
      if (blocked.length) errs.push(`blocklisted fill word(s) (scripts/glyph-blocklist.mjs): ${[...new Set(blocked)].join(', ')}`);
    }
    if (britishHits.length) errs.push(`British-only spelling on the board: ${[...new Set(britishHits)].join(', ')}`);
    if (dictGaps.length) notes.push(`words not in the site dictionary (supplemented for solving, review for legitimacy): ${[...new Set(dictGaps)].join(', ')}`);

    const { solutions, capped, error } = solveGlyph(p, runs, poolByLen);
    if (error) {
      // Should not happen (the true key's word was just supplemented in), but
      // report plainly if it does.
      const msg = `solver error: ${error}`;
      if (p.live >= GLYPH_FLOOR_FROM) errs.push(msg); else notes.push(`GRANDFATHERED (live ${p.live} < ${GLYPH_FLOOR_FROM}): ${msg}`);
    } else if (capped) {
      const msg = 'uniqueness search hit the node cap, so uniqueness is NOT proven';
      if (p.live >= GLYPH_FLOOR_FROM) errs.push(msg); else notes.push(`GRANDFATHERED (live ${p.live} < ${GLYPH_FLOOR_FROM}): ${msg}`);
    } else if (solutions.length !== 1) {
      const msg = `NOT UNIQUE: ${solutions.length} valid letter mappings satisfy the grid (e.g. ${solutions.slice(0, 2).join(' vs ')})`;
      if (p.live >= GLYPH_FLOOR_FROM) errs.push(msg); else notes.push(`GRANDFATHERED (live ${p.live} < ${GLYPH_FLOOR_FROM}): ${msg}`);
    } else if (solutions[0] !== p.key) {
      errs.push(`unique solved key ${solutions[0]} != stored key ${p.key}`);
    }
  }

  // The past is frozen: a board already played is never rewritten, so any
  // defect found on it is a note, not a failure. (CLAUDE.md, Daily puzzle
  // authoring standard, rule 10.)
  if (errs.length && p.live < GLYPH_FLOOR_FROM) {
    notes.push(...errs.map((e) => `GRANDFATHERED (live ${p.live} < ${GLYPH_FLOOR_FROM}): ${e}`));
    errs.length = 0;
  }
  if (errs.length) fail(p.quizId, errs.join('; '));
  else ok(p.quizId, `${p.w}x${p.h}, ${p.words} words, unique mapping confirmed${notes.length ? ` — ${notes.join(' | ')}` : ''}`);
  if (errs.length) for (const n of notes) note(p.quizId, n);
});

// ── bank-level sanity: no two boards should ship an identical key or grid ──
{
  const keyCount = new Map(), rowsCount = new Map();
  for (const p of PUZZLES) {
    keyCount.set(p.key, (keyCount.get(p.key) || 0) + 1);
    const rk = p.rows.join('|');
    rowsCount.set(rk, (rowsCount.get(rk) || 0) + 1);
  }
  // variety across the whole bank, not per board (see WORD_CEILING above)
  const useCount = new Map();
  for (const p of PUZZLES) {
    if (p.live < WORD_CEILING_FROM) continue;
    for (const run of runsOf(p)) {
      const w = decodedWord(run, p.key.split(''));
      useCount.set(w, (useCount.get(w) || 0) + 1);
    }
  }
  const over = [...useCount.entries()].filter(([, n]) => n > WORD_CEILING).sort((a, b) => b[1] - a[1]);
  if (over.length) fail('glyph pool (answers)', `answer(s) over the ${WORD_CEILING}-use ceiling since ${WORD_CEILING_FROM}: ${over.slice(0, 8).map(([w, n]) => `${w} x${n}`).join(', ')}`);
  else ok('glyph pool (answers)', `no answer used more than ${WORD_CEILING} times since ${WORD_CEILING_FROM} (${useCount.size} distinct answers)`);

  const dupKeys = [...keyCount.entries()].filter(([, n]) => n > 1);
  const dupRows = [...rowsCount.entries()].filter(([, n]) => n > 1);
  if (dupKeys.length) fail('glyph pool (key)', `identical key reused across boards: ${dupKeys.length} case(s)`);
  else ok('glyph pool (key)', 'no two boards share a key');
  if (dupRows.length) fail('glyph pool (grid)', `identical grid reused across boards: ${dupRows.length} case(s)`);
  else ok('glyph pool (grid)', 'no two boards share a grid');
}

console.log(BAD ? `\n${BAD} FAILURE(S)` : '\nAll Glyph boards verified.');
process.exit(BAD ? 1 : 0);
