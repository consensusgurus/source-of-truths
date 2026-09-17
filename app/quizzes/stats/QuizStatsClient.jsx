'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { QUIZZES } from '@/lib/quizzes';
import { quizDept as deptOf, DEPT_LABEL } from '@/lib/quiz-departments';
import { DAILY_DATED_RE, dailyLabel, dailyDept } from '@/lib/daily-games';
import Grain from '../../Grain';
import Footer from '../../Footer';
import Count from '../../Count';
import { T } from '@/lib/theme';

// Seconds -> compact clock: '45s' under a minute, otherwise 'M:SS'.
function fmtTime(s) {
  if (s == null || !Number.isFinite(Number(s))) return '—';
  const v = Math.round(Number(s));
  if (v < 60) return `${v}s`;
  const m = Math.floor(v / 60);
  const sec = v % 60;
  if (m < 60) return `${m}:${String(sec).padStart(2, '0')}`;
  const h = Math.floor(m / 60);
  return `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const MEDAL = ['#caa12e', '#9c968a', '#b1763f'];

const COLS = [
  { id: 'plays', label: 'Plays', num: true },
  { id: 'plays24h', label: 'Last 24h', num: true },
  { id: 'players', label: 'Players', num: true },
  { id: 'avgScorePct', label: 'Avg Score', num: true },
  { id: 'totalTime', label: 'Total Time', num: true },
];

export default function QuizStatsClient() {
  const [stats, setStats] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [sortBy, setSortBy] = useState('plays');
  const [dir, setDir] = useState('desc'); // 'desc' | 'asc'

  useEffect(() => {
    fetch('/api/quiz/stats')
      .then((r) => r.json())
      .then((d) => { if (d && Array.isArray(d.quizzes)) setStats(d.quizzes); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const metaById = useMemo(() => {
    const m = {};
    for (const q of QUIZZES) m[q.id] = { title: (q.title || '').replace(/^Name (the )?/, '') || q.id, dept: DEPT_LABEL[deptOf(q)] || 'Quiz' };
    return m;
  }, []);

  // A daily puzzle publishes a fresh dated instance ('<key>-M-D-YY') each day, and
  // those days only exist in QUIZZES up to a per-game hand-seeded cutoff. Past the
  // cutoff there is no entry, so the plain metaById lookup dropped the row entirely.
  // Fall back to the daily roster so every day keeps its own row.
  const metaFor = (id) => {
    const m = metaById[id];
    if (m) return m;
    if (!DAILY_DATED_RE.test(id || '')) return null;
    return { title: dailyLabel(id) || id, dept: DEPT_LABEL[dailyDept(id)] || 'Quiz' };
  };

  const rows = useMemo(() => {
    const withMeta = stats
      .map((s) => { const m = metaFor(s.quizId); return m ? { ...s, title: m.title, dept: m.dept } : null; })
      .filter(Boolean); // drop ids that are neither a live quiz nor a dated daily
    const sign = dir === 'asc' ? 1 : -1;
    return withMeta.sort((a, b) => {
      const av = a[sortBy] == null ? -1 : a[sortBy];
      const bv = b[sortBy] == null ? -1 : b[sortBy];
      return (av - bv) * sign || a.title.localeCompare(b.title);
    });
  }, [stats, metaById, sortBy, dir]);

  const totalPlays = useMemo(() => stats.reduce((s, q) => s + (q.plays || 0), 0), [stats]);

  const setSort = (id) => {
    if (id === sortBy) setDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortBy(id); setDir('desc'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.ink, position: 'relative', overflow: 'clip' }}>
      <Grain />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <header style={{ padding: '40px 24px 18px', maxWidth: 1100, margin: '0 auto' }}>
          <Link href="/quizzes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, color: T.slate, textDecoration: 'none', marginBottom: 22 }}>
            <ArrowLeft size={15} strokeWidth={2.5} /> All Quizzes
          </Link>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.accent, marginBottom: 10 }}>Quiz Statistics</div>
          <h1 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 600, fontSize: 'clamp(34px, 7vw, 60px)', lineHeight: 0.95, letterSpacing: '-0.015em', margin: '0 0 14px', fontVariationSettings: '"SOFT" 100', color: T.ink }}>
            The <span style={{ fontStyle: 'italic', fontWeight: 400, color: T.accent }}>Most Played</span> Quizzes
          </h1>
          <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 17, lineHeight: 1.5, color: T.slate, margin: 0, maxWidth: 640 }}>
            Every quiz ranked by how often it's been played, with the average score and the total time players have spent on it. Tap any column to re-sort, or any row to play.
          </p>
          <div style={{ borderBottom: `1px solid ${T.ink}`, marginTop: 22 }} />
          <div style={{ borderBottom: `2px solid ${T.accent}` }} />
          <div style={{ marginTop: 14, fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.slate }}>
            {rows.length} quizzes played · <Count value={totalPlays} /> total plays
          </div>
        </header>

        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 72px' }}>
          <style dangerouslySetInnerHTML={{ __html: `
            .qs-scroll{overflow-x:auto;}
            .qs-table{width:100%;border-collapse:collapse;min-width:560px;}
            .qs-table th{font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${T.slate};text-align:right;padding:0 0 10px;border-bottom:2px solid ${T.accent};white-space:nowrap;}
            .qs-th-quiz{text-align:left !important;}
            .qs-th-btn{display:inline-flex;align-items:center;gap:4px;background:transparent;border:none;cursor:pointer;font:inherit;color:inherit;letter-spacing:inherit;text-transform:inherit;padding:0;}
            .qs-th-btn.active{color:${T.accent};}
            .qs-table td{padding:13px 0;border-bottom:1px solid rgba(26,22,17,0.12);text-align:right;vertical-align:middle;}
            .qs-rank{width:34px;}
            .qs-rank span{display:inline-flex;width:26px;height:26px;border-radius:50%;align-items:center;justify-content:center;border:1.25px solid rgba(26,22,17,0.2);font-family:'DM Mono',monospace;font-size:12px;color:${T.slate};}
            .qs-quiz{text-align:left;}
            .qs-quiz a{text-decoration:none;}
            .qs-title{font-family:'Manrope',serif;font-weight:600;font-size:17px;line-height:1.15;color:${T.ink};}
            .qs-quiz a:hover .qs-title{color:${T.accent};}
            .qs-dept{font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:0.14em;text-transform:uppercase;color:${T.slate};margin-top:3px;}
            .qs-num{font-family:'Manrope',serif;font-weight:700;font-size:16px;color:${T.ink};white-space:nowrap;}
            .qs-num small{font-family:'DM Mono',monospace;font-weight:500;font-size:9.5px;letter-spacing:0.08em;text-transform:uppercase;color:${T.slate};margin-left:5px;}
            .qs-col-num{padding-left:22px !important;}
            @media(max-width:620px){.qs-title{font-size:15px;}.qs-num{font-size:14px;}.qs-num small{display:none;}}
          ` }} />
          {!loaded ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 18, color: T.slate }}>Loading the numbers...</div>
          ) : rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 18, color: T.slate }}>No quizzes have been played yet.</div>
          ) : (
            <div className="qs-scroll">
              <table className="qs-table">
                <thead>
                  <tr>
                    <th className="qs-rank" aria-label="Rank" />
                    <th className="qs-th-quiz">Quiz</th>
                    {COLS.map((c) => (
                      <th key={c.id} className="qs-col-num">
                        <button type="button" className={`qs-th-btn${sortBy === c.id ? ' active' : ''}`} onClick={() => setSort(c.id)}>
                          {c.label}
                          {sortBy === c.id && <ChevronDown size={12} strokeWidth={2.5} style={{ transform: dir === 'asc' ? 'rotate(180deg)' : 'none' }} />}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.quizId}>
                      <td className="qs-rank"><span style={i < 3 && sortBy === 'plays' && dir === 'desc' ? { background: MEDAL[i], borderColor: T.ink, color: T.ink } : undefined}>{i + 1}</span></td>
                      <td className="qs-quiz">
                        <Link href={`/quiz/${r.quizId}`}>
                          <div className="qs-title">{r.title}</div>
                          <div className="qs-dept">{r.dept}</div>
                        </Link>
                      </td>
                      <td className="qs-col-num"><span className="qs-num"><Count value={r.plays} /></span></td>
                      <td className="qs-col-num"><span className="qs-num"><Count value={r.plays24h} /></span></td>
                      <td className="qs-col-num"><span className="qs-num"><Count value={r.players} /></span></td>
                      <td className="qs-col-num"><span className="qs-num">{r.avgScorePct}%<small>{r.avgScore}/{r.avgTotal}</small></span></td>
                      <td className="qs-col-num"><span className="qs-num">{fmtTime(r.totalTime)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}
