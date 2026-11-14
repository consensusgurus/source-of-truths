// ONE DRAWING PER PUZZLE (owner, 2026-11-08: "This reuses far too many for
// similar puzzles and many that aren't"). The square tile on the Details card
// gave twenty-eight trivia dailies the same quiz card, twelve logic games the
// same grid and the three Parker lots the same lot. Every daily outside the
// sudoku family now has its own small drawing of what it actually asks you to
// do. Drawn about (148, 42) inside an 84 x 84 box, in the same three steps of
// one colour as GamePreview (classes d, m, w, s2, sm...), and cropped to its
// own bounds by GamePreview's square mode. Nothing here reads a day's board.
// A NEW DAILY GETS ITS OWN ENTRY HERE; never point it at another game's.

const T = ({ x, y, s = 12, a = 'middle', c = 't', children }) => (
  <text x={x} y={y} fontSize={s} textAnchor={a} className={c}>{children}</text>
);
function cells(x, y, cols, rows, sz, fn) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(fn(x + c * sz, y + r * sz, c, r, r * cols + c));
  return out;
}
const Grid = ({ x, y, n, m = n, sz, fill = () => 'w' }) => cells(x, y, n, m, sz, (cx, cy, c, r, i) => <rect key={i} x={cx} y={cy} width={sz} height={sz} className={fill(i, c, r)} />);
const Tile = ({ x, y, ch, on, sz = 18, s = 11 }) => (
  <g><rect x={x} y={y} width={sz} height={sz} rx={4} className={on ? 'd' : 'w'} /><T x={x + sz / 2} y={y + sz / 2 + s * 0.36} s={s} c={on ? 'tw' : 't'}>{ch}</T></g>
);
const Bar = ({ x, y, w, h = 4, k = 'm' }) => <rect x={x} y={y} width={w} height={h} rx={h / 2} className={k} />;
const Card = ({ x, y, w = 20, h = 28, rk, k = 'w', rot = 0 }) => (
  <g transform={rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined}>
    <rect x={x} y={y} width={w} height={h} rx={3} className={k} />{rk ? <T x={x + 5} y={y + 10} s={8} a="start" c={k === 'd' ? 'tw' : 't'}>{rk}</T> : null}
  </g>
);
const Pawn = ({ x, y, k = 'd', s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><circle cx={0} cy={-6} r={3.6} className={k} /><path d="M-5.5 5h11l-1.8 -7h-7.4z" className={k} /></g>
);
const Board = ({ x = 112, y = 6, n = 4, sz = 18 }) => cells(x, y, n, n, sz, (cx, cy, c, r, i) => <rect key={i} x={cx} y={cy} width={sz} height={sz} className={(c + r) % 2 ? 'm' : 'w0'} />);
const Head = ({ x, y, k = 'm', s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><circle cx={0} cy={-7} r={6} className={k} /><path d="M-10 10a10 9 0 0 1 20 0z" className={k} /></g>
);
const Bubble = ({ x, y, w, h, k = 'w', tail = 'l' }) => (
  <path d={tail === 'l'
    ? `M${x + 4} ${y}h${w - 8}a4 4 0 0 1 4 4v${h - 8}a4 4 0 0 1 -4 4h${-w + 18}l-8 7v-7h-2a4 4 0 0 1 -4 -4v${-h + 8}a4 4 0 0 1 4 -4z`
    : `M${x + 4} ${y}h${w - 8}a4 4 0 0 1 4 4v${h - 8}a4 4 0 0 1 -4 4h-2v7l-8 -7h${-w + 18}a4 4 0 0 1 -4 -4v${-h + 8}a4 4 0 0 1 4 -4z`} className={k} />
);
const Eq = ({ y = 30, txt, s = 13 }) => (
  <g><rect x={108} y={y - 18} width={80} height={26} rx={6} className="w" /><T x={148} y={y} s={s}>{txt}</T></g>
);
const Clock = ({ x = 148, y = 62, r = 13, frac = 0.7 }) => {
  const a = frac * 2 * Math.PI, ex = x + r * Math.sin(a), ey = y - r * Math.cos(a);
  return <g><circle cx={x} cy={y} r={r} className="sm5" /><path d={`M${x} ${y - r}A${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`} className="s5" /></g>;
};
const Ladder = ({ hot = 2, rungs = 5 }) => (
  <g><path d="M120 4v76M176 4v76" className="s3" />
    {Array.from({ length: rungs }, (_, i) => <rect key={i} x={124} y={8 + i * (72 / rungs)} width={48} height={8} rx={4} className={i < hot ? 'd' : i === hot ? 'm' : 'w'} />)}</g>
);

// ---- Trivia --------------------------------------------------------------
const Sport = () => (
  <g><circle cx={148} cy={42} r={32} className="w" /><path d="M148 30l11 8l-4 13h-14l-4 -13z" className="d" />
    <path d="M148 30V10M159 38l18 -6M155 51l11 15M141 51l-11 15M137 38l-18 -6" className="s2" /></g>
);
const Biz = () => (
  <g><rect x={110} y={24} width={76} height={50} rx={6} className="w" /><path d="M136 24v-8a4 4 0 0 1 4 -4h16a4 4 0 0 1 4 4v8" className="s3" />
    <rect x={110} y={40} width={76} height={6} className="m" /><rect x={142} y={36} width={12} height={14} rx={2} className="d" /></g>
);
const Script = () => (
  <g><rect x={110} y={32} width={76} height={44} rx={4} className="w" />
    <path d="M110 18l72 -12l3 12l-72 12z" className="d" /><path d="M126 15l8 12M146 12l8 12M166 8l8 12" className="sw" />
    <Bar x={120} y={46} w={44} k="m" h={5} /><Bar x={120} y={58} w={30} k="m" h={5} /></g>
);
const Quotes = () => (
  <g><path d="M112 46q0 -28 24 -32v8q-12 4 -12 14h12v26h-24z" className="d" /><path d="M150 46q0 -28 24 -32v8q-12 4 -12 14h12v26h-24z" className="m" /></g>
);
const Sci = () => (
  <g><ellipse cx={148} cy={42} rx={36} ry={13} className="sm3" /><ellipse cx={148} cy={42} rx={36} ry={13} transform="rotate(60 148 42)" className="sm3" />
    <ellipse cx={148} cy={42} rx={36} ry={13} transform="rotate(-60 148 42)" className="sm3" /><circle cx={148} cy={42} r={7} className="d" /></g>
);
const Pulse = () => (
  <g><path d="M148 76l-30 -30a17 17 0 0 1 30 -22a17 17 0 0 1 30 22z" className="m" />
    <path d="M110 48h22l6 -12l8 24l7 -16l4 4h29" className="s3" /></g>
);
const Gene = () => (
  <g><path d="M126 4c0 20 44 20 44 38s-44 18 -44 38" className="s3" /><path d="M170 4c0 20 -44 20 -44 38s44 18 44 38" className="sm3" />
    {[14, 30, 54, 70].map((y, i) => <path key={i} d={`M${i % 3 ? 134 : 136} ${y}h${i % 3 ? 28 : 24}`} className="s2" />)}</g>
);
const Orbit = () => (
  <g><circle cx={140} cy={46} r={20} className="d" /><ellipse cx={140} cy={46} rx={36} ry={9} transform="rotate(-18 140 46)" className="sm3" />
    <circle cx={178} cy={14} r={6} className="m" /></g>
);
const Eureka = () => (
  <g><path d="M148 6a24 24 0 0 1 14 43v9h-28v-9a24 24 0 0 1 14 -43z" className="m" />
    <rect x={134} y={62} width={28} height={6} rx={2} className="d" /><rect x={138} y={72} width={20} height={6} rx={2} className="d" />
    <path d="M142 46l6 -16l6 16" className="s2" /></g>
);
const Bond = () => (
  <g><path d="M138 6h20M142 6v22l-24 42a6 6 0 0 0 5 9h50a6 6 0 0 0 5 -9l-24 -42v-22" className="w" />
    <path d="M125 58h46l8 14a4 4 0 0 1 -4 5h-54a4 4 0 0 1 -4 -5z" className="m" /><circle cx={142} cy={66} r={3} className="d" /><circle cx={156} cy={70} r={2} className="d" /></g>
);
const Foodie = () => (
  <g><circle cx={150} cy={44} r={26} className="w" /><circle cx={150} cy={44} r={16} className="m" />
    <path d="M114 10v22M110 10v14a4 4 0 0 0 8 0v-14M114 32v44" className="s3" /><path d="M186 10c-8 6 -8 26 0 28v38" className="s3" /></g>
);
const Art = () => (
  <g><path d="M150 8c-24 0 -42 16 -42 34s16 32 34 32c8 0 8 -8 4 -12s0 -10 8 -10h14c12 0 20 -6 20 -16c0 -16 -16 -28 -38 -28z" className="w" />
    <circle cx={128} cy={34} r={6} className="d" /><circle cx={146} cy={22} r={6} className="m" /><circle cx={166} cy={26} r={6} className="d" /><circle cx={130} cy={54} r={6} className="m" /></g>
);
const History = () => (
  <g><path d="M110 22l38 -16l38 16z" className="d" /><rect x={110} y={24} width={76} height={5} className="m" />
    {[116, 136, 156, 174].map((x) => <rect key={x} x={x} y={32} width={8} height={36} className="w" />)}<rect x={108} y={70} width={80} height={8} className="d" /></g>
);
const Streak = () => (
  <g><path d="M148 6c4 16 24 22 24 44a24 24 0 0 1 -48 0c0 -12 8 -18 10 -26c4 8 6 10 10 12c4 -10 4 -20 4 -30z" className="m" />
    <path d="M148 46c2 8 12 10 12 20a12 12 0 0 1 -24 0c0 -8 6 -10 8 -14c2 2 2 4 4 4z" className="d" /><T x={148} y={40} s={11}>40</T></g>
);
const Deep = () => (
  <g><rect x={108} y={4} width={80} height={10} rx={3} className="m" />
    {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={118 + i * 3} y={20 + i * 10} width={60 - i * 6} height={6} rx={3} className={i < 3 ? 'd' : 'w'} />)}
    <path d="M178 24v48l-5 -6m5 6l5 -6" className="s2" /></g>
);
const Dating = () => (
  <g>{[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x={124} y={4 + i * 16} width={62} height={12} rx={4} className={i === 2 ? 'd' : 'w'} />
    <T x={115} y={14 + i * 16} s={10}>{i + 1}</T><Bar x={130} y={8.5 + i * 16} w={i % 2 ? 30 : 42} k={i === 2 ? 'wf' : 'm'} h={3} /></g>)}</g>
);
const Extra = () => (
  <g><rect x={110} y={6} width={76} height={72} rx={3} className="w" /><rect x={116} y={12} width={64} height={8} className="d" />
    <Bar x={116} y={26} w={24} h={6} k="m" /><rect x={144} y={25} width={36} height={8} className="d" />
    {[40, 50, 60, 70].map((y, i) => <Bar key={y} x={116} y={y} w={i % 2 ? 46 : 64} h={3} k="m" />)}</g>
);
const Bracket = () => (
  <g>{[6, 22, 46, 62].map((y) => <rect key={y} x={108} y={y} width={22} height={12} rx={3} className="w" />)}
    <path d="M130 12h8v16h-8M138 20h10M130 52h8v16h-8M138 60h10M148 20v40M148 40h14" className="s2" />
    <rect x={162} y={33} width={26} height={14} rx={3} className="d" /></g>
);
const Listed = () => (
  <g>{[0, 1, 2, 3, 4].map((i) => <g key={i}><T x={114} y={14 + i * 16} s={10}>{i + 1}</T>
    <rect x={122} y={4 + i * 16} width={64} height={12} rx={3} className={i === 0 || i === 3 ? 'd' : i === 1 ? 'm' : 'w'} /></g>)}</g>
);
const Clade = () => (
  <g><path d="M112 42h12M124 18v48M124 18h14M124 66h14M138 8v20M138 8h14M138 28h14M138 56v20M138 56h14M138 76h14M152 2v12M152 2h12M152 14h12" className="s2" />
    {[[164, 2], [164, 14], [152, 28], [152, 56], [152, 76]].map(([x, y], i) => <circle key={i} cx={x + 6} cy={y} r={5} className={i === 3 ? 'd' : 'm'} />)}</g>
);
const Dossier = () => (
  <g>{[0, 1, 2].map((r) => cells(108, 8 + r * 26, 5, 1, 16, (x, y, c, _, i) => (
    <g key={r * 5 + i}><rect x={x + 1} y={y} width={14} height={20} rx={3} className={(r * 2 + c) % 3 === 0 ? 'd' : 'w'} />
      {(r * 2 + c) % 3 === 1 ? <path d={`M${x + 8} ${y + 15}v-10m-4 4l4 -4l4 4`} className="s2" /> : (r * 2 + c) % 3 === 2 ? <path d={`M${x + 8} ${y + 5}v10m-4 -4l4 4l4 -4`} className="s2" /> : null}</g>
  )))}</g>
);
const Bacon = () => (
  <g><Head x={122} y={22} k="d" /><Head x={174} y={62} k="m" />
    <rect x={136} y={34} width={24} height={16} rx={2} className="w" /><path d="M140 34v16M156 34v16" className="sm" />
    <path d="M128 34l8 6M160 46l8 6" className="s3" /></g>
);
// a profile card: banner, a hidden face, a name bar and job lines with logo tiles
const Resume = () => (
  <g><rect x={110} y={4} width={76} height={76} rx={4} className="w" /><rect x={110} y={4} width={76} height={16} rx={4} className="m" />
    <circle cx={126} cy={24} r={9} className="d" /><rect x={140} y={24} width={36} height={5} rx={2} className="d" />
    {[0, 1, 2].map((i) => <g key={i}><rect x={118} y={40 + i * 13} width={9} height={9} rx={2} className="m" /><rect x={132} y={41 + i * 13} width={44 - i * 8} height={4} rx={2} className="sm" /></g>)}</g>
);
// a filing cover: a header band, form lines and one blacked-out name
const Filing = () => (
  <g><rect x={112} y={4} width={72} height={76} rx={3} className="w" /><rect x={112} y={4} width={72} height={12} rx={3} className="m" />
    <rect x={120} y={22} width={40} height={7} rx={1} className="d" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={120} y={36 + i * 10} width={56 - (i % 2) * 14} height={4} rx={2} className="sm" />)}</g>
);
const Redact = () => (
  <g><rect x={110} y={4} width={76} height={76} rx={3} className="w" />
    {[0, 1, 2, 3, 4, 5].map((r) => [[116, 18], [138, 22], [164, 16]].map(([x, w], c) => (
      <rect key={r * 3 + c} x={x} y={12 + r * 11} width={w} height={6} rx={1} className={(r + c) % 4 === 1 ? 'm' : 'd'} />
    )))}</g>
);
const Niche = () => (
  <g><Grid x={128} y={22} n={3} sz={20} fill={(i) => (i === 0 || i === 4 ? 'm' : 'w')} />
    {[0, 1, 2].map((i) => <g key={i}><rect x={131 + i * 20} y={6} width={14} height={12} rx={3} className="d" /><rect x={110} y={25 + i * 20} width={14} height={14} rx={3} className="d" /></g>)}</g>
);
const Potluck = () => (
  <g><path d="M112 34h72v26a14 14 0 0 1 -14 14h-44a14 14 0 0 1 -14 -14z" className="w" /><rect x={108} y={30} width={80} height={6} rx={3} className="d" />
    <path d="M128 22q-4 -6 0 -12M148 22q-4 -6 0 -12M168 22q-4 -6 0 -12" className="sm3" /><T x={148} y={60} s={13}>×3</T></g>
);
const Mixtape = () => (
  <g><rect x={108} y={14} width={80} height={54} rx={6} className="w" /><rect x={118} y={22} width={60} height={22} rx={4} className="m" />
    <circle cx={132} cy={33} r={6} className="d" /><circle cx={164} cy={33} r={6} className="d" /><path d="M124 68l6 -12h36l6 12" className="s2" /></g>
);
const Mishmash = () => (
  <g><rect x={110} y={10} width={36} height={36} rx={5} className="w" /><T x={128} y={33} s={13}>Aa</T>
    <rect x={150} y={10} width={36} height={36} rx={5} className="m" /><path d="M158 20l20 16M158 36l20 -16" className="s2" />
    <rect x={130} y={48} width={36} height={32} rx={5} className="w" /><path d="M148 54a7 7 0 0 1 7 7c0 6 -7 12 -7 12s-7 -6 -7 -12a7 7 0 0 1 7 -7z" className="d" /></g>
);
const Focus = () => (
  <g><rect x={110} y={6} width={76} height={72} rx={4} className="m" /><rect x={136} y={30} width={24} height={24} className="d" />
    <path d="M114 20v-10h10M172 10h10v10M182 64v10h-10M124 74h-10v-10" className="s3" /><path d="M132 26h32v32h-32z" className="sw" /></g>
);
const Thread = () => (
  <g><rect x={108} y={18} width={80} height={48} className="d" />{[0, 1, 2, 3, 4, 5, 6].map((i) => <g key={i}><rect x={111 + i * 11} y={21} width={6} height={5} className="w0" /><rect x={111 + i * 11} y={58} width={6} height={5} className="w0" /></g>)}
    {[0, 1, 2].map((i) => <rect key={i} x={112 + i * 25} y={30} width={22} height={24} rx={2} className="m" />)}
    <path d="M108 44c14 -10 22 10 40 0s26 10 40 0" className="sw" /></g>
);
const Slot = () => (
  <g>{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={108 + i * 16.5} y={50} width={14} height={20} rx={3} className={i === 1 || i === 3 ? 'd' : 'w'} />)}
    <path d="M110 76h76" className="s2" /><rect x={135} y={8} width={26} height={20} rx={3} className="m" /><path d="M148 30v14m-5 -5l5 5l5 -5" className="s2" /></g>
);
const Circa = () => (
  <g><rect x={116} y={6} width={64} height={30} rx={5} className="w" /><T x={148} y={28} s={17}>19??</T>
    <path d="M110 58h76" className="s3" /><path d="M130 50v16M166 50v16" className="s3" /><rect x={130} y={54} width={36} height={8} className="m" /><path d="M118 58l6 -5v10zM178 58l-6 -5v10z" className="d" /></g>
);
const Tape = () => (
  <g><path d="M108 78h80M108 78V6" className="sm" /><path d="M112 66L124 56L134 62L146 38L158 46L170 24L180 30L186 12" className="s3" /><circle cx={186} cy={12} r={4} className="d" /></g>
);
const Atlas = () => (
  <g><circle cx={148} cy={42} r={34} className="w" /><path d="M114 42h68M148 8a16 34 0 0 1 0 68a16 34 0 0 1 0 -68M120 24h56M120 60h56" className="sm" />
    <path d="M128 24c6 -4 14 2 12 10s-10 6 -12 12s-8 -2 -6 -10s2 -10 6 -12zM158 46c8 -4 16 4 12 12s-12 8 -14 0s-2 -10 2 -12z" className="m" /></g>
);
// ---- Geography -----------------------------------------------------------
const Carmen = () => (
  <g><circle cx={140} cy={48} r={30} className="w" /><path d="M110 48h60M140 18a12 30 0 0 1 0 60a12 30 0 0 1 0 -60" className="sm" />
    <path d="M122 56q24 -40 50 -28" className="s2" /><circle cx={122} cy={56} r={4} className="m" />
    <path d="M176 6a9 9 0 0 1 9 9c0 8 -9 16 -9 16s-9 -8 -9 -16a9 9 0 0 1 9 -9z" className="d" /></g>
);
const Span = () => (
  <g><path d="M110 10h22l4 18l-26 6z" className="d" /><path d="M132 10h24l-4 22h-16z" className="m" /><path d="M156 10h30v26l-34 -4z" className="w" />
    <path d="M110 34l26 -6l16 4l-4 22l-38 4z" className="w" /><path d="M152 32l34 4v20l-38 -2z" className="m" /><path d="M110 58l38 -4l38 2v22h-76z" className="w" />
    <path d="M186 56v22h-38l0 -24z" className="d" /></g>
);
const Passport = () => (
  <g><rect x={120} y={4} width={56} height={76} rx={5} className="d" /><circle cx={148} cy={36} r={15} className="sw" />
    <path d="M133 36h30M148 21a6 15 0 0 1 0 30a6 15 0 0 1 0 -30" className="sw" /><rect x={132} y={62} width={32} height={5} rx={2.5} className="m" /></g>
);
const Flank = () => (
  <g><path d="M108 4h34l-4 22l-30 6z" className="m" /><path d="M142 4h46v30l-22 -2l-24 -6z" className="w" /><path d="M108 32l30 -6l-2 28l-28 6z" className="w" />
    <path d="M138 26l28 6l-2 26l-28 -4z" className="d" /><path d="M166 32l22 2v26l-24 -2z" className="m" /><path d="M108 60l28 -6l28 4l24 2v20h-80z" className="m" /></g>
);
// ---- Logic ---------------------------------------------------------------
const Alibi = () => (
  <g><Head x={120} y={30} k="m" s={0.9} /><Head x={140} y={30} k="m" s={0.9} /><Head x={160} y={30} k="d" s={0.9} /><Head x={180} y={30} k="m" s={0.9} />
    <circle cx={152} cy={58} r={14} className="w" /><circle cx={152} cy={58} r={14} className="s3" /><path d="M162 68l14 12" className="d6" /></g>
);
const Crown = ({ x, y, k = 'd' }) => <path d={`M${x - 6} ${y + 4}v-9l3 4l3 -6l3 6l3 -4v9z`} className={k} />;
const Jester = () => (
  <g><Grid x={112} y={6} n={4} sz={18} fill={(i, c, r) => (c < 2 && r < 2) || (c === 3 && r > 1) ? 'hm' : 'w'} />
    {[[0, 1], [2, 0], [1, 3], [3, 2]].map(([c, r], i) => <Crown key={i} x={121 + c * 18} y={15 + r * 18} />)}</g>
);
const Judges = () => (
  <g><Grid x={112} y={6} n={4} sz={18} fill={(i, c, r) => (r < 2 && c > 1) || (r > 2) ? 'hm' : 'w'} />
    {[[0, 0], [2, 1], [3, 3], [1, 2]].map(([c, r], i) => <g key={i} transform={`rotate(-35 ${121 + c * 18} ${15 + r * 18})`}><rect x={115 + c * 18} y={10 + r * 18} width={12} height={6} rx={1} className="d" /><rect x={120 + c * 18} y={16 + r * 18} width={2} height={7} className="d" /></g>)}</g>
);
const Sworn = () => (
  <g><Bubble x={110} y={6} w={42} h={22} /><path d="M120 17l4 4l8 -8" className="s2" />
    <Bubble x={144} y={30} w={42} h={22} tail="r" k="m" /><path d="M158 37l10 8M168 37l-10 8" className="s2" />
    <Bubble x={110} y={56} w={42} h={22} /><path d="M120 67l4 4l8 -8" className="s2" /></g>
);
const Axiom = () => (
  <g><Grid x={112} y={6} n={4} sz={18} fill={(i) => [0, 5, 10, 15, 3, 12].includes(i) ? 'd' : [6, 9].includes(i) ? 'm' : 'w'} /></g>
);
const Hearsay = () => (
  <g><Head x={122} y={66} k="d" /><Head x={174} y={66} k="m" />
    <Bubble x={108} y={6} w={36} h={26} /><T x={126} y={23} s={11}>A</T><Bubble x={152} y={6} w={36} h={26} tail="r" k="m" /><T x={170} y={23} s={11}>B</T></g>
);
const Stands = () => (
  <g>{[0, 1, 2, 3].map((r) => <g key={r}><rect x={108} y={6 + r * 19} width={80} height={16} rx={2} className={r === 0 ? 'm' : 'w'} />
    <T x={116} y={18 + r * 19} s={10}>{r + 1}</T><Bar x={124} y={12 + r * 19} w={26} k="d" />
    {['W', 'D', 'L'].map((t, c) => <T key={t} x={160 + c * 10} y={18 + r * 19} s={9}>{r === 2 && c === 1 ? '?' : t}</T>)}</g>)}</g>
);
const Sudoclue = () => (
  <g><Grid x={112} y={6} n={4} sz={18} fill={(i, c, r) => (r < 2 && c < 2 ? 'hm' : 'w')} />
    <Pawn x={121} y={17} s={0.8} /><Pawn x={157} y={35} k="m" s={0.8} /><Pawn x={139} y={53} s={0.8} /><Pawn x={175} y={71} k="m" s={0.8} /></g>
);
const Fib = () => (
  <g><Grid x={112} y={6} n={3} sz={24} />
    {[[136, 18, '<'], [160, 18, '>'], [136, 42, '>'], [124, 30, 'v'], [172, 54, '^']].map(([x, y, t], i) => (
      <g key={i}><circle cx={x} cy={y} r={6} className={i === 2 ? 'd' : 'w'} /><T x={x} y={y + 3.5} s={9} c={i === 2 ? 'tw' : 't'}>{t === 'v' ? '∨' : t === '^' ? '∧' : t}</T></g>))}</g>
);
const Suffice = () => (
  <g><rect x={108} y={6} width={80} height={20} rx={4} className="d" /><T x={148} y={20} s={12} c="tw">?</T>
    <rect x={108} y={32} width={38} height={26} rx={4} className="w" /><T x={127} y={50} s={12}>1</T>
    <rect x={150} y={32} width={38} height={26} rx={4} className="w" /><T x={169} y={50} s={12}>2</T>
    <path d="M108 70h80" className="sm3" /><path d="M140 66l6 6l12 -12" className="s3" /></g>
);
const Ergo = () => (
  <g>{['must', 'could', 'not'].map((t, i) => <g key={t}><rect x={106 + i * 29} y={30} width={26} height={48} rx={3} className={i === 0 ? 'm' : 'w'} />
    <T x={119 + i * 29} y={72} s={6.5}>{t}</T>{[0, 1].map((j) => <rect key={j} x={111 + i * 29} y={36 + j * 12} width={16} height={8} rx={2} className="d" />)}</g>)}
    <rect x={130} y={6} width={36} height={14} rx={3} className="d" /><path d="M148 20v6" className="s2" /></g>
);
const Docket = () => (
  <g><rect x={114} y={10} width={68} height={70} rx={4} className="w" /><rect x={134} y={4} width={28} height={12} rx={3} className="d" />
    {[24, 36, 48].map((y) => <g key={y}><path d={`M122 ${y}l3 3l5 -6`} className="s2" /><Bar x={134} y={y - 3} w={38} /></g>)}
    {[62, 70].map((y) => <Bar key={y} x={122} y={y} w={50} k="d" h={3} />)}</g>
);
const Venn = () => (
  <g><circle cx={134} cy={30} r={24} className="sm3" /><circle cx={162} cy={30} r={24} className="sm3" /><circle cx={148} cy={54} r={24} className="sm3" /><circle cx={148} cy={39} r={5} className="d" /></g>
);
const Lamps = () => (
  <g><Grid x={112} y={6} n={4} sz={18} fill={(i) => [3, 9].includes(i) ? 'd' : [1, 5, 13, 14, 15, 2].includes(i) ? 'hm' : 'w'} />
    <T x={175} y={19} s={10} c="tw">1</T><T x={139} y={55} s={10} c="tw">2</T>
    {[[121, 15], [157, 69]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} className="d" />)}</g>
);
const Plot = () => (
  <g><rect x={112} y={6} width={72} height={72} className="w" /><path d="M136 7.5v46.5M113.5 54h69M160 7.5v46.5M136 30h24" className="s3" />
    {[[124, 34, 6], [148, 22, 2], [148, 46, 2], [172, 34, 6], [148, 70, 6]].map(([x, y, n], i) => <T key={i} x={x} y={y} s={12}>{n}</T>)}</g>
);
const Paths = () => (
  <g><path d="M140 4c-6 20 10 30 0 46s8 24 4 34" className="sm5" />
    <path d="M118 18L130 46L160 38L176 64M130 46L118 70M160 38L174 16" className="s3" />
    {[[118, 18], [118, 70], [176, 64], [174, 16]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} className="m" />)}
    <rect x={124} y={40} width={12} height={12} className="d" /><circle cx={160} cy={38} r={4} className="d" /></g>
);
const Snug = () => (
  <g><rect x={112} y={6} width={72} height={72} className="w" /><path d="M112 6h36v18h-18v36h-18z" className="d" /><path d="M148 6h36v18h-36z" className="m" />
    <path d="M130 24h36v18h-36zM166 24h18v54h-18z" className="hm" /><path d="M130 42h36v36h-54v-18h18z" className="m" /></g>
);
const Tangled = () => (
  <g><path d="M148 6L179 24v36L148 78L117 60V24z" className="w" />
    <path d="M148 6C150 30 146 54 148 78M117 24C140 36 156 48 179 60M179 24C156 36 140 48 117 60" className="s3" />
    {[[148, 6], [179, 24], [179, 60], [148, 78], [117, 60], [117, 24]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} className="d" />)}</g>
);
// a street scene in a frame: a sun, two shopfronts and a car
const Witness = () => (
  <g><rect x={112} y={6} width={72} height={72} rx={4} className="w" /><circle cx={170} cy={20} r={6} className="m" />
    <rect x={118} y={30} width={28} height={28} className="sm" /><rect x={150} y={36} width={28} height={22} className="sm" />
    <rect x={126} y={62} width={34} height={9} rx={4} className="d" /><circle cx={133} cy={72} r={3.5} className="d" /><circle cx={153} cy={72} r={3.5} className="d" /></g>
);
// a device: terminal bars top and bottom, four wires, the third one cut
const Defuse = () => (
  <g><rect x={114} y={6} width={68} height={8} rx={2} className="d" /><rect x={114} y={70} width={68} height={8} rx={2} className="d" />
    {[124, 140, 172].map((x) => <rect key={x} x={x - 3} y={14} width={6} height={56} className="m" />)}
    <rect x={153} y={14} width={6} height={20} className="m" /><rect x={153} y={50} width={6} height={20} className="m" /><circle cx={156} cy={42} r={6} className="d" /></g>
);
// two copies of one small picture; the sun is gone from the second, and a dot marks it
const Spot = () => (
  <g><rect x={110} y={12} width={36} height={60} rx={4} className="w" /><rect x={150} y={12} width={36} height={60} rx={4} className="w" />
    <circle cx={134} cy={28} r={6} className="m" /><rect x={116} y={50} width={24} height={14} className="sm" /><rect x={156} y={50} width={24} height={14} className="sm" />
    <circle cx={174} cy={28} r={3.5} className="d" /></g>
);
// a trunk seen from the side: three boxes in, one still to drop
const Pack = () => (
  <g><path d="M92 70H228V18" className="d6" fill="none" /><rect x={100} y={44} width={34} height={26} rx={3} className="sm" /><rect x={138} y={32} width={30} height={38} rx={3} className="d6" fill="none" />
    <rect x={172} y={50} width={48} height={20} rx={3} className="sm" /><rect x={178} y={12} width={30} height={22} rx={3} className="d6" fill="none" /></g>
);
// a pan on a burner, its handle out to the right, and two plates waiting
const Chef = () => (
  <g><circle cx={134} cy={42} r={26} className="d6" fill="none" /><circle cx={134} cy={42} r={15} className="d6" fill="none" /><path d="M160 42H192" className="d6" />
    <rect x={168} y={10} width={18} height={10} rx={5} className="sm" /><rect x={168} y={64} width={18} height={10} rx={5} className="sm" /></g>
);
// a floor of tiles half mopped (the dark ones still to do), a wall with a doorway, and the mop
const Mop = () => (
  <g><Grid x={112} y={6} n={4} sz={18} />
    {cells(112, 6, 4, 4, 18, (x, y, c, r, i) => ([2, 3, 7, 10, 11, 14, 15].includes(i) ? <rect key={i} x={x + 1} y={y + 1} width={16} height={16} className="sm" /> : null))}
    <path d="M148 6V24M148 42V78" className="d6" /><path d="M139 40L156 16" className="d6" /><path d="M130 40h18l3 12h-24z" className="d" /></g>
);
const Connect = () => (
  <g><Grid x={112} y={6} n={4} sz={18} /><path d="M121 15H175V33M121 33V69H157" className="d6" />
    {[[121, 15], [175, 33], [121, 33], [157, 69]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} className={i < 2 ? 'd' : 'm'} />)}</g>
);
const Duet = () => (
  <g><Grid x={112} y={6} n={4} sz={18} />
    {cells(112, 6, 4, 4, 18, (x, y, c, r, i) => ([0, 3, 5, 6, 9, 10, 12, 15].includes(i)
      ? <circle key={i} cx={x + 9} cy={y + 9} r={5} className="d" /> : <circle key={i} cx={x + 9} cy={y + 9} r={5} className="sm3" />))}</g>
);
const Etch = () => (
  <g><Grid x={128} y={22} n={3} sz={18} fill={(i) => [1, 3, 4, 5, 7].includes(i) ? 'd' : 'w'} />
    {['1', '3', '1'].map((t, i) => <T key={i} x={137 + i * 18} y={16} s={10}>{t}</T>)}{['1', '3', '1'].map((t, i) => <T key={i} x={118} y={35 + i * 18} s={10}>{t}</T>)}</g>
);
const Lot = ({ n, blocks }) => {
  const sz = 72 / n;
  return <g><rect x={112} y={6} width={72} height={72} rx={3} className="w" />
    {cells(112, 6, n, n, sz, (x, y, c, r, i) => <rect key={i} x={x} y={y} width={sz} height={sz} className="w0" />)}
    {blocks.map(([c, r, w, h, k], i) => <rect key={'b' + i} x={112 + c * sz + 1.5} y={6 + r * sz + 1.5} width={w * sz - 3} height={h * sz - 3} rx={2} className={k || 'm'} />)}
    <path d={`M184 ${6 + 2 * sz}v${sz}`} className="s5" /></g>;
};
const Park = () => <Lot n={6} blocks={[[0, 2, 2, 1, 'd'], [2, 0, 1, 3], [3, 1, 1, 2], [4, 3, 2, 1], [0, 4, 1, 2], [2, 4, 3, 1]]} />;
const Impound = () => <Lot n={7} blocks={[[1, 2, 2, 1, 'd'], [0, 0, 3, 1], [3, 0, 1, 3], [4, 1, 1, 3], [5, 2, 1, 2], [0, 3, 1, 3], [1, 5, 4, 1], [6, 4, 1, 3], [2, 3, 2, 1]]} />;
const Junkyard = () => <Lot n={8} blocks={[[2, 2, 2, 1, 'd'], [0, 0, 2, 1], [2, 0, 1, 2], [3, 0, 3, 1], [4, 1, 1, 3], [5, 2, 1, 2], [6, 1, 1, 3], [7, 2, 1, 3], [0, 1, 1, 3], [1, 3, 3, 1], [0, 5, 3, 1], [3, 4, 1, 3], [4, 5, 3, 1], [5, 6, 1, 2], [6, 6, 2, 1], [1, 6, 1, 2]]} />;
const Chomp = () => (
  <g><Grid x={112} y={6} n={4} sz={18} fill={(i) => [4, 5, 6, 10].includes(i) ? 'hm' : 'w'} />
    <path d="M166 51l-8 -6a9 9 0 1 0 0 12z" className="d" />{[[121, 15], [175, 15], [121, 69]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} className="m" />)}</g>
);
const Hedge = () => (
  <g>{cells(112, 6, 5, 5, 18, (x, y, c, r, i) => (r === 4 && c > 2 ? null : <circle key={i} cx={x} cy={y} r={2} className="m" />))}
    <path d="M112 6h36v18h18v-18h18v54h-36v18h-36v-36h18v-18h-18z" className="s3" />
    {[[121, 18, 3], [157, 36, 2], [139, 54, 1], [175, 18, 3], [121, 72, 2]].map(([x, y, n], i) => <T key={i} x={x} y={y} s={11}>{n}</T>)}</g>
);
const PieceP = 'h16a6 6 0 1 0 12 0h16v18a6 6 0 1 1 0 12v18h-16a6 6 0 1 0 -12 0h-16v-18a6 6 0 1 1 0 -12z';
const Jig = () => (
  <g transform="translate(148 42) scale(0.8) translate(-148 -42)">{[[104, -2], [148, -2], [104, 42], [148, 42]].map(([x, y], i) => (
    <path key={i} d={`M${x} ${y}${PieceP}`} className={i === 3 ? 'd' : i === 0 ? 'm' : 'w'} transform={i === 3 ? `translate(8 6)` : undefined} />))}</g>
);
const Saw = () => (
  <g><rect x={126} y={2} width={44} height={80} rx={3} className="w" />
    <path d="M148 2v80M126 22h44M126 42h44M126 62h44" className="sm" />
    <rect x={148} y={42} width={22} height={20} className="m" />
    <path d="M176 30h10v-6a4 4 0 1 1 0 -8v-6h-10v6a4 4 0 1 0 0 8z" className="d" /></g>
);
const Topple = () => (
  <g>{cells(108, 56, 4, 1, 20, (x, y, c, r, i) => <path key={i} d={`M${x} ${y + 12}l10 -12h20l-10 12z`} className={i === 3 ? 'd' : 'm'} />)}
    <rect x={130} y={10} width={20} height={42} className="d" /><path d="M130 10l8 -6h20l-8 6zM150 10l8 -6v42l-8 6z" className="m" />
    <path d="M168 22a14 14 0 0 1 10 22" className="s2" /><path d="M178 44l-6 -2m6 2l1 -6" className="s2" /></g>
);
const Roll = () => (
  <g>{cells(108, 56, 4, 1, 20, (x, y, c, r, i) => <g key={i}><path d={`M${x} ${y + 12}l10 -12h20l-10 12z`} className={i === 2 ? 'd' : 'm'} /></g>)}
    <rect x={124} y={16} width={34} height={34} rx={6} className="w" />{[[132, 24], [150, 42], [141, 33], [150, 24], [132, 42]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} className="d" />)}
    <T x={172} y={34} s={13}>1</T><T x={182} y={46} s={11}>2</T></g>
);
const PhotoTile = ({ x, y, sz, i, hot, rot = 0 }) => (
  <g transform={rot ? `rotate(${rot} ${x + sz / 2} ${y + sz / 2})` : undefined}><rect x={x + 1} y={y + 1} width={sz - 2} height={sz - 2} rx={3} className={hot ? 'd' : 'w'} />
    <path d={`M${x + 4.5} ${y + sz - 5}l${sz * 0.27} ${-sz * 0.35}l${sz * 0.18} ${sz * 0.2}l${sz * 0.13} -${sz * 0.12}l${sz * 0.17} ${sz * 0.27}`} className={hot ? 'sw' : 'sm'} /></g>
);
const Swap = () => (
  <g>{cells(112, 6, 3, 3, 24, (x, y, c, r, i) => <PhotoTile key={i} x={x} y={y} sz={24} i={i} hot={i === 1 || i === 6} />)}
    <path d="M124 64q-14 -30 12 -46" className="s3" /><path d="M136 18l-8 -1m8 1l-3 7" className="s3" /></g>
);
const Slide = () => (
  <g>{cells(112, 6, 3, 3, 24, (x, y, c, r, i) => i === 8 ? null : (
    <g key={i}><rect x={x + 1.5} y={y + 1.5} width={21} height={21} rx={4} className={i === 7 ? 'd' : 'w'} /><T x={x + 12} y={y + 16.5} s={12} c={i === 7 ? 'tw' : 't'}>{i + 1}</T></g>))}
    <path d="M166 66h12m-4 -4l4 4l-4 4" className="s2" /></g>
);
const Spin = () => (
  <g>{cells(112, 6, 3, 3, 24, (x, y, c, r, i) => <PhotoTile key={i} x={x} y={y} sz={24} i={i} hot={i === 4} rot={[0, 90, 0, 180, 270, 0, 90, 0, 0][i]} />)}</g>
);
// ---- Numbers -------------------------------------------------------------
const Crunch = () => (
  <g><rect x={124} y={4} width={48} height={22} rx={5} className="d" /><T x={148} y={20} s={14} c="tw">347</T>
    {['25', '8', '3', '50', '6', '1'].map((v, i) => <Tile key={i} x={110 + (i % 3) * 27} y={34 + Math.floor(i / 3) * 24} ch={v} sz={22} s={10} on={i === 3} />)}</g>
);
const Blitz = () => (
  <g><Eq y={30} txt="7 × 8" s={15} /><Clock frac={0.75} /><path d="M148 44v-4" className="s3" /></g>
);
const Blitzed = () => (
  <g><Eq y={30} txt="5 + 10 × 2" s={12} /><Clock frac={0.45} /></g>
);
const Gap = () => (
  <g><rect x={108} y={20} width={80} height={36} rx={6} className="w" /><T x={124} y={44} s={14}>7 ×</T>
    <rect x={136} y={28} width={18} height={20} rx={4} className="d" /><T x={145} y={43} s={12} c="tw">?</T><T x={172} y={44} s={13}>= 56</T></g>
);
const Back = () => (
  <g><rect x={120} y={4} width={56} height={18} rx={5} className="d" /><T x={148} y={17} s={11} c="tw">? = 56</T>
    {['7 × 8', '6 × 9', '8 × 6', '4 × 15'].map((t, i) => <g key={t}><rect x={110 + (i % 2) * 40} y={30 + Math.floor(i / 2) * 26} width={36} height={22} rx={5} className={i === 0 ? 'm' : 'w'} /><T x={128 + (i % 2) * 40} y={45 + Math.floor(i / 2) * 26} s={9}>{t}</T></g>)}</g>
);
const Calc = () => (
  <g>{cells(112, 6, 3, 3, 24, (x, y, c, r, i) => <g key={i}><rect x={x + 2} y={y + 2} width={20} height={20} rx={4} className={[0, 1, 4, 7, 8].includes(i) ? 'm' : 'w'} />
    <T x={x + 12} y={y + 16} s={11}>{['4', '+', '9', '×', '2', '−', '3', '6', '='][i]}</T></g>)}
    <path d="M135 18h2M148 29v2M148 53v2M159 66h2" className="s3" /></g>
);
const Series = () => (
  <g>{['3', '7', '11', '15', '19', '?'].map((v, i) => <Tile key={i} x={110 + (i % 3) * 27} y={14 + Math.floor(i / 3) * 30} ch={v} sz={24} s={11} on={i === 5} />)}</g>
);
const Sums = () => (
  <g>{cells(112, 6, 4, 4, 18, (x, y, c, r, i) => {
    const clue = r === 0 || c === 0;
    return <g key={i}><rect x={x} y={y} width={18} height={18} className={clue ? 'hm' : 'w'} />{clue && i ? <path d={`M${x} ${y}l18 18`} className="sm" /> : null}</g>;
  })}{[[136, 19, '9'], [154, 19, '24'], [172, 19, '7'], [120, 39, '16'], [120, 57, '13'], [120, 75, '9']].map(([x, y, t], i) => <T key={i} x={x} y={y} s={7}>{t}</T>)}
    <T x={139} y={47} s={11}>7</T><T x={157} y={65} s={11}>9</T></g>
);
const Carve = () => (
  <g><Grid x={112} y={6} n={4} sz={18} fill={(i) => [0, 1, 4, 8].includes(i) ? 'hm' : [2, 3, 6, 7].includes(i) ? 'w' : 'w'} />
    <path d="M112 42h18v-18h18v-18M148 42v36M148 42h36" className="s3" />
    {[[121, 19, '4'], [157, 19, '6'], [139, 37, '3'], [121, 55, '5'], [175, 55, '8'], [139, 73, '2']].map(([x, y, t], i) => <T key={i} x={x} y={y} s={11}>{t}</T>)}</g>
);
const Tally = () => (
  <g><Grid x={112} y={6} n={3} sz={20} fill={(i) => (i === 4 ? 'm' : 'w')} />
    {['12', '9', '15'].map((t, i) => <T key={i} x={182} y={20 + i * 20} s={10}>{t}</T>)}{['8', '14', '14'].map((t, i) => <T key={i} x={122 + i * 20} y={78} s={10}>{t}</T>)}
    <T x={122} y={20} s={11}>4</T><T x={142} y={40} s={11}>5</T></g>
);
const Cipher = () => (
  <g><T x={168} y={22} s={14} a="end">SEND</T><T x={168} y={42} s={14} a="end">+MORE</T><path d="M112 48h60" className="s2" /><T x={168} y={66} s={14} a="end">MONEY</T>
    <rect x={174} y={8} width={14} height={18} rx={3} className="d" /><T x={181} y={21} s={10} c="tw">9</T></g>
);
const Tag = ({ txt = '$?' }) => (
  <g><path d="M110 22h44l16 16l-16 16h-44z" className="w" /><circle cx={158} cy={38} r={3} className="d" /><T x={132} y={44} s={15}>{txt}</T></g>
);
const Pricer = () => (
  <g><Tag /><rect x={114} y={62} width={20} height={14} rx={4} className="w" /><rect x={138} y={62} width={20} height={14} rx={4} className="d" /><rect x={162} y={62} width={20} height={14} rx={4} className="w" /></g>
);
const Dealer = () => (
  <g><path d="M112 54v-12l10 -4l12 -14h30l14 14l6 4v12z" className="m" /><path d="M136 28h12v12h-20zM152 28h10l10 12h-20z" className="w" />
    <circle cx={128} cy={56} r={8} className="d" /><circle cx={168} cy={56} r={8} className="d" /><rect x={130} y={68} width={36} height={12} rx={3} className="w" /><T x={148} y={77} s={9}>$?</T></g>
);
const Realtor = () => (
  <g><path d="M110 40l38 -32l38 32z" className="d" /><rect x={118} y={40} width={60} height={38} className="w" /><rect x={142} y={56} width={14} height={22} className="m" />
    <rect x={124} y={48} width={12} height={10} className="m" /><rect x={162} y={48} width={10} height={10} className="m" /></g>
);
const Agent = () => (
  <g><path d="M148 6c4 0 5 6 5 12v12l32 18v8l-32 -8v16l9 7v6l-14 -4l-14 4v-6l9 -7v-16l-32 8v-8l32 -18v-12c0 -6 1 -12 5 -12z" className="m" />
    <path d="M148 6c4 0 5 6 5 12v54l-5 2l-5 -2v-54c0 -6 1 -12 5 -12z" className="d" /></g>
);
const Curator = () => (
  <g><path d="M120 34h56l6 44h-68z" className="m" /><path d="M134 34v-10a14 14 0 0 1 28 0v10" className="s3" /><rect x={140} y={44} width={16} height={8} rx={2} className="d" />
    <path d="M108 8l12 12M120 8l-12 12" className="sm3" /></g>
);
const Picks = () => (
  <g><path d="M148 10v62M120 72h56" className="s3" /><path d="M112 24h72" className="s3" />
    <path d="M112 24l-6 18h12z M184 24l-6 26h12z" className="sm" /><rect x={104} y={38} width={16} height={8} rx={3} className="m" /><rect x={176} y={46} width={16} height={8} rx={3} className="d" /><circle cx={148} cy={10} r={4} className="d" /></g>
);
// ---- Crowd ---------------------------------------------------------------
const Outwit = () => (
  <g>{[[120, 34], [148, 34], [176, 34], [134, 68], [162, 68]].map(([x, y], i) => <Head key={i} x={x} y={y} k={i === 2 ? 'd' : 'm'} s={0.9} />)}
    <Bubble x={152} y={2} w={34} h={18} tail="r" /><T x={169} y={15} s={10}>?</T></g>
);
const Outrank = () => (
  <g><rect x={136} y={34} width={24} height={44} className="d" /><rect x={112} y={48} width={24} height={30} className="m" /><rect x={160} y={58} width={24} height={20} className="w" />
    <T x={148} y={52} s={14} c="tw">1</T><T x={124} y={66} s={12}>2</T><T x={172} y={72} s={11}>3</T><path d="M140 26l8 -16l8 16z" className="m" /></g>
);
const Feud = () => (
  <g><rect x={108} y={4} width={80} height={76} rx={6} className="d" />
    {[0, 1, 2].map((i) => <g key={i}><rect x={116} y={14 + i * 21} width={64} height={16} rx={3} className={i === 1 ? 'w' : 'm'} /><T x={124} y={26 + i * 21} s={10}>{i + 1}</T><T x={170} y={26 + i * 21} s={9}>{[42, 27, 11][i]}</T></g>)}</g>
);
const Herd = () => (
  <g><rect x={108} y={8} width={36} height={24} rx={5} className="w" /><T x={126} y={25} s={13}>A</T><rect x={152} y={8} width={36} height={24} rx={5} className="d" /><T x={170} y={25} s={13} c="tw">B</T>
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={i < 2 ? 118 + i * 14 : 154 + ((i - 2) % 3) * 12} cy={i < 2 ? 50 : 46 + Math.floor((i - 2) / 3) * 14} r={5} className={i < 2 ? 'm' : 'd'} />)}
    <circle cx={160} cy={74} r={5} className="d" /><circle cx={172} cy={74} r={5} className="d" /></g>
);
// ---- Word ----------------------------------------------------------------
const Crux = () => (
  <g>{[[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [1, 2], [1, 3], [3, 0], [3, 2], [3, 3], [2, 3], [0, 3]].map(([c, r], i) => <rect key={i} x={112 + c * 18} y={6 + r * 18} width={18} height={18} className="w" />)}
    <rect x={130} y={24} width={18} height={18} className="m" /><T x={176} y={74} s={14}>?</T></g>
);
const Fill = () => (
  <g>{[[0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 3]].map(([c, r], i) => <rect key={i} x={108 + c * 16} y={6 + r * 16} width={16} height={16} className={i < 3 ? 'm' : 'w'} />)}
    {[0, 1, 2, 3, 4].map((i) => <Bar key={i} x={162} y={10 + i * 14} w={i % 2 ? 18 : 26} k={i === 0 ? 'd' : 'm'} h={5} />)}</g>
);
const Gram = () => (
  <g><rect x={108} y={10} width={80} height={24} rx={5} className="w" /><Bar x={116} y={20} w={22} /><rect x={142} y={14} width={30} height={16} rx={3} className="d" /><Bar x={176} y={20} w={8} />
    <rect x={112} y={44} width={34} height={22} rx={5} className="m" /><T x={129} y={59} s={11}>its</T><rect x={150} y={44} width={34} height={22} rx={5} className="w" /><T x={167} y={59} s={11}>it's</T></g>
);
const Stet = () => (
  <g><rect x={108} y={6} width={80} height={52} rx={4} className="w" /><Bar x={114} y={16} w={60} /><Bar x={114} y={30} w={20} /><Bar x={162} y={30} w={20} />
    <path d="M138 32h20" className="s3" /><path d="M142 46l6 -8l6 8" className="s2" /><Bar x={114} y={46} w={22} />
    <rect x={124} y={62} width={48} height={18} rx={3} className="d" /><T x={148} y={75} s={11} c="tw">STET</T></g>
);
const Tuck = () => (
  <g>{[[0, 1, 'T'], [1, 1, 'U'], [2, 1, 'C'], [3, 1, 'K'], [2, 0, 'A'], [2, 2, 'O'], [2, 3, 'T'], [0, 2, 'E'], [0, 3, 'S']].map(([c, r, l], i) => <Tile key={i} x={112 + c * 18} y={6 + r * 18} ch={l} on={i < 4} />)}
    <T x={176} y={70} s={11}>14</T></g>
);
const Hex = ({ x, y, r = 12, k, ch }) => (
  <g><path d={`M${x - r} ${y}l${r / 2} ${-r * 0.87}h${r}l${r / 2} ${r * 0.87}l${-r / 2} ${r * 0.87}h${-r}z`} className={k} /><T x={x} y={y + 4} s={11} c={k === 'd' ? 'tw' : 't'}>{ch}</T></g>
);
const Lode = () => (
  <g><Hex x={148} y={42} k="d" ch="O" />{[[0, -21], [18, -10.5], [18, 10.5], [0, 21], [-18, 10.5], [-18, -10.5]].map(([dx, dy], i) => <Hex key={i} x={148 + dx} y={42 + dy} k="w" ch={'LDEAPR'[i]} />)}</g>
);
const Rung = () => (
  <g>{['COLD', 'CORD', 'WORD', 'WARD'].map((w, r) => w.split('').map((ch, c) => <Tile key={r * 4 + c} x={112 + c * 18} y={6 + r * 19} ch={ch} on={(r === 1 && c === 2) || (r === 2 && c === 0) || (r === 3 && c === 1)} sz={17} s={10} />))}</g>
);
const Anon = () => (
  <g>{[0, 1, 2, 3].map((i) => <g key={i}><Tile x={110} y={6 + i * 19} ch={'POET'[i]} on sz={17} s={10} /><Bar x={132} y={13 + i * 19} w={i % 2 ? 40 : 54} /></g>)}</g>
);
const Vocab = () => (
  <g><path d="M148 18c-10 -8 -26 -10 -38 -8v60c12 -2 28 0 38 8c10 -8 26 -10 38 -8v-60c-12 -2 -28 0 -38 8z" className="w" /><path d="M148 18v60" className="s2" />
    <T x={128} y={42} s={14}>Aa</T>{[48, 58].map((y) => <Bar key={y} x={116} y={y} w={24} h={3} />)}{[28, 38, 48, 58].map((y) => <Bar key={y} x={156} y={y} w={y === 28 ? 22 : 24} h={3} k={y === 28 ? 'd' : 'm'} />)}</g>
);
const Spell = () => (
  <g><rect x={108} y={8} width={80} height={26} rx={5} className="w" /><T x={148} y={26} s={12}>receive</T><path d="M178 16l3 3l6 -6" className="s2" />
    <rect x={108} y={46} width={80} height={26} rx={5} className="m" /><T x={148} y={64} s={12}>recieve</T><path d="M120 67q6 4 12 0t12 0t12 0" className="s2" /></g>
);
const Idiom = () => (
  <g><Bubble x={108} y={6} w={80} h={46} /><Bar x={118} y={18} w={58} h={5} /><Bar x={118} y={30} w={30} h={5} />
    <circle cx={156} cy={33} r={3} className="d" /><circle cx={165} cy={33} r={3} className="d" /><circle cx={174} cy={33} r={3} className="d" /></g>
);
const Links = () => (
  <g>{cells(112, 6, 4, 4, 18, (x, y, c, r, i) => <rect key={i} x={x + 1.5} y={y + 1.5} width={15} height={15} rx={3} className={r === 0 ? 'd' : r === 1 && (c === 1 || c === 3) ? 'm' : 'w'} />)}</g>
);
const Hinge = () => (
  <g>{['FIRE', '?', 'MAT'].map((t, i) => <g key={i}><rect x={124} y={4 + i * 28} width={48} height={20} rx={5} className={i === 1 ? 'd' : 'w'} /><T x={148} y={18 + i * 28} s={11} c={i === 1 ? 'tw' : 't'}>{t}</T></g>)}
    <path d="M148 24v8M148 52v8" className="s5" /></g>
);
const Babel = () => (
  <g><path d="M108 56h80l-6 16h-68z" className="d" />{['Q', 'U', 'I', 'Z'].map((l, i) => <Tile key={i} x={114 + i * 18} y={34} ch={l} sz={17} />)}
    {['A', 'X'].map((l, i) => <Tile key={'b' + i} x={132 + i * 18} y={8} ch={l} sz={17} on={i === 1} />)}</g>
);
const Glyph = () => (
  <g>{cells(112, 6, 4, 4, 18, (x, y, c, r, i) => ([5, 10].includes(i) ? <rect key={i} x={x} y={y} width={18} height={18} className="d" />
    : <g key={i}><rect x={x} y={y} width={18} height={18} className="w" /><T x={x + 2.5} y={y + 6} s={5} a="start">{(i * 7) % 26 + 1}</T>{i === 0 || i === 6 ? <T x={x + 11} y={y + 15.5} s={9}>{i ? 'E' : 'T'}</T> : null}</g>))}</g>
);
const Origin = () => (
  <g><rect x={120} y={6} width={56} height={20} rx={5} className="d" /><Bar x={130} y={14} w={36} k="wf" />
    <path d="M148 26v12M148 38c-12 0 -24 4 -24 16M148 38c12 0 24 4 24 16" className="s2" />
    <rect x={104} y={54} width={40} height={18} rx={4} className="m" /><T x={124} y={66.5} s={9}>Latin</T><rect x={152} y={54} width={40} height={18} rx={4} className="w" /><T x={172} y={66.5} s={9}>Norse</T></g>
);
const Warmer = () => (
  <g><path d="M140 10a8 8 0 0 1 16 0v40a14 14 0 1 1 -16 0z" className="w" /><path d="M144 30h8v22a10 10 0 1 1 -8 0z" className="d" />
    {[16, 26, 36].map((y) => <path key={y} d={`M160 ${y}h8`} className="s2" />)}<path d="M120 26q-6 -8 0 -16M118 50q-6 -8 0 -16" className="sm3" /></g>
);
const Shards = () => (
  <g><g transform="rotate(-8 128 26)"><Tile x={110} y={10} ch="S" sz={17} /><Tile x={127} y={10} ch="H" sz={17} /><Tile x={127} y={27} ch="A" sz={17} /></g>
    <g transform="rotate(10 168 30)"><Tile x={154} y={14} ch="R" sz={17} on /><Tile x={154} y={31} ch="D" sz={17} on /></g>
    <g transform="rotate(4 140 64)"><Tile x={122} y={56} ch="S" sz={17} /><Tile x={139} y={56} ch="E" sz={17} /><Tile x={156} y={56} ch="A" sz={17} /></g></g>
);
const Strata = () => (
  <g>{[0, 1, 2, 3].map((r) => <rect key={r} x={110} y={22 + r * 15} width={76} height={13} className={r % 2 ? 'hm' : 'w'} />)}
    {['R', 'O', 'C', 'K'].map((l, i) => <Tile key={i} x={114 + i * 18} y={2} ch={l} sz={16} s={10} on />)}
    {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => <T key={r * 4 + c} x={121 + c * 18} y={32 + r * 15} s={9}>{'SANDCLAYTOILMUDS'[r * 4 + c]}</T>))}</g>
);
const Barter = () => (
  <g>{['T', 'R', 'A', 'D', 'E'].map((l, i) => <Tile key={i} x={108 + i * 16.5} y={44} ch={i === 1 ? 'D' : i === 3 ? 'R' : l} sz={15} s={9} on={i === 1 || i === 3} />)}
    <path d="M124 38q24 -26 48 0" className="s3" /><path d="M172 38l-7 -2m7 2l1 -7" className="s3" /><path d="M128 66q20 14 40 0" className="sm3" /></g>
);
const Scram = () => (
  <g>{['M', 'S', 'A', 'R', 'C'].map((l, i) => <Tile key={i} x={112 + (i % 3) * 25} y={8 + Math.floor(i / 3) * 26} ch={l} sz={21} s={12} on={i === 1} />)}
    <path d="M160 60a14 14 0 1 0 12 -14" className="s3" /><path d="M172 46l-7 -3m7 3l-3 7" className="s3" /></g>
);
const Scour = () => {
  const L = 'MINDLESCOURTKAOVHYNPQRAEB';
  return <g><rect x={112} y={33} width={72} height={14} rx={7} className="m" /><path d="M118 12l56 58" className="sm5" />
    {cells(112, 6, 5, 5, 14.4, (x, y, c, r, i) => <T key={i} x={x + 7.2} y={y + 11} s={10}>{L[i]}</T>)}</g>;
};
const Emcee = () => (
  <g>{cells(112, 6, 5, 5, 14.4, (x, y, c, r, i) => <g key={i}><rect x={x} y={y} width={14.4} height={14.4} className={[0, 4, 20, 24].includes(i) ? 'd' : 'w'} />
    {r === 0 && c > 0 && c < 4 ? <T x={x + 7.2} y={y + 11} s={9}>{'CAT'[c - 1]}</T> : null}</g>)}</g>
);
const Encore = () => (
  <g>{cells(112, 6, 9, 9, 8, (x, y, c, r, i) => <rect key={i} x={x} y={y} width={8} height={8} className={[3, 5, 13, 22, 27, 30, 40, 50, 53, 58, 67, 75, 77].includes(i) ? 'd' : r === 4 ? 'hm' : 'w'} />)}</g>
);
const Arcos = () => (
  <g>{[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => <rect key={r * 4 + c} x={112 + c * 18} y={6 + r * 18} width={18} height={18}
    className={c === 0 ? 'd' : r === c ? 'm' : c === 3 ? 'hm' : 'w'} />))}
    {'LINK'.split('').map((l, i) => <T key={i} x={121} y={19 + i * 18} s={11} c="tw">{l}</T>)}</g>
);
const Garble = () => (
  <g>{['L', 'G', 'A', 'B', 'R', 'E'].map((l, i) => <Tile key={i} x={108 + i * 13.5} y={8} ch={l} sz={12.5} s={9} />)}
    <path d="M148 26v14m-5 -5l5 5l5 -5" className="s2" />{['G', 'A', 'R', 'B', 'L', 'E'].map((l, i) => <Tile key={'b' + i} x={108 + i * 13.5} y={48} ch={l} sz={12.5} s={9} on />)}</g>
);
// ---- Cards ---------------------------------------------------------------
const Taire = () => (
  <g>{[0, 1, 2, 3].map((c) => <g key={c}>{Array.from({ length: c + 1 }, (_, r) => <Card key={r} x={110 + c * 20} y={6 + r * 10} w={17} h={24} k={r === c ? 'w' : 'd'} />)}</g>)}
    <Card x={150} y={52} w={17} h={24} k="m" /><Card x={170} y={52} w={17} h={24} k="m" /></g>
);
const Cell = () => (
  <g>{[0, 1, 2, 3].map((i) => <rect key={i} x={110 + i * 20} y={4} width={17} height={22} rx={3} className={i === 1 ? 'm' : 'w0'} />)}<path d="M110 30h76" className="sm" />
    {[0, 1, 2, 3].map((c) => <g key={c}>{Array.from({ length: 3 }, (_, r) => <Card key={r} x={110 + c * 20} y={36 + r * 9} w={17} h={22} k={r === 2 ? 'w' : (c + r) % 2 ? 'd' : 'm'} />)}</g>)}</g>
);
const Crib = () => (
  <g><rect x={108} y={26} width={80} height={32} rx={8} className="m" />{[0, 1].map((r) => cells(116, 33 + r * 12, 10, 1, 7, (x, y, c, _, i) => <circle key={r * 10 + i} cx={x} cy={y} r={1.6} className="d" />))}
    <rect x={128} y={20} width={4} height={18} rx={2} className="d" /><rect x={160} y={46} width={4} height={18} rx={2} className="w" />
    <Card x={112} y={-2} w={16} h={20} rk="5" rot={-8} /><Card x={168} y={64} w={16} h={20} rk="J" rot={8} /></g>
);
const Hold = () => (
  <g>{[0, 1, 2, 3, 4].map((i) => <g key={i}><Card x={108 + i * 16.5} y={18} w={14} h={22} rk={'AAK72'[i]} k={i < 2 ? 'w' : 'w'} />
    {i < 2 ? <rect x={108 + i * 16.5} y={44} width={14} height={8} rx={2} className="d" /> : null}</g>)}
    {[0, 1, 2].map((i) => <Card key={'r' + i} x={124 + i * 16.5} y={60} w={14} h={20} k="m" />)}</g>
);
const Finesse = () => (
  <g><rect x={128} y={22} width={40} height={40} rx={4} className="m" />
    {[[136, 2], [136, 64], [106, 30], [168, 30]].map(([x, y], i) => <g key={i}>{[0, 1, 2].map((j) => <Card key={j} x={x + (i < 2 ? j * 8 : 0)} y={y + (i < 2 ? 0 : j * 8)} w={i < 2 ? 12 : 22} h={i < 2 ? 18 : 12} k={i === 1 ? 'd' : 'w'} />)}</g>)}
    <T x={148} y={47} s={12}>♠</T></g>
);
const Hands = () => (
  <g>{cells(112, 6, 5, 5, 14.4, (x, y, c, r, i) => <rect key={i} x={x + 1} y={y + 1} width={12.4} height={12.4} rx={2} className={i < 5 ? 'd' : i < 13 ? 'w' : 'w0'} />)}</g>
);
const Pairs = () => (
  <g>{cells(112, 6, 3, 3, 24, (x, y, c, r, i) => <g key={i}><rect x={x + 2} y={y + 2} width={20} height={20} rx={3} className={i === 1 || i === 6 ? 'w' : 'd'} />
    {i === 1 || i === 6 ? <T x={x + 12} y={y + 16} s={11}>Q</T> : <path d={`M${x + 6} ${y + 6}l12 12M${x + 18} ${y + 6}l-12 12`} className="sw" />}</g>)}</g>
);
const Mahj = () => (
  <g>{[[112, 42], [138, 42], [164, 42], [125, 18], [151, 18]].map(([x, y], i) => (
    <g key={i}><rect x={x + 3} y={y + 3} width={22} height={30} rx={4} className="m" /><rect x={x} y={y} width={22} height={30} rx={4} className={i === 4 ? 'd' : 'w'} />
      <circle cx={x + 11} cy={y + 11} r={4} className={i === 4 ? 'wf' : i % 2 ? 'd' : 'm'} /><path d={`M${x + 6} ${y + 22}h10`} className={i === 4 ? 'sw' : 's2'} /></g>))}</g>
);
const Shoe = () => (
  <g><Card x={112} y={14} w={26} h={36} rk="A" rot={-10} /><Card x={132} y={12} w={26} h={36} rk="K" rot={6} />
    <T x={136} y={72} s={16}>21</T><circle cx={174} cy={60} r={13} className="m" /><circle cx={174} cy={60} r={7} className="w" /></g>
);
// ---- End Game ------------------------------------------------------------
const King = ({ x, y, k = 'd' }) => <g><path d={`M${x - 7} ${y + 8}h14l-2 -10h-10z`} className={k} /><circle cx={x} cy={y - 6} r={5} className={k} /><path d={`M${x} ${y - 16}v-6M${x - 3} ${y - 19}h6`} className="s2" /></g>;
const Mate = () => (
  <g><Board /><King x={157} y={34} k="w" /><path d="M115 9l31 31" className="sm" /><Pawn x={121} y={68} /><rect x={149.5} y={25.5} width={15} height={15} rx={1} className="s3" /></g>
);
const Check = () => (
  <g><Board /><circle cx={121} cy={69} r={7} className="d" /><circle cx={139} cy={51} r={7} className="w" /><circle cx={175} cy={15} r={7} className="w" /><circle cx={157} cy={33} r={7} className="w" />
    <path d="M121 69L161 29" className="s3" /></g>
);
const Chain = () => (
  <g>{cells(112, 6, 4, 4, 24, (x, y, c, r, i) => <circle key={i} cx={x} cy={y} r={2.5} className="d" />)}
    <path d="M112 6h72v72M112 6v72h72M112 30h24v24h-24M160 6v48M136 54h48" className="s3" /><rect x={115} y={9} width={18} height={18} className="m" /><rect x={163} y={33} width={18} height={18} className="m" /></g>
);
const Defend = () => (
  <g><Board /><King x={139} y={52} /><path d="M166 8h18v10c0 10 -9 14 -9 14s-9 -4 -9 -14z" className="m" /><path d="M175 22l0 -8" className="s2" /></g>
);
const Swindle = () => (
  <g><Board /><King x={121} y={52} k="w" /><King x={175} y={34} /><rect x={140} y={56} width={36} height={20} rx={4} className="d" /><T x={158} y={71} s={13} c="tw">½</T></g>
);
const Queen = () => (
  <g><Board /><Pawn x={139} y={66} /><path d="M139 54v-24" className="s3" /><path d="M133 36l6 -8l6 8" className="s3" /><Crown x={139} y={16} /><rect x={131.5} y={7.5} width={15} height={15} rx={1} className="s2" /></g>
);
const Turn = () => {
  const blk = new Set([0, 5, 6, 10, 13]), wht = new Set([1, 4, 9, 11, 14]);
  return <g>{cells(112, 6, 4, 4, 18, (x, y, c, r, i) => (
    <g key={i}><rect x={x} y={y} width={18} height={18} className="w" />
      {blk.has(i) ? <circle cx={x + 9} cy={y + 9} r={6.5} className="d" /> : wht.has(i) ? <circle cx={x + 9} cy={y + 9} r={6.5} className="m" /> : null}
      {i === 15 ? <rect x={x + 2} y={y + 2} width={14} height={14} rx={3} className="s3" /> : null}</g>))}</g>;
};
const Gift = () => (
  <g>{[0, 1, 2, 3].map((i) => {
    const x = 112 + (i % 2) * 40, base = i < 2 ? 38 : 80, tall = i % 2 === 0, h = tall ? 32 : 22, round = i === 0 || i === 3;
    return <g key={i}><rect x={x} y={base - h} width={22} height={h} rx={round ? 11 : 3} className={i === 3 ? 'd' : 'w'} />{i === 1 ? <circle cx={x + 11} cy={base - h + 7} r={3.5} className="m" /> : null}</g>;
  })}</g>
);
const Yose = () => (
  <g><rect x={110} y={4} width={76} height={76} rx={3} className="hm" />{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${118 + i * 15} 12v60M118 ${12 + i * 15}h60`} className="sm" />)}
    {[[0, 1, 'd'], [1, 2, 'w'], [2, 1, 'd'], [3, 3, 'w'], [2, 3, 'd'], [4, 2, 'w'], [1, 4, 'd'], [3, 0, 'w']].map(([c, r, k], i) => <circle key={i} cx={118 + c * 15} cy={12 + r * 15} r={6} className={k} />)}</g>
);
const Four = () => (
  <g><rect x={105.25} y={10} width={85.5} height={70} rx={6} className="m" />{cells(109.25, 14, 5, 4, 15.5, (x, y, c, r, i) => (
    <circle key={i} cx={x + 7.5} cy={y + 7.5} r={5.6} className={[10, 15, 16, 17, 11].includes(i) ? 'd' : [18, 12, 6].includes(i) ? 'w' : 'w0'} />))}
    <path d="M147.75 -1v7m-4 -4l4 4l4 -4" className="s2" /></g>
);
// ---- Arcade --------------------------------------------------------------
const Snake = () => (
  <g><rect x={110} y={6} width={76} height={72} rx={4} className="w" /><path d="M122 64H148V34H170" className="d6" /><circle cx={172} cy={18} r={5} className="m" /></g>
);
const Blocks = () => (
  <g><rect x={116} y={2} width={64} height={80} rx={4} className="w" />
    {[[120, 64, 'm'], [134, 64, 'm'], [148, 64, 'm'], [162, 64, 'd'], [120, 50, 'm'], [162, 50, 'd'], [148, 50, 'd'], [134, 10, 'd'], [148, 10, 'd'], [148, 24, 'd']].map(([x, y, k], i) => <rect key={i} x={x} y={y} width={13} height={13} rx={2} className={k} />)}</g>
);
const Squash = () => (
  <g>{cells(112, 6, 4, 4, 18, (x, y, c, r, i) => <circle key={i} cx={x + 9} cy={y + 9} r={7} className={[5, 6, 7].includes(i) ? 'd' : (i % 3) ? 'm' : 'w'} />)}
    <path d="M128 15l0 -8" className="s2" /></g>
);
const Simon = () => (
  <g>{[0, 1, 2, 3].map((q) => <path key={q} transform={`rotate(${q * 90} 148 42)`} d="M151 39V7a35 35 0 0 1 32 32z" className={q === 1 ? 'd' : 'm'} />)}<circle cx={148} cy={42} r={11} className="w" /></g>
);
const Sweep = () => (
  <g>{cells(112, 6, 4, 4, 18, (x, y, c, r, i) => {
    const open = [0, 1, 4, 5, 8, 2].includes(i), n = { 1: 1, 5: 2, 8: 1, 2: 1 }[i];
    return <g key={i}><rect x={x} y={y} width={18} height={18} className={open ? 'w' : 'hm'} />{n ? <T x={x + 9} y={y + 13} s={11}>{n}</T> : null}
      {i === 9 ? <path d={`M${x + 6} ${y + 15}v-11l8 3.5l-8 3.5`} className="d" /> : null}</g>;
  })}</g>
);
const Dario = () => (
  <g><path d="M108 74h80" className="s3" /><rect x={140} y={52} width={24} height={7} rx={2} className="m" /><rect x={162} y={32} width={24} height={7} rx={2} className="m" />
    <circle cx={122} cy={60} r={8} className="d" /><path d="M115 54q2 -8 7 -6q5 -4 8 2" className="s2" /><rect x={170} y={10} width={14} height={18} rx={2} className="w" /></g>
);
const Ping = () => (
  <g><circle cx={148} cy={42} r={10} className="sm3" /><circle cx={148} cy={42} r={24} className="sm" /><circle cx={148} cy={42} r={38} className="sm" />
    <circle cx={148} cy={42} r={4} className="d" /><circle cx={176} cy={28} r={4} className="m" /></g>
);

export const TILE_BY_KEY = {
  // Trivia
  sport: Sport, biz: Biz, script: Script, quotes: Quotes, sci: Sci, pulse: Pulse, gene: Gene, orbit: Orbit, eureka: Eureka, bond: Bond,
  foodie: Foodie, art: Art, history: History, streak: Streak, deep: Deep, dating: Dating, extra: Extra, bracket: Bracket, listed: Listed,
  clade: Clade, dossier: Dossier, bacon: Bacon, resume: Resume, filing: Filing, redact: Redact, niche: Niche, potluck: Potluck, mixtape: Mixtape, mishmash: Mishmash,
  focus: Focus, thread: Thread, slot: Slot, circa: Circa, tape: Tape,
  // Geography
  atlas: Atlas, carmen: Carmen, span: Span, passport: Passport, flank: Flank, ping: Ping,
  // Logic
  alibi: Alibi, jester: Jester, judges: Judges, sworn: Sworn, axiom: Axiom, hearsay: Hearsay, stands: Stands, sudoclue: Sudoclue, fib: Fib,
  suffice: Suffice, ergo: Ergo, docket: Docket, venn: Venn, lamps: Lamps, plot: Plot, paths: Paths, snug: Snug, tangled: Tangled, witness: Witness, defuse: Defuse, spot: Spot,
  connect: Connect, mop: Mop, chef: Chef, pack: Pack, duet: Duet, etch: Etch, park: Park, impound: Impound, junkyard: Junkyard, chomp: Chomp, hedge: Hedge, jig: Jig, saw: Saw,
  topple: Topple, roll: Roll, swap: Swap, slide: Slide, spin: Spin,
  // Numbers
  crunch: Crunch, blitz: Blitz, blitzed: Blitzed, gap: Gap, back: Back, calc: Calc, series: Series, sums: Sums, carve: Carve, tally: Tally,
  cipher: Cipher, pricer: Pricer, dealer: Dealer, realtor: Realtor, agent: Agent, curator: Curator, picks: Picks,
  // Crowd Psychology
  outwit: Outwit, outrank: Outrank, feud: Feud, herd: Herd,
  // Word
  crux: Crux, fill: Fill, gram: Gram, stet: Stet, tuck: Tuck, lode: Lode, rung: Rung, anon: Anon, vocab: Vocab, spell: Spell, idiom: Idiom,
  links: Links, hinge: Hinge, babel: Babel, glyph: Glyph, origin: Origin, warmer: Warmer, shards: Shards, strata: Strata, barter: Barter,
  scram: Scram, scour: Scour, emcee: Emcee, encore: Encore, arcos: Arcos, garble: Garble,
  // Cards
  taire: Taire, cell: Cell, crib: Crib, hold: Hold, finesse: Finesse, hands: Hands, pairs: Pairs, mahj: Mahj, shoe: Shoe,
  // End Game
  mate: Mate, check: Check, chain: Chain, defend: Defend, swindle: Swindle, queen: Queen, turn: Turn, gift: Gift, yose: Yose, four: Four,
  // Arcade
  snake: Snake, blocks: Blocks, squash: Squash, simon: Simon, sweep: Sweep, dario: Dario,
};
