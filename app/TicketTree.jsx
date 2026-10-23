'use client';

// THE TICKET TREE (owner, 2026-10-23). Draws a player's referral chain as a
// family tree: you at the top, the friends you brought in (two tickets each)
// under you, and everyone they brought in, and on down, at a quarter ticket
// each however far it goes. Used two ways:
//   <TicketTree tree={me.tree} />   a player's real tree, from /api/quiz/drawing?tree=1
//   <TicketTree example />          the illustrated sample on the earn sections
// Stage tokens only, so it follows the page's light/dark switch. SVG text paints
// with currentColor off a token, never a literal ink (see the SVG paint rule).

import { DRAWING, formatTickets } from '@/lib/drawing';

// The sample: 3 friends, 3 of theirs, 2 more, 1 more. 6 + 1.5 = 7 1/2.
export const EXAMPLE_TREE = {
  kids: [
    { name: 'Maya', counted: true, kids: [
      { name: 'Ana', counted: true, kids: [
        { name: 'Cy', counted: true, kids: [{ name: 'Eli', counted: true, kids: [] }] },
        { name: 'Dee', counted: true, kids: [] },
      ] },
      { name: 'Ben', counted: true, kids: [] },
    ] },
    { name: 'Leo', counted: true, kids: [{ name: 'Fay', counted: true, kids: [] }] },
    { name: 'Sam', counted: true, kids: [] },
  ],
};

function levelsOf(kids) {
  const lv = [];
  const walk = (ns, d) => {
    for (const n of ns) {
      const l = lv[d - 1] || (lv[d - 1] = { depth: d, people: 0, counted: 0 });
      l.people += 1;
      if (n.counted) l.counted += 1;
      walk(n.kids || [], d + 1);
    }
  };
  walk(kids, 1);
  return lv;
}

const LEVEL_NAME = (d) => (d === 1 ? 'Your friends' : d === 2 ? 'Their friends' : d === 3 ? 'Their friends’ friends' : `${d} steps out`);
const per = (d) => (d === 1 ? DRAWING.friendTickets : DRAWING.indirect);

const SLOT = 54;
const ROW = 92;
// Where a link leaves a node (below its labels) and where it lands (its top).
const RAD = (d) => (d === 0 ? 22 : d === 1 ? 17 : 12);
const OUT = (d) => (d === 0 ? 22 : d === 1 ? 17 + 31 : 12 + 19);
const PAD = 26;

// A tidy top-down layout: every leaf takes the next slot, a parent sits over the
// middle of its children.
function layout(rootKids) {
  const nodes = [];
  const links = [];
  let next = 0;
  const place = (n, depth) => {
    const kids = n.kids || [];
    const xs = kids.map((k) => place(k, depth + 1));
    const x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : (next++) * SLOT;
    const me = { ...n, depth, x, y: depth * ROW };
    nodes.push(me);
    kids.forEach((k, i) => links.push({ x1: x, y1: depth * ROW + OUT(depth), x2: xs[i], y2: (depth + 1) * ROW - RAD(depth + 1) - 2, counted: k.counted }));
    return x;
  };
  const root = { name: null, counted: true, kids: rootKids };
  const rx = place(root, 0);
  const width = Math.max(1, next) * SLOT;
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  return { nodes, links, width, height: maxDepth * ROW, rx };
}

function initial(name) {
  const s = String(name || '').trim();
  return s ? s[0].toUpperCase() : '?';
}

