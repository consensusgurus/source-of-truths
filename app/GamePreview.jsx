// THE BOARD BAND ON THE DETAILS CARD (owner, 2026-11-08: "D but with more
// monotone ... ideally it takes the category color"). A small drawing of what
// the game's board looks like, in three steps of ONE colour: the card sets
// --gpd (deep), --gpm (mid) and --gpw (the surface), so every drawing follows
// its category and both registers with no colour of its own. Every game has a
// drawing: a few dozen are drawn for the game itself, the rest use the shape
// their category shares (a sudoku grid, a quiz card, a chess strip...).
// viewBox is 296 x 84; nothing here reads the board, so it never leaks a
// day's answer.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { TILE_BY_KEY } from './GamePreviewTiles';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const W = 296, H = 84;
const T = ({ x, y, s = 14, a = 'middle', c = 't', children }) => (
  <text x={x} y={y} fontSize={s} textAnchor={a} className={c}>{children}</text>
);

// ---- shared pieces -------------------------------------------------------
function cells(x, y, cols, rows, sz, fn) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(fn(x + c * sz, y + r * sz, c, r, r * cols + c));
  return out;
}
const Eq = ({ txt }) => (
  <g>
    <T x={24} y={50} s={26} a="start">{txt}</T>
    {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={30 + i * 9} cy={68} r={2.6} className={i < 5 ? 'd' : 'm'} />)}
    <circle cx={246} cy={42} r={23} className="sm5" />
    <path d="M246 19a23 23 0 1 1 -21.9 30" className="s5" />
  </g>
);
const Seq = ({ items }) => (
  <g>{items.map((v, i) => {
    const x = 18 + i * 44, last = i === items.length - 1;
    return <g key={i}><rect x={x} y={24} width={38} height={36} rx={7} className={last ? 'd' : 'w'} /><T x={x + 19} y={48} s={16} c={last ? 'tw' : 't'}>{v}</T></g>;
  })}</g>
);
const Tiles = ({ word, hit = 0 }) => {
  const L = String(word).toUpperCase().slice(0, 7).split('');
  const sz = 34, gap = 6, x0 = (W - (L.length * sz + (L.length - 1) * gap)) / 2;
  return <g>{L.map((ch, i) => (
    <g key={i}><rect x={x0 + i * (sz + gap)} y={24} width={sz} height={36} rx={6} className={i === hit ? 'd' : 'w'} />
      <T x={x0 + i * (sz + gap) + sz / 2} y={48} s={17} c={i === hit ? 'tw' : 't'}>{ch}</T></g>
  ))}</g>;
};
const Quiz = ({ label }) => (
  <g>
    <rect x={16} y={9} width={264} height={24} rx={6} className="w" />
    <T x={28} y={25.5} s={11.5} a="start">{String(label || '').slice(0, 38)}</T>
    {[[16, 41], [152, 41], [16, 61], [152, 61]].map(([x, y], i) => (
      <g key={i}><rect x={x} y={y} width={128} height={16} rx={8} className={i === 1 ? 'd' : 'w'} />
        <rect x={x + 12} y={y + 6.5} width={i % 2 ? 56 : 74} height={3} rx={1.5} className={i === 1 ? 'wf' : 'm'} /></g>
    ))}
  </g>
);
function Grid({ n = 9, v = 'suds', color = false }) {
  const S = n === 16 ? 72 : 70, sz = S / n, x = (W - S) / 2, y = (H - S) / 2;
  const box = n === 9 ? 3 : n === 6 ? [3, 2] : n === 16 ? 4 : 3;
  const [bw, bh] = Array.isArray(box) ? box : [box, box];
  const thin = [], bold = [];
  for (let i = 1; i < n; i++) {
    (i % bw ? thin : bold).push(<path key={'v' + i} d={`M${x + i * sz} ${y}v${S}`} />);
    (i % bh ? thin : bold).push(<path key={'h' + i} d={`M${x} ${y + i * sz}h${S}`} />);
  }
  const dig = n === 16 || v === 'cages' || v === 'polka' || v === 'rim' ? [] : [[0, 0, 5], [2, 1, 3], [4, 4, 7], [7, 2, 1], [1, 6, 9], [6, 7, 4], [8, 8, 2], [3, 5, 8]].filter(([c, r]) => c < n && r < n);
  const deco = [];
  // Positions are written for 9x9; on a 6x6 they wrap, so a twin keeps its
  // parent's decoration inside its own smaller grid.
  const cx = (c) => x + (c % n) * sz + sz / 2, cy = (r) => y + (r % n) * sz + sz / 2;
  // EVERY MARK STAYS INSIDE ITS OWN GRID AND OFF THE PRINTED DIGITS (owner,
  // 2026-11-08). The 6x6 twins get their own positions: wrapping the 9x9 ones
  // made lines double back, clues stack and cages hang off the edge.
  const six = n === 6;
  if (v === 'cages') { const c2 = six ? 3 : 4, w2 = six ? 2 : 3; deco.push(<path key="c" className="s2" d={`M${x + 2} ${y + 2}h${sz * 2 - 4}v${sz - 4}h${-sz + 0}v${sz}h${-sz + 4}z M${x + sz * c2 + 2} ${y + sz * 3 + 2}h${sz * w2 - 4}v${sz - 4}h${-sz * w2 + 4}z`} />); deco.push(<T key="c1" x={x + 6} y={y + 8} s={6}>15</T>); deco.push(<T key="c2" x={x + sz * c2 + 6} y={y + sz * 3 + 8} s={6}>{six ? 7 : 12}</T>); }
  if (v === 'sando') for (let r = 0; r < n; r += 2) deco.push(<T key={r} x={x - 9} y={cy(r) + 3} s={8}>{[14, 9, 23, 0, 17][r / 2]}</T>);
  if (v === 'arrow') { const [a, b, e] = six ? [3, 3, 5] : [4, 4, 6]; deco.push(<g key="a"><circle cx={cx(1)} cy={cy(1)} r={sz * .38} className="sm" /><path className="sm" d={`M${cx(1) + 3} ${cy(1) + 3}L${cx(a)} ${cy(b)}L${cx(e)} ${cy(b)}`} /></g>); }
  if (v === 'knight') deco.push(<path key="k" className="sm" d={`M${cx(2)} ${cy(2)}L${cx(2)} ${cy(4)}L${cx(3)} ${cy(4)}`} />);
  if (v === 'diag') deco.push(<path key="d" className="sm" d={`M${x} ${y}L${x + S} ${y + S}M${x + S} ${y}L${x} ${y + S}`} />);
  if (v === 'window') [[1, 1], [5, 1], [1, 5], [5, 5]].forEach(([c, r], i) => deco.push(<rect key={i} x={x + c * sz} y={y + r * sz} width={sz * 3} height={sz * 3} className="m" opacity=".55" />));
  // A '>' sits on the line between column c and c + 1.
  if (v === 'sumo') (six ? [[1, 0], [3, 2], [0, 3], [4, 5]] : [[1, 0], [4, 3], [6, 6], [5, 5]]).forEach(([c, r], i) => deco.push(<T key={i} x={x + (c + 1) * sz} y={cy(r) + 3} s={8}>{'>'}</T>));
  if (v === 'five' || v === 'racecar') { const pts = six ? [[0, 5], [1, 3], [2, 4], [4, 2], [5, 3]] : [[0, 7], [2, 5], [3, 6], [5, 3], [7, 4]]; deco.push(<path key="f" className={v === 'five' ? 's2' : 'sm5'} d={pts.map(([c, r], i) => `${i ? 'L' : 'M'}${cx(c)} ${cy(r)}`).join('')} />); if (v === 'racecar') { const a = pts[0], b = pts[pts.length - 1]; deco.push(<rect key="ra" x={cx(a[0]) - sz * .35} y={cy(a[1]) - sz * .35} width={sz * .7} height={sz * .7} rx={1.5} className="d" />); deco.push(<rect key="rb" x={cx(b[0]) - sz * .35} y={cy(b[1]) - sz * .35} width={sz * .7} height={sz * .7} rx={1.5} className="d" />); } }
  if (v === 'mercury') { const [bc, br, tr, ec] = six ? [1, 4, 2, 3] : [2, 6, 2, 4]; deco.push(<g key="m"><circle cx={cx(bc)} cy={cy(br)} r={sz * .42} className="mb" /><path className="sm3" d={`M${cx(bc)} ${cy(br)}V${cy(tr)}H${cx(ec)}`} /></g>); }
  // Three edge-clue sudokus told apart (2026-11-08: "reuses far too many"):
  // Towers draws little towers of the clue's height, Frame two-digit sums on
  // two sides, Rim a set of three digits stacked at each end.
  const cols = six ? [0, 2, 3, 5] : [0, 2, 4, 6, 8];
  if (v === 'towers') cols.forEach((c, i) => { const h = [3, 1, 4, 2, 5][i] * 1.6; deco.push(<rect key={'t' + i} x={cx(c) - sz * 0.3} y={y - 1.5 - h} width={sz * 0.6} height={h} className="d" />); deco.push(<T key={'b' + i} x={cx(c)} y={y + S + 7} s={7}>{[2, 4, 1, 3, 2][i]}</T>); });
  if (v === 'frame') cols.forEach((c, i) => { deco.push(<T key={'t' + i} x={cx(c)} y={y - 2} s={6}>{[15, 7, 22, 11, 18][i]}</T>); deco.push(<T key={'l' + i} x={x - 6} y={cy(c) + 2} s={6}>{[12, 24, 9, 16, 13][i]}</T>); });
  if (v === 'rim') cols.slice(0, 3).forEach((c, i) => { [0, 1, 2].forEach((j) => deco.push(<T key={'t' + i + j} x={cx(c * 2 > n ? c : c)} y={y - 2 - (2 - j) * 6} s={5.5}>{['159', '268', '347'][i][j]}</T>)); });
  if (v === 'quilt') deco.push(<path key="q" className="m" opacity=".5" d={`M${x} ${y}h${sz * 4}v${sz * 2}h${-sz * 2}v${sz * 2}h${-sz * 2}z M${x + sz * 5} ${y + sz * 5}h${sz * 4}v${sz * 4}h${-sz * 2}v${-sz * 2}h${-sz * 2}z`} />);
  // A dot sits on the line between column c - 1 and c.
  if (v === 'polka') (six ? [[1, 2], [4, 1], [3, 3], [5, 5]] : [[3, 0], [5, 2], [6, 6], [7, 4], [2, 7]]).forEach(([c, r], i) => deco.push(<circle key={i} cx={x + c * sz} cy={cy(r)} r={2} className="d" />));
  if (v === 'whittle') [[2, 3], [6, 1], [5, 7]].forEach(([c, r], i) => deco.push(<path key={i} className="sm" d={`M${cx(c) - 3} ${cy(r) - 3}l6 6m0 -6l-6 6`} />));
  return (
    <g>
      <rect x={x} y={y} width={S} height={S} className="w" />
      {deco.filter((e) => e && e.props && e.props.className === 'm')}
      <g className="gl1">{thin}</g><g className="gl2">{bold}</g>
      {deco.filter((e) => !(e && e.props && e.props.className === 'm'))}
      {color
        ? [[0, 0], [2, 1], [4, 4], [7, 2], [1, 6], [6, 7], [8, 8], [3, 5], [5, 3], [10, 12], [13, 9]].filter(([c, r]) => c < n && r < n)
          .map(([c, r], i) => <rect key={i} x={x + c * sz + 1} y={y + r * sz + 1} width={sz - 2} height={sz - 2} rx={1.5} className={i % 2 ? 'd' : 'm'} />)
        : dig.map(([c, r, d], i) => <T key={i} x={cx(c)} y={cy(r) + sz * .3} s={sz * .78}>{d}</T>)}
    </g>
  );
}
const Kakuro = () => (
  <g>{cells(94, 6, 6, 4, 18, (x, y, c, r, i) => {
    const clue = r === 0 || c === 0;
    return <g key={i}><rect x={x} y={y} width={18} height={18} className={clue ? 'hm' : 'w'} />{clue && (r + c) % 2 ? <path d={`M${x} ${y}l18 18`} className="sm" /> : null}</g>;
  })}<T x={103} y={20} s={8}>{''}</T></g>
);
const Xword = () => {
  const blk = new Set([2, 6, 12, 19, 23]);
  const let_ = { 0: 'C', 1: 'L', 3: 'U', 9: 'E', 10: 'A', 14: 'S', 18: 'T', 22: 'O' };
  return <g>{cells(58, 12, 9, 3, 20, (x, y, c, r, i) => (
    <g key={i}><rect x={x} y={y} width={20} height={20} className={blk.has(i) ? 'd' : 'w'} />{let_[i] ? <T x={x + 10} y={y + 15} s={12}>{let_[i]}</T> : null}</g>
  ))}</g>;
};
const Search = () => {
  const L = 'MINDLOFTQRAESCOURPWZEBTKAOVHYN';
  return <g>
    <rect x={60} y={31} width={100} height={20} rx={10} className="m" />
    {cells(40, 12, 11, 3, 20, (x, y, c, r, i) => <T key={i} x={x + 10} y={y + 15} s={12}>{L[i % L.length]}</T>)}
  </g>;
};
const Cipher = () => (
  <g>{['Q', 'E', 'B', '', 'X', 'R', 'M'].map((ch, i) => ch ? (
    <g key={i}><rect x={44 + i * 30} y={14} width={26} height={26} rx={5} className="w" /><T x={57 + i * 30} y={32} s={13}>{ch}</T>
      <T x={57 + i * 30} y={64} s={15}>{'THE ART'[i]}</T><path d={`M${48 + i * 30} 70h18`} className="sm" /></g>
  ) : null)}</g>
);
const Chess = ({ target = 17 }) => (
  <g>{cells(60, 9, 8, 3, 22, (x, y, c, r, i) => (
    <g key={i}><rect x={x} y={y} width={22} height={22} className={(c + r) % 2 ? 'm' : 'w0'} />
      {[2, 13, 5, 20].includes(i) ? <g><circle cx={x + 11} cy={y + 8} r={4} className="d" /><path d={`M${x + 5} ${y + 18}h12l-2 -7h-8z`} className="d" /></g> : null}
      {[9, 22].includes(i) ? <g><circle cx={x + 11} cy={y + 8} r={4} className="w" /><path d={`M${x + 5} ${y + 18}h12l-2 -7h-8z`} className="w" /></g> : null}
      {i === target ? <rect x={x + 1.5} y={y + 1.5} width={19} height={19} rx={2} className="s3" /> : null}</g>
  ))}<rect x={60} y={9} width={176} height={66} className="sm" /></g>
);
const Othello = () => {
  const blk = new Set([0, 1, 10, 11, 4, 22, 14, 16]), wht = new Set([2, 3, 9, 12, 13, 17, 19, 20]);
  return <g>{cells(60, 9, 8, 3, 22, (x, y, c, r, i) => (
    <g key={i}><rect x={x} y={y} width={22} height={22} className="w" />
      {blk.has(i) ? <circle cx={x + 11} cy={y + 11} r={8} className="d" /> : wht.has(i) ? <circle cx={x + 11} cy={y + 11} r={8} className="m" /> : null}
      {i === 23 ? <rect x={x + 2} y={y + 2} width={18} height={18} rx={3} className="s3" /> : null}</g>
  ))}</g>;
};
const Four = () => (
  <g><rect x={80} y={3} width={136} height={78} rx={8} className="m" />{cells(85, 7, 7, 4, 18, (x, y, c, r, i) => (
    <circle key={i} cx={x + 9} cy={y + 9} r={6.5} className={[22, 23, 16, 24, 26, 18].includes(i) ? 'd' : [25, 17, 27, 11].includes(i) ? 'w' : 'g0'} />
  ))}</g>
);
const Quarto = () => (
  <g>{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const x = 34 + i * 30, tall = i % 2 === 0, round = i < 4, hollow = i % 4 > 1, h = tall ? 46 : 28;
    return round
      ? <g key={i}><rect x={x} y={70 - h} width={22} height={h} rx={11} className={i === 5 ? 'd' : 'w'} />{hollow ? <circle cx={x + 11} cy={70 - h + 8} r={4} className="m" /> : null}</g>
      : <g key={i}><rect x={x} y={70 - h} width={22} height={h} rx={3} className={i === 5 ? 'd' : 'w'} />{hollow ? <rect x={x + 7} y={70 - h + 4} width={8} height={8} className="m" /> : null}</g>;
  })}</g>
);
const Go = () => (
  <g><rect x={98} y={4} width={100} height={76} rx={4} className="m" opacity=".6" />
    {Array.from({ length: 6 }, (_, i) => <path key={'v' + i} d={`M${108 + i * 16} 12v60M108 ${12 + i * 12}h80`} className="sm" />)}
    {[[0, 1, 'd'], [1, 2, 'w'], [2, 1, 'd'], [3, 3, 'w'], [2, 3, 'd'], [4, 2, 'w'], [1, 4, 'd']].map(([c, r, k], i) => <circle key={i} cx={108 + c * 16} cy={12 + r * 12} r={6} className={k} />)}
  </g>
);
const Cards = ({ ranks = ['A', 'K', '7'] }) => (
  <g>{ranks.map((rk, i) => (
    <g key={i} transform={`rotate(${(i - 1) * 9} 148 110)`}><rect x={126} y={10} width={44} height={62} rx={5} className={i === 2 ? 'w' : 'w'} />
      <T x={136} y={26} s={12} a="start">{rk}</T><circle cx={148} cy={46} r={7} className={i === 1 ? 'd' : 'm'} /></g>
  ))}</g>
);
const Mahj = () => (
  <g>{[0, 1, 2, 3, 4, 5].map((i) => {
    const x = 60 + i * 30, y = i === 2 || i === 3 ? 14 : 22;
    return <g key={i}><rect x={x + 3} y={y + 3} width={26} height={36} rx={4} className="m" /><rect x={x} y={y} width={26} height={36} rx={4} className="w" />
      <circle cx={x + 13} cy={y + 13} r={4} className={i % 2 ? 'd' : 'm'} /><path d={`M${x + 7} ${y + 26}h12`} className="s3" /></g>;
  })}</g>
);
const Pairs = () => (
  <g>{cells(54, 10, 6, 2, 32, (x, y, c, r, i) => (
    <g key={i}><rect x={x + 2} y={y + 2} width={28} height={28} rx={5} className={i === 3 || i === 8 ? 'w' : 'd'} />
      {i === 3 || i === 8 ? <circle cx={x + 16} cy={y + 16} r={7} className="m" /> : null}</g>
  ))}</g>
);
const Shoe = () => (
  <g><Cards ranks={['9', 'A', '']} /><circle cx={232} cy={56} r={14} className="m" /><circle cx={232} cy={56} r={8} className="w" /><T x={64} y={50} s={22}>21</T></g>
);
const Taire = () => (
  <g>{[0, 1, 2, 3, 4, 5].map((c) => (
    <g key={c}>{Array.from({ length: (c % 3) + 2 }, (_, r) => (
      <rect key={r} x={64 + c * 30} y={8 + r * 12} width={24} height={34} rx={4} className={r === (c % 3) + 1 ? 'w' : 'd'} />
    ))}</g>
  ))}</g>
);
const LGrid = () => (
  <g>{cells(82, 6, 6, 4, 18, (x, y, c, r, i) => (
    <g key={i}><rect x={x} y={y} width={18} height={18} className="w" />
      {(r === 0) !== (c === 0) ? <rect x={x + 5} y={y + 7.5} width={8} height={3} rx={1.5} className="m" /> : null}
      {r && c && (i * 7) % 5 === 0 ? <circle cx={x + 9} cy={y + 9} r={4} className="d" /> : r && c && (i * 3) % 4 === 1 ? <path d={`M${x + 5} ${y + 5}l8 8m0 -8l-8 8`} className="s2" /> : null}</g>
  ))}</g>
);
const Venn = () => (
  <g><circle cx={130} cy={36} r={24} className="sm3" /><circle cx={166} cy={36} r={24} className="sm3" /><circle cx={148} cy={58} r={24} className="sm3" /><circle cx={148} cy={44} r={5} className="d" /></g>
);
const Lamps = () => (
  <g>{cells(94, 6, 6, 4, 18, (x, y, c, r, i) => (
    <g key={i}><rect x={x} y={y} width={18} height={18} className={[3, 8, 15, 22].includes(i) ? 'd' : 'w'} />
      {[1, 10, 13, 20].includes(i) ? <circle cx={x + 9} cy={y + 9} r={5} className="m" /> : null}
      {[3, 15].includes(i) ? <T x={x + 9} y={y + 13} s={10} c="tw">{i === 3 ? 2 : 1}</T> : null}</g>
  ))}</g>
);
const Plot = () => (
  <g><rect x={94} y={6} width={108} height={72} className="w" />
    <path d="M130 6v48M94 54h108M166 6v48M130 30h36" className="s2" />
    {[[112, 34, 6], [148, 22, 2], [148, 46, 2], [184, 34, 6], [148, 70, 6]].map(([x, y, n], i) => <T key={i} x={x} y={y} s={12}>{n}</T>)}
  </g>
);
const Track = () => (
  <g>{cells(94, 6, 6, 4, 18, (x, y, c, r, i) => <rect key={i} x={x} y={y} width={18} height={18} className="w" />)}
    <path d="M103 33H139V69H175V15H193" className="s5" /></g>
);
const Tangle = () => (
  <g><path d="M148 8 177.4 25v34L148 76 118.6 59V25z" className="w" />
    <path d="M148 8C150 30 146 54 148 76M118.6 25C140 36 156 48 177.4 59M177.4 25C156 36 140 48 118.6 59" className="s3" />
    {[[148, 8], [177.4, 25], [177.4, 59], [148, 76], [118.6, 59], [118.6, 25]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} className="d" />)}</g>
);
const Maze = () => (
  <g><rect x={84} y={6} width={128} height={72} rx={6} className="w" />
    <path d="M84 30h40M148 6v30M172 54h40M124 54v24M108 54h40" className="s2" />
    {Array.from({ length: 9 }, (_, i) => (i === 4 ? null : <circle key={i} cx={100 + i * 12} cy={18} r={2} className="m" />))}
    <circle cx={196} cy={42} r={8} className="d" /></g>
);
const Block = ({ die }) => (
  <g>{cells(70, 46, 8, 1, 20, (x, y, c, r, i) => <path key={i} d={`M${x} ${y + 8}l10 -8h20l-10 8z`} className={i === 6 ? 'd' : 'm'} />)}
    {die
      ? <g><rect x={118} y={10} width={32} height={32} rx={6} className="w" />{[[126, 18], [142, 34], [134, 26]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.8} className="d" />)}</g>
      : <g><rect x={120} y={8} width={20} height={40} className="d" /><path d="M120 8l8 -6h20l-8 6zM140 8l8 -6v40l-8 6z" className="m" /></g>}</g>
);
const Jig = () => (
  <g>{[0, 1, 2].map((i) => (
    <path key={i} transform={`translate(${82 + i * 46} 14)`} className={i === 1 ? 'd' : 'w'}
      d="M0 0h16a6 6 0 1 0 12 0h16v18a6 6 0 1 1 0 12v18h-16a6 6 0 1 0 -12 0h-16v-18a6 6 0 1 1 0 -12z" />
  ))}</g>
);
const Slide = ({ mode }) => (
  <g>{cells(92, 6, 4, 2, 36, (x, y, c, r, i) => i === 7 ? null : (
    <g key={i}><rect x={x + 2} y={y + 2} width={32} height={32} rx={6} className={i === (mode === 'swap' ? 2 : 6) ? 'd' : 'w'} />
      <T x={x + 18} y={y + 24} s={14} c={i === (mode === 'swap' ? 2 : 6) ? 'tw' : 't'}>{mode === 'spin' ? '' : i + 1}</T>
      {mode === 'spin' ? <path d={`M${x + 10} ${y + 18}a8 8 0 1 1 8 8`} className={i === 6 ? 'sw' : 's2'} /> : null}</g>
  ))}</g>
);
const Dots = () => (
  <g>{cells(90, 8, 6, 3, 22, (x, y, c, r, i) => <circle key={i} cx={x + 11} cy={y + 11} r={4} className={[0, 5, 7, 16].includes(i) ? 'd' : 'm'} />)}
    <path d="M101 19H211M123 41V63H189" className="s3" /></g>
);
const Park = () => (
  <g><rect x={88} y={6} width={120} height={72} rx={4} className="w" />
    {[[94, 12, 36, 14, 'm'], [136, 12, 14, 34, 'm'], [100, 32, 36, 14, 'd'], [160, 40, 14, 34, 'm'], [180, 12, 22, 14, 'm']].map(([x, y, w, h, k], i) => <rect key={i} x={x} y={y} width={w} height={h} rx={3} className={k} />)}
    <path d="M208 32v14" className="s5" /></g>
);
const Snug = () => (
  <g><path d="M96 12h36v18h-18v36h-18z" className="d" /><path d="M140 12h18v54h-18z M164 30h36v18h-36z" className="m" /><path d="M182 52h18v14h-36v-14z" className="w" /></g>
);
const Bars = () => (
  <g>{[30, 54, 22, 40, 14].map((h, i) => <rect key={i} x={96 + i * 22} y={74 - h} width={16} height={h} rx={3} className={i === 1 ? 'd' : 'm'} />)}<path d="M88 74h120" className="s2" /></g>
);
const Globe = ({ pin = true }) => (
  <g><circle cx={148} cy={42} r={32} className="w" /><path d="M116 42h64M148 10a14 32 0 0 1 0 64a14 32 0 0 1 0 -64M120 26h56M120 58h56" className="sm" />
    {pin ? <path d="M160 20a8 8 0 0 1 8 8c0 7-8 14-8 14s-8-7-8-14a8 8 0 0 1 8-8z" className="d" /> : null}</g>
);
const Ping = () => (
  <g><circle cx={148} cy={42} r={10} className="sm3" /><circle cx={148} cy={42} r={22} className="sm" /><circle cx={148} cy={42} r={34} className="sm" />
    <circle cx={148} cy={42} r={4} className="d" /><circle cx={176} cy={30} r={4} className="m" /></g>
);
const Chart = () => (
  <g><path d="M24 70h248" className="sm" /><path d="M24 60L58 52L84 58L112 36L140 42L170 24L198 30L232 14L272 20" className="s3" /><circle cx={272} cy={20} r={4} className="d" /></g>
);
const Timeline = () => (
  <g><path d="M24 50h248" className="s3" />{[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${40 + i * 44} 44v12`} className="s2" />)}
    {['1900', '1950', '2000'].map((y, i) => <T key={y} x={40 + i * 88} y={72} s={10}>{y}</T>)}
    <path d="M172 18h24v16h-8l-4 6l-4 -6h-8z" className="d" /><T x={184} y={30} s={9} c="tw">?</T></g>
);
const Price = ({ label }) => (
  <g><path d="M60 22h60l18 20l-18 20h-60z" className="w" /><circle cx={124} cy={42} r={3} className="d" /><T x={90} y={48} s={17}>$?</T>
    {[0, 1, 2].map((i) => <rect key={i} x={160 + i * 38} y={30} width={32} height={24} rx={6} className={i === 1 ? 'd' : 'w'} />)}
    <T x={148} y={78} s={9}>{String(label || '').slice(0, 40)}</T></g>
);
const Snake = () => (
  <g><rect x={78} y={6} width={140} height={72} rx={4} className="w" />
    <path d="M96 60H140V30H180" className="d6" /><circle cx={200} cy={30} r={5} className="m" /></g>
);
const Tetro = () => (
  <g><rect x={104} y={2} width={88} height={80} rx={4} className="w" />
    {[[108, 64, 'm'], [124, 64, 'm'], [140, 64, 'm'], [156, 64, 'd'], [172, 64, 'd'], [108, 48, 'm'], [156, 48, 'd'], [172, 48, 'm'], [124, 8, 'd'], [140, 8, 'd'], [140, 24, 'd']].map(([x, y, k], i) => <rect key={i} x={x} y={y} width={14} height={14} rx={2} className={k} />)}</g>
);
const Fruit = () => (
  <g>{cells(94, 6, 6, 4, 18, (x, y, c, r, i) => <circle key={i} cx={x + 9} cy={y + 9} r={6.5} className={[7, 8, 9].includes(i) ? 'd' : (i % 3) ? 'm' : 'w'} />)}</g>
);
const Simon = () => (
  <g>{[0, 1, 2, 3].map((q) => <path key={q} transform={`rotate(${q * 90} 148 42)`} d="M151 39V9a33 33 0 0 1 30 30z" className={q === 1 ? 'd' : 'm'} />)}<circle cx={148} cy={42} r={10} className="w" /></g>
);
const Mines = () => (
  <g>{cells(94, 6, 6, 4, 18, (x, y, c, r, i) => {
    const open = [0, 1, 2, 6, 7, 12, 13, 18].includes(i), n = { 2: 1, 7: 2, 13: 1, 18: 1 }[i];
    return <g key={i}><rect x={x} y={y} width={18} height={18} className={open ? 'w' : 'hm'} />{n ? <T x={x + 9} y={y + 13} s={11}>{n}</T> : null}{i === 9 ? <path d={`M${x + 6} ${y + 14}v-10l7 3l-7 3`} className="d" /> : null}</g>;
  })}</g>
);
const Runner = () => (
  <g><path d="M24 70h248" className="s3" /><rect x={110} y={44} width={50} height={8} rx={2} className="m" /><rect x={186} y={30} width={50} height={8} rx={2} className="m" />
    <circle cx={70} cy={56} r={8} className="d" /><path d="M64 50q6 -8 12 0" className="s2" /><circle cx={210} cy={20} r={4} className="d" /></g>
);
const Grid9 = (v) => () => <Grid v={v} />;


// ---- THE SQUARE TILE (owner, 2026-11-08: option B, "board on the left") --
// The Details card now carries the drawing in a small square tile beside the
// name, not a band across the top. Shapes that are already squarish (every
// sudoku, the globes, the logic grids) are reused and cropped to their own
// bounds. Shapes drawn as a long strip (a quiz card, a row of letter tiles,
// an equation, a chess strip...) would shrink to a sliver in a square, so
// each has a square redraw here, drawn about the band's centre (148, 42)
// inside an 84 x 84 box.
const SX = 148, SY = 42;
const QuizSq = () => (
  <g><rect x={110} y={4} width={76} height={20} rx={5} className="w" />
    <rect x={118} y={12.5} width={46} height={3} rx={1.5} className="m" />
    {[0, 1, 2, 3].map((i) => (
      <g key={i}><rect x={110} y={30 + i * 13} width={76} height={10} rx={5} className={i === 1 ? 'd' : 'w'} />
        <rect x={118} y={33.5 + i * 13} width={i % 2 ? 30 : 40} height={3} rx={1.5} className={i === 1 ? 'wf' : 'm'} /></g>
    ))}</g>
);
const TilesSq = ({ word, hit = 0 }) => {
  const L = String(word).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).split('');
  const cols = L.length <= 4 ? 2 : 3, rows = Math.ceil(L.length / cols);
  const sz = 22, gap = 5, w = cols * sz + (cols - 1) * gap, h = rows * sz + (rows - 1) * gap;
  return <g>{L.map((ch, i) => {
    const r = Math.floor(i / cols), inRow = Math.min(cols, L.length - r * cols);
    const x0 = SX - (inRow * sz + (inRow - 1) * gap) / 2, x = x0 + (i % cols) * (sz + gap), y = SY - h / 2 + r * (sz + gap);
    return <g key={i}><rect x={x} y={y} width={sz} height={sz} rx={5} className={i === hit ? 'd' : 'w'} />
      <T x={x + sz / 2} y={y + 15.5} s={13} c={i === hit ? 'tw' : 't'}>{ch}</T></g>;
  })}</g>;
};
const PriceSq = () => (
  <g><path d="M116 8h44l14 15l-14 15h-44z" className="w" /><circle cx={164} cy={23} r={2.5} className="d" /><T x={138} y={29} s={15}>$?</T>
    {[0, 1, 2].map((i) => <rect key={i} x={113 + i * 25} y={50} width={21} height={20} rx={5} className={i === 1 ? 'd' : 'w'} />)}</g>
);

// ---- which drawing each game wears ------------------------------------
const BY_KEY = {
  // Numbers
  blitz: () => <Eq txt={'7 × 8 = ?'} />, blitzed: () => <Eq txt={'5 + 10 × 2'} />, gap: () => <Eq txt={'7 × ? = 56'} />,
  back: () => <Eq txt={'? = 56'} />, calc: () => <Eq txt={'48 ÷ 6 = ?'} />, crunch: () => <Eq txt={'12% of 50'} />,
  series: () => <Seq items={['3', '7', '11', '15', '19', '?']} />, sums: Kakuro, tally: () => <Tiles word="1234" hit={2} />,
  carve: Plot, cipher: Cipher,
  // Sudoku
  suds: Grid9('suds'), quilt: Grid9('quilt'), cages: Grid9('cages'), sando: Grid9('sando'), towers: Grid9('towers'),
  mercury: Grid9('mercury'), arrow: Grid9('arrow'), knight: Grid9('knight'), diag: Grid9('diag'), frame: Grid9('frame'),
  window: Grid9('window'), five: Grid9('five'), racecar: Grid9('racecar'), sumo: Grid9('sumo'), rim: Grid9('rim'),
  polka: Grid9('polka'), whittle: Grid9('whittle'), sixes: () => <Grid n={6} />, giant: () => <Grid n={16} />,
  // Word
  emcee: Xword, encore: Xword, arcos: Xword, scour: Search, garble: Cipher, scram: () => <Tiles word="MSARC" hit={1} />,
  // Trivia
  tape: Chart, circa: Timeline, streak: Timeline, history: Timeline,
  // Geography
  ping: Ping, carmen: () => <Globe />, span: () => <Globe />, atlas: () => <Globe />, flank: () => <Globe pin={false} />, passport: () => <Globe />,
  // Logic
  venn: Venn, lamps: Lamps, plot: Plot, paths: Track, tangled: Tangle, chomp: Maze, hedge: Maze, topple: () => <Block />,
  roll: () => <Block die />, jig: Jig, saw: Jig, slide: () => <Slide />, swap: () => <Slide mode="swap" />, spin: () => <Slide mode="spin" />,
  connect: Dots, duet: Dots, etch: Dots, park: Park, impound: Park, junkyard: Park, snug: Snug, sudoclue: LGrid,
  // End Game
  turn: Othello, four: Four, gift: Quarto, yose: Go, mate: () => <Chess target={4} />, check: () => <Chess target={11} />,
  chain: () => <Chess target={14} />, defend: () => <Chess target={21} />, swindle: () => <Chess target={7} />, queen: () => <Chess target={18} />,
  // Cards
  mahj: Mahj, pairs: Pairs, shoe: Shoe, taire: Taire, crib: () => <Cards ranks={['5', 'J', '5']} />, hold: () => <Cards ranks={['A', 'A', 'K']} />,
  cell: Taire, finesse: () => <Cards ranks={['Q', 'K', 'J']} />, hands: () => <Cards ranks={['10', 'J', 'Q']} />,
  // Arcade
  snake: Snake, blocks: Tetro, squash: Fruit, simon: Simon, sweep: Mines, dario: Runner,
};
const PRICE = new Set(['pricer', 'dealer', 'realtor', 'agent', 'curator', 'picks']);
function drawingFor(g, sq) {
  if (sq && TILE_BY_KEY[g.key]) return TILE_BY_KEY[g.key]();
  if (BY_KEY[g.key]) return BY_KEY[g.key]();
  if (PRICE.has(g.key)) return sq ? <PriceSq /> : <Price label={g.tag} />;
  switch (g.cat) {
    case 'Word': return sq ? <TilesSq word={g.name} /> : <Tiles word={g.name} />;
    case 'Trivia': return sq ? <QuizSq /> : <Quiz label={g.tag} />;
    case 'Geography': return <Globe />;
    case 'Numbers': return sq ? <QuizSq /> : <Quiz label={g.tag} />;
    case 'Sudoku': {
      // THE 6x6 AND COLOR TWINS (2026-11-08) read their parent from the tag
      // ("Cages at 6x6", "Mercury in rainbow color, 9x9").
      const t = String(g.tag || '');
      const m = t.match(/^(\w+) (?:in (?:rainbow )?color|at 6x6)/);
      const ALIAS = { kayak: 'racecar', lip: 'rim', sixes: 'suds' };
      const base = m ? (ALIAS[m[1].toLowerCase()] || m[1].toLowerCase()) : 'suds';
      const n = /16x16/.test(t) ? 16 : /6x6/.test(t) ? 6 : 9;
      return <Grid n={n} v={base} color={/color/.test(t)} />;
    }
    case 'Crowd Psychology': return <Bars />;
    case 'Logic': return <LGrid />;
    case 'End Game': return <Chess />;
    case 'Cards': return <Cards />;
    case 'Arcade': return <Tetro />;
    default: return sq ? <QuizSq /> : <Quiz label={g.tag} />;
  }
}

export default function GamePreview({ gameKey, square = false }) {
  const g = DAILY_GAME_MAP[gameKey];
  const ref = useRef(null);
  // The square tile crops to the drawing's own bounds, measured before paint,
  // so a 70px sudoku grid and an 84px redraw both fill the tile the same way.
  const [vb, setVb] = useState(`${SX - 42} 0 84 84`);
  useIso(() => {
    if (!square || !ref.current) return undefined;
    // The card can mount hidden (another view, the snapshot cover), where
    // getBBox reads zero, so it measures again once the tile has a size.
    const measure = () => {
      try {
        const b = ref.current && ref.current.getBBox ? ref.current.getBBox() : null;
        if (!b || !b.width || !b.height) return false;
        const s = Math.max(b.width, b.height) * 1.1 + 4, cx = b.x + b.width / 2, cy = b.y + b.height / 2;
        setVb(`${(cx - s / 2).toFixed(1)} ${(cy - s / 2).toFixed(1)} ${s.toFixed(1)} ${s.toFixed(1)}`);
        return true;
      } catch (e) { return false; }
    };
    if (measure() || typeof ResizeObserver === 'undefined') return undefined;
    const svg = ref.current.ownerSVGElement;
    if (!svg) return undefined;
    const ro = new ResizeObserver(() => { if (measure()) ro.disconnect(); });
    ro.observe(svg);
    return () => ro.disconnect();
  }, [square, gameKey]);
  if (!g) return null;
  if (square) {
    return (
      <svg className="gp" viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <g ref={ref}>{drawingFor(g, true)}</g>
      </svg>
    );
  }
  return (
    <svg className="gp" viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      {/* A margin all round (2026-11-08: "elements spilling out"): every
          drawing is set at 84% about the band's centre, so nothing touches or
          crosses the band's edges whatever it was drawn to. */}
      <g transform={`translate(${W / 2} ${H / 2}) scale(0.84) translate(${-W / 2} ${-H / 2})`}>{drawingFor(g)}</g>
    </svg>
  );
}

export const GP_CSS = `
.gp{display:block;overflow:visible;}
.gp .d{fill:var(--gpd);}
.gp .m,.gp .mb{fill:var(--gpm);}
.gp .w{fill:var(--gpw);stroke:var(--gpd);stroke-width:1.5;}
.gp .w0{fill:var(--gpw);}
.gp .hm{fill:var(--gpm);stroke:var(--gpd);stroke-width:1.5;}
.gp .wf{fill:var(--gpw);}
.gp .g0{fill:var(--gpt);}
.gp .s2,.gp .s3,.gp .s5,.gp .sw,.gp .d6{fill:none;stroke-linecap:round;stroke-linejoin:round;}
.gp .s2{stroke:var(--gpd);stroke-width:2;}
.gp .s3{stroke:var(--gpd);stroke-width:3;}
.gp .s5{stroke:var(--gpd);stroke-width:5;}
.gp .d6{stroke:var(--gpd);stroke-width:12;}
.gp .sw{stroke:var(--gpw);stroke-width:2;}
.gp .sm,.gp .sm3,.gp .sm5{fill:none;stroke:var(--gpm);stroke-linecap:round;stroke-linejoin:round;}
.gp .sm{stroke-width:1.5;}.gp .sm3{stroke-width:3;}.gp .sm5{stroke-width:5;}
.gp .gl1 path{stroke:var(--gpm);stroke-width:.75;}
.gp .gl2 path{stroke:var(--gpd);stroke-width:1.5;}
.gp text{fill:var(--gpd);font-family:inherit;font-weight:800;}
.gp text.tw{fill:var(--gpw);}
`;
