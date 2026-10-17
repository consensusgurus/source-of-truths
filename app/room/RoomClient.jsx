'use client';

// READ THE ROOM: the crowd games as one run (owner, 2026-10-13; Herd opens it from 2026-10-17).
//
// Herd, Outwit, Outrank and Feud back to back on one page, each a "room" full of
// tonight's players, then a verdict on how well you read them
// (lib/read-room.js): out of 100, a third per room, paid on the share of the
// room you out-read.
//
// EACH ROOM IS THE REAL GAME, mounted inside app/RunEmbed.jsx exactly as the
// Judged cases are: the start gate, the save, the crowd POST and the
// /api/quiz/result row are what that game does on its own page, so the run
// leaves exactly what three separate plays would. A room already played
// today on its own page is not replayed: its first result stands.
//
// THE GAME STAYS ON SCREEN after it is answered, so the crowd's reveal (the
// bars, the order, the board of answers) is right there; a handover card
// above it reports the room and waits for the player to press on (owner,
// 2026-10-16: never move on by itself).
//
// IT MOVES. A crowd game re-scores everybody as the room fills, so the read
// at the finish is a reading: the verdict refreshes while the page is open,
// says how far the read has moved since you finished, and the next morning
// the pregame shows where yesterday's room settled.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import RunEmbed from '../RunEmbed';
import NextDrop from '../NextDrop';
import { RunChallengeButton, RunChallengeLine, RunChallengeCapture, runToken } from '../RunChallenge';
import MoreRunsPop, { MoreRunsList } from '../circuits/MoreRuns';
import useCircuitBoard from '../circuits/useCircuitBoard';
import { dailyMeIdentity } from '../dailyMeClient';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { ROOM_RUN_ID, ROOM_MAX, ROOM_LADDER, roomBeat, roomPoints, roomTierOf, roomPartFor } from '@/lib/read-room';

const COUNT_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
const PART_WORD = ['', 'all', 'a half', 'a third', 'a quarter', 'a fifth', 'a sixth'];

const CLIENTS = {
  herd: dynamic(() => import('../herd/HerdClient'), { ssr: false, loading: () => null }),
  outwit: dynamic(() => import('../outwit/OutwitClient'), { ssr: false, loading: () => null }),
  outrank: dynamic(() => import('../outrank/OutrankClient'), { ssr: false, loading: () => null }),
  feud: dynamic(() => import('../feud/FeudClient'), { ssr: false, loading: () => null }),
};

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const REFRESH_MS = 30000;

function etToday(now = new Date()) {
  try { return now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return now.toISOString().slice(0, 10); }
}
function etYesterday() {
  const t = new Date(`${etToday()}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}
function suffixOf(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return `${m}-${d}-${String(y).slice(2)}`;
}
function etSecondsPast(now) {
  try {
    const o = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(now).forEach((p) => { o[p.type] = p.value; });
    return ((Number(o.hour) % 24) * 3600) + Number(o.minute) * 60 + Number(o.second);
  } catch (e) { return null; }
}
const freshRun = () => ({ v: 1, phase: 'idle', si: 0, t0: null, results: {} });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const storeOf = (iso) => `sot_run_room_${iso}`;
const pctOf = (read) => { const b = read ? roomBeat(read.rank, read.field) : null; return b == null ? null : Math.round(100 * b); };
const NOOP = () => {};
const fmtN = (n) => Number(n || 0).toLocaleString();

// The answers a room's own save holds, in the shape its crowd API takes.
function answersOf(key, save, puzzle) {
  if (!save || save.status !== 'done') return null;
  if (key === 'outwit' || key === 'herd') {
    const n = (puzzle && puzzle.prompts && puzzle.prompts.length) || Object.keys(save.ans || {}).length;
    const a = Array.from({ length: n }, (_, i) => (save.ans ? save.ans[i] : undefined));
    return a.some((v) => v == null) ? null : a;
  }
  if (key === 'outrank') return save.fav == null || !Array.isArray(save.order) ? null : [save.fav, ...save.order];
  if (key === 'feud') {
    if (!Array.isArray(save.entries)) return null;
    const a = save.entries.map((row) => (row || []).map((t) => String(t || '').trim()).filter(Boolean));
    return a.some((row) => row.length === 0) ? null : a;
  }
  return null;
}
function readSave(key, num) {
  try { return JSON.parse(localStorage.getItem(`sot_${key}_${num}`) || 'null'); } catch (e) { return null; }
}
// Ask the room again: the crowd API re-scores this player against the field as
// it stands now and never inserts a second pick.
async function fetchRead(key, quizId, answers) {
  const { anonId, email } = dailyMeIdentity();
  const r = await fetch(`/api/${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    body: JSON.stringify({ quizId, answers, anonId: anonId || undefined, email: email || undefined }),
  });
  const d = await r.json();
  if (!d || d.error) return null;
  const read = d.board && d.board.read ? d.board.read : null;
  return { score: d.points, total: d.total, read, field: d.realCount != null ? d.realCount : (d.board && d.board.field) || null };
}

// The first (counted) play of a room today, off the game's own save.
function bankedOf(sec) {
  const save = readSave(sec.key, sec.num);
  if (!save || save.status !== 'done') return null;
  const res = save.result || null;
  const secs = save.t0 && save.tEnd ? Math.round((save.tEnd - save.t0) / 1000) : 0;
  return {
    score: res ? res.points : null, total: res ? res.total : null, secs, banked: true,
    read: res && res.board && res.board.read ? res.board.read : null,
    field: res ? (res.realCount != null ? res.realCount : res.board && res.board.field) : null,
  };
}

