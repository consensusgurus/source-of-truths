'use client';

// ReportIssue — a small "Report an issue" affordance for the daily puzzles.
// It wires into the site's existing submission system: the same `complaints`
// table + admin "Notices" tab used for list feedback, via POST /api/complaints.
// Name and email are optional; only a short message is asked for.
//
// Rendered in two places: the shared end-of-game card (DailyEndCard) and the
// in-game games grid (DailyGamesGrid, reachable mid-game from "more"). Pass
// `self` (the game key), the display `name`, and an `accent` for the send button.
//
// A FIELD IS A SURFACE, AND IT FOLLOWS THE REGISTER ITS INK DOES (2026-09-01).
// This used to read "both are light surfaces, so one light theme covers both",
// and that stopped being true the day the stage arrived: INK below became
// var(--stg-ink), which is #e9edf4 on the dark register, while every field kept
// a hardcoded var(--white) sheet. Measured on live /fib: text at 1.11:1 against
// its own background, and a Cancel button that was white on white. A player
// reported it the only way left open to them, by typing into the box they could
// not read. Note the shape of it, because it generalises to every shared
// component that was written for a light surface: converting the INK without
// converting the SHEET under it is worse than converting neither. Any surface
// token here needs its off-stage fallback, so the Loft render stays byte-identical.

import React, { useState, useEffect } from 'react';
import { Flag, Check, HelpCircle } from 'lucide-react';
import { savedIdentity } from '@/lib/saved-identity';
import { T } from '@/lib/theme';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
// SHARED, and mounted on the stage: module-level literals meant the dark ink
// of the Loft on the near-black ground. The tokens are undefined off the stage,
// so the fallbacks keep it exactly as it was.
const INK = `var(--stg-ink, ${T.ink})`;
const FADED = `var(--stg-mute, ${T.muted})`;

