// The week switcher on the college football board (owner request, 2026-09-27).
//
// A SERVER component of plain links, like the table under it: every week is its
// own static page, so flipping weeks is a navigation and nothing here needs
// client state. The live board is /collegefootballrankings; each archived week
// is /collegefootballrankings/week/<N>, frozen as published (lib/gridiron-archive.js).
//
// The weeks are read off the archive and the live block, never typed here, so a
// weekly refresh that runs scripts/archive-cfb-week.mjs adds its chip on its own.
import { GRIDIRON } from '@/lib/gridiron-data';
import { builtAtFor } from '@/lib/gridiron';
import { CFB_ARCHIVE } from '@/lib/gridiron-archive';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const short = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${MON[+m[2] - 1]} ${+m[3]}` : iso;
};

export function cfbWeeks() {
  const live = { week: GRIDIRON.cfb.week, builtAt: builtAtFor('cfb'), href: '/collegefootballrankings', live: true };
  const past = CFB_ARCHIVE.map((e) => ({ week: e.week, builtAt: e.builtAt, href: `/collegefootballrankings/week/${e.week}` }));
  return [live, ...past.sort((a, b) => b.week - a.week)];
}

export default function CfbWeekNav({ current }) {
  const weeks = cfbWeeks();
  if (weeks.length < 2) return null;
  return (
    <nav className="rk-weeks" aria-label="Choose a week">
      <span className="rk-weeks-l">Week</span>
      <div className="rk-weeks-row">
        {weeks.map((w) => {
          const on = w.week === current;
          return (
            <a
              key={w.week}
              href={w.href}
              className={'rk-wk' + (on ? ' on' : '')}
              aria-current={on ? 'page' : undefined}
              title={w.live ? `The current board, built ${short(w.builtAt)}` : `The board as published ${short(w.builtAt)}`}
            >
              <b>{w.week}</b>
              <small>{w.live ? 'Current' : short(w.builtAt)}</small>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
