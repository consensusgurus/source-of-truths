"use client";

// GauntletBackPop — the nudge BACK to the Trivia Gauntlet after the Trivia
// Encore (owner, 2026-10-14). EncorePop sends a Gauntlet finisher on to the
// Encore; a player who comes to the Encore first used to finish it with no
// word about the Gauntlet at all. This is the same offer the other way round.
//
// THE CALLER DECIDES WHETHER IT SHOWS, exactly as with EncorePop: the run page
// mounts it only on the Encore, only while today's Gauntlet is unfinished on
// this device, and passes `ready` once its own ending has settled. The card
// waits OPEN_MS after `ready`, then calls onShown() and onOpenChange(true).
// Closing (Escape, the backdrop, the X or Not now) calls onOpenChange(false).
//
// REVIEW: `?gauntlet=preview` forces it open at once, spending nothing.
//
// It wears RunDoorPop's clothes (RUN_DOOR_CSS), so every run offer on the site
// reads as one family.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { RUN_DOOR_CSS, RUN_DOORS } from './RunDoorPop';

const OPEN_MS = 1600;
const ACCENT = '#7dd3fc';
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const PREVIEW_GAMES = [
  { key: 'deep', name: 'Deep' }, { key: 'atlas', name: 'Atlas' }, { key: 'sport', name: 'Sport' },
  { key: 'script', name: 'Script' }, { key: 'biz', name: 'Biz' }, { key: 'quotes', name: 'Quotes' }, { key: 'streak', name: 'Streak' },
];

function tagColour(name) {
  const D = RUN_DOORS.gauntlet;
  const hit = D && D.tags.find(([t]) => t === name);
  return hit ? hit[1] : ACCENT;
}

export default function GauntletBackPop({ ready = false, games = [], href = '/trivia', onOpenChange, onShown }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const fired = useRef(false);
  const cbs = useRef({ onOpenChange, onShown });
  cbs.current = { onOpenChange, onShown };

  const close = useCallback(() => {
    setOpen(false);
    try { cbs.current.onOpenChange && cbs.current.onOpenChange(false); } catch (e) {}
  }, []);

  // ?gauntlet=preview: open at once for review, spending nothing.
  useEffect(() => {
    let q = null;
    try { q = new URLSearchParams(window.location.search).get('gauntlet'); } catch (e) {}
    if (q !== 'preview' || fired.current) return;
    fired.current = true;
    setPreview(true);
    setOpen(true);
    try { cbs.current.onOpenChange && cbs.current.onOpenChange(true); } catch (e) {}
  }, []);

  useEffect(() => {
    if (!ready || fired.current) return undefined;
    const t = setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      setOpen(true);
      try { cbs.current.onShown && cbs.current.onShown(); } catch (e) {}
      try { cbs.current.onOpenChange && cbs.current.onOpenChange(true); } catch (e) {}
    }, OPEN_MS);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const list = games && games.length ? games : (preview ? PREVIEW_GAMES : []);
  if (!open || !list.length) return null;
  const n = list.length;
  return (
    <div className="rdp-bd" role="dialog" aria-modal="true" aria-labelledby="gbp-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: RUN_DOOR_CSS(ACCENT) }} />
      <div className="rdp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rdp-x" onClick={close} aria-label="Close"><X size={14} strokeWidth={2.4} /></button>
        <i className="rdp-e">Trivia Encore, done</i>
        <h2 className="rdp-h" id="gbp-h">Now the Trivia Gauntlet</h2>
        <div className="rdp-tags">{list.map((g, i) => <span key={g.key} style={{ background: tagColour(g.name), animationDelay: `${i * 70}ms` }}>{g.name}</span>)}</div>
        <p className="rdp-p">
          The Encore was the quizzes that sat out today. The Gauntlet is the main run: {(WORDS[n] || String(n)).toLowerCase()} trivia
          quizzes back to back, one life in each. Play both and the Encore board shows your combined score.
        </p>
        <a className="rdp-go" href={href}>Run the Gauntlet</a>
        <button type="button" className="rdp-no" onClick={close}>Not now</button>
      </div>
    </div>
  );
}
