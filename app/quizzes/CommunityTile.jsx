'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { Crown, Copy, Check, UserPlus, ArrowRight, X } from 'lucide-react';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import { T } from '@/lib/theme';

// Top Community Member tile on /quizzes. Sits in the row-1 hero slot (it swapped
// places with the Newest tile 2026-07-20), and keeps the .ttile class so the
// shared tile grid + media rules apply.
//
// Shows whoever has brought in the most new players over the rolling window,
// and on hover (or tap, on touch) explains how credit is earned and hands the
// viewer their own share link. See lib/referrals.js for the capture flow.
//
// A visitor with no identity joins IN PLACE via the shared JoinLeaderboardForm
// modal: there is no standalone join page on the site (the form lives as a tab
// inside each board), and /quizzes/leaderboard is a redirect to the Stat Hub,
// so linking anywhere here would dead-end the one action the tile is asking for.

const C = { accent: T.accent, cta: T.cta, gold: '#ffd166' };

// The winner's name is the single most emphasised username on the page, so it is
// set as large as will fit rather than at a fixed size: binary-search the largest
// whole pixel size that keeps it on one line inside the tile, re-run on resize.
const NAME_MIN = 17;
const NAME_MAX = 42;
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function useFittedName(text) {
  const wrapRef = useRef(null);
  const textRef = useRef(null);

  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el || !text) return;
    const avail = wrap.clientWidth;
    if (!avail) return;
    let lo = NAME_MIN;
    let hi = NAME_MAX;
    let best = NAME_MIN;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      el.style.fontSize = `${mid}px`;
      // +1 absorbs sub-pixel rounding, which otherwise costs a whole step.
      if (el.scrollWidth <= avail + 1) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    el.style.fontSize = `${best}px`;
  }, [text]);

  useIsoLayoutEffect(() => {
    fit();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [fit]);

  // Webfonts land after first paint and change the metrics, so refit once ready.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.ready) return;
    document.fonts.ready.then(fit).catch(() => {});
  }, [fit]);

  return { wrapRef, textRef };
}

