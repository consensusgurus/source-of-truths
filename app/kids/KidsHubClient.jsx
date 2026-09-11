'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Footer from '../Footer';
import { formatCount } from '../Count';
import { T } from '@/lib/theme';
import { KIDS_DAILIES, kidsDayNumber, kidsDateLabel } from '@/lib/kids-daily';
import { KidsHeader, KIDS_CSS, useKidsDone, SHAPES } from './KidsShell';

const Eye = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
);

// Kids Corner hub. Lists the playable matching games as tiles; each runs on the
// shared MatchGame engine. New games drop in as ACTIVITIES entries. Styled to
// match the live site (Manrope, #f7f8fa surface, white cards, accent #233a63).
const C = { ink: T.ink, accent: T.accent, muted: T.muted, soft: T.muted, line: 'rgba(20,22,28,0.30)' };
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

const PREVIEW = [
  '<svg viewBox="0 0 100 100"><g><path d="M50 16 L78 78 H22 Z" fill="#f4d58a"/><path d="M22 78 H78 l-4 -9 H26 z" fill="#e0a85a"/><circle cx="44" cy="52" r="5" fill="#c0392b"/><circle cx="58" cy="60" r="5" fill="#c0392b"/><circle cx="50" cy="36" r="4" fill="#c0392b"/></g></svg>',
  '<svg viewBox="0 0 100 100"><g><path d="M38 50 h24 l-12 34 z" fill="#e0b070"/><circle cx="50" cy="40" r="18" fill="#f7a6c4"/><circle cx="50" cy="22" r="4" fill="#c0392b"/></g></svg>',
  '<svg viewBox="0 0 100 100"><g><rect x="16" y="40" width="68" height="22" rx="11" fill="#e7b96a"/><rect x="22" y="46" width="56" height="12" rx="6" fill="#c0392b"/><path d="M26 52 q6 -6 12 0 q6 6 12 0 q6 -6 12 0 q6 6 10 0" fill="none" stroke="#f2c14e" stroke-width="3" stroke-linecap="round"/></g></svg>',
];

const PIZZA_PREVIEW = [
  '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#e0a85a"/><circle cx="50" cy="50" r="33" fill="#f4d58a"/><g fill="#c0392b"><circle cx="40" cy="40" r="5.5"/><circle cx="60" cy="42" r="5.5"/><circle cx="50" cy="54" r="5.5"/><circle cx="38" cy="60" r="5.5"/><circle cx="62" cy="60" r="5.5"/></g></svg>',
  '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#e0a85a"/><circle cx="50" cy="50" r="33" fill="#f4d58a"/><g fill="#bda079"><ellipse cx="42" cy="44" rx="6" ry="4"/><rect x="40" y="46" width="4" height="5" rx="1"/><ellipse cx="60" cy="50" rx="6" ry="4"/><rect x="58" y="52" width="4" height="5" rx="1"/><ellipse cx="48" cy="62" rx="6" ry="4"/><rect x="46" y="64" width="4" height="5" rx="1"/></g></svg>',
  '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#e0a85a"/><circle cx="50" cy="50" r="33" fill="#7a9a4a"/><g fill="#e6dba0"><circle cx="42" cy="44" r="2.5"/><circle cx="58" cy="46" r="2.5"/><circle cx="48" cy="58" r="2.5"/><circle cx="61" cy="58" r="2.5"/></g><circle cx="52" cy="49" r="4.5" fill="#ffffff" opacity="0.85"/></svg>',
];

