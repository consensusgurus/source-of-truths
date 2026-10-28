// SHARE WITH A MEME (owner, 2026-10-23). The reaction GIFs a finished player
// can send with their result, and the rule that picks one for the moment.
//
// The GIFs live in public/share-gifs/, each scaled to 320 wide with its FULL
// frame kept (owner: "refit the gifs so that the full thing shows", several
// carry their punchline as burned-in text, so nothing is cropped). They were
// pulled from GIPHY. Whether a studio clip may be redistributed this way is an
// open legal question the owner was told about and chose to ship with.
//
// app/MemeShare.jsx renders the sheet; lib/meme-gif.js builds the shareable
// GIF (brag line on top, the clip, the game strip underneath) in the browser.

export const MEMES = {
  curry: { name: 'Night night', src: '/share-gifs/curry.gif' },
  wolf: { name: 'Chest thump', src: '/share-gifs/wolf.gif' },
  mcgregor: { name: 'The strut', src: '/share-gifs/mcgregor.gif' },
  bigdeal: { name: 'Big deal', src: '/share-gifs/bigdeal.gif' },
  lucky: { name: 'Feeling lucky', src: '/share-gifs/lucky.gif' },
  halpert: { name: 'Your move', src: '/share-gifs/halpert.gif' },
  later: { name: 'Years later', src: '/share-gifs/later.gif' },
  skeleton: { name: 'Still waiting', src: '/share-gifs/skeleton.gif' },
  conspiracy: { name: 'The board', src: '/share-gifs/conspiracy.gif' },
  nickyoung: { name: 'Confused', src: '/share-gifs/nickyoung.gif' },
  noplease: { name: 'No, please no', src: '/share-gifs/noplease.gif' },
  hedge: { name: 'Into the hedge', src: '/share-gifs/hedge.gif' },
  blinking: { name: 'Blink', src: '/share-gifs/blinking.gif' },
  truth: { name: 'The truth', src: '/share-gifs/truth.gif' },
  luck: { name: 'Good luck', src: '/share-gifs/luck.gif' },
  rollsafe: { name: 'You smart', src: '/share-gifs/rollsafe.gif' },
  hangover: { name: 'Hangover math', src: '/share-gifs/hangover.gif' },
  cheers: { name: 'Cheers', src: '/share-gifs/cheers.gif' },
  pointing: { name: 'Pointing', src: '/share-gifs/pointing.gif' },
  stopit: { name: 'Stop it', src: '/share-gifs/stopit.gif' },
  anything: { name: 'Anything is possible', src: '/share-gifs/anything.gif' },
  crying: { name: 'Jordan crying', src: '/share-gifs/crying.gif' },
  pikachu: { name: 'Pikachu', src: '/share-gifs/pikachu.gif' },
  fine: { name: 'This is fine', src: '/share-gifs/fine.gif' },
  mathlady: { name: 'Math lady', src: '/share-gifs/mathlady.gif' },
  harvey: { name: 'Survey says', src: '/share-gifs/harvey.gif' },
};

const NUMBERY = new Set(['Numbers', 'Sudoku']);
const CROWD = new Set(['Crowd Psychology']);
const LOGICY = new Set(['Logic', 'Sudoku']);
const TRIVIA = new Set(['Trivia', 'Geography']);

// The templates offered for a result, best fit first. The first one is what
// the sheet opens on.
// The templates offered for a result, best fit first. The first one is what
// the sheet opens on. ctx.slow: a solve slower than today's typical solve.
// ctx.blank: a miss with nothing scored (a give-up).
export function memeOrder({ won, pb, cat, slow, blank }) {
  let list;
  if (!won) list = ['crying', 'nickyoung', 'noplease', 'pikachu', 'fine', 'luck'];
  else if (pb) list = ['cheers', 'luck', 'pointing', 'stopit', 'anything'];
  else list = ['luck', 'pointing', 'stopit', 'anything', 'cheers'];
  if (NUMBERY.has(cat)) list.splice(won ? 2 : 1, 0, 'mathlady');
  if (CROWD.has(cat)) list.splice(1, 0, 'harvey');
  // YOU SMART and HANGOVER MATH come straight after Good luck, in that order
  // (owner, 2026-10-23), on every result.
  list.splice(list.indexOf('luck') + 1, 0, 'rollsafe', 'hangover');
  if (won) {
    // Night night, Big deal, then You can't handle the truth lead every solve
    // (owner, 2026-10-28), Curry the default; the other wins and the two taunts follow. The situational ones follow them.
    const sit = [];
    if (slow) sit.push('later', 'skeleton');
    if (LOGICY.has(cat)) sit.push('conspiracy');
    list = ['curry', 'bigdeal', 'truth', 'wolf', 'mcgregor', 'lucky', 'halpert', ...sit, ...list];
  } else {
    if (TRIVIA.has(cat)) list.splice(1, 0, 'blinking');
    if (blank) list.unshift('hedge');
  }
  return list;
}

