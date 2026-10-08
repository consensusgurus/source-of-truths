'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Flag, ListPlus, BarChart3, MessageSquare, PenLine, RefreshCw, BookMarked } from 'lucide-react';
import { T } from '@/lib/theme';
// Re-themed to the site's white/Manrope/blue design (was the cream COLORS from
// lib/data). Same keys, new values, so every COLORS.* reference below picks up
// the new palette with no other change.
const COLORS = { ink: T.ink, faded: T.muted, ember: T.accent, cream: T.white, paper: 'rgba(20,22,28,0.12)', soft: T.muted };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  if (isNaN(d)) return '';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// A reduced-weight annotation ("· 0.5x Weight") is a re-encode refinement, not
// part of a source as originally added, so it shows only in the Re-encoded box.
// Strip it from the launch listing and the "Added" cards. Mirrors ActivityFeed.jsx.
function stripWeight(label) {
  return typeof label === 'string' ? label.replace(/\s*·\s*[\d.]+x\s*Weight/i, '') : label;
}

// Exact movement text for ranking-change events. Rows with prev_rank show
// "moved from #X to #Y" (0 = unranked); legacy rows keep boundary phrasing.
function moveTail(ev) {
  if (ev.prevRank !== null && ev.prevRank !== undefined) {
    const from = ev.prevRank > 0 ? `#${ev.prevRank}` : 'unranked';
    const to = ev.rank > 0 ? `#${ev.rank}` : 'unranked';
    return `moved from ${from} to ${to}`;
  }
  if (ev.changeType === 'entered_top3') return `entered the top 3 (#${ev.rank || 3})`;
  if (ev.changeType === 'entered_top10') return 'entered the top 10';
  if (ev.changeType === 'exited_top3') return 'dropped out of the top 3';
  if (ev.changeType === 'exited_top10') return 'dropped out of the top 10';
  return 'moved in the rankings';
}

// Collapse movement rows to one per item (earliest prev_rank to latest rank),
// so per-pick vote rows or a vote-time row plus the cron's later duplicate
// render as one clean movement; no-ops drop. Mirrors ActivityFeed.jsx.
function collapseMoves(changes) {
  const byItem = new Map();
  [...changes]
    .sort((a, b) => (a.ts || 0) - (b.ts || 0))
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

function rankWord(delta) {
  if (delta === 3) return '1st';
  if (delta === 2) return '2nd';
  if (delta === 1) return '3rd';
  return null;
}

// Within a voting session, show each ballot's picks top-down: 1st, 2nd, 3rd.
// Votes arrive newest-first, which reverses a single ballot's picks; votes
// cast within 5 minutes of each other count as one ballot, and picks inside
// a ballot sort by delta descending (1st pick = 3 points). Mirrors
// ActivityFeed.jsx.
const BALLOT_MS = 5 * 60 * 1000;
function ballotOrdered(votes) {
  const ballots = [];
  votes.forEach((v) => {
    const b = ballots[ballots.length - 1];
    if (b && b.minT - (v.ts || 0) <= BALLOT_MS) {
      b.votes.push(v);
      if ((v.ts || 0) < b.minT) b.minT = v.ts || 0;
    } else {
      ballots.push({ minT: v.ts || 0, votes: [v] });
    }
  });
  return ballots.flatMap((b) => [...b.votes].sort((a, c) => (c.delta || 0) - (a.delta || 0)));
}

// Each event kind gets its own distinct accent color + icon so categories
// read as separate blocks instead of running together.
const KIND = {
  list:     { color: '#2f4858', label: 'New list',       Icon: Flag },
  request:  { color: '#a44a26', label: 'List requested',  Icon: ListPlus },
  vote:     { color: '#3d4f2b', label: 'Vote',            Icon: BarChart3 },
  comment:  { color: T.danger, label: 'Comment',         Icon: MessageSquare },
  review:   { color: '#9a6a1f', label: 'Review request',  Icon: PenLine },
  research: { color: '#5a4a7a', label: 'Ranking change',  Icon: RefreshCw },
  source:   { color: '#2f4858', label: 'Source added',    Icon: BookMarked },
  note:     { color: T.danger, label: "Editor's note",   Icon: PenLine },
};

const CATEGORIES = [
  { key: 'all', label: 'All', color: COLORS.ink },
  { key: 'list', label: 'New lists', color: KIND.list.color },
  { key: 'request', label: 'Requests', color: KIND.request.color },
  { key: 'comment', label: 'Comments', color: KIND.comment.color },
  { key: 'review', label: 'Review requests', color: KIND.review.color },
  { key: 'research', label: 'Ranking changes', color: KIND.research.color },
  { key: 'source', label: 'Source updates', color: KIND.source.color },
  { key: 'note', label: "Editor's notes", color: KIND.note.color },
];

function chipStyle(color) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: `${color}1f`,
    color,
    padding: '3px 8px',
    borderRadius: 3,
    fontFamily: 'Manrope, monospace',
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 700,
  };
}

