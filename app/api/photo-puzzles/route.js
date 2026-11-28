// /api/photo-puzzles: YOUR PHOTO JIGSAWS (owner, 2026-11-27). See lib/photo-puzzles.js.
//
// GET  ?community=1                      the approved Community Photos (the shelf tab)
// POST { action: 'start', ... }          check the form, spend one of today's uploads, and hand back
//                                        a code, an owner token and two signed upload URLs
// POST { action: 'finish', code, token } both pictures are up: open the link, email the owner
// POST { action: 'off', code, token }    the maker turns their link off (pictures deleted)
// POST { action: 'publish', code, token, rights } the maker publishes a private one to Community
//                                        Photos later (owner, 2026-11-27): it waits for approval
// POST { action: 'mine', items }         status of this device's own uploads (Your Photos tab)
// POST { action: 'admin', op, code, ... } approve, turn down, turn off, retitle (admin cookie only)

import { NextResponse } from 'next/server';
import {
  getMeta, putMeta, publicMeta, newCode, newToken, hashToken, tokenMatches, signedUploads,
  uploadedSizes, notifySubmission, spendUpload, communityIndex, writeCommunityIndex, removeImages,
} from '@/lib/photo-puzzles';
import {
  STATUS, CODE_RE, MIN_LONG, FULL_MAX, MAX_BYTES, DAILY_LIMIT, PHOTO_TOPICS, maxPiecesFor, slugify, cleanText, cleanOffer, cleanCredit,
} from '@/lib/photo-puzzle-shared';
import { JIGSAW_SIZES } from '@/lib/jigsaw-sizes';
import { isAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const bad = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  if (sp.get('community') === '1') {
    const items = await communityIndex().catch(() => []);
    return NextResponse.json({ ok: true, items }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } });
  }
  return bad('unknown request');
}

export async function POST(request) {
  let b;
  try { b = await request.json(); } catch (e) { return bad('bad json'); }
  const action = b && b.action;
  try {
    if (action === 'start') return await start(b, request);
    if (action === 'finish') return await finish(b);
    if (action === 'off') return await turnOff(b);
    if (action === 'publish') return await publish(b);
    if (action === 'mine') return await mine(b);
    if (action === 'admin') return await admin(b);
  } catch (e) {
    return bad('Something went wrong on our side. Please try again.', 500);
  }
  return bad('unknown action');
}

async function start(b, request) {
  const name = cleanText(b.name, 80);
  const by = cleanText(b.by, 40);
  const w = Math.round(Number(b.w)), h = Math.round(Number(b.h));
  if (!name) return bad('Give your puzzle a name.');
  if (b.rights !== true) return bad('Please confirm you took the photo or have the right to share it.');
  if (!(w > 0 && h > 0) || Math.max(w, h) > FULL_MAX || Math.max(w, h) < MIN_LONG) return bad(`The photo needs to be at least ${MIN_LONG} pixels on its long side.`);
  const max = maxPiecesFor(w, h);
  let pieces = Number(b.pieces);
  if (!JIGSAW_SIZES.includes(pieces)) pieces = 150;
  if (pieces > max) pieces = max;
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const who = cleanText(b.anonId, 80) || cleanText(b.email, 120).toLowerCase() || `ip:${ip || 'unknown'}`;
  if (!(await spendUpload(hashToken(who).slice(0, 24), DAILY_LIMIT))) return bad(`You can make up to ${DAILY_LIMIT} photo puzzles a day. Try again tomorrow.`, 429);
  const code = newCode(), token = newToken();
  const meta = {
    code, name, by, w, h, max, pieces,
    // Who it is for (owner, 2026-11-27): 'me' (the default, private to the maker), 'link' (shared
    // by private link) or 'community' (published once approved).
    scope: ['me', 'link', 'community'].includes(b.share) ? b.share : 'me',
    status: b.share === 'community' ? STATUS.pending : STATUS.private,
    // Daily games the maker offered it to (owner, 2026-11-27), kept only where the photo meets that
    // game's size guideline. A request for the review desk, never a schedule.
    offer: cleanOffer(b.offer, w, h),
    // How a daily pick is credited (owner, 2026-11-28): artist, title, website. Kept only with an offer.
    credit: cleanOffer(b.offer, w, h).length ? cleanCredit(b.credit) : null,
    submitted: b.share === 'community', at: new Date().toISOString(), tok: hashToken(token), owner: hashToken(who).slice(0, 24), up: false,
  };
  await putMeta(meta);
  const uploads = await signedUploads(code);
  return NextResponse.json({ ok: true, code, token, uploads, max, pieces });
}

