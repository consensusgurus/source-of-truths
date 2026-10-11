'use client';

// THE CLIMB: the lower band of a solo trivia gauntlet board (Biz, Sport,
// Script, Quotes, Atlas, Deep). Owner approved 2026-10-10 ("push these live").
//
// It sits BELOW the four answers, inside the board card, and never between the
// cap and the question: the question and its answers come first.
//
//   The climb    a tower of five rows (one per round), bottom row first, perTier
//                cells per row. Cell i is cleared (accent fill) when i < answered,
//                the current question (tint + accent outline) when the run is
//                live, the miss (red) when the run was lost there, else empty.
//   Riding       what this question is worth: right takes the run to answered+1,
//                wrong or out of time banks answered.
//   Lanes        the categories of the current round in order, the current one
//                marked Now. Passed only when the round's questions carry
//                distinct categories (Deep has none, so it shows no list). The
//                rules already publish every lane, so naming them leaks nothing.
//
// frozen: the finished board shows the tower only, no riding panel, no lanes.
// Stage tokens only. Phone (<=560px, the clients' breakpoint) is the compact
// grid: 21px cells, no row labels, the current round named under it.

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

const CSS = `
.gcl{margin-top:14px;padding-top:14px;border-top:1px solid var(--stg-line);display:flex;gap:26px;align-items:flex-start;}
.gcl-tower{flex:none;display:flex;flex-direction:column;gap:9px;}
.gcl-head{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.gcl-cap{font-weight:700;text-transform:uppercase;letter-spacing:.09em;font-size:11px;color:var(--stg-mute);}
.gcl-goal{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--stg-mute);}
.gcl-goal b{color:var(--stg-ink);font-variant-numeric:tabular-nums;}
.gcl-rnd{display:none;font-size:10px;font-weight:700;color:var(--stg-acc-ink);}
.gcl-rows{display:flex;flex-direction:column;gap:6px;}
.gcl-row{display:flex;align-items:center;gap:10px;}
.gcl-lab{width:82px;flex:none;display:flex;flex-direction:column;}
.gcl-lab b{font-size:12.5px;font-weight:800;}
.gcl-lab span{font-size:10.5px;font-weight:600;color:var(--stg-mute);font-variant-numeric:tabular-nums;}
.gcl-cells{display:flex;gap:5px;}
.gcl-c{width:32px;height:32px;box-sizing:border-box;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;border:1.5px solid var(--stg-line3);background:transparent;color:var(--stg-mute);}
.gcl-c.ok{border:0;background:var(--stg-acc);color:var(--stg-onramp);}
.gcl-c.cur{border:2.5px solid var(--stg-acc-ink);background:var(--stg-acc-tint);color:var(--stg-acc-ink);}
.gcl-c.miss{border:2px solid var(--stg-ink);background:var(--stg-bad);color:var(--stg-ground);}
.gcl-under{display:none;font-size:10.5px;font-weight:700;color:var(--stg-ink2);}
.gcl-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;}
.gcl-ride{background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:9px;}
.gcl-pair{display:flex;gap:8px;}
.gcl-opt{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;border-radius:10px;padding:8px 10px;font-size:13px;font-weight:800;color:var(--stg-ink);}
.gcl-opt.r{background:var(--stg-acc-tint);}
.gcl-opt.w{border:1.5px solid var(--stg-line3);padding:7px 9px;}
.gcl-opt i{font-style:normal;font-weight:700;text-transform:uppercase;letter-spacing:.09em;font-size:9.5px;color:var(--stg-mute);}
.gcl-opt.r i{color:var(--stg-acc-ink);}
.gcl-opt b{font-size:20px;font-variant-numeric:tabular-nums;}
.gcl-fine{font-size:11.5px;font-weight:600;color:var(--stg-mute);line-height:1.4;}
.gcl-fine.ph{display:none;}
.gcl-lanes{display:flex;flex-direction:column;gap:5px;}
.gcl-lane{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:600;color:var(--stg-ink2);}
.gcl-lane.on{font-weight:800;color:var(--stg-ink);}
.gcl-lk{width:19px;height:19px;flex:none;border-radius:5px;box-sizing:border-box;border:1.5px solid var(--stg-line3);color:var(--stg-mute);display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:800;font-variant-numeric:tabular-nums;}
.gcl-lane.on .gcl-lk{border:0;background:var(--stg-acc);color:var(--stg-onramp);}
.gcl-now{margin-left:auto;font-weight:700;text-transform:uppercase;letter-spacing:.09em;font-size:10px;color:var(--stg-acc-ink);}
@media(max-width:560px){
  .gcl{gap:12px;align-items:stretch;padding-top:12px;}
  .gcl-tower{gap:5px;}
  .gcl-cap{font-size:9px;}
  .gcl-goal{display:none;}
  .gcl-rnd{display:inline;}
  .gcl-rows{gap:3px;}
  .gcl-lab{display:none;}
  .gcl-cells{gap:3px;}
  .gcl-c{width:21px;height:21px;border-radius:5px;font-size:9.5px;}
  .gcl-c.cur{border-width:2px;}
  .gcl-c .e{display:none;}
  .gcl-under{display:block;}
  .gcl-side{gap:6px;}
  .gcl-ride{background:none;border:0;padding:0;gap:6px;}
  .gcl-ride > .gcl-cap{display:none;}
  .gcl-pair{flex-direction:column;gap:6px;}
  .gcl-opt{font-size:12.5px;padding:7px 10px;}
  .gcl-opt.w{padding:6px 9px;}
  .gcl-opt i{font-size:9px;}
  .gcl-opt b{font-size:17px;}
  .gcl-fine{font-size:11px;}
  .gcl-fine.dt{display:none;}
  .gcl-fine.ph{display:block;}
  .gcl-lanes{display:none;}
}
`;

