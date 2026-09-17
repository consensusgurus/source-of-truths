'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import QuizNavHeader from '../QuizNavHeader';
import Grain from '../../Grain';
import Footer from '../../Footer';
import { QUIZZES } from '@/lib/quizzes';
import { COMPANY_META } from '@/lib/company-quiz-meta';
import { SECTOR_META, BN_NEWS_RE as NEWS_RE, BN_EARN_RE as EARN_RE } from '@/lib/business-news-hub';
import { T } from '@/lib/theme';

// ─── palette / type (matches the Quizzes home) ──────────────────────────────
const C = {
  bg: T.white, surface: T.white, ink: T.ink, muted: T.muted, soft: T.muted,
  line: 'rgba(20,22,28,0.30)', accent: T.accent, accsoft: '#e8effb', live: T.success,
};
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

// COMPANY_META (favicon + ticker registry) is shared with the share-image
// routes; see lib/company-quiz-meta.js.

// Thematic (sector) quizzes shown in the right-hand column. Add a sector here
// and the row button appears automatically when its quiz exists in QUIZZES.

const NEWS_MAX = 6;     // sized so the column matches three thematic buttons
const CO_MAX = 24;
const SECTOR_SLOTS = 3; // reserve three sector rows; fill spare slots with "coming soon"

