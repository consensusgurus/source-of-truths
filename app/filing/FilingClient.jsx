'use client';

// Filing: name the company from its IPO filing (owner, 2026-11-10: the third
// puzzle beside Tape and Resume in the Due Diligence run, "use style from
// existing EDGAR filings"). The board is the company's Form S-1 drawn like the
// EDGAR document: the SEC cover page with the registrant's name blacked out,
// then six sections that unseal one at a time (see ORDER). A wrong guess
// opens the next clue, and a wrong guess with all six open ends the day.
// Fewer clues rank higher, then the clock. Scored like Tape and Resume.
// Runs on the shared stage shell (app/SimpleDaily.jsx); the guess list is
// Tape's (every Russell 3000 company).
//
// The filing is printed in Times, as EDGAR prints it; everything around it is
// the site's one face, Manrope (owner, 2026-10-08).

import React, { useMemo, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { makeList, readGuess } from '@/lib/company-guess';
import { UNIVERSE } from '../tape/universe';

const MAX = 6;
// Owner, 2026-11-10: no employee or location counts ("do very little"), no
// offering mechanics, and the founders' letter last, a less quotable line,
// with the famous one kept for the ending.
const LABEL = { risk: 'Risk factors', cover: 'Cover page', comp: 'Competition', c4: 'Key metrics', biz: 'Our business', words: 'In their own words' };
const SECTION = { risk: 'Risk Factors', cover: 'Cover Page: Industry and Date', comp: 'Competition', c4: 'Key Business Metrics', biz: 'Our Business', words: 'In Their Own Words' };
// CLUE ORDER (owner, 2026-11-10, after Airbnb's "Home sharing may not achieve
// global acceptance" gave the day away as the free clue): the cover page is
// always first; the rest is ordered per day in the bank (P.order, owner same
// night: "maybe every day the order is different other than the cover page
// being first"). Date-gated so the board already live under the old order
// (11-10) keeps it.
const ORDER_FROM = '2026-11-11';
const ORDER_OLD = ['risk', 'cover', 'comp', 'c4', 'biz', 'words'];
const ORDER = ['cover', 'comp', 'risk', 'c4', 'biz', 'words'];
const orderOf = (P) => (P && P.live && P.live < ORDER_FROM ? ORDER_OLD : (P && Array.isArray(P.order) && P.order.length === 6 ? P.order : ORDER));

function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim(); }
const GUESS_LIST = makeList(UNIVERSE);
const BY_T = new Map(UNIVERSE.map(([t, n]) => [t, n]));


// [[...]] in a quote is blacked out until the day ends, then shown on a pale
// blue mark so the player sees what was hidden.
function Quote({ text, done }) {
  const parts = String(text || '').split(/(\[\[[^\]]+\]\])/g);
  return parts.map((p, i) => {
    const m = /^\[\[([^\]]+)\]\]$/.exec(p);
    if (!m) return <React.Fragment key={i}>{p}</React.Fragment>;
    return done
      ? <mark key={i} className="fl-was">{m[1]}</mark>
      : <span key={i} className="fl-rx" style={{ width: `${Math.max(3, m[1].length) * 0.62}em` }} aria-label="blacked out" />;
  });
}

function Sealed({ id, n }) {
  return (
    <div className="fl-seal" aria-label={`${SECTION[id]}: opens with clue ${n}`}>
      <span>{SECTION[id]}</span>
      <em>Sealed · clue {n}</em>
    </div>
  );
}

