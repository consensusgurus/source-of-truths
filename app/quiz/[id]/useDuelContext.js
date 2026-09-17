'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Swords, X } from 'lucide-react';
import { T } from '@/lib/theme';

// Universal duel context for a quiz page. Works for EVERY board format because
// QuizClient calls this hook once, above its per-format early returns, and drops
// <DuelBanner> into each return path. A quiz entered from a duel carries a
// ?duel=<token> param; we persist it (so a board that rewrites its own URL, or
// the results screen, doesn't lose it) and, once the player records a qualifying
// play, silently POST /api/duel/submit so their score attaches to the duel with
// no manual "submit my score" step. This is what makes "play the quiz challenge"
// actually do something.

const KEY = 'sot_duel_active';
const TTL = 2 * 60 * 60 * 1000; // 2h: long enough for one sitting, short enough not to leak into a later unrelated play

function anonId() { try { return localStorage.getItem('sot_quiz_anon'); } catch { return null; } }
function storedName() { try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity')); return (j && j.username) || ''; } catch { return ''; } }
function storedEmail() { try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity')); return (j && j.email) || ''; } catch { return ''; } }

export default function useDuelContext(quizId, searchParams) {
  const [token, setToken] = useState(null);
  const [info, setInfo] = useState(null);        // the duel row, for banner copy
  const [submitted, setSubmitted] = useState(false);
  const pollRef = useRef(null);

  // Resolve the active duel token for THIS quiz: prefer ?duel=, else a fresh
  // persisted record for the same quiz.
  useEffect(() => {
    let tk = searchParams ? searchParams.get('duel') : null;
    tk = tk && /^[a-z0-9]{4,16}$/i.test(tk) ? tk : null;
    if (tk) {
      try { localStorage.setItem(KEY, JSON.stringify({ token: tk, quizId, ts: Date.now() })); } catch {}
    } else {
      try {
        const s = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (s && s.token && s.quizId === quizId && (Date.now() - (s.ts || 0)) < TTL) tk = s.token;
        else if (s) localStorage.removeItem(KEY);
      } catch {}
    }
    setToken(tk || null);
  }, [quizId, searchParams]);

  // Fetch the duel once for the banner (opponent name, status).
  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch(`/api/duel/get?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d || !d.duel) return;
        setInfo(d.duel);
        if (d.duel.status === 'complete' || d.duel.status === 'declined') {
          setSubmitted(true);
          try { localStorage.removeItem(KEY); } catch {}
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [token]);

  // While the duel is live and my side hasn't posted, poll submit. The endpoint
  // returns no_play (harmless) until the player finishes and a result row exists,
  // then attaches their best play. On success we mark submitted and clear the
  // record so it can't leak into a later play.
  useEffect(() => {
    if (!token || submitted) return;
    const a = anonId();
    if (!a) return;
    let alive = true;
    async function attempt() {
      const nm = (storedName() || 'Player').slice(0, 40);
      try {
        const r = await fetch('/api/duel/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, anonId: a, name: nm, email: storedEmail() || undefined }),
        });
        const d = await r.json();
        if (!alive) return;
        if (d && d.duel) {
          const mine = d.duel.challenger_anon === a ? d.duel.challenger_score : d.duel.opponent_score;
          if (mine != null) {
            setInfo(d.duel);
            setSubmitted(true);
            try { localStorage.removeItem(KEY); } catch {}
          }
        }
      } catch {}
    }
    attempt();
    // Skip hidden tabs (egress fix 2026-07-12): the score attaches on the
    // first visible attempt after the player returns.
    pollRef.current = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      attempt();
    }, 5000);
    return () => { alive = false; if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, submitted]);

  return { duelToken: token, duelInfo: info, duelSubmitted: submitted };
}

const ACCENT = T.accent;
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

// A slim fixed bar shown on any quiz opened as part of a duel. Before the player
// finishes it reassures them the score sends automatically and offers a way back
// to the duel; once their score is in it flips to a clear confirmation + a button
// to view the result.
export function DuelBanner({ token, info, submitted }) {
  const [hidden, setHidden] = useState(false);
  if (!token || hidden) return null;
  let foe = null;
  try {
    const a = localStorage.getItem('sot_quiz_anon');
    if (info && a) foe = info.challenger_anon === a ? info.opponent_name : info.challenger_name;
  } catch {}
  const done = submitted || (info && (info.status === 'complete' || info.status === 'declined'));
  const href = `/duel/${token}`;
  const wrap = {
    position: 'fixed', left: '50%', bottom: 16, transform: 'translateX(-50%)', zIndex: 95,
    maxWidth: 'calc(100vw - 24px)', display: 'flex', alignItems: 'center', gap: 12,
    background: T.white, border: `2px solid ${ACCENT}`, borderRadius: 999,
    boxShadow: '0 12px 34px rgba(20,22,28,0.22)', padding: '9px 10px 9px 16px', fontFamily: FONT,
  };
  const txt = { fontSize: 13, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60vw' };
  const btn = { flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: ACCENT, color: T.white, textDecoration: 'none', borderRadius: 999, padding: '8px 15px', fontWeight: 800, fontSize: 13 };
  return (
    <div style={wrap} className="sot-duel-banner">
      <Swords size={17} style={{ color: ACCENT, flex: 'none' }} />
      {done ? (
        <>
          <span style={txt}>Score sent to your duel{foe ? ` vs ${foe}` : ''}</span>
          <a href={href} style={btn}>View result →</a>
        </>
      ) : (
        <>
          <span style={txt}>Duel{foe ? ` vs ${foe}` : ''} · finish to send your score</span>
          <a href={href} style={{ ...btn, background: '#eef2fb', color: ACCENT }}>Back to duel</a>
        </>
      )}
      <button onClick={() => setHidden(true)} aria-label="Dismiss" style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 999, border: 'none', background: 'transparent', color: T.muted, cursor: 'pointer', padding: 0 }}><X size={16} strokeWidth={2.5} /></button>
      <style dangerouslySetInnerHTML={{ __html: `@media(max-width:560px){.sot-duel-banner{bottom:78px !important;}}` }} />
    </div>
  );
}