export default function RoomClient({ dateLabel, dateShort, sections = [] }) {
  const N = sections.length;
  const TODAY = etToday();
  const STORE = storeOf(TODAY);
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [live, setLive] = useState({});
  const [leaving, setLeaving] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [crowd, setCrowd] = useState(null);
  const [left, setLeft] = useState(null);
  const doneAtLoad = useRef(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => { rRef.current = r; }, [r]);
  const commit = useCallback((next) => {
    rRef.current = next; setR(next);
    try { localStorage.setItem(STORE, JSON.stringify(next)); } catch (e) {}
  }, [STORE]);

  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
    const b = {};
    for (const sec of sections) { const x = bankedOf(sec); if (x) b[sec.key] = x; }
    setBanked(b);
    if (saved && saved.v === 1) {
      const next = { ...freshRun(), ...saved };
      rRef.current = next; setR(next);
      doneAtLoad.current = next.phase === 'done';
    } else {
      doneAtLoad.current = false;
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // How many are in tonight's room: the busiest of the boards so far.
  useEffect(() => {
    if (!hydrated) return undefined;
    let alive = true;
    Promise.all(sections.map((s) => fetch(`/api/quiz/board?quizId=${encodeURIComponent(s.quizId)}`).then((x) => x.json()).catch(() => null)))
      .then((list) => {
        if (!alive) return;
        const n = Math.max(0, ...list.map((d) => (d && Number(d.plays)) || 0));
        setCrowd(n);
      });
    const tick = () => { const p = etSecondsPast(new Date()); setLeft(p == null ? null : Math.max(0, 86400 - p)); };
    tick();
    const iv = setInterval(tick, 30000);
    return () => { alive = false; clearInterval(iv); };
  }, [hydrated, sections]);

  const done = r.phase === 'done';
  const playing = r.phase === 'playing';
  const board = useCircuitBoard(ROOM_RUN_ID, hydrated && done);

  // What counts for each room: the first finish of the day, wherever it
  // happened, with its read as fresh as the last refresh.
  const counted = useMemo(() => sections.map((sec) => {
    const base = banked[sec.key] || r.results[sec.key] || null;
    if (!base) return null;
    const l = live[sec.key];
    return l ? { ...base, ...l, read: l.read || base.read } : base;
  }), [sections, banked, r.results, live]);
  const PART = ROOM_MAX / Math.max(1, N);
  const parts = counted.map((c) => (c && c.read ? roomPoints(c.read.rank, c.read.field, PART) : 0));
  const total = Math.round(parts.reduce((a, b) => a + b, 0));
  const allBanked = N > 0 && sections.every((s) => banked[s.key]);
  const fieldNow = Math.max(crowd || 0, ...counted.map((c) => (c && Number(c.field)) || 0), ...counted.map((c) => (c && c.read ? c.read.field : 0)));

  // LET IT MOVE: re-ask every finished room while the run is over and the
  // page is visible, so the verdict follows the room as it fills.
  const refresh = useCallback(async () => {
    const out = {};
    await Promise.all(sections.map(async (sec) => {
      const save = readSave(sec.key, sec.num);
      const a = answersOf(sec.key, save, sec.puzzle);
      if (!a) return;
      try { const x = await fetchRead(sec.key, sec.quizId, a); if (x) out[sec.key] = x; } catch (e) {}
    }));
    if (Object.keys(out).length) setLive((cur) => ({ ...cur, ...out }));
  }, [sections]);
  // A room read earlier today is asked once on arrival too, so its handover and
  // its pregame card carry a current read.
  const anyBanked = Object.keys(banked).length > 0;
  useEffect(() => {
    if (!hydrated || (!done && !anyBanked)) return undefined;
    let alive = true;
    const run = () => { if (alive && document.visibilityState !== 'hidden') refresh(); };
    run();
    if (!done) return () => { alive = false; };
    const iv = setInterval(run, REFRESH_MS);
    const onVis = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [hydrated, done, anyBanked, refresh]);

  // The read at the moment the run ended is kept, so the verdict can say how
  // far the room has moved it since, and tomorrow's card can say where it settled.
  useEffect(() => {
    if (!hydrated || !done || r.finishRead != null) return;
    if (counted.some((c) => c && !c.read)) return;
    commit({ ...rRef.current, finishRead: total, rooms: sections.reduce((m, s) => { m[s.key] = { num: s.num, quizId: s.quizId }; return m; }, {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, done, total]);

  function start() {
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      const cur = rRef.current;
      if (allBanked) { commit({ ...cur, phase: 'done', t0: cur.t0 || Date.now(), tEnd: Date.now() }); return; }
      commit({ ...cur, phase: 'playing', si: 0, t0: cur.t0 || Date.now() });
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }, 700);
  }

  const onSectionDone = useCallback((res) => {
    const cur = rRef.current;
    const sec = sections[cur.si];
    if (!sec || !res || res.key !== sec.key || cur.results[sec.key]) return;
    const secs = res.t0 ? Math.max(1, Math.round(((res.tEnd || Date.now()) - res.t0) / 1000)) : 0;
    commit({ ...cur, results: { ...cur.results, [sec.key]: { score: res.score, total: res.total, secs, read: res.read || null, field: res.field || null } } });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }, [sections, commit]);

  const sec = playing ? sections[r.si] : null;
  const secDone = sec ? counted[r.si] : null;
  const last = playing && r.si >= N - 1;

  function advance() {
    const cur = rRef.current;
    if (cur.si >= N - 1) commit({ ...cur, phase: 'done', tEnd: Date.now() });
    else commit({ ...cur, si: cur.si + 1 });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }

  const tier = roomTierOf(total);
  const rung = ROOM_LADDER[tier];

  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] && counted[i].read ? `${pctOf(counted[i].read)}%` : '-'}`).join(' · ');
    const code = (sections.length === 3 || sections.length === 4) && counted.every((c) => c && c.read) ? counted.map((c) => pctOf(c.read)).join('-') : '';
    const link = `mindloftdaily.com/room${code ? `?s=${code}&t=${total}&d=${TODAY}` : ''}`;
    return `Read the Room · ${dateShort} · ${total}/${ROOM_MAX}\n${rung[1]}: I out-read ${total}% of the room.\n${per}\n${withRef(link)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Read the Room: ${COUNT_WORD[N] || N} crowd games, no answer key. How well do you read the people in the room?\n${withRef('mindloftdaily.com/room')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const VARS = { '--rr-ground': '#0b0f1a', '--rr-panel': '#121828', '--rr-line': 'rgba(255,255,255,.1)', '--rr-ink': '#e9edf4', '--rr-mute': '#9aa8c4', '--rr-acc': '#4338ca', '--rr-acc-lt': '#a5b4fc', '--rr-gold': '#e8b43a', '--rr-deep': '#1a1f45' };
  sections.forEach((s) => { VARS[`--rr-${s.key}`] = s.color; });
  const Game = sec ? CLIENTS[sec.key] : null;
  const runSoFar = Math.round(parts.slice(0, r.si + (secDone ? 1 : 0)).reduce((a, b) => a + b, 0));

  return (
    <div className="stage-page rr" data-stage-theme="dark" style={{ ...VARS, minHeight: '100vh', background: 'var(--rr-ground)', color: 'var(--rr-ink)', fontFamily: SANS, overflowX: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={`rr-cap${done ? ' vf' : playing ? ' pl' : ''}`}>
        <Link href="/" className="rr-home">Mind Loft</Link>
        <b>Read the Room</b>
        <span className="rr-capd">{dateShort}</span>
        <a className="rr-back" href="/"><span aria-hidden="true">&larr;</span> <span className="rr-back-l">Return to all daily puzzles</span><span className="rr-back-s">All puzzles</span></a>
        {playing && <span className="rr-capt">{sections.map((s, i) => <i key={s.key} className={i < r.si || (i === r.si && secDone) ? 'd' : i === r.si ? 'on' : ''} title={s.name} />)}</span>}
        {!playing && <a className="rr-lb" href="/room/leaderboard">Leaderboard</a>}
      </div>

      {hydrated && !playing && <Morning />}

      {hydrated && r.phase === 'idle' && (
        <section className={`rr-pre${leaving ? ' leave' : ''}`}>
          <h1 className="rr-title">Read the Room</h1>
          <p className="rr-lede">There is no answer key. The answer key is whatever tonight&rsquo;s crowd does, and it keeps moving until midnight. Play {COUNT_WORD[N] || N} crowd games back to back, <b>{sections.map((s) => s.phrase).join(', ').replace(/, ([^,]*)$/, ' and $1')}</b>, and find out how well you read the people in the room.</p>
          <div className="rr-tonight">
            <div className="rr-tn-hd"><span>Tonight&rsquo;s room</span><em>Filling now</em></div>
            <Figures n={96} lit={0} arriving={Math.min(96, Math.max(6, Math.round(Math.sqrt(crowd || 0) * 2.2)))} />
            <div className="rr-tn-ft">
              <b>{crowd == null ? ' ' : `${fmtN(crowd)} in the room so far`}</b>
              <span>{left == null ? ' ' : `${Math.floor(left / 3600)}h ${String(Math.floor((left % 3600) / 60)).padStart(2, '0')}m until the doors close`}</span>
            </div>
          </div>
          <button type="button" className="rr-walk" onClick={start}>
            {allBanked ? 'Read your verdict' : 'Walk in'} <span aria-hidden="true">&rarr;</span>
          </button>
          <div className="rr-rooms" style={{ '--rr-n': sections.length }}>
            {sections.map((s, i) => (
              <div key={s.key} className="rr-roomcard" style={{ '--c': `var(--rr-${s.key})`, animationDelay: `${0.1 + i * 0.1}s` }}>
                <div className="rr-rc-k">Room {i + 1}</div>
                <div className="rr-rc-n">{s.name}</div>
                <div className="rr-rc-l">{s.line}</div>
                <div className="rr-rc-u">{banked[s.key] ? <b>Read earlier today: {banked[s.key].score != null ? `${banked[s.key].score}/${banked[s.key].total}` : 'on file'}, it stands</b> : s.unit}</div>
              </div>
            ))}
          </div>
          <div className="rr-pre-row">
            <span>About 5 minutes · the read settles at midnight Eastern</span>
            <button type="button" className="rr-how" aria-expanded={howOpen} onClick={() => setHowOpen((v) => !v)}>{howOpen ? 'Hide how it scores' : 'How it scores'}</button>
          </div>
          {howOpen && (
            <div className="rr-howbox">
              <p>Each room is worth {PART_WORD[N] || `1/${N}`} of 100, paid on the share of the other players in it you <b>out-read</b>: first in a room takes all of it, last takes none. The standings are each game&rsquo;s own live board, so your read moves as the room fills.</p>
              <Ladder at={null} />
            </div>
          )}
          <div className="rr-sub">Each room is also its own daily: {sections.map((s, i) => <React.Fragment key={s.key}>{i ? ' · ' : ''}<a href={s.path}>{s.name}</a></React.Fragment>)}</div>
        </section>
      )}

      {hydrated && playing && sec && (
        <section className="rr-play" style={{ '--c': `var(--rr-${sec.key})` }}>
          <div className="rr-sechd">
            <span className="rr-sectag">Room {r.si + 1} of {N}</span>
            <b>{sec.name}</b>
            <span className="rr-run">Your read so far {runSoFar}</span>
          </div>
          {secDone && (
            <Handover key={sec.key} sec={sec} si={r.si} n={N} res={secDone} part={parts[r.si]} next={last ? null : sections[r.si + 1]}
              banked={!!(banked[sec.key] && !r.results[sec.key])} onGo={advance} />
          )}
          {Game && !banked[sec.key] && (
            <div className="rr-host">
              <RunEmbed onResult={onSectionDone}>
                <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />
              </RunEmbed>
            </div>
          )}
        </section>
      )}

      <RunChallengeCapture gameKey={ROOM_RUN_ID} />
      {hydrated && done && (
        <Verdict key="verdict" sections={sections} counted={counted} parts={parts} total={total} dateLabel={dateLabel}
          animate={doneAtLoad.current === false} board={board} onShare={copyShare} copied={copied}
          fieldNow={fieldNow} finishRead={r.finishRead} onSettled={() => setSettled(true)} />
      )}
      <MoreRunsPop self="room" ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
    </div>
  );
}

// ─── a room of little figures ───────────────────────────────────────────────
// `lit` figures face you (you out-read them), `me` is you, in gold. Before the
// verdict, `arriving` of them glow faintly as the room fills.
function Figures({ n, lit = 0, me = -1, arriving = 0, step = 0 }) {
  const order = useMemo(() => {
    const o = [];
    for (let k = 0; k < n; k++) if (k !== me) o.push({ k, h: (k * 53 + 17) % 113 });
    o.sort((a, b) => a.h - b.h);
    const rank = {};
    o.forEach((x, j) => { rank[x.k] = j; });
    return rank;
  }, [n, me]);
  return (
    <div className="rr-figs" role="img" aria-label={me >= 0 ? `A room of ${n}, ${lit} of them out-read` : `A room of ${n} filling up`}>
      {Array.from({ length: n }, (_, k) => {
        const isMe = k === me;
        const on = !isMe && order[k] < lit;
        const arr = !isMe && me < 0 && ((k * 37 + 11) % 97) < arriving;
        return <span key={k} className={`rr-pp${isMe ? ' me' : on ? ' on' : arr ? ' in' : ''}`} style={on && step ? { animationDelay: `${(order[k] * step).toFixed(0)}ms` } : arr ? { animationDelay: `${((k % 12) * 0.2).toFixed(1)}s` } : undefined}><i /><b /></span>;
      })}
    </div>
  );
}

// ─── between rooms ──────────────────────────────────────────────────────────
function Handover({ sec, si, n, res, part, next, banked, onGo }) {
  const pct = pctOf(res.read);
  return (
    <div className="rr-hand">
      <div className="rr-hand-l">
        <div className="rr-eb">{banked ? `${sec.name} · read earlier today, the first result stands` : `Room ${si + 1} of ${n} read`}</div>
        <div className="rr-hand-h">{res.score != null ? <>{res.score}<small>/{res.total}</small> on {sec.name}</> : <>{sec.name}, on file</>}</div>
        <p className="rr-hand-p">{pct == null ? 'Asking the room where you stand.' : pct >= 50
          ? <>That reads the room better than <b>{pct}%</b> of it so far.</>
          : <>That reads the room better than <b>{pct}%</b> of it so far. The night is young.</>}
          {' '}<span>Worth {Math.round(part)} of this room&rsquo;s {Math.round(ROOM_MAX / Math.max(1, n))}.</span></p>
        <p className="rr-hand-n">The answers the room gave are below. Take your time: the next room waits for you.</p>
      </div>
      <div className="rr-hand-r">
        <button type="button" className="rr-nextgo" onClick={onGo}>
          <span className="rr-ng-t">
            <span>{next ? 'Next room' : 'That was the last room'}</span>
            <b>{next ? next.name : 'Read your verdict'}</b>
            <small>{next ? next.line : `How well you read all ${COUNT_WORD[n] || n}.`}</small>
          </span>
          <span className="rr-ng-a" aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
  );
}

// ─── the ladder: where you stand at the party ───────────────────────────────
function Ladder({ at }) {
  return (
    <ol className="rr-lad">
      {ROOM_LADDER.map((l, i) => (
        <li key={l[1]} className={at === i ? (i === 0 ? 'me top' : 'me') : ''}>
          <span className="rr-ln"><b>{l[1]}</b><small>{l[2]}</small></span>
          <span className="rr-lc">{l[0]}+</span>
        </li>
      ))}
    </ol>
  );
}

// ─── THE VERDICT ────────────────────────────────────────────────────────────
// The room lights up figure by figure as your read counts up (every figure you
// out-read turns toward you, you are the gold one), then the verdict rises.
function Verdict({ sections, counted, parts, total, dateLabel, animate, board, onShare, copied, fieldNow, finishRead, onSettled }) {
  const reduce = useMemo(() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }, []);
  const play = animate && !reduce;
  const FIG = 120, ME = 52;
  const [shown, setShown] = useState(play ? 0 : total);
  const [phase, setPhase] = useState(play ? 'room' : 'settled');
  useEffect(() => {
    if (!play) return undefined;
    let alive = true;
    (async () => {
      await sleep(500);
      const steps = Math.max(1, total);
      for (let k = 1; k <= steps; k++) {
        if (!alive) return;
        setShown(Math.round(total * k / steps));
        await sleep(Math.max(14, Math.round(1800 / steps)));
      }
      await sleep(500);
      if (alive) setPhase('settled');
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const settled = phase === 'settled';
  useEffect(() => { if (settled && onSettled) onSettled(); }, [settled]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = settled ? total : shown;
  const ti = roomTierOf(cur);
  const L = ROOM_LADDER[ti];
  const lit = Math.round((FIG - 1) * cur / 100);
  const me = board && board.data && board.data.me;
  const players = board && board.data ? (board.data.uniquePlayers || (Array.isArray(board.data.overall) ? board.data.overall.length : null)) : null;
  const moved = finishRead != null && settled ? total - finishRead : 0;
  const top = ti === 0;
  const [openKey, setOpenKey] = useState(null);
  const openSec = openKey ? sections.find((x) => x.key === openKey) : null;
  const OpenGame = openSec ? CLIENTS[openSec.key] : null;

  return (
    <section className="rr-vf">
      {/* THE VERDICT LEADS (owner, 2026-10-17): the title and score on one line
          at the very top, then where the read places you today; the seating
          chart below is compact and reads as one percentage. */}
      <div className={`rr-vf-card${settled ? ' on' : ''}${top ? ' top' : ''}`}>
        <div className="rr-vf-cardhd">
          <span className="rr-eb">Your read of the room</span>
          <em><i aria-hidden="true" />Still filling · settles at midnight ET</em>
        </div>
        <h1 className="rr-vf-nm">{L[1]} <span className="rr-vf-sc"><b>{cur}</b><small>/{ROOM_MAX}</small></span></h1>
        <p className="rr-vf-beat">{me && me.rank && players && players > 1
          ? <>You read the room better than <b>{fmtN(Math.max(0, players - me.rank))}</b> of <b>{fmtN(players)}</b> players today.</>
          : <>You read the room better than <b>{cur}%</b> of the players in it.</>}</p>
        {settled && <p className="rr-vf-ln">{L[3]}</p>}
        {settled && moved !== 0 && <div className={`rr-moved${moved > 0 ? ' up' : ' dn'}`}>{moved > 0 ? 'Up' : 'Down'} {Math.abs(moved)} since you finished, as the room filled ({finishRead} then, {total} now)</div>}
      </div>
      <div className="rr-vf-room">
        <div className="rr-tn-hd"><span>Tonight&rsquo;s room{fieldNow ? ` · ${fmtN(fieldNow)} players` : ''}</span><em>You out-read {cur}%</em></div>
        <Figures n={FIG} lit={lit} me={ME} />
        <p className="rr-vf-cap">Each figure you out-read turns toward you. You are the gold one.</p>
      </div>

      {settled && (
        <div className="rr-vf-copy">
          <div className="rr-vf-games" style={{ '--rr-n': sections.length, '--rr-nm': sections.length > 3 ? 2 : sections.length }}>
            {sections.map((s, i) => {
              const c = counted[i];
              const p = c && c.read ? pctOf(c.read) : null;
              const on = openKey === s.key;
              return (
                <button type="button" key={s.key} className={`rr-gt${on ? ' on' : ''}`} style={{ '--c': `var(--rr-${s.key})` }}
                  aria-expanded={on} onClick={() => setOpenKey(on ? null : s.key)}>
                  <i>{s.name}</i>
                  <b>{p == null ? '-' : `${p}%`}</b>
                  <small>{c && c.score != null ? `${c.score}/${c.total}` : 'on file'}{c && c.read ? ` · #${c.read.rank} of ${fmtN(c.read.field)}` : ''}</small>
                  <span className="rr-bar"><u style={{ width: `${p || 0}%` }} /></span>
                  <em>{on ? 'Hide results' : 'See results'}</em>
                </button>
              );
            })}
          </div>
          {openSec && OpenGame && (
            <div className="rr-ans" style={{ '--c': `var(--rr-${openSec.key})` }}>
              <div className="rr-ans-hd"><span>{openSec.name} · what the room said</span><button type="button" onClick={() => setOpenKey(null)}>Close</button></div>
              <div className="rr-host">
                <RunEmbed onResult={NOOP}>
                  <OpenGame key={`ans-${openSec.key}-${openSec.num}`} puzzles={[openSec.puzzle]} forceNum={null} />
                </RunEmbed>
              </div>
            </div>
          )}
          <div className="rr-vf-stats">
            <div><b>{total}/{ROOM_MAX}</b><span>Your read</span></div>
            {me && me.rank
              ? <a className="rr-vf-lb" href="/room/leaderboard" aria-label="See tonight's board"><b>#{me.rank}</b><span>{players ? `of ${fmtN(players)} on tonight's board` : "on tonight's board"}</span><em aria-hidden="true">&rarr;</em></a>
              : <a className="rr-vf-lb" href="/room/leaderboard" aria-label="See tonight's board"><b>{L[1].split(' ')[0]}</b><span>Tonight&rsquo;s board</span><em aria-hidden="true">&rarr;</em></a>}
          </div>
          <div className="rr-vf-draw">
            <RunChallengeLine gameKey={ROOM_RUN_ID} score={total} total={ROOM_MAX} n={runToken()} />
            <RunChallengeButton gameKey={ROOM_RUN_ID} score={total} total={ROOM_MAX} n={runToken()} door />
          </div>
          <p className="rr-vf-note">The room keeps filling until midnight, so your read can still move. Come back tomorrow for your settled spot.</p>
          <NextDrop label="Tomorrow's room" sub="New crowds at midnight Eastern." href="/room"
            accent="var(--rr-acc-lt)" ink="var(--rr-ink)" mute="var(--rr-mute)" style={{ margin: '14px 0 0' }} />
          <MoreRunsList self="room" ink="var(--rr-ink)" mute="var(--rr-mute)" line="var(--rr-line)" />
          <div className="rr-vf-lad"><div className="rr-eb">Where you stand at the party</div><Ladder at={ti} /></div>
        </div>
      )}
    </section>
  );
}

// ─── THE MORNING AFTER ──────────────────────────────────────────────────────
// Yesterday's room is closed now, so the read it gives back is final. Shown
// once on the pregame (and on today's verdict) until dismissed.
function Morning() {
  const [m, setM] = useState(null);
  useEffect(() => {
    const day = etYesterday();
    const key = storeOf(day);
    let run = null;
    try { run = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    if (!run || run.phase !== 'done' || !run.rooms || run.finishRead == null || run.morningSeen) return undefined;
    let alive = true;
    (async () => {
      const keys = Object.keys(run.rooms);
      const per = {};
      await Promise.all(keys.map(async (k) => {
        const info = run.rooms[k];
        const save = readSave(k, info.num);
        const a = answersOf(k, save, null);
        if (!a) return;
        try { const x = await fetchRead(k, info.quizId, a); if (x && x.read) per[k] = x; } catch (e) {}
      }));
      if (!alive || !Object.keys(per).length) return;
      const part = roomPartFor(day);
      const settledRead = Math.round(keys.reduce((s, k) => s + (per[k] ? roomPoints(per[k].read.rank, per[k].read.field, part) : 0), 0));
      let rank = null, players = null;
      try {
        const { anonId, email } = dailyMeIdentity();
        const qs = new URLSearchParams({ circuit: ROOM_RUN_ID, date: suffixOf(day) });
        if (anonId) qs.set('anonId', anonId);
        if (email) qs.set('email', email);
        const d = await fetch(`/api/quiz/daily-combined?${qs.toString()}`).then((x) => x.json());
        if (d && d.me && d.me.rank) { rank = d.me.rank; players = d.uniquePlayers || null; }
      } catch (e) {}
      if (alive) setM({ key, day, from: run.finishRead, to: settledRead, per, keys, rank, players });
    })();
    return () => { alive = false; };
  }, []);
  if (!m) return null;
  const close = () => {
    try { const run = JSON.parse(localStorage.getItem(m.key) || 'null'); if (run) localStorage.setItem(m.key, JSON.stringify({ ...run, morningSeen: true })); } catch (e) {}
    setM(null);
  };
  const ti = roomTierOf(m.to), was = roomTierOf(m.from);
  const L = ROOM_LADDER[ti];
  const dir = ti < was ? `Up ${was - ti}` : ti > was ? `Down ${ti - was}` : 'Held';
  const NAMES = { herd: 'Herd', outwit: 'Outwit', outrank: 'Outrank', feud: 'Feud' };
  return (
    <section className="rr-morn">
      <button type="button" className="rr-morn-x" onClick={close} aria-label="Dismiss">&times;</button>
      <div className="rr-eb">Yesterday&rsquo;s room</div>
      <h2>The room settled.</h2>
      <p>The doors closed at midnight. {m.to === m.from ? <>Your read held at <b>{m.to}</b>.</> : <>Your read went from <b>{m.from} to {m.to}</b>.</>}</p>
      <div className={`rr-morn-tier${ti === 0 ? ' top' : ''}`}>
        <span><b>{L[1]}</b><small>Settled · {m.to} of 100</small></span>
        <em>{dir === 'Held' ? 'Held' : `${dir} ${Math.abs(was - ti) === 1 ? 'place' : 'places'}`}</em>
      </div>
      <div className="rr-morn-g" style={{ '--rr-n': m.keys.length, '--rr-nm': m.keys.length > 3 ? 2 : m.keys.length }}>
        {m.keys.map((k) => <div key={k}><i>{NAMES[k] || k}</i><b>{m.per[k] ? `${pctOf(m.per[k].read)}%` : '-'}</b></div>)}
      </div>
      {m.rank ? <div className="rr-morn-b"><b>#{m.rank}{m.players ? ` of ${fmtN(m.players)}` : ''} on the final board</b><span>Settled at midnight Eastern. This spot will not move again.</span></div> : null}
    </section>
  );
}

const CSS = `
.rr *{box-sizing:border-box}
.rr .rr-eb{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--rr-acc-lt)}
.rr-cap{position:relative;display:flex;align-items:center;gap:12px;max-width:none;margin:0;padding:12px 20px;font-size:13px}
.rr-back{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;background:var(--rr-acc);color:#fff;font-weight:800;font-size:13px;text-decoration:none;white-space:nowrap}
.rr-back:hover{background:#5145e0}
.rr-back:focus-visible{outline:2px solid var(--rr-ink);outline-offset:3px}
.rr-back-s{display:none}
@media(max-width:640px){.rr-back-l{display:none}.rr-back-s{display:inline}.rr-capd{display:none}}
.rr-home{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--rr-mute);text-decoration:none}
.rr-cap b{font-weight:800;letter-spacing:-.01em}
.rr-capd{color:var(--rr-mute);font-weight:700}
.rr-capt{display:flex;gap:4px;margin-left:auto}
.rr-capt i{width:20px;height:6px;border-radius:3px;background:var(--rr-line)}
.rr-capt i.d{background:var(--rr-acc-lt)}
.rr-capt i.on{background:var(--rr-acc);box-shadow:0 0 0 2px var(--rr-ground),0 0 0 3px var(--rr-acc-lt)}
.rr-lb{margin-left:auto;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--rr-acc-lt);text-decoration:none}
.rr a{color:var(--rr-acc-lt)}
/* figures */
.rr-figs{display:grid;grid-template-columns:repeat(auto-fill,minmax(14px,1fr));gap:9px 6px;justify-items:center}
.rr-pp{position:relative;width:14px;height:20px;color:#232b45;display:block}
.rr-pp i{position:absolute;left:4px;top:0;width:7px;height:7px;border-radius:50%;background:currentColor}
.rr-pp b{position:absolute;left:1px;top:9px;width:13px;height:10px;border-radius:7px 7px 2px 2px;background:currentColor}
.rr-pp.in{color:#4b5487;animation:rrarrive 2.4s ease-in-out infinite alternate}
@keyframes rrarrive{0%{color:#2c355a}100%{color:#5d68a6}}
.rr-pp.on{color:var(--rr-acc-lt);animation:rrturn .45s ease both}
@keyframes rrturn{0%{color:#222a44;transform:translateY(3px)}100%{color:var(--rr-acc-lt);transform:none}}
.rr-pp.me{color:var(--rr-gold);animation:rrme 1.6s ease-in-out infinite alternate}
@keyframes rrme{from{transform:none}to{transform:translateY(-3px)}}
/* pregame */
.rr-pre{max-width:860px;margin:0 auto;padding:18px 16px 60px;transition:opacity .5s,transform .5s}
.rr-pre.leave{opacity:0;transform:translateY(-14px)}
.rr-title{margin:10px 0 0;font-size:clamp(44px,8vw,72px);font-weight:800;letter-spacing:-.035em;line-height:.95;animation:rrrise .6s ease both}
.rr-lede{margin:14px 0 0;max-width:620px;font-size:16px;font-weight:600;line-height:1.55;color:var(--rr-mute)}
.rr-lede b{color:var(--rr-ink)}
.rr-tonight{margin-top:22px;padding:18px;border-radius:16px;background:var(--rr-panel);border:1px solid var(--rr-line)}
.rr-tn-hd{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:14px}
.rr-tn-hd span{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--rr-mute)}
.rr-tn-hd em{font-style:normal;font-size:12px;font-weight:800;color:var(--rr-acc-lt)}
.rr-tn-ft{display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px 14px;margin-top:14px;font-size:13px;font-weight:700;color:var(--rr-mute)}
.rr-tn-ft b{color:var(--rr-ink)}
.rr-walk{display:inline-flex;align-items:center;gap:10px;margin-top:18px;padding:16px 30px;border:0;border-radius:12px;background:var(--rr-acc);color:#fff;font:800 18px ${SANS};cursor:pointer;box-shadow:0 14px 34px rgba(0,0,0,.5);transition:background .15s,transform .15s}
.rr-walk:hover{background:#5145e0;transform:translateY(-1px)}
.rr-walk:focus-visible,.rr-how:focus-visible,.rr-go:focus-visible,.rr-hold:focus-visible{outline:2px solid var(--rr-ink);outline-offset:3px}
.rr-rooms{display:grid;grid-template-columns:repeat(var(--rr-n,3),minmax(0,1fr));gap:10px;margin-top:22px}
.rr-roomcard{padding:14px;border-radius:14px;background:var(--rr-panel);border:1px solid var(--rr-line);border-top:3px solid var(--c);animation:rrrise .5s ease both}
.rr-rc-k{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--rr-mute)}
.rr-rc-n{font-size:20px;font-weight:800;margin-top:3px}
.rr-rc-l{font-size:13px;font-weight:600;line-height:1.4;color:var(--rr-mute);margin-top:4px}
.rr-rc-u{font-size:12px;font-weight:700;color:var(--rr-acc-lt);margin-top:8px}
.rr-rc-u b{color:#6ee7b7;font-weight:800}
.rr-pre-row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px 14px;margin-top:16px;font-size:12.5px;font-weight:700;color:var(--rr-mute)}
.rr-how{background:none;border:0;padding:4px 0;color:var(--rr-acc-lt);font:800 13px ${SANS};text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.rr-howbox{margin-top:10px;padding:16px;border-radius:14px;background:var(--rr-panel);border:1px solid var(--rr-line);animation:rrrise .3s ease both}
.rr-howbox p{margin:0 0 12px;font-size:14px;line-height:1.55;font-weight:600;color:var(--rr-mute)}
.rr-howbox b{color:var(--rr-ink)}
.rr-sub{margin-top:14px;font-size:12.5px;font-weight:700;color:var(--rr-mute)}
.rr-sub a{color:var(--rr-ink)}
/* ladder */
.rr-lad{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.rr-lad li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 12px;border-radius:10px;color:var(--rr-mute)}
.rr-lad li.me{background:var(--rr-acc);color:#fff}
.rr-lad li.me.top{background:var(--rr-gold);color:#1d1604}
.rr-ln{display:flex;flex-direction:column;min-width:0}
.rr-ln b{font-size:14.5px;font-weight:800;color:var(--rr-ink)}
.rr-lad li.me .rr-ln b{color:inherit}
.rr-ln small{font-size:12px;font-weight:600}
.rr-lc{font-size:13px;font-weight:800;white-space:nowrap}
/* play */
.rr-play{max-width:1180px;margin:0 auto;padding:4px 0 50px}
.rr-sechd{display:flex;align-items:center;gap:10px;max-width:760px;margin:6px auto 0;padding:0 16px;animation:rrrise .4s ease both}
.rr-sectag{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0b0f1a;background:var(--c);padding:5px 10px;border-radius:5px}
.rr-sechd b{font-size:20px;font-weight:800}
.rr-run{margin-left:auto;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--rr-mute)}
.rr-host{animation:rrrise .45s ease both}
.rr-host .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
.rr-hand{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:18px;max-width:760px;margin:14px auto 4px;padding:18px;border-radius:16px;background:var(--rr-panel);border:1px solid var(--rr-line);border-left:4px solid var(--c);animation:rrrise .4s ease both}
.rr-hand-h{font-size:30px;font-weight:800;letter-spacing:-.02em;margin-top:6px}
.rr-hand-h small{font-size:18px;color:var(--rr-mute)}
.rr-hand-p{margin:6px 0 0;font-size:15px;line-height:1.5;font-weight:600;color:var(--rr-ink)}
.rr-hand-p b{color:var(--rr-acc-lt)}
.rr-hand-p span{color:var(--rr-mute)}
.rr-hand-n{margin:8px 0 0;font-size:12.5px;font-weight:600;color:var(--rr-mute)}
.rr-hand-r{display:flex;flex-direction:column;gap:10px;justify-content:center}
.rr-nextgo{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:16px 18px;border:0;border-radius:14px;background:var(--rr-acc);color:#fff;font-family:${SANS};cursor:pointer;box-shadow:0 0 0 0 rgba(99,102,241,.55);animation:rrpulse 1.8s ease-out 3}
.rr-nextgo:hover{background:#5145e0}
.rr-nextgo:focus-visible{outline:2px solid var(--rr-ink);outline-offset:3px}
.rr-ng-t{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
.rr-ng-t span{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.88)}
.rr-ng-t b{font-size:20px;font-weight:800}
.rr-ng-t small{font-size:13px;font-weight:600;color:#fff;line-height:1.35}
.rr-ng-a{font-size:26px;font-weight:800;flex:none}
@keyframes rrpulse{0%{box-shadow:0 0 0 0 rgba(99,102,241,.55)}100%{box-shadow:0 0 0 14px rgba(99,102,241,0)}}
@media (prefers-reduced-motion:reduce){.rr-nextgo{animation:none}}
.rr-next{display:flex;flex-direction:column;gap:2px;padding:12px;border-radius:12px;background:var(--rr-deep)}
.rr-next span{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--rr-acc-lt)}
.rr-next b{font-size:18px;font-weight:800}
.rr-next small{font-size:12.5px;font-weight:600;color:var(--rr-mute);line-height:1.35}
.rr-gorow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.rr-go{display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border:0;border-radius:12px;background:var(--rr-acc);color:#fff;font:800 15px ${SANS};cursor:pointer}
.rr-go:hover{background:#5145e0}
.rr-ring{width:26px;height:26px;transform:rotate(-90deg)}
.rr-ring circle{fill:none;stroke:rgba(255,255,255,.22);stroke-width:4}
.rr-ring circle.on{stroke:#fff;transition:stroke-dashoffset .2s linear}
.rr-hold{background:none;border:0;color:var(--rr-mute);font:700 13px ${SANS};text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:4px 0}
/* verdict */
.rr-vf{max-width:980px;margin:0 auto;padding:14px 16px 70px}
.rr-vf-hd{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:6px 12px;margin-top:6px}
.rr-vf-hd span{font-size:clamp(26px,4.4vw,38px);font-weight:800;letter-spacing:-.02em}
.rr-vf-hd em{display:inline-flex;align-items:center;gap:7px;font-style:normal;font-size:12.5px;font-weight:800;color:var(--rr-acc-lt)}
.rr-vf-hd em i{width:7px;height:7px;border-radius:50%;background:var(--rr-acc-lt);animation:rrpulse 1.4s ease-in-out infinite}
@keyframes rrpulse{50%{opacity:.25}}
.rr-vf-room{margin-top:12px;padding:12px 14px;border-radius:14px;background:var(--rr-panel);border:1px solid var(--rr-line)}
.rr-vf-room .rr-figs{grid-template-columns:repeat(30,minmax(0,1fr));gap:4px 2px}
.rr-vf-room .rr-pp{transform:scale(.72);transform-origin:center top;height:15px}
.rr-vf-room .rr-tn-hd{margin-bottom:8px}
.rr-vf-cardhd{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px 12px}
.rr-vf-cardhd em{display:inline-flex;align-items:center;gap:7px;font-style:normal;font-size:12px;font-weight:800;color:var(--rr-acc-lt)}
.rr-vf-cardhd em i{width:7px;height:7px;border-radius:50%;background:var(--rr-acc-lt);animation:rrpulse 1.4s ease-in-out infinite}
.rr-vf-beat{margin:8px 0 0;font-size:17px;font-weight:700;color:var(--rr-ink)}
.rr-vf-beat b{color:var(--rr-acc-lt);font-variant-numeric:tabular-nums}
.rr-vf-cap{margin:12px 0 0;font-size:12.5px;font-weight:600;color:var(--rr-mute)}
.rr-vf-card{display:flex;flex-direction:column;justify-content:center;margin-top:12px;padding:20px 22px;border-radius:16px;background:var(--rr-deep);border:1.5px solid #4f52c9;opacity:.85;transition:opacity .4s}
.rr-vf-card.on{opacity:1;animation:rrpop .7s cubic-bezier(.2,.8,.2,1) both}
.rr-vf-card.top{background:#2a2210;border-color:var(--rr-gold)}
.rr-vf-card.top .rr-eb{color:#f4d58d}
@keyframes rrpop{from{transform:translateY(14px) scale(.97)}to{transform:none}}
.rr-vf-nm{font-size:clamp(30px,4.6vw,44px);font-weight:800;letter-spacing:-.025em;line-height:1.05;margin:8px 0 0;text-wrap:balance}
.rr-vf-sc{white-space:nowrap;margin-left:6px}
.rr-vf-sc b{font-size:inherit;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.rr-vf-sc small{font-size:.5em;font-weight:800;color:var(--rr-mute)}
.rr-vf-ln{margin:8px 0 0;font-size:15px;line-height:1.5;font-weight:600;color:#c9d4ea}
.rr-moved{margin-top:12px;padding:8px 11px;border-radius:9px;font-size:12.5px;font-weight:800;background:rgba(255,255,255,.06)}
.rr-moved.up{color:#6ee7b7}.rr-moved.dn{color:#fca5a5}
.rr-vf-copy{margin-top:16px;animation:rrrise .5s ease both}
.rr-vf-games{display:grid;grid-template-columns:repeat(var(--rr-n,3),minmax(0,1fr));gap:10px}
.rr-vf-games .rr-gt{position:relative;display:flex;flex-direction:column;align-items:stretch;text-align:left;gap:3px;padding:14px;border-radius:12px;background:var(--rr-panel);border:1px solid var(--rr-line);min-width:0;color:var(--rr-ink);font:inherit;cursor:pointer}
.rr-vf-games .rr-gt:hover{border-color:var(--c)}
.rr-vf-games .rr-gt.on{border-color:var(--c);box-shadow:0 0 0 1px var(--c)}
.rr-vf-games .rr-gt:focus-visible{outline:2px solid var(--rr-ink);outline-offset:3px}
.rr-vf-games em{margin-top:8px;font-style:normal;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--rr-acc-lt)}
.rr-ans{margin-top:12px;border-radius:14px;background:var(--rr-panel);border:1px solid var(--rr-line);border-top:3px solid var(--c);padding:14px 0 6px;animation:rrrise .35s ease both}
.rr-ans-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 16px 8px}
.rr-ans-hd span{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--rr-acc-lt)}
.rr-ans-hd button{background:none;border:1px solid var(--rr-line);color:var(--rr-ink);font:800 12.5px ${SANS};padding:6px 12px;border-radius:9px;cursor:pointer}
.rr-vf-draw{margin:14px 0}
.rr-vf-games i{font-style:normal;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--rr-acc-lt)}
.rr-vf-games b{font-size:24px;font-weight:800}
.rr-vf-games small{font-size:12px;font-weight:700;color:var(--rr-mute)}
.rr-bar{display:block;height:5px;border-radius:3px;background:rgba(255,255,255,.08);margin-top:6px;overflow:hidden}
.rr-bar u{display:block;height:100%;background:var(--c);border-radius:3px;animation:rrgrow .9s cubic-bezier(.2,.8,.2,1) both;transform-origin:left center}
@keyframes rrgrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.rr-vf-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:10px;margin-top:10px}
.rr-vf-stats div{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:12px;background:var(--rr-deep)}
.rr-vf-stats b{font-size:22px;font-weight:800}
.rr-vf-lb{position:relative;display:flex;flex-direction:column;gap:2px;padding:12px 44px 12px 14px;border-radius:12px;background:var(--rr-deep);color:inherit;text-decoration:none;transition:background .15s}
.rr-vf-lb:hover{background:color-mix(in srgb,var(--rr-acc-lt) 18%,var(--rr-deep))}
.rr-vf-lb em{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-style:normal;font-size:20px;font-weight:800;color:var(--rr-acc-lt)}
.rr-vf-stats span{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--rr-mute)}
.rr-vf-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.rr-vf-btns a,.rr-vf-btns button{font:800 14px ${SANS};padding:12px 18px;border-radius:12px;text-decoration:none;color:var(--rr-ink);border:1px solid var(--rr-line);background:transparent;cursor:pointer}
.rr-vf-btns .pri{background:var(--rr-acc);color:#fff;border-color:transparent}
.rr-vf-note{margin:14px 0 0;font-size:13px;font-weight:600;line-height:1.5;color:var(--rr-mute)}
.rr-vf-lad{margin-top:24px;max-width:560px}
.rr-vf-lad .rr-eb{margin-bottom:8px}
/* morning */
.rr-morn{position:relative;box-sizing:border-box;width:calc(100% - 32px);max-width:948px;margin:8px auto 4px;padding:20px;border-radius:16px;background:var(--rr-panel);border:1px solid var(--rr-line);animation:rrrise .5s ease both}
.rr-morn h2{margin:6px 0 0;font-size:30px;font-weight:800;letter-spacing:-.02em}
.rr-morn p{margin:6px 0 0;font-size:15px;line-height:1.5;font-weight:600;color:var(--rr-mute)}
.rr-morn p b{color:var(--rr-ink)}
.rr-morn-x{position:absolute;top:10px;right:12px;background:none;border:0;color:var(--rr-mute);font-size:22px;line-height:1;cursor:pointer;padding:4px}
.rr-morn-tier{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding:12px 14px;border-radius:12px;background:var(--rr-acc);color:#fff;animation:rrlift 1s cubic-bezier(.2,.8,.2,1) .3s both}
.rr-morn-tier.top{background:var(--rr-gold);color:#1d1604}
@keyframes rrlift{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.rr-morn-tier span{display:flex;flex-direction:column}
.rr-morn-tier b{font-size:18px;font-weight:800}
.rr-morn-tier small{font-size:12.5px;font-weight:700;opacity:.85}
.rr-morn-tier em{font-style:normal;padding:5px 10px;border-radius:999px;background:rgba(6,10,20,.28);font-size:12.5px;font-weight:800}
.rr-morn-g{display:grid;grid-template-columns:repeat(var(--rr-n,3),minmax(0,1fr));gap:8px;margin-top:10px}
.rr-morn-g div{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04)}
.rr-morn-g i{font-style:normal;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--rr-acc-lt)}
.rr-morn-g b{font-size:18px;font-weight:800}
.rr-morn-b{display:flex;flex-direction:column;gap:2px;margin-top:10px;padding:12px 14px;border-radius:12px;background:var(--rr-deep);font-size:13px}
.rr-morn-b span{color:var(--rr-mute);font-weight:600}
.rr-morn-go{margin-top:12px;padding:12px 18px;border:0;border-radius:12px;background:var(--rr-acc);color:#fff;font:800 15px ${SANS};cursor:pointer}
@keyframes rrrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:760px){
.rr-rooms{grid-template-columns:minmax(0,1fr)}
.rr-hand{grid-template-columns:minmax(0,1fr)}
.rr-vf-room .rr-figs{grid-template-columns:repeat(20,minmax(0,1fr))}
.rr-vf-games small{font-size:11px}
.rr-vf-games,.rr-morn-g{grid-template-columns:repeat(var(--rr-nm,3),minmax(0,1fr))}
.rr-vf-btns a,.rr-vf-btns button{flex:1 1 40%;text-align:center;padding:12px 10px}
.rr-sechd b{font-size:16px}
.rr-run{display:none}
}
@media(prefers-reduced-motion:reduce){.rr *{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition:none !important}}
`;
