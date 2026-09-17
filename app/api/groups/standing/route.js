import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { guard, groupsOfUser, groupByCode, membersOf } from '@/lib/groups';
import { bestNForSuffix } from '@/lib/daily-combined';

// /api/groups/standing?anonId=&email=&day=today|yesterday
//
// WHERE THE VIEWER STANDS IN EVERY GROUP THEY ARE IN, in one read (owner,
// 2026-09-17). Seven surfaces show it: the finish screen's group line, the
// home's Your groups band, the Groups link badge, the Everyone / group switch
// on the game panel and the Stat Hub, the arrival's yesterday line, and the
// member dots on the home tiles. They all read this, so they cannot disagree.
//
// NOTHING NEW IS STORED OR SCORED. Each group's figures are that group's own
// day board (/api/quiz/daily-combined?group=), which is the site board
// filtered to the members; this route only picks out the viewer's row, the
// row above it, the top five and who has played which game. A finished day's
// board is frozen and cached, so `day=yesterday` is cheap.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const TOP = 5;

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }
function etIso(ms) {
  try { return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date(ms).toISOString().slice(0, 10); }
}
function suffixOf(iso) { const [Y, M, D] = iso.split('-').map(Number); return `${M}-${D}-${Y % 100}`; }
const r1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

function slimRow(r) {
  return { userKey: r.userKey, username: r.username, rank: r.rank, total: r1(r.total), siteRank: r.siteRank ?? null };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = str(searchParams.get('anonId'), 64) || null;
  const email = str(searchParams.get('email')) || null;
  const yesterday = searchParams.get('day') === 'yesterday';
  const origin = new URL(request.url).origin;

  const todayIso = etIso(Date.now());
  const [Y, M, D] = todayIso.split('-').map(Number);
  const iso = yesterday ? new Date(Date.UTC(Y, M - 1, D) - 86400000).toISOString().slice(0, 10) : todayIso;
  const suffix = suffixOf(iso);

  const out = await guard(async () => {
    const user = (anonId || email) ? await findQuizIdentity(supabaseAdmin, { email, anonId }) : null;
    if (!user) return { registered: false, groups: [] };
    const myKey = `u:${user.id}`;
    const mine = await groupsOfUser(supabaseAdmin, user.id);

    const groups = await Promise.all(mine.map(async (g) => {
      let members = [];
      try {
        const ref = await groupByCode(supabaseAdmin, g.code);
        if (ref) members = await membersOf(supabaseAdmin, ref.id);
      } catch (e) { members = []; }
      let board = null;
      try {
        const r = await fetch(`${origin}/api/quiz/daily-combined?group=${g.code}&date=${suffix}`, { cache: 'no-store' });
        if (r.ok) board = await r.json();
      } catch (e) { board = null; }

      const base = {
        code: g.code,
        name: g.name,
        role: g.role,
        members: members.length || g.members,
        roster: members.map((m) => ({ userKey: m.userKey, username: m.username })),
      };
      if (!board) return { ...base, failed: true };

      const rows = (Array.isArray(board.overall) ? board.overall : []).filter((r) => (r.total || 0) > 0);
      const meIdx = rows.findIndex((r) => r.userKey === myKey);
      const me = meIdx >= 0 ? rows[meIdx] : null;
      // The person directly above: the nearest row with a strictly better rank.
      let ahead = null;
      if (me) for (let i = meIdx - 1; i >= 0; i--) { if (rows[i].rank < me.rank) { ahead = rows[i]; break; } }
      const leader = rows[0] || null;

      // WHO PLAYED WHAT, and this viewer's points per game. The dots on the
      // home tiles read the first; the finish line reads the second to work out
      // where the viewer stood before the game they just finished.
      const played = {};
      const boards = {};
      const myPoints = {};
      // Which puzzle each game's board is, so a page showing an ARCHIVE
      // puzzle never swaps in today's group rows.
      const quizIds = {};
      for (const gm of (board.games || [])) {
        quizIds[gm.key] = gm.quizId;
        const list = (gm.board || []).filter((x) => !x.abandoned || x.points > 0);
        if (!list.length) continue;
        played[gm.key] = list.map((x) => x.userKey);
        boards[gm.key] = list.map((x) => ({
          userKey: x.userKey, username: x.username, rank: x.rank, siteRank: x.siteRank ?? null,
          points: x.points, score: x.score, total: x.total, guessesUsed: x.guessesUsed ?? null,
          tries: x.tries ?? null, egTier: x.egTier ?? null, timeElapsed: x.timeElapsed ?? null,
          abandoned: !!x.abandoned,
        }));
        const mineRow = list.find((x) => x.userKey === myKey);
        if (mineRow) myPoints[gm.key] = mineRow.points;
      }

      const top = rows.slice(0, TOP).map(slimRow);
      return {
        ...base,
        played: rows.length,
        rank: me ? me.rank : null,
        total: me ? r1(me.total) : null,
        siteRank: me ? (me.siteRank ?? null) : null,
        leader: leader ? slimRow(leader) : null,
        ahead: ahead ? slimRow(ahead) : null,
        gap: me && ahead ? r1(ahead.total - me.total) : null,
        top,
        meRow: me && !top.some((r) => r.userKey === myKey) ? slimRow(me) : null,
        // Every scored row: the Stat Hub's group board draws these, and the
        // finish line places a hypothetical total ("before this game") on them.
        rows: rows.map(slimRow),
        games: played,
        boards,
        quizIds,
        myPoints,
      };
    }));

    return {
      registered: true,
      username: user.username,
      userKey: myKey,
      date: iso,
      day: yesterday ? 'yesterday' : 'today',
      bestN: bestNForSuffix(suffix),
      groups,
    };
  });
  return NextResponse.json(out, { status: out.status || 200, headers: NO_STORE });
}
