// THE PAST JIGSAW LIBRARY (SEO pass, 2026-11-21): every Jig and Saw board that
// is live and NOT today's, with its topic. Today's boards never appear: their
// photos are the day's surprise (see app/jig/shelf/page.js). Shared by the
// topic pages (app/jig/shelf/[topic]), the shelf's topic links and the sitemap.

import { PUZZLES as JIG } from '@/app/jig/puzzles';
import { PUZZLES as SAW } from '@/app/saw/puzzles';
import { JIGSAW_TOPICS, topicOf } from './jigsaw-topics.js';

// A topic page is indexed and linked only once it holds this many past photos,
// so no thin page goes to search. Below it the page still opens, as noindex.
export const TOPIC_MIN = 8;

export function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export function pastJigsaws(today = etToday()) {
  const rows = [];
  for (const [g, bank] of [['jig', JIG], ['saw', SAW]]) {
    for (const p of bank) {
      if (!(p.live < today)) continue;
      rows.push({ g, n: p.num, d: p.live, l: p.dateLabel, c: p.cols, r: p.rows, name: p.name, by: p.by, lic: p.lic, t: p.t, topic: topicOf(p.name) });
    }
  }
  return rows.sort((a, b) => (a.d === b.d ? (a.g === 'jig' ? -1 : 1) : a.d < b.d ? 1 : -1));
}

// Topics with their past-photo counts, in JIGSAW_TOPICS order.
export function topicCounts(today = etToday()) {
  const past = pastJigsaws(today);
  return JIGSAW_TOPICS.map((t) => {
    const n = past.filter((b) => b.topic === t.slug).length;
    return { slug: t.slug, label: t.label, href: `/jig/shelf/${t.slug}`, count: n, indexed: n >= TOPIC_MIN };
  });
}