export default function TicketTree({ tree, example = false, rootName = 'You' }) {
  const t = example ? EXAMPLE_TREE : tree;
  if (!t) return null;
  const kids = t.kids || [];
  const levels = example || !t.levels ? levelsOf(kids) : t.levels;
  const chain = levels.reduce((s, l) => s + l.counted * per(l.depth), 0);
  const { nodes, links, width, height } = layout(kids);
  const W = width + PAD * 2;
  const H = height + PAD * 2 + 22;
  const r = RAD;

  return (
    <div className={`ttr${example ? ' ex' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {kids.length ? (
        <div className="ttr-sc">
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
            aria-label={`${rootName}: ${levels.map((l) => `${l.people} ${LEVEL_NAME(l.depth).toLowerCase()}`).join(', ')}`}>
            <g transform={`translate(${PAD},${PAD})`}>
              {links.map((l, i) => (
                <path key={i} className={`ttr-ln${l.counted ? '' : ' off'}`}
                  d={`M${l.x1},${l.y1} C${l.x1},${(l.y1 + l.y2) / 2} ${l.x2},${(l.y1 + l.y2) / 2} ${l.x2},${l.y2}`} />
              ))}
              {nodes.map((n, i) => {
                const rad = r(n.depth);
                const cls = n.depth === 0 ? 'root' : n.depth === 1 ? 'd1' : 'dn';
                return (
                  <g key={i} className={`ttr-n ${cls}${n.counted ? '' : ' off'}`} transform={`translate(${n.x},${n.y})`}>
                    <g className="ttr-a" style={{ animationDelay: `${Math.min(n.depth, 6) * 0.12}s` }}>
                    <title>{n.depth === 0 ? rootName : `${n.name || 'A new player'}${n.counted ? ` · +${formatTickets(per(n.depth))} ticket` : ' · not counted (before your tickets started)'}`}</title>
                    <circle r={rad} />
                    <text className="ttr-i" y={n.depth === 0 ? 6 : 4.5} textAnchor="middle" fill="currentColor">
                      {n.depth === 0 ? '★' : initial(n.name)}
                    </text>
                    {n.depth === 0 ? (
                      <text className="ttr-nm" y={-rad - 8} textAnchor="middle" fill="currentColor">{rootName}</text>
                    ) : (
                      <text className="ttr-v" y={rad + 13} textAnchor="middle" fill="currentColor">
                        {n.counted ? `+${formatTickets(per(n.depth))}` : '–'}
                      </text>
                    )}
                    {n.depth === 1 && n.name ? (
                      <text className="ttr-lb" y={rad + 25} textAnchor="middle" fill="currentColor">{String(n.name).length > 8 ? `${String(n.name).slice(0, 7)}\u2026` : n.name}</text>
                    ) : null}
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      ) : (
        <p className="ttr-empty">No one in your tree yet. Share your link: every new player who finishes a game from it is two tickets, and everyone they bring in is a quarter more.</p>
      )}

      {levels.length ? (
        <div className="ttr-led">
          {levels.map((l) => (
            <div key={l.depth} className="ttr-row">
              <span className={`ttr-dot ${l.depth === 1 ? 'd1' : 'dn'}`} aria-hidden="true" />
              <span className="ttr-k">{LEVEL_NAME(l.depth)}</span>
              <span className="ttr-m">{l.counted} &times; {formatTickets(per(l.depth))}{l.people > l.counted ? <em> ({l.people - l.counted} before your tickets started)</em> : null}</span>
              <b>{formatTickets(l.counted * per(l.depth))}</b>
            </div>
          ))}
          <div className="ttr-row tot">
            <span className="ttr-k">{example ? 'This tree is worth' : 'Your tree is worth'}</span>
            <b>{formatTickets(chain)} ticket{chain === 1 ? '' : 's'}</b>
          </div>
          {!example && t.truncated ? <p className="ttr-note">Showing the first {t.shown} of {t.people} people. The totals count everyone.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

const CSS = `
.ttr{color:var(--stg-ink)}
.ttr-sc{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:12px;background:var(--stg-surf2);display:flex}
.ttr-sc svg{display:block;margin:0 auto;flex:none}
.ttr-ln{fill:none;stroke:#e8b43a;stroke-width:2;opacity:.85}
.ttr-ln.off{stroke:var(--stg-mute);stroke-dasharray:3 4;opacity:1}
.ttr-a{animation:ttr-pop .45s cubic-bezier(.2,.9,.3,1.3) both;transform-box:fill-box;transform-origin:center}
.ttr-n circle{stroke-width:2.5}
.ttr-n.root circle{fill:#e8b43a;stroke:#e8b43a}
.ttr-n.root .ttr-i{color:#2a1f04;font-size:17px}
.ttr-n.d1 circle{fill:var(--stg-raise);stroke:#e8b43a}
.ttr-n.dn circle{fill:color-mix(in srgb,#e8b43a 22%,var(--stg-raise));stroke:#e8b43a;stroke-width:2}
.ttr-n.off circle{fill:var(--stg-surf2);stroke:var(--stg-mute);stroke-dasharray:3 3}
.ttr-i{color:var(--stg-ink);font-size:13px;font-weight:800;font-family:inherit}
.ttr-n.dn .ttr-i{font-size:10.5px}
.ttr-v{color:var(--stg-acc-ink,var(--stg-acc));font-size:11.5px;font-weight:800;font-family:inherit}
.ttr-n.off .ttr-v{color:var(--stg-mute)}
.ttr-nm,.ttr-lb{color:var(--stg-ink2);font-size:11px;font-weight:700;font-family:inherit}
.ttr-nm{color:var(--stg-ink);font-size:12px;font-weight:800}
@keyframes ttr-pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.ttr-a{animation:none}}
.ttr-led{margin-top:12px;display:flex;flex-direction:column;gap:2px}
.ttr-row{display:flex;align-items:center;gap:10px;padding:7px 2px;border-bottom:1px solid var(--stg-line);font-size:13.5px}
.ttr-row b{margin-left:auto;font-weight:800;font-size:15px}
.ttr-k{font-weight:800}
.ttr-m{color:var(--stg-ink2);font-weight:600}
.ttr-m em{font-style:normal;color:var(--stg-mute)}
.ttr-dot{flex:none;width:12px;height:12px;border-radius:50%;border:2.5px solid #e8b43a;background:var(--stg-raise)}
.ttr-dot.dn{width:9px;height:9px;border-width:2px;background:color-mix(in srgb,#e8b43a 22%,var(--stg-raise))}
.ttr-row.tot{border-bottom:0;padding-top:10px}
.ttr-row.tot .ttr-k{font-size:14px}
.ttr-row.tot b{font-size:18px;color:var(--stg-acc-ink,var(--stg-acc))}
.ttr-note,.ttr-empty{margin:10px 0 0;font-size:13px;line-height:1.5;color:var(--stg-mute)}
`;