// `chips` renders multiple category chips side by side (combined events:
// list+sources, source-add+ranking-change, votes+ranking-change). Without
// it, a single chip is derived from the kind (or the `kicker` override).
function Event({ kind, kicker, date, children, color: colorOverride, chips }) {
  const { color: kindColor, label, Icon } = KIND[kind] || {};
  const color = colorOverride || kindColor;
  const chipList = chips || [{ color: kindColor, Icon, label: kicker || label }];
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 12,
        padding: '11px 15px 12px',
        background: `${color}12`,
        borderLeft: `3px solid ${color}`,
        borderRadius: '0 5px 5px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {chipList.map((c, j) => {
          const CIcon = c.Icon;
          return (
            <span key={j} style={chipStyle(c.color || color)}>
              {CIcon && <CIcon size={11} strokeWidth={2.5} />}
              {c.label}
            </span>
          );
        })}
        {date && (
          <span style={{ fontFamily: 'Manrope, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.faded }}>
            {date}
          </span>
        )}
      </div>
      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: COLORS.ink, marginTop: 6, lineHeight: 1.45 }}>{children}</div>
    </div>
  );
}

function ListLink({ id, children }) {
  return (
    <Link href={`/list/${encodeURIComponent(id)}`} style={{ color: COLORS.ember, textDecoration: 'none', fontWeight: 500 }}>
      {children}
    </Link>
  );
}