// Today's puzzle id fragment in the daily convention (M-D-YY, e.g. 7-18-26),
// in Eastern time — the day the daily puzzles roll over.
function etTodayId() {
  let iso;
  try { iso = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { iso = new Date().toISOString().slice(0, 10); }
  const [y, m, d] = iso.split('-');
  return `${Number(m)}-${Number(d)}-${String(Number(y) % 100)}`;
}

// onHelp: the daily's own rules modal. Passed by all 80 game clients, and by
// nothing else, so the end card and the games grid render the flag alone.
export default function ReportIssue({ self, name, accent = T.accent, align = 'center', onHelp = null }) {
  // The send button sits on a white sheet and prints white text, so a light
  // accent would make it invisible. Measure the accent and fall back to ink.
  const btnAccent = (() => {
    const m = String(accent || '').trim().match(/^#?([0-9a-f]{6})$/i);
    if (!m) return accent;
    const n = parseInt(m[1], 16);
    const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
    return lum > 0.75 ? T.accent : accent;
  })();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [nm, setNm] = useState('');
  const [email, setEmail] = useState('');
  // A signed-in player's name + email prefill the reply fields, so a report
  // always comes back with somewhere to answer it. Still editable, still
  // optional: a guest sees empty fields exactly as before.
  useEffect(() => {
    const who = savedIdentity();
    if (who.username) setNm((v) => v || who.username);
    if (who.email) setEmail((v) => v || who.email);
  }, []);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const gameName = name || (self ? self[0].toUpperCase() + self.slice(1) : 'this game');

  async function submit() {
    if (busy || !msg.trim()) return;
    setBusy(true);
    // Capture the exact page (incl. any ?p= archive param) so the editors can
    // open the precise puzzle the report is about.
    let path = '';
    try { path = window.location.pathname + window.location.search; } catch (e) {}
    const listId = `${self || 'daily'}-${etTodayId()}`;
    const listTitle = `Daily puzzle: ${gameName}${path ? ` · ${path}` : ''}`.slice(0, 200);
    try {
      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, listTitle, message: msg.trim(), name: nm.trim(), email: email.trim() }),
      });
    } catch (e) {
      // Swallow — we still acknowledge to the player. Reports are best-effort.
    }
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="ri-wrap" style={{ textAlign: align }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .ri-wrap{margin-top:10px;font-family:${SANS};}
        .ri-link{background:none;border:none;cursor:pointer;font-family:${MONO};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:500;color:${FADED};display:inline-flex;align-items:center;gap:5px;padding:4px 6px;}
        .ri-link:hover{color:${INK};}
        .ri-chips{display:inline-flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center;}
        .ri-how{color:${INK};font-weight:700;}
        .ri-form{max-width:400px;margin:6px auto 0;text-align:left;}
        .ri-h{font-size:12.5px;font-weight:800;color:${INK};margin:0 0 7px;text-align:center;}
        .ri-form textarea,.ri-form input{width:100%;box-sizing:border-box;font-family:${SANS};font-size:13px;color:${INK};border:1.5px solid var(--stg-line2, #d4d9e0);border-radius:8px;padding:9px 10px;outline:none;background:var(--stg-surf2, var(--white));}
        .ri-form textarea::placeholder,.ri-form input::placeholder{color:${FADED};opacity:1;}
        .ri-form textarea{resize:vertical;margin-bottom:7px;}
        .ri-form textarea:focus,.ri-form input:focus{border-color:${INK};}
        .ri-row{display:flex;gap:7px;margin-bottom:9px;flex-wrap:wrap;}
        .ri-row input{flex:1;min-width:130px;}
        .ri-actions{display:flex;gap:8px;justify-content:flex-end;}
        .ri-btn{font-family:${SANS};font-weight:800;font-size:13px;border:1.5px solid ${INK};background:var(--stg-surf2, var(--white));color:${INK};border-radius:8px;padding:8px 14px;cursor:pointer;}
        /* The send button wears the game's category step on the stage, ink from
           the ramp's own on-colour, which is what every other filled control on
           a game page does. The per-game accent prop is the off-stage fallback.
           No backticks in here: this comment lives inside a template literal. */
        .ri-btn.primary{color:var(--stg-onramp, var(--white));}
        .ri-btn:disabled{opacity:.5;cursor:default;}
        .ri-sent{margin-top:6px;font-size:12.5px;font-weight:700;color:var(--stg-good, #0e7c5a);display:inline-flex;align-items:center;gap:6px;}
      ` }} />
      {sent ? (
        <div className="ri-sent"><Check size={13} strokeWidth={3} /> Thanks. The team will take a look.</div>
      ) : open ? (
        <div className="ri-form">
          <div className="ri-h">Report an issue with {gameName}</div>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="What went wrong? A wrong answer, a typo, something that won't load…"
          />
          <div className="ri-row">
            <input type="text" value={nm} onChange={(e) => setNm(e.target.value)} maxLength={120} placeholder="Name (optional)" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} placeholder="Email (optional)" />
          </div>
          <div className="ri-actions">
            <button type="button" className="ri-btn" onClick={() => { setOpen(false); }}>Cancel</button>
            <button
              type="button"
              className="ri-btn primary"
              style={{ background: `var(--stg-acc, ${btnAccent})`, borderColor: `var(--stg-acc, ${btnAccent})` }}
              onClick={submit}
              disabled={busy || !msg.trim()}
            >
              {busy ? 'Sending…' : 'Send report'}
            </button>
          </div>
        </div>
      ) : (
        <span className="ri-chips">
          {onHelp ? (
            <button type="button" className="ri-link ri-how" onClick={onHelp}>
              <HelpCircle size={11} strokeWidth={2.2} /> How to play
            </button>
          ) : null}
          <button type="button" className="ri-link" onClick={() => setOpen(true)}>
            <Flag size={11} strokeWidth={2.2} /> Report an issue
          </button>
        </span>
      )}
    </div>
  );
}
