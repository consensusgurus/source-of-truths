// SERVER-RENDERED page section for /quiz/[id] and /list/[id].
//
// WHY THIS FILE EXISTS (Search Console audit, 2026-08-17)
// ──────────────────────────────────────────────────────────────────────────
// Both page types were shipping empty shells to crawlers, and the index
// coverage showed exactly that: 130 of 2,511 sitemap URLs indexed, with 2,324
// parked under "Discovered - currently not indexed" and never fetched at all.
// Measured server body text before this shipped:
//
//   /quiz/world-cup-winners            46 characters (the <title>, nothing else)
//   /quiz/countries-of-africa          42 characters
//   /list/best-wings-atlanta          474 characters, reading "Loading the ranking..."
//   /crux                           1,728 characters   <- the only shape that ranks
//
// The correlation is exact: /quiz/* averaged position 52.1 with ZERO clicks in
// 28 days across 1,852 URLs, /list/* zero clicks across 585, while the daily
// games (real server text) took 100% of the site's search traffic. Google also
// reported 55 quiz pages as "Duplicate without user-selected canonical" even
// though every one carries a correct self-canonical: with no distinguishing
// text, 2,000 near-identical empty documents genuinely ARE duplicates, and the
// canonical gets ignored. That is a content problem, not a tag problem, which
// is why no amount of canonical work would have fixed it.
//
// Rendering is a second-wave, budget-rationed pass. A new domain with three
// backlinks gets almost none of it, so "Google runs JS" is not a defence: the
// crawler fetched the shell, saw nothing, and did not come back.
//
// TWO HARD RULES FOR ANYTHING ADDED HERE
// ──────────────────────────────────────────────────────────────────────────
// 1. NEVER RENDER AN ANSWER. Same gate as the blurb rule in CLAUDE.md: no
//    answers[].t, no answer keys, no clue text, no map targets, nothing that
//    names or hints at a solution. This section is ABOUT the quiz. The one
//    place answers legitimately appear is the list ranking below, where the
//    ranking IS the content and is already public on the page.
// 2. NO HIDDEN TEXT, EVER. Everything here is visible to readers at full
//    contrast. Hiding it, collapsing it behind JS, or serving it only to
//    crawlers is cloaking and would put the domain at risk. If a future change
//    makes this section unwanted visually, DELETE it rather than hide it.
//
// This is a server component on purpose. Do not add 'use client', do not add
// hooks, and do not move the links behind client state: crawlable <a href> is
// the entire point (see lib/quiz-catalog.js for the same lesson learned the
// hard way on /quizzes/all).

import { DESCRIPTIONS } from '@/lib/descriptions';
import { quizDept, DEPT_LABEL } from '@/lib/quiz-departments';
import { similarQuizzes } from '@/lib/quiz-similar';
import { T } from '@/lib/theme';

const F = "'Manrope', system-ui, -apple-system, sans-serif";

// Shared styles for both variants. Kept as one <style> string in the site's
// existing convention (see app/quizzes/all/page.js). No backticks inside the
// template: a nested backtick in a style block has broken the build before.
const CSS = `
.sq-band{background:${T.surfaceAlt};border-top:1px solid ${T.border};position:relative;z-index:2}
.sq-wrap{max-width:1100px;margin:0 auto;padding:44px 20px 52px}
.sq-eyebrow{font-family:${F};font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:${T.accent};font-weight:800;margin:0 0 10px}
.sq-h2{font-family:${F};font-weight:800;font-size:clamp(22px,3.4vw,30px);line-height:1.12;letter-spacing:-.02em;margin:0 0 12px;color:${T.ink}}
.sq-p{font-family:${F};font-size:16px;line-height:1.62;color:${T.muted};margin:0 0 12px;max-width:70ch}
.sq-facts{font-family:${F};font-size:13.5px;line-height:1.6;color:${T.slate};margin:14px 0 0;max-width:70ch}
.sq-facts b{color:${T.ink};font-weight:700}
.sq-src{font-family:${F};font-size:13px;color:${T.slate};margin:10px 0 0}
.sq-src a{color:${T.blue};font-weight:600}
.sq-sub{font-family:${F};font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:${T.accent};font-weight:800;margin:30px 0 12px}
.sq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:9px;margin:0;padding:0;list-style:none}
.sq-grid a{display:block;font-family:${F};font-size:14.5px;font-weight:700;line-height:1.35;color:${T.ink};text-decoration:none;background:${T.white};border:1px solid ${T.border};border-radius:10px;padding:12px 14px}
.sq-grid a:hover{border-color:${T.accentBorder};background:${T.accentSoft}}
.sq-more{font-family:${F};font-size:14px;color:${T.muted};margin:16px 0 0}
.sq-more a{color:${T.blue};font-weight:700;text-decoration:none}
.sq-more a:hover{text-decoration:underline}
.sq-rank{list-style:none;margin:0;padding:0;counter-reset:sqr}
.sq-rank li{display:flex;gap:14px;padding:14px 0;border-top:1px solid ${T.border}}
.sq-rank li:first-child{border-top:none}
.sq-num{font-family:${F};font-weight:800;font-size:15px;color:${T.accent};min-width:26px;flex:none;padding-top:1px}
.sq-name{font-family:${F};font-weight:800;font-size:16px;line-height:1.3;color:${T.ink};margin:0 0 4px}
.sq-desc{font-family:${F};font-size:14.5px;line-height:1.55;color:${T.muted};margin:0;max-width:70ch}
@media(max-width:600px){.sq-wrap{padding:34px 16px 42px}}
`;