function tsOf(q) {
  return Date.parse(q.publishedAt || (q.publishedDate ? `${q.publishedDate}T12:00:00Z` : 0)) || 0;
}
function shortDate(q) {
  const t = tsOf(q);
  if (!t) return '';
  try { return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}
function qCount(q) {
  if (Array.isArray(q.questions)) return q.questions.length;
  if (Array.isArray(q.answers)) return q.answers.length;
  if (Array.isArray(q.pairs)) return q.pairs.length;
  return 0;
}
function companyName(q) {
  const m = COMPANY_META[q.id];
  if (m) return m.name;
  return (q.title || '').replace(/\s+\d?[QH].*$/i, '').replace(/\s+Earnings.*$/i, '').trim() || q.title;
}
function newsLabel(q) {
  const m = q.id.match(/(\d{4})-(\d{2})-(\d{2})$/);
  const date = m ? `${+m[2]}/${+m[3]}/${m[1].slice(2)}` : '';
  let type = 'Daily Market News';
  if (/^earnings-reporter/.test(q.id)) type = 'Earnings Reporter';
  else if (/^weekly-business/.test(q.id)) type = 'Weekly Business';
  return date ? `${type} ${date}` : (q.title || '');
}

function Favicon({ domain, label }) {
  const [bad, setBad] = useState(false);
  if (bad || !domain) {
    return <span style={{ fontSize: 15, fontWeight: 800, color: C.muted }}>{(label || '?').slice(0, 1)}</span>;
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      width={26}
      height={26}
      style={{ display: 'block' }}
      onError={() => setBad(true)}
    />
  );
}

export default function BusinessNewsClient() {
  const [newsExpanded, setNewsExpanded] = useState(false);
  const [coExpanded, setCoExpanded] = useState(false);
  const [coSearch, setCoSearch] = useState('');

  const newsAll = useMemo(() => QUIZZES
    .filter((q) => !q.unlisted && NEWS_RE.test(q.id) && !/mobile-preview/.test(q.id))
    .sort((a, b) => tsOf(b) - tsOf(a)), []);

  const sectorAll = useMemo(() => QUIZZES
    .filter((q) => !q.unlisted && SECTOR_META[q.id])
    .map((q) => ({ q, meta: SECTOR_META[q.id] }))
    .sort((a, b) => tsOf(b.q) - tsOf(a.q)), []);

  const coAll = useMemo(() => QUIZZES
    .filter((q) => !q.unlisted && (COMPANY_META[q.id] || EARN_RE.test(q.id)) && !/mobile-preview/.test(q.id))
    .map((q) => ({ q, meta: COMPANY_META[q.id] || null, name: companyName(q) }))
    .sort((a, b) => tsOf(b.q) - tsOf(a.q)), []);

  const coFiltered = useMemo(() => {
    const s = coSearch.trim().toLowerCase();
    if (!s) return coAll;
    return coAll.filter(({ q, meta, name }) =>
      name.toLowerCase().includes(s)
      || (meta && meta.ticker.toLowerCase().includes(s))
      || (q.title || '').toLowerCase().includes(s));
  }, [coAll, coSearch]);

  const newsShown = newsExpanded ? newsAll : newsAll.slice(0, NEWS_MAX);
  const coShown = coExpanded ? coFiltered : coFiltered.slice(0, CO_MAX);
  const sectorSoon = Math.max(0, SECTOR_SLOTS - sectorAll.length);

  const css = `
    .bnh *{box-sizing:border-box;}
    .bnh a{text-decoration:none;color:inherit;}
    .bnh .eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.accent};}
    .bnh h1{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:6px 0 8px;color:${C.ink};}
    .bnh .bn-lede{font-size:15px;color:${C.muted};font-weight:500;line-height:1.5;max-width:680px;margin:0 0 6px;}
    .bnh .toprow{display:grid;grid-template-columns:1.25fr 1fr;gap:34px;align-items:start;}
    @media(max-width:820px){.bnh .toprow{grid-template-columns:1fr;gap:8px;}}
    .bnh .secthead{display:flex;align-items:center;gap:10px;margin:30px 0 12px;}
    .bnh .secthead h2{font-size:18px;font-weight:800;margin:0;letter-spacing:-.01em;color:${C.ink};}
    .bnh .cpill{font-size:11px;font-weight:700;color:${C.muted};background:#eef0f3;border-radius:20px;padding:3px 10px;}
    .bnh .rule{flex:1;height:1px;background:${C.line};}
    .bnh .qlist{display:flex;flex-direction:column;}
    .bnh .qrow{display:flex;align-items:baseline;gap:10px;padding:9px 0;border-bottom:1px solid rgba(20,22,28,0.07);}
    .bnh .qrow .dot{width:8px;height:8px;border-radius:50%;flex:none;align-self:center;background:${C.accent};}
    .bnh .qrow .qtitle{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;color:${C.ink};}
    .bnh .qrow:hover .qtitle{color:${C.accent};}
    .bnh .qrow .qmeta{flex:none;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.soft};}
    .bnh .qrow .qmeta.is-new{color:${C.live};}
    .bnh .sectors{display:flex;flex-direction:column;gap:10px;}
    .bnh .sbtn{display:flex;align-items:center;gap:13px;background:${C.surface};border:1px solid ${C.line};border-radius:13px;padding:13px 15px;min-height:66px;transition:border-color .15s,box-shadow .15s;}
    .bnh a.sbtn:hover{border-color:var(--accent-border);box-shadow:0 1px 0 #eef2f8,0 6px 18px rgba(20,40,80,.06);}
    .bnh .sfav{width:42px;height:42px;border-radius:11px;flex:none;background:#f3f5f8;border:1px solid ${C.line};display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;}
    .bnh .sbody{flex:1;min-width:0;display:flex;flex-direction:column;}
    .bnh .sname{font-size:14px;font-weight:800;color:${C.ink};}
    .bnh .ssub{font-size:12px;font-weight:600;color:${C.soft};margin-top:2px;}
    .bnh .sname,.bnh .ssub{display:block;}
    .bnh .sdate{flex:none;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.soft};margin-right:2px;}
    .bnh .smeta{font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.soft};margin-top:3px;}
    .bnh .splay{flex:none;width:34px;height:34px;border-radius:50%;background:${C.accent};color:var(--white);display:flex;align-items:center;justify-content:center;font-size:13px;}
    .bnh .sbtn-soon{border-style:dashed;background:transparent;}
    .bnh .sbtn-soon .sfav{background:transparent;border-style:dashed;color:${C.soft};}
    .bnh .sbtn-soon .sname{color:${C.soft};}
    .bnh .cosearch{margin:0 0 14px;position:relative;max-width:340px;}
    .bnh .cosearch input{width:100%;padding:9px 12px;border:1px solid ${C.line};border-radius:10px;font-family:${FONT};font-size:13.5px;background:var(--white);color:${C.ink};outline:none;}
    .bnh .cosearch input:focus{border-color:var(--accent-border);box-shadow:0 0 0 3px ${C.accsoft};}
    .bnh .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:14px;}
    .bnh .card{background:${C.surface};border:1px solid ${C.line};border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:14px;min-height:96px;transition:border-color .15s,box-shadow .15s;}
    .bnh .card:hover{border-color:var(--accent-border);box-shadow:0 1px 0 #eef2f8,0 6px 18px rgba(20,40,80,.06);}
    .bnh .fav{width:42px;height:42px;border-radius:11px;flex:none;background:#f3f5f8;border:1px solid ${C.line};display:flex;align-items:center;justify-content:center;overflow:hidden;}
    .bnh .cbody{flex:1;min-width:0;}
    .bnh .ctop{display:flex;align-items:center;gap:8px;}
    .bnh .cname{font-size:13px;font-weight:800;color:${C.ink};}
    .bnh .tk{font-size:10px;font-weight:800;letter-spacing:.04em;color:${C.accent};background:${C.accsoft};border-radius:5px;padding:2px 6px;}
    .bnh .ctitle{font-size:13px;font-weight:600;color:${C.ink};margin-top:3px;line-height:1.32;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .bnh .cmeta{font-size:11px;font-weight:600;color:${C.soft};margin-top:5px;display:flex;align-items:center;gap:7px;}
    .bnh .play{flex:none;width:34px;height:34px;border-radius:50%;background:${C.accent};color:var(--white);display:flex;align-items:center;justify-content:center;font-size:13px;}
    .bnh .moreBtn{margin:14px 0 0;display:inline-flex;align-items:center;gap:6px;background:var(--white);color:${C.accent};border:1px solid var(--accent-border);padding:8px 16px;border-radius:10px;font-family:${FONT};font-weight:700;font-size:13px;cursor:pointer;}
    .bnh .moreBtn:hover{background:${C.accsoft};}
    .bnh .empty{padding:18px 2px;color:${C.soft};font-size:14px;}
  `;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', position: 'relative' }}>
      <Grain />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <QuizNavHeader />
      <div className="bnh qzf-w" style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 38px 80px', position: 'relative', fontFamily: FONT }}><div className="qzf-line" aria-hidden="true" />
        <div className="eyebrow">Business · Quiz Hub</div>
        <h1>Business News</h1>
        <p className="bn-lede">Test yourself on the day&apos;s market-moving headlines and prep for the companies reporting earnings this week. New quizzes drop every trading day.</p>

        <div className="toprow">
          <section>
            <div className="secthead">
              <h2>News Recaps</h2>
              <span className="cpill">{newsAll.length} {newsAll.length === 1 ? 'Quiz' : 'Quizzes'}</span>
              <span className="rule" />
            </div>
            <div className="qlist">
              {newsShown.map((q, i) => (
                <Link key={q.id} href={`/quiz/${q.id}`} className="qrow" title={q.title}>
                  <span className="dot" />
                  <span className="qtitle">{newsLabel(q)}</span>
                  {i === 0 && !newsExpanded ? <span className="qmeta is-new">Newest</span> : null}
                </Link>
              ))}
            </div>
            {newsAll.length > NEWS_MAX && (
              <button type="button" className="moreBtn" onClick={() => setNewsExpanded((v) => !v)}>
                {newsExpanded ? 'Show fewer' : `Show all ${newsAll.length}`}
              </button>
            )}
          </section>

          <section>
            <div className="secthead">
              <h2>Thematic Updates</h2>
              <span className="cpill">{sectorAll.length} {sectorAll.length === 1 ? 'Sector' : 'Sectors'}</span>
              <span className="rule" />
            </div>
            <div className="sectors">
              {sectorAll.map(({ q, meta }) => (
                <Link key={q.id} href={`/quiz/${q.id}`} className="sbtn" title={q.title}>
                  <span className="sfav" aria-hidden="true">{meta.emoji}</span>
                  <span className="sbody">
                    <span className="sname">{meta.name}</span>
                    <span className="ssub">{meta.sub}</span>
                  </span>
                  {meta.date ? <span className="sdate">{meta.date}</span> : null}
                  <span className="splay" aria-hidden="true">▶</span>
                </Link>
              ))}
              {Array.from({ length: sectorSoon }).map((_, i) => (
                <span key={`soon-${i}`} className="sbtn sbtn-soon">
                  <span className="sfav" aria-hidden="true">+</span>
                  <span className="sbody">
                    <span className="sname">More sectors</span>
                    <span className="ssub">Coming soon</span>
                  </span>
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="secthead">
          <h2>Company Earnings</h2>
          <span className="cpill">{coAll.length} {coAll.length === 1 ? 'Company' : 'Companies'}</span>
          <span className="rule" />
        </div>
        <div className="cosearch">
          <input
            value={coSearch}
            onChange={(e) => { setCoSearch(e.target.value); setCoExpanded(true); }}
            placeholder="Search by company or ticker…"
            aria-label="Search company earnings quizzes"
            autoComplete="off"
          />
        </div>
        {coShown.length === 0 ? (
          <div className="empty">No companies match &ldquo;{coSearch}&rdquo;.</div>
        ) : (
          <div className="cards">
            {coShown.map(({ q, meta, name }) => (
              <Link key={q.id} href={`/quiz/${q.id}`} className="card" title={q.title}>
                <span className="fav"><Favicon domain={meta && meta.domain} label={(meta && meta.ticker) || name} /></span>
                <span className="cbody">
                  <span className="ctop"><span className="cname">{name}</span>{meta && <span className="tk">{meta.ticker}</span>}</span>
                  <span className="ctitle">{q.title}</span>
                  <span className="cmeta"><span>{qCount(q)} questions</span><span>·</span><span>timed</span></span>
                </span>
                <span className="play" aria-hidden="true">▶</span>
              </Link>
            ))}
          </div>
        )}
        {coFiltered.length > CO_MAX && (
          <button type="button" className="moreBtn" onClick={() => setCoExpanded((v) => !v)}>
            {coExpanded ? 'Show fewer' : `Show all ${coFiltered.length}`}
          </button>
        )}
      </div>
      <Footer />
    </div>
  );
}
