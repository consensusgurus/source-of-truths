// YOUR PHOTO JIGSAWS (owner, 2026-11-27: "a feature on the puzzle shelf where users can submit
// and create a puzzle from their own photos ... a private puzzle with their contacts ... a separate
// tab of user submitted photos", then "That feature needs to be worked into SEO content" and
// "wire in email notices to me upon submission"). Design: the "Your Photo Jigsaws Mockup" canvas.
//
// Client-safe constants and helpers, shared by the maker, the play pages, the shelf tabs and the
// server store (lib/photo-puzzles.js). No imports beyond lib/jigsaw-sizes.js.

import { JIGSAW_SIZES, MIN_PIECE_PX, cutFor } from './jigsaw-sizes.js';

// The stored picture: long side at most this many pixels (re-encoded in the browser, which also
// drops the camera's EXIF data, GPS included), plus a small copy for cards and thumbnails.
export const FULL_MAX = 3840;
export const SMALL_W = 960;
export const MIN_LONG = 800;              // a photo smaller than this on its long side is refused
export const MAX_BYTES = 9 * 1024 * 1024; // the full JPEG, after the browser re-encodes it
export const DAILY_LIMIT = 12;            // uploads a player may make in one Eastern day

// Owner's picks (2026-11-27): private link by default; Community Photos only after he approves.
export const STATUS = { private: 'private', pending: 'pending', approved: 'approved', declined: 'declined', off: 'off' };

// Topics an approved photo is filed under (set on approval), for the tab's chips and page titles.
export const PHOTO_TOPICS = [
  ['animals', 'Animals', 'Pet and Animal Photo'],
  ['places', 'Places', 'Travel and Places Photo'],
  ['food', 'Food', 'Food Photo'],
  ['nature', 'Nature', 'Nature Photo'],
  ['other', 'Other', 'Photo'],
];
export const topicLabel = (k) => (PHOTO_TOPICS.find((t) => t[0] === k) || PHOTO_TOPICS[4])[1];
export const topicNoun = (k) => (PHOTO_TOPICS.find((t) => t[0] === k) || PHOTO_TOPICS[4])[2];

// This device's own uploads: [{ code, token, name, at }]. The token proves ownership (turn off).
export const MINE_KEY = 'sot_photo_puzzles';

// Codes are 10 characters from an alphabet with no look-alikes; the code IS the private link.
export const CODE_RE = /^[23456789abcdefghjkmnpqrstuvwxyz]{10}$/;

// The biggest listed size this picture can be cut to with MIN_PIECE_PX source pixels a piece.
export function maxPiecesFor(w, h) {
  let best = JIGSAW_SIZES[0];
  for (const s of JIGSAW_SIZES) {
    const c = cutFor(s, w, h);
    if (w / c.cols >= MIN_PIECE_PX && h / c.rows >= MIN_PIECE_PX) best = s;
  }
  return best;
}

export function slugify(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'photo';
}

export const cleanText = (s, n) => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
export const imgSrc = (code) => `/api/photo-puzzles/img?id=${code}`;