export default function GauntletClimb({
  total, perTier, tierNames,
  answered = 0,          // questions cleared (g.i)
  status = 'live',       // 'live' | 'lost' | 'won'
  flash = false,         // a right answer is flashing; its cell reads cleared
  frozen = false,        // finished board: tower only
  qSeconds = 20,
  lanes = null,          // the current round's categories, in order, or null
  laneWord = 'lanes',
  unit = 'straight',
  endsWhat = 'it',
  goal = 'runs the table',
}) {
  const rounds = Math.ceil(total / perTier);
  const cleared = status === 'won' ? total : Math.min(total, answered + (flash ? 1 : 0));
  const atIdx = Math.min(answered, total - 1);
  const tier = Math.min(rounds - 1, Math.floor(atIdx / perTier));
  const live = status === 'live' && !frozen;
  const lanesOk = !frozen && Array.isArray(lanes) && lanes.length === perTier
    && lanes.every(Boolean) && new Set(lanes).size === lanes.length;
  const laneNow = answered % perTier;

  const rows = [];
  for (let t = rounds - 1; t >= 0; t--) {
    const cells = [];
    for (let j = 0; j < perTier; j++) {
      const i = t * perTier + j;
      if (i >= total) break;
      let cls = '';
      if (i < cleared) cls = 'ok';
      else if (i === answered && status === 'lost') cls = 'miss';
      else if (i === answered && live && !flash) cls = 'cur';
      // On a phone only cleared, current and missed cells carry a number.
      cells.push(<span key={j} className={`gcl-c ${cls}`}><span className={cls ? undefined : 'e'}>{i + 1}</span></span>);
    }
    const reached = status === 'won' || t * perTier <= answered;
    const lo = t * perTier + 1, hi = Math.min(total, t * perTier + perTier);
    rows.push(
      <div key={t} className="gcl-row">
        <div className="gcl-lab">
          <b style={{ color: reached ? 'var(--stg-acc-ink)' : 'var(--stg-ink)' }}>{tierNames[t]}</b>
          <span>Q{lo}-{hi}</span>
        </div>
        <div className="gcl-cells">{cells}</div>
      </div>
    );
  }

  const label = status === 'won'
    ? `The climb: all ${total} cleared`
    : status === 'lost'
      ? `The climb: ${answered} of ${total} cleared, missed question ${answered + 1}`
      : `The climb: ${answered} of ${total} cleared, on question ${answered + 1}, round ${tier + 1} of ${rounds}`;

  return (
    <div className="gcl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gcl-tower">
        <div className="gcl-head">
          <span className="gcl-cap">The climb</span>
          <span className="gcl-goal">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></svg>
            <span><b>{total}</b> {goal}</span>
          </span>
          <span className="gcl-rnd">Round {tier + 1}</span>
        </div>
        <div className="gcl-rows" role="img" aria-label={label}>{rows}</div>
        <span className="gcl-under">{tierNames[tier]}</span>
      </div>

      {!frozen && (
        <div className="gcl-side">
          <div className="gcl-ride">
            <span className="gcl-cap" style={{ fontSize: 10.5 }}>What is riding on this one</span>
            <div className="gcl-pair">
              <div className="gcl-opt r"><i>Right</i><span><b>{answered + 1}</b> {unit}</span></div>
              <div className="gcl-opt w"><i>Wrong or out of time</i><span>Ends at <b>{answered}</b></span></div>
            </div>
            <span className="gcl-fine dt">{qSeconds} seconds a question and the clock never pauses. One wrong answer ends {endsWhat}; everything you clear is banked.</span>
            <span className="gcl-fine ph">{qSeconds} seconds a question. Everything you clear is banked.</span>
          </div>
          {lanesOk && (
            <div className="gcl-lanes">
              <span className="gcl-cap" style={{ fontSize: 10.5 }}>{WORDS[perTier] || perTier} {laneWord}, same order every round</span>
              {lanes.map((l, k) => (
                <div key={k} className={`gcl-lane${k === laneNow ? ' on' : ''}`}>
                  <span className="gcl-lk">{k + 1}</span>
                  <span>{l}</span>
                  {k === laneNow && <span className="gcl-now">Now</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
