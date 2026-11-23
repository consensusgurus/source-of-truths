// PREBUILT BOARDS (owner, 2026-11-20). The day's leaderboards are computed on a
// schedule (app/api/cron/boards) and stored as small objects in the
// results-snapshots bucket, one per board, so pages read a finished board
// through the CDN instead of every server loading the 645,000-row results table
// to compute the same answer for each visitor.
//
// Names (BOARD_NAME_RE is the only shape the reader accepts):
//   overall             the day's board (daily-combined, ?all=1&top=30)
//   circuit-<id>        one run's board (daily-combined ?circuit=<id>&all=1&top=30)
//   game-<quizId>       one puzzle's board (the /api/quiz/board no-identity answer)
//   index               { at, date, names: { <name>: hash } } for the job itself
//
// Every payload carries `at` (epoch ms it was built), so a page can print
// "as of 9:54" (owner, 2026-11-20). Nothing here is ever a player's own row:
// a page merges the reader's own fresh result in on the client.

import crypto from 'node:crypto';
import { readStoredObject, writeStoredObject } from './results-snapshot-store';

export const BOARDS_PREFIX = 'boards-v1/';
// `runs` (2026-11-23): every run's tile figures, today and yesterday, in one read.
export const BOARD_NAME_RE = /^(overall|runs|circuit-[a-z0-9-]{1,40}|game-[a-z0-9]{1,30}-\d{1,2}-\d{1,2}-\d{2})$/;

export function boardHash(payload) {
  return crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
}

export async function readBoard(admin, name) {
  if (!BOARD_NAME_RE.test(name) && name !== 'index') return null;
  return readStoredObject(admin, BOARDS_PREFIX + name);
}

export async function writeBoard(admin, name, payload, at) {
  return writeStoredObject(admin, BOARDS_PREFIX + name, payload, at);
}
