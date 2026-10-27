'use client';

// HOW TO PLAY, ONE SHEET FOR EVERY DAILY (owner, 2026-10-27).
//
// Every daily used to draw its own rules modal inline: a cream or raised card,
// a small heading, an X, the rules, and a Play button that only closed it. The
// owner asked for the sheet to match the site's restyle, for that button to say
// Close (it never started anything), and for the Report an issue link to live
// at the foot of the sheet now that the How to play link at the foot of each page
// is gone (the ? in the header opens this instead).
//
// It only draws. The game passes its own close handler (which also stamps the
// game's seen-the-rules key) and its own rules body, so nothing about a game's
// rules or first-visit behaviour moved.

import React, { useEffect, useRef } from 'react';
import ReportIssue from './ReportIssue';

export default function HelpSheet({ onClose, self = null, name = null, report = true, children }) {
  const closeRef = useRef(null);
  useEffect(() => {
    try { closeRef.current && closeRef.current.focus({ preventScroll: true }); } catch (e) {}
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="hsh-scrim" onClick={onClose} role="presentation">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hsh" role="dialog" aria-modal="true" aria-labelledby="hsh-title" onClick={(e) => e.stopPropagation()}>
        <div className="hsh-top">
          <span className="hsh-q" aria-hidden="true">?</span>
          <h2 id="hsh-title">How to play</h2>
          <button type="button" className="hsh-x" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="hsh-body">{children}</div>
        <button type="button" ref={closeRef} className="hsh-close" onClick={onClose}>Close</button>
        {report ? (
          <div className="hsh-foot"><ReportIssue self={self} name={name} align="center" /></div>
        ) : null}
      </div>
    </div>
  );
}

// No apostrophes in here: this is a style element's text.
const CSS = `
.hsh-scrim{position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(6,10,18,.58);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);}
.hsh{width:100%;max-width:480px;max-height:88vh;overflow-y:auto;box-sizing:border-box;padding:20px 22px 18px;border-radius:16px;
  background:var(--stg-surf,#ffffff);color:var(--stg-ink,#08222e);border:2px solid var(--stg-ink,#08222e);
  font-family:'Manrope',system-ui,-apple-system,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.28);}
.hsh-top{display:flex;align-items:center;gap:10px;margin:0 0 12px;}
.hsh-q{flex:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;border:2px solid currentColor;font-size:17px;font-weight:800;line-height:1;}
.hsh-top h2{margin:0;font:inherit;font-size:22px;font-weight:800;letter-spacing:-.01em;line-height:1.2;flex:1;min-width:0;}
.hsh-x{flex:none;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;border:2px solid currentColor;background:transparent;color:inherit;cursor:pointer;padding:0;}
.hsh-body{font-size:14px;line-height:1.55;}
.hsh-close{display:block;width:100%;height:48px;margin:16px 0 0;border:0;border-radius:999px;cursor:pointer;
  background:var(--stg-ink,#08222e);color:var(--stg-surf,#ffffff);font-family:inherit;font-size:15px;font-weight:800;letter-spacing:.01em;}
.hsh-close:focus-visible,.hsh-x:focus-visible{outline:3px solid var(--stg-acc-ink,var(--stg-acc,#2563eb));outline-offset:2px;}
.hsh-foot{margin-top:6px;}
.hsh-foot .ri-wrap{margin-top:8px;}
`;
