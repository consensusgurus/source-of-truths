import { notFound } from 'next/navigation';
import CircuitFrame from '../../../circuits/CircuitFrame';
import PageViewBeacon from '../../../PageViewBeacon';
import { SITE_URL } from '@/lib/site';
import { gameColor, softGround } from '@/lib/category-ramp';
import { topicBySlug } from '@/lib/jigsaw-topics';
import { focusStyle } from '@/lib/photo-focus';
import { pastJigsaws, topicCounts, TOPIC_MIN, etToday } from '@/lib/jigsaw-library';

// /jig/shelf/<topic>: JIGSAW TOPIC PAGES (SEO pass, 2026-11-21). Every past Jig
// and Saw photo on one topic (Animals, Landscapes, Cities and Landmarks,
// Flowers, Food), each a real link to its own archived board, so the pages can
// rank for "animal jigsaw puzzles" and the like. All server HTML: no script is
// needed to see or follow a single link. A topic under TOPIC_MIN past photos
// opens as noindex and is left out of the sitemap and the shelf's links.

export const dynamic = 'force-dynamic';

const JIG_HUE = softGround(gameColor('jig'));
const GNAME = { jig: 'Jig', saw: 'Saw' };

function licenceUrl(lic) {
  if (lic === 'CC0') return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (lic === 'Public domain') return 'https://creativecommons.org/publicdomain/mark/1.0/';
  const m = /^CC (BY(?:-SA)?) (\d\.\d)/.exec(lic || '');
  return m ? `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/` : null;
}

