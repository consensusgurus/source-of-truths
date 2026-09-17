'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Play, Check, CheckCheck, Crown } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import { T } from '@/lib/theme';

const MEDAL = ['#caa12e', '#9c968a', '#b1763f'];

function RankRow({ rank, name, value }) {
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 3px', borderBottom: `1px solid rgba(26,22,17,0.12)` }}>
      <span style={{ flex: 'none', width: 24, height: 24, borderRadius: '50%', background: medal || 'transparent', border: medal ? `1.5px solid ${T.ink}` : `1.5px solid rgba(26,22,17,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500, color: medal ? T.ink : T.slate }}>{rank}</span>
      <span style={{ flex: '1 1 auto', minWidth: 0, fontFamily: 'DM Mono, monospace', fontSize: 12.5, fontWeight: 500, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ flex: 'none', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 15, color: T.ink }}>{value}</span>
    </div>
  );
}

function Column({ icon: Icon, title, anon, note, rows, empty }) {
  return (
    <div>
      <div className="lb-title" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
        <Icon size={16} strokeWidth={2} aria-hidden="true" style={{ flex: 'none', marginTop: 2, color: T.accent }} />
        <h2 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 600, fontSize: 16, lineHeight: 1.1, letterSpacing: '-0.01em', margin: 0, color: T.ink }}>
          {title}
          {anon ? <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9.5, fontWeight: 500, letterSpacing: '0.04em', color: T.slate, marginLeft: 6, whiteSpace: 'nowrap' }}>({anon})</span> : null}
        </h2>
      </div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.slate, marginBottom: 10 }}>{note}</div>
      <div style={{ borderTop: `2px solid ${T.accent}` }}>
        {rows.length > 0 ? rows.map((r, i) => (
          <RankRow key={`${r.name}-${i}`} rank={i + 1} name={r.name} value={r.value} />
        )) : (
          <div style={{ padding: '20px 3px', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 13.5, color: T.slate }}>{empty}</div>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardClient() {
  const [data, setData] = useState({ totalPlays: [], completed: [], correctAnswers: [], perfectQuizzes: [], minQuizzes: 5, anonPlays: 0, anonCompleted: 0, anonPlayers: [], today: {}, dailyChampions: [] });
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('registered');
  const [period, setPeriod] = useState('all');
  const [metric, setMetric] = useState('correct');

  useEffect(() => {
    fetch('/api/quiz/champions')
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setData({ totalPlays: d.totalPlays || [], completed: d.completed || [], correctAnswers: d.correctAnswers || [], perfectQuizzes: d.perfectQuizzes || [], minQuizzes: d.minQuizzes || 5, anonPlays: d.anonPlays || 0, anonCompleted: d.anonCompleted || 0, anonPlayers: d.anonPlayers || [], today: d.today || {}, dailyChampions: d.dailyChampions || [] }); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const METRICS = [
    { id: 'plays', label: 'Plays', icon: Play, note: 'Every game, replays included' },
    { id: 'correct', label: 'Correct Answers', icon: Check, note: 'Correct answers banked' },
    { id: 'unique', label: 'Unique Quizzes', icon: Trophy, note: 'Distinct quizzes finished' },
    { id: 'perfect', label: 'Fully Completed', icon: CheckCheck, note: 'Distinct quizzes scored 100%' },
    { id: 'daily', label: 'Daily Champions', icon: Crown, note: 'Top scorer each day, ranked by correct answers' },
  ];

  const num = (n) => (Number(n) || 0).toLocaleString();
  // Source for the current period (all-time = top-level fields; today = data.today).
  const src = period === 'today' ? (data.today || {}) : data;
  const totalPlaysRows = (src.totalPlays || []).map((u) => ({ name: u.username, value: num(u.plays) }));
  const correctRows = (src.correctAnswers || []).map((u) => ({ name: u.username, value: num(u.correct) }));
  const completedRows = (src.completed || []).map((u) => ({ name: u.username, value: num(u.quizzes) }));
  const perfectRows = (src.perfectQuizzes || []).map((u) => ({ name: u.username, value: num(u.perfect) }));

  // Anonymous players: same four metrics, ranked, shown under their random number.
  const apl = src.anonPlayers || [];
  const anonTop = (key) => apl.filter((p) => (p[key] || 0) > 0).sort((a, b) => (b[key] || 0) - (a[key] || 0) || (a.num - b.num)).slice(0, 50).map((p) => ({ name: p.label, value: num(p[key]) }));
  const anonPlaysRows = anonTop('plays');
  const anonCorrectRows = anonTop('correct');
  const anonQuizzesRows = anonTop('quizzes');
  const anonPerfectRows = anonTop('perfect');

  // Combined view: registered + anonymous players merged into one ranking per
  // metric, sorted by value desc, top 50.
  const combine = (regField, regKey, anonKey) => {
    const reg = (src[regField] || []).map((u) => ({ name: u.username, v: Number(u[regKey]) || 0 }));
    const an = apl.filter((p) => (p[anonKey] || 0) > 0).map((p) => ({ name: p.label, v: Number(p[anonKey]) || 0 }));
    return [...reg, ...an]
      .sort((a, b) => b.v - a.v || (a.name || '').localeCompare(b.name || ''))
      .slice(0, 50)
      .map((x) => ({ name: x.name, value: num(x.v) }));
  };
  const combPlaysRows = combine('totalPlays', 'plays', 'plays');
  const combCorrectRows = combine('correctAnswers', 'correct', 'correct');
  const combQuizzesRows = combine('completed', 'quizzes', 'quizzes');
  const combPerfectRows = combine('perfectQuizzes', 'perfect', 'perfect');

  // Metric-specific anonymous totals, shown as a parenthetical in each column title.
  const anonPlaysStr = `${num(period === 'today' ? apl.reduce((s, p) => s + (p.plays || 0), 0) : data.anonPlays)} anonymous`;
  const anonCompletedStr = `${num(period === 'today' ? apl.reduce((s, p) => s + (p.quizzes || 0), 0) : data.anonCompleted)} anonymous`;

  // Daily Champions: the top scorer (by correct answers) for each day, newest first.
  const dailyRows = (data.dailyChampions || []).map((d) => ({ date: d.date, name: d.username }));

  // Rows for the currently-selected metric, respecting the view toggle.
  const rowsFor = (m) => {
    if (view === 'anon') return ({ plays: anonPlaysRows, correct: anonCorrectRows, unique: anonQuizzesRows, perfect: anonPerfectRows })[m] || [];
    if (view === 'combined') return ({ plays: combPlaysRows, correct: combCorrectRows, unique: combQuizzesRows, perfect: combPerfectRows })[m] || [];
    return ({ plays: totalPlaysRows, correct: correctRows, unique: completedRows, perfect: perfectRows })[m] || [];
  };
  const cur = METRICS.find((m) => m.id === metric) || METRICS[0];
  const curAnon = view === 'registered' ? (metric === 'plays' ? anonPlaysStr : metric === 'unique' ? anonCompletedStr : null) : null;

  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.ink, position: 'relative', overflow: 'clip' }}>
      <Grain />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <header style={{ padding: '40px 24px 18px', maxWidth: 1300, margin: '0 auto' }}>
          <Link href="/quizzes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, color: T.slate, textDecoration: 'none', marginBottom: 22 }}>
            <ArrowLeft size={15} strokeWidth={2.5} /> All Quizzes
          </Link>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.accent, marginBottom: 10 }}>Quiz Champions</div>
          <h1 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 600, fontSize: 'clamp(34px, 7vw, 60px)', lineHeight: 0.95, letterSpacing: '-0.015em', margin: '0 0 14px', fontVariationSettings: '"SOFT" 100', color: T.ink }}>
            The <span style={{ fontStyle: 'italic', fontWeight: 400, color: T.accent }}>Quiz</span> Leaderboard
          </h1>
          <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 17, lineHeight: 1.5, color: T.slate, margin: 0, maxWidth: 720 }}>
            Every signed-up player, ranked five ways: total plays, correct answers banked, distinct quizzes finished, quizzes scored a perfect 100%, and the daily champion. Pick a category below. Sign Up before a quiz to put your name in the running.
          </p>
          <div style={{ borderBottom: `1px solid ${T.ink}`, marginTop: 22 }} />
          <div style={{ borderBottom: `2px solid ${T.accent}` }} />
        </header>

        <section style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 24px 72px' }}>
          <div className="lb-metrics">
            {METRICS.map((m) => {
              const on = metric === m.id;
              const MI = m.icon;
              return (
                <button key={m.id} onClick={() => setMetric(m.id)} className={`lb-metric${on ? ' on' : ''}`}>
                  <MI size={15} strokeWidth={2.2} aria-hidden="true" style={{ flex: 'none' }} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {metric !== 'daily' && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ display: 'inline-flex', border: `1.5px solid ${T.ink}` }}>
                {[['registered', 'Registered'], ['anon', 'Anonymous'], ['combined', 'Combined']].map(([k, label], idx) => {
                  const on = view === k;
                  return (
                    <button key={k} onClick={() => setView(k)} style={{ padding: '8px 15px', background: on ? T.ink : 'transparent', color: on ? T.surface : T.ink, border: 'none', borderLeft: idx === 0 ? 'none' : `1.5px solid ${T.ink}`, fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>{label}</button>
                  );
                })}
              </div>
              <div style={{ display: 'inline-flex', border: `1.5px solid ${T.ink}` }}>
                {[['all', 'All Time'], ['today', 'Today']].map(([k, label], idx) => {
                  const on = period === k;
                  return (
                    <button key={k} onClick={() => setPeriod(k)} style={{ padding: '8px 15px', background: on ? T.ink : 'transparent', color: on ? T.surface : T.ink, border: 'none', borderLeft: idx === 0 ? 'none' : `1.5px solid ${T.ink}`, fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>{label}</button>
                  );
                })}
              </div>
            </div>
          )}
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.03em', color: T.slate, margin: '0 0 18px', maxWidth: 720 }}>
            {metric === 'daily'
              ? 'The signed-up player who banked the most correct answers each day. A fresh champion is crowned every day.'
              : `${view === 'anon' ? 'Players who never signed up, batched by browser and shown under a stable Guest handle.' : view === 'combined' ? 'Registered and anonymous players merged into one combined ranking.' : 'Signed-up players only. Switch to Anonymous or Combined to see everyone else.'}${period === 'today' ? ' Showing today only.' : ''}`}
          </p>
          {loaded ? (
            <div className="lb-single">
              {metric === 'daily' ? (
                <div>
                  <div className="lb-title" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                    <Crown size={16} strokeWidth={2} aria-hidden="true" style={{ flex: 'none', marginTop: 2, color: T.accent }} />
                    <h2 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 600, fontSize: 16, lineHeight: 1.1, letterSpacing: '-0.01em', margin: 0, color: T.ink }}>Daily Champions</h2>
                  </div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.slate, marginBottom: 10 }}>Most correct answers each day</div>
                  <div style={{ borderTop: `2px solid ${T.accent}` }}>
                    {dailyRows.length > 0 ? (
                      <div className="lb-daily-grid">
                        {dailyRows.map((r, i) => (
                          <div key={`${r.date}-${i}`} className="lb-daily-row">
                            <span className="lb-daily-date">{r.date}</span>
                            <span className="lb-daily-name">{r.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '20px 3px', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 13.5, color: T.slate }}>The first champion is crowned once today is over.</div>
                    )}
                  </div>
                </div>
              ) : (
                <Column icon={cur.icon} title={cur.label} anon={curAnon} note={cur.note} rows={rowsFor(metric)} empty={`No ${cur.label.toLowerCase()} recorded yet.`} />
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 24px', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 18, color: T.slate }}>Loading the standings...</div>
          )}
          <style dangerouslySetInnerHTML={{ __html: `
            .lb-metrics{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;}
            .lb-metric{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;background:${T.surfaceAlt};border:1.5px solid ${T.ink};font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;color:${T.ink};cursor:pointer;}
            .lb-metric:hover{background:#e4dbc8;}
            .lb-metric.on{background:${T.accent};color:${T.surface};}
            .lb-single{max-width:none;}
            .lb-daily-grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(10,auto);gap:0 36px;}
            .lb-daily-row{display:flex;align-items:center;gap:12px;padding:8px 3px;border-bottom:1px solid rgba(26,22,17,0.12);min-width:0;}
            .lb-daily-date{flex:none;min-width:46px;font-family:'DM Mono',monospace;font-size:12px;font-weight:700;color:${T.accent};}
            .lb-daily-name{flex:1 1 auto;min-width:0;font-family:'Manrope',serif;font-size:15px;font-weight:500;color:${T.ink};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            @media(max-width:680px){.lb-daily-grid{grid-auto-flow:row;grid-template-rows:none;grid-template-columns:1fr;}}
            .lb-title{min-height:46px;}
            @media(max-width:900px){.lb-grid{grid-template-columns:1fr 1fr;gap:30px;}}
            @media(max-width:520px){.lb-grid{grid-template-columns:1fr;gap:34px;}.lb-title{min-height:0;}}
          ` }} />
        </section>
      </div>
      <Footer />
    </div>
  );
}