const CSS = `
.fl{display:flex;flex-direction:column;gap:10px;width:100%;font-family:'Manrope',system-ui,sans-serif;}
.fl-q{margin:0;text-align:center;font-size:clamp(20px,5.8vw,24px);font-weight:800;letter-spacing:-.02em;color:var(--pst-ink,#0b0f1a);}
.fl-steps{display:flex;gap:4px;}
.fl-steps i{flex:1;height:5px;border-radius:3px;background:var(--pst-cell,#e6eaef);}
.fl-steps i.on{background:#1f4e8c;}
.fl-doc{background:#fff;color:#000;border:1px solid #c9c9c9;padding:20px 18px 16px;display:flex;flex-direction:column;gap:16px;font-family:'Times New Roman',Times,serif;font-size:14px;line-height:1.48;}
.fl-cv{text-align:center;display:flex;flex-direction:column;gap:3px;}
.fl-cv .sm{font-size:11.5px;}
.fl-cv .rule{border-top:1px solid #000;width:64px;margin:6px auto;}
.fl-cv .sec{font-weight:bold;font-size:14px;line-height:1.35;}
.fl-cv .form{font-weight:bold;font-size:21px;letter-spacing:.02em;line-height:1.2;}
.fl-cv .reg{font-weight:bold;font-size:12.5px;line-height:1.35;}
.fl-name{margin-top:8px;min-height:28px;display:flex;justify-content:center;align-items:center;font-weight:bold;font-size:18px;line-height:1.3;}
.fl-tb{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;text-align:center;}
.fl-tb td{padding:3px 4px;vertical-align:bottom;}
.fl-tb .lab td{border-top:1px solid #000;font-size:10.5px;line-height:1.3;padding-top:4px;}
.fl-hr{border-top:1px solid #000;}
.fl-cl{font-family:'Manrope',system-ui,sans-serif;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#4a4f57;line-height:1.5;}
.fl-it{font-weight:bold;margin:0 0 6px;text-transform:uppercase;font-size:13px;letter-spacing:.02em;}
.fl-p{margin:0 0 6px;}
.fl-risk{margin:0;font-weight:bold;font-style:italic;}
.fl-ul{margin:0;padding:0 0 0 18px;display:flex;flex-direction:column;gap:3px;}
.fl-rx{display:inline-block;background:#111;height:1em;vertical-align:-0.16em;}
.fl-was{background:#dbe7f5;color:#000;padding:0 2px;}
.fl-hl{background:#fff1a8;}
.fl-src{font-family:'Manrope',system-ui,sans-serif;font-size:11.5px;font-weight:700;color:#4a4f57;margin:0 0 4px;}
.fl-seal{display:flex;justify-content:space-between;align-items:baseline;gap:10px;color:#7a7f87;border-top:1px solid #e2e2e2;padding-top:9px;font-weight:bold;}
.fl-seal em{font-family:'Manrope',system-ui,sans-serif;font-style:normal;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;}
.fl-miss{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:13px;font-weight:800;color:var(--pst-ink,#0b0f1a);}
.fl-miss s{border:1px solid var(--pst-ink,#0b0f1a);border-radius:999px;padding:4px 10px;font-weight:700;}
.fl-end{font-family:'Manrope',system-ui,sans-serif;font-size:13px;font-weight:700;color:#33373d;text-align:center;line-height:1.5;}
.fl-end a{color:#1f4e8c;font-weight:800;}
.fl-tools{display:flex;flex-direction:column;gap:8px;}
.fl-tools .pst-sug{border-radius:0;}
`;

