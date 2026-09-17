'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Flag,
  BookMarked,
  RefreshCw,
  BarChart3,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  PenLine,
} from 'lucide-react';
import { getSources, voteKey, autoSourceNote } from '@/lib/helpers';
import { T } from '@/lib/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return '';
  }
}

function fmtShort(iso) {
  try {
    const d = new Date(iso);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return '';
  }
}

// Relative time for the live streams: "12s ago", "4m ago", "3h ago", else date.
function fmtRelative(iso) {
  try {
    const then = new Date(iso).getTime();
    const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return fmtShort(iso);
  } catch {
    return '';
  }
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// 1st pick = delta 3, 2nd = delta 2, 3rd = delta 1 (see DetailClient points map).
function rankWord(delta) {
  if (delta === 3) return '1st';
  if (delta === 2) return '2nd';
  if (delta === 1) return '3rd';
  return null;
}

// Within a voting session, show each ballot's picks top-down: 1st, 2nd, 3rd.
// Vote events arrive newest-first, which reverses the picks of a single
// ballot (the 3rd-recorded pick renders on top). Votes cast within 5 minutes
// of each other count as one ballot; ballots themselves stay newest-first,
// and inside a ballot picks sort by delta descending (1st pick = 3 points).
const BALLOT_MS = 5 * 60 * 1000;
function ballotOrdered(votes) {
  const ballots = [];
  votes.forEach((v) => {
    const b = ballots[ballots.length - 1];
    if (b && b.minT - v.t <= BALLOT_MS) {
      b.votes.push(v);
      if (v.t < b.minT) b.minT = v.t;
    } else {
      ballots.push({ minT: v.t, votes: [v] });
    }
  });
  return ballots.flatMap((b) => [...b.votes].sort((a, c) => (c.delta || 0) - (a.delta || 0)));
}

function researchLabel(ev) {
  const item = ev.itemName || 'An item';
  // Rows with prev_rank recorded show the exact movement; 0 = unranked
  // (outside the top 10). Ranks shown never exceed 10 by construction.
  if (ev.prevRank !== null && ev.prevRank !== undefined) {
    const from = ev.prevRank > 0 ? `#${ev.prevRank}` : 'unranked';
    const to = ev.rank > 0 ? `#${ev.rank}` : 'unranked';
    return { item, tail: `moved from ${from} to ${to}` };
  }
  // Legacy rows (before prev_rank existed) keep the boundary phrasing.
  if (ev.changeType === 'entered_top3') return { item, tail: `entered the top 3 (#${ev.rank || 3})` };
  if (ev.changeType === 'entered_top10') return { item, tail: 'entered the top 10' };
  if (ev.changeType === 'exited_top3') return { item, tail: 'dropped out of the top 3' };
  if (ev.changeType === 'exited_top10') return { item, tail: 'dropped out of the top 10' };
  return { item, tail: 'moved in the rankings' };
}

// Collapse movement rows to one per item (earliest prev_rank to latest rank,
// in detection order), so a multi-pick ballot's per-pick rows, or a vote-time
// row plus the cron's later duplicate, render as a single clean movement.
// No-op rows (prev === new) drop out.
function collapseMoves(changes) {
  const byItem = new Map();
  [...changes]
    .sort((a, b) => (a.detectedAt ? new Date(a.detectedAt).getTime() : 0) - (b.detectedAt ? new Date(b.detectedAt).getTime() : 0))
    .forEach((c) => {
      const k = (c.itemName || '').toLowerCase().trim();
      const cur = byItem.get(k);
      if (!cur) byItem.set(k, { ...c });
      else {
        cur.rank = c.rank;
        if (c.changeType && cur.changeType !== c.changeType) cur.changeType = 'moved';
      }
    });
  return [...byItem.values()].filter((c) => !(c.prevRank !== null && c.prevRank !== undefined && c.prevRank === c.rank));
}

// A reduced-weight annotation ("· 0.5x Weight") is a re-encode refinement, not
// part of a source as originally added. Strip it for the ADD/launch contexts so
// the weight shows up only in the "Re-encoded" box where the change happened.
// Mirrored in app/feed/FeedClient.jsx.
function stripWeight(label) {
  return typeof label === 'string' ? label.replace(/\s*·\s*[\d.]+x\s*Weight/i, '') : label;
}

const MONO = "'DM Mono', monospace";
const SERIF = "'Manrope', serif";
const SANS = "'Manrope', sans-serif";

// Per-category accent colors, matching the global activity ledger (FeedClient).
const KC = {
  source: '#2f4858',   // slate  - sources on file / source added
  research: '#5a4a7a', // purple - re-researched / ranking changes
  vote: '#3d4f2b',     // forest - live votes
  review: '#9a6a1f',   // amber  - review requests
  edit: '#8a3324',     // dark ember - deploy-side list edits
  created: '#1a1611',  // ink    - list created
  comment: T.danger,  // ember  - public comments
};

// Tinted card with a colored left border, one per activity category.
function cardStyle(color) {
  return {
    position: 'relative',
    marginBottom: 12,
    padding: '12px 15px 13px',
    background: `${color}12`,
    borderLeft: `3px solid ${color}`,
    borderRadius: '0 6px 6px 0',
  };
}

function chipStyle(color) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: `${color}24`,
    color,
    padding: '3px 8px',
    borderRadius: 3,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 700,
  };
}

