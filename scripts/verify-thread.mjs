#!/usr/bin/env node
// scripts/verify-thread.mjs — the Thread bank, checked.
//
//   node scripts/verify-thread.mjs
//
// Thread has no facts to freeze and no dictionary, so everything that can go
// wrong is in the board's own shape, and every rule in the puzzles.js header
// is enforced here. Exit code is non-zero on any failure, with ✗ / … prefixes,
// so verify-all picks it up.
//   1. consecutive ET days, numbered 1..N, quizIds in the thread-M-D-YY shape,
//      `sunday` true exactly on real Sundays;
//   2. nine tiles + one thread on a weekday, sixteen tiles + two threads of
//      eight on a Sunday, every tile in exactly one thread;
//   3. no logline contains its own title, any of its keys, or any key of the
//      board's threads (the sentence must never say the answer);
//   4. every decoy covers strictly fewer tiles than the board and names real
//      indices, so the true thread is the only thing covering every tile;
//   5. the collision audit, through the REAL matcher (app/thread/match.js):
//      each tile's own title credits that tile and no other, in play order,
//      with every earlier tile both open and solved; a thread key never hits
//      a tile; a decoy key never hits a thread;
//   6. no film returns inside 60 days and no thread ever returns.
import { PUZZLES } from '../app/thread/puzzles.js';
import { norm, tileFor, anyKey, keyHit } from '../app/thread/match.js';
import { scanUS } from './us-spellings.mjs';

let fails = 0;
const bad = (m) => { fails++; console.log('✗ ' + m); };
const ok = (m) => console.log('… ' + m);