const DOG_PREVIEW = [
  '<svg viewBox="0 0 100 100"><ellipse cx="28" cy="46" rx="10" ry="18" fill="#c8893a"/><ellipse cx="72" cy="46" rx="10" ry="18" fill="#c8893a"/><circle cx="50" cy="48" r="26" fill="#e0a24e"/><ellipse cx="50" cy="62" rx="13" ry="11" fill="#efc480"/><circle cx="50" cy="58" r="3.5" fill="#3a2a1a"/><circle cx="41" cy="44" r="3" fill="#3a2a1a"/><circle cx="59" cy="44" r="3" fill="#3a2a1a"/></svg>',
  '<svg viewBox="0 0 100 100"><ellipse cx="26" cy="44" rx="9" ry="16" fill="#2a2a2a"/><ellipse cx="74" cy="44" rx="9" ry="16" fill="#cfcfcf"/><circle cx="50" cy="48" r="26" fill="#fafafa"/><ellipse cx="50" cy="62" rx="13" ry="11" fill="#ffffff"/><circle cx="50" cy="58" r="3.5" fill="#2a2a2a"/><circle cx="41" cy="44" r="3" fill="#2a2a2a"/><circle cx="59" cy="44" r="3" fill="#2a2a2a"/><g fill="#2a2a2a"><circle cx="38" cy="54" r="3"/><circle cx="62" cy="50" r="2.5"/><circle cx="58" cy="64" r="2.5"/></g></svg>',
  '<svg viewBox="0 0 100 100"><path d="M30 32 l-7 -18 16 9z" fill="#5f6772"/><path d="M70 32 l7 -18 -16 9z" fill="#5f6772"/><circle cx="50" cy="50" r="26" fill="#8b95a0"/><path d="M50 28 q-9 8 -9 22 q0 8 9 14 q9 -6 9 -14 q0 -14 -9 -22z" fill="#f2f5f8"/><ellipse cx="50" cy="62" rx="8" ry="7" fill="#f2f5f8"/><circle cx="50" cy="58" r="3" fill="#2a2a2a"/><circle cx="42" cy="48" r="2.8" fill="#3a6a9a"/><circle cx="58" cy="48" r="2.8" fill="#3a6a9a"/></svg>',
];

const ADD_PREVIEW = [
  '<svg viewBox="0 0 100 100"><text x="50" y="55" font-size="30" font-family="Manrope, system-ui, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#0b0d12">1+1</text></svg>',
  '<svg viewBox="0 0 100 100"><text x="50" y="55" font-size="56" font-family="Manrope, system-ui, sans-serif" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#233a63">2</text></svg>',
  '<svg viewBox="0 0 100 100"><text x="50" y="55" font-size="30" font-family="Manrope, system-ui, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#0b0d12">3+4</text></svg>',
];

const LETTER_PREVIEW = [
  '<svg viewBox="0 0 100 100"><text x="50" y="56" font-size="62" font-family="Manrope, system-ui, sans-serif" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#0b0d12">A</text></svg>',
  '<svg viewBox="0 0 100 100"><text x="50" y="56" font-size="62" font-family="Manrope, system-ui, sans-serif" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#233a63">a</text></svg>',
  '<svg viewBox="0 0 100 100"><text x="50" y="56" font-size="62" font-family="Manrope, system-ui, sans-serif" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#0b0d12">B</text></svg>',
];

const COLOR_PREVIEW = [
  '<svg viewBox="0 0 100 100"><text x="50" y="55" font-size="26" font-family="Manrope, system-ui, sans-serif" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#0b0d12">Red</text></svg>',
  '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="33" fill="#e23b3b"/></svg>',
  '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="33" fill="#14294d"/></svg>',
];

