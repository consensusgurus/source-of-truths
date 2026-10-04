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
const audit = (cell, box) => ({ kind: 'audit', cell, ...(box === false ? { box: null } : {}) });

// The one-life trivia runs. The board drains to grey with the last answer on
// it, the verdict line waits, and the colour coming back is the reveal.
const LOCK_LINE = /^(Time ran out|Wrong answer)\./;
const lock = { kind: 'lock', lockMs: 1000, hideText: LOCK_LINE };

export const BEATS = {
  // ---- sweep check: the words tick off in turn, the last a beat behind ----
  barter: { kind: 'words', cell: '.bt-tile' },
  crux: { kind: 'words', cell: '.cl-grid > div' },
  glyph: { kind: 'words', cell: '.gl-cell:not(.blk)' },
  emcee: { kind: 'words', cell: '.mc-cell:not(.mc-blk)' },
  encore: { kind: 'words', cell: '.ec-cell:not(.ec-blk)' },

  // ---- grid audit: rows, then columns, then boxes ----
  suds: audit('.sd-cell'),
  sixes: audit('.sx-cell'),
  knight: audit('.kn-cell'),
  mercury: audit('.mc-cell'),
  cages: audit('.cg-cell'),
  quilt: audit('.ql-cell', false),     // jigsaw regions are not boxes
  sando: audit('.sn-cell'),
  diag: audit('.dg-cell'),
  frame: audit('.fr-cell'),
  rim: audit('.ri-cell'),
  polka: audit('.pk-cell'),
  towers: audit('.tw-cell', false),    // a skyline has no boxes
  whittle: audit('.wh-cell'),

  // ---- path trace ----
  hedge: { kind: 'trace', piece: '.hg-svg line[stroke-width="5"]', dur: 1500 },
  paths: { kind: 'trace', piece: '.pt-svg line[stroke-width="6"]', order: 'x', dur: 1300 },

  // ---- picture reveal ----
  etch: {
    kind: 'reveal', grid: '.et-grid', clue: '.et-clue', zoom: 1.08,
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

  // ---- slow flip: the dealer's hole card, and every card he drew after it ----
  shoe: {
    kind: 'flip',
    target(board) {
      const row = board.querySelector('.sh-felt .sh-row');
      return row ? [...row.querySelectorAll('.sh-card')].slice(1) : [];
    },
    after(board) {
      return [...board.querySelectorAll('.sh-felt .sh-tot')];
    },
  },

  // ---- order settle: each event lands in turn ----
  dating: { kind: 'rows', row: (board, ctx) => ctx.util.listRows(board, 4) },

  // ---- the losing beat, played inside Four's end hold ----
  four: {
    kind: 'loss', piece: '.fr-disc',
    keep(board) { return [...board.querySelectorAll('.fr-disc.lit')]; },
  },
};
