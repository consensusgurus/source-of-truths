// YOUR PHOTO JIGSAWS: the server store (owner, 2026-11-27; see lib/photo-puzzle-shared.js).
//
// Everything lives in ONE private Supabase Storage bucket, like Housing Watch (lib/housing/store.js):
// no table and no migration, so the feature works the moment it deploys.
//   full/<code>.jpg      the picture, long side up to 3840, re-encoded in the browser (no EXIF)
//   small/<code>.jpg     a 960 wide copy for cards, thumbnails and the finish card
//   meta/<code>.json     name, maker, size, status, owner token hash, topic, slug
//   index/community.json the approved Community Photos, newest first (the tab, the sitemap)
//   limit/<day>.json     uploads per player key that Eastern day
// The browser uploads the two JPEGs straight to Storage through signed upload URLs, so the
// pictures never pass through a Vercel function body (4.5 MB cap).
//
// Every submission, private or for Community Photos, emails m@mindloftdaily.com at once (owner,
// 2026-11-27: "wire in email notices to me upon submission"), through Resend with the
// newsletter's sender, the same as the community digest.

import crypto from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase-server';
import { SITE_URL } from '@/lib/site';
import { STATUS, CODE_RE, topicLabel, offerLabel } from '@/lib/photo-puzzle-shared';

export const BUCKET = 'photo-puzzles';
export const NOTIFY_TO = 'm@mindloftdaily.com';
const store = () => supabaseAdmin.storage.from(BUCKET);

export async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: '10MB' });
  if (error && !/already exists|duplicate/i.test(error.message || '')) throw error;
}

