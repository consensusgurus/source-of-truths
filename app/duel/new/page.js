'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuizNavHeader from '../../quizzes/QuizNavHeader';
import Grain from '../../Grain';
import Footer from '../../Footer';
import DuelSignup from '../DuelSignup';
import { QUIZZES } from '@/lib/quizzes';
import { duelSubject } from '@/lib/duel-subjects';
import { T } from '@/lib/theme';

const C = { bg: T.white, surface: T.white, ink: T.ink, muted: T.muted, soft: T.muted, line: 'rgba(20,22,28,0.10)', accent: T.accent, accsoft: '#e8effb' };
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

function ensureAnon() {
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) { a = 'd' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem('sot_quiz_anon', a); }
    return a;
  } catch { return null; }
}
function storedName() { try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity')); return (j && j.username) || ''; } catch { return ''; } }
function storedEmail() { try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity')); return (j && j.email) || ''; } catch { return ''; } }

export default function NewDuelPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [oppQ, setOppQ] = useState('');
  const [oppResults, setOppResults] = useState([]);
  const [opp, setOpp] = useState(null);
  const [myAnon, setMyAnon] = useState('');
  const [device, setDevice] = useState('any');
  const [signupOpen, setSignupOpen] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState(null);
  const [daily, setDaily] = useState([]);
  const [allDaily, setAllDaily] = useState(false);

  useEffect(() => { setName(storedName()); setMyAnon(ensureAnon() || ''); }, []);
  useEffect(() => {
    try { const p = new URLSearchParams(window.location.search); const oa = p.get('opponent'); const on = p.get('oppName'); if (oa) setOpp({ anon: oa, name: on || 'Player' }); const qz = p.get('quiz'); if (qz) { const s = duelSubject(qz, QUIZZES.find((x) => x.id === qz)); if (s.shortTitle && s.shortTitle !== qz) setQ(s.shortTitle); } } catch {}
  }, []);
  // Today's daily puzzles are duelable too. They are resolved server-side
  // (/api/duel/subjects) because this picker is a client component and the
  // slate module imports every game's puzzle file, answers and all.
  useEffect(() => {
    let alive = true;
    fetch('/api/duel/subjects').then((r) => r.json()).then((d) => { if (alive && d && Array.isArray(d.subjects)) setDaily(d.subjects); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    let alive = true; const s = oppQ.trim(); if (opp) return;
    const t = setTimeout(() => {
      const em = storedEmail();
      fetch(`/api/duel/players?q=${encodeURIComponent(s)}&exclude=${encodeURIComponent(myAnon)}${em ? `&email=${encodeURIComponent(em)}` : ''}`)
        .then((r) => r.json()).then((d) => { if (alive && d && Array.isArray(d.players)) setOppResults(d.players); }).catch(() => {});
    }, 220);
    return () => { alive = false; clearTimeout(t); };
  }, [oppQ, opp, myAnon]);

  const dailyResults = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return daily;
    return daily.filter((x) => `${x.title} ${x.category} ${x.tag} ${x.key}`.toLowerCase().includes(s));
  }, [q, daily]);

  // Peek six, then one bar. Listing all 62 of today's puzzles buried the quiz
  // group a full four screens down. A search shows every match and drops the
  // bar, because the search IS the reader narrowing the list.
  const DAILY_PEEK = 6;
  const dailyShown = (allDaily || q.trim()) ? dailyResults : dailyResults.slice(0, DAILY_PEEK);
  const dailyHidden = dailyResults.length - dailyShown.length;

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pool = QUIZZES.filter((x) => !x.unlisted && x.format !== 'garble' && (!x.publishedAt || Date.parse(x.publishedAt) <= Date.now()));
    if (!s) return pool.slice(0, 40);
    return pool.filter((x) => (x.title || '').toLowerCase().includes(s) || (x.category || '').toLowerCase().includes(s)).slice(0, 60);
  }, [q]);

  async function start(quizId) {
    if (busy) return;
    // A duel name is never free text: guests must claim a display name first.
    const nm = (name || storedName() || '').trim().slice(0, 40);
    if (!nm) { setPendingQuiz(quizId); setSignupOpen(true); return; }
    setBusy(true);
    const anon = ensureAnon();
    try {
      const body = { quizId, anonId: anon, name: nm, device };
      if (opp && opp.anon) { body.opponentAnon = opp.anon; body.opponentName = opp.name; }
      const r = await fetch('/api/duel/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d && d.token) { router.push(`/duel/${d.token}`); return; }
      if (d && d.error === 'duels_not_ready') { alert('Duels are being switched on. Check back shortly.'); }
    } catch {}
    setBusy(false);
  }

  const inp = { width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: `1px solid ${C.line}`, borderRadius: 10, fontFamily: FONT, fontSize: 14, outline: 'none' };
  const grpHd = { fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.accent, margin: '2px 0 8px' };
  const rowBtn = { textAlign: 'left', display: 'flex', minWidth: 0, alignItems: 'center', justifyContent: 'space-between', gap: 10, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: '12px 14px', fontFamily: FONT };
  const rowNm = { display: 'block', fontSize: 15, fontWeight: 700, color: C.ink, overflowWrap: 'anywhere' };
  const rowSub = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: C.soft };
  const rowPill = { flex: 'none', fontSize: 12, fontWeight: 800, color: T.white, background: C.accent, padding: '6px 12px', borderRadius: 999 };
  const moreBar = { width: '100%', boxSizing: 'border-box', marginTop: 8, background: C.accsoft, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: '10px 12px', fontFamily: FONT, fontWeight: 800, fontSize: 13, color: C.accent, cursor: 'pointer' };
  const devOpts = [{ v: 'any', l: 'Any Device' }, { v: 'mobile', l: 'Mobile Only' }, { v: 'desktop', l: 'Desktop Only' }];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, position: 'relative' }}>
      <Grain />
      {signupOpen && <DuelSignup anonId={myAnon} onClose={() => { setSignupOpen(false); setPendingQuiz(null); }} onDone={(un) => { setName(un); setSignupOpen(false); const pq = pendingQuiz; setPendingQuiz(null); if (pq) start(pq); }} />}
      <QuizNavHeader />
      <div className="qzf-w" style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 38px 70px', position: 'relative' }}>
        <div className="qzf-line" aria-hidden="true" />
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Link href="/#sty-quizzes" style={{ fontSize: 13, fontWeight: 700, color: C.accent, textDecoration: 'none' }}>← Back to Quizzes</Link>
          <div style={{ marginTop: 16, marginBottom: 4, fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: C.accent }}>Start a duel</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Challenge Someone to a Puzzle or Quiz</h1>
          <p style={{ color: C.muted, fontSize: 15, margin: '0 0 20px' }}>Pick a daily puzzle or a quiz. Challenge a specific player by name, or just share the invite link with anyone. Higher score wins (fastest on a tie).</p>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.soft, marginBottom: 6 }}>YOUR NAME</label>
          {name ? (
            <div style={{ background: C.accsoft, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: '11px 14px', marginBottom: 16, fontSize: 14, color: C.ink }}>Dueling as <span style={{ fontWeight: 800, color: C.accent }}>{name}</span></div>
          ) : (
            <>
              <button onClick={() => setSignupOpen(true)} style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left', background: T.white, color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 10, padding: '11px 14px', marginBottom: 6, fontFamily: FONT, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Claim a display name to duel +</button>
              <p style={{ color: C.soft, fontSize: 12, margin: '0 0 16px' }}>Duels are not anonymous: claim a display name so no one can play under someone else{"'"}s name. Takes a moment, no password.</p>
            </>
          )}

          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.soft, marginBottom: 6 }}>CHALLENGE A SPECIFIC PLAYER (OPTIONAL)</label>
          {opp ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: C.accsoft, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Challenging <span style={{ color: C.accent }}>{opp.name}</span> — they get a pop-up to play</span>
              <button onClick={() => { setOpp(null); setOppQ(''); }} style={{ border: 'none', background: 'transparent', color: C.accent, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, fontSize: 13 }}>Clear</button>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <input value={oppQ} onChange={(e) => setOppQ(e.target.value)} placeholder="Search players by name (or leave blank for a shareable link)…" style={inp} />
              {oppQ.trim() && (
                <div style={{ marginTop: 6, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                  {oppResults.length === 0 && <div style={{ padding: '10px 14px', color: C.soft, fontSize: 13 }}>No players match. You can still share the invite link.</div>}
                  {oppResults.map((p) => (
                    <button key={p.anon} onClick={() => setOpp(p)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: `1px solid ${C.line}`, background: T.white, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink }}>{p.name}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.soft, marginBottom: 6 }}>DEVICE (KEEP IT FAIR)</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            {devOpts.map((o) => (
              <button key={o.v} onClick={() => setDevice(o.v)} style={{ flex: '1 1 120px', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${device === o.v ? C.accent : C.line}`, background: device === o.v ? C.accent : T.white, color: device === o.v ? T.white : C.ink, fontFamily: FONT, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>{o.l}</button>
            ))}
          </div>
          <p style={{ color: C.soft, fontSize: 12, margin: '0 0 18px' }}>Playing on a computer is a big advantage on many puzzles and quizzes. Require the same device so it{"'"}s a fair fight (for example, mobile vs mobile).</p>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.soft, marginBottom: 6 }}>PICK A PUZZLE OR QUIZ{opp ? ` TO CHALLENGE ${opp.name.toUpperCase()}` : ''}</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search daily puzzles and quizzes…" style={{ ...inp, marginBottom: 12 }} />
          {dailyResults.length > 0 && (
            <>
              <div style={grpHd}>Today{"'"}s Daily Puzzles</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8 }}>
                {dailyShown.map((x) => (
                  <button key={x.quizId} onClick={() => start(x.quizId)} disabled={busy} style={{ ...rowBtn, cursor: busy ? 'default' : 'pointer' }}>
                    <span style={{ minWidth: 0, overflow: 'hidden' }}>
                      <span style={rowNm}>{x.title}</span>
                      <span style={rowSub}>{x.tag || x.category}</span>
                    </span>
                    <span style={rowPill}>Click to Challenge</span>
                  </button>
                ))}
              </div>
              {dailyHidden > 0 && (
                <button onClick={() => setAllDaily(true)} style={moreBar}>Show all {dailyResults.length} daily puzzles</button>
              )}
              {allDaily && !q.trim() && dailyResults.length > DAILY_PEEK && (
                <button onClick={() => setAllDaily(false)} style={moreBar}>Show fewer</button>
              )}
              {/* A daily duel is pinned to the dated board it was created on, which
                  is the only way it is a fair fight. Say so before they pick one. */}
              <p style={{ color: C.soft, fontSize: 12, margin: '10px 0 16px' }}>A daily puzzle duel is fought over today{"'"}s board, so both of you have to play it before midnight Eastern.</p>
              <div style={grpHd}>Quizzes</div>
            </>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8 }}>
            {results.map((x) => (
              <button key={x.id} onClick={() => start(x.id)} disabled={busy} style={{ ...rowBtn, cursor: busy ? 'default' : 'pointer' }}>
                <span style={{ minWidth: 0, overflow: 'hidden' }}>
                  <span style={rowNm}>{x.title}</span>
                  <span style={rowSub}>{x.category || 'Quiz'}</span>
                </span>
                <span style={rowPill}>Click to Challenge</span>
              </button>
            ))}
            {results.length === 0 && dailyResults.length === 0 && <div style={{ color: C.soft, fontSize: 14, padding: '8px 2px' }}>Nothing matches that search.</div>}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
