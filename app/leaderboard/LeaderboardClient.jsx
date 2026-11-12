'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Play, Check, CheckCheck, Crown } from 'lucide-react';
import CircuitFrame from '../circuits/CircuitFrame';

// THE QUIZ LEADERBOARD ON THE SITE'S OWN FRAME (owner, 2026-11-12: "update the
// leaderboard page on main... none match new styling"). It was the old
// magazine page: grain, a serif-weight title with an italic accent word, navy
// rules and toggles, and the legacy footer. It now sits in CircuitFrame with the
// dailies' top bar (back, name with the Trivia dot, Share, look switch), the
// page's ink and hairlines in light and dark, and toggles that fill with the
// Trivia pastel. The data and the five rankings are unchanged.
const TRIVIA_SOFT = '#fdbe8a'; // softGround(CATEGORY_RAMP Trivia #fb923c), the home tile tone
const MEDAL = ['#e8c45a', '#c3c7cf', '#d79a63'];
const INK = 'var(--stg-ink,#0b0d12)';
const MUTE = 'var(--stg-mute,#5f6774)';
const LINE = 'var(--stg-line,rgba(11,15,26,.14))';

function RankRow({ rank, name, value }) {
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;
  return (
    <div className="lb-row">
      <span className="lb-rank" style={medal ? { background: medal, color: '#0b0d12', borderColor: medal } : undefined}>{rank}</span>
      <span className="lb-name">{name}</span>
      <span className="lb-val">{value}</span>
    </div>
  );
}

function Column({ icon: Icon, title, anon, note, rows, empty }) {
  return (
    <div>
      <div className="lb-colhead">
        <Icon size={16} strokeWidth={2.2} aria-hidden="true" style={{ flex: 'none' }} />
        <h2>{title}{anon ? <span>({anon})</span> : null}</h2>
      </div>
      <div className="lb-note">{note}</div>
      <div className="lb-list">
        {rows.length > 0 ? rows.map((r, i) => (
          <RankRow key={`${r.name}-${i}`} rank={i + 1} name={r.name} value={r.value} />
        )) : (
          <div className="lb-empty">{empty}</div>
        )}
      </div>
    </div>
  );
}