// 1. shape of the bank
let prev = null;
PUZZLES.forEach((p, i) => {
  if (p.num !== i + 1) bad(`num ${p.num} at index ${i}`);
  const d = new Date(`${p.live}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) bad(`bad live date ${p.live}`);
  if (prev && d - prev !== 86400000) bad(`gap before ${p.live}`);
  prev = d;
  const [y, m, day] = p.live.split('-').map(Number);
  const want = `thread-${m}-${day}-${String(y).slice(2)}`;
  if (p.quizId !== want) bad(`quizId ${p.quizId} should be ${want}`);
  const isSun = d.getUTCDay() === 0;
  if (!!p.sunday !== isSun) bad(`#${p.num} ${p.live}: sunday=${!!p.sunday} but the date ${isSun ? 'is' : 'is not'} a Sunday`);
});
ok(`${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}`);

// 2. board shape
for (const p of PUZZLES) {
  const nT = p.sunday ? 16 : 9, nTh = p.sunday ? 2 : 1;
  if (p.tiles.length !== nT) bad(`#${p.num}: ${p.tiles.length} tiles, want ${nT}`);
  if (p.threads.length !== nTh) bad(`#${p.num}: ${p.threads.length} threads, want ${nTh}`);
  const seen = new Map();
  for (const [ti, th] of p.threads.entries()) {
    if (!th.t || !Array.isArray(th.keys) || !th.keys.length) bad(`#${p.num} thread ${ti} has no name or keys`);
    if (th.tiles.length !== nT / nTh) bad(`#${p.num} thread "${th.t}" covers ${th.tiles.length}, want ${nT / nTh}`);
    for (const x of th.tiles) {
      if (!(Number.isInteger(x) && x >= 0 && x < nT)) bad(`#${p.num} thread "${th.t}" names tile ${x}`);
      if (seen.has(x)) bad(`#${p.num} tile ${x} is in two threads`); else seen.set(x, ti);
    }
  }
  if (seen.size !== nT) bad(`#${p.num}: ${nT - seen.size} tiles belong to no thread`);
  for (const [i, t] of p.tiles.entries()) {
    if (!t.t || !t.s || !Array.isArray(t.keys) || !t.keys.length) bad(`#${p.num} tile ${i} is missing a title, a logline or keys`);
    if (t.s && !/[.!?]$/.test(t.s.trim())) bad(`#${p.num} tile ${i} ("${t.t}"): logline does not end in a full stop`);
    if (/—/.test(t.s || '') || /—/.test(t.t || '')) bad(`#${p.num} tile ${i}: em dash in reader-facing copy`);
  }
}
ok('every board has its tiles and threads, and every tile has one thread');

// 3. the sentence never says the answer
// The same test the player's guess meets, so a sentence is judged by the
// matcher's own idea of "contains".
const containsKey = (sentNorm, key) => keyHit(sentNorm, key);
for (const p of PUZZLES) {
  const threadKeys = p.threads.flatMap((th) => [...th.keys, ...norm(th.t).split(' ').filter((w) => w.length > 3 && !['directed', 'released', 'movies', 'films', 'starring', 'over', 'single', 'based'].includes(w))]);
  for (const [i, t] of p.tiles.entries()) {
    const s = norm(t.s);
    if (containsKey(s, t.t)) bad(`#${p.num} tile ${i}: logline contains its own title "${t.t}"`);
    for (const k of t.keys) if (containsKey(s, k)) bad(`#${p.num} tile ${i} ("${t.t}"): logline contains its key "${k}"`);
    for (const k of threadKeys) if (containsKey(s, k)) bad(`#${p.num} tile ${i} ("${t.t}"): logline contains the thread word "${k}"`);
  }
}
ok('no logline names its title, a key, or the thread');

// 3b. US spellings in reader-facing copy (authoring standard rule 8).
// The 2026-09-14 extension shipped 38 British forms (neighbour, practise,
// jewellery, aeroplane, moustache, colour) before anyone screened for them.
// The past is frozen, so this starts at that extension's first board. A real
// film title keeps its own spelling and is allowed through by name.
const THREAD_COPY_FROM = '2026-09-14';
const TITLE_ALLOW = ['The Favourite'];
for (const p of PUZZLES) {
  if (p.live < THREAD_COPY_FROM) continue;
  const copy = [
    ...p.threads.map((t) => ['thread', t.t]),
    ...p.decoys.map((d) => ['decoy', d.n]),
    ...p.tiles.flatMap((t) => [['title', t.t], ['logline', t.s]]),
  ];
  for (const [label, text] of copy) {
    for (const hit of scanUS(text, TITLE_ALLOW)) {
      bad(`#${p.num} ${label} "${text}": British form "${hit.found}" (US: ${hit.us})`);
    }
  }
}
ok('US spellings in every board from ' + THREAD_COPY_FROM);

// 4. decoys are partial
for (const p of PUZZLES) {
  for (const d of p.decoys || []) {
    if (!d.n || !Array.isArray(d.keys) || !d.keys.length || !Array.isArray(d.cover)) { bad(`#${p.num} decoy is malformed`); continue; }
    if (d.cover.length >= p.tiles.length) bad(`#${p.num} decoy "${d.n}" covers the whole board; that is a second thread`);
    if (d.cover.length < 1) bad(`#${p.num} decoy "${d.n}" covers nothing`);
    for (const x of d.cover) if (!(Number.isInteger(x) && x >= 0 && x < p.tiles.length)) bad(`#${p.num} decoy "${d.n}" names tile ${x}`);
    if (p.sunday) for (const th of p.threads) if (th.tiles.every((x) => d.cover.includes(x))) bad(`#${p.num} decoy "${d.n}" covers all of thread "${th.t}"`);
  }
  if (!p.decoys || !p.decoys.length) bad(`#${p.num} plants no decoy; the trap is the game`);
}
ok('every decoy covers strictly less than a thread');

// 5. the collision audit, through the real matcher
for (const p of PUZZLES) {
  const n = p.tiles.length;
  for (let i = 0; i < n; i++) {
    const g = norm(p.tiles[i].t);
    // every earlier tile open
    const a = tileFor(g, p.tiles, new Set());
    if (a !== i) bad(`#${p.num}: typing "${p.tiles[i].t}" credits tile ${a < 0 ? 'NOTHING' : a + ' ("' + p.tiles[a].t + '")'} instead of tile ${i}`);
    // this tile alone open: it must still hit itself
    const solvedAll = new Set([...Array(n).keys()].filter((x) => x !== i));
    const b = tileFor(g, p.tiles, solvedAll);
    if (b !== i) bad(`#${p.num}: "${p.tiles[i].t}" does not match its own keys once the others are solved`);
    // and with it solved, it must credit nobody else (a re-guess is harmless)
    const c = tileFor(g, p.tiles, new Set([i]));
    if (c !== -1) bad(`#${p.num}: "${p.tiles[i].t}" re-typed after solving would also credit tile ${c} ("${p.tiles[c].t}")`);
    // key sanity: a bare key of a tile must not be a substring of another title
    for (const k of p.tiles[i].keys) {
      const kn = norm(k);
      if (!kn) { bad(`#${p.num} tile ${i}: empty key`); continue; }
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        if (containsKey(norm(p.tiles[j].t), kn) && !anyKey(norm(p.tiles[j].t), p.tiles[i].anti)) {
          if (j > i) bad(`#${p.num}: key "${k}" of tile ${i} ("${p.tiles[i].t}") is inside tile ${j}'s title "${p.tiles[j].t}" with no anti guard`);
        }
      }
    }
  }
  for (const th of p.threads) for (const k of th.keys) {
    const hit = tileFor(norm(k), p.tiles, new Set());
    if (hit >= 0) bad(`#${p.num}: thread key "${k}" would credit tile ${hit} ("${p.tiles[hit].t}") if typed in the film box`);
  }
  for (const d of p.decoys || []) for (const k of d.keys) {
    for (const th of p.threads) if (anyKey(norm(k), th.keys)) bad(`#${p.num}: decoy key "${k}" also names the true thread "${th.t}"`);
  }
}
ok('collision audit clean: every title credits its own tile and nothing else');

