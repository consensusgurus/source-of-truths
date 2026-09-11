'use client';

// The circuit landing page's body. Server-rendered content comes in as props
// (name, blurb, share copy, trophy, the games in run order); everything this
// component fetches is the VIEWER'S own state, which is why it is a client
// island rather than part of the page.
//
// ON THE STAGE (owner, 2026-08-31: "the circuit landing pages have the old
// header and lack the updated style"). The page chrome — the cap, the register
// switch, the footer — is CircuitFrame's; this component draws only what goes
// between them, in the stage's tokens. Nothing here paints a light ground or a
// colour of its own: the one hue on the page is the circuit's lead game's
// category step, published by the frame as --stg-acc, and each game card wears
// its own category step as --cc.
//
// THE SHARE BUTTON IS STILL THE POINT OF THE PAGE. It hands over
// circuitShareInvite(id) — the circuit's evergreen line plus a link back to
// this page — through the same notifyShareCredit pop-up every daily uses, so a
// registered sharer's referral code is stamped in and a signed-out sharer still
// gets the text and the link rather than a sign-up wall.
//
// The link is passed EXPLICITLY as the second argument. ShareCreditPop defaults
// to the current page URL, which happens to be right here, but a bare default
// would carry any query string the visitor arrived with (a ?ref, a campaign
// tag, and now a ?theme) into the thing they share. Naming the canonical page
// keeps every shared link identical.

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Share2, Trophy, Check } from 'lucide-react';
import { circuitShareInvite, circuitShareUrl, circuitHref, MARQUEE_ID, CIRCUIT_PARAM, isRunnableCircuit, runHref, runSummaryHref, circuitScoreMode, fmtClock, runEngine } from '@/lib/circuits';
import { notifyShareCredit } from '../../ShareCreditPop';
import { dailyMeIdentity } from '../../dailyMeClient';
import { isMobileDevice } from '@/lib/is-mobile';
import { withRef } from '@/lib/referrals';
import { useThemeQs } from '@/lib/stage-theme';
import CircuitFrame from '../CircuitFrame';
import { TileGrid, deriveTileData, TILE_CSS } from '../../GameTiles';

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// THIS COMPONENT OWNS THE FRAME rather than being wrapped in one by the page.
// The cap's progress hairline is the run's own done/n, which only this
// component knows (it is the one thing on the page that reads the viewer's
// state), and a server page cannot hand a client frame a figure that does not
// exist until after a fetch. Client wrapping client keeps it an ordinary prop.
export default function CircuitLanding({ circuit, games }) {
  const { id, name, share, trophy, marquee } = circuit;
  const n = games.length;

  // The viewer's own state, and today's field. Read in an effect, never during
  // render: the server has no idea what today is in Eastern or who is looking,
  // so deriving either during render makes the first client paint disagree with
  // the server's.
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  // A review session's ?theme rides along on every in-app link, exactly as it
  // does on the home, so flipping the register once holds for the walk through
  // the circuit into a game.
  const tq = useThemeQs();
  const withTq = (href) => (tq ? href + (href.includes('?') ? tq : `?${tq.slice(1)}`) : href);

  useEffect(() => {
    let alive = true;
    const { anonId, email } = dailyMeIdentity();
    const qs = new URLSearchParams();
    if (marquee) qs.set('five', '1');
    else qs.set(CIRCUIT_PARAM, id);
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    fetch(`/api/quiz/daily-combined?${qs.toString()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (alive && d && !d.error) setData(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [id, marquee]);

  const perGame = (data && data.me && data.me.perGame) || {};
  // THE RUN IS DRAWN AS THE LARGE GAME TILES (owner, 2026-09-11), off the
  // same payload the progress reads: each member's top three today and the
  // viewer's own rank are already in it, so the tiles cost no request.
  const tiles = useMemo(() => deriveTileData(data, null), [data]);
  const donePlayed = games.filter((g) => perGame[g.key] && !perGame[g.key].abandoned);
  const done = donePlayed.length;
  const complete = n > 0 && done === n;
  const field = (data && data.overallField) || 0;

  // WHAT THEY SCORED, on the page that told them they had finished (owner,
  // 2026-08-29, having completed the Gauntlet and found no score anywhere on
  // it). The figures come out of the same payload the progress does; the
  // scorecard proper lives on the run summary, and the first action becomes a
  // link to it the moment the run is complete.
  const me = (data && data.me) || null;
  // Does this circuit's board count QUESTIONS RIGHT rather than ladder points?
  // Read off the circuit, not off the payload, because the copy under the run
  // list has to be right on the first paint, before any fetch lands.
  const byCorrect = circuitScoreMode(id) === 'correct';
  // Or the CLOCK (the Valet Gauntlet): the figure is lots parked and the time.
  const byTime = circuitScoreMode(id) === 'time';
  // A questions-right circuit has no ceiling until the day's banks are known,
  // so it shows none rather than a points figure that is not its unit.
  const maxTotal = (data && Number.isFinite(data.maxTotal) ? data.maxTotal : 0) || (byCorrect ? 0 : byTime ? n : n * 15);
  const points = me && Number.isFinite(me.total) ? Math.round(me.total * 10) / 10 : null;
  const rank = me && Number.isFinite(me.rank) && me.rank > 0 ? me.rank : null;
  // The first game they have NOT played, so the button starts where they are
  // rather than always at the top of the run.
  const nextGame = games.find((g) => !(perGame[g.key] && !perGame[g.key].abandoned)) || games[0];
  // Can this circuit be played as one continuous quiz? Read off the circuit
  // rather than a name, so a second runnable circuit needs no edit here.
  const runnable = isRunnableCircuit(id);
  // Does this circuit shuffle its order daily? The copy under the run list has
  // to say which, because "shortest first" stops being true the moment it does.
  const ordered = !!(circuit.order && Array.isArray(circuit.order.tail));

  function doShare() {
    const url = withRef(circuitShareUrl(id));
    const text = circuitShareInvite(id, url);
    // The pop-up handles copy and the native sheet for everyone, so a true
    // return means this handler is done.
    if (notifyShareCredit(text, `https://${circuitShareUrl(id)}`)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) {
        navigator.share({ text }).catch(() => {});
        return;
      }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    } catch (e) {}
  }

  return (
    <CircuitFrame
      cat={circuit.cat}
      label={marquee ? 'The Daily Five' : `${name} circuit`}
      progress={n ? done / n : 0}
    >
    <div className="clp">
      {/* dangerouslySetInnerHTML, never a text child: React escapes an
          apostrophe on the server and <style> is a raw-text element, so
          content:'' and the [data-stage-theme='light'] rules would ship as
          entities and be dropped. See the note in app/circuits/CircuitFrame.jsx. */}
      <style dangerouslySetInnerHTML={{ __html: CSS + TILE_CSS }} />

      {/* THE HERO sits on the page's own ground with a rule down its edge,
          rather than in a card. On the stage the ground already is the surface,
          so a panel here would be a second ground nobody asked for — the same
          reason the board card came off all eighty dailies. */}
      <section className="clp-hero">
        <div className="clp-eb">{marquee ? 'The marquee circuit' : `${n} games · one run`}</div>
        <h1 className="clp-h1">{marquee ? name : `The ${name} Circuit`}</h1>
        <p className="clp-sub">{share.invite}</p>

        <div className="clp-acts">
          {/* A RUNNABLE circuit leads with the continuous board, because that is
              what the circuit is for: one sitting, no hand-offs. Playing the
              games one at a time still works and is the second control, since a
              player part way through a run should be able to pick up a single
              game without starting the whole thing again.

              ONE FILLED CONTROL, as everywhere else on the stage: whichever of
              these is the thing to do next takes the accent, and the rest are
              outlines. */}
          {complete ? (
            <a className="clp-go" href={withTq(runSummaryHref(marquee ? MARQUEE_ID : id))}>
              See how the run went
              <ArrowRight size={15} strokeWidth={2.6} />
            </a>
          ) : null}
          {runnable ? (
            <a className={complete ? 'clp-sh' : 'clp-go'} href={withTq(runHref(id))}>
              {complete ? 'Run it again' : done ? 'Carry on with the run' : (runEngine(id) === 'jam' ? `Play all ${n} on one clock` : `Play all ${n} as one quiz`)}
              <ArrowRight size={15} strokeWidth={2.6} />
            </a>
          ) : null}
          {nextGame ? (
            <a className={runnable || complete ? 'clp-sh' : 'clp-go'} href={withTq(circuitHref(nextGame.key, marquee ? MARQUEE_ID : id))}>
              {runnable
                ? `Or just ${nextGame.name}`
                : (complete ? 'Play it again' : done ? `Continue with ${nextGame.name}` : `Start the run with ${nextGame.name}`)}
              <ArrowRight size={15} strokeWidth={2.6} />
            </a>
          ) : null}
          <button type="button" className="clp-sh" onClick={doShare}>
            {copied ? <Check size={15} strokeWidth={2.6} /> : <Share2 size={15} strokeWidth={2.6} />}
            {copied ? 'Copied' : 'Share this circuit'}
          </button>
        </div>

        {/* FIGURES, NEVER PROSE, and each drawn only when it is real. */}
        <div className="clp-figs">
          <div><b>{n}</b><i>games</i></div>
          {byTime
            ? <div><b>1</b><i>clock across all {n}</i></div>
            : byCorrect
            ? (maxTotal ? <div><b>{maxTotal}</b><i>questions on offer</i></div> : null)
            : <div><b>{n * 15}</b><i>points on offer</i></div>}
          <div><b>{done}<i>/{n}</i></b><i>played today</i></div>
          {complete && points !== null && byTime
            ? <div><b>{fmtClock(me && me.timeTotal)}</b><i>{points === n ? 'combined clock' : `clock, ${points} of ${n} parked`}</i></div>
            : null}
          {complete && points !== null && !byTime
            ? <div><b>{points}</b><i>{byCorrect
                ? (maxTotal ? `of ${maxTotal} right` : 'questions right')
                : `of ${maxTotal} points`}</i></div>
            : null}
          {complete && rank ? <div><b>{`#${rank}`}</b><i>on the circuit board</i></div> : null}
          {field ? <div><b>{field}</b><i>on it today</i></div> : null}
        </div>
      </section>

      <section className="clp-sec">
        <div className="clp-head">
          <h2>The run, in order</h2>
          <b>{done}<i>/{n}</i></b>
        </div>
        <TileGrid games={games} numbered
          hrefFor={(g) => withTq(circuitHref(g.key, marquee ? MARQUEE_ID : id))} data={tiles} />
        <p className="clp-note">
          {ordered
            ? 'The last two are always the last two. The rest are shuffled fresh every day, so the run has a different shape each morning. '
            : 'Shortest first, longest last. '}
          {byTime
            ? `The board is your combined clock across all ${n} lots, fastest first. Moves do not count here; each lot still grades its own board on them. `
            : byCorrect
            ? `The board is the plain count of questions you get right across all ${n}, and the shorter clock takes a tie. `
            : `Each game pays 15 points for a win down to 1 for finishing, and the circuit adds all ${n} up. `}
          A game played on its own still counts toward it, but you need all {n}{byTime ? ' parked' : ''} in
          the same day to take a rank on the circuit board.
        </p>
      </section>

      {trophy ? (
        <section className="clp-sec">
          <div className="clp-head">
            <h2>What finishing it pays</h2>
          </div>
          <div className="clp-tro">
            <Trophy size={20} strokeWidth={2.3} className="clp-troi" />
            <span className="clp-trot">
              <b>{trophy.name}</b>
              {/* A SPAN, never <s>. The band and the run summary both use <s> as
                  a bare sub-line hook with text-decoration:none, which is fine
                  on a surface nothing crawls. This page IS crawled, and <s>
                  means "no longer accurate": a reader-mode pass, a screen reader
                  and an indexer all render this trophy's own description as
                  struck through. */}
              <span className="clp-trosub">Finish every game in this circuit on the same day.</span>
            </span>
            <span className={`clp-tier ${trophy.tier}`}>{trophy.tier}</span>
          </div>
        </section>
      ) : null}

      <p className="clp-note clp-foot">
        {marquee
          ? 'A fresh five lands at midnight Eastern, one game from each of five different categories.'
          : `The same ${n} games every day, with new puzzles in each of them at midnight Eastern.`}
      </p>

      <a className="clp-all" href={withTq('/circuits')}>
        See all the circuits
        <ArrowRight size={15} strokeWidth={2.6} />
      </a>
    </div>
    </CircuitFrame>
  );
}

