// THE FINISH BEATS, per game. Read by lib/finish-beat.js, which owns the kinds
// and every word of reasoning behind them; this file only says which kind a
// game plays and where on ITS board the pieces are.
//
// KEYED BY REGISTRY KEY (lib/daily-games.js), never by route: /parker is
// `park`, /jesters is `jester`. A game with no entry still gets the plain
// beat, so leaving a game out is safe and never breaks anything.
//
// Selectors name classes the clients already render. If a client renames one,
// its beat quietly falls back to the plain pulse rather than erroring, so after
// renaming a board class check its beat here (window.__sotBeat('<key>') on a
// live board plays it without ending the game).

// The nine sudokus share one entry each: their cells all carry `<xx>-cell`,
// and the gutter clues of Sando, Frame, Rim and Towers carry other classes.
// From 2026-10-10 they play RIPPLE AND LOCK as their last beat before the iris
// (lib/finish-beat.js `ripple`); `audit` stays for any grid that wants it.
const grid = (cell, box) => ({ kind: 'ripple', last: true, cell, ...(box === false ? { box: null } : {}) });
// The crosswords ripple too (owner, 2026-10-10), with no boxes to lock.
const xword = (cell) => ({ kind: 'ripple', last: true, cell, box: null });

// The one-life trivia runs. The board drains to grey with the last answer on
// it, the verdict line waits, and the colour coming back is the reveal.
const LOCK_LINE = /^(Time ran out|Wrong answer)\./;
const lock = { kind: 'lock', lockMs: 1000, hideText: LOCK_LINE };