const CSS = `
.lbp{max-width:1040px;margin:0 auto;padding:18px 24px 72px;color:${INK};font-family:Manrope,system-ui,sans-serif;}
.lbp h1{font-size:clamp(28px,5vw,40px);font-weight:800;line-height:1.2;margin:6px 0 10px;padding-bottom:2px;letter-spacing:-.01em;}
.lbp .lb-intro{font-size:15px;line-height:1.55;color:${MUTE};margin:0 0 22px;max-width:680px;}
.lb-metrics{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;}
.lb-metric{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 15px;border-radius:999px;border:1px solid ${LINE};background:var(--stg-surf,#fff);color:${INK};font:800 13px Manrope,system-ui,sans-serif;cursor:pointer;}
.lb-metric:hover{border-color:${INK};}
.lb-metric.on{background:${TRIVIA_SOFT};border-color:${TRIVIA_SOFT};color:#0b0d12;}
.lb-toggles{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;}
.lb-seg{display:inline-flex;border:1px solid ${INK};border-radius:10px;overflow:hidden;}
.lb-seg button{height:36px;padding:0 15px;border:0;background:transparent;color:${INK};font:800 13px Manrope,system-ui,sans-serif;cursor:pointer;}
.lb-seg button + button{border-left:1px solid ${INK};}
.lb-seg button.on{background:${TRIVIA_SOFT};color:#0b0d12;}
.lb-sub{font-size:13px;line-height:1.5;color:${MUTE};margin:0 0 18px;max-width:680px;}
.lb-colhead{display:flex;align-items:center;gap:8px;margin-bottom:2px;}
.lb-colhead h2{font-size:17px;font-weight:800;margin:0;line-height:1.3;padding-bottom:2px;}
.lb-colhead h2 span{font-size:12px;font-weight:600;color:${MUTE};margin-left:6px;}
.lb-note{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${MUTE};margin-bottom:10px;}
.lb-list{background:var(--stg-surf,#fff);border:1px solid ${LINE};border-radius:14px;padding:4px 14px;}
.lb-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid ${LINE};}
.lb-row:last-child{border-bottom:0;}
.lb-rank{flex:none;width:26px;height:26px;border-radius:50%;border:1px solid ${LINE};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:${INK};}
.lb-name{flex:1 1 auto;min-width:0;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:2px;}
.lb-val{flex:none;font-size:15px;font-weight:800;}
.lb-empty{padding:20px 2px;font-size:14px;color:${MUTE};}
.lb-daily-grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(10,auto);gap:0 36px;}
.lb-daily-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid ${LINE};min-width:0;}
.lb-daily-date{flex:none;min-width:46px;font-size:12px;font-weight:800;color:${MUTE};}
.lb-daily-name{flex:1 1 auto;min-width:0;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:2px;}
.lb-loading{text-align:center;padding:60px 24px;font-size:15px;color:${MUTE};}
@media(max-width:680px){.lb-daily-grid{grid-auto-flow:row;grid-template-rows:none;grid-template-columns:1fr;}.lbp{padding:10px 14px 56px;}}
`;

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
    <CircuitFrame cat="Trivia" label="Quiz leaderboard" wide bar={{ title: 'Quiz Leaderboard', sub: 'Quiz champions', dot: TRIVIA_SOFT }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lbp">
        <h1>The Quiz Leaderboard</h1>
        <p className="lb-intro">Every signed-up player, ranked five ways: total plays, correct answers banked, distinct quizzes finished, quizzes scored a perfect 100%, and the daily champion. Pick a category below. Sign up before a quiz to put your name in the running.</p>

        <div className="lb-metrics">
          {METRICS.map((m) => {
            const on = metric === m.id;
            const MI = m.icon;
            return (
              <button key={m.id} type="button" onClick={() => setMetric(m.id)} className={`lb-metric${on ? ' on' : ''}`} aria-pressed={on}>
                <MI size={15} strokeWidth={2.2} aria-hidden="true" style={{ flex: 'none' }} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {metric !== 'daily' && (
          <div className="lb-toggles">
            <div className="lb-seg" role="group" aria-label="Players">
              {[['registered', 'Registered'], ['anon', 'Anonymous'], ['combined', 'Combined']].map(([k, label]) => (
                <button key={k} type="button" className={view === k ? 'on' : ''} aria-pressed={view === k} onClick={() => setView(k)}>{label}</button>
              ))}
            </div>
            <div className="lb-seg" role="group" aria-label="Period">
              {[['all', 'All Time'], ['today', 'Today']].map(([k, label]) => (
                <button key={k} type="button" className={period === k ? 'on' : ''} aria-pressed={period === k} onClick={() => setPeriod(k)}>{label}</button>
              ))}
            </div>
          </div>
        )}
        <p className="lb-sub">
          {metric === 'daily'
            ? 'The signed-up player who banked the most correct answers each day. A fresh champion is crowned every day.'
            : (view === 'anon' ? 'Players who never signed up, batched by browser and shown under a stable Guest handle.' : view === 'combined' ? 'Registered and anonymous players merged into one combined ranking.' : 'Signed-up players only. Switch to Anonymous or Combined to see everyone else.')}
        </p>
        {loaded ? (
          metric === 'daily' ? (
            <div>
              <div className="lb-colhead"><Crown size={16} strokeWidth={2.2} aria-hidden="true" style={{ flex: 'none' }} /><h2>Daily Champions</h2></div>
              <div className="lb-note">Most correct answers each day</div>
              <div className="lb-list">
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
                  <div className="lb-empty">The first champion is crowned once today is over.</div>
                )}
              </div>
            </div>
          ) : (
            <Column icon={cur.icon} title={cur.label} anon={curAnon} note={cur.note} rows={rowsFor(metric)} empty={`No ${cur.label.toLowerCase()} recorded yet.`} />
          )
        ) : (
          <div className="lb-loading">Loading the standings...</div>
        )}
      </div>
    </CircuitFrame>
  );
}
