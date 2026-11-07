'use client';

// MY RUNS on the home's My Puzzles pane (owner, 2026-11-07): the runs this
// browser built or opened from a friend's link, newest first, then a Build a
// Run button as the last item. Read from browser storage in an effect, so the
// server paint and the first client paint agree (both render the button only).
import { useEffect, useState } from 'react';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { listMyRuns, builtRunHref, playedToday } from '@/lib/daily-run';

export default function MyRunsStrip() {
  const [runs, setRuns] = useState([]);
  useEffect(() => {
    setRuns(listMyRuns().slice(0, 6).map((r) => ({ ...r, played: r.keys.filter((k) => playedToday(k)).length })));
  }, []);
  return (
    <div className="mrs">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {runs.length ? <div className="mrs-h">My Runs</div> : null}
      {runs.map((r) => (
        <a key={r.id} className="mrs-r" href={builtRunHref(r.keys, { name: r.name, by: r.by })}>
          <span className="mrs-t">
            <b>{r.name || 'My Run'}</b>
            <small>{r.mine ? 'Built by you' : r.by ? `By ${r.by}` : 'Shared run'} · {r.keys.map((k) => (DAILY_GAME_MAP[k] || {}).name).filter(Boolean).join(', ')}</small>
          </span>
          <span className={'mrs-s' + (r.played === r.keys.length ? ' done' : '')}>{r.played === r.keys.length ? 'Played' : r.played ? `${r.played} of ${r.keys.length}` : 'Play'}</span>
        </a>
      ))}
      <a className="mrs-b" href="/build-a-run">+ Build a Run</a>
    </div>
  );
}

const CSS = `
.mrs{display:flex;flex-direction:column;gap:8px;margin:4px 0 14px;font-family:Manrope,system-ui,sans-serif;}
.mrs-h{font-size:12px;font-weight:700;color:var(--stg-mute);margin:2px 2px 0;}
.mrs-r{display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid var(--stg-ink);border-radius:14px;background:var(--stg-surf);
  color:var(--stg-ink);text-decoration:none;min-height:56px;box-sizing:border-box;}
.mrs-r:hover{background:var(--stg-surf2);}
.mrs-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.mrs-t b{font-size:15px;font-weight:800;}
.mrs-t small{font-size:12.5px;font-weight:600;color:var(--stg-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mrs-s{flex:none;font-size:13px;font-weight:800;color:var(--stg-ink);}
.mrs-s.done{color:var(--stg-mute);}
.mrs-b{display:flex;align-items:center;justify-content:center;height:48px;border:1px solid var(--stg-ink);border-radius:14px;
  color:var(--stg-ink);font-size:15px;font-weight:800;text-decoration:none;box-sizing:border-box;}
.mrs-b:hover{background:var(--stg-surf2);}
`;
