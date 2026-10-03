// scripts/audit-focus-frames.js — does each Focus day's opening frame show anything?
//
// NOT a node script. The sandbox cannot reach Wikimedia, so this runs in a
// browser: open any commons.wikimedia.org page, paste ROWS (from
// app/focus/puzzles.js, as [num, t, fx, fy]) and then this file into the
// console. It reproduces FocusClient exactly (square window, cover fit, scale
// about the focal point as a percentage of the square) and measures the
// luminance of frames 1 to 3.
//
// BLANK = a frame whose deviation is under 3, or that is near-white or
// near-black with deviation under 8. A blank frame reads to a player as a
// broken image, which is exactly what Mount Fuji (#33, 2026-10-03) did: its
// focal point sat on the snowcap and frames 1 to 3 were solid white. A flat
// but COLOURED frame (Mars orange, Neptune blue) is allowed: the owner's rule
// for frame 1 is "a discernible colouration difference and nothing more".
//
// Fix a BLANK row by moving fx/fy (never the photo), re-run, then raise
// FRAMES_AUDITED_THROUGH in scripts/verify-focus.mjs.
(async () => {
  const ZOOM = [9, 6, 4];
  const one = ([n, t, fx, fy]) => new Promise((res) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    const to = setTimeout(() => res({ n, err: 'timeout' }), 25000);
    im.onerror = () => { clearTimeout(to); res({ n, err: 'load failed: check the title' }); };
    im.onload = () => {
      clearTimeout(to);
      const W = im.naturalWidth, H = im.naturalHeight, c = 1 / Math.min(W, H);
      const ox = (1 - W * c) / 2, oy = (1 - H * c) / 2;
      const ox2 = Math.round(fx * 100) / 100, oy2 = Math.round(fy * 100) / 100;
      const f = ZOOM.map((z) => {
        const s = 1 / z, ex0 = ox2 * (1 - s), ey0 = oy2 * (1 - s);
        const cv = document.createElement('canvas'); cv.width = cv.height = 48;
        const g = cv.getContext('2d');
        g.drawImage(im, (ex0 - ox) / c, (ey0 - oy) / c, s / c, s / c, 0, 0, 48, 48);
        const d = g.getImageData(0, 0, 48, 48).data;
        let m = 0, m2 = 0; const N = 48 * 48;
        for (let i = 0; i < d.length; i += 4) { const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; m += L; m2 += L * L; }
        m /= N; return [Math.round(m), Math.round(Math.sqrt(Math.max(0, m2 / N - m * m)) * 10) / 10];
      });
      const blank = f.slice(0, 2).some(([m, sd]) => sd < 3 || ((m > 235 || m < 20) && sd < 8));
      res({ n, f, blank });
    };
    im.src = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(t) + '?width=1000';
  });
  const out = [];
  for (const r of ROWS) out.push(await one(r));
  const badRows = out.filter((r) => r.err || r.blank);
  console.table(out.map((r) => ({ n: r.n, f1: r.f && r.f[0].join('/'), f2: r.f && r.f[1].join('/'), f3: r.f && r.f[2].join('/'), verdict: r.err || (r.blank ? 'BLANK' : 'ok') })));
  console.log(badRows.length ? `✗ ${badRows.length} row(s) need a new focal point: ${badRows.map((r) => '#' + r.n).join(', ')}` : `✓ ${out.length} rows, every opening frame shows something`);
})();
