'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Crown, Copy, Check, UserPlus } from 'lucide-react';
import GroupsShell from '../../groups/GroupsShell';
import JoinLeaderboardForm from '../../quiz/[id]/JoinLeaderboardForm';
import DrawingBoard from './DrawingBoard';
import { T } from '@/lib/theme';
import { CONTEST, COPY, contestIsLive, formatScore } from '@/lib/contest';

// Public referral board. The Top Community Member tile on the home hub shows only
// the winner and the two runners-up; this is the full ranking behind it, plus the
// viewer's own standing and share link.

// Stage tokens (owner, 2026-10-09: the page moved onto the same frame as
// /groups and the Stat Hub), so both registers come from app/globals.css.
const C = {
  ink: 'var(--stg-ink)', muted: 'var(--stg-ink2)', soft: 'var(--stg-mute)',
  line: 'var(--stg-line)', accent: 'var(--stg-acc)', cta: 'var(--stg-acc)',
  ctaInk: 'var(--stg-onramp)', surface: 'var(--stg-raise)', well: 'var(--stg-surf2)',
};
const MEDAL = [T.gold, '#b8bcc4', '#c8814b'];
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

// Three views (owner, 2026-08-05). CONTEST is its own view rather than a
// decoration on the 90-day board, because the two are ordered by different
// things: the contest ranks by weighted SCORE, the others by raw referral
// count. Overlaying contest numbers onto the 90-day ordering (the first
// attempt) produced a list whose numbers descended out of order.
//
// Only the contest view shows points; the other two show players, which is what
// they actually measure. The contest tab hides itself once the contest ends, so
// this page reverts to exactly what it was with no follow-up deploy.
const CONTEST_VIEW = 'contest';
const WINDOWS = [
  { key: 90, label: 'Last 90 days' },
  { key: 36500, label: 'All time' },
];

