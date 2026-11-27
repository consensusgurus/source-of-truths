import PhotoBoard from './PhotoBoard';
import { PHOTO_CSS } from './photo-css';
import { JIGSAW_SIZES, cutFor, sizeLabel } from '@/lib/jigsaw-sizes';
import { imgSrc, topicLabel } from '@/lib/photo-puzzle-shared';

// One page for a player's own photo as a jigsaw (YOUR PHOTO JIGSAWS, owner 2026-11-27), used by
// the private link (/jigsaw/p/<code>) and an approved Community Photo (/jigsaw/community/<slug>).
// With ?pieces=N it is the board; without, the picture and the size choice (sizes the photo is
// too small for are greyed, the portal's rule).
export default function PhotoPage({ meta, base, pieces, community, related = [] }) {
  const size = JIGSAW_SIZES.includes(pieces) && pieces <= meta.max ? pieces : 0;
  const by = meta.by || (community ? 'a Mind Loft player' : '');
  if (size) {
    const cut = cutFor(size, meta.w, meta.h);
    const photo = {
      g: 'photo', n: 0, src: imgSrc(meta.code), key: `photo-${meta.code}-${size}`, id: `photo-own-${meta.code}-${size}`,
      size, cols: cut.cols, rows: cut.rows, name: meta.name, by, lic: '',
    };
    const n = (cut.cols * cut.rows).toLocaleString('en-US');
    return (
      <>
        <section className="pz-bprose" style={{ fontFamily: 'Manrope,system-ui,sans-serif' }}>
          <h1 style={{ margin: '0 0 8px' }}>{meta.name}: a {n} piece jigsaw puzzle</h1>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            {community ? `A free online jigsaw puzzle from a photo shared by ${by}` : `A private jigsaw puzzle${by ? ` made by ${by}` : ''}`}, cut into {n} pieces.
            Drag a piece from the tray onto its spot, or tap the piece and then the spot. Your progress is kept in this browser.
            {' '}<a href={base}>Pick another size</a> or <a href="/jigsaw/make-your-own">make one from your own photo</a>.
          </p>
        </section>
        <PhotoBoard photo={photo} />
      </>
    );
  }
  const start = Math.min(meta.pieces || 150, meta.max);
  return (
    <div className="pz">
      <style dangerouslySetInnerHTML={{ __html: PHOTO_CSS }} />
      <div className="pz-in">
        <nav className="pz-crumb" aria-label="Breadcrumb">
          <a href="/">Home</a><span aria-hidden="true">/</span><a href="/jig/shelf">Jigsaw Puzzles</a><span aria-hidden="true">/</span>
          {community ? <><a href="/jig/shelf?tab=community">Community Photos</a><span aria-hidden="true">/</span></> : null}
          <span aria-current="page">{meta.name}</span>
        </nav>
        <span className="pz-eyb">{community ? `Community Photo · ${topicLabel(meta.topic)}` : meta.scope === 'me' ? 'Your Photos · just for you' : 'A private puzzle for you'}</span>
        <h1>{community ? `${meta.name} Jigsaw Puzzle` : meta.scope === 'me' ? `${meta.name}: your jigsaw puzzle` : `${by || 'Someone'} made you a jigsaw puzzle`}</h1>
        <p className="pz-lede">
          {community
            ? `A free online jigsaw puzzle of ${meta.name}, from a photo shared by ${by}. Play it at any size up to ${sizeLabel(meta.max)} pieces, in your browser, with no download and no signup.`
            : meta.scope === 'me' ? 'Made from your photo and kept just for you. Pick a size and start.' : `${meta.name}, made from a photo and shared with you by link. No signup needed: pick a size and start. Only people with this link can open it.`}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pz-pic" src={`${imgSrc(meta.code)}&w=1280`} alt={`${meta.name}, a photo jigsaw puzzle`} width={meta.w} height={meta.h} />
        <h2 id="pz-sz">How many pieces?</h2>
        <div className="pz-sizes" role="group" aria-labelledby="pz-sz">
          {JIGSAW_SIZES.map((s) => (s <= meta.max
            ? <a key={s} href={`${base}?pieces=${s}`} className={s === start ? 'on' : ''} rel={community ? undefined : 'nofollow'}>{sizeLabel(s)}<small>pieces</small></a>
            : <span key={s} aria-disabled="true" title="This photo does not have the detail for this many pieces">{sizeLabel(s)}<small>too few pixels</small></span>))}
        </div>
        {meta.max < JIGSAW_SIZES[JIGSAW_SIZES.length - 1] ? <p className="pz-note">Sizes greyed out would cut this photo too fine to stay sharp.</p> : null}
        <div className="pz-row">
          <a className="pz-btn" href={`${base}?pieces=${start}`} rel={community ? undefined : 'nofollow'}>Start at {sizeLabel(start)} pieces</a>
          <a className="pz-btn ghost" href="/jigsaw/make-your-own">Make One From Your Photo</a>
        </div>
        {related.length ? (
          <>
            <h2>More Community Photo Jigsaw Puzzles</h2>
            <ul className="pz-grid">
              {related.map((r) => (
                <li key={r.code}>
                  <a href={`/jigsaw/community/${r.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${imgSrc(r.code)}&w=500`} alt={`${r.name} jigsaw puzzle`} loading="lazy" />
                    <b>{r.name}</b><i>Shared by {r.by || 'a Mind Loft player'}</i>
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="pz-foot">
          <a href="/jig/shelf">All jigsaw puzzles</a>
          <a href="/jig/shelf?tab=community">Community Photos</a>
          <a href="/jig">Today&apos;s Jig</a>
          {!community ? <span>Something wrong with this photo? Email m@mindloftdaily.com with the link.</span> : null}
        </p>
      </div>
    </div>
  );
}