const FANTASY_PREVIEW = [
  '<svg viewBox="0 0 100 100"><path d="M40 86 L36 56 Q34 40 47 33 L41 30 Q45 24 53 27 L57 18 Q61 27 56 35 Q70 41 70 58 L66 86 Z" fill="#fdfdff" stroke="#e8e2ee" stroke-width="1.5"/><path d="M55 13 L61 31 L47 31 Z" fill="#f3c14e"/><path d="M58 31 Q77 37 72 60 Q70 74 59 82 Q68 65 59 49 Q57 39 58 31 Z" fill="#ef6ea0"/><circle cx="49" cy="46" r="3" fill="#3a2a3a"/></svg>',
  '<svg viewBox="0 0 100 100"><path d="M50 54 L80 92 L20 92 Z" fill="#ee6fae"/><path d="M30 42 Q30 66 39 80 L35 52 Q35 36 50 33 Q65 36 65 52 L61 80 Q70 66 70 42 Q70 21 50 21 Q30 21 30 42 Z" fill="#6b4423"/><circle cx="50" cy="43" r="15" fill="#f6cba0"/><path d="M37 30 L41 23 L46 30 L50 21 L54 30 L59 23 L63 30 Z" fill="#f3c14e"/><circle cx="44" cy="43" r="1.8" fill="#3a2a2a"/><circle cx="56" cy="43" r="1.8" fill="#3a2a2a"/></svg>',
  '<svg viewBox="0 0 100 100"><path d="M56 44 Q82 30 88 56 Q76 50 66 60 Q74 46 56 44 Z" fill="#a82d2d"/><path d="M28 72 Q20 62 28 50 Q36 38 56 42 Q68 45 70 57 Q70 67 60 72 L63 82 L54 74 Q42 78 36 73 L33 82 Z" fill="#d83b3b"/><path d="M24 60 L32 56 L31 66 Z" fill="#d83b3b"/><path d="M46 40 L49 30 L52 40 Z" fill="#f0e0c0"/><path d="M56 40 L60 31 L62 41 Z" fill="#f0e0c0"/><circle cx="40" cy="54" r="3" fill="#2a1a1a"/></svg>',
];

const WORD_PREVIEW = [
  '<svg viewBox="0 0 100 100"><text x="50" y="55" font-size="26" font-family="Manrope, system-ui, sans-serif" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#0b0d12">Dog</text></svg>',
  '<svg viewBox="0 0 100 100"><ellipse cx="30" cy="48" rx="9" ry="16" fill="#a06a2e"/><ellipse cx="70" cy="48" rx="9" ry="16" fill="#a06a2e"/><circle cx="50" cy="50" r="24" fill="#c8893a"/><ellipse cx="50" cy="62" rx="12" ry="10" fill="#e8c08a"/><circle cx="50" cy="58" r="3.5" fill="#2a1a0a"/><circle cx="42" cy="46" r="3" fill="#2a1a0a"/><circle cx="58" cy="46" r="3" fill="#2a1a0a"/></svg>',
  '<svg viewBox="0 0 100 100"><g stroke="#f5b800" stroke-width="4" stroke-linecap="round"><path d="M50 14 V24"/><path d="M50 76 V86"/><path d="M14 50 H24"/><path d="M76 50 H86"/><path d="M24 24 l7 7"/><path d="M69 69 l7 7"/><path d="M76 24 l-7 7"/><path d="M31 69 l-7 7"/></g><circle cx="50" cy="50" r="18" fill="#f5c518"/></svg>',
];

const NUMBER_PREVIEW = [
  '<svg viewBox="0 0 100 100"><text x="50" y="55" font-size="54" font-family="Manrope, system-ui, sans-serif" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#233a63">7</text></svg>',
  '<svg viewBox="0 0 100 100"><text x="50" y="55" font-size="22" font-family="Manrope, system-ui, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#0b0d12">Seven</text></svg>',
  '<svg viewBox="0 0 100 100"><text x="50" y="55" font-size="54" font-family="Manrope, system-ui, sans-serif" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#233a63">3</text></svg>',
];

