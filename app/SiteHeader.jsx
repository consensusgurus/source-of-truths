'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, ArrowDownUp, ChevronDown, X } from 'lucide-react';
import SourcesPopover from './SourcesPopover';
import { getAllSources } from '@/lib/sources';
import { LISTS } from '@/lib/data';
import { QUIZZES } from '@/lib/quizzes';
import { KIDS_GAMES } from '@/lib/kids';
import { EXAM_ORDER } from './exams/examData';
import { T } from '@/lib/theme';
import MindLoftMark from './MindLoftMark';

// Shared site header. Blue header card with the brand + Lists/Quizzes nav on the
// top row, and an optional INLAY slot (a white pill the page passes in) below it:
// category nav on lists home, the section tabs on a list, the player stat bar on
// quizzes. Desktop keeps the card inset and rounded; mobile goes full-bleed and
// the nav condenses to a compact segmented toggle next to the "SoT" mark.
const C = { ink: T.ink, accent: T.accent, muted: T.muted, line: 'rgba(20,22,28,0.30)' };
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const SOURCE_COUNT = getAllSources().length;

// Header tagline. The Top 10 Lists section keeps the consensus line; everywhere
// else carries the site slogan (owner rule, July 2026). Neither is underlined.
function HeaderTagline({ active }) {
  if (active === 'lists') {
    return <>Where <SourcesPopover align="left" onDark href="/experts-and-aggregators" label={`${SOURCE_COUNT.toLocaleString()} Experts and Aggregators`} /> Agree</>;
  }
  return <>Sharpen Your Mind</>;
}
export const LIST_COUNT = LISTS.length;
// Total "quizzes" shown in the header: trivia quizzes + live Kids Corner games
// + exam practice tests.
export const QUIZ_COUNT = (Array.isArray(QUIZZES) ? QUIZZES.length : 0)
  + (Array.isArray(KIDS_GAMES) ? KIDS_GAMES.length : 0)
  + (Array.isArray(EXAM_ORDER) ? EXAM_ORDER.length : 0);

function Logo({ size = 40 }) {
  return <MindLoftMark size={size} />;
}

// eslint-disable-next-line no-unused-vars -- size default kept at 40

// Logo variant for the full-bleed command bar: translucent-white tile so the
// mark reads on the blue gradient (matches app/quizzes/QuizCommandHeader).
let __shcLogoSeq = 0;
function CommandLogo({ size = 30 }) {
  return <MindLoftMark size={size} />;
}

// eslint-disable-next-line no-unused-vars -- size default kept at 30

// The two daily games surfaced in the command bar. Navy-legible accent dots
// match DailyStrip's per-game accents.
const SHC_GAMES = [
  { href: '/crux', name: 'Crux', tag: 'Daily word puzzle', dot: '#5b9bff' },
  { href: '/tally', name: 'Tally', tag: 'Daily numbers puzzle', dot: '#4cb377' },
];