export const BEATS = {
  // ---- sweep check: the words tick off in turn, the last a beat behind ----
  // (2026-10-10: Crux flips its words in like a departures board; the other
  // crosswords ripple out from the last square like the sudokus.)
  barter: xword('.bt-tile'),
  crux: { kind: 'flap', last: true, cell: '.cl-grid > div' },
  glyph: xword('.gl-cell:not(.blk)'),
  emcee: xword('.mc-cell:not(.mc-blk)'),
  encore: xword('.ec-cell:not(.ec-blk)'),

  // ---- lamplight: the passage fills with light, then the author's initials ----
  anon: {
    kind: 'lamp', last: true, board: '.an-wrap', cell: '.an-quote .an-cell',
    spine(board) {
      return [...board.querySelectorAll('.an-row')]
        .filter((row) => row.querySelector('.an-tag'))
        .map((row) => row.querySelector('.an-boxes > *'))
        .filter(Boolean);
    },
  },

  // ---- exit: the red block drives out of the gate (all three jam lots) ----
  park: { kind: 'exit', last: true, piece: '.pk-blk', lot: '.pk-lot' },
  impound: { kind: 'exit', last: true, piece: '.pk-blk', lot: '.pk-lot' },
  junkyard: { kind: 'exit', last: true, piece: '.pk-blk', lot: '.pk-lot' },

  // ---- lock and burst: box by box, an orbit while the stats load, then the
  // tiles burst into the curtain (owner, 2026-10-05). The audit kind stays in
  // lib/finish-beat.js for any grid that wants the quieter ending. ----
  suds: grid('.sd-cell'),
  sixes: grid('.sx-cell'),
  knight: grid('.kn-cell'),
  mercury: grid('.mc-cell'),
  cages: grid('.cg-cell'),
  quilt: grid('.ql-cell', false),     // jigsaw regions are not boxes
  sando: grid('.sn-cell'),
  diag: grid('.dg-cell'),
  frame: grid('.fr-cell'),
  rim: grid('.ri-cell'),
  polka: grid('.pk-cell'),
  // Towers rises as a skyline and the light finds what each clue sees (2026-10-10).
  towers: { kind: 'skyline', last: true, cell: '.tw-cell', clue: '.tw-clue' },
  whittle: grid('.wh-cell'),

  // ---- path trace ----
  // Hedge runs a current round its loop and fills it (2026-10-10).
  hedge: { kind: 'current', last: true, piece: '.hg-svg line[stroke-width="5"]', dur: 1500 },
  paths: { kind: 'trace', piece: '.pt-svg line[stroke-width="6"]', order: 'x', dur: 1300 },

  // ---- picture reveal ----
  etch: {
    kind: 'darkroom', last: true, grid: '.et-grid', clue: '.et-clue', cellClass: 'et-cell', zoom: 1.07,
    // A filled square is painted ink inline; read its lightness rather than a
    // class, because the client gives filled squares no class of their own.
    filled(el) {
      if (!el.classList.contains('et-cell')) return false;
      const m = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
      if (!m) return false;
      const [r, g, b, a] = m.map(Number);
      if (a === 0) return false;
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.35;
    },
  },

  // ---- letters home: each finale letter flies back to the word it came from ----
  garble: {
    kind: 'fly', board: '.stage-page',
    pairs() {
      return [...document.querySelectorAll('[data-gbank]')].map((b) => [b, document.querySelector(`[data-gcell="${b.getAttribute('data-gbank')}"]`)]);
    },
    lightRow(dst) {
      const row = (dst.getAttribute('data-gcell') || '').split('-')[0];
      return [...document.querySelectorAll(`[data-gcell^="${row}-"]`)];
    },
  },

  // ---- lock in ----
  atlas: lock,
  sport: lock,
  biz: lock,
  streak: lock,
  deep: lock,
  blitz: lock,
  blitzed: lock,
  gap: lock,
  series: lock,
  back: lock,

  // ---- cascade: the cards leap off the table and bounce away (2026-10-10) ----
  shoe: { kind: 'cascade', last: true, card: '.sh-card' },
  crib: { kind: 'cascade', last: true, card: '.cb-card' },
  hands: { kind: 'cascade', last: true, card: '.hd-cell' },
  taire: { kind: 'cascade', last: true, card: '.ta-card' },

  // ---- the second batch of last beats (2026-10-10) ----
  // Lamps: each lamp switches on and its light runs to the walls.
  lamps: {
    kind: 'switchon', last: true, cell: '.lm-cell',
    role(el) {
      const a = el.getAttribute('aria-label') || '';
      if (/, wall, \d/.test(a)) return 'num';
      if (/, wall/.test(a)) return 'wall';
      if (/, lamp/.test(a)) return 'lamp';
      return 'lit';
    },
  },
  // Duet and Turn: every token flips over, then the lines read out.
  duet: { kind: 'coinflip', last: true, cell: '.du-cell' },
  turn: { kind: 'coinflip', last: true, cell: '.tn-sq', token: '.tn-disc' },
  // Snug, Plot, Carve: the pieces drop in turn and snap into one board.
  snug: { kind: 'snap', last: true, cell: '.sg-cell:not(.void)' },
  plot: { kind: 'snap', last: true, cell: '.pl-plot', group: (el) => el },
  carve: { kind: 'snap', last: true, cell: '.cv-cell' },
  // Mate and Queen: the beaten king topples.
  mate: { kind: 'topple', last: true, cell: '.mt-sq', piece: '.mt-pc', victim: (el) => /black K$/.test(el.getAttribute('aria-label') || ''), word: 'CHECKMATE' },
  queen: { kind: 'topple', last: true, cell: '.qn-sq', piece: '.qn-pc', victim: (el) => /black K$/.test(el.getAttribute('aria-label') || '') },
  // Rung and Hinge: a light climbs the ladder word by word.
  // The ladder scrolls inside its own box with the goal and start pinned, so
  // only the rungs actually in view climb (a scrolled-out rung would light up
  // over the page header).
  rung: {
    kind: 'climb', last: true,
    rows(b) {
      const box = b.querySelector('.rg-ladder');
      const all = [...b.querySelectorAll('.rg-row')];
      if (!box) return all.map((r) => [...r.querySelectorAll('.rg-tile')]);
      const v = box.getBoundingClientRect();
      const pins = all.filter((r) => /rg-stick-/.test(r.className)).map((r) => r.getBoundingClientRect());
      const top = Math.max(v.top, ...pins.filter((q) => q.top < v.top + v.height / 2).map((q) => q.bottom));
      const bot = Math.min(v.bottom, ...pins.filter((q) => q.top >= v.top + v.height / 2).map((q) => q.top));
      return all.filter((r) => {
        const q = r.getBoundingClientRect();
        if (/rg-stick-/.test(r.className)) return q.height > 0;
        return q.top >= top - 1 && q.bottom <= bot + 1;
      }).sort((x, y) => x.getBoundingClientRect().top - y.getBoundingClientRect().top)
        .map((r) => [...r.querySelectorAll('.rg-tile')]);
    },
  },
  hinge: { kind: 'climb', last: true, changed: false, rows: (b) => [...b.querySelectorAll('.hg-word')].map((r) => [...r.querySelectorAll('.hg-cell')]) },
  // Jesters and Judges: a crown drops on every seat, then each court floods.
  jester: { kind: 'crowning', last: true, cell: '.je-cell', seat: (el) => /: jester/.test(el.getAttribute('aria-label') || '') },
  judges: { kind: 'crowning', last: true, cell: '.je-cell', seat: (el) => /: judges/.test(el.getAttribute('aria-label') || '') },

  // ---- order settle: each event lands in turn ----
  dating: { kind: 'rows', row: (board, ctx) => ctx.util.listRows(board, 4) },

  // ---- the losing beat, played inside Four's end hold ----
  // On a WIN (the board carries .won) it plays GRAVITY instead: the winning
  // four glow, a beam cuts through them, every other disc falls (2026-10-10).
  four: {
    kind: 'loss', piece: '.fr-disc',
    keep(board) { return [...board.querySelectorAll('.fr-disc.lit')]; },
    isWin(board) { return !!board.querySelector('.fr-board[data-out="won"]'); },
    win: { kind: 'gravity', last: true },
  },
};

// THE MISSES, for the losing beat (lib/finish-beat.js playLoss). A game listed
// here names the squares the player did NOT get; any other game with a `cell`
// above falls back to its EMPTY cells, which is right for every crossword and
// sudoku. A game with neither simply settles, which is never wrong.
export const LOSS_MISSES = {
  // Barter's tiles are never empty: a miss is any tile not yet home.
  barter: (board) => [...board.querySelectorAll('.bt-tile')].filter((el) => el.getAttribute('data-home') !== '1' && (el.textContent || '').trim()),
};