// "3m ago" style stamp for the share feed. `now` is captured in an effect so
// the server and the first client render never disagree about the clock.
function ago(iso, now) {
  if (!now || !iso) return '';
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CommunityLeaderboardClient() {
  const [days, setDays] = useState(90);
  // 'contest' | 90 | 36500. Starts on 90 so a server render and the pre-contest
  // state both show the familiar board; the mount effect switches to the
  // contest view when one is running.
  const [view, setView] = useState(90);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [identity, setIdentity] = useState(null);
  // Running feed of successful shares (owner, 2026-10-05): the board says who
  // has brought in the most, this says who brought someone in most recently.
  const [feed, setFeed] = useState(null);
  const [feedAll, setFeedAll] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    let alive = true;
    setNow(Date.now());
    fetch('/api/quiz/referrals?feed=1&limit=100')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive) setFeed(j && Array.isArray(j.feed) ? j.feed : []); })
      .catch(() => { if (alive) setFeed([]); });
    return () => { alive = false; };
  }, []);

  const load = useCallback((d) => {
    setLoading(true);
    // The email travels with the anon so the board recognises the viewer on a
    // second device; quiz_users.anon_id only ever holds their first browser.
    const qs = new URLSearchParams({ days: String(d), limit: '100' });
    try {
      const anon = localStorage.getItem('sot_quiz_anon') || '';
      if (anon) qs.set('anonId', anon);
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
      if (id && id.email) qs.set('email', id.email);
    } catch { /* private mode */ }
    return fetch(`/api/quiz/referrals?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j) setData(j); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  // Contest breakdown, shown per row while the contest runs (owner, 2026-08-05):
  // this page is where someone comes to understand WHY they are ranked where
  // they are, so it shows the three inputs to the score rather than only the
  // result. The home tile deliberately does not, it has one narrow column.
  // Keyed by ref_code, which is stable across a username change.
  const [contestLive, setContestLive] = useState(false);
  const [contestRows, setContestRows] = useState(null);
  useEffect(() => {
    const live = contestIsLive();
    setContestLive(live);
    // Land on the contest board while it is running: it is the view with money
    // attached and the one people are arriving to check.
    if (live) setView(CONTEST_VIEW);
  }, []);
  useEffect(() => {
    if (!contestLive) return undefined;
    let alive = true;
    fetch('/api/quiz/contest?limit=100')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && Array.isArray(d.board)) setContestRows(d.board); })
      .catch(() => {});
    return () => { alive = false; };
  }, [contestLive]);
  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
      if (id && id.username) setIdentity(id);
    } catch { /* ignore */ }
  }, []);

  const me = data?.me || null;
  const onContest = view === CONTEST_VIEW && contestLive;
  // One shape for both sources so the row renderer stays single-branch:
  //   value      the number in the right-hand column
  //   unit       what that number IS, and the whole point of the owner's rule
  //   breakdown  formula inputs, contest only
  const rows = onContest
    ? (contestRows || []).map((r) => ({
        username: r.username,
        refCode: r.refCode,
        value: formatScore(r.score),
        unit: 'points',
        breakdown: { users: r.users, sessions: r.sessions, plays: r.plays },
      }))
    : (data?.top || []).map((r) => ({
        username: r.username,
        refCode: r.refCode,
        value: r.credits,
        unit: r.credits === 1 ? 'player' : 'players',
        breakdown: null,
      }));
  // The contest board is a separate fetch, so it has its own pending state; the
  // 90-day/all-time board keeps using `loading` from the referrals fetch.
  const pending = onContest ? contestRows === null : (loading && !rows.length);
  const myRank = me ? rows.findIndex((r) => r.refCode && me.code && r.refCode === me.code) : -1;

  const copy = useCallback(async () => {
    if (!me?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(me.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked; the link is selectable */ }
  }, [me]);

  return (
    <GroupsShell eyebrow="Community" links={[{ href: '/groups', label: 'Groups' }, { href: '/quizzes/hub', label: 'Stat Hub' }]}>
      <div style={{ fontFamily: FONT, color: C.ink }}>
        <div className="grp-lbl">Community</div>
        <h1 className="grp-h1" style={{ margin: '6px 0 10px' }}>Community Leaderboard</h1>
        <p style={{ margin: '0 0 4px', fontSize: 14.5, lineHeight: 1.5, color: C.muted, maxWidth: 620 }}>
          The players bringing the most new people to Mind Loft. I&apos;m a single person
          startup, so word of mouth is how this grows.
        </p>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, lineHeight: 1.5, color: C.soft, maxWidth: 620 }}>
          Registered players get a unique share link, and the Share button on every quiz and daily
          game already includes it. Anyone who opens one and finishes a game counts once.
        </p>

        {/* The $100 ticket drawing (owner, 2026-10-09); renders nothing once it closes. */}
        <DrawingBoard />

        {/* Your standing + link */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 18 }}>
          {me ? (
            <>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.soft, fontWeight: 800, marginBottom: 8 }}>Your standing</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ fontSize: 22, fontWeight: 800 }}>{me.username}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>
                  {me.credits} brought in{myRank >= 0 ? ` · #${myRank + 1}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <code style={{ flex: '1 1 260px', minWidth: 0, fontFamily: FONT, fontSize: 13, background: C.well, border: `1px solid ${C.line}`, borderRadius: 9, padding: '9px 11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {me.shareUrl}
                </code>
                <button type="button" onClick={copy} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontSize: 13, fontWeight: 800, color: C.ctaInk, background: C.cta, border: 0, borderRadius: 9, padding: '10px 14px', cursor: 'pointer' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px', fontSize: 14, color: C.muted }}>
                Register to get your own share link and appear on this board.
              </div>
              <button type="button" onClick={() => setJoinOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontSize: 13, fontWeight: 800, color: C.ctaInk, background: C.cta, border: 0, borderRadius: 9, padding: '10px 14px', cursor: 'pointer' }}>
                <UserPlus size={14} /> Register
              </button>
            </div>
          )}
        </div>

        {/* View toggle: Contest (while live) / Last 90 days / All time */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {(contestLive ? [{ key: CONTEST_VIEW, label: `Contest · ${CONTEST.prizeLabel}` }] : []).concat(WINDOWS).map((w) => {
            const on = view === w.key;
            return (
              <button
                key={w.key}
                type="button"
                onClick={() => { setView(w.key); if (w.key !== CONTEST_VIEW) setDays(w.key); }}
                style={{
                  fontFamily: FONT, fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                  padding: '7px 13px', borderRadius: 999,
                  border: `1px solid ${on ? C.accent : C.line}`,
                  background: on ? C.accent : C.surface,
                  color: on ? C.ctaInk : C.muted,
                }}
              >
                {w.label}
              </button>
            );
          })}
        </div>

        {/* What the selected view measures. The contest view ranks by a weighted
            score, the others by headcount, and saying so prevents the two being
            read as the same list disagreeing with itself. */}
        <div style={{ fontSize: 12, color: C.soft, marginBottom: 12, lineHeight: 1.5 }}>
          {onContest
            ? <>Ranked by contest points. {COPY.formulaLine}. Ends {CONTEST.deadlineLabel}. An email on your account is required to be eligible.</>
            : <>Ranked by new players brought in{view === 90 ? ' over the last 90 days' : ', all time'}.</>}
        </div>

        {/* The board */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
          {pending ? (
            <div style={{ padding: 26, textAlign: 'center', color: C.soft, fontSize: 14 }}>Loading…</div>
          ) : rows.length ? (
            rows.map((r, i) => {
              const mine = me && me.code && r.refCode === me.code;
              const cx = r.breakdown;
              return (
                <div
                  key={r.refCode || r.username || i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px',
                    borderTop: i ? `1px solid ${C.line}` : 'none',
                    background: mine ? 'rgba(232,180,58,0.10)' : 'transparent',
                  }}
                >
                  <span style={{
                    flex: 'none', width: 26, height: 26, borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800,
                    background: i < 3 ? MEDAL[i] : C.well,
                    color: i < 3 ? '#1a1408' : C.muted,
                  }}>{i + 1}</span>
                  {i === 0 ? <Crown size={16} style={{ flex: 'none', color: MEDAL[0] }} /> : null}
                  <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.username}{mine ? <span style={{ color: C.soft, fontWeight: 700, fontSize: 12 }}> · you</span> : null}
                    </span>
                    {/* The three inputs to the contest score, in formula order,
                        so a player can see which part is carrying their total.
                        Absent for a referrer with no contest-window rows. */}
                    {cx ? (
                      <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: C.soft, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {cx.users} player{cx.users === 1 ? '' : 's'} <span style={{ opacity: .5 }}>&times;1</span>
                        {' · '}{cx.sessions} session{cx.sessions === 1 ? '' : 's'} <span style={{ opacity: .5 }}>&times;{CONTEST.SESSION_WEIGHT}</span>
                        {' · '}{cx.plays} play{cx.plays === 1 ? '' : 's'} <span style={{ opacity: .5 }}>&times;{CONTEST.PLAY_WEIGHT}</span>
                      </span>
                    ) : null}
                  </span>
                  <span style={{ flex: 'none', textAlign: 'right', minWidth: 54 }}>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: C.soft, fontWeight: 700 }}>{r.unit}</span>
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ padding: 26, textAlign: 'center', color: C.soft, fontSize: 14 }}>
              {onContest ? 'No qualifying entries yet. Share your link and you are in first place.' : 'Nobody has brought in a player yet in this window. The top spot is open.'}
            </div>
          )}
        </div>

        <div style={{ marginTop: 26 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, margin: '0 0 6px' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>Latest shares</h2>
          {feed && feed.length ? <span style={{ fontSize: 12, color: C.soft, fontWeight: 700 }}>{feed.length} most recent</span> : null}
        </div>
        <div style={{ fontSize: 12, color: C.soft, marginBottom: 12, lineHeight: 1.5 }}>
          Every time a shared link brings in a new player who finishes a game, newest first.
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
          {feed === null ? (
            <div style={{ padding: 26, textAlign: 'center', color: C.soft, fontSize: 14 }}>Loading…</div>
          ) : feed.length ? (
            <>
              {(feedAll ? feed : feed.slice(0, 15)).map((f, i) => {
                const mine = me && me.username && f.sharer === me.username;
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 15px', borderTop: i ? `1px solid ${C.line}` : 'none', background: mine ? 'rgba(232,180,58,0.10)' : 'transparent' }}>
                    <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <b style={{ fontWeight: 800 }}>{f.sharer}</b>
                        <span style={{ color: C.muted }}> brought in </span>
                        <b style={{ fontWeight: 700 }}>{f.joined || 'a new player'}</b>
                      </span>
                      {f.game ? (
                        <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: C.soft, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          via{' '}
                          {f.game.href ? <Link href={f.game.href} style={{ color: C.soft, textDecoration: 'underline' }}>{f.game.label}</Link> : f.game.label}
                        </span>
                      ) : null}
                    </span>
                    <span style={{ flex: 'none', fontSize: 12, color: C.soft, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{ago(f.at, now)}</span>
                  </div>
                );
              })}
              {!feedAll && feed.length > 15 ? (
                <button type="button" onClick={() => setFeedAll(true)} style={{ display: 'block', width: '100%', fontFamily: FONT, fontSize: 13, fontWeight: 800, color: C.ink, background: C.well, border: 0, borderTop: `1px solid ${C.line}`, borderRadius: 0, padding: '11px', cursor: 'pointer' }}>
                  Show all {feed.length}
                </button>
              ) : null}
            </>
          ) : (
            <div style={{ padding: 26, textAlign: 'center', color: C.soft, fontSize: 14 }}>No shares have landed yet. Yours could be the first.</div>
          )}
        </div>
      </div>

      {joinOpen && (
        <div
          onClick={() => setJoinOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(14,29,64,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 390, maxWidth: '100%', background: 'var(--stg-raise)', color: C.ink, borderRadius: 16, padding: '22px 20px 20px', maxHeight: '88vh', overflow: 'auto' }}>
            <JoinLeaderboardForm
              hideIcon
              heading="Register to get your share link"
              identity={identity}
              onJoined={(id) => { setIdentity(id); setJoinOpen(false); load(days); }}
            />
          </div>
        </div>
      )}

      </div>
    </GroupsShell>
  );
}