function Board({ P, s, done }) {
  const open = done ? MAX : s.open;
  const at = (k) => open >= k;
  const order = orderOf(P);
  const coverAt = order.indexOf('cover') + 1;
  const misses = s.misses || [];
  return (
    <div className="fl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {!done ? <h2 className="fl-q">Which company filed this?</h2> : null}
      <div className="fl-steps" aria-hidden="true">{Array.from({ length: MAX }, (_, k) => <i key={k} className={k < open ? 'on' : undefined} />)}</div>
      <article className="fl-doc" aria-label="Form S-1">
        <section className="fl-cv">
          <div className="sm" style={{ textAlign: 'left' }}>As filed with the Securities and Exchange Commission on {at(coverAt) ? P.filed : <span className="fl-rx" style={{ width: '9em' }} aria-label={`hidden until clue ${coverAt}`} />}</div>
          <div className="rule" style={{ width: '100%' }} />
          <div className="sec">UNITED STATES<br />SECURITIES AND EXCHANGE COMMISSION</div>
          <div>Washington, D.C. 20549</div>
          <div className="rule" />
          <div className="form">FORM S-1</div>
          <div className="reg">REGISTRATION STATEMENT<br />UNDER<br />THE SECURITIES ACT OF 1933</div>
          <div className="rule" />
          <div className="fl-name">{done ? <mark className="fl-was">{P.name}</mark> : <span className="fl-rx" style={{ width: '11em', height: '1.2em' }} aria-label="name blacked out" />}</div>
          <div className="sm">(Exact name of registrant as specified in its charter)</div>
          <table className="fl-tb">
            <tbody>
              <tr>
                <td style={{ width: '33%', fontWeight: 'bold' }}>{P.state || 'Delaware'}</td>
                <td style={{ width: '34%', fontWeight: 'bold' }}>{at(coverAt) ? P.sic : <span className="fl-rx" style={{ width: '3em' }} />}</td>
                <td style={{ width: '33%' }}><span className="fl-rx" style={{ width: '6em' }} /></td>
              </tr>
              <tr className="lab">
                <td>(State or other jurisdiction of incorporation)</td>
                <td>(Primary Standard Industrial Classification Code Number)</td>
                <td>(I.R.S. Employer Identification No.)</td>
              </tr>
            </tbody>
          </table>
        </section>
        <div className="fl-hr" />

        {order.map((id, i) => {
          const n = i + 1;
          if (!at(n)) return <Sealed key={id} id={id} n={n} />;
          const cl = <div className="fl-cl">Clue {n} · {LABEL[id]}</div>;
          if (id === 'risk') return (
            <section key={id}>{cl}
              <p className="fl-it">Risk Factors</p>
              <p className="fl-risk"><Quote text={P.risk} done={done} /></p>
            </section>
          );
          if (id === 'cover') return (
            <section key={id}>{cl}
              <p className="fl-p"><b>SIC {P.sic}:</b> {P.sicName}</p>
              <p className="fl-p" style={{ margin: 0 }}><b>Filed:</b> {P.filed}</p>
            </section>
          );
          if (id === 'comp') return (
            <section key={id}>{cl}
              <p className="fl-it">Competition</p>
              <p className="fl-p" style={{ margin: 0 }}><Quote text={P.comp} done={done} /></p>
            </section>
          );
          if (id === 'c4') return (
            <section key={id}>{cl}
              <p className="fl-it">{P.c4.title}</p>
              <ul className="fl-ul">{P.c4.items.map((x, j) => <li key={j}><Quote text={x} done={done} /></li>)}</ul>
            </section>
          );
          if (id === 'biz') return (
            <section key={id}>{cl}
              <p className="fl-it">Prospectus Summary</p>
              {P.biz.map((x, j) => <p key={j} className="fl-p"><Quote text={x} done={done} /></p>)}
            </section>
          );
          return (
            <section key={id}>{cl}
              <p className="fl-src">From the {P.words.src}</p>
              <p className="fl-p" style={{ margin: 0 }}><span className="fl-hl"><Quote text={P.words.text} done={done} /></span></p>
            </section>
          );
        })}

        {done ? (
          <div className="fl-end">
            <p style={{ margin: '0 0 6px' }}>&ldquo;{P.famous}&rdquo;</p>
            <span>{P.name} ({P.ticker}) · S-1 filed {P.filed} · <a href={P.src} target="_blank" rel="noopener noreferrer">Read the filing on EDGAR</a></span>
          </div>
        ) : null}
      </article>
      {misses.length ? (
        <div className="fl-miss"><span>Misses</span>{misses.map((t) => <s key={t}>{BY_T.get(t) || t} ({t})</s>)}</div>
      ) : null}
    </div>
  );
}

