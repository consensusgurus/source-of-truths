import QuizHomeClient from './quizzes/QuizHomeClient';
import { QUIZZES } from '@/lib/quizzes';
import { getAllSources } from '@/lib/sources';

const SOURCE_COUNT = getAllSources().length;

export function generateMetadata() {
  const count = Array.isArray(QUIZZES) ? QUIZZES.filter((q) => !q.unlisted).length : 0;
  const title = 'Mind Loft | Sharpen Your Mind';
  const description = `Daily puzzles and quizzes to sharpen your brain. Word, number and logic games, plus ${count}+ timed quizzes across films, music, geography, sports, and brands, from name-them-all and matching to map and multiple-choice. Then browse consensus Top 10 Lists where ${SOURCE_COUNT} experts and aggregators agree.`;
  const ogTitle = 'Mind Loft: Sharpen Your Mind';

  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: {
      // A page-level openGraph REPLACES the layout's, so the baked card has to
      // be named here too or `/` ships with no og:image at all.
      images: [{ url: '/og/brand.png', width: 1200, height: 630, alt: 'Mind Loft: daily puzzles and quizzes' }],
      title: ogTitle,
      description,
      url: '/',
      type: 'website',
      siteName: 'Mind Loft',
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og/brand.png'],
      title: ogTitle,
      description,
    },
  };
}

// Nothing on this page can request anything until the bundle has downloaded and
// hydrated: measured on the live site, the FIRST API call left the browser at
// 880ms, and the player stats could not land before that no matter how fast the
// endpoint got. This runs during HTML parse instead, off the identity already in
// localStorage, and parks the promise for the client to await.
//
// It must build byte-identically the same query string QuizHomeClient does
// (anonId, then email, then light=1), because the client only adopts the promise
// when the keys match; any mismatch simply falls through to a normal fetch, so
// the worst case is the behaviour we had before.
const ME_PRELOAD = `(function(){try{
var a=null,e=null;
try{a=localStorage.getItem('sot_quiz_anon')}catch(x){}
try{var i=JSON.parse(localStorage.getItem('sot_quiz_identity')||'null');e=i&&i.email}catch(x){}
if(!a&&!e)return;
var p=new URLSearchParams();
if(a)p.set('anonId',a);
if(e)p.set('email',e);
p.set('light','1');
var k=p.toString();
window.__sotMe={key:k,promise:fetch('/api/quiz/me?'+k).then(function(r){return r.json()}).catch(function(){return null})};
}catch(x){}})();`;

// THE SERVER DECIDES WHETHER THIS IS A STAGE PAGE (owner, 2026-08-31: "why does
// the old homepage format still display for a second"). The stage flag used to
// resolve in an EFFECT, which means the first paint is always the pre-effect
// branch — the whole old home, rendered and then thrown away. Nothing about the
// decision needs the browser: it comes from the URL, which the server can read,
// so it is passed down as the state's INITIAL value and there is no flash and
// no hydration mismatch.
export default function HomePage({ searchParams }) {
  const sp = searchParams || {};
  const stageDefault = String(sp.stage ?? '') !== '0';
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ME_PRELOAD }} />
      <QuizHomeClient variant="v3" sourceCount={SOURCE_COUNT} stageDefault={stageDefault} />
      {/* NOTHING UNINVITED ON THE HOMEPAGE. The Daily Five overlay went on
          2026-08-30 for meeting a first visit with a full-screen pitch before
          the visitor had seen anything the site offers, and the install card
          followed it the same day when the owner cleared every pop-up but the
          Trivia Gauntlet nudge. Waiting on engagement was not enough to save it:
          the objection is that the page asks for something before the reader
          does, not how long it waits first. app/WelcomeOverlay.jsx stays in the
          tree, unmounted, so restoring that one is a line. */}
    </>
  );
}
