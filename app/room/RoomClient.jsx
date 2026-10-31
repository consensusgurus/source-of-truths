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
// ON THE STAGE (owner, 2026-10-25): the entry, the handover between rooms, the
// play page and the verdict are the Gauntlet stage screens (GauntletScreens.jsx):
// pastel ground, one dark ink. The game stays on screen for its own finish beat,
// then the handover card reports the room (and the room's answers, compactly)
// and waits for the player to press Next (owner, 2026-10-16: never move on by
// itself). The verdict climbs ROOM_LADDER; each room's full answers open from
// its tile on the end page.
//
// IT MOVES. A crowd game re-scores everybody as the room fills, so the read
// at the finish is a reading: the verdict refreshes while the page is open,
// says how far the read has moved since you finished, and the next morning
// the pregame shows where yesterday's room settled.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import RunEmbed from '../RunEmbed';
import { RunChallengeButton, RunChallengeLine, RunChallengeCapture, runToken, RunMeme } from '../RunChallenge';
import RunOtherDeviceBar from '../RunOtherDeviceBar';
import MoreRunsPop, { MoreRunsList, otherRuns } from '../circuits/MoreRuns';
import { runDoneToday, RUN_DOORS } from '../circuits/RunDoorPop';
import useCircuitBoard from '../circuits/useCircuitBoard';
import { stageAvg } from '../circuits/RunScorecard';
import { rampFor } from '@/lib/circuits';
import { softGround } from '@/lib/category-ramp';
import { dailyMeIdentity } from '../dailyMeClient';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { ROOM_RUN_ID, ROOM_MAX, ROOM_LADDER, roomBeat, roomPoints, roomTierOf, roomPartFor } from '@/lib/read-room';
import { GauntletGate, GauntletBetween, GauntletEndStage, GauntletCover, RunPlayFrame, useGauntletLook } from '../GauntletScreens';
import { isDarkLook } from '@/lib/stage-look';

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

// The band note on the entry: short enough to sit beside the room's line.
const BAND_NOTE = { herd: '10 calls', outwit: '5 prompts', outrank: '1 order', feud: '5 prompts' };
// THE PARTY'S LADDER, bottom to top, for the stage's climb (lib/read-room.js
// ROOM_LADDER is top to bottom: [min, name, short line, long line]).
const CLIMB = ROOM_LADDER.slice().reverse().map((l, i) => ({ min: l[0], name: l[1], line: l[2], colour: rampFor(i) }));
const climbRung = (total) => CLIMB[CLIMB.length - 1 - roomTierOf(total)];

// What the room said, compactly, off the game's own saved reveal: the herd's
// pick per call, the room's order, the top answer per prompt. Null when the
// save holds no reveal (a room read on another device).
function roomSaid(key, save) {
  const res = save && save.result;
  if (!res) return null;
  try {
    if (key === 'herd' && Array.isArray(res.prompts)) {
      return res.prompts.map((p) => (p.herd && p.herd.length === 1 ? p.options[p.herd[0]] : 'a tie')).join(' · ');
    }
    if (key === 'outwit' && Array.isArray(res.prompts)) {
      return res.prompts.map((p) => {
        if (p.target != null) return `target ${p.target}`;
        if (p.options && p.winner != null && p.options[p.winner] != null) return p.options[p.winner];
        return p.winner != null ? String(p.winner) : '-';
      }).join(' · ');
    }
    if (key === 'outrank' && Array.isArray(res.reveal)) {
      return res.reveal.map((x) => `${x.rank}. ${x.item}`).join(' · ');
    }
    if (key === 'feud' && Array.isArray(res.reveal)) {
      return res.reveal.map((x) => (x.board && x.board[0] ? x.board[0].label : '-')).join(' · ');
    }
  } catch (e) { return null; }
  return null;
}
const SAID_LEAD = { herd: 'The herd picked', outwit: 'The room landed on', outrank: 'The room’s order', feud: 'Top answers' };

