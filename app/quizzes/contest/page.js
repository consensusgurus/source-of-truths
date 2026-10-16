import Link from 'next/link';
import Footer from '../../Footer';
import { CONTEST, COPY } from '@/lib/contest';
import ContestBoard from './ContestBoard';

// Rules + full board. Every promo surface (the pop-up, the end-card asterisk,
// the share pop banner, the rail panel) links here, so this page is the one
// place the terms are stated in full. It is a server component so the rules are
// in the HTML for anyone who needs to read or cite them, with only the live
// board hydrated on the client.

// An explicit openGraph block is REQUIRED here, not optional. Without one the
// page inherits the root layout's card, and the sibling app/quizzes/opengraph-image
// route, so sharing the contest link previewed as "Name the NYC Pizzeria from
// the Pizza Photo" with the generic site description. A promo link that
// advertises an unrelated quiz is worse than no preview at all.
const OG_TITLE = `${COPY.headline}: bring the most new players to Mind Loft`;
const OG_DESC = `${COPY.prizeLine}. Free to enter, open worldwide, ends ${CONTEST.deadlineLabel}.`;

export const metadata = {
  title: `${COPY.headline}: Mind Loft referral contest`,
  description: `${COPY.prizeLine}. ${COPY.deadlineLine} ${COPY.legal}`,
  alternates: { canonical: '/quizzes/contest' },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESC,
    url: '/quizzes/contest',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESC,
  },
};

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

export default function ContestPage() {
  const rules = [
    ['Who can enter', `Anyone ${CONTEST.minAge} or over, anywhere. Free to enter and free to play. No purchase necessary at any point.`],
    ['An email is required', 'Your Mind Loft account must have an email on it. Without one we cannot contact you, confirm the account is yours, or pay you, so accounts with no email are not ranked on the contest board. You can add one at any time before the deadline and your existing referrals still count.'],
    ['How to enter', 'Share your invite link. Anyone who opens it and finishes a game or a quiz is credited to you, once. You can find your link on the contest board below or from any Share button on the site.'],
    ['How scoring works', `${COPY.formulaLine}. Sessions are the separate days a person you referred came back and finished something, counted up to ${CONTEST.SESSION_CAP} days each. Plays are the games they finished, counted up to ${CONTEST.PLAY_CAP} each. Both caps are per person, so a large number of genuine new players always outranks a small number of very active ones.`],
    ['Existing referrals count', 'Everyone already on the community leaderboard starts with the score their existing referrals have earned. Nothing resets to zero. Your carried-in score is shown separately from what you earn during the contest, so you can see exactly where your total came from.'],
    ['One credit per person', 'Each person you bring in counts once, however much they play. Re-sending your link to the same person does not earn a second credit.'],
    ['Prizes', `First place wins $${CONTEST.prizes[0]}. Second place wins $${CONTEST.prizes[1]} and third place wins $${CONTEST.prizes[2]}.`],
    ['How winners are paid', `Winners are sent a payout link and choose how to receive it from the options available in their country, which usually include ${CONTEST.payoutOptions.join(', ')}. ${CONTEST.payoutUsOnly.join(' and ')} is available in the US. Not every method is offered in every country, and prizes are paid in US dollars or the local equivalent at the prevailing rate.`],
    ['Deadline', `Entries close ${CONTEST.deadlineLabel}. The board is final at that moment. Winners are contacted by email within a few days after.`],
    ['Ties', 'If two entrants finish on the same score, the one who reached it first wins.'],
    ['Disqualification', 'Referrals are reviewed before any payout. Accounts created to refer yourself, duplicate or spoofed accounts, bots, and automated play are all disqualified, and a disqualified entrant forfeits the whole entry rather than just the affected referrals. This judgement is ours and is final.'],
    ['Changes', 'If the contest has to be changed or ended early, that will be posted on this page.'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', fontFamily: SANS }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 18px 40px' }}>
        <Link href="/#sty-quizzes" style={{ fontSize: 13, fontWeight: 700, color: '#646c7a', textDecoration: 'none' }}>
          &larr; Back to all games
        </Link>

        <div style={{ background: '#233a63', color: '#fff', borderRadius: 14, padding: '26px 26px 22px', margin: '16px 0 22px' }}>
          <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#bfdbfe', marginBottom: 8 }}>
            Limited time · {CONTEST.days} days
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', margin: 0, lineHeight: 1.05 }}>
            {COPY.headline}
          </h1>
          <p style={{ fontSize: 15, color: '#dbeafe', margin: '10px 0 0', lineHeight: 1.5 }}>
            {COPY.sub}. {COPY.prizeLine}. Ends {CONTEST.deadlineLabel}.
          </p>
        </div>

        <ContestBoard />

        <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.01em', margin: '28px 0 4px', color: '#0b0d12' }}>
          Rules
        </h2>
        <dl style={{ margin: 0 }}>
          {rules.map(([term, body]) => (
            <div key={term} style={{ borderTop: '1px solid #e5e7eb', padding: '14px 0' }}>
              <dt style={{ fontSize: 13.5, fontWeight: 800, color: '#0b0d12', marginBottom: 4 }}>{term}</dt>
              <dd style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#3f4757' }}>{body}</dd>
            </div>
          ))}
        </dl>

        <p style={{ fontSize: 11.5, color: '#646c7a', lineHeight: 1.6, marginTop: 20 }}>
          {COPY.legal} This contest is run by Mind Loft and is not sponsored, endorsed or administered
          by any of the payment providers named above.
        </p>
      </div>
      <Footer />
    </div>
  );
}
