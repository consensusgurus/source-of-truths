#!/usr/bin/env node
//
// BAKE EVERY SHARE CARD TO public/og/.
//
// Per-game share cards used to be Satori routes that re-rendered on every
// deploy; on 2026-09-02 they became static PNGs under public/og/, with each
// game's page.js metadata pointing at its file. This is the script that draws
// them, which until now did not exist in the repo at all - the PNGs were baked
// by hand, so nobody could regenerate them.
//
//   node scripts/bake-og.mjs              # every live daily game
//   node scripts/bake-og.mjs crux suds    # just these
//   node scripts/bake-og.mjs --site       # the site-level cards too
//
// Fonts are read out of node_modules by lib/og-stage-card.js, so this needs no
// network. Run it after any change to lib/og-stage-card.js, to a game's row in
// lib/daily-games.js, or to that game's glyph in lib/game-glyphs.js, and commit
// the PNGs it writes.

import { register } from 'node:module';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

register('./alias-loader.mjs', import.meta.url);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'og');

const cards = await import('../lib/og-stage-cards.js');
const { DAILY_GAME_MAP } = await import('../lib/daily-games.js');

async function write(name, res) {
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(outDir, name + '.png'), buf);
  return buf.length;
}

const argv = process.argv.slice(2);
const wantSite = argv.includes('--site');
const only = argv.filter((a) => !a.startsWith('--'));

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const keys = only.length ? only : cards.bakeableGameKeys();
let bytes = 0;
let n = 0;
const missing = [];

for (const key of keys) {
  if (!DAILY_GAME_MAP[key]) { missing.push(key); continue; }
  bytes += await write(key, cards.renderGameCard(key));
  n += 1;
  if (n % 20 === 0) process.stdout.write('  ' + n + ' of ' + keys.length + '\n');
}

if (wantSite) {
  const { QUIZZES } = await import('../lib/quizzes.js');
  bytes += await write('brand', cards.renderBrandCard(QUIZZES.length));
  bytes += await write('daily', cards.renderDailyCard());
  bytes += await write('quizzes', cards.renderQuizzesCard());
  bytes += await write('lists', cards.renderListsBrandCard());
  n += 4;
}

console.log('baked ' + n + ' cards, ' + Math.round(bytes / 1024) + ' KB total, into public/og/');
if (missing.length) {
  console.error('NOT a daily game, skipped: ' + missing.join(', '));
  process.exit(1);
}
