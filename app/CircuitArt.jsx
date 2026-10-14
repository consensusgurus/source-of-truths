// CIRCUIT ART (owner, 2026-10-13). One drawing per built run, shown ONLY on the
// home Circuits pane and on My games' starred circuits, never on the pills or
// the phone runs block. Stroke art in currentColor, so the card picks the hue
// (the parent sets --art; see .ca in StageToday). The knockout shapes use the
// .k class, which fills with the band's own ground, so a front card or tag
// reads as sitting on top. Unknown ids draw nothing.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' };
const T = { fill: 'currentColor', fillOpacity: 0.18 };
const TX = { fill: 'currentColor', stroke: 'none', fontFamily: 'Manrope, sans-serif', fontWeight: 800, textAnchor: 'middle' };

const ART = {
  pricecheck: (
    <>
      <path d="M73 60 C56 52 44 34 52 18" />
      <g transform="rotate(-12 120 60)">
        <path d="M84 36 H170 a7 7 0 0 1 7 7 V77 a7 7 0 0 1 -7 7 H84 L60 60 Z" {...T} />
        <circle cx="76" cy="60" r="5" />
        <text x="130" y="72" fontSize="32" {...TX}>$?</text>
      </g>
      <path d="M190 30 h18 M190 44 h12 M190 58 h22" strokeWidth="2.5" opacity=".6" />
    </>
  ),
  gauntlet: (
    <>
      <rect x="70" y="16" width="62" height="78" rx="8" transform="rotate(-14 101 55)" fill="currentColor" fillOpacity=".1" />
      <rect x="88" y="14" width="62" height="78" rx="8" transform="rotate(-4 119 53)" fill="currentColor" fillOpacity=".16" />
      <rect className="k" x="106" y="12" width="62" height="80" rx="8" transform="rotate(7 137 52)" />
      <text x="138" y="66" transform="rotate(7 137 52)" fontSize="38" {...TX}>?</text>
      <g stroke="none" fill="currentColor">
        <circle cx="84" cy="110" r="4" /><circle cx="96" cy="110" r="4" /><circle cx="108" cy="110" r="4" />
        <circle cx="120" cy="110" r="4" opacity=".35" /><circle cx="132" cy="110" r="4" opacity=".35" />
        <circle cx="144" cy="110" r="4" opacity=".35" /><circle cx="156" cy="110" r="4" opacity=".35" />
      </g>
    </>
  ),
  // TRIVIA ENCORE (owner, 2026-10-14): a curtained stage with a question card
  // in the spotlight and three pips for its three quizzes.
  triviaencore: (
    <>
      <path d="M40 14 H200" strokeWidth="4" />
      <path d="M44 16 C54 40 52 70 60 96 M52 16 C60 44 66 66 74 80 C66 84 60 90 60 96" {...T} />
      <path d="M196 16 C186 40 188 70 180 96 M188 16 C180 44 174 66 166 80 C174 84 180 90 180 96" {...T} />
      <path d="M74 80 L98 22 M166 80 L142 22" strokeWidth="1.5" opacity=".35" />
      <rect className="k" x="98" y="34" width="44" height="54" rx="6" />
      <text x="120" y="72" fontSize="30" {...TX}>?</text>
      <path d="M36 98 H204" strokeWidth="3" />
      <g stroke="none" fill="currentColor">
        <circle cx="108" cy="110" r="4" /><circle cx="120" cy="110" r="4" /><circle cx="132" cy="110" r="4" />
      </g>
    </>
  ),
  // MATH GAUNTLET (owner, 2026-10-13): a flash card, the bolt of the trophy
  // (Human Calculator), the operators, and five pips for its five games.
  math: (
    <>
      <rect x="58" y="22" width="112" height="60" rx="9" {...T} />
      <text x="114" y="62" fontSize="26" {...TX}>7×8=?</text>
      <path d="M194 10 L178 44 H191 L183 72 L208 34 H194 L202 10 Z" {...T} />
      <path d="M30 36 h14 M37 29 v14 M28 66 h16" strokeWidth="2.5" opacity=".6" />
      <g stroke="none" fill="currentColor" opacity=".6"><circle cx="36" cy="59" r="2.2" /><circle cx="36" cy="73" r="2.2" /></g>
      <g stroke="none" fill="currentColor">
        <circle cx="90" cy="102" r="4" /><circle cx="102" cy="102" r="4" /><circle cx="114" cy="102" r="4" />
        <circle cx="126" cy="102" r="4" opacity=".35" /><circle cx="138" cy="102" r="4" opacity=".35" />
      </g>
    </>
  ),
  passport: (
    <>
      <rect x="58" y="14" width="74" height="92" rx="7" {...T} />
      <circle cx="95" cy="52" r="19" />
      <ellipse cx="95" cy="52" rx="8" ry="19" />
      <path d="M76 52 H114" />
      <path d="M78 84 H112 M84 94 H106" strokeWidth="2.5" opacity=".7" />
      <g transform="rotate(-16 160 70)">
        <circle cx="160" cy="70" r="29" strokeDasharray="5 4" />
        <circle className="k" cx="160" cy="70" r="21" />
        <text x="160" y="74" fontSize="11" letterSpacing="1.5" {...TX}>ENTRY</text>
      </g>
    </>
  ),
  deduction: (
    <>
      <rect x="58" y="94" width="86" height="12" rx="3" {...T} />
      <g transform="rotate(32 108 72)">
        <rect x="82" y="58" width="54" height="26" rx="5" {...T} />
        <path d="M92 58 V84 M126 58 V84" />
        <rect className="k" x="105" y="4" width="8" height="54" rx="4" />
      </g>
      <path d="M64 84 L56 76 M78 80 V70 M150 84 L158 76" strokeWidth="2.5" />
    </>
  ),
  dojo: (
    <>
      <rect x="84" y="14" width="72" height="72" rx="4" fill="currentColor" fillOpacity=".1" />
      <path d="M108 14 V86 M132 14 V86 M84 38 H156 M84 62 H156" strokeWidth="2" opacity=".7" />
      <g fontSize="14" {...TX}>
        <text x="96" y="31">6</text><text x="144" y="31">1</text><text x="120" y="79">9</text>
      </g>
      <rect x="46" y="44" width="148" height="12" rx="2" fill="currentColor" stroke="none" />
      <path className="ko" d="M114 56 L102 104 L112 108 L122 58 Z" fill="currentColor" strokeWidth="2" />
      <path className="ko" d="M124 56 L140 102 L149 97 L132 56 Z" fill="currentColor" strokeWidth="2" />
      <rect className="ko" x="110" y="39" width="20" height="22" rx="4" fill="currentColor" strokeWidth="2.5" />
    </>
  ),
  room: (
    <>
      <path d="M78 16 H128 a22 22 0 0 1 22 22 V44 a22 22 0 0 1 -22 22 H92 L78 78 V64 a22 22 0 0 1 -22 -20 V38 a22 22 0 0 1 22 -22 Z" fill="currentColor" fillOpacity=".2" />
      <g fill="currentColor" stroke="none"><circle cx="88" cy="41" r="4" /><circle cx="103" cy="41" r="4" /><circle cx="118" cy="41" r="4" /></g>
      <path className="k" d="M146 50 H170 a18 18 0 0 1 18 18 V70 a18 18 0 0 1 -18 18 H178 L180 100 L166 88 H146 a18 18 0 0 1 -18 -18 V68 a18 18 0 0 1 18 -18 Z" />
      <path d="M144 66 H172 M144 76 H164" strokeWidth="2.5" opacity=".7" />
      <rect x="66" y="84" width="54" height="26" rx="13" fill="currentColor" fillOpacity=".1" />
      <path d="M80 97 H106" strokeWidth="2.5" opacity=".6" />
    </>
  ),
  valet: (
    <>
      <circle cx="102" cy="48" r="21" {...T} />
      <circle cx="102" cy="48" r="6" />
      <rect x="122" y="44" width="62" height="9" rx="2" {...T} />
      <path d="M156 53 V62 H163 V57 H170 V63 H177 V53" />
      <path d="M90 66 C84 74 78 76 72 76" />
      <g transform="rotate(10 62 94)">
        <rect className="k" x="44" y="74" width="38" height="42" rx="5" />
        <circle cx="63" cy="82" r="3" />
        <text x="63" y="106" fontSize="15" {...TX}>06</text>
      </g>
    </>
  ),
};

export default function CircuitArt({ id }) {
  const art = ART[id];
  if (!art) return null;
  return (
    <span className="ca" aria-hidden="true">
      <svg viewBox="0 0 240 120" {...S}>{art}</svg>
    </span>
  );
}
