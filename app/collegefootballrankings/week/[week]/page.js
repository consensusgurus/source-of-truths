// app/collegefootballrankings/week/[week]/page.js
//
// One past college football board, frozen as published (owner request,
// 2026-09-27). Every archived week is prerendered from lib/gridiron-archive.js;
// any other week number is a 404, and the LIVE week is never served here (it
// lives at /collegefootballrankings until the next refresh archives it).
//
// The board is the same GridironTable the live page uses, fed the archived block
// and that block's OWN build date, so its sources are judged as they were that
// week rather than against today. scripts/verify-gridiron-archive.mjs proves the
// result still matches what was published.
//
// noindex, follow: a past week is a reference for readers flipping back, not a
// page to compete with the live board in search (the 2026-09-20 crawl-budget
// pass). Its links still carry.
import { notFound } from 'next/navigation';
import RankingsStage from '@/app/RankingsStage';
import SotHeader from '@/app/SotHeader';
import StageFooter from '@/app/StageFooter';
import GridironTable from '@/app/GridironTable';
import CfbWeekNav from '../../CfbWeekNav';
import { CFB_ARCHIVE } from '@/lib/gridiron-archive';
import { SOT_URL } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return CFB_ARCHIVE.map((e) => ({ week: String(e.week) }));
}

const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const long = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${MON[+m[2] - 1]} ${+m[3]}, ${m[1]}` : iso;
};
const entryFor = (p) => CFB_ARCHIVE.find((e) => String(e.week) === String(p && p.week));

export function generateMetadata({ params }) {
  const e = entryFor(params);
  if (!e) return {};
  const title = `College Football Consensus Rankings, Week ${e.week} | Source of Truths`;
  const description = `The college football consensus as published ${long(e.builtAt)}: all FBS teams rated on results, betting markets and analytics models, no polls.`;
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SOT_URL}/collegefootballrankings/week/${e.week}` },
    openGraph: { title, description, url: `${SOT_URL}/collegefootballrankings/week/${e.week}`, type: 'website', siteName: 'Source of Truths' },
  };
}

export default function CfbArchivedWeekPage({ params }) {
  const e = entryFor(params);
  if (!e) notFound();
  const N = e.published.length;
  return (
    <RankingsStage>
      <SotHeader active="cfb" />
      <div className="rk-col">
        <div className="rk-head">
          <h1>College football <span>consensus, week {e.week}</span></h1>
          <p className="rk-lede">
            The board as it was published on {long(e.builtAt)}, before week {e.week}&rsquo;s games. It is
            frozen: every rating, source and column is exactly what readers saw that week, including sources
            that have since left the board.
          </p>
          <p className="rk-stamp">
            <i>Archive</i>
            <span>
              <b>This is a past week.</b> The{' '}
              <a href="/collegefootballrankings">current consensus</a> is rebuilt every week.
            </span>
          </p>
        </div>

        <CfbWeekNav current={e.week} />

        <GridironTable
          data={e.block}
          fetchedAt={e.builtAt}
          sport="cfb"
          eyebrow={`College football \u00b7 FBS \u00b7 2026 season \u00b7 week ${e.week}`}
          boardTitle={`Consensus, all ${N} FBS teams, as published`}
        />

        <p className="rk-cross">
          Back to the <a href="/collegefootballrankings">current college football consensus</a>, or see the{' '}
          <a href="/nflrankings">NFL consensus rankings</a>.
        </p>
      </div>
      <StageFooter />
    </RankingsStage>
  );
}