const ACTIVITIES = [
  { id: 'memory-match', href: '/kids/memory-match', title: 'Treats Match', desc: 'Flip the cards and find the matching treats. Up to four players.', tag: 'Game', ready: true, band: '#eef3fe', preview: PREVIEW },
  { id: 'pizza-match', href: '/kids/pizza-match', title: 'Pizza Match', desc: 'Find all fourteen matching pizzas. Up to four players.', tag: 'Game', ready: true, band: '#fdeede', preview: PIZZA_PREVIEW },
  { id: 'dog-match', href: '/kids/dog-match', title: 'Dog Match', desc: 'Find all fourteen matching dog breeds. Up to four players.', tag: 'Game', ready: true, band: '#eaf6ef', preview: DOG_PREVIEW },
  { id: 'color-match', href: '/kids/color-match', title: 'Color Match', desc: 'Match each color word to its color. Ten pairs.', tag: 'Learning', ready: true, band: '#fdeaea', preview: COLOR_PREVIEW },
  { id: 'addition-match', href: '/kids/addition-match', title: 'Addition Match', desc: 'Match each addition to its answer. Fourteen pairs.', tag: 'Learning', ready: true, band: '#eef3fe', preview: ADD_PREVIEW },
  { id: 'letter-match', href: '/kids/letter-match', title: 'Letter Match', desc: 'Match capital and lowercase letters. Twenty-six pairs.', tag: 'Learning', ready: true, band: '#fde7f0', preview: LETTER_PREVIEW },
  { id: 'fantasy-match', href: '/kids/fantasy-match', title: 'Fantasy Match', desc: 'Match unicorns, princesses, princes, castles, and dragons. Fifteen pairs.', tag: 'Game', ready: true, band: '#f1ecfb', preview: FANTASY_PREVIEW },
  { id: 'word-match', href: '/kids/word-match', title: 'Word Match', desc: 'Match each word to its picture. Twelve pairs.', tag: 'Learning', ready: true, band: '#e7f6ef', preview: WORD_PREVIEW },
  { id: 'number-match', href: '/kids/number-match', title: 'Number Match', desc: 'Match each number to its spelling, 0 to 15. Sixteen pairs.', tag: 'Learning', ready: true, band: '#eef3fe', preview: NUMBER_PREVIEW },
];

function Tile({ a }) {
  const inner = (
    <div className="kc-tile">
      <div className="kc-band" style={{ background: a.band }}>
        {a.preview ? (
          <div className="kc-prev">
            {a.preview.map((svg, i) => (
              <span key={i} className="kc-prevcard" dangerouslySetInnerHTML={{ __html: svg }} />
            ))}
          </div>
        ) : (
          <span className="kc-icon" dangerouslySetInnerHTML={{ __html: a.icon }} />
        )}
        <span className={`kc-pill${a.ready ? ' on' : ''}`}>{a.ready ? 'Play' : 'Coming soon'}</span>
      </div>
      <div className="kc-body">
        <span className="kc-tag">{a.tag}</span>
        <h3 className="kc-title">{a.title}</h3>
        <p className="kc-desc">{a.desc}</p>
      </div>
    </div>
  );
  if (a.ready && a.href) return <Link href={a.href} className="kc-link">{inner}</Link>;
  return <div className="kc-link kc-soft" aria-disabled="true">{inner}</div>;
}