// 6. reuse
const filmSeen = new Map(), threadSeen = new Map();
const dayOf = (live) => Math.round(new Date(`${live}T12:00:00Z`).getTime() / 86400000);
for (const p of PUZZLES) {
  for (const t of p.tiles) {
    const f = norm(t.t);
    if (filmSeen.has(f)) {
      const q = filmSeen.get(f);
      if (dayOf(p.live) - dayOf(q.live) < 60) bad(`film "${t.t}" returns on #${p.num} only ${dayOf(p.live) - dayOf(q.live)} days after #${q.num}`);
    }
    filmSeen.set(f, p);
  }
  for (const th of p.threads) {
    const k = norm(th.t);
    if (threadSeen.has(k)) bad(`thread "${th.t}" on #${p.num} was already the thread on #${threadSeen.get(k)}`);
    threadSeen.set(k, p.num);
  }
}
ok('no film inside 60 days, no thread twice');

// 7. the thread bonus pays EARLY calls more. It shipped inverted for six
// weeks because nothing here looked at it, so lift bonusFor out of the
// client (the function the player actually meets) and check its shape.
{
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../app/thread/ThreadClient.jsx', import.meta.url), 'utf8');
  const m = src.match(/function bonusFor\(open, n\) \{[\s\S]*?\n\}/);
  const top = src.match(/const BONUS_TOP = (\d+);/);
  if (!m || !top) bad('could not lift bonusFor / BONUS_TOP from ThreadClient.jsx');
  else {
    const bonusFor = new Function('BONUS_TOP', `${m[0]}; return bonusFor;`)(Number(top[1]));
    for (const n of [9, 16]) {
      const row = Array.from({ length: n + 1 }, (_, open) => bonusFor(open, n));
      for (let o = 1; o <= n; o++) if (row[o] < row[o - 1]) bad(`bonusFor(${o}, ${n}) = ${row[o]} pays less than ${o - 1} open (${row[o - 1]}): an earlier call must never pay less`);
      if (row[n] !== Number(top[1])) bad(`calling with all ${n} open pays ${row[n]}, not the top bonus ${top[1]}`);
      if (row[0] !== 2) bad(`calling with nothing open pays ${row[0]}, not 2`);
    }
    ok('thread bonus: more open pays more, 6 / 4 / 2');
  }
}

if (fails) { console.log(`\n${fails} failure${fails === 1 ? '' : 's'}`); process.exit(1); }
console.log('\nthread bank OK');