const ALPHA = '23456789abcdefghjkmnpqrstuvwxyz';
export function newCode() {
  const b = crypto.randomBytes(10);
  let s = '';
  for (let i = 0; i < 10; i++) s += ALPHA[b[i] % ALPHA.length];
  return s;
}
export const newToken = () => crypto.randomBytes(18).toString('base64url');
export const hashToken = (t) => crypto.createHash('sha256').update(String(t || '')).digest('hex');
export function tokenMatches(meta, t) {
  if (!meta || !meta.tok || !t) return false;
  const a = Buffer.from(meta.tok), b = Buffer.from(hashToken(t));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function getJSON(path) {
  const { data, error } = await store().download(path);
  if (error || !data) return null;
  try { return JSON.parse(await data.text()); } catch (e) { return null; }
}
async function putJSON(path, obj) {
  const up = () => store().upload(path, JSON.stringify(obj), { upsert: true, contentType: 'application/json', cacheControl: '0' });
  let { error } = await up();
  if (error && /bucket not found|not found/i.test(error.message || '')) { await ensureBucket(); ({ error } = await up()); }
  if (error) throw error;
}

export const getMeta = (code) => (CODE_RE.test(String(code || '')) ? getJSON(`meta/${code}.json`) : Promise.resolve(null));
export const putMeta = (meta) => putJSON(`meta/${meta.code}.json`, meta);

// What a player's browser may see of a puzzle (never the token hash or the owner key).
export function publicMeta(m) {
  if (!m) return null;
  return { code: m.code, scope: m.scope || 'link', name: m.name, by: m.by, w: m.w, h: m.h, max: m.max, pieces: m.pieces, status: m.status, slug: m.slug || null, topic: m.topic || null, at: m.at };
}
// Playable at its private link: anything not turned off or turned down.
export const linkLive = (m) => !!m && m.up && m.status !== STATUS.off && m.status !== STATUS.declined;

export async function communityIndex() {
  const j = await getJSON('index/community.json');
  return Array.isArray(j && j.items) ? j.items : [];
}
export async function writeCommunityIndex(items) {
  await putJSON('index/community.json', { items, at: new Date().toISOString() });
}
export async function findBySlug(slug) {
  const items = await communityIndex();
  return items.find((x) => x.slug === slug) || null;
}

export async function signedUploads(code) {
  const mk = async (path) => {
    let r = await store().createSignedUploadUrl(path);
    if (r.error && /bucket not found|not found/i.test(r.error.message || '')) { await ensureBucket(); r = await store().createSignedUploadUrl(path); }
    if (r.error) throw r.error;
    return { path, token: r.data.token };
  };
  return { full: await mk(`full/${code}.jpg`), small: await mk(`small/${code}.jpg`) };
}

// Both pictures are really there, and the big one is a JPEG of a sane size.
export async function uploadedSizes(code) {
  const look = async (dir) => {
    const { data, error } = await store().list(dir, { search: `${code}.jpg`, limit: 5 });
    if (error) return null;
    const f = (data || []).find((x) => x.name === `${code}.jpg`);
    return f ? { bytes: (f.metadata && f.metadata.size) || 0, type: (f.metadata && f.metadata.mimetype) || '' } : null;
  };
  return { full: await look('full'), small: await look('small') };
}

export async function readImage(code, small) {
  const { data, error } = await store().download(`${small ? 'small' : 'full'}/${code}.jpg`);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
export async function removeImages(code) {
  await store().remove([`full/${code}.jpg`, `small/${code}.jpg`]).catch(() => {});
}

// Every meta file, newest first, for the admin queue. Small volumes: fine to list and read.
export async function allMeta(limit = 300) {
  const { data, error } = await store().list('meta', { limit, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) return [];
  const out = await Promise.all((data || []).map((f) => getJSON(`meta/${f.name}`)));
  return out.filter(Boolean).sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function etDay(d = new Date()) {
  try { return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); } catch (e) { return d.toISOString().slice(0, 10); }
}
// Count one upload for this player key; false once today's limit is spent.
export async function spendUpload(key, limit) {
  const path = `limit/${etDay()}.json`;
  const j = (await getJSON(path)) || {};
  const n = j[key] || 0;
  if (n >= limit) return false;
  j[key] = n + 1;
  await putJSON(path, j);
  return true;
}

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The instant notice to the owner. Never throws: a failed email must not fail the upload.
export async function notifySubmission(m) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM;
  if (!key || !from) return { sent: false, reason: 'RESEND_API_KEY / NEWSLETTER_FROM not set' };
  const forCommunity = m.status === STATUS.pending;
  const offers = (m.offer || []).map(offerLabel);
  const link = `${SITE_URL}/jigsaw/p/${m.code}`;
  const review = `${SITE_URL}/jigsaw/review`;
  const just = m.scope === 'me';
  const subject = offers.length
    ? `Photo offered for ${offers.join(', ')}: ${m.name}`
    : forCommunity
    ? `Photo jigsaw to review: ${m.name}`
    : `New photo jigsaw (${just ? 'just for them' : 'private link'}): ${m.name}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1b1c1e">`
    + `<p style="margin:0 0 10px"><strong>${forCommunity ? 'Published to Community Photos. It is waiting for your approval.' : just ? 'Made just for themselves (not shared, not on Community Photos). Nothing to approve.' : 'Made as a private link puzzle to share (not on Community Photos). Nothing to approve.'}</strong></p>`
    + `<p style="margin:0 0 12px"><img src="${SITE_URL}/api/photo-puzzles/img?id=${m.code}&w=500" alt="${esc(m.name)}" width="480" style="max-width:100%;border-radius:8px;border:1px solid #ccc"></p>`
    + `<p style="margin:0">Name: <strong>${esc(m.name)}</strong><br>By: ${esc(m.by || 'not given')}<br>`
    + `Size: ${m.w} x ${m.h} px, up to ${Number(m.max).toLocaleString('en-US')} pieces (made at ${m.pieces})<br>`
    + `Uploaded: ${esc(new Date(m.at).toLocaleString('en-US', { timeZone: 'America/New_York' }))} ET</p>`
    + `<p style="margin:12px 0 0"><a href="${link}" style="color:#3b3fb6">Open the puzzle</a>`
    + ` &nbsp;·&nbsp; <a href="${review}" style="color:#3b3fb6">${forCommunity ? 'Approve or turn it down' : 'Photo review desk (turn off any link)'}</a></p>`
    + (offers.length ? `<p style="margin:12px 0 0"><strong>Offered for the daily puzzles: ${esc(offers.join(', '))}.</strong> The maker agreed it may be used, credited as below.</p>`
      + `<p style="margin:6px 0 0">Credit: ${esc((m.credit && m.credit.name) || m.by || 'not given')}${m.credit && m.credit.title ? `, &ldquo;${esc(m.credit.title)}&rdquo;` : ''}${m.credit && m.credit.url ? ` &nbsp;·&nbsp; <a href="${esc(m.credit.url)}" style="color:#3b3fb6">${esc(m.credit.url)}</a>` : ''}</p>` : '')
    + `<p style="margin:12px 0 0;color:#666;font-size:13px">Log in to admin first to use the review desk.</p></div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [NOTIFY_TO], subject, html }),
    });
    return { sent: r.ok };
  } catch (e) {
    return { sent: false, reason: 'send failed' };
  }
}

// The photos sitemap (/sitemaps/photos.xml): every approved Community Photo page. Read from
// Storage, so it is its own async segment outside SITEMAP_SEGMENTS (which must stay sync for
// the legacy old-host sitemap). Private links are never in any sitemap.
export async function photoSitemapEntries(baseUrl) {
  const items = await communityIndex().catch(() => []);
  return items.map((x) => ({
    url: `${baseUrl}/jigsaw/community/${x.slug}`, lastModified: new Date(x.at), changeFrequency: 'monthly', priority: 0.5,
    images: [{ loc: `${baseUrl}/api/photo-puzzles/img?id=${x.code}&w=960`, title: `${x.name}, a free photo jigsaw puzzle` }],
  }));
}

export { topicLabel };