export default function CommunityTile() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [identity, setIdentity] = useState(null);

  const load = useCallback(() => {
    // Send the stored email alongside the browser anon. quiz_users.anon_id only
    // ever holds the FIRST browser that joined, so on any second device the anon
    // matches nothing and the share link vanishes; the email is what identifies
    // the account across devices.
    const qs = new URLSearchParams();
    try {
      const anon = localStorage.getItem('sot_quiz_anon') || '';
      if (anon) qs.set('anonId', anon);
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
      if (id && id.email) qs.set('email', id.email);
    } catch { /* private mode */ }
    return fetch(`/api/quiz/referrals${qs.toString() ? `?${qs}` : ''}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => { /* tile falls back to its empty state */ });
  }, []);

  useEffect(() => {
    load();
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
      if (id && id.username) setIdentity(id);
    } catch { /* ignore */ }
  }, [load]);

  useEffect(() => {
    if (!joinOpen) return undefined;
    const esc = (e) => { if (e.key === 'Escape') setJoinOpen(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [joinOpen]);

  const me = data?.me || null;
  const leader = data?.top?.[0] || null;
  const shareUrl = me?.shareUrl || null;
  const { wrapRef, textRef } = useFittedName(leader?.username || '');

  const copy = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked: the link is selectable in the panel */ }
  }, [shareUrl]);

  return (
    <div
      className={`ttile cmtile${open ? ' cm-open' : ''}`}
      onClick={() => { if (!joinOpen) setOpen((v) => !v); }}
      onMouseLeave={() => setOpen(false)}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        /* Trophy tile: warm bronze ground with a gold spotlight behind the name, so it
           reads as the celebration slot and stands apart from the navy tiles beside it. */
        .cmtile{background:radial-gradient(135% 105% at 24% 36%, rgba(255,196,74,.30) 0%, rgba(255,196,74,.07) 44%, rgba(0,0,0,0) 72%), linear-gradient(155deg,#33280f 0%,#1f1809 58%,#130f08 100%);cursor:pointer;}
        .cmtile .cm-tag{position:absolute;top:12px;left:12px;font-size:10px;font-weight:800;letter-spacing:.08em;background:var(--white);border-radius:10px;padding:4px 10px;z-index:3;color:var(--accent);display:inline-flex;align-items:center;gap:4px;}
        .cmtile .cm-body{position:relative;z-index:1;padding:18px 16px 15px;}
        .cmtile .cm-namewrap{width:100%;}
        /* Auto-fitted: font-size is set inline by useFittedName. */
        .cmtile .cm-who{display:block;white-space:nowrap;font-size:${NAME_MAX}px;font-weight:800;letter-spacing:-1.1px;line-height:1.02;color:${C.gold};text-shadow:0 2px 18px rgba(0,0,0,.55);}
        .cmtile .cm-sub{font-size:12px;font-weight:600;color:rgba(255,236,200,.72);margin-top:5px;}
        /* Ranks 2-5 as a 2x2 grid: 2 | 4 on the top row, 3 | 5 below, so 4 and 5
           sit to the right of 2 and 3. Each cell reads "4. Alice (12)": rank on the
           left, then the name, then the referral count in parentheses. */
        .cmtile .cm-podium{margin-top:9px;display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;border-top:1px solid rgba(255,209,102,.16);padding-top:7px;}
        .cmtile .cm-prow{display:flex;align-items:baseline;gap:5px;font-size:11.5px;line-height:1.25;min-width:0;}
        .cmtile .cm-prank{flex:none;font-weight:800;color:rgba(255,236,200,.55);font-variant-numeric:tabular-nums;}
        .cmtile .cm-nm{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;color:rgba(255,255,255,.82);}
        .cmtile .cm-nm.cm-vacant{color:rgba(255,255,255,.34);font-weight:600;font-style:italic;}
        .cmtile .cm-pn{flex:none;font-weight:800;color:rgba(255,236,200,.62);font-variant-numeric:tabular-nums;}
        .cmtile .cm-foot{display:flex;align-items:center;gap:6px;margin-top:9px;font-size:12px;font-weight:800;color:rgba(255,255,255,.9);}
        .cmtile .cm-panel{position:absolute;inset:0;z-index:4;background:rgba(24,18,8,.975);padding:13px 14px;display:flex;flex-direction:column;gap:5px;opacity:0;pointer-events:none;transition:opacity .16s ease;overflow:auto;}
        .cmtile:hover .cm-panel,.cmtile:focus-within .cm-panel,.cmtile.cm-open .cm-panel{opacity:1;pointer-events:auto;}
        .cmtile .cm-h{font-size:12px;font-weight:800;letter-spacing:.07em;color:${C.cta};text-transform:uppercase;}
        .cmtile .cm-p{font-size:12px;line-height:1.38;color:rgba(255,255,255,.86);}
        .cmtile .cm-tip{font-size:11.5px;line-height:1.35;color:rgba(255,236,200,.72);}
        .cmtile .cm-why{font-size:12px;line-height:1.34;font-weight:700;color:${C.gold};}
        .cmtile .cm-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:${C.gold};background:rgba(255,209,102,.12);border-radius:4px;padding:1px 4px;}
        .cmtile .cm-link{display:flex;align-items:center;gap:6px;margin-top:auto;}
        .cmtile .cm-url{flex:1 1 auto;min-width:0;font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--white);background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:7px 9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .cmtile .cm-copy,.cmtile .cm-join{flex:none;display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:var(--accent);background:${C.cta};border:0;border-radius:8px;padding:8px 11px;cursor:pointer;font-family:inherit;}
        .cmtile .cm-join{margin-top:auto;align-self:flex-start;font-size:12.5px;}
        .cm-modal{position:fixed;inset:0;z-index:9999;background:rgba(24,18,8,.66);display:flex;align-items:center;justify-content:center;padding:20px;cursor:default;}
        .cm-modal-card{position:relative;width:100%;max-width:390px;background:var(--white);border-radius:16px;padding:22px 20px 20px;max-height:88vh;overflow:auto;}
        .cm-modal-x{position:absolute;top:11px;right:11px;background:none;border:0;padding:5px;cursor:pointer;color:var(--muted);line-height:0;}
      ` }} />

      <span className="cm-tag"><Crown size={11} style={{ verticalAlign: -1, color: T.gold }} /> TOP COMMUNITY MEMBER</span>

      <div className="cm-body">
        {leader ? (
          <>
            {/* No inline crown here: the tag above already carries one, and dropping
                it gives the name the tile's full width to scale into. */}
            <div className="cm-namewrap" ref={wrapRef}>
              <span className="cm-who" ref={textRef}>{leader.username}</span>
            </div>
            <div className="cm-sub">
              {leader.credits} {leader.credits === 1 ? 'player' : 'players'} brought in over the last 90 days
            </div>
            {/* Runners-up 2-5, so the tile reads as a podium rather than a single
                name. Rendered 2, 4, 3, 5 so the 2x2 grid places 4 to the right of
                2 and 5 to the right of 3. Empty places render as "Open" on purpose:
                it shows the spot is contested and reachable. */}
            <div className="cm-podium">
              {[1, 3, 2, 4].map((i) => {
                const r = data?.top?.[i] || null;
                return (
                  <div className="cm-prow" key={i}>
                    <span className="cm-prank">{i + 1}.</span>
                    {r ? (
                      <>
                        <span className="cm-nm">{r.username}</span>
                        <span className="cm-pn">({r.credits})</span>
                      </>
                    ) : (
                      <span className="cm-nm cm-vacant">Open</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="cm-namewrap" ref={wrapRef}>
              <span className="cm-who" ref={textRef} style={{ fontSize: 24, color: T.white }}>This spot is open</span>
            </div>
            <div className="cm-sub">Nobody has brought in a player yet recently.</div>
          </>
        )}
        <div className="cm-foot">How to get credit <ArrowRight size={13} style={{ verticalAlign: -1 }} /></div>
      </div>

      <div className="cm-panel">
        <div className="cm-h">How to get credit</div>
        {/* The "why". Owner-requested: this tile exists because the site is one
            person, so word of mouth is the whole growth channel. */}
        <div className="cm-why">I&apos;m a single person startup! Word of mouth is how this grows.</div>
        {/* Referral capture is mounted in the ROOT layout, so ?ref= is picked up on
            every route on the site, not just /quizzes. That is what makes the per-quiz
            and per-daily-game Share links free: same code, different path. */}
        <div className="cm-p">
          Registered users get a share link, and the Share button on every quiz and daily
          game already includes it. Anyone who opens one and finishes credits you, once.
        </div>
        {shareUrl ? (
          <>
            <div className="cm-link">
              <span className="cm-url" title={shareUrl}>{shareUrl.replace(/^https:\/\//, '')}</span>
              <button type="button" className="cm-copy" onClick={copy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="cm-join"
            onClick={(e) => { e.stopPropagation(); setJoinOpen(true); }}
          >
            <UserPlus size={13} /> Register to get your link
          </button>
        )}
      </div>

      {joinOpen && (
        <div className="cm-modal" onClick={(e) => { e.stopPropagation(); setJoinOpen(false); }}>
          <div className="cm-modal-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="cm-modal-x" aria-label="Close" onClick={() => setJoinOpen(false)}>
              <X size={17} />
            </button>
            <JoinLeaderboardForm
              hideIcon
              heading="Register to get your share link"
              identity={identity}
              onJoined={(id) => {
                setIdentity(id);
                setJoinOpen(false);
                // Re-read so the freshly minted ref_code and link render at once.
                load();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