function renderEvent(e, i) {
  if (e.kind === 'list') {
    return (
      <Event
        key={i}
        kind="list"
        date={fmtDate(e.ts)}
        chips={[
          { color: KIND.list.color, Icon: Flag, label: 'New list' },
          ...(e.sources && e.sources.length > 0 ? [{ color: KIND.source.color, Icon: BookMarked, label: 'Sources' }] : []),
        ]}
      >
        <ListLink id={e.id}>{e.title}</ListLink>{e.category ? ` · ${e.category}` : ''}
        {e.sources && e.sources.length > 0 && (
          <div style={{ marginTop: 4, fontSize: 12, color: COLORS.faded }}>
            Published with {e.sources.length} {e.sources.length === 1 ? 'source' : 'sources'}: {e.sources.map(stripWeight).join(', ')}
          </div>
        )}
      </Event>
    );
  }
  if (e.kind === 'source') {
    const hasChanges = e.changes && e.changes.length > 0;
    return (
      <Event
        key={i}
        kind="source"
        color={hasChanges ? KIND.research.color : undefined}
        date={fmtDate(e.ts)}
        chips={[
          { color: KIND.source.color, Icon: BookMarked, label: e.mixed || e.updated ? 'Sources Revisited' : e.labels.length === 1 ? 'Source added' : 'Sources added' },
          ...(hasChanges ? [{ color: KIND.research.color, Icon: RefreshCw, label: 'Ranking change' }] : []),
        ]}
      >
        {(() => {
          const srcs = e.srcs || e.labels.map((l) => ({ label: l }));
          const reenc = srcs.filter((x) => x.refreshed);
          const removed = srcs.filter((x) => x.removed);
          const added = srcs.length - reenc.length - removed.length;
          const parts = [];
          if (added) parts.push(`${added} added`);
          if (reenc.length) parts.push(`${reenc.length} re-encoded`);
          if (removed.length) parts.push(`${removed.length} removed`);
          const verb = e.mixed
            ? `Revisited the sources (${parts.join(', ')}) on `
            : e.updated
              ? `Revisited ${srcs.length} ${srcs.length === 1 ? 'source' : 'sources'} on `
              : `Added ${srcs.length} ${srcs.length === 1 ? 'source' : 'sources'} on `;
          return (
            <>
              {verb}
              <ListLink id={e.listId}>{e.listTitle}</ListLink>
              {': '}
              {srcs.map((x, k) => (
                <React.Fragment key={k}>
                  {k > 0 ? ', ' : ''}
                  <span style={x.removed ? { textDecoration: 'line-through', color: COLORS.faded } : undefined}>{(x.refreshed || x.removed) ? x.label : stripWeight(x.label)}</span>
                </React.Fragment>
              ))}
              .
              {srcs.filter((x) => x.note).map((x, k) => (
                <div key={k} style={{ marginTop: 4, fontSize: 12, color: COLORS.faded, lineHeight: 1.45 }}>{x.note}</div>
              ))}
            </>
          );
        })()}
        {hasChanges && (
          <div style={{ marginTop: 5 }}>
            {collapseMoves(e.changes).map((c, k) => {
              const tail = moveTail(c);
              return (
                <div key={k} style={{ fontSize: 13 }}>&rarr; <strong style={{ fontWeight: 500 }}>{c.itemName}</strong> {tail}.</div>
              );
            })}
          </div>
        )}
      </Event>
    );
  }
  if (e.kind === 'request') {
    return (
      <Event key={i} kind="request" date={fmtDate(e.ts)}>
        A reader requested <strong style={{ fontWeight: 500 }}>{e.title || 'a new list'}</strong>{e.category ? ` (${e.category})` : ''}.{e.published ? <> Now live: <ListLink id={e.id}>see it</ListLink>.</> : ' Pending review.'}
      </Event>
    );
  }
  if (e.kind === 'vote') {
    // A voting session: the ballot's picks (1st/2nd/3rd top-down) plus the
    // ranking movements those votes produced (cron rows + live replay).
    const votes = e.votes || (e.itemName ? [{ itemName: e.itemName, delta: e.delta }] : []);
    const allChanges = collapseMoves([...(e.changes || []), ...(e.liveChanges || [])]);
    const hasChanges = allChanges.length > 0;
    return (
      <Event
        key={i}
        kind="vote"
        color={hasChanges ? KIND.research.color : undefined}
        date={fmtDate(e.ts)}
        chips={[
          { color: KIND.vote.color, Icon: BarChart3, label: 'Voting' },
          ...(hasChanges ? [{ color: KIND.research.color, Icon: RefreshCw, label: 'Ranking change' }] : []),
        ]}
      >
        {ballotOrdered(votes).map((v, k) => {
          const rw = rankWord(v.delta);
          return (
            <div key={k} style={{ fontSize: 13 }}>
              Someone voted <strong style={{ fontWeight: 500 }}>{v.itemName}</strong>{rw ? ` ${rw} pick` : ''} on <ListLink id={e.listId}>{e.listTitle}</ListLink>.
            </div>
          );
        })}
        {hasChanges && (
          <div style={{ marginTop: 5 }}>
            {allChanges.map((c, k) => (
              <div key={k} style={{ fontSize: 13 }}>&rarr; <strong style={{ fontWeight: 500 }}>{c.itemName}</strong> {moveTail(c)}.</div>
            ))}
          </div>
        )}
      </Event>
    );
  }
  if (e.kind === 'comment') {
    return (
      <Event key={i} kind="comment" kicker={`Comment · ${e.name || 'Guest'}`} date={fmtDate(e.ts)}>
        "{e.body}" on <ListLink id={e.listId}>{e.listTitle}</ListLink>
        {e.editorResponse && (
          <div style={{ marginTop: 5, paddingTop: 5, borderTop: `1px solid ${COLORS.paper}` }}>
            <strong style={{ fontWeight: 700, color: COLORS.ember }}>Editor:</strong> {e.editorResponse}
          </div>
        )}
      </Event>
    );
  }
  if (e.kind === 'review') {
    return (
      <Event key={i} kind="review" date={fmtDate(e.ts)}>
        User submitted review request on <ListLink id={e.listId}>{e.listTitle}</ListLink>: {e.message ? `"${e.message}"` : 'No comment given.'}
        {e.editorResponse && (
          <div style={{ marginTop: 5, paddingTop: 5, borderTop: `1px solid ${COLORS.paper}` }}>
            <strong style={{ fontWeight: 700, color: COLORS.ember }}>Editor:</strong> {e.editorResponse}
          </div>
        )}
      </Event>
    );
  }
  if (e.kind === 'note') {
    return (
      <Event key={i} kind="note" date={fmtDate(e.ts)}>
        <span style={{ whiteSpace: 'pre-wrap' }}>{e.note}</span> on <ListLink id={e.listId}>{e.listTitle}</ListLink>
      </Event>
    );
  }
  if (e.kind === 'research') {
    const tail = moveTail(e);
    return (
      <Event
        key={i}
        kind="research"
        date={fmtDate(e.ts)}
        chips={[
          // Null cause = legacy row with no recorded cause: show no cause chip
          // rather than implying votes that may not have happened.
          ...(e.cause === 'edit'
            ? [{ color: '#8a3324', Icon: PenLine, label: 'List edited' }]
            : e.cause === 'votes'
              ? [{ color: KIND.vote.color, Icon: BarChart3, label: 'Votes' }]
              : []),
          { color: KIND.research.color, Icon: RefreshCw, label: 'Ranking change' },
        ]}
      >
        <strong style={{ fontWeight: 500 }}>{e.itemName}</strong> {tail} on <ListLink id={e.listId}>{e.listTitle}</ListLink>.
      </Event>
    );
  }
  return null;
}

export default function FeedClient({ events = [] }) {
  const [filter, setFilter] = useState('all');
  const counts = {};
  events.forEach((e) => { counts[e.kind] = (counts[e.kind] || 0) + 1; });
  const shown = filter === 'all' ? events : events.filter((e) => e.kind === filter);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {CATEGORIES.map((c) => {
          const active = filter === c.key;
          const n = c.key === 'all' ? events.length : (counts[c.key] || 0);
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: active ? c.color : `${c.color}12`,
                color: active ? COLORS.cream : c.color,
                border: `1.5px solid ${c.color}`,
                padding: '7px 13px',
                fontFamily: 'Manrope, monospace',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: 3,
              }}
            >
              {c.key !== 'all' && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? COLORS.cream : c.color }} />
              )}
              {c.label} <span style={{ opacity: 0.6 }}>{n}</span>
            </button>
          );
        })}
      </div>

      <div>
        {shown.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: COLORS.faded, fontFamily: 'Manrope, sans-serif' }}>Nothing in this category yet.</p>
        ) : (
          shown.map((e, i) => renderEvent(e, i))
        )}
      </div>
    </div>
  );
}
