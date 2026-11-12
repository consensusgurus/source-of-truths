import { PUZZLES as SPOT } from '@/app/spot/puzzles';

// The kids Spot boards, read on the server only: the SAME photo pairs and the
// same differences as the grown-up daily (owner, 2026-11-12: "put this on the
// kids page too, same puzzles"). Only boards live by `today` (Eastern) are
// returned, newest first, so a future pair never reaches a browser.
const row = (p) => ({ num: p.num, live: p.live, img: p.img, w: p.w, h: p.h, name: p.name, by: p.by, lic: p.lic, diffs: p.diffs });

export function kidsSpotBoards(today) {
  return SPOT.filter((p) => p.live <= today).map(row).sort((a, b) => (a.live < b.live ? 1 : -1));
}

// The day's board: the pair Spot played on `dateIso`, or the newest live pair
// for a date before Spot existed (the kids archive reaches back to September).
export function kidsSpotDaily(boards, dateIso) {
  return boards.find((b) => b.live === dateIso) || boards[0] || null;
}