// The brag line over the clip. No em dashes (owner's house style).
//   game  display name ("Crux")
//   fig   the game's own figure ("2:14", "47 points", "8/10"), may be ''
//   timed true when fig is a clock
export function memeCaption(key, { game, fig, timed, won, pb }) {
  const did = fig ? (timed ? `solved ${game} in ${fig}` : `scored ${fig} on ${game}`) : `solved ${game}`;
  const Did = did.charAt(0).toUpperCase() + did.slice(1);
  const f = fig ? ` ${fig}.` : '';
  switch (key) {
    case 'curry': return won ? `${Did}. Night night.` : `${game} put me to bed. Night night.`;
    case 'wolf': return won ? `${Did}. Hum along.` : `${game} beat me. Still humming.`;
    case 'mcgregor': return won ? `Walking out after I ${did}.` : `Walking it off after ${game}.`;
    case 'bigdeal': return won ? `I ${did}. I'm kind of a big deal.` : `${game} won today. Still kind of a big deal.`;
    case 'lucky': return won ? `${Did}. Do you feel lucky?` : `${game} got me. Feeling lucky?`;
    case 'halpert': return won ? `${Did}. Your move.` : `${game} won today. Your move.`;
    case 'later': return won ? `${Did}. Eventually.` : `${game}, several hours later.`;
    case 'skeleton': return won ? `Still waiting for someone to beat my ${game}.` : `Still waiting to crack ${game}.`;
    case 'conspiracy': return won ? `Me cracking ${game}.${f}` : `Me working out ${game}.`;
    case 'nickyoung': return won ? `${Did}? How?` : `${game} today.`;
    case 'noplease': return won ? `You, trying to beat my ${game}.` : `Me when ${game} ended.`;
    case 'hedge': return won ? `Me after I ${did}.` : `Me backing away from ${game}.`;
    case 'blinking': return won ? `Me after I ${did}.` : `Me when ${game} showed the answer.`;
    case 'truth': return won ? `My ${game} ${timed ? 'time' : 'score'}? You can't handle the truth.${f}` : `${game} won today. I can't handle the truth.`;
    case 'luck': return won ? `I don't know who you are. But I ${did}.` : `${game} beat me. You're next. Good luck.`;
    case 'cheers': return pb ? `My best ${game} yet.${f}` : `To a clean ${game}.${f}`;
    case 'pointing': return `When you see my ${game} ${timed ? 'time' : 'score'}.${f}`;
    case 'rollsafe': return won ? `Can't lose at ${game} if you ${timed ? `solve it in ${fig}` : (fig ? `score ${fig}` : 'solve it')}.` : `Can't lose at ${game} if you never finish it.`;
    case 'hangover': return won ? `Me doing ${game} in my head.${f}` : `Me working out where ${game} went wrong.`;
    case 'stopit': return `${Did}. Beat that.`;
    case 'anything': return won ? `Down to the wire. ${Did}.` : `${game} today. Anything is possible tomorrow.`;
    case 'crying': return `${game} beat me today.`;
    case 'pikachu': return won ? `Me after I ${did}.` : 'I was so sure about that last one.';
    case 'fine': return won ? `${Did}. Totally calm.` : `${game} went sideways. This is fine.`;
    case 'mathlady': return won ? `Me working out ${game}.${f}` : `Me working out ${game}.`;
    case 'harvey': return fig ? `Survey says: ${fig} on ${game}.` : `Survey says: I played ${game}.`;
    default: return Did;
  }
}
