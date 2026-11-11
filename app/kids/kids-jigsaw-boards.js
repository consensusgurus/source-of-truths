import { PUZZLES as JIG } from '@/app/jig/puzzles';
import { PUZZLES as SAW } from '@/app/saw/puzzles';

// The kids jigsaw boards, read on the server only: every Jig and Saw photo
// live by `today` (Eastern), newest first, each tagged with its game, shape
// and photo route. Nothing that is not live yet is returned, and the Commons
// file title (`t`) never reaches the client.
const row = (g, p) => ({
  key: `${g}-${p.num}`, g, num: p.num, live: p.live, name: p.name, by: p.by, lic: p.lic,
  tall: g === 'saw', img: g === 'saw' ? '/api/saw/img' : '/api/jig/img',
});

export function kidsJigsawBoards(today) {
  return [...JIG.filter((p) => p.live <= today).map((p) => row('jig', p)), ...SAW.filter((p) => p.live <= today).map((p) => row('saw', p))]
    .sort((a, b) => (a.live === b.live ? (a.g === 'jig' ? -1 : 1) : a.live < b.live ? 1 : -1));
}

// The day's board for one game: the photo that game played on `dateIso`, or
// its newest live photo when that game had not started yet on that date.
export function kidsJigsawDaily(boards, g, dateIso) {
  const mine = boards.filter((b) => b.g === g);
  return mine.find((b) => b.live === dateIso) || mine[0] || null;
}