// ─── shared bits ────────────────────────────────────────────────────────────

function Band({ children }) {
  return (
    <section className="sq-band">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sq-wrap">{children}</div>
    </section>
  );
}

// quiz.source is a string on some quizzes and {label, url} on others (see the
// quiz section of CLAUDE.md); render both shapes.
function SourceLine({ source, prefix = 'Source' }) {
  if (!source) return null;
  const label = typeof source === 'string' ? source : source.label;
  if (!label) return null;
  const url = typeof source === 'string' ? null : source.url;
  return (
    <p className="sq-src">
      {prefix}:{' '}
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">{label}</a>
      ) : (
        label
      )}
    </p>
  );
}

function clock(seconds) {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (!m) return `${s} seconds`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── quiz variant ───────────────────────────────────────────────────────────

// One line per format, describing HOW the quiz is played. Deliberately about
// the mechanic and never the subject, so it can never leak an answer. A format
// with no entry falls back to the default name-them-all line, which is also
// what a quiz carrying no `format` field is.
const FORMAT_LINE = {
  'type-it': 'Each clue appears in turn and you type the answer.',
  bank: 'A matching game: one prompt at a time, with every answer laid out in a bank below it.',
  matched: 'Every slot carries its own label, and you fill them in.',
  map: 'A map quiz: each one is called in turn and you click it on the map.',
  'place-map': 'You place each location on the map.',
  'street-map': 'You place each location on the map.',
  globe: 'You find each one on a spinning globe.',
  'geo-aerial': 'Each place is shown from above and you name it.',
  photo: 'A picture quiz: name what you are shown.',
  images: 'A picture quiz: name what you are shown.',
  posters: 'A picture quiz: name what you are shown.',
  logos: 'A picture quiz: name what you are shown.',
  'photo-match': 'You match each picture to its answer.',
  'timed-mcq': 'Timed multiple choice, and the faster you answer the more points you bank.',
  'higher-lower': 'Two options each round, and you pick the bigger one.',
  closer: 'Two options each round, and you pick whichever is closer.',
  'word-scramble': 'Every answer arrives scrambled and you unscramble it.',
  connections: 'You sort the tiles into the groups they secretly belong to.',
  'order-bank': 'You put the answers into the right order.',
  'survive-state': 'One wrong answer ends the run, so the score is how far you got.',
  'logic-game': 'You work it out from the clues.',
  'logic-grid': 'You work it out from the clues on a grid.',
  'grid-fill': 'You fill in the grid.',
  'author-grid': 'You fill in the grid.',
  careers: 'Each career is described and you name the person behind it.',
};

const DEFAULT_FORMAT_LINE =
  'Name them all: answers count in any order, and you have the clock to get as many as you can.';

function answerCount(quiz) {
  const n =
    (Array.isArray(quiz.answers) && quiz.answers.length) ||
    (Array.isArray(quiz.questions) && quiz.questions.length) ||
    (Array.isArray(quiz.pairs) && quiz.pairs.length) ||
    0;
  return n > 0 ? n : null;
}

export function QuizSeoSection({ quiz }) {
  if (!quiz || !quiz.id) return null;

  const dept = quizDept(quiz);
  const deptLabel = DEPT_LABEL[dept] || 'Miscellaneous';
  const n = answerCount(quiz);
  const time = clock(quiz.timeLimit);
  const formatLine = FORMAT_LINE[quiz.format] || DEFAULT_FORMAT_LINE;
  const noun = quiz.questions ? 'questions' : 'answers';

  // Deterministic and server safe: similarQuizzes never calls playedQuizIds,
  // so this renders the same links on every request and for every reader.
  const related = similarQuizzes(quiz, 8);

  return (
    <Band>
      <p className="sq-eyebrow">About this quiz</p>
      <h2 className="sq-h2">{quiz.title}</h2>
      {quiz.blurb && <p className="sq-p">{quiz.blurb}</p>}
      <p className="sq-p">{formatLine}</p>
      <p className="sq-facts">
        Filed under <b>{deptLabel}</b>
        {n ? <> with <b>{n} {noun}</b> to get</> : null}
        {time ? <> and <b>{time}</b> on the clock</> : null}
        {'. '}
        Free to play, no sign up needed, and your score goes on the leaderboard.
      </p>
      <SourceLine source={quiz.source} />

      {related.length > 0 && (
        <>
          <p className="sq-sub">More quizzes like this</p>
          <ul className="sq-grid">
            {related.map((q) => (
              <li key={q.id}>
                <a href={`/quiz/${encodeURIComponent(q.id)}`}>{q.title}</a>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="sq-more">
        Browse every <a href="/#sty-quizzes">{deptLabel} quiz</a> in the quiz catalogue, or the day&rsquo;s{' '}
        <a href="/">puzzles</a>.
      </p>
    </Band>
  );
}

// ─── list variant ───────────────────────────────────────────────────────────

// The consensus ranking is the page's actual content and the reason these URLs
// earned impressions on the old domain ("best lunch hamptons", "best
// restaurants toronto"). It was client-only, so the server sent the words
// "Loading the ranking..." and nothing else. This renders the same top ten the
// page shows, from the same consensus the page computes, with the descriptions
// that already exist in lib/descriptions.js.
export function ListSeoSection({ list, items, related = [] }) {
  if (!list || !list.id) return null;

  const names = (Array.isArray(items) ? items : [])
    .slice(0, 10)
    .map((item) => (typeof item === 'string' ? item : item?.name || item?.title || ''))
    .filter(Boolean);

  const descs = DESCRIPTIONS[list.id] || {};

  const sourceLabels = Object.entries(list.sources || {})
    .filter(([key]) => key !== 'ai')
    .map(([, src]) => (src && src.label) || '')
    .filter(Boolean);

  const ranked = list.mode !== 'unranked';
  const heading = ranked ? 'The full ranking' : 'The full list';

  return (
    <Band>
      <p className="sq-eyebrow">{heading}</p>
      <h2 className="sq-h2">{list.title}</h2>
      {list.blurb && <p className="sq-p">{list.blurb}</p>}

      {names.length > 0 && (
        <ol className="sq-rank">
          {names.map((name, i) => (
            <li key={name}>
              {ranked && <span className="sq-num">{i + 1}</span>}
              <div>
                <p className="sq-name">{name}</p>
                {descs[name] && <p className="sq-desc">{descs[name]}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {sourceLabels.length > 0 && (
        <p className="sq-facts">
          Ranked across <b>{sourceLabels.length}</b>{' '}
          {sourceLabels.length === 1 ? 'source' : 'sources'}: {sourceLabels.join('; ')}.{' '}
          Full scoring is on the Methodology tab above.
        </p>
      )}

      {related.length > 0 && (
        <>
          <p className="sq-sub">Related lists</p>
          <ul className="sq-grid">
            {related.map((l) => (
              <li key={l.id}>
                <a href={`/list/${encodeURIComponent(l.id)}`}>{l.title}</a>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="sq-more">
        Browse <a href="/lists">every Top 10 List</a>, see the{' '}
        <a href="/experts-and-aggregators">experts and aggregators</a> behind them, or play
        the day&rsquo;s <a href="/">puzzles</a>.
      </p>
    </Band>
  );
}
