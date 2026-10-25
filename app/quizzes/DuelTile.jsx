'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, UserPlus, ListChecks, ArrowRight, X, ChevronDown, Trophy } from 'lucide-react';
import { QUIZZES } from '@/lib/quizzes';
import { duelSubject } from '@/lib/duel-subjects';
import { T } from '@/lib/theme';

const NAVY = T.accent, ACCENT = T.accent, AMBER = '#f8b84a';
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

function getAnon() { try { return localStorage.getItem('sot_quiz_anon') || ''; } catch { return ''; } }
function getEmail() { try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity')); return (j && j.email) || ''; } catch { return ''; } }

function timeAgo(iso) {
  try {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 90) return 'just now';
    const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60); if (h < 36) return `${h}h ago`;
    const d = Math.round(h / 24); return `${d}d ago`;
  } catch { return ''; }
}

// Quick-start duel composer in the quiz-hub tile grid. Pick an opponent
// (optional) and a subject, either one of today's daily puzzles or a quiz, then
// jump to /duel/new with both prefilled. On desktop
// the tile periodically FLIPS to a back face teasing the most recently completed
// duel (from /api/duel/latest) with a Duel Leaderboard CTA; the flip pauses
// whenever the user is hovering or has begun composing. On mobile the tile is a
// tap-to-collapse card that defaults to that latest-duel teaser (no flip).
export default function DuelTile() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [myAnon, setMyAnon] = useState('');
  const [oppQ, setOppQ] = useState('');
  const [oppResults, setOppResults] = useState([]);
  const [opp, setOpp] = useState(null);
  const [oppOpen, setOppOpen] = useState(false);
  const [quizQ, setQuizQ] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [daily, setDaily] = useState([]);
  const [latest, setLatest] = useState(null);
  const [face, setFace] = useState('form');
  const [hovered, setHovered] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => { setMyAnon(getAnon()); }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/duel/latest')
      .then((r) => r.json())
      .then((d) => { if (alive && d && d.duel) setLatest(d.duel); })
      .catch(() => {});
    // Today's daily puzzles, which are duelable alongside the quizzes.
    fetch('/api/duel/subjects')
      .then((r) => r.json())
      .then((d) => { if (alive && d && Array.isArray(d.subjects)) setDaily(d.subjects); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (opp) return;
    const s = oppQ.trim();
    if (!s) { setOppResults([]); return; }
    let alive = true;
    const t = setTimeout(() => {
      // Exclude every browser on the caller's account, not just this one, or a
      // player on a second device sees their own other device as an opponent.
      const em = getEmail();
      fetch(`/api/duel/players?q=${encodeURIComponent(s)}&exclude=${encodeURIComponent(myAnon)}${em ? `&email=${encodeURIComponent(em)}` : ''}`)
        .then((r) => r.json()).then((d) => { if (alive && d && Array.isArray(d.players)) setOppResults(d.players); }).catch(() => {});
    }, 220);
    return () => { alive = false; clearTimeout(t); };
  }, [oppQ, opp, myAnon]);

  const dailyResults = useMemo(() => {
    const s = quizQ.trim().toLowerCase();
    if (!s) return daily.slice(0, 4);
    return daily.filter((x) => `${x.title} ${x.category} ${x.tag} ${x.key}`.toLowerCase().includes(s)).slice(0, 8);
  }, [quizQ, daily]);

  const quizResults = useMemo(() => {
    const s = quizQ.trim().toLowerCase();
    const pool = QUIZZES.filter((x) => !x.unlisted && x.format !== 'garble' && (!x.publishedAt || Date.parse(x.publishedAt) <= Date.now()));
    if (!s) return pool.slice(0, 8);
    return pool.filter((x) => (x.title || '').toLowerCase().includes(s) || (x.category || '').toLowerCase().includes(s)).slice(0, 12);
  }, [quizQ]);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOppOpen(false); setQuizOpen(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Auto-flip loop: form face holds ~8s, latest-duel face ~6.5s. Never flips on
  // mobile (there the tile is a collapsible latest-duel card), never while the
  // user is hovering, composing, or after they've focused an input (interacted).
  const composing = oppOpen || quizOpen || !!opp || !!quiz || !!oppQ.trim() || !!quizQ.trim();
  const paused = hovered || interacted || composing;
  useEffect(() => {
    if (!latest || paused) return;
    if (typeof window !== 'undefined' && window.innerWidth <= 560) return;
    const t = setTimeout(() => setFace((f) => (f === 'form' ? 'last' : 'form')), face === 'form' ? 8000 : 6500);
    return () => clearTimeout(t);
  }, [face, latest, paused]);

  const last = useMemo(() => {
    if (!latest) return null;
    const qz = QUIZZES.find((x) => x.id === latest.quiz_id);
    const subj = duelSubject(latest.quiz_id, qz);
    const tie = latest.winner === 'tie';
    const cw = latest.winner === 'challenger';
    const wName = (cw || tie ? latest.challenger_name : latest.opponent_name) || 'Player';
    const lName = (cw || tie ? latest.opponent_name : latest.challenger_name) || 'Player';
    const wScore = cw || tie ? latest.challenger_score : latest.opponent_score;
    const lScore = cw || tie ? latest.opponent_score : latest.challenger_score;
    const scores = Number.isFinite(wScore) && Number.isFinite(lScore) ? `${wScore}–${lScore}` : '';
    return { tie, wName, lName, scores, quizTitle: (qz || subj.isDaily) ? subj.title : 'a quiz', ago: timeAgo(latest.created_at) };
  }, [latest]);

  function toggle() { if (typeof window !== 'undefined' && window.innerWidth <= 560) setOpen((o) => !o); }

  function start() {
    const p = new URLSearchParams();
    if (opp && opp.anon) { p.set('opponent', opp.anon); p.set('oppName', opp.name || 'Player'); }
    if (quiz && quiz.id) p.set('quiz', quiz.id);
    const qs = p.toString();
    router.push(`/duel/new${qs ? `?${qs}` : ''}`);
  }

  const field = { position: 'relative' };
  const inputBox = { display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 9, padding: '8px 11px', cursor: 'text' };
  const inputEl = { flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#eaf0fb', fontFamily: FONT, fontSize: 12.5 };
  const menu = { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 40, background: T.white, border: '1px solid rgba(20,22,28,0.12)', borderRadius: 10, boxShadow: '0 10px 28px rgba(8,15,35,0.28)', maxHeight: 210, overflowY: 'auto', padding: 4 };
  const item = { display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: FONT, fontSize: 13, color: T.ink };
  const menuHd = { padding: '6px 10px 3px', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT };
  const clearBtn = { border: 'none', background: 'transparent', color: '#9fb0d4', cursor: 'pointer', display: 'flex', flex: 'none' };
  const picked = { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12.5, color: '#eaf0fb', fontWeight: 700 };
  const ctaBtn = { marginTop: 'auto', width: '100%', background: T.cta, color: T.ctaInk, border: 'none', borderRadius: 10, padding: '10px', fontFamily: FONT, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 };
  const faceBase = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column' };

  return (
    <div
      className={`dueltile ${last ? 'has-mob-last' : ''} ${open ? 'mc-open' : 'mc-closed'}`}
      ref={wrapRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: NAVY, borderRadius: 14, padding: '14px 15px', color: T.white, display: 'flex', flexDirection: 'column', minHeight: 190, minWidth: 0, fontFamily: FONT, perspective: 1100 }}
    >
      <div className="duel-flip" style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', transformStyle: 'preserve-3d', transition: 'transform .65s cubic-bezier(.3,.7,.25,1)', transform: face === 'last' ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        {/* FRONT: the duel composer */}
        <div style={{ ...faceBase, flex: 1, pointerEvents: face === 'form' ? 'auto' : 'none' }}>
          <div className="dueltile-head" onClick={toggle} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: AMBER }}>1 v 1 Duel</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Swords size={18} style={{ color: AMBER, flex: 'none' }} />
                <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.15 }}>Challenge Someone to a Duel</span>
              </div>
            </div>
            <ChevronDown className="dueltile-chev" size={18} strokeWidth={2.5} style={{ color: '#9fb0d4', flex: 'none', transform: open ? 'rotate(180deg)' : 'none' }} />
          </div>

          <div className="dueltile-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '11px 0 12px' }}>
              <div style={field}>
                <div style={inputBox} onClick={() => { setOppOpen(true); setInteracted(true); }}>
                  <UserPlus size={15} style={{ color: '#9fb0d4', flex: 'none' }} />
                  {opp ? (
                    <>
                      <span style={picked}>{opp.name}</span>
                      <button aria-label="Clear opponent" onClick={(e) => { e.stopPropagation(); setOpp(null); setOppQ(''); }} style={clearBtn}><X size={14} /></button>
                    </>
                  ) : (
                    <input value={oppQ} onChange={(e) => { setOppQ(e.target.value); setOppOpen(true); }} onFocus={() => { setOppOpen(true); setInteracted(true); }} placeholder="Choose an opponent (optional)" style={inputEl} />
                  )}
                </div>
                {oppOpen && !opp && oppQ.trim() && (
                  <div style={menu}>
                    {oppResults.length === 0 ? <div style={{ padding: '8px 10px', fontSize: 12, color: T.muted }}>No players match. Leave blank for a shareable link.</div>
                      : oppResults.map((p) => (
                        <button key={p.anon} onClick={() => { setOpp(p); setOppOpen(false); }} style={item}>{p.name}</button>
                      ))}
                  </div>
                )}
              </div>

              <div style={field}>
                <div style={inputBox} onClick={() => { setQuizOpen(true); setInteracted(true); }}>
                  <ListChecks size={15} style={{ color: '#9fb0d4', flex: 'none' }} />
                  {quiz ? (
                    <>
                      <span style={picked}>{quiz.title}</span>
                      <button aria-label="Clear selection" onClick={(e) => { e.stopPropagation(); setQuiz(null); setQuizQ(''); }} style={clearBtn}><X size={14} /></button>
                    </>
                  ) : (
                    <input value={quizQ} onChange={(e) => { setQuizQ(e.target.value); setQuizOpen(true); }} onFocus={() => { setQuizOpen(true); setInteracted(true); }} placeholder="Choose a puzzle or quiz" style={inputEl} />
                  )}
                </div>
                {quizOpen && !quiz && (
                  <div style={menu}>
                    {dailyResults.length > 0 && (
                      <>
                        <div style={menuHd}>Today{"'"}s Daily Puzzles</div>
                        {dailyResults.map((x) => (
                          <button key={x.quizId} onClick={() => { setQuiz({ id: x.quizId, title: x.title }); setQuizOpen(false); }} style={item}>
                            <span style={{ display: 'block', fontWeight: 700, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingBottom: '0.16em', marginBottom: '-0.16em' }}>{x.title}</span>
                            <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: T.muted }}>{x.tag || x.category}</span>
                          </button>
                        ))}
                        <div style={menuHd}>Quizzes</div>
                      </>
                    )}
                    {quizResults.map((x) => (
                      <button key={x.id} onClick={() => { setQuiz({ id: x.id, title: x.title }); setQuizOpen(false); }} style={item}>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingBottom: '0.16em', marginBottom: '-0.16em' }}>{x.title}</span>
                        <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: T.muted }}>{x.category || 'Quiz'}</span>
                      </button>
                    ))}
                    {quizResults.length === 0 && dailyResults.length === 0 && <div style={{ padding: '8px 10px', fontSize: 12, color: T.muted }}>Nothing matches.</div>}
                  </div>
                )}
              </div>
            </div>

            <button onClick={start} style={ctaBtn}>Start a Duel <ArrowRight size={15} /></button>
          </div>
        </div>

        {/* BACK: latest completed duel teaser -> Duel Leaderboard */}
        {last && (
          <div style={{ ...faceBase, position: 'absolute', inset: 0, transform: 'rotateY(180deg)', pointerEvents: face === 'last' ? 'auto' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: AMBER }}>Latest Duel</div>
              {last.ago ? <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9fb0d4', flex: 'none' }}>{last.ago}</div> : null}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Trophy size={18} style={{ color: AMBER, flex: 'none' }} />
              <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {last.tie ? `${last.wName} tied ${last.lName}` : `${last.wName} defeated ${last.lName}`}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: '#c7d3ee', fontWeight: 600, marginTop: 7, lineHeight: 1.35 }}>
              {last.scores ? `${last.scores} on ` : 'On '}{last.quizTitle}
            </div>
            <button
              onClick={() => { setFace('form'); setInteracted(true); }}
              style={{ alignSelf: 'flex-start', border: 'none', background: 'transparent', padding: 0, marginTop: 8, color: '#9fb0d4', fontFamily: FONT, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Think you can do better? Start a duel
            </button>
            <a href="/quizzes/hub?tab=duels" style={{ ...ctaBtn, textDecoration: 'none' }}>See the Duel Leaderboard <ArrowRight size={15} /></a>
          </div>
        )}
      </div>
      {last && (
        <div className="duel-mob-last">
          <div className="dueltile-head" onClick={toggle} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: AMBER }}>Latest Duel</div>
                {last.ago ? <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9fb0d4', flex: 'none' }}>{last.ago}</div> : null}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Trophy size={18} style={{ color: AMBER, flex: 'none' }} />
                <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{last.tie ? `${last.wName} tied ${last.lName}` : `${last.wName} defeated ${last.lName}`}</span>
              </div>
            </div>
            <ChevronDown className="dueltile-chev" size={18} strokeWidth={2.5} style={{ color: '#9fb0d4', flex: 'none', transform: open ? 'rotate(180deg)' : 'none' }} />
          </div>
          <div className="dueltile-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 12.5, color: '#c7d3ee', fontWeight: 600, marginTop: 9, lineHeight: 1.35 }}>{last.scores ? `${last.scores} on ` : 'On '}{last.quizTitle}</div>
            <a href="/quizzes/hub?tab=duels" style={{ ...ctaBtn, textDecoration: 'none', marginTop: 12 }}>See the Duel Leaderboard <ArrowRight size={15} /></a>
            <button onClick={start} style={{ ...ctaBtn, background: 'transparent', color: T.white, border: '1px solid rgba(255,255,255,0.28)', marginTop: 8 }}>Start a Duel <ArrowRight size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
