// THE COMMUNITY DIGEST (owner, 2026-11-18: "How about a daily digest email"). One email a
// morning to the admin address covering the last 24 hours of the community:
//   - new Idea Board pitches, in full, each with a link
//   - Post-Game Talk: how many posts, from how many players, busiest puzzles first
//   - anything players reported, marked HIDDEN once it reached the hide threshold
//   - the top open ideas by votes, so the board's front page is visible at a glance
// A quiet day sends nothing: no email when there are no ideas, posts or reports.
//
// It goes to m@mindloftdaily.com, the site's address for everything (owner, 2026-11-18: "It needs
// to go to our new email"), sent through Resend with the newsletter's sender (RESEND_API_KEY and
// NEWSLETTER_FROM on Vercel). NOT through the send-notification-email Edge Function: that one
// mails the old sourceoftruthsadmin address.
// Wired to a daily Vercel cron (vercel.json, 13:05 UTC, 8:05am Eastern in winter).
// CRON_SECRET, when set, is checked like the other crons. ?dry=1 returns the email
// as JSON without sending it, and only with the admin cookie.
//
// If migration 66 has not been applied the tables are missing and it sends nothing.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { isMissingTable, HIDE_AT_REPORTS, IDEA_KINDS, IDEA_STAGES } from '@/lib/community';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { SITE_URL } from '@/lib/site';
import { isAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const DIGEST_TO = 'm@mindloftdaily.com';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const gameName = (k) => (k && DAILY_GAME_MAP[k] ? DAILY_GAME_MAP[k].name : k || '');
const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

class Missing extends Error {}
function ok({ data, error }) {
  if (error) { if (isMissingTable(error)) throw new Missing(); throw error; }
  return data || [];
}

export async function GET(request) {
  const dry = new URL(request.url).searchParams.get('dry') === '1';
  if (dry && !isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const secret = process.env.CRON_SECRET;
  if (secret && !dry) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  try {
    const ideas = ok(await supabaseAdmin.from('community_ideas')
      .select('id,kind,title,body,game_key,username,votes,stage,hidden,created_at')
      .gte('created_at', since).order('created_at', { ascending: true }).limit(200));
    const posts = ok(await supabaseAdmin.from('community_posts')
      .select('id,game_key,user_id,username,maker,hidden')
      .gte('created_at', since).limit(5000));
    const reps = ok(await supabaseAdmin.from('community_reports')
      .select('target,target_id').gte('created_at', since).limit(2000));

    // The reported items themselves, with their running totals.
    const postIds = [...new Set(reps.filter((r) => r.target === 'post').map((r) => r.target_id))];
    const ideaIds = [...new Set(reps.filter((r) => r.target === 'idea').map((r) => r.target_id))];
    const repPosts = postIds.length ? ok(await supabaseAdmin.from('community_posts')
      .select('id,game_key,username,body,reports,hidden').in('id', postIds)) : [];
    const repIdeas = ideaIds.length ? ok(await supabaseAdmin.from('community_ideas')
      .select('id,title,username,reports,hidden').in('id', ideaIds)) : [];
    const top = ok(await supabaseAdmin.from('community_ideas')
      .select('id,title,kind,votes,stage').eq('hidden', false).eq('stage', 'open')
      .order('votes', { ascending: false }).order('created_at', { ascending: true }).limit(5));

    const players = new Set(posts.filter((p) => !p.maker).map((p) => p.user_id || p.username)).size;
    if (!ideas.length && !posts.length && !reps.length) {
      return NextResponse.json({ ok: true, sent: false, reason: 'quiet day' });
    }

    const byGame = new Map();
    for (const p of posts) byGame.set(p.game_key, (byGame.get(p.game_key) || 0) + 1);
    const games = [...byGame.entries()].sort((a, b) => b[1] - a[1]);

    const h2 = (t) => `<h3 style="margin:20px 0 6px;font-size:16px">${t}</h3>`;
    const a = (href, t) => `<a href="${SITE_URL}${href}" style="color:#3b3fb6">${t}</a>`;
    let html = '';

    html += h2(`New Ideas (${ideas.length})`);
    html += ideas.length ? `<ul style="margin:0 0 6px 18px;padding:0">${ideas.map((i) => `<li style="margin:0 0 8px">`
      + `<strong>${esc(i.title)}</strong> <span style="color:#666">(${esc(IDEA_KINDS[i.kind] || i.kind)}${i.game_key ? `, ${esc(gameName(i.game_key))}` : ''}, by ${esc(i.username)})</span>`
      + (i.body ? `<br><span>${esc(clip(i.body, 400))}</span>` : '')
      + (i.hidden ? ' <strong style="color:#b42318">HIDDEN</strong>' : '')
      + `</li>`).join('')}</ul>` : '<p style="margin:0">None.</p>';
    if (ideas.length) html += `<p style="margin:0">${a('/community/ideas', 'Review them on the Idea Board')} (log in to admin first to move stages or hide).</p>`;

    html += h2('Post-Game Talk');
    html += posts.length
      ? `<p style="margin:0 0 6px">${plural(posts.length, 'post', 'posts')} from ${plural(players, 'player', 'players')}.</p>`
        + `<ul style="margin:0 0 6px 18px;padding:0">${games.slice(0, 10).map(([k, n]) => `<li>${a(`/community/talk/${encodeURIComponent(k)}`, esc(gameName(k)))}: ${n}</li>`).join('')}</ul>`
        + (games.length > 10 ? `<p style="margin:0">and ${games.length - 10} more puzzles.</p>` : '')
      : '<p style="margin:0">No posts.</p>';

    html += h2(`Reported (${repPosts.length + repIdeas.length})`);
    if (repPosts.length || repIdeas.length) {
      const tag = (x) => `${plural(x.reports, 'report', 'reports')}${x.hidden ? ', <strong style="color:#b42318">HIDDEN</strong>' : ''}`;
      html += `<ul style="margin:0 0 6px 18px;padding:0">`
        + repPosts.map((p) => `<li style="margin:0 0 8px">Post in ${a(`/community/talk/${encodeURIComponent(p.game_key)}`, esc(gameName(p.game_key)))} by ${esc(p.username)} (${tag(p)}):<br>“${esc(clip(p.body, 300))}”</li>`).join('')
        + repIdeas.map((i) => `<li style="margin:0 0 8px">Idea “${esc(i.title)}” by ${esc(i.username)} (${tag(i)})</li>`).join('')
        + `</ul><p style="margin:0">Items hide themselves at ${HIDE_AT_REPORTS} reports. Restore or keep them hidden from the page while logged in to admin.</p>`;
    } else html += '<p style="margin:0">Nothing reported.</p>';

    if (top.length) {
      html += h2('Top Open Ideas');
      html += `<ol style="margin:0 0 6px 18px;padding:0">${top.map((i) => `<li>${esc(i.title)} <span style="color:#666">(${plural(i.votes, 'vote', 'votes')}, ${esc(IDEA_KINDS[i.kind] || i.kind)}, ${esc(IDEA_STAGES[i.stage] || i.stage)})</span></li>`).join('')}</ol>`;
    }

    const dateStr = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' });
    const bits = [ideas.length ? plural(ideas.length, 'idea', 'ideas') : '', posts.length ? plural(posts.length, 'post', 'posts') : '', reps.length ? plural(repPosts.length + repIdeas.length, 'report', 'reports') : ''].filter(Boolean);
    const subject = `Mind Loft Community, ${dateStr}: ${bits.join(', ')}`;
    const body = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.45;color:#1a1611">`
      + `<p style="margin:0 0 4px">The last 24 hours on the ${a('/community', 'Mind Loft community')}.</p>${html}</div>`;

    if (dry) return NextResponse.json({ ok: true, dry: true, subject, html: body });

    const key = process.env.RESEND_API_KEY;
    const from = process.env.NEWSLETTER_FROM;
    if (!key || !from) throw new Error('RESEND_API_KEY / NEWSLETTER_FROM not set');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [DIGEST_TO], subject, html: body, tags: [{ name: 'kind', value: 'community-digest' }] }),
    });
    if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
    return NextResponse.json({ ok: true, sent: true, ideas: ideas.length, posts: posts.length, reported: repPosts.length + repIdeas.length });
  } catch (err) {
    if (err instanceof Missing) return NextResponse.json({ ok: true, sent: false, reason: 'community tables not set up yet (migration 66)' });
    console.error('community-digest error', err);
    return NextResponse.json({ error: 'community digest failed' }, { status: 500 });
  }
}