export default function RoomClient({ dateLabel, dateShort, sections = [] }) {
  const N = sections.length;
  const TODAY = etToday();
  const STORE = storeOf(TODAY);
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [live, setLive] = useState({});
  const [copied, setCopied] = useState(false);
  const [crowd, setCrowd] = useState(null);
  const [left, setLeft] = useState(null);
  const doneAtLoad = useRef(null);
  const [settled, setSettled] = useState(false);
  // The handover waits for the room's own finish beat (RunEmbed), then comes up.
  const [handAt, setHandAt] = useState(0);
  const [handUp, setHandUp] = useState(false);
  // The player can step back from the handover to the room's full board of answers.
  const [peek, setPeek] = useState(false);
  // How to play, from the run: the game starts on its own (owner, 2026-10-27).
  const [helpSeq, setHelpSeq] = useState(0);
  const [openKey, setOpenKey] = useState(null);
  const [look] = useGauntletLook();
  const embedTheme = isDarkLook(look) ? 'dark' : 'light';
  const stageSecs = useMemo(() => sections.map((s, i) => ({ ...s, slot: i, questions: [] })), [sections]);

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

  // The read at the moment the run ended is kept, so tomorrow's card can say
  // where it settled.
  useEffect(() => {
    if (!hydrated || !done || r.finishRead != null) return;
    if (counted.some((c) => c && !c.read)) return;
    commit({ ...rRef.current, finishRead: total, rooms: sections.reduce((m, s) => { m[s.key] = { num: s.num, quizId: s.quizId }; return m; }, {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, done, total]);

  // The ending's climb lands in about five seconds; the more-runs pop waits for it.
  useEffect(() => {
    if (!hydrated || !done) return undefined;
    const t = setTimeout(() => setSettled(true), 5500);
    return () => clearTimeout(t);
  }, [hydrated, done]);

  function start() {
    const cur = rRef.current;
    if (allBanked) { commit({ ...cur, phase: 'done', t0: cur.t0 || Date.now(), tEnd: Date.now() }); return; }
    commit({ ...cur, phase: 'playing', si: 0, t0: cur.t0 || Date.now() });
    try { window.scrollTo({ top: 0 }); } catch (e) {}
  }

  const onSectionDone = useCallback((res) => {
    const cur = rRef.current;
    const sec = sections[cur.si];
    if (!sec || !res || res.key !== sec.key || cur.results[sec.key]) return;
    const secs = res.t0 ? Math.max(1, Math.round(((res.tEnd || Date.now()) - res.t0) / 1000)) : 0;
    setHandAt(Date.now() + Math.max(0, res.beatMs || 0) + 700);
    commit({ ...cur, results: { ...cur.results, [sec.key]: { score: res.score, total: res.total, secs, read: res.read || null, field: res.field || null } } });
  }, [sections, commit]);

  const sec = playing ? sections[r.si] : null;
  const secDone = sec ? counted[r.si] : null;
  const last = playing && r.si >= N - 1;

  // The handover comes up once the room is answered and its finish beat has played.
  useEffect(() => {
    if (!secDone) { setHandUp(false); return undefined; }
    const wait = Math.max(0, handAt - Date.now());
    if (!wait) { setHandUp(true); return undefined; }
    setHandUp(false);
    const t = setTimeout(() => setHandUp(true), wait);
    return () => clearTimeout(t);
  }, [secDone, handAt, r.si]);

  function advance() {
    const cur = rRef.current;
    setPeek(false);
    setHandAt(0);
    if (cur.si >= N - 1) commit({ ...cur, phase: 'done', tEnd: Date.now() });
    else commit({ ...cur, si: cur.si + 1 });
    try { window.scrollTo({ top: 0 }); } catch (e) {}
  }

  const rung = ROOM_LADDER[roomTierOf(total)];

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

  // One quick play next: the first run in the more-runs order not finished today.
  const [similarRun, setSimilarRun] = useState(null);
  useEffect(() => {
    if (!done) return;
    const id = otherRuns(ROOM_RUN_ID).find((x) => !runDoneToday(x));
    setSimilarRun(id && RUN_DOORS[id] ? { name: RUN_DOORS[id].name, href: RUN_DOORS[id].href } : null);
  }, [done]);

  const Game = sec ? CLIENTS[sec.key] : null;
  const runSoFar = Math.round(parts.slice(0, r.si + (secDone ? 1 : 0)).reduce((a, b) => a + b, 0));
  const filling = left == null || left > 0;
  const bankedHere = sec ? !!(banked[sec.key] && !r.results[sec.key]) : false;
  const showHand = playing && sec && secDone && handUp && !peek;
  // The room's game: mounted to play it, and again to show its answers when the
  // player steps back from the handover. A room banked on its own page earlier
  // today is never replayed: it mounts only to show its answers.
  const mountGame = Game && (!banked[sec.key] || peek);

  // ── the handover card ──
  const handBody = (() => {
    if (!sec || !secDone) return null;
    const pct = pctOf(secDone.read);
    const said = roomSaid(sec.key, readSave(sec.key, sec.num));
    return (
      <>
        <b>{secDone.score != null ? `${sec.name} · ${secDone.score} of ${secDone.total}` : `${sec.name}, on file`}{bankedHere ? ' · read earlier today' : ''}</b>
        <span>{pct == null ? 'Asking the room where you stand.' : `You out-read ${pct}% of the room so far.`} Worth {Math.round(parts[r.si] || 0)} of {Math.round(PART)}.</span>
        {said ? <span className="rr-said"><b>{SAID_LEAD[sec.key] || 'The room said'}:</b> {said}</span> : null}
        <button type="button" className="rr-peek" onClick={() => setPeek(true)}>See the room&rsquo;s answers</button>
      </>
    );
  })();

  return (
    <div className="rr" data-sot-wait="" style={{ fontFamily: SANS, overflowX: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {!hydrated ? <GauntletCover sections={stageSecs} /> : null}

      {hydrated && r.phase === 'idle' && (
        <GauntletGate
          circuitName="Read the Room"
          dateLabel={dateShort}
          sections={stageSecs}
          lineFor={(s) => s.phrase}
          bandNote={(s) => (banked[s.key] ? 'Done' : (BAND_NOTE[s.key] || s.unit))}
          headline={<>{(COUNT_WORD[N] || String(N)).replace(/^./, (c) => c.toUpperCase())} Rooms.<br />No Answer Key.</>}
          rule={"The key is whatever tonight\u2019s crowd does, and it moves until midnight."}
          lineup={null}
          startLabel={allBanked ? 'Read your verdict' : 'Walk in'}
          fieldLine="About 5 minutes · the read settles at midnight Eastern"
          banner={<><RunOtherDeviceBar runId={ROOM_RUN_ID} keys={sections.map((s) => s.key)} show={hydrated && r.phase === 'idle' && !r.t0 && !allBanked} /><Morning /></>}
          centerpiece={<RoomFill crowd={crowd} left={left} onStart={start} />}
          onStart={start}
        />
      )}

      {hydrated && playing && sec && (
        <div className={showHand ? 'rr-under' : undefined} aria-hidden={showHand ? 'true' : undefined}>
          <RunPlayFrame sections={stageSecs} idx={r.si} title="Read the Room" sub={`Room ${r.si + 1} of ${N} · ${sec.name}`}
            foot={<>Your read so far {runSoFar} of {ROOM_MAX}{mountGame && !banked[sec.key] ? <> · <button type="button" className="rr-lk" onClick={() => setHelpSeq((x) => x + 1)}>How to play {sec.name}</button></> : null}</>}>
            {mountGame ? (
              <div className="rr-host">
                <RunEmbed onResult={banked[sec.key] ? NOOP : onSectionDone} theme={embedTheme} help={helpSeq} autostart>
                  <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />
                </RunEmbed>
              </div>
            ) : null}
            {peek ? <div className="rr-peekpad" aria-hidden="true" /> : null}
          </RunPlayFrame>
          {peek && secDone ? (
            <div className="rr-peekbar">
              <button type="button" className="rr-pb2" onClick={() => setPeek(false)}>Back</button>
              <button type="button" className="rr-pb1" onClick={advance}>{last ? 'Read your verdict' : `Next room: ${sections[r.si + 1].name}`} <span aria-hidden="true">&rarr;</span></button>
            </div>
          ) : null}
        </div>
      )}

      {showHand && (
        <div className={last ? 'rr-final' : undefined}>
          <GauntletBetween
            circuitName="Read the Room"
            sections={stageSecs}
            results={[]}
            doneCount={r.si + 1}
            lastSec={stageSecs[r.si]}
            upNext={last ? { key: 'verdict', name: 'Verdict', slot: N } : stageSecs[r.si + 1]}
            upIdx={last ? -1 : r.si + 1}
            stepWord="Room"
            nextLine={last ? `How well you read all ${COUNT_WORD[N] || N} rooms` : sections[r.si + 1].line}
            lastBody={handBody}
            lastFig={secDone && secDone.read ? { v: `${pctOf(secDone.read)}%`, unit: 'out-read' } : null}
            auto={false}
            goLabel={last ? 'Read your verdict' : `Enter ${sections[r.si + 1].name}`}
            fine="Take your time: the next room waits for you."
            onGo={advance}
            leaveHref="/room"
          />
        </div>
      )}

      <RunChallengeCapture gameKey={ROOM_RUN_ID} />
      {hydrated && done && (() => {
        const t = climbRung(total);
        const data = board && board.data;
        const meB = data && data.me;
        const fig = (row) => Math.round(Number(row.total) || 0);
        const isMe = (row) => !!(meB && row && meB.userKey && row.userKey === meB.userKey);
        const overall = data && Array.isArray(data.overall) ? data.overall : [];
        const rows = overall.slice(0, 3).map((row, i) => ({ rank: row.rank || i + 1, name: row.username || 'Guest', score: fig(row), me: isMe(row) }));
        if (meB && !rows.some((x) => x.me) && Number.isFinite(Number(meB.total))) {
          if (Number.isFinite(meB.rank) && meB.rank > 4) rows.push({ gap: true });
          rows.push({ rank: Number.isFinite(meB.rank) ? meB.rank : '–', name: 'You', score: total, me: true });
        }
        const sf = data && data.stageField;
        const avg = stageAvg(sf, sections);
        const rowsIn = sections.map((s, i) => {
          const g = sf && sf.games && sf.games[s.key];
          const a = avg && avg[s.key] != null ? Number(avg[s.key]) : null;
          return {
            key: s.key, name: s.name, bg: rampFor(i),
            you: counted[i] ? Math.round(parts[i] || 0) : '–',
            field: a != null ? Math.round(a) : '–',
            best: g && g.best != null ? Math.round(Number(g.best)) : '–',
          };
        });
        const players = data ? (data.uniquePlayers || data.overallField || (overall.length || null)) : null;
        const openSec = openKey ? sections.find((x) => x.key === openKey) : null;
        const OpenGame = openSec ? CLIENTS[openSec.key] : null;
        return (
          <GauntletEndStage
            circuitName="Read the Room"
            dateLabel={dateShort}
            sections={stageSecs}
            score={total}
            unitWord="points"
            colLabel="Room"
            ladder={CLIMB}
            ladderHeading="Where do you stand at the party?"
            title={{ name: t.name, line: t.line, colour: t.colour }}
            topNote={filling ? 'Early read: your title can move until midnight' : null}
            rank={meB && Number.isFinite(meB.rank) ? meB.rank : null}
            fieldSize={players}
            board={rows.length ? { rows, field: players, href: '/room/leaderboard' } : null}
            rowsIn={rowsIn}
            leaderScore={overall[0] ? fig(overall[0]) : null}
            challenge={<>
              <RunChallengeLine gameKey={ROOM_RUN_ID} score={total} total={ROOM_MAX} n={runToken()} style={{ margin: 0 }} />
              <RunChallengeButton gameKey={ROOM_RUN_ID} score={total} total={ROOM_MAX} n={runToken()} status={rung[1]} door />
            </>}
            meme={<RunMeme gameKey={ROOM_RUN_ID} score={total} total={ROOM_MAX} n={runToken()} status={rung[1]} cat="Crowd Psychology" />}
            similar={similarRun}
            more={<>
              <Morning />
              <div className="rr-rooms2" style={{ marginTop: 12 }}>
                <div className="rr-r2h">Room by room</div>
                <div className="rr-r2g">
                  {sections.map((s, i) => {
                    const c = counted[i];
                    const p = c && c.read ? pctOf(c.read) : null;
                    const on = openKey === s.key;
                    return (
                      <button type="button" key={s.key} className={`rr-gt${on ? ' on' : ''}`} aria-expanded={on} onClick={() => setOpenKey(on ? null : s.key)}>
                        <i style={{ background: softGround(rampFor(i)) }} aria-hidden="true" />
                        <span className="rr-gtn">{s.name}</span>
                        <b>{p == null ? '-' : `${p}%`}</b>
                        <small>{c && c.score != null ? `${c.score}/${c.total}` : 'on file'}{c && c.read ? ` · #${c.read.rank} of ${fmtN(c.read.field)}` : ''}</small>
                        <em>{on ? 'Hide results' : 'See results'}</em>
                      </button>
                    );
                  })}
                </div>
                {openSec && OpenGame ? (
                  <div className="rr-ans">
                    <div className="rr-ansh"><span>{openSec.name} · what the room said</span><button type="button" onClick={() => setOpenKey(null)}>Close</button></div>
                    <div className="rr-host">
                      <RunEmbed onResult={NOOP} theme={embedTheme}>
                        <OpenGame key={`ans-${openSec.key}-${openSec.num}`} puzzles={[openSec.puzzle]} forceNum={null} />
                      </RunEmbed>
                    </div>
                  </div>
                ) : null}
              </div>
              <MoreRunsList self="room" ink="var(--gsx-ink)" mute="var(--gsx-ink)" line="color-mix(in srgb, var(--gsx-ink) 30%, transparent)" style={{ margin: '14px 0 0' }} />
            </>}
            onShare={copyShare}
            copied={copied}
            sweep={doneAtLoad.current === false}
            finale={doneAtLoad.current === false ? { key: 'room', legWord: 'Room', legMax: sections.map(() => PART), legSub: sections.map((s) => ({ herd: 'Run with the herd', outwit: 'Dodge it', outrank: 'Call its order', feud: 'Say what it said' }[s.key] || '')) } : null}
          />
        );
      })()}
      <MoreRunsPop self="room" ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
    </div>
  );
}

// ─── the entry's centerpiece: tonight's room filling up ─────────────────────
// A compact crowd of little figures in the stage ink; `arriving` of them glow
// as the room fills. Tapping it walks in, like the lineup.
function RoomFill({ crowd, left, onStart }) {
  const n = 72;
  const arriving = Math.min(n, Math.max(6, Math.round(Math.sqrt(crowd || 0) * 1.6)));
  return (
    <button type="button" className="rr-fill" onClick={onStart} aria-label="Walk in">
      <span className="rr-fh"><span>Tonight&rsquo;s room</span><em>Filling now</em></span>
      <span className="rr-figs" role="img" aria-label="A room of players filling up">
        {Array.from({ length: n }, (_, k) => {
          const arr = ((k * 37 + 11) % 53) < arriving;
          return <span key={k} className={`rr-pp${arr ? ' in' : ''}`} style={arr ? { animationDelay: `${((k % 12) * 0.2).toFixed(1)}s` } : undefined}><i /><b /></span>;
        })}
      </span>
      <span className="rr-ff">
        <b>{crowd == null ? ' ' : `${fmtN(crowd)} in the room so far`}</b>
        <span>{left == null ? ' ' : `${Math.floor(left / 3600)}h ${String(Math.floor((left % 3600) / 60)).padStart(2, '0')}m until the doors close`}</span>
      </span>
    </button>
  );
}

// ─── THE MORNING AFTER ──────────────────────────────────────────────────────
// The player's last room is closed now, so the read it gives back is final.
// Shown on EVERY load of the entry and the verdict (owner, 2026-10-23: "Read
// the Room also needs to show prior day results upon load"), for the most
// recent earlier day this browser finished, looking back up to two weeks. On
// the stage it is one compact strip (the entry must fit one phone screen). If
// the rooms cannot be asked again, it shows the read kept at the finish, and
// says so. The close button hides it for this visit only.
function lastRoomDay() {
  const t = new Date(`${etToday()}T12:00:00Z`);
  for (let k = 1; k <= 14; k++) {
    t.setUTCDate(t.getUTCDate() - 1);
    const day = t.toISOString().slice(0, 10);
    try {
      const run = JSON.parse(localStorage.getItem(storeOf(day)) || 'null');
      if (run && run.phase === 'done' && run.rooms && run.finishRead != null) return { day, run };
    } catch (e) { return null; }
  }
  return null;
}
function Morning() {
  const [m, setM] = useState(null);
  useEffect(() => {
    const last = lastRoomDay();
    if (!last) return undefined;
    const { day, run } = last;
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
      if (!alive) return;
      const asked = Object.keys(per).length > 0;
      const part = roomPartFor(day);
      const settledRead = asked ? Math.round(keys.reduce((s, k) => s + (per[k] ? roomPoints(per[k].read.rank, per[k].read.field, part) : 0), 0)) : run.finishRead;
      let rank = null, players = null;
      if (asked) {
        try {
          const { anonId, email } = dailyMeIdentity();
          const qs = new URLSearchParams({ circuit: ROOM_RUN_ID, date: suffixOf(day) });
          if (anonId) qs.set('anonId', anonId);
          if (email) qs.set('email', email);
          const d = await fetch(`/api/quiz/daily-combined?${qs.toString()}`).then((x) => x.json());
          if (d && d.me && d.me.rank) { rank = d.me.rank; players = d.uniquePlayers || null; }
        } catch (e) {}
      }
      if (alive) setM({ day, from: run.finishRead, to: settledRead, asked, rank, players });
    })();
    return () => { alive = false; };
  }, []);
  if (!m) return null;
  const ti = roomTierOf(m.to), was = roomTierOf(m.from);
  const L = ROOM_LADDER[ti];
  const dir = ti < was ? `up ${was - ti}` : ti > was ? `down ${ti - was}` : null;
  const when = m.day === etYesterday() ? 'Yesterday’s room' : `Your last room · ${new Date(`${m.day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
  return (
    <div className="rr-morn" role="status">
      <span className="rr-mt">
        <i>{when}{m.asked ? ' settled' : ''}</i>
        <span><b>{L[1]}</b> &middot; {m.to} of 100{m.asked && m.to !== m.from ? ` (${m.from} at the finish${dir ? `, ${dir}` : ''})` : ''}{m.rank ? ` · #${m.rank}${m.players ? ` of ${fmtN(m.players)}` : ''} final` : ''}</span>
      </span>
      <button type="button" className="rr-mx" onClick={(e) => { e.stopPropagation(); setM(null); }} aria-label="Dismiss">&times;</button>
    </div>
  );
}

const CSS = `
.rr *{box-sizing:border-box}
/* the embedded crowd games sit on the run's pastel ground */
.rr-lk{background:none;border:0;padding:4px 2px;color:inherit;font:inherit;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.rr-host .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
.gsx-play .rr-host .stage-page{color:var(--stg-ink) !important}
.rr-under{pointer-events:none}
/* entry centerpiece: tonight's room */
.rr-fill{flex:1;display:flex;flex-direction:column;justify-content:center;gap:10px;width:100%;padding:12px 14px;border:2px solid var(--gsx-ink);border-radius:18px;background:color-mix(in srgb, var(--gsx-ink) 6%, transparent);color:var(--gsx-ink);font:inherit;text-align:left;cursor:pointer}
.rr-fh,.rr-ff{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.rr-fh span{font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.rr-fh em{font-style:normal;font-size:12px;font-weight:800;opacity:.75}
.rr-ff{flex-wrap:wrap;gap:2px 12px;font-size:12.5px;font-weight:700}
.rr-ff span{opacity:.75}
.rr-figs{display:grid;grid-template-columns:repeat(18,minmax(0,1fr));gap:6px 2px;justify-items:center}
.rr-pp{position:relative;width:12px;height:17px;display:block;color:var(--gsx-ink);opacity:.22}
.rr-pp i{position:absolute;left:3px;top:0;width:6px;height:6px;border-radius:50%;background:currentColor}
.rr-pp b{position:absolute;left:0;top:7.5px;width:12px;height:9px;border-radius:6px 6px 2px 2px;background:currentColor}
.rr-pp.in{animation:rrarrive 2.4s ease-in-out infinite alternate}
@keyframes rrarrive{0%{opacity:.3}100%{opacity:.95}}
@media(min-width:900px){
  .rr-fill{padding:16px 18px}.rr-figs{gap:9px 4px}
  /* the room and the lineup share the right column; the title holds the left */
  .rr .gsx-gate.gsx-cp .gsx-split{grid-template-rows:auto auto auto;row-gap:18px}
  .rr .gsx-gate.gsx-cp .gsx-split > .gsx-top{margin-bottom:0}
  .rr .gsx-gate.gsx-cp .gsx-head{grid-column:1;grid-row:2 / span 2}
  .rr .gsx-gate.gsx-cp .gsx-piece{grid-column:2;grid-row:2;display:flex}
  .rr .gsx-gate.gsx-cp .gsx-bands{grid-column:2;grid-row:3}
}
/* the morning strip (gate banner and end page) */
.rr-morn{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 12px;border:2px solid var(--gsx-ink);border-radius:14px;color:var(--gsx-ink);background:color-mix(in srgb, var(--gsx-ink) 7%, transparent)}
.rr-mt{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;font-size:13px;font-weight:600;line-height:1.3}
.rr-mt i{font-style:normal;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
.rr-mt b{font-weight:800}
.rr-mx{flex:none;width:32px;height:32px;border-radius:16px;border:0;background:transparent;color:var(--gsx-ink);font-size:22px;line-height:1;cursor:pointer}
/* handover extras */
.rr-said{display:block;margin-top:3px;font-size:12.5px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.rr-peek{align-self:flex-start;margin-top:5px;padding:0;border:0;background:none;color:var(--gsx-ink);font:inherit;font-size:13px;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.rr-final .gsx-eye2{font-size:0 !important}
.rr-final .gsx-eye2::after{content:'Up Next';font-size:15px}
.rr-peekpad{height:84px}
.rr-peekbar{position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;gap:10px;justify-content:center;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:linear-gradient(to top, var(--rr-pbg, rgba(0,0,0,.18)), transparent)}
.rr-peekbar button{min-height:52px;border-radius:14px;font:800 16px ${SANS};cursor:pointer}
.rr-pb1{flex:1;max-width:420px;border:0;background:#08222e;color:#fff}
.rr-pb2{flex:none;padding:0 18px;border:2px solid #08222e;background:#ffffffcc;color:#08222e}
/* end page: room by room, each room's answers open below */
.rr-rooms2{display:flex;flex-direction:column;gap:8px}
.rr-r2h{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.rr-r2g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.rr-gt{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:1px;min-width:0;padding:10px 12px;border:2px solid var(--gsx-ink);border-radius:12px;background:transparent;color:var(--gsx-ink);font:inherit;text-align:left;cursor:pointer;overflow:hidden}
.rr-gt>i{position:absolute;left:0;top:0;bottom:0;width:7px;border-right:2px solid var(--gsx-ink)}
.rr-gt>*:not(i){padding-left:6px}
.rr-gt.on{background:color-mix(in srgb, var(--gsx-ink) 10%, transparent)}
.rr-gtn{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.rr-gt b{font-size:22px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}
.rr-gt small{font-size:11.5px;font-weight:700;opacity:.8;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rr-gt em{margin-top:4px;font-style:normal;font-size:12px;font-weight:800;text-decoration:underline;text-underline-offset:3px}
.rr-ans{border:2px solid var(--gsx-ink);border-radius:14px;padding:10px 0 4px;overflow:hidden;background:color-mix(in srgb, #fff 35%, transparent)}
.rr-ansh{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 12px 6px}
.rr-ansh span{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.rr-ansh button{border:2px solid var(--gsx-ink);background:transparent;color:var(--gsx-ink);font:800 12.5px ${SANS};padding:5px 12px;border-radius:999px;cursor:pointer}
.rr-ans .stage-page{color:var(--stg-ink) !important}
/* the $100 drawing / challenge card runs the full width of the tray */
.gsx-tray .tkd,.gsx-tray .rch-door{width:100%;box-sizing:border-box}
@media(prefers-reduced-motion:reduce){.rr *{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition:none !important}}
`;
