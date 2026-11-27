import MakerClient from './MakerClient';
import PageViewBeacon from '../../PageViewBeacon';
import { PHOTO_CSS } from '../photo-css';
import { SITE_URL } from '@/lib/site';

// /jigsaw/make-your-own: MAKE A JIGSAW PUZZLE FROM YOUR OWN PHOTO (owner, 2026-11-27: the photo
// upload feature "needs to be worked into SEO content"). The landing page aimed at searches like
// "custom jigsaw puzzle from photo", "make a jigsaw puzzle online", "photo jigsaw puzzle free" and
// "personalized jigsaw puzzle", with the maker itself on the first screen. The Jigsaw Puzzles
// portal (/jig/shelf) stays the hub and links here. Design: the "SEO Landing Page" board of the
// "Your Photo Jigsaws Mockup" canvas. JSON-LD: WebApplication + HowTo + FAQPage + BreadcrumbList.

const TITLE = 'Make a Jigsaw Puzzle From Your Photo, Free | Mind Loft';
const DESC = 'Turn any photo into a free online jigsaw puzzle, 24 to 4,000 pieces. Share a private link with family and friends. No signup to play.';

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/jigsaw/make-your-own' },
  openGraph: { title: 'Make a Jigsaw Puzzle From Your Own Photo', description: DESC, url: '/jigsaw/make-your-own', type: 'website', siteName: 'Mind Loft', images: [{ url: '/og/jig-shelf.png?v=2', width: 1200, height: 630, alt: 'Make a free jigsaw puzzle from your photo on Mind Loft' }] },
  twitter: { card: 'summary_large_image', title: 'Make a Jigsaw Puzzle From Your Own Photo', description: DESC, images: ['/og/jig-shelf.png?v=2'] },
};

const STEPS = [
  ['Upload and Crop', 'Choose a photo from your phone or computer, then keep it as taken or frame it wide, square or tall.'],
  ['Pick Your Pieces', 'Choose 24 to 4,000 pieces. Sizes your photo is too small for are greyed out, so every piece stays sharp.'],
  ['Play or Share', 'Solve it yourself, or text or email the private link to family and friends. They can play it in any browser.'],
];
const SIZES = [
  ['Up to 150 pieces', 'any phone photo'],
  ['300 pieces', 'about half a megapixel'],
  ['1,000 pieces', 'about 1.6 megapixels'],
  ['2,000 pieces', 'about 3 megapixels'],
  ['4,000 pieces', 'about 6.5 megapixels, which most phone photos have at full size'],
];
const FAQ = [
  ['Is it free to make a jigsaw puzzle from my photo?', 'Yes. Making, playing and sharing photo jigsaw puzzles on Mind Loft is free, with no download and no app.'],
  ['Who can see my puzzle?', 'Just you, unless you choose otherwise. You can share a private link with family and friends, or publish it on Community Photos, where it appears once Mind Loft approves it.'],
  ['Do my family and friends need an account to play?', 'No. Anyone with the link can play on a phone, a tablet or a computer, right in the browser.'],
  ['How many pieces can my photo have?', 'Anywhere from 24 to 4,000 pieces, depending on how many pixels the photo has. Each piece needs enough detail to stay sharp, so bigger sizes need bigger photos.'],
  ['Can I publish my puzzle on Community Photos later?', 'Yes. Open Your Photos on the Jigsaw Puzzles page on the device you made it on and choose Publish on Community Photos. It appears there once Mind Loft has reviewed it.'],
  ['Can I turn off a link later?', 'Yes. Open Your Photos on the Jigsaw Puzzles page on the device you made it on and turn the link off. The photo is deleted and the link stops working.'],
  ['What photos are not allowed on Community Photos?', 'Photos you do not have the right to share, photos of other people without their OK, and anything that is not family friendly. Every Community Photo is reviewed before it goes up.'],
  ['Is my location saved with the photo?', 'No. Your browser redraws the photo before it is uploaded, which removes the camera data, location included.'],
];