// Little pictures for the seven daily tiles, drawn inline so the hub needs no image.
const DAILY_ART = {
  sixes: `<svg viewBox="0 0 76 76"><g fill="#fff" stroke="#b9d2ff" stroke-width="2"><rect x="4" y="4" width="22" height="22" rx="5"/><rect x="27" y="4" width="22" height="22" rx="5"/><rect x="50" y="4" width="22" height="22" rx="5"/><rect x="4" y="27" width="22" height="22" rx="5"/><rect x="27" y="27" width="22" height="22" rx="5"/><rect x="50" y="27" width="22" height="22" rx="5"/><rect x="4" y="50" width="22" height="22" rx="5"/><rect x="27" y="50" width="22" height="22" rx="5"/><rect x="50" y="50" width="22" height="22" rx="5"/></g><g transform="translate(8,8) scale(.35)">${SHAPES[1].replace(/<\/?svg[^>]*>/g, '')}</g><g transform="translate(54,8) scale(.35)">${SHAPES[2].replace(/<\/?svg[^>]*>/g, '')}</g><g transform="translate(31,31) scale(.35)">${SHAPES[4].replace(/<\/?svg[^>]*>/g, '')}</g><g transform="translate(8,54) scale(.35)">${SHAPES[5].replace(/<\/?svg[^>]*>/g, '')}</g><g transform="translate(54,54) scale(.35)">${SHAPES[3].replace(/<\/?svg[^>]*>/g, '')}</g></svg>`,
  pals: '<svg viewBox="0 0 76 76"><g fill="#fff" stroke="#f3c2c4" stroke-width="2"><rect x="4" y="4" width="13" height="13" rx="3"/><rect x="18" y="4" width="13" height="13" rx="3"/><rect x="32" y="4" width="13" height="13" rx="3"/><rect x="46" y="4" width="13" height="13" rx="3"/><rect x="60" y="4" width="13" height="13" rx="3"/><rect x="4" y="18" width="13" height="13" rx="3"/><rect x="60" y="18" width="13" height="13" rx="3"/><rect x="4" y="32" width="13" height="13" rx="3"/><rect x="60" y="32" width="13" height="13" rx="3"/><rect x="4" y="46" width="13" height="13" rx="3"/><rect x="18" y="46" width="13" height="13" rx="3"/><rect x="46" y="46" width="13" height="13" rx="3"/><rect x="60" y="46" width="13" height="13" rx="3"/><rect x="4" y="60" width="13" height="13" rx="3"/><rect x="18" y="60" width="13" height="13" rx="3"/><rect x="32" y="60" width="13" height="13" rx="3"/><rect x="46" y="60" width="13" height="13" rx="3"/><rect x="60" y="60" width="13" height="13" rx="3"/></g><g fill="#ff5a5f"><rect x="18" y="18" width="13" height="13" rx="3"/><rect x="32" y="18" width="13" height="13" rx="3"/><rect x="46" y="18" width="13" height="13" rx="3"/><rect x="18" y="32" width="13" height="13" rx="3"/><rect x="32" y="32" width="13" height="13" rx="3"/><rect x="46" y="32" width="13" height="13" rx="3"/><rect x="32" y="46" width="13" height="13" rx="3"/></g></svg>',
  mixup: '<svg viewBox="0 0 110 50"><g font-family="Fredoka,sans-serif" font-weight="700" font-size="22" fill="#1b1f3b" text-anchor="middle"><rect x="2" y="6" width="30" height="36" rx="8" fill="#fff" stroke="#f1d58a" stroke-width="2" transform="rotate(-8 17 24)"/><text x="17" y="32" transform="rotate(-8 17 24)">T</text><rect x="40" y="6" width="30" height="36" rx="8" fill="#fff" stroke="#f1d58a" stroke-width="2" transform="rotate(5 55 24)"/><text x="55" y="32" transform="rotate(5 55 24)">A</text><rect x="78" y="6" width="30" height="36" rx="8" fill="#fff" stroke="#f1d58a" stroke-width="2" transform="rotate(-4 93 24)"/><text x="93" y="32" transform="rotate(-4 93 24)">C</text></g></svg>',
  sortit: '<svg viewBox="0 0 96 64"><g font-family="Fredoka,sans-serif" font-weight="600" font-size="11" fill="#1b1f3b" text-anchor="middle"><rect x="2" y="2" width="44" height="18" rx="6" fill="#e9f1ff" stroke="#b9d2ff" stroke-width="2"/><text x="24" y="15">cow</text><rect x="50" y="2" width="44" height="18" rx="6" fill="#fff" stroke="#bfe7d1" stroke-width="2"/><text x="72" y="15">apple</text><rect x="2" y="23" width="44" height="18" rx="6" fill="#fff" stroke="#bfe7d1" stroke-width="2"/><text x="24" y="36">kite</text><rect x="50" y="23" width="44" height="18" rx="6" fill="#e9f1ff" stroke="#b9d2ff" stroke-width="2"/><text x="72" y="36">pig</text><rect x="2" y="44" width="44" height="18" rx="6" fill="#e9f1ff" stroke="#b9d2ff" stroke-width="2"/><text x="24" y="57">hen</text><rect x="50" y="44" width="44" height="18" rx="6" fill="#fff" stroke="#bfe7d1" stroke-width="2"/><text x="72" y="57">bee</text></g></svg>',
  ladder: '<svg viewBox="0 0 100 70"><g font-family="Fredoka,sans-serif" font-weight="700" font-size="16" text-anchor="middle"><rect x="4" y="4" width="92" height="26" rx="8" fill="#3bb273"/><text x="50" y="23" fill="#fff">D O G</text><rect x="4" y="40" width="92" height="26" rx="8" fill="#1b1f3b"/><text x="50" y="59" fill="#fff">C A T</text></g></svg>',
  unpark: '<svg viewBox="0 0 76 76"><rect x="4" y="4" width="68" height="68" rx="10" fill="#f3ecd8" stroke="#1b1f3b" stroke-width="4"/><rect x="8" y="30" width="30" height="14" rx="6" fill="#ff5a5f"/><rect x="44" y="10" width="14" height="34" rx="6" fill="#3a86ff"/><rect x="10" y="50" width="30" height="14" rx="6" fill="#3bb273"/><rect x="58" y="48" width="12" height="20" rx="6" fill="#ffd23f"/><path d="M72 30v14" stroke="#f3ecd8" stroke-width="6"/></svg>',
  mathdash: '<svg viewBox="0 0 110 50"><g font-family="Fredoka,sans-serif" font-weight="700" font-size="26" fill="#1b1f3b" text-anchor="middle"><text x="55" y="34">7 + 5 = <tspan fill="#3a86ff">?</tspan></text></g></svg>',
};