// Up to two category chips side by side: the primary (icon/color/children)
// plus an optional `extra` chip ({ icon, color, label }) for combined events.
function Badge({ icon, color, children, live, date, extra }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={chipStyle(color)}>
        {icon}
        {children}
      </span>
      {extra && (
        <span style={chipStyle(extra.color)}>
          {extra.icon}
          {extra.label}
        </span>
      )}
      {date && (
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.slate }}>
          {date}
        </span>
      )}
      {live && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: color,
            display: 'inline-block',
            animation: 'sotpulse 1.6s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}

// `strike` (not s.removed) drives the line-through, so a removed source is only
// struck where the card is ABOUT its removal (the Source removed card and the
// Removed-tagged bubble in a revisit) -- never in the launch listing, where it
// was a genuine source at publish time. `label` overrides s.label when given
// (the add/launch contexts pass a weight-stripped label).
function SourceCard({ s, tag, note, strike, label }) {
  return (
    <div
      style={{
        background: T.white,
        border: `1px solid ${T.surfaceAlt}`,
        borderRadius: 7,
        padding: '7px 11px',
        fontSize: 13,
        color: T.ink,
      }}
    >
      <span style={strike ? { textDecoration: 'line-through', color: T.slate } : undefined}>{label != null ? label : s.label}</span>
      {tag && (
        <span
          style={{
            fontSize: 10,
            background: '#e8e2d6',
            color: T.slate,
            padding: '1px 7px',
            borderRadius: 10,
            marginLeft: 6,
            fontFamily: MONO,
          }}
        >
          {tag}
        </span>
      )}
      {s.trueExpert && (
        <span
          style={{
            fontSize: 10,
            background: '#f6e3cf',
            color: T.blueDeep,
            padding: '1px 7px',
            borderRadius: 10,
            marginLeft: 6,
            fontFamily: MONO,
          }}
        >
          True Expert
        </span>
      )}
      {note && (
        <div style={{ marginTop: 4, fontSize: 12, color: T.slate, lineHeight: 1.45 }}>{note}</div>
      )}
    </div>
  );
}

// Per-list activity feed: created time, sources (dated), re-research, live
// votes, anonymized review requests, and public comments.
export default function ActivityFeed({ list, voteData, extras }) {
  const [feed, setFeed] = useState({ votes: [], manager: [], research: [], comments: [], sources: [], editorNotes: [], removedSources: [] });
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/list-feed?listId=${encodeURIComponent(list.id)}`, { cache: 'no-store' });
      const data = await res.json();
      setFeed({
        votes: data.votes || [],
        manager: data.manager || [],
        research: data.research || [],
        comments: data.comments || [],
        sources: data.sources || [],
        editorNotes: data.editorNotes || [],
        removedSources: data.removedSources || [],
      });
    } catch {
      /* leave streams empty on error */
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load();
    // 20s -> 60s and skip hidden tabs (egress fix 2026-07-12): a backgrounded
    // list page was re-reading the whole feed three times a minute. The
    // visibilitychange refresh keeps the feed feeling live on return.
    const t = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') load();
    }, 60000);
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.id]);

  async function postComment() {
    const text = body.trim();
    if (!text || posting) return;
    setPosting(true);
    const optimistic = { name: name.trim() || null, body: text, createdAt: new Date().toISOString() };
    setFeed((f) => ({ ...f, comments: [optimistic, ...f.comments] }));
    setBody('');
    setName('');
    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: list.id, name: optimistic.name || '', body: text }),
      });
    } catch {
      /* optimistic entry stays; reconciles on next poll */
    }
    setPosting(false);
  }

  // Sources from the feed API (dated). Fall back to the static list data if the
  // API returned none (e.g. before the source-tracking migration is applied).
  const apiSources = feed.sources || [];
  const clientSources = Object.entries(list.sources || {})
    .filter(([id, s]) => (id !== 'ai' || list.mode === 'facts') && s && s.label)
    .map(([id, s]) => ({ id, label: s.label, trueExpert: Boolean(s.trueExpert), addedAt: list.publishedAt || list.publishedDate || null }));
  const sources = apiSources.length ? apiSources : clientSources;

  // Launch batch = sources first seen within 6h of the list's publish time
  // (the cron backfills genuinely-at-launch sources to the publish timestamp
  // exactly). Anything later is a dated post-launch addition shown as its own
  // entry. Mirrors the 6h window in app/feed/page.js -- keep the two in sync.
  const LAUNCH_WINDOW_MS = 6 * 3600 * 1000;
  const pubMsRef = Date.parse(list.publishedAt || list.publishedDate || '');
  let launchSources = sources;
  let laterSources = [];
  if (sources.length > 0 && !isNaN(pubMsRef)) {
    const isLaunch = (s) => {
      const t = Date.parse(s.addedAt || '');
      return isNaN(t) || t - pubMsRef < LAUNCH_WINDOW_MS;
    };
    launchSources = sources.filter(isLaunch);
    laterSources = sources.filter((s) => !isLaunch(s)).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }
  const launchDate = launchSources.length ? launchSources[0].addedAt : null;

  const created = list.publishedAt || list.publishedDate;

  // ------- Build ONE strictly time-ordered stream (newest first). -------
  // Every ledger entry carries its moment-in-time timestamp and the entries
  // are interleaved chronologically rather than grouped by type, so a vote
  // cast after a source addition displays above it.

  // Post-launch source additions (grouped by timestamp) plus dated label
  // refreshes (re-gathered ratings, a new year's edition) as their own
  // "Updated sources" group.
  const sourceGroups = [];
  {
    const byTs = new Map();
    laterSources.forEach((s) => {
      const k = s.addedAt || '';
      if (!byTs.has(k)) byTs.set(k, { addedAt: s.addedAt, ts: new Date(s.addedAt).getTime(), sources: [], changes: [] });
      byTs.get(k).sources.push(s);
    });
    sources.forEach((s) => {
      if (!s.updatedAt) return;
      const k = `upd::${s.updatedAt}`;
      if (!byTs.has(k)) byTs.set(k, { addedAt: s.updatedAt, ts: new Date(s.updatedAt).getTime(), sources: [], changes: [], updated: true });
      byTs.get(k).sources.push({ ...s, refreshed: true });
    });
    sourceGroups.push(...byTs.values());
    // Merge a same-deploy refresh into its sibling source addition (the cron
    // stamps both within the same run, so timestamps land minutes apart):
    // ONE combined "Sources Revisited" card instead of separate added and
    // refreshed boxes. Mirrors app/feed/page.js.
    const SR_MERGE_MS = 60 * 60 * 1000;
    for (let i = sourceGroups.length - 1; i >= 0; i--) {
      const u = sourceGroups[i];
      if (!u.updated) continue;
      const host = sourceGroups.find((a) => a !== u && !a.updated && Math.abs(a.ts - u.ts) <= SR_MERGE_MS);
      if (host) {
        host.sources.push(...u.sources);
        host.changes.push(...u.changes);
        host.mixed = true;
        sourceGroups.splice(i, 1);
      }
    }
  }

  // Voting sessions: consecutive vote events within 4h of each other form one
  // "Voting" entry, stamped at its newest vote.
  const VOTE_GAP_MS = 4 * 3600 * 1000;
  const voteGroups = [];
  {
    const sorted = (feed.votes || [])
      .map((v) => ({ ...v, t: new Date(v.createdAt).getTime() }))
      .filter((v) => !isNaN(v.t))
      .sort((a, b) => b.t - a.t);
    sorted.forEach((v) => {
      const last = voteGroups[voteGroups.length - 1];
      if (last && last.minTs - v.t <= VOTE_GAP_MS) {
        last.votes.push(v);
        if (v.t < last.minTs) last.minTs = v.t;
      } else {
        voteGroups.push({ ts: v.t, minTs: v.t, votes: [v], changes: [] });
      }
    });
  }

  // Standalone removal groups: build them BEFORE attribution so the changes a
  // source removal produced can attach to its "Source removed" card the way
  // additions absorb their changes. A removal in the same deploy as additions
  // /refreshes folds into the host Sources Revisited card instead.
  const removedGroups = [];
  {
    const byTs = new Map();
    (feed.removedSources || []).forEach((s) => {
      const k = s.removedAt || '';
      const t = new Date(s.removedAt || 0).getTime();
      if (!byTs.has(k)) byTs.set(k, { removedAt: s.removedAt, ts: isNaN(t) ? 0 : t, sources: [], changes: [] });
      byTs.get(k).sources.push(s);
    });
    [...byTs.values()].forEach((g) => {
      const host = sourceGroups.find((a) => Math.abs(a.ts - g.ts) <= 60 * 60 * 1000);
      if (host) {
        g.sources.forEach((s) => host.sources.push({ ...s, removed: true }));
        host.mixed = true;
        return;
      }
      removedGroups.push(g);
    });
  }

  // Attribute consensus movements to their cause. Edit-caused changes (and
  // legacy rows with no recorded cause) attach to the source addition OR
  // standalone removal that preceded them within ~26h; vote-caused changes
  // attach to the voting session that preceded them the same way, so every
  // cause entry shows the movements it produced.
  const RESEARCH_WINDOW_MS = 26 * 3600 * 1000;
  const looseChanges = [];
  (feed.research || []).forEach((ev) => {
    const t = ev.detectedAt ? new Date(ev.detectedAt).getTime() : 0;
    let best = null;
    if (ev.cause !== 'votes') {
      sourceGroups.forEach((g) => {
        if (g.ts <= t && t - g.ts <= RESEARCH_WINDOW_MS && (!best || g.ts > best.ts)) best = g;
      });
      removedGroups.forEach((g) => {
        if (g.ts <= t && t - g.ts <= RESEARCH_WINDOW_MS && (!best || g.ts > best.ts)) best = g;
      });
    }
    if (!best && ev.cause === 'votes') {
      voteGroups.forEach((g) => {
        if (g.minTs <= t && t - g.ts <= RESEARCH_WINDOW_MS && (!best || g.ts > best.ts)) best = g;
      });
    }
    if (best) best.changes.push(ev);
    // Orphan changes (no source card or voting session to attach to) are NOT
    // rendered as standalone cards. Every legitimate ranking change has a
    // visible cause: a source addition/revision shows a Sources card the
    // movements attach to, and fan-vote movements show under their voting
    // session via the live replay. A loose change has no such home, so a bare
    // "RANKING CHANGE" with no shown cause is just noise: a vote shift the cron
    // re-detected long after the ballot (a duplicate of the replay), or a list
    // reseeded/repurposed near launch (items merely being populated). Drop all.
    // (no else clause: orphan changes are intentionally dropped)
  });

  // Live voting impact: replay the vote events backwards from the current
  // live totals so every voting session gets a before/after consensus diff,
  // shown immediately rather than waiting for the daily cron to record it.
  // Cron-recorded rows (g.changes) are authoritative and win on dedupe; the
  // computed rows only fill in items the cron has not logged yet.
  if (voteData && voteGroups.length > 0) {
    const consensusTop10 = (totals) => {
      try {
        const c = (getSources(list, totals, extras) || []).find((s) => s.id === 'consensus');
        return c ? c.items.slice(0, 10) : null;
      } catch {
        return null;
      }
    };
    const totals = { ...voteData };
    voteGroups.forEach((g) => {
      // Groups run newest-first, so `totals` holds the state just after this
      // session; subtracting its votes gives the state just before it.
      const after = consensusTop10(totals);
      g.votes.forEach((v) => {
        const k = voteKey(list.id, v.itemName || '');
        totals[k] = (totals[k] || 0) - (v.delta || 0);
      });
      const before = consensusTop10(totals);
      if (!after || !before) return;
      const logged = new Set(g.changes.map((c) => (c.itemName || '').toLowerCase()));
      const union = [...new Set([...before, ...after])];
      const votedKeys = new Set(g.votes.map((v) => (v.itemName || '').toLowerCase().trim()));
      g.liveChanges = union
        .flatMap((item) => {
          const prevRank = before.indexOf(item) + 1; // 0 = unranked
          const rank = after.indexOf(item) + 1;
          if (prevRank === rank || logged.has(item.toLowerCase())) return [];
          return [{ itemName: item, prevRank, rank, voted: votedKeys.has(item.toLowerCase().trim()) }];
        })
        // Directly-voted items lead; displaced neighbors follow by new rank.
        .sort((a, b) => (b.voted - a.voted) || ((a.rank || 99) - (b.rank || 99)));
    });
  }

  // The single chronological stream.
  const stream = [];
  sourceGroups.forEach((g) => stream.push({ ts: g.ts, type: 'sourceGroup', g }));
  voteGroups.forEach((g) => stream.push({ ts: g.ts, type: 'voteGroup', g }));
  looseChanges.forEach((ev) => stream.push({ ts: ev.detectedAt ? new Date(ev.detectedAt).getTime() : 0, type: 'change', ev }));
  (feed.editorNotes || []).forEach((n) => {
    const t = new Date(n.createdAt).getTime();
    stream.push({ ts: isNaN(t) ? 0 : t, type: 'editorNote', n });
  });
  (feed.manager || []).forEach((m) => {
    const t = new Date(m.createdAt).getTime();
    stream.push({ ts: isNaN(t) ? 0 : t, type: 'managerNote', m });
  });
  removedGroups.forEach((g) => stream.push({ ts: g.ts, type: 'removedGroup', g }));
  const createdMs = Date.parse(created || '');
  stream.push({ ts: isNaN(createdMs) ? 0 : createdMs, type: 'created' });
  stream.sort((a, b) => b.ts - a.ts);
  const newestVoteGroup = voteGroups.length ? voteGroups.reduce((a, b) => (b.ts > a.ts ? b : a)) : null;

  return (
    <div style={{ fontFamily: SANS, color: T.ink, maxWidth: 640 }}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes sotpulse{0%,100%{opacity:1}50%{opacity:.25}}` }} />

      <div>
        {stream.map((te, i) => {
          const last = i === stream.length - 1;

          // Post-launch source additions + the ranking changes they caused,
          // one combined card.
          if (te.type === 'sourceGroup') {
            const g = te.g;
            const hasChanges = g.changes.length > 0;
            return (
              <section key={`te-${i}`} style={{ ...cardStyle(hasChanges ? KC.research : KC.source), ...(last ? { marginBottom: 0 } : {}) }}>
                <Badge
                  color={KC.source}
                  icon={<BookMarked size={11} strokeWidth={2.5} />}
                  extra={hasChanges ? { icon: <RefreshCw size={11} strokeWidth={2.5} />, color: KC.research, label: 'Ranking change' } : undefined}
                  date={fmtDate(g.addedAt)}
                >
                  {g.mixed || g.updated ? 'Sources Revisited' : g.sources.length === 1 ? 'Source added' : 'Sources added'}
                </Badge>
                <div style={{ fontFamily: SERIF, fontSize: 16, margin: '6px 0 8px' }}>
                  {(() => {
                    const nRef = g.sources.filter((x) => x.refreshed).length;
                    const nRem = g.sources.filter((x) => x.removed).length;
                    const nAdd = g.sources.length - nRef - nRem;
                    const parts = [];
                    if (nAdd) parts.push(`${nAdd} added`);
                    if (nRef) parts.push(`${nRef} re-encoded`);
                    if (nRem) parts.push(`${nRem} removed`);
                    const head = g.mixed
                      ? `Revisited the sources: ${parts.join(', ')}`
                      : g.updated
                        ? `Revisited ${g.sources.length === 1 ? 'a source' : g.sources.length + ' sources'}`
                        : null;
                    if (hasChanges) return `${head || 'Added ' + (g.sources.length === 1 ? 'a source' : g.sources.length + ' sources')}, the ranking shifted`;
                    if (head) return head;
                    return g.sources.length === 1 ? 'New source on file' : `${g.sources.length} new sources on file`;
                  })()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {g.sources.map((s, k) => (
                    <SourceCard
                      key={k}
                      s={s}
                      tag={g.mixed ? (s.removed ? 'Removed' : s.refreshed ? 'Re-encoded' : 'Added') : undefined}
                      strike={s.removed}
                      label={(s.refreshed || s.removed) ? s.label : stripWeight(s.label)}
                      note={(s.refreshed || s.removed) ? ((list.sourceRevisions || {})[s.id] || (s.refreshed ? autoSourceNote(s.label) : undefined)) : undefined}
                    />
                  ))}
                </div>
                {hasChanges && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {collapseMoves(g.changes).map((ev, k) => {
                      const { item, tail } = researchLabel(ev);
                      return (
                        <div key={k} style={{ fontSize: 13, color: T.ink }}>
                          <RefreshCw size={11} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5, color: KC.research }} />
                          <strong style={{ fontWeight: 500, color: KC.research }}>{item}</strong> {tail}.
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          }

          // A voting session + the ranking movements those votes produced.
          if (te.type === 'voteGroup') {
            const g = te.g;
            const allChanges = collapseMoves([...g.changes, ...(g.liveChanges || [])]);
            const hasChanges = allChanges.length > 0;
            return (
              <section key={`te-${i}`} style={{ ...cardStyle(hasChanges ? KC.research : KC.vote), ...(last ? { marginBottom: 0 } : {}) }}>
                <Badge
                  color={KC.vote}
                  icon={<BarChart3 size={11} strokeWidth={2.5} />}
                  extra={hasChanges ? { icon: <RefreshCw size={11} strokeWidth={2.5} />, color: KC.research, label: 'Ranking change' } : undefined}
                  date={fmtDate(g.votes[0].createdAt)}
                  live={g === newestVoteGroup}
                >
                  Voting
                </Badge>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {ballotOrdered(g.votes).slice(0, 8).map((v, k) => {
                    const rw = rankWord(v.delta);
                    return (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        {v.delta >= 0 ? (
                          <ArrowUp size={14} strokeWidth={2.5} color={T.successDeep} />
                        ) : (
                          <ArrowDown size={14} strokeWidth={2.5} color={T.accent} />
                        )}
                        <span>
                          Someone voted{' '}
                          <strong style={{ fontWeight: 500 }}>{v.itemName}</strong>
                          {rw && (
                            <span style={{ fontFamily: MONO, fontSize: 10, color: T.blueDeep, marginLeft: 6 }}>
                              {rw} pick
                            </span>
                          )}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: T.slate, marginLeft: 'auto' }}>
                          {fmtRelative(v.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                  {g.votes.length > 8 && (
                    <div style={{ fontFamily: MONO, fontSize: 10, color: T.slate }}>
                      + {g.votes.length - 8} more {g.votes.length - 8 === 1 ? 'vote' : 'votes'}
                    </div>
                  )}
                </div>
                {hasChanges && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {allChanges.map((ev, k) => {
                      const { item, tail } = researchLabel(ev);
                      return (
                        <div key={k} style={{ fontSize: 13, color: T.ink }}>
                          <RefreshCw size={11} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5, color: KC.research }} />
                          <strong style={{ fontWeight: 500, color: KC.research }}>{item}</strong> {tail}.
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          }

          // A consensus movement with no nearby cause entry: a vote-driven
          // change whose votes have rolled off, or a deploy-side list edit.
          if (te.type === 'change') {
            const ev = te.ev;
            const { item, tail } = researchLabel(ev);
            return (
              <section key={`te-${i}`} style={{ ...cardStyle(KC.research), ...(last ? { marginBottom: 0 } : {}) }}>
                {/* Null cause = legacy row with no recorded cause: render a
                    neutral Ranking change chip, never imply voting that may
                    not have happened. */}
                {ev.cause ? (
                  <Badge
                    color={ev.cause === 'edit' ? KC.edit : KC.vote}
                    icon={ev.cause === 'edit' ? <PenLine size={11} strokeWidth={2.5} /> : <BarChart3 size={11} strokeWidth={2.5} />}
                    extra={{ icon: <RefreshCw size={11} strokeWidth={2.5} />, color: KC.research, label: 'Ranking change' }}
                    date={fmtDate(ev.detectedAt)}
                  >
                    {ev.cause === 'edit' ? 'List edited' : 'Voting'}
                  </Badge>
                ) : (
                  <Badge color={KC.research} icon={<RefreshCw size={11} strokeWidth={2.5} />} date={fmtDate(ev.detectedAt)}>
                    Ranking change
                  </Badge>
                )}
                <div style={{ fontSize: 13, color: T.ink, marginTop: 8 }}>
                  <strong style={{ fontWeight: 500, color: KC.research }}>{item}</strong> {tail}.
                </div>
              </section>
            );
          }

          // Editor's note posted from the admin desk.
          if (te.type === 'editorNote') {
            const n = te.n;
            return (
              <section key={`te-${i}`} style={{ ...cardStyle(KC.comment), ...(last ? { marginBottom: 0 } : {}) }}>
                <Badge color={KC.comment} icon={<PenLine size={11} strokeWidth={2.5} />} date={fmtDate(n.createdAt)}>Editor's Note</Badge>
                <div style={{ background: T.white, borderLeft: `3px solid ${KC.comment}`, borderRadius: '0 7px 7px 0', padding: '8px 11px', fontSize: 13, whiteSpace: 'pre-wrap', marginTop: 9 }}>
                  {n.note}
                </div>
              </section>
            );
          }

          // Anonymized review request sent privately to the editors.
          if (te.type === 'managerNote') {
            const m = te.m;
            return (
              <section key={`te-${i}`} style={{ ...cardStyle(KC.review), ...(last ? { marginBottom: 0 } : {}) }}>
                <Badge color={KC.review} icon={<MessageSquare size={11} strokeWidth={2.5} />} date={fmtDate(m.createdAt)}>Review request</Badge>
                <div style={{ fontSize: 12, color: T.slate, marginTop: 4, fontStyle: 'italic' }}>
                  Sent privately to the editors. No names or emails shown.
                </div>
                <div style={{ background: T.white, borderLeft: `3px solid ${KC.review}`, borderRadius: '0 7px 7px 0', padding: '8px 11px', fontSize: 13, marginTop: 9 }}>
                  {m.message}
                  {m.editorResponse && (
                    <div style={{ marginTop: 5, paddingTop: 5, borderTop: `1px solid ${T.surfaceAlt}` }}>
                      <strong style={{ fontWeight: 700, color: T.accent }}>Editor:</strong> {m.editorResponse}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // Sources removed from the list, plus the ranking changes the
          // removal produced (same 26h-after attribution as source additions).
          if (te.type === 'removedGroup') {
            const g = te.g;
            const hasChanges = (g.changes || []).length > 0;
            return (
              <section key={`te-${i}`} style={{ ...cardStyle(hasChanges ? KC.research : KC.source), ...(last ? { marginBottom: 0 } : {}) }}>
                <Badge
                  color={KC.source}
                  icon={<BookMarked size={11} strokeWidth={2.5} />}
                  extra={hasChanges ? { icon: <RefreshCw size={11} strokeWidth={2.5} />, color: KC.research, label: 'Ranking change' } : undefined}
                  date={g.removedAt ? fmtDate(g.removedAt) : undefined}
                >
                  {g.sources.length === 1 ? 'Source removed' : 'Sources removed'}
                </Badge>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 9 }}>
                  {g.sources.map((s, k) => {
                    const note = s.id ? (list.sourceRevisions || {})[s.id] : undefined;
                    return (
                      <div key={k} style={{ background: T.white, border: `1px solid ${T.surfaceAlt}`, borderRadius: 7, padding: '7px 11px', fontSize: 13 }}>
                        <span style={{ textDecoration: 'line-through', color: T.slate }}>{s.label}</span>
                        {note && (
                          <div style={{ marginTop: 4, fontSize: 12, color: T.slate, lineHeight: 1.45 }}>{note}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {hasChanges && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {collapseMoves(g.changes).map((ev, k) => {
                      const { item, tail } = researchLabel(ev);
                      return (
                        <div key={k} style={{ fontSize: 13, color: T.ink }}>
                          <RefreshCw size={11} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5, color: KC.research }} />
                          <strong style={{ fontWeight: 500, color: KC.research }}>{item}</strong> {tail}.
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          }

          // Publishing of the ranking: list created + the launch sources.
          return (
            <section key={`te-${i}`} style={{ ...cardStyle(KC.created), ...(last ? { marginBottom: 0 } : {}) }}>
              <Badge
                color={KC.created}
                icon={<Flag size={11} strokeWidth={2.5} />}
                extra={launchSources.length > 0 ? { icon: <BookMarked size={11} strokeWidth={2.5} />, color: KC.source, label: 'Sources' } : undefined}
                date={created ? fmtDate(created) : undefined}
              >
                List created
              </Badge>
              <div style={{ fontFamily: SERIF, fontSize: 16, marginTop: 6 }}>Published the ranking</div>
              <div style={{ fontSize: 13, color: T.slate, marginTop: 2 }}>Seeded from expert sources and live fan voting.</div>
              {launchSources.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.slate, marginBottom: 6 }}>
                    {launchSources.length} {launchSources.length === 1 ? 'source' : 'sources'} at launch
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {launchSources.map((s, k) => (
                      <SourceCard key={k} s={s} label={stripWeight(s.label)} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Public comments */}
      <div style={{ borderTop: `2px solid ${T.ink}`, marginTop: 28, paddingTop: 16 }}>
        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600 }}>Join the conversation</div>
        <div style={{ fontSize: 12, color: T.slate, marginBottom: 12 }}>
          Public comment. Name is optional, posts as "Guest" if left blank.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
          {feed.comments.length === 0 && loaded && (
            <div style={{ fontSize: 13, color: T.slate }}>No comments yet. Start the conversation.</div>
          )}
          {feed.comments.map((c, i) => {
            const guest = !c.name;
            return (
              <div key={c.id || i} style={{ display: 'flex', gap: 10 }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: guest ? T.slate : T.accent,
                    color: T.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: MONO,
                    fontSize: 12,
                  }}
                >
                  {guest ? '?' : initials(c.name)}
                </div>
                <div style={{ background: T.white, border: `1px solid ${T.surfaceAlt}`, borderRadius: 9, padding: '8px 12px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name || 'Guest'}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T.slate }}>{fmtRelative(c.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13, marginTop: 2, whiteSpace: 'pre-wrap' }}>{c.body}</div>
                  {c.editorResponse && (
                    <div style={{ fontSize: 13, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.surfaceAlt}` }}>
                      <strong style={{ fontWeight: 700, color: T.accent }}>Editor:</strong> {c.editorResponse}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.slate}`, borderRadius: 10, padding: 11 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={120}
            style={{ width: '100%', boxSizing: 'border-box', border: 'none', borderBottom: `1px solid ${T.surfaceAlt}`, background: 'transparent', fontFamily: SANS, fontSize: 13, padding: '5px 2px', marginBottom: 8, outline: 'none', color: T.ink }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            maxLength={1000}
            style={{ width: '100%', boxSizing: 'border-box', border: 'none', background: 'transparent', fontFamily: SANS, fontSize: 13, padding: 2, resize: 'vertical', outline: 'none', color: T.ink }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              onClick={postComment}
              disabled={posting || !body.trim()}
              style={{ background: T.accent, color: T.white, border: 'none', fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', padding: '7px 16px', borderRadius: 7, cursor: posting || !body.trim() ? 'default' : 'pointer', opacity: posting || !body.trim() ? 0.5 : 1 }}
            >
              {posting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