async function finish(b) {
  const m = await getMeta(b.code);
  if (!m || !tokenMatches(m, b.token)) return bad('That upload was not found.', 404);
  if (!m.up) {
    const s = await uploadedSizes(m.code);
    if (!s.full || !s.small) return bad('The photo did not finish uploading. Please try again.');
    if (s.full.bytes > MAX_BYTES) { await removeImages(m.code); return bad('That photo is too large. Please try a smaller one.'); }
    m.up = true;
    m.upAt = new Date().toISOString();
    await putMeta(m);
    m.mail = await notifySubmission(m);
  }
  return NextResponse.json({ ok: true, meta: publicMeta(m) });
}

async function turnOff(b) {
  const m = await getMeta(b.code);
  if (!m || !tokenMatches(m, b.token)) return bad('That puzzle was not found.', 404);
  await offAndRemove(m);
  return NextResponse.json({ ok: true, meta: publicMeta(m) });
}

async function publish(b) {
  const m = await getMeta(b.code);
  if (!m || !tokenMatches(m, b.token)) return bad('That puzzle was not found.', 404);
  if (b.rights !== true) return bad('Please confirm you have the right to share this photo publicly.');
  if (!m.up || m.status !== STATUS.private) return bad(m.status === STATUS.pending ? 'It is already waiting for review.' : 'This puzzle cannot be published.');
  m.status = STATUS.pending;
  m.scope = 'community';
  m.submitted = true;
  m.publishedAt = new Date().toISOString();
  await putMeta(m);
  m.mail = await notifySubmission(m);
  return NextResponse.json({ ok: true, meta: publicMeta(m) });
}

async function offAndRemove(m) {
  m.status = STATUS.off;
  m.offAt = new Date().toISOString();
  await putMeta(m);
  await removeImages(m.code);
  const items = await communityIndex();
  if (items.some((x) => x.code === m.code)) await writeCommunityIndex(items.filter((x) => x.code !== m.code));
}

async function mine(b) {
  const codes = (Array.isArray(b.items) ? b.items : []).map((x) => x && x.code).filter((c) => CODE_RE.test(String(c))).slice(0, 60);
  const metas = await Promise.all(codes.map((c) => getMeta(c)));
  return NextResponse.json({ ok: true, items: metas.filter(Boolean).map(publicMeta) });
}

async function admin(b) {
  if (!isAdmin()) return bad('Log in to admin first.', 401);
  const m = await getMeta(b.code);
  if (!m) return bad('Not found.', 404);
  const op = b.op;
  const items = await communityIndex();
  const others = items.filter((x) => x.code !== m.code);
  if (op === 'approve' || op === 'retitle') {
    if (b.name) m.name = cleanText(b.name, 80) || m.name;
    if (PHOTO_TOPICS.some((t) => t[0] === b.topic)) m.topic = b.topic;
    if (!m.topic) m.topic = 'other';
    if (op === 'approve' && !m.submitted) return bad('The maker kept this one private.');
    if (op === 'approve' && m.status === STATUS.off) return bad('This link was turned off.');
    if (op === 'approve' || m.status === STATUS.approved) {
      if (!m.up) return bad('The photo never finished uploading.');
      const base = slugify(m.name);
      let slug = base, i = 2;
      while (others.some((x) => x.slug === slug)) slug = `${base}-${i++}`;
      m.slug = slug;
      m.status = STATUS.approved;
      m.approvedAt = m.approvedAt || new Date().toISOString();
      const row = { code: m.code, slug, name: m.name, by: m.by, topic: m.topic, w: m.w, h: m.h, max: m.max, at: m.approvedAt };
      await writeCommunityIndex([row, ...others].sort((x, y) => String(y.at).localeCompare(String(x.at))));
    }
    await putMeta(m);
  } else if (op === 'decline') {
    m.status = STATUS.declined;
    m.declinedAt = new Date().toISOString();
    await putMeta(m);
    if (others.length !== items.length) await writeCommunityIndex(others);
  } else if (op === 'unlist') {
    // Off Community Photos but the maker's private link keeps working.
    m.status = STATUS.private;
    m.slug = null;
    await putMeta(m);
    await writeCommunityIndex(others);
  } else if (op === 'off') {
    await offAndRemove(m);
  } else {
    return bad('unknown op');
  }
  return NextResponse.json({ ok: true, meta: { ...publicMeta(m), up: m.up } });
}