export function generateMetadata({ params }) {
  const t = topicBySlug(params.topic);
  if (!t) return {};
  const n = pastJigsaws().filter((b) => b.topic === t.slug).length;
  const url = `/jig/shelf/${t.slug}`;
  return {
    title: t.title,
    description: t.blurb,
    alternates: { canonical: url },
    ...(n < TOPIC_MIN ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title: `${t.h1}, Free Online`, description: t.blurb, url, type: 'website', siteName: 'Mind Loft', images: [{ url: '/og/jig-shelf.png', width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: `${t.h1}, Free Online`, description: t.blurb, images: ['/og/jig-shelf.png'] },
  };
}

export default function JigsawTopicPage({ params }) {
  const t = topicBySlug(params.topic);
  if (!t) notFound();
  const today = etToday();
  const boards = pastJigsaws(today).filter((b) => b.topic === t.slug);
  const others = topicCounts(today).filter((o) => o.slug !== t.slug && o.indexed);
  const counts = { jig: boards.filter((b) => b.g === 'jig').length, saw: boards.filter((b) => b.g === 'saw').length };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.h1,
    description: t.blurb,
    url: `${SITE_URL}/jig/shelf/${t.slug}`,
    isPartOf: { '@type': 'WebSite', name: 'Mind Loft', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      name: t.h1,
      numberOfItems: boards.length,
      itemListElement: boards.map((b, i) => {
        const lic = licenceUrl(b.lic);
        return {
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/${b.g}?p=${b.n}`,
          item: {
            '@type': 'ImageObject',
            name: `${b.name}, a free ${b.c * b.r} piece jigsaw puzzle`,
            caption: b.name,
            contentUrl: b.own ? `${SITE_URL}/api/jig/img?n=${b.n}` : `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(b.t)}`,
            ...(b.own ? {} : { acquireLicensePage: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(b.t.replace(/ /g, '_'))}` }),
            creditText: b.own ? b.credit : `${b.by}, Wikimedia Commons`,
            creator: { '@type': 'Person', name: b.by },
            ...(lic ? { license: lic } : {}),
            datePublished: b.d,
          },
        };
      }),
    },
  };
  const crumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Jigsaw Puzzle Shelf', item: `${SITE_URL}/jig/shelf` },
      { '@type': 'ListItem', position: 3, name: t.h1 },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      <PageViewBeacon id={`jig-topic-${t.slug}`} />
      <CircuitFrame cat="Visual" label="Jigsaw shelf" wide bar={{ title: t.label, sub: 'Jigsaw Puzzle Shelf', dot: JIG_HUE }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <nav className="jtp-crumb" aria-label="Breadcrumb">
          <a href="/">Home</a><span aria-hidden="true">/</span>
          <a href="/jig/shelf">Jigsaw Puzzle Shelf</a><span aria-hidden="true">/</span>
          <span aria-current="page">{t.label}</span>
        </nav>
        <header className="jtp-head">
          <h1>{t.h1}</h1>
          <p className="jtp-lede">{t.blurb} {boards.length} so far, free to play with no download or signup.</p>
          <div className="jtp-todays">
            <a href="/jig">Play today’s Jig</a>
            <a href="/saw">Play today’s Saw</a>
          </div>
        </header>

        {boards.length ? (
          <ul className="jtp-grid">
            {boards.map((b) => (
              <li key={`${b.g}-${b.n}`}>
                <a className={`jtp-card ${b.g}`} href={`/${b.g}?p=${b.n}`}>
                  <img src={`/api/${b.g}/img?n=${b.n}&w=500`} style={focusStyle(b.g, b.n)} alt={`${b.name}, ${GNAME[b.g]} jigsaw puzzle`} loading="lazy" width="500" height="333" />
                  <span className="jtp-name">{b.name}</span>
                  <span className="jtp-sub">{b.c * b.r} pieces · {b.g === 'saw' ? 'Tall' : 'Wide'} · {GNAME[b.g]} No. {b.n}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : <p className="jtp-none">No puzzles in this topic yet. A new photo opens every day.</p>}

        {others.length ? (
          <nav className="jtp-more" aria-label="More jigsaw topics">
            <h2>More jigsaw puzzles</h2>
            <div>
              <a href="/jig/shelf">Every jigsaw</a>
              {others.map((o) => <a key={o.slug} href={o.href}>{o.label} <b>{o.count}</b></a>)}
              <a href="/mural">4,000 piece Mural</a>
              <a href="/kids/jigsaw">Kids jigsaws</a>
            </div>
          </nav>
        ) : null}

        <p className="jtp-foot">
          {boards.length} {t.label.toLowerCase()} jigsaw puzzles ({counts.jig} wide Jig, {counts.saw} tall Saw). Every photo is a featured
          picture from <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a>, credited when you finish it.
          A new Jig and a new Saw open every day at midnight Eastern.
        </p>
      </CircuitFrame>
    </>
  );
}

// Tokens only, no backticks or apostrophes (see ShelfClient.jsx on the escaping trap).
const CSS = `
:root{--jtp-hue:${JIG_HUE};--jtp-ink:#0b0d12;}
.jtp-crumb{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12.5px;font-weight:700;color:var(--stg-mute);margin-bottom:14px;}
.jtp-crumb a{color:var(--stg-ink2);text-decoration:none;}
.jtp-crumb a:hover{color:var(--stg-ink);text-decoration:underline;}
.jtp-crumb span[aria-current]{color:var(--stg-ink);}
.jtp-head{margin-bottom:20px;}
.jtp-head h1{margin:0;font-size:32px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;color:var(--stg-ink);}
.jtp-lede{margin:8px 0 0;max-width:700px;font-size:15px;line-height:1.5;font-weight:600;color:var(--stg-ink2);}
.jtp-todays{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;}
.jtp-todays a{font-size:14px;font-weight:800;padding:10px 18px;border-radius:10px;background:var(--jtp-hue);color:var(--jtp-ink);text-decoration:none;}
.jtp-todays a:hover{filter:brightness(1.06);}
.jtp-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;}
.jtp-card{display:flex;flex-direction:column;gap:4px;padding:8px 8px 12px;border:1px solid var(--stg-ink);border-radius:12px;background:var(--stg-surf);color:var(--stg-ink);text-decoration:none;height:100%;box-sizing:border-box;}
.jtp-card:hover{transform:translateY(-2px);}
.jtp-card img{width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;border-radius:7px;display:block;background:var(--stg-surf2);}
.jtp-name{font-size:14.5px;font-weight:800;line-height:1.4;padding:2px 2px 0;}
.jtp-sub{font-size:12px;font-weight:700;line-height:1.4;color:var(--stg-mute);padding:0 2px;}
.jtp-none{font-size:15px;font-weight:700;color:var(--stg-mute);padding:24px 0;}
.jtp-more{margin-top:30px;}
.jtp-more h2{margin:0 0 10px;font-size:18px;font-weight:800;color:var(--stg-ink);}
.jtp-more div{display:flex;flex-wrap:wrap;gap:8px;}
.jtp-more a{font-size:13px;font-weight:800;padding:8px 13px;border-radius:999px;background:var(--stg-surf);color:var(--stg-ink2);border:1px solid var(--stg-line);text-decoration:none;}
.jtp-more a:hover{border-color:var(--stg-ink);color:var(--stg-ink);}
.jtp-more a b{font-weight:800;color:var(--stg-mute);margin-left:3px;}
.jtp-foot{margin:22px 0 0;font-size:13.5px;line-height:1.55;font-weight:600;color:var(--stg-mute);max-width:760px;}
.jtp-foot a{color:var(--stg-ink);font-weight:800;}
@media (max-width:640px){.jtp-head h1{font-size:26px;}.jtp-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}.jtp-name{font-size:13px;}}
`;
