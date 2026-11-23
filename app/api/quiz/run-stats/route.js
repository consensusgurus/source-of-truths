// GET /api/quiz/run-stats?ids=a,b,c[&group=CODE][&anonId=..][&email=..]
//
// THE HOME'S PERSONAL RUN FIGURES IN ONE READ (data audit, 2026-11-23). The home
// used to ask /api/quiz/daily-combined once per run for the reader's own rank
// (and, for a group member, the group's rank and field): sixteen requests at
// once, which arrived on up to sixteen separate cold instances, each loading the
// results table before answering (4.5 to 7 s apiece, measured). This asks the
// SAME route in process, one run after another, so one instance loads once and
// answers all of them. Every figure is exactly what the per-run read returned.
//
// Only the fields the run tiles print are passed back.

import { NextResponse } from 'next/server';
import { GET as combinedGET } from '../daily-combined/route';
import { DISPLAY_CIRCUITS } from '@/lib/circuits';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 60;

const PRIVATE = { 'Cache-Control': 'private, max-age=20' };
const KNOWN = new Set(DISPLAY_CIRCUITS.map((c) => c.id));

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const ids = [...new Set((sp.get('ids') || '').split(',').map((x) => x.trim()).filter((x) => KNOWN.has(x)))].slice(0, 40);
  const group = (sp.get('group') || '').trim();
  const anonId = (sp.get('anonId') || '').trim();
  const email = (sp.get('email') || '').trim();
  const stats = {};
  for (const id of ids) {
    const q = new URLSearchParams();
    q.set('circuit', id);
    if (group) q.set('group', group);
    if (anonId) q.set('anonId', anonId);
    if (email) q.set('email', email);
    try {
      const res = await combinedGET(new Request(`https://mindloftdaily.com/api/quiz/daily-combined?${q.toString()}`));
      if (!res || res.status !== 200) continue;
      const d = await res.json();
      if (!d || d.error) continue;
      if (group) {
        stats[id] = { players: d.siteField || 0, rank: d.siteRank || null, gfield: d.field || 0, grank: d.me && d.me.rank ? d.me.rank : null, lead: d.siteLeader || null };
      } else {
        const top = Array.isArray(d.overall) ? d.overall.find((r) => r && r.rank === 1 && r.username) : null;
        stats[id] = { players: d.overallField || (Array.isArray(d.overall) ? d.overall.length : 0), rank: d.me && d.me.rank ? d.me.rank : null, lead: top ? top.username : null };
      }
      if (Array.isArray(d.doneAts)) stats[id].doneAts = d.doneAts;
    } catch (e) { /* one run failing leaves the rest */ }
  }
  return NextResponse.json({ stats }, { headers: PRIVATE });
}
