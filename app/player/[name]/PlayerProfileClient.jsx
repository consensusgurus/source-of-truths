'use client';
// The public player profile (/player/<name>), on the Stage.
//
// Was: four pill tabs over white cards, with rank, IQ, level and streak each
// behind a different pill. Now: cap, curtain, figures, bands — the shape the
// finish card already uses, with nothing behind a click. The band bodies live
// in app/player/ProfileStage.jsx; see its header for why that is a fork of
// ProfileShared rather than an edit to it.
//
// Data is unchanged: /api/quiz/player?username=<name>.
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { QUIZZES } from '@/lib/quizzes';
import MindLoftMark from '../../MindLoftMark';
import StageFooter from '../../StageFooter';
import { notifyShareCredit } from '../../ShareCreditPop';
import { useStageTheme } from '@/lib/stage-theme';
import { crownCategory, crownAccent } from '@/lib/crown';
import {
  Band, Figs, Curtain, Standing, Trophies, Categories, Activity, GameLog, profileStageCss,
} from '../ProfileStage';

function cleanTitle(t) { return (t || '').replace(/^Name (the )?/i, '').trim(); }
function getIdentity() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('sot_quiz_identity')); } catch (e) { return null; }
}

export default function PlayerProfileClient({ name }) {
  const [prof, setProf] = useState(null);
  const [copied, setCopied] = useState(false);
  const [stageTheme, setStageTheme] = useStageTheme();
  const light = stageTheme === 'light';

  useEffect(() => {
    if (!name) { setProf({ found: false }); return undefined; }
    let on = true;
    fetch(`/api/quiz/player?username=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((d) => { if (on) setProf(d || { found: false }); })
      .catch(() => { if (on) setProf({ found: false }); });
    return () => { on = false; };
  }, [name]);

  const mine = useMemo(() => {
    const id = getIdentity();
    return !!(id && id.username && name && id.username.toLowerCase() === name.toLowerCase());
  }, [name]);

  const titleById = useMemo(() => Object.fromEntries(
    (QUIZZES || []).filter((q) => q && q.id).map((q) => [q.id, q.navTitle || cleanTitle(q.title) || q.id]),
  ), []);

  const found = prof && prof.found;
  const loading = prof == null;
  const recent = found && Array.isArray(prof.recent) ? prof.recent : [];

  // ONE COLOUR: the crown category, the same function the share card calls, so
  // the card and this page can never disagree about a player's colour.
  const crown = useMemo(() => (found ? crownCategory(recent) : null), [found, recent]);
  const accent = useMemo(() => crownAccent(crown), [crown]);

  const memberSince = useMemo(() => {
    if (!recent.length) return null;
    const oldest = recent[recent.length - 1];
    if (!oldest || !oldest.createdAt) return null;
    try { return new Date(oldest.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); } catch (e) { return null; }
  }, [recent]);

  const trophies = found ? prof.trophies : null;
  const act = (found && prof.activity) || {};
  const prog = (found && prof.progress) || {};
  const levelPct = prog.stepSize ? Math.round((prog.intoLevel / prog.stepSize) * 100) : 0;

  function share() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/player/${encodeURIComponent(name)}` : '';
    const line = found
      ? `${mine ? 'My' : `${prof.name}'s`} Mind Loft player card: Level ${prof.level || 1}, ${(prof.xp || 0).toLocaleString()} IQ, rank #${prof.rank || '?'}${trophies ? `, ${trophies.earnedCount} trophies` : ''}.`
      : `Mind Loft player profile: ${name}`;
    if (!notifyShareCredit(line, url)) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(`${line} ${url}`)
          .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })
          .catch(() => {});
      }
    }
  }

  return (
    <div className="pf stage-page" data-stage-theme={stageTheme} style={accent.vars}>
      <style dangerouslySetInnerHTML={{ __html: profileStageCss }} />

      <div className="pf-cap">
        <Link className="pf-brand" href="/" aria-label="Mind Loft home">
          <MindLoftMark size={19} ink="var(--stg-ink,#e9edf4)" accent="var(--stg-acc,#7dd3fc)" />
          <b>Mind <em>Loft</em></b>
        </Link>
        <span className="pf-id">
          <i>
            Player profile
            {memberSince ? ` · playing since ${memberSince}` : ''}
            {crown ? ` · ${crown}` : ''}
          </i>
          <h1>
            <span>{found ? prof.name : name}</span>
            {found && prof.tier ? <u>{prof.tier.replace(/ Tier$/, '')}</u> : null}
          </h1>
        </span>
        {found && prof.rank ? (
          <span className="pf-cx pf-rank">
            #{prof.rank}{prof.totalPlayers ? ` of ${prof.totalPlayers.toLocaleString()}` : ''}
          </span>
        ) : null}
        <button
          type="button"
          className="pf-cx"
          style={found && prof.rank ? undefined : { marginLeft: 'auto' }}
          onClick={() => setStageTheme(light ? 'dark' : 'light')}
          aria-label={light ? 'Switch to dark' : 'Switch to light'}
          title={light ? 'Switch to dark' : 'Switch to light'}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            {light
              ? <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
              : <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" /></>}
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="pf-wrap"><p className="pf-empty">Loading player profile…</p></div>
      ) : !found ? (
        <div className="pf-wrap">
          <Band title="No such player">
            <p className="pf-empty" style={{ maxWidth: '46ch', lineHeight: 1.6 }}>
              There is no player named &ldquo;{name}&rdquo;. Profiles exist for registered display
              names, so the spelling may differ, or this player may not have claimed a name yet.
            </p>
            <div className="pf-act" style={{ marginTop: 14 }}>
              <Link className="pf-btn" href="/quizzes/hub">Open the Stat Hub</Link>
              <Link className="pf-btn ghost" href="/daily">Play today&rsquo;s slate</Link>
            </div>
          </Band>
        </div>
      ) : (
        <>
          <Curtain
            level={prof.level}
            xp={prof.xp}
            toNext={prog.toNext}
            accuracy={act.accuracy != null ? act.accuracy : null}
            pct={levelPct}
          />

          <div className="pf-fg">
            <div><b>{(act.played || 0).toLocaleString()}</b><i>games</i></div>
            <div><b>{(act.correct || 0).toLocaleString()}</b><i>correct</i></div>
            <div><b>{(act.completed || 0).toLocaleString()}</b><i>perfect</i></div>
            <div><b>{(act.daysPlayed || 0).toLocaleString()}</b><i>days played</i></div>
            {trophies ? <div><b>{trophies.earnedCount}/{trophies.total}</b><i>trophies</i></div> : null}
          </div>

          <div className="pf-wrap">
            <div className="pf-pair">
              <Band title="Standing" count={prof.rank ? `#${prof.rank}` : null}>
                <Standing
                  recent={recent}
                  rank={prof.rank}
                  totalPlayers={prof.totalPlayers}
                  ranks={prof.ranks}
                  nextAt={prog.levelNext}
                />
              </Band>
              <Band title="Trophy case" count={trophies ? `${trophies.earnedCount} of ${trophies.total}` : null}>
                <Trophies trophies={trophies} />
              </Band>
            </div>

            <Band title="Categories">
              <Categories recent={recent} light={light} />
            </Band>

            <Band title="Activity" count={act.daysPlayed ? `${act.daysPlayed.toLocaleString()} days` : null}>
              <Activity recent={recent} />
            </Band>

            <Band title="Game log" count={recent.length ? `${recent.length.toLocaleString()} on record` : null}>
              <GameLog recent={recent} titleById={titleById} light={light} />
            </Band>

            <div className="pf-act">
              <button type="button" className="pf-btn" onClick={share}>
                {copied ? 'Copied' : 'Share this profile'}
              </button>
              <Link className="pf-btn ghost" href="/quizzes/hub">Open the Stat Hub</Link>
            </div>
          </div>
        </>
      )}

      <StageFooter />
    </div>
  );
}