// Full-bleed command-bar header used on the LISTS home page, mirroring the
// quizzes home (QuizCommandHeader) so both landing pages share one look: one
// blue gradient bar spanning the viewport with brand + sources on the left,
// the two daily-game buttons in the middle, then the list SEARCH box and the
// SORT dropdown (both moved up out of the old body toolbar), and the segmented
// Lists/Quizzes pill on the right. Search + sort are wired to the page's own
// state via the search/onSearch/sortBy/onSort/sortButtons props.
function CommandHeader({ active, search, onSearch, sortBy, onSort, sortButtons, listCount }) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  useEffect(() => {
    if (!sortOpen) return undefined;
    const close = (e) => { if (!sortRef.current || !sortRef.current.contains(e.target)) setSortOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [sortOpen]);
  const showSearch = typeof onSearch === 'function';
  const sortOpts = Array.isArray(sortButtons) ? sortButtons : [];
  const showSort = typeof onSort === 'function' && sortOpts.length > 0;
  const curSort = showSort ? (sortOpts.find((o) => o.id === sortBy) || sortOpts[0]) : null;
  return (
    <div className="shc" style={{ fontFamily: FONT }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .shc{width:100vw;margin-left:calc(50% - 50vw);}
        .shc-bar{display:flex;align-items:center;gap:12px;min-height:56px;position:sticky;top:0;z-index:90;padding:9px clamp(14px,2vw,24px);background:var(--white);border-bottom:1.5px solid var(--border);}
        .shc-word{font-size:18px;font-weight:800;letter-spacing:-0.025em;line-height:1;color:var(--ink);text-decoration:none;white-space:nowrap;flex:none;}
        .shc-word em{font-style:normal;color:var(--blue);font-weight:800;}
        .shc-ws{display:none;}
        .shc-src{font-size:9.5px;font-weight:800;letter-spacing:normal;text-transform:uppercase;color:var(--ink);flex:none;}
        .shc-games{display:flex;align-items:center;gap:9px;min-width:0;flex:none;}
        .shc-game{display:inline-flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--surface-alt);border-radius:11px;padding:6px 13px 6px 11px;text-decoration:none;transition:background .15s,border-color .15s;flex:none;}
        .shc-game:hover{background:var(--surface-alt);border-color:var(--slate);}
        .shc-dot{width:8px;height:8px;border-radius:50%;flex:none;}
        .shc-gtxt{display:flex;flex-direction:column;gap:2px;line-height:1;}
        .shc-gnm{font-size:13px;font-weight:800;color:var(--ink);letter-spacing:-.2px;}
        .shc-gtag{font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);white-space:nowrap;}
        .shc-search{flex:0 1 auto;width:clamp(200px,26vw,460px);min-width:130px;margin-left:auto;display:flex;align-items:center;gap:7px;height:36px;padding:0 10px 0 12px;background:var(--surface-alt);border:1px solid var(--surface-alt);border-radius:11px;}
        .shc-search svg{flex:none;color:var(--muted);}
        .shc-search input{flex:1;min-width:0;background:transparent;border:none;outline:none;color:var(--ink);font-family:inherit;font-size:13px;font-weight:600;}
        .shc-search input::placeholder{color:var(--muted);opacity:1;}
        .shc-search:focus-within{border-color:var(--slate);background:var(--surface-alt);}
        .shc-clear{display:flex;align-items:center;justify-content:center;background:none;border:none;color:var(--muted);cursor:pointer;padding:2px;flex:none;}
        .shc-clear:hover{color:var(--ink);}
        /* margin-left:auto pins the Sort + Lists/Quizzes toggle group to the
           far-right edge. When the search box caps at its max width on wide
           screens, the leftover space now flows into this margin instead of
           pooling to the RIGHT of the toggle, so the toggle is anchored right
           (matching the quizzes header) rather than tied to the search box. */
        .shc-sortwrap{position:relative;flex:none;}
        .shc-right{display:flex;align-items:center;gap:9px;margin-left:auto;flex:none;}
        .shc-sort{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 12px;background:var(--surface);border:1px solid var(--surface-alt);border-radius:11px;color:var(--ink);font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;}
        .shc-sort:hover{background:var(--surface-alt);border-color:var(--slate);}
        .shc-sort svg{flex:none;}
        .shc-sortmenu{position:absolute;top:calc(100% + 6px);right:0;z-index:60;min-width:200px;background:var(--white);border:1px solid rgba(20,22,28,0.12);border-radius:10px;box-shadow:0 12px 30px rgba(10,16,32,0.28);overflow:hidden;}
        .shc-sortitem{width:100%;display:block;text-align:left;border:none;background:var(--white);padding:10px 14px;font-family:inherit;font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;}
        .shc-sortitem.on,.shc-sortitem:hover{background:#eef2fb;color:var(--accent);}
        .shc-seg{display:flex;gap:2px;background:var(--surface-alt);border-radius:999px;padding:3px;flex:none;}.shc-burger{display:none;position:relative;flex:none;}.shc-burger>summary{list-style:none;display:flex;align-items:center;justify-content:center;width:38px;height:34px;border-radius:9px;background:var(--surface-alt);border:1px solid var(--surface-alt);cursor:pointer;}.shc-burger>summary::-webkit-details-marker{display:none;}.shc-bmenu{position:absolute;top:calc(100% + 8px);right:0;z-index:70;min-width:200px;background:var(--white);border:1px solid rgba(20,22,28,0.12);border-radius:11px;box-shadow:0 12px 30px rgba(10,16,32,0.28);padding:4px;}.shc-bmenu a{display:block;padding:11px 13px;border-radius:8px;font-size:14px;font-weight:700;color:var(--ink);text-decoration:none;white-space:nowrap;}.shc-bmenu a.on,.shc-bmenu a:hover{background:#eef2fb;color:var(--accent);}@media(max-width:600px){.shc-seg{display:none;}.shc-burger{display:block;}}
        .shc-seg a{font-size:12px;font-weight:700;color:var(--ink);text-decoration:none;padding:6px 12px;border-radius:999px;white-space:nowrap;}
        .shc-seg a.on{background:var(--white);color:var(--accent);}
        @media(max-width:1180px){.shc-src{display:none;}}
        @media(max-width:1080px){.shc-gtag{display:none;}.shc-game{padding:7px 12px;}}
        @media(max-width:900px){.shc-games{display:none;}}
        @media(max-width:820px){.shc-wl{display:none;}.shc-ws{display:inline-flex;align-items:center;}.shc-brandlogo{display:none !important;}}
        @media(max-width:640px){.shc-sortwrap{display:none;}.shc-sorttxt{display:none;}}
        @media(max-width:560px){
          .shc{width:100vw;margin-left:calc(50% - 50vw);}
          .shc-bar{padding-top:calc(9px + env(safe-area-inset-top));padding-left:14px;padding-right:14px;gap:9px;}
          .shc-word{font-size:17px;}
          .shc-search{min-width:0;}
          .shc-seg a{padding:6px 11px;font-size:11.5px;}
        }
      ` }} />
      <div className="shc-bar">
        <Link href="/" className="shc-brandlogo" style={{ flex: 'none', display: 'flex' }} aria-label="Mind Loft home"><CommandLogo size={30} /></Link>
        <Link href="/" className="shc-word"><span className="shc-wl">Mind <em>Loft</em></span><span className="shc-ws"><MindLoftMark size={32} /></span></Link>
        <span className="shc-src"><HeaderTagline active={active} /></span>
        {showSearch && (
          <div className="shc-search" onClick={(e) => e.stopPropagation()}>
            <Search size={15} strokeWidth={2.4} />
            <input
              value={search || ''}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={`Search ${(listCount || LIST_COUNT).toLocaleString()} lists…`}
              aria-label="Search lists"
              autoComplete="off"
            />
            {search ? (
              <button type="button" className="shc-clear" aria-label="Clear search" onClick={() => onSearch('')}><X size={15} strokeWidth={2.5} /></button>
            ) : null}
          </div>
        )}
        {showSort && (
          <div className="shc-sortwrap" ref={sortRef} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="shc-sort" onClick={() => setSortOpen((o) => !o)}>
              <ArrowDownUp size={14} strokeWidth={2.25} />
              <span className="shc-sorttxt">Sort: {(curSort && (curSort.short || curSort.label)) || 'Discover'}</span>
              <ChevronDown size={14} strokeWidth={2.5} style={{ opacity: 0.85 }} />
            </button>
            {sortOpen && (
              <div className="shc-sortmenu">
                {sortOpts.map((opt) => (
                  <button key={opt.id} type="button" className={'shc-sortitem' + (sortBy === opt.id ? ' on' : '')} onClick={() => { onSort(opt.id); setSortOpen(false); }}>{opt.label}</button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="shc-right">
          <div className="shc-games">
            {SHC_GAMES.map((g) => (
              <Link key={g.href} href={g.href} className="shc-game" aria-label={`${g.name} — ${g.tag}`}>
                <span className="shc-dot" style={{ background: g.dot }} />
                <span className="shc-gtxt">
                  <span className="shc-gnm">{g.name}</span>
                  <span className="shc-gtag">{g.tag}</span>
                </span>
              </Link>
            ))}
          </div>
          <nav className="shc-seg">
            <Link href="/" className={active === 'quizzes' ? 'on' : undefined}>Puzzles &amp; Quizzes</Link>
            <Link href="/lists" className={active === 'lists' ? 'on' : undefined}>Top 10 Lists</Link>
          </nav>
          <details className="shc-burger">
            <summary aria-label="Open menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.4" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg></summary>
            <div className="shc-bmenu">
              <Link href="/" className={active === 'quizzes' ? 'on' : undefined}>Puzzles &amp; Quizzes</Link>
              <Link href="/lists" className={active === 'lists' ? 'on' : undefined}>Top 10 Lists</Link>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default function SiteHeader({ active = 'lists', maxWidth = 1180, visitors, bare = false, inlay = null, flush = false, command = false, search, onSearch, sortBy, onSort, sortButtons, listCount }) {
  if (command) return <CommandHeader active={active} search={search} onSearch={onSearch} sortBy={sortBy} onSort={onSort} sortButtons={sortButtons} listCount={listCount} />;
  return (
    <div className="sh-root" style={{ fontFamily: FONT }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .sh-bar{display:flex;flex-direction:column;padding:12px 16px;background:var(--white);border:1.5px solid var(--border);;border-radius:16px;}
        .sh-bar.flush{border-radius:16px 16px 0 0;}
        .qzf-line{position:absolute;top:0;bottom:0;left:24px;right:24px;border-left:1px solid rgba(20,22,28,0.30);border-right:1px solid rgba(20,22,28,0.30);border-bottom:1px solid rgba(20,22,28,0.30);border-bottom-left-radius:16px;border-bottom-right-radius:16px;pointer-events:none;z-index:0;}
        @media(max-width:560px){.qzf-line{display:none;}.qzf-w{padding-left:14px !important;padding-right:14px !important;}}
        .sh-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:nowrap;}
        .sh-inlay{margin-top:12px;}
        .sh-outer{padding:10px 24px 0;}
        .sh-brand{display:flex;align-items:center;gap:11px;text-decoration:none;flex:none;}
        .sh-word{font-size:21px;font-weight:800;letter-spacing:-0.025em;line-height:1;color:var(--ink);}
        .sh-word-sot{display:none;}
        .sh-right{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex:none;}
        .sh-nav{display:flex;align-items:center;gap:12px;justify-content:flex-end;flex-wrap:wrap;}.sh-burger{display:none;position:relative;flex:none;}.sh-burger>summary{list-style:none;display:flex;align-items:center;justify-content:center;width:38px;height:34px;border-radius:9px;background:var(--surface-alt);border:1px solid var(--surface-alt);cursor:pointer;}.sh-burger>summary::-webkit-details-marker{display:none;}.sh-bmenu{position:absolute;top:calc(100% + 8px);right:0;z-index:70;min-width:200px;background:var(--white);border:1px solid rgba(20,22,28,0.12);border-radius:11px;box-shadow:0 12px 30px rgba(10,16,32,0.28);padding:4px;}.sh-bmenu a{display:block;padding:11px 13px;border-radius:8px;font-size:14px;font-weight:700;color:var(--ink);text-decoration:none;white-space:nowrap;}.sh-bmenu a.on,.sh-bmenu a:hover{background:#eef2fb;color:var(--accent);}@media(max-width:600px){.sh-nav{display:none;}.sh-burger{display:block;}}
        .sh-navbtn{display:inline-flex;align-items:center;gap:5px;text-decoration:none;font-size:13.5px;font-weight:700;color:var(--ink);border:1.5px solid var(--border);border-radius:8px;padding:7px 13px;background:transparent;transition:background .15s,border-color .15s,color .15s;}
        .sh-navbtn:hover{background:var(--surface-alt);border-color:var(--ink);color:var(--ink);}
        .sh-navbtn.on{background:var(--white);border-color:var(--ink);border-bottom:2px solid var(--gold);color:var(--accent);}
        @media(max-width:860px){.sh-tag{display:none;}}
        @media(max-width:560px){
          .sh-outer{padding:0;}
          .sh-root{width:100vw;margin-left:calc(50% - 50vw);}
          .sh-bar,.sh-bar.flush{border-radius:0;padding:calc(11px + env(safe-area-inset-top)) 14px 11px;}
          .sh-top{flex-wrap:nowrap;}
          .sh-word{font-size:18px;}
          .sh-tag{display:none;}
          .sh-right{gap:0;}
          .sh-nav{gap:2px;flex-wrap:nowrap;background:var(--surface-alt);border-radius:999px;padding:2px;}
          .sh-navbtn{flex:none;border:none;padding:6px 13px;border-radius:999px;font-size:11.5px;}
          .sh-navbtn:hover{background:transparent;color:var(--ink);}
          .sh-navbtn.on{background:var(--white);color:var(--accent);}
          .sh-inlay{margin-top:10px;}
        }
      ` }} />
      <div className={bare ? undefined : 'sh-outer'} style={bare ? { padding: '2px 0 0' } : { maxWidth, margin: '0 auto' }}>
        <div className={`sh-bar${flush ? ' flush' : ''}`}>
          <div className="sh-top">
            <div className="sh-brand">
              <Link href="/" style={{ flex: 'none', display: 'flex' }} aria-label="Mind Loft home"><Logo size={34} /></Link>
              <span style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'nowrap' }}>
                <Link href="/" className="sh-word" style={{ textDecoration: 'none', color:T.ink }}><span className="sh-word-full">Mind <span style={{ color: T.blue, fontWeight: 800 }}>Loft</span></span><span className="sh-word-sot"><MindLoftMark size={24} /></span></Link>
                <span className="sh-tag" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 'normal', textTransform: 'uppercase', color:T.ink, marginTop: 0 }}><HeaderTagline active={active} /></span>
              </span>
            </div>
            <div className="sh-right">
              <nav className="sh-nav">
                <Link href="/" className={`sh-navbtn${active === 'quizzes' ? ' on' : ''}`}>Puzzles &amp; Quizzes</Link>
                <Link href="/lists" className={`sh-navbtn${active === 'lists' ? ' on' : ''}`}>Top 10 Lists</Link>
              </nav>
              <details className="sh-burger">
                <summary aria-label="Open menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.4" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg></summary>
                <div className="sh-bmenu">
                  <Link href="/" className={active === 'quizzes' ? 'on' : undefined}>Puzzles &amp; Quizzes</Link>
                  <Link href="/lists" className={active === 'lists' ? 'on' : undefined}>Top 10 Lists</Link>
                </div>
              </details>
            </div>
          </div>
          {inlay ? <div className="sh-inlay">{inlay}</div> : null}
        </div>
      </div>
    </div>
  );
}
