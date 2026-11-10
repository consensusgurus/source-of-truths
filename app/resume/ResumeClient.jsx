'use client';

// Resume: name the famous person from their career profile (owner, 2026-11-09:
// "a business person or famous person LinkedIn. It needs to look a lot like
// LinkedIn. Will have college, past jobs, even fun facts"). The board is a
// profile page with the name and photo hidden: a banner and top card, then
// Experience, Education, Skills and Fun facts cards. Six clues open one at a
// time, the profile starting redacted (see LABELS). A wrong guess opens the next clue, and a wrong
// guess with all six open ends the day. Fewer clues rank higher, then the clock.
// Runs on the shared stage shell (app/SimpleDaily.jsx), like Tape.
//
// It looks like a professional networking profile but carries no other site's
// name, logo or marks: the brand on the page is Mind Loft's Resume.

import React, { useMemo, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { UNIVERSE } from './universe';

const MAX = 6;
// Owner, 2026-11-09: "education might even be too much" as the free clue. The profile now starts REDACTED: names
// (schools, employers) stay blacked out while the shape of the career shows, and come in later.
// Then (same night): "those skills give it away immediately", so skills joined the fun facts at clue 5 and the game
// opens on degrees and years alone.
const LABELS = ['Degrees', 'Early job titles', 'School names', 'Early employers', 'Skills and fun facts', 'Later career and headline'];

function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
const LIST = UNIVERSE.map((n) => ({ n, f: fold(n) }));

// The type-ahead: names that start with the text, then a word that starts with
// it, then names holding every typed word as a word prefix.
function matches(query, skip, extra) {
  const qf = fold(query);
  if (!qf) return [];
  const qw = qf.split(' ');
  const tiers = [[], [], []];
  for (const it of LIST) {
    if (skip.has(it.n)) continue;
    const forms = [it.f, ...(extra.get(it.n) || [])];
    let tier = 9;
    if (forms.some((f) => f.startsWith(qf))) tier = 0;
    else if (forms.some((f) => f.split(' ').some((w) => w.startsWith(qf)))) tier = 1;
    else if (forms.some((f) => { const w = f.split(' '); return qw.every((x) => w.some((y) => y.startsWith(x))); })) tier = 2;
    if (tier < 9) tiers[tier].push(it);
  }
  return tiers.flat().slice(0, 6);
}

// A square logo tile for an org or school: its first letter on a soft colour
// picked from the name, so the same org always gets the same tile.
const TILE = ['#dbe7f3', '#e3ecdc', '#f1e4d4', '#e7def1', '#f3dde3', '#dceff0', '#ece8d6'];
function tileOf(name) { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return TILE[h % TILE.length]; }
function Logo({ name, school }) {
  const letter = (name.replace(/^(The|A|An)\s+/i, '').match(/[A-Za-z0-9]/) || ['?'])[0].toUpperCase();
  return (
    <span className="rs-logo" aria-hidden="true" style={{ background: tileOf(name) }}>
      {school ? (
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 9l9-5 9 5-9 5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M7 11.5V16c0 1.3 2.2 2.5 5 2.5s5-1.2 5-2.5v-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
      ) : letter}
    </span>
  );
}

function Locked({ n, rows = 2, label }) {
  return (
    <div className="rs-lock" aria-label={`${label}: opens with clue ${n}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rs-skel">
          <span className="rs-logo rs-ghost" />
          <span className="rs-bars"><i style={{ width: `${62 - i * 9}%` }} /><i style={{ width: `${40 + i * 7}%` }} /></span>
        </div>
      ))}
      <div className="rs-lockt"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" /></svg>Clue {n}</div>
    </div>
  );
}

// A blacked-out name: the bar stands where an employer or school will appear.
function Redacted({ w = 150, n }) { return <span className="rs-red" style={{ width: w }} aria-label={`Hidden until clue ${n}`} />; }

function Job({ j, showOrg = true }) {
  return (
    <li className="rs-item">
      {showOrg ? <Logo name={j.org} /> : <span className="rs-logo rs-ghost" aria-hidden="true" />}
      <span className="rs-it">
        <b>{j.title}</b>
        {showOrg ? <span>{j.org}</span> : <Redacted n={4} w={Math.min(220, 60 + j.org.length * 4)} />}
        <small>{j.years}</small>
      </span>
    </li>
  );
}

const CSS = `
.rs{display:flex;flex-direction:column;gap:10px;width:100%;font-family:'Manrope',system-ui,sans-serif;color:#191919;}
.rs-q{margin:0;text-align:center;font-size:clamp(20px,5.8vw,24px);font-weight:800;letter-spacing:-.02em;color:var(--pst-ink,#0b0f1a);}
.rs-card{background:#fff;border:1px solid #d6d9de;border-radius:10px;overflow:hidden;}
.rs-pad{padding:14px 16px 12px;}
.rs-ban{height:74px;background:linear-gradient(120deg,#a0b4b7 0%,#c7d6dc 45%,#dfe7ea 100%);position:relative;}
.rs-av{position:absolute;left:16px;bottom:-44px;width:96px;height:96px;border-radius:50%;border:4px solid #fff;background:#e9e5df;overflow:hidden;box-sizing:border-box;}
.rs-top{padding:52px 16px 14px;}
.rs-name{display:flex;align-items:center;gap:8px;font-size:22px;font-weight:800;line-height:1.25;padding-bottom:2px;}
.rs-hide{display:inline-block;height:20px;width:190px;max-width:60%;border-radius:4px;background:#e3e6ea;}
.rs-head{font-size:15px;font-weight:600;line-height:1.4;margin-top:4px;color:#191919;}
.rs-loc{font-size:13.5px;font-weight:600;color:#666;margin-top:4px;line-height:1.4;}
.rs-meta{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:8px;font-size:13.5px;font-weight:800;color:#0a66c2;line-height:1.4;}
.rs-h{margin:0 0 6px;font-size:18px;font-weight:800;color:#191919;display:flex;align-items:center;justify-content:space-between;gap:8px;line-height:1.3;}
.rs-h small{font-size:12px;font-weight:800;color:#666;}
.rs-list{list-style:none;margin:0;padding:0;}
.rs-item{display:grid;grid-template-columns:48px 1fr;gap:12px;padding:10px 0;border-top:1px solid #e8e8e8;}
.rs-item:first-child{border-top:0;}
.rs-logo{width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#33475b;border-radius:4px;flex:none;}
.rs-ghost{background:#eef0f3;}
.rs-it{display:flex;flex-direction:column;gap:1px;min-width:0;line-height:1.4;}
.rs-it b{font-size:15px;font-weight:800;}
.rs-it span{font-size:14px;font-weight:600;color:#191919;}
.rs-it small{font-size:13px;font-weight:600;color:#666;}
.rs-sub{font-size:12.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#666;margin:10px 0 0;line-height:1.4;}
.rs-pills{display:flex;flex-wrap:wrap;gap:7px;}
.rs-pill{border:1px solid #c9ccd1;border-radius:999px;padding:5px 12px;font-size:13.5px;font-weight:700;line-height:1.35;}
.rs-facts{margin:0;padding:0 0 0 18px;display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600;line-height:1.45;}
.rs-lock{position:relative;}
.rs-skel{display:grid;grid-template-columns:48px 1fr;gap:12px;padding:8px 0;align-items:center;}
.rs-bars{display:flex;flex-direction:column;gap:7px;}
.rs-bars i{display:block;height:11px;border-radius:3px;background:#eef0f3;}
.rs-lockt{position:absolute;right:0;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:800;color:#555;background:#fff;border:1px solid #d6d9de;border-radius:999px;padding:4px 10px;line-height:1.35;}
.rs-miss{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:13px;font-weight:800;color:var(--pst-ink,#0b0f1a);}
.rs-miss s{border:1px solid var(--pst-ink,#0b0f1a);border-radius:999px;padding:4px 10px;font-weight:700;}
.rs-tools{display:flex;flex-direction:column;gap:8px;}
.rs-tools .pst-sug{border-radius:0;}
.rs-red{display:block;height:14px;margin:3px 0;border-radius:2px;background:#1f2328;max-width:100%;}
.rs-steps{display:flex;gap:4px;}
.rs-steps i{flex:1;height:5px;border-radius:3px;background:var(--pst-cell,#e6eaef);}
.rs-steps i.on{background:#0a66c2;}
`;

function Silhouette({ done }) {
  return (
    <svg viewBox="0 0 96 96" width="88" height="88" aria-hidden="true" style={{ display: 'block' }}>
      <rect width="96" height="96" fill={done ? '#d7e3ef' : '#e9e5df'} />
      <circle cx="48" cy="38" r="17" fill={done ? '#9fb4c9' : '#b9b2a8'} />
      <path d="M14 96c2-20 16-31 34-31s32 11 34 31z" fill={done ? '#9fb4c9' : '#b9b2a8'} />
    </svg>
  );
}

function Board({ P, s, done }) {
  const open = done ? MAX : s.open;
  const misses = s.misses || [];
  const at = (k) => open >= k;
  return (
    <div className="rs">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {!done ? <h2 className="rs-q">Whose resume is this?</h2> : null}
      <div className="rs-steps" aria-hidden="true">{Array.from({ length: MAX }, (_, k) => <i key={k} className={k < open ? 'on' : undefined} />)}</div>

      <section className="rs-card" aria-label="Profile">
        <div className="rs-ban"><div className="rs-av"><Silhouette done={done} /></div></div>
        <div className="rs-top">
          <div className="rs-name">{done ? P.name : <><span className="rs-hide" aria-hidden="true" /><span style={{ fontSize: 13, fontWeight: 800, color: '#666' }}>Name hidden</span></>}</div>
          {at(6) ? (
            <>
              <div className="rs-head">{P.headline}</div>
              {P.location ? <div className="rs-loc">{P.location}</div> : null}
            </>
          ) : (
            <div className="rs-head" style={{ color: '#666' }}><svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" style={{ verticalAlign: '-1px', marginRight: 5 }}><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" /></svg>Headline and location open with clue 6</div>
          )}
          <div className="rs-meta"><span>{`Resume No. ${P.num}${P.sunday ? ' · Sunday Edition' : ''}`}</span></div>
        </div>
      </section>

      <section className="rs-card rs-pad" aria-label="Experience">
        <h3 className="rs-h">Experience</h3>
        <div className="rs-sub" style={{ marginTop: 0 }}>Later career</div>
        {at(6) ? <ul className="rs-list">{[...P.later].reverse().map((j, i) => <Job key={i} j={j} />)}</ul> : <Locked n={6} rows={2} label="Later career" />}
        <div className="rs-sub">Early career</div>
        {at(2) ? <ul className="rs-list">{[...P.early].reverse().map((j, i) => <Job key={i} j={j} showOrg={at(4)} />)}</ul> : <Locked n={2} rows={Math.min(3, P.early.length)} label="Early career" />}
      </section>

      <section className="rs-card rs-pad" aria-label="Education">
        <h3 className="rs-h">Education</h3>
        <ul className="rs-list">
          {P.edu.map((e, i) => (
            <li key={i} className="rs-item">
              {at(3) ? <Logo name={e.school} school /> : <span className="rs-logo rs-ghost" aria-hidden="true" />}
              <span className="rs-it">{at(3) ? <b>{e.school}</b> : <Redacted n={3} w={Math.min(230, 70 + e.school.length * 3)} />}<span>{e.degree}</span><small>{e.years}</small></span>
            </li>
          ))}
        </ul>
      </section>


      <section className="rs-card rs-pad" aria-label="Skills">
        <h3 className="rs-h">Skills</h3>
        {at(5) ? <div className="rs-pills">{P.skills.map((k) => <span key={k} className="rs-pill">{k}</span>)}</div> : <Locked n={5} rows={1} label="Skills" />}
      </section>
      <section className="rs-card rs-pad" aria-label="Fun facts">
        <h3 className="rs-h">Fun facts</h3>
        {at(5) ? <ul className="rs-facts">{P.facts.map((f, i) => <li key={i}>{f}</li>)}</ul> : <Locked n={5} rows={2} label="Fun facts" />}
      </section>

      {misses.length ? (
        <div className="rs-miss"><span>Misses</span>{misses.map((t) => <s key={t}>{t}</s>)}</div>
      ) : null}
    </div>
  );
}

function Tools({ P, s, setS, active }) {
  const [q, setQ] = useState('');
  const extra = useMemo(() => new Map([[P.name, (P.alt || []).map(fold)]]), [P]);
  const skip = useMemo(() => new Set(s.misses || []), [s.misses]);
  const opts = useMemo(() => (active ? matches(q, skip, extra) : []), [q, skip, extra, active]);
  if (!active) return null;
  const guess = (n) => {
    if (!n) return;
    setQ('');
    setS((st) => {
      if ((st.misses || []).includes(n)) return st;
      if (n === P.name) return { ...st, hit: n };
      const misses = [...(st.misses || []), n];
      if (st.open >= MAX) return { ...st, misses, out: true };
      return { ...st, misses, open: st.open + 1 };
    });
  };
  const noMatch = fold(q).length >= 2 && !opts.length;
  return (
    <div className="rs-tools">
      {opts.length ? (
        <div className="pst-sug" role="listbox" aria-label="Matching people">
          {opts.map((o, i) => (
            <button key={o.n} type="button" role="option" aria-selected={i === 0} className={i === 0 ? 'on' : undefined} onClick={() => guess(o.n)}>
              <span>{o.n}</span>
            </button>
          ))}
        </div>
      ) : noMatch ? (
        <div className="pst-sug" aria-live="polite"><div className="none">Nobody on the list matches that. It has cost you nothing.</div></div>
      ) : null}
      <div className="pst-in">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (opts.length) guess(opts[0].n); } }}
          placeholder="Type a name" aria-label="Guess a person" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
        <button type="button" className="pst-go" disabled={!opts.length} onClick={() => { if (opts.length) guess(opts[0].n); }}>Guess</button>
      </div>
      {s.open < MAX ? (
        <button type="button" className="pst-tb wide" onClick={() => setS((st) => ({ ...st, open: Math.min(MAX, st.open + 1) }))}>Open clue {s.open + 1}: {LABELS[s.open]}</button>
      ) : (
        <div className="pst-note">Every clue is open. One more miss ends the day.</div>
      )}
    </div>
  );
}

const plural = (n) => `${n} clue${n === 1 ? '' : 's'}`;

const GAME = {
  key: 'resume', name: 'Resume', cat: 'Trivia', miss: 'clues',
  runDoor: 'duediligence',
  fresh: () => ({ open: 1, misses: [], hit: null, out: false }),
  validSave: (P, s) => typeof s.open === 'number' && Array.isArray(s.misses),
  touched: (s) => s.open > 1 || (s.misses || []).length > 0,
  solved: (P, s) => !!s.hit,
  failed: (P, s) => !!s.out,
  count: (s) => s.open,
  // Solved with c clues scores 11 - c (10 down to 5); unsolved scores 0.
  result: (P, s, won) => ({ score: won ? 11 - s.open : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.open }),
  Board,
  tools: (props) => <Tools {...props} />,
  eyebrow: (P, s, { sundayLabel }) => `No. ${P.num}${sundayLabel ? ` · ${sundayLabel}` : ''} · Clue ${s.open} of ${MAX}`,
  foot: (P, s) => `${plural(s.open)} open · ${(s.misses || []).length} ${(s.misses || []).length === 1 ? 'miss' : 'misses'}`,
  frac: (P, s) => s.open / MAX,
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => (P.sunday ? 'Sunday Edition: a deeper cut' : "Today's resume"),
  gateLine: () => 'A famous career profile with every name blacked out. The degrees are free; every extra clue or wrong guess fills in more. Name them in the fewest clues.',
  rules: () => ({
    lead: 'A career profile with the name and photo taken off. Whose is it?',
    steps: [
      <>Every day is one famous person: a business leader, a star, a public figure. Their profile shows <b>where they studied, the jobs they held and a few fun facts</b>, oldest jobs at the bottom like any resume.</>,
      <>You start with <b>one clue</b>: their degrees and years, with the school names blacked out. Open more whenever you like: early job titles, the school names, the early employers, skills and fun facts, and last, their later career, headline and where they live.</>,
      <>Type a name and pick it from the list. A <b>wrong guess opens the next clue</b> for you. With all six open, one more miss ends the day.</>,
    ],
    knack: 'Read the shape before the names. Degree years tell you the era, and a physics degree followed by a startup points somewhere very different from a law degree followed by a clerkship.',
    footer: 'A solve ranks on clues used, then on the clock. The Sunday Edition is a deeper cut: a chief executive whose company you know better than their face.',
  }),
  pitch: () => 'Name the famous person from their career profile.',
  shareLine: (P, s, won, el) => `Resume #${P.num}${P.sunday ? ' · Sunday' : ''} · ${won ? `${plural(s.open)} · ${el}` : 'not solved'}\n${Array.from({ length: MAX }, (_, k) => (k < s.open ? '\u{1F7E6}' : '⬜')).join('')}`,
  detail: (P, s, won, el) => `${P.name} · ${plural(won ? s.open : MAX)} · ${el}`,
  aboutTitle: 'About Resume',
  about: [
    'Resume is a free daily guess-who game from Mind Loft. Every day it shows one famous person’s career profile, laid out like a professional networking page, with the name and photo hidden: the colleges they went to, the jobs they held from the first one up, their skills and a few fun facts. You name the person.',
    'You start with their degrees, every school and employer blacked out. Five more clues fill the profile in one at a time when you ask, or when you guess wrong: early job titles, school names, early employers, skills and fun facts, and finally their later career, headline and location. Fewer clues rank higher and the clock breaks a tie. Weekdays mix business leaders and household names; the Sunday Edition is a deeper cut.',
    <>More daily guessing: try <a href="/tape" style={{ color: 'inherit', fontWeight: 800 }}>Tape</a>, <a href="/dossier" style={{ color: 'inherit', fontWeight: 800 }}>Dossier</a> and <a href="/quotes" style={{ color: 'inherit', fontWeight: 800 }}>Quotes</a>.</>,
  ],
};

export default function ResumeClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