function Tools({ P, s, setS, active }) {
  const [q, setQ] = useState('');
  const [note, setNote] = useState(null);
  const extra = useMemo(() => new Map([[P.ticker, (P.alt || [])]]), [P]);
  const skip = useMemo(() => new Set(s.misses || []), [s.misses]);
  if (!active) return null;
  // NO SUGGESTION LIST (owner, 2026-11-10): the typed name or ticker is read
  // as one company on Guess (lib/company-guess.js), exact first, then close.
  const submit = () => {
    const raw = q.trim();
    if (!raw) return;
    const r = readGuess(raw, GUESS_LIST, extra, null);
    if (!r) { setNote({ k: 'none', t: 'No Russell 3000 company matches that. It has cost you nothing.' }); return; }
    const t = r.it.t;
    if (skip.has(t)) { setNote({ k: 'none', t: `You already tried ${r.it.n} (${t}). It has cost you nothing.` }); return; }
    setQ('');
    setNote(r.how === 'close' ? { k: 'read', t: `Read \u201c${raw}\u201d as ${r.it.n} (${t}).` } : null);
    setS((st) => {
      if ((st.misses || []).includes(t)) return st;
      if ((P.accept || [P.ticker]).includes(t)) return { ...st, hit: t };
      const misses = [...(st.misses || []), t];
      if (st.open >= MAX) return { ...st, misses, out: true };
      return { ...st, misses, open: st.open + 1 };
    });
  };
  return (
    <div className="fl-tools">
      {note ? <div className="pst-sug" aria-live="polite"><div className="none">{note.t}</div></div> : null}
      <div className="pst-in">
        <input type="text" value={q} onChange={(e) => { setQ(e.target.value); if (note) setNote(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          placeholder="Company name or ticker" aria-label="Guess a company by name or ticker" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
        <button type="button" className="pst-go" disabled={!q.trim()} onClick={submit}>Guess</button>
      </div>
      {s.open < MAX ? (
        <button type="button" className="pst-tb wide" onClick={() => setS((st) => ({ ...st, open: Math.min(MAX, st.open + 1) }))}>Unseal clue {s.open + 1}: {LABEL[orderOf(P)[s.open]]}</button>
      ) : (
        <div className="pst-note">Every section is open. One more miss ends the day.</div>
      )}
    </div>
  );
}

const plural = (n) => `${n} clue${n === 1 ? '' : 's'}`;

const GAME = {
  key: 'filing', name: 'Filing', cat: 'Trivia', miss: 'clues',
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
  eyebrow: (P, s) => `No. ${P.num} · Clue ${s.open} of ${MAX}`,
  foot: (P, s) => `${plural(s.open)} open · ${(s.misses || []).length} ${(s.misses || []).length === 1 ? 'miss' : 'misses'} · any Russell 3000 company`,
  frac: (P, s) => s.open / MAX,
  gateTitle: () => "Today's filing",
  gateLine: (P) => `A company’s IPO filing, its Form S-1, with the name blacked out. ${orderOf(P)[0] === 'risk' ? 'The first risk factor is free' : 'The cover page, its industry and filing date, is free'}; every extra clue or wrong guess unseals the next section. Name the company in the fewest clues.`,
  rules: (P) => ({
    lead: 'An IPO filing with the company’s name blacked out. Who filed it?',
    steps: [
      <>Every day is one public company&rsquo;s <b>Form S-1</b>, the registration statement it filed with the SEC to go public, laid out the way EDGAR prints it. Every quote is the filing&rsquo;s own words. The answer is in the <b>Russell 3000</b>, and you can guess any of them by name or ticker.</>,
      orderOf(P)[0] === 'risk'
        ? <>You start with <b>one clue</b>, a risk factor. Unseal more whenever you like: the cover page (its industry code and the date it filed), the competition section, its key business metrics, the business overview with the names blacked out, and last, a line in the company&rsquo;s own words.</>
        : <>You start with <b>one clue</b>, the cover page: its industry code and the date it filed. Unseal more whenever you like, in an order that changes day to day: the competition section, a risk factor, its key business metrics, the business overview with the names blacked out, and a line in the company&rsquo;s own words.</>,
      <>A <b>wrong guess unseals the next section</b> for you. With all six open, one more miss ends the day.</>,
    ],
    knack: 'Read it like an analyst. An industry code and a filing year, a competitor list, a risk only some businesses carry, a metric only one would count: each one narrows the field before the name ever shows.',
    footer: 'A solve ranks on clues used, then on the clock.',
  }),
  pitch: () => 'Name the company from its IPO filing.',
  shareLine: (P, s, won, el) => `Filing #${P.num} · ${won ? `${plural(s.open)} · ${el}` : 'not solved'}\n${Array.from({ length: MAX }, (_, k) => (k < s.open ? '\u{1F7E6}' : '⬜')).join('')}`,
  detail: (P, s, won, el) => `${P.name} (${P.ticker}) · ${plural(won ? s.open : MAX)} · ${el}`,
  aboutTitle: 'About Filing',
  about: [
    'Filing is a free daily business guessing game from Mind Loft. Every day it shows one company’s Form S-1, the registration statement a company files with the SEC before its initial public offering, laid out like the EDGAR document, with the company’s name blacked out. You name the company. Any stock in the Russell 3000 is a fair guess, by name or by ticker.',
    'You start with the cover page: the industry code and the date the company filed. Five more sections unseal one at a time when you ask, or when you guess wrong, in an order that changes day to day: the competition section, a risk factor quoted word for word, the key business metrics, the business overview with its names blacked out, and a line in the company’s own words. Fewer clues rank higher and the clock breaks a tie. Type a company name or ticker to guess; close spellings count.',
    <>Filing is the middle leg of the <a href="/duediligence" style={{ color: 'inherit', fontWeight: 800 }}>Due Diligence</a> run, after <a href="/tape" style={{ color: 'inherit', fontWeight: 800 }}>Tape</a> and before <a href="/resume" style={{ color: 'inherit', fontWeight: 800 }}>Resume</a>.</>,
  ],
};

export default function FilingClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