// NOTE: this block is a JS template literal, so no backticks in the comments.
const CSS = `
.clp{display:flex;flex-direction:column;gap:30px;}

/* -- the hero ----------------------------------------------------------- */
.clp-hero{position:relative;padding-left:16px;}
.clp-hero::before{content:'';position:absolute;left:0;top:3px;bottom:3px;width:4px;
  border-radius:2px;background:var(--stg-acc);}
.clp-eb{font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;
  color:var(--stg-mute);}
.clp-h1{margin:7px 0 0;font-size:36px;font-weight:800;letter-spacing:-0.025em;line-height:1.06;
  color:var(--stg-ink);}
.clp-sub{margin:10px 0 0;font-size:15px;font-weight:600;line-height:1.55;max-width:62ch;
  color:var(--stg-ink2);}

.clp-acts{display:flex;gap:9px;margin-top:20px;flex-wrap:wrap;}
.clp-go,.clp-sh{display:inline-flex;align-items:center;gap:8px;border-radius:10px;
  padding:12px 18px;font-size:13.5px;font-weight:800;letter-spacing:.02em;
  text-decoration:none;cursor:pointer;font-family:inherit;}
/* The one filled control on the page, in the circuit's own step with the ink
   that step carries. --stg-onramp flips with the register; the fallback is the
   dark ink, which is what the dark set uses. */
.clp-go{background:var(--stg-acc);color:var(--stg-onramp,#08222e);border:1.5px solid transparent;}
.clp-go:hover{filter:brightness(1.07);}
.clp-sh{background:none;color:var(--stg-ink);border:1.5px solid var(--stg-line2);}
.clp-sh:hover{border-color:var(--stg-acc);color:var(--stg-acc-ink);}
.clp-go:focus-visible,.clp-sh:focus-visible{outline:2px solid var(--stg-acc);outline-offset:3px;}

.clp-figs{display:flex;gap:26px;margin-top:20px;flex-wrap:wrap;}
.clp-figs b{display:block;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1;
  font-variant-numeric:tabular-nums;color:var(--stg-ink);}
.clp-figs b i{font-style:normal;font-weight:600;font-size:15px;color:var(--stg-mute);}
.clp-figs>div>i{font-style:normal;display:block;font-family:${MONO};font-size:9px;
  letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute);margin-top:6px;}

/* -- the sections ------------------------------------------------------- */
.clp-sec{display:block;}
.clp-head{display:flex;align-items:baseline;gap:11px;margin-bottom:11px;}
.clp-head h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;
  color:var(--stg-ink);}
.clp-head b{font-family:${MONO};font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;
  color:var(--stg-ink2);}
.clp-head b i{font-style:normal;color:var(--stg-mute);}

/* -- the run, in order: app/GameTiles.jsx draws the cards ------------- */
.clp-note{font-size:12.5px;font-weight:600;color:var(--stg-mute);line-height:1.6;margin:12px 0 0;
  max-width:74ch;}
.clp-foot{margin:0;}

/* -- the trophy --------------------------------------------------------- */
.clp-tro{display:flex;align-items:center;gap:12px;background:var(--stg-surf);
  border:1px solid var(--stg-line);border-radius:10px;padding:13px 15px;}
.clp-troi{flex:none;color:var(--stg-warn);}
.clp-trot{flex:1;min-width:0;}
.clp-trot b{display:block;font-size:15px;font-weight:800;letter-spacing:-0.015em;color:var(--stg-ink);}
.clp-trosub{display:block;font-size:11.5px;font-weight:600;color:var(--stg-mute);margin-top:2px;}
/* The tier keeps its own metal, because gold, silver and bronze ARE the
   information here and the ramp has no word for them. They are chips on a
   surface rather than ink on the ground, so both registers read them. */
.clp-tier{flex:none;font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.12em;
  text-transform:uppercase;padding:5px 9px;border-radius:999px;
  background:var(--stg-chip);color:var(--stg-ink2);}
.clp-tier.gold{background:rgba(251,191,36,0.16);color:#fbbf24;}
.clp-tier.silver{background:rgba(203,213,225,0.16);color:#cbd5e1;}
.clp-tier.bronze{background:rgba(217,142,86,0.18);color:#e0a273;}
[data-stage-theme='light'] .clp-tier.gold{background:#fdf3d8;color:#7a5c0c;}
[data-stage-theme='light'] .clp-tier.silver{background:#eaedf2;color:#4b5361;}
[data-stage-theme='light'] .clp-tier.bronze{background:#f6e9dd;color:#7d4f26;}

.clp-all{display:flex;align-items:center;justify-content:center;gap:8px;
  background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:10px;
  padding:13px 18px;font-family:${MONO};font-size:9.5px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--stg-ink2);text-decoration:none;}
.clp-all:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.clp-all:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}

@media (max-width:640px){
  .clp{gap:24px;}
  .clp-h1{font-size:27px;}
  .clp-sub{font-size:14px;}
  .clp-acts{flex-direction:column;align-items:stretch;}
  .clp-go,.clp-sh{justify-content:center;}
  .clp-figs{gap:0;justify-content:space-between;}
  .clp-figs>div{min-width:0;}
  .clp-figs b{font-size:18px;}
  .clp-figs b i{font-size:13px;}
}
`;