function DailyTile({ g, done }) {
  return (
    <Link href={g.href} className="kc-link">
      <div className={`kc-tile kc-daily${done ? ' done' : ''}`}>
        <div className="kc-band" style={{ background: g.band }}>
          <span className="kc-icon kc-dart" dangerouslySetInnerHTML={{ __html: DAILY_ART[g.key] }} />
          <span className={`kc-pill on${done ? ' ok' : ''}`}>{done ? 'Done today' : 'Play'}</span>
        </div>
        <div className="kc-body">
          <span className="kc-tag">Today&apos;s puzzle</span>
          <h3 className="kc-title">{g.title}</h3>
          <p className="kc-desc">{g.tag}</p>
          <span className="kc-from">grown-up version: <i>{g.from}</i></span>
        </div>
      </div>
    </Link>
  );
}

export default function KidsHubClient() {
  const [views, setViews] = useState(null);
  const [day, setDay] = useState(null);
  const [done] = useKidsDone(day ? day.key : '');
  useEffect(() => {
    // The day is read in an effect, never during render: the server does not
    // know Eastern today and a mismatch would throw on hydration.
    try {
      const key = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      setDay({ key, num: kidsDayNumber(key), label: kidsDateLabel(key) });
    } catch (e) { setDay(null); }
    let on = true;
    fetch('/api/quiz/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: 'kids' }) })
      .then((r) => r.json())
      .then((d) => { if (on && d && typeof d.count === 'number') setViews(d.count); })
      .catch(() => {});
    return () => { on = false; };
  }, []);
  return (
    <div className="kd">
      <style dangerouslySetInnerHTML={{ __html: KIDS_CSS }} />
      <div className="kd-wrap">
        <style>{`
          .kc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-top:16px;}
          .kc-link{text-decoration:none;color:inherit;display:block;}
          .kc-tile{height:100%;background:var(--kpaper);border:2px solid var(--kline);border-radius:22px;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--kshadow);transition:transform .15s,border-color .15s;}
          .kc-link:hover .kc-tile{transform:translateY(-3px);border-color:var(--kink);}
          .kc-band{position:relative;height:120px;display:flex;align-items:center;justify-content:center;}
          .kc-prev{display:flex;gap:10px;}
          .kc-prevcard{width:54px;height:54px;background:var(--kpaper);border:1px solid ${C.line};border-radius:11px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(20,22,28,0.08);}
          .kc-prevcard svg{width:70%;height:70%;}
          .kc-icon{width:64px;height:64px;display:flex;}
          .kc-icon svg{width:100%;height:100%;}
          .kc-icon.kc-dart{width:110px;height:76px;align-items:center;justify-content:center}
          .kc-icon.kc-dart svg{max-width:100%;max-height:100%;width:auto;height:auto}
          .kc-pill{position:absolute;top:10px;right:10px;font-family:var(--kdisp);font-size:12px;font-weight:700;letter-spacing:.02em;padding:4px 11px;border-radius:999px;background:rgba(28,30,36,0.55);color:var(--white);}
          .kc-pill.on{background:var(--kink);}
          .kc-pill.ok{background:var(--kgreen);}
          .kc-daily.done .kc-band{opacity:.75}
          .kc-body{padding:13px 15px 15px;display:flex;flex-direction:column;flex:1;}
          .kc-tag{font-family:var(--kdisp);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--kink2);}
          .kc-title{font-size:20px;font-weight:700;margin:5px 0 6px;}
          .kc-desc{font-size:13.5px;color:var(--kink2);line-height:1.45;margin:0;}
          .kc-from{font-size:12px;color:var(--kink2);margin-top:8px}
          .kc-from i{font-style:normal;font-family:var(--kdisp);font-weight:600;background:var(--kbg);border:1px solid var(--kline);border-radius:6px;padding:1px 6px}
          .kc-views{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--kink2);font-weight:600;margin:22px 2px 0;}
          .kc-hero{display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:center;padding:18px 0 8px}
          .kc-hero h1{font-size:clamp(34px,6vw,54px);font-weight:700}
          .kc-hero h1 em{font-style:normal;color:var(--kred)}
          .kc-hero p{font-size:17px;color:var(--kink2);max-width:36ch;margin:12px 0 0}
          .kc-conf{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
          .kc-conf span{width:60px;height:60px;display:inline-block;filter:drop-shadow(0 5px 0 rgba(27,31,59,.12))}
          .kc-conf svg{width:100%;height:100%}
          .kc-sec{margin-top:36px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
          .kc-sec h2{font-size:28px;font-weight:700}
          .kc-sec .kc-sub{color:var(--kink2)}
          @media (max-width:820px){.kc-hero{grid-template-columns:1fr}.kc-conf{display:none}}
        `}</style>
        <KidsHeader active="today" />

        <div className="kc-hero">
          <div>
            <h1>Puzzles and games, <em>every day.</em></h1>
            <p>Seven little puzzles that change every day, plus a shelf of matching games. No sign-up, no ads, nothing counts against you. Tap one to play.</p>
          </div>
          <div className="kc-conf" aria-hidden="true">
            {[1, 2, 3, 4, 5, 6].map((n) => <span key={n} dangerouslySetInnerHTML={{ __html: SHAPES[n] }} />)}
          </div>
        </div>

        <div className="kc-sec" id="today">
          <h2>Today&apos;s puzzles</h2>
          <span className="kc-sub">{day ? `${day.label} · Puzzle #${day.num}` : 'A new set every day'}</span>
        </div>
        <div className="kc-grid">
          {KIDS_DAILIES.map((g) => <DailyTile key={g.key} g={g} done={!!done[g.key]} />)}
        </div>

        <div className="kc-sec" id="match">
          <h2>Match games</h2>
          <span className="kc-sub">flip the cards, find the pairs, play with up to four</span>
        </div>
        <div className="kc-grid">
          {ACTIVITIES.map((a) => <Tile key={a.id} a={a} />)}
        </div>
        <div className="kc-views"><Eye /> {views == null ? '—' : formatCount(views)} views</div>
      </div>
      <Footer />
    </div>
  );
}
