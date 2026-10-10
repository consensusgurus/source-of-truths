// One-off anchored edit: teaches app/quiz/[id]/QuizClient.jsx to play a quiz
// inside a Potluck day (?potluck=<num>&i=<slot>). See lib/potluck.js.
import fs from 'fs';
import path from 'path';
const root = process.argv[2] || '.';
const file = path.join(root, 'app/quiz/[id]/QuizClient.jsx');
let src = fs.readFileSync(file, 'utf8');
let n = 0;
function edit(anchor, rep) {
  if (src.includes(rep)) return;
  const c = src.split(anchor).length - 1;
  if (c !== 1) throw new Error(`anchor matched ${c}: ${anchor.slice(0, 90)}`);
  src = src.replace(anchor, rep); n++;
}
edit(`import { getChallenge, challengeQuizIds } from '@/lib/challenges';`,
`import { getChallenge, challengeQuizIds } from '@/lib/challenges';
import { PUZZLES as POTLUCK_DAYS } from '@/app/potluck/puzzles';
import { recordPotluck, etToday as potToday } from '@/lib/potluck';`);

edit(`  const chAccent = challenge ? (challenge.accent || 'Daily Challenge') : '';`,
`  const chAccent = challenge ? (challenge.accent || 'Daily Challenge') : '';

  // ── Potluck context (?potluck=<num>&i=<slot>, owner 2026-10-09) ──
  // The quiz plays exactly as it always does; on finish its score and clock
  // are recorded into that Potluck day (lib/potluck.js, write-once per slot)
  // and the player is sent back to /potluck. Active only when the day exists
  // and this quiz is the one in that slot, so a stray link changes nothing.
  const potNumRaw = searchParams ? searchParams.get('potluck') : null;
  const potIRaw = searchParams ? searchParams.get('i') : null;
  const potDay = potNumRaw && /^\\d+$/.test(potNumRaw) ? (POTLUCK_DAYS.find((p) => p.num === Number(potNumRaw)) || null) : null;
  const potI = potIRaw != null && /^\\d+$/.test(potIRaw) ? Number(potIRaw) : null;
  const potActive = !!(potDay && potI != null && potDay.quizzes[potI] === quizId);
  const potHome = potDay ? (potDay.live === potToday() ? '/potluck' : \`/potluck?p=\${potDay.num}\`) : '/potluck';`);

edit(`  const chAdvanceTimer = useRef(null);
`,
`  const chAdvanceTimer = useRef(null);
  // Potluck: one-shot write guard, the back-to-Potluck countdown, and whether
  // that write turned the day in (the third quiz does).
  const potWroteRef = useRef(false);
  const [potCountdown, setPotCountdown] = useState(null);
  const [potTurnedIn, setPotTurnedIn] = useState(false);
  useEffect(() => {
    if (potCountdown == null || !potActive) return undefined;
    if (potCountdown <= 0) { router.push(potHome); return undefined; }
    const t = setTimeout(() => setPotCountdown((c) => (c == null ? c : c - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [potCountdown, potActive]);
`);

edit(`      setChCountdown(6);
    }
    setStats(recordResult(quizId, finalScore));`,
`      setChCountdown(6);
    }
    if (potActive && !potWroteRef.current) {
      potWroteRef.current = true;
      try {
        const r = recordPotluck(potDay, potI, { s: finalScore, t: total, e: elapsed });
        setPotTurnedIn(!!(r && r.turnedIn));
      } catch (e) { /* storage unavailable: the hub still shows the quiz as open */ }
      setPotCountdown(7);
    }
    setStats(recordResult(quizId, finalScore));`);

edit(`          {!LOFT && !QSTAGE && tab !== 'stats' && !mAppPlay && (!started || ended) && <LeaderboardStrip`,
`          {potActive && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--stg-acc,#c2410c)', background: 'var(--stg-surf,#fff7ed)' }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800, color: 'var(--stg-acc-ink,#c2410c)' }}>
                Potluck · quiz {potI + 1} of {potDay.quizzes.length}
              </span>
              {ended ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED }}>
                    {potTurnedIn ? 'All three in. Your Potluck is turned in.' : 'Banked.'}{potCountdown != null && potCountdown > 0 ? \` Back in \${potCountdown}…\` : ''}
                  </span>
                  {potCountdown != null && potCountdown > 0 && (
                    <button type="button" onClick={() => setPotCountdown(null)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>Stay here</button>
                  )}
                  <a href={potHome} style={{ fontFamily: SANS, fontSize: 13, fontWeight: 800, padding: '7px 13px', borderRadius: 8, background: 'var(--stg-acc,#c2410c)', color: 'var(--stg-onramp,#fff)', textDecoration: 'none' }}>Back to Potluck</a>
                </span>
              ) : (
                <a href={potHome} style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>Back to Potluck</a>
              )}
            </div>
          )}
          {!LOFT && !QSTAGE && tab !== 'stats' && !mAppPlay && (!started || ended) && <LeaderboardStrip`);
fs.writeFileSync(file, src);
console.log(`QuizClient potluck: ${n} edits`);
