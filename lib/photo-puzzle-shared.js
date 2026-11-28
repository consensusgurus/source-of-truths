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

// What this device last knew of each of its own puzzles' status: { [code]: status }. The approval
// notice (app/jigsaw/PhotoNotice.jsx, owner 2026-11-27) checks only codes last seen 'pending' and
// tells the player once when one turns 'approved' or 'declined'.
export const STATUS_KEY = 'sot_photo_status';
export function readStatuses() {
  try { const o = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; }
}
export function noteStatus(code, status) {
  try { const o = readStatuses(); o[code] = status; localStorage.setItem(STATUS_KEY, JSON.stringify(o)); } catch (e) { /* storage blocked */ }
}

// OFFER FOR THE DAILY PUZZLES (owner, 2026-11-27: "a selection in the submission part where users can
// offer the photos for use in Daily Jig / Saw or Mural. Also give size guidelines"). Opt-in on the
// Make Your Own form, checked against the CROPPED upload (the size the server stores). The numbers
// follow each game's own photo pool: Jig's landscape 2,400px rule (scripts/jig-photos.mjs), Saw's
// 1.3 to 1.6 tall portrait at 2,000px (scripts/saw-photos.mjs), and the Mural's 80 x 50 cut at 40px
// a piece (lib/mural-shared.js, lib/jigsaw-sizes.js MIN_PIECE_PX). An offer is only a request: the
// photo goes on the review desk and nothing is scheduled until Mind Loft picks it.
export const DAILY_OFFERS = [
  { k: 'jig', label: 'Daily Jig', shape: 'Wide: from 5:4 up to 16:9', min: 'at least 2,400 pixels wide', fits: (w, h) => w / h >= 1.2 && w / h <= 1.8 && w >= 2400 },
  { k: 'saw', label: 'Daily Saw', shape: 'Tall: 1.3 to 1.6 times as tall as it is wide (Tall shape works)', min: 'at least 2,000 pixels wide', fits: (w, h) => h / w >= 1.28 && h / w <= 1.62 && w >= 2000 },
  { k: 'mural', label: 'Mural (4,000 pieces)', shape: 'Wide: 3:2 to 16:9', min: 'at least 3,200 pixels wide', fits: (w, h) => w / h >= 1.4 && w / h <= 1.8 && w >= 3200 },
];
export const offerLabel = (k) => (DAILY_OFFERS.find((o) => o.k === k) || {}).label || k;
export const cleanOffer = (list, w, h) => (Array.isArray(list) ? DAILY_OFFERS.filter((o) => list.includes(o.k) && o.fits(w, h)).map((o) => o.k) : []);

// THE DAILY CREDIT (owner, 2026-11-28): a maker who requests a daily puzzle can say how the
// picture is credited: the artist or photographer, the work's title (a painting's name), and a
// website. The website is kept only as a plain http(s) address; "rhmentzart.com" gains https://.
export function cleanUrl(v) {
  let u = cleanText(v, 200).replace(/\s+/g, '');
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) && x.hostname.includes('.') ? x.toString() : ''; } catch (e) { return ''; }
}
export const cleanCredit = (c) => {
  const o = c && typeof c === 'object' ? c : {};
  const r = { name: cleanText(o.name, 60), title: cleanText(o.title, 80), url: cleanUrl(o.url) };
  return r.name || r.title || r.url ? r : null;
};