export default function MakeYourOwnPage() {
  const url = `${SITE_URL}/jigsaw/make-your-own`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: 'Mind Loft Photo Jigsaw Maker', url, applicationCategory: 'GameApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: DESC },
      { '@type': 'HowTo', name: 'How to make a jigsaw puzzle from your own photo', step: STEPS.map(([n, t], i) => ({ '@type': 'HowToStep', position: i + 1, name: n, text: t })) },
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Jigsaw Puzzles', item: `${SITE_URL}/jig/shelf` },
        { '@type': 'ListItem', position: 3, name: 'Make Your Own', item: url },
      ] },
    ],
  };
  return (
    <div className="pz">
      <style dangerouslySetInnerHTML={{ __html: PHOTO_CSS }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <PageViewBeacon id="jigsaw-make" />
      <div className="pz-in">
        <nav className="pz-crumb" aria-label="Breadcrumb">
          <a href="/">Home</a><span aria-hidden="true">/</span><a href="/jig/shelf">Jigsaw Puzzles</a><span aria-hidden="true">/</span><span aria-current="page">Make Your Own</span>
        </nav>
        <h1>Make a Jigsaw Puzzle From Your Own Photo, Free</h1>
        <p className="pz-lede">Turn any photo into an online jigsaw puzzle in seconds. Pick from 24 to 4,000 pieces and play it in your browser. Keep it just for you, send a private link to family and friends, or publish it on Community Photos. No app, no signup to play.</p>
        <MakerClient />

        <h2>How to Make a Photo Jigsaw Puzzle</h2>
        <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, listStyle: 'none', padding: 0, margin: 0 }}>
          {STEPS.map(([n, t], i) => (
            <li key={n} className="pz-card"><span className="pz-eyb">Step {i + 1}</span><h3 style={{ margin: '0 0 6px', fontSize: 17 }}>{n}</h3><p style={{ margin: 0, fontSize: 15 }}>{t}</p></li>
          ))}
        </ol>

        <h2>Private Jigsaw Puzzles for Family and Friends</h2>
        <p>A puzzle made from your photo is just for you by default: it is saved in Your Photos and nobody else can find it. Want to share it? Choose a private link instead. Only people you send the link to can open it, and it never appears on Mind Loft or in search results. Everyone you send it to picks their own size, so the same picture works as a quick 48 piece puzzle for a grandchild and a 1,000 piece one for a jigsaw fan. It makes an easy gift for a birthday, a holiday card or a family reunion.</p>

        <h2>How Many Pieces Can My Photo Have?</h2>
        <div className="pz-card" style={{ padding: 0, overflow: 'hidden' }}>
          {SIZES.map(([p, m]) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(244,234,216,.16)', fontSize: 15 }}><b>{p}</b><span style={{ color: 'rgba(244,234,216,.72)', textAlign: 'right' }}>{m}</span></div>
          ))}
        </div>

        <h2>Community Photo Jigsaw Puzzles</h2>
        <p>Players can also submit a photo to <a href="/jig/shelf?tab=community">Community Photos</a>. Each one is reviewed before it goes up, then gets its own puzzle page: pets, home cooking, hometowns and trips, all free to play at any size. Looking for more? Every past <a href="/jig/shelf">daily jigsaw photo</a> is free at 24 to 4,000 pieces, and the <a href="/mural">Mural</a> is a 4,000 piece jigsaw the whole site builds together.</p>

        <h2>Questions</h2>
        <div className="pz-faq">
          {FAQ.map(([q, a]) => <div key={q}><h3>{q}</h3><p>{a}</p></div>)}
        </div>

        <p className="pz-foot"><a href="/jig/shelf">All jigsaw puzzles</a><a href="/jig">Today&apos;s Jig</a><a href="/guides">Puzzle Guides</a><a href="/cognitive-health/jigsaw-puzzles-and-the-brain">Jigsaw Puzzles and the Brain</a></p>
      </div>
    </div>
  );
}
