'use client';
// THE DOORS INTO THE COMMUNITY (owner, 2026-11-18, the "Where To Link" mockups,
// spots 2, 3 and 5): the Community pill in the desktop cap with a live count,
// and the Community band on the phone home above the rank row. Both read only
// the public summary (shared and cached), so they cost one small request and
// carry no spoiler. The count shows only while people are posting.
import React, { useEffect, useState } from 'react';
import { fetchSummary } from './communityClient';

export function useTalkingNow() {
  const [n, setN] = useState(null);
  useEffect(() => {
    let dead = false;
    fetchSummary().then((d) => { if (!dead && d && d.available !== false) setN(d.players || 0); });
    return () => { dead = true; };
  }, []);
  return n;
}

export function CommunityPill({ className = '' }) {
  const n = useTalkingNow();
  return (
    <a className={'cm-pill ' + className} href="/community" title="The Mind Loft community">
      <style dangerouslySetInnerHTML={{ __html: PILL_CSS }} />
      {n ? <span className="d" aria-hidden="true" /> : null}
      <b>Community</b>
      {n ? <i>{n} Talking</i> : null}
    </a>
  );
}

export function CommunityBand() {
  const n = useTalkingNow();
  return (
    <a className="cm-mband" href="/community">
      <style dangerouslySetInnerHTML={{ __html: PILL_CSS }} />
      {n ? <span className="d" aria-hidden="true" /> : null}
      <span className="t"><b>Community</b>{n ? <> {n} talking now</> : <> Talk, ideas and clubs</>}</span>
      <u>See The Community</u>
    </a>
  );
}

const PILL_CSS = `
.cm-pill{display:inline-flex;align-items:center;gap:7px;height:40px;box-sizing:border-box;padding:0 16px;border:1px solid var(--stg-ink);border-radius:999px;
  background:#a6f4e7;color:#08222e !important;text-decoration:none;white-space:nowrap;font-size:14px;line-height:1.25;flex:none;}
.stage-page:not([data-stage-theme=light]) .cm-pill{background:color-mix(in srgb,#a6f4e7 24%,transparent);color:var(--stg-ink) !important;}
.cm-pill b{font-weight:800;}
.cm-pill i{font-style:normal;font-weight:600;opacity:.8;}
.cm-pill .d,.cm-mband .d{width:8px;height:8px;border-radius:50%;background:#0b7a5c;flex:none;}
.stage-page:not([data-stage-theme=light]) .cm-pill .d,.stage-page:not([data-stage-theme=light]) .cm-mband .d{background:#5eead4;}
.cm-pill:hover{filter:brightness(.97);}
.cm-pill:focus-visible,.cm-mband:focus-visible{outline:2px solid var(--stg-ink);outline-offset:2px;}
@media (max-width:1100px){ .cm-pill i{display:none;} }
@media (max-width:900px){ .cm-pill{display:none;} }
.cm-mband{display:flex;align-items:center;gap:8px;border:1px solid var(--stg-ink);border-radius:12px;padding:8px 11px 9px;font-size:12.5px;line-height:1.3;
  background:#a6f4e7;color:#08222e !important;text-decoration:none;margin-top:6px;}
.stage-page:not([data-stage-theme=light]) .cm-mband{background:color-mix(in srgb,#a6f4e7 22%,transparent);color:var(--stg-ink) !important;}
.cm-mband .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:1px;}
.cm-mband b{font-weight:800;}
.cm-mband u{flex:none;font-weight:800;text-underline-offset:3px;}
`;
