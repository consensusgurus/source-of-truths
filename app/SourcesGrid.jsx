'use client';
import { T } from '@/lib/theme';

// A clean grid of publication chips: logo (favicon) + name + consensus count.
// Purely presentational. Used by the homepage sources popover and /sources page.
//
// Favicons are loaded as background images via Google's favicon service, which
// returns a generic globe rather than a 404 for unknown domains, so a chip
// never shows a broken-image icon. Sources with no domain show a lettered tile.
//
// `linked`: when true, chips with a domain become links to the publication's
// homepage (used on the /sources page; the homepage popover keeps them static).
export default function SourcesGrid({ sources = [], minColWidth = 190, linked = false, theme = 'paper' }) {
  const PAL = theme === 'site'
    ? { chipBg: T.white, chipBorder: 'rgba(20,22,28,0.10)', hoverBg: '#f3f5f8', hoverShadow: T.accent, logoBg: T.surface, logoBorder: 'rgba(20,22,28,0.08)', logoFont: "'Manrope',system-ui,sans-serif", logoColor: T.muted, nameFont: "'Manrope',system-ui,sans-serif", nameColor: T.ink, countColor: T.muted }
    : { chipBg: T.surfaceAlt, chipBorder: 'rgba(26,22,17,0.16)', hoverBg: '#e4dbc8', hoverShadow: T.accent, logoBg: T.surface, logoBorder: 'rgba(26,22,17,0.10)', logoFont: "'Fraunces',serif", logoColor: T.slate, nameFont: "'Manrope',sans-serif", nameColor: T.ink, countColor: T.slate };
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        .sot-src-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(${minColWidth}px, 1fr));
          gap:8px;
        }
        .sot-src-chip{
          display:flex;align-items:center;gap:10px;
          padding:8px 11px;
          background:${PAL.chipBg};
          border:1px solid ${PAL.chipBorder};
          border-radius:10px;
          min-width:0;
          text-decoration:none;color:inherit;
        }
        a.sot-src-chip{transition:transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;}
        a.sot-src-chip:hover{background:${PAL.hoverBg};transform:translate(-2px,-2px);box-shadow:2px 2px 0 ${PAL.hoverShadow};border-radius:10px;}
        .sot-src-logo{
          flex:0 0 auto;width:20px;height:20px;border-radius:4px;
          background-color:${PAL.logoBg};
          background-size:contain;background-position:center;background-repeat:no-repeat;
          display:flex;align-items:center;justify-content:center;
          font-family:${PAL.logoFont};font-weight:700;font-size:11px;color:${PAL.logoColor};
          border:1px solid ${PAL.logoBorder};
        }
        .sot-src-name{
          flex:1 1 auto;min-width:0;
          font-family:${PAL.nameFont};font-size:13px;line-height:1.25;color:${PAL.nameColor};
          overflow-wrap:anywhere;word-break:break-word;
        }
        .sot-src-count{
          flex:0 0 auto;
          font-family:'DM Mono',monospace;font-size:11px;color:${PAL.countColor};
        }
      ` }} />
      <div className="sot-src-grid">
        {sources.map((s) => {
          const inner = (
            <>
              <span
                className="sot-src-logo"
                style={s.favicon ? { backgroundImage: `url(${s.favicon})` } : undefined}
              >
                {s.favicon ? '' : (s.name || '?').charAt(0).toUpperCase()}
              </span>
              <span className="sot-src-name">{s.name}</span>
              <span className="sot-src-count">({s.count})</span>
            </>
          );
          const title = `${s.name} — in ${s.count} list${s.count === 1 ? '' : 's'}`;
          if (linked && s.domain) {
            return (
              <a
                className="sot-src-chip"
                key={s.key}
                title={title}
                href={`https://${s.domain}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {inner}
              </a>
            );
          }
          return (
            <div className="sot-src-chip" key={s.key} title={title}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
